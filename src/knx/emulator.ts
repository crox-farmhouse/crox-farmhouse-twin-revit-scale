import type {
  CircuitConfig,
  CircuitId,
  CircuitLevels,
  DeviceParameters,
  InboundKNXFrame,
  KNXBusEvent,
  KNXEventListener,
  KNXTelegram,
  KNXTransportMode,
  KNXTransportStatus,
  RoomMotionSensorId,
  ScenePreset,
  TelegramEmitInput,
} from '../types/knx.ts';
import type { RoomZoneId } from '../types/topology.ts';
import { compileEEPROMBytes } from './addressing.ts';
import { CIRCUITS, DEFAULT_SCENES, ROOM_AUTOMATION_CONFIG, SCENE_CIRCUIT_IDS } from './constants.ts';
import { RoomAutomation, type RoomMotionSensorConfig } from './room-automation.ts';
import {
  buildTP1FrameHex,
  decodeDpt1,
  decodeDpt17Scene,
  decodeDpt18SceneControl,
  decodeDpt5Scaling,
  decodeDpt9Float,
  encodeDpt1,
  encodeDpt17Scene,
  encodeDpt18SceneControl,
  encodeDpt5Scaling,
  encodeDpt9Float,
  parseTP1FrameHex,
} from './dpt-codec.ts';
import {
  LoopbackSimulationTransport,
  WebSocketKNXGatewayTransport,
  type KNXBusTransport,
} from './transport.ts';

export const NIGHT_WALK_UPLIGHTS_PCT = 10;
export const NIGHT_WALK_SPOTLIGHTS_PCT = 10;
export const NIGHT_WALK_UNDER_CABINET_PCT = 20;
export const NIGHT_WALK_ABOVE_CABINET_PCT = 20;
export const NIGHT_WALK_UTILITY_PCT = 15;

export const TV_ARTWORKS: readonly string[] = [
  'Tur Langton Sunset',
  'St Ives Modernist',
  'Botanical Meadow',
  'Nocturne in Blue & Gold',
];

/**
 * Crox Farmhouse (Main House + Annex) KNX TP1 / cEMI Bus Controller & EEPROM Emulator.
 *
 * Designed to operate seamlessly in either:
 * - In-browser Simulation Mode (`LoopbackSimulationTransport`)
 * - Live Physical Bus Mode (`WebSocketKNXGatewayTransport`) connected to a KNXnet/IP interface.
 */
export class KNXPropertyBusController {
  public static readonly TV_ART_CYCLE_INTERVAL_SEC = 8.0;
  public static readonly CAR_GATE_TRAVEL_SEC = 10.0;

  private transport: KNXBusTransport;
  private unsubscribeTransportRx: (() => void) | null = null;
  private unsubscribeTransportStatus: (() => void) | null = null;

  /** Fast O(1) lookup tables mapping Group Addresses (`1/1/x`, `1/2/x`, `1/3/x`) to CircuitConfig */
  private readonly gaSwitchToCircuit = new Map<string, CircuitConfig>();
  private readonly gaValueToCircuit = new Map<string, CircuitConfig>();
  private readonly gaStatusToCircuit = new Map<string, CircuitConfig>();

  private flashedParams: DeviceParameters = {
    holdThresholdMs: 600,
    shortPressMode: 'cycle3',
    wakeBehavior: 'first',
    rampSpeedSec: 0.9,
    luxThreshold: 100,
  };

  private stagedParams: DeviceParameters = { ...this.flashedParams };
  private isDirty = false;

  private readonly scenes: ScenePreset[] = DEFAULT_SCENES.map((sc) => ({
    ...sc,
    levels: { ...sc.levels },
    ...(sc.outdoorLevels ? { outdoorLevels: { ...sc.outdoorLevels } } : {}),
    ...(sc.auxiliaryLevels ? { auxiliaryLevels: { ...sc.auxiliaryLevels } } : {}),
  }));

  private activeSceneIndex = 0;
  private lastActiveSceneIndex = 0;
  private utilitySwitchOn = true;
  private lastUtilityLevel = 100;
  // 0 = Off, 1 = Both (Festoons 85% + Lamp Post 90%), 2 = Festoons Only (95%), 3 = Lamp Post Only (95%)
  private courtyardModeIndex = 1;

  // Motorized Dual-Leaf Front Car Entrance Gates (PA 1.1.22 · GA 1/5/1 & 1/5/2 · 10.0s synchronized travel)
  private carGatesOpen = false;
  private carGatesProgress = 0;
  private carGatesLastNotifiedPct = 0;

  private kitchenMotionDetected = true;
  private utilityMotionDetected = true;
  private ambientLux = 38; // Default Dusk = 38 lx (< 100 lx threshold)

  private tvArtIndex = 0;
  private tvArtSlideTimerSec = 0;

  private readonly targetLevels: CircuitLevels = {
    ...this.scenes[0]!.levels,
    utilitySpotlights: 100,
    familyRoomSpots: 85,
    diningPendant: 85,
    diningPictureLight: 85,
    diningFairyLights: 100,
    bootLobbyPendant: 85,
    hallPendant: 85,
    frontRoomPendant: 85,
    entranceHallPendant: 85,
    livingRoomPendant: 85,
    studyPendant: 80,
    mainBedroomPendant: 80,
    familyBathroomPendant: 85,
    upperLandingPendant: 85,
    bedroom2Pendant: 80,
    bedroom3Pendant: 80,
    bedroom4Pendant: 80,
    wineCellarLeds: 70,
    cloakroomWcLights: 90,
    entranceHallUplights: 60,
    courtyardFestoons: 85,
    reclaimedLampPost: 90,
  };
  private readonly liveLevels: CircuitLevels = {
    ...this.scenes[0]!.levels,
    utilitySpotlights: 100,
    familyRoomSpots: 85,
    diningPendant: 85,
    diningPictureLight: 85,
    diningFairyLights: 100,
    bootLobbyPendant: 85,
    hallPendant: 85,
    frontRoomPendant: 85,
    entranceHallPendant: 85,
    livingRoomPendant: 85,
    studyPendant: 80,
    mainBedroomPendant: 80,
    familyBathroomPendant: 85,
    upperLandingPendant: 85,
    bedroom2Pendant: 80,
    bedroom3Pendant: 80,
    bedroom4Pendant: 80,
    wineCellarLeds: 70,
    cloakroomWcLights: 90,
    entranceHallUplights: 60,
    courtyardFestoons: 85,
    reclaimedLampPost: 90,
  };

  /** Night-walk dim and PIR-driven circuits for rooms other than the kitchen / utility. */
  private readonly roomAutomation = new RoomAutomation(ROOM_AUTOMATION_CONFIG);

  private telegrams: KNXTelegram[] = [];
  private nextTelegramId = 1;
  private readonly listeners = new Set<KNXEventListener>();

  public constructor(initialTransport?: KNXBusTransport) {
    for (const circuit of CIRCUITS) {
      this.gaSwitchToCircuit.set(circuit.gaSwitch, circuit);
      this.gaValueToCircuit.set(circuit.gaValue, circuit);
      this.gaStatusToCircuit.set(circuit.gaStatus, circuit);
    }

    this.transport = initialTransport ?? new LoopbackSimulationTransport();
    this.bindTransport(this.transport);
  }

