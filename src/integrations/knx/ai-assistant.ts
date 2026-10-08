import type { PropertyScene } from '../../engine/viewer/property-scene.ts';
import type { CircuitId } from '../../core/types/knx.ts';
import type { TimeOfDay } from '../../core/types/scene.ts';
import { CIRCUITS, DEFAULT_SCENES, SCENE_CIRCUIT_IDS } from './constants.ts';
import {
  KNXPropertyBusController,
  NIGHT_WALK_ABOVE_CABINET_PCT,
  NIGHT_WALK_SPOTLIGHTS_PCT,
  NIGHT_WALK_UNDER_CABINET_PCT,
  NIGHT_WALK_UPLIGHTS_PCT,
  NIGHT_WALK_UTILITY_PCT,
  TV_ARTWORKS,
} from './emulator.ts';

export interface KNXToolParameterProperty {
  readonly type: 'NUMBER' | 'INTEGER' | 'STRING' | 'BOOLEAN' | 'ARRAY';
  readonly description: string;
  readonly enum?: readonly string[];
  readonly items?: {
    readonly type: 'STRING';
    readonly enum?: readonly string[];
  };
}

export interface KNXFunctionDeclaration {
  readonly name: string;
  readonly description: string;
  readonly parameters: {
    readonly type: 'OBJECT';
    readonly properties: Readonly<Record<string, KNXToolParameterProperty>>;
    readonly required?: readonly string[];
  };
}

export type SceneNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Formal Gemini / Vertex AI Function Declarations exposed by the Crox Farmhouse KNX IP Bridge (PA 1.1.2).
 */
