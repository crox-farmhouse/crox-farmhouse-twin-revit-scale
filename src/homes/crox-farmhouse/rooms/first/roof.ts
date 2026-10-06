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

function tagHighLodDetail(mesh: THREE.Mesh): void {
  mesh.userData.lodTier = 'high';
  mesh.userData.lodMaxDistance = 12;
}

/**
 * First-floor ceilings, L-plan Welsh slate roof and chimneys.
 */
export function buildFirstFloorCeilingsAndRoof(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'exteriorBrickMat' | 'stoneSillMat' | 'upperWallTopY'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'applyWorldSpaceBrickUVs'>,
  eastWingCtx: SceneBuilderContext = ctx
): void {
  const { ceilingMeshGroup } = ctx;
  const ewCeilingMeshGroup = eastWingCtx.ceilingMeshGroup;
  const {
    applyWorldSpaceBrickUVs,
    exteriorBrickMat,
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
  const upperCeilingMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.88,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
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
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, upperCeilingMat);
    mesh.name = name;
    mesh.userData.isArchitecturalShell = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    targetGroup.add(mesh);
    return mesh;
  };

  // Issue #5, #9 & Issue #1: Vaulted East Wing Ceilings:
  // 1) Upper Landing & Family Bathroom (`X = -17.90m..-9.68m`): pitches from `Y = 4.16m` at the eaves (`Z = -2.54m / +2.44m`)
  //    up to the `4.52m` horizontal collar ceiling (`Z = -1.15m..+1.05m`).
  // 2) Main Bedroom (`X = -9.56m..-4.52m`): pitches higher into the roof space up to `mainBedCollarCeilingY = 5.02m`
  //    (`Z = -0.60m..+0.50m`), providing a lofty 2.68m floor-to-ceiling height above the stepped-up 2.34m Main Bedroom floor!
  {
    const mainBedWestWallX = -9.68;
    const mainBedInnerWestX = -9.56;
    const eastWallX = -4.52;
    const collarCeilingY = 4.52;
    const collarNorthZ = -1.15;
    const collarSouthZ = 1.05;
    const mainBedCollarCeilingY = 5.02;
    const mainBedCollarNorthZ = -1.15;
    const mainBedCollarSouthZ = 1.05;
    const northPitchBaseZ = -2.54;
    const southPitchBaseZ = 2.44;
    const xWestAtZ = (z: number): number =>
      -17.55 + ((z - -2.5) / (2.68 - -2.5)) * (-17.92 - -17.55) - 0.04;

    // 1A. Upper Landing & Family Bathroom — North pitched skeiling (`Z = -2.54m, Y = 4.16m -> Z = -1.15m, Y = 4.52m`)
    buildVaultedCeilingQuad(
      'eastWing.vaultedCeiling.northSkeiling',
      new THREE.Vector3(xWestAtZ(northPitchBaseZ), upperWallTopY, northPitchBaseZ),
      new THREE.Vector3(mainBedWestWallX, upperWallTopY, northPitchBaseZ),
      new THREE.Vector3(mainBedWestWallX, collarCeilingY, collarNorthZ),
      new THREE.Vector3(xWestAtZ(collarNorthZ), collarCeilingY, collarNorthZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 1B. Upper Landing & Family Bathroom — Central horizontal collar ceiling (`Y = 4.52m, Z = -1.15m..+1.05m`)
    buildVaultedCeilingQuad(
      'eastWing.vaultedCeiling.collar',
      new THREE.Vector3(xWestAtZ(collarNorthZ), collarCeilingY, collarNorthZ),
      new THREE.Vector3(mainBedWestWallX, collarCeilingY, collarNorthZ),
      new THREE.Vector3(mainBedWestWallX, collarCeilingY, collarSouthZ),
      new THREE.Vector3(xWestAtZ(collarSouthZ), collarCeilingY, collarSouthZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 1C. Upper Landing & Family Bathroom — South pitched skeiling (`Z = +1.05m, Y = 4.52m -> Z = +2.44m, Y = 4.16m`)
    buildVaultedCeilingQuad(
      'eastWing.vaultedCeiling.southSkeiling',
      new THREE.Vector3(xWestAtZ(collarSouthZ), collarCeilingY, collarSouthZ),
      new THREE.Vector3(mainBedWestWallX, collarCeilingY, collarSouthZ),
      new THREE.Vector3(mainBedWestWallX, upperWallTopY, southPitchBaseZ),
      new THREE.Vector3(xWestAtZ(southPitchBaseZ), upperWallTopY, southPitchBaseZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 2A. Main Bedroom — High North pitched skeiling (`Z = -2.54m, Y = 4.16m -> Z = -1.15m, Y = 5.02m`)
    buildVaultedCeilingQuad(
      'mainBedroom.vaultedCeiling.northSkeiling',
      new THREE.Vector3(mainBedInnerWestX, upperWallTopY, northPitchBaseZ),
      new THREE.Vector3(eastWallX, upperWallTopY, northPitchBaseZ),
      new THREE.Vector3(eastWallX, mainBedCollarCeilingY, mainBedCollarNorthZ),
      new THREE.Vector3(mainBedInnerWestX, mainBedCollarCeilingY, mainBedCollarNorthZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 2B. Main Bedroom — High central horizontal collar ceiling (`Y = 5.02m, Z = -1.15m..+1.05m`)
    buildVaultedCeilingQuad(
      'mainBedroom.vaultedCeiling.collar',
      new THREE.Vector3(mainBedInnerWestX, mainBedCollarCeilingY, mainBedCollarNorthZ),
      new THREE.Vector3(eastWallX, mainBedCollarCeilingY, mainBedCollarNorthZ),
      new THREE.Vector3(eastWallX, mainBedCollarCeilingY, mainBedCollarSouthZ),
      new THREE.Vector3(mainBedInnerWestX, mainBedCollarCeilingY, mainBedCollarSouthZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 2C. Main Bedroom — High South pitched skeiling (`Z = +1.05m, Y = 5.02m -> Z = +2.44m, Y = 4.16m`)
    buildVaultedCeilingQuad(
      'mainBedroom.vaultedCeiling.southSkeiling',
      new THREE.Vector3(mainBedInnerWestX, mainBedCollarCeilingY, mainBedCollarSouthZ),
      new THREE.Vector3(eastWallX, mainBedCollarCeilingY, mainBedCollarSouthZ),
      new THREE.Vector3(eastWallX, upperWallTopY, southPitchBaseZ),
      new THREE.Vector3(mainBedInnerWestX, upperWallTopY, southPitchBaseZ),
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
    // Parallel collar East edge offset West so eastSkeiling is a 100% planar slope staying underneath the North-East roof slope (Issue #1 & #7!):
    const collarEastNorthX = -18.58;
    const collarEastSouthX = -19.15;

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
      collarCeilingY + 0.03,
      0.03,
      upperCeilingMat,
      0.5
    );
    collarSlab.name = 'bedroom2.vaultedCeiling.collar';
    collarSlab.userData.isArchitecturalShell = true;
    collarSlab.geometry.computeBoundingSphere();

    // 3. Planar East pitched skeiling slope (`Y = 5.02m` -> actual East cross-wall at `Y = 4.16m`, meeting North wall at `zNorthAtX(-16.876)` — Issue #4!)
    buildVaultedCeilingQuad(
      'bedroom2.vaultedCeiling.eastSkeiling',
      new THREE.Vector3(collarEastNorthX, collarCeilingY, zNorthAtX(collarEastNorthX)),
      new THREE.Vector3(-16.876, skeilingBaseY, zNorthAtX(-16.876)),
      new THREE.Vector3(-17.625, skeilingBaseY, 1.05),
      new THREE.Vector3(collarEastSouthX, collarCeilingY, 1.05)
    );
  }

  // Flat 4.16m ceiling over the Cut-Out Hallway, central Shower Room & West Wing Corridor (`Z = 1.05m..8.27m`)
  // (Carves out Bedroom 3 along the interior faces `X = -20.175m`, `Z = 4.775m`, `X = -18.325m` so it never penetrates Bedroom 3's full-height walls — Issue #6!)
  {
    const [landingSouthWestX, , landingSouthWestZ] = transformEastWingTuple(-18.04, 0, 2.688);
    const [landingSouthEastX, , landingSouthEastZ] = transformEastWingTuple(-16.956, 0, 2.688);
    const corridorCeilingSlab = buildPolygonalFloorSlab(
      ceilingMeshGroup,
      [
        [-22.32, 1.905],
        [-18.92, 2.34],
        [-18.92, 1.05],
        [-17.65, 1.05],
        [landingSouthWestX, landingSouthWestZ],
        [landingSouthEastX, landingSouthEastZ],
        [-17.09, 8.27],
        [-18.325, 8.27],
        [-18.325, 4.775],
        [-20.175, 4.775],
        [-20.175, 4.025],
        [-22.32, 4.025],
      ],
      upperWallTopY + 0.027,
      0.03,
      upperCeilingMat,
      0.5
    );
    corridorCeilingSlab.name = 'roof.westWingCorridor.ceilingSlab';
    corridorCeilingSlab.userData.isArchitecturalShell = true;
    corridorCeilingSlab.geometry.computeBoundingSphere();
  }

  // Issue #15 & Issue #1: Partially Vaulted Ceiling over Bedroom 3 (`X = -22.19m..-18.475m, Z = 4.175m/4.925m..8.15m`)
  // Pitches up from the West interior wall face (`X = -22.19m, Y = 4.16m`) and East corridor interior wall face (`X = -18.475m, Y = 4.16m`)
  // to a raised horizontal collar ceiling at `collarCeilingY = 5.02m` (`X = -20.85m..-18.95m`) with flush 5.02m underside!
  {
    const collarCeilingY = 5.02;
    const skeilingBaseY = upperWallTopY; // 4.16m
    const westInnerWallX = -22.19;
    const collarWestX = -20.85;
    const collarEastX = -18.95;
    const eastInnerWallX = -18.475;
    const zAlcoveNorth = 4.175;
    const zShowerSouth = 4.925;
    const zBed3South = 8.15;

    // 1. West pitched skeiling slope (`X = -22.19m..-20.85m, Z = 4.175m..8.15m`)
    buildVaultedCeilingQuad(
      'bedroom3.vaultedCeiling.westSkeiling',
      new THREE.Vector3(westInnerWallX, skeilingBaseY, zAlcoveNorth),
      new THREE.Vector3(collarWestX, collarCeilingY, zAlcoveNorth),
      new THREE.Vector3(collarWestX, collarCeilingY, zBed3South),
      new THREE.Vector3(westInnerWallX, skeilingBaseY, zBed3South)
    );

    // 2. Central L-shaped raised horizontal collar ceiling (`Y = 5.02m` underside over NW wardrobe alcove + main bedroom)
    const bed3CollarSlab = buildPolygonalFloorSlab(
      ceilingMeshGroup,
      [
        [collarWestX, zAlcoveNorth],
        [-20.325, zAlcoveNorth],
        [-20.325, zShowerSouth],
        [collarEastX, zShowerSouth],
        [collarEastX, zBed3South],
        [collarWestX, zBed3South],
      ],
      collarCeilingY + 0.03,
      0.03,
      upperCeilingMat,
      0.5
    );
    bed3CollarSlab.name = 'bedroom3.vaultedCeiling.collar';
    bed3CollarSlab.userData.isArchitecturalShell = true;
    bed3CollarSlab.geometry.computeBoundingSphere();

    // 3. East pitched skeiling slope (`X = -18.95m, Y = 5.02m` -> `X = -18.475m, Y = 4.16m` across `Z = 4.925m..8.15m`)
    buildVaultedCeilingQuad(
      'bedroom3.vaultedCeiling.eastSkeiling',
      new THREE.Vector3(collarEastX, collarCeilingY, zShowerSouth),
      new THREE.Vector3(eastInnerWallX, skeilingBaseY, zShowerSouth),
      new THREE.Vector3(eastInnerWallX, skeilingBaseY, zBed3South),
      new THREE.Vector3(collarEastX, collarCeilingY, zBed3South)
    );
  }

  // Issue #6 & Issue #7: Partially Vaulted Ceiling over Bedroom 4 (`Z = 8.25m..11.66m`, zero flat side strips!)
  // Pitches directly from the West exterior wall (`X = -22.25m, Y = 4.16m`) and East courtyard wall (`Y = 4.16m`)
  // up to the raised central horizontal collar ceiling at `collarCeilingY = 5.02m` (`X = -20.85m..-18.62m`, aligned with `door_1` / `door_2` boundary)!
  {
    const collarCeilingY = 5.02;
    const skeilingBaseY = upperWallTopY; // 4.16m
    const westWallX = -22.25;
    const collarWestX = -20.85;
    const collarEastX = -18.62;
    const zNorth = 8.25;
    const zSouth = 11.66;

    // 1. West pitched skeiling slope (`X = -22.25m, Y = 4.16m` -> `X = -20.85m, Y = 5.02m`)
    buildVaultedCeilingQuad(
      'bedroom4.vaultedCeiling.westSkeiling',
      new THREE.Vector3(westWallX, skeilingBaseY, zNorth),
      new THREE.Vector3(collarWestX, collarCeilingY, zNorth),
      new THREE.Vector3(collarWestX, collarCeilingY, zSouth),
      new THREE.Vector3(westWallX, skeilingBaseY, zSouth)
    );

    // 2. Central raised horizontal collar ceiling (`X = -20.85m..-18.62m, Y = 5.02m`)
    buildVaultedCeilingQuad(
      'bedroom4.vaultedCeiling.collar',
      new THREE.Vector3(collarWestX, collarCeilingY, zNorth),
      new THREE.Vector3(collarEastX, collarCeilingY, zNorth),
      new THREE.Vector3(collarEastX, collarCeilingY, zSouth),
      new THREE.Vector3(collarWestX, collarCeilingY, zSouth)
    );

    // 3. East pitched skeiling slope (`X = -18.62m, Y = 5.02m` -> East courtyard wall at `Y = 4.16m`)
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
    name: string,
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
    geo.computeBoundingSphere();

    const mesh = new THREE.Mesh(geo, slateRoofMat);
    mesh.name = name;
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
  const northGableZ = -3.75124;
  const northGableRidgeZ = -3.36329;
  const southGableZ = 11.95;

  const ewRidgeZ = -0.05;
  const ewNorthEaveZ = -3.0;
  const ewSouthEaveZ = 2.9;
  const ewEastGableX = -4.4;
  // Local East-West X where the East-West ridge (z_ew = -0.05) meets the North-South ridge (world X = -19.79m)
  const ewRidgeJunctionLocalX = -20.162;
  // Local East-West X where the East-West South eave (z_ew = 2.90m) meets the angled East Courtyard eave (0.22m East of the brick wall)
  const ewCourtyardValleyLocalX = -16.435;
  // Local East-West X where the East-West North eave (z_ew = -3.00m) meets the North-East Gable eave at exact world X = eastEaveX = -16.890m (Issues #5 & #6!)
  const ewNorthValleyLocalX = -17.630852;
  const ewNorthGableRidgeLocalX = -20.556686;
  const ewNorthGableWestLocalX = -23.482521;

  // Key 3D Roof Junction Points (transformed from East-West Wing local frame into world space):
  const pRidgeJunction = transformEastWingPoint(ewRidgeJunctionLocalX, ridgeY, ewRidgeZ);
  const pRidgeEastGable = transformEastWingPoint(ewEastGableX, ridgeY, ewRidgeZ);
  const pRidgeNorthGable = transformEastWingPoint(ewNorthGableRidgeLocalX, ridgeY, ewNorthEaveZ);
  const pRidgeSouthGable = new THREE.Vector3(nsRidgeX, ridgeY, southGableZ);

  const pCourtyardValleyEave = transformEastWingPoint(ewCourtyardValleyLocalX, eaveY, ewSouthEaveZ);
  const pNorthValleyEave = transformEastWingPoint(ewNorthValleyLocalX, eaveY, ewNorthEaveZ);
  const pEastGableSouthEave = transformEastWingPoint(ewEastGableX, eaveY, ewSouthEaveZ);
  const pEastGableNorthEave = transformEastWingPoint(ewEastGableX, eaveY, ewNorthEaveZ);

  // 1. East-West Wing — South (Courtyard) Slate Slope (Trapezoid from Courtyard Valley to East Gable)
  createCoplanarRoofQuadMesh(
    'roof.eastWing.southCourtyardSlope',
    pRidgeJunction,
    pRidgeEastGable,
    pEastGableSouthEave,
    pCourtyardValleyEave,
    slateThick
  );

  // 2. East-West Wing — North Slate Slope (Trapezoid from East Gable to North Valley)
  createCoplanarRoofQuadMesh(
    'roof.eastWing.northSlope',
    pRidgeEastGable,
    pRidgeJunction,
    pNorthValleyEave,
    pEastGableNorthEave,
    slateThick
  );

  // 3. North-South Front Wing — West Front Slate Slope (Full Rectangle from North Gable to South Gable)
  createCoplanarRoofQuadMesh(
    'roof.westWing.westFrontSlope',
    pRidgeNorthGable,
    pRidgeSouthGable,
    new THREE.Vector3(westEaveX, eaveY, southGableZ),
    new THREE.Vector3(westEaveX, eaveY, northGableZ),
    slateThick
  );

  // 4. North-South Front Wing — East Courtyard Slate Slope (Trapezoid from South Gable to Courtyard Valley)
  createCoplanarRoofQuadMesh(
    'roof.westWing.eastCourtyardSlope',
    pRidgeSouthGable,
    pRidgeJunction,
    pCourtyardValleyEave,
    new THREE.Vector3(eastEaveX, eaveY, southGableZ),
    slateThick
  );

  // 5. North-South Front Wing — North-East Gable Slate Slope (Triangle from Valley Junction to North Gable)
  createCoplanarRoofQuadMesh(
    'roof.westWing.northEastGableSlope',
    pRidgeJunction,
    pRidgeNorthGable,
    pNorthValleyEave,
    pNorthValleyEave,
    slateThick
  );

  // Shared-BufferGeometry Timber Roof Rafters inside the upper ridge void (`Y = 5.10m..5.65m`, completely enclosed between collar ceiling and slate roof)
  {
    const roofTimberMat = new THREE.MeshStandardMaterial({
      color: 0x8f6b47,
      roughness: 0.56,
      metalness: 0.04,
    });
    const sharedRoofRafterGeo = new THREE.BoxGeometry(0.075, 0.11, 1.15);
    sharedRoofRafterGeo.computeBoundingSphere();

    const raftersGroup = new THREE.Group();
    raftersGroup.name = 'roof.eastWing.rafters';
    const rafterPitch = Math.atan2(0.62, 1.05);
    let rafterIdx = 0;
    for (let rx = -16.2; rx <= -5.4; rx += 1.35) {
      rafterIdx += 1;
      const northRafter = new THREE.Mesh(sharedRoofRafterGeo, roofTimberMat);
      northRafter.name = `roof.eastWing.rafters.northRafter_${rafterIdx}`;
      northRafter.position.set(rx, 5.36, -0.58);
      northRafter.rotation.x = -rafterPitch;
      tagHighLodDetail(northRafter);
      raftersGroup.add(northRafter);

      const southRafter = new THREE.Mesh(sharedRoofRafterGeo, roofTimberMat);
      southRafter.name = `roof.eastWing.rafters.southRafter_${rafterIdx}`;
      southRafter.position.set(rx, 5.36, 0.48);
      southRafter.rotation.x = rafterPitch;
      tagHighLodDetail(southRafter);
      raftersGroup.add(southRafter);
    }
    ewCeilingMeshGroup.add(raftersGroup);
  }

  // -------------------------------------------------------------------------
  // C. Lead Ridge Caps & Lead-Lined Valley Flashing Channels (Photos 1 & 2)
  // -------------------------------------------------------------------------
  // East-West Lead Ridge Roll Cap (local X = -20.162m to -4.41m at local Z = ewRidgeZ, Y = 5.83m)
  const ewRidgeEndLocalX = ewEastGableX - 0.01;
  const ewRidgeLen = ewRidgeEndLocalX - ewRidgeJunctionLocalX;
  const ewRidgeCapGeo = new THREE.CylinderGeometry(
    0.062,
    0.062,
    ewRidgeLen,
    16,
    1,
    false,
    0,
    Math.PI
  );
  ewRidgeCapGeo.computeBoundingSphere();
  const ewRidgeCap = new THREE.Mesh(ewRidgeCapGeo, ridgeLeadMat);
  ewRidgeCap.name = 'roof.eastWing.ridgeLeadCap';
  ewRidgeCap.rotation.z = Math.PI / 2;
  ewRidgeCap.position.set((ewRidgeJunctionLocalX + ewRidgeEndLocalX) / 2, ridgeY + 0.01, ewRidgeZ);
  ewRidgeCap.castShadow = true;
  ewCeilingMeshGroup.add(ewRidgeCap);

  // North-South Lead Ridge Roll Cap (Z = northGableRidgeZ + 0.015m to southGableZ - 0.015m at X = -19.79m, Y = 5.83m)
  const nsRidgeStartZ = northGableRidgeZ + 0.015;
  const nsRidgeEndZ = southGableZ - 0.015;
  const nsRidgeLen = nsRidgeEndZ - nsRidgeStartZ;
  const nsRidgeCapGeo = new THREE.CylinderGeometry(
    0.062,
    0.062,
    nsRidgeLen,
    16,
    1,
    false,
    0,
    Math.PI
  );
  nsRidgeCapGeo.computeBoundingSphere();
  const nsRidgeCap = new THREE.Mesh(nsRidgeCapGeo, ridgeLeadMat);
  nsRidgeCap.name = 'roof.westWing.ridgeLeadCap';
  nsRidgeCap.rotation.x = Math.PI / 2;
  nsRidgeCap.rotation.z = Math.PI;
  nsRidgeCap.position.set(nsRidgeX, ridgeY + 0.01, (nsRidgeStartZ + nsRidgeEndZ) / 2);
  nsRidgeCap.castShadow = true;
  ceilingMeshGroup.add(nsRidgeCap);

  // Lead-Lined V-Channel Valley Flashing Strips along both Valley Intersections (coplanar with the two adjacent roof slopes)
  for (const [valleySuffix, valleyEavePt, wingDirA, wingDirB] of [
    [
      'courtyard',
      pCourtyardValleyEave,
      new THREE.Vector3().subVectors(pEastGableSouthEave, pCourtyardValleyEave).normalize(),
      new THREE.Vector3(eastEaveX - pCourtyardValleyEave.x, 0, southGableZ - pCourtyardValleyEave.z).normalize(),
    ],
    [
      'north',
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
    valleyFlashing.name = `mainHouse.roof.valleyFlashing.${valleySuffix}`;
    ceilingMeshGroup.add(valleyFlashing);
  }

  // -------------------------------------------------------------------------
  // D. Three Upper Brick Gable Apex Triangles (East, North & South above Y = 5.02m) + White Painted Bargeboards,
  //    Boxed Eaves Soffits, Fascias, Pale Sage-Green Half-Round Gutters & Cast-Iron Downpipes
  //    (Sits directly on top of the 4.16m..5.02m `firstFloorMeshGroup` brick gables with zero overlap — Issue #1!)
  // -------------------------------------------------------------------------
  const gableCollarY = 5.02;
  const gableApexH = ridgeY - gableCollarY; // 0.80m (Y = 5.02m..5.82m)

  // 1. East Gable Upper Brick Apex at local X = -4.64m..-4.40m (above `mainBedroom.eastWallBrickGable`, Y = 5.02m..5.82m)
  const ewEastGableShape = new THREE.Shape();
  ewEastGableShape.moveTo(-1.35, 0);
  ewEastGableShape.lineTo(1.25, 0);
  ewEastGableShape.lineTo(0.05, gableApexH);
  ewEastGableShape.closePath();
  const ewEastGableGeo = new THREE.ExtrudeGeometry(ewEastGableShape, {
    depth: 0.24,
    bevelEnabled: false,
  });
  ewEastGableGeo.rotateY(Math.PI / 2);
  applyWorldSpaceBrickUVs(ewEastGableGeo, -4.64, gableCollarY, 0);
  ewEastGableGeo.computeBoundingSphere();
  const ewEastGable = new THREE.Mesh(ewEastGableGeo, exteriorBrickMat);
  ewEastGable.name = 'roof.eastGable.upperBrickApex';
  ewEastGable.position.set(-4.64, gableCollarY, 0);
  ewEastGable.castShadow = true;
  ewEastGable.receiveShadow = true;
  ewCeilingMeshGroup.add(ewEastGable);

  // 2. North Gable Upper Brick Apex above `bedroom2.northWallBrickGable` (`Y = 5.02m..5.745m`, `u = 1.41m..3.997m` -> apex `u = 2.704m` at `X = -19.79m`)
  const nsNorthGableShape = new THREE.Shape();
  nsNorthGableShape.moveTo(1.41, gableCollarY);
  nsNorthGableShape.lineTo(3.997, gableCollarY);
  nsNorthGableShape.lineTo(2.704, 5.745);
  nsNorthGableShape.closePath();
  const nsNorthGableGeo = new THREE.ExtrudeGeometry(nsNorthGableShape, {
    depth: 0.28,
    bevelEnabled: false,
  });
  nsNorthGableGeo.translate(0, 0, -0.14);
  const nsNorthUv = nsNorthGableGeo.attributes.uv;
  if (nsNorthUv) {
    for (let i = 0; i < nsNorthUv.count; i++) {
      nsNorthUv.setXY(
        i,
        nsNorthUv.getX(i) / 1.35,
        nsNorthUv.getY(i) / 1.2
      );
    }
    nsNorthUv.needsUpdate = true;
  }
  nsNorthGableGeo.computeBoundingSphere();
  const nsNorthGable = new THREE.Mesh(nsNorthGableGeo, exteriorBrickMat);
  nsNorthGable.name = 'roof.northGable.upperBrickApex';
  nsNorthGable.position.set(-22.47, 0, -3.359);
  nsNorthGable.rotation.y = MAIN_EAST_WING_ROTATION_Y;
  nsNorthGable.castShadow = true;
  nsNorthGable.receiveShadow = true;
  ceilingMeshGroup.add(nsNorthGable);

  // 3. South Gable Upper Brick Apex at Z = +11.49m..+11.77m (above `bedroom4.southWallBrickGable`, `Y = 5.02m..5.82m`)
  const nsSouthGableShape = new THREE.Shape();
  nsSouthGableShape.moveTo(-20.99, gableCollarY);
  nsSouthGableShape.lineTo(-18.62, gableCollarY);
  nsSouthGableShape.lineTo(nsRidgeX, 5.745);
  nsSouthGableShape.closePath();
  const nsSouthGableGeo = new THREE.ExtrudeGeometry(nsSouthGableShape, {
    depth: 0.28,
    bevelEnabled: false,
  });
  nsSouthGableGeo.translate(0, 0, 11.49);
  applyWorldSpaceBrickUVs(nsSouthGableGeo, 0, 0, 0);
  nsSouthGableGeo.computeBoundingSphere();
  const nsSouthGable = new THREE.Mesh(nsSouthGableGeo, exteriorBrickMat);
  nsSouthGable.name = 'roof.southGable.upperBrickApex';
  nsSouthGable.castShadow = true;
  nsSouthGable.receiveShadow = true;
  ceilingMeshGroup.add(nsSouthGable);

  // Plumb-Mitered White Painted Verge Bargeboards + Sloped Boxed Verge Soffits along all 3 Gables (Issues #5 & #6):
  // Eliminates the X-crossing / V-notch at the ridge apex and closes the underside overhang between the bargeboard and brick gable wall!
  const addMiteredGableBargeboardsAndSoffit = (
    gablePrefix: string,
    uLeft: number,
    uRidge: number,
    uRight: number,
    bargeZMin: number,
    bargeZMax: number,
    soffitZMin: number,
    soffitZMax: number,
    rotateY90: boolean,
    targetGroup: THREE.Group
  ): void => {
    const eaveTopY = eaveY + 0.035; // 4.215m (matches horizontal eaves fascia top!)
    const eaveBotY = eaveY - 0.116; // 4.064m (matches horizontal eaves fascia & soffit bottom!)
    const ridgeTopY = ridgeY + 0.035; // 5.855m
    const ridgeBotY = ridgeY - 0.116; // 5.704m
    const soffitThickY = 0.022;

    const addExtrudedSlopeStrip = (
      partName: string,
      u0: number,
      yBot0: number,
      yTop0: number,
      u1: number,
      yBot1: number,
      yTop1: number,
      zMin: number,
      zMax: number
    ): void => {
      const shape = new THREE.Shape();
      shape.moveTo(u0, yBot0);
      shape.lineTo(u1, yBot1);
      shape.lineTo(u1, yTop1);
      shape.lineTo(u0, yTop0);
      shape.closePath();

      const depth = zMax - zMin;
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
      });
      geo.translate(0, 0, zMin);
      if (rotateY90) {
        // Map (u, y, z) -> (-z, y, u) so u runs along local Z and zMin..zMax runs along local X!
        geo.rotateY(Math.PI / 2);
      }
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, soffitFasciaMat);
      mesh.name = `${gablePrefix}.${partName}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      targetGroup.add(mesh);
    };

    // Left & Right Plumb-Mitered Verge Bargeboards (meet along exact vertical plumb line u = uRidge!)
    addExtrudedSlopeStrip('bargeboard.left', uLeft, eaveBotY, eaveTopY, uRidge, ridgeBotY, ridgeTopY, bargeZMin, bargeZMax);
    addExtrudedSlopeStrip('bargeboard.right', uRidge, ridgeBotY, ridgeTopY, uRight, eaveBotY, eaveTopY, bargeZMin, bargeZMax);

    // Left & Right Sloped Boxed Verge Soffits (close the 0.22m overhang between the bargeboard and brick gable wall!)
    addExtrudedSlopeStrip(
      'vergeSoffit.left',
      uLeft,
      eaveBotY,
      eaveBotY + soffitThickY,
      uRidge,
      ridgeBotY,
      ridgeBotY + soffitThickY,
      soffitZMin,
      soffitZMax
    );
    addExtrudedSlopeStrip(
      'vergeSoffit.right',
      uRidge,
      ridgeBotY,
      ridgeBotY + soffitThickY,
      uRight,
      eaveBotY,
      eaveBotY + soffitThickY,
      soffitZMin,
      soffitZMax
    );
  };

  // 1. North Gable Plumb-Mitered Bargeboards & Sloped Verge Soffit (in ewCeilingMeshGroup at z_ew = -2.992m..-2.750m — Issues #5 & #6!)
  addMiteredGableBargeboardsAndSoffit(
    'roof.northGable',
    ewNorthGableWestLocalX,
    ewNorthGableRidgeLocalX,
    ewNorthValleyLocalX,
    ewNorthEaveZ + 0.008, // -2.992m (coplanar with East-West North Eaves Fascia front face!)
    ewNorthEaveZ + 0.046, // -2.954m (0.038m thick)
    ewNorthEaveZ + 0.01,  // -2.990m (coplanar with East-West North Eaves Soffit front edge!)
    ewNorthEaveZ + 0.25,  // -2.750m (0.240m deep into North brick wall at z_ew = -2.780m!)
    false,
    ewCeilingMeshGroup
  );

  // 2. South Gable Plumb-Mitered Bargeboards & Sloped Verge Soffit (in ceilingMeshGroup at Z = 11.750m..11.950m)
  addMiteredGableBargeboardsAndSoffit(
    'roof.southGable',
    westEaveX,
    nsRidgeX,
    eastEaveX,
    southGableZ - 0.046,
    southGableZ - 0.008,
    southGableZ - 0.25,
    southGableZ - 0.01,
    false,
    ceilingMeshGroup
  );

  // 3. East Gable Plumb-Mitered Bargeboards & Sloped Verge Soffit (in ewCeilingMeshGroup at x_ew = -4.650m..-4.392m)
  // Note: with rotateY(Math.PI / 2), (u, y, z) maps to (z, y, -u), so u = -ewSouthEaveZ..-ewNorthEaveZ maps to z_ew = +2.90m..-3.00m!
  addMiteredGableBargeboardsAndSoffit(
    'roof.eastGable',
    -ewSouthEaveZ,
    -ewRidgeZ,
    -ewNorthEaveZ,
    ewEastGableX - 0.028, // -4.428m
    ewEastGableX + 0.01,  // -4.390m
    ewEastGableX - 0.25,  // -4.650m (into East brick wall at x_ew = -4.640m)
    ewEastGableX - 0.01,  // -4.410m
    true,
    ewCeilingMeshGroup
  );

  // White Painted Eaves Fascia Boards, Boxed Eaves Soffits & Pale Sage-Green Half-Round Gutters at Y = 4.18m (Issue #11, Issue #3, Issue #1 & Issue #6)
  const ewNorthEaveSpanX = ewEastGableX - ewNorthValleyLocalX; // 13.230852m (from -17.630852m to -4.400m)
  const ewNorthEaveMidX = (ewNorthValleyLocalX + ewEastGableX) * 0.5; // -11.015426m
  for (const [sideKey, fasciaZ, signZ, fasciaSpanX, fasciaMidX, soffitSpanX, soffitMidX, gutterSpanX, gutterMidX] of [
    ['north', ewNorthEaveZ + 0.02, -1, ewNorthEaveSpanX, ewNorthEaveMidX, ewNorthEaveSpanX, ewNorthEaveMidX, ewNorthEaveSpanX, ewNorthEaveMidX], // East-West North eaves joined seamlessly at North Valley (x_ew = -17.630852m — Issue #6!)
    ['south', ewSouthEaveZ - 0.02, 1, 12.057, -10.4285, 12.275, -10.5375, 12.087, -10.4435],  // East-West South courtyard eaves extended cleanly into L-corner
  ] as const) {
    const fasciaGeo = new THREE.BoxGeometry(fasciaSpanX, 0.151, 0.024);
    fasciaGeo.computeBoundingSphere();
    const fascia = new THREE.Mesh(fasciaGeo, soffitFasciaMat);
    fascia.name = `roof.eastWing.${sideKey}Fascia`;
    fascia.position.set(fasciaMidX, eaveY - 0.0405, fasciaZ);
    fascia.castShadow = true;
    ewCeilingMeshGroup.add(fascia);

    const soffitGeo = new THREE.BoxGeometry(soffitSpanX, 0.022, 0.24);
    soffitGeo.computeBoundingSphere();
    const soffit = new THREE.Mesh(soffitGeo, soffitFasciaMat);
    soffit.name = `roof.eastWing.${sideKey}Soffit`;
    soffit.position.set(soffitMidX, eaveY - 0.105, fasciaZ - signZ * 0.11);
    ewCeilingMeshGroup.add(soffit);

    const gutterGeo = new THREE.CylinderGeometry(
      0.056,
      0.056,
      gutterSpanX,
      14,
      1,
      true,
      Math.PI,
      Math.PI
    );
    gutterGeo.computeBoundingSphere();
    const gutter = new THREE.Mesh(gutterGeo, gutterPaleGreenMat);
    gutter.name = `mainHouse.gutter.ew.${sideKey}`;
    gutter.rotation.z = Math.PI / 2;
    gutter.position.set(gutterMidX, eaveY - 0.01, fasciaZ + signZ * 0.068);
    ewCeilingMeshGroup.add(gutter);
  }

  // North Eave Brick Wall-Plate Backing (`x_ew = -17.78m..-4.64m, y = 4.064m..4.22m, z_ew = -2.78m..-2.50m`)
  // Closes any vertical gap between the 4.16m North brick wall and the 4.064m..4.22m boxed eaves soffit & slate roof at the North Valley (Issue #6)
  {
    const northBackingW = -4.64 - -17.78;
    const northBackingCx = (-17.78 + -4.64) * 0.5;
    const northBackingGeo = new THREE.BoxGeometry(northBackingW, 0.156, 0.28);
    applyWorldSpaceBrickUVs(northBackingGeo, northBackingCx, 4.142, -2.64);
    northBackingGeo.computeBoundingSphere();
    const northEaveBacking = new THREE.Mesh(northBackingGeo, exteriorBrickMat);
    northEaveBacking.name = 'roof.eastWing.northEaveBrickBacking';
    northEaveBacking.position.set(northBackingCx, 4.142, -2.64);
    ewCeilingMeshGroup.add(northEaveBacking);
  }

  // West Front Eaves Fascia, Soffit & Gutter (straight along X = westEaveX = -22.69m)
  const westFrontSpanZ = southGableZ - northGableZ;
  const westFrontMidZ = (northGableZ + southGableZ) * 0.5;
  {
    const westFasciaX = westEaveX + 0.02;
    const westFasciaGeo = new THREE.BoxGeometry(0.024, 0.15, westFrontSpanZ);
    westFasciaGeo.computeBoundingSphere();
    const westFascia = new THREE.Mesh(westFasciaGeo, soffitFasciaMat);
    westFascia.name = 'roof.westWing.westFascia';
    westFascia.position.set(westFasciaX, eaveY - 0.04, westFrontMidZ);
    westFascia.castShadow = true;
    ceilingMeshGroup.add(westFascia);

    const westSoffitGeo = new THREE.BoxGeometry(0.24, 0.022, westFrontSpanZ);
    westSoffitGeo.computeBoundingSphere();
    const westSoffit = new THREE.Mesh(westSoffitGeo, soffitFasciaMat);
    westSoffit.name = 'roof.westWing.westSoffit';
    westSoffit.position.set(westFasciaX + 0.11, eaveY - 0.105, westFrontMidZ);
    ceilingMeshGroup.add(westSoffit);

    const westGutterGeo = new THREE.CylinderGeometry(
      0.056,
      0.056,
      westFrontSpanZ,
      14,
      1,
      true,
      Math.PI,
      Math.PI
    );
    westGutterGeo.computeBoundingSphere();
    const westGutter = new THREE.Mesh(westGutterGeo, gutterPaleGreenMat);
    westGutter.name = 'mainHouse.gutter.ns.west';
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
    eastEaveGroup.name = 'roof.westWing.eastCourtyardEaves';
    eastEaveGroup.position.set(eastCourtyardMidX, 0, eastCourtyardMidZ);
    eastEaveGroup.rotation.y = eastCourtyardAngleY;

    const eastFasciaGeo = new THREE.BoxGeometry(
      0.024,
      0.15,
      eastCourtyardSpanLen + 0.022
    );
    eastFasciaGeo.computeBoundingSphere();
    const eastFascia = new THREE.Mesh(eastFasciaGeo, soffitFasciaMat);
    eastFascia.name = 'roof.westWing.eastCourtyardFascia';
    eastFascia.position.set(-0.02, eaveY - 0.04, -0.011);
    eastFascia.castShadow = true;
    eastEaveGroup.add(eastFascia);

    const eastSoffitGeo = new THREE.BoxGeometry(0.24, 0.022, eastCourtyardSpanLen);
    eastSoffitGeo.computeBoundingSphere();
    const eastSoffit = new THREE.Mesh(eastSoffitGeo, soffitFasciaMat);
    eastSoffit.name = 'roof.westWing.eastCourtyardSoffit';
    eastSoffit.position.set(-0.13, eaveY - 0.105, 0);
    eastEaveGroup.add(eastSoffit);

    const eastGutterGeo = new THREE.CylinderGeometry(
      0.056,
      0.056,
      eastCourtyardSpanLen + 0.052,
      14,
      1,
      true,
      Math.PI,
      Math.PI
    );
    eastGutterGeo.computeBoundingSphere();
    const eastGutter = new THREE.Mesh(eastGutterGeo, gutterPaleGreenMat);
    eastGutter.name = 'mainHouse.gutter.ns.east';
    eastGutter.rotation.x = Math.PI / 2;
    eastGutter.position.set(0.048, eaveY - 0.01, -0.026);
    eastEaveGroup.add(eastGutter);

    ceilingMeshGroup.add(eastEaveGroup);

    // Mitered L-Corner Boxed Eaves Soffit, Brick Eave Backing & Gutter Angle Union at [-16.703, 3.958, 2.902] (Issue #1)
    const cornerSoffit = buildPolygonalFloorSlab(
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
    );
    cornerSoffit.name = 'mainHouse.roof.courtyardCornerSoffit';
    cornerSoffit.geometry.computeBoundingSphere();

    const cornerEaveBackingGeo = new THREE.BoxGeometry(0.26, 0.18, 0.3);
    applyWorldSpaceBrickUVs(cornerEaveBackingGeo, -16.82, eaveY - 0.01, 2.75);
    cornerEaveBackingGeo.computeBoundingSphere();
    const cornerEaveBacking = new THREE.Mesh(cornerEaveBackingGeo, exteriorBrickMat);
    cornerEaveBacking.name = 'roof.courtyardCorner.brickBacking';
    cornerEaveBacking.position.set(-16.82, eaveY - 0.01, 2.75);
    ceilingMeshGroup.add(cornerEaveBacking);

    const gutterCornerUnionGeo = new THREE.BoxGeometry(0.118, 0.058, 0.118);
    gutterCornerUnionGeo.computeBoundingSphere();
    const gutterCornerUnion = new THREE.Mesh(
      gutterCornerUnionGeo,
      gutterPaleGreenMat
    );
    gutterCornerUnion.name = 'mainHouse.gutter.cornerUnion';
    gutterCornerUnion.position.set(-16.437, eaveY - 0.036, 3.073);
    gutterCornerUnion.rotation.y = MAIN_EAST_WING_ROTATION_Y * 0.5;
    ceilingMeshGroup.add(gutterCornerUnion);
  }

  // Two-Storey Cast-Iron Rainwater Downpipes with Uniform-Radius Swan-Neck Offsets, Pipe Collars & Shoes (Issues #11, #12, #3 & #4)
  const dpPipeR = 0.036;
  const sharedGutterNozzleGeo = new THREE.CylinderGeometry(
    dpPipeR + 0.008,
    dpPipeR + 0.002,
    0.055,
    16
  );
  sharedGutterNozzleGeo.computeBoundingSphere();
  const sharedDpCollarGeo = new THREE.CylinderGeometry(
    dpPipeR + 0.006,
    dpPipeR + 0.006,
    0.028,
    16
  );
  sharedDpCollarGeo.computeBoundingSphere();
  const sharedEarBracketGeoX = new THREE.BoxGeometry(0.024, 0.028, 0.13);
  sharedEarBracketGeoX.computeBoundingSphere();
  const sharedEarBracketGeoZ = new THREE.BoxGeometry(0.13, 0.028, 0.024);
  sharedEarBracketGeoZ.computeBoundingSphere();

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
    const dpShaftGeo = new THREE.CylinderGeometry(dpPipeR, dpPipeR, dpH, 16);
    dpShaftGeo.computeBoundingSphere();
    const dpShaft = new THREE.Mesh(dpShaftGeo, gutterCastIronMat);
    dpShaft.name = `mainHouse.${dpName}.shaft`;
    dpShaft.position.set(px, shaftBotY + dpH / 2, pz);
    dpShaft.castShadow = true;
    dpShaft.receiveShadow = true;
    dpGroup.add(dpShaft);

    // Gutter drop outlet nozzle directly under the half-round eaves gutter trough
    const gutterNozzle = new THREE.Mesh(sharedGutterNozzleGeo, gutterCastIronMat);
    gutterNozzle.name = `mainHouse.${dpName}.gutterNozzle`;
    gutterNozzle.position.set(
      px + gutterOffsetX,
      eaveY - 0.055,
      pz + gutterOffsetZ
    );
    gutterNozzle.castShadow = true;
    tagHighLodDetail(gutterNozzle);
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
    const swanNeckGeo = new THREE.TubeGeometry(swanCurve, 18, dpPipeR, 16, false);
    swanNeckGeo.computeBoundingSphere();
    const swanNeck = new THREE.Mesh(swanNeckGeo, gutterCastIronMat);
    swanNeck.name = `mainHouse.${dpName}.swanNeck`;
    swanNeck.castShadow = true;
    dpGroup.add(swanNeck);

    // Issue #4: Connect the adjacent single-storey Kitchen South Gutter (local X = -4.65m, Y = 3.125m, Z = 2.585m)
    // into `downpipe.mainBedroomEastCourtyard` at Y ≈ 2.95m ([-5.028, 2.952, 4.367]) with the exact same 0.036m pipe radius!
    if (dpName === 'downpipe.mainBedroomEastCourtyard') {
      const kitchenGutterX = -4.66;
      const kitchenGutterY = 3.125;
      const kitchenGutterZ = 2.585;

      const branchNozzleGeo = new THREE.CylinderGeometry(
        dpPipeR + 0.008,
        dpPipeR + 0.002,
        0.05,
        16
      );
      branchNozzleGeo.computeBoundingSphere();
      const branchNozzle = new THREE.Mesh(branchNozzleGeo, gutterCastIronMat);
      branchNozzle.name = `mainHouse.${dpName}.branchNozzle`;
      branchNozzle.position.set(kitchenGutterX, kitchenGutterY - 0.045, kitchenGutterZ);
      branchNozzle.castShadow = true;
      tagHighLodDetail(branchNozzle);
      dpGroup.add(branchNozzle);

      const branchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(kitchenGutterX, kitchenGutterY - 0.035, kitchenGutterZ),
        new THREE.Vector3(kitchenGutterX, 3.04, kitchenGutterZ),
        new THREE.Vector3((kitchenGutterX + px) * 0.5, 2.985, (kitchenGutterZ + pz) * 0.5),
        new THREE.Vector3(px, 2.93, pz),
        new THREE.Vector3(px, 2.89, pz),
      ]);
      const branchTubeGeo = new THREE.TubeGeometry(branchCurve, 16, dpPipeR, 16, false);
      branchTubeGeo.computeBoundingSphere();
      const branchTube = new THREE.Mesh(branchTubeGeo, gutterCastIronMat);
      branchTube.name = `mainHouse.${dpName}.branchTube`;
      branchTube.castShadow = true;
      dpGroup.add(branchTube);
    }

    // Cast-iron eared wall fixing collars every ~1.25m up the brick wall
    let collarIdx = 0;
    for (let cy = groundY + 0.45; cy < eaveY - 0.35; cy += 1.25) {
      collarIdx += 1;
      const collar = new THREE.Mesh(sharedDpCollarGeo, gutterCastIronMat);
      collar.name = `mainHouse.${dpName}.collar_${collarIdx}`;
      collar.position.set(px, cy, pz);
      tagHighLodDetail(collar);
      dpGroup.add(collar);

      const earBracket = new THREE.Mesh(
        gutterOffsetX !== 0 ? sharedEarBracketGeoX : sharedEarBracketGeoZ,
        gutterCastIronMat
      );
      earBracket.name = `mainHouse.${dpName}.earBracket_${collarIdx}`;
      earBracket.position.set(px, cy, pz);
      tagHighLodDetail(earBracket);
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
    const bottomShoeGeo = new THREE.TubeGeometry(shoeCurve, 10, dpPipeR, 16, false);
    bottomShoeGeo.computeBoundingSphere();
    const bottomShoe = new THREE.Mesh(bottomShoeGeo, gutterCastIronMat);
    bottomShoe.name = `mainHouse.${dpName}.bottomShoe`;
    bottomShoe.castShadow = true;
    dpGroup.add(bottomShoe);

    parentGroup.add(dpGroup);
  }

  // -------------------------------------------------------------------------
  // E. 5 Tall Victorian Red-Brick Chimney Stacks with Oversailing Courses & Terracotta Pots
  //    Rising from inside the roof structure (`roofExitY - 0.32m`) through the Two-Storey
  //    Main House Ridge (`Y = 5.60m..6.88m` + pots, Photos 1 & 2, Issue #8: never protruding outside gable walls!)
  // -------------------------------------------------------------------------
  const potH = 0.48;
  const sharedPotBodyGeo = new THREE.CylinderGeometry(0.095, 0.115, potH, 14);
  sharedPotBodyGeo.computeBoundingSphere();
  const sharedPotCollarGeo = new THREE.TorusGeometry(0.102, 0.014, 8, 14);
  sharedPotCollarGeo.computeBoundingSphere();
  const sharedFlueTopGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.02, 12);
  sharedFlueTopGeo.computeBoundingSphere();

  const addVictorianBrickChimneyStack = (
    stackName: string,
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
    stackGroup.name = stackName;

    const leadApronGeo = new THREE.BoxGeometry(stackW + 0.12, 0.16, stackD + 0.12);
    leadApronGeo.computeBoundingSphere();
    const leadApron = new THREE.Mesh(leadApronGeo, ridgeLeadMat);
    leadApron.name = `${stackName}.leadApron`;
    leadApron.position.set(cx, roofExitY + 0.08, cz);
    stackGroup.add(leadApron);

    // Brick chimney shaft starts inside the roof space just below roofExitY so it never pokes outside the exterior gable wall (Issue #8)
    const shaftBottomY = roofExitY - 0.32;
    const shaftH = topY - shaftBottomY;
    const shaftGeo = new THREE.BoxGeometry(stackW, shaftH, stackD);
    applyWorldSpaceBrickUVs(shaftGeo, cx, shaftBottomY + shaftH / 2, cz);
    shaftGeo.computeBoundingSphere();
    const shaftMesh = new THREE.Mesh(shaftGeo, exteriorBrickMat);
    shaftMesh.name = `${stackName}.brickShaft`;
    shaftMesh.position.set(cx, shaftBottomY + shaftH / 2, cz);
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    stackGroup.add(shaftMesh);

    const corbelCourses = [
      [1, -0.18, 0.06],
      [2, -0.1, 0.11],
      [3, -0.03, 0.06],
    ] as const;
    for (const [corbelIdx, yOff, expand] of corbelCourses) {
      const corbelGeo = new THREE.BoxGeometry(stackW + expand, 0.065, stackD + expand);
      applyWorldSpaceBrickUVs(corbelGeo, cx, topY + yOff, cz);
      corbelGeo.computeBoundingSphere();
      const corbel = new THREE.Mesh(corbelGeo, exteriorBrickMat);
      corbel.name = `${stackName}.corbelCourse_${corbelIdx}`;
      corbel.position.set(cx, topY + yOff, cz);
      corbel.castShadow = true;
      stackGroup.add(corbel);
    }

    const flaunchCapGeo = new THREE.BoxGeometry(stackW + 0.08, 0.055, stackD + 0.08);
    flaunchCapGeo.computeBoundingSphere();
    const flaunchCap = new THREE.Mesh(flaunchCapGeo, stoneSillMat);
    flaunchCap.name = `${stackName}.flaunchCap`;
    flaunchCap.position.set(cx, topY + 0.028, cz);
    stackGroup.add(flaunchCap);

    const spacing = potCount === 3 ? 0.34 : 0.38;
    for (let i = 0; i < potCount; i++) {
      const offset = (i - (potCount - 1) / 2) * spacing;
      const px = potAxis === 'x' ? cx + offset : cx;
      const pz = potAxis === 'z' ? cz + offset : cz;

      const potGroup = new THREE.Group();
      potGroup.name = `${stackName}.pot_${i + 1}`;

      const potBody = new THREE.Mesh(sharedPotBodyGeo, terracottaPotMat);
      potBody.name = `${stackName}.pot_${i + 1}.body`;
      potBody.position.set(px, topY + 0.055 + potH / 2, pz);
      potBody.castShadow = true;
      potGroup.add(potBody);

      const potCollar = new THREE.Mesh(sharedPotCollarGeo, terracottaPotMat);
      potCollar.name = `${stackName}.pot_${i + 1}.collar`;
      potCollar.rotation.x = Math.PI / 2;
      potCollar.position.set(px, topY + 0.055 + potH - 0.05, pz);
      tagHighLodDetail(potCollar);
      potGroup.add(potCollar);

      const flueTop = new THREE.Mesh(sharedFlueTopGeo, sootFlueMat);
      flueTop.name = `${stackName}.pot_${i + 1}.flueTop`;
      flueTop.position.set(px, topY + 0.055 + potH + 0.002, pz);
      tagHighLodDetail(flueTop);
      potGroup.add(flueTop);

      stackGroup.add(potGroup);
    }

    targetGroup.add(stackGroup);
  };

  // 1. East Gable Stack (above Main Bedroom / Dining Room East chimney breast at local X = -4.84m, Z = -0.015m — 3 pots along Z)
  addVictorianBrickChimneyStack('roof.chimneyStack.eastGable', -4.84, -0.015, 0.72, 1.42, 5.38, 6.66, 3, 'z', ewCeilingMeshGroup);
  // 2. East-West Ridge Stack (above Main Stair Landing / Boot Lobby cross-wall at local X = -13.18m, Z = -0.05m — 2 pots along Z)
  addVictorianBrickChimneyStack('roof.chimneyStack.eastWingRidge', -13.18, -0.05, 0.58, 1.12, 5.4, 6.62, 2, 'z', ewCeilingMeshGroup);
  // 3. North-South Ridge North Stack (above Bedroom 2 / Living Room fireplace at X = -19.95m, Z = +2.18m — 3 pots along X)
  addVictorianBrickChimneyStack('roof.chimneyStack.westWingNorth', -19.95, 2.18, 1.22, 0.6, 5.4, 6.66, 3, 'x');
  // 4. North-South Ridge Middle Stack (above Bedroom 3 / Sitting Room fireplace at X = -19.80m, Z = +7.98m — 3 pots along X)
  addVictorianBrickChimneyStack('roof.chimneyStack.westWingMiddle', -19.8, 7.98, 1.22, 0.6, 5.4, 6.66, 3, 'x');
  // 5. South Gable Apex Stack (above Bedroom 4 / Study South gable at X = -19.79m, Z = +11.29m — flush inside the house, Issue #8!)
  addVictorianBrickChimneyStack('roof.chimneyStack.southGable', -19.79, 11.29, 0.96, 0.52, 5.43, 6.6, 2, 'x');
}
