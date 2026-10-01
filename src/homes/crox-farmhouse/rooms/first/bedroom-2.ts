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
    frontFaceMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Issue #1: Continuous 45°-mitred skirting `bedroom2.northEastAndCutoutMitredSkirting` joins North wall & East wardrobes seamlessly
    addBackSkirting: false,
  });

  // Issue #2, #5, #6, #7, #8 & #10: High Vaulted Upper Gable Extension on Bedroom 2 North Wall (`Y = 4.16m..5.02m`)
  {
    const northGableShape = new THREE.Shape();
    northGableShape.moveTo(0.24, upperWallTopY - 0.02);
    northGableShape.lineTo(5.45, upperWallTopY - 0.02);
    northGableShape.lineTo(5.32, upperWallTopY + 0.02);
    northGableShape.lineTo(4.24, collarCeilingY + 0.02);
    northGableShape.lineTo(1.53, collarCeilingY + 0.02);
    northGableShape.lineTo(0.24, upperWallTopY + 0.02);
    northGableShape.closePath();
    const northGableGeo = new THREE.ExtrudeGeometry(northGableShape, {
      depth: 0.305,
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
  // THREE BUILT-IN SHAKER DOUBLE WARDROBES (6 CEILING-HEIGHT DOORS) ALONG THE EAST CROSS-WALL OF BEDROOM 2
  // (`[-17.200, -2.419] -> [-18.253, +2.664]`, depth = 0.56m West `+Z_local` into Bedroom 2)
  // Issues #1, #6 & #7 ("Smaller doors and more of them (6 doors)", "Wardrobe doors to the ceiling"):
  // Because `bedroom2.vaultedCeiling.eastSkeiling` is parallel to the East cross-wall, the ceiling height along
  // the front face (`frontLocalZ = 0.68m`) is a uniform `Y = 4.756m` (`localY = 2.676m`), allowing all 6 Shaker
  // wardrobe doors, vertical dividing stiles, and top cornice to rise right up to the vaulted ceiling!
  // =========================================================================
  {
    const wardGroup = new THREE.Group();
    wardGroup.name = 'bedroom2.eastWardrobes';
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
    const wardFrontTopH = 2.676; // Exact height of planar eastSkeiling at frontLocalZ = 0.68m (world Y = 4.756m)
    const uStart = -0.045; // Meets South interior plaster face of bed2NorthWallFrame with zero gap (Issue #1)
    const uEnd = 3.608;    // Lands at Z = 0.975m North face of cut-out hallway wall
    const baySpan = uEnd - uStart; // 3.653m
    const uMid = (uStart + uEnd) / 2;

    // Unified full-height vaulted Shaker wardrobe carcass (`u = -0.12m..uEnd`) rising all the way to `eastSkeiling`
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(0.12, 0);
    carcassShape.lineTo(frontLocalZ, 0);
    carcassShape.lineTo(frontLocalZ, wardFrontTopH + 0.015);
    carcassShape.lineTo(0.12, wardEavesH + 0.02);
    carcassShape.closePath();
    const carcassSpanU = uEnd - -0.12;
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: carcassSpanU,
      bevelEnabled: false,
    });
    carcassGeo.rotateY(Math.PI / 2);
    carcassGeo.translate(-0.12, 0, 0);
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom2.eastWardrobes.carcass';
    carcass.userData.isArchitecturalShell = true;
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    wardGroup.add(carcass);

    // Moulded Shaker top cornice header right under the vaulted ceiling line (`localY = wardFrontTopH - 0.024m`)
    const cornice = new THREE.Mesh(
      new THREE.BoxGeometry(baySpan + 0.04, 0.048, 0.044),
      wardrobeMat
    );
    cornice.name = 'bedroom2.eastWardrobes.cornice';
    cornice.position.set(uMid, wardFrontTopH - 0.024, frontLocalZ + 0.01);
    cornice.castShadow = true;
    wardGroup.add(cornice);

    // 2 vertical dividing stiles separating the 3 double-door wardrobe bays right up to the ceiling cornice
    for (const bayIdx of [1, 2] as const) {
      const stileU = uStart + (baySpan * bayIdx) / 3;
      const divider = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, wardFrontTopH, 0.028),
        wardrobeMat
      );
      divider.position.set(stileU, wardFrontTopH / 2, frontLocalZ + 0.004);
      wardGroup.add(divider);
    }

    // Issue #6 & #7: 6 ceiling-height Shaker wardrobe doors (3 pairs of double doors) rising right up to the ceiling cornice
    const numDoors = 6;
    const doorInset = 0.08;
    const doorStep = (baySpan - doorInset * 2) / numDoors;
    const doorLeafW = doorStep - 0.014;
    const doorLeafH = wardFrontTopH - 0.15 - 0.048; // 2.478m (reaches right to the underside of the ceiling cornice!)
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
      [1.26, 3.31], // East of the chimney breast (`u = 2.38m..3.22m`), `bedroom2.southPierMitredSkirting` provides a continuous 45°-mitred corner into the X = -18.995m wall!
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
          [-19.835, 2.081],
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
    southGableShape.moveTo(0, upperWallTopY - 0.02);
    southGableShape.lineTo(uLen, upperWallTopY - 0.02);
    southGableShape.lineTo(uLen, collarCeilingY + 0.02);
    southGableShape.lineTo(uCollarWest, collarCeilingY + 0.02);
    southGableShape.lineTo(0, upperWallTopY + 0.015);
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

    // Upper gable strip (`Y = 4.14m..5.04m`) along the X = -18.92m cut-out wall (`Z = 0.975m..2.34m`) under the East edge of the 5.02m collar ceiling
    const cutoutWestSpanZ = 2.34 - 0.975;
    const cutoutWestGable = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, collarCeilingY - upperWallTopY + 0.04, cutoutWestSpanZ),
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

    // Triangular upper gable (`Y = 5.02m` at X = -18.995m..-18.92m tapering to `Y = 4.16m` at X = -17.918m, the exact East cross-wall at Z = 1.05m — Issue #8!)
    const cutoutNorthLen = -17.918 - -18.995; // 1.077m
    const cutoutNorthShape = new THREE.Shape();
    cutoutNorthShape.moveTo(0, upperWallTopY - 0.02);
    cutoutNorthShape.lineTo(cutoutNorthLen, upperWallTopY - 0.02);
    cutoutNorthShape.lineTo(cutoutNorthLen, upperWallTopY + 0.015);
    cutoutNorthShape.lineTo(0.075, collarCeilingY + 0.02);
    cutoutNorthShape.lineTo(0, collarCeilingY + 0.02);
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

  // Bedroom 2 South Chimney Breast (centered at u = 1.82m along bed2SouthWallFrame right next to bedroom2EnsuiteDoor, rising to collarCeilingY = 5.02m)
  const bed2ChimneyGroup = bed2SouthWallFrame.createGroup(
    scene,
    'bedroom2.southChimneyBreast',
    1.82,
    0,
    -0.35
  );
  bed2ChimneyGroup.userData.isArchitecturalShell = true;
  const bed2ChimneyBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, collarCeilingY - floorTopY, 0.42),
    warmRoomPlasterMat
  );
  bed2ChimneyBody.userData.isArchitecturalShell = true;
  bed2ChimneyBody.position.set(0, (floorTopY + collarCeilingY) / 2, 0);
  bed2ChimneyBody.castShadow = true;
  bed2ChimneyBody.receiveShadow = true;
  bed2ChimneyGroup.add(bed2ChimneyBody);

  const bed2ChimneyCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.124, 0.025, 0.424),
    wallCapMat
  );
  bed2ChimneyCap.userData.isArchitecturalShell = true;
  bed2ChimneyCap.position.set(0, collarCeilingY + 0.012, 0);
  bed2ChimneyGroup.add(bed2ChimneyCap);

  // Issue #7: 3-sided 45°-mitred antique oak skirting board wrapping cleanly around Bedroom 2 South Chimney Breast
  const bed2ChimneyMitredSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [0.56, 0.21],
        [0.56, -0.21],
        [-0.56, -0.21],
        [-0.56, 0.21],
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
