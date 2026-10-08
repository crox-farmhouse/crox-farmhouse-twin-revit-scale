import type { RoomZoneLodRegistration } from '../../core/entities.ts';
import { CROX_KNX_PROJECT } from './knx/project.ts';
import { BUILDINGS, FLOORS, ROOM_ZONES } from './knx/rooms.ts';
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
export const CROX_FARMHOUSE_KNX_PROJECT = CROX_KNX_PROJECT;
export const CROX_FARMHOUSE_KNX_DEVICES = CROX_KNX_PROJECT.physicalDevices;
export const CROX_FARMHOUSE_KNX_CIRCUITS = CROX_KNX_PROJECT.circuits;
export const CROX_FARMHOUSE_KNX_SCENES = CROX_KNX_PROJECT.centralScenes;
export const CROX_FARMHOUSE_KNX_ZONES = CROX_KNX_PROJECT.zones;
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
