import * as THREE from 'three';
import { buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import { buildSittingRoomSofas } from '../../../../objects/furniture/sitting-room-sofas-and-art.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

/**
 * Sitting Room (`sittingRoom`) sofas, coffee table and accessories.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildSittingRoomFurniture(
  ctx: SceneBuilderContext,
  kit: Pick<
    ReturnType<typeof createGroundFloorMaterials>,
    'frontWallH' | 'oakMat' | 'warmRoomPlasterMat'
  > &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
): void {
  const { groundFloorCeilingGroup, scene } = ctx;
  const { frontWallH, oakMat, tier2FloorY, warmRoomPlasterMat } = kit;
  // =========================================================================
  // SITTING ROOM SOFAS (Issues #14, #15 & #7 — high-LOD sculpted upholstery meshes):
  // =========================================================================
  buildSittingRoomSofas(scene, tier2FloorY);

  // =========================================================================
  // SITTING ROOM COFFEE TABLE (`sittingRoom.coffeeTable` — Issues #7, #13 & #3):
  // - Issue #3: Positioned at `[-19.8, tier2FloorY, 5.593]`
  // - Issue #13: Glossy Dark-Brown / Espresso Glazed Ceramic-Tiled Plinth Coffee Table
  //   (matching media_1790547890733.png middle-left):
  //   - Recessed tiled lower plinth base (`0.52m W × 0.145m H × 1.06m L`)
  //   - Cantilevered upper tiled volume (`0.68m W × 0.255m H × 1.22m L`) with rounded bullnose bottom edge
  //   - Topped with a tall fluted stoneware cylindrical vase holding sculptural bare branches
  //     and a stack of 2 large coffee-table art books!
  // =========================================================================
  {
    const coffeeTableGroup = new THREE.Group();
    coffeeTableGroup.name = 'sittingRoom.coffeeTable';
    coffeeTableGroup.userData.zone = 'sittingRoom';
    coffeeTableGroup.position.set(-19.8, tier2FloorY, 5.593);

    // Procedural Hand-Glazed Dark Espresso-Brown Ceramic Tile Grid Texture + Bump Map
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 512;
    tileCanvas.height = 512;
    const tileBumpCanvas = document.createElement('canvas');
    tileBumpCanvas.width = 512;
    tileBumpCanvas.height = 512;
    const tCtx = tileCanvas.getContext('2d');
    const tbCtx = tileBumpCanvas.getContext('2d');
    if (tCtx && tbCtx) {
      // Dark charcoal-brown grout lines
      tCtx.fillStyle = '#1f1610';
      tCtx.fillRect(0, 0, 512, 512);
      tbCtx.fillStyle = '#202020';
      tbCtx.fillRect(0, 0, 512, 512);

      const cols = 6;
      const rows = 6;
      const cw = 512 / cols;
      const ch = 512 / rows;
      const glazePalette = [
        '#3d2b1f',
        '#463224',
        '#35251a',
        '#4b3628',
        '#39281d',
        '#422f22',
      ];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x0 = c * cw + 3;
          const y0 = r * ch + 3;
          const w0 = cw - 6;
          const h0 = ch - 6;
          const tone = glazePalette[(r * 5 + c * 3) % glazePalette.length]!;
          const grad = tCtx.createLinearGradient(x0, y0, x0 + w0, y0 + h0);
          grad.addColorStop(0, tone);
          grad.addColorStop(0.5, '#4e3829');
          grad.addColorStop(1, '#2f2017');
          tCtx.fillStyle = grad;
          tCtx.fillRect(x0, y0, w0, h0);

          // Subtle artisanal kiln-glaze edge highlight
          tCtx.strokeStyle = 'rgba(255, 235, 215, 0.09)';
          tCtx.lineWidth = 1.5;
          tCtx.strokeRect(x0 + 1.5, y0 + 1.5, w0 - 3, h0 - 3);

          // Raised tile cushion dome in bump map
          tbCtx.fillStyle = '#e0e0e0';
          tbCtx.fillRect(x0 + 1, y0 + 1, w0 - 2, h0 - 2);
        }
      }
    }
    const ceramicTileTex = new THREE.CanvasTexture(tileCanvas);
    ceramicTileTex.wrapS = THREE.RepeatWrapping;
    ceramicTileTex.wrapT = THREE.RepeatWrapping;
    ceramicTileTex.colorSpace = THREE.SRGBColorSpace;

    const ceramicTileBumpTex = new THREE.CanvasTexture(tileBumpCanvas);
    ceramicTileBumpTex.wrapS = THREE.RepeatWrapping;
    ceramicTileBumpTex.wrapT = THREE.RepeatWrapping;

    const applyTileWorldBoxUVs = (
      geo: THREE.BoxGeometry,
      sx: number,
      sy: number,
      sz: number,
      tileSize = 0.11
    ): THREE.BoxGeometry => {
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const norm = geo.attributes.normal as THREE.BufferAttribute;
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      const scale = 1 / (tileSize * 6);
      for (let i = 0; i < pos.count; i++) {
        const nx = Math.abs(norm.getX(i));
        const ny = Math.abs(norm.getY(i));
        const px = pos.getX(i) + sx * 0.5;
        const py = pos.getY(i) + sy * 0.5;
        const pz = pos.getZ(i) + sz * 0.5;
        if (ny > 0.5) {
          uv.setXY(i, px * scale, pz * scale);
        } else if (nx > 0.5) {
          uv.setXY(i, pz * scale, py * scale);
        } else {
          uv.setXY(i, px * scale, py * scale);
        }
      }
      uv.needsUpdate = true;
      geo.computeBoundingSphere();
      return geo;
    };

    const brownCeramicTileMat = new THREE.MeshStandardMaterial({
      map: ceramicTileTex,
      bumpMap: ceramicTileBumpTex,
      bumpScale: 0.0035,
      roughness: 0.15, // High-gloss hand-glazed ceramic tile finish
      metalness: 0.08,
    });
    const darkGroutUnderMat = new THREE.MeshStandardMaterial({
      color: 0x241912,
      roughness: 0.42,
    });

    const ctW = 0.68; // E-W width (680mm)
    const ctL = 1.22; // N-S length (1220mm)
    const ctH = 0.40; // Top surface height (400mm)
    const plinthW = 0.52;
    const plinthL = 1.06;
    const plinthH = 0.145;
    const upperH = 0.215; // Upper straight tiled wall above the 0.04m bullnose

    // 1. Recessed Lower Tiled Plinth Base (Y = 0.00m..0.145m)
    const lowerPlinth = new THREE.Mesh(
      applyTileWorldBoxUVs(
        new THREE.BoxGeometry(plinthW, plinthH, plinthL),
        plinthW,
        plinthH,
        plinthL,
        0.108
      ),
      brownCeramicTileMat
    );
    lowerPlinth.name = 'sittingRoom.coffeeTable.tiledPlinth';
    lowerPlinth.position.set(0, plinthH * 0.5, 0);
    lowerPlinth.castShadow = true;
    lowerPlinth.receiveShadow = true;
    coffeeTableGroup.add(lowerPlinth);

    // 2. Cantilevered Upper Tiled Block (Y = 0.185m..0.40m)
    const upperBlock = new THREE.Mesh(
      applyTileWorldBoxUVs(
        new THREE.BoxGeometry(ctW, upperH, ctL),
        ctW,
        upperH,
        ctL,
        0.113
      ),
      brownCeramicTileMat
    );
    upperBlock.name = 'sittingRoom.coffeeTable.tabletop';
    upperBlock.position.set(0, plinthH + 0.04 + upperH * 0.5, 0);
    upperBlock.castShadow = true;
    upperBlock.receiveShadow = true;
    coffeeTableGroup.add(upperBlock);

    // 3. Rounded Lower Bullnose Perimeter Edge on the Cantilevered Upper Block (Y = 0.145m..0.185m)
    const bullnoseR = 0.04;
    const bullnoseCore = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(ctW - bullnoseR * 2, bullnoseR, ctL - bullnoseR * 2)),
      darkGroutUnderMat
    );
    bullnoseCore.name = 'sittingRoom.coffeeTable.bullnoseCore';
    bullnoseCore.position.set(0, plinthH + bullnoseR * 0.5, 0);
    coffeeTableGroup.add(bullnoseCore);

    const longBullnoseGeo = createSharedGeo(
      new THREE.CylinderGeometry(bullnoseR, bullnoseR, ctL - bullnoseR * 2, 16)
    );
    for (const sideX of [-1, 1] as const) {
      const longBullnose = new THREE.Mesh(longBullnoseGeo, brownCeramicTileMat);
      longBullnose.name = 'sittingRoom.coffeeTable.bullnoseEdge';
      longBullnose.rotation.x = Math.PI / 2;
      longBullnose.position.set(sideX * (ctW * 0.5 - bullnoseR), plinthH + bullnoseR, 0);
      longBullnose.castShadow = true;
      coffeeTableGroup.add(longBullnose);
    }

    const shortBullnoseGeo = createSharedGeo(
      new THREE.CylinderGeometry(bullnoseR, bullnoseR, ctW - bullnoseR * 2, 16)
    );
    for (const sideZ of [-1, 1] as const) {
      const shortBullnose = new THREE.Mesh(shortBullnoseGeo, brownCeramicTileMat);
      shortBullnose.name = 'sittingRoom.coffeeTable.bullnoseEdge';
      shortBullnose.rotation.z = Math.PI / 2;
      shortBullnose.position.set(0, plinthH + bullnoseR, sideZ * (ctL * 0.5 - bullnoseR));
      shortBullnose.castShadow = true;
      coffeeTableGroup.add(shortBullnose);
    }

    const cornerSphereGeo = createSharedGeo(new THREE.SphereGeometry(bullnoseR, 14, 12));
    for (const [cIdx, [cx, cz]] of (
      [
        [-ctW * 0.5 + bullnoseR, -ctL * 0.5 + bullnoseR],
        [ctW * 0.5 - bullnoseR, -ctL * 0.5 + bullnoseR],
        [-ctW * 0.5 + bullnoseR, ctL * 0.5 - bullnoseR],
        [ctW * 0.5 - bullnoseR, ctL * 0.5 - bullnoseR],
      ] as const
    ).entries()) {
      const cornerSphere = tagHighLod(new THREE.Mesh(cornerSphereGeo, brownCeramicTileMat));
      cornerSphere.name = `sittingRoom.coffeeTable.bullnoseCorner.${cIdx + 1}`;
      cornerSphere.position.set(cx, plinthH + bullnoseR, cz);
      coffeeTableGroup.add(cornerSphere);
    }

    // 4. Tabletop Styling (matching media_1790547890733.png):
    //    - Tall Fluted Warm-Stoneware Cylindrical Vase + Sculptural Twisted Bare Branches
    //    - Stack of 2 Large Hardcover Coffee-Table Art Books
    const flutedVaseMat = new THREE.MeshStandardMaterial({
      color: 0xa89882, // Warm ribbed/fluted stoneware ceramic
      roughness: 0.48,
      metalness: 0.04,
    });
    const darkBranchMat = new THREE.MeshStandardMaterial({
      color: 0x3b2a1e, // Sculptural dark woody twig branches
      roughness: 0.78,
    });

    const vaseGroup = new THREE.Group();
    vaseGroup.name = 'sittingRoom.coffeeTable.flutedVase';
    vaseGroup.position.set(-0.05, ctH, -0.18);

    const vaseH = 0.21;
    const vaseR = 0.058;
    const vaseCore = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(vaseR, vaseR * 0.96, vaseH, 24)),
      flutedVaseMat
    );
    vaseCore.name = 'sittingRoom.coffeeTable.flutedVase.body';
    vaseCore.position.set(0, vaseH * 0.5, 0);
    vaseCore.castShadow = true;
    vaseCore.receiveShadow = true;
    vaseGroup.add(vaseCore);

    // 20 vertical fluted stoneware ribs around the cylinder sharing 1 BufferGeometry
    const fluteCount = 20;
    const fluteRibGeo = createSharedGeo(
      new THREE.CylinderGeometry(0.0055, 0.0055, vaseH - 0.006, 8)
    );
    for (let f = 0; f < fluteCount; f++) {
      const a = (f / fluteCount) * Math.PI * 2;
      const rib = tagHighLod(new THREE.Mesh(fluteRibGeo, flutedVaseMat));
      rib.name = `sittingRoom.coffeeTable.flutedVase.rib.${f + 1}`;
      rib.position.set(Math.cos(a) * vaseR, vaseH * 0.5, Math.sin(a) * vaseR);
      vaseGroup.add(rib);
    }

    // Sculptural contorted bare branches emerging from the fluted vase (matching photo!)
    const branchPaths: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
      [
        [0, 0.18, 0],
        [-0.04, 0.28, -0.06],
        [-0.09, 0.36, -0.14],
        [-0.06, 0.44, -0.21],
        [-0.11, 0.49, -0.17],
      ],
      [
        [0.01, 0.18, -0.01],
        [-0.02, 0.25, -0.09],
        [0.03, 0.31, -0.17],
        [-0.02, 0.38, -0.24],
      ],
      [
        [-0.01, 0.28, -0.07],
        [-0.08, 0.33, -0.04],
        [-0.13, 0.41, -0.09],
      ],
    ];
    for (const pts of branchPaths) {
      const curvePts = pts.map(([bx, by, bz]) => new THREE.Vector3(bx, by, bz));
      const branchCurve = new THREE.CatmullRomCurve3(curvePts);
      const branchTube = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.TubeGeometry(branchCurve, 14, 0.0045, 7, false)),
          darkBranchMat
        )
      );
      branchTube.name = 'sittingRoom.coffeeTable.sculpturalBranch';
      branchTube.castShadow = true;
      vaseGroup.add(branchTube);
    }
    coffeeTableGroup.add(vaseGroup);

    // Stack of 2 Large Hardcover Coffee-Table Books beside the fluted vase
    const bookBottomMat = new THREE.MeshStandardMaterial({
      color: 0x9e9283, // Warm taupe-linen bottom volume
      roughness: 0.68,
    });
    const bookTopMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d2, // Cream/ivory hardcover top volume
      roughness: 0.58,
    });
    const artBookBottom = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.27, 0.032, 0.33)),
      bookBottomMat
    );
    artBookBottom.name = 'sittingRoom.coffeeTable.artBook.bottom';
    artBookBottom.position.set(0.03, ctH + 0.016, 0.12);
    artBookBottom.rotation.y = 0.05;
    artBookBottom.castShadow = true;
    artBookBottom.receiveShadow = true;
    coffeeTableGroup.add(artBookBottom);

    const artBookTop = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.24, 0.026, 0.3)),
      bookTopMat
    );
    artBookTop.name = 'sittingRoom.coffeeTable.artBook.top';
    artBookTop.position.set(0.025, ctH + 0.045, 0.12);
    artBookTop.rotation.y = -0.04;
    artBookTop.castShadow = true;
    artBookTop.receiveShadow = true;
    coffeeTableGroup.add(artBookTop);

    scene.add(coffeeTableGroup);
  }

  // Plasterboard ceiling backing above the exposed oak spine beam & joists (seals the 1.625m Sitting Room ceiling from below)
  buildPolygonalFloorSlab(
    groundFloorCeilingGroup,
    [
      [-22.36, 3.55],
      [-16.95, 3.55],
      [-17.16, 8.39],
      [-22.36, 8.39],
    ],
    frontWallH + 0.012,
    0.036,
    warmRoomPlasterMat,
    0.5
  ).name = 'sittingRoom.ceilingBacking';

  // Exposed Natural Oak North-South Spine Beam & East-West Ceiling Joists in Sitting Room (Issue #1: lowered for frontWallH = 1.625m)
  // `livingSpineBeam` bears into the North partition wall (Z = 3.66m) and the North brick face of the Inglenook Chimney Breast (Z = 7.70m)!
  const livingSpineBeam = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.2, 0.19, 4.04)),
    oakMat
  );
  livingSpineBeam.name = 'sittingRoom.spineBeam';
  livingSpineBeam.position.set(-19.8, frontWallH - 0.15, 5.68);
  livingSpineBeam.castShadow = true;
  groundFloorCeilingGroup.add(livingSpineBeam);

  // East-West Ceiling Joists spanning from the West exterior brick wall (X = -22.21m) across `livingSpineBeam`
  // into the angled East Courtyard brick wall, stopping North of the Z = 7.68m Chimney Breast & alcove bookcases!
  for (let ljz = 4.05; ljz <= 7.45; ljz += 0.42) {
    const xWest = -22.21;
    const xEast =
      -16.82 + ((-17.25 - -16.82) / (11.77 - 2.4)) * (ljz - 2.4) - 0.12;
    const joistSpanX = xEast - xWest;
    const livingJoist = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(joistSpanX, 0.11, 0.095)),
      oakMat
    );
    livingJoist.name = 'sittingRoom.ceilingJoist';
    livingJoist.position.set((xWest + xEast) * 0.5, frontWallH - 0.08, ljz);
    livingJoist.castShadow = true;
    groundFloorCeilingGroup.add(livingJoist);
  }
}
