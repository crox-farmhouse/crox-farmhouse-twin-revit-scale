import * as THREE from 'three';
import { ROOM_ZONES } from '../../integrations/knx/topology.ts';
import type {
  CameraPresetDefinition,
  SceneBuilderContext,
  SceneZoneModule,
  ZoneIndicatorMaterials,
} from '../../core/types/scene.ts';
import { createScopedBuilderContext } from '../../engine/viewer/scene-content.ts';
import { SceneZoneRegistry } from '../../engine/viewer/scene-zone-registry.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingPoint,
} from './structure/ground-floor-materials.ts';
import { buildMainHouseFirstFloorAndRoof } from './rooms/first/index.ts';
import { buildMainHouseGroundFloorRooms } from './rooms/ground/index.ts';
import { buildLargeBlueIslandWithLeftSink } from './rooms/ground/kitchen-island.ts';
import { buildWrapAroundDoveGreyKitchenAGAAndCoffeeCorner } from './rooms/ground/kitchen-cabinetry.ts';
import {
  buildFiveKNXLightingCircuits,
  buildKitchenAndUtilityMotionSensors,
  buildUtilityKNXSwitch,
  buildWallKNXSwitch,
} from './rooms/ground/kitchen-knx-lighting.ts';
import { buildArchitecturalShellAndUtilityRoom } from './rooms/ground/kitchen-shell-and-utility.ts';
import { buildSittingAreaAndOakBifolds } from './rooms/ground/kitchen-sitting-and-bifolds.ts';

/**
 * Default Camera Presets for the Crox Farmhouse East Wing (Kitchen, Sitting, Utility & Courtyard).
 * Additional rooms or buildings (e.g. Hallway, First Floor, Annex) can register their own presets.
 */
export const DEFAULT_CAMERA_PRESETS: readonly CameraPresetDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    buildingId: 'mainHouse',
    zoneId: 'kitchen',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(0.4, 7.8, 10.6),
    target: transformEastWingPoint(-1.2, 1.05, 0.2),
  },
  {
    id: 'isometric',
    label: 'Isometric',
    buildingId: 'mainHouse',
    zoneId: 'kitchen',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(9.2, 9.4, 9.4),
    target: transformEastWingPoint(0.5, 0.85, 0.5),
    useOrthographic: true,
  },
  {
    id: 'island',
    label: 'Kitchen & AGA',
    buildingId: 'mainHouse',
    zoneId: 'kitchen',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(-2.4, 2.15, 2.4),
    target: transformEastWingPoint(-0.2, 1.15, -1.35),
  },
  {
    id: 'sitting',
    label: 'Sitting & TV',
    buildingId: 'mainHouse',
    zoneId: 'sitting',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(0.85, 1.95, -0.15),
    target: transformEastWingPoint(3.15, 0.85, 1.5),
  },
  {
    id: 'bifolds',
    label: 'Bifolds',
    buildingId: 'courtyardGrounds',
    zoneId: 'courtyard',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(0.65, 1.35, 1.4),
    target: transformEastWingPoint(3.1, 0.65, 2.0),
  },
  {
    id: 'familyRoom',
    label: 'Dining Room',
    buildingId: 'mainHouse',
    zoneId: 'familyRoom',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(-8.8, 4.6, 5.2),
    target: transformEastWingPoint(-6.6, 0.85, -0.35),
  },
  {
    id: 'familySnug',
    label: 'Dining Alcove (Eye)',
    buildingId: 'mainHouse',
    zoneId: 'familyRoom',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(-8.85, 1.38, 1.75),
    target: transformEastWingPoint(-5.85, 1.05, -1.25),
  },
  {
    id: 'hall',
    label: 'Hall & Boot Lobby',
    buildingId: 'mainHouse',
    zoneId: 'hall',
    floorViewMode: 'ground',
    pos: transformEastWingPoint(-13.4, 4.4, 5.2),
    target: transformEastWingPoint(-14.8, 0.75, -0.65),
  },
  {
    id: 'livingRoom',
    label: 'Living Room',
    buildingId: 'mainHouse',
    zoneId: 'livingRoom',
    floorViewMode: 'ground',
    pos: new THREE.Vector3(-16.2, 5.4, 4.5),
    target: new THREE.Vector3(-19.8, 0.85, -0.3),
  },
  {
    id: 'sittingRoom',
    label: 'Sitting & Study',
    buildingId: 'mainHouse',
    zoneId: 'sittingRoom',
    floorViewMode: 'ground',
    pos: new THREE.Vector3(-14.2, 6.2, 10.5),
    target: new THREE.Vector3(-19.8, 0.85, 7.5),
  },
  {
    id: 'upstairs',
    label: '1st Floor Rooms',
    buildingId: 'mainHouse',
    zoneId: 'mainBedroom',
    floorViewMode: 'first',
    pos: transformEastWingPoint(-11.5, 11.2, 10.8),
    target: transformEastWingPoint(-13.8, 2.8, 1.8),
  },
  {
    id: 'courtyardGates',
    label: 'Gates & Courtyard',
    buildingId: 'courtyardGrounds',
    zoneId: 'courtyard',
    floorViewMode: 'all',
    pos: new THREE.Vector3(-28.5, 5.2, 18.2),
    target: new THREE.Vector3(-16.5, 1.8, 10.2),
  },
  {
    id: 'top',
    label: 'Floor Plan',
    buildingId: 'mainHouse',
    floorViewMode: 'ground',
    pos: new THREE.Vector3(-8.5, 24.5, 3.01),
    target: new THREE.Vector3(-8.5, 0.0, 3.0),
  },
];

