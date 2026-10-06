import * as THREE from 'three';
import type { SceneInteractionManager } from '../engine/scene/interaction-manager.ts';
import type { CircuitId, RoomMotionSensorId } from './knx.ts';
import type { BuildingId, FloorId, RoomBoundingBox, RoomZoneId } from './topology.ts';

export type TimeOfDay = 'day' | 'dusk' | 'night';

export type FloorViewMode = 'ground' | 'first' | 'all';

export type CameraPresetName =
  | 'overview'
  | 'isometric'
  | 'island'
  | 'sitting'
  | 'bifolds'
  | 'familyRoom'
  | 'familySnug'
  | 'hall'
  | 'livingRoom'
  | 'sittingRoom'
  | 'upstairs'
  | 'courtyardGates'
  | 'top';

export interface CameraPresetDefinition {
  readonly id: string;
  readonly label: string;
  readonly buildingId: BuildingId;
  readonly zoneId?: RoomZoneId;
  readonly floorViewMode?: FloorViewMode;
  readonly pos: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly useOrthographic?: boolean;
}

export interface InteractiveUserData {
  readonly isKNXSwitch?: boolean;
  readonly isCourtyardSwitch?: boolean;
  readonly isUtilitySwitch?: boolean;
  readonly isKitchenMotionSensor?: boolean;
  readonly isUtilityMotionSensor?: boolean;
  readonly roomMotionSensorId?: RoomMotionSensorId;
  readonly isFrameTV?: boolean;
  readonly isBifoldDoor?: boolean;
  readonly isCarGate?: boolean;
  readonly isUniFiCamera?: boolean;
  readonly cameraEntityId?: string;
  readonly isUniFiAccessReader?: boolean;
  readonly accessEntityId?: string;
  readonly interactableId?: string;
  readonly switchLocation?: string;
  readonly switchDirection?: 'up' | 'down';
  readonly switchPa?: string;
  readonly sensorGa?: string;
  readonly zoneId?: RoomZoneId;
  readonly zoneSceneSwitchZoneId?: RoomZoneId;
  readonly circuitId?: CircuitId;
  readonly ufhZoneId?: 'ufhZone1' | 'ufhZone2' | 'ufhZone3' | 'ufhZone4';
  readonly isKnxTempSensor?: boolean;
  readonly isClimbableLadder?: boolean;
}

export interface GlowPoolEntry {
  readonly mat: THREE.MeshBasicMaterial;
  readonly maxOpacity: number;
}

export interface LightCircuitGroup {
  readonly lights: THREE.PointLight[];
  readonly emissives: THREE.MeshStandardMaterial[];
  readonly cones: THREE.MeshBasicMaterial[];
  readonly pools: GlowPoolEntry[];
  readonly maxIntensity: number;
}

export type LightGroupMap = Record<CircuitId, LightCircuitGroup>;

export interface BifoldPanelRef {
  readonly group: THREE.Group;
  readonly closedX: number;
  readonly openX: number;
  readonly dir: number;
}

export interface CameraTweenState {
  readonly startPos: THREE.Vector3;
  readonly endPos: THREE.Vector3;
  readonly startTarget: THREE.Vector3;
  readonly endTarget: THREE.Vector3;
  elapsed: number;
  readonly duration: number;
}

export interface CutawayWallDescriptor {
  readonly axis: 'x' | 'z';
  readonly coord: number;
  readonly minSpan: number;
  readonly maxSpan: number;
  readonly floor: 'ground' | 'first';
}

export interface CutawayWallGroups {
  readonly southWest: THREE.Group;
  readonly west: THREE.Group;
  readonly north: THREE.Group;
  readonly east: THREE.Group;
}

export interface SceneBuilderContext {
  readonly scene: THREE.Scene;
  readonly firstFloorMeshGroup: THREE.Group;
  readonly groundFloorCeilingGroup: THREE.Group;
  readonly ceilingMeshGroup: THREE.Group;
  readonly ceilingCutaway: boolean;
  readonly cutawayWallGroups: CutawayWallGroups;
  readonly bifoldPanels: BifoldPanelRef[];
  readonly interactiveMeshes: THREE.Object3D[];
  readonly interactions: SceneInteractionManager;
  readonly lightGroups: LightGroupMap;
  addGlowPool(
    circuitId: CircuitId,
    x: number,
    y: number,
    z: number,
    radius: number,
    maxOpacity?: number,
    rotX?: number
  ): void;
  registerSwitchLedMaterial?(
    circuitId: CircuitId,
    mat: THREE.MeshStandardMaterial
  ): void;
}

