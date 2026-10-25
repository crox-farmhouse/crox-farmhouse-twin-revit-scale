import * as THREE from 'three';
import { createProfiledSkirtingCapGeometry } from '../../../../../engine/geometry/index.ts';
import {
  createRakedVYExtrusion,
  type StableUpperEnsuiteSharedKit,
} from './stable-upper-ensuite-bathroom.ts';

let cachedBedroomWovenRugTexture: THREE.CanvasTexture | null = null;

export function createBedroomWovenRugTexture(): THREE.CanvasTexture {
  if (cachedBedroomWovenRugTexture) {
    return cachedBedroomWovenRugTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Warm oatmeal & Farrow & Ball Setting Plaster hand-loomed wool base
    ctx.fillStyle = '#e8dfd1';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle woven wool boucle warp/weft texture
    for (let y = 0; y < 512; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? 'rgba(201, 171, 151, 0.16)' : 'rgba(120, 102, 88, 0.08)';
      ctx.fillRect(0, y, 512, 2);
    }
    for (let x = 0; x < 512; x += 4) {
      ctx.fillStyle = x % 8 === 0 ? 'rgba(255, 250, 242, 0.14)' : 'rgba(140, 118, 102, 0.07)';
      ctx.fillRect(x, 0, 2, 512);
    }

    // Double framed border in Setting Plaster blush (`#c9ab97`) and muted sage-taupe (`#8c8275`)
    ctx.strokeStyle = '#c9ab97';
    ctx.lineWidth = 18;
    ctx.strokeRect(26, 26, 460, 460);

    ctx.strokeStyle = '#8c7d70';
    ctx.lineWidth = 4;
    ctx.strokeRect(44, 44, 424, 424);

    // Subtle geometric kilim lozenge & chevron motif across the central field
    const colors = ['#c9ab97', '#7b8776', '#b59984', '#dfd5c5'];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 4; col++) {
        const cx = 104 + col * 101;
        const cy = 96 + row * 80;
        ctx.strokeStyle = colors[(row + col) % colors.length]!;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 26);
        ctx.lineTo(cx + 34, cy);
        ctx.lineTo(cx, cy + 26);
        ctx.lineTo(cx - 34, cy);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = colors[(row + col + 1) % colors.length]!;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx + 13, cy);
        ctx.lineTo(cx, cy + 10);
        ctx.lineTo(cx - 13, cy);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedBedroomWovenRugTexture = tex;
  return tex;
}

