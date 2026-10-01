import * as THREE from 'three';
import {
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
} from '../../../../engine/geometry/index.ts';
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
    windowGlassMat,
  } = kit;

  const landingFloorTopY = 2.16;

  // =========================================================================
  // 5. WEST WING UPPER CORRIDOR, UPSTAIRS SHOWER ROOM & BEDROOM 3 RECESSED WARDROBE
  //    Matching `media_1790619089017.png` & Issues #3, #4, #5, #7, #8:
  //    - Open `UP` Step Threshold (`[-17.891, 2.48] -> [-16.92, 2.61]`) stepping 8cm
  //      down (`2.16m -> 2.08m`) from Upper Landing into the 3-bedroom West Wing!
  //    - North `UP` Lobby (`Z = +2.35m..+3.55m, X = -18.85m..-16.92m`) with `bedroom2Door`
  //      on the North wall and `showerRoomDoor` on the West wall (`X = -18.85m`).
  //    - Single straight cross-wall at `Z = +3.55m` (`X = -22.19m..-18.25m`) behind the
  //      Shower Room Basin & WC, with the walk-in shower entrance (`X = -20.08m..-19.22m`)
  //      leading into the East-West Walk-In Shower Enclosure (`X = -20.15m..-18.25m, Z = +3.55m..+4.30m`).
  //    - Bedroom 3 Built-In North Wardrobe (`X = -22.19m..-20.15m, Z = +3.55m..+4.30m`)
  //      opening South (`+Z`) into Bedroom 3 with Shaker doors & brass handles.
  // =========================================================================
  // Upper Corridor & North `UP` Lobby polygonal carpeted floor (`oakFloorMat`, Y = 2.08m)
  buildPolygonalFloorSlab(
    scene,
    [
      [-18.85, 2.35],
      [-17.891, 2.48],
      [-16.92, 2.61],
      [-17.23, 8.27],
      [-18.25, 8.27],
      [-18.25, 3.55],
      [-18.85, 3.55],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );

  // Carpeted 8cm (`2.08m -> 2.16m`) `UP` Step Riser & Rounded Bullnose Nosing along the open
  // threshold line (`[-17.891, 2.48] -> [-16.92, 2.61]`) between the 3-bedroom wing and Upper Landing!
  {
    const stepStartX = -17.891;
    const stepStartZ = 2.48;
    const stepEndX = -16.92;
    const stepEndZ = 2.61;
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

  // Trapezoidal Shower Room polygonal tiled floor (including East-West Walk-In Shower stall `X = -20.15m..-18.25m, Z = +3.55m..+4.30m`)
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 1.905],
      [-18.85, 2.35],
      [-18.85, 3.55],
      [-18.25, 3.55],
      [-18.25, 4.3],
      [-20.15, 4.3],
      [-20.15, 3.55],
      [-22.19, 3.55],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    bathroomTileMat,
    0.5
  );

  // West Front Exterior Brick Wall of Upstairs Shower Room (X = -22.47m..-22.19m, Z = +1.905m..+4.30m)
  // With 2-pane Georgian casement window centered at Z = +2.78m (directly above the Front Entrance Door IN — Photo 2!)
  // Skirting clamped to [2.045, 3.475] inside the dry Shower Room
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    1.905,
    4.3,
    2.78,
    0.96,
    2.92,
    3.94,
    'east',
    2,
    { skirtingMin: 2.045, skirtingMax: 3.475 }
  );

  // Continuous Flat East Courtyard Exterior Brick Wall along the West Wing Upper Corridor (Z = +2.61m..+8.15m)
  // Issue #3: Emits ONE single continuous sheared skirting run from Z = +2.61m to Z = +8.15m!
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
    3,
    { skirtingMin: 2.61, skirtingMax: 8.15 }
  );

  // =========================================================================
  // UPSTAIRS SHOWER ROOM (`X = -22.19m..-18.85m, Z = +1.905m/+2.35m..+3.55m`
  // + Walk-In Shower Stall `X = -20.15m..-18.25m, Z = +3.55m..+4.30m`)
  // =========================================================================
  // 1. Shower Room East Entrance Wall on the West side of the `UP` Lobby (`X = -18.85m, Z = +2.42m..+3.55m`)
  buildAngledWallSegment(scene, interactions, {
    start: [-18.85, 2.42],
    end: [-18.85, 3.55],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Corridor/Lobby side uses continuous 45°-mitred skirting below
    addBackSkirting: true,   // West (`-X`) face inside the dry Shower Room
    backSkirtingExclusions: [[1.04, 1.15]],
    openings: [
      {
        id: 'showerRoomDoor',
        kind: 'hinged-door',
        uCenter: 0.565,
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

  // 2. Straight Z = +3.55m Partition Wall:
  //    2a. West section behind Vanity Basin & WC (`Z = +3.55m, X = -22.19m..-20.08m`)
  buildAngledWallSegment(scene, interactions, {
    start: [-22.19, 3.55],
    end: [-20.08, 3.55],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,  // North (`-Z`) face inside the dry Shower Room
    addBackSkirting: false,  // South (`+Z`) face is inside Bedroom 3's built-in wardrobe
  });

  //    2b. East section forming the North wall of the Walk-In Shower & South wall of the `UP` Lobby (`Z = +3.55m, X = -19.22m..-18.175m`)
  //        (Leaves `X = -20.08m..-19.22m` open as the 0.86m walk-in entry into the shower from inside the Shower Room!)
  buildAngledWallSegment(scene, interactions, {
    start: [-19.22, 3.55],
    end: [-18.175, 3.55],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // Lobby side (`X = -18.775m..-18.175m`) uses continuous 45°-mitred skirting
    addBackSkirting: false,  // South (`+Z`) face is inside the wet Walk-In Shower
  });

  // 3. Dividing Wall (`X = -20.15m, Z = +3.55m..+4.30m`) between Walk-In Shower Stall (East) and Bedroom 3 North Wardrobe (West)
  buildAngledWallSegment(scene, interactions, {
    start: [-20.15, 3.55],
    end: [-20.15, 4.3],
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

  // 4. South Wall of Walk-In Shower Stall (`Z = +4.30m, X = -20.225m..-18.325m`)
  buildAngledWallSegment(scene, interactions, {
    start: [-20.225, 4.3],
    end: [-18.325, 4.3],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: false, // North (`-Z`) face inside the wet Walk-In Shower
    addBackSkirting: false,  // Bedroom 3 emits one continuous North skirting across both wardrobe and shower wall
  });

  // Walk-In Shower Enclosure (`X = -20.075m..-18.325m, Z = +3.625m..+4.225m`, matching `media_1790619089017.png`)
  const srShowerTray = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.045, 0.58),
    ceramicWhiteMat
  );
  srShowerTray.name = 'showerRoom.showerTray';
  srShowerTray.position.set(-19.2, floorTopY + 0.022, 3.925);
  srShowerTray.receiveShadow = true;
  scene.add(srShowerTray);

  const srShowerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 1.88, 0.018),
    windowGlassMat
  );
  srShowerGlass.name = 'showerRoom.showerGlass';
  srShowerGlass.position.set(-19.48, floorTopY + 0.94, 3.625);
  scene.add(srShowerGlass);

  const srShowerRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.05, 10),
    brassMat
  );
  srShowerRiser.position.set(-18.38, floorTopY + 1.38, 3.925);
  scene.add(srShowerRiser);

  // Vanity Basin & Cabinet on Z = +3.55m South Wall (West side: X = -21.55m, Z = +3.28m, facing North `-Z`)
  const srVanityUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.78, 0.38),
    wardrobeMat
  );
  srVanityUnit.position.set(-21.55, floorTopY + 0.39, 3.28);
  srVanityUnit.castShadow = true;
  scene.add(srVanityUnit);

  const srBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.12, 0.4),
    ceramicWhiteMat
  );
  srBasin.position.set(-21.55, floorTopY + 0.82, 3.28);
  scene.add(srBasin);

  // WC Pan & Cistern on Z = +3.55m South Wall (Center: X = -20.65m, Z = +3.24m, facing North `-Z`)
  const srWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.42, 0.16),
    ceramicWhiteMat
  );
  srWcCistern.position.set(-20.65, floorTopY + 0.66, 3.38);
  scene.add(srWcCistern);

  const srWc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.42, 14),
    ceramicWhiteMat
  );
  srWc.position.set(-20.65, floorTopY + 0.21, 3.16);
  scene.add(srWc);

  // =========================================================================
  // BEDROOM 3 BUILT-IN NORTH WARDROBE (`X = -22.19m..-20.225m, Z = +3.625m..+4.375m`)
  // Opening South (`+Z`) into Bedroom 3 flush with the South wall of the Walk-In Shower (`Z = +4.375m`)
  // =========================================================================
  {
    const bed3WardGroup = new THREE.Group();
    bed3WardGroup.name = 'bedroom3.northWardrobe';
    const wardW = 1.965; // X = -22.19m .. -20.225m
    const wardH = upperWallTopY - floorTopY;
    const wardD = 0.72; // Z = +3.64m .. +4.36m
    const centerX = -21.2075;
    const centerZ = 4.0;

    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(wardW, wardH, wardD),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + wardH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    bed3WardGroup.add(carcass);

    // 4 Shaker wardrobe doors (2 pairs) along the South face (`Z = +4.373m`) with vertical brass bar handles (Issue #8)
    const doorW = (wardW - 0.12) / 4;
    const doorLeafH = wardH - 0.24;
    for (let i = 0; i < 4; i++) {
      const doorX = centerX - wardW / 2 + 0.06 + doorW / 2 + i * (doorW + 0.01);
      addShakerWardrobeDoor(bed3WardGroup, {
        x: doorX,
        y: floorTopY + 0.15 + doorLeafH / 2,
        z: 4.373,
        width: doorW - 0.012,
        height: doorLeafH,
        alongZ: false,
        normalSign: 1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `bedroom3.northWardrobe.door_${i + 1}`,
      });
    }

    // Continuous North skirting board across Bedroom 3 (`X = -22.19m..-18.325m` along `Z = +4.375m`)
    const bed3NorthSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-22.19, 4.375],
          [-18.325, 4.375],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    bed3NorthSkirt.name = 'bedroom3.northWallMitredSkirting';
    bed3NorthSkirt.castShadow = true;
    bed3NorthSkirt.receiveShadow = true;
    scene.add(bed3NorthSkirt);

    scene.add(bed3WardGroup);
  }
}
