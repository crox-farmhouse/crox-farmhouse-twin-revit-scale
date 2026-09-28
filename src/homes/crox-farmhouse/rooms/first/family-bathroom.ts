import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Family Bathroom (`familyBathroom`) and upper south passage.
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildFamilyBathroom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongXWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    bathroomTileMat,
    brassMat,
    ceramicWhiteMat,
    doorH,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wardrobeMat,
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 2. PRINCIPAL FAMILY BATHROOM & UPPER PASSAGE
  //    Directly above Boot Lobby / Store / WC: X = -9.80m..-12.81m, Z = -2.50m..+2.40m
  // =========================================================================
  // Bathroom tiled floor (Z = -2.50m..+0.98m) & Upper South Passage oak floor (Z = +0.98m..+2.40m)
  addFirstFloorSlab(-12.81, -9.8, -2.5, 0.98, bathroomTileMat);
  addFirstFloorSlab(-12.81, -9.8, 0.98, 2.4, oakFloorMat);

  // North Exterior Brick Wall of Family Bathroom (Z = -2.78m..-2.50m, X = -12.81m..-9.56m)
  addUpperBrickWallAlongXWithWindow(
    -12.81,
    -9.56,
    -2.78,
    -2.5,
    -11.35,
    1.05,
    3.02,
    3.94,
    'south',
    2
  );

  // South Courtyard Exterior Brick Wall of Upper Passage (Z = +2.40m..+2.68m, X = -12.81m..-9.56m)
  // With small casement window at X = -12.05m (directly above the Boot Lobby window & garden bench, Photo 1!)
  addUpperBrickWallAlongXWithWindow(
    -12.81,
    -9.56,
    2.4,
    2.68,
    -12.05,
    0.76,
    3.06,
    3.9,
    'north',
    1
  );

  // Partition wall between Family Bathroom and Upper South Passage (0.15m thick, Z = +0.90m..+1.05m, X = -9.80m..-12.81m)
  // With doorway at X = -10.45m
  addUpperInteriorWall(-9.9, floorTopY, upperWallTopY, 0.975, 0.2, 0.15, warmRoomPlasterMat);
  addUpperInteriorWall(-11.83, floorTopY, upperWallTopY, 0.975, 1.96, 0.15, warmRoomPlasterMat);
  addUpperInteriorWall(-10.425, floorTopY + doorH, upperWallTopY, 0.975, 0.85, 0.15, warmRoomPlasterMat);
  addUpperInteractiveDoor('x', 0.975, 0.15, -10.425, 0.85, -Math.PI * 0.48);

  // Principal Family Bathroom Sanitaryware (matching the exact symbols on the First Floor plan):
  // 1. Freestanding Sculpted Oval Feature Bathtub at X = -11.85m, Z = -0.55m
  const bathGroup = new THREE.Group();
  bathGroup.position.set(-11.85, floorTopY, -0.55);
  const bathOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.38, 0.58, 24),
    ceramicWhiteMat
  );
  bathOuter.scale.set(1.0, 1.0, 1.85);
  bathOuter.position.set(0, 0.29, 0);
  bathOuter.castShadow = true;
  bathOuter.receiveShadow = true;
  bathGroup.add(bathOuter);

  const bathFillerStandpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.76, 10),
    brassMat
  );
  bathFillerStandpipe.position.set(-0.48, 0.38, 0);
  bathGroup.add(bathFillerStandpipe);
  scene.add(bathGroup);

  // 2. Walk-in Glass Shower Enclosure in SE corner of Bathroom (X = -9.80m..-10.95m, Z = -0.05m..+0.90m)
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.045, 0.92),
    ceramicWhiteMat
  );
  showerTray.position.set(-10.38, floorTopY + 0.022, 0.42);
  showerTray.receiveShadow = true;
  scene.add(showerTray);

  const showerGlassScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 1.88, 0.92),
    windowGlassMat
  );
  showerGlassScreen.position.set(-10.94, floorTopY + 0.94, 0.42);
  scene.add(showerGlassScreen);

  // 3. Bathroom WC on North Wall (X = -12.25m, Z = -2.18m) & Vanity Basin on East Wall (X = -10.12m, Z = -1.65m)
  const bathWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.44, 0.18),
    ceramicWhiteMat
  );
  bathWcCistern.position.set(-12.25, floorTopY + 0.68, -2.38);
  scene.add(bathWcCistern);

  const bathWcPan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.15, 0.42, 16),
    ceramicWhiteMat
  );
  bathWcPan.position.set(-12.25, floorTopY + 0.21, -2.08);
  scene.add(bathWcPan);

  const bathVanityUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.82, 0.88),
    wardrobeMat
  );
  bathVanityUnit.position.set(-10.06, floorTopY + 0.41, -1.55);
  bathVanityUnit.castShadow = true;
  scene.add(bathVanityUnit);

  const bathVanityTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.9),
    ceramicWhiteMat
  );
  bathVanityTop.position.set(-10.06, floorTopY + 0.85, -1.55);
  scene.add(bathVanityTop);

  // West Load-Bearing Cross-Wall between Family Bathroom/Passage and Main Staircase Landing (0.24m thick, X = -12.81m..-13.05m)
  // Open passage/doorway at Z = +1.55m
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat);
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, 2.2, 0.24, 0.4, warmRoomPlasterMat);
  addUpperInteriorWall(-12.93, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat);
}
