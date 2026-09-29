import * as THREE from 'three';
import { createWelshSlateRoofTexture } from '../../../../engine/textures/procedural-textures.ts';
import {
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingPoint,
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

  // A. First Floor Ceiling Slabs (bottom at Y = upperWallTopY - 0.003m to cover wallCapMat from below while keeping ceiling roses visible)
  const upperCeilingMat = plasterMat.clone();
  upperCeilingMat.side = THREE.DoubleSide;
  const ewUpperCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(17.7, 0.03, 5.12),
    upperCeilingMat
  );
  ewUpperCeiling.position.set(-13.45, upperWallTopY + 0.012, -0.075);
  ewUpperCeiling.castShadow = true;
  ewUpperCeiling.receiveShadow = true;
  ewCeilingMeshGroup.add(ewUpperCeiling);

  const nsUpperCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(5.28, 0.03, 9.48),
    upperCeilingMat
  );
  nsUpperCeiling.position.set(-19.68, upperWallTopY + 0.012, 6.84);
  nsUpperCeiling.castShadow = true;
  nsUpperCeiling.receiveShadow = true;
  ceilingMeshGroup.add(nsUpperCeiling);

  // -------------------------------------------------------------------------
  // B. Mathematically Exact Coplanar L-Plan Roof Slope Builder
  //    Constructs a 3D prism roof facet from 4 coplanar world-space points
  //    `p0, p1` (along ridge at Y = 6.04m) and `p2, p3` (along eaves at Y = 4.40m)
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
    // uVec runs horizontally along the eave edge (p3 -> p2)
    const uVec = new THREE.Vector3().subVectors(p2, p3).normalize();
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

  // Key 3D Roof Junction Points (transformed from East-West Wing local frame into world space):
  const pRidgeJunction = transformEastWingPoint(nsRidgeX, ridgeY, ewRidgeZ);
  const pRidgeEastGable = transformEastWingPoint(ewEastGableX, ridgeY, ewRidgeZ);
  const pRidgeNorthGable = new THREE.Vector3(nsRidgeX, ridgeY, northGableRidgeZ);
  const pRidgeSouthGable = new THREE.Vector3(nsRidgeX, ridgeY, southGableZ);

  const pCourtyardValleyEave = transformEastWingPoint(eastEaveX, eaveY, ewSouthEaveZ);
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
  // East-West Lead Ridge Roll Cap (X = -19.79m to -4.40m at local Z = ewRidgeZ, Y = 5.83m)
  const ewRidgeLen = ewEastGableX - nsRidgeX;
  const ewRidgeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, ewRidgeLen + 0.04, 16, 1, false, 0, Math.PI),
    ridgeLeadMat
  );
  ewRidgeCap.rotation.z = Math.PI / 2;
  ewRidgeCap.position.set((nsRidgeX + ewEastGableX) / 2, ridgeY + 0.01, ewRidgeZ);
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

  // Lead-Lined Valley Flashing Strips along both Valley Intersections
  for (const valleyEavePt of [pCourtyardValleyEave, pNorthValleyEave]) {
    const valleyCurve = new THREE.LineCurve3(
      new THREE.Vector3(pRidgeJunction.x, pRidgeJunction.y + 0.005, pRidgeJunction.z),
      new THREE.Vector3(valleyEavePt.x, valleyEavePt.y + 0.005, valleyEavePt.z)
    );
    const valleyFlashing = new THREE.Mesh(
      new THREE.TubeGeometry(valleyCurve, 12, 0.065, 8, false),
      ridgeLeadMat
    );
    valleyFlashing.scale.set(1, 0.32, 1);
    ceilingMeshGroup.add(valleyFlashing);
  }

  // -------------------------------------------------------------------------
  // D. Three Brick Gable Triangles (East, North & South) + White Painted Bargeboards,
  //    Eaves Fascias, Pale Sage-Green Half-Round Gutters & Cast-Iron Downpipes
  // -------------------------------------------------------------------------
  // 1. East Gable Brick Triangle at local X = -4.64m..-4.40m (above Main Bedroom East wall, Y = 4.38m..5.82m)
  const ewEastGableShape = new THREE.Shape();
  ewEastGableShape.moveTo(-2.63, 0);
  ewEastGableShape.lineTo(2.78, 0);
  ewEastGableShape.lineTo(0.05, ridgeY - upperWallTopY);
  ewEastGableShape.closePath();
  const ewEastGableGeo = new THREE.ExtrudeGeometry(ewEastGableShape, {
    depth: 0.24,
    bevelEnabled: false,
  });
  ewEastGableGeo.rotateY(Math.PI / 2);
  applyWorldSpaceBrickUVs(ewEastGableGeo, -4.64, upperWallTopY, 0);
  const ewEastGable = new THREE.Mesh(ewEastGableGeo, exteriorBrickMat);
  ewEastGable.position.set(-4.64, upperWallTopY, 0);
  ewEastGable.castShadow = true;
  ewEastGable.receiveShadow = true;
  ewCeilingMeshGroup.add(ewEastGable);

  // 2. North Gable Brick Triangle above Bedroom 2 collinear North wall ([-22.47, -3.359] -> [-17.11, -2.642])
  const nsGableShape = new THREE.Shape();
  nsGableShape.moveTo(-22.47, 0);
  nsGableShape.lineTo(-17.11, 0);
  nsGableShape.lineTo(nsRidgeX, ridgeY - upperWallTopY);
  nsGableShape.closePath();

  const nsNorthGableLocalShape = new THREE.Shape();
  nsNorthGableLocalShape.moveTo(-2.68, 0);
  nsNorthGableLocalShape.lineTo(2.68, 0);
  nsNorthGableLocalShape.lineTo(0, ridgeY - upperWallTopY);
  nsNorthGableLocalShape.closePath();

  const nsNorthGableGeo = new THREE.ExtrudeGeometry(nsNorthGableLocalShape, {
    depth: 0.28,
    bevelEnabled: false,
  });
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

  // 3. South Gable Brick Triangle at Z = +11.49m..+11.77m (above Bedroom 4 South wall, Y = 4.38m..5.82m)
  const nsSouthGableGeo = new THREE.ExtrudeGeometry(nsGableShape, {
    depth: 0.28,
    bevelEnabled: false,
  });
  applyWorldSpaceBrickUVs(nsSouthGableGeo, 0, upperWallTopY, 11.49);
  const nsSouthGable = new THREE.Mesh(nsSouthGableGeo, exteriorBrickMat);
  nsSouthGable.position.set(0, upperWallTopY, 11.49);
  nsSouthGable.castShadow = true;
  nsSouthGable.receiveShadow = true;
  ceilingMeshGroup.add(nsSouthGable);

  // White Painted Verge Bargeboards along all 3 Gables (East, North & South)
  const addVergeBargeboard = (
    pStart: THREE.Vector3,
    pEnd: THREE.Vector3,
    targetGroup: THREE.Group = ceilingMeshGroup
  ): void => {
    const len = pStart.distanceTo(pEnd);
    const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.15, len + 0.04),
      soffitFasciaMat
    );
    mesh.position.set(mid.x, mid.y - 0.05, mid.z);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
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
    for (const eavePt of [westPt, eastPt]) {
      const len = ridgePt.distanceTo(eavePt);
      const mid = new THREE.Vector3().addVectors(ridgePt, eavePt).multiplyScalar(0.5);
      const angleZ = Math.atan2(ridgePt.y - eavePt.y, ridgePt.x - eavePt.x);
      const angleY = -Math.atan2(ridgePt.z - eavePt.z, ridgePt.x - eavePt.x);
      const barge = new THREE.Mesh(
        new THREE.BoxGeometry(len + 0.04, 0.15, 0.038),
        soffitFasciaMat
      );
      barge.position.set(mid.x, mid.y - 0.05, mid.z);
      barge.rotation.y = angleY;
      barge.rotation.z = angleZ;
      barge.castShadow = true;
      ceilingMeshGroup.add(barge);
    }
  }

  // White Painted Eaves Fascia Boards & Pale Sage-Green Half-Round Gutters at Y = 4.18m (Issue #11)
  for (const [fasciaZ, signZ, spanX, midX] of [
    [ewNorthEaveZ + 0.02, -1, 12.49, -10.645], // East-West North eaves (local X = -16.89m..-4.40m)
    [ewSouthEaveZ - 0.02, 1, 12.49, -10.645],  // East-West South courtyard eaves (local X = -16.89m..-4.40m)
  ] as const) {
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(spanX, 0.15, 0.024),
      soffitFasciaMat
    );
    fascia.position.set(midX, eaveY - 0.04, fasciaZ);
    fascia.castShadow = true;
    ewCeilingMeshGroup.add(fascia);

    const gutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, spanX, 14, 1, true, Math.PI, Math.PI),
      gutterPaleGreenMat
    );
    gutter.name = 'mainHouse.gutter.ew';
    gutter.rotation.z = Math.PI / 2;
    gutter.position.set(midX, eaveY - 0.01, fasciaZ + signZ * 0.068);
    ewCeilingMeshGroup.add(gutter);
  }

  const eastCourtyardSpanZ = southGableZ - pCourtyardValleyEave.z;
  const eastCourtyardMidZ = (pCourtyardValleyEave.z + southGableZ) * 0.5;
  const westFrontSpanZ = southGableZ - northGableZ;
  const westFrontMidZ = (northGableZ + southGableZ) * 0.5;
  for (const [fasciaX, signX, spanZ, midZ] of [
    [westEaveX + 0.02, -1, westFrontSpanZ, westFrontMidZ], // West Front eaves
    [eastEaveX - 0.02, 1, eastCourtyardSpanZ, eastCourtyardMidZ], // East Courtyard eaves
  ] as const) {
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.15, spanZ),
      soffitFasciaMat
    );
    fascia.position.set(fasciaX, eaveY - 0.04, midZ);
    fascia.castShadow = true;
    ceilingMeshGroup.add(fascia);

    const gutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, spanZ, 14, 1, true, Math.PI, Math.PI),
      gutterPaleGreenMat
    );
    gutter.name = 'mainHouse.gutter.ns';
    gutter.rotation.x = Math.PI / 2;
    gutter.position.set(fasciaX + signX * 0.068, eaveY - 0.01, midZ);
    ceilingMeshGroup.add(gutter);
  }

  // Two-Storey Cast-Iron Rainwater Downpipes with Hoppers, Pipe Collars & Shoes (Issues #11 & #12)
  for (const [dpName, px, pz, groundY, swanOffsetX, swanOffsetZ, parentGroup] of [
    ['downpipe.upperLandingCourtyard', -16.49, 2.715, -0.32, 0, 0.22, ewCeilingMeshGroup], // Upper Landing South Courtyard wall (Issue #11)
    ['downpipe.bootLobbyCourtyard', -9.58, 2.715, -0.1, 0, 0.22, ewCeilingMeshGroup],      // Boot Lobby / Dining Room junction
    ['downpipe.mainBedroomEastCourtyard', -4.88, 2.665, 0.0, 0, 0.27, ewCeilingMeshGroup], // Main Bedroom / Dining Room East Courtyard wall (Issue #12)
    ['downpipe.studyLobbySouthEast', -17.075, 11.42, -0.3, 0.22, 0, ceilingMeshGroup],     // Study Lobby SE courtyard corner
  ] as const) {
    const dpGroup = new THREE.Group();
    dpGroup.name = `mainHouse.${dpName}`;

    const dpH = eaveY - 0.14 - groundY;
    // Main vertical cast-iron rainwater downpipe shaft against the brick wall
    const dpShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, dpH, 14),
      gutterCastIronMat
    );
    dpShaft.position.set(px, groundY + dpH / 2, pz);
    dpShaft.castShadow = true;
    dpShaft.receiveShadow = true;
    dpGroup.add(dpShaft);

    // Cast-iron collector hopper box / swan-neck offset connecting the pale green eaves gutter to the wall pipe
    const hopper = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.16, 0.13),
      gutterCastIronMat
    );
    hopper.position.set(px, eaveY - 0.16, pz);
    hopper.castShadow = true;
    dpGroup.add(hopper);

    const swanNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.28, 12),
      gutterCastIronMat
    );
    swanNeck.position.set(px + swanOffsetX * 0.5, eaveY - 0.08, pz + swanOffsetZ * 0.5);
    swanNeck.rotation.x = swanOffsetZ !== 0 ? 0.72 : 0;
    swanNeck.rotation.z = swanOffsetX !== 0 ? -0.72 : 0;
    dpGroup.add(swanNeck);

    // Cast-iron eared wall fixing collars every ~1.2m up the brick wall
    for (let cy = groundY + 0.45; cy < eaveY - 0.35; cy += 1.25) {
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.032, 14),
        gutterCastIronMat
      );
      collar.position.set(px, cy, pz);
      dpGroup.add(collar);

      const earBracket = new THREE.Mesh(
        new THREE.BoxGeometry(
          swanOffsetX !== 0 ? 0.024 : 0.13,
          0.028,
          swanOffsetZ !== 0 ? 0.024 : 0.13
        ),
        gutterCastIronMat
      );
      earBracket.position.set(px, cy, pz);
      dpGroup.add(earBracket);
    }

    // Bottom cast-iron rainwater outfall shoe at courtyard ground level
    const bottomShoe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.04, 0.14, 12),
      gutterCastIronMat
    );
    bottomShoe.position.set(
      px + (swanOffsetX !== 0 ? 0.03 : 0),
      groundY + 0.07,
      pz + (swanOffsetZ !== 0 ? 0.03 : 0)
    );
    bottomShoe.rotation.x = swanOffsetZ !== 0 ? 0.38 : 0;
    bottomShoe.rotation.z = swanOffsetX !== 0 ? -0.38 : 0;
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
