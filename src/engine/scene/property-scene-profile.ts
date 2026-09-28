import * as THREE from 'three';
import type {
  AccessPointEntityState,
  CctvCameraEntityState,
  RoomZoneLodRegistration,
} from '../../core/entities.ts';
import type { CircuitId } from '../../types/knx.ts';
import type { SceneBuilderContext, ZoneIndicatorMaterials } from '../../types/scene.ts';
import type { RoomZoneId } from '../../types/topology.ts';
import type { UsdTransformOverride } from '../usd/usda-override-layer.ts';
import type { SceneZoneRegistry } from './scene-zone-registry.ts';

export type UfhZoneId = 'ufhZone1' | 'ufhZone2' | 'ufhZone3' | 'ufhZone4';

export type HeatingStartMode = 'setback' | 'cold';

export interface HeatingEnvironmentConfig {
  readonly outdoorTempC: number;
  readonly startMode: HeatingStartMode;
}

export interface RoomThermalProfile {
  readonly roomZoneId: RoomZoneId;
  readonly roomName: string;
  readonly ufhZoneId: UfhZoneId;
  readonly emitterLabel: string;
  readonly constructionSummary: string;
  readonly floorAreaM2: number;
  readonly heatedAreaM2: number;
  readonly volumeM3: number;
  readonly emitterOutputW: number;
  readonly specificOutputWPerM2: number;
  /** Fabric + infiltration heat-loss coefficient (W/K) for 1600s/1700s solid brick + double glazing */
  readonly heatLossWPerK: number;
  /** Effective thermal capacitance (Wh/K) of air + internal masonry skin + active screed/emitter */
  readonly thermalCapacitanceWhPerK: number;
  /** Hydraulic + screed conduction dead-time lag before room air begins rising (minutes) */
  readonly emitterLagMinutes: number;
  readonly setbackStartTempC: number;
  readonly coldStartTempC: number;
  readonly targetTempC: number;
}

export interface ThermalWarmupEstimate {
  readonly startTempC: number;
  readonly targetTempC: number;
  readonly outdoorTempC: number;
  readonly emitterOutputW: number;
  readonly steadyHeatLossAtTargetW: number;
  readonly netBoostPowerAtStartW: number;
  readonly emitterLagMinutes: number;
  readonly initialHeatingRateCPerHr: number;
  readonly maxAchievableTempC: number;
  readonly totalWarmupMinutes: number | null;
  readonly formattedDuration: string;
}

export interface UfhZoneState {
  readonly id: UfhZoneId;
  readonly zoneNumber: number;
  readonly name: string;
  readonly shortName: string;
  readonly manifoldLabel: string;
  readonly roomZones: readonly RoomZoneId[];
  heatingOn: boolean;
  targetTempC: number;
}

/**
 * Contract for a home's 3D Underfloor Heating (UFH) sub-floor pipework layer and zone controller.
 */
export interface UfhSystemOverlay3D {
  readonly rootGroup: THREE.Group;
  isLayerVisible(): boolean;
  setLayerVisible(visible: boolean): void;
  toggleLayerVisible(): boolean;
  getZones(): readonly UfhZoneState[];
  getZone(zoneId: UfhZoneId): UfhZoneState | undefined;
  getZoneForRoom(roomZoneId: RoomZoneId): UfhZoneState | undefined;
  isZoneOn(zoneId: UfhZoneId): boolean;
  setZoneOn(zoneId: UfhZoneId, on: boolean): void;
  toggleZone(zoneId: UfhZoneId): boolean;
  setAllZones(on: boolean): void;
  getEnvironment(): HeatingEnvironmentConfig;
  setOutdoorTempC(tempC: number): void;
  setStartMode(mode: HeatingStartMode): void;
  getZoneWarmupEstimate(zoneId: UfhZoneId): ThermalWarmupEstimate | undefined;
  getRoomThermalProfile(roomZoneId: RoomZoneId): RoomThermalProfile | undefined;
  getRoomWarmupEstimate(roomZoneId: RoomZoneId): ThermalWarmupEstimate | undefined;
  subscribe(listener: () => void): () => void;
}

/**
 * Minimal contract for a home's 3D security overlay (CCTV cameras + access readers).
 */
export interface SecurityOverlay3D {
  syncCameras(states: readonly CctvCameraEntityState[]): void;
  syncAccessPoints(states: readonly AccessPointEntityState[]): void;
}

/** Keys of `ZoneIndicatorMaterials` that represent multi-circuit wall switch LEDs. */
export type SwitchLedIndicatorKey = Extract<
  keyof ZoneIndicatorMaterials,
  'wallSwitchLedMat' | 'utilitySwitchLedMat' | 'courtyardSwitchLedMat'
>;

/**
 * A wall switch whose status LED lights when any of `circuits` is above 1%.
 * Rules are applied in array order.
 */
export interface SwitchLedIndicatorRule {
  readonly material: SwitchLedIndicatorKey;
  readonly circuits: readonly CircuitId[];
}

/** Emissive / light-cone appearance of a circuit's fixtures at 100%. */
export interface CircuitFixtureAppearance {
  readonly emissiveMax: number;
  readonly coneOpacity: number;
}

/** Geometry of a concertina bifold door track (all in metres / radians). */
export interface BifoldTrackConfig {
  /** X of the fixed (right-hand) post the leaves fold against. */
  readonly anchorRightX: number;
  /** Z of the track centre line. */
  readonly trackZ: number;
  /** Width of a single leaf. */
  readonly leafWidth: number;
  /** Fold angle of each leaf when fully open. */
  readonly maxFoldAngle: number;
}

/**
 * Everything the home-agnostic `PropertyScene` needs to know about a specific home.
 */
export interface PropertySceneProfile<TSecurity extends SecurityOverlay3D = SecurityOverlay3D> {
  createZoneRegistry(): SceneZoneRegistry;
  readonly lodRegistrations: readonly RoomZoneLodRegistration[];
  /** Point-light intensity at 100% for every lighting circuit (key order is significant). */
  readonly circuitMaxIntensity: Readonly<Record<CircuitId, number>>;
  readonly defaultFixtureAppearance: CircuitFixtureAppearance;
  readonly fixtureAppearanceOverrides: Readonly<Partial<Record<CircuitId, CircuitFixtureAppearance>>>;
  readonly switchLedRules: readonly SwitchLedIndicatorRule[];
  readonly bifoldTrack: BifoldTrackConfig;
  /** Optional non-destructive OpenUSD (`over`) layout overrides applied after building zones. */
  readonly usdOverrides?: readonly UsdTransformOverride[];
  buildSecurityOverlay(ctx: SceneBuilderContext): TSecurity;
  buildUfhOverlay?: (ctx: SceneBuilderContext) => UfhSystemOverlay3D;
}
