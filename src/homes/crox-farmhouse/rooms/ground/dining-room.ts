import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import { buildDiningCeilingRugAndSouthWall } from './dining/ceiling-rug-and-south-wall.ts';
import { buildSnugAlcoveAndEastFireplace } from './dining/snug-alcove-and-east-fireplace.ts';
import { buildWalkInCupboardAndNorthWall } from './dining/walk-in-cupboard-and-north-wall.ts';
import { buildWestWallAndThresholdStep } from './dining/west-wall-and-threshold-step.ts';
import { buildWycombeExtendingDiningTable } from './dining/wycombe-extending-dining-table.ts';

export type DiningRoomKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  | 'antiqueOakSkirtingMat'
  | 'applyWorldSpaceFloorUVs'
  | 'brassMat'
  | 'castIronMat'
  | 'ceramicWhiteMat'
  | 'courtyardDoorMat'
  | 'courtyardDoorRecessMat'
  | 'doorH'
  | 'doorLintelH'
  | 'doorLintelY'
  | 'engineeredOakFloorMat'
  | 'exteriorBrickMat'
  | 'herringboneTerracottaQuarryMat'
  | 'oakMat'
  | 'skirtingMat'
  | 'stoneSillMat'
  | 'tagCutawayWall'
  | 'wallCapMat'
  | 'wallH'
  | 'windowFrameMat'
  | 'windowGlassMat'
> &
  Pick<
    ReturnType<typeof createGroundFloorShellKit>,
    | 'addBrickWallAlongXWithWindow'
    | 'addExteriorBrickWall'
    | 'addInteractiveInteriorDoor'
    | 'addInteriorWall'
    | 'applyWorldSpaceBrickUVs'
  >;

/**
 * Dining Room (`familyRoom`) with walk-in cupboard, snug alcove, east fireplace, dining table and step down to the next hallway.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildDiningRoom(ctx: SceneBuilderContext, kit: DiningRoomKit) {
  const mats = buildWalkInCupboardAndNorthWall(ctx, kit);
  buildSnugAlcoveAndEastFireplace(ctx, kit, mats);
  buildDiningCeilingRugAndSouthWall(ctx, kit, mats);
  buildWycombeExtendingDiningTable(ctx, kit);
  return buildWestWallAndThresholdStep(ctx, kit, mats);
}
