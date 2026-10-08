import { buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import { buildSittingRoomCornerPlant, buildTraditionalWindowCurtains } from '../../../../objects/decor/curtains-and-fiddle-leaf-plant.ts';
import { buildSittingRoomNorthWallArt } from '../../../../objects/furniture/sitting-room-sofas-and-art.ts';
import type { SceneBuilderContext } from '../../../../core/types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';

/**
 * Sitting Room (`sittingRoom`) shell, bay window and curtains.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildSittingRoom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'brassMat' | 'ceramicWhiteMat' | 'farrowAndBallCordMat' | 'frontWallH' | 'tagCutawayWall' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addBrickWallAlongZWithWindow' | 'addInteriorWall' | 'addWestCantedBayWindow' | 'eastCourtyardWallAngleY' | 'getEastCourtyardWallCenterX' | 'greyRoomCarpetMat'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'frontTier2WallH' | 'frontTier2WallMidY' | 'tier2FloorY'>
): void {
  const { scene } = ctx;
  const {
    addBrickWallAlongZWithWindow,
    addInteriorWall,
    addWestCantedBayWindow,
    brassMat,
    ceramicWhiteMat,
    eastCourtyardWallAngleY,
    farrowAndBallCordMat,
    frontTier2WallH,
    frontTier2WallMidY,
    frontWallH,
    getEastCourtyardWallCenterX,
    greyRoomCarpetMat,
    tagCutawayWall,
    tier2FloorY,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 6. LIVING ROOM — LIGHT-COLORED ROOM (4.80m x 4.45m / 15'9" x 14'7")
  //    X = -17.39m..-22.19m, Z = +3.70m..+8.15m (Floor at Y = -0.60m)
  //    Matching New Photo 7 (media_1790502987388.webp):
  //    - Soft light-grey carpet floor (0xb8b4ae) & Farrow & Ball "Cord" No. 16 walls (Issue #14)
  //    - White-painted North-South ceiling spine beam & East-West joists
  //    - Exposed red-brick South chimney breast with white timber lintel & wrought-iron fire screen
  //    - Built-in cream Shaker base cabinets + 3-tier open bookshelves in BOTH alcoves (TV on right)
  //    - Slatted white radiator covers in the West bay window & on the East wall + two cream sofas
  //    - SOLID South wall (NO internal door to the Plant Room behind it — external access only!)
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 3.625],
      [-17.01, 3.625],
      [-17.22, 8.27],
      [-22.19, 8.27],
    ],
    tier2FloorY,
    0.08,
    greyRoomCarpetMat,
    0.5
  ).name = 'sittingRoom.floor';

  // West Exterior Brick Wall & Symmetrical 3-Sided Canted Bay Window of Living Room (Z = +3.70m..+8.39m, centered at Z = +5.92m)
  // Issue #14: Farrow & Ball "Cord" (`farrowAndBallCordMat`) on the Sitting Room interior walls!
  addWestCantedBayWindow(5.92, 3.7, 8.39, farrowAndBallCordMat);

  // Issue #8: Large Statement Framed Piece of Art on the Sitting Room North Wall (Z = 3.70m)
  // Centered at X = -20.208m between the two brass wall sconces (X = -19.135m and -21.281m)
  buildSittingRoomNorthWallArt(scene, brassMat, ceramicWhiteMat);

  // Issue #5: Sculpted Fiddle-Leaf Fig (`Ficus lyrata`) in Turned Ribbed Stoneware Planter in the Sitting Room NW Corner
  buildSittingRoomCornerPlant(scene, tier2FloorY);

  // East Courtyard Exterior Brick Wall of Living Room (0.28m thick, X = -17.11m..-17.39m, Z = +3.70m..+8.15m)
  // With Courtyard Window at Z = +5.92m (headY lowered to 1.54m -> effHeadY = 1.38m for frontWallH = 1.625m — Issue #1)
  addBrickWallAlongZWithWindow(
    -17.39,
    -17.11,
    3.7,
    8.15,
    5.92,
    1.65,
    0.58,
    1.54,
    'west',
    3,
    frontWallH
  );

  // Issue #2 & Issue #9: Traditional Catenary-Draped Interlined Oatmeal-Linen Curtains, Tie-Backs & 38mm Aged-Brass Curtain Pole
  // on the Interior West (-X) Face of the Sitting Room East Courtyard Window (centered at Z = +5.92m)
  {
    const eastWinCenterZ = 5.92;
    const eastWinHalfW = 1.65 / 2; // 0.825m
    const eastWallInnerX = getEastCourtyardWallCenterX(eastWinCenterZ) - 0.14;
    const poleY = 1.49;
    const poleOff = -0.078; // Projects 7.8cm West (-X) into the Sitting Room interior

    const eastCurtainGroup = buildTraditionalWindowCurtains({
      groupName: 'sittingRoom.eastWindowCurtains',
      poleName: 'sittingRoom.eastWindowCurtains.pole',
      finialName: 'sittingRoom.eastWindowCurtains.finial',
      bracketName: 'sittingRoom.eastWindowCurtains.bracket',
      panelName: 'sittingRoom.eastWindowCurtains.panel',
      headerName: 'sittingRoom.eastWindowCurtains.header',
      hemName: 'sittingRoom.eastWindowCurtains.hem',
      tieBackName: 'sittingRoom.eastWindowCurtains.tieBack',
      halfWindowSpanZ: eastWinHalfW,
      poleExtensionZ: 0.34,
      stackWidthZ: 0.48,
      stackInnerInsetZ: 0.2,
      poleX: poleOff,
      wallFaceX: 0,
      poleY,
      floorY: tier2FloorY,
      tieBackY: 0.78,
      centerZ: 0,
      inwardSignX: -1,
      mainColorHex: 0xd8cfc0,
      shadowColorHex: 0xc2b7a5,
      trimColorHex: 0xb5aa96,
      brassMat,
    });
    eastCurtainGroup.userData.zone = 'sittingRoom';
    eastCurtainGroup.userData.isArchitecturalShell = true;
    eastCurtainGroup.position.set(eastWallInnerX, 0, eastWinCenterZ);
    eastCurtainGroup.rotation.y = eastCourtyardWallAngleY;

    tagCutawayWall(eastCurtainGroup, {
      axis: 'x',
      coord: -17.25,
      minSpan: 3.7,
      maxSpan: 8.15,
      floor: 'ground',
    });
    scene.add(eastCurtainGroup);
  }

  // SOLID South Load-Bearing Cross-Wall between Living Room and Plant Room / Study behind it
  // (0.24m thick, Z = +8.15m..+8.39m, X = -17.23m..-22.19m — NO internal door to Plant Room!)
  // Issue #14: Farrow & Ball "Cord" (`farrowAndBallCordMat`) on the North (-Z, index 5, Sitting Room) face!
  // Issue #1: Reduced ceiling height (`frontTier2WallH = 2.225m`, top at `frontWallH = 1.625m`)
  addInteriorWall(
    -19.71,
    frontTier2WallMidY,
    8.27,
    4.96,
    frontTier2WallH,
    0.24,
    [
      warmRoomPlasterMat,
      warmRoomPlasterMat,
      warmRoomPlasterMat,
      warmRoomPlasterMat,
      warmRoomPlasterMat,
      farrowAndBallCordMat,
    ],
    { skipSkirting: true }
  );
}
