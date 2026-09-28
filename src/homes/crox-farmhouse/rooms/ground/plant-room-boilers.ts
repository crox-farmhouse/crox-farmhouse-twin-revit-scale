import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';

/**
 * Study / Plant Room north wall: Viessmann boilers, cylinders and pipework.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildPlantRoomBoilers(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'brassMat' | 'castIronMat' | 'windowFrameMat'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
): void {
  const { scene } = ctx;
  const {
    brassMat,
    castIronMat,
    tier2FloorY,
    windowFrameMat,
  } = kit;
  // =========================================================================
  // 7D. STUDY / PLANT ROOM NORTH WALL: 2 VIESSMANN GAS CONDENSING BOILERS,
  //     2 x 250L UNVENTED UPRIGHT HOT WATER CYLINDERS & COLD WATER STORAGE
  //     BREAK TANK WITH TWIN VARIABLE-SPEED BOOSTER PUMP SET
  //     (Mounted along the South +Z = 8.39m face of the North cross-wall,
  //      X = -22.10m..-19.02m, Y = tier2FloorY = -0.60m)
  // =========================================================================
  {
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

    // Helper for adding a 90° copper/brass elbow sphere + horizontal Z branch pipe + wall tee collar
    const addZBranchPipe = (
      parent: THREE.Group,
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
        new THREE.CylinderGeometry(radius, radius, len, 10),
        mat
      );
      horiz.rotation.x = Math.PI / 2;
      horiz.position.set(x, y, midZ);
      horiz.castShadow = true;
      parent.add(horiz);

      const frontElbow = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.26, 12, 12),
        mat
      );
      frontElbow.position.set(x, y, zStart);
      parent.add(frontElbow);

      if (addWallTee) {
        const teeCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 1.45, radius * 1.45, 0.034, 12),
          brassMat
        );
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
    //    at X = -19.82m and X = -19.26m, mounted at ergonomic servicing height Y = tier2FloorY + 1.00m..1.80m
    //    (world Y = +0.40m..+1.20m) so both horizontal concentric flues sit well below the ceiling joists
    //    and remain 100% accessible for inspection along their entire run!
    const boilerCenterY = tier2FloorY + 1.4; // World Y = +0.80m (casing spans +0.40m..+1.20m)
    const boilerCenterZ = 8.58;
    const flueWorldZ = 8.608; // Concentric flue centerline Z = 8.608m
    const flueLocalZ = flueWorldZ - boilerCenterZ; // +0.028m

    // Independent room-sealed Ø60/100mm concentric flue elbow heights (no T-piece, full-run accessible):
    // - Boiler 1 (East, X = -19.26m): turns East at world Y = 1.35m (local Y = +0.55m), 19cm above the Plant Room UFH wiring center
    // - Boiler 2 (West, X = -19.82m): rises 20cm higher and turns East at world Y = 1.55m (local Y = +0.75m),
    //   passing cleanly ABOVE Boiler 1's 90° elbow while staying ~28cm below the ceiling joists!
    for (const [bIdx, bx, elbowWorldY] of [
      [1, -19.26, 1.35],
      [2, -19.82, 1.55],
    ] as const) {
      const flueLocalY = elbowWorldY - boilerCenterY;
      const boilerGroup = new THREE.Group();
      boilerGroup.name = `study.viessmannBoiler.${bIdx}`;
      boilerGroup.position.set(bx, boilerCenterY, boilerCenterZ);

      // Main Vitodens 200-W sheet-steel casing (0.48m W x 0.80m H x 0.38m D)
      const boilerBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.8, 0.38),
        viessmannWhiteMat
      );
      boilerBody.name = `study.viessmannBoiler.${bIdx}.casing`;
      boilerBody.castShadow = true;
      boilerBody.receiveShadow = true;
      boilerGroup.add(boilerBody);

      // Chamfered front fascia panel
      const frontFascia = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.76, 0.018),
        viessmannWhiteMat
      );
      frontFascia.position.set(0, 0, 0.195);
      boilerGroup.add(frontFascia);

      // Viessmann orange-red brand badge at upper center
      const brandBadge = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.026, 0.008),
        viessmannOrangeMat
      );
      brandBadge.name = `study.viessmannBoiler.${bIdx}.badge`;
      brandBadge.position.set(0, 0.22, 0.206);
      boilerGroup.add(brandBadge);

      // Black glass Vitotronic / Energy Cockpit touchscreen controller at lower center
      const controllerBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.18, 0.012),
        vitotronicScreenMat
      );
      controllerBezel.name = `study.viessmannBoiler.${bIdx}.controller`;
      controllerBezel.position.set(0, -0.18, 0.205);
      boilerGroup.add(controllerBezel);

      const controllerGlow = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.065, 0.006),
        vitotronicDisplayGlowMat
      );
      controllerGlow.position.set(0, -0.16, 0.212);
      boilerGroup.add(controllerGlow);

      // Top concentric Ø60/100mm balanced flue turret adaptor collar, vertical riser & swept 90° elbow turning East (+X)
      const flueCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.064, 0.06, 16),
        windowFrameMat
      );
      flueCollar.position.set(0, 0.43, flueLocalZ);
      boilerGroup.add(flueCollar);

      const vertFlueLen = flueLocalY - 0.43;
      const flueVertical = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, vertFlueLen, 16),
        viessmannWhiteMat
      );
      flueVertical.name = `study.viessmannBoiler.${bIdx}.flue`;
      flueVertical.position.set(0, 0.43 + vertFlueLen * 0.5, flueLocalZ);
      flueVertical.castShadow = true;
      boilerGroup.add(flueVertical);

      // Swept 90° concentric elbow turning East (+X) into this boiler's dedicated horizontal flue run
      const flueElbow = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 14),
        viessmannWhiteMat
      );
      flueElbow.name = `study.viessmannBoiler.${bIdx}.flueElbow`;
      flueElbow.position.set(0, flueLocalY, flueLocalZ);
      boilerGroup.add(flueElbow);

      // Socket collar band on the East outlet of the 90° elbow
      const elbowEastSocket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.024, 16),
        windowFrameMat
      );
      elbowEastSocket.rotation.z = Math.PI / 2;
      elbowEastSocket.position.set(0.048, flueLocalY, flueLocalZ);
      boilerGroup.add(elbowEastSocket);

      // Clamping band + CO/O2 flue gas analyser test-point bungs on the vertical turret below the elbow
      const flueClampBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.022, 16),
        windowFrameMat
      );
      flueClampBand.position.set(0, flueLocalY - 0.065, flueLocalZ);
      boilerGroup.add(flueClampBand);

      // Underside 5-pipe copper hydronic & gas connections (Z = 8.54m -> local z = -0.04m),
      // each dropping to its exact corresponding wall header at Z = 8.46m (local z = -0.12m) via a 90° elbow!
      // Boiler underside is at local y = -0.40m (world Y = tier2FloorY + 1.00m = +0.40m):
      const boilerConnections: ReadonlyArray<{
        readonly px: number;
        readonly targetWorldY: number;
        readonly handleMat: THREE.Material;
        readonly radius: number;
        readonly hasMagFilter?: boolean;
      }> = [
        // 1. Primary Heating Flow (22mm) -> Primary Flow Header (tier2FloorY + 0.78m)
        {
          px: -0.16,
          targetWorldY: primaryFlowHeaderY,
          handleMat: redValveHandleMat,
          radius: 0.012,
        },
        // 2. Cylinder Primary Coil Flow (22mm) -> Primary Flow Header (tier2FloorY + 0.78m)
        {
          px: -0.08,
          targetWorldY: primaryFlowHeaderY,
          handleMat: redValveHandleMat,
          radius: 0.011,
        },
        // 3. Natural Gas Supply (22mm) -> Gas Supply Header (tier2FloorY + 0.88m)
        {
          px: 0,
          targetWorldY: gasHeaderY,
          handleMat: yellowGasValveMat,
          radius: 0.011,
        },
        // 4. Cylinder Primary Coil Return (22mm) -> Primary Return Header (tier2FloorY + 0.66m)
        {
          px: 0.08,
          targetWorldY: primaryReturnHeaderY,
          handleMat: blueValveHandleMat,
          radius: 0.011,
        },
        // 5. Primary Heating Return (22mm) with Magnetic Filter -> Primary Return Header (tier2FloorY + 0.66m)
        {
          px: 0.16,
          targetWorldY: primaryReturnHeaderY,
          handleMat: blueValveHandleMat,
          radius: 0.012,
          hasMagFilter: true,
        },
      ];

      for (const conn of boilerConnections) {
        const localTopY = -0.4;
        const localBotY = conn.targetWorldY - boilerCenterY;
        const dropLen = localTopY - localBotY;
        const dropMidY = (localTopY + localBotY) * 0.5;

        // Vertical copper drop pipe from boiler underside to header elevation
        const vertPipe = new THREE.Mesh(
          new THREE.CylinderGeometry(conn.radius, conn.radius, dropLen, 10),
          copperPipeMat
        );
        vertPipe.position.set(conn.px, dropMidY, -0.04);
        vertPipe.castShadow = true;
        boilerGroup.add(vertPipe);

        // Brass quarter-turn isolation valve body + color-coded lever handle directly under boiler
        const valveBody = new THREE.Mesh(
          new THREE.CylinderGeometry(conn.radius * 1.45, conn.radius * 1.45, 0.032, 12),
          brassMat
        );
        valveBody.position.set(conn.px, -0.45, -0.04);
        boilerGroup.add(valveBody);

        const valveLever = new THREE.Mesh(
          new THREE.BoxGeometry(0.01, 0.038, 0.018),
          conn.handleMat
        );
        valveLever.position.set(conn.px, -0.458, -0.018);
        boilerGroup.add(valveLever);

        // Magnetic cyclonic system filter canister (e.g. Adey MagnaClean / Fernox TF1) on the Primary Return leg
        if (conn.hasMagFilter) {
          const magFilterBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.036, 0.036, 0.13, 16),
            castIronMat
          );
          magFilterBody.name = `study.viessmannBoiler.${bIdx}.magneticFilter`;
          magFilterBody.position.set(conn.px, -0.585, -0.04);
          magFilterBody.castShadow = true;
          boilerGroup.add(magFilterBody);

          const magFilterCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.038, 0.038, 0.018, 16),
            redValveHandleMat
          );
          magFilterCap.position.set(conn.px, -0.515, -0.04);
          boilerGroup.add(magFilterCap);
        }

        // 90° elbow + horizontal branch (local z = -0.04m -> -0.12m = world Z = 8.54m -> 8.46m) + brass tee into wall header
        addZBranchPipe(
          boilerGroup,
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
        new THREE.CylinderGeometry(0.009, 0.009, condTopY - condBotY, 10),
        condensatePvcMat
      );
      condPipe.position.set(-0.21, (condTopY + condBotY) * 0.5, -0.08);
      boilerGroup.add(condPipe);

      addZBranchPipe(
        boilerGroup,
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
          startY: 1.35,
          endY: 1.4,
          clampXs: [-19.08, -18.55, -17.95, -17.48],
        },
        {
          bIdx: 2,
          startX: -19.82,
          startY: 1.55,
          endY: 1.61,
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

        const flueDuct = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, flueLen, 18),
          viessmannWhiteMat
        );
        flueDuct.name =
          flue.bIdx === 2
            ? 'study.heatingPlant.cascadeFlueHeader'
            : `study.heatingPlant.boiler${flue.bIdx}FlueDuct`;
        flueDuct.rotation.z = -Math.PI / 2 + slopeAngleZ;
        flueDuct.position.set(midX, midY, flueWorldZ);
        flueDuct.castShadow = true;
        flueDuct.receiveShadow = true;
        heatingPlantGroup.add(flueDuct);

        // Acoustic wall hanger brackets & socket joint bands supporting each concentric flue along the North wall
        for (const clampX of flue.clampXs) {
          const cy = yAtX(clampX);
          const jointBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.054, 0.054, 0.022, 16),
            windowFrameMat
          );
          jointBand.rotation.z = -Math.PI / 2 + slopeAngleZ;
          jointBand.position.set(clampX, cy, flueWorldZ);
          heatingPlantGroup.add(jointBand);

          const wallStrut = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0065, 0.0065, flueWorldZ - 8.39, 8),
            castIronMat
          );
          wallStrut.rotation.x = Math.PI / 2;
          wallStrut.position.set(clampX, cy, (flueWorldZ + 8.39) * 0.5);
          heatingPlantGroup.add(wallStrut);
        }

        // Fire-stopping intumescent wall escutcheon collars on both faces of the Study/Plant Room partition wall
        // and on the interior + exterior faces of the East Courtyard Wall
        for (const wallCollarX of [-18.995, -18.835, -17.555, -17.256] as const) {
          const cy = yAtX(wallCollarX);
          const flueWallCollar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.076, 0.076, 0.016, 18),
            castIronMat
          );
          flueWallCollar.rotation.z = Math.PI / 2;
          flueWallCollar.position.set(wallCollarX, cy, flueWorldZ);
          heatingPlantGroup.add(flueWallCollar);
        }

        // Exterior Concentric Anti-Gust Plume Terminal Guard (outer Ø100mm air intake sleeve + inner Ø60mm exhaust nozzle)
        const extTerminalSleeve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.11, 16),
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

        const extTerminalNozzle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.038, 0.065, 14),
          castIronMat
        );
        extTerminalNozzle.rotation.z = Math.PI / 2;
        extTerminalNozzle.position.set(flueEndX + 0.12, flue.endY, flueWorldZ);
        heatingPlantGroup.add(extTerminalNozzle);
      }
    }

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

    for (const hdr of mainHeaders) {
      const len = hdr.maxX - hdr.minX;
      const midX = (hdr.minX + hdr.maxX) * 0.5;
      const headerPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(hdr.radius, hdr.radius, len, 14),
        hdr.mat
      );
      headerPipe.name = hdr.name;
      headerPipe.rotation.z = Math.PI / 2;
      headerPipe.position.set(midX, hdr.y, headerWallZ);
      headerPipe.castShadow = true;
      heatingPlantGroup.add(headerPipe);

      // Brass Munsen wall pipe clips anchoring each header to the Z = 8.39m North wall every ~0.65m
      for (let clipX = hdr.minX + 0.18; clipX <= hdr.maxX - 0.18; clipX += 0.64) {
        const clipRing = new THREE.Mesh(
          new THREE.CylinderGeometry(hdr.radius * 1.32, hdr.radius * 1.32, 0.016, 12),
          brassMat
        );
        clipRing.rotation.z = Math.PI / 2;
        clipRing.position.set(clipX, hdr.y, headerWallZ);
        heatingPlantGroup.add(clipRing);

        const clipStem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0045, 0.0045, headerWallZ - 8.39, 8),
          brassMat
        );
        clipStem.rotation.x = Math.PI / 2;
        clipStem.position.set(clipX, hdr.y, (headerWallZ + 8.39) * 0.5);
        heatingPlantGroup.add(clipStem);

        const wallBaseplate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.006, 12),
          brassMat
        );
        wallBaseplate.rotation.x = Math.PI / 2;
        wallBaseplate.position.set(clipX, hdr.y, 8.393);
        heatingPlantGroup.add(wallBaseplate);
      }

      // Brass through-wall escutcheon collar where the header passes through the X = -18.99m partition wall into the Plant Room
      if (hdr.passesThroughEastWall) {
        const throughWallCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(hdr.radius * 1.75, hdr.radius * 1.75, 0.014, 16),
          brassMat
        );
        throughWallCollar.rotation.z = Math.PI / 2;
        throughWallCollar.position.set(-18.995, hdr.y, headerWallZ);
        heatingPlantGroup.add(throughWallCollar);
      }
    }

    // Sealed-System Wall-Mounted Heating Expansion Vessel (18L Red Vessel) + Filling Loop & Pressure Gauge Assembly
    // mounted on the North wall below the Boilers (X = -19.54m, Y = tier2FloorY + 0.24m, Z = 8.54m) connected to the Primary Flow/Return headers
    {
      const sysExpX = -19.54;
      const sysExpMat = new THREE.MeshStandardMaterial({
        color: 0xb82922, // Powder-coated red hydronic sealed-system expansion vessel
        roughness: 0.32,
        metalness: 0.28,
      });
      const sysExpVessel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.3, 18),
        sysExpMat
      );
      sysExpVessel.name = 'study.heatingPlant.primaryExpansionVessel';
      sysExpVessel.position.set(sysExpX, tier2FloorY + 0.24, 8.54);
      sysExpVessel.castShadow = true;
      heatingPlantGroup.add(sysExpVessel);

      const sysExpStrap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.119, 0.119, 0.024, 18),
        castIronMat
      );
      sysExpStrap.position.set(sysExpX, tier2FloorY + 0.24, 8.54);
      heatingPlantGroup.add(sysExpStrap);

      // Vertical 15mm copper feed from Primary Flow Header (tier2FloorY + 0.78m) down into top of red expansion vessel + pressure gauge
      const sysExpPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.39, 10),
        copperPipeMat
      );
      sysExpPipe.position.set(sysExpX, tier2FloorY + 0.585, headerWallZ);
      heatingPlantGroup.add(sysExpPipe);

      addZBranchPipe(
        heatingPlantGroup,
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
      const drainDropPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, drainDropH, 12),
        condensatePvcMat
      );
      drainDropPipe.name = 'study.heatingPlant.condensateFloorDrop';
      drainDropPipe.position.set(drainDropX, tier2FloorY + drainDropH * 0.5, headerWallZ);
      heatingPlantGroup.add(drainDropPipe);

      const drainElbow = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        condensatePvcMat
      );
      drainElbow.position.set(drainDropX, condensateHeaderY, headerWallZ);
      heatingPlantGroup.add(drainElbow);

      const floorGully = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.018, 16),
        castIronMat
      );
      floorGully.name = 'study.heatingPlant.floorDrainGully';
      floorGully.position.set(drainDropX, tier2FloorY + 0.009, headerWallZ);
      heatingPlantGroup.add(floorGully);
    }

    // 2. Two 250L Floor-Standing Unvented Upright Hot Water Cylinders in the Center
    //    at X = -21.10m and X = -20.48m, Y = tier2FloorY (-0.60m), Z = 8.71m (Ø0.54m x 1.52m tall — 250L capacity each, 500L total)
    for (const [cIdx, cx] of [
      [1, -21.1],
      [2, -20.48],
    ] as const) {
      const cylGroup = new THREE.Group();
      cylGroup.name = `study.unventedCylinder.${cIdx}`;
      cylGroup.position.set(cx, tier2FloorY, 8.71);

      const cylR = 0.27; // Ø0.54m 250L upright unvented cylinder
      const cylBodyH = 1.38; // Total height ~1.52m with base ring & top dome
      const localWallZ = headerWallZ - 8.71; // -0.25m (distance from cylinder center Z = 8.71m to wall headers at Z = 8.46m)

      // Moulded black polymer base ring (Y = 0..0.045m)
      const baseRing = new THREE.Mesh(
        new THREE.CylinderGeometry(cylR + 0.008, cylR + 0.012, 0.045, 24),
        castIronMat
      );
      baseRing.position.set(0, 0.0225, 0);
      cylGroup.add(baseRing);

      // Main upright insulated stainless-steel 250L cylinder body (Y = 0.045m..1.425m)
      const cylBody = new THREE.Mesh(
        new THREE.CylinderGeometry(cylR, cylR, cylBodyH, 28),
        cylinderJacketMat
      );
      cylBody.name = `study.unventedCylinder.${cIdx}.tank`;
      cylBody.position.set(0, 0.045 + cylBodyH / 2, 0);
      cylBody.castShadow = true;
      cylBody.receiveShadow = true;
      cylGroup.add(cylBody);

      // Domed top cap (Y = 1.425m..1.535m)
      const domeCap = new THREE.Mesh(
        new THREE.SphereGeometry(cylR, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
        cylinderJacketMat
      );
      domeCap.scale.set(1, 0.41, 1);
      domeCap.position.set(0, 1.425, 0);
      domeCap.castShadow = true;
      cylGroup.add(domeCap);

      // A. Top 22mm DHW Hot Water Draw-Off Riser (Y = 1.52m -> 1.84m) + 90° Elbow & Horizontal Branch (Z = 8.71m -> 8.46m)
      //    connecting directly into the Secondary DHW Hot Water Header (`dhwHeaderY = tier2FloorY + 1.84m`)!
      const topOutletPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.34, 10),
        copperPipeMat
      );
      topOutletPipe.name = `study.unventedCylinder.${cIdx}.dhwDrawOffRiser`;
      topOutletPipe.position.set(0, 1.67, 0);
      topOutletPipe.castShadow = true;
      cylGroup.add(topOutletPipe);

      const dhwIsolationValve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.036, 12),
        brassMat
      );
      dhwIsolationValve.position.set(0, 1.64, 0);
      cylGroup.add(dhwIsolationValve);

      const dhwValveLever = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.042, 0.016),
        redValveHandleMat
      );
      dhwValveLever.position.set(0.018, 1.64, 0);
      cylGroup.add(dhwValveLever);

      addZBranchPipe(
        cylGroup,
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
        // Horizontal brass boss entering cylinder jacket
        const coilBoss = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.09, 12),
          brassMat
        );
        coilBoss.rotation.z = Math.PI / 2;
        coilBoss.position.set(coilX - 0.04, coilY, coilStartZ);
        cylGroup.add(coilBoss);

        // Horizontal copper branch from cylinder coil boss (local z = -0.14m) to North wall header (local z = -0.25m)
        addZBranchPipe(
          cylGroup,
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
          const zoneValveBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.088, 0.068, 0.062),
            cylinderJacketMat
          );
          zoneValveBody.name = `study.unventedCylinder.${cIdx}.zoneValve`;
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
        coldInletX,
        0.54,
        -0.12,
        localWallZ,
        0.012,
        copperPipeMat,
        true
      );

      // Monobloc 3.0 bar Pressure Reducing Valve (PRV) & Strainer Cartridge + Black Adjustment Cap
      const prvBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.068, 12),
        brassMat
      );
      prvBody.name = `study.unventedCylinder.${cIdx}.pressureReducingValve`;
      prvBody.position.set(coldInletX, 0.54, -0.16);
      cylGroup.add(prvBody);

      const prvCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.022, 0.038, 12),
        castIronMat
      );
      prvCap.position.set(coldInletX, 0.585, -0.16);
      cylGroup.add(prvCap);

      // Lower cold feed drop from Y = 0.54m down to Y = 0.28m and into the base of the unvented cylinder
      const coldDropPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.26, 10),
        copperPipeMat
      );
      coldDropPipe.position.set(coldInletX, 0.41, -0.12);
      cylGroup.add(coldDropPipe);

      const coldInletBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.1, 10),
        brassMat
      );
      coldInletBoss.rotation.z = Math.PI / 2;
      coldInletBoss.position.set(coldInletX - 0.05, 0.28, -0.12);
      cylGroup.add(coldInletBoss);

      // Wall-Mounted 24L Potable White Expansion Vessel (Ø0.24m x 0.32m) mounted on the North wall above/behind the cylinder
      // WITH heavy-duty steel wall bracket, circumferential strap, bottom brass lockshield valve, AND connected braided hose!
      const expX = 0.18;
      const expY = 1.96;
      const expZ = -0.19; // World Z = 8.52m (mounted against the Z = 8.39m North wall)
      const expVessel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.3, 18),
        viessmannWhiteMat
      );
      expVessel.name = `study.unventedCylinder.${cIdx}.expansionVessel`;
      expVessel.position.set(expX, expY, expZ);
      expVessel.castShadow = true;
      cylGroup.add(expVessel);

      // Steel wall bracket & circumferential clamping band holding the expansion vessel to the Z = 8.39m North wall
      const expBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.119, 0.119, 0.024, 18),
        castIronMat
      );
      expBand.position.set(expX, expY, expZ);
      cylGroup.add(expBand);

      const expWallBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.08, 0.14),
        castIronMat
      );
      expWallBracket.position.set(expX, expY, expZ - 0.08);
      cylGroup.add(expWallBracket);

      // Brass service connection boss at bottom of expansion vessel + braided stainless-steel flexible hose loop
      // connecting down to the 15mm copper expansion riser from the cold water inlet set (Y = 0.54m -> 1.78m)!
      const expBottomBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.04, 10),
        brassMat
      );
      expBottomBoss.position.set(expX, expY - 0.165, expZ);
      cylGroup.add(expBottomBoss);

      const expFlexHose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.16, 10),
        braidedFlexMat
      );
      expFlexHose.name = `study.unventedCylinder.${cIdx}.expansionFlexHose`;
      expFlexHose.position.set(expX, expY - 0.25, expZ);
      cylGroup.add(expFlexHose);

      const expCopperRiser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 1.12, 10),
        copperPipeMat
      );
      expCopperRiser.position.set(expX, 1.1, expZ);
      cylGroup.add(expCopperRiser);

      const expLowerJoin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.08, 10),
        copperPipeMat
      );
      expLowerJoin.rotation.x = Math.PI / 2;
      expLowerJoin.position.set(expX, 0.54, (expZ + -0.12) * 0.5);
      cylGroup.add(expLowerJoin);

      // Front technical data plate & dual immersion heater / thermostat bosses (lower primary & upper boost)
      const dataPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.2, 0.008),
        castIronMat
      );
      dataPlate.position.set(0, 1.14, cylR + 0.004);
      cylGroup.add(dataPlate);

      for (const bossY of [0.4, 0.9] as const) {
        const immersionBoss = new THREE.Mesh(
          new THREE.CylinderGeometry(0.044, 0.044, 0.08, 14),
          viessmannWhiteMat
        );
        immersionBoss.rotation.x = Math.PI / 2;
        immersionBoss.position.set(0.055, bossY, cylR + 0.03);
        immersionBoss.castShadow = true;
        cylGroup.add(immersionBoss);
      }

      // D. T&PRV (Temperature & Pressure Relief Valve at Y = 1.12m), Air-Break Tundish Funnel (Y = 0.88m),
      //    and 22mm Copper D2 Safety Discharge Pipe dropping directly into the Condensate/Discharge Header (`Y = 0.40m`)!
      const tprX = -cylR - 0.032;
      const tprZ = -0.06;
      const tprValve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.068, 10),
        brassMat
      );
      tprValve.rotation.z = Math.PI / 2;
      tprValve.position.set(tprX + 0.01, 1.12, tprZ);
      cylGroup.add(tprValve);

      const tprRedCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.028, 10),
        redValveHandleMat
      );
      tprRedCap.position.set(tprX - 0.012, 1.145, tprZ);
      cylGroup.add(tprRedCap);

      // Black polymer Type-AA air-break tundish funnel at Y = 0.88m
      const tundishFunnel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.012, 0.065, 12),
        castIronMat
      );
      tundishFunnel.name = `study.unventedCylinder.${cIdx}.tundish`;
      tundishFunnel.position.set(tprX - 0.012, 0.88, tprZ);
      cylGroup.add(tundishFunnel);

      // Vertical copper D1/D2 discharge pipe from T&PRV (Y = 1.12m) through tundish down to Y = 0.40m, then elbowing to wall waste header
      const dischargePipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.72, 10),
        copperPipeMat
      );
      dischargePipe.position.set(tprX - 0.012, 0.76, tprZ);
      cylGroup.add(dischargePipe);

      addZBranchPipe(
        cylGroup,
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
      const pumpPlinth = new THREE.Mesh(
        new THREE.BoxGeometry(tankW, plinthH, tankD),
        coldTankTrimMat
      );
      pumpPlinth.name = 'study.coldWaterBoosterTank.pumpPlinth';
      pumpPlinth.position.set(0, plinthH * 0.5, 0);
      pumpPlinth.castShadow = true;
      pumpPlinth.receiveShadow = true;
      coldBoosterGroup.add(pumpPlinth);

      // Twin Variable-Speed Multistage Booster Pumps (Duty / Assist-Standby) mounted on the front of the plinth
      const manifoldZ = tankD * 0.5 + 0.11; // +0.38m (world Z = 9.11m)
      for (const [pIdx, px] of [
        [1, -0.14],
        [2, 0.14],
      ] as const) {
        const pumpBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.068, 0.068, 0.24, 16),
          pumpStainlessMat
        );
        pumpBody.name = `study.coldWaterBoosterTank.boosterPump.${pIdx}`;
        pumpBody.rotation.x = Math.PI / 2;
        pumpBody.position.set(px, 0.16, tankD * 0.5 + 0.04);
        pumpBody.castShadow = true;
        coldBoosterGroup.add(pumpBody);

        // Vertical stainless-steel delivery stub connecting each pump volute up to the upper delivery manifold (Y = 0.28m)
        const pumpDeliveryStub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.16, 10),
          pumpStainlessMat
        );
        pumpDeliveryStub.position.set(px, 0.2, manifoldZ);
        coldBoosterGroup.add(pumpDeliveryStub);

        // Brass check valve + isolation ball valve on each pump delivery leg
        const pumpCheckValve = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.036, 12),
          brassMat
        );
        pumpCheckValve.position.set(px, 0.22, manifoldZ);
        coldBoosterGroup.add(pumpCheckValve);

        // VFD inverter drive box & status LED on top of each booster pump motor
        const vfdBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.095, 0.055, 0.12),
          coldTankTrimMat
        );
        vfdBox.position.set(px, 0.255, tankD * 0.5 + 0.02);
        coldBoosterGroup.add(vfdBox);

        const vfdScreen = new THREE.Mesh(
          new THREE.BoxGeometry(0.052, 0.024, 0.006),
          vitotronicDisplayGlowMat
        );
        vfdScreen.position.set(px, 0.258, tankD * 0.5 + 0.082);
        coldBoosterGroup.add(vfdScreen);
      }

      // Lower Stainless-Steel Suction Header (Y = 0.09m) & Upper Boosted Delivery Manifold Bar (Y = 0.28m) across both pumps
      for (const mhY of [0.09, 0.28] as const) {
        const pumpManifold = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.52, 12),
          pumpStainlessMat
        );
        pumpManifold.rotation.z = Math.PI / 2;
        pumpManifold.position.set(0, mhY, manifoldZ);
        coldBoosterGroup.add(pumpManifold);
      }

      const pressureGauge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.022, 16),
        brassMat
      );
      pressureGauge.rotation.x = Math.PI / 2;
      pressureGauge.position.set(0, 0.315, manifoldZ + 0.01);
      coldBoosterGroup.add(pressureGauge);

      // A. Connected 28mm Copper Boosted-Cold Delivery Pipe from the Right (East) end of the Pump Delivery Manifold
      //    (local x = +0.26m -> +0.33m, y = 0.28m -> 0.54m, z = +0.38m -> -0.27m) with 90° elbows & isolation valve
      //    connecting directly into the Boosted Cold Water Main Header (`boostedColdHeaderY = tier2FloorY + 0.54m`)!
      const sidePipeX = 0.33; // World X = -21.49m (along the East side of the cistern towards the cylinders)
      const manifoldOutStub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.08, 10),
        copperPipeMat
      );
      manifoldOutStub.rotation.z = Math.PI / 2;
      manifoldOutStub.position.set(0.295, 0.28, manifoldZ);
      coldBoosterGroup.add(manifoldOutStub);

      const deliveryFrontRiser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.26, 10),
        copperPipeMat
      );
      deliveryFrontRiser.name = 'study.coldWaterBoosterTank.deliveryRiser';
      deliveryFrontRiser.position.set(sidePipeX, 0.41, manifoldZ);
      coldBoosterGroup.add(deliveryFrontRiser);

      const deliveryCornerElbow = new THREE.Mesh(
        new THREE.SphereGeometry(0.019, 12, 12),
        copperPipeMat
      );
      deliveryCornerElbow.position.set(sidePipeX, 0.28, manifoldZ);
      coldBoosterGroup.add(deliveryCornerElbow);

      // Blue quarter-turn lever isolation valve on the boosted cold delivery riser
      const mainColdValve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.021, 0.04, 12),
        brassMat
      );
      mainColdValve.position.set(sidePipeX, 0.41, manifoldZ);
      coldBoosterGroup.add(mainColdValve);

      const mainColdLever = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.052, 0.018),
        blueValveHandleMat
      );
      mainColdLever.position.set(sidePipeX + 0.022, 0.41, manifoldZ);
      coldBoosterGroup.add(mainColdLever);

      // Horizontal 28mm copper delivery run along the East side of the booster tank (z = +0.38m -> -0.27m at y = 0.54m)
      // teeing directly into the Boosted Cold Water Main Header on the North wall!
      addZBranchPipe(
        coldBoosterGroup,
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
      const accRiser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1.02, 10),
        copperPipeMat
      );
      accRiser.name = 'study.coldWaterBoosterTank.accumulatorRiser';
      accRiser.position.set(accX, 1.05, localWallZ);
      accRiser.castShadow = true;
      coldBoosterGroup.add(accRiser);

      const accTee = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.019, 0.036, 12),
        brassMat
      );
      accTee.rotation.z = Math.PI / 2;
      accTee.position.set(accX, 0.54, localWallZ);
      coldBoosterGroup.add(accTee);

      addZBranchPipe(
        coldBoosterGroup,
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
      const mainsRiser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1.4, 10),
        copperPipeMat
      );
      mainsRiser.name = 'study.coldWaterBoosterTank.mainsRisingMain';
      mainsRiser.position.set(mainsX, 0.7, localWallZ);
      coldBoosterGroup.add(mainsRiser);

      const doubleCheckValve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.085, 12),
        brassMat
      );
      doubleCheckValve.position.set(mainsX, 0.96, localWallZ);
      coldBoosterGroup.add(doubleCheckValve);

      addZBranchPipe(
        coldBoosterGroup,
        mainsX,
        1.4,
        -0.18,
        localWallZ,
        0.012,
        copperPipeMat,
        false
      );

      // Main 450L Insulated Potable GRP Cold Water Storage Cistern (Y = 0.34m..1.48m)
      const cisternBody = new THREE.Mesh(
        new THREE.BoxGeometry(tankW, cisternH, tankD),
        coldTankGrpMat
      );
      cisternBody.name = 'study.coldWaterBoosterTank.cistern';
      cisternBody.position.set(0, plinthH + cisternH * 0.5, 0);
      cisternBody.castShadow = true;
      cisternBody.receiveShadow = true;
      coldBoosterGroup.add(cisternBody);

      // Moulded structural reinforcing ribs around the GRP cold water tank
      for (const ribY of [0.62, 0.92, 1.22] as const) {
        const rib = new THREE.Mesh(
          new THREE.BoxGeometry(tankW + 0.016, 0.028, tankD + 0.016),
          coldTankGrpMat
        );
        rib.position.set(0, ribY, 0);
        coldBoosterGroup.add(rib);
      }

      // Top Raised Hygiene Inspection Lid & Type-AB Air-Gap Screened Weir Overflow Housing (Y = 1.48m..1.60m)
      const topLid = new THREE.Mesh(
        new THREE.BoxGeometry(tankW + 0.02, 0.04, tankD + 0.02),
        coldTankTrimMat
      );
      topLid.name = 'study.coldWaterBoosterTank.topLid';
      topLid.position.set(0, plinthH + cisternH + 0.02, 0);
      topLid.castShadow = true;
      coldBoosterGroup.add(topLid);

      const inspectionTurret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.15, 0.09, 20),
        coldTankTrimMat
      );
      inspectionTurret.position.set(-0.11, plinthH + cisternH + 0.08, 0.04);
      coldBoosterGroup.add(inspectionTurret);

      // Top-mounted Blue Potable Pressure Accumulator Vessel (60L diaphragm vessel, Ø0.27m x 0.44m tall)
      // seated on a brass flanged throat collar connected to the accumulator charge pipe at Y = 1.54m!
      const accThroatCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.048, 0.06, 16),
        brassMat
      );
      accThroatCollar.position.set(accX, plinthH + cisternH + 0.05, accZ);
      coldBoosterGroup.add(accThroatCollar);

      const accumulatorVessel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.135, 0.135, 0.42, 22),
        accumulatorBlueMat
      );
      accumulatorVessel.name = 'study.coldWaterBoosterTank.accumulatorVessel';
      accumulatorVessel.position.set(accX, plinthH + cisternH + 0.27, accZ);
      accumulatorVessel.castShadow = true;
      accumulatorVessel.receiveShadow = true;
      coldBoosterGroup.add(accumulatorVessel);

      const accumulatorDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.135, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        accumulatorBlueMat
      );
      accumulatorDome.scale.set(1, 0.45, 1);
      accumulatorDome.position.set(accX, plinthH + cisternH + 0.48, accZ);
      coldBoosterGroup.add(accumulatorDome);

      // Front WRAS Potable Cold Water Storage & Booster Data Plaque
      const wrasPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.14, 0.008),
        viessmannWhiteMat
      );
      wrasPlaque.position.set(0, 1.08, tankD * 0.5 + 0.006);
      coldBoosterGroup.add(wrasPlaque);

      heatingPlantGroup.add(coldBoosterGroup);
    }

    scene.add(heatingPlantGroup);
  }
}
