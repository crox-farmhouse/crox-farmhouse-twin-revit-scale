import * as THREE from 'three';
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
  OUTBUILDING_ORIGIN_X,
  OUTBUILDING_ORIGIN_Z,
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
    barnCeilEaveY,
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
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
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
  buildGymTechnogymRunPersonal(groundGroup, baseY0 + 0.012);

  // Nike Strength Squat Cage, Flat Bench, Crimson Barbell & Solid-Color Nike Pro Bumper Plates (`outbuildings.gym.nikeSquatRack`)
  buildGymNikeSquatRack(groundGroup, baseY0 + 0.012);

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

  // Issue #1 ("We need to fit a small shower room and toilet in this back corner." at `[-13.364, -0.5, 19.781]`) &
  // Issue #5 ("Entrance to shower room ideally from both gym and garage, or just from 1" at `[-15.934, -0.5, 19.899]`):
  // Small Shower Room & Toilet (`outbuildings.garage.showerRoom`) in the SW back corner of the Garage (`u = 5.97..8.92m, v = 3.85..5.43m`)
  // with dual interactive oak doors from both the Gym and the Garage!
  buildGarageShowerRoom(
    ctx,
    groundGroup,
    groundCeilingGroup,
    garageFloorTopY,
    baseY0 + 0.012,
    northWestWallTopY
  );

  // Issue #8 ("Some brighter LED lighting in here (cool)" at `[-15.005, 0.851, 20.809]`, Garage South Wall at `u = 7.02m, y = 0.851m, v = 5.43m`):
  // High-Output Cool-White (`5600K`, `#ebf6ff`) Linear LED Batten Lighting System (`outbuildings.garage.ledLighting`):
  // - 4 sleek cool-white linear LED cornice batten fixtures (`1.85m` long) along the Garage North (`v = 0.31m`) & South (`v = 5.40m`) walls
  //   at `u = 7.35m` (West bay over the Porsche 992.2 Turbo S) and `u = 10.40m` (East bay over the STIHL wall rack & workbench)
  // - 2 vertical cool-white LED wall-wash light bars on the Garage South wall at `u = 7.02m` (exact hit point `[-15.005, 0.851, 20.809]`!)
  //   and `u = 8.85m` (`y = 0.25m..1.52m`)
  // - 4 overhead vaulted-ceiling cool-white linear LED battens in `groundCeilingGroup` + 2 bright cool-white `THREE.PointLight`s
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

    // Issue #2 ("Remove this off the back wall" at `[-15.014, 0.677, 20.769]`, `outbuildings.garage.ledLighting.southVerticalDiffuser.1`):
    // Removed the vertical & horizontal LED bars from the Garage South (back) wall; kept only the 2 North over-door
    // cornice LED battens (`v = wallT + 0.024`) plus the 4 overhead ceiling LED battens and cool-white PointLights.

    // 4 Overhead High-Bay Linear Cool-White LED Strips attached to `garageLedGroup` (`y = 2.02m`, visible at low opacity!)
    const ceilingLedGroup = new THREE.Group();
    ceilingLedGroup.name = 'outbuildings.garage.ledLighting.ceilingBattens';
    garageLedGroup.add(ceilingLedGroup);

    let ceilLedSeq = 0;
    for (const cu of [7.35, 10.4] as const) {
      for (const cv of [1.85, 3.85] as const) {
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
    }

    // 2 Cool-White (`5600K`, `0xe4f3ff`) PointLights illuminating the Porsche 992.2 Turbo S and East Workshop Bay
    for (const lu of [7.45, 10.35] as const) {
      const coolLight = new THREE.PointLight(0xe4f3ff, 3.6, 10.5, 1.35);
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
  addOutbuildingBrickWall(groundGroup, 5.45, 6.08, baseY0 - 0.14, northWestWallTopY, 0, wallT, ['+z']);

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
  const storeFloorSpanV = 0.893; // v = 0.285m..1.178m
  const storeFloorCenterV = 0.285 + storeFloorSpanV * 0.5; // 0.7315m
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

  // Issue #8 ("Make the lower section a little larger, move the steps forward slightly (maybe 50cm).
  // On this side have a bar with some stools so people can watch the golf and wait their turn" at `[-3.975, -0.34, 18.437]`):
  // Move the 2-step floor drop `50cm` forward (West) from `uMezzanineFront = 18.68m` to `uBarnStepDropStart = 18.18m`,
  // so `barnWestFloor` spans `u = 15.20..18.18m` (`2.98m` wide), the 2 bullnose oak steps span `u = 18.18..18.46m`,
  // and the carpeted lower lounge/pool/bar floor (`barnEastLowerFloor`) spans `u = 18.46..23.02m` (`4.56m` wide — 50cm larger!).
  const uBarnStepDropStart = uMezzanineFront - 0.50; // 18.18m
  const barnWestFloorSpanU = uBarnStepDropStart - (uBarnStart + 0.24); // 2.98m
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

  // 2 Bullnose Light-Oak Steps Down at `u = 18.18m..18.46m` dropping from `barnWestFloorY = -0.34m`
  // down to the carpeted lower floor (`-0.675m`), spanning `v = 0.28m..3.62m` (`stepSpanV = 3.34m`) so the South end
  // of the steps butts cleanly against the North edge (`v = 3.62m`) of the shifted Golf Viewing Bar (`u = 18.18..18.58m, v = 3.62..5.42m`)!
  const stepDownDepthU = 0.28;
  const stepTreadT = 0.032;
  const stepBullnoseR = stepTreadT * 0.5; // 16mm half-round bullnose radius
  const stepOverhangU = 0.022;
  const step1TopY = (barnWestFloorY + barnCarpetTopY) * 0.5; // -0.5075m
  const vGolfBarNorthEdge = 3.62;
  const stepSpanV = vGolfBarNorthEdge - (vEastRangeNorth + wallT); // 3.34m (0.28m..3.62m)
  const stepCenterV = vEastRangeNorth + wallT + stepSpanV * 0.5;   // 1.95m

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
  const barnEastLowerFloorGeo = new THREE.BoxGeometry(barnLowerFloorSpanU, 0.145, eastRangeInternalV);
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
  const garagePassDoorVMin = 0.38;
  const garagePassDoorVMax = 1.18;
  const garagePassDoorTopY = 1.66; // Standard 2.00m door height above the -0.34m threshold step (`2.16m` above `-0.50m` garage floor, flush with `1.66m` cupboard top!)
  const benchAlcoveVMin = 1.34;
  const benchAlcoveVMax = vEastRangeSouth - wallT - 0.002; // 5.428m

  // 1. Lower sill / step wall (`y = barnLowerFloorY (-0.70m) .. garageFloorTopY (-0.50m)`): full span `vInnerNorth .. vInnerSouth`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    barnLowerFloorY,
    garageFloorTopY,
    vEastRangeNorth + wallT + 0.002,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2a. North-most corner jamb pier (`v = 0.282m .. 0.38m`): `y = garageFloorTopY (-0.50m) .. eastRangeGroundTopY (1.94m)`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garageFloorTopY,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT + 0.002,
    garagePassDoorVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2b. Over-door lintel (`v = 0.38m .. 1.18m`): `y = 1.66m .. eastRangeGroundTopY (1.94m)`
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
  // 2c. Center pier between the Pass-Through Door (`v = 1.18m`) and the Tall Stainless Cupboard (`v = 1.34m`)
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
  // 3. Unified upper lintel header above both the Tall Stainless Cupboard and the Recessed Workbench (`v = 1.34m .. 5.428m, y = 1.66m .. 1.94m` — Issue #4!)
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

  // Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`), Issue #3,
  // Issue #4 ("Flatten the floor in this loft space and level the floor where its not level" at `[-8.51, 2.61, 17.685]`), &
  // Issue #5 ("Put a ladder here to access the loft space above" at `[-8.212, 1.186, 15.959]`):
  // - Extend the South Hallway Wall (`u = 12.31m..14.96m, v = 1.18m..1.34m`) and the Store-side enclosure walls
  //   (`u = 12.31m..13.04m` and `v = 5.12m..5.428m`) continuously up to `storeLoftSlabBotY = 2.52m` so the entire
  //   Store Loft space (`u = 12.31m..14.96m, v = 1.18m..5.428m`) supports a single flat, 100% level oak floor at `y = 2.61m`!
  const storeLoftSlabBotY = 2.52;
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    uBarnStart,
    garageFloorTopY,
    storeLoftSlabBotY,
    garagePassDoorVMax,
    benchAlcoveVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    12.78,
    13.04,
    garageFloorTopY,
    storeLoftSlabBotY,
    benchAlcoveVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    13.04,
    uBarnStart,
    garageFloorTopY,
    storeLoftSlabBotY,
    5.12,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    12.78,
    1.66,
    storeLoftSlabBotY,
    benchAlcoveVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

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
    const jambD = 0.244;
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

    for (const faceX of [-0.125, 0.125] as const) {
      for (const sideZ of [-1, 1] as const) {
        const legArch = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, passDoorH + 0.065, 0.068),
          lightJoineryOakMat
        );
        legArch.name = 'outbuildings.garage.golfPassThroughDoor.architrave';
        legArch.position.set(faceX, (passDoorH + 0.065) * 0.5, sideZ * (passDoorW * 0.5 + 0.018));
        passDoorGroup.add(legArch);
      }
      const headArch = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.068, passDoorW + 0.172),
        lightJoineryOakMat
      );
      headArch.name = 'outbuildings.garage.golfPassThroughDoor.architrave';
      headArch.position.set(faceX, passDoorH + 0.032, 0);
      passDoorGroup.add(headArch);
    }
  }
  // Issue #3 ("Show this full wall in cutout view incl gable from the inside " at `[-10.207, 1.803, 17.731]`):
  // Attach both the Garage-side interior plaster gable (`u = 12.07..12.165m`) and the full-height Store-side
  // interior plaster gable (`u = 12.095..12.315m`, rising from `1.94m` to `2.92m` eaves and `4.269m` ridge)
  // directly to `groundGroup` so the full step-up wall and gable are visible in cutout view from both inside and outside!
  addInteriorPlasterGableWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.165,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    eastRangeGroundTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.garageStoreStep1InteriorGable'
  );
  // Store side (`+x` at `u = 12.095..12.315m`) painted plasterboard wall & gable extending up to the Store vaulted ceiling (`barnCeilRidgeY`)
  addInteriorPlasterGableWall(
    groundGroup,
    uStoreStart + 0.095,
    uStoreStart + 0.245,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    eastRangeGroundTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeWestInteriorPlasterGable'
  );

  // Issue #9 ("2.8m tall golf simulator here cut into the wall, 4m wide, backs into the store room" at `[-7.044, 1.391, 17.979]`,
  // + "its a trackman io, i want a widescreen one, so make of that what you will"):
  // Internal Cross-Wall at `u = 14.96m..15.20m` (Store/Barn partition) with a `4.48m` Widescreen (`16:10`) x `2.80m` tall
  // rectangular portal cutout (`v = 0.615m..5.095m, y = -0.34m..2.46m`) so the recessed TrackMan iO Golf Simulator
  // sits flush in the Barn wall and backs `1.48m` into the Store room!
  // Issue #7 ("Exposed brick around the golf simulator" at `[-6.962, 2.681, 18.934]` -> `u = 15.20m, y = 2.681m, v = 4.251m`):
  // The Store/Barn cross-wall (`u = 14.96..15.20m`) framing the Golf Simulator (North pier, South pier, upper lintel,
  // and Barn-side upper gable `outbuildings.storeBarnPartitionGable`) uses exposed red/multi-stock brickwork (`exteriorBrickMat`)
  // on the Barn face (`+x`) and portal reveals (`+z`, `-z`), keeping only the Store back face (`-x`) plastered!
  const simCutoutVMin = 1.32;
  const simCutoutVMax = 5.12;
  const simCutoutTopY = barnWestFloorY + 2.85; // 2.51m (9'4" TrackMan iO minimum height)
  const barnHallPortalVMin = 0.38;
  const barnHallPortalVMax = 1.18;
  const barnHallPortalTopY = 1.78;
  // North corner brick pier (`v = 0.282m .. 0.44m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    storeFloorTopY - 0.12,
    barnUpperTopY,
    vEastRangeNorth + wallT + 0.002,
    barnHallPortalVMin,
    ['-x'],
    exteriorBrickMat
  );
  // Over-portal brick lintel above the North Hallway walk-through opening (`v = 0.38m .. 1.18m, y = 1.78m .. 2.92m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    barnHallPortalTopY,
    barnUpperTopY,
    barnHallPortalVMin,
    barnHallPortalVMax,
    ['-x'],
    exteriorBrickMat
  );
  // Issue #4 ("Line this door too" at `[-7.48, 1.84, 15.711]`, `BoxGeometry(0.24 × 1.14 × 0.8)`):
  // Cased Solid Light-Oak Walkthrough Archway (`outbuildings.barn.hallWalkthroughDoor`) lining the Store-to-Barn
  // corridor portal (`u = 14.96..15.20m, v = 0.38..1.18m, y = -0.34..1.78m`) with oak threshold strip, jamb linings,
  // head lining, and chamfered oak architraves on both the Store corridor (`-x`) and Barn exposed-brick (`+x`) faces!
  {
    const portalW = barnHallPortalVMax - barnHallPortalVMin; // 0.80m
    const portalH = barnHallPortalTopY - barnWestFloorY; // 2.12m (from -0.34m floor to 1.78m lintel)
    const portalCenterV = (barnHallPortalVMin + barnHallPortalVMax) * 0.5; // 0.78m
    const portalCenterU = uBarnStart + 0.12; // 15.08m

    const hallDoorwayGroup = new THREE.Group();
    hallDoorwayGroup.name = 'outbuildings.barn.hallWalkthroughDoor';
    hallDoorwayGroup.userData.zone = 'courtyard';
    hallDoorwayGroup.position.set(portalCenterU, barnWestFloorY, portalCenterV);
    groundGroup.add(hallDoorwayGroup);

    const threshStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.244, 0.018, portalW),
      lightJoineryOakMat
    );
    threshStrip.name = 'outbuildings.barn.hallWalkthroughDoor.threshold';
    threshStrip.position.set(0, 0.009, 0);
    threshStrip.receiveShadow = true;
    hallDoorwayGroup.add(threshStrip);

    const jambT = 0.032;
    const jambD = 0.244;
    for (const sideZ of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambD, portalH - 0.018, jambT),
        lightJoineryOakMat
      );
      jamb.name = 'outbuildings.barn.hallWalkthroughDoor.jamb';
      jamb.position.set(0, 0.018 + (portalH - 0.018) * 0.5, sideZ * (portalW * 0.5 - jambT * 0.5));
      jamb.castShadow = true;
      hallDoorwayGroup.add(jamb);
    }

    const headJamb = new THREE.Mesh(
      new THREE.BoxGeometry(jambD, jambT, portalW),
      lightJoineryOakMat
    );
    headJamb.name = 'outbuildings.barn.hallWalkthroughDoor.headJamb';
    headJamb.position.set(0, portalH - jambT * 0.5, 0);
    headJamb.castShadow = true;
    hallDoorwayGroup.add(headJamb);

    for (const faceX of [-0.125, 0.125] as const) {
      for (const sideZ of [-1, 1] as const) {
        const legArch = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, portalH + 0.065, 0.068),
          lightJoineryOakMat
        );
        legArch.name = 'outbuildings.barn.hallWalkthroughDoor.architrave';
        legArch.position.set(faceX, (portalH + 0.065) * 0.5, sideZ * (portalW * 0.5 + 0.018));
        legArch.castShadow = true;
        hallDoorwayGroup.add(legArch);
      }
      const headArch = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.068, portalW + 0.172),
        lightJoineryOakMat
      );
      headArch.name = 'outbuildings.barn.hallWalkthroughDoor.architrave';
      headArch.position.set(faceX, portalH + 0.032, 0);
      headArch.castShadow = true;
      hallDoorwayGroup.add(headArch);
    }
  }
  // Issue #6 ("there will be an oak lintel here probably" at `[-7.069, 2.646, 17.691]` -> `u = 15.08m, y = 2.646m, v = 3.22m`):
  // Heavy Structural Seasoned European Oak Bressummer Lintel (`outbuildings.barn.golfSimulator.oakLintel`)
  // spanning across the top of the `3.80m` Golf Simulator opening (`y = 2.51m..2.74m`, `v = 1.18m..5.28m` with `0.14m..0.16m`
  // end-bearing pockets resting on the flanking brick piers), supporting the upper courses of brickwork (`y = 2.74m..2.92m`)!
  const simOakLintelH = 0.23; // Spans y = 2.51m .. 2.74m (covering hit point y = 2.646m!)
  const simOakLintelTopY = simCutoutTopY + simOakLintelH; // 2.74m
  const simOakLintelVMin = barnHallPortalVMax; // 1.18m (0.14m North bearing on the dividing brick pier)
  const simOakLintelVMax = simCutoutVMax + 0.16; // 5.28m (0.16m South bearing on the South brick pier)

  // Dividing brick pier between the North Hallway Portal (`v = 1.18m`) and the Golf Simulator (`v = 1.32m`) below the oak lintel
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    storeFloorTopY - 0.12,
    simCutoutTopY,
    barnHallPortalVMax,
    simCutoutVMin,
    ['-x'],
    exteriorBrickMat
  );
  // South brick pier alongside the Golf Simulator (`v = 5.12..5.428m`) below the oak lintel
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    storeFloorTopY - 0.12,
    simCutoutTopY,
    simCutoutVMax,
    vEastRangeSouth - wallT - 0.002,
    ['-x'],
    exteriorBrickMat
  );
  // South outer brick pier alongside the oak lintel end-bearing (`v = 5.28..5.428m, y = 2.51..2.74m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    simCutoutTopY,
    simOakLintelTopY,
    simOakLintelVMax,
    vEastRangeSouth - wallT - 0.002,
    ['-x'],
    exteriorBrickMat
  );
  // Issue #2 ("No baseboards up here. Just put some clear storage boxes full of stuff" at `[-7.363, 2.72, 17.168]`,
  // Surface Normal `[-0.996, 0, 0.086]` on `outbuildings.barn.golfSimulator.oakLintel.beam`):
  // Keep the Oak Bressummer Lintel (`outbuildings.barn.golfSimulator.oakLintel`) on the Barn (`+x`) half of the wall
  // (`u = 15.06m .. 15.208m`) while the Store Loft (`-x`) half (`u = 14.96m .. 15.06m`) is flush plastered wall (`warmRoomPlasterMat`),
  // so the oak lintel never protrudes through the West (`-x`) Store Loft wall face like a baseboard at `y = 2.61..2.74m`!
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.10,
    simCutoutTopY,
    simOakLintelTopY,
    simOakLintelVMin,
    simOakLintelVMax,
    ['-x'],
    exteriorBrickMat
  );
  {
    const lintelLenV = simOakLintelVMax - simOakLintelVMin; // 4.10m
    const lintelMidV = (simOakLintelVMin + simOakLintelVMax) * 0.5; // 3.23m
    const lintelMidY = simCutoutTopY + simOakLintelH * 0.5; // 2.625m
    const lintelDepthU = 0.148; // Spans u = 15.06m .. 15.208m (projects 8mm proud on the Barn +x face only!)
    const lintelMidU = uBarnStart + 0.24 + 0.008 - lintelDepthU * 0.5; // 15.134m

    const oakLintelGroup = new THREE.Group();
    oakLintelGroup.name = 'outbuildings.barn.golfSimulator.oakLintel';
    oakLintelGroup.userData.zone = 'courtyard';
    oakLintelGroup.userData.isArchitecturalShell = true;
    oakLintelGroup.position.set(lintelMidU, lintelMidY, lintelMidV);
    groundGroup.add(oakLintelGroup);

    const lintelBeamGeo = new THREE.BoxGeometry(lintelDepthU, simOakLintelH, lintelLenV);
    applyOutbuildingFloorUVs(
      lintelBeamGeo,
      OUTBUILDING_ORIGIN_X + lintelMidU,
      lintelMidY,
      OUTBUILDING_ORIGIN_Z + lintelMidV,
      0.5
    );
    const lintelBeam = new THREE.Mesh(lintelBeamGeo, lightJoineryOakMat);
    lintelBeam.name = 'outbuildings.barn.golfSimulator.oakLintel.beam';
    lintelBeam.userData.isArchitecturalShell = true;
    lintelBeam.castShadow = true;
    lintelBeam.receiveShadow = true;
    oakLintelGroup.add(lintelBeam);

    // Traditional chamfered lower arris shadow molding and square oak treenail pegs on the Barn (+x) face
    const lowerChamfer = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.018, lintelLenV + 0.008),
      lightJoineryOakMat
    );
    lowerChamfer.name = 'outbuildings.barn.golfSimulator.oakLintel.lowerChamfer';
    lowerChamfer.userData.lodTier = 'high';
    lowerChamfer.position.set(lintelDepthU * 0.5 + 0.003, -simOakLintelH * 0.5 + 0.012, 0);
    oakLintelGroup.add(lowerChamfer);

    for (const endZ of [-lintelLenV * 0.5 + 0.07, -lintelLenV * 0.5 + 0.12, lintelLenV * 0.5 - 0.12, lintelLenV * 0.5 - 0.07] as const) {
      for (const pegY of [-0.045, 0.045] as const) {
        const oakPeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011, 0.011, 0.014, 8),
          lightJoineryOakMat
        );
        oakPeg.name = 'outbuildings.barn.golfSimulator.oakLintel.peg';
        oakPeg.rotation.z = Math.PI / 2;
        oakPeg.position.set(lintelDepthU * 0.5 + 0.004, pegY, endZ);
        oakLintelGroup.add(oakPeg);
      }
    }
  }
  // Upper exposed-brick courses supported on top of the Oak Lintel (`y = 2.74m .. 2.92m, v = 1.18m .. 5.428m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    simOakLintelTopY,
    barnUpperTopY,
    simOakLintelVMin,
    vEastRangeSouth - wallT - 0.002,
    ['-x'],
    exteriorBrickMat
  );
  addInteriorPlasterGableWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeBarnPartitionGable',
    exteriorBrickMat
  );
  addInteriorPlasterGableWall(
    groundGroup,
    uBarnStart - 0.005,
    uBarnStart + 0.015,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeBarnPartitionGable.storePlaster'
  );

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
  buildBarnPoolTable(groundGroup, barnCarpetTopY, lightJoineryOakMat);

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

      for (const sideX of [-1, 1] as const) {
        const archLeg = new THREE.Mesh(
          new THREE.BoxGeometry(0.016, gDoorH + 0.04, 0.054),
          lightJoineryOakPostMat
        );
        archLeg.name = `outbuildings.barn.stableGlassDoor.architraveLeg.${sideX < 0 ? "west" : "east"}.${sideV < 0 ? "north" : "south"}`;
        archLeg.position.set(
          sideX * (partT * 0.5 + 0.008),
          (gDoorH + 0.04) * 0.5,
          sideV * (gDoorW * 0.5 + 0.016)
        );
        glassDoorGroup.add(archLeg);
      }
    }
    for (const sideX of [-1, 1] as const) {
      const archHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.054, gDoorW + 0.086),
        lightJoineryOakPostMat
      );
      archHead.name = `outbuildings.barn.stableGlassDoor.architraveHead.${sideX < 0 ? "west" : "east"}`;
      archHead.position.set(sideX * (partT * 0.5 + 0.008), gDoorH + 0.018, 0);
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

    // Solid Light-Oak Bullnose Threshold Step on the Barn side (`u = 22.74..23.02m, y = -0.675m..-0.555m`)
    const stepH = (gDoorBotY - barnCarpetTopY) * 0.5; // 0.1175m
    const stepD = 0.28;
    const stepW = gDoorW + 0.10;
    const stepBlock = new THREE.Mesh(
      new THREE.BoxGeometry(stepD, stepH, stepW),
      lightJoineryOakMat
    );
    stepBlock.name = 'outbuildings.barn.stableDoorStep';
    stepBlock.position.set(-partT * 0.5 - stepD * 0.5, -stepH * 0.5, 0);
    stepBlock.castShadow = true;
    stepBlock.receiveShadow = true;
    glassDoorGroup.add(stepBlock);

    const stepBullnose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, stepW, 16),
      lightJoineryOakMat
    );
    stepBullnose.name = 'outbuildings.barn.stableDoorStep.bullnose';
    stepBullnose.rotation.x = Math.PI / 2;
    stepBullnose.position.set(-partT * 0.5 - stepD, -0.016, 0);
    glassDoorGroup.add(stepBullnose);
  }

  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    vEastRangeNorth + wallT + 0.002,
    2.554,
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
    3.554,
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
    2.554,
    3.554,
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
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    12.85,
    storeFloorTopY - 0.14,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    12.85,
    13.75,
    storeFloorTopY + 2.02,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
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
    ['+z']
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
  // Interior solid light-oak architrave & lintel casing on the Barn side (`v = 0.28m`) of the Barn Courtyard Door (`u = 15.85..16.85m, y = -0.34..1.68m`)
  {
    const barnDoorCasing = new THREE.Group();
    barnDoorCasing.name = 'outbuildings.barn.courtyardDoorInteriorCasing';
    barnDoorCasing.position.set(16.35, barnWestFloorY, vEastRangeNorth + wallT);
    groundGroup.add(barnDoorCasing);
    for (const sideU of [-1, 1] as const) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.068, 2.04, 0.022),
        lightJoineryOakMat
      );
      leg.name = `outbuildings.barn.courtyardDoorInteriorCasing.leg.${sideU < 0 ? "west" : "east"}`;
      leg.position.set(sideU * 0.514, 1.02, 0.011);
      barnDoorCasing.add(leg);
    }
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.075, 0.026),
      lightJoineryOakMat
    );
    head.name = 'outbuildings.barn.courtyardDoorInteriorCasing.head';
    head.position.set(0, 2.055, 0.013);
    barnDoorCasing.add(head);
  }

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

      ctx.interactions.registerHingedDoor(
        eastGlassDoorGroup,
        leafPivot,
        new THREE.Vector3(0, 0, 0),
        'y',
        sideSign < 0 ? Math.PI * 0.46 : -Math.PI * 0.46
      );
    }
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

}
