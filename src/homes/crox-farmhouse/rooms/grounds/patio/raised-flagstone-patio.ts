import * as THREE from 'three';
import { createImperialBrickTextures } from '../../../../../engine/textures/procedural-textures.ts';
import type { PatioAndGrapeVinePergolaKit } from '../patio-and-grape-vine-pergola.ts';
import {
  type BotanicalShrubKit,
  createHerringboneBrickPatioTextures,
  createRivenYorkstonePatioTextures,
} from './patio-textures-and-shrubs.ts';

let cachedWeatheredTeakTextures: {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} | null = null;

function getWeatheredTeakBenchTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  if (cachedWeatheredTeakTextures) {
    return cachedWeatheredTeakTextures;
  }
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  cCtx.fillStyle = '#8e7b64';
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const hash = (n: number): number => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };

  for (let y = 0; y < size; y += 2) {
    const v = y / size;
    const cathedral = Math.sin(v * Math.PI * 6.0) * 8.0 + Math.cos(v * Math.PI * 14.0) * 4.5;
    for (let x = 0; x < size; x += 4) {
      const u = x / size;
      const fiber =
        Math.sin(y * 0.45 + Math.sin(u * Math.PI * 2.0) * 3.2) * 7.0 +
        (hash(x * 17 + y * 53) - 0.5) * 10.0;
      const silverPatina = Math.sin(u * Math.PI * 4.0 + v * Math.PI * 2.0) * 5.0;
      const d = Math.round(cathedral * 0.45 + fiber + silverPatina);
      const r = Math.max(96, Math.min(182, 142 + d));
      const g = Math.max(84, Math.min(166, 124 + Math.round(d * 0.92)));
      const b = Math.max(68, Math.min(148, 102 + Math.round(d * 0.85)));
      cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      cCtx.fillRect(x, y, 4, 2);

      const bv = Math.max(40, Math.min(220, Math.round(128 + fiber * 3.2 + cathedral * 1.1)));
      bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
      bCtx.fillRect(x, y, 4, 2);
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(2, 2);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  cachedWeatheredTeakTextures = { colorMap, bumpMap };
  return cachedWeatheredTeakTextures;
}

export interface LowBrickRetainingWallKit {
  readonly brickWallMat: THREE.MeshStandardMaterial;
  readonly brickSoldierCopingMat: THREE.MeshStandardMaterial;
  readonly applyCourtyardBrickUVs: (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number
  ) => THREE.BoxGeometry;
  readonly weatheredBenchMat: THREE.MeshStandardMaterial;
}

export interface RaisedFlagstonePatioKit {
  readonly yorkstonePatioTextures: {
    readonly colorMap: THREE.CanvasTexture;
    readonly bumpMap: THREE.CanvasTexture;
    readonly normalMap: THREE.CanvasTexture;
    readonly roughnessMap: THREE.CanvasTexture;
  };
  readonly rivenYorkstonePatioMat: THREE.MeshStandardMaterial;
  readonly applyPatioFlagstoneUVs: (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number,
    tileW?: number,
    tileH?: number
  ) => THREE.BoxGeometry;
  readonly zincPotMat: THREE.MeshStandardMaterial;
  readonly creamPotMat: THREE.MeshStandardMaterial;
  readonly potMat: THREE.MeshStandardMaterial;
}

export function buildLowBrickRetainingWall(
  scene: THREE.Scene,
  limestoneEdgingMat: THREE.Material
): LowBrickRetainingWallKit {
  // =========================================================================
  // 1. LOW BRICK RETAINING WALL & THRESHOLD PIERS ALONG THE KITCHEN COBBLE PATH (Z = +3.84m)
  // =========================================================================
  const courtyardBrickTextures = createImperialBrickTextures();
  const brickWallMat = new THREE.MeshStandardMaterial({
    color: 0xd8c6bc,
    map: courtyardBrickTextures.colorMap,
    bumpMap: courtyardBrickTextures.bumpMap,
    bumpScale: 0.02,
    roughnessMap: courtyardBrickTextures.roughnessMap,
    roughness: 0.9,
  });
  const brickSoldierCopingMat = new THREE.MeshStandardMaterial({
    color: 0x945743,
    map: courtyardBrickTextures.colorMap,
    bumpMap: courtyardBrickTextures.bumpMap,
    bumpScale: 0.016,
    roughnessMap: courtyardBrickTextures.roughnessMap,
    roughness: 0.86,
  });
  const blueBrickCopingMat = new THREE.MeshStandardMaterial({
    color: 0x484d56,
    roughness: 0.74,
    metalness: 0.05,
  });
  const applyCourtyardBrickUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
    const tileW = 1.35;
    const tileH = 1.2;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wy = pos.getY(i) + oy;
      const wz = pos.getZ(i) + oz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));
      if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else if (nx >= nz && nx >= ny) {
        uv.setXY(i, wz / tileW, wy / tileH);
      } else {
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  const lowBrickWallWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.58, 0.24, 0.22), -3.035, 0.11, 3.84),
    brickWallMat
  );
  if (!lowBrickWallWest.name) lowBrickWallWest.name = 'courtyard.rattanPatio.lowBrickWallWest';
  lowBrickWallWest.position.set(-3.035, 0.11, 3.84);
  lowBrickWallWest.castShadow = true;
  lowBrickWallWest.receiveShadow = true;
  scene.add(lowBrickWallWest);

  const lowBrickCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(2.58, 0.048, 0.25),
    blueBrickCopingMat
  );
  if (!lowBrickCopingWest.name) lowBrickCopingWest.name = 'courtyard.rattanPatio.lowBrickCopingWest';
  lowBrickCopingWest.position.set(-3.035, 0.258, 3.84);
  lowBrickCopingWest.castShadow = true;
  lowBrickCopingWest.receiveShadow = true;
  scene.add(lowBrickCopingWest);

  const lowBrickWallMid = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.9, 0.24, 0.22), 1.0, 0.11, 3.84),
    brickWallMat
  );
  if (!lowBrickWallMid.name) lowBrickWallMid.name = 'courtyard.rattanPatio.lowBrickWallMid';
  lowBrickWallMid.position.set(1.0, 0.11, 3.84);
  lowBrickWallMid.castShadow = true;
  lowBrickWallMid.receiveShadow = true;
  scene.add(lowBrickWallMid);

  const lowBrickCopingMid = new THREE.Mesh(
    new THREE.BoxGeometry(2.94, 0.048, 0.25),
    blueBrickCopingMat
  );
  if (!lowBrickCopingMid.name) lowBrickCopingMid.name = 'courtyard.rattanPatio.lowBrickCopingMid';
  lowBrickCopingMid.position.set(1.0, 0.258, 3.84);
  lowBrickCopingMid.castShadow = true;
  lowBrickCopingMid.receiveShadow = true;
  scene.add(lowBrickCopingMid);

  const lowBrickWallEast = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(1.5, 0.24, 0.22), 4.5, 0.11, 3.84),
    brickWallMat
  );
  if (!lowBrickWallEast.name) lowBrickWallEast.name = 'courtyard.rattanPatio.lowBrickWallEast';
  lowBrickWallEast.position.set(4.5, 0.11, 3.84);
  lowBrickWallEast.castShadow = true;
  lowBrickWallEast.receiveShadow = true;
  scene.add(lowBrickWallEast);

  const lowBrickCopingEast = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.048, 0.25),
    blueBrickCopingMat
  );
  if (!lowBrickCopingEast.name) lowBrickCopingEast.name = 'courtyard.rattanPatio.lowBrickCopingEast';
  lowBrickCopingEast.position.set(4.5, 0.258, 3.84);
  lowBrickCopingEast.castShadow = true;
  lowBrickCopingEast.receiveShadow = true;
  scene.add(lowBrickCopingEast);

  const cornerPier = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.38, 0.56, 0.38), -4.52, 0.26, 3.84),
    brickWallMat
  );
  if (!cornerPier.name) cornerPier.name = 'courtyard.rattanPatio.cornerPier';
  cornerPier.position.set(-4.52, 0.26, 3.84);
  cornerPier.castShadow = true;
  cornerPier.receiveShadow = true;
  scene.add(cornerPier);

  const cornerPierCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.07, 0.44),
    limestoneEdgingMat
  );
  if (!cornerPierCap.name) cornerPierCap.name = 'courtyard.rattanPatio.cornerPierCap';
  cornerPierCap.position.set(-4.52, 0.579, 3.84);
  cornerPierCap.castShadow = true;
  scene.add(cornerPierCap);

  const lowBrickReturnWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.22, 0.28, 3.206), -4.52, 0.08, 5.637),
    brickWallMat
  );
  if (!lowBrickReturnWest.name) lowBrickReturnWest.name = 'courtyard.rattanPatio.lowBrickReturnWest';
  lowBrickReturnWest.position.set(-4.52, 0.08, 5.637);
  lowBrickReturnWest.castShadow = true;
  lowBrickReturnWest.receiveShadow = true;
  scene.add(lowBrickReturnWest);

  const lowBrickReturnCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.048, 3.206),
    blueBrickCopingMat
  );
  if (!lowBrickReturnCopingWest.name) lowBrickReturnCopingWest.name = 'courtyard.rattanPatio.lowBrickReturnCopingWest';
  lowBrickReturnCopingWest.position.set(-4.52, 0.248, 5.637);
  lowBrickReturnCopingWest.castShadow = true;
  lowBrickReturnCopingWest.receiveShadow = true;
  scene.add(lowBrickReturnCopingWest);

  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.44,
    metalness: 0.72,
  });
  for (const railY of [0.48, 0.82]) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 3.12),
      wroughtIronMat
    );
    if (!railBar.name) railBar.name = 'courtyard.rattanPatio.railBar';
    railBar.position.set(-4.52, railY, 5.61);
    railBar.castShadow = true;
    scene.add(railBar);
  }
  for (let rz = 4.08; rz <= 7.14; rz += 0.24) {
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6),
      wroughtIronMat
    );
    if (!spindle.name) spindle.name = 'courtyard.rattanPatio.spindle';
    spindle.position.set(-4.52, 0.56, rz);
    spindle.castShadow = true;
    scene.add(spindle);
  }

  const westPatioBenchGroup = new THREE.Group();
  westPatioBenchGroup.name = 'courtyard.rattanPatioWestBench';
  westPatioBenchGroup.position.set(-4.84, -0.14, 5.45);
  westPatioBenchGroup.rotation.y = -Math.PI / 2;
  const weatheredTeakTextures = getWeatheredTeakBenchTextures();
  const weatheredBenchMat = new THREE.MeshStandardMaterial({
    color: 0x9c8870,
    map: weatheredTeakTextures.colorMap,
    bumpMap: weatheredTeakTextures.bumpMap,
    bumpScale: 0.012,
    roughness: 0.78,
    metalness: 0.03,
  });
  const benchBronzePegMat = new THREE.MeshStandardMaterial({
    color: 0x3b3024,
    roughness: 0.46,
    metalness: 0.62,
  });

  // Rounded front waterfall bullnose seat rail (`courtyard.rattanPatio.westBenchSeat`)
  const westBenchSeat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 1.14, 14),
    weatheredBenchMat
  );
  westBenchSeat.name = 'courtyard.rattanPatio.westBenchSeat';
  westBenchSeat.rotation.z = Math.PI * 0.5;
  westBenchSeat.position.set(0, 0.422, 0.228);
  westBenchSeat.castShadow = true;
  westBenchSeat.receiveShadow = true;
  westPatioBenchGroup.add(westBenchSeat);

  // 6 individual slatted seat planks (`courtyard.rattanPatio.westBenchSeat.slat.1..6`)
  for (let slatIdx = 0; slatIdx < 6; slatIdx++) {
    const slatZ = 0.194 - slatIdx * 0.072;
    const seatSlat = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.024, 0.056),
      weatheredBenchMat
    );
    seatSlat.name = `courtyard.rattanPatio.westBenchSeat.slat.${slatIdx + 1}`;
    seatSlat.position.set(0, 0.422, slatZ);
    seatSlat.castShadow = true;
    seatSlat.receiveShadow = true;
    westPatioBenchGroup.add(seatSlat);
  }

  // Front & rear seat apron rails (`westBenchSeat.frontApron`, `westBenchSeat.rearApron`)
  const frontSeatApron = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.056, 0.032),
    weatheredBenchMat
  );
  frontSeatApron.name = 'courtyard.rattanPatio.westBenchSeat.frontApron';
  frontSeatApron.position.set(0, 0.392, 0.212);
  frontSeatApron.castShadow = true;
  frontSeatApron.receiveShadow = true;
  westPatioBenchGroup.add(frontSeatApron);

  const rearSeatApron = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.056, 0.032),
    weatheredBenchMat
  );
  rearSeatApron.name = 'courtyard.rattanPatio.westBenchSeat.rearApron';
  rearSeatApron.position.set(0, 0.392, -0.192);
  rearSeatApron.castShadow = true;
  rearSeatApron.receiveShadow = true;
  westPatioBenchGroup.add(rearSeatApron);

  // 3 under-seat transverse bearer battens
  let bearerIdx = 0;
  for (const bx of [-0.51, 0, 0.51] as const) {
    const bearer = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.046, 0.4),
      weatheredBenchMat
    );
    bearer.name = `courtyard.rattanPatio.westBenchSeat.bearer.${++bearerIdx}`;
    bearer.position.set(bx, 0.394, 0.01);
    bearer.castShadow = true;
    westPatioBenchGroup.add(bearer);
  }

  // Top shaped/arched crest rail (`courtyard.rattanPatio.westBenchBack`)
  const crestShape = new THREE.Shape();
  crestShape.moveTo(-0.56, -0.034);
  crestShape.lineTo(0.56, -0.034);
  crestShape.lineTo(0.56, 0.028);
  crestShape.quadraticCurveTo(0, 0.072, -0.56, 0.028);
  crestShape.closePath();
  const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  crestGeo.translate(0, 0, -0.018);
  crestGeo.computeVertexNormals();
  const westBenchBack = new THREE.Mesh(crestGeo, weatheredBenchMat);
  westBenchBack.name = 'courtyard.rattanPatio.westBenchBack';
  westBenchBack.position.set(0, 0.805, -0.228);
  westBenchBack.rotation.x = -0.08;
  westBenchBack.castShadow = true;
  westBenchBack.receiveShadow = true;
  westPatioBenchGroup.add(westBenchBack);

  // Lower backrest rail (`courtyard.rattanPatio.westBenchBack.lowerRail`)
  const lowerBackRail = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.042, 0.034),
    weatheredBenchMat
  );
  lowerBackRail.name = 'courtyard.rattanPatio.westBenchBack.lowerRail';
  lowerBackRail.position.set(0, 0.485, -0.204);
  lowerBackRail.rotation.x = -0.08;
  lowerBackRail.castShadow = true;
  lowerBackRail.receiveShadow = true;
  westPatioBenchGroup.add(lowerBackRail);

  // 15 vertical mortised backrest spindles/slats (`courtyard.rattanPatio.westBenchBack.slat.1..15`) inclined at -0.08 rad
  for (let bSlatIdx = 0; bSlatIdx < 15; bSlatIdx++) {
    const slatX = -0.49 + (bSlatIdx / 14) * 0.98;
    const archExtraH = Math.cos((slatX / 0.56) * Math.PI * 0.5) * 0.022;
    const backSlat = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.295 + archExtraH, 0.018),
      weatheredBenchMat
    );
    backSlat.name = `courtyard.rattanPatio.westBenchBack.slat.${bSlatIdx + 1}`;
    backSlat.position.set(slatX, 0.642 + archExtraH * 0.5, -0.216);
    backSlat.rotation.x = -0.08;
    backSlat.castShadow = true;
    backSlat.receiveShadow = true;
    westPatioBenchGroup.add(backSlat);
  }

  // Corbel bracket shape for under-arm supports
  const corbelShape = new THREE.Shape();
  corbelShape.moveTo(0, 0);
  corbelShape.lineTo(0.095, 0);
  corbelShape.quadraticCurveTo(0.035, -0.032, 0, -0.095);
  corbelShape.closePath();
  const corbelGeo = new THREE.ExtrudeGeometry(corbelShape, {
    depth: 0.042,
    bevelEnabled: false,
  });
  corbelGeo.rotateY(-Math.PI * 0.5);
  corbelGeo.translate(0.021, 0, 0);
  corbelGeo.computeVertexNormals();

  // Detailed Leg & Armrest Frames (`sx = -0.57, +0.57`)
  let pegIdx = 0;
  for (const sx of [-0.57, 0.57] as const) {
    const fLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.56, 0.056),
      weatheredBenchMat
    );
    fLeg.name = 'courtyard.rattanPatio.fLeg';
    fLeg.position.set(sx, 0.28, 0.216);
    fLeg.castShadow = true;
    fLeg.receiveShadow = true;
    westPatioBenchGroup.add(fLeg);

    const rLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.85, 0.056),
      weatheredBenchMat
    );
    rLeg.name = 'courtyard.rattanPatio.rLeg';
    rLeg.position.set(sx, 0.425, -0.212);
    rLeg.rotation.x = -0.04;
    rLeg.castShadow = true;
    rLeg.receiveShadow = true;
    westPatioBenchGroup.add(rLeg);

    // Turned/rounded top finial on rear post
    const postFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.027, 12, 10),
      weatheredBenchMat
    );
    postFinial.name = 'courtyard.rattanPatio.postFinial';
    postFinial.scale.set(1.0, 1.18, 1.0);
    postFinial.position.set(sx, 0.868, -0.229);
    postFinial.castShadow = true;
    westPatioBenchGroup.add(postFinial);

    // Scrolled/shaped wide armrest (`courtyard.rattanPatio.arm`) + front scroll knuckle
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.072, 0.032, 0.48),
      weatheredBenchMat
    );
    arm.name = 'courtyard.rattanPatio.arm';
    arm.position.set(sx, 0.572, 0.01);
    arm.castShadow = true;
    arm.receiveShadow = true;
    westPatioBenchGroup.add(arm);

    const armScroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.074, 12),
      weatheredBenchMat
    );
    armScroll.name = 'courtyard.rattanPatio.armScroll';
    armScroll.rotation.z = Math.PI * 0.5;
    armScroll.position.set(sx, 0.564, 0.252);
    armScroll.castShadow = true;
    westPatioBenchGroup.add(armScroll);

    // Under-arm corbel bracket (`courtyard.rattanPatio.armBracket`)
    const armBracket = new THREE.Mesh(corbelGeo, weatheredBenchMat);
    armBracket.name = 'courtyard.rattanPatio.armBracket';
    armBracket.position.set(sx, 0.556, 0.188);
    armBracket.castShadow = true;
    westPatioBenchGroup.add(armBracket);

    // Lower H-stretcher side rail (`courtyard.rattanPatio.sideStretcher`)
    const sideStretcher = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.046, 0.41),
      weatheredBenchMat
    );
    sideStretcher.name = 'courtyard.rattanPatio.sideStretcher';
    sideStretcher.position.set(sx, 0.15, 0.006);
    sideStretcher.castShadow = true;
    sideStretcher.receiveShadow = true;
    westPatioBenchGroup.add(sideStretcher);

    // Dark bronze/brass mortise pegs at front apron, rear apron, lower backrest rail & crest rail joints
    for (const [py, pz] of [
      [0.392, 0.216],
      [0.392, -0.198],
      [0.485, -0.206],
      [0.802, -0.228],
    ] as const) {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8),
        benchBronzePegMat
      );
      peg.name = `courtyard.rattanPatio.mortisePeg.${++pegIdx}`;
      peg.rotation.x = Math.PI * 0.5;
      peg.position.set(sx, py, pz);
      westPatioBenchGroup.add(peg);
    }
  }

  // Central long tie-stretcher (`courtyard.rattanPatio.centerStretcher`)
  const centerStretcher = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.04, 0.048),
    weatheredBenchMat
  );
  centerStretcher.name = 'courtyard.rattanPatio.centerStretcher';
  centerStretcher.position.set(0, 0.15, 0.006);
  centerStretcher.castShadow = true;
  centerStretcher.receiveShadow = true;
  westPatioBenchGroup.add(centerStretcher);

  scene.add(westPatioBenchGroup);

  const rustedBowlMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b28,
    roughness: 0.84,
    metalness: 0.28,
  });
  const fireBowlStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.14, 16),
    wroughtIronMat
  );
  if (!fireBowlStand.name) fireBowlStand.name = 'courtyard.rattanPatio.fireBowlStand';
  fireBowlStand.position.set(-5.05, -0.11, 6.65);
  scene.add(fireBowlStand);
  const fireBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    rustedBowlMat
  );
  if (!fireBowl.name) fireBowl.name = 'courtyard.rattanPatio.fireBowl';
  fireBowl.scale.set(1.0, 0.52, 1.0);
  fireBowl.position.set(-5.05, 0.14, 6.65);
  fireBowl.castShadow = true;
  scene.add(fireBowl);

  return {
    brickWallMat,
    brickSoldierCopingMat,
    applyCourtyardBrickUVs,
    weatheredBenchMat,
  };
}

