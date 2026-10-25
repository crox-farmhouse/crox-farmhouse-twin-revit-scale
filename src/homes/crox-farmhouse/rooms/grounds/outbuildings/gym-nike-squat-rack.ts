import * as THREE from 'three';
import type { SceneInteractionManager } from '../../../../../engine/interaction/interaction-manager.ts';
import {
  GymBenchPressController,
  type JCupMeshEntry,
} from '../../../../../objects/gym/bench-press-interaction.ts';
/**
 * Generates a high-resolution (`512x512`) solid-color **Nike Pro Bumper Plate** face texture
 * (`450mm` IWF competition/training specification) with solid vibrant urethane color, raised outer
 * collar ring shading, two opposing Nike Swooshes, bold `NIKE` wordmark, and weight numerals (`LB` / `KG`).
 */
const cachedNikeProBumperPlateTextures = new Map<string, THREE.CanvasTexture>();

export function createNikeProBumperPlateTexture(
  weightLb: number,
  weightKg: number,
  baseHex: string,
  darkRimHex: string,
  textHex: string
): THREE.CanvasTexture {
  const cacheKey = `${weightLb}_${weightKg}_${baseHex}_${darkRimHex}_${textHex}`;
  const cached = cachedNikeProBumperPlateTextures.get(cacheKey);
  if (cached) {
    return cached;
  }
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size * 0.5;
  const cy = size * 0.5;

  // Solid base fill
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle recessed inner dish vs raised outer lip ring & center hub boss
  ctx.strokeStyle = darkRimHex;
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, 228, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 206, 0, Math.PI * 2);
  ctx.stroke();

  // Inner moulded ring around steel hub
  ctx.strokeStyle = darkRimHex;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.stroke();

  // Draw Nike Swoosh helper
  const drawSwoosh = (x: number, y: number, rot: number, scale: number): void => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.fillStyle = textHex;
    ctx.beginPath();
    ctx.moveTo(-24, -14);
    ctx.quadraticCurveTo(-38, 16, -15, 22);
    ctx.quadraticCurveTo(8, 27, 38, -14);
    ctx.quadraticCurveTo(-2, 10, -15, 5);
    ctx.quadraticCurveTo(-26, 0, -24, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Top & Bottom Nike Swooshes (matching `media_1791212146142_7b2838ce.png`)
  drawSwoosh(cx, cy - 146, 0, 1.15);
  drawSwoosh(cx, cy + 146, Math.PI, 1.15);

  // Left & Right bold weight markings (`45 LB` / `20 KG`)
  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Right side (`+x`): weight in LB
  ctx.save();
  ctx.translate(cx + 146, cy);
  ctx.font = '900 44px Impact, Arial Black, sans-serif';
  ctx.fillText(String(weightLb), 0, -14);
  ctx.font = '800 22px Arial, sans-serif';
  ctx.fillText('LB', 0, 20);
  ctx.restore();

  // Left side (`-x`): weight in KG + NIKE
  ctx.save();
  ctx.translate(cx - 146, cy);
  ctx.font = '900 38px Impact, Arial Black, sans-serif';
  ctx.fillText(String(weightKg), 0, -14);
  ctx.font = '800 20px Arial, sans-serif';
  ctx.fillText('KG', 0, 18);
  ctx.restore();

  // Stainless steel center hub ring in texture center
  const hubGrad = ctx.createRadialGradient(cx - 12, cy - 12, 6, cx, cy, 76);
  hubGrad.addColorStop(0, '#f4f7fb');
  hubGrad.addColorStop(0.65, '#c8d0da');
  hubGrad.addColorStop(1, '#8c949e');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.fill();

  // Dark center 50mm Olympic collar bore
  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedNikeProBumperPlateTextures.set(cacheKey, tex);
  return tex;
}

/**
 * Generates the vertical `NIKE EST. 1972` white stencil decal texture for the front upright
 * of the Nike Strength Squat Cage (`media_1791212146142_7b2838ce.png`).
 */
let cachedNikeUprightStencilTexture: THREE.CanvasTexture | null = null;

