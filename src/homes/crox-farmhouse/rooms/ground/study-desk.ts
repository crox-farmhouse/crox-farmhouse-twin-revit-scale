import type { SceneBuilderContext } from '../../../../core/types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import {
  buildStudyDeskAndChair,
  buildStudyLaserPrinter,
} from './study-and-plant/study-desk-and-chair.ts';
import {
  buildStudyMacbookPro,
  buildStudyShelvingAndMonitors,
} from './study-and-plant/study-shelving-and-monitors.ts';

export {
  buildStudyDeskAndChair,
  buildStudyLaserPrinter,
  buildStudyMacbookPro,
  buildStudyShelvingAndMonitors,
};

/**
 * Study L-shaped desk, chair, MacBook, laser printer, server rack, 3D printer and whiteboard.
 *
 * Orchestrates modular sub-builders under `./study-and-plant/`.
 */
export function buildStudyDesk(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat' | 'tagCutawayWall'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
): void {
  const { deskGroup, deskH } = buildStudyDeskAndChair(ctx, kit);
  buildStudyMacbookPro(ctx, kit, deskH);
  buildStudyLaserPrinter(ctx, kit, deskH);
  buildStudyShelvingAndMonitors(ctx, kit, deskH);
  ctx.scene.add(deskGroup);
}
