import * as THREE from 'three';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../types/scene.ts';
import type { createFirstFloorMaterials } from './first-floor-materials.ts';

/**
 * First-floor shell kit: slab, wall, window and door helpers plus brick UV mapping.
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function createFirstFloorShellKit(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'plasterMat' | 'skirtingMat' | 'stoneSillMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowFrameMat' | 'windowGlassMat'>
) {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    plasterMat,
    skirtingMat,
    stoneSillMat,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
    windowFrameMat,
    windowGlassMat,
  } = kit;
  const courtyardZShift =
    (scene.userData?.containerOffset as THREE.Vector3 | undefined)?.z ?? 0;

  // World-space UV mapper so Imperial Brick courses (1.44m wide x 1.328m tall per 16-course tile)
  // align seamlessly with the Ground Floor brick walls below (Y = 0.00m..3.00m)!
  const applyWorldSpaceBrickUVs = (
    geo: THREE.BufferGeometry,
    offsetX: number,
    offsetY: number,
    offsetZ: number
  ): void => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return;

    const tileW = 1.35;
    const tileH = 1.2;

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + offsetX;
      const wy = pos.getY(i) + offsetY;
      const wz = pos.getZ(i) + offsetZ + courtyardZShift;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));

      if (nx >= nz && nx >= ny) {
        uv.setXY(i, wz / tileW, wy / tileH);
      } else if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else {
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
  };

  /**
   * Attaches a `CutawayWallDescriptor` (`floor: 'first'`) to a mesh or group so `KitchenScene`
   * can dynamically hide camera-facing walls when inspecting First Floor rooms.
   */
  const tagUpperCutawayWall = (
    obj: THREE.Object3D,
    descriptor: CutawayWallDescriptor
  ): void => {
    obj.userData.isCutawayWall = true;
    obj.userData.cutawayWall = descriptor;
  };

  /**
   * Builds a First Floor structural floor/ceiling slab segment (`Y = 3.00m..3.14m`)
   * with warm plaster on its underside (`-Y`, Ground Floor ceiling) and floor finish on top (`+Y`).
   */
  const addFirstFloorSlab = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    topFloorMat: THREE.Material = oakFloorMat
  ): void => {
    const w = maxX - minX;
    const d = maxZ - minZ;
    const h = floorTopY - floorBaseY;
    const cx = (minX + maxX) / 2;
    const cy = (floorBaseY + floorTopY) / 2;
    const cz = (minZ + maxZ) / 2;

    const mats: THREE.Material[] = [
      plasterMat,
      plasterMat,
      topFloorMat, // +Y (First Floor walking surface)
      plasterMat,  // -Y (Ground Floor ceiling)
      plasterMat,
      plasterMat,
    ];
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    slab.position.set(cx, cy, cz);
    slab.castShadow = true;
    slab.receiveShadow = true;
    scene.add(slab);
  };

  /**
   * Builds an interior First Floor wall segment (`Y = 3.14m..5.70m`) with a cutaway cap on top
   * and antique oak skirting boards along the floor when `yBottom <= floorTopY + 0.05`.
   */
  const addUpperInteriorWall = (
    x: number,
    yBottom: number,
    yTop: number,
    z: number,
    w: number,
    d: number,
    mat: THREE.Material = warmRoomPlasterMat
  ): void => {
    const h = yTop - yBottom;
    const cy = (yBottom + yTop) / 2;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, cy, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    if (Math.abs(yTop - upperWallTopY) < 0.05) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.004, 0.025, d + 0.004),
        wallCapMat
      );
      cap.position.set(x, upperWallTopY + 0.012, z);
      scene.add(cap);
    }

    if (yBottom <= floorTopY + 0.05 && h > 1.2) {
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.026, 0.14, d + 0.026),
        antiqueOakSkirtingMat
      );
      skirt.position.set(x, floorTopY + 0.07, z);
      skirt.receiveShadow = true;
      scene.add(skirt);

      const skirtCap = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.036, 0.024, d + 0.036),
        antiqueOakSkirtingMat
      );
      skirtCap.position.set(x, floorTopY + 0.146, z);
      skirtCap.receiveShadow = true;
      scene.add(skirtCap);
    }
  };

  /**
   * Builds a 0.28m First Floor exterior brick wall segment (`Y = 3.00m..5.70m`) with world-space
   * Imperial Brick UVs on the exterior faces and warm plaster + antique oak skirting on the interior face.
   */
  const addUpperExteriorBrickWall = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    yBottom: number,
    yTop: number,
    interiorSide: 'north' | 'south' | 'east' | 'west'
  ): void => {
    const w = maxX - minX;
    const d = maxZ - minZ;
    const h = yTop - yBottom;
    const cx = (minX + maxX) / 2;
    const cy = (yBottom + yTop) / 2;
    const cz = (minZ + maxZ) / 2;
    const descriptor: CutawayWallDescriptor =
      interiorSide === 'north' || interiorSide === 'south'
        ? { axis: 'z', coord: cz, minSpan: minX, maxSpan: maxX, floor: 'first' }
        : { axis: 'x', coord: cx, minSpan: minZ, maxSpan: maxZ, floor: 'first' };

    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, cx, cy, cz);

    const materials: THREE.Material[] = [
      interiorSide === 'east' ? warmRoomPlasterMat : exteriorBrickMat,
      interiorSide === 'west' ? warmRoomPlasterMat : exteriorBrickMat,
      exteriorBrickMat,
      exteriorBrickMat,
      interiorSide === 'south' ? warmRoomPlasterMat : exteriorBrickMat,
      interiorSide === 'north' ? warmRoomPlasterMat : exteriorBrickMat,
    ];

    const brickMesh = new THREE.Mesh(geo, materials);
    brickMesh.position.set(cx, cy, cz);
    brickMesh.castShadow = true;
    brickMesh.receiveShadow = true;
    tagUpperCutawayWall(brickMesh, descriptor);
    scene.add(brickMesh);

    if (Math.abs(yTop - upperWallTopY) < 0.05) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(0.02, w - 0.012), 0.016, Math.max(0.02, d - 0.012)),
        wallCapMat
      );
      cap.position.set(cx, upperWallTopY - 0.006, cz);
      tagUpperCutawayWall(cap, descriptor);
      scene.add(cap);
    }

    if (yBottom <= floorTopY + 0.05) {
      const skirtT = 0.024;
      let sx = cx;
      let sz = cz;
      let sw = w;
      let sd = d;
      if (interiorSide === 'north') {
        sz = minZ - 0.01;
        sd = skirtT;
      } else if (interiorSide === 'south') {
        sz = maxZ + 0.01;
        sd = skirtT;
      } else if (interiorSide === 'east') {
        sx = maxX + 0.01;
        sw = skirtT;
      } else {
        sx = minX - 0.01;
        sw = skirtT;
      }
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(sw, 0.14, sd),
        antiqueOakSkirtingMat
      );
      skirt.position.set(sx, floorTopY + 0.07, sz);
      skirt.receiveShadow = true;
      tagUpperCutawayWall(skirt, descriptor);
      scene.add(skirt);
    }
  };

  /**
   * Builds a First Floor exterior brick wall along X (North or South facade) with a Georgian casement window.
   */
  const addUpperBrickWallAlongXWithWindow = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    winCenterX: number,
    winWidth: number,
    sillY: number,
    headY: number,
    interiorSide: 'north' | 'south',
    panes = 2
  ): void => {
    const winLeft = winCenterX - winWidth / 2;
    const winRight = winCenterX + winWidth / 2;

    if (winLeft > minX + 0.02) {
      addUpperExteriorBrickWall(minX, winLeft, minZ, maxZ, floorBaseY, upperWallTopY, interiorSide);
    }
    if (winRight < maxX - 0.02) {
      addUpperExteriorBrickWall(winRight, maxX, minZ, maxZ, floorBaseY, upperWallTopY, interiorSide);
    }
    addUpperExteriorBrickWall(winLeft, winRight, minZ, maxZ, floorBaseY, sillY, interiorSide);
    addUpperExteriorBrickWall(winLeft, winRight, minZ, maxZ, headY, upperWallTopY, interiorSide);

    const cz = (minZ + maxZ) / 2;
    const winH = headY - sillY;
    const cy = sillY + winH / 2;
    const winGroup = new THREE.Group();
    tagUpperCutawayWall(winGroup, {
      axis: 'z',
      coord: cz,
      minSpan: minX,
      maxSpan: maxX,
      floor: 'first',
    });

    const wallDepthZ = maxZ - minZ;
    const extSignZ = interiorSide === 'south' ? -1 : 1;
    const intSignZ = -extSignZ;
    const sillDepthZ = wallDepthZ * 0.54 + 0.045;
    const sillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + 0.12, 0.06, sillDepthZ),
      stoneSillMat
    );
    sillMesh.position.set(
      winCenterX,
      sillY - 0.02,
      cz + extSignZ * (wallDepthZ * 0.23 + 0.022)
    );
    winGroup.add(sillMesh);

    // Interior plastered window reveal linings (jambs + head soffit) and painted timber window board
    const intRevealDepthZ = wallDepthZ * 0.52;
    const intRevealCenterZ = cz + intSignZ * (wallDepthZ * 0.24);
    for (const sideX of [-1, 1] as const) {
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, winH, intRevealDepthZ),
        warmRoomPlasterMat
      );
      revealJamb.position.set(
        winCenterX + sideX * (winWidth * 0.5 - 0.005),
        cy,
        intRevealCenterZ
      );
      revealJamb.receiveShadow = true;
      winGroup.add(revealJamb);
    }
    const revealHead = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.012, intRevealDepthZ),
      warmRoomPlasterMat
    );
    revealHead.position.set(winCenterX, headY - 0.005, intRevealCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    const windowBoard = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + 0.04, 0.024, intRevealDepthZ + 0.028),
      skirtingMat
    );
    windowBoard.position.set(
      winCenterX,
      sillY + 0.01,
      cz + intSignZ * (wallDepthZ * 0.25 + 0.012)
    );
    windowBoard.receiveShadow = true;
    winGroup.add(windowBoard);

    const frameDepth = 0.11;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.05, frameDepth),
      windowFrameMat
    );
    topRail.position.set(winCenterX, headY - 0.025, cz);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.05, frameDepth),
      windowFrameMat
    );
    botRail.position.set(winCenterX, sillY + 0.025, cz);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mx = winLeft + (i / panes) * winWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, winH, frameDepth),
        windowFrameMat
      );
      mullion.position.set(mx, cy, cz);
      winGroup.add(mullion);
    }

    const transBar = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.026, frameDepth * 0.7),
      windowFrameMat
    );
    transBar.position.set(winCenterX, sillY + winH * 0.52, cz);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth - 0.06, winH - 0.08, 0.016),
      windowGlassMat
    );
    glass.position.set(winCenterX, cy, cz);
    winGroup.add(glass);

    scene.add(winGroup);
  };

  /**
   * Builds a First Floor exterior brick wall along Z (East or West facade) with a Georgian casement window.
   */
  const addUpperBrickWallAlongZWithWindow = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    winCenterZ: number,
    winWidth: number,
    sillY: number,
    headY: number,
    interiorSide: 'east' | 'west',
    panes = 2
  ): void => {
    const winNorth = winCenterZ - winWidth / 2;
    const winSouth = winCenterZ + winWidth / 2;

    if (winNorth > minZ + 0.02) {
      addUpperExteriorBrickWall(minX, maxX, minZ, winNorth, floorBaseY, upperWallTopY, interiorSide);
    }
    if (winSouth < maxZ - 0.02) {
      addUpperExteriorBrickWall(minX, maxX, winSouth, maxZ, floorBaseY, upperWallTopY, interiorSide);
    }
    addUpperExteriorBrickWall(minX, maxX, winNorth, winSouth, floorBaseY, sillY, interiorSide);
    addUpperExteriorBrickWall(minX, maxX, winNorth, winSouth, headY, upperWallTopY, interiorSide);

    const cx = (minX + maxX) / 2;
    const winH = headY - sillY;
    const cy = sillY + winH / 2;
    const winGroup = new THREE.Group();
    tagUpperCutawayWall(winGroup, {
      axis: 'x',
      coord: cx,
      minSpan: minZ,
      maxSpan: maxZ,
      floor: 'first',
    });

    const wallDepthX = maxX - minX;
    const extSignX = interiorSide === 'east' ? -1 : 1;
    const intSignX = -extSignX;
    const sillDepthX = wallDepthX * 0.54 + 0.045;
    const sillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(sillDepthX, 0.06, winWidth + 0.12),
      stoneSillMat
    );
    sillMesh.position.set(
      cx + extSignX * (wallDepthX * 0.23 + 0.022),
      sillY - 0.02,
      winCenterZ
    );
    winGroup.add(sillMesh);

    // Interior plastered window reveal linings (jambs + head soffit) and painted timber window board
    const intRevealDepthX = wallDepthX * 0.52;
    const intRevealCenterX = cx + intSignX * (wallDepthX * 0.24);
    for (const sideZ of [-1, 1] as const) {
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(intRevealDepthX, winH, 0.012),
        warmRoomPlasterMat
      );
      revealJamb.position.set(
        intRevealCenterX,
        cy,
        winCenterZ + sideZ * (winWidth * 0.5 - 0.005)
      );
      revealJamb.receiveShadow = true;
      winGroup.add(revealJamb);
    }
    const revealHead = new THREE.Mesh(
      new THREE.BoxGeometry(intRevealDepthX, 0.012, winWidth),
      warmRoomPlasterMat
    );
    revealHead.position.set(intRevealCenterX, headY - 0.005, winCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    const windowBoard = new THREE.Mesh(
      new THREE.BoxGeometry(intRevealDepthX + 0.028, 0.024, winWidth + 0.04),
      skirtingMat
    );
    windowBoard.position.set(
      cx + intSignX * (wallDepthX * 0.25 + 0.012),
      sillY + 0.01,
      winCenterZ
    );
    windowBoard.receiveShadow = true;
    winGroup.add(windowBoard);

    const frameDepth = 0.11;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(frameDepth, 0.05, winWidth),
      windowFrameMat
    );
    topRail.position.set(cx, headY - 0.025, winCenterZ);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(frameDepth, 0.05, winWidth),
      windowFrameMat
    );
    botRail.position.set(cx, sillY + 0.025, winCenterZ);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mz = winNorth + (i / panes) * winWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepth, winH, 0.042),
        windowFrameMat
      );
      mullion.position.set(cx, cy, mz);
      winGroup.add(mullion);
    }

    const transBar = new THREE.Mesh(
      new THREE.BoxGeometry(frameDepth * 0.7, 0.026, winWidth),
      windowFrameMat
    );
    transBar.position.set(cx, sillY + winH * 0.52, winCenterZ);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, winH - 0.08, winWidth - 0.06),
      windowGlassMat
    );
    glass.position.set(cx, cy, winCenterZ);
    winGroup.add(glass);

    scene.add(winGroup);
  };

  /**
   * Builds an interactive 4-panel period cottage/Victorian hinged interior door on the First Floor (`Y = 2.38m..4.22m` — Issue #13).
   */
  const doorH = 1.84;
  const addUpperInteractiveDoor = (
    axis: 'x' | 'z',
    wallCoord: number,
    wallThickness: number,
    doorCenter: number,
    doorWidth: number,
    openAngle: number
  ): void => {
    const architraveT = wallThickness + 0.064;
    const leafW = doorWidth - 0.04;
    const leafH = doorH - 0.02;
    const stileW = 0.095;
    const topRailH = 0.11;
    const lockRailH = 0.16;
    const botRailH = 0.19;
    const muntinW = 0.085;
    const lockRailY = -0.1;

    const populateFourPanelLeaf = (doorObj: THREE.Group, alongZ: boolean): void => {
      const recessW = alongZ ? 0.028 : leafW;
      const recessD = alongZ ? leafW : 0.028;
      const recessCore = new THREE.Mesh(
        new THREE.BoxGeometry(recessW, leafH, recessD),
        wardrobeMat
      );
      recessCore.name = 'interiorDoor.recessCore';
      recessCore.castShadow = true;
      recessCore.receiveShadow = true;
      doorObj.add(recessCore);

      for (const sSign of [-1, 1] as const) {
        const offset = sSign * (leafW * 0.5 - stileW * 0.5);
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(alongZ ? 0.044 : stileW, leafH, alongZ ? stileW : 0.044),
          timberDoorMat
        );
        stile.name = 'interiorDoor.stile';
        stile.position.set(alongZ ? 0 : offset, 0, alongZ ? offset : 0);
        stile.castShadow = true;
        doorObj.add(stile);
      }

      const innerSpanW = leafW - stileW * 2;
      for (const [ry, rh] of [
        [leafH * 0.5 - topRailH * 0.5, topRailH],
        [lockRailY, lockRailH],
        [-leafH * 0.5 + botRailH * 0.5, botRailH],
      ] as const) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(alongZ ? 0.044 : innerSpanW, rh, alongZ ? innerSpanW : 0.044),
          timberDoorMat
        );
        rail.name = 'interiorDoor.rail';
        rail.position.set(0, ry, 0);
        rail.castShadow = true;
        doorObj.add(rail);
      }

      const upperPanelTop = leafH * 0.5 - topRailH;
      const upperPanelBot = lockRailY + lockRailH * 0.5;
      const upperPanelH = Math.max(0.18, upperPanelTop - upperPanelBot);
      const upperPanelCY = (upperPanelTop + upperPanelBot) * 0.5;

      const lowerPanelTop = lockRailY - lockRailH * 0.5;
      const lowerPanelBot = -leafH * 0.5 + botRailH;
      const lowerPanelH = Math.max(0.18, lowerPanelTop - lowerPanelBot);
      const lowerPanelCY = (lowerPanelTop + lowerPanelBot) * 0.5;

      for (const [my, mh] of [
        [upperPanelCY, upperPanelH],
        [lowerPanelCY, lowerPanelH],
      ] as const) {
        const muntin = new THREE.Mesh(
          new THREE.BoxGeometry(alongZ ? 0.044 : muntinW, mh, alongZ ? muntinW : 0.044),
          timberDoorMat
        );
        muntin.name = 'interiorDoor.muntin';
        muntin.position.set(0, my, 0);
        muntin.castShadow = true;
        doorObj.add(muntin);
      }

      const singlePanelBayW = Math.max(0.1, (innerSpanW - muntinW) * 0.5);
      const raisedPanelW = Math.max(0.06, singlePanelBayW - 0.036);
      for (const pSign of [-1, 1] as const) {
        const pOffset = pSign * (muntinW * 0.5 + singlePanelBayW * 0.5);
        for (const [py, ph] of [
          [upperPanelCY, Math.max(0.12, upperPanelH - 0.036)],
          [lowerPanelCY, Math.max(0.12, lowerPanelH - 0.036)],
        ] as const) {
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(alongZ ? 0.038 : raisedPanelW, ph, alongZ ? raisedPanelW : 0.038),
            timberDoorMat
          );
          panel.name = 'interiorDoor.raisedPanel';
          panel.position.set(alongZ ? 0 : pOffset, py, alongZ ? pOffset : 0);
          doorObj.add(panel);
        }
      }

      const latchOffset = alongZ ? -leafW / 2 + 0.055 : leafW / 2 - 0.055;
      for (const faceSign of [-1, 1] as const) {
        const knob = new THREE.Mesh(
          new THREE.SphereGeometry(0.02, 10, 10),
          brassMat
        );
        knob.name = 'interiorDoor.knob';
        knob.scale.set(alongZ ? 0.78 : 1, 1, alongZ ? 1 : 0.78);
        knob.position.set(
          alongZ ? faceSign * 0.038 : latchOffset,
          lockRailY,
          alongZ ? latchOffset : faceSign * 0.038
        );
        doorObj.add(knob);
      }
    };

    if (axis === 'z') {
      for (const side of [-1, 1]) {
        const jamb = new THREE.Mesh(
          new THREE.BoxGeometry(architraveT, doorH + 0.06, 0.092),
          antiqueOakSkirtingMat
        );
        jamb.position.set(
          wallCoord,
          floorTopY + (doorH + 0.06) / 2,
          doorCenter + side * (doorWidth / 2 + 0.04)
        );
        scene.add(jamb);
      }
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(architraveT, 0.095, doorWidth + 0.19),
        antiqueOakSkirtingMat
      );
      head.position.set(wallCoord, floorTopY + doorH + 0.0475, doorCenter);
      scene.add(head);

      const doorObj = new THREE.Group();
      doorObj.position.set(wallCoord, floorTopY + doorH / 2, doorCenter);
      populateFourPanelLeaf(doorObj, true);

      scene.add(doorObj);
      interactions.registerHingedDoor(
        scene,
        doorObj,
        new THREE.Vector3(0, 0, leafW / 2),
        'y',
        openAngle,
        0
      );
    } else {
      for (const side of [-1, 1]) {
        const jamb = new THREE.Mesh(
          new THREE.BoxGeometry(0.092, doorH + 0.06, architraveT),
          antiqueOakSkirtingMat
        );
        jamb.position.set(
          doorCenter + side * (doorWidth / 2 + 0.04),
          floorTopY + (doorH + 0.06) / 2,
          wallCoord
        );
        scene.add(jamb);
      }
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + 0.19, 0.095, architraveT),
        antiqueOakSkirtingMat
      );
      head.position.set(doorCenter, floorTopY + doorH + 0.0475, wallCoord);
      scene.add(head);

      const doorObj = new THREE.Group();
      doorObj.position.set(doorCenter, floorTopY + doorH / 2, wallCoord);
      populateFourPanelLeaf(doorObj, false);

      scene.add(doorObj);
      interactions.registerHingedDoor(
        scene,
        doorObj,
        new THREE.Vector3(-leafW / 2, 0, 0),
        'y',
        openAngle,
        0
      );
    }
  };

  return {
    addFirstFloorSlab,
    addUpperBrickWallAlongXWithWindow,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    applyWorldSpaceBrickUVs,
    doorH,
    tagUpperCutawayWall,
  };
}
