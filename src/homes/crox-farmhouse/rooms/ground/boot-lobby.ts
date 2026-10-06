import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { buildDiningRoom } from './dining-room.ts';
import {
  buildBootRoomBenchAndLockers,
  type BootRoomBenchAndLockersKit,
} from './hall-and-boot/boot-room-bench-and-lockers.ts';
import {
  buildDownstairsWcAndCloakroom,
  type DownstairsWcAndCloakroomKit,
} from './hall-and-boot/downstairs-wc-and-cloakroom.ts';

export {
  buildBootRoomBenchAndLockers,
  type BootRoomBenchAndLockersKit,
  buildDownstairsWcAndCloakroom,
  type DownstairsWcAndCloakroomKit,
};

/**
 * Middle Boot Lobby (`bootLobby`), store, cloakroom WC and wine cellar.
 *
 * Orchestrates `buildBootRoomBenchAndLockers` and `buildDownstairsWcAndCloakroom`
 * under `./hall-and-boot/`.
 */
export function buildBootLobby(
  ctx: SceneBuilderContext,
  kit: Pick<
    ReturnType<typeof createGroundFloorMaterials>,
    | 'antiqueOakSkirtingMat'
    | 'applyWorldSpaceFloorUVs'
    | 'brassMat'
    | 'ceramicWhiteMat'
    | 'doorH'
    | 'engineeredOakFloorMat'
    | 'oakMat'
    | 'skirtingMat'
    | 'tagCutawayWall'
    | 'wallH'
    | 'warmRoomPlasterMat'
  > &
    Pick<
      ReturnType<typeof createGroundFloorShellKit>,
      'addBrickWallAlongXWithWindow' | 'addInteractiveInteriorDoor' | 'addInteriorWall'
    > &
    Pick<
      ReturnType<typeof buildDiningRoom>,
      'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'
    >
): void {
  buildBootRoomBenchAndLockers(ctx, kit);
  buildDownstairsWcAndCloakroom(ctx, kit);
}
