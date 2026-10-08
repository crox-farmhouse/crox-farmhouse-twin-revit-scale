import type { BuildingId, FloorId, RoomZoneId } from './topology.ts';

/**
 * Strict TypeScript domain models for the Crox Farmhouse KNX TP1 / cEMI Bus & Digital Twin.
 */

export type KitchenSceneCircuitId =
  | 'islandPendants'
  | 'sittingPendants'
  | 'bifoldUplights'
  | 'spotlights'
  | 'underCabinet'
  | 'aboveCabinet';

export type OutdoorCircuitId = 'courtyardFestoons' | 'reclaimedLampPost';

export type RoomPendantCircuitId =
  | 'diningPendant'
  | 'bootLobbyPendant'
  | 'hallPendant'
  | 'frontRoomPendant'
  | 'entranceHallPendant'
  | 'livingRoomPendant'
  | 'studyPendant'
  | 'mainBedroomPendant'
  | 'familyBathroomPendant'
  | 'upperLandingPendant'
  | 'bedroom2Pendant'
  | 'bedroom3Pendant'
  | 'bedroom4Pendant';

/** Room circuits switched automatically by a room PIR (see `MOTION_CIRCUIT_RULES`). */
export type MotionCircuitId = 'wineCellarLeds' | 'cloakroomWcLights';

/** Room PIR presence sensors handled by the generic room automation. */
export type RoomMotionSensorId = 'wineCellar' | 'cloakroomWc';

export type OutbuildingCircuitId =
  | 'gymSpotsAndBattens'
  | 'gymWallAndCoveLights'
  | 'garageHighBayLights'
  | 'garageBenchAndShower'
  | 'barnTrussAndSimHalo'
  | 'barnBarsAndLamps5A'
  | 'mezzanineSconcesAndAmbient'
  | 'mezzanineLamps5A'
  | 'stableOfficeSpotlights'
  | 'stableOfficeWallsAndLamps5A'
  | 'stableSuiteDownlights'
  | 'stableSuiteLamps5A';

export type CircuitId =
  | KitchenSceneCircuitId
  | 'utilitySpotlights'
  | 'familyRoomSpots'
  | 'diningPictureLight'
  | 'diningFairyLights'
  | RoomPendantCircuitId
  | MotionCircuitId
  | 'entranceHallUplights'
  | OutdoorCircuitId
  | OutbuildingCircuitId;

export type SceneCircuitLevels = Record<KitchenSceneCircuitId, number>;
export type OutdoorCircuitLevels = Record<OutdoorCircuitId, number>;
export type CircuitLevels = Record<CircuitId, number>;

export interface CircuitConfig {
  readonly id: CircuitId;
  readonly channel: number;
  readonly name: string;
  readonly shortName: string;
  readonly location: string;
  readonly buildingId: BuildingId;
  readonly floorId: FloorId;
  readonly zoneId: RoomZoneId;
  readonly actuatorPa: string;
  readonly gaSwitch: string;
  readonly gaValue: string;
  readonly gaStatus: string;
  readonly isSceneMember: boolean;
}

export interface AuxiliaryCircuitLevels {
  utilitySpotlights?: number;
  familyRoomSpots?: number;
}

export interface ScenePreset {
  readonly index: number;
  readonly number: number;
  readonly code: string;
  readonly name: string;
  readonly shortLabel: string;
  readonly isSwitchScene: boolean;
  levels: SceneCircuitLevels;
  outdoorLevels?: OutdoorCircuitLevels;
  auxiliaryLevels?: AuxiliaryCircuitLevels;
}

export type ShortPressMode = 'cycle3' | 'toggle13';
export type WakeBehavior = 'first' | 'last';

export interface DeviceParameters {
  holdThresholdMs: number;
  shortPressMode: ShortPressMode;
  wakeBehavior: WakeBehavior;
  rampSpeedSec: number;
  luxThreshold: number;
}

export interface TelegramEmitInput {
  readonly src: string;
  readonly dst: string;
  readonly isGroup?: boolean;
  readonly apci: string;
  readonly dpt: string;
  readonly summary: string;
  readonly payloadBytes: readonly number[];
  readonly fromExternalBus?: boolean;
}

export interface KNXTelegram {
  readonly id: number;
  readonly timestamp: string;
  readonly src: string;
  readonly dst: string;
  readonly isGroup: boolean;
  readonly apci: string;
  readonly dpt: string;
  readonly summary: string;
  readonly hex: string;
  readonly direction?: 'tx' | 'rx' | 'sim';
}

export type KNXTransportMode = 'simulation' | 'websocket-gateway';
export type KNXTransportStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface InboundKNXFrame {
  readonly src?: string;
  readonly dst: string;
  readonly isGroup?: boolean;
  readonly apci?: string;
  readonly dpt?: string;
  readonly payloadBytes?: readonly number[];
  readonly hex?: string;
  readonly summary?: string;
}

export type KNXBusEvent =
  | { readonly type: 'telegram'; readonly telegram: KNXTelegram }
  | {
      readonly type: 'stateChange';
      readonly reason:
        | 'masterOff'
        | 'masterFull'
        | 'sceneRecall'
        | 'circuitLevel'
        | 'sensorChange'
        | 'carGateChange'
        | 'externalBusSync';
    }
  | { readonly type: 'eepromChanged' }
  | { readonly type: 'flashed'; readonly params: Readonly<DeviceParameters> }
  | {
      readonly type: 'transportStatus';
      readonly mode: KNXTransportMode;
      readonly status: KNXTransportStatus;
      readonly endpointUrl?: string;
    };

export type KNXEventListener = (event: KNXBusEvent) => void;