export const KNX_AI_TOOLS: readonly KNXFunctionDeclaration[] = [
  {
    name: 'recall_scene',
    description:
      'Recall one of the 8 preset scenes stored in KNX Dimming Actuator 1.1.20 via GA 1/0/1 (DPT 17.001). Scenes 1-3 are on the physical Corston 2-Way Toggle Switches (1=Cooking, 2=Dining, 3=Lounge). Scenes 4-8 are Extended AI/UI Scenes (4=Morning Coffee, 5=Cocktail Party, 6=Wine & Intimate, 7=Courtyard Glow, 8=Baking & Detail).',
    parameters: {
      type: 'OBJECT',
      properties: {
        sceneNumber: {
          type: 'INTEGER',
          description:
            'Scene number 1 to 8: 1=Cooking, 2=Dining, 3=Lounge, 4=Morning Coffee, 5=Cocktail Party, 6=Wine & Intimate, 7=Courtyard Glow, 8=Baking & Detail.',
        },
        reason: {
          type: 'STRING',
          description: 'Short friendly 1-sentence explanation of why this scene was chosen.',
        },
      },
      required: ['sceneNumber'],
    },
  },
  {
    name: 'set_master_state',
    description:
      'Trigger the master long-press lighting state: "all_full" brings all 6 kitchen circuits to 100% Full On (GA 1/0/2, equivalent to Hold Up); "off" triggers Full Off / Night-Walk Dim (GA 1/0/0, equivalent to Hold Down, which keeps Under-Cabinet at 18%, Above-Cabinet Plinth Strip LEDs at 20%, & Bifold Uplights at 15% when <100 lx and PIR motion is detected, or 0% when vacant).',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: {
          type: 'STRING',
          enum: ['all_full', 'off'],
          description: '"all_full" for 100% Full On, or "off" for Full Off / Night-Walk Dim.',
        },
        reason: {
          type: 'STRING',
          description: 'Short friendly 1-sentence explanation.',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'set_circuit_levels',
    description:
      'Set granular absolute dimming percentages (0-100) for any combination of the 9 individual KNX lighting channels on Actuator 1.1.20 (GA 1/2/1..9, DPT 5.001), including indoor kitchen/utility circuits, Above-Cabinet Plinth Strip LEDs, and the outdoor Cobbled Courtyard Festoon Lighting & Reclaimed Lamp Post. Use this whenever the user asks for custom lighting, outdoor courtyard lighting, specific fixtures, or a mood not covered by a single preset scene.',
    parameters: {
      type: 'OBJECT',
      properties: {
        islandPendants: {
          type: 'INTEGER',
          description: 'Ch 1 (GA 1/2/1): 3 Concrete Round Dome Pendants over Hague Blue Island (0-100).',
        },
        sittingPendants: {
          type: 'INTEGER',
          description: 'Ch 2 (GA 1/2/2): 2 Vintage Filament Glass Pendants in Sitting Area (0-100).',
        },
        bifoldUplights: {
          type: 'INTEGER',
          description: 'Ch 3 (GA 1/2/3): 5 Recessed Floor Uplights in front of South Bifolds (0-100).',
        },
        spotlights: {
          type: 'INTEGER',
          description: 'Ch 4 (GA 1/2/4): 10 Warm-Dim Kitchen Ceiling Downlights (0-100).',
        },
        underCabinet: {
          type: 'INTEGER',
          description: 'Ch 5 (GA 1/2/5): Warm LED Strips under Shaker Wall Cupboards & AGA Hood (0-100).',
        },
        aboveCabinet: {
          type: 'INTEGER',
          description:
            'Ch 9 (GA 1/2/9): Warm LED Uplight Strips inset inside the recessed cornice plinth voids above the kitchen cabinets (0-100).',
        },
        utilitySpotlights: {
          type: 'INTEGER',
          description: 'Ch 6 (GA 1/2/6): 2 Recessed Downlights in Utility Room (0-100).',
        },
        courtyardFestoons: {
          type: 'INTEGER',
          description:
            'Ch 7 (GA 1/2/7): Outdoor Warm Catenary Festoon Bulbs strung across the Cobbled Courtyard outside the bifold doors (0-100).',
        },
        reclaimedLampPost: {
          type: 'INTEGER',
          description:
            'Ch 8 (GA 1/2/8): Outdoor Traditional Reclaimed Cast-Iron Victorian Lamp Post in the Cobbled Courtyard (0-100).',
        },
        familyRoomSpots: {
          type: 'INTEGER',
          description:
            'Ch 10 (GA 1/2/10): 6 Recessed Ceiling Downlights between Exposed White Joists + Alcove Floor & Table Lamps in the Dining Room (0-100).',
        },
        reason: {
          type: 'STRING',
          description: 'Short friendly 1-sentence explanation of the custom lighting mix.',
        },
      },
    },
  },
  {
    name: 'adjust_circuit_levels',
    description:
      'Relatively brighten (+deltaPct) or dim (-deltaPct) one or more lighting circuits from their current live percentage.',
    parameters: {
      type: 'OBJECT',
      properties: {
        circuits: {
          type: 'ARRAY',
          description: 'Array of circuit IDs to adjust.',
          items: {
            type: 'STRING',
            enum: [
              'islandPendants',
              'sittingPendants',
              'bifoldUplights',
              'spotlights',
              'underCabinet',
              'aboveCabinet',
              'utilitySpotlights',
              'courtyardFestoons',
              'reclaimedLampPost',
              'familyRoomSpots',
            ],
          },
        },
        deltaPct: {
          type: 'INTEGER',
          description: 'Signed percentage delta (-100 to +100, e.g. -25 to dim by 25%, +20 to brighten by 20%).',
        },
      },
      required: ['circuits', 'deltaPct'],
    },
  },
  {
    name: 'save_scene_preset',
    description:
      'Store the current live kitchen dimming levels into Scene 1..8 in KNX Actuator 1.1.20 EEPROM (GA 1/0/1, DPT 18.001).',
    parameters: {
      type: 'OBJECT',
      properties: {
        sceneNumber: {
          type: 'INTEGER',
          description: 'Target scene number (1 to 8) to overwrite with current levels.',
        },
      },
    },
  },
  {
    name: 'control_tv_art',
    description:
      'Cycle or select the artwork displayed on the Sitting Area Frame TV in Art Mode (GA 1/4/4, DPT 17.001). Artworks: 1 = Tur Langton Sunset (pastoral hills), 2 = St Ives Modernist (geometric abstract), 3 = Botanical Meadow (watercolour flora), 4 = Nocturne in Blue & Gold (coastal horizon).',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: ['next', 'select'],
          description: '"next" to cycle to the next painting, or "select" to pick a specific artNumber (1-4).',
        },
        artNumber: {
          type: 'INTEGER',
          description: '1 = Tur Langton Sunset, 2 = St Ives Modernist, 3 = Botanical Meadow, 4 = Nocturne in Blue & Gold.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'set_environment',
    description:
      'Control simulator environment states: time of day (day/dusk/night ambient lux), kitchen/utility PIR motion occupancy sensors (which also control the Frame TV Art Mode auto-on/off and Night-Walk Dim), bifold doors, or the motorized dual-leaf Front Car Entrance Gates (GA 1/5/1, 10s travel).',
    parameters: {
      type: 'OBJECT',
      properties: {
        timeOfDay: {
          type: 'STRING',
          enum: ['day', 'dusk', 'night'],
          description: 'Set exterior daylight/lux level: day (480 lx), dusk (38 lx), or night (5 lx).',
        },
        kitchenMotion: {
          type: 'BOOLEAN',
          description: 'Kitchen ceiling PIR sensor (1.1.12) motion state (also wakes/turns off Frame TV Art Mode).',
        },
        utilityMotion: {
          type: 'BOOLEAN',
          description: 'Utility ceiling PIR sensor (1.1.13) motion state.',
        },
        bifoldsOpen: {
          type: 'BOOLEAN',
          description: 'Open (true) or close (false) the South Courtyard bifold doors.',
        },
        carGatesOpen: {
          type: 'BOOLEAN',
          description: 'Open (true) or close (false) the motorized dual-leaf Front Car Entrance Gates (PA 1.1.22, GA 1/5/1, 10.0s synchronized swing).',
        },
      },
    },
  },
];

export type CircuitLevelsPartial = Partial<Record<CircuitId, number>>;

export type KNXToolCall =
  | {
      readonly name: 'recall_scene';
      readonly args: { readonly sceneNumber: SceneNumber; readonly reason?: string };
    }
  | {
      readonly name: 'set_master_state';
      readonly args: { readonly mode: 'all_full' | 'off'; readonly reason?: string };
    }
  | {
      readonly name: 'set_circuit_levels';
      readonly args: CircuitLevelsPartial & { readonly reason?: string };
    }
  | {
      readonly name: 'adjust_circuit_levels';
      readonly args: {
        readonly circuits: readonly CircuitId[];
        readonly deltaPct: number;
      };
    }
  | {
      readonly name: 'save_scene_preset';
      readonly args: { readonly sceneNumber?: SceneNumber };
    }
  | {
      readonly name: 'control_tv_art';
      readonly args: {
        readonly action: 'next' | 'select';
        readonly artNumber?: 1 | 2 | 3 | 4;
      };
    }
  | {
      readonly name: 'set_environment';
      readonly args: {
        readonly timeOfDay?: TimeOfDay;
        readonly kitchenMotion?: boolean;
        readonly utilityMotion?: boolean;
        readonly bifoldsOpen?: boolean;
        readonly carGatesOpen?: boolean;
      };
    };

export interface ExecutedToolCallRecord {
  readonly call: KNXToolCall;
  readonly formatted: string;
}

export interface AIAssistantExecutionResult {
  readonly prompt: string;
  readonly modelUsed: string;
  readonly executedCalls: readonly ExecutedToolCallRecord[];
  readonly reply: string;
}

interface VertexFunctionCallPart {
  readonly name?: string;
  readonly args?: Readonly<Record<string, unknown>>;
}

interface VertexContentPart {
  readonly text?: string;
  readonly functionCall?: VertexFunctionCallPart;
}

interface VertexCandidate {
  readonly content?: {
    readonly parts?: readonly VertexContentPart[];
  };
}

interface VertexGenerateContentResponse {
  readonly candidates?: readonly VertexCandidate[];
  readonly modelVersion?: string;
  readonly error?: {
    readonly message?: string;
  };
}

const VALID_CIRCUIT_IDS: readonly CircuitId[] = [
  'islandPendants',
  'sittingPendants',
  'bifoldUplights',
  'spotlights',
  'underCabinet',
  'aboveCabinet',
  'utilitySpotlights',
  'courtyardFestoons',
  'reclaimedLampPost',
  'familyRoomSpots',
  'bootLobbyPendant',
  'hallPendant',
  'frontRoomPendant',
  'entranceHallPendant',
  'livingRoomPendant',
  'studyPendant',
  'mainBedroomPendant',
  'familyBathroomPendant',
  'upperLandingPendant',
  'bedroom2Pendant',
  'bedroom3Pendant',
  'bedroom4Pendant',
];

function formatToolCallString(call: KNXToolCall): string {
  const cleanArgs: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(call.args)) {
    if (k !== 'reason' && v !== undefined) {
      cleanArgs[k] = v;
    }
  }
  return `${call.name}(${JSON.stringify(cleanArgs)})`;
}

