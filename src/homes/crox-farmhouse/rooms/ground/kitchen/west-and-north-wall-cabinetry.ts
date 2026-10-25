import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  attachDrawerBoxBehindFront,
  buildHollowCabinetCarcass,
} from '../../../../../objects/joinery/cabinet-interior.ts';
import {
  type KitchenCabinetrySharedContext,
  nameCarcassHierarchy,
  nameDrawerBoxChildren,
  prepGeo,
} from './kitchen-joinery-shared.ts';

const sharedWestCornerBaseGeo = prepGeo(new THREE.BoxGeometry(0.65, 0.9, 0.66));
const sharedWestWorktopGeo = prepGeo(new THREE.BoxGeometry(0.68, 0.045, 1.39));
const sharedWestUpperCornerGeo = prepGeo(new THREE.BoxGeometry(0.38, 0.9, 0.39));
const sharedNorthLeftWorktopGeo = prepGeo(new THREE.BoxGeometry(0.818, 0.045, 0.68));
const sharedNorthRightWorktopGeo = prepGeo(new THREE.BoxGeometry(2.08, 0.045, 0.68));
const sharedNorthWestUpperCornerGeo = prepGeo(new THREE.BoxGeometry(0.37, 0.89, 0.37));

export function buildWestAndNorthLeftCabinetry(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const { scene, cutawayWallGroups, interactions } = ctx;
  const westGroup = scene;
  const northGroup = scene;
  const westUpperCutawayGroup = cutawayWallGroups.west;
  const { doveGreyMat, limestoneWorktopMat, addChromeKnob, addHowdensShakerDoor } = shared;

  // 1c. WEST WALL BASE COUNTERTOP & L-SHAPED CORNER TOP UNITS (Z = -2.50m to -1.11m, length 1.39m)
  //     Exposed worktop length halved from 1.45m to 0.73m (Z = -1.84m to -1.11m) so the Oven Tower & Fridge-Freezer clear the Kitchen entrance!
  const westBaseCountertopGroup = new THREE.Group();
  westBaseCountertopGroup.name = 'kitchen.cabinetry.west.baseCountertopGroup';

  // Blind corner base section (Z = -2.50m to -1.84m, length 0.66m) where North base cabinet meets West wall
  const westCornerBase = new THREE.Mesh(sharedWestCornerBaseGeo, doveGreyMat);
  westCornerBase.name = 'kitchen.cabinetry.west.baseCountertopGroup.blindCornerBase';
  westCornerBase.position.set(-4.07, 0.45, -2.17);
  westCornerBase.castShadow = true;
  westCornerBase.receiveShadow = true;
  westBaseCountertopGroup.add(westCornerBase);

  // Exposed double-door West base cabinet carcass (Z = -1.84m to -1.11m, center Z = -1.475m, length 0.73m)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      westBaseCountertopGroup,
      -4.07,
      0,
      -1.475,
      0.65,
      0.9,
      0.73,
      '+x',
      doveGreyMat,
      {
        plinthHeight: 0.14,
        interiorStyle: 'oak',
        shelfCount: 1,
        hasCenterMullion: true,
        includeItems: true,
      }
    ),
    'kitchen.cabinetry.west.baseCountertopGroup.doubleDoorCarcass'
  );

  const westTop = new THREE.Mesh(sharedWestWorktopGeo, limestoneWorktopMat);
  westTop.name = 'kitchen.cabinetry.west.baseCountertopGroup.worktop';
  westTop.position.set(-4.06, 0.92, -1.805);
  westTop.receiveShadow = true;
  westBaseCountertopGroup.add(westTop);

  westGroup.add(westBaseCountertopGroup);

  // 2 full-overlay Howdens Shaker base doors along the exposed West wall run (Z = -1.84m to -1.11m -> each 0.358m wide x 0.75m tall)
  for (const wz of [-1.656, -1.294] as const) {
    const hingeSideZ: -1 | 1 = wz < -1.475 ? -1 : 1;
    const knobZ = wz < -1.475 ? wz + 0.125 : wz - 0.125;
    const sideLabel = wz < -1.475 ? 'north' : 'south';
    const doorName = `kitchen.cabinetry.west.baseDoor.${sideLabel}`;
    const door = addHowdensShakerDoor(
      westGroup,
      wz,
      0.515,
      -3.745,
      0.358,
      0.75,
      'x',
      0.054,
      0.054,
      false,
      doorName
    );
    addChromeKnob(door, 0.03, 0.81 - 0.515, knobZ - wz, 'x', `${doorName}.knob`);
    const pivot = interactions.registerHingedDoor(
      westGroup,
      door,
      new THREE.Vector3(0.011, 0, hingeSideZ * (0.358 * 0.5 - 0.012)),
      'y',
      -hingeSideZ * Math.PI * 0.62
    );
    pivot.name = `${doorName}.pivot`;
  }

  const westUpperCupboardGroup = new THREE.Group();
  westUpperCupboardGroup.name = 'kitchen.cabinetry.west.upperCupboardGroup';

  // Blind corner upper section (Z = -2.50m to -2.11m, length 0.39m) where North-West upper meets West upper (top flush at Y = 2.42m)
  const westUpperCorner = new THREE.Mesh(sharedWestUpperCornerGeo, doveGreyMat);
  westUpperCorner.name = 'kitchen.cabinetry.west.upperCupboardGroup.blindCornerUpper';
  westUpperCorner.position.set(-4.21, 1.97, -2.305);
  westUpperCorner.castShadow = true;
  westUpperCorner.receiveShadow = true;
  westUpperCupboardGroup.add(westUpperCorner);

  // Exposed double-door West upper wall cupboard carcass (Z = -2.11m to -1.11m, center Z = -1.61m, length 1.00m, top flush at Y = 2.42m)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      westUpperCupboardGroup,
      -4.21,
      1.52,
      -1.61,
      0.38,
      0.9,
      1.0,
      '+x',
      doveGreyMat,
      {
        plinthHeight: 0,
        interiorStyle: 'oak',
        shelfCount: 2,
        hasCenterMullion: true,
        includeItems: true,
      }
    ),
    'kitchen.cabinetry.west.upperCupboardGroup.doubleDoorCarcass'
  );

  westUpperCutawayGroup.add(westUpperCupboardGroup);

  // 2 full-overlay Howdens Shaker upper wall cupboard doors along the West wall (Z = -2.11m to -1.11m -> each 0.492m wide x 0.88m tall)
  for (const uz of [-1.86, -1.36] as const) {
    const hingeSideZ: -1 | 1 = uz < -1.61 ? -1 : 1;
    const knobZ = uz < -1.61 ? uz + 0.185 : uz - 0.185;
    const sideLabel = uz < -1.61 ? 'north' : 'south';
    const doorName = `kitchen.cabinetry.west.upperDoor.${sideLabel}`;
    const door = addHowdensShakerDoor(
      westUpperCutawayGroup,
      uz,
      1.97,
      -4.02,
      0.492,
      0.88,
      'x',
      0.056,
      0.056,
      false,
      doorName
    );
    addChromeKnob(door, 0.03, 1.62 - 1.97, knobZ - uz, 'x', `${doorName}.knob`);
    const pivot = interactions.registerHingedDoor(
      westUpperCutawayGroup,
      door,
      new THREE.Vector3(0.011, 0, hingeSideZ * (0.492 * 0.5 - 0.012)),
      'y',
      -hingeSideZ * Math.PI * 0.62
    );
    pivot.name = `${doorName}.pivot`;
  }

  // =========================================================================
  // 2. NORTH BACK WALL RUN (Left of Wide AGA: X = -3.76m to -2.92m, at Z = -2.17m)
  // =========================================================================
  const northLeftBaseGroup = new THREE.Group();
  northLeftBaseGroup.name = 'kitchen.cabinetry.north.leftBaseGroup';

  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      northLeftBaseGroup,
      -3.335,
      0,
      -2.17,
      0.83,
      0.9,
      0.65,
      '+z',
      doveGreyMat,
      {
        plinthHeight: 0.14,
        interiorStyle: 'oak',
        shelfCount: 1,
        hasCenterMullion: true,
        includeItems: true,
      }
    ),
    'kitchen.cabinetry.north.leftBaseGroup.doubleDoorCarcass'
  );

  const topLeft = new THREE.Mesh(sharedNorthLeftWorktopGeo, limestoneWorktopMat);
  topLeft.name = 'kitchen.cabinetry.north.leftBaseGroup.worktop';
  topLeft.position.set(-3.309, 0.92, -2.16);
  topLeft.receiveShadow = true;
  northLeftBaseGroup.add(topLeft);

  northGroup.add(northLeftBaseGroup);

  // 2 full-overlay Howdens Shaker base doors between West corner (-3.745m) and AGA (-2.92m) -> each 0.406m wide x 0.75m tall
  for (const cx of [-3.54, -3.128] as const) {
    const hingeSideX: -1 | 1 = cx < -3.33 ? -1 : 1;
    const knobX = cx < -3.33 ? cx + 0.14 : cx - 0.14;
    const sideLabel = cx < -3.33 ? 'west' : 'east';
    const doorName = `kitchen.cabinetry.north.leftBaseDoor.${sideLabel}`;
    const door = addHowdensShakerDoor(
      northGroup,
      cx,
      0.515,
      -1.845,
      0.406,
      0.75,
      'z',
      0.056,
      0.056,
      false,
      doorName
    );
    addChromeKnob(door, knobX - cx, 0.81 - 0.515, 0.03, 'z', `${doorName}.knob`);
    const pivot = interactions.registerHingedDoor(
      northGroup,
      door,
      new THREE.Vector3(hingeSideX * (0.406 * 0.5 - 0.012), 0, 0.011),
      'y',
      hingeSideX * Math.PI * 0.62
    );
    pivot.name = `${doorName}.pivot`;
  }
}

