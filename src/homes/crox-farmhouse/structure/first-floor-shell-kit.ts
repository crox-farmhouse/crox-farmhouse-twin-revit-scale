import * as THREE from 'three';
import { addCasedArchitravePortal } from '../../../engine/geometry/index.ts';
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
      const baseH = 0.122;
      const capH = 0.024;
      const skirtT = 0.022;
      const capT = 0.016;
      if (w >= d) {
        for (const side of [-1, 1] as const) {
          const faceZ = z + side * (d / 2 + skirtT / 2 - 0.002);
          const capZ = z + side * (d / 2 + capT / 2 - 0.002);
          const skirt = new THREE.Mesh(
            new THREE.BoxGeometry(w, baseH, skirtT),
            antiqueOakSkirtingMat
          );
          skirt.position.set(x, floorTopY + baseH / 2, faceZ);
          skirt.receiveShadow = true;
          scene.add(skirt);

          const skirtCap = new THREE.Mesh(
            new THREE.BoxGeometry(w, capH, capT),
            antiqueOakSkirtingMat
          );
          skirtCap.position.set(x, floorTopY + baseH + capH / 2, capZ);
          skirtCap.receiveShadow = true;
          scene.add(skirtCap);
        }
      } else {
        for (const side of [-1, 1] as const) {
          const faceX = x + side * (w / 2 + skirtT / 2 - 0.002);
          const capX = x + side * (w / 2 + capT / 2 - 0.002);
          const skirt = new THREE.Mesh(
            new THREE.BoxGeometry(skirtT, baseH, d),
            antiqueOakSkirtingMat
          );
          skirt.position.set(faceX, floorTopY + baseH / 2, z);
          skirt.receiveShadow = true;
          scene.add(skirt);

          const skirtCap = new THREE.Mesh(
            new THREE.BoxGeometry(capT, capH, d),
            antiqueOakSkirtingMat
          );
          skirtCap.position.set(capX, floorTopY + baseH + capH / 2, z);
          skirtCap.receiveShadow = true;
          scene.add(skirtCap);
        }
      }
    }
  };

  // Continuous subtle angle (-2.63°) for the East Courtyard Wall of the West Wing
  // running in one unbroken straight line from [-16.82, 2.40] (Hall South corner) to [-17.25, 11.77] (Bedroom 4 / Plant Room SE corner)
  const eastCourtyardWallSlopeXPerZ = (-17.25 - -16.82) / (11.77 - 2.4); // -0.04589114
  const getEastCourtyardWallCenterX = (wz: number): number =>
    -16.82 + eastCourtyardWallSlopeXPerZ * (wz - 2.4);
  const shearGeometryAlongZ = <T extends THREE.BufferGeometry>(
    geo: T,
    slopeXPerZ: number
  ): T => {
    if (Math.abs(slopeXPerZ) < 1e-6) return geo;
    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + slopeXPerZ * pos.getZ(i));
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
    return geo;
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
    const rawCx = (minX + maxX) / 2;
    const cy = (yBottom + yTop) / 2;
    const cz = (minZ + maxZ) / 2;
    const isAlongX = interiorSide === 'north' || interiorSide === 'south';
    const isAngledEastCourtyardWall =
      !isAlongX && interiorSide === 'west' && rawCx > -18.0 && minZ >= 2.3;
    const slopeXPerZ = isAngledEastCourtyardWall ? eastCourtyardWallSlopeXPerZ : 0;
    const cx = isAngledEastCourtyardWall ? getEastCourtyardWallCenterX(cz) : rawCx;
    const effMinX = cx - w / 2;
    const effMaxX = cx + w / 2;

    const descriptor: CutawayWallDescriptor = isAlongX
      ? { axis: 'z', coord: cz, minSpan: minX, maxSpan: maxX, floor: 'first' }
      : { axis: 'x', coord: rawCx, minSpan: minZ, maxSpan: maxZ, floor: 'first' };

    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, cx, cy, cz);
    shearGeometryAlongZ(geo, slopeXPerZ);

    const materials: THREE.Material[] = [
      interiorSide === 'east' ? warmRoomPlasterMat : exteriorBrickMat,
      interiorSide === 'west' ? warmRoomPlasterMat : exteriorBrickMat,
      exteriorBrickMat,
      warmRoomPlasterMat,
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
        shearGeometryAlongZ(
          new THREE.BoxGeometry(Math.max(0.02, w - 0.012), 0.016, Math.max(0.02, d - 0.012)),
          slopeXPerZ
        ),
        wallCapMat
      );
      cap.position.set(cx, upperWallTopY - 0.006, cz);
      tagUpperCutawayWall(cap, descriptor);
      scene.add(cap);
    }

    if (yBottom <= floorTopY + 0.05 && yTop - floorTopY > 0.35) {
      const baseH = 0.122;
      const capH = 0.024;
      const skirtT = 0.022;
      const capT = 0.016;
      const skirtGeo = isAlongX
        ? new THREE.BoxGeometry(w, baseH, skirtT)
        : shearGeometryAlongZ(new THREE.BoxGeometry(skirtT, baseH, d), slopeXPerZ);
      const skirt = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
      const sx =
        interiorSide === 'east'
          ? effMaxX + skirtT / 2 - 0.002
          : interiorSide === 'west'
            ? effMinX - skirtT / 2 + 0.002
            : cx;
      const sz =
        interiorSide === 'south'
          ? maxZ + skirtT / 2 - 0.002
          : interiorSide === 'north'
            ? minZ - skirtT / 2 + 0.002
            : cz;
      skirt.position.set(sx, floorTopY + baseH / 2, sz);
      skirt.receiveShadow = true;
      tagUpperCutawayWall(skirt, descriptor);
      scene.add(skirt);

      const capGeo = isAlongX
        ? new THREE.BoxGeometry(w, capH, capT)
        : shearGeometryAlongZ(new THREE.BoxGeometry(capT, capH, d), slopeXPerZ);
      const skirtCap = new THREE.Mesh(capGeo, antiqueOakSkirtingMat);
      const capSx =
        interiorSide === 'east'
          ? effMaxX + capT / 2 - 0.002
          : interiorSide === 'west'
            ? effMinX - capT / 2 + 0.002
            : cx;
      const capSz =
        interiorSide === 'south'
          ? maxZ + capT / 2 - 0.002
          : interiorSide === 'north'
            ? minZ - capT / 2 + 0.002
            : cz;
      skirtCap.position.set(capSx, floorTopY + baseH + capH / 2, capSz);
      skirtCap.receiveShadow = true;
      tagUpperCutawayWall(skirtCap, descriptor);
      scene.add(skirtCap);
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
    const effSillY = Math.max(sillY, 3.02);
    const effHeadY = Math.min(headY, 3.78);
    const winLeft = winCenterX - winWidth / 2;
    const winRight = winCenterX + winWidth / 2;

    if (winLeft > minX + 0.02) {
      addUpperExteriorBrickWall(minX, winLeft, minZ, maxZ, floorBaseY, upperWallTopY, interiorSide);
    }
    if (winRight < maxX - 0.02) {
      addUpperExteriorBrickWall(winRight, maxX, minZ, maxZ, floorBaseY, upperWallTopY, interiorSide);
    }
    addUpperExteriorBrickWall(winLeft, winRight, minZ, maxZ, floorBaseY, effSillY, interiorSide);
    addUpperExteriorBrickWall(winLeft, winRight, minZ, maxZ, effHeadY, upperWallTopY, interiorSide);

    const cz = (minZ + maxZ) / 2;
    const winH = effHeadY - effSillY;
    const cy = effSillY + winH / 2;
    const winGroup = new THREE.Group();
    tagUpperCutawayWall(winGroup, {
      axis: 'z',
      coord: cz,
      minSpan: minX,
      maxSpan: maxX,
      floor: 'first',
    });

    const extSignZ = interiorSide === 'south' ? -1 : 1;
    const intSignZ = -extSignZ;
    const extFaceZ = interiorSide === 'south' ? minZ : maxZ;
    const intFaceZ = interiorSide === 'south' ? maxZ : minZ;
    const frameZ = extFaceZ + intSignZ * 0.14;

    const sillDepthZ = 0.196;
    const sillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + 0.12, 0.06, sillDepthZ),
      stoneSillMat
    );
    sillMesh.position.set(
      winCenterX,
      effSillY - 0.02,
      frameZ + extSignZ * 0.086
    );
    winGroup.add(sillMesh);

    // Interior plastered window reveal linings (jambs + head soffit) and painted timber window board
    const intRevealDepthZ = Math.max(0.14, Math.abs(intFaceZ - frameZ));
    const intRevealCenterZ = (frameZ + intFaceZ) * 0.5;
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
    revealHead.position.set(winCenterX, effHeadY - 0.005, intRevealCenterZ);
    revealHead.receiveShadow = true;
    winGroup.add(revealHead);

    const windowBoard = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + 0.04, 0.024, intRevealDepthZ + 0.028),
      skirtingMat
    );
    windowBoard.position.set(
      winCenterX,
      effSillY + 0.01,
      intRevealCenterZ + intSignZ * 0.012
    );
    windowBoard.receiveShadow = true;
    winGroup.add(windowBoard);

    const frameDepth = 0.11;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.05, frameDepth),
      windowFrameMat
    );
    topRail.position.set(winCenterX, effHeadY - 0.025, frameZ);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.05, frameDepth),
      windowFrameMat
    );
    botRail.position.set(winCenterX, effSillY + 0.025, frameZ);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mx = winLeft + (i / panes) * winWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, winH, frameDepth),
        windowFrameMat
      );
      mullion.position.set(mx, cy, frameZ);
      winGroup.add(mullion);
    }

    const transBar = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.026, frameDepth * 0.7),
      windowFrameMat
    );
    transBar.position.set(winCenterX, effSillY + winH * 0.52, frameZ);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth - 0.06, winH - 0.08, 0.016),
      windowGlassMat
    );
    glass.position.set(winCenterX, cy, frameZ);
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
    const effSillY = Math.max(sillY, 3.02);
    const effHeadY = Math.min(headY, 3.78);
    const winNorth = winCenterZ - winWidth / 2;
    const winSouth = winCenterZ + winWidth / 2;
    const rawCx = (minX + maxX) / 2;
    const isAngledEastCourtyardWall =
      interiorSide === 'west' && rawCx > -18.0 && minZ >= 2.3;
    const slopeXPerZ = isAngledEastCourtyardWall ? eastCourtyardWallSlopeXPerZ : 0;
    const cx = isAngledEastCourtyardWall
      ? getEastCourtyardWallCenterX(winCenterZ)
      : rawCx;
    // Extend West Wing front-room upper walls (Z <= 8.40m, above Living Room, Entrance Hall & Sitting Room whose ground walls stop at Y = 1.625m)
    // down to Y = 1.625m so there is zero vertical gap between the Ground Floor and First Floor!
    const baseWallY = maxZ <= 8.4 ? 1.625 : floorBaseY;

    if (winNorth > minZ + 0.02) {
      addUpperExteriorBrickWall(minX, maxX, minZ, winNorth, baseWallY, upperWallTopY, interiorSide);
    }
    if (winSouth < maxZ - 0.02) {
      addUpperExteriorBrickWall(minX, maxX, winSouth, maxZ, baseWallY, upperWallTopY, interiorSide);
    }
    addUpperExteriorBrickWall(minX, maxX, winNorth, winSouth, baseWallY, effSillY, interiorSide);
    addUpperExteriorBrickWall(minX, maxX, winNorth, winSouth, effHeadY, upperWallTopY, interiorSide);

    const winH = effHeadY - effSillY;
    const cy = effSillY + winH / 2;
    const winGroup = new THREE.Group();
    tagUpperCutawayWall(winGroup, {
      axis: 'x',
      coord: rawCx,
      minSpan: minZ,
      maxSpan: maxZ,
      floor: 'first',
    });

    const wallDepthX = maxX - minX;
    const extSignX = interiorSide === 'east' ? -1 : 1;
    const intSignX = -extSignX;
    const sillDepthX = wallDepthX * 0.54 + 0.045;
    const sillMesh = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(sillDepthX, 0.06, winWidth + 0.12),
        slopeXPerZ
      ),
      stoneSillMat
    );
    sillMesh.position.set(
      cx + extSignX * (wallDepthX * 0.23 + 0.022),
      effSillY - 0.02,
      winCenterZ
    );
    winGroup.add(sillMesh);

    // Interior plastered window reveal linings (jambs + head soffit) and painted timber window board
    const intRevealDepthX = wallDepthX * 0.52;
    const intRevealCenterX = cx + intSignX * (wallDepthX * 0.24);
    for (const sideZ of [-1, 1] as const) {
      const jambZ = winCenterZ + sideZ * (winWidth * 0.5 - 0.005);
      const jambCx = isAngledEastCourtyardWall
        ? getEastCourtyardWallCenterX(jambZ)
        : rawCx;
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(intRevealDepthX, winH, 0.012),
        warmRoomPlasterMat
      );
      revealJamb.position.set(
        jambCx + intSignX * (wallDepthX * 0.24),
        cy,
        jambZ
      );
      revealJamb.receiveShadow = true;
      winGroup.add(revealJamb);
    }
    const revealHead = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(intRevealDepthX, 0.012, winWidth),
        slopeXPerZ
      ),
      warmRoomPlasterMat
    );
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
        new THREE.BoxGeometry(frameDepth, 0.05, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    topRail.position.set(cx, effHeadY - 0.025, winCenterZ);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(frameDepth, 0.05, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    botRail.position.set(cx, effSillY + 0.025, winCenterZ);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mz = winNorth + (i / panes) * winWidth;
      const mCx = isAngledEastCourtyardWall
        ? getEastCourtyardWallCenterX(mz)
        : rawCx;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepth, winH, 0.042),
        windowFrameMat
      );
      mullion.position.set(mCx, cy, mz);
      winGroup.add(mullion);
    }

    const transBar = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(frameDepth * 0.7, 0.026, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    transBar.position.set(cx, effSillY + winH * 0.52, winCenterZ);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(0.016, winH - 0.08, winWidth - 0.06),
        slopeXPerZ
      ),
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

    addCasedArchitravePortal(scene, {
      axis,
      wallCoord,
      wallThickness,
      openingCenter: doorCenter,
      openingWidth: doorWidth,
      frontFloorY: floorTopY,
      backFloorY: floorTopY,
      headY: floorTopY + doorH,
      material: antiqueOakSkirtingMat,
      namePrefix: 'firstFloorDoor',
    });

    if (axis === 'z') {
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
