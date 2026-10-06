import * as THREE from 'three';
import { buildMitredWallSkirtingGeometry } from '../../../../../engine/geometry/swept-moulding.ts';
import type { SceneBuilderContext } from '../../../../../types/scene.ts';
import type { DiningRoomKit } from '../dining-room.ts';
import type { DiningRoomSharedMaterials } from './walk-in-cupboard-and-north-wall.ts';

export function buildSnugAlcoveAndEastFireplace(
  ctx: SceneBuilderContext,
  kit: DiningRoomKit,
  mats: DiningRoomSharedMaterials
): void {
  const { interactions, lightGroups, scene } = ctx;
  const { antiqueOakSkirtingMat, brassMat, castIronMat, ceramicWhiteMat, oakMat, wallH } = kit;
  const { crispWhiteWallMat, snugSlateBlueMat } = mats;
  // 1D. East Wall of Snug Alcove (X = -4.645m, Z = -2.50m..-0.85m) — Deep Slate-Blue Lining,
  //     Flush 42-inch Samsung The Frame QLED TV & NE Corner Indoor Floor Plant (Issue #10 & #12)
  const snugEastWallLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, wallH, 1.65),
    snugSlateBlueMat
  );
  if (!snugEastWallLining.name) snugEastWallLining.name = 'familyRoom.eastFireplace.snugEastWallLining';
  snugEastWallLining.position.set(-4.648, wallH / 2, -1.675);
  snugEastWallLining.receiveShadow = true;
  scene.add(snugEastWallLining);

  // Antique-profiled oak skirting board with 45° mitred corner around the SE Walk-in Cupboard corner & Snug West wall
  const snugSkirtWest = new THREE.Mesh(
    buildMitredWallSkirtingGeometry([
      [-8.248, -0.438],
      [-7.804, -0.438],
      [-7.804, -2.482],
    ]),
    antiqueOakSkirtingMat
  );
  snugSkirtWest.name = 'familyRoom.snugWestSkirting';
  snugSkirtWest.receiveShadow = true;
  scene.add(snugSkirtWest);

  // 42-inch Samsung The Frame QLED Art Mode TV flush-mounted on the East Snug Wall (X = -4.668m, Y = 1.34m, Z = -1.62m — Issue #12)
  // Official 42" / 43" Frame dimensions: 969mm W x 558mm H x 25mm D with magnetic warm oak bezel & museum mat passepartout
  const snugTvGroup = new THREE.Group();
  snugTvGroup.name = 'familyRoom.frameTv42';
  snugTvGroup.position.set(-4.668, 1.34, -1.62);
  snugTvGroup.rotation.y = -Math.PI / 2; // Flush against East Snug wall facing West (-X)

  const frameTvW = 0.969;
  const frameTvH = 0.558;
  const frameTvD = 0.025;
  const frameBezelW = 0.022;

  // Slim charcoal chassis backing flush against the wall
  const snugTvChassis = new THREE.Mesh(
    new THREE.BoxGeometry(frameTvW - 0.016, frameTvH - 0.016, frameTvD - 0.004),
    castIronMat
  );
  snugTvChassis.name = 'familyRoom.frameTv42.chassis';
  snugTvChassis.position.set(0, 0, -0.002);
  snugTvChassis.castShadow = true;
  snugTvGroup.add(snugTvChassis);

  // Customizable 4-sided magnetic warm oak picture-frame bezel (top, bottom, left, right rails)
  for (const [bx, by, bw, bh] of [
    [0, frameTvH * 0.5 - frameBezelW * 0.5, frameTvW, frameBezelW],
    [0, -frameTvH * 0.5 + frameBezelW * 0.5, frameTvW, frameBezelW],
    [-frameTvW * 0.5 + frameBezelW * 0.5, 0, frameBezelW, frameTvH - frameBezelW * 2],
    [frameTvW * 0.5 - frameBezelW * 0.5, 0, frameBezelW, frameTvH - frameBezelW * 2],
  ] as const) {
    const bezelBar = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, frameTvD),
      antiqueOakSkirtingMat
    );
    bezelBar.name = 'familyRoom.frameTv42.bezel';
    bezelBar.position.set(bx, by, 0);
    bezelBar.castShadow = true;
    snugTvGroup.add(bezelBar);
  }

  // Warm off-white museum passepartout mat board inside the oak bezel
  const snugTvMatBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(frameTvW - frameBezelW * 2, frameTvH - frameBezelW * 2),
    ceramicWhiteMat
  );
  snugTvMatBoard.name = 'familyRoom.frameTv42.passepartout';
  snugTvMatBoard.position.set(0, 0, frameTvD * 0.5 - 0.001);
  snugTvGroup.add(snugTvMatBoard);

  // Anti-reflective matte QLED Art Mode display canvas inside the passepartout mat
  const snugTvArtCanvas = document.createElement('canvas');
  snugTvArtCanvas.width = 256;
  snugTvArtCanvas.height = 144;
  const snugArtCtx = snugTvArtCanvas.getContext('2d');
  if (snugArtCtx) {
    const skyGrad = snugArtCtx.createLinearGradient(0, 0, 0, 88);
    skyGrad.addColorStop(0, '#c2d0d8');
    skyGrad.addColorStop(1, '#ede5d5');
    snugArtCtx.fillStyle = skyGrad;
    snugArtCtx.fillRect(0, 0, 256, 144);
    snugArtCtx.fillStyle = '#6c7c66';
    snugArtCtx.beginPath();
    snugArtCtx.moveTo(0, 88);
    snugArtCtx.quadraticCurveTo(75, 64, 155, 82);
    snugArtCtx.quadraticCurveTo(210, 92, 256, 74);
    snugArtCtx.lineTo(256, 144);
    snugArtCtx.lineTo(0, 144);
    snugArtCtx.fill();
    snugArtCtx.fillStyle = '#485842';
    snugArtCtx.beginPath();
    snugArtCtx.moveTo(0, 108);
    snugArtCtx.quadraticCurveTo(115, 92, 256, 114);
    snugArtCtx.lineTo(256, 144);
    snugArtCtx.lineTo(0, 144);
    snugArtCtx.fill();
  }
  const snugTvArtTex = new THREE.CanvasTexture(snugTvArtCanvas);
  snugTvArtTex.colorSpace = THREE.SRGBColorSpace;
  const snugTvScreenMat = new THREE.MeshStandardMaterial({
    map: snugTvArtTex,
    emissive: 0xfff6e5,
    emissiveMap: snugTvArtTex,
    emissiveIntensity: 0.14,
    roughness: 0.42,
    metalness: 0.04,
  });
  const snugTvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(frameTvW - 0.16, frameTvH - 0.14),
    snugTvScreenMat
  );
  snugTvScreen.name = 'familyRoom.frameTv42.screen';
  snugTvScreen.position.set(0, 0, frameTvD * 0.5);
  snugTvGroup.add(snugTvScreen);
  scene.add(snugTvGroup);

  // Lush Architectural Indoor Corner Floor Plant in the NE corner of the Dining Room
  // (Issue #10: High-LOD multi-trunk Ficus lyrata with LatheGeometry stoneware pot on oak stand,
  //  CatmullRomCurve3 branching woody trunks & petioles, and 3D sculpted arched fiddle leaves at X = -5.02m, Z = -2.14m)
  const nePlantGroup = new THREE.Group();
  nePlantGroup.name = 'familyRoom.neCornerPlant';
  nePlantGroup.userData.zone = 'familyRoom';
  nePlantGroup.position.set(-5.02, 0, -2.14);

  const planterStonewareMat = new THREE.MeshStandardMaterial({
    color: 0xd8cebc,
    roughness: 0.56,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const plantSoilMat = new THREE.MeshStandardMaterial({
    color: 0x281e15,
    roughness: 0.94,
  });
  const plantStemWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4e3b29,
    roughness: 0.82,
  });
  const petioleGreenMat = new THREE.MeshStandardMaterial({
    color: 0x435e35,
    roughness: 0.58,
  });

  // Procedural 256x256 Ficus lyrata leaf venation CanvasTexture (dark glossy green with pale-olive midrib & lateral veins)
  const makeFicusLeafTexture = (isFresh: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 256, 0, 0);
      if (isFresh) {
        grad.addColorStop(0, '#2e582c');
        grad.addColorStop(0.5, '#3b6d36');
        grad.addColorStop(1, '#497f40');
      } else {
        grad.addColorStop(0, '#1e3d20');
        grad.addColorStop(0.5, '#274d29');
        grad.addColorStop(1, '#315d33');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Central midrib vein (runs from bottom v=0 to tip v=1)
      ctx.strokeStyle = isFresh ? 'rgba(168, 198, 118, 0.72)' : 'rgba(138, 172, 96, 0.62)';
      ctx.lineCap = 'round';
      for (let s = 0; s < 8; s++) {
        const y0 = 256 - s * 30;
        const y1 = Math.max(12, 256 - (s + 1) * 30);
        ctx.lineWidth = Math.max(1.2, 5.2 - s * 0.55);
        ctx.beginPath();
        ctx.moveTo(128, y0);
        ctx.lineTo(128, y1);
        ctx.stroke();
      }

      // Alternating pinnate lateral veins arching toward leaf margins
      for (let v = 0; v < 7; v++) {
        const startY = 232 - v * 30;
        const reachX = 88 + (v > 3 ? 18 : -Math.abs(v - 2) * 8);
        ctx.lineWidth = Math.max(1.0, 2.6 - v * 0.2);
        for (const dir of [-1, 1] as const) {
          ctx.beginPath();
          ctx.moveTo(128, startY);
          ctx.quadraticCurveTo(
            128 + dir * reachX * 0.55,
            startY - 10,
            128 + dir * reachX,
            startY - 26
          );
          ctx.stroke();
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const foliageDeepMat = new THREE.MeshStandardMaterial({
    map: makeFicusLeafTexture(false),
    roughness: 0.36,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const foliageFreshMat = new THREE.MeshStandardMaterial({
    map: makeFicusLeafTexture(true),
    roughness: 0.32,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // 1. Turned Oak 3-Legged Mid-Century Plant Stand Base (Y = 0..0.09m)
  const standGroup = new THREE.Group();
  standGroup.name = 'familyRoom.neCornerPlant.stand';
  for (let l = 0; l < 3; l++) {
    const legAngle = (l * Math.PI * 2) / 3 + 0.25;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.012, 0.14, 12),
      oakMat
    );
    if (!leg.name) leg.name = 'familyRoom.eastFireplace.leg';
    leg.position.set(Math.cos(legAngle) * 0.165, 0.07, Math.sin(legAngle) * 0.165);
    leg.rotation.z = -Math.cos(legAngle) * 0.08;
    leg.rotation.x = Math.sin(legAngle) * 0.08;
    leg.castShadow = true;
    standGroup.add(leg);

    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.022, 0.022),
      oakMat
    );
    if (!crossbar.name) crossbar.name = 'familyRoom.eastFireplace.crossbar';
    crossbar.position.set(Math.cos(legAngle) * 0.082, 0.052, Math.sin(legAngle) * 0.082);
    crossbar.rotation.y = -legAngle;
    standGroup.add(crossbar);
  }
  nePlantGroup.add(standGroup);

  // 2. Sculpted LatheGeometry Ceramic Stoneware Planter Pot with curved belly & rolled lip (Y = 0.055..0.415m)
  const potProfilePoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.055),
    new THREE.Vector2(0.135, 0.055),
    new THREE.Vector2(0.155, 0.09),
    new THREE.Vector2(0.185, 0.17),
    new THREE.Vector2(0.202, 0.27),
    new THREE.Vector2(0.198, 0.365),
    new THREE.Vector2(0.208, 0.398),
    new THREE.Vector2(0.204, 0.415),
    new THREE.Vector2(0.184, 0.415),
    new THREE.Vector2(0.182, 0.382),
  ];
  const nePlanterPot = new THREE.Mesh(
    new THREE.LatheGeometry(potProfilePoints, 32),
    planterStonewareMat
  );
  nePlanterPot.name = 'familyRoom.neCornerPlant.pot';
  nePlanterPot.castShadow = true;
  nePlanterPot.receiveShadow = true;
  nePlantGroup.add(nePlanterPot);

  // Decorative subtle horizontal stoneware throwing rings around the pot belly
  for (const ringY of [0.22, 0.29, 0.35] as const) {
    const potRib = new THREE.Mesh(
      new THREE.TorusGeometry(0.198, 0.0045, 8, 32),
      planterStonewareMat
    );
    if (!potRib.name) potRib.name = 'familyRoom.eastFireplace.potRib';
    potRib.rotation.x = Math.PI / 2;
    potRib.position.set(0, ringY, 0);
    nePlantGroup.add(potRib);
  }

  // Dark organic soil bed & smooth river pebbles at Y = 0.39m
  const neSoilBed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.182, 0.178, 0.024, 24),
    plantSoilMat
  );
  neSoilBed.name = 'familyRoom.neCornerPlant.soil';
  neSoilBed.position.set(0, 0.388, 0);
  nePlantGroup.add(neSoilBed);

  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x8b8274,
    roughness: 0.68,
  });
  for (let p = 0; p < 12; p++) {
    const pa = p * 2.39996;
    const pr = 0.045 + (p % 4) * 0.032;
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), pebbleMat);
    if (!pebble.name) pebble.name = 'familyRoom.eastFireplace.pebble';
    pebble.scale.set(1.2, 0.48, 0.95);
    pebble.position.set(Math.cos(pa) * pr, 0.401, Math.sin(pa) * pr);
    pebble.rotation.y = pa;
    nePlantGroup.add(pebble);
  }

  // 3. Sculpted 3D Ficus Lyrata (Fiddle-Leaf Fig) Leaf Blade Geometry builder
  //    Produces a violin-shaped leaf with basal lobes, pinched waist, broad apical lobe,
  //    longitudinal arch, transverse V-cupping, and ruffled margins.
  const createFicusLeafGeometry = (width: number, length: number, archAmount: number): THREE.BufferGeometry => {
    const segU = 12;
    const segV = 18;
    const geo = new THREE.PlaneGeometry(1, 1, segU, segV);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      // u in [-1, +1] across leaf width; v in [0, 1] from petiole base (0) to leaf tip (1)
      const u = pos.getX(i) * 2;
      const v = pos.getY(i) + 0.5;

      // Violin / fiddle-leaf silhouette profile along v
      const baseTaper = Math.pow(Math.sin(Math.min(1, v * 1.04) * Math.PI), 0.62);
      const violinMod =
        1.0 +
        0.34 * Math.exp(-Math.pow((v - 0.74) / 0.2, 2)) - // Broad upper apical paddle lobe
        0.22 * Math.exp(-Math.pow((v - 0.38) / 0.13, 2)) + // Pinched fiddle waist
        0.14 * Math.exp(-Math.pow((v - 0.16) / 0.11, 2)); // Cordate basal lobes
      const halfW = 0.5 * width * baseTaper * violinMod;

      const x = u * halfW;
      const z = v * length;

      // Longitudinal downward arch + transverse V-cupping + subtle margin ruffle
      const archY = Math.sin(v * Math.PI * 0.82) * 0.042 - Math.pow(v, 1.85) * archAmount;
      const cupY = Math.pow(Math.abs(u), 1.45) * 0.022 * Math.sin(v * Math.PI);
      const ruffleY =
        Math.pow(Math.abs(u), 2.0) *
        Math.sin(v * Math.PI * 4.5 + (u >= 0 ? 0.4 : -0.4)) *
        0.009 *
        Math.sin(v * Math.PI);
      // Slight raised central midrib ridge
      const midribY = Math.exp(-Math.pow(u * 6.5, 2)) * 0.0045 * (1 - v * 0.6);

      pos.setXYZ(i, x, archY + cupY + ruffleY + midribY, z);
    }

    geo.computeVertexNormals();
    return geo;
  };

  // 4. Four Organic S-Curved Woody Trunks & Secondary Branches (`CatmullRomCurve3` + `TubeGeometry`)
  const trunkCurves: THREE.CatmullRomCurve3[] = [
    // Main tall central-northwest leader trunk (reaches Y = 1.48m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.38, 0.0),
      new THREE.Vector3(-0.02, 0.66, 0.015),
      new THREE.Vector3(0.015, 0.96, -0.02),
      new THREE.Vector3(-0.035, 1.24, 0.025),
      new THREE.Vector3(-0.06, 1.46, 0.045),
    ]),
    // Secondary southwest-leaning branch (reaches Y = 1.24m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.025, 0.38, 0.02),
      new THREE.Vector3(-0.075, 0.64, 0.065),
      new THREE.Vector3(-0.135, 0.92, 0.11),
      new THREE.Vector3(-0.18, 1.2, 0.145),
    ]),
    // Secondary northeast-leaning branch (reaches Y = 1.32m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.025, 0.38, -0.015),
      new THREE.Vector3(0.07, 0.68, -0.05),
      new THREE.Vector3(0.115, 0.98, -0.095),
      new THREE.Vector3(0.15, 1.28, -0.125),
    ]),
    // Lower southeast fork branch (reaches Y = 1.06m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, 0.48, 0.01),
      new THREE.Vector3(0.065, 0.68, 0.06),
      new THREE.Vector3(0.12, 0.88, 0.115),
      new THREE.Vector3(0.155, 1.05, 0.15),
    ]),
  ];

  trunkCurves.forEach((curve, idx) => {
    const radius = idx === 0 ? 0.016 : idx === 3 ? 0.011 : 0.0135;
    const trunkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, radius, 10, false),
      plantStemWoodMat
    );
    trunkMesh.name = `familyRoom.neCornerPlant.trunk.${idx + 1}`;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    nePlantGroup.add(trunkMesh);
  });

  // 5. 22 Sculpted Ficus Lyrata Leaves connected via curved petioles directly to the 4 woody trunks
  const leafSpecs: ReadonlyArray<{
    readonly trunkIdx: number;
    readonly t: number;
    readonly yaw: number;
    readonly pitch: number;
    readonly roll: number;
    readonly w: number;
    readonly l: number;
    readonly arch: number;
    readonly fresh: boolean;
  }> = [
    // Trunk 0 (main leader) leaves from mid-canopy up to apical crown
    { trunkIdx: 0, t: 0.36, yaw: 0.2, pitch: 0.32, roll: 0.08, w: 0.18, l: 0.29, arch: 0.08, fresh: false },
    { trunkIdx: 0, t: 0.48, yaw: 2.3, pitch: 0.28, roll: -0.06, w: 0.19, l: 0.31, arch: 0.075, fresh: false },
    { trunkIdx: 0, t: 0.60, yaw: 4.4, pitch: 0.22, roll: 0.05, w: 0.20, l: 0.32, arch: 0.07, fresh: false },
    { trunkIdx: 0, t: 0.72, yaw: 1.1, pitch: 0.16, roll: -0.05, w: 0.19, l: 0.30, arch: 0.065, fresh: true },
    { trunkIdx: 0, t: 0.83, yaw: 3.4, pitch: 0.08, roll: 0.04, w: 0.18, l: 0.28, arch: 0.055, fresh: true },
    { trunkIdx: 0, t: 0.93, yaw: 5.5, pitch: -0.05, roll: -0.04, w: 0.16, l: 0.25, arch: 0.045, fresh: true },
    { trunkIdx: 0, t: 1.0, yaw: 1.8, pitch: -0.22, roll: 0.0, w: 0.14, l: 0.22, arch: 0.035, fresh: true },
    { trunkIdx: 0, t: 1.0, yaw: 4.9, pitch: -0.18, roll: 0.0, w: 0.15, l: 0.23, arch: 0.038, fresh: true },

    // Trunk 1 (SW branch) leaves
    { trunkIdx: 1, t: 0.38, yaw: 2.8, pitch: 0.38, roll: -0.08, w: 0.18, l: 0.29, arch: 0.085, fresh: false },
    { trunkIdx: 1, t: 0.56, yaw: 4.8, pitch: 0.30, roll: 0.07, w: 0.19, l: 0.31, arch: 0.075, fresh: false },
    { trunkIdx: 1, t: 0.75, yaw: 1.4, pitch: 0.18, roll: -0.05, w: 0.18, l: 0.28, arch: 0.065, fresh: true },
    { trunkIdx: 1, t: 0.92, yaw: 3.6, pitch: 0.06, roll: 0.04, w: 0.17, l: 0.26, arch: 0.05, fresh: true },
    { trunkIdx: 1, t: 1.0, yaw: 2.2, pitch: -0.14, roll: 0.0, w: 0.15, l: 0.24, arch: 0.04, fresh: true },

    // Trunk 2 (NE branch) leaves
    { trunkIdx: 2, t: 0.35, yaw: 5.8, pitch: 0.36, roll: 0.06, w: 0.18, l: 0.29, arch: 0.085, fresh: false },
    { trunkIdx: 2, t: 0.55, yaw: 1.7, pitch: 0.28, roll: -0.07, w: 0.19, l: 0.30, arch: 0.075, fresh: false },
    { trunkIdx: 2, t: 0.74, yaw: 3.9, pitch: 0.18, roll: 0.05, w: 0.18, l: 0.29, arch: 0.065, fresh: true },
    { trunkIdx: 2, t: 0.91, yaw: 0.5, pitch: 0.05, roll: -0.04, w: 0.17, l: 0.26, arch: 0.05, fresh: true },
    { trunkIdx: 2, t: 1.0, yaw: 5.1, pitch: -0.16, roll: 0.0, w: 0.15, l: 0.23, arch: 0.04, fresh: true },

    // Trunk 3 (SE lower branch) leaves
    { trunkIdx: 3, t: 0.42, yaw: 0.9, pitch: 0.40, roll: 0.08, w: 0.17, l: 0.28, arch: 0.085, fresh: false },
    { trunkIdx: 3, t: 0.68, yaw: 3.1, pitch: 0.28, roll: -0.06, w: 0.18, l: 0.29, arch: 0.075, fresh: false },
    { trunkIdx: 3, t: 0.88, yaw: 5.3, pitch: 0.15, roll: 0.05, w: 0.17, l: 0.26, arch: 0.06, fresh: true },
    { trunkIdx: 3, t: 1.0, yaw: 1.2, pitch: -0.08, roll: 0.0, w: 0.15, l: 0.23, arch: 0.045, fresh: true },
  ];

  leafSpecs.forEach((spec, idx) => {
    const nodePos = trunkCurves[spec.trunkIdx].getPoint(spec.t);
    const petioleLen = 0.065;
    const outDirX = Math.sin(spec.yaw);
    const outDirZ = Math.cos(spec.yaw);
    const leafBasePos = new THREE.Vector3(
      nodePos.x + outDirX * petioleLen,
      nodePos.y + 0.024,
      nodePos.z + outDirZ * petioleLen
    );

    // Curved green petiole stalk connecting the woody trunk node directly to the leaf blade base
    const petioleCurve = new THREE.CatmullRomCurve3([
      nodePos,
      new THREE.Vector3(
        (nodePos.x + leafBasePos.x) * 0.5,
        nodePos.y + 0.018,
        (nodePos.z + leafBasePos.z) * 0.5
      ),
      leafBasePos,
    ]);
    const petioleMesh = new THREE.Mesh(
      new THREE.TubeGeometry(petioleCurve, 6, 0.0042, 6, false),
      petioleGreenMat
    );
    if (!petioleMesh.name) petioleMesh.name = 'familyRoom.eastFireplace.petiole';
    petioleMesh.castShadow = true;
    nePlantGroup.add(petioleMesh);

    const leafHolder = new THREE.Group();
    leafHolder.name = `familyRoom.neCornerPlant.leaf.${idx + 1}`;
    leafHolder.position.copy(leafBasePos);
    leafHolder.rotation.order = 'YXZ';
    leafHolder.rotation.y = spec.yaw;
    leafHolder.rotation.x = spec.pitch;
    leafHolder.rotation.z = spec.roll;

    const leafBlade = new THREE.Mesh(
      createFicusLeafGeometry(spec.w, spec.l, spec.arch),
      spec.fresh ? foliageFreshMat : foliageDeepMat
    );
    if (!leafBlade.name) leafBlade.name = 'familyRoom.eastFireplace.leafBlade';
    leafBlade.castShadow = true;
    leafBlade.receiveShadow = true;
    leafHolder.add(leafBlade);
    nePlantGroup.add(leafHolder);
  });

  // Warm-white micro-LED fairy lights on fine copper wire spiralling up each trunk through the canopy,
  // on the Dining Room KNX circuit (bulbs are a single InstancedMesh to keep draw calls low).
  {
    const fairyWireMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a32,
      roughness: 0.4,
      metalness: 0.7,
    });
    const fairyBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff2d2,
      emissive: 0xffb04a,
      emissiveIntensity: 3.2,
      roughness: 0.2,
    });
    fairyBulbMat.userData.baseEmissiveIntensity = 3.2;
    lightGroups.diningFairyLights.emissives.push(fairyBulbMat);

    const bulbPositions: THREE.Vector3[] = [];
    trunkCurves.forEach((curve, idx) => {
      const samples = 36;
      const turns = idx === 0 ? 3.5 : 2.5;
      const phase = idx * 1.7;
      const wirePoints: THREE.Vector3[] = [];
      for (let k = 0; k <= samples; k++) {
        const f = k / samples;
        const t = 0.22 + 0.78 * f;
        const p = curve.getPoint(t);
        const angle = phase + f * turns * Math.PI * 2;
        const r = 0.045 + 0.085 * f;
        const pt = new THREE.Vector3(p.x + Math.cos(angle) * r, p.y, p.z + Math.sin(angle) * r);
        wirePoints.push(pt);
        if (k % 2 === 1) bulbPositions.push(pt);
      }
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePoints), samples * 3, 0.0011, 4, false),
        fairyWireMat
      );
      wire.name = `familyRoom.neCornerPlant.fairyLights.wire.${idx + 1}`;
      nePlantGroup.add(wire);
    });

    const fairyBulbs = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.0055, 6, 5),
      fairyBulbMat,
      bulbPositions.length
    );
    fairyBulbs.name = 'familyRoom.neCornerPlant.fairyLights.bulbs';
    const bulbMatrix = new THREE.Matrix4();
    bulbPositions.forEach((pt, i) => {
      bulbMatrix.makeTranslation(pt.x, pt.y, pt.z);
      fairyBulbs.setMatrixAt(i, bulbMatrix);
    });
    fairyBulbs.instanceMatrix.needsUpdate = true;
    nePlantGroup.add(fairyBulbs);
    interactions.registerLightFixture(fairyBulbs, 'diningFairyLights');
    ctx.addGlowPool('diningFairyLights', -4.92, 0.012, -2.18, 0.72, 0.18);
  }
  scene.add(nePlantGroup);

  // Framed Black-and-White Family Portrait on the West Slate-Blue Alcove Wall
  // (X = -7.79m, Y = 1.349m, Z = -1.48m — PH-54, PH-55, PH-56; lowered ΔY = -0.151m per Issue #1)
  const bwFrameGroup = new THREE.Group();
  bwFrameGroup.name = 'familyRoom.alcovePortrait';
  bwFrameGroup.userData.zone = 'familyRoom';
  bwFrameGroup.position.set(-7.79, 1.349, -1.48);
  bwFrameGroup.rotation.y = Math.PI / 2;

  const distressedFrameMat = new THREE.MeshStandardMaterial({
    color: 0x9b8e7e,
    roughness: 0.62,
  });
  const bwOuterFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.5, 0.028),
    distressedFrameMat
  );
  if (!bwOuterFrame.name) bwOuterFrame.name = 'familyRoom.eastFireplace.bwOuterFrame';
  bwOuterFrame.castShadow = true;
  bwFrameGroup.add(bwOuterFrame);

  const bwMount = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.42, 0.032),
    ceramicWhiteMat
  );
  if (!bwMount.name) bwMount.name = 'familyRoom.eastFireplace.bwMount';
  bwFrameGroup.add(bwMount);

  const bwPhotoMat = new THREE.MeshStandardMaterial({
    color: 0x424448,
    roughness: 0.35,
  });
  const bwPhoto = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.26, 0.035),
    bwPhotoMat
  );
  if (!bwPhoto.name) bwPhoto.name = 'familyRoom.eastFireplace.bwPhoto';
  bwFrameGroup.add(bwPhoto);
  scene.add(bwFrameGroup);

  // 1F. White-Plastered East Chimney Breast & Recessed Fireplace Alcove
  //     (Issue #12 & Issue #4: X = -4.96m..-4.64m, centered at X = -4.80m, Z = -0.85m..+0.85m so the South pier
  //      is 100% flush with the Z = +0.85m North jamb of the Kitchen <-> Dining Room portal)
  //     Extends all the way up to Y = 3.00m (flush with the Kitchen cross-wall and continuing into the 1st Floor stack!)
  const chimneyStackGroundH = 3.0;
  const addChimneyWallBlock = (
    cx: number,
    cy: number,
    cz: number,
    w: number,
    h: number,
    d: number
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crispWhiteWallMat);
    mesh.name = 'familyRoom.chimneyWallPier';
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };

  // Left (North) chimney pier (Z = -0.85m..-0.44m, depth 0.41m, width 0.32m)
  addChimneyWallBlock(-4.8, chimneyStackGroundH / 2, -0.645, 0.32, chimneyStackGroundH, 0.41);
  // Right (South) chimney pier (Z = +0.40m..+0.85m, depth 0.45m, width 0.32m — flush with Kitchen portal North jamb at Z = +0.85m)
  addChimneyWallBlock(-4.8, chimneyStackGroundH / 2, 0.625, 0.32, chimneyStackGroundH, 0.45);
  // Upper chimney breast lintel wall above the recessed fireplace opening (Y = 1.26m..3.00m, Z = -0.44m..+0.40m)
  addChimneyWallBlock(
    -4.8,
    1.26 + (chimneyStackGroundH - 1.26) / 2,
    -0.02,
    0.32,
    chimneyStackGroundH - 1.26,
    0.84
  );

  // White-plastered back wall of the fireplace alcove integrated flush at X = -4.64m (Y = 0..1.26m, Z = -0.44m..+0.40m)
  const alcoveBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 1.26, 0.84),
    crispWhiteWallMat
  );
  alcoveBackWall.name = 'familyRoom.chimneyWallAlcoveBack';
  alcoveBackWall.position.set(-4.652, 0.63, -0.02);
  alcoveBackWall.receiveShadow = true;
  scene.add(alcoveBackWall);

  // Issue #2: Round Mirror (`familyRoom.eastFireplaceMirror`) on the West face of the East Fireplace Chimney Breast
  // Centered at X = -4.96m, Y = 1.60m, Z = -0.02m (moved down & slightly smaller to sit centered between the 1.26m lintel and 1.94m joists)
  {
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = 'familyRoom.eastFireplaceMirror';
    mirrorGroup.userData.zone = 'familyRoom';
    mirrorGroup.position.set(-4.96, 1.6, -0.02);
    mirrorGroup.rotation.y = -Math.PI / 2; // Local +Z projects West (-X) into the Dining Room

    const mirrorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x6b5235, // Aged antique bronze-brass frame
      roughness: 0.32,
      metalness: 0.78,
    });
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xe6edf2,
      roughness: 0.04,
      metalness: 0.94,
    });
    const mirrorBackMat = new THREE.MeshStandardMaterial({
      color: 0x2a2622,
      roughness: 0.78,
    });

    const outerR = 0.255;
    const innerR = 0.23;

    // Circular backing board
    const backDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(outerR - 0.006, outerR - 0.006, 0.008, 40),
      mirrorBackMat
    );
    backDisc.name = 'familyRoom.eastFireplaceMirror.backing';
    backDisc.rotation.x = Math.PI / 2;
    backDisc.position.set(0, 0, 0.004);
    mirrorGroup.add(backDisc);

    // Deep spun aged-brass cylinder rim band
    const rimBand = new THREE.Mesh(
      new THREE.CylinderGeometry(outerR, outerR, 0.028, 40, 1, true),
      mirrorFrameMat
    );
    rimBand.name = 'familyRoom.eastFireplaceMirror.rimBand';
    rimBand.rotation.x = Math.PI / 2;
    rimBand.position.set(0, 0, 0.014);
    rimBand.castShadow = true;
    mirrorGroup.add(rimBand);

    // Front moulded circular frame ring
    const frontRing = new THREE.Mesh(
      new THREE.TorusGeometry((outerR + innerR) * 0.5, (outerR - innerR) * 0.52, 16, 44),
      mirrorFrameMat
    );
    frontRing.name = 'familyRoom.eastFireplaceMirror.frame';
    frontRing.position.set(0, 0, 0.024);
    frontRing.castShadow = true;
    mirrorGroup.add(frontRing);

    // Inner bevelled sight-edge bead
    const innerBead = new THREE.Mesh(
      new THREE.TorusGeometry(innerR, 0.0045, 10, 44),
      brassMat
    );
    innerBead.name = 'familyRoom.eastFireplaceMirror.bezel';
    innerBead.position.set(0, 0, 0.021);
    mirrorGroup.add(innerBead);

    // Reflective bevelled round mirror glass disc
    const glassDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(innerR, innerR, 0.006, 40),
      mirrorGlassMat
    );
    glassDisc.name = 'familyRoom.eastFireplaceMirror.glass';
    glassDisc.rotation.x = Math.PI / 2;
    glassDisc.position.set(0, 0, 0.016);
    mirrorGroup.add(glassDisc);

    scene.add(mirrorGroup);
  }

  // Issues #4 & #5: Continuous 45°-mitred antique oak skirting board wrapping cleanly around:
  //   - Snug East wall (`X = -4.656m, Z = -2.482m..-0.85m`)
  //   - Left (North) chimney pier North return (`Z = -0.85m`), West face (`X = -4.96m`), and North alcove reveal (`Z = -0.44m`)
  //   - Fireplace alcove back wall (`X = -4.664m, Z = -0.44m..+0.40m`)
  //   - Right (South) chimney pier South alcove reveal (`Z = +0.40m`), West face (`X = -4.96m`), and South portal jamb (`Z = +0.852m, X = -4.96m..-4.40m`)
  //   - Kitchen West wall return (`X = -4.40m, Z = +0.852m..+0.53m` up to the Integrated Fridge-Freezer)
  const eastChimneySkirting = new THREE.Mesh(
    buildMitredWallSkirtingGeometry([
      [-4.656, -2.482],
      [-4.656, -0.85],
      [-4.96, -0.85],
      [-4.96, -0.44],
      [-4.664, -0.44],
      [-4.664, 0.4],
      [-4.96, 0.4],
      [-4.96, 0.852],
      [-4.4, 0.852],
      [-4.4, 0.53],
    ]),
    antiqueOakSkirtingMat
  );
  eastChimneySkirting.name = 'familyRoom.eastChimneySkirting';
  eastChimneySkirting.castShadow = true;
  eastChimneySkirting.receiveShadow = true;
  scene.add(eastChimneySkirting);

  // Issue #9: Herringbone terracotta quarry tile floor (`familyFloor`) extends continuously
  // right into the fireplace hearth alcove with no separate hearth slab or material change.

  // Issue #13 & Issue #4: Interior Plastered Wall Pier on the South Jamb of the Open Kitchen Portal
  // (X = -4.64m..-4.402m, Z = +1.99m..+2.35m — flush with the Kitchen South interior wall at Z = +1.99m!)
  addChimneyWallBlock(-4.521, chimneyStackGroundH / 2, 2.17, 0.238, chimneyStackGroundH, 0.36);

}
