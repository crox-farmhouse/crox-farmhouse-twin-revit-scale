import * as THREE from 'three';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
} from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 2 (`bedroom2`) above the Front Room (`livingRoom`).
 */
export function buildBedroom2(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'skirtingMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'doorH' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addShakerWardrobeDoor,
    addUpperBrickWallAlongZWithWindow,
    antiqueOakSkirtingMat,
    brassMat,
    doorH,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    tagUpperCutawayWall,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;

  const collarCeilingY = 4.52;

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
  // Note: for start=[-22.47, -3.359] -> end=[-16.858, -2.608], +normal (front) points SOUTH into Bedroom 2,
  // and -normal (back) points NORTH (exterior brick)!
  const bed2NorthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.47, -3.359],
    end: [-16.858, -2.608],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY, // +normal = South (Bedroom 2 interior at Y = 2.08m)
    backFloorY: 1.625,      // -normal = North (exterior brick above Living Room wall)
    wallMaterial: exteriorBrickMat,
    frontFaceMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    frontSkirtingExclusions: [
      [0, 0.28],
      [4.82, 5.67],
    ],
    addBackSkirting: false,
  });

  // Issue #6 & #10: Full-span coplanar vaulted upper gable extension on Bedroom 2 North Wall (Y = 4.16m..4.52m)
  {
    const northGableShape = new THREE.Shape();
    northGableShape.moveTo(0.28, upperWallTopY);
    northGableShape.lineTo(5.56, upperWallTopY);
    northGableShape.lineTo(3.75, collarCeilingY);
    northGableShape.lineTo(1.63, collarCeilingY);
    northGableShape.closePath();
    const northGableGeo = new THREE.ExtrudeGeometry(northGableShape, {
      depth: 0.294,
      bevelEnabled: false,
    });
    northGableGeo.translate(0, 0, -0.14);
    const northUpperGable = new THREE.Mesh(northGableGeo, warmRoomPlasterMat);
    northUpperGable.name = 'bedroom2.northWallUpperGable';
    northUpperGable.userData.isArchitecturalShell = true;
    northUpperGable.position.copy(bed2NorthWallFrame.toWorld(0, 0, 0));
    northUpperGable.rotation.y = bed2NorthWallFrame.rotationY;
    northUpperGable.castShadow = true;
    northUpperGable.receiveShadow = true;
    tagUpperCutawayWall(northUpperGable, {
      axis: 'z',
      coord: -2.98,
      minSpan: -22.47,
      maxSpan: -16.858,
      floor: 'first',
    });
    scene.add(northUpperGable);
  }

  // =========================================================================
  // TWO BUILT-IN SHAKER DOUBLE WARDROBES ALONG THE EAST CROSS-WALL OF BEDROOM 2
  // (`[-16.876, -2.469] -> [-17.57, +0.90]`, length = 3.36m, depth = 0.62m West `+Z_local` into Bedroom 2)
  // Issues #7 & #8: Authentic Shaker-framed wardrobe doors with aged-brass vertical bar pull handles
  // and a continuous 45°-mitred antique oak skirting board wrapping cleanly around the wardrobe plinth
  // and along the exposed East cross-wall!
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

    const wardH = upperWallTopY - floorTopY;
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

    // Upper vaulted bulkhead above the cornice so the built-in wardrobe meets the pitched East skeiling slope seamlessly
    const vaultBulkhead = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan, 0.18, wardDepth),
      warmRoomPlasterMat
    );
    vaultBulkhead.name = 'bedroom2.eastWardrobes.vaultBulkhead';
    vaultBulkhead.userData.isArchitecturalShell = true;
    vaultBulkhead.position.set(uMid, wardH + 0.09, 0.12 + wardDepth / 2);
    vaultBulkhead.castShadow = true;
    vaultBulkhead.receiveShadow = true;
    wardGroup.add(vaultBulkhead);

    // Moulded Shaker top cornice header across the front and South return of the wardrobes
    const cornice = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan + 0.06, 0.048, wardDepth + 0.036),
      wardrobeMat
    );
    cornice.name = 'bedroom2.eastWardrobes.cornice';
    cornice.position.set(uMid + 0.01, wardH - 0.024, 0.12 + wardDepth / 2 + 0.014);
    cornice.castShadow = true;
    wardGroup.add(cornice);

    // Central vertical dividing stile between the 2 built-in double wardrobes
    const centerDivider = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, wardH, wardDepth + 0.02),
      wardrobeMat
    );
    centerDivider.position.set(uMid, wardH / 2, 0.12 + wardDepth / 2);
    wardGroup.add(centerDivider);

    // South end return wall closing the South side of the built-in wardrobes at u = 3.40m (rising into the East skeiling)
    const southEndPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, wardH + 0.18, wardDepth + 0.02),
      warmRoomPlasterMat
    );
    southEndPanel.userData.isArchitecturalShell = true;
    southEndPanel.position.set(0.08 + baySpan, (wardH + 0.18) / 2, 0.12 + wardDepth / 2);
    southEndPanel.castShadow = true;
    southEndPanel.receiveShadow = true;
    wardGroup.add(southEndPanel);

    // 4 Shaker wardrobe doors (2 pairs of double doors) with recessed panels, stiles/rails & vertical brass bar handles (Issue #8)
    const doorW = (baySpan - 0.18) / 4;
    const doorLeafH = wardH - 0.24;
    for (let i = 0; i < 4; i++) {
      const doorU = 0.14 + doorW / 2 + i * (doorW + 0.02);
      addShakerWardrobeDoor(wardGroup, {
        x: doorU,
        y: 0.15 + doorLeafH / 2,
        z: 0.12 + wardDepth + 0.013,
        width: doorW - 0.012,
        height: doorLeafH,
        alongZ: false,
        normalSign: 1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `bedroom2.eastWardrobes.door_${i + 1}`,
      });
    }

    // Issue #7: Continuous 45°-mitred antique oak skirting board wrapping the wardrobe front face,
    // turning 90° along the South return panel, and continuing along the exposed East cross-wall up to the South wall!
    const wardMitredSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [0.14, 0.12 + wardDepth],
          [0.08 + baySpan + 0.04, 0.12 + wardDepth],
          [0.08 + baySpan + 0.04, 0.12],
          [4.77, 0.12],
        ],
        0
      ),
      antiqueOakSkirtingMat
    );
    wardMitredSkirt.name = 'bedroom2.eastWardrobes.mitredSkirting';
    wardMitredSkirt.userData.isArchitecturalShell = true;
    wardMitredSkirt.castShadow = true;
    wardMitredSkirt.receiveShadow = true;
    wardGroup.add(wardMitredSkirt);

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
    2,
    { skirtingMin: -3.04, skirtingMax: 1.765 }
  );

  // Continuous Straight Angled South Wall of Bedroom 2 (`[-22.19, 1.905] -> [-17.891, 2.48]`, 0.28m thick)
  // Directly above the Ground Floor Living Room / Entrance Hallway straight wall!
  // Includes:
  //   1. En-suite connecting door to Shower Room near West window (`uCenter = 0.48m, width = 0.72m`)
  //   2. Bedroom 2 South Chimney Breast (`uCenter = 1.95m`)
  //   3. Main Bedroom 2 entrance door from West Wing Corridor (`uCenter = 3.86m, width = 0.72m`)
  const bed2SouthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 1.905],
    end: [-17.891, 2.48],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    frontSkirtingExclusions: [
      [0, 0.14],
      [3.28, 3.45], // Omit skirting at Shower Room entrance wall T-junction
    ],
    addBackSkirting: true,
    backSkirtingExclusions: [
      [0, 0.14],
      [1.33, 2.57], // Omit skirting behind Bedroom 2 South Chimney Breast
    ],
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
        uCenter: 3.86,
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

  // Issue #6 & #10: Full-span coplanar vaulted upper gable extension on Bedroom 2 South Wall (Y = 4.16m..4.52m)
  {
    const uLen = bed2SouthWallFrame.length; // 4.3373m
    const uCollarWest = 1.35; // X = -20.85m
    const uCollarEast = 3.47; // X = -18.75m
    const southGableShape = new THREE.Shape();
    southGableShape.moveTo(0, upperWallTopY);
    southGableShape.lineTo(uLen, upperWallTopY);
    southGableShape.lineTo(uCollarEast, collarCeilingY);
    southGableShape.lineTo(uCollarWest, collarCeilingY);
    southGableShape.closePath();
    const southGableGeo = new THREE.ExtrudeGeometry(southGableShape, {
      depth: 0.28,
      bevelEnabled: false,
    });
    southGableGeo.translate(0, 0, -0.14);
    const southUpperGable = new THREE.Mesh(southGableGeo, warmRoomPlasterMat);
    southUpperGable.name = 'bedroom2.southWallUpperGable';
    southUpperGable.userData.isArchitecturalShell = true;
    southUpperGable.position.copy(bed2SouthWallFrame.toWorld(0, 0, 0));
    southUpperGable.rotation.y = bed2SouthWallFrame.rotationY;
    southUpperGable.castShadow = true;
    southUpperGable.receiveShadow = true;
    scene.add(southUpperGable);

    // Clean 3-piece cutaway cap along the top vaulted profile of the South wall
    const gableCapGroup = bed2SouthWallFrame.createGroup(
      scene,
      'bedroom2.southWallUpperGable.cap',
      0,
      0,
      0
    );
    gableCapGroup.userData.isArchitecturalShell = true;
    for (const [u0, y0, u1, y1] of [
      [0, upperWallTopY, uCollarWest, collarCeilingY],
      [uCollarWest, collarCeilingY, uCollarEast, collarCeilingY],
      [uCollarEast, collarCeilingY, uLen, upperWallTopY],
    ] as const) {
      const segLen = Math.hypot(u1 - u0, y1 - y0);
      const segAngle = Math.atan2(y1 - y0, u1 - u0);
      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.008, 0.025, 0.284),
        wallCapMat
      );
      capMesh.userData.isArchitecturalShell = true;
      capMesh.position.set((u0 + u1) / 2, (y0 + y1) / 2 + 0.012, 0);
      capMesh.rotation.z = segAngle;
      gableCapGroup.add(capMesh);
    }
  }

  // Bedroom 2 South Chimney Breast (centered at u = 1.95m along bed2SouthWallFrame, rising to partially vaulted collarCeilingY = 4.52m)
  const bed2ChimneyGroup = bed2SouthWallFrame.createGroup(
    scene,
    'bedroom2.southChimneyBreast',
    1.95,
    0,
    -0.35
  );
  bed2ChimneyGroup.userData.isArchitecturalShell = true;
  const bed2ChimneyBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, collarCeilingY - floorTopY, 0.42),
    warmRoomPlasterMat
  );
  bed2ChimneyBody.userData.isArchitecturalShell = true;
  bed2ChimneyBody.position.set(0, (floorTopY + collarCeilingY) / 2, 0);
  bed2ChimneyBody.castShadow = true;
  bed2ChimneyBody.receiveShadow = true;
  bed2ChimneyGroup.add(bed2ChimneyBody);

  const bed2ChimneyCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.244, 0.025, 0.424),
    wallCapMat
  );
  bed2ChimneyCap.userData.isArchitecturalShell = true;
  bed2ChimneyCap.position.set(0, collarCeilingY + 0.012, 0);
  bed2ChimneyGroup.add(bed2ChimneyCap);

  // Issue #7: 3-sided 45°-mitred antique oak skirting board wrapping cleanly around Bedroom 2 South Chimney Breast
  const bed2ChimneyMitredSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [0.62, 0.21],
        [0.62, -0.21],
        [-0.62, -0.21],
        [-0.62, 0.21],
      ],
      floorTopY
    ),
    antiqueOakSkirtingMat
  );
  bed2ChimneyMitredSkirt.name = 'bedroom2.southChimneyBreast.mitredSkirting';
  bed2ChimneyMitredSkirt.userData.isArchitecturalShell = true;
  bed2ChimneyMitredSkirt.castShadow = true;
  bed2ChimneyMitredSkirt.receiveShadow = true;
  bed2ChimneyGroup.add(bed2ChimneyMitredSkirt);
}