  private bindTransport(nextTransport: KNXBusTransport): void {
    this.unsubscribeTransportRx?.();
    this.unsubscribeTransportStatus?.();
    this.transport = nextTransport;

    this.unsubscribeTransportRx = this.transport.onReceiveFrame((frameOrHex) => {
      this.ingestExternalFrame(frameOrHex);
    });

    this.unsubscribeTransportStatus = this.transport.onStatusChange((status, mode, endpointUrl) => {
      this.notify({
        type: 'transportStatus',
        mode,
        status,
        ...(endpointUrl ? { endpointUrl } : {}),
      });
    });

    void this.transport.connect();
  }

  /**
   * Connects the Digital Twin directly to a live WebSocket KNXnet/IP gateway
   * (e.g. `ws://localhost:8765/knx` or `wss://crox-knx.local/cemi`).
   */
  public async connectToGateway(endpointUrl: string): Promise<void> {
    this.transport.disconnect();
    const wsTransport = new WebSocketKNXGatewayTransport(endpointUrl);
    this.bindTransport(wsTransport);
  }

  /**
   * Switches back to the in-browser KNX TP1 simulation transport.
   */
  public useSimulationTransport(): void {
    this.transport.disconnect();
    this.bindTransport(new LoopbackSimulationTransport());
  }

  public getTransportMode(): KNXTransportMode {
    return this.transport.mode;
  }

  public getTransportStatus(): KNXTransportStatus {
    return this.transport.status;
  }

  public getTransportEndpoint(): string | undefined {
    return this.transport.endpointUrl;
  }

  public getCircuitsForZone(zoneId: RoomZoneId): readonly CircuitConfig[] {
    return CIRCUITS.filter((c) => c.zoneId === zoneId);
  }

