import * as THREE from 'three';
import { addCasedArchitravePortal, buildAngledWallSegment, buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import { createWelshSlateRoofTexture } from '../../../../engine/textures/procedural-textures.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { buildDiningRoom } from './dining-room.ts';
import type { buildLivingRoom } from './living-room.ts';

/**
 * Front Entrance Hallway (`entranceHall`), staggered portals, front door and hallway pictures.
 */
export function buildEntranceHall(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat' | 'ceramicWhiteMat' | 'doorH' | 'engineeredOakFloorMat' | 'exteriorBrickMat' | 'farrowAndBallCordMat' | 'frontDoorMat' | 'frontWallH' | 'oakMat' | 'stoneSillMat' | 'timberDoorMat' | 'vitoriaChequerTileMat' | 'vitoriaChequerUvScale' | 'wallCapMat' | 'wallH' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addExteriorBrickWall' | 'applyWorldSpaceBrickUVs'> &
    Pick<ReturnType<typeof buildDiningRoom>, 'lowerFloorY'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'> &
    Pick<ReturnType<typeof buildLivingRoom>, 'entranceHallNorthWallFrame'>
): void {
  const { groundFloorCeilingGroup, interactions, scene } = ctx;
  const {
    addExteriorBrickWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    brassMat,
    castIronMat,
    ceramicWhiteMat,
    doorH,
    engineeredOakFloorMat,
    entranceHallNorthWallFrame,
    exteriorBrickMat,
    farrowAndBallCordMat,
    frontDoorMat,
    frontWallH,
    lowerFloorY,
    oakMat,
    stoneSillMat,
    tier2FloorY,
    timberDoorMat,
    vitoriaChequerTileMat,
    vitoriaChequerUvScale,
    wallCapMat,
    wallH,
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 5. FRONT ENTRANCE HALLWAY (IN) — IRREGULAR TRAPEZOID WITH TWO 100% STRAIGHT WALLS
  //    (media_1790618728778.webp to media_1790618728869.webp & media_1790619068355.png)
  //    Polygonal floor at Y = -0.60m (Fayrouz Vitoria Classic Rosso 30cm diagonal chequerboard porcelain):
  //    - Straight North Wall (zero kinks): [-22.19, 1.905] -> [-17.891, 2.48] -> [-16.36, 2.685]
  //    - Straight South Wall (zero kinks): [-22.19, 3.625] -> [-16.44, 3.625]
  //    - Issue #4: On the ground floor only, the East end wall juts out slightly (to X = -16.44m..-16.16m)
  //      making this hallway slightly longer so the stepped ceiling boxing sits in the jut-out bay East of
  //      both doorframes without intersecting the door architraves, with a small pitched roof outside.
  // =========================================================================
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.42, 1.875],
      [-16.36, 2.685],
      [-16.44, 3.625],
      [-22.42, 3.625],
    ],
    tier2FloorY,
    0.08,
    vitoriaChequerTileMat,
    vitoriaChequerUvScale
  ).name = 'entranceHall.floor';

  // East Continuation of the Straight North Wall ([-17.891, 2.48] -> [-16.92, 2.61], 0.28m thick, length 0.98m):
  // 100% collinear with both the Cinema Room South wall ([-22.19, 1.905] -> [-17.891, 2.48]) and the
  // Hall South exterior brick wall, separating the Front Entrance Hallway (Y = -0.60m) from the
  // Main Stair Hall (Y = -0.30m) with the 30cm step-up opening (`uCenter = 0.535m` from `[-17.891, 2.48]`)!
  buildAngledWallSegment(scene, interactions, {
    start: [-17.891, 2.48],
    end: [-16.92, 2.61],
    thickness: 0.28,
    topY: wallH,
    frontFloorY: tier2FloorY,
    backFloorY: lowerFloorY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
    openings: [
      {
        id: 'hallStepUpPortal',
        kind: 'cased-opening',
        uCenter: 0.535,
        width: 0.74,
        doorHeight: doorH,
        lowerFloorY: tier2FloorY,
        upperFloorY: lowerFloorY,
        stepMaterial: engineeredOakFloorMat,
        architraveMaterial: antiqueOakSkirtingMat,
        revealPullHandleSide: 'right',
        hardwareMaterial: castIronMat,
      },
    ],
  });

  // Lower North Wall segment inside the single-storey East Jut-Out ([-16.92, 2.61] -> [-16.256, 2.699], topY = frontWallH = 1.625m)
  // Capped at frontWallH so it stays completely beneath the pitched Welsh slate lean-to roof (`entranceHall.eastJutOutRoof`)!
  buildAngledWallSegment(scene, interactions, {
    start: [-16.92, 2.61],
    end: [-16.256, 2.699],
    thickness: 0.28,
    topY: frontWallH,
    frontFloorY: tier2FloorY,
    backFloorY: lowerFloorY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
  });

  // West Exterior Front Entrance Wall (0.28m thick, X = -22.19m..-22.47m, Z = +2.045m..+3.70m)
  // With Front Entrance Doorway (Z = +2.30m..+3.37m) + Fanlight + Solid Oak Doorframe & Refined Architrave (Issue #5)
  // Kept permanently visible (`isArchitecturalShell = true`, NOT cutaway) so the Front Door is always visible from outside!
  const frontDoorHeadY = tier2FloorY + 2.08; // 1.48m (fits cleanly beneath frontWallH = 1.625m — Issue #1)
  const addPermanentFrontEntranceBrickPiece = (
    minZ: number,
    maxZ: number,
    yBottom: number,
    yTop: number,
    addSkirt: boolean
  ): void => {
    const w = 0.28;
    const d = maxZ - minZ;
    const actualYBottom = Math.abs(yBottom) < 0.01 ? tier2FloorY - 0.04 : yBottom;
    const h = yTop - actualYBottom;
    const cx = -22.33;
    const cy = (actualYBottom + yTop) * 0.5;
    const cz = (minZ + maxZ) * 0.5;

    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, cx, cy, cz);
    const mats: THREE.Material[] = [
      warmRoomPlasterMat, // +X (East interior face)
      exteriorBrickMat,   // -X (West exterior face)
      exteriorBrickMat,
      exteriorBrickMat,
      exteriorBrickMat,
      exteriorBrickMat,
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isArchitecturalShell = true;
    scene.add(mesh);

    if (Math.abs(yTop - frontWallH) < 0.05) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, 0.028, d + 0.01), wallCapMat);
      cap.position.set(cx, frontWallH + 0.014, cz);
      cap.userData.isArchitecturalShell = true;
      scene.add(cap);
    }

    if (addSkirt) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.14, d), antiqueOakSkirtingMat);
      skirt.position.set(-22.19 + 0.01, tier2FloorY + 0.07, cz);
      skirt.receiveShadow = true;
      skirt.userData.isArchitecturalShell = true;
      scene.add(skirt);
    }
  };
  addPermanentFrontEntranceBrickPiece(2.045, 2.3, 0, frontWallH, true);
  addPermanentFrontEntranceBrickPiece(3.37, 3.7, 0, frontWallH, true);
  addPermanentFrontEntranceBrickPiece(2.3, 3.37, frontDoorHeadY, frontWallH, false);

  // Stone front entrance steps (IN) outside the West Front Door (X = -22.47m..-23.15m, Z = +2.10m..+3.57m, seated at Y = -0.60m)
  const frontStepSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.12, 1.56),
    stoneSillMat
  );
  frontStepSlab.position.set(-22.81, tier2FloorY + 0.02, 2.835);
  frontStepSlab.receiveShadow = true;
  frontStepSlab.userData.isArchitecturalShell = true;
  scene.add(frontStepSlab);

  // Issues #4 & #5: Refined Solid Oak Doorframe, Reveal Jambs, Transom Bar & Slightly Less Substantial Moulded Architrave
  const frontDoorOakFrameMat = new THREE.MeshStandardMaterial({
    color: 0x6e4a2a, // Rich seasoned antique oak joinery
    roughness: 0.46,
    metalness: 0.04,
  });

  // Exterior pilasters & cornice hood on West facade
  for (const pz of [2.22, 3.45]) {
    const pilaster = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 2.14, 0.14),
      frontDoorOakFrameMat
    );
    pilaster.name = 'entranceHall.frontDoorArchitrave.exteriorPilaster';
    pilaster.position.set(-22.51, tier2FloorY + 1.07, pz);
    pilaster.castShadow = true;
    pilaster.userData.isArchitecturalShell = true;
    scene.add(pilaster);
  }

  // Solid oak reveal jambs (spanning wall depth) + refined, slightly less substantial interior oak architrave
  for (const sideZ of [-1, 1] as const) {
    const frameJamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2.1, 0.068),
      frontDoorOakFrameMat
    );
    frameJamb.name = 'entranceHall.frontDoorArchitrave.jamb';
    frameJamb.position.set(-22.33, tier2FloorY + 1.05, 2.835 + sideZ * 0.505);
    frameJamb.castShadow = true;
    frameJamb.receiveShadow = true;
    frameJamb.userData.isArchitecturalShell = true;
    scene.add(frameJamb);

    // Issue #5: Plinth block at base of interior front door architrave

    const interiorPlinthBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.2, 0.125),
      frontDoorOakFrameMat
    );
    interiorPlinthBlock.name = 'entranceHall.frontDoorArchitrave.plinthBlock';
    interiorPlinthBlock.position.set(
      -22.171,
      tier2FloorY + 0.1,
      2.835 + sideZ * 0.53
    );
    interiorPlinthBlock.castShadow = true;
    interiorPlinthBlock.userData.isArchitecturalShell = true;
    scene.add(interiorPlinthBlock);
  }

  // Solid oak frame head & refined, slightly less substantial interior oak lintel header + cornice cap
  const frameHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.072, 1.12),
    frontDoorOakFrameMat
  );
  frameHead.name = 'entranceHall.frontDoorArchitrave.head';
  frameHead.position.set(-22.33, tier2FloorY + 2.075, 2.835);
  frameHead.castShadow = true;
  frameHead.userData.isArchitecturalShell = true;
  scene.add(frameHead);

  addCasedArchitravePortal(scene, {
    axis: 'z',
    wallCoord: -22.33,
    wallThickness: 0.28,
    openingCenter: 2.835,
    openingWidth: 0.96,
    frontFloorY: tier2FloorY + 0.2,
    backFloorY: tier2FloorY + 0.2,
    headY: tier2FloorY + 2.065,
    material: frontDoorOakFrameMat,
    architraveWidth: 0.115,
    includeRevealLining: false,
    includeBackArchitrave: false,
    namePrefix: 'entranceHall.frontDoorArchitrave',
  });

  // Solid oak transom bar separating door leaf and fanlight
  const transomBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.064, 1.04),
    frontDoorOakFrameMat
  );
  transomBar.name = 'entranceHall.frontDoorArchitrave.transomBar';
  transomBar.position.set(-22.33, tier2FloorY + 1.88, 2.835);
  transomBar.castShadow = true;
  transomBar.userData.isArchitecturalShell = true;
  scene.add(transomBar);

  const doorCorniceHood = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.11, 1.44),
    frontDoorOakFrameMat
  );
  doorCorniceHood.position.set(-22.56, tier2FloorY + 2.14, 2.835);
  doorCorniceHood.castShadow = true;
  doorCorniceHood.userData.isArchitecturalShell = true;
  scene.add(doorCorniceHood);

  // Fanlight transom glass + solid oak vertical glazing bars above the Front Entrance Door (Y = tier2FloorY + 1.90m..2.05m)
  const fanlightGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.15, 0.96),
    windowGlassMat
  );
  fanlightGlass.position.set(-22.33, tier2FloorY + 1.975, 2.835);
  fanlightGlass.userData.isArchitecturalShell = true;
  scene.add(fanlightGlass);

  for (const fz of [2.59, 2.835, 3.08]) {
    const fanBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.15, 0.032),
      frontDoorOakFrameMat
    );
    fanBar.position.set(-22.33, tier2FloorY + 1.975, fz);
    fanBar.userData.isArchitecturalShell = true;
    scene.add(fanBar);
  }

  // Issue #6: Natural Woven Coir Doormat inside the Front Entrance Door (X = -21.82m, Y = tier2FloorY, Z = 2.835m)
  {
    const doormatGroup = new THREE.Group();
    doormatGroup.name = 'entranceHall.doormat';
    doormatGroup.userData.zone = 'entranceHall';
    doormatGroup.position.set(-21.82, tier2FloorY, 2.835);

    const coirFiberMat = new THREE.MeshStandardMaterial({
      color: 0x9e7b52, // Natural warm golden-brown bristle coir
      roughness: 0.96,
      metalness: 0.01,
    });
    const coirBorderMat = new THREE.MeshStandardMaterial({
      color: 0x4a3b2c, // Dark woven herringbone webbing border
      roughness: 0.9,
      metalness: 0.02,
    });

    const matBacking = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.014, 0.96),
      coirBorderMat
    );
    matBacking.name = 'entranceHall.doormat.border';
    matBacking.position.set(0, 0.007, 0);
    matBacking.receiveShadow = true;
    doormatGroup.add(matBacking);

    const matCoirCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.018, 0.9),
      coirFiberMat
    );
    matCoirCore.name = 'entranceHall.doormat.coir';
    matCoirCore.position.set(0, 0.01, 0);
    matCoirCore.castShadow = true;
    matCoirCore.receiveShadow = true;
    doormatGroup.add(matCoirCore);

    scene.add(doormatGroup);
  }

  // Interactive Formal 6-Panel Front Entrance Door (IN) seated at Y = -0.60m (visible from both outside and inside!)
  const frontDoorPanelMat = new THREE.MeshStandardMaterial({
    color: 0x1c2623,
    roughness: 0.34,
    metalness: 0.08,
  });
  const frontDoorObj = new THREE.Group();
  frontDoorObj.position.set(-22.33, tier2FloorY + 0.93, 2.835);
  const frontDoorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 1.85, 0.98),
    frontDoorMat
  );
  frontDoorLeaf.castShadow = true;
  frontDoorLeaf.receiveShadow = true;
  frontDoorObj.add(frontDoorLeaf);

  // 6-Panel Georgians/Victorian raised fielder panels on both exterior (-X) and interior (+X) faces
  for (const xFace of [-0.03, 0.03] as const) {
    for (const pz of [-0.22, 0.22] as const) {
      for (const [py, ph] of [
        [0.6, 0.34],
        [0.08, 0.5],
        [-0.52, 0.46],
      ] as const) {
        const panelBorder = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, ph, 0.31),
          frontDoorPanelMat
        );
        panelBorder.position.set(xFace, py, pz);
        frontDoorObj.add(panelBorder);

        const raisedField = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, ph - 0.07, 0.24),
          frontDoorMat
        );
        raisedField.position.set(xFace, py, pz);
        frontDoorObj.add(raisedField);
      }
    }
  }

  // Brass ring knocker, horizontal brass letterplate & turned brass latch knobs on both faces
  const brassKnocker = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.009, 8, 16),
    brassMat
  );
  brassKnocker.rotation.y = Math.PI / 2;
  brassKnocker.position.set(-0.036, 0.34, 0);
  frontDoorObj.add(brassKnocker);

  const brassLetterplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.075, 0.24),
    brassMat
  );
  brassLetterplate.position.set(-0.034, -0.04, 0);
  frontDoorObj.add(brassLetterplate);

  for (const xSide of [-0.044, 0.044] as const) {
    const doorKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      brassMat
    );
    doorKnob.position.set(xSide, -0.04, 0.38);
    frontDoorObj.add(doorKnob);
  }

  scene.add(frontDoorObj);
  const frontDoorPivot = interactions.registerHingedDoor(
    scene,
    frontDoorObj,
    new THREE.Vector3(0, 0, -0.49),
    'y',
    Math.PI * 0.46,
    0
  );
  frontDoorPivot.userData.isArchitecturalShell = true;

  // Ground-Floor-Only East Jut-Out of Front Entrance Hallway (Issue #4, floorplan `media_1790619068355.png`):
  // Juts out Eastward to X_interior = -16.44m (exterior brick X = -16.44m..-16.16m, Z = 2.68m..3.83m)
  // with a South exterior brick return wall (X = -17.00m..-16.44m, Z = 3.55m..3.83m) and a small
  // pitched Welsh slate lean-to roof outside (`entranceHall.eastJutOutRoof`) below the First Floor wall.
  addExteriorBrickWall(-16.44, -16.16, 2.68, 3.83, 0, frontWallH, 'west');
  addExteriorBrickWall(-17.0, -16.44, 3.55, 3.83, 0, frontWallH, 'north');

  // Small Exterior Pitched Welsh Slate Lean-To Roof & Brick Spandrels over the Ground-Floor Jut-Out (Issue #4)
  {
    const jutRoofGroup = new THREE.Group();
    jutRoofGroup.name = 'entranceHall.eastJutOutRoof';
    jutRoofGroup.userData.isArchitecturalShell = true;

    const jutSlateTex = createWelshSlateRoofTexture();
    const jutSlateMat = new THREE.MeshStandardMaterial({
      map: jutSlateTex,
      bumpMap: jutSlateTex,
      bumpScale: 0.016,
      roughness: 0.76,
      metalness: 0.03,
    });
    const leadFlashingMat = new THREE.MeshStandardMaterial({
      color: 0x565b61,
      roughness: 0.46,
      metalness: 0.55,
    });

    // Upper spandrel brick backing below the First Floor East corridor return wall (Y = 1.625m..2.16m)
    const upperSpandrelGeo = new THREE.BoxGeometry(0.28, 2.16 - frontWallH, 1.02);
    applyWorldSpaceBrickUVs(upperSpandrelGeo, -16.99, (frontWallH + 2.16) / 2, 3.32);
    const upperSpandrelMesh = new THREE.Mesh(upperSpandrelGeo, exteriorBrickMat);
    upperSpandrelMesh.position.set(-16.99, (frontWallH + 2.16) / 2, 3.32);
    upperSpandrelMesh.castShadow = true;
    upperSpandrelMesh.receiveShadow = true;
    jutRoofGroup.add(upperSpandrelMesh);

    // Pitched triangular brick cheek / gable infill across X = -16.86m..-16.16m, Z = 2.83m..3.83m
    const cheekW = 0.7; // X = -16.86m to -16.16m
    const cheekH = 0.52; // Y = 1.64m at East eaves (-16.16m) rising to 2.16m at West wall (-16.86m)
    const cheekGeo = new THREE.BoxGeometry(cheekW, cheekH, 1.0);
    const cheekPos = cheekGeo.attributes.position;
    if (cheekPos) {
      for (let i = 0; i < cheekPos.count; i++) {
        if (cheekPos.getY(i) > 0) {
          // Taper top vertices (+Y) down from West (x = -cheekW/2 -> +cheekH/2) to East (x = +cheekW/2 -> -cheekH/2 + 0.04)
          const tEast = (cheekPos.getX(i) + cheekW / 2) / cheekW;
          cheekPos.setY(i, cheekH / 2 - tEast * (cheekH - 0.04));
        }
      }
      cheekPos.needsUpdate = true;
      cheekGeo.computeVertexNormals();
    }
    applyWorldSpaceBrickUVs(cheekGeo, -16.51, frontWallH + 0.015 + cheekH / 2, 3.33);
    const cheekMesh = new THREE.Mesh(cheekGeo, exteriorBrickMat);
    cheekMesh.position.set(-16.51, frontWallH + 0.015 + cheekH / 2, 3.33);
    cheekMesh.castShadow = true;
    cheekMesh.receiveShadow = true;
    jutRoofGroup.add(cheekMesh);

    // Pitched Welsh slate lean-to roof slope (X = -16.87m..-16.13m, Z = 2.83m..3.895m, flush with Hall South brick wall)
    const runX = 0.74;
    const riseY = 0.54;
    const slopeLen = Math.hypot(runX, riseY);
    const pitchAngle = Math.atan2(riseY, runX);
    const jutRoofCenterZ = 3.3625;
    const jutRoofSpanZ = 1.065;
    const slateSlopeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(slopeLen, 0.055, jutRoofSpanZ),
      jutSlateMat
    );
    slateSlopeMesh.position.set(-16.5, frontWallH + 0.295, jutRoofCenterZ);
    slateSlopeMesh.rotation.z = -pitchAngle;
    slateSlopeMesh.castShadow = true;
    slateSlopeMesh.receiveShadow = true;
    jutRoofGroup.add(slateSlopeMesh);

    // Lead abutment flashing against the First Floor brickwork & North Hall brick wall
    const topFlashing = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.11, jutRoofSpanZ),
      leadFlashingMat
    );
    topFlashing.position.set(-16.85, frontWallH + 0.56, jutRoofCenterZ);
    jutRoofGroup.add(topFlashing);

    const northAbutmentFlashing = new THREE.Mesh(
      new THREE.BoxGeometry(slopeLen - 0.02, 0.075, 0.036),
      leadFlashingMat
    );
    northAbutmentFlashing.position.set(-16.5, frontWallH + 0.32, 2.835);
    northAbutmentFlashing.rotation.z = -pitchAngle;
    jutRoofGroup.add(northAbutmentFlashing);

    // Painted cream timber fascia & soffit along the East & South eaves of the jut-out
    const eastFascia = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.11, jutRoofSpanZ),
      ceramicWhiteMat
    );
    eastFascia.position.set(-16.13, frontWallH + 0.02, jutRoofCenterZ);
    jutRoofGroup.add(eastFascia);

    const southBargeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(slopeLen + 0.02, 0.085, 0.028),
      ceramicWhiteMat
    );
    southBargeBoard.position.set(-16.5, frontWallH + 0.28, 3.88);
    southBargeBoard.rotation.z = -pitchAngle;
    jutRoofGroup.add(southBargeBoard);

    // Little half-round rainwater gutter & cast-iron downpipe along the East eave (Issue #5 at [-16.117, 1.62, 3.895])
    const jutGutterMat = new THREE.MeshStandardMaterial({
      color: 0x8fa693,
      roughness: 0.38,
      metalness: 0.22,
      side: THREE.DoubleSide,
    });
    const jutDownpipeMat = new THREE.MeshStandardMaterial({
      color: 0x1e2228,
      roughness: 0.36,
      metalness: 0.65,
      side: THREE.DoubleSide,
    });
    const jutGutterR = 0.038;
    const jutGutterX = -16.082;
    const jutGutterY = frontWallH + 0.04;
    const jutGutter = new THREE.Mesh(
      new THREE.CylinderGeometry(
        jutGutterR,
        jutGutterR,
        jutRoofSpanZ + 0.02,
        14,
        1,
        true,
        Math.PI,
        Math.PI
      ),
      jutGutterMat
    );
    jutGutter.name = 'entranceHall.eastJutOutRoof.gutter';
    jutGutter.rotation.x = Math.PI / 2;
    jutGutter.position.set(jutGutterX, jutGutterY, jutRoofCenterZ);
    jutGutter.castShadow = true;
    jutRoofGroup.add(jutGutter);

    for (const endZ of [
      jutRoofCenterZ - (jutRoofSpanZ + 0.02) * 0.5,
      jutRoofCenterZ + (jutRoofSpanZ + 0.02) * 0.5,
    ]) {
      const stopEnd = new THREE.Mesh(
        new THREE.CircleGeometry(jutGutterR, 14, Math.PI, Math.PI),
        jutGutterMat
      );
      stopEnd.position.set(jutGutterX, jutGutterY, endZ);
      jutRoofGroup.add(stopEnd);
    }

    const dpPipeR = 0.026;
    const dpWallX = -16.13;
    const dpZ = 3.84;
    const dpGroundY = tier2FloorY;
    const dpTopShaftY = frontWallH - 0.14;
    const dpShaftH = dpTopShaftY - (dpGroundY + 0.08);

    const jutDpGroup = new THREE.Group();
    jutDpGroup.name = 'entranceHall.eastJutOutRoof.downpipe';

    const dpOutlet = new THREE.Mesh(
      new THREE.CylinderGeometry(dpPipeR + 0.005, dpPipeR, 0.04, 14),
      jutDownpipeMat
    );
    dpOutlet.position.set(jutGutterX, jutGutterY - jutGutterR - 0.01, dpZ);
    jutDpGroup.add(dpOutlet);

    const dpSwanCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(jutGutterX, jutGutterY - jutGutterR, dpZ),
      new THREE.Vector3(jutGutterX, frontWallH - 0.03, dpZ),
      new THREE.Vector3((jutGutterX + dpWallX) * 0.5, frontWallH - 0.075, dpZ),
      new THREE.Vector3(dpWallX, dpTopShaftY + 0.02, dpZ),
      new THREE.Vector3(dpWallX, dpTopShaftY - 0.01, dpZ),
    ]);
    const dpSwanMesh = new THREE.Mesh(
      new THREE.TubeGeometry(dpSwanCurve, 14, dpPipeR, 14, false),
      jutDownpipeMat
    );
    dpSwanMesh.castShadow = true;
    jutDpGroup.add(dpSwanMesh);

    const dpShaftMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(dpPipeR, dpPipeR, dpShaftH, 14),
      jutDownpipeMat
    );
    dpShaftMesh.position.set(dpWallX, dpGroundY + 0.08 + dpShaftH * 0.5, dpZ);
    dpShaftMesh.castShadow = true;
    dpShaftMesh.receiveShadow = true;
    jutDpGroup.add(dpShaftMesh);

    for (const clipY of [dpGroundY + 0.45, dpGroundY + 1.35]) {
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(dpPipeR + 0.006, dpPipeR + 0.006, 0.026, 14),
        jutDownpipeMat
      );
      collar.position.set(dpWallX, clipY, dpZ);
      jutDpGroup.add(collar);

      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.024, 0.095),
        jutDownpipeMat
      );
      bracket.position.set(dpWallX - 0.014, clipY, dpZ);
      jutDpGroup.add(bracket);
    }

    const dpShoeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dpWallX, dpGroundY + 0.09, dpZ),
      new THREE.Vector3(dpWallX + 0.01, dpGroundY + 0.045, dpZ),
      new THREE.Vector3(dpWallX + 0.042, dpGroundY + 0.018, dpZ),
    ]);
    const dpShoeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(dpShoeCurve, 8, dpPipeR, 14, false),
      jutDownpipeMat
    );
    dpShoeMesh.castShadow = true;
    jutDpGroup.add(dpShoeMesh);

    jutRoofGroup.add(jutDpGroup);

    groundFloorCeilingGroup.add(jutRoofGroup);
  }

  // Stepped Plasterboard Ceiling Boxing at the East Jut-Out of the Entrance Hallway (Issue #4, media_1790618728808.webp):
  // Positioned inside the ground-floor East extension (X = -16.88m..-16.44m, East of both `hallStepUpPortal`
  // and `entranceToLivingRoomDoor` so the ceiling boxing never intersects any doorframe!).
  {
    const ceilingStepBoxingGroup = new THREE.Group();
    ceilingStepBoxingGroup.name = 'entranceHall.ceilingStepBoxing';

    const mainHallCeiling = buildPolygonalFloorSlab(
      ceilingStepBoxingGroup,
      [
        [-22.42, 1.875],
        [-16.36, 2.68],
        [-16.36, 3.68],
        [-22.42, 3.68],
      ],
      frontWallH + 0.012,
      0.038,
      warmRoomPlasterMat,
      0.5
    );
    mainHallCeiling.name = 'entranceHall.ceilingStepBoxing.mainCeiling';
    mainHallCeiling.receiveShadow = true;

    const upperStepSoffit = buildPolygonalFloorSlab(
      ceilingStepBoxingGroup,
      [
        [-16.88, 2.685],
        [-16.44, 2.685],
        [-16.44, 3.55],
        [-16.88, 3.55],
      ],
      frontWallH,
      0.22,
      warmRoomPlasterMat,
      0.5
    );
    upperStepSoffit.name = 'entranceHall.ceilingStepBoxing.upperSoffit';
    upperStepSoffit.castShadow = true;

    const lowerBeamBoxing = buildPolygonalFloorSlab(
      ceilingStepBoxingGroup,
      [
        [-16.66, 2.685],
        [-16.44, 2.685],
        [-16.44, 3.55],
        [-16.66, 3.55],
      ],
      frontWallH - 0.22,
      0.15,
      warmRoomPlasterMat,
      0.5
    );
    lowerBeamBoxing.name = 'entranceHall.ceilingStepBoxing.beamBulkhead';
    lowerBeamBoxing.castShadow = true;

    groundFloorCeilingGroup.add(ceilingStepBoxingGroup);
  }

  // Straight South Interior Wall of Front Entrance Hallway / North Wall of Sitting Room
  // (0.15m thick, Z = +3.625m, X = -22.19m..-17.00m, zero kinks) with Doorway centered at X = -17.77m (uCenter = 4.42m, width 0.86m)
  buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 3.625],
    end: [-17.0, 3.625],
    thickness: 0.15,
    topY: frontWallH,
    frontFloorY: tier2FloorY, // +normal = South (Living Room at Y = -0.60m)
    backFloorY: tier2FloorY,  // -normal = North (Front Entrance Hallway at Y = -0.60m)
    wallMaterial: warmRoomPlasterMat,
    frontFaceMaterial: farrowAndBallCordMat,
    backFaceMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: true,
    openings: [
      {
        id: 'entranceToLivingRoomDoor',
        kind: 'hinged-door',
        uCenter: 4.42,
        width: 0.86,
        doorHeight: doorH,
        lowerFloorY: tier2FloorY,
        upperFloorY: tier2FloorY,
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'right',
        openAngle: Math.PI * 0.45, // Swings SOUTH (+Z, into the Living Room) clear of the hallway!
        initialOpenProgress: 0.85,
      },
    ],
  });

  // Framed Gallery Pictures on the Front Entrance Hallway South & North Walls (Issue #7)
  {
    const createHallwayPictureTexture = (
      motif: 'pastoral' | 'botanical' | 'farmhouse' | 'coastal' | 'meadow'
    ): THREE.CanvasTexture => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 192;
      const ctx2d = c.getContext('2d');
      if (ctx2d) {
        if (motif === 'pastoral') {
          const sky = ctx2d.createLinearGradient(0, 0, 0, 110);
          sky.addColorStop(0, '#c8d6dc');
          sky.addColorStop(1, '#ece6d8');
          ctx2d.fillStyle = sky;
          ctx2d.fillRect(0, 0, 256, 192);
          ctx2d.fillStyle = '#6e7e68';
          ctx2d.beginPath();
          ctx2d.moveTo(0, 115);
          ctx2d.quadraticCurveTo(85, 86, 168, 108);
          ctx2d.quadraticCurveTo(215, 118, 256, 98);
          ctx2d.lineTo(256, 192);
          ctx2d.lineTo(0, 192);
          ctx2d.fill();
          ctx2d.fillStyle = '#4a5a44';
          ctx2d.beginPath();
          ctx2d.moveTo(0, 136);
          ctx2d.quadraticCurveTo(110, 118, 256, 142);
          ctx2d.lineTo(256, 192);
          ctx2d.lineTo(0, 192);
          ctx2d.fill();
        } else if (motif === 'botanical') {
          ctx2d.fillStyle = '#eee8dc';
          ctx2d.fillRect(0, 0, 256, 192);
          ctx2d.strokeStyle = '#3f5642';
          ctx2d.lineWidth = 3;
          ctx2d.beginPath();
          ctx2d.moveTo(128, 168);
          ctx2d.quadraticCurveTo(118, 96, 136, 26);
          ctx2d.stroke();
          for (let l = 0; l < 6; l++) {
            const ly = 44 + l * 18;
            ctx2d.fillStyle = l % 2 === 0 ? '#4d684f' : '#637c61';
            ctx2d.beginPath();
            ctx2d.ellipse(110, ly, 22, 9, -0.45, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.beginPath();
            ctx2d.ellipse(146, ly - 6, 22, 9, 0.45, 0, Math.PI * 2);
            ctx2d.fill();
          }
        } else if (motif === 'farmhouse') {
          ctx2d.fillStyle = '#e6dfd1';
          ctx2d.fillRect(0, 0, 256, 192);
          ctx2d.fillStyle = '#9d5540';
          ctx2d.fillRect(68, 76, 120, 68);
          ctx2d.fillStyle = '#3d444c';
          ctx2d.beginPath();
          ctx2d.moveTo(58, 76);
          ctx2d.lineTo(128, 42);
          ctx2d.lineTo(198, 76);
          ctx2d.fill();
          ctx2d.fillStyle = '#f2eee4';
          for (const wx of [86, 122, 158]) {
            ctx2d.fillRect(wx, 88, 14, 20);
            ctx2d.fillRect(wx, 116, 14, 22);
          }
          ctx2d.fillStyle = '#5c6e52';
          ctx2d.fillRect(0, 144, 256, 48);
        } else if (motif === 'coastal') {
          const sky = ctx2d.createLinearGradient(0, 0, 0, 105);
          sky.addColorStop(0, '#b8ccd8');
          sky.addColorStop(1, '#f0e6d2');
          ctx2d.fillStyle = sky;
          ctx2d.fillRect(0, 0, 256, 105);
          ctx2d.fillStyle = '#4c7284';
          ctx2d.fillRect(0, 105, 256, 45);
          ctx2d.fillStyle = '#cbb898';
          ctx2d.fillRect(0, 150, 256, 42);
        } else {
          ctx2d.fillStyle = '#e4dfd3';
          ctx2d.fillRect(0, 0, 256, 192);
          ctx2d.fillStyle = '#7e8c68';
          ctx2d.fillRect(0, 118, 256, 74);
          ctx2d.fillStyle = '#3b4d38';
          for (const [tx, tr] of [
            [64, 26],
            [92, 22],
            [178, 28],
          ] as const) {
            ctx2d.beginPath();
            ctx2d.arc(tx, 106, tr, 0, Math.PI * 2);
            ctx2d.fill();
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const northPicWestPos = entranceHallNorthWallFrame.toWorld(1.15, 0.879, 0.153);
    const northPicEastPos = entranceHallNorthWallFrame.toWorld(2.45, 0.971, 0.153);

    const hallwayPictures: ReadonlyArray<{
      readonly name: string;
      readonly x: number;
      readonly y: number;
      readonly z: number;
      readonly rotY: number;
      readonly w: number;
      readonly h: number;
      readonly frameMat: THREE.Material;
      readonly motif: 'pastoral' | 'botanical' | 'farmhouse' | 'coastal' | 'meadow';
    }> = [
      // 3 Framed Pictures along the Entrance Hallway South Wall (Z = 3.538m, facing North -Z — Issues #14, #15, #16)
      {
        name: 'entranceHall.picture.southEast',
        x: -18.95,
        y: 0.936,
        z: 3.538,
        rotY: Math.PI,
        w: 0.56,
        h: 0.44,
        frameMat: oakMat,
        motif: 'pastoral',
      },
      {
        name: 'entranceHall.picture.southCenter',
        x: -20.1,
        y: 0.924,
        z: 3.538,
        rotY: Math.PI,
        w: 0.62,
        h: 0.48,
        frameMat: castIronMat,
        motif: 'farmhouse',
      },
      {
        name: 'entranceHall.picture.southWest',
        x: -21.25,
        y: 0.947,
        z: 3.538,
        rotY: Math.PI,
        w: 0.56,
        h: 0.44,
        frameMat: oakMat,
        motif: 'botanical',
      },
      // 2 Framed Pictures along the Straight Angled Entrance Hallway North Wall (facing South +normal)
      {
        name: 'entranceHall.picture.northWest',
        x: northPicWestPos.x,
        y: northPicWestPos.y,
        z: northPicWestPos.z,
        rotY: entranceHallNorthWallFrame.rotationY,
        w: 0.58,
        h: 0.45,
        frameMat: oakMat,
        motif: 'coastal',
      },
      {
        name: 'entranceHall.picture.northEast',
        x: northPicEastPos.x,
        y: northPicEastPos.y,
        z: northPicEastPos.z,
        rotY: entranceHallNorthWallFrame.rotationY,
        w: 0.58,
        h: 0.45,
        frameMat: castIronMat,
        motif: 'meadow',
      },
    ];

    for (const pic of hallwayPictures) {
      const picGroup = new THREE.Group();
      picGroup.name = pic.name;
      picGroup.position.set(pic.x, pic.y, pic.z);
      picGroup.rotation.y = pic.rotY;

      const outerFrame = new THREE.Mesh(
        new THREE.BoxGeometry(pic.w, pic.h, 0.024),
        pic.frameMat
      );
      outerFrame.name = `${pic.name}.frame`;
      outerFrame.castShadow = true;
      outerFrame.receiveShadow = true;
      picGroup.add(outerFrame);

      const mountBoard = new THREE.Mesh(
        new THREE.BoxGeometry(pic.w - 0.048, pic.h - 0.048, 0.027),
        ceramicWhiteMat
      );
      mountBoard.name = `${pic.name}.mount`;
      picGroup.add(mountBoard);

      const artMat = new THREE.MeshStandardMaterial({
        map: createHallwayPictureTexture(pic.motif),
        roughness: 0.36,
        metalness: 0.04,
      });
      const artCanvas = new THREE.Mesh(
        new THREE.BoxGeometry(pic.w - 0.14, pic.h - 0.14, 0.03),
        artMat
      );
      artCanvas.name = `${pic.name}.art`;
      picGroup.add(artCanvas);

      scene.add(picGroup);
    }
  }
}