export class KNXAIAssistant {
  private readonly knx: KNXPropertyBusController;
  private readonly scene: PropertyScene;
  private readonly onEnvironmentSync?: () => void;
  private selectedModel: 'gemini-3.5-flash-lite' | 'gemini-3.5-flash' =
    'gemini-3.5-flash-lite';

  public constructor(
    knx: KNXPropertyBusController,
    scene: PropertyScene,
    onEnvironmentSync?: () => void
  ) {
    this.knx = knx;
    this.scene = scene;
    this.onEnvironmentSync = onEnvironmentSync;
  }

  public getSelectedModel(): string {
    return this.selectedModel;
  }

  public setSelectedModel(
    model: 'gemini-3.5-flash-lite' | 'gemini-3.5-flash'
  ): void {
    this.selectedModel = model;
  }

  private buildSystemPrompt(): string {
    const levels = this.knx.getTargetLevels();
    const activeIdx = this.knx.getActiveSceneIndex();
    const scenes = this.knx.getScenes();
    const activeSceneName =
      activeIdx === -1
        ? 'Off / Night-Walk Dim'
        : activeIdx === 99
          ? 'All Full On (100%)'
          : scenes[activeIdx]
            ? `${scenes[activeIdx].code} (${scenes[activeIdx].name})`
            : 'Custom';

    const sceneListDesc = DEFAULT_SCENES.map((s) => {
      const outStr = s.outdoorLevels
        ? `, Festoons=${s.outdoorLevels.courtyardFestoons}%, LampPost=${s.outdoorLevels.reclaimedLampPost}%`
        : '';
      return `- Scene ${s.number} ("${s.name}", ${s.isSwitchScene ? 'Physical Switch + AI' : 'Extended AI/UI Only'}): Island=${s.levels.islandPendants}%, Sitting=${s.levels.sittingPendants}%, Uplights=${s.levels.bifoldUplights}%, Spots=${s.levels.spotlights}%, UnderCabinet=${s.levels.underCabinet}%, AboveCabinet=${s.levels.aboveCabinet}%${outStr}`;
    }).join('\n');

    return [
      'You are the intelligent KNX Smart Home & Lighting Assistant (PA 1.1.2) for the kitchen, utility room, and cobbled courtyard at Crox Farmhouse in Tur Langton.',
      'You have full granular control over all 9 lighting circuits (0-100%) — including the 6 indoor kitchen circuits (including Above-Cabinet Plinth Strip LEDs), 1 utility room circuit, and 2 outdoor cobbled courtyard circuits (courtyardFestoons & reclaimedLampPost) — plus 8 preset scenes, the Sitting Area Frame TV Art Mode, and the room environment/sensors.',
      '',
      'AVAILABLE PRESET SCENES (GA 1/0/1):',
      sceneListDesc,
      '',
      '9 LIGHTING CIRCUITS (Actuator 1.1.20):',
      '- islandPendants (Ch 1, GA 1/2/1): 3 Concrete Round Dome Pendants over the Hague Blue Island',
      '- sittingPendants (Ch 2, GA 1/2/2): 2 Spaced-Apart Clear Glass Vintage Filament Pendants in the Sitting Area',
      '- bifoldUplights (Ch 3, GA 1/2/3): 5 Recessed Floor Uplights in front of the 4 South Courtyard Bifold Doors',
      '- spotlights (Ch 4, GA 1/2/4): 10 Warm-Dim Recessed Ceiling Downlights across the main kitchen ceiling',
      '- underCabinet (Ch 5, GA 1/2/5): Warm LED Strips under the Dove Grey Shaker wall cupboards, AGA hood & island',
      '- aboveCabinet (Ch 9, GA 1/2/9): Warm LED Uplight Strips inset inside the recessed cornice plinth voids above the kitchen cabinets',
      '- utilitySpotlights (Ch 6, GA 1/2/6): 2 Recessed Ceiling Downlights in the Utility Room',
      '- courtyardFestoons (Ch 7, GA 1/2/7): Outdoor Warm Catenary Festoon Lighting strung over the Cobbled Courtyard outside the bifold doors (also controlled by Gang 2 of the 2-gang Corston switch next to the bifolds)',
      '- reclaimedLampPost (Ch 8, GA 1/2/8): Outdoor Traditional Reclaimed Cast-Iron Victorian Lamp Post in the Cobbled Courtyard (also controlled by Gang 2 of the 2-gang Corston switch next to the bifolds)',
      '- familyRoomSpots (Ch 10, GA 1/2/10): 6 Recessed Ceiling Downlights between Exposed White Joists + Alcove Floor & Table Lamps in the Dining Room',
      '',
      'CURRENT LIVE ROOM & COURTYARD STATE:',
      `- Active Scene: ${activeSceneName}`,
      `- Live Circuit Levels: islandPendants=${levels.islandPendants}%, sittingPendants=${levels.sittingPendants}%, bifoldUplights=${levels.bifoldUplights}%, spotlights=${levels.spotlights}%, underCabinet=${levels.underCabinet}%, aboveCabinet=${levels.aboveCabinet}%, utilitySpotlights=${levels.utilitySpotlights}%, familyRoomSpots=${levels.familyRoomSpots}%, courtyardFestoons=${levels.courtyardFestoons}%, reclaimedLampPost=${levels.reclaimedLampPost}%`,
      `- Ambient Light: ${this.knx.getAmbientLux()} lx (Night-Walk Dim threshold < ${this.knx.getFlashedParams().luxThreshold} lx)`,
      `- Kitchen PIR Presence (1.1.12): ${this.knx.getKitchenMotionDetected() ? 'Motion Detected (Occupied)' : 'Vacant (No Motion)'}`,
      `- Utility PIR Presence (1.1.13): ${this.knx.getUtilityMotionDetected() ? 'Motion Detected (Occupied)' : 'Vacant (No Motion)'}`,
      `- Sitting Area Frame TV: ${this.knx.isTvArtModeActive() ? `Art Mode ON (Art ${this.knx.getTvArtIndex() + 1}: "${this.knx.getTvArtTitle()}")` : 'Auto-OFF (Standby)'}`,
      `- Bifold Doors: ${this.scene.isBifoldsOpen() ? 'Open' : 'Closed'}`,
      `- Motorized Front Car Gates (PA 1.1.22, GA 1/5/1): ${this.knx.getCarGatesStatusLabel()}`,
      '',
      'INSTRUCTIONS:',
      '1. Always call one or more tool functions to fulfill the user request.',
      '2. IMPORTANT FOR UTILITY ROOM: Preset scenes (1-8) ONLY control the kitchen and courtyard circuits and DO NOT change `utilitySpotlights` (Ch 6, GA 1/2/6). Whenever the user mentions the utility room or utility lights (e.g. turn on, turn off, dim, brighten, or set a percentage), you MUST call `set_circuit_levels` with `utilitySpotlights` (0-100) or `adjust_circuit_levels` with `circuits: ["utilitySpotlights"]`.',
      '3. If the user mentions outside, the cobbled courtyard, the festoon lights, or the reclaimed lamp post, set `courtyardFestoons` and/or `reclaimedLampPost` via `set_circuit_levels` (or recall Scene 7 "Courtyard Glow" / Scene 5 "Cocktail Party").',
      '4. If the user asks to open or close the front car gates / driveway gates, call `set_environment` with `carGatesOpen: true` or `false`.',
      '5. Always populate the `reason` field (or include a short text part) explaining your lighting choices concisely in 1 sentence.',
    ].join('\n');
  }

