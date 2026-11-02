import * as THREE from 'three';
import type { CutawayWallDescriptor } from '../../../../../core/types/scene.ts';
import { buildMitredWallSkirtingGeometry } from '../../../../../engine/geometry/swept-moulding.ts';
import { getOrCreateCachedCanvas } from '../../../../../engine/textures/texture-registry.ts';
import type { LightGroupMap, SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildLefroyBrooksCharterhouseWc,
  buildPerrinRoweTowelRing,
  getBathroomBrassMaterials,
  getDarkOakVeneerMaterials,
  getHonedCarraraMarbleMaterial,
  getVitreousChinaMaterial,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { buildDiningRoom } from '../dining-room.ts';

const WC_ROOM_BOUNDS = {
  westWallCenterX: -12.8,
  westInnerX: -12.792,
  eastWallCenterX: -11.472,
  eastInnerX: -11.48,
  northInnerZ: -2.49,
  southWallCenterZ: -0.258,
  southInnerZ: -0.266,
  marbleThicknessM: 0.008,
  wallLiningThicknessM: 0.016,
  wallLiningSpanZ: 2.24,
  wallLiningCenterZ: -1.37,
  floorWidthM: 1.312,
  floorDepthM: 2.216,
  floorCenterX: -12.136,
  floorCenterZ: -1.375,
  eastDoorArchitraveEdgeX: -11.618,
  westDoorArchitraveEdgeX: -12.622,
} as const;

const WC_NORTH_CUTAWAY: CutawayWallDescriptor = {
  axis: 'z',
  coord: -2.64,
  minSpan: -12.81,
  maxSpan: -11.45,
  floor: 'ground',
};

const WC_VANITY_SPEC = {
  centerZ: -0.85,
  widthM: 0.62,
  carcassDepthM: 0.376,
  counterDepthM: 0.398,
  counterThicknessM: 0.028,
  counterHeightAboveFflM: 0.78,
  splashbackHeightM: 0.075,
  splashbackDepthM: 0.018,
  plinthHeightM: 0.088,
  cornerPostWidthM: 0.044,
  shakerStileWidthM: 0.046,
} as const;

const WC_VESSEL_BASIN_SPEC = {
  offsetFromWestWallM: 0.238,
  depthScaleX: 0.78,
  mixerOffsetFromWestWallM: 0.056,
  mixerHeightM: 0.238,
  spoutReachM: 0.152,
  towelRingZ: -0.4,
  towelRingHeightAboveMarbleM: 1.0,
} as const;

const WC_MIRROR_SPEC = {
  centerHeightAboveFflM: 1.6,
  halfWidthM: 0.285,
  bottomOffsetM: -0.35,
  shoulderOffsetM: 0.255,
  crownOffsetM: 0.375,
  stepWidthM: 0.056,
  stepDropM: 0.046,
} as const;

const WC_EAST_GALLERY_SPEC = {
  sconceY: 1.34,
  sconceZPositions: [-1.92, -0.78] as const,
  artworkCenterY: 1.3,
  artworkCenterZ: -1.35,
  frameWidthM: 0.58,
  frameHeightM: 0.45,
  frameDepthM: 0.026,
  mouldingWidthM: 0.032,
  brassSlipWidthM: 0.006,
} as const;

const WC_SOIL_BOXING_SPEC = {
  verticalStackSize: [0.192, 0.32] as const,
  verticalStackPosXZ: [-12.696, -1.48] as const,
  horizontalDuctSize: [0.156, 0.278, 0.42] as const,
  horizontalDuctPosXZ: [-12.714, -1.85] as const,
  capShelfSize: [0.17, 0.02, 0.426] as const,
  capShelfPosX: -12.707,
  skirtingPath: [
    [-12.792, -1.16],
    [-12.792, -1.32],
    [-12.6, -1.32],
    [-12.6, -1.64],
    [-12.636, -1.64],
    [-12.636, -2.06],
    [-12.792, -2.06],
    [-12.792, -2.482],
  ] as const,
} as const;

const WC_DOOR_COAT_PEG_SPEC = {
  muntinNodeName: 'bootLobbyCupboardDoor.muntin.upper',
  leafGroupNodeName: 'bootLobbyCupboardDoor.leafGroup',
  doorBackFaceLocalZ: -0.023,
  fallbackLocalY: 0.4,
  fallbackWorldX: -12.12,
  fallbackHeightAboveFflM: 1.42,
  fallbackWorldZ: -0.198,
} as const;

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

function createMauiCloakroomArtworkTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('maui-wc-coastal-artwork', 512, 384, (ctx) => {
    if (typeof ctx.createLinearGradient === 'function') {
      const sky = ctx.createLinearGradient(0, 0, 0, 214);
      sky.addColorStop(0.0, '#3a6a88');
      sky.addColorStop(0.36, '#76a0b2');
      sky.addColorStop(0.68, '#e3ad7c');
      sky.addColorStop(0.88, '#f3ca86');
      sky.addColorStop(1.0, '#faebc0');
      ctx.fillStyle = sky;
    } else {
      ctx.fillStyle = '#d8b084';
    }
    ctx.fillRect(0, 0, 512, 214);

    if (typeof ctx.createRadialGradient === 'function') {
      const sun = ctx.createRadialGradient(356, 158, 8, 356, 158, 138);
      sun.addColorStop(0.0, 'rgba(255, 251, 228, 0.96)');
      sun.addColorStop(0.28, 'rgba(255, 222, 146, 0.68)');
      sun.addColorStop(0.65, 'rgba(240, 162, 108, 0.24)');
      sun.addColorStop(1.0, 'rgba(240, 162, 108, 0.0)');
      ctx.fillStyle = sun;
      ctx.fillRect(190, 24, 322, 190);
    }

    for (const [cx, cy, rx, ry, col] of [
      [112, 64, 72, 15, 'rgba(255, 238, 212, 0.46)'],
      [164, 58, 48, 13, 'rgba(255, 245, 224, 0.52)'],
      [296, 52, 86, 14, 'rgba(255, 236, 208, 0.44)'],
      [428, 76, 62, 12, 'rgba(255, 226, 194, 0.38)'],
    ] as const) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant volcanic shield dome of Haleakala across Maalaea Bay
    ctx.fillStyle = '#7c7b8c';
    ctx.beginPath();
    ctx.moveTo(195, 210);
    ctx.quadraticCurveTo(286, 146, 382, 154);
    ctx.quadraticCurveTo(452, 162, 512, 198);
    ctx.lineTo(512, 212);
    ctx.closePath();
    ctx.fill();

    // Emerald fluted West Maui / Iao Valley pali ridges
    if (typeof ctx.createLinearGradient === 'function') {
      const paliGrad = ctx.createLinearGradient(0, 74, 265, 212);
      paliGrad.addColorStop(0.0, '#244739');
      paliGrad.addColorStop(0.55, '#386347');
      paliGrad.addColorStop(1.0, '#5d7e52');
      ctx.fillStyle = paliGrad;
    } else {
      ctx.fillStyle = '#386347';
    }
    ctx.beginPath();
    ctx.moveTo(0, 212);
    ctx.lineTo(0, 92);
    ctx.lineTo(44, 72);
    ctx.lineTo(86, 94);
    ctx.lineTo(132, 78);
    ctx.lineTo(178, 118);
    ctx.lineTo(226, 144);
    ctx.lineTo(286, 198);
    ctx.lineTo(312, 212);
    ctx.closePath();
    ctx.fill();

    for (const [px, py, lx, rx] of [
      [44, 72, 18, 64],
      [86, 94, 68, 108],
      [132, 78, 112, 158],
      [178, 118, 160, 206],
      [226, 144, 208, 258],
    ] as const) {
      ctx.fillStyle = 'rgba(146, 174, 96, 0.50)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo((lx + rx) * 0.5, 210);
      ctx.lineTo(rx, 210);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(20, 42, 33, 0.44)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(lx, 210);
      ctx.lineTo((lx + rx) * 0.5, 210);
      ctx.closePath();
      ctx.fill();
    }

    // Cobalt-to-turquoise Maui reef waters
    if (typeof ctx.createLinearGradient === 'function') {
      const sea = ctx.createLinearGradient(0, 208, 0, 342);
      sea.addColorStop(0.0, '#164559');
      sea.addColorStop(0.38, '#1f6f7c');
      sea.addColorStop(0.74, '#3b9692');
      sea.addColorStop(1.0, '#78c3b3');
      ctx.fillStyle = sea;
    } else {
      ctx.fillStyle = '#338890';
    }
    ctx.fillRect(0, 208, 512, 176);

    ctx.fillStyle = 'rgba(252, 224, 152, 0.36)';
    for (let i = 0; i < 11; i++) {
      const wy = 214 + i * 7.5;
      const ww = 92 - i * 5.2;
      ctx.fillRect(352 - ww * 0.5, wy, ww, 2.6);
    }

    // Sweeping golden-sand Makena / Kaanapali beach cove
    if (typeof ctx.createLinearGradient === 'function') {
      const sand = ctx.createLinearGradient(0, 276, 360, 384);
      sand.addColorStop(0.0, '#e9cf9c');
      sand.addColorStop(0.55, '#d9b57c');
      sand.addColorStop(1.0, '#ba915b');
      ctx.fillStyle = sand;
    } else {
      ctx.fillStyle = '#dec08c';
    }
    ctx.beginPath();
    ctx.moveTo(0, 268);
    ctx.quadraticCurveTo(148, 282, 256, 326);
    ctx.quadraticCurveTo(344, 360, 468, 384);
    ctx.lineTo(0, 384);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(250, 250, 244, 0.85)';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(4, 265);
    ctx.quadraticCurveTo(154, 279, 262, 323);
    ctx.quadraticCurveTo(350, 357, 474, 382);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(250, 250, 244, 0.48)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(26, 254);
    ctx.quadraticCurveTo(176, 269, 288, 312);
    ctx.quadraticCurveTo(376, 344, 496, 368);
    ctx.stroke();

    // Volcanic headland & coconut palm silhouettes
    ctx.fillStyle = '#243529';
    ctx.beginPath();
    ctx.moveTo(0, 294);
    ctx.quadraticCurveTo(64, 284, 118, 304);
    ctx.lineTo(0, 324);
    ctx.closePath();
    ctx.fill();

    for (const [bx, by, tx, ty, cx, cy, frondR] of [
      [48, 298, 96, 134, 62, 210, 42],
      [74, 302, 134, 168, 96, 232, 34],
    ] as const) {
      ctx.strokeStyle = '#26211c';
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(cx, cy, tx, ty);
      ctx.stroke();

      ctx.strokeStyle = '#1f3b28';
      ctx.lineWidth = 3.2;
      for (const ang of [-2.55, -2.05, -1.45, -0.75, -0.22, 0.35, 0.82] as const) {
        const ex = tx + Math.cos(ang) * frondR;
        const ey = ty + Math.sin(ang) * frondR * 0.72 + 12;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(
          tx + Math.cos(ang) * frondR * 0.55,
          ty + Math.sin(ang) * frondR * 0.42 - 6,
          ex,
          ey
        );
        ctx.stroke();
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createMauiPassepartoutTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('maui-wc-passepartout', 512, 400, (ctx) => {
    ctx.fillStyle = '#f3eee3';
    ctx.fillRect(0, 0, 512, 400);

    ctx.strokeStyle = '#c8bda6';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(48, 42, 416, 296);

    ctx.strokeStyle = '#b59a63';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(42, 36, 428, 308);

    if (typeof ctx.fillText === 'function') {
      ctx.fillStyle = '#5c5549';
      ctx.font = '600 15px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('M A U I', 256, 369);
      ctx.fillStyle = '#867e70';
      ctx.font = '10px Georgia, serif';
      ctx.fillText('ʻĪAO VALLEY & MAKENA COVE', 256, 385);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCloakroomMarbleFloorMaterial(): THREE.MeshStandardMaterial {
  const marbleCanvas = getOrCreateCachedCanvas('cloakroom-wc-carrara-floor', 512, 512, (mCtx) => {
    mCtx.fillStyle = '#cbc4b8';
    mCtx.fillRect(0, 0, 512, 512);

    if (typeof mCtx.createRadialGradient === 'function') {
      for (const [cx, cy, r, alpha] of [
        [120, 140, 160, 0.08],
        [360, 220, 180, 0.07],
        [220, 400, 150, 0.08],
      ] as const) {
        const grad = mCtx.createRadialGradient(cx, cy, 10, cx, cy, r);
        grad.addColorStop(0, `rgba(115, 118, 122, ${alpha})`);
        grad.addColorStop(1, 'rgba(203, 196, 184, 0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, 512, 512);
      }
    }

    mCtx.strokeStyle = 'rgba(105, 110, 116, 0.36)';
    mCtx.lineWidth = 2.2;
    for (let v = 0; v < 7; v++) {
      mCtx.beginPath();
      const startX = (v * 83) % 512;
      mCtx.moveTo(startX, 0);
      mCtx.bezierCurveTo(
        (startX + 90) % 512,
        170,
        (startX + 40) % 512,
        340,
        (startX + 140) % 512,
        512
      );
      mCtx.stroke();
    }

    mCtx.strokeStyle = 'rgba(140, 135, 127, 0.58)';
    mCtx.lineWidth = 2;
    for (const g of [128, 256, 384] as const) {
      mCtx.beginPath();
      mCtx.moveTo(g, 0);
      mCtx.lineTo(g, 512);
      mCtx.moveTo(0, g);
      mCtx.lineTo(512, g);
      mCtx.stroke();
    }
  });

  const wcMarbleTex = new THREE.CanvasTexture(marbleCanvas);
  wcMarbleTex.colorSpace = THREE.SRGBColorSpace;
  wcMarbleTex.wrapS = THREE.RepeatWrapping;
  wcMarbleTex.wrapT = THREE.RepeatWrapping;
  wcMarbleTex.repeat.set(1.5, 2.5);

  return new THREE.MeshStandardMaterial({
    map: wcMarbleTex,
    roughness: 0.44,
    metalness: 0.03,
  });
}

function buildCloakroomFloorAndWallLinings(
  wcGroup: THREE.Group,
  wcDarkWallMat: THREE.Material,
  dims: {
    readonly lowerFloorY: number;
    readonly lowerWallH: number;
    readonly lowerWallMidY: number;
    readonly lowerDoorLintelH: number;
    readonly lowerDoorLintelY: number;
    readonly wallH: number;
    readonly tagCutawayWall: (obj: THREE.Object3D, descriptor: CutawayWallDescriptor) => void;
  }
): void {
  const {
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    lowerDoorLintelH,
    lowerDoorLintelY,
    wallH,
    tagCutawayWall,
  } = dims;

  // Honed Carrara marble floor slab (exact node name referenced by ufh-system.ts)
  const wcMarbleFloor = new THREE.Mesh(
    createSharedGeo(
      new THREE.BoxGeometry(
        WC_ROOM_BOUNDS.floorWidthM,
        WC_ROOM_BOUNDS.marbleThicknessM,
        WC_ROOM_BOUNDS.floorDepthM
      )
    ),
    createCloakroomMarbleFloorMaterial()
  );
  wcMarbleFloor.name = 'bootLobby.downstairsWc.marbleFloor';
  wcMarbleFloor.position.set(
    WC_ROOM_BOUNDS.floorCenterX,
    lowerFloorY + WC_ROOM_BOUNDS.marbleThicknessM * 0.5,
    WC_ROOM_BOUNDS.floorCenterZ
  );
  wcMarbleFloor.receiveShadow = true;
  wcGroup.add(wcMarbleFloor);

  const wcSideWallGeo = createSharedGeo(
    new THREE.BoxGeometry(
      WC_ROOM_BOUNDS.wallLiningThicknessM,
      lowerWallH,
      WC_ROOM_BOUNDS.wallLiningSpanZ
    )
  );

  const wcWestDarkWall = new THREE.Mesh(wcSideWallGeo, wcDarkWallMat);
  wcWestDarkWall.name = 'bootLobby.downstairsWc.westWall';
  wcWestDarkWall.position.set(
    WC_ROOM_BOUNDS.westWallCenterX,
    lowerWallMidY,
    WC_ROOM_BOUNDS.wallLiningCenterZ
  );
  wcWestDarkWall.receiveShadow = true;
  wcGroup.add(wcWestDarkWall);

  const wcEastDarkWall = new THREE.Mesh(wcSideWallGeo, wcDarkWallMat);
  wcEastDarkWall.name = 'bootLobby.downstairsWc.eastWall';
  wcEastDarkWall.position.set(
    WC_ROOM_BOUNDS.eastWallCenterX,
    lowerWallMidY,
    WC_ROOM_BOUNDS.wallLiningCenterZ
  );
  wcEastDarkWall.receiveShadow = true;
  wcGroup.add(wcEastDarkWall);

  for (const [sx, sw, pierTag] of [
    [-12.67, 0.26, 'westPier'],
    [-11.585, 0.23, 'eastPier'],
  ] as const) {
    const southPierLining = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(sw, lowerWallH, WC_ROOM_BOUNDS.wallLiningThicknessM)),
      wcDarkWallMat
    );
    southPierLining.name = `bootLobby.downstairsWc.southWall.${pierTag}`;
    southPierLining.position.set(sx, lowerWallMidY, WC_ROOM_BOUNDS.southWallCenterZ);
    southPierLining.receiveShadow = true;
    wcGroup.add(southPierLining);
  }

  const wcSouthDoorHeaderLining = new THREE.Mesh(
    createSharedGeo(
      new THREE.BoxGeometry(0.84, lowerDoorLintelH, WC_ROOM_BOUNDS.wallLiningThicknessM)
    ),
    wcDarkWallMat
  );
  wcSouthDoorHeaderLining.name = 'bootLobby.downstairsWc.southWall.doorHeader';
  wcSouthDoorHeaderLining.position.set(-12.12, lowerDoorLintelY, WC_ROOM_BOUNDS.southWallCenterZ);
  wcGroup.add(wcSouthDoorHeaderLining);

  const northSkirtTopY = lowerFloorY + 0.15;
  const northLiningSpecs = [
    [-12.5635, (northSkirtTopY + wallH) / 2, 0.457, wallH - northSkirtTopY, 'westPier'],
    [-11.7125, (northSkirtTopY + wallH) / 2, 0.465, wallH - northSkirtTopY, 'eastPier'],
    [-12.14, (northSkirtTopY + 0.86) / 2, 0.39, 0.86 - northSkirtTopY, 'spandrelLower'],
    [-12.14, (1.6 + wallH) / 2, 0.39, wallH - 1.6, 'spandrelUpper'],
  ] as const;
  for (const [nx, ny, nw, nh, nTag] of northLiningSpecs) {
    const northLining = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(nw, nh, WC_ROOM_BOUNDS.wallLiningThicknessM)),
      wcDarkWallMat
    );
    northLining.name = `bootLobby.downstairsWc.northWall.${nTag}`;
    northLining.position.set(nx, ny, WC_ROOM_BOUNDS.northInnerZ);
    northLining.receiveShadow = true;
    tagCutawayWall(northLining, WC_NORTH_CUTAWAY);
    wcGroup.add(northLining);
  }
}

function buildCloakroomShakerVanity(
  wcGroup: THREE.Group,
  lowerFloorY: number,
  marbleTopY: number,
  sbBrass: ReturnType<typeof getBathroomBrassMaterials>
): number {
  const darkOak = getDarkOakVeneerMaterials();
  const honedCarraraMat = getHonedCarraraMarbleMaterial();

  const { westInnerX } = WC_ROOM_BOUNDS;
  const {
    centerZ: vanityZ,
    widthM: vanityW,
    carcassDepthM: carcassD,
    counterDepthM: counterD,
    counterThicknessM: counterThick,
    counterHeightAboveFflM,
    splashbackHeightM: splashH,
    splashbackDepthM: splashD,
    plinthHeightM: plinthH,
    cornerPostWidthM: legW,
    shakerStileWidthM: shakerStile,
  } = WC_VANITY_SPEC;

  const counterTopY = lowerFloorY + counterHeightAboveFflM;
  const counterBotY = counterTopY - counterThick;
  const carcassH = counterBotY - (marbleTopY + plinthH);
  const frontFaceX = westInnerX + carcassD;

  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'bootLobby.downstairsWc.cloakroomVanity';

  const legGeo = createSharedGeo(new THREE.BoxGeometry(legW, plinthH + carcassH, legW));
  for (const xOff of [legW * 0.5, carcassD - legW * 0.5] as const) {
    for (const zSign of [-1, 1] as const) {
      const leg = new THREE.Mesh(legGeo, darkOak.veneer);
      leg.name = 'bootLobby.downstairsWc.cloakroomVanity.cornerPost';
      leg.position.set(
        westInnerX + xOff,
        marbleTopY + (plinthH + carcassH) * 0.5,
        vanityZ + zSign * (vanityW * 0.5 - legW * 0.5)
      );
      leg.castShadow = true;
      leg.receiveShadow = true;
      vanityGroup.add(leg);
    }
  }

  const recessedToeKick = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(carcassD - 0.036, plinthH, vanityW - legW * 2)),
    darkOak.shadowReveal
  );
  recessedToeKick.name = 'bootLobby.downstairsWc.cloakroomVanity.plinth';
  recessedToeKick.position.set(
    westInnerX + (carcassD - 0.036) * 0.5,
    marbleTopY + plinthH * 0.5,
    vanityZ
  );
  recessedToeKick.receiveShadow = true;
  vanityGroup.add(recessedToeKick);

  const carcassBody = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(carcassD - 0.018, carcassH, vanityW - 0.016)),
    darkOak.veneer
  );
  carcassBody.name = 'bootLobby.downstairsWc.cloakroomVanity.carcass';
  carcassBody.position.set(
    westInnerX + (carcassD - 0.018) * 0.5,
    marbleTopY + plinthH + carcassH * 0.5,
    vanityZ
  );
  carcassBody.castShadow = true;
  carcassBody.receiveShadow = true;
  vanityGroup.add(carcassBody);

  for (const [railId, ry, rh] of [
    ['bottomRail', marbleTopY + plinthH + 0.022, 0.044],
    ['topRail', counterBotY - 0.024, 0.048],
  ] as const) {
    const fRail = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.022, rh, vanityW - legW * 2)),
      darkOak.veneer
    );
    fRail.name = `bootLobby.downstairsWc.cloakroomVanity.${railId}`;
    fRail.position.set(frontFaceX - 0.011, ry, vanityZ);
    fRail.castShadow = true;
    vanityGroup.add(fRail);
  }

  const endPanelGeo = createSharedGeo(
    new THREE.BoxGeometry(carcassD - legW * 2, carcassH - 0.09, 0.012)
  );
  for (const [endSide, zSign] of [
    ['northPanel', -1],
    ['southPanel', 1],
  ] as const) {
    const endRecess = new THREE.Mesh(endPanelGeo, darkOak.panelField);
    endRecess.name = `bootLobby.downstairsWc.cloakroomVanity.${endSide}`;
    endRecess.position.set(
      westInnerX + carcassD * 0.5,
      marbleTopY + plinthH + carcassH * 0.5,
      vanityZ + zSign * (vanityW * 0.5 - 0.014)
    );
    vanityGroup.add(endRecess);
  }

  const doorOpenH = carcassH - 0.096;
  const doorMidY = marbleTopY + plinthH + 0.044 + doorOpenH * 0.5;
  const singleDoorW = (vanityW - legW * 2 - 0.012) * 0.5;
  const doorPanelGeo = createSharedGeo(
    new THREE.BoxGeometry(0.014, doorOpenH - 0.008, singleDoorW - 0.006)
  );
  const doorRailGeo = createSharedGeo(
    new THREE.BoxGeometry(0.018, shakerStile, singleDoorW - 0.004)
  );
  const doorStileGeo = createSharedGeo(
    new THREE.BoxGeometry(0.018, doorOpenH - shakerStile * 2, shakerStile)
  );
  const knobRoseGeo = createSharedGeo(new THREE.CylinderGeometry(0.013, 0.014, 0.005, 16));
  const knobHeadGeo = createSharedGeo(new THREE.SphereGeometry(0.014, 16, 12));

  for (const [dIdx, zSign] of [
    [0, -1],
    [1, 1],
  ] as const) {
    const doorCz = vanityZ + zSign * (singleDoorW * 0.5 + 0.003);

    const doorPanel = new THREE.Mesh(doorPanelGeo, darkOak.panelField);
    doorPanel.name = `bootLobby.downstairsWc.cloakroomVanity.door.${dIdx}.panel`;
    doorPanel.position.set(frontFaceX - 0.014, doorMidY, doorCz);
    doorPanel.receiveShadow = true;
    vanityGroup.add(doorPanel);

    for (const rSign of [-1, 1] as const) {
      const dRail = new THREE.Mesh(doorRailGeo, darkOak.veneer);
      dRail.name = `bootLobby.downstairsWc.cloakroomVanity.door.${dIdx}.rail`;
      dRail.position.set(
        frontFaceX - 0.007,
        doorMidY + rSign * (doorOpenH * 0.5 - shakerStile * 0.5),
        doorCz
      );
      dRail.castShadow = true;
      vanityGroup.add(dRail);
    }

    for (const sSign of [-1, 1] as const) {
      const dStile = new THREE.Mesh(doorStileGeo, darkOak.veneer);
      dStile.name = `bootLobby.downstairsWc.cloakroomVanity.door.${dIdx}.stile`;
      dStile.position.set(
        frontFaceX - 0.007,
        doorMidY,
        doorCz + sSign * (singleDoorW * 0.5 - shakerStile * 0.5 - 0.002)
      );
      dStile.castShadow = true;
      vanityGroup.add(dStile);
    }

    const knobZ = vanityZ + zSign * 0.034;
    const knobY = doorMidY + doorOpenH * 0.24;
    const knobRose = tagHighLod(new THREE.Mesh(knobRoseGeo, sbBrass.primary));
    knobRose.name = `bootLobby.downstairsWc.cloakroomVanity.knob.${dIdx}.rose`;
    knobRose.rotation.z = Math.PI / 2;
    knobRose.position.set(frontFaceX + 0.004, knobY, knobZ);
    vanityGroup.add(knobRose);

    const knobHead = tagHighLod(new THREE.Mesh(knobHeadGeo, sbBrass.primary));
    knobHead.name = `bootLobby.downstairsWc.cloakroomVanity.knob.${dIdx}`;
    knobHead.scale.set(0.76, 1, 1);
    knobHead.position.set(frontFaceX + 0.018, knobY, knobZ);
    vanityGroup.add(knobHead);
  }

  const marbleCounter = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(counterD, counterThick - 0.006, vanityW + 0.024)),
    honedCarraraMat
  );
  marbleCounter.name = 'bootLobby.downstairsWc.cloakroomVanity.countertop';
  marbleCounter.position.set(
    westInnerX + counterD * 0.5,
    counterBotY + (counterThick - 0.006) * 0.5,
    vanityZ
  );
  marbleCounter.castShadow = true;
  marbleCounter.receiveShadow = true;
  vanityGroup.add(marbleCounter);

  const marbleCounterCrown = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(counterD - 0.006, 0.006, vanityW + 0.018)),
    honedCarraraMat
  );
  marbleCounterCrown.name = 'bootLobby.downstairsWc.cloakroomVanity.countertopCrown';
  marbleCounterCrown.position.set(
    westInnerX + (counterD - 0.006) * 0.5,
    counterTopY - 0.003,
    vanityZ
  );
  marbleCounterCrown.receiveShadow = true;
  vanityGroup.add(marbleCounterCrown);

  const marbleSplashback = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(splashD, splashH, vanityW + 0.018)),
    honedCarraraMat
  );
  marbleSplashback.name = 'bootLobby.downstairsWc.cloakroomVanity.splashback';
  marbleSplashback.position.set(
    westInnerX + splashD * 0.5,
    counterTopY + splashH * 0.5,
    vanityZ
  );
  marbleSplashback.castShadow = true;
  marbleSplashback.receiveShadow = true;
  vanityGroup.add(marbleSplashback);

  wcGroup.add(vanityGroup);
  return counterTopY;
}

