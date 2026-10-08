import * as THREE from 'three';
import type {
  RoomThermalProfile,
  ThermalWarmupEstimate,
  UfhZoneId,
  UfhZoneState,
} from '../../../../engine/viewer/property-scene-profile.ts';
import { transformEastWingTuple } from '../../structure/ground-floor-materials.ts';
import {
  addClosedUfhCircuit,
  buildContinuousColsSerpentinePath2D,
  buildContinuousRowsSerpentinePath2D,
  buildRadiatorSupplyPipeRun,
  makeUniformRows,
  roundPolylineCorners2D,
  type SerpentineRowSpec,
} from './ufh-serpentine-pipe-builder.ts';

/**
 * 1600s/1700s Solid-Brick Farmhouse + Double-Glazed Windows Thermal Physics Model
 * derived directly from Crox Farmhouse's 3D room dimensions, emitter specifications,
 * floor coverings (Stone Flagstone / Quarry Tile / 18mm Engineered Oak), and envelope U-values:
 * - Solid 225–340mm Flemish/English-bond brick walls with lime plaster: U ≈ 1.65 W/(m²·K)
 * - Heritage double-glazed sash, casement & bifold units: U ≈ 1.50 W/(m²·K)
 * - Infiltration rate: ~0.85 ACH
 * - Zones 1 & 2: 65°C Flow Cast-Iron 4-Column Radiators (12 min hydraulic lag, high W/m² boost)
 * - Zones 3 & 4: 45°C Blended-Flow 16mm PERT-AL-PERT in 65mm screed (36–46 min screed thermal lag)
 */
