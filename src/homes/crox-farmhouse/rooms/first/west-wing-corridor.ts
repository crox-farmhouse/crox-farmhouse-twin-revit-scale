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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addUpperBrickWallAlongZWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
    bathroomTileMat,
    brassMat,
    ceramicWhiteMat,
    doorH,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 5. WEST WING UPPER CORRIDOR, TRAPEZOIDAL SHOWER ROOM & WALK-IN CUPBOARD
  //    Directly above the tapering Front Entrance Hallway (`entranceHall`):
  //    - North boundary: straight angled wall [-22.19, 1.905] -> [-18.84, 2.353] -> [-17.891, 2.48] -> [-16.92, 2.61]
  //    - Shower Room South wall at Z = +3.625m (directly above entranceHall South wall!)
  // =========================================================================
  // Upper Corridor polygonal floor along East Courtyard wall
  buildPolygonalFloorSlab(
    scene,
    [
      [-18.84, 2.353],
      [-17.891, 2.48],
      [-16.92, 2.61],
      [-17.0, 3.625],
      [-17.39, 3.625],
      [-17.39, 8.27],
      [-18.84, 8.27],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );
  // Trapezoidal Shower Room & Cupboard polygonal floor (X = -22.19m..-18.84m, Z = +1.905m/+2.353m..+4.30m)
  buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 1.905],
      [-18.84, 2.353],
      [-18.84, 4.3],
      [-22.19, 4.3],
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

  // 80cm East Return Wall of Upper Corridor ([-16.92, 2.61] -> [-17.00, 3.625], directly above Front Entrance Hallway East return!)
  buildAngledWallSegment(scene, interactions, {
    start: [-16.92, 2.61],
    end: [-17.0, 3.625],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: exteriorBrickMat,
    frontFaceMaterial: warmRoomPlasterMat,
    backFaceMaterial: exteriorBrickMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: false,
  });
  // Short Courtyard Step-In Return Wall ([-17.00, 3.625] -> [-17.39, 3.625])
  buildAngledWallSegment(scene, interactions, {
    start: [-17.0, 3.625],
    end: [-17.39, 3.625],
    thickness: 0.28,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: exteriorBrickMat,
    frontFaceMaterial: warmRoomPlasterMat,
    backFaceMaterial: exteriorBrickMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true,
    addBackSkirting: false,
  });

  // East Courtyard Exterior Brick Wall along the West Wing Upper Corridor (X = -17.39m..-17.11m, Z = +3.625m..+8.15m)
  // With 3-pane Georgian casement window centered at Z = +5.92m (visible in Photo 1 & Photo 3!)
  addUpperBrickWallAlongZWithWindow(
    -17.39,
    -17.11,
    3.625,
    8.15,
    5.92,
    1.45,
    2.92,
    3.94,
    'west',
    3
  );

  // =========================================================================
  // TRAPEZOIDAL UPSTAIRS SHOWER ROOM (`X = -22.19m..-18.915m, Z = +1.905m/+2.353m..+3.625m`)
  // Matching `media_1790619089017.png`:
  // - South wall at Z = +3.625m (directly above Ground Floor entranceHall South wall)
  // - Vanity basin (West) & WC (center) along the South wall (Z = +3.625m)
  // - Walk-in Shower Tray & glass screen tucked into the SE recess (X = -19.85m..-18.915m, Z = +2.98m..+3.625m)
  // - Corridor entrance door on the East wall (`X = -18.915m`, centered at `Z = +2.90m`)
  // =========================================================================
  // Shower Room South Wall at Z = +3.625m (X = -22.19m..-18.915m)
  addUpperInteriorWall(-20.5525, floorTopY, upperWallTopY, 3.625, 3.275, 0.15, warmRoomPlasterMat);

  // Shower Room East Corridor Wall (X = -18.915m, Z = +2.48m..+3.625m) with hinged door at Z = +2.92m
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 2.515, 0.15, 0.08, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 3.45, 0.15, 0.35, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY + doorH, upperWallTopY, 2.915, 0.15, 0.72, warmRoomPlasterMat);
  addUpperInteractiveDoor('z', -18.915, 0.15, 2.915, 0.72, -Math.PI * 0.45);

  // Walk-In Shower Enclosure in SE Recess of Shower Room (X = -19.85m..-18.99m, Z = +2.98m..+3.55m)
  const srShowerTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.045, 0.56),
    ceramicWhiteMat
  );
  srShowerTray.name = 'showerRoom.showerTray';
  srShowerTray.position.set(-19.42, floorTopY + 0.022, 3.27);
  srShowerTray.receiveShadow = true;
  scene.add(srShowerTray);

  const srShowerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 1.86, 0.018),
    windowGlassMat
  );
  srShowerGlass.name = 'showerRoom.showerGlass';
  srShowerGlass.position.set(-19.59, floorTopY + 0.93, 2.99);
  scene.add(srShowerGlass);

  const srShowerRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.05, 10),
    brassMat
  );
  srShowerRiser.position.set(-19.06, floorTopY + 1.38, 3.27);
  scene.add(srShowerRiser);

  // Vanity Basin & Pedestal/Cabinet on South Wall (West side: X = -21.35m, Z = +3.36m, facing North `-Z`)
  const srVanityUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.78, 0.38),
    wardrobeMat
  );
  srVanityUnit.position.set(-21.35, floorTopY + 0.39, 3.36);
  srVanityUnit.castShadow = true;
  scene.add(srVanityUnit);

  const srBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.12, 0.4),
    ceramicWhiteMat
  );
  srBasin.position.set(-21.35, floorTopY + 0.82, 3.36);
  scene.add(srBasin);

  // WC Pan & Cistern on South Wall (Center: X = -20.48m, Z = +3.32m, facing North `-Z`)
  const srWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.42, 0.16),
    ceramicWhiteMat
  );
  srWcCistern.position.set(-20.48, floorTopY + 0.66, 3.46);
  scene.add(srWcCistern);

  const srWc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.42, 14),
    ceramicWhiteMat
  );
  srWc.position.set(-20.48, floorTopY + 0.21, 3.24);
  scene.add(srWc);

  // =========================================================================
  // WALK-IN CORRIDOR CUPBOARD & RECESSED ALCOVE (`Z = +3.625m..+4.30m, X = -22.19m..-18.915m`)
  // =========================================================================
  addUpperInteriorWall(-20.1, floorTopY, upperWallTopY, 3.9625, 0.15, 0.675, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 3.9625, 0.15, 0.675, warmRoomPlasterMat);

  // South Partition Wall of Cupboard / North Wall of Bedroom 3 (Z = +4.30m, X = -18.84m..-22.19m)
  addUpperInteriorWall(-20.515, floorTopY, upperWallTopY, 4.3, 3.35, 0.15, warmRoomPlasterMat);
}
