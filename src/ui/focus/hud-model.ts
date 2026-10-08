import type { CircuitConfig, CircuitId } from '../../core/types/knx.ts';
import type { FloorId, RoomBoundingBox, RoomZoneId } from '../../core/types/topology.ts';

/** Named lighting scene preset for a room in the focus-aware HUD. */
export interface HudRoomScene {
  readonly id: string;
  readonly label: string;
  readonly levels: Readonly<Partial<Record<CircuitId, number>>>;
}

/** A room as presented by the focus-aware HUD. */
export interface HudRoom {
  readonly zoneId: RoomZoneId;
  readonly name: string;
  readonly shortName: string;
  readonly floorId: FloorId;
  readonly isInterior: boolean;
  readonly bounds: RoomBoundingBox;
  readonly circuits: readonly CircuitConfig[];
  readonly scenes?: readonly HudRoomScene[];
}

export interface HudFloor {
  readonly floorId: FloorId;
  readonly name: string;
  readonly rooms: readonly HudRoom[];
}

/**
 * Home-specific data the focus HUD renders from. Built by each home
 * (see `homes/<home>/hud-model.ts`), so the HUD itself stays home-agnostic.
 */
export interface HomeHudModel {
  readonly homeName: string;
  readonly floors: readonly HudFloor[];
  readonly exteriorRooms: readonly HudRoom[];
  readonly circuits: readonly CircuitConfig[];
  getRoom(zoneId: RoomZoneId): HudRoom | undefined;
}