export function buildRaisedFlagstonePatio(
  scene: THREE.Scene,
  southWallGroup: THREE.Group,
  kit: PatioAndGrapeVinePergolaKit,
  retainingWallKit: LowBrickRetainingWallKit,
  shrubKit: BotanicalShrubKit
): RaisedFlagstonePatioKit {
  const { structuralOakMat, buildLionHeadTrophyUrn, buildOldGrindstone } = kit;
  const { brickWallMat, brickSoldierCopingMat, applyCourtyardBrickUVs } = retainingWallKit;
  const {
    botanicalFoliageTextures,
    soilMat,
    woodyStemMat,
    sageFoliageMat,
    deepGreenFoliageMat,
    goldenChoisyaMat,
    brightShrubGreenMat,
    whiteBloomMat,
    blushBloomMat,
    lavenderBloomMat,
    geraniumRedBloomMat,
    botanicalLobeGeos,
    addSculptedBotanicalShrub,
  } = shrubKit;

  // =========================================================================
  // 3. SOUTH OF KITCHEN: RAISED RIVEN FLAGSTONE PATIO TERRACE, 3D HERRINGBONE
  //    BRICK BORDER & SCULPTED COTTAGE SHRUB BANK (`Issue #11` & `Issue #12`)
  // =========================================================================
  const yorkstonePatioTextures = createRivenYorkstonePatioTextures();
  const rivenYorkstonePatioMat = new THREE.MeshStandardMaterial({
    color: 0xd8cdb8,
    map: yorkstonePatioTextures.colorMap,
    bumpMap: yorkstonePatioTextures.bumpMap,
    bumpScale: 0.028,
    roughnessMap: yorkstonePatioTextures.roughnessMap,
    roughness: 0.86,
    metalness: 0.03,
  });
  const rivenYorkstoneAccentMat = new THREE.MeshStandardMaterial({
    color: 0xcabca4,
    map: yorkstonePatioTextures.colorMap,
    bumpMap: yorkstonePatioTextures.bumpMap,
    bumpScale: 0.03,
    roughnessMap: yorkstonePatioTextures.roughnessMap,
    roughness: 0.88,
    metalness: 0.03,
  });

  const herringboneBrickTextures = createHerringboneBrickPatioTextures();
  const herringboneBrickMat = new THREE.MeshStandardMaterial({
    color: 0xdcc8be,
    map: herringboneBrickTextures.colorMap,
    bumpMap: herringboneBrickTextures.bumpMap,
    bumpScale: 0.024,
    roughnessMap: herringboneBrickTextures.roughnessMap,
    roughness: 0.86,
    metalness: 0.03,
  });

  const applyPatioFlagstoneUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number,
    tileW = 1.85,
    tileH = 1.85
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wy = pos.getY(i) + oy;
      const wz = pos.getZ(i) + oz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));
      if (ny >= nx && ny >= nz) {
        uv.setXY(i, wx / tileW, wz / tileH);
      } else if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else {
        uv.setXY(i, wz / tileW, wy / tileH);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  const rattanPatioSlab = new THREE.Mesh(
    applyPatioFlagstoneUVs(new THREE.BoxGeometry(8.65, 0.148, 3.15), -0.075, 0.01, 5.525, 1.8, 1.8),
    rivenYorkstonePatioMat
  );
  rattanPatioSlab.name = 'courtyard.rattanPatioSlab';
  rattanPatioSlab.position.set(-0.075, 0.01, 5.525);
  rattanPatioSlab.receiveShadow = true;
  scene.add(rattanPatioSlab);

  const patioBrickBorderGroup = new THREE.Group();
  patioBrickBorderGroup.name = 'courtyard.rattanPatioSlab.brickBorder';

  for (const [bx, bz, bw, bd] of [
    [-0.075, 4.05, 8.63, 0.18],
    [-0.075, 7.00, 8.63, 0.18],
    [-4.30, 5.525, 0.18, 2.762],
    [4.15, 5.525, 0.18, 2.762],
    [-1.52, 5.525, 0.16, 2.762],
  ] as const) {
    const borderStrip = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(bw, 0.012, bd), bx, 0.094, bz),
      brickSoldierCopingMat
    );
    if (!borderStrip.name) borderStrip.name = 'courtyard.rattanPatio.borderStrip';
    borderStrip.position.set(bx, 0.094, bz);
    borderStrip.receiveShadow = true;
    patioBrickBorderGroup.add(borderStrip);
  }

  const herringboneInlaySlab = new THREE.Mesh(
    applyPatioFlagstoneUVs(new THREE.BoxGeometry(2.54, 0.012, 2.72), -2.90, 0.094, 5.525, 1.35, 1.35),
    herringboneBrickMat
  );
  herringboneInlaySlab.name = 'courtyard.rattanPatioSlab.herringboneInlay';
  herringboneInlaySlab.position.set(-2.90, 0.094, 5.525);
  herringboneInlaySlab.receiveShadow = true;
  patioBrickBorderGroup.add(herringboneInlaySlab);

  const reliefSlabCols = [1.05, 0.88, 1.12, 0.94, 1.08];
  const reliefSlabRows = [0.86, 0.92, 0.84];
  let rZ = 4.18;
  for (let r = 0; r < reliefSlabRows.length; r++) {
    const rowD = reliefSlabRows[r]!;
    let rX = -1.36;
    for (let c = 0; c < reliefSlabCols.length; c++) {
      const colW = reliefSlabCols[c]!;
      const cx = rX + colW * 0.5;
      const cz = rZ + rowD * 0.5;
      const reliefSlab = new THREE.Mesh(
        applyPatioFlagstoneUVs(
          new THREE.BoxGeometry(colW - 0.025, 0.012, rowD - 0.025),
          cx,
          0.094,
          cz,
          1.8,
          1.8
        ),
        (r + c) % 2 === 0 ? rivenYorkstonePatioMat : rivenYorkstoneAccentMat
      );
      if (!reliefSlab.name) reliefSlab.name = 'courtyard.rattanPatio.reliefSlab';
      reliefSlab.position.set(cx, 0.094, cz);
      reliefSlab.receiveShadow = true;
      patioBrickBorderGroup.add(reliefSlab);
      rX += colW + 0.04;
    }
    rZ += rowD + 0.04;
  }

  for (const stepX of [-1.1, 3.1]) {
    const brickRiser = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(1.3, 0.1, 0.24), stepX, 0.01, 3.82),
      brickWallMat
    );
    if (!brickRiser.name) brickRiser.name = 'courtyard.rattanPatio.brickRiser';
    brickRiser.position.set(stepX, 0.01, 3.82);
    brickRiser.castShadow = true;
    brickRiser.receiveShadow = true;
    patioBrickBorderGroup.add(brickRiser);

    const yorkstoneTread = new THREE.Mesh(
      applyPatioFlagstoneUVs(new THREE.BoxGeometry(1.34, 0.032, 0.26), stepX, 0.08, 3.82, 1.5, 1.5),
      rivenYorkstonePatioMat
    );
    if (!yorkstoneTread.name) yorkstoneTread.name = 'courtyard.rattanPatio.yorkstoneTread';
    yorkstoneTread.position.set(stepX, 0.08, 3.82);
    yorkstoneTread.castShadow = true;
    yorkstoneTread.receiveShadow = true;
    patioBrickBorderGroup.add(yorkstoneTread);
  }
  scene.add(patioBrickBorderGroup);

  const patioSouthBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(9.78, 0.28, 0.18), 0.42, 0.05, 7.82),
    brickWallMat
  );
  if (!patioSouthBrickWall.name) patioSouthBrickWall.name = 'courtyard.rattanPatio.patioSouthBrickWall';
  patioSouthBrickWall.position.set(0.42, 0.05, 7.82);
  patioSouthBrickWall.castShadow = true;
  patioSouthBrickWall.receiveShadow = true;
  scene.add(patioSouthBrickWall);

  const patioSouthBrickCoping = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(9.82, 0.045, 0.22), 0.42, 0.2165, 7.82),
    brickSoldierCopingMat
  );
  if (!patioSouthBrickCoping.name) patioSouthBrickCoping.name = 'courtyard.rattanPatio.patioSouthBrickCoping';
  patioSouthBrickCoping.position.set(0.42, 0.2165, 7.82);
  patioSouthBrickCoping.castShadow = true;
  patioSouthBrickCoping.receiveShadow = true;
  scene.add(patioSouthBrickCoping);

  const patioSouthSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 0.18, 0.56),
    soilMat
  );
  if (!patioSouthSoilBed.name) patioSouthSoilBed.name = 'courtyard.rattanPatio.patioSouthSoilBed';
  patioSouthSoilBed.position.set(0.35, 0.03, 7.42);
  patioSouthSoilBed.receiveShadow = true;
  scene.add(patioSouthSoilBed);

  const patioEastBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.18, 0.28, 3.768), 5.2, 0.05, 5.84),
    brickWallMat
  );
  if (!patioEastBrickWall.name) patioEastBrickWall.name = 'courtyard.rattanPatio.patioEastBrickWall';
  patioEastBrickWall.position.set(5.2, 0.05, 5.84);
  patioEastBrickWall.castShadow = true;
  patioEastBrickWall.receiveShadow = true;
  scene.add(patioEastBrickWall);

  const patioEastSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.18, 3.12),
    soilMat
  );
  if (!patioEastSoilBed.name) patioEastSoilBed.name = 'courtyard.rattanPatio.patioEastSoilBed';
  patioEastSoilBed.position.set(4.68, 0.03, 5.54);
  patioEastSoilBed.receiveShadow = true;
  scene.add(patioEastSoilBed);

  for (const [dx, dy, dz, rx, ry, rz] of [
    [-3.65, 0.44, 7.22, 0.62, 0.48, 0.56],
    [-3.12, 0.38, 7.36, 0.48, 0.4, 0.46],
    [-4.05, 0.4, 6.82, 0.46, 0.38, 0.44],
  ] as const) {
    addSculptedBotanicalShrub(
      scene,
      dx,
      dy,
      dz,
      rx,
      ry,
      rz,
      goldenChoisyaMat,
      whiteBloomMat,
      brightShrubGreenMat
    );
  }

  for (const [sx, sz, rotZ, rotX] of [
    [-2.08, 7.35, 0.16, -0.08],
    [-1.92, 7.45, -0.14, 0.1],
    [-1.82, 7.39, 0.09, 0.14],
    [-2.0, 7.48, -0.06, -0.12],
    [-1.62, 7.42, -0.18, 0.07],
    [-2.28, 7.33, 0.21, -0.06],
  ] as const) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.036, 1.08, 8),
      woodyStemMat
    );
    if (!stem.name) stem.name = 'courtyard.rattanPatio.stem';
    stem.position.set(sx, 0.54, sz);
    stem.rotation.set(rotX, 0, rotZ);
    stem.castShadow = true;
    scene.add(stem);
  }
  for (const [cx, cy, cz, rx, ry, rz] of [
    [-1.95, 1.15, 7.42, 0.78, 0.48, 0.68],
    [-2.45, 1.04, 7.32, 0.56, 0.4, 0.52],
    [-1.42, 1.06, 7.45, 0.58, 0.42, 0.54],
  ] as const) {
    addSculptedBotanicalShrub(
      scene,
      cx,
      cy,
      cz,
      rx,
      ry,
      rz,
      sageFoliageMat,
      whiteBloomMat,
      deepGreenFoliageMat
    );
  }

  for (const [bx, by, bz, rx, ry, rz, mat, altMat, bloom] of [
    [-0.15, 0.58, 7.35, 0.76, 0.58, 0.68, brightShrubGreenMat, deepGreenFoliageMat, whiteBloomMat],
    [0.52, 0.48, 7.45, 0.56, 0.44, 0.52, deepGreenFoliageMat, sageFoliageMat, lavenderBloomMat],
    [1.85, 0.52, 7.48, 0.64, 0.48, 0.56, sageFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [3.15, 0.56, 7.5, 0.68, 0.52, 0.58, brightShrubGreenMat, deepGreenFoliageMat, blushBloomMat],
    [4.45, 0.62, 7.32, 0.68, 0.56, 0.58, deepGreenFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [4.68, 0.58, 6.05, 0.54, 0.52, 0.58, sageFoliageMat, deepGreenFoliageMat, lavenderBloomMat],
    [4.65, 0.54, 4.75, 0.52, 0.46, 0.52, brightShrubGreenMat, sageFoliageMat, whiteBloomMat],
  ] as const) {
    addSculptedBotanicalShrub(scene, bx, by, bz, rx, ry, rz, mat, bloom, altMat);
  }

  for (const [px, pz, r, h, mat, altMat, bloom] of [
    [-3.85, 4.22, 0.36, 0.32, sageFoliageMat, deepGreenFoliageMat, lavenderBloomMat],
    [-2.95, 4.24, 0.38, 0.34, deepGreenFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [-0.15, 4.32, 0.42, 0.36, sageFoliageMat, deepGreenFoliageMat, lavenderBloomMat],
    [0.55, 4.45, 0.52, 0.44, deepGreenFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [1.25, 4.48, 0.56, 0.48, brightShrubGreenMat, deepGreenFoliageMat, whiteBloomMat],
    [1.95, 4.36, 0.46, 0.38, deepGreenFoliageMat, sageFoliageMat, blushBloomMat],
  ] as const) {
    addSculptedBotanicalShrub(scene, px, h * 0.55 + 0.08, pz, r, h, r * 0.92, mat, bloom, altMat);
  }

  const darkGlazedPotMat = new THREE.MeshStandardMaterial({
    color: 0x2f2622,
    roughness: 0.34,
    metalness: 0.12,
  });
  const zincPotMat = new THREE.MeshStandardMaterial({
    color: 0x7a8086,
    roughness: 0.56,
    metalness: 0.24,
  });
  const creamPotMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.52,
    metalness: 0.06,
  });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa45a3f, roughness: 0.75 });

  for (const [px, pz, rTop, rBot, potH, pMat, cMat, bMat] of [
    [2.28, 4.18, 0.23, 0.16, 0.38, darkGlazedPotMat, deepGreenFoliageMat, whiteBloomMat],
    [1.52, 4.15, 0.17, 0.13, 0.31, zincPotMat, sageFoliageMat, lavenderBloomMat],
    [1.18, 4.12, 0.15, 0.11, 0.26, potMat, brightShrubGreenMat, geraniumRedBloomMat],
    [-1.62, 4.16, 0.19, 0.14, 0.32, potMat, deepGreenFoliageMat, whiteBloomMat],
    [3.68, 4.18, 0.19, 0.14, 0.32, potMat, sageFoliageMat, lavenderBloomMat],
    [0.82, 7.62, 0.18, 0.13, 0.3, creamPotMat, brightShrubGreenMat, blushBloomMat],
  ] as const) {
    const potGroup = new THREE.Group();
    potGroup.name = 'courtyard.rattanPatioSlab.plantedPot';
    potGroup.position.set(px, pz > 7.2 ? 0.125 : 0.105, pz);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, potH, 16), pMat);
    if (!pot.name) pot.name = 'courtyard.rattanPatio.pot';
    pot.position.set(0, potH * 0.5, 0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    potGroup.add(pot);

    const potRim = new THREE.Mesh(new THREE.TorusGeometry(rTop, 0.015, 8, 16), pMat);
    if (!potRim.name) potRim.name = 'courtyard.rattanPatio.potRim';
    potRim.rotation.x = Math.PI * 0.5;
    potRim.position.set(0, potH - 0.012, 0);
    potGroup.add(potRim);

    const potSoil = new THREE.Mesh(new THREE.CylinderGeometry(rTop * 0.9, rTop * 0.9, 0.02, 14), soilMat);
    if (!potSoil.name) potSoil.name = 'courtyard.rattanPatio.potSoil';
    potSoil.position.set(0, potH - 0.02, 0);
    potGroup.add(potSoil);

    addSculptedBotanicalShrub(
      potGroup,
      0,
      potH + rTop * 0.58,
      0,
      rTop * 1.28,
      rTop * 1.05,
      rTop * 1.28,
      cMat,
      bMat,
      deepGreenFoliageMat
    );

    scene.add(potGroup);
  }

  buildLionHeadTrophyUrn(scene, 1.88, 4.48, deepGreenFoliageMat, whiteBloomMat, blushBloomMat);
  buildOldGrindstone(scene, 0.62, 4.28, structuralOakMat);

  const bayLeafDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2d4d2a,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.024,
    roughness: 0.62,
    metalness: 0.04,
  });
  const bayLeafMidMat = new THREE.MeshStandardMaterial({
    color: 0x3b6136,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.024,
    roughness: 0.58,
    metalness: 0.04,
  });
  const utilityBayTreePositions: ReadonlyArray<readonly [number, number]> = [
    [5.68, -0.68],
    [5.68, -1.72],
  ];
  for (const [bx, bz] of utilityBayTreePositions) {
    const bayPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.185, 0.135, 0.31, 14),
      potMat
    );
    if (!bayPot.name) bayPot.name = 'courtyard.rattanPatio.bayPot';
    bayPot.position.set(bx, 0.155, bz);
    bayPot.castShadow = true;
    bayPot.receiveShadow = true;
    scene.add(bayPot);

    const bayPotRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.185, 0.016, 8, 16),
      potMat
    );
    if (!bayPotRim.name) bayPotRim.name = 'courtyard.rattanPatio.bayPotRim';
    bayPotRim.rotation.x = Math.PI / 2;
    bayPotRim.position.set(bx, 0.302, bz);
    scene.add(bayPotRim);

    const baySoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12),
      soilMat
    );
    if (!baySoil.name) baySoil.name = 'courtyard.rattanPatio.baySoil';
    baySoil.position.set(bx, 0.295, bz);
    scene.add(baySoil);

    const bayStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.52, 8),
      structuralOakMat
    );
    if (!bayStem.name) bayStem.name = 'courtyard.rattanPatio.bayStem';
    bayStem.position.set(bx, 0.56, bz);
    bayStem.castShadow = true;
    scene.add(bayStem);

    const bayCrownCore = new THREE.Mesh(
      botanicalLobeGeos[0]!,
      bayLeafDarkMat
    );
    if (!bayCrownCore.name) bayCrownCore.name = 'courtyard.rattanPatio.bayCrownCore';
    bayCrownCore.scale.set(0.24, 0.26, 0.24);
    bayCrownCore.position.set(bx, 0.96, bz);
    bayCrownCore.castShadow = true;
    bayCrownCore.receiveShadow = true;
    scene.add(bayCrownCore);

    const lobeOffsets: ReadonlyArray<readonly [number, number, number, number]> = [
      [0.08, 0.05, 0.07, 0.12],
      [-0.08, 0.04, 0.06, 0.115],
      [0.06, 0.06, -0.08, 0.115],
      [-0.07, 0.03, -0.07, 0.12],
      [0.0, 0.1, 0.0, 0.13],
      [0.1, -0.04, 0.0, 0.11],
      [-0.1, -0.04, 0.0, 0.11],
    ];
    for (let i = 0; i < lobeOffsets.length; i++) {
      const [lx, ly, lz, lr] = lobeOffsets[i]!;
      const lobe = new THREE.Mesh(
        botanicalLobeGeos[(i + 1) % botanicalLobeGeos.length]!,
        i % 2 === 0 ? bayLeafMidMat : bayLeafDarkMat
      );
      if (!lobe.name) lobe.name = 'courtyard.rattanPatio.lobe';
      lobe.scale.set(lr, lr, lr);
      lobe.position.set(bx + lx, 0.96 + ly, bz + lz);
      lobe.castShadow = true;
      scene.add(lobe);
    }
  }

  const pierIvyGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const y = 0.25 + t * 2.55;
    const spreadX = (Math.sin(i * 4.7) * 0.5) * 0.44 * (1 - t * 0.25);
    const r = 0.11 + (i % 3) * 0.025;
    const ivyLeaf = new THREE.Mesh(
      pierIvyGeo,
      i % 2 === 0 ? bayLeafDarkMat : bayLeafMidMat
    );
    if (!ivyLeaf.name) ivyLeaf.name = 'courtyard.rattanPatio.ivyLeaf';
    ivyLeaf.scale.set(r * 1.15, r, 0.06);
    ivyLeaf.position.set(1.15 + spreadX, y, 2.3);
    southWallGroup.add(ivyLeaf);
  }

  return {
    yorkstonePatioTextures,
    rivenYorkstonePatioMat,
    applyPatioFlagstoneUVs,
    zincPotMat,
    creamPotMat,
    potMat,
  };
}
