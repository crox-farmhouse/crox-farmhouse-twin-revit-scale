/**
 * Reusable 3D Asset & Prefab Catalog (`src/catalog/`).
 *
 * Separates parametric 3D device, cabinetry, lighting, and material builders
 * from property-specific room layouts (`src/homes/crox-farmhouse/`).
 */

export {
  createUniFiAccessReader3D,
  createUniFiProtectCamera3D,
  type UniFiAccessVisualHandle,
  type UniFiCameraVisualHandle,
} from './devices/unifi-devices.ts';

export * from '../objects/joinery/cabinet-interior.ts';
export { buildLargeBlueIslandWithLeftSink } from '../homes/crox-farmhouse/rooms/ground/kitchen-island.ts';
export { buildWrapAroundDoveGreyKitchenAGAAndCoffeeCorner } from '../homes/crox-farmhouse/rooms/ground/kitchen-cabinetry.ts';
export {
  buildFiveKNXLightingCircuits,
  buildKitchenAndUtilityMotionSensors,
  buildUtilityKNXSwitch,
  buildWallKNXSwitch,
} from '../homes/crox-farmhouse/rooms/ground/kitchen-knx-lighting.ts';
export * from './materials.ts';