  /**
   * Calls Gemini 2.5 Flash/Pro on Vertex AI via the Vite server proxy (/api/knx-ai)
   * with native function calling, falling back to local parsing only if the network fails.
   */
  public async executeCommand(rawPrompt: string): Promise<AIAssistantExecutionResult> {
    const prompt = rawPrompt.trim();
    if (!prompt) {
      return {
        prompt: '',
        modelUsed: this.selectedModel,
        executedCalls: [],
        reply:
          'Ready. Ask naturally in your own words (e.g., "We’re having a glass of wine by the bifolds, make it cosy and put the nocturne on the TV" or "It’s too bright overhead while I read in the sitting area").',
      };
    }

    try {
      const vertexRequest = {
        systemInstruction: {
          parts: [{ text: this.buildSystemPrompt() }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        tools: [
          {
            functionDeclarations: KNX_AI_TOOLS,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      };

      const resp = await fetch('/api/knx-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.selectedModel,
          vertexRequest,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = (await resp.json()) as VertexGenerateContentResponse;
      const parts = data.candidates?.[0]?.content?.parts ?? [];

      const parsedCalls: KNXToolCall[] = [];
      const textParts: string[] = [];
      const reasonParts: string[] = [];

      for (const part of parts) {
        if (typeof part.text === 'string' && part.text.trim()) {
          textParts.push(part.text.trim());
        }
        if (part.functionCall && typeof part.functionCall.name === 'string') {
          const coerced = this.coerceRawFunctionCall(
            part.functionCall.name,
            part.functionCall.args ?? {}
          );
          if (coerced) {
            parsedCalls.push(coerced);
            if ('reason' in coerced.args && typeof coerced.args.reason === 'string') {
              reasonParts.push(coerced.args.reason);
            }
          }
        }
      }

      const executedCalls: ExecutedToolCallRecord[] = [];
      const actionSummaries: string[] = [];

      for (const call of parsedCalls) {
        const summary = this.invokeToolCall(call);
        executedCalls.push({
          call,
          formatted: formatToolCallString(call),
        });
        if (summary) {
          actionSummaries.push(summary);
        }
      }

      const naturalExplanation = textParts.join(' ') || reasonParts.join(' ');
      const reply = naturalExplanation
        ? actionSummaries.length > 0
          ? `${naturalExplanation} (${actionSummaries.join(' · ')})`
          : naturalExplanation
        : actionSummaries.join(' · ') || 'No lighting changes needed.';

      return {
        prompt,
        modelUsed: data.modelVersion ?? this.selectedModel,
        executedCalls,
        reply,
      };
    } catch {
      // Fallback to local parser only if Vertex proxy is unreachable
      return this.executeFallbackLocalParser(prompt);
    }
  }

  private coerceRawFunctionCall(
    name: string,
    rawArgs: Readonly<Record<string, unknown>>
  ): KNXToolCall | null {
    const reason = typeof rawArgs.reason === 'string' ? rawArgs.reason : undefined;
    const aliasMap: Readonly<Record<string, CircuitId>> = {
      above_cabinet: 'aboveCabinet',
      aboveCab: 'aboveCabinet',
      plinthLeds: 'aboveCabinet',
      utility: 'utilitySpotlights',
      utilityRoom: 'utilitySpotlights',
      utilitySpots: 'utilitySpotlights',
      utility_spotlights: 'utilitySpotlights',
      festoon: 'courtyardFestoons',
      festoons: 'courtyardFestoons',
      courtyard_festoons: 'courtyardFestoons',
      lampPost: 'reclaimedLampPost',
      lamppost: 'reclaimedLampPost',
      reclaimed_lamp_post: 'reclaimedLampPost',
      family: 'familyRoomSpots',
      familyRoom: 'familyRoomSpots',
      family_room: 'familyRoomSpots',
      dining: 'familyRoomSpots',
      diningRoom: 'familyRoomSpots',
      dining_room: 'familyRoomSpots',
      snug: 'familyRoomSpots',
    };

    switch (name) {
      case 'recall_scene': {
        const num = Number(rawArgs.sceneNumber);
        if (num >= 1 && num <= 8) {
          return {
            name: 'recall_scene',
            args: { sceneNumber: Math.round(num) as SceneNumber, ...(reason ? { reason } : {}) },
          };
        }
        return null;
      }

      case 'set_master_state': {
        const mode = rawArgs.mode === 'all_full' ? 'all_full' : 'off';
        return {
          name: 'set_master_state',
          args: { mode, ...(reason ? { reason } : {}) },
        };
      }

      case 'set_circuit_levels': {
        const levels: Partial<Record<CircuitId, number>> = {};
        for (const cId of VALID_CIRCUIT_IDS) {
          const rawVal = rawArgs[cId];
          const numVal =
            typeof rawVal === 'number'
              ? rawVal
              : typeof rawVal === 'string' && rawVal.trim() !== ''
                ? Number(rawVal)
                : NaN;
          if (!Number.isNaN(numVal)) {
            levels[cId] = Math.max(0, Math.min(100, Math.round(numVal)));
          }
        }
        for (const [aliasKey, targetId] of Object.entries(aliasMap)) {
          if (levels[targetId] === undefined && rawArgs[aliasKey] !== undefined) {
            const rawVal = rawArgs[aliasKey];
            const numVal =
              typeof rawVal === 'number'
                ? rawVal
                : typeof rawVal === 'string' && rawVal.trim() !== ''
                   ? Number(rawVal)
                   : NaN;
            if (!Number.isNaN(numVal)) {
              levels[targetId] = Math.max(0, Math.min(100, Math.round(numVal)));
            }
          }
        }
        if (Object.keys(levels).length === 0) {
          return null;
        }
        return {
          name: 'set_circuit_levels',
          args: { ...levels, ...(reason ? { reason } : {}) },
        };
      }

      case 'adjust_circuit_levels': {
        const rawCircuits = Array.isArray(rawArgs.circuits) ? rawArgs.circuits : [];
        const circuits: CircuitId[] = [];
        for (const c of rawCircuits) {
          if (typeof c === 'string') {
            if ((VALID_CIRCUIT_IDS as readonly string[]).includes(c)) {
              circuits.push(c as CircuitId);
            } else if (aliasMap[c]) {
              circuits.push(aliasMap[c]);
            }
          }
        }
        const rawDelta = rawArgs.deltaPct;
        const parsedDelta =
          typeof rawDelta === 'number'
            ? rawDelta
            : typeof rawDelta === 'string' && rawDelta.trim() !== ''
              ? Number(rawDelta)
              : -20;
        const deltaPct = !Number.isNaN(parsedDelta) ? Math.round(parsedDelta) : -20;
        return {
          name: 'adjust_circuit_levels',
          args: {
            circuits: circuits.length > 0 ? circuits : SCENE_CIRCUIT_IDS,
            deltaPct,
          },
        };
      }

      case 'save_scene_preset': {
        const num = Number(rawArgs.sceneNumber);
        const sceneNumber =
          num >= 1 && num <= 8 ? (Math.round(num) as SceneNumber) : undefined;
        return {
          name: 'save_scene_preset',
          args: sceneNumber ? { sceneNumber } : {},
        };
      }

      case 'control_tv_art': {
        const action = rawArgs.action === 'select' || rawArgs.artNumber !== undefined ? 'select' : 'next';
        const num = Number(rawArgs.artNumber);
        const artNumber = num >= 1 && num <= 4 ? (Math.round(num) as 1 | 2 | 3 | 4) : undefined;
        return {
          name: 'control_tv_art',
          args: { action, ...(artNumber ? { artNumber } : {}) },
        };
      }

      case 'set_environment': {
        const tod = rawArgs.timeOfDay;
        const timeOfDay: TimeOfDay | undefined =
          tod === 'day' || tod === 'dusk' || tod === 'night' ? tod : undefined;
        const kitchenMotion =
          typeof rawArgs.kitchenMotion === 'boolean' ? rawArgs.kitchenMotion : undefined;
        const utilityMotion =
          typeof rawArgs.utilityMotion === 'boolean' ? rawArgs.utilityMotion : undefined;
        const bifoldsOpen =
          typeof rawArgs.bifoldsOpen === 'boolean' ? rawArgs.bifoldsOpen : undefined;
        const carGatesOpen =
          typeof rawArgs.carGatesOpen === 'boolean' ? rawArgs.carGatesOpen : undefined;
        return {
          name: 'set_environment',
          args: {
            ...(timeOfDay !== undefined ? { timeOfDay } : {}),
            ...(kitchenMotion !== undefined ? { kitchenMotion } : {}),
            ...(utilityMotion !== undefined ? { utilityMotion } : {}),
            ...(bifoldsOpen !== undefined ? { bifoldsOpen } : {}),
            ...(carGatesOpen !== undefined ? { carGatesOpen } : {}),
          },
        };
      }

      default:
        return null;
    }
  }

  public invokeToolCall(call: KNXToolCall): string {
    switch (call.name) {
      case 'recall_scene': {
        const idx = call.args.sceneNumber - 1;
        const sc = this.knx.getScenes()[idx];
        this.knx.recallScene(idx, '1.1.2', 'AI Assistant');
        return sc
          ? `Recalled ${sc.code} (${sc.name})`
          : `Recalled Scene ${call.args.sceneNumber}`;
      }

      case 'set_master_state': {
        if (call.args.mode === 'all_full') {
          this.knx.handleSwitchLongPressHoldUp('AI Assistant', '1.1.2');
          return 'All kitchen & utility circuits → 100% Full';
        }
        this.knx.handleSwitchLongPressHoldDown('AI Assistant', '1.1.2');
        const kNight = this.knx.isKitchenNightDimActive();
        const uNight = this.knx.isUtilityNightDimActive();
        if (kNight || uNight) {
          return `Night-Walk Dim active (Uplights ${NIGHT_WALK_UPLIGHTS_PCT}%, Spots ${NIGHT_WALK_SPOTLIGHTS_PCT}%, UnderCab ${NIGHT_WALK_UNDER_CABINET_PCT}%, AboveCab ${NIGHT_WALK_ABOVE_CABINET_PCT}%, Utility ${uNight ? NIGHT_WALK_UTILITY_PCT : 0}%)`;
        }
        return 'All lights → 0% Off';
      }

      case 'set_circuit_levels': {
        const changes: string[] = [];
        for (const circuitId of VALID_CIRCUIT_IDS) {
          const pct = call.args[circuitId];
          if (typeof pct === 'number' && !Number.isNaN(pct)) {
            const clamped = Math.max(0, Math.min(100, Math.round(pct)));
            this.knx.setCircuitLevel(circuitId, clamped, true, '1.1.2');
            const cfg = CIRCUITS.find((c) => c.id === circuitId);
            changes.push(`${cfg ? cfg.shortName : circuitId} ${clamped}%`);
          }
        }
        return changes.join(', ');
      }

      case 'adjust_circuit_levels': {
        const current = this.knx.getTargetLevels();
        const changes: string[] = [];
        for (const cId of call.args.circuits) {
          const base = current[cId] ?? 0;
          const next = Math.max(0, Math.min(100, Math.round(base + call.args.deltaPct)));
          this.knx.setCircuitLevel(cId, next, true, '1.1.2');
          const cfg = CIRCUITS.find((c) => c.id === cId);
          changes.push(`${cfg ? cfg.shortName : cId} ${next}%`);
        }
        return changes.join(', ');
      }

      case 'save_scene_preset': {
        const targetIdx =
          call.args.sceneNumber !== undefined ? call.args.sceneNumber - 1 : undefined;
        this.knx.saveCurrentLevelsToActiveScene(targetIdx, '1.1.2');
        const scenes = this.knx.getScenes();
        const savedScene =
          targetIdx !== undefined
            ? scenes[targetIdx]
            : scenes[Math.max(0, this.knx.getActiveSceneIndex())];
        return `Stored ${savedScene ? `${savedScene.code} (${savedScene.name})` : 'Scene'}`;
      }

      case 'control_tv_art': {
        if (call.args.action === 'select' && call.args.artNumber !== undefined) {
          this.knx.setTvArtIndex(call.args.artNumber - 1, true, '1.1.2');
        } else {
          this.knx.cycleTvArt(true, '1.1.2');
        }
        return `TV Art → "${this.knx.getTvArtTitle()}"`;
      }

      case 'set_environment': {
        const envNotes: string[] = [];
        const todLuxMap: Record<TimeOfDay, number> = {
          day: 480,
          dusk: 38,
          night: 5,
        };
        if (call.args.timeOfDay) {
          this.scene.setTimeOfDay(call.args.timeOfDay);
          this.knx.setAmbientLux(todLuxMap[call.args.timeOfDay], true);
          envNotes.push(`Time → ${call.args.timeOfDay.toUpperCase()} (${todLuxMap[call.args.timeOfDay]} lx)`);
        }
        if (typeof call.args.kitchenMotion === 'boolean') {
          this.knx.setKitchenMotionDetected(call.args.kitchenMotion);
          envNotes.push(`Kitchen PIR → ${call.args.kitchenMotion ? 'Motion' : 'Vacant'}`);
        }
        if (typeof call.args.utilityMotion === 'boolean') {
          this.knx.setUtilityMotionDetected(call.args.utilityMotion);
          envNotes.push(`Utility PIR → ${call.args.utilityMotion ? 'Motion' : 'Vacant'}`);
        }
        if (typeof call.args.bifoldsOpen === 'boolean') {
          if (this.scene.isBifoldsOpen() !== call.args.bifoldsOpen) {
            this.scene.toggleBifolds();
          }
          envNotes.push(`Bifolds → ${call.args.bifoldsOpen ? 'Open' : 'Closed'}`);
        }
        if (typeof call.args.carGatesOpen === 'boolean') {
          this.knx.setCarGatesOpen(call.args.carGatesOpen, true, '1.1.2');
          envNotes.push(`Front Car Gates → ${call.args.carGatesOpen ? 'Opening (10s)' : 'Closing (10s)'}`);
        }
        if (this.onEnvironmentSync) {
          this.onEnvironmentSync();
        }
        return envNotes.join(', ');
      }
    }
  }

  private executeFallbackLocalParser(prompt: string): AIAssistantExecutionResult {
    const lower = prompt.toLowerCase();
    const calls: KNXToolCall[] = [];

    if (/\b(?:gate|gates|driveway)\b/i.test(lower)) {
      const shouldOpen = !/\b(?:close|shut|lock)\b/i.test(lower);
      calls.push({
        name: 'set_environment',
        args: { carGatesOpen: shouldOpen },
      });
    } else if (/\b(?:utility)\b/i.test(lower)) {
      const pctMatch = lower.match(/(\d{1,3})\s*%/);
      const targetPct = pctMatch
        ? Math.max(0, Math.min(100, Number(pctMatch[1])))
        : /\b(?:off|dark|0)\b/i.test(lower)
          ? 0
          : /\b(?:dim|low|soft)\b/i.test(lower)
            ? 30
            : 100;
      calls.push({
        name: 'set_circuit_levels',
        args: { utilitySpotlights: targetPct },
      });
    } else if (/\b(?:all\s+off|full\s+off|good\s*night|everything\s+off|\boff\b)\b/i.test(lower)) {
      calls.push({ name: 'set_master_state', args: { mode: 'off' } });
    } else if (/\b(?:all\s+full|full\s+on|everything\s+on|100%)\b/i.test(lower)) {
      calls.push({ name: 'set_master_state', args: { mode: 'all_full' } });
    } else if (/\b(?:coffee|morning)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 4 } });
    } else if (/\b(?:party|cocktail|drinks)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 5 } });
    } else if (/\b(?:wine|intimate|romantic)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 6 } });
    } else if (/\b(?:courtyard|patio|outside|festoon|lamp\s*post)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 7 } });
    } else if (/\b(?:baking|bake)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 8 } });
    } else if (/\b(?:dining|dinner|dine)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 2 } });
    } else if (/\b(?:lounge|relax|cozy|cosy)\b/i.test(lower)) {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 3 } });
    } else {
      calls.push({ name: 'recall_scene', args: { sceneNumber: 1 } });
    }

    const executedCalls: ExecutedToolCallRecord[] = [];
    const summaries: string[] = [];
    for (const c of calls) {
      summaries.push(this.invokeToolCall(c));
      executedCalls.push({ call: c, formatted: formatToolCallString(c) });
    }

    return {
      prompt,
      modelUsed: 'local-fallback',
      executedCalls,
      reply: summaries.join(' · '),
    };
  }
}

