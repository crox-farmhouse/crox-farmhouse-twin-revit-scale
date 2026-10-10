import * as THREE from 'three';
import {
  buildAngledWallSegment,
  buildPolygonalFloorSlab,
  type WallLocalFrame,
} from '../../../../../engine/geometry/index.ts';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
  buildSweptMouldingGeometry,
  createSkirtingCapProfile,
} from '../../../../../engine/geometry/swept-moulding.ts';
import { buildWindowRomanBlind } from '../../../../../objects/decor/roman-blind.ts';
import { buildHallWoodBurningStoveFirebox } from '../../../../../objects/heating/wood-burning-stove-fire.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../../structure/tier2-levels.ts';
import type { buildDiningRoom } from '../dining-room.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type CentralHallShellKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  | 'antiqueOakSkirtingMat'
  | 'brassMat'
  | 'castIronMat'
  | 'ceramicWhiteMat'
  | 'doorH'
  | 'engineeredOakFloorMat'
  | 'exteriorBrickMat'
  | 'farrowAndBallPantalonMat'
  | 'frontWallH'
  | 'oakMat'
  | 'singleClayBrickMat'
  | 'tagCutawayWall'
  | 'wallCapMat'
  | 'wallH'
  | 'warmRoomPlasterMat'
  | 'windowGlassMat'
> &
  Pick<
    ReturnType<typeof createGroundFloorShellKit>,
    | 'addBrickWallAlongXWithCourtyardDoor'
    | 'addBrickWallAlongXWithWindow'
    | 'addExteriorBrickWall'
    | 'addInteriorWall'
    | 'applyWorldSpaceBrickUVs'
  > &
  Pick<
    ReturnType<typeof buildDiningRoom>,
    'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'
  > &
  Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>;

/**
 * Central Stair Hall (`hall`) architectural shell, exterior walls, segmental arched fireplace,
 * log-burning stove, stepped oak beam, structural pier, and cross-wall joinery.
 */
