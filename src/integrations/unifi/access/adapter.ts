import type {
  AccessCredentialMethod,
  AccessPointEntityState,
  SmartHomeBusEvent,
} from '../../../core/entities.ts';

export type UniFiAccessListener = (
  accessPoints: readonly AccessPointEntityState[],
  busEvent?: SmartHomeBusEvent,
  unlockedEntry?: AccessPointEntityState
) => void;

/**
 * Initial Crox Farmhouse UniFi Access Gate & Door Reader Topology.
 */
export const DEFAULT_UNIFI_ACCESS_POINTS: readonly AccessPointEntityState[] = [
  {
    entityId: 'access.front_split_gate_intercom',
    name: 'Front Split Gate Intercom & Reader Pro',
    shortName: 'Gate Reader Pro',
    protocol: 'unifi-access',
    buildingId: 'courtyardGrounds',
    floorId: 'exterior',
    zoneId: 'courtyard',
    hardwareAddress: 'UA-G2-Pro · 192.168.10.31',
    kind: 'accessPoint',
    model: 'UA-G2-Pro',
    targetEntry: 'carGates',
    isLocked: true,
    doorPosition: 'closed',
    lastCredentialMethod: 'License Plate (LPR)',
    lastEventTimestamp: 'Ready',
    position3D: [-17.15, 1.38, 11.78],
  },
  {
    entityId: 'access.front_entrance_porch',
    name: 'Main House Front Porch Reader',
    shortName: 'Front Door Hub',
    protocol: 'unifi-access',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'entranceHall',
    hardwareAddress: 'UA-Hub-Door-Mini · 192.168.10.32',
    kind: 'accessPoint',
    model: 'UA-Hub-Door-Mini',
    targetEntry: 'frontDoor',
    isLocked: true,
    doorPosition: 'closed',
    lastCredentialMethod: 'NFC Card',
    lastEventTimestamp: 'Ready',
    position3D: [-22.24, 1.32, 2.45],
  },
];

/**
 * UniFi Access Protocol Adapter.
 *
 * Models UniFi Access Gate Hub / G2 Reader Pro & Door Hub state and credential events,
 * bridging with the KNX TP1 bus (`GA 1/5/1`) via `SmartHomeHub`.
 */
export class UniFiAccessController {
  private readonly accessPoints: AccessPointEntityState[];
  private readonly listeners = new Set<UniFiAccessListener>();
  private nextEventId = 7000;

  public constructor(
    initialPoints: readonly AccessPointEntityState[] = DEFAULT_UNIFI_ACCESS_POINTS
  ) {
    this.accessPoints = initialPoints.map((p) => ({ ...p }));
  }

  public subscribe(fn: UniFiAccessListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(
    busEvent?: SmartHomeBusEvent,
    unlockedEntry?: AccessPointEntityState
  ): void {
    for (const fn of this.listeners) {
      fn(this.accessPoints, busEvent, unlockedEntry);
    }
  }

  public getAccessPoints(): readonly AccessPointEntityState[] {
    return this.accessPoints;
  }

  public syncGateStateFromKnx(isOpen: boolean, isMoving: boolean): void {
    const idx = this.accessPoints.findIndex((p) => p.targetEntry === 'carGates');
    if (idx < 0) return;
    const current = this.accessPoints[idx];
    if (!current) return;

    const doorPosition: AccessPointEntityState['doorPosition'] = isMoving
      ? 'moving'
      : isOpen
        ? 'open'
        : 'closed';
    const isLocked = !isOpen && !isMoving;

    if (current.doorPosition !== doorPosition || current.isLocked !== isLocked) {
      this.accessPoints[idx] = {
        ...current,
        isLocked,
        doorPosition,
      };
      this.notify();
    }
  }

  public triggerUnlockEvent(
    entityId: string,
    credentialMethod: AccessCredentialMethod = 'NFC Card'
  ): AccessPointEntityState | undefined {
    const idx = this.accessPoints.findIndex((p) => p.entityId === entityId);
    if (idx < 0) return undefined;
    const point = this.accessPoints[idx];
    if (!point) return undefined;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] ?? '00:00:00';
    const nextLocked = !point.isLocked;
    const updated: AccessPointEntityState = {
      ...point,
      isLocked: nextLocked,
      doorPosition: nextLocked ? 'closed' : 'open',
      lastCredentialMethod: credentialMethod,
      lastEventTimestamp: timeStr,
    };
    this.accessPoints[idx] = updated;

    const busEvent: SmartHomeBusEvent = {
      id: this.nextEventId++,
      timestamp: timeStr,
      protocol: 'unifi-access',
      sourceAddress: point.hardwareAddress,
      targetAddress: point.entityId,
      eventType: nextLocked ? 'Access.Lock' : 'Access.Grant',
      summary: nextLocked
        ? `${point.shortName} → Locked (${credentialMethod})`
        : `${point.shortName} → Access Granted via ${credentialMethod}`,
    };

    this.notify(busEvent, updated);
    return updated;
  }
}