export function buildNorthRightBaseCabinetry(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const { scene, interactions } = ctx;
  const northGroup = scene;
  const { doveGreyMat, limestoneWorktopMat, addChromeKnob, addHowdensShakerDoor } = shared;

  // =========================================================================
  // 4. INDUCTION HOB, DUALIT TOASTER & BASE UNIT TO THE RIGHT OF THE AGA (X = -1.40m to +0.66m, center X = -0.37m, width 2.06m)
  // =========================================================================
  const northRightBaseGroup = new THREE.Group();
  northRightBaseGroup.name = 'kitchen.cabinetry.north.rightBaseGroup';

  // Left half (X = -1.40m to -0.38m, width 1.02m): Hollow drawer carcass behind the 2 wide pan drawers
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      northRightBaseGroup,
      -0.89,
      0,
      -2.17,
      1.02,
      0.9,
      0.65,
      '+z',
      doveGreyMat,
      {
        plinthHeight: 0.14,
        interiorStyle: 'oak',
        shelfCount: 1,
        includeItems: false,
      }
    ),
    'kitchen.cabinetry.north.rightBaseGroup.panDrawerCarcass'
  );
  // Right half (X = -0.38m to +0.66m, width 1.04m): Hollow double-door base cupboard carcass
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      northRightBaseGroup,
      0.14,
      0,
      -2.17,
      1.04,
      0.9,
      0.65,
      '+z',
      doveGreyMat,
      {
        plinthHeight: 0.14,
        interiorStyle: 'oak',
        shelfCount: 1,
        hasCenterMullion: true,
        includeItems: true,
      }
    ),
    'kitchen.cabinetry.north.rightBaseGroup.doubleDoorCarcass'
  );

  const topRightRun = new THREE.Mesh(sharedNorthRightWorktopGeo, limestoneWorktopMat);
  topRightRun.name = 'kitchen.cabinetry.north.rightBaseGroup.worktop';
  topRightRun.position.set(-0.37, 0.92, -2.16);
  topRightRun.receiveShadow = true;
  northRightBaseGroup.add(topRightRun);

  northGroup.add(northRightBaseGroup);

  // 2 Wide Full-Overlay Howdens Shaker Pan Drawers under the Induction Hob (X = -1.40m to -0.38m, width 1.01m)
  for (const dy of [0.328, 0.704] as const) {
    const tierLabel = dy < 0.5 ? 'bottom' : 'top';
    const drawerName = `kitchen.cabinetry.north.panDrawer.${tierLabel}`;
    const panDrawer = addHowdensShakerDoor(
      northGroup,
      -0.89,
      dy,
      -1.845,
      1.01,
      0.37,
      'z',
      0.06,
      0.048,
      false,
      drawerName
    );

    // Pair of brushed stainless knobs on each wide pan drawer
    for (const [kIdx, kx] of ([-1.14, -0.64] as const).entries()) {
      const kSide = kIdx === 0 ? 'left' : 'right';
      addChromeKnob(panDrawer, kx - -0.89, 0.02, 0.03, 'z', `${drawerName}.knob.${kSide}`);
    }

    // Attach 3D oak dovetail drawer box + Le Creuset casserole & stainless saucepan inside the drawer!
    attachDrawerBoxBehindFront(panDrawer, 1.01, 0.35, 0.54, '+z', true);
    nameDrawerBoxChildren(panDrawer, drawerName);

    interactions.registerSlidingDrawer(panDrawer, new THREE.Vector3(0, 0, 0.42));
  }

  // 2 Full-Overlay Howdens Shaker Base Doors to the right of the Pan Drawers (X = -0.38m to +0.66m -> each 0.512m wide x 0.75m tall)
  for (const rx of [-0.12, 0.398] as const) {
    const hingeSideX: -1 | 1 = rx < 0.14 ? -1 : 1;
    const knobX = rx < 0.14 ? rx + 0.195 : rx - 0.195;
    const sideLabel = rx < 0.14 ? 'west' : 'east';
    const doorName = `kitchen.cabinetry.north.rightBaseDoor.${sideLabel}`;
    const door = addHowdensShakerDoor(
      northGroup,
      rx,
      0.515,
      -1.845,
      0.512,
      0.75,
      'z',
      0.062,
      0.062,
      false,
      doorName
    );
    addChromeKnob(door, knobX - rx, 0.81 - 0.515, 0.03, 'z', `${doorName}.knob`);
    const pivot = interactions.registerHingedDoor(
      northGroup,
      door,
      new THREE.Vector3(hingeSideX * (0.512 * 0.5 - 0.012), 0, 0.011),
      'y',
      hingeSideX * Math.PI * 0.62
    );
    pivot.name = `${doorName}.pivot`;
  }
}

