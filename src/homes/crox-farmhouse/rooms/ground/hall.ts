import * as THREE from 'three';
import { buildAngledWallSegment, buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
  buildSweptMouldingGeometry,
  createSkirtingCapProfile,
} from '../../../../engine/geometry/swept-moulding.ts';
import { buildWindowRomanBlind } from '../../../../objects/decor/roman-blind.ts';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { buildDiningRoom } from './dining-room.ts';

/**
 * Stair Hall (`hall`): boot-lobby cross wall, exterior walls, segmental arched fireplace, beam and meter alcove.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildHall(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat' | 'ceramicWhiteMat' | 'doorH' | 'engineeredOakFloorMat' | 'exteriorBrickMat' | 'farrowAndBallPantalonMat' | 'frontWallH' | 'oakMat' | 'singleClayBrickMat' | 'tagCutawayWall' | 'wallCapMat' | 'wallH' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addBrickWallAlongXWithCourtyardDoor' | 'addBrickWallAlongXWithWindow' | 'addExteriorBrickWall' | 'addInteriorWall' | 'applyWorldSpaceBrickUVs'> &
    Pick<ReturnType<typeof buildDiningRoom>, 'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
) {
  const { interactions, lightGroups, scene } = ctx;
  const {
    addBrickWallAlongXWithCourtyardDoor,
    addBrickWallAlongXWithWindow,
    addExteriorBrickWall,
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    brassMat,
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
    windowGlassMat,
  } = kit;
 // 0.5125m

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
  const fpBreastMesh = new THREE.Mesh(fpBreastGeo, warmRoomPlasterMat);
  fpBreastMesh.name = 'hall.fireplaceBreast';
  fpBreastMesh.position.set(-13.05, lowerFloorY, 0);
  fpBreastMesh.castShadow = true;
  fpBreastMesh.receiveShadow = true;
  hallFireplaceGroup.add(fpBreastMesh);

  // Issue #6: 45°-mitred 146mm antique oak skirting boards wrapping the Hall East wall and the North & South piers and returns of `fpBreastMesh`
  {
    const fpNorthSkirtMesh = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-13.05, -2.5],
          [-13.05, -1.35],
          [-13.55, -1.35],
          [-13.55, -0.98],
        ],
        lowerFloorY
      ),
      antiqueOakSkirtingMat
    );
    fpNorthSkirtMesh.name = 'hall.fireplaceBreast.skirting.north';
    fpNorthSkirtMesh.castShadow = true;
    fpNorthSkirtMesh.receiveShadow = true;
    hallFireplaceGroup.add(fpNorthSkirtMesh);

    const fpSouthSkirtMesh = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-13.55, -0.12],
          [-13.55, 0.25],
          [-13.05, 0.25],
          [-13.05, 1.218],
        ],
        lowerFloorY
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
    new THREE.BoxGeometry(0.06, 1.16, 0.9),
    warmRoomPlasterMat
  );
  fpBackWall.position.set(-13.09, lowerFloorY + 0.58, -0.55);
  fpBackWall.receiveShadow = true;
  hallFireplaceGroup.add(fpBackWall);

  // Heavy Stripped Natural Oak Stepped / Moulded Timber Fascia Beam spanning across the left alcove, fireplace top,
  // and seating cleanly atop the shifted right structural pier (`hallSpinePost` at Z = +0.46m, Z = -2.46m..+0.59m — Issue #2 & Issue #7)
  const fpBeamLen = 3.05;
  const fpBeamCenterZ = -0.935;
  const fpLowerBeamBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.16, fpBeamLen),
    oakMat
  );
  fpLowerBeamBand.name = 'hall.fireplaceBeam.lower';
  fpLowerBeamBand.position.set(-13.31, lowerFloorY + 1.82, fpBeamCenterZ);
  fpLowerBeamBand.castShadow = true;
  fpLowerBeamBand.receiveShadow = true;
  hallFireplaceGroup.add(fpLowerBeamBand);

  const fpMidMouldingBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.57, 0.045, fpBeamLen + 0.02),
    oakMat
  );
  fpMidMouldingBand.name = 'hall.fireplaceBeam.midMoulding';
  fpMidMouldingBand.position.set(-13.325, lowerFloorY + 1.9225, fpBeamCenterZ);
  fpMidMouldingBand.castShadow = true;
  hallFireplaceGroup.add(fpMidMouldingBand);

  const fpUpperBeamBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.16, fpBeamLen),
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
  const hallFpHearth = new THREE.Mesh(hallFpHearthGeo, exteriorBrickMat);
  hallFpHearth.position.set(-13.31, lowerFloorY + 0.034, -0.55);
  hallFpHearth.receiveShadow = true;
  hallFireplaceGroup.add(hallFpHearth);

  for (let b = 0; b < 11; b++) {
    const bz = -0.94 + b * 0.078;
    const frontBrick = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.072, 0.068),
      singleClayBrickMat
    );
    frontBrick.position.set(-13.515, lowerFloorY + 0.036, bz);
    frontBrick.castShadow = true;
    frontBrick.receiveShadow = true;
    hallFireplaceGroup.add(frontBrick);
  }

  // Black Cast-Iron Log-Burning Stove on 4 legs with Arched Glass Door, Chrome Handle, Flue & White Thermometer
  // (media_1790514908713.webp center)
  const hallStoveGroup = new THREE.Group();
  hallStoveGroup.position.set(-13.33, lowerFloorY + 0.07, -0.53);

  // 4 short cast-iron corner legs
  for (const [lx, lz] of [
    [-0.14, -0.19],
    [-0.14, 0.19],
    [0.14, -0.19],
    [0.14, 0.19],
  ] as const) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.09, 0.042),
      castIronMat
    );
    leg.position.set(lx, 0.045, lz);
    leg.castShadow = true;
    hallStoveGroup.add(leg);
  }

  // Stove firebox body & stepped top plate
  const hallStoveBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.44, 0.44),
    castIronMat
  );
  hallStoveBody.position.set(0, 0.31, 0);
  hallStoveBody.castShadow = true;
  hallStoveGroup.add(hallStoveBody);

  const hallStoveTopPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.028, 0.47),
    castIronMat
  );
  hallStoveTopPlate.position.set(0, 0.54, 0);
  hallStoveTopPlate.castShadow = true;
  hallStoveGroup.add(hallStoveTopPlate);

  // Framed front door & dark glass viewing window on the West (-X) face of the stove
  const stoveDoorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.34, 0.34),
    castIronMat
  );
  stoveDoorFrame.position.set(-0.175, 0.31, 0);
  hallStoveGroup.add(stoveDoorFrame);

  const stoveDoorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.25, 0.26),
    windowGlassMat
  );
  stoveDoorGlass.position.set(-0.178, 0.31, 0);
  hallStoveGroup.add(stoveDoorGlass);

  // Chrome / brushed-steel latch handle on the left (-Z) side of the stove door
  const stoveDoorHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.085, 10),
    ceramicWhiteMat
  );
  stoveDoorHandle.position.set(-0.192, 0.28, -0.145);
  hallStoveGroup.add(stoveDoorHandle);

  // Cast-iron top flue spigot collar, seamless vertical-to-swept Ø125mm flue pipe (`hall.woodBurningStove.flue`),
  // and locking joint band entering the chimney throat cleanly (Issue #2 & media_1790514908713.webp)
  const hallFlueSpigot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.076, 0.038, 20),
    castIronMat
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
    new THREE.TubeGeometry(hallFlueCurve, 28, 0.062, 20, false),
    castIronMat
  );
  hallStoveFlue.name = 'hall.woodBurningStove.flue';
  hallStoveFlue.castShadow = true;
  hallStoveFlue.receiveShadow = true;
  hallStoveGroup.add(hallStoveFlue);

  const hallFlueJointBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.066, 0.066, 0.022, 20),
    castIronMat
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
    new THREE.BoxGeometry(spinePostW, spinePostH, spinePostW),
    warmRoomPlasterMat
  );
  hallSpinePost.name = 'hall.spinePost';
  hallSpinePost.position.set(spinePostX, lowerFloorY + spinePostH * 0.5, spinePostZ);
  hallSpinePost.castShadow = true;
  hallSpinePost.receiveShadow = true;
  hallFireplaceGroup.add(hallSpinePost);

  const hallSpinePostBase = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [spinePostX + spinePostW * 0.5, spinePostZ - spinePostW * 0.5],
        [spinePostX - spinePostW * 0.5, spinePostZ - spinePostW * 0.5],
        [spinePostX - spinePostW * 0.5, spinePostZ + spinePostW * 0.5],
        [spinePostX + spinePostW * 0.5, spinePostZ + spinePostW * 0.5],
        [spinePostX + spinePostW * 0.5, spinePostZ - spinePostW * 0.5],
      ],
      lowerFloorY
    ),
    antiqueOakSkirtingMat
  );
  hallSpinePostBase.name = 'hall.spinePost.skirting';
  hallSpinePostBase.castShadow = true;
  hallSpinePostBase.receiveShadow = true;
  hallFireplaceGroup.add(hallSpinePostBase);

  // Issue #4: Removed `hallNorthSocket` faceplate off the North wall at [-13.56, lowerFloorY + 0.24, -2.485].
  // Issue #5: Removed `stoveThermometer` & `thermometerDial` from on top of the log burner.

  // Issue #3: Turned Aged-Brass & Fluted-Walnut Column Floor Lamp with Warm Tapered Linen Empire Shade
  // at [-13.619, lowerFloorY, -2.044], wired to the KNX `hallPendant` circuit
  {
    const floorLampGroup = new THREE.Group();
    floorLampGroup.name = 'hall.floorLamp';
    floorLampGroup.userData.zone = 'hall';
    floorLampGroup.position.set(-13.619, lowerFloorY, -2.044);

    const lampBrassMat = new THREE.MeshStandardMaterial({
      color: 0x8d6b3b,
      roughness: 0.28,
      metalness: 0.82,
    });
    const lampDarkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x3b2d1d,
      roughness: 0.36,
      metalness: 0.72,
    });
    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf6ebd6,
      emissive: 0xffb654,
      emissiveIntensity: 2.1,
      roughness: 0.62,
      side: THREE.DoubleSide,
    });
    lampShadeMat.userData.baseEmissiveIntensity = 2.1;
    const lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e4,
      emissive: 0xffbc58,
      emissiveIntensity: 2.8,
      roughness: 0.14,
    });
    lampBulbMat.userData.baseEmissiveIntensity = 2.8;
    lightGroups.hallPendant.emissives.push(lampShadeMat, lampBulbMat);

    // 1. Stepped circular weighted aged-brass plinth base (r = 0.165m)
    const basePlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.158, 0.168, 0.022, 28),
      lampBrassMat
    );
    basePlinth.name = 'hall.floorLamp.base';
    basePlinth.position.set(0, 0.011, 0);
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    floorLampGroup.add(basePlinth);

    const baseStep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.112, 0.148, 0.026, 24),
      lampBrassMat
    );
    baseStep.position.set(0, 0.035, 0);
    baseStep.castShadow = true;
    floorLampGroup.add(baseStep);

    const baseTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.008, 12, 24),
      lampDarkBronzeMat
    );
    baseTorus.rotation.x = Math.PI / 2;
    baseTorus.position.set(0, 0.048, 0);
    floorLampGroup.add(baseTorus);

    // Lower turned baluster collar
    const lowerBaluster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.058, 0.095, 20),
      lampBrassMat
    );
    lowerBaluster.position.set(0, 0.095, 0);
    lowerBaluster.castShadow = true;
    floorLampGroup.add(lowerBaluster);

    // 2. Slender vertical standard stem (lower section + central turned brass knop + upper section)
    const lowerStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.019, 0.58, 16),
      antiqueOakSkirtingMat
    );
    lowerStem.name = 'hall.floorLamp.stemLower';
    lowerStem.position.set(0, 0.43, 0);
    lowerStem.castShadow = true;
    floorLampGroup.add(lowerStem);

    const centerKnop = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 16, 12),
      lampBrassMat
    );
    centerKnop.scale.set(1, 0.72, 1);
    centerKnop.position.set(0, 0.73, 0);
    floorLampGroup.add(centerKnop);

    for (const dy of [-0.022, 0.022] as const) {
      const knopRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.021, 0.01, 16),
        lampDarkBronzeMat
      );
      knopRing.position.set(0, 0.73 + dy, 0);
      floorLampGroup.add(knopRing);
    }

    const upperStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0135, 0.016, 0.54, 16),
      lampBrassMat
    );
    upperStem.name = 'hall.floorLamp.stemUpper';
    upperStem.position.set(0, 1.01, 0);
    upperStem.castShadow = true;
    floorLampGroup.add(upperStem);

    // Upper capital collar & twin pull-chain lampholder cluster
    const capitalCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.016, 0.048, 18),
      lampBrassMat
    );
    capitalCollar.position.set(0, 1.295, 0);
    floorLampGroup.add(capitalCollar);

    // 2 pull chains with acorn finials hanging beneath the shade
    for (const sideX of [-0.032, 0.032] as const) {
      const pullChain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0018, 0.11, 8),
        lampBrassMat
      );
      pullChain.position.set(sideX, 1.255, 0.012);
      floorLampGroup.add(pullChain);

      const pullAcorn = new THREE.Mesh(
        new THREE.SphereGeometry(0.0055, 10, 10),
        lampDarkBronzeMat
      );
      pullAcorn.scale.set(0.85, 1.35, 0.85);
      pullAcorn.position.set(sideX, 1.196, 0.012);
      floorLampGroup.add(pullAcorn);
    }

    // 3. Warm LED globe bulb + Tapered Woven-Linen Empire Shade (Y = 1.26m..1.54m)
    const shadeCenterY = 1.4;
    const shadeH = 0.28;
    const shadeTopR = 0.155;
    const shadeBotR = 0.245;

    const lampBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 14, 12),
      lampBulbMat
    );
    lampBulb.name = 'hall.floorLamp.bulb';
    lampBulb.position.set(0, shadeCenterY - 0.02, 0);
    floorLampGroup.add(lampBulb);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(shadeTopR, shadeBotR, shadeH, 32, 1, true),
      lampShadeMat
    );
    lampShade.name = 'hall.floorLamp.shade';
    lampShade.position.set(0, shadeCenterY, 0);
    lampShade.castShadow = true;
    floorLampGroup.add(lampShade);

    const shadeTopRim = new THREE.Mesh(
      new THREE.TorusGeometry(shadeTopR, 0.004, 10, 32),
      lampDarkBronzeMat
    );
    shadeTopRim.rotation.x = Math.PI / 2;
    shadeTopRim.position.set(0, shadeCenterY + shadeH * 0.5, 0);
    floorLampGroup.add(shadeTopRim);

    const shadeBotRim = new THREE.Mesh(
      new THREE.TorusGeometry(shadeBotR, 0.0045, 10, 32),
      lampDarkBronzeMat
    );
    shadeBotRim.rotation.x = Math.PI / 2;
    shadeBotRim.position.set(0, shadeCenterY - shadeH * 0.5, 0);
    floorLampGroup.add(shadeBotRim);

    // 3-spoke brass spider ring & top turned finial above the shade
    for (let s = 0; s < 3; s++) {
      const ang = (s * Math.PI * 2) / 3;
      const spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0022, 0.0022, shadeTopR, 8),
        lampBrassMat
      );
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = ang;
      spoke.position.set(
        Math.cos(ang) * shadeTopR * 0.5,
        shadeCenterY + shadeH * 0.5 - 0.012,
        -Math.sin(ang) * shadeTopR * 0.5
      );
      floorLampGroup.add(spoke);
    }

    const topFinial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.014, 0.042, 14),
      lampBrassMat
    );
    topFinial.position.set(0, shadeCenterY + shadeH * 0.5 + 0.012, 0);
    floorLampGroup.add(topFinial);

    scene.add(floorLampGroup);
    interactions.registerLightFixture(floorLampGroup, 'hallPendant');

    // Emissive linen shade + bulb + floor glow pool (the Hall's consolidated PointLight is on `hall.southWallLight`)
    ctx.addGlowPool('hallPendant', -13.619, lowerFloorY + 0.006, -2.044, 1.25, 0.26);
  }

  // The East Cross-Wall light between the Fireplace Post and the Boot Lobby Opening (Z = +0.74m) is now
  // `hall.eastWallLight` in pendants-and-switches.ts, matching `hall.southWallLight` on the KNX hall circuit.

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
    lightGroups.hallPendant.emissives.push(beamLedMat);

    const beamLedStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.008, beamLedMaxZ - beamLedMinZ),
      beamLedMat
    );
    beamLedStrip.name = 'hall.fireplaceBeam.ledStrip';
    beamLedStrip.position.set(-13.53, beamSoffitY - 0.004, (beamLedMinZ + beamLedMaxZ) / 2);
    hallFireplaceGroup.add(beamLedStrip);
    interactions.registerLightFixture(beamLedStrip, 'hallPendant');

    // Emissive strip + floor pool only (the hall's South & East wall lights provide the PointLight fill).
    ctx.addGlowPool('hallPendant', -13.4, lowerFloorY + 0.006, (beamLedMinZ + beamLedMaxZ) / 2, 0.7, 0.2);
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

  // Issue #5: Framed Landscape Artwork on the Hall / Front Room Cross-Wall (`[-17.586, 1.301, 1.158]`)
  // Mounted flush on the East (`-normal`, Hall) face at u = 3.66, y = 1.22, n = -0.122, plus companion artwork on the West (`+normal`, Front Room) face
  {
    const crossWallCutaway: CutawayWallDescriptor = {
      axis: 'x',
      coord: -17.65,
      minSpan: -2.5,
      maxSpan: 2.4,
      floor: 'ground',
    };

    const artCanvas = document.createElement('canvas');
    artCanvas.width = 384;
    artCanvas.height = 288;
    const aCtx = artCanvas.getContext('2d');
    if (aCtx) {
      const skyGrad = aCtx.createLinearGradient(0, 0, 0, 175);
      skyGrad.addColorStop(0, '#7c96a8');
      skyGrad.addColorStop(0.58, '#c6d2d0');
      skyGrad.addColorStop(1, '#ecdcc2');
      aCtx.fillStyle = skyGrad;
      aCtx.fillRect(0, 0, 384, 288);

      // Rolling Chilterns hills & sunlit pasture
      aCtx.fillStyle = '#627868';
      aCtx.beginPath();
      aCtx.moveTo(0, 168);
      aCtx.quadraticCurveTo(110, 132, 220, 160);
      aCtx.quadraticCurveTo(310, 140, 384, 165);
      aCtx.lineTo(384, 288);
      aCtx.lineTo(0, 288);
      aCtx.fill();

      const fieldGrad = aCtx.createLinearGradient(0, 165, 0, 288);
      fieldGrad.addColorStop(0, '#86945c');
      fieldGrad.addColorStop(0.55, '#5b6d42');
      fieldGrad.addColorStop(1, '#3c4b2c');
      aCtx.fillStyle = fieldGrad;
      aCtx.beginPath();
      aCtx.moveTo(0, 188);
      aCtx.quadraticCurveTo(140, 170, 260, 196);
      aCtx.quadraticCurveTo(330, 206, 384, 184);
      aCtx.lineTo(384, 288);
      aCtx.lineTo(0, 288);
      aCtx.fill();

      // Copse of mature oak trees & country lane
      aCtx.fillStyle = '#d4c5a8';
      aCtx.beginPath();
      aCtx.moveTo(175, 190);
      aCtx.bezierCurveTo(160, 225, 220, 255, 190, 288);
      aCtx.lineTo(235, 288);
      aCtx.bezierCurveTo(255, 250, 195, 225, 198, 190);
      aCtx.fill();

      aCtx.fillStyle = '#314226';
      for (const [tx, ty, tr] of [
        [72, 152, 34],
        [98, 160, 28],
        [305, 158, 32],
        [330, 166, 24],
      ] as const) {
        aCtx.beginPath();
        aCtx.arc(tx, ty, tr, 0, Math.PI * 2);
        aCtx.fill();
      }
    }
    const crossWallArtTex = new THREE.CanvasTexture(artCanvas);
    crossWallArtTex.colorSpace = THREE.SRGBColorSpace;
    const crossWallArtMat = new THREE.MeshStandardMaterial({
      map: crossWallArtTex,
      roughness: 0.42,
      metalness: 0.02,
    });

    // 1. East (Hall) face landscape painting at u = 3.27, y = 1.22, n = -0.122 (Issue #15: moved to [-17.567, 1.22, 0.772])
    {
      const hallPicGroup = new THREE.Group();
      hallPicGroup.name = 'hall.westCrossWallPicture';
      hallPicGroup.position.copy(hallFrontRoomCrossWallFrame.toWorld(3.27, 1.22, -0.122));
      hallPicGroup.rotation.y = hallFrontRoomCrossWallFrame.rotationY + Math.PI;

      const fw = 0.72;
      const fh = 0.54;
      const fd = 0.028;
      const railW = 0.036;

      for (const [rx, ry, rw, rh] of [
        [0, fh / 2 - railW / 2, fw, railW],
        [0, -fh / 2 + railW / 2, fw, railW],
        [-fw / 2 + railW / 2, 0, railW, fh - railW * 2],
        [fw / 2 - railW / 2, 0, railW, fh - railW * 2],
      ] as const) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(rw, rh, fd),
          antiqueOakSkirtingMat
        );
        rail.position.set(rx, ry, fd / 2);
        rail.castShadow = true;
        rail.receiveShadow = true;
        hallPicGroup.add(rail);
      }

      const mountBoard = new THREE.Mesh(
        new THREE.BoxGeometry(fw - railW * 2, fh - railW * 2, 0.016),
        ceramicWhiteMat
      );
      mountBoard.position.set(0, 0, 0.01);
      hallPicGroup.add(mountBoard);

      const canvasMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(fw - 0.16, fh - 0.14),
        crossWallArtMat
      );
      canvasMesh.name = 'hall.westCrossWallPicture.canvas';
      canvasMesh.position.set(0, 0, 0.02);
      hallPicGroup.add(canvasMesh);

      tagCutawayWall(hallPicGroup, crossWallCutaway);
      scene.add(hallPicGroup);
    }

    // 2. West (Front Room / Home Cinema) face: 3 Framed Classic Movie Posters (Issues #17, #22, #23, #24)
    //    - North Movie Poster (`livingRoom.eastWallMoviePoster.north`) at u = 0.585 (Z = -1.918m, Issue #22)
    //    - Center Movie Poster (`livingRoom.eastWallPicture`) at u = 2.345 (Z = -0.163m, between the two wall sconces, Issues #17 & #23)
    //    - South Movie Poster (`livingRoom.eastWallMoviePoster.south`) at u = 3.765 (Z = +1.256m, Issue #24)
    const posterFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1b1d22,
      roughness: 0.34,
      metalness: 0.38,
    });
    const buildMoviePosterTexture = (theme: 'odyssey' | 'vertigo' | 'lemans'): THREE.CanvasTexture => {
      const c = document.createElement('canvas');
      c.width = 280;
      c.height = 400;
      const pCtx = c.getContext('2d');
      if (pCtx) {
        if (theme === 'odyssey') {
          // Classic "2001: A Space Odyssey" (1968) cosmic monolith & orbital wheel poster
          const bg = pCtx.createLinearGradient(0, 0, 0, 400);
          bg.addColorStop(0, '#090d1a');
          bg.addColorStop(0.55, '#162447');
          bg.addColorStop(0.82, '#c86b3c');
          bg.addColorStop(1, '#e6b86a');
          pCtx.fillStyle = bg;
          pCtx.fillRect(0, 0, 280, 400);

          // Glowing lunar horizon arc at bottom
          pCtx.fillStyle = '#1b1f2c';
          pCtx.beginPath();
          pCtx.arc(140, 490, 210, Math.PI * 1.15, Math.PI * 1.85);
          pCtx.fill();

          // Sun / alignment corona above the monolith
          const sunGrad = pCtx.createRadialGradient(140, 118, 4, 140, 118, 68);
          sunGrad.addColorStop(0, '#fffdf2');
          sunGrad.addColorStop(0.35, '#ffd27d');
          sunGrad.addColorStop(1, 'rgba(255, 160, 70, 0)');
          pCtx.fillStyle = sunGrad;
          pCtx.beginPath();
          pCtx.arc(140, 118, 68, 0, Math.PI * 2);
          pCtx.fill();

          // Iconic black TMA-1 Monolith in 1:4:9 proportion
          pCtx.fillStyle = '#050608';
          pCtx.fillRect(108, 118, 64, 176);
          pCtx.strokeStyle = 'rgba(255, 230, 175, 0.45)';
          pCtx.lineWidth = 1.5;
          pCtx.strokeRect(108, 118, 64, 176);

          // Typography banner at bottom
          pCtx.fillStyle = '#f4efe4';
          pCtx.fillRect(18, 326, 244, 54);
          pCtx.fillStyle = '#111520';
          pCtx.font = 'bold 20px Georgia, serif';
          pCtx.textAlign = 'center';
          pCtx.fillText('2001', 140, 350);
          pCtx.font = '10px sans-serif';
          pCtx.fillText('A SPACE ODYSSEY', 140, 368);
        } else if (theme === 'vertigo') {
          // Classic Saul Bass "VERTIGO" (1958) crimson-orange spiral & noir silhouette poster
          pCtx.fillStyle = '#d94826';
          pCtx.fillRect(0, 0, 280, 400);

          // Nested Saul Bass geometric Lissajous / Hypotrochoid white spiral rings
          pCtx.strokeStyle = '#f8f3e6';
          pCtx.lineWidth = 2.4;
          for (let r = 16; r <= 112; r += 9) {
            pCtx.beginPath();
            pCtx.ellipse(140, 175, r, r * 0.76, (r * 0.045) % Math.PI, 0, Math.PI * 2);
            pCtx.stroke();
          }

          // Stylized black noir silhouette figures at center of vortex
          pCtx.fillStyle = '#0c0c0e';
          pCtx.beginPath();
          pCtx.moveTo(132, 145);
          pCtx.lineTo(148, 145);
          pCtx.lineTo(156, 225);
          pCtx.lineTo(124, 225);
          pCtx.closePath();
          pCtx.fill();
          pCtx.beginPath();
          pCtx.arc(140, 132, 10, 0, Math.PI * 2);
          pCtx.fill();

          // Bold block title header & footer bars
          pCtx.fillStyle = '#0c0c0e';
          pCtx.fillRect(22, 26, 236, 44);
          pCtx.fillStyle = '#f8f3e6';
          pCtx.font = 'bold 24px Impact, sans-serif';
          pCtx.textAlign = 'center';
          pCtx.fillText('V E R T I G O', 140, 57);

          pCtx.fillStyle = '#0c0c0e';
          pCtx.font = 'bold 12px sans-serif';
          pCtx.fillText('ALFRED HITCHCOCK', 140, 352);
        } else {
          // Classic "LE MANS" (1971) Gulf Powder-Blue & Marigold-Orange racing stripe cinema poster
          pCtx.fillStyle = '#1b2b44';
          pCtx.fillRect(0, 0, 280, 400);

          // Diagonal Gulf powder-blue & papaya-orange speed bands
          pCtx.fillStyle = '#6ca6cd';
          pCtx.beginPath();
          pCtx.moveTo(0, 95);
          pCtx.lineTo(280, 35);
          pCtx.lineTo(280, 285);
          pCtx.lineTo(0, 345);
          pCtx.closePath();
          pCtx.fill();

          pCtx.fillStyle = '#eb6828';
          pCtx.beginPath();
          pCtx.moveTo(0, 165);
          pCtx.lineTo(280, 105);
          pCtx.lineTo(280, 205);
          pCtx.lineTo(0, 265);
          pCtx.closePath();
          pCtx.fill();

          // Iconic white roundel #20
          pCtx.fillStyle = '#faf8f2';
          pCtx.beginPath();
          pCtx.arc(140, 185, 44, 0, Math.PI * 2);
          pCtx.fill();
          pCtx.strokeStyle = '#111622';
          pCtx.lineWidth = 3;
          pCtx.stroke();

          pCtx.fillStyle = '#111622';
          pCtx.font = 'bold 42px Impact, sans-serif';
          pCtx.textAlign = 'center';
          pCtx.fillText('20', 140, 201);

          // Title block at bottom
          pCtx.fillStyle = '#faf8f2';
          pCtx.font = 'bold 26px Impact, sans-serif';
          pCtx.fillText('L E   M A N S', 140, 354);
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const posterConfigs: ReadonlyArray<{
      readonly name: string;
      readonly uPos: number;
      readonly yPos: number;
      readonly theme: 'odyssey' | 'vertigo' | 'lemans';
    }> = [
      {
        name: 'livingRoom.eastWallMoviePoster.north',
        uPos: 0.945, // Even 1.40m center-to-center spacing & ~0.95m North edge margin (Issue #1)
        yPos: 1.02,
        theme: 'odyssey',
      },
      {
        name: 'livingRoom.eastWallPicture',
        uPos: 2.345, // World Z = -0.163m centered on wall (Issue #1)
        yPos: 1.02,
        theme: 'vertigo',
      },
      {
        name: 'livingRoom.eastWallMoviePoster.south',
        uPos: 3.745, // Even 1.40m center-to-center spacing & ~0.95m South edge margin (Issue #1)
        yPos: 1.02,
        theme: 'lemans',
      },
    ];

    // Issue #3: Slightly larger framed movie posters (0.64m wide x 0.90m tall, up from 0.54m x 0.76m)
    const posterW = 0.64;
    const posterH = 0.9;
    const posterD = 0.028;
    const posterRailW = 0.032;

    for (const cfg of posterConfigs) {
      const posterGroup = new THREE.Group();
      posterGroup.name = cfg.name;
      posterGroup.userData.zone = 'livingRoom';
      posterGroup.position.copy(
        hallFrontRoomCrossWallFrame.toWorld(cfg.uPos, cfg.yPos, 0.122)
      );
      posterGroup.rotation.y = hallFrontRoomCrossWallFrame.rotationY;

      for (const [rx, ry, rw, rh] of [
        [0, posterH / 2 - posterRailW / 2, posterW, posterRailW],
        [0, -posterH / 2 + posterRailW / 2, posterW, posterRailW],
        [-posterW / 2 + posterRailW / 2, 0, posterRailW, posterH - posterRailW * 2],
        [posterW / 2 - posterRailW / 2, 0, posterRailW, posterH - posterRailW * 2],
      ] as const) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(rw, rh, posterD),
          posterFrameMat
        );
        rail.position.set(rx, ry, posterD / 2);
        rail.castShadow = true;
        rail.receiveShadow = true;
        posterGroup.add(rail);
      }

      const mountBoard = new THREE.Mesh(
        new THREE.BoxGeometry(posterW - posterRailW * 2, posterH - posterRailW * 2, 0.016),
        ceramicWhiteMat
      );
      mountBoard.position.set(0, 0, 0.01);
      posterGroup.add(mountBoard);

      const posterMat = new THREE.MeshStandardMaterial({
        map: buildMoviePosterTexture(cfg.theme),
        roughness: 0.34,
        metalness: 0.04,
      });
      const posterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(posterW - 0.11, posterH - 0.12),
        posterMat
      );
      posterMesh.name = `${cfg.name}.canvas`;
      posterMesh.position.set(0, 0, 0.02);
      posterGroup.add(posterMesh);

      tagCutawayWall(posterGroup, crossWallCutaway);
      scene.add(posterGroup);
    }
  }

  // Louis De Poortere Berber Ksar 9653 Round Chenille Jacquard Flatweave Rug in Entrance Hall
  // (positioned at [-14.72, -0.3, 0.28] to frame the Roland GP-6-PE Baby Grand)
  {
    const roundRugGroup = new THREE.Group();
    roundRugGroup.name = 'hall.roundRug';
    roundRugGroup.position.set(-15.029, lowerFloorY, -0.148);

    const rugCanvas = document.createElement('canvas');
    rugCanvas.width = 512;
    rugCanvas.height = 512;
    const rCtx = rugCanvas.getContext('2d');
    if (rCtx) {
      // Warm cream / natural ecru cotton chenille ground
      rCtx.fillStyle = '#e3d6c5';
      rCtx.fillRect(0, 0, 512, 512);

      // Helper to draw organic hand-woven Berber rectangle blocks with slightly irregular edges & abrashed tone
      const drawBerberBlock = (
        x: number,
        y: number,
        w: number,
        h: number,
        seed: number
      ): void => {
        const shade = ((seed * 37) % 19) - 9;
        const r = Math.max(0, Math.min(255, 134 + shade));
        const g = Math.max(0, Math.min(255, 83 + Math.round(shade * 0.7)));
        const b = Math.max(0, Math.min(255, 62 + Math.round(shade * 0.55)));
        rCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        // Slight organic woven weft jitter along vertical edges
        const slices = Math.max(2, Math.round(h / 4));
        const sliceH = h / slices;
        for (let s = 0; s < slices; s++) {
          const jx = Math.sin(seed * 1.7 + s * 1.3) * 1.4;
          const jw = Math.cos(seed * 2.3 + s * 0.9) * 1.2;
          rCtx.fillRect(x + jx, y + s * sliceH, Math.max(2, w + jw), sliceH + 0.6);
        }
      };

      // Helper for irregular Berber checkerboard zones
      const drawCheckerZone = (
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        cellW: number,
        cellH: number,
        seedBase: number
      ): void => {
        const cols = Math.ceil((x1 - x0) / cellW);
        const rows = Math.ceil((y1 - y0) / cellH);
        for (let r = 0; r < rows; r++) {
          const rowShift = Math.sin(r * 1.5 + seedBase) * 1.5;
          for (let c = 0; c < cols; c++) {
            if ((r + c) % 2 === 0) {
              const bx = x0 + c * cellW + rowShift;
              const by = y0 + r * cellH;
              if (bx < x1 && by < y1) {
                drawBerberBlock(
                  bx,
                  by,
                  Math.min(cellW * 0.96, x1 - bx),
                  Math.min(cellH * 0.95, y1 - by),
                  seedBase + r * 31 + c * 17
                );
              }
            }
          }
        }
      };

      // 1. Left Column (x = 0..178):
      //    - Top-left fine checkerboard (y = 0..130)
      drawCheckerZone(0, 0, 178, 130, 13.5, 13.5, 11);
      //    - Upper-mid medium checkerboard (y = 130..194)
      drawCheckerZone(0, 130, 178, 194, 21, 16, 47);
      //    - Mid-left wide vertical Berber stripes in two registers (y = 194..272 and y = 276..354)
      for (const [bandIdx, by0, by1] of [
        [0, 194, 268],
        [1, 274, 352],
      ] as const) {
        const stripePitch = 28;
        for (let sx = 6 + bandIdx * 4; sx < 176; sx += stripePitch) {
          drawBerberBlock(sx, by0, 15, by1 - by0, 103 + sx + bandIdx * 29);
        }
      }
      //    - Bottom-left medium checkerboard (y = 354..512)
      drawCheckerZone(0, 354, 178, 512, 18.5, 16.5, 89);

      // 2. Central Main Field (x = 178..444):
      //    - 10 horizontal registers of broken vertical Berber bars (y = 0..412)
      const bandEdges = [0, 36, 78, 114, 154, 198, 242, 282, 326, 370, 412] as const;
      for (let b = 0; b < bandEdges.length - 1; b++) {
        const by0 = bandEdges[b]! + 1.5;
        const by1 = bandEdges[b + 1]! - 1.5;
        const bh = by1 - by0;
        const phaseX = ((b * 7) % 5) - 2;
        const pitchX = 19.2;
        let colIdx = 0;
        for (let sx = 181 + phaseX; sx < 441; sx += pitchX) {
          const barW = 9.8 + ((b + colIdx) % 3) * 0.9;
          const yOff = Math.sin(b * 1.9 + colIdx * 1.1) * 1.2;
          drawBerberBlock(
            sx,
            by0 + yOff,
            barW,
            bh - Math.abs(yOff),
            211 + b * 41 + colIdx * 13
          );
          colIdx++;
        }
      }
      //    - Bottom central fine checkerboard band (y = 412..512)
      drawCheckerZone(178, 412, 444, 512, 14.5, 14.5, 313);

      // 3. Right Column (x = 444..512):
      //    - Upper-right small checkerboard (y = 0..234)
      drawCheckerZone(444, 0, 512, 234, 13, 13, 401);
      //    - Lower-right horizontal Berber bars in two sub-columns (y = 236..512)
      for (const [subX0, subW, phaseY] of [
        [446, 32, 0],
        [481, 31, 7],
      ] as const) {
        let rowIdx = 0;
        for (let sy = 238 + phaseY; sy < 508; sy += 20) {
          drawBerberBlock(subX0, sy, subW, 10.5, 509 + rowIdx * 19 + subX0);
          rowIdx++;
        }
      }

      // 4. Fine horizontal chenille jacquard weft ribs & subtle vintage fading world patina
      for (let y = 0; y < 512; y += 2) {
        rCtx.fillStyle =
          y % 4 === 0 ? 'rgba(255, 248, 238, 0.065)' : 'rgba(58, 34, 22, 0.055)';
        rCtx.fillRect(0, y, 512, 1);
      }
      for (let y = 0; y < 512; y += 4) {
        for (let x = 0; x < 512; x += 4) {
          const n = ((x * 23 + y * 41 + ((x ^ y) & 15) * 7) % 18) - 9;
          if (n !== 0) {
            rCtx.fillStyle =
              n > 0
                ? `rgba(246, 236, 222, ${n * 0.0045})`
                : `rgba(72, 42, 28, ${-n * 0.0045})`;
            rCtx.fillRect(x, y, 4, 4);
          }
        }
      }
    }
    const roundRugTex = new THREE.CanvasTexture(rugCanvas);
    roundRugTex.colorSpace = THREE.SRGBColorSpace;

    const roundRugMat = new THREE.MeshStandardMaterial({
      map: roundRugTex,
      bumpMap: roundRugTex,
      bumpScale: 0.0035,
      roughness: 0.88,
      metalness: 0.01,
    });
    const roundRugBorderMat = new THREE.MeshStandardMaterial({
      color: 0x885842,
      roughness: 0.88,
      metalness: 0.01,
    });

    const rugRadius = 1.05; // 2.10m diameter circular rug
    const rugDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(rugRadius, rugRadius, 0.008, 48),
      roundRugMat
    );
    rugDisc.name = 'hall.roundRug.disc';
    rugDisc.position.set(0, 0.004, 0);
    rugDisc.receiveShadow = true;
    roundRugGroup.add(rugDisc);

    const rugBraidedEdge = new THREE.Mesh(
      new THREE.TorusGeometry(rugRadius - 0.008, 0.005, 10, 48),
      roundRugBorderMat
    );
    rugBraidedEdge.rotation.x = Math.PI / 2;
    rugBraidedEdge.position.set(0, 0.005, 0);
    rugBraidedEdge.receiveShadow = true;
    roundRugGroup.add(rugBraidedEdge);

    scene.add(roundRugGroup);
  }

  // Issue #16 & Issue #2: 1:1 True-to-Scale Roland GP-6-PE (Polished Ebony) Baby Grand Digital Piano
  // Exact manufacturer dimensions: 1,404 mm W (1,412 mm lid open) × 959 mm D × 931 mm H (closed) / 1,526 mm H (top opened)
  // Rotated 180 degrees (`rotation.y = 0.92 - Math.PI` rad) so the pianist bench and PHA-50 / Piano Reality keyboard
  // sit in the NW alcove facing SE over the compact 95.9cm baby-grand cabinet toward the center of the Hall!
  {
    const pianoGroup = new THREE.Group();
    pianoGroup.name = 'hall.rolandGP6PE';
    pianoGroup.userData.zone = 'hall';
    pianoGroup.position.set(-15.111, lowerFloorY, -0.58);
    pianoGroup.rotation.y = 0.92 - Math.PI; // Rotated 180 degrees from 0.92 rad

    const rolandPolishedEbonyMat = new THREE.MeshStandardMaterial({
      color: 0x0b0c0f,
      roughness: 0.08,
      metalness: 0.18,
    });
    const rolandInnerRimMat = new THREE.MeshStandardMaterial({
      color: 0x161517,
      roughness: 0.24,
      metalness: 0.08,
    });
    const rolandChampagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc8a24e,
      roughness: 0.22,
      metalness: 0.84,
    });
    const rolandAcousticBaffleMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.76,
      metalness: 0.06,
    });
    const rolandSpeakerGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.62,
      metalness: 0.28,
    });
    const rolandRedFeltMat = new THREE.MeshStandardMaterial({
      color: 0x7c191e,
      roughness: 0.88,
    });
    const rolandTouchPanelMat = new THREE.MeshStandardMaterial({
      color: 0x090a0d,
      roughness: 0.14,
      metalness: 0.2,
      emissive: 0x9ec6e8,
      emissiveIntensity: 0.28,
    });
    const rolandLeatherBenchMat = new THREE.MeshStandardMaterial({
      color: 0x151619,
      roughness: 0.36,
      metalness: 0.06,
    });

    // Helper to build the exact 1:1 Roland GP-6-PE compact baby-grand footprint:
    // Width = 1.404m (halfW = 0.702m), Total Front-to-Back Depth = 0.959m (Z = -0.479m tail apex .. +0.480m front keybed).
    // Note: ExtrudeGeometry rotated -PI/2 around X maps shape (x, y) -> 3D (x, z = -y).
    // Front of main curved rim is at z = +0.18m (shape y = -0.18); tail apex is at z = -0.479m (shape y = +0.479).
    const createRolandGP6RimShape = (inset = 0): THREE.Shape => {
      const s = new THREE.Shape();
      const halfW = 0.702 - inset; // 1.404m / 2
      const frontY = -0.18 + inset; // z = +0.18m (joins the 0.30m-deep front keybed to reach z = +0.480m)
      const bassTurnY = 0.16 - inset * 0.5; // z = -0.16m
      const tailApexX = -0.15;
      const tailApexY = 0.479 - inset; // z = -0.479m (total depth with +0.480m keybed = 0.959m = 959mm!)

      s.moveTo(-halfW, frontY);
      // Straight bass side (left, -X) running back from z = +0.18m to z = -0.16m
      s.lineTo(-halfW, bassTurnY);
      // Compact baby-grand bass-to-tail curve around the tail apex
      s.bezierCurveTo(
        -halfW,
        0.41 - inset,
        -0.43,
        tailApexY,
        tailApexX,
        tailApexY
      );
      // Signature Roland GP-6 S-curved treble rim (right, +X) from tail apex through treble waist out to treble cheek
      s.bezierCurveTo(
        0.1 - inset * 0.6,
        tailApexY,
        0.23 - inset * 0.8,
        0.31,
        0.31 - inset * 0.8,
        0.12
      );
      s.bezierCurveTo(
        0.38 - inset * 0.8,
        -0.04,
        halfW,
        -0.06,
        halfW,
        frontY
      );
      s.closePath();
      return s;
    };

    // 1. Outer Polished Ebony (PE) Bent Case Rim (Y = 0.65m..0.913m, height = 0.263m; top with 18mm lid = 0.931m = 931mm)
    const outerRimShape = createRolandGP6RimShape(0);
    const outerRimGeo = new THREE.ExtrudeGeometry(outerRimShape, {
      depth: 0.263,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 28,
    });
    outerRimGeo.rotateX(-Math.PI / 2);
    const outerRimMesh = new THREE.Mesh(outerRimGeo, rolandPolishedEbonyMat);
    outerRimMesh.name = 'hall.rolandGP6PE.caseRim';
    outerRimMesh.position.set(0, 0.65, 0);
    outerRimMesh.castShadow = true;
    outerRimMesh.receiveShadow = true;
    pianoGroup.add(outerRimMesh);

    // Lower acoustic cabinet & downward-firing woofer enclosure beneath the rim (Y = 0.595m..0.65m)
    const bellyShape = createRolandGP6RimShape(0.024);
    const bellyGeo = new THREE.ExtrudeGeometry(bellyShape, {
      depth: 0.055,
      bevelEnabled: false,
      curveSegments: 24,
    });
    bellyGeo.rotateX(-Math.PI / 2);
    const bellyMesh = new THREE.Mesh(bellyGeo, rolandPolishedEbonyMat);
    bellyMesh.position.set(0, 0.595, 0);
    bellyMesh.castShadow = true;
    pianoGroup.add(bellyMesh);

    // 2. Roland Piano Reality Premium Projection 5-Speaker Acoustic Baffle Deck & Champagne-Gold Trim inside the rim
    const innerShape = createRolandGP6RimShape(0.034);
    const baffleGeo = new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.045,
      bevelEnabled: false,
      curveSegments: 24,
    });
    baffleGeo.rotateX(-Math.PI / 2);
    const baffleMesh = new THREE.Mesh(baffleGeo, rolandAcousticBaffleMat);
    baffleMesh.name = 'hall.rolandGP6PE.acousticBaffle';
    baffleMesh.position.set(0, 0.84, 0);
    pianoGroup.add(baffleMesh);

    const trimFrameShape = createRolandGP6RimShape(0.056);
    const trimFrameGeo = new THREE.ExtrudeGeometry(trimFrameShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 1,
      curveSegments: 24,
    });
    trimFrameGeo.rotateX(-Math.PI / 2);
    const trimFrameMesh = new THREE.Mesh(trimFrameGeo, rolandChampagneGoldMat);
    trimFrameMesh.name = 'hall.rolandGP6PE.interiorTrim';
    trimFrameMesh.position.set(0, 0.886, 0);
    pianoGroup.add(trimFrameMesh);

    // Dual top-firing spatial projection speaker grilles & acoustic diffuser louvres inside the cabinet
    for (const [sx, sz, rad] of [
      [-0.31, -0.14, 0.115], // Left Bass/Spatial Cabinet Speaker
      [0.14, -0.06, 0.105],  // Right Treble/Spatial Cabinet Speaker
      [-0.14, -0.31, 0.085], // Rear Tail Spatial Speaker
    ] as const) {
      const spkRing = new THREE.Mesh(
        new THREE.CylinderGeometry(rad + 0.01, rad + 0.01, 0.006, 20),
        rolandChampagneGoldMat
      );
      spkRing.position.set(sx, 0.899, sz);
      pianoGroup.add(spkRing);

      const spkGrille = new THREE.Mesh(
        new THREE.CylinderGeometry(rad, rad, 0.008, 20),
        rolandSpeakerGrilleMat
      );
      spkGrille.name = 'hall.rolandGP6PE.speakerGrille';
      spkGrille.position.set(sx, 0.901, sz);
      pianoGroup.add(spkGrille);
    }

    // Scarlet felt accent trim strip along the front of the inner acoustic deck
    const hitchFelt = new THREE.Mesh(
      new THREE.BoxGeometry(1.14, 0.006, 0.022),
      rolandRedFeltMat
    );
    hitchFelt.position.set(0, 0.901, 0.12);
    pianoGroup.add(hitchFelt);

    // 3. Hinged Polished Ebony Top Lid (closed height = 0.931m, propped slightly on the short lid stick ~10° so it clears the stair soffit)
    const lidPivot = new THREE.Group();
    lidPivot.name = 'hall.rolandGP6PE.lidPivot';
    lidPivot.position.set(-0.702, 0.913, 0);
    lidPivot.rotation.z = 0.16; // Gentle ~9° chamber stick opening revealing the Piano Reality speaker deck

    const lidGeo = new THREE.ExtrudeGeometry(outerRimShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 28,
    });
    lidGeo.rotateX(-Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidGeo, rolandPolishedEbonyMat);
    lidMesh.name = 'hall.rolandGP6PE.lid';
    lidMesh.position.set(0.702, 0, 0);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidPivot.add(lidMesh);
    pianoGroup.add(lidPivot);

    // Short brass lid prop stick on the treble side
    const propStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.22, 10),
      brassMat
    );
    propStick.position.set(0.6, 0.985, 0.04);
    propStick.rotation.z = -0.14;
    pianoGroup.add(propStick);

    // 4. Front Keybed, Cheek Blocks, PHA-50 88-Key Hybrid Keyboard, Disappearing Smart Touch Panel & Fallboard
    // Keybed spans Z = +0.16m..+0.480m (depth 0.32m), Width = 1.404m
    const keybedSlab = new THREE.Mesh(
      new THREE.BoxGeometry(1.404, 0.066, 0.32),
      rolandPolishedEbonyMat
    );
    keybedSlab.name = 'hall.rolandGP6PE.keybed';
    keybedSlab.position.set(0, 0.625, 0.32);
    keybedSlab.castShadow = true;
    keybedSlab.receiveShadow = true;
    pianoGroup.add(keybedSlab);

    // Left (Bass) and Right (Treble) Polished Ebony Cheek Blocks flanking the 88-key keyboard
    for (const signX of [-1, 1] as const) {
      const cheekBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.089, 0.12, 0.315),
        rolandPolishedEbonyMat
      );
      cheekBlock.position.set(signX * (0.702 - 0.0445), 0.714, 0.318);
      cheekBlock.castShadow = true;
      pianoGroup.add(cheekBlock);
    }

    // Front keyslip rail below the keys (at Z = +0.468m..+0.480m)
    const keyslipRail = new THREE.Mesh(
      new THREE.BoxGeometry(1.226, 0.03, 0.022),
      rolandPolishedEbonyMat
    );
    keyslipRail.position.set(0, 0.668, 0.469);
    pianoGroup.add(keyslipRail);

    // 88-Key PHA-50 / Piano Reality Hybrid Keyboard Bed (1.225m wide across 52 white keys + 36 black sharps/flats)
    const whiteKeyBed = new THREE.Mesh(
      new THREE.BoxGeometry(1.225, 0.024, 0.145),
      ceramicWhiteMat
    );
    whiteKeyBed.name = 'hall.rolandGP6PE.whiteKeys';
    whiteKeyBed.position.set(0, 0.676, 0.388);
    whiteKeyBed.receiveShadow = true;
    pianoGroup.add(whiteKeyBed);

    // Scarlet keyframe felt strip behind the white keys
    const keyframeFelt = new THREE.Mesh(
      new THREE.BoxGeometry(1.225, 0.006, 0.012),
      rolandRedFeltMat
    );
    keyframeFelt.position.set(0, 0.69, 0.312);
    pianoGroup.add(keyframeFelt);

    // 36 raised ebony-feel sharp/flat keys arranged in authentic 2-3 octave groupings across 7+ octaves
    const octavePattern = [1, 1, 0, 1, 1, 1, 0] as const;
    for (let wIdx = 0; wIdx < 51; wIdx++) {
      const noteInOctave = (wIdx + 5) % 7;
      if (octavePattern[noteInOctave] === 1) {
        const kx = -0.6 + ((wIdx + 0.5) / 52) * 1.2;
        const blackKey = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 0.014, 0.092),
          rolandPolishedEbonyMat
        );
        blackKey.position.set(kx, 0.692, 0.362);
        pianoGroup.add(blackKey);
      }
    }

    // Roland GP-6 Signature Disappearing Backlit Smart Touch Panel above the center keys
    const touchPanelBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.004, 0.036),
      rolandTouchPanelMat
    );
    touchPanelBezel.name = 'hall.rolandGP6PE.smartTouchPanel';
    touchPanelBezel.position.set(0, 0.694, 0.285);
    pianoGroup.add(touchPanelBezel);

    // Open Curved Polished Ebony Fallboard with Gold "Roland" Script Badge
    const fallboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.226, 0.11, 0.026),
      rolandPolishedEbonyMat
    );
    fallboard.name = 'hall.rolandGP6PE.fallboard';
    fallboard.position.set(0, 0.738, 0.262);
    fallboard.rotation.x = -0.12;
    pianoGroup.add(fallboard);

    const rolandLogoPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.014, 0.004),
      rolandChampagneGoldMat
    );
    rolandLogoPlaque.name = 'hall.rolandGP6PE.rolandBadge';
    rolandLogoPlaque.position.set(0, 0.738, 0.277);
    rolandLogoPlaque.rotation.x = -0.12;
    pianoGroup.add(rolandLogoPlaque);

    // Angled Polished Ebony Music Rest & Open Sheet Music Folio above the fallboard
    const musicDesk = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.2, 0.016),
      rolandInnerRimMat
    );
    musicDesk.name = 'hall.rolandGP6PE.musicRest';
    musicDesk.position.set(0, 0.995, 0.19);
    musicDesk.rotation.x = -0.22;
    musicDesk.castShadow = true;
    pianoGroup.add(musicDesk);

    const sheetMusicBook = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.18, 0.008),
      ceramicWhiteMat
    );
    sheetMusicBook.position.set(0, 0.993, 0.202);
    sheetMusicBook.rotation.x = -0.22;
    pianoGroup.add(sheetMusicBook);

    // 5. 3 Roland GP-6-PE Tapered Grand Piano Legs with Brass Ferrules & Castors
    for (const [lx, lz] of [
      [-0.61, 0.24],   // Front Bass Leg
      [0.61, 0.24],    // Front Treble Leg
      [-0.15, -0.36],  // Rear Tail Leg
    ] as const) {
      const legCapital = new THREE.Mesh(
        new THREE.BoxGeometry(0.105, 0.1, 0.105),
        rolandPolishedEbonyMat
      );
      legCapital.position.set(lx, 0.56, lz);
      legCapital.castShadow = true;
      pianoGroup.add(legCapital);

      const legShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.044, 0.026, 0.43, 12),
        rolandPolishedEbonyMat
      );
      legShaft.name = 'hall.rolandGP6PE.leg';
      legShaft.position.set(lx, 0.295, lz);
      legShaft.castShadow = true;
      pianoGroup.add(legShaft);

      const brassFerrule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.025, 0.042, 12),
        brassMat
      );
      brassFerrule.position.set(lx, 0.056, lz);
      pianoGroup.add(brassFerrule);

      const brassCastor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.032, 12),
        brassMat
      );
      brassCastor.rotation.z = Math.PI / 2;
      brassCastor.position.set(lx, 0.016, lz);
      pianoGroup.add(brassCastor);
    }

    // 6. Pedal Lyre Assembly & 3 Responsive Damper Action Brass Pedals (Soft, Sostenuto, Damper)
    const lyreBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.062, 0.082),
      rolandPolishedEbonyMat
    );
    lyreBox.position.set(0, 0.042, 0.21);
    pianoGroup.add(lyreBox);

    for (const px of [-0.072, 0.072] as const) {
      const lyrePillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.015, 0.53, 10),
        rolandPolishedEbonyMat
      );
      lyrePillar.position.set(px, 0.335, 0.21);
      lyrePillar.castShadow = true;
      pianoGroup.add(lyrePillar);
    }

    // Diagonal brass lyre brace rods
    for (const px of [-0.038, 0.038] as const) {
      const lyreRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.55, 8),
        brassMat
      );
      lyreRod.position.set(px, 0.325, 0.1);
      lyreRod.rotation.x = 0.36;
      pianoGroup.add(lyreRod);
    }

    // 3 Brass Pedals projecting toward the pianist
    for (const pedX of [-0.066, 0, 0.066] as const) {
      const pedal = new THREE.Mesh(
        new THREE.BoxGeometry(0.023, 0.012, 0.105),
        brassMat
      );
      pedal.position.set(pedX, 0.045, 0.275);
      pedal.rotation.x = 0.15;
      pianoGroup.add(pedal);
    }

    // 7. Matching Adjustable Polished Ebony Roland BNC-05 Artist Bench (0.56m x 0.35m x 0.48m)
    const benchGroup = new THREE.Group();
    benchGroup.name = 'hall.rolandGP6PE.bench';
    benchGroup.position.set(0, 0, 0.74);

    const benchApron = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.062, 0.34),
      rolandPolishedEbonyMat
    );
    benchApron.position.set(0, 0.415, 0);
    benchApron.castShadow = true;
    benchGroup.add(benchApron);

    const benchCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.57, 0.046, 0.35),
      rolandLeatherBenchMat
    );
    benchCushion.name = 'hall.rolandGP6PE.bench.cushion';
    benchCushion.position.set(0, 0.465, 0);
    benchCushion.castShadow = true;
    benchCushion.receiveShadow = true;
    benchGroup.add(benchCushion);

    // Height adjustment knobs on both sides of the Roland bench
    for (const sideX of [-0.292, 0.292] as const) {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.017, 0.02, 12),
        rolandPolishedEbonyMat
      );
      knob.rotation.z = Math.PI / 2;
      knob.position.set(sideX, 0.415, 0);
      benchGroup.add(knob);
    }

    for (const [blx, blz] of [
      [-0.245, -0.135],
      [0.245, -0.135],
      [-0.245, 0.135],
      [0.245, 0.135],
    ] as const) {
      const bLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.014, 0.4, 10),
        rolandPolishedEbonyMat
      );
      bLeg.position.set(blx, 0.2, blz);
      bLeg.castShadow = true;
      benchGroup.add(bLeg);

      const bFerrule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.014, 0.028, 10),
        brassMat
      );
      bFerrule.position.set(blx, 0.014, blz);
      benchGroup.add(bFerrule);
    }

    pianoGroup.add(benchGroup);
    scene.add(pianoGroup);
  }

  // Antique-Profiled Oak Skirting Board along the North wall of Hall under the 3-pane window and open upper stair soffit (X = -16.64m..-13.05m, Z = -2.488m — Issue #14)
  const hallNorthSkirting = new THREE.Mesh(
    new THREE.BoxGeometry(3.59, 0.122, 0.022),
    antiqueOakSkirtingMat
  );
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
    buildSweptMouldingGeometry(
      createSkirtingCapProfile(),
      [
        [-16.64, lowerFloorY + 0.122],
        [-13.05, lowerFloorY + 0.122],
      ],
      (a, y, d) => new THREE.Vector3(a, y, -2.499 + d)
    ),
    antiqueOakSkirtingMat
  );
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
