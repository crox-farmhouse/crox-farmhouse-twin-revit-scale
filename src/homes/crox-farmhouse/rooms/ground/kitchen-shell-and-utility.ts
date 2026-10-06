import type * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  buildFullHeightEastWindow,
  buildKitchenShellAndBeams,
  buildOakDoor,
  buildSplitStableDoor,
} from './kitchen-utility/kitchen-shell-and-beams.ts';
import { buildUtilityRoomJoineryAndAppliances } from './kitchen-utility/utility-room-joinery-and-appliances.ts';

export {
  buildFullHeightEastWindow,
  buildKitchenShellAndBeams,
  buildOakDoor,
  buildSplitStableDoor,
  buildUtilityRoomJoineryAndAppliances,
};

export function buildArchitecturalShellAndUtilityRoom(
  ctx: SceneBuilderContext
): THREE.MeshStandardMaterial {
  buildKitchenShellAndBeams(ctx);
  return buildUtilityRoomJoineryAndAppliances(ctx);
}
