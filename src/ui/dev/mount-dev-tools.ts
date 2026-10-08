import type { SmartHomeHub } from '../../integrations/smart-home-hub.ts';
import type { TwinApi } from '../../app/twin-api.ts';
import type { PropertyScene } from '../../engine/viewer/property-scene.ts';
import type { KNXPropertyBusController } from '../../integrations/knx/index.ts';
import { HudController, syncEnvironmentButtonsUI } from './hud.ts';
import { UsdStageHudController } from './usd-stage-hud.ts';

export { DevDrawer } from './DevDrawer.tsx';

export interface DevToolsDeps {
  readonly scene: PropertyScene;
  readonly knx: KNXPropertyBusController;
  readonly hub: SmartHomeHub;
  readonly api: TwinApi;
  /** Home-specific USD override layer shown in the stage studio editor. */
  readonly usdOverrideLayer: string;
}

/**
 * Wires the legacy developer HUDs (KNX bus / smart-home panel and the OpenUSD
 * stage studio). Their DOM lives in index.html and is adopted by the developer
 * drawer; they talk to the engine directly, which only src/ui/dev may do.
 */
export function mountDevTools(deps: DevToolsDeps): void {
  const hud = new HudController(deps.knx, deps.scene, deps.hub);
  new UsdStageHudController(deps.scene, deps.usdOverrideLayer, () => hud.syncFloorModeUI());
  // Bifold / time-of-day readouts follow device changes made from anywhere.
  deps.api.devices.onChanged(() => syncEnvironmentButtonsUI(deps.knx, deps.scene));
}
