/**
 * Single adapter between the UI shell and the home's room data.
 * Swap the manifest import here if the home (or its manifest module) changes.
 */
import {
  CROX_ROOM_MANIFEST,
  getRoomManifest,
  ROOM_NAV_TREE,
} from '../../homes/crox-farmhouse/room-manifest.ts';
import { CROX_ZONE_SCENES } from '../../homes/crox-farmhouse/hud-model.ts';
import { ROOM_ZONES } from '../../integrations/knx/topology.ts';
import type { FloorViewMode } from '../../core/types/scene.ts';
import type { RoomBoundingBox, RoomZoneId } from '../../core/types/topology.ts';
import type { RoomManifestEntry } from '../../core/types/twin-ux.ts';
import type { HudRoomScene } from '../focus/hud-model.ts';

export { CROX_ROOM_MANIFEST, getRoomManifest, ROOM_NAV_TREE };

export interface RoomNavGroupView {
  readonly id: string;
  readonly label: string;
  readonly rooms: readonly RoomManifestEntry[];
}

export const PROPERTY_NAME = 'Crox Farmhouse';

export function getRoomNavTree(): readonly RoomNavGroupView[] {
  return ROOM_NAV_TREE;
}

export function getRoomBounds(zoneId: RoomZoneId): RoomBoundingBox | null {
  return ROOM_ZONES[zoneId]?.bounds ?? null;
}

export function isInteriorRoom(zoneId: RoomZoneId): boolean {
  return ROOM_ZONES[zoneId]?.isInterior ?? false;
}

export function floorModeForRoom(entry: RoomManifestEntry): FloorViewMode {
  return entry.floor === 'first' ? 'first' : 'ground';
}

/**
 * Per-room lighting presets expressed as circuit levels (from the home HUD model).
 * Used when a room has no KNX scene-number scenes in its manifest entry.
 */
export function getRoomLevelScenes(zoneId: RoomZoneId): readonly HudRoomScene[] {
  return CROX_ZONE_SCENES[zoneId] ?? [];
}

export function getRoomLabel(zoneId: RoomZoneId | null): string {
  if (!zoneId) return PROPERTY_NAME;
  return getRoomManifest(zoneId)?.label ?? ROOM_ZONES[zoneId]?.name ?? zoneId;
}
