import { createScopedBuilderContext } from '../../../../engine/scene/scene-content.ts';
import { buildBootLobby } from './boot-lobby.ts';
import { buildDiningRoom } from './dining-room.ts';
import { buildEntranceHall } from './entrance-hall.ts';
import { buildHallStaircase } from './hall-staircase.ts';
import { buildHall } from './hall.ts';
import { buildLivingRoomCinemaWall } from './living-room-cinema-wall.ts';
import { buildLivingRoom } from './living-room.ts';
import { buildGroundFloorPendantsAndSwitches } from './pendants-and-switches.ts';
import { buildPlantRoomBoilers } from './plant-room-boilers.ts';
import { buildPlantRoomElectrics } from './plant-room-electrics.ts';
import { buildPlantRoom } from './plant-room.ts';
import { buildSittingRoomFireplace } from './sitting-room-fireplace.ts';
import { buildSittingRoomFurniture } from './sitting-room-furniture.ts';
import { buildSittingRoom } from './sitting-room.ts';
import { buildStudyDesk } from './study-desk.ts';
import { buildStudy } from './study.ts';
import { buildCourtyardAndGates } from '../grounds/courtyard-and-gates.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
  MAIN_EAST_WING_Z_SHIFT,
  createGroundFloorMaterials,
} from '../../structure/ground-floor-materials.ts';
import { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';

/**
 * Builds the Ground Floor rooms of the Main House at Crox Farm House, Tur Langton.
 *
 * The Main East-West Wing (`familyRoom`, `bootLobby`, `hall`, `hallStaircase`) is parented to
 * `eastWingCtx` (`offset: MAIN_EAST_WING_OFFSET, rotationY: MAIN_EAST_WING_ROTATION_Y`), while the
 * West Front Wing (`livingRoom`, `entranceHall`, `sittingRoom`, `study`, `plantRoom`) stays anchored
 * to the West Front Facade (`X = -22.19m`).
 */
export function buildMainHouseGroundFloorRooms(ctx: SceneBuilderContext): void {
  const eastWingCtx = createScopedBuilderContext(ctx, {
    name: 'groundFloor.eastWing',
    offset: MAIN_EAST_WING_OFFSET,
    rotationY: MAIN_EAST_WING_ROTATION_Y,
  });

  const kit0 = createGroundFloorMaterials(ctx);
  const eastWingKit1 = { ...kit0, ...createGroundFloorShellKit(eastWingCtx, kit0) };
  const westWingShellKit = createGroundFloorShellKit(ctx, kit0, {
    courtyardZShift: MAIN_EAST_WING_Z_SHIFT,
    courtyardFollowsEastWing: true,
  });

  const eastWingKit2 = { ...eastWingKit1, ...buildDiningRoom(eastWingCtx, eastWingKit1) };
  buildBootLobby(eastWingCtx, eastWingKit2);
  const eastWingKit4 = { ...eastWingKit2, ...defineTier2Levels(eastWingCtx, eastWingKit2) };
  const eastWingKit5 = { ...eastWingKit4, ...buildHall(eastWingCtx, eastWingKit4) };
  const eastWingKit6 = { ...eastWingKit5, ...buildHallStaircase(eastWingCtx, eastWingKit5) };

  const westWingKit6 = {
    ...eastWingKit6,
    ...westWingShellKit,
    hallFrontRoomCrossWallFrame: eastWingKit6.hallFrontRoomCrossWallFrame.transform(
      MAIN_EAST_WING_OFFSET,
      MAIN_EAST_WING_ROTATION_Y
    ),
  };

  const westWingKit7 = { ...westWingKit6, ...buildLivingRoom(ctx, westWingKit6) };
  buildLivingRoomCinemaWall(ctx, westWingKit7);
  buildEntranceHall(ctx, westWingKit7);
  buildSittingRoom(ctx, westWingKit7);
  buildSittingRoomFireplace(ctx, westWingKit7);
  buildSittingRoomFurniture(ctx, westWingKit7);
  buildStudy(ctx, westWingKit7);
  buildPlantRoomElectrics(ctx, westWingKit7);
  buildPlantRoom(ctx, westWingKit7);
  buildStudyDesk(ctx, westWingKit7);
  buildPlantRoomBoilers(ctx, westWingKit7);
  buildCourtyardAndGates(ctx, westWingKit7);
  buildGroundFloorPendantsAndSwitches(ctx, westWingKit7);
}
