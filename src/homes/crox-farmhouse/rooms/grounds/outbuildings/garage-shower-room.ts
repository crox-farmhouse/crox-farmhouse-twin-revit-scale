import * as THREE from 'three';
import { buildMitredArchitraveSegments } from '../../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import { createGymMirrorGlassTexture } from './gym-mirrors-and-lighting.ts';

/**
 * Generates a large-format Calacatta Gold & Honed Limestone porcelain tile texture (`512x512`)
 * with warm alabaster stone veins and fine grout lines for the Garage/Gym Shower Room & WC.
 */
let cachedShowerRoomCalacattaTileTexture: THREE.CanvasTexture | null = null;

export function createShowerRoomCalacattaTileTexture(): THREE.CanvasTexture {
  if (cachedShowerRoomCalacattaTileTexture) {
    return cachedShowerRoomCalacattaTileTexture;
  }
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, size, size);

  // Subtle marble veining across each 256x256 tile
  for (let v = 0; v < 26; v++) {
    const x0 = ((v * 97) % size);
    const y0 = ((v * 53) % size);
    ctx.strokeStyle =
      v % 3 === 0 ? 'rgba(182, 162, 134, 0.22)' : 'rgba(145, 148, 154, 0.18)';
    ctx.lineWidth = 1.2 + (v % 3) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(
      x0 + 64,
      y0 + 28,
      x0 + 112,
      y0 - 24,
      x0 + 178,
      y0 + 42
    );
    ctx.stroke();
  }

  // 2x2 large-format porcelain tile grout grid
  ctx.strokeStyle = 'rgba(168, 160, 148, 0.55)';
  ctx.lineWidth = 3;
  for (const g of [0, 256]) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(size, g);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  cachedShowerRoomCalacattaTileTexture = tex;
  return tex;
}

/**
 * Issue #1 ("We need to fit a small shower room and toilet in this back corner."
 * at `[-13.364, -0.5, 19.781]` -> Outbuilding `(u = 8.74m, y = -0.50m, v = 4.56m)`) &
 * Issue #5 ("Entrance to shower room ideally from both gym and garage, or just from 1"
 * at `[-15.934, -0.5, 19.899]` -> Outbuilding `(u = 6.17m, y = -0.50m, v = 4.46m)`):
 *
 * Builds the **Small Shower Room & Toilet (`outbuildings.garage.showerRoom`)** in the South-West back corner
 * of the Garage (`u = 5.97m..8.92m, v = 3.85m..5.43m`, `2.95m` wide x `1.58m` deep) with **dual entrances from
 * BOTH the Gym AND the Garage**:
 * 1. **Gym Entrance Door (`outbuildings.garage.showerRoom.gymDoor`, `u = 5.77..5.97m, v = 4.18..4.94m`)**:
 *    4-panel solid European oak door with oak step threshold (`gymFloorY = -0.588m` -> `garageFloorTopY = -0.50m`),
 *    brushed-brass lever handles, privacy thumbturn, and interactive hinge (`ctx.interactions.registerHingedDoor`).
 * 2. **Garage Entrance Door (`outbuildings.garage.showerRoom.garageDoor`, `v = 3.85..3.97m, u = 6.07..6.83m`)**:
 *    4-panel solid European oak door on the West side of the Shower Room North wall (`v = 3.85m`, clear to the West
 *    of the moved `southWing` cabinet at `u = 6.91..8.85m`), with interactive hinge (`ctx.interactions.registerHingedDoor`).
 * 3. **Partition Walls (`v = 3.85..3.97m` North wall & `u = 8.80..8.92m` East wall) + Cutaway Ceiling Lid**:
 *    Full-height (`y = -0.50m..1.94m`) insulated stud partition walls on `groundGroup` (so they stay at full height
 *    in cutaway mode and back the moved `southWing` cabinet & 32" monitor!) + a cutaway-aware ceiling lid with
 *    recessed LED downlights & extractor fan on `groundCeilingGroup`.
 * 4. **Interior Fixtures**:
 *    - Honed stone-tiled floor slab (`u = 5.97..8.80m, v = 3.97..5.43m, y = -0.492m`),
 *    - **Walk-In Wet-Room Shower (`outbuildings.garage.showerRoom.shower`, `u = 7.92..8.80m, v = 3.97..5.43m`)**
 *      in the East bay right at Issue #1's hit point `(u = 8.74m, v = 4.56m)`: low-profile stone-resin tray with
 *      brushed-brass linear drain, full-height Calacatta marble wall tiling, frameless 10mm glass screen (`u = 7.92m,
 *      v = 3.97..4.82m`), 300mm brushed-brass overhead rainfall shower head, thermostatic mixer & hand wand, and
 *      recessed illuminated bottle niche,
 *    - **Wall-Hung Rimless Ceramic Toilet & Concealed Cistern (`outbuildings.garage.showerRoom.toilet`)** on the
 *      South wall (`u = 7.42m, v = 5.42m`, facing North `-v`) with oak cistern shelf & brass dual-flush plate,
 *    - **Fluted-Oak & Carrara-Marble Vanity Basin + Backlit Round Brass Mirror (`outbuildings.garage.showerRoom.vanity`)**
 *      on the North wall (`u = 7.38m, v = 3.97m`, facing South `+v`),
 *    - **Brushed-Brass Heated Ladder Towel Rail (`outbuildings.garage.showerRoom.heatedTowelRail`)** on the South-West
 *      wall (`u = 6.45m, v = 5.39m`).
 */
