import { buildBedroom2 } from './bedroom-2.ts';
import { buildBedroom3 } from './bedroom-3.ts';
import { buildBedroom4 } from './bedroom-4.ts';
import { buildFamilyBathroom } from './family-bathroom.ts';
import { buildMainBedroom } from './main-bedroom.ts';
import { buildFirstFloorPendantsAndSwitches } from './pendants-and-switches.ts';
import { buildFirstFloorCeilingsAndRoof } from './roof.ts';
import { buildUpperLanding } from './upper-landing.ts';
import { buildWestWingCorridor } from './west-wing-corridor.ts';
import { createScopedBuilderContext } from '../../../../engine/viewer/scene-content.ts';
import { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
} from '../../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';

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
  const eastWingKit1 = { ...kit0, ...createFirstFloorShellKit(eastWingCtx, kit0) };
  // The Main Bedroom (East of X_ew = -9.68m, above the +0.30m stepped-up Ground Floor Dining Room)
  // steps UP by +0.18m (from Y = 2.16m in the Upper South Passage to Y = 2.34m in the Main Bedroom)
  const mainBedroomKit0 = { ...kit0, floorBaseY: 2.24, floorTopY: 2.34 };
  const mainBedroomKit1 = { ...mainBedroomKit0, ...createFirstFloorShellKit(eastWingCtx, mainBedroomKit0) };
  // The 3-Bedroom West Wing (Bedroom 2, Shower Room, West Wing Corridor, Bedroom 3, Bedroom 4)
  // sits one small 8cm step (Y = 2.08m) lower than the Main Staircase Landing & East Wing (Y = 2.16m)
  const westWingKit0 = { ...kit0, floorBaseY: 2.0, floorTopY: 2.08 };
  const westWingKit1 = { ...westWingKit0, ...createFirstFloorShellKit(ctx, westWingKit0) };

  buildMainBedroom(eastWingCtx, mainBedroomKit1);
  buildFamilyBathroom(eastWingCtx, eastWingKit1);
  buildUpperLanding(eastWingCtx, eastWingKit1);
  buildBedroom2(ctx, westWingKit1);
  buildWestWingCorridor(ctx, westWingKit1);
  buildBedroom3(ctx, westWingKit1);
  buildBedroom4(ctx, westWingKit1);
  buildFirstFloorCeilingsAndRoof(ctx, westWingKit1, eastWingCtx);
  buildFirstFloorPendantsAndSwitches(ctx, westWingKit1, eastWingCtx);
}
