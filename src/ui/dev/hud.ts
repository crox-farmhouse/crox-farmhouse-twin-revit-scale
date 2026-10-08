import type { SmartHomeHub } from '../../integrations/smart-home-hub.ts';
import type { PropertyScene } from '../../engine/viewer/property-scene.ts';
import type { KNXPropertyBusController } from '../../integrations/knx/emulator.ts';
import { mountTwinStatusBadge } from './components/TwinStatusBadge.tsx';
import {
  bindCameraAndFloorEvents,
  syncFloorModeUI,
  syncGraphicsUI,
  syncLodReadoutUI,
  syncWalkthroughUI,
} from './hud/hud-camera-and-floors.ts';
import { HudKnxControlsController } from './hud/hud-knx-controls.ts';
import {
  bindSunAndWeatherEvents,
  syncEnvironmentButtonsUI,
  syncUfhUI,
} from './hud/hud-sun-and-weather.ts';
import {
  bindCollapsibleHudSection,
  requireElement,
  type HudSharedContext,
} from './hud/hud-types.ts';

export {
  bindCameraAndFloorEvents,
  bindCollapsibleHudSection,
  bindSunAndWeatherEvents,
  HudKnxControlsController,
  requireElement,
  syncEnvironmentButtonsUI,
  syncFloorModeUI,
  syncGraphicsUI,
  syncLodReadoutUI,
  syncUfhUI,
  syncWalkthroughUI,
  type HudSharedContext,
};

export class HudController {
  private readonly knx: KNXPropertyBusController;
  private readonly scene: PropertyScene;
  private readonly hub: SmartHomeHub;
  private readonly knxControls: HudKnxControlsController;

  private readonly hudWindow: HTMLElement;
  private readonly hudTitlebar: HTMLElement;
  private readonly hudCollapseBtn: HTMLButtonElement;

  public constructor(
    knx: KNXPropertyBusController,
    scene: PropertyScene,
    hub: SmartHomeHub
  ) {
    this.knx = knx;
    this.scene = scene;
    this.hub = hub;

    this.hudWindow = requireElement<HTMLElement>('hud-panel');
    this.hudTitlebar = requireElement<HTMLElement>('hud-titlebar');
    this.hudCollapseBtn = requireElement<HTMLButtonElement>('hud-collapse-btn');

    const hudBody = document.getElementById('hud-body');
    const statusFooter = this.hudWindow.querySelector<HTMLElement>('.hud-statusbar');
    if (hudBody && statusFooter) {
      const badgeMount = document.createElement('div');
      badgeMount.id = 'hud-reactive-status-mount';
      hudBody.insertBefore(badgeMount, statusFooter);
      mountTwinStatusBadge(badgeMount);
    }

    this.knxControls = new HudKnxControlsController(
      this.knx,
      this.scene,
      this.hub,
      () => {
        syncEnvironmentButtonsUI(this.knx, this.scene);
      }
    );

    const sharedCtx: HudSharedContext = {
      knx: this.knx,
      scene: this.scene,
      hub: this.hub,
      onFloorModeChanged: () => this.syncFloorModeUI(),
    };

    bindCollapsibleHudSection(this.hudWindow, this.hudTitlebar, this.hudCollapseBtn);
    bindSunAndWeatherEvents(sharedCtx);
    bindCameraAndFloorEvents(this.scene);

    syncEnvironmentButtonsUI(this.knx, this.scene);
    syncFloorModeUI(this.scene);
    syncLodReadoutUI(this.scene.getLodDiagnostics());

    this.scene.getLodController().setOnLodChanged((diag) => {
      syncLodReadoutUI(diag);
    });

    this.hub.subscribe((ev) => {
      if (ev.type === 'busEvent' && ev.busEvent && ev.busEvent.protocol !== 'knx') {
        this.knxControls.prependSmartHomeEventToUI(ev.busEvent);
      } else if (ev.type === 'entityChanged') {
        this.knxControls.syncUniFiStatusUI();
      }
    });

    this.knx.subscribe((event) => {
      if (event.type === 'telegram') {
        this.knxControls.prependTelegramToUI(event.telegram);
      } else if (event.type === 'stateChange') {
        this.knxControls.updateCircuitControlsValues();
        this.knxControls.updateSwitchStatusUI();
        syncEnvironmentButtonsUI(this.knx, this.scene);
      } else if (event.type === 'eepromChanged' || event.type === 'flashed') {
        this.knxControls.renderEEPROMHex();
        this.knxControls.updateSwitchStatusUI();
      }
    });
  }

  public syncFloorModeUI(): void {
    syncFloorModeUI(this.scene);
  }

  public syncGraphicsUI(): void {
    syncGraphicsUI(this.scene);
  }

  public syncWalkthroughUI(): void {
    syncWalkthroughUI(this.scene);
  }

  public syncUfhUI(): void {
    syncUfhUI(this.scene);
  }
}
