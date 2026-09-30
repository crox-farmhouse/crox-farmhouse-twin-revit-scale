import * as THREE from 'three';
import { buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * West wing upper corridor, trapezoidal upstairs shower room and walk-in cupboard.
 */
export function buildWestWingCorridor(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addUpperBrickWallAlongZWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    bathroomTileMat,
    brassMat,
    ceramicWhiteMat,
    doorH,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wardrobeMat,
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 5. WEST WING UPPER CORRIDOR, UPSTAIRS SHOWER ROOM & BEDROOM 3 RECESSED WARDROBE
  //    Directly above the tapering Front Entrance Hallway (`entranceHall`):
  //    - North Lobby (`UP`) receives the step-up portal from Upper Landing (`[-17.72, 1.60]`)
  //      and leads directly to Bedroom 2 (`[-18.23, 0.88] -> [-18.84, 2.353]`) or South along the corridor
  // =========================================================================
  // Upper Corridor polygonal floor along the flat angled East Courtyard wall
  buildPolygonalFloorSlab(
    scene,
    [
      [-18.84, 2.353],
      [-17.891, 2.48],
      [-16.97, 2.61],
      [-17.23, 8.27],
      [-18.84, 8.27],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );
  // Trapezoidal Shower Room polygonal floor (including SE walk-in shower alcove)
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 1.905],
      [-18.84, 2.353],
      [-18.84, 4.3],
      [-20.15, 4.3],
      [-20.15, 3.625],
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
  // UPSTAIRS SHOWER ROOM (`X = -22.19m..-18.915m, Z = +1.905m/+2.353m..+3.625m` + SE Shower Alcove `Z = +3.625m..+4.30m`)
  // Matching `ff_rotated_3d_axes.png` & `media_1790619089017.png`:
  // - South wall at Z = +3.625m from X = -22.19m to X = -20.15m (behind Vanity Basin & WC)
  // - Walk-in Shower Enclosure recessed into the SE alcove (`X = -20.15m..-18.915m, Z = +3.55m..+4.30m`)
  // - Corridor entrance door on the East wall (`X = -18.915m`, centered at `Z = +2.92m`)
  // =========================================================================
  // Shower Room West-South Wall at Z = +3.625m (X = -22.19m..-20.15m, length = 2.04m)
  addUpperInteriorWall(-21.17, floorTopY, upperWallTopY, 3.625, 2.04, 0.15, warmRoomPlasterMat);

  // Dividing Partition Wall at X = -20.15m (Z = +3.625m..+4.30m) between SE Walk-In Shower Alcove and Bedroom 3 North Wardrobe
  addUpperInteriorWall(-20.15, floorTopY, upperWallTopY, 3.9625, 0.15, 0.675, warmRoomPlasterMat);

  // Shower Room East Corridor Wall (X = -18.915m, Z = +2.353m..+4.30m) with hinged door at Z = +2.92m
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 2.454, 0.15, 0.202, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 3.7875, 0.15, 1.025, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY + doorH, upperWallTopY, 2.915, 0.15, 0.72, warmRoomPlasterMat);
  addUpperInteractiveDoor('z', -18.915, 0.15, 2.915, 0.72, -Math.PI * 0.45);

  // Walk-In Shower Enclosure in SE Alcove of Shower Room (`X = -20.075m..-18.99m, Z = +3.55m..+4.225m`)
  const srShowerTray = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.045, 0.68),
    ceramicWhiteMat
  );
  srShowerTray.name = 'showerRoom.showerTray';
  srShowerTray.position.set(-19.53, floorTopY + 0.022, 3.885);
  srShowerTray.receiveShadow = true;
  scene.add(srShowerTray);

  const srShowerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 1.88, 0.018),
    windowGlassMat
  );
  srShowerGlass.name = 'showerRoom.showerGlass';
  srShowerGlass.position.set(-19.31, floorTopY + 0.94, 3.555);
  scene.add(srShowerGlass);

  const srShowerRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.05, 10),
    brassMat
  );
  srShowerRiser.position.set(-19.05, floorTopY + 1.38, 3.885);
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

  // WC Pan & Cistern on South Wall (Center: X = -20.62m, Z = +3.32m, facing North `-Z`)
  const srWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.42, 0.16),
    ceramicWhiteMat
  );
  srWcCistern.position.set(-20.62, floorTopY + 0.66, 3.46);
  scene.add(srWcCistern);

  const srWc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.42, 14),
    ceramicWhiteMat
  );
  srWc.position.set(-20.62, floorTopY + 0.21, 3.24);
  scene.add(srWc);

  // =========================================================================
  // SOUTH WALL OF SHOWER ALCOVE & BEDROOM 3 BUILT-IN NORTH WARDROBE
  // (`Z = +3.625m..+4.30m, X = -22.19m..-20.15m`)
  // Matching `ff_rotated_3d_axes.png`: the West half of the strip between the
  // Shower Room and Bedroom 3 is Bedroom 3's recessed built-in wardrobe opening South (`+Z`)!
  // =========================================================================
  // South Wall behind the SE Walk-In Shower Alcove (`Z = +4.30m, X = -20.15m..-18.84m`, length = 1.31m)
  addUpperInteriorWall(-19.495, floorTopY, upperWallTopY, 4.3, 1.31, 0.15, warmRoomPlasterMat);

  // Bedroom 3 Built-In North Wardrobe (`X = -22.19m..-20.15m, Z = +3.68m..+4.30m`, opening South into Bedroom 3)
  {
    const bed3WardGroup = new THREE.Group();
    bed3WardGroup.name = 'bedroom3.northWardrobe';
    const wardW = 1.98; // X = -22.16m .. -20.18m
    const wardH = upperWallTopY - floorTopY;
    const wardD = 0.6;
    const centerX = -21.17;
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
