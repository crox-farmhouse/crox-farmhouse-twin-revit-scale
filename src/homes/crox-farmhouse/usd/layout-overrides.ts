import {
  parseUsdaOverrideLayer,
  type UsdTransformOverride,
} from '../../../engine/usd/usda-override-layer.ts';

/**
 * Default non-destructive OpenUSD (`#usda 1.0`) override layer for Crox Farmhouse.
 *
 * Any `over` transform or visibility directives placed here (or exported from the
 * 3D Annotator HUD into `usd/overrides/layout.usda`) are composed non-destructively
 * over the base procedural room zones in both the Three.js Digital Twin and the
 * exported OpenUSD stage (`usd/crox_farmhouse.usda`).
 */
export const CROX_FARMHOUSE_USD_OVERRIDE_LAYER = `#usda 1.0
(
    defaultPrim = "CroxFarmhouse"
    doc = "Crox Farmhouse non-destructive layout & annotation override layer"
    metersPerUnit = 1
    upAxis = "Y"
)

over "CroxFarmhouse"
{
    over "Zones"
    {
    }
}
`;

export const CROX_FARMHOUSE_USD_OVERRIDES: readonly UsdTransformOverride[] =
  parseUsdaOverrideLayer(CROX_FARMHOUSE_USD_OVERRIDE_LAYER);
