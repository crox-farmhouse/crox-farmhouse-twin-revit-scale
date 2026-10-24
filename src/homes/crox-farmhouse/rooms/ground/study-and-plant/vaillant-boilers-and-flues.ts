import * as THREE from 'three';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../../structure/tier2-levels.ts';

export function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

export function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type PlantRoomBoilersKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  'brassMat' | 'castIronMat' | 'windowFrameMat'
> &
  Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>;

export interface HeatingPlantSharedContext {
  readonly heatingPlantGroup: THREE.Group;
  readonly viessmannWhiteMat: THREE.MeshStandardMaterial;
  readonly vitotronicDisplayGlowMat: THREE.MeshStandardMaterial;
  readonly cylinderJacketMat: THREE.MeshStandardMaterial;
  readonly coldTankGrpMat: THREE.MeshStandardMaterial;
  readonly coldTankTrimMat: THREE.MeshStandardMaterial;
  readonly pumpStainlessMat: THREE.MeshStandardMaterial;
  readonly accumulatorBlueMat: THREE.MeshStandardMaterial;
  readonly copperPipeMat: THREE.MeshStandardMaterial;
  readonly redValveHandleMat: THREE.MeshStandardMaterial;
  readonly blueValveHandleMat: THREE.MeshStandardMaterial;
  readonly yellowGasValveMat: THREE.MeshStandardMaterial;
  readonly condensatePvcMat: THREE.MeshStandardMaterial;
  readonly braidedFlexMat: THREE.MeshStandardMaterial;
  readonly dhwHeaderY: number;
  readonly gasHeaderY: number;
  readonly primaryFlowHeaderY: number;
  readonly primaryReturnHeaderY: number;
  readonly boostedColdHeaderY: number;
  readonly condensateHeaderY: number;
  readonly headerWallZ: number;
  readonly addZBranchPipe: (
    parent: THREE.Group,
    namePrefix: string,
    x: number,
    y: number,
    zStart: number,
    zEnd: number,
    radius: number,
    mat: THREE.Material,
    addWallTee?: boolean
  ) => void;
}

/**
 * Builds the `study.heatingPlant` root group, shared plant-room materials,
 * and the two wall-mounted condensing boilers + independent concentric balanced flues.
 */
