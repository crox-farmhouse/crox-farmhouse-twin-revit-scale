import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import {
  buildVaillantBoilersAndFlues,
  type PlantRoomBoilersKit,
} from './study-and-plant/vaillant-boilers-and-flues.ts';
import { buildUnventedCylindersAndPipework } from './study-and-plant/unvented-cylinders-and-pipework.ts';

export function buildPlantRoomBoilers(
  ctx: SceneBuilderContext,
  kit: PlantRoomBoilersKit
): void {
  const sharedCtx = buildVaillantBoilersAndFlues(kit);
  buildUnventedCylindersAndPipework(ctx.scene, kit, sharedCtx);
}
