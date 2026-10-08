import * as THREE from 'three';
import type {
  HeatingEnvironmentConfig,
  HeatingStartMode,
  RoomThermalProfile,
  ThermalWarmupEstimate,
  UfhSystemOverlay3D,
  UfhZoneId,
  UfhZoneState,
} from '../../../engine/viewer/property-scene-profile.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
} from '../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../core/types/scene.ts';
import type { RoomZoneId } from '../../../core/types/topology.ts';
import {
  ROOM_THERMAL_PROFILES,
  cloneMaterialAsXray,
  computeWarmupEstimateFromParams,
  createInitialUfhZones,
  populateUfhZonesAndPrimaryMains,
  type FloorXrayEntry,
} from './ufh/ufh-zone-definitions.ts';

export type {
  HeatingEnvironmentConfig,
  HeatingStartMode,
  RoomThermalProfile,
  ThermalWarmupEstimate,
  UfhZoneId,
  UfhZoneState,
};

export type CroxUfhSystemHandle = UfhSystemOverlay3D;

/**
 * Builds the Crox Farmhouse 4-Zone Heating Layer (Zones 1 & 2 Cast-Iron Radiator Circuits
 * in the two front rooms + Zones 3 & 4 Underfloor Heating Pipework across the Hall, Boot Lobby,
 * WC, Walk-In Cupboard, Dining Room, Kitchen & Utility Room) and synchronizes it with both
 * the Plant Room Manifold (`plantRoom.heatingManifold`) and the Understairs Cupboard
 * Secondary Manifold (`hall.understairsManifold`).
 */
