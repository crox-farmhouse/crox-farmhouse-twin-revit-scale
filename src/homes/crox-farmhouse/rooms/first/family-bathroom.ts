import * as THREE from 'three';
import { addCasedArchitravePortal, buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import { EAST_WING_BATHROOM_VAULT, type createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';
import { buildFamilyBathroomBathAndShower } from './bathroom/bathroom-bath-and-shower.ts';
import {
  buildFamilyBathroomPanellingAndLinings,
  ROOM17_OPTION1_PLANES,
  SOUTH_SHOWER_NICHE_OPENING,
  WEST_SHOWER_NICHE_OPENING,
} from './bathroom/bathroom-panelling-and-linings.ts';
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
 * Family Bathroom (`familyBathroom`, Option 1 Re-Layout) and Upper South Passage:
 * - Slimline `450mm`-deep passage mini-bar (`X = -10.62..-9.80m, Z = +0.60..+1.05m`)
 * - Reclaimed `970 × 1,160mm` SE walk-in alcove shower (`X = -10.77..-9.80m, Z = -0.68..+0.48m`)
 *   framed by `120mm` acoustic Rockwool stud walls (keeping the `X = -9.80m` bedroom headboard brick wall
 *   100% un-chased) with recessed pockets for warm `2700K` LED-lit shower niches
 * - `1,600 × 550mm` West-wall smoked dark English oak single-basin vanity + full-height apothecary joinery
 * - Issue #12: Crisp `Wimborne White` (`#F7F4EC`) upstairs doors, architraves, portals & skirtings,
 *   plus a flush pale limestone doorway threshold strip.
 */
export function buildFamilyBathroom(
  ctx: SceneBuilderContext,
  kit: Pick<
    ReturnType<typeof createFirstFloorMaterials>,
    | 'antiqueOakSkirtingMat'
    | 'bathroomTileMat'
    | 'brassMat'
    | 'ceramicWhiteMat'
    | 'floorTopY'
    | 'masterLimestoneFloorMat'
    | 'oakFloorMat'
    | 'upperWallTopY'
    | 'wardrobeMat'
    | 'schoolHouseWhiteMat'
    | 'warmRoomPlasterMat'
    | 'wimborneWhiteJoineryMat'
    | 'wimborneWhitePanellingMat'
    | 'windowGlassMat'
  > &
    Pick<
      ReturnType<typeof createFirstFloorShellKit>,
      | 'addFirstFloorSlab'
      | 'addShakerWardrobeDoor'
      | 'addUpperBrickWallAlongXWithWindow'
      | 'addUpperInteractiveDoor'
      | 'addUpperInteriorWall'
      | 'doorH'
      | 'tagUpperCutawayWall'
    >
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
    wimborneWhiteJoineryMat,
    wimborneWhitePanellingMat,
    windowGlassMat,
  } = kit;

  // =========================================================================
  // 1. FLOOR SLABS & FLUSH LIMESTONE THRESHOLD (OPTION 1 + ISSUE #12)
  // =========================================================================
  let childIdx = scene.children.length;
  addFirstFloorSlab(-12.93, -10.89, -2.64, 0.975, masterLimestoneFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-10.89, -9.68, -2.64, 0.54, masterLimestoneFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.eastFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-10.89, -9.684, 0.54, 0.975, oakFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.drinksRecessFloorSlab');

  childIdx = scene.children.length;
  addFirstFloorSlab(-13.05, -9.684, 0.975, 2.54, oakFloorMat);
  ensureNamedAddedChildren(scene, childIdx, 'upperSouthPassage.floorSlab');

  // Issue #12: Flush pale limestone threshold strip beneath `door-54` (`X = -11.735..-10.975m, Z = 0.975m`)
  const bathDoorCenter = -11.355;
  const bathDoorW = 0.76;
  const bathDoorH = 1.866;
  {
    const bathThresholdGeo = new THREE.BoxGeometry(bathDoorW, 0.004, 0.036);
    bathThresholdGeo.computeBoundingSphere();
    const bathThresholdStrip = new THREE.Mesh(bathThresholdGeo, masterLimestoneFloorMat);
    bathThresholdStrip.name = 'familyBathroom.doorThresholdStrip';
    bathThresholdStrip.userData.isArchitecturalShell = true;
    bathThresholdStrip.position.set(bathDoorCenter, floorTopY + 0.002, 0.975);
    bathThresholdStrip.receiveShadow = true;
    scene.add(bathThresholdStrip);
  }

  // =========================================================================
  // 2. NORTH & SOUTH EXTERIOR COTTAGE BRICK WALLS
  // =========================================================================
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
  // 3. SE WALK-IN ALCOVE SHOWER & 450mm MINI-BAR ACOUSTIC STUD FRAMING
  //    - West shower stud (`X = -10.89..-10.77m, Z = -0.68..+0.48m`) with 86mm recessed niche pocket
  //      and 34mm solid acoustic backing (`X = -10.89..-10.856m`)
  //    - West mini-bar cheek pier (`X = -10.89..-10.62m, Z = +0.48..+1.05m`)
  //    - South shower / North mini-bar 120mm dividing stud (`Z = +0.48..+0.60m, X = -10.89..-9.80m`)
  //      with 86mm recessed 2-tier bottle niche pocket (`Z = +0.48..+0.566m`) and 34mm solid backing
  //      (`Z = +0.566..+0.600m`) before the `Z = +0.602m` mini-bar back panel!
  //    - Mini-bar upper soffit (`X = -10.62..-9.80m, Z = +0.60..+1.05m, Y = 4.16..4.664m`)
  // =========================================================================
  {
    childIdx = scene.children.length;
    const shNorthZ = ROOM17_OPTION1_PLANES.showerNorthZ;
    const shSouthZ = ROOM17_OPTION1_PLANES.showerSouthZ;

    // 3A. West shower stud inner 86mm leaf (`X = -10.856..-10.77m`) with West niche hole
    const westStudShape = new THREE.Shape();
    westStudShape.moveTo(shNorthZ, floorTopY);
    westStudShape.lineTo(shSouthZ, floorTopY);
    westStudShape.lineTo(shSouthZ, collarWallTopY);
    westStudShape.lineTo(shNorthZ, collarWallTopY);
    westStudShape.closePath();

    const westNicheHole = new THREE.Path();
    westNicheHole.moveTo(WEST_SHOWER_NICHE_OPENING.northZ, WEST_SHOWER_NICHE_OPENING.bottomY);
    westNicheHole.lineTo(WEST_SHOWER_NICHE_OPENING.southZ, WEST_SHOWER_NICHE_OPENING.bottomY);
    westNicheHole.lineTo(WEST_SHOWER_NICHE_OPENING.southZ, WEST_SHOWER_NICHE_OPENING.topY);
    westNicheHole.lineTo(WEST_SHOWER_NICHE_OPENING.northZ, WEST_SHOWER_NICHE_OPENING.topY);
    westNicheHole.closePath();
    westStudShape.holes.push(westNicheHole);

    const westStudGeo = new THREE.ExtrudeGeometry(westStudShape, {
      depth: 0.086,
      bevelEnabled: false,
    });
    westStudGeo.rotateY(-Math.PI / 2);
    westStudGeo.translate(ROOM17_OPTION1_PLANES.showerWestX, 0, 0);
    westStudGeo.computeBoundingSphere();
    const westStudMesh = new THREE.Mesh(westStudGeo, warmRoomPlasterMat);
    westStudMesh.name = 'familyBathroom.bulkheadWestWall.showerStud';
    westStudMesh.userData.isArchitecturalShell = true;
    westStudMesh.castShadow = true;
    westStudMesh.receiveShadow = true;
    scene.add(westStudMesh);

    // Solid 34mm outer dry-side backing (`X = -10.89..-10.856m`) across `Z = -0.68..+0.48m`
    addUpperInteriorWall(
      -10.873,
      floorTopY,
      collarWallTopY,
      (shNorthZ + shSouthZ) * 0.5,
      0.034,
      shSouthZ - shNorthZ,
      warmRoomPlasterMat,
      { skipSkirting: true, skipCap: true }
    );

    // Mini-bar West cheek pier (`X = -10.89..-10.62m, Z = +0.48..+1.05m`)
    addUpperInteriorWall(-10.755, floorTopY, collarWallTopY, 0.765, 0.27, 0.57, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadWestWall');
  }

  {
    childIdx = scene.children.length;
    const southStudShape = new THREE.Shape();
    southStudShape.moveTo(ROOM17_OPTION1_PLANES.showerWestX, floorTopY);
    southStudShape.lineTo(ROOM17_OPTION1_PLANES.eastWallX, floorTopY);
    southStudShape.lineTo(ROOM17_OPTION1_PLANES.eastWallX, collarWallTopY);
    southStudShape.lineTo(ROOM17_OPTION1_PLANES.showerWestX, collarWallTopY);
    southStudShape.closePath();

    const southNicheHole = new THREE.Path();
    southNicheHole.moveTo(SOUTH_SHOWER_NICHE_OPENING.westX, SOUTH_SHOWER_NICHE_OPENING.bottomY);
    southNicheHole.lineTo(SOUTH_SHOWER_NICHE_OPENING.eastX, SOUTH_SHOWER_NICHE_OPENING.bottomY);
    southNicheHole.lineTo(SOUTH_SHOWER_NICHE_OPENING.eastX, SOUTH_SHOWER_NICHE_OPENING.topY);
    southNicheHole.lineTo(SOUTH_SHOWER_NICHE_OPENING.westX, SOUTH_SHOWER_NICHE_OPENING.topY);
    southNicheHole.closePath();
    southStudShape.holes.push(southNicheHole);

    const southStudGeo = new THREE.ExtrudeGeometry(southStudShape, {
      depth: 0.086,
      bevelEnabled: false,
    });
    southStudGeo.translate(0, 0, ROOM17_OPTION1_PLANES.showerSouthZ);
    southStudGeo.computeBoundingSphere();
    const southStudMesh = new THREE.Mesh(southStudGeo, warmRoomPlasterMat);
    southStudMesh.name = 'familyBathroom.bulkheadNorthWall.showerStud';
    southStudMesh.userData.isArchitecturalShell = true;
    southStudMesh.castShadow = true;
    southStudMesh.receiveShadow = true;
    scene.add(southStudMesh);

    // Solid 34mm mini-bar-side acoustic backing (`Z = +0.566..+0.600m, X = -10.62..-9.80m`)
    addUpperInteriorWall(-10.21, floorTopY, collarWallTopY, 0.583, 0.82, 0.034, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadNorthWall');
  }

  childIdx = scene.children.length;
  addUpperInteriorWall(-10.21, upperWallTopY, collarWallTopY, 0.825, 0.82, 0.45, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.bulkheadUpperSoffit');

  // Room 17 Zellige SE shower linings + School House White upper linings + Wimborne White boxed dado
  buildFamilyBathroomPanellingAndLinings(scene, {
    floorTopY,
    schoolHouseWhiteMat,
    wimborneWhiteJoineryMat,
    wimborneWhitePanellingMat,
    tagUpperCutawayWall,
  });

  // Issue #12: Continuous 45°-mitred 146mm Wimborne White skirtings along the Upper South Passage
  for (const [skirtName, path] of [
    [
      'upperSouthPassage.northWestSkirting',
      [
        [-12.81, 1.05],
        [ROOM17_OPTION1_PLANES.doorWestArchitraveX, 1.05],
      ] as const,
    ],
    [
      'upperSouthPassage.northEastPierSkirting',
      [
        [ROOM17_OPTION1_PLANES.doorEastArchitraveX, 1.05],
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
    const skirtMesh = new THREE.Mesh(skirtGeo, wimborneWhiteJoineryMat);
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  // Slimline 450mm-deep passage Hotel Drinks & Refreshment Cabinet (`Z = +0.602..+1.048m`)
  buildFamilyBathroomDrinksCabinet(scene, {
    brassMat,
    ceramicWhiteMat,
    floorTopY,
    upperWallTopY,
    windowGlassMat,
  });

  // =========================================================================
  // 4. SOUTH PARTITION WALL & DOOR-54 (BOTH SIDES WIMBORNE WHITE — ISSUE #12)
  // =========================================================================
  const doorWestJambX = bathDoorCenter - bathDoorW * 0.5; // -11.735m
  const doorEastJambX = bathDoorCenter + bathDoorW * 0.5; // -10.975m

  childIdx = scene.children.length;
  addUpperInteriorWall(
    (-12.81 + doorWestJambX) * 0.5,
    floorTopY,
    collarWallTopY,
    0.975,
    doorWestJambX - -12.81,
    0.15,
    warmRoomPlasterMat,
    { skipSkirting: true, skipCap: true }
  );
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southPartitionWall');

  childIdx = scene.children.length;
  addUpperInteriorWall(
    (doorEastJambX + -10.89) * 0.5,
    floorTopY,
    collarWallTopY,
    0.975,
    -10.89 - doorEastJambX,
    0.15,
    warmRoomPlasterMat,
    { skipSkirting: true, skipCap: true }
  );
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southEastJambPier');

  childIdx = scene.children.length;
  addUpperInteriorWall(
    bathDoorCenter,
    floorTopY + bathDoorH,
    collarWallTopY,
    0.975,
    bathDoorW,
    0.15,
    warmRoomPlasterMat,
    { skipSkirting: true, skipCap: true }
  );
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.southDoorTransomWall');

  childIdx = scene.children.length;
  addUpperInteractiveDoor('x', 0.975, 0.15, bathDoorCenter, bathDoorW, -Math.PI * 0.42, {
    doorH: bathDoorH,
    hingeSide: 'east',
    frontLeafMaterial: wimborneWhiteJoineryMat,
    backLeafMaterial: wimborneWhiteJoineryMat,
    frontArchitraveMaterial: wimborneWhiteJoineryMat,
    backArchitraveMaterial: wimborneWhiteJoineryMat,
  });
  for (let i = childIdx; i < scene.children.length; i++) {
    scene.children[i]!.traverse((node) => {
      if (node instanceof THREE.Mesh && node.material === antiqueOakSkirtingMat) {
        node.material = wimborneWhiteJoineryMat;
      }
    });
  }
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.door');

  // =========================================================================
  // 5. PRINCIPAL FAMILY BATHROOM SANITARYWARE & JOINERY (OPTION 1)
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

  // =========================================================================
  // 6. WEST CROSS-WALL BETWEEN ROOM 17 / PASSAGE AND MAIN STAIRCASE LANDING
  // =========================================================================
  childIdx = scene.children.length;
  addUpperInteriorWall(-12.93, floorTopY, interiorEavesY, -0.715, 0.24, 3.63, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  ensureNamedAddedChildren(scene, childIdx, 'familyBathroom.westCrossWallNorth');

  // Issue #12: Wimborne White profiled skirting segments on the Upper Landing (`X = -13.05m`) face
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
    const skirtMesh = new THREE.Mesh(skirtGeo, wimborneWhiteJoineryMat);
    skirtMesh.name = `upperLanding.eastCrossWallSkirting_${segIdx + 1}`;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

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
    material: wimborneWhiteJoineryMat,
    namePrefix: 'upperLanding.eastPassagePortal',
  });
  ensureNamedAddedChildren(scene, childIdx, 'upperLanding.eastPassagePortal');

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
