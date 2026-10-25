import * as THREE from 'three';
import { buildMitredArchitraveSegments, createProfiledSkirtingCapGeometry } from '../../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import { createBevelledHexHeadGeometry } from './shared-geometry-and-materials.ts';

/**
 * Generates the authentic light pebble-grey (`#d6d8db`) Nike Grind recycled footwear rubber texture
 * matching the uploaded Nike Grind Dumbbell reference photos: a light cool grey/off-white rubber matrix
 * speckled with fine black, dark-charcoal, cobalt-blue, crimson-red, ochre-yellow, and white granules,
 * plus the recessed rectangular black Nike Swoosh badge and bold weight numerals on the hex facets.
 */
const cachedNikeGrindHexTextures = new Map<number, THREE.CanvasTexture>();

export function createNikeGrindLightGreyHexTexture(weightLb: number): THREE.CanvasTexture {
  const cached = cachedNikeGrindHexTextures.get(weightLb);
  if (cached) {
    return cached;
  }
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Light cool pebble-grey Nike Grind rubber base (#d5d7da)
  ctx.fillStyle = '#d5d7da';
  ctx.fillRect(0, 0, w, h);

  // Subtle moulded rubber surface grain
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const n = Math.sin(x * 19.13 + y * 47.71) * 43758.5453;
      const f = n - Math.floor(n);
      if (f > 0.65) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(x, y, 2, 2);
      } else if (f < 0.35) {
        ctx.fillStyle = 'rgba(155, 160, 168, 0.14)';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // 2. Authentic multicolour recycled sneaker crumb flecks (predominantly black/charcoal, plus blue, red, yellow, white)
  const fleckPalette = [
    '#141619', // Carbon black crumb (most frequent)
    '#282c32', // Dark charcoal crumb
    '#141619', // Carbon black crumb
    '#5a6068', // Mid slate crumb
    '#1a66cc', // Hyper Cobalt blue fleck
    '#c82820', // Crimson red fleck
    '#e0a010', // Ochre yellow fleck
    '#f4f6f8', // White EVA fleck
    '#141619', // Carbon black crumb
  ];

  for (let i = 0; i < 2400; i++) {
    const h1 = Math.sin(i * 12.9898 + weightLb * 0.7) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233 + weightLb * 1.3) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin(i * 39.425 + 5.1) * 17391.831;
    const f3 = h3 - Math.floor(h3);

    const x = f1 * w;
    const y = f2 * h;
    const r = 0.7 + f3 * 2.2;
    ctx.fillStyle = fleckPalette[i % fleckPalette.length]!;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + f1 * 0.6), f2 * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw recessed rectangular badge + bold black Nike Swoosh on the top-facing hex facet (`u ≈ 0.25`)
  //    and recessed rectangular badge + bold black weight numerals (`10`..`50`) on the opposite facet (`u ≈ 0.75`)
  const drawRecessedBox = (cx: number, cy: number, bw: number, bh: number): void => {
    ctx.fillStyle = 'rgba(185, 188, 194, 0.55)';
    ctx.fillRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
    ctx.strokeStyle = 'rgba(130, 134, 140, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
  };

  // Facet A (`cx = w * 0.25, cy = h * 0.5`): Black Nike Swoosh
  const sx = w * 0.25;
  const sy = h * 0.5;
  drawRecessedBox(sx, sy, 68, 86);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = '#111315';
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.quadraticCurveTo(-28, 12, -12, 18);
  ctx.quadraticCurveTo(4, 22, 26, -12);
  ctx.quadraticCurveTo(-2, 8, -12, 4);
  ctx.quadraticCurveTo(-20, 0, -18, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Facet B (`cx = w * 0.75, cy = h * 0.5`): Bold Black Weight Numeral
  const nx = w * 0.75;
  const ny = h * 0.5;
  drawRecessedBox(nx, ny, 72, 88);
  ctx.save();
  ctx.translate(nx, ny);
  ctx.fillStyle = '#111315';
  ctx.font = '900 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(weightLb), 0, 2);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  cachedNikeGrindHexTextures.set(weightLb, tex);
  return tex;
}

/**
 * Generates the triangular lower side-gusset plate texture with the laser-cut Nike Swoosh
 * above bold stencilled `NIKE` lettering (`media_1791145079438_8999d4b6.jpg`).
 */
let cachedNikeSideGussetTexture: THREE.CanvasTexture | null = null;

export function createNikeSideGussetTexture(): THREE.CanvasTexture {
  if (cachedNikeSideGussetTexture) {
    return cachedNikeSideGussetTexture;
  }
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d1f23';
  ctx.fillRect(0, 0, size, size);

  // Subtle laser-cut Swoosh + stencilled NIKE logo in light background contrast
  ctx.fillStyle = '#dcdfe4';
  ctx.beginPath();
  ctx.moveTo(106, 134);
  ctx.quadraticCurveTo(94, 152, 108, 156);
  ctx.quadraticCurveTo(124, 160, 158, 136);
  ctx.quadraticCurveTo(122, 150, 111, 146);
  ctx.quadraticCurveTo(104, 144, 106, 134);
  ctx.closePath();
  ctx.fill();

  ctx.font = '900 38px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NIKE', 128, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedNikeSideGussetTexture = tex;
  return tex;
}

/**
 * Issue #4 ("Remove this glas window and replace with a double height glass door"
 * at `[-16.431, 0.87, 17.617]`, `outbuildings.gymGarageViewingWindow.glass`):
 * 1. Replaces the half-height viewing window with a **Full-Height ("Double Height") Architectural Glazed Double Door
 *    & Sidelight Screen (`outbuildings.gymGarageGlassDoor`)** extending from the Gym floor (`y = baseY0 = -0.60m`)
 *    all the way up to `y = 1.78m` (`2.38m` full-height span) across `v = 0.88m..3.52m` (`2.64m` wide, centered at
 *    `v = 2.20m` right at the annotated hit point `v = 2.139m`), with two interactive hinged full-height glass doors
 *    (`ctx.interactions.registerHingedDoor`) and flanked by full-height glazed sidelights.
 * 2. Adds profiled skirting boards (`outbuildings.gym.skirting`) around the interior perimeter of the GYM, stopping
 *    cleanly at the full-height glass double door (`v = 0.88..3.52m`) and the Gym-to-Shower-Room door (`v = 4.18..4.94m`).
 */
export function buildGymOakDoorAndSkirting(
  ctx: SceneBuilderContext,
  groundGroup: THREE.Group,
  baseY0: number,
  wallT: number,
  uGymEnd: number,
  partT: number,
  vWestRangeSouth: number,
  skirtingMat: THREE.Material
): void {
  const lightOakFrameMat = new THREE.MeshStandardMaterial({
    color: 0xc2986b, // Warm light European oak joinery & threshold step
    roughness: 0.42,
    metalness: 0.04,
  });
  const lightOakTrimMat = new THREE.MeshStandardMaterial({
    color: 0xb28759, // Chamfered light oak architrave moulding
    roughness: 0.46,
    metalness: 0.04,
  });
  const satinBlackMullionMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228, // Slim architectural satin-anthracite steel glazing mullions, stiles & rails
    roughness: 0.34,
    metalness: 0.68,
  });
  const brushedSteelHardwareMat = new THREE.MeshStandardMaterial({
    color: 0xd8dfe6, // Brushed stainless pull handles, hinges & threshold plate
    roughness: 0.22,
    metalness: 0.88,
  });
  const viewingGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdcf0f7, // Crystal-clear low-iron toughened acoustic safety glass
    roughness: 0.06,
    metalness: 0.14,
    transparent: true,
    opacity: 0.22,
  });

  // ---------------------------------------------------------------------------
  // 1. Full-Height ("Double Height") 2.64m x 2.38m Glazed Double Door & Sidelight Screen
  //    (`outbuildings.gymGarageGlassDoor`, `u = 5.77..5.97m, v = 0.88..3.52m, y = baseY0 (-0.60m) .. +1.78m`)
  // ---------------------------------------------------------------------------
  const screenUMid = uGymEnd + partT * 0.5; // 5.87m
  const screenVMin = 0.88;
  const screenVMax = 3.52;
  const screenVMid = (screenVMin + screenVMax) * 0.5; // 2.20m (right at hit point v = 2.139m!)
  const screenW = screenVMax - screenVMin; // 2.64m wide
  const screenH = 2.38; // Full height from `baseY0 = -0.60m` up to `y = +1.78m` (`2.38m` tall!)
  const jambT = 0.034;
  const archW = 0.062;
  const thresholdStepH = 0.1; // Bridges `baseY0 = -0.60m` (Gym) up to `garageFloorTopY = -0.50m` (Garage)

  const glassDoorScreenGroup = new THREE.Group();
  glassDoorScreenGroup.name = 'outbuildings.gymGarageGlassDoor';
  glassDoorScreenGroup.userData.zone = 'courtyard';
  glassDoorScreenGroup.position.set(screenUMid, baseY0, screenVMid);
  groundGroup.add(glassDoorScreenGroup);

  // Solid European Oak & Brushed-Stainless Threshold Step (`y = 0.002..0.098m` above `baseY0`, clear of garage resinFloor)
  const thresholdStep = new THREE.Mesh(
    new THREE.BoxGeometry(partT - 0.012, thresholdStepH - 0.004, screenW - 0.008),
    lightOakFrameMat
  );
  thresholdStep.name = 'outbuildings.gymGarageGlassDoor.threshold';
  thresholdStep.position.set(-0.002, thresholdStepH * 0.5, 0);
  thresholdStep.receiveShadow = true;
  glassDoorScreenGroup.add(thresholdStep);

  const thresholdSillPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.004, screenW - jambT * 2 - 0.012),
    brushedSteelHardwareMat
  );
  thresholdSillPlate.name = 'outbuildings.gymGarageGlassDoor.thresholdSillPlate';
  thresholdSillPlate.userData.lodTier = 'high';
  thresholdSillPlate.userData.lodMaxDistance = 12;
  thresholdSillPlate.position.set(-0.002, thresholdStepH + 0.005, 0);
  glassDoorScreenGroup.add(thresholdSillPlate);

  // Full-depth outer frame jamb linings (North & South) and top head lining
  const jambSpanH = screenH - thresholdStepH - 0.008;
  for (const sideZ of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.01, jambSpanH, jambT),
      satinBlackMullionMat
    );
    jamb.name = `outbuildings.gymGarageGlassDoor.jamb.${sideZ < 0 ? 'north' : 'south'}`;
    jamb.position.set(
      0,
      thresholdStepH + 0.004 + jambSpanH * 0.5,
      sideZ * (screenW * 0.5 - jambT * 0.5 - 0.002)
    );
    jamb.castShadow = true;
    jamb.receiveShadow = true;
    glassDoorScreenGroup.add(jamb);
  }
  const headLining = new THREE.Mesh(
    new THREE.BoxGeometry(partT + 0.01, jambT, screenW - jambT * 2 - 0.012),
    satinBlackMullionMat
  );
  headLining.name = 'outbuildings.gymGarageGlassDoor.headLining';
  headLining.position.set(0, screenH - jambT * 0.5 - 0.004, 0);
  glassDoorScreenGroup.add(headLining);

  // 45°-Mitred Ogee/Torus Profiled Perimeter Architraves on both the GYM (`-u`) and Garage (`+u`) wall faces
  for (const sideX of [-1, 1] as const) {
    const faceTag = sideX < 0 ? 'gym' : 'garage';
    const [northLegGeo, headGeo, southLegGeo] = buildMitredArchitraveSegments(
      -(screenW * 0.5 - 0.012),
      screenW * 0.5 - 0.012,
      thresholdStepH + 0.004,
      thresholdStepH + 0.004,
      screenH - 0.006,
      'z',
      sideX * (partT * 0.5 + 0.006),
      sideX,
      archW,
      0.020
    );
    const northLeg = new THREE.Mesh(northLegGeo, lightOakTrimMat);
    northLeg.name = `outbuildings.gymGarageGlassDoor.architraveLeg.${faceTag}.north`;
    northLeg.castShadow = true;
    glassDoorScreenGroup.add(northLeg);

    const southLeg = new THREE.Mesh(southLegGeo, lightOakTrimMat);
    southLeg.name = `outbuildings.gymGarageGlassDoor.architraveLeg.${faceTag}.south`;
    southLeg.castShadow = true;
    glassDoorScreenGroup.add(southLeg);

    const archHeader = new THREE.Mesh(headGeo, lightOakTrimMat);
    archHeader.name = `outbuildings.gymGarageGlassDoor.architraveHeader.${faceTag}`;
    archHeader.castShadow = true;
    glassDoorScreenGroup.add(archHeader);
  }

  // Clear opening above threshold (`clearH = 2.246m`, `clearW = 2.572m`):
  // - North Fixed Full-Height Glazed Sidelight (`z = -1.286m .. -0.78m`, width `0.506m`)
  // - Central Full-Height Interactive Double Glass Doors (`z = -0.78m .. +0.78m`, width `1.56m`, two `0.774m` leaves)
  // - South Fixed Full-Height Glazed Sidelight (`z = +0.78m .. +1.286m`, width `0.506m`)
  const clearBottomY = thresholdStepH + 0.012; // clear above thresholdSillPlate
  const clearTopY = screenH - jambT - 0.008;
  const clearH = clearTopY - clearBottomY;
  const clearMidY = clearBottomY + clearH * 0.5;
  const doorOpeningHalfW = 0.78;
  const mullionW = 0.036;
  const mullionD = 0.064;

  // 2 Full-Height Vertical Structural Mullion Posts at `z = ±0.78m` flanking the double doors
  for (const sideZ of [-1, 1] as const) {
    const sideTag = sideZ < 0 ? 'north' : 'south';
    const postZ = sideZ * (doorOpeningHalfW + mullionW * 0.5);
    const mullionPost = new THREE.Mesh(
      new THREE.BoxGeometry(mullionD, clearH, mullionW),
      satinBlackMullionMat
    );
    mullionPost.name = `outbuildings.gymGarageGlassDoor.mullionPost.${sideTag}`;
    mullionPost.position.set(0, clearMidY, postZ);
    mullionPost.castShadow = true;
    glassDoorScreenGroup.add(mullionPost);

    // Fixed Full-Height Sidelight between `postZ` and outer jamb (`±(screenW * 0.5 - jambT)`)
    const sidelightInnerZ = sideZ * (doorOpeningHalfW + mullionW + 0.004);
    const sidelightOuterZ = sideZ * (screenW * 0.5 - jambT - 0.006);
    const sidelightW = Math.abs(sidelightOuterZ - sidelightInnerZ);
    const sidelightMidZ = (sidelightInnerZ + sidelightOuterZ) * 0.5;

    let glazingBarIdx = 0;
    for (const railY of [clearBottomY + 0.018, clearTopY - 0.018, clearBottomY + clearH * 0.34, clearBottomY + clearH * 0.67] as const) {
      glazingBarIdx++;
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.024, sidelightW),
        satinBlackMullionMat
      );
      hBar.name = `outbuildings.gymGarageGlassDoor.sidelightGlazingBar.${sideTag}.${glazingBarIdx}`;
      hBar.position.set(0, railY, sidelightMidZ);
      glassDoorScreenGroup.add(hBar);
    }

    const sidelightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, clearH - 0.072, sidelightW - 0.008),
      viewingGlassMat
    );
    sidelightGlass.name = 'outbuildings.gymGarageGlassDoor.sidelightGlass';
    sidelightGlass.position.set(0, clearMidY, sidelightMidZ);
    glassDoorScreenGroup.add(sidelightGlass);
  }

  // Two Interactive Full-Height ("Double Height") Glazed Door Leaves (`northLeaf` & `southLeaf`)
  const leafW = doorOpeningHalfW - 0.004; // 0.776m per leaf
  const leafH = clearH - 0.008;
  const leafT = 0.044;
  const stileW = 0.046;

  for (const [sideZ, leafName] of [
    [-1, 'outbuildings.gymGarageGlassDoor.northLeaf'],
    [1, 'outbuildings.gymGarageGlassDoor.southLeaf'],
  ] as const) {
    // Hinge pivot at the outer mullion post (`z = sideZ * (doorOpeningHalfW - 0.004)`)
    const hingeZ = sideZ * (doorOpeningHalfW - 0.004);
    const leafPivot = new THREE.Group();
    leafPivot.name = leafName;
    leafPivot.position.set(0, clearMidY, hingeZ);
    glassDoorScreenGroup.add(leafPivot);

    // Center of leaf relative to `hingeZ` is `-sideZ * (leafW * 0.5)`
    const leafCenterRelZ = -sideZ * (leafW * 0.5);

    // Outer hinge stile & inner meeting stile
    let stileIdx = 0;
    for (const stileRelZ of [
      -sideZ * (stileW * 0.5),
      -sideZ * (leafW - stileW * 0.5),
    ] as const) {
      stileIdx++;
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, leafH, stileW),
        satinBlackMullionMat
      );
      stile.name = `${leafName}.stile.${stileIdx === 1 ? 'hinge' : 'meeting'}`;
      stile.position.set(0, 0, stileRelZ);
      stile.castShadow = true;
      leafPivot.add(stile);
    }

    // Top rail, bottom kick rail, and 2 slender Crittall horizontal glazing bars matching the sidelights
    let railIdx = 0;
    for (const [railRelY, railH] of [
      [-leafH * 0.5 + 0.032, 0.064],
      [leafH * 0.5 - 0.024, 0.048],
      [-leafH * 0.5 + leafH * 0.34, 0.022],
      [-leafH * 0.5 + leafH * 0.67, 0.022],
    ] as const) {
      railIdx++;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, railH, leafW - stileW * 2 - 0.008),
        satinBlackMullionMat
      );
      rail.name = `${leafName}.rail.${railIdx}`;
      rail.position.set(0, railRelY, leafCenterRelZ);
      rail.castShadow = true;
      leafPivot.add(rail);
    }

    // Full-Height Toughened Acoustic Glass Pane (`outbuildings.gymGarageGlassDoor.glass` & legacy alias `.gymGarageViewingWindow.glass`)
    const doorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, leafH - 0.128, leafW - stileW * 2 - 0.008),
      viewingGlassMat
    );
    doorGlass.name = 'outbuildings.gymGarageGlassDoor.glass';
    doorGlass.position.set(0, 0.008, leafCenterRelZ);
    leafPivot.add(doorGlass);

    // Issue #4 ("black handles" at `[-16.448, 0.523, 17.616]`, `outbuildings.gymGarageGlassDoor.glass`):
    // Long vertical architectural matte-black anodized pull handles on both the GYM (`-x`) and Garage (`+x`) faces
    const handleRelZ = -sideZ * (leafW - stileW - 0.028);
    for (const faceX of [-1, 1] as const) {
      const pullBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.52, 14),
        satinBlackMullionMat
      );
      pullBar.name = 'outbuildings.gymGarageGlassDoor.handle';
      pullBar.position.set(faceX * (leafT * 0.5 + 0.036), -0.06, handleRelZ);
      leafPivot.add(pullBar);

      for (const standY of [-0.22, 0.1] as const) {
        const standoff = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.02, 10),
          satinBlackMullionMat
        );
        standoff.name = 'outbuildings.gymGarageGlassDoor.handleStandoff';
        standoff.userData.lodTier = 'high';
        standoff.userData.lodMaxDistance = 12;
        standoff.rotation.z = Math.PI / 2;
        standoff.position.set(faceX * (leafT * 0.5 + 0.015), standY, handleRelZ);
        leafPivot.add(standoff);
      }
    }

    // Register interactive hinged door so clicking either full-height glass leaf swings it smoothly open!
    ctx.interactions.registerHingedDoor(
      glassDoorScreenGroup,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      sideZ * Math.PI * 0.48
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Profiled Architectural Skirting Boards around the GYM (`outbuildings.gym.skirting`)
  // ---------------------------------------------------------------------------
  const skirtingGroup = new THREE.Group();
  skirtingGroup.name = 'outbuildings.gym.skirting';
  skirtingGroup.userData.isArchitecturalShell = true;
  groundGroup.add(skirtingGroup);

  const skirtFloorClearY = baseY0 + 0.016; // 4mm above gymRubberTileFloor (`baseY0 + 0.012`)
  const skirtBaseH = 0.102;
  const skirtCapH = 0.024;
  const skirtBaseT = 0.02;
  const skirtCapT = 0.014;
  const wallGap = 0.004;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m

  let skirtingSegIdx = 0;

  const addSkirtingAlongU = (u0: number, u1: number, vWallFace: number, inwardSignV: 1 | -1): void => {
    const lenU = u1 - u0;
    if (lenU <= 0.01) return;
    skirtingSegIdx++;
    const midU = (u0 + u1) * 0.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(lenU, skirtBaseH, skirtBaseT),
      skirtingMat
    );
    baseMesh.name = `outbuildings.gym.skirting.base.${skirtingSegIdx}`;
    baseMesh.position.set(
      midU,
      skirtFloorClearY + skirtBaseH * 0.5,
      vWallFace + inwardSignV * (wallGap + skirtBaseT * 0.5)
    );
    baseMesh.receiveShadow = true;
    skirtingGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(
      createProfiledSkirtingCapGeometry(lenU, true, inwardSignV),
      skirtingMat
    );
    capMesh.name = `outbuildings.gym.skirting.mouldingCap.${skirtingSegIdx}`;
    capMesh.userData.lodTier = 'high';
    capMesh.userData.lodMaxDistance = 12;
    capMesh.position.set(
      midU,
      skirtFloorClearY + skirtBaseH + 0.004 + skirtCapH * 0.5,
      vWallFace + inwardSignV * (wallGap + skirtCapT * 0.5)
    );
    skirtingGroup.add(capMesh);
  };

  const addSkirtingAlongV = (v0: number, v1: number, uWallFace: number, inwardSignU: 1 | -1): void => {
    const lenV = v1 - v0;
    if (lenV <= 0.01) return;
    skirtingSegIdx++;
    const midV = (v0 + v1) * 0.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(skirtBaseT, skirtBaseH, lenV),
      skirtingMat
    );
    baseMesh.name = `outbuildings.gym.skirting.base.${skirtingSegIdx}`;
    baseMesh.position.set(
      uWallFace + inwardSignU * (wallGap + skirtBaseT * 0.5),
      skirtFloorClearY + skirtBaseH * 0.5,
      midV
    );
    baseMesh.receiveShadow = true;
    skirtingGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(
      createProfiledSkirtingCapGeometry(lenV, false, inwardSignU),
      skirtingMat
    );
    capMesh.name = `outbuildings.gym.skirting.mouldingCap.${skirtingSegIdx}`;
    capMesh.userData.lodTier = 'high';
    capMesh.userData.lodMaxDistance = 12;
    capMesh.position.set(
      uWallFace + inwardSignU * (wallGap + skirtCapT * 0.5),
      skirtFloorClearY + skirtBaseH + 0.004 + skirtCapH * 0.5,
      midV
    );
    skirtingGroup.add(capMesh);
  };

  // Segmented skirting along GYM West road wall (`u = wallT`), stopping cleanly at Door 1830288 (`v = 3.82..4.63m`) & corners
  const cornerStop = wallGap + skirtBaseT + 0.006;
  addSkirtingAlongV(vInnerNorth + cornerStop, 3.8, wallT, 1);
  addSkirtingAlongV(4.65, vInnerSouth - cornerStop, wallT, 1);
  // Segmented skirting along the GYM East partition wall (`u = 5.77m`), stopping cleanly at
  // the full-height glass double door (`v = 0.88..3.52m`), Gym-to-Shower-Room door (`v = 4.18..4.94m`), & corners!
  addSkirtingAlongV(vInnerNorth + cornerStop, 0.82, uGymEnd, -1);
  addSkirtingAlongV(3.58, 4.12, uGymEnd, -1);
  addSkirtingAlongV(5.0, vInnerSouth - cornerStop, uGymEnd, -1);

  addSkirtingAlongU(wallT + 0.006, 2.71 - cornerStop, vInnerNorth, 1);
  addSkirtingAlongV(vInnerNorth + 0.006, vInnerNorth + 0.16, 2.71, -1);
  addSkirtingAlongU(2.71 - skirtBaseT, 3.01 + skirtBaseT, vInnerNorth + 0.16, 1);
  addSkirtingAlongV(vInnerNorth + 0.006, vInnerNorth + 0.16, 3.01, 1);
  addSkirtingAlongU(5.45 + 0.006, uGymEnd - 0.006, vInnerNorth, 1);

  addSkirtingAlongU(wallT + 0.006, 2.71 - cornerStop, vInnerSouth, -1);
  addSkirtingAlongV(vInnerSouth - 0.16, vInnerSouth - 0.006, 2.71, -1);
  addSkirtingAlongU(2.71 - skirtBaseT, 3.01 + skirtBaseT, vInnerSouth - 0.16, -1);
  addSkirtingAlongV(vInnerSouth - 0.16, vInnerSouth - 0.006, 3.01, 1);
  addSkirtingAlongU(3.01 + cornerStop, uGymEnd - 0.006, vInnerSouth, -1);
}