export interface ZoneIndicatorMaterials {
  readonly wallSwitchLedMat?: THREE.MeshStandardMaterial;
  readonly courtyardSwitchLedMat?: THREE.MeshStandardMaterial;
  readonly utilitySwitchLedMat?: THREE.MeshStandardMaterial;
  readonly kitchenSensorLedMat?: THREE.MeshStandardMaterial;
  readonly utilitySensorLedMat?: THREE.MeshStandardMaterial;
  readonly tvScreenMat?: THREE.MeshStandardMaterial;
}

export interface SceneZoneModule {
  readonly id: string;
  readonly name: string;
  readonly buildingId: BuildingId;
  readonly floorId: FloorId;
  readonly zoneIds: readonly RoomZoneId[];
  readonly interiorBounds?: readonly RoomBoundingBox[];
  readonly cameraPresets?: readonly CameraPresetDefinition[];
  build(ctx: SceneBuilderContext): ZoneIndicatorMaterials;
}

export type Vec3Tuple = readonly [number, number, number];

export type AnnotationToolMode = 'pin' | 'move' | 'rotate' | 'measure';

export type AnnotationKind = 'pin' | 'move' | 'measure';

export type GizmoTransformMode = 'translate' | 'rotate';

export interface SceneCameraPoseSnapshot {
  readonly position: Vec3Tuple;
  readonly target: Vec3Tuple;
  readonly floorViewMode: FloorViewMode;
  readonly ceilingCutaway: boolean;
  readonly isOrthographic: boolean;
}

export interface SceneMeshDiagnosticInfo {
  readonly meshName: string;
  readonly parentChain: readonly string[];
  readonly geometrySummary: string;
  readonly materialSummary: string;
  readonly meshWorldCenter: Vec3Tuple;
  readonly meshBoundingBoxMin: Vec3Tuple;
  readonly meshBoundingBoxMax: Vec3Tuple;
  readonly meshBoundingBoxSize: Vec3Tuple;
  readonly cutawayWall?: CutawayWallDescriptor;
}

export interface SceneObjectTransformAnnotation {
  readonly targetUuid: string;
  readonly targetName: string;
  readonly targetPath: readonly string[];
  readonly targetKind: 'group' | 'mesh';
  readonly initialWorldCenter: Vec3Tuple;
  newWorldCenter: Vec3Tuple;
  deltaTranslation: Vec3Tuple;
  readonly initialObjectPosition: Vec3Tuple;
  newObjectPosition: Vec3Tuple;
  readonly initialRotationDeg: Vec3Tuple;
  newRotationDeg: Vec3Tuple;
  deltaRotationDeg: Vec3Tuple;
}

export interface SceneMeasurementAnnotation {
  readonly startPoint: Vec3Tuple;
  readonly startNormal: Vec3Tuple;
  readonly startMeshName: string;
  readonly endPoint: Vec3Tuple;
  readonly endNormal: Vec3Tuple;
  readonly endMeshName: string;
  readonly deltaXYZ: Vec3Tuple;
  readonly horizontalDistanceM: number;
  readonly distanceM: number;
  targetMeasurement?: string;
}

export interface LiveMeasurePreviewState {
  readonly active: boolean;
  readonly startPoint: Vec3Tuple | null;
  readonly currentEndPoint: Vec3Tuple | null;
  readonly deltaXYZ: Vec3Tuple | null;
  readonly horizontalDistanceM: number | null;
  readonly distanceM: number | null;
  readonly axisSnapLocked: boolean;
}

export interface SceneAnnotationHit {
  readonly kind?: AnnotationKind;
  readonly worldPoint: Vec3Tuple;
  readonly worldNormal: Vec3Tuple;
  readonly roomZoneId: string;
  readonly roomName: string;
  readonly meshInfo: SceneMeshDiagnosticInfo;
  readonly cameraPose: SceneCameraPoseSnapshot;
  objectTransform?: SceneObjectTransformAnnotation;
  measurement?: SceneMeasurementAnnotation;
}

export interface SceneAnnotationRecord extends SceneAnnotationHit {
  readonly id: number;
  readonly createdAt: string;
  note: string;
}


