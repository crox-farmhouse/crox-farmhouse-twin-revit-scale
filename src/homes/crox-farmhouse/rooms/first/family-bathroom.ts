import * as THREE from 'three';
import { addCasedArchitravePortal, buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';
import { buildFamilyBathroomBathAndShower } from './bathroom/bathroom-bath-and-shower.ts';
import {
  buildFamilyBathroomDrinksCabinet,
  buildFamilyBathroomVanityAndToilet,
} from './bathroom/bathroom-vanities-and-joinery.ts';

export { buildFamilyBathroomBathAndShower } from './bathroom/bathroom-bath-and-shower.ts';
export {
  buildFamilyBathroomDrinksCabinet,
  buildFamilyBathroomVanityAndToilet,
} from './bathroom/bathroom-vanities-and-joinery.ts';

function ensureNamedAddedChildren(parent: THREE.Object3D, startIdx: number, prefix: string): void {
  let subIdx = 0;
  for (let i = startIdx; i < parent.children.length; i++) {
    parent.children[i].traverse((obj) => {
      if ((obj instanceof THREE.Mesh || obj instanceof THREE.Group) && !obj.name) {
        subIdx++;
        obj.name = subIdx === 1 ? prefix : `${prefix}.part_${subIdx}`;
      }
      if (obj instanceof THREE.Mesh && obj.geometry && !obj.geometry.boundingSphere) {
        obj.geometry.computeBoundingSphere();
      }
    });
  }
}

/**
 * Family Bathroom (`familyBathroom`) and upper south passage.
 *
 * Orchestrates the Family Bathroom architectural shell, bespoke recessed oak drinks cabinet
 * (`bathroom-vanities-and-joinery.ts`), walk-in shower / copper bateau bath / heated towel rail
 * (`bathroom-bath-and-shower.ts`), and period Shaker vanity unit / Edwardian low-level toilet
 * (`bathroom-vanities-and-joinery.ts`).
 */
export function buildFamilyBathroom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
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
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 2. PRINCIPAL FAMILY BATHROOM & UPPER PASSAGE
  //    Directly above Boot Lobby / Store / WC: X = -9.80m..-12.81m, Z = -2.50m..+2.40m
  // =========================================================================
  // Bathroom tiled floor (L-shaped around the Recessed Drinks Cabinet bulkhead) & Upper South Passage carpet floor:
  // - West Bathroom zone (`X = -12.93m..-10.695m, Z = -2.64m..+0.975m`, terminating at the bathroom door threshold `Z = 0.975m`)
  // - East Bathroom zone (`X = -10.695m..-9.68m, Z = -2.64m..+0.05m`, terminating inside the `Z = -0.01m` vanity/bulkhead wall)
  // - Upper South Passage & Drinks Cabinet recess (`oakFloorMat`, `Z = +0.975m..+2.54m` plus `X = -10.695m..-9.56m, Z = +0.05m..+0.975m`)
  let childIdx = scene.children.length;
  addFirstFloorSlab(-12.93, -10.695, -2.64, 0.975, bathroomTileMat);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-10.695, -9.68, -2.64, 0.05, bathroomTileMat);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.eastFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-10.695, -9.56, 0.05, 0.975, oakFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.drinksRecessFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-13.05, -9.56, 0.975, 2.54, oakFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.floorSlab');

  // Antique oak threshold transition strip beneath the Family Bathroom doorway (`X = -11.59m..-10.77m, Z = 0.975m`)
  {
    const bathThresholdGeo = new THREE.BoxGeometry(0.82, 0.006, 0.032);
    bathThresholdGeo.computeBoundingSphere();
    const bathThresholdStrip = new THREE.Mesh(bathThresholdGeo, antiqueOakSkirtingMat);
    bathThresholdStrip.name = 'familyBathroom.doorThresholdStrip';
    bathThresholdStrip.userData.isArchitecturalShell = true;
    bathThresholdStrip.position.set(-11.18, floorTopY + 0.003, 0.975);
    bathThresholdStrip.receiveShadow = true;
    scene.add(bathThresholdStrip);
  }

  // North Exterior Brick Wall of Family Bathroom (Z = -2.78m..-2.50m, X = -12.81m..-9.56m)
  // Calibrated to Survey2Plan Win 1756577 / 1763678 (1.10m x 0.90m, doubleCasement below 3.86m eaves)
  childIdx = scene.children.length;
  addUpperBrickWallAlongXWithWindow(
    -12.81,
    -9.56,
    -2.78,
    -2.5,
    -11.35,
    1.10,
    2.88,
    3.78,
    'south',
    2,
    { skipSkirting: true, windowFamily: 'doubleCasement' }
  );
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.northExteriorWall');

  // South Courtyard Exterior Brick Wall of Upper Passage (Z = +2.40m..+2.68m, X = -12.93m..-9.56m)
  // Calibrated to Survey2Plan Win 1747147 (0.88m x 0.76m, 670mm sill above 2.16m FFL)
  childIdx = scene.children.length;
  addUpperBrickWallAlongXWithWindow(
    -12.93,
    -9.56,
    2.4,
    2.68,
    -12.05,
    0.88,
    2.83,
    3.59,
    'north',
    2,
    { skipSkirting: true, windowFamily: 'doubleCasement' }
  );
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.southExteriorWall');

  const interiorEavesY = 3.86;
  const collarCeilingY = 4.65;

  // =========================================================================
  // BESPOKE HOTEL DRINKS & REFRESHMENT CABINET (`X = -10.62m..-9.80m, Z = +0.36m..+1.05m`)
  // & MANIFOLD L-SHAPED BATHROOM BULKHEAD (`X = -10.77m..-9.80m, Z = -0.01m..+1.05m`) (Issues #1 & #5)
  // =========================================================================
  childIdx = scene.children.length;
  addUpperInteriorWall(-10.695, floorTopY, collarCeilingY, 0.52, 0.15, 1.06, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadWestWall');

  childIdx = scene.children.length;
  addUpperInteriorWall(-10.21, floorTopY, collarCeilingY, 0.175, 0.82, 0.37, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadNorthWall');

  childIdx = scene.children.length;
  addUpperInteriorWall(-10.21, upperWallTopY, collarCeilingY, 0.705, 0.82, 0.69, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadUpperSoffit');

  // Continuous 45-deg-mitred 146mm antique oak skirtings around the Family Bathroom & Upper South Passage
  for (const [skirtName, path] of [
    [
      'familyBathroom.perimeterMitredSkirting',
      [
        [-12.81, -0.3],
        [-12.81, -2.5],
        [-9.8, -2.5],
        [-9.8, -0.01],
        [-10.77, -0.01],
        [-10.77, 0.832],
      ] as const,
    ],
    [
      'familyBathroom.southPierSkirting',
      [
        [-11.672, 0.9],
        [-11.96, 0.9],
      ] as const,
    ],
    [
      'upperSouthPassage.northWestSkirting',
      [
        [-12.81, 1.05],
        [-11.672, 1.05],
      ] as const,
    ],
    [
      'upperSouthPassage.northEastPierSkirting',
      [
        [-10.688, 1.05],
        [-10.62, 1.05],
      ] as const,
    ],
    [
      'upperSouthPassage.southMitredSkirting',
      [
        [-9.8, 1.955],
        [-9.8, 2.4],
        [-12.81, 2.4],
        [-12.81, 2.082],
      ] as const,
    ],
  ] as const) {
    const skirtGeo = buildMitredWallSkirtingGeometry(path, floorTopY);
    skirtGeo.computeBoundingSphere();
    const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  // Bespoke recessed oak Hotel Drinks & Refreshment Cabinet
  buildFamilyBathroomDrinksCabinet(scene, {
    brassMat,
    ceramicWhiteMat,
    floorTopY,
    upperWallTopY,
    windowGlassMat,
  });

  // Partition wall between Family Bathroom and Upper South Passage (0.15m thick, Z = +0.90m..+1.05m, X = -10.77m..-12.81m)
  // With bathroom entrance doorway at X = -11.18m (`width = 0.82m`, `X = -11.59m..-10.77m`)
  childIdx = scene.children.length;
  addUpperInteriorWall(-12.2, floorTopY, collarCeilingY, 0.975, 1.22, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southPartitionWall');

  childIdx = scene.children.length;
  addUpperInteriorWall(-11.18, floorTopY + doorH, collarCeilingY, 0.975, 0.82, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southDoorTransomWall');

  childIdx = scene.children.length;
  addUpperInteractiveDoor('x', 0.975, 0.15, -11.18, 0.82, -Math.PI * 0.48);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.door');

  // =========================================================================
  // PRINCIPAL FAMILY BATHROOM SANITARYWARE & JOINERY
  // =========================================================================
  buildFamilyBathroomBathAndShower(scene, {
    brassMat,
    ceramicWhiteMat,
    floorTopY,
    windowGlassMat,
  });

  buildFamilyBathroomVanityAndToilet(scene, {
    brassMat,
    ceramicWhiteMat,
    floorTopY,
  });

  // West Load-Bearing Cross-Wall between Family Bathroom/Passage and Main Staircase Landing (0.24m thick, X = -12.81m..-13.05m)
  // Open passage/doorway at Z = +1.55m with cased antique oak architrave portal matching downstairs
  childIdx = scene.children.length;
  addUpperInteriorWall(-12.93, floorTopY, interiorEavesY, -0.7, 0.24, 3.6, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westCrossWallNorth');

  // Clean antique-oak profiled skirting segments on the West (`X = -13.05m`, Upper Landing) face of the X = -12.93m Cross-Wall
  for (const [segIdx, [z0, z1]] of (
    [
      [-2.478, -1.34],
      [0.46, 1.018],
      [2.082, 2.22],
    ] as const
  ).entries()) {
    const skirtGeo = buildMitredWallSkirtingGeometry(
      [
        [-13.05, z0],
        [-13.05, z1],
      ],
      floorTopY
    );
    skirtGeo.computeBoundingSphere();
    const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
    skirtMesh.name = `upperLanding.eastCrossWallSkirting_${segIdx + 1}`;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  // Stop the South cross-wall pier at `Z = 2.398m` (`z = 2.199, d = 0.398`)
  childIdx = scene.children.length;
  addUpperInteriorWall(-12.93, floorTopY, interiorEavesY, 2.199, 0.24, 0.398, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westCrossWallSouthPier');

  childIdx = scene.children.length;
  addUpperInteriorWall(-12.93, floorTopY + doorH, 4.18, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westCrossWallTransom');

  childIdx = scene.children.length;
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
  ensureNamedAddedChildren(scene, childIdx, 'upperLanding.eastPassagePortal');

  // Full-Span Trapezoidal Upper Gable Extension on the X = -12.93m Cross-Wall (`Y = 3.86m..4.65m`)
  {
    const crossGableShape = new THREE.Shape();
    crossGableShape.moveTo(-2.5, interiorEavesY);
    crossGableShape.lineTo(1.1, interiorEavesY);
    crossGableShape.lineTo(1.1, 4.18);
    crossGableShape.lineTo(2.0, 4.18);
    crossGableShape.lineTo(2.0, interiorEavesY);
    crossGableShape.lineTo(2.398, interiorEavesY);
    crossGableShape.lineTo(1.35, collarCeilingY);
    crossGableShape.lineTo(-1.15, collarCeilingY);
    crossGableShape.closePath();
    const crossGableGeo = new THREE.ExtrudeGeometry(crossGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    crossGableGeo.rotateY(-Math.PI / 2);
    crossGableGeo.translate(-12.93 + 0.12, 0, 0);
    crossGableGeo.computeBoundingSphere();
    const crossGableMesh = new THREE.Mesh(crossGableGeo, warmRoomPlasterMat);
    crossGableMesh.name = 'familyBathroom.westWallUpperGable';
    crossGableMesh.userData.isArchitecturalShell = true;
    crossGableMesh.castShadow = true;
    crossGableMesh.receiveShadow = true;
    scene.add(crossGableMesh);
  }
}