export function buildVaillantBoilersAndFlues(
  kit: PlantRoomBoilersKit
): HeatingPlantSharedContext {
  const { brassMat, castIronMat, tier2FloorY, windowFrameMat } = kit;

  const heatingPlantGroup = new THREE.Group();
  heatingPlantGroup.name = 'study.heatingPlant';
  heatingPlantGroup.userData.zone = 'study';

  const viessmannWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf2f4f5, // Viessmann Vitopearlwhite powder-coated steel
    roughness: 0.24,
    metalness: 0.15,
  });
  const viessmannOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xe84418, // Viessmann signature brand orange-red
    roughness: 0.3,
  });
  const vitotronicScreenMat = new THREE.MeshStandardMaterial({
    color: 0x101418,
    roughness: 0.12,
    metalness: 0.4,
  });
  const vitotronicDisplayGlowMat = new THREE.MeshStandardMaterial({
    color: 0x48b8ff,
    emissive: 0x2299ee,
    emissiveIntensity: 0.75,
  });
  const cylinderJacketMat = new THREE.MeshStandardMaterial({
    color: 0xdce2e6, // Brushed silver-white unvented cylinder casing
    roughness: 0.28,
    metalness: 0.38,
  });
  const coldTankGrpMat = new THREE.MeshStandardMaterial({
    color: 0x284b6e, // Potable-water insulated blue-slate GRP cistern jacket (WRAS approved)
    roughness: 0.34,
    metalness: 0.14,
  });
  const coldTankTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1a2634, // Dark industrial polymer base & inspection hatch trim
    roughness: 0.42,
    metalness: 0.22,
  });
  const pumpStainlessMat = new THREE.MeshStandardMaterial({
    color: 0xcfd6dc, // Stainless-steel multistage booster pump volutes & manifold
    roughness: 0.22,
    metalness: 0.82,
  });
  const accumulatorBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1e6bb8, // Potable cold-water butyl diaphragm accumulator vessel
    roughness: 0.28,
    metalness: 0.32,
  });
  const copperPipeMat = new THREE.MeshStandardMaterial({
    color: 0xb86b42,
    roughness: 0.26,
    metalness: 0.82,
  });

  const redValveHandleMat = new THREE.MeshStandardMaterial({
    color: 0xc82822,
    roughness: 0.35,
    metalness: 0.15,
  });
  const blueValveHandleMat = new THREE.MeshStandardMaterial({
    color: 0x1e5aa8,
    roughness: 0.35,
    metalness: 0.15,
  });
  const yellowGasValveMat = new THREE.MeshStandardMaterial({
    color: 0xe2a818,
    roughness: 0.34,
    metalness: 0.18,
  });
  const condensatePvcMat = new THREE.MeshStandardMaterial({
    color: 0xf0f2f4,
    roughness: 0.32,
    metalness: 0.05,
  });
  const braidedFlexMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0c8,
    roughness: 0.28,
    metalness: 0.85,
  });

  // Geometry caches for shared pipe elbows, tee collars, and branch pipes
  const branchCylinderCache = new Map<string, THREE.CylinderGeometry>();
  const elbowSphereCache = new Map<string, THREE.SphereGeometry>();
  const teeCollarCache = new Map<string, THREE.CylinderGeometry>();

  const getBranchCylinderGeo = (radius: number, len: number): THREE.CylinderGeometry => {
    const key = `${radius.toFixed(5)}_${len.toFixed(5)}`;
    let geo = branchCylinderCache.get(key);
    if (!geo) {
      geo = createSharedGeo(new THREE.CylinderGeometry(radius, radius, len, 10));
      branchCylinderCache.set(key, geo);
    }
    return geo;
  };

  const getElbowSphereGeo = (radius: number): THREE.SphereGeometry => {
    const key = radius.toFixed(5);
    let geo = elbowSphereCache.get(key);
    if (!geo) {
      geo = createSharedGeo(new THREE.SphereGeometry(radius * 1.26, 12, 12));
      elbowSphereCache.set(key, geo);
    }
    return geo;
  };

  const getTeeCollarGeo = (radius: number): THREE.CylinderGeometry => {
    const key = radius.toFixed(5);
    let geo = teeCollarCache.get(key);
    if (!geo) {
      geo = createSharedGeo(new THREE.CylinderGeometry(radius * 1.45, radius * 1.45, 0.034, 12));
      teeCollarCache.set(key, geo);
    }
    return geo;
  };

  // Helper for adding a 90° copper/brass elbow sphere + horizontal Z branch pipe + wall tee collar
  const addZBranchPipe = (
    parent: THREE.Group,
    namePrefix: string,
    x: number,
    y: number,
    zStart: number,
    zEnd: number,
    radius: number,
    mat: THREE.Material,
    addWallTee = true
  ): void => {
    const len = Math.abs(zEnd - zStart);
    const midZ = (zStart + zEnd) * 0.5;
    const horiz = new THREE.Mesh(
      getBranchCylinderGeo(radius, len),
      mat
    );
    horiz.name = `${namePrefix}.branchPipe`;
    horiz.rotation.x = Math.PI / 2;
    horiz.position.set(x, y, midZ);
    horiz.castShadow = true;
    parent.add(horiz);

    const frontElbow = tagHighLod(
      new THREE.Mesh(getElbowSphereGeo(radius), mat)
    );
    frontElbow.name = `${namePrefix}.elbow`;
    frontElbow.position.set(x, y, zStart);
    parent.add(frontElbow);

    if (addWallTee) {
      const teeCollar = tagHighLod(
        new THREE.Mesh(getTeeCollarGeo(radius), brassMat)
      );
      teeCollar.name = `${namePrefix}.wallTeeCollar`;
      teeCollar.rotation.z = Math.PI / 2;
      teeCollar.position.set(x, y, zEnd);
      parent.add(teeCollar);
    }
  };

  // Header elevation constants (in world Y, above tier2FloorY = -0.60m) on the Study North Wall (Z = 8.46m):
  const dhwHeaderY = tier2FloorY + 1.84;          // +1.24m: 22mm Secondary DHW Hot Water Flow Header
  const gasHeaderY = tier2FloorY + 0.88;          // +0.28m: 22mm Natural Gas Supply Header
  const primaryFlowHeaderY = tier2FloorY + 0.78;   // +0.18m: 28mm Primary Heating Flow Header (right at [-21.295, 0.193, 8.39])
  const primaryReturnHeaderY = tier2FloorY + 0.66; // +0.06m: 28mm Primary Heating Return Header
  const boostedColdHeaderY = tier2FloorY + 0.54;   // -0.06m: 28mm Boosted Cold Water Main Header
  const condensateHeaderY = tier2FloorY + 0.40;    // -0.20m: 32mm White PVC Condensate & Tundish Waste Header
  const headerWallZ = 8.46;

  // 1. Two Wall-Mounted Viessmann Vitodens 200-W Gas Condensing Boilers on the East (closest to Plant Room & East Flue Wall)
  //    at X = -19.82m and X = -19.26m, mounted at ergonomic servicing height Y = tier2FloorY + 0.95m..1.75m
  //    (world Y = +0.35m..+1.15m) so both horizontal concentric flues pass cleanly beneath the Plant Room's
  //    1.98m dropped ceiling (`Ceil 1621697`, world Y = 1.38m)!
  const boilerCenterY = tier2FloorY + 1.35; // World Y = +0.75m (casing spans +0.35m..+1.15m)
  const boilerCenterZ = 8.58;
  const flueWorldZ = 8.608; // Concentric flue centerline Z = 8.608m
  const flueLocalZ = flueWorldZ - boilerCenterZ; // +0.028m

  const boilerBodyGeo = createSharedGeo(new THREE.BoxGeometry(0.48, 0.8, 0.38));
  const frontFasciaGeo = createSharedGeo(new THREE.BoxGeometry(0.45, 0.76, 0.018));
  const brandBadgeGeo = createSharedGeo(new THREE.BoxGeometry(0.11, 0.026, 0.008));
  const controllerBezelGeo = createSharedGeo(new THREE.BoxGeometry(0.15, 0.18, 0.012));
  const controllerGlowGeo = createSharedGeo(new THREE.BoxGeometry(0.095, 0.065, 0.006));
  const flueCollarGeo = createSharedGeo(new THREE.CylinderGeometry(0.058, 0.064, 0.06, 16));
  const flueElbowGeo = createSharedGeo(new THREE.SphereGeometry(0.055, 16, 14));
  const elbowEastSocketGeo = createSharedGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.024, 16));
  const flueClampBandGeo = createSharedGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 16));
  const valveLeverGeo = createSharedGeo(new THREE.BoxGeometry(0.01, 0.038, 0.018));
  const magFilterBodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.13, 16));
  const magFilterCapGeo = createSharedGeo(new THREE.CylinderGeometry(0.038, 0.038, 0.018, 16));

  // Independent room-sealed Ø60/100mm concentric flue elbow heights (no T-piece, full-run accessible):
  // - Boiler 1 (East, X = -19.26m): turns East at world Y = 1.20m (local Y = +0.45m), cleanly above the Plant Room UFH wiring center
  // - Boiler 2 (West, X = -19.82m): rises higher and turns East at world Y = 1.30m (local Y = +0.55m),
  //   passing cleanly ABOVE Boiler 1's 90° elbow while staying below the 1.38m Plant Room ceiling soffit!
  for (const [bIdx, bx, elbowWorldY] of [
    [1, -19.26, 1.20],
    [2, -19.82, 1.30],
  ] as const) {
    const flueLocalY = elbowWorldY - boilerCenterY;
    const boilerPrefix = `study.viessmannBoiler.${bIdx}`;
    const boilerGroup = new THREE.Group();
    boilerGroup.name = boilerPrefix;
    boilerGroup.position.set(bx, boilerCenterY, boilerCenterZ);

    // Main Vitodens 200-W sheet-steel casing (0.48m W x 0.80m H x 0.38m D)
    const boilerBody = new THREE.Mesh(
      boilerBodyGeo,
      viessmannWhiteMat
    );
    boilerBody.name = `${boilerPrefix}.casing`;
    boilerBody.castShadow = true;
    boilerBody.receiveShadow = true;
    boilerGroup.add(boilerBody);

    // Chamfered front fascia panel
    const frontFascia = new THREE.Mesh(
      frontFasciaGeo,
      viessmannWhiteMat
    );
    frontFascia.name = `${boilerPrefix}.frontFascia`;
    frontFascia.position.set(0, 0, 0.195);
    boilerGroup.add(frontFascia);

    // Viessmann orange-red brand badge at upper center
    const brandBadge = new THREE.Mesh(
      brandBadgeGeo,
      viessmannOrangeMat
    );
    brandBadge.name = `${boilerPrefix}.badge`;
    brandBadge.position.set(0, 0.22, 0.206);
    boilerGroup.add(brandBadge);

    // Black glass Vitotronic / Energy Cockpit touchscreen controller at lower center
    const controllerBezel = new THREE.Mesh(
      controllerBezelGeo,
      vitotronicScreenMat
    );
    controllerBezel.name = `${boilerPrefix}.controller`;
    controllerBezel.position.set(0, -0.18, 0.205);
    boilerGroup.add(controllerBezel);

    const controllerGlow = tagHighLod(
      new THREE.Mesh(controllerGlowGeo, vitotronicDisplayGlowMat)
    );
    controllerGlow.name = `${boilerPrefix}.controller.display`;
    controllerGlow.position.set(0, -0.16, 0.212);
    boilerGroup.add(controllerGlow);

    // Top concentric Ø60/100mm balanced flue turret adaptor collar, vertical riser & swept 90° elbow turning East (+X)
    const flueCollar = new THREE.Mesh(
      flueCollarGeo,
      windowFrameMat
    );
    flueCollar.name = `${boilerPrefix}.flueCollar`;
    flueCollar.position.set(0, 0.43, flueLocalZ);
    boilerGroup.add(flueCollar);

    const vertFlueLen = flueLocalY - 0.43;
    const flueVertical = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.05, 0.05, vertFlueLen, 16)),
      viessmannWhiteMat
    );
    flueVertical.name = `${boilerPrefix}.flue`;
    flueVertical.position.set(0, 0.43 + vertFlueLen * 0.5, flueLocalZ);
    flueVertical.castShadow = true;
    boilerGroup.add(flueVertical);

    // Swept 90° concentric elbow turning East (+X) into this boiler's dedicated horizontal flue run
    const flueElbow = new THREE.Mesh(
      flueElbowGeo,
      viessmannWhiteMat
    );
    flueElbow.name = `${boilerPrefix}.flueElbow`;
    flueElbow.position.set(0, flueLocalY, flueLocalZ);
    boilerGroup.add(flueElbow);

    // Socket collar band on the East outlet of the 90° elbow
    const elbowEastSocket = tagHighLod(
      new THREE.Mesh(elbowEastSocketGeo, windowFrameMat)
    );
    elbowEastSocket.name = `${boilerPrefix}.flueElbowSocket`;
    elbowEastSocket.rotation.z = Math.PI / 2;
    elbowEastSocket.position.set(0.048, flueLocalY, flueLocalZ);
    boilerGroup.add(elbowEastSocket);

    // Clamping band + CO/O2 flue gas analyser test-point bungs on the vertical turret below the elbow
    const flueClampBand = tagHighLod(
      new THREE.Mesh(flueClampBandGeo, windowFrameMat)
    );
    flueClampBand.name = `${boilerPrefix}.flueClampBand`;
    flueClampBand.position.set(0, flueLocalY - 0.065, flueLocalZ);
    boilerGroup.add(flueClampBand);

    // Underside 5-pipe copper hydronic & gas connections (Z = 8.54m -> local z = -0.04m),
    // each dropping to its exact corresponding wall header at Z = 8.46m (local z = -0.12m) via a 90° elbow!
    // Boiler underside is at local y = -0.40m (world Y = tier2FloorY + 1.00m = +0.40m):
    const boilerConnections: ReadonlyArray<{
      readonly key: string;
      readonly px: number;
      readonly targetWorldY: number;
      readonly handleMat: THREE.Material;
      readonly radius: number;
      readonly hasMagFilter?: boolean;
    }> = [
      // 1. Primary Heating Flow (22mm) -> Primary Flow Header (tier2FloorY + 0.78m)
      {
        key: 'primaryFlow',
        px: -0.16,
        targetWorldY: primaryFlowHeaderY,
        handleMat: redValveHandleMat,
        radius: 0.012,
      },
      // 2. Cylinder Primary Coil Flow (22mm) -> Primary Flow Header (tier2FloorY + 0.78m)
      {
        key: 'coilFlow',
        px: -0.08,
        targetWorldY: primaryFlowHeaderY,
        handleMat: redValveHandleMat,
        radius: 0.011,
      },
      // 3. Natural Gas Supply (22mm) -> Gas Supply Header (tier2FloorY + 0.88m)
      {
        key: 'gasSupply',
        px: 0,
        targetWorldY: gasHeaderY,
        handleMat: yellowGasValveMat,
        radius: 0.011,
      },
      // 4. Cylinder Primary Coil Return (22mm) -> Primary Return Header (tier2FloorY + 0.66m)
      {
        key: 'coilReturn',
        px: 0.08,
        targetWorldY: primaryReturnHeaderY,
        handleMat: blueValveHandleMat,
        radius: 0.011,
      },
      // 5. Primary Heating Return (22mm) with Magnetic Filter -> Primary Return Header (tier2FloorY + 0.66m)
      {
        key: 'primaryReturn',
        px: 0.16,
        targetWorldY: primaryReturnHeaderY,
        handleMat: blueValveHandleMat,
        radius: 0.012,
        hasMagFilter: true,
      },
    ];

    for (const conn of boilerConnections) {
      const connPrefix = `${boilerPrefix}.${conn.key}`;
      const localTopY = -0.4;
      const localBotY = conn.targetWorldY - boilerCenterY;
      const dropLen = localTopY - localBotY;
      const dropMidY = (localTopY + localBotY) * 0.5;

      // Vertical copper drop pipe from boiler underside to header elevation
      const vertPipe = new THREE.Mesh(
        getBranchCylinderGeo(conn.radius, dropLen),
        copperPipeMat
      );
      vertPipe.name = `${connPrefix}.dropPipe`;
      vertPipe.position.set(conn.px, dropMidY, -0.04);
      vertPipe.castShadow = true;
      boilerGroup.add(vertPipe);

      // Brass quarter-turn isolation valve body + color-coded lever handle directly under boiler
      const valveBody = tagHighLod(
        new THREE.Mesh(getTeeCollarGeo(conn.radius), brassMat)
      );
      valveBody.name = `${connPrefix}.isolationValve`;
      valveBody.position.set(conn.px, -0.435, -0.04);
      boilerGroup.add(valveBody);

      const valveLever = tagHighLod(
        new THREE.Mesh(valveLeverGeo, conn.handleMat)
      );
      valveLever.name = `${connPrefix}.valveLever`;
      valveLever.position.set(conn.px, -0.442, -0.018);
      boilerGroup.add(valveLever);

      // Magnetic cyclonic system filter canister (e.g. Adey MagnaClean / Fernox TF1) on the Primary Return leg
      if (conn.hasMagFilter) {
        const magFilterBody = new THREE.Mesh(
          magFilterBodyGeo,
          castIronMat
        );
        magFilterBody.name = `${boilerPrefix}.magneticFilter`;
        magFilterBody.position.set(conn.px, -0.585, -0.04);
        magFilterBody.castShadow = true;
        boilerGroup.add(magFilterBody);

        const magFilterCap = tagHighLod(
          new THREE.Mesh(magFilterCapGeo, redValveHandleMat)
        );
        magFilterCap.name = `${boilerPrefix}.magneticFilter.cap`;
        magFilterCap.position.set(conn.px, -0.515, -0.04);
        boilerGroup.add(magFilterCap);
      }

      // 90° elbow + horizontal branch (local z = -0.04m -> -0.12m = world Z = 8.54m -> 8.46m) + brass tee into wall header
      addZBranchPipe(
        boilerGroup,
        connPrefix,
        conn.px,
        localBotY,
        -0.04,
        -0.12,
        conn.radius,
        copperPipeMat,
        true
      );
    }

    // White 21.5mm PVC condensate drain pipe on far left (-0.21m) dropping into the condensate waste header (tier2FloorY + 0.40m)
    const condTopY = -0.4;
    const condBotY = condensateHeaderY - boilerCenterY; // -1.00m
    const condPipe = new THREE.Mesh(
      getBranchCylinderGeo(0.009, condTopY - condBotY),
      condensatePvcMat
    );
    condPipe.name = `${boilerPrefix}.condensateDrainPipe`;
    condPipe.position.set(-0.21, (condTopY + condBotY) * 0.5, -0.08);
    boilerGroup.add(condPipe);

    addZBranchPipe(
      boilerGroup,
      `${boilerPrefix}.condensateDrain`,
      -0.21,
      condBotY,
      -0.08,
      -0.12,
      0.009,
      condensatePvcMat,
      false
    );

    heatingPlantGroup.add(boilerGroup);
  }

  // Two Independent East-Running Ø60/100mm Concentric Room-Sealed Balanced Flues (BS 5440-1 Type C13):
  // - Lower Flue (`study.heatingPlant.boiler1FlueDuct`): from Boiler 1 (`X = -19.26m, Y = 1.35m`) to East Courtyard Wall (`X = -17.256m, Y = 1.40m`)
  // - Upper Flue (`study.heatingPlant.cascadeFlueHeader`): from Boiler 2 (`X = -19.82m, Y = 1.55m`) passing cleanly above Boiler 1 to East Courtyard Wall (`X = -17.256m, Y = 1.61m`)
  // Both flues sit well below the ceiling joists for full-run inspection access and slope upward toward the exterior terminal for condensate drainage.
  {
    const flueEndX = -17.256;
    const jointBandGeo = createSharedGeo(new THREE.CylinderGeometry(0.054, 0.054, 0.022, 16));
    const wallStrutGeo = createSharedGeo(new THREE.CylinderGeometry(0.0065, 0.0065, flueWorldZ - 8.39, 8));
    const flueWallCollarGeo = createSharedGeo(new THREE.CylinderGeometry(0.076, 0.076, 0.016, 18));
    const extTerminalSleeveGeo = createSharedGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.11, 16));
    const extTerminalNozzleGeo = createSharedGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.065, 14));

    const independentFlues: ReadonlyArray<{
      readonly bIdx: 1 | 2;
      readonly startX: number;
      readonly startY: number;
      readonly endY: number;
      readonly clampXs: readonly number[];
    }> = [
      {
        bIdx: 1,
        startX: -19.26,
        startY: 1.20,
        endY: 1.23,
        clampXs: [-19.08, -18.55, -17.95, -17.48],
      },
      {
        bIdx: 2,
        startX: -19.82,
        startY: 1.30,
        endY: 1.325,
        clampXs: [-19.54, -19.08, -18.55, -17.95, -17.48],
      },
    ];

    for (const flue of independentFlues) {
      const dx = flueEndX - flue.startX;
      const dy = flue.endY - flue.startY;
      const flueLen = Math.hypot(dx, dy);
      const slopeAngleZ = Math.atan2(dy, dx);
      const midX = (flue.startX + flueEndX) * 0.5;
      const midY = (flue.startY + flue.endY) * 0.5;
      const yAtX = (x: number): number =>
        flue.startY + ((x - flue.startX) / dx) * dy;

      const fluePrefix = `study.heatingPlant.boiler${flue.bIdx}FlueDuct`;
      const flueDuct = new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.05, 0.05, flueLen, 18)),
        viessmannWhiteMat
      );
      flueDuct.name =
        flue.bIdx === 2
          ? 'study.heatingPlant.cascadeFlueHeader'
          : fluePrefix;
      flueDuct.rotation.z = -Math.PI / 2 + slopeAngleZ;
      flueDuct.position.set(midX, midY, flueWorldZ);
      flueDuct.castShadow = true;
      flueDuct.receiveShadow = true;
      heatingPlantGroup.add(flueDuct);

      // Acoustic wall hanger brackets & socket joint bands supporting each concentric flue along the North wall
      for (const [cIdx, clampX] of flue.clampXs.entries()) {
        const cy = yAtX(clampX);
        const jointBand = tagHighLod(
          new THREE.Mesh(jointBandGeo, windowFrameMat)
        );
        jointBand.name = `${fluePrefix}.jointBand.${cIdx + 1}`;
        jointBand.rotation.z = -Math.PI / 2 + slopeAngleZ;
        jointBand.position.set(clampX, cy, flueWorldZ);
        heatingPlantGroup.add(jointBand);

        const wallStrut = tagHighLod(
          new THREE.Mesh(wallStrutGeo, castIronMat)
        );
        wallStrut.name = `${fluePrefix}.wallStrut.${cIdx + 1}`;
        wallStrut.rotation.x = Math.PI / 2;
        wallStrut.position.set(clampX, cy, (flueWorldZ + 8.39) * 0.5);
        heatingPlantGroup.add(wallStrut);
      }

      // Fire-stopping intumescent wall escutcheon collars on both faces of the Study/Plant Room partition wall
      // and on the interior + exterior faces of the East Courtyard Wall
      for (const [wIdx, wallCollarX] of ([-18.995, -18.835, -17.555, -17.256] as const).entries()) {
        const cy = yAtX(wallCollarX);
        const flueWallCollar = tagHighLod(
          new THREE.Mesh(flueWallCollarGeo, castIronMat)
        );
        flueWallCollar.name = `${fluePrefix}.wallCollar.${wIdx + 1}`;
        flueWallCollar.rotation.z = Math.PI / 2;
        flueWallCollar.position.set(wallCollarX, cy, flueWorldZ);
        heatingPlantGroup.add(flueWallCollar);
      }

      // Exterior Concentric Anti-Gust Plume Terminal Guard (outer Ø100mm air intake sleeve + inner Ø60mm exhaust nozzle)
      const extTerminalSleeve = new THREE.Mesh(
        extTerminalSleeveGeo,
        viessmannWhiteMat
      );
      extTerminalSleeve.name =
        flue.bIdx === 2
          ? 'study.heatingPlant.cascadeFlueTerminal'
          : `study.heatingPlant.boiler${flue.bIdx}FlueTerminal`;
      extTerminalSleeve.rotation.z = Math.PI / 2;
      extTerminalSleeve.position.set(flueEndX + 0.055, flue.endY, flueWorldZ);
      extTerminalSleeve.castShadow = true;
      heatingPlantGroup.add(extTerminalSleeve);

      const extTerminalNozzle = tagHighLod(
        new THREE.Mesh(extTerminalNozzleGeo, castIronMat)
      );
      extTerminalNozzle.name = `study.heatingPlant.boiler${flue.bIdx}FlueTerminal.nozzle`;
      extTerminalNozzle.rotation.z = Math.PI / 2;
      extTerminalNozzle.position.set(flueEndX + 0.12, flue.endY, flueWorldZ);
      heatingPlantGroup.add(extTerminalNozzle);
    }
  }

  return {
    heatingPlantGroup,
    viessmannWhiteMat,
    vitotronicDisplayGlowMat,
    cylinderJacketMat,
    coldTankGrpMat,
    coldTankTrimMat,
    pumpStainlessMat,
    accumulatorBlueMat,
    copperPipeMat,
    redValveHandleMat,
    blueValveHandleMat,
    yellowGasValveMat,
    condensatePvcMat,
    braidedFlexMat,
    dhwHeaderY,
    gasHeaderY,
    primaryFlowHeaderY,
    primaryReturnHeaderY,
    boostedColdHeaderY,
    condensateHeaderY,
    headerWallZ,
    addZBranchPipe,
  };
}
