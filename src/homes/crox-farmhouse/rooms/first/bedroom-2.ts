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
  buildAngledWallSegment(scene, interactions, {
    start: [-22.47, -3.359],
    end: [-16.858, -2.608],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: 1.625,
    backFloorY: floorTopY,
    wallMaterial: exteriorBrickMat,
    frontFaceMaterial: exteriorBrickMat,
    backFaceMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false,
    addBackSkirting: true,
  });

  // =========================================================================
  // TWO BUILT-IN DOUBLE WARDROBES ALONG THE EAST CROSS-WALL OF BEDROOM 2
  // (`[-16.876, -2.469] -> [-17.57, +0.90]`, length = 3.36m, depth = 0.62m West `+Z_local` into Bedroom 2)
  // Issue #2: Positive local Z places the carcass and Shaker doors on the WEST (Bedroom 2) side
  // of the cross-wall (leaving the Upper Landing stairwell completely clear!) and stopping 1.50m
  // North of the South wall so `bedroom2Door` has a generous, unobstructed entrance inside Bedroom 2!
  // =========================================================================
  {
    const wardGroup = new THREE.Group();
    wardGroup.name = 'bedroom2.eastWardrobes';
    const startX = -16.876;
    const startZ = -2.469;
    const endX = -17.891;
    const endZ = 2.48;
    const dx = endX - startX;
    const dz = endZ - startZ;
    const angleY = -Math.atan2(dz, dx);
    wardGroup.position.set(startX, floorTopY, startZ);
    wardGroup.rotation.y = angleY;

    const wardH = upperWallTopY - floorTopY; // 2.00m full-height built-in
    const wardDepth = 0.62;
    const baySpan = 3.32; // u = 0.08m .. 3.40m (leaving u = 3.40m..4.91m clear for bedroom2Door!)
    const uMid = 0.08 + baySpan / 2;

    // Main carcass box on the WEST (`+Z` in local frame) Bedroom 2 side of the cross-wall
    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan, wardH, wardDepth),
      wardrobeMat
    );
    carcass.position.set(uMid, wardH / 2, 0.12 + wardDepth / 2);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    wardGroup.add(carcass);

    // Central vertical dividing wall between the 2 built-in double wardrobes
    const centerDivider = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, wardH, wardDepth + 0.02),
      warmRoomPlasterMat
    );
    centerDivider.position.set(uMid, wardH / 2, 0.12 + wardDepth / 2);
    wardGroup.add(centerDivider);

    // South end return wall closing the South side of the built-in wardrobes at u = 3.40m
    const southEndPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, wardH, wardDepth + 0.02),
      warmRoomPlasterMat
    );
    southEndPanel.position.set(0.08 + baySpan, wardH / 2, 0.12 + wardDepth / 2);
    southEndPanel.castShadow = true;
    southEndPanel.receiveShadow = true;
    wardGroup.add(southEndPanel);

    // 4 Shaker wardrobe doors (2 pairs of double doors) on the West face (`+Z` in local frame, facing into Bedroom 2)
    const doorW = (baySpan - 0.18) / 4;
    const doorLeafH = wardH - 0.24;
    for (let i = 0; i < 4; i++) {
      const doorU = 0.14 + doorW / 2 + i * (doorW + 0.02);
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW - 0.015, doorLeafH, 0.022),
        wardrobeMat
      );
      doorPanel.position.set(doorU, 0.12 + doorLeafH / 2, 0.12 + wardDepth + 0.011);
      doorPanel.castShadow = true;
      wardGroup.add(doorPanel);

      // Brass knob on the inner meeting stiles of each pair (i=0 right, i=1 left, i=2 right, i=3 left)
      const isLeftLeaf = i % 2 === 0;
      const knobU = doorU + (isLeftLeaf ? doorW * 0.36 : -doorW * 0.36);
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 10, 10),
        brassMat
      );
      knob.position.set(knobU, 1.02, 0.12 + wardDepth + 0.03);
      wardGroup.add(knob);
    }

    // Antique oak skirting plinth along the West face and South return of the built-in wardrobes
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan + 0.04, 0.122, 0.024),
      antiqueOakSkirtingMat
    );
    plinth.position.set(uMid, 0.061, 0.12 + wardDepth + 0.012);
    wardGroup.add(plinth);

    const endPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.122, wardDepth + 0.02),
      antiqueOakSkirtingMat
    );
    endPlinth.position.set(0.08 + baySpan + 0.04, 0.061, 0.12 + wardDepth / 2);
    wardGroup.add(endPlinth);

    scene.add(wardGroup);
  }

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

  // Continuous Straight Angled South Wall of Bedroom 2 (`[-22.19, 1.905] -> [-17.891, 2.48]`, 0.28m thick)
  // Directly above the Ground Floor Living Room / Entrance Hallway straight wall!
  // Includes:
  //   1. En-suite connecting door to Shower Room near West window (`uCenter = 0.48m, width = 0.72m`)
  //   2. Bedroom 2 South Chimney Breast (`uCenter = 1.95m`)
  //   3. Main Bedroom 2 entrance door from West Wing Corridor (`uCenter = 3.74m, width = 0.84m`)
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
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'left',
        openAngle: -Math.PI * 0.42,
        initialOpenProgress: 0.0,
      },
      {
        id: 'bedroom2Door',
        kind: 'hinged-door',
        uCenter: 3.8,
        width: 0.72,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: antiqueOakSkirtingMat,
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

  const bed2ChimneySkirtBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.284, 0.122, 0.464),
    antiqueOakSkirtingMat
  );
  bed2ChimneySkirtBase.position.set(0, floorTopY + 0.061, 0);
  bed2ChimneyGroup.add(bed2ChimneySkirtBase);

  const bed2ChimneySkirtCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.272, 0.024, 0.452),
    antiqueOakSkirtingMat
  );
  bed2ChimneySkirtCap.position.set(0, floorTopY + 0.122 + 0.012, 0);
  bed2ChimneyGroup.add(bed2ChimneySkirtCap);

  // Collinear Step-Up Portal Wall between West Wing Corridor and Main Staircase Landing
  // (`[-17.891, 2.48] -> [-16.83, 2.622]`, 0.28m thick — directly above Ground Floor entranceHall step-up portal wall!)
  const corridorPortalFrame = buildAngledWallSegment(scene, interactions, {
    start: [-17.891, 2.48],
    end: [-16.83, 2.622],
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
        architraveMaterial: antiqueOakSkirtingMat,
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
