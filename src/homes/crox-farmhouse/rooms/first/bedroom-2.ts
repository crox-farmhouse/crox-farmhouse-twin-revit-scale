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
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;

  // =========================================================================
  // 4. BEDROOM 2 (Non-square polygon directly above the Front Room)
  //    X = -22.19m..-16.876m/-18.84m, Z = -3.18m/-2.469m..+1.905m/+2.353m
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, -3.18],
      [-16.876, -2.469],
      [-17.596, 1.007],
      [-18.23, 0.88],
      [-18.84, 2.353],
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
  // (`[-16.876, -2.469] -> [-17.596, +1.007]`, length = 3.55m, depth = 0.62m West into Bedroom 2)
  // Matching the First Floor plan (`ff_rotated_3d_axes.png`): two side-by-side built-in
  // double wardrobes backing onto the stairwell/landing cross-wall.
  // =========================================================================
  {
    const wardGroup = new THREE.Group();
    wardGroup.name = 'bedroom2.eastWardrobes';
    const startX = -16.876;
    const startZ = -2.469;
    const endX = -17.596;
    const endZ = 1.007;
    const dx = endX - startX;
    const dz = endZ - startZ;
    const wallLen = Math.hypot(dx, dz); // ~3.55m
    const angleY = -Math.atan2(dz, dx);
    wardGroup.position.set(startX, floorTopY, startZ);
    wardGroup.rotation.y = angleY;

    const wardH = upperWallTopY - floorTopY; // 2.00m full-height built-in
    const wardDepth = 0.62;
    const baySpan = wallLen - 0.13; // u = 0.08m .. 3.50m
    const uMid = 0.08 + baySpan / 2;

    // Main carcass box (recessed slightly from cross-wall West face)
    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan, wardH, wardDepth),
      wardrobeMat
    );
    carcass.position.set(uMid, wardH / 2, -(0.12 + wardDepth / 2));
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    wardGroup.add(carcass);

    // Central vertical dividing wall between the 2 built-in double wardrobes
    const centerDivider = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, wardH, wardDepth + 0.02),
      warmRoomPlasterMat
    );
    centerDivider.position.set(uMid, wardH / 2, -(0.12 + wardDepth / 2));
    wardGroup.add(centerDivider);

    // 4 Shaker wardrobe doors (2 pairs of double doors) on the West face (z = -0.74m in local frame)
    const doorW = (baySpan - 0.18) / 4;
    const doorLeafH = wardH - 0.24;
    for (let i = 0; i < 4; i++) {
      const doorU = 0.14 + doorW / 2 + i * (doorW + 0.02);
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW - 0.015, doorLeafH, 0.022),
        wardrobeMat
      );
      doorPanel.position.set(doorU, 0.12 + doorLeafH / 2, -(0.12 + wardDepth + 0.011));
      doorPanel.castShadow = true;
      wardGroup.add(doorPanel);

      // Brass knob on the inner meeting stiles of each pair (i=0 right, i=1 left, i=2 right, i=3 left)
      const isLeftLeaf = i % 2 === 0;
      const knobU = doorU + (isLeftLeaf ? doorW * 0.36 : -doorW * 0.36);
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 10, 10),
        brassMat
      );
      knob.position.set(knobU, 1.02, -(0.12 + wardDepth + 0.03));
      wardGroup.add(knob);
    }

    // Antique oak skirting plinth along the West face of the built-in wardrobes
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan + 0.02, 0.11, 0.028),
      antiqueOakSkirtingMat
    );
    plinth.position.set(uMid, 0.055, -(0.12 + wardDepth + 0.014));
    wardGroup.add(plinth);

    scene.add(wardGroup);
  }

  // South Partition Wall closing the South end of Bedroom 2's built-in wardrobes (`[-17.596, 1.007] -> [-18.23, 0.88]`)
  buildAngledWallSegment(scene, interactions, {
    start: [-17.596, 1.007],
    end: [-18.23, 0.88],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
  });

  // Bedroom 2 South-East Entrance Wall facing the `UP` Lobby (`[-18.23, 0.88] -> [-18.84, 2.353]`, length = 1.594m)
  // Contains `bedroom2Door` directly opposite the `UP` step-up portal from the Upper Landing!
  buildAngledWallSegment(scene, interactions, {
    start: [-18.23, 0.88],
    end: [-18.84, 2.353],
    thickness: 0.15,
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
        id: 'bedroom2Door',
        kind: 'hinged-door',
        uCenter: 0.82,
        width: 0.82,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'right',
        openAngle: Math.PI * 0.42,
        initialOpenProgress: 0.2,
      },
    ],
  });

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

  // South Wall of Bedroom 2 separating Bedroom 2 from Upstairs Shower Room (`[-22.19, 1.905] -> [-18.84, 2.353]`, 0.28m thick)
  // Includes:
  //   1. En-suite/Jack-and-Jill connecting door to Shower Room near West window (`uCenter = 0.48m, width = 0.72m`)
  //   2. Bedroom 2 South Chimney Breast (`uCenter = 1.95m`)
  const bed2SouthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 1.905],
    end: [-18.84, 2.353],
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
}
