import { CIRCUITS, DEFAULT_SCENES } from '../../integrations/knx/constants.ts';
import type { CircuitId, ScenePreset } from '../../core/types/knx.ts';
import type { RoomZoneId } from '../../core/types/topology.ts';
import type {
  RoomDeviceControl,
  RoomLightControl,
  RoomManifestEntry,
  RoomSceneControl,
} from '../../core/types/twin-ux.ts';

/**
 * Declarative room manifest for the Crox Farmhouse room context panel.
 *
 * Joins the KNX circuit map (`CIRCUITS`), the KNX scene table (`DEFAULT_SCENES`), the
 * interactable ids registered by the room builders and the UFH zone map
 * (`ROOM_THERMAL_PROFILES`) by `RoomZoneId`, so the panel can show "what can I control in
 * the room I'm looking at" without knowing anything about the underlying systems.
 */

type RoomGroup = RoomManifestEntry['group'];

/** Legacy / placeholder zone ids in `RoomZoneId` that have no bounds or geometry of their own. */
type LegacyRoomZoneId =
  | 'hallway'
  | 'diningRoom'
  | 'snug'
  | 'masterBedroom'
  | 'annexLiving'
  | 'annexBedroom';

/** Zone ids that are modelled (have bounds in `ROOM_ZONES`) and appear in the navigator. */
export type CanonicalRoomZoneId = Exclude<RoomZoneId, LegacyRoomZoneId>;

/**
 * Legacy zone ids resolve to the modelled room that now covers them. Mirrors the USD stage
 * converter (`diningRoom` → `familyRoom`) and the UFH profile ("Dining Room & Snug").
 */
const LEGACY_ZONE_ALIASES: Readonly<Record<LegacyRoomZoneId, CanonicalRoomZoneId>> = {
  hallway: 'hall',
  diningRoom: 'familyRoom',
  snug: 'familyRoom',
  masterBedroom: 'mainBedroom',
  annexLiving: 'outbuildingStableSuite',
  annexBedroom: 'outbuildingStableSuite',
};

/**
 * Friendly labels for every KNX circuit. Typed as an exhaustive `Record<CircuitId, …>` so adding
 * a circuit to `CircuitId` without a label is a compile error.
 *
 * Every channel sits on a dimming actuator (1.1.20 / 1.2.20 / 2.1.20, DPT 5.001 value GA), so
 * circuits are dimmable except the outbuilding channels that drive only the switched 5V/5A lamp
 * sockets on actuator 2.1.20 ("switched 5A/5V lamp socket actuator").
 */
const CIRCUIT_PRESENTATION: Readonly<
  Record<CircuitId, { readonly label: string; readonly dimmable: boolean }>