  /**
   * Ingests a raw KNX TP1/cEMI hex frame or structured frame received from the physical KNX bus
   * (or injected via developer tools) and updates the Digital Twin's live state.
   */
  public ingestExternalFrame(frameOrHex: string | InboundKNXFrame): void {
    let src = '1.1.1';
    let dst = '';
    let isGroup = true;
    let apci = 'A_GroupValue_Write';
    let payloadBytes: readonly number[] = [0x00, 0x80];
    let dptHint: string | undefined;
    let summaryHint: string | undefined;

    if (typeof frameOrHex === 'string') {
      const parsed = parseTP1FrameHex(frameOrHex);
      if (!parsed) return;
      src = parsed.src;
      dst = parsed.dst;
      isGroup = parsed.isGroup;
      apci = parsed.apci;
      payloadBytes = parsed.payloadBytes;
    } else {
      src = frameOrHex.src ?? '1.1.1';
      dst = frameOrHex.dst;
      isGroup = frameOrHex.isGroup ?? true;
      apci = frameOrHex.apci ?? 'A_GroupValue_Write';
      payloadBytes = frameOrHex.payloadBytes ?? [0x00, 0x80];
      dptHint = frameOrHex.dpt;
      summaryHint = frameOrHex.summary;
    }

    if (!isGroup) {
      this.emitTelegram({
        src,
        dst,
        isGroup: false,
        apci,
        dpt: dptHint ?? 'Mgmt',
        summary: summaryHint ?? `External P2P Frame (${apci})`,
        payloadBytes,
        fromExternalBus: true,
      });
      return;
    }

    // 1. Check absolute dimming value or status feedback GAs (1/2/x, 1/3/x — DPT 5.001)
    const valCircuit = this.gaValueToCircuit.get(dst) ?? this.gaStatusToCircuit.get(dst);
    if (valCircuit) {
      const pct = decodeDpt5Scaling(payloadBytes);
      this.targetLevels[valCircuit.id] = pct;
      this.roomAutomation.noteManualLevel(valCircuit.id, pct);
      if (valCircuit.id === 'utilitySpotlights') {
        this.utilitySwitchOn = pct > 0;
        if (pct > NIGHT_WALK_UTILITY_PCT) {
          this.lastUtilityLevel = pct;
        }
      }
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '5.001',
        summary: summaryHint ?? `[RX Bus] ${valCircuit.shortName} → ${pct}%`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 2. Check 1-bit switching GAs (1/1/x — DPT 1.001)
    const swCircuit = this.gaSwitchToCircuit.get(dst);
    if (swCircuit) {
      const isOn = decodeDpt1(payloadBytes);
      const pct = isOn ? 100 : 0;
      this.targetLevels[swCircuit.id] = pct;
      this.roomAutomation.noteManualLevel(swCircuit.id, pct);
      if (swCircuit.id === 'utilitySpotlights') {
        this.utilitySwitchOn = isOn;
      }
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '1.001',
        summary: summaryHint ?? `[RX Bus] ${swCircuit.shortName} Switch → ${isOn ? 'ON' : 'OFF'}`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 3. Master Off / Night-Walk Dim (1/0/0 — DPT 1.001)
    if (dst === '1/0/0') {
      this.activeSceneIndex = -1;
      this.utilitySwitchOn = false;
      this.courtyardModeIndex = 0;
      this.targetLevels.courtyardFestoons = 0;
      this.targetLevels.reclaimedLampPost = 0;
      this.targetLevels.familyRoomSpots = 0;
      this.targetLevels.diningPendant = 0;
      this.targetLevels.diningPictureLight = 0;
      this.targetLevels.diningFairyLights = 0;
      this.applyKitchenOffStateLevels();
      this.applyUtilityOffStateLevels();
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '1.001',
        summary: summaryHint ?? '[RX Bus] Master Off / Night-Walk Standby',
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 4. Scene Recall / Scene Store (1/0/1 — DPT 17.001 / 18.001)
    if (dst === '1/0/1') {
      const { store, sceneIndex } = decodeDpt18SceneControl(payloadBytes);
      if (store) {
        this.saveCurrentLevelsToActiveScene(sceneIndex, src);
      } else {
        const scene = this.scenes[sceneIndex];
        if (scene) {
          this.activeSceneIndex = sceneIndex;
          for (const id of SCENE_CIRCUIT_IDS) {
            this.targetLevels[id] = scene.levels[id];
          }
          if (scene.outdoorLevels) {
            this.targetLevels.courtyardFestoons = scene.outdoorLevels.courtyardFestoons;
            this.targetLevels.reclaimedLampPost = scene.outdoorLevels.reclaimedLampPost;
          }
          if (scene.auxiliaryLevels) {
            if (scene.auxiliaryLevels.utilitySpotlights !== undefined) {
              this.targetLevels.utilitySpotlights = scene.auxiliaryLevels.utilitySpotlights;
              this.utilitySwitchOn =
                scene.auxiliaryLevels.utilitySpotlights > NIGHT_WALK_UTILITY_PCT;
            }
            if (scene.auxiliaryLevels.familyRoomSpots !== undefined) {
              this.targetLevels.familyRoomSpots = scene.auxiliaryLevels.familyRoomSpots;
            }
          }
          this.emitTelegram({
            src,
            dst,
            isGroup: true,
            apci,
            dpt: dptHint ?? '17.001',
            summary: summaryHint ?? `[RX Bus] Recall ${scene.code}: "${scene.name}"`,
            payloadBytes,
            fromExternalBus: true,
          });
          this.notify({ type: 'stateChange', reason: 'externalBusSync' });
        }
      }
      return;
    }

    // 5. Master Full On (1/0/2 — DPT 5.001)
    if (dst === '1/0/2') {
      this.activeSceneIndex = 99;
      for (const id of SCENE_CIRCUIT_IDS) {
        this.targetLevels[id] = 100;
      }
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '5.001',
        summary: summaryHint ?? '[RX Bus] Master Full On (100%)',
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 6. Kitchen PIR Occupancy (1/4/1 — DPT 1.018)
    if (dst === '1/4/1') {
      this.kitchenMotionDetected = decodeDpt1(payloadBytes);
      if (this.activeSceneIndex === -1) {
        this.applyKitchenOffStateLevels();
      }
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '1.018',
        summary:
          summaryHint ??
          `[RX Bus] Kitchen PIR → ${this.kitchenMotionDetected ? 'Motion' : 'Vacant'}`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 7. Ambient Lux Sensor (1/4/2 — DPT 9.004)
    if (dst === '1/4/2') {
      this.ambientLux = Math.max(0, decodeDpt9Float(payloadBytes));
      if (this.activeSceneIndex === -1) {
        this.applyKitchenOffStateLevels();
      }
      if (!this.utilitySwitchOn) {
        this.applyUtilityOffStateLevels();
      }
      this.applyRoomNightWalkLevels();
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '9.004',
        summary: summaryHint ?? `[RX Bus] Ambient Lux → ${this.ambientLux} lx`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 8. Utility PIR Occupancy (1/4/3 — DPT 1.018)
    if (dst === '1/4/3') {
      this.utilityMotionDetected = decodeDpt1(payloadBytes);
      if (!this.utilitySwitchOn) {
        this.applyUtilityOffStateLevels();
      }
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '1.018',
        summary:
          summaryHint ??
          `[RX Bus] Utility PIR → ${this.utilityMotionDetected ? 'Motion' : 'Vacant'}`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 8b. Room PIR Occupancy sensors (Boot Lobby 1/4/5, Cloakroom WC 1/4/6 — DPT 1.018)
    const roomSensor = this.roomAutomation.getMotionSensorByGa(dst);
    if (roomSensor) {
      const detected = decodeDpt1(payloadBytes);
      this.roomAutomation.setMotionDetected(roomSensor.id, detected);
      this.applyRoomMotionLevels(roomSensor.id);
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '1.018',
        summary: summaryHint ?? `[RX Bus] ${roomSensor.name} → ${detected ? 'Motion' : 'Vacant'}`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 9. Frame TV Art Index (1/4/4 — DPT 17.001)
    if (dst === '1/4/4') {
      const idx = decodeDpt17Scene(payloadBytes);
      this.tvArtIndex = idx % TV_ARTWORKS.length;
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '17.001',
        summary: summaryHint ?? `[RX Bus] Frame TV Art → "${this.getTvArtTitle()}"`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 10. Motorized Front Car Gates Open/Close Command (1/5/1 — DPT 1.001)
    if (dst === '1/5/1') {
      this.carGatesOpen = decodeDpt1(payloadBytes);
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '1.001',
        summary:
          summaryHint ??
          `[RX Bus] Front Car Gates → ${this.carGatesOpen ? 'OPENING (10s synchronized)' : 'CLOSING (10s synchronized)'}`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
      return;
    }

    // 11. Motorized Front Car Gates Position / Status (1/5/2 — DPT 5.001)
    if (dst === '1/5/2') {
      const pct = decodeDpt5Scaling(payloadBytes);
      this.carGatesOpen = pct >= 50;
      this.emitTelegram({
        src,
        dst,
        isGroup: true,
        apci,
        dpt: dptHint ?? '5.001',
        summary:
          summaryHint ??
          `[RX Bus] Front Car Gates Position → ${pct}% (${this.carGatesOpen ? 'OPEN' : 'CLOSED'})`,
        payloadBytes,
        fromExternalBus: true,
      });
      this.notify({ type: 'stateChange', reason: 'externalBusSync' });
    }
  }

  public subscribe(fn: KNXEventListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(event: KNXBusEvent): void {
    for (const fn of this.listeners) {
      fn(event);
    }
  }

  public getFlashedParams(): Readonly<DeviceParameters> {
    return this.flashedParams;
  }

  public getStagedParams(): Readonly<DeviceParameters> {
    return this.stagedParams;
  }

  public getIsDirty(): boolean {
    return this.isDirty;
  }

  public getScenes(): readonly ScenePreset[] {
    return this.scenes;
  }

  public getActiveSceneIndex(): number {
    return this.activeSceneIndex;
  }

  public getTargetLevels(): Readonly<CircuitLevels> {
    return this.targetLevels;
  }

  public getLiveLevels(): Readonly<CircuitLevels> {
    return this.liveLevels;
  }

  public getTelegrams(): readonly KNXTelegram[] {
    return this.telegrams;
  }

  public clearTelegrams(): void {
    this.telegrams = [];
  }

  public getKitchenMotionDetected(): boolean {
    return this.kitchenMotionDetected;
  }

  public getUtilityMotionDetected(): boolean {
    return this.utilityMotionDetected;
  }

  public getAmbientLux(): number {
    return this.ambientLux;
  }

  public isBelowLuxThreshold(): boolean {
    return this.ambientLux < this.flashedParams.luxThreshold;
  }

  public isUtilitySwitchOn(): boolean {
    return this.utilitySwitchOn;
  }

  public isKitchenNightDimActive(): boolean {
    return (
      this.activeSceneIndex === -1 &&
      this.kitchenMotionDetected &&
      this.isBelowLuxThreshold() &&
      (this.targetLevels.underCabinet > 0 ||
        this.targetLevels.aboveCabinet > 0 ||
        this.targetLevels.bifoldUplights > 0 ||
        this.targetLevels.spotlights > 0)
    );
  }

  public isUtilityNightDimActive(): boolean {
    return (
      !this.utilitySwitchOn &&
      this.utilityMotionDetected &&
      this.isBelowLuxThreshold() &&
      this.targetLevels.utilitySpotlights > 0
    );
  }

  public isAnyKitchenLightOn(): boolean {
    return SCENE_CIRCUIT_IDS.some((id) => this.targetLevels[id] > 0);
  }

  public isUtilityLightOn(): boolean {
    return this.targetLevels.utilitySpotlights > 0;
  }

  public isCourtyardLightOn(): boolean {
    return (
      this.targetLevels.courtyardFestoons > 0 ||
      this.targetLevels.reclaimedLampPost > 0
    );
  }

  public getCourtyardModeLabel(): string {
    const f = this.targetLevels.courtyardFestoons;
    const lp = this.targetLevels.reclaimedLampPost;
    if (f > 0 && lp > 0) {
      return `Festoons ${f}% + Lamp Post ${lp}%`;
    }
    if (f > 0) {
      return `Festoons Only (${f}%)`;
    }
    if (lp > 0) {
      return `Lamp Post Only (${lp}%)`;
    }
    return 'OFF (0%)';
  }

  public isCarGatesOpen(): boolean {
    return this.carGatesOpen;
  }

  public getCarGatesProgress(): number {
    return this.carGatesProgress;
  }

  public isCarGatesMoving(): boolean {
    const target = this.carGatesOpen ? 1 : 0;
    return Math.abs(target - this.carGatesProgress) > 0.001;
  }

  public getCarGatesStatusLabel(): string {
    const pct = Math.round(this.carGatesProgress * 100);
    if (this.isCarGatesMoving()) {
      return this.carGatesOpen ? `OPENING · ${pct}% (10s)` : `CLOSING · ${pct}% (10s)`;
    }
    return this.carGatesOpen ? 'OPEN · 100%' : 'CLOSED · 0%';
  }

  public setCarGatesOpen(open: boolean, emitBus = true, sourcePa = '1.1.22'): boolean {
    this.carGatesOpen = open;

    if (emitBus) {
      const prefix = sourcePa === '1.1.2' ? 'AI Gateway → ' : '';
      this.emitTelegram({
        src: sourcePa,
        dst: '1/5/1',
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '1.001',
        summary: `${prefix}Front Car Gates (Dual-Leaf) → ${
          open ? 'OPENING (10.0s travel)' : 'CLOSING (10.0s travel)'
        }`,
        payloadBytes: encodeDpt1(open),
      });
    }

    this.notify({ type: 'stateChange', reason: 'carGateChange' });
    return this.carGatesOpen;
  }

  public toggleCarGates(sourcePa = '1.1.22'): boolean {
    return this.setCarGatesOpen(!this.carGatesOpen, true, sourcePa);
  }

  public isAnyLightOn(): boolean {
    return Object.values(this.targetLevels).some((v) => v > 0);
  }

  private applyKitchenOffStateLevels(): void {
    this.targetLevels.islandPendants = 0;
    this.targetLevels.sittingPendants = 0;

    if (this.kitchenMotionDetected && this.isBelowLuxThreshold()) {
      this.targetLevels.bifoldUplights = NIGHT_WALK_UPLIGHTS_PCT;
      this.targetLevels.spotlights = NIGHT_WALK_SPOTLIGHTS_PCT;
      this.targetLevels.underCabinet = NIGHT_WALK_UNDER_CABINET_PCT;
      this.targetLevels.aboveCabinet = NIGHT_WALK_ABOVE_CABINET_PCT;
    } else {
      this.targetLevels.bifoldUplights = 0;
      this.targetLevels.spotlights = 0;
      this.targetLevels.underCabinet = 0;
      this.targetLevels.aboveCabinet = 0;
    }
  }

  private applyUtilityOffStateLevels(): void {
    if (this.utilityMotionDetected && this.isBelowLuxThreshold()) {
      this.targetLevels.utilitySpotlights = NIGHT_WALK_UTILITY_PCT;
    } else {
      this.targetLevels.utilitySpotlights = 0;
    }
  }

  private applyAutomaticLevels(levels: Partial<Record<CircuitId, number>>): void {
    for (const circuit of CIRCUITS) {
      const level = levels[circuit.id];
      if (level !== undefined) {
        this.targetLevels[circuit.id] = level;
      }
    }
  }

  private applyRoomNightWalkLevels(): void {
    this.applyAutomaticLevels(
      this.roomAutomation.computeNightWalkLevels(this.isBelowLuxThreshold())
    );
  }

  private applyRoomMotionLevels(sensorId: RoomMotionSensorId): void {
    this.applyAutomaticLevels(this.roomAutomation.computeMotionCircuitLevels(sensorId));
    this.applyRoomNightWalkLevels();
  }

  public getRoomMotionSensors(): readonly RoomMotionSensorConfig[] {
    return this.roomAutomation.getMotionSensors();
  }

  public getRoomMotionDetected(sensorId: RoomMotionSensorId): boolean {
    return this.roomAutomation.isMotionDetected(sensorId);
  }

  /** True when a room night-walk circuit (hall, boot lobby) is switched off and idling dim. */
  public isRoomNightDimActive(circuitId: CircuitId): boolean {
    return this.roomAutomation.isNightDimActive(circuitId, this.isBelowLuxThreshold());
  }

  public setRoomMotionDetected(sensorId: RoomMotionSensorId, detected: boolean, emitBus = true): void {
    const sensor = this.roomAutomation.getMotionSensor(sensorId);
    if (!sensor) return;
    this.roomAutomation.setMotionDetected(sensorId, detected);
    this.applyRoomMotionLevels(sensorId);

    if (emitBus) {
      const switched = this.roomAutomation
        .getMotionCircuitRules(sensorId)
        .map((rule) => {
          const circuit = CIRCUITS.find((c) => c.id === rule.circuitId);
          return `${circuit?.shortName ?? rule.circuitId} ${this.targetLevels[rule.circuitId]}%`;
        })
        .join(', ');
      this.emitTelegram({
        src: sensor.pa,
        dst: sensor.ga,
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '1.018',
        summary: `${sensor.name} (${sensor.pa}) → ${detected ? 'Motion Detected' : 'No Motion (Vacant)'}${
          switched ? ` → ${switched}` : ''
        }`,
        payloadBytes: encodeDpt1(detected),
      });
    }

    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public toggleRoomMotion(sensorId: RoomMotionSensorId): boolean {
    const next = !this.roomAutomation.isMotionDetected(sensorId);
    this.setRoomMotionDetected(sensorId, next);
    return next;
  }

  public emitTelegram(input: TelegramEmitInput): KNXTelegram {
    const isGroup = input.isGroup ?? true;
    const hex = buildTP1FrameHex(input.src, input.dst, isGroup, input.payloadBytes);

    const now = new Date();
    const timePart = now.toTimeString().split(' ')[0] ?? '00:00:00';
    const timestamp = `${timePart}.${String(now.getMilliseconds()).padStart(3, '0')}`;

    const direction: 'tx' | 'rx' | 'sim' = input.fromExternalBus
      ? 'rx'
      : this.transport.mode === 'websocket-gateway'
        ? 'tx'
        : 'sim';

    const telegram: KNXTelegram = {
      id: this.nextTelegramId++,
      timestamp,
      src: input.src,
      dst: input.dst,
      isGroup,
      apci: input.apci,
      dpt: input.dpt,
      summary: input.summary,
      hex,
      direction,
    };

    this.telegrams.unshift(telegram);
    if (this.telegrams.length > 80) {
      this.telegrams.pop();
    }

    if (!input.fromExternalBus) {
      this.transport.sendTelegram(telegram, input.payloadBytes);
    }

    this.notify({ type: 'telegram', telegram });
    return telegram;
  }

  public handleSwitchShortPress(
    direction: 'up' | 'down' = 'up',
    switchLocation?: string
  ): void {
    const anyKitchenOn = this.isAnyKitchenLightOn();
    const isOffOrNightStandby = !anyKitchenOn || this.activeSceneIndex === -1;
    let nextSceneIdx = 0;

    // Physical 2-way toggle switches cycle strictly through the 3 Switch Scenes (0=Cooking, 1=Dining, 2=Lounge)
    if (isOffOrNightStandby) {
      if (this.flashedParams.wakeBehavior === 'last') {
        nextSceneIdx = Math.min(2, Math.max(0, this.lastActiveSceneIndex));
      } else {
        nextSceneIdx = direction === 'up' ? 0 : 2;
      }
    } else if (this.activeSceneIndex > 2) {
      // Coming out of an Extended AI Scene (3..7) or "All Full (100%)" (99) back to the 3 Switch Scenes
      nextSceneIdx =
        direction === 'up' ? 0 : Math.min(2, Math.max(0, this.lastActiveSceneIndex));
    } else {
      const mode = this.flashedParams.shortPressMode;
      const step = direction === 'up' ? 1 : -1;
      if (mode === 'cycle3') {
        nextSceneIdx = (this.activeSceneIndex + step + 3) % 3;
      } else {
        nextSceneIdx = this.activeSceneIndex === 0 ? 2 : 0;
      }
    }

    const dirTag = switchLocation
      ? `${switchLocation} · ${direction === 'up' ? '▲ Up' : '▼ Down'}`
      : direction === 'up'
        ? '▲ Up'
        : '▼ Down';
    this.recallScene(nextSceneIdx, '1.1.10', dirTag);
  }

  public handleSwitchLongPressHoldUp(switchLocation?: string, sourcePa = '1.1.10'): void {
    if (this.activeSceneIndex >= 0 && this.activeSceneIndex <= 2) {
      this.lastActiveSceneIndex = this.activeSceneIndex;
    }
    this.activeSceneIndex = 99; // 99 = ALL FULL (100%)

    for (const id of SCENE_CIRCUIT_IDS) {
      this.targetLevels[id] = 100;
    }
    if (sourcePa === '1.1.2') {
      this.targetLevels.utilitySpotlights = 100;
      this.utilitySwitchOn = true;
      this.lastUtilityLevel = 100;
    }

    const locPrefix = switchLocation
      ? sourcePa === '1.1.2'
        ? `${switchLocation} → `
        : `Corston (${switchLocation} ▲ Hold) → `
      : 'Hold ▲ Up → ';
    this.emitTelegram({
      src: sourcePa,
      dst: '1/0/2',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '5.001',
      summary: `${locPrefix}All Kitchen${sourcePa === '1.1.2' ? ' & Utility' : ''} Lights FULL (100%)`,
      payloadBytes: encodeDpt5Scaling(100),
    });

    this.notify({ type: 'stateChange', reason: 'masterFull' });
  }

  public handleSwitchLongPressHoldDown(switchLocation?: string, sourcePa = '1.1.10'): void {
    if (this.activeSceneIndex >= 0 && this.activeSceneIndex <= 2) {
      this.lastActiveSceneIndex = this.activeSceneIndex;
    }
    this.activeSceneIndex = -1;

    if (this.utilitySwitchOn && this.targetLevels.utilitySpotlights > NIGHT_WALK_UTILITY_PCT) {
      this.lastUtilityLevel = this.targetLevels.utilitySpotlights;
    }
    this.utilitySwitchOn = false;
    this.courtyardModeIndex = 0;
    this.targetLevels.courtyardFestoons = 0;
    this.targetLevels.reclaimedLampPost = 0;
    this.targetLevels.familyRoomSpots = 0;
    this.targetLevels.diningPendant = 0;
    this.targetLevels.diningPictureLight = 0;
    this.targetLevels.diningFairyLights = 0;

    this.applyKitchenOffStateLevels();
    this.applyUtilityOffStateLevels();

    const kNight = this.isKitchenNightDimActive();
    const uNight = this.isUtilityNightDimActive();
    const locPrefix = switchLocation
      ? sourcePa === '1.1.2'
        ? switchLocation
        : `Corston (${switchLocation} ▼ Hold)`
      : 'Hold ▼ Down';
    let summary = `${locPrefix} → All Kitchen, Dining, Utility & Courtyard Lights OFF (0%)`;
    if (kNight && uNight) {
      summary = `${locPrefix} (${this.ambientLux}lx) → Night-Walk Dim (Uplights ${NIGHT_WALK_UPLIGHTS_PCT}%, Spots ${NIGHT_WALK_SPOTLIGHTS_PCT}%, UnderCab ${NIGHT_WALK_UNDER_CABINET_PCT}%, AboveCab ${NIGHT_WALK_ABOVE_CABINET_PCT}%, Utility ${NIGHT_WALK_UTILITY_PCT}%), Courtyard & Dining 0%`;
    } else if (kNight) {
      summary = `${locPrefix} (${this.ambientLux}lx) → Kitchen Night Dim (Uplights ${NIGHT_WALK_UPLIGHTS_PCT}%, Spots ${NIGHT_WALK_SPOTLIGHTS_PCT}%, UnderCab ${NIGHT_WALK_UNDER_CABINET_PCT}%, AboveCab ${NIGHT_WALK_ABOVE_CABINET_PCT}%), Utility, Courtyard & Dining 0%`;
    } else if (uNight) {
      summary = `${locPrefix} (${this.ambientLux}lx) → Kitchen, Courtyard & Dining 0%, Utility Night Dim (${NIGHT_WALK_UTILITY_PCT}%)`;
    }

    this.emitTelegram({
      src: sourcePa,
      dst: '1/0/0',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '1.001',
      summary,
      payloadBytes: encodeDpt1(false),
    });

    this.notify({ type: 'stateChange', reason: 'masterOff' });
  }

  public handleSwitchLongPressHold(): void {
    this.handleSwitchLongPressHoldDown();
  }

  /**
   * Bifold Pier 2-Gang Switch — Gang 2 (PA 1.1.14) controls the Cobbled Courtyard
   * Festoon Lighting (Ch 7, GA 1/2/7) and Reclaimed Lamp Post (Ch 8, GA 1/2/8).
   */
  public handleCourtyardSwitchShortPress(
    direction: 'up' | 'down' = 'up',
    sourcePa = '1.1.14'
  ): void {
    const anyOn = this.isCourtyardLightOn();

    if (direction === 'down') {
      if (anyOn) {
        this.courtyardModeIndex = 0;
        this.targetLevels.courtyardFestoons = 0;
        this.targetLevels.reclaimedLampPost = 0;
      } else {
        this.courtyardModeIndex = 3;
        this.targetLevels.courtyardFestoons = 0;
        this.targetLevels.reclaimedLampPost = 95;
      }
    } else {
      // Tap Up cycles: Off (0) -> Both Warm (1) -> Festoons Only (2) -> Lamp Post Only (3) -> Off (0)
      if (!anyOn) {
        this.courtyardModeIndex = 1;
      } else {
        this.courtyardModeIndex = (this.courtyardModeIndex + 1) % 4;
      }

      if (this.courtyardModeIndex === 0) {
        this.targetLevels.courtyardFestoons = 0;
        this.targetLevels.reclaimedLampPost = 0;
      } else if (this.courtyardModeIndex === 1) {
        this.targetLevels.courtyardFestoons = 85;
        this.targetLevels.reclaimedLampPost = 90;
      } else if (this.courtyardModeIndex === 2) {
        this.targetLevels.courtyardFestoons = 95;
        this.targetLevels.reclaimedLampPost = 0;
      } else {
        this.targetLevels.courtyardFestoons = 0;
        this.targetLevels.reclaimedLampPost = 95;
      }
    }

    const label = this.getCourtyardModeLabel();
    this.emitTelegram({
      src: sourcePa,
      dst: '1/1/7',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '17.001',
      summary: `Bifold 2-Gang (G2 Courtyard ${direction === 'up' ? '▲' : '▼'}) → ${label}`,
      payloadBytes: encodeDpt17Scene(this.courtyardModeIndex),
    });

    this.notify({ type: 'stateChange', reason: 'circuitLevel' });
  }

  public handleCourtyardSwitchLongPressHoldUp(sourcePa = '1.1.14'): void {
    this.courtyardModeIndex = 1;
    this.targetLevels.courtyardFestoons = 100;
    this.targetLevels.reclaimedLampPost = 100;

    this.emitTelegram({
      src: sourcePa,
      dst: '1/2/7',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '5.001',
      summary: 'Bifold 2-Gang (G2 ▲ Hold) → Courtyard Festoons & Lamp Post FULL (100%)',
      payloadBytes: encodeDpt5Scaling(100),
    });

    this.notify({ type: 'stateChange', reason: 'circuitLevel' });
  }

  public handleCourtyardSwitchLongPressHoldDown(sourcePa = '1.1.14'): void {
    this.courtyardModeIndex = 0;
    this.targetLevels.courtyardFestoons = 0;
    this.targetLevels.reclaimedLampPost = 0;

    this.emitTelegram({
      src: sourcePa,
      dst: '1/1/7',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '1.001',
      summary: 'Bifold 2-Gang (G2 ▼ Hold) → Courtyard Festoons & Lamp Post OFF (0%)',
      payloadBytes: encodeDpt1(false),
    });

    this.notify({ type: 'stateChange', reason: 'circuitLevel' });
  }

  public handleUtilitySwitchToggle(sourcePa = '1.1.11'): void {
    if (this.utilitySwitchOn) {
      if (this.targetLevels.utilitySpotlights > NIGHT_WALK_UTILITY_PCT) {
        this.lastUtilityLevel = this.targetLevels.utilitySpotlights;
      }
      this.utilitySwitchOn = false;
      this.applyUtilityOffStateLevels();

      const nightActive = this.isUtilityNightDimActive();
      this.emitTelegram({
        src: sourcePa,
        dst: '1/1/6',
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '1.001',
        summary: nightActive
          ? `Utility Switch Off (${this.ambientLux}lx & Motion) → Utility Night Dim (${NIGHT_WALK_UTILITY_PCT}%)`
          : 'Utility Switch Off → Utility Spots Fully OFF (0%)',
        payloadBytes: encodeDpt1(false),
      });
    } else {
      this.utilitySwitchOn = true;
      const nextPct = this.lastUtilityLevel > 0 ? this.lastUtilityLevel : 100;
      this.targetLevels.utilitySpotlights = nextPct;

      this.emitTelegram({
        src: sourcePa,
        dst: '1/1/6',
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '1.001',
        summary: `Utility Switch ON → Utility Spots ${nextPct}%`,
        payloadBytes: encodeDpt1(true),
      });
    }

    this.notify({ type: 'stateChange', reason: 'circuitLevel' });
  }

  public setKitchenMotionDetected(detected: boolean): void {
    const wasDetected = this.kitchenMotionDetected;
    this.kitchenMotionDetected = detected;
    this.tvArtSlideTimerSec = 0;

    if (detected && !wasDetected) {
      // Waking on new presence toggles to the next artwork in Art Mode
      this.tvArtIndex = (this.tvArtIndex + 1) % TV_ARTWORKS.length;
    }

    if (this.activeSceneIndex === -1) {
      this.applyKitchenOffStateLevels();
    }

    const artTitle = this.getTvArtTitle();
    let summary = detected
      ? `Kitchen PIR (1.1.12) → Motion: Frame TV Art Mode ON ("${artTitle}")`
      : 'Kitchen PIR (1.1.12) → Vacant: Frame TV Auto-OFF';
    if (this.activeSceneIndex === -1) {
      if (detected && this.isBelowLuxThreshold()) {
        summary = `Kitchen PIR: Motion (${this.ambientLux}lx) → Night Dim ON & TV Art ("${artTitle}")`;
      } else if (!detected) {
        summary = 'Kitchen PIR: Vacant → Lights 0% & Frame TV Auto-OFF';
      }
    }

    this.emitTelegram({
      src: '1.1.12',
      dst: '1/4/1',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '1.018',
      summary,
      payloadBytes: encodeDpt1(detected),
    });

    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public isTvArtModeActive(): boolean {
    return this.kitchenMotionDetected;
  }

  public getTvArtIndex(): number {
    return this.tvArtIndex;
  }

  public getTvArtTitle(): string {
    return TV_ARTWORKS[this.tvArtIndex] ?? 'Tur Langton Sunset';
  }

  public cycleTvArt(emitBus = true, sourcePa = '1.1.12'): void {
    if (!this.kitchenMotionDetected) {
      // If someone interacts with the TV while room was marked vacant, presence is detected
      this.setKitchenMotionDetected(true);
      return;
    }
    this.tvArtIndex = (this.tvArtIndex + 1) % TV_ARTWORKS.length;
    this.tvArtSlideTimerSec = 0;
    const title = this.getTvArtTitle();

    if (emitBus) {
      this.emitTelegram({
        src: sourcePa,
        dst: '1/4/4',
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '17.001',
        summary: `Frame TV Art Mode → Art ${this.tvArtIndex + 1}/${TV_ARTWORKS.length}: "${title}"`,
        payloadBytes: encodeDpt17Scene(this.tvArtIndex),
      });
    }

    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public setTvArtIndex(index: number, emitBus = true, sourcePa = '1.1.2'): void {
    const count = TV_ARTWORKS.length;
    this.tvArtIndex = ((index % count) + count) % count;
    this.tvArtSlideTimerSec = 0;
    if (!this.kitchenMotionDetected) {
      this.kitchenMotionDetected = true;
    }
    const title = this.getTvArtTitle();

    if (emitBus) {
      this.emitTelegram({
        src: sourcePa,
        dst: '1/4/4',
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '17.001',
        summary: `Frame TV Art Mode → Art ${this.tvArtIndex + 1}/${count}: "${title}"`,
        payloadBytes: encodeDpt17Scene(this.tvArtIndex),
      });
    }

    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public toggleKitchenMotion(): boolean {
    this.setKitchenMotionDetected(!this.kitchenMotionDetected);
    return this.kitchenMotionDetected;
  }

  public setUtilityMotionDetected(detected: boolean): void {
    this.utilityMotionDetected = detected;
    if (!this.utilitySwitchOn) {
      this.applyUtilityOffStateLevels();
    }

    let summary = `Utility PIR (1.1.13) → ${detected ? 'Motion Detected' : 'No Motion (Vacant)'}`;
    if (!this.utilitySwitchOn) {
      if (detected && this.isBelowLuxThreshold()) {
        summary = `Utility PIR: Motion (${this.ambientLux}lx) → Utility Night Dim ON (${NIGHT_WALK_UTILITY_PCT}%)`;
      } else if (!detected) {
        summary = 'Utility PIR: No Motion (Vacant) → Utility Spots Fully OFF (0%)';
      }
    }

    this.emitTelegram({
      src: '1.1.13',
      dst: '1/4/3',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '1.018',
      summary,
      payloadBytes: encodeDpt1(detected),
    });

    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public toggleUtilityMotion(): boolean {
    this.setUtilityMotionDetected(!this.utilityMotionDetected);
    return this.utilityMotionDetected;
  }

  public setAmbientLux(lux: number, emitBus = true): void {
    this.ambientLux = Math.max(0, Math.round(lux));

    if (this.activeSceneIndex === -1) {
      this.applyKitchenOffStateLevels();
    }
    if (!this.utilitySwitchOn) {
      this.applyUtilityOffStateLevels();
    }
    this.applyRoomNightWalkLevels();

    if (emitBus) {
      const nightEligible = this.isBelowLuxThreshold();
      this.emitTelegram({
        src: '1.1.12',
        dst: '1/4/2',
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '9.004',
        summary: `Lux Sensor → ${this.ambientLux} lx (${
          nightEligible
            ? `< ${this.flashedParams.luxThreshold}lx · Night Dim Enabled`
            : `≥ ${this.flashedParams.luxThreshold}lx · Daylight Full Off`
        })`,
        payloadBytes: encodeDpt9Float(this.ambientLux),
      });
    }

    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public recallScene(sceneIdx: number, sourcePa = '1.1.10', switchLocation?: string): void {
    const scene = this.scenes[sceneIdx];
    if (!scene) return;

    this.activeSceneIndex = sceneIdx;
    if (sceneIdx >= 0 && sceneIdx <= 2) {
      this.lastActiveSceneIndex = sceneIdx;
    }

    for (const id of SCENE_CIRCUIT_IDS) {
      this.targetLevels[id] = scene.levels[id];
    }

    if (scene.outdoorLevels) {
      this.targetLevels.courtyardFestoons = scene.outdoorLevels.courtyardFestoons;
      this.targetLevels.reclaimedLampPost = scene.outdoorLevels.reclaimedLampPost;
    }

    if (scene.auxiliaryLevels) {
      if (scene.auxiliaryLevels.utilitySpotlights !== undefined) {
        this.targetLevels.utilitySpotlights = scene.auxiliaryLevels.utilitySpotlights;
        this.utilitySwitchOn =
          scene.auxiliaryLevels.utilitySpotlights > NIGHT_WALK_UTILITY_PCT;
      }
      if (scene.auxiliaryLevels.familyRoomSpots !== undefined) {
        this.targetLevels.familyRoomSpots = scene.auxiliaryLevels.familyRoomSpots;
      }
    }

    const locPrefix = switchLocation
      ? sourcePa === '1.1.2'
        ? `${switchLocation} → `
        : `Corston (${switchLocation}) → `
      : '';
    const sceneTierTag = scene.isSwitchScene ? '' : ' [Extended AI/UI Scene]';
    this.emitTelegram({
      src: sourcePa,
      dst: '1/0/1',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '17.001',
      summary: `${locPrefix}Recall ${scene.code}: "${scene.name}"${sceneTierTag}`,
      payloadBytes: encodeDpt17Scene(sceneIdx),
    });

    this.notify({ type: 'stateChange', reason: 'sceneRecall' });
  }

  public setCircuitLevel(
    circuitId: CircuitId,
    pct: number,
    emitBus = true,
    sourcePa = '1.1.1',
    switchLocation?: string
  ): void {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    this.targetLevels[circuitId] = clamped;
    // Room night-walk circuits: switching off idles at the night level when it is dark.
    const nightRule = this.roomAutomation.getNightWalkRule(circuitId);
    let nightDimSuffix = '';
    if (nightRule) {
      this.roomAutomation.noteManualLevel(circuitId, clamped);
      if (!this.roomAutomation.isSwitchOn(circuitId)) {
        this.targetLevels[circuitId] = this.roomAutomation.offStateLevel(
          nightRule,
          this.isBelowLuxThreshold()
        );
        if (this.targetLevels[circuitId] > 0) {
          nightDimSuffix = ` (Off → Night Dim ${this.targetLevels[circuitId]}%)`;
        }
      }
    }
    if (circuitId === 'utilitySpotlights') {
      this.utilitySwitchOn = clamped > 0;
      if (clamped > NIGHT_WALK_UTILITY_PCT) {
        this.lastUtilityLevel = clamped;
      }
    }

    const circuit = CIRCUITS.find((c) => c.id === circuitId);
    if (circuit && emitBus) {
      const prefix =
        sourcePa === '1.1.2'
          ? 'AI Gateway → '
          : switchLocation
            ? `Corston (${switchLocation}) → `
            : '';
      this.emitTelegram({
        src: sourcePa,
        dst: circuit.gaValue,
        isGroup: true,
        apci: 'A_GroupValue_Write',
        dpt: '5.001',
        summary: `${prefix}${circuit.shortName} → ${clamped}%${nightDimSuffix}`,
        payloadBytes: encodeDpt5Scaling(this.targetLevels[circuitId]),
      });
    }

    if (!this.isAnyKitchenLightOn()) {
      this.activeSceneIndex = -1;
    }

    this.notify({ type: 'stateChange', reason: 'circuitLevel' });
  }

  public toggleCircuit(
    circuitId: CircuitId,
    sourcePa?: string,
    switchLocation?: string,
    direction?: 'up' | 'down'
  ): void {
    if (circuitId === 'utilitySpotlights') {
      this.handleUtilitySwitchToggle(sourcePa ?? '1.1.11');
      return;
    }

    const defaultSwitchPaMap: Partial<Record<CircuitId, string>> = {
      familyRoomSpots: '1.1.15',
      bootLobbyPendant: '1.1.16',
      hallPendant: '1.1.17',
      frontRoomPendant: '1.1.18',
      entranceHallPendant: '1.1.19',
      livingRoomPendant: '1.1.21',
      studyPendant: '1.1.23',
      mainBedroomPendant: '1.2.10',
      familyBathroomPendant: '1.2.11',
      upperLandingPendant: '1.2.12',
      bedroom2Pendant: '1.2.13',
      bedroom3Pendant: '1.2.14',
      bedroom4Pendant: '1.2.15',
      courtyardFestoons: '1.1.14',
      reclaimedLampPost: '1.1.14',
      wineCellarLeds: '1.1.25',
      cloakroomWcLights: '1.1.26',
      entranceHallUplights: '1.1.19',
    };

    const resolvedPa = sourcePa ?? defaultSwitchPaMap[circuitId] ?? '1.1.10';
    const locLabel =
      switchLocation && direction
        ? `${switchLocation} ${direction === 'up' ? '▲' : '▼'}`
        : switchLocation;

    const isKitchenSceneCircuit = (SCENE_CIRCUIT_IDS as readonly string[]).includes(
      circuitId
    );
    if (!isKitchenSceneCircuit) {
      const current = this.targetLevels[circuitId] ?? 0;
      const isOn = this.roomAutomation.getNightWalkRule(circuitId)
        ? this.roomAutomation.isSwitchOn(circuitId)
        : current > 0;
      const nextLevel = isOn ? 0 : 88;
      this.setCircuitLevel(circuitId, nextLevel, true, resolvedPa, locLabel);
      return;
    }

    const current = this.targetLevels[circuitId] ?? 0;
    if (current > 0) {
      this.setCircuitLevel(circuitId, 0, true, resolvedPa, locLabel);
    } else {
      const fallbackScene =
        this.scenes[Math.max(0, Math.min(7, this.activeSceneIndex))] ?? this.scenes[0];
      const presetVal = fallbackScene
        ? fallbackScene.levels[circuitId as keyof typeof fallbackScene.levels]
        : 85;
      const restore = presetVal > 0 ? presetVal : 85;
      this.setCircuitLevel(circuitId, restore, true, resolvedPa, locLabel);
    }
  }

  public saveCurrentLevelsToActiveScene(targetSceneIdx?: number, sourcePa = '1.1.1'): void {
    const idx =
      targetSceneIdx !== undefined
        ? targetSceneIdx
        : this.activeSceneIndex >= 0 && this.activeSceneIndex <= 7
          ? this.activeSceneIndex
          : this.lastActiveSceneIndex;
    const scene = this.scenes[idx];
    if (!scene) return;

    for (const id of SCENE_CIRCUIT_IDS) {
      scene.levels[id] = this.targetLevels[id];
    }
    scene.outdoorLevels = {
      courtyardFestoons: this.targetLevels.courtyardFestoons,
      reclaimedLampPost: this.targetLevels.reclaimedLampPost,
    };
    scene.auxiliaryLevels = {
      utilitySpotlights: this.targetLevels.utilitySpotlights,
      familyRoomSpots: this.targetLevels.familyRoomSpots,
    };
    this.isDirty = true;

    this.emitTelegram({
      src: sourcePa,
      dst: '1/0/1',
      isGroup: true,
      apci: 'A_GroupValue_Write',
      dpt: '18.001',
      summary: `Store Scene ${scene.number} ("${scene.name}") into Actuator 1.1.20`,
      payloadBytes: encodeDpt18SceneControl(idx, true),
    });

    this.notify({ type: 'eepromChanged' });
  }

  public updateStagedParams(partial: Partial<DeviceParameters>): void {
    this.stagedParams = { ...this.stagedParams, ...partial };
    this.isDirty = true;
    this.notify({ type: 'eepromChanged' });
  }

  public compileEEPROMImage(useStaged = true): Uint8Array {
    const params = useStaged ? this.stagedParams : this.flashedParams;
    return compileEEPROMBytes(params, this.scenes);
  }

  public async executeFlashProcedure(
    onProgress?: (pct: number, msg: string) => void
  ): Promise<void> {
    const eeprom = this.compileEEPROMImage(true);
    const steps: ReadonlyArray<{
      readonly pct: number;
      readonly msg: string;
      readonly tg: TelegramEmitInput;
    }> = [
      {
        pct: 20,
        msg: 'T_Connect(1.1.10, 1.1.12/13 & 1.1.20)',
        tg: {
          src: '1.1.1',
          dst: '1.1.10',
          isGroup: false,
          apci: 'T_Connect',
          dpt: 'Mgmt',
          summary: 'Open P2P Management Connection → 1.1.10',
          payloadBytes: [0x80],
        },
      },
      {
        pct: 45,
        msg: 'A_DeviceDescriptor_Read(0) → Mask 0x07B0',
        tg: {
          src: '1.1.10',
          dst: '1.1.1',
          isGroup: false,
          apci: 'A_DeviceDescriptor_Res',
          dpt: 'Mask',
          summary: 'Mask Version 0x07B0 (System B)',
          payloadBytes: [0x03, 0x40, 0x07, 0xb0],
        },
      },
      {
        pct: 75,
        msg: 'A_Memory_Write(0x4018..0x403F)',
        tg: {
          src: '1.1.1',
          dst: '1.1.10',
          isGroup: false,
          apci: 'A_Memory_Write',
          dpt: 'EEPROM',
          summary: `Write Params (Hold=${this.stagedParams.holdThresholdMs}ms, Lux<${this.stagedParams.luxThreshold}lx)`,
          payloadBytes: [0x02, 0x84, 0x40, 0x18, ...Array.from(eeprom.slice(24, 28))],
        },
      },
      {
        pct: 100,
        msg: 'A_Restart(0x0380) → Online',
        tg: {
          src: '1.1.1',
          dst: '1.1.20',
          isGroup: false,
          apci: 'A_Restart',
          dpt: 'Mgmt',
          summary: 'LoadState = LOADED (0x01) · A_Restart Complete',
          payloadBytes: [0x03, 0x80],
        },
      },
    ];

    for (const step of steps) {
      this.emitTelegram(step.tg);
      if (onProgress) onProgress(step.pct, step.msg);
      await new Promise<void>((resolve) => setTimeout(resolve, 180));
    }

    this.flashedParams = { ...this.stagedParams };
    this.isDirty = false;
    if (this.activeSceneIndex === -1) {
      this.applyKitchenOffStateLevels();
    }
    if (!this.utilitySwitchOn) {
      this.applyUtilityOffStateLevels();
    }
    this.notify({ type: 'flashed', params: this.flashedParams });
    this.notify({ type: 'stateChange', reason: 'sensorChange' });
  }

  public stepDimming(dtSeconds: number): boolean {
    if (this.kitchenMotionDetected) {
      this.tvArtSlideTimerSec += dtSeconds;
      if (this.tvArtSlideTimerSec >= KNXPropertyBusController.TV_ART_CYCLE_INTERVAL_SEC) {
        this.tvArtSlideTimerSec = 0;
        this.cycleTvArt(true, '1.1.12');
      }
    }

    // Step 10.0-second synchronized travel for the Motorized Front Car Entrance Gates (PA 1.1.22)
    const gateTarget = this.carGatesOpen ? 1 : 0;
    if (this.carGatesProgress !== gateTarget) {
      const gateStep = dtSeconds / KNXPropertyBusController.CAR_GATE_TRAVEL_SEC;
      if (this.carGatesProgress < gateTarget) {
        this.carGatesProgress = Math.min(1, this.carGatesProgress + gateStep);
      } else {
        this.carGatesProgress = Math.max(0, this.carGatesProgress - gateStep);
      }

      const pct = Math.round(this.carGatesProgress * 100);
      if (this.carGatesProgress === gateTarget) {
        this.carGatesLastNotifiedPct = pct;
        this.emitTelegram({
          src: '1.1.22',
          dst: '1/5/2',
          isGroup: true,
          apci: 'A_GroupValue_Write',
          dpt: '5.001',
          summary: `Front Car Gates Status → ${pct}% (${
            this.carGatesOpen ? 'FULLY OPEN' : 'FULLY CLOSED'
          })`,
          payloadBytes: encodeDpt5Scaling(pct),
        });
        this.notify({ type: 'stateChange', reason: 'carGateChange' });
      } else if (Math.abs(pct - this.carGatesLastNotifiedPct) >= 5) {
        this.carGatesLastNotifiedPct = pct;
        this.notify({ type: 'stateChange', reason: 'carGateChange' });
      }
    }

    const ramp = Math.max(0.15, this.flashedParams.rampSpeedSec);
    const rate = (100 / ramp) * dtSeconds;
    let changed = false;

    for (const c of CIRCUITS) {
      const target = this.targetLevels[c.id];
      const current = this.liveLevels[c.id];
      if (Math.abs(target - current) > 0.05) {
        if (current < target) {
          this.liveLevels[c.id] = Math.min(target, current + rate);
        } else {
          this.liveLevels[c.id] = Math.max(target, current - rate);
        }
        changed = true;
      } else if (current !== target) {
        this.liveLevels[c.id] = target;
        changed = true;
      }
    }

    return changed;
  }
}