export function buildGarageShowerRoom(
  ctx: SceneBuilderContext,
  groundGroup: THREE.Group,
  groundCeilingGroup: THREE.Group,
  garageFloorTopY: number,
  gymFloorY: number,
  eaveTopY: number
): void {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'outbuildings.garage.showerRoom';
  roomGroup.userData.zone = 'study';
  groundGroup.add(roomGroup);

  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede2,
    roughness: 0.84,
    metalness: 0.02,
  });
  const calacattaTileMat = new THREE.MeshStandardMaterial({
    map: createShowerRoomCalacattaTileTexture(),
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.05,
  });
  const floorStoneTileMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c4,
    roughness: 0.48,
    metalness: 0.04,
  });
  const lightOakDoorMat = new THREE.MeshStandardMaterial({
    color: 0xc2986b,
    roughness: 0.42,
    metalness: 0.04,
  });
  const darkOakRecessMat = new THREE.MeshStandardMaterial({
    color: 0xa87e51,
    roughness: 0.46,
    metalness: 0.04,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a464,
    roughness: 0.24,
    metalness: 0.86,
  });
  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.14,
    metalness: 0.06,
  });
  const showerGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdcf2f9,
    roughness: 0.05,
    metalness: 0.12,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
  });
  const mirrorSilverMat = new THREE.MeshStandardMaterial({
    map: createGymMirrorGlassTexture(),
    color: 0xeef5fc,
    roughness: 0.03,
    metalness: 0.94,
  });
  const warmDownlightLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: new THREE.Color(0xffc878),
    emissiveIntensity: 2.6,
    roughness: 0.15,
  });

  const uMin = 5.97;
  const uEastInner = 8.8;
  const uMax = 8.92; // 0.12m thick East partition wall
  const vNorthOuter = 3.85;
  const vNorthInner = 3.97; // 0.12m thick North partition wall
  const vSouthInner = 5.43;
  const partWallT = 0.12;
  const wallH = eaveTopY - garageFloorTopY; // 2.44m (-0.50m to +1.94m)
  const wallMidY = garageFloorTopY + wallH * 0.5;
  const doorOpeningH = 1.98;
  // ---------------------------------------------------------------------------
  // 1. Shower Room Partition Walls (`groundGroup`, full height to `eaveTopY = 1.94m`)
  //    Issue #4 ("This layout feels very tight, maybe remove the garage entrance to make it better"
  //    at `[-14.835, -0.492, 20.209]`, `outbuildings.garage.showerRoom.tiledFloor`):
  //    Removed the Garage-side doorway on the North wall so the North partition wall (`v = 3.85..3.97m`)
  //    is a continuous, solid full-height wall across `u = 5.97..8.92m`, freeing the entire North-West
  //    interior wall for a spacious staggered Vanity + Toilet + Walk-In Shower layout accessed from the Gym!
  // ---------------------------------------------------------------------------
  const northMainSpanU = uMax - uMin; // 2.95m (`u = 5.97..8.92m`)
  const northMainWall = new THREE.Mesh(
    new THREE.BoxGeometry(northMainSpanU - 0.008, wallH - 0.008, partWallT),
    wallPlasterMat
  );
  northMainWall.name = 'outbuildings.garage.showerRoom.northWall';
  northMainWall.userData.isArchitecturalShell = true;
  northMainWall.position.set(uMin + northMainSpanU * 0.5, wallMidY, (vNorthOuter + vNorthInner) * 0.5);
  northMainWall.castShadow = true;
  northMainWall.receiveShadow = true;
  roomGroup.add(northMainWall);

  // 1B. East Partition Wall (`u = 8.80..8.92m, v = 3.974..5.246m`, meeting the Garage South brick pilaster cleanly)
  const eastWallSouthV = vSouthInner - 0.184;
  const eastWallSpanV = eastWallSouthV - (vNorthInner + 0.004);
  const eastWallMidV = (vNorthInner + 0.004 + eastWallSouthV) * 0.5;
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(partWallT, wallH - 0.016, eastWallSpanV),
    wallPlasterMat
  );
  eastWall.name = 'outbuildings.garage.showerRoom.eastWall';
  eastWall.userData.isArchitecturalShell = true;
  eastWall.position.set((uEastInner + uMax) * 0.5, wallMidY - 0.004, eastWallMidV);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  roomGroup.add(eastWall);

  // 60mm Wood-Fibre Thermal & Acoustic Insulation Core inside the Shower Room North & East Partition Walls facing the unheated Garage
  const showerIwiMat = new THREE.MeshStandardMaterial({
    color: 0xc89e65,
    roughness: 0.92,
    metalness: 0.01,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const northWallIwi = new THREE.Mesh(
    new THREE.BoxGeometry(northMainSpanU - 0.03, wallH - 0.024, 0.06),
    showerIwiMat
  );
  northWallIwi.name = 'outbuildings.garage.showerRoom.northWall.woodFibreInsulation';
  northWallIwi.userData.isArchitecturalShell = true;
  northWallIwi.position.set(uMin + northMainSpanU * 0.5, wallMidY, (vNorthOuter + vNorthInner) * 0.5);
  roomGroup.add(northWallIwi);

  const eastWallIwi = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, wallH - 0.028, eastWallSpanV - 0.024),
    showerIwiMat
  );
  eastWallIwi.name = 'outbuildings.garage.showerRoom.eastWall.woodFibreInsulation';
  eastWallIwi.userData.isArchitecturalShell = true;
  eastWallIwi.position.set((uEastInner + uMax) * 0.5, wallMidY - 0.004, eastWallMidV);
  roomGroup.add(eastWallIwi);

  // 1C. Interior Calacatta Marble Porcelain Tile Wall Linings (`y = -0.49..1.87m`, clear of ceilingLid)
  const tileWallH = wallH - 0.08;
  const tileWallMidY = garageFloorTopY + 0.01 + tileWallH * 0.5;

  // North interior tiled lining across the full 2.815m interior North wall (`u = 5.98..8.795m`)
  const northTileLining = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, tileWallH, 0.008),
    calacattaTileMat
  );
  northTileLining.name = 'outbuildings.garage.showerRoom.northTileWall';
  northTileLining.position.set(7.382, tileWallMidY, vNorthInner + 0.0085);
  northTileLining.receiveShadow = true;
  roomGroup.add(northTileLining);

  // East interior tiled lining (`u = 8.7915m, v = 3.985..5.265m`, stopping cleanly at the South brick pilaster)
  const eastTileLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, tileWallH, 1.28),
    calacattaTileMat
  );
  eastTileLining.name = 'outbuildings.garage.showerRoom.eastTileWall';
  eastTileLining.position.set(uEastInner - 0.0085, tileWallMidY, 4.625);
  eastTileLining.receiveShadow = true;
  roomGroup.add(eastTileLining);

  // South interior tiled lining (`u = 5.98..8.705m`, stopping 5mm West of the `u = 8.71m` South brick pilaster)
  const southTileLining = new THREE.Mesh(
    new THREE.BoxGeometry(2.725, tileWallH, 0.008),
    calacattaTileMat
  );
  southTileLining.name = 'outbuildings.garage.showerRoom.southTileWall';
  southTileLining.position.set(7.3425, tileWallMidY, vSouthInner - 0.009);
  southTileLining.receiveShadow = true;
  roomGroup.add(southTileLining);

  // ---------------------------------------------------------------------------
  // 2. Honed Travertine / Limestone Tiled Floor Slab (`outbuildings.garage.showerRoom.tiledFloor`)
  // ---------------------------------------------------------------------------
  const floorW = uEastInner - uMin - 0.012;
  const floorD = vSouthInner - vNorthInner - 0.012;
  const floorSlab = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.004, floorD),
    floorStoneTileMat
  );
  floorSlab.name = 'outbuildings.garage.showerRoom.tiledFloor';
  floorSlab.position.set(uMin + (uEastInner - uMin) * 0.5, garageFloorTopY + 0.006, vNorthInner + (vSouthInner - vNorthInner) * 0.5);
  floorSlab.receiveShadow = true;
  roomGroup.add(floorSlab);

  // ---------------------------------------------------------------------------
  // 3. Helper to Build Interactive 4-Panel Solid European Oak Doors (Gym Entrance & Garage Entrance)
  // ---------------------------------------------------------------------------
  const buildOakShowerDoor = (
    doorGroupName: string,
    frameCenterU: number,
    frameCenterV: number,
    frameDepthT: number,
    openingW: number,
    axis: 'u' | 'v', // 'v' = wall runs along V (Gym-to-Shower door at u = 5.87m), 'u' = wall runs along U (Garage-to-Shower door at v = 3.91m)
    hingeSign: 1 | -1,
    openAngle: number
  ): void => {
    const dAssy = new THREE.Group();
    dAssy.name = `${doorGroupName}Frame`;
    dAssy.position.set(frameCenterU, garageFloorTopY, frameCenterV);
    if (axis === 'u') {
      dAssy.rotation.y = Math.PI / 2; // Rotate so local X is across wall thickness and local Z is along opening width!
    }
    roomGroup.add(dAssy);

    const jambT = 0.028;
    const archW = 0.056;

    // Jambs & Head Lining
    for (const sideZ of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepthT + 0.008, doorOpeningH, jambT),
        lightOakDoorMat
      );
      jamb.name = `${doorGroupName}.jamb.${sideZ < 0 ? 'north' : 'south'}`;
      jamb.position.set(0, doorOpeningH * 0.5, sideZ * (openingW * 0.5 - jambT * 0.5));
      dAssy.add(jamb);
    }
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(frameDepthT + 0.008, jambT, openingW - jambT * 2 - 0.008),
      lightOakDoorMat
    );
    head.name = `${doorGroupName}.headLining`;
    head.position.set(0, doorOpeningH - jambT * 0.5, 0);
    dAssy.add(head);

    // 45°-Mitred Ogee/Torus Profiled Architraves on both faces
    for (const faceX of [-1, 1] as const) {
      const faceTag = faceX < 0 ? 'outer' : 'inner';
      const [northLegGeo, headGeo, southLegGeo] = buildMitredArchitraveSegments(
        -(openingW * 0.5 - 0.01),
        openingW * 0.5 - 0.01,
        0,
        0,
        doorOpeningH - 0.005,
        'z',
        faceX * (frameDepthT * 0.5 + 0.005),
        faceX,
        archW,
        0.020
      );
      const northLeg = new THREE.Mesh(northLegGeo, darkOakRecessMat);
      northLeg.name = `${doorGroupName}.architraveLeg.${faceTag}.north`;
      northLeg.castShadow = true;
      dAssy.add(northLeg);

      const southLeg = new THREE.Mesh(southLegGeo, darkOakRecessMat);
      southLeg.name = `${doorGroupName}.architraveLeg.${faceTag}.south`;
      southLeg.castShadow = true;
      dAssy.add(southLeg);

      const topArch = new THREE.Mesh(headGeo, darkOakRecessMat);
      topArch.name = `${doorGroupName}.architraveHeader.${faceTag}`;
      topArch.castShadow = true;
      dAssy.add(topArch);
    }

    // Interactive 4-Panel Solid Oak Door Leaf
    const leafW = openingW - jambT * 2 - 0.006; // 0.698m
    const leafH = doorOpeningH - jambT - 0.012; // 1.94m
    const leafT = 0.042;
    const hingeZ = hingeSign * (leafW * 0.5);

    const leafPivot = new THREE.Group();
    leafPivot.name = doorGroupName;
    leafPivot.position.set(0, 0.008 + leafH * 0.5, hingeZ);
    dAssy.add(leafPivot);

    const leafCenterZ = -hingeSign * (leafW * 0.5);
    const leafCore = new THREE.Mesh(
      new THREE.BoxGeometry(leafT - 0.012, leafH - 0.04, leafW - 0.04),
      darkOakRecessMat
    );
    leafCore.name = doorGroupName;
    leafCore.position.set(0, 0, leafCenterZ);
    leafCore.castShadow = true;
    leafCore.receiveShadow = true;
    leafPivot.add(leafCore);

    const stileW = 0.095;
    for (const sz of [-leafW * 0.5 + stileW * 0.5, leafW * 0.5 - stileW * 0.5] as const) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, leafH, stileW),
        lightOakDoorMat
      );
      stile.name = `${doorGroupName}.stile.${sz < 0 ? 'left' : 'right'}`;
      stile.position.set(0, 0, leafCenterZ + sz);
      stile.castShadow = true;
      leafPivot.add(stile);
    }
    let railIdx = 0;
    for (const [ry, rh] of [
      [-leafH * 0.5 + 0.09, 0.18],
      [-0.12, 0.13],
      [leafH * 0.5 - 0.06, 0.12],
    ] as const) {
      railIdx++;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, rh, leafW - stileW * 2),
        lightOakDoorMat
      );
      rail.name = `${doorGroupName}.rail.${railIdx}`;
      rail.position.set(0, ry, leafCenterZ);
      leafPivot.add(rail);
    }

    // Brushed-brass lever handles & bathroom privacy thumbturn rose on both faces
    const handleZ = leafCenterZ - hingeSign * (leafW * 0.5 - 0.055);
    for (const faceX of [-1, 1] as const) {
      const faceTag = faceX < 0 ? 'outer' : 'inner';
      const rose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.008, 16),
        brushedBrassMat
      );
      rose.name = `${doorGroupName}.handleRose.${faceTag}`;
      rose.userData.lodTier = 'high';
      rose.userData.lodMaxDistance = 12;
      rose.rotation.z = Math.PI / 2;
      rose.position.set(faceX * (leafT * 0.5 + 0.004), -0.05, handleZ);
      leafPivot.add(rose);

      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.016, 0.115),
        brushedBrassMat
      );
      lever.name = `${doorGroupName}.leverHandle.${faceTag}`;
      lever.userData.lodTier = 'high';
      lever.userData.lodMaxDistance = 12;
      lever.position.set(
        faceX * (leafT * 0.5 + 0.038),
        -0.05,
        handleZ + hingeSign * 0.042
      );
      leafPivot.add(lever);

      const thumbRose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.008, 14),
        brushedBrassMat
      );
      thumbRose.name = `${doorGroupName}.privacyThumbturn.${faceTag}`;
      thumbRose.userData.lodTier = 'high';
      thumbRose.userData.lodMaxDistance = 12;
      thumbRose.rotation.z = Math.PI / 2;
      thumbRose.position.set(faceX * (leafT * 0.5 + 0.004), -0.14, handleZ);
      leafPivot.add(thumbRose);
    }

    ctx.interactions.registerHingedDoor(
      dAssy,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      openAngle
    );
  };

  // Entrance #1: Gym-to-Shower-Room Door (`u = 5.87m, v = 4.18..4.94m`, width `0.76m`) + Solid Oak Threshold Step
  const gymStepH = garageFloorTopY - gymFloorY; // ~0.088m
  const gymThreshold = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, Math.max(0.02, gymStepH - 0.008), 0.74),
    lightOakDoorMat
  );
  gymThreshold.name = 'outbuildings.garage.showerRoom.gymThreshold';
  gymThreshold.position.set(5.865, gymFloorY + 0.004 + Math.max(0.02, gymStepH - 0.008) * 0.5, 4.56);
  gymThreshold.receiveShadow = true;
  roomGroup.add(gymThreshold);

  // Single Gym-to-Shower-Room Entrance Door (`u = 5.87m, v = 4.18..4.94m`, width `0.76m`),
  // hinged on the South jamb so it opens cleanly without crowding the interior vanity!
  buildOakShowerDoor(
    'outbuildings.garage.showerRoom.gymDoor',
    5.87,
    4.56,
    0.2,
    0.76,
    'v',
    1,
    Math.PI * 0.46
  );

  // ---------------------------------------------------------------------------
  // 4. Walk-In Wet-Room Shower Enclosure (`outbuildings.garage.showerRoom.shower`, `u = 7.92..8.80m, v = 3.97..5.43m`)
  //    Issue #1 ("Flip the shower entry around, improve the mesh of this toilet / shower fixture"
  //    at `[-14.615, -0.064, 20.352]`, `outbuildings.garage.showerRoom.toilet.seat`):
  //    - Flipped the frameless walk-in glass screen (`screenSpanV = 0.84m`), wall channel, floor channel,
  //      and overhead stabilizer bar to the **South half (`z = -0.13m .. +0.71m`, anchored to the South wall
  //      at `z = +halfD - 0.01 = +0.71m`)**, leaving the **North half (`z = -0.73m .. -0.13m`, `v = 3.97..4.57m`)**
  //      wide open as the walk-in shower entry — directly aligned with the Gym door (`v = 4.18..4.94m`) and
  //      completely clear of the Toilet (`u = 7.56m, v = 4.74..5.42m`)!
  //    - Mirrored the deluge rainfall head, thermostatic mixer, and linear drain to the sheltered South zone
  //      (`z = +0.22m`), with the adjustable hand-shower slide rail (`z = -0.04m`), catenary braided brass hose,
  //      and recessed illuminated niche (`z = -0.32m`) with 3 amber apothecary pump bottles on the East wall.
  // ---------------------------------------------------------------------------
  const showerGroup = new THREE.Group();
  showerGroup.name = 'outbuildings.garage.showerRoom.shower';
  showerGroup.position.set(8.36, garageFloorTopY + 0.008, 4.7);
  roomGroup.add(showerGroup);

  const halfD = 0.72;
  const darkGunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x262a30,
    roughness: 0.34,
    metalness: 0.78,
  });
  const amberGlassMat = new THREE.MeshStandardMaterial({
    color: 0x8d4014,
    roughness: 0.14,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
  });
  const frostedHolderGlassMat = new THREE.MeshStandardMaterial({
    color: 0xeef5f8,
    roughness: 0.38,
    metalness: 0.05,
    transparent: true,
    opacity: 0.78,
  });
  const waterSurfaceMat = new THREE.MeshStandardMaterial({
    color: 0xd4eef7,
    roughness: 0.06,
    metalness: 0.12,
    transparent: true,
    opacity: 0.76,
  });

  // Low-profile honed stone-resin wet-room tray (`0.84m x 1.41m`, clear of floorSlab & tile walls)
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.02, 1.41),
    ceramicWhiteMat
  );
  showerTray.name = 'outbuildings.garage.showerRoom.shower.tray';
  showerTray.position.set(-0.004, 0.016, 0);
  showerTray.receiveShadow = true;
  showerGroup.add(showerTray);

  // Frameless 10mm Low-Iron Toughened Glass Walk-In Shower Screen anchored to the SOUTH Wall (`z = +0.71m`)
  // Spans `z = -0.13m .. +0.684m` (clear of wallChannel), leaving the North half (`z = -0.73m .. -0.13m`) open!
  const screenSpanV = 0.84;
  const screenH = 2.0;
  const screenGlassSpanV = screenSpanV - 0.026;
  const screenCenterZ = halfD - 0.036 - screenGlassSpanV * 0.5;
  const showerScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, screenH - 0.04, screenGlassSpanV),
    showerGlassMat
  );
  showerScreen.name = 'outbuildings.garage.showerRoom.showerScreen';
  showerScreen.position.set(-0.43, 0.048 + (screenH - 0.04) * 0.5, screenCenterZ);
  showerGroup.add(showerScreen);

  // Slim Brushed-Brass U-Channel Wall Profile (on South wall `z = +halfD - 0.022`), Floor Profile & Overhead Support Bar (`z = -0.09m`)
  const wallChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, screenH - 0.02, 0.022),
    brushedBrassMat
  );
  wallChannel.name = 'outbuildings.garage.showerRoom.shower.glassScreen';
  wallChannel.position.set(-0.43, 0.048 + (screenH - 0.02) * 0.5, halfD - 0.022);
  showerGroup.add(wallChannel);

  const floorChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.014, screenSpanV - 0.02),
    brushedBrassMat
  );
  floorChannel.name = 'outbuildings.garage.showerRoom.shower.floorChannel';
  floorChannel.position.set(-0.43, 0.037, halfD - 0.02 - (screenSpanV - 0.02) * 0.5);
  showerGroup.add(floorChannel);

  const supportArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.84, 14),
    brushedBrassMat
  );
  supportArm.name = 'outbuildings.garage.showerRoom.shower.stabilizerBar';
  supportArm.rotation.z = Math.PI / 2;
  supportArm.position.set(-0.005, screenH - 0.04, halfD - 0.01 - screenSpanV + 0.04);
  showerGroup.add(supportArm);

  // High-LOD Brushed-Brass Shower Fixture Assembly (`outbuildings.garage.showerRoom.showerFixture`)
  const showerFixtureGroup = new THREE.Group();
  showerFixtureGroup.name = 'outbuildings.garage.showerRoom.showerFixture';
  showerGroup.add(showerFixtureGroup);

  // 4A. Slotted Brushed-Brass Linear Floor Drain Channel (`0.065m x 0.004m x 0.68m`) in the sheltered South zone (`z = +0.22m`)
  const drainTrough = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.003, 0.69),
    darkGunmetalMat
  );
  drainTrough.name = 'outbuildings.garage.showerRoom.showerFixture.drainTrough';
  drainTrough.position.set(0.32, 0.0315, 0.22);
  showerFixtureGroup.add(drainTrough);

  const linearDrain = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.003, 0.67),
    brushedBrassMat
  );
  linearDrain.name = 'outbuildings.garage.showerRoom.showerFixture.linearDrainGrate';
  linearDrain.position.set(0.32, 0.0385, 0.22);
  showerFixtureGroup.add(linearDrain);

  let drainSlotIdx = 0;
  for (const sx of [-0.016, 0, 0.016] as const) {
    drainSlotIdx++;
    const drainSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.002, 0.62),
      darkGunmetalMat
    );
    drainSlot.name = `outbuildings.garage.showerRoom.showerFixture.drainSlot.${drainSlotIdx}`;
    drainSlot.userData.lodTier = 'high';
    drainSlot.userData.lodMaxDistance = 12;
    drainSlot.position.set(0.32 + sx, 0.045, 0.22);
    showerFixtureGroup.add(drainSlot);
  }

  // 4B. Concealed Thermostatic Mixer Valve Backplate, Knurled Dials & Diverter Button (`z = +0.22m`)
  const mixerBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.24, 0.12),
    darkGunmetalMat
  );
  mixerBezel.name = 'outbuildings.garage.showerRoom.showerFixture.mixerBezel';
  mixerBezel.position.set(0.421, 1.12, 0.22);
  showerFixtureGroup.add(mixerBezel);

  const mixerPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.225, 0.108),
    brushedBrassMat
  );
  mixerPlate.name = 'outbuildings.garage.showerRoom.showerFixture.mixerBackplate';
  mixerPlate.position.set(0.411, 1.12, 0.22);
  showerFixtureGroup.add(mixerPlate);

  for (const dy of [-0.06, 0.06] as const) {
    const dialRole = dy < 0 ? 'temperature' : 'flow';
    const indexRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.004, 20),
      darkGunmetalMat
    );
    indexRing.name = `outbuildings.garage.showerRoom.showerFixture.mixerIndexRing.${dialRole}`;
    indexRing.userData.lodTier = 'high';
    indexRing.userData.lodMaxDistance = 12;
    indexRing.rotation.z = Math.PI / 2;
    indexRing.position.set(0.401, 1.12 + dy, 0.22);
    showerFixtureGroup.add(indexRing);

    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.034, 20),
      brushedBrassMat
    );
    dial.name = `outbuildings.garage.showerRoom.showerFixture.mixerDial.${dialRole}`;
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.378, 1.12 + dy, 0.22);
    showerFixtureGroup.add(dial);

    const dialPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.026, 10),
      brushedBrassMat
    );
    dialPin.name = `outbuildings.garage.showerRoom.showerFixture.mixerDialPin.${dialRole}`;
    dialPin.userData.lodTier = 'high';
    dialPin.userData.lodMaxDistance = 12;
    dialPin.position.set(0.396, 1.12 + dy + 0.022, 0.22);
    showerFixtureGroup.add(dialPin);
  }

  // Central push-button diverter between temperature and flow dials
  const diverterButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.022, 16),
    brushedBrassMat
  );
  diverterButton.name = 'outbuildings.garage.showerRoom.showerFixture.diverterButton';
  diverterButton.userData.lodTier = 'high';
  diverterButton.userData.lodMaxDistance = 12;
  diverterButton.rotation.z = Math.PI / 2;
  diverterButton.position.set(0.414, 1.12, 0.22);
  showerFixtureGroup.add(diverterButton);

  // 4C. Exposed Vertical Brass Riser Pipe (`y = 1.12..2.06m, z = +0.22m`), Elbow & Overhead Deluge Arm
  const riserPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.94, 16),
    brushedBrassMat
  );
  riserPipe.name = 'outbuildings.garage.showerRoom.showerFixture.riserPipe';
  riserPipe.position.set(0.412, 1.59, 0.22);
  showerFixtureGroup.add(riserPipe);

  for (const wy of [1.34, 1.88] as const) {
    const wallStandoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.036, 12),
      brushedBrassMat
    );
    wallStandoff.name = `outbuildings.garage.showerRoom.showerFixture.riserStandoff.${wy < 1.6 ? 'lower' : 'upper'}`;
    wallStandoff.userData.lodTier = 'high';
    wallStandoff.userData.lodMaxDistance = 12;
    wallStandoff.rotation.z = Math.PI / 2;
    wallStandoff.position.set(0.422, wy, 0.22);
    showerFixtureGroup.add(wallStandoff);
  }

  const showerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.42, 16),
    brushedBrassMat
  );
  showerArm.name = 'outbuildings.garage.showerRoom.showerFixture.overheadDelugeArm';
  showerArm.rotation.z = Math.PI / 2;
  showerArm.position.set(0.21, 2.06, 0.22);
  showerFixtureGroup.add(showerArm);

  const armWallFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.012, 18),
    brushedBrassMat
  );
  armWallFlange.name = 'outbuildings.garage.showerRoom.showerFixture.overheadArmWallFlange';
  armWallFlange.userData.lodTier = 'high';
  armWallFlange.userData.lodMaxDistance = 12;
  armWallFlange.rotation.z = Math.PI / 2;
  armWallFlange.position.set(0.424, 2.06, 0.22);
  showerFixtureGroup.add(armWallFlange);

  // 4D. Ultra-Slim 300mm (`r = 0.15m`) Deluge Rainfall Rose with Ball-Joint Boss & Concentric Nozzle Rings (`z = +0.22m`)
  const swivelBoss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.028, 0.032, 18),
    brushedBrassMat
  );
  swivelBoss.name = 'outbuildings.garage.showerRoom.showerFixture.rainfallSwivelBoss';
  swivelBoss.userData.lodTier = 'high';
  swivelBoss.userData.lodMaxDistance = 12;
  swivelBoss.position.set(0.01, 2.042, 0.22);
  showerFixtureGroup.add(swivelBoss);

  const rainfallRose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.012, 32),
    brushedBrassMat
  );
  rainfallRose.name = 'outbuildings.garage.showerRoom.rainfallHead';
  rainfallRose.position.set(0.01, 2.022, 0.22);
  rainfallRose.castShadow = true;
  showerFixtureGroup.add(rainfallRose);

  const nozzleFacePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.142, 0.142, 0.004, 32),
    darkGunmetalMat
  );
  nozzleFacePlate.name = 'outbuildings.garage.showerRoom.shower.rainfallHead';
  nozzleFacePlate.position.set(0.01, 2.015, 0.22);
  showerFixtureGroup.add(nozzleFacePlate);

  let nozzleRingIdx = 0;
  for (const nr of [0.042, 0.084, 0.124] as const) {
    nozzleRingIdx++;
    const nozzleRing = new THREE.Mesh(
      new THREE.TorusGeometry(nr, 0.0025, 8, 28),
      brushedBrassMat
    );
    nozzleRing.name = `outbuildings.garage.showerRoom.showerFixture.nozzleRing.${nozzleRingIdx}`;
    nozzleRing.userData.lodTier = 'high';
    nozzleRing.userData.lodMaxDistance = 12;
    nozzleRing.rotation.x = Math.PI / 2;
    nozzleRing.position.set(0.01, 2.013, 0.22);
    showerFixtureGroup.add(nozzleRing);
  }

  // 4E. Adjustable Brass Slide Rail (`z = -0.04m`), Microphone Hand Wand & Catenary Flexible Braided Hose (`TubeGeometry`)
  const riserRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.68, 14),
    brushedBrassMat
  );
  riserRail.name = 'outbuildings.garage.showerRoom.showerFixture.handWandSlideRail';
  riserRail.position.set(0.398, 1.38, -0.04);
  showerFixtureGroup.add(riserRail);

  for (const ry of [1.06, 1.70] as const) {
    const railPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.04, 12),
      brushedBrassMat
    );
    railPost.name = `outbuildings.garage.showerRoom.showerFixture.slideRailBracket.${ry < 1.3 ? 'lower' : 'upper'}`;
    railPost.userData.lodTier = 'high';
    railPost.userData.lodMaxDistance = 12;
    railPost.rotation.z = Math.PI / 2;
    railPost.position.set(0.415, ry, -0.04);
    showerFixtureGroup.add(railPost);
  }

  const sliderClamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.036, 0.044),
    brushedBrassMat
  );
  sliderClamp.name = 'outbuildings.garage.showerRoom.showerFixture.slideRailClamp';
  sliderClamp.userData.lodTier = 'high';
  sliderClamp.userData.lodMaxDistance = 12;
  sliderClamp.position.set(0.388, 1.42, -0.04);
  showerFixtureGroup.add(sliderClamp);

  const handWand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.21, 16),
    brushedBrassMat
  );
  handWand.name = 'outbuildings.garage.showerRoom.showerFixture.handShowerWand';
  handWand.rotation.z = 0.22;
  handWand.position.set(0.372, 1.48, -0.04);
  showerFixtureGroup.add(handWand);

  const wandNozzleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0142, 0.0142, 0.008, 16),
    darkGunmetalMat
  );
  wandNozzleCap.name = 'outbuildings.garage.showerRoom.showerFixture.handWandNozzleCap';
  wandNozzleCap.userData.lodTier = 'high';
  wandNozzleCap.userData.lodMaxDistance = 12;
  wandNozzleCap.rotation.z = 0.22;
  wandNozzleCap.position.set(0.35, 1.578, -0.04);
  showerFixtureGroup.add(wandNozzleCap);

  // Smooth 5-point catenary flexible braided-brass shower hose (`THREE.TubeGeometry`)
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.412, 1.01, 0.22),
    new THREE.Vector3(0.395, 0.82, 0.16),
    new THREE.Vector3(0.382, 0.74, 0.08),
    new THREE.Vector3(0.378, 0.96, 0.0),
    new THREE.Vector3(0.388, 1.37, -0.04),
  ]);
  const showerHoseGeo = new THREE.TubeGeometry(hoseCurve, 28, 0.0075, 10, false);
  showerHoseGeo.computeBoundingSphere();
  const showerHose = new THREE.Mesh(
    showerHoseGeo,
    brushedBrassMat
  );
  showerHose.name = 'outbuildings.garage.showerRoom.showerFixture.flexibleBraidedHose';
  showerFixtureGroup.add(showerHose);

  // 4F. Recessed Brass-Trimmed Illuminated Bottle Niche on East Shower Wall (`z = -0.32m, y = 1.22m`) + 3 Apothecary Pump Bottles
  const nicheBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.30, 0.42),
    darkGunmetalMat
  );
  nicheBack.name = 'outbuildings.garage.showerRoom.showerFixture.nicheBackplate';
  nicheBack.position.set(0.421, 1.22, -0.32);
  showerFixtureGroup.add(nicheBack);

  const nicheFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.32, 0.44),
    brushedBrassMat
  );
  nicheFrame.name = 'outbuildings.garage.showerRoom.showerFixture.nicheBrassTrim';
  nicheFrame.position.set(0.409, 1.22, -0.32);
  showerFixtureGroup.add(nicheFrame);

  const nicheLedStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.008, 0.40),
    warmDownlightLedMat
  );
  nicheLedStrip.name = 'outbuildings.garage.showerRoom.showerFixture.nicheLedStrip';
  nicheLedStrip.userData.lodTier = 'high';
  nicheLedStrip.userData.lodMaxDistance = 12;
  nicheLedStrip.position.set(0.395, 1.365, -0.32);
  showerFixtureGroup.add(nicheLedStrip);

  let bottleIdx = 0;
  for (const bz of [-0.43, -0.32, -0.21] as const) {
    bottleIdx++;
    const bottlePrefix = `outbuildings.garage.showerRoom.showerFixture.apothecaryBottle.${bottleIdx}`;
    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.125, 16),
      amberGlassMat
    );
    bottleBody.name = `${bottlePrefix}.body`;
    bottleBody.userData.lodTier = 'high';
    bottleBody.userData.lodMaxDistance = 12;
    bottleBody.position.set(0.365, 1.135, bz);
    showerFixtureGroup.add(bottleBody);

    const bottleLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0315, 0.0315, 0.058, 16),
      ceramicWhiteMat
    );
    bottleLabel.name = `${bottlePrefix}.label`;
    bottleLabel.userData.lodTier = 'high';
    bottleLabel.userData.lodMaxDistance = 12;
    bottleLabel.position.set(0.365, 1.132, bz);
    showerFixtureGroup.add(bottleLabel);

    const pumpCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.013, 0.028, 12),
      darkGunmetalMat
    );
    pumpCollar.name = `${bottlePrefix}.pumpCollar`;
    pumpCollar.userData.lodTier = 'high';
    pumpCollar.userData.lodMaxDistance = 12;
    pumpCollar.position.set(0.365, 1.215, bz);
    showerFixtureGroup.add(pumpCollar);

    const pumpSpout = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.006, 0.008),
      darkGunmetalMat
    );
    pumpSpout.name = `${bottlePrefix}.pumpSpout`;
    pumpSpout.userData.lodTier = 'high';
    pumpSpout.userData.lodMaxDistance = 12;
    pumpSpout.position.set(0.355, 1.233, bz);
    showerFixtureGroup.add(pumpSpout);
  }

  // ---------------------------------------------------------------------------
  // 5. High-LOD Wall-Hung Rimless D-Shaped Ceramic Toilet & Concealed Cistern (`outbuildings.garage.showerRoom.toilet`)
  //    Staggered along the South Wall (`u = 7.56m, v = 5.42m`, facing North `-v`, clear of the flipped shower entry!).
  // ---------------------------------------------------------------------------
  const toiletGroup = new THREE.Group();
  toiletGroup.name = 'outbuildings.garage.showerRoom.toilet';
  toiletGroup.position.set(7.56, garageFloorTopY + 0.012, vSouthInner - 0.01);
  toiletGroup.rotation.y = Math.PI; // Local `+z` projects North (`-v`) into the room!
  roomGroup.add(toiletGroup);

  // 5A. Half-height tiled concealed cistern boxing (`0.54m W x 1.08m H x 0.16m D`) + solid oak shelf + brass trim strip
  const cisternBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 1.08, 0.16),
    calacattaTileMat
  );
  cisternBox.name = 'outbuildings.garage.showerRoom.toilet.cisternBox';
  cisternBox.position.set(0, 0.54, 0.088);
  cisternBox.castShadow = true;
  cisternBox.receiveShadow = true;
  toiletGroup.add(cisternBox);

  const cisternBrassTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.546, 0.006, 0.166),
    brushedBrassMat
  );
  cisternBrassTrim.name = 'outbuildings.garage.showerRoom.toilet.cisternBrassTrim';
  cisternBrassTrim.position.set(0, 1.087, 0.09);
  toiletGroup.add(cisternBrassTrim);

  const cisternOakShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.026, 0.18),
    lightOakDoorMat
  );
  cisternOakShelf.name = 'outbuildings.garage.showerRoom.toilet.cisternOakShelf';
  cisternOakShelf.position.set(0, 1.107, 0.096);
  cisternOakShelf.castShadow = true;
  toiletGroup.add(cisternOakShelf);

  // 5B. Brushed-Brass Dual-Flush Actuator Plate (`0.22m x 0.145m`) with Bevelled Bezel & Tactile Circular Buttons
  const flushBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.228, 0.152, 0.004),
    darkGunmetalMat
  );
  flushBezel.name = 'outbuildings.garage.showerRoom.toilet.flushBezel';
  flushBezel.position.set(0, 0.94, 0.174);
  toiletGroup.add(flushBezel);

  const flushPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.218, 0.142, 0.006),
    brushedBrassMat
  );
  flushPlate.name = 'outbuildings.garage.showerRoom.toilet.flushPlate';
  flushPlate.position.set(0, 0.94, 0.183);
  toiletGroup.add(flushPlate);

  for (const [bx, br] of [
    [-0.038, 0.026],
    [0.038, 0.018],
  ] as const) {
    const flushMode = bx < 0 ? 'full' : 'half';
    const btnRecess = new THREE.Mesh(
      new THREE.CylinderGeometry(br + 0.003, br + 0.003, 0.004, 20),
      darkGunmetalMat
    );
    btnRecess.name = `outbuildings.garage.showerRoom.toilet.flushButtonRecess.${flushMode}`;
    btnRecess.userData.lodTier = 'high';
    btnRecess.userData.lodMaxDistance = 12;
    btnRecess.rotation.x = Math.PI / 2;
    btnRecess.position.set(bx, 0.94, 0.192);
    toiletGroup.add(btnRecess);

    const flushBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(br, br, 0.006, 20),
      brushedBrassMat
    );
    flushBtn.name = `outbuildings.garage.showerRoom.toilet.flushButton.${flushMode}`;
    flushBtn.userData.lodTier = 'high';
    flushBtn.userData.lodMaxDistance = 12;
    flushBtn.rotation.x = Math.PI / 2;
    flushBtn.position.set(bx, 0.94, 0.201);
    toiletGroup.add(flushBtn);
  }

  // 5C. Sculpted Multi-Part D-Shaped Wall-Hung Rimless Ceramic WC Pan (`outbuildings.garage.showerRoom.toilet.pan`)
  const toiletRearShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.31, 0.22),
    ceramicWhiteMat
  );
  toiletRearShroud.name = 'outbuildings.garage.showerRoom.toilet.rearShroud';
  toiletRearShroud.position.set(0, 0.245, 0.283);
  toiletRearShroud.castShadow = true;
  toiletRearShroud.receiveShadow = true;
  toiletGroup.add(toiletRearShroud);

  // Lower tapered ceramic trap skirt
  const lowerTrapSkirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.125, 0.27, 28),
    ceramicWhiteMat
  );
  lowerTrapSkirt.name = 'outbuildings.garage.showerRoom.toilet.lowerTrapSkirt';
  lowerTrapSkirt.scale.set(1.0, 1.0, 1.34);
  lowerTrapSkirt.position.set(0, 0.215, 0.43);
  lowerTrapSkirt.castShadow = true;
  lowerTrapSkirt.receiveShadow = true;
  toiletGroup.add(lowerTrapSkirt);

  // Upper rimless D-shaped ceramic bowl shell
  const toiletBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.188, 0.165, 0.14, 32),
    ceramicWhiteMat
  );
  toiletBowl.name = 'outbuildings.garage.showerRoom.toilet.pan';
  toiletBowl.scale.set(1.0, 1.0, 1.36);
  toiletBowl.position.set(0, 0.34, 0.44);
  toiletBowl.castShadow = true;
  toiletBowl.receiveShadow = true;
  toiletGroup.add(toiletBowl);

  // Molded rimless upper ceramic lip collar
  const bowlRimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.166, 0.022, 14, 32),
    ceramicWhiteMat
  );
  bowlRimTorus.name = 'outbuildings.garage.showerRoom.toilet.rimlessCollar';
  bowlRimTorus.rotation.x = Math.PI / 2;
  bowlRimTorus.scale.set(1.0, 1.36, 0.55);
  bowlRimTorus.position.set(0, 0.402, 0.44);
  toiletGroup.add(bowlRimTorus);

  // Recessed inner bowl cavity & translucent water surface disc (`y = 0.318m`)
  const innerBowlWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.146, 0.088, 0.125, 24),
    floorStoneTileMat
  );
  innerBowlWell.name = 'outbuildings.garage.showerRoom.toilet.innerBowlWell';
  innerBowlWell.scale.set(1.0, 1.0, 1.32);
  innerBowlWell.position.set(0, 0.342, 0.44);
  toiletGroup.add(innerBowlWell);

  const waterSurfaceDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.092, 0.092, 0.006, 24),
    waterSurfaceMat
  );
  waterSurfaceDisc.name = 'outbuildings.garage.showerRoom.toilet.waterSurface';
  waterSurfaceDisc.scale.set(1.0, 1.0, 1.28);
  waterSurfaceDisc.position.set(0, 0.318, 0.44);
  toiletGroup.add(waterSurfaceDisc);

  // Concealed wall-mounting side bolt caps in brushed brass
  for (const sx of [-0.182, 0.182] as const) {
    const boltCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.008, 14),
      brushedBrassMat
    );
    boltCap.name = `outbuildings.garage.showerRoom.toilet.mountingBoltCap.${sx < 0 ? 'left' : 'right'}`;
    boltCap.userData.lodTier = 'high';
    boltCap.userData.lodMaxDistance = 12;
    boltCap.rotation.z = Math.PI / 2;
    boltCap.position.set(sx, 0.22, 0.24);
    toiletGroup.add(boltCap);
  }

  // 5D. Sculpted Ergonomic Open-Ring Soft-Close Seat (`outbuildings.garage.showerRoom.toilet.seat`) + Raised Soft-Close Lid (`lid`)
  const toiletSeatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.156, 0.03, 16, 32),
    ceramicWhiteMat
  );
  toiletSeatRing.name = 'outbuildings.garage.showerRoom.toilet.seat';
  toiletSeatRing.rotation.x = Math.PI / 2;
  toiletSeatRing.scale.set(1.0, 1.36, 0.42);
  toiletSeatRing.position.set(0, 0.418, 0.445);
  toiletSeatRing.castShadow = true;
  toiletGroup.add(toiletSeatRing);

  const seatRearBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.355, 0.022, 0.135),
    ceramicWhiteMat
  );
  seatRearBridge.name = 'outbuildings.garage.showerRoom.toilet.seat';
  seatRearBridge.position.set(0, 0.418, 0.26);
  seatRearBridge.castShadow = true;
  toiletGroup.add(seatRearBridge);

  // 4 rubber seat bumpers underneath the open-ring seat + twin brushed-brass soft-close hinge pillars
  let bumperIdx = 0;
  for (const sx of [-0.135, 0.135] as const) {
    for (const bz of [0.34, 0.52] as const) {
      bumperIdx++;
      const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.006, 0.032),
        darkGunmetalMat
      );
      bumper.name = `outbuildings.garage.showerRoom.toilet.seatBumper.${bumperIdx}`;
      bumper.userData.lodTier = 'high';
      bumper.userData.lodMaxDistance = 12;
      bumper.position.set(sx, 0.406, bz);
      toiletGroup.add(bumper);
    }
  }
  for (const hx of [-0.11, 0.11] as const) {
    const hingePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.028, 14),
      brushedBrassMat
    );
    hingePillar.name = `outbuildings.garage.showerRoom.toilet.softCloseHinge.${hx < 0 ? 'left' : 'right'}`;
    hingePillar.userData.lodTier = 'high';
    hingePillar.userData.lodMaxDistance = 12;
    hingePillar.position.set(hx, 0.426, 0.21);
    toiletGroup.add(hingePillar);
  }

  // Contoured soft-close ceramic-white lid (`outbuildings.garage.showerRoom.toilet.lid`) hinged open against the cistern
  const toiletLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.186, 0.186, 0.018, 28),
    ceramicWhiteMat
  );
  toiletLid.name = 'outbuildings.garage.showerRoom.toilet.lid';
  toiletLid.scale.set(1.0, 1.0, 1.36);
  toiletLid.rotation.x = 1.42;
  toiletLid.position.set(0, 0.65, 0.205);
  toiletLid.castShadow = true;
  toiletGroup.add(toiletLid);

  // 5E. Wall-Mounted Brushed-Brass & Frosted-Glass Toilet Brush Holder (`x = -0.34m`) + Toilet Roll Holder (`x = +0.34m`)
  const brushBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.028, 0.075),
    brushedBrassMat
  );
  brushBracket.name = 'outbuildings.garage.showerRoom.toilet.brushHolderBracket';
  brushBracket.userData.lodTier = 'high';
  brushBracket.userData.lodMaxDistance = 12;
  brushBracket.position.set(-0.34, 0.20, 0.04);
  toiletGroup.add(brushBracket);

  const brushCollarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.046, 0.006, 10, 20),
    brushedBrassMat
  );
  brushCollarRing.name = 'outbuildings.garage.showerRoom.toilet.brushHolderRing';
  brushCollarRing.userData.lodTier = 'high';
  brushCollarRing.userData.lodMaxDistance = 12;
  brushCollarRing.rotation.x = Math.PI / 2;
  brushCollarRing.position.set(-0.34, 0.20, 0.095);
  toiletGroup.add(brushCollarRing);

  const brushFrostedCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.04, 0.14, 20),
    frostedHolderGlassMat
  );
  brushFrostedCup.name = 'outbuildings.garage.showerRoom.toilet.brushHolderCup';
  brushFrostedCup.position.set(-0.34, 0.19, 0.095);
  toiletGroup.add(brushFrostedCup);

  const brushHandleRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.22, 12),
    brushedBrassMat
  );
  brushHandleRod.name = 'outbuildings.garage.showerRoom.toilet.brushHandleRod';
  brushHandleRod.userData.lodTier = 'high';
  brushHandleRod.userData.lodMaxDistance = 12;
  brushHandleRod.position.set(-0.34, 0.31, 0.095);
  toiletGroup.add(brushHandleRod);

  const rollBackplate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.008, 16),
    brushedBrassMat
  );
  rollBackplate.name = 'outbuildings.garage.showerRoom.toilet.rollHolderBackplate';
  rollBackplate.userData.lodTier = 'high';
  rollBackplate.userData.lodMaxDistance = 12;
  rollBackplate.rotation.x = Math.PI / 2;
  rollBackplate.position.set(0.35, 0.64, 0.011);
  toiletGroup.add(rollBackplate);

  const rollHolderArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.018, 0.085),
    brushedBrassMat
  );
  rollHolderArm.name = 'outbuildings.garage.showerRoom.toilet.rollHolderArm';
  rollHolderArm.position.set(0.35, 0.64, 0.062);
  toiletGroup.add(rollHolderArm);

  const paperRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.11, 20),
    ceramicWhiteMat
  );
  paperRoll.name = 'outbuildings.garage.showerRoom.toilet.paperRoll';
  paperRoll.rotation.z = Math.PI / 2;
  paperRoll.position.set(0.35, 0.61, 0.075);
  toiletGroup.add(paperRoll);

  const rollCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.114, 16),
    darkOakRecessMat
  );
  rollCore.name = 'outbuildings.garage.showerRoom.toilet.paperRollCore';
  rollCore.userData.lodTier = 'high';
  rollCore.userData.lodMaxDistance = 12;
  rollCore.rotation.z = Math.PI / 2;
  rollCore.position.set(0.35, 0.61, 0.075);
  toiletGroup.add(rollCore);

  // ---------------------------------------------------------------------------
  // 6. Fluted-Oak & Carrara-Marble Wall-Hung Vanity Basin + Backlit Mirror (`outbuildings.garage.showerRoom.vanity`)
  //    Positioned on the solid North-West Wall (`u = 6.66m, v = 3.98m`, facing South `+v`) where the removed
  //    Garage door used to be, staggered cleanly West of the Toilet (`u = 7.56m`)!
  // ---------------------------------------------------------------------------
  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'outbuildings.garage.showerRoom.vanity';
  vanityGroup.position.set(6.66, garageFloorTopY + 0.008, vNorthInner + 0.01);
  roomGroup.add(vanityGroup);

  const vanityW = 0.58;
  const vanityD = 0.36;
  const vanityH = 0.44;
  const vanityCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(vanityW, vanityH, vanityD),
    lightOakDoorMat
  );
  vanityCabinet.name = 'outbuildings.garage.showerRoom.vanity.cabinet';
  vanityCabinet.position.set(0, 0.4 + vanityH * 0.5, vanityD * 0.5 + 0.008);
  vanityCabinet.castShadow = true;
  vanityCabinet.receiveShadow = true;
  vanityGroup.add(vanityCabinet);

  // Vertical fluted oak ribs across the front drawer face (`z = vanityD + 0.016m`)
  for (let r = -8; r <= 8; r++) {
    const fluteRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, vanityH - 0.03, 0.008),
      darkOakRecessMat
    );
    fluteRib.name = `outbuildings.garage.showerRoom.vanity.fluteRib.${r + 9}`;
    fluteRib.userData.lodTier = 'high';
    fluteRib.userData.lodMaxDistance = 12;
    fluteRib.position.set(r * 0.031, 0.4 + vanityH * 0.5, vanityD + 0.016);
    vanityGroup.add(fluteRib);
  }

  // Brushed-brass knurled drawer pull bar
  const vanityPull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.24, 12),
    brushedBrassMat
  );
  vanityPull.name = 'outbuildings.garage.showerRoom.vanity.drawerPull';
  vanityPull.userData.lodTier = 'high';
  vanityPull.userData.lodMaxDistance = 12;
  vanityPull.rotation.z = Math.PI / 2;
  vanityPull.position.set(0, 0.76, vanityD + 0.03);
  vanityGroup.add(vanityPull);

  // Carrara Marble Countertop (`0.60m x 0.028m x 0.38m`) + Oval Ceramic Countertop Vessel Basin
  const marbleTop = new THREE.Mesh(
    new THREE.BoxGeometry(vanityW + 0.02, 0.028, vanityD + 0.02),
    calacattaTileMat
  );
  marbleTop.name = 'outbuildings.garage.showerRoom.vanity.carraraCountertop';
  marbleTop.position.set(0, 0.858, (vanityD + 0.02) * 0.5 + 0.008);
  marbleTop.castShadow = true;
  vanityGroup.add(marbleTop);

  const vesselBasin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.155, 0.125, 28),
    ceramicWhiteMat
  );
  vesselBasin.name = 'outbuildings.garage.showerRoom.vanity.basin';
  vesselBasin.scale.set(1.18, 1.0, 0.78);
  vesselBasin.position.set(0, 0.9385, 0.208);
  vesselBasin.castShadow = true;
  vanityGroup.add(vesselBasin);

  // Brushed-Brass Tall Monobloc Basin Mixer Tap (`y = 0.876..1.086m, z = 0.072m`)
  const tapStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.02, 0.21, 16),
    brushedBrassMat
  );
  tapStem.name = 'outbuildings.garage.showerRoom.vanity.mixerTapStem';
  tapStem.position.set(0, 0.981, 0.072);
  vanityGroup.add(tapStem);

  const tapSpout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.13, 12),
    brushedBrassMat
  );
  tapSpout.name = 'outbuildings.garage.showerRoom.vanity.mixerTapSpout';
  tapSpout.rotation.x = Math.PI / 2 + 0.18;
  tapSpout.position.set(0, 1.066, 0.127);
  vanityGroup.add(tapSpout);

  // Circular Backlit Brushed-Brass Vanity Mirror (`r = 0.29m, y = 1.44m`)
  const mirrorHalo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.305, 0.305, 0.004, 32),
    warmDownlightLedMat
  );
  mirrorHalo.name = 'outbuildings.garage.showerRoom.vanity.mirrorHaloBacklight';
  mirrorHalo.rotation.x = Math.PI / 2;
  mirrorHalo.position.set(0, 1.44, 0.009);
  vanityGroup.add(mirrorHalo);

  const mirrorRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.014, 32),
    brushedBrassMat
  );
  mirrorRim.name = 'outbuildings.garage.showerRoom.vanity.mirrorBrassRim';
  mirrorRim.rotation.x = Math.PI / 2;
  mirrorRim.position.set(0, 1.44, 0.022);
  vanityGroup.add(mirrorRim);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.278, 0.278, 0.004, 32),
    mirrorSilverMat
  );
  mirrorGlass.name = 'outbuildings.garage.showerRoom.vanity.mirror';
  mirrorGlass.rotation.x = Math.PI / 2;
  mirrorGlass.position.set(0, 1.44, 0.035);
  vanityGroup.add(mirrorGlass);

  // ---------------------------------------------------------------------------
  // 7. Brushed-Brass Heated Ladder Towel Rail (`outbuildings.garage.showerRoom.heatedTowelRail`)
  //    Mounted on the South-West Wall (`u = 6.45m, v = 5.39m`)
  // ---------------------------------------------------------------------------
  const towelRailGroup = new THREE.Group();
  towelRailGroup.name = 'outbuildings.garage.showerRoom.heatedTowelRail';
  towelRailGroup.position.set(6.45, garageFloorTopY + 0.65, vSouthInner - 0.045);
  roomGroup.add(towelRailGroup);

  for (const sx of [-0.22, 0.22] as const) {
    const upright = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.96, 14),
      brushedBrassMat
    );
    upright.name = `outbuildings.garage.showerRoom.heatedTowelRail.upright.${sx < 0 ? 'west' : 'east'}`;
    upright.position.set(sx, 0.48, 0);
    towelRailGroup.add(upright);
  }
  for (let barIdx = 0; barIdx < 8; barIdx++) {
    const crossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.44, 12),
      brushedBrassMat
    );
    crossBar.name = `outbuildings.garage.showerRoom.heatedTowelRail.crossRung.${barIdx + 1}`;
    crossBar.userData.lodTier = 'high';
    crossBar.userData.lodMaxDistance = 12;
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, 0.08 + barIdx * 0.115, 0.012);
    towelRailGroup.add(crossBar);
  }

  // ---------------------------------------------------------------------------
  // 8. Cutaway-Aware Shower Room Ceiling Lid & Warm LED Downlights (`ceilingGroup`)
  //    Issue #2 ("in cutaway mode dont show the ceiling" at `[-14.572, 1.94, 19.933]`, `outbuildings.garage.showerRoom.ceilingLid`):
  //    Attached to `roofGroup` (`ctx.ceilingMeshGroup`) so `CutawayController` hides the Shower Room ceiling lid
  //    and downlights whenever `ceilingCutaway === true` (on both Ground and First floor view modes)!
  // ---------------------------------------------------------------------------
  const ceilingGroup = new THREE.Group();
  ceilingGroup.name = 'outbuildings.garage.showerRoom.ceilingLid';
  groundCeilingGroup.add(ceilingGroup);

  const ceilingLid = new THREE.Mesh(
    new THREE.BoxGeometry(uMax - uMin - 0.012, 0.05, vSouthInner - vNorthOuter - 0.012),
    wallPlasterMat
  );
  ceilingLid.name = 'outbuildings.garage.showerRoom.ceilingLid';
  ceilingLid.position.set(
    (uMin + uMax) * 0.5,
    eaveTopY - 0.035,
    (vNorthOuter + vSouthInner) * 0.5
  );
  ceilingGroup.add(ceilingLid);

  const showerDownlightBezelMat = new THREE.MeshStandardMaterial({
    color: 0xc29858,
    roughness: 0.28,
    metalness: 0.84,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const showerDownlightLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: 0xffe4b8,
    emissiveIntensity: 1.9,
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  let downlightIdx = 0;
  for (const du of [6.65, 8.15] as const) {
    downlightIdx++;
    const downlightBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.012, 18),
      showerDownlightBezelMat
    );
    downlightBezel.name = `outbuildings.garage.showerRoom.downlightBezel.${downlightIdx}`;
    downlightBezel.userData.lodTier = 'high';
    downlightBezel.userData.lodMaxDistance = 12;
    downlightBezel.position.set(du, eaveTopY - 0.062, 4.7);
    ceilingGroup.add(downlightBezel);

    const downlightLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.014, 18),
      showerDownlightLensMat
    );
    downlightLens.name = `outbuildings.garage.showerRoom.downlightLens.${downlightIdx}`;
    downlightLens.userData.lodTier = 'high';
    downlightLens.userData.lodMaxDistance = 12;
    downlightLens.position.set(du, eaveTopY - 0.063, 4.7);
    ceilingGroup.add(downlightLens);
  }

  // Warm 3000K PointLight inside the Shower Room
  const showerRoomLight = new THREE.PointLight(0xfff1dc, 2.2, 5.2, 1.5);
  showerRoomLight.name = 'outbuildings.garage.showerRoom.light';
  showerRoomLight.position.set(7.45, eaveTopY - 0.22, 4.7);
  roomGroup.add(showerRoomLight);
}
