import * as THREE from 'three';
import { buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';

/**
 * Study (`study`) and Plant Room shell: floor, walls, lobby and courtyard door.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildStudy(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'tagCutawayWall' | 'wallH' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addBrickWallAlongXWithWindow' | 'addBrickWallAlongZWithCourtyardDoor' | 'addExteriorBrickWall' | 'addInteriorWall'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY' | 'tier2WallH' | 'tier2WallMidY'>
): void {
  const { groundFloorCeilingGroup, scene } = ctx;
  const {
    addBrickWallAlongXWithWindow,
    addBrickWallAlongZWithCourtyardDoor,
    addExteriorBrickWall,
    addInteriorWall,
    antiqueOakSkirtingMat,
    tagCutawayWall,
    tier2FloorY,
    tier2WallH,
    tier2WallMidY,
    wallH,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 7. PLANT ROOM & STUDY (Behind Living Room: Z = +8.39m..+11.49m, Floor at Y = -0.60m)
  //    - NO internal door from the Living Room (separated by the solid Z = +8.27m fireplace wall!)
  //    - Issue #6: Plain unvarnished pale Scots pine floorboards (`plainUnvarnishedPineFloorMat`) across the Study & Plant Room
  //    - External courtyard access via the Solid Courtyard Door at Z = +9.22m (Issue #4 & #15)
  // =========================================================================
  const plainUnvarnishedPineFloorMat = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx2d = c.getContext('2d');
    const b = document.createElement('canvas');
    b.width = 512;
    b.height = 512;
    const bCtx = b.getContext('2d');

    if (ctx2d && bCtx) {
      // Base raw pale blonde/oatmeal unvarnished pine tone
      ctx2d.fillStyle = '#decba8';
      ctx2d.fillRect(0, 0, 512, 512);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 512, 512);

      // 6 wide traditional unvarnished pine floorboards across the texture height
      const numBoards = 6;
      const boardH = 512 / numBoards;
      const boardPalette = ['#e4d3b3', '#dac6a2', '#e0cead', '#d6c19b', '#e6d6b8', '#dcc8a5'];

      for (let row = 0; row < numBoards; row++) {
        const y0 = row * boardH;
        ctx2d.fillStyle = boardPalette[row % boardPalette.length];
        ctx2d.fillRect(0, y0, 512, boardH);

        // Straight horizontal raw pine wood grain fibers along each board
        for (let s = 0; s < 42; s++) {
          const gy = y0 + ((s + 0.5) / 42) * boardH;
          const wave = Math.sin(s * 1.7 + row * 2.3) * 0.5 + 0.5;
          ctx2d.strokeStyle =
            wave > 0.5
              ? 'rgba(196, 170, 128, 0.28)'
              : 'rgba(245, 234, 212, 0.24)';
          ctx2d.lineWidth = 1.2;
          ctx2d.beginPath();
          ctx2d.moveTo(0, gy);
          ctx2d.bezierCurveTo(
            170,
            gy + Math.sin(row + s) * 1.6,
            340,
            gy - Math.cos(row + s) * 1.6,
            512,
            gy
          );
          ctx2d.stroke();
        }

        // Characteristic Scots pine knots (2–3 small oval knots per board)
        for (let k = 0; k < 2; k++) {
          const kx = ((row * 137 + k * 241 + 65) % 450) + 30;
          const ky = y0 + boardH * (0.28 + ((row + k) % 2) * 0.42);
          const krx = 7 + ((row + k) % 3) * 2.5;
          const kry = 3.5 + ((row * k) % 2) * 1.5;

          // Outer pale grain halo around pine knot
          ctx2d.strokeStyle = 'rgba(182, 152, 110, 0.45)';
          ctx2d.lineWidth = 1.4;
          ctx2d.beginPath();
          ctx2d.ellipse(kx, ky, krx * 1.6, kry * 1.45, 0, 0, Math.PI * 2);
          ctx2d.stroke();

          // Warm amber-brown pine knot core
          ctx2d.fillStyle = 'rgba(148, 114, 74, 0.62)';
          ctx2d.beginPath();
          ctx2d.ellipse(kx, ky, krx, kry, 0, 0, Math.PI * 2);
          ctx2d.fill();
        }

        // Unvarnished square-edged floorboard longitudinal gap seam
        ctx2d.fillStyle = '#9a8466';
        ctx2d.fillRect(0, y0, 512, 2.2);
        bCtx.fillStyle = '#2e2e2e';
        bCtx.fillRect(0, y0, 512, 2.5);

        // Staggered butt-joint end seam between pine boards
        const buttX = ((row * 193 + 85) % 420) + 45;
        ctx2d.fillStyle = '#a38d6e';
        ctx2d.fillRect(buttX, y0, 1.8, boardH);
        bCtx.fillStyle = '#404040';
        bCtx.fillRect(buttX, y0, 2.0, boardH);
      }
    }

    const colorTex = new THREE.CanvasTexture(c);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.wrapS = THREE.RepeatWrapping;
    colorTex.wrapT = THREE.RepeatWrapping;

    const bumpTex = new THREE.CanvasTexture(b);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;

    return new THREE.MeshStandardMaterial({
      color: 0xf5efe2,
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: 0.0035,
      roughness: 0.84, // Matte, raw unvarnished bare pine finish (zero gloss/varnish)
      metalness: 0.0,
    });
  })();

  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 8.39],
      [-17.22, 8.39],
      [-17.39, 11.49],
      [-22.19, 11.49],
    ],
    tier2FloorY,
    0.08,
    plainUnvarnishedPineFloorMat,
    [1 / 2.2, 1 / 1.2]
  );

  // West Exterior Brick Wall of Study / Office (0.28m thick, X = -22.19m..-22.47m, Z = +8.39m..+11.77m)
  // Solid red brickwork with climbing ivy (NO window on the outside street facade — media_1790510441132.jpg!)
  addExteriorBrickWall(-22.47, -22.19, 8.39, 11.77, 0, wallH, 'east');

  // South Exterior Brick Gable Wall of Office & Plant Room (0.28m thick, Z = +11.49m..+11.77m, X = -22.47m..-17.11m)
  // With small 2-pane cottage window at X = -21.05m — just on your left as you walk East through the courtyard gates!
  addBrickWallAlongXWithWindow(
    -22.47,
    -17.11,
    11.49,
    11.77,
    -21.05,
    0.78,
    0.76,
    1.48,
    'north',
    2
  );

  // East Courtyard Exterior Brick Wall of Plant Room (0.28m thick, X = -17.11m..-17.39m, Z = +8.15m..+11.77m)
  // Door moved slightly left (North, -Z when looking East from inside) to Z = +9.22m (Issue #15)
  addBrickWallAlongZWithCourtyardDoor(
    -17.39,
    -17.11,
    8.15,
    11.77,
    9.22,
    0.94,
    'west',
    Math.PI * 0.48
  );

  // Interior Partition Wall between Study (3.20m wide) and Plant Room (1.45m wide)
  // (0.15m thick, X = -18.84m..-18.99m, Z = +8.39m..+11.49m) with Open Cased Doorway at Z = +10.68m (Z = +10.23m..+11.13m)
  addInteriorWall(-18.915, tier2WallMidY, 9.31, 0.15, tier2WallH, 1.84, warmRoomPlasterMat);
  addInteriorWall(-18.915, tier2WallMidY, 11.31, 0.15, tier2WallH, 0.36, warmRoomPlasterMat);
  {
    // Issue #8: Raise the Study / Plant Room open doorway clear height to 2.08m (6'10") above tier2FloorY (-0.60m)
    const studyDoorH = 2.08;
    const studyLintelH = wallH - (tier2FloorY + studyDoorH); // 0.58m
    const studyLintelY = tier2FloorY + studyDoorH + studyLintelH / 2; // 1.77m
    addInteriorWall(-18.915, studyLintelY, 10.68, 0.15, studyLintelH, 0.9, warmRoomPlasterMat);

    // Issue #1 & #8: Thicker solid antique oak architrave around the Study / Plant Room open doorway
    const studyCasingGroup = new THREE.Group();
    studyCasingGroup.name = 'study.openDoorwayCasing';
    for (const jambZ of [10.192, 11.168]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.214, studyDoorH + 0.04, 0.092),
        antiqueOakSkirtingMat
      );
      jamb.name = 'study.openDoorwayCasing.jamb';
      jamb.position.set(-18.915, tier2FloorY + (studyDoorH + 0.04) * 0.5, jambZ);
      jamb.castShadow = true;
      jamb.receiveShadow = true;
      studyCasingGroup.add(jamb);
    }
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.214, 0.095, 1.068),
      antiqueOakSkirtingMat
    );
    head.name = 'study.openDoorwayCasing.head';
    head.position.set(-18.915, tier2FloorY + studyDoorH + 0.042, 10.68);
    head.castShadow = true;
    studyCasingGroup.add(head);
    scene.add(studyCasingGroup);
  }

  // =========================================================================
  // 7A. PLANT ROOM / STUDY SOUTH WALL MECHANICAL EXTRACT VENTILATION FAN
  //     & EXTERNAL WEATHER LOUVRE GRILLE (Issue #9 — mounted at [-19.809, 1.606, 11.49]
  //     facing North -Z opposite the twin Viessmann boilers to extract residual heat)
  // =========================================================================
  {
    const fanGroup = new THREE.Group();
    fanGroup.name = 'study.southWallExtractorFan';
    fanGroup.userData.zone = 'study';
    fanGroup.position.set(-19.809, 1.606, 11.49);

    const fanHousingWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf1f3f5, // Clean commercial ABS/polycarbonate Vent-Axia T-Series / Xpelair fascia
      roughness: 0.28,
      metalness: 0.08,
    });
    const fanLouverBladeMat = new THREE.MeshStandardMaterial({
      color: 0xe3e7ec, // Sculpted aerodynamic automatic backdraught shutter vanes
      roughness: 0.34,
      metalness: 0.06,
    });
    const fanDuctThroatMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24, // Deep acoustic dark-grey/black through-wall sleeve interior
      roughness: 0.78,
      metalness: 0.12,
    });
    const fanImpellerMat = new THREE.MeshStandardMaterial({
      color: 0x2e3540, // Glass-filled nylon 7-blade axial impeller rotor
      roughness: 0.38,
      metalness: 0.24,
    });
    const externalGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x383c42, // Weathered anthracite powder-coated cast-aluminium external weather cowl
      roughness: 0.48,
      metalness: 0.55,
    });
    const statusLedGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22ee66,
      emissive: 0x16c850,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });

    // 1. Interior square bevelled wall fascia frame (0.265m W x 0.265m H x 0.042m D, protruding -Z into room)
    const outerFascia = new THREE.Mesh(
      new THREE.BoxGeometry(0.265, 0.265, 0.024),
      fanHousingWhiteMat
    );
    outerFascia.name = 'study.southWallExtractorFan.fascia';
    outerFascia.position.set(0, 0, -0.012);
    outerFascia.castShadow = true;
    outerFascia.receiveShadow = true;
    fanGroup.add(outerFascia);

    const steppedBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.236, 0.236, 0.022),
      fanHousingWhiteMat
    );
    steppedBezel.position.set(0, 0, -0.028);
    steppedBezel.castShadow = true;
    fanGroup.add(steppedBezel);

    // 2. Dark circular Ø165mm acoustic fan throat & recessed impeller cavity
    const throatCavity = new THREE.Mesh(
      new THREE.CylinderGeometry(0.084, 0.084, 0.036, 20),
      fanDuctThroatMat
    );
    throatCavity.rotation.x = Math.PI / 2;
    throatCavity.position.set(0, 0.006, -0.022);
    fanGroup.add(throatCavity);

    // Central axial motor hub & 7 angled impeller blades visible inside the throat
    const motorHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.024, 14),
      fanImpellerMat
    );
    motorHub.rotation.x = Math.PI / 2;
    motorHub.position.set(0, 0.006, -0.026);
    fanGroup.add(motorHub);

    for (let b = 0; b < 7; b++) {
      const angle = (b / 7) * Math.PI * 2;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.018, 0.004),
        fanImpellerMat
      );
      blade.position.set(
        Math.cos(angle) * 0.05,
        0.006 + Math.sin(angle) * 0.05,
        -0.026
      );
      blade.rotation.z = angle + 0.35;
      blade.rotation.y = 0.42;
      fanGroup.add(blade);
    }

    // 3. 6 horizontal angled automatic shutter louvre vanes across the front grille aperture
    for (let v = 0; v < 6; v++) {
      const vy = -0.068 + v * 0.029;
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.188, 0.021, 0.005),
        fanLouverBladeMat
      );
      vane.name = `study.southWallExtractorFan.louver.${v + 1}`;
      vane.position.set(0, vy, -0.041);
      vane.rotation.x = 0.38; // Tilted open in active extract position
      vane.castShadow = true;
      fanGroup.add(vane);
    }

    // Lower control strip with Vent-Axia style thermostat/overrun LED indicator & branding badge
    const ledIndicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.006, 0.004),
      statusLedGreenMat
    );
    ledIndicator.name = 'study.southWallExtractorFan.statusLed';
    ledIndicator.position.set(0.084, -0.102, -0.04);
    fanGroup.add(ledIndicator);

    // Adjacent 3A Fused Spur Fan Isolator Switch on the right (X = +0.21m -> world X = -19.60m)
    const isolatorBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.086, 0.086, 0.026),
      fanHousingWhiteMat
    );
    isolatorBox.name = 'study.southWallExtractorFan.isolatorSwitch';
    isolatorBox.position.set(0.21, 0, -0.013);
    isolatorBox.castShadow = true;
    fanGroup.add(isolatorBox);

    const isolatorRocker = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.032, 0.006),
      fanLouverBladeMat
    );
    isolatorRocker.position.set(0.194, 0, -0.028);
    fanGroup.add(isolatorRocker);

    const fuseCarrier = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.028, 0.005),
      fanLouverBladeMat
    );
    fuseCarrier.position.set(0.226, 0, -0.028);
    fanGroup.add(fuseCarrier);

    // Horizontal surface conduit linking isolator switch to extractor fan
    const conduitLink = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.042, 8),
      fanHousingWhiteMat
    );
    conduitLink.rotation.z = Math.PI / 2;
    conduitLink.position.set(0.15, 0, -0.01);
    fanGroup.add(conduitLink);

    // 4. Exterior Weathered Cast-Aluminium Fixed-Blade Cowl Grille on South Brick Facade (Z = +11.77m -> local Z = +0.28m)
    const extGrilleFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.25, 0.022),
      externalGrilleMat
    );
    extGrilleFrame.name = 'study.southWallExtractorFan.exteriorWeatherGrille';
    extGrilleFrame.position.set(0, 0, 0.28 + 0.011);
    extGrilleFrame.castShadow = true;
    fanGroup.add(extGrilleFrame);

    for (let ev = 0; ev < 6; ev++) {
      const evy = -0.08 + ev * 0.032;
      const extLouver = new THREE.Mesh(
        new THREE.BoxGeometry(0.21, 0.024, 0.018),
        externalGrilleMat
      );
      extLouver.position.set(0, evy, 0.28 + 0.022);
      extLouver.rotation.x = -0.45; // Sloped downward outside to shed rain
      fanGroup.add(extLouver);
    }

    tagCutawayWall(fanGroup, {
      axis: 'z',
      coord: 11.63,
      minSpan: -20.66,
      maxSpan: -17.11,
      floor: 'ground',
    });
    scene.add(fanGroup);
  }

  // Plasterboard ceiling backing over Study & Plant Room (bottom at wallH - 0.026m above the linear LED light bars at wallH - 0.03m)
  buildPolygonalFloorSlab(
    groundFloorCeilingGroup,
    [
      [-22.36, 8.27],
      [-17.11, 8.27],
      [-17.25, 11.63],
      [-22.36, 11.63],
    ],
    wallH + 0.012,
    0.038,
    warmRoomPlasterMat,
    0.5
  ).name = 'study.ceilingBacking';
}