function buildCloakroomVesselBasinAndMixer(
  wcGroup: THREE.Group,
  counterTopY: number,
  marbleTopY: number,
  sbBrass: ReturnType<typeof getBathroomBrassMaterials>
): void {
  const vitreousChinaMat = getVitreousChinaMaterial();
  const { westInnerX } = WC_ROOM_BOUNDS;
  const { centerZ: vanityZ } = WC_VANITY_SPEC;
  const {
    offsetFromWestWallM,
    depthScaleX,
    mixerOffsetFromWestWallM,
    mixerHeightM: mixerH,
    spoutReachM: spoutReach,
    towelRingZ,
    towelRingHeightAboveMarbleM,
  } = WC_VESSEL_BASIN_SPEC;

  const vesselGroup = new THREE.Group();
  vesselGroup.name = 'bootLobby.downstairsWc.cloakroomWashstand';
  const vesselCx = westInnerX + offsetFromWestWallM;
  const vesselProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.128, 0.0),
    new THREE.Vector2(0.156, 0.018),
    new THREE.Vector2(0.178, 0.052),
    new THREE.Vector2(0.19, 0.096),
    new THREE.Vector2(0.191, 0.126),
    new THREE.Vector2(0.186, 0.13),
    new THREE.Vector2(0.18, 0.126),
    new THREE.Vector2(0.168, 0.088),
    new THREE.Vector2(0.144, 0.044),
    new THREE.Vector2(0.098, 0.02),
    new THREE.Vector2(0.032, 0.015),
    new THREE.Vector2(0.0, 0.015),
  ];
  const vesselBowl = new THREE.Mesh(
    createSharedGeo(new THREE.LatheGeometry(vesselProfile, 40)),
    vitreousChinaMat
  );
  vesselBowl.name = 'bootLobby.downstairsWc.cloakroomWashstand.vesselBowl';
  vesselBowl.scale.set(depthScaleX, 1.0, 1.0);
  vesselBowl.position.set(vesselCx, counterTopY, vanityZ);
  vesselBowl.castShadow = true;
  vesselBowl.receiveShadow = true;
  vesselGroup.add(vesselBowl);

  const basinWasteFlange = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.028, 0.024, 0.005, 20)), sbBrass.primary)
  );
  basinWasteFlange.name = 'bootLobby.downstairsWc.cloakroomWashstand.waste6800SB';
  basinWasteFlange.position.set(vesselCx, counterTopY + 0.017, vanityZ);
  vesselGroup.add(basinWasteFlange);

  const basinWastePlug = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.019, 0.019, 0.004, 18)), sbBrass.primary)
  );
  basinWastePlug.name = 'bootLobby.downstairsWc.cloakroomWashstand.wastePlug';
  basinWastePlug.position.set(vesselCx, counterTopY + 0.0205, vanityZ);
  vesselGroup.add(basinWastePlug);
  wcGroup.add(vesselGroup);

  // Perrin & Rowe `Armstrong` (`3602SB`) tall vessel monobloc mixer
  const mixerGroup = new THREE.Group();
  mixerGroup.name = 'bootLobby.downstairsWc.basinMixer';
  const mixerX = westInnerX + mixerOffsetFromWestWallM;

  const mixerBaseEscutcheon = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.026, 0.028, 0.012, 24)), sbBrass.primary)
  );
  mixerBaseEscutcheon.name = 'bootLobby.downstairsWc.basinMixer.baseEscutcheon';
  mixerBaseEscutcheon.position.set(mixerX, counterTopY + 0.006, vanityZ);
  mixerGroup.add(mixerBaseEscutcheon);

  for (const [collarId, cy, cr, ch] of [
    ['lowerKnurledCollar', counterTopY + 0.02, 0.023, 0.016],
    ['upperKnurledCollar', counterTopY + mixerH - 0.032, 0.022, 0.016],
  ] as const) {
    const collar = tagHighLod(
      new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(cr, cr, ch, 24)), sbBrass.knurled)
    );
    collar.name = `bootLobby.downstairsWc.basinMixer.${collarId}`;
    collar.position.set(mixerX, cy, vanityZ);
    mixerGroup.add(collar);
  }

  const mixerPillar = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.02, 0.021, mixerH, 24)),
    sbBrass.primary
  );
  mixerPillar.name = 'bootLobby.downstairsWc.basinMixer.pillar';
  mixerPillar.position.set(mixerX, counterTopY + mixerH * 0.5, vanityZ);
  mixerPillar.castShadow = true;
  mixerGroup.add(mixerPillar);

  const mixerCap = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.019, 0.021, 0.01, 24)), sbBrass.primary)
  );
  mixerCap.name = 'bootLobby.downstairsWc.basinMixer.topCap';
  mixerCap.position.set(mixerX, counterTopY + mixerH + 0.005, vanityZ);
  mixerGroup.add(mixerCap);

  const spoutY = counterTopY + mixerH - 0.032;
  const spoutArm = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.012, 0.013, spoutReach, 18)),
    sbBrass.primary
  );
  spoutArm.name = 'bootLobby.downstairsWc.basinMixer.spout';
  spoutArm.rotation.z = Math.PI / 2 - 0.08;
  spoutArm.position.set(mixerX + spoutReach * 0.5, spoutY + 0.006, vanityZ);
  spoutArm.castShadow = true;
  mixerGroup.add(spoutArm);

  const spoutNozzle = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.0125, 0.0115, 0.03, 18)), sbBrass.knurled)
  );
  spoutNozzle.name = 'bootLobby.downstairsWc.basinMixer.aerator';
  spoutNozzle.position.set(mixerX + spoutReach - 0.004, spoutY - 0.004, vanityZ);
  mixerGroup.add(spoutNozzle);

  const sideHub = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.026, 16)), sbBrass.primary)
  );
  sideHub.name = 'bootLobby.downstairsWc.basinMixer.leverHub';
  sideHub.rotation.x = Math.PI / 2;
  sideHub.position.set(mixerX, counterTopY + mixerH - 0.068, vanityZ + 0.026);
  mixerGroup.add(sideHub);

  const sideLever = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.0055, 0.0065, 0.072, 12)), sbBrass.primary)
  );
  sideLever.name = 'bootLobby.downstairsWc.basinMixer.leverHandle';
  sideLever.rotation.z = -0.22;
  sideLever.position.set(mixerX + 0.008, counterTopY + mixerH - 0.034, vanityZ + 0.036);
  mixerGroup.add(sideLever);

  const leverPorcelainTip = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.0065, 0.0065, 0.022, 12)), vitreousChinaMat)
  );
  leverPorcelainTip.name = 'bootLobby.downstairsWc.basinMixer.porcelainIndice';
  leverPorcelainTip.rotation.z = -0.22;
  leverPorcelainTip.position.set(mixerX + 0.015, counterTopY + mixerH - 0.004, vanityZ + 0.036);
  mixerGroup.add(leverPorcelainTip);
  wcGroup.add(mixerGroup);

  const towelRing = buildPerrinRoweTowelRing({
    namePrefix: 'bootLobby.downstairsWc.towelRing',
    finish: 'SB',
    style: 'armstrong',
  });
  towelRing.position.set(westInnerX, marbleTopY + towelRingHeightAboveMarbleM, towelRingZ);
  towelRing.rotation.y = wallFacingToRotY('east');
  wcGroup.add(towelRing);
}

