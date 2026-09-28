import { buildBedroom2 } from './bedroom-2.ts';
import { buildBedroom3 } from './bedroom-3.ts';
import { buildBedroom4 } from './bedroom-4.ts';
import { buildFamilyBathroom } from './family-bathroom.ts';
import { buildMainBedroom } from './main-bedroom.ts';
import { buildFirstFloorPendantsAndSwitches } from './pendants-and-switches.ts';
import { buildFirstFloorCeilingsAndRoof } from './roof.ts';
import { buildUpperLanding } from './upper-landing.ts';
import { buildWestWingCorridor } from './west-wing-corridor.ts';
import { createScopedBuilderContext } from '../../../../engine/scene/scene-content.ts';
import { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
} from '../../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';

/**
 * Builds the First Floor (Upstairs) of the Main House (`Y = 2.28m..4.38m`) and the
 * Two-Storey L-Plan Pitched Welsh Slate Roof & 5 Red-Brick Chimney Stacks (`Y = 4.38m..7.38m`)
 * at Crox Farm House, Tur Langton.
 */
export function buildMainHouseFirstFloorAndRoof(ctx: SceneBuilderContext): void {
  const eastWingCtx = createScopedBuilderContext(ctx, {
    name: 'eastWing',
    offset: MAIN_EAST_WING_OFFSET,
    rotationY: MAIN_EAST_WING_ROTATION_Y,
  });
  const kit0 = createFirstFloorMaterials(ctx);
  const kit1 = { ...kit0, ...createFirstFloorShellKit(ctx, kit0) };
  const eastWingKit1 = { ...kit0, ...createFirstFloorShellKit(eastWingCtx, kit0) };

  buildMainBedroom(eastWingCtx, eastWingKit1);
  buildFamilyBathroom(eastWingCtx, eastWingKit1);
  buildUpperLanding(eastWingCtx, eastWingKit1);
  buildBedroom2(ctx, kit1);
  buildWestWingCorridor(ctx, kit1);
  buildBedroom3(ctx, kit1);
  buildBedroom4(ctx, kit1);
  buildFirstFloorCeilingsAndRoof(ctx, kit1, eastWingCtx);
  buildFirstFloorPendantsAndSwitches(ctx, kit1, eastWingCtx);
}