/**
 * Zone Module 1: Main House Ground Floor Architectural Shell & NE Utility Room (`1.1.x`)
 */
export const ArchitecturalShellAndUtilityZoneModule: SceneZoneModule = {
  id: 'mainHouse.ground.shellAndUtility',
  name: 'Architectural Shell & NE Utility Room',
  buildingId: 'mainHouse',
  floorId: 'ground',
  zoneIds: ['kitchen', 'sitting', 'utility'],
  interiorBounds: [
    ROOM_ZONES.kitchen.bounds,
    ROOM_ZONES.sitting.bounds,
    ROOM_ZONES.utility.bounds,
  ],
  cameraPresets: DEFAULT_CAMERA_PRESETS,
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    const eastWingCtx = createScopedBuilderContext(ctx, {
      name: 'mainEastWing.shellAndUtility',
      offset: MAIN_EAST_WING_OFFSET,
      rotationY: MAIN_EAST_WING_ROTATION_Y,
    });
    const tvScreenMat = buildArchitecturalShellAndUtilityRoom(eastWingCtx);
    return { tvScreenMat };
  },
};

/**
 * Zone Module 1B: Main House Ground Floor Additional Rooms (Dining Room, Boot Lobby, Store, WC, Hall, Living Room, Entrance Hall, Sitting Room, Study)
 */
export const MainHouseGroundFloorRoomsZoneModule: SceneZoneModule = {
  id: 'mainHouse.ground.additionalRooms',
  name: 'Main House Ground Floor Rooms (Dining, Hall, Living, Sitting, Study)',
  buildingId: 'mainHouse',
  floorId: 'ground',
  zoneIds: [
    'familyRoom',
    'bootLobby',
    'hall',
    'livingRoom',
    'entranceHall',
    'sittingRoom',
    'study',
  ],
  interiorBounds: [
    ROOM_ZONES.familyRoom.bounds,
    ROOM_ZONES.bootLobby.bounds,
    ROOM_ZONES.hall.bounds,
    ROOM_ZONES.livingRoom.bounds,
    ROOM_ZONES.entranceHall.bounds,
    ROOM_ZONES.sittingRoom.bounds,
    ROOM_ZONES.study.bounds,
  ],
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    buildMainHouseGroundFloorRooms(ctx);
    return {};
  },
};

/**
 * Zone Module 1C: Main House First Floor (Upstairs Bedrooms 1–4, Bathrooms, Upper Landing) & Coplanar L-Plan Welsh Slate Roof
 */
export const MainHouseFirstFloorZoneModule: SceneZoneModule = {
  id: 'mainHouse.first.roomsAndRoof',
  name: 'Main House First Floor (Main Bedroom, Family Bathroom, Landing, Bedrooms 2–4 & L-Plan Roof)',
  buildingId: 'mainHouse',
  floorId: 'first',
  zoneIds: [
    'mainBedroom',
    'familyBathroom',
    'upperLanding',
    'bedroom2',
    'bedroom3',
    'bedroom4',
  ],
  interiorBounds: [
    ROOM_ZONES.mainBedroom.bounds,
    ROOM_ZONES.familyBathroom.bounds,
    ROOM_ZONES.upperLanding.bounds,
    ROOM_ZONES.bedroom2.bounds,
    ROOM_ZONES.bedroom3.bounds,
    ROOM_ZONES.bedroom4.bounds,
  ],
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    buildMainHouseFirstFloorAndRoof(ctx);
    return {};
  },
};

/**
 * Zone Module 2: Farmhouse Kitchen Cabinetry, AGA Range, Pantry & Hague Blue Island (`1.1.x`)
 */
export const KitchenCabinetryAndIslandZoneModule: SceneZoneModule = {
  id: 'mainHouse.ground.kitchenCabinetryAndIsland',
  name: 'Farmhouse Kitchen Cabinetry, AGA & Island',
  buildingId: 'mainHouse',
  floorId: 'ground',
  zoneIds: ['kitchen'],
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    const eastWingCtx = createScopedBuilderContext(ctx, {
      name: 'mainEastWing.kitchenCabinetryAndIsland',
      offset: MAIN_EAST_WING_OFFSET,
      rotationY: MAIN_EAST_WING_ROTATION_Y,
    });
    buildWrapAroundDoveGreyKitchenAGAAndCoffeeCorner(eastWingCtx);
    buildLargeBlueIslandWithLeftSink(eastWingCtx);
    return {};
  },
};