export const ROOM_THERMAL_PROFILES: ReadonlyArray<RoomThermalProfile> = [
  {
    roomZoneId: 'sittingRoom',
    roomName: 'Sitting Room',
    ufhZoneId: 'ufhZone1',
    emitterLabel: '2 × 4-Col Cast-Iron Radiators (65°C Flow)',
    constructionSummary: '17th-C solid brick W/N walls · Double-glazed bay & sash · Timber floor',
    floorAreaM2: 23.7,
    heatedAreaM2: 23.7,
    volumeM3: 58.3,
    emitterOutputW: 3420,
    specificOutputWPerM2: 144,
    heatLossWPerK: 86,
    thermalCapacitanceWhPerK: 410,
    emitterLagMinutes: 12,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 21.0,
  },
  {
    roomZoneId: 'livingRoom',
    roomName: 'Living Room',
    ufhZoneId: 'ufhZone2',
    emitterLabel: '2 × 4-Col Cast-Iron Radiators (65°C Flow)',
    constructionSummary: '17th-C solid brick W/N walls · Double-glazed canted bay · Timber floor',
    floorAreaM2: 24.9,
    heatedAreaM2: 24.9,
    volumeM3: 61.3,
    emitterOutputW: 3280,
    specificOutputWPerM2: 132,
    heatLossWPerK: 88,
    thermalCapacitanceWhPerK: 430,
    emitterLagMinutes: 12,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 21.0,
  },
  {
    roomZoneId: 'entranceHall',
    roomName: 'Front Entrance Hallway',
    ufhZoneId: 'ufhZone3',
    emitterLabel: 'Manifold A P1 · Screed UFH under Quarry Tile (45°C)',
    constructionSummary: 'Solid brick S wall · Glazed front door · Sealed terracotta quarry tiles',
    floorAreaM2: 6.6,
    heatedAreaM2: 5.6,
    volumeM3: 16.2,
    emitterOutputW: 540,
    specificOutputWPerM2: 96,
    heatLossWPerK: 24,
    thermalCapacitanceWhPerK: 115,
    emitterLagMinutes: 36,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
  {
    roomZoneId: 'hall',
    roomName: 'Main Staircase Hall',
    ufhZoneId: 'ufhZone3',
    emitterLabel: 'Manifold A P2–3 · Screed UFH under Flagstones (45°C)',
    constructionSummary: 'Solid brick N/S walls · Double-glazed courtyard door · Heavy flagstones (+5kW Stove)',
    floorAreaM2: 19.2,
    heatedAreaM2: 11.8,
    volumeM3: 52.0,
    emitterOutputW: 1120,
    specificOutputWPerM2: 95,
    heatLossWPerK: 52,
    thermalCapacitanceWhPerK: 280,
    emitterLagMinutes: 40,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
  {
    roomZoneId: 'bootLobby',
    roomName: 'Boot Lobby, WC & Boot Room',
    ufhZoneId: 'ufhZone3',
    emitterLabel: 'Manifold A P4 & Manifold B P4 · Screed UFH under Stone/Tile (45°C)',
    constructionSummary: 'Solid brick N/S walls · Double-glazed cottage windows · Flagstone & encaustic tile',
    floorAreaM2: 13.4,
    heatedAreaM2: 8.8,
    volumeM3: 31.8,
    emitterOutputW: 840,
    specificOutputWPerM2: 95,
    heatLossWPerK: 38,
    thermalCapacitanceWhPerK: 185,
    emitterLagMinutes: 38,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
  {
    roomZoneId: 'familyRoom',
    roomName: 'Dining Room & Snug',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P3 · Screed UFH under Quarry Tile (45°C)',
    constructionSummary: 'Solid brick N/S walls · 3 double-glazed cottage windows & door · Quarry tile',
    floorAreaM2: 23.9,
    heatedAreaM2: 18.4,
    volumeM3: 56.4,
    emitterOutputW: 1660,
    specificOutputWPerM2: 90,
    heatLossWPerK: 74,
    thermalCapacitanceWhPerK: 370,
    emitterLagMinutes: 38,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 20.5,
  },
  {
    roomZoneId: 'kitchen',
    roomName: 'Kitchen & Island Galley',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P2 · Screed UFH under 18mm Oak (45°C)',
    constructionSummary: 'Solid brick N/S walls · Double-glazed windows · 18mm engineered oak (53% free floor)',
    floorAreaM2: 26.8,
    heatedAreaM2: 14.2,
    volumeM3: 68.5,
    emitterOutputW: 1110,
    specificOutputWPerM2: 78,
    heatLossWPerK: 48,
    thermalCapacitanceWhPerK: 275,
    emitterLagMinutes: 46,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 20.5,
  },
  {
    roomZoneId: 'sitting',
    roomName: 'Vaulted Sitting Area (East Kitchen)',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P1 · Screed UFH under 18mm Oak (45°C)',
    constructionSummary: 'Vaulted ceiling · 3.9m double-glazed bifolds · E/S brick walls · 18mm oak',
    floorAreaM2: 14.2,
    heatedAreaM2: 10.6,
    volumeM3: 41.2,
    emitterOutputW: 870,
    specificOutputWPerM2: 82,
    heatLossWPerK: 42,
    thermalCapacitanceWhPerK: 225,
    emitterLagMinutes: 46,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 20.5,
  },
  {
    roomZoneId: 'utility',
    roomName: 'Utility & Laundry Room',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P1 · Screed UFH under Stone Tile (45°C)',
    constructionSummary: 'Solid brick N/E corner walls · Double-glazed window · Low-resistance stone tile',
    floorAreaM2: 5.2,
    heatedAreaM2: 3.4,
    volumeM3: 12.8,
    emitterOutputW: 320,
    specificOutputWPerM2: 94,
    heatLossWPerK: 15,
    thermalCapacitanceWhPerK: 80,
    emitterLagMinutes: 36,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
];

export function formatWarmupMinutes(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return 'Insufficient output';
  }
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) {
    return `${rounded}m`;
  }
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
}

/**
 * Solves first-order building thermal balance with hydraulic/screed dead-time lag:
 *   C_eff * dT/dt = Q_emit - H_loss * (T(t) - T_out)
 *   t_warmup = t_lag + (C_eff / H_loss) * ln((T_max - T_start) / (T_max - T_target))
 */
export function computeWarmupEstimateFromParams(
  startTempC: number,
  targetTempC: number,
  outdoorTempC: number,
  emitterOutputW: number,
  heatLossWPerK: number,
  thermalCapacitanceWhPerK: number,
  emitterLagMinutes: number
): ThermalWarmupEstimate {
  const steadyHeatLossAtTargetW = Math.max(0, Math.round(heatLossWPerK * (targetTempC - outdoorTempC)));
  const startLossW = Math.max(0, heatLossWPerK * (startTempC - outdoorTempC));
  const netBoostPowerAtStartW = Math.round(emitterOutputW - startLossW);
  const initialHeatingRateCPerHr =
    thermalCapacitanceWhPerK > 0
      ? Math.max(0, Number(((emitterOutputW - startLossW) / thermalCapacitanceWhPerK).toFixed(2)))
      : 0;
  const maxAchievableTempC = Number((outdoorTempC + emitterOutputW / heatLossWPerK).toFixed(1));

  if (targetTempC <= startTempC) {
    return {
      startTempC,
      targetTempC,
      outdoorTempC,
      emitterOutputW,
      steadyHeatLossAtTargetW,
      netBoostPowerAtStartW,
      emitterLagMinutes,
      initialHeatingRateCPerHr,
      maxAchievableTempC,
      totalWarmupMinutes: 0,
      formattedDuration: '0m (At target)',
    };
  }

  if (maxAchievableTempC <= targetTempC + 0.25) {
    return {
      startTempC,
      targetTempC,
      outdoorTempC,
      emitterOutputW,
      steadyHeatLossAtTargetW,
      netBoostPowerAtStartW,
      emitterLagMinutes,
      initialHeatingRateCPerHr,
      maxAchievableTempC,
      totalWarmupMinutes: null,
      formattedDuration: `Max ${maxAchievableTempC}°C (Boost needed)`,
    };
  }

  const tauHours = thermalCapacitanceWhPerK / heatLossWPerK;
  const climbHours =
    tauHours * Math.log((maxAchievableTempC - startTempC) / (maxAchievableTempC - targetTempC));
  const totalWarmupMinutes = Math.round(emitterLagMinutes + climbHours * 60);

  return {
    startTempC,
    targetTempC,
    outdoorTempC,
    emitterOutputW,
    steadyHeatLossAtTargetW,
    netBoostPowerAtStartW,
    emitterLagMinutes,
    initialHeatingRateCPerHr,
    maxAchievableTempC,
    totalWarmupMinutes,
    formattedDuration: formatWarmupMinutes(totalWarmupMinutes),
  };
}

export interface FloorXrayEntry {
  readonly mesh: THREE.Mesh;
  readonly originalMaterial: THREE.Material | THREE.Material[];
  readonly xrayMaterial: THREE.Material | THREE.Material[];
}

export function cloneMaterialAsXray(mat: THREE.Material, opacity: number): THREE.Material {
  const cloned = mat.clone();
  cloned.transparent = true;
  cloned.opacity = opacity;
  cloned.depthWrite = false;
  cloned.needsUpdate = true;
  return cloned;
}

export function createInitialUfhZones(): UfhZoneState[] {
  // Initial 4-zone configuration matching Annotations #1–#8 + Utility Room:
  // - Zone 1 (Sitting Room) & Zone 2 (Living Room) are Cast-Iron Radiator zones (no UFH floor coils)
  // - Zone 3 (Entrance Hall, Main Hall, Boot Lobby, WC & Walk-In Cupboard) is UFH Zone
  // - Zone 4 (Dining Room, Kitchen & Utility Room) is UFH Zone
  const zones: UfhZoneState[] = [
    {
      id: 'ufhZone1',
      zoneNumber: 1,
      name: 'Zone 1 · Sitting Room (Radiators)',
      shortName: 'Z1 Sitting (Rads)',
      manifoldLabel: 'Plant Room · Radiator Circuit 1',
      roomZones: ['sittingRoom'],
      heatingOn: true,
      targetTempC: 21.0,
    },
    {
      id: 'ufhZone2',
      zoneNumber: 2,
      name: 'Zone 2 · Living Room (Radiators)',
      shortName: 'Z2 Living (Rads)',
      manifoldLabel: 'Plant Room · Radiator Circuit 2',
      roomZones: ['livingRoom'],
      heatingOn: false,
      targetTempC: 16.0,
    },
    {
      id: 'ufhZone3',
      zoneNumber: 3,
      name: 'Zone 3 · Hall, Boot Lobby, WC & Boot Room (UFH)',
      shortName: 'Z3 Hall/WC/Boot (UFH)',
      manifoldLabel: 'Manifold A (P1–4) & Boot Room Manifold B (P4)',
      roomZones: ['entranceHall', 'hall', 'bootLobby'],
      heatingOn: true,
      targetTempC: 19.5,
    },
    {
      id: 'ufhZone4',
      zoneNumber: 4,
      name: 'Zone 4 · Dining, Snug, Kitchen & Utility (UFH)',
      shortName: 'Z4 Dining/Kit/Util',
      manifoldLabel: 'Boot Room Manifold B · Ports 1–3',
      roomZones: ['familyRoom', 'kitchen', 'sitting', 'utility'],
      heatingOn: true,
      targetTempC: 20.5,
    },
  ];

  return zones;
}

export function populateUfhZonesAndPrimaryMains(
  rootGroup: THREE.Group,
  eastWingUfhGroup: THREE.Group,
  pipeMats: ReadonlyMap<UfhZoneId, THREE.MeshStandardMaterial>,
  bedMats: ReadonlyMap<UfhZoneId, THREE.MeshBasicMaterial>,
  primaryFlowTrunkMat: THREE.MeshStandardMaterial,
  primaryReturnTrunkMat: THREE.MeshStandardMaterial,
  interactiveMeshes: THREE.Object3D[]
): void {
  // =========================================================================
  // ZONE 1: SITTING ROOM RADIATORS (`sittingRoom`, Y = -0.60m — NO UFH Floor Coils!)
  //         2-pipe sub-floor radiator flow/return feeds to West Bay & East Wall Cast-Iron Radiators
  // =========================================================================
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone1')!,
    interactiveMeshes,
    'ufhZone1',
    'ufh.zone1.sittingRoomWestBayRadiatorFeed',
    -0.6,
    [
      [-18.2, 8.46],
      [-18.2, 8.14],
      [-22.05, 8.14],
      [-22.05, 5.86],
      [-22.34, 5.86],
    ],
    0.98
  );
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone1')!,
    interactiveMeshes,
    'ufhZone1',
    'ufh.zone1.sittingRoomEastWallRadiatorFeed',
    -0.6,
    [
      [-18.1, 8.46],
      [-17.32, 8.14],
      [-17.28, 5.92],
    ],
    0.98
  );

  // =========================================================================
  // ZONE 2: LIVING ROOM RADIATORS (`livingRoom`, Y = -0.60m — NO UFH Floor Coils!)
  //         2-pipe sub-floor radiator flow/return feeds to West Canted Bay & East Wall Cast-Iron Radiators
  // =========================================================================
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone2')!,
    interactiveMeshes,
    'ufhZone2',
    'ufh.zone2.livingRoomWestBayRadiatorFeed',
    -0.6,
    [
      [-18.04, 8.46],
      [-18.04, 3.52],
      [-18.95, 3.52],
      [-18.95, 2.25],
      [-22.05, 1.84],
      [-22.05, -0.26],
      [-22.34, -0.26],
    ],
    0.98
  );
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone2')!,
    interactiveMeshes,
    'ufhZone2',
    'ufh.zone2.livingRoomEastWallRadiatorFeed',
    -0.6,
    [
      [-18.95, 2.25],
      [-18.12, 2.36],
      [-17.831, -1.007],
    ],
    0.644
  );

  // =========================================================================
  // MANIFOLD A (`hall.understairsManifold`, Y = -0.30m, Ports 1–4):
  // ZONE 3 WEST & CENTRAL LOOPS (`entranceHall` #3 + `hall` #4 + `bootLobby` #5 + `downstairsWc` #7)
  // Zero loops cross the -0.30m -> 0.00m step or pass under the Wine Cellar!
  // =========================================================================
  const z3PipeMat = pipeMats.get('ufhZone3')!;
  const z3BedMat = bedMats.get('ufhZone3')!;

  // LOOP 1 (#3): Entrance Hall (`Y = -0.60m`, Manifold A Port 1, routing South into the Entrance Hall)
  const pManifoldAPort1Flow = transformEastWingTuple(-17.38, -0.3, -1.9);
  const pManifoldAPort1Ret = transformEastWingTuple(-17.32, -0.3, -1.9);
  addClosedUfhCircuit(
    rootGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.entranceHallLoop',
    -0.6,
    [
      {
        name: 'ufh.zone3.entranceHallLoop.thermalBed',
        minX: -22.05,
        maxX: -17.42,
        minZ: 2.86,
        maxZ: 3.44,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      [
        { z: 2.3, minX: -22.05, maxX: -20.9 },
        { z: 2.53, minX: -22.05, maxX: -19.5 },
        { z: 2.76, minX: -22.05, maxX: -18.2 },
        { z: 2.99, minX: -22.05, maxX: -17.46 },
        { z: 3.21, minX: -22.05, maxX: -17.46 },
        { z: 3.43, minX: -22.05, maxX: -17.46 },
      ],
      false, // Row 0 goes East -> West; Row 5 goes West -> East
      [
        [pManifoldAPort1Flow[0], pManifoldAPort1Flow[2]],
        [-17.38, 2.76],
        [-20.9, 2.3],
      ],
      [
        [-17.32, 3.43],
        [pManifoldAPort1Ret[0], pManifoldAPort1Ret[2]],
      ]
    )
  );

  // LOOP 2 (#4a): Main Staircase Hall South (`Y = -0.30m`, Manifold A Port 2 at Z = -1.97m / -2.01m)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.mainHallSouthLoop',
    -0.3,
    [
      {
        name: 'ufh.zone3.mainHallSouthLoop.thermalBed',
        minX: -16.4,
        maxX: -13.3,
        minZ: -0.25,
        maxZ: 2.15,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      makeUniformRows(-16.38, -13.3, -0.25, 2.15, 10),
      true, // Row 0 goes West -> East; Row 9 goes East -> West
      [
        [-17.38, -1.97],
        [-17.05, -1.97],
        [-16.38, -1.97],
      ],
      [
        [-16.46, 2.15],
        [-16.46, -2.01],
        [-17.05, -2.01],
        [-17.38, -2.01],
      ]
    )
  );

  // LOOP 3 (#4b): Main Staircase Hall North-East (`Y = -0.30m`, Manifold A Port 3 at Z = -2.05m / -2.09m)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.mainHallNorthEastLoop',
    -0.3,
    [
      {
        name: 'ufh.zone3.mainHallNorthEastLoop.thermalBed',
        minX: -15.25,
        maxX: -13.3,
        minZ: -1.88,
        maxZ: -0.52,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      makeUniformRows(-15.22, -13.3, -1.86, -0.52, 6),
      true,
      [
        [-17.38, -2.05],
        [-17.05, -2.05],
        [-15.22, -2.05],
      ],
      [
        [-15.3, -0.52],
        [-15.3, -2.09],
        [-17.05, -2.09],
        [-17.38, -2.09],
      ]
    )
  );

  // LOOP 4 (#7 + #5): Downstairs Cloakroom WC & Boot Lobby Combined Continuous Loop (`Y = -0.30m`, Manifold A Port 4 at Z = -2.13m / -2.17m)
  //                   Flows East in North corridor (Z = -2.13m) -> 3 N-S passes in open East half of WC (clear of West vanity & WC pan)
  //                   -> through WC doorway at X = -12.14m -> 8 E-W passes across Boot Lobby -> returns along X = -12.70m & -12.24m to Z = -2.17m!
  {
    const wcIn = roundPolylineCorners2D(
      [
        [-17.38, -2.13],
        [-17.05, -2.13],
        [-11.58, -2.13],
        [-11.58, -0.52],
      ],
      0.075,
      6
    );
    const wcBend1: Array<readonly [number, number]> = [];
    for (let s = 1; s < 12; s++) {
      const theta = (s / 12) * Math.PI;
      wcBend1.push([-11.72 + 0.14 * Math.cos(theta), -0.52 + 0.14 * Math.sin(theta)]);
    }
    const wcBend2: Array<readonly [number, number]> = [];
    for (let s = 1; s < 12; s++) {
      const theta = (s / 12) * Math.PI;
      wcBend2.push([-12.0 + 0.14 * Math.cos(theta), -1.96 - 0.14 * Math.sin(theta)]);
    }

    const bootLobbyRows: SerpentineRowSpec[] = [
      { z: 0.12, minX: -12.14, maxX: -10.05 },
      ...makeUniformRows(-12.62, -10.05, 0.41, 2.15, 7),
    ];
    const bootLobbySection = buildContinuousRowsSerpentinePath2D(
      bootLobbyRows,
      true, // Row 0 (z=0.12) goes West -> East; Row 7 (z=2.15) goes East -> West
      [[-12.14, -1.96]],
      [
        [-12.7, 2.15],
        [-12.7, 0.04],
        [-12.24, 0.04],
        [-12.24, -2.17],
        [-17.05, -2.17],
        [-17.38, -2.17],
      ]
    );

    const wcAndBootLobbyPts: Array<readonly [number, number]> = [
      ...wcIn,
      ...wcBend1,
      [-11.86, -0.52],
      [-11.86, -1.96],
      ...wcBend2,
      ...bootLobbySection,
    ];

    addClosedUfhCircuit(
      eastWingUfhGroup,
      z3PipeMat,
      z3BedMat,
      interactiveMeshes,
      'ufhZone3',
      'ufh.zone3.bootLobbyLoop',
      -0.3,
      [
        {
          name: 'ufh.zone3.bootLobbyLoop.thermalBed',
          minX: -12.68,
          maxX: -10.05,
          minZ: 0.08,
          maxZ: 2.15,
        },
        {
          name: 'ufh.zone3.downstairsWcLoop.thermalBed',
          minX: -12.22,
          maxX: -11.56,
          minZ: -2.22,
          maxZ: -0.38,
        },
      ],
      wcAndBootLobbyPts
    );
  }

  // =========================================================================
  // MANIFOLD B (`familyRoom.bootRoomManifold` at X = -7.98m, Y = 0.00m, Z = -1.95m, facing West `-X`, Ports 1–4):
  // SERVES ALL EAST WING 0.00m SLAB LOOPS (Boot Room Loop 5 + Dining/Snug Loop 6 + Kitchen Loop 7 + Utility/Sitting Loop 8)
  // =========================================================================

  // LOOP 5 (#8): Boot Room / Walk-In Cupboard (`familyRoom.walkInCupboard`, `Y = 0.00m`, Manifold B Port 4 at Z = -1.835m / -1.86m)
  //              4 N-S passes across the open checkerboard tile floor (`X = -8.98m..-8.32m, Z = -2.26m..-0.76m`,
  //              clear of both the West Boot Bench `X = -9.55m..-9.07m` and the East Boxed-In Manifold Cupboard `X = -8.22m..-7.97m`)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.walkInCupboardLoop',
    0.0,
    [
      {
        name: 'ufh.zone3.walkInCupboardLoop.thermalBed',
        minX: -9.02,
        maxX: -8.28,
        minZ: -2.3,
        maxZ: -0.75,
      },
    ],
    buildContinuousColsSerpentinePath2D(
      [
        { x: -8.32, minZ: -1.835, maxZ: -0.76 },
        { x: -8.54, minZ: -2.26, maxZ: -0.76 },
        { x: -8.76, minZ: -2.26, maxZ: -0.76 },
        { x: -8.98, minZ: -2.26, maxZ: -0.76 },
      ],
      true, // Col 0 (-8.32) goes North -> South; Col 3 (-8.98) goes South -> North
      [
        [-8.05, -1.835],
        [-8.32, -1.835],
      ],
      [
        [-8.98, -2.36],
        [-8.25, -2.36],
        [-8.25, -1.86],
        [-8.05, -1.86],
      ]
    )
  );

  // =========================================================================
  // ZONE 4: DINING ROOM, SNUG, KITCHEN & UTILITY ROOM UFH
  //         (`familyRoom` #6 + `kitchen` + `sitting` + `utility`, Y = 0.00m,
  //         Boot Room Manifold B Ports 1–3)
  // =========================================================================
  const z4PipeMat = pipeMats.get('ufhZone4')!;
  const z4BedMat = bedMats.get('ufhZone4')!;

  // LOOP 6 (#6): Dining Room Continuous L-Shaped Loop (`Y = 0.00m`, Manifold B Port 3 at Z = -1.91m / -1.885m)
  //              7 E-W rows in North Snug (`X = -7.46m..-4.88m, Z = -2.18m..-0.64m`) +
  //              11 E-W rows in Main Dining Room (`X = -9.28m..-4.88m, Z = -0.32m..+2.12m`)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z4PipeMat,
    z4BedMat,
    interactiveMeshes,
    'ufhZone4',
    'ufh.zone4.diningRoomMainLoop',
    0.0,
    [
      {
        name: 'ufh.zone4.diningRoomMainLoop.thermalBed',
        minX: -9.32,
        maxX: -4.88,
        minZ: -0.48,
        maxZ: 2.12,
      },
      {
        name: 'ufh.zone4.diningRoomSnugLoop.thermalBed',
        minX: -7.52,
        maxX: -4.88,
        minZ: -2.24,
        maxZ: -0.48,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      [
        ...makeUniformRows(-7.46, -4.88, -2.18, -0.64, 7),
        ...makeUniformRows(-9.28, -4.88, -0.32, 2.12, 11),
      ],
      true, // Row 0 goes West -> East; Row 6 goes West -> East (turning at East wall into Row 7); Row 17 goes East -> West
      [
        [-8.04, -1.91],
        [-7.6, -1.91],
        [-7.6, -2.18],
      ],
      [
        [-9.36, 2.12],
        [-9.36, -0.46],
        [-7.58, -0.46],
        [-7.58, -1.885],
        [-8.04, -1.885],
      ]
    )
  );

  // LOOP 7: Kitchen C-Shaped Island-Surround Continuous Loop (`Y = 0.00m`, Manifold B Port 2 at Z = -1.94m / -1.965m)
  //         Wraps continuously around the 3.80m × 1.52m Kitchen Island (`X = -2.82m..+0.98m, Z = -0.62m..+0.90m`)
  //         through 6 North Galley rows (`X = -3.56m..+1.68m, Z = -1.70m..-0.76m`),
  //         6 West Aisle rows (`X = -3.56m..-2.96m, Z = -0.54m..+0.80m`), and
  //         6 South Kitchen Floor rows (`X = -3.56m..+1.68m, Z = +1.02m..+2.18m`) with ZERO dead ends!
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z4PipeMat,
    z4BedMat,
    interactiveMeshes,
    'ufhZone4',
    'ufh.zone4.kitchenWestAndIslandLoop',
    0.0,
    [
      {
        name: 'ufh.zone4.kitchenNorthGalleyLoop.thermalBed',
        minX: -3.56,
        maxX: 1.68,
        minZ: -1.72,
        maxZ: -0.72,
      },
      {
        name: 'ufh.zone4.kitchenWestAisleLoop.thermalBed',
        minX: -3.56,
        maxX: -2.92,
        minZ: -0.72,
        maxZ: 0.98,
      },
      {
        name: 'ufh.zone4.kitchenWestAndIslandLoop.thermalBed',
        minX: -3.56,
        maxX: 1.68,
        minZ: 0.98,
        maxZ: 2.2,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      [
        ...makeUniformRows(-3.56, 1.68, -1.7, -0.76, 6),
        ...makeUniformRows(-3.56, -2.96, -0.54, 0.8, 6),
        ...makeUniformRows(-3.56, 1.68, 1.02, 2.18, 6),
      ],
      true, // Row 0 goes West -> East; Row 5 ends at West (-3.56); Row 11 ends at West (-3.56); Row 17 ends at West (-3.56)
      [
        [-8.04, -1.94],
        [-7.64, -1.94],
        [-7.64, -2.34],
        [-3.56, -2.34],
      ],
      [
        [-3.64, 2.18],
        [-3.64, -2.38],
        [-7.68, -2.38],
        [-7.68, -1.965],
        [-8.04, -1.965],
      ]
    )
  );

  // LOOP 8: Utility Room + East Kitchen / Vaulted Sitting Bifold Combined Loop (`Y = 0.00m`, Manifold B Port 1 at Z = -2.00m / -2.025m)
  //         Enters Utility Room at `[+2.18, -1.72]`, snakes through 4 Utility rows (`Z = -1.72m..-0.96m, X = +2.18m..+4.78m`),
  //         passes South through the Utility Room doorway (`X = +2.68m`) directly into 10 East Kitchen / Sitting rows
  //         (`Z = -0.56m..+2.18m, X = +1.92m..+4.72m`), and returns North along `X = +1.80m` (between Loop 7 & Loop 8) to `Z = -2.46m`!
  {
    const utilRows = makeUniformRows(2.18, 4.78, -1.72, -0.96, 3);
    const utilPart = buildContinuousRowsSerpentinePath2D(
      utilRows,
      true, // Row 0 (-1.72) goes West -> East; Row 1 (-1.34) goes East -> West; Row 2 (-0.96) goes West -> East (ending at +4.78)
      [
        [-8.04, -2.0],
        [-7.72, -2.0],
        [-7.72, -2.42],
        [2.18, -2.42],
      ],
      [[4.78, -0.96]]
    );
    // Remove duplicate trailing point from utilPart before U-bending into Row 3 at z = -0.76m toward doorway
    const utilBendToDoor: Array<readonly [number, number]> = [];
    for (let s = 1; s < 12; s++) {
      const theta = (s / 12) * Math.PI;
      utilBendToDoor.push([4.68 + 0.1 * Math.sin(theta), -0.86 - 0.1 * Math.cos(theta)]);
    }

    const eastSittingSection = buildContinuousRowsSerpentinePath2D(
      makeUniformRows(1.92, 4.72, -0.56, 2.18, 10),
      true, // Row 0 (-0.56) goes West -> East; Row 9 (+2.18) goes East -> West (ending at +1.92)
      [
        [4.68, -0.76],
        [2.68, -0.76],
        [2.68, -0.66],
        [1.92, -0.66],
      ],
      [
        [1.8, 2.18],
        [1.8, -2.46],
        [-7.76, -2.46],
        [-7.76, -2.025],
        [-8.04, -2.025],
      ]
    );

    const combinedEastAndUtilityPts: Array<readonly [number, number]> = [
      ...utilPart.slice(0, -1),
      ...utilBendToDoor,
      ...eastSittingSection,
    ];

    addClosedUfhCircuit(
      eastWingUfhGroup,
      z4PipeMat,
      z4BedMat,
      interactiveMeshes,
      'ufhZone4',
      'ufh.zone4.kitchenEastSittingLoop',
      0.0,
      [
        {
          name: 'ufh.zone4.kitchenEastSittingLoop.thermalBed',
          minX: 1.88,
          maxX: 4.72,
          minZ: -0.62,
          maxZ: 2.18,
        },
        {
          name: 'ufh.zone4.utilityRoomLoop.thermalBed',
          minX: 2.18,
          maxX: 4.82,
          minZ: -1.76,
          maxZ: -0.74,
        },
      ],
      combinedEastAndUtilityPts
    );
  }

  // =========================================================================
  // 28mm INSULATED PRIMARY DISTRIBUTION MAINS
  // (Plant Room Boilers -> Manifold A Understairs -> Manifold B Boot Room East Wall)
  // =========================================================================
  {
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'ufh.primaryDistributionMains';

    const addPrimaryPipeChain = (
      prefix: string,
      mat: THREE.MeshStandardMaterial,
      pts: ReadonlyArray<readonly [number, number, number]>
    ): void => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0, z0] = pts[i];
        const [x1, y1, z1] = pts[i + 1];
        const p0 = new THREE.Vector3(x0, y0, z0);
        const p1 = new THREE.Vector3(x1, y1, z1);
        const len = p0.distanceTo(p1);
        if (len < 1e-4) continue;
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, len, 10),
          mat
        );
        cyl.name = `${prefix}.${i + 1}`;
        cyl.position.copy(p0).add(p1).multiplyScalar(0.5);
        cyl.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          p1.clone().sub(p0).normalize()
        );
        trunkGroup.add(cyl);
      }
    };

    // 28mm Insulated Primary Flow Trunk (Plant Room -> Manifold A -> steps up at X=-9.80..-9.56 -> Manifold B Boot Room East Wall)
    addPrimaryPipeChain('ufh.primaryDistributionMains.flow', primaryFlowTrunkMat, [
      [-18.43, -0.63, 8.42],
      [-17.45, -0.63, 8.2],
      transformEastWingTuple(-17.45, -0.63, 2.15),
      transformEastWingTuple(-17.45, -0.33, 2.05),
      transformEastWingTuple(-17.45, -0.33, -2.44),
      transformEastWingTuple(-9.8, -0.33, -2.44),
      transformEastWingTuple(-9.56, -0.03, -2.44),
      transformEastWingTuple(-8.052, -0.03, -2.44),
      transformEastWingTuple(-8.052, -0.03, -2.125),
      transformEastWingTuple(-8.052, 0.08, -2.125),
    ]);
    // Manifold A Flow Tee Riser
    addPrimaryPipeChain('ufh.primaryDistributionMains.manifoldAFlowTee', primaryFlowTrunkMat, [
      transformEastWingTuple(-17.45, -0.33, -1.865),
      transformEastWingTuple(-17.4, -0.2, -1.865),
    ]);

    // 28mm Insulated Primary Return Trunk (Plant Room -> Manifold A -> steps up at X=-9.80..-9.56 -> Manifold B Boot Room East Wall)
    addPrimaryPipeChain('ufh.primaryDistributionMains.return', primaryReturnTrunkMat, [
      [-18.37, -0.63, 8.42],
      [-17.39, -0.63, 8.2],
      transformEastWingTuple(-17.39, -0.63, 2.15),
      transformEastWingTuple(-17.39, -0.33, 2.05),
      transformEastWingTuple(-17.39, -0.33, -2.48),
      transformEastWingTuple(-9.8, -0.33, -2.48),
      transformEastWingTuple(-9.56, -0.03, -2.48),
      transformEastWingTuple(-8.052, -0.03, -2.48),
      transformEastWingTuple(-8.052, -0.03, -2.17),
      transformEastWingTuple(-8.052, 0.08, -2.17),
    ]);
    // Manifold A Return Tee Riser
    addPrimaryPipeChain('ufh.primaryDistributionMains.manifoldAReturnTee', primaryReturnTrunkMat, [
      transformEastWingTuple(-17.39, -0.33, -1.82),
      transformEastWingTuple(-17.4, -0.2, -1.82),
    ]);

    rootGroup.add(trunkGroup);
  }

}