export function createNikeUprightStencilTexture(): THREE.CanvasTexture {
  if (cachedNikeUprightStencilTexture) {
    return cachedNikeUprightStencilTexture;
  }
  const w = 128;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1a1d21';
  ctx.fillRect(0, 0, w, h);

  // Vertical laser-cut Westside hole dots along the center line
  ctx.fillStyle = '#0b0d0f';
  for (let y = 260; y < h - 16; y += 22) {
    ctx.beginPath();
    ctx.arc(w * 0.5, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bold vertical white `NIKE` + `EST. 1972` stencil near the top (`y = 40..230`)
  ctx.save();
  ctx.translate(w * 0.5, 135);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#f0f4f8';
  ctx.font = '900 52px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NIKE', 0, -10);
  ctx.font = '700 15px Arial, sans-serif';
  ctx.fillText('EST. 1972', 0, 26);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedNikeUprightStencilTexture = tex;
  return tex;
}

/**
 * Builds the **Nike Strength Squat Cage / Power Rack, Nike Flat Workout Bench, Crimson-Red Nike
 * Olympic Barbell, and Solid-Color Nike Pro Bumper Plates** (`outbuildings.gym.nikeSquatRack`),
 * matching `media_1791212146142_7b2838ce.png` with solid-color Pro competition bumper plates:
 * - Red (`55 LB / 25 KG`, `#c62828`)
 * - Blue (`45 LB / 20 KG`, `#1554ad`)
 * - Yellow (`35 LB / 15 KG`, `#e6a810`)
 * - Green (`25 LB / 10 KG`, `#1b7a3e`)
 * - Black (`10 LB / 5 KG`, `#1e2228`)
 */
export function buildGymNikeSquatRack(
  groundGroup: THREE.Group,
  gymFloorY: number,
  interactions?: SceneInteractionManager
): GymBenchPressController | null {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.gym.nikeSquatRack';
  rackGroup.userData.zone = 'courtyard';
  // Positioned in the Gym South-West bay (`u = 1.52m, v = 4.02m`) facing North (`-v`, `rotation.y = Math.PI`),
  // shifted forward away from the South wall (`v = 5.43m`) so a spotter can comfortably stand behind the rack!
  rackGroup.position.set(1.52, gymFloorY, 4.02);
  rackGroup.rotation.y = Math.PI;
  groundGroup.add(rackGroup);

  const powderBlackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d21,
    roughness: 0.44,
    metalness: 0.58,
  });
  const uhmwPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.72,
    metalness: 0.08,
  });
  const zincBoltMat = new THREE.MeshStandardMaterial({
    color: 0xe2e7ee,
    roughness: 0.18,
    metalness: 0.92,
  });
  const chromeHubMat = new THREE.MeshStandardMaterial({
    color: 0xdce2ea,
    roughness: 0.16,
    metalness: 0.94,
  });
  const blackOxideSleeveMat = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.3,
    metalness: 0.82,
  });
  const crimsonCerakoteShaftMat = new THREE.MeshStandardMaterial({
    color: 0xd13224,
    roughness: 0.34,
    metalness: 0.42,
  });
  const whiteDecalMat = new THREE.MeshStandardMaterial({
    color: 0xf4f7fa,
    roughness: 0.3,
    metalness: 0.1,
  });
  const benchPadVinylMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.52,
    metalness: 0.06,
  });
  const uprightStencilMat = new THREE.MeshStandardMaterial({
    map: createNikeUprightStencilTexture(),
    roughness: 0.44,
    metalness: 0.55,
  });

  // Solid-Color Nike Pro Bumper Plate Specs (IWF Competition Color Coding)
  interface ProPlateSpec {
    readonly weightLb: number;
    readonly weightKg: number;
    readonly radius: number;
    readonly thickness: number;
    readonly sideMat: THREE.MeshStandardMaterial;
    readonly faceMat: THREE.MeshStandardMaterial;
  }

  const makeProPlateSpec = (
    weightLb: number,
    weightKg: number,
    thickness: number,
    colorHex: number,
    baseCss: string,
    darkRimCss: string,
    textCss: string
  ): ProPlateSpec => {
    const faceTex = createNikeProBumperPlateTexture(
      weightLb,
      weightKg,
      baseCss,
      darkRimCss,
      textCss
    );
    return {
      weightLb,
      weightKg,
      radius: 0.225, // 450mm IWF standard diameter
      thickness,
      sideMat: new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.48,
        metalness: 0.05,
      }),
      faceMat: new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.46,
        metalness: 0.06,
      }),
    };
  };

  const plate10LbBlack = makeProPlateSpec(10, 5, 0.028, 0x1e2228, '#1e2228', '#101216', '#f2f5f8');
  const plate25LbGreen = makeProPlateSpec(25, 10, 0.044, 0x1b7a3e, '#1b7a3e', '#115228', '#f4f8f5');
  const plate35LbYellow = makeProPlateSpec(35, 15, 0.056, 0xe6a810, '#e6a810', '#b07d08', '#15181c');
  const plate45LbBlue = makeProPlateSpec(45, 20, 0.066, 0x1554ad, '#1554ad', '#0d3875', '#f4f8ff');
  const plate55LbRed = makeProPlateSpec(55, 25, 0.076, 0xc62828, '#c62828', '#8a1818', '#fff5f5');

  // Helper to spawn a single solid-color Nike Pro Bumper Plate whose axis is along `X`
  const addProBumperPlateOnAxisX = (
    parent: THREE.Object3D,
    spec: ProPlateSpec,
    xCenter: number,
    yCenter: number,
    zCenter: number,
    name: string
  ): void => {
    const pGroup = new THREE.Group();
    pGroup.name = name;
    pGroup.position.set(xCenter, yCenter, zCenter);
    parent.add(pGroup);

    // CylinderGeometry material groups: `[side, top (+Y), bottom (-Y)]`
    const plateMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(spec.radius, spec.radius, spec.thickness, 32),
      [spec.sideMat, spec.faceMat, spec.faceMat]
    );
    plateMesh.name = `${name}.disc`;
    plateMesh.rotation.z = Math.PI / 2;
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    pGroup.add(plateMesh);

    // Raised Competition Stainless-Steel Center Hub Insert (`r = 0.068m`)
    const steelHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, spec.thickness + 0.007, 24),
      chromeHubMat
    );
    steelHub.name = `${name}.steelHub`;
    steelHub.userData.lodTier = 'high';
    steelHub.userData.lodMaxDistance = 12;
    steelHub.rotation.z = Math.PI / 2;
    pGroup.add(steelHub);
  };

  // ---------------------------------------------------------------------------
  // 1. Base Stabilizer Skids, Rear Crossmember, Gusset Plates & Molded End Boots
  // ---------------------------------------------------------------------------
  const uprightSize = 0.075; // 3"x3" (75mm) 11-gauge steel posts
  const rackHalfW = 0.56; // Center-to-center X span = 1.12m (`1.20m` outer width)
  const zRearUpright = -0.34;
  const zFrontUpright = 0.34;
  const zSkidBack = -0.44;
  const zSkidFront = 0.82;
  const skidLen = zSkidFront - zSkidBack; // 1.26m
  const skidCenterZ = (zSkidBack + zSkidFront) * 0.5; // +0.19m
  const rackH = 2.24;

  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const ux = sideX * rackHalfW;

    // Long bottom floor stabilizer rail (`75mm x 75mm x 1.26m`)
    const baseSkid = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, uprightSize, skidLen),
      powderBlackSteelMat
    );
    baseSkid.name = `outbuildings.gym.nikeSquatRack.baseSkid.${sideTag}`;
    baseSkid.position.set(ux, uprightSize * 0.5, skidCenterZ);
    baseSkid.castShadow = true;
    baseSkid.receiveShadow = true;
    rackGroup.add(baseSkid);

    // Sloped black polymer front end boot (`z = +0.82..+0.91m`) matching reference photo
    const frontBoot = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize + 0.016, uprightSize + 0.006, 0.11),
      uhmwPlasticMat
    );
    frontBoot.name = `outbuildings.gym.nikeSquatRack.frontBoot.${sideTag}`;
    frontBoot.userData.lodTier = 'high';
    frontBoot.userData.lodMaxDistance = 12;
    frontBoot.position.set(ux, uprightSize * 0.48, zSkidFront + 0.035);
    frontBoot.rotation.x = 0.18;
    rackGroup.add(frontBoot);

    // Floor anchor foot flanges under rear and front uprights
    for (const fz of [zRearUpright, zFrontUpright] as const) {
      const floorPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.145, 0.008, 0.145),
        powderBlackSteelMat
      );
      floorPlate.name = `outbuildings.gym.nikeSquatRack.floorAnchorPlate.${sideTag}.${fz < 0 ? 'rear' : 'front'}`;
      floorPlate.userData.lodTier = 'high';
      floorPlate.userData.lodMaxDistance = 12;
      floorPlate.position.set(ux, 0.004, fz);
      rackGroup.add(floorPlate);
    }

    // Rear Upright (`z = -0.34m, y = 0.075..2.20m`)
    const rearPost = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, rackH - 0.04, uprightSize),
      powderBlackSteelMat
    );
    rearPost.name = 'outbuildings.gym.nikeSquatRack.upright';
    rearPost.position.set(ux, (rackH - 0.04) * 0.5 + 0.04, zRearUpright);
    rearPost.castShadow = true;
    rearPost.receiveShadow = true;
    rackGroup.add(rearPost);

    // Front Upright (`z = +0.34m, y = 0.075..2.24m`)
    const frontPost = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, rackH, uprightSize),
      powderBlackSteelMat
    );
    frontPost.name = 'outbuildings.gym.nikeSquatRack.upright';
    frontPost.position.set(ux, rackH * 0.5 + 0.02, zFrontUpright);
    frontPost.castShadow = true;
    frontPost.receiveShadow = true;
    rackGroup.add(frontPost);

    // Vertical `NIKE EST. 1972` graphic panel near the top of the front-left upright (`sideX = -1`)
    if (sideX === -1) {
      const stencilPlaques = new THREE.Mesh(
        new THREE.PlaneGeometry(uprightSize - 0.004, 0.36),
        uprightStencilMat
      );
      stencilPlaques.name = 'outbuildings.gym.nikeSquatRack.uprightStencilPlaque';
      stencilPlaques.userData.lodTier = 'high';
      stencilPlaques.userData.lodMaxDistance = 12;
      stencilPlaques.position.set(ux, 1.88, zFrontUpright + uprightSize * 0.5 + 0.0035);
      rackGroup.add(stencilPlaques);
    }

    // Upper Side Crossmember connecting Rear and Front Uprights (`y = 2.13m`)
    const topSideCross = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, uprightSize, zFrontUpright - zRearUpright - uprightSize),
      powderBlackSteelMat
    );
    topSideCross.name = `outbuildings.gym.nikeSquatRack.topSideCrossmember.${sideTag}`;
    topSideCross.position.set(ux, 2.13, 0);
    topSideCross.castShadow = true;
    rackGroup.add(topSideCross);

    // Triangular Gusset Plates & Silver Hex Bolts at base & top joints
    for (const gz of [zRearUpright, zFrontUpright] as const) {
      const posTag = gz < 0 ? 'rear' : 'front';
      const gusset = new THREE.Mesh(
        new THREE.BoxGeometry(uprightSize + 0.012, 0.16, 0.16),
        powderBlackSteelMat
      );
      gusset.name = `outbuildings.gym.nikeSquatRack.cornerGusset.${sideTag}.${posTag}`;
      gusset.userData.lodTier = 'high';
      gusset.userData.lodMaxDistance = 12;
      gusset.position.set(ux, 0.12, gz + (gz > 0 ? 0.05 : -0.05));
      gusset.rotation.x = Math.PI / 4;
      rackGroup.add(gusset);

      let boltIdx = 0;
      for (const by of [0.11, 0.18, 2.09, 2.16] as const) {
        boltIdx++;
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, uprightSize + 0.022, 6),
          zincBoltMat
        );
        bolt.name = `outbuildings.gym.nikeSquatRack.frameBolt.${sideTag}.${posTag}.${boltIdx}`;
        bolt.userData.lodTier = 'high';
        bolt.userData.lodMaxDistance = 12;
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(ux, by, gz);
        rackGroup.add(bolt);
      }
    }
  }

  // Rear Bottom & Rear Upper Crossmembers (`x = -0.56..+0.56m, z = -0.34m`)
  for (const cy of [0.06, 2.09] as const) {
    const rearCross = new THREE.Mesh(
      new THREE.BoxGeometry(rackHalfW * 2 - uprightSize, uprightSize, uprightSize),
      powderBlackSteelMat
    );
    rearCross.name = `outbuildings.gym.nikeSquatRack.rearCrossmember.${cy < 1 ? 'lower' : 'upper'}`;
    rearCross.position.set(0, cy, zRearUpright);
    rearCross.castShadow = true;
    rackGroup.add(rearCross);
  }

  // Front Upper Knurled Pull-Up Bar (`32mm` tube at `y = 2.16m, z = +0.34m`)
  const pullupBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, rackHalfW * 2 - uprightSize, 20),
    powderBlackSteelMat
  );
  pullupBar.name = 'outbuildings.gym.nikeSquatRack.pullupBar';
  pullupBar.rotation.z = Math.PI / 2;
  pullupBar.position.set(0, 2.16, zFrontUpright);
  pullupBar.castShadow = true;
  rackGroup.add(pullupBar);

  // ---------------------------------------------------------------------------
  // 2. 8 Bolt-On Weight Storage Horns & Solid-Color Nike Pro Bumper Plates
  // ---------------------------------------------------------------------------
  const hornTiers = [
    { y: 1.76, spec: plate10LbBlack, count: 2 },
    { y: 1.28, spec: plate25LbGreen, count: 2 },
    { y: 0.78, spec: plate35LbYellow, count: 2 },
    { y: 0.28, spec: plate55LbRed, count: 1 },
  ] as const;

  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const outerUprightFaceX = sideX * (rackHalfW + uprightSize * 0.5);
    for (const tier of hornTiers) {
      const hornPrefix = `outbuildings.gym.nikeSquatRack.storageHorn.${sideTag}.${tier.spec.weightLb}lb`;
      // Mounting flange plate on rear upright with 2 silver hex bolts
      const hornFlange = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.13, 0.068),
        powderBlackSteelMat
      );
      hornFlange.name = `${hornPrefix}.flange`;
      hornFlange.userData.lodTier = 'high';
      hornFlange.userData.lodMaxDistance = 12;
      hornFlange.position.set(outerUprightFaceX + sideX * 0.006, tier.y, zRearUpright);
      rackGroup.add(hornFlange);

      for (const dy of [-0.042, 0.042] as const) {
        const hBolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, 0.02, 6),
          zincBoltMat
        );
        hBolt.name = `${hornPrefix}.bolt.${dy < 0 ? 'lower' : 'upper'}`;
        hBolt.userData.lodTier = 'high';
        hBolt.userData.lodMaxDistance = 12;
        hBolt.rotation.z = Math.PI / 2;
        hBolt.position.set(outerUprightFaceX + sideX * 0.012, tier.y + dy, zRearUpright);
        rackGroup.add(hBolt);
      }

      // Rubber donut bumper stop against the flange
      const rubberStop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.018, 16),
        uhmwPlasticMat
      );
      rubberStop.name = `${hornPrefix}.rubberStop`;
      rubberStop.userData.lodTier = 'high';
      rubberStop.userData.lodMaxDistance = 12;
      rubberStop.rotation.z = Math.PI / 2;
      rubberStop.position.set(outerUprightFaceX + sideX * 0.02, tier.y, zRearUpright);
      rackGroup.add(rubberStop);

      // 49mm black UHMW weight storage pin (`0.26m` long)
      const hornLen = 0.26;
      const hornPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, hornLen, 18),
        uhmwPlasticMat
      );
      hornPin.name = `${hornPrefix}.pin`;
      hornPin.rotation.z = Math.PI / 2;
      hornPin.position.set(outerUprightFaceX + sideX * (0.02 + hornLen * 0.5), tier.y, zRearUpright);
      hornPin.castShadow = true;
      rackGroup.add(hornPin);

      // Stack the Solid-Color Nike Pro Bumper Plates onto the storage horn!
      let offsetFromStop = 0.032;
      for (let c = 0; c < tier.count; c++) {
        const px =
          outerUprightFaceX +
          sideX * (offsetFromStop + tier.spec.thickness * 0.5);
        addProBumperPlateOnAxisX(
          rackGroup,
          tier.spec,
          px,
          tier.y,
          zRearUpright,
          `outbuildings.gym.nikeSquatRack.proBumperPlate.${tier.spec.weightLb}lb`
        );
        offsetFromStop += tier.spec.thickness + 0.006;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Heavy-Duty J-Cups, Crimson-Red Nike Olympic Barbell & Loaded Pro Plates
  // ---------------------------------------------------------------------------
  const barY = 1.29;
  const barZ = zFrontUpright + uprightSize * 0.5 + 0.048;
  const jCupMeshes: JCupMeshEntry[] = [];

  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const ux = sideX * rackHalfW;
    // J-cup vertical backplate + lower hook cradle + front lip
    const jBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.17, 0.016),
      uhmwPlasticMat
    );
    jBack.name = `outbuildings.gym.nikeSquatRack.jCup.${sideTag}.backplate`;
    jBack.userData.lodTier = 'high';
    jBack.userData.lodMaxDistance = 12;
    jBack.position.set(ux, barY + 0.02, zFrontUpright + uprightSize * 0.5 + 0.008);
    rackGroup.add(jBack);
    jCupMeshes.push({ mesh: jBack, restY: jBack.position.y });

    const jBottom = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.018, 0.082),
      uhmwPlasticMat
    );
    jBottom.name = `outbuildings.gym.nikeSquatRack.jCup.${sideTag}.cradleBase`;
    jBottom.userData.lodTier = 'high';
    jBottom.userData.lodMaxDistance = 12;
    jBottom.position.set(ux, barY - 0.028, barZ);
    rackGroup.add(jBottom);
    jCupMeshes.push({ mesh: jBottom, restY: jBottom.position.y });

    const jFrontLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.052, 0.016),
      uhmwPlasticMat
    );
    jFrontLip.name = `outbuildings.gym.nikeSquatRack.jCup.${sideTag}.frontLip`;
    jFrontLip.userData.lodTier = 'high';
    jFrontLip.userData.lodMaxDistance = 12;
    jFrontLip.position.set(ux, barY - 0.01, barZ + 0.038);
    rackGroup.add(jFrontLip);
    jCupMeshes.push({ mesh: jFrontLip, restY: jFrontLip.position.y });
  }

  // Crimson-Red Cerakote 20kg Nike Olympic Barbell (`2.20m` total length)
  const barbellGroup = new THREE.Group();
  barbellGroup.name = 'outbuildings.gym.nikeSquatRack.barbell';
  barbellGroup.position.set(0, barY, barZ);
  rackGroup.add(barbellGroup);

  // 28.5mm Crimson-Red Cerakote Shaft (`1.31m` inner shaft length)
  const barShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0145, 0.0145, 1.31, 20),
    crimsonCerakoteShaftMat
  );
  barShaft.name = 'outbuildings.gym.nikeSquatRack.barbell.shaft';
  barShaft.rotation.z = Math.PI / 2;
  barShaft.castShadow = true;
  barbellGroup.add(barShaft);

  // Center white Nike logo band on the crimson barbell shaft
  const centerLogoBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0149, 0.0149, 0.065, 18),
    whiteDecalMat
  );
  centerLogoBand.name = 'outbuildings.gym.nikeSquatRack.barbell.centerLogoBand';
  centerLogoBand.userData.lodTier = 'high';
  centerLogoBand.userData.lodMaxDistance = 12;
  centerLogoBand.rotation.z = Math.PI / 2;
  barbellGroup.add(centerLogoBand);

  // Left & Right 50mm Black-Oxide Loadable Olympic Sleeves + Loaded Solid-Color Pro Plates (45 LB Blue + 25 LB Green per side!)
  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    // Sleeve collar shoulder (`x = ±0.668m`)
    const collarFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.028, 20),
      blackOxideSleeveMat
    );
    collarFlange.name = `outbuildings.gym.nikeSquatRack.barbell.sleeveCollar.${sideTag}`;
    collarFlange.rotation.z = Math.PI / 2;
    collarFlange.position.set(sideX * 0.668, 0, 0);
    barbellGroup.add(collarFlange);

    // 50mm rotating sleeve (`0.415m` long)
    const sleeveLen = 0.415;
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0248, 0.0248, sleeveLen, 20),
      blackOxideSleeveMat
    );
    sleeve.name = `outbuildings.gym.nikeSquatRack.barbell.sleeve.${sideTag}`;
    sleeve.rotation.z = Math.PI / 2;
    sleeve.position.set(sideX * (0.682 + sleeveLen * 0.5), 0, 0);
    sleeve.castShadow = true;
    barbellGroup.add(sleeve);

    // Crimson red end-cap on sleeve tip
    const endCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.008, 16),
      crimsonCerakoteShaftMat
    );
    endCap.name = `outbuildings.gym.nikeSquatRack.barbell.sleeveEndCap.${sideTag}`;
    endCap.userData.lodTier = 'high';
    endCap.userData.lodMaxDistance = 12;
    endCap.rotation.z = Math.PI / 2;
    endCap.position.set(sideX * (0.682 + sleeveLen + 0.002), 0, 0);
    barbellGroup.add(endCap);

    // Load 1x Solid Blue 45 LB (20 KG) Pro Plate + 1x Solid Green 25 LB (10 KG) Pro Plate onto each sleeve!
    const blueX = sideX * (0.684 + plate45LbBlue.thickness * 0.5);
    addProBumperPlateOnAxisX(
      barbellGroup,
      plate45LbBlue,
      blueX,
      0,
      0,
      'outbuildings.gym.nikeSquatRack.proBumperPlate.45lb'
    );

    const greenX =
      sideX *
      (0.684 + plate45LbBlue.thickness + 0.004 + plate25LbGreen.thickness * 0.5);
    addProBumperPlateOnAxisX(
      barbellGroup,
      plate25LbGreen,
      greenX,
      0,
      0,
      'outbuildings.gym.nikeSquatRack.proBumperPlate.25lb'
    );

    // Olympic Lock-Jaw Barbell Collar outside the green plate
    const lockCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.038, 18),
      uhmwPlasticMat
    );
    lockCollar.name = `outbuildings.gym.nikeSquatRack.barbell.lockJawCollar.${sideTag}`;
    lockCollar.userData.lodTier = 'high';
    lockCollar.userData.lodMaxDistance = 12;
    lockCollar.rotation.z = Math.PI / 2;
    lockCollar.position.set(
      sideX *
        (0.684 +
          plate45LbBlue.thickness +
          plate25LbGreen.thickness +
          0.028),
      0,
      0
    );
    barbellGroup.add(lockCollar);
  }

  // ---------------------------------------------------------------------------
  // 4. Nike Strength Flat Competition Workout Bench (`outbuildings.gym.nikeSquatRack.bench`)
  //    (Positioned in front of the rack, angled slightly matching `media_1791212146142_7b2838ce.png`)
  // ---------------------------------------------------------------------------
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.gym.nikeSquatRack.bench';
  benchGroup.position.set(0.18, 0, 0.86);
  benchGroup.rotation.y = 0.06;
  rackGroup.add(benchGroup);

  const padL = 1.22;
  const padW = 0.305;
  const padT = 0.068;
  const benchH = 0.44;

  // Cushioned matte-black competition bench pad (`y = 0.406..0.474m`)
  const benchPad = new THREE.Mesh(
    new THREE.BoxGeometry(padW, padT, padL),
    benchPadVinylMat
  );
  benchPad.name = 'outbuildings.gym.nikeSquatRack.bench.pad';
  benchPad.position.set(0, benchH - padT * 0.5, 0);
  benchPad.castShadow = true;
  benchPad.receiveShadow = true;
  benchGroup.add(benchPad);

  // Horizontal steel spine under the pad (`75mm x 50mm`)
  const benchSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.052, padL - 0.14),
    powderBlackSteelMat
  );
  benchSpine.name = 'outbuildings.gym.nikeSquatRack.bench.spine';
  benchSpine.position.set(0, benchH - padT - 0.026, 0);
  benchSpine.castShadow = true;
  benchGroup.add(benchSpine);

  // Rear vertical support post (`z = -0.38m`) + wide rear stabilizer T-foot (`0.48m` wide) with transport wheels
  const rearBenchPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, benchH - padT - 0.06, 0.075),
    powderBlackSteelMat
  );
  rearBenchPost.name = 'outbuildings.gym.nikeSquatRack.bench.rearPost';
  rearBenchPost.position.set(0, (benchH - padT) * 0.5, -0.38);
  rearBenchPost.castShadow = true;
  benchGroup.add(rearBenchPost);

  const rearBenchFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.062, 0.095),
    powderBlackSteelMat
  );
  rearBenchFoot.name = 'outbuildings.gym.nikeSquatRack.bench.rearStabilizerFoot';
  rearBenchFoot.position.set(0, 0.031, -0.38);
  rearBenchFoot.castShadow = true;
  benchGroup.add(rearBenchFoot);

  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const bootCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.072, 0.11),
      uhmwPlasticMat
    );
    bootCap.name = `outbuildings.gym.nikeSquatRack.bench.rearFootBoot.${sideTag}`;
    bootCap.userData.lodTier = 'high';
    bootCap.userData.lodMaxDistance = 12;
    bootCap.position.set(sideX * 0.21, 0.036, -0.38);
    benchGroup.add(bootCap);

    const rearWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.024, 16),
      uhmwPlasticMat
    );
    rearWheel.name = `outbuildings.gym.nikeSquatRack.bench.transportWheel.${sideTag}`;
    rearWheel.userData.lodTier = 'high';
    rearWheel.userData.lodMaxDistance = 12;
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(sideX * 0.14, 0.032, -0.45);
    benchGroup.add(rearWheel);
  }

  // Raked front tripod post (`z = +0.44m`) with rubber foot pad and vertical knurled transport handle
  const frontBenchPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, benchH - padT - 0.02, 0.075),
    powderBlackSteelMat
  );
  frontBenchPost.name = 'outbuildings.gym.nikeSquatRack.bench.frontPost';
  frontBenchPost.position.set(0, (benchH - padT) * 0.5, 0.44);
  frontBenchPost.rotation.x = -0.14;
  frontBenchPost.castShadow = true;
  benchGroup.add(frontBenchPost);

  const frontFootPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.022, 0.16),
    uhmwPlasticMat
  );
  frontFootPlate.name = 'outbuildings.gym.nikeSquatRack.bench.frontFootPlate';
  frontFootPlate.position.set(0, 0.011, 0.465);
  benchGroup.add(frontFootPlate);

  // Knurled stainless front transport handle projecting from the front leg (`media_1791212146142_7b2838ce.png`)
  const frontHandleGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.18, 16),
    chromeHubMat
  );
  frontHandleGrip.name = 'outbuildings.gym.nikeSquatRack.bench.transportHandleGrip';
  frontHandleGrip.userData.lodTier = 'high';
  frontHandleGrip.userData.lodMaxDistance = 12;
  frontHandleGrip.position.set(0, 0.16, 0.525);
  frontHandleGrip.rotation.x = -0.14;
  benchGroup.add(frontHandleGrip);

  for (const hy of [0.085, 0.235] as const) {
    const handleBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.012, 0.055),
      powderBlackSteelMat
    );
    handleBracket.name = `outbuildings.gym.nikeSquatRack.bench.transportHandleBracket.${hy < 0.15 ? 'lower' : 'upper'}`;
    handleBracket.userData.lodTier = 'high';
    handleBracket.userData.lodMaxDistance = 12;
    handleBracket.position.set(0, hy, 0.495);
    benchGroup.add(handleBracket);
  }

  const controller = new GymBenchPressController({
    rackGroup,
    barbellGroup,
    benchGroup,
    jCupMeshes,
    gymFloorY,
    clickableTargets: [rackGroup],
  });
  if (interactions) {
    interactions.registerAnimatedInteractable(controller);
  }
  return controller;
}
