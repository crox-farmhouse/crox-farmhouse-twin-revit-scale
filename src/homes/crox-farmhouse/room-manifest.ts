import { CROX_CENTRAL_SCENES } from './knx/central-scenes.ts';
import { CROX_CIRCUITS } from './knx/circuits.ts';
import { CROX_LIGHTING_ZONES } from './knx/zones.ts';
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
 * Joins the KNX lighting zones (`CROX_LIGHTING_ZONES`), the central scene table
 * (`CROX_CENTRAL_SCENES`), the
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
 * circuits are dimmable except switched-only channels: 5A lamp-socket circuits, the wine-cellar and
 * cloakroom PIR relays and the garage LED battens (mirrors `dimmable` in knx/circuits.ts).
 */
const CIRCUIT_PRESENTATION: Readonly<
  Record<CircuitId, { readonly label: string; readonly dimmable: boolean }>
> = {
  // Kitchen
  islandPendants: { label: 'Island pendants', dimmable: true },
  spotlights: { label: 'Ceiling downlights', dimmable: true },
  underCabinet: { label: 'Under-cabinet & hood task lights', dimmable: true },
  aboveCabinet: { label: 'Above-cabinet plinth LED strip', dimmable: true },
  // Kitchen sitting area
  sittingPendants: { label: 'Filament pendants', dimmable: true },
  bifoldUplights: { label: 'Bifold floor uplights', dimmable: true },
  // Utility
  utilitySpotlights: { label: 'Ceiling downlights', dimmable: true },
  // Courtyard & garden
  courtyardFestoons: { label: 'Festoon lights', dimmable: true },
  reclaimedLampPost: { label: 'Lamp post', dimmable: true },
  pergolaFestoons: { label: 'Grape-vine pergola festoons', dimmable: true },
  stableExternalWallLights: { label: 'Stable external wall lights', dimmable: true },
  // Dining room (familyRoom zone)
  familyRoomSpots: { label: 'Ceiling downlights', dimmable: true },
  diningPendant: { label: 'Table pendant', dimmable: true },
  diningPictureLight: { label: 'Picture light', dimmable: true },
  diningFairyLights: { label: 'Plant fairy lights', dimmable: true },
  walkInCupboardLeds: { label: 'Walk-in cupboard coat-rail LEDs', dimmable: true },
  // Boot lobby, wine cellar & cloakroom WC
  bootLobbyPendant: { label: 'Wall lights', dimmable: true },
  wineCellarLeds: { label: 'Wine cellar shelf LEDs', dimmable: false },
  cloakroomWcLights: { label: 'Cloakroom WC lights', dimmable: false },
  // Staircase hall
  hallPendant: { label: 'Wall lights', dimmable: true },
  hallStairLeds: { label: 'Stair tread step lights', dimmable: true },
  hallBeamLeds: { label: 'Fireplace beam LED strip', dimmable: true },
  hallLamps5A: { label: 'Floor lamp (5A)', dimmable: false },
  // Living room / cinema (circuit id predates the room rename)
  frontRoomPendant: { label: 'Picture lights', dimmable: true },
  livingRoomShelfLeds: { label: 'Alcove shelf LEDs', dimmable: true },
  livingRoomTvBacklight: { label: 'TV bias light', dimmable: true },
  livingRoomWallLights: { label: 'Wall lights', dimmable: true },
  livingRoomDownlights: { label: 'Ceiling downlights', dimmable: true },
  // Entrance hall
  entranceHallPendant: { label: 'Glass lantern pendant', dimmable: true },
  entranceHallUplights: { label: 'Floor uplights', dimmable: true },
  // Sitting room (circuit id predates the room rename)
  livingRoomPendant: { label: 'Wall sconces', dimmable: true },
  sittingRoomShelfLeds: { label: 'Alcove shelf LEDs', dimmable: true },
  sittingRoomLamps5A: { label: 'Table & floor lamps (5A)', dimmable: false },
  // Plant room (zone id `study`)
  studyPendant: { label: 'LED battens', dimmable: true },
  // First floor (actuator 1.2.20)
  mainBedroomPendant: { label: 'Ceiling pendant', dimmable: true },
  familyBathroomPendant: { label: 'Glass pendant', dimmable: true },
  upperLandingPendant: { label: 'Stairwell & landing pendants', dimmable: true },
  upperLandingSconces: { label: 'Landing wall sconces', dimmable: true },
  bedroom2Pendant: { label: 'Ceiling pendant', dimmable: true },
  bedroom3Pendant: { label: 'Pendant (bedroom & shower room)', dimmable: true },
  bedroom4Pendant: { label: 'Ceiling pendant', dimmable: true },
  // Gym
  gymSpotsAndBattens: { label: 'LED battens', dimmable: true },
  gymTrussSpots: { label: 'Truss spotlights', dimmable: true },
  gymWallAndCoveLights: { label: 'Wall sconces', dimmable: true },
  gymCoveLeds: { label: 'Eave cove LEDs', dimmable: true },
  gymMirrorBacklights: { label: 'Mirror backlights', dimmable: true },
  // Garage & workshop
  garageHighBayLights: { label: 'LED battens', dimmable: false },
  garageTrussSpots: { label: 'Truss spotlights', dimmable: true },
  garageBenchAndShower: { label: 'Workbench task lights', dimmable: true },
  garageShowerLights: { label: 'Shower room lights', dimmable: true },
  // Store
  storeLoftLeds: { label: 'Loft LED strips', dimmable: true },
  // Barn & golf sim
  barnTrussAndSimHalo: { label: 'Truss spots & downlights', dimmable: true },
  golfSimHalo: { label: 'Golf simulator LED halo', dimmable: true },
  barnCoveLeds: { label: 'Bressummer & wall cove LEDs', dimmable: true },
  barnWallSconces: { label: 'Wall sconces', dimmable: true },
  barnPictureLights: { label: 'Picture lights', dimmable: true },
  barnPoolTableLight: { label: 'Pool table canopy light', dimmable: true },
  barnStairLeds: { label: 'Spiral stair tread LEDs', dimmable: true },
  barnBarsAndLamps5A: { label: 'Bar lamps (5A)', dimmable: false },
  // Mezzanine retro lounge
  mezzanineDownlights: { label: 'Downlights & ceiling light', dimmable: true },
  mezzanineSconcesAndAmbient: { label: 'Wall sconces', dimmable: true },
  mezzanineBookcaseLight: { label: 'Bookcase light', dimmable: true },
  mezzanineLamps5A: { label: 'Lamps (5A)', dimmable: false },
  // Office
  stableOfficeSpotlights: { label: 'Ceiling downlights', dimmable: true },
  stableOfficeWallsAndLamps5A: { label: 'Wall sconces', dimmable: true },
  stableOfficeLamps5A: { label: 'Desk & floor lamps (5A)', dimmable: false },
  stableCloakroomLights: { label: 'Cloakroom WC lights', dimmable: true },
  // Guest suite
  stableSuiteDownlights: { label: 'Vaulted downlights', dimmable: true },
  stableSuiteLamps5A: { label: 'Bedside & dressing lamps (5A)', dimmable: false },
  stableEnsuiteLights: { label: 'Ensuite lights', dimmable: true },
  stableBalconyLights: { label: 'Balcony wall lights', dimmable: true },
};

