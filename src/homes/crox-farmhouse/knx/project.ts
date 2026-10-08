import type { CircuitConfig } from '../../../core/types/knx.ts';
import type {
  KNXPhysicalDeviceDefinition,
  RoomZoneDefinition,
  RoomZoneId,
} from '../../../core/types/topology.ts';
import type {
  KnxCentralDeviceAddresses,
  KnxCentralGroupAddresses,
  KnxGroupAddressEntry,
  KnxProject,
} from '../../../integrations/knx/project.ts';
import type { RoomAutomationConfig } from '../../../integrations/knx/room-automation.ts';
import { CROX_CENTRAL_SCENES } from './central-scenes.ts';
import { CROX_CIRCUITS } from './circuits.ts';
import { CROX_PRESENCE_DETECTORS, CROX_PRESENCE_HOLD_TIME_SEC, CROX_PUSH_BUTTONS } from './devices.ts';
import { GA_MAIN_NAMES, GA_MIDDLE_NAMES } from './ga-plan.ts';
import { CROX_INFRASTRUCTURE_DEVICES } from './physical-devices.ts';
import { BUILDINGS, FLOORS, ROOM_ZONES } from './rooms.ts';
import { CROX_LIGHTING_ZONES } from './zones.ts';

/** Central / non-lighting group addresses (kept from the original installation). */
export const CROX_CENTRAL_GA: KnxCentralGroupAddresses = {
  masterOff: '1/0/0',
  centralScene: '1/0/1',
  masterFull: '1/0/2',
  kitchenPresence: '1/4/1',
  ambientLux: '1/4/2',
  utilityPresence: '1/4/3',
  tvArt: '1/4/4',
  carGatesCommand: '1/5/1',
  carGatesPosition: '1/5/2',
};

export const CROX_CENTRAL_PA: KnxCentralDeviceAddresses = {
  ipInterface: '1.1.1',
  aiBridge: '1.1.2',
  kitchenSwitchGroup: '1.1.10',
  kitchenPresence: '1.1.12',
  utilityPresence: '1.1.13',
  utilitySwitch: '1.1.11',
  courtyardSwitch: '1.1.14',
  kitchenActuator: '1.1.20',
  carGates: '1.1.22',
};

/** PIR-driven circuits (wine cellar / cloakroom WC); everything else follows the zone model. */
export const CROX_ROOM_AUTOMATION: RoomAutomationConfig = {
  nightWalkRules: [],
  motionCircuitRules: [
    { circuitId: 'wineCellarLeds', sensorId: 'wineCellar', onLevel: 70 },
    { circuitId: 'cloakroomWcLights', sensorId: 'cloakroomWc', onLevel: 90 },
  ],
  motionSensors: [
    { id: 'wineCellar', pa: '1.1.25', ga: '1/4/5', name: 'Wine Cellar PIR', zoneId: 'bootLobby' },
    { id: 'cloakroomWc', pa: '1.1.26', ga: '1/4/6', name: 'Cloakroom WC PIR', zoneId: 'bootLobby' },
  ],
};

const ROOM_LIST: readonly RoomZoneDefinition[] = Object.values(ROOM_ZONES).filter(
  (z): z is RoomZoneDefinition => z !== undefined
);

function roomOf(zoneId: RoomZoneId): RoomZoneDefinition | undefined {
  return ROOM_ZONES[zoneId];
}

function generatedDevices(): KNXPhysicalDeviceDefinition[] {
  const out: KNXPhysicalDeviceDefinition[] = [];
  for (const b of CROX_PUSH_BUTTONS) {
    const room = roomOf(b.mountedInZoneId);
    out.push({
      pa: b.pa,
      name: `Corston ${b.gangs.length}-gang toggle — ${b.name}`,
      buildingId: room?.buildingId ?? 'mainHouse',
      floorId: room?.floorId ?? 'ground',
      zoneId: b.mountedInZoneId,
      role: 'wallSwitch',
      maskVersion: '0x07B0',
      description: `${b.location}; gangs: ${b.gangs.map((g) => `${g.gang}=${g.label}`).join(', ')}`,
    });
  }
  for (const d of CROX_PRESENCE_DETECTORS) {
    const room = roomOf(d.zoneId);
    out.push({
      pa: d.pa,
      name: d.name,
      buildingId: room?.buildingId ?? 'mainHouse',
      floorId: room?.floorId ?? 'ground',
      zoneId: d.zoneId,
      role: 'pirLuxSensor',
      maskVersion: '0x07B0',
      description: `Ceiling presence detector, presence GA ${d.gaPresence}, hold ${d.params.holdTimeSec}s`,
    });
  }
  return out;
}

