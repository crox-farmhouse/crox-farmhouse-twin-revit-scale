import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
} from '../../../../engine/geometry/index.ts';
import { transformEastWingTuple } from '../../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

function ensureNamedAddedChildren(
  parent: THREE.Object3D,
  startIdx: number,
  prefix: string,
  tagSmallDetails = false
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
        if (
          tagSmallDetails &&
          !node.userData?.isArchitecturalShell &&
          !node.userData?.isCutawayWall &&
          geo?.boundingSphere &&
          geo.boundingSphere.radius < 0.08
        ) {
          node.userData.lodTier = 'high';
          node.userData.lodMaxDistance = 12;
        }
      } else if (node instanceof THREE.Group && !node.name) {
        groupCount += 1;
        node.name = groupCount === 1 && node === child ? prefix : `${prefix}.group_${groupCount}`;
      }
    });
  }
}

function tagHighLodDetail(mesh: THREE.Mesh): void {
  mesh.userData.lodTier = 'high';
  mesh.userData.lodMaxDistance = 12;
}

/**
 * West wing upper corridor, trapezoidal upstairs shower room and walk-in cupboard.
 */
export function buildWestWingCorridor(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addShakerWardrobeDoor,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
    antiqueOakSkirtingMat,
    bathroomTileMat,
    brassMat,
    ceramicWhiteMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;

  const landingFloorTopY = 2.16;
  const showerFloorY = 2.075;
  const bed2FloorY = 2.05;
  const bed3FloorY = 2.08;
  const bed3AlcoveFloorY = 1.938; // Surveyed -142mm sunken NW wardrobe alcove in Bedroom 3
  const corridorCeilingY = 4.155; // Surveyed 2.06m corridor ceiling height above 2.095m FFL
  const showerWestEavesY = 3.875; // Surveyed 1.80m West eaves height above 2.075m FFL
  const showerCollarY = 4.815;    // Surveyed 2.74m vaulted collar in Room 20 Shower Room

  // Exact world-space junction coordinates along the West face of `upperLandingCrossWallFrame` and
  // South face (`z_ew = 2.688m`) of the Upper Landing South wall via `transformEastWingTuple`:
  const [portalNorthJambX, , portalNorthJambZ] = transformEastWingTuple(-17.937, 0, 1.232);
  const [portalSouthJambX, , portalSouthJambZ] = transformEastWingTuple(-17.998, 0, 2.09);
  const [portalSouthArchX, , portalSouthArchZ] = transformEastWingTuple(-18.003, 0, 2.171);
  const [landingSouthWestX, , landingSouthWestZ] = transformEastWingTuple(-18.04, 0, 2.688);
  const [, , landingSouthEastZ] = transformEastWingTuple(-16.956, 0, 2.688);

  // =========================================================================
  // 5. WEST WING UPPER CORRIDOR, UPSTAIRS SHOWER ROOM & BEDROOM 3 RECESSED WARDROBE
  // =========================================================================
  // Upper Corridor & Cut-Out North Hallway polygonal carpeted floor (`oakFloorMat`, Y = 2.08m)
  // Extended into surrounding East brick wall (`[-16.83, landingSouthEastZ] -> [-17.09, 8.27]`) and interior walls so zero light leaks under the skirting (Issue #13)!
  const corridorFloorSlab = buildPolygonalFloorSlab(
    scene,
    [
      [-18.92, 0.975],
      [-17.65, 0.975],
      [landingSouthWestX, landingSouthWestZ],
      [-16.83, landingSouthEastZ],
      [-17.09, 8.27],
      [-18.21, 8.27],
      [-18.21, 3.82],
      [-18.92, 3.82],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );
  corridorFloorSlab.name = 'westWingCorridor.floorSlab';
  corridorFloorSlab.userData.isArchitecturalShell = true;
  corridorFloorSlab.geometry.computeBoundingSphere();

  // Carpeted 8cm (`2.08m -> 2.16m`) `UP` Step Riser & Rounded Bullnose Nosing along the West face of
  // `upperLandingToWestWingPortal` stepping down into the cut-out hallway!
  {
    const stepStartX = portalNorthJambX;
    const stepStartZ = portalNorthJambZ;
    const stepEndX = portalSouthJambX;
    const stepEndZ = portalSouthJambZ;
    const sdx = stepEndX - stepStartX;
    const sdz = stepEndZ - stepStartZ;
    const stepLen = Math.hypot(sdx, sdz);
    const stepAngleY = Math.atan2(-sdz, sdx);
    const stepRise = landingFloorTopY - floorTopY; // 0.08m (8cm small step)

    const stepGroup = new THREE.Group();
    stepGroup.name = 'westWingCorridor.upStepToLanding';
    stepGroup.position.set(
      (stepStartX + stepEndX) / 2,
      floorTopY,
      (stepStartZ + stepEndZ) / 2
    );
    stepGroup.rotation.y = stepAngleY;

    const riserGeo = new THREE.BoxGeometry(stepLen, stepRise, 0.028);
    const riserUv = riserGeo.attributes.uv;
    if (riserUv) {
      for (let i = 0; i < riserUv.count; i++) {
        riserUv.setXY(
          i,
          riserUv.getX(i) * stepLen * 0.5,
          riserUv.getY(i) * stepRise * 0.5
        );
      }
      riserUv.needsUpdate = true;
    }
    riserGeo.computeBoundingSphere();
    const riserMesh = new THREE.Mesh(riserGeo, oakFloorMat);
    riserMesh.name = 'westWingCorridor.upStepToLanding.riser';
    riserMesh.position.set(0, stepRise / 2, 0);
    riserMesh.castShadow = true;
    riserMesh.receiveShadow = true;
    stepGroup.add(riserMesh);

    const nosingGeo = new THREE.CylinderGeometry(
      0.016,
      0.016,
      stepLen,
      14
    );
    nosingGeo.rotateZ(Math.PI / 2);
    const nosingUv = nosingGeo.attributes.uv;
    if (nosingUv) {
      for (let i = 0; i < nosingUv.count; i++) {
        nosingUv.setXY(
          i,
          nosingUv.getX(i) * 0.05,
          nosingUv.getY(i) * stepLen * 0.5
        );
      }
      nosingUv.needsUpdate = true;
    }
    nosingGeo.computeBoundingSphere();
    const nosingMesh = new THREE.Mesh(nosingGeo, oakFloorMat);
    nosingMesh.name = 'westWingCorridor.upStepToLanding.nosing';
    nosingMesh.position.set(0, stepRise - 0.014, 0.012);
    nosingMesh.castShadow = true;
    nosingMesh.receiveShadow = true;
    tagHighLodDetail(nosingMesh);
    stepGroup.add(nosingMesh);

    scene.add(stepGroup);
  }

  // Trapezoidal Shower Room polygonal tiled floor (`Y = 2.075m`, dry floor `4.35 m²` + `+100mm` step-up shower stall `1.69 m²`)
  const showerRoomFloorSlab = buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 1.905],
      [-18.92, 2.34],
      [-18.92, 3.82],
      [-18.21, 3.82],
      [-18.21, 4.68],
      [-20.235, 4.68],
      [-20.235, 3.82],
      [-22.19, 3.82],
    ],
    showerFloorY,
    showerFloorY - floorBaseY,
    bathroomTileMat,
    0.5
  );
  showerRoomFloorSlab.name = 'showerRoom.floorSlab';
  showerRoomFloorSlab.userData.isArchitecturalShell = true;
  showerRoomFloorSlab.geometry.computeBoundingSphere();

  // Solid antique oak threshold steps at `bedroom2Door` (`2.050m -> 2.095m`, 45mm rise) and `showerRoomDoor` (`2.075m -> 2.095m`, 20mm rise)
  {
    const bed2StepRise = floorTopY - bed2FloorY; // 0.045m
    const bed2StepGeo = new THREE.BoxGeometry(0.15, bed2StepRise, 0.76);
    bed2StepGeo.computeBoundingSphere();
    const bed2Step = new THREE.Mesh(bed2StepGeo, antiqueOakSkirtingMat);
    bed2Step.name = 'bedroom2.doorThresholdStep';
    bed2Step.userData.isArchitecturalShell = true;
    bed2Step.position.set(-18.92, bed2FloorY + bed2StepRise * 0.5, 1.695);
    bed2Step.receiveShadow = true;
    scene.add(bed2Step);

    const showerStepRise = floorTopY - showerFloorY; // 0.020m
    const showerThresholdGeo = new THREE.BoxGeometry(0.15, showerStepRise, 0.9);
    showerThresholdGeo.computeBoundingSphere();
    const showerThresholdStrip = new THREE.Mesh(
      showerThresholdGeo,
      antiqueOakSkirtingMat
    );
    showerThresholdStrip.name = 'showerRoom.doorThresholdStrip';
    showerThresholdStrip.userData.isArchitecturalShell = true;
    showerThresholdStrip.position.set(-18.92, showerFloorY + showerStepRise * 0.5, 3.125);
    showerThresholdStrip.receiveShadow = true;
    scene.add(showerThresholdStrip);
  }

  // West Front Exterior Brick Wall of Upstairs Shower Room (X = -22.47m..-22.19m, Z = +1.905m..+3.895m)
  // Surveyed Win 1764547: 0.96m x 0.96m 2-light casement (sill +690mm = 2.765m, head 3.725m)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -22.47,
      -22.19,
      1.905,
      3.895,
      2.88,
      0.96,
      2.765,
      3.725,
      'east',
      2,
      { windowFamily: 'doubleCasement', skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'showerRoom.westExteriorWall');

    const alcoveBrickIdx = scene.children.length;
    addUpperExteriorBrickWall(
      -22.47,
      -22.19,
      3.895,
      4.85,
      bed3AlcoveFloorY,
      upperWallTopY,
      'east',
      { skipSkirting: true, skipCap: true }
    );
    ensureNamedAddedChildren(scene, alcoveBrickIdx, 'bedroom3.alcoveWestExteriorWall');
  }

  // Continuous Flat East Courtyard Exterior Brick Wall along the West Wing Upper Corridor (Z = +2.74m..+8.15m)
  // Surveyed Win 1745551: 1.50m x 0.96m 3-light casement (sill +690mm = 2.785m, head 3.745m)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -17.39,
      -17.11,
      2.74,
      8.15,
      5.92,
      1.5,
      2.785,
      3.745,
      'west',
      3,
      { windowFamily: 'tripleTopHungCentre', skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'westWingCorridor.eastExteriorWall');
  }

  // Continuous 45°-mitred antique oak skirting along the East & North-East wall of the West Wing Corridor (Y = 2.095m),
  // split cleanly on either side of the `CP-07` (`Door 1683013`) cased portal at Z = 3.82m
  {
    const eastWallSlope = (-17.25 - -16.82) / (11.77 - 2.4);
    const getEastInnerX = (wz: number): number =>
      -16.82 + eastWallSlope * (wz - 2.4) - 0.14;

    for (const [skirtName, path] of [
      [
        'westWingCorridor.eastWallNorthMitredSkirting',
        [
          [portalSouthArchX, portalSouthArchZ],
          [landingSouthWestX, landingSouthWestZ],
          [getEastInnerX(landingSouthEastZ), landingSouthEastZ],
          [getEastInnerX(3.745), 3.745],
        ] as const,
      ],
      [
        'westWingCorridor.eastWallMitredSkirting',
        [
          [getEastInnerX(3.895), 3.895],
          [getEastInnerX(8.15), 8.15],
          [-17.165, 8.15],
        ] as const,
      ],
    ] as const) {
      const eastCorridorSkirtGeo = buildMitredWallSkirtingGeometry(path, floorTopY);
      eastCorridorSkirtGeo.computeBoundingSphere();
      const eastCorridorSkirt = new THREE.Mesh(
        eastCorridorSkirtGeo,
        antiqueOakSkirtingMat
      );
      eastCorridorSkirt.name = skirtName;
      eastCorridorSkirt.castShadow = true;
      eastCorridorSkirt.receiveShadow = true;
      eastCorridorSkirt.userData.isCutawayWall = true;
      eastCorridorSkirt.userData.cutawayWall = {
        axis: 'x',
        coord: -17.25,
        minSpan: 2.15,
        maxSpan: 8.15,
        floor: 'first',
      };
      scene.add(eastCorridorSkirt);
    }
  }

  // =========================================================================
  // CUT-OUT NORTH HALLWAY & UPSTAIRS SHOWER ROOM (`X = -22.19m..-18.92m, Z = +1.905m/+2.34m..+3.82m`
  // + Walk-In Shower Stall `X = -20.235m..-18.21m, Z = +3.82m..+4.68m`)
  // =========================================================================
  // 1a. Orthogonal 90° North End Wall of the Cut-Out Hallway (`Z = +1.05m, X = -18.995m..-17.65m`, 0.15m thick)
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-18.995, 1.05],
      end: [-17.65, 1.05],
      thickness: 0.15,
      topY: corridorCeilingY,
      frontFloorY: floorTopY,
      backFloorY: bed2FloorY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: antiqueOakSkirtingMat,
      addFrontSkirting: false, // Hallway side uses continuous 45°-mitred skirting in bedroom-3.ts
      addBackSkirting: false,  // Bedroom 2 side uses continuous 45°-mitred skirting in bedroom-2.ts
    });
    ensureNamedAddedChildren(scene, idx, 'westWingCorridor.cutoutNorthWall');
  }

  // 1b. Continuous West Wall of the Cut-Out Hallway & `UP` Lobby (`X = -18.92m, Z = +0.975m..+3.82m`, length = 2.845m)
  //     Contains BOTH `bedroom2Door` (`Door 1683309`: `0.76m x 1.865m` at `Z = 1.695m`)
  //     and `showerRoomDoor` (`Door 1683296`: `0.90m x 2.01m` at `Z = 3.125m`)!
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-18.92, 0.975],
      end: [-18.92, 3.82],
      thickness: 0.15,
      topY: corridorCeilingY,
      frontFloorY: showerFloorY,
      backFloorY: floorTopY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: antiqueOakSkirtingMat,
      addFrontSkirting: false,
      addBackSkirting: false,
      openings: [
        {
          id: 'bedroom2Door',
          kind: 'hinged-door',
          uCenter: 0.72,
          width: 0.76,
          doorHeight: 1.865,
          lowerFloorY: bed2FloorY,
          upperFloorY: floorTopY,
          architraveMaterial: antiqueOakSkirtingMat,
          doorLeafMaterial: timberDoorMat,
          hardwareMaterial: brassMat,
          hingeSide: 'right',
          openAngle: Math.PI * 0.42,
          initialOpenProgress: 0.2,
        },
        {
          id: 'showerRoomDoor',
          kind: 'hinged-door',
          uCenter: 2.15,
          width: 0.9,
          doorHeight: 2.01,
          lowerFloorY: showerFloorY,
          upperFloorY: floorTopY,
          architraveMaterial: antiqueOakSkirtingMat,
          doorLeafMaterial: timberDoorMat,
          hardwareMaterial: brassMat,
          hingeSide: 'left',
          openAngle: -Math.PI * 0.42,
          initialOpenProgress: 0.2,
        },
      ],
    });
    ensureNamedAddedChildren(scene, idx, 'westWingCorridor.cutoutWestWall');

    // Upper gable strip (`Y = 4.155m..4.815m`) along `X = -18.92m` (`Z = 2.34m..3.82m`) closing Room 20's 4.815m vaulted collar against the 4.155m West Lobby ceiling
    const showerEastUpperGeo = new THREE.BoxGeometry(
      0.15,
      showerCollarY - corridorCeilingY,
      3.82 - 2.34
    );
    showerEastUpperGeo.computeBoundingSphere();
    const showerEastUpperGable = new THREE.Mesh(
      showerEastUpperGeo,
      warmRoomPlasterMat
    );
    showerEastUpperGable.name = 'showerRoom.eastWallUpperGable';
    showerEastUpperGable.userData.isArchitecturalShell = true;
    showerEastUpperGable.position.set(
      -18.92,
      (corridorCeilingY + showerCollarY) * 0.5,
      (2.34 + 3.82) * 0.5
    );
    showerEastUpperGable.castShadow = true;
    showerEastUpperGable.receiveShadow = true;
    scene.add(showerEastUpperGable);
  }

  // Continuous 45°-mitred skirtings inside the dry Shower Room (`Y = 2.075m`)
  for (const [skirtName, path] of [
    [
      'showerRoom.northEastMitredSkirting',
      [
        [-21.11, 2.05],
        [-18.995, 2.33],
        [-18.995, 2.6],
      ] as const,
    ],
    [
      'showerRoom.westAndSouthMitredSkirting',
      [
        [-22.19, 2.045],
        [-22.19, 3.745],
        [-20.16, 3.745],
      ] as const,
    ],
    [
      'showerRoom.southEastPierSkirting',
      [
        [-19.3, 3.745],
        [-18.995, 3.745],
        [-18.995, 3.65],
      ] as const,
    ],
  ] as const) {
    const skirtGeo = buildMitredWallSkirtingGeometry(path, showerFloorY);
    skirtGeo.computeBoundingSphere();
    const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  // 2. Straight Z = +3.82m Partition Wall (calibrated to surveyed Room 20 clear depth 1.48-1.54m):
  //    2a. West section behind Vanity Basin & WC (`Z = +3.82m, X = -22.19m..-20.16m`)
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-22.19, 3.82],
      end: [-20.16, 3.82],
      thickness: 0.15,
      topY: showerWestEavesY,
      frontFloorY: bed3AlcoveFloorY,
      backFloorY: showerFloorY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: antiqueOakSkirtingMat,
      addFrontSkirting: false,
      addBackSkirting: false,
    });
    ensureNamedAddedChildren(scene, idx, 'showerRoom.southWestPartitionWall');
  }

  //    2b. One-piece vaulted East section forming the North wall of the Walk-In Shower & South wall of the West Lobby
  //        (`Z = +3.82m, X = -19.30m..-18.135m`, rising to 4.815m collar across -19.30..-18.92 and pitching to 4.155m at -18.135)
  {
    const seWallShape = new THREE.Shape();
    seWallShape.moveTo(-19.3, showerFloorY);
    seWallShape.lineTo(-18.135, showerFloorY);
    seWallShape.lineTo(-18.135, corridorCeilingY);
    seWallShape.lineTo(-18.92, showerCollarY);
    seWallShape.lineTo(-19.3, showerCollarY);
    seWallShape.closePath();
    const seWallGeo = new THREE.ExtrudeGeometry(seWallShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    seWallGeo.translate(0, 0, 3.82 - 0.075);
    seWallGeo.computeBoundingSphere();
    const seWallMesh = new THREE.Mesh(seWallGeo, warmRoomPlasterMat);
    seWallMesh.name = 'showerRoom.southEastPartitionWall';
    seWallMesh.userData.isArchitecturalShell = true;
    seWallMesh.castShadow = true;
    seWallMesh.receiveShadow = true;
    scene.add(seWallMesh);
  }

  //    2c. Surveyed Open Cased Solid Oak Portal `CP-07` (`Door 1683013`: 0.864m x 1.99m clear)
  //        dividing the North Cut-Out Lobby from the South Courtyard Corridor at `Z = +3.82m` (`X = -18.135m..-17.02m`)!
  {
    const portalMinX = -18.012;
    const portalMaxX = -17.148;
    const portalCenterX = (portalMinX + portalMaxX) * 0.5; // -17.58m
    const portalHeadY = floorTopY + 1.99; // 4.085m
    const portalWallShape = new THREE.Shape();
    portalWallShape.moveTo(-18.135, floorTopY);
    portalWallShape.lineTo(portalMinX, floorTopY);
    portalWallShape.lineTo(portalMinX, portalHeadY);
    portalWallShape.lineTo(portalMaxX, portalHeadY);
    portalWallShape.lineTo(portalMaxX, floorTopY);
    portalWallShape.lineTo(-17.01, floorTopY);
    portalWallShape.lineTo(-17.01, corridorCeilingY);
    portalWallShape.lineTo(-18.135, corridorCeilingY);
    portalWallShape.closePath();
    const portalWallGeo = new THREE.ExtrudeGeometry(portalWallShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    portalWallGeo.translate(0, 0, 3.82 - 0.075);
    portalWallGeo.computeBoundingSphere();
    const portalWallMesh = new THREE.Mesh(portalWallGeo, warmRoomPlasterMat);
    portalWallMesh.name = 'westWingCorridor.lobbyToCorridorPortal.wall';
    portalWallMesh.userData.isArchitecturalShell = true;
    portalWallMesh.castShadow = true;
    portalWallMesh.receiveShadow = true;
    scene.add(portalWallMesh);

    const cp07Idx = scene.children.length;
    addCasedArchitravePortal(scene, {
      axis: 'x',
      wallCoord: 3.82,
      wallThickness: 0.15,
      openingCenter: portalCenterX,
      openingWidth: 0.864,
      frontFloorY: floorTopY,
      backFloorY: floorTopY,
      headY: portalHeadY,
      material: antiqueOakSkirtingMat,
      architraveWidth: 0.075,
      namePrefix: 'westWingCorridor.lobbyToCorridorPortal',
    });
    ensureNamedAddedChildren(scene, cp07Idx, 'westWingCorridor.lobbyToCorridorPortal');
  }

  // =========================================================================
  // STEP-UP WALK-IN SHOWER TRAY (`Floor 1611917`: +100mm step-up `2.075m -> 2.175m`, `1.95m x 0.86m`)
  // & PLASTERED ARCHWAY ENTRANCE (`CP-08` / `Door 1683444`) AT `Z = +3.82m`
  // =========================================================================
  {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'showerRoom.stepUpArchShower';

    // 1. Plastered Archway Header (`showerRoom.showerArch`) over the `X = -20.16m..-19.30m` (`width = 0.86m`) entrance at `Z = +3.82m`
    //    Rising seamlessly up to the 4.815m vaulted collar ceiling!
    const archLeftX = -20.16;
    const archRightX = -19.3;
    const archCenterX = (archLeftX + archRightX) / 2; // -19.73m
    const archSpan = archRightX - archLeftX; // 0.86m
    const archRadius = archSpan / 2; // 0.43m
    const archSpringY = showerFloorY + 1.54; // 3.615m springing line -> 4.045m crown (1.97m clear!)
    const archWallD = 0.15;

    const archSpandrelShape = new THREE.Shape();
    archSpandrelShape.moveTo(-archRadius, archSpringY);
    archSpandrelShape.absarc(0, archSpringY, archRadius, Math.PI, 0, true);
    archSpandrelShape.lineTo(archRadius, showerCollarY);
    archSpandrelShape.lineTo(-archRadius, showerCollarY);
    archSpandrelShape.closePath();

    const archSpandrelGeo = new THREE.ExtrudeGeometry(archSpandrelShape, {
      depth: archWallD,
      bevelEnabled: false,
      curveSegments: 64,
    });
    archSpandrelGeo.translate(archCenterX, 0, 3.82 - archWallD / 2);
    {
      const posAttr = archSpandrelGeo.getAttribute('position');
      const normAttr = archSpandrelGeo.getAttribute('normal');
      if (posAttr && normAttr) {
        for (let i = 0; i < posAttr.count; i++) {
          const nz = normAttr.getZ(i);
          const wy = posAttr.getY(i);
          if (Math.abs(nz) < 0.5 && wy < showerCollarY - 0.002) {
            const wx = posAttr.getX(i);
            const dx = wx - archCenterX;
            const dy = wy - archSpringY;
            const r = Math.hypot(dx, dy);
            if (r > 1e-4 && Math.abs(r - archRadius) < 0.015) {
              normAttr.setXYZ(i, -dx / r, -dy / r, 0);
            }
          }
        }
        normAttr.needsUpdate = true;
      }
    }
    archSpandrelGeo.computeBoundingSphere();
    const archSpandrelMesh = new THREE.Mesh(archSpandrelGeo, warmRoomPlasterMat);
    archSpandrelMesh.name = 'showerRoom.showerArch';
    archSpandrelMesh.userData.isArchitecturalShell = true;
    archSpandrelMesh.castShadow = true;
    archSpandrelMesh.receiveShadow = true;
    showerGroup.add(archSpandrelMesh);

    // 2. Step-Up Tiled Shower Plinth (`0.10m` surveyed rise, `Y = 2.075m..2.175m`) & Ceramic Step-Up Shower Tray (`1.875m x 0.785m` clear inside `1.95m x 0.86m` stall)
    const plinthH = 0.1;
    const trayW = 1.875; // X = -20.16m..-18.285m
    const trayD = 0.785; // Z = +3.82m..+4.605m
    const trayCenterX = -19.2225;
    const trayCenterZ = 4.2125;

    const showerStepPlinthGeo = new THREE.BoxGeometry(trayW, plinthH, trayD);
    showerStepPlinthGeo.computeBoundingSphere();
    const showerStepPlinth = new THREE.Mesh(
      showerStepPlinthGeo,
      bathroomTileMat
    );
    showerStepPlinth.name = 'showerRoom.showerStepPlinth';
    showerStepPlinth.position.set(trayCenterX, showerFloorY + plinthH / 2, trayCenterZ);
    showerStepPlinth.castShadow = true;
    showerStepPlinth.receiveShadow = true;
    showerGroup.add(showerStepPlinth);

    const archStepRiserGeo = new THREE.BoxGeometry(archSpan, plinthH, 0.08);
    archStepRiserGeo.computeBoundingSphere();
    const archStepRiser = new THREE.Mesh(archStepRiserGeo, bathroomTileMat);
    archStepRiser.name = 'showerRoom.showerStepArchRiser';
    archStepRiser.position.set(archCenterX, showerFloorY + plinthH / 2, 3.78);
    archStepRiser.castShadow = true;
    archStepRiser.receiveShadow = true;
    showerGroup.add(archStepRiser);

    // Ceramic step-up threshold lip across the arch opening (`X = -20.16m..-19.30m, Z = 3.82m`)
    const stepNosingGeo = new THREE.BoxGeometry(archSpan, 0.028, 0.165);
    stepNosingGeo.computeBoundingSphere();
    const stepNosing = new THREE.Mesh(stepNosingGeo, ceramicWhiteMat);
    stepNosing.name = 'showerRoom.showerStepThreshold';
    stepNosing.position.set(archCenterX, showerFloorY + plinthH + 0.014, 3.82);
    stepNosing.castShadow = true;
    stepNosing.receiveShadow = true;
    showerGroup.add(stepNosing);

    // Raised white stone-resin shower tray with perimeter upstands & recessed standing well
    const trayBaseY = showerFloorY + plinthH;
    const srShowerTrayGeo = new THREE.BoxGeometry(trayW, 0.042, trayD);
    srShowerTrayGeo.computeBoundingSphere();
    const srShowerTray = new THREE.Mesh(srShowerTrayGeo, ceramicWhiteMat);
    srShowerTray.name = 'showerRoom.showerTray';
    srShowerTray.position.set(trayCenterX, trayBaseY + 0.021, trayCenterZ);
    srShowerTray.castShadow = true;
    srShowerTray.receiveShadow = true;
    showerGroup.add(srShowerTray);

    const trayRecessedWellGeo = new THREE.BoxGeometry(
      trayW - 0.14,
      0.012,
      trayD - 0.12
    );
    trayRecessedWellGeo.computeBoundingSphere();
    const trayRecessedWell = new THREE.Mesh(
      trayRecessedWellGeo,
      new THREE.MeshStandardMaterial({ color: 0xebeae4, roughness: 0.22, metalness: 0.04 })
    );
    trayRecessedWell.name = 'showerRoom.showerTray.recessedWell';
    trayRecessedWell.position.set(trayCenterX, trayBaseY + 0.043, trayCenterZ);
    showerGroup.add(trayRecessedWell);

    // Aged-brass square shower waste grate
    const showerDrainGrateGeo = new THREE.BoxGeometry(0.11, 0.014, 0.11);
    showerDrainGrateGeo.computeBoundingSphere();
    const showerDrainGrate = new THREE.Mesh(showerDrainGrateGeo, brassMat);
    showerDrainGrate.name = 'showerRoom.showerDrainGrate';
    showerDrainGrate.position.set(-18.58, trayBaseY + 0.044, trayCenterZ);
    tagHighLodDetail(showerDrainGrate);
    showerGroup.add(showerDrainGrate);

    // Exposed traditional aged-brass thermostatic rainfall & hand-shower column on the East wall (`X = -18.285m`)
    const srShowerRiserGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.08, 12);
    srShowerRiserGeo.computeBoundingSphere();
    const srShowerRiser = new THREE.Mesh(srShowerRiserGeo, brassMat);
    srShowerRiser.name = 'showerRoom.showerRiser';
    srShowerRiser.position.set(-18.34, trayBaseY + 1.42, trayCenterZ);
    tagHighLodDetail(srShowerRiser);
    showerGroup.add(srShowerRiser);

    const showerValveBarGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.24, 14);
    showerValveBarGeo.computeBoundingSphere();
    const showerValveBar = new THREE.Mesh(showerValveBarGeo, brassMat);
    showerValveBar.name = 'showerRoom.showerValveBar';
    showerValveBar.rotation.x = Math.PI / 2;
    showerValveBar.position.set(-18.33, trayBaseY + 1.02, trayCenterZ);
    tagHighLodDetail(showerValveBar);
    showerGroup.add(showerValveBar);

    const rainfallRoseGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.024, 20);
    rainfallRoseGeo.computeBoundingSphere();
    const rainfallRose = new THREE.Mesh(rainfallRoseGeo, brassMat);
    rainfallRose.name = 'showerRoom.rainfallShowerRose';
    rainfallRose.position.set(-18.58, trayBaseY + 1.92, trayCenterZ);
    tagHighLodDetail(rainfallRose);
    showerGroup.add(rainfallRose);

    const rainfallArmGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.26, 10);
    rainfallArmGeo.computeBoundingSphere();
    const rainfallArm = new THREE.Mesh(rainfallArmGeo, brassMat);
    rainfallArm.name = 'showerRoom.rainfallShowerArm';
    rainfallArm.rotation.z = Math.PI / 2;
    rainfallArm.position.set(-18.45, trayBaseY + 1.95, trayCenterZ);
    tagHighLodDetail(rainfallArm);
    showerGroup.add(rainfallArm);

    scene.add(showerGroup);
  }

  // =========================================================================
  // BESPOKE PERIOD SHAKER VANITY UNIT & HIGH-LOD EDWARDIAN LOW-LEVEL TOILET
  // (Mounted on Z = +3.745m South wall facing North `-Z`, on `showerFloorY = 2.075m`)
  // =========================================================================
  {
    const fixturesGroup = new THREE.Group();
    fixturesGroup.name = 'showerRoom.sanitaryware';
    fixturesGroup.position.set(0, showerFloorY, 3.745);
    fixturesGroup.rotation.y = Math.PI / 2;

    const vanitySubGroup = new THREE.Group();
    vanitySubGroup.name = 'showerRoom.sanitaryware.vanityUnit';
    fixturesGroup.add(vanitySubGroup);

    const toiletSubGroup = new THREE.Group();
    toiletSubGroup.name = 'showerRoom.sanitaryware.toilet';
    fixturesGroup.add(toiletSubGroup);

    const vanityCabinetMat = new THREE.MeshStandardMaterial({
      color: 0x3b443c, // rich deep heritage olive-charcoal joinery matching downstairs WC
      roughness: 0.48,
      metalness: 0.04,
    });
    const vanityTrimMat = new THREE.MeshStandardMaterial({
      color: 0x2d352e,
      roughness: 0.52,
      metalness: 0.04,
    });
    const marbleCounterMat = new THREE.MeshStandardMaterial({
      color: 0xf1eee8,
      roughness: 0.3,
      metalness: 0.04,
    });
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xdce6eb,
      roughness: 0.1,
      metalness: 0.22,
    });

    // 1. Floor-Standing Bespoke Period Shaker Vanity Unit + Mirror (centered at world X = -21.58m -> local Z = -21.58m)
    const vanityZ = -21.58;
    const vanityW = 0.78; // E-W width along wall
    const vanityD = 0.46; // N-S projection into room
    const vanityCarcassH = 0.8;

    const vanityPlinthGeo = new THREE.BoxGeometry(vanityD - 0.02, 0.085, vanityW + 0.016);
    vanityPlinthGeo.computeBoundingSphere();
    const vanityPlinth = new THREE.Mesh(vanityPlinthGeo, vanityTrimMat);
    vanityPlinth.name = 'showerRoom.vanityPlinth';
    vanityPlinth.position.set((vanityD - 0.02) / 2, 0.0425, vanityZ);
    vanityPlinth.castShadow = true;
    vanityPlinth.receiveShadow = true;
    vanitySubGroup.add(vanityPlinth);

    const vanityCabGeo = new THREE.BoxGeometry(vanityD, vanityCarcassH - 0.08, vanityW);
    vanityCabGeo.computeBoundingSphere();
    const vanityCab = new THREE.Mesh(vanityCabGeo, vanityCabinetMat);
    vanityCab.name = 'showerRoom.vanityCabinet';
    vanityCab.position.set(vanityD / 2, 0.44, vanityZ);
    vanityCab.castShadow = true;
    vanityCab.receiveShadow = true;
    vanitySubGroup.add(vanityCab);

    const shakerDoorFrameGeo = new THREE.BoxGeometry(0.022, 0.62, 0.34);
    shakerDoorFrameGeo.computeBoundingSphere();
    const shakerDoorPanelGeo = new THREE.BoxGeometry(0.014, 0.5, 0.24);
    shakerDoorPanelGeo.computeBoundingSphere();
    const doorKnobGeo = new THREE.SphereGeometry(0.015, 12, 12);
    doorKnobGeo.computeBoundingSphere();

    for (const [sideKey, sideZ] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const doorZ = vanityZ + sideZ * 0.18;
      const shakerDoorFrame = new THREE.Mesh(shakerDoorFrameGeo, vanityTrimMat);
      shakerDoorFrame.name = `showerRoom.vanityDoorFrame_${sideKey}`;
      shakerDoorFrame.position.set(vanityD + 0.008, 0.44, doorZ);
      shakerDoorFrame.castShadow = true;
      vanitySubGroup.add(shakerDoorFrame);

      const shakerDoorPanel = new THREE.Mesh(shakerDoorPanelGeo, vanityCabinetMat);
      shakerDoorPanel.name = `showerRoom.vanityDoorPanel_${sideKey}`;
      shakerDoorPanel.position.set(vanityD + 0.015, 0.44, doorZ);
      vanitySubGroup.add(shakerDoorPanel);

      const doorKnob = new THREE.Mesh(doorKnobGeo, brassMat);
      doorKnob.name = `showerRoom.vanityDoorKnob_${sideKey}`;
      doorKnob.position.set(vanityD + 0.032, 0.52, vanityZ + sideZ * 0.045);
      tagHighLodDetail(doorKnob);
      vanitySubGroup.add(doorKnob);
    }

    const basinSlabGeo = new THREE.BoxGeometry(vanityD + 0.03, 0.042, vanityW + 0.04);
    basinSlabGeo.computeBoundingSphere();
    const basinSlab = new THREE.Mesh(basinSlabGeo, marbleCounterMat);
    basinSlab.name = 'showerRoom.sinkBasin';
    basinSlab.position.set((vanityD + 0.03) / 2, 0.821, vanityZ);
    basinSlab.castShadow = true;
    basinSlab.receiveShadow = true;
    vanitySubGroup.add(basinSlab);

    const marbleUpstandGeo = new THREE.BoxGeometry(0.024, 0.11, vanityW + 0.04);
    marbleUpstandGeo.computeBoundingSphere();
    const marbleUpstand = new THREE.Mesh(marbleUpstandGeo, marbleCounterMat);
    marbleUpstand.name = 'showerRoom.vanityMarbleUpstand';
    marbleUpstand.position.set(0.012, 0.897, vanityZ);
    marbleUpstand.castShadow = true;
    vanitySubGroup.add(marbleUpstand);

    const basinRimGeo = new THREE.BoxGeometry(0.3, 0.016, 0.48);
    basinRimGeo.computeBoundingSphere();
    const basinRim = new THREE.Mesh(basinRimGeo, ceramicWhiteMat);
    basinRim.name = 'showerRoom.sinkBasinRim';
    basinRim.position.set(0.26, 0.843, vanityZ);
    vanitySubGroup.add(basinRim);

    const basinWellGeo = new THREE.BoxGeometry(0.25, 0.018, 0.42);
    basinWellGeo.computeBoundingSphere();
    const basinWell = new THREE.Mesh(
      basinWellGeo,
      new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.14, metalness: 0.06 })
    );
    basinWell.name = 'showerRoom.sinkBasinWell';
    basinWell.position.set(0.26, 0.846, vanityZ);
    vanitySubGroup.add(basinWell);

    const tapStemGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.16, 14);
    tapStemGeo.computeBoundingSphere();
    const tapStem = new THREE.Mesh(tapStemGeo, brassMat);
    tapStem.name = 'showerRoom.basinTapStem';
    tapStem.position.set(0.085, 0.92, vanityZ);
    tagHighLodDetail(tapStem);
    vanitySubGroup.add(tapStem);

    const tapSpoutGeo = new THREE.BoxGeometry(0.14, 0.018, 0.02);
    tapSpoutGeo.computeBoundingSphere();
    const tapSpout = new THREE.Mesh(tapSpoutGeo, brassMat);
    tapSpout.name = 'showerRoom.basinTapSpout';
    tapSpout.position.set(0.145, 0.99, vanityZ);
    tagHighLodDetail(tapSpout);
    vanitySubGroup.add(tapSpout);

    const valveBodyGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.065, 12);
    valveBodyGeo.computeBoundingSphere();
    const crossBarGeo = new THREE.BoxGeometry(0.052, 0.01, 0.052);
    crossBarGeo.computeBoundingSphere();

    for (const [valveKey, valveZ] of [
      ['left', vanityZ - 0.11],
      ['right', vanityZ + 0.11],
    ] as const) {
      const valveBody = new THREE.Mesh(valveBodyGeo, brassMat);
      valveBody.name = `showerRoom.basinTapValve_${valveKey}`;
      valveBody.position.set(0.085, 0.875, valveZ);
      tagHighLodDetail(valveBody);
      vanitySubGroup.add(valveBody);

      const crossBar = new THREE.Mesh(crossBarGeo, brassMat);
      crossBar.name = `showerRoom.basinTapCrosshead_${valveKey}`;
      crossBar.position.set(0.085, 0.91, valveZ);
      tagHighLodDetail(crossBar);
      vanitySubGroup.add(crossBar);
    }

    const mirrorFrameGeo = new THREE.BoxGeometry(0.028, 0.84, 0.66);
    mirrorFrameGeo.computeBoundingSphere();
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, brassMat);
    mirrorFrame.name = 'showerRoom.mirrorFrame';
    mirrorFrame.position.set(0.024, 1.42, vanityZ);
    mirrorFrame.castShadow = true;
    vanitySubGroup.add(mirrorFrame);

    const mirrorSurfaceGeo = new THREE.BoxGeometry(0.01, 0.78, 0.6);
    mirrorSurfaceGeo.computeBoundingSphere();
    const mirrorSurface = new THREE.Mesh(mirrorSurfaceGeo, mirrorGlassMat);
    mirrorSurface.name = 'showerRoom.mirror';
    mirrorSurface.position.set(0.036, 1.42, vanityZ);
    vanitySubGroup.add(mirrorSurface);

    // 2. High-LOD Traditional Edwardian Low-Level Vitreous China Toilet (centered at world X = -20.58m -> local Z = -20.58m)
    const toiletZ = -20.58;
    const panCenterX = 0.455;

    const vitreousChinaMat = new THREE.MeshStandardMaterial({
      color: 0xf6f5f0,
      roughness: 0.11,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const innerBowlGlazeMat = new THREE.MeshStandardMaterial({
      color: 0xe6eaec,
      roughness: 0.08,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });
    const waterSealMat = new THREE.MeshStandardMaterial({
      color: 0xd4edf4,
      roughness: 0.04,
      metalness: 0.12,
      transparent: true,
      opacity: 0.78,
    });
    const walnutSeatMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.28,
      metalness: 0.04,
    });

    const pedestalFootPts = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.148, 0.0),
      new THREE.Vector2(0.146, 0.018),
      new THREE.Vector2(0.132, 0.028),
      new THREE.Vector2(0.126, 0.046),
      new THREE.Vector2(0.106, 0.068),
      new THREE.Vector2(0.098, 0.145),
      new THREE.Vector2(0.112, 0.188),
    ];
    const wcPanPedestalGeo = new THREE.LatheGeometry(pedestalFootPts, 24);
    wcPanPedestalGeo.computeBoundingSphere();
    const wcPanPedestal = new THREE.Mesh(wcPanPedestalGeo, vitreousChinaMat);
    wcPanPedestal.name = 'showerRoom.toiletPedestal';
    wcPanPedestal.position.set(panCenterX - 0.015, 0.01, toiletZ);
    wcPanPedestal.scale.set(1.26, 1.0, 0.88);
    wcPanPedestal.castShadow = true;
    wcPanPedestal.receiveShadow = true;
    toiletSubGroup.add(wcPanPedestal);

    const floorBoltGeo = new THREE.SphereGeometry(0.011, 10, 10);
    floorBoltGeo.computeBoundingSphere();
    for (const [boltKey, boltSideZ] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const floorBolt = new THREE.Mesh(floorBoltGeo, brassMat);
      floorBolt.name = `showerRoom.toiletFloorBolt_${boltKey}`;
      floorBolt.position.set(panCenterX - 0.015, 0.026, toiletZ + boltSideZ * 0.116);
      tagHighLodDetail(floorBolt);
      toiletSubGroup.add(floorBolt);
    }

    const soilPipeShroudGeo = new THREE.CylinderGeometry(0.056, 0.058, 0.22, 16);
    soilPipeShroudGeo.computeBoundingSphere();
    const soilPipeShroud = new THREE.Mesh(soilPipeShroudGeo, vitreousChinaMat);
    soilPipeShroud.name = 'showerRoom.toiletSoilPipeShroud';
    soilPipeShroud.rotation.z = Math.PI / 2;
    soilPipeShroud.position.set(0.11, 0.185, toiletZ);
    soilPipeShroud.castShadow = true;
    toiletSubGroup.add(soilPipeShroud);

    const soilWallCollarGeo = new THREE.CylinderGeometry(0.076, 0.08, 0.026, 18);
    soilWallCollarGeo.computeBoundingSphere();
    const soilWallCollar = new THREE.Mesh(soilWallCollarGeo, vitreousChinaMat);
    soilWallCollar.name = 'showerRoom.toiletSoilWallCollar';
    soilWallCollar.rotation.z = Math.PI / 2;
    soilWallCollar.position.set(0.013, 0.185, toiletZ);
    tagHighLodDetail(soilWallCollar);
    toiletSubGroup.add(soilWallCollar);

    const bowlProfilePts = [
      new THREE.Vector2(0.001, 0.175),
      new THREE.Vector2(0.068, 0.18),
      new THREE.Vector2(0.112, 0.172),
      new THREE.Vector2(0.146, 0.235),
      new THREE.Vector2(0.174, 0.315),
      new THREE.Vector2(0.182, 0.365),
      new THREE.Vector2(0.198, 0.376),
      new THREE.Vector2(0.202, 0.398),
      new THREE.Vector2(0.192, 0.406),
      new THREE.Vector2(0.154, 0.404),
      new THREE.Vector2(0.148, 0.382),
      new THREE.Vector2(0.132, 0.315),
      new THREE.Vector2(0.088, 0.235),
      new THREE.Vector2(0.064, 0.192),
      new THREE.Vector2(0.001, 0.188),
    ];
    const wcPanBowlGeo = new THREE.LatheGeometry(bowlProfilePts, 28);
    wcPanBowlGeo.computeBoundingSphere();
    const wcPanBowl = new THREE.Mesh(wcPanBowlGeo, vitreousChinaMat);
    wcPanBowl.name = 'showerRoom.toiletPan';
    wcPanBowl.position.set(panCenterX, 0, toiletZ);
    wcPanBowl.scale.set(1.18, 1.0, 0.95);
    wcPanBowl.castShadow = true;
    wcPanBowl.receiveShadow = true;
    toiletSubGroup.add(wcPanBowl);

    const innerWellLinerGeo = new THREE.CylinderGeometry(0.138, 0.068, 0.16, 24, 1, true);
    innerWellLinerGeo.computeBoundingSphere();
    const innerWellLiner = new THREE.Mesh(innerWellLinerGeo, innerBowlGlazeMat);
    innerWellLiner.name = 'showerRoom.toiletInnerWellLiner';
    innerWellLiner.position.set(panCenterX, 0.285, toiletZ);
    innerWellLiner.scale.set(1.16, 1.0, 0.93);
    toiletSubGroup.add(innerWellLiner);

    const waterSealDiscGeo = new THREE.CylinderGeometry(0.086, 0.072, 0.008, 22);
    waterSealDiscGeo.computeBoundingSphere();
    const waterSealDisc = new THREE.Mesh(waterSealDiscGeo, waterSealMat);
    waterSealDisc.name = 'showerRoom.waterSeal';
    waterSealDisc.position.set(panCenterX - 0.01, 0.224, toiletZ);
    waterSealDisc.scale.set(1.15, 1.0, 0.92);
    toiletSubGroup.add(waterSealDisc);

    const rearPanDeckGeo = new THREE.BoxGeometry(0.15, 0.048, 0.25);
    rearPanDeckGeo.computeBoundingSphere();
    const rearPanDeck = new THREE.Mesh(rearPanDeckGeo, vitreousChinaMat);
    rearPanDeck.name = 'showerRoom.toiletRearPanDeck';
    rearPanDeck.position.set(panCenterX - 0.185, 0.38, toiletZ);
    rearPanDeck.castShadow = true;
    toiletSubGroup.add(rearPanDeck);

    const rearInletHornGeo = new THREE.CylinderGeometry(0.036, 0.044, 0.07, 16);
    rearInletHornGeo.computeBoundingSphere();
    const rearInletHorn = new THREE.Mesh(rearInletHornGeo, vitreousChinaMat);
    rearInletHorn.name = 'showerRoom.toiletRearInletHorn';
    rearInletHorn.rotation.z = Math.PI / 2;
    rearInletHorn.position.set(panCenterX - 0.255, 0.382, toiletZ);
    tagHighLodDetail(rearInletHorn);
    toiletSubGroup.add(rearInletHorn);

    const wcSeatGeo = new THREE.TorusGeometry(0.164, 0.027, 18, 36);
    wcSeatGeo.computeBoundingSphere();
    const wcSeat = new THREE.Mesh(wcSeatGeo, walnutSeatMat);
    wcSeat.name = 'showerRoom.toiletSeat';
    wcSeat.rotation.x = Math.PI / 2;
    wcSeat.position.set(panCenterX + 0.006, 0.418, toiletZ);
    wcSeat.scale.set(1.17, 0.95, 0.36);
    wcSeat.castShadow = true;
    wcSeat.receiveShadow = true;
    toiletSubGroup.add(wcSeat);

    const walnutHingeBlockGeo = new THREE.BoxGeometry(0.052, 0.018, 0.21);
    walnutHingeBlockGeo.computeBoundingSphere();
    const walnutHingeBlock = new THREE.Mesh(walnutHingeBlockGeo, walnutSeatMat);
    walnutHingeBlock.name = 'showerRoom.toiletSeatHingeBlock';
    walnutHingeBlock.position.set(panCenterX - 0.175, 0.418, toiletZ);
    walnutHingeBlock.castShadow = true;
    tagHighLodDetail(walnutHingeBlock);
    toiletSubGroup.add(walnutHingeBlock);

    const hingePillarGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.034, 12);
    hingePillarGeo.computeBoundingSphere();
    for (const [hingeKey, hingeSideZ] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const hingePillar = new THREE.Mesh(hingePillarGeo, brassMat);
      hingePillar.name = `showerRoom.toiletSeatHingePillar_${hingeKey}`;
      hingePillar.position.set(panCenterX - 0.182, 0.418, toiletZ + hingeSideZ * 0.078);
      tagHighLodDetail(hingePillar);
      toiletSubGroup.add(hingePillar);
    }

    const hingeCrossBarGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12);
    hingeCrossBarGeo.computeBoundingSphere();
    const hingeCrossBar = new THREE.Mesh(hingeCrossBarGeo, brassMat);
    hingeCrossBar.name = 'showerRoom.toiletSeatHingeCrossBar';
    hingeCrossBar.rotation.x = Math.PI / 2;
    hingeCrossBar.position.set(panCenterX - 0.182, 0.426, toiletZ);
    tagHighLodDetail(hingeCrossBar);
    toiletSubGroup.add(hingeCrossBar);

    const cisternCenterX = 0.11;
    const cisternBaseY = 0.73;
    const cisternH = 0.31;
    const cisternW = 0.46;
    const cisternD = 0.2;

    const cisternLowerSkirtGeo = new THREE.BoxGeometry(
      cisternD - 0.016,
      0.028,
      cisternW - 0.02
    );
    cisternLowerSkirtGeo.computeBoundingSphere();
    const cisternLowerSkirt = new THREE.Mesh(cisternLowerSkirtGeo, vitreousChinaMat);
    cisternLowerSkirt.name = 'showerRoom.cisternLowerSkirt';
    cisternLowerSkirt.position.set(cisternCenterX - 0.005, cisternBaseY + 0.014, toiletZ);
    cisternLowerSkirt.castShadow = true;
    toiletSubGroup.add(cisternLowerSkirt);

    const wcCisternGeo = new THREE.BoxGeometry(cisternD, cisternH - 0.028, cisternW);
    wcCisternGeo.computeBoundingSphere();
    const wcCistern = new THREE.Mesh(wcCisternGeo, vitreousChinaMat);
    wcCistern.name = 'showerRoom.cistern';
    wcCistern.position.set(cisternCenterX, cisternBaseY + 0.028 + (cisternH - 0.028) / 2, toiletZ);
    wcCistern.castShadow = true;
    wcCistern.receiveShadow = true;
    toiletSubGroup.add(wcCistern);

    const cisternFrontPanelGeo = new THREE.BoxGeometry(0.012, 0.19, 0.36);
    cisternFrontPanelGeo.computeBoundingSphere();
    const cisternFrontPanel = new THREE.Mesh(cisternFrontPanelGeo, vitreousChinaMat);
    cisternFrontPanel.name = 'showerRoom.cisternFrontPanel';
    cisternFrontPanel.position.set(cisternCenterX + cisternD / 2 + 0.004, cisternBaseY + 0.165, toiletZ);
    toiletSubGroup.add(cisternFrontPanel);

    const makerBadgeRimGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.008, 16);
    makerBadgeRimGeo.computeBoundingSphere();
    const makerBadgeRim = new THREE.Mesh(makerBadgeRimGeo, brassMat);
    makerBadgeRim.name = 'showerRoom.cisternMakerBadge';
    makerBadgeRim.rotation.z = Math.PI / 2;
    makerBadgeRim.position.set(cisternCenterX + cisternD / 2 + 0.011, cisternBaseY + 0.17, toiletZ);
    makerBadgeRim.scale.set(1.0, 1.35, 0.72);
    tagHighLodDetail(makerBadgeRim);
    toiletSubGroup.add(makerBadgeRim);

    const cisternCorniceStepGeo = new THREE.BoxGeometry(
      cisternD + 0.022,
      0.024,
      cisternW + 0.026
    );
    cisternCorniceStepGeo.computeBoundingSphere();
    const cisternCorniceStep = new THREE.Mesh(cisternCorniceStepGeo, vitreousChinaMat);
    cisternCorniceStep.name = 'showerRoom.cisternCorniceStep';
    cisternCorniceStep.position.set(cisternCenterX + 0.004, cisternBaseY + cisternH + 0.012, toiletZ);
    cisternCorniceStep.castShadow = true;
    toiletSubGroup.add(cisternCorniceStep);

    const cisternLidGeo = new THREE.BoxGeometry(
      cisternD + 0.006,
      0.022,
      cisternW + 0.008
    );
    cisternLidGeo.computeBoundingSphere();
    const cisternLid = new THREE.Mesh(cisternLidGeo, vitreousChinaMat);
    cisternLid.name = 'showerRoom.cisternLid';
    cisternLid.position.set(cisternCenterX + 0.002, cisternBaseY + cisternH + 0.034, toiletZ);
    cisternLid.castShadow = true;
    toiletSubGroup.add(cisternLid);

    const wallLegGeo = new THREE.BoxGeometry(0.016, 0.13, 0.024);
    wallLegGeo.computeBoundingSphere();
    const topArmGeo = new THREE.BoxGeometry(0.165, 0.014, 0.022);
    topArmGeo.computeBoundingSphere();
    const scrollStrutGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10);
    scrollStrutGeo.computeBoundingSphere();

    for (const [brkKey, brkSideZ] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const brkZ = toiletZ + brkSideZ * 0.155;
      const wallLeg = new THREE.Mesh(wallLegGeo, brassMat);
      wallLeg.name = `showerRoom.cisternBracketWallLeg_${brkKey}`;
      wallLeg.position.set(0.014, cisternBaseY - 0.055, brkZ);
      tagHighLodDetail(wallLeg);
      toiletSubGroup.add(wallLeg);

      const topArm = new THREE.Mesh(topArmGeo, brassMat);
      topArm.name = `showerRoom.cisternBracketTopArm_${brkKey}`;
      topArm.position.set(0.09, cisternBaseY - 0.004, brkZ);
      tagHighLodDetail(topArm);
      toiletSubGroup.add(topArm);

      const scrollStrut = new THREE.Mesh(scrollStrutGeo, brassMat);
      scrollStrut.name = `showerRoom.cisternBracketScrollStrut_${brkKey}`;
      scrollStrut.rotation.z = -0.82;
      scrollStrut.position.set(0.075, cisternBaseY - 0.055, brkZ);
      tagHighLodDetail(scrollStrut);
      toiletSubGroup.add(scrollStrut);
    }

    const leverZ = toiletZ + 0.155;
    const leverY = cisternBaseY + 0.235;
    const leverFulcrumGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.026, 14);
    leverFulcrumGeo.computeBoundingSphere();
    const leverFulcrum = new THREE.Mesh(leverFulcrumGeo, brassMat);
    leverFulcrum.name = 'showerRoom.flushLeverFulcrum';
    leverFulcrum.rotation.z = Math.PI / 2;
    leverFulcrum.position.set(cisternCenterX + cisternD / 2 + 0.016, leverY, leverZ);
    tagHighLodDetail(leverFulcrum);
    toiletSubGroup.add(leverFulcrum);

    const leverArmGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.075, 10);
    leverArmGeo.computeBoundingSphere();
    const leverArm = new THREE.Mesh(leverArmGeo, brassMat);
    leverArm.name = 'showerRoom.flushLeverArm';
    leverArm.rotation.x = Math.PI / 2;
    leverArm.rotation.z = -0.22;
    leverArm.position.set(cisternCenterX + cisternD / 2 + 0.032, leverY - 0.008, leverZ + 0.032);
    tagHighLodDetail(leverArm);
    toiletSubGroup.add(leverArm);

    const ceramicTorpedoHandleGeo = new THREE.CylinderGeometry(0.011, 0.009, 0.068, 14);
    ceramicTorpedoHandleGeo.computeBoundingSphere();
    const ceramicTorpedoHandle = new THREE.Mesh(
      ceramicTorpedoHandleGeo,
      vitreousChinaMat
    );
    ceramicTorpedoHandle.name = 'showerRoom.flushLever';
    ceramicTorpedoHandle.rotation.x = Math.PI / 2;
    ceramicTorpedoHandle.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.078);
    ceramicTorpedoHandle.castShadow = true;
    tagHighLodDetail(ceramicTorpedoHandle);
    toiletSubGroup.add(ceramicTorpedoHandle);

    const handleFinialGeo = new THREE.SphereGeometry(0.009, 10, 10);
    handleFinialGeo.computeBoundingSphere();
    const handleFinial = new THREE.Mesh(handleFinialGeo, brassMat);
    handleFinial.name = 'showerRoom.flushLeverFinial';
    handleFinial.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.114);
    tagHighLodDetail(handleFinial);
    toiletSubGroup.add(handleFinial);

    const flushPipeX = 0.125;
    const cisternNutGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.026, 14);
    cisternNutGeo.computeBoundingSphere();
    const cisternNut = new THREE.Mesh(cisternNutGeo, brassMat);
    cisternNut.name = 'showerRoom.flushPipeCisternNut';
    cisternNut.position.set(flushPipeX, cisternBaseY - 0.012, toiletZ);
    tagHighLodDetail(cisternNut);
    toiletSubGroup.add(cisternNut);

    const flushPipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(flushPipeX, cisternBaseY, toiletZ),
      new THREE.Vector3(flushPipeX, 0.43, toiletZ),
      new THREE.Vector3(flushPipeX + 0.02, 0.385, toiletZ),
      new THREE.Vector3(panCenterX - 0.25, 0.382, toiletZ),
    ]);
    const flushPipeGeo = new THREE.TubeGeometry(flushPipeCurve, 18, 0.019, 12, false);
    flushPipeGeo.computeBoundingSphere();
    const flushPipe = new THREE.Mesh(flushPipeGeo, brassMat);
    flushPipe.name = 'showerRoom.flushPipe';
    flushPipe.castShadow = true;
    toiletSubGroup.add(flushPipe);

    scene.add(fixturesGroup);
  }

  // =========================================================================
  // BEDROOM 3 BUILT-IN NORTH WARDROBE (`J-B02`: `X = -22.19m..-20.31m, Z = +3.895m..+4.435m`)
  // Seated inside the surveyed `-142mm` sunken NW alcove (`Y = 1.938m`, stepping up to `2.08m` at `Z = 4.68m`)
  // =========================================================================
  {
    const bed3WardGroup = new THREE.Group();
    bed3WardGroup.name = 'bedroom3.northWardrobe';
    const wardMinX = -22.19;
    const wardMaxX = -20.31;
    const wardW = wardMaxX - wardMinX; // 1.88m
    const wardD = 0.54; // Z = +3.895m .. +4.435m (leaves 24.5cm of sunken 1.938m alcove floor in front of doors!)
    const centerZ = 4.165;
    const bed3CollarY = 5.05;
    const bed3WestEavesY = 3.85;
    const bed3EastEavesY = 4.12;
    const bed3CollarWestX = -20.85;
    const bed3CollarEastX = -18.76;

    const getBed3VaultCeilingYAtX = (wx: number): number => {
      if (wx < bed3CollarWestX) {
        return (
          bed3WestEavesY +
          ((wx - -22.19) / (bed3CollarWestX - -22.19)) * (bed3CollarY - bed3WestEavesY)
        );
      }
      if (wx > bed3CollarEastX) {
        return (
          bed3CollarY -
          ((wx - bed3CollarEastX) / (-18.285 - bed3CollarEastX)) * (bed3CollarY - bed3EastEavesY)
        );
      }
      return bed3CollarY;
    };

    // Full-height vaulted wardrobe carcass (`X = -22.19m..-20.31m, Y = 1.938m..5.05m`, seated on sunken alcove floor)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(wardMinX, bed3AlcoveFloorY);
    carcassShape.lineTo(wardMaxX, bed3AlcoveFloorY);
    carcassShape.lineTo(wardMaxX, bed3CollarY);
    carcassShape.lineTo(bed3CollarWestX, bed3CollarY);
    carcassShape.lineTo(wardMinX, bed3WestEavesY);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: wardD,
      bevelEnabled: false,
    });
    carcassGeo.translate(0, 0, centerZ - wardD / 2);
    carcassGeo.computeBoundingSphere();
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom3.northWardrobe.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    bed3WardGroup.add(carcass);

    // Single one-piece raked Shaker crown cornice moulding following the vaulted ceiling profile along the South face (`Z = 4.425m..4.465m`)
    const corniceH = 0.044;
    const corniceShape = new THREE.Shape();
    corniceShape.moveTo(wardMinX, bed3WestEavesY - corniceH);
    corniceShape.lineTo(bed3CollarWestX, bed3CollarY - corniceH);
    corniceShape.lineTo(wardMaxX, bed3CollarY - corniceH);
    corniceShape.lineTo(wardMaxX, bed3CollarY);
    corniceShape.lineTo(bed3CollarWestX, bed3CollarY);
    corniceShape.lineTo(wardMinX, bed3WestEavesY);
    corniceShape.closePath();
    const corniceGeo = new THREE.ExtrudeGeometry(corniceShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    corniceGeo.translate(0, 0, 4.425);
    corniceGeo.computeBoundingSphere();
    const corniceSeg = new THREE.Mesh(corniceGeo, wardrobeMat);
    corniceSeg.name = 'bedroom3.northWardrobe.cornice';
    corniceSeg.castShadow = true;
    corniceSeg.receiveShadow = true;
    bed3WardGroup.add(corniceSeg);

    // 4 ceiling-height Shaker wardrobe doors (2 pairs) along the South face (`Z = +4.448m`) above a 292mm Shaker plinth (`1.938m -> 2.230m`)
    const doorBaseY = bed3FloorY + 0.15;
    const corniceClearance = 0.046;
    const doorSpanW = wardW - 0.12;
    const doorStep = doorSpanW / 4;
    for (let i = 0; i < 4; i++) {
      const x0 = wardMinX + 0.06 + i * doorStep + 0.005;
      const x1 = wardMinX + 0.06 + (i + 1) * doorStep - 0.005;
      const doorW = x1 - x0;
      const doorX = (x0 + x1) / 2;
      const hLeft = getBed3VaultCeilingYAtX(x0) - corniceClearance - doorBaseY;
      const hRight = getBed3VaultCeilingYAtX(x1) - corniceClearance - doorBaseY;
      const maxDoorH = Math.max(hLeft, hRight);
      const dIdx = bed3WardGroup.children.length;
      addShakerWardrobeDoor(bed3WardGroup, {
        x: doorX,
        y: doorBaseY + maxDoorH / 2,
        z: 4.448,
        width: doorW,
        height: maxDoorH,
        heightLeft: hLeft,
        heightRight: hRight,
        alongZ: false,
        normalSign: 1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `bedroom3.northWardrobe.door_${i + 1}`,
      });
      ensureNamedAddedChildren(
        bed3WardGroup,
        dIdx,
        `bedroom3.northWardrobe.door_${i + 1}`,
        true
      );
    }

    // 142mm Solid Oak Step Riser & Bullnose Nosing at `Z = +4.68m` (`Y = 1.938m -> 2.080m`) into Bedroom 3's sunken NW wardrobe alcove!
    {
      const alcoveSpanX = wardMaxX - wardMinX;
      const alcoveCenterX = (wardMinX + wardMaxX) * 0.5;
      const alcoveRise = bed3FloorY - bed3AlcoveFloorY; // 0.142m
      const alcoveRiserGeo = new THREE.BoxGeometry(alcoveSpanX, alcoveRise, 0.028);
      alcoveRiserGeo.computeBoundingSphere();
      const alcoveRiser = new THREE.Mesh(alcoveRiserGeo, oakFloorMat);
      alcoveRiser.name = 'bedroom3.alcoveStep.riser';
      alcoveRiser.userData.isArchitecturalShell = true;
      alcoveRiser.position.set(alcoveCenterX, bed3AlcoveFloorY + alcoveRise * 0.5, 4.666);
      alcoveRiser.castShadow = true;
      alcoveRiser.receiveShadow = true;
      scene.add(alcoveRiser);

      const alcoveNosingGeo = new THREE.CylinderGeometry(0.015, 0.015, alcoveSpanX, 14);
      alcoveNosingGeo.rotateZ(Math.PI / 2);
      alcoveNosingGeo.computeBoundingSphere();
      const alcoveNosing = new THREE.Mesh(alcoveNosingGeo, antiqueOakSkirtingMat);
      alcoveNosing.name = 'bedroom3.alcoveStep.nosing';
      alcoveNosing.userData.isArchitecturalShell = true;
      alcoveNosing.position.set(alcoveCenterX, bed3FloorY - 0.014, 4.652);
      alcoveNosing.castShadow = true;
      tagHighLodDetail(alcoveNosing);
      scene.add(alcoveNosing);

      const sunkenSkirtGeo = buildMitredWallSkirtingGeometry(
        [
          [-22.19, 4.66],
          [-22.19, 4.435],
          [-20.31, 4.435],
          [-20.31, 4.66],
        ],
        bed3AlcoveFloorY
      );
      sunkenSkirtGeo.computeBoundingSphere();
      const sunkenSkirt = new THREE.Mesh(sunkenSkirtGeo, antiqueOakSkirtingMat);
      sunkenSkirt.name = 'bedroom3.alcoveMitredSkirting';
      sunkenSkirt.userData.isArchitecturalShell = true;
      sunkenSkirt.receiveShadow = true;
      scene.add(sunkenSkirt);
    }

    // Vaulted dividing walls sealing `Z = 3.82m` (`4.815m` North / `5.05m` South), `X = -20.235m` (`1.938m..5.05m`), and `Z = 4.68m` (`2.075m..5.05m/4.12m`)
    const showerSouthUpperShape = new THREE.Shape();
    showerSouthUpperShape.moveTo(-22.19, showerWestEavesY);
    showerSouthUpperShape.lineTo(-20.16, showerWestEavesY);
    showerSouthUpperShape.lineTo(-20.16, showerCollarY);
    showerSouthUpperShape.lineTo(bed3CollarWestX, showerCollarY);
    showerSouthUpperShape.closePath();
    const showerSouthUpperGeo = new THREE.ExtrudeGeometry(showerSouthUpperShape, {
      depth: 0.075,
      bevelEnabled: false,
    });
    showerSouthUpperGeo.translate(0, 0, 3.82 - 0.075);
    showerSouthUpperGeo.computeBoundingSphere();
    const showerSouthUpperWall = new THREE.Mesh(showerSouthUpperGeo, warmRoomPlasterMat);
    showerSouthUpperWall.name = 'showerRoom.southWestUpperGable';
    showerSouthUpperWall.userData.isArchitecturalShell = true;
    showerSouthUpperWall.castShadow = true;
    showerSouthUpperWall.receiveShadow = true;
    scene.add(showerSouthUpperWall);

    const northAlcoveGableShape = new THREE.Shape();
    northAlcoveGableShape.moveTo(-22.19, bed3WestEavesY);
    northAlcoveGableShape.lineTo(-20.16, bed3WestEavesY);
    northAlcoveGableShape.lineTo(-20.16, bed3CollarY);
    northAlcoveGableShape.lineTo(bed3CollarWestX, bed3CollarY);
    northAlcoveGableShape.closePath();
    const northAlcoveGableGeo = new THREE.ExtrudeGeometry(northAlcoveGableShape, {
      depth: 0.075,
      bevelEnabled: false,
    });
    northAlcoveGableGeo.translate(0, 0, 3.82);
    northAlcoveGableGeo.computeBoundingSphere();
    const northAlcoveGable = new THREE.Mesh(northAlcoveGableGeo, warmRoomPlasterMat);
    northAlcoveGable.name = 'bedroom3.northAlcoveUpperGable';
    northAlcoveGable.userData.isArchitecturalShell = true;
    northAlcoveGable.castShadow = true;
    northAlcoveGable.receiveShadow = true;
    scene.add(northAlcoveGable);

    const alcoveSideUpperWallGeo = new THREE.BoxGeometry(
      0.15,
      bed3CollarY - bed3AlcoveFloorY,
      4.68 - 3.895
    );
    alcoveSideUpperWallGeo.computeBoundingSphere();
    const alcoveSideUpperWall = new THREE.Mesh(
      alcoveSideUpperWallGeo,
      warmRoomPlasterMat
    );
    alcoveSideUpperWall.name = 'bedroom3.alcoveSideUpperGable';
    alcoveSideUpperWall.userData.isArchitecturalShell = true;
    alcoveSideUpperWall.position.set(
      -20.235,
      (bed3AlcoveFloorY + bed3CollarY) / 2,
      (3.895 + 4.68) / 2
    );
    alcoveSideUpperWall.castShadow = true;
    alcoveSideUpperWall.receiveShadow = true;
    scene.add(alcoveSideUpperWall);

    const showerSouthGableShape = new THREE.Shape();
    showerSouthGableShape.moveTo(-20.31, showerFloorY);
    showerSouthGableShape.lineTo(-18.285, showerFloorY);
    showerSouthGableShape.lineTo(-18.285, bed3EastEavesY);
    showerSouthGableShape.lineTo(bed3CollarEastX, bed3CollarY);
    showerSouthGableShape.lineTo(-20.31, bed3CollarY);
    showerSouthGableShape.closePath();
    const showerSouthGableGeo = new THREE.ExtrudeGeometry(showerSouthGableShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    showerSouthGableGeo.translate(0, 0, 4.68 - 0.075);
    showerSouthGableGeo.computeBoundingSphere();
    const showerSouthGable = new THREE.Mesh(showerSouthGableGeo, warmRoomPlasterMat);
    showerSouthGable.name = 'bedroom3.showerSouthUpperGable';
    showerSouthGable.userData.isArchitecturalShell = true;
    showerSouthGable.castShadow = true;
    showerSouthGable.receiveShadow = true;
    scene.add(showerSouthGable);

    // Continuous 45°-mitred skirting on Bedroom 3's `2.08m` main floor along the South shower wall (`Z = +4.755m`) and East corridor wall (`X = -18.285m`)
    const bed3NorthSkirtGeo = buildMitredWallSkirtingGeometry(
      [
        [-20.31, 4.68],
        [-20.31, 4.755],
        [-18.285, 4.755],
        [-18.285, 6.855],
      ],
      bed3FloorY
    );
    bed3NorthSkirtGeo.computeBoundingSphere();
    const bed3NorthSkirt = new THREE.Mesh(
      bed3NorthSkirtGeo,
      antiqueOakSkirtingMat
    );
    bed3NorthSkirt.name = 'bedroom3.northWallMitredSkirting';
    bed3NorthSkirt.userData.isArchitecturalShell = true;
    bed3NorthSkirt.castShadow = true;
    bed3NorthSkirt.receiveShadow = true;
    scene.add(bed3NorthSkirt);

    scene.add(bed3WardGroup);
  }
}
