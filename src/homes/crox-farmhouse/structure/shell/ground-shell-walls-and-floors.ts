import * as THREE from 'three';
import { createProfiledSkirtingCapGeometry } from '../../../../engine/geometry/index.ts';
import { createWovenWoolCarpetTextures } from '../../../../engine/textures/procedural-textures.ts';
import type { CutawayWallDescriptor } from '../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import { getEastWingSouthWallZ, type createGroundFloorMaterials } from '../ground-floor-materials.ts';

export type GroundShellKitMaterials = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  | 'antiqueOakSkirtingMat'
  | 'brassMat'
  | 'courtyardDoorMat'
  | 'courtyardDoorRecessMat'
  | 'doorH'
  | 'exteriorBrickMat'
  | 'farrowAndBallCordMat'
  | 'farrowAndBallPantalonMat'
  | 'frontWallH'
  | 'oakMat'
  | 'plasterMat'
  | 'skirtingMat'
  | 'stoneSillMat'
  | 'tagCutawayWall'
  | 'timberDoorMat'
  | 'wallCapMat'
  | 'wallH'
  | 'warmRoomPlasterMat'
  | 'windowFrameMat'
  | 'windowGlassMat'
>;

export function createGroundShellWallsAndFloors(
  ctx: SceneBuilderContext,
  kit: GroundShellKitMaterials,
  options?: { readonly courtyardZShift?: number; readonly courtyardFollowsEastWing?: boolean }
) {
  const courtyardZShift = options?.courtyardZShift ?? 0;
  const courtyardFollowsEastWing = options?.courtyardFollowsEastWing ?? false;
  const { scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    exteriorBrickMat,
    farrowAndBallCordMat,
    farrowAndBallPantalonMat,
    frontWallH,
    plasterMat,
    tagCutawayWall,
    wallCapMat,
    wallH,
    warmRoomPlasterMat,
  } = kit;

  /**
   * Builds a solid interior wall segment with a dark cutaway cap on top.
   */
  let intWallSeq = 0;
  const addInteriorWall = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material | THREE.Material[] = plasterMat,
    wallOptions?: {
      readonly skipSkirting?: boolean;
      readonly skirtingSides?: readonly (-1 | 1)[];
      readonly skirtingMin?: number;
      readonly skirtingMax?: number;
    }
  ): void => {
    const wallId = `groundFloor.interiorWall.${++intWallSeq}`;
    const topEdgeY = y + h / 2;
    const includeTopCap =
      Math.abs(topEdgeY - wallH) < 0.05 || Math.abs(topEdgeY - frontWallH) < 0.05;
    const resolvedMat: THREE.Material | THREE.Material[] = includeTopCap
      ? Array.isArray(mat)
        ? mat.map((m, idx) => (idx === 2 ? wallCapMat : m))
        : [mat, mat, wallCapMat, mat, mat, mat]
      : mat;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), resolvedMat);
    mesh.name = wallId;
    mesh.userData.isArchitecturalShell = true;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Automatically add consistent 0.145m-tall antique-profiled oak skirting boards on both faces of full-height interior walls that reach or span across floorY (Issue #10)
    // Skip short doorway return nib piers (Math.max(w, d) <= 0.28) so skirting never protrudes across a doorlining reveal (Issue #8)
    if (!wallOptions?.skipSkirting && h > 1.5 && Math.max(w, d) > 0.28) {
      const floorGap = 0.004;
      const wallGap = 0.004;
      const baseH = 0.114;
      const capH = 0.024;
      const skirtT = 0.020;
      const sides = wallOptions?.skirtingSides ?? ([-1, 1] as const);
      if (w >= d) {
        const sMin = wallOptions?.skirtingMin ?? x - w / 2;
        const sMax = wallOptions?.skirtingMax ?? x + w / 2;
        const sW = sMax - sMin;
        const sCx = (sMin + sMax) / 2;
        if (sW > 0.01) {
          // East-West interior wall: add antique oak skirting on North (-Z) and South (+Z) faces if wall spans down to floorY
          for (const side of sides) {
            const floorY = getInteriorFloorY(sCx, z + side * (d / 2 + 0.08));
            if (y - h / 2 > floorY + 0.12 || y + h / 2 < floorY + 0.5) continue;
            const faceZ = z + side * (d / 2 + wallGap + skirtT / 2);
            const capZ = z + side * (d / 2 + wallGap + 0.008);
            const skirt = new THREE.Mesh(
              new THREE.BoxGeometry(sW, baseH, skirtT),
              antiqueOakSkirtingMat
            );
            skirt.name = `${wallId}.skirting.${side < 0 ? "north" : "south"}`;
            skirt.userData.isArchitecturalShell = true;
            skirt.position.set(sCx, floorY + floorGap + baseH / 2, faceZ);
            skirt.receiveShadow = true;
            scene.add(skirt);

            const skirtCap = new THREE.Mesh(
              createProfiledSkirtingCapGeometry(sW, true, side),
              antiqueOakSkirtingMat
            );
            skirtCap.name = `${wallId}.skirtingCap.${side < 0 ? "north" : "south"}`;
            skirtCap.userData.isArchitecturalShell = true;
            skirtCap.position.set(sCx, floorY + 0.122 + capH / 2, capZ);
            scene.add(skirtCap);
          }
        }
      } else {
        const sMin = wallOptions?.skirtingMin ?? z - d / 2;
        const sMax = wallOptions?.skirtingMax ?? z + d / 2;
        const sD = sMax - sMin;
        const sCz = (sMin + sMax) / 2;
        if (sD > 0.01) {
          // North-South interior wall: add antique oak skirting on West (-X) and East (+X) faces if wall spans down to floorY (Issue #10)
          for (const side of sides) {
            const floorY = getInteriorFloorY(x + side * (w / 2 + 0.08), sCz);
            if (y - h / 2 > floorY + 0.12 || y + h / 2 < floorY + 0.5) continue;
            const faceX = x + side * (w / 2 + wallGap + skirtT / 2);
            const capX = x + side * (w / 2 + wallGap + 0.008);
            const skirt = new THREE.Mesh(
              new THREE.BoxGeometry(skirtT, baseH, sD),
              antiqueOakSkirtingMat
            );
            skirt.name = `${wallId}.skirting.${side < 0 ? "west" : "east"}`;
            skirt.userData.isArchitecturalShell = true;
            skirt.position.set(faceX, floorY + floorGap + baseH / 2, sCz);
            skirt.receiveShadow = true;
            scene.add(skirt);

            const skirtCap = new THREE.Mesh(
              createProfiledSkirtingCapGeometry(sD, false, side),
              antiqueOakSkirtingMat
            );
            skirtCap.name = `${wallId}.skirtingCap.${side < 0 ? "west" : "east"}`;
            skirtCap.userData.isArchitecturalShell = true;
            skirtCap.position.set(capX, floorY + 0.122 + capH / 2, sCz);
            scene.add(skirtCap);
          }
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
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      geo.userData.isSheared = true;
    }
    return geo;
  };

  /**
   * Builds a 0.28m exterior Victorian brick wall segment with world-space UV-mapped
   * Imperial Brick on the exterior faces and warm lime plaster (or dark slate-blue in Front Room)
   * on the interior face, plus a consistent 0.14m white skirting board along the interior base.
   */
  let extWallSeq = 0;
  const addExteriorBrickWall = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    yBottom: number,
    yTop: number,
    interiorSide: 'north' | 'south' | 'east' | 'west',
    wallOptions?: { readonly skipSkirting?: boolean }
  ): void => {
    const w = maxX - minX;
    const d = maxZ - minZ;
    const rawCx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const isAlongX = interiorSide === 'north' || interiorSide === 'south';
    const isAngledEastCourtyardWall =
      !isAlongX && interiorSide === 'west' && rawCx > -18.0 && minZ >= 3.69;
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

    const hasWestInteriorReturn = interiorSide === 'north' && Math.abs(minX - -16.92) < 0.05;

    const includeTopCap =
      Math.abs(yTop - wallH) < 0.05 || Math.abs(yTop - frontWallH) < 0.05;

    // BoxGeometry face material order: [0: +X (East), 1: -X (West), 2: +Y (Top), 3: -Y (Bottom), 4: +Z (South), 5: -Z (North)]
    const materials: THREE.Material[] = [
      interiorSide === 'east' ? interiorMat : exteriorBrickMat,
      interiorSide === 'west' || hasWestInteriorReturn ? interiorMat : exteriorBrickMat,
      includeTopCap ? wallCapMat : exteriorBrickMat,
      exteriorBrickMat,
      interiorSide === 'south' ? interiorMat : exteriorBrickMat,
      interiorSide === 'north' ? interiorMat : exteriorBrickMat,
    ];

    const wallId = `groundFloor.exteriorBrickWall.${++extWallSeq}`;
    const brickMesh = new THREE.Mesh(geo, materials);
    brickMesh.name = wallId;
    brickMesh.position.set(cx, cy, cz);
    brickMesh.castShadow = true;
    brickMesh.receiveShadow = true;
    tagCutawayWall(brickMesh, cutawayWall);
    scene.add(brickMesh);

    // Automatically add a consistent 0.145m-tall antique-profiled oak skirting board along the interior base of floor-reaching exterior walls (Issue #14)
    if (!wallOptions?.skipSkirting && Math.abs(yBottom) < 0.01 && yTop - intFloorY > 0.35) {
      const floorGap = 0.004;
      const wallGap = 0.004;
      const baseH = 0.114;
      const capH = 0.024;
      const skirtT = 0.020;
      const skirtGeo = isAlongX
        ? new THREE.BoxGeometry(w, baseH, skirtT)
        : shearGeometryAlongZ(new THREE.BoxGeometry(skirtT, baseH, d), slopeXPerZ);
      const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
      skirtMesh.name = `${wallId}.skirting`;
      const sx =
        interiorSide === 'east'
          ? effMaxX + wallGap + skirtT / 2
          : interiorSide === 'west'
            ? effMinX - wallGap - skirtT / 2
            : cx;
      const sz =
        interiorSide === 'south'
          ? maxZ + wallGap + skirtT / 2
          : interiorSide === 'north'
            ? minZ - wallGap - skirtT / 2
            : cz;
      skirtMesh.position.set(sx, intFloorY + floorGap + baseH / 2, sz);
      skirtMesh.receiveShadow = true;
      tagCutawayWall(skirtMesh, cutawayWall);
      scene.add(skirtMesh);

      const capInwardSign: 1 | -1 =
        interiorSide === 'south' || interiorSide === 'east' ? 1 : -1;
      const capGeo = isAlongX
        ? createProfiledSkirtingCapGeometry(w, true, capInwardSign)
        : shearGeometryAlongZ(createProfiledSkirtingCapGeometry(d, false, capInwardSign), slopeXPerZ);
      const skirtCap = new THREE.Mesh(capGeo, antiqueOakSkirtingMat);
      skirtCap.name = `${wallId}.skirtingCap`;
      const capSx =
        interiorSide === 'east'
          ? effMaxX + wallGap + 0.008
          : interiorSide === 'west'
            ? effMinX - wallGap - 0.008
            : cx;
      const capSz =
        interiorSide === 'south'
          ? maxZ + wallGap + 0.008
          : interiorSide === 'north'
            ? minZ - wallGap - 0.008
            : cz;
      skirtCap.position.set(capSx, intFloorY + 0.122 + capH / 2, capSz);
      tagCutawayWall(skirtCap, cutawayWall);
      scene.add(skirtCap);

      if (hasWestInteriorReturn) {
        const westFloorY = -0.6;
        const westSkirt = new THREE.Mesh(
          new THREE.BoxGeometry(skirtT, baseH, d),
          antiqueOakSkirtingMat
        );
        westSkirt.name = `${wallId}.westReturnSkirting`;
        westSkirt.position.set(minX - wallGap - skirtT / 2, westFloorY + floorGap + baseH / 2, cz);
        westSkirt.receiveShadow = true;
        tagCutawayWall(westSkirt, cutawayWall);
        scene.add(westSkirt);

        const westSkirtCap = new THREE.Mesh(
          createProfiledSkirtingCapGeometry(d, false, -1),
          antiqueOakSkirtingMat
        );
        westSkirtCap.name = `${wallId}.westReturnSkirtingCap`;
        westSkirtCap.position.set(minX - wallGap - 0.008, westFloorY + 0.122 + capH / 2, cz);
        tagCutawayWall(westSkirtCap, cutawayWall);
        scene.add(westSkirtCap);
      }
    }
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
        sectionBoss.name = `${radGroup.name}.sectionBoss.${s + 1}.${bossY < colMidY ? "bottom" : "top"}`;
        sectionBoss.userData.lodTier = 'high';
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
          endBush.name = `${radGroup.name}.endBush.${s + 1}.${bossY < colMidY ? "bottom" : "top"}`;
          endBush.userData.lodTier = 'high';
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
      midTie.name = `${radGroup.name}.midTie.${s + 1}`;
      midTie.userData.lodTier = 'high';
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
          footPad.name = `${radGroup.name}.footPad.${s + 1}.${footSideX < 0 ? "inner" : "outer"}`;
          footPad.userData.lodTier = 'high';
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
      floorRose.name = `${radGroup.name}.floorRose.${endSign < 0 ? "left" : "right"}`;
      floorRose.userData.lodTier = 'high';
      floorRose.position.set(0, 0.004, valveZ);
      radGroup.add(floorRose);

      // Horizontal brass union tail into bottom radiator bush
      const unionTail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12),
        brassMat
      );
      unionTail.name = `${radGroup.name}.unionTail.${endSign < 0 ? "left" : "right"}`;
      unionTail.userData.lodTier = 'high';
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
    bleedPlug.name = `${radGroup.name}.bleedPlug`;
    bleedPlug.userData.lodTier = 'high';
    bleedPlug.rotation.x = Math.PI / 2;
    bleedPlug.position.set(0, bodyTopY - 0.032, sectionSpan * 0.5 + 0.022);
    radGroup.add(bleedPlug);

    // Pair of dark cast-iron wall stay brackets anchoring the rear (-X) of the radiator
    for (const stayZ of [-effW * 0.28, effW * 0.28] as const) {
      const wallStay = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.065, 8),
        castIronShadowMat
      );
      wallStay.name = `${radGroup.name}.wallStay.${stayZ < 0 ? "left" : "right"}`;
      wallStay.userData.lodTier = 'high';
      wallStay.rotation.z = Math.PI / 2;
      wallStay.position.set(-effD * 0.5 - 0.025, bodyTopY - 0.08, stayZ);
      radGroup.add(wallStay);
    }

    scene.add(radGroup);
  };

  const downstairsWoolCarpetTextures = createWovenWoolCarpetTextures();
  const greyRoomCarpetMat = new THREE.MeshStandardMaterial({
    name: 'upstairsWovenWoolCarpet',
    map: downstairsWoolCarpetTextures.colorMap,
    bumpMap: downstairsWoolCarpetTextures.bumpMap,
    bumpScale: 0.0025,
    color: 0xf7f2e8, // Warm creamy-oatmeal herringbone woven wool carpet consistent across stairs, upstairs, and carpeted ground-floor rooms
    roughness: 0.9,
    metalness: 0.01,
  });

  return {
    addExteriorBrickWall,
    addInteriorWall,
    addSlattedRadiatorCover,
    applyWorldSpaceBrickUVs,
    eastCourtyardWallAngleY,
    eastCourtyardWallSlopeXPerZ,
    getCourtyardGroundY,
    getEastCourtyardWallCenterX,
    getInteriorFloorY,
    greyRoomCarpetMat,
    shearGeometryAlongZ,
  };
}

export type GroundShellWallsAndFloors = ReturnType<typeof createGroundShellWallsAndFloors>;
