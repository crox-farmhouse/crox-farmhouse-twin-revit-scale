import * as THREE from 'three';

/**
 * Helper to deform a subdivided BoxGeometry into a plump, sculpted upholstery cushion or
 * knife-edge pillow with smooth superellipsoid edge rounding and sinusoidal face crowning.
 */
export function createSculptedCushionGeometry(
  widthX: number,
  heightY: number,
  depthZ: number,
  segX: number,
  segY: number,
  segZ: number,
  crownPower: number,
  uvMode: 'striped' | 'standard',
  knifeEdge = false,
  loungeCrease = 0
): THREE.BufferGeometry {
  const effSegX = Math.max(4, Math.round(segX * 0.55));
  const effSegY = Math.max(4, Math.round(segY * 0.55));
  const effSegZ = Math.max(4, Math.round(segZ * 0.55));
  const geo = new THREE.BoxGeometry(widthX, heightY, depthZ, effSegX, effSegY, effSegZ);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const norm = geo.attributes.normal as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;

  const hx = widthX * 0.5;
  const hy = heightY * 0.5;
  const hz = depthZ * 0.5;
  const stripeScale = 1.25;

  // Superellipsoid exponent: lower exponent = rounder edges/corners
  const exp = knifeEdge
    ? 2.35
    : Math.max(2.4, 5.2 - Math.min(2.4, crownPower * 2.2));

  for (let i = 0; i < pos.count; i++) {
    const x0 = pos.getX(i);
    const y0 = pos.getY(i);
    const z0 = pos.getZ(i);

    const nx0 = norm.getX(i);
    const ny0 = norm.getY(i);

    // Normalized coordinates in [-1, 1]
    const ux = hx > 1e-5 ? x0 / hx : 0;
    const uy = hy > 1e-5 ? y0 / hy : 0;
    const uz = hz > 1e-5 ? z0 / hz : 0;

    const ax = Math.min(1, Math.abs(ux));
    const ay = Math.min(1, Math.abs(uy));
    const az = Math.min(1, Math.abs(uz));

    // Smooth superellipsoid radial factor that rounds the 12 edges and 8 corners of the box
    const superNorm = Math.pow(
      Math.pow(ax, exp) + Math.pow(ay, exp) + Math.pow(az, exp),
      1 / exp
    );
    const edgeRoundScale = superNorm > 1e-5 ? 1 / superNorm : 1;
    // Blend between raw box and superellipsoid so interior stays full-sized
    const roundBlend = Math.min(1, Math.max(0.15, crownPower * 0.85));
    const baseScale = 1 - roundBlend * (1 - edgeRoundScale);

    // Sinusoidal pillow-crown dome across each face
    const domeY = Math.cos(ax * Math.PI * 0.5) * Math.cos(az * Math.PI * 0.5);
    const domeX = Math.cos(ay * Math.PI * 0.5) * Math.cos(az * Math.PI * 0.5);
    const domeZ = Math.cos(ax * Math.PI * 0.5) * Math.cos(ay * Math.PI * 0.5);

    let x = x0 * baseScale;
    let y = y0 * baseScale;
    let z = z0 * baseScale;

    if (knifeEdge) {
      // Taper thickness (X) toward the perimeter edges in Y and Z to create a true tailored knife-edge seam
      const perimeterPinch =
        (1 - 0.52 * Math.pow(ay, 2.2)) * (1 - 0.48 * Math.pow(az, 2.2));
      x = x0 * perimeterPinch + Math.sign(ux) * hx * crownPower * 0.34 * domeX;
      y += Math.sign(uy) * hy * crownPower * 0.14 * domeY;
      z += Math.sign(uz) * hz * crownPower * 0.12 * domeZ;
    } else {
      // Plump box-edge cushion with crowned top/bottom and softly bullnosed front/back/side cheeks
      x += Math.sign(ux) * hx * crownPower * 0.22 * domeX;
      y += Math.sign(uy) * hy * crownPower * 0.32 * domeY;
      z += Math.sign(uz) * hz * crownPower * 0.16 * domeZ;
    }

    // Optional subtle central lounge indentation for back cushions
    if (loungeCrease > 0) {
      const centerBell =
        Math.cos(ay * Math.PI * 0.5) * Math.cos(az * Math.PI * 0.5);
      x -= ux * hx * loungeCrease * centerBell;
      // Soft top-edge lounge dip near the middle of the cushion
      if (uy > 0) {
        y -= hy * loungeCrease * 0.35 * Math.cos(az * Math.PI * 0.5) * uy;
      }
    }

    pos.setXYZ(i, x, y, z);

    if (uvMode === 'striped') {
      // Continuous vertical stripes along Y on front/back faces and front-to-back along X on top/bottom faces
      if (Math.abs(nx0) > 0.5) {
        uv.setXY(i, z * stripeScale, y * stripeScale);
      } else if (Math.abs(ny0) > 0.5) {
        uv.setXY(i, z * stripeScale, x * stripeScale);
      } else {
        uv.setXY(i, x * stripeScale, y * stripeScale);
      }
    }
  }

  pos.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Builds a continuous rounded piping / welt cord frame in the Y-Z or X-Z plane.
 */
function createPerimeterWeltLoop(
  lengthA: number,
  lengthB: number,
  radius: number,
  plane: 'XZ' | 'YZ',
  mat: THREE.Material,
  namePrefix: string
): THREE.Group {
  const group = new THREE.Group();
  group.name = namePrefix;
  const radialSegs = 6;

  if (plane === 'XZ') {
    const halfX = lengthA * 0.5;
    const halfZ = lengthB * 0.5;
    // Front & back rails along Z
    for (const sx of [-1, 1] as const) {
      const railZ = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, lengthB, radialSegs),
        mat
      );
      railZ.name = `${namePrefix}.railZ.${sx < 0 ? 'west' : 'east'}`;
      railZ.rotation.x = Math.PI * 0.5;
      railZ.position.set(sx * halfX, 0, 0);
      group.add(railZ);
    }
    // Left & right rails along X
    for (const sz of [-1, 1] as const) {
      const railX = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, lengthA, radialSegs),
        mat
      );
      railX.name = `${namePrefix}.railX.${sz < 0 ? 'north' : 'south'}`;
      railX.rotation.z = Math.PI * 0.5;
      railX.position.set(0, 0, sz * halfZ);
      group.add(railX);
    }
    // Rounded corner joints
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        const corner = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.04, 6, 6),
          mat
        );
        corner.name = `${namePrefix}.corner.${sx < 0 ? 'w' : 'e'}${sz < 0 ? 'n' : 's'}`;
        corner.userData.lodTier = 'high';
        corner.userData.lodMaxDistance = 12;
        corner.position.set(sx * halfX, 0, sz * halfZ);
        group.add(corner);
      }
    }
  } else {
    const halfY = lengthA * 0.5;
    const halfZ = lengthB * 0.5;
    // Top & bottom rails along Z
    for (const sy of [-1, 1] as const) {
      const railZ = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, lengthB, radialSegs),
        mat
      );
      railZ.name = `${namePrefix}.railZ.${sy < 0 ? 'bottom' : 'top'}`;
      railZ.rotation.x = Math.PI * 0.5;
      railZ.position.set(0, sy * halfY, 0);
      group.add(railZ);
    }
    // Side vertical rails along Y
    for (const sz of [-1, 1] as const) {
      const railY = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, lengthA, radialSegs),
        mat
      );
      railY.name = `${namePrefix}.railY.${sz < 0 ? 'north' : 'south'}`;
      railY.position.set(0, 0, sz * halfZ);
      group.add(railY);
    }
    for (const sy of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        const corner = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.04, 6, 6),
          mat
        );
        corner.name = `${namePrefix}.corner.${sy < 0 ? 'b' : 't'}${sz < 0 ? 'n' : 's'}`;
        corner.userData.lodTier = 'high';
        corner.userData.lodMaxDistance = 12;
        corner.position.set(0, sy * halfY, sz * halfZ);
        group.add(corner);
      }
    }
  }

  return group;
}

