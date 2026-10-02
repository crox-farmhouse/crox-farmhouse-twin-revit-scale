import * as THREE from 'three';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
} from '../../../../engine/geometry/index.ts';
import { transformEastWingTuple } from '../../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 2 (`bedroom2`) above the Front Room (`livingRoom`).
 */
export function buildBedroom2(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'skirtingMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addShakerWardrobeDoor' | 'addUpperBedroomChimneyBreastWithFireplace' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'doorH' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addShakerWardrobeDoor,
    addUpperBedroomChimneyBreastWithFireplace,
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

  const collarCeilingY = 5.02;

  // =========================================================================
  // 4. BEDROOM 2 (Non-square polygon directly above the Front Room, with SE hallway cut-out)
  //    X = -22.19m..-16.876m/-18.92m, Z = -3.18m/-2.469m..+1.905m/+2.34m
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, -3.18],
      [-16.876, -2.469],
      [-17.65, 1.05],
      [-18.92, 1.05],
      [-18.92, 2.34],
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
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Issue #1: Continuous 45°-mitred skirting `bedroom2.northEastAndCutoutMitredSkirting` joins North wall & East wardrobes seamlessly
    addBackSkirting: false,
  });

  // Issue #3: Single one-piece full-height vaulted interior plaster wall (`Y = 2.08m..5.02m`, `z_local = +0.14m..+0.154m`)
  // + exterior brick gable (`Y = 4.16m..5.02m`, `z_local = -0.14m..+0.14m`) so Bedroom 2's North wall is 100% seamless with zero split at Y = 4.16m!
  {
    const northCutawayDesc = {
      axis: 'z' as const,
      coord: -2.98,
      minSpan: -22.47,
      maxSpan: -16.858,
      floor: 'first' as const,
    };

    const northBrickGableShape = new THREE.Shape();
    northBrickGableShape.moveTo(0.28, upperWallTopY);
    northBrickGableShape.lineTo(5.63, upperWallTopY);
    northBrickGableShape.lineTo(4.35, collarCeilingY);
    northBrickGableShape.lineTo(1.53, collarCeilingY);
    northBrickGableShape.closePath();
    const northBrickGableGeo = new THREE.ExtrudeGeometry(northBrickGableShape, {
      depth: 0.28,
      bevelEnabled: false,
    });
    northBrickGableGeo.translate(0, 0, -0.14);
    const northBrickGable = new THREE.Mesh(northBrickGableGeo, exteriorBrickMat);
    northBrickGable.name = 'bedroom2.northWallBrickGable';
    northBrickGable.userData.isArchitecturalShell = true;
    northBrickGable.position.copy(bed2NorthWallFrame.toWorld(0, 0, 0));
    northBrickGable.rotation.y = bed2NorthWallFrame.rotationY;
    northBrickGable.castShadow = true;
    northBrickGable.receiveShadow = true;
    tagUpperCutawayWall(northBrickGable, northCutawayDesc);
    scene.add(northBrickGable);

    const northPlasterShape = new THREE.Shape();
    northPlasterShape.moveTo(0.28, floorTopY);
    northPlasterShape.lineTo(5.63, floorTopY);
    northPlasterShape.lineTo(5.63, upperWallTopY);
    northPlasterShape.lineTo(4.35, collarCeilingY);
    northPlasterShape.lineTo(1.53, collarCeilingY);
    northPlasterShape.lineTo(0.28, upperWallTopY);
    northPlasterShape.closePath();
    const northPlasterGeo = new THREE.ExtrudeGeometry(northPlasterShape, {
      depth: 0.014,
      bevelEnabled: false,
    });
    northPlasterGeo.translate(0, 0, 0.14);
    const northUpperGable = new THREE.Mesh(northPlasterGeo, warmRoomPlasterMat);
    northUpperGable.name = 'bedroom2.northWallUpperGable';
    northUpperGable.userData.isArchitecturalShell = true;
    northUpperGable.position.copy(bed2NorthWallFrame.toWorld(0, 0, 0));
    northUpperGable.rotation.y = bed2NorthWallFrame.rotationY;
    northUpperGable.castShadow = true;
    northUpperGable.receiveShadow = true;
    tagUpperCutawayWall(northUpperGable, northCutawayDesc);
    scene.add(northUpperGable);
  }

  // =========================================================================
  // THREE BUILT-IN SHAKER DOUBLE WARDROBES (6 CEILING-HEIGHT DOORS) ALONG THE EAST CROSS-WALL OF BEDROOM 2
  // (`[-16.876, -2.469] -> [-17.930, +2.616]`, depth = 0.56m West `+Z_local` into Bedroom 2)
  // Issues #1, #4, #6 & #7 ("Smaller doors and more of them (6 doors)", "top of the wardrope doors look clipped off by the ceiling"):
  // Because `bedroom2.vaultedCeiling.eastSkeiling` is parallel to the East cross-wall (`Y = 4.16m` at cross-wall pitching up to `Y = 5.02m`),
  // the ceiling height along the front face (`frontLocalZ = 0.68m`) is a uniform `Y = 4.600m` (`localY = 2.520m`), allowing all 6 Shaker
  // wardrobe doors, vertical dividing stiles, and raked top cornice to meet the vaulted ceiling cleanly without clipping!
  // =========================================================================
  {
    const wardGroup = new THREE.Group();
    wardGroup.name = 'bedroom2.eastWardrobes';
    wardGroup.userData.zone = 'bedroom2';
    const [startX, , startZ] = transformEastWingTuple(-17.55, 0, -2.5);
    const [endX, , endZ] = transformEastWingTuple(-17.92, 0, 2.68);
    const dx = endX - startX;
    const dz = endZ - startZ;
    const wallLen = Math.hypot(dx, dz);
    const ux = dx / wallLen;
    const uz = dz / wallLen;
    const nx = -uz; // points West into Bedroom 2
    const nz = ux;
    const angleY = -Math.atan2(dz, dx);
    wardGroup.position.set(startX, floorTopY, startZ);
    wardGroup.rotation.y = angleY;

    const wardEavesH = upperWallTopY - floorTopY; // 2.08m at cross-wall (localZ = 0.12m)
    const wardDepth = 0.56;
    const frontLocalZ = 0.12 + wardDepth; // 0.68m from cross-wall centreline
    const wardFrontTopH = 2.518; // Exact height of planar eastSkeiling at frontLocalZ = 0.68m (world Y = 4.598m — Issue #4!)
    const uStart = -0.045; // Meets South interior plaster face of bed2NorthWallFrame with zero gap (Issue #1)
    const uEnd = 3.608;    // Lands at Z = 0.975m North face of cut-out hallway wall
    const baySpan = uEnd - uStart; // 3.653m

    // Unified full-height vaulted Shaker wardrobe carcass (`u = uStart..uEnd`, `z_local = +0.12m..+frontLocalZ` West into Bedroom 2)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(-frontLocalZ, 0);
    carcassShape.lineTo(-0.12, 0);
    carcassShape.lineTo(-0.12, wardEavesH);
    carcassShape.lineTo(-frontLocalZ, wardFrontTopH);
    carcassShape.closePath();
    const carcassSpanU = uEnd - uStart;
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: carcassSpanU,
      bevelEnabled: false,
    });
    carcassGeo.rotateY(Math.PI / 2);
    carcassGeo.translate(uStart, 0, 0);
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom2.eastWardrobes.carcass';
    carcass.userData.isArchitecturalShell = true;
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    wardGroup.add(carcass);

    // Moulded Shaker top cornice header with raked top edge matching `eastSkeiling` right above the doors (`localY = wardFrontTopH - 0.048m .. wardFrontTopH`)
    const corniceShape = new THREE.Shape();
    corniceShape.moveTo(-(frontLocalZ + 0.032), wardFrontTopH - 0.048);
    corniceShape.lineTo(-frontLocalZ, wardFrontTopH - 0.048);
    corniceShape.lineTo(-frontLocalZ, wardFrontTopH);
    corniceShape.lineTo(-(frontLocalZ + 0.032), wardFrontTopH + 0.024);
    corniceShape.closePath();
    const corniceGeo = new THREE.ExtrudeGeometry(corniceShape, {
      depth: baySpan,
      bevelEnabled: false,
    });
    corniceGeo.rotateY(Math.PI / 2);
    corniceGeo.translate(uStart, 0, 0);
    const cornice = new THREE.Mesh(corniceGeo, wardrobeMat);
    cornice.name = 'bedroom2.eastWardrobes.cornice';
    cornice.castShadow = true;
    cornice.receiveShadow = true;
    wardGroup.add(cornice);

    // 2 vertical dividing stiles separating the 3 double-door wardrobe bays right up to the ceiling cornice
    for (const bayIdx of [1, 2] as const) {
      const stileU = uStart + (baySpan * bayIdx) / 3;
      const divider = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, wardFrontTopH - 0.048, 0.028),
        wardrobeMat
      );
      divider.position.set(stileU, (wardFrontTopH - 0.048) / 2, frontLocalZ + 0.004);
      wardGroup.add(divider);
    }

    // Issue #4, #6 & #7: 6 ceiling-height Shaker wardrobe doors (3 pairs of double doors) rising cleanly to the underside of the ceiling cornice
    const numDoors = 6;
    const doorInset = 0.08;
    const doorStep = (baySpan - doorInset * 2) / numDoors;
    const doorLeafW = doorStep - 0.014;
    const doorLeafH = wardFrontTopH - 0.15 - 0.048; // 2.320m (top of doors at world Y = 4.550m, right below the cornice!)
    for (let i = 0; i < numDoors; i++) {
      const doorU = uStart + doorInset + doorStep * (i + 0.5);
      addShakerWardrobeDoor(wardGroup, {
        x: doorU,
        y: 0.15 + doorLeafH / 2,
        z: frontLocalZ + 0.013,
        width: doorLeafW,
        height: doorLeafH,
        alongZ: false,
        normalSign: 1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `bedroom2.eastWardrobes.door_${i + 1}`,
      });
    }

    scene.add(wardGroup);

    // Issue #3: Exact intersection of the North wall South plaster face (`v = +0.1535m`) with the East wardrobe front face (`frontLocalZ = 0.68m`)
    const uSkirtStart = 0.063;
    const neCornerX = startX + uSkirtStart * ux + frontLocalZ * nx;
    const neCornerZ = startZ + uSkirtStart * uz + frontLocalZ * nz;
    const seCornerX = startX + uEnd * ux + frontLocalZ * nx;
    const seCornerZ = startZ + uEnd * uz + frontLocalZ * nz;

    // Issues #1, #3 & #6: Single continuous 45°-mitred antique oak skirting board along the Bedroom 2 North Wall (`[-22.19, -3.165]`),
    // turning seamlessly at the NE corner (`[neCornerX, neCornerZ]`), running South along the 6-door East Wardrobe
    // plinth to `[seCornerX, seCornerZ]`, turning West along the North cut-out hallway wall (`Z = 0.975m`),
    // and turning South along `X = -18.995m` up to the North architrave of `bedroom2Door`!
    const northEastAndCutoutSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-22.19, -3.165],
          [neCornerX, neCornerZ],
          [seCornerX, seCornerZ],
          [-18.995, 0.975],
          [-18.995, 1.233],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    northEastAndCutoutSkirt.name = 'bedroom2.northEastAndCutoutMitredSkirting';
    northEastAndCutoutSkirt.userData.isArchitecturalShell = true;
    northEastAndCutoutSkirt.castShadow = true;
    northEastAndCutoutSkirt.receiveShadow = true;
    scene.add(northEastAndCutoutSkirt);
  }

  // West Front Exterior Brick Wall of Bedroom 2 (X = -22.47m..-22.19m, Z = -3.18m..+1.905m)
  // With 2-pane Georgian casement window centered at Z = -0.26m (directly above the Front Room bay window — Photo 2!)
  // Issue #5: Extend skirtingMin to -3.165m so the West wall skirting meets the North wall mitred skirting in the NW corner!
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
    { skirtingMin: -3.165, skirtingMax: 1.766 }
  );

  // Straight Angled South Wall of Bedroom 2 (`[-22.19, 1.905] -> [-18.92, 2.34]`, 0.28m thick)
  // Terminates at the T-junction pier (`X = -18.92m, Z = 2.34m`) between `bedroom2Door` and `showerRoomDoor`!
  // Includes:
  //   1. En-suite connecting door to Shower Room near West window (`uCenter = 0.48m, width = 0.72m`)
  //   2. Bedroom 2 South Chimney Breast (`uCenter = 1.82m, width = 1.12m`), leaving clear wall East of the chimney breast!
  const bed2SouthWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 1.905],
    end: [-18.92, 2.34],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Issue #12: Shower Room North face East of bedroom2EnsuiteDoor uses continuous 45°-mitred skirting in west-wing-corridor.ts
    addBackSkirting: true,
    backSkirtingExclusions: [
      [0, 0.14],
      [1.09, 3.31], // East of the chimney breast (`u = 2.29m..3.22m`), `bedroom2.southPierMitredSkirting` provides a continuous 45°-mitred corner into the X = -18.995m wall!
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
    ],
  });

  // Continuous 45°-mitred antique oak skirting on the South-East pier between `bedroom2Door` and `bed2SouthWallFrame`
  {
    const southPierSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-18.995, 2.117],
          [-18.995, 2.193],
          [-19.901, 2.072],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    southPierSkirt.name = 'bedroom2.southPierMitredSkirting';
    southPierSkirt.userData.isArchitecturalShell = true;
    southPierSkirt.castShadow = true;
    southPierSkirt.receiveShadow = true;
    scene.add(southPierSkirt);
  }

  // Issues #2, #6, #7, #8 & #10: High Vaulted Upper Gable Extensions on Bedroom 2 South Wall & SE Hallway Cut-Out Walls (`Y = 4.16m..5.02m`)
  // Aligned 100% with `bedroom2.vaultedCeiling` (`westSkeiling` starting at X = -22.19m, Y = 4.16m -> X = -20.95m, Y = 5.02m,
  // `collar` across X = -20.95m..-18.92m at Y = 5.02m, and `eastSkeiling` pitching from X = -18.92m, Y = 5.02m to X = -17.918m, Y = 4.16m at Z = 1.05m)!
  {
    const uLen = bed2SouthWallFrame.length; // 3.299m (X = -22.19m .. -18.92m)
    const uCollarWest = 1.251; // Exact u along bed2SouthWallFrame where X = -20.95m
    const southGableShape = new THREE.Shape();
    southGableShape.moveTo(0, upperWallTopY);
    southGableShape.lineTo(uLen, upperWallTopY);
    southGableShape.lineTo(uLen, collarCeilingY);
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

    // Upper gable strip (`Y = 4.16m..5.02m`) along the X = -18.92m cut-out wall (`Z = 0.975m..2.34m`) under the East edge of the 5.02m collar ceiling
    const cutoutWestSpanZ = 2.34 - 0.975;
    const cutoutWestGable = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, collarCeilingY - upperWallTopY, cutoutWestSpanZ),
      warmRoomPlasterMat
    );
    cutoutWestGable.name = 'bedroom2.cutoutWestWallUpperGable';
    cutoutWestGable.userData.isArchitecturalShell = true;
    cutoutWestGable.position.set(
      -18.92,
      (upperWallTopY + collarCeilingY) / 2,
      (0.975 + 2.34) / 2
    );
    cutoutWestGable.castShadow = true;
    cutoutWestGable.receiveShadow = true;
    scene.add(cutoutWestGable);

    // Triangular upper gable (`Y = 5.02m` at X = -18.995m..-18.92m tapering to `Y = 4.16m` at X = -17.625m, the exact East cross-wall at Z = 1.05m — Issue #4 & #8!)
    const cutoutNorthLen = -17.625 - -18.995; // 1.370m
    const cutoutNorthShape = new THREE.Shape();
    cutoutNorthShape.moveTo(0, upperWallTopY);
    cutoutNorthShape.lineTo(cutoutNorthLen, upperWallTopY);
    cutoutNorthShape.lineTo(0.075, collarCeilingY);
    cutoutNorthShape.lineTo(0, collarCeilingY);
    cutoutNorthShape.closePath();
    const cutoutNorthGeo = new THREE.ExtrudeGeometry(cutoutNorthShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    cutoutNorthGeo.translate(0, 0, -0.075);
    const cutoutNorthGable = new THREE.Mesh(cutoutNorthGeo, warmRoomPlasterMat);
    cutoutNorthGable.name = 'bedroom2.cutoutNorthWallUpperGable';
    cutoutNorthGable.userData.isArchitecturalShell = true;
    cutoutNorthGable.position.set(-18.995, 0, 1.05);
    cutoutNorthGable.castShadow = true;
    cutoutNorthGable.receiveShadow = true;
    scene.add(cutoutNorthGable);
  }

  // Issue #1 & #2: Bedroom 2 South Chimney Breast (centered at u = 1.69m, width = 1.20m, depth = 0.44m along bed2SouthWallFrame,
  // matching the Living Room chimney breast directly downstairs 100%, with compact 1800s black cast-iron fireplace & small black hearth!)
  const bed2ChimneyGroup = bed2SouthWallFrame.createGroup(
    scene,
    'bedroom2.southChimneyBreast',
    1.69,
    0,
    -0.36
  );
  bed2ChimneyGroup.userData.isArchitecturalShell = true;
  addUpperBedroomChimneyBreastWithFireplace(bed2ChimneyGroup, {
    namePrefix: 'bedroom2.southChimneyBreast',
    zone: 'bedroom2',
    x: 0,
    z: 0,
    width: 1.2,
    depth: 0.44,
    floorY: floorTopY,
    topY: collarCeilingY,
  });

  // Issue #2 & #7: 45°-mitred antique oak skirting boards wrapping Bedroom 2 South Chimney Breast and terminating cleanly against the ±0.28m black fireplace jambs
  for (const [skirtName, path] of [
    [
      'bedroom2.southChimneyBreast.eastMitredSkirting',
      [
        [0.6, 0.22],
        [0.6, -0.22],
        [0.28, -0.22],
      ] as const,
    ],
    [
      'bedroom2.southChimneyBreast.westMitredSkirting',
      [
        [-0.28, -0.22],
        [-0.6, -0.22],
        [-0.6, 0.22],
      ] as const,
    ],
  ] as const) {
    const skirtMesh = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(path, floorTopY),
      antiqueOakSkirtingMat
    );
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    bed2ChimneyGroup.add(skirtMesh);
  }
}
