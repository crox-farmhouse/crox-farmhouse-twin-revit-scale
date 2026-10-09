import * as THREE from 'three';
import { buildMitredArchitraveSegments } from '../../../../../engine/geometry/index.ts';
import {
  buildBarnGolfSimulator,
  buildBarnSpiralStaircase,
  buildGarageShowerRoom,
  buildGarageStihlWallRack,
  buildGarageWorkshopToolBench,
  buildGymMirrorsLightingAndPlants,
  buildGymNikeSquatRack,
  buildGymOakDoorAndSkirting,
  buildGymTechnogymRunPersonal,
  buildNikeGrindDumbbellRack,
  createPouredResinFloorMaterial,
} from '../outbuilding-interiors.ts';
import { buildPorsche992TurboS } from '../porsche-992-turbo-s.ts';
import {
  buildBarnCornerBar,
  buildBarnGolfViewingBar,
  buildBarnGroundWallArtworks,
  buildBarnPoolTable,
  buildStableGroundCloakroom,
} from '../barn-mezzanine-retro-lounge.ts';
import {
  createChamferedGymRubberTilesGeometry,
  type OutbuildingShellContext,
} from './outbuilding-coords-and-materials.ts';

export function buildWestAndEastGroundShell(shellCtx: OutbuildingShellContext): void {
  const {
    ctx,
    exteriorBrickMat,
    stoneSillMat,
    courtyardDoorMat,
    castIronMat,
    windowFrameMat,
    windowGlassMat,
    warmRoomPlasterMat,
    addWallClimbingIvyCluster,
    groundGroup,
    firstFloorGroup,
    roofGroup,
    groundCeilingGroup,
    pantileRoofMat,
    barnLimestoneFloorMat,
    gymSubFloorMat,
    gymRubberTileMat,
    lightJoineryOakMat,
    lightJoineryOakPostMat,
    mezzaninePlankFloorMat,
    settingPlasterMat,
    spotlightBrassTrimMat,
    applyOutbuildingFloorUVs,
    wallT,
    partT,
    addOutbuildingBrickWall,
    addBoardedBarnDoor,
    addGlazedGymCoachScreen,
    addOutbuildingWindow,
    addOutbuildingBrickWallWithWindows,
    addOutbuildingExteriorUpDownWallLight,
    addPitchedOutbuildingRoofSection,
    addInteriorPlasterGableWall,
    addVaultedRoomEaveFriezeStrips,
    uGymStart,
    uGymEnd,
    uGarageEnd,
    vWestRangeNorth,
    vWestRangeSouth,
    westRangeWallH,
    westRangeRidgeH,
    baseY0,
    westRangeDatumY,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    garageFloorTopY,
    garageFloorThickness,
    uStoreStart,
    uBarnStart,
    uMezzanineFront,
    uBarnEnd,
    uStableStart,
    uStableEnd,
    uStableExtEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    eastRangeInternalV,
    barnUpperEaveH,
    stableUpperEaveH,
    baseYBarnStart,
    barnDatumY,
    stableDatumY,
    eastRangeGroundTopY,
    barnUpperTopY,
    barnCeilRidgeY,
    mezzanineFloorY,
    barnWestFloorY,
    barnLowerFloorY,
    stableGroundFloorY,
    stableGroundTopY,
    stableUpperFloorY,
    barnCarpetTopY,
    stableGroundSpanU,
  } = shellCtx;

  // =========================================================================
  // 1. LEVEL 1 — SINGLE-STOREY WEST RANGE (`GYM` + `GARAGE`, u = 0.00m..12.07m)
  //    - Bay 1 (`GYM`: 5.49m x 5.15m, u = 0.00m..5.77m)
  //    - Bay 2 (`Garage`: 6.10m x 5.15m, u = 5.77m..12.07m)
  //    - Issue #4 ("Put a vauled ceiling in here, insulated plasterboard" at `[-13.898, 2.571, 19.843]`)
  //    - Issue #5 ("Velux here" at `[-15.746, 2.508, 16.446]`, `u = 6.661m`)
  //    - Issue #6 ("Velux here" at `[-11.903, 2.573, 16.247]`, `u = 10.507m`)
  //    - Issue #7 ("Paint this wall" at `[-10.211, 2.681, 17.684]`, `u = 12.070m`)
  //    - Issue #10 ("Ceiling all the way up here" at `[-16.221, 1.817, 18.995]`, `u = 5.970m`)
  // =========================================================================

  // GYM Floor (`5.49m x 5.15m`) built as a dark sub-slab + 3D `1.00m x 1.00m` Chamfered-Edge Rubber Gym Tiles
  const gymSubSlab = new THREE.Mesh(
    new THREE.BoxGeometry(5.49, 0.095, 5.15),
    gymSubFloorMat
  );
  gymSubSlab.name = 'outbuildings.gym.subSlab';
  gymSubSlab.position.set(0.28 + 5.49 * 0.5, baseY0 - 0.062, 0.28 + 5.15 * 0.5);
  gymSubSlab.receiveShadow = true;
  groundGroup.add(gymSubSlab);

  const gymRubberTilesMesh = new THREE.Mesh(
    createChamferedGymRubberTilesGeometry(0.28, 5.49, 0.28, 5.15, baseY0 - 0.014, 0.026),
    gymRubberTileMat
  );
  gymRubberTilesMesh.name = 'outbuildings.gym.rubberTileFloor';
  gymRubberTilesMesh.castShadow = false;
  gymRubberTilesMesh.receiveShadow = true;
  groundGroup.add(gymRubberTilesMesh);

  // Issue #4 ("Resin poured floor" at `[-14.111, -0.509, 18.632]`) &
  // Issue #7 ("Gap on the ground under the bottom of the garage door" at `[-15.39, -0.509, 15.764]`):
  // Seamless Poured Polyurethane/Epoxy Resin Garage Floor (`garageFloorTopY = -0.50m`), extending North
  // to `v = 0.02m` right through the two wide garage door thresholds so there is zero gap under the garage doors!
  const garageResinFloorMat = createPouredResinFloorMaterial();
  const garageFloor = new THREE.Mesh(
    new THREE.BoxGeometry(6.1, garageFloorThickness, 5.41),
    garageResinFloorMat
  );
  garageFloor.name = 'outbuildings.garage.resinFloor';
  garageFloor.position.set(
    5.97 + 6.1 * 0.5,
    garageFloorTopY - garageFloorThickness * 0.5,
    (0.02 + 5.43) * 0.5
  );
  garageFloor.receiveShadow = true;
  groundGroup.add(garageFloor);

  // West Gable Wall of GYM facing the Front Road (u = 0.00m..0.28m, v = 0.00m..5.71m — Issue #2: swapped window to v = 2.96..3.64m!)
  // Small cottage casement window (`0.68m` wide along `v = 2.96..3.64m` x `0.76m` high at `y = baseY0 + 1.00..baseY0 + 1.76m`)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, northWestWallTopY, 0, 2.96, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, baseY0 + 1.0, 2.96, 3.64, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 + 1.76, northWestWallTopY, 2.96, 3.64, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, northWestWallTopY, 3.64, vWestRangeSouth, ['+x']);
  addOutbuildingWindow(groundGroup, wallT * 0.5, baseY0 + 1.38, 3.3, 0.68, 0.76, true);

  // Painted interior gable lining inside the GYM West Gable wall (`u = 0.25..0.285m`) up to the vaulted ceiling
  addInteriorPlasterGableWall(
    groundGroup,
    wallT - 0.03,
    wallT + 0.005,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.gym.westGableInteriorPlaster'
  );

  // Massive Lush Climbing Ivy Mantle covering the West Gable Wall of the GYM (Photos 2, 3 & 6)
  addWallClimbingIvyCluster(
    groundGroup,
    -0.02,
    baseY0,
    3.25,
    'x',
    -1,
    4.6,
    westRangeRidgeH - 0.15,
    301
  );

  // South Garden Wall of GYM & Garage (v = 5.43m..5.71m, u = 0.28m..12.07m):
  // - Issue #3 ("Exposed brick on this wall" at `[-18.292, 1.776, 21.091]`) & Issue #4 ("And this one" at `[-20.281, 1.53, 21.262]`):
  //   GYM South Wall (`u = wallT..uGymEnd`, both West and East bays) has exposed heritage brick on the interior (`plasterFaces = []`)!
  // - Garage South Wall (`u = uGymEnd..uGarageEnd`) retains painted interior plaster (`plasterFaces = ['-z']`).
  addOutbuildingBrickWall(
    groundGroup,
    wallT,
    uGymEnd,
    baseY0 - 0.14,
    northWestWallTopY,
    vWestRangeSouth - wallT,
    vWestRangeSouth,
    []
  );
  // Heated Garage Shower Room South Exterior Wall (`u = 5.77..8.92m`) -> 3-layer insulated!
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    8.92,
    baseY0 - 0.14,
    northWestWallTopY,
    vWestRangeSouth - wallT,
    vWestRangeSouth,
    ['-z']
  );
  // Unheated Main Garage South Exterior Wall (`u = 8.92..12.07m`) -> uninsulated 9-inch brick!
  addOutbuildingBrickWall(
    groundGroup,
    8.92,
    uGarageEnd,
    baseY0 - 0.14,
    northWestWallTopY,
    vWestRangeSouth - wallT,
    vWestRangeSouth,
    ['-z']
  );

  // Internal Partition Wall between GYM and Garage (u = 5.77m..5.97m)
  // - Issue #4 ("Remove this glas window and replace with a double height glass door" at `[-16.431, 0.87, 17.617]`):
  //   Full-height ("double height") glazed double door & sidelight screen opening across `v = 0.88m..3.52m, y = baseY0..1.78m`
  // - Issue #1 & Issue #5 ("Entrance to shower room ideally from both gym and garage, or just from 1" at `[-15.934, -0.5, 19.899]`):
  //   Gym-to-Shower-Room doorway opening across `v = 4.18m..4.94m, y = baseY0..1.48m`
  // Built with 5 non-overlapping full-depth plastered wall segments (North pier, Central pier, South pier,
  // Glass-Door top lintel header, and Shower-Door top lintel header):
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0,
    northWestWallTopY,
    wallT + 0.002,
    0.88,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0 + 2.38,
    northWestWallTopY,
    0.88,
    3.52,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0,
    northWestWallTopY,
    3.52,
    4.18,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    1.48,
    northWestWallTopY,
    4.18,
    4.94,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0,
    northWestWallTopY,
    4.94,
    vWestRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addInteriorPlasterGableWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    wallT + 0.002,
    vWestRangeSouth - wallT - 0.002,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.gymGaragePartitionGable'
  );

  // Vaulted eave frieze strips inside GYM (`u = 0.28..5.77m`) and Garage (`u = 5.97..12.07m`)
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    wallT,
    uGymEnd,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY
  );
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uGymEnd + partT,
    uGarageEnd,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY
  );

  // Issue #4 ("Remove this glas window and replace with a double height glass door" at `[-16.431, 0.87, 17.617]`):
  // Full-Height ("Double Height") Glazed Double Door & Sidelight Screen (`outbuildings.gymGarageGlassDoor`) + Full GYM Perimeter Skirting Board (`outbuildings.gym.skirting`)
  buildGymOakDoorAndSkirting(
    ctx,
    groundGroup,
    baseY0,
    wallT,
    uGymEnd,
    partT,
    vWestRangeSouth,
    windowFrameMat
  );

  // Issue #3 ("Nike grind dumbell rack here" at `[-21.015, -0.123, 16.156]`):
  // 3-Tier Commercial Nike Grind Hex Dumbbell Rack (`outbuildings.gym.nikeGrindDumbbellRack`) with 10 pairs (`5–50`) of light-grey multicolour-speckled Nike Grind hex dumbbells
  buildNikeGrindDumbbellRack(groundGroup, baseY0 + 0.012);

  // Technogym Run Personal (Antonio Citterio design) in the GYM (`outbuildings.gym.technogymRunPersonal`)
  buildGymTechnogymRunPersonal(groundGroup, baseY0 + 0.012, ctx.interactions);

  // Nike Strength Squat Cage, Flat Bench, Crimson Barbell & Solid-Color Nike Pro Bumper Plates (`outbuildings.gym.nikeSquatRack`)
  buildGymNikeSquatRack(groundGroup, baseY0 + 0.012, ctx.interactions);

  // Full-Height Backlit Gym Mirrors, Layered Task & Warm Ambient Lighting, and Sculpted Indoor Plants
  buildGymMirrorsLightingAndPlants(groundGroup, groundCeilingGroup, baseY0 + 0.012);

  // Issue #4 & #5 ("Put it against this wall and cut it in to make use of the dead space behind, make it slightly longer"
  // at `[-10.226, -0.27, 17.512]`):
  // Heavy-Duty 5-Bay Stainless-Steel & Butcher-Block Workshop Tool Bench (`outbuildings.garage.toolBench`) recessed into the Garage East wall
  buildGarageWorkshopToolBench(groundGroup, garageFloorTopY, ctx);

  // Issue #1 ("Porsche 992.2 Turbo S in ocean Blue metalic here" at `[-15.013, -0.5, 18.708]`) &
  // Issue #2 ("Move the car to this side" at `[-11.137, -0.5, 18.79]`):
  buildPorsche992TurboS(groundGroup, garageFloorTopY);

  // Issue #6 (Pin at `[-12.462, -0.5, 19.84]`) & Issue #7 ("Stihl chainsaws / hedgetrimmers on the wall here" at `[-11.233, 0.427, 20.485]`):
  // High-LOD STIHL Chainsaws, Hedge Trimmers, Pole Trimmer, Blower & Battery Charger Wall Rack on the Garage South Wall (`v = 5.415m`)
  buildGarageStihlWallRack(groundGroup, garageFloorTopY);

  // Issue #1 ("We need to fit a small shower room and toilet in this back corner." at `[-13.364, -0.5, 19.781]`),
  // Issue #5 ("Entrance to shower room ideally from both gym and garage, or just from 1" at `[-15.934, -0.5, 19.899]`), &
  // Issue #2 ("in cutaway mode dont show the ceiling" at `[-14.572, 1.94, 19.933]`, `outbuildings.garage.showerRoom.ceilingLid`):
  // Attach `outbuildings.garage.showerRoom.ceilingLid` to `roofGroup` (`ceilingMeshGroup`) so it hides in cutaway mode
  // regardless of whether `floor === 'ground'` or `floor === 'first'`!
  buildGarageShowerRoom(
    ctx,
    groundGroup,
    roofGroup,
    garageFloorTopY,
    baseY0 + 0.012,
    northWestWallTopY
  );

  // Issue #8 ("Some brighter LED lighting in here (cool)" at `[-15.005, 0.851, 20.809]`) &
  // Issue #8 ("this LED bar carn be removed its intersecting the ceiling of the toilet" at `[-15.041, 1.917, 19.226]`):
  // High-Output Cool-White (`5600K`, `#ebf6ff`) Linear LED Batten Lighting System (`outbuildings.garage.ledLighting`),
  // omitting the SW batten `(cu = 7.35, cv = 3.85)` that sat over/intersected the Garage Shower Room ceiling (`v = 3.85..5.43m`)!
  {
    const garageLedGroup = new THREE.Group();
    garageLedGroup.name = 'outbuildings.garage.ledLighting';
    groundGroup.add(garageLedGroup);

    // Issue #4 ("Overhead lights should be visible but low opacity (same everywhere)" at `[-12.296, 2.036, 18.997]`):
    // Keep overhead ceiling battens visible in cutaway view (`garageLedGroup` on `groundGroup`) with low opacity (`0.34..0.38`)!
    const ledHousingMat = new THREE.MeshStandardMaterial({
      color: 0xd8dfe8,
      roughness: 0.26,
      metalness: 0.82,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const coolWhiteLedTubeMat = new THREE.MeshStandardMaterial({
      color: 0xf4faff,
      emissive: new THREE.Color(0xd8eeff),
      emissiveIntensity: 3.2,
      roughness: 0.14,
      metalness: 0.05,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });

    // 3 Overhead High-Bay Linear Cool-White LED Strips over the open Garage bays (`(7.35, 1.85)`, `(10.4, 1.85)`, `(10.4, 3.85)`)
    const ceilingLedGroup = new THREE.Group();
    ceilingLedGroup.name = 'outbuildings.garage.ledLighting.ceilingBattens';
    garageLedGroup.add(ceilingLedGroup);

    let ceilLedSeq = 0;
    for (const [cu, cv] of [
      [7.35, 1.85],
      [10.4, 1.85],
      [10.4, 3.85],
    ] as const) {
      const ceilLedId = ++ceilLedSeq;
      const cHousing = new THREE.Mesh(
        new THREE.BoxGeometry(2.05, 0.032, 0.056),
        ledHousingMat
      );
      cHousing.name = `outbuildings.garage.ledLighting.ceilingHousing.${ceilLedId}`;
      cHousing.position.set(cu, 2.02, cv);
      ceilingLedGroup.add(cHousing);

      const cDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.018, 0.042),
        coolWhiteLedTubeMat
      );
      cDiffuser.name = `outbuildings.garage.ledLighting.ceilingDiffuser.${ceilLedId}`;
      cDiffuser.position.set(cu, 2.005, cv);
      ceilingLedGroup.add(cDiffuser);
    }

    // 2 Cool-White (`5600K`, `0xe4f3ff`) PointLights illuminating the Porsche 992.2 Turbo S and East Workshop Bay
    for (const lu of [7.45, 10.35] as const) {
      const coolLight = new THREE.PointLight(0xe4f3ff, 3.6, 10.5, 1.35);
      coolLight.name = `outbuildings.garage.ledLighting.coolLight.${lu}`;
      coolLight.position.set(lu, 1.78, 2.85);
      garageLedGroup.add(coolLight);
    }
  }

  // North Courtyard Wall of GYM & Garage (v = 0.00m..0.28m, u = 0.28m..12.07m):
  // - Small GYM casement window at u = 1.49m (`0.68m x 0.78m`, clean cutout!)
  // - Full-height 4-bay glazed GYM screen at u = 3.05m..5.45m (`2.40m` wide)
  // - Two wide `2.64m` Double Garage Doors in Garage (`u = 6.08m..8.72m` and `u = 9.12m..11.76m`), seated flush on `garageFloorTopY = -0.50m` (Issue #7!)
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    wallT,
    3.05,
    baseY0 - 0.14,
    northWestWallTopY,
    0,
    wallT,
    ['+z'],
    [{ uCenter: 1.49, yCenter: baseY0 + 1.39, width: 0.68, height: 0.78 }]
  );

  // GYM East wide opening (u = 3.05m..5.45m): Full-height glazed screen & interactive glass doors
  addOutbuildingBrickWall(groundGroup, 3.05, 5.45, baseY0 + 2.1, northWestWallTopY, 0, wallT, ['+z']);
  addGlazedGymCoachScreen(groundGroup, 4.25, baseY0 + 0.012, wallT * 0.5, 2.4, 2.088);

  // Pier between GYM glazed screen and Garage Double Door #1 (u = 5.45m..6.08m)
  addOutbuildingBrickWall(groundGroup, 5.45, 5.97, baseY0 - 0.14, northWestWallTopY, 0, wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 5.97, 6.08, baseY0 - 0.14, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #1 (u = 6.08m..8.72m, width = 2.64m, seated flush at `garageFloorTopY = -0.50m` — Issue #7 & Issue #5!)
  const garageDoorHeight = 2.14;
  const garageDoorTopY = garageFloorTopY + garageDoorHeight; // 1.64m
  addOutbuildingBrickWall(groundGroup, 6.08, 8.72, garageDoorTopY, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(
    groundGroup,
    7.4,
    garageFloorTopY,
    wallT * 0.5,
    2.64,
    garageDoorHeight,
    true,
    courtyardDoorMat,
    'Garage West Double Door',
    true
  );

  // Central Brick Pier between the two Double Garage Doors (u = 8.72m..9.12m)
  addOutbuildingBrickWall(groundGroup, 8.72, 9.12, garageFloorTopY - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #2 (u = 9.12m..11.76m, width = 2.64m, seated flush at `garageFloorTopY = -0.50m` — Issue #7 & Issue #5!)
  addOutbuildingBrickWall(groundGroup, 9.12, 11.76, garageDoorTopY, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(
    groundGroup,
    10.44,
    garageFloorTopY,
    wallT * 0.5,
    2.64,
    garageDoorHeight,
    true,
    courtyardDoorMat,
    'Garage East Double Door',
    true
  );

  // East Pier of Garage up to Step #1 at u = 12.07m
  addOutbuildingBrickWall(groundGroup, 11.76, uGarageEnd, garageFloorTopY - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Level 1 Pitched Pantile Roof + Insulated Plasterboard Vaulted Ceiling (Issue #4)
  // + 2 North-Slope Velux Skylights over the Garage (`u = 6.661m` Issue #5 & `u = 10.507m` Issue #6)
  addPitchedOutbuildingRoofSection(
    uGymStart,
    uGarageEnd,
    vWestRangeNorth,
    vWestRangeSouth,
    westRangeDatumY,
    westRangeWallH,
    westRangeRidgeH,
    pantileRoofMat,
    true,
    false,
    westRangeWallH,
    westRangeWallH,
    0.14,
    0.0,
    [
      [wallT, uGymEnd],
      [uGymEnd + partT, uGarageEnd],
    ],
    [
      { id: 'gymNorth', uCenter: 1.85, vCenter: 1.08, widthU: 0.84, lengthS: 1.18 },
      { id: 'garageWest', uCenter: 6.661, vCenter: 1.08, widthU: 0.84, lengthS: 1.18 },
      { id: 'garageEast', uCenter: 10.507, vCenter: 1.08, widthU: 0.84, lengthS: 1.18 },
    ]
  );

  // =========================================================================
  // 2. STEP #1 -> LEVEL 2 (`STORE`: u = 12.07m..14.96m + `BARN`: u = 14.96m..23.22m)
  //    AND STEP #2 -> LEVEL 3 (`2-STOREY STABLE` AT THE END: u = 23.22m..29.05m)
  //    - Issue #1 ("only 1 truss in here and its at the front of the mezzanine. I think the mezzanine is a little lower down too (lowish ceiling underneath)"
  //      at `[-1.842, 2.082, 17.548]`, `u = 20.42m`):
  //      Lowered Barn mezzanine to `mezzanineFloorY = 1.54m` (underside ceiling at `y = 1.40m`, giving a lowish `1.72m` ceiling underneath)
  //      and placed the single Barn truss right at the front of the mezzanine (`u = 18.68m`).
  //    - Issue #2 ("This is a usable top floor so I dont think there is a big truss in here" at `[2.917, 2.21, 16.337]`):
  //      Removed the roof truss from the Stable upper room.
  //    - Issue #3 ("Ceiling feels much higher in here?" at `[3.679, -0.189, 16.835]`, inside the Stable ground floor):
  //      Raised the Stable ground-floor ceiling (`stableGroundTopY`) to `2.52m` (`2.74m` clear ceiling height above the `-0.22m` Stable floor,
  //      with `stableUpperFloorY = 2.66m`, `stableUpperTopY = 3.88m`, and `stableRidgeY = 5.48m`).
  // =========================================================================
  // Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`) & Issue #2 & #3:
  // Seamless Garage Resin Floor extension across the entire East Wall Alcove & sub-hallway (`u = 12.05..13.06m, v = 0.28..5.428m`)
  // so no sub-base gap (`y = -0.69m`) is ever visible anywhere between the pass-through doorway, hallway wall, and tall cupboard!
  const benchAlcoveFloor = new THREE.Mesh(
    new THREE.BoxGeometry(1.01, garageFloorThickness, 5.148),
    garageResinFloorMat
  );
  benchAlcoveFloor.name = 'outbuildings.garage.resinFloor.alcove';
  benchAlcoveFloor.position.set(
    12.555,
    garageFloorTopY - garageFloorThickness * 0.5,
    (0.28 + 5.428) * 0.5
  );
  benchAlcoveFloor.receiveShadow = true;
  groundGroup.add(benchAlcoveFloor);

  // Continuous Honed Limestone Floor (`barnLimestoneFloorMat` at `barnWestFloorY = -0.34m`) running seamlessly through
  // the North Pass-Through Hallway (`u = 12.31..15.20m, v = 0.285..1.178m`) from the Garage pass-through door into the Barn!
  // Issue #6 ("Some strange dithering here" at `[-10.082, -0.34, 15.906]`):
  // Span `storeFloor` strictly from `u = 12.31m` (East face of the oak door threshold step) to `u = 15.20m` (West edge of `barnWestFloor`)
  // and `v = 0.285m..1.178m` so there is zero coplanar overlap with `thresholdStep` (`u = 12.07..12.31m`) or `barnWestFloor`!
  const storeFloorTopY = -0.34;
  const storeFloorSpanU = (uBarnStart + 0.24) - (uStoreStart + 0.24); // 2.89m (12.31m..15.20m)
  const storeFloorCenterU = uStoreStart + 0.24 + storeFloorSpanU * 0.5; // 13.755m
  const storeFloorSpanV = 0.955; // v = 0.285m..1.24m (flush with hallwayWallVMin = 1.24m!)
  const storeFloorCenterV = 0.285 + storeFloorSpanV * 0.5; // 0.7625m
  const corridorFloorGeo = new THREE.BoxGeometry(storeFloorSpanU, 0.38, storeFloorSpanV);
  applyOutbuildingFloorUVs(corridorFloorGeo, storeFloorCenterU, barnWestFloorY - 0.19, storeFloorCenterV, 0.34);
  const storeFloor = new THREE.Mesh(
    corridorFloorGeo,
    barnLimestoneFloorMat
  );
  storeFloor.name = 'outbuildings.store.floor';
  storeFloor.position.set(
    storeFloorCenterU,
    barnWestFloorY - 0.19,
    storeFloorCenterV
  );
  storeFloor.receiveShadow = true;
  groundGroup.add(storeFloor);

  // Full-width Golf Simulator Bay Subfloor Slab (`u = 12.78..15.20m, v = 1.24..5.435m, yTop = -0.34m`)
  // so no `-0.69m` void is ever visible at the edges of the Golf Simulator bay (Issue #1)!
  const simBaySubfloorStartU = 12.78;
  const simBaySubfloorSpanU = (uBarnStart + 0.24) - simBaySubfloorStartU; // 2.42m
  const simBaySubfloorSpanV = (vEastRangeSouth - wallT + 0.005) - 1.24; // 4.195m (reaches 5mm into South wall limePlaster at v = 5.430m)
  const simBaySubfloor = new THREE.Mesh(
    new THREE.BoxGeometry(simBaySubfloorSpanU, 0.38, simBaySubfloorSpanV),
    barnLimestoneFloorMat
  );
  simBaySubfloor.name = 'outbuildings.store.golfBaySubfloor';
  simBaySubfloor.position.set(
    simBaySubfloorStartU + simBaySubfloorSpanU * 0.5,
    barnWestFloorY - 0.19,
    1.24 + simBaySubfloorSpanV * 0.5
  );
  simBaySubfloor.receiveShadow = true;
  groundGroup.add(simBaySubfloor);

  // Issue #8 ("Make the lower section a little larger, move the steps forward slightly (maybe 50cm).
  // On this side have a bar with some stools so people can watch the golf and wait their turn" at `[-3.975, -0.34, 18.437]`):
  // Move the 2-step floor drop `50cm` forward (West) from `uMezzanineFront = 18.68m` to `uBarnStepDropStart = 18.18m`,
  // so `barnWestFloor` spans `u = 15.20..18.18m` (`2.98m` wide), the 2 bullnose oak steps span `u = 18.18..18.46m`,
  // and the carpeted lower lounge/pool/bar floor (`barnEastLowerFloor`) spans `u = 18.46..23.02m` (`4.56m` wide — 50cm larger!).
  const uBarnStepDropStart = 18.00; // 18.00m (Riser #1 = 18.00m, Riser #2 = 18.24m -> true stair nosing pitch line lands at u = 18.502m before North Pilaster at 18.53m!)
  const barnWestFloorSpanU = uBarnStepDropStart - (uBarnStart + 0.24); // 2.96m
  const barnWestFloorCenterU = uBarnStart + 0.24 + barnWestFloorSpanU * 0.5;
  const barnFloorCenterV = vEastRangeNorth + wallT + eastRangeInternalV * 0.5;
  const barnWestFloorGeo = new THREE.BoxGeometry(barnWestFloorSpanU, 0.38, eastRangeInternalV);
  applyOutbuildingFloorUVs(barnWestFloorGeo, barnWestFloorCenterU, barnWestFloorY - 0.19, barnFloorCenterV, 0.34);
  const barnWestFloor = new THREE.Mesh(
    barnWestFloorGeo,
    barnLimestoneFloorMat
  );
  barnWestFloor.name = 'outbuildings.barn.westFloor';
  barnWestFloor.position.set(
    barnWestFloorCenterU,
    barnWestFloorY - 0.19,
    barnFloorCenterV
  );
  barnWestFloor.receiveShadow = true;
  groundGroup.add(barnWestFloor);

  // 2 Bullnose Honed-Limestone Steps Down at `u = 18.16m..18.40m` dropping from `barnWestFloorY = -0.34m`
  // down to the lower limestone floor (`-0.675m`), spanning `v = 0.302m..3.62m` so the North end houses cleanly
  // against the 22mm Carpenter's Raked Stair-Stringer Skirting Board (`westNorthRight`) and the South end
  // butts cleanly against the North edge (`v = 3.62m`) of the Golf Viewing Bar!
  const stepDownDepthU = 0.24;
  const stepTreadT = 0.032;
  const stepBullnoseR = stepTreadT * 0.5; // 16mm half-round bullnose radius
  const stepOverhangU = 0.022;
  const step1TopY = (barnWestFloorY + barnCarpetTopY) * 0.5; // -0.5075m
  const vGolfBarNorthEdge = 3.62;
  const vStepNorthStart = vEastRangeNorth + wallT + 0.022; // 0.302m (houses cleanly against the 22mm North wall raked stair-stringer skirting!)
  const stepSpanV = vGolfBarNorthEdge - vStepNorthStart;   // 3.322m (0.298m..3.62m)
  const stepCenterV = vStepNorthStart + stepSpanV * 0.5;   // 1.959m

  // Issue #2 ("Putt he limestone down here too and on the step no carpet" at `[-3.488, -0.675, 16.902]`, `outbuildings.barn.eastLowerFloor`):
  // Continuous large-format Honed Limestone (`barnLimestoneFloorMat`, `uvScale = 0.34`) across the top step, middle step, risers,
  // and the entire East Sunken Barn floor (`outbuildings.barn.eastLowerFloor` & `.barBay`) — no carpet!
  const step1CarcassH = (step1TopY - stepTreadT) - (barnLowerFloorY - 0.12);
  const step1CarcassGeo = new THREE.BoxGeometry(stepDownDepthU, step1CarcassH, stepSpanV);
  applyOutbuildingFloorUVs(
    step1CarcassGeo,
    uBarnStepDropStart + stepDownDepthU * 0.5,
    (step1TopY - stepTreadT + (barnLowerFloorY - 0.12)) * 0.5,
    stepCenterV,
    0.34
  );
  const barnDropStepCarcass = new THREE.Mesh(step1CarcassGeo, barnLimestoneFloorMat);
  barnDropStepCarcass.name = 'outbuildings.barn.floorDropStep.riserCarcass';
  barnDropStepCarcass.position.set(
    uBarnStepDropStart + stepDownDepthU * 0.5,
    (step1TopY - stepTreadT + (barnLowerFloorY - 0.12)) * 0.5,
    stepCenterV
  );
  barnDropStepCarcass.castShadow = true;
  barnDropStepCarcass.receiveShadow = true;
  groundGroup.add(barnDropStepCarcass);

  // Upper riser face at `u = 18.18m` (`y = step1TopY .. barnWestFloorY - stepTreadT`, `v = 0.28..3.62m`) in honed limestone
  const upperRiserH = (barnWestFloorY - stepTreadT) - step1TopY + 0.004;
  const upperRiserGeo = new THREE.BoxGeometry(0.018, upperRiserH, stepSpanV);
  applyOutbuildingFloorUVs(upperRiserGeo, uBarnStepDropStart + 0.009, step1TopY + upperRiserH * 0.5, stepCenterV, 0.34);
  const upperRiserMesh = new THREE.Mesh(upperRiserGeo, barnLimestoneFloorMat);
  upperRiserMesh.name = 'outbuildings.barn.floorDropStep.riser.1';
  upperRiserMesh.position.set(uBarnStepDropStart + 0.009, step1TopY + upperRiserH * 0.5, stepCenterV);
  groundGroup.add(upperRiserMesh);

  // Honed Limestone middle step tread (`outbuildings.barn.floorDropStep.1` at `u = 18.18..18.46m + overhang`, `y = step1TopY`, `v = 0.28..3.62m`)
  const step1FlatSpanU = stepDownDepthU + stepOverhangU - stepBullnoseR;
  const step1FlatCenterU = uBarnStepDropStart + step1FlatSpanU * 0.5;
  const step1TreadGeo = new THREE.BoxGeometry(step1FlatSpanU, stepTreadT, stepSpanV);
  applyOutbuildingFloorUVs(step1TreadGeo, step1FlatCenterU, step1TopY - stepTreadT * 0.5, stepCenterV, 0.34);
  const barnDropStep1 = new THREE.Mesh(step1TreadGeo, barnLimestoneFloorMat);
  barnDropStep1.name = 'outbuildings.barn.floorDropStep.1';
  barnDropStep1.position.set(
    step1FlatCenterU,
    step1TopY - stepTreadT * 0.5,
    stepCenterV
  );
  barnDropStep1.castShadow = true;
  barnDropStep1.receiveShadow = true;
  groundGroup.add(barnDropStep1);

  // Top step threshold Honed Limestone nosing slab at `u = 18.18m, y = barnWestFloorY = -0.34m, v = 0.28..3.62m`
  const upperNosingFlatU = 0.065;
  const upperNosingCenterU = uBarnStepDropStart - 0.04 + upperNosingFlatU * 0.5;
  const upperNosingGeo = new THREE.BoxGeometry(upperNosingFlatU, stepTreadT, stepSpanV);
  applyOutbuildingFloorUVs(upperNosingGeo, upperNosingCenterU, barnWestFloorY - stepTreadT * 0.5 + 0.001, stepCenterV, 0.34);
  const upperNosingBoard = new THREE.Mesh(upperNosingGeo, barnLimestoneFloorMat);
  upperNosingBoard.name = 'outbuildings.barn.floorDropStepNosing.1';
  upperNosingBoard.position.set(
    upperNosingCenterU,
    barnWestFloorY - stepTreadT * 0.5 + 0.001,
    stepCenterV
  );
  upperNosingBoard.castShadow = true;
  upperNosingBoard.receiveShadow = true;
  groundGroup.add(upperNosingBoard);

  // Half-round cylindrical bullnose leading edges (`sIdx = 1` top step & `sIdx = 2` middle step both in `barnLimestoneFloorMat`)
  for (const [sIdx, riserU, treadTopY, nosingMat] of [
    [1, uBarnStepDropStart, barnWestFloorY + 0.001, barnLimestoneFloorMat],
    [2, uBarnStepDropStart + stepDownDepthU, step1TopY, barnLimestoneFloorMat],
  ] as const) {
    const bullnoseU = riserU + stepOverhangU - stepBullnoseR;
    const bullnoseY = treadTopY - stepBullnoseR;
    const bullnoseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(stepBullnoseR, stepBullnoseR, stepSpanV, 18),
      nosingMat
    );
    bullnoseCyl.name = `outbuildings.barn.floorDropStepNosing.${sIdx}`;
    bullnoseCyl.rotation.x = Math.PI / 2;
    bullnoseCyl.position.set(bullnoseU, bullnoseY, stepCenterV);
    bullnoseCyl.castShadow = true;
    bullnoseCyl.receiveShadow = true;
    groundGroup.add(bullnoseCyl);

    const scotiaCove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, stepSpanV, 12),
      nosingMat
    );
    scotiaCove.name = `outbuildings.barn.floorDropStepScotiaCove.${sIdx}`;
    scotiaCove.userData.lodTier = 'high';
    scotiaCove.rotation.x = Math.PI / 2;
    scotiaCove.position.set(riserU + 0.01, treadTopY - stepTreadT - 0.006, stepCenterV);
    groundGroup.add(scotiaCove);
  }

  // Barn East Sunken Floor (`u = 18.46..23.02m`, width `4.56m`, top at `barnCarpetTopY = -0.675m`,
  // raised `1.5cm` above the `-0.69m` exterior terrain ground slab so the terrain never bleeds through!)
  // Paved in continuous Honed Limestone (`barnLimestoneFloorMat`, `uvScale = 0.34`) matching `outbuildings.barn.westFloor` (Issue #2)!
  const barnLowerFloorStartU = uBarnStepDropStart + stepDownDepthU; // 18.46m
  const barnLowerFloorSpanU = uBarnEnd - partT - barnLowerFloorStartU; // 4.56m
  const barnEastFloorCenterU = barnLowerFloorStartU + barnLowerFloorSpanU * 0.5;
  const barnEastLowerFloorGeo = new THREE.BoxGeometry(barnLowerFloorSpanU + 0.01, 0.145, eastRangeInternalV + 0.02);
  applyOutbuildingFloorUVs(barnEastLowerFloorGeo, barnEastFloorCenterU, barnCarpetTopY - 0.0725, barnFloorCenterV, 0.34);
  const barnEastLowerFloor = new THREE.Mesh(
    barnEastLowerFloorGeo,
    barnLimestoneFloorMat
  );
  barnEastLowerFloor.name = 'outbuildings.barn.eastLowerFloor';
  barnEastLowerFloor.position.set(
    barnEastFloorCenterU,
    barnCarpetTopY - 0.0725,
    barnFloorCenterV
  );
  barnEastLowerFloor.receiveShadow = true;
  groundGroup.add(barnEastLowerFloor);

  // South Bar Bay Lower Limestone Floor Extension (`u = 18.18m..18.46m, v = 3.62m..5.43m`) directly beneath the shifted Golf Viewing Bar!
  const barBayFloorSpanV = (vEastRangeSouth - wallT) - vGolfBarNorthEdge; // 1.81m (3.62m..5.43m)
  const barBayFloorCenterV = vGolfBarNorthEdge + barBayFloorSpanV * 0.5;   // 4.525m
  const barBayFloorGeo = new THREE.BoxGeometry(stepDownDepthU, 0.145, barBayFloorSpanV);
  applyOutbuildingFloorUVs(
    barBayFloorGeo,
    uBarnStepDropStart + stepDownDepthU * 0.5,
    barnCarpetTopY - 0.0725,
    barBayFloorCenterV,
    0.34
  );
  const barBayLowerFloor = new THREE.Mesh(barBayFloorGeo, barnLimestoneFloorMat);
  barBayLowerFloor.name = 'outbuildings.barn.eastLowerFloor.barBay';
  barBayLowerFloor.position.set(
    uBarnStepDropStart + stepDownDepthU * 0.5,
    barnCarpetTopY - 0.0725,
    barBayFloorCenterV
  );
  barBayLowerFloor.receiveShadow = true;
  groundGroup.add(barBayLowerFloor);

  // Issue #5 ("Wooden floor in here" at `[2.827, -0.44, 16.311]`, `outbuildings.stable.floor`) &
  // Issue #6 ("Extend the building out here, upper floor is a balcony with a door and railings and exterior staircase."):
  // Extended Stable Ground-Floor Wide-Plank European Oak Wooden Floor (`u = 23.22m..31.57m`, span `8.35m`, top at `stableGroundFloorY = -0.44m`)
  const stableFloorCenterU = uStableStart + stableGroundSpanU * 0.5; // 27.395m
  const stableFloorCenterV = vEastRangeNorth + wallT + eastRangeInternalV * 0.5; // 2.855m
  const stableFloorGeo = new THREE.BoxGeometry(stableGroundSpanU, 0.12, eastRangeInternalV);
  applyOutbuildingFloorUVs(stableFloorGeo, stableFloorCenterU, stableGroundFloorY - 0.06, stableFloorCenterV, 0.5);
  const stableFloor = new THREE.Mesh(
    stableFloorGeo,
    mezzaninePlankFloorMat
  );
  stableFloor.name = 'outbuildings.stable.floor';
  stableFloor.position.set(
    stableFloorCenterU,
    stableGroundFloorY - 0.06,
    stableFloorCenterV
  );
  stableFloor.receiveShadow = true;
  groundGroup.add(stableFloor);

  // Issue #2 ("Have this unit wrap around the corner" at `[-10.064, 0.482, 19.713]`),
  // Issue #3 ("shortern the unit slightly and have a door here which goes through to the bar, it will open up behind the back of the golf simulator. Have a red light above which goes red if someone is playing golf" at `[-10.37, 0.713, 15.833]`),
  // Issue #4 ("Height of this section should match the cupboards" at `[-9.737, 1.207, 18.647]`), &
  // Issue #7 ("Make this a more standard oak door" at `[-10.25, 0.533, 15.572]`):
  const garagePassDoorVMin = 0.36;
  const garagePassDoorVMax = 1.22; // 0.86m structural opening for Part M / FD30S fire door in the 0.96m corridor!
  const garagePassDoorTopY = 1.66; // Standard 2.00m door height above the -0.34m threshold step (`2.16m` above `-0.50m` garage floor, flush with `1.66m` cupboard top!)
  const benchAlcoveVMin = 1.332; // Aligns cleanly with `corridorSouthWall` (`v = 1.24..1.33m`) and the Garage Tall Stainless Cupboard (`v = 1.34..2.86m`)
  const benchAlcoveVMax = vEastRangeSouth - wallT - 0.005; // 5.425m
  const stepWallNorthVMin = vEastRangeNorth + wallT + 0.005; // 0.285m (5mm clear of North wall inner plaster `v = 0.280m` to prevent cutaway grazing dithering)
  const stepWallChildStartIdx = groundGroup.children.length;

  // 1. Lower sill / step wall (`y = barnLowerFloorY (-0.70m) .. garageFloorTopY (-0.50m)`): full span `vInnerNorth .. vInnerSouth`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    barnLowerFloorY,
    garageFloorTopY,
    stepWallNorthVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2a. North-most corner jamb pier (`v = 0.285m .. 0.36m`): `y = garageFloorTopY (-0.50m) .. eastRangeGroundTopY (1.94m)`
  const northCornerJambPier = addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garageFloorTopY,
    eastRangeGroundTopY,
    stepWallNorthVMin,
    garagePassDoorVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  northCornerJambPier.receiveShadow = false;
  // 2b. Over-door lintel (`v = 0.36m .. 1.22m`): `y = 1.66m .. eastRangeGroundTopY (1.94m)`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garagePassDoorTopY,
    eastRangeGroundTopY,
    garagePassDoorVMin,
    garagePassDoorVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2c. Center pier between the Pass-Through Door (`v = 1.22m`) and the Tall Stainless Cupboard (`v = 1.332m`)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garageFloorTopY,
    eastRangeGroundTopY,
    garagePassDoorVMax,
    benchAlcoveVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 3. Unified upper lintel header above both the Tall Stainless Cupboard and the Recessed Workbench (`v = 1.332m .. 5.425m, y = 1.66m .. 1.94m`)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    1.66,
    eastRangeGroundTopY,
    benchAlcoveVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

  // Lower plinth curb under `corridorSouthWall` (`u = 12.31m..12.78m, y = -0.50m..-0.34m, v = 1.242m..1.332m`)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    12.78,
    garageFloorTopY,
    barnWestFloorY,
    1.242,
    benchAlcoveVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    12.78,
    13.04,
    garageFloorTopY,
    2.51,
    benchAlcoveVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    12.78,
    1.66,
    2.51,
    benchAlcoveVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

  // Inset the auto-generated `.woodFibreInsulation` cores on `brickWall.24..31` so they stay strictly inside
  // their parent masonry volumes and never z-fight or dither on `-z`, `+z`, `-y`, or `+y` faces, and finish the
  // top (`+y`) cap of internal step-wall segments with `warmRoomPlasterMat` so no dark `wallCapMat` seam shows.
  for (let cIdx = stepWallChildStartIdx; cIdx < groundGroup.children.length; cIdx++) {
    const child = groundGroup.children[cIdx];
    if (child instanceof THREE.Mesh) {
      if (child.name.endsWith('.woodFibreInsulation')) {
        child.scale.set(0.94, 0.94, 0.90);
        child.position.y -= 0.008;
        child.castShadow = false;
        child.receiveShadow = false;
      } else if (Array.isArray(child.material) && child.material.length >= 6) {
        child.material[2] = warmRoomPlasterMat;
      }
    }
  }

  // Interactive Hinged 4-Panel Solid European Oak Pass-Through Door (`outbuildings.garage.golfPassThroughDoor`) & Threshold Step
  {
    const passDoorW = garagePassDoorVMax - garagePassDoorVMin; // 0.80m
    const passDoorH = garagePassDoorTopY - garageFloorTopY;     // 2.16m (2.00m above the 0.16m threshold step!)
    const passDoorCenterV = (garagePassDoorVMin + garagePassDoorVMax) * 0.5; // 0.78m
    const passDoorCenterU = uStoreStart + 0.12; // 12.19m

    const passDoorGroup = new THREE.Group();
    passDoorGroup.name = 'outbuildings.garage.golfPassThroughDoor';
    passDoorGroup.userData.zone = 'courtyard';
    passDoorGroup.position.set(passDoorCenterU, garageFloorTopY, passDoorCenterV);
    groundGroup.add(passDoorGroup);

    // Solid light-oak threshold step inside the doorway (`u = 12.07..12.31m`, `y = 0..0.16m`, bridging `garageFloorTopY = -0.50m` to `barnWestFloorY = -0.34m` with zero overlap onto `storeFloor`!)
    const thresholdStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, passDoorW),
      lightJoineryOakMat
    );
    thresholdStep.name = 'outbuildings.garage.golfPassThroughDoor.step';
    thresholdStep.position.set(0, 0.08, 0);
    thresholdStep.receiveShadow = true;
    passDoorGroup.add(thresholdStep);

    // Issue #2 ("No door here just maket this a throughway" at `[-10.261, 0.311, 15.955]`, `outbuildings.garage.golfPassThroughDoor.slab`):
    // Removed the hinged door slab, stops, hinges, and lever handles so `outbuildings.garage.golfPassThroughDoor`
    // is a clean, open cased Solid Light-Oak Walkthrough Archway with oak jamb linings, head lining, and dual-face chamfered architraves!
    const jambT = 0.032;
    const jambD = 0.242;
    for (const sideZ of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambD, passDoorH - 0.16, jambT),
        lightJoineryOakMat
      );
      jamb.name = 'outbuildings.garage.golfPassThroughDoor.jamb';
      jamb.position.set(0, 0.16 + (passDoorH - 0.16) * 0.5, sideZ * (passDoorW * 0.5 - jambT * 0.5));
      passDoorGroup.add(jamb);
    }
    const headJamb = new THREE.Mesh(
      new THREE.BoxGeometry(jambD, jambT, passDoorW),
      lightJoineryOakMat
    );
    headJamb.name = 'outbuildings.garage.golfPassThroughDoor.headJamb';
    headJamb.position.set(0, passDoorH - jambT * 0.5, 0);
    passDoorGroup.add(headJamb);

    for (const [normalSign, faceWallX, archMat] of [
      [-1 as const, -0.1215, warmRoomPlasterMat],
      [1 as const, 0.1235, settingPlasterMat],
    ] as const) {
      const [leftLegGeo, headGeo, rightLegGeo] = buildMitredArchitraveSegments(
        -(passDoorW * 0.5 - 0.016),
        passDoorW * 0.5 - 0.016,
        0,
        0,
        passDoorH - 0.002,
        'z',
        faceWallX,
        normalSign,
        0.068,
        0.022
      );
      for (const segGeo of [leftLegGeo, rightLegGeo, headGeo] as const) {
        const archMesh = new THREE.Mesh(segGeo, archMat);
        archMesh.name = 'outbuildings.garage.golfPassThroughDoor.architrave';
        archMesh.castShadow = true;
        archMesh.receiveShadow = true;
        passDoorGroup.add(archMesh);
      }
    }

    // Building Regulations Part B (Fire Safety — Garage to Habitable Building Separation) +
    // Issue #1 ("i want a window on this door" at `[-10.282, 0.919, 15.708]` on `outbuildings.garage.golfPassThroughDoor.fireDoor.leaf`):
    // Self-Closing Half-Glazed FD30S Solid European Oak Fire & Cold-Smoke Door (`outbuildings.garage.golfPassThroughDoor.fireDoor`)
    // featuring a clear fire-rated Pyroguard vision window in the upper half (`y = 0.96..1.845m`) with solid-oak glazing beads
    // and glazing bar, framed solid-oak stiles/rails, recessed lower Shaker panel, intumescent seals, and overhead closer.
    const fireDoorClearW = passDoorW - jambT * 2 - 0.008;
    const fireDoorClearH = passDoorH - 0.16 - jambT - 0.008; // 1.96m leaf height above the 160mm fuel-spill step
    const fireDoorT = 0.044; // 44mm statutory FD30S fire door thickness
    const fireLeafPivot = new THREE.Group();
    fireLeafPivot.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor';
    fireLeafPivot.position.set(0, 0.162, -fireDoorClearW * 0.5);
    passDoorGroup.add(fireLeafPivot);

    const stileW = 0.112;
    const botRailH = 0.20;
    const lockRailBotY = 0.82;
    const lockRailTopY = 0.96;
    const topRailH = 0.115;
    const winBotY = lockRailTopY; // 0.96m
    const winTopY = fireDoorClearH - topRailH; // 1.845m
    const winH = winTopY - winBotY; // 0.885m
    const innerSpanW = fireDoorClearW - stileW * 2;
    const innerMidZ = fireDoorClearW * 0.5;

    // 1. Hinge Stile (`z = 0..stileW`, keeps primary `.leaf` name for USD/annotation compatibility) & Leading Stile
    const hingeStile = new THREE.Mesh(
      new THREE.BoxGeometry(fireDoorT, fireDoorClearH, stileW),
      lightJoineryOakMat
    );
    hingeStile.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.leaf';
    hingeStile.position.set(0, fireDoorClearH * 0.5, stileW * 0.5);
    hingeStile.castShadow = true;
    hingeStile.receiveShadow = true;
    fireLeafPivot.add(hingeStile);

    const leadingStile = new THREE.Mesh(
      new THREE.BoxGeometry(fireDoorT, fireDoorClearH, stileW),
      lightJoineryOakMat
    );
    leadingStile.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.stile.leading';
    leadingStile.position.set(0, fireDoorClearH * 0.5, fireDoorClearW - stileW * 0.5);
    leadingStile.castShadow = true;
    leadingStile.receiveShadow = true;
    fireLeafPivot.add(leadingStile);

    // 2. Bottom Rail (`y = 0..0.20m`), Lock/Waist Rail (`y = 0.82..0.96m`), and Top Rail (`y = 1.845..1.96m`)
    for (const [rTag, ry0, ry1] of [
      ['bottom', 0, botRailH],
      ['lock', lockRailBotY, lockRailTopY],
      ['top', winTopY, fireDoorClearH],
    ] as const) {
      const rh = ry1 - ry0;
      const railMesh = new THREE.Mesh(
        new THREE.BoxGeometry(fireDoorT, rh, innerSpanW),
        lightJoineryOakMat
      );
      railMesh.name = `outbuildings.garage.golfPassThroughDoor.fireDoor.rail.${rTag}`;
      railMesh.position.set(0, ry0 + rh * 0.5, innerMidZ);
      railMesh.castShadow = true;
      railMesh.receiveShadow = true;
      fireLeafPivot.add(railMesh);
    }

    // 3. Recessed Solid-Oak Lower Shaker Panel (`y = 0.20..0.82m`) with perimeter chamfered bead mouldings
    const lowerPanelH = lockRailBotY - botRailH;
    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, lowerPanelH, innerSpanW),
      lightJoineryOakMat
    );
    lowerPanel.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.lowerPanel';
    lowerPanel.position.set(0, botRailH + lowerPanelH * 0.5, innerMidZ);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    fireLeafPivot.add(lowerPanel);

    // 4. Upper Clear Fire-Rated Glass Window (`y = 0.96..1.845m`, `winH = 0.885m`)
    const winMidY = winBotY + winH * 0.5;
    const doorWindowGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, winH - 0.012, innerSpanW - 0.012),
      windowGlassMat
    );
    doorWindowGlass.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.windowGlass';
    doorWindowGlass.position.set(0, winMidY, innerMidZ);
    fireLeafPivot.add(doorWindowGlass);

    // Solid-oak perimeter glazing beads around the window aperture on both faces + central horizontal glazing bar
    const beadT = 0.014;
    const beadD = 0.012;
    for (const faceSign of [-1, 1] as const) {
      const fTag = faceSign < 0 ? 'garage' : 'corridor';
      const bx = faceSign * (fireDoorT * 0.5 - beadD * 0.5 + 0.002);

      for (const [bSide, by] of [
        ['bottom', winBotY + beadT * 0.5],
        ['top', winTopY - beadT * 0.5],
      ] as const) {
        const hBead = new THREE.Mesh(
          new THREE.BoxGeometry(beadD, beadT, innerSpanW),
          lightJoineryOakPostMat
        );
        hBead.name = `outbuildings.garage.golfPassThroughDoor.fireDoor.glazingBead.${fTag}.${bSide}`;
        hBead.userData.lodTier = 'high';
        hBead.position.set(bx, by, innerMidZ);
        fireLeafPivot.add(hBead);
      }

      for (const [bSide, bz] of [
        ['hinge', stileW + beadT * 0.5],
        ['leading', fireDoorClearW - stileW - beadT * 0.5],
      ] as const) {
        const vBead = new THREE.Mesh(
          new THREE.BoxGeometry(beadD, winH - beadT * 2, beadT),
          lightJoineryOakPostMat
        );
        vBead.name = `outbuildings.garage.golfPassThroughDoor.fireDoor.glazingBead.${fTag}.${bSide}`;
        vBead.userData.lodTier = 'high';
        vBead.position.set(bx, winMidY, bz);
        fireLeafPivot.add(vBead);
      }
    }

    // Horizontal solid-oak glazing bar dividing the window into 2 vertical lights
    const winGlazingBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.022, innerSpanW - beadT * 2),
      lightJoineryOakPostMat
    );
    winGlazingBar.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.windowGlazingBar';
    winGlazingBar.position.set(0, winMidY, innerMidZ);
    fireLeafPivot.add(winGlazingBar);

    // Intumescent & cold-smoke brush strip along the leading edge and top rail of the FD30S door
    const intumescentMat = new THREE.MeshStandardMaterial({
      color: 0x1e2228,
      roughness: 0.85,
      metalness: 0.05,
    });
    const smokeSealLeading = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, fireDoorClearH - 0.01, 0.004),
      intumescentMat
    );
    smokeSealLeading.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.intumescentSeal';
    smokeSealLeading.position.set(0, fireDoorClearH * 0.5, fireDoorClearW + 0.001);
    fireLeafPivot.add(smokeSealLeading);

    // 3 Brushed-brass fire-rated butt hinges along the hinge stile (`z = 0.003m`)
    let hingeIdx = 0;
    for (const hy of [0.24, 0.98, 1.72] as const) {
      hingeIdx++;
      const hingeKnuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.1, 12),
        spotlightBrassTrimMat
      );
      hingeKnuckle.name = `outbuildings.garage.golfPassThroughDoor.fireDoor.hinge.${hingeIdx}`;
      hingeKnuckle.userData.lodTier = 'high';
      hingeKnuckle.position.set(0.024, hy, 0.003);
      fireLeafPivot.add(hingeKnuckle);
    }

    // Brushed-brass FD30S fire-rated lever handles & circular roses on both faces + overhead scissor-arm closer
    for (const faceSign of [-1, 1] as const) {
      const sideLabel = faceSign < 0 ? 'garage' : 'corridor';
      const rose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.008, 18),
        spotlightBrassTrimMat
      );
      rose.name = `outbuildings.garage.golfPassThroughDoor.fireDoor.handleRose.${sideLabel}`;
      rose.userData.lodTier = 'high';
      rose.rotation.z = Math.PI / 2;
      rose.position.set(faceSign * 0.026, 0.91, fireDoorClearW - stileW * 0.5);
      fireLeafPivot.add(rose);

      const handleLever = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.018, 0.12),
        spotlightBrassTrimMat
      );
      handleLever.name = `outbuildings.garage.golfPassThroughDoor.fireDoor.handle.${sideLabel}`;
      handleLever.position.set(faceSign * 0.038, 0.91, fireDoorClearW - stileW * 0.5 - 0.042);
      fireLeafPivot.add(handleLever);
    }

    const closerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.054, 0.22),
      spotlightBrassTrimMat
    );
    closerBody.name = 'outbuildings.garage.golfPassThroughDoor.fireDoor.overheadCloser';
    closerBody.position.set(0.038, fireDoorClearH - 0.045, 0.18);
    fireLeafPivot.add(closerBody);

    ctx.interactions.registerHingedDoor(
      passDoorGroup,
      fireLeafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      -Math.PI * 0.46
    );
  }
  // Issue #3 ("Show this full wall in cutout view incl gable from the inside " at `[-10.207, 1.803, 17.731]`) &
  // Issue #1 ("This wall looks a bit janky in cutaway mode, lots going on. Try to tidy up the geometry" at `[-10.183, 2.849, 18.005]`):
  // Give both halves of the 240mm Garage/Store step-up gable (`u = 12.07..12.19m` in `warmRoomPlasterMat` and
  // `u = 12.19..12.31m` in `settingPlasterMat`) the exact same unified Store gable profile (`eaves = barnUpperTopY = 2.92m`,
  // `ridge = barnCeilRidgeY = 4.269m`, `v = 0.282..5.428m`) so the wall forms a single flush, un-stepped gable in cutaway mode
  // that aligns cleanly with the `2.92m` Store North/South walls and `4.269m` ridge beam!
  addInteriorPlasterGableWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.12,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    eastRangeGroundTopY,
    barnUpperTopY,
    barnCeilRidgeY,
    'outbuildings.garageStoreStep1InteriorGable',
    warmRoomPlasterMat
  );
  addInteriorPlasterGableWall(
    groundGroup,
    uStoreStart + 0.12,
    uStoreStart + 0.24,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    eastRangeGroundTopY,
    barnUpperTopY,
    barnCeilRidgeY,
    'outbuildings.storeWestInteriorPlasterGable',
    settingPlasterMat
  );

  // Issue #1 ("Mat isn't using the full width of the bay" at `[-8.042, -0.653, 20.21]`) &
  // Issue #2 ("Tidy this up asthetically" at `[-6.882, 2.448, 20.095]`, `southWallColumn`):
  // - Expand the Golf Simulator bay to the full room width (`simCutoutVMin = 1.330m .. simCutoutVMax = 5.428m`, `4.098m` wide)
  //   so the fixed and sliding turf mats span wall-to-wall across 100% of the bay width!
  // - Align the 200mm-deep Architectural Steel Portal Frame cleanly at `u = 15.00m .. 15.20m` (`frameCenterU = 15.10m`),
  //   with the acoustic foam baffles stopping flush behind the steel frame at `u = 15.00m`, and symmetrical 58mm × 200mm
  //   Matte-Anthracite steel portal jamb columns (`southWallColumn` at `v = 5.370..5.428m` and `centerMullionColumn` at `v = 1.250..1.388m`)
  //   rising from the top of the turf mat (`y = -0.306m`) to the underside of `headerBeam` (`y = 2.510m`)!
  const simCutoutVMin = 1.33; // Full 4.098m bay width (v = 1.330m..5.428m)
  const simCutoutVMax = vEastRangeSouth - wallT - 0.002; // 5.428m (inner plaster face of South wall)
  const simCutoutTopY = barnWestFloorY + 2.85; // 2.51m (9'4" TrackMan iO clear portal opening height)
  const corridorSouthV = 1.24; // Full 0.958m clear North corridor width (`v = 0.282m .. 1.240m`)
  {
    const structuralSteelMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.32,
      metalness: 0.78,
    });
    const steelBoltMat = new THREE.MeshStandardMaterial({
      color: 0x3a4048,
      roughness: 0.26,
      metalness: 0.86,
    });

    const portalFrameGroup = new THREE.Group();
    portalFrameGroup.name = 'outbuildings.barn.golfSimulator.steelPortalFrame';
    portalFrameGroup.userData.zone = 'courtyard';
    portalFrameGroup.userData.isArchitecturalShell = true;
    groundGroup.add(portalFrameGroup);

    const colBotY = barnWestFloorY + 0.034; // -0.306m (sits cleanly on top of the full-width turf mat!)
    const beamBotY = simCutoutTopY;         // 2.510m (flush with top of side columns & ceiling portal soffit!)
    const beamTopY = 2.72;                  // Directly supports the Principal Oak Truss tie-beam (`y = 2.72..2.92m`)!
    const beamH = beamTopY - beamBotY;      // 0.210m (203×203×46 UC Universal Beam)
    const beamMidY = (beamBotY + beamTopY) * 0.5; // 2.615m
    const colH = beamBotY - colBotY;        // 2.816m
    const colMidY = colBotY + colH * 0.5;

    // Unified 200mm-deep architectural portal plane (`u = 15.00m .. 15.20m`, centered at `15.10m`)
    // shared identically by `southWallColumn`, `centerMullionColumn`, `headerBeam`, and `outbuildings.roofTruss.storeBarn`!
    const frameCenterU = uBarnStart + 0.14; // 15.10m
    const beamCenterU = frameCenterU;       // 15.10m
    const beamDepthU = 0.20;                // u = 15.00m .. 15.20m
    const vFrameMin = vEastRangeNorth + wallT + 0.002; // 0.282m (inner plaster face of North wall)
    const vFrameMax = vEastRangeSouth - wallT - 0.002; // 5.428m (inner plaster face of South wall)
    const fullBeamSpanV = vFrameMax - vFrameMin;       // 5.146m (stays 100% inside the room envelope in cutaway view!)
    const fullBeamMidV = (vFrameMin + vFrameMax) * 0.5;

    // 1. Symmetrical Architectural Steel Portal Jamb Columns (`u = 15.00m .. 15.20m`, `y = -0.306m .. 2.510m`):
    //    - `southWallColumn` (`v = 5.370..5.428m`, 58mm wide × 200mm deep) aligns flush with the 58mm South acoustic baffle run (`u = 12.80..15.00m`)
    //      and the South wall plaster (`v = 5.428m`), with welded top cap and base plates.
    //    - `centerMullionColumn` (`v = 1.250..1.388m`) combines the corridor mullion web (`v = 1.250..1.330m`) with a matching
    //      58mm North portal jamb (`v = 1.330..1.388m`) flush with the 58mm North acoustic baffle run (`u = 12.80..15.00m`)!
    const columnSpecs: ReadonlyArray<{
      id: string;
      uDepth: number;
      v0: number;
      v1: number;
    }> = [
      { id: 'centerMullionColumn', uDepth: beamDepthU, v0: simCutoutVMin + 0.002, v1: simCutoutVMin + 0.058 },
      { id: 'southWallColumn', uDepth: beamDepthU, v0: simCutoutVMax - 0.058, v1: simCutoutVMax },
    ];

    for (const col of columnSpecs) {
      const colSpanV = col.v1 - col.v0;
      const colMidV = (col.v0 + col.v1) * 0.5;
      const colMesh = new THREE.Mesh(
        new THREE.BoxGeometry(col.uDepth, colH - 0.024, colSpanV),
        structuralSteelMat
      );
      colMesh.name = `outbuildings.barn.golfSimulator.steelPortalFrame.${col.id}`;
      colMesh.userData.isArchitecturalShell = true;
      colMesh.position.set(frameCenterU, colMidY, colMidV);
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      portalFrameGroup.add(colMesh);

      // Welded 12mm steel cap plate & base collar for clean architectural junction against the turf mat and header beam
      for (const [plateSuffix, plateY] of [
        ['basePlate', colBotY + 0.006],
        ['capPlate', beamBotY - 0.006],
      ] as const) {
        const plateMesh = new THREE.Mesh(
          new THREE.BoxGeometry(col.uDepth + 0.008, 0.012, colSpanV + 0.008),
          structuralSteelMat
        );
        plateMesh.name = `outbuildings.barn.golfSimulator.steelPortalFrame.${col.id}.${plateSuffix}`;
        plateMesh.userData.isArchitecturalShell = true;
        plateMesh.position.set(frameCenterU, plateY, colMidV);
        portalFrameGroup.add(plateMesh);
      }
    }

    // Flush North Wall Pocketed Bearing Plate (`v = 0.150..0.300m`, 150mm bearing inside the 280mm North wall, `0.20m` deep in `u`)
    const northBearingPlate = new THREE.Mesh(
      new THREE.BoxGeometry(beamDepthU, 0.016, 0.15),
      structuralSteelMat
    );
    northBearingPlate.name = 'outbuildings.barn.golfSimulator.steelPortalFrame.northWallBearingPlate';
    northBearingPlate.userData.isArchitecturalShell = true;
    northBearingPlate.position.set(frameCenterU, beamBotY - 0.008, vFrameMin - 0.045);
    portalFrameGroup.add(northBearingPlate);

    // 2. Full-Width 203×203×46 UC Structural Steel Universal Beam Header (`y = 2.510m .. 2.720m`, `u = 15.00m .. 15.20m`)
    const flangeT = 0.014;

    const bottomFlange = new THREE.Mesh(
      new THREE.BoxGeometry(beamDepthU, flangeT, fullBeamSpanV),
      structuralSteelMat
    );
    bottomFlange.name = 'outbuildings.barn.golfSimulator.steelPortalFrame.headerBeam.bottomFlange';
    bottomFlange.userData.isArchitecturalShell = true;
    bottomFlange.position.set(beamCenterU, beamBotY + flangeT * 0.5, fullBeamMidV);
    bottomFlange.castShadow = true;
    bottomFlange.receiveShadow = true;
    portalFrameGroup.add(bottomFlange);

    const topFlange = new THREE.Mesh(
      new THREE.BoxGeometry(beamDepthU, flangeT, fullBeamSpanV),
      structuralSteelMat
    );
    topFlange.name = 'outbuildings.barn.golfSimulator.steelPortalFrame.headerBeam.topFlange';
    topFlange.userData.isArchitecturalShell = true;
    topFlange.position.set(beamCenterU, beamTopY - flangeT * 0.5, fullBeamMidV);
    topFlange.castShadow = true;
    topFlange.receiveShadow = true;
    portalFrameGroup.add(topFlange);

    const webH = beamH - flangeT * 2;
    const beamWeb = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, webH, fullBeamSpanV),
      structuralSteelMat
    );
    beamWeb.name = 'outbuildings.barn.golfSimulator.steelPortalFrame.headerBeam.web';
    beamWeb.userData.isArchitecturalShell = true;
    beamWeb.position.set(beamCenterU, beamMidY, fullBeamMidV);
    beamWeb.castShadow = true;
    beamWeb.receiveShadow = true;
    portalFrameGroup.add(beamWeb);

    // Welded 16mm North & South end-plates closing the I-beam profile cleanly at `vFrameMin` and `vFrameMax`
    for (const [endSuffix, endV] of [
      ['northEndPlate', vFrameMin + 0.008],
      ['southEndPlate', vFrameMax - 0.008],
    ] as const) {
      const endPlate = new THREE.Mesh(
        new THREE.BoxGeometry(beamDepthU, beamH, 0.016),
        structuralSteelMat
      );
      endPlate.name = `outbuildings.barn.golfSimulator.steelPortalFrame.headerBeam.${endSuffix}`;
      endPlate.userData.isArchitecturalShell = true;
      endPlate.position.set(beamCenterU, beamMidY, endV);
      portalFrameGroup.add(endPlate);
    }

    // Welded vertical web stiffener plates + M20 structural hex bolt groups along the Barn (+x) web pocket
    const stiffenerVs = [0.36, 1.359, 2.15, 2.97, 3.79, 4.61, 5.37] as const;
    const boltGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.016, 6);
    boltGeo.rotateZ(Math.PI / 2);
    for (let sIdx = 0; sIdx < stiffenerVs.length; sIdx++) {
      const sv = stiffenerVs[sIdx];
      const stiffener = new THREE.Mesh(
        new THREE.BoxGeometry(beamDepthU * 0.48, webH, 0.012),
        structuralSteelMat
      );
      stiffener.name = `outbuildings.barn.golfSimulator.steelPortalFrame.headerBeam.webStiffener.${sIdx + 1}`;
      stiffener.userData.isArchitecturalShell = true;
      stiffener.position.set(beamCenterU + beamDepthU * 0.24, beamMidY, sv);
      portalFrameGroup.add(stiffener);

      for (const by of [-0.048, 0.048] as const) {
        const bolt = new THREE.Mesh(boltGeo, steelBoltMat);
        bolt.name = `outbuildings.barn.golfSimulator.steelPortalFrame.headerBeam.bolt.${sIdx + 1}`;
        bolt.userData.lodTier = 'high';
        bolt.position.set(beamCenterU + beamDepthU * 0.46, beamMidY + by, sv + 0.028);
        portalFrameGroup.add(bolt);
      }
    }

    // Flush Matte-Anthracite Steel Web Closure Plate on the Store Loft (-x) side (`u = 15.00..15.09m`)
    // where the Store Loft oak deck (`u = 12.31..15.00m, y = 2.52..2.61m`) butts cleanly into the steel beam!
    const storeLoftWebLiner = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, webH, fullBeamSpanV - 0.032),
      structuralSteelMat
    );
    storeLoftWebLiner.name = 'outbuildings.storeBarnStudPartition.loftHeaderPlasterLiner';
    storeLoftWebLiner.userData.isArchitecturalShell = true;
    storeLoftWebLiner.position.set(
      frameCenterU - beamDepthU * 0.5 + 0.006,
      beamMidY,
      fullBeamMidV
    );
    storeLoftWebLiner.castShadow = true;
    storeLoftWebLiner.receiveShadow = true;
    portalFrameGroup.add(storeLoftWebLiner);

    // 3. Lightweight Timber-Stud & Acoustic Plasterboard Infill Partition (`outbuildings.storeBarnStudPartition`):
    //    - Plastered North Corridor South Partition Wall (`outbuildings.store.corridorSouthWall`, `u = 12.315..15.000m, v = 1.240..1.330m, y = -0.34..2.510m`)
    //      meeting the West face (`u = 15.00m`) of `centerMullionColumn` and the underside (`y = 2.510m`) of `headerBeam` cleanly!
    const studPartitionGroup = new THREE.Group();
    studPartitionGroup.name = 'outbuildings.storeBarnStudPartition';
    studPartitionGroup.userData.zone = 'courtyard';
    studPartitionGroup.userData.isArchitecturalShell = true;
    groundGroup.add(studPartitionGroup);

    const corridorWallU0 = uStoreStart + 0.24; // 12.310m (meets Garage/Store East wall flush with zero gap)
    const corridorNorthV = stepWallNorthVMin;
    const corridorWallH = beamBotY - barnWestFloorY; // 2.850m (`y = -0.34m .. 2.510m`, flush with underside of UC header beam)
    const corridorWallMidY = barnWestFloorY + corridorWallH * 0.5;
    const corridorWallSouthFaceV = benchAlcoveVMin; // 1.332m (flush with workbench alcove North face)
    const corridorWallT = corridorWallSouthFaceV - corridorSouthV; // 0.090m (`v = 1.240m .. 1.330m`)
    const corridorWallMidV = (corridorSouthV + corridorWallSouthFaceV) * 0.5; // 1.285m

    // Extend `corridorSouthWall` to `u = 15.18m` on the corridor side (`v = 1.240..1.330m`) in
    // Farrow & Ball Setting Plaster (`settingPlasterMat`) so the 18mm `westPartitionCenter` skirting return (`u = 15.180..15.198m`)
    // caps its East end flush at `u = 15.198m` with zero coplanar overlap against `centerMullionColumn` (`v = 1.332..1.388m`)!
    const corridorSouthFullU1 = frameCenterU + 0.08; // 15.18m
    const corridorSouthFullLenU = corridorSouthFullU1 - corridorWallU0;
    const corridorSouthFullMidU = (corridorWallU0 + corridorSouthFullU1) * 0.5;
    const corridorSouthWall = new THREE.Mesh(
      new THREE.BoxGeometry(corridorSouthFullLenU, corridorWallH, corridorWallT),
      settingPlasterMat
    );
    corridorSouthWall.name = 'outbuildings.store.corridorSouthWall';
    corridorSouthWall.userData.isArchitecturalShell = true;
    corridorSouthWall.position.set(corridorSouthFullMidU, corridorWallMidY, corridorWallMidV);
    corridorSouthWall.castShadow = true;
    corridorSouthWall.receiveShadow = true;
    studPartitionGroup.add(corridorSouthWall);

    // Setting Plaster finish on the West end wall of the North Corridor (`u = 12.311m, v = 0.285..1.240m, y = -0.34..1.94m`)
    // around the FD30S fire door (`v = 0.36..1.22m, y = -0.34..1.66m`), stopping cleanly at `eastRangeGroundTopY = 1.94m`
    // so it never overlaps `storeWestInteriorPlasterGable` (`y = 1.94..4.50m`) or `golfPassThroughDoor.architrave`!
    const westEndVeneerU = uStoreStart + 0.2415; // 12.3115m
    const westEndVeneerNorthV = corridorNorthV;
    const westEndPierH = eastRangeGroundTopY - barnWestFloorY;
    const westEndPierMidY = barnWestFloorY + westEndPierH * 0.5;
    const westEndNorthPier = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, westEndPierH, garagePassDoorVMin - westEndVeneerNorthV),
      settingPlasterMat
    );
    westEndNorthPier.name = 'outbuildings.store.corridorWestEndWall.northPier';
    westEndNorthPier.userData.isArchitecturalShell = true;
    westEndNorthPier.receiveShadow = false;
    westEndNorthPier.position.set(
      westEndVeneerU,
      westEndPierMidY,
      (westEndVeneerNorthV + garagePassDoorVMin) * 0.5
    );
    studPartitionGroup.add(westEndNorthPier);

    const westEndSouthPier = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, westEndPierH, corridorSouthV - garagePassDoorVMax),
      settingPlasterMat
    );
    westEndSouthPier.name = 'outbuildings.store.corridorWestEndWall.southPier';
    westEndSouthPier.userData.isArchitecturalShell = true;
    westEndSouthPier.position.set(
      westEndVeneerU,
      westEndPierMidY,
      (garagePassDoorVMax + corridorSouthV) * 0.5
    );
    studPartitionGroup.add(westEndSouthPier);

    const westEndHeaderH = eastRangeGroundTopY - garagePassDoorTopY;
    const westEndHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, westEndHeaderH, garagePassDoorVMax - garagePassDoorVMin),
      settingPlasterMat
    );
    westEndHeader.name = 'outbuildings.store.corridorWestEndWall.header';
    westEndHeader.userData.isArchitecturalShell = true;
    westEndHeader.position.set(
      westEndVeneerU,
      garagePassDoorTopY + westEndHeaderH * 0.5,
      (garagePassDoorVMin + garagePassDoorVMax) * 0.5
    );
    studPartitionGroup.add(westEndHeader);

    // Issue #3 (Pin at `[-7.088, 3.983, 17.819]` on `outbuildings.roofTruss.storeBarn.principalRafter`):
    // Removed `upperTrussInfill.storePlaster` and `upperTrussInfill.barnPlaster` so `outbuildings.roofTruss.storeBarn`
    // is a clean, open Weathered-Oak King-Post Roof Truss above the Store Loft (matching `outbuildings.roofTruss.barn`)
    // with zero plasterboard clipping into `principalRafter`, `kingPost`, or `strut`s!
  }


  // Build the Recessed Widescreen TrackMan iO Golf Simulator (`outbuildings.barn.golfSimulator`) backing into the Store room
  buildBarnGolfSimulator(
    groundGroup,
    barnLowerFloorY,
    eastRangeInternalV,
    groundCeilingGroup,
    ctx.interactions
  );

  // Issue #2 ("Remove the ladder" at `[-3.328, 1.428, 18.92]`),
  // Issue #3 ("Spiral staircase here https://haldaneuk.com/projects/wooden-spiral-staircase/" at `[-0.025, 1.428, 18.785]`), &
  // Issue #4 ("In cutaway mode dont show this landing when looking at the ground floor" at `[-0.388, 1.545, 18.162]`):
  // Haldane UK Bespoke Freestanding Solid American White Oak Spiral Staircase (`outbuildings.barn.spiralStaircase`) in the SE corner of the Barn,
  // with `topLanding` attached to `firstFloorGroup` so it hides in Ground-Floor Cutaway mode!
  buildBarnSpiralStaircase(groundGroup, barnCarpetTopY, mezzanineFloorY, lightJoineryOakMat, firstFloorGroup);
  buildBarnGroundWallArtworks(groundGroup, groundCeilingGroup);

  // Issue #10 ("Bar in this corner with beer on tap, mini fridge like in the master bedroom" at `[0.516, -0.316, 14.617]`),
  // Issue #8 ("Make the lower section a little larger, move the steps forward slightly (maybe 50cm). On this side have a bar with some stools so people can watch the golf and wait their turn" at `[-3.975, -0.34, 18.437]`),
  // & Issue #12 ("Pool table" at `[-1.537, -0.675, 16.19]`):
  buildBarnCornerBar(groundGroup, barnCarpetTopY, lightJoineryOakMat, windowGlassMat);
  buildBarnGolfViewingBar(groundGroup, barnCarpetTopY, lightJoineryOakMat);
  buildBarnPoolTable(groundGroup, barnCarpetTopY, lightJoineryOakMat, ctx.interactions);

  // Internal Cross-Wall at u = 23.02m..23.22m (Barn/Stable Step #2):
  // - Issue #11 ("Glass door through to the next room" at `[0.63, 0.255, 15.941]` -> `(u = 23.02m, y = 0.255m, v = 1.919m)`) &
  //   Issue #5 ("Move this door slightly to the right" at `[0.749, 0.141, 16.259]`):
  //   Shifted the `0.86m`-wide doorway opening South ("to the right" when facing the door from the Barn) from `v = 1.52..2.38m`
  //   to `v = 1.98..2.84m` (`midV = 2.41m`, centered cleanly between the NE Corner Bar `v = 0.28..1.42m` and the SE Spiral Staircase `v = 3.62..5.38m`).
  // - Issue #4 ("Could the bannisters here not be merged somehow? Rather than this akward gap between the 2"):
  //   Above `mezzanineFloorY = 1.54m`, the 1st-floor `UP` stair opening spans `v = 2.554m..3.554m` so its South banister (`v = 3.54m`)
  //   is 100% collinear with the stairwell North guardrail (`v = 3.54m`)!
  const gDoorV0 = 1.98;
  const gDoorV1 = 2.84;
  const gDoorBotY = stableGroundFloorY; // -0.44m
  const gDoorTopY = 1.32;

  // Issues #8 & #9 ("Farrow and ball setting plaster down here" at `[-0.614, 0.307, 19.572]`):
  // Paint the Barn side (`-x` and doorway reveals) of the ground-floor Barn/Stable partition (`y <= mezzanineFloorY = 1.54m`)
  // in Farrow & Ball "Setting Plaster" (`settingPlasterMat`), while keeping the Stable side (`+x`) in `warmRoomPlasterMat`!
  // 1. Lower step riser wall across the doorway (`y = barnLowerFloorY - 0.12 .. stableGroundFloorY`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnLowerFloorY - 0.12,
    gDoorBotY,
    gDoorV0,
    gDoorV1,
    ['-x', '+z', '-z'],
    warmRoomPlasterMat,
    settingPlasterMat
  );
  // 2. North ground-floor wall pier (`v = 0.282..1.98m`, behind the Corner Bar)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnLowerFloorY - 0.12,
    mezzanineFloorY,
    vEastRangeNorth + wallT + 0.002,
    gDoorV0,
    ['-x', '+z', '-z'],
    warmRoomPlasterMat,
    settingPlasterMat
  );
  // 3. South ground-floor wall pier (`v = 2.84..5.428m`, behind the Spiral Staircase)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnLowerFloorY - 0.12,
    mezzanineFloorY,
    gDoorV1,
    vEastRangeSouth - wallT - 0.002,
    ['-x', '+z', '-z'],
    warmRoomPlasterMat,
    settingPlasterMat
  );
  // 4. Over-door lintel between `gDoorTopY = 1.32m` and `mezzanineFloorY = 1.54m`
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    gDoorTopY,
    mezzanineFloorY,
    gDoorV0,
    gDoorV1,
    ['-x', '+z', '-z'],
    warmRoomPlasterMat,
    settingPlasterMat
  );

  // 5. Interactive Hinged Glass Door (`outbuildings.barn.stableGlassDoor`) & Light-Oak Bullnose Threshold Step (`v = 1.52..2.38m`)
  {
    const glassDoorGroup = new THREE.Group();
    glassDoorGroup.name = 'outbuildings.barn.stableGlassDoor';
    glassDoorGroup.userData.zone = 'courtyard';
    const gDoorMidU = uBarnEnd - partT * 0.5; // 23.12m
    const gDoorMidV = (gDoorV0 + gDoorV1) * 0.5; // 1.95m
    const gDoorW = gDoorV1 - gDoorV0; // 0.86m
    const gDoorH = gDoorTopY - gDoorBotY; // 1.76m
    glassDoorGroup.position.set(gDoorMidU, gDoorBotY, gDoorMidV);
    groundGroup.add(glassDoorGroup);

    // Solid light-oak doorway jamb linings, head lining, threshold sill & chamfered architraves
    const jambT = 0.026;
    const sillBoard = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.024, 0.024, gDoorW),
      lightJoineryOakMat
    );
    sillBoard.name = 'outbuildings.barn.stableGlassDoor.sillBoard';
    sillBoard.position.set(0, 0.012, 0);
    sillBoard.receiveShadow = true;
    glassDoorGroup.add(sillBoard);

    const headBoard = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.012, jambT, gDoorW),
      lightJoineryOakMat
    );
    headBoard.name = 'outbuildings.barn.stableGlassDoor.headBoard';
    headBoard.position.set(0, gDoorH - jambT * 0.5, 0);
    glassDoorGroup.add(headBoard);

    for (const sideV of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(partT + 0.012, gDoorH - jambT, jambT),
        lightJoineryOakMat
      );
      jamb.name = `outbuildings.barn.stableGlassDoor.jamb.${sideV < 0 ? "north" : "south"}`;
      jamb.position.set(0, (gDoorH - jambT) * 0.5, sideV * (gDoorW * 0.5 - jambT * 0.5));
      glassDoorGroup.add(jamb);

    }
    for (const sideX of [-1, 1] as const) {
      const [northLegGeo, headGeo, southLegGeo] = buildMitredArchitraveSegments(
        -(gDoorW * 0.5 - 0.011),
        gDoorW * 0.5 - 0.011,
        0,
        0,
        gDoorH - 0.009,
        'z',
        sideX * (partT * 0.5),
        sideX,
        0.058,
        0.020
      );
      const northLeg = new THREE.Mesh(northLegGeo, settingPlasterMat);
      northLeg.name = `outbuildings.barn.stableGlassDoor.architraveLeg.${sideX < 0 ? "west" : "east"}.north`;
      northLeg.castShadow = true;
      northLeg.receiveShadow = true;
      glassDoorGroup.add(northLeg);

      const southLeg = new THREE.Mesh(southLegGeo, settingPlasterMat);
      southLeg.name = `outbuildings.barn.stableGlassDoor.architraveLeg.${sideX < 0 ? "west" : "east"}.south`;
      southLeg.castShadow = true;
      southLeg.receiveShadow = true;
      glassDoorGroup.add(southLeg);

      const archHead = new THREE.Mesh(headGeo, settingPlasterMat);
      archHead.name = `outbuildings.barn.stableGlassDoor.architraveHead.${sideX < 0 ? "west" : "east"}`;
      archHead.castShadow = true;
      archHead.receiveShadow = true;
      glassDoorGroup.add(archHead);
    }

    // Hinged Full-Height Glazed Door Leaf (`outbuildings.barn.stableGlassDoor.leafPivot`)
    const clearW = gDoorW - jambT * 2 - 0.008; // 0.80m
    const clearH = gDoorH - jambT - 0.028; // 1.706m
    const stileW = 0.058;
    const railH = 0.068;
    const leafPivot = new THREE.Group();
    leafPivot.name = 'outbuildings.barn.stableGlassDoor.leafPivot';
    leafPivot.position.set(0, 0.024, -clearW * 0.5);
    glassDoorGroup.add(leafPivot);

    // Left & right solid light-oak door stiles
    for (const sSide of [0, 1] as const) {
      const vz = sSide === 0 ? stileW * 0.5 : clearW - stileW * 0.5;
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, clearH, stileW),
        lightJoineryOakMat
      );
      stile.name = `outbuildings.barn.stableGlassDoor.stile.${sSide === 0 ? "hinge" : "leading"}`;
      stile.position.set(0, clearH * 0.5, vz);
      stile.castShadow = true;
      leafPivot.add(stile);
    }
    // Top & bottom solid light-oak door rails
    for (const [ry, rh] of [
      [railH * 0.5, railH + 0.02],
      [clearH - railH * 0.5, railH],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, rh, clearW - stileW * 2),
        lightJoineryOakMat
      );
      rail.name = `outbuildings.barn.stableGlassDoor.rail.${ry < clearH * 0.5 ? "bottom" : "top"}`;
      rail.position.set(0, ry, clearW * 0.5);
      rail.castShadow = true;
      leafPivot.add(rail);
    }

    // Full-height clear architectural glass pane (`outbuildings.barn.stableGlassDoor.glass`) + 2 slim glazing bars
    const paneW = clearW - stileW * 2 + 0.008;
    const paneH = clearH - railH * 2 + 0.008;
    const glassPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, paneH, paneW),
      windowGlassMat
    );
    glassPane.name = 'outbuildings.barn.stableGlassDoor.glass';
    glassPane.position.set(0, clearH * 0.5 + 0.005, clearW * 0.5);
    leafPivot.add(glassPane);

    for (const gy of [clearH * 0.36, clearH * 0.67] as const) {
      const glazingBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.022, paneW),
        lightJoineryOakPostMat
      );
      glazingBar.name = `outbuildings.barn.stableGlassDoor.glazingBar.${gy < clearH * 0.5 ? "lower" : "upper"}`;
      glazingBar.position.set(0, gy, clearW * 0.5);
      leafPivot.add(glazingBar);
    }

    // Brushed-brass lever handles on both Barn (`-x`) and Stable (`+x`) faces of the leading stile
    for (const hx of [-0.036, 0.036] as const) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.018, 0.115),
        spotlightBrassTrimMat
      );
      lever.name = `outbuildings.barn.stableGlassDoor.lever.${hx < 0 ? "barn" : "stable"}`;
      lever.userData.lodTier = 'high';
      lever.position.set(hx, clearH * 0.52, clearW - stileW * 0.5 - 0.03);
      leafPivot.add(lever);
    }

    ctx.interactions.registerHingedDoor(
      glassDoorGroup,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      Math.PI * 0.45
    );

    // Issue #3 ("Step should be a bit wider to be correct so so the architrave doesn't sit right on the edge of it"
    // at `[0.472, -0.675, 15.933]`):
    // Widened Solid Light-Oak Bullnose Threshold Step (`v = 1.81..3.01m`, `stepW = 1.20m`) extending 12.3cm past
    // the outer edges of both the North (`v = 1.933m`) and South (`v = 2.887m`) doorway architraves, spanning the
    // full `0.235m` rise from `barnCarpetTopY = -0.675m` to `gDoorBotY = -0.44m` with a 3-sided bullnose tread cap!
    const fullStepH = gDoorBotY - barnCarpetTopY; // 0.235m
    const treadT = 0.032;
    const noseR = treadT * 0.5; // 0.016m
    const riserH = fullStepH - treadT; // 0.203m
    const stepD = 0.30;
    const stepW = gDoorW + 0.34; // 1.20m (`z = -0.60..+0.60m`, `v = 1.81..3.01m`)
    const stepRiserBlock = new THREE.Mesh(
      new THREE.BoxGeometry(stepD, riserH, stepW),
      lightJoineryOakMat
    );
    stepRiserBlock.name = 'outbuildings.barn.stableDoorStep.riserBlock';
    stepRiserBlock.position.set(-partT * 0.5 - stepD * 0.5, -treadT - riserH * 0.5, 0);
    stepRiserBlock.castShadow = true;
    stepRiserBlock.receiveShadow = true;
    glassDoorGroup.add(stepRiserBlock);

    const stepBlock = new THREE.Mesh(
      new THREE.BoxGeometry(stepD + 0.016, treadT, stepW + 0.024),
      lightJoineryOakMat
    );
    stepBlock.name = 'outbuildings.barn.stableDoorStep';
    stepBlock.position.set(-partT * 0.5 - (stepD + 0.016) * 0.5, -treadT * 0.5, 0);
    stepBlock.castShadow = true;
    stepBlock.receiveShadow = true;
    glassDoorGroup.add(stepBlock);

    const frontTreadX = -partT * 0.5 - (stepD + 0.016);
    const halfTreadW = (stepW + 0.024) * 0.5;
    const stepBullnose = new THREE.Mesh(
      new THREE.CylinderGeometry(noseR, noseR, stepW + 0.024, 16),
      lightJoineryOakMat
    );
    stepBullnose.name = 'outbuildings.barn.stableDoorStep.bullnose';
    stepBullnose.rotation.x = Math.PI / 2;
    stepBullnose.position.set(frontTreadX, -noseR, 0);
    stepBullnose.castShadow = true;
    stepBullnose.receiveShadow = true;
    glassDoorGroup.add(stepBullnose);

    for (const sideZ of [-1, 1] as const) {
      const sideLabel = sideZ < 0 ? 'north' : 'south';
      const returnNose = new THREE.Mesh(
        new THREE.CylinderGeometry(noseR, noseR, stepD + 0.016, 16),
        lightJoineryOakMat
      );
      returnNose.name = `outbuildings.barn.stableDoorStep.bullnose.${sideLabel}`;
      returnNose.rotation.z = Math.PI / 2;
      returnNose.position.set(-partT * 0.5 - (stepD + 0.016) * 0.5, -noseR, sideZ * halfTreadW);
      returnNose.castShadow = true;
      returnNose.receiveShadow = true;
      glassDoorGroup.add(returnNose);

      const cornerSphere = new THREE.Mesh(
        new THREE.SphereGeometry(noseR, 14, 14),
        lightJoineryOakMat
      );
      cornerSphere.name = `outbuildings.barn.stableDoorStep.bullnoseCorner.${sideLabel}`;
      cornerSphere.position.set(frontTreadX, -noseR, sideZ * halfTreadW);
      glassDoorGroup.add(cornerSphere);
    }
  }

  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    vEastRangeNorth + wallT + 0.002,
    2.405,
    ['-x', '+z', '-z'],
    warmRoomPlasterMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    3.305,
    vEastRangeSouth - wallT - 0.002,
    ['-x', '+z', '-z'],
    warmRoomPlasterMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - 0.06,
    uBarnEnd,
    mezzanineFloorY,
    stableUpperFloorY,
    2.405,
    3.305,
    ['+x', '-x', '+z', '-z'],
    settingPlasterMat,
    settingPlasterMat
  );

  // South Garden Wall of Store (`u = 12.07m..15.20m`) & Barn (`u = 15.20m..23.22m`, solid brick with zero windows — Issue #6!)
  // Issues #8 & #9 ("Farrow and ball setting plaster down here" at `[-0.614, 0.307, 19.572]` & `[0.257, -0.005, 19.497]`):
  // Single-storey Store & West Barn (`u = 12.07..18.68m`) rise directly to `barnUpperTopY = 2.92m` on `groundGroup`
  // so in ground-floor cutaway mode the full double-height wall (including above the Barn Courtyard Door) is visible!
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uBarnStart + 0.24,
    barnLowerFloorY - 0.14,
    barnUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart + 0.24,
    uMezzanineFront,
    barnLowerFloorY - 0.14,
    barnUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uMezzanineFront,
    uBarnEnd,
    barnLowerFloorY - 0.14,
    mezzanineFloorY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    exteriorBrickMat,
    settingPlasterMat
  );

  // Issue #10 ("Remove this window" at `[4.25, 1.175, 19.329]`) & Issue #6 (Extended Stable Ground Floor `u = 23.22..31.57m`):
  // South Garden Wall of Extended Stable Ground Floor (`u = 23.22m..31.57m`, solid brick with zero windows!)
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    uStableExtEnd - wallT,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );

  // North Courtyard Wall of Store & West Barn (`u = 12.07m..18.68m`, rising to `barnUpperTopY = 2.92m` on `groundGroup`
  // so the over-door wall at `u = 15.85..16.85m, y = 1.68..2.92m` is visible in ground cutaway mode behind the Horse Show Certificates!)
  const northStoreWallStartIdx = groundGroup.children.length;
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    12.85,
    storeFloorTopY - 0.14,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  for (let cIdx = northStoreWallStartIdx; cIdx < groundGroup.children.length; cIdx++) {
    const child = groundGroup.children[cIdx];
    if (
      child instanceof THREE.Mesh &&
      (child.name.endsWith('.limePlaster') || child.name.endsWith('.woodFibreInsulation'))
    ) {
      child.castShadow = false;
    }
  }
  addOutbuildingBrickWall(
    groundGroup,
    12.85,
    13.75,
    storeFloorTopY + 2.02,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  addBoardedBarnDoor(
    groundGroup,
    13.3,
    storeFloorTopY,
    vEastRangeNorth + wallT * 0.5,
    0.9,
    2.02,
    false,
    courtyardDoorMat,
    'Store Courtyard Door'
  );
  addOutbuildingBrickWall(
    groundGroup,
    13.75,
    uBarnStart + 0.24,
    storeFloorTopY - 0.14,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart + 0.24,
    15.85,
    storeFloorTopY - 0.14,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );

  addOutbuildingBrickWall(
    groundGroup,
    15.85,
    16.85,
    barnWestFloorY + 2.02,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  addBoardedBarnDoor(
    groundGroup,
    16.35,
    barnWestFloorY,
    vEastRangeNorth + wallT * 0.5,
    1.0,
    2.02,
    false,
    courtyardDoorMat,
    'Barn Courtyard Door'
  );


  // West Barn North Courtyard Wall (`u = 16.85..18.68m`, rising to `barnUpperTopY = 2.92m`) & East Barn Lower North Wall under Mezzanine (`u = 18.68..23.22m, y <= 1.54m`)
  // finished in Farrow & Ball "Setting Plaster" (`settingPlasterMat`) per Issues #8 & #9!
  addOutbuildingBrickWall(
    groundGroup,
    16.85,
    uMezzanineFront,
    barnLowerFloorY - 0.14,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    uMezzanineFront,
    uBarnEnd,
    barnLowerFloorY - 0.14,
    mezzanineFloorY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 21.35, yCenter: 0.78, width: 0.92, height: 0.76 }],
    settingPlasterMat
  );
  // Fill the `u = 23.02..23.22m, y = 1.54..1.96m` Barn/Stable step junction on the North Courtyard Wall (Issue #1: "random hole in the wall here")
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    exteriorBrickMat,
    settingPlasterMat
  );

  // North Courtyard Wall of 2-Storey Stable (Ground Floor: u = 23.22m..28.77m, rising to `stableGroundTopY = 1.96m` — Issue #11!)
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    23.8,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    23.8,
    24.7,
    stableGroundFloorY + 2.04,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    24.25,
    stableGroundFloorY,
    vEastRangeNorth + wallT * 0.5,
    0.9,
    2.04,
    false,
    courtyardDoorMat,
    'Stable Courtyard Door'
  );

  // East portion of Stable North wall (extended to `uStableExtEnd - wallT = 31.57m` per Issue #6)
  // with casement windows at `u = 26.55m` and `u = 29.95m`
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    24.7,
    uStableExtEnd - wallT,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [
      { uCenter: 26.55, yCenter: 1.18, width: 0.92, height: 0.92 },
      { uCenter: 30.75, yCenter: 1.18, width: 0.92, height: 0.92 },
    ]
  );

  // Structural Wing Piers & Exposed Oak Portal Beam at `u = 29.77m..30.05m` supporting the Upper-Floor East Gable Wall above
  for (const [vP0, vP1] of [
    [vEastRangeNorth + wallT + 0.002, 0.86],
    [vEastRangeSouth - wallT - 0.58, vEastRangeSouth - wallT - 0.002],
  ] as const) {
    addOutbuildingBrickWall(
      groundGroup,
      uStableEnd - wallT,
      uStableEnd,
      stableGroundFloorY,
      stableGroundTopY,
      vP0,
      vP1,
      ['+x', '-x', '+z', '-z'],
      warmRoomPlasterMat
    );
  }
  const stableExtPortalBeam = new THREE.Mesh(
    new THREE.BoxGeometry(wallT - 0.02, 0.16, (vEastRangeSouth - wallT - 0.58) - 0.86),
    lightJoineryOakMat
  );
  stableExtPortalBeam.name = 'outbuildings.stable.extensionPortalBeam';
  stableExtPortalBeam.position.set(
    uStableEnd - wallT * 0.5,
    stableGroundTopY - 0.08,
    (0.86 + (vEastRangeSouth - wallT - 0.58)) * 0.5
  );
  stableExtPortalBeam.castShadow = true;
  groundCeilingGroup.add(stableExtPortalBeam);

  // Batch 1 Issue #2 ("Small cloakroom toilet here" at `[1.816, -0.44, 18.594]` -> `u = 23.978m, y = -0.44m, v = 4.666m`):
  // Compact Ground-Floor Cloakroom WC in the SW corner of the Stable Ground Floor (`u = 23.22..24.75m, v = 3.94..5.428m`)!
  // =========================================================================
  // BUILDING REGULATIONS PASS (Part L Breathable 60mm Wood-Fibre IWI, Part C
  // Sunken Damp-Proof Cavity Membrane, Part B Interlinked LD2 Fire Alarms,
  // Part H Boxed 110mm SVP Soil Stack & Part F Extract Ventilation)
  // =========================================================================
  {
    const regsGroup = new THREE.Group();
    regsGroup.name = 'outbuildings.buildingRegs';
    regsGroup.userData.zone = 'courtyard';
    regsGroup.userData.isArchitecturalShell = true;
    groundGroup.add(regsGroup);

    // 1. Part C (Resistance to Moisture — Sunken East Barn Perimeter Cavity-Drain Damp Membrane & Drainage Channel):
    //    Because `barnCarpetTopY = -0.675m` sits 335-455mm below external ground level, a Newton 508 Type C drained
    //    cavity membrane & recessed perimeter inspection channel runs flush along the toe of the North & South baseboards.
    const dampChannelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2e34,
      roughness: 0.55,
      metalness: 0.45,
    });


    // 3. Part H (Drainage and Waste Disposal — Boxed 110mm SVP Soil Stack & Internal Durgo AAV in SW Stable Corner):
    //    Vertically connects the 1st-Floor Stable Ensuite WC (`u = 23.22..25.84m`) through the Ground Cloakroom WC (`u = 23.22..24.75m`).
    const svpPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, stableGroundTopY - stableGroundFloorY, 16),
      dampChannelMat
    );
    svpPipe.name = 'outbuildings.buildingRegs.partHSvpSoilStack.groundPipe';
    svpPipe.position.set(23.34, (stableGroundFloorY + stableGroundTopY) * 0.5, 5.28);
    regsGroup.add(svpPipe);

    // 4. Part F (Ventilation — 15 L/s Humidity-Controlled Mechanical Extract Fan in Stable Ground Cloakroom WC):
    const fanBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf7f5f0,
      roughness: 0.32,
      metalness: 0.08,
    });
    const cloakExtractFan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.018, 20),
      fanBodyMat
    );
    cloakExtractFan.name = 'outbuildings.buildingRegs.partFExtractFan.stableCloakroom';
    cloakExtractFan.position.set(24.0, stableGroundTopY - 0.01, 4.95);
    regsGroup.add(cloakExtractFan);

    // 5. Part B (Fire Detection — Interlinked LD2 Grade D1 Optical Smoke & Heat Detectors):
    for (const [alarmTag, au, ay, av] of [
      ['gym', 2.85, 2.95, 2.855],
      ['garageHeat', 8.90, 2.95, 2.855],
      ['barnWest', 16.80, 3.85, 2.855],
      ['barnUnderMezzanine', 20.60, mezzanineFloorY - 0.155, 2.45],
      ['stableGround', 26.80, stableGroundTopY - 0.015, 2.855],
    ] as const) {
      const detector = new THREE.Mesh(
        new THREE.CylinderGeometry(0.054, 0.058, 0.024, 18),
        fanBodyMat
      );
      detector.name = `outbuildings.buildingRegs.fireAlarm.${alarmTag}`;
      detector.position.set(au, ay, av);
      regsGroup.add(detector);
    }
  }

  buildStableGroundCloakroom(
    groundGroup,
    stableGroundFloorY,
    stableGroundTopY,
    warmRoomPlasterMat,
    lightJoineryOakMat,
    ctx
  );

  // Batch 1 Issue #7 ("Large glass door here remove the window" at `[9.388, 0.456, 14.731]` -> `u = 31.85m, y = 0.456m, v = 1.460m`):
  // Extended Ground-Floor East End Wall of Stable (`u = 31.57m..31.85m, v = 0.00m..5.71m, rising to stableGroundTopY = 1.96m`)
  // with Large Full-Height Glazed Double Patio Door + Sidelights Assembly (`v = 1.15m..3.85m` = `2.70m` wide x `2.08m` high, `y = -0.44m..1.64m`)!
  const vEastDoorV0 = 1.15;
  const vEastDoorV1 = 3.85;
  const eastDoorBotY = stableGroundFloorY; // -0.44m
  const eastDoorTopY = 1.64; // 2.08m tall above -0.44m floor
  addOutbuildingBrickWall(
    groundGroup,
    uStableExtEnd - wallT,
    uStableExtEnd,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastDoorV0,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableExtEnd - wallT,
    uStableExtEnd,
    stableGroundFloorY - 0.14,
    eastDoorBotY,
    vEastDoorV0,
    vEastDoorV1,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableExtEnd - wallT,
    uStableExtEnd,
    eastDoorTopY,
    stableGroundTopY,
    vEastDoorV0,
    vEastDoorV1,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableExtEnd - wallT,
    uStableExtEnd,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastDoorV1,
    vEastRangeSouth,
    ['-x']
  );
  {
    const eastGlassDoorGroup = new THREE.Group();
    eastGlassDoorGroup.name = 'outbuildings.stable.eastExtensionGlassDoor';
    eastGlassDoorGroup.userData.zone = 'courtyard';
    const dMidU = uStableExtEnd - wallT * 0.5; // 31.71m
    const dMidV = (vEastDoorV0 + vEastDoorV1) * 0.5; // 2.50m
    const dSpanV = vEastDoorV1 - vEastDoorV0; // 2.70m
    const dSpanH = eastDoorTopY - eastDoorBotY; // 2.08m
    eastGlassDoorGroup.userData.cutawayWall = {
      axis: 'x',
      coord: dMidU,
      minSpan: vEastDoorV0,
      maxSpan: vEastDoorV1,
      floor: 'ground',
      outwardSide: 'east',
      includeInFirstFloorCutaway: false,
    };
    eastGlassDoorGroup.position.set(dMidU, eastDoorBotY, dMidV);
    groundGroup.add(eastGlassDoorGroup);

    const frameT = 0.036;
    const sillSlab = new THREE.Mesh(
      new THREE.BoxGeometry(wallT + 0.06, 0.028, dSpanV + 0.04),
      stoneSillMat
    );
    sillSlab.name = 'outbuildings.stable.eastExtensionGlassDoor.sillSlab';
    sillSlab.position.set(0.01, 0.014, 0);
    sillSlab.receiveShadow = true;
    eastGlassDoorGroup.add(sillSlab);

    const extHeaderLintel = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.08, dSpanV + 0.16),
      stoneSillMat
    );
    extHeaderLintel.name = 'outbuildings.stable.eastExtensionGlassDoor.extHeaderLintel';
    extHeaderLintel.position.set(wallT * 0.5 + 0.01, dSpanH + 0.04, 0);
    eastGlassDoorGroup.add(extHeaderLintel);

    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(wallT + 0.02, frameT, dSpanV),
      windowFrameMat
    );
    headFrame.name = 'outbuildings.stable.eastExtensionGlassDoor.headFrame';
    headFrame.position.set(0, dSpanH - frameT * 0.5, 0);
    eastGlassDoorGroup.add(headFrame);

    // Outer jambs + 2 mullion posts separating the North/South fixed sidelights (`0.46m` each) from the central `1.70m` double doors
    const sidelightW = 0.46;
    let eastDoorPostSeq = 0;
    for (const vz of [
      -dSpanV * 0.5 + frameT * 0.5,
      -dSpanV * 0.5 + sidelightW,
      dSpanV * 0.5 - sidelightW,
      dSpanV * 0.5 - frameT * 0.5,
    ] as const) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(wallT + 0.02, dSpanH - frameT, frameT),
        windowFrameMat
      );
      post.name = `outbuildings.stable.eastExtensionGlassDoor.framePost.${++eastDoorPostSeq}`;
      post.position.set(0, (dSpanH - frameT) * 0.5, vz);
      eastGlassDoorGroup.add(post);
    }

    // North & South fixed full-height glazed sidelights
    const slClearW = sidelightW - frameT * 1.5;
    const slClearH = dSpanH - frameT - 0.028;
    for (const sideSign of [-1, 1] as const) {
      const slCenterZ = sideSign * (dSpanV * 0.5 - sidelightW * 0.5 - frameT * 0.25);
      const slGlass = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, slClearH, slClearW),
        windowGlassMat
      );
      slGlass.name = 'outbuildings.stable.eastExtensionGlassDoor.sidelightGlass';
      slGlass.position.set(0, 0.028 + slClearH * 0.5, slCenterZ);
      eastGlassDoorGroup.add(slGlass);

      for (const ty of [0.028 + slClearH * 0.34, 0.028 + slClearH * 0.67] as const) {
        const hBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, 0.022, slClearW),
          windowFrameMat
        );
        hBar.name = `outbuildings.stable.eastExtensionGlassDoor.sidelightBar.${sideSign < 0 ? "north" : "south"}.${ty < slClearH * 0.5 ? "lower" : "upper"}`;
        hBar.position.set(0, ty, slCenterZ);
        eastGlassDoorGroup.add(hBar);
      }
    }

    // Twin interactive hinged glazed double patio doors across the central `1.70m` opening
    const centerClearW = dSpanV - sidelightW * 2 - frameT;
    const singleLeafW = centerClearW * 0.5 - 0.004;
    const leafClearH = dSpanH - frameT - 0.032;
    const stileW = 0.058;
    const botRailH = 0.18;
    const topRailH = 0.068;

    const eastGlassDoorPivots: THREE.Group[] = [];
    for (const [leafIdx, sideSign] of [
      [1, -1],
      [2, 1],
    ] as const) {
      const hingeZ = sideSign * (centerClearW * 0.5);
      const leafPivot = new THREE.Group();
      leafPivot.name = `outbuildings.stable.eastExtensionGlassDoor.leafPivot.${leafIdx}`;
      leafPivot.position.set(0.02, 0.028, hingeZ);
      eastGlassDoorGroup.add(leafPivot);

      const inwardDir = -sideSign;
      const leafMidZ = inwardDir * (singleLeafW * 0.5);

      for (const sz of [inwardDir * (stileW * 0.5), inwardDir * (singleLeafW - stileW * 0.5)] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.046, leafClearH, stileW),
          windowFrameMat
        );
        stile.name = `outbuildings.stable.eastExtensionGlassDoor.stile.${leafIdx}.${Math.abs(sz) < singleLeafW * 0.5 ? "hinge" : "leading"}`;
        stile.position.set(0, leafClearH * 0.5, sz);
        stile.castShadow = true;
        leafPivot.add(stile);
      }
      const botRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, botRailH, singleLeafW - stileW * 2),
        windowFrameMat
      );
      botRail.name = `outbuildings.stable.eastExtensionGlassDoor.bottomRail.${leafIdx}`;
      botRail.position.set(0, botRailH * 0.5, leafMidZ);
      botRail.castShadow = true;
      leafPivot.add(botRail);

      const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, topRailH, singleLeafW - stileW * 2),
        windowFrameMat
      );
      topRail.name = `outbuildings.stable.eastExtensionGlassDoor.topRail.${leafIdx}`;
      topRail.position.set(0, leafClearH - topRailH * 0.5, leafMidZ);
      topRail.castShadow = true;
      leafPivot.add(topRail);

      const paneW = singleLeafW - stileW * 2 + 0.01;
      const paneH = leafClearH - botRailH - topRailH + 0.01;
      const paneCY = botRailH + paneH * 0.5;
      const glassPane = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, paneH, paneW),
        windowGlassMat
      );
      glassPane.name = `outbuildings.stable.eastExtensionGlassDoor.glass.${leafIdx}`;
      glassPane.position.set(0, paneCY, leafMidZ);
      leafPivot.add(glassPane);

      for (const gy of [botRailH + paneH * 0.34, botRailH + paneH * 0.67] as const) {
        const hBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.032, 0.022, paneW),
          windowFrameMat
        );
        hBar.name = `outbuildings.stable.eastExtensionGlassDoor.glazingBar.${leafIdx}.${gy < paneCY ? "lower" : "upper"}`;
        hBar.position.set(0, gy, leafMidZ);
        leafPivot.add(hBar);
      }

      for (const hx of [-0.036, 0.036] as const) {
        const handle = new THREE.Mesh(
          new THREE.BoxGeometry(0.026, 0.018, 0.11),
          spotlightBrassTrimMat
        );
        handle.name = `outbuildings.stable.eastExtensionGlassDoor.handle.${leafIdx}.${hx < 0 ? "inside" : "outside"}`;
        handle.userData.lodTier = 'high';
        handle.position.set(hx, 0.98, inwardDir * (singleLeafW - stileW * 0.5 - 0.02));
        leafPivot.add(handle);
      }

      const registeredPivot = ctx.interactions.registerHingedDoor(
        eastGlassDoorGroup,
        leafPivot,
        new THREE.Vector3(0, 0, 0),
        'y',
        sideSign < 0 ? Math.PI * 0.46 : -Math.PI * 0.46
      );
      eastGlassDoorPivots.push(registeredPivot);
    }
    if (eastGlassDoorPivots.length === 2) {
      ctx.interactions.linkDoorPair(eastGlassDoorPivots[0]!, eastGlassDoorPivots[1]!);
    }

    // Issues #10 & #11 ("and here" at `[9.297, 0.706, 13.669]` on `outbuildings.groundShell.brickWall.73`
    // and `[9.673, 0.603, 18.047]` on `outbuildings.groundShell.brickWall.76`):
    // Architectural Up/Down Exterior Wall Sconce Lights flanking the Stable Ground-Floor East Extension Glazed Door
    // on the North brick pier (`v = 0.00..1.15m`, centered at `v = 0.58m`) and South brick pier (`v = 3.85..5.71m`, centered at `v = 4.65m`).
    addOutbuildingExteriorUpDownWallLight(
      groundGroup,
      uStableExtEnd,
      0.72,
      0.58,
      'outbuildings.stable.eastWallLight.north',
      'ground',
      0.0,
      vEastDoorV0
    );
    addOutbuildingExteriorUpDownWallLight(
      groundGroup,
      uStableExtEnd,
      0.72,
      4.65,
      'outbuildings.stable.eastWallLight.south',
      'ground',
      vEastDoorV1,
      vEastRangeSouth
    );
  }

  // Cast-iron rainwater downpipes at Step #1 (`u = 12.14m`) and Step #2 (`u = 23.28m`)
  const step1Downpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, barnUpperEaveH - 0.1, 12),
    castIronMat
  );
  step1Downpipe.name = 'outbuildings.roof.downpipe.step1';
  step1Downpipe.position.set(
    uStoreStart + 0.06,
    barnDatumY + (barnUpperEaveH - 0.1) * 0.5,
    vEastRangeNorth - 0.04
  );
  groundGroup.add(step1Downpipe);

  const step2Downpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, stableUpperEaveH - 0.1, 12),
    castIronMat
  );
  step2Downpipe.name = 'outbuildings.roof.downpipe.step2';
  step2Downpipe.position.set(
    uStableStart + 0.06,
    stableDatumY + (stableUpperEaveH - 0.1) * 0.5,
    vEastRangeNorth - 0.04
  );
  groundGroup.add(step2Downpipe);

  // Wall-clinging Climbing Ivy on the North Courtyard Brick Pier between Store Door (`13.75m`) and Barn Door (`15.85m`) — Issue #10!
  addWallClimbingIvyCluster(
    groundGroup,
    14.8,
    baseYBarnStart + 0.35,
    vEastRangeNorth - 0.02,
    'z',
    -1,
    1.5,
    barnUpperEaveH - 0.45,
    409
  );

  // Batch A Issue #1 ("on this wall we want to move the old hay r" at `[5.222, 1.207, 19.071]`) +
  // Follow-up Issue #1 ("no this is more just a wooden thing on the wall that the hey went in it was made entirely of wood. No hay in it though its just decorative"
  // at `[5.253, 1.179, 18.824]`, `outbuildings.stable.oldHayRack`):
  // Built entirely of seasoned solid English oak timber (`lightJoineryOakMat` & `lightJoineryOakPostMat`) with mortise-and-tenon
  // pegged joinery and turned wooden hay spindles — purely decorative and completely empty (no hay, no metal)!
  {
    const rackName = 'outbuildings.stable.oldHayRack';
    const rackGroup = new THREE.Group();
    rackGroup.name = rackName;
    rackGroup.userData.zone = 'courtyard';
    rackGroup.position.set(27.33, 1.21, vEastRangeSouth - wallT - 0.004);
    // Face North (`-v` in outbuilding coords = `+z` in local group coords when `rotation.y = Math.PI`)
    rackGroup.rotation.y = Math.PI;
    groundGroup.add(rackGroup);

    const rackW = 1.16;
    const rackH = 0.62;
    const botDepth = 0.11;
    const topDepth = 0.36;
    const halfW = rackW * 0.5;
    const halfH = rackH * 0.5;

    // 1. Rear Horizontal Solid-Oak Wall Mounting Ledgers (Top & Bottom) + Left/Right Rear Oak Wall Stiles
    for (const [ledgerSuffix, ly] of [
      ['topWallLedger', halfH - 0.028],
      ['bottomWallLedger', -halfH + 0.028],
    ] as const) {
      const ledger = new THREE.Mesh(
        new THREE.BoxGeometry(rackW + 0.06, 0.056, 0.028),
        lightJoineryOakPostMat
      );
      ledger.name = `${rackName}.${ledgerSuffix}`;
      ledger.position.set(0, ly, 0.014);
      ledger.castShadow = true;
      ledger.receiveShadow = true;
      rackGroup.add(ledger);
    }

    for (const [sideSuffix, sx] of [
      ['left', -halfW],
      ['right', halfW],
    ] as const) {
      // Rear vertical oak wall stile (`z = 0.018m`)
      const rearStile = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, rackH + 0.04, 0.034),
        lightJoineryOakPostMat
      );
      rearStile.name = `${rackName}.rearWallStile.${sideSuffix}`;
      rearStile.position.set(sx, 0, 0.017);
      rearStile.castShadow = true;
      rearStile.receiveShadow = true;
      rackGroup.add(rearStile);

      // Lower horizontal oak side cheek rail (`y = -halfH + 0.028`, bridging wall to lower front rail)
      const botSideRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.048, botDepth),
        lightJoineryOakPostMat
      );
      botSideRail.name = `${rackName}.bottomSideRail.${sideSuffix}`;
      botSideRail.position.set(sx, -halfH + 0.028, botDepth * 0.5 + 0.01);
      botSideRail.castShadow = true;
      botSideRail.receiveShadow = true;
      rackGroup.add(botSideRail);

      // Upper horizontal oak side cheek arm (`y = +halfH - 0.026`, projecting out `topDepth = 0.36m` from wall)
      const topSideArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, 0.052, topDepth),
        lightJoineryOakPostMat
      );
      topSideArm.name = `${rackName}.topSideArm.${sideSuffix}`;
      topSideArm.position.set(sx, halfH - 0.026, topDepth * 0.5 + 0.01);
      topSideArm.castShadow = true;
      topSideArm.receiveShadow = true;
      rackGroup.add(topSideArm);

      // Angled front corner oak post raking from `(sx, -halfH + 0.028, botDepth)` up to `(sx, halfH - 0.026, topDepth)`
      const dy = rackH - 0.054;
      const dz = topDepth - botDepth;
      const rakeLen = Math.hypot(dy, dz);
      const rakeAngle = Math.atan2(dz, dy);
      const angledFrontStile = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, rakeLen + 0.02, 0.046),
        lightJoineryOakPostMat
      );
      angledFrontStile.name = `${rackName}.angledFrontStile.${sideSuffix}`;
      angledFrontStile.position.set(sx, 0, (botDepth + topDepth) * 0.5 + 0.004);
      angledFrontStile.rotation.x = rakeAngle;
      angledFrontStile.castShadow = true;
      angledFrontStile.receiveShadow = true;
      rackGroup.add(angledFrontStile);

      // 2 Turned wooden side spindles inside each trapezoidal side cheek
      for (let sr = 1; sr <= 2; sr++) {
        const frac = sr / 3;
        const szBot = 0.028 + frac * (botDepth - 0.032);
        const szTop = 0.028 + frac * (topDepth - 0.032);
        const sDz = szTop - szBot;
        const sLen = Math.hypot(dy, sDz);
        const sideSpindle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, sLen, 12),
          lightJoineryOakMat
        );
        sideSpindle.name = `${rackName}.sideSpindle.${sideSuffix}.${sr}`;
        sideSpindle.position.set(sx, 0, (szBot + szTop) * 0.5);
        sideSpindle.rotation.x = Math.atan2(sDz, dy);
        sideSpindle.castShadow = true;
        rackGroup.add(sideSpindle);
      }

      // Traditional carpenter's oak dowel peg heads on the mortise-and-tenon joints
      for (const [pegIdx, py, pz] of [
        [1, halfH - 0.026, 0.035],
        [2, halfH - 0.026, topDepth - 0.015],
        [3, -halfH + 0.028, 0.035],
        [4, -halfH + 0.028, botDepth - 0.01],
      ] as const) {
        const peg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, 0.056, 8),
          lightJoineryOakMat
        );
        peg.name = `${rackName}.oakPeg.${sideSuffix}.${pegIdx}`;
        peg.rotation.z = Math.PI / 2;
        peg.position.set(sx, py, pz);
        rackGroup.add(peg);
      }
    }

    // 2. Heavy Chamfered Solid-Oak Top Front Breast Rail & Lower Front Cradle Rail
    const topFrontRail = new THREE.Mesh(
      new THREE.BoxGeometry(rackW + 0.06, 0.056, 0.048),
      lightJoineryOakPostMat
    );
    topFrontRail.name = `${rackName}.topFrontRail`;
    topFrontRail.position.set(0, halfH - 0.026, topDepth - 0.008);
    topFrontRail.castShadow = true;
    topFrontRail.receiveShadow = true;
    rackGroup.add(topFrontRail);

    const bottomFrontRail = new THREE.Mesh(
      new THREE.BoxGeometry(rackW + 0.05, 0.052, 0.044),
      lightJoineryOakPostMat
    );
    bottomFrontRail.name = `${rackName}.bottomFrontRail`;
    bottomFrontRail.position.set(0, -halfH + 0.028, botDepth - 0.004);
    bottomFrontRail.castShadow = true;
    bottomFrontRail.receiveShadow = true;
    rackGroup.add(bottomFrontRail);

    // 3. Slatted Solid-Oak Bottom Base Boards (`2` longitudinal oak slats at `y = -halfH + 0.022`)
    for (let b = 0; b < 2; b++) {
      const bz = 0.042 + b * 0.036;
      const baseSlat = new THREE.Mesh(
        new THREE.BoxGeometry(rackW - 0.04, 0.018, 0.026),
        lightJoineryOakMat
      );
      baseSlat.name = `${rackName}.bottomSlat.${b + 1}`;
      baseSlat.position.set(0, -halfH + 0.022, bz);
      baseSlat.castShadow = true;
      baseSlat.receiveShadow = true;
      rackGroup.add(baseSlat);
    }

    // 4. 11 Angled Turned Solid-Oak Hay Spindles / Rungs raking from `bottomFrontRail` up to `topFrontRail`
    const spindleCount = 11;
    const spindleDy = rackH - 0.054;
    const spindleDz = (topDepth - 0.008) - (botDepth - 0.004);
    const spindleLen = Math.hypot(spindleDy, spindleDz);
    const spindleRake = Math.atan2(spindleDz, spindleDy);
    const spindleGeo = new THREE.CylinderGeometry(0.013, 0.013, spindleLen, 14);

    for (let i = 0; i < spindleCount; i++) {
      const t = (i + 1) / (spindleCount + 1); // evenly spaced between the left and right oak stiles
      const sx = -halfW + t * rackW;
      const spindle = new THREE.Mesh(spindleGeo, lightJoineryOakMat);
      spindle.name = `${rackName}.oakSpindle.${i + 1}`;
      spindle.position.set(sx, 0, ((botDepth - 0.004) + (topDepth - 0.008)) * 0.5);
      spindle.rotation.x = spindleRake;
      spindle.castShadow = true;
      spindle.receiveShadow = true;
      rackGroup.add(spindle);
    }
  }
}
