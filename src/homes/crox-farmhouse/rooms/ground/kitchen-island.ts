import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../core/types/scene.ts';
import {
  buildIslandCarcassWorktopAndSink,
  buildUnderCounterWineCooler,
} from './kitchen/island-carcass-and-sink.ts';
import { buildIslandFruitBowlAndCounterStools } from './kitchen/island-stools-and-props.ts';

export {
  buildIslandCarcassWorktopAndSink,
  buildIslandFruitBowlAndCounterStools,
  buildUnderCounterWineCooler,
};

export function buildLargeBlueIslandWithLeftSink(ctx: SceneBuilderContext): void {
  const { scene, interactions } = ctx;

  // Blue Island (3.80m worktop width x 1.52m depth — >2 full kitchen cabinets deep, centered at X = -0.92m, Z = +0.14m)
  // - Back (-Z) half houses the full-depth cooking/sink cabinets (z = -0.73m to 0.00m), with the Sink at z = -0.36m
  // - Front (+Z) half houses the Wine Cooler on the left full-depth pier (z = 0.00m to +0.73m, completely clear of the sink!)
  //   and a 390mm breakfast-bar overhang on the right section (z = +0.37m to +0.76m) for the 3 counter stools!
  const islandGroup = new THREE.Group();
  islandGroup.name = 'kitchen.island';
  islandGroup.position.set(-0.92, 0, 0.14);

  buildIslandCarcassWorktopAndSink(islandGroup, interactions);
  buildIslandFruitBowlAndCounterStools(islandGroup);

  scene.add(islandGroup);
}
