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
 * West wing upper corridor, trapezoidal upstairs shower room and walk-in cupboard.
 */
export function buildWestWingCorridor(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addShakerWardrobeDoor,
    addUpperBrickWallAlongZWithWindow,
    antiqueOakSkirtingMat,
    bathroomTileMat,
    brassMat,
    ceramicWhiteMat,
    doorH,
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
  buildPolygonalFloorSlab(
    scene,
    [
      [-18.995, 0.975],
      [-17.65, 0.975],
      [landingSouthWestX, landingSouthWestZ],
      [-16.83, landingSouthEastZ],
      [-17.09, 8.27],
      [-18.475, 8.27],
      [-18.475, 4.1],
      [-18.995, 4.1],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );

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

    const riserMesh = new THREE.Mesh(
      new THREE.BoxGeometry(stepLen, stepRise, 0.028),
      oakFloorMat
    );
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
    const nosingMesh = new THREE.Mesh(nosingGeo, oakFloorMat);
    nosingMesh.name = 'westWingCorridor.upStepToLanding.nosing';
    nosingMesh.position.set(0, stepRise - 0.014, 0.012);
    nosingMesh.castShadow = true;
    nosingMesh.receiveShadow = true;
    stepGroup.add(nosingMesh);

    scene.add(stepGroup);
  }

  // Trapezoidal Shower Room polygonal tiled floor (Issues #3 & #4: widened South to Z = +4.10m, with Walk-In Shower stall at `X = -20.25m..-18.40m, Z = +4.10m..+4.85m`)
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.33, 1.905],
      [-18.85, 2.34],
      [-18.85, 4.1],
      [-18.4, 4.1],
      [-18.4, 4.85],
      [-20.25, 4.85],
      [-20.25, 4.175],
      [-22.33, 4.175],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    bathroomTileMat,
    0.5
  );

  // West Front Exterior Brick Wall of Upstairs Shower Room (X = -22.47m..-22.19m, Z = +1.905m..+4.85m)
  // With 2-pane Georgian casement window centered at Z = +2.92m (directly above the Front Entrance Door IN — Photo 2!)
  // Skirting clamped to [2.045, 4.025] inside the dry Shower Room
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    1.905,
    4.85,
    2.92,
    0.96,
    2.92,
    3.94,
    'east',
    2,
    { skirtingMin: 2.045, skirtingMax: 4.025 }
  );

  // Continuous Flat East Courtyard Exterior Brick Wall along the West Wing Upper Corridor (Z = +2.74m..+8.15m)
  addUpperBrickWallAlongZWithWindow(
    -17.39,
    -17.11,
    2.74,
    8.15,
    5.92,
    1.45,
    2.92,
    3.94,
    'west',
    3,
    { skipSkirting: true }
  );

  // Continuous 45°-mitred antique oak skirting along the East & North-East wall of the West Wing Corridor (Y = 2.08m)
  {
    const eastWallSlope = (-17.25 - -16.82) / (11.77 - 2.4);
    const getEastInnerX = (wz: number): number =>
      -16.82 + eastWallSlope * (wz - 2.4) - 0.14;

    const eastCorridorSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [portalSouthArchX, portalSouthArchZ],
          [landingSouthWestX, landingSouthWestZ],
          [getEastInnerX(landingSouthEastZ), landingSouthEastZ],
          [getEastInnerX(8.15), 8.15],
          [-17.276, 8.15],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    eastCorridorSkirt.name = 'westWingCorridor.eastWallMitredSkirting';
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

  // =========================================================================
  // CUT-OUT NORTH HALLWAY & UPSTAIRS SHOWER ROOM (`X = -22.19m..-18.92m, Z = +1.905m/+2.34m..+4.10m`
  // + Walk-In Shower Stall `X = -20.25m..-18.40m, Z = +4.10m..+4.85m`)
  // =========================================================================
  // 1a. Orthogonal 90° North End Wall of the Cut-Out Hallway (`Z = +1.05m, X = -18.995m..-17.65m`, 0.15m thick: `Z = 0.975m..1.125m`)
  //     Starts at `X = -18.995m` (100% flush with the West face of the `X = -18.92m` wall!) so there is zero corner notch (Issue #6)!
  //     `skipCap: true` so no dark brown wall cap protrudes between the lower wall and `bedroom2.cutoutNorthWallUpperGable` (Issue #8)!
  buildAngledWallSegment(scene, interactions, {
    start: [-18.995, 1.05],
    end: [-17.65, 1.05],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Hallway side uses continuous 45°-mitred skirting in bedroom-3.ts
    addBackSkirting: false,  // Bedroom 2 side uses continuous 45°-mitred skirting in bedroom-2.ts
  });

  // 1b. Continuous West Wall of the Cut-Out Hallway & `UP` Lobby (`X = -18.92m, Z = +0.975m..+4.10m`, length = 3.125m)
  //     Widened West to `X = -18.92m` and extended South to `Z = +4.10m` (Issues #3 & #4)!
  //     Contains BOTH `bedroom2Door` (`uCenter = 0.70m`, `Z = 1.675m`) and `showerRoomDoor` (`uCenter = 2.345m`, `Z = 3.32m`)!
  //     `skipCapRanges: [[0, 1.365]]` omits the Y = 4.16m cap under `bedroom2.cutoutWestWallUpperGable` (`Z = 0.975m..2.34m`, Issue #8)!
  buildAngledWallSegment(scene, interactions, {
    start: [-18.92, 0.975],
    end: [-18.92, 4.1],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCapRanges: [[0, 1.365]],
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,  // West (`-X`) face inside dry Shower Room South of `showerRoomDoor` (`u = 2.767m..3.025m`)
    frontSkirtingExclusions: [
      [0, 1.94],    // North of `showerRoomDoor`, `bedroom2` & `showerRoom.northEastMitredSkirting` provide continuous 45°-mitred skirtings (Issue #12)
      [3.025, 3.125],
    ],
    addBackSkirting: false,  // East (`+X`) Hallway/Lobby face uses continuous 45°-mitred skirting in bedroom-3.ts
    openings: [
      {
        id: 'bedroom2Door',
        kind: 'hinged-door',
        uCenter: 0.7,
        width: 0.72,
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
      {
        id: 'showerRoomDoor',
        kind: 'hinged-door',
        uCenter: 2.345,
        width: 0.68,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
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

  // Issue #12 ("Bad mitre" at `[-19.044, 2.193, 2.487]`): Single continuous 45°-mitred skirting board along the
  // Shower Room North wall (East of `bedroom2EnsuiteDoor`) turning South at the NE corner (`[-18.995, 2.47]`)
  // to meet the North architrave of `showerRoomDoor` (`[-18.995, 2.898]`)!
  {
    const showerNorthEastSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-21.258, 2.169],
          [-18.995, 2.47],
          [-18.995, 2.898],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    showerNorthEastSkirt.name = 'showerRoom.northEastMitredSkirting';
    showerNorthEastSkirt.userData.isArchitecturalShell = true;
    showerNorthEastSkirt.castShadow = true;
    showerNorthEastSkirt.receiveShadow = true;
    scene.add(showerNorthEastSkirt);
  }

  // 2. Straight Z = +4.10m Partition Wall (Issue #4: shifted 0.55m South to give Shower Room generous width):
  //    2a. West section behind Vanity Basin & WC (`Z = +4.10m, X = -22.19m..-20.18m`)
  //        Issue #11: Zero `backSkirtingExclusions` at `u = 0..0.14` so the Shower Room South wall skirting reaches `X = -22.19m` in the SW corner!
  buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 4.1],
    end: [-20.18, 4.1],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // South (`+Z`) face is inside Bedroom 3's built-in wardrobe
    addBackSkirting: true,   // North (`-Z`) face inside the dry Shower Room (full span to X = -22.19m — Issue #11!)
  });

  //    2b. East section forming the North wall of the Walk-In Shower & South wall of the `UP` Lobby (`Z = +4.10m, X = -19.32m..-18.325m`)
  //        (Leaves `X = -20.18m..-19.32m` open as the 0.86m arched step-up entry into the shower from inside the Shower Room!)
  buildAngledWallSegment(scene, interactions, {
    start: [-19.32, 4.1],
    end: [-18.325, 4.1],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // South (`+Z`) face is inside the wet Walk-In Shower
    addBackSkirting: true,   // North (`-Z`) face inside the dry Shower Room (`X = -19.32m..-18.995m`), omitting Lobby side
    backSkirtingExclusions: [[0.325, 0.995]],
  });

  // 3. Dividing Wall (`X = -20.25m, Z = +4.10m..+4.85m`) between Walk-In Shower Stall (East) and Bedroom 3 North Wardrobe (West)
  buildAngledWallSegment(scene, interactions, {
    start: [-20.25, 4.1],
    end: [-20.25, 4.85],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false,
    addBackSkirting: false,
  });

  // 4. South Wall of Walk-In Shower Stall (`Z = +4.85m, X = -20.325m..-18.475m`)
  buildAngledWallSegment(scene, interactions, {
    start: [-20.325, 4.85],
    end: [-18.475, 4.85],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skipCap: true,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Bedroom 3 emits one continuous North & East mitred skirting across wardrobe, shower wall, and East wall
    addBackSkirting: false,  // North (`-Z`) face inside the wet Walk-In Shower
  });

  // =========================================================================
  // ISSUE #3 & #5: STEP-UP WALK-IN SHOWER TRAY & PLASTERED ARCHWAY ENTRANCE
  // ("This isn't glass, there is a shower tray and you step up into it, its an arch"
  //  + Issue #5: Pure ExtrudeGeometry arch header with zero CylinderGeometry artifact!)
  // =========================================================================
  {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'showerRoom.stepUpArchShower';

    // 1. Plastered Archway Header (`showerRoom.showerArch`) over the `X = -20.18m..-19.32m` (`width = 0.86m`) entrance at `Z = +4.10m`
    const archLeftX = -20.18;
    const archRightX = -19.32;
    const archCenterX = (archLeftX + archRightX) / 2; // -19.75m
    const archSpan = archRightX - archLeftX; // 0.86m
    const archRadius = archSpan / 2; // 0.43m
    const archSpringY = floorTopY + 1.58; // 3.66m springing line
    const archWallD = 0.15;

    const archSpandrelShape = new THREE.Shape();
    archSpandrelShape.moveTo(-archRadius, archSpringY);
    archSpandrelShape.absarc(0, archSpringY, archRadius, Math.PI, 0, true);
    archSpandrelShape.lineTo(archRadius, upperWallTopY);
    archSpandrelShape.lineTo(-archRadius, upperWallTopY);
    archSpandrelShape.closePath();

    const archSpandrelGeo = new THREE.ExtrudeGeometry(archSpandrelShape, {
      depth: archWallD,
      bevelEnabled: false,
      curveSegments: 32,
    });
    archSpandrelGeo.translate(archCenterX, 0, 4.1 - archWallD / 2);
    const archSpandrelMesh = new THREE.Mesh(archSpandrelGeo, warmRoomPlasterMat);
    archSpandrelMesh.name = 'showerRoom.showerArch';
    archSpandrelMesh.userData.isArchitecturalShell = true;
    archSpandrelMesh.castShadow = true;
    archSpandrelMesh.receiveShadow = true;
    showerGroup.add(archSpandrelMesh);

    const archCapMesh = new THREE.Mesh(
      new THREE.BoxGeometry(archSpan + 0.008, 0.025, archWallD + 0.004),
      wallCapMat
    );
    archCapMesh.userData.isArchitecturalShell = true;
    archCapMesh.position.set(archCenterX, upperWallTopY + 0.012, 4.1);
    showerGroup.add(archCapMesh);

    // 2. Step-Up Tiled Shower Plinth (`0.14m` high, `Y = 2.08m..2.22m`) & Ceramic Step-Up Shower Tray (`Y = 2.22m..2.26m`)
    const plinthH = 0.14;
    const trayW = 1.7; // X = -20.175m..-18.475m
    const trayD = 0.675; // Z = +4.10m..+4.775m
    const trayCenterX = -19.325;
    const trayCenterZ = 4.4375;

    const showerStepPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(trayW, plinthH, trayD),
      bathroomTileMat
    );
    showerStepPlinth.name = 'showerRoom.showerStepPlinth';
    showerStepPlinth.position.set(trayCenterX, floorTopY + plinthH / 2, trayCenterZ);
    showerStepPlinth.castShadow = true;
    showerStepPlinth.receiveShadow = true;
    showerGroup.add(showerStepPlinth);

    const archStepRiser = new THREE.Mesh(
      new THREE.BoxGeometry(archSpan, plinthH, 0.08),
      bathroomTileMat
    );
    archStepRiser.name = 'showerRoom.showerStepArchRiser';
    archStepRiser.position.set(archCenterX, floorTopY + plinthH / 2, 4.06);
    archStepRiser.castShadow = true;
    archStepRiser.receiveShadow = true;
    showerGroup.add(archStepRiser);

    // Ceramic step-up threshold lip across the arch opening (`X = -20.18m..-19.32m, Z = 4.10m`)
    const stepNosing = new THREE.Mesh(
      new THREE.BoxGeometry(archSpan, 0.028, 0.165),
      ceramicWhiteMat
    );
    stepNosing.name = 'showerRoom.showerStepThreshold';
    stepNosing.position.set(archCenterX, floorTopY + plinthH + 0.014, 4.1);
    stepNosing.castShadow = true;
    stepNosing.receiveShadow = true;
    showerGroup.add(stepNosing);

    // Raised white stone-resin shower tray with perimeter upstands & recessed standing well
    const trayBaseY = floorTopY + plinthH;
    const srShowerTray = new THREE.Mesh(
      new THREE.BoxGeometry(trayW, 0.042, trayD),
      ceramicWhiteMat
    );
    srShowerTray.name = 'showerRoom.showerTray';
    srShowerTray.position.set(trayCenterX, trayBaseY + 0.021, trayCenterZ);
    srShowerTray.castShadow = true;
    srShowerTray.receiveShadow = true;
    showerGroup.add(srShowerTray);

    const trayRecessedWell = new THREE.Mesh(
      new THREE.BoxGeometry(trayW - 0.14, 0.012, trayD - 0.12),
      new THREE.MeshStandardMaterial({ color: 0xebeae4, roughness: 0.22, metalness: 0.04 })
    );
    trayRecessedWell.position.set(trayCenterX, trayBaseY + 0.043, trayCenterZ);
    showerGroup.add(trayRecessedWell);

    // Aged-brass square shower waste grate
    const showerDrainGrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.014, 0.11),
      brassMat
    );
    showerDrainGrate.name = 'showerRoom.showerDrainGrate';
    showerDrainGrate.position.set(-18.77, trayBaseY + 0.044, trayCenterZ);
    showerGroup.add(showerDrainGrate);

    // Exposed traditional aged-brass thermostatic rainfall & hand-shower column on the East wall (`X = -18.475m`)
    const srShowerRiser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.08, 12),
      brassMat
    );
    srShowerRiser.position.set(-18.53, trayBaseY + 1.42, trayCenterZ);
    showerGroup.add(srShowerRiser);

    const showerValveBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.24, 14),
      brassMat
    );
    showerValveBar.rotation.x = Math.PI / 2;
    showerValveBar.position.set(-18.52, trayBaseY + 1.02, trayCenterZ);
    showerGroup.add(showerValveBar);

    const rainfallRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.024, 20),
      brassMat
    );
    rainfallRose.name = 'showerRoom.rainfallShowerRose';
    rainfallRose.position.set(-18.77, trayBaseY + 1.92, trayCenterZ);
    showerGroup.add(rainfallRose);

    const rainfallArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.26, 10),
      brassMat
    );
    rainfallArm.rotation.z = Math.PI / 2;
    rainfallArm.position.set(-18.64, trayBaseY + 1.95, trayCenterZ);
    showerGroup.add(rainfallArm);

    scene.add(showerGroup);
  }

  // =========================================================================
  // ISSUE #4: BESPOKE PERIOD SHAKER VANITY UNIT & HIGH-LOD EDWARDIAN LOW-LEVEL TOILET
  // ("Use the same toilet / sink as downstairs toilet" — mounted on Z = +4.025m South wall facing North `-Z`)
  // =========================================================================
  {
    const fixturesGroup = new THREE.Group();
    fixturesGroup.name = 'showerRoom.sanitaryware';
    // Local frame with origin at (0, floorTopY, 4.025) and rotation.y = Math.PI / 2:
    //   local +X -> world -Z (North, projecting out from the Z = 4.025m wall into the Shower Room)
    //   local +Z -> world +X (East along the Z = 4.025m wall)
    fixturesGroup.position.set(0, floorTopY, 4.025);
    fixturesGroup.rotation.y = Math.PI / 2;

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

    const vanityPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD - 0.02, 0.085, vanityW + 0.016),
      vanityTrimMat
    );
    vanityPlinth.position.set((vanityD - 0.02) / 2, 0.0425, vanityZ);
    vanityPlinth.castShadow = true;
    vanityPlinth.receiveShadow = true;
    fixturesGroup.add(vanityPlinth);

    const vanityCab = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD, vanityCarcassH - 0.08, vanityW),
      vanityCabinetMat
    );
    vanityCab.name = 'showerRoom.vanityCabinet';
    vanityCab.position.set(vanityD / 2, 0.44, vanityZ);
    vanityCab.castShadow = true;
    vanityCab.receiveShadow = true;
    fixturesGroup.add(vanityCab);

    for (const sideZ of [-1, 1] as const) {
      const doorZ = vanityZ + sideZ * 0.18;
      const shakerDoorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.62, 0.34),
        vanityTrimMat
      );
      shakerDoorFrame.position.set(vanityD + 0.008, 0.44, doorZ);
      shakerDoorFrame.castShadow = true;
      fixturesGroup.add(shakerDoorFrame);

      const shakerDoorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.5, 0.24),
        vanityCabinetMat
      );
      shakerDoorPanel.position.set(vanityD + 0.015, 0.44, doorZ);
      fixturesGroup.add(shakerDoorPanel);

      const doorKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 12, 12),
        brassMat
      );
      doorKnob.position.set(vanityD + 0.032, 0.52, vanityZ + sideZ * 0.045);
      fixturesGroup.add(doorKnob);
    }

    const basinSlab = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD + 0.03, 0.042, vanityW + 0.04),
      marbleCounterMat
    );
    basinSlab.name = 'showerRoom.sinkBasin';
    basinSlab.position.set((vanityD + 0.03) / 2, 0.821, vanityZ);
    basinSlab.castShadow = true;
    basinSlab.receiveShadow = true;
    fixturesGroup.add(basinSlab);

    const marbleUpstand = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.11, vanityW + 0.04),
      marbleCounterMat
    );
    marbleUpstand.position.set(0.012, 0.897, vanityZ);
    marbleUpstand.castShadow = true;
    fixturesGroup.add(marbleUpstand);

    const basinRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.016, 0.48),
      ceramicWhiteMat
    );
    basinRim.position.set(0.26, 0.843, vanityZ);
    fixturesGroup.add(basinRim);

    const basinWell = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.018, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.14, metalness: 0.06 })
    );
    basinWell.position.set(0.26, 0.846, vanityZ);
    fixturesGroup.add(basinWell);

    const tapStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.16, 14),
      brassMat
    );
    tapStem.position.set(0.085, 0.92, vanityZ);
    fixturesGroup.add(tapStem);

    const tapSpout = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.018, 0.02),
      brassMat
    );
    tapSpout.position.set(0.145, 0.99, vanityZ);
    fixturesGroup.add(tapSpout);

    for (const valveZ of [vanityZ - 0.11, vanityZ + 0.11] as const) {
      const valveBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.065, 12),
        brassMat
      );
      valveBody.position.set(0.085, 0.875, valveZ);
      fixturesGroup.add(valveBody);

      const crossBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.01, 0.052),
        brassMat
      );
      crossBar.position.set(0.085, 0.91, valveZ);
      fixturesGroup.add(crossBar);
    }

    const mirrorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.84, 0.66),
      brassMat
    );
    mirrorFrame.name = 'showerRoom.mirrorFrame';
    mirrorFrame.position.set(0.024, 1.42, vanityZ);
    mirrorFrame.castShadow = true;
    fixturesGroup.add(mirrorFrame);

    const mirrorSurface = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.78, 0.6),
      mirrorGlassMat
    );
    mirrorSurface.name = 'showerRoom.mirror';
    mirrorSurface.position.set(0.036, 1.42, vanityZ);
    fixturesGroup.add(mirrorSurface);

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
    const wcPanPedestal = new THREE.Mesh(
      new THREE.LatheGeometry(pedestalFootPts, 24),
      vitreousChinaMat
    );
    wcPanPedestal.name = 'showerRoom.toiletPedestal';
    wcPanPedestal.position.set(panCenterX - 0.015, 0.01, toiletZ);
    wcPanPedestal.scale.set(1.26, 1.0, 0.88);
    wcPanPedestal.castShadow = true;
    wcPanPedestal.receiveShadow = true;
    fixturesGroup.add(wcPanPedestal);

    for (const boltSideZ of [-1, 1] as const) {
      const floorBolt = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 10, 10),
        brassMat
      );
      floorBolt.position.set(panCenterX - 0.015, 0.026, toiletZ + boltSideZ * 0.116);
      fixturesGroup.add(floorBolt);
    }

    const soilPipeShroud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.058, 0.22, 16),
      vitreousChinaMat
    );
    soilPipeShroud.rotation.z = Math.PI / 2;
    soilPipeShroud.position.set(0.11, 0.185, toiletZ);
    soilPipeShroud.castShadow = true;
    fixturesGroup.add(soilPipeShroud);

    const soilWallCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.076, 0.08, 0.026, 18),
      vitreousChinaMat
    );
    soilWallCollar.rotation.z = Math.PI / 2;
    soilWallCollar.position.set(0.013, 0.185, toiletZ);
    fixturesGroup.add(soilWallCollar);

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
    const wcPanBowl = new THREE.Mesh(
      new THREE.LatheGeometry(bowlProfilePts, 28),
      vitreousChinaMat
    );
    wcPanBowl.name = 'showerRoom.toiletPan';
    wcPanBowl.position.set(panCenterX, 0, toiletZ);
    wcPanBowl.scale.set(1.18, 1.0, 0.95);
    wcPanBowl.castShadow = true;
    wcPanBowl.receiveShadow = true;
    fixturesGroup.add(wcPanBowl);

    const innerWellLiner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.138, 0.068, 0.16, 24, 1, true),
      innerBowlGlazeMat
    );
    innerWellLiner.position.set(panCenterX, 0.285, toiletZ);
    innerWellLiner.scale.set(1.16, 1.0, 0.93);
    fixturesGroup.add(innerWellLiner);

    const waterSealDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.072, 0.008, 22),
      waterSealMat
    );
    waterSealDisc.name = 'showerRoom.waterSeal';
    waterSealDisc.position.set(panCenterX - 0.01, 0.224, toiletZ);
    waterSealDisc.scale.set(1.15, 1.0, 0.92);
    fixturesGroup.add(waterSealDisc);

    const rearPanDeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.048, 0.25),
      vitreousChinaMat
    );
    rearPanDeck.position.set(panCenterX - 0.185, 0.38, toiletZ);
    rearPanDeck.castShadow = true;
    fixturesGroup.add(rearPanDeck);

    const rearInletHorn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.044, 0.07, 16),
      vitreousChinaMat
    );
    rearInletHorn.rotation.z = Math.PI / 2;
    rearInletHorn.position.set(panCenterX - 0.255, 0.382, toiletZ);
    fixturesGroup.add(rearInletHorn);

    const wcSeat = new THREE.Mesh(
      new THREE.TorusGeometry(0.164, 0.027, 18, 36),
      walnutSeatMat
    );
    wcSeat.name = 'showerRoom.toiletSeat';
    wcSeat.rotation.x = Math.PI / 2;
    wcSeat.position.set(panCenterX + 0.006, 0.418, toiletZ);
    wcSeat.scale.set(1.17, 0.95, 0.36);
    wcSeat.castShadow = true;
    wcSeat.receiveShadow = true;
    fixturesGroup.add(wcSeat);

    const walnutHingeBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.018, 0.21),
      walnutSeatMat
    );
    walnutHingeBlock.position.set(panCenterX - 0.175, 0.418, toiletZ);
    walnutHingeBlock.castShadow = true;
    fixturesGroup.add(walnutHingeBlock);

    for (const hingeSideZ of [-1, 1] as const) {
      const hingePillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.015, 0.034, 12),
        brassMat
      );
      hingePillar.position.set(panCenterX - 0.182, 0.418, toiletZ + hingeSideZ * 0.078);
      fixturesGroup.add(hingePillar);
    }
    const hingeCrossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12),
      brassMat
    );
    hingeCrossBar.rotation.x = Math.PI / 2;
    hingeCrossBar.position.set(panCenterX - 0.182, 0.426, toiletZ);
    fixturesGroup.add(hingeCrossBar);

    const cisternCenterX = 0.11;
    const cisternBaseY = 0.73;
    const cisternH = 0.31;
    const cisternW = 0.46;
    const cisternD = 0.2;

    const cisternLowerSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD - 0.016, 0.028, cisternW - 0.02),
      vitreousChinaMat
    );
    cisternLowerSkirt.position.set(cisternCenterX - 0.005, cisternBaseY + 0.014, toiletZ);
    cisternLowerSkirt.castShadow = true;
    fixturesGroup.add(cisternLowerSkirt);

    const wcCistern = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD, cisternH - 0.028, cisternW),
      vitreousChinaMat
    );
    wcCistern.name = 'showerRoom.cistern';
    wcCistern.position.set(cisternCenterX, cisternBaseY + 0.028 + (cisternH - 0.028) / 2, toiletZ);
    wcCistern.castShadow = true;
    wcCistern.receiveShadow = true;
    fixturesGroup.add(wcCistern);

    const cisternFrontPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.19, 0.36),
      vitreousChinaMat
    );
    cisternFrontPanel.position.set(cisternCenterX + cisternD / 2 + 0.004, cisternBaseY + 0.165, toiletZ);
    fixturesGroup.add(cisternFrontPanel);

    const makerBadgeRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.008, 16),
      brassMat
    );
    makerBadgeRim.rotation.z = Math.PI / 2;
    makerBadgeRim.position.set(cisternCenterX + cisternD / 2 + 0.011, cisternBaseY + 0.17, toiletZ);
    makerBadgeRim.scale.set(1.0, 1.35, 0.72);
    fixturesGroup.add(makerBadgeRim);

    const cisternCorniceStep = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD + 0.022, 0.024, cisternW + 0.026),
      vitreousChinaMat
    );
    cisternCorniceStep.position.set(cisternCenterX + 0.004, cisternBaseY + cisternH + 0.012, toiletZ);
    cisternCorniceStep.castShadow = true;
    fixturesGroup.add(cisternCorniceStep);

    const cisternLid = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD + 0.006, 0.022, cisternW + 0.008),
      vitreousChinaMat
    );
    cisternLid.name = 'showerRoom.cisternLid';
    cisternLid.position.set(cisternCenterX + 0.002, cisternBaseY + cisternH + 0.034, toiletZ);
    cisternLid.castShadow = true;
    fixturesGroup.add(cisternLid);

    for (const brkSideZ of [-1, 1] as const) {
      const brkZ = toiletZ + brkSideZ * 0.155;
      const wallLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.13, 0.024),
        brassMat
      );
      wallLeg.position.set(0.014, cisternBaseY - 0.055, brkZ);
      fixturesGroup.add(wallLeg);

      const topArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.165, 0.014, 0.022),
        brassMat
      );
      topArm.position.set(0.09, cisternBaseY - 0.004, brkZ);
      fixturesGroup.add(topArm);

      const scrollStrut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10),
        brassMat
      );
      scrollStrut.rotation.z = -0.82;
      scrollStrut.position.set(0.075, cisternBaseY - 0.055, brkZ);
      fixturesGroup.add(scrollStrut);
    }

    const leverZ = toiletZ + 0.155;
    const leverY = cisternBaseY + 0.235;
    const leverFulcrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.026, 14),
      brassMat
    );
    leverFulcrum.rotation.z = Math.PI / 2;
    leverFulcrum.position.set(cisternCenterX + cisternD / 2 + 0.016, leverY, leverZ);
    fixturesGroup.add(leverFulcrum);

    const leverArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.075, 10),
      brassMat
    );
    leverArm.rotation.x = Math.PI / 2;
    leverArm.rotation.z = -0.22;
    leverArm.position.set(cisternCenterX + cisternD / 2 + 0.032, leverY - 0.008, leverZ + 0.032);
    fixturesGroup.add(leverArm);

    const ceramicTorpedoHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.009, 0.068, 14),
      vitreousChinaMat
    );
    ceramicTorpedoHandle.name = 'showerRoom.flushLever';
    ceramicTorpedoHandle.rotation.x = Math.PI / 2;
    ceramicTorpedoHandle.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.078);
    ceramicTorpedoHandle.castShadow = true;
    fixturesGroup.add(ceramicTorpedoHandle);

    const handleFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 10, 10),
      brassMat
    );
    handleFinial.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.114);
    fixturesGroup.add(handleFinial);

    const flushPipeX = 0.125;
    const cisternNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.026, 14),
      brassMat
    );
    cisternNut.position.set(flushPipeX, cisternBaseY - 0.012, toiletZ);
    fixturesGroup.add(cisternNut);

    const flushPipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(flushPipeX, cisternBaseY, toiletZ),
      new THREE.Vector3(flushPipeX, 0.43, toiletZ),
      new THREE.Vector3(flushPipeX + 0.02, 0.385, toiletZ),
      new THREE.Vector3(panCenterX - 0.25, 0.382, toiletZ),
    ]);
    const flushPipe = new THREE.Mesh(
      new THREE.TubeGeometry(flushPipeCurve, 18, 0.019, 12, false),
      brassMat
    );
    flushPipe.name = 'showerRoom.flushPipe';
    flushPipe.castShadow = true;
    fixturesGroup.add(flushPipe);

    scene.add(fixturesGroup);
  }

  // =========================================================================
  // BEDROOM 3 BUILT-IN NORTH WARDROBE (`X = -22.19m..-20.325m, Z = +4.175m..+4.715m`)
  // Slightly inset 18cm into the North alcove rather than taking up the full depth to `Z = +4.925m` (Issues #4, #7 & #15)
  // =========================================================================
  {
    const bed3WardGroup = new THREE.Group();
    bed3WardGroup.name = 'bedroom3.northWardrobe';
    const wardMinX = -22.19;
    const wardMaxX = -20.325;
    const wardW = wardMaxX - wardMinX; // 1.865m
    const wardD = 0.54; // Z = +4.175m .. +4.715m (inset 21cm from Z = +4.925m alcove front)
    const centerZ = 4.445;
    const bed3CollarY = 4.52;
    const bed3CollarWestX = -20.85;
    const bed3CollarEastX = -19.25;

    const getBed3VaultCeilingYAtX = (wx: number): number => {
      if (wx < bed3CollarWestX) {
        return (
          upperWallTopY +
          ((wx - -22.19) / (bed3CollarWestX - -22.19)) * (bed3CollarY - upperWallTopY)
        );
      }
      if (wx > bed3CollarEastX) {
        return (
          bed3CollarY -
          ((wx - bed3CollarEastX) / (-18.475 - bed3CollarEastX)) * (bed3CollarY - upperWallTopY)
        );
      }
      return bed3CollarY;
    };

    // Full-height vaulted wardrobe carcass (`X = -22.19m..-20.325m, Y = floorTopY..bed3CollarY`)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(wardMinX, floorTopY);
    carcassShape.lineTo(wardMaxX, floorTopY);
    carcassShape.lineTo(wardMaxX, bed3CollarY + 0.015);
    carcassShape.lineTo(bed3CollarWestX, bed3CollarY + 0.015);
    carcassShape.lineTo(wardMinX, upperWallTopY + 0.015);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: wardD,
      bevelEnabled: false,
    });
    carcassGeo.translate(0, 0, centerZ - wardD / 2);
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom3.northWardrobe.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    bed3WardGroup.add(carcass);

    // Raked Shaker crown cornice moulding following the vaulted ceiling profile along the South face (`Z = 4.725m`)
    for (const [x0, y0, x1, y1] of [
      [wardMinX, upperWallTopY + 0.008, bed3CollarWestX, bed3CollarY],
      [bed3CollarWestX, bed3CollarY, wardMaxX, bed3CollarY],
    ] as const) {
      const segLen = Math.hypot(x1 - x0, y1 - y0);
      const segAngle = Math.atan2(y1 - y0, x1 - x0);
      const corniceSeg = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.016, 0.044, 0.036),
        wardrobeMat
      );
      corniceSeg.name = 'bedroom3.northWardrobe.cornice';
      corniceSeg.position.set((x0 + x1) / 2, (y0 + y1) / 2 - 0.02, 4.715 + 0.008);
      corniceSeg.rotation.z = segAngle;
      corniceSeg.castShadow = true;
      bed3WardGroup.add(corniceSeg);
    }

    // 4 ceiling-height Shaker wardrobe doors (2 pairs) along the South face (`Z = +4.728m`) rising to the vaulted ceiling (Issue #15)
    const doorBaseY = floorTopY + 0.15;
    const corniceClearance = 0.042;
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
      addShakerWardrobeDoor(bed3WardGroup, {
        x: doorX,
        y: doorBaseY + maxDoorH / 2,
        z: 4.728,
        width: doorW,
        height: maxDoorH,
        heightLeft: hLeft,
        heightRight: hRight,
        alongZ: false,
        normalSign: 1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `bedroom3.northWardrobe.door_${i + 1}`,
      });
    }

    // Upper vaulted gable extensions sealing the Z = 4.10m, X = -20.25m, and Z = 4.85m walls up to Bedroom 3's 4.52m vaulted ceiling (Issue #15)
    const northAlcoveGableShape = new THREE.Shape();
    northAlcoveGableShape.moveTo(-22.19, upperWallTopY - 0.02);
    northAlcoveGableShape.lineTo(-20.18, upperWallTopY - 0.02);
    northAlcoveGableShape.lineTo(-20.18, bed3CollarY + 0.015);
    northAlcoveGableShape.lineTo(bed3CollarWestX, bed3CollarY + 0.015);
    northAlcoveGableShape.lineTo(-22.19, upperWallTopY + 0.015);
    northAlcoveGableShape.closePath();
    const northAlcoveGableGeo = new THREE.ExtrudeGeometry(northAlcoveGableShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    northAlcoveGableGeo.translate(0, 0, 4.1 - 0.075);
    const northAlcoveGable = new THREE.Mesh(northAlcoveGableGeo, warmRoomPlasterMat);
    northAlcoveGable.name = 'bedroom3.northAlcoveUpperGable';
    northAlcoveGable.userData.isArchitecturalShell = true;
    scene.add(northAlcoveGable);

    const alcoveSideUpperWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, bed3CollarY - upperWallTopY + 0.035, 0.75),
      warmRoomPlasterMat
    );
    alcoveSideUpperWall.name = 'bedroom3.alcoveSideUpperGable';
    alcoveSideUpperWall.userData.isArchitecturalShell = true;
    alcoveSideUpperWall.position.set(-20.25, (upperWallTopY + bed3CollarY) / 2, 4.475);
    scene.add(alcoveSideUpperWall);

    const showerSouthGableShape = new THREE.Shape();
    showerSouthGableShape.moveTo(-20.325, upperWallTopY - 0.02);
    showerSouthGableShape.lineTo(-18.475, upperWallTopY - 0.02);
    showerSouthGableShape.lineTo(-18.475, upperWallTopY + 0.015);
    showerSouthGableShape.lineTo(bed3CollarEastX, bed3CollarY + 0.015);
    showerSouthGableShape.lineTo(-20.325, bed3CollarY + 0.015);
    showerSouthGableShape.closePath();
    const showerSouthGableGeo = new THREE.ExtrudeGeometry(showerSouthGableShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    showerSouthGableGeo.translate(0, 0, 4.85 - 0.075);
    const showerSouthGable = new THREE.Mesh(showerSouthGableGeo, warmRoomPlasterMat);
    showerSouthGable.name = 'bedroom3.showerSouthUpperGable';
    showerSouthGable.userData.isArchitecturalShell = true;
    scene.add(showerSouthGable);

    // Issue #6 & #7: Continuous 45°-mitred North & East skirting board wrapping the inset wardrobe plinth (`Z = +4.73m`),
    // returning South along the alcove side reveal (`X = -20.325m`), continuing along the South shower wall (`Z = +4.925m`),
    // and turning South along the East wall of Bedroom 3 (`X = -18.475m`) right up to the North architrave of `bedroom3Door` (`Z = 6.918m`)!
    const bed3NorthSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-22.19, 4.73],
          [-20.325, 4.73],
          [-20.325, 4.925],
          [-18.475, 4.925],
          [-18.475, 6.918],
        ],
        floorTopY
      ),
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