export function buildNorthWestUpperCorniceAndUpstands(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const { scene, cutawayWallGroups, interactions } = ctx;
  const westGroup = scene;
  const northGroup = scene;
  const westUpperCutawayGroup = cutawayWallGroups.west;
  const northUpperCutawayGroup = cutawayWallGroups.north;
  const {
    doveGreyMat,
    limestoneWorktopMat,
    corniceVoidFloorMat,
    addChromeKnob,
    addHowdensShakerDoor,
  } = shared;

  // Single Upper Dove Grey Wall Cabinet along the North-West Back Wall (X = -4.40m to -3.45m, top flush at Y = 2.42m)
  const northWestUpperGroup = new THREE.Group();
  northWestUpperGroup.name = 'kitchen.cabinetry.north.northWestUpperGroup';

  // Blind left corner section behind West upper cupboard (X = -4.40m to -4.02m, width 0.38m)
  const northWestUpperCorner = new THREE.Mesh(sharedNorthWestUpperCornerGeo, doveGreyMat);
  northWestUpperCorner.name =
    'kitchen.cabinetry.north.northWestUpperGroup.blindCornerUpper';
  northWestUpperCorner.position.set(-4.21, 1.97, -2.305);
  northWestUpperCorner.castShadow = true;
  northWestUpperCorner.receiveShadow = true;
  northWestUpperGroup.add(northWestUpperCorner);

  // Exposed single-door North-West upper cupboard carcass (X = -4.02m to -3.45m, center X = -3.735m, width 0.57m, top flush at Y = 2.42m)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      northWestUpperGroup,
      -3.735,
      1.52,
      -2.31,
      0.57,
      0.9,
      0.38,
      '+z',
      doveGreyMat,
      {
        plinthHeight: 0,
        interiorStyle: 'oak',
        shelfCount: 2,
        includeItems: true,
      }
    ),
    'kitchen.cabinetry.north.northWestUpperGroup.singleDoorCarcass'
  );

  northUpperCutawayGroup.add(northWestUpperGroup);

  // Full-overlay Howdens Shaker door on the exposed front of the North-West Upper Cupboard (X = -4.02m to -3.45m -> 0.56m wide x 0.88m tall)
  const nwUpperDoorName = 'kitchen.cabinetry.north.northWestUpperDoor';
  const nwUpperDoor = addHowdensShakerDoor(
    northUpperCutawayGroup,
    -3.735,
    1.97,
    -2.12,
    0.56,
    0.88,
    'z',
    0.062,
    0.062,
    false,
    nwUpperDoorName
  );
  addChromeKnob(
    nwUpperDoor,
    -3.52 - -3.735,
    1.62 - 1.97,
    0.03,
    'z',
    `${nwUpperDoorName}.knob`
  );
  const nwUpperPivot = interactions.registerHingedDoor(
    northUpperCutawayGroup,
    nwUpperDoor,
    new THREE.Vector3(-(0.56 * 0.5 - 0.012), 0, 0.011),
    'y',
    -Math.PI * 0.62
  );
  nwUpperPivot.name = `${nwUpperDoorName}.pivot`;

  // =========================================================================
  // SINGLE CONTINUOUS CORNICE PLINTH ACROSS THE ENTIRE WEST + NORTH-WEST RUN
  // (Tall Fridge/Oven Towers Z=+0.53..-1.11 -> West Upper Z=-1.11..-2.50 -> NW Upper X=-4.40..-3.45)
  // Flush at baseY = 2.42m with ONE continuous recessed void and NO internal dividers or wall bars!
  // =========================================================================
  {
    const baseY = 2.42;
    const rimW = 0.032;

    const westTowerCorniceGroup = new THREE.Group();
    westTowerCorniceGroup.name = 'kitchen.cabinetry.west.towerCorniceGroup';
    const westUpperCorniceGroup = new THREE.Group();
    westUpperCorniceGroup.name = 'kitchen.cabinetry.west.upperCorniceGroup';
    const northUpperCorniceGroup = new THREE.Group();
    northUpperCorniceGroup.name = 'kitchen.cabinetry.north.upperCorniceGroup';

    // Continuous recessed void floor across all 3 connected cabinet sections at y = 2.422m
    const voidTowerFloor = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.68 - rimW, 0.004, 1.64 - rimW)),
      corniceVoidFloorMat
    );
    voidTowerFloor.name = 'kitchen.cabinetry.west.towerCorniceGroup.voidFloor';
    voidTowerFloor.position.set(
      -4.4 + (0.68 - rimW) * 0.5,
      baseY + 0.002,
      (-1.11 + (0.53 - rimW)) * 0.5
    );
    voidTowerFloor.receiveShadow = true;
    westTowerCorniceGroup.add(voidTowerFloor);

    const voidWestUpperFloor = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.38 - rimW, 0.004, 1.39)),
      corniceVoidFloorMat
    );
    voidWestUpperFloor.name = 'kitchen.cabinetry.west.upperCorniceGroup.voidFloor';
    voidWestUpperFloor.position.set(-4.4 + (0.38 - rimW) * 0.5, baseY + 0.002, -1.805);
    voidWestUpperFloor.receiveShadow = true;
    westUpperCorniceGroup.add(voidWestUpperFloor);

    const voidNwUpperFloor = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(-3.482 - (-4.4 + (0.38 - rimW)), 0.004, 0.38 - rimW)),
      corniceVoidFloorMat
    );
    voidNwUpperFloor.name = 'kitchen.cabinetry.north.upperCorniceGroup.voidFloor';
    voidNwUpperFloor.position.set(
      (-4.4 + (0.38 - rimW) + -3.482) * 0.5,
      baseY + 0.002,
      -2.5 + (0.38 - rimW) * 0.5
    );
    voidNwUpperFloor.receiveShadow = true;
    northUpperCorniceGroup.add(voidNwUpperFloor);

    const continuousTiers: ReadonlyArray<readonly [number, number, number]> = [
      [0.22, 0.018, 0.009],
      [0.46, 0.018, 0.027],
      [0.72, 0.018, 0.045],
      [1.0, 0.024, 0.066],
    ];

    for (let tIdx = 0; tIdx < continuousTiers.length; tIdx++) {
      const [frac, th, yOff] = continuousTiers[tIdx]!;
      const ov = 0.038 * frac;
      const tierY = baseY + yOff;
      const tierNo = tIdx + 1;

      const addSeg = (
        targetGroup: THREE.Group,
        segName: string,
        minX: number,
        maxX: number,
        minZ: number,
        maxZ: number
      ): void => {
        const seg = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(maxX - minX, th, maxZ - minZ)),
          doveGreyMat
        );
        seg.name = `${targetGroup.name}.tier_${tierNo}.${segName}`;
        seg.position.set((minX + maxX) * 0.5, tierY, (minZ + maxZ) * 0.5);
        seg.castShadow = true;
        seg.receiveShadow = true;
        targetGroup.add(seg);
      };

      // 1. South Return of Tall Fridge Tower (Z = +0.53m, from West wall X=-4.40 to East overhang X=-3.72+ov)
      addSeg(westTowerCorniceGroup, 'southReturn', -4.4, -3.72 + ov, 0.53 - rimW, 0.53 + ov);

      // 2. East Front of Tall Fridge & Oven Towers (X = -3.72m, from Z=-1.11-ov to South Return Z=0.53-rimW)
      addSeg(westTowerCorniceGroup, 'eastFront', -3.72 - rimW, -3.72 + ov, -1.11 - ov, 0.53 - rimW);

      // 3. Step-Back Return at Z = -1.11m ONLY across the 30cm step-back (X = -4.02-rimW to -3.72-rimW), leaving the void open!
      addSeg(westTowerCorniceGroup, 'stepBackReturn', -4.02 - rimW, -3.72 - rimW, -1.11 - ov, -1.11 + rimW);

      // 4. East Front of West Upper Cupboard (X = -4.02m, stopping at the inner L-corner Z = -2.12-rimW so there is NO corner divider!)
      addSeg(westUpperCorniceGroup, 'eastFront', -4.02 - rimW, -4.02 + ov, -2.12 - rimW, -1.11 - ov);

      // 5. South Front of North-West Upper Cupboard (Z = -2.12m, meeting Segment 4 at X = -4.02+ov and running East to X = -3.45+ov)
      addSeg(northUpperCorniceGroup, 'southFront', -4.02 + ov, -3.45 + ov, -2.12 - rimW, -2.12 + ov);

      // 6. East Return of North-West Upper Cupboard (X = -3.45m, from North wall Z=-2.50 to South Front Z=-2.12-rimW)
      addSeg(northUpperCorniceGroup, 'eastReturn', -3.45 - rimW, -3.45 + ov, -2.5, -2.12 - rimW);
    }

    westGroup.add(westTowerCorniceGroup);
    westUpperCutawayGroup.add(westUpperCorniceGroup);
    northUpperCutawayGroup.add(northUpperCorniceGroup);
  }

  // =========================================================================
  // 7. CARRARA MARBLE WORKTOP UPSTANDS (95mm tall x 22mm thick ONLY against plaster walls, not cupboard side panels)
  // =========================================================================
  const westUpstandsGroup = new THREE.Group();
  westUpstandsGroup.name = 'kitchen.cabinetry.west.worktopUpstands';
  const northUpstandsGroup = new THREE.Group();
  northUpstandsGroup.name = 'kitchen.cabinetry.north.worktopUpstands';

  const upstandSegments: ReadonlyArray<
    readonly [number, number, number, number, number, 'west' | 'north', string]
  > = [
    // [centerX, centerZ, widthX, depthZ, heightY, wallGroup, segName]
    // West plaster wall back upstand (Z = -2.50m to -1.11m)
    [-4.384, -1.805, 0.022, 1.39, 0.095, 'west', 'westWallBackUpstand'],
    // North plaster wall back upstand (X = -4.371m to -2.92m, left of AGA)
    [-3.6455, -2.484, 1.451, 0.022, 0.095, 'north', 'northWallLeftOfAgaUpstand'],
    // North plaster wall back upstand (X = -0.17m to +0.66m, right of backsplash behind Dualit toaster)
    [0.245, -2.484, 0.83, 0.022, 0.095, 'north', 'northWallBehindToasterUpstand'],
    // North plaster wall back upstand in the 15cm gap to the right of the upper pantry (X = +1.70m to +1.826m)
    [1.763, -2.484, 0.126, 0.022, 0.095, 'north', 'northWallPantryGapUpstand'],
    // Right worktop upstand against the X = +1.85m Utility Room West partition wall across the full 0.68m worktop depth (Z = -2.50m to -1.82m)
    [1.839, -2.16, 0.022, 0.68, 0.095, 'north', 'eastPartitionSideUpstand'],
  ];

  for (const [ux, uz, uw, ud, uh, groupKey, segName] of upstandSegments) {
    const targetGroup = groupKey === 'west' ? westUpstandsGroup : northUpstandsGroup;
    const upstand = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(uw, uh, ud)),
      limestoneWorktopMat
    );
    upstand.name = `${targetGroup.name}.${segName}`;
    upstand.position.set(ux, 0.9425 + uh * 0.5, uz);
    upstand.receiveShadow = true;
    targetGroup.add(upstand);
  }

  westGroup.add(westUpstandsGroup);
  northGroup.add(northUpstandsGroup);
}
