import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../core/types/scene.ts';
import {
  buildBarnGolfSimulatorEnclosure,
  createFoldingMatOakFloorTextures,
  createGolfAstroturfTextures,
  createGolfSimArtworkTexture,
  createGolfStatusSignTexture,
  createTrackManWidescreenTexture,
  GOLF_SIM_SHOT_PROFILES,
  renderTrackManWidescreenShotState,
  type GolfSimShotProfile,
} from './barn-golf-simulator-enclosure.ts';
import {
  buildBarnGolfSimulatorPropsAndLoft,
  renderTrackManControlScreenShotState,
} from './barn-golf-simulator-props-and-loft.ts';

export {
  buildBarnGolfSimulatorEnclosure,
  buildBarnGolfSimulatorPropsAndLoft,
  createFoldingMatOakFloorTextures,
  createGolfAstroturfTextures,
  createGolfSimArtworkTexture,
  createGolfStatusSignTexture,
  createTrackManWidescreenTexture,
  GOLF_SIM_SHOT_PROFILES,
  renderTrackManWidescreenShotState,
  renderTrackManControlScreenShotState,
  type GolfSimShotProfile,
};

export function buildBarnGolfSimulator(
  groundGroup: THREE.Group,
  arg2: number,
  arg3: number,
  arg4?: number | THREE.Group,
  arg5?: THREE.Material | THREE.Group | SceneBuilderContext['interactions'],
  arg6?: THREE.Group
): void {
  const isFiveArgCall = typeof arg4 === 'number';
  const uWallMin = isFiveArgCall ? arg2 : 14.96;
  const uWallMax = isFiveArgCall ? arg3 : 15.2;
  const barnWestFloorY = isFiveArgCall ? arg4 : -0.34;
  const plasterMat: THREE.Material =
    isFiveArgCall && arg5 instanceof THREE.Material
      ? arg5
      : new THREE.MeshStandardMaterial({
          color: 0xf2ede2,
          roughness: 0.86,
          metalness: 0.02,
        });
  const groundCeilingGroup: THREE.Group | undefined =
    arg6 ??
    (arg4 instanceof THREE.Group ? arg4 : undefined) ??
    (arg5 instanceof THREE.Group ? arg5 : undefined);
  const interactions: SceneBuilderContext['interactions'] | undefined =
    arg5 && !(arg5 instanceof THREE.Material) && !(arg5 instanceof THREE.Group)
      ? arg5
      : undefined;

  const enclosure = buildBarnGolfSimulatorEnclosure(
    groundGroup,
    uWallMin,
    uWallMax,
    barnWestFloorY,
    plasterMat,
    groundCeilingGroup
  );

  const { ladderGroup, controlGroup } = buildBarnGolfSimulatorPropsAndLoft(
    groundGroup,
    uWallMax,
    barnWestFloorY,
    plasterMat,
    enclosure,
    interactions
  );

  for (const grp of [
    enclosure.simGroup,
    enclosure.simCeilingGroup,
    ladderGroup,
    controlGroup,
  ]) {
    grp.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingSphere();
      }
    });
  }
}
