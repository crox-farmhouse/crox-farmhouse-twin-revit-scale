import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import {
  buildCoffeeMachineAndGrinder,
  buildDualitToaster,
  buildNorthWallInductionHobAndToaster,
} from './kitchen/countertop-appliances-and-decor.ts';
import {
  buildNorthEastBifoldPantryUnit,
  buildWestWallFridgeAndOvenTowers,
} from './kitchen/fridge-and-larder-joinery.ts';
import { createKitchenCabinetrySharedContext } from './kitchen/kitchen-joinery-shared.ts';
import {
  buildAgaRangeCooker,
  buildBacksplashAndCookerHood,
} from './kitchen/range-cooker-and-hood.ts';
import {
  buildNorthRightBaseCabinetry,
  buildNorthWestUpperCorniceAndUpstands,
  buildWestAndNorthLeftCabinetry,
} from './kitchen/west-and-north-wall-cabinetry.ts';

export {
  buildAgaRangeCooker,
  buildBacksplashAndCookerHood,
  buildCoffeeMachineAndGrinder,
  buildDualitToaster,
  buildNorthEastBifoldPantryUnit,
  buildNorthRightBaseCabinetry,
  buildNorthWallInductionHobAndToaster,
  buildNorthWestUpperCorniceAndUpstands,
  buildWestAndNorthLeftCabinetry,
  buildWestWallFridgeAndOvenTowers,
};

export function buildWrapAroundDoveGreyKitchenAGAAndCoffeeCorner(
  ctx: SceneBuilderContext
): void {
  const shared = createKitchenCabinetrySharedContext();

  // 1a & 1b. West Wall Full-Height Fridge-Freezer Tower & NEFF N50 Double Oven Tower
  buildWestWallFridgeAndOvenTowers(ctx, shared);

  // 1c & 2. West Wall Base/Upper Cabinetry & North Back Wall Run Left of Wide AGA
  buildWestAndNorthLeftCabinetry(ctx, shared);

  // 3. Wide Royal-Slate Blue Cast-Iron AGA Range Cooker
  buildAgaRangeCooker(ctx, shared);

  // 4. North Back Wall Pan Drawers & Double-Door Base Cabinetry to the Right of the AGA
  buildNorthRightBaseCabinetry(ctx, shared);

  // 4b. 4-Zone Induction Hob & Dualit 4-Slot Polished Chrome Toaster
  buildNorthWallInductionHobAndToaster(ctx, shared);

  // 5. Full-Length Carrara Marble Backsplash & Smooth Wide Cooker Hood
  buildBacksplashAndCookerHood(ctx, shared);

  // 6. Countertop Bi-Fold Pantry Unit near the TV
  buildNorthEastBifoldPantryUnit(ctx, shared);

  // Espresso Coffee Machine & Burr Grinder in the North-West corner (Issue #6)
  buildCoffeeMachineAndGrinder(ctx.scene, -3.88, 0.945, -2.053, Math.PI * 0.25);

  // North-West Upper Cupboard, Continuous Cornice Plinth & Carrara Marble Worktop Upstands
  buildNorthWestUpperCorniceAndUpstands(ctx, shared);
}
