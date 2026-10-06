import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { buildHallStaircase } from './hall-staircase.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

/**
 * Sitting Room (`sittingRoom`) red-brick inglenook fireplace, alcove bookcases, TV and speakers.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildSittingRoomFireplace(
  ctx: SceneBuilderContext,
  kit: Pick<
    ReturnType<typeof createGroundFloorMaterials>,
    | 'antiqueOakSkirtingMat'
    | 'brassMat'
    | 'castIronMat'
    | 'ceramicWhiteMat'
    | 'exteriorBrickMat'
    | 'frontWallH'
    | 'singleClayBrickMat'
    | 'skirtingMat'
  > &
    Pick<
      ReturnType<typeof createGroundFloorShellKit>,
      'addSlattedRadiatorCover' | 'eastCourtyardWallAngleY' | 'getEastCourtyardWallCenterX'
    > &
    Pick<ReturnType<typeof defineTier2Levels>, 'frontTier2WallH' | 'tier2FloorY'> &
    Pick<ReturnType<typeof buildHallStaircase>, 'buildQAcousticsSpeaker'>
): void {
  const { interactions, lightGroups, scene } = ctx;
  const {
    addSlattedRadiatorCover,
    antiqueOakSkirtingMat,
    brassMat,
    buildQAcousticsSpeaker,
    castIronMat,
    ceramicWhiteMat,
    eastCourtyardWallAngleY,
    exteriorBrickMat,
    frontTier2WallH,
    frontWallH,
    getEastCourtyardWallCenterX,
    singleClayBrickMat,
    skirtingMat,
    tier2FloorY,
  } = kit;
  // =========================================================================
  // LIVING ROOM EXPOSED RED-BRICK INGLENOOK FIREPLACE & BESPOKE ALCOVE BOOKCASES
  // (Issues #1, #2, #3:
  //  - Issue #3: Chimney breast is 8.5 bricks wide (`1.70m` across `X = -20.65m..-18.95m`, `1 brick = 0.20m`),
  //    with 1.5-brick piers (`pierW = 0.30m`) on either side and a 5.5-brick (`1.10m`) firebox opening (`X = -20.35m..-19.25m`)!
  //  - Issue #2: Lower brick piers from the top of the 1-course hearth (`Y = -0.5215m`) to the top of the pier (`Y = +0.814m`)
  //    span `1.3355m` = exact 17 courses of bricks (`1 course = 0.07855m`)!
  //  - Issue #1: Upper brick chimney breast from `Y = +0.814m` up to the underside of the white lintel beam (`Y = +1.364m`)
  //    spans `0.55m` = exact 7 courses of bricks (`7 × 0.07855m`), with the 0.18m white lintel (`Y = +1.364m..+1.544m`)
  //    and 1 course of brick (`0.081m`, `Y = +1.544m..+1.625m`) above it up to the lowered `frontWallH = 1.625m` ceiling!)
  // =========================================================================
  const livingFpGroup = new THREE.Group();
  livingFpGroup.name = 'sittingRoom.fireplace';
  livingFpGroup.userData.zone = 'sittingRoom';

  // Calibrated brick UV mapper for the Sitting Room fireplace so `createImperialBrickTextures`
  // (which has 6 stretcher-equivalents horizontally and 16 courses vertically per UV tile) renders:
  // - Horizontally: 1 brick = 0.20m (`tileW = 6 * 0.20 = 1.20m`, anchored at `X = -18.95m`) -> 1.70m = exact 8.5 bricks (Issue #3)
  // - Vertically: 1 course = 0.07855m (`tileH = 16 * 0.07855 = 1.2568m`, anchored at `Y = -0.5215m` hearth top) ->
  //   lower pier (`1.3355m`) = exact 17 courses (Issue #2) and upper breast (`0.55m`) = exact 7 courses (Issue #1)!
  const applyFireplaceBrickUVs = (
    geo: THREE.BufferGeometry,
    offsetX = 0,
    offsetY = 0,
    offsetZ = 0
  ): void => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return;
    const tileW = 1.2; // 6 bricks * 0.20m/brick -> 1.70m width = 8.5 bricks
    const tileH = 1.2568; // 16 courses * 0.07855m/course -> 1.3355m = 17 courses, 0.55m = 7 courses
    const anchorX = -18.95;
    const anchorY = -0.5215;
    const anchorZ = 7.68;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + offsetX;
      const wy = pos.getY(i) + offsetY;
      const wz = pos.getZ(i) + offsetZ;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      if (ny > 0.6) {
        uv.setXY(i, (wx - anchorX) / tileW, (wz - anchorZ) / tileW);
      } else if (nx > 0.6) {
        uv.setXY(i, (wz - anchorZ) / tileW, (wy - anchorY) / tileH);
      } else {
        uv.setXY(i, (wx - anchorX) / tileW, (wy - anchorY) / tileH);
      }
    }
    uv.needsUpdate = true;
    geo.computeBoundingSphere();
  };

  // 1. Left (East, X = -18.95m..-19.25m) & Right (West, X = -20.35m..-20.65m) 1.5-Brick Piers (`pierW = 0.30m`)
  //    flanking the 5.5-brick (`1.10m`) recessed brick inglenook firebox (`Z = +7.68m..+8.15m` — Issues #2 & #3)
  //    Total pier height from floor (`Y = -0.60m`) to `Y = +0.814m` is `1.414m` (`1.3355m = 17 courses` above the `0.0785m` hearth)!
  const pierH = 1.414;
  const pierW = 0.3; // 1.5 bricks wide (0.30m) so 1.5 + 5.5 + 1.5 = 8.5 bricks (1.70m) total width
  for (const [pierX, pierSide] of [
    [-19.1, 'east'],
    [-20.5, 'west'],
  ] as const) {
    const pierGeo = new THREE.BoxGeometry(pierW, pierH, 0.47);
    applyFireplaceBrickUVs(pierGeo, pierX, tier2FloorY + pierH * 0.5, 7.915);
    const pierMesh = new THREE.Mesh(pierGeo, exteriorBrickMat);
    pierMesh.name = `sittingRoom.fireplace.pier.${pierSide}`;
    pierMesh.position.set(pierX, tier2FloorY + pierH * 0.5, 7.915);
    pierMesh.castShadow = true;
    pierMesh.receiveShadow = true;
    livingFpGroup.add(pierMesh);
  }

  // Upper Exposed Red-Brick Chimney Breast: 7 courses of bricks (`0.55m`) from `Y = +0.814m` (`tier2FloorY + 1.414m`)
  // up to the underside of the white timber bressummer beam (`Y = +1.364m`, `tier2FloorY + 1.964m` — Issue #1 & Issue #3!)
  const upperBreastH = 0.55; // 7 courses * 0.07855m/course = 0.55m
  const upperBreastMidY = tier2FloorY + pierH + upperBreastH * 0.5; // +1.089m
  const upperBreastGeo = new THREE.BoxGeometry(1.7, upperBreastH, 0.47);
  applyFireplaceBrickUVs(upperBreastGeo, -19.8, upperBreastMidY, 7.915);
  const upperBreastMesh = new THREE.Mesh(upperBreastGeo, exteriorBrickMat);
  upperBreastMesh.name = 'sittingRoom.fireplace.upperBreast';
  upperBreastMesh.position.set(-19.8, upperBreastMidY, 7.915);
  upperBreastMesh.castShadow = true;
  upperBreastMesh.receiveShadow = true;
  livingFpGroup.add(upperBreastMesh);

  // Flush White-Painted Timber Bressummer Beam across the upper brick breast
  // (`Y = +1.364m..+1.544m` = `tier2FloorY + 1.964m..+2.144m`, height = `0.18m`)
  // with ONLY ONE COURSE of exposed red brick (`0.081m`) above it up to the `frontWallH = 1.625m` ceiling (Issue #1!)
  const livingFpWhiteLintel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(1.71, 0.18, 0.48)),
    skirtingMat
  );
  livingFpWhiteLintel.name = 'sittingRoom.fireplace.whiteLintel';
  livingFpWhiteLintel.position.set(-19.8, tier2FloorY + 2.054, 7.915);
  livingFpWhiteLintel.castShadow = true;
  livingFpWhiteLintel.receiveShadow = true;
  livingFpGroup.add(livingFpWhiteLintel);

  const topFriezeBrickH = 0.081; // 1 brick course above white beam (`Y = +1.544m..+1.625m`) up to `frontWallH = 1.625m`
  const topFriezeMidY = tier2FloorY + 2.144 + topFriezeBrickH * 0.5; // +1.5845m
  const topFriezeBrickGeo = new THREE.BoxGeometry(1.7, topFriezeBrickH, 0.47);
  applyFireplaceBrickUVs(topFriezeBrickGeo, -19.8, topFriezeMidY, 7.915);
  const topFriezeBrick = new THREE.Mesh(topFriezeBrickGeo, exteriorBrickMat);
  topFriezeBrick.name = 'sittingRoom.fireplace.topFriezeCourse';
  topFriezeBrick.position.set(-19.8, topFriezeMidY, 7.915);
  topFriezeBrick.castShadow = true;
  livingFpGroup.add(topFriezeBrick);

  // 2. Cambered Soldier-Course Red-Brick Arch with Projecting Central Keystone & Black Wrought-Iron Arch Bar
  //    spanning the 5.5-brick (`1.10m`) firebox opening (`X = -19.25m..-20.35m`, `Y ≈ +0.75m..+0.83m`, `Z = +7.68m`)
  const archBricks = 17;
  const standardArchBrickGeo = createSharedGeo(new THREE.BoxGeometry(0.064, 0.16, 0.12));
  const keystoneArchBrickGeo = createSharedGeo(new THREE.BoxGeometry(0.064, 0.2, 0.12));
  for (let i = 0; i < archBricks; i++) {
    const u = (i - (archBricks - 1) / 2) / ((archBricks - 1) / 2); // -1..+1
    const isKeystone = i === Math.floor(archBricks / 2);
    const bx = -19.8 + u * 0.52;
    const archCurveY = (1 - u * u) * 0.055;
    const soldierBrick = tagHighLod(
      new THREE.Mesh(isKeystone ? keystoneArchBrickGeo : standardArchBrickGeo, singleClayBrickMat)
    );
    soldierBrick.name = `sittingRoom.fireplace.archBrick.${i + 1}`;
    soldierBrick.position.set(
      bx,
      tier2FloorY + 1.355 + archCurveY + (isKeystone ? 0.012 : 0),
      isKeystone ? 7.71 : 7.72
    );
    soldierBrick.rotation.z = -u * 0.18;
    soldierBrick.castShadow = true;
    livingFpGroup.add(soldierBrick);
  }

  // Black wrought-iron cambered arch support bar with turned-down end lugs across the 1.10m opening (media_1790514908916.webp)
  const ironArchBar = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(1.14, 0.018, 0.045)), castIronMat)
  );
  ironArchBar.name = 'sittingRoom.fireplace.archBar';
  ironArchBar.position.set(-19.8, tier2FloorY + 1.295, 7.7);
  livingFpGroup.add(ironArchBar);

  const ironArchLugGeo = createSharedGeo(new THREE.BoxGeometry(0.018, 0.095, 0.045));
  for (const lugX of [-19.235, -20.365]) {
    const ironArchLug = tagHighLod(new THREE.Mesh(ironArchLugGeo, castIronMat));
    ironArchLug.name = `sittingRoom.fireplace.archLug.${lugX > -19.8 ? 'east' : 'west'}`;
    ironArchLug.position.set(lugX, tier2FloorY + 1.25, 7.7);
    livingFpGroup.add(ironArchLug);
  }

  // 3. Pair of Black Wrought-Iron L-Shaped Corner Plates with Double-Scroll Loop Handles on Left & Right 1.5-Brick Piers
  //    (Dedicated close-up photo media_1790514908882.webp & media_1790514908916.webp!)
  const frontIronPlateGeo = createSharedGeo(new THREE.BoxGeometry(0.195, 0.19, 0.008));
  const jambReturnFlangeGeo = createSharedGeo(new THREE.BoxGeometry(0.008, 0.19, 0.085));
  const scrollCylinderGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.022, 12));
  const scrollCoreGeo = createSharedGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.025, 10));
  const forgedBowHandleGeo = createSharedGeo(
    new THREE.TorusGeometry(0.048, 0.0075, 8, 18, Math.PI)
  );

  for (const [plateX, innerJambX, sideTag] of [
    [-19.1, -19.248, 'east'],
    [-20.5, -20.352, 'west'],
  ] as const) {
    const plateY = tier2FloorY + 0.78;
    // Front black wrought-iron plate (0.195m x 0.19m) flush on the North face of the brick pier
    const frontIronPlate = tagHighLod(new THREE.Mesh(frontIronPlateGeo, castIronMat));
    frontIronPlate.name = `sittingRoom.fireplace.cornerPlate.${sideTag}`;
    frontIronPlate.position.set(plateX, plateY, 7.675);
    frontIronPlate.castShadow = true;
    livingFpGroup.add(frontIronPlate);

    // L-shaped return flange wrapping around the inner brick corner into the firebox reveal
    const jambReturnFlange = tagHighLod(new THREE.Mesh(jambReturnFlangeGeo, castIronMat));
    jambReturnFlange.name = `sittingRoom.fireplace.jambFlange.${sideTag}`;
    jambReturnFlange.position.set(innerJambX, plateY, 7.718);
    livingFpGroup.add(jambReturnFlange);

    // Two inward-curling spiral scroll bosses + curved forged iron loop handle (media_1790514908882.webp)
    const handleY = plateY - 0.032;
    for (const [sIdx, scrollDx] of ([-0.036, 0.036] as const).entries()) {
      const scrollCylinder = tagHighLod(new THREE.Mesh(scrollCylinderGeo, castIronMat));
      scrollCylinder.name = `sittingRoom.fireplace.scrollBoss.${sideTag}.${sIdx + 1}`;
      scrollCylinder.position.set(plateX + scrollDx, handleY, 7.658);
      livingFpGroup.add(scrollCylinder);

      const scrollCore = tagHighLod(new THREE.Mesh(scrollCoreGeo, castIronMat));
      scrollCore.name = `sittingRoom.fireplace.scrollCore.${sideTag}.${sIdx + 1}`;
      scrollCore.position.set(plateX + scrollDx * 0.78, handleY, 7.656);
      livingFpGroup.add(scrollCore);
    }

    const forgedBowHandle = tagHighLod(new THREE.Mesh(forgedBowHandleGeo, castIronMat));
    forgedBowHandle.name = `sittingRoom.fireplace.bowHandle.${sideTag}`;
    forgedBowHandle.rotation.x = Math.PI / 2;
    forgedBowHandle.position.set(plateX, handleY, 7.662);
    forgedBowHandle.castShadow = true;
    livingFpGroup.add(forgedBowHandle);
  }

  // 4. Inside the 1.10m-Wide & 1.414m-Tall Brick Firebox (media_1790514908951.webp close-up):
  //    - Lower warm red-brick fireback & side walls + Soot-blackened upper brick fireback
  //    - Stepped internal brick side ledges (hobs)
  //    - Raised 2-course inner brick floor step
  //    - 8 firebricks laid on edge side-by-side supporting the ornate cast-iron fire basket grate
  //    - Angled black sheet-metal canopy hood at top of opening
  const sootBrickMat = new THREE.MeshStandardMaterial({
    color: 0x262423,
    roughness: 0.95,
  });

  // Lower brick fireback (Y = tier2FloorY + 0.14m..+0.74m) & soot-blackened upper fireback (Y = +0.74m..+1.38m)
  const lowerFirebackGeo = new THREE.BoxGeometry(1.12, 0.6, 0.06);
  applyFireplaceBrickUVs(lowerFirebackGeo, -19.8, tier2FloorY + 0.44, 8.11);
  const lowerFireback = new THREE.Mesh(lowerFirebackGeo, exteriorBrickMat);
  lowerFireback.name = 'sittingRoom.fireplace.lowerFireback';
  lowerFireback.position.set(-19.8, tier2FloorY + 0.44, 8.11);
  livingFpGroup.add(lowerFireback);

  const upperSootFireback = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(1.12, 0.64, 0.06)),
    sootBrickMat
  );
  upperSootFireback.name = 'sittingRoom.fireplace.upperFireback';
  upperSootFireback.position.set(-19.8, tier2FloorY + 1.06, 8.11);
  livingFpGroup.add(upperSootFireback);

  // Stepped internal brick side ledges (hobs) along the left & right firebox walls (media_1790514908951.webp)
  for (const hobX of [-19.315, -20.285]) {
    const hobGeo = new THREE.BoxGeometry(0.13, 0.28, 0.38);
    applyFireplaceBrickUVs(hobGeo, hobX, tier2FloorY + 0.28, 7.92);
    const hobMesh = new THREE.Mesh(hobGeo, exteriorBrickMat);
    hobMesh.name = `sittingRoom.fireplace.hob.${hobX > -19.8 ? 'east' : 'west'}`;
    hobMesh.position.set(hobX, tier2FloorY + 0.28, 7.92);
    hobMesh.receiveShadow = true;
    livingFpGroup.add(hobMesh);
  }

  // Raised 2-course inner brick firebox floor step (Y = tier2FloorY..tier2FloorY + 0.145m, Z = +7.68m..+8.12m)
  const innerStepGeo = new THREE.BoxGeometry(1.12, 0.145, 0.44);
  applyFireplaceBrickUVs(innerStepGeo, -19.8, tier2FloorY + 0.0725, 7.9);
  const innerStep = new THREE.Mesh(innerStepGeo, exteriorBrickMat);
  innerStep.name = 'sittingRoom.fireplace.innerStep';
  innerStep.position.set(-19.8, tier2FloorY + 0.0725, 7.9);
  innerStep.receiveShadow = true;
  livingFpGroup.add(innerStep);

  // 8 Firebricks laid on edge side-by-side inside the firebox (media_1790514908951.webp bottom center!)
  const firebrickMat = new THREE.MeshStandardMaterial({
    color: 0xb88468,
    roughness: 0.9,
  });
  const firebrickGeo = createSharedGeo(new THREE.BoxGeometry(0.056, 0.088, 0.25));
  for (let fb = 0; fb < 8; fb++) {
    const fbx = -19.8 + (fb - 3.5) * 0.068;
    const firebrick = tagHighLod(new THREE.Mesh(firebrickGeo, firebrickMat));
    firebrick.name = `sittingRoom.fireplace.firebrick.${fb + 1}`;
    firebrick.position.set(fbx, tier2FloorY + 0.189, 7.89);
    firebrick.castShadow = true;
    firebrick.receiveShadow = true;
    livingFpGroup.add(firebrick);
  }

  // Ornate Cast-Iron Fire Basket / Log Grate standing on the 8 firebricks (media_1790514908951.webp center!)
  const grateGroup = new THREE.Group();
  grateGroup.name = 'sittingRoom.fireplace.grate';
  grateGroup.position.set(-19.8, tier2FloorY + 0.233, 7.89);

  // Grate bottom bed & low rear fireback plate
  const grateBed = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.44, 0.022, 0.22)),
    castIronMat
  );
  grateBed.name = 'sittingRoom.fireplace.grate.bed';
  grateBed.position.set(0, 0.06, 0);
  grateBed.castShadow = true;
  grateGroup.add(grateBed);

  const grateBackPlate = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.42, 0.22, 0.022)),
    castIronMat
  );
  grateBackPlate.name = 'sittingRoom.fireplace.grate.backPlate';
  grateBackPlate.position.set(0, 0.17, 0.095);
  grateGroup.add(grateBackPlate);

  // 4 curved cast-iron legs at the corners of the basket
  const grateLegGeo = createSharedGeo(new THREE.BoxGeometry(0.024, 0.075, 0.024));
  for (const [lIdx, [lx, lz]] of (
    [
      [-0.2, -0.095],
      [0.2, -0.095],
      [-0.2, 0.095],
      [0.2, 0.095],
    ] as const
  ).entries()) {
    const leg = tagHighLod(new THREE.Mesh(grateLegGeo, castIronMat));
    leg.name = `sittingRoom.fireplace.grate.leg.${lIdx + 1}`;
    leg.position.set(lx, 0.035, lz);
    grateGroup.add(leg);
  }

  // Front top & bottom horizontal cast-iron rails + 9 vertical decorative leaf-patterned bars
  const grateFrontRailGeo = createSharedGeo(new THREE.BoxGeometry(0.45, 0.018, 0.018));
  for (const [rIdx, ry] of ([0.072, 0.205] as const).entries()) {
    const frontRail = tagHighLod(new THREE.Mesh(grateFrontRailGeo, castIronMat));
    frontRail.name = `sittingRoom.fireplace.grate.frontRail.${rIdx === 0 ? 'bottom' : 'top'}`;
    frontRail.position.set(0, ry, -0.095);
    grateGroup.add(frontRail);
  }
  const grateVBarGeo = createSharedGeo(new THREE.BoxGeometry(0.02, 0.155, 0.016));
  for (let b = 0; b < 9; b++) {
    const bx = (b - 4) * 0.05;
    const vBar = tagHighLod(new THREE.Mesh(grateVBarGeo, castIronMat));
    vBar.name = `sittingRoom.fireplace.grate.verticalBar.${b + 1}`;
    vBar.position.set(bx, 0.14, -0.095);
    vBar.castShadow = true;
    grateGroup.add(vBar);
  }

  // Left & right side basket wings with top rail
  const grateSideWingGeo = createSharedGeo(new THREE.BoxGeometry(0.018, 0.15, 0.2));
  for (const sx of [-0.215, 0.215]) {
    const sideWing = tagHighLod(new THREE.Mesh(grateSideWingGeo, castIronMat));
    sideWing.name = `sittingRoom.fireplace.grate.sideWing.${sx < 0 ? 'west' : 'east'}`;
    sideWing.position.set(sx, 0.14, 0);
    grateGroup.add(sideWing);
  }
  livingFpGroup.add(grateGroup);

  // Angled Black Sheet-Metal Canopy Hood at the top of the firebox opening (media_1790514908951.webp top)
  const canopyHood = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.98, 0.18, 0.34)),
    castIronMat
  );
  canopyHood.name = 'sittingRoom.fireplace.canopyHood';
  canopyHood.position.set(-19.8, tier2FloorY + 1.2, 7.89);
  canopyHood.rotation.x = 0.22;
  canopyHood.castShadow = true;
  livingFpGroup.add(canopyHood);

  // 5. Raised Herringbone Red-Brick Hearth with Soldier-Course Border in front of the 1.70m fireplace
  //    (X = -18.98m..-20.62m [1.64m wide], Z = +7.18m..+7.68m [0.50m deep], height 0.0785m = 1 course, top at Y = -0.5215m — Issue #2)
  const herringboneCanvas = document.createElement('canvas');
  herringboneCanvas.width = 620;
  herringboneCanvas.height = 250;
  const hbCtx = herringboneCanvas.getContext('2d');
  if (hbCtx) {
    hbCtx.fillStyle = '#8e8479'; // Weathered lime mortar joint base
    hbCtx.fillRect(0, 0, 620, 250);
    const brickTones = ['#9e4733', '#8a3d2c', '#b2523b', '#763628', '#a64b36', '#5a4942'];
    // Diagonal 45° herringbone brick field inside the 102.5mm (51px) perimeter header border
    hbCtx.save();
    hbCtx.beginPath();
    hbCtx.rect(54, 4, 512, 192);
    hbCtx.clip();
    hbCtx.translate(310, 100);
    hbCtx.rotate(Math.PI / 4);
    const hbUnit = 54;
    for (let gy = -432; gy <= 432; gy += hbUnit) {
      for (let gx = -432; gx <= 432; gx += hbUnit * 2) {
        hbCtx.fillStyle = brickTones[Math.abs((gx + gy) * 7) % brickTones.length]!;
        hbCtx.fillRect(gx + 2, gy + 2, hbUnit * 2 - 4, hbUnit - 4);
        hbCtx.fillStyle = brickTones[Math.abs((gx - gy) * 11 + 3) % brickTones.length]!;
        hbCtx.fillRect(gx + hbUnit + 2, gy + hbUnit + 2, hbUnit - 4, hbUnit * 2 - 4);
      }
    }
    hbCtx.restore();
    for (let sx = 54; sx <= 534; sx += 37) {
      hbCtx.fillStyle = brickTones[(sx * 3) % brickTones.length]!;
      hbCtx.fillRect(sx, 198, 33, 49);
    }
    for (let sy = 4; sy <= 214; sy += 37) {
      hbCtx.fillStyle = brickTones[(sy * 5) % brickTones.length]!;
      hbCtx.fillRect(3, sy, 49, 33);
      hbCtx.fillStyle = brickTones[(sy * 7 + 2) % brickTones.length]!;
      hbCtx.fillRect(568, sy, 49, 33);
    }
  }
  const herringboneTex = new THREE.CanvasTexture(herringboneCanvas);
  herringboneTex.colorSpace = THREE.SRGBColorSpace;
  const herringboneHearthMat = new THREE.MeshStandardMaterial({
    map: herringboneTex,
    roughness: 0.86,
  });

  const livingHearthGeo = new THREE.BoxGeometry(1.64, 0.0785, 0.5);
  applyFireplaceBrickUVs(livingHearthGeo, -19.8, tier2FloorY + 0.03925, 7.43);
  const hearthUv = livingHearthGeo.attributes.uv as THREE.BufferAttribute | undefined;
  const hearthPos = livingHearthGeo.attributes.position as THREE.BufferAttribute | undefined;
  if (hearthUv && hearthPos) {
    for (let vi = 0; vi < hearthPos.count; vi++) {
      const ny = (livingHearthGeo.attributes.normal as THREE.BufferAttribute).getY(vi);
      if (ny > 0.9) {
        const u = (hearthPos.getX(vi) + 0.82) / 1.64;
        const v = 1 - (hearthPos.getZ(vi) + 0.25) / 0.5;
        hearthUv.setXY(vi, u, v);
      }
    }
    hearthUv.needsUpdate = true;
  }
  const livingHearth = new THREE.Mesh(livingHearthGeo, [
    exteriorBrickMat,
    exteriorBrickMat,
    herringboneHearthMat,
    exteriorBrickMat,
    exteriorBrickMat,
    exteriorBrickMat,
  ]);
  livingHearth.name = 'sittingRoom.fireplace.hearth';
  livingHearth.position.set(-19.8, tier2FloorY + 0.03925, 7.43);
  livingHearth.castShadow = true;
  livingHearth.receiveShadow = true;
  livingFpGroup.add(livingHearth);

  scene.add(livingFpGroup);

  // 6. Bespoke 4-Door Shaker Alcove Base Cabinets + T&G V-Grooved Open Bookcases
  //    flanking both sides of the wider 1.70m exposed red-brick chimney breast
  //    (East/Left Alcove: X = -18.95m..-17.20m [1.75m full alcove width — Issue #16], West/Right Alcove: X = -22.19m..-20.65m [1.54m wide])
  const alcoveJoineryMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6, // Warm heritage putty / off-white joinery paint (media_1790514908328.webp)
    roughness: 0.58,
  });
  const alcoveRecessPanelMat = new THREE.MeshStandardMaterial({
    color: 0xddd7cb,
    roughness: 0.64,
  });

  // Shared geometries across both alcoves
  const doorHShaker = 0.58;
  const upperBookcaseH = frontTier2WallH - 0.84; // 1.385m
  const dStileGeo = createSharedGeo(new THREE.BoxGeometry(0.052, doorHShaker, 0.022));
  const knobRoseGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 14));
  const knobStemGeo = createSharedGeo(new THREE.CylinderGeometry(0.005, 0.006, 0.012, 10));
  const knobHeadGeo = createSharedGeo(new THREE.SphereGeometry(0.0135, 14, 12));
  const sideCheekGeo = createSharedGeo(new THREE.BoxGeometry(0.04, upperBookcaseH, 0.36));
  const frontPilasterGeo = createSharedGeo(new THREE.BoxGeometry(0.095, upperBookcaseH, 0.032));
  const ornamentOrbGeo = createSharedGeo(new THREE.SphereGeometry(0.036, 14, 12));
  const tallVaseBodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.034, 0.048, 0.165, 16));
  const shortVaseBodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.052, 0.042, 0.115, 16));
  const vaseNeckGeo = createSharedGeo(new THREE.CylinderGeometry(0.022, 0.028, 0.038, 14));
  const plantPotGeo = createSharedGeo(new THREE.CylinderGeometry(0.068, 0.052, 0.125, 16));
  const hBookGeos = [0, 1, 2].map((s) =>
    createSharedGeo(new THREE.BoxGeometry(0.22 - s * 0.018, 0.028, 0.17 - s * 0.012))
  );
  const leafClusterSpecs = [
    [0, 0.145, 0, 0.062, false],
    [-0.038, 0.135, -0.024, 0.048, true],
    [0.042, 0.138, -0.02, 0.05, false],
    [-0.025, 0.162, 0.022, 0.046, true],
    [0.028, 0.158, 0.025, 0.045, true],
    [0, 0.182, -0.01, 0.044, false],
  ] as const;
  const leafClusterGeos = leafClusterSpecs.map(([, , , fr]) =>
    createSharedGeo(new THREE.SphereGeometry(fr, 10, 10))
  );
  const vineLeafGeos = [0, 1, 2, 3, 4, 5].map((v) =>
    createSharedGeo(new THREE.SphereGeometry(0.022 - v * 0.002, 8, 8))
  );

  for (const [minBx, maxBx, hasTv] of [
    [-18.95, -17.2, false],
    [-22.19, -20.65, true],
  ] as const) {
    const alcoveSide = hasTv ? 'west' : 'east';
    const bw = maxBx - minBx;
    const bcx = (minBx + maxBx) / 2;
    const alcoveGroup = new THREE.Group();
    alcoveGroup.name = `sittingRoom.alcove.${alcoveSide}`;
    alcoveGroup.userData.zone = 'sittingRoom';

    // Deep moulded skirting plinth at bottom of base cabinet (height 0.13m)
    const basePlinth = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(bw, 0.13, 0.45)),
      antiqueOakSkirtingMat
    );
    basePlinth.name = 'sittingRoom.alcove.basePlinth';
    basePlinth.position.set(bcx, tier2FloorY + 0.065, 7.925);
    basePlinth.receiveShadow = true;
    alcoveGroup.add(basePlinth);

    // Lower base cabinet carcass (Y = tier2FloorY + 0.13m..+0.76m, depth 0.43m)
    const baseCarcass = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(bw, 0.63, 0.43)),
      alcoveJoineryMat
    );
    baseCarcass.name = 'sittingRoom.alcove.baseCarcass';
    baseCarcass.position.set(bcx, tier2FloorY + 0.445, 7.935);
    baseCarcass.castShadow = true;
    baseCarcass.receiveShadow = true;
    alcoveGroup.add(baseCarcass);

    // 4 Framed Shaker Cupboard Doors across the front of the base cabinet (media_1790514908328.webp bottom!)
    const doorCount = 4;
    const doorSpanW = (bw - 0.08) / doorCount;
    const doorCenterY = tier2FloorY + 0.445;
    const dw = doorSpanW - 0.012;
    const shakerPanelGeo = createSharedGeo(
      new THREE.BoxGeometry(dw - 0.09, doorHShaker - 0.09, 0.012)
    );
    const dRailGeo = createSharedGeo(new THREE.BoxGeometry(dw - 0.09, 0.056, 0.022));

    for (let d = 0; d < doorCount; d++) {
      const dx = minBx + 0.04 + (d + 0.5) * doorSpanW;

      // Recessed flat Shaker center panel
      const shakerPanel = new THREE.Mesh(shakerPanelGeo, alcoveRecessPanelMat);
      shakerPanel.name = `sittingRoom.alcoveCabinet.${alcoveSide}.door${d + 1}.panel`;
      shakerPanel.position.set(dx, doorCenterY, 7.716);
      alcoveGroup.add(shakerPanel);

      // Left & right raised Shaker door stiles
      for (const [sIdx, sx] of ([dx - dw / 2 + 0.026, dx + dw / 2 - 0.026] as const).entries()) {
        const dStile = new THREE.Mesh(dStileGeo, alcoveJoineryMat);
        dStile.name = `sittingRoom.alcoveCabinet.${alcoveSide}.door${d + 1}.stile.${sIdx === 0 ? 'west' : 'east'}`;
        dStile.position.set(sx, doorCenterY, 7.715);
        dStile.castShadow = true;
        alcoveGroup.add(dStile);
      }
      // Top & bottom raised Shaker door rails
      for (const [rIdx, ry] of (
        [doorCenterY - doorHShaker / 2 + 0.028, doorCenterY + doorHShaker / 2 - 0.028] as const
      ).entries()) {
        const dRail = new THREE.Mesh(dRailGeo, alcoveJoineryMat);
        dRail.name = `sittingRoom.alcoveCabinet.${alcoveSide}.door${d + 1}.rail.${rIdx === 0 ? 'bottom' : 'top'}`;
        dRail.position.set(dx, ry, 7.715);
        dRail.castShadow = true;
        alcoveGroup.add(dRail);
      }

      // Turned Aged-Brass Cabinet Knob & Circular Rose Backplate on the inner meeting stile of each double-door pair (Issue #6)
      const isLeftOfPair = d % 2 === 0;
      const knobX = isLeftOfPair ? dx + dw * 0.5 - 0.026 : dx - dw * 0.5 + 0.026;
      const knobY = doorCenterY + doorHShaker * 0.5 - 0.078;

      const knobRose = tagHighLod(new THREE.Mesh(knobRoseGeo, brassMat));
      knobRose.name = `sittingRoom.alcoveCabinet.${alcoveSide}.door${d + 1}.knobRose`;
      knobRose.rotation.x = Math.PI / 2;
      knobRose.position.set(knobX, knobY, 7.702);
      alcoveGroup.add(knobRose);

      const knobStem = tagHighLod(new THREE.Mesh(knobStemGeo, brassMat));
      knobStem.name = `sittingRoom.alcoveCabinet.${alcoveSide}.door${d + 1}.knobStem`;
      knobStem.rotation.x = Math.PI / 2;
      knobStem.position.set(knobX, knobY, 7.694);
      alcoveGroup.add(knobStem);

      const knobHead = tagHighLod(new THREE.Mesh(knobHeadGeo, brassMat));
      knobHead.scale.set(1, 1, 0.72);
      knobHead.name = `sittingRoom.alcoveCabinet.${alcoveSide}.door${d + 1}.brassKnob`;
      knobHead.position.set(knobX, knobY, 7.686);
      knobHead.castShadow = true;
      alcoveGroup.add(knobHead);
    }

    // Projecting Stepped/Moulded Countertop Ledge above the 4 Shaker doors (Y = tier2FloorY + 0.76m..+0.80m)
    const counterLedge = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(bw, 0.042, 0.47)),
      alcoveJoineryMat
    );
    counterLedge.name = 'sittingRoom.alcove.counterLedge';
    counterLedge.position.set(bcx, tier2FloorY + 0.78, 7.915);
    counterLedge.castShadow = true;
    counterLedge.receiveShadow = true;
    alcoveGroup.add(counterLedge);

    // Upper Bookcase Vertical Tongue-and-Groove (T&G) V-Jointed Boarding Back Panel
    // (12 vertical v-grooved planks across the back wall, Y = tier2FloorY + 0.80m..+2.185m for frontWallH = 1.625m — Issue #1)
    const upperBookcaseMidY = tier2FloorY + 0.8 + upperBookcaseH * 0.5;
    const tgPlanks = 12;
    const plankStep = (bw - 0.14) / tgPlanks;
    const tgPlankGeo = createSharedGeo(
      new THREE.BoxGeometry(plankStep - 0.006, upperBookcaseH, 0.024)
    );
    for (let p = 0; p < tgPlanks; p++) {
      const px = minBx + 0.07 + (p + 0.5) * plankStep;
      const tgPlank = new THREE.Mesh(tgPlankGeo, alcoveRecessPanelMat);
      tgPlank.name = `sittingRoom.alcove.${alcoveSide}.tgPlank.${p + 1}`;
      tgPlank.position.set(px, upperBookcaseMidY, 8.125);
      tgPlank.receiveShadow = true;
      alcoveGroup.add(tgPlank);
    }

    // Left & right wide vertical bookcase side pilasters + deep side cheeks
    for (const [cIdx, sideX] of ([minBx + 0.048, maxBx - 0.048] as const).entries()) {
      const cSideTag = cIdx === 0 ? 'west' : 'east';
      const sideCheek = new THREE.Mesh(sideCheekGeo, alcoveJoineryMat);
      sideCheek.name = `sittingRoom.alcove.${alcoveSide}.sideCheek.${cSideTag}`;
      sideCheek.position.set(sideX, upperBookcaseMidY, 7.96);
      sideCheek.castShadow = true;
      alcoveGroup.add(sideCheek);

      const frontPilaster = new THREE.Mesh(frontPilasterGeo, alcoveJoineryMat);
      frontPilaster.name = `sittingRoom.alcove.${alcoveSide}.frontPilaster.${cSideTag}`;
      frontPilaster.position.set(sideX, upperBookcaseMidY, 7.775);
      frontPilaster.castShadow = true;
      alcoveGroup.add(frontPilaster);
    }

    // Projecting Moulded Cornice Crown Header at the top of the bookcase right under the 1.625m ceiling
    const corniceCrown = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(bw, 0.09, 0.42)),
      skirtingMat
    );
    corniceCrown.name = `sittingRoom.alcove.${alcoveSide}.corniceCrown`;
    corniceCrown.position.set(bcx, frontWallH - 0.045, 7.94);
    corniceCrown.castShadow = true;
    alcoveGroup.add(corniceCrown);

    // Moulded Horizontal Bookcase Shelves with stepped front edge nosing + Recessed Warm 2700K Under-Shelf LED Strip Lighting
    // Proportioned for `frontWallH = 1.625m` (`frontTier2WallH = 2.225m`):
    // - West alcove (`hasTv === true`): `shelfHeights = [1.48, 1.81]` gives breathing room above the 42" LG OLED TV
    //   (`top at Y = +0.778m`, shelf underside at `Y = +0.861m`) and `0.33m` vertical clearance per shelf tier!
    // - East alcove (`hasTv === false`): `shelfHeights = [1.14, 1.48, 1.81]` aligns the upper two shelves with the West alcove!
    const alcoveLedStripMat = new THREE.MeshStandardMaterial({
      color: 0xfff2d6,
      emissive: 0xffb85c,
      emissiveIntensity: 2.4,
      roughness: 0.2,
    });
    lightGroups.livingRoomPendant.emissives.push(alcoveLedStripMat);

    const alcoveLedChannelMat = new THREE.MeshStandardMaterial({
      color: 0xd0cbc0,
      roughness: 0.35,
      metalness: 0.45,
    });

    const shelfBoardGeo = createSharedGeo(new THREE.BoxGeometry(bw - 0.1, 0.038, 0.35));
    const shelfNosingGeo = createSharedGeo(new THREE.BoxGeometry(bw - 0.1, 0.046, 0.024));
    const ledChannelGeo = createSharedGeo(new THREE.BoxGeometry(bw - 0.14, 0.008, 0.022));
    const ledDiffuserGeo = createSharedGeo(new THREE.BoxGeometry(bw - 0.16, 0.006, 0.014));

    const shelfHeights = hasTv ? [1.48, 1.81] : [1.14, 1.48, 1.81];
    for (const sy of shelfHeights) {
      const shelfBoard = new THREE.Mesh(shelfBoardGeo, alcoveJoineryMat);
      shelfBoard.name = 'sittingRoom.alcove.shelfBoard';
      shelfBoard.position.set(bcx, tier2FloorY + sy, 7.96);
      shelfBoard.castShadow = true;
      shelfBoard.receiveShadow = true;
      alcoveGroup.add(shelfBoard);

      const shelfNosing = new THREE.Mesh(shelfNosingGeo, skirtingMat);
      shelfNosing.name = 'sittingRoom.alcove.shelfNosing';
      shelfNosing.position.set(bcx, tier2FloorY + sy, 7.782);
      alcoveGroup.add(shelfNosing);

      // Recessed Aluminum LED Profile + Warm 2700K Diffuser Strip under each alcove shelf (Issue #2)
      const ledChannel = tagHighLod(new THREE.Mesh(ledChannelGeo, alcoveLedChannelMat));
      ledChannel.name = 'sittingRoom.alcove.ledChannel';
      ledChannel.position.set(bcx, tier2FloorY + sy - 0.021, 7.835);
      alcoveGroup.add(ledChannel);

      const ledDiffuser = tagHighLod(new THREE.Mesh(ledDiffuserGeo, alcoveLedStripMat));
      ledDiffuser.name = 'sittingRoom.alcove.ledStrip';
      ledDiffuser.position.set(bcx, tier2FloorY + sy - 0.024, 7.835);
      alcoveGroup.add(ledDiffuser);
    }

    // Curated Books, Sculptural Ornaments & Potted Trailing Plants on the Sitting Room Alcove Shelves
    {
      const bookPalette = [
        0x6e3b2e, // burnt sienna cloth
        0x2e4756, // heritage slate blue
        0x4a5d46, // sage olive linen
        0x8c6d46, // warm ochre buckram
        0x3b3530, // charcoal vellum
        0xb8a992, // cream linen spine
        0x5a2e38, // deep burgundy
      ];
      const bookPageMat = new THREE.MeshStandardMaterial({
        color: 0xf2ead8,
        roughness: 0.78,
      });
      const ornamentStonewareMat = new THREE.MeshStandardMaterial({
        color: 0xd6cab8,
        roughness: 0.38,
        metalness: 0.04,
      });
      const ornamentTerracottaMat = new THREE.MeshStandardMaterial({
        color: 0xa86042,
        roughness: 0.62,
        metalness: 0.02,
      });
      const foliageDeepMat = new THREE.MeshStandardMaterial({
        color: 0x355834,
        roughness: 0.58,
        metalness: 0.02,
      });
      const foliageBrightMat = new THREE.MeshStandardMaterial({
        color: 0x4b7447,
        roughness: 0.54,
        metalness: 0.02,
      });

      const addBookRow = (
        startX: number,
        shelfTopY: number,
        count: number,
        seed: number,
        leanLast: boolean
      ): void => {
        let curX = startX;
        for (let b = 0; b < count; b++) {
          const bwBook = 0.026 + ((b + seed) % 3) * 0.009;
          const bhBook = 0.185 + ((b * 3 + seed) % 4) * 0.022;
          const bdBook = 0.175 + ((b + seed) % 2) * 0.02;
          const bMat = new THREE.MeshStandardMaterial({
            color: bookPalette[(b + seed * 2) % bookPalette.length]!,
            roughness: 0.64,
          });
          const isLeaning = leanLast && b === count - 1;
          const bookMesh = tagHighLod(
            new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(bwBook, bhBook, bdBook)), bMat)
          );
          bookMesh.name = 'sittingRoom.alcove.book';
          bookMesh.position.set(
            curX + bwBook * 0.5 + (isLeaning ? 0.022 : 0),
            shelfTopY + bhBook * 0.5,
            7.94
          );
          if (isLeaning) {
            bookMesh.rotation.z = -0.22;
          }
          bookMesh.castShadow = true;
          bookMesh.receiveShadow = true;
          alcoveGroup.add(bookMesh);
          curX += bwBook + 0.003;
        }
      };

      const addHorizontalBookStack = (
        stackX: number,
        shelfTopY: number,
        seed: number,
        withTopOrb: boolean
      ): void => {
        let stackY = shelfTopY;
        for (let s = 0; s < 3; s++) {
          const hStack = 0.028;
          const bMat = new THREE.MeshStandardMaterial({
            color: bookPalette[(seed + s * 3) % bookPalette.length]!,
            roughness: 0.62,
          });
          const hBook = tagHighLod(
            new THREE.Mesh(hBookGeos[s]!, s % 2 === 1 ? bookPageMat : bMat)
          );
          hBook.name = 'sittingRoom.alcove.bookStack';
          hBook.position.set(stackX, stackY + hStack * 0.5, 7.92);
          hBook.rotation.y = (s - 1) * 0.06;
          hBook.castShadow = true;
          alcoveGroup.add(hBook);
          stackY += hStack;
        }
        if (withTopOrb) {
          const orb = tagHighLod(new THREE.Mesh(ornamentOrbGeo, brassMat));
          orb.name = 'sittingRoom.alcove.ornamentOrb';
          orb.position.set(stackX, stackY + 0.036, 7.92);
          orb.castShadow = true;
          alcoveGroup.add(orb);
        }
      };

      const addShelfOrnamentVase = (
        vx: number,
        shelfTopY: number,
        tall: boolean
      ): void => {
        const vGroup = new THREE.Group();
        vGroup.name = 'sittingRoom.alcove.ornamentVase';
        vGroup.position.set(vx, shelfTopY, 7.91);

        const bodyH = tall ? 0.165 : 0.115;
        const vaseBody = tagHighLod(
          new THREE.Mesh(
            tall ? tallVaseBodyGeo : shortVaseBodyGeo,
            tall ? ornamentStonewareMat : ornamentTerracottaMat
          )
        );
        vaseBody.name = 'sittingRoom.alcove.ornamentVase.body';
        vaseBody.position.set(0, bodyH * 0.5, 0);
        vaseBody.castShadow = true;
        vGroup.add(vaseBody);

        const vaseNeck = tagHighLod(
          new THREE.Mesh(vaseNeckGeo, tall ? ornamentStonewareMat : ornamentTerracottaMat)
        );
        vaseNeck.name = 'sittingRoom.alcove.ornamentVase.neck';
        vaseNeck.position.set(0, bodyH + 0.018, 0);
        vGroup.add(vaseNeck);

        alcoveGroup.add(vGroup);
      };

      const addShelfPottedPlant = (
        px: number,
        shelfTopY: number,
        trailing: boolean
      ): void => {
        const plantGroup = new THREE.Group();
        plantGroup.name = 'sittingRoom.alcove.shelfPlant';
        plantGroup.position.set(px, shelfTopY, 7.89);

        // Glazed stoneware / aged terracotta planter pot
        const pot = tagHighLod(
          new THREE.Mesh(plantPotGeo, trailing ? ornamentStonewareMat : ornamentTerracottaMat)
        );
        pot.name = 'sittingRoom.alcove.shelfPlant.pot';
        pot.position.set(0, 0.0625, 0);
        pot.castShadow = true;
        plantGroup.add(pot);

        // Lush bushy foliage crown in the pot
        for (const [cIdx, [fx, fy, fz, , isBright]] of leafClusterSpecs.entries()) {
          const leafCluster = tagHighLod(
            new THREE.Mesh(leafClusterGeos[cIdx]!, isBright ? foliageBrightMat : foliageDeepMat)
          );
          leafCluster.name = `sittingRoom.alcove.shelfPlant.leafCluster.${cIdx + 1}`;
          leafCluster.scale.set(1.15, 0.88, 1.1);
          leafCluster.position.set(fx, fy, fz);
          leafCluster.castShadow = true;
          plantGroup.add(leafCluster);
        }

        // Trailing ivy / pothos vines cascading over the front (-Z) edge of the shelf
        if (trailing) {
          for (const [vIdx, vineX] of ([-0.036, -0.006, 0.028] as const).entries()) {
            const vineDrops = vineX < 0 ? 6 : 5;
            for (let v = 0; v < vineDrops; v++) {
              const leafNode = tagHighLod(
                new THREE.Mesh(vineLeafGeos[v]!, v % 2 === 0 ? foliageBrightMat : foliageDeepMat)
              );
              leafNode.name = `sittingRoom.alcove.shelfPlant.vineLeaf.${vIdx + 1}.${v + 1}`;
              leafNode.scale.set(1.2, 0.75, 0.9);
              leafNode.position.set(
                vineX + Math.sin(v * 1.3) * 0.008,
                0.105 - v * 0.038,
                -0.072 - Math.min(v, 2) * 0.018
              );
              leafNode.castShadow = true;
              plantGroup.add(leafNode);
            }
          }
        }

        alcoveGroup.add(plantGroup);
      };

      if (!hasTv) {
        // East Alcove Shelves (X = -18.95m..-17.20m full width, sy = 1.14, 1.48, 1.81):
        addBookRow(-18.78, tier2FloorY + 1.159, 8, 1, true);
        addHorizontalBookStack(-18.14, tier2FloorY + 1.159, 2, true);
        addShelfOrnamentVase(-17.74, tier2FloorY + 1.159, true);
        addShelfOrnamentVase(-17.56, tier2FloorY + 1.159, false);

        addShelfPottedPlant(-18.72, tier2FloorY + 1.499, true);
        addBookRow(-18.46, tier2FloorY + 1.499, 7, 4, true);
        addShelfOrnamentVase(-17.88, tier2FloorY + 1.499, false);
        addHorizontalBookStack(-17.55, tier2FloorY + 1.499, 5, false);

        addHorizontalBookStack(-18.68, tier2FloorY + 1.829, 3, true);
        addBookRow(-18.32, tier2FloorY + 1.829, 7, 6, true);
        addShelfPottedPlant(-17.55, tier2FloorY + 1.829, true);
      } else {
        // West Alcove Shelves (X = -22.19m..-20.65m, sy = 1.48, 1.81):
        // Lower shelf above TV (sy = 1.48 -> top at tier2FloorY + 1.499m = +0.899m):
        // Right speaker sits at X = -21.88m, so books & ornaments occupy X = -21.62m..-20.82m
        addBookRow(-21.62, tier2FloorY + 1.499, 6, 2, true);
        addShelfOrnamentVase(-21.18, tier2FloorY + 1.499, true);
        addShelfPottedPlant(-20.86, tier2FloorY + 1.499, false);

        // Top shelf (sy = 1.81 -> top at tier2FloorY + 1.829m = +1.229m):
        addShelfPottedPlant(-21.94, tier2FloorY + 1.829, true);
        addHorizontalBookStack(-21.58, tier2FloorY + 1.829, 1, false);
        addBookRow(-21.32, tier2FloorY + 1.829, 5, 5, true);
        addShelfPottedPlant(-20.86, tier2FloorY + 1.829, true);
      }
    }

    const counterSurfaceY = tier2FloorY + 0.801;

    if (!hasTv) {
      // EAST (LEFT-HAND WHEN FACING SOUTH FIREPLACE) ALCOVE:
      // 1. Small Warm Table Accent Lamp
      const lampGroup = new THREE.Group();
      lampGroup.name = 'sittingRoom.leftAlcoveLamp';
      // Scaled to 75% and set back so it fits beneath the first shelf (sy = 1.14; ~0.31m clear above the
      // counter, lamp now 0.27m tall) with the shade tucked behind the shelf nosing line (Z = 7.77m).
      lampGroup.position.set(-18.02, counterSurfaceY, 7.93);
      lampGroup.scale.setScalar(0.75);

      const lampBaseMat = new THREE.MeshStandardMaterial({
        color: 0xd8cfc2, // Fluted warm stoneware ceramic base
        roughness: 0.36,
        metalness: 0.04,
      });
      const lampBrassMat = new THREE.MeshStandardMaterial({
        color: 0xb8924a, // Aged antique brass neck & plinth collar
        roughness: 0.28,
        metalness: 0.72,
      });
      const lampShadeMat = new THREE.MeshStandardMaterial({
        color: 0xf7ecd5,
        emissive: 0xffb85c,
        emissiveIntensity: 1.85,
        roughness: 0.65,
        side: THREE.DoubleSide,
      });
      lightGroups.livingRoomPendant.emissives.push(lampShadeMat);

      // Aged brass foot plinth
      const lampPlinth = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.CylinderGeometry(0.072, 0.078, 0.016, 18)),
          lampBrassMat
        )
      );
      lampPlinth.name = 'sittingRoom.leftAlcoveLamp.plinth';
      lampPlinth.position.set(0, 0.008, 0);
      lampGroup.add(lampPlinth);

      // Baluster ceramic lamp body
      const lampBody = new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.046, 0.082, 0.175, 20)),
        lampBaseMat
      );
      lampBody.name = 'sittingRoom.leftAlcoveLamp.base';
      lampBody.position.set(0, 0.102, 0);
      lampBody.castShadow = true;
      lampGroup.add(lampBody);

      // Brass stem & bulb socket
      const lampStem = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.CylinderGeometry(0.01, 0.012, 0.065, 12)),
          lampBrassMat
        )
      );
      lampStem.name = 'sittingRoom.leftAlcoveLamp.stem';
      lampStem.position.set(0, 0.218, 0);
      lampGroup.add(lampStem);

      // Tapered warm pleated linen empire shade (open top/bottom silhouette)
      const lampShade = new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.082, 0.138, 0.165, 22, 1, true)),
        lampShadeMat
      );
      lampShade.name = 'sittingRoom.leftAlcoveLamp.shade';
      lampShade.position.set(0, 0.275, 0);
      lampShade.castShadow = true;
      lampGroup.add(lampShade);

      // Warm internal LED bulb glow
      const lampBulb = tagHighLod(
        new THREE.Mesh(createSharedGeo(new THREE.SphereGeometry(0.024, 12, 12)), alcoveLedStripMat)
      );
      lampBulb.name = 'sittingRoom.leftAlcoveLamp.bulb';
      lampBulb.position.set(0, 0.26, 0);
      lampGroup.add(lampBulb);

      alcoveGroup.add(lampGroup);
      interactions.registerLightFixture(lampGroup, 'livingRoomPendant');

      // 2. Wide Champagne-Taupe Ceramic 3-Wick Candle Bowl on the Sitting Room Brick Fireplace Hearth
      const hearthSurfaceY = tier2FloorY + 0.0785;
      const candleBowlMat = new THREE.MeshStandardMaterial({
        color: 0xc9b9a6,
        roughness: 0.35,
      });
      const candleBowl = new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.115, 0.095, 0.068, 20)),
        candleBowlMat
      );
      candleBowl.name = 'sittingRoom.fireplace.hearthCandleBowl';
      candleBowl.position.set(-19.22, hearthSurfaceY + 0.034, 7.38);
      candleBowl.castShadow = true;
      alcoveGroup.add(candleBowl);

      const candleWax = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.CylinderGeometry(0.105, 0.105, 0.02, 18)),
          ceramicWhiteMat
        )
      );
      candleWax.name = 'sittingRoom.fireplace.hearthCandleWax';
      candleWax.position.set(-19.22, hearthSurfaceY + 0.061, 7.38);
      alcoveGroup.add(candleWax);

      // 3. Left-Channel Q Acoustics 3010i Compact Bookshelf Speaker
      buildQAcousticsSpeaker(
        alcoveGroup,
        'sittingRoom.qAcousticsSpeaker.left',
        -17.56,
        counterSurfaceY,
        7.82,
        0.22
      );
    } else {
      // WEST (RIGHT-HAND WHEN FACING SOUTH FIREPLACE) ALCOVE:
      // 1. LG 42-inch OLED evo C5 (OLED42C54LA — 932mm W x 540mm H x 41.1mm D, 577mm H with dual blade feet)
      //    Centered in the 1.54m-wide West alcove (X = -21.42m) below the sy = 1.48 shelf
      //    Issue #5: Added directly to `scene` as its own standalone top-level object!
      const lgC5Group = new THREE.Group();
      lgC5Group.name = 'sittingRoom.lg42C5Oled';
      lgC5Group.userData.zone = 'sittingRoom';
      const tvCenterX = -21.42;
      const tvZ = 7.88;
      lgC5Group.position.set(tvCenterX, counterSurfaceY, tvZ);

      const oledPanelGlassMat = new THREE.MeshStandardMaterial({
        color: 0x080a0f, // Deep anti-reflective OLED evo black glass
        roughness: 0.07,
        metalness: 0.38,
      });
      const oledBezelMat = new THREE.MeshStandardMaterial({
        color: 0x16181c, // Dark titanium-anthracite 4-sided cinema bezel & rear enclosure
        roughness: 0.32,
        metalness: 0.62,
      });
      const oledFootMat = new THREE.MeshStandardMaterial({
        color: 0x2a2d34, // Brushed dark metallic C5 dual stand feet
        roughness: 0.26,
        metalness: 0.75,
      });

      const panelW = 0.932; // Official LG 42" C5 width: 932mm
      const panelH = 0.54; // Official LG 42" C5 panel height: 540mm
      const standLiftH = 0.037; // Official LG 42" C5 stand height: 577mm - 540mm = 37mm
      const panelCenterY = standLiftH + panelH * 0.5; // 0.307m above counter

      // Dual wide-set LG 42" C5 angled dark metallic blade feet (footprint depth 170mm)
      const footBaseGeo = createSharedGeo(new THREE.BoxGeometry(0.022, 0.008, 0.17));
      const footNeckGeo = createSharedGeo(new THREE.BoxGeometry(0.028, standLiftH + 0.025, 0.026));
      for (const side of [-1, 1] as const) {
        const footX = side * 0.365;
        const footBase = tagHighLod(new THREE.Mesh(footBaseGeo, oledFootMat));
        footBase.name = 'sittingRoom.lg42C5Oled.standFoot';
        footBase.position.set(footX, 0.004, 0.01);
        footBase.castShadow = true;
        lgC5Group.add(footBase);

        const footNeck = tagHighLod(new THREE.Mesh(footNeckGeo, oledFootMat));
        footNeck.name = `sittingRoom.lg42C5Oled.standNeck.${side < 0 ? 'west' : 'east'}`;
        footNeck.position.set(footX, (standLiftH + 0.015) * 0.5, 0.018);
        footNeck.rotation.x = -0.14;
        lgC5Group.add(footNeck);
      }

      // Wafer-thin 6mm OLED evo metallic backplate + 4mm ultra-narrow bezel (932mm x 540mm x 6mm)
      const waferPanel = new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(panelW, panelH, 0.006)),
        oledBezelMat
      );
      waferPanel.name = 'sittingRoom.lg42C5Oled.waferPanel';
      waferPanel.position.set(0, panelCenterY, 0);
      waferPanel.castShadow = true;
      lgC5Group.add(waferPanel);

      // Glossy anti-reflective OLED active screen surface (inset 4mm inside bezel)
      const activeOledScreen = new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(panelW - 0.008, panelH - 0.008, 0.002)),
        oledPanelGlassMat
      );
      activeOledScreen.name = 'sittingRoom.lg42C5Oled.screen';
      activeOledScreen.position.set(0, panelCenterY, -0.0035);
      lgC5Group.add(activeOledScreen);

      // Lower-rear sculpted electronics & VESA housing (brings total depth to 41.1mm)
      const rearHousing = new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.68, 0.34, 0.035)),
        oledBezelMat
      );
      rearHousing.name = 'sittingRoom.lg42C5Oled.rearHousing';
      rearHousing.position.set(0, standLiftH + 0.18, 0.0205);
      rearHousing.castShadow = true;
      lgC5Group.add(rearHousing);

      // Bottom-center IR receiver bump & subtle standby indicator
      const irBump = tagHighLod(
        new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(0.056, 0.007, 0.012)), oledBezelMat)
      );
      irBump.name = 'sittingRoom.lg42C5Oled.irSensor';
      irBump.position.set(0, standLiftH - 0.003, -0.001);
      lgC5Group.add(irBump);

      scene.add(lgC5Group);

      // 2. Right-Channel Q Acoustics 3010i Compact Bookshelf Speaker on the sy = 1.48 shelf above the TV
      const shelfAboveTvSurfaceY = tier2FloorY + 1.48 + 0.019; // +0.899m
      buildQAcousticsSpeaker(
        alcoveGroup,
        'sittingRoom.qAcousticsSpeaker.right',
        -21.88,
        shelfAboveTvSurfaceY,
        7.88,
        -0.18
      );
    }

    scene.add(alcoveGroup);
  }

  // Free-Standing Multi-Column Cast-Iron Radiator on the East Wall of the Sitting Room (Issue #11 & Issue #2: 10cm shorter)
  addSlattedRadiatorCover(
    getEastCourtyardWallCenterX(5.92) - 0.14 - 0.095,
    tier2FloorY,
    5.92,
    1.04,
    0.58,
    0.16,
    Math.PI + eastCourtyardWallAngleY,
    false
  );
}