export function buildCentralHallShellAndJoinery(
  ctx: SceneBuilderContext,
  kit: CentralHallShellKit
): {
  hallFrontRoomCrossWallFrame: WallLocalFrame;
} {
  const { interactions, lightGroups, scene } = ctx;
  const {
    addBrickWallAlongXWithCourtyardDoor,
    addBrickWallAlongXWithWindow,
    addExteriorBrickWall,
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    castIronMat,
    ceramicWhiteMat,
    doorH,
    engineeredOakFloorMat,
    exteriorBrickMat,
    farrowAndBallPantalonMat,
    frontWallH,
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    oakMat,
    singleClayBrickMat,
    tagCutawayWall,
    tier2FloorY,
    wallCapMat,
    wallH,
    warmRoomPlasterMat,
  } = kit;

  // West Load-Bearing Cross-Wall between Boot Lobby/WC (Y = -0.30m) and Entrance Hall with Stairs (Y = -0.30m)
  // (0.24m thick, X = -12.81m..-13.05m, center X = -12.93m)
  // Open solid oak cased architrave doorway right near the South exterior wall at Z = +1.77m (Z = +1.30m..+2.24m — Issue #1)
  addInteriorWall(-12.93, lowerWallMidY, -0.6, 0.24, lowerWallH, 3.8, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addInteriorWall(-12.93, lowerWallMidY, 2.32, 0.24, lowerWallH, 0.16, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addInteriorWall(-12.93, lowerDoorLintelY, 1.77, 0.24, lowerDoorLintelH, 0.94, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addCasedArchitravePortal(scene, {
    axis: 'z',
    wallCoord: -12.93,
    wallThickness: 0.24,
    openingCenter: 1.77,
    openingWidth: 0.94,
    frontFloorY: lowerFloorY,
    backFloorY: lowerFloorY,
    headY: lowerFloorY + doorH,
    material: antiqueOakSkirtingMat,
    namePrefix: 'hall.bootLobbyPortal',
  });

  // =========================================================================
  // 3. ENTRANCE HALL WITH STAIRS (Hall, 16'1" x 13'1")
  //    Non-square period geometry with 75%-staggered step-up portal:
  //    - North wall: X = -17.55m..-13.05m at Z = -2.50m
  //    - East wall:  X = -13.05m, Z = -2.50m..+2.40m
  //    - South wall: X = -13.05m..-17.90m at Z = +2.40m, with floorboards extending cleanly
  //      into the `hallStepUpPortal` doorway opening (`X = -17.745m..-16.985m, Z = +2.40m..+2.652m`)
  //      right up to the 56mm solid oak bullnose step nosing (`Z = +2.652m..+2.708m` — Issue #1)
  //    - West cross-wall: angled off-square from (-17.90, +2.40) to (-17.55, -2.50)
  //    - Floor at Y = -0.30m (engineered timber oak flooring, continuous with Boot Lobby at identical scale)
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-17.55, -2.5],
      [-13.05, -2.5],
      [-13.05, 2.4],
      [-16.985, 2.4],
      [-16.985, 2.652],
      [-17.745, 2.652],
      [-17.745, 2.4],
      [-17.9, 2.4],
    ],
    lowerFloorY,
    0.08,
    engineeredOakFloorMat,
    [1 / 4.4, 1 / 1.76]
  ).name = 'hall.floor';

  // North Exterior Brick Wall of Hall (0.28m thick, Z = -2.50m..-2.78m, X = -12.81m..-17.55m)
  // With 3-pane white cottage casement window centered at X = -14.55m (aligned with the
  // 75%-staggered step-up opening sightline in media_1790504019383.webp!)
  addBrickWallAlongXWithWindow(
    -17.55,
    -12.81,
    -2.78,
    -2.5,
    -14.55,
    1.22,
    1.0,
    1.78,
    'south',
    3
  );

  // Face-fixed linen Roman blind over the hall North window (aperture X = -15.16m..-13.94m, Y = 0.68m..1.62m),
  // shown part-lowered with its soft pleat stack covering the top of the casement.
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'hall.northWindow.romanBlind',
    zone: 'hall',
    centerX: -14.55,
    width: 1.22,
    railY: 1.735,
    bottomY: 1.4,
    wallFaceZ: -2.5,
    facingZ: 1,
    cutawayWall: {
      axis: 'z',
      coord: -2.64,
      minSpan: -17.55,
      maxSpan: -12.81,
      floor: 'ground',
    },
  });

  // Issue #10: Detached North passage boundary wall removed per user annotation.

  // Upper South Brick Wall Spandrel of Hall above the Entrance Hallway East Jut-Out ceiling (X = -16.92m..-16.25m, Y = frontWallH..wallH)
  addExteriorBrickWall(-16.92, -16.25, 2.4, 2.68, frontWallH, wallH, 'north');

  // South Exterior Brick Wall of Hall (0.28m thick, Z = +2.40m..+2.68m, X = -12.81m..-16.25m, starting at the East end of the Entrance Hallway jut-out)
  // Collinear with the Cinema Room South wall and Hall Step-Up Portal wall (zero kink, zero step!)
  addBrickWallAlongXWithCourtyardDoor(
    -16.25,
    -12.81,
    2.4,
    2.68,
    -14.65,
    0.98,
    'north',
    0
  );

  // =========================================================================
  // EAST WALL OF ENTRANCE HALL: SEGMENTAL ARCHED PLASTER FIREPLACE WITH LOG
  // BURNER, STEPPED OAK CEILING BEAM, WIDE STRUCTURAL PIER & ALCOVE METER BOX
  // =========================================================================
  const hallFireplaceGroup = new THREE.Group();
  hallFireplaceGroup.name = 'hall.fireplace';
  hallFireplaceGroup.userData.zone = 'hall';

  // Segmental arched chimney breast extruded along X (X = -13.55m..-13.05m, Z = -1.35m..+0.25m, height 1.74m)
  // Shape is defined in 2D (u = Z, v = Y above lowerFloorY) and extruded by 0.50m, then rotated around Y by +90°
  const fpBreastShape = new THREE.Shape();
  fpBreastShape.moveTo(-1.35, 0);
  fpBreastShape.lineTo(-0.98, 0);
  fpBreastShape.lineTo(-0.98, 0.96);
  // Segmental arch across Z = -0.98m..-0.12m (crown at Z = -0.55m, Y = 1.07m)
  fpBreastShape.quadraticCurveTo(-0.55, 1.15, -0.12, 0.96);
  fpBreastShape.lineTo(-0.12, 0);
  fpBreastShape.lineTo(0.25, 0);
  fpBreastShape.lineTo(0.25, 1.74);
  fpBreastShape.lineTo(-1.35, 1.74);
  fpBreastShape.closePath();

  const fpBreastGeo = new THREE.ExtrudeGeometry(fpBreastShape, {
    depth: 0.5,
    bevelEnabled: false,
  });
  fpBreastGeo.rotateY(Math.PI / 2); // local X->-Z, local Z->+X, so swap sign on Z or build with X=-Z
  const fpBreastPos = fpBreastGeo.attributes.position;
  if (fpBreastPos) {
    for (let i = 0; i < fpBreastPos.count; i++) {
      fpBreastPos.setZ(i, -fpBreastPos.getZ(i));
    }
    fpBreastPos.needsUpdate = true;
    for (let i = 0; i < fpBreastPos.count; i++) {
      fpBreastPos.setX(i, -fpBreastPos.getX(i));
    }
    fpBreastPos.needsUpdate = true;
    fpBreastGeo.computeVertexNormals();
  }
  fpBreastGeo.computeBoundingSphere();
  const fpBreastMesh = new THREE.Mesh(fpBreastGeo, warmRoomPlasterMat);
  fpBreastMesh.name = 'hall.fireplaceBreast';
  fpBreastMesh.position.set(-13.05, lowerFloorY, 0);
  fpBreastMesh.castShadow = true;
  fpBreastMesh.receiveShadow = true;
  hallFireplaceGroup.add(fpBreastMesh);

  // Issue #6: 45°-mitred 146mm antique oak skirting boards wrapping the Hall East wall and the North & South piers and returns of `fpBreastMesh`
  {
    const fpNorthSkirtMesh = new THREE.Mesh(
      createSharedGeo(
        buildMitredWallSkirtingGeometry(
          [
            [-13.05, -2.5],
            [-13.05, -1.35],
            [-13.55, -1.35],
            [-13.55, -0.98],
          ],
          lowerFloorY
        )
      ),
      antiqueOakSkirtingMat
    );
    fpNorthSkirtMesh.name = 'hall.fireplaceBreast.skirting.north';
    fpNorthSkirtMesh.castShadow = true;
    fpNorthSkirtMesh.receiveShadow = true;
    hallFireplaceGroup.add(fpNorthSkirtMesh);

    const fpSouthSkirtMesh = new THREE.Mesh(
      createSharedGeo(
        buildMitredWallSkirtingGeometry(
          [
            [-13.55, -0.12],
            [-13.55, 0.25],
            [-13.05, 0.25],
            [-13.05, 1.218],
          ],
          lowerFloorY
        )
      ),
      antiqueOakSkirtingMat
    );
    fpSouthSkirtMesh.name = 'hall.fireplaceBreast.skirting.south';
    fpSouthSkirtMesh.castShadow = true;
    fpSouthSkirtMesh.receiveShadow = true;
    hallFireplaceGroup.add(fpSouthSkirtMesh);
  }

  // Smooth pale-plastered firebox back wall inside the recess (X = -13.10m, Z = -0.99m..-0.11m)
  const fpBackWall = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.06, 1.16, 0.9)),
    warmRoomPlasterMat
  );
  fpBackWall.name = 'hall.fireplace.fireboxBack';
  fpBackWall.position.set(-13.09, lowerFloorY + 0.58, -0.55);
  fpBackWall.receiveShadow = true;
  hallFireplaceGroup.add(fpBackWall);

  // Heavy Stripped Natural Oak Stepped / Moulded Timber Fascia Beam spanning across the left alcove, fireplace top,
  // and seating cleanly atop the shifted right structural pier (`hallSpinePost` at Z = +0.46m, Z = -2.46m..+0.59m — Issue #2 & Issue #7)
  const fpBeamLen = 3.05;
  const fpBeamCenterZ = -0.935;
  const fpLowerBeamBand = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.54, 0.16, fpBeamLen)),
    oakMat
  );
  fpLowerBeamBand.name = 'hall.fireplaceBeam.lower';
  fpLowerBeamBand.position.set(-13.31, lowerFloorY + 1.82, fpBeamCenterZ);
  fpLowerBeamBand.castShadow = true;
  fpLowerBeamBand.receiveShadow = true;
  hallFireplaceGroup.add(fpLowerBeamBand);

  const fpMidMouldingBand = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.57, 0.045, fpBeamLen + 0.02)),
    oakMat
  );
  fpMidMouldingBand.name = 'hall.fireplaceBeam.midMoulding';
  fpMidMouldingBand.position.set(-13.325, lowerFloorY + 1.9225, fpBeamCenterZ);
  fpMidMouldingBand.castShadow = true;
  hallFireplaceGroup.add(fpMidMouldingBand);

  const fpUpperBeamBand = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.55, 0.16, fpBeamLen)),
    oakMat
  );
  fpUpperBeamBand.name = 'hall.fireplaceBeam.upper';
  fpUpperBeamBand.position.set(-13.315, lowerFloorY + 2.025, fpBeamCenterZ);
  fpUpperBeamBand.castShadow = true;
  hallFireplaceGroup.add(fpUpperBeamBand);

  // Red-Brick Fireplace Hearth inside the recess (X = -13.06m..-13.56m, Z = -0.98m..-0.12m)
  // With individual front soldier-course red bricks matching media_1790514908713.webp
  const hallFpHearthGeo = new THREE.BoxGeometry(0.5, 0.068, 0.86);
  applyWorldSpaceBrickUVs(hallFpHearthGeo, -13.31, lowerFloorY + 0.034, -0.55);
  hallFpHearthGeo.computeBoundingSphere();
  const hallFpHearth = new THREE.Mesh(hallFpHearthGeo, exteriorBrickMat);
  hallFpHearth.name = 'hall.fireplace.hearth';
  hallFpHearth.position.set(-13.31, lowerFloorY + 0.034, -0.55);
  hallFpHearth.receiveShadow = true;
  hallFireplaceGroup.add(hallFpHearth);

  const hearthFrontBrickGeo = createSharedGeo(new THREE.BoxGeometry(0.11, 0.072, 0.068));
  for (let b = 0; b < 11; b++) {
    const bz = -0.94 + b * 0.078;
    const frontBrick = tagHighLod(new THREE.Mesh(hearthFrontBrickGeo, singleClayBrickMat));
    frontBrick.name = `hall.fireplace.hearthBrick.${b + 1}`;
    frontBrick.position.set(-13.515, lowerFloorY + 0.036, bz);
    frontBrick.castShadow = true;
    frontBrick.receiveShadow = true;
    hallFireplaceGroup.add(frontBrick);
  }

  // Black Cast-Iron Log-Burning Stove on 4 legs with Arched Glass Door, Chrome Handle, Flue & White Thermometer
  // (media_1790514908713.webp center)
  const hallStoveGroup = new THREE.Group();
  hallStoveGroup.name = 'hall.woodBurningStove';
  hallStoveGroup.position.set(-13.33, lowerFloorY + 0.07, -0.53);

  // 4 short cast-iron corner legs sharing one BufferGeometry
  const stoveLegGeo = createSharedGeo(new THREE.BoxGeometry(0.042, 0.09, 0.042));
  const stoveLegCoords = [
    [-0.14, -0.19],
    [-0.14, 0.19],
    [0.14, -0.19],
    [0.14, 0.19],
  ] as const;
  for (let lIdx = 0; lIdx < stoveLegCoords.length; lIdx++) {
    const [lx, lz] = stoveLegCoords[lIdx]!;
    const leg = tagHighLod(new THREE.Mesh(stoveLegGeo, castIronMat));
    leg.name = `hall.woodBurningStove.leg.${lIdx + 1}`;
    leg.position.set(lx, 0.045, lz);
    leg.castShadow = true;
    hallStoveGroup.add(leg);
  }

  // Stove firebox body & stepped top plate (with recessed front firebox cavity X = -0.17m..-0.06m, Y = 0.19m..0.43m, Z = -0.125m..+0.125m)
  const hallStoveBody = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.22, 0.44, 0.44)),
    castIronMat
  );
  hallStoveBody.name = 'hall.woodBurningStove.body';
  hallStoveBody.position.set(0.06, 0.31, 0);
  hallStoveBody.castShadow = true;
  hallStoveGroup.add(hallStoveBody);

  // Front carcass surround enclosing the recessed firebox cavity (`X = -0.17m..-0.05m`)
  for (const [partSuffix, px, py, pz, sx, sy, sz] of [
    ['lowerAshApron', -0.11, 0.14, 0, 0.12, 0.1, 0.44],
    ['upperHoodBreast', -0.11, 0.48, 0, 0.12, 0.1, 0.44],
    ['sideCheek.north', -0.11, 0.31, -0.1725, 0.12, 0.24, 0.095],
    ['sideCheek.south', -0.11, 0.31, 0.1725, 0.12, 0.24, 0.095],
  ] as const) {
    const carcassPiece = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(sx, sy, sz)),
      castIronMat
    );
    carcassPiece.name = `hall.woodBurningStove.${partSuffix}`;
    carcassPiece.position.set(px, py, pz);
    carcassPiece.castShadow = true;
    hallStoveGroup.add(carcassPiece);
  }

  const hallStoveTopPlate = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.37, 0.028, 0.47)),
    castIronMat
  );
  hallStoveTopPlate.name = 'hall.woodBurningStove.topPlate';
  hallStoveTopPlate.position.set(0, 0.54, 0);
  hallStoveTopPlate.castShadow = true;
  hallStoveGroup.add(hallStoveTopPlate);

  // Framed front cast-iron door rails & stiles surrounding the 0.25m × 0.26m glass viewing window on the West (-X) face
  for (const [framePart, py, pz, sy, sz] of [
    ['topRail', 0.455, 0, 0.05, 0.34],
    ['bottomRail', 0.165, 0, 0.05, 0.34],
    ['leftStile', 0.31, -0.1475, 0.24, 0.045],
    ['rightStile', 0.31, 0.1475, 0.24, 0.045],
  ] as const) {
    const doorPiece = tagHighLod(
      new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(0.022, sy, sz)), castIronMat)
    );
    doorPiece.name =
      framePart === 'topRail'
        ? 'hall.woodBurningStove.doorFrame'
        : `hall.woodBurningStove.doorFrame.${framePart}`;
    doorPiece.position.set(-0.175, py, pz);
    doorPiece.castShadow = true;
    hallStoveGroup.add(doorPiece);
  }

  // Arched cast-iron top window brow inside the door aperture
  const stoveWindowBrow = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(0.024, 0.02, 0.254)), castIronMat)
  );
  stoveWindowBrow.name = 'hall.woodBurningStove.windowBrow';
  stoveWindowBrow.position.set(-0.176, 0.422, 0);
  hallStoveGroup.add(stoveWindowBrow);

  // Sculpted organic S-curve flame tongues, white-hot inner cores, glowing fissured ember bed,
  // rising sparks, ceramic stove glass (`hall.woodBurningStove.doorGlass`), and hearth firelight glow pool
  interactions.registerAnimatedInteractable(
    buildHallWoodBurningStoveFirebox({
      stoveGroup: hallStoveGroup,
      castIronMat,
    })
  );


  // Chrome / brushed-steel latch handle on the left (-Z) side of the stove door
  const stoveDoorHandle = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.085, 10)),
      ceramicWhiteMat
    )
  );
  stoveDoorHandle.name = 'hall.woodBurningStove.doorHandle';
  stoveDoorHandle.position.set(-0.192, 0.28, -0.145);
  hallStoveGroup.add(stoveDoorHandle);


  // Cast-iron top flue spigot collar, seamless vertical-to-swept Ø125mm flue pipe (`hall.woodBurningStove.flue`),
  // and locking joint band entering the chimney throat cleanly (Issue #2 & media_1790514908713.webp)
  const hallFlueSpigot = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.068, 0.076, 0.038, 20)),
      castIronMat
    )
  );
  hallFlueSpigot.name = 'hall.woodBurningStove.flueSpigot';
  hallFlueSpigot.position.set(0.025, 0.568, 0);
  hallFlueSpigot.castShadow = true;
  hallStoveGroup.add(hallFlueSpigot);

  const hallFlueCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.025, 0.555, 0),
    new THREE.Vector3(0.025, 0.69, 0),
    new THREE.Vector3(0.025, 0.81, 0),
    new THREE.Vector3(0.038, 0.91, 0),
    new THREE.Vector3(0.065, 1.02, 0),
  ]);
  const hallStoveFlue = new THREE.Mesh(
    createSharedGeo(new THREE.TubeGeometry(hallFlueCurve, 28, 0.062, 20, false)),
    castIronMat
  );
  hallStoveFlue.name = 'hall.woodBurningStove.flue';
  hallStoveFlue.castShadow = true;
  hallStoveFlue.receiveShadow = true;
  hallStoveGroup.add(hallStoveFlue);

  const hallFlueJointBand = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.066, 0.066, 0.022, 20)),
      castIronMat
    )
  );
  hallFlueJointBand.name = 'hall.woodBurningStove.flueJointBand';
  hallFlueJointBand.position.set(0.025, 0.8, 0);
  hallFlueJointBand.castShadow = true;
  hallStoveGroup.add(hallFlueJointBand);

  hallFireplaceGroup.add(hallStoveGroup);

  // Substantial Square Plastered Structural Pier supporting the Spine Beam & Fireplace Beam at the right (South) of the fireplace
  // (Issue #2, #6 & #7: shifted slightly right to Z = +0.46m, X = -13.42m, capped cleanly at lowerFloorY + 1.74m beneath fpLowerBeamBand,
  //  with 4-sided 45°-mitred 146mm antique oak skirting wrapping its base!)
  const spinePostX = -13.42;
  const spinePostZ = 0.46;
  const spinePostW = 0.26;
  const spinePostH = 1.74;
  const hallSpinePost = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(spinePostW, spinePostH, spinePostW)),
    warmRoomPlasterMat
  );
  hallSpinePost.name = 'hall.spinePost';
  hallSpinePost.position.set(spinePostX, lowerFloorY + spinePostH * 0.5, spinePostZ);
  hallSpinePost.castShadow = true;
  hallSpinePost.receiveShadow = true;
  hallFireplaceGroup.add(hallSpinePost);

  const hallSpinePostBase = new THREE.Mesh(
    createSharedGeo(
      buildMitredWallSkirtingGeometry(
        [
          [spinePostX + spinePostW * 0.5, spinePostZ - spinePostW * 0.5],
          [spinePostX - spinePostW * 0.5, spinePostZ - spinePostW * 0.5],
          [spinePostX - spinePostW * 0.5, spinePostZ + spinePostW * 0.5],
          [spinePostX + spinePostW * 0.5, spinePostZ + spinePostW * 0.5],
          [spinePostX + spinePostW * 0.5, spinePostZ - spinePostW * 0.5],
        ],
        lowerFloorY
      )
    ),
    antiqueOakSkirtingMat
  );
  hallSpinePostBase.name = 'hall.spinePost.skirting';
  hallSpinePostBase.castShadow = true;
  hallSpinePostBase.receiveShadow = true;
  hallFireplaceGroup.add(hallSpinePostBase);

  // Warm LED strip tucked under the front lip of the lower fireplace beam where its soffit is exposed over
  // the left (North) alcove (Z = -2.44m..-1.37m; over the chimney breast the beam bears on the plaster).
  {
    const beamSoffitY = lowerFloorY + 1.82 - 0.08;
    const beamLedMinZ = -2.44;
    const beamLedMaxZ = -1.37;
    const beamLedMat = new THREE.MeshStandardMaterial({
      color: 0xffeab8,
      emissive: 0xffa834,
      emissiveIntensity: 2.4,
      roughness: 0.18,
    });
    beamLedMat.userData.baseEmissiveIntensity = 2.4;
    lightGroups.hallBeamLeds.emissives.push(beamLedMat);

    const beamLedStrip = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.014, 0.008, beamLedMaxZ - beamLedMinZ)),
      beamLedMat
    );
    beamLedStrip.name = 'hall.fireplaceBeam.ledStrip';
    beamLedStrip.position.set(-13.53, beamSoffitY - 0.004, (beamLedMinZ + beamLedMaxZ) / 2);
    hallFireplaceGroup.add(beamLedStrip);
    interactions.registerLightFixture(beamLedStrip, 'hallBeamLeds');

    // Emissive strip + floor pool only (the hall's South & East wall lights provide the PointLight fill).
    ctx.addGlowPool('hallBeamLeds', -13.4, lowerFloorY + 0.006, (beamLedMinZ + beamLedMaxZ) / 2, 0.7, 0.2);
  }

  scene.add(hallFireplaceGroup);

  // Non-Square West Load-Bearing Cross-Wall between Entrance Hall (Y = -0.30m) and Front Room (Y = -0.60m)
  // Runs from [-17.55, -2.50] at the North wall to [-17.90, +2.40] at the Center Pier
  // between the Front Room doorway and the 30cm Hall step-up opening!
  const hallFrontRoomCrossWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-17.55, -2.5],
    end: [-17.9, 2.4],
    thickness: 0.24,
    topY: 2.0,
    frontFloorY: tier2FloorY, // +normal = West (Front / Cinema Room at Y = -0.60m)
    backFloorY: lowerFloorY,  // -normal = East (Entrance Hall at Y = -0.30m)
    wallMaterial: warmRoomPlasterMat,
    frontFaceMaterial: farrowAndBallPantalonMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: false, // Built as a single continuous mitred stringer + skirting in hall-staircase.ts
  });

  // Antique-Profiled Oak Skirting Board along the North wall of Hall under the 3-pane window and open upper stair soffit (X = -16.64m..-13.05m, Z = -2.488m — Issue #14)
  const hallNorthSkirting = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(3.59, 0.122, 0.022)),
    antiqueOakSkirtingMat
  );
  hallNorthSkirting.name = 'hall.northWall.skirting';
  hallNorthSkirting.position.set(-14.845, lowerFloorY + 0.061, -2.488);
  tagCutawayWall(hallNorthSkirting, {
    axis: 'z',
    coord: -2.64,
    minSpan: -17.55,
    maxSpan: -12.81,
    floor: 'ground',
  });
  scene.add(hallNorthSkirting);

  const hallNorthSkirtingCap = new THREE.Mesh(
    createSharedGeo(
      buildSweptMouldingGeometry(
        createSkirtingCapProfile(),
        [
          [-16.64, lowerFloorY + 0.122],
          [-13.05, lowerFloorY + 0.122],
        ],
        (a, y, d) => new THREE.Vector3(a, y, -2.499 + d)
      )
    ),
    antiqueOakSkirtingMat
  );
  hallNorthSkirtingCap.name = 'hall.northWall.skirtingCap';
  hallNorthSkirtingCap.castShadow = true;
  hallNorthSkirtingCap.receiveShadow = true;
  tagCutawayWall(hallNorthSkirtingCap, {
    axis: 'z',
    coord: -2.64,
    minSpan: -17.55,
    maxSpan: -12.81,
    floor: 'ground',
  });
  scene.add(hallNorthSkirtingCap);

  return {
    hallFrontRoomCrossWallFrame,
  };
}
