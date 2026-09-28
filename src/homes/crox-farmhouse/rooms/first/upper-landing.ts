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
    addUpperInteriorWall,
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
  //    - Tapered/corbelled white-plastered East chimney breast with 3-shelf recessed wall niche (Photo 3)
  //    - Exposed red-brick interior North wall panel next to the chimney breast (Photo 3 left)
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

  // North Exterior Brick Wall of Main Stair Landing (Z = -2.78m..-2.50m, X = -17.55m..-12.81m)
  addUpperBrickWallAlongXWithWindow(
    -17.55,
    -12.81,
    -2.78,
    -2.5,
    -14.95,
    1.25,
    2.96,
    3.94,
    'south',
    2
  );

  // Exposed Red-Brick Interior North Wall Panel between the stairwell and East chimney breast (New Photo 3 left!)
  const northInteriorBrickGeo = new THREE.BoxGeometry(1.42, upperWallTopY - floorTopY, 0.04);
  applyWorldSpaceBrickUVs(
    northInteriorBrickGeo,
    -13.76,
    (floorTopY + upperWallTopY) / 2,
    -2.48
  );
  const northInteriorBrickPanel = new THREE.Mesh(northInteriorBrickGeo, exteriorBrickMat);
  northInteriorBrickPanel.position.set(-13.76, (floorTopY + upperWallTopY) / 2, -2.48);
  tagUpperCutawayWall(northInteriorBrickPanel, {
    axis: 'z',
    coord: -2.64,
    minSpan: -17.55,
    maxSpan: -12.81,
    floor: 'first',
  });
  scene.add(northInteriorBrickPanel);

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

  // Tapered/Corbelled White-Plastered East Chimney Breast on Main Stair Landing (New Photo 3 center)
  // Lower chimney breast body (Y = floorTopY..floorTopY + 1.15m, Z = -0.76m..+0.44m)
  addUpperInteriorWall(-13.28, floorTopY, floorTopY + 1.15, -0.16, 0.46, 1.2, warmRoomPlasterMat);
  // Corbelled upper flue stack tapering inwards towards the ceiling (Y = floorTopY + 1.15m..upperWallTopY, Z = -0.58m..+0.26m)
  addUpperInteriorWall(-13.28, floorTopY + 1.15, upperWallTopY, -0.16, 0.46, 0.84, warmRoomPlasterMat);

  // Recessed 3-Shelf Built-In Wall Niche on the South side of the East Chimney Breast (New Photo 3 center-right)
  for (const ny of [0.95, 1.25, 1.55]) {
    const nicheShelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.025, 0.38),
      skirtingMat
    );
    nicheShelf.position.set(-13.12, floorTopY + ny, 0.68);
    tagUpperCutawayWall(nicheShelf, {
      axis: 'x',
      coord: -13.12,
      minSpan: -0.8,
      maxSpan: 0.9,
      floor: 'first',
    });
    scene.add(nicheShelf);
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