export { TV_ARTWORKS };

/**
 * Strict Web Speech API types (zero `any`) for browser voice input.
 */
interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike | undefined;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface WindowWithSpeechRecognition {
  readonly SpeechRecognition?: SpeechRecognitionConstructor;
  readonly webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export class VoiceRecognitionController {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;

  public constructor(
    onInterimTranscript: (text: string) => void,
    onFinalTranscript: (text: string) => void,
    onStateChange: (listening: boolean, errorMsg?: string) => void
  ) {
    const win = window as unknown as WindowWithSpeechRecognition;
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Ctor) {
      return;
    }

    const rec = new Ctor();
    rec.lang = 'en-GB';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = (): void => {
      this.isListening = true;
      onStateChange(true);
    };

    rec.onend = (): void => {
      this.isListening = false;
      onStateChange(false);
    };

    rec.onerror = (event: SpeechRecognitionErrorEventLike): void => {
      this.isListening = false;
      onStateChange(false, event.error);
    };

    rec.onresult = (event: SpeechRecognitionEventLike): void => {
      let interim = '';
      let finalStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const alt = res ? res[0] : undefined;
        if (!res || !alt) continue;
        if (res.isFinal) {
          finalStr += alt.transcript;
        } else {
          interim += alt.transcript;
        }
      }

      if (interim) {
        onInterimTranscript(interim);
      }
      if (finalStr.trim()) {
        onFinalTranscript(finalStr.trim());
      }
    };

    this.recognition = rec;
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public toggle(): void {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch {
        // Already started
      }
    }
  }
}
