import {
  batch,
  computed,
  signal,
  type ReadonlySignal,
  type Signal,
} from '@preact/signals';
import type { UsdStageStatsSummary } from '../engine/usd/stage-runtime.ts';
import { CIRCUITS } from '../integrations/knx/constants.ts';
import type { CircuitId, CircuitLevels, KNXTelegram } from '../core/types/knx.ts';
import type {
  AnnotationToolMode,
  FloorViewMode,
  SceneAnnotationRecord,
  TimeOfDay,
} from '../core/types/scene.ts';

function createInitialDeviceStates(): Readonly<Record<CircuitId, number>> {
  const initial = {} as Record<CircuitId, number>;
  for (const circuit of CIRCUITS) {
    initial[circuit.id] = 0;
  }
  return initial;
}

export function timeOfDayToSunMinutes(tod: TimeOfDay): number {
  if (tod === 'day') return 13 * 60 + 30;
  if (tod === 'dusk') return 19 * 60 + 45;
  return 22 * 60 + 30;
}

export function formatMinutesAsClock(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mm = String(normalized % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ============================================================================
// 1. Viewport & Floor State Signals
// ============================================================================

export const floorViewMode: Signal<FloorViewMode> = signal<FloorViewMode>('ground');
export const ceilingCutaway: Signal<boolean> = signal<boolean>(true);
export const activeRoomId: Signal<string> = signal<string>('kitchen');
export const walkthroughActive: Signal<boolean> = signal<boolean>(false);
export const walkthroughFloorLabel: Signal<string> = signal<string>('KITCHEN · +0.05m');
export const sunMinutes: Signal<number> = signal<number>(timeOfDayToSunMinutes('dusk'));
export const fpsCount: Signal<number> = signal<number>(60);

// ============================================================================
// 2. KNX Bus Telemetry Signals
// ============================================================================

export const telegramCount: Signal<number> = signal<number>(0);
export const recentTelegrams: Signal<readonly KNXTelegram[]> = signal<readonly KNXTelegram[]>([]);
export const activeScenePreset: Signal<number> = signal<number>(0);
export const knxDeviceStates: Signal<Readonly<Record<CircuitId, number>>> =
  signal<Readonly<Record<CircuitId, number>>>(createInitialDeviceStates());

// ============================================================================
// 3. 3D Issue Annotator Signals
// ============================================================================

export const annotatorActive: Signal<boolean> = signal<boolean>(false);
export const annotationTool: Signal<AnnotationToolMode> = signal<AnnotationToolMode>('pin');
export const annotationsList: Signal<readonly SceneAnnotationRecord[]> =
  signal<readonly SceneAnnotationRecord[]>([]);
export const selectedAnnotationId: Signal<number | null> = signal<number | null>(null);
export const usdaPreviewOpen: Signal<boolean> = signal<boolean>(false);

// ============================================================================
// 4. OpenUSD Stage Studio HUD Signals
// ============================================================================

export const usdPanelOpen: Signal<boolean> = signal<boolean>(true);
export const usdStageStats: Signal<UsdStageStatsSummary | null> =
  signal<UsdStageStatsSummary | null>(null);
export const selectedUsdPrimPath: Signal<string | null> = signal<string | null>(null);
export const usdSearchQuery: Signal<string> = signal<string>('');

// ============================================================================
// 5. Appliance & Room Focus HUD Signals
// ============================================================================

export const focusedApplianceId: Signal<string | null> = signal<string | null>(null);
export const focusedApplianceLabel: Signal<string> = signal<string>('Crox Farmhouse');
export const focusModalOpen: Signal<boolean> = signal<boolean>(false);

// ============================================================================
// 6. Derived Computed Signals (Zero Idle Overhead)
// ============================================================================

export const floorModeLabel: ReadonlySignal<string> = computed(() => {
  const mode = floorViewMode.value;
  if (mode === 'ground') return 'GROUND FLOOR';
  if (mode === 'first') return '1ST FLOOR';
  return 'FULL HOUSE + ROOF';
});

export const formattedSunTime: ReadonlySignal<string> = computed(() =>
  formatMinutesAsClock(sunMinutes.value)
);

export const activeCircuitsCount: ReadonlySignal<number> = computed(() => {
  const levels = knxDeviceStates.value;
  let on = 0;
  for (const circuit of CIRCUITS) {
    if ((levels[circuit.id] ?? 0) > 0) {
      on += 1;
    }
  }
  return on;
});

export const totalCircuitsCount: ReadonlySignal<number> = computed(() => CIRCUITS.length);

export const annotationCountsByKind: ReadonlySignal<{
  readonly total: number;
  readonly pins: number;
  readonly moves: number;
  readonly measures: number;
}> = computed(() => {
  const list = annotationsList.value;
  let pins = 0;
  let moves = 0;
  let measures = 0;
  for (const r of list) {
    const kind = r.kind ?? 'pin';
    if (kind === 'move') moves += 1;
    else if (kind === 'measure') measures += 1;
    else pins += 1;
  }
  return {
    total: list.length,
    pins,
    moves,
    measures,
  };
});

export const usdParametricSummary: ReadonlySignal<{
  readonly totalPrims: number;
  readonly cubeCount: number;
  readonly cylinderCount: number;
  readonly sphereCount: number;
  readonly parametricPct: number;
  readonly usdaZoneCount: number;
  readonly sublayerCount: number;
}> = computed(() => {
  const s = usdStageStats.value;
  if (!s) {
    return {
      totalPrims: 0,
      cubeCount: 0,
      cylinderCount: 0,
      sphereCount: 0,
      parametricPct: 0,
      usdaZoneCount: 0,
      sublayerCount: 20,
    };
  }
  const parametricTotal = s.cubeCount + s.cylinderCount + s.sphereCount + s.coneCount;
  const parametricPct =
    s.totalPrims > 0 ? Math.round((parametricTotal / s.totalPrims) * 100) : 0;
  return {
    totalPrims: s.totalPrims,
    cubeCount: s.cubeCount,
    cylinderCount: s.cylinderCount,
    sphereCount: s.sphereCount,
    parametricPct,
    usdaZoneCount: s.usdaZoneCount,
    sublayerCount: s.sublayerCount,
  };
});

// ============================================================================
// 7. Batched Store Synchronization API
// ============================================================================

export interface TwinStore {
  readonly floorViewMode: Signal<FloorViewMode>;
  readonly ceilingCutaway: Signal<boolean>;
  readonly activeRoomId: Signal<string>;
  readonly walkthroughActive: Signal<boolean>;
  readonly walkthroughFloorLabel: Signal<string>;
  readonly sunMinutes: Signal<number>;
  readonly fpsCount: Signal<number>;

  readonly telegramCount: Signal<number>;
  readonly recentTelegrams: Signal<readonly KNXTelegram[]>;
  readonly activeScenePreset: Signal<number>;
  readonly knxDeviceStates: Signal<Readonly<Record<CircuitId, number>>>;

  readonly annotatorActive: Signal<boolean>;
  readonly annotationTool: Signal<AnnotationToolMode>;
  readonly annotationsList: Signal<readonly SceneAnnotationRecord[]>;
  readonly selectedAnnotationId: Signal<number | null>;
  readonly usdaPreviewOpen: Signal<boolean>;

  readonly usdPanelOpen: Signal<boolean>;
  readonly usdStageStats: Signal<UsdStageStatsSummary | null>;
  readonly selectedUsdPrimPath: Signal<string | null>;
  readonly usdSearchQuery: Signal<string>;

  readonly focusedApplianceId: Signal<string | null>;
  readonly focusedApplianceLabel: Signal<string>;
  readonly focusModalOpen: Signal<boolean>;

  readonly floorModeLabel: ReadonlySignal<string>;
  readonly formattedSunTime: ReadonlySignal<string>;
  readonly activeCircuitsCount: ReadonlySignal<number>;
  readonly totalCircuitsCount: ReadonlySignal<number>;
  readonly annotationCountsByKind: ReadonlySignal<{
    readonly total: number;
    readonly pins: number;
    readonly moves: number;
    readonly measures: number;
  }>;
  readonly usdParametricSummary: ReadonlySignal<{
    readonly totalPrims: number;
    readonly cubeCount: number;
    readonly cylinderCount: number;
    readonly sphereCount: number;
    readonly parametricPct: number;
    readonly usdaZoneCount: number;
    readonly sublayerCount: number;
  }>;

  syncViewportState(update: {
    readonly floorViewMode?: FloorViewMode;
    readonly ceilingCutaway?: boolean;
    readonly activeRoomId?: string;
    readonly walkthroughActive?: boolean;
    readonly walkthroughFloorLabel?: string;
    readonly sunMinutes?: number;
    readonly fpsCount?: number;
  }): void;

  syncKnxState(update: {
    readonly telegramCount?: number;
    readonly recentTelegrams?: readonly KNXTelegram[];
    readonly activeScenePreset?: number;
    readonly knxDeviceStates?: Readonly<CircuitLevels>;
  }): void;

  syncAnnotationState(update: {
    readonly annotatorActive?: boolean;
    readonly annotationTool?: AnnotationToolMode;
    readonly annotationsList?: readonly SceneAnnotationRecord[];
    readonly selectedAnnotationId?: number | null;
    readonly usdaPreviewOpen?: boolean;
  }): void;

  syncUsdStageState(update: {
    readonly usdPanelOpen?: boolean;
    readonly usdStageStats?: UsdStageStatsSummary | null;
    readonly selectedUsdPrimPath?: string | null;
    readonly usdSearchQuery?: string;
  }): void;

  syncFocusState(update: {
    readonly focusedApplianceId?: string | null;
    readonly focusedApplianceLabel?: string;
    readonly focusModalOpen?: boolean;
    readonly activeRoomId?: string;
  }): void;
}

export const twinStore: TwinStore = {
  floorViewMode,
  ceilingCutaway,
  activeRoomId,
  walkthroughActive,
  walkthroughFloorLabel,
  sunMinutes,
  fpsCount,

  telegramCount,
  recentTelegrams,
  activeScenePreset,
  knxDeviceStates,

  annotatorActive,
  annotationTool,
  annotationsList,
  selectedAnnotationId,
  usdaPreviewOpen,

  usdPanelOpen,
  usdStageStats,
  selectedUsdPrimPath,
  usdSearchQuery,

  focusedApplianceId,
  focusedApplianceLabel,
  focusModalOpen,

  floorModeLabel,
  formattedSunTime,
  activeCircuitsCount,
  totalCircuitsCount,
  annotationCountsByKind,
  usdParametricSummary,

  syncViewportState(update): void {
    batch(() => {
      if (update.floorViewMode !== undefined) {
        floorViewMode.value = update.floorViewMode;
      }
      if (update.ceilingCutaway !== undefined) {
        ceilingCutaway.value = update.ceilingCutaway;
      }
      if (update.activeRoomId !== undefined) {
        activeRoomId.value = update.activeRoomId;
      }
      if (update.walkthroughActive !== undefined) {
        walkthroughActive.value = update.walkthroughActive;
      }
      if (update.walkthroughFloorLabel !== undefined) {
        walkthroughFloorLabel.value = update.walkthroughFloorLabel;
      }
      if (update.sunMinutes !== undefined) {
        sunMinutes.value = update.sunMinutes;
      }
      if (update.fpsCount !== undefined) {
        fpsCount.value = update.fpsCount;
      }
    });
  },

  syncKnxState(update): void {
    batch(() => {
      if (update.telegramCount !== undefined) {
        telegramCount.value = update.telegramCount;
      }
      if (update.recentTelegrams !== undefined) {
        recentTelegrams.value = update.recentTelegrams;
      }
      if (update.activeScenePreset !== undefined) {
        activeScenePreset.value = update.activeScenePreset;
      }
      if (update.knxDeviceStates !== undefined) {
        knxDeviceStates.value = { ...update.knxDeviceStates };
      }
    });
  },

  syncAnnotationState(update): void {
    batch(() => {
      if (update.annotatorActive !== undefined) {
        annotatorActive.value = update.annotatorActive;
      }
      if (update.annotationTool !== undefined) {
        annotationTool.value = update.annotationTool;
      }
      if (update.annotationsList !== undefined) {
        annotationsList.value = [...update.annotationsList];
      }
      if (update.selectedAnnotationId !== undefined) {
        selectedAnnotationId.value = update.selectedAnnotationId;
      }
      if (update.usdaPreviewOpen !== undefined) {
        usdaPreviewOpen.value = update.usdaPreviewOpen;
      }
    });
  },

  syncUsdStageState(update): void {
    batch(() => {
      if (update.usdPanelOpen !== undefined) {
        usdPanelOpen.value = update.usdPanelOpen;
      }
      if (update.usdStageStats !== undefined) {
        usdStageStats.value = update.usdStageStats;
      }
      if (update.selectedUsdPrimPath !== undefined) {
        selectedUsdPrimPath.value = update.selectedUsdPrimPath;
      }
      if (update.usdSearchQuery !== undefined) {
        usdSearchQuery.value = update.usdSearchQuery;
      }
    });
  },

  syncFocusState(update): void {
    batch(() => {
      if (update.focusedApplianceId !== undefined) {
        focusedApplianceId.value = update.focusedApplianceId;
      }
      if (update.focusedApplianceLabel !== undefined) {
        focusedApplianceLabel.value = update.focusedApplianceLabel;
      }
      if (update.focusModalOpen !== undefined) {
        focusModalOpen.value = update.focusModalOpen;
      }
      if (update.activeRoomId !== undefined) {
        activeRoomId.value = update.activeRoomId;
      }
    });
  },
};
