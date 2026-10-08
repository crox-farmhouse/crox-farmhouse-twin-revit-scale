import { SmartHomeHub } from './app/smart-home-hub.ts';
import {
  KNXPropertyBusController,
  LoopbackSimulationTransport,
  WebSocketKNXGatewayTransport,
} from './integrations/knx/index.ts';
import { SceneAnnotationStore } from './engine/annotation/annotation-system.ts';
import { CroxPropertyScene } from './homes/crox-farmhouse/crox-property-scene.ts';
import type { InboundKNXFrame } from './core/types/knx.ts';
import { FocusController } from './engine/rooms/focus-controller.ts';
import { createCroxFarmhouseFocusRooms } from './homes/crox-farmhouse/hud-model.ts';
import { AnnotatorHudController } from './ui/annotator-hud.ts';
import { HudController } from './ui/hud.ts';
import { getLoadingScreen } from './ui/shell/loading.ts';
import { mountAppShell } from './ui/shell/mount-shell.tsx';
import { UsdStageHudController } from './ui/usd-stage-hud.ts';

export interface CroxDigitalTwinGlobalAPI {
  readonly hub: SmartHomeHub;
  readonly knx: KNXPropertyBusController;
  readonly scene: CroxPropertyScene;
  readonly annotations: SceneAnnotationStore;
  connectToGateway(wsEndpointUrl: string): Promise<void>;
  useSimulation(): void;
  injectTelegram(frameOrHex: string | InboundKNXFrame): void;
}

declare global {
  interface Window {
    croxTwin?: CroxDigitalTwinGlobalAPI;
  }
}

const GATE_PA = '1.1.22';
const COURTYARD_SWITCH_PA = '1.1.14';
const KITCHEN_SWITCH_PA = '1.1.10';

async function boot(): Promise<void> {
  const loading = getLoadingScreen();

  const canvasEl = document.getElementById('three-canvas');
  if (!(canvasEl instanceof HTMLCanvasElement)) {
    throw new Error('Canvas element #three-canvas not found');
  }
  const shellRoot = document.getElementById('shell-root');
  if (!(shellRoot instanceof HTMLElement)) {
    throw new Error('Shell root element #shell-root not found');
  }

  await loading.setProgress('Connecting to the smart-home bus…', 0.1);

  // Automatically connect to a live KNXnet/IP WebSocket gateway if ?knxWs=ws://... is provided
  const urlParams = new URLSearchParams(window.location.search);
  const liveGatewayUrl = urlParams.get('knxWs');
  const initialTransport = liveGatewayUrl
    ? new WebSocketKNXGatewayTransport(liveGatewayUrl)
    : new LoopbackSimulationTransport();

  const knx = new KNXPropertyBusController(initialTransport);
  const hub = new SmartHomeHub(knx);
  const annotationStore = new SceneAnnotationStore();

  await loading.setProgress('Building the house, barn and grounds…', 0.25);

  const property3D = new CroxPropertyScene(canvasEl, (userData) => {
    if (userData.isKNXSwitch) {
      knx.handleSwitchShortPress(userData.switchDirection ?? 'up', userData.switchLocation);
    } else if (userData.isCourtyardSwitch) {
      knx.handleCourtyardSwitchShortPress(
        userData.switchDirection ?? 'up',
        userData.switchPa ?? COURTYARD_SWITCH_PA
      );
    } else if (userData.isUtilitySwitch) {
      knx.handleUtilitySwitchToggle(userData.switchPa ?? '1.1.11');
    } else if (userData.isKitchenMotionSensor) {
      knx.toggleKitchenMotion();
    } else if (userData.isUtilityMotionSensor) {
      knx.toggleUtilityMotion();
    } else if (userData.roomMotionSensorId) {
      knx.toggleRoomMotion(userData.roomMotionSensorId);
    } else if (userData.isFrameTV) {
      knx.cycleTvArt(true, '1.1.12');
    } else if (userData.isBifoldDoor) {
      const isOpen = property3D.toggleBifolds();
      const bifoldStateLabel = document.getElementById('bifold-state-label');
      if (bifoldStateLabel) {
        bifoldStateLabel.textContent = isOpen ? 'Bifolds: Open' : 'Bifolds: Closed';
      }
    } else if (userData.isCarGate) {
      knx.toggleCarGates(GATE_PA);
    } else if (userData.isUniFiCamera) {
      hub.protect.toggleAllFrustums();
      property3D.syncUniFiSecurity3D(
        hub.protect.getCameras(),
        hub.access.getAccessPoints()
      );
    } else if (userData.isUniFiAccessReader && userData.accessEntityId) {
      hub.triggerAccessUnlock(userData.accessEntityId, 'NFC Card');
    } else if (userData.circuitId) {
      knx.toggleCircuit(
        userData.circuitId,
        userData.switchPa,
        userData.switchLocation,
        userData.switchDirection
      );
    }
  });

  await loading.setProgress('Preparing controls…', 0.8);

  // Legacy controllers keep driving their DOM, which now lives in the developer drawer.
  const hud = new HudController(knx, property3D, hub);
  const annotator = new AnnotatorHudController(property3D, annotationStore, () => {
    hud.syncFloorModeUI();
  });
  new UsdStageHudController(property3D, () => {
    hud.syncFloorModeUI();
  });

  const shell = mountAppShell(
    {
      scene: property3D,
      knx,
      annotations: annotationStore,
      annotator,
      focus: new FocusController(createCroxFarmhouseFocusRooms()),
      legacy: {
        syncFloorModeUI: () => hud.syncFloorModeUI(),
        syncWalkthroughUI: () => hud.syncWalkthroughUI(),
      },
      gatePa: GATE_PA,
      kitchenScenePa: KITCHEN_SWITCH_PA,
    },
    shellRoot
  );

  property3D.applyKNXLightLevels(knx.getLiveLevels());
  knx.recallScene(0, KITCHEN_SWITCH_PA);

  window.croxTwin = {
    hub,
    knx,
    scene: property3D,
    annotations: annotationStore,
    connectToGateway: (wsEndpointUrl: string) => knx.connectToGateway(wsEndpointUrl),
    useSimulation: () => knx.useSimulationTransport(),
    injectTelegram: (frameOrHex: string | InboundKNXFrame) => knx.ingestExternalFrame(frameOrHex),
  };

  let lastFrameTime = performance.now();
  let firstFrame = true;
  function animate(now: number): void {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (knx.stepDimming(dt)) {
      property3D.applyKNXLightLevels(knx.getLiveLevels());
      shell.pushLiveLevels();
    }
    property3D.update(dt);
    if (firstFrame) {
      firstFrame = false;
      loading.finish();
    }
  }

  await loading.setProgress('Ready', 1);
  requestAnimationFrame(animate);
}

boot().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  getLoadingScreen().fail(`Something went wrong while loading: ${message}`);
  console.error(err);
});
