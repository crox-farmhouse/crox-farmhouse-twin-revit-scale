import * as THREE from 'three';
import { buildKingCastIronBed } from './king-cast-iron-bed.ts';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
} from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

function ensureNamedAddedChildren(
  parent: THREE.Object3D,
  startIdx: number,
  prefix: string
): void {
  let meshCount = 0;
  let groupCount = 0;
  for (let i = startIdx; i < parent.children.length; i++) {
    const child = parent.children[i]!;
    child.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (!node.name) {
          meshCount += 1;
          node.name = `${prefix}.mesh_${meshCount}`;
        }
        const geo = node.geometry as THREE.BufferGeometry | undefined;
        if (geo && !geo.boundingSphere) {
          geo.computeBoundingSphere();
        }
      } else if (node instanceof THREE.Group && !node.name) {
        groupCount += 1;
        node.name = groupCount === 1 && node === child ? prefix : `${prefix}.group_${groupCount}`;
      }
    });
  }
}

/**
 * Bedroom 3 (`bedroom3`).
 */
export function buildBedroom3(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'floorTopY' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBedroomChimneyBreastWithFireplace' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBedroomChimneyBreastWithFireplace,
    addUpperBrickWallAlongZWithWindow,
    addUpperInteractiveDoor,
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
  {
    const idx0 = scene.children.length;
    addFirstFloorSlab(-22.33, -18.4, 4.85, 8.27, oakFloorMat);
    ensureNamedAddedChildren(scene, idx0, 'bedroom3.floorSlab.main');
    const idx1 = scene.children.length;
    addFirstFloorSlab(-22.33, -20.25, 4.1, 4.85, oakFloorMat);
    ensureNamedAddedChildren(scene, idx1, 'bedroom3.floorSlab.alcove');
  }

  // West Front Exterior Brick Wall of Bedroom 3 (X = -22.47m..-22.19m, Z = +4.85m..+8.39m)
  // With 2-pane Georgian casement window centered at Z = +6.38m (directly above Sitting Room bay — Photo 2!)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -22.47,
      -22.19,
      4.85,
      8.39,
      6.38,
      1.47,
      2.88,
      3.88,
      'east',
      2,
      { skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'bedroom3.westExteriorWall');
  }

  // Single Continuous West Corridor Partition Wall (`X = -18.40m, Z = +4.025m..+8.15m`, 0.15m thick)
  // Issues #3, #4, #6, #7 & #15: Runs in ONE single unbroken straight wall from the North corner of the Walk-In Shower
  // (`Z = +4.025m`) all the way South to the Bedroom 4 cross-wall (`Z = +8.15m`), with `bedroom3Door` at Z = +7.42m!
  {
    const idx = scene.children.length;
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
    ensureNamedAddedChildren(scene, idx, 'bedroom3.eastCorridorPartitionWall');
  }

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
        [-18.224, 8.15],
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
    const skirtGeo = buildMitredWallSkirtingGeometry(path, floorTopY);
    skirtGeo.computeBoundingSphere();
    const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  const collarCeilingY = 5.02;

  // Issue #2: South Chimney Breast in Bedroom 3 (`X = -19.80m, width = 1.70m [X = -20.65m..-18.95m], depth = 0.47m [Z = +7.68m..+8.15m]`)
  // Matches the Sitting Room chimney breast directly downstairs (`X = -20.65m..-18.95m, Z = +7.68m..+8.15m`) 100%,
  // and includes an 1800s farmhouse black cast-iron bedroom fireplace & small honed black slate hearth!
  {
    const idx = scene.children.length;
    addUpperBedroomChimneyBreastWithFireplace(scene, {
      namePrefix: 'bedroom3.southChimneyBreast',
      zone: 'bedroom3',
      x: -19.8,
      z: 7.915,
      width: 1.7,
      depth: 0.47,
      floorY: floorTopY,
      topY: collarCeilingY,
    });
    ensureNamedAddedChildren(scene, idx, 'bedroom3.southChimneyBreast');
  }

  // South Load-Bearing Cross-Wall between Bedroom 3 / Upper Corridor and Bedroom 4
  // (0.24m thick, Z = +8.15m..+8.39m, X = -17.22m..-22.19m) with doorway centered in the Corridor at X = -17.75m (width = 0.78m)
  // Built as a SINGLE unbroken full-height vaulted polygon (`Y = 2.08m..5.02m`) so there is zero horizontal split line at Y = 4.16m!
  {
    const idx = scene.children.length;
    addUpperInteractiveDoor('x', 8.27, 0.24, -17.75, 0.78, Math.PI * 0.48);
    ensureNamedAddedChildren(scene, idx, 'bedroom4.entranceDoor');
  }
  {
    const doorMinX = -17.75 - 0.39; // -18.14m
    const doorMaxX = -17.75 + 0.39; // -17.36m
    const northGableShape = new THREE.Shape();
    northGableShape.moveTo(-22.19, floorTopY);
    northGableShape.lineTo(doorMinX, floorTopY);
    northGableShape.lineTo(doorMinX, floorTopY + doorH);
    northGableShape.lineTo(doorMaxX, floorTopY + doorH);
    northGableShape.lineTo(doorMaxX, floorTopY);
    northGableShape.lineTo(-17.22, floorTopY);
    northGableShape.lineTo(-17.22, upperWallTopY);
    northGableShape.lineTo(-18.62, collarCeilingY);
    northGableShape.lineTo(-20.85, collarCeilingY);
    northGableShape.lineTo(-22.19, upperWallTopY);
    northGableShape.closePath();
    const northGableGeo = new THREE.ExtrudeGeometry(northGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    northGableGeo.translate(0, 0, 8.27 - 0.12);
    northGableGeo.computeBoundingSphere();
    const northUpperGable = new THREE.Mesh(northGableGeo, warmRoomPlasterMat);
    northUpperGable.name = 'bedroom4.northWallUpperGable';
    northUpperGable.userData.isArchitecturalShell = true;
    northUpperGable.castShadow = true;
    northUpperGable.receiveShadow = true;
    scene.add(northUpperGable);
  }

  // Issue #2, #6 & #7: Continuous 45°-mitred skirting along the South-East pier (`X = -18.475m`), South wall, Chimney Breast, and West wall of Bedroom 3,
  // terminating cleanly against the East (`X = -19.52m`) and West (`X = -20.08m`) jambs of the compact 1800s black cast-iron fireplace and NW wardrobes (`Z = 4.73m`)!
  for (const [skirtName, path] of [
    [
      'bedroom3.southWallMitredSkirting',
      [
        [-18.475, 7.922],
        [-18.475, 8.15],
        [-18.95, 8.15],
        [-18.95, 7.68],
        [-19.52, 7.68],
      ] as const,
    ],
    [
      'bedroom3.southWestWallMitredSkirting',
      [
        [-20.08, 7.68],
        [-20.65, 7.68],
        [-20.65, 8.15],
        [-22.19, 8.15],
        [-22.19, 4.73],
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

  // King Size Cast-Iron & Aged-Brass Bedstead against the East Wall (`X = -18.475m`, North of `bedroom3Door`) facing West toward the window
  buildKingCastIronBed(scene, {
    name: 'bedroom3.kingCastIronBed',
    zone: 'bedroom3',
    position: [-18.495, floorTopY, 5.92],
    rotationY: Math.PI,
    palette: 'frenchBlue',
  });
}
