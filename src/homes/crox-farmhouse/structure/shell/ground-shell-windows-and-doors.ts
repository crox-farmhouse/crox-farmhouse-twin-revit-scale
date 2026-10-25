import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  addSolidOakWindowTrim,
  buildMitredArchitraveSegments,
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
    wallOptions?: {
      readonly skipSkirting?: boolean;
      readonly trimFaceOffset?: number;
      readonly skipUnderApron?: boolean;
      readonly skipArchitrave?: boolean;
      readonly windowFamily?: 'tripleTopHungCentre' | 'tripleHorzBars' | 'singleCasement' | 'doubleCasement';
    }
  ): void => {
    const family =
      wallOptions?.windowFamily ??
      (panes === 1 ? 'singleCasement' : panes === 3 ? 'tripleTopHungCentre' : 'doubleCasement');
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
    const frameDepth = 0.11;
    const intRevealStartZ = cz + intSignZ * (frameDepth * 0.5 + 0.004);
    const intRevealEndZ = cz + intSignZ * (wallDepthZ * 0.5 - 0.004);
    const intRevealDepthZ = Math.max(0.024, Math.abs(intRevealEndZ - intRevealStartZ));
    const intRevealCenterZ = (intRevealStartZ + intRevealEndZ) * 0.5;
    const revealJambBotY = effSillY + 0.032;
    const revealJambTopY = effHeadY - 0.020;
    const revealJambH = Math.max(0.08, revealJambTopY - revealJambBotY);
    for (const sideX of [-1, 1] as const) {
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, revealJambH, intRevealDepthZ),
        interiorRevealMat
      );
      revealJamb.name = `${winId}.revealJamb.${sideX < 0 ? "left" : "right"}`;
      revealJamb.position.set(
        winCenterX + sideX * (winWidth * 0.5 - 0.010),
        (revealJambBotY + revealJambTopY) * 0.5,
        intRevealCenterZ
      );
      revealJamb.receiveShadow = true;
      winGroup.add(revealJamb);
    }
    const revealHead = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth - 0.008, 0.012, intRevealDepthZ),
      interiorRevealMat
    );
    revealHead.name = `${winId}.revealHead`;
    revealHead.position.set(winCenterX, effHeadY - 0.010, intRevealCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    addSolidOakWindowTrim(winGroup, {
      axis: 'x',
      openingCenter: winCenterX,
      openingWidth: winWidth,
      sillY: effSillY,
      headY: effHeadY,
      interiorWallFaceCoord: cz + intSignZ * (wallDepthZ * 0.5),
      inwardSign: intSignZ as 1 | -1,
      revealDepth: wallDepthZ * 0.52,
      material: antiqueOakSkirtingMat,
      namePrefix: winId,
      trimFaceOffset: wallOptions?.trimFaceOffset,
      skipUnderApron: wallOptions?.skipUnderApron,
      skipArchitrave: wallOptions?.skipArchitrave,
    });

    // Timber window outer box frame, structural mullions & 3D inset casement sashes (Survey2Plan family geometry)
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

    const sashThickZ = 0.048;
    const sashStileW = 0.028;
    const sashZ = cz + extSignZ * 0.012;
    const lightClearH = Math.max(0.16, winH - 0.11);
    const lightSpanW = winWidth / panes;

    for (let p = 0; p < panes; p++) {
      const lightCenterX = winLeft + (p + 0.5) * lightSpanW;
      const lightClearW = Math.max(0.12, lightSpanW - 0.046);
      const isTopHungCentre = family === 'tripleTopHungCentre' && panes === 3 && p === 1;

      if (isTopHungCentre) {
        const transomY = effHeadY - 0.055 - lightClearH * 0.34;
        const fanTransom = new THREE.Mesh(
          new THREE.BoxGeometry(lightClearW + 0.012, 0.036, frameDepth * 0.88),
          windowFrameMat
        );
        fanTransom.name = `${winId}.centreFanlightTransom`;
        fanTransom.position.set(lightCenterX, transomY, cz);
        winGroup.add(fanTransom);

        const fanH = Math.max(0.1, effHeadY - 0.055 - (transomY + 0.018));
        const fanMidY = (effHeadY - 0.055 + transomY + 0.018) * 0.5;
        for (const sx of [-1, 1] as const) {
          const fStile = new THREE.Mesh(
            new THREE.BoxGeometry(sashStileW, fanH, sashThickZ),
            windowFrameMat
          );
          fStile.name = `${winId}.fanlightSashStile.${sx < 0 ? 'left' : 'right'}`;
          fStile.position.set(lightCenterX + sx * (lightClearW * 0.5 - sashStileW * 0.5), fanMidY, sashZ);
          winGroup.add(fStile);
        }
        for (const [ry, rTag] of [
          [effHeadY - 0.055 - sashStileW * 0.5, 'top'],
          [transomY + 0.018 + sashStileW * 0.5, 'bottom'],
        ] as const) {
          const fRail = new THREE.Mesh(
            new THREE.BoxGeometry(lightClearW, sashStileW, sashThickZ),
            windowFrameMat
          );
          fRail.name = `${winId}.fanlightSashRail.${rTag}`;
          fRail.position.set(lightCenterX, ry, sashZ);
          winGroup.add(fRail);
        }

        const lowBar = new THREE.Mesh(
          new THREE.BoxGeometry(lightClearW - sashStileW * 2, 0.022, sashThickZ * 0.92),
          windowFrameMat
        );
        lowBar.name = `${winId}.centreGlazingBar`;
        lowBar.position.set(lightCenterX, (effSillY + 0.055 + transomY - 0.018) * 0.5, sashZ);
        winGroup.add(lowBar);
      } else {
        for (const sx of [-1, 1] as const) {
          const sStile = new THREE.Mesh(
            new THREE.BoxGeometry(sashStileW, lightClearH - sashStileW * 2, sashThickZ),
            windowFrameMat
          );
          sStile.name = `${winId}.sash.${p + 1}.stile.${sx < 0 ? 'left' : 'right'}`;
          sStile.position.set(lightCenterX + sx * (lightClearW * 0.5 - sashStileW * 0.5), cy, sashZ);
          winGroup.add(sStile);
        }
        for (const [ry, rTag] of [
          [effHeadY - 0.055 - sashStileW * 0.5, 'top'],
          [effSillY + 0.055 + sashStileW * 0.5, 'bottom'],
        ] as const) {
          const sRail = new THREE.Mesh(
            new THREE.BoxGeometry(lightClearW, sashStileW, sashThickZ),
            windowFrameMat
          );
          sRail.name = `${winId}.sash.${p + 1}.rail.${rTag}`;
          sRail.position.set(lightCenterX, ry, sashZ);
          winGroup.add(sRail);
        }

        if (family !== 'singleCasement') {
          const barFracs =
            family === 'tripleHorzBars' || family === 'tripleTopHungCentre'
              ? ([0.34, 0.67] as const)
              : ([0.52] as const);
          for (let bIdx = 0; bIdx < barFracs.length; bIdx++) {
            const hBar = new THREE.Mesh(
              new THREE.BoxGeometry(lightClearW - sashStileW * 2, 0.022, sashThickZ * 0.92),
              windowFrameMat
            );
            hBar.name = `${winId}.sash.${p + 1}.glazingBar.${bIdx + 1}`;
            hBar.position.set(lightCenterX, effSillY + 0.055 + lightClearH * barFracs[bIdx]!, sashZ);
            winGroup.add(hBar);
          }
        }
      }

      // Period brass casement stay on opening lights
      if (panes === 1 || p !== 1 || family !== 'tripleTopHungCentre') {
        const stay = new THREE.Mesh(
          new THREE.BoxGeometry(Math.min(0.18, lightClearW * 0.55), 0.01, 0.016),
          brassMat
        );
        stay.name = `${winId}.sash.${p + 1}.casementStay`;
        stay.userData.lodTier = 'high';
        stay.position.set(
          lightCenterX,
          effSillY + 0.055 + 0.016,
          cz + intSignZ * (frameDepth * 0.48)
        );
        winGroup.add(stay);
      }
    }

    const glass = new THREE.Mesh(new THREE.BoxGeometry(winWidth - 0.106, winH - 0.122, 0.010), windowGlassMat);
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
    topWallY = wallH,
    trimOptions?: {
      readonly trimFaceOffset?: number;
      readonly skipUnderApron?: boolean;
      readonly skipArchitrave?: boolean;
      readonly windowFamily?: 'tripleTopHungCentre' | 'tripleHorzBars' | 'singleCasement' | 'doubleCasement';
    }
  ): void => {
    const family =
      trimOptions?.windowFamily ??
      (panes === 1 ? 'singleCasement' : panes === 3 ? 'tripleTopHungCentre' : 'doubleCasement');
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
    const frameDepth = 0.11;
    const intRevealOffsetX = ((frameDepth * 0.5 + 0.004) + (wallDepthX * 0.5 - 0.004)) * 0.5;
    const intRevealDepthX = Math.max(0.024, wallDepthX * 0.5 - frameDepth * 0.5 - 0.008);
    const revealJambBotY = effSillY + 0.032;
    const revealJambTopY = effHeadY - 0.020;
    const revealJambH = Math.max(0.08, revealJambTopY - revealJambBotY);
    for (const sideZ of [-1, 1] as const) {
      const jambZ = winCenterZ + sideZ * (winWidth * 0.5 - 0.010);
      const jambCx = isAngledEastCourtyardWall
        ? getEastCourtyardWallCenterX(jambZ)
        : rawCx;
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(intRevealDepthX, revealJambH, 0.012),
        interiorRevealMat
      );
      revealJamb.name = `${winId}.revealJamb.${sideZ < 0 ? "north" : "south"}`;
      revealJamb.position.set(
        jambCx + intSignX * intRevealOffsetX,
        (revealJambBotY + revealJambTopY) * 0.5,
        jambZ
      );
      revealJamb.receiveShadow = true;
      winGroup.add(revealJamb);
    }
    const intRevealCenterX = cx + intSignX * intRevealOffsetX;
    const revealHead = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(intRevealDepthX, 0.012, winWidth - 0.008),
        slopeXPerZ
      ),
      interiorRevealMat
    );
    revealHead.name = `${winId}.revealHead`;
    revealHead.position.set(intRevealCenterX, effHeadY - 0.010, winCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    addSolidOakWindowTrim(winGroup, {
      axis: 'z',
      openingCenter: winCenterZ,
      openingWidth: winWidth,
      sillY: effSillY,
      headY: effHeadY,
      interiorWallFaceCoord: cx + intSignX * (wallDepthX * 0.5),
      inwardSign: intSignX as 1 | -1,
      revealDepth: wallDepthX * 0.52,
      material: antiqueOakSkirtingMat,
      namePrefix: winId,
      slopeXPerZ,
      trimFaceOffset: trimOptions?.trimFaceOffset,
      skipUnderApron: trimOptions?.skipUnderApron,
      skipArchitrave: trimOptions?.skipArchitrave,
    });

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

    const sashThickX = 0.048;
    const sashStileW = 0.028;
    const lightClearH = Math.max(0.16, winH - 0.11);
    const lightSpanW = winWidth / panes;

    for (let p = 0; p < panes; p++) {
      const lightCenterZ = winNorth + (p + 0.5) * lightSpanW;
      const lightCx = isAngledEastCourtyardWall
        ? getEastCourtyardWallCenterX(lightCenterZ)
        : rawCx;
      const sashX = lightCx + extSignX * 0.012;
      const lightClearW = Math.max(0.12, lightSpanW - 0.046);
      const isTopHungCentre = family === 'tripleTopHungCentre' && panes === 3 && p === 1;

      if (isTopHungCentre) {
        const transomY = effHeadY - 0.055 - lightClearH * 0.34;
        const fanTransom = new THREE.Mesh(
          shearGeometryAlongZ(
            new THREE.BoxGeometry(frameDepth * 0.88, 0.036, lightClearW + 0.012),
            slopeXPerZ
          ),
          windowFrameMat
        );
        fanTransom.name = `${winId}.centreFanlightTransom`;
        fanTransom.position.set(lightCx, transomY, lightCenterZ);
        winGroup.add(fanTransom);

        const fanH = Math.max(0.1, effHeadY - 0.055 - (transomY + 0.018));
        const fanMidY = (effHeadY - 0.055 + transomY + 0.018) * 0.5;
        for (const sz of [-1, 1] as const) {
          const stZ = lightCenterZ + sz * (lightClearW * 0.5 - sashStileW * 0.5);
          const stCx = isAngledEastCourtyardWall ? getEastCourtyardWallCenterX(stZ) : rawCx;
          const fStile = new THREE.Mesh(
            new THREE.BoxGeometry(sashThickX, fanH, sashStileW),
            windowFrameMat
          );
          fStile.name = `${winId}.fanlightSashStile.${sz < 0 ? 'north' : 'south'}`;
          fStile.position.set(stCx + extSignX * 0.012, fanMidY, stZ);
          winGroup.add(fStile);
        }
        for (const [ry, rTag] of [
          [effHeadY - 0.055 - sashStileW * 0.5, 'top'],
          [transomY + 0.018 + sashStileW * 0.5, 'bottom'],
        ] as const) {
          const fRail = new THREE.Mesh(
            shearGeometryAlongZ(
              new THREE.BoxGeometry(sashThickX, sashStileW, lightClearW),
              slopeXPerZ
            ),
            windowFrameMat
          );
          fRail.name = `${winId}.fanlightSashRail.${rTag}`;
          fRail.position.set(sashX, ry, lightCenterZ);
          winGroup.add(fRail);
        }

        const lowBar = new THREE.Mesh(
          shearGeometryAlongZ(
            new THREE.BoxGeometry(sashThickX * 0.92, 0.022, lightClearW - sashStileW * 2),
            slopeXPerZ
          ),
          windowFrameMat
        );
        lowBar.name = `${winId}.centreGlazingBar`;
        lowBar.position.set(sashX, (effSillY + 0.055 + transomY - 0.018) * 0.5, lightCenterZ);
        winGroup.add(lowBar);
      } else {
        for (const sz of [-1, 1] as const) {
          const stZ = lightCenterZ + sz * (lightClearW * 0.5 - sashStileW * 0.5);
          const stCx = isAngledEastCourtyardWall ? getEastCourtyardWallCenterX(stZ) : rawCx;
          const sStile = new THREE.Mesh(
            new THREE.BoxGeometry(sashThickX, lightClearH - sashStileW * 2, sashStileW),
            windowFrameMat
          );
          sStile.name = `${winId}.sash.${p + 1}.stile.${sz < 0 ? 'north' : 'south'}`;
          sStile.position.set(stCx + extSignX * 0.012, cy, stZ);
          winGroup.add(sStile);
        }
        for (const [ry, rTag] of [
          [effHeadY - 0.055 - sashStileW * 0.5, 'top'],
          [effSillY + 0.055 + sashStileW * 0.5, 'bottom'],
        ] as const) {
          const sRail = new THREE.Mesh(
            shearGeometryAlongZ(
              new THREE.BoxGeometry(sashThickX, sashStileW, lightClearW),
              slopeXPerZ
            ),
            windowFrameMat
          );
          sRail.name = `${winId}.sash.${p + 1}.rail.${rTag}`;
          sRail.position.set(sashX, ry, lightCenterZ);
          winGroup.add(sRail);
        }

        if (family !== 'singleCasement') {
          const barFracs =
            family === 'tripleHorzBars' || family === 'tripleTopHungCentre'
              ? ([0.34, 0.67] as const)
              : ([0.52] as const);
          for (let bIdx = 0; bIdx < barFracs.length; bIdx++) {
            const hBar = new THREE.Mesh(
              shearGeometryAlongZ(
                new THREE.BoxGeometry(sashThickX * 0.92, 0.022, lightClearW - sashStileW * 2),
                slopeXPerZ
              ),
              windowFrameMat
            );
            hBar.name = `${winId}.sash.${p + 1}.glazingBar.${bIdx + 1}`;
            hBar.position.set(sashX, effSillY + 0.055 + lightClearH * barFracs[bIdx]!, lightCenterZ);
            winGroup.add(hBar);
          }
        }
      }

      if (panes === 1 || p !== 1 || family !== 'tripleTopHungCentre') {
        const stay = new THREE.Mesh(
          shearGeometryAlongZ(
            new THREE.BoxGeometry(0.016, 0.01, Math.min(0.18, lightClearW * 0.55)),
            slopeXPerZ
          ),
          brassMat
        );
        stay.name = `${winId}.sash.${p + 1}.casementStay`;
        stay.userData.lodTier = 'high';
        stay.position.set(
          lightCx + intSignX * (frameDepth * 0.48),
          effSillY + 0.055 + 0.016,
          lightCenterZ
        );
        winGroup.add(stay);
      }
    }

    const glass = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(0.010, winH - 0.122, winWidth - 0.106),
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
    const innerW = Math.max(0.1, leafW - stileW * 2);
    const coreH = Math.max(0.2, leafH - topRailH - bottomRailH);
    const coreOffsetY = (bottomRailH - topRailH) * 0.5;
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
        new THREE.BoxGeometry(0.028, coreH, innerW),
        timberDoorMat
      );
      leafCore.name = `${doorId}.leafCore`;
      leafCore.position.set(0, coreOffsetY, 0);
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
          new THREE.BoxGeometry(0.046, pH, muntinW),
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
        rose.position.set(xSide * 0.028, lockRailY, knobZ);
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
        new THREE.BoxGeometry(innerW, coreH, 0.028),
        timberDoorMat
      );
      leafCore.name = `${doorId}.leafCore`;
      leafCore.position.set(0, coreOffsetY, 0);
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
          new THREE.BoxGeometry(muntinW, pH, 0.046),
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
        rose.position.set(knobX, lockRailY, zSide * 0.028);
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
      new THREE.BoxGeometry(doorWidth - 0.008, 0.032, wallDepth + 0.05),
      oakMat
    );
    const cDoorId = `groundFloor.courtyardDoorX.${++cDoorXSeq}`;
    oakThreshold.name = `${cDoorId}.oakThreshold`;
    oakThreshold.position.set(doorCenterX, baseY + 0.020, cz);
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
      bottomClearance: 0.04,
      namePrefix: 'courtyardDoorX',
    });
    scene.add(frameGroup);

    // Flush Yorkstone threshold paving outside the Courtyard Door (no step down!)
    const stepZ = interiorSide === 'north' ? maxZ + 0.21 : minZ - 0.21;
    const extGroundY = getCourtyardGroundY(doorCenterX, stepZ);
    const doorstep = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + 0.24, 0.035, 0.34),
      stoneSillMat
    );
    doorstep.name = `${cDoorId}.doorstep`;
    doorstep.position.set(doorCenterX, Math.max(baseY, extGroundY) - 0.022, stepZ);
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

    // Lower solid Shaker panel section (bottom 0.90m of door, fitted cleanly between stiles and below midLockRail)
    const lowerPanelH = 0.9;
    const lowerBodyH = lowerPanelH - 0.055;
    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.232, lowerBodyH, 0.046),
      courtyardDoorMat
    );
    lowerPanel.name = `${cDoorId}.lowerPanel`;
    lowerPanel.position.set(0, -leafH / 2 + lowerBodyH / 2, 0);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    doorObj.add(lowerPanel);

    // Recessed Shaker moulding on lower door panel
    const lowerRecess = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.26, lowerPanelH - 0.22, 0.054),
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
      new THREE.BoxGeometry(leafW - 0.232, 0.11, 0.056),
      courtyardDoorMat
    );
    midLockRail.name = `${cDoorId}.midLockRail`;
    midLockRail.position.set(0, -leafH / 2 + lowerPanelH, 0);
    midLockRail.castShadow = true;
    doorObj.add(midLockRail);

    const topDoorRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.232, 0.11, 0.056),
      courtyardDoorMat
    );
    topDoorRail.name = `${cDoorId}.topDoorRail`;
    topDoorRail.position.set(0, leafH / 2 - 0.055, 0);
    topDoorRail.castShadow = true;
    doorObj.add(topDoorRail);

    // Upper glass pane + Georgian cross muntins
    const glassW = leafW - 0.236;
    const glassH = upperH - 0.168;
    const glassCenterY = (leafH / 2 - 0.11 + (-leafH / 2 + lowerPanelH + 0.055)) * 0.5;
    const doorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, glassH, 0.012),
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
      new THREE.BoxGeometry(glassW, 0.026, 0.032),
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
        new THREE.BoxGeometry(wallDepth + 0.05, 0.032, doorWidth - 0.008),
        slopeXPerZ
      ),
      oakMat
    );
    const cDoorId = `groundFloor.courtyardDoorZ.${++cDoorZSeq}`;
    oakThreshold.name = `${cDoorId}.oakThreshold`;
    oakThreshold.position.set(cx, baseY + 0.020, doorCenterZ);
    oakThreshold.receiveShadow = true;
    oakThreshold.userData.isArchitecturalShell = true;
    scene.add(oakThreshold);

    // Flush Yorkstone threshold stone outside the Plant Room Courtyard Door (no step down!)
    const stepX = interiorSide === 'west' ? effMaxX + 0.21 : effMinX - 0.21;
    const extGroundY = getCourtyardGroundY(stepX, doorCenterZ);
    const doorstep = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(0.34, 0.035, doorWidth + 0.24),
        slopeXPerZ
      ),
      stoneSillMat
    );
    doorstep.name = `${cDoorId}.doorstep`;
    doorstep.position.set(stepX, Math.max(baseY, extGroundY) - 0.022, doorCenterZ);
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
      bottomClearance: 0.04,
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

    // Solid timber door core slab inset between outer stiles and top/bottom rails
    const solidCoreH = leafH - 0.12 - 0.15;
    const solidDoorCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.040, solidCoreH, leafW - 0.24),
      courtyardDoorMat
    );
    solidDoorCore.name = `${cDoorId}.solidDoorCore`;
    solidDoorCore.position.set(0, (0.15 - 0.12) * 0.5, 0);
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
        new THREE.BoxGeometry(0.058, rh, leafW - 0.24),
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
        new THREE.BoxGeometry(0.052, pH - 0.008, panelClearW - 0.008),
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
          new THREE.BoxGeometry(0.058, pH - 0.014, 0.006),
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
    const bayInnerFrontX = -22.55; // Survey2Plan canted bay projection (0.36m internal recess -> 0.51m splay flank lights!)
    const bayHalfZ = 1.17;         // Survey2Plan 1.62m front + 2 × 0.36m Z-splay = 2.34m internal bay span (splay = hypot(0.36, 0.36) = 0.51m!)
    const hornLen = 0.095;         // Projecting windowsill horn & architrave return along X = -22.19m
    const bayBaseY = -0.6;         // West Wing floor & exterior ground level
    const sillY = 0.02;            // 0.62m above -0.60m floor (clears 0.58m bay radiator)
    const headY = 1.44;            // Survey2Plan Win 1690814 / 1698360 exact height = 1.42m (1.44 - 0.02 = 1.42m!)
    const winH = headY - sillY;
    const frontW = 1.62;           // Survey2Plan S2P-Windows-TplwGlazingBarsK central 3-light facet = 1.62m wide

    // Trapezoidal carpeted bay floor extension slab meeting the room floor cleanly at wallInnerX - 0.005m (at Y = -0.60m)
    buildPolygonalFloorSlab(
      scene,
      [
        [wallInnerX - 0.005, centerZ - bayHalfZ - 0.04],
        [bayInnerFrontX - 0.04, centerZ - frontW / 2 - 0.04],
        [bayInnerFrontX - 0.04, centerZ + frontW / 2 + 0.04],
        [wallInnerX - 0.005, centerZ + bayHalfZ + 0.04],
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
    });
    const bayHipRollMat = new THREE.MeshStandardMaterial({
      color: 0x343a42,
      roughness: 0.42,
      metalness: 0.38,
    });

    // Solid 3D Flat Lead Bay Roof deck with a subtle 2.5cm weather fall from the main West brick wall
    // exterior face (wallApexX = -22.47m, backTopY = frontWallH + 0.105m) down to the canted eaves
    // (eaveFrontX = -22.88m, frontTopY = frontWallH + 0.080m), sitting cleanly above eaveRoofY = frontWallH + 0.055m
    const eaveRoofY = frontWallH + 0.055;
    const leadDeckBotY = eaveRoofY + 0.004;
    const backTopY = frontWallH + 0.105;
    const frontTopY = frontWallH + 0.08;
    const wallApexX = wallInnerX - 0.28; // Exact exterior face of West brick wall (-22.47m)
    const leadAbutmentX = wallApexX - 0.004;
    const eaveFrontX = bayInnerFrontX - 0.36; // Overhanging front eaves (-22.88m)
    const eaveOuterMinZ = centerZ - bayHalfZ - 0.14;
    const eaveOuterMaxZ = centerZ + bayHalfZ + 0.14;
    const eaveFrontMinZ = centerZ - frontW / 2 - 0.2;
    const eaveFrontMaxZ = centerZ + frontW / 2 + 0.2;

    // Interior bay ceiling soffit (strictly west of flatHeaderWall X = wallInnerX - 0.14m so it never overlaps room ceilingBacking!)
    // & exterior overhanging 3-facet white eaves fascia deck (X <= -22.474m)
    buildPolygonalFloorSlab(
      bayWallGroup,
      [
        [wallInnerX - 0.145, centerZ - bayHalfZ + 0.145],
        [bayInnerFrontX - 0.14, centerZ - frontW / 2],
        [bayInnerFrontX - 0.14, centerZ + frontW / 2],
        [wallInnerX - 0.145, centerZ + bayHalfZ - 0.145],
      ],
      frontWallH - 0.005,
      0.025,
      skirtingMat,
      0.5
    );
    buildPolygonalFloorSlab(
      bayWallGroup,
      [
        [leadAbutmentX, eaveOuterMinZ],
        [eaveFrontX, eaveFrontMinZ],
        [eaveFrontX, eaveFrontMaxZ],
        [leadAbutmentX, eaveOuterMaxZ],
      ],
      eaveRoofY,
      0.051,
      skirtingMat,
      0.5
    );

    const b0 = new THREE.Vector3(leadAbutmentX, leadDeckBotY, eaveOuterMinZ);
    const b1 = new THREE.Vector3(eaveFrontX, leadDeckBotY, eaveFrontMinZ);
    const b2 = new THREE.Vector3(eaveFrontX, leadDeckBotY, eaveFrontMaxZ);
    const b3 = new THREE.Vector3(leadAbutmentX, leadDeckBotY, eaveOuterMaxZ);
    const t0 = new THREE.Vector3(leadAbutmentX, backTopY, eaveOuterMinZ);
    const t1 = new THREE.Vector3(eaveFrontX, frontTopY, eaveFrontMinZ);
    const t2 = new THREE.Vector3(eaveFrontX, frontTopY, eaveFrontMaxZ);
    const t3 = new THREE.Vector3(leadAbutmentX, backTopY, eaveOuterMaxZ);

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
    // 2. Perimeter lead drip-edge fascia/apron faces (outward normals; bottom & rear abutment omitted to avoid coplanar overlap)
    addRoofQuad(b0, b1, t1, t0); // North splay drip edge
    addRoofQuad(b1, b2, t2, t1); // West front drip edge
    addRoofQuad(b2, b3, t3, t2); // South splay drip edge

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
      const pRear = new THREE.Vector3(wallApexX - 0.022, backTopY + rollRad + 0.002, centerZ + rearZOff);
      const pFront = new THREE.Vector3(eaveFrontX + 0.012, frontTopY + rollRad + 0.002, centerZ + frontZOff);
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
    // proud of the brickwork along x = wallApexX - 0.004 (y = backTopY + 0.004..backTopY + 0.114)
    const flashingLenZ = eaveOuterMaxZ - eaveOuterMinZ;
    const flashingProfile = new THREE.Shape();
    flashingProfile.moveTo(0, 0);
    flashingProfile.lineTo(-0.026, 0);
    flashingProfile.lineTo(-0.026, 0.014);
    flashingProfile.lineTo(-0.014, 0.018);
    flashingProfile.lineTo(-0.014, 0.11);
    flashingProfile.lineTo(0, 0.11);
    flashingProfile.closePath();

    const flashingGeo = new THREE.ExtrudeGeometry(flashingProfile, {
      depth: flashingLenZ,
      bevelEnabled: false,
    });
    flashingGeo.translate(wallApexX - 0.004, backTopY + 0.004, eaveOuterMinZ);
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

    // 6-vertex trim polyline for the internal windowsill board (with 9.5cm end horns)
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
    const cappedWallMatTuple: readonly [THREE.Material, THREE.Material, THREE.Material] = [
      interiorLowerWallMat,
      exteriorBrickMat,
      wallCapMat,
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
      cappedWallMatTuple,
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
      cappedWallMatTuple,
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
    const flatHeaderLenZ = bayHalfZ * 2 - 0.008;
    const flatHeaderDepthX = 0.136;
    const flatHeaderH = frontWallH - headY;
    const flatHeaderGeo = new THREE.BoxGeometry(flatHeaderDepthX, flatHeaderH, flatHeaderLenZ);
    const flatHeaderPos = flatHeaderGeo.attributes.position;
    if (flatHeaderPos) {
      for (let vi = 0; vi < flatHeaderPos.count; vi++) {
        if (flatHeaderPos.getX(vi) < 0) {
          const vz = flatHeaderPos.getZ(vi);
          flatHeaderPos.setZ(vi, vz - Math.sign(vz) * (flatHeaderDepthX + 0.004));
        }
      }
      flatHeaderPos.needsUpdate = true;
      flatHeaderGeo.computeVertexNormals();
      flatHeaderGeo.computeBoundingSphere();
    }
    const flatHeaderWall = new THREE.Mesh(
      flatHeaderGeo,
      [
        interiorLowerWallMat,
        interiorLowerWallMat,
        wallCapMat,
        interiorLowerWallMat,
        interiorLowerWallMat,
        interiorLowerWallMat,
      ]
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

    // Moulded Solid European Oak reveal nosing along the bottom edge of the flat header at X = wallInnerX
    const flatHeaderArchitrave = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.018, flatHeaderLenZ),
      antiqueOakSkirtingMat
    );
    flatHeaderArchitrave.name = 'westBayWindow.flatHeaderArchitrave';
    flatHeaderArchitrave.position.set(wallInnerX - 0.012, headY - 0.013, centerZ);
    bayWallGroup.add(flatHeaderArchitrave);

    // Flat horizontal trapezoidal reveal soffit ceiling inside the bay recess below headY
    // filling the space between X = wallInnerX - 0.024 and the 3-sided bay window frame
    {
      const soffitShape = new THREE.Shape();
      // Shape in (x, z) mapped to Shape (x, y) then rotated -PI/2 around X so y -> -z;
      // since the bay is Z-symmetrical around centerZ, we center the shape at (wallInnerX - 0.024, centerZ)
      const baySoffitDepth = wallInnerX - 0.024 - (bayInnerFrontX - 0.100);
      soffitShape.moveTo(0, -bayHalfZ + 0.024);
      soffitShape.lineTo(-baySoffitDepth, -frontW / 2 - 0.008);
      soffitShape.lineTo(-baySoffitDepth, frontW / 2 + 0.008);
      soffitShape.lineTo(0, bayHalfZ - 0.024);
      soffitShape.closePath();

      const soffitGeo = new THREE.ExtrudeGeometry(soffitShape, {
        depth: 0.014,
        bevelEnabled: false,
      });
      soffitGeo.rotateX(-Math.PI / 2);
      soffitGeo.computeBoundingSphere();
      const bayRevealSoffit = new THREE.Mesh(soffitGeo, skirtingMat);
      bayRevealSoffit.name = 'westBayWindow.revealSoffit';
      bayRevealSoffit.position.set(wallInnerX - 0.024, headY - 0.018, centerZ);
      bayRevealSoffit.receiveShadow = true;
      bayWallGroup.add(bayRevealSoffit);
    }

    // 4. Continuous Mitered 0.145m Antique-Profiled Oak Skirting Board across the ENTIRE West wall & bay (Issue #14)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      0.004,
      0.024,
      bayBaseY + 0.004,
      bayBaseY + 0.118,
      antiqueOakSkirtingMat,
      true,
      true
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      0.004,
      0.020,
      bayBaseY + 0.122,
      bayBaseY + 0.146,
      antiqueOakSkirtingMat,
      true,
      true
    );

    // 5. Continuous Mitered Solid European Oak Internal Windowsill Board + Wrap-Around End Horns + Moulded Under-Sill Apron
    buildMiteredPolylineStrip(
      bayWallGroup,
      trimPolyline,
      -0.100,
      0.036,
      sillY + 0.004,
      sillY + 0.028,
      antiqueOakSkirtingMat,
      true,
      true,
      [1, 4]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      trimPolyline,
      0.004,
      0.036,
      sillY + 0.004,
      sillY + 0.028,
      antiqueOakSkirtingMat,
      true,
      true,
      [0, 1]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      trimPolyline,
      0.004,
      0.036,
      sillY + 0.004,
      sillY + 0.028,
      antiqueOakSkirtingMat,
      true,
      true,
      [4, 5]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      trimPolyline,
      0.004,
      0.019,
      sillY - 0.044,
      sillY,
      antiqueOakSkirtingMat,
      true,
      true
    );

    // 5b. 3-Sided 45°-Mitred 75mm × 20mm Solid European Oak Bay Portal Architrave along X = wallInnerX + 0.005
    {
      const [northArchGeo, headArchGeo, southArchGeo] = buildMitredArchitraveSegments(
        centerZ - bayHalfZ,
        centerZ + bayHalfZ,
        sillY + 0.032,
        sillY + 0.032,
        headY - 0.004,
        'z',
        wallInnerX + 0.005,
        1,
        0.075,
        0.020
      );
      const bayArchParts = [
        ['northLeg', northArchGeo],
        ['head', headArchGeo],
        ['southLeg', southArchGeo],
      ] as const;
      for (const [partTag, partGeo] of bayArchParts) {
        const partMesh = new THREE.Mesh(partGeo, antiqueOakSkirtingMat);
        partMesh.name = `${bayPrefix}.oakArchitrave.${partTag}`;
        partMesh.castShadow = true;
        partMesh.receiveShadow = true;
        partMesh.userData.isArchitecturalShell = true;
        bayWallGroup.add(partMesh);
      }
    }

    // 7. Continuous Mitered Exterior Stone Sill (y = sillY - 0.04 .. sillY - 0.004, d = -0.31..-0.19)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.31,
      -0.19,
      sillY - 0.04,
      sillY - 0.004,
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
      sillY + 0.032,
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
      -0.150,
      -0.140,
      sillY + 0.078,
      headY - 0.078,
      windowGlassMat,
      false,
      false,
      [1, 4]
    );

    // 9. Splay Jamb Reveal Linings inset strictly inside the North (P1) and South (P4) splay reveals
    const splayDx = bayInnerFrontX - wallInnerX;
    const splayDz = bayHalfZ - frontW / 2;
    const splaySegLen = Math.hypot(splayDx, splayDz);
    const splayUx = splayDx / splaySegLen;
    const splayUz = splayDz / splaySegLen;

    // North Jamb Reveal Lining (inset inside splay segment 1)
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [wallInnerX + splayUx * 0.008, centerZ - bayHalfZ + splayUz * 0.008],
        [wallInnerX + splayUx * 0.020, centerZ - bayHalfZ + splayUz * 0.020],
      ],
      -0.100,
      -0.006,
      sillY + 0.032,
      headY - 0.022,
      skirtingMat
    );

    // South Jamb Reveal Lining (inset inside splay segment 3)
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [wallInnerX + splayUx * 0.020, centerZ + bayHalfZ - splayUz * 0.020],
        [wallInnerX + splayUx * 0.008, centerZ + bayHalfZ - splayUz * 0.008],
      ],
      -0.100,
      -0.006,
      sillY + 0.032,
      headY - 0.022,
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
      -0.181,
      -0.102,
      sillY + 0.078,
      headY - 0.078,
      windowFrameMat
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      [
        [bayInnerFrontX, centerZ + frontW / 2 - 0.024],
        [bayInnerFrontX, centerZ + frontW / 2],
        [bayInnerFrontX - splayUx * 0.024, centerZ + frontW / 2 + splayUz * 0.024],
      ],
      -0.181,
      -0.102,
      sillY + 0.078,
      headY - 0.078,
      windowFrameMat
    );


    // 11. Two Intermediate Vertical Mullions + 3 Inset Sash Sub-Frames dividing the 1.62m Front Facet into 3 casement bays (`S2P-Windows-TplwGlazingBarsK`)
    for (const mz of [-frontW / 6, frontW / 6]) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.078, winH - 0.156, 0.052),
        windowFrameMat
      );
      mullion.name = `${bayWallGroup.name}.frontMullion.${mz < 0 ? "north" : "south"}`;
      mullion.position.set(bayInnerFrontX - 0.144, sillY + winH / 2, centerZ + mz);
      bayWallGroup.add(mullion);
    }
    const frontLightW = frontW / 3 - 0.052;
    const frontClearH = winH - 0.156;
    for (let fl = 0; fl < 3; fl++) {
      const flCenterZ = centerZ + (fl - 1) * (frontW / 3);
      for (const sz of [-1, 1] as const) {
        const sStile = new THREE.Mesh(
          new THREE.BoxGeometry(0.044, frontClearH, 0.026),
          windowFrameMat
        );
        sStile.name = `${bayWallGroup.name}.frontSash.${fl + 1}.stile.${sz < 0 ? 'north' : 'south'}`;
        sStile.position.set(
          bayInnerFrontX - 0.152,
          sillY + winH / 2,
          flCenterZ + sz * (frontLightW * 0.5 - 0.013)
        );
        bayWallGroup.add(sStile);
      }
      for (const barFrac of [0.33, 0.67] as const) {
        const gBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.042, 0.02, frontLightW - 0.052),
          windowFrameMat
        );
        gBar.name = `${bayWallGroup.name}.frontSash.${fl + 1}.glazingBar.${barFrac < 0.5 ? 1 : 2}`;
        gBar.position.set(bayInnerFrontX - 0.150, sillY + 0.078 + frontClearH * barFrac, flCenterZ);
        bayWallGroup.add(gBar);
      }
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
