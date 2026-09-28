import { buildRoomCeilingPendant, buildRoomCorstonToggleSwitch } from '../ground/kitchen-knx-lighting.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';

/**
 * KNX ceiling pendants and Corston toggle switches for every first-floor room.
 */
export function buildFirstFloorPendantsAndSwitches(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'floorTopY' | 'upperWallTopY'>,
  eastWingCtx: SceneBuilderContext = ctx
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const { firstFloorMeshGroup: ewScene } = eastWingCtx;
  const {
    floorTopY,
    upperWallTopY,
  } = kit;
  // =========================================================================
  // 9. KNX CEILING PENDANTS & CORSTON TOGGLE SWITCHES FOR ALL FIRST FLOOR ROOMS
  //    (Mounted to `scene` = `firstFloorMeshGroup` so they hide cleanly when
  //    First Floor visibility is toggled off)
  // =========================================================================
  // 1. Main Bedroom (Circuit: mainBedroomPendant, Switch PA: 1.2.10)
  buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'mainBedroomPendant',
    x: -7.1,
    z: 0.15,
    ceilingY: upperWallTopY,
    dropLength: 0.36,
    floorY: floorTopY,
    pointLightIntensity: 13.5,
    pointLightDistance: 7.4,
    addPointLight: false,
    parentGroup: ewScene,
  });
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'mainBedroomPendant',
    switchPa: '1.2.10',
    location: 'Main Bedroom — West Wall (by Door)',
    x: -9.56,
    y: floorTopY + 1.15,
    z: 0.92,
    facing: 'east',
    parentGroup: ewScene,
  });

  // 2. Principal Family Bathroom (Circuit: familyBathroomPendant, Switch PA: 1.2.11)
  buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'familyBathroomPendant',
    x: -11.3,
    z: -0.75,
    ceilingY: upperWallTopY,
    dropLength: 0.32,
    floorY: floorTopY,
    pointLightIntensity: 12.5,
    pointLightDistance: 6.5,
    addPointLight: false,
    parentGroup: ewScene,
  });
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'familyBathroomPendant',
    switchPa: '1.2.11',
    location: 'Principal Bathroom — South Wall (by Door)',
    x: -11.05,
    y: floorTopY + 1.15,
    z: 0.9,
    facing: 'north',
    parentGroup: ewScene,
  });

  // 3. Main Staircase Landing (Circuit: upperLandingPendant, Switch PA: 1.2.12)
  buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'upperLandingPendant',
    x: -14.85,
    z: 0.65,
    ceilingY: upperWallTopY,
    dropLength: 0.36,
    floorY: floorTopY,
    pointLightIntensity: 13.0,
    pointLightDistance: 7.2,
    addPointLight: false,
    parentGroup: ewScene,
  });
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'upperLandingPendant',
    switchPa: '1.2.12',
    location: 'First Floor Landing — East Wall (by Passage)',
    x: -13.05,
    y: floorTopY + 1.15,
    z: 0.92,
    facing: 'west',
    parentGroup: ewScene,
  });

  // 4. Bedroom 2 (Circuit: bedroom2Pendant, Switch PA: 1.2.13)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'bedroom2Pendant',
    x: -19.85,
    z: 0.05,
    ceilingY: upperWallTopY,
    dropLength: 0.36,
    floorY: floorTopY,
    pointLightIntensity: 13.5,
    pointLightDistance: 7.2,
    addPointLight: false,
    parentGroup: scene,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'bedroom2Pendant',
    switchPa: '1.2.13',
    location: 'Bedroom 2 — South Wall (by Door)',
    x: -19.06,
    y: floorTopY + 1.15,
    z: 2.44,
    facing: 'north',
    parentGroup: scene,
  });

  // 5. Bedroom 3 (Circuit: bedroom3Pendant, Switch PA: 1.2.14)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'bedroom3Pendant',
    x: -20.52,
    z: 6.15,
    ceilingY: upperWallTopY,
    dropLength: 0.36,
    floorY: floorTopY,
    pointLightIntensity: 13.0,
    pointLightDistance: 7.0,
    addPointLight: false,
    parentGroup: scene,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'bedroom3Pendant',
    switchPa: '1.2.14',
    location: 'Bedroom 3 — East Wall (by Door)',
    x: -18.99,
    y: floorTopY + 1.15,
    z: 5.8,
    facing: 'west',
    parentGroup: scene,
  });

  // 6. Bedroom 4 (Circuit: bedroom4Pendant, Switch PA: 1.2.15)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'bedroom4Pendant',
    x: -19.85,
    z: 9.94,
    ceilingY: upperWallTopY,
    dropLength: 0.36,
    floorY: floorTopY,
    pointLightIntensity: 13.0,
    pointLightDistance: 7.0,
    addPointLight: false,
    parentGroup: scene,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'bedroom4Pendant',
    switchPa: '1.2.15',
    location: 'Bedroom 4 — North Wall (by Door)',
    x: -18.8,
    y: floorTopY + 1.15,
    z: 8.39,
    facing: 'south',
    parentGroup: scene,
  });
}
