import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  createButcherBlockTexture,
  createPiwisMonitorScreenTexture,
  buildGarageStainlessWorkbench,
} from './garage-stainless-workbench';
import {
  createDeWaltLogoTexture,
  createDeWaltBatteryDecalTexture,
  buildGarageTallStorageCupboard,
  buildGarageDeWaltPowerTools,
} from './garage-dewalt-tools-and-cupboard';

export {
  createButcherBlockTexture,
  createPiwisMonitorScreenTexture,
  buildGarageStainlessWorkbench,
  createDeWaltLogoTexture,
  createDeWaltBatteryDecalTexture,
  buildGarageTallStorageCupboard,
  buildGarageDeWaltPowerTools,
};

/**
 * Builds the 5-Bay Heavy-Duty Commercial Stainless-Steel & Laminated Butcher-Block Workshop Tool Bench
 * (`outbuildings.garage.toolBench`), Full-Height Utility Storage Cupboard, South-Wing PIWIS IV Workstation,
 * and DeWALT 18V XR / 54V FLEXVOLT power tool suite.
 */
export function buildGarageToolBench(
  groundGroup: THREE.Group,
  garageFloorTopY: number,
  ctx?: SceneBuilderContext
): void {
  const { benchGroup, southWingGroup } = buildGarageStainlessWorkbench(
    groundGroup,
    garageFloorTopY
  );
  buildGarageTallStorageCupboard(benchGroup, ctx);
  buildGarageDeWaltPowerTools(benchGroup, southWingGroup);
}

export const buildGarageWorkshopToolBench = buildGarageToolBench;
