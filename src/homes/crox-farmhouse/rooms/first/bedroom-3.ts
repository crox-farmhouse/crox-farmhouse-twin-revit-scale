import * as THREE from 'three';
import { buildKingCastIronBed } from './king-cast-iron-bed.ts';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
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
    floorTopY,
    oakFloorMat,
    timberDoorMat,
    wallCapMat,
    warmRoomPlasterMat,
  } = kit;

  const corridorFloorY = 2.095;
  const bed4FloorY = 2.05;
  const alcoveFloorY = 1.938; // Surveyed -142mm sunken NW wardrobe alcove (`Floor 1611622`)
  const corridorCeilingY = 4.155;
  const collarCeilingY = 5.05; // Surveyed Room 21/22 vaulted collar ceiling: +2.97m/+3.00m

  // =========================================================================
  // 6. BEDROOM 3 (`4.26m x 3.89m` + `1.85m x 0.61m` `-142mm` sunken NW wardrobe alcove)
  //    Main slab: `X = -22.33m..-18.21m, Z = +4.68m..+8.27m` at `Y = +2.08m`
  //    Sunken NW Alcove slab: `X = -22.33m..-20.235m, Z = +3.82m..+4.68m` at `Y = +1.938m`
  // =========================================================================
  {
    const idx0 = scene.children.length;
    addFirstFloorSlab(-22.33, -18.21, 4.68, 8.27, oakFloorMat);
    ensureNamedAddedChildren(scene, idx0, 'bedroom3.floorSlab.main');

    const alcoveSlab = buildPolygonalFloorSlab(
      scene,
      [
        [-22.33, 3.82],
        [-20.235, 3.82],
        [-20.235, 4.68],
        [-22.33, 4.68],
      ],
      alcoveFloorY,
      0.14,
      oakFloorMat,
      0.5
    );
    alcoveSlab.name = 'bedroom3.floorSlab.alcove';
    alcoveSlab.userData.isArchitecturalShell = true;
    alcoveSlab.geometry.computeBoundingSphere();
  }

  // West Front Exterior Brick Wall of Bedroom 3 (X = -22.47m..-22.19m, Z = +4.85m..+8.39m)
  // Surveyed Win 1764195: 1.47m x 1.00m 3-light casement (sill +644mm = 2.724m, head 3.724m)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -22.47,
      -22.19,
      4.85,
      8.39,
      6.38,
      1.47,
      2.724,
      3.724,
      'east',
      3,
      { windowFamily: 'tripleTopHungCentre', skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'bedroom3.westExteriorWall');
  }

  // Single Continuous West Corridor Partition Wall (`X = -18.21m, Z = +3.745m..+8.15m`, 0.15m thick)
  // With surveyed extra-wide solid oak `bedroom3Door` (`Door 1682967`: `1.03m x 1.95m` at `Z = +7.445m`)!
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-18.21, 3.745],
      end: [-18.21, 8.15],
      thickness: 0.15,
      topY: corridorCeilingY,
      frontFloorY: floorTopY,
      backFloorY: corridorFloorY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: antiqueOakSkirtingMat,
      addFrontSkirting: false,
      addBackSkirting: false,
      openings: [
        {
          id: 'bedroom3Door',
          kind: 'hinged-door',
          uCenter: 3.7, // Z = +7.445m
          width: 1.03,
          doorHeight: 1.95,
          lowerFloorY: floorTopY,
          upperFloorY: corridorFloorY,
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

  // Continuous 45°-mitred skirting along the West & North walls of the Corridor & Cut-Out Hallway (`Y = 2.095m`)
  for (const [skirtName, path] of [
    [
      'westWingCorridor.westWallMainMitredSkirting',
      [
        [-18.135, 6.855],
        [-18.135, 3.895],
        [-18.087, 3.895],
      ] as const,
    ],
    [
      'westWingCorridor.upLobbySouthSkirting',
      [
        [-18.087, 3.745],
        [-18.845, 3.745],
        [-18.845, 3.65],
      ] as const,
    ],
    [
      'westWingCorridor.westWallSouthPierSkirting',
      [
        [-18.175, 8.15],
        [-18.135, 8.15],
        [-18.135, 8.035],
      ] as const,
    ],
    [
      'westWingCorridor.upLobbyNorthPierSkirting',
      [
        [-18.845, 2.6],
        [-18.845, 2.15],
      ] as const,
    ],
    [
      'westWingCorridor.cutoutNorthCornerSkirting',
      [
        [-18.845, 1.24],
        [-18.845, 1.125],
        [-17.755, 1.125],
      ] as const,
    ],
  ] as const) {
    const skirtGeo = buildMitredWallSkirtingGeometry(path, corridorFloorY);
    skirtGeo.computeBoundingSphere();
    const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  // South Chimney Breast in Bedroom 3 (`X = -19.80m, width = 1.70m [X = -20.65m..-18.95m], depth = 0.47m [Z = +7.68m..+8.15m]`)
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
  // (`0.24m` thick, `Z = +8.15m..+8.39m, X = -17.22m..-22.19m`) with surveyed `Door 1682684` (`0.86m x 1.865m` centered at `X = -17.67m`)!
  {
    const idx = scene.children.length;
    addUpperInteractiveDoor('x', 8.27, 0.24, -17.67, 0.86, Math.PI * 0.48, {
      frontFloorY: bed4FloorY,
      backFloorY: corridorFloorY,
      doorFloorY: corridorFloorY,
      doorH: 1.865,
    });
    ensureNamedAddedChildren(scene, idx, 'bedroom4.entranceDoor');

    // 45mm solid oak threshold step at `bedroom4.entranceDoor` (`2.050m -> 2.095m`)
    const bed4StepRise = corridorFloorY - bed4FloorY;
    const bed4StepGeo = new THREE.BoxGeometry(0.86, bed4StepRise, 0.116);
    bed4StepGeo.computeBoundingSphere();
    const bed4Step = new THREE.Mesh(bed4StepGeo, antiqueOakSkirtingMat);
    bed4Step.name = 'bedroom4.doorThresholdStep';
    bed4Step.userData.isArchitecturalShell = true;
    bed4Step.position.set(-17.67, bed4FloorY + bed4StepRise * 0.5, 8.332);
    bed4Step.receiveShadow = true;
    scene.add(bed4Step);
  }
  {
    const doorMinX = -17.67 - 0.43; // -18.10m
    const doorMaxX = -17.67 + 0.43; // -17.24m
    const doorTopY = corridorFloorY + 1.865; // 3.96m
    const northGableShape = new THREE.Shape();
    northGableShape.moveTo(-22.19, bed4FloorY);
    northGableShape.lineTo(doorMinX, bed4FloorY);
    northGableShape.lineTo(doorMinX, doorTopY);
    northGableShape.lineTo(doorMaxX, doorTopY);
    northGableShape.lineTo(doorMaxX, bed4FloorY);
    northGableShape.lineTo(-17.236, bed4FloorY);
    northGableShape.lineTo(-17.236, corridorCeilingY);
    northGableShape.lineTo(-18.62, collarCeilingY);
    northGableShape.lineTo(-20.85, collarCeilingY);
    northGableShape.lineTo(-22.19, 3.85);
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

  // Continuous 45°-mitred skirting along the South-East pier (`X = -18.285m`), South wall, Chimney Breast, and West wall of Bedroom 3 (`Y = 2.08m`)
  for (const [skirtName, path] of [
    [
      'bedroom3.southWallMitredSkirting',
      [
        [-18.285, 8.035],
        [-18.285, 8.15],
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
        [-22.19, 4.68],
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

  // King Size Cast-Iron & Aged-Brass Bedstead against the East Wall (`X = -18.285m`, North of `bedroom3Door`) facing West toward the window
  buildKingCastIronBed(scene, {
    name: 'bedroom3.kingCastIronBed',
    zone: 'bedroom3',
    position: [-18.305, floorTopY, 5.76],
    rotationY: Math.PI,
    palette: 'frenchBlue',
  });
}
