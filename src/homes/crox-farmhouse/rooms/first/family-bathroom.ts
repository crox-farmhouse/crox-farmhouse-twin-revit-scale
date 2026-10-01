import * as THREE from 'three';
import { addCasedArchitravePortal } from '../../../../engine/geometry/index.ts';
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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addShakerWardrobeDoor,
    addUpperBrickWallAlongXWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
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
  // Bathroom tiled floor (Z = -2.50m..+0.98m) & Upper South Passage carpeted floor (Z = +0.98m..+2.40m)
  addFirstFloorSlab(-12.81, -9.8, -2.5, 0.98, bathroomTileMat);
  addFirstFloorSlab(-12.81, -9.8, 0.98, 2.4, oakFloorMat);

  // North Exterior Brick Wall of Family Bathroom (Z = -2.78m..-2.50m, X = -12.81m..-9.56m)
  // Skirting clamped to [-12.81, -9.80] so it butts cleanly against the Cross-Wall West face (Issues #2 & #7)
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
    2,
    { skirtingMin: -12.81, skirtingMax: -9.8 }
  );

  // South Courtyard Exterior Brick Wall of Upper Passage (Z = +2.40m..+2.68m, X = -12.81m..-9.56m)
  // Skirting clamped to [-12.81, -9.80] so it never pokes through the Main Bedroom cross-wall corner (Issue #2!)
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
    1,
    { skirtingMin: -12.81, skirtingMax: -9.8 }
  );

  const collarCeilingY = 4.52;

  // =========================================================================
  // RECESSED SOUTH-EAST PASSAGE CUPBOARD (`X = -10.68m..-9.80m, Z = +0.05m..+0.98m`)
  // Matching `ff_rotated_3d_axes.png`: boxed into the SE corner of the bathroom
  // footprint, with a Shaker cupboard door opening South (`+Z`) into the Upper Passage
  // right next to the `UP` doorway into the Main Bedroom!
  // =========================================================================
  // North & West enclosing walls of the Recessed Passage Cupboard (reaching collarCeilingY = 4.52m, skirting only on Bathroom side)
  addUpperInteriorWall(-10.24, floorTopY, collarCeilingY, 0.05, 0.88, 0.12, warmRoomPlasterMat, {
    skirtingSides: [-1],
    skirtingMin: -10.62,
    skirtingMax: -9.8,
  });
  addUpperInteriorWall(-10.68, floorTopY, collarCeilingY, 0.515, 0.12, 0.93, warmRoomPlasterMat, {
    skirtingSides: [-1],
    skirtingMin: 0.01,
    skirtingMax: 0.9,
  });

  {
    const passageCupGroup = new THREE.Group();
    passageCupGroup.name = 'familyBathroom.passageCupboard';
    const cupW = 0.82;
    const cupH = upperWallTopY - floorTopY;
    const cupD = 0.82;
    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(cupW, cupH, cupD),
      wardrobeMat
    );
    carcass.position.set(-10.24, floorTopY + cupH / 2, 0.51);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    passageCupGroup.add(carcass);

    // Shaker cupboard door with vertical brass handle on the South Passage face (`Z = +1.055m`)
    addShakerWardrobeDoor(passageCupGroup, {
      x: -10.24,
      y: floorTopY + 0.14 + (doorH - 0.18) / 2,
      z: 1.055,
      width: 0.68,
      height: doorH - 0.18,
      alongZ: false,
      normalSign: 1,
      handleSide: 'left',
      namePrefix: 'familyBathroom.passageCupboard.door',
    });

    scene.add(passageCupGroup);
  }

  // Partition wall between Family Bathroom and Upper South Passage (0.15m thick, Z = +0.90m..+1.05m, X = -9.80m..-12.81m)
  // With bathroom entrance doorway at X = -11.18m (`width = 0.82m`, immediately West of the Recessed Passage Cupboard)
  addUpperInteriorWall(-10.285, floorTopY, collarCeilingY, 0.975, 0.97, 0.15, warmRoomPlasterMat, {
    skirtingSides: [1],
    skirtingMin: -10.688,
    skirtingMax: -9.8,
  });
  addUpperInteriorWall(-12.2, floorTopY, collarCeilingY, 0.975, 1.22, 0.15, warmRoomPlasterMat, {
    skirtingSides: [1],
    skirtingMin: -12.81,
    skirtingMax: -11.672,
  });
  addUpperInteriorWall(-11.18, floorTopY + doorH, collarCeilingY, 0.975, 0.82, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperInteractiveDoor('x', 0.975, 0.15, -11.18, 0.82, -Math.PI * 0.48);

  // =========================================================================
  // PRINCIPAL FAMILY BATHROOM SANITARYWARE (matching `ff_rotated_3d_axes.png`)
  // 1. Walk-In Glass Shower Enclosure in SW corner (`X = -12.81m..-11.65m, Z = +0.05m..+0.90m`)
  // 2. Freestanding Sculpted Oval Bathtub in NW quadrant (`X = -11.75m, Z = -1.35m`, oriented East-West)
  // 3. Bathroom WC in NE corner (`X = -10.22m, Z = -2.18m`, facing South `+Z`)
  // 4. Wash Basin & Vanity Unit on East wall (`X = -10.06m, Z = -0.78m`, facing West `-X`)
  // =========================================================================
  // 1. Walk-in Glass Shower Enclosure in SW corner of Bathroom (West of bathroom door)
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.045, 0.84),
    ceramicWhiteMat
  );
  showerTray.name = 'familyBathroom.showerTray';
  showerTray.position.set(-12.23, floorTopY + 0.022, 0.475);
  showerTray.receiveShadow = true;
  scene.add(showerTray);

  const showerGlassScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 1.88, 0.018),
    windowGlassMat
  );
  showerGlassScreen.name = 'familyBathroom.showerGlass';
  showerGlassScreen.position.set(-12.39, floorTopY + 0.94, 0.06);
  scene.add(showerGlassScreen);

  const showerRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.08, 10),
    brassMat
  );
  showerRiser.position.set(-12.74, floorTopY + 1.38, 0.475);
  scene.add(showerRiser);

  // 2. Freestanding Sculpted Oval Feature Bathtub at X = -11.75m, Z = -1.35m (oriented East-West)
  const bathGroup = new THREE.Group();
  bathGroup.name = 'familyBathroom.bathtub';
  bathGroup.position.set(-11.75, floorTopY, -1.35);
  const bathOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.38, 0.58, 24),
    ceramicWhiteMat
  );
  bathOuter.scale.set(1.85, 1.0, 1.0);
  bathOuter.position.set(0, 0.29, 0);
  bathOuter.castShadow = true;
  bathOuter.receiveShadow = true;
  bathGroup.add(bathOuter);

  const bathFillerStandpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.76, 10),
    brassMat
  );
  bathFillerStandpipe.position.set(-0.82, 0.38, 0);
  bathGroup.add(bathFillerStandpipe);
  scene.add(bathGroup);

  // 3. Bathroom WC in NE corner on North Wall (X = -10.22m, Z = -2.18m, facing South `+Z`)
  const bathWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.44, 0.18),
    ceramicWhiteMat
  );
  bathWcCistern.position.set(-10.22, floorTopY + 0.68, -2.38);
  scene.add(bathWcCistern);

  const bathWcPan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.15, 0.42, 16),
    ceramicWhiteMat
  );
  bathWcPan.position.set(-10.22, floorTopY + 0.21, -2.08);
  scene.add(bathWcPan);

  // 4. Vanity Basin on East Wall between WC and Recessed Passage Cupboard (X = -10.06m, Z = -0.78m, facing West `-X`)
  const bathVanityUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.82, 0.88),
    wardrobeMat
  );
  bathVanityUnit.position.set(-10.06, floorTopY + 0.41, -0.78);
  bathVanityUnit.castShadow = true;
  scene.add(bathVanityUnit);

  const bathVanityTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.9),
    ceramicWhiteMat
  );
  bathVanityTop.position.set(-10.06, floorTopY + 0.85, -0.78);
  scene.add(bathVanityTop);

  // West Load-Bearing Cross-Wall between Family Bathroom/Passage and Main Staircase Landing (0.24m thick, X = -12.81m..-13.05m)
  // Open passage/doorway at Z = +1.55m with cased antique oak architrave portal matching downstairs
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  // Clean skirting segments on the X = -12.93m Cross-Wall North pier (stopping at East Chimney Breast on West side and Shower on East side)
  for (const [sideSign, z0, z1] of [
    [-1, -2.5, -1.34],
    [-1, 0.46, 1.018],
    [1, -2.5, 0.05],
  ] as const) {
    const sD = z1 - z0;
    const sCz = (z0 + z1) / 2;
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.122, sD),
      antiqueOakSkirtingMat
    );
    skirt.position.set(-12.93 + sideSign * (0.12 + 0.009), floorTopY + 0.061, sCz);
    skirt.receiveShadow = true;
    scene.add(skirt);
    const skirtCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.024, sD),
      antiqueOakSkirtingMat
    );
    skirtCap.position.set(-12.93 + sideSign * (0.12 + 0.006), floorTopY + 0.134, sCz);
    skirtCap.receiveShadow = true;
    scene.add(skirtCap);
  }
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, 2.2, 0.24, 0.4, warmRoomPlasterMat, {
    skirtingMin: 2.082,
    skirtingMax: 2.4,
  });
  addUpperInteriorWall(-12.93, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addCasedArchitravePortal(scene, {
    axis: 'z',
    wallCoord: -12.93,
    wallThickness: 0.24,
    openingCenter: 1.55,
    openingWidth: 0.9,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    headY: floorTopY + doorH,
    material: antiqueOakSkirtingMat,
    namePrefix: 'upperLanding.eastPassagePortal',
  });

  // Issue #5: Trapezoidal Upper Gable Extension on the X = -12.93m Cross-Wall (Y = 4.16m..4.52m)
  {
    const crossGableShape = new THREE.Shape();
    crossGableShape.moveTo(-1.9, upperWallTopY);
    crossGableShape.lineTo(1.8, upperWallTopY);
    crossGableShape.lineTo(1.05, collarCeilingY);
    crossGableShape.lineTo(-1.15, collarCeilingY);
    crossGableShape.closePath();
    const crossGableGeo = new THREE.ExtrudeGeometry(crossGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    crossGableGeo.rotateY(Math.PI / 2);
    crossGableGeo.translate(-12.93 - 0.12, 0, 0);
    const crossGableMesh = new THREE.Mesh(crossGableGeo, warmRoomPlasterMat);
    crossGableMesh.name = 'familyBathroom.westWallUpperGable';
    crossGableMesh.castShadow = true;
    crossGableMesh.receiveShadow = true;
    scene.add(crossGableMesh);
  }
}
