import { SmartHomeHub } from './core/smart-home-hub.ts';
import {
  KNXPropertyBusController,
  LoopbackSimulationTransport,
  WebSocketKNXGatewayTransport,
} from './integrations/knx/index.ts';
import { SceneAnnotationStore } from './engine/annotation/annotation-system.ts';
import { CroxPropertyScene } from './homes/crox-farmhouse/crox-property-scene.ts';
import type { InboundKNXFrame } from './types/knx.ts';
import { FocusController } from './engine/focus/focus-controller.ts';
import {
  createCroxFarmhouseFocusRooms,
  createCroxFarmhouseHudModel,
} from './homes/crox-farmhouse/hud-model.ts';
import { AnnotatorHudController } from './ui/annotator-hud.ts';
import { FocusHudController } from './ui/focus/focus-hud.ts';
import { HudController } from './ui/hud.ts';
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

const canvasEl = document.getElementById('three-canvas');
if (!(canvasEl instanceof HTMLCanvasElement)) {
  throw new Error('Canvas element #three-canvas not found');
}

// Automatically connect to a live KNXnet/IP WebSocket gateway if ?knxWs=ws://... is provided
const urlParams = new URLSearchParams(window.location.search);
const liveGatewayUrl = urlParams.get('knxWs');
const initialTransport = liveGatewayUrl
  ? new WebSocketKNXGatewayTransport(liveGatewayUrl)
  : new LoopbackSimulationTransport();

const knx = new KNXPropertyBusController(initialTransport);
const hub = new SmartHomeHub(knx);
const annotationStore = new SceneAnnotationStore();

const property3D = new CroxPropertyScene(canvasEl, (userData) => {
  if (userData.isKNXSwitch) {
    knx.handleSwitchShortPress(userData.switchDirection ?? 'up', userData.switchLocation);
  } else if (userData.isCourtyardSwitch) {
    knx.handleCourtyardSwitchShortPress(
      userData.switchDirection ?? 'up',
      userData.switchPa ?? '1.1.14'
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
    knx.toggleCarGates('1.1.22');
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

const hud = new HudController(knx, property3D, hub);

const hudBodyEl = document.getElementById('hud-body');
if (!(hudBodyEl instanceof HTMLElement)) {
  throw new Error('HUD body element #hud-body not found');
}
const focus = new FocusController(createCroxFarmhouseFocusRooms());
new FocusHudController({
  knx,
  scene: property3D,
  model: createCroxFarmhouseHudModel(),
  focus,
  hudBody: hudBodyEl,
  propertyPresetId: 'courtyardGates',
  floorPresetIds: { ground: 'top', first: 'upstairs' },
  gatePa: '1.1.22',
  courtyardSwitchPa: '1.1.14',
  onFloorViewModeChanged: () => hud.syncFloorModeUI(),
});
new AnnotatorHudController(property3D, annotationStore, () => {
  hud.syncFloorModeUI();
});
new UsdStageHudController(property3D, () => {
  hud.syncFloorModeUI();
});

property3D.applyKNXLightLevels(knx.getLiveLevels());
knx.recallScene(0, '1.1.10');

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
function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  if (knx.stepDimming(dt)) {
    property3D.applyKNXLightLevels(knx.getLiveLevels());
  }
  property3D.update(dt);
}
requestAnimationFrame(animate);
