import * as THREE from 'three';
import {
  createSharedGeo,
  tagHighLod,
  type HeatingPlantSharedContext,
  type PlantRoomBoilersKit,
} from './vaillant-boilers-and-flues';

export function buildUnventedCylindersAndPipework(
  scene: THREE.Scene,
  kit: PlantRoomBoilersKit,
  ctx: HeatingPlantSharedContext
): void {
  const { tier2FloorY, brassMat, castIronMat } = kit;
  const {
    heatingPlantGroup,
    headerWallZ,
    dhwHeaderY,
    gasHeaderY,
    primaryFlowHeaderY,
    primaryReturnHeaderY,
    boostedColdHeaderY,
    condensateHeaderY,
    viessmannWhiteMat,
    vitotronicDisplayGlowMat,
    cylinderJacketMat,
    copperPipeMat,
    condensatePvcMat,
    redValveHandleMat,
    blueValveHandleMat,
    braidedFlexMat,
    coldTankGrpMat,
    coldTankTrimMat,
    pumpStainlessMat,
    accumulatorBlueMat,
    addZBranchPipe,
  } = ctx;

  // =========================================================================
  // CONTINUOUS WALL-MOUNTED COPPER DISTRIBUTION HEADERS ALONG NORTH WALL (Z = 8.46m)
  // Connecting Cold Water Booster Tank (X = -21.82m), Unvented Cylinders (X = -21.10m, -20.48m),
  // Viessmann Boilers (X = -19.82m, -19.26m), and passing through the X = -18.99m..-18.84m
  // partition wall into the Plant Room heating manifold!
  // =========================================================================
  const mainHeaders: ReadonlyArray<{
    readonly name: string;
    readonly minX: number;
    readonly maxX: number;
    readonly y: number;
    readonly radius: number;
    readonly mat: THREE.Material;
    readonly passesThroughEastWall: boolean;
  }> = [
    {
      name: 'study.heatingPlant.dhwHotHeader',
      minX: -21.14,
      maxX: -18.84,
      y: dhwHeaderY,
      radius: 0.013,
      mat: copperPipeMat,
      passesThroughEastWall: true,
    },
    {
      name: 'study.heatingPlant.gasSupplyHeader',
      minX: -20.02,
      maxX: -18.84,
      y: gasHeaderY,
      radius: 0.012,
      mat: copperPipeMat,
      passesThroughEastWall: true,
    },
    {
      name: 'study.heatingPlant.primaryFlowHeader',
      minX: -21.14,
      maxX: -18.84,
      y: primaryFlowHeaderY,
      radius: 0.015,
      mat: copperPipeMat,
      passesThroughEastWall: true,
    },
    {
      name: 'study.heatingPlant.primaryReturnHeader',
      minX: -21.14,
      maxX: -18.84,
      y: primaryReturnHeaderY,
      radius: 0.015,
      mat: copperPipeMat,
      passesThroughEastWall: true,
    },
    {
      name: 'study.heatingPlant.boostedColdHeader',
      minX: -21.52,
      maxX: -18.84,
      y: boostedColdHeaderY,
      radius: 0.015,
      mat: copperPipeMat,
      passesThroughEastWall: true,
    },
    {
      name: 'study.heatingPlant.condensateWasteHeader',
      minX: -21.44,
      maxX: -19.04,
      y: condensateHeaderY,
      radius: 0.014,
      mat: condensatePvcMat,
      passesThroughEastWall: false,
    },
  ];

  const headerGeoCache = new Map<string, THREE.CylinderGeometry>();
  const clipRingGeoCache = new Map<number, THREE.CylinderGeometry>();
  const collarGeoCache = new Map<number, THREE.CylinderGeometry>();
  const sharedClipStemGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.0045, 0.0045, headerWallZ - 8.39, 8)
  );
  const sharedWallBaseplateGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.016, 0.016, 0.006, 12)
  );

  for (const hdr of mainHeaders) {
    const len = hdr.maxX - hdr.minX;
    const midX = (hdr.minX + hdr.maxX) * 0.5;
    const hdrGeoKey = `${hdr.radius.toFixed(4)}_${len.toFixed(4)}`;
    let hdrGeo = headerGeoCache.get(hdrGeoKey);
    if (!hdrGeo) {
      hdrGeo = createSharedGeo(new THREE.CylinderGeometry(hdr.radius, hdr.radius, len, 14));
      headerGeoCache.set(hdrGeoKey, hdrGeo);
    }
    const headerPipe = new THREE.Mesh(hdrGeo, hdr.mat);
    headerPipe.name = hdr.name;
    headerPipe.rotation.z = Math.PI / 2;
    headerPipe.position.set(midX, hdr.y, headerWallZ);
    headerPipe.castShadow = true;
    heatingPlantGroup.add(headerPipe);

    let clipRingGeo = clipRingGeoCache.get(hdr.radius);
    if (!clipRingGeo) {
      clipRingGeo = createSharedGeo(
        new THREE.CylinderGeometry(hdr.radius * 1.32, hdr.radius * 1.32, 0.016, 12)
      );
      clipRingGeoCache.set(hdr.radius, clipRingGeo);
    }

    // Brass Munsen wall pipe clips anchoring each header to the Z = 8.39m North wall every ~0.65m
    let clipIdx = 1;
    for (let clipX = hdr.minX + 0.18; clipX <= hdr.maxX - 0.18; clipX += 0.64) {
      const clipRing = new THREE.Mesh(clipRingGeo, brassMat);
      clipRing.name = `${hdr.name}.munsenClip.${clipIdx}.ring`;
      clipRing.rotation.z = Math.PI / 2;
      clipRing.position.set(clipX, hdr.y, headerWallZ);
      tagHighLod(clipRing);
      heatingPlantGroup.add(clipRing);

      const clipStem = new THREE.Mesh(sharedClipStemGeo, brassMat);
      clipStem.name = `${hdr.name}.munsenClip.${clipIdx}.stem`;
      clipStem.rotation.x = Math.PI / 2;
      clipStem.position.set(clipX, hdr.y, (headerWallZ + 8.39) * 0.5);
      tagHighLod(clipStem);
      heatingPlantGroup.add(clipStem);

      const wallBaseplate = new THREE.Mesh(sharedWallBaseplateGeo, brassMat);
      wallBaseplate.name = `${hdr.name}.munsenClip.${clipIdx}.baseplate`;
      wallBaseplate.rotation.x = Math.PI / 2;
      wallBaseplate.position.set(clipX, hdr.y, 8.393);
      tagHighLod(wallBaseplate);
      heatingPlantGroup.add(wallBaseplate);
      clipIdx += 1;
    }

    // Brass through-wall escutcheon collar where the header passes through the X = -18.99m partition wall into the Plant Room
    if (hdr.passesThroughEastWall) {
      let collarGeo = collarGeoCache.get(hdr.radius);
      if (!collarGeo) {
        collarGeo = createSharedGeo(
          new THREE.CylinderGeometry(hdr.radius * 1.75, hdr.radius * 1.75, 0.014, 16)
        );
        collarGeoCache.set(hdr.radius, collarGeo);
      }
      const throughWallCollar = new THREE.Mesh(collarGeo, brassMat);
      throughWallCollar.name = `${hdr.name}.throughWallCollar`;
      throughWallCollar.rotation.z = Math.PI / 2;
      throughWallCollar.position.set(-18.995, hdr.y, headerWallZ);
      tagHighLod(throughWallCollar);
      heatingPlantGroup.add(throughWallCollar);
    }
  }

  const sharedExpansionVesselGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.115, 0.115, 0.3, 18)
  );
  const sharedExpansionStrapGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.119, 0.119, 0.024, 18)
  );

  // Sealed-System Wall-Mounted Heating Expansion Vessel (18L Red Vessel) + Filling Loop & Pressure Gauge Assembly
  // mounted on the North wall below the Boilers (X = -19.54m, Y = tier2FloorY + 0.24m, Z = 8.54m) connected to the Primary Flow/Return headers
  {
    const sysExpX = -19.54;
    const sysExpMat = new THREE.MeshStandardMaterial({
      color: 0xb82922, // Powder-coated red hydronic sealed-system expansion vessel
      roughness: 0.32,
      metalness: 0.28,
    });
    const sysExpVessel = new THREE.Mesh(sharedExpansionVesselGeo, sysExpMat);
    sysExpVessel.name = 'study.heatingPlant.primaryExpansionVessel';
    sysExpVessel.position.set(sysExpX, tier2FloorY + 0.24, 8.54);
    sysExpVessel.castShadow = true;
    heatingPlantGroup.add(sysExpVessel);

    const sysExpStrap = new THREE.Mesh(sharedExpansionStrapGeo, castIronMat);
    sysExpStrap.name = 'study.heatingPlant.primaryExpansionVessel.strap';
    sysExpStrap.position.set(sysExpX, tier2FloorY + 0.24, 8.54);
    tagHighLod(sysExpStrap);
    heatingPlantGroup.add(sysExpStrap);

    // Vertical 15mm copper feed from Primary Flow Header (tier2FloorY + 0.78m) down into top of red expansion vessel + pressure gauge
    const sysExpPipeGeo = createSharedGeo(new THREE.CylinderGeometry(0.009, 0.009, 0.39, 10));
    const sysExpPipe = new THREE.Mesh(sysExpPipeGeo, copperPipeMat);
    sysExpPipe.name = 'study.heatingPlant.primaryExpansionVessel.feedPipe';
    sysExpPipe.position.set(sysExpX, tier2FloorY + 0.585, headerWallZ);
    tagHighLod(sysExpPipe);
    heatingPlantGroup.add(sysExpPipe);

    addZBranchPipe(
      heatingPlantGroup,
      'study.heatingPlant.primaryExpansionVessel.headerBranch',
      sysExpX,
      tier2FloorY + 0.42,
      8.54,
      headerWallZ,
      0.009,
      copperPipeMat,
      false
    );
  }

  // Condensate & Tundish Waste Header vertical drop at X = -19.04m into a trapped floor drain gully at Y = tier2FloorY
  {
    const drainDropX = -19.04;
    const drainDropH = condensateHeaderY - tier2FloorY;
    const drainDropPipeGeo = createSharedGeo(
      new THREE.CylinderGeometry(0.014, 0.014, drainDropH, 12)
    );
    const drainDropPipe = new THREE.Mesh(drainDropPipeGeo, condensatePvcMat);
    drainDropPipe.name = 'study.heatingPlant.condensateFloorDrop';
    drainDropPipe.position.set(drainDropX, tier2FloorY + drainDropH * 0.5, headerWallZ);
    heatingPlantGroup.add(drainDropPipe);

    const drainElbowGeo = createSharedGeo(new THREE.SphereGeometry(0.018, 12, 12));
    const drainElbow = new THREE.Mesh(drainElbowGeo, condensatePvcMat);
    drainElbow.name = 'study.heatingPlant.condensateFloorDrop.elbow';
    drainElbow.position.set(drainDropX, condensateHeaderY, headerWallZ);
    tagHighLod(drainElbow);
    heatingPlantGroup.add(drainElbow);

    const floorGullyGeo = createSharedGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 16));
    const floorGully = new THREE.Mesh(floorGullyGeo, castIronMat);
    floorGully.name = 'study.heatingPlant.floorDrainGully';
    floorGully.position.set(drainDropX, tier2FloorY + 0.009, headerWallZ);
    heatingPlantGroup.add(floorGully);
  }

  // 2. Two 250L Floor-Standing Unvented Upright Hot Water Cylinders in the Center
  //    at X = -21.10m and X = -20.48m, Y = tier2FloorY (-0.60m), Z = 8.71m (Ø0.54m x 1.52m tall — 250L capacity each, 500L total)
  const cylR = 0.27; // Ø0.54m 250L upright unvented cylinder
  const cylBodyH = 1.38; // Total height ~1.52m with base ring & top dome
  const cylBaseRingGeo = createSharedGeo(
    new THREE.CylinderGeometry(cylR + 0.008, cylR + 0.012, 0.045, 24)
  );
  const cylBodyGeo = createSharedGeo(new THREE.CylinderGeometry(cylR, cylR, cylBodyH, 28));
  const cylDomeCapGeo = createSharedGeo(
    new THREE.SphereGeometry(cylR, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)
  );
  const cylTopOutletPipeGeo = createSharedGeo(new THREE.CylinderGeometry(0.013, 0.013, 0.34, 10));
  const cylDhwIsolationValveGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.018, 0.018, 0.036, 12)
  );
  const cylDhwValveLeverGeo = createSharedGeo(new THREE.BoxGeometry(0.01, 0.042, 0.016));
  const cylCoilBossGeo = createSharedGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.09, 12));
  const cylZoneValveBodyGeo = createSharedGeo(new THREE.BoxGeometry(0.088, 0.068, 0.062));
  const cylPrvBodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.068, 12));
  const cylPrvCapGeo = createSharedGeo(new THREE.CylinderGeometry(0.018, 0.022, 0.038, 12));
  const cylColdDropPipeGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 10));
  const cylColdInletBossGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 10));
  const cylExpWallBracketGeo = createSharedGeo(new THREE.BoxGeometry(0.06, 0.08, 0.14));
  const cylExpBottomBossGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 10));
  const cylExpFlexHoseGeo = createSharedGeo(new THREE.CylinderGeometry(0.0085, 0.0085, 0.16, 10));
  const cylExpCopperRiserGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.0085, 0.0085, 1.12, 10)
  );
  const cylExpLowerJoinGeo = createSharedGeo(new THREE.CylinderGeometry(0.0085, 0.0085, 0.08, 10));
  const cylDataPlateGeo = createSharedGeo(new THREE.BoxGeometry(0.13, 0.2, 0.008));
  const cylImmersionBossGeo = createSharedGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.08, 14));
  const cylTprValveGeo = createSharedGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.068, 10));
  const cylTprRedCapGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.028, 10));
  const cylTundishFunnelGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.022, 0.012, 0.065, 12)
  );
  const cylDischargePipeGeo = createSharedGeo(new THREE.CylinderGeometry(0.01, 0.01, 0.72, 10));

  for (const [cIdx, cx] of [
    [1, -21.1],
    [2, -20.48],
  ] as const) {
    const cylPrefix = `study.unventedCylinder.${cIdx}`;
    const cylGroup = new THREE.Group();
    cylGroup.name = cylPrefix;
    cylGroup.position.set(cx, tier2FloorY, 8.71);

    const localWallZ = headerWallZ - 8.71; // -0.25m (distance from cylinder center Z = 8.71m to wall headers at Z = 8.46m)

    // Moulded black polymer base ring (Y = 0..0.045m)
    const baseRing = new THREE.Mesh(cylBaseRingGeo, castIronMat);
    baseRing.name = `${cylPrefix}.baseRing`;
    baseRing.position.set(0, 0.0225, 0);
    cylGroup.add(baseRing);

    // Main upright insulated stainless-steel 250L cylinder body (Y = 0.045m..1.425m)
    const cylBody = new THREE.Mesh(cylBodyGeo, cylinderJacketMat);
    cylBody.name = `${cylPrefix}.tank`;
    cylBody.position.set(0, 0.045 + cylBodyH / 2, 0);
    cylBody.castShadow = true;
    cylBody.receiveShadow = true;
    cylGroup.add(cylBody);

    // Domed top cap (Y = 1.425m..1.535m)
    const domeCap = new THREE.Mesh(cylDomeCapGeo, cylinderJacketMat);
    domeCap.name = `${cylPrefix}.domeCap`;
    domeCap.scale.set(1, 0.41, 1);
    domeCap.position.set(0, 1.425, 0);
    domeCap.castShadow = true;
    cylGroup.add(domeCap);

    // A. Top 22mm DHW Hot Water Draw-Off Riser (Y = 1.52m -> 1.84m) + 90° Elbow & Horizontal Branch (Z = 8.71m -> 8.46m)
    //    connecting directly into the Secondary DHW Hot Water Header (`dhwHeaderY = tier2FloorY + 1.84m`)!
    const topOutletPipe = new THREE.Mesh(cylTopOutletPipeGeo, copperPipeMat);
    topOutletPipe.name = `${cylPrefix}.dhwDrawOffRiser`;
    topOutletPipe.position.set(0, 1.67, 0);
    topOutletPipe.castShadow = true;
    cylGroup.add(topOutletPipe);

    const dhwIsolationValve = new THREE.Mesh(cylDhwIsolationValveGeo, brassMat);
    dhwIsolationValve.name = `${cylPrefix}.dhwIsolationValve`;
    dhwIsolationValve.position.set(0, 1.64, 0);
    tagHighLod(dhwIsolationValve);
    cylGroup.add(dhwIsolationValve);

    const dhwValveLever = new THREE.Mesh(cylDhwValveLeverGeo, redValveHandleMat);
    dhwValveLever.name = `${cylPrefix}.dhwIsolationValve.lever`;
    dhwValveLever.position.set(0.018, 1.64, 0);
    tagHighLod(dhwValveLever);
    cylGroup.add(dhwValveLever);

    addZBranchPipe(
      cylGroup,
      `${cylPrefix}.dhwDrawOffBranch`,
      0,
      1.84,
      0,
      localWallZ,
      0.013,
      copperPipeMat,
      true
    );

    // B. Primary Indirect Heating Coil Flow (Y = 0.78m) & Return (Y = 0.66m) Connections on the Rear-Right of Cylinder
    //    with 2-Port Motorized Zone Valve (`study.unventedCylinder.${cIdx}.zoneValve`) connecting into the Primary Headers!
    const coilX = 0.16;
    const coilStartZ = -0.14;
    for (const [coilY, isFlow] of [
      [0.78, true],
      [0.66, false],
    ] as const) {
      const coilTag = isFlow ? 'flow' : 'return';
      // Horizontal brass boss entering cylinder jacket
      const coilBoss = new THREE.Mesh(cylCoilBossGeo, brassMat);
      coilBoss.name = `${cylPrefix}.primaryCoil.${coilTag}.boss`;
      coilBoss.rotation.z = Math.PI / 2;
      coilBoss.position.set(coilX - 0.04, coilY, coilStartZ);
      tagHighLod(coilBoss);
      cylGroup.add(coilBoss);

      // Horizontal copper branch from cylinder coil boss (local z = -0.14m) to North wall header (local z = -0.25m)
      addZBranchPipe(
        cylGroup,
        `${cylPrefix}.primaryCoil.${coilTag}`,
        coilX,
        coilY,
        coilStartZ,
        localWallZ,
        0.012,
        copperPipeMat,
        true
      );

      // 2-Port Motorized Zone Valve (Honeywell V4043H silver actuator box) on the Primary Coil Flow branch
      if (isFlow) {
        const zoneValveBody = new THREE.Mesh(cylZoneValveBodyGeo, cylinderJacketMat);
        zoneValveBody.name = `${cylPrefix}.zoneValve`;
        zoneValveBody.position.set(coilX, coilY + 0.042, (coilStartZ + localWallZ) * 0.5);
        zoneValveBody.castShadow = true;
        cylGroup.add(zoneValveBody);
      }
    }

    // C. Boosted Cold Water Feed Set (Y = 0.54m), Monobloc PRV (Pressure Reducing Valve), Cold Inlet Drop (Y = 0.30m),
    //    and Connected 15mm Copper + Braided Flexible Hose Riser up to the Wall-Mounted 24L White Potable Expansion Vessel!
    const coldInletX = 0.22;
    // Branch from Boosted Cold Water Header (local y = 0.54m, z = -0.25m) forward to z = -0.12m
    addZBranchPipe(
      cylGroup,
      `${cylPrefix}.coldInletBranch`,
      coldInletX,
      0.54,
      -0.12,
      localWallZ,
      0.012,
      copperPipeMat,
      true
    );

    // Monobloc 3.0 bar Pressure Reducing Valve (PRV) & Strainer Cartridge + Black Adjustment Cap
    const prvBody = new THREE.Mesh(cylPrvBodyGeo, brassMat);
    prvBody.name = `${cylPrefix}.pressureReducingValve`;
    prvBody.position.set(coldInletX, 0.54, -0.16);
    cylGroup.add(prvBody);

    const prvCap = new THREE.Mesh(cylPrvCapGeo, castIronMat);
    prvCap.name = `${cylPrefix}.pressureReducingValve.cap`;
    prvCap.position.set(coldInletX, 0.585, -0.16);
    tagHighLod(prvCap);
    cylGroup.add(prvCap);

    // Lower cold feed drop from Y = 0.54m down to Y = 0.28m and into the base of the unvented cylinder
    const coldDropPipe = new THREE.Mesh(cylColdDropPipeGeo, copperPipeMat);
    coldDropPipe.name = `${cylPrefix}.coldInletDropPipe`;
    coldDropPipe.position.set(coldInletX, 0.41, -0.12);
    cylGroup.add(coldDropPipe);

    const coldInletBoss = new THREE.Mesh(cylColdInletBossGeo, brassMat);
    coldInletBoss.name = `${cylPrefix}.coldInletBoss`;
    coldInletBoss.rotation.z = Math.PI / 2;
    coldInletBoss.position.set(coldInletX - 0.05, 0.28, -0.12);
    tagHighLod(coldInletBoss);
    cylGroup.add(coldInletBoss);

    // Wall-Mounted 24L Potable White Expansion Vessel (Ø0.24m x 0.32m) mounted on the North wall above/behind the cylinder
    // WITH heavy-duty steel wall bracket, circumferential strap, bottom brass lockshield valve, AND connected braided hose!
    const expX = 0.18;
    const expY = 1.96;
    const expZ = -0.19; // World Z = 8.52m (mounted against the Z = 8.39m North wall)
    const expVessel = new THREE.Mesh(sharedExpansionVesselGeo, viessmannWhiteMat);
    expVessel.name = `${cylPrefix}.expansionVessel`;
    expVessel.position.set(expX, expY, expZ);
    expVessel.castShadow = true;
    cylGroup.add(expVessel);

    // Steel wall bracket & circumferential clamping band holding the expansion vessel to the Z = 8.39m North wall
    const expBand = new THREE.Mesh(sharedExpansionStrapGeo, castIronMat);
    expBand.name = `${cylPrefix}.expansionVessel.clampingBand`;
    expBand.position.set(expX, expY, expZ);
    tagHighLod(expBand);
    cylGroup.add(expBand);

    const expWallBracket = new THREE.Mesh(cylExpWallBracketGeo, castIronMat);
    expWallBracket.name = `${cylPrefix}.expansionVessel.wallBracket`;
    expWallBracket.position.set(expX, expY, expZ - 0.08);
    tagHighLod(expWallBracket);
    cylGroup.add(expWallBracket);

    // Brass service connection boss at bottom of expansion vessel + braided stainless-steel flexible hose loop
    // connecting down to the 15mm copper expansion riser from the cold water inlet set (Y = 0.54m -> 1.78m)!
    const expBottomBoss = new THREE.Mesh(cylExpBottomBossGeo, brassMat);
    expBottomBoss.name = `${cylPrefix}.expansionVessel.bottomBoss`;
    expBottomBoss.position.set(expX, expY - 0.165, expZ);
    tagHighLod(expBottomBoss);
    cylGroup.add(expBottomBoss);

    const expFlexHose = new THREE.Mesh(cylExpFlexHoseGeo, braidedFlexMat);
    expFlexHose.name = `${cylPrefix}.expansionFlexHose`;
    expFlexHose.position.set(expX, expY - 0.25, expZ);
    cylGroup.add(expFlexHose);

    const expCopperRiser = new THREE.Mesh(cylExpCopperRiserGeo, copperPipeMat);
    expCopperRiser.name = `${cylPrefix}.expansionCopperRiser`;
    expCopperRiser.position.set(expX, 1.1, expZ);
    cylGroup.add(expCopperRiser);

    const expLowerJoin = new THREE.Mesh(cylExpLowerJoinGeo, copperPipeMat);
    expLowerJoin.name = `${cylPrefix}.expansionLowerJoin`;
    expLowerJoin.rotation.x = Math.PI / 2;
    expLowerJoin.position.set(expX, 0.54, (expZ + -0.12) * 0.5);
    tagHighLod(expLowerJoin);
    cylGroup.add(expLowerJoin);

    // Front technical data plate & dual immersion heater / thermostat bosses (lower primary & upper boost)
    const dataPlate = new THREE.Mesh(cylDataPlateGeo, castIronMat);
    dataPlate.name = `${cylPrefix}.dataPlate`;
    dataPlate.position.set(0, 1.14, cylR + 0.004);
    tagHighLod(dataPlate);
    cylGroup.add(dataPlate);

    for (const [bossY, bossTag] of [
      [0.4, 'lower'],
      [0.9, 'upper'],
    ] as const) {
      const immersionBoss = new THREE.Mesh(cylImmersionBossGeo, viessmannWhiteMat);
      immersionBoss.name = `${cylPrefix}.immersionBoss.${bossTag}`;
      immersionBoss.rotation.x = Math.PI / 2;
      immersionBoss.position.set(0.055, bossY, cylR + 0.03);
      immersionBoss.castShadow = true;
      tagHighLod(immersionBoss);
      cylGroup.add(immersionBoss);
    }

    // D. T&PRV (Temperature & Pressure Relief Valve at Y = 1.12m), Air-Break Tundish Funnel (Y = 0.88m),
    //    and 22mm Copper D2 Safety Discharge Pipe dropping directly into the Condensate/Discharge Header (`Y = 0.40m`)!
    const tprX = -cylR - 0.032;
    const tprZ = -0.06;
    const tprValve = new THREE.Mesh(cylTprValveGeo, brassMat);
    tprValve.name = `${cylPrefix}.tprValve`;
    tprValve.rotation.z = Math.PI / 2;
    tprValve.position.set(tprX + 0.01, 1.12, tprZ);
    tagHighLod(tprValve);
    cylGroup.add(tprValve);

    const tprRedCap = new THREE.Mesh(cylTprRedCapGeo, redValveHandleMat);
    tprRedCap.name = `${cylPrefix}.tprValve.cap`;
    tprRedCap.position.set(tprX - 0.012, 1.145, tprZ);
    tagHighLod(tprRedCap);
    cylGroup.add(tprRedCap);

    // Black polymer Type-AA air-break tundish funnel at Y = 0.88m
    const tundishFunnel = new THREE.Mesh(cylTundishFunnelGeo, castIronMat);
    tundishFunnel.name = `${cylPrefix}.tundish`;
    tundishFunnel.position.set(tprX - 0.012, 0.88, tprZ);
    cylGroup.add(tundishFunnel);

    // Vertical copper D1/D2 discharge pipe from T&PRV (Y = 1.12m) through tundish down to Y = 0.40m, then elbowing to wall waste header
    const dischargePipe = new THREE.Mesh(cylDischargePipeGeo, copperPipeMat);
    dischargePipe.name = `${cylPrefix}.safetyDischargePipe`;
    dischargePipe.position.set(tprX - 0.012, 0.76, tprZ);
    cylGroup.add(dischargePipe);

    addZBranchPipe(
      cylGroup,
      `${cylPrefix}.safetyDischargeBranch`,
      tprX - 0.012,
      0.4,
      tprZ,
      localWallZ,
      0.01,
      copperPipeMat,
      false
    );

    heatingPlantGroup.add(cylGroup);
  }

  // 3. Cold Water Storage Break Tank (450L Insulated WRAS GRP Cistern) + Twin Variable-Speed
  //    Booster Pump Set & Pressure Accumulator Vessel on the West (Left) at X = -21.82m, Z = 8.73m
  {
    const coldBoosterGroup = new THREE.Group();
    coldBoosterGroup.name = 'study.coldWaterBoosterTank';
    coldBoosterGroup.position.set(-21.82, tier2FloorY, 8.73);

    const tankW = 0.58;
    const tankD = 0.54;
    const plinthH = 0.34; // Lower steel pump-bay plinth housing the twin booster pumps
    const cisternH = 1.14; // 450L insulated GRP cold-water break cistern body above plinth
    const localWallZ = headerWallZ - 8.73; // -0.27m (Z = 8.46m in world space)

    // Lower powder-coated dark steel skid plinth (0.58m W x 0.34m H x 0.54m D) with open front pump bay
    const pumpPlinthGeo = createSharedGeo(new THREE.BoxGeometry(tankW, plinthH, tankD));
    const pumpPlinth = new THREE.Mesh(pumpPlinthGeo, coldTankTrimMat);
    pumpPlinth.name = 'study.coldWaterBoosterTank.pumpPlinth';
    pumpPlinth.position.set(0, plinthH * 0.5, 0);
    pumpPlinth.castShadow = true;
    pumpPlinth.receiveShadow = true;
    coldBoosterGroup.add(pumpPlinth);

    // Twin Variable-Speed Multistage Booster Pumps (Duty / Assist-Standby) mounted on the front of the plinth
    const manifoldZ = tankD * 0.5 + 0.11; // +0.38m (world Z = 9.11m)
    const pumpBodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.068, 0.068, 0.24, 16));
    const pumpDeliveryStubGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 10));
    const pumpCheckValveGeo = createSharedGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.036, 12));
    const vfdBoxGeo = createSharedGeo(new THREE.BoxGeometry(0.095, 0.055, 0.12));
    const vfdScreenGeo = createSharedGeo(new THREE.BoxGeometry(0.052, 0.024, 0.006));

    for (const [pIdx, px] of [
      [1, -0.14],
      [2, 0.14],
    ] as const) {
      const pumpPrefix = `study.coldWaterBoosterTank.boosterPump.${pIdx}`;
      const pumpBody = new THREE.Mesh(pumpBodyGeo, pumpStainlessMat);
      pumpBody.name = pumpPrefix;
      pumpBody.rotation.x = Math.PI / 2;
      pumpBody.position.set(px, 0.16, tankD * 0.5 + 0.04);
      pumpBody.castShadow = true;
      coldBoosterGroup.add(pumpBody);

      // Vertical stainless-steel delivery stub connecting each pump volute up to the upper delivery manifold (Y = 0.28m)
      const pumpDeliveryStub = new THREE.Mesh(pumpDeliveryStubGeo, pumpStainlessMat);
      pumpDeliveryStub.name = `${pumpPrefix}.deliveryStub`;
      pumpDeliveryStub.position.set(px, 0.2, manifoldZ);
      tagHighLod(pumpDeliveryStub);
      coldBoosterGroup.add(pumpDeliveryStub);

      // Brass check valve + isolation ball valve on each pump delivery leg
      const pumpCheckValve = new THREE.Mesh(pumpCheckValveGeo, brassMat);
      pumpCheckValve.name = `${pumpPrefix}.checkValve`;
      pumpCheckValve.position.set(px, 0.22, manifoldZ);
      tagHighLod(pumpCheckValve);
      coldBoosterGroup.add(pumpCheckValve);

      // VFD inverter drive box & status LED on top of each booster pump motor
      const vfdBox = new THREE.Mesh(vfdBoxGeo, coldTankTrimMat);
      vfdBox.name = `${pumpPrefix}.vfdDrive`;
      vfdBox.position.set(px, 0.255, tankD * 0.5 + 0.02);
      tagHighLod(vfdBox);
      coldBoosterGroup.add(vfdBox);

      const vfdScreen = new THREE.Mesh(vfdScreenGeo, vitotronicDisplayGlowMat);
      vfdScreen.name = `${pumpPrefix}.vfdScreen`;
      vfdScreen.position.set(px, 0.258, tankD * 0.5 + 0.082);
      tagHighLod(vfdScreen);
      coldBoosterGroup.add(vfdScreen);
    }

    // Lower Stainless-Steel Suction Header (Y = 0.09m) & Upper Boosted Delivery Manifold Bar (Y = 0.28m) across both pumps
    const pumpManifoldGeo = createSharedGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 12));
    for (const [mhY, mhTag] of [
      [0.09, 'suction'],
      [0.28, 'delivery'],
    ] as const) {
      const pumpManifold = new THREE.Mesh(pumpManifoldGeo, pumpStainlessMat);
      pumpManifold.name = `study.coldWaterBoosterTank.${mhTag}Manifold`;
      pumpManifold.rotation.z = Math.PI / 2;
      pumpManifold.position.set(0, mhY, manifoldZ);
      coldBoosterGroup.add(pumpManifold);
    }

    const pressureGaugeGeo = createSharedGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.022, 16));
    const pressureGauge = new THREE.Mesh(pressureGaugeGeo, brassMat);
    pressureGauge.name = 'study.coldWaterBoosterTank.pressureGauge';
    pressureGauge.rotation.x = Math.PI / 2;
    pressureGauge.position.set(0, 0.315, manifoldZ + 0.01);
    tagHighLod(pressureGauge);
    coldBoosterGroup.add(pressureGauge);

    // A. Connected 28mm Copper Boosted-Cold Delivery Pipe from the Right (East) end of the Pump Delivery Manifold
    //    (local x = +0.26m -> +0.33m, y = 0.28m -> 0.54m, z = +0.38m -> -0.27m) with 90° elbows & isolation valve
    //    connecting directly into the Boosted Cold Water Main Header (`boostedColdHeaderY = tier2FloorY + 0.54m`)!
    const sidePipeX = 0.33; // World X = -21.49m (along the East side of the cistern towards the cylinders)
    const manifoldOutStubGeo = createSharedGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 10));
    const manifoldOutStub = new THREE.Mesh(manifoldOutStubGeo, copperPipeMat);
    manifoldOutStub.name = 'study.coldWaterBoosterTank.deliveryManifoldOutStub';
    manifoldOutStub.rotation.z = Math.PI / 2;
    manifoldOutStub.position.set(0.295, 0.28, manifoldZ);
    tagHighLod(manifoldOutStub);
    coldBoosterGroup.add(manifoldOutStub);

    const deliveryFrontRiserGeo = createSharedGeo(
      new THREE.CylinderGeometry(0.015, 0.015, 0.26, 10)
    );
    const deliveryFrontRiser = new THREE.Mesh(deliveryFrontRiserGeo, copperPipeMat);
    deliveryFrontRiser.name = 'study.coldWaterBoosterTank.deliveryRiser';
    deliveryFrontRiser.position.set(sidePipeX, 0.41, manifoldZ);
    coldBoosterGroup.add(deliveryFrontRiser);

    const deliveryCornerElbowGeo = createSharedGeo(new THREE.SphereGeometry(0.019, 12, 12));
    const deliveryCornerElbow = new THREE.Mesh(deliveryCornerElbowGeo, copperPipeMat);
    deliveryCornerElbow.name = 'study.coldWaterBoosterTank.deliveryRiser.elbow';
    deliveryCornerElbow.position.set(sidePipeX, 0.28, manifoldZ);
    tagHighLod(deliveryCornerElbow);
    coldBoosterGroup.add(deliveryCornerElbow);

    // Blue quarter-turn lever isolation valve on the boosted cold delivery riser
    const mainColdValveGeo = createSharedGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.04, 12));
    const mainColdValve = new THREE.Mesh(mainColdValveGeo, brassMat);
    mainColdValve.name = 'study.coldWaterBoosterTank.deliveryIsolationValve';
    mainColdValve.position.set(sidePipeX, 0.41, manifoldZ);
    tagHighLod(mainColdValve);
    coldBoosterGroup.add(mainColdValve);

    const mainColdLeverGeo = createSharedGeo(new THREE.BoxGeometry(0.012, 0.052, 0.018));
    const mainColdLever = new THREE.Mesh(mainColdLeverGeo, blueValveHandleMat);
    mainColdLever.name = 'study.coldWaterBoosterTank.deliveryIsolationValve.lever';
    mainColdLever.position.set(sidePipeX + 0.022, 0.41, manifoldZ);
    tagHighLod(mainColdLever);
    coldBoosterGroup.add(mainColdLever);

    // Horizontal 28mm copper delivery run along the East side of the booster tank (z = +0.38m -> -0.27m at y = 0.54m)
    // teeing directly into the Boosted Cold Water Main Header on the North wall!
    addZBranchPipe(
      coldBoosterGroup,
      'study.coldWaterBoosterTank.deliveryHeaderBranch',
      sidePipeX,
      0.54,
      manifoldZ,
      localWallZ,
      0.015,
      copperPipeMat,
      true
    );

    // B. Connected 22mm Copper Accumulator Charge Pipe from the Pump Delivery System (y = 0.54m at wall)
    //    rising up the rear of the cistern (local x = +0.13m, y = 0.54m -> 1.56m, z = localWallZ) and elbowing
    //    forward into the bottom brass flange of the Top-Mounted Blue 60L Pressure Accumulator Vessel!
    const accX = 0.13;
    const accZ = -0.04;
    const accRiserGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.012, 1.02, 10));
    const accRiser = new THREE.Mesh(accRiserGeo, copperPipeMat);
    accRiser.name = 'study.coldWaterBoosterTank.accumulatorRiser';
    accRiser.position.set(accX, 1.05, localWallZ);
    accRiser.castShadow = true;
    coldBoosterGroup.add(accRiser);

    const accTeeGeo = createSharedGeo(new THREE.CylinderGeometry(0.019, 0.019, 0.036, 12));
    const accTee = new THREE.Mesh(accTeeGeo, brassMat);
    accTee.name = 'study.coldWaterBoosterTank.accumulatorRiser.wallTee';
    accTee.rotation.z = Math.PI / 2;
    accTee.position.set(accX, 0.54, localWallZ);
    tagHighLod(accTee);
    coldBoosterGroup.add(accTee);

    addZBranchPipe(
      coldBoosterGroup,
      'study.coldWaterBoosterTank.accumulatorTopBranch',
      accX,
      1.54,
      accZ,
      localWallZ,
      0.012,
      copperPipeMat,
      false
    );

    // C. 22mm Mains Cold Water Rising Main (local x = -0.28m, z = localWallZ, y = 0.00m -> 1.40m)
    //    with Brass Double Check Valve & Stopcock entering the top float-valve inlet of the 450L GRP Break Cistern!
    const mainsX = -0.28;
    const mainsRiserGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 10));
    const mainsRiser = new THREE.Mesh(mainsRiserGeo, copperPipeMat);
    mainsRiser.name = 'study.coldWaterBoosterTank.mainsRisingMain';
    mainsRiser.position.set(mainsX, 0.7, localWallZ);
    coldBoosterGroup.add(mainsRiser);

    const doubleCheckValveGeo = createSharedGeo(
      new THREE.CylinderGeometry(0.018, 0.018, 0.085, 12)
    );
    const doubleCheckValve = new THREE.Mesh(doubleCheckValveGeo, brassMat);
    doubleCheckValve.name = 'study.coldWaterBoosterTank.mainsRisingMain.doubleCheckValve';
    doubleCheckValve.position.set(mainsX, 0.96, localWallZ);
    tagHighLod(doubleCheckValve);
    coldBoosterGroup.add(doubleCheckValve);

    addZBranchPipe(
      coldBoosterGroup,
      'study.coldWaterBoosterTank.mainsInletBranch',
      mainsX,
      1.4,
      -0.18,
      localWallZ,
      0.012,
      copperPipeMat,
      false
    );

    // Main 450L Insulated Potable GRP Cold Water Storage Cistern (Y = 0.34m..1.48m)
    const cisternBodyGeo = createSharedGeo(new THREE.BoxGeometry(tankW, cisternH, tankD));
    const cisternBody = new THREE.Mesh(cisternBodyGeo, coldTankGrpMat);
    cisternBody.name = 'study.coldWaterBoosterTank.cistern';
    cisternBody.position.set(0, plinthH + cisternH * 0.5, 0);
    cisternBody.castShadow = true;
    cisternBody.receiveShadow = true;
    coldBoosterGroup.add(cisternBody);

    // Moulded structural reinforcing ribs around the GRP cold water tank
    const cisternRibGeo = createSharedGeo(
      new THREE.BoxGeometry(tankW + 0.016, 0.028, tankD + 0.016)
    );
    for (const [ribIdx, ribY] of [
      [1, 0.62],
      [2, 0.92],
      [3, 1.22],
    ] as const) {
      const rib = new THREE.Mesh(cisternRibGeo, coldTankGrpMat);
      rib.name = `study.coldWaterBoosterTank.cistern.rib.${ribIdx}`;
      rib.position.set(0, ribY, 0);
      tagHighLod(rib);
      coldBoosterGroup.add(rib);
    }

    // Top Raised Hygiene Inspection Lid & Type-AB Air-Gap Screened Weir Overflow Housing (Y = 1.48m..1.60m)
    const topLidGeo = createSharedGeo(new THREE.BoxGeometry(tankW + 0.02, 0.04, tankD + 0.02));
    const topLid = new THREE.Mesh(topLidGeo, coldTankTrimMat);
    topLid.name = 'study.coldWaterBoosterTank.topLid';
    topLid.position.set(0, plinthH + cisternH + 0.02, 0);
    topLid.castShadow = true;
    coldBoosterGroup.add(topLid);

    const inspectionTurretGeo = createSharedGeo(new THREE.CylinderGeometry(0.14, 0.15, 0.09, 20));
    const inspectionTurret = new THREE.Mesh(inspectionTurretGeo, coldTankTrimMat);
    inspectionTurret.name = 'study.coldWaterBoosterTank.inspectionTurret';
    inspectionTurret.position.set(-0.11, plinthH + cisternH + 0.08, 0.04);
    tagHighLod(inspectionTurret);
    coldBoosterGroup.add(inspectionTurret);

    // Top-mounted Blue Potable Pressure Accumulator Vessel (60L diaphragm vessel, Ø0.27m x 0.44m tall)
    // seated on a brass flanged throat collar connected to the accumulator charge pipe at Y = 1.54m!
    const accThroatCollarGeo = createSharedGeo(new THREE.CylinderGeometry(0.038, 0.048, 0.06, 16));
    const accThroatCollar = new THREE.Mesh(accThroatCollarGeo, brassMat);
    accThroatCollar.name = 'study.coldWaterBoosterTank.accumulatorThroatCollar';
    accThroatCollar.position.set(accX, plinthH + cisternH + 0.05, accZ);
    tagHighLod(accThroatCollar);
    coldBoosterGroup.add(accThroatCollar);

    const accumulatorVesselGeo = createSharedGeo(
      new THREE.CylinderGeometry(0.135, 0.135, 0.42, 22)
    );
    const accumulatorVessel = new THREE.Mesh(accumulatorVesselGeo, accumulatorBlueMat);
    accumulatorVessel.name = 'study.coldWaterBoosterTank.accumulatorVessel';
    accumulatorVessel.position.set(accX, plinthH + cisternH + 0.27, accZ);
    accumulatorVessel.castShadow = true;
    accumulatorVessel.receiveShadow = true;
    coldBoosterGroup.add(accumulatorVessel);

    const accumulatorDomeGeo = createSharedGeo(
      new THREE.SphereGeometry(0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)
    );
    const accumulatorDome = new THREE.Mesh(accumulatorDomeGeo, accumulatorBlueMat);
    accumulatorDome.name = 'study.coldWaterBoosterTank.accumulatorVessel.dome';
    accumulatorDome.scale.set(1, 0.45, 1);
    accumulatorDome.position.set(accX, plinthH + cisternH + 0.48, accZ);
    coldBoosterGroup.add(accumulatorDome);

    // Front WRAS Potable Cold Water Storage & Booster Data Plaque
    const wrasPlaqueGeo = createSharedGeo(new THREE.BoxGeometry(0.22, 0.14, 0.008));
    const wrasPlaque = new THREE.Mesh(wrasPlaqueGeo, viessmannWhiteMat);
    wrasPlaque.name = 'study.coldWaterBoosterTank.wrasPlaque';
    wrasPlaque.position.set(0, 1.08, tankD * 0.5 + 0.006);
    tagHighLod(wrasPlaque);
    coldBoosterGroup.add(wrasPlaque);

    heatingPlantGroup.add(coldBoosterGroup);
  }

  scene.add(heatingPlantGroup);
}
