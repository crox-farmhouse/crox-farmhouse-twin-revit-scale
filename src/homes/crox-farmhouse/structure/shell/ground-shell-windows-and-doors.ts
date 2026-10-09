import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildMiteredPolylineStrip,
  buildPolygonalFloorSlab,
  type Point2D,
} from '../../../../engine/geometry/index.ts';
import { buildTraditionalWindowCurtains } from '../../../../objects/decor/curtains-and-fiddle-leaf-plant.ts';
import type { CutawayWallDescriptor } from '../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type {
  GroundShellKitMaterials,
  GroundShellWallsAndFloors,
} from './ground-shell-walls-and-floors.ts';

export function createGroundShellWindowsAndDoors(
  ctx: SceneBuilderContext,
  kit: GroundShellKitMaterials,
  wallsAndFloors: GroundShellWallsAndFloors
) {
  const { interactions, scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    doorH,
    exteriorBrickMat,
    farrowAndBallCordMat,
    farrowAndBallPantalonMat,
    frontWallH,
    oakMat,
    skirtingMat,
    stoneSillMat,
    tagCutawayWall,
    timberDoorMat,
    wallCapMat,
    wallH,
    warmRoomPlasterMat,
    windowFrameMat,
    windowGlassMat,
  } = kit;
  const {
    addExteriorBrickWall,
    addSlattedRadiatorCover,
    eastCourtyardWallAngleY,
    eastCourtyardWallSlopeXPerZ,
    getCourtyardGroundY,
    getEastCourtyardWallCenterX,
    getInteriorFloorY,
    greyRoomCarpetMat,
    shearGeometryAlongZ,
  } = wallsAndFloors;

  /**
   * Builds an exterior brick wall along X (North or South facade) with a multi-pane Georgian casement window.
   */
  let winXSeq = 0;
  const addBrickWallAlongXWithWindow = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    winCenterX: number,
    winWidth: number,
    sillY: number,
    headY: number,
    interiorSide: 'north' | 'south',
    panes = 3,
    wallOptions?: { readonly skipSkirting?: boolean }
  ): void => {
    const winLeft = winCenterX - winWidth / 2;
    const winRight = winCenterX + winWidth / 2;
    const yOffset = winCenterX < -13.0 ? -0.32 : 0;
    const effSillY = sillY + yOffset;
    const effHeadY = headY + yOffset * 0.5;

    if (winLeft > minX + 0.02) {
      addExteriorBrickWall(minX, winLeft, minZ, maxZ, 0, wallH, interiorSide, wallOptions);
    }
    if (winRight < maxX - 0.02) {
      addExteriorBrickWall(winRight, maxX, minZ, maxZ, 0, wallH, interiorSide, wallOptions);
    }
    // Sill wall below window & lintel wall above window
    addExteriorBrickWall(winLeft, winRight, minZ, maxZ, 0, effSillY, interiorSide, wallOptions);
    addExteriorBrickWall(winLeft, winRight, minZ, maxZ, effHeadY, wallH, interiorSide, wallOptions);

    const cz = (minZ + maxZ) / 2;
    const winH = effHeadY - effSillY;
    const cy = effSillY + winH / 2;
    const winId = `groundFloor.windowX.${++winXSeq}`;
    const winGroup = new THREE.Group();
    winGroup.name = winId;
    tagCutawayWall(winGroup, {
      axis: 'z',
      coord: cz,
      minSpan: minX,
      maxSpan: maxX,
      floor: 'ground',
    });

    // Stone exterior sill (on exterior half of wall so it does not protrude into the interior room)
    const wallDepthZ = maxZ - minZ;
    const extSignZ = interiorSide === 'south' ? -1 : 1;
    const intSignZ = -extSignZ;
    const sillDepthZ = wallDepthZ * 0.54 + 0.045;
    const sillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + 0.12, 0.065, sillDepthZ),
      stoneSillMat
    );
    sillMesh.name = `${winId}.sill`;
    sillMesh.position.set(
      winCenterX,
      effSillY - 0.02,
      cz + extSignZ * (wallDepthZ * 0.23 + 0.022)
    );
    winGroup.add(sillMesh);

    // Interior plastered window reveal linings (jambs + head soffit) and painted timber window board
    const interiorRevealMat =
      winCenterX < -17.55 && cz < 1.98 ? farrowAndBallPantalonMat : warmRoomPlasterMat;
    const intRevealDepthZ = wallDepthZ * 0.52;
    const intRevealCenterZ = cz + intSignZ * (wallDepthZ * 0.24);
    for (const sideX of [-1, 1] as const) {
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, winH, intRevealDepthZ),
        interiorRevealMat
      );
      revealJamb.name = `${winId}.revealJamb.${sideX < 0 ? "left" : "right"}`;
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
      interiorRevealMat
    );
    revealHead.name = `${winId}.revealHead`;
    revealHead.position.set(winCenterX, effHeadY - 0.005, intRevealCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    const windowBoard = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + 0.04, 0.024, intRevealDepthZ + 0.028),
      skirtingMat
    );
    windowBoard.name = `${winId}.windowBoard`;
    windowBoard.position.set(
      winCenterX,
      effSillY + 0.01,
      cz + intSignZ * (wallDepthZ * 0.25 + 0.012)
    );
    windowBoard.receiveShadow = true;
    winGroup.add(windowBoard);

    // Timber window frame & mullions
    const frameDepth = 0.11;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.055, frameDepth),
      windowFrameMat
    );
    topRail.name = `${winId}.topRail`;
    topRail.position.set(winCenterX, effHeadY - 0.027, cz);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.055, frameDepth),
      windowFrameMat
    );
    botRail.name = `${winId}.bottomRail`;
    botRail.position.set(winCenterX, effSillY + 0.027, cz);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mx = winLeft + (i / panes) * winWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, winH, frameDepth),
        windowFrameMat
      );
      mullion.name = `${winId}.mullion.${i + 1}`;
      mullion.position.set(mx, cy, cz);
      winGroup.add(mullion);
    }

    // Horizontal glazing bar
    const transBar = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.028, frameDepth * 0.7),
      windowFrameMat
    );
    transBar.name = `${winId}.transomBar`;
    transBar.position.set(winCenterX, effSillY + winH * 0.52, cz);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(winWidth - 0.06, winH - 0.08, 0.016), windowGlassMat);
    glass.name = `${winId}.glass`;
    glass.position.set(winCenterX, cy, cz);
    winGroup.add(glass);

    scene.add(winGroup);
  };

  /**
   * Builds an exterior brick wall along Z (East or West facade) with a multi-pane Georgian casement window.
   */
  let winZSeq = 0;
  const addBrickWallAlongZWithWindow = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    winCenterZ: number,
    winWidth: number,
    sillY: number,
    headY: number,
    interiorSide: 'east' | 'west',
    panes = 3,
    topWallY = wallH
  ): void => {
    const winNorth = winCenterZ - winWidth / 2;
    const winSouth = winCenterZ + winWidth / 2;
    const rawCx = (minX + maxX) / 2;
    const isAngledEastCourtyardWall =
      interiorSide === 'west' && rawCx > -18.0 && minZ >= 3.65;
    const slopeXPerZ = isAngledEastCourtyardWall ? eastCourtyardWallSlopeXPerZ : 0;
    const cx = isAngledEastCourtyardWall
      ? getEastCourtyardWallCenterX(winCenterZ)
      : rawCx;
    const yOffset = rawCx < -13.0 ? -0.32 : 0;
    const effSillY = sillY + yOffset;
    const effHeadY = headY + yOffset * 0.5;

    if (winNorth > minZ + 0.02) {
      addExteriorBrickWall(minX, maxX, minZ, winNorth, 0, topWallY, interiorSide);
    }
    if (winSouth < maxZ - 0.02) {
      addExteriorBrickWall(minX, maxX, winSouth, maxZ, 0, topWallY, interiorSide);
    }
    addExteriorBrickWall(minX, maxX, winNorth, winSouth, 0, effSillY, interiorSide);
    addExteriorBrickWall(minX, maxX, winNorth, winSouth, effHeadY, topWallY, interiorSide);

    const winH = effHeadY - effSillY;
    const cy = effSillY + winH / 2;
    const winId = `groundFloor.windowZ.${++winZSeq}`;
    const winGroup = new THREE.Group();
    winGroup.name = winId;
    tagCutawayWall(winGroup, {
      axis: 'x',
      coord: rawCx,
      minSpan: minZ,
      maxSpan: maxZ,
      floor: 'ground',
    });

    const wallDepthX = maxX - minX;
    const extSignX = interiorSide === 'east' ? -1 : 1;
    const intSignX = -extSignX;
    const sillDepthX = wallDepthX * 0.54 + 0.045;
    const sillMesh = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(sillDepthX, 0.065, winWidth + 0.12),
        slopeXPerZ
      ),
      stoneSillMat
    );
    sillMesh.name = `${winId}.sill`;
    sillMesh.position.set(
      cx + extSignX * (wallDepthX * 0.23 + 0.022),
      effSillY - 0.02,
      winCenterZ
    );
    winGroup.add(sillMesh);

    // Interior plastered window reveal linings (jambs + head soffit) and painted timber window board
    const interiorRevealMat =
      rawCx < -17.55 && winCenterZ < 1.98
        ? farrowAndBallPantalonMat
        : rawCx < -16.8 && winCenterZ > 3.62 && winCenterZ < 8.4
          ? farrowAndBallCordMat
          : warmRoomPlasterMat;
    const intRevealDepthX = wallDepthX * 0.52;
    for (const sideZ of [-1, 1] as const) {
      const jambZ = winCenterZ + sideZ * (winWidth * 0.5 - 0.005);
      const jambCx = isAngledEastCourtyardWall
        ? getEastCourtyardWallCenterX(jambZ)
        : rawCx;
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(intRevealDepthX, winH, 0.012),
        interiorRevealMat
      );
      revealJamb.name = `${winId}.revealJamb.${sideZ < 0 ? "north" : "south"}`;
      revealJamb.position.set(
        jambCx + intSignX * (wallDepthX * 0.24),
        cy,
        jambZ
      );
      revealJamb.receiveShadow = true;
      winGroup.add(revealJamb);
    }
    const intRevealCenterX = cx + intSignX * (wallDepthX * 0.24);
    const revealHead = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(intRevealDepthX, 0.012, winWidth),
        slopeXPerZ
      ),
      interiorRevealMat
    );
    revealHead.name = `${winId}.revealHead`;
    revealHead.position.set(intRevealCenterX, effHeadY - 0.005, winCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    const windowBoard = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(intRevealDepthX + 0.028, 0.024, winWidth + 0.04),
        slopeXPerZ
      ),
      skirtingMat
    );
    windowBoard.name = `${winId}.windowBoard`;
    windowBoard.position.set(
      cx + intSignX * (wallDepthX * 0.25 + 0.012),
      effSillY + 0.01,
      winCenterZ
    );
    windowBoard.receiveShadow = true;
    winGroup.add(windowBoard);

    const frameDepth = 0.11;
    const topRail = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(frameDepth, 0.055, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    topRail.name = `${winId}.topRail`;
    topRail.position.set(cx, effHeadY - 0.027, winCenterZ);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(frameDepth, 0.055, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    botRail.name = `${winId}.bottomRail`;
    botRail.position.set(cx, effSillY + 0.027, winCenterZ);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mz = winNorth + (i / panes) * winWidth;
      const mCx = isAngledEastCourtyardWall
        ? getEastCourtyardWallCenterX(mz)
        : rawCx;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepth, winH, 0.045),
        windowFrameMat
      );
      mullion.name = `${winId}.mullion.${i + 1}`;
      mullion.position.set(mCx, cy, mz);
      winGroup.add(mullion);
    }

    const transBar = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(frameDepth * 0.7, 0.028, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    transBar.name = `${winId}.transomBar`;
    transBar.position.set(cx, effSillY + winH * 0.52, winCenterZ);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(0.016, winH - 0.08, winWidth - 0.06),
        slopeXPerZ
      ),
      windowGlassMat
    );
    glass.name = `${winId}.glass`;
    glass.position.set(cx, cy, winCenterZ);
    winGroup.add(glass);

    scene.add(winGroup);
  };

  /**
   * Builds an interactive traditional 4-panel period interior door (clickable in the 3D view — Issue #13).
   * - If `axis === 'z'`, the doorway runs along the Z axis (in a North-South wall at `wallX`).
   * - If `axis === 'x'`, the doorway runs along the X axis (in an East-West wall at `wallZ`).
   */
  let intDoorSeq = 0;
  const addInteractiveInteriorDoor = (
    _id: string,
    _label: string,
    axis: 'x' | 'z',
    wallCoord: number,
    wallThickness: number,
    doorCenter: number,
    doorWidth: number,
    openAngle: number
  ): void => {
    const doorX = axis === 'z' ? wallCoord : doorCenter;
    const doorZ = axis === 'z' ? doorCenter : wallCoord;
    const baseFloorY = getInteriorFloorY(doorX, doorZ);
    const frameGroup = new THREE.Group();
    addCasedArchitravePortal(frameGroup, {
      axis,
      wallCoord,
      wallThickness,
      openingCenter: doorCenter,
      openingWidth: doorWidth,
      frontFloorY: baseFloorY,
      backFloorY: baseFloorY,
      headY: baseFloorY + doorH,
      material: antiqueOakSkirtingMat,
      namePrefix: `interiorDoor.${_id}`,
    });
    scene.add(frameGroup);

    const leafW = doorWidth - 0.04;
    const leafH = doorH - 0.02;
    const stileW = Math.min(0.105, leafW * 0.14);
    const topRailH = 0.125;
    const lockRailH = 0.165;
    const bottomRailH = 0.195;
    const muntinW = 0.088;
    const lockRailY = -leafH * 0.07;
    const innerW = Math.max(0.1, leafW - stileW * 2 + 0.004);
    const upperPanelTop = leafH / 2 - topRailH;
    const upperPanelBot = lockRailY + lockRailH / 2;
    const lowerPanelTop = lockRailY - lockRailH / 2;
    const lowerPanelBot = -leafH / 2 + bottomRailH;

    const doorId = _id || `groundFloor.interiorDoor.${++intDoorSeq}`;
    if (axis === 'z') {
      const doorObj = new THREE.Group();
      doorObj.name = `${doorId}.leafGroup`;
      doorObj.position.set(wallCoord, baseFloorY + doorH / 2, doorCenter);

      // Recessed panel core slab
      const leafCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, leafH, leafW),
        timberDoorMat
      );
      leafCore.name = `${doorId}.leafCore`;
      leafCore.castShadow = true;
      leafCore.receiveShadow = true;
      doorObj.add(leafCore);

      // Left & right outer stiles
      for (const side of [-1, 1] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.046, leafH, stileW),
          timberDoorMat
        );
        stile.name = `${doorId}.stile.${side < 0 ? "left" : "right"}`;
        stile.position.set(0, 0, side * (leafW / 2 - stileW / 2));
        stile.castShadow = true;
        doorObj.add(stile);
      }

      // Top rail, lock rail & bottom rail
      for (const [railY, railH] of [
        [leafH / 2 - topRailH / 2, topRailH],
        [lockRailY, lockRailH],
        [-leafH / 2 + bottomRailH / 2, bottomRailH],
      ] as const) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.046, railH, innerW),
          timberDoorMat
        );
        rail.name = `${doorId}.rail.${railY > 0 ? "top" : railY < -leafH * 0.25 ? "bottom" : "lock"}`;
        rail.position.set(0, railY, 0);
        rail.castShadow = true;
        doorObj.add(rail);
      }

      // Central muntins & 4 raised bevelled panels
      for (const [pBot, pTop] of [
        [upperPanelBot, upperPanelTop],
        [lowerPanelBot, lowerPanelTop],
      ] as const) {
        const pH = Math.max(0.12, pTop - pBot);
        const pMidY = (pBot + pTop) / 2;
        const muntin = new THREE.Mesh(
          new THREE.BoxGeometry(0.046, pH + 0.004, muntinW),
          timberDoorMat
        );
        muntin.name = `${doorId}.muntin.${pMidY > 0 ? "upper" : "lower"}`;
        muntin.position.set(0, pMidY, 0);
        doorObj.add(muntin);

        const panelClearW = (innerW - muntinW) / 2;
        const raisedW = Math.max(0.06, panelClearW - 0.036);
        const raisedH = Math.max(0.08, pH - 0.042);
        for (const col of [-1, 1] as const) {
          const raisedPanel = new THREE.Mesh(
            new THREE.BoxGeometry(0.038, raisedH, raisedW),
            timberDoorMat
          );
          raisedPanel.name = `${doorId}.raisedPanel.${pMidY > 0 ? "upper" : "lower"}.${col < 0 ? "left" : "right"}`;
          raisedPanel.position.set(0, pMidY, col * (muntinW / 2 + panelClearW / 2));
          doorObj.add(raisedPanel);
        }
      }

      // Traditional brass mortice knobs + circular rose backplates on both faces
      const knobZ = -leafW / 2 + stileW * 0.52;
      for (const xSide of [-1, 1] as const) {
        const rose = new THREE.Mesh(
          new THREE.CylinderGeometry(0.026, 0.026, 0.008, 12),
          brassMat
        );
        rose.name = `${doorId}.rose.${xSide < 0 ? "west" : "east"}`;
        rose.userData.lodTier = 'high';
        rose.rotation.z = Math.PI / 2;
        rose.position.set(xSide * 0.026, lockRailY, knobZ);
        doorObj.add(rose);

        const knob = new THREE.Mesh(
          new THREE.SphereGeometry(0.023, 10, 10),
          brassMat
        );
        knob.name = `${doorId}.knob.${xSide < 0 ? "west" : "east"}`;
        knob.userData.lodTier = 'high';
        knob.scale.set(0.78, 1, 1);
        knob.position.set(xSide * 0.048, lockRailY, knobZ);
        doorObj.add(knob);
      }

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
      const doorObj = new THREE.Group();
      doorObj.name = `${doorId}.leafGroup`;
      doorObj.position.set(doorCenter, baseFloorY + doorH / 2, wallCoord);

      // Recessed panel core slab
      const leafCore = new THREE.Mesh(
        new THREE.BoxGeometry(leafW, leafH, 0.028),
        timberDoorMat
      );
      leafCore.name = `${doorId}.leafCore`;
      leafCore.castShadow = true;
      leafCore.receiveShadow = true;
      doorObj.add(leafCore);

      // Left & right outer stiles
      for (const side of [-1, 1] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(stileW, leafH, 0.046),
          timberDoorMat
        );
        stile.name = `${doorId}.stile.${side < 0 ? "left" : "right"}`;
        stile.position.set(side * (leafW / 2 - stileW / 2), 0, 0);
        stile.castShadow = true;
        doorObj.add(stile);
      }

      // Top rail, lock rail & bottom rail
      for (const [railY, railH] of [
        [leafH / 2 - topRailH / 2, topRailH],
        [lockRailY, lockRailH],
        [-leafH / 2 + bottomRailH / 2, bottomRailH],
      ] as const) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(innerW, railH, 0.046),
          timberDoorMat
        );
        rail.name = `${doorId}.rail.${railY > 0 ? "top" : railY < -leafH * 0.25 ? "bottom" : "lock"}`;
        rail.position.set(0, railY, 0);
        rail.castShadow = true;
        doorObj.add(rail);
      }

      // Central muntins & 4 raised bevelled panels
      for (const [pBot, pTop] of [
        [upperPanelBot, upperPanelTop],
        [lowerPanelBot, lowerPanelTop],
      ] as const) {
        const pH = Math.max(0.12, pTop - pBot);
        const pMidY = (pBot + pTop) / 2;
        const muntin = new THREE.Mesh(
          new THREE.BoxGeometry(muntinW, pH + 0.004, 0.046),
          timberDoorMat
        );
        muntin.name = `${doorId}.muntin.${pMidY > 0 ? "upper" : "lower"}`;
        muntin.position.set(0, pMidY, 0);
        doorObj.add(muntin);

        const panelClearW = (innerW - muntinW) / 2;
        const raisedW = Math.max(0.06, panelClearW - 0.036);
        const raisedH = Math.max(0.08, pH - 0.042);
        for (const col of [-1, 1] as const) {
          const raisedPanel = new THREE.Mesh(
            new THREE.BoxGeometry(raisedW, raisedH, 0.038),
            timberDoorMat
          );
          raisedPanel.name = `${doorId}.raisedPanel.${pMidY > 0 ? "upper" : "lower"}.${col < 0 ? "left" : "right"}`;
          raisedPanel.position.set(col * (muntinW / 2 + panelClearW / 2), pMidY, 0);
          doorObj.add(raisedPanel);
        }
      }

      // Traditional brass mortice knobs + circular rose backplates on both faces
      const knobX = leafW / 2 - stileW * 0.52;
      for (const zSide of [-1, 1] as const) {
        const rose = new THREE.Mesh(
          new THREE.CylinderGeometry(0.026, 0.026, 0.008, 12),
          brassMat
        );
        rose.name = `${doorId}.rose.${zSide < 0 ? "north" : "south"}`;
        rose.userData.lodTier = 'high';
        rose.rotation.x = Math.PI / 2;
        rose.position.set(knobX, lockRailY, zSide * 0.026);
        doorObj.add(rose);

        const knob = new THREE.Mesh(
          new THREE.SphereGeometry(0.023, 10, 10),
          brassMat
        );
        knob.name = `${doorId}.knob.${zSide < 0 ? "north" : "south"}`;
        knob.userData.lodTier = 'high';
        knob.scale.set(1, 1, 0.78);
        knob.position.set(knobX, lockRailY, zSide * 0.048);
        doorObj.add(knob);
      }

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

  /**
   * Builds an exterior brick wall along X (North or South facade) with an interactive
   * half-glazed Farmhouse Courtyard Door (panelled lower leaf + 4-pane glazed upper light),
   * seated flush with the local interior floor & sloped courtyard ground.
   */
  let cDoorXSeq = 0;
  const addBrickWallAlongXWithCourtyardDoor = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    doorCenterX: number,
    doorWidth: number,
    interiorSide: 'north' | 'south',
    openAngle: number
  ): void => {
    const doorLeft = doorCenterX - doorWidth / 2;
    const doorRight = doorCenterX + doorWidth / 2;
    const baseY = getInteriorFloorY(doorCenterX, (minZ + maxZ) / 2);
    const doorTotalH = 2.02;
    const headY = baseY + doorTotalH;

    if (doorLeft > minX + 0.02) {
      addExteriorBrickWall(minX, doorLeft, minZ, maxZ, 0, wallH, interiorSide);
    }
    if (doorRight < maxX - 0.02) {
      addExteriorBrickWall(doorRight, maxX, minZ, maxZ, 0, wallH, interiorSide);
    }
    // Brick lintel wall above doorway
    addExteriorBrickWall(doorLeft, doorRight, minZ, maxZ, headY, wallH, interiorSide);

    const cz = (minZ + maxZ) / 2;
    const wallDepth = maxZ - minZ;
    const cutawayWall: CutawayWallDescriptor = {
      axis: 'z',
      coord: cz,
      minSpan: minX,
      maxSpan: maxX,
      floor: 'ground',
    };

    // Weathered oak threshold weather sill flush with floor level
    const oakThreshold = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.06, 0.036, wallDepth + 0.05),
      oakMat
    );
    const cDoorId = `groundFloor.courtyardDoorX.${++cDoorXSeq}`;
    oakThreshold.name = `${cDoorId}.oakThreshold`;
    oakThreshold.position.set(doorCenterX, baseY + 0.018, cz);
    oakThreshold.receiveShadow = true;
    oakThreshold.userData.isArchitecturalShell = true;
    scene.add(oakThreshold);

    // Outer solid oak timber doorframe jambs & head with 45°-mitred ogee/torus profile
    const frameGroup = new THREE.Group();
    tagCutawayWall(frameGroup, cutawayWall);
    addCasedArchitravePortal(frameGroup, {
      axis: 'x',
      wallCoord: cz,
      wallThickness: wallDepth,
      openingCenter: doorCenterX,
      openingWidth: doorWidth,
      frontFloorY: baseY,
      backFloorY: baseY,
      headY,
      material: antiqueOakSkirtingMat,
      jambInset: 0.03,
      headInset: 0.034,
      namePrefix: 'courtyardDoorX',
    });
    scene.add(frameGroup);

    // Flush Yorkstone threshold paving outside the Courtyard Door (no step down!)
    const stepZ = interiorSide === 'north' ? maxZ + 0.16 : minZ - 0.16;
    const extGroundY = getCourtyardGroundY(doorCenterX, stepZ);
    const doorstep = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.24, 0.035, 0.36),
      stoneSillMat
    );
    doorstep.name = `${cDoorId}.doorstep`;
    doorstep.position.set(doorCenterX, Math.max(baseY, extGroundY) - 0.015, stepZ);
    doorstep.castShadow = true;
    doorstep.receiveShadow = true;
    doorstep.userData.isArchitecturalShell = true;
    scene.add(doorstep);

    // Interactive Half-Glazed Farmhouse Courtyard Door Leaf (painted in warm heritage sage-putty grey — Issue #6: sized to fill frame opening tightly)
    const leafW = doorWidth - 0.058;
    const leafH = doorTotalH - 0.068; // 1.952m
    const doorObj = new THREE.Group();
    doorObj.name = `${cDoorId}.leafGroup`;
    doorObj.position.set(doorCenterX, baseY + 0.035 + leafH / 2, cz);

    // Lower solid Shaker panel section (bottom 0.90m of door)
    const lowerPanelH = 0.9;
    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, lowerPanelH, 0.054),
      courtyardDoorMat
    );
    lowerPanel.name = `${cDoorId}.lowerPanel`;
    lowerPanel.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    doorObj.add(lowerPanel);

    // Recessed Shaker moulding on lower door panel
    const lowerRecess = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.22, lowerPanelH - 0.22, 0.06),
      courtyardDoorRecessMat
    );
    lowerRecess.name = `${cDoorId}.lowerRecess`;
    lowerRecess.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    doorObj.add(lowerRecess);

    // Full-height outer stiles & top/middle rails framing the 4-pane glazed upper window
    const upperH = leafH - lowerPanelH;
    for (const sx of [-leafW / 2 + 0.058, leafW / 2 - 0.058]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.116, leafH, 0.056),
        courtyardDoorMat
      );
      stile.name = `${cDoorId}.stile.${sx < 0 ? "left" : "right"}`;
      stile.position.set(sx, 0, 0);
      stile.castShadow = true;
      doorObj.add(stile);
    }
    const midLockRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    midLockRail.name = `${cDoorId}.midLockRail`;
    midLockRail.position.set(0, -leafH / 2 + lowerPanelH, 0);
    midLockRail.castShadow = true;
    doorObj.add(midLockRail);

    const topDoorRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    topDoorRail.name = `${cDoorId}.topDoorRail`;
    topDoorRail.position.set(0, leafH / 2 - 0.055, 0);
    topDoorRail.castShadow = true;
    doorObj.add(topDoorRail);

    // Upper glass pane + Georgian cross muntins
    const glassW = leafW - 0.18;
    const glassH = upperH - 0.08;
    const glassCenterY = leafH / 2 - 0.055 - glassH / 2;
    const doorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, glassH, 0.016),
      windowGlassMat
    );
    doorGlass.name = `${cDoorId}.glass`;
    doorGlass.position.set(0, glassCenterY, 0);
    doorObj.add(doorGlass);

    const vMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, glassH, 0.036),
      courtyardDoorMat
    );
    vMuntin.name = `${cDoorId}.vMuntin`;
    vMuntin.position.set(0, glassCenterY, 0);
    doorObj.add(vMuntin);

    const hMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, 0.026, 0.036),
      courtyardDoorMat
    );
    hMuntin.name = `${cDoorId}.hMuntin`;
    hMuntin.position.set(0, glassCenterY, 0);
    doorObj.add(hMuntin);

    // Brass lever handle & lock escutcheon at lock rail height
    const handlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.15, 0.072),
      brassMat
    );
    handlePlate.name = `${cDoorId}.handlePlate`;
    handlePlate.userData.lodTier = 'high';
    handlePlate.position.set(leafW / 2 - 0.06, -0.06, 0);
    doorObj.add(handlePlate);

    for (const hz of [-0.052, 0.052]) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.018, 0.018),
        brassMat
      );
      lever.name = `${cDoorId}.lever.${hz < 0 ? "north" : "south"}`;
      lever.userData.lodTier = 'high';
      lever.position.set(leafW / 2 - 0.1, -0.04, hz);
      doorObj.add(lever);
    }

    scene.add(doorObj);
    const pivot = interactions.registerHingedDoor(
      scene,
      doorObj,
      new THREE.Vector3(-leafW / 2, 0, 0),
      'y',
      openAngle,
      0
    );
    tagCutawayWall(pivot, cutawayWall);
  };

  /**
   * Builds an exterior brick wall along Z (East or West facade) with an interactive
   * half-glazed Farmhouse Courtyard Door, seated flush with the -0.60m Plant Room / Study Lobby
   * floor and the sloped courtyard outside (zero step down!).
   */
  let cDoorZSeq = 0;
  const addBrickWallAlongZWithCourtyardDoor = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    doorCenterZ: number,
    doorWidth: number,
    interiorSide: 'east' | 'west',
    openAngle: number
  ): void => {
    const doorNorth = doorCenterZ - doorWidth / 2;
    const doorSouth = doorCenterZ + doorWidth / 2;
    const rawCx = (minX + maxX) / 2;
    const isAngledEastCourtyardWall =
      interiorSide === 'west' && rawCx > -18.0 && minZ >= 3.65;
    const slopeXPerZ = isAngledEastCourtyardWall ? eastCourtyardWallSlopeXPerZ : 0;
    const cx = isAngledEastCourtyardWall
      ? getEastCourtyardWallCenterX(doorCenterZ)
      : rawCx;
    const baseY = getInteriorFloorY(rawCx, doorCenterZ);
    const doorTotalH = 2.02;
    const headY = baseY + doorTotalH;
    const cutawayWall: CutawayWallDescriptor = {
      axis: 'x',
      coord: rawCx,
      minSpan: minZ,
      maxSpan: maxZ,
      floor: 'ground',
    };

    if (doorNorth > minZ + 0.02) {
      addExteriorBrickWall(minX, maxX, minZ, doorNorth, 0, wallH, interiorSide);
    }
    if (doorSouth < maxZ - 0.02) {
      addExteriorBrickWall(minX, maxX, doorSouth, maxZ, 0, wallH, interiorSide);
    }
    addExteriorBrickWall(minX, maxX, doorNorth, doorSouth, headY, wallH, interiorSide);

    const wallDepth = maxX - minX;
    const effMinX = cx - wallDepth / 2;
    const effMaxX = cx + wallDepth / 2;

    // Weathered oak threshold weather sill flush with the -0.60m Plant Room / Hallway floor & sloped courtyard
    const oakThreshold = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(wallDepth + 0.05, 0.036, doorWidth + 0.06),
        slopeXPerZ
      ),
      oakMat
    );
    const cDoorId = `groundFloor.courtyardDoorZ.${++cDoorZSeq}`;
    oakThreshold.name = `${cDoorId}.oakThreshold`;
    oakThreshold.position.set(cx, baseY + 0.018, doorCenterZ);
    oakThreshold.receiveShadow = true;
    oakThreshold.userData.isArchitecturalShell = true;
    scene.add(oakThreshold);

    // Flush Yorkstone threshold stone outside the Plant Room Courtyard Door (no step down!)
    const stepX = interiorSide === 'west' ? effMaxX + 0.16 : effMinX - 0.16;
    const extGroundY = getCourtyardGroundY(stepX, doorCenterZ);
    const doorstep = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(0.36, 0.035, doorWidth + 0.24),
        slopeXPerZ
      ),
      stoneSillMat
    );
    doorstep.name = `${cDoorId}.doorstep`;
    doorstep.position.set(stepX, Math.max(baseY, extGroundY) - 0.015, doorCenterZ);
    doorstep.castShadow = true;
    doorstep.receiveShadow = true;
    doorstep.userData.isArchitecturalShell = true;
    scene.add(doorstep);

    // Outer solid oak timber doorframe jambs & head with 45°-mitred ogee/torus profile
    const frameGroup = new THREE.Group();
    tagCutawayWall(frameGroup, cutawayWall);
    addCasedArchitravePortal(frameGroup, {
      axis: 'z',
      wallCoord: cx,
      wallThickness: wallDepth,
      openingCenter: doorCenterZ,
      openingWidth: doorWidth,
      frontFloorY: baseY,
      backFloorY: baseY,
      headY,
      material: antiqueOakSkirtingMat,
      jambInset: 0.03,
      headInset: 0.034,
      slopeXPerZ,
      namePrefix: 'courtyardDoorZ',
    });
    scene.add(frameGroup);

    // Issue #4 & Issue #6: Solid Framed & Vertical-Boarded Farmhouse Courtyard Door Leaf (sized to fill frame tightly)
    const leafW = doorWidth - 0.058;
    const leafH = doorTotalH - 0.068;
    const doorObj = new THREE.Group();
    doorObj.name = `${cDoorId}.leafGroup`;
    doorObj.position.set(cx, baseY + 0.035 + leafH / 2, doorCenterZ);
    if (isAngledEastCourtyardWall) {
      doorObj.rotation.y = eastCourtyardWallAngleY;
    }

    // Full-height solid timber door core slab
    const solidDoorCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, leafH, leafW),
      courtyardDoorMat
    );
    solidDoorCore.name = `${cDoorId}.solidDoorCore`;
    solidDoorCore.castShadow = true;
    solidDoorCore.receiveShadow = true;
    doorObj.add(solidDoorCore);

    // Outer left/right stiles & top/middle/bottom horizontal framing rails on both faces
    for (const sz of [-leafW / 2 + 0.06, leafW / 2 - 0.06]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, leafH, 0.12),
        courtyardDoorMat
      );
      stile.name = `${cDoorId}.stile.${sz < 0 ? "north" : "south"}`;
      stile.position.set(0, 0, sz);
      stile.castShadow = true;
      stile.receiveShadow = true;
      doorObj.add(stile);
    }
    for (const [ry, rh] of [
      [leafH / 2 - 0.06, 0.12],
      [-0.06, 0.13],
      [-leafH / 2 + 0.075, 0.15],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, rh, leafW - 0.12),
        courtyardDoorMat
      );
      rail.name = `${cDoorId}.rail.${ry > 0 ? "top" : ry < -0.2 ? "bottom" : "middle"}`;
      rail.position.set(0, ry, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      doorObj.add(rail);
    }

    // Upper and lower recessed solid vertical tongue-and-groove timber panels (zero glass!)
    const panelClearW = leafW - 0.24;
    for (const [pBot, pTop] of [
      [-leafH / 2 + 0.15, -0.125],
      [0.005, leafH / 2 - 0.12],
    ] as const) {
      const pH = pTop - pBot;
      const pMidY = (pBot + pTop) * 0.5;
      const solidRecessPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, pH, panelClearW),
        courtyardDoorRecessMat
      );
      solidRecessPanel.name = `${cDoorId}.solidRecessPanel.${pMidY > 0 ? "upper" : "lower"}`;
      solidRecessPanel.position.set(0, pMidY, 0);
      solidRecessPanel.castShadow = true;
      solidRecessPanel.receiveShadow = true;
      doorObj.add(solidRecessPanel);

      // Vertical tongue-and-groove plank V-groove shadow seams across both solid panels
      const numPlanks = 6;
      const plankStep = panelClearW / numPlanks;
      for (let p = 1; p < numPlanks; p++) {
        const seamZ = -panelClearW * 0.5 + p * plankStep;
        const vGroove = new THREE.Mesh(
          new THREE.BoxGeometry(0.054, pH - 0.01, 0.006),
          courtyardDoorMat
        );
        vGroove.name = `${cDoorId}.vGroove.${pMidY > 0 ? "upper" : "lower"}.${p}`;
        vGroove.userData.lodTier = 'high';
        vGroove.position.set(0, pMidY, seamZ);
        doorObj.add(vGroove);
      }
    }

    const handlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.072, 0.15, 0.042),
      brassMat
    );
    handlePlate.name = `${cDoorId}.handlePlate`;
    handlePlate.userData.lodTier = 'high';
    handlePlate.position.set(0, -0.06, -leafW / 2 + 0.06);
    doorObj.add(handlePlate);

    for (const hx of [-0.052, 0.052]) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.018, 0.11),
        brassMat
      );
      lever.name = `${cDoorId}.lever.${hx < 0 ? "west" : "east"}`;
      lever.userData.lodTier = 'high';
      lever.position.set(hx, -0.04, -leafW / 2 + 0.1);
      doorObj.add(lever);
    }

    scene.add(doorObj);
    const pivot = interactions.registerHingedDoor(
      scene,
      doorObj,
      new THREE.Vector3(0, 0, leafW / 2),
      'y',
      openAngle,
      0
    );
    tagCutawayWall(pivot, cutawayWall);
  };

  /**
   * Builds a Shallow 3-Sided Canted Bay Window on the West Front Facade (`X = -22.19m..-22.52m`),
   * matching media_1790514908836.webp & Issue #18 ("Bay is not this deep its a much more shallow bay"):
   * - Uses `buildMiteredPolylineStrip` across a single 6-vertex reference polyline (`P0..P5`)
   *   so the lower spandrel wall, upper header, cutaway cap, `0.14m` white skirting board,
   *   white internal windowsill board (with wrap-around end horns), window-head reveal soffit,
   *   vertical jamb linings/architraves, and casement frames share exact angle-bisector miters
   * - Trapezoidal carpeted bay floor (`greyRoomCarpetMat`) flush with the room floor at `Y = -0.60m`
   * - 3 central 2-pane casement lights (`3 columns x 2 rows = 6 panes`) + 2 angled splay 2-pane lights
   * - Free-standing multi-column cast-iron radiator centered beneath the middle 3 lights (Issue #17)
   */
  const addWestCantedBayWindow = (
    centerZ: number,
    minWallZ: number,
    maxWallZ: number,
    interiorLowerWallMat: THREE.Material = warmRoomPlasterMat
  ): void => {
    const wallInnerX = -22.19;     // Exact interior (+X) face of the West exterior wall
    const bayInnerFrontX = -22.52; // Issue #18: Shallow canted bay projection (0.33m internal recess instead of 0.65m!)
    const bayHalfZ = 1.08;         // Total internal bay opening = 2.16m
    const hornLen = 0.095;         // Projecting windowsill horn & architrave return along X = -22.19m
    const bayBaseY = -0.6;         // West Wing floor & exterior ground level
    const sillY = 0.08;            // 0.68m above the -0.60m Living/Front Room floor (Issue #2: 10cm lower & 10cm taller windows)
    const headY = frontWallH - 0.26; // Adapted for reduced front-room ceiling height frontWallH = 1.625m (Issue #1: headY = 1.365m)
    const winH = headY - sillY;
    const frontW = 1.24;

    // Trapezoidal carpeted bay floor extension slab tucked 4cm inside the 0.28m bay walls (at Y = -0.60m)
    buildPolygonalFloorSlab(
      scene,
      [
        [wallInnerX + 0.04, centerZ - bayHalfZ - 0.04],
        [bayInnerFrontX - 0.04, centerZ - frontW / 2 - 0.04],
        [bayInnerFrontX - 0.04, centerZ + frontW / 2 + 0.04],
        [wallInnerX + 0.04, centerZ + bayHalfZ + 0.04],
      ],
      bayBaseY,
      0.08,
      greyRoomCarpetMat,
      0.5
    );

    const bayCutawayDesc: CutawayWallDescriptor = {
      axis: 'x',
      coord: -22.33,
      minSpan: minWallZ,
      maxSpan: maxWallZ,
      floor: 'ground',
    };
    const bayPrefix = centerZ > 2 ? 'sittingRoom.westBayWindow' : 'livingRoom.westBayWindow';
    const bayWallGroup = new THREE.Group();
    bayWallGroup.name = bayPrefix;
    tagCutawayWall(bayWallGroup, bayCutawayDesc);

    // Canted polygonal interior white ceiling soffit & solid 3D Flat Lead Bay Roof with subtle weather fall (Issue #6)
    const bayLeadRoofMat = new THREE.MeshStandardMaterial({
      color: 0x3f4650,
      roughness: 0.52,
      metalness: 0.28,
      side: THREE.DoubleSide,
    });
    const bayHipRollMat = new THREE.MeshStandardMaterial({
      color: 0x343a42,
      roughness: 0.42,
      metalness: 0.38,
    });

    // Solid 3D Flat Lead Bay Roof deck with a subtle 2.5cm weather fall from the main West brick wall
    // exterior face (wallApexX = -22.47m, backTopY = frontWallH + 0.105m) down to the canted eaves
    // (eaveFrontX = -22.88m, frontTopY = frontWallH + 0.080m), sitting on eaveRoofY = frontWallH + 0.055m
    const eaveRoofY = frontWallH + 0.055;
    const backTopY = frontWallH + 0.105;
    const frontTopY = frontWallH + 0.08;
    const wallApexX = wallInnerX - 0.28; // Exact exterior face of West brick wall (-22.47m)
    const eaveFrontX = bayInnerFrontX - 0.36; // Overhanging front eaves (-22.88m)
    const eaveOuterMinZ = centerZ - bayHalfZ - 0.14;
    const eaveOuterMaxZ = centerZ + bayHalfZ + 0.14;
    const eaveFrontMinZ = centerZ - frontW / 2 - 0.2;
    const eaveFrontMaxZ = centerZ + frontW / 2 + 0.2;

    // Interior bay ceiling soffit (strictly inside the bay walls) & exterior overhanging 3-facet white eaves fascia deck (X <= -22.47m)
    buildPolygonalFloorSlab(
      bayWallGroup,
      [
        [wallInnerX, centerZ - bayHalfZ],
        [bayInnerFrontX - 0.14, centerZ - frontW / 2],
        [bayInnerFrontX - 0.14, centerZ + frontW / 2],
        [wallInnerX, centerZ + bayHalfZ],
      ],
      frontWallH + 0.01,
      0.03,
      skirtingMat,
      0.5
    );
    buildPolygonalFloorSlab(
      bayWallGroup,
      [
        [wallApexX, eaveOuterMinZ],
        [eaveFrontX, eaveFrontMinZ],
        [eaveFrontX, eaveFrontMaxZ],
        [wallApexX, eaveOuterMaxZ],
      ],
      eaveRoofY,
      0.055,
      skirtingMat,
      0.5
    );

    const b0 = new THREE.Vector3(wallApexX, eaveRoofY, eaveOuterMinZ);
    const b1 = new THREE.Vector3(eaveFrontX, eaveRoofY, eaveFrontMinZ);
    const b2 = new THREE.Vector3(eaveFrontX, eaveRoofY, eaveFrontMaxZ);
    const b3 = new THREE.Vector3(wallApexX, eaveRoofY, eaveOuterMaxZ);
    const t0 = new THREE.Vector3(wallApexX, backTopY, eaveOuterMinZ);
    const t1 = new THREE.Vector3(eaveFrontX, frontTopY, eaveFrontMinZ);
    const t2 = new THREE.Vector3(eaveFrontX, frontTopY, eaveFrontMaxZ);
    const t3 = new THREE.Vector3(wallApexX, backTopY, eaveOuterMaxZ);

    const bayRoofPositions: number[] = [];
    const addRoofTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void => {
      bayRoofPositions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };
    const addRoofQuad = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      c: THREE.Vector3,
      d: THREE.Vector3
    ): void => {
      addRoofTri(a, b, c);
      addRoofTri(a, c, d);
    };
    // 1. Gently sloped flat lead top deck (+Y normal with 2.5cm weather fall toward -X)
    addRoofQuad(t0, t1, t2, t3);
    // 2. Bottom soffit closure (-Y normal)
    addRoofQuad(b0, b3, b2, b1);
    // 3. Perimeter lead drip-edge fascia/apron faces & rear wall closure (outward normals)
    addRoofQuad(b0, b1, t1, t0); // North splay drip edge
    addRoofQuad(b1, b2, t2, t1); // West front drip edge
    addRoofQuad(b2, b3, t3, t2); // South splay drip edge
    addRoofQuad(b3, b0, t0, t3); // East rear wall abutment

    const bayRoofGeo = new THREE.BufferGeometry();
    bayRoofGeo.setAttribute('position', new THREE.Float32BufferAttribute(bayRoofPositions, 3));
    bayRoofGeo.computeVertexNormals();
    bayRoofGeo.computeBoundingSphere();
    const bayRoofMesh = new THREE.Mesh(bayRoofGeo, bayLeadRoofMat);
    bayRoofMesh.name = 'westBayWindow.pitchedLeadRoof';
    bayRoofMesh.castShadow = true;
    bayRoofMesh.receiveShadow = true;
    tagCutawayWall(bayRoofMesh, bayCutawayDesc);
    bayWallGroup.add(bayRoofMesh);

    // 5 Flat-roof wooden-cored lead seam rolls (`westBayWindow.leadSeamRoll.1..5`) running horizontally
    // with the 2.5cm fall from the rear brick wall (`wallApexX = -22.47`) out to the canted front/side eaves
    // (at the 2 mitre hip lines plus 3 intermediate standing-seam bays across the flat roof deck)
    const seamRollSpecs: ReadonlyArray<readonly [number, number, number]> = [
      [-frontW * 0.56, eaveFrontMinZ - centerZ, 0.016],
      [-0.4, -0.4, 0.014],
      [0, 0, 0.014],
      [0.4, 0.4, 0.014],
      [frontW * 0.56, eaveFrontMaxZ - centerZ, 0.016],
    ];
    let seamIdx = 0;
    for (const [rearZOff, frontZOff, rollRad] of seamRollSpecs) {
      const pRear = new THREE.Vector3(wallApexX - 0.008, backTopY + 0.004, centerZ + rearZOff);
      const pFront = new THREE.Vector3(eaveFrontX + 0.008, frontTopY + 0.004, centerZ + frontZOff);
      const seamCurve = new THREE.LineCurve3(pRear, pFront);
      const seamRoll = new THREE.Mesh(
        new THREE.TubeGeometry(seamCurve, 6, rollRad, 10, false),
        bayHipRollMat
      );
      seamRoll.geometry.computeBoundingSphere();
      seamRoll.name = `westBayWindow.leadSeamRoll.${++seamIdx}`;
      seamRoll.userData.lodTier = 'high';
      seamRoll.castShadow = true;
      tagCutawayWall(seamRoll, bayCutawayDesc);
      bayWallGroup.add(seamRoll);
    }

    // Lead wall-abutment upstand & stepped flashing apron (`westBayWindow.leadWallFlashing`)
    // tucked into the brickwork along x = wallApexX (y = backTopY..backTopY + 0.11)
    const flashingLenZ = eaveOuterMaxZ - eaveOuterMinZ;
    const flashingProfile = new THREE.Shape();
    flashingProfile.moveTo(0.012, 0);
    flashingProfile.lineTo(-0.026, 0);
    flashingProfile.lineTo(-0.026, 0.014);
    flashingProfile.lineTo(-0.014, 0.018);
    flashingProfile.lineTo(-0.014, 0.11);
    flashingProfile.lineTo(0.016, 0.11);
    flashingProfile.lineTo(0.016, 0.094);
    flashingProfile.lineTo(0.002, 0.094);
    flashingProfile.lineTo(0.002, 0.012);
    flashingProfile.lineTo(0.012, 0.012);
    flashingProfile.closePath();

    const flashingGeo = new THREE.ExtrudeGeometry(flashingProfile, {
      depth: flashingLenZ,
      bevelEnabled: false,
    });
    flashingGeo.translate(wallApexX, backTopY - 0.002, eaveOuterMinZ);
    flashingGeo.computeVertexNormals();
    flashingGeo.computeBoundingSphere();
    const leadWallFlashing = new THREE.Mesh(flashingGeo, bayHipRollMat);
    leadWallFlashing.name = 'westBayWindow.leadWallFlashing';
    leadWallFlashing.castShadow = true;
    leadWallFlashing.receiveShadow = true;
    tagCutawayWall(leadWallFlashing, bayCutawayDesc);
    bayWallGroup.add(leadWallFlashing);

    // 6-vertex reference polyline spanning the FULL room West wall from minWallZ to maxWallZ (d = 0):
    // P0 -> P1 (North West wall), P1 -> P2 (North splay), P2 -> P3 (Front facet),
    // P3 -> P4 (South splay), P4 -> P5 (South West wall)
    const bayPolyline: readonly Point2D[] = [
      [wallInnerX, minWallZ],
      [wallInnerX, centerZ - bayHalfZ],
      [bayInnerFrontX, centerZ - frontW / 2],
      [bayInnerFrontX, centerZ + frontW / 2],
      [wallInnerX, centerZ + bayHalfZ],
      [wallInnerX, maxWallZ],
    ];

    // 6-vertex trim polyline for the internal windowsill board (with 9.5cm end horns), head soffit, and exterior stone sill
    const trimPolyline: readonly Point2D[] = [
      [wallInnerX, centerZ - bayHalfZ - hornLen],
      [wallInnerX, centerZ - bayHalfZ],
      [bayInnerFrontX, centerZ - frontW / 2],
      [bayInnerFrontX, centerZ + frontW / 2],
      [wallInnerX, centerZ + bayHalfZ],
      [wallInnerX, centerZ + bayHalfZ + hornLen],
    ];

    const wallMatTuple: readonly [THREE.Material, THREE.Material, THREE.Material] = [
      interiorLowerWallMat,
      exteriorBrickMat,
      exteriorBrickMat,
    ];

    // 1. One-piece Full-Height West Wall Flanks on North (segment 0) and South (segment 4) of the bay window
    //    (y = bayBaseY - 0.04 .. frontWallH, d = -0.28..0 — eliminates horizontal seam splits at sillY/headY, Issues #2 & #3!)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      bayBaseY - 0.04,
      frontWallH,
      wallMatTuple,
      true,
      true,
      [0, 1]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      bayBaseY - 0.04,
      frontWallH,
      wallMatTuple,
      true,
      true,
      [4, 5]
    );

    // 2. Continuous Mitered Lower Spandrel Wall across the 3 projecting bay facets (segments 1..4: y = bayBaseY - 0.04 .. sillY, d = -0.28..0)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      bayBaseY - 0.04,
      sillY,
      wallMatTuple,
      true,
      true,
      [1, 4]
    );

    // 3. Continuous Mitered Upper Header Spandrel Wall across the 3 projecting bay facets (segments 1..4: y = headY .. frontWallH, d = -0.28..0),
    //    PLUS Flat Interior Header Reveal Wall all the way across X = wallInnerX & Trapezoidal Bay Ceiling Reveal Soffit (Issues #6 & #15)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      headY,
      frontWallH,
      wallMatTuple,
      true,
      true,
      [1, 4]
    );

    // Flat interior header wall across the bay opening at X = wallInnerX (-22.19m), Y = headY..frontWallH,
    // so the room wall is completely flat all the way across the top and the bay recess sits inside below the reveal!
    const flatHeaderLenZ = bayHalfZ * 2 + 0.04;
    const flatHeaderDepthX = 0.14;
    const flatHeaderH = frontWallH - headY;
    const flatHeaderWall = new THREE.Mesh(
      new THREE.BoxGeometry(flatHeaderDepthX, flatHeaderH, flatHeaderLenZ),
      interiorLowerWallMat
    );
    flatHeaderWall.name = 'westBayWindow.flatHeaderWall';
    flatHeaderWall.position.set(
      wallInnerX - flatHeaderDepthX / 2,
      headY + flatHeaderH / 2,
      centerZ
    );
    flatHeaderWall.castShadow = true;
    flatHeaderWall.receiveShadow = true;
    bayWallGroup.add(flatHeaderWall);

    // Flat cutaway top cap across the bay opening at X = wallInnerX (recessed so it never pokes above frontWallH)
    const flatHeaderCap = new THREE.Mesh(
      new THREE.BoxGeometry(flatHeaderDepthX - 0.012, 0.016, flatHeaderLenZ - 0.012),
      wallCapMat
    );
    flatHeaderCap.name = `${bayWallGroup.name}.flatHeaderCap`;
    flatHeaderCap.position.set(
      wallInnerX - flatHeaderDepthX / 2,
      frontWallH - 0.006,
      centerZ
    );
    bayWallGroup.add(flatHeaderCap);

    // Moulded white head architrave / reveal nosing along the bottom edge of the flat header at X = wallInnerX
    const flatHeaderArchitrave = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.028, flatHeaderLenZ + 0.12),
      skirtingMat
    );
    flatHeaderArchitrave.name = 'westBayWindow.flatHeaderArchitrave';
    flatHeaderArchitrave.position.set(wallInnerX + 0.004, headY + 0.004, centerZ);
    bayWallGroup.add(flatHeaderArchitrave);

    // Flat horizontal trapezoidal reveal soffit ceiling inside the bay recess at Y = headY
    // filling the space between X = wallInnerX and the 3-sided bay window frame
    {
      const soffitShape = new THREE.Shape();
      // Shape in (x, z) mapped to Shape (x, y) then rotated -PI/2 around X so y -> -z;
      // since the bay is Z-symmetrical around centerZ, we center the shape at (wallInnerX, centerZ)
      const baySoffitDepth = wallInnerX - (bayInnerFrontX - 0.115); // ~0.765m
      soffitShape.moveTo(0, -bayHalfZ - 0.02);
      soffitShape.lineTo(-baySoffitDepth, -frontW / 2 - 0.02);
      soffitShape.lineTo(-baySoffitDepth, frontW / 2 + 0.02);
      soffitShape.lineTo(0, bayHalfZ + 0.02);
      soffitShape.closePath();

      const soffitGeo = new THREE.ExtrudeGeometry(soffitShape, {
        depth: 0.036,
        bevelEnabled: false,
      });
      soffitGeo.rotateX(-Math.PI / 2);
      soffitGeo.computeBoundingSphere();
      const bayRevealSoffit = new THREE.Mesh(soffitGeo, skirtingMat);
      bayRevealSoffit.name = 'westBayWindow.revealSoffit';
      bayRevealSoffit.position.set(wallInnerX, headY - 0.012, centerZ);
      bayRevealSoffit.receiveShadow = true;
      bayWallGroup.add(bayRevealSoffit);
    }

    // Recessed cutaway top caps on segments 0 and 4 (strictly inside d = -0.268..-0.012 and below frontWallH so they never protrude out of the brick wall — Issues #2 & #3)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.268,
      -0.012,
      frontWallH - 0.016,
      frontWallH - 0.002,
      wallCapMat,
      false,
      false,
      [0, 1]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.268,
      -0.012,
      frontWallH - 0.016,
      frontWallH - 0.002,
      wallCapMat,
      false,
      false,
      [4, 5]
    );

    // 4. Continuous Mitered 0.145m Antique-Profiled Oak Skirting Board across the ENTIRE West wall & bay (Issue #14)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.002,
      0.022,
      bayBaseY,
      bayBaseY + 0.122,
      antiqueOakSkirtingMat,
      false,
      true
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.002,
      0.016,
      bayBaseY + 0.122,
      bayBaseY + 0.146,
      antiqueOakSkirtingMat,
      false,
      false
    );

    // 5. Continuous Mitered White Internal Windowsill Board + Wrap-Around End Horns (y = sillY - 0.006 .. sillY + 0.028)
    buildMiteredPolylineStrip(
      bayWallGroup,
      trimPolyline,
      -0.115,
      0.036,
      sillY - 0.006,
      sillY + 0.028,
      skirtingMat,
      true,
      true
    );

    // 6. Continuous Mitered White Window-Head Reveal Soffit & Top Architrave (y = headY - 0.022 .. headY + 0.012)
    buildMiteredPolylineStrip(
      bayWallGroup,
      trimPolyline,
      -0.115,
      0.018,
      headY - 0.022,
      headY + 0.012,
      skirtingMat,
      false,
      true
    );

    // 7. Continuous Mitered Exterior Stone Sill (y = sillY - 0.04 .. sillY + 0.02, d = -0.31..-0.11)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.31,
      -0.11,
      sillY - 0.04,
      sillY + 0.02,
      stoneSillMat,
      true,
      true,
      [1, 4]
    );

    // 8. Continuous Mitered Casement Window Bottom Rail, Top Rail, Mid-Height Glazing Bar & Glass (segments 1..4)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.185,
      -0.105,
      sillY + 0.022,
      sillY + 0.074,
      windowFrameMat,
      true,
      true,
      [1, 4]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.185,
      -0.105,
      headY - 0.074,
      headY - 0.022,
      windowFrameMat,
      true,
      true,
      [1, 4]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.168,
      -0.122,
      sillY + winH * 0.5 - 0.014,
      sillY + winH * 0.5 + 0.014,
      windowFrameMat,
      true,
      true,
      [1, 4]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.152,
      -0.138,
      sillY + 0.05,
      headY - 0.05,
      windowGlassMat,
      false,
      false,
      [1, 4]
    );

    // 9. Mitered Vertical Jamb Reveal Linings + Architraves at P1 (North) and P4 (South)
    //    Uses dOut = -0.112..+0.018 (so the inner-bend miter shift 0.112 * 0.5174 = 0.058m is strictly
    //    smaller than hornLen = 0.095m and splayLeg = 0.105m, preventing any face inversion!)
    const splayDx = bayInnerFrontX - wallInnerX; // -0.65m
    const splayDz = bayHalfZ - frontW / 2;       // +0.46m
    const splaySegLen = Math.hypot(splayDx, splayDz);
    const splayUx = splayDx / splaySegLen;
    const splayUz = splayDz / splaySegLen;

    // North Jamb Reveal + Architrave (around P1)
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [wallInnerX, centerZ - bayHalfZ - hornLen],
        [wallInnerX, centerZ - bayHalfZ],
        [wallInnerX + splayUx * 0.105, centerZ - bayHalfZ + splayUz * 0.105],
      ],
      -0.112,
      0.018,
      sillY + 0.022,
      headY - 0.01,
      skirtingMat
    );

    // South Jamb Reveal + Architrave (around P4)
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [wallInnerX + splayUx * 0.105, centerZ + bayHalfZ - splayUz * 0.105],
        [wallInnerX, centerZ + bayHalfZ],
        [wallInnerX, centerZ + bayHalfZ + hornLen],
      ],
      -0.112,
      0.018,
      sillY + 0.022,
      headY - 0.01,
      skirtingMat
    );

    // 10. Mitered Vertical Corner Mullions at P2 (North splay-to-front) and P3 (South front-to-splay)
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [bayInnerFrontX - splayUx * 0.024, centerZ - frontW / 2 - splayUz * 0.024],
        [bayInnerFrontX, centerZ - frontW / 2],
        [bayInnerFrontX, centerZ - frontW / 2 + 0.024],
      ],
      -0.185,
      -0.102,
      sillY + 0.022,
      headY - 0.022,
      windowFrameMat
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [bayInnerFrontX, centerZ + frontW / 2 - 0.024],
        [bayInnerFrontX, centerZ + frontW / 2],
        [bayInnerFrontX - splayUx * 0.024, centerZ + frontW / 2 + splayUz * 0.024],
      ],
      -0.185,
      -0.102,
      sillY + 0.022,
      headY - 0.022,
      windowFrameMat
    );


    // 11. Two Intermediate Vertical Mullions dividing the Front Facet into 3 casement bays (3x2 = 6 panes)
    for (const mz of [-frontW / 6, frontW / 6]) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.082, winH - 0.044, 0.052),
        windowFrameMat
      );
      mullion.name = `${bayWallGroup.name}.frontMullion.${mz < 0 ? "north" : "south"}`;
      mullion.position.set(bayInnerFrontX - 0.144, sillY + winH / 2, centerZ + mz);
      bayWallGroup.add(mullion);
    }

    // 12. Brass Casement Stays & Handles on the 2 Angled Splay Windows (media_1790514908836.webp)
    const splayAngle = Math.atan2(-splayDx, splayDz);
    for (const side of [-1, 1]) {
      const splayMidX = (wallInnerX + bayInnerFrontX) / 2 - 0.102 * splayUz;
      const splayMidZ = centerZ + side * ((bayHalfZ + frontW / 2) / 2) + side * 0.102 * splayUx;
      const hwGroup = new THREE.Group();
      hwGroup.position.set(splayMidX, 0, splayMidZ);
      hwGroup.rotation.y = side * splayAngle;

      const casementStay = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.012, 0.22),
        brassMat
      );
      casementStay.name = `${bayWallGroup.name}.casementStay.${side < 0 ? "north" : "south"}`;
      casementStay.userData.lodTier = 'high';
      casementStay.position.set(0.012, sillY + 0.048, 0);
      hwGroup.add(casementStay);

      const casementHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.075, 0.014),
        brassMat
      );
      casementHandle.name = `${bayWallGroup.name}.casementHandle.${side < 0 ? "north" : "south"}`;
      casementHandle.userData.lodTier = 'high';
      casementHandle.position.set(0.012, sillY + winH * 0.48, -side * 0.24);
      hwGroup.add(casementHandle);

      bayWallGroup.add(hwGroup);
    }

    // 13. Issues #2, #3, #6 & #15: Heavy 38mm Aged-Brass Curtain Pole, Brackets, Rings & Traditional Catenary-Draped Interlined Curtains
    //     Mounted straight across the flat interior header reveal at `X = wallInnerX + poleOff` (`poleY = headY + 0.12 = 1.485m`),
    //     with the 3-sided bay window recessed inside behind the curtain line!
    const poleY = headY + 0.12;
    const poleOff = 0.082;
    const curtainGroup = buildTraditionalWindowCurtains({
      groupName: 'westBayWindow.curtainsAndPole',
      poleName: 'westBayWindow.curtainPole',
      finialName: 'westBayWindow.curtainPole.finial',
      bracketName: 'westBayWindow.curtainPole.bracket',
      panelName: 'westBayWindow.curtainPanel',
      headerName: 'westBayWindow.curtainPanel.header',
      hemName: 'westBayWindow.curtainPanel.hem',
      tieBackName: 'westBayWindow.curtainPanel.tieBack',
      halfWindowSpanZ: bayHalfZ,
      poleExtensionZ: 0.38,
      stackWidthZ: 0.58,
      stackInnerInsetZ: 0.22,
      poleX: wallInnerX + poleOff,
      wallFaceX: wallInnerX,
      poleY,
      floorY: bayBaseY,
      tieBackY: sillY + 0.18,
      centerZ,
      inwardSignX: 1,
      mainColorHex: centerZ > 2 ? 0xd8cfc0 : 0xcdc4b4,
      shadowColorHex: centerZ > 2 ? 0xc2b7a5 : 0xb8ae9c,
      trimColorHex: 0xb5aa96,
      brassMat,
    });
    bayWallGroup.add(curtainGroup);
    let stripSegIdx = 0;
    bayWallGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.name) {
        child.name = `${bayPrefix}.stripSegment.${++stripSegIdx}`;
      }
    });
    scene.add(bayWallGroup);

    // 14. Free-standing cast-iron radiator centered under the 3 middle lights (Issue #2: 10cm shorter to clear lowered sillY = 0.08m)
    addSlattedRadiatorCover(
      bayInnerFrontX + 0.09,
      bayBaseY,
      centerZ,
      1.26,
      0.58,
      0.22,
      0,
      true,
      bayCutawayDesc
    );
  };

  return {
    addBrickWallAlongXWithCourtyardDoor,
    addBrickWallAlongXWithWindow,
    addBrickWallAlongZWithCourtyardDoor,
    addBrickWallAlongZWithWindow,
    addInteractiveInteriorDoor,
    addWestCantedBayWindow,
  };
}