/**
 * Issue #7: High-LOD Sculpted Sitting Room Sofas
 * - `sittingRoom.barkerAndStonehouseSofa.east` at `[-18.65, tier2FloorY, 5.65]` facing West `-X`
 * - `sittingRoom.barkerAndStonehouseSofa.west` at `[-20.95, tier2FloorY, 5.65]` facing East `+X`
 */
export function buildSittingRoomSofas(
  scene: THREE.Scene,
  tier2FloorY: number
): void {
  // ===========================================================================
  // 1. Procedural Cream & Navy/Charcoal Vertical Ticking-Stripe Linen Texture
  // ===========================================================================
  const stripedCanvas = document.createElement('canvas');
  stripedCanvas.width = 512;
  stripedCanvas.height = 512;
  const stCtx = stripedCanvas.getContext('2d');
  if (stCtx) {
    stCtx.fillStyle = '#e3dacb'; // Warm creamy oatmeal linen base
    stCtx.fillRect(0, 0, 512, 512);

    // Subtle horizontal & vertical slub linen weave
    for (let y = 0; y < 512; y += 2) {
      stCtx.fillStyle =
        y % 4 === 0 ? 'rgba(255,255,255,0.13)' : 'rgba(182,169,149,0.11)';
      stCtx.fillRect(0, y, 512, 1);
    }
    for (let x = 0; x < 512; x += 3) {
      stCtx.fillStyle =
        x % 6 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(175,160,140,0.08)';
      stCtx.fillRect(x, 0, 1, 512);
    }

    // Vertical navy/charcoal ticking stripe pairs across X (8 stripe groups across 512px)
    const stripeCount = 8;
    const stripePeriod = 512 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const sx = Math.round((i + 0.5) * stripePeriod);
      stCtx.fillStyle = '#363e48'; // Deep muted navy-charcoal ticking stripe
      stCtx.fillRect(sx - 3, 0, 3.5, 512);
      stCtx.fillStyle = 'rgba(54, 62, 72, 0.72)';
      stCtx.fillRect(sx + 2.5, 0, 1.8, 512);
    }
  }
  const stripedSofaTex = new THREE.CanvasTexture(stripedCanvas);
  stripedSofaTex.wrapS = THREE.RepeatWrapping;
  stripedSofaTex.wrapT = THREE.RepeatWrapping;
  stripedSofaTex.repeat.set(2.2, 1.4);
  stripedSofaTex.colorSpace = THREE.SRGBColorSpace;

  const stripedSofaMat = new THREE.MeshStandardMaterial({
    map: stripedSofaTex,
    roughness: 0.85,
    metalness: 0.01,
  });
  const stripedWeltMat = new THREE.MeshStandardMaterial({
    color: 0xd8cebc,
    roughness: 0.8,
    metalness: 0.01,
  });
  const pleatShadowMat = new THREE.MeshStandardMaterial({
    color: 0x9b907e,
    roughness: 0.92,
  });

  // ===========================================================================
  // EAST SOFA (`sittingRoom.barkerAndStonehouseSofa.east`, facing West -X)
  // ===========================================================================
  {
    const sofaDir = -1; // Faces West (-X)
    const eastSofaGroup = new THREE.Group();
    eastSofaGroup.name = 'sittingRoom.barkerAndStonehouseSofa.east';
    eastSofaGroup.userData.zone = 'sittingRoom';
    eastSofaGroup.position.set(-18.514, tier2FloorY, 5.65);

    const sofaDepth = 0.94; // 940mm deep
    const sofaWidth = 2.02; // 2020mm total width arm-to-arm
    const armW = 0.135; // Sculpted softly-rounded upright track arms (135mm wide)
    const innerSeatW = sofaWidth - armW * 2; // 1.75m one-piece bench cushion width

    // 1. Tailored Floor-Length Box-Pleated Valance Skirt (y = 0.005..0.245m)
    const valanceSkirt = new THREE.Mesh(
      createSculptedCushionGeometry(
        sofaDepth - 0.018,
        0.24,
        sofaWidth - 0.01,
        14,
        10,
        24,
        0.12,
        'striped'
      ),
      stripedSofaMat
    );
    valanceSkirt.name = 'sittingRoom.eastSofa.valanceSkirt';
    valanceSkirt.position.set(0, 0.125, 0);
    valanceSkirt.castShadow = true;
    valanceSkirt.receiveShadow = true;
    eastSofaGroup.add(valanceSkirt);

    // Recessed shadow pleats & kick-pleat under-panels at the 4 corners
    for (const [kIdx, [kx, kz]] of (
      [
        [-sofaDepth * 0.46, -sofaWidth * 0.485],
        [sofaDepth * 0.46, -sofaWidth * 0.485],
        [-sofaDepth * 0.46, sofaWidth * 0.485],
        [sofaDepth * 0.46, sofaWidth * 0.485],
      ] as const
    ).entries()) {
      const cornerPleatRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.228, 0.032),
        pleatShadowMat
      );
      cornerPleatRecess.name = `sittingRoom.eastSofa.cornerPleatRecess.${kIdx + 1}`;
      cornerPleatRecess.position.set(kx, 0.12, kz);
      eastSofaGroup.add(cornerPleatRecess);

      const cornerKickPanel = new THREE.Mesh(
        createSculptedCushionGeometry(
          0.026,
          0.224,
          0.026,
          4,
          8,
          4,
          0.15,
          'striped'
        ),
        stripedWeltMat
      );
      cornerKickPanel.name = `sittingRoom.eastSofa.cornerKickPanel.${kIdx + 1}`;
      cornerKickPanel.position.set(kx * 0.985, 0.118, kz * 0.985);
      eastSofaGroup.add(cornerKickPanel);
    }

    // Center-front inverted box-pleat slit & underlying kick-pleat panel
    const centerFrontPleatSlit = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.228, 0.028),
      pleatShadowMat
    );
    centerFrontPleatSlit.name = 'sittingRoom.eastSofa.centerFrontPleatSlit';
    centerFrontPleatSlit.position.set(
      sofaDir * ((sofaDepth - 0.018) * 0.485),
      0.12,
      0
    );
    eastSofaGroup.add(centerFrontPleatSlit);

    // Continuous rounded horizontal welt cord (CylinderGeometry) at the top of the skirt (y = 0.245m)
    const skirtTopWeltLoop = createPerimeterWeltLoop(
      sofaDepth - 0.014,
      sofaWidth - 0.008,
      0.0075,
      'XZ',
      stripedWeltMat,
      'sittingRoom.eastSofa.skirtWelt'
    );
    skirtTopWeltLoop.position.set(0, 0.245, 0);
    eastSofaGroup.add(skirtTopWeltLoop);

    // 2. Sculpted Softly-Rounded Upright Track Arms (armW = 0.135m, y = 0.24..0.63m)
    for (const sideSign of [-1, 1] as const) {
      const sideLabel = sideSign < 0 ? 'north' : 'south';
      const armZ = sideSign * (innerSeatW * 0.5 + armW * 0.5);
      const trackArm = new THREE.Mesh(
        createSculptedCushionGeometry(
          sofaDepth - 0.018,
          0.39,
          armW,
          16,
          14,
          12,
          0.28,
          'striped'
        ),
        stripedSofaMat
      );
      trackArm.name = 'sittingRoom.eastSofa.trackArm';
      trackArm.position.set(0, 0.435, armZ);
      trackArm.castShadow = true;
      trackArm.receiveShadow = true;
      eastSofaGroup.add(trackArm);

      // Continuous front vertical & top horizontal piped welt cords on each track arm
      const armFrontWelt = createPerimeterWeltLoop(
        0.375,
        armW - 0.012,
        0.0065,
        'YZ',
        stripedWeltMat,
        `sittingRoom.eastSofa.armFrontWelt.${sideLabel}`
      );
      armFrontWelt.position.set(
        sofaDir * ((sofaDepth - 0.02) * 0.49),
        0.435,
        armZ
      );
      eastSofaGroup.add(armFrontWelt);

      const armTopWelt = createPerimeterWeltLoop(
        sofaDepth - 0.03,
        armW - 0.014,
        0.006,
        'XZ',
        stripedWeltMat,
        `sittingRoom.eastSofa.armTopWelt.${sideLabel}`
      );
      armTopWelt.position.set(0, 0.624, armZ);
      eastSofaGroup.add(armTopWelt);
    }

    // 3. Sculpted, Plump One-Piece Crowned Bullnose Bench Seat Cushion (y = 0.245..0.44m)
    const benchD = 0.74;
    const benchH = 0.195;
    const benchCenterX = sofaDir * 0.068;
    const benchCushion = new THREE.Mesh(
      createSculptedCushionGeometry(
        benchD,
        benchH,
        innerSeatW - 0.006,
        20,
        14,
        32,
        0.42,
        'striped'
      ),
      stripedSofaMat
    );
    benchCushion.name = 'sittingRoom.eastSofa.benchCushion';
    benchCushion.position.set(benchCenterX, 0.342, 0);
    benchCushion.castShadow = true;
    benchCushion.receiveShadow = true;
    eastSofaGroup.add(benchCushion);

    // Top & bottom perimeter welt cords on the bench cushion
    const benchTopWelt = createPerimeterWeltLoop(
      benchD - 0.024,
      innerSeatW - 0.02,
      0.0065,
      'XZ',
      stripedWeltMat,
      'sittingRoom.eastSofa.benchTopWelt'
    );
    benchTopWelt.position.set(benchCenterX, 0.428, 0);
    eastSofaGroup.add(benchTopWelt);

    const benchBottomWelt = createPerimeterWeltLoop(
      benchD - 0.024,
      innerSeatW - 0.02,
      0.0065,
      'XZ',
      stripedWeltMat,
      'sittingRoom.eastSofa.benchBottomWelt'
    );
    benchBottomWelt.position.set(benchCenterX, 0.256, 0);
    eastSofaGroup.add(benchBottomWelt);

    // 4. Sculpted Upholstered Rear Backrest Frame with softly rounded top rail (y = 0.245..0.77m)
    const backFrame = new THREE.Mesh(
      createSculptedCushionGeometry(
        0.16,
        0.525,
        sofaWidth - 0.016,
        12,
        14,
        24,
        0.26,
        'striped'
      ),
      stripedSofaMat
    );
    backFrame.name = 'sittingRoom.eastSofa.backFrame';
    backFrame.position.set(-sofaDir * 0.388, 0.508, 0);
    backFrame.castShadow = true;
    backFrame.receiveShadow = true;
    eastSofaGroup.add(backFrame);

    // 5. Two Plump Sculpted Box-Edge Vertical-Striped Back Cushions (sittingRoom.eastSofa.backCushion.1 and .2)
    const backCushionW = (innerSeatW - 0.012) * 0.5;
    for (const [bIdx, sideSign] of [
      [1, -1],
      [2, 1],
    ] as const) {
      const bz = sideSign * (backCushionW * 0.5 + 0.002);
      const backCushionGroup = new THREE.Group();
      backCushionGroup.name = `sittingRoom.eastSofa.backCushionGroup.${bIdx}`;
      backCushionGroup.position.set(-sofaDir * 0.215, 0.635, bz);
      backCushionGroup.rotation.z = sofaDir * 0.13;

      const backCushion = new THREE.Mesh(
        createSculptedCushionGeometry(
          0.185,
          0.42,
          backCushionW,
          14,
          16,
          20,
          0.46,
          'striped',
          false,
          0.12
        ),
        stripedSofaMat
      );
      backCushion.name = `sittingRoom.eastSofa.backCushion.${bIdx}`;
      backCushion.castShadow = true;
      backCushion.receiveShadow = true;
      backCushionGroup.add(backCushion);

      // Front & back perimeter piping loops on each box-edge back cushion
      for (const faceSign of [-1, 1] as const) {
        const backPiping = createPerimeterWeltLoop(
          0.39,
          backCushionW - 0.028,
          0.0058,
          'YZ',
          stripedWeltMat,
          `sittingRoom.eastSofa.backCushionPiping.${bIdx}.${faceSign < 0 ? 'back' : 'front'}`
        );
        backPiping.position.set(faceSign * 0.072, 0, 0);
        backCushionGroup.add(backPiping);
      }

      eastSofaGroup.add(backCushionGroup);
    }

    // 6. Two Plump Sculpted Striped Side Bolster Pillows tucked against the inside of the North & South arms
    for (const sideSign of [-1, 1] as const) {
      const sideLabel = sideSign < 0 ? 'north' : 'south';
      const bolsterGroup = new THREE.Group();
      bolsterGroup.name = `sittingRoom.eastSofa.sideBolsterGroup.${sideLabel}`;
      bolsterGroup.position.set(
        sofaDir * 0.045,
        0.56,
        sideSign * (innerSeatW * 0.5 - 0.082)
      );
      bolsterGroup.rotation.x = sideSign * 0.18;
      bolsterGroup.rotation.y = -sideSign * sofaDir * 0.08;

      const sideBolster = new THREE.Mesh(
        createSculptedCushionGeometry(
          0.43,
          0.295,
          0.145,
          14,
          12,
          12,
          0.52,
          'striped',
          false,
          0.08
        ),
        stripedSofaMat
      );
      sideBolster.name = 'sittingRoom.eastSofa.sideBolster';
      sideBolster.castShadow = true;
      sideBolster.receiveShadow = true;
      bolsterGroup.add(sideBolster);

      const bolsterPiping = createPerimeterWeltLoop(
        0.4,
        0.27,
        0.005,
        'YZ',
        stripedWeltMat,
        `sittingRoom.eastSofa.sideBolsterPiping.${sideLabel}`
      );
      bolsterPiping.rotation.y = Math.PI * 0.5;
      bolsterPiping.position.set(0, 0, -sideSign * 0.055);
      bolsterGroup.add(bolsterPiping);

      eastSofaGroup.add(bolsterGroup);
    }

    scene.add(eastSofaGroup);
  }

  // ===========================================================================
  // WEST SOFA (`sittingRoom.barkerAndStonehouseSofa.west`, facing East +X)
  // ===========================================================================
  {
    const sofaDir = 1; // Faces East (+X)
    const westSofaGroup = new THREE.Group();
    westSofaGroup.name = 'sittingRoom.barkerAndStonehouseSofa.west';
    westSofaGroup.userData.zone = 'sittingRoom';
    westSofaGroup.position.set(-21.05, tier2FloorY, 5.65);

    // Subtle procedural woven linen texture for the deep chocolate/espresso upholstery
    const brownLinenCanvas = document.createElement('canvas');
    brownLinenCanvas.width = 128;
    brownLinenCanvas.height = 128;
    const blCtx = brownLinenCanvas.getContext('2d');
    if (blCtx) {
      blCtx.fillStyle = '#ffffff';
      blCtx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 2) {
        blCtx.fillStyle =
          y % 4 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(190,175,165,0.12)';
        blCtx.fillRect(0, y, 128, 1);
      }
      for (let x = 0; x < 128; x += 2) {
        blCtx.fillStyle =
          x % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(185,170,160,0.10)';
        blCtx.fillRect(x, 0, 1, 128);
      }
    }
    const brownLinenTex = new THREE.CanvasTexture(brownLinenCanvas);
    brownLinenTex.wrapS = THREE.RepeatWrapping;
    brownLinenTex.wrapT = THREE.RepeatWrapping;
    brownLinenTex.repeat.set(6, 6);
    brownLinenTex.colorSpace = THREE.SRGBColorSpace;

    // Deep chocolate/espresso brown woven linen (`0x352720`, `roughness: 0.86`)
    const chocolateBrownLinenMat = new THREE.MeshStandardMaterial({
      color: 0x352720,
      map: brownLinenTex,
      roughness: 0.86,
      metalness: 0.01,
    });
    const chocolateBrownFlangeMat = new THREE.MeshStandardMaterial({
      color: 0x2b1f19,
      roughness: 0.84,
      metalness: 0.01,
    });
    const warmOakBunFootMat = new THREE.MeshStandardMaterial({
      color: 0x8c5e36,
      roughness: 0.44,
      metalness: 0.04,
    });

    // Procedural Black-and-Cream Gingham Check Canvas Texture
    const ginghamCanvas = document.createElement('canvas');
    ginghamCanvas.width = 256;
    ginghamCanvas.height = 256;
    const gCtx = ginghamCanvas.getContext('2d');
    if (gCtx) {
      gCtx.fillStyle = '#e5dccb';
      gCtx.fillRect(0, 0, 256, 256);
      const cell = 16;
      for (let gy = 0; gy < 256; gy += cell) {
        for (let gx = 0; gx < 256; gx += cell) {
          const ix = (gx / cell) % 2 === 0;
          const iy = (gy / cell) % 2 === 0;
          if (ix && iy) {
            gCtx.fillStyle = '#1f2022';
            gCtx.fillRect(gx, gy, cell, cell);
          } else if (ix || iy) {
            gCtx.fillStyle = '#73706a';
            gCtx.fillRect(gx, gy, cell, cell);
          }
        }
      }
    }
    const ginghamTex = new THREE.CanvasTexture(ginghamCanvas);
    ginghamTex.wrapS = THREE.RepeatWrapping;
    ginghamTex.wrapT = THREE.RepeatWrapping;
    ginghamTex.repeat.set(2.4, 1.6);
    ginghamTex.colorSpace = THREE.SRGBColorSpace;
    const ginghamMat = new THREE.MeshStandardMaterial({
      map: ginghamTex,
      roughness: 0.84,
      side: THREE.DoubleSide,
    });

    const sofaDepth = 0.98; // Deep lounging profile (980mm)
    const sofaWidth = 2.02; // 2020mm total width
    const armW = 0.17;
    const innerSeatW = sofaWidth - armW * 2; // 1.68m

    // 1. 4 Turned Warm-Oak Tapered Bun Feet (y = 0..0.038m)
    for (const [lx, lz] of [
      [-0.42, -0.92],
      [0.42, -0.92],
      [-0.42, 0.92],
      [0.42, 0.92],
    ] as const) {
      const bunFoot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.028, 0.038, 18),
        warmOakBunFootMat
      );
      bunFoot.name = 'sittingRoom.westSofa.oakFoot';
      bunFoot.position.set(lx, 0.019, lz);
      bunFoot.castShadow = true;
      westSofaGroup.add(bunFoot);
    }

    // 2. Softly Rounded Upholstered Base Plinth (y = 0.038..0.245m) with subtle front shadow seam
    const basePlinth = new THREE.Mesh(
      createSculptedCushionGeometry(
        sofaDepth - 0.035,
        0.207,
        sofaWidth - 0.035,
        14,
        10,
        24,
        0.18,
        'standard'
      ),
      chocolateBrownLinenMat
    );
    basePlinth.name = 'sittingRoom.westSofa.basePlinth';
    basePlinth.position.set(0, 0.1415, 0);
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    westSofaGroup.add(basePlinth);

    const plinthFrontSeam = createPerimeterWeltLoop(
      sofaDepth - 0.032,
      sofaWidth - 0.032,
      0.0055,
      'XZ',
      chocolateBrownFlangeMat,
      'sittingRoom.westSofa.plinthFrontSeam'
    );
    plinthFrontSeam.position.set(0, 0.24, 0);
    westSofaGroup.add(plinthFrontSeam);

    // 3. Sculpted Slightly-Flared Full-Height Box Arms (y = 0.038..0.64m) with tailored perimeter self-flange welt seams
    for (const sideSign of [-1, 1] as const) {
      const sideLabel = sideSign < 0 ? 'north' : 'south';
      const armZ = sideSign * (innerSeatW * 0.5 + armW * 0.5 - 0.01);
      const armGroup = new THREE.Group();
      armGroup.name = `sittingRoom.westSofa.armGroup.${sideLabel}`;
      armGroup.position.set(0, 0.339, armZ);
      armGroup.rotation.x = -sideSign * 0.038; // Subtle outward flare at the top

      const boxArm = new THREE.Mesh(
        createSculptedCushionGeometry(
          sofaDepth - 0.02,
          0.602,
          armW,
          16,
          16,
          12,
          0.26,
          'standard'
        ),
        chocolateBrownLinenMat
      );
      boxArm.name = 'sittingRoom.westSofa.boxArm';
      boxArm.castShadow = true;
      boxArm.receiveShadow = true;
      armGroup.add(boxArm);

      // Tailored perimeter self-flange welt seams along the outer front & top edges of each arm
      const armFrontSeam = createPerimeterWeltLoop(
        0.58,
        armW - 0.018,
        0.0065,
        'YZ',
        chocolateBrownFlangeMat,
        `sittingRoom.westSofa.armFrontSeam.${sideLabel}`
      );
      armFrontSeam.position.set(sofaDir * ((sofaDepth - 0.02) * 0.485), 0, 0);
      armGroup.add(armFrontSeam);

      const armTopSeam = createPerimeterWeltLoop(
        sofaDepth - 0.036,
        armW - 0.018,
        0.0065,
        'XZ',
        chocolateBrownFlangeMat,
        `sittingRoom.westSofa.armTopSeam.${sideLabel}`
      );
      armTopSeam.position.set(0, 0.292, 0);
      armGroup.add(armTopSeam);

      westSofaGroup.add(armGroup);
    }

    // 4. Ultra-Plush Sculpted Crowned One-Piece Feather Bench Seat Cushion (y = 0.24..0.445m)
    const benchD = 0.77;
    const benchH = 0.205;
    const benchCenterX = sofaDir * 0.068;
    const plushBenchSeat = new THREE.Mesh(
      createSculptedCushionGeometry(
        benchD,
        benchH,
        innerSeatW + 0.016,
        22,
        14,
        32,
        0.48,
        'standard'
      ),
      chocolateBrownLinenMat
    );
    plushBenchSeat.name = 'sittingRoom.westSofa.benchSeatCushion';
    plushBenchSeat.position.set(benchCenterX, 0.342, 0);
    plushBenchSeat.castShadow = true;
    plushBenchSeat.receiveShadow = true;
    westSofaGroup.add(plushBenchSeat);

    // Clean tailored perimeter flange seam around the outer edge of the bench cushion (NO flat box slab!)
    const benchFlangeSeam = createPerimeterWeltLoop(
      benchD - 0.018,
      innerSeatW + 0.004,
      0.0085,
      'XZ',
      chocolateBrownFlangeMat,
      'sittingRoom.westSofa.benchFlangeLip'
    );
    benchFlangeSeam.position.set(benchCenterX, 0.335, 0);
    westSofaGroup.add(benchFlangeSeam);

    const benchTopFlangeSeam = createPerimeterWeltLoop(
      benchD - 0.038,
      innerSeatW - 0.012,
      0.0065,
      'XZ',
      chocolateBrownFlangeMat,
      'sittingRoom.westSofa.benchTopFlangeSeam'
    );
    benchTopFlangeSeam.position.set(benchCenterX, 0.428, 0);
    westSofaGroup.add(benchTopFlangeSeam);

    // 5. Sculpted Upholstered Backrest Shell (y = 0.24..0.77m)
    const backShell = new THREE.Mesh(
      createSculptedCushionGeometry(
        0.165,
        0.53,
        sofaWidth - 0.036,
        12,
        14,
        24,
        0.26,
        'standard'
      ),
      chocolateBrownLinenMat
    );
    backShell.name = 'sittingRoom.westSofa.backShell';
    backShell.position.set(-sofaDir * 0.4, 0.505, 0);
    backShell.rotation.z = sofaDir * 0.06;
    backShell.castShadow = true;
    backShell.receiveShadow = true;
    westSofaGroup.add(backShell);

    // 6. Two Deep, Plump Sculpted Knife-Edge Feather Back Cushions (NO flat rectangular box slicing through the middle!)
    const backPillowW = (innerSeatW + 0.016) * 0.5;
    for (const [bIdx, sideSign] of [
      [1, -1],
      [2, 1],
    ] as const) {
      const bz = sideSign * (backPillowW * 0.5 - 0.004);
      const backPillowGroup = new THREE.Group();
      backPillowGroup.name = `sittingRoom.westSofa.backCushionGroup.${bIdx}`;
      backPillowGroup.position.set(-sofaDir * 0.218, 0.635, bz);
      backPillowGroup.rotation.z = sofaDir * 0.14;

      const knifeBackPillow = new THREE.Mesh(
        createSculptedCushionGeometry(
          0.21,
          0.435,
          backPillowW,
          16,
          18,
          22,
          0.56,
          'standard',
          true,
          0.14
        ),
        chocolateBrownLinenMat
      );
      knifeBackPillow.name = `sittingRoom.westSofa.backCushion.${bIdx}`;
      knifeBackPillow.castShadow = true;
      knifeBackPillow.receiveShadow = true;
      backPillowGroup.add(knifeBackPillow);

      // Tailored perimeter knife-edge self-flange cord following the cushion outline
      const knifeEdgeCord = createPerimeterWeltLoop(
        0.415,
        backPillowW - 0.02,
        0.0065,
        'YZ',
        chocolateBrownFlangeMat,
        `sittingRoom.westSofa.backCushionFlange.${bIdx}`
      );
      backPillowGroup.add(knifeEdgeCord);

      westSofaGroup.add(backPillowGroup);
    }

    // 7. Two Angled Sculpted Chocolate-Brown Knife-Edge Side Scatter Cushions against North & South Arms
    for (const sideSign of [-1, 1] as const) {
      const sideLabel = sideSign < 0 ? 'north' : 'south';
      const sidePillowGroup = new THREE.Group();
      sidePillowGroup.name = `sittingRoom.westSofa.sideCushionGroup.${sideLabel}`;
      sidePillowGroup.position.set(
        sofaDir * 0.025,
        0.565,
        sideSign * (innerSeatW * 0.5 - 0.115)
      );
      sidePillowGroup.rotation.x = sideSign * 0.32;
      sidePillowGroup.rotation.y = -sideSign * 0.18;

      const sidePillow = new THREE.Mesh(
        createSculptedCushionGeometry(
          0.39,
          0.39,
          0.155,
          16,
          16,
          14,
          0.54,
          'standard',
          true,
          0.08
        ),
        chocolateBrownLinenMat
      );
      sidePillow.name = 'sittingRoom.westSofa.sideCushion';
      sidePillow.castShadow = true;
      sidePillow.receiveShadow = true;
      sidePillowGroup.add(sidePillow);

      // Perimeter self-flange seam around the side cushion
      const sideSeam = createPerimeterWeltLoop(
        0.37,
        0.37,
        0.0055,
        'XZ',
        chocolateBrownFlangeMat,
        `sittingRoom.westSofa.sideCushionFlange.${sideLabel}`
      );
      sideSeam.rotation.x = Math.PI * 0.5;
      sidePillowGroup.add(sideSeam);

      westSofaGroup.add(sidePillowGroup);
    }

    // 8. Sculpted Black-and-Cream Gingham Check Lumbar Pillow with Continuous Sinusoidal-Wave Gathered Frill Ruffle
    const ginghamGroup = new THREE.Group();
    ginghamGroup.name = 'sittingRoom.westSofa.ginghamRuffledCushion';
    ginghamGroup.position.set(-sofaDir * 0.035, 0.515, -0.36);
    ginghamGroup.rotation.z = sofaDir * 0.25;
    ginghamGroup.rotation.y = 0.18;

    const gCoreW = 0.145;
    const gCoreH = 0.275;
    const gCoreL = 0.425;
    const ginghamCore = new THREE.Mesh(
      createSculptedCushionGeometry(
        gCoreW,
        gCoreH,
        gCoreL,
        14,
        16,
        20,
        0.55,
        'standard',
        true,
        0.06
      ),
      ginghamMat
    );
    ginghamCore.name = 'sittingRoom.westSofa.ginghamRuffledCushion.core';
    ginghamCore.castShadow = true;
    ginghamCore.receiveShadow = true;
    ginghamGroup.add(ginghamCore);

    // Continuous sinusoidal-wave gathered fabric frill ruffle around the perimeter edge (Y-Z plane)
    const buildGinghamRuffleGeometry = (): THREE.BufferGeometry => {
      const segsU = 120;
      const segsV = 6;
      const halfH = gCoreH * 0.48;
      const halfL = gCoreL * 0.48;
      const frillWidth = 0.036;
      const waveCount = 22;
      const waveAmpX = 0.012;

      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      for (let iu = 0; iu <= segsU; iu++) {
        const u = iu / segsU;
        const theta = u * Math.PI * 2;
        // Rounded-rectangle / superellipse path around the lumbar pillow perimeter
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const expP = 2.6;
        const denom = Math.pow(
          Math.pow(Math.abs(sinT), expP) + Math.pow(Math.abs(cosT), expP),
          1 / expP
        );
        const baseY = (sinT / denom) * halfH;
        const baseZ = (cosT / denom) * halfL;

        // Outward radial direction in Y-Z plane
        const outLen =
          Math.hypot(baseY / (halfH * halfH), baseZ / (halfL * halfL)) || 1;
        const ny = baseY / (halfH * halfH) / outLen;
        const nz = baseZ / (halfL * halfL) / outLen;

        for (let iv = 0; iv <= segsV; iv++) {
          const v = iv / segsV; // 0 = inner seam, 1 = outer ruffled hem
          const radialDist = v * frillWidth;
          const wavePhase = u * waveCount * Math.PI * 2;
          const xWave =
            Math.sin(wavePhase) * waveAmpX * Math.pow(v, 1.15) +
            Math.cos(wavePhase * 2) * 0.0025 * v;
          const gatherPinch = 1 + 0.08 * Math.cos(wavePhase) * v;

          const px = xWave;
          const py = baseY + ny * radialDist * gatherPinch;
          const pz = baseZ + nz * radialDist * gatherPinch;

          positions.push(px, py, pz);
          uvs.push(u * 6.0, v * 0.6);
        }
      }

      const stride = segsV + 1;
      for (let iu = 0; iu < segsU; iu++) {
        for (let iv = 0; iv < segsV; iv++) {
          const a = iu * stride + iv;
          const b = (iu + 1) * stride + iv;
          const c = (iu + 1) * stride + (iv + 1);
          const d = iu * stride + (iv + 1);
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const ruffleGeo = new THREE.BufferGeometry();
      ruffleGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
      ruffleGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      ruffleGeo.setIndex(indices);
      ruffleGeo.computeVertexNormals();
      ruffleGeo.computeBoundingSphere();
      return ruffleGeo;
    };

    const ginghamRuffleMesh = new THREE.Mesh(
      buildGinghamRuffleGeometry(),
      ginghamMat
    );
    ginghamRuffleMesh.name = 'sittingRoom.westSofa.ginghamRuffledCushion.ruffle';
    ginghamRuffleMesh.castShadow = true;
    ginghamRuffleMesh.receiveShadow = true;
    ginghamGroup.add(ginghamRuffleMesh);

    westSofaGroup.add(ginghamGroup);

    scene.add(westSofaGroup);
  }
}