function buildCloakroomHeritageMirror(
  wcGroup: THREE.Group,
  lightGroups: LightGroupMap,
  lowerFloorY: number,
  sbBrass: ReturnType<typeof getBathroomBrassMaterials>
): void {
  const darkOak = getDarkOakVeneerMaterials();
  const { westInnerX } = WC_ROOM_BOUNDS;
  const { centerZ: vanityZ } = WC_VANITY_SPEC;
  const {
    centerHeightAboveFflM,
    halfWidthM: mirrorHalfW,
    bottomOffsetM: mirrorBotOff,
    shoulderOffsetM: mirrorShoulderOff,
    crownOffsetM: mirrorCrownOff,
    stepWidthM,
    stepDropM,
  } = WC_MIRROR_SPEC;

  const wcMirrorCanvas = getOrCreateCachedCanvas('cloakroom-wc-mirror-glass', 256, 384, (wmCtx) => {
    if (typeof wmCtx.createLinearGradient === 'function') {
      const mGrad = wmCtx.createLinearGradient(0, 0, 256, 384);
      mGrad.addColorStop(0, '#eef4f7');
      mGrad.addColorStop(0.38, '#d8e3e8');
      mGrad.addColorStop(0.7, '#f7f1e6');
      mGrad.addColorStop(1, '#c5d1d8');
      wmCtx.fillStyle = mGrad;
      wmCtx.fillRect(0, 0, 256, 384);
    }
    if (typeof wmCtx.createRadialGradient === 'function') {
      for (const [gx, gy] of [
        [62, 160],
        [194, 160],
      ] as const) {
        const sGlow = wmCtx.createRadialGradient(gx, gy, 4, gx, gy, 58);
        sGlow.addColorStop(0, 'rgba(255, 244, 214, 0.85)');
        sGlow.addColorStop(0.45, 'rgba(255, 218, 158, 0.32)');
        sGlow.addColorStop(1, 'rgba(255, 218, 158, 0)');
        wmCtx.fillStyle = sGlow;
        wmCtx.fillRect(0, 0, 256, 384);
      }
    }
    wmCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    wmCtx.lineWidth = 5;
    wmCtx.strokeRect(10, 10, 236, 364);
  });

  const wcMirrorTex = new THREE.CanvasTexture(wcMirrorCanvas);
  wcMirrorTex.colorSpace = THREE.SRGBColorSpace;
  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    map: wcMirrorTex,
    emissive: 0xd8d2c6,
    emissiveMap: wcMirrorTex,
    emissiveIntensity: 0.1,
    roughness: 0.1,
    metalness: 0.24,
  });
  const mirrorBevelMat = new THREE.MeshStandardMaterial({
    color: 0xdde7ec,
    roughness: 0.08,
    metalness: 0.32,
  });

  const mirrorCenterY = lowerFloorY + centerHeightAboveFflM;

  const buildHeritageMirrorContour = (inset: number): THREE.Shape => {
    const hw = mirrorHalfW - inset;
    const bot = mirrorBotOff + inset;
    const shY = mirrorShoulderOff - inset * 0.45;
    const crownY = mirrorCrownOff - inset;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, bot);
    shape.lineTo(hw, bot);
    shape.lineTo(hw, shY);
    shape.quadraticCurveTo(hw - stepWidthM * 0.18, shY + stepDropM * 0.85, hw - stepWidthM, shY + stepDropM);
    shape.quadraticCurveTo(0, crownY + 0.038, -hw + stepWidthM, shY + stepDropM);
    shape.quadraticCurveTo(-hw + stepWidthM * 0.18, shY + stepDropM * 0.85, -hw, shY);
    shape.closePath();
    return shape;
  };

  const buildHeritageMirrorHole = (inset: number): THREE.Path => {
    const pts = buildHeritageMirrorContour(inset).getPoints(40);
    const hole = new THREE.Path();
    if (pts.length > 0) {
      hole.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        hole.lineTo(pts[i]!.x, pts[i]!.y);
      }
      hole.closePath();
    }
    return hole;
  };

  const mirrorFrameGroup = new THREE.Group();
  mirrorFrameGroup.name = 'bootLobby.downstairsWc.mirrorFrame';
  mirrorFrameGroup.position.set(westInnerX + 0.012, mirrorCenterY, vanityZ);
  mirrorFrameGroup.rotation.y = Math.PI / 2;

  const outerFrameShape = buildHeritageMirrorContour(0);
  outerFrameShape.holes.push(buildHeritageMirrorHole(0.032));
  const outerFrameMesh = new THREE.Mesh(
    createSharedGeo(
      new THREE.ExtrudeGeometry(outerFrameShape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 3,
        curveSegments: 28,
      })
    ),
    sbBrass.primary
  );
  outerFrameMesh.name = 'bootLobby.downstairsWc.mirrorFrame.outerMoulding';
  outerFrameMesh.castShadow = true;
  outerFrameMesh.receiveShadow = true;
  mirrorFrameGroup.add(outerFrameMesh);

  const innerBeadShape = buildHeritageMirrorContour(0.026);
  innerBeadShape.holes.push(buildHeritageMirrorHole(0.04));
  const innerBeadMesh = new THREE.Mesh(
    createSharedGeo(
      new THREE.ExtrudeGeometry(innerBeadShape, {
        depth: 0.027,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.0025,
        bevelSegments: 2,
        curveSegments: 28,
      })
    ),
    sbBrass.knurled
  );
  innerBeadMesh.name = 'bootLobby.downstairsWc.mirrorFrame.beadedFillet';
  innerBeadMesh.castShadow = true;
  mirrorFrameGroup.add(innerBeadMesh);

  const mirrorBackBoard = new THREE.Mesh(
    createSharedGeo(new THREE.ShapeGeometry(buildHeritageMirrorContour(0.012), 28)),
    darkOak.shadowReveal
  );
  mirrorBackBoard.name = 'bootLobby.downstairsWc.mirrorFrame.backing';
  mirrorBackBoard.position.set(0, 0, 0.004);
  mirrorFrameGroup.add(mirrorBackBoard);
  wcGroup.add(mirrorFrameGroup);

  const mirrorGlassGroup = new THREE.Group();
  mirrorGlassGroup.name = 'bootLobby.downstairsWc.mirror';
  mirrorGlassGroup.position.set(westInnerX + 0.033, mirrorCenterY, vanityZ);
  mirrorGlassGroup.rotation.y = Math.PI / 2;

  const bevelBorderShape = buildHeritageMirrorContour(0.039);
  bevelBorderShape.holes.push(buildHeritageMirrorHole(0.056));
  const mirrorBevelRim = new THREE.Mesh(
    createSharedGeo(new THREE.ShapeGeometry(bevelBorderShape, 28)),
    mirrorBevelMat
  );
  mirrorBevelRim.name = 'bootLobby.downstairsWc.mirror.bevelEdge';
  mirrorGlassGroup.add(mirrorBevelRim);

  const mirrorCenterShapeGeo = createSharedGeo(
    new THREE.ShapeGeometry(buildHeritageMirrorContour(0.055), 28)
  );
  const mPos = mirrorCenterShapeGeo.attributes['position'];
  const mUv = mirrorCenterShapeGeo.attributes['uv'];
  if (mPos && mUv) {
    for (let i = 0; i < mPos.count; i++) {
      const u = (mPos.getX(i) + mirrorHalfW) / (mirrorHalfW * 2);
      const v = (mPos.getY(i) - mirrorBotOff) / (mirrorCrownOff - mirrorBotOff + 0.04);
      mUv.setXY(i, u, v);
    }
    mUv.needsUpdate = true;
  }
  const mirrorCenterPane = new THREE.Mesh(mirrorCenterShapeGeo, mirrorGlassMat);
  mirrorCenterPane.name = 'bootLobby.downstairsWc.mirror.glass';
  mirrorCenterPane.position.set(0, 0, 0.0015);
  mirrorGlassGroup.add(mirrorCenterPane);
  wcGroup.add(mirrorGlassGroup);

  const wcMirrorLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffb85c,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });
  const wcMirrorHaloMat = new THREE.MeshStandardMaterial({
    color: 0xffca7a,
    emissive: 0xffb85c,
    emissiveIntensity: 0.85,
    roughness: 0.85,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  lightGroups.cloakroomWcLights.emissives.push(wcMirrorLedMat, wcMirrorHaloMat);

  const haloContourShape = buildHeritageMirrorContour(-0.012);
  haloContourShape.holes.push(buildHeritageMirrorHole(0.025));
  const mirrorHaloRing = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.ShapeGeometry(haloContourShape, 28)), wcMirrorHaloMat)
  );
  mirrorHaloRing.name = 'bootLobby.downstairsWc.mirrorLedHalo.ring';
  mirrorHaloRing.rotation.y = Math.PI / 2;
  mirrorHaloRing.position.set(westInnerX + 0.0025, mirrorCenterY, vanityZ);
  wcGroup.add(mirrorHaloRing);

  const ledStripContour = buildHeritageMirrorContour(0.008);
  ledStripContour.holes.push(buildHeritageMirrorHole(0.022));
  const mirrorLedRing = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.ShapeGeometry(ledStripContour, 28)), wcMirrorLedMat)
  );
  mirrorLedRing.name = 'bootLobby.downstairsWc.mirrorLedStrip.ring';
  mirrorLedRing.rotation.y = Math.PI / 2;
  mirrorLedRing.position.set(westInnerX + 0.007, mirrorCenterY, vanityZ);
  wcGroup.add(mirrorLedRing);
}

