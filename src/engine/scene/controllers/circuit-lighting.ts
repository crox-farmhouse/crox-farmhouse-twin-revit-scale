import * as THREE from 'three';
import type { CircuitId, CircuitLevels } from '../../../types/knx.ts';
import type { LightGroupMap, TimeOfDay, ZoneIndicatorMaterials } from '../../../types/scene.ts';

const TOD_INDOOR_LIGHT_SCALE: Readonly<
  Record<
    TimeOfDay,
    {
      readonly lightScale: number;
      readonly emissiveScale: number;
      readonly coneScale: number;
      readonly poolScale: number;
    }
  >
> = {
  day: {
    lightScale: 0.25,
    emissiveScale: 0.85,
    coneScale: 0.15,
    poolScale: 0.18,
  },
  dusk: {
    lightScale: 0.62,
    emissiveScale: 0.94,
    coneScale: 0.55,
    poolScale: 0.60,
  },
  night: {
    lightScale: 1.0,
    emissiveScale: 1.0,
    coneScale: 1.0,
    poolScale: 1.0,
  },
};
import type {
  CircuitFixtureAppearance,
  SwitchLedIndicatorKey,
  SwitchLedIndicatorRule,
} from '../property-scene-profile.ts';
import type { RoomSwitchLedBinding } from '../scene-content.ts';
import { getPointLightBudgetWeight } from '../scene-batch-optimizer.ts';

const SWITCH_LED_ON = 3.0;
const SWITCH_LED_OFF = 0.15;

export interface CircuitLightingOptions {
  readonly lightGroups: LightGroupMap;
  readonly indicatorMats: ZoneIndicatorMaterials;
  readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  readonly switchLedRules: readonly SwitchLedIndicatorRule[];
  readonly defaultFixtureAppearance: CircuitFixtureAppearance;
  readonly fixtureAppearanceOverrides: Readonly<Partial<Record<CircuitId, CircuitFixtureAppearance>>>;
  readonly tvArtTextures: readonly THREE.CanvasTexture[];
  readonly tvOffTexture: THREE.CanvasTexture;
}

/**
 * Drives every KNX-controlled visual in the scene: point lights, emissive
 * fixtures, light cones, glow pools, switch/sensor status LEDs and the Frame TV.
 */
export class CircuitLightingController {
  private readonly lightGroups: LightGroupMap;
  private readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  private readonly switchLedRules: readonly SwitchLedIndicatorRule[];
  private readonly defaultFixtureAppearance: CircuitFixtureAppearance;
  private readonly fixtureAppearanceOverrides: Readonly<
    Partial<Record<CircuitId, CircuitFixtureAppearance>>
  >;
  private readonly switchLedMats: Readonly<Record<SwitchLedIndicatorKey, THREE.MeshStandardMaterial>>;
  private readonly kitchenSensorLedMat: THREE.MeshStandardMaterial;
  private readonly utilitySensorLedMat: THREE.MeshStandardMaterial;
  private readonly tvScreenMat: THREE.MeshStandardMaterial;
  private readonly tvArtTextures: readonly THREE.CanvasTexture[];
  private readonly tvOffTexture: THREE.CanvasTexture;
  private timeOfDay: TimeOfDay = 'dusk';
  private lastLevels: Readonly<CircuitLevels> | null = null;

  public constructor(options: CircuitLightingOptions) {
    this.lightGroups = options.lightGroups;
    this.roomSwitchLedMats = options.roomSwitchLedMats;
    this.switchLedRules = options.switchLedRules;
    this.defaultFixtureAppearance = options.defaultFixtureAppearance;
    this.fixtureAppearanceOverrides = options.fixtureAppearanceOverrides;
    this.tvArtTextures = options.tvArtTextures;
    this.tvOffTexture = options.tvOffTexture;

    // Missing indicators all share one detached fallback material so writes are harmless.
    const indicatorMats = options.indicatorMats;
    const fallbackMat = new THREE.MeshStandardMaterial();
    this.tvScreenMat = indicatorMats.tvScreenMat ?? fallbackMat;
    this.switchLedMats = {
      wallSwitchLedMat: indicatorMats.wallSwitchLedMat ?? fallbackMat,
      courtyardSwitchLedMat: indicatorMats.courtyardSwitchLedMat ?? fallbackMat,
      utilitySwitchLedMat: indicatorMats.utilitySwitchLedMat ?? fallbackMat,
    };
    this.kitchenSensorLedMat = indicatorMats.kitchenSensorLedMat ?? fallbackMat;
    this.utilitySensorLedMat = indicatorMats.utilitySensorLedMat ?? fallbackMat;
  }

  public setTimeOfDay(mode: TimeOfDay): void {
    if (this.timeOfDay === mode) return;
    this.timeOfDay = mode;
    if (this.lastLevels) {
      this.applyLevels(this.lastLevels);
    }
  }

