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

  const collarCeilingY = 4.52;

  // Non-Square Polygonal Floor Slab for Main Staircase Landing (wrapping around the X = -17.69m..-15.36m, Z = -2.50m..-0.58m stairwell void!)
  buildPolygonalFloorSlab(
    scene,
    [
      [-15.36, -2.5],
      [-13.05, -2.5],
      [-13.05, 2.4],
      [-17.9, 2.4],
      [-17.69, -0.58],
      [-15.36, -0.58],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    landingCarpetMat,
    0.5
  );

  // White Balustrade & Handrail Gallery around the Stairwell Opening on the First Floor Landing (Photos 3 & 4)
  // Issue #8: Extend South gallery handrail & balustrade along Z = -0.58m all the way to the West cross-wall (X = -17.57m..-15.36m)
  const landingRailGroup = new THREE.Group();
  landingRailGroup.name = 'upperLanding.balustrade';
  const southRailStartX = -17.57;
  const southRailEndX = -15.36;
  const southRailSpan = southRailEndX - southRailStartX; // 2.21m
  const southRailCenterX = (southRailStartX + southRailEndX) / 2; // -16.465m

  const southGalleryRail = new THREE.Mesh(
    new THREE.BoxGeometry(southRailSpan, 0.055, 0.065),
    skirtingMat
  );
  southGalleryRail.name = 'upperLanding.southGalleryRail';
  southGalleryRail.position.set(southRailCenterX, floorTopY + 0.88, -0.58);
  southGalleryRail.castShadow = true;
  landingRailGroup.add(southGalleryRail);

  const southGalleryShoeRail = new THREE.Mesh(
    new THREE.BoxGeometry(southRailSpan, 0.032, 0.052),
    skirtingMat
  );
  southGalleryShoeRail.position.set(southRailCenterX, floorTopY + 0.016, -0.58);
  landingRailGroup.add(southGalleryShoeRail);

  const southSpindleCount = 14;
  for (let i = 0; i < southSpindleCount; i++) {
    const gx = THREE.MathUtils.lerp(-17.43, -15.5, i / (southSpindleCount - 1));
    const spindle = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.84, 0.032),
      skirtingMat
    );
    spindle.position.set(gx, floorTopY + 0.436, -0.58);
    spindle.castShadow = true;
    landingRailGroup.add(spindle);
  }

  // West wall half-newel post where the South gallery rail meets the West cross-wall (X = -17.54m, Z = -0.58m)
  const westWallNewel = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.96, 0.095),
    skirtingMat
  );
  westWallNewel.name = 'upperLanding.westWallNewel';
  westWallNewel.position.set(-17.535, floorTopY + 0.48, -0.58);
  westWallNewel.castShadow = true;
  landingRailGroup.add(westWallNewel);

  const westWallNewelCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.082, 0.026, 0.112),
    skirtingMat
  );
  westWallNewelCap.position.set(-17.535, floorTopY + 0.973, -0.58);
  landingRailGroup.add(westWallNewelCap);

  // East gallery return handrail at X = -15.36m (Z = -1.65m..-0.58m)
  const eastGalleryRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.055, 1.07),
    skirtingMat
  );
  eastGalleryRail.name = 'upperLanding.eastGalleryRail';
  eastGalleryRail.position.set(-15.36, floorTopY + 0.88, -1.115);
  eastGalleryRail.castShadow = true;
  landingRailGroup.add(eastGalleryRail);

  const eastGalleryShoeRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.032, 1.07),
    skirtingMat
  );
  eastGalleryShoeRail.position.set(-15.36, floorTopY + 0.016, -1.115);
  landingRailGroup.add(eastGalleryShoeRail);

  for (let gz = -1.52; gz <= -0.72; gz += 0.16) {
    const spindle = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.84, 0.032),
      skirtingMat
    );
    spindle.position.set(-15.36, floorTopY + 0.436, gz);
    spindle.castShadow = true;
    landingRailGroup.add(spindle);
  }

  const cornerNewel = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.96, 0.095),
    skirtingMat
  );
  cornerNewel.name = 'upperLanding.cornerNewel';
  cornerNewel.position.set(-15.36, floorTopY + 0.48, -0.58);
  cornerNewel.castShadow = true;
  landingRailGroup.add(cornerNewel);

  const cornerNewelCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.114, 0.026, 0.114),
    skirtingMat
  );
  cornerNewelCap.position.set(-15.36, floorTopY + 0.973, -0.58);
  landingRailGroup.add(cornerNewelCap);

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

    // Issue #2: Exposed Red-Brick Interior Lower North Wall Panel sitting cleanly above the continuous oak stringer/skirting
    // (X = -17.48m..-13.05m, Y = floorTopY + 0.142m..floorTopY + 1.05m, Z = -2.496m — zero overlap or Z-fighting with stringer!)
    const lowerBrickW = -13.05 - -17.48; // 4.43m
    const lowerBrickBottomY = floorTopY + 0.142;
    const lowerBrickTopY = floorTopY + 1.05;
    const lowerBrickH = lowerBrickTopY - lowerBrickBottomY; // 0.908m
    const lowerBrickCx = (-17.48 + -13.05) / 2; // -15.265m
    const lowerBrickCy = (lowerBrickBottomY + lowerBrickTopY) / 2;
    const northInteriorBrickGeo = new THREE.BoxGeometry(lowerBrickW, lowerBrickH, 0.012);
    applyWorldSpaceBrickUVs(northInteriorBrickGeo, lowerBrickCx, lowerBrickCy, -2.496);
    const northInteriorBrickPanel = new THREE.Mesh(
      northInteriorBrickGeo,
      exteriorBrickMat
    );
    northInteriorBrickPanel.name = 'upperLanding.northInteriorBrickPanel';
    northInteriorBrickPanel.position.set(lowerBrickCx, lowerBrickCy, -2.496);
    northInteriorBrickPanel.receiveShadow = true;
    tagUpperCutawayWall(northInteriorBrickPanel, northCutawayDescriptor);
    scene.add(northInteriorBrickPanel);

    // Horizontal Dark-Stained Timber Beam going across the middle of the North wall
    // (Y = floorTopY + 1.05m = 3.21m, X = -17.48m..-13.05m, Z = -2.478m — Issue #1 & media_1790502987279.webp!)
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
  }

  // Issues #4 & #6: Thicker South Courtyard Exterior Brick Wall of Main Stair Landing (0.46m thick: Z = +2.22m..+2.68m, X = -16.92m..-12.81m)
  // With shorter 3-pane cottage casement window & deep splayed reveal at X = -15.35m (media_1790502987279.webp & media_1790502987242.webp!)
  addUpperBrickWallAlongXWithWindow(
    -16.92,
    -12.81,
    2.22,
    2.68,
    -15.35,
    1.16,
    3.02,
    3.78,
    'north',
    3
  );

  // Issue #3: Floor-Standing Cast-Iron 4-Column Traditional Radiator below the South Landing Window
  // Replaces the old wall-hung white convector box at X = -15.35m, standing on the landing floor in front of Z = 2.22m
  {
    const southCutawayDescriptor = {
      axis: 'z' as const,
      coord: 2.45,
      minSpan: -16.92,
      maxSpan: -12.81,
      floor: 'first' as const,
    };
    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x36393c,
      roughness: 0.42,
      metalness: 0.72,
    });
    const radiatorBrassMat = new THREE.MeshStandardMaterial({
      color: 0x9c7e44,
      roughness: 0.32,
      metalness: 0.82,
    });

    const radiatorGroup = new THREE.Group();
    radiatorGroup.name = 'upperLanding.southCastIronRadiator';
    const radCenterX = -15.35;
    const radCenterZ = 2.11;
    radiatorGroup.position.set(radCenterX, floorTopY, radCenterZ);

    const numSections = 14;
    const sectionPitch = 0.064;
    const totalWidth = (numSections - 1) * sectionPitch; // 0.832m
    const legClearanceY = 0.085;
    const bodyHeight = 0.565; // Top of radiator at Y = floorTopY + 0.65m
    const bodyCenterY = legClearanceY + bodyHeight / 2;
    const topBarrelY = legClearanceY + bodyHeight - 0.042;
    const botBarrelY = legClearanceY + 0.042;

    // Top & bottom horizontal cast-iron water collector barrels connecting all sections
    for (const barrelY of [botBarrelY, topBarrelY]) {
      const collectorBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, totalWidth + 0.05, 12),
        castIronMat
      );
      collectorBarrel.rotation.z = Math.PI / 2;
      collectorBarrel.position.set(0, barrelY, 0);
      collectorBarrel.castShadow = true;
      collectorBarrel.receiveShadow = true;
      radiatorGroup.add(collectorBarrel);
    }

    // Individual 4-column cast-iron sections with integral splayed feet on the outer & center support sections
    const colZOffsets = [-0.051, -0.017, 0.017, 0.051];
    for (let i = 0; i < numSections; i++) {
      const sx = -totalWidth / 2 + i * sectionPitch;
      const isFootSection = i === 0 || i === numSections - 1;

      // Top and bottom cast manifold crowns for this section
      for (const crownY of [botBarrelY, topBarrelY]) {
        const crown = new THREE.Mesh(
          new THREE.BoxGeometry(0.042, 0.052, 0.142),
          castIronMat
        );
        crown.position.set(sx, crownY, 0);
        crown.castShadow = true;
        crown.receiveShadow = true;
        radiatorGroup.add(crown);
      }

      // 4 vertical cast-iron tube columns per section
      for (const cz of colZOffsets) {
        const colTube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0115, 0.0115, bodyHeight - 0.03, 10),
          castIronMat
        );
        colTube.position.set(sx, bodyCenterY, cz);
        colTube.castShadow = true;
        colTube.receiveShadow = true;
        radiatorGroup.add(colTube);
      }

      // Integral splayed cast-iron feet resting directly on the landing carpet at the outer sections
      if (isFootSection) {
        for (const fzSign of [-1, 1]) {
          const footLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.036, legClearanceY + 0.025, 0.032),
            castIronMat
          );
          footLeg.position.set(sx, (legClearanceY + 0.025) / 2, fzSign * 0.054);
          footLeg.rotation.x = fzSign * 0.12;
          footLeg.castShadow = true;
          radiatorGroup.add(footLeg);

          const footPad = new THREE.Mesh(
            new THREE.BoxGeometry(0.044, 0.014, 0.046),
            castIronMat
          );
          footPad.position.set(sx, 0.007, fzSign * 0.06);
          radiatorGroup.add(footPad);
        }
      }
    }

    // Cast-iron wall stays anchoring the radiator back into the thick South wall (Z = 2.22m -> local Z = +0.11m)
    for (const stayX of [-totalWidth / 2 + sectionPitch * 2, totalWidth / 2 - sectionPitch * 2]) {
      const wallStay = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.11, 8),
        castIronMat
      );
      wallStay.rotation.x = Math.PI / 2;
      wallStay.position.set(stayX, topBarrelY, 0.055);
      radiatorGroup.add(wallStay);
    }

    // Traditional aged-brass TRV & lockshield valves + vertical copper/brass riser pipes from the floor
    for (const sideSign of [-1, 1]) {
      const valveX = sideSign * (totalWidth / 2 + 0.055);
      const riserPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, botBarrelY + 0.02, 10),
        radiatorBrassMat
      );
      riserPipe.position.set(valveX, (botBarrelY + 0.02) / 2, 0);
      riserPipe.castShadow = true;
      radiatorGroup.add(riserPipe);

      const floorCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.024, 0.012, 12),
        radiatorBrassMat
      );
      floorCollar.position.set(valveX, 0.006, 0);
      radiatorGroup.add(floorCollar);

      const valveBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.036, 0.036),
        radiatorBrassMat
      );
      valveBody.position.set(valveX - sideSign * 0.012, botBarrelY, 0);
      radiatorGroup.add(valveBody);

      const wheelHead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.014, 0.042, 10),
        radiatorBrassMat
      );
      wheelHead.position.set(valveX, botBarrelY + 0.035, 0);
      radiatorGroup.add(wheelHead);
    }

    tagUpperCutawayWall(radiatorGroup, southCutawayDescriptor);
    scene.add(radiatorGroup);
  }

  // Issue #1 & Issue #2: Sculpted Organic White-Plastered East Chimney Breast on Main Stair Landing
  // Wide at the base on the left-hand (North, -Z) side (`Z = -1.34m..+0.46m` at the floor)
  // and sweeping smoothly inward in a continuous hand-plastered curve to the raised 4.52m ceiling (`Z = -0.48m..+0.34m`)!
  {
    const wallX = -13.04;
    const breastH = collarCeilingY - floorTopY;
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

    // Issue #1: Outward-facing counter-clockwise triangle winding (a, b, c, b, d, c) so vertex normals point
    // West (-X), North (-Z), and South (+Z) into the Upper Landing instead of being backface-culled!
    for (let iy = 0; iy < segY; iy++) {
      for (let ip = 0; ip < segProfile; ip++) {
        const a = iy * stride + ip;
        const b = a + 1;
        const c = (iy + 1) * stride + ip;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    // Close the back face along wallX so the chimney breast is a manifold solid
    for (let iy = 0; iy < segY; iy++) {
      const nBot = iy * stride;
      const sBot = iy * stride + segProfile;
      const nTop = (iy + 1) * stride;
      const sTop = (iy + 1) * stride + segProfile;
      indices.push(sBot, nBot, sTop, nBot, nTop, sTop);
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
    topCap.position.set(wallX - 0.19, collarCeilingY - 0.012, topCapCenterZ);
    scene.add(topCap);

    // Curved 2-tier Antique Oak Skirting Board lofted directly along the organic base curve of the East Chimney Breast
    const buildChimneySkirtBand = (
      name: string,
      y0: number,
      y1: number,
      outset: number
    ): THREE.Mesh => {
      const bandPos: number[] = [];
      const bandUvs: number[] = [];
      const bandIdx: number[] = [];
      const basePts: Array<[number, number]> = [];
      for (let ip = 0; ip <= segProfile; ip++) {
        basePts.push(sampleRingPoint(0, ip / segProfile));
      }
      const outPts: Array<[number, number]> = basePts.map(([px, pz], ip) => {
        const prev = basePts[Math.max(0, ip - 1)];
        const next = basePts[Math.min(segProfile, ip + 1)];
        const tx = next[0] - prev[0];
        const tz = next[1] - prev[1];
        const len = Math.hypot(tx, tz) || 1;
        // Outward normal in XZ plane for path running North -> West -> South is (-tz, tx) / len
        const nx = -tz / len;
        const nz = tx / len;
        return [px + nx * outset, pz + nz * outset];
      });

      for (let iy = 0; iy <= 1; iy++) {
        const y = iy === 0 ? y0 : y1;
        for (let ip = 0; ip <= segProfile; ip++) {
          const [ox, oz] = outPts[ip];
          bandPos.push(ox, y, oz);
          bandUvs.push((ip / segProfile) * 2.2, iy * 0.15);
        }
      }
      for (let ip = 0; ip < segProfile; ip++) {
        const a = ip;
        const b = ip + 1;
        const c = stride + ip;
        const d = c + 1;
        bandIdx.push(a, b, c, b, d, c);
      }

      // Top ledge cap connecting outPts back to the chimney breast basePts at y1
      const topStart = bandPos.length / 3;
      for (let ip = 0; ip <= segProfile; ip++) {
        const [bx, bz] = basePts[ip];
        const [ox, oz] = outPts[ip];
        bandPos.push(bx, y1, bz, ox, y1, oz);
        bandUvs.push((ip / segProfile) * 2.2, 0, (ip / segProfile) * 2.2, 0.04);
      }
      for (let ip = 0; ip < segProfile; ip++) {
        const a = topStart + ip * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        bandIdx.push(a, b, c, b, d, c);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(bandPos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(bandUvs, 2));
      geo.setIndex(bandIdx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, antiqueOakSkirtingMat);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    scene.add(
      buildChimneySkirtBand(
        'upperLanding.eastChimneyBreast.skirtBase',
        floorTopY,
        floorTopY + 0.122,
        0.022
      )
    );
    scene.add(
      buildChimneySkirtBand(
        'upperLanding.eastChimneyBreast.skirtCap',
        floorTopY + 0.122,
        floorTopY + 0.146,
        0.016
      )
    );
  }

  // Issue #5: Heavy Dark Black-Stained Overhead Ceiling Spine Beam along the raised 4.52m collar ceiling edge (Photos 3 & 4)
  const landingDarkSpineBeam = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.18, 0.18),
    darkTimberBeamMat
  );
  landingDarkSpineBeam.name = 'upperLanding.darkSpineBeam';
  landingDarkSpineBeam.position.set(-15.35, collarCeilingY - 0.09, -1.12);
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

  // Issue #5: Upper Vaulted Trapezoidal Gable Extension on the West Landing Cross-Wall (Y = 4.16m..4.52m)
  // Matches the exact North & South skeiling slopes (Z = -1.90m..+1.80m at Y = 4.16m tapering to Z = -1.15m..+1.05m at Y = 4.52m)
  {
    const westGableShape = new THREE.Shape();
    westGableShape.moveTo(0.6, upperWallTopY);
    westGableShape.lineTo(4.3, upperWallTopY);
    westGableShape.lineTo(3.55, collarCeilingY);
    westGableShape.lineTo(1.35, collarCeilingY);
    westGableShape.closePath();
    const westGableGeo = new THREE.ExtrudeGeometry(westGableShape, {
      depth: 0.236,
      bevelEnabled: false,
    });
    westGableGeo.translate(0, 0, -0.118);
    const westUpperGable = new THREE.Mesh(westGableGeo, warmRoomPlasterMat);
    westUpperGable.name = 'upperLanding.westWallUpperGable';
    westUpperGable.position.copy(upperLandingCrossWallFrame.toWorld(0, 0, 0));
    westUpperGable.rotation.y = upperLandingCrossWallFrame.rotationY;
    westUpperGable.castShadow = true;
    westUpperGable.receiveShadow = true;
    tagUpperCutawayWall(westUpperGable, {
      axis: 'x',
      coord: -17.72,
      minSpan: -2.5,
      maxSpan: 2.4,
      floor: 'first',
    });
    scene.add(westUpperGable);
  }

  // Exposed Dark Black-Stained Timber Wall Framing Posts & Head Beam on the West Landing Wall (New Photo 4 right)
  for (const postU of [1.92, 3.32, 4.46]) {
    const postTopY = postU <= 3.5 ? collarCeilingY : upperWallTopY;
    const timberPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, postTopY - floorTopY, 0.05),
      darkTimberBeamMat
    );
    timberPost.position.copy(
      upperLandingCrossWallFrame.toWorld(postU, (floorTopY + postTopY) / 2, -0.125)
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