> = {
  // Kitchen (scene group, actuator 1.1.20)
  islandPendants: { label: 'Island pendants', dimmable: true },
  spotlights: { label: 'Ceiling spots', dimmable: true },
  underCabinet: { label: 'Under-cabinet & hood lights', dimmable: true },
  aboveCabinet: { label: 'Above-cabinet LED strip', dimmable: true },
  // Kitchen sitting area
  sittingPendants: { label: 'Sitting area pendants', dimmable: true },
  bifoldUplights: { label: 'Bifold floor uplights', dimmable: true },
  // Utility
  utilitySpotlights: { label: 'Ceiling spots', dimmable: true },
  // Courtyard
  courtyardFestoons: { label: 'Festoon lights', dimmable: true },
  reclaimedLampPost: { label: 'Lamp post', dimmable: true },
  // Dining room (familyRoom zone)
  familyRoomSpots: { label: 'Ceiling downlights', dimmable: true },
  diningPendant: { label: 'Table pendant', dimmable: true },
  diningPictureLight: { label: 'Picture light', dimmable: true },
  diningFairyLights: { label: 'Plant fairy lights', dimmable: true },
  // Boot lobby, wine cellar & cloakroom WC
  bootLobbyPendant: { label: 'Wall lights', dimmable: true },
  wineCellarLeds: { label: 'Wine cellar shelf LEDs', dimmable: true },
  cloakroomWcLights: { label: 'Cloakroom WC lights', dimmable: true },
  // Main staircase hall
  hallPendant: { label: 'Wall, stair & beam lights', dimmable: true },
  // Living room (front room)
  frontRoomPendant: { label: 'Wall lights & shelf LEDs', dimmable: true },
  // Entrance hall
  entranceHallPendant: { label: 'Glass lantern pendant', dimmable: true },
  entranceHallUplights: { label: 'Floor uplights', dimmable: true },
  // Sitting room (circuit id predates the room rename)
  livingRoomPendant: { label: 'Ceiling pendant & lamps', dimmable: true },
  // Study
  studyPendant: { label: 'Ceiling pendant', dimmable: true },
  // First floor (actuator 1.2.20)
  mainBedroomPendant: { label: 'Ceiling pendant', dimmable: true },
  familyBathroomPendant: { label: 'Glass pendant', dimmable: true },
  upperLandingPendant: { label: 'Stairwell & landing pendants', dimmable: true },
  bedroom2Pendant: { label: 'Ceiling pendant', dimmable: true },
  bedroom3Pendant: { label: 'Pendant (bedroom & shower room)', dimmable: true },
  bedroom4Pendant: { label: 'Ceiling pendant', dimmable: true },
  // Outbuildings (actuator 2.1.20)
  gymSpotsAndBattens: { label: 'LED battens & mirror backlights', dimmable: true },
  gymWallAndCoveLights: { label: 'Wall sconces & eave coves', dimmable: true },
  garageHighBayLights: { label: 'High-bay lights', dimmable: true },
  garageBenchAndShower: { label: 'Workbench, shower & corridor lights', dimmable: true },
  barnTrussAndSimHalo: { label: 'Truss spots & golf sim halo', dimmable: true },
  barnBarsAndLamps5A: { label: 'Bars & lamp sockets', dimmable: true },
  mezzanineSconcesAndAmbient: { label: 'Wall sconces & downlights', dimmable: true },
  mezzanineLamps5A: { label: 'Lamp sockets', dimmable: false },
  stableOfficeSpotlights: { label: 'Ceiling spots & WC', dimmable: true },
  stableOfficeWallsAndLamps5A: { label: 'Wall lights & lamp sockets', dimmable: true },
  stableSuiteDownlights: { label: 'Downlights, ensuite & balcony', dimmable: true },
  stableSuiteLamps5A: { label: 'Lamp sockets', dimmable: false },
};

/** Lights for a zone, in KNX channel order, straight from the circuit map. */
function lightsFor(zoneId: CanonicalRoomZoneId): readonly RoomLightControl[] {
  return CIRCUITS.filter((c) => c.zoneId === zoneId).map((c) => ({
    circuitId: c.id,
    label: CIRCUIT_PRESENTATION[c.id].label,
    dimmable: CIRCUIT_PRESENTATION[c.id].dimmable,
  }));
}

/**
 * KNX scenes (group 1/0/1, DPT 17.001). `sceneNumber` is the 0-based scene value that
 * `KNXPropertyBusController.recallScene(sceneNumber, pa)` expects (it indexes `DEFAULT_SCENES`
 * and is written to the bus as-is). Switch scenes come from the Corston switch (1.1.10);
 * extended scenes from the AI/UI gateway (1.1.2) — same convention as `hud-knx-controls.ts`.
 */
function toSceneControl(scene: ScenePreset): RoomSceneControl {
  return {
    id: `knx-scene-${scene.number}`,
    label: scene.name,
    sceneNumber: scene.index,
    pa: scene.isSwitchScene ? '1.1.10' : '1.1.2',
  };
}

/** All KNX scenes drive the kitchen + sitting area scene circuits. */
const KITCHEN_SCENES: readonly RoomSceneControl[] = DEFAULT_SCENES.map(toSceneControl);

/** Scenes that also set the courtyard festoons / lamp post (`outdoorLevels` with lights on). */
const COURTYARD_SCENES: readonly RoomSceneControl[] = DEFAULT_SCENES.filter(
  (s) =>
    s.outdoorLevels !== undefined &&
    (s.outdoorLevels.courtyardFestoons > 0 || s.outdoorLevels.reclaimedLampPost > 0)
).map(toSceneControl);