export function buildStableUpperBedroomFurniture(
  firstFloorGroup: THREE.Group,
  stableUpperFloorY: number,
  lightJoineryOakMat: THREE.Material,
  warmRoomPlasterMat: THREE.Material,
  sharedKit: StableUpperEnsuiteSharedKit
): void {
  const {
    uWest,
    uEast,
    wallT,
    eaveWallH,
    vMidRoom,
    ridgeCeilH,
    doorU0,
    doorU1,
    vNorthFace,
    marbleTileMat,
    ceramicWhiteMat,
    brushedBrassMat,
    warmLedGlowMat,
  } = sharedKit;
  // ==========================================================================
  // 7. STABLE 1ST-FLOOR DOUBLE BEDROOM ENSEMBLE (`outbuildings.firstFloor.stableBedroom`)
  //    - Issue #3 ("Maybe lose the upstairs extension, a lot of extra money for not much gain"):
  //      Restored the 1st-floor East gable wall to `uStableEnd = 29.05m` (`uRoomEast = 28.77m`), keeping
  //      the existing structural gable line and restoring the full `2.80m`-deep walk-out East Balcony!
  //    - Issue #2 ("Center the bed on this wall" at `[5.6, 2.713, 17.797]`):
  //      Centered the Double Bed at `bedCenterU = (26.09 + 28.77) * 0.5 = 27.43m` on the `2.68m` South bedroom wall
  //      segment (`u = 26.09m..28.77m`), flanked symmetrically by both fluted-oak bedside tables!
  //    - Issue #4 ("Dressing table here" at `[5.213, 2.276, 13.902]`):
  //      Built a Fluted Light-Oak & Carrara-Marble Dressing Table with Arched Brass Mirror & Bouclé Stool
  //      (`outbuildings.firstFloor.stableBedroom.dressingTable`) against the North wall at `u = 27.68m, v = 0.52m`!
  //    - Issue #5 ("Rug here" at `[3.464, 2.08, 15.658]`):
  //      Placed a Hand-Woven Setting-Plaster & Oatmeal Geometric Kilim Wool Area Rug (`outbuildings.firstFloor.stableBedroom.rug`)
  //      at `(u = 25.46m, v = 1.76m)`!
  //    - Batch 2 Issue #1 ("Color drenched same as wall baseboards in here" at `[2.01, 2.244, 14.178]`):
  //      Added full perimeter colour-drenched `settingPlasterMat` baseboards (`outbuildings.firstFloor.stableBedroom.baseboards`)
  //      around the room and colour-drenched the built-in wardrobe plinth skirting to match the walls!
  // ==========================================================================
  const bedroomGroup = new THREE.Group();
  bedroomGroup.name = 'outbuildings.firstFloor.stableBedroom';
  bedroomGroup.userData.zone = 'courtyard';
  firstFloorGroup.add(bedroomGroup);

  const boucleFabricMat = new THREE.MeshStandardMaterial({
    color: 0xe6ddd0,
    roughness: 0.86,
    metalness: 0.01,
  });
  const crispLinenMat = new THREE.MeshStandardMaterial({
    color: 0xf7f4ee,
    roughness: 0.78,
    metalness: 0.01,
  });
  const warmThrowMat = new THREE.MeshStandardMaterial({
    color: 0x9b7a68, // Complements Farrow & Ball Setting Plaster walls!
    roughness: 0.84,
    metalness: 0.01,
  });
  const accentCushionMat = new THREE.MeshStandardMaterial({
    color: 0x6f7d6b, // Soft heritage sage-olive accent pillows
    roughness: 0.82,
    metalness: 0.01,
  });
  const shakerWardrobeMat = new THREE.MeshStandardMaterial({
    color: 0xdfd9ce, // Heritage Farrow & Ball warm off-white/stone Shaker cabinetry matching Main House `wardrobeMat`
    roughness: 0.56,
    metalness: 0.02,
  });

  // 7A. Double Bed Ensemble (`outbuildings.firstFloor.stableBedroom.doubleBed`) centered on the South Wall (`u = 26.09..28.77m` -> `bedCenterU = 27.43m`, facing North `-v`!)
  //     Note: With `bedGroup.rotation.y = Math.PI / 2`, local `+x` points North (`-v`) and local `+z` points East (`+u`)!
  const bedGroup = new THREE.Group();
  bedGroup.name = 'outbuildings.firstFloor.stableBedroom.doubleBed';
  const uRoomEast = 28.77; // East interior wall face of the 5.55m Stable 1st-floor room (`u = 23.22..28.77m`)
  const uEnsuiteEastFace = uEast + wallT * 0.5; // 26.09m
  const bedCenterU = (uEnsuiteEastFace + uRoomEast) * 0.5; // 27.43m — exact midpoint of the South bedroom wall (Issue #2)!
  const bedHeadV = 5.40; // Against South wall (`v = 5.428m`), facing North (`-v`)
  const bedW = 1.48; // Standard UK Double Bed frame width (`u = 26.69..28.17m`, leaving 0.60m on each side for nightstands!)
  const bedL = 2.04; // along -v (`v = 5.40..3.36m`)
  bedGroup.position.set(bedCenterU, stableUpperFloorY, bedHeadV);
  bedGroup.rotation.y = Math.PI / 2;
  bedroomGroup.add(bedGroup);

  // A. Solid Light-Oak Timber Bed Frame & 4 Tapered Oak Legs (`y = 0..0.34m`)
  for (const [lx, lz] of [
    [0.08, -bedW * 0.5 + 0.06],
    [0.08, bedW * 0.5 - 0.06],
    [bedL - 0.08, -bedW * 0.5 + 0.06],
    [bedL - 0.08, bedW * 0.5 - 0.06],
  ] as const) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.020, 0.16, 12),
      lightJoineryOakMat
    );
    leg.name = 'outbuildings.firstFloor.stableBedroom.doubleBed.leg';
    leg.position.set(lx, 0.08, lz);
    leg.castShadow = true;
    bedGroup.add(leg);
  }

  const bedFramePlinth = new THREE.Mesh(
    new THREE.BoxGeometry(bedL - 0.12, 0.18, bedW),
    lightJoineryOakMat
  );
  bedFramePlinth.name = 'outbuildings.firstFloor.stableBedroom.bedFrame';
  bedFramePlinth.position.set(0.12 + (bedL - 0.12) * 0.5, 0.254, 0);
  bedFramePlinth.castShadow = true;
  bedFramePlinth.receiveShadow = true;
  bedGroup.add(bedFramePlinth);

  // B. Channel-Tufted Oatmeal-Bouclé & Light-Oak Framed Headboard (`x = 0.038m, y = 0.164..1.144m, width = 1.54m`, fitting cleanly under 1.24m South eave!)
  const hbH = 0.98;
  const hbW = bedW + 0.06;
  const headboardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, hbH, hbW),
    lightJoineryOakMat
  );
  headboardFrame.name = 'outbuildings.firstFloor.stableBedroom.headboard';
  headboardFrame.position.set(0.038, 0.164 + hbH * 0.5, 0);
  headboardFrame.castShadow = true;
  bedGroup.add(headboardFrame);

  const numChannels = 6;
  const channelW = (hbW - 0.08) / numChannels;
  for (let c = 0; c < numChannels; c++) {
    const cz = -hbW * 0.5 + 0.04 + (c + 0.5) * channelW;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, hbH - 0.08, channelW - 0.012),
      boucleFabricMat
    );
    panel.name = 'outbuildings.firstFloor.stableBedroom.headboard.channelPanel';
    panel.position.set(0.094, 0.164 + hbH * 0.5, cz);
    panel.castShadow = true;
    bedGroup.add(panel);
  }

  // C. Plush Pocket-Sprung Mattress (`y = 0.348..0.588m`) & Turned-Back Duvet + Quilted End Throw (`x = 0.12..2.00m`)
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(bedL - 0.16, 0.24, bedW - 0.06),
    crispLinenMat
  );
  mattress.name = 'outbuildings.firstFloor.stableBedroom.mattress';
  mattress.position.set(0.12 + (bedL - 0.16) * 0.5, 0.468, 0);
  mattress.castShadow = true;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  const duvetBody = new THREE.Mesh(
    new THREE.BoxGeometry(bedL - 0.62, 0.080, bedW - 0.02),
    crispLinenMat
  );
  duvetBody.name = 'outbuildings.firstFloor.stableBedroom.duvet';
  duvetBody.position.set(0.56 + (bedL - 0.62) * 0.5, 0.632, 0);
  duvetBody.castShadow = true;
  duvetBody.receiveShadow = true;
  bedGroup.add(duvetBody);

  const duvetFold = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, bedW - 0.024, 16),
    crispLinenMat
  );
  duvetFold.rotation.x = Math.PI / 2;
  duvetFold.name = 'outbuildings.firstFloor.stableBedroom.duvet.topFold';
  duvetFold.position.set(0.54, 0.648, 0);
  duvetFold.castShadow = true;
  bedGroup.add(duvetFold);

  const endThrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.056, bedW + 0.01),
    warmThrowMat
  );
  endThrow.name = 'outbuildings.firstFloor.stableBedroom.throwBlanket';
  endThrow.position.set(bedL - 0.29, 0.704, 0);
  endThrow.castShadow = true;
  bedGroup.add(endThrow);

  // D. 4 Layered Sleeping Pillows (`x = 0.24m` & `0.38m`) + 2 Heritage Sage-Olive Accent Cushions (`x = 0.50m`)
  for (const sideZ of [-0.36, 0.36] as const) {
    const backPillow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.60, 18),
      crispLinenMat
    );
    backPillow.name = 'outbuildings.firstFloor.stableBedroom.pillow';
    backPillow.rotation.x = Math.PI / 2;
    backPillow.rotation.z = -0.28;
    backPillow.scale.set(0.65, 1.0, 1.15);
    backPillow.position.set(0.22, 0.68, sideZ);
    backPillow.castShadow = true;
    bedGroup.add(backPillow);

    const frontPillow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.54, 18),
      boucleFabricMat
    );
    frontPillow.name = 'outbuildings.firstFloor.stableBedroom.pillow';
    frontPillow.rotation.x = Math.PI / 2;
    frontPillow.rotation.z = -0.35;
    frontPillow.scale.set(0.62, 1.0, 1.12);
    frontPillow.position.set(0.36, 0.66, sideZ);
    frontPillow.castShadow = true;
    bedGroup.add(frontPillow);

    const accentPillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.24, 0.36),
      accentCushionMat
    );
    accentPillow.rotation.z = 0.26;
    accentPillow.name = 'outbuildings.firstFloor.stableBedroom.accentPillow';
    accentPillow.position.set(0.48, 0.65, sideZ);
    accentPillow.castShadow = true;
    bedGroup.add(accentPillow);
  }

  // E. 2 Matching Symmetrical Fluted Light-Oak Bedside Nightstands (`z = -0.95m` West & `z = +0.95m` East) with Warm Table Lamps
  for (const [nIdx, nz] of [
    [1, -0.95],
    [2, 0.95],
  ] as const) {
    const nsGroup = new THREE.Group();
    nsGroup.name = `outbuildings.firstFloor.stableBedroom.nightstand.${nIdx}`;
    nsGroup.position.set(0.22, 0, nz);
    bedGroup.add(nsGroup);

    const nsBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.42, 0.34),
      lightJoineryOakMat
    );
    nsBody.name = `outbuildings.firstFloor.stableBedroom.nightstand.${nIdx}.cabinet`;
    nsBody.position.set(0, 0.14 + 0.21, 0);
    nsBody.castShadow = true;
    nsBody.receiveShadow = true;
    nsGroup.add(nsBody);

    const nsTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.024, 0.36),
      marbleTileMat
    );
    nsTop.name = `outbuildings.firstFloor.stableBedroom.nightstand.${nIdx}.marbleTop`;
    nsTop.position.set(0, 0.576, 0);
    nsGroup.add(nsTop);

    const nsPull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.12, 10),
      brushedBrassMat
    );
    nsPull.rotation.x = Math.PI / 2;
    nsPull.name = `outbuildings.firstFloor.stableBedroom.nightstand.${nIdx}.pull`;
    nsPull.position.set(0.182, 0.44, 0);
    nsGroup.add(nsPull);

    // Ceramic & Brass Bedside Table Lamp (`y = 0.592..1.01m`)
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.072, 0.18, 18),
      ceramicWhiteMat
    );
    lampBase.name = `outbuildings.firstFloor.stableBedroom.bedsideLamp.${nIdx}.base`;
    lampBase.position.set(0, 0.682, 0);
    lampBase.castShadow = true;
    nsGroup.add(lampBase);

    const lampStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.08, 10),
      brushedBrassMat
    );
    lampStem.name = `outbuildings.firstFloor.stableBedroom.bedsideLamp.${nIdx}.stem`;
    lampStem.position.set(0, 0.816, 0);
    nsGroup.add(lampStem);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.115, 0.15, 20),
      warmLedGlowMat
    );
    lampShade.name = `outbuildings.firstFloor.stableBedroom.bedsideLamp.${nIdx}`;
    lampShade.position.set(0, 0.935, 0);
    nsGroup.add(lampShade);
  }

  // F. Upholstered Light-Oak & Oatmeal-Bouclé End-of-Bed Blanket Bench (`x = bedL + 0.24m, z = 0`)
  const benchFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.40, 0.06, 1.22),
    lightJoineryOakMat
  );
  benchFrame.name = 'outbuildings.firstFloor.stableBedroom.endBench';
  benchFrame.position.set(bedL + 0.24, 0.32, 0);
  benchFrame.castShadow = true;
  bedGroup.add(benchFrame);

  const benchCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.10, 1.20),
    boucleFabricMat
  );
  benchCushion.name = 'outbuildings.firstFloor.stableBedroom.endBench.cushion';
  benchCushion.position.set(bedL + 0.24, 0.404, 0);
  benchCushion.castShadow = true;
  bedGroup.add(benchCushion);

  for (const [blx, blz] of [
    [bedL + 0.09, -0.52],
    [bedL + 0.39, -0.52],
    [bedL + 0.09, 0.52],
    [bedL + 0.39, 0.52],
  ] as const) {
    const bLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.015, 0.282, 10),
      lightJoineryOakMat
    );
    bLeg.name = 'outbuildings.firstFloor.stableBedroom.endBench.leg';
    bLeg.position.set(blx, 0.145, blz);
    bLeg.castShadow = true;
    bedGroup.add(bLeg);
  }

  // ==========================================================================
  // 7B. BESPOKE BANK OF 4 BUILT-IN SHAKER WARDROBES (`outbuildings.firstFloor.stableBedroom.wardrobes`)
  //     ("Put the wardrobe here" at `[0.784, 3.652, 15.401]` & "Built in wardrobes here like in the main house")
  //     Positioned along the West Gable Wall North of the Entrance Doorway (`u = 23.22..23.80m, v = 0.29..2.49m`,
  //     facing East `+u` into the Stable Bedroom), with colour-drenched `warmRoomPlasterMat` plinth skirting!
  // ==========================================================================
  const wardGroup = new THREE.Group();
  wardGroup.name = 'outbuildings.firstFloor.stableBedroom.wardrobes';
  wardGroup.userData.zone = 'courtyard';
  bedroomGroup.add(wardGroup);

  const wardU0 = uWest; // 23.22m (West gable wall East face)
  const wardD = 0.58; // 0.58m deep (`u = 23.22..23.80m`)
  const wardFrontU = wardU0 + wardD; // 23.80m
  const wardV0 = 0.295; // North wall inner face (`v = 0.28m`) + 1.5cm
  const wardV1 = 2.33; // Cleanly North of the centered `v = 2.405..3.305m` entrance doorway & `v = 2.357m` architrave!

  const getNorthSlopeCeilHAtV = (v: number): number => {
    const t = Math.max(0, Math.min(1, (v - 0.28) / (vMidRoom - 0.28)));
    return eaveWallH + t * (ridgeCeilH - eaveWallH);
  };

  // 1. Full-height vaulted Shaker wardrobe carcass (`v = 0.295..2.33m`, inset 5mm off West wall & 6mm below vaulted ceiling)
  const wardCarcassGeo = createRakedVYExtrusion(
    [
      [wardV0, 0.004],
      [wardV1, 0.004],
      [wardV1, getNorthSlopeCeilHAtV(wardV1) - 0.006],
      [wardV0, getNorthSlopeCeilHAtV(wardV0) - 0.006],
    ],
    wardD - 0.005
  );
  const wardCarcass = new THREE.Mesh(wardCarcassGeo, shakerWardrobeMat);
  wardCarcass.name = 'outbuildings.firstFloor.stableBedroom.wardrobes.carcass';
  wardCarcass.position.set(wardU0 + 0.005, stableUpperFloorY, 0);
  wardCarcass.castShadow = true;
  wardCarcass.receiveShadow = true;
  wardGroup.add(wardCarcass);

  // 2. Raked Shaker crown cornice moulding following the vaulted ceiling slope (`v = 0.295..2.33m`)
  const hCornice0 = getNorthSlopeCeilHAtV(wardV0);
  const hCornice1 = getNorthSlopeCeilHAtV(wardV1);
  const corniceSpanV = wardV1 - wardV0;
  const corniceLen = Math.hypot(corniceSpanV, hCornice1 - hCornice0);
  const corniceAngle = Math.atan2(hCornice1 - hCornice0, corniceSpanV);
  const corniceMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.042, corniceLen + 0.01),
    shakerWardrobeMat
  );
  corniceMesh.name = 'outbuildings.firstFloor.stableBedroom.wardrobes.cornice';
  corniceMesh.position.set(
    wardFrontU + 0.023,
    stableUpperFloorY + (hCornice0 + hCornice1) * 0.5 - 0.028,
    (wardV0 + wardV1) * 0.5
  );
  corniceMesh.rotation.x = -corniceAngle;
  corniceMesh.castShadow = true;
  wardGroup.add(corniceMesh);

  // 3. Colour-Drenched Setting-Plaster Plinth Skirting along the front (`u = wardFrontU + 0.013`) & South end (`v = wardV1 + 0.013`)
  //    per Batch 2 Issue #1 ("Color drenched same as wall baseboards in here")!
  const frontSkirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.115, corniceSpanV),
    warmRoomPlasterMat
  );
  frontSkirt.name = 'outbuildings.firstFloor.stableBedroom.wardrobes.frontSkirt';
  frontSkirt.position.set(wardFrontU + 0.013, stableUpperFloorY + 0.0615, (wardV0 + wardV1) * 0.5);
  wardGroup.add(frontSkirt);

  const frontSkirtCap = new THREE.Mesh(
    createProfiledSkirtingCapGeometry(corniceSpanV, false, 1),
    warmRoomPlasterMat
  );
  frontSkirtCap.name = 'outbuildings.firstFloor.stableBedroom.wardrobes.frontSkirtCap';
  frontSkirtCap.position.set(wardFrontU + 0.0115, stableUpperFloorY + 0.135, (wardV0 + wardV1) * 0.5);
  wardGroup.add(frontSkirtCap);

  const southEndSkirt = new THREE.Mesh(
    new THREE.BoxGeometry(wardD - 0.005, 0.115, 0.018),
    warmRoomPlasterMat
  );
  southEndSkirt.name = 'outbuildings.firstFloor.stableBedroom.wardrobes.southEndSkirt';
  southEndSkirt.position.set(wardU0 + 0.005 + (wardD - 0.005) * 0.5, stableUpperFloorY + 0.0615, wardV1 + 0.013);
  wardGroup.add(southEndSkirt);

  const southEndSkirtCap = new THREE.Mesh(
    createProfiledSkirtingCapGeometry(wardD - 0.005, true, 1),
    warmRoomPlasterMat
  );
  southEndSkirtCap.name = 'outbuildings.firstFloor.stableBedroom.wardrobes.southEndSkirtCap';
  southEndSkirtCap.position.set(wardU0 + 0.005 + (wardD - 0.005) * 0.5, stableUpperFloorY + 0.135, wardV1 + 0.0115);
  wardGroup.add(southEndSkirtCap);

  // 4. 4 Raked Ceiling-Height 2-Panel Shaker Wardrobe Doors (`outbuildings.firstFloor.stableBedroom.wardrobe.door_1..4`)
  const doorBaseH = 0.152;
  const corniceClear = 0.056;
  const doorIntervalsV: ReadonlyArray<readonly [number, number]> = [
    [0.33, 0.805],
    [0.822, 1.297],
    [1.318, 1.793],
    [1.81, 2.285],
  ];

  const buildRakedDoorBoxAlongV = (
    vMinLocal: number,
    vMaxLocal: number,
    yBotFn: (vLocal: number) => number,
    yTopFn: (vLocal: number) => number,
    thicknessU: number
  ): THREE.BufferGeometry => {
    const spanV = Math.max(0.004, vMaxLocal - vMinLocal);
    const midV = (vMinLocal + vMaxLocal) * 0.5;
    const geo = new THREE.BoxGeometry(thicknessU, 1, spanV);
    const pos = geo.attributes.position;
    if (pos) {
      for (let idx = 0; idx < pos.count; idx++) {
        const vLocal = pos.getZ(idx) + midV;
        const tY = pos.getY(idx) + 0.5;
        const y0 = yBotFn(vLocal);
        const y1 = Math.max(y0 + 0.01, yTopFn(vLocal));
        pos.setY(idx, y0 + tY * (y1 - y0));
        pos.setZ(idx, vLocal);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
    geo.computeBoundingSphere();
    return geo;
  };

  for (let i = 0; i < doorIntervalsV.length; i++) {
    const [dv0, dv1] = doorIntervalsV[i]!;
    const dw = dv1 - dv0;
    const dMidV = (dv0 + dv1) * 0.5;
    const hLeft = getNorthSlopeCeilHAtV(dv0) - corniceClear - doorBaseH;
    const hRight = getNorthSlopeCeilHAtV(dv1) - corniceClear - doorBaseH;
    const maxDoorH = Math.max(hLeft, hRight);
    const yBot = -maxDoorH * 0.5;
    const getTopYAtLocalV = (vLocal: number): number =>
      yBot + hLeft + ((vLocal + dw * 0.5) / Math.max(0.01, dw)) * (hRight - hLeft);

    const doorGrp = new THREE.Group();
    doorGrp.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}`;
    doorGrp.position.set(wardFrontU + 0.020, stableUpperFloorY + doorBaseH + maxDoorH * 0.5, dMidV);
    wardGroup.add(doorGrp);

    const frameT = 0.016;
    const panelT = 0.008;
    const stileW = 0.064;
    const topRailH = 0.072;
    const midRailH = 0.064;
    const botRailH = 0.082;
    const midRailY = yBot + 0.72;

    const panelGeo = buildRakedDoorBoxAlongV(
      -dw * 0.5 + 0.006,
      dw * 0.5 - 0.006,
      () => yBot + 0.006,
      (vl) => getTopYAtLocalV(vl) - 0.006,
      panelT
    );
    const panelMesh = new THREE.Mesh(panelGeo, shakerWardrobeMat);
    panelMesh.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}.panel`;
    panelMesh.position.set(-0.012, 0, 0);
    panelMesh.castShadow = true;
    panelMesh.receiveShadow = true;
    doorGrp.add(panelMesh);

    for (const sSign of [-1, 1] as const) {
      const sv = sSign * (dw * 0.5 - stileW * 0.5);
      const stileGeo = buildRakedDoorBoxAlongV(
        sv - stileW * 0.5,
        sv + stileW * 0.5,
        () => yBot,
        getTopYAtLocalV,
        frameT
      );
      const stileMesh = new THREE.Mesh(stileGeo, shakerWardrobeMat);
      stileMesh.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}.stile`;
      stileMesh.position.set(0.004, 0, 0);
      stileMesh.castShadow = true;
      stileMesh.receiveShadow = true;
      doorGrp.add(stileMesh);
    }

    const innerW = dw - stileW * 2 - 0.008;
    const topRailGeo = buildRakedDoorBoxAlongV(
      -innerW * 0.5,
      innerW * 0.5,
      (vl) => getTopYAtLocalV(vl) - topRailH,
      getTopYAtLocalV,
      frameT
    );
    const topRailMesh = new THREE.Mesh(topRailGeo, shakerWardrobeMat);
    topRailMesh.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}.topRail`;
    topRailMesh.position.set(0.004, 0, 0);
    topRailMesh.castShadow = true;
    doorGrp.add(topRailMesh);

    for (const [ry, rh] of [
      [midRailY, midRailH],
      [yBot + botRailH * 0.5, botRailH],
    ] as const) {
      const railMesh = new THREE.Mesh(
        new THREE.BoxGeometry(frameT, rh, innerW),
        shakerWardrobeMat
      );
      railMesh.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}.rail`;
      railMesh.position.set(0.004, ry, 0);
      railMesh.castShadow = true;
      doorGrp.add(railMesh);
    }

    const handleSign = i % 2 === 0 ? 1 : -1;
    const handleV = handleSign * (dw * 0.5 - stileW * 0.5);
    const handleY = yBot + 0.84;
    const pullBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.17, 10),
      brushedBrassMat
    );
    pullBar.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}.pullBar`;
    pullBar.position.set(0.004 + frameT * 0.5 + 0.028, handleY, handleV);
    pullBar.castShadow = true;
    doorGrp.add(pullBar);

    for (const dy of [-0.06, 0.06] as const) {
      const standoff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.018, 8),
        brushedBrassMat
      );
      standoff.rotation.z = Math.PI / 2;
      standoff.name = `outbuildings.firstFloor.stableBedroom.wardrobe.door_${i + 1}.pullStandoff`;
      standoff.userData = { lodTier: 'high', lodMaxDistance: 12 };
      standoff.position.set(0.004 + frameT * 0.5 + 0.013, handleY + dy, handleV);
      doorGrp.add(standoff);
    }
  }

  // ==========================================================================
  // 7C. DRESSING TABLE WITH ARCHED BRASS MIRROR & BOUCLÉ STOOL (`outbuildings.firstFloor.stableBedroom.dressingTable`)
  //     Issue #4 ("Dressing table here" at `[5.213, 2.276, 13.902]` -> `u = 27.57m, v = 0.28m`):
  //     Positioned against the North Bedroom Wall East of the `u = 26.35m` window (`u = 27.64m, v = 0.52m`, facing South `+v`)!
  // ==========================================================================
  const dtGroup = new THREE.Group();
  dtGroup.name = 'outbuildings.firstFloor.stableBedroom.dressingTable';
  dtGroup.position.set(27.64, stableUpperFloorY, 0.52);
  bedroomGroup.add(dtGroup);

  const dtW = 1.12; // along u (`u = 27.08..28.20m`)
  const dtD = 0.44; // along v (`v = 0.30..0.74m`)
  const dtH = 0.76;
  const apronH = 0.14;

  // 4 Tapered turned solid-oak legs with brushed-brass foot sabots
  for (const [lx, lz] of [
    [-dtW * 0.5 + 0.05, -dtD * 0.5 + 0.05],
    [dtW * 0.5 - 0.05, -dtD * 0.5 + 0.05],
    [-dtW * 0.5 + 0.05, dtD * 0.5 - 0.05],
    [dtW * 0.5 - 0.05, dtD * 0.5 - 0.05],
  ] as const) {
    const legLen = dtH - apronH - 0.10;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.014, legLen, 12),
      lightJoineryOakMat
    );
    leg.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.leg';
    leg.position.set(lx, 0.068 + legLen * 0.5, lz);
    leg.castShadow = true;
    dtGroup.add(leg);

    const sabot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.013, 0.06, 12),
      brushedBrassMat
    );
    sabot.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.sabot';
    sabot.position.set(lx, 0.034, lz);
    dtGroup.add(sabot);
  }

  // Fluted solid light-oak dressing console carcass & 2 side drawers + central vanity drawer
  const dtCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(dtW, apronH, dtD),
    lightJoineryOakMat
  );
  dtCarcass.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.console';
  dtCarcass.position.set(0, dtH - 0.028 - apronH * 0.5, 0);
  dtCarcass.castShadow = true;
  dtCarcass.receiveShadow = true;
  dtGroup.add(dtCarcass);

  for (const [dx, dwDrawer] of [
    [-0.36, 0.34],
    [0.0, 0.34],
    [0.36, 0.34],
  ] as const) {
    const dFront = new THREE.Mesh(
      new THREE.BoxGeometry(dwDrawer, apronH - 0.024, 0.014),
      lightJoineryOakMat
    );
    dFront.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.drawerFront';
    dFront.position.set(dx, dtH - 0.028 - apronH * 0.5, dtD * 0.5 + 0.011);
    dtGroup.add(dFront);

    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 12, 10),
      brushedBrassMat
    );
    knob.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.drawerKnob';
    knob.userData = { lodTier: 'high', lodMaxDistance: 12 };
    knob.position.set(dx, dtH - 0.028 - apronH * 0.5, dtD * 0.5 + 0.033);
    dtGroup.add(knob);
  }

  // Bullnose Honed Carrara Marble Dressing Table Top (`y = dtH = 0.76m`)
  const dtMarbleTop = new THREE.Mesh(
    new THREE.BoxGeometry(dtW + 0.024, 0.024, dtD + 0.024),
    marbleTileMat
  );
  dtMarbleTop.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.top';
  dtMarbleTop.position.set(0, dtH - 0.012, 0);
  dtMarbleTop.castShadow = true;
  dtMarbleTop.receiveShadow = true;
  dtGroup.add(dtMarbleTop);

  // Tabletop Arched Brushed-Brass Dressing Mirror (`0.48m W x 0.38m H`, top at `y = 1.16m < 1.24m` North eave!)
  const dtMirrorStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.016, 0.08),
    brushedBrassMat
  );
  dtMirrorStand.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.mirrorStand';
  dtMirrorStand.position.set(0, dtH + 0.012, -dtD * 0.5 + 0.08);
  dtGroup.add(dtMirrorStand);

  const dtMirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.38, 0.014),
    brushedBrassMat
  );
  dtMirrorFrame.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.mirror';
  dtMirrorFrame.position.set(0, dtH + 0.214, -dtD * 0.5 + 0.08);
  dtMirrorFrame.castShadow = true;
  dtGroup.add(dtMirrorFrame);

  const dtMirrorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.448, 0.348, 0.006),
    new THREE.MeshStandardMaterial({ color: 0xdce8f2, roughness: 0.05, metalness: 0.92 })
  );
  dtMirrorGlass.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.mirrorGlass';
  dtMirrorGlass.position.set(0, dtH + 0.214, -dtD * 0.5 + 0.094);
  dtGroup.add(dtMirrorGlass);

  // Perfume Atomiser, Ceramic Jewellery Tray & Small Accent Lamp on the Dressing Table
  const jewelleryDish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.058, 0.014, 18),
    ceramicWhiteMat
  );
  jewelleryDish.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.jewelleryDish';
  jewelleryDish.userData = { lodTier: 'high', lodMaxDistance: 12 };
  jewelleryDish.position.set(-0.34, dtH + 0.011, 0.04);
  dtGroup.add(jewelleryDish);

  const perfumeBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.028, 0.075, 14),
    new THREE.MeshStandardMaterial({ color: 0xf2d8a8, transparent: true, opacity: 0.78, roughness: 0.12 })
  );
  perfumeBottle.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.perfumeBottle';
  perfumeBottle.userData = { lodTier: 'high', lodMaxDistance: 12 };
  perfumeBottle.position.set(-0.34, dtH + 0.0595, 0.04);
  dtGroup.add(perfumeBottle);

  const perfumeCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 12, 10),
    brushedBrassMat
  );
  perfumeCap.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.perfumeCap';
  perfumeCap.userData = { lodTier: 'high', lodMaxDistance: 12 };
  perfumeCap.position.set(-0.34, dtH + 0.113, 0.04);
  dtGroup.add(perfumeCap);

  const dtLampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.054, 0.14, 16),
    ceramicWhiteMat
  );
  dtLampBase.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.lampBase';
  dtLampBase.position.set(0.38, dtH + 0.074, -0.02);
  dtGroup.add(dtLampBase);

  const dtLampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.088, 0.12, 18),
    warmLedGlowMat
  );
  dtLampShade.name = 'outbuildings.firstFloor.stableBedroom.dressingTable.lampShade';
  dtLampShade.position.set(0.38, dtH + 0.208, -0.02);
  dtGroup.add(dtLampShade);

  // Upholstered Oatmeal-Bouclé & Turned-Oak Dressing Stool (`v = +0.34m` in front of the console)
  const dtStoolGroup = new THREE.Group();
  dtStoolGroup.name = 'outbuildings.firstFloor.stableBedroom.dressingStool';
  dtStoolGroup.position.set(0, 0, 0.34);
  dtGroup.add(dtStoolGroup);

  const stoolCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.195, 0.195, 0.085, 22),
    boucleFabricMat
  );
  stoolCushion.name = 'outbuildings.firstFloor.stableBedroom.dressingStool.cushion';
  stoolCushion.position.set(0, 0.4225, 0);
  stoolCushion.castShadow = true;
  dtStoolGroup.add(stoolCushion);

  for (const [slx, slz] of [
    [-0.12, -0.12],
    [0.12, -0.12],
    [-0.12, 0.12],
    [0.12, 0.12],
  ] as const) {
    const sLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.011, 0.372, 10),
      lightJoineryOakMat
    );
    sLeg.name = 'outbuildings.firstFloor.stableBedroom.dressingStool.leg';
    sLeg.position.set(slx, 0.190, slz);
    sLeg.castShadow = true;
    dtStoolGroup.add(sLeg);
  }

  // ==========================================================================
  // 7D. HAND-WOVEN SETTING-PLASTER & OATMEAL KILIM WOOL AREA RUG (`outbuildings.firstFloor.stableBedroom.rug`)
  //     Issue #5 ("Rug here" at `[3.464, 2.08, 15.658]` -> `u = 25.67m, v = 1.57m`):
  //     Centered at `(u = 25.46m, y = stableUpperFloorY + 0.010m, v = 1.76m)` (`2.25m x 1.65m`).
  // ==========================================================================
  const bedroomRugMat = new THREE.MeshStandardMaterial({
    map: createBedroomWovenRugTexture(),
    roughness: 0.88,
    metalness: 0.01,
  });
  const rugW = 2.25;
  const rugD = 1.65;
  const rugCenterU = 25.46;
  const rugCenterV = 1.76;
  const bedroomRug = new THREE.Mesh(
    new THREE.BoxGeometry(rugW, 0.012, rugD),
    bedroomRugMat
  );
  bedroomRug.name = 'outbuildings.firstFloor.stableBedroom.rug';
  bedroomRug.position.set(rugCenterU, stableUpperFloorY + 0.010, rugCenterV);
  bedroomRug.receiveShadow = true;
  bedroomGroup.add(bedroomRug);

  // Braided oatmeal wool fringe along the West (`-u`) and East (`+u`) ends of the bedroom rug
  for (const endSign of [-1, 1] as const) {
    const fringe = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.008, rugD - 0.04),
      boucleFabricMat
    );
    fringe.name = 'outbuildings.firstFloor.stableBedroom.rug.fringe';
    fringe.position.set(
      rugCenterU + endSign * (rugW * 0.5 + 0.020),
      stableUpperFloorY + 0.008,
      rugCenterV
    );
    bedroomGroup.add(fringe);
  }

  // ==========================================================================
  // 7E. COLOUR-DRENCHED PERIMETER BASEBOARDS / SKIRTING BOARDS (`outbuildings.firstFloor.stableBedroom.baseboards`)
  //     Batch 2 Issue #1 ("Color drenched same as wall baseboards in here" at `[2.01, 2.244, 14.178]`):
  //     Full architectural 145mm skirting boards (`122mm` base + `23mm` torus/chamfered cap) painted in the
  //     exact same Farrow & Ball Setting Plaster (`warmRoomPlasterMat`) as the walls!
  // ==========================================================================
  const baseboardsGroup = new THREE.Group();
  baseboardsGroup.name = 'outbuildings.firstFloor.stableBedroom.baseboards';
  bedroomGroup.add(baseboardsGroup);

  type BaseboardCornerMiter = 'butt' | 'internal' | 'external';

  const createMiteredBaseboardGeo = (
    alongU: boolean,
    len: number,
    height: number,
    thickness: number,
    normalSignX: number,
    normalSignZ: number,
    startMiter: BaseboardCornerMiter,
    endMiter: BaseboardCornerMiter
  ): THREE.BufferGeometry => {
    const geo = new THREE.BoxGeometry(alongU ? len : thickness, height, alongU ? thickness : len);
    const pos = geo.attributes.position;
    if (pos) {
      const startFrontShift =
        startMiter === 'external' ? -thickness : startMiter === 'internal' ? thickness : 0;
      const endFrontShift =
        endMiter === 'external' ? thickness : endMiter === 'internal' ? -thickness : 0;
      for (let i = 0; i < pos.count; i++) {
        if (alongU) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const isFront = Math.sign(z) === Math.sign(normalSignZ);
          if (isFront) {
            if (x < 0) pos.setX(i, x + startFrontShift);
            else pos.setX(i, x + endFrontShift);
          }
        } else {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const isFront = Math.sign(x) === Math.sign(normalSignX);
          if (isFront) {
            if (z < 0) pos.setZ(i, z + startFrontShift);
            else pos.setZ(i, z + endFrontShift);
          }
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
    return geo;
  };

  const addColorDrenchedBaseboardRun = (
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    normalSignX: number,
    normalSignZ: number,
    startMiter: BaseboardCornerMiter = 'butt',
    endMiter: BaseboardCornerMiter = 'butt'
  ): void => {
    const alongU = Math.abs(u1 - u0) >= Math.abs(v1 - v0);
    const len = Math.abs(alongU ? u1 - u0 : v1 - v0);
    if (len <= 0.02) return;
    const midU = (u0 + u1) * 0.5;
    const midV = (v0 + v1) * 0.5;
    const floorClear = 0.004;
    const wallClear = 0.004;
    const baseH = 0.118;
    const capH = 0.024;
    const skirtT = 0.019;
    const capT = 0.015;

    const skirtMesh = new THREE.Mesh(
      createMiteredBaseboardGeo(
        alongU,
        len,
        baseH + 0.004,
        skirtT,
        normalSignX,
        normalSignZ,
        startMiter,
        endMiter
      ),
      warmRoomPlasterMat
    );
    skirtMesh.name = 'outbuildings.firstFloor.stableBedroom.baseboards.skirt';
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.position.set(
      midU + normalSignX * (wallClear + skirtT * 0.5),
      stableUpperFloorY + floorClear + (baseH + 0.004) * 0.5,
      midV + normalSignZ * (wallClear + skirtT * 0.5)
    );
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    baseboardsGroup.add(skirtMesh);

    const createMiteredProfiledCap = (): THREE.BufferGeometry => {
      const inwardSign: 1 | -1 = alongU
        ? normalSignZ >= 0
          ? 1
          : -1
        : normalSignX >= 0
          ? 1
          : -1;
      const geo = createProfiledSkirtingCapGeometry(len, alongU, inwardSign);
      const pos = geo.attributes.position;
      if (pos) {
        for (let i = 0; i < pos.count; i++) {
          if (alongU) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            // Distance from wall face (wallClear at back, wallClear + capT at front nose)
            const distFromWall = Math.max(0, wallClear + inwardSign * z + capT * 0.5);
            const startShift =
              startMiter === 'external'
                ? -distFromWall
                : startMiter === 'internal'
                  ? distFromWall
                  : 0;
            const endShift =
              endMiter === 'external'
                ? distFromWall
                : endMiter === 'internal'
                  ? -distFromWall
                  : 0;
            if (x < 0) pos.setX(i, x + startShift);
            else pos.setX(i, x + endShift);
          } else {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const distFromWall = Math.max(0, wallClear + inwardSign * x + capT * 0.5);
            const startShift =
              startMiter === 'external'
                ? -distFromWall
                : startMiter === 'internal'
                  ? distFromWall
                  : 0;
            const endShift =
              endMiter === 'external'
                ? distFromWall
                : endMiter === 'internal'
                  ? -distFromWall
                  : 0;
            if (z < 0) pos.setZ(i, z + startShift);
            else pos.setZ(i, z + endShift);
          }
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }
      return geo;
    };

    const capMesh = new THREE.Mesh(
      createMiteredProfiledCap(),
      warmRoomPlasterMat
    );
    capMesh.name = 'outbuildings.firstFloor.stableBedroom.baseboards.cap';
    capMesh.userData.isArchitecturalShell = true;
    capMesh.position.set(
      midU + normalSignX * (wallClear + capT * 0.5),
      stableUpperFloorY + floorClear + baseH + capH * 0.5,
      midV + normalSignZ * (wallClear + capT * 0.5)
    );
    baseboardsGroup.add(capMesh);
  };

  // 1. North Bedroom Wall (`v = 0.28m`, from East side of Shaker wardrobes `u = 23.84m` to East wall `u = 28.77m` internal corner)
  addColorDrenchedBaseboardRun(23.84, 0.28, uRoomEast, 0.28, 0, 1, 'butt', 'internal');
  // 2. East Bedroom Wall North & South piers (`u = 28.77m`, `v = 0.28..2.215m` and `v = 3.495..5.43m` right up to the French balcony door jambs — Issue #3!)
  addColorDrenchedBaseboardRun(uRoomEast, 0.28, uRoomEast, 2.215, -1, 0, 'internal', 'butt');
  addColorDrenchedBaseboardRun(uRoomEast, 3.495, uRoomEast, 5.43, -1, 0, 'butt', 'internal');
  // 3. South Bedroom Wall East of Ensuite (`v = 5.43m`, `u = 26.09..28.77m`)
  addColorDrenchedBaseboardRun(uEnsuiteEastFace, 5.43, uRoomEast, 5.43, 0, -1, 'internal', 'internal');
  // 4. Ensuite East Wall Bedroom Face (`u = 26.09m`, `v = 3.37..5.43m` — true 45-degree external miter at `v = 3.37m` and internal miter at `v = 5.43m`!)
  addColorDrenchedBaseboardRun(uEnsuiteEastFace, vNorthFace, uEnsuiteEastFace, 5.43, 1, 0, 'external', 'internal');
  // 5. Ensuite North Wall Bedroom Face West & East of Ensuite Doorway (`v = 3.37m`, `u = 23.22..24.59m` and `u = 25.41..26.09m` with matching 45-degree external miter at `u = 26.09m`!)
  addColorDrenchedBaseboardRun(uWest, vNorthFace, doorU0 - 0.03, vNorthFace, 0, -1, 'butt', 'butt');
  addColorDrenchedBaseboardRun(doorU1 + 0.03, vNorthFace, uEnsuiteEastFace, vNorthFace, 0, -1, 'butt', 'external');

  bedroomGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });
}