export function buildCroxUnderfloorHeatingSystem(
  ctx: SceneBuilderContext
): CroxUfhSystemHandle {
  const { scene, interactiveMeshes } = ctx;

  const rootGroup = new THREE.Group();
  rootGroup.name = 'ufh.heatingPipesLayer';
  rootGroup.userData = { isArchitecturalShell: true, lodIgnore: true };
  rootGroup.visible = false; // Hidden until user toggles the Heating Pipes layer on
  scene.add(rootGroup);

  // Scoped East-West Wing UFH container (rotates and translates Loops 2–8 with the East-West Wing)
  const eastWingUfhGroup = new THREE.Group();
  eastWingUfhGroup.name = 'ufh.eastWingContainer';
  eastWingUfhGroup.position.set(...MAIN_EAST_WING_OFFSET);
  eastWingUfhGroup.rotation.y = MAIN_EAST_WING_ROTATION_Y;
  rootGroup.add(eastWingUfhGroup);


  const zones: UfhZoneState[] = createInitialUfhZones();
  const pipeMats = new Map<UfhZoneId, THREE.MeshStandardMaterial>();
  const bedMats = new Map<UfhZoneId, THREE.MeshBasicMaterial>();

  for (const z of zones) {
    const pMat = new THREE.MeshStandardMaterial({
      color: z.heatingOn ? 0xff2416 : 0x1878ff,
      emissive: z.heatingOn ? 0xe61c0e : 0x0b4ec4,
      emissiveIntensity: z.heatingOn ? 0.86 : 0.72,
      roughness: 0.25,
      metalness: 0.08,
    });
    const bMat = new THREE.MeshBasicMaterial({
      color: z.heatingOn ? 0xff2b1a : 0x1878ff,
      transparent: true,
      opacity: z.heatingOn ? 0.15 : 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    pipeMats.set(z.id, pMat);
    bedMats.set(z.id, bMat);
  }

  // Primary 28mm insulated distribution trunk materials (Plant Room -> Manifold A -> Manifold B)
  const primaryFlowTrunkMat = new THREE.MeshStandardMaterial({
    color: 0xff3318,
    emissive: 0xd92008,
    emissiveIntensity: 0.9,
    roughness: 0.22,
    metalness: 0.2,
  });
  const primaryReturnTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x2288ff,
    emissive: 0x0d52cc,
    emissiveIntensity: 0.75,
    roughness: 0.22,
    metalness: 0.2,
  });


  populateUfhZonesAndPrimaryMains(
    rootGroup,
    eastWingUfhGroup,
    pipeMats,
    bedMats,
    primaryFlowTrunkMat,
    primaryReturnTrunkMat,
    interactiveMeshes
  );

  // =========================================================================
  // CAST-IRON RADIATOR RED/BLUE HIGHLIGHTING FOR FRONT 2 ROOMS (ZONES 1 & 2)
  // =========================================================================
  interface RadiatorMeshEntry {
    readonly mesh: THREE.Mesh;
    readonly zoneId: UfhZoneId;
    readonly originalMaterial: THREE.Material | THREE.Material[];
  }
  let radiatorMeshEntries: RadiatorMeshEntry[] | null = null;

  const ensureRadiatorMeshEntries = (): RadiatorMeshEntry[] => {
    if (radiatorMeshEntries) return radiatorMeshEntries;
    const entries: RadiatorMeshEntry[] = [];
    const radBindings: ReadonlyArray<readonly [string, UfhZoneId]> = [
      ['sittingRoom.castIronRadiator.westBay', 'ufhZone1'],
      ['sittingRoom.castIronRadiator.eastWall', 'ufhZone1'],
      ['livingRoom.castIronRadiator.westBay', 'ufhZone2'],
      ['livingRoom.castIronRadiator.eastWall', 'ufhZone2'],
    ];
    for (const [radName, zoneId] of radBindings) {
      const radObj = scene.getObjectByName(radName);
      if (!radObj) continue;
      radObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = { ...child.userData, ufhZoneId: zoneId };
          interactiveMeshes.push(child);
          entries.push({
            mesh: child,
            zoneId,
            originalMaterial: child.material,
          });
        }
      });
    }
    radiatorMeshEntries = entries;
    return entries;
  };

  const syncRadiatorMaterials = (visible: boolean): void => {
    const entries = ensureRadiatorMeshEntries();
    for (const entry of entries) {
      if (!visible) {
        entry.mesh.material = entry.originalMaterial;
      } else {
        const zMat = pipeMats.get(entry.zoneId);
        if (zMat) {
          entry.mesh.material = zMat;
        }
      }
    }
  };

  // =========================================================================
  // X-RAY TRANSLUCENT FLOOR & RUG CONTROLLER (active when UFH Layer is visible)
  // =========================================================================
  let floorXrayEntries: FloorXrayEntry[] | null = null;

  const ensureFloorXrayEntries = (): FloorXrayEntry[] => {
    if (floorXrayEntries) return floorXrayEntries;
    const entries: FloorXrayEntry[] = [];
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      // Do not touch UFH layer meshes or annotation markers
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (
          cur === rootGroup ||
          cur.userData?.isAnnotationGroup ||
          cur.name === 'hall.stairs'
        ) {
          return;
        }
        cur = cur.parent;
      }

      const name = obj.name;
      const isNamedGroundFloorOrRug =
        name === 'entranceHall.floor' ||
        name === 'bootLobby.floor' ||
        name === 'bootLobby.downstairsWc.marbleFloor' ||
        name === 'familyRoom.walkInCupboard.checkerTileFloor' ||
        name.startsWith('hall.roundRug') ||
        name.startsWith('familyRoom.diningRug');

      box.setFromObject(obj);
      box.getSize(size);
      box.getCenter(center);

      // Ground-floor slabs have thin vertical height (0.004m..0.13m), large horizontal footprint,
      // and sit at one of the three Ground Floor tiers (-0.64m, -0.34m, or -0.06m..+0.01m) inside the house
      const isGroundFloorSlabByBounds =
        size.y >= 0.003 &&
        size.y <= 0.135 &&
        size.x >= 1.2 &&
        size.z >= 1.2 &&
        center.y >= -0.67 &&
        center.y <= 0.025 &&
        center.x >= -23.0 &&
        center.x <= 5.2 &&
        center.z >= -2.65 &&
        center.z <= 11.6;

      if (isNamedGroundFloorOrRug || isGroundFloorSlabByBounds) {
        const origMat = obj.material;
        const opacity = size.y < 0.025 ? 0.16 : 0.24;
        const xrayMat = Array.isArray(origMat)
          ? origMat.map((m) => cloneMaterialAsXray(m, opacity))
          : cloneMaterialAsXray(origMat, opacity);
        entries.push({
          mesh: obj,
          originalMaterial: origMat,
          xrayMaterial: xrayMat,
        });
      }
    });

    floorXrayEntries = entries;
    return entries;
  };

  const setActuatorIndicatorColor = (obj: THREE.Object3D | undefined, isOn: boolean): void => {
    if (!(obj instanceof THREE.Mesh) || !(obj.material instanceof THREE.MeshStandardMaterial)) {
      return;
    }
    if (!obj.userData?.ufhClonedMat) {
      obj.material = obj.material.clone();
      obj.userData = { ...obj.userData, ufhClonedMat: true };
    }
    const mat = obj.material as THREE.MeshStandardMaterial;
    mat.color.setHex(isOn ? 0xff3b1f : 0x1878ff);
    mat.emissive.setHex(isOn ? 0xe62600 : 0x0b4ec4);
    mat.emissiveIntensity = isOn ? 0.95 : 0.75;
  };

  // Sync manifold actuator caps on Plant Room Manifold, Manifold A (Understairs), and Manifold B (Boot Room)
  const syncManifoldActuatorLeds = (): void => {
    const z1On = zones[0].heatingOn;
    const z2On = zones[1].heatingOn;
    const z3On = zones[2].heatingOn;
    const z4On = zones[3].heatingOn;

    // Plant Room Manifold ports 1–2 (Z1 Radiators), 3–4 (Z2 Radiator), 5 (Z3 Entrance Hall)
    const plantPortStates = [z1On, z1On, z2On, z2On, z3On, z1On, z2On, z3On, z4On, z4On];
    for (let p = 0; p < plantPortStates.length; p++) {
      const cap = scene.getObjectByName(
        `plantRoom.heatingManifold.zoneActuator.${p + 1}.statusCap`
      );
      setActuatorIndicatorColor(cap, plantPortStates[p]);
    }

    // Manifold A (`hall.understairsManifold`) Ports 1–4 (Z3 UFH: Entrance Hall, Main Hall S/NE, WC & Boot Lobby)
    const understairsPortStates = [z3On, z3On, z3On, z3On];
    for (let p = 0; p < understairsPortStates.length; p++) {
      const isOn = understairsPortStates[p];
      for (const objName of [
        `hall.understairsManifold.zoneActuator.${p + 1}.statusCap`,
        `hall.understairsManifold.wiringLed.${p + 1}`,
      ]) {
        setActuatorIndicatorColor(scene.getObjectByName(objName), isOn);
      }
    }

    // Manifold B (`familyRoom.bootRoomManifold`) Ports 1–3 (Z4 Utility/Sitting, Kitchen, Dining/Snug) + Port 4 (Z3 Boot Room)
    const bootRoomPortStates = [z4On, z4On, z4On, z3On];
    for (let p = 0; p < bootRoomPortStates.length; p++) {
      const isOn = bootRoomPortStates[p];
      for (const objName of [
        `familyRoom.bootRoomManifold.zoneActuator.${p + 1}.statusCap`,
        `familyRoom.bootRoomManifold.wiringLed.${p + 1}`,
      ]) {
        setActuatorIndicatorColor(scene.getObjectByName(objName), isOn);
      }
    }

    // Update primary 28mm trunk line between Plant Room, Manifold A, and Manifold B
    const anySecondaryOn = z3On || z4On;
    primaryFlowTrunkMat.color.setHex(anySecondaryOn ? 0xff3318 : 0x1878ff);
    primaryFlowTrunkMat.emissive.setHex(anySecondaryOn ? 0xd92008 : 0x0b4ec4);
  };

  let layerVisible = false;

  const updateZoneMaterials = (zone: UfhZoneState): void => {
    const pMat = pipeMats.get(zone.id);
    const bMat = bedMats.get(zone.id);
    if (pMat) {
      pMat.color.setHex(zone.heatingOn ? 0xff2416 : 0x1878ff);
      pMat.emissive.setHex(zone.heatingOn ? 0xe61c0e : 0x0b4ec4);
      pMat.emissiveIntensity = zone.heatingOn ? 0.86 : 0.72;
    }
    if (bMat) {
      bMat.color.setHex(zone.heatingOn ? 0xff2b1a : 0x1878ff);
      bMat.opacity = zone.heatingOn ? 0.15 : 0.11;
    }
    syncManifoldActuatorLeds();
    if (layerVisible) {
      syncRadiatorMaterials(true);
    }
  };

  let envConfig: HeatingEnvironmentConfig = {
    outdoorTempC: 5,
    startMode: 'setback',
  };

  const listeners = new Set<() => void>();
  const notifyListeners = (): void => {
    for (const cb of listeners) {
      cb();
    }
  };

  const getRoomThermalProfile = (roomZoneId: RoomZoneId): RoomThermalProfile | undefined =>
    ROOM_THERMAL_PROFILES.find((p) => p.roomZoneId === roomZoneId);

  const getRoomWarmupEstimate = (roomZoneId: RoomZoneId): ThermalWarmupEstimate | undefined => {
    const profile = getRoomThermalProfile(roomZoneId);
    if (!profile) return undefined;
    const startTempC =
      envConfig.startMode === 'setback' ? profile.setbackStartTempC : profile.coldStartTempC;
    return computeWarmupEstimateFromParams(
      startTempC,
      profile.targetTempC,
      envConfig.outdoorTempC,
      profile.emitterOutputW,
      profile.heatLossWPerK,
      profile.thermalCapacitanceWhPerK,
      profile.emitterLagMinutes
    );
  };

  const getZoneWarmupEstimate = (zoneId: UfhZoneId): ThermalWarmupEstimate => {
    const zoneProfiles = ROOM_THERMAL_PROFILES.filter((p) => p.ufhZoneId === zoneId);
    if (zoneProfiles.length === 0) {
      return computeWarmupEstimateFromParams(18, 21, envConfig.outdoorTempC, 2000, 60, 300, 30);
    }
    let totalArea = 0;
    let emitterOutputW = 0;
    let heatLossWPerK = 0;
    let thermalCapacitanceWhPerK = 0;
    let weightedLag = 0;
    let weightedStart = 0;
    let weightedTarget = 0;

    for (const p of zoneProfiles) {
      totalArea += p.floorAreaM2;
      emitterOutputW += p.emitterOutputW;
      heatLossWPerK += p.heatLossWPerK;
      thermalCapacitanceWhPerK += p.thermalCapacitanceWhPerK;
      weightedLag += p.emitterLagMinutes * p.floorAreaM2;
      const startT = envConfig.startMode === 'setback' ? p.setbackStartTempC : p.coldStartTempC;
      weightedStart += startT * p.floorAreaM2;
      weightedTarget += p.targetTempC * p.floorAreaM2;
    }

    const startTempC = Number((weightedStart / totalArea).toFixed(1));
    const targetTempC = Number((weightedTarget / totalArea).toFixed(1));
    const emitterLagMinutes = Math.round(weightedLag / totalArea);

    return computeWarmupEstimateFromParams(
      startTempC,
      targetTempC,
      envConfig.outdoorTempC,
      emitterOutputW,
      heatLossWPerK,
      thermalCapacitanceWhPerK,
      emitterLagMinutes
    );
  };

  const setLayerVisible = (visible: boolean): void => {
    if (layerVisible === visible) return;
    layerVisible = visible;
    rootGroup.visible = visible;

    const entries = ensureFloorXrayEntries();
    for (const entry of entries) {
      entry.mesh.material = visible ? entry.xrayMaterial : entry.originalMaterial;
    }

    syncRadiatorMaterials(visible);

    // Automatically swing open the Understairs Cupboard door (Manifold A), the Boot Room door,
    // and the Boxed-In Boot Room Manifold Cupboard door (Manifold B) when the UFH layer is active!
    for (const leafName of [
      'hall.stairs.understairsCupboardDoor.leaf',
      'familyRoom.bootRoomManifoldCupboard.door.leaf',
    ]) {
      const doorLeaf = scene.getObjectByName(leafName);
      const doorPivot = doorLeaf?.parent;
      const doorId = doorPivot?.userData?.interactableId as string | undefined;
      if (doorId) {
        ctx.interactions.setHingedDoorOpen(doorId, visible);
      }
    }
    ctx.interactions.setHingedDoorOpen('familyCupboardDoor', visible);

    if (visible) {
      syncManifoldActuatorLeds();
    }
    notifyListeners();
  };

  return {
    rootGroup,
    isLayerVisible: () => layerVisible,
    setLayerVisible,
    toggleLayerVisible: () => {
      setLayerVisible(!layerVisible);
      return layerVisible;
    },
    getZones: () => zones,
    getZone: (zoneId) => zones.find((z) => z.id === zoneId),
    getZoneForRoom: (roomZoneId) => zones.find((z) => z.roomZones.includes(roomZoneId)),
    isZoneOn: (zoneId) => zones.find((z) => z.id === zoneId)?.heatingOn ?? false,
    setZoneOn: (zoneId, on) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone || zone.heatingOn === on) return;
      zone.heatingOn = on;
      zone.targetTempC = on ? 21.0 : 16.0;
      updateZoneMaterials(zone);
      notifyListeners();
    },
    toggleZone: (zoneId) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return false;
      zone.heatingOn = !zone.heatingOn;
      zone.targetTempC = zone.heatingOn ? 21.0 : 16.0;
      updateZoneMaterials(zone);
      notifyListeners();
      return zone.heatingOn;
    },
    setAllZones: (on) => {
      let changed = false;
      for (const zone of zones) {
        if (zone.heatingOn !== on) {
          zone.heatingOn = on;
          zone.targetTempC = on ? 21.0 : 16.0;
          updateZoneMaterials(zone);
          changed = true;
        }
      }
      if (changed) {
        notifyListeners();
      }
    },
    getEnvironment: () => envConfig,
    setOutdoorTempC: (outdoorTempC: number) => {
      if (envConfig.outdoorTempC === outdoorTempC) return;
      envConfig = { ...envConfig, outdoorTempC };
      notifyListeners();
    },
    setStartMode: (startMode: HeatingStartMode) => {
      if (envConfig.startMode === startMode) return;
      envConfig = { ...envConfig, startMode };
      notifyListeners();
    },
    getZoneWarmupEstimate,
    getRoomThermalProfile,
    getRoomWarmupEstimate,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
