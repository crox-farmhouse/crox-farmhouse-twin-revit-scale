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
  //    Directly above Sitting Room: X = -18.25m..-22.19m, Z = +4.30m..+8.15m
  // =========================================================================
  addFirstFloorSlab(-22.19, -18.25, 4.3, 8.15, oakFloorMat);
  addFirstFloorSlab(-22.19, -20.15, 4.15, 4.3, oakFloorMat);

  // West Front Exterior Brick Wall of Bedroom 3 (X = -22.47m..-22.19m, Z = +4.15m..+8.39m)
  // With 2-pane Georgian casement window centered at Z = +5.92m (directly above Sitting Room bay — Photo 2!)
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    4.15,
    8.39,
    5.92,
    1.35,
    2.92,
    3.94,
    'east',
    2,
    { skirtingMin: 4.18, skirtingMax: 8.15 }
  );

  // Single Continuous West Corridor Partition Wall (`X = -18.25m, Z = +3.475m..+8.15m`, 0.15m thick)
  // Issues #3, #4 & #7: Runs in ONE single unbroken straight wall from the North corner of the Walk-In Shower
  // (`Z = +3.475m`) all the way South to the Bedroom 4 cross-wall (`Z = +8.15m`), with `bedroom3Door` at Z = +7.42m!
  buildAngledWallSegment(scene, interactions, {
    start: [-18.25, 3.475],
    end: [-18.25, 8.15],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Corridor side uses 45°-mitred continuous skirting below
    addBackSkirting: true,   // West (`-X`) face inside Bedroom 3 (omitting Z = 3.475..4.375 inside Walk-In Shower)
    backSkirtingExclusions: [[0, 0.9]],
    openings: [
      {
        id: 'bedroom3Door',
        kind: 'hinged-door',
        uCenter: 3.945, // Z = +7.42m
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

  // Issues #3, #4, #6 & #7: Continuous 45°-mitred skirting along the West & North walls of the Corridor & Cut-Out Hallway
  for (const [skirtName, path] of [
    [
      'westWingCorridor.westWallMainMitredSkirting',
      [
        [-18.175, 6.918],
        [-18.175, 3.475],
        [-18.645, 3.475],
        [-18.645, 3.417],
      ] as const,
    ],
    [
      'westWingCorridor.westWallSouthPierSkirting',
      [
        [-18.175, 8.15],
        [-18.175, 7.922],
      ] as const,
    ],
    [
      'westWingCorridor.upLobbyNorthPierSkirting',
      [
        [-18.645, 2.573],
        [-18.645, 2.117],
      ] as const,
    ],
    [
      'westWingCorridor.cutoutNorthCornerSkirting',
      [
        [-18.645, 1.233],
        [-18.645, 1.125],
        [-17.721, 1.125],
        [-17.739, 1.219],
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

  // South Chimney Breast in Bedroom 3 (X = -19.85m, Z = +7.925m)
  addUpperInteriorWall(-19.85, floorTopY, upperWallTopY, 7.925, 1.2, 0.45, warmRoomPlasterMat, {
    skipSkirting: true,
  });

  // South Load-Bearing Cross-Wall between Bedroom 3 / Upper Corridor and Bedroom 4
  // (0.24m thick, Z = +8.15m..+8.39m, X = -17.22m..-22.19m) with doorway centered in the Corridor at X = -17.70m (width = 0.78m)
  addUpperInteriorWall(-20.14, floorTopY, upperWallTopY, 8.27, 4.1, 0.24, warmRoomPlasterMat, {
    skirtingSides: [1], // South (+Z) face inside Bedroom 4
    skirtingMin: -22.19,
    skirtingMax: -18.17,
    skipCap: true,
  });
  addUpperInteriorWall(-17.265, floorTopY, upperWallTopY, 8.27, 0.09, 0.24, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-17.655, floorTopY + doorH, upperWallTopY, 8.27, 0.87, 0.24, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteractiveDoor('x', 8.27, 0.24, -17.7, 0.78, Math.PI * 0.48);

  // Issue #6 & #10: Full-span coplanar vaulted upper gable on the Z = 8.27m North wall of Bedroom 4 (Y = 4.16m..4.52m)
  {
    const collarCeilingY = 4.52;
    const northGableShape = new THREE.Shape();
    northGableShape.moveTo(-22.19, upperWallTopY);
    northGableShape.lineTo(-17.22, upperWallTopY);
    northGableShape.lineTo(-18.75, collarCeilingY);
    northGableShape.lineTo(-20.85, collarCeilingY);
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

    for (const [x0, y0, x1, y1] of [
      [-22.19, upperWallTopY, -20.85, collarCeilingY],
      [-20.85, collarCeilingY, -18.75, collarCeilingY],
      [-18.75, collarCeilingY, -17.22, upperWallTopY],
    ] as const) {
      const segLen = Math.hypot(x1 - x0, y1 - y0);
      const segAngle = Math.atan2(y1 - y0, x1 - x0);
      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.008, 0.025, 0.244),
        wallCapMat
      );
      capMesh.userData.isArchitecturalShell = true;
      capMesh.position.set((x0 + x1) / 2, (y0 + y1) / 2 + 0.012, 8.27);
      capMesh.rotation.z = segAngle;
      scene.add(capMesh);
    }
  }

  // Issue #7: Continuous 45°-mitred skirting along the South wall & Chimney Breast of Bedroom 3
  const bed3SouthMitredSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [-18.325, 8.15],
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
