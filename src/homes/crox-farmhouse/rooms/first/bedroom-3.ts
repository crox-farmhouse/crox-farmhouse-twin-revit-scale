import * as THREE from 'three';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
} from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 3 (`bedroom3`).
 */
export function buildBedroom3(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'floorTopY' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongZWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
    brassMat,
    doorH,
    floorTopY,
    oakFloorMat,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 6. BEDROOM 3 (4.00m x 3.85m / 13'1" x 12'8")
  //    Directly above Sitting Room: X = -18.40m..-22.19m, Z = +4.85m..+8.15m
  //    + NW Wardrobe Alcove: X = -22.19m..-20.25m, Z = +4.10m..+4.85m (Issue #14!)
  // =========================================================================
  addFirstFloorSlab(-22.33, -18.4, 4.85, 8.27, oakFloorMat);
  addFirstFloorSlab(-22.33, -20.25, 4.1, 4.85, oakFloorMat);

  // West Front Exterior Brick Wall of Bedroom 3 (X = -22.47m..-22.19m, Z = +4.85m..+8.39m)
  // With 2-pane Georgian casement window centered at Z = +6.38m (directly above Sitting Room bay — Photo 2!)
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    4.85,
    8.39,
    6.38,
    1.35,
    2.92,
    3.94,
    'east',
    2,
    { skirtingMin: 4.73, skirtingMax: 8.15 }
  );

  // Single Continuous West Corridor Partition Wall (`X = -18.40m, Z = +4.025m..+8.15m`, 0.15m thick)
  // Issues #3, #4, #6, #7 & #15: Runs in ONE single unbroken straight wall from the North corner of the Walk-In Shower
  // (`Z = +4.025m`) all the way South to the Bedroom 4 cross-wall (`Z = +8.15m`), with `bedroom3Door` at Z = +7.42m!
  buildAngledWallSegment(scene, interactions, {
    start: [-18.4, 4.025],
    end: [-18.4, 8.15],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCapRanges: [[0.825, 4.125]],
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // West (`-X`) face inside Bedroom 3 uses continuous 45°-mitred skirtings `bedroom3.northWallMitredSkirting` & `bedroom3.southWallMitredSkirting`
    addBackSkirting: false,  // East (`+X`) face inside Corridor uses 45°-mitred continuous skirting below
    openings: [
      {
        id: 'bedroom3Door',
        kind: 'hinged-door',
        uCenter: 3.395, // Z = +7.42m
        width: 0.84,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'left',
        openAngle: -Math.PI * 0.48,
        initialOpenProgress: 0.2,
      },
    ],
  });

  // Issues #3, #4, #6, #7 & #8: Continuous 45°-mitred skirting along the West & North walls of the Corridor & Cut-Out Hallway
  for (const [skirtName, path] of [
    [
      'westWingCorridor.westWallMainMitredSkirting',
      [
        [-18.325, 6.918],
        [-18.325, 4.025],
        [-18.845, 4.025],
        [-18.845, 3.742],
      ] as const,
    ],
    [
      'westWingCorridor.westWallSouthPierSkirting',
      [
        [-18.325, 8.15],
        [-18.325, 7.922],
      ] as const,
    ],
    [
      'westWingCorridor.upLobbyNorthPierSkirting',
      [
        [-18.845, 2.898],
        [-18.845, 2.117],
      ] as const,
    ],
    [
      'westWingCorridor.cutoutNorthCornerSkirting',
      [
        [-18.845, 1.233],
        [-18.845, 1.125],
        [-17.755, 1.125],
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
    scene.add(skirtMesh);
  }

  const collarCeilingY = 4.52;

  // South Chimney Breast in Bedroom 3 (X = -19.85m, Z = +7.925m, rising to Bedroom 3's 4.52m vaulted collar ceiling — Issue #15!)
  addUpperInteriorWall(-19.85, floorTopY, collarCeilingY + 0.015, 7.925, 1.2, 0.45, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });

  // South Load-Bearing Cross-Wall between Bedroom 3 / Upper Corridor and Bedroom 4
  // (0.24m thick, Z = +8.15m..+8.39m, X = -17.22m..-22.19m) with doorway centered in the Corridor at X = -17.75m (width = 0.78m)
  addUpperInteriorWall(-20.205, floorTopY, upperWallTopY, 8.27, 3.97, 0.24, warmRoomPlasterMat, {
    skirtingSides: [1], // South (+Z) face inside Bedroom 4
    skirtingMin: -22.19,
    skirtingMax: -18.22,
    skipCap: true,
  });
  addUpperInteriorWall(-17.29, floorTopY, upperWallTopY, 8.27, 0.14, 0.24, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-17.75, floorTopY + doorH, upperWallTopY, 8.27, 0.92, 0.24, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteractiveDoor('x', 8.27, 0.24, -17.75, 0.78, Math.PI * 0.48);

  // Issue #6, #10 & #15: Full-span coplanar vaulted upper gable on the Z = 8.27m wall between Bedroom 3 and Bedroom 4 (Y = 4.14m..4.535m)
  {
    const northGableShape = new THREE.Shape();
    northGableShape.moveTo(-22.19, upperWallTopY - 0.02);
    northGableShape.lineTo(-17.22, upperWallTopY - 0.02);
    northGableShape.lineTo(-17.22, upperWallTopY + 0.015);
    northGableShape.lineTo(-18.75, collarCeilingY + 0.015);
    northGableShape.lineTo(-20.85, collarCeilingY + 0.015);
    northGableShape.lineTo(-22.19, upperWallTopY + 0.015);
    northGableShape.closePath();
    const northGableGeo = new THREE.ExtrudeGeometry(northGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    northGableGeo.translate(0, 0, 8.27 - 0.12);
    const northUpperGable = new THREE.Mesh(northGableGeo, warmRoomPlasterMat);
    northUpperGable.name = 'bedroom4.northWallUpperGable';
    northUpperGable.userData.isArchitecturalShell = true;
    northUpperGable.castShadow = true;
    northUpperGable.receiveShadow = true;
    scene.add(northUpperGable);
  }

  // Issue #6 & #7: Continuous 45°-mitred skirting along the South-East pier (`X = -18.475m`), South wall & Chimney Breast of Bedroom 3
  const bed3SouthMitredSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [-18.475, 7.922],
        [-18.475, 8.15],
        [-19.25, 8.15],
        [-19.25, 7.7],
        [-20.45, 7.7],
        [-20.45, 8.15],
        [-22.19, 8.15],
      ],
      floorTopY
    ),
    antiqueOakSkirtingMat
  );
  bed3SouthMitredSkirt.name = 'bedroom3.southWallMitredSkirting';
  bed3SouthMitredSkirt.userData.isArchitecturalShell = true;
  bed3SouthMitredSkirt.castShadow = true;
  bed3SouthMitredSkirt.receiveShadow = true;
  scene.add(bed3SouthMitredSkirt);
}
