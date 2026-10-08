import { SmartHomeHub } from '../integrations/smart-home-hub.ts';
import { createTwinRuntime } from './create-twin-api.ts';
import type { TwinApi } from './twin-api.ts';
import {
  KNXPropertyBusController,
  LoopbackSimulationTransport,
  WebSocketKNXGatewayTransport,
} from '../integrations/knx/index.ts';
import { SceneAnnotationStore } from '../engine/annotation/annotation-system.ts';
import { CroxPropertyScene } from '../homes/crox-farmhouse/crox-property-scene.ts';
import { CROX_FARMHOUSE_USD_OVERRIDE_LAYER } from '../homes/crox-farmhouse/usd/layout-overrides.ts';
import type { InboundKNXFrame } from '../core/types/knx.ts';
import type { InteractiveUserData } from '../core/types/scene.ts';
import { mountDevTools, DevDrawer } from '../ui/dev/mount-dev-tools.ts';
import { getLoadingScreen } from '../ui/shell/loading.ts';
import { mountAppShell } from '../ui/shell/mount-shell.tsx';

/** `window.croxTwin` — console / automation handle (kept stable across refactors). */
export interface CroxDigitalTwinGlobalAPI {
  readonly hub: SmartHomeHub;
  readonly knx: KNXPropertyBusController;
  readonly scene: CroxPropertyScene;
  readonly annotations: SceneAnnotationStore;
  /** UI-facing facade (same object the shell uses). */
  readonly api: TwinApi;
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
const UTILITY_SWITCH_PA = '1.1.11';
const FRAME_TV_PA = '1.1.12';

function requireElement<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const el = document.getElementById(id);
  if (!(el instanceof ctor)) throw new Error(`Element #${id} not found`);
  return el;
}

/**
 * Composition root: builds the KNX bus, smart-home hub and 3D scene, wraps them
 * in the TwinApi runtime, mounts the UI shell + developer tools and starts the
 * frame loop.
 */
export async function bootstrap(): Promise<void> {
  const loading = getLoadingScreen();
  const canvasEl = requireElement('three-canvas', HTMLCanvasElement);
  const shellRoot = requireElement('shell-root', HTMLElement);

  await loading.setProgress('Connecting to the smart-home bus…', 0.1);

  // Connect to a live KNXnet/IP WebSocket gateway when ?knxWs=ws://... is provided.
  const liveGatewayUrl = new URLSearchParams(window.location.search).get('knxWs');
  const knx = new KNXPropertyBusController(
    liveGatewayUrl ? new WebSocketKNXGatewayTransport(liveGatewayUrl) : new LoopbackSimulationTransport()
  );
  const hub = new SmartHomeHub(knx);
  const annotations = new SceneAnnotationStore();

  await loading.setProgress('Building the house, barn and grounds…', 0.25);

  const syncUniFi = (): void => {
    scene.syncUniFiSecurity3D(hub.protect.getCameras(), hub.access.getAccessPoints());
  };

  const onObjectInteraction = (userData: InteractiveUserData): void => {
    if (userData.isKNXSwitch) {
      knx.handleSwitchShortPress(userData.switchDirection ?? 'up', userData.switchLocation);
    } else if (userData.isCourtyardSwitch) {
      knx.handleCourtyardSwitchShortPress(userData.switchDirection ?? 'up', userData.switchPa ?? COURTYARD_SWITCH_PA);
    } else if (userData.isUtilitySwitch) {
      knx.handleUtilitySwitchToggle(userData.switchPa ?? UTILITY_SWITCH_PA);
    } else if (userData.isKitchenMotionSensor) {
      knx.toggleKitchenMotion();
    } else if (userData.isUtilityMotionSensor) {
      knx.toggleUtilityMotion();
    } else if (userData.roomMotionSensorId) {
      knx.toggleRoomMotion(userData.roomMotionSensorId);
    } else if (userData.isFrameTV) {
      knx.cycleTvArt(true, FRAME_TV_PA);
    } else if (userData.isBifoldDoor) {
      scene.toggleBifolds();
    } else if (userData.isCarGate) {
      knx.toggleCarGates(GATE_PA);
    } else if (userData.isUniFiCamera) {
      hub.protect.toggleAllFrustums();
    } else if (userData.isUniFiAccessReader && userData.accessEntityId) {
      hub.triggerAccessUnlock(userData.accessEntityId, 'NFC Card');
    } else if (userData.circuitId) {
      knx.toggleCircuit(userData.circuitId, userData.switchPa, userData.switchLocation, userData.switchDirection);
    }
  };
  const scene = new CroxPropertyScene(canvasEl, onObjectInteraction);

  // UniFi Protect / Access state → 3D cameras, frustums and readers.
  hub.subscribe((ev) => {
    if (ev.type === 'entityChanged') syncUniFi();
  });
  syncUniFi();

  const runtime = createTwinRuntime({
    scene,
    knx,
    annotations,
    gatePa: GATE_PA,
    kitchenScenePa: KITCHEN_SWITCH_PA,
    courtyardSwitchPa: COURTYARD_SWITCH_PA,
  });
  const { api } = runtime;

  await loading.setProgress('Preparing controls…', 0.8);

  mountDevTools({ scene, knx, hub, api, usdOverrideLayer: CROX_FARMHOUSE_USD_OVERRIDE_LAYER });
  mountAppShell({ api, devDrawer: DevDrawer }, shellRoot);

  knx.recallScene(0, KITCHEN_SWITCH_PA);

  window.croxTwin = {
    hub,
    knx,
    scene,
    annotations,
    api,
    connectToGateway: (wsEndpointUrl: string) => knx.connectToGateway(wsEndpointUrl),
    useSimulation: () => knx.useSimulationTransport(),
    injectTelegram: (frameOrHex: string | InboundKNXFrame) => knx.ingestExternalFrame(frameOrHex),
  };

  let lastFrameTime = performance.now();
  let firstFrame = true;
  const animate = (now: number): void => {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    runtime.tick(dt);
    if (firstFrame) {
      firstFrame = false;
      loading.finish();
    }
  };

  await loading.setProgress('Ready', 1);
  requestAnimationFrame(animate);
}