/** Lights for a zone in the zone's layer order (falls back to the circuits' own zone). */
function lightsFor(zoneId: CanonicalRoomZoneId): readonly RoomLightControl[] {
  const zone = CROX_LIGHTING_ZONES.find((z) => z.id === zoneId);
  const circuits = zone
    ? zone.circuits.flatMap((id) => CROX_CIRCUITS.filter((c) => c.id === id))
    : CROX_CIRCUITS.filter((c) => c.zoneId === zoneId);
  return circuits.map((c) => ({
    circuitId: c.id,
    label: CIRCUIT_PRESENTATION[c.id].label,
    dimmable: CIRCUIT_PRESENTATION[c.id].dimmable,
  }));
}

/**
 * KNX scenes (group 1/0/1, DPT 17.001). `sceneNumber` is the 0-based scene value that
 * `KNXPropertyBusController.recallScene(sceneNumber, pa)` expects (it indexes `CROX_CENTRAL_SCENES`
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
const KITCHEN_SCENES: readonly RoomSceneControl[] = CROX_CENTRAL_SCENES.map(toSceneControl);

/** Scenes that also set the courtyard festoons / lamp post (`outdoorLevels` with lights on). */
const COURTYARD_SCENES: readonly RoomSceneControl[] = CROX_CENTRAL_SCENES.filter(
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
 * Device interactable ids, all accepted by `scene.handleInteractableClick(id)`:
 * - stable ids derived from scene-graph names by the interaction registry
 *   (`door:<name>`, `toggle:<name>`, see `engine/interaction/device-ids.ts`); never use the
 *   build-order `door-N` ids here, they shift whenever a zone adds or removes a door
 * - fixed ids `pulley-maid`, `golf-simulator-shot`, `pool-table-break` and the `garage-door` group
 * - KNX-backed pseudo-devices `car-gates`, `kitchen-bifolds`, `frame-tv` (routed through the
 *   same path as clicking the device, so the KNX bus state stays in sync)
 */
const ROOM_SPECS: Readonly<Record<CanonicalRoomZoneId, RoomSpec>> = {
  // --- Main house · ground floor -------------------------------------------------------
  entranceHall: {
    label: 'Entrance hall',
    group: 'house-ground',
    floor: 'ground',
    devices: [{ interactableId: 'door:entranceHall.frontDoor', label: 'Front door' }],
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
  study: { label: 'Plant room', group: 'house-ground', floor: 'ground' },
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
    devices: [
      {
        interactableId: 'door:groundFloor.eastWing.cutaway.southWest@-9.3,3.6',
        label: 'Courtyard door',
      },
      {
        interactableId: 'toggle:familyRoom.neptuneWycombeDiningTable',
        label: 'Extend / retract dining table',
      },
    ],
    ufhZoneId: 'ufhZone4',
  },
  kitchen: {
    label: 'Kitchen',
    group: 'house-ground',
    floor: 'ground',
    scenes: KITCHEN_SCENES,
    devices: [{ interactableId: 'frame-tv', label: 'Frame TV: next artwork' }],
    ufhZoneId: 'ufhZone4',
  },
  sitting: {
    label: 'Kitchen sitting area',
    group: 'house-ground',
    floor: 'ground',
    scenes: KITCHEN_SCENES,
    devices: [{ interactableId: 'kitchen-bifolds', label: 'Bifold doors' }],
    ufhZoneId: 'ufhZone4',
  },
  utility: {
    label: 'Utility room',
    group: 'house-ground',
    floor: 'ground',
    devices: [
      { interactableId: 'pulley-maid', label: 'Pulley maid airer' },
      { interactableId: 'door:utility.stableDoor.lowerLeafGroup', label: 'Stable door' },
    ],
    ufhZoneId: 'ufhZone4',
  },
  // --- Main house · first floor --------------------------------------------------------
  upperLanding: { label: 'Landing', group: 'house-first', floor: 'first' },
  mainBedroom: {
    label: 'Main bedroom',
    group: 'house-first',
    floor: 'first',
    devices: [{ interactableId: 'door:mainBedroom.entranceDoor', label: 'Bedroom door' }],
  },
  familyBathroom: {
    label: 'Family bathroom',
    group: 'house-first',
    floor: 'first',
    devices: [{ interactableId: 'door:familyBathroom.door', label: 'Bathroom door' }],
  },
  bedroom2: {
    label: 'Bedroom 2',
    group: 'house-first',
    floor: 'first',
    devices: [{ interactableId: 'door:bedroom2.southWall@-22.1,1.9', label: 'Bedroom door' }],
  },
  bedroom3: { label: 'Bedroom 3 & shower room', group: 'house-first', floor: 'first' },
  bedroom4: {
    label: 'Bedroom 4',
    group: 'house-first',
    floor: 'first',
    devices: [{ interactableId: 'door:bedroom4.entranceDoor', label: 'Bedroom door' }],
  },
  // --- Barn & outbuildings -------------------------------------------------------------
  outbuildingBarn: {
    label: 'Barn & golf sim',
    group: 'outbuildings',
    floor: 'ground',
    devices: [
      { interactableId: 'golf-simulator-shot', label: 'Golf simulator: take a shot' },
      { interactableId: 'pool-table-break', label: 'Pool table: break / re-rack' },
      {
        interactableId: 'door:outbuildings.barn.golfSimulator.turfMat.foldingLeaf',
        label: 'Golf simulator: stow / roll out mat',
      },
    ],
  },
  outbuildingMezzanine: { label: 'Barn mezzanine', group: 'outbuildings', floor: 'first' },
  outbuildingGym: {
    label: 'Gym',
    group: 'outbuildings',
    floor: 'ground',
    devices: [
      { interactableId: 'gym-treadmill-run', label: 'Treadmill: 1P interval run' },
      { interactableId: 'gym-bench-press', label: 'Squat rack: 1P bench press' },
    ],
  },
  outbuildingGarage: {
    label: 'Garage & workshop',
    group: 'outbuildings',
    floor: 'ground',
    devices: [{ interactableId: 'garage-door', label: 'Garage doors' }],
  },
  outbuildingStore: { label: 'Store', group: 'outbuildings', floor: 'ground' },
  outbuildingStableOffice: { label: 'Office', group: 'outbuildings', floor: 'ground' },
  outbuildingStableSuite: { label: 'Stable guest suite', group: 'outbuildings', floor: 'first' },
  // --- Garden & courtyard --------------------------------------------------------------
  courtyard: {
    label: 'Courtyard & driveway',
    group: 'grounds',
    floor: 'ground',
    scenes: COURTYARD_SCENES,
    devices: [{ interactableId: 'car-gates', label: 'Car gates' }],
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
    'outbuildingStore',
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
