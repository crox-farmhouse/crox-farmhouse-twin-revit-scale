import * as THREE from 'three';
import { addCasedArchitravePortal, buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import { EAST_WING_BATHROOM_VAULT, type createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';
import { buildFamilyBathroomBathAndShower } from './bathroom/bathroom-bath-and-shower.ts';
import { buildFamilyBathroomPanellingAndLinings } from './bathroom/bathroom-panelling-and-linings.ts';
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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'floorTopY' | 'masterLimestoneFloorMat' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'schoolHouseWhiteMat' | 'warmRoomPlasterMat' | 'wimborneWhitePanellingMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongXWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
    brassMat,
    masterLimestoneFloorMat,
    ceramicWhiteMat,
    doorH,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    schoolHouseWhiteMat,
    tagUpperCutawayWall,
    warmRoomPlasterMat,
    wimborneWhitePanellingMat,
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
  addFirstFloorSlab(-12.93, -10.695, -2.64, 0.975, masterLimestoneFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-10.695, -9.68, -2.64, 0.05, masterLimestoneFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.eastFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-10.695, -9.684, 0.05, 0.975, oakFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.drinksRecessFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-13.05, -9.684, 0.975, 2.54, oakFloorMat);
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
  // Calibrated to measurements.rvt Win 1763678 (1.10m x 0.92m, doubleCasement directly below 3.33m 49° cottage eaves)
  childIdx = scene.children.length;
  addUpperBrickWallAlongXWithWindow(
    -13.05,
    -9.56,
    -2.78,
    -2.5,
    -11.35,
    1.1,
    2.32,
    3.24,
    'south',
    2,
    {
      skipSkirting: true,
      minSillY: 2.3,
      wallTopY: EAST_WING_BATHROOM_VAULT.northEavesY + 0.002,
      skipUnderApron: true,
      seamMinusX: true,
      seamPlusX: true,
      trimFaceOffset: 0.01,
      windowFamily: 'doubleCasement',
    }
  );
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.northExteriorWall');

  // South Courtyard Exterior Brick Wall of Upper Passage (Z = +2.40m..+2.68m, X = -12.93m..-9.56m)
  // Calibrated to Survey2Plan Win 1747147 (0.88m x 0.76m, 670mm sill above 2.16m FFL, below 3.765m 50° South eaves)
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
    {
      skipSkirting: true,
      wallTopY: EAST_WING_BATHROOM_VAULT.southEavesY + 0.002,
      windowFamily: 'doubleCasement',
    }
  );
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.southExteriorWall');

  const interiorEavesY = EAST_WING_BATHROOM_VAULT.northEavesY;
  const collarCeilingY = EAST_WING_BATHROOM_VAULT.collarCeilingY;
  const collarWallTopY = collarCeilingY + EAST_WING_BATHROOM_VAULT.wallTopEmbed;

  // =========================================================================
  // BESPOKE HOTEL DRINKS & REFRESHMENT CABINET (`X = -10.62m..-9.80m, Z = +0.36m..+1.05m`)
  // & MANIFOLD L-SHAPED BATHROOM BULKHEAD (`X = -10.77m..-9.80m, Z = -0.01m..+1.05m`) (Issues #1 & #5)
  // =========================================================================
  childIdx = scene.children.length;
  addUpperInteriorWall(-10.695, floorTopY, collarWallTopY, 0.52, 0.15, 1.06, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadWestWall');

  childIdx = scene.children.length;
  addUpperInteriorWall(-10.21, floorTopY, collarWallTopY, 0.175, 0.82, 0.37, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadNorthWall');

  childIdx = scene.children.length;
  addUpperInteriorWall(-10.21, upperWallTopY, collarWallTopY, 0.705, 0.82, 0.69, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadUpperSoffit');

  // Room 17 Farrow & Ball School House White upper wall linings + Wimborne White 3D V-groove T&G panelling,
  // moulded dado cap rail, and painted Wimborne White bathroom skirtings
  buildFamilyBathroomPanellingAndLinings(scene, {
    floorTopY,
    schoolHouseWhiteMat,
    wimborneWhitePanellingMat,
    tagUpperCutawayWall,
  });

  // Continuous 45-deg-mitred 146mm antique oak skirtings along the Upper South Passage (outside the bathroom)
  for (const [skirtName, path] of [
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
  // Calibrated to measurements.rvt Door 1685658 (`X = -11.18m`, `width = 0.82m`, `doorH = 1.866m`, East-jamb hinged)
  // with a genuine 92mm-deep recessed shower niche pocket (`X = -12.61..-12.15m, Y = 2.90..3.68m, Z = 0.90..0.992m`) on the Bathroom side.
  const bathDoorH = 1.866;
  {
    childIdx = scene.children.length;
    const southFrontShape = new THREE.Shape();
    southFrontShape.moveTo(-12.81, floorTopY);
    southFrontShape.lineTo(-11.68, floorTopY);
    southFrontShape.lineTo(-11.68, collarWallTopY);
    southFrontShape.lineTo(-12.81, collarWallTopY);
    southFrontShape.closePath();

    const southNicheHole = new THREE.Path();
    southNicheHole.moveTo(-12.61, 2.9);
    southNicheHole.lineTo(-12.15, 2.9);
    southNicheHole.lineTo(-12.15, 3.68);
    southNicheHole.lineTo(-12.61, 3.68);
    southNicheHole.closePath();
    southFrontShape.holes.push(southNicheHole);

    const southFrontGeo = new THREE.ExtrudeGeometry(southFrontShape, {
      depth: 0.092,
      bevelEnabled: false,
    });
    southFrontGeo.translate(0, 0, 0.9);
    southFrontGeo.computeBoundingSphere();
    const southFrontMesh = new THREE.Mesh(southFrontGeo, warmRoomPlasterMat);
    southFrontMesh.name = 'familyBathroom.southPartitionWall';
    southFrontMesh.userData.isArchitecturalShell = true;
    southFrontMesh.castShadow = true;
    southFrontMesh.receiveShadow = true;
    scene.add(southFrontMesh);

    // Solid 58mm passage-side backing (`Z = 0.992..1.05m`) keeping the Upper South Passage wall continuous
    addUpperInteriorWall(-12.245, floorTopY, collarWallTopY, 1.021, 1.13, 0.058, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southPartitionWall');
  }

  childIdx = scene.children.length;
  // 90mm East jamb pier (`X = -10.86..-10.77m`) receiving the 82mm bulkhead dado rail & oak door architrave
  addUpperInteriorWall(-10.815, floorTopY, collarWallTopY, 0.975, 0.09, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southEastJambPier');

  childIdx = scene.children.length;
  addUpperInteriorWall(-11.27, floorTopY + bathDoorH, collarWallTopY, 0.975, 0.82, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southDoorTransomWall');

  const bathDoorInsideWhiteMat = new THREE.MeshStandardMaterial({
    name: 'familyBathroom.wimborneWhiteDoorWoodwork',
    color: 0xf7f4ec,
    roughness: 0.34,
    metalness: 0.02,
  });
  childIdx = scene.children.length;
  addUpperInteractiveDoor('x', 0.975, 0.15, -11.27, 0.82, -Math.PI * 0.4, {
    doorH: bathDoorH,
    hingeSide: 'east',
    backLeafMaterial: bathDoorInsideWhiteMat,
    backArchitraveMaterial: bathDoorInsideWhiteMat,
  });
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
  addUpperInteriorWall(-12.93, floorTopY, interiorEavesY, -0.715, 0.24, 3.63, warmRoomPlasterMat, {
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
  const southEavesY = EAST_WING_BATHROOM_VAULT.southEavesY;
  childIdx = scene.children.length;
  addUpperInteriorWall(-12.93, floorTopY, southEavesY, 2.199, 0.24, 0.398, warmRoomPlasterMat, {
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

  // Split Upper Gable Extensions on the X = -12.93m Cross-Wall so:
  // - West half (`X = -13.05..-12.928m`) meets Upper Landing's 3.86m -> 4.65m vault cleanly, and
  // - East half (`X = -12.932..-12.81m`) meets Room 17's 49.0° North skeiling (3.33m) & Passage's 50.0° South skeiling (3.765m) with zero roof protrusion!
  {
    const landingGableShape = new THREE.Shape();
    landingGableShape.moveTo(-2.52, interiorEavesY - 0.008);
    landingGableShape.lineTo(1.1, interiorEavesY - 0.008);
    landingGableShape.lineTo(1.1, 4.172);
    landingGableShape.lineTo(2.0, 4.172);
    landingGableShape.lineTo(2.0, southEavesY - 0.008);
    landingGableShape.lineTo(2.42, southEavesY - 0.008);
    landingGableShape.lineTo(2.42, 3.86 + EAST_WING_BATHROOM_VAULT.wallTopEmbed);
    landingGableShape.lineTo(1.35, collarWallTopY);
    landingGableShape.lineTo(EAST_WING_BATHROOM_VAULT.collarNorthZ, collarWallTopY);
    landingGableShape.lineTo(-2.52, interiorEavesY + EAST_WING_BATHROOM_VAULT.wallTopEmbed);
    landingGableShape.closePath();
    const landingGableGeo = new THREE.ExtrudeGeometry(landingGableShape, {
      depth: 0.122,
      bevelEnabled: false,
    });
    landingGableGeo.rotateY(-Math.PI / 2);
    landingGableGeo.translate(-12.928, 0, 0);
    landingGableGeo.computeBoundingSphere();
    const landingGableMesh = new THREE.Mesh(landingGableGeo, warmRoomPlasterMat);
    landingGableMesh.name = 'upperLanding.eastWallUpperGable';
    landingGableMesh.userData.isArchitecturalShell = true;
    landingGableMesh.castShadow = true;
    landingGableMesh.receiveShadow = true;
    scene.add(landingGableMesh);

    // Upper Landing North vault spandrel wedge placed in ceilingMeshGroup so non-cutaway Landing vault stays 100% closed while Room 17's 49° cutaway slope is razor-clean!
    const landingVaultWedge = new THREE.Shape();
    landingVaultWedge.moveTo(-2.53, interiorEavesY);
    landingVaultWedge.lineTo(EAST_WING_BATHROOM_VAULT.collarNorthZ, collarWallTopY);
    landingVaultWedge.lineTo(-1.15, collarWallTopY);
    landingVaultWedge.lineTo(-2.53, 3.86 + EAST_WING_BATHROOM_VAULT.wallTopEmbed);
    landingVaultWedge.closePath();
    const landingWedgeGeo = new THREE.ExtrudeGeometry(landingVaultWedge, {
      depth: 0.122,
      bevelEnabled: false,
    });
    landingWedgeGeo.rotateY(-Math.PI / 2);
    landingWedgeGeo.translate(-12.928, 0, 0);
    landingWedgeGeo.computeBoundingSphere();
    const landingWedgeMesh = new THREE.Mesh(landingWedgeGeo, warmRoomPlasterMat);
    landingWedgeMesh.name = 'upperLanding.eastWallUpperGable.vaultSpandrel';
    ctx.ceilingMeshGroup.add(landingWedgeMesh);

    const bathGableShape = new THREE.Shape();
    bathGableShape.moveTo(-2.52, interiorEavesY - 0.008);
    bathGableShape.lineTo(1.1, interiorEavesY - 0.008);
    bathGableShape.lineTo(1.1, 4.172);
    bathGableShape.lineTo(2.0, 4.172);
    bathGableShape.lineTo(2.0, southEavesY - 0.008);
    bathGableShape.lineTo(2.41, southEavesY - 0.008);
    bathGableShape.lineTo(2.41, southEavesY + EAST_WING_BATHROOM_VAULT.wallTopEmbed);
    bathGableShape.lineTo(EAST_WING_BATHROOM_VAULT.collarSouthZ, collarWallTopY);
    bathGableShape.lineTo(EAST_WING_BATHROOM_VAULT.collarNorthZ, collarWallTopY);
    bathGableShape.lineTo(-2.52, interiorEavesY + EAST_WING_BATHROOM_VAULT.wallTopEmbed);
    bathGableShape.closePath();

    // Recessed companion West shower niche pocket (`Z = -0.50..-0.06m, Y = 3.36..3.72m`)
    const westNicheHole = new THREE.Path();
    westNicheHole.moveTo(-0.5, 3.36);
    westNicheHole.lineTo(-0.06, 3.36);
    westNicheHole.lineTo(-0.06, 3.72);
    westNicheHole.lineTo(-0.5, 3.72);
    westNicheHole.closePath();
    bathGableShape.holes.push(westNicheHole);

    const crossGableGeo = new THREE.ExtrudeGeometry(bathGableShape, {
      depth: 0.122,
      bevelEnabled: false,
    });
    crossGableGeo.rotateY(-Math.PI / 2);
    crossGableGeo.translate(-12.81, 0, 0);
    crossGableGeo.computeBoundingSphere();
    const crossGableMesh = new THREE.Mesh(crossGableGeo, warmRoomPlasterMat);
    crossGableMesh.name = 'familyBathroom.westWallUpperGable';
    crossGableMesh.userData.isArchitecturalShell = true;
    crossGableMesh.castShadow = true;
    crossGableMesh.receiveShadow = true;
    scene.add(crossGableMesh);
  }
}