interface RoomSpec {
  readonly label: string;
  readonly group: RoomGroup;
  readonly floor: 'ground' | 'first';
  readonly scenes?: readonly RoomSceneControl[];
  readonly devices?: readonly RoomDeviceControl[];
  readonly ufhZoneId?: string;
}

/**
 * Interactable ids: only ids with a fixed value are used. `golf-simulator-shot` and
 * `pulley-maid` are hard-coded in `InteractionManager`; `door-1` (utility stable door),
 * `door-14` (dining courtyard door) and `door-28` (bedroom 2 door) are the allocation-order
 * ids already special-cased by `InteractionManager` (see `getDefaultDoorOpenAngle` and the
 * stable-door barge logic).
 */
const ROOM_SPECS: Readonly<Record<CanonicalRoomZoneId, RoomSpec>> = {
  // --- Main house · ground floor -------------------------------------------------------
  entranceHall: {
    label: 'Entrance hall',
    group: 'house-ground',
    floor: 'ground',
    ufhZoneId: 'ufhZone3',
  },
  sittingRoom: {
    label: 'Sitting room',
    group: 'house-ground',
    floor: 'ground',
    ufhZoneId: 'ufhZone1',
  },
  livingRoom: {
    label: 'Living room',
    group: 'house-ground',
    floor: 'ground',
    ufhZoneId: 'ufhZone2',
  },
  study: { label: 'Study', group: 'house-ground', floor: 'ground' },
  hall: { label: 'Staircase hall', group: 'house-ground', floor: 'ground', ufhZoneId: 'ufhZone3' },
  bootLobby: {
    label: 'Boot lobby & WC',
    group: 'house-ground',
    floor: 'ground',
    ufhZoneId: 'ufhZone3',
  },
  familyRoom: {
    label: 'Dining room',
    group: 'house-ground',
    floor: 'ground',
    devices: [{ interactableId: 'door-14', label: 'Courtyard door' }],
    ufhZoneId: 'ufhZone4',
  },
  kitchen: {
    label: 'Kitchen',
    group: 'house-ground',
    floor: 'ground',
    scenes: KITCHEN_SCENES,
    ufhZoneId: 'ufhZone4',
  },
  sitting: {
    label: 'Kitchen sitting area',
    group: 'house-ground',
    floor: 'ground',
    scenes: KITCHEN_SCENES,
    ufhZoneId: 'ufhZone4',
  },
  utility: {
    label: 'Utility room',
    group: 'house-ground',
    floor: 'ground',
    devices: [
      { interactableId: 'pulley-maid', label: 'Pulley maid airer' },
      { interactableId: 'door-1', label: 'Stable door' },
    ],
    ufhZoneId: 'ufhZone4',
  },
  // --- Main house · first floor --------------------------------------------------------
  upperLanding: { label: 'Landing', group: 'house-first', floor: 'first' },
  mainBedroom: { label: 'Main bedroom', group: 'house-first', floor: 'first' },
  familyBathroom: { label: 'Family bathroom', group: 'house-first', floor: 'first' },
  bedroom2: {
    label: 'Bedroom 2',
    group: 'house-first',
    floor: 'first',
    devices: [{ interactableId: 'door-28', label: 'Bedroom door' }],
  },
  bedroom3: { label: 'Bedroom 3 & shower room', group: 'house-first', floor: 'first' },
  bedroom4: { label: 'Bedroom 4', group: 'house-first', floor: 'first' },
  // --- Barn & outbuildings -------------------------------------------------------------
  outbuildingBarn: {
    label: 'Barn & golf sim',
    group: 'outbuildings',
    floor: 'ground',
    devices: [{ interactableId: 'golf-simulator-shot', label: 'Golf simulator: take a shot' }],
  },
  outbuildingMezzanine: { label: 'Barn mezzanine', group: 'outbuildings', floor: 'first' },
  outbuildingGym: { label: 'Gym', group: 'outbuildings', floor: 'ground' },
  outbuildingGarage: { label: 'Garage & workshop', group: 'outbuildings', floor: 'ground' },
  outbuildingStableOffice: { label: 'Stable office', group: 'outbuildings', floor: 'ground' },
  outbuildingStableSuite: { label: 'Stable guest suite', group: 'outbuildings', floor: 'first' },
  // --- Garden & courtyard --------------------------------------------------------------
  courtyard: {
    label: 'Courtyard & driveway',
    group: 'grounds',
    floor: 'ground',
    scenes: COURTYARD_SCENES,
  },
};

