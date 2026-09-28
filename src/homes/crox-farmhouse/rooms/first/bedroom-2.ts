import * as THREE from 'three';
import { buildAngledWallSegment, buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 2 (`bedroom2`) above the Front Room (`livingRoom`).
 */
export function buildBedroom2(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'skirtingMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addUpperBrickWallAlongZWithWindow,
    antiqueOakSkirtingMat,
    brassMat,
    doorH,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    skirtingMat,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;

  // =========================================================================
  // 4. BEDROOM 2 (Non-square polygon directly above the Front Room)
  //    X = -22.19m..-16.876m/-17.891m, Z = -3.18m/-2.469m..+1.905m/+2.48m
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, -3.18],
      [-16.876, -2.469],
      [-17.891, 2.48],
      [-22.19, 1.905],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );

  // North Exterior Brick Gable Wall of Bedroom 2 (angled [-22.47, -3.359] -> [-16.858, -2.608])
  // 100% collinear with Upper Landing, Family Bathroom & Main Bedroom North exterior brick wall!
  const bed2NorthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.47, -3.359],
    end: [-16.858, -2.608],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorBaseY,
    backFloorY: floorTopY,
    wallMaterial: exteriorBrickMat,
    frontFaceMaterial: exteriorBrickMat,
    backFaceMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false,
    addBackSkirting: true,
  });

  // Built-in double wardrobes along the North-East wall of Bedroom 2, parented to bed2NorthWallFrame
  const bed2WardrobeGroup = bed2NorthWallFrame.createGroup(scene, 'bedroom2.northWardrobe');
  const bed2Wardrobe = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 1.92, 0.62),
    wardrobeMat
  );
  bed2Wardrobe.position.set(3.95, floorTopY + 0.96, -0.45);
  bed2Wardrobe.castShadow = true;
  bed2WardrobeGroup.add(bed2Wardrobe);

  // West Front Exterior Brick Wall of Bedroom 2 (X = -22.47m..-22.19m, Z = -3.18m..+1.905m)
  // With 2-pane Georgian casement window centered at Z = -0.26m (directly above the Front Room bay window — Photo 2!)
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    -3.18,
    1.905,
    -0.26,
    1.35,
    2.92,
    3.94,
    'east',
    2
  );

  // Continuous Straight Angled South Wall of Bedroom 2 ([-22.19, 1.905] -> [-17.891, 2.48], 0.28m thick)
  // Directly above the Ground Floor Living Room / Entrance Hallway straight wall!
  // Includes:
  //   1. En-suite connecting door to Shower Room near West window (`uCenter = 0.48m, width = 0.72m`)
  //   2. Main Bedroom 2 entrance door from West Wing Corridor (`uCenter = 3.74m, width = 0.84m`)
  const bed2SouthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 1.905],
    end: [-17.891, 2.48],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
    openings: [
      {
        id: 'bedroom2EnsuiteDoor',
        kind: 'hinged-door',
        uCenter: 0.48,
        width: 0.72,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: skirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'left',
        openAngle: -Math.PI * 0.42,
        initialOpenProgress: 0.0,
      },
      {
        id: 'bedroom2Door',
        kind: 'hinged-door',
        uCenter: 3.74,
        width: 0.84,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: skirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'right',
        openAngle: Math.PI * 0.43,
        initialOpenProgress: 0.2,
      },
    ],
  });

  // Bedroom 2 South Chimney Breast (centered at u = 1.95m along bed2SouthWallFrame, projecting North into Bedroom 2 directly above Front Room chimney breast)
  const bed2ChimneyGroup = bed2SouthWallFrame.createGroup(
    scene,
    'bedroom2.southChimneyBreast',
    1.95,
    0,
    -0.35
  );
  const bed2ChimneyBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, upperWallTopY - floorTopY, 0.42),
    warmRoomPlasterMat
  );
  bed2ChimneyBody.position.set(0, (floorTopY + upperWallTopY) / 2, 0);
  bed2ChimneyBody.castShadow = true;
  bed2ChimneyBody.receiveShadow = true;
  bed2ChimneyGroup.add(bed2ChimneyBody);

  const bed2ChimneyCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.244, 0.025, 0.424),
    wallCapMat
  );
  bed2ChimneyCap.position.set(0, upperWallTopY + 0.012, 0);
  bed2ChimneyGroup.add(bed2ChimneyCap);

  const bed2ChimneySkirt = new THREE.Mesh(
    new THREE.BoxGeometry(1.266, 0.14, 0.446),
    antiqueOakSkirtingMat
  );
  bed2ChimneySkirt.position.set(0, floorTopY + 0.07, 0);
  bed2ChimneyGroup.add(bed2ChimneySkirt);

  // Collinear Step-Up Portal Wall between West Wing Corridor and Main Staircase Landing
  // ([-17.891, 2.48] -> [-16.92, 2.61], 0.28m thick — directly above Ground Floor entranceHall step-up portal wall!)
  const corridorPortalFrame = buildAngledWallSegment(scene, interactions, {
    start: [-17.891, 2.48],
    end: [-16.92, 2.61],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
    openings: [
      {
        id: 'upperLandingCorridorArch',
        kind: 'cased-opening',
        uCenter: 0.535,
        width: 0.74,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: skirtingMat,
      },
    ],
  });

  // Oak Step-Up Threshold (`UP` arrow on First Floor plan `media_1790619089017.png`, directly above Ground Floor ceiling boxing!)
  const landingStepGroup = corridorPortalFrame.createGroup(
    scene,
    'westWingCorridor.landingStep',
    0.535,
    floorTopY,
    0
  );
  const stepRiser = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.14, 0.025),
    skirtingMat
  );
  stepRiser.position.set(0, 0.07, 0.09);
  landingStepGroup.add(stepRiser);

  const stepTread = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.032, 0.26),
    antiqueOakSkirtingMat
  );
  stepTread.position.set(0, 0.14, -0.04);
  stepTread.castShadow = true;
  stepTread.receiveShadow = true;
  landingStepGroup.add(stepTread);

  const stepNosing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.74, 10),
    brassMat
  );
  stepNosing.rotation.z = Math.PI / 2;
  stepNosing.position.set(0, 0.146, 0.095);
  landingStepGroup.add(stepNosing);
}