  public applyLevels(liveLevels: Readonly<CircuitLevels>): void {
    this.lastLevels = liveLevels;
    const todScale = TOD_INDOOR_LIGHT_SCALE[this.timeOfDay];
    const entries = Object.entries(this.lightGroups) as Array<
      [CircuitId, LightGroupMap[CircuitId]]
    >;

    for (const [circuitId, group] of entries) {
      const pct = (liveLevels[circuitId] ?? 0) / 100;
      const curved = Math.pow(pct, 1.35);
      const appearance =
        this.fixtureAppearanceOverrides[circuitId] ?? this.defaultFixtureAppearance;

      for (const light of group.lights) {
        const customMax =
          typeof light.userData?.baseIntensity === 'number'
            ? (light.userData.baseIntensity as number)
            : group.maxIntensity;
        const targetIntensity = customMax * curved * todScale.lightScale;
        light.userData = { ...light.userData, knxTargetIntensity: targetIntensity };
        // Pure function of KNX level × time of day (× the fixed, room-anchored light-budget fade
        // weight). Never depends on camera position, zoom or floor/cutaway mode.
        light.intensity = targetIntensity * getPointLightBudgetWeight(light);
      }
      for (const mat of group.emissives) {
        const customEmissiveMax =
          typeof mat.userData?.baseEmissiveIntensity === 'number'
            ? (mat.userData.baseEmissiveIntensity as number)
            : appearance.emissiveMax;
        mat.emissiveIntensity = customEmissiveMax * pct * todScale.emissiveScale;
      }
      for (const coneMat of group.cones) {
        const nextOpacity = appearance.coneOpacity * pct * todScale.coneScale;
        coneMat.opacity = nextOpacity;
        coneMat.visible = nextOpacity > 0.002;
      }
      for (const pool of group.pools) {
        const nextOpacity = pool.maxOpacity * pct * todScale.poolScale;
        pool.mat.opacity = nextOpacity;
        pool.mat.visible = nextOpacity > 0.002;
      }
    }

    for (const rule of this.switchLedRules) {
      const anyOn = rule.circuits.some((circuitId) => (liveLevels[circuitId] ?? 0) > 1);
      this.switchLedMats[rule.material].emissiveIntensity = anyOn ? SWITCH_LED_ON : SWITCH_LED_OFF;
    }

    for (const { circuitId, mat } of this.roomSwitchLedMats) {
      const isOn = (liveLevels[circuitId] ?? 0) > 1;
      mat.emissiveIntensity = isOn ? SWITCH_LED_ON : SWITCH_LED_OFF;
    }
  }

  public setMotionSensorStates(kitchenMotion: boolean, utilityMotion: boolean): void {
    this.kitchenSensorLedMat.color.setHex(kitchenMotion ? 0x4be07a : 0x555c66);
    this.kitchenSensorLedMat.emissive.setHex(kitchenMotion ? 0x32c864 : 0x22262c);
    this.kitchenSensorLedMat.emissiveIntensity = kitchenMotion ? 2.6 : 0.2;

    this.utilitySensorLedMat.color.setHex(utilityMotion ? 0x4be07a : 0x555c66);
    this.utilitySensorLedMat.emissive.setHex(utilityMotion ? 0x32c864 : 0x22262c);
    this.utilitySensorLedMat.emissiveIntensity = utilityMotion ? 2.6 : 0.2;
  }

  /** Returns true if the TV screen material changed. */
  public setTVArtState(artModeOn: boolean, artIndex: number): boolean {
    if (artModeOn) {
      const tex =
        this.tvArtTextures[artIndex % this.tvArtTextures.length] ?? this.tvArtTextures[0];
      if (tex && (this.tvScreenMat.map !== tex || this.tvScreenMat.emissiveIntensity !== 0.04)) {
        this.tvScreenMat.map = tex;
        this.tvScreenMat.emissiveMap = tex;
        this.tvScreenMat.color.setHex(0xa69e92);
        this.tvScreenMat.emissive.setHex(0xffffff);
        this.tvScreenMat.emissiveIntensity = 0.04;
        this.tvScreenMat.needsUpdate = true;
        return true;
      }
    } else if (this.tvScreenMat.map !== this.tvOffTexture || this.tvScreenMat.emissiveIntensity !== 0) {
      this.tvScreenMat.map = this.tvOffTexture;
      this.tvScreenMat.emissiveMap = null;
      this.tvScreenMat.color.setHex(0x3a3d42);
      this.tvScreenMat.emissive.setHex(0x000000);
      this.tvScreenMat.emissiveIntensity = 0;
      this.tvScreenMat.needsUpdate = true;
      return true;
    }
    return false;
  }
}
