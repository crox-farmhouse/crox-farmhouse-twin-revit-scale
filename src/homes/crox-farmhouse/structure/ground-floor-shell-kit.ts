import type { SceneBuilderContext } from '../../../types/scene.ts';
import {
  createGroundShellWallsAndFloors,
  type GroundShellKitMaterials,
} from './shell/ground-shell-walls-and-floors.ts';
import { createGroundShellWindowsAndDoors } from './shell/ground-shell-windows-and-doors.ts';

export type { GroundShellKitMaterials };

/**
 * Ground-floor shell kit orchestrator: combines wall/floor/radiator helpers and window/door/bay-window helpers.
 */
export function createGroundFloorShellKit(
  ctx: SceneBuilderContext,
  kit: GroundShellKitMaterials,
  options?: { readonly courtyardZShift?: number; readonly courtyardFollowsEastWing?: boolean }
) {
  const wallsAndFloors = createGroundShellWallsAndFloors(ctx, kit, options);
  const windowsAndDoors = createGroundShellWindowsAndDoors(ctx, kit, wallsAndFloors);

  return {
    addBrickWallAlongXWithCourtyardDoor: windowsAndDoors.addBrickWallAlongXWithCourtyardDoor,
    addBrickWallAlongXWithWindow: windowsAndDoors.addBrickWallAlongXWithWindow,
    addBrickWallAlongZWithCourtyardDoor: windowsAndDoors.addBrickWallAlongZWithCourtyardDoor,
    addBrickWallAlongZWithWindow: windowsAndDoors.addBrickWallAlongZWithWindow,
    addExteriorBrickWall: wallsAndFloors.addExteriorBrickWall,
    addInteractiveInteriorDoor: windowsAndDoors.addInteractiveInteriorDoor,
    addInteriorWall: wallsAndFloors.addInteriorWall,
    addSlattedRadiatorCover: wallsAndFloors.addSlattedRadiatorCover,
    addWestCantedBayWindow: windowsAndDoors.addWestCantedBayWindow,
    applyWorldSpaceBrickUVs: wallsAndFloors.applyWorldSpaceBrickUVs,
    eastCourtyardWallAngleY: wallsAndFloors.eastCourtyardWallAngleY,
    getCourtyardGroundY: wallsAndFloors.getCourtyardGroundY,
    getEastCourtyardWallCenterX: wallsAndFloors.getEastCourtyardWallCenterX,
    greyRoomCarpetMat: wallsAndFloors.greyRoomCarpetMat,
  };
}