/** Navigator order within each group (walk order through the property). */
const NAV_ORDER: Readonly<Record<RoomGroup, readonly CanonicalRoomZoneId[]>> = {
  'house-ground': [
    'entranceHall',
    'sittingRoom',
    'livingRoom',
    'study',
    'hall',
    'bootLobby',
    'familyRoom',
    'kitchen',
    'sitting',
    'utility',
  ],
  'house-first': [
    'upperLanding',
    'mainBedroom',
    'familyBathroom',
    'bedroom2',
    'bedroom3',
    'bedroom4',
  ],
  outbuildings: [
    'outbuildingBarn',
    'outbuildingMezzanine',
    'outbuildingGym',
    'outbuildingGarage',
    'outbuildingStableOffice',
    'outbuildingStableSuite',
  ],
  grounds: ['courtyard'],
};

const GROUP_LABELS: Readonly<Record<RoomGroup, string>> = {
  'house-ground': 'House · Ground floor',
  'house-first': 'House · First floor',
  outbuildings: 'Barn & outbuildings',
  grounds: 'Garden & courtyard',
};

const GROUP_ORDER: readonly RoomGroup[] = ['house-ground', 'house-first', 'outbuildings', 'grounds'];

function buildEntry(zoneId: CanonicalRoomZoneId): RoomManifestEntry {
  const spec = ROOM_SPECS[zoneId];
  const entry: RoomManifestEntry = {
    zoneId,
    label: spec.label,
    group: spec.group,
    floor: spec.floor,
    lights: lightsFor(zoneId),
    scenes: spec.scenes ?? [],
    devices: spec.devices ?? [],
  };
  return spec.ufhZoneId === undefined ? entry : { ...entry, ufhZoneId: spec.ufhZoneId };
}

/** One entry per modelled room, in navigator order. */
export const CROX_ROOM_MANIFEST: readonly RoomManifestEntry[] = GROUP_ORDER.flatMap((group) =>
  NAV_ORDER[group].map(buildEntry)
);

const MANIFEST_BY_ZONE: ReadonlyMap<RoomZoneId, RoomManifestEntry> = new Map(
  CROX_ROOM_MANIFEST.map((e) => [e.zoneId, e])
);

function isLegacyZoneId(zoneId: RoomZoneId): zoneId is LegacyRoomZoneId {
  return Object.prototype.hasOwnProperty.call(LEGACY_ZONE_ALIASES, zoneId);
}

/** Resolves any `RoomZoneId` (including legacy aliases) to the modelled room id. */
export function resolveRoomZoneId(zoneId: RoomZoneId): CanonicalRoomZoneId {
  return isLegacyZoneId(zoneId) ? LEGACY_ZONE_ALIASES[zoneId] : zoneId;
}

/**
 * Returns the manifest entry for a zone. Legacy ids (`diningRoom`, `masterBedroom`, …) resolve
 * to the modelled room that covers them, so every `RoomZoneId` yields an entry.
 */
export function getRoomManifest(zoneId: RoomZoneId): RoomManifestEntry | undefined {
  return MANIFEST_BY_ZONE.get(resolveRoomZoneId(zoneId));
}

/** Finds the room that owns a KNX circuit (e.g. to highlight a row when a fitting is clicked). */
export function getRoomForCircuit(circuitId: string): RoomManifestEntry | undefined {
  return CROX_ROOM_MANIFEST.find((e) => e.lights.some((l) => l.circuitId === circuitId));
}

export interface RoomNavGroup {
  readonly id: RoomGroup;
  readonly label: string;
  readonly rooms: readonly RoomManifestEntry[];
}

/** Grouped, ordered list for the left room navigator. */
export const ROOM_NAV_TREE: readonly RoomNavGroup[] = GROUP_ORDER.map((group) => ({
  id: group,
  label: GROUP_LABELS[group],
  rooms: CROX_ROOM_MANIFEST.filter((e) => e.group === group),
}));