function buildCloakroomEastWallSconcesAndArtwork(
  scene: THREE.Object3D,
  wcGroup: THREE.Group,
  lightGroups: LightGroupMap,
  lowerFloorY: number,
  brassMat: THREE.Material,
  sbBrass: ReturnType<typeof getBathroomBrassMaterials>
): void {
  const { eastInnerX } = WC_ROOM_BOUNDS;
  const {
    sconceY,
    sconceZPositions,
    artworkCenterY,
    artworkCenterZ,
    frameWidthM: artFrameW,
    frameHeightM: artFrameH,
    frameDepthM: artFrameD,
    mouldingWidthM: artMouldingW,
    brassSlipWidthM: slipW,
  } = WC_EAST_GALLERY_SPEC;

  const wcSconceShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffb85c,
    emissiveIntensity: 1.05,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  wcSconceShadeMat.userData.baseEmissiveIntensity = 1.05;
  const wcSconceBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff9eb,
    emissive: 0xffc470,
    emissiveIntensity: 1.4,
    roughness: 0.15,
  });
  wcSconceBulbMat.userData.baseEmissiveIntensity = 1.4;
  lightGroups.cloakroomWcLights.emissives.push(wcSconceShadeMat, wcSconceBulbMat);

  const wcFillLight = new THREE.PointLight(0xffcf94, 3.2, 3.4, 1.8);
  wcFillLight.userData.baseIntensity = 3.2;
  wcFillLight.position.set(-11.78, lowerFloorY + 1.52, artworkCenterZ);
  scene.add(wcFillLight);
  lightGroups.cloakroomWcLights.lights.push(wcFillLight);

  const sconceBackplateGeo = createSharedGeo(new THREE.CylinderGeometry(0.052, 0.056, 0.014, 18));
  const sconceArmGeo = createSharedGeo(new THREE.CylinderGeometry(0.008, 0.009, 0.095, 12));
  const sconceRiserGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.011, 0.045, 14));
  const sconceShadeGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.044, 0.036, 0.145, 18, 1, true)
  );
  const sconceBulbGeo = createSharedGeo(new THREE.SphereGeometry(0.02, 12, 12));

  sconceZPositions.forEach((sconceZ, idx) => {
    const sIdx = idx + 1;
    const dirX = -1;
    const sconceGrp = new THREE.Group();
    sconceGrp.name = `bootLobby.downstairsWc.wallSconce.${sIdx}`;
    sconceGrp.position.set(eastInnerX, sconceY, sconceZ);

    const backplate = new THREE.Mesh(sconceBackplateGeo, brassMat);
    backplate.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.backplate`;
    backplate.rotation.z = Math.PI / 2;
    backplate.position.set(dirX * 0.007, 0, 0);
    backplate.castShadow = true;
    sconceGrp.add(backplate);

    const arm = tagHighLod(new THREE.Mesh(sconceArmGeo, brassMat));
    arm.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.arm`;
    arm.rotation.z = Math.PI / 2;
    arm.position.set(dirX * 0.052, -0.012, 0);
    sconceGrp.add(arm);

    const riser = tagHighLod(new THREE.Mesh(sconceRiserGeo, brassMat));
    riser.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.riser`;
    riser.position.set(dirX * 0.095, 0.01, 0);
    sconceGrp.add(riser);

    const shade = new THREE.Mesh(sconceShadeGeo, wcSconceShadeMat);
    shade.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.shade`;
    shade.position.set(dirX * 0.095, 0.095, 0);
    shade.castShadow = true;
    sconceGrp.add(shade);

    const bulb = tagHighLod(new THREE.Mesh(sconceBulbGeo, wcSconceBulbMat));
    bulb.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.bulb`;
    bulb.position.set(dirX * 0.095, 0.085, 0);
    sconceGrp.add(bulb);

    wcGroup.add(sconceGrp);
  });

  const mauiMountMat = new THREE.MeshStandardMaterial({
    map: createMauiPassepartoutTexture(),
    roughness: 0.82,
    metalness: 0.0,
  });
  const mauiCanvasMat = new THREE.MeshStandardMaterial({
    map: createMauiCloakroomArtworkTexture(),
    roughness: 0.58,
    metalness: 0.02,
  });
  const pictureGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.26,
    metalness: 0.0,
    transmission: 0.04,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    clearcoat: 0.18,
    clearcoatRoughness: 0.3,
  });

  const mauiArtGroup = new THREE.Group();
  mauiArtGroup.name = 'bootLobby.downstairsWc.mauiArtwork';
  mauiArtGroup.position.set(eastInnerX, artworkCenterY, artworkCenterZ);
  mauiArtGroup.rotation.y = -Math.PI / 2;

  const antiqueGoldFrameMat = new THREE.MeshStandardMaterial({
    name: 'downstairsWc.antiqueGoldPictureFrame',
    color: 0xc49c48,
    roughness: 0.28,
    metalness: 0.88,
  });
  const outerRimW = artMouldingW * 0.58;
  for (const [pieceId, px, py, pw, ph, outerPx, outerPy, outerPw, outerPh] of [
    [
      'topRail',
      0,
      artFrameH * 0.5 - artMouldingW * 0.5,
      artFrameW,
      artMouldingW,
      0,
      artFrameH * 0.5 - outerRimW * 0.5,
      artFrameW,
      outerRimW,
    ],
    [
      'bottomRail',
      0,
      -artFrameH * 0.5 + artMouldingW * 0.5,
      artFrameW,
      artMouldingW,
      0,
      -artFrameH * 0.5 + outerRimW * 0.5,
      artFrameW,
      outerRimW,
    ],
    [
      'leftStile',
      -artFrameW * 0.5 + artMouldingW * 0.5,
      0,
      artMouldingW,
      artFrameH - artMouldingW * 2,
      -artFrameW * 0.5 + outerRimW * 0.5,
      0,
      outerRimW,
      artFrameH - outerRimW * 2,
    ],
    [
      'rightStile',
      artFrameW * 0.5 - artMouldingW * 0.5,
      0,
      artMouldingW,
      artFrameH - artMouldingW * 2,
      artFrameW * 0.5 - outerRimW * 0.5,
      0,
      outerRimW,
      artFrameH - outerRimW * 2,
    ],
  ] as const) {
    const member = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(pw, ph, artFrameD * 0.78)),
      antiqueGoldFrameMat
    );
    member.name = `bootLobby.downstairsWc.mauiArtwork.${pieceId}`;
    member.position.set(px, py, artFrameD * 0.39);
    member.castShadow = true;
    member.receiveShadow = true;
    mauiArtGroup.add(member);

    const outerStep = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(outerPw, outerPh, artFrameD * 0.28)),
        antiqueGoldFrameMat
      )
    );
    outerStep.name = `bootLobby.downstairsWc.mauiArtwork.${pieceId}.steppedCrest`;
    outerStep.position.set(outerPx, outerPy, artFrameD * 0.92);
    outerStep.castShadow = true;
    mauiArtGroup.add(outerStep);
  }

  const innerArtW = artFrameW - artMouldingW * 2;
  const innerArtH = artFrameH - artMouldingW * 2;
  for (const [slipId, sx, sy, sw, sh] of [
    ['topSlip', 0, innerArtH * 0.5 - slipW * 0.5, innerArtW, slipW],
    ['bottomSlip', 0, -innerArtH * 0.5 + slipW * 0.5, innerArtW, slipW],
    ['leftSlip', -innerArtW * 0.5 + slipW * 0.5, 0, slipW, innerArtH - slipW * 2],
    ['rightSlip', innerArtW * 0.5 - slipW * 0.5, 0, slipW, innerArtH - slipW * 2],
  ] as const) {
    const slip = tagHighLod(
      new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(sw, sh, 0.022)), sbBrass.primary)
    );
    slip.name = `bootLobby.downstairsWc.mauiArtwork.${slipId}`;
    slip.position.set(sx, sy, 0.011);
    mauiArtGroup.add(slip);
  }

  const mountBoard = new THREE.Mesh(
    createSharedGeo(new THREE.PlaneGeometry(innerArtW - slipW * 2, innerArtH - slipW * 2)),
    mauiMountMat
  );
  mountBoard.name = 'bootLobby.downstairsWc.mauiArtwork.passepartout';
  mountBoard.position.set(0, 0, 0.015);
  mountBoard.receiveShadow = true;
  mauiArtGroup.add(mountBoard);

  const windowW = (innerArtW - slipW * 2) * (412 / 512);
  const windowH = (innerArtH - slipW * 2) * (292 / 400);
  const windowOffsetY = (innerArtH - slipW * 2) * ((200 - (42 + 148)) / 400);
  const mauiCanvasMesh = new THREE.Mesh(
    createSharedGeo(new THREE.PlaneGeometry(windowW, windowH)),
    mauiCanvasMat
  );
  mauiCanvasMesh.name = 'bootLobby.downstairsWc.mauiArtwork.canvas';
  mauiCanvasMesh.position.set(0, windowOffsetY, 0.0165);
  mauiArtGroup.add(mauiCanvasMesh);

  const artGlass = new THREE.Mesh(
    createSharedGeo(new THREE.PlaneGeometry(innerArtW - slipW * 2, innerArtH - slipW * 2)),
    pictureGlassMat
  );
  artGlass.name = 'bootLobby.downstairsWc.mauiArtwork.glass';
  artGlass.position.set(0, 0, 0.0195);
  mauiArtGroup.add(artGlass);

  wcGroup.add(mauiArtGroup);
}

function buildCloakroomSoilBoxingAndPerimeterSkirting(
  wcGroup: THREE.Group,
  wcDarkWallMat: THREE.Material,
  wimborneWhiteJoineryMat: THREE.Material,
  dims: {
    readonly marbleTopY: number;
    readonly lowerWallH: number;
    readonly lowerWallMidY: number;
  }
): void {
  const { marbleTopY, lowerWallH, lowerWallMidY } = dims;
  void wimborneWhiteJoineryMat;
  const wcDrenchedEggshellMat = new THREE.MeshStandardMaterial({
    name: 'downstairsWc.drenchedWoodworkEggshell',
    color: 0x253338,
    roughness: 0.36,
    metalness: 0.03,
  });

  const wastePipeBoxingGroup = new THREE.Group();
  wastePipeBoxingGroup.name = 'bootLobby.downstairsWc.wastePipeBoxing';

  const [vStackW, vStackD] = WC_SOIL_BOXING_SPEC.verticalStackSize;
  const [vStackX, vStackZ] = WC_SOIL_BOXING_SPEC.verticalStackPosXZ;
  const vertStackBoxing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(vStackW, lowerWallH - 0.008, vStackD)),
    wcDarkWallMat
  );
  vertStackBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.verticalStack';
  vertStackBoxing.position.set(vStackX, lowerWallMidY + 0.004, vStackZ);
  vertStackBoxing.castShadow = true;
  vertStackBoxing.receiveShadow = true;
  wastePipeBoxingGroup.add(vertStackBoxing);

  const [hDuctW, hDuctH, hDuctD] = WC_SOIL_BOXING_SPEC.horizontalDuctSize;
  const [hDuctX, hDuctZ] = WC_SOIL_BOXING_SPEC.horizontalDuctPosXZ;
  const horizSoilBoxing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(hDuctW, hDuctH, hDuctD)),
    wcDarkWallMat
  );
  horizSoilBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.horizontalDuct';
  horizSoilBoxing.position.set(hDuctX, marbleTopY + hDuctH * 0.5, hDuctZ);
  horizSoilBoxing.castShadow = true;
  horizSoilBoxing.receiveShadow = true;
  wastePipeBoxingGroup.add(horizSoilBoxing);

  const [capW, capH, capD] = WC_SOIL_BOXING_SPEC.capShelfSize;
  const horizBoxingCapShelf = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(capW, capH, capD)),
    wcDrenchedEggshellMat
  );
  horizBoxingCapShelf.name = 'bootLobby.downstairsWc.wastePipeBoxing.capShelf';
  horizBoxingCapShelf.position.set(
    WC_SOIL_BOXING_SPEC.capShelfPosX,
    marbleTopY + hDuctH + capH * 0.5,
    hDuctZ
  );
  horizBoxingCapShelf.castShadow = true;
  horizBoxingCapShelf.receiveShadow = true;
  wastePipeBoxingGroup.add(horizBoxingCapShelf);

  const boxSkirt = new THREE.Mesh(
    createSharedGeo(buildMitredWallSkirtingGeometry(WC_SOIL_BOXING_SPEC.skirtingPath, marbleTopY)),
    wcDrenchedEggshellMat
  );
  boxSkirt.name = 'bootLobby.downstairsWc.wastePipeBoxing.skirting';
  boxSkirt.castShadow = true;
  boxSkirt.receiveShadow = true;
  wastePipeBoxingGroup.add(boxSkirt);
  wcGroup.add(wastePipeBoxingGroup);

  const vanitySouthZ = WC_VANITY_SPEC.centerZ + WC_VANITY_SPEC.widthM * 0.5;
  const perimeterSkirtRuns: ReadonlyArray<
    readonly [string, ReadonlyArray<readonly [number, number]>]
  > = [
    [
      'bootLobby.downstairsWc.eastAndSouthPierSkirting',
      [
        [WC_ROOM_BOUNDS.eastInnerX, -2.482],
        [WC_ROOM_BOUNDS.eastInnerX, WC_ROOM_BOUNDS.southInnerZ],
        [WC_ROOM_BOUNDS.eastDoorArchitraveEdgeX, WC_ROOM_BOUNDS.southInnerZ],
      ],
    ],
    [
      'bootLobby.downstairsWc.southWestPierSkirting',
      [
        [WC_ROOM_BOUNDS.westDoorArchitraveEdgeX, WC_ROOM_BOUNDS.southInnerZ],
        [WC_ROOM_BOUNDS.westInnerX, WC_ROOM_BOUNDS.southInnerZ],
        [WC_ROOM_BOUNDS.westInnerX, vanitySouthZ],
      ],
    ],
  ];

  for (const [skirtName, path] of perimeterSkirtRuns) {
    const skirtMesh = new THREE.Mesh(
      createSharedGeo(buildMitredWallSkirtingGeometry(path, marbleTopY)),
      wcDrenchedEggshellMat
    );
    skirtMesh.name = skirtName;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    wcGroup.add(skirtMesh);
  }
}

function attachCloakroomDoorCoatPeg(
  scene: THREE.Object3D,
  wcGroup: THREE.Group,
  lowerFloorY: number
): void {
  const robeHook = buildArmstrongRobeHook({
    namePrefix: 'bootLobby.downstairsWc.robeHook',
    finish: 'SB',
  });
  const doorUpperMuntin = scene.getObjectByName(WC_DOOR_COAT_PEG_SPEC.muntinNodeName);
  const doorLeafParent =
    doorUpperMuntin?.parent ?? scene.getObjectByName(WC_DOOR_COAT_PEG_SPEC.leafGroupNodeName);
  if (doorLeafParent) {
    const pegLocalX = doorUpperMuntin ? doorUpperMuntin.position.x : 0;
    const pegLocalY = doorUpperMuntin
      ? doorUpperMuntin.position.y
      : WC_DOOR_COAT_PEG_SPEC.fallbackLocalY;
    robeHook.position.set(pegLocalX, pegLocalY, WC_DOOR_COAT_PEG_SPEC.doorBackFaceLocalZ);
    robeHook.rotation.y = wallFacingToRotY('north');
    doorLeafParent.add(robeHook);
  } else {
    robeHook.position.set(
      WC_DOOR_COAT_PEG_SPEC.fallbackWorldX,
      lowerFloorY + WC_DOOR_COAT_PEG_SPEC.fallbackHeightAboveFflM,
      WC_DOOR_COAT_PEG_SPEC.fallbackWorldZ
    );
    robeHook.rotation.y = wallFacingToRotY('north');
    wcGroup.add(robeHook);
  }
}

export type DownstairsWcAndCloakroomKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  'brassMat' | 'tagCutawayWall' | 'wallH' | 'wimborneWhiteJoineryMat'
> &
  Pick<
    ReturnType<typeof buildDiningRoom>,
    'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'
  >;

/**
 * Downstairs Cloakroom WC (`bootLobby.downstairsWc`) off the Boot Lobby:
 * honed Carrara marble floor, Farrow & Ball Hague Blue wall linings, tailored dark-stained English
 * oak Shaker vanity cabinet (`620 × 398 × 780mm`) with honed Carrara marble countertop & splashback,
 * sculpted freestanding ceramic vessel basin + Perrin & Rowe `Armstrong` Satin Brass (`SB`) tall
 * vessel mixer & waste, raised English heritage scalloped-arch beaded `SB` mirror, widened `SB`
 * sconces framing a Maui coastal artwork on the East wall, `6221SB` coat peg on the back of
 * `bootLobbyCupboardDoor`, GSI Classic Swirlflush WC, and continuous 45°-mitred `Wimborne White`
 * skirting wrapping the South doorway piers.
 */
export function buildDownstairsWcAndCloakroom(
  ctx: SceneBuilderContext,
  kit: DownstairsWcAndCloakroomKit
): void {
  const { lightGroups, scene } = ctx;
  const {
    brassMat,
    wimborneWhiteJoineryMat,
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    tagCutawayWall,
    wallH,
  } = kit;

  const marbleTopY = lowerFloorY + WC_ROOM_BOUNDS.marbleThicknessM;
  const sbBrass = getBathroomBrassMaterials('SB');
  const wcDarkWallMat = new THREE.MeshStandardMaterial({
    color: 0x253338,
    roughness: 0.6,
    metalness: 0.03,
  });

  const wcGroup = new THREE.Group();
  wcGroup.name = 'bootLobby.downstairsWc';
  wcGroup.userData.zone = 'bootLobby';

  buildCloakroomFloorAndWallLinings(wcGroup, wcDarkWallMat, {
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    lowerDoorLintelH,
    lowerDoorLintelY,
    wallH,
    tagCutawayWall,
  });

  const counterTopY = buildCloakroomShakerVanity(wcGroup, lowerFloorY, marbleTopY, sbBrass);
  buildCloakroomVesselBasinAndMixer(wcGroup, counterTopY, marbleTopY, sbBrass);
  buildCloakroomHeritageMirror(wcGroup, lightGroups, lowerFloorY, sbBrass);
  buildCloakroomEastWallSconcesAndArtwork(
    scene,
    wcGroup,
    lightGroups,
    lowerFloorY,
    brassMat,
    sbBrass
  );
  buildCloakroomSoilBoxingAndPerimeterSkirting(wcGroup, wcDarkWallMat, wimborneWhiteJoineryMat, {
    marbleTopY,
    lowerWallH,
    lowerWallMidY,
  });

  const vortexWc = buildLefroyBrooksCharterhouseWc({
    namePrefix: 'bootLobby.downstairsWc.acantoVortexWc',
    finish: 'SB',
    variant: 'closeCoupled',
    collection: 'gsiClassicSwirlflush',
    seatFinish: 'darkOak',
    leverStyle: 'armstrong',
  });
  vortexWc.position.set(WC_ROOM_BOUNDS.westInnerX, marbleTopY, -2.04);
  vortexWc.rotation.y = wallFacingToRotY('east');
  wcGroup.add(vortexWc);

  const paperHolder = buildArmstrongPaperHolder({
    namePrefix: 'bootLobby.downstairsWc.paperHolder',
    finish: 'SB',
  });
  paperHolder.position.set(-12.32, marbleTopY + 0.68, WC_ROOM_BOUNDS.northInnerZ);
  paperHolder.rotation.y = wallFacingToRotY('south');
  tagCutawayWall(paperHolder, WC_NORTH_CUTAWAY);
  paperHolder.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      tagCutawayWall(node, WC_NORTH_CUTAWAY);
    }
  });
  wcGroup.add(paperHolder);

  attachCloakroomDoorCoatPeg(scene, wcGroup, lowerFloorY);
  scene.add(wcGroup);
}
