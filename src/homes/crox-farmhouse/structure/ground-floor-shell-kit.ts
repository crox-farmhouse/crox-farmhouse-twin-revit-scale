import * as THREE from 'three';
import { addCasedArchitravePortal, buildMiteredPolylineStrip, buildPolygonalFloorSlab, type Point2D } from '../../../engine/geometry/index.ts';
import { buildTraditionalWindowCurtains } from '../../../objects/decor/curtains-and-fiddle-leaf-plant.ts';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../types/scene.ts';
import { getEastWingSouthWallZ, type createGroundFloorMaterials } from './ground-floor-materials.ts';

/**
 * Ground-floor shell kit: wall/window/door/radiator/bay-window helpers, UV mappers, floor-height and courtyard-grade functions.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function createGroundFloorShellKit(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'courtyardDoorMat' | 'courtyardDoorRecessMat' | 'doorH' | 'exteriorBrickMat' | 'farrowAndBallCordMat' | 'farrowAndBallPantalonMat' | 'frontWallH' | 'oakMat' | 'plasterMat' | 'skirtingMat' | 'stoneSillMat' | 'tagCutawayWall' | 'timberDoorMat' | 'wallCapMat' | 'wallH' | 'warmRoomPlasterMat' | 'windowFrameMat' | 'windowGlassMat'>,
  options?: { readonly courtyardZShift?: number; readonly courtyardFollowsEastWing?: boolean }
) {
  const courtyardZShift = options?.courtyardZShift ?? 0;
  const courtyardFollowsEastWing = options?.courtyardFollowsEastWing ?? false;
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
    plasterMat,
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
  // =========================================================================
  // Helper Functions for Architectural Walls, Windows, Doors & Fireplaces
  // =========================================================================

  /**
   * Builds a solid interior wall segment with a dark cutaway cap on top.
   */
  const addInteriorWall = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material | THREE.Material[] = plasterMat
  ): void => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const topEdgeY = y + h / 2;
    if (Math.abs(topEdgeY - wallH) < 0.05 || Math.abs(topEdgeY - frontWallH) < 0.05) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.004, 0.025, d + 0.004), wallCapMat);
      cap.position.set(x, topEdgeY + 0.012, z);
      scene.add(cap);
    }

    // Automatically add consistent 0.145m-tall antique-profiled oak skirting boards on both faces of full-height interior walls that reach or span across floorY (Issue #10)
    if (h > 1.5) {
      const baseH = 0.122;
      const capH = 0.024;
      const skirtT = 0.022;
      const capT = 0.016;
      if (w >= d) {
        // East-West interior wall: add antique oak skirting on North (-Z) and South (+Z) faces if wall spans down to floorY
        for (const side of [-1, 1] as const) {
          const floorY = getInteriorFloorY(x, z + side * (d / 2 + 0.08));
          if (y - h / 2 > floorY + 0.12 || y + h / 2 < floorY + 0.5) continue;
          const faceZ = z + side * (d / 2 + skirtT / 2 - 0.002);
          const capZ = z + side * (d / 2 + capT / 2 - 0.002);
          const skirt = new THREE.Mesh(
            new THREE.BoxGeometry(w, baseH, skirtT),
            antiqueOakSkirtingMat
          );
          skirt.position.set(x, floorY + baseH / 2, faceZ);
          skirt.receiveShadow = true;
          scene.add(skirt);

          const skirtCap = new THREE.Mesh(
            new THREE.BoxGeometry(w, capH, capT),
            antiqueOakSkirtingMat
          );
          skirtCap.position.set(x, floorY + baseH + capH / 2, capZ);
          scene.add(skirtCap);
        }
      } else {
        // North-South interior wall: add antique oak skirting on West (-X) and East (+X) faces if wall spans down to floorY (Issue #10)
        for (const side of [-1, 1] as const) {
          const floorY = getInteriorFloorY(x + side * (w / 2 + 0.08), z);
          if (y - h / 2 > floorY + 0.12 || y + h / 2 < floorY + 0.5) continue;
          const faceX = x + side * (w / 2 + skirtT / 2 - 0.002);
          const capX = x + side * (w / 2 + capT / 2 - 0.002);
          const skirt = new THREE.Mesh(
            new THREE.BoxGeometry(skirtT, baseH, d),
            antiqueOakSkirtingMat
          );
          skirt.position.set(faceX, floorY + baseH / 2, z);
          skirt.receiveShadow = true;
          scene.add(skirt);

          const skirtCap = new THREE.Mesh(
            new THREE.BoxGeometry(capT, capH, d),
            antiqueOakSkirtingMat
          );
          skirtCap.position.set(capX, floorY + baseH + capH / 2, z);
          scene.add(skirtCap);
        }
      }
    }
  };

  // World-space UV mapper so Imperial Brick courses (1.44m wide x 1.328m tall per 16-course tile)
  // align seamlessly across all wall piers, window/door headers, bay walls, and gable ends!
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
      const wz = pos.getZ(i) + offsetZ;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));

      if (nx >= nz && nx >= ny) {
        // East (+X) or West (-X) face
        uv.setXY(i, wz / tileW, wy / tileH);
      } else if (nz >= nx && nz >= ny) {
        // South (+Z) or North (-Z) face
        uv.setXY(i, wx / tileW, wy / tileH);
      } else {
        // Top (+Y) or Bottom (-Y) reveal/coping face
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
  };

  /**
   * Computes the vertical ground elevation Y (in meters, <= 0) across the sloped
   * Courtyard & West Wing exterior at world coordinates (wx, wz):
   * - Issue #26: Distributes the grade gently across the full width (X = -4.52m..-15.95m) and length (Z = 2.63m..8.65m)
   *   of the courtyard so that every doorway has a flat, zero-drop threshold matching the house interior floor levels:
   *   - Kitchen & Dining Room Courtyard Door (X >= -8.8m, Z = 2.63m): Y ≈ 0.00m
   *   - Entrance Hall Courtyard Door (X = -14.85m, Z = 2.63m): Y ≈ -0.30m
   *   - Plant Room / Study Courtyard Door & Split Gate (X <= -15.95m, Z >= 8.65m, including [-16.377, 9.164]): flat threshold at Y = -0.60m
   */
  const getCourtyardGroundY = (wx: number, wz: number): number => {
    const northZ = courtyardFollowsEastWing
      ? getEastWingSouthWallZ(wx) - 0.05
      : 2.63 + courtyardZShift;
    const tx = Math.max(0, Math.min(1, (-4.52 - wx) / 11.43));
    const smoothTx = 0.55 * tx + 0.45 * tx * tx * (3 - 2 * tx);

    const northTx = Math.max(0, Math.min(1, (-8.2 - wx) / 6.8));
    const smoothNorthTx = northTx * northTx * (3 - 2 * northTx);

    const tz = Math.max(0, Math.min(1, (wz - northZ) / Math.max(1.0, 8.65 - northZ)));
    const smoothTz = 0.5 * tz + 0.5 * tz * tz * (3 - 2 * tz);

    const westEdgeY = -0.3 * smoothNorthTx * (1 - smoothTz) - 0.6 * smoothTz;
    const westDrop = westEdgeY * smoothTx;

    const seStartZ = courtyardFollowsEastWing ? northZ + 4.35 : 6.98 + courtyardZShift;
    const seTz = Math.max(0, Math.min(1, (wz - seStartZ) / 9.0));
    const smoothSeTz = seTz * seTz * (3 - 2 * seTz);
    const eastDrop = -0.18 * (1 - smoothTx) * smoothSeTz;

    return westDrop + eastDrop;
  };

  /**
   * Returns the interior ground floor elevation Y for a given world (X, Z) coordinate:
   * - Tier 0 (Dining Room & East Wing, X > -9.68m): Y = 0.00m
   * - Tier 1 (Boot Lobby / WC & Entrance Hall with Stairs): Y = -0.30m (30cm step down)
   * - Tier 2 (Front Entrance Hallway, Front Room, Sitting Room, Study & Plant Room): Y = -0.60m (another 30cm drop)
   */
  const getInteriorFloorY = (wx: number, wz = 0): number => {
    if (wx > -9.68) return 0;
    const southLimitZ = courtyardFollowsEastWing
      ? getEastWingSouthWallZ(wx) - 0.08
      : 2.6 + courtyardZShift;
    if (
      wz < southLimitZ &&
      (wx > -17.25 || (wx > -17.85 && wz < southLimitZ - 0.555))
    ) {
      return -0.3;
    }
    return -0.6;
  };

  // Issue #11: Continuous subtle angle (-2.63°) for the East Courtyard Wall of the West Wing
  // running in one unbroken straight line from [-16.82, 2.40] (Hall South corner) to [-17.25, 11.77] (Plant Room SE corner)
  const eastCourtyardWallSlopeXPerZ = (-17.25 - -16.82) / (11.77 - 2.4); // -0.04589114
  const eastCourtyardWallAngleY = Math.atan(eastCourtyardWallSlopeXPerZ); // -0.045859 rad
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
   * Builds a 0.28m exterior Victorian brick wall segment with world-space UV-mapped
   * Imperial Brick on the exterior faces and warm lime plaster (or dark slate-blue in Front Room)
   * on the interior face, plus a consistent 0.14m white skirting board along the interior base.
   */
  const addExteriorBrickWall = (
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
    const rawCx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const isAlongX = interiorSide === 'north' || interiorSide === 'south';
    const isAngledEastCourtyardWall =
      !isAlongX && interiorSide === 'west' && rawCx > -18.0 && minZ >= 2.35;
    const slopeXPerZ = isAngledEastCourtyardWall ? eastCourtyardWallSlopeXPerZ : 0;
    const cx = isAngledEastCourtyardWall ? getEastCourtyardWallCenterX(cz) : rawCx;
    const effMinX = cx - w / 2;
    const effMaxX = cx + w / 2;

    const cutawayWall: CutawayWallDescriptor = isAlongX
      ? {
          axis: 'z',
          coord: cz,
          minSpan: minX,
          maxSpan: maxX,
          floor: 'ground',
        }
      : {
          axis: 'x',
          coord: rawCx,
          minSpan: minZ,
          maxSpan: maxZ,
          floor: 'ground',
        };

    const intFloorY = getInteriorFloorY(rawCx, cz);
    const actualYBottom =
      Math.abs(yBottom) < 0.01
        ? Math.min(0, intFloorY, getCourtyardGroundY(cx, cz) - 0.04)
        : yBottom;
    const h = yTop - actualYBottom;
    const cy = (actualYBottom + yTop) / 2;

    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, cx, cy, cz);
    shearGeometryAlongZ(geo, slopeXPerZ);

    // Front / Cinema Room (X < -17.55m, Z < 1.98m) has Farrow & Ball "Pantalon" walls; Sitting Room (X < -16.8m, Z = 3.62..8.40m) has Farrow & Ball "Cord" (Issue #14)
    const interiorMat =
      rawCx < -17.55 && cz < 1.98
        ? farrowAndBallPantalonMat
        : rawCx < -16.8 && cz > 3.62 && cz < 8.4
          ? farrowAndBallCordMat
          : warmRoomPlasterMat;

    const hasWestInteriorReturn = interiorSide === 'north' && minX < -16.9;

    // BoxGeometry face material order: [0: +X (East), 1: -X (West), 2: +Y (Top), 3: -Y (Bottom), 4: +Z (South), 5: -Z (North)]
    const materials: THREE.Material[] = [
      interiorSide === 'east' ? interiorMat : exteriorBrickMat,
      interiorSide === 'west' || hasWestInteriorReturn ? interiorMat : exteriorBrickMat,
      exteriorBrickMat,
      exteriorBrickMat,
      interiorSide === 'south' ? interiorMat : exteriorBrickMat,
      interiorSide === 'north' ? interiorMat : exteriorBrickMat,
    ];

    const brickMesh = new THREE.Mesh(geo, materials);
    brickMesh.position.set(cx, cy, cz);
    brickMesh.castShadow = true;
    brickMesh.receiveShadow = true;
    tagCutawayWall(brickMesh, cutawayWall);
    scene.add(brickMesh);

    if (Math.abs(yTop - wallH) < 0.05 || Math.abs(yTop - frontWallH) < 0.05) {
      const cap = new THREE.Mesh(
        shearGeometryAlongZ(
          new THREE.BoxGeometry(Math.max(0.02, w + 0.004), 0.025, Math.max(0.02, d + 0.004)),
          slopeXPerZ
        ),
        wallCapMat
      );
      cap.position.set(cx, yTop + 0.012, cz);
      tagCutawayWall(cap, cutawayWall);
      scene.add(cap);
    }

    // Automatically add a consistent 0.145m-tall antique-profiled oak skirting board along the interior base of floor-reaching exterior walls (Issue #14)
    if (Math.abs(yBottom) < 0.01 && yTop - intFloorY > 0.35) {
      const baseH = 0.122;
      const capH = 0.024;
      const skirtT = 0.022;
      const capT = 0.016;
      const skirtGeo = isAlongX
        ? new THREE.BoxGeometry(w, baseH, skirtT)
        : shearGeometryAlongZ(new THREE.BoxGeometry(skirtT, baseH, d), slopeXPerZ);
      const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
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
      skirtMesh.position.set(sx, intFloorY + baseH / 2, sz);
      skirtMesh.receiveShadow = true;
      tagCutawayWall(skirtMesh, cutawayWall);
      scene.add(skirtMesh);

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
      skirtCap.position.set(capSx, intFloorY + baseH + capH / 2, capSz);
      tagCutawayWall(skirtCap, cutawayWall);
      scene.add(skirtCap);

      if (hasWestInteriorReturn) {
        const westFloorY = -0.6;
        const westSkirt = new THREE.Mesh(
          new THREE.BoxGeometry(skirtT, baseH, d),
          antiqueOakSkirtingMat
        );
        westSkirt.position.set(minX - skirtT / 2 + 0.002, westFloorY + baseH / 2, cz);
        westSkirt.receiveShadow = true;
        tagCutawayWall(westSkirt, cutawayWall);
        scene.add(westSkirt);

        const westSkirtCap = new THREE.Mesh(
          new THREE.BoxGeometry(capT, capH, d),
          antiqueOakSkirtingMat
        );
        westSkirtCap.position.set(minX - capT / 2 + 0.002, westFloorY + baseH + capH / 2, cz);
        tagCutawayWall(westSkirtCap, cutawayWall);
        scene.add(westSkirtCap);
      }
    }
  };

  /**
   * Builds an exterior brick wall along X (North or South facade) with a multi-pane Georgian casement window.
   */
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
    panes = 3
  ): void => {
    const winLeft = winCenterX - winWidth / 2;
    const winRight = winCenterX + winWidth / 2;
    const yOffset = winCenterX < -13.0 ? -0.32 : 0;
    const effSillY = sillY + yOffset;
    const effHeadY = headY + yOffset * 0.5;

    if (winLeft > minX + 0.02) {
      addExteriorBrickWall(minX, winLeft, minZ, maxZ, 0, wallH, interiorSide);
    }
    if (winRight < maxX - 0.02) {
      addExteriorBrickWall(winRight, maxX, minZ, maxZ, 0, wallH, interiorSide);
    }
    // Sill wall below window & lintel wall above window
    addExteriorBrickWall(winLeft, winRight, minZ, maxZ, 0, effSillY, interiorSide);
    addExteriorBrickWall(winLeft, winRight, minZ, maxZ, effHeadY, wallH, interiorSide);

    const cz = (minZ + maxZ) / 2;
    const winH = effHeadY - effSillY;
    const cy = effSillY + winH / 2;
    const winGroup = new THREE.Group();
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
    topRail.position.set(winCenterX, effHeadY - 0.027, cz);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.055, frameDepth),
      windowFrameMat
    );
    botRail.position.set(winCenterX, effSillY + 0.027, cz);
    winGroup.add(botRail);

    for (let i = 0; i <= panes; i++) {
      const mx = winLeft + (i / panes) * winWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, winH, frameDepth),
        windowFrameMat
      );
      mullion.position.set(mx, cy, cz);
      winGroup.add(mullion);
    }

    // Horizontal glazing bar
    const transBar = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, 0.028, frameDepth * 0.7),
      windowFrameMat
    );
    transBar.position.set(winCenterX, effSillY + winH * 0.52, cz);
    winGroup.add(transBar);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(winWidth - 0.06, winH - 0.08, 0.016), windowGlassMat);
    glass.position.set(winCenterX, cy, cz);
    winGroup.add(glass);

    scene.add(winGroup);
  };

  /**
   * Builds an exterior brick wall along Z (East or West facade) with a multi-pane Georgian casement window.
   */
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
    const winGroup = new THREE.Group();
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
        new THREE.BoxGeometry(frameDepth, 0.055, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
    topRail.position.set(cx, effHeadY - 0.027, winCenterZ);
    winGroup.add(topRail);

    const botRail = new THREE.Mesh(
      shearGeometryAlongZ(
        new THREE.BoxGeometry(frameDepth, 0.055, winWidth),
        slopeXPerZ
      ),
      windowFrameMat
    );
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
   * Builds an interactive traditional 4-panel period interior door (clickable in the 3D view — Issue #13).
   * - If `axis === 'z'`, the doorway runs along the Z axis (in a North-South wall at `wallX`).
   * - If `axis === 'x'`, the doorway runs along the X axis (in an East-West wall at `wallZ`).
   */
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

    if (axis === 'z') {
      const doorObj = new THREE.Group();
      doorObj.position.set(wallCoord, baseFloorY + doorH / 2, doorCenter);

      // Recessed panel core slab
      const leafCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, leafH, leafW),
        timberDoorMat
      );
      leafCore.castShadow = true;
      leafCore.receiveShadow = true;
      doorObj.add(leafCore);

      // Left & right outer stiles
      for (const side of [-1, 1] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.046, leafH, stileW),
          timberDoorMat
        );
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
        rose.rotation.z = Math.PI / 2;
        rose.position.set(xSide * 0.026, lockRailY, knobZ);
        doorObj.add(rose);

        const knob = new THREE.Mesh(
          new THREE.SphereGeometry(0.023, 10, 10),
          brassMat
        );
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
      doorObj.position.set(doorCenter, baseFloorY + doorH / 2, wallCoord);

      // Recessed panel core slab
      const leafCore = new THREE.Mesh(
        new THREE.BoxGeometry(leafW, leafH, 0.028),
        timberDoorMat
      );
      leafCore.castShadow = true;
      leafCore.receiveShadow = true;
      doorObj.add(leafCore);

      // Left & right outer stiles
      for (const side of [-1, 1] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(stileW, leafH, 0.046),
          timberDoorMat
        );
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
        rose.rotation.x = Math.PI / 2;
        rose.position.set(knobX, lockRailY, zSide * 0.026);
        doorObj.add(rose);

        const knob = new THREE.Mesh(
          new THREE.SphereGeometry(0.023, 10, 10),
          brassMat
        );
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
    doorstep.position.set(doorCenterX, Math.max(baseY, extGroundY) - 0.015, stepZ);
    doorstep.castShadow = true;
    doorstep.receiveShadow = true;
    doorstep.userData.isArchitecturalShell = true;
    scene.add(doorstep);

    // Interactive Half-Glazed Farmhouse Courtyard Door Leaf (painted in warm heritage sage-putty grey — Issue #6: sized to fill frame opening tightly)
    const leafW = doorWidth - 0.058;
    const leafH = doorTotalH - 0.068; // 1.952m
    const doorObj = new THREE.Group();
    doorObj.position.set(doorCenterX, baseY + 0.035 + leafH / 2, cz);

    // Lower solid Shaker panel section (bottom 0.90m of door)
    const lowerPanelH = 0.9;
    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, lowerPanelH, 0.054),
      courtyardDoorMat
    );
    lowerPanel.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    doorObj.add(lowerPanel);

    // Recessed Shaker moulding on lower door panel
    const lowerRecess = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.22, lowerPanelH - 0.22, 0.06),
      courtyardDoorRecessMat
    );
    lowerRecess.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    doorObj.add(lowerRecess);

    // Full-height outer stiles & top/middle rails framing the 4-pane glazed upper window
    const upperH = leafH - lowerPanelH;
    for (const sx of [-leafW / 2 + 0.058, leafW / 2 - 0.058]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.116, leafH, 0.056),
        courtyardDoorMat
      );
      stile.position.set(sx, 0, 0);
      stile.castShadow = true;
      doorObj.add(stile);
    }
    const midLockRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    midLockRail.position.set(0, -leafH / 2 + lowerPanelH, 0);
    midLockRail.castShadow = true;
    doorObj.add(midLockRail);

    const topDoorRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
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
    doorGlass.position.set(0, glassCenterY, 0);
    doorObj.add(doorGlass);

    const vMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, glassH, 0.036),
      courtyardDoorMat
    );
    vMuntin.position.set(0, glassCenterY, 0);
    doorObj.add(vMuntin);

    const hMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, 0.026, 0.036),
      courtyardDoorMat
    );
    hMuntin.position.set(0, glassCenterY, 0);
    doorObj.add(hMuntin);

    // Brass lever handle & lock escutcheon at lock rail height
    const handlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.15, 0.072),
      brassMat
    );
    handlePlate.position.set(leafW / 2 - 0.06, -0.06, 0);
    doorObj.add(handlePlate);

    for (const hz of [-0.052, 0.052]) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.018, 0.018),
        brassMat
      );
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
    doorObj.position.set(cx, baseY + 0.035 + leafH / 2, doorCenterZ);
    if (isAngledEastCourtyardWall) {
      doorObj.rotation.y = eastCourtyardWallAngleY;
    }

    // Full-height solid timber door core slab
    const solidDoorCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, leafH, leafW),
      courtyardDoorMat
    );
    solidDoorCore.castShadow = true;
    solidDoorCore.receiveShadow = true;
    doorObj.add(solidDoorCore);

    // Outer left/right stiles & top/middle/bottom horizontal framing rails on both faces
    for (const sz of [-leafW / 2 + 0.06, leafW / 2 - 0.06]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, leafH, 0.12),
        courtyardDoorMat
      );
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
        vGroove.position.set(0, pMidY, seamZ);
        doorObj.add(vGroove);
      }
    }

    const handlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.072, 0.15, 0.042),
      brassMat
    );
    handlePlate.position.set(0, -0.06, -leafW / 2 + 0.06);
    doorObj.add(handlePlate);

    for (const hx of [-0.052, 0.052]) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.018, 0.11),
        brassMat
      );
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
   * Builds a traditional free-standing multi-column Victorian cast-iron radiator
   * in dark anthracite/gunmetal iron with integral curved footed end sections,
   * scalloped top/bottom horizontal header barrels, and aged-brass TRV/lockshield valves
   * (matching media_1790547890733.png — Issues #11 & #17).
   */
  const addSlattedRadiatorCover = (
    cx: number,
    floorY: number,
    cz: number,
    width: number,
    height = 0.58,
    depth = 0.16,
    rotationY = 0,
    _withCandleAndKey = false,
    cutawayDesc?: CutawayWallDescriptor
  ): void => {
    const radGroup = new THREE.Group();
    radGroup.name =
      cz > 2
        ? cx < -20
          ? 'sittingRoom.castIronRadiator.westBay'
          : 'sittingRoom.castIronRadiator.eastWall'
        : cx < -20
          ? 'livingRoom.castIronRadiator.westBay'
          : 'livingRoom.castIronRadiator.eastWall';
    radGroup.userData.zone = cz > 2 ? 'sittingRoom' : 'livingRoom';
    radGroup.position.set(cx, floorY, cz);
    radGroup.rotation.y = rotationY;
    if (cutawayDesc) {
      tagCutawayWall(radGroup, cutawayDesc);
    }

    const anthraciteCastIronMat = new THREE.MeshStandardMaterial({
      color: 0x383b40, // Dark anthracite/gunmetal cast iron (media_1790547890733.png bottom-right)
      roughness: 0.34,
      metalness: 0.68,
    });
    const castIronShadowMat = new THREE.MeshStandardMaterial({
      color: 0x26282c,
      roughness: 0.42,
      metalness: 0.62,
    });

    const effW = Math.min(width, 1.04); // Proportional free-standing cast-iron radiator length
    const effH = Math.min(height, 0.58);
    const effD = Math.min(depth, 0.165);
    const bodyBotY = 0.105; // Clearance above floor for integral cast-iron feet
    const bodyTopY = effH;
    const colH = bodyTopY - bodyBotY;
    const colMidY = (bodyBotY + bodyTopY) * 0.5;

    // Top and bottom horizontal waterway header barrels connecting all cast-iron sections
    for (const headerY of [bodyBotY + 0.034, bodyTopY - 0.034] as const) {
      const headerBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, effW - 0.016, 16),
        anthraciteCastIronMat
      );
      headerBarrel.name = `${radGroup.name}.headerBarrel`;
      headerBarrel.rotation.x = Math.PI / 2;
      headerBarrel.position.set(0, headerY, 0);
      headerBarrel.castShadow = true;
      headerBarrel.receiveShadow = true;
      radGroup.add(headerBarrel);
    }

    // Individual 4-column cast-iron sections spaced every 62mm along Z
    const sectionCount = Math.max(10, Math.round(effW / 0.062));
    const sectionSpan = effW - 0.06;
    const colOffsetsX = [-effD * 0.38, -effD * 0.13, effD * 0.13, effD * 0.38] as const;

    for (let s = 0; s < sectionCount; s++) {
      const sz = -sectionSpan * 0.5 + (s / (sectionCount - 1)) * sectionSpan;
      const isEndSection = s === 0 || s === sectionCount - 1;
      const isMidFootSection = sectionCount >= 14 && s === Math.floor(sectionCount / 2);

      // Top & bottom rounded cast-iron manifold bosses for this section
      for (const bossY of [bodyBotY + 0.034, bodyTopY - 0.034] as const) {
        const sectionBoss = new THREE.Mesh(
          new THREE.BoxGeometry(effD - 0.008, 0.06, 0.044),
          anthraciteCastIronMat
        );
        sectionBoss.position.set(0, bossY, sz);
        sectionBoss.castShadow = true;
        sectionBoss.receiveShadow = true;
        radGroup.add(sectionBoss);

        // Decorative circular bush ring on the end sections (visible in media_1790547890733.png)
        if (isEndSection) {
          const endBush = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.052, 14),
            castIronShadowMat
          );
          endBush.rotation.x = Math.PI / 2;
          endBush.position.set(0, bossY, sz);
          radGroup.add(endBush);
        }
      }

      // 4 thicker vertical cast-iron water columns per section (Issue #4)
      for (const colX of colOffsetsX) {
        const colTube = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0165, 0.0165, colH - 0.016, 14),
          anthraciteCastIronMat
        );
        colTube.name = `${radGroup.name}.column`;
        colTube.scale.set(1.18, 1, 1.06);
        colTube.position.set(colX, colMidY, sz);
        colTube.castShadow = true;
        colTube.receiveShadow = true;
        radGroup.add(colTube);
      }

      // Internal tie-rod spacer bosses at mid-height
      const midTie = new THREE.Mesh(
        new THREE.BoxGeometry(effD - 0.02, 0.026, 0.032),
        castIronShadowMat
      );
      midTie.position.set(0, colMidY, sz);
      radGroup.add(midTie);

      // Integral curved splayed cast-iron feet on the outer end sections (and middle if wide)
      if (isEndSection || isMidFootSection) {
        for (const footSideX of [-1, 1] as const) {
          const footLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.014, bodyBotY + 0.028, 12),
            anthraciteCastIronMat
          );
          footLeg.name = `${radGroup.name}.foot`;
          footLeg.position.set(
            footSideX * (effD * 0.41),
            (bodyBotY + 0.015) * 0.5,
            sz
          );
          footLeg.rotation.z = footSideX * 0.14;
          footLeg.castShadow = true;
          radGroup.add(footLeg);

          const footPad = new THREE.Mesh(
            new THREE.BoxGeometry(0.034, 0.012, 0.038),
            castIronShadowMat
          );
          footPad.position.set(footSideX * (effD * 0.45), 0.006, sz);
          radGroup.add(footPad);
        }
      }
    }

    // Traditional aged-brass TRV & lockshield valves + vertical brass floor pipe risers at both ends
    for (const endSign of [-1, 1] as const) {
      const valveZ = endSign * (sectionSpan * 0.5 + 0.042);
      const pipeY = (bodyBotY + 0.032) * 0.5;

      // Vertical brass flow/return riser pipe from floor
      const riserPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, bodyBotY + 0.032, 12),
        brassMat
      );
      riserPipe.name = `${radGroup.name}.valvePipe`;
      riserPipe.position.set(0, pipeY, valveZ);
      riserPipe.castShadow = true;
      radGroup.add(riserPipe);

      // Brass floor collar rose
      const floorRose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.024, 0.008, 14),
        brassMat
      );
      floorRose.position.set(0, 0.004, valveZ);
      radGroup.add(floorRose);

      // Horizontal brass union tail into bottom radiator bush
      const unionTail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12),
        brassMat
      );
      unionTail.rotation.x = Math.PI / 2;
      unionTail.position.set(0, bodyBotY + 0.032, valveZ - endSign * 0.02);
      radGroup.add(unionTail);

      // Brass valve body & wheelhead/TRV cap
      const valveHead = new THREE.Mesh(
        new THREE.CylinderGeometry(
          endSign > 0 ? 0.018 : 0.014,
          0.013,
          endSign > 0 ? 0.052 : 0.036,
          12
        ),
        brassMat
      );
      valveHead.name = `${radGroup.name}.brassValve`;
      valveHead.position.set(0, bodyBotY + 0.068, valveZ);
      radGroup.add(valveHead);
    }

    // Top-right brass air-bleed vent plug
    const bleedPlug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.022, 10),
      brassMat
    );
    bleedPlug.rotation.x = Math.PI / 2;
    bleedPlug.position.set(0, bodyTopY - 0.032, sectionSpan * 0.5 + 0.022);
    radGroup.add(bleedPlug);

    // Pair of dark cast-iron wall stay brackets anchoring the rear (-X) of the radiator
    for (const stayZ of [-effW * 0.28, effW * 0.28] as const) {
      const wallStay = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.065, 8),
        castIronShadowMat
      );
      wallStay.rotation.z = Math.PI / 2;
      wallStay.position.set(-effD * 0.5 - 0.025, bodyTopY - 0.08, stayZ);
      radGroup.add(wallStay);
    }

    scene.add(radGroup);
  };

  const greyRoomCarpetMat = new THREE.MeshStandardMaterial({
    color: 0xb8b4ae, // Soft light-grey carpet in both Front Room and Living Room (including inside the canted bays!)
    roughness: 0.94,
  });

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
    const bayWallGroup = new THREE.Group();
    tagCutawayWall(bayWallGroup, bayCutawayDesc);

    // Canted polygonal interior white ceiling soffit & true 3-Facet Pitched Hipped Lead/Slate Bay Roof (Issue #14)
    // Added to `bayWallGroup` (in `scene`) so the bay window always has its pitched exterior roof!
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

    // Interior ceiling soffit & overhanging white eaves fascia deck (Y = frontWallH..frontWallH + 0.055m)
    buildPolygonalFloorSlab(
      bayWallGroup,
      [
        [wallInnerX + 0.02, centerZ - bayHalfZ - 0.04],
        [bayInnerFrontX - 0.28, centerZ - frontW / 2 - 0.14],
        [bayInnerFrontX - 0.28, centerZ + frontW / 2 + 0.14],
        [wallInnerX + 0.02, centerZ + bayHalfZ + 0.04],
      ],
      frontWallH + 0.02,
      0.04,
      skirtingMat,
      0.5
    );
    buildPolygonalFloorSlab(
      bayWallGroup,
      [
        [wallInnerX - 0.26, centerZ - bayHalfZ - 0.18],
        [bayInnerFrontX - 0.36, centerZ - frontW / 2 - 0.22],
        [bayInnerFrontX - 0.36, centerZ + frontW / 2 + 0.22],
        [wallInnerX - 0.26, centerZ + bayHalfZ + 0.18],
      ],
      frontWallH + 0.055,
      0.035,
      skirtingMat,
      0.5
    );

    // True 3-Facet Pitched Hipped Bay Roof sloping from the main West brick wall (X = -22.46m, Y = frontWallH + 0.32m)
    // down to the overhanging canted eaves (Y = frontWallH + 0.055m)
    const eaveRoofY = frontWallH + 0.055;
    const ridgeRoofY = frontWallH + 0.32;
    const wallApexX = wallInnerX - 0.265; // Flush against exterior face of West brick wall (-22.455m)
    const eaveFrontX = bayInnerFrontX - 0.36; // Overhanging front eaves (-22.88m)

    const e0 = new THREE.Vector3(wallApexX, eaveRoofY, centerZ - bayHalfZ - 0.18);
    const e1 = new THREE.Vector3(eaveFrontX, eaveRoofY, centerZ - frontW / 2 - 0.22);
    const e2 = new THREE.Vector3(eaveFrontX, eaveRoofY, centerZ + frontW / 2 + 0.22);
    const e3 = new THREE.Vector3(wallApexX, eaveRoofY, centerZ + bayHalfZ + 0.18);
    const rNorth = new THREE.Vector3(wallApexX, ridgeRoofY, centerZ - frontW * 0.42);
    const rSouth = new THREE.Vector3(wallApexX, ridgeRoofY, centerZ + frontW * 0.42);

    const bayRoofPositions: number[] = [];
    const addRoofTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void => {
      bayRoofPositions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };
    // 1. North pitched hip facet (triangle e0 -> e1 -> rNorth)
    addRoofTri(e0, e1, rNorth);
    // 2. Central front pitched trapezoidal slope (quad e1 -> e2 -> rSouth -> rNorth)
    addRoofTri(e1, e2, rSouth);
    addRoofTri(e1, rSouth, rNorth);
    // 3. South pitched hip facet (triangle e2 -> e3 -> rSouth)
    addRoofTri(e2, e3, rSouth);
    // 4. Back closure against the main West brick wall so the prism is watertight
    addRoofTri(e0, rNorth, rSouth);
    addRoofTri(e0, rSouth, e3);

    const bayRoofGeo = new THREE.BufferGeometry();
    bayRoofGeo.setAttribute('position', new THREE.Float32BufferAttribute(bayRoofPositions, 3));
    bayRoofGeo.computeVertexNormals();
    const bayRoofMesh = new THREE.Mesh(bayRoofGeo, bayLeadRoofMat);
    bayRoofMesh.name = 'westBayWindow.pitchedLeadRoof';
    bayRoofMesh.castShadow = true;
    bayRoofMesh.receiveShadow = true;
    bayWallGroup.add(bayRoofMesh);

    // Rounded lead hip roll batten caps along the two diagonal hip ridges (rNorth->e1, rSouth->e2) & wall flashing ridge
    for (const [pStart, pEnd, rad] of [
      [rNorth, e1, 0.022],
      [rSouth, e2, 0.022],
      [e0, rNorth, 0.02],
      [rNorth, rSouth, 0.024],
      [rSouth, e3, 0.02],
    ] as const) {
      const curve = new THREE.LineCurve3(pStart, pEnd);
      const rollMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 8, rad, 10, false),
        bayHipRollMat
      );
      rollMesh.castShadow = true;
      bayWallGroup.add(rollMesh);
    }

    // Vertical standing-seam lead bay roof ribs on the front slope for period authenticity
    for (const seamZOff of [-0.42, 0, 0.42] as const) {
      const pTop = new THREE.Vector3(wallApexX, ridgeRoofY, centerZ + seamZOff);
      const pBot = new THREE.Vector3(eaveFrontX, eaveRoofY, centerZ + seamZOff);
      const seamCurve = new THREE.LineCurve3(pTop, pBot);
      const seamRoll = new THREE.Mesh(
        new THREE.TubeGeometry(seamCurve, 6, 0.012, 8, false),
        bayHipRollMat
      );
      bayWallGroup.add(seamRoll);
    }

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

    // 1. Continuous Mitered Lower Wall across the full room West wall + bay (y = bayBaseY - 0.04 .. sillY, d = -0.28..0)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      bayBaseY - 0.04,
      sillY,
      wallMatTuple
    );

    // 2. Mid-Height Full West Wall Flanks (segments 0 and 4: y = sillY .. headY, d = -0.28..0)
    //    Terminates at the exact miter plane at P1 and P4 against the white window jamb linings!
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      sillY,
      headY,
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
      sillY,
      headY,
      wallMatTuple,
      true,
      true,
      [4, 5]
    );

    // 3. Continuous Mitered Upper Header Wall (y = headY .. frontWallH, d = -0.28..0),
    //    PLUS Flat Interior Header Reveal Wall all the way across X = wallInnerX & Trapezoidal Bay Ceiling Reveal Soffit (Issues #6 & #15)
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.28,
      0,
      headY,
      frontWallH,
      wallMatTuple
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

    // Flat cutaway top cap across the bay opening at X = wallInnerX
    const flatHeaderCap = new THREE.Mesh(
      new THREE.BoxGeometry(flatHeaderDepthX + 0.008, 0.028, flatHeaderLenZ),
      wallCapMat
    );
    flatHeaderCap.position.set(
      wallInnerX - flatHeaderDepthX / 2,
      frontWallH + 0.014,
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
      const bayRevealSoffit = new THREE.Mesh(soffitGeo, skirtingMat);
      bayRevealSoffit.name = 'westBayWindow.revealSoffit';
      bayRevealSoffit.position.set(wallInnerX, headY - 0.012, centerZ);
      bayRevealSoffit.receiveShadow = true;
      bayWallGroup.add(bayRevealSoffit);
    }

    // Moulded white exterior eaves fascia around the 3 projecting bay facets (segments 1..4) under the lead roof
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.315,
      -0.18,
      frontWallH - 0.02,
      frontWallH + 0.045,
      skirtingMat,
      true,
      true,
      [1, 4]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.284,
      0.004,
      frontWallH,
      frontWallH + 0.028,
      wallCapMat,
      false,
      false,
      [0, 1]
    );
    buildMiteredPolylineStrip(
      bayWallGroup,
      bayPolyline,
      -0.284,
      0.004,
      frontWallH,
      frontWallH + 0.028,
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
      casementStay.position.set(0.012, sillY + 0.048, 0);
      hwGroup.add(casementStay);

      const casementHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.075, 0.014),
        brassMat
      );
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
    addExteriorBrickWall,
    addInteractiveInteriorDoor,
    addInteriorWall,
    addSlattedRadiatorCover,
    addWestCantedBayWindow,
    applyWorldSpaceBrickUVs,
    eastCourtyardWallAngleY,
    getCourtyardGroundY,
    getEastCourtyardWallCenterX,
    greyRoomCarpetMat,
  };
}
