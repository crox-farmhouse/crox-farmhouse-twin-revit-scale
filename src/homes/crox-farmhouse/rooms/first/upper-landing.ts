import * as THREE from 'three';
import { buildAngledWallSegment, buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Main staircase landing (`upperLanding`).
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildUpperLanding(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'ceramicWhiteMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'skirtingMat' | 'upperWallTopY' | 'wallCapMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteriorWall' | 'applyWorldSpaceBrickUVs' | 'tagUpperCutawayWall'>
): void {
  const { ceilingMeshGroup, firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addUpperBrickWallAlongXWithWindow,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    ceramicWhiteMat,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    skirtingMat,
    tagUpperCutawayWall,
    upperWallTopY,
    wallCapMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 3. MAIN STAIRCASE LANDING (DN) — Matching New Photos 3 & 4
  //    Directly above Entrance Hall with Stairs: X = -13.05m..-17.73m, Z = -2.50m..+2.40m
  //    With open Stairwell Void (X = -17.73m..-15.05m, Z = -2.50m..-0.58m) above the Quarter-Turn Staircase:
  //    - Soft light-grey landing carpet (0xb8b4ae)
  //    - Organic lime-plastered East chimney breast wide at the base on the left (North) side
  //    - Solid North brick wall with exposed lower brickwork and horizontal middle timber beam
  //    - Heavy dark black-stained timber ceiling beam & West wall timber framing posts (Photos 3 & 4)
  //    - South courtyard window with white convector radiator underneath (Photo 4 left)
  // =========================================================================
  const landingCarpetMat = new THREE.MeshStandardMaterial({
    color: 0xb8b4ae,
    roughness: 0.92,
    metalness: 0.01,
  });
  const darkTimberBeamMat = new THREE.MeshStandardMaterial({
    color: 0x221e1b,
    roughness: 0.72,
    metalness: 0.04,
  });

  // Non-Square Polygonal Floor Slab for Main Staircase Landing (wrapping around the X = -17.63m..-15.36m, Z = -2.50m..-0.58m stairwell void!)
  buildPolygonalFloorSlab(
    scene,
    [
      [-15.36, -2.5],
      [-13.05, -2.5],
      [-13.05, 2.4],
      [-17.9, 2.4],
      [-17.63, -0.58],
      [-15.36, -0.58],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    landingCarpetMat,
    0.5
  );

  // White Balustrade & Handrail Gallery around the Stairwell Opening on the First Floor Landing (Photos 3 & 4)
  const landingRailGroup = new THREE.Group();
  // South gallery handrail along Z = -0.58m (from X = -17.15m to X = -15.36m)
  const southGalleryRail = new THREE.Mesh(
    new THREE.BoxGeometry(1.79, 0.055, 0.065),
    skirtingMat
  );
  southGalleryRail.position.set(-16.255, floorTopY + 0.88, -0.58);
  landingRailGroup.add(southGalleryRail);

  for (let gx = -17.0; gx <= -15.5; gx += 0.15) {
    const spindle = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.84, 0.032),
      skirtingMat
    );
    spindle.position.set(gx, floorTopY + 0.42, -0.58);
    landingRailGroup.add(spindle);
  }

  // East gallery return handrail at X = -15.36m (Z = -1.65m..-0.58m)
  const eastGalleryRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.055, 1.07),
    skirtingMat
  );
  eastGalleryRail.position.set(-15.36, floorTopY + 0.88, -1.115);
  landingRailGroup.add(eastGalleryRail);

  for (let gz = -1.52; gz <= -0.72; gz += 0.16) {
    const spindle = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.84, 0.032),
      skirtingMat
    );
    spindle.position.set(-15.36, floorTopY + 0.42, gz);
    landingRailGroup.add(spindle);
  }

  const cornerNewel = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.98, 0.095),
    skirtingMat
  );
  cornerNewel.position.set(-15.36, floorTopY + 0.49, -0.58);
  landingRailGroup.add(cornerNewel);
  scene.add(landingRailGroup);

  // Issue #1: Solid North Exterior Brick Wall of Main Stair Landing (Z = -2.78m..-2.50m, X = -17.55m..-12.81m — NO window!)
  const northCutawayDescriptor = {
    axis: 'z' as const,
    coord: -2.64,
    minSpan: -17.55,
    maxSpan: -12.81,
    floor: 'first' as const,
  };
  {
    const northW = -12.81 - -17.55; // 4.74m
    const northH = upperWallTopY - floorBaseY;
    const northCx = (-17.55 + -12.81) / 2; // -15.18m
    const northCy = (floorBaseY + upperWallTopY) / 2;
    const northCz = -2.64;

    const northBrickGeo = new THREE.BoxGeometry(northW, northH, 0.28);
    applyWorldSpaceBrickUVs(northBrickGeo, northCx, northCy, northCz);
    const northWallMats: THREE.Material[] = [
      exteriorBrickMat,
      exteriorBrickMat,
      exteriorBrickMat,
      warmRoomPlasterMat,
      warmRoomPlasterMat, // +Z interior upper face (lower half has exposed brick panel below the middle beam)
      exteriorBrickMat,   // -Z exterior North facade
    ];
    const northBrickWall = new THREE.Mesh(northBrickGeo, northWallMats);
    northBrickWall.name = 'upperLanding.northSolidBrickWall';
    northBrickWall.position.set(northCx, northCy, northCz);
    northBrickWall.castShadow = true;
    northBrickWall.receiveShadow = true;
    tagUpperCutawayWall(northBrickWall, northCutawayDescriptor);
    scene.add(northBrickWall);

    const northWallCap = new THREE.Mesh(
      new THREE.BoxGeometry(northW - 0.012, 0.016, 0.268),
      wallCapMat
    );
    northWallCap.position.set(northCx, upperWallTopY - 0.006, northCz);
    tagUpperCutawayWall(northWallCap, northCutawayDescriptor);
    scene.add(northWallCap);

    // Exposed Red-Brick Interior Lower North Wall Panel across the full landing & stairwell width
    // (X = -17.43m..-13.05m, Y = floorTopY..floorTopY + 1.02m, Z = -2.49m — matching media_1790502987279.webp!)
    const lowerBrickW = -13.05 - -17.43; // 4.38m
    const lowerBrickH = 1.02;
    const lowerBrickCx = (-17.43 + -13.05) / 2; // -15.24m
    const lowerBrickCy = floorTopY + lowerBrickH / 2;
    const northInteriorBrickGeo = new THREE.BoxGeometry(lowerBrickW, lowerBrickH, 0.024);
    applyWorldSpaceBrickUVs(northInteriorBrickGeo, lowerBrickCx, lowerBrickCy, -2.49);
    const northInteriorBrickPanel = new THREE.Mesh(
      northInteriorBrickGeo,
      exteriorBrickMat
    );
    northInteriorBrickPanel.name = 'upperLanding.northInteriorBrickPanel';
    northInteriorBrickPanel.position.set(lowerBrickCx, lowerBrickCy, -2.49);
    northInteriorBrickPanel.receiveShadow = true;
    tagUpperCutawayWall(northInteriorBrickPanel, northCutawayDescriptor);
    scene.add(northInteriorBrickPanel);

    // Horizontal Dark-Stained Timber Beam going across the middle of the North wall
    // (Y = floorTopY + 1.05m = 3.21m, X = -17.43m..-13.05m, Z = -2.478m — Issue #1 & media_1790502987279.webp!)
    const northWallMidBeam = new THREE.Mesh(
      new THREE.BoxGeometry(lowerBrickW, 0.13, 0.055),
      darkTimberBeamMat
    );
    northWallMidBeam.name = 'upperLanding.northWallMiddleBeam';
    northWallMidBeam.position.set(lowerBrickCx, floorTopY + 1.05, -2.478);
    northWallMidBeam.castShadow = true;
    northWallMidBeam.receiveShadow = true;
    tagUpperCutawayWall(northWallMidBeam, northCutawayDescriptor);
    scene.add(northWallMidBeam);

    // 2-tier Antique Oak Skirting Board along the landing floor portion of the North wall (X = -15.36m..-13.05m)
    const northSkirtW = -13.05 - -15.36; // 2.31m
    const northSkirtCx = (-15.36 + -13.05) / 2; // -14.205m
    const northSkirtBase = new THREE.Mesh(
      new THREE.BoxGeometry(northSkirtW, 0.122, 0.022),
      antiqueOakSkirtingMat
    );
    northSkirtBase.position.set(northSkirtCx, floorTopY + 0.061, -2.47);
    northSkirtBase.receiveShadow = true;
    tagUpperCutawayWall(northSkirtBase, northCutawayDescriptor);
    scene.add(northSkirtBase);

    const northSkirtCap = new THREE.Mesh(
      new THREE.BoxGeometry(northSkirtW, 0.024, 0.016),
      antiqueOakSkirtingMat
    );
    northSkirtCap.position.set(northSkirtCx, floorTopY + 0.122 + 0.012, -2.473);
    northSkirtCap.receiveShadow = true;
    tagUpperCutawayWall(northSkirtCap, northCutawayDescriptor);
    scene.add(northSkirtCap);
  }

  // South Courtyard Exterior Brick Wall of Main Stair Landing (Z = +2.40m..+2.68m, X = -16.92m..-12.81m)
  // With 2-pane casement window at X = -15.35m (visible in Photo 4 left!)
  addUpperBrickWallAlongXWithWindow(
    -16.92,
    -12.81,
    2.4,
    2.68,
    -15.35,
    1.1,
    2.96,
    3.94,
    'north',
    2
  );

  // White Convector Radiator below the South Landing Window (New Photo 4 bottom-left!)
  const landingSouthRadiator = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.56, 0.085),
    ceramicWhiteMat
  );
  landingSouthRadiator.position.set(-15.35, floorTopY + 0.36, 2.34);
  landingSouthRadiator.castShadow = true;
  tagUpperCutawayWall(landingSouthRadiator, {
    axis: 'z',
    coord: 2.54,
    minSpan: -16.92,
    maxSpan: -12.81,
    floor: 'first',
  });
  scene.add(landingSouthRadiator);

  // Issue #2: Sculpted Organic White-Plastered East Chimney Breast on Main Stair Landing
  // Wide at the base on the left-hand (North, -Z) side (`Z = -1.34m..+0.46m` at the floor)
  // and sweeping smoothly inward in a continuous hand-plastered curve to the ceiling (`Z = -0.48m..+0.34m`)!
  // (Issue #3: Removed the 3 built-in niche shelves on the South side of the chimney breast.)
  {
    const wallX = -13.04;
    const breastH = upperWallTopY - floorTopY;
    const segY = 28;
    const segProfile = 24;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const sampleRingPoint = (t: number, s: number): [number, number] => {
      // Smooth organic S-curve taper along height fraction t in [0, 1]
      const u = Math.pow(t, 1.12);
      const curve = u * u * (3 - 2 * u);
      // Left-hand (North, -Z) side is wide at the base (-1.34m) and sweeps inward to -0.48m at the ceiling
      const zNorth = THREE.MathUtils.lerp(-1.34, -0.48, curve);
      // Right-hand (South, +Z) side tapers gently from +0.46m at the base to +0.34m at the ceiling
      const zSouth = THREE.MathUtils.lerp(0.46, 0.34, curve);
      // Westward (-X) projection from wallX tapers from 0.52m at the base to 0.38m at the ceiling
      const projW =
        THREE.MathUtils.lerp(0.52, 0.38, curve) +
        0.01 * Math.sin(t * Math.PI);
      const cornerR = 0.075;

      // Cross-section parameter s in [0, 1] from North-East wall corner -> NW rounded corner -> West face -> SW rounded corner -> South-East wall corner
      if (s <= 0.22) {
        const k = s / 0.22;
        const x = wallX - k * (projW - cornerR);
        const z = zNorth;
        return [x, z];
      }
      if (s <= 0.34) {
        const ang = ((s - 0.22) / 0.12) * (Math.PI * 0.5);
        const cx = wallX - (projW - cornerR);
        const cz = zNorth + cornerR;
        return [cx - Math.sin(ang) * cornerR, cz - Math.cos(ang) * cornerR];
      }
      if (s <= 0.66) {
        const k = (s - 0.34) / 0.32;
        const z = THREE.MathUtils.lerp(zNorth + cornerR, zSouth - cornerR, k);
        // Subtle organic pillowing crown across the front face
        const pillow = Math.sin(k * Math.PI) * 0.014;
        return [wallX - projW - pillow, z];
      }
      if (s <= 0.78) {
        const ang = ((s - 0.66) / 0.12) * (Math.PI * 0.5);
        const cx = wallX - (projW - cornerR);
        const cz = zSouth - cornerR;
        return [cx - Math.cos(ang) * cornerR, cz + Math.sin(ang) * cornerR];
      }
      const k = (s - 0.78) / 0.22;
      const x = THREE.MathUtils.lerp(wallX - (projW - cornerR), wallX, k);
      return [x, zSouth];
    };

    const stride = segProfile + 1;
    for (let iy = 0; iy <= segY; iy++) {
      const t = iy / segY;
      const y = floorTopY + t * breastH;
      for (let ip = 0; ip <= segProfile; ip++) {
        const s = ip / segProfile;
        const [px, pz] = sampleRingPoint(t, s);
        positions.push(px, y, pz);
        uvs.push(s * 2.2, t * 1.6);
      }
    }

    for (let iy = 0; iy < segY; iy++) {
      for (let ip = 0; ip < segProfile; ip++) {
        const a = iy * stride + ip;
        const b = a + 1;
        const c = (iy + 1) * stride + ip;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const chimneyGeo = new THREE.BufferGeometry();
    chimneyGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    chimneyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    chimneyGeo.setIndex(indices);
    chimneyGeo.computeVertexNormals();

    const chimneyMesh = new THREE.Mesh(chimneyGeo, warmRoomPlasterMat);
    chimneyMesh.name = 'upperLanding.eastChimneyBreast';
    chimneyMesh.castShadow = true;
    chimneyMesh.receiveShadow = true;
    scene.add(chimneyMesh);

    // Cutaway top cap matching the ceiling footprint of the organic chimney breast
    const topCapDepthZ = 0.34 - -0.48; // 0.82m
    const topCapCenterZ = (-0.48 + 0.34) / 2; // -0.07m
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.025, topCapDepthZ),
      wallCapMat
    );
    topCap.position.set(wallX - 0.19, upperWallTopY + 0.012, topCapCenterZ);
    scene.add(topCap);

    // Issue #5: Wrap-around 2-tier Antique Oak Skirting Board around the base of the East Chimney Breast
    // (`X = -13.05m..-13.56m`, `Z = -1.34m..+0.46m`, matching the 122mm base + 24mm stepped cap downstairs!)
    const baseZNorth = -1.34;
    const baseZSouth = 0.46;
    const baseWestX = -13.56;
    const baseEastX = -13.04;
    const baseDepthX = baseEastX - baseWestX; // 0.52m
    const baseWidthZ = baseZSouth - baseZNorth; // 1.80m
    const baseCenterX = (baseWestX + baseEastX) / 2; // -13.30m
    const baseCenterZ = (baseZNorth + baseZSouth) / 2; // -0.44m

    const breastSkirtBase = new THREE.Mesh(
      new THREE.BoxGeometry(baseDepthX + 0.036, 0.122, baseWidthZ + 0.036),
      antiqueOakSkirtingMat
    );
    breastSkirtBase.position.set(baseCenterX - 0.008, floorTopY + 0.061, baseCenterZ);
    breastSkirtBase.receiveShadow = true;
    scene.add(breastSkirtBase);

    const breastSkirtCap = new THREE.Mesh(
      new THREE.BoxGeometry(baseDepthX + 0.024, 0.024, baseWidthZ + 0.024),
      antiqueOakSkirtingMat
    );
    breastSkirtCap.position.set(
      baseCenterX - 0.005,
      floorTopY + 0.122 + 0.012,
      baseCenterZ
    );
    breastSkirtCap.receiveShadow = true;
    scene.add(breastSkirtCap);
  }

  // Heavy Dark Black-Stained Overhead Ceiling Spine Beam & Diagonal Chimney Braces on the Landing (New Photos 3 & 4)
  const landingDarkSpineBeam = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.18, 0.18),
    darkTimberBeamMat
  );
  landingDarkSpineBeam.position.set(-15.35, upperWallTopY - 0.1, -0.58);
  landingDarkSpineBeam.castShadow = true;
  ceilingMeshGroup.add(landingDarkSpineBeam);

  // Non-Square West Load-Bearing Cross-Wall between Main Stair Landing and Bedroom 2
  // (0.24m thick, [-17.55, -2.50] -> [-17.90, +2.40] — aligned with Ground Floor Hall/Front Room cross-wall!)
  const upperLandingCrossWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-17.55, -2.5],
    end: [-17.9, 2.4],
    thickness: 0.24,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
  });

  // Exposed Dark Black-Stained Timber Wall Framing Posts & Head Beam on the West Landing Wall (New Photo 4 right)
  for (const postU of [1.92, 3.32, 4.46]) {
    const timberPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, upperWallTopY - floorTopY, 0.05),
      darkTimberBeamMat
    );
    timberPost.position.copy(
      upperLandingCrossWallFrame.toWorld(postU, (floorTopY + upperWallTopY) / 2, -0.125)
    );
    timberPost.rotation.y = upperLandingCrossWallFrame.rotationY;
    tagUpperCutawayWall(timberPost, {
      axis: 'x',
      coord: -17.72,
      minSpan: -2.5,
      maxSpan: 2.4,
      floor: 'first',
    });
    scene.add(timberPost);
  }
  const westWallTimberHeadBeam = new THREE.Mesh(
    new THREE.BoxGeometry(2.68, 0.15, 0.05),
    darkTimberBeamMat
  );
  westWallTimberHeadBeam.position.copy(
    upperLandingCrossWallFrame.toWorld(3.22, upperWallTopY - 0.12, -0.125)
  );
  westWallTimberHeadBeam.rotation.y = upperLandingCrossWallFrame.rotationY;
  tagUpperCutawayWall(westWallTimberHeadBeam, {
    axis: 'x',
    coord: -17.72,
    minSpan: -2.5,
    maxSpan: 2.4,
    floor: 'first',
  });
  scene.add(westWallTimberHeadBeam);
}
