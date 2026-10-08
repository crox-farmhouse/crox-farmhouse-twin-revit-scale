import * as THREE from 'three';
import type { WallLocalFrame } from '../../../../../engine/geometry/index.ts';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../../../core/types/scene.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { buildDiningRoom } from '../dining-room.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type CentralHallFurnitureKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  'antiqueOakSkirtingMat' | 'brassMat' | 'ceramicWhiteMat' | 'tagCutawayWall'
> &
  Pick<ReturnType<typeof buildDiningRoom>, 'lowerFloorY'> & {
    readonly hallFrontRoomCrossWallFrame: WallLocalFrame;
  };

/**
 * Central Stair Hall (`hall`) furniture and decor: turned aged-brass floor lamp,
 * framed cross-wall artwork & cinema movie posters, Berber Ksar round rug, and
 * 1:1 Roland GP-6-PE baby grand digital piano with artist bench.
 */
export function buildCentralHallFurnitureAndDecor(
  ctx: SceneBuilderContext,
  kit: CentralHallFurnitureKit
): void {
  const { interactions, lightGroups, scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    ceramicWhiteMat,
    hallFrontRoomCrossWallFrame,
    lowerFloorY,
    tagCutawayWall,
  } = kit;

  // Issue #3: Turned Aged-Brass & Fluted-Walnut Column Floor Lamp with Warm Tapered Linen Empire Shade
  // at [-13.619, lowerFloorY, -2.044], wired to the KNX `hallPendant` circuit
  {
    const floorLampGroup = new THREE.Group();
    floorLampGroup.name = 'hall.floorLamp';
    floorLampGroup.userData.zone = 'hall';
    floorLampGroup.position.set(-13.619, lowerFloorY, -2.044);

    const lampBrassMat = new THREE.MeshStandardMaterial({
      color: 0x8d6b3b,
      roughness: 0.28,
      metalness: 0.82,
    });
    const lampDarkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x3b2d1d,
      roughness: 0.36,
      metalness: 0.72,
    });
    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf6ebd6,
      emissive: 0xffb654,
      emissiveIntensity: 2.1,
      roughness: 0.62,
      side: THREE.DoubleSide,
    });
    lampShadeMat.userData.baseEmissiveIntensity = 2.1;
    const lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e4,
      emissive: 0xffbc58,
      emissiveIntensity: 2.8,
      roughness: 0.14,
    });
    lampBulbMat.userData.baseEmissiveIntensity = 2.8;
    lightGroups.hallPendant.emissives.push(lampShadeMat, lampBulbMat);

    // 1. Stepped circular weighted aged-brass plinth base (r = 0.165m)
    const basePlinth = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.155, 0.168, 0.022, 24)),
      lampBrassMat
    );
    basePlinth.name = 'hall.floorLamp.base';
    basePlinth.position.set(0, 0.011, 0);
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    floorLampGroup.add(basePlinth);

    const baseStep = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.112, 0.148, 0.026, 24)),
      lampBrassMat
    );
    baseStep.name = 'hall.floorLamp.baseStep';
    baseStep.position.set(0, 0.035, 0);
    baseStep.castShadow = true;
    floorLampGroup.add(baseStep);

    const baseTorus = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.TorusGeometry(0.11, 0.008, 12, 24)),
        lampDarkBronzeMat
      )
    );
    baseTorus.name = 'hall.floorLamp.baseTorus';
    baseTorus.rotation.x = Math.PI / 2;
    baseTorus.position.set(0, 0.048, 0);
    floorLampGroup.add(baseTorus);

    // Lower turned baluster collar
    const lowerBaluster = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.026, 0.058, 0.095, 20)),
      lampBrassMat
    );
    lowerBaluster.name = 'hall.floorLamp.lowerBaluster';
    lowerBaluster.position.set(0, 0.095, 0);
    lowerBaluster.castShadow = true;
    floorLampGroup.add(lowerBaluster);

    // 2. Slender vertical standard stem (lower section + central turned brass knop + upper section)
    const lowerStem = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.016, 0.019, 0.58, 16)),
      antiqueOakSkirtingMat
    );
    lowerStem.name = 'hall.floorLamp.stemLower';
    lowerStem.position.set(0, 0.43, 0);
    lowerStem.castShadow = true;
    floorLampGroup.add(lowerStem);

    const centerKnop = tagHighLod(
      new THREE.Mesh(createSharedGeo(new THREE.SphereGeometry(0.026, 16, 12)), lampBrassMat)
    );
    centerKnop.name = 'hall.floorLamp.centerKnop';
    centerKnop.scale.set(1, 0.72, 1);
    centerKnop.position.set(0, 0.73, 0);
    floorLampGroup.add(centerKnop);

    const knopRingGeo = createSharedGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.01, 16));
    const knopOffsets = [-0.022, 0.022] as const;
    for (let rIdx = 0; rIdx < knopOffsets.length; rIdx++) {
      const dy = knopOffsets[rIdx]!;
      const knopRing = tagHighLod(new THREE.Mesh(knopRingGeo, lampDarkBronzeMat));
      knopRing.name = `hall.floorLamp.knopRing.${rIdx + 1}`;
      knopRing.position.set(0, 0.73 + dy, 0);
      floorLampGroup.add(knopRing);
    }

    const upperStem = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.0135, 0.016, 0.54, 16)),
      lampBrassMat
    );
    upperStem.name = 'hall.floorLamp.stemUpper';
    upperStem.position.set(0, 1.01, 0);
    upperStem.castShadow = true;
    floorLampGroup.add(upperStem);

    // Upper capital collar & twin pull-chain lampholder cluster
    const capitalCollar = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.028, 0.016, 0.048, 18)),
        lampBrassMat
      )
    );
    capitalCollar.name = 'hall.floorLamp.capitalCollar';
    capitalCollar.position.set(0, 1.295, 0);
    floorLampGroup.add(capitalCollar);

    // 2 pull chains with acorn finials hanging beneath the shade
    const pullChainGeo = createSharedGeo(new THREE.CylinderGeometry(0.0018, 0.0018, 0.11, 8));
    const pullAcornGeo = createSharedGeo(new THREE.SphereGeometry(0.0055, 10, 10));
    const pullChainSides = [-0.032, 0.032] as const;
    for (let cIdx = 0; cIdx < pullChainSides.length; cIdx++) {
      const sideX = pullChainSides[cIdx]!;
      const pullChain = tagHighLod(new THREE.Mesh(pullChainGeo, lampBrassMat));
      pullChain.name = `hall.floorLamp.pullChain.${cIdx + 1}`;
      pullChain.position.set(sideX, 1.255, 0.012);
      floorLampGroup.add(pullChain);

      const pullAcorn = tagHighLod(new THREE.Mesh(pullAcornGeo, lampDarkBronzeMat));
      pullAcorn.name = `hall.floorLamp.pullAcorn.${cIdx + 1}`;
      pullAcorn.scale.set(0.85, 1.35, 0.85);
      pullAcorn.position.set(sideX, 1.196, 0.012);
      floorLampGroup.add(pullAcorn);
    }

    // 3. Warm LED globe bulb + Tapered Woven-Linen Empire Shade (Y = 1.26m..1.54m)
    const shadeCenterY = 1.4;
    const shadeH = 0.28;
    const shadeTopR = 0.155;
    const shadeBotR = 0.245;

    const lampBulb = new THREE.Mesh(
      createSharedGeo(new THREE.SphereGeometry(0.036, 14, 12)),
      lampBulbMat
    );
    lampBulb.name = 'hall.floorLamp.bulb';
    lampBulb.position.set(0, shadeCenterY - 0.02, 0);
    floorLampGroup.add(lampBulb);

    const lampShade = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(shadeTopR, shadeBotR, shadeH, 32, 1, true)),
      lampShadeMat
    );
    lampShade.name = 'hall.floorLamp.shade';
    lampShade.position.set(0, shadeCenterY, 0);
    lampShade.castShadow = true;
    floorLampGroup.add(lampShade);

    const shadeTopRim = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.TorusGeometry(shadeTopR, 0.004, 10, 32)),
        lampDarkBronzeMat
      )
    );
    shadeTopRim.name = 'hall.floorLamp.shadeTopRim';
    shadeTopRim.rotation.x = Math.PI / 2;
    shadeTopRim.position.set(0, shadeCenterY + shadeH * 0.5, 0);
    floorLampGroup.add(shadeTopRim);

    const shadeBotRim = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.TorusGeometry(shadeBotR, 0.0045, 10, 32)),
        lampDarkBronzeMat
      )
    );
    shadeBotRim.name = 'hall.floorLamp.shadeBotRim';
    shadeBotRim.rotation.x = Math.PI / 2;
    shadeBotRim.position.set(0, shadeCenterY - shadeH * 0.5, 0);
    floorLampGroup.add(shadeBotRim);

    // 3-spoke brass spider ring & top turned finial above the shade
    const spokeGeo = createSharedGeo(new THREE.CylinderGeometry(0.0022, 0.0022, shadeTopR, 8));
    for (let s = 0; s < 3; s++) {
      const ang = (s * Math.PI * 2) / 3;
      const spoke = tagHighLod(new THREE.Mesh(spokeGeo, lampBrassMat));
      spoke.name = `hall.floorLamp.spiderSpoke.${s + 1}`;
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = ang;
      spoke.position.set(
        Math.cos(ang) * shadeTopR * 0.5,
        shadeCenterY + shadeH * 0.5 - 0.012,
        -Math.sin(ang) * shadeTopR * 0.5
      );
      floorLampGroup.add(spoke);
    }

    const topFinial = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.008, 0.014, 0.042, 14)),
        lampBrassMat
      )
    );
    topFinial.name = 'hall.floorLamp.topFinial';
    topFinial.position.set(0, shadeCenterY + shadeH * 0.5 + 0.012, 0);
    floorLampGroup.add(topFinial);

    scene.add(floorLampGroup);
    interactions.registerLightFixture(floorLampGroup, 'hallPendant');

    // Emissive linen shade + bulb + floor glow pool (the Hall's consolidated PointLight is on `hall.southWallLight`)
    ctx.addGlowPool('hallPendant', -13.619, lowerFloorY + 0.006, -2.044, 1.25, 0.26);
  }

  // Issue #5: Framed Landscape Artwork on the Hall / Front Room Cross-Wall (`[-17.586, 1.301, 1.158]`)
  // Mounted flush on the East (`-normal`, Hall) face at u = 3.66, y = 1.22, n = -0.122, plus companion artwork on the West (`+normal`, Front Room) face
  {
    const crossWallCutaway: CutawayWallDescriptor = {
      axis: 'x',
      coord: -17.65,
      minSpan: -2.5,
      maxSpan: 2.4,
      floor: 'ground',
    };

    const artCanvas = document.createElement('canvas');
    artCanvas.width = 384;
    artCanvas.height = 288;
    const aCtx = artCanvas.getContext('2d');
    if (aCtx) {
      const skyGrad = aCtx.createLinearGradient(0, 0, 0, 175);
      skyGrad.addColorStop(0, '#7c96a8');
      skyGrad.addColorStop(0.58, '#c6d2d0');
      skyGrad.addColorStop(1, '#ecdcc2');
      aCtx.fillStyle = skyGrad;
      aCtx.fillRect(0, 0, 384, 288);

      // Rolling Chilterns hills & sunlit pasture
      aCtx.fillStyle = '#627868';
      aCtx.beginPath();
      aCtx.moveTo(0, 168);
      aCtx.quadraticCurveTo(110, 132, 220, 160);
      aCtx.quadraticCurveTo(310, 140, 384, 165);
      aCtx.lineTo(384, 288);
      aCtx.lineTo(0, 288);
      aCtx.fill();

      const fieldGrad = aCtx.createLinearGradient(0, 165, 0, 288);
      fieldGrad.addColorStop(0, '#86945c');
      fieldGrad.addColorStop(0.55, '#5b6d42');
      fieldGrad.addColorStop(1, '#3c4b2c');
      aCtx.fillStyle = fieldGrad;
      aCtx.beginPath();
      aCtx.moveTo(0, 188);
      aCtx.quadraticCurveTo(140, 170, 260, 196);
      aCtx.quadraticCurveTo(330, 206, 384, 184);
      aCtx.lineTo(384, 288);
      aCtx.lineTo(0, 288);
      aCtx.fill();

      // Copse of mature oak trees & country lane
      aCtx.fillStyle = '#d4c5a8';
      aCtx.beginPath();
      aCtx.moveTo(175, 190);
      aCtx.bezierCurveTo(160, 225, 220, 255, 190, 288);
      aCtx.lineTo(235, 288);
      aCtx.bezierCurveTo(255, 250, 195, 225, 198, 190);
      aCtx.fill();

      aCtx.fillStyle = '#314226';
      for (const [tx, ty, tr] of [
        [72, 152, 34],
        [98, 160, 28],
        [305, 158, 32],
        [330, 166, 24],
      ] as const) {
        aCtx.beginPath();
        aCtx.arc(tx, ty, tr, 0, Math.PI * 2);
        aCtx.fill();
      }
    }
    const crossWallArtTex = new THREE.CanvasTexture(artCanvas);
    crossWallArtTex.colorSpace = THREE.SRGBColorSpace;
    const crossWallArtMat = new THREE.MeshStandardMaterial({
      map: crossWallArtTex,
      roughness: 0.42,
      metalness: 0.02,
    });

    // 1. East (Hall) face landscape painting at u = 3.27, y = 1.22, n = -0.122 (Issue #15: moved to [-17.567, 1.22, 0.772])
    {
      const hallPicGroup = new THREE.Group();
      hallPicGroup.name = 'hall.westCrossWallPicture';
      hallPicGroup.position.copy(hallFrontRoomCrossWallFrame.toWorld(3.27, 1.22, -0.122));
      hallPicGroup.rotation.y = hallFrontRoomCrossWallFrame.rotationY + Math.PI;

      const fw = 0.72;
      const fh = 0.54;
      const fd = 0.028;
      const railW = 0.036;
      const horizRailGeo = createSharedGeo(new THREE.BoxGeometry(fw, railW, fd));
      const vertRailGeo = createSharedGeo(new THREE.BoxGeometry(railW, fh - railW * 2, fd));

      const picRails = [
        [0, fh / 2 - railW / 2, horizRailGeo, 'top'],
        [0, -fh / 2 + railW / 2, horizRailGeo, 'bottom'],
        [-fw / 2 + railW / 2, 0, vertRailGeo, 'left'],
        [fw / 2 - railW / 2, 0, vertRailGeo, 'right'],
      ] as const;

      for (const [rx, ry, rGeo, sideTag] of picRails) {
        const rail = tagHighLod(new THREE.Mesh(rGeo, antiqueOakSkirtingMat));
        rail.name = `hall.westCrossWallPicture.frame.${sideTag}`;
        rail.position.set(rx, ry, fd / 2);
        rail.castShadow = true;
        rail.receiveShadow = true;
        hallPicGroup.add(rail);
      }

      const mountBoard = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.BoxGeometry(fw - railW * 2, fh - railW * 2, 0.016)),
          ceramicWhiteMat
        )
      );
      mountBoard.name = 'hall.westCrossWallPicture.mount';
      mountBoard.position.set(0, 0, 0.01);
      hallPicGroup.add(mountBoard);

      const canvasMesh = new THREE.Mesh(
        createSharedGeo(new THREE.PlaneGeometry(fw - 0.16, fh - 0.14)),
        crossWallArtMat
      );
      canvasMesh.name = 'hall.westCrossWallPicture.canvas';
      canvasMesh.position.set(0, 0, 0.02);
      hallPicGroup.add(canvasMesh);

      tagCutawayWall(hallPicGroup, crossWallCutaway);
      scene.add(hallPicGroup);
    }

    // 2. West (Front Room / Home Cinema) face: 3 Framed Classic Movie Posters (Issues #17, #22, #23, #24)
    //    - North Movie Poster (`livingRoom.eastWallMoviePoster.north`) at u = 0.585 (Z = -1.918m, Issue #22)
    //    - Center Movie Poster (`livingRoom.eastWallPicture`) at u = 2.345 (Z = -0.163m, between the two wall sconces, Issues #17 & #23)
    //    - South Movie Poster (`livingRoom.eastWallMoviePoster.south`) at u = 3.765 (Z = +1.256m, Issue #24)
    const posterFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1b1d22,
      roughness: 0.34,
      metalness: 0.38,
    });
    const buildMoviePosterTexture = (theme: 'odyssey' | 'vertigo' | 'lemans'): THREE.CanvasTexture => {
      const c = document.createElement('canvas');
      c.width = 280;
      c.height = 400;
      const pCtx = c.getContext('2d');
      if (pCtx) {
        if (theme === 'odyssey') {
          // Classic "2001: A Space Odyssey" (1968) cosmic monolith & orbital wheel poster
          const bg = pCtx.createLinearGradient(0, 0, 0, 400);
          bg.addColorStop(0, '#090d1a');
          bg.addColorStop(0.55, '#162447');
          bg.addColorStop(0.82, '#c86b3c');
          bg.addColorStop(1, '#e6b86a');
          pCtx.fillStyle = bg;
          pCtx.fillRect(0, 0, 280, 400);

          // Glowing lunar horizon arc at bottom
          pCtx.fillStyle = '#1b1f2c';
          pCtx.beginPath();
          pCtx.arc(140, 490, 210, Math.PI * 1.15, Math.PI * 1.85);
          pCtx.fill();

          // Sun / alignment corona above the monolith
          const sunGrad = pCtx.createRadialGradient(140, 118, 4, 140, 118, 68);
          sunGrad.addColorStop(0, '#fffdf2');
          sunGrad.addColorStop(0.35, '#ffd27d');
          sunGrad.addColorStop(1, 'rgba(255, 160, 70, 0)');
          pCtx.fillStyle = sunGrad;
          pCtx.beginPath();
          pCtx.arc(140, 118, 68, 0, Math.PI * 2);
          pCtx.fill();

          // Iconic black TMA-1 Monolith in 1:4:9 proportion
          pCtx.fillStyle = '#050608';
          pCtx.fillRect(108, 118, 64, 176);
          pCtx.strokeStyle = 'rgba(255, 230, 175, 0.45)';
          pCtx.lineWidth = 1.5;
          pCtx.strokeRect(108, 118, 64, 176);

          // Typography banner at bottom
          pCtx.fillStyle = '#f4efe4';
          pCtx.fillRect(18, 326, 244, 54);
          pCtx.fillStyle = '#111520';
          pCtx.font = 'bold 20px Georgia, serif';
          pCtx.textAlign = 'center';
          pCtx.fillText('2001', 140, 350);
          pCtx.font = '10px sans-serif';
          pCtx.fillText('A SPACE ODYSSEY', 140, 368);
        } else if (theme === 'vertigo') {
          // Classic Saul Bass "VERTIGO" (1958) crimson-orange spiral & noir silhouette poster
          pCtx.fillStyle = '#d94826';
          pCtx.fillRect(0, 0, 280, 400);

          // Nested Saul Bass geometric Lissajous / Hypotrochoid white spiral rings
          pCtx.strokeStyle = '#f8f3e6';
          pCtx.lineWidth = 2.4;
          for (let r = 16; r <= 112; r += 9) {
            pCtx.beginPath();
            pCtx.ellipse(140, 175, r, r * 0.76, (r * 0.045) % Math.PI, 0, Math.PI * 2);
            pCtx.stroke();
          }

          // Stylized black noir silhouette figures at center of vortex
          pCtx.fillStyle = '#0c0c0e';
          pCtx.beginPath();
          pCtx.moveTo(132, 145);
          pCtx.lineTo(148, 145);
          pCtx.lineTo(156, 225);
          pCtx.lineTo(124, 225);
          pCtx.closePath();
          pCtx.fill();
          pCtx.beginPath();
          pCtx.arc(140, 132, 10, 0, Math.PI * 2);
          pCtx.fill();

          // Bold block title header & footer bars
          pCtx.fillStyle = '#0c0c0e';
          pCtx.fillRect(22, 26, 236, 44);
          pCtx.fillStyle = '#f8f3e6';
          pCtx.font = 'bold 24px Impact, sans-serif';
          pCtx.textAlign = 'center';
          pCtx.fillText('V E R T I G O', 140, 57);

          pCtx.fillStyle = '#0c0c0e';
          pCtx.font = 'bold 12px sans-serif';
          pCtx.fillText('ALFRED HITCHCOCK', 140, 352);
        } else {
          // Classic "LE MANS" (1971) Gulf Powder-Blue & Marigold-Orange racing stripe cinema poster
          pCtx.fillStyle = '#1b2b44';
          pCtx.fillRect(0, 0, 280, 400);

          // Diagonal Gulf powder-blue & papaya-orange speed bands
          pCtx.fillStyle = '#6ca6cd';
          pCtx.beginPath();
          pCtx.moveTo(0, 95);
          pCtx.lineTo(280, 35);
          pCtx.lineTo(280, 285);
          pCtx.lineTo(0, 345);
          pCtx.closePath();
          pCtx.fill();

          pCtx.fillStyle = '#eb6828';
          pCtx.beginPath();
          pCtx.moveTo(0, 165);
          pCtx.lineTo(280, 105);
          pCtx.lineTo(280, 205);
          pCtx.lineTo(0, 265);
          pCtx.closePath();
          pCtx.fill();

          // Iconic white roundel #20
          pCtx.fillStyle = '#faf8f2';
          pCtx.beginPath();
          pCtx.arc(140, 185, 44, 0, Math.PI * 2);
          pCtx.fill();
          pCtx.strokeStyle = '#111622';
          pCtx.lineWidth = 3;
          pCtx.stroke();

          pCtx.fillStyle = '#111622';
          pCtx.font = 'bold 42px Impact, sans-serif';
          pCtx.textAlign = 'center';
          pCtx.fillText('20', 140, 201);

          // Title block at bottom
          pCtx.fillStyle = '#faf8f2';
          pCtx.font = 'bold 26px Impact, sans-serif';
          pCtx.fillText('L E   M A N S', 140, 354);
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const posterConfigs: ReadonlyArray<{
      readonly name: string;
      readonly uPos: number;
      readonly yPos: number;
      readonly theme: 'odyssey' | 'vertigo' | 'lemans';
    }> = [
      {
        name: 'livingRoom.eastWallMoviePoster.north',
        uPos: 0.945, // Even 1.40m center-to-center spacing & ~0.95m North edge margin (Issue #1)
        yPos: 1.02,
        theme: 'odyssey',
      },
      {
        name: 'livingRoom.eastWallPicture',
        uPos: 2.345, // World Z = -0.163m centered on wall (Issue #1)
        yPos: 1.02,
        theme: 'vertigo',
      },
      {
        name: 'livingRoom.eastWallMoviePoster.south',
        uPos: 3.745, // Even 1.40m center-to-center spacing & ~0.95m South edge margin (Issue #1)
        yPos: 1.02,
        theme: 'lemans',
      },
    ];

    // Issue #3: Slightly larger framed movie posters (0.64m wide x 0.90m tall, up from 0.54m x 0.76m)
    const posterW = 0.64;
    const posterH = 0.9;
    const posterD = 0.028;
    const posterRailW = 0.032;
    const posterHorizRailGeo = createSharedGeo(new THREE.BoxGeometry(posterW, posterRailW, posterD));
    const posterVertRailGeo = createSharedGeo(
      new THREE.BoxGeometry(posterRailW, posterH - posterRailW * 2, posterD)
    );
    const posterMountBoardGeo = createSharedGeo(
      new THREE.BoxGeometry(posterW - posterRailW * 2, posterH - posterRailW * 2, 0.016)
    );
    const posterCanvasGeo = createSharedGeo(new THREE.PlaneGeometry(posterW - 0.11, posterH - 0.12));

    for (const cfg of posterConfigs) {
      const posterGroup = new THREE.Group();
      posterGroup.name = cfg.name;
      posterGroup.userData.zone = 'livingRoom';
      posterGroup.position.copy(
        hallFrontRoomCrossWallFrame.toWorld(cfg.uPos, cfg.yPos, 0.122)
      );
      posterGroup.rotation.y = hallFrontRoomCrossWallFrame.rotationY;

      const posterRails = [
        [0, posterH / 2 - posterRailW / 2, posterHorizRailGeo, 'top'],
        [0, -posterH / 2 + posterRailW / 2, posterHorizRailGeo, 'bottom'],
        [-posterW / 2 + posterRailW / 2, 0, posterVertRailGeo, 'left'],
        [posterW / 2 - posterRailW / 2, 0, posterVertRailGeo, 'right'],
      ] as const;

      for (const [rx, ry, rGeo, sideTag] of posterRails) {
        const rail = tagHighLod(new THREE.Mesh(rGeo, posterFrameMat));
        rail.name = `${cfg.name}.frame.${sideTag}`;
        rail.position.set(rx, ry, posterD / 2);
        rail.castShadow = true;
        rail.receiveShadow = true;
        posterGroup.add(rail);
      }

      const mountBoard = tagHighLod(new THREE.Mesh(posterMountBoardGeo, ceramicWhiteMat));
      mountBoard.name = `${cfg.name}.mount`;
      mountBoard.position.set(0, 0, 0.01);
      posterGroup.add(mountBoard);

      const posterMat = new THREE.MeshStandardMaterial({
        map: buildMoviePosterTexture(cfg.theme),
        roughness: 0.34,
        metalness: 0.04,
      });
      const posterMesh = new THREE.Mesh(posterCanvasGeo, posterMat);
      posterMesh.name = `${cfg.name}.canvas`;
      posterMesh.position.set(0, 0, 0.02);
      posterGroup.add(posterMesh);

      tagCutawayWall(posterGroup, crossWallCutaway);
      scene.add(posterGroup);
    }
  }

  // Louis De Poortere Berber Ksar 9653 Round Chenille Jacquard Flatweave Rug in Entrance Hall
  // (positioned at [-14.72, -0.3, 0.28] to frame the Roland GP-6-PE Baby Grand)
  {
    const roundRugGroup = new THREE.Group();
    roundRugGroup.name = 'hall.roundRug';
    roundRugGroup.position.set(-15.029, lowerFloorY, -0.148);

    const rugCanvas = document.createElement('canvas');
    rugCanvas.width = 512;
    rugCanvas.height = 512;
    const rCtx = rugCanvas.getContext('2d');
    if (rCtx) {
      // Exact Louis De Poortere "Berber Ksar 9653" Round Flatweave Jacquard Palette
      const ivoryCream = '#ede3d1';
      const warmLinen = '#dfd1ba';
      const terracotta = '#b55635';
      const rustRed = '#9b3c27';
      const ochreMustard = '#d19234';
      const tealBlue = '#3b6d7c';
      const sageGreen = '#5e7a62';
      const charcoalUmber = '#26211e';

      const motifPalette = [
        terracotta,
        ochreMustard,
        tealBlue,
        rustRed,
        ivoryCream,
        sageGreen,
        warmLinen,
      ] as const;

      // Base dark charcoal-umber warp ground (visible as vertical column dividers & horizontal band borders)
      rCtx.fillStyle = charcoalUmber;
      rCtx.fillRect(0, 0, 512, 512);

      // Helper to paint an authentic distressed Berber Ksar woven block with inner diamond/eye or stepped motif
      const drawBerberBlock = (
        bx: number,
        by: number,
        bw: number,
        bh: number,
        seed: number
      ): void => {
        const bgCol = motifPalette[seed % motifPalette.length]!;
        const innerCol = motifPalette[(seed * 3 + 2) % motifPalette.length]!;
        const coreCol = seed % 2 === 0 ? ivoryCream : charcoalUmber;

        rCtx.fillStyle = bgCol;
        rCtx.fillRect(bx, by, bw, bh);

        if (bw >= 12 && bh >= 10) {
          const mx = bx + bw * 0.5;
          const my = by + bh * 0.5;
          const rx = bw * 0.34;
          const ry = bh * 0.34;

          // Stepped Berber lozenge / diamond
          rCtx.fillStyle = innerCol;
          rCtx.beginPath();
          rCtx.moveTo(mx, my - ry);
          rCtx.lineTo(mx + rx, my);
          rCtx.lineTo(mx, my + ry);
          rCtx.lineTo(mx - rx, my);
          rCtx.closePath();
          rCtx.fill();

          // Central tribal eye dot
          rCtx.fillStyle = coreCol;
          rCtx.fillRect(mx - 2.5, my - 2, 5, 4);
        }
      };

      // Helper to paint a geometric Berber checkerboard zone (upper-left & upper-right panels in Ksar 9653)
      const drawCheckerZone = (
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        cellW: number,
        cellH: number,
        seedOffset: number
      ): void => {
        const cols = Math.floor((x1 - x0) / cellW);
        const rows = Math.floor((y1 - y0) / cellH);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const isLight = (r + c) % 2 === 0;
            rCtx.fillStyle = isLight
              ? (r + seedOffset) % 4 === 0
                ? warmLinen
                : ivoryCream
              : motifPalette[(r * 5 + c * 3 + seedOffset) % motifPalette.length]!;
            rCtx.fillRect(x0 + c * cellW + 0.5, y0 + r * cellH + 0.5, cellW - 1, cellH - 1);

            if (!isLight && cellW >= 14 && (r + c) % 3 === 0) {
              rCtx.fillStyle = ivoryCream;
              rCtx.fillRect(
                x0 + (c + 0.35) * cellW,
                y0 + (r + 0.35) * cellH,
                cellW * 0.3,
                cellH * 0.3
              );
            }
          }
        }
      };

      // Asymmetric 3-Column Moroccan Tribal Patchwork Grid (matching Louis De Poortere Ksar 9653):
      // 1. Left Column (x = 0..178):
      //    - Upper-left checkerboard panel (y = 0..168)
      drawCheckerZone(0, 0, 178, 168, 16, 15, 1);
      //    - Lower-left horizontal tribal bands with vertical Berber lozenges & chevrons (y = 172..512)
      for (const [bandIdx, by0, by1] of [
        [0, 172, 252],
        [1, 256, 344],
        [2, 348, 430],
        [3, 434, 512],
      ] as const) {
        const stripePitch = bandIdx % 2 === 0 ? 22 : 18;
        for (let sx = 6 + bandIdx * 4; sx < 176; sx += stripePitch) {
          drawBerberBlock(
            sx,
            by0 + 2,
            stripePitch - 3,
            by1 - by0 - 4,
            bandIdx * 17 + sx
          );
        }
      }

      // 2. Central Main Field (x = 181..441):
      //    - 9 horizontal Moroccan tribal tapestry registers with staggered colorful vertical blocks
      const bandEdges = [0, 56, 114, 170, 228, 286, 346, 404, 458, 512] as const;
      for (let b = 0; b < bandEdges.length - 1; b++) {
        const yTop = bandEdges[b]! + 2;
        const yBot = bandEdges[b + 1]! - 2;
        const bh = yBot - yTop;
        const pitchX = b % 3 === 0 ? 26 : b % 2 === 0 ? 20 : 32;
        const phaseX = (b * 9) % 14;
        let idx = 0;
        for (let sx = 181 + phaseX; sx < 441; sx += pitchX) {
          const bw = Math.min(pitchX - 3, 441 - sx);
          if (bw > 5) {
            drawBerberBlock(sx, yTop, bw, bh, b * 31 + idx * 7);
          }
          idx++;
        }
        // Thin horizontal ivory/ochre chain-stitch divider line between registers
        rCtx.fillStyle = b % 2 === 0 ? ivoryCream : ochreMustard;
        rCtx.fillRect(181, bandEdges[b + 1]! - 1.5, 260, 1.5);
      }

      // 3. Right Column (x = 444..512):
      //    - Upper-right small checkerboard (y = 0..234)
      drawCheckerZone(444, 0, 512, 234, 13, 13, 401);
      //    - Lower-right horizontal Berber bars in two sub-columns (y = 236..512)
      for (const [subX0, subW, phaseY] of [
        [446, 32, 0],
        [481, 31, 7],
      ] as const) {
        let rowIdx = 0;
        for (let sy = 238 + phaseY; sy < 508; sy += 20) {
          drawBerberBlock(subX0, sy, subW, 10.5, 509 + rowIdx * 19 + subX0);
          rowIdx++;
        }
      }

      // 4. Fine horizontal chenille jacquard weft ribs & subtle vintage fading world patina
      for (let y = 0; y < 512; y += 2) {
        rCtx.fillStyle =
          y % 4 === 0 ? 'rgba(255, 248, 238, 0.065)' : 'rgba(58, 34, 22, 0.055)';
        rCtx.fillRect(0, y, 512, 1);
      }
      for (let y = 0; y < 512; y += 4) {
        for (let x = 0; x < 512; x += 4) {
          const n = ((x * 23 + y * 41 + ((x ^ y) & 15) * 7) % 18) - 9;
          if (n !== 0) {
            rCtx.fillStyle =
              n > 0
                ? `rgba(246, 236, 222, ${n * 0.0045})`
                : `rgba(72, 42, 28, ${-n * 0.0045})`;
            rCtx.fillRect(x, y, 4, 4);
          }
        }
      }
    }
    const roundRugTex = new THREE.CanvasTexture(rugCanvas);
    roundRugTex.colorSpace = THREE.SRGBColorSpace;

    const roundRugMat = new THREE.MeshStandardMaterial({
      map: roundRugTex,
      bumpMap: roundRugTex,
      bumpScale: 0.0035,
      roughness: 0.88,
      metalness: 0.01,
    });
    const roundRugBorderMat = new THREE.MeshStandardMaterial({
      color: 0x885842,
      roughness: 0.88,
      metalness: 0.01,
    });

    const rugRadius = 1.05; // 2.10m diameter circular rug
    const rugDisc = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(rugRadius, rugRadius, 0.008, 48)),
      roundRugMat
    );
    rugDisc.name = 'hall.roundRug.disc';
    rugDisc.position.set(0, 0.004, 0);
    rugDisc.receiveShadow = true;
    roundRugGroup.add(rugDisc);

    const rugBraidedEdge = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.TorusGeometry(rugRadius - 0.008, 0.005, 10, 48)),
        roundRugBorderMat
      )
    );
    rugBraidedEdge.name = 'hall.roundRug.braidedEdge';
    rugBraidedEdge.rotation.x = Math.PI / 2;
    rugBraidedEdge.position.set(0, 0.005, 0);
    rugBraidedEdge.receiveShadow = true;
    roundRugGroup.add(rugBraidedEdge);

    scene.add(roundRugGroup);
  }

  // Issue #16 & Issue #2: 1:1 True-to-Scale Roland GP-6-PE (Polished Ebony) Baby Grand Digital Piano
  // Exact manufacturer dimensions: 1,404 mm W (1,412 mm lid open) × 959 mm D × 931 mm H (closed) / 1,526 mm H (top opened)
  // Rotated 180 degrees (`rotation.y = 0.92 - Math.PI` rad) so the pianist bench and PHA-50 / Piano Reality keyboard
  // sit in the NW alcove facing SE over the compact 95.9cm baby-grand cabinet toward the center of the Hall!
  {
    const pianoGroup = new THREE.Group();
    pianoGroup.name = 'hall.rolandGP6PE';
    pianoGroup.userData.zone = 'hall';
    pianoGroup.position.set(-15.111, lowerFloorY, -0.58);
    pianoGroup.rotation.y = 0.92 - Math.PI; // Rotated 180 degrees from 0.92 rad

    const rolandPolishedEbonyMat = new THREE.MeshStandardMaterial({
      color: 0x0b0c0f,
      roughness: 0.08,
      metalness: 0.18,
    });
    const rolandInnerRimMat = new THREE.MeshStandardMaterial({
      color: 0x161517,
      roughness: 0.24,
      metalness: 0.08,
    });
    const rolandChampagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc8a24e,
      roughness: 0.22,
      metalness: 0.84,
    });
    const rolandAcousticBaffleMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.76,
      metalness: 0.06,
    });
    const rolandSpeakerGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.62,
      metalness: 0.28,
    });
    const rolandRedFeltMat = new THREE.MeshStandardMaterial({
      color: 0x7c191e,
      roughness: 0.88,
    });
    const rolandTouchPanelMat = new THREE.MeshStandardMaterial({
      color: 0x090a0d,
      roughness: 0.14,
      metalness: 0.2,
      emissive: 0x9ec6e8,
      emissiveIntensity: 0.28,
    });
    const rolandLeatherBenchMat = new THREE.MeshStandardMaterial({
      color: 0x151619,
      roughness: 0.36,
      metalness: 0.06,
    });

    // Helper to build the exact 1:1 Roland GP-6-PE compact baby-grand footprint:
    // Width = 1.404m (halfW = 0.702m), Total Front-to-Back Depth = 0.959m (Z = -0.479m tail apex .. +0.480m front keybed).
    // Note: ExtrudeGeometry rotated -PI/2 around X maps shape (x, y) -> 3D (x, z = -y).
    // Front of main curved rim is at z = +0.18m (shape y = -0.18); tail apex is at z = -0.479m (shape y = +0.479).
    const createRolandGP6RimShape = (inset = 0): THREE.Shape => {
      const s = new THREE.Shape();
      const halfW = 0.702 - inset; // 1.404m / 2
      const frontY = -0.18 + inset; // z = +0.18m (joins the 0.30m-deep front keybed to reach z = +0.480m)
      const bassTurnY = 0.16 - inset * 0.5; // z = -0.16m
      const tailApexX = -0.15;
      const tailApexY = 0.479 - inset; // z = -0.479m (total depth with +0.480m keybed = 0.959m = 959mm!)

      s.moveTo(-halfW, frontY);
      // Straight bass side (left, -X) running back from z = +0.18m to z = -0.16m
      s.lineTo(-halfW, bassTurnY);
      // Compact baby-grand bass-to-tail curve around the tail apex
      s.bezierCurveTo(
        -halfW,
        0.41 - inset,
        -0.43,
        tailApexY,
        tailApexX,
        tailApexY
      );
      // Signature Roland GP-6 S-curved treble rim (right, +X) from tail apex through treble waist out to treble cheek
      s.bezierCurveTo(
        0.1 - inset * 0.6,
        tailApexY,
        0.23 - inset * 0.8,
        0.31,
        0.31 - inset * 0.8,
        0.12
      );
      s.bezierCurveTo(
        0.38 - inset * 0.8,
        -0.04,
        halfW,
        -0.06,
        halfW,
        frontY
      );
      s.closePath();
      return s;
    };

    // 1. Outer Polished Ebony (PE) Bent Case Rim (Y = 0.65m..0.913m, height = 0.263m; top with 18mm lid = 0.931m = 931mm)
    const outerRimShape = createRolandGP6RimShape(0);
    const outerRimGeo = new THREE.ExtrudeGeometry(outerRimShape, {
      depth: 0.263,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 28,
    });
    outerRimGeo.rotateX(-Math.PI / 2);
    outerRimGeo.computeBoundingSphere();
    const outerRimMesh = new THREE.Mesh(outerRimGeo, rolandPolishedEbonyMat);
    outerRimMesh.name = 'hall.rolandGP6PE.caseRim';
    outerRimMesh.position.set(0, 0.65, 0);
    outerRimMesh.castShadow = true;
    outerRimMesh.receiveShadow = true;
    pianoGroup.add(outerRimMesh);

    // Lower acoustic cabinet & downward-firing woofer enclosure beneath the rim (Y = 0.595m..0.65m)
    const bellyShape = createRolandGP6RimShape(0.024);
    const bellyGeo = new THREE.ExtrudeGeometry(bellyShape, {
      depth: 0.055,
      bevelEnabled: false,
      curveSegments: 24,
    });
    bellyGeo.rotateX(-Math.PI / 2);
    bellyGeo.computeBoundingSphere();
    const bellyMesh = new THREE.Mesh(bellyGeo, rolandPolishedEbonyMat);
    bellyMesh.name = 'hall.rolandGP6PE.bellyEnclosure';
    bellyMesh.position.set(0, 0.595, 0);
    bellyMesh.castShadow = true;
    pianoGroup.add(bellyMesh);

    // 2. Roland Piano Reality Premium Projection 5-Speaker Acoustic Baffle Deck & Champagne-Gold Trim inside the rim
    const innerShape = createRolandGP6RimShape(0.034);
    const baffleGeo = new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.045,
      bevelEnabled: false,
      curveSegments: 24,
    });
    baffleGeo.rotateX(-Math.PI / 2);
    baffleGeo.computeBoundingSphere();
    const baffleMesh = new THREE.Mesh(baffleGeo, rolandAcousticBaffleMat);
    baffleMesh.name = 'hall.rolandGP6PE.acousticBaffle';
    baffleMesh.position.set(0, 0.84, 0);
    pianoGroup.add(baffleMesh);

    const trimFrameShape = createRolandGP6RimShape(0.056);
    const trimFrameGeo = new THREE.ExtrudeGeometry(trimFrameShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 1,
      curveSegments: 24,
    });
    trimFrameGeo.rotateX(-Math.PI / 2);
    trimFrameGeo.computeBoundingSphere();
    const trimFrameMesh = tagHighLod(new THREE.Mesh(trimFrameGeo, rolandChampagneGoldMat));
    trimFrameMesh.name = 'hall.rolandGP6PE.interiorTrim';
    trimFrameMesh.position.set(0, 0.886, 0);
    pianoGroup.add(trimFrameMesh);

    // Dual top-firing spatial projection speaker grilles & acoustic diffuser louvres inside the cabinet
    const speakerSpecs = [
      [-0.31, -0.14, 0.115], // Left Bass/Spatial Cabinet Speaker
      [0.14, -0.06, 0.105],  // Right Treble/Spatial Cabinet Speaker
      [-0.14, -0.31, 0.085], // Rear Tail Spatial Speaker
    ] as const;
    for (let spkIdx = 0; spkIdx < speakerSpecs.length; spkIdx++) {
      const [sx, sz, rad] = speakerSpecs[spkIdx]!;
      const spkRing = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.CylinderGeometry(rad + 0.01, rad + 0.01, 0.006, 20)),
          rolandChampagneGoldMat
        )
      );
      spkRing.name = `hall.rolandGP6PE.speakerRing.${spkIdx + 1}`;
      spkRing.position.set(sx, 0.899, sz);
      pianoGroup.add(spkRing);

      const spkGrille = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.CylinderGeometry(rad, rad, 0.008, 20)),
          rolandSpeakerGrilleMat
        )
      );
      spkGrille.name = 'hall.rolandGP6PE.speakerGrille';
      spkGrille.position.set(sx, 0.901, sz);
      pianoGroup.add(spkGrille);
    }

    // Scarlet felt accent trim strip along the front of the inner acoustic deck
    const hitchFelt = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(1.14, 0.006, 0.022)),
        rolandRedFeltMat
      )
    );
    hitchFelt.name = 'hall.rolandGP6PE.hitchFelt';
    hitchFelt.position.set(0, 0.901, 0.12);
    pianoGroup.add(hitchFelt);

    // 3. Hinged Polished Ebony Top Lid (closed height = 0.931m, propped slightly on the short lid stick ~10° so it clears the stair soffit)
    const lidPivot = new THREE.Group();
    lidPivot.name = 'hall.rolandGP6PE.lidPivot';
    lidPivot.position.set(-0.702, 0.913, 0);
    lidPivot.rotation.z = 0.16; // Gentle ~9° chamber stick opening revealing the Piano Reality speaker deck

    const lidGeo = new THREE.ExtrudeGeometry(outerRimShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 28,
    });
    lidGeo.rotateX(-Math.PI / 2);
    lidGeo.computeBoundingSphere();
    const lidMesh = new THREE.Mesh(lidGeo, rolandPolishedEbonyMat);
    lidMesh.name = 'hall.rolandGP6PE.lid';
    lidMesh.position.set(0.702, 0, 0);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidPivot.add(lidMesh);
    pianoGroup.add(lidPivot);

    // Short brass lid prop stick on the treble side
    const propStick = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 10)),
        brassMat
      )
    );
    propStick.name = 'hall.rolandGP6PE.lidPropStick';
    propStick.position.set(0.6, 0.985, 0.04);
    propStick.rotation.z = -0.14;
    pianoGroup.add(propStick);

    // 4. Front Keybed, Cheek Blocks, PHA-50 88-Key Hybrid Keyboard, Disappearing Smart Touch Panel & Fallboard
    // Keybed spans Z = +0.16m..+0.480m (depth 0.32m), Width = 1.404m
    const keybedSlab = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.404, 0.066, 0.32)),
      rolandPolishedEbonyMat
    );
    keybedSlab.name = 'hall.rolandGP6PE.keybed';
    keybedSlab.position.set(0, 0.625, 0.32);
    keybedSlab.castShadow = true;
    keybedSlab.receiveShadow = true;
    pianoGroup.add(keybedSlab);

    // Left (Bass) and Right (Treble) Polished Ebony Cheek Blocks flanking the 88-key keyboard
    const cheekBlockGeo = createSharedGeo(new THREE.BoxGeometry(0.089, 0.12, 0.315));
    for (const signX of [-1, 1] as const) {
      const cheekBlock = new THREE.Mesh(cheekBlockGeo, rolandPolishedEbonyMat);
      cheekBlock.name = `hall.rolandGP6PE.cheekBlock.${signX < 0 ? 'bass' : 'treble'}`;
      cheekBlock.position.set(signX * (0.702 - 0.0445), 0.714, 0.318);
      cheekBlock.castShadow = true;
      pianoGroup.add(cheekBlock);
    }

    // Front keyslip rail below the keys (at Z = +0.468m..+0.480m)
    const keyslipRail = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.226, 0.03, 0.022)),
      rolandPolishedEbonyMat
    );
    keyslipRail.name = 'hall.rolandGP6PE.keyslipRail';
    keyslipRail.position.set(0, 0.668, 0.469);
    pianoGroup.add(keyslipRail);

    // 88-Key PHA-50 / Piano Reality Hybrid Keyboard Bed (1.225m wide across 52 white keys + 36 black sharps/flats)
    const whiteKeyBed = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.225, 0.024, 0.145)),
      ceramicWhiteMat
    );
    whiteKeyBed.name = 'hall.rolandGP6PE.whiteKeys';
    whiteKeyBed.position.set(0, 0.676, 0.388);
    whiteKeyBed.receiveShadow = true;
    pianoGroup.add(whiteKeyBed);

    // Scarlet keyframe felt strip behind the white keys
    const keyframeFelt = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(1.225, 0.006, 0.012)),
        rolandRedFeltMat
      )
    );
    keyframeFelt.name = 'hall.rolandGP6PE.keyframeFelt';
    keyframeFelt.position.set(0, 0.69, 0.312);
    pianoGroup.add(keyframeFelt);

    // 36 raised ebony-feel sharp/flat keys arranged in authentic 2-3 octave groupings across 7+ octaves
    const octavePattern = [1, 1, 0, 1, 1, 1, 0] as const;
    const blackKeyGeo = createSharedGeo(new THREE.BoxGeometry(0.012, 0.014, 0.092));
    let sharpIdx = 0;
    for (let wIdx = 0; wIdx < 51; wIdx++) {
      const noteInOctave = (wIdx + 5) % 7;
      if (octavePattern[noteInOctave] === 1) {
        sharpIdx++;
        const kx = -0.6 + ((wIdx + 0.5) / 52) * 1.2;
        const blackKey = tagHighLod(new THREE.Mesh(blackKeyGeo, rolandPolishedEbonyMat));
        blackKey.name = `hall.rolandGP6PE.blackKey.${sharpIdx}`;
        blackKey.position.set(kx, 0.692, 0.362);
        pianoGroup.add(blackKey);
      }
    }

    // Roland GP-6 Signature Disappearing Backlit Smart Touch Panel above the center keys
    const touchPanelBezel = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.18, 0.004, 0.036)),
        rolandTouchPanelMat
      )
    );
    touchPanelBezel.name = 'hall.rolandGP6PE.smartTouchPanel';
    touchPanelBezel.position.set(0, 0.694, 0.285);
    pianoGroup.add(touchPanelBezel);

    // Open Curved Polished Ebony Fallboard with Gold "Roland" Script Badge
    const fallboard = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.226, 0.11, 0.026)),
      rolandPolishedEbonyMat
    );
    fallboard.name = 'hall.rolandGP6PE.fallboard';
    fallboard.position.set(0, 0.738, 0.262);
    fallboard.rotation.x = -0.12;
    pianoGroup.add(fallboard);

    const rolandLogoPlaque = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.12, 0.014, 0.004)),
        rolandChampagneGoldMat
      )
    );
    rolandLogoPlaque.name = 'hall.rolandGP6PE.rolandBadge';
    rolandLogoPlaque.position.set(0, 0.738, 0.277);
    rolandLogoPlaque.rotation.x = -0.12;
    pianoGroup.add(rolandLogoPlaque);

    // Angled Polished Ebony Music Rest & Open Sheet Music Folio above the fallboard
    const musicDesk = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.72, 0.2, 0.016)),
      rolandInnerRimMat
    );
    musicDesk.name = 'hall.rolandGP6PE.musicRest';
    musicDesk.position.set(0, 0.995, 0.19);
    musicDesk.rotation.x = -0.22;
    musicDesk.castShadow = true;
    pianoGroup.add(musicDesk);

    const sheetMusicBook = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.42, 0.18, 0.008)),
        ceramicWhiteMat
      )
    );
    sheetMusicBook.name = 'hall.rolandGP6PE.sheetMusicBook';
    sheetMusicBook.position.set(0, 0.993, 0.202);
    sheetMusicBook.rotation.x = -0.22;
    pianoGroup.add(sheetMusicBook);

    // 5. 3 Roland GP-6-PE Tapered Grand Piano Legs with Brass Ferrules & Castors
    const legCapitalGeo = createSharedGeo(new THREE.BoxGeometry(0.105, 0.1, 0.105));
    const legShaftGeo = createSharedGeo(new THREE.CylinderGeometry(0.044, 0.026, 0.43, 12));
    const brassFerruleGeo = createSharedGeo(new THREE.CylinderGeometry(0.028, 0.025, 0.042, 12));
    const brassCastorGeo = createSharedGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.032, 12));
    const pianoLegCoords = [
      [-0.61, 0.24],   // Front Bass Leg
      [0.61, 0.24],    // Front Treble Leg
      [-0.15, -0.36],  // Rear Tail Leg
    ] as const;

    for (let legIdx = 0; legIdx < pianoLegCoords.length; legIdx++) {
      const [lx, lz] = pianoLegCoords[legIdx]!;
      const legCapital = new THREE.Mesh(legCapitalGeo, rolandPolishedEbonyMat);
      legCapital.name = `hall.rolandGP6PE.legCapital.${legIdx + 1}`;
      legCapital.position.set(lx, 0.56, lz);
      legCapital.castShadow = true;
      pianoGroup.add(legCapital);

      const legShaft = new THREE.Mesh(legShaftGeo, rolandPolishedEbonyMat);
      legShaft.name = 'hall.rolandGP6PE.leg';
      legShaft.position.set(lx, 0.295, lz);
      legShaft.castShadow = true;
      pianoGroup.add(legShaft);

      const brassFerrule = tagHighLod(new THREE.Mesh(brassFerruleGeo, brassMat));
      brassFerrule.name = `hall.rolandGP6PE.legFerrule.${legIdx + 1}`;
      brassFerrule.position.set(lx, 0.056, lz);
      pianoGroup.add(brassFerrule);

      const brassCastor = tagHighLod(new THREE.Mesh(brassCastorGeo, brassMat));
      brassCastor.name = `hall.rolandGP6PE.legCastor.${legIdx + 1}`;
      brassCastor.rotation.z = Math.PI / 2;
      brassCastor.position.set(lx, 0.016, lz);
      pianoGroup.add(brassCastor);
    }

    // 6. Pedal Lyre Assembly & 3 Responsive Damper Action Brass Pedals (Soft, Sostenuto, Damper)
    const lyreBox = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.23, 0.062, 0.082)),
      rolandPolishedEbonyMat
    );
    lyreBox.name = 'hall.rolandGP6PE.lyreBox';
    lyreBox.position.set(0, 0.042, 0.21);
    pianoGroup.add(lyreBox);

    const lyrePillarGeo = createSharedGeo(new THREE.CylinderGeometry(0.017, 0.015, 0.53, 10));
    const lyrePillarXs = [-0.072, 0.072] as const;
    for (let pIdx = 0; pIdx < lyrePillarXs.length; pIdx++) {
      const px = lyrePillarXs[pIdx]!;
      const lyrePillar = new THREE.Mesh(lyrePillarGeo, rolandPolishedEbonyMat);
      lyrePillar.name = `hall.rolandGP6PE.lyrePillar.${pIdx + 1}`;
      lyrePillar.position.set(px, 0.335, 0.21);
      lyrePillar.castShadow = true;
      pianoGroup.add(lyrePillar);
    }

    // Diagonal brass lyre brace rods
    const lyreRodGeo = createSharedGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.55, 8));
    const lyreRodXs = [-0.038, 0.038] as const;
    for (let rIdx = 0; rIdx < lyreRodXs.length; rIdx++) {
      const px = lyreRodXs[rIdx]!;
      const lyreRod = tagHighLod(new THREE.Mesh(lyreRodGeo, brassMat));
      lyreRod.name = `hall.rolandGP6PE.lyreRod.${rIdx + 1}`;
      lyreRod.position.set(px, 0.325, 0.1);
      lyreRod.rotation.x = 0.36;
      pianoGroup.add(lyreRod);
    }

    // 3 Brass Pedals projecting toward the pianist
    const pedalGeo = createSharedGeo(new THREE.BoxGeometry(0.023, 0.012, 0.105));
    const pedalNames = ['soft', 'sostenuto', 'damper'] as const;
    const pedalXs = [-0.066, 0, 0.066] as const;
    for (let pIdx = 0; pIdx < pedalXs.length; pIdx++) {
      const pedX = pedalXs[pIdx]!;
      const pedal = tagHighLod(new THREE.Mesh(pedalGeo, brassMat));
      pedal.name = `hall.rolandGP6PE.pedal.${pedalNames[pIdx]}`;
      pedal.position.set(pedX, 0.045, 0.275);
      pedal.rotation.x = 0.15;
      pianoGroup.add(pedal);
    }

    // 7. Matching Adjustable Polished Ebony Roland BNC-05 Artist Bench (0.56m x 0.35m x 0.48m)
    const benchGroup = new THREE.Group();
    benchGroup.name = 'hall.rolandGP6PE.bench';
    benchGroup.position.set(0, 0, 0.74);

    const benchApron = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.56, 0.062, 0.34)),
      rolandPolishedEbonyMat
    );
    benchApron.name = 'hall.rolandGP6PE.bench.apron';
    benchApron.position.set(0, 0.415, 0);
    benchApron.castShadow = true;
    benchGroup.add(benchApron);

    const benchCushion = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.57, 0.046, 0.35)),
      rolandLeatherBenchMat
    );
    benchCushion.name = 'hall.rolandGP6PE.bench.cushion';
    benchCushion.position.set(0, 0.465, 0);
    benchCushion.castShadow = true;
    benchCushion.receiveShadow = true;
    benchGroup.add(benchCushion);

    // Height adjustment knobs on both sides of the Roland bench
    const benchKnobGeo = createSharedGeo(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 12));
    const benchKnobSides = [-0.292, 0.292] as const;
    for (let kIdx = 0; kIdx < benchKnobSides.length; kIdx++) {
      const sideX = benchKnobSides[kIdx]!;
      const knob = tagHighLod(new THREE.Mesh(benchKnobGeo, rolandPolishedEbonyMat));
      knob.name = `hall.rolandGP6PE.bench.knob.${kIdx + 1}`;
      knob.rotation.z = Math.PI / 2;
      knob.position.set(sideX, 0.415, 0);
      benchGroup.add(knob);
    }

    const benchLegGeo = createSharedGeo(new THREE.CylinderGeometry(0.02, 0.014, 0.4, 10));
    const benchFerruleGeo = createSharedGeo(new THREE.CylinderGeometry(0.015, 0.014, 0.028, 10));
    const benchLegCoords = [
      [-0.245, -0.135],
      [0.245, -0.135],
      [-0.245, 0.135],
      [0.245, 0.135],
    ] as const;
    for (let lIdx = 0; lIdx < benchLegCoords.length; lIdx++) {
      const [blx, blz] = benchLegCoords[lIdx]!;
      const bLeg = new THREE.Mesh(benchLegGeo, rolandPolishedEbonyMat);
      bLeg.name = `hall.rolandGP6PE.bench.leg.${lIdx + 1}`;
      bLeg.position.set(blx, 0.2, blz);
      bLeg.castShadow = true;
      benchGroup.add(bLeg);

      const bFerrule = tagHighLod(new THREE.Mesh(benchFerruleGeo, brassMat));
      bFerrule.name = `hall.rolandGP6PE.bench.ferrule.${lIdx + 1}`;
      bFerrule.position.set(blx, 0.014, blz);
      benchGroup.add(bFerrule);
    }

    pianoGroup.add(benchGroup);
    scene.add(pianoGroup);
  }
}