/**
 * Issue #3 ("Nike grind dumbell rack here" at `[-21.015, -0.123, 16.156]` + 2 Uploaded Reference Photos):
 * Builds the exact 3-Tier Commercial Nike Grind Hex Dumbbell Rack (`outbuildings.gym.nikeGrindDumbbellRack`)
 * shown in the user's photos:
 * - Matte-black powder-coated steel 3-tier A-frame with angled front C-channel columns, rear support legs,
 *   bolted dual-angle-iron trays, rubber end-cap foot boots, and triangular lower side gusset plates
 *   with the laser-cut Nike Swoosh + `NIKE` stencil.
 * - 10 Graduated Pairs (20 dumbbells total) of light pebble-grey speckled Nike Grind Rounded-Hex Dumbbells:
 *   - Top Tier (4 pairs): `5`, `10`, `15`, `20` lb
 *   - Middle Tier (3 pairs): `25`, `30`, `35` lb
 *   - Bottom Tier (3 pairs): `40`, `45`, `50` lb
 *   Each dumbbell features softly bevelled light-grey speckled Nike Grind hex heads with the black Nike Swoosh
 *   on the front head and bold black weight numbers on the rear head, joined by a contoured barrel chrome handle.
 */
export function buildNikeGrindDumbbellRack(
  groundGroup: THREE.Group,
  baseY0: number
): void {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.gym.nikeGrindDumbbellRack';
  rackGroup.position.set(1.49, baseY0, 0.62);
  groundGroup.add(rackGroup);

  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22, // Matte black powder-coated steel rack frame
    roughness: 0.42,
    metalness: 0.62,
  });
  const rubberBootMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.78,
    metalness: 0.06,
  });
  const chromeBoltMat = new THREE.MeshStandardMaterial({
    color: 0xe2e6ec, // Polished chrome handle & stainless hex bolts
    roughness: 0.16,
    metalness: 0.94,
  });
  const knurledGripMat = new THREE.MeshStandardMaterial({
    color: 0xbec4cc, // Matte diamond-knurled grip bands on the contoured handle
    roughness: 0.44,
    metalness: 0.84,
  });
  const sideGussetMat = new THREE.MeshStandardMaterial({
    map: createNikeSideGussetTexture(),
    roughness: 0.45,
    metalness: 0.55,
  });

  const rackW = 1.44;
  const rackD = 0.58;
  const rackH = 0.88;

  // 1. Left & Right Matte-Black Steel A-Frame Side Uprights, Rubber Foot Boots & Triangular `NIKE` Side Gussets
  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const ux = sideX * (rackW * 0.5 - 0.032);

    // Base stabilizer foot rail (`0.58m` deep) + moulded black rubber front/back end boots
    const baseSkid = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.042, rackD - 0.06),
      frameSteelMat
    );
    baseSkid.name = `outbuildings.gym.nikeGrindDumbbellRack.baseSkid.${sideTag}`;
    baseSkid.position.set(ux, 0.025, 0);
    baseSkid.castShadow = true;
    baseSkid.receiveShadow = true;
    rackGroup.add(baseSkid);

    for (const bootZ of [-rackD * 0.5 + 0.035, rackD * 0.5 - 0.035]) {
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.076, 0.052, 0.082),
        rubberBootMat
      );
      boot.name = `outbuildings.gym.nikeGrindDumbbellRack.rubberBoot.${sideTag}.${bootZ < 0 ? 'rear' : 'front'}`;
      boot.userData.lodTier = 'high';
      boot.userData.lodMaxDistance = 12;
      boot.position.set(ux, 0.026, bootZ);
      rackGroup.add(boot);
    }

    // Main front/top sloped C-channel upright column (raking backward from front base to top tier)
    const frontLegLen = Math.hypot(rackH - 0.04, 0.28);
    const frontLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, frontLegLen, 0.068),
      frameSteelMat
    );
    frontLeg.name = `outbuildings.gym.nikeGrindDumbbellRack.frontColumn.${sideTag}`;
    frontLeg.position.set(ux, rackH * 0.5 + 0.01, 0.03);
    frontLeg.rotation.x = -0.31; // Slopes up and toward `-Z` (rear)
    frontLeg.castShadow = true;
    rackGroup.add(frontLeg);

    // Rear support leg rising from rear foot to the upper/middle column
    const rearLegLen = Math.hypot(rackH * 0.82, 0.16);
    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, rearLegLen, 0.062),
      frameSteelMat
    );
    rearLeg.name = `outbuildings.gym.nikeGrindDumbbellRack.rearLeg.${sideTag}`;
    rearLeg.position.set(ux, rackH * 0.42 + 0.01, -0.14);
    rearLeg.rotation.x = 0.14;
    rearLeg.castShadow = true;
    rackGroup.add(rearLeg);

    // Lower Triangular Side Gusset Plate with Laser-Cut Nike Swoosh & Stencilled `NIKE` Logo (Photo 1)
    const gusset = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.34, 0.24),
      sideGussetMat
    );
    gusset.name = `outbuildings.gym.nikeGrindDumbbellRack.sideGusset.${sideTag}`;
    gusset.position.set(ux + sideX * 0.024, 0.19, 0.09);
    rackGroup.add(gusset);
  }

  // 2. Three Angled Steel Dumbbell Shelf Tiers (Bottom: 3 pairs, Middle: 3 pairs, Top: 4 pairs — Photo 1)
  const tierSpecs = [
    {
      id: 'bottom',
      y: 0.22,
      z: 0.08,
      weights: [40, 45, 50] as const,
      radii: [0.084, 0.088, 0.092] as const,
      lengths: [0.092, 0.096, 0.1] as const,
    },
    {
      id: 'middle',
      y: 0.53,
      z: -0.01,
      weights: [25, 30, 35] as const,
      radii: [0.072, 0.076, 0.08] as const,
      lengths: [0.078, 0.082, 0.086] as const,
    },
    {
      id: 'top',
      y: 0.83,
      z: -0.1,
      weights: [5, 10, 15, 20] as const,
      radii: [0.048, 0.055, 0.062, 0.068] as const,
      lengths: [0.056, 0.062, 0.068, 0.074] as const,
    },
  ] as const;

  // Contoured barrel handle profile (`LatheGeometry` around Y)
  const handlePoints = [
    new THREE.Vector2(0.0135, -0.066),
    new THREE.Vector2(0.0155, -0.042),
    new THREE.Vector2(0.0172, 0.0),
    new THREE.Vector2(0.0155, 0.042),
    new THREE.Vector2(0.0135, 0.066),
  ];
  const barrelHandleGeo = new THREE.LatheGeometry(handlePoints, 14);
  barrelHandleGeo.rotateX(Math.PI / 2); // Align handle axis along local Z
  barrelHandleGeo.computeBoundingSphere();

  const traySpanX = rackW - 0.11;

  for (let tIdx = 0; tIdx < tierSpecs.length; tIdx++) {
    const tier = tierSpecs[tIdx]!;
    const tierPrefix = `outbuildings.gym.nikeGrindDumbbellRack.tier.${tier.id}`;
    const trayGroup = new THREE.Group();
    trayGroup.name = tierPrefix;
    trayGroup.position.set(0, tier.y, tier.z);
    trayGroup.rotation.x = 0.22; // Forward downward presentation tilt matching Photo 1
    rackGroup.add(trayGroup);

    // Front & Rear Black Angle-Iron Cradle Rails + End Mounting Brackets with Silver Hex Bolts
    for (const railZ of [-0.115, 0.115] as const) {
      const railPosTag = railZ < 0 ? 'rear' : 'front';
      const railBar = new THREE.Mesh(
        new THREE.BoxGeometry(traySpanX, 0.022, 0.042),
        frameSteelMat
      );
      railBar.name = `${tierPrefix}.railBar.${railPosTag}`;
      railBar.position.set(0, 0, railZ);
      railBar.castShadow = true;
      railBar.receiveShadow = true;
      trayGroup.add(railBar);

      const railLip = new THREE.Mesh(
        new THREE.BoxGeometry(traySpanX, 0.036, 0.012),
        frameSteelMat
      );
      railLip.name = `${tierPrefix}.railLip.${railPosTag}`;
      railLip.position.set(0, 0.016, railZ + (railZ > 0 ? 0.018 : -0.018));
      trayGroup.add(railLip);
    }

    // Bolted end-flanges with silver hex bolts at left and right ends of each shelf
    for (const sideX of [-1, 1] as const) {
      const endTag = sideX < 0 ? 'left' : 'right';
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.048, 0.28),
        frameSteelMat
      );
      flange.name = `${tierPrefix}.endFlange.${endTag}`;
      flange.userData.lodTier = 'high';
      flange.userData.lodMaxDistance = 12;
      flange.position.set(sideX * (traySpanX * 0.5 - 0.008), -0.008, 0);
      trayGroup.add(flange);

      const hexBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.014, 6),
        chromeBoltMat
      );
      hexBolt.name = `${tierPrefix}.hexBolt.${endTag}`;
      hexBolt.userData.lodTier = 'high';
      hexBolt.userData.lodMaxDistance = 12;
      hexBolt.position.set(sideX * (traySpanX * 0.5 - 0.022), 0.012, 0.125);
      trayGroup.add(hexBolt);
    }

    // Populate the pairs of Light-Grey Speckled Nike Grind Hex Dumbbells across the tier
    const numPairs = tier.weights.length;
    const totalDumbbells = numPairs * 2;
    const slotW = (traySpanX - 0.04) / totalDumbbells;

    for (let p = 0; p < numPairs; p++) {
      const weightLb = tier.weights[p]!;
      const headR = tier.radii[p]!;
      const headLen = tier.lengths[p]!;
      const headGeo = createBevelledHexHeadGeometry(headR, headLen);
      headGeo.computeBoundingSphere();
      const headMat = new THREE.MeshStandardMaterial({
        map: createNikeGrindLightGreyHexTexture(weightLb),
        roughness: 0.72,
        metalness: 0.03,
      });

      for (let d = 0; d < 2; d++) {
        const slotIdx = p * 2 + d;
        const dbX = -traySpanX * 0.5 + 0.02 + (slotIdx + 0.5) * slotW;
        const dbY = 0.012 + headR * 0.866;
        const dbName = `outbuildings.gym.nikeGrindDumbbell.${weightLb}lb.${d + 1}`;

        const dbGroup = new THREE.Group();
        dbGroup.name = dbName;
        dbGroup.position.set(dbX, dbY, 0);
        trayGroup.add(dbGroup);

        // Ergonomic contoured chrome barrel handle with knurled center bands
        const handleMesh = new THREE.Mesh(barrelHandleGeo, chromeBoltMat);
        handleMesh.name = `${dbName}.handle`;
        handleMesh.castShadow = true;
        dbGroup.add(handleMesh);

        let knurlIdx = 0;
        for (const kz of [-0.032, 0.0, 0.032]) {
          knurlIdx++;
          const knurlBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0168, 0.0168, 0.018, 12),
            knurledGripMat
          );
          knurlBand.name = `${dbName}.knurlBand.${knurlIdx}`;
          knurlBand.userData.lodTier = 'high';
          knurlBand.userData.lodMaxDistance = 12;
          knurlBand.rotation.x = Math.PI / 2;
          knurlBand.position.set(0, 0, kz);
          dbGroup.add(knurlBand);
        }

        // Front (`+Z`) and Rear (`-Z`) Light-Grey Speckled Nike Grind Bevelled Hex Heads
        const handleHalfSpan = 0.064;
        for (const endZ of [-1, 1] as const) {
          const hexHead = new THREE.Mesh(headGeo, headMat);
          hexHead.name = `${dbName}.hexHead.${endZ > 0 ? 'front' : 'rear'}`;
          hexHead.rotation.x = Math.PI / 2;
          // Rotate front head so the Nike Swoosh facet (`u ≈ 0.25`) faces up, and rear head so the weight numeral (`u ≈ 0.75`) faces up!
          hexHead.rotation.y = endZ > 0 ? 0 : Math.PI;
          hexHead.position.set(0, 0, endZ * (handleHalfSpan + headLen * 0.5 - 0.004));
          hexHead.castShadow = true;
          hexHead.receiveShadow = true;
          dbGroup.add(hexHead);
        }
      }
    }
  }
}