function gaEntry(address: string, name: string, dpt: string, description: string): KnxGroupAddressEntry {
  const [main = '0', middle = '0'] = address.split('/');
  return {
    address,
    name,
    dpt,
    main: GA_MAIN_NAMES[Number(main)] ?? main,
    middle: GA_MIDDLE_NAMES[Number(middle)] ?? middle,
    description,
  };
}

function channelEntries(c: CircuitConfig): KnxGroupAddressEntry[] {
  const where = `${c.actuatorPa} ch${c.channel}`;
  return [
    gaEntry(c.gaSwitch, `${c.shortName} switch`, '1.001', `${c.name} (${where})`),
    gaEntry(c.gaValue, `${c.shortName} brightness`, '5.001', `${c.name} (${where})`),
    gaEntry(c.gaStatus, `${c.shortName} status`, '5.001', `${c.name} feedback (${where})`),
  ];
}

function buildGroupAddresses(): KnxGroupAddressEntry[] {
  const out: KnxGroupAddressEntry[] = [
    gaEntry(CROX_CENTRAL_GA.masterOff, 'Master off (night mode)', '1.001', 'Open-plan + utility + dining + courtyard night mode'),
    gaEntry(CROX_CENTRAL_GA.centralScene, 'Central scene', '18.001', 'Legacy 8-slot open-plan scene table (actuator 1.1.20)'),
    gaEntry(CROX_CENTRAL_GA.masterFull, 'Master full', '5.001', 'Open-plan kitchen full brightness'),
    gaEntry(CROX_CENTRAL_GA.ambientLux, 'Ambient lux', '9.004', 'Kitchen PIR lux sensor (night-mode threshold)'),
    gaEntry(CROX_CENTRAL_GA.tvArt, 'Frame TV art index', '17.001', 'Kitchen Frame TV art mode'),
    gaEntry(CROX_CENTRAL_GA.carGatesCommand, 'Car gates open/close', '1.001', 'Front car gates (1.1.22)'),
    gaEntry(CROX_CENTRAL_GA.carGatesPosition, 'Car gates position', '5.001', 'Front car gates status'),
  ];
  for (const c of CROX_CIRCUITS) out.push(...channelEntries(c));
  for (const z of CROX_LIGHTING_ZONES) {
    out.push(
      gaEntry(z.ga.scene, `${z.name} scene`, '17.001', `Zone scenes: ${z.scenes.map((s, i) => `${i + 1}=${s.label}`).join(', ')}`),
      gaEntry(z.ga.night, `${z.name} night mode`, '1.001', 'Hold ▼ — night levels 3–5 % when dark, off on vacancy'),
      gaEntry(z.ga.full, `${z.name} full / off`, '1.001', 'Hold ▲ — all zone channels 100 % (0 = zone off)'),
      gaEntry(z.ga.dim, `${z.name} relative dim`, '3.007', 'Zone relative dimming'),
      gaEntry(z.ga.sceneStatus, `${z.name} scene status`, '17.001', 'Active zone scene feedback'),
      gaEntry(z.ga.status, `${z.name} on/off status`, '1.001', 'Any zone channel on'),
    );
  }
  for (const d of CROX_PRESENCE_DETECTORS) {
    out.push(gaEntry(d.gaPresence, `${d.name} presence`, '1.018', `${d.pa}, zone ${d.zoneId}`));
  }
  const seen = new Set<string>();
  return out
    .filter((e) => (seen.has(e.address) ? false : (seen.add(e.address), true)))
    .sort((a, b) => compareGa(a.address, b.address));
}

function compareGa(a: string, b: string): number {
  const pa = a.split('/').map(Number);
  const pb = b.split('/').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** The complete Crox Farmhouse KNX project (ETS-style) run by `KNXPropertyBusController`. */
export const CROX_KNX_PROJECT: KnxProject = {
  name: 'Crox Farmhouse',
  buildings: BUILDINGS,
  floors: FLOORS,
  rooms: ROOM_LIST,
  circuits: CROX_CIRCUITS,
  centralScenes: CROX_CENTRAL_SCENES,
  zones: CROX_LIGHTING_ZONES,
  pushButtons: CROX_PUSH_BUTTONS,
  presenceDetectors: CROX_PRESENCE_DETECTORS,
  physicalDevices: [...CROX_INFRASTRUCTURE_DEVICES, ...generatedDevices()],
  roomAutomation: CROX_ROOM_AUTOMATION,
  centralGa: CROX_CENTRAL_GA,
  centralPa: CROX_CENTRAL_PA,
  defaultPresenceHoldTimeSec: CROX_PRESENCE_HOLD_TIME_SEC,
  groupAddresses: buildGroupAddresses(),
};
