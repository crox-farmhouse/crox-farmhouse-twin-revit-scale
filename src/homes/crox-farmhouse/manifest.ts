import type { RoomZoneLodRegistration } from '../../core/entities.ts';
import {
  BUILDINGS,
  CIRCUITS,
  DEFAULT_SCENES,
  FLOORS,
  KNX_PHYSICAL_DEVICES,
  ROOM_ZONES,
} from '../../integrations/knx/index.ts';
import { DEFAULT_UNIFI_ACCESS_POINTS } from '../../integrations/unifi/access/adapter.ts';
import { DEFAULT_UNIFI_PROTECT_CAMERAS } from '../../integrations/unifi/protect/adapter.ts';
import type { RoomZoneDefinition } from '../../core/types/topology.ts';

/**
 * Declarative Property Manifest for Crox Farmhouse (Tur Langton).
 *
 * Centralizes all spatial zones, Room LOD bounds, KNX TP1 circuits/scenes,
 * UniFi Protect CCTV cameras, and UniFi Access points for the property.
 */
export const CROX_FARMHOUSE_BUILDINGS = BUILDINGS;
export const CROX_FARMHOUSE_FLOORS = FLOORS;
export const CROX_FARMHOUSE_ROOM_ZONES = ROOM_ZONES;
export const CROX_FARMHOUSE_KNX_DEVICES = KNX_PHYSICAL_DEVICES;
export const CROX_FARMHOUSE_KNX_CIRCUITS = CIRCUITS;
export const CROX_FARMHOUSE_KNX_SCENES = DEFAULT_SCENES;
export const CROX_FARMHOUSE_UNIFI_CAMERAS = DEFAULT_UNIFI_PROTECT_CAMERAS;
export const CROX_FARMHOUSE_UNIFI_ACCESS_POINTS = DEFAULT_UNIFI_ACCESS_POINTS;

export const CROX_FARMHOUSE_LOD_REGISTRATIONS: readonly RoomZoneLodRegistration[] =
  Object.values(ROOM_ZONES)
    .filter((z): z is RoomZoneDefinition => z !== undefined)
    .map((z) => ({
      zoneId: z.id,
      shortName: z.shortName,
      floorId: z.floorId,
      bounds: z.bounds,
    }));
