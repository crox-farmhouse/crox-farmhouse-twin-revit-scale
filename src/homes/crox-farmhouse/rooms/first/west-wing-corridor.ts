import * as THREE from 'three';
import { buildAngledWallSegment, buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * West wing upper corridor, trapezoidal upstairs shower room and walk-in cupboard.
 */
export function buildWestWingCorridor(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
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
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 5. WEST WING UPPER CORRIDOR, UPSTAIRS SHOWER ROOM & BEDROOM 3 RECESSED WARDROBE
  //    Matching `media_1790619089017.png` & Issues #6, #7, #8:
  //    - North `UP` Lobby (`Z = +2.33m..+3.35m, X = -19.02m..-16.92m`) receives the step-up
  //      portal from Upper Landing (`upperLandingCorridorArch`), with `bedroom2Door` on the
  //      North wall (`X = -18.78m..-18.06m`) and `showerRoomDoor` on the West wall (`X = -19.02m`).
  //    - At `Z = +3.35m` (immediately South of `showerRoomDoor`), the Walk-In Shower Enclosure
  //      steps East (`+X`) to `X = -18.25m`, narrowing the main West Wing Upper Corridor
  //      (`Z = +3.35m..+8.27m`) to `~1.05m` (`X = -18.175m..-17.12m` — Issue #6!).
  // =========================================================================
  // Upper Corridor & North `UP` Lobby polygonal carpeted floor (`oakFloorMat`)
  buildPolygonalFloorSlab(
    scene,
    [
      [-19.02, 2.33],
      [-17.891, 2.48],
      [-16.92, 2.61],
      [-17.23, 8.27],
      [-18.25, 8.27],
      [-18.25, 3.35],
      [-19.02, 3.35],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );
  // Trapezoidal Shower Room polygonal tiled floor (including SE walk-in shower alcove `X = -19.55m..-18.25m, Z = +3.35m..+4.30m`)
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 1.905],
      [-19.02, 2.33],
      [-19.02, 3.35],
      [-18.25, 3.35],
      [-18.25, 4.3],
      [-19.55, 4.3],
      [-19.55, 3.625],
      [-22.19, 3.625],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    bathroomTileMat,
    0.5
  );

  // West Front Exterior Brick Wall of Upstairs Shower Room (X = -22.47m..-22.19m, Z = +1.905m..+4.30m)
  // With 2-pane Georgian casement window centered at Z = +2.835m (directly above the Front Entrance Door IN — Photo 2!)
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    1.905,
    4.3,
    2.835,
    0.96,
    2.92,
    3.94,
    'east',
    2
  );

  // Continuous Flat East Courtyard Exterior Brick Wall along the West Wing Upper Corridor (Z = +2.61m..+8.15m)
  // With 3-pane Georgian casement window centered at Z = +5.92m (visible in Photo 1 & Photo 3!)
  addUpperBrickWallAlongZWithWindow(
    -17.39,
    -17.11,
    2.61,
    8.15,
    5.92,
    1.45,
    2.92,
    3.94,
    'west',
    3
  );

  // =========================================================================
  // UPSTAIRS SHOWER ROOM (`X = -22.19m..-19.02m, Z = +1.905m/+2.33m..+3.625m`
  // + SE Walk-In Shower Alcove `X = -19.55m..-18.25m, Z = +3.35m..+4.30m`)
  // =========================================================================
  // 1. Shower Room East Entrance Wall on the West side of the `UP` Lobby (`X = -19.02m, Z = +2.445m..+3.425m`)
  //    Starts cleanly at the South face (`Z = 2.445m`) of `bed2SouthWallFrame` with a 16.5cm corner pier
  //    West of `bedroom2Door` (Issue #7: zero doorframe collision!)
  buildAngledWallSegment(scene, interactions, {
    start: [-19.02, 2.445],
    end: [-19.02, 3.425],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true, // East (`+X`) face in the `UP` Lobby
    addBackSkirting: true,  // West (`-X`) face inside the dry Shower Room
    openings: [
      {
        id: 'showerRoomDoor',
        kind: 'hinged-door',
        uCenter: 0.49,
        width: 0.68,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'right',
        openAngle: -Math.PI * 0.45,
        initialOpenProgress: 0.2,
      },
    ],
  });

  // 2. Step-In Wall between the `UP` Lobby and the Walk-In Shower (`Z = +3.35m, X = -18.945m..-18.175m`)
  //    Front (`-Z`, North) faces the `UP` Lobby (with skirting); Back (`+Z`, South) faces inside the Walk-In Shower (no timber skirting!)
  buildAngledWallSegment(scene, interactions, {
    start: [-18.945, 3.35],
    end: [-18.175, 3.35],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: false,
  });

  // 3. East Corridor Wall of the Walk-In Shower (`X = -18.25m, Z = +3.425m..+4.30m`)
  //    Collinear with the Bedroom 3 East Corridor Wall (`X = -18.25m, Z = +4.30m..+8.15m`) so the corridor
  //    runs in one clean unbroken line at `X = -18.175m` with continuous skirting (Issues #6 & #8!)
  buildAngledWallSegment(scene, interactions, {
    start: [-18.25, 3.425],
    end: [-18.25, 4.3],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true, // East (`+X`) face in the Corridor
    addBackSkirting: false, // West (`-X`) face inside the wet Walk-In Shower
  });

  // 4. Shower Room West-South Wall behind Vanity Basin & WC (`Z = +3.625m, X = -22.19m..-19.55m`)
  //    Front (`-Z`, North) faces inside the dry Shower Room (with skirting); Back (`+Z`, South) is inside Bedroom 3's wardrobe
  buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 3.625],
    end: [-19.55, 3.625],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: false,
  });

  // 5. Dividing Partition Wall (`X = -19.55m, Z = +3.625m..+4.225m`) between SE Walk-In Shower Alcove and Bedroom 3 North Wardrobe
  buildAngledWallSegment(scene, interactions, {
    start: [-19.55, 3.625],
    end: [-19.55, 4.225],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false,
    addBackSkirting: false,
  });

  // 6. South Wall of SE Walk-In Shower Alcove (`Z = +4.30m, X = -19.625m..-18.325m`)
  //    Stops flush at the West face (`X = -18.325m`) of the Corridor wall so its skirting NEVER pokes through into the corridor (Issue #8!)
  buildAngledWallSegment(scene, interactions, {
    start: [-19.625, 4.3],
    end: [-18.325, 4.3],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // North (`-Z`) face inside the wet Walk-In Shower
    addBackSkirting: true,   // South (`+Z`) face inside Bedroom 3
  });

  // Walk-In Shower Enclosure in SE Alcove of Shower Room (`X = -19.475m..-18.325m, Z = +3.425m..+4.225m`)
  const srShowerTray = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.045, 0.78),
    ceramicWhiteMat
  );
  srShowerTray.name = 'showerRoom.showerTray';
  srShowerTray.position.set(-18.9, floorTopY + 0.022, 3.825);
  srShowerTray.receiveShadow = true;
  scene.add(srShowerTray);

  const srShowerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 1.88, 0.018),
    windowGlassMat
  );
  srShowerGlass.name = 'showerRoom.showerGlass';
  srShowerGlass.position.set(-18.64, floorTopY + 0.94, 3.435);
  scene.add(srShowerGlass);

  const srShowerRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.05, 10),
    brassMat
  );
  srShowerRiser.position.set(-18.38, floorTopY + 1.38, 3.825);
  scene.add(srShowerRiser);

  // Vanity Basin & Cabinet on South Wall (West side: X = -21.48m, Z = +3.36m, facing North `-Z`)
  const srVanityUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.78, 0.38),
    wardrobeMat
  );
  srVanityUnit.position.set(-21.48, floorTopY + 0.39, 3.36);
  srVanityUnit.castShadow = true;
  scene.add(srVanityUnit);

  const srBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.12, 0.4),
    ceramicWhiteMat
  );
  srBasin.position.set(-21.48, floorTopY + 0.82, 3.36);
  scene.add(srBasin);

  // WC Pan & Cistern on South Wall (Center: X = -20.52m, Z = +3.32m, facing North `-Z`)
  const srWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.42, 0.16),
    ceramicWhiteMat
  );
  srWcCistern.position.set(-20.52, floorTopY + 0.66, 3.46);
  scene.add(srWcCistern);

  const srWc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.42, 14),
    ceramicWhiteMat
  );
  srWc.position.set(-20.52, floorTopY + 0.21, 3.24);
  scene.add(srWc);

  // =========================================================================
  // BEDROOM 3 BUILT-IN NORTH WARDROBE (`X = -22.19m..-19.625m, Z = +3.68m..+4.30m`)
  // Opening South (`+Z`) into Bedroom 3 flush with the South wall of the Walk-In Shower (`Z = +4.30m`)
  // =========================================================================
  {
    const bed3WardGroup = new THREE.Group();
    bed3WardGroup.name = 'bedroom3.northWardrobe';
    const wardW = 2.5; // X = -22.16m .. -19.66m
    const wardH = upperWallTopY - floorTopY;
    const wardD = 0.6;
    const centerX = -20.91;
    const centerZ = 3.99;

    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(wardW, wardH, wardD),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + wardH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    bed3WardGroup.add(carcass);

    // 4 Shaker wardrobe doors along the South face (`Z = +4.30m`) facing South (`+Z`) into Bedroom 3
    const doorW = (wardW - 0.12) / 4;
    const doorLeafH = wardH - 0.22;
    for (let i = 0; i < 4; i++) {
      const doorX = centerX - wardW / 2 + 0.06 + doorW / 2 + i * (doorW + 0.01);
      const doorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(doorW - 0.015, doorLeafH, 0.022),
        wardrobeMat
      );
      doorMesh.position.set(doorX, floorTopY + 0.11 + doorLeafH / 2, 4.302);
      doorMesh.castShadow = true;
      bed3WardGroup.add(doorMesh);

      const isLeftLeaf = i % 2 === 0;
      const knobX = doorX + (isLeftLeaf ? doorW * 0.35 : -doorW * 0.35);
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 10, 10),
        brassMat
      );
      knob.position.set(knobX, floorTopY + 1.02, 4.32);
      bed3WardGroup.add(knob);
    }

    scene.add(bed3WardGroup);
  }
}
