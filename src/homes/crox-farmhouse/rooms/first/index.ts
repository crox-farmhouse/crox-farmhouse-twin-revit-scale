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
  // Survey2Plan `Floor 1613332` + `Stair 1867816`: Main Bedroom steps UP by +0.35m (2 risers × 175mm)
  // from the Upper South Passage (`Y = 2.16m`) to `Y = 2.51m`!
  const mainBedroomKit0 = { ...kit0, floorBaseY: 2.24, floorTopY: 2.51 };
  const mainBedroomKit1 = { ...mainBedroomKit0, ...createFirstFloorShellKit(eastWingCtx, mainBedroomKit0) };
  // Survey2Plan multi-step West Wing floor levels relative to Upper Landing (`Y = 2.160m`):
  // - West Wing Lobby & Courtyard Corridor (`Floor 1602422` & `1612082`): `Y = 2.095m` (-65mm step down)
  // - Bedroom 2 (`Floor 1612229`) & Bedroom 4 (`Floor 1601641`): `Y = 2.050m` (-45mm threshold step down)
  // - Bedroom 3 (`Floor 1611036`): `Y = 2.080m` main floor (+ `-142mm` sunken NW wardrobe alcove at `1.938m`)
  const corridorKit0 = { ...kit0, floorBaseY: 1.98, floorTopY: 2.095 };
  const corridorKit1 = { ...corridorKit0, ...createFirstFloorShellKit(ctx, corridorKit0) };
  const bed2And4Kit0 = { ...kit0, floorBaseY: 1.97, floorTopY: 2.05 };
  const bed2And4Kit1 = { ...bed2And4Kit0, ...createFirstFloorShellKit(ctx, bed2And4Kit0) };
  const bed3Kit0 = { ...kit0, floorBaseY: 1.97, floorTopY: 2.08 };
  const bed3Kit1 = { ...bed3Kit0, ...createFirstFloorShellKit(ctx, bed3Kit0) };

  buildMainBedroom(eastWingCtx, mainBedroomKit1);
  buildFamilyBathroom(eastWingCtx, eastWingKit1);
  buildUpperLanding(eastWingCtx, eastWingKit1);
  buildBedroom2(ctx, bed2And4Kit1);
  buildWestWingCorridor(ctx, corridorKit1);
  buildBedroom3(ctx, bed3Kit1);
  buildBedroom4(ctx, bed2And4Kit1);
  buildFirstFloorCeilingsAndRoof(ctx, bed3Kit1, eastWingCtx);
  buildFirstFloorPendantsAndSwitches(ctx, bed2And4Kit1, eastWingCtx);
}
