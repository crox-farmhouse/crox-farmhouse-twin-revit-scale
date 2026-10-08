import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import {
  OUTBUILDING_ORIGIN_X,
  OUTBUILDING_ORIGIN_Z,
  OUTBUILDING_ROTATION_Y,
  createOutbuildingShellContext,
  getOutbuildingNorthWallWorldZ,
  type OutbuildingsBuilderKit,
} from './outbuilding-shell/outbuilding-coords-and-materials.ts';
import { buildWestAndEastGroundShell } from './outbuilding-shell/west-and-east-ground-shell.ts';
import {
  buildEastRangePitchedRoofs,
  buildOutbuildingTrussesAndSoffits,
} from './outbuilding-shell/outbuilding-trusses-and-roofs.ts';
import { buildMezzanineAndStableUpperShell } from './outbuilding-shell/mezzanine-and-stable-upper-shell.ts';

export {
  OUTBUILDING_ORIGIN_X,
  OUTBUILDING_ORIGIN_Z,
  OUTBUILDING_ROTATION_Y,
  getOutbuildingNorthWallWorldZ,
  type OutbuildingsBuilderKit,
};

export function buildOutbuildingsAndBarns(
  ctx: SceneBuilderContext,
  kit: OutbuildingsBuilderKit
): void {
  const shellCtx = createOutbuildingShellContext(ctx, kit);
  buildWestAndEastGroundShell(shellCtx);
  buildOutbuildingTrussesAndSoffits(shellCtx);
  buildMezzanineAndStableUpperShell(shellCtx);
  buildEastRangePitchedRoofs(shellCtx);
}