/**
 * Zone Module 3: Vaulted Sitting Area, 4-Leaf Oak Bifolds & South Cobbled Courtyard (`1.1.x`)
 */
export const SittingAndCourtyardZoneModule: SceneZoneModule = {
  id: 'mainHouse.ground.sittingAndCourtyard',
  name: 'Sitting Area, Oak Bifolds & Cobbled Courtyard',
  buildingId: 'mainHouse',
  floorId: 'ground',
  zoneIds: ['sitting', 'courtyard'],
  interiorBounds: [
    // Outbuilding Bay 1: GYM (`u = 0.28..5.77m`)
    { minX: -22.25, maxX: -16.25, minY: -0.65, maxY: 3.4, minZ: 15.65, maxZ: 21.4 },
    // Outbuilding Bay 2: Garage (`u = 5.97..12.07m`)
    { minX: -16.55, maxX: -9.95, minY: -0.55, maxY: 3.4, minZ: 15.1, maxZ: 20.9 },
    // Outbuilding Bay 3: Store (`u = 12.31..14.96m`)
    { minX: -10.2, maxX: -7.1, minY: -0.45, maxY: 4.5, minZ: 14.85, maxZ: 20.4 },
    // Outbuilding Bay 4: Barn & Mezzanine (`u = 15.20..23.02m`)
    { minX: -7.3, maxX: 0.95, minY: -0.75, maxY: 4.5, minZ: 14.15, maxZ: 20.15 },
    // Outbuilding Bay 5: 2-Storey Stable (`u = 23.22..28.77m`)
    { minX: 0.65, maxX: 6.7, minY: -0.5, maxY: 4.95, minZ: 13.65, maxZ: 19.45 },
  ],
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    const eastWingCtx = createScopedBuilderContext(ctx, {
      name: 'mainEastWing.sittingAndCourtyard',
      offset: MAIN_EAST_WING_OFFSET,
      rotationY: MAIN_EAST_WING_ROTATION_Y,
    });
    buildSittingAreaAndOakBifolds(eastWingCtx);
    return {};
  },
};

/**
 * Zone Module 4: KNX Lighting Circuits, Corston Brass Switches & Ceiling PIR/Lux Sensors (`1.1.x`)
 */
export const KNXLightingAndDevicesZoneModule: SceneZoneModule = {
  id: 'mainHouse.ground.knxDevicesAndLighting',
  name: 'KNX Lighting Fixtures, Switches & Presence Sensors',
  buildingId: 'mainHouse',
  floorId: 'ground',
  zoneIds: ['kitchen', 'sitting', 'utility', 'courtyard'],
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    const eastWingCtx = createScopedBuilderContext(ctx, {
      name: 'mainEastWing.knxDevicesAndLighting',
      offset: MAIN_EAST_WING_OFFSET,
      rotationY: MAIN_EAST_WING_ROTATION_Y,
    });
    buildFiveKNXLightingCircuits(eastWingCtx);
    const wallSwitchMats = buildWallKNXSwitch(eastWingCtx);
    const utilitySwitchLedMat = buildUtilityKNXSwitch(eastWingCtx);
    const sensorMats = buildKitchenAndUtilityMotionSensors(eastWingCtx);
    return {
      wallSwitchLedMat: wallSwitchMats.wallSwitchLedMat,
      courtyardSwitchLedMat: wallSwitchMats.courtyardSwitchLedMat,
      utilitySwitchLedMat,
      kitchenSensorLedMat: sensorMats.kitchenSensorLedMat,
      utilitySensorLedMat: sensorMats.utilitySensorLedMat,
    };
  },
};

/**
 * Crox Farmhouse zone registry: the generic engine registry pre-loaded with every
 * Crox Farmhouse zone module (Main House + Annex + Grounds).
 */
export class PropertySceneRegistry extends SceneZoneRegistry {
  public constructor(initialModules: readonly SceneZoneModule[] = DEFAULT_PROPERTY_ZONE_MODULES) {
    super(initialModules);
  }
}

export const DEFAULT_PROPERTY_ZONE_MODULES: readonly SceneZoneModule[] = [
  ArchitecturalShellAndUtilityZoneModule,
  MainHouseGroundFloorRoomsZoneModule,
  MainHouseFirstFloorZoneModule,
  KitchenCabinetryAndIslandZoneModule,
  SittingAndCourtyardZoneModule,
  KNXLightingAndDevicesZoneModule,
];
