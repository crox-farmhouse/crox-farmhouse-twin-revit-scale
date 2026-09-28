import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  getEastWingSouthWallZ,
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingPoint,
  type createGroundFloorMaterials,
} from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';

/**
 * Graded cobbled courtyard, planting, ivy, boundary walls and split car gates.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildCourtyardAndGates(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'castIronMat' | 'courtyardDoorMat' | 'courtyardDoorRecessMat' | 'exteriorBrickMat' | 'stoneSillMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'applyWorldSpaceBrickUVs' | 'getCourtyardGroundY' | 'getEastCourtyardWallCenterX'>
): void {
  const { interactions, scene } = ctx;
  const {
    applyWorldSpaceBrickUVs,
    castIronMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    exteriorBrickMat,
    getCourtyardGroundY,
    getEastCourtyardWallCenterX,
    stoneSillMat,
  } = kit;
  // =========================================================================
  // 8. GRADED COBBLED COURTYARD (0.00m AT KITCHEN -> -0.60m AT PLANT ROOM & GATE),
  //    GARDEN BENCH, PLANTERS, CLIMBING IVY & SPLIT DRIVEWAY / PEDESTRIAN GATE
  // =========================================================================
  const terracottaPotMat = new THREE.MeshStandardMaterial({
    color: 0xb65e3e,
    roughness: 0.68,
    metalness: 0.04,
  });

  /**
   * Issue #10: Generates a seamlessly tileable (THREE.RepeatWrapping) 1024x1024 arched
   * granite sett fan ("Bogenpflaster") color + bump texture pair for the Courtyard that
   * matches `createGraniteSettLPathTextures` in front of the kitchen and repeats in parallel
   * 1.46m fan bands across the courtyard (stopping cleanly where each 1.46m path band meets).
   */
  const createContinuousCourtyardCobbleTextures = (): {
    readonly colorMap: THREE.CanvasTexture;
    readonly depthMap: THREE.CanvasTexture;
  } => {
    const size = 1024;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const cCtx = colorCanvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d')!;

    const cImg = cCtx.createImageData(size, size);
    const bImg = bCtx.createImageData(size, size);
    const cData = cImg.data;
    const bData = bImg.data;

    // Match exact stone dimensions and palette from `createGraniteSettLPathTextures` in `src/scene/textures.ts`
    const pathW = 1.46;
    const courseStep = 0.1437559;
    const coursesPerTile = 8;
    const tileSpanX = coursesPerTile * courseStep; // 1.1500472m (8 arched fan courses per repeating tile)
    const numRows = 8;
    const cobbleStepU = pathW / numRows; // 0.1825m
    const mortarHalfW = 0.0085;
    const arcPivotR = 2.16;

    const granitePalette: ReadonlyArray<readonly [number, number, number]> = [
      [198, 190, 178], // Light warm silver-buff granite
      [172, 165, 154], // Weathered medium warm grey granite
      [212, 196, 174], // Warm honey-sandstone / oatmeal granite
      [148, 142, 135], // Charcoal-taupe granite sett
      [186, 174, 158], // Pale greige-buff sett
      [160, 150, 138], // Muted olive-taupe granite
      [204, 184, 162], // Warm pinkish-sand granite
      [136, 130, 124], // Deep slate-grey granite
      [190, 182, 170], // Classic silver-oatmeal granite
      [178, 162, 144], // Warm russet-buff stone
    ];

    const hash2 = (a: number, b: number): number => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };

    for (let py = 0; py < size; py++) {
      // py = 0 corresponds to uv.y = 1 (north edge of a 1.46m band), py = size - 1 to uv.y = 0 (south edge)
      const u = (py / size) * pathW;
      const du = u - pathW * 0.5;
      const arcBow =
        arcPivotR - Math.sqrt(Math.max(0.01, arcPivotR * arcPivotR - du * du));
      const arcTangentAngle = Math.asin(
        Math.max(-0.95, Math.min(0.95, du / arcPivotR))
      );
      const cosA = Math.cos(arcTangentAngle);
      const sinA = Math.sin(arcTangentAngle);

      // Edge border joint where adjacent 1.46m parallel fan bands meet
      const bandSeamDist = Math.min(u, pathW - u);

      for (let px = 0; px < size; px++) {
        const s = (px / size) * tileSpanX;
        const idx = (py * size + px) * 4;

        const sCurved = s - arcBow;
        const coursePos = sCurved / courseStep;
        const courseIndex = Math.round(coursePos);
        const wrappedCourseIdx =
          ((courseIndex % coursesPerTile) + coursesPerTile) % coursesPerTile;
        const distFromCourseCenter = (coursePos - courseIndex) * courseStep;

        const rowStagger = (wrappedCourseIdx & 1) === 1 ? 0.5 * cobbleStepU : 0;
        const uStaggered = u + rowStagger;
        const rowPos = uStaggered / cobbleStepU;
        const cobbleRow = Math.floor(rowPos);
        const wrappedRowIdx = ((cobbleRow % numRows) + numRows) % numRows;
        const distFromRowCenter = (rowPos - (cobbleRow + 0.5)) * cobbleStepU;

        const cellJitterA = hash2(wrappedCourseIdx * 19 + 3, wrappedRowIdx * 37 + 11);
        const cellJitterB = hash2(wrappedCourseIdx * 43 + 7, wrappedRowIdx * 23 + 5);
        const halfLenS = courseStep * 0.5 - mortarHalfW * (0.9 + 0.25 * cellJitterA);
        const halfWidU = cobbleStepU * 0.5 - mortarHalfW * (0.9 + 0.25 * cellJitterB);

        const normS = Math.abs(distFromCourseCenter) / Math.max(0.01, halfLenS);
        const normU = Math.abs(distFromRowCenter) / Math.max(0.01, halfWidU);
        const superEllipse = Math.pow(
          Math.pow(normS, 4.5) + Math.pow(normU, 4.5),
          1 / 4.5
        );

        const grain1 =
          Math.sin(s * 195 + u * 210) *
          Math.cos(s * 140 - u * 165) *
          Math.sin((s + u) * 310);
        const grain2 = Math.sin(s * 520 + u * 480) * 0.5;

        if (superEllipse > 1.0 || bandSeamDist < mortarHalfW * 0.85) {
          // Sandy-buff lime mortar bed (#cbb894) matching `createGraniteSettLPathTextures`
          const sandGrain = grain1 * 9 + grain2 * 5;
          cData[idx] = Math.max(0, Math.min(255, Math.round(203 + sandGrain)));
          cData[idx + 1] = Math.max(0, Math.min(255, Math.round(184 + sandGrain * 0.92)));
          cData[idx + 2] = Math.max(0, Math.min(255, Math.round(148 + sandGrain * 0.82)));
          cData[idx + 3] = 255;

          const jointDepth = Math.max(18, Math.round(42 + grain1 * 10));
          bData[idx] = jointDepth;
          bData[idx + 1] = jointDepth;
          bData[idx + 2] = jointDepth;
          bData[idx + 3] = 255;
        } else {
          const palIdx =
            Math.floor(cellJitterA * granitePalette.length) %
            granitePalette.length;
          const baseRGB = granitePalette[palIdx]!;
          const shadeShift = (cellJitterB - 0.5) * 24;

          const localX =
            distFromCourseCenter * cosA - distFromRowCenter * sinA;
          const localY =
            distFromCourseCenter * sinA + distFromRowCenter * cosA;
          const domeProfile = Math.max(
            0,
            1.0 - 0.55 * Math.pow(superEllipse, 2.2)
          );
          const edgeBevel =
            superEllipse > 0.82 ? (1.0 - superEllipse) / 0.18 : 1.0;

          const crystalSpeckle =
            Math.sin(localX * 420 + cellJitterA * 50) *
              Math.cos(localY * 420 + cellJitterB * 50) *
              11 +
            grain2 * 7;

          const domeLight = (domeProfile - 0.35) * 18 * edgeBevel;
          const r = Math.max(
            0,
            Math.min(
              255,
              Math.round(baseRGB[0] + shadeShift + domeLight + crystalSpeckle)
            )
          );
          const g = Math.max(
            0,
            Math.min(
              255,
              Math.round(
                baseRGB[1] + shadeShift * 0.96 + domeLight + crystalSpeckle * 0.95
              )
            )
          );
          const b = Math.max(
            0,
            Math.min(
              255,
              Math.round(
                baseRGB[2] + shadeShift * 0.9 + domeLight + crystalSpeckle * 0.88
              )
            )
          );

          cData[idx] = r;
          cData[idx + 1] = g;
          cData[idx + 2] = b;
          cData[idx + 3] = 255;

          const hVal = Math.max(
            65,
            Math.min(
              255,
              Math.round(
                125 + domeProfile * 110 * edgeBevel + crystalSpeckle * 1.4
              )
            )
          );
          bData[idx] = hVal;
          bData[idx + 1] = hVal;
          bData[idx + 2] = hVal;
          bData[idx + 3] = 255;
        }
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.anisotropy = 8;

    const depthMap = new THREE.CanvasTexture(bumpCanvas);
    depthMap.wrapS = THREE.RepeatWrapping;
    depthMap.wrapT = THREE.RepeatWrapping;
    depthMap.anisotropy = 8;

    return { colorMap, depthMap };
  };

  const { colorMap: cobbleColorTex, depthMap: cobbleBumpTex } =
    createContinuousCourtyardCobbleTextures();
  const courtyardCobbleMat = new THREE.MeshStandardMaterial({
    map: cobbleColorTex,
    bumpMap: cobbleBumpTex,
    bumpScale: 0.026,
    roughness: 0.8,
    metalness: 0.03,
  });

  /**
   * Creates a subdivided BoxGeometry for a courtyard slab or stone sett band whose vertices
   * follow the continuous 2D courtyard elevation gradient `getCourtyardGroundY(wx, wz)`
   * and continuous world-space arched granite sett UVs (Issue #10).
   */
  const createGradedCourtyardGeometry = (
    w: number,
    h: number,
    d: number,
    offsetX: number,
    offsetZ: number,
    segX: number,
    segZ: number,
    applyCobbleUVs: boolean
  ): THREE.BufferGeometry => {
    const geo = new THREE.BoxGeometry(w, h, d, segX, 1, segZ);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const isMainCourtyardPiece = offsetX > -18.0 && offsetX < -4.0;
    const isSouthEastApronPiece = offsetX >= -4.0 && offsetX < 4.0;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        let wx = pos.getX(i) + offsetX;
        let wz = pos.getZ(i) + offsetZ;
        // Issue #10: Clip the West edge of the courtyard slab & stone sett bands along the angled
        // West Wing exterior brick wall (`getEastCourtyardWallCenterX(wz) + 0.04`) and the North edge
        // along the rotated East-West Wing South brick wall (`getEastWingSouthWallZ(wx) + 0.04`) so the
        // courtyard floor never spills into the Front Entrance Hallway, Hall, Boot Lobby, Dining Room,
        // Sitting Room, or Plant Room!
        if (isMainCourtyardPiece) {
          const minAllowedNorthZ = getEastWingSouthWallZ(wx) + 0.04;
          if (wz < minAllowedNorthZ) {
            wz = minAllowedNorthZ;
            pos.setZ(i, wz - offsetZ);
          }
          if (wz <= 11.78) {
            const minAllowedCourtyardX = getEastCourtyardWallCenterX(wz) + 0.04;
            if (wx < minAllowedCourtyardX) {
              wx = minAllowedCourtyardX;
              pos.setX(i, wx - offsetX);
            }
          }
        } else if (isSouthEastApronPiece) {
          const minAllowedTerraceSouthZ = getEastWingSouthWallZ(wx) + 4.79;
          if (wz < minAllowedTerraceSouthZ) {
            wz = minAllowedTerraceSouthZ;
            pos.setZ(i, wz - offsetZ);
          }
        }
        const groundY = getCourtyardGroundY(wx, wz);
        pos.setY(i, pos.getY(i) + groundY);
        if (applyCobbleUVs && uv) {
          // Issue #10: Align world-space UVs with the rotated Kitchen South Cobble Path (band width 1.46m,
          // 8 arched courses = 1.1500472m from pivotX = 4.72875m) so the arched fan bands align where the paths meet!
          uv.setXY(
            i,
            (4.72875 - wx) / 1.1500472,
            1 - (wz - (getEastWingSouthWallZ(wx) - 0.41)) / 1.46
          );
        }
      }
      pos.needsUpdate = true;
      if (applyCobbleUVs && uv) {
        uv.needsUpdate = true;
      }
      geo.computeVertexNormals();
    }
    return geo;
  };

  // Main Cobbled Courtyard Slab enclosed by the L-shaped house (X = getEastCourtyardWallCenterX(z)..-4.64m, Z = getEastWingSouthWallZ(x)..+16.05m)
  // Clipped along the angled West Wing wall & rotated East-West Wing South wall so zero cobbles spill into the house (Issue #10)
  const mainCourtyardSlab = new THREE.Mesh(
    createGradedCourtyardGeometry(
      12.47,
      0.105,
      13.35,
      -10.875,
      9.375,
      32,
      32,
      true
    ),
    courtyardCobbleMat
  );
  mainCourtyardSlab.name = 'courtyard.mainCobbleSlab';
  mainCourtyardSlab.userData.isArchitecturalShell = true;
  mainCourtyardSlab.position.set(-10.875, -0.064, 9.375);
  mainCourtyardSlab.receiveShadow = true;
  scene.add(mainCourtyardSlab);

  // North-East Courtyard Cobble Strip connecting the Dining Room South threshold (X = -9.56m..-4.64m)
  // seamlessly to the Kitchen South Cobble Path at X = -4.64m without entering the Hall, Boot Lobby, or Dining Room
  const northEastCourtyardLink = new THREE.Mesh(
    createGradedCourtyardGeometry(
      4.92,
      0.105,
      0.9,
      -7.1,
      4.1,
      12,
      4,
      true
    ),
    courtyardCobbleMat
  );
  northEastCourtyardLink.name = 'courtyard.northEastCobbleLink';
  northEastCourtyardLink.userData.isArchitecturalShell = true;
  northEastCourtyardLink.position.set(-7.1, -0.064, 4.1);
  northEastCourtyardLink.receiveShadow = true;
  scene.add(northEastCourtyardLink);

  // Cobbled Courtyard Entrance Bay immediately behind the Split Gate along the South Gable Wall of the Study
  // (X = -22.33m..-17.11m, Z = +11.77m..+16.05m)
  const gateCourtyardBaySlab = new THREE.Mesh(
    createGradedCourtyardGeometry(5.22, 0.105, 4.28, -19.72, 13.91, 16, 12, true),
    courtyardCobbleMat
  );
  gateCourtyardBaySlab.name = 'courtyard.gateBayCobbleSlab';
  gateCourtyardBaySlab.userData.isArchitecturalShell = true;
  gateCourtyardBaySlab.position.set(-19.72, -0.064, 13.91);
  gateCourtyardBaySlab.receiveShadow = true;
  scene.add(gateCourtyardBaySlab);

  // Lower South-East Courtyard Apron extending South of the Raised Limestone Terrace (X = -4.52m..+6.74m, Z = getEastWingSouthWallZ(x)+4.79m..+16.05m)
  const southEastCourtyardApron = new THREE.Mesh(
    createGradedCourtyardGeometry(
      11.26,
      0.105,
      7.1,
      1.11,
      12.5,
      24,
      24,
      true
    ),
    courtyardCobbleMat
  );
  southEastCourtyardApron.name = 'courtyard.southEastCobbleApron';
  southEastCourtyardApron.userData.isArchitecturalShell = true;
  southEastCourtyardApron.position.set(1.11, -0.064, 12.5);
  southEastCourtyardApron.receiveShadow = true;
  scene.add(southEastCourtyardApron);

  // Tarmac / Weathered Asphalt Driveway Apron in front of (West of) the Split Gate
  // (X = -27.85m..-22.33m, Z = +11.77m..+16.25m)
  const tarmacDriveMat = new THREE.MeshStandardMaterial({
    color: 0x6e6a63,
    roughness: 0.88,
    metalness: 0.02,
  });
  const drivewayApron = new THREE.Mesh(
    createGradedCourtyardGeometry(5.52, 0.095, 4.48, -25.09, 14.01, 12, 12, false),
    tarmacDriveMat
  );
  drivewayApron.userData.isArchitecturalShell = true;
  drivewayApron.position.set(-25.09, -0.068, 14.01);
  drivewayApron.receiveShadow = true;
  scene.add(drivewayApron);

  // Stone Sett Drainage Channels & Car Gate Wheel Tracks following the graded Cobbled Courtyard (visible in Photos 1 & 2)
  for (const [cx, cz, w, d, sx, sz] of [
    [-10.68, 4.45, 12.08, 0.16, 28, 2],    // East-West sett channel continuing the line of the Kitchen cobble path
    [-10.78, 7.6, 12.28, 0.16, 28, 2],     // Middle East-West courtyard drainage sett band
    [-13.41, 13.05, 17.75, 0.22, 36, 2],   // Double-row stone sett track starting at the Split Gate post (X=-22.28m) into the courtyard (Photos 1 & 2)
    [-16.15, 9.4, 0.16, 13.0, 2, 28],      // North-South sett drainage channel along West courtyard wing
    [-8.78, 9.9, 0.16, 12.0, 2, 28],       // North-South sett drainage channel aligned with Dining Room Courtyard Door
    [-7.795, 16.05, 29.07, 0.16, 48, 2],   // Southern courtyard boundary stone kerb (X = -22.33m..+6.74m)
  ] as const) {
    const band = new THREE.Mesh(
      createGradedCourtyardGeometry(w, 0.11, d, cx, cz, sx, sz, false),
      stoneSillMat
    );
    band.userData.isArchitecturalShell = true;
    band.position.set(cx, -0.058, cz);
    band.receiveShadow = true;
    scene.add(band);
  }

  // -------------------------------------------------------------------------
  // Slatted Teak/Oak Garden Bench & Flanking Terracotta Planters under the Boot Lobby
  // Courtyard Window (local X = -11.65m, Z = +3.02m — seated on the sloped courtyard cobbles, Photo 1!)
  // -------------------------------------------------------------------------
  const benchGroup = new THREE.Group();
  const benchWorldPos = transformEastWingPoint(-11.65, 0, 3.02);
  const benchGroundY = getCourtyardGroundY(benchWorldPos.x, benchWorldPos.z);
  benchGroup.position.set(benchWorldPos.x, benchGroundY, benchWorldPos.z);
  benchGroup.rotation.y = MAIN_EAST_WING_ROTATION_Y;

  const weatheredTeakMat = new THREE.MeshStandardMaterial({
    color: 0x8c765c,
    roughness: 0.72,
    metalness: 0.03,
  });

  // Bench seat slats & backrest slats (width 1.28m, depth 0.52m, height 0.86m)
  const benchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.045, 0.48),
    weatheredTeakMat
  );
  benchSeat.position.set(0, 0.43, 0.02);
  benchSeat.castShadow = true;
  benchSeat.receiveShadow = true;
  benchGroup.add(benchSeat);

  const benchBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.42, 0.04),
    weatheredTeakMat
  );
  benchBack.position.set(0, 0.66, -0.21);
  benchBack.rotation.x = -0.08;
  benchBack.castShadow = true;
  benchGroup.add(benchBack);

  for (const sideX of [-0.59, 0.59]) {
    const frontLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.58, 0.055),
      weatheredTeakMat
    );
    frontLeg.position.set(sideX, 0.29, 0.23);
    frontLeg.castShadow = true;
    benchGroup.add(frontLeg);

    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.86, 0.055),
      weatheredTeakMat
    );
    rearLeg.position.set(sideX, 0.43, -0.22);
    rearLeg.castShadow = true;
    benchGroup.add(rearLeg);

    const armRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.04, 0.52),
      weatheredTeakMat
    );
    armRest.position.set(sideX, 0.59, 0.01);
    armRest.castShadow = true;
    benchGroup.add(armRest);
  }
  scene.add(benchGroup);

  // Terracotta & Weathered Stone Planters along the Courtyard Walls (seated on the sloped courtyard cobbles, Photos 1 & 3)
  const ivyDarkGreenMat = new THREE.MeshStandardMaterial({
    color: 0x2d4e28,
    roughness: 0.78,
    metalness: 0.02,
  });
  const ivyMidGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3f6836,
    roughness: 0.74,
    metalness: 0.02,
  });

  const pPlanter1 = transformEastWingPoint(-8.12, 0, 2.94);
  const pPlanter2 = transformEastWingPoint(-9.42, 0, 2.94);
  const pPlanter3 = transformEastWingPoint(-12.65, 0, 2.98);
  const pPlanter4 = transformEastWingPoint(-15.65, 0, 2.98);

  for (const [px, pz, potR, crownR] of [
    [pPlanter1.x, pPlanter1.z, 0.22, 0.28],  // Right of Dining Room Exterior Courtyard Door (Photo 1)
    [pPlanter2.x, pPlanter2.z, 0.2, 0.25],   // Left of Dining Room Exterior Courtyard Door (Photo 1)
    [pPlanter3.x, pPlanter3.z, 0.22, 0.28],  // Left of Garden Bench (Photo 1)
    [pPlanter4.x, pPlanter4.z, 0.21, 0.27],  // Left of Hall Courtyard Door (Photo 1)
    [getEastCourtyardWallCenterX(4.35) + 0.44, 4.35, 0.23, 0.3],   // Along Sitting Room Courtyard Wall (Photo 1 & 3 — Issue #1)
    [getEastCourtyardWallCenterX(7.65) + 0.44, 7.65, 0.22, 0.28],  // North of Plant Room Courtyard Door (Photo 3 — Issue #1)
    [getEastCourtyardWallCenterX(10.75) + 0.44, 10.75, 0.22, 0.28],// South of Plant Room Courtyard Door (Photo 3 — Issue #1)
  ] as const) {
    const potGroundY = getCourtyardGroundY(px, pz);
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(potR, potR * 0.74, potR * 1.65, 12),
      terracottaPotMat
    );
    pot.position.set(px, potGroundY + potR * 0.825, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    scene.add(pot);

    const shrub = new THREE.Mesh(
      new THREE.SphereGeometry(crownR, 12, 10),
      ivyMidGreenMat
    );
    shrub.scale.set(1.05, 0.92, 1.05);
    shrub.position.set(px, potGroundY + potR * 1.65 + crownR * 0.65, pz);
    shrub.castShadow = true;
    scene.add(shrub);
  }

  // -------------------------------------------------------------------------
  // Climbing Green Ivy / Virginia Creeper on the Courtyard & Front Bay Walls (Photos 1, 2 & 3)
  // -------------------------------------------------------------------------
  const ivyFoliageGeo = new THREE.DodecahedronGeometry(1, 0);
  const addWallClimbingIvy = (
    wallX: number,
    wallZ: number,
    normalAxis: 'x' | 'z',
    spanWidth: number,
    maxHeight: number,
    seedOffset: number
  ): void => {
    const ivyGroup = new THREE.Group();
    ivyGroup.userData.isArchitecturalShell = true;
    const baseGroundY = getCourtyardGroundY(wallX, wallZ);
    const count = Math.floor(spanWidth * maxHeight * 9);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const hash1 = Math.sin((i + seedOffset) * 12.9898) * 43758.5453;
      const frac1 = hash1 - Math.floor(hash1);
      const hash2 = Math.sin((i + seedOffset) * 78.233) * 19341.123;
      const frac2 = hash2 - Math.floor(hash2);

      const y = baseGroundY + 0.22 + t * (maxHeight - 0.25);
      // Taper width slightly towards the top of the climbing vine
      const widthAtY = spanWidth * (1.0 - 0.28 * Math.pow(t, 1.5));
      const lateral = (frac1 - 0.5) * widthAtY;
      const r = 0.12 + frac2 * 0.11;

      const leafCluster = new THREE.Mesh(
        ivyFoliageGeo,
        i % 2 === 0 ? ivyDarkGreenMat : ivyMidGreenMat
      );
      if (normalAxis === 'x') {
        const zLeaf = wallZ + lateral;
        // Issue #1: Follow the angled East Courtyard Wall exterior face (`getEastCourtyardWallCenterX(zLeaf) + 0.182`)
        // so zero ivy foliage ever protrudes through the wall into the Sitting Room interior!
        const xLeaf =
          wallX > -18.0 ? getEastCourtyardWallCenterX(zLeaf) + 0.182 : wallX;
        leafCluster.scale.set(0.065, r, r * 1.15);
        leafCluster.position.set(xLeaf, y, zLeaf);
      } else {
        const xLeaf = wallX + lateral;
        const zLeaf = getEastWingSouthWallZ(xLeaf) + 0.015;
        leafCluster.scale.set(r * 1.15, r, 0.065);
        leafCluster.rotation.y = MAIN_EAST_WING_ROTATION_Y;
        leafCluster.position.set(xLeaf, y, zLeaf);
      }
      leafCluster.receiveShadow = true;
      ivyGroup.add(leafCluster);
    }
    scene.add(ivyGroup);
  };

  // 1. Lush climbing ivy on the East Courtyard Wall of Sitting Room & Plant Room (Photos 1 & 3 — Issue #1: strictly on exterior courtyard face)
  addWallClimbingIvy(getEastCourtyardWallCenterX(4.45) + 0.182, 4.45, 'x', 1.45, 3.35, 11);
  addWallClimbingIvy(getEastCourtyardWallCenterX(7.55) + 0.182, 7.55, 'x', 1.55, 3.45, 29);
  // 2. Climbing ivy on the South Courtyard Wall around the Dining Room & Boot Lobby (Photo 1)
  const pIvySouth1 = transformEastWingPoint(-5.25, 0, 2.69);
  const pIvySouth2 = transformEastWingPoint(-13.55, 0, 2.69);
  addWallClimbingIvy(pIvySouth1.x, pIvySouth1.z, 'z', 1.15, 2.75, 47);
  addWallClimbingIvy(pIvySouth2.x, pIvySouth2.z, 'z', 1.2, 3.15, 63);
  // 3. Climbing ivy on the West Front Facade around the twin Victorian bay windows (Photo 2)
  addWallClimbingIvy(-22.51, 1.55, 'x', 1.1, 3.45, 83);
  addWallClimbingIvy(-22.51, 4.25, 'x', 1.1, 3.45, 101);
  addWallClimbingIvy(-22.51, 7.65, 'x', 1.15, 3.45, 127);

  // -------------------------------------------------------------------------
  // Interactive Split Courtyard Gate (Pedestrian Entrance + Double Car Entrance)
  // Flush with the West Front Facade of the Main House at X = -22.33m (X = -22.19m..-22.47m),
  // spanning South from the SW Front corner of the Study (Z = +11.77m)
  // to the NW corner of the Outbuilding/GYM (Z = +16.05m) at the lowered courtyard elevation
  // (Y = -0.60m, 60cm below the Kitchen!) — matching Photos 1, 2, 3 & Floorplan!
  // -------------------------------------------------------------------------
  const gateX = -22.33;
  const gateH = 1.88;
  const gateGroundY = getCourtyardGroundY(gateX, 14.0); // -0.60m

  // 3 Painted Timber Gate Posts along X = -22.33m (seated on the Y = -0.60m courtyard threshold):
  // - North post against the Study SW front brick corner (Z = +11.82m)
  // - Intermediate split post between the Pedestrian Entrance and Car Entrance (Z = +12.96m)
  // - South post at the Outbuilding corner (Z = +16.00m)
  for (const postZ of [11.82, 12.96, 16.0]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, gateH + 0.08, 0.12),
      courtyardDoorMat
    );
    post.position.set(gateX, gateGroundY + (gateH + 0.08) / 2, postZ);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);

    const postCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.035, 0.15),
      courtyardDoorRecessMat
    );
    postCap.position.set(gateX, gateGroundY + gateH + 0.095, postZ);
    scene.add(postCap);
  }

  // Red-Brick Pier at the South end of the Car Gate (X = -22.33m, Z = +16.26m, seated at gateGroundY = -0.60m)
  const southGatePierGeo = new THREE.BoxGeometry(0.42, 2.08, 0.42);
  applyWorldSpaceBrickUVs(southGatePierGeo, gateX, gateGroundY + 1.04, 16.26);
  const southGatePier = new THREE.Mesh(southGatePierGeo, exteriorBrickMat);
  southGatePier.position.set(gateX, gateGroundY + 1.04, 16.26);
  southGatePier.castShadow = true;
  southGatePier.receiveShadow = true;
  scene.add(southGatePier);

  const southGatePierCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.08, 0.48),
    stoneSillMat
  );
  southGatePierCap.position.set(gateX, gateGroundY + 2.12, 16.26);
  southGatePierCap.castShadow = true;
  scene.add(southGatePierCap);

  /**
   * Helper to build a gate leaf group along X = gateX (at gateGroundY = -0.60m):
   * - Smooth vertical T&G boarding + capping rail on the West (-X, driveway) side (Photo 2)
   * - Framed ledged-and-braced horizontal rails + diagonal cross-braces on the East (+X, courtyard) side (Photo 3)
   */
  const buildSplitGateLeafGroup = (
    minZ: number,
    maxZ: number,
    hingeSide: 'north' | 'south',
    hasLatchHandle: boolean
  ): { readonly leafGroup: THREE.Group; readonly pivotZ: number } => {
    const leafW = maxZ - minZ;
    const centerZ = (minZ + maxZ) / 2;
    const leafGroup = new THREE.Group();
    leafGroup.position.set(gateX, gateGroundY + gateH / 2 + 0.03, centerZ);

    // Main vertical tongue-and-groove timber boarding panel
    const boardPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, gateH, leafW),
      courtyardDoorMat
    );
    boardPanel.castShadow = true;
    boardPanel.receiveShadow = true;
    leafGroup.add(boardPanel);

    // Top weather capping rail & outer stiles
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.055, leafW + 0.01),
      courtyardDoorRecessMat
    );
    topCap.position.set(0, gateH / 2 + 0.01, 0);
    topCap.castShadow = true;
    leafGroup.add(topCap);

    for (const sz of [-leafW / 2 + 0.045, leafW / 2 - 0.045]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.072, gateH, 0.09),
        courtyardDoorRecessMat
      );
      stile.position.set(0.012, 0, sz);
      stile.castShadow = true;
      leafGroup.add(stile);
    }

    // Top, middle, and bottom horizontal ledges on the courtyard (+X) side (visible in Photo 3!)
    for (const ly of [-gateH / 2 + 0.14, 0.0, gateH / 2 - 0.14]) {
      const ledge = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.11, leafW - 0.14),
        courtyardDoorRecessMat
      );
      ledge.position.set(0.034, ly, 0);
      ledge.castShadow = true;
      leafGroup.add(ledge);
    }

    // Lower and upper diagonal timber braces on the courtyard (+X) side (rising from the hinge side, Photo 3!)
    const braceSpanZ = leafW - 0.18;
    const braceSpanY = gateH / 2 - 0.24;
    const braceLen = Math.hypot(braceSpanZ, braceSpanY);
    const braceSign = hingeSide === 'north' ? 1 : -1;
    for (const by of [-gateH / 4, gateH / 4]) {
      const brace = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.09, braceLen),
        courtyardDoorRecessMat
      );
      brace.position.set(0.032, by, 0);
      brace.rotation.x = braceSign * Math.atan2(braceSpanY, braceSpanZ);
      brace.castShadow = true;
      leafGroup.add(brace);
    }

    // Black wrought-iron ring latch / handle on the West (-X) driveway face (visible in Photo 2!)
    if (hasLatchHandle) {
      const latchZ = hingeSide === 'north' ? leafW / 2 - 0.12 : -leafW / 2 + 0.12;
      const latchPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.14, 0.06),
        castIronMat
      );
      latchPlate.position.set(-0.026, 0.04, latchZ);
      leafGroup.add(latchPlate);
    }

    scene.add(leafGroup);
    const pivotZ = hingeSide === 'north' ? -leafW / 2 : leafW / 2;
    return { leafGroup, pivotZ };
  };

  // 1. North Pedestrian Entrance Gate Leaf (Z = +11.88m..+12.90m, width 1.02m, hinged manually on North post by the front corner, swinging inward +X into the courtyard)
  const pedGate = buildSplitGateLeafGroup(11.88, 12.9, 'north', true);
  interactions.registerHingedDoor(
    scene,
    pedGate.leafGroup,
    new THREE.Vector3(0, 0, pedGate.pivotZ),
    'y',
    Math.PI * 0.48,
    0
  );

  // 2. South Double-Leaf Motorized Car Entrance Gate (Z = +13.02m..+15.94m, total width 2.92m):
  //    - Left/North Car Gate Leaf (Z = +13.02m..+14.47m, hinged on the intermediate split post at Z = +12.96m)
  //    - Right/South Car Gate Leaf (Z = +14.49m..+15.94m, hinged on the South post at Z = +16.00m)
  //    Both leaves swing inward (+X, East) into the cobbled courtyard on KNX Bus (PA 1.1.22, GA 1/5/1 & 1/5/2)
  const northCarGate = buildSplitGateLeafGroup(13.02, 14.47, 'north', true);
  const southCarGate = buildSplitGateLeafGroup(14.49, 15.94, 'south', false);

  // Underground 24V KNX Gate Ram Boxes at the base of the two Car Gate Hinge Posts (Z = +13.06m and Z = +15.90m)
  for (const motorZ of [13.06, 15.9]) {
    const motorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.03, 0.28),
      castIronMat
    );
    motorPlate.position.set(gateX + 0.08, gateGroundY + 0.015, motorZ);
    motorPlate.receiveShadow = true;
    scene.add(motorPlate);
  }

  interactions.registerMotorizedCarGatePair(
    scene,
    northCarGate.leafGroup,
    new THREE.Vector3(0, 0, northCarGate.pivotZ),
    Math.PI * 0.46,
    southCarGate.leafGroup,
    new THREE.Vector3(0, 0, southCarGate.pivotZ),
    -Math.PI * 0.46,
    10.0
  );
}
