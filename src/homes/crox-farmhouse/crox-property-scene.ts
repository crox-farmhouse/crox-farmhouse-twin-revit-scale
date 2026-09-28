import type { CircuitId } from '../../types/knx.ts';
import { PropertyScene } from '../../engine/scene/property-scene.ts';
import type { PropertySceneProfile } from '../../engine/scene/property-scene-profile.ts';
import type { InteractiveUserData } from '../../types/scene.ts';
import { CROX_FARMHOUSE_LOD_REGISTRATIONS } from './manifest.ts';
import { buildCroxUnderfloorHeatingSystem } from './heating/ufh-system.ts';
import {
  buildCroxUniFiSecurityAndAccess3D,
  type CroxSecurity3DHandles,
} from './security/unifi-security-zone.ts';
import { PropertySceneRegistry } from './zone-modules.ts';

/**
 * Point-light intensity at 100% for every Crox Farmhouse lighting circuit.
 * Key order is significant: it is the order light groups are created and updated.
 */
export const CROX_FARMHOUSE_CIRCUIT_MAX_INTENSITY: Readonly<Record<CircuitId, number>> = {
  islandPendants: 8.5,
  sittingPendants: 7.5,
  bifoldUplights: 6.5,
  spotlights: 7.0,
  underCabinet: 5.5,
  aboveCabinet: 4.8,
  utilitySpotlights: 6.5,
  familyRoomSpots: 7.0,
  courtyardFestoons: 6.5,
  reclaimedLampPost: 9.0,
  bootLobbyPendant: 11.5,
  hallPendant: 13.5,
  frontRoomPendant: 13.5,
  entranceHallPendant: 11.5,
  livingRoomPendant: 14.0,
  studyPendant: 12.0,
  mainBedroomPendant: 13.5,
  familyBathroomPendant: 12.5,
  upperLandingPendant: 13.0,
  bedroom2Pendant: 13.5,
  bedroom3Pendant: 13.0,
  bedroom4Pendant: 13.0,
  wineCellarLeds: 3.5,
  cloakroomWcLights: 6.0,
  entranceHallUplights: 5.0,
  diningPendant: 11.5,
  diningPictureLight: 4.5,
  diningFairyLights: 2.5,
};

/** Scene profile binding the home-agnostic engine to Crox Farmhouse data. */
export function createCroxFarmhouseSceneProfile(): PropertySceneProfile<CroxSecurity3DHandles> {
  return {
    createZoneRegistry: () => new PropertySceneRegistry(),
    lodRegistrations: CROX_FARMHOUSE_LOD_REGISTRATIONS,
    circuitMaxIntensity: CROX_FARMHOUSE_CIRCUIT_MAX_INTENSITY,
    defaultFixtureAppearance: { emissiveMax: 2.8, coneOpacity: 0.2 },
    fixtureAppearanceOverrides: {
      sittingPendants: { emissiveMax: 4.2, coneOpacity: 0.72 },
    },
    switchLedRules: [
      {
        material: 'wallSwitchLedMat',
        circuits: [
          'islandPendants',
          'sittingPendants',
          'bifoldUplights',
          'spotlights',
          'underCabinet',
          'aboveCabinet',
        ],
      },
      { material: 'utilitySwitchLedMat', circuits: ['utilitySpotlights'] },
      { material: 'courtyardSwitchLedMat', circuits: ['courtyardFestoons', 'reclaimedLampPost'] },
    ],
    // 4-leaf oak bifolds folding outward into the courtyard from the right oak post.
    bifoldTrack: { anchorRightX: 4.7, trackZ: 2.12, leafWidth: 3.02 / 4, maxFoldAngle: 1.4 },
    buildSecurityOverlay: (ctx) => buildCroxUniFiSecurityAndAccess3D(ctx),
    buildUfhOverlay: (ctx) => buildCroxUnderfloorHeatingSystem(ctx),
  };
}

/** The Crox Farmhouse digital twin scene. */
export class CroxPropertyScene extends PropertyScene<CroxSecurity3DHandles> {
  public constructor(
    canvas: HTMLCanvasElement,
    onObjectInteraction: (data: InteractiveUserData) => void,
    profile: PropertySceneProfile<CroxSecurity3DHandles> = createCroxFarmhouseSceneProfile()
  ) {
    super(canvas, onObjectInteraction, profile);
  }
}
