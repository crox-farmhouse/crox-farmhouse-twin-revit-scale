import type { SceneBuilderContext } from '../../../../core/types/scene.ts';
import {
  buildCentralHallFurnitureAndDecor,
  type CentralHallFurnitureKit,
} from './hall-and-boot/central-hall-furniture-and-decor.ts';
import {
  buildCentralHallShellAndJoinery,
  type CentralHallShellKit,
} from './hall-and-boot/central-hall-shell-and-joinery.ts';

export {
  buildCentralHallFurnitureAndDecor,
  buildCentralHallShellAndJoinery,
  type CentralHallFurnitureKit,
  type CentralHallShellKit,
};

/**
 * Stair Hall (`hall`): orchestrator decomposing the room into architectural shell & joinery
 * (`central-hall-shell-and-joinery.ts`) and freestanding furniture & decor (`central-hall-furniture-and-decor.ts`).
 */
export function buildHall(ctx: SceneBuilderContext, kit: CentralHallShellKit) {
  const { hallFrontRoomCrossWallFrame } = buildCentralHallShellAndJoinery(ctx, kit);
  buildCentralHallFurnitureAndDecor(ctx, {
    ...kit,
    hallFrontRoomCrossWallFrame,
  });
  return {
    hallFrontRoomCrossWallFrame,
  };
}
