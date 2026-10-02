import * as THREE from 'three';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
  createWallLocalFrame,
  type WallLocalFrame,
} from '../../../../engine/geometry/index.ts';
import { buildFlutedBrassPictureLight } from '../../../../objects/fixtures/fluted-brass-picture-light.ts';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { buildHallStaircase } from './hall-staircase.ts';
import type { buildHall } from './hall.ts';

/**
 * Front Room / cinema (`livingRoom`): shell, bay window, movie posters and picture lights.
 */
export function buildLivingRoom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat' | 'doorH' | 'exteriorBrickMat' | 'farrowAndBallPantalonMat' | 'frontWallH' | 'oakMat' | 'tagCutawayWall' | 'timberDoorMat' | 'wallCapMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addSlattedRadiatorCover' | 'addWestCantedBayWindow' | 'applyWorldSpaceBrickUVs' | 'greyRoomCarpetMat'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'frontTier2WallH' | 'frontTier2WallMidY' | 'tier2FloorY'> &
    Pick<ReturnType<typeof buildHall>, 'hallFrontRoomCrossWallFrame'> &
    Pick<ReturnType<typeof buildHallStaircase>, 'buildQAcousticsSpeaker'>
): {
  livingRoomNorthWallFrame: WallLocalFrame;
  entranceHallNorthWallFrame: WallLocalFrame;
} {
  const { interactions, lightGroups, scene } = ctx;
  const {
    addSlattedRadiatorCover,
    addWestCantedBayWindow,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    brassMat,
    buildQAcousticsSpeaker,
    castIronMat,
    doorH,
    exteriorBrickMat,
    farrowAndBallPantalonMat,
    frontTier2WallH,
    frontTier2WallMidY,
    frontWallH,
    greyRoomCarpetMat,
    hallFrontRoomCrossWallFrame,
    oakMat,
    tagCutawayWall,
    tier2FloorY,
    timberDoorMat,
    wallCapMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 4. FRONT ROOM (livingRoom) — DARK, MOODY, SNUGGLY CINEMA ROOM (media_1790587491808.png)
  //    Trapezoidal polygon between West Front Facade (X = -22.19m) and rotated East Wing:
  //    - North wall is 100% collinear with the East Wing North exterior wall: [-22.19, -3.18] -> [-16.876, -2.469]
  //    - South wall is 100% collinear with the East Wing South exterior wall: [-22.19, 1.905] -> [-17.891, 2.48]
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, -3.18],
      [-16.876, -2.469],
      [-17.891, 2.48],
      [-22.19, 1.905],
    ],
    tier2FloorY,
    0.08,
    greyRoomCarpetMat,
    0.5
  );

  // 3 Fluted Antique-Brass Horizontal Picture Lights mounted OVER THE TOP of the 3 Movie Posters
  // on the Cinema Room East Cross-Wall (rather than between them — matching top-right photo of media_1790587491808.png!)
  // Posters are at uPos = 0.945 (North), 2.345 (Center), 3.745 (South) with yPos = 1.05, posterH = 0.76 (top edge Y = 1.43m).
  {
    const pictureLightBrassMat = new THREE.MeshStandardMaterial({
      color: 0x9e7b3e, // Warm burnished antique brass matching media_1790587491808.png
      roughness: 0.28,
      metalness: 0.84,
    });
    const pictureLightDarkBrassMat = new THREE.MeshStandardMaterial({
      color: 0x6e5326,
      roughness: 0.36,
      metalness: 0.78,
    });
    const pictureLightGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffefb8,
      emissive: 0xffae24, // Warm yellow gloomy cinema picture-light glow
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    pictureLightGlowMat.userData.baseEmissiveIntensity = 2.2;
    lightGroups.frontRoomPendant.emissives.push(pictureLightGlowMat);

    const crossWallCutawayForLights: CutawayWallDescriptor = {
      axis: 'x',
      coord: -17.35,
      minSpan: -2.469,
      maxSpan: 2.48,
      floor: 'ground',
    };

    for (const [idx, su] of [
      [1, 0.945], // Directly over North poster (`livingRoom.eastWallMoviePoster.north`, "2001: A Space Odyssey")
      [2, 2.345], // Directly over Center poster (`livingRoom.eastWallPicture`, "Vertigo")
      [3, 3.745], // Directly over South poster (`livingRoom.eastWallMoviePoster.south`, "Le Mans")
    ] as const) {
      const wallLightGroup = buildFlutedBrassPictureLight(
        { brass: pictureLightBrassMat, darkBrass: pictureLightDarkBrassMat, glow: pictureLightGlowMat },
        { name: `livingRoom.eastWallLight.${idx}`, zone: 'livingRoom' }
      );
      // Issues #1–#4: Mount backplate at a level height Y = 1.60m (raised +9cm above previous 1.51m)
      hallFrontRoomCrossWallFrame.placeObject(scene, wallLightGroup, su, 1.6, 0.122);

      tagCutawayWall(wallLightGroup, crossWallCutawayForLights);
      interactions.registerLightFixture(wallLightGroup, 'frontRoomPendant');

      const poolPos = hallFrontRoomCrossWallFrame.toWorld(su, tier2FloorY + 0.006, 0.42);
      ctx.addGlowPool('frontRoomPendant', poolPos.x, poolPos.y, poolPos.z, 0.85, 0.22);
    }

    // Single consolidated room PointLight positioned out in the Living Room (equidistant from the East wall
    // so all 3 picture lights have 100% identical brightness without adding 2 extra shader PointLights)
    const frontRoomWash = new THREE.PointLight(0xffb454, 7.8, 6.8, 1.65);
    frontRoomWash.userData.baseIntensity = 7.8;
    frontRoomWash.position.copy(hallFrontRoomCrossWallFrame.toWorld(2.345, 1.35, 2.15));
    scene.add(frontRoomWash);
    lightGroups.frontRoomPendant.lights.push(frontRoomWash);
  }

  // Angled North Exterior Brick Wall of Front Room (0.28m thick, interior face [-22.19, -3.18] -> [-16.876, -2.469])
  // 100% collinear with the Hall, Boot Lobby, Dining Room & Kitchen North exterior brick wall!
  const livingRoomNorthWallFrame = createWallLocalFrame([-22.19, -3.18], [-16.876, -2.469]);
  {
    const northBrickGroup = new THREE.Group();
    northBrickGroup.name = 'livingRoom.northExteriorWall';
    scene.add(northBrickGroup);
    buildAngledWallSegment(northBrickGroup, interactions, {
      start: [-22.47, -3.359],
      end: [-16.858, -2.608],
      thickness: 0.28,
      topY: frontWallH,
      frontFloorY: tier2FloorY, // South (+normal, Living Room interior)
      backFloorY: tier2FloorY,  // North (-normal, exterior brick)
      wallMaterial: exteriorBrickMat,
      frontFaceMaterial: farrowAndBallPantalonMat,
      capMaterial: wallCapMat,
      skirtingMaterial: antiqueOakSkirtingMat,
      addFrontSkirting: true,
    });
    tagCutawayWall(northBrickGroup, {
      axis: 'z',
      coord: -2.98,
      minSpan: -22.47,
      maxSpan: -16.858,
      floor: 'ground',
    });
  }

  // West Exterior Brick Wall & 3-Sided Canted Bay Window of Front Room (Z = -3.18m..+1.905m, centered at Z = -0.26m)
  addWestCantedBayWindow(-0.26, -3.18, 1.905, farrowAndBallPantalonMat);

  // Free-Standing Multi-Column Cast-Iron Radiator centered on the East Cross-Wall of the Living Room (Issue #1)
  {
    const radPos = hallFrontRoomCrossWallFrame.toWorld(2.345, tier2FloorY, 0.235);
    addSlattedRadiatorCover(
      radPos.x,
      tier2FloorY,
      radPos.z,
      0.88,
      0.58,
      0.165,
      hallFrontRoomCrossWallFrame.rotationY - Math.PI / 2,
      false,
      {
        axis: 'x',
        coord: -17.35,
        minSpan: -2.469,
        maxSpan: 2.48,
        floor: 'ground',
      }
    );
  }

  // Straight South Wall of Front Room / North Wall of Entrance Hallway ([-22.19, 1.905] -> [-17.891, 2.48], 0.28m thick, zero kinks!):
  // 100% collinear with the Hall Step-Up Portal wall and the Hall / Boot Lobby / Dining Room South exterior brick wall!
  // Includes the hinged doorway (`frontRoomDoor`) at the East end (uCenter = 3.74m)
  // and parents the Chimney Breast, Red-Brick Firebox, Log Burner, and Alcove Joinery to `entranceHallNorthWallFrame`.
  const entranceHallNorthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 1.905],
    end: [-17.891, 2.48],
    thickness: 0.28,
    topY: frontWallH,
    frontFloorY: tier2FloorY, // South (Front Entrance Hallway)
    backFloorY: tier2FloorY,  // North (Front / Cinema Room)
    wallMaterial: warmRoomPlasterMat,
    backFaceMaterial: farrowAndBallPantalonMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: false, // North face inside Living Room is occupied by built-in alcove cabinets (`-22.15..-21.10`, `-19.90..-18.98`), fireplace (`-21.10..-19.90`), and `frontRoomDoor`
    openings: [
      {
        id: 'frontRoomDoor',
        kind: 'hinged-door',
        uCenter: 3.74,
        width: 0.84,
        doorHeight: doorH,
        lowerFloorY: tier2FloorY,
        upperFloorY: tier2FloorY,
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: castIronMat,
        hingeSide: 'right',
        openAngle: -Math.PI * 0.43, // Swings NORTH (inward into Front Room) against the cross-wall!
        initialOpenProgress: 0.92,
      },
    ],
  });

  const fpWallAnchor = new THREE.Group();
  fpWallAnchor.name = 'livingRoom.southWallJoineryAnchor';
  fpWallAnchor.position.set(-22.19, 0, 1.905);
  fpWallAnchor.rotation.y = entranceHallNorthWallFrame.rotationY;
  scene.add(fpWallAnchor);

  const frontRoomFpGroup = new THREE.Group();
  frontRoomFpGroup.position.set(22.19, 0, -2.035);
  fpWallAnchor.add(frontRoomFpGroup);
  const frBreastLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, frontTier2WallH, 0.44),
    farrowAndBallPantalonMat
  );
  frBreastLeft.position.set(-20.06, frontTier2WallMidY, 1.72);
  frBreastLeft.castShadow = true;
  frontRoomFpGroup.add(frBreastLeft);

  const frBreastLeftSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [-19.9, 1.52],
        [-19.9, 1.5],
        [-20.22, 1.5],
      ],
      tier2FloorY
    ),
    antiqueOakSkirtingMat
  );
  frBreastLeftSkirt.name = 'livingRoom.fireplaceBreast.leftSkirting';
  frBreastLeftSkirt.castShadow = true;
  frBreastLeftSkirt.receiveShadow = true;
  frontRoomFpGroup.add(frBreastLeftSkirt);

  const frBreastRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, frontTier2WallH, 0.44),
    farrowAndBallPantalonMat
  );
  frBreastRight.position.set(-20.94, frontTier2WallMidY, 1.72);
  frBreastRight.castShadow = true;
  frontRoomFpGroup.add(frBreastRight);

  const frBreastRightSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [-20.78, 1.5],
        [-21.1, 1.5],
        [-21.1, 1.52],
      ],
      tier2FloorY
    ),
    antiqueOakSkirtingMat
  );
  frBreastRightSkirt.name = 'livingRoom.fireplaceBreast.rightSkirting';
  frBreastRightSkirt.castShadow = true;
  frBreastRightSkirt.receiveShadow = true;
  frontRoomFpGroup.add(frBreastRightSkirt);

  const frBreastUpper = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, frontTier2WallH - 0.92, 0.44),
    farrowAndBallPantalonMat
  );
  frBreastUpper.position.set(-20.5, tier2FloorY + 0.92 + (frontTier2WallH - 0.92) / 2, 1.72);
  frBreastUpper.castShadow = true;
  frontRoomFpGroup.add(frBreastUpper);

  // Issue #8: Stripped back to natural oak mantelpiece beam & carved oak corbels (`livingRoom.fireplaceMantelBeam`)
  const frMantelShelf = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.14, 0.52),
    oakMat
  );
  frMantelShelf.name = 'livingRoom.fireplaceMantelBeam';
  frMantelShelf.position.set(-20.5, tier2FloorY + 1.24, 1.7);
  frMantelShelf.castShadow = true;
  frMantelShelf.receiveShadow = true;
  frontRoomFpGroup.add(frMantelShelf);

  const frMantelLowerLip = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.024, 0.49),
    antiqueOakSkirtingMat
  );
  frMantelLowerLip.position.set(-20.5, tier2FloorY + 1.16, 1.7);
  frontRoomFpGroup.add(frMantelLowerLip);

  for (const corbelX of [-20.94, -20.06] as const) {
    const oakCorbel = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.14, 0.085),
      oakMat
    );
    oakCorbel.position.set(corbelX, tier2FloorY + 1.09, 1.465);
    oakCorbel.castShadow = true;
    frontRoomFpGroup.add(oakCorbel);
  }

  // Issue #9: Small Round Aged-Brass Framed Mirror centered on the Living Room Chimney Breast above the oak mantel (`[-20.5, 1.12, 1.495]`)
  {
    const roundMirrorGroup = new THREE.Group();
    roundMirrorGroup.name = 'livingRoom.chimneyBreastMirror';
    roundMirrorGroup.userData.zone = 'livingRoom';
    roundMirrorGroup.position.set(-20.5, tier2FloorY + 1.72, 1.495);

    const mirrorRadius = 0.235; // 0.47m diameter small round mirror (scaled for frontWallH = 1.625m)
    const brassFrameRing = new THREE.Mesh(
      new THREE.TorusGeometry(mirrorRadius, 0.018, 14, 36),
      brassMat
    );
    brassFrameRing.name = 'livingRoom.chimneyBreastMirror.frame';
    brassFrameRing.position.set(0, 0, -0.012);
    brassFrameRing.castShadow = true;
    roundMirrorGroup.add(brassFrameRing);

    const innerSlipRing = new THREE.Mesh(
      new THREE.TorusGeometry(mirrorRadius - 0.016, 0.007, 10, 36),
      castIronMat
    );
    innerSlipRing.position.set(0, 0, -0.014);
    roundMirrorGroup.add(innerSlipRing);

    const roundMirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xdce4ea,
      roughness: 0.07,
      metalness: 0.86,
    });
    const mirrorGlassDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(mirrorRadius - 0.014, mirrorRadius - 0.014, 0.012, 36),
      roundMirrorGlassMat
    );
    mirrorGlassDisc.name = 'livingRoom.chimneyBreastMirror.glass';
    mirrorGlassDisc.rotation.x = Math.PI / 2;
    mirrorGlassDisc.position.set(0, 0, -0.008);
    roundMirrorGroup.add(mirrorGlassDisc);

    // Top aged-brass hanging ring & wall finial boss above the circular frame
    const hangerLoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.0045, 8, 18),
      brassMat
    );
    hangerLoop.position.set(0, mirrorRadius + 0.028, -0.008);
    roundMirrorGroup.add(hangerLoop);

    const hangerStud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.013, 0.018, 12),
      brassMat
    );
    hangerStud.rotation.x = Math.PI / 2;
    hangerStud.position.set(0, mirrorRadius + 0.048, -0.006);
    roundMirrorGroup.add(hangerStud);

    frontRoomFpGroup.add(roundMirrorGroup);
  }

  // Exposed Red-Brick Firebox Back & Brick Hearth + Black Cast-Iron Stove (New Photo 5)
  const frFireboxBrickGeo = new THREE.BoxGeometry(0.58, 0.92, 0.08);
  applyWorldSpaceBrickUVs(frFireboxBrickGeo, -20.5, tier2FloorY + 0.46, 1.88);
  const frFireboxBrick = new THREE.Mesh(frFireboxBrickGeo, exteriorBrickMat);
  frFireboxBrick.position.set(-20.5, tier2FloorY + 0.46, 1.88);
  frontRoomFpGroup.add(frFireboxBrick);

  const frBrickHearthGeo = new THREE.BoxGeometry(0.92, 0.08, 0.56);
  applyWorldSpaceBrickUVs(frBrickHearthGeo, -20.5, tier2FloorY + 0.04, 1.62);
  const frBrickHearth = new THREE.Mesh(frBrickHearthGeo, exteriorBrickMat);
  frBrickHearth.position.set(-20.5, tier2FloorY + 0.04, 1.62);
  frBrickHearth.receiveShadow = true;
  frontRoomFpGroup.add(frBrickHearth);

  // Issue #12: Detailed High-LOD Cast-Iron Wood-Burning Stove (`livingRoom.woodBurningStove`) at [-20.5, tier2FloorY + 0.08, 1.65]
  {
    const stoveGroup = new THREE.Group();
    stoveGroup.name = 'livingRoom.woodBurningStove';
    stoveGroup.userData.zone = 'livingRoom';
    stoveGroup.position.set(-20.5, tier2FloorY + 0.08, 1.65);

    const stoveIronMat = new THREE.MeshStandardMaterial({
      color: 0x232528, // Matte stove-black cast iron
      roughness: 0.58,
      metalness: 0.42,
    });
    const stoveTrimMat = new THREE.MeshStandardMaterial({
      color: 0xc89e52, // Aged brass air-vent spin wheel & cool-touch door handle
      roughness: 0.3,
      metalness: 0.82,
    });
    const emberGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff5511,
      emissive: 0xff3d00,
      emissiveIntensity: 2.4,
      roughness: 0.65,
    });
    const flameGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffb84d,
      emissive: 0xff8811,
      emissiveIntensity: 3.0,
      roughness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const fireGlassMat = new THREE.MeshStandardMaterial({
      color: 0x2a1e17,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.42,
    });
    lightGroups.frontRoomPendant.emissives.push(emberGlowMat, flameGlowMat);

    // 1. Four sculpted cast-iron bracket legs (Y = 0.00m..0.095m)
    for (const [lx, lz] of [
      [-0.185, -0.155],
      [0.185, -0.155],
      [-0.185, 0.145],
      [0.185, 0.145],
    ] as const) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.095, 0.052),
        stoveIronMat
      );
      leg.position.set(lx, 0.0475, lz);
      leg.castShadow = true;
      stoveGroup.add(leg);

      const footPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.064, 0.018, 0.064),
        stoveIronMat
      );
      footPad.position.set(lx, 0.009, lz);
      stoveGroup.add(footPad);
    }

    // 2. Stepped cast-iron base plate & projecting front ash lip (Y = 0.095m..0.127m, projecting North -Z)
    const baseTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.032, 0.41),
      stoveIronMat
    );
    baseTray.name = 'livingRoom.woodBurningStove.baseTray';
    baseTray.position.set(0, 0.111, -0.02);
    baseTray.castShadow = true;
    baseTray.receiveShadow = true;
    stoveGroup.add(baseTray);

    const ashLipFront = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.44, 14),
      stoveIronMat
    );
    ashLipFront.rotation.z = Math.PI / 2;
    ashLipFront.position.set(0, 0.111, -0.225);
    stoveGroup.add(ashLipFront);

    // 3. Main cast-iron firebox body (Y = 0.127m..0.527m) with raised side relief panels
    const fireboxBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.4, 0.34),
      stoveIronMat
    );
    fireboxBody.name = 'livingRoom.woodBurningStove.body';
    fireboxBody.position.set(0, 0.327, 0);
    fireboxBody.castShadow = true;
    fireboxBody.receiveShadow = true;
    stoveGroup.add(fireboxBody);

    for (const sideSign of [-1, 1] as const) {
      const sidePanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.32, 0.26),
        stoveIronMat
      );
      sidePanel.position.set(sideSign * 0.214, 0.327, 0);
      stoveGroup.add(sidePanel);
    }

    // 4. Stepped top cornice plate & hotplate blanking collar (Y = 0.527m..0.565m)
    const topCorniceLower = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.02, 0.37),
      stoveIronMat
    );
    topCorniceLower.position.set(0, 0.537, -0.005);
    topCorniceLower.castShadow = true;
    stoveGroup.add(topCorniceLower);

    const topCorniceUpper = new THREE.Mesh(
      new THREE.BoxGeometry(0.47, 0.022, 0.39),
      stoveIronMat
    );
    topCorniceUpper.name = 'livingRoom.woodBurningStove.topPlate';
    topCorniceUpper.position.set(0, 0.556, -0.005);
    topCorniceUpper.castShadow = true;
    stoveGroup.add(topCorniceUpper);

    // 5. Front Cast-Iron Door Frame (North face Z = -0.17m..-0.195m) with ceramic glass window & glowing logs/embers
    const doorZ = -0.178;
    for (const [dx, dy, dw, dh] of [
      [0, 0.465, 0.34, 0.044],  // Top door rail
      [0, 0.195, 0.34, 0.052],  // Bottom door rail (with primary air spin wheel)
      [-0.146, 0.33, 0.048, 0.23], // Left latch stile
      [0.146, 0.33, 0.048, 0.23],  // Right hinge stile
    ] as const) {
      const doorFramePiece = new THREE.Mesh(
        new THREE.BoxGeometry(dw, dh, 0.024),
        stoveIronMat
      );
      doorFramePiece.name = 'livingRoom.woodBurningStove.door';
      doorFramePiece.position.set(dx, dy, doorZ);
      doorFramePiece.castShadow = true;
      stoveGroup.add(doorFramePiece);
    }

    // Arched top window brow inside the door frame
    const windowBrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.244, 0.022, 0.026),
      stoveIronMat
    );
    windowBrow.position.set(0, 0.438, doorZ - 0.002);
    stoveGroup.add(windowBrow);

    // Dark firebox recess & glowing ember bed + split logs + flickering flames behind ceramic glass
    const fireboxBack = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.23),
      new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.92 })
    );
    fireboxBack.rotation.y = Math.PI;
    fireboxBack.position.set(0, 0.33, -0.145);
    stoveGroup.add(fireboxBack);

    const emberBed = new THREE.Mesh(
      new THREE.BoxGeometry(0.23, 0.036, 0.06),
      emberGlowMat
    );
    emberBed.name = 'livingRoom.woodBurningStove.emberBed';
    emberBed.position.set(0, 0.238, -0.155);
    stoveGroup.add(emberBed);

    // Charred split logs resting on the ember bed
    const charredLogMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      emissive: 0x661a00,
      emissiveIntensity: 0.65,
      roughness: 0.88,
    });
    for (const [lx, ly, lz, rotZ] of [
      [-0.04, 0.275, -0.155, 0.18],
      [0.045, 0.282, -0.152, -0.22],
    ] as const) {
      const logMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.028, 0.17, 10),
        charredLogMat
      );
      logMesh.rotation.z = Math.PI / 2 + rotZ;
      logMesh.position.set(lx, ly, lz);
      stoveGroup.add(logMesh);
    }

    // Glowing flame tongues rising above the logs
    for (const [fx, fy, fh, fw] of [
      [-0.045, 0.335, 0.095, 0.032],
      [0.005, 0.35, 0.12, 0.038],
      [0.05, 0.33, 0.085, 0.028],
    ] as const) {
      const flameCone = new THREE.Mesh(
        new THREE.ConeGeometry(fw, fh, 10),
        flameGlowMat
      );
      flameCone.position.set(fx, fy, -0.156);
      stoveGroup.add(flameCone);
    }

    // Ceramic fire-viewing glass pane
    const glassPane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.244, 0.224),
      fireGlassMat
    );
    glassPane.name = 'livingRoom.woodBurningStove.glass';
    glassPane.rotation.y = Math.PI;
    glassPane.position.set(0, 0.33, doorZ - 0.008);
    stoveGroup.add(glassPane);

    // Brass primary air-vent spin wheel on lower door rail + brass cool-touch door handle on left stile + hinges on right
    const spinWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.012, 14),
      stoveTrimMat
    );
    spinWheel.rotation.x = Math.PI / 2;
    spinWheel.position.set(0, 0.195, doorZ - 0.014);
    stoveGroup.add(spinWheel);

    const doorHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.009, 0.085, 10),
      stoveTrimMat
    );
    doorHandle.name = 'livingRoom.woodBurningStove.handle';
    doorHandle.position.set(-0.155, 0.33, doorZ - 0.022);
    stoveGroup.add(doorHandle);

    for (const hy of [0.24, 0.42] as const) {
      const hingeBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.038, 10),
        stoveIronMat
      );
      hingeBarrel.position.set(0.172, hy, doorZ - 0.006);
      stoveGroup.add(hingeBarrel);
    }

    // 6. Top Flue Spigot Collar, Vertical Ø125mm Flue Pipe (`livingRoom.woodBurningStove.flue`) & Damper Key
    const flueSpigot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.076, 0.045, 18),
      stoveIronMat
    );
    flueSpigot.position.set(0, 0.585, 0.03);
    stoveGroup.add(flueSpigot);

    const frStoveFlue = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.42, 18),
      stoveIronMat
    );
    frStoveFlue.name = 'livingRoom.woodBurningStove.flue';
    frStoveFlue.position.set(0, 0.78, 0.03);
    frStoveFlue.castShadow = true;
    stoveGroup.add(frStoveFlue);

    const damperHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.065, 8),
      stoveTrimMat
    );
    damperHandle.rotation.z = Math.PI / 2;
    damperHandle.position.set(-0.072, 0.72, 0.03);
    stoveGroup.add(damperHandle);

    frontRoomFpGroup.add(stoveGroup);
  }

  // Heavy Shelving & Moody Pantalon Base Cabinets + Warm Yellow Gloomy Under-Shelf Lighting (media_1790587491808.png)
  // Issue #2: Make the counter ledge & shelves textured natural oak matching the warm tone of the cupboards below!
  const createAlcoveNaturalOakTextures = (): {
    readonly colorMap: THREE.CanvasTexture;
    readonly bumpMap: THREE.CanvasTexture;
  } => {
    const w = 512;
    const h = 256;
    const cCanvas = document.createElement('canvas');
    cCanvas.width = w;
    cCanvas.height = h;
    const cCtx = cCanvas.getContext('2d')!;

    const bCanvas = document.createElement('canvas');
    bCanvas.width = w;
    bCanvas.height = h;
    const bCtx = bCanvas.getContext('2d')!;

    const cImg = cCtx.createImageData(w, h);
    const bImg = bCtx.createImageData(w, h);
    const cData = cImg.data;
    const bData = bImg.data;

    for (let y = 0; y < h; y++) {
      const ny = y / h;
      const plankBand = Math.sin(ny * Math.PI * 6);
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const idx = (y * w + x) * 4;

        // Organic natural oak cathedral figure + fine open-pore oak vessel grain running along X
        const cathedral =
          Math.sin(nx * 14 + Math.sin(ny * 9.5) * 2.4) * 0.5 +
          Math.cos(nx * 28 - ny * 18) * 0.3;
        const fineGrain =
          Math.sin(y * 1.65 + Math.sin(x * 0.08) * 3.2) * 0.55 +
          Math.sin(y * 3.8 + x * 0.15) * 0.28 +
          Math.cos(x * 0.45 + y * 0.9) * 0.17;
        const poreStreaks =
          Math.pow(Math.max(0, Math.sin(y * 2.9 + Math.cos(x * 0.12) * 2.0)), 6) *
          Math.sin(x * 0.35);

        const delta = cathedral * 11 + fineGrain * 9 - poreStreaks * 14 + plankBand * 4;
        // Warm smoked natural oak base (#554738 / RGB 85, 71, 56) harmonized with the F&B Pantalon cupboards (#433b30)
        cData[idx] = Math.max(38, Math.min(135, Math.round(86 + delta * 1.05)));
        cData[idx + 1] = Math.max(32, Math.min(115, Math.round(72 + delta * 0.9)));
        cData[idx + 2] = Math.max(24, Math.min(92, Math.round(56 + delta * 0.72)));
        cData[idx + 3] = 255;

        const bumpVal = Math.max(
          20,
          Math.min(240, Math.round(135 + fineGrain * 38 - poreStreaks * 65 + cathedral * 18))
        );
        bData[idx] = bumpVal;
        bData[idx + 1] = bumpVal;
        bData[idx + 2] = bumpVal;
        bData[idx + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const colorMap = new THREE.CanvasTexture(cCanvas);
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(2, 1);
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(2, 1);

    return { colorMap, bumpMap };
  };
  const alcoveOakTextures = createAlcoveNaturalOakTextures();

  // East alcove (X = -19.90m..-18.88m, 1.02m wide — Left side when viewing fireplace) &
  // West alcove (X = -22.15m..-21.10m, 1.05m wide — Right side when viewing fireplace)
  const cinemaJoineryStileMat = new THREE.MeshStandardMaterial({
    color: 0x433b30, // Deep Farrow & Ball Pantalon joinery finish
    roughness: 0.68,
    metalness: 0.03,
  });
  const shakerRecessPanelMat = new THREE.MeshStandardMaterial({
    color: 0x362f26, // Darker recessed Pantalon panel & T&G backboard
    roughness: 0.74,
    metalness: 0.02,
  });
  const heavyWalnutShelfMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Tinted by alcoveOakTextures.colorMap (warm smoked natural oak matching cupboards below)
    map: alcoveOakTextures.colorMap,
    bumpMap: alcoveOakTextures.bumpMap,
    bumpScale: 0.0045,
    roughness: 0.52,
    metalness: 0.04,
  });
  const frAlcoveLedStripMat = new THREE.MeshStandardMaterial({
    color: 0xffeba8,
    emissive: 0xffa41b, // Warm yellow gloomy 2200K under-shelf LED glow
    emissiveIntensity: 2.8,
    roughness: 0.18,
  });
  lightGroups.frontRoomPendant.emissives.push(frAlcoveLedStripMat);
  const frAlcoveBookColors = [0x6e3b28, 0x8c6228, 0x3b4836, 0xa89272, 0x4d3829, 0x7a5430];

  for (const [minAx, maxAx, sideKey] of [
    [-19.9, -18.98, 'left'],
    [-22.15, -21.1, 'right'],
  ] as const) {
    const aw = maxAx - minAx;
    const acx = (minAx + maxAx) / 2;
    const cabDepth = 0.41;
    const cabCenterZ = 1.725;
    const doorFrontZ = cabCenterZ - cabDepth * 0.5 - 0.011; // 1.509m (facing North -Z into Front Room)

    // 1. Base Plinth (Y = -0.60m..-0.47m, height 0.13m)
    const alcovePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(aw + 0.01, 0.13, cabDepth + 0.02),
      heavyWalnutShelfMat
    );
    alcovePlinth.position.set(acx, tier2FloorY + 0.065, cabCenterZ);
    alcovePlinth.receiveShadow = true;
    frontRoomFpGroup.add(alcovePlinth);

    // 2. Lower Base Cabinet Carcass Box ONLY (Y = tier2FloorY + 0.13m..+0.96m, height 0.83m)
    const lowerCarcassH = 0.83;
    const alcoveCarcass = new THREE.Mesh(
      new THREE.BoxGeometry(aw, lowerCarcassH, cabDepth),
      cinemaJoineryStileMat
    );
    alcoveCarcass.name = `livingRoom.alcove.${sideKey}.baseCarcass`;
    alcoveCarcass.position.set(acx, tier2FloorY + 0.13 + lowerCarcassH * 0.5, cabCenterZ);
    alcoveCarcass.castShadow = true;
    alcoveCarcass.receiveShadow = true;
    frontRoomFpGroup.add(alcoveCarcass);

    // 3. Heavy 52mm Projecting Dark Walnut Counter Ledge (Y = tier2FloorY + 0.98m)
    const waistMoulding = new THREE.Mesh(
      new THREE.BoxGeometry(aw + 0.028, 0.052, cabDepth + 0.048),
      heavyWalnutShelfMat
    );
    waistMoulding.name = `livingRoom.alcove.${sideKey}.counterLedge`;
    waistMoulding.position.set(acx, tier2FloorY + 0.98, cabCenterZ - 0.012);
    waistMoulding.castShadow = true;
    waistMoulding.receiveShadow = true;
    frontRoomFpGroup.add(waistMoulding);

    // 4. Lower 2-Door Dark Pantalon Shaker Cabinet Fronts with Stiles, Rails, Recessed Panels & Brass Knobs
    const doorGap = 0.008;
    const singleDoorW = (aw - 0.036 - doorGap) * 0.5;
    const stileW = 0.052;
    const railH = 0.054;
    const lowerDoorH = 0.81;
    const lowerDoorCY = tier2FloorY + 0.145 + lowerDoorH * 0.5; // -0.05m

    for (let d = 0; d < 2; d++) {
      const sideSign = d === 0 ? -1 : 1;
      const dcx = acx + sideSign * (singleDoorW * 0.5 + doorGap * 0.5);

      const lowBackPanel = new THREE.Mesh(
        new THREE.BoxGeometry(singleDoorW, lowerDoorH, 0.014),
        shakerRecessPanelMat
      );
      lowBackPanel.position.set(dcx, lowerDoorCY, doorFrontZ + 0.004);
      lowBackPanel.castShadow = true;
      lowBackPanel.receiveShadow = true;
      frontRoomFpGroup.add(lowBackPanel);

      for (const sSign of [-1, 1] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(stileW, lowerDoorH, 0.022),
          cinemaJoineryStileMat
        );
        stile.position.set(dcx + sSign * (singleDoorW * 0.5 - stileW * 0.5), lowerDoorCY, doorFrontZ);
        stile.castShadow = true;
        frontRoomFpGroup.add(stile);
      }
      for (const rSign of [-1, 1] as const) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(singleDoorW - stileW * 2, railH, 0.022),
          cinemaJoineryStileMat
        );
        rail.position.set(dcx, lowerDoorCY + rSign * (lowerDoorH * 0.5 - railH * 0.5), doorFrontZ);
        rail.castShadow = true;
        frontRoomFpGroup.add(rail);
      }

      const knobX = dcx - sideSign * (singleDoorW * 0.5 - stileW * 0.5);
      const knobY = lowerDoorCY + lowerDoorH * 0.5 - 0.09;
      const rose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.005, 12),
        brassMat
      );
      rose.rotation.x = Math.PI / 2;
      rose.position.set(knobX, knobY, doorFrontZ - 0.012);
      frontRoomFpGroup.add(rose);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 12, 12),
        brassMat
      );
      knob.scale.set(1, 1, 0.82);
      knob.position.set(knobX, knobY, doorFrontZ - 0.024);
      knob.castShadow = true;
      frontRoomFpGroup.add(knob);
    }

    // 5. Open Upper Bookcase with Dark Pantalon Vertical T&G Back Boarding, Heavy Side Pilasters & Chunky 58mm Timber Shelves
    const upperBookcaseH = frontTier2WallH - 1.06; // 1.165m
    const upperBookcaseMidY = tier2FloorY + 1.0 + upperBookcaseH * 0.5;
    const tgPlanks = 9;
    const plankStep = (aw - 0.1) / tgPlanks;
    for (let p = 0; p < tgPlanks; p++) {
      const px = minAx + 0.05 + (p + 0.5) * plankStep;
      const tgPlank = new THREE.Mesh(
        new THREE.BoxGeometry(plankStep - 0.005, upperBookcaseH, 0.022),
        shakerRecessPanelMat
      );
      tgPlank.name = `livingRoom.alcove.${sideKey}.tgBackPlank`;
      tgPlank.position.set(px, upperBookcaseMidY, 1.885);
      tgPlank.receiveShadow = true;
      frontRoomFpGroup.add(tgPlank);
    }

    for (const sideX of [minAx + 0.042, maxAx - 0.042]) {
      const sideCheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, upperBookcaseH, 0.36),
        heavyWalnutShelfMat
      );
      sideCheek.position.set(sideX, upperBookcaseMidY, 1.725);
      sideCheek.castShadow = true;
      frontRoomFpGroup.add(sideCheek);

      const frontPilaster = new THREE.Mesh(
        new THREE.BoxGeometry(0.088, upperBookcaseH, 0.034),
        heavyWalnutShelfMat
      );
      frontPilaster.position.set(sideX, upperBookcaseMidY, 1.542);
      frontPilaster.castShadow = true;
      frontRoomFpGroup.add(frontPilaster);
    }

    const crownFrieze = new THREE.Mesh(
      new THREE.BoxGeometry(aw + 0.016, 0.058, cabDepth + 0.028),
      heavyWalnutShelfMat
    );
    crownFrieze.position.set(acx, tier2FloorY + frontTier2WallH - 0.062, cabCenterZ - 0.006);
    crownFrieze.castShadow = true;
    frontRoomFpGroup.add(crownFrieze);

    const crownCap = new THREE.Mesh(
      new THREE.BoxGeometry(aw + 0.032, 0.04, cabDepth + 0.052),
      heavyWalnutShelfMat
    );
    crownCap.position.set(acx, tier2FloorY + frontTier2WallH - 0.019, cabCenterZ - 0.014);
    crownCap.castShadow = true;
    frontRoomFpGroup.add(crownCap);

    // Heavy 58mm Chunky Dark Timber Open Shelves + Warm Yellow Gloomy Under-Shelf LED Strips
    const openShelfHeights = [1.26, 1.54, 1.82] as const;
    for (const [sIdx, sy] of openShelfHeights.entries()) {
      const shelfBoard = new THREE.Mesh(
        new THREE.BoxGeometry(aw - 0.08, 0.056, 0.35),
        heavyWalnutShelfMat
      );
      shelfBoard.name = `livingRoom.alcove.${sideKey}.shelfBoard.${sIdx + 1}`;
      shelfBoard.position.set(acx, tier2FloorY + sy, 1.725);
      shelfBoard.castShadow = true;
      shelfBoard.receiveShadow = true;
      frontRoomFpGroup.add(shelfBoard);

      const shelfNosing = new THREE.Mesh(
        new THREE.BoxGeometry(aw - 0.08, 0.064, 0.028),
        heavyWalnutShelfMat
      );
      shelfNosing.name = `livingRoom.alcove.${sideKey}.shelfNosing.${sIdx + 1}`;
      shelfNosing.position.set(acx, tier2FloorY + sy, 1.546);
      shelfNosing.castShadow = true;
      frontRoomFpGroup.add(shelfNosing);

      const ledDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(aw - 0.14, 0.008, 0.018),
        frAlcoveLedStripMat
      );
      ledDiffuser.name = `livingRoom.alcove.${sideKey}.ledStrip.${sIdx + 1}`;
      ledDiffuser.position.set(acx, tier2FloorY + sy - 0.03, 1.6);
      frontRoomFpGroup.add(ledDiffuser);
      interactions.registerLightFixture(ledDiffuser, 'frontRoomPendant');
    }

    // Warm yellow gloomy alcove glow pool (no PointLight needed — keeps shader PointLight count low)
    const alcovePoolPos = entranceHallNorthWallFrame.toWorld(
      acx + 22.19,
      tier2FloorY + 0.99,
      1.66 - 1.97
    );
    ctx.addGlowPool('frontRoomPendant', alcovePoolPos.x, alcovePoolPos.y, alcovePoolPos.z, 0.75, 0.22);

    // Curated Hardcover Books on the counter & middle shelves of each open bookcase
    for (const [shelfIdx, baseSy] of [
      [0, 1.006],
      [1, 1.288],
      [2, 1.568],
    ] as const) {
      for (let b = 0; b < 5; b++) {
        const bookH = 0.18 + ((b + shelfIdx) % 3) * 0.02;
        const bookW = 0.032 + (b % 2) * 0.008;
        const bookMat = new THREE.MeshStandardMaterial({
          color: frAlcoveBookColors[(b + shelfIdx * 2) % frAlcoveBookColors.length]!,
          roughness: 0.65,
        });
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(bookW, bookH, 0.19),
          bookMat
        );
        const bx =
          sideKey === 'left'
            ? minAx + 0.14 + b * (bookW + 0.004)
            : maxAx - 0.14 - b * (bookW + 0.004);
        book.position.set(bx, tier2FloorY + baseSy + bookH * 0.5, 1.73);
        frontRoomFpGroup.add(book);
      }
    }

    // 6. Q Acoustics Bookshelf Speakers at the Top Left (East alcove) and Top Right (West alcove) (Issue #7)
    const topShelfSurfaceY = tier2FloorY + 1.82 + 0.028;
    if (sideKey === 'left') {
      buildQAcousticsSpeaker(
        frontRoomFpGroup,
        'livingRoom.qAcousticsSpeaker.left',
        maxAx - 0.15,
        topShelfSurfaceY,
        1.68,
        0.18 // Points North (-Z) and slightly West (-X) into the Front Room
      );
    } else {
      buildQAcousticsSpeaker(
        frontRoomFpGroup,
        'livingRoom.qAcousticsSpeaker.right',
        minAx + 0.15,
        topShelfSurfaceY,
        1.68,
        -0.18 // Points North (-Z) and slightly East (+X) into the Front Room
      );
    }
  }

  return {
    livingRoomNorthWallFrame,
    entranceHallNorthWallFrame,
  };
}
