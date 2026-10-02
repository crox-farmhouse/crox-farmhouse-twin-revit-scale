import * as THREE from 'three';

/**
 * Creates a procedural brushed "Washed Oak" texture matching The Cotswold Company
 * Leafield Washed Oak collection (pale lime-washed warm golden-taupe oak grain).
 */
function createWashedOakTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#b99d7a';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle warm oak cathedral grain & lime-washed pore streaks
    for (let i = 0; i < 180; i++) {
      const y = (i * 1.43) % 256;
      const isLightPore = i % 3 === 0;
      ctx.strokeStyle = isLightPore
        ? 'rgba(232, 220, 202, 0.24)'
        : 'rgba(136, 106, 74, 0.18)';
      ctx.lineWidth = isLightPore ? 1.1 : 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const wave = Math.sin(i * 0.37) * 3.5;
      ctx.bezierCurveTo(85, y + wave, 170, y - wave, 256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a procedural botanical block-print floral quilt & cushion fabric texture
 * matching the styled bedding in `media_1790946394645.jpg`.
 */
function createBotanicalQuiltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ece3d3';
    ctx.fillRect(0, 0, 256, 256);

    // Quilted vertical stitch lines
    ctx.strokeStyle = 'rgba(175, 160, 138, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 8; x < 256; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    // Block-print botanical sprigs (terracotta rose, ochre, and sage leaves)
    const spacing = 42;
    for (let gx = 20; gx < 256; gx += spacing) {
      for (let gy = 20; gy < 256; gy += spacing) {
        const ox = gx + ((gy / spacing) % 2 === 0 ? 0 : 18);
        const oy = gy;
        // Stem & leaves
        ctx.strokeStyle = '#6d7f64';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ox - 6, oy + 10);
        ctx.quadraticCurveTo(ox, oy, ox + 5, oy - 9);
        ctx.stroke();

        ctx.fillStyle = '#7c8e72';
        ctx.beginPath();
        ctx.ellipse(ox - 5, oy + 2, 5, 2.5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(ox + 5, oy - 1, 5, 2.5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Blossom
        ctx.fillStyle = (gx + gy) % 84 === 0 ? '#b86b52' : '#c89654';
        ctx.beginPath();
        ctx.arc(ox + 4, oy - 9, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 1.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Helper to create a softly crowned, pillowed 3D cushion/mattress geometry
 * with rounded edges and smooth normals.
 */
function createSculptedSoftBoxGeometry(
  widthX: number,
  heightY: number,
  depthZ: number,
  segX = 16,
  segY = 10,
  segZ = 20,
  crownY = 0.018
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(widthX, heightY, depthZ, segX, segY, segZ);
  const pos = geo.attributes.position;
  const halfX = widthX / 2;
  const halfY = heightY / 2;
  const halfZ = depthZ / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = halfX > 0 ? x / halfX : 0;
    const ny = halfY > 0 ? y / halfY : 0;
    const nz = halfZ > 0 ? z / halfZ : 0;

    const domeXZ = Math.max(0, 1 - 0.65 * (nx * nx * 0.85 + nz * nz * 0.85));
    const edgeRound = 1 - 0.08 * Math.pow(nx * nx * nz * nz, 2);

    const sx = x * edgeRound;
    const sz = z * edgeRound;
    let sy = y;
    if (ny > 0) {
      sy += ny * crownY * domeXZ;
    }
    pos.setXYZ(i, sx, sy, sz);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds The Cotswold Company "Leafield Washed Oak Super King Size Bed"
 * (`mainBedroom.leafieldSuperKingBed`) and matching Leafield Washed Oak bedside tables
 * against the Main Bedroom West Cross-Wall (`X_ew = -9.56m`), facing East (`+X_ew`).
 *
 * Reference photos:
 * - `media_1790946394645.jpg` (overall styled bed with padded linen headboard, fluted arch crest & layered cushions)
 * - `media_1790946401209.jpg` (close-up of carved acorn finial, routed fluted corner post & arched fluted fanlight crest)
 * - `media_1790946407558.png` (side profile showing shouldered arch headboard, panelled footboard & turned tapered legs)
 */
export function buildLeafieldSuperKingBed(
  scene: THREE.Object3D,
  floorTopY: number
): void {
  const bedGroup = new THREE.Group();
  bedGroup.name = 'mainBedroom.leafieldSuperKingBed';
  bedGroup.userData.zone = 'mainBedroom';
  // Headboard back rests against the East face of the West cross-wall (X_ew = -9.56m, skirting at -9.54m),
  // centered at Z_ew = -0.55m (spanning Z_ew = -1.51m .. +0.41m, clear of the doorway at Z_ew = +1.10m..+2.00m)
  bedGroup.position.set(-9.545, floorTopY, -0.55);

  const washedOakTex = createWashedOakTexture();
  const washedOakMat = new THREE.MeshStandardMaterial({
    map: washedOakTex,
    color: 0xffffff,
    roughness: 0.46,
    metalness: 0.03,
  });
  const washedOakDarkMat = new THREE.MeshStandardMaterial({
    map: washedOakTex,
    color: 0xdccbb4,
    roughness: 0.54,
    metalness: 0.03,
  });
  const oatmealLinenMat = new THREE.MeshStandardMaterial({
    color: 0xdfd6c7, // Softly padded natural oatmeal woven linen headboard upholstery
    roughness: 0.86,
    metalness: 0.01,
  });
  const oatmealPipingMat = new THREE.MeshStandardMaterial({
    color: 0xd1c6b4,
    roughness: 0.82,
    metalness: 0.01,
  });

  // Super King dimensions:
  // Total width along Z = 1.92m (halfW = 0.96m), Total length along +X = 2.14m, Headboard crest height = 1.35m
  const postSize = 0.068;
  const postZ = 0.926; // Outer faces at ±0.96m, inner faces at ±0.892m
  const innerSpanZ = (postZ - postSize / 2) * 2; // 1.784m
  const headX = 0.038;
  const footX = 2.095;
  const legTopY = 0.245;
  const railBottomY = 0.245;
  const railTopY = 0.415;
  const railHeight = railTopY - railBottomY; // 0.17m

  // =========================================================================
  // 1. TURNED & TAPERED GUSTAVIAN LEGS (4 Corner Legs + 2 Center Support Legs)
  // =========================================================================
  const legProfilePts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.016, 0.0),
    new THREE.Vector2(0.017, 0.022),
    new THREE.Vector2(0.021, 0.028), // Lower ankle ring bead
    new THREE.Vector2(0.018, 0.035),
    new THREE.Vector2(0.027, 0.208), // Smooth Gustavian taper
    new THREE.Vector2(0.032, 0.218), // Turned upper ring collar
    new THREE.Vector2(0.029, 0.228),
    new THREE.Vector2(0.031, legTopY),
    new THREE.Vector2(0.0, legTopY),
  ];
  const turnedLegGeo = new THREE.LatheGeometry(legProfilePts, 16);

  for (const [lx, lz, legTag] of [
    [headX, -postZ, 'headLeft'],
    [headX, postZ, 'headRight'],
    [footX, -postZ, 'footLeft'],
    [footX, postZ, 'footRight'],
    [(headX + footX) * 0.5, -postZ, 'midLeft'],
    [(headX + footX) * 0.5, postZ, 'midRight'],
  ] as const) {
    const leg = new THREE.Mesh(turnedLegGeo, washedOakMat);
    leg.name = `mainBedroom.leafieldSuperKingBed.leg.${legTag}`;
    leg.position.set(lx, 0, lz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    bedGroup.add(leg);
  }

  // =========================================================================
  // 2. HEADBOARD CORNER POSTS WITH ROUTED FLUTED GROOVES & CARVED ACORN FINIALS
  //    (`media_1790946401209.jpg` close-up)
  // =========================================================================
  const headPostBottomY = legTopY;
  const headPostTopY = 1.292;
  const headPostH = headPostTopY - headPostBottomY;

  for (const sideSign of [-1, 1] as const) {
    const pz = sideSign * postZ;
    const postMesh = new THREE.Mesh(
      new THREE.BoxGeometry(postSize, headPostH, postSize),
      washedOakMat
    );
    postMesh.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideSign < 0 ? 'north' : 'south'}`;
    postMesh.position.set(headX, headPostBottomY + headPostH / 2, pz);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    bedGroup.add(postMesh);

    // Pair of vertical routed groove flutes on the front (+X) face of each headboard post (`media_1790946401209.jpg`)
    for (const gzOff of [-0.011, 0.011]) {
      const frontFlute = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, headPostH - 0.14, 0.008),
        washedOakDarkMat
      );
      frontFlute.position.set(
        headX + postSize / 2 + 0.0005,
        headPostBottomY + headPostH / 2 + 0.02,
        pz + gzOff
      );
      bedGroup.add(frontFlute);
    }

    // Stepped square moulded necking collar atop each headboard post (`y = 1.292m..1.310m`)
    const postCollar = new THREE.Mesh(
      new THREE.BoxGeometry(postSize + 0.012, 0.018, postSize + 0.012),
      washedOakMat
    );
    postCollar.position.set(headX, headPostTopY + 0.009, pz);
    postCollar.castShadow = true;
    bedGroup.add(postCollar);

    // Carved Oak Acorn Finial (`y = 1.310m..1.368m` — `media_1790946401209.jpg`)
    const finialBaseCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.016, 0.016, 16),
      washedOakDarkMat
    );
    finialBaseCup.position.set(headX, headPostTopY + 0.026, pz);
    finialBaseCup.castShadow = true;
    bedGroup.add(finialBaseCup);

    const acornBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.023, 16, 14),
      washedOakMat
    );
    acornBody.scale.set(1, 1.32, 1);
    acornBody.position.set(headX, headPostTopY + 0.048, pz);
    acornBody.castShadow = true;
    bedGroup.add(acornBody);

    const acornPip = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 10, 8),
      washedOakMat
    );
    acornPip.position.set(headX, headPostTopY + 0.078, pz);
    bedGroup.add(acornPip);
  }

  // =========================================================================
  // 3. SWEEPING ARCHED & SHOULDERED FLUTED FANLIGHT CREST RAIL
  //    (`media_1790946401209.jpg` & `media_1790946407558.png`)
  // =========================================================================
  // Height profile across z in [-0.892, +0.892]:
  // - Outer concave scoop shoulders: |z| in [0.76, 0.892], curving from y = 1.208m at the post up to 1.236m at |z| = 0.76m
  // - Central segmental arch: |z| in [0, 0.76], rising smoothly from y = 1.242m at |z| = 0.76m to y = 1.318m at z = 0
  const halfInnerZ = innerSpanZ / 2; // 0.892m
  const shoulderZ = 0.76;
  const sampleCrestTopY = (z: number): number => {
    const az = Math.abs(z);
    if (az >= shoulderZ) {
      const t = (az - shoulderZ) / (halfInnerZ - shoulderZ); // 0 at shoulder, 1 at post
      return 1.234 - 0.026 * Math.sin(t * (Math.PI / 2));
    }
    const u = az / shoulderZ;
    return 1.242 + 0.076 * (1 - u * u);
  };

  // Solid arched oak backing board (`x = headX - 0.022 .. headX + 0.012`)
  {
    const crestShape = new THREE.Shape();
    const transomBaseY = 1.125;
    crestShape.moveTo(-halfInnerZ, transomBaseY);
    crestShape.lineTo(halfInnerZ, transomBaseY);
    const numSamples = 48;
    for (let i = 0; i <= numSamples; i++) {
      const z = THREE.MathUtils.lerp(halfInnerZ, -halfInnerZ, i / numSamples);
      crestShape.lineTo(z, sampleCrestTopY(z));
    }
    crestShape.closePath();

    const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
      depth: 0.036,
      bevelEnabled: false,
    });
    crestGeo.rotateY(Math.PI / 2);
    crestGeo.translate(headX - 0.018, 0, 0);
    const crestBackMesh = new THREE.Mesh(crestGeo, washedOakMat);
    crestBackMesh.name = 'mainBedroom.leafieldSuperKingBed.archedCrestPanel';
    crestBackMesh.castShadow = true;
    crestBackMesh.receiveShadow = true;
    bedGroup.add(crestBackMesh);
  }

  // Moulded arched top cornice cap following the shouldered arch curve (`x = headX - 0.024 .. headX + 0.030`)
  {
    const capThicknessY = 0.024;
    const capShape = new THREE.Shape();
    const numSamples = 52;
    for (let i = 0; i <= numSamples; i++) {
      const z = THREE.MathUtils.lerp(-halfInnerZ, halfInnerZ, i / numSamples);
      const yTop = sampleCrestTopY(z) + 0.004;
      if (i === 0) capShape.moveTo(z, yTop);
      else capShape.lineTo(z, yTop);
    }
    for (let i = numSamples; i >= 0; i--) {
      const z = THREE.MathUtils.lerp(-halfInnerZ, halfInnerZ, i / numSamples);
      const yBot = sampleCrestTopY(z) - capThicknessY;
      capShape.lineTo(z, yBot);
    }
    capShape.closePath();

    const capGeo = new THREE.ExtrudeGeometry(capShape, {
      depth: 0.056,
      bevelEnabled: false,
    });
    capGeo.rotateY(Math.PI / 2);
    capGeo.translate(headX - 0.026, 0, 0);
    const crestCapMesh = new THREE.Mesh(capGeo, washedOakMat);
    crestCapMesh.name = 'mainBedroom.leafieldSuperKingBed.archedCrestCap';
    crestCapMesh.castShadow = true;
    crestCapMesh.receiveShadow = true;
    bedGroup.add(crestCapMesh);
  }

  // 52 Vertical Carved Fluted Reeds / Ribs across the arched crescent panel (`media_1790946401209.jpg`)
  const fluteBottomY = 1.166;
  const numFlutes = 53;
  for (let i = 0; i < numFlutes; i++) {
    const fz = THREE.MathUtils.lerp(-halfInnerZ + 0.022, halfInnerZ - 0.022, i / (numFlutes - 1));
    const fluteTopY = sampleCrestTopY(fz) - 0.022;
    const fluteH = Math.max(0.02, fluteTopY - fluteBottomY);
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0065, fluteH, 8),
      washedOakDarkMat
    );
    reed.scale.set(0.55, 1, 1);
    reed.position.set(headX + 0.019, fluteBottomY + fluteH / 2, fz);
    reed.castShadow = true;
    reed.receiveShadow = true;
    bedGroup.add(reed);
  }

  // Horizontal Moulded Oak Transom Rail directly below the fluted crescent (`y = 1.125m..1.168m`)
  const crestTransomRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.043, innerSpanZ),
    washedOakMat
  );
  crestTransomRail.name = 'mainBedroom.leafieldSuperKingBed.crestTransomRail';
  crestTransomRail.position.set(headX, 1.1465, 0);
  crestTransomRail.castShadow = true;
  crestTransomRail.receiveShadow = true;
  bedGroup.add(crestTransomRail);

  // =========================================================================
  // 4. UPHOLSTERED OATMEAL LINEN PADDED HEADBOARD PANEL (`y = 0.54m..1.125m`)
  //    & LOWER SOLID OAK HEADBOARD PANEL (`y = 0.28m..0.54m`)
  // =========================================================================
  const headBackPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.85, innerSpanZ),
    washedOakMat
  );
  headBackPanel.position.set(headX - 0.008, 0.70, 0);
  headBackPanel.castShadow = true;
  bedGroup.add(headBackPanel);

  // Softly crowned oatmeal linen upholstered headboard cushion (`y = 0.545m..1.122m`, `z = -0.886m..+0.886m`)
  const linenPanelH = 0.575;
  const linenPanelW = innerSpanZ - 0.012;
  const linenPadGeo = createSculptedSoftBoxGeometry(
    0.046,
    linenPanelH,
    linenPanelW,
    6,
    14,
    28,
    0.012
  );
  const linenPadMesh = new THREE.Mesh(linenPadGeo, oatmealLinenMat);
  linenPadMesh.name = 'mainBedroom.leafieldSuperKingBed.upholsteredHeadboardPanel';
  linenPadMesh.position.set(headX + 0.016, 0.545 + linenPanelH / 2, 0);
  linenPadMesh.castShadow = true;
  linenPadMesh.receiveShadow = true;
  bedGroup.add(linenPadMesh);

  // Tailored perimeter welt/piping around the upholstered linen headboard panel
  for (const py of [0.552, 1.116]) {
    const hWelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, linenPanelW, 8),
      oatmealPipingMat
    );
    hWelt.rotation.x = Math.PI / 2;
    hWelt.position.set(headX + 0.036, py, 0);
    bedGroup.add(hWelt);
  }
  for (const pzSign of [-1, 1]) {
    const vWelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, linenPanelH - 0.01, 8),
      oatmealPipingMat
    );
    vWelt.position.set(headX + 0.036, 0.545 + linenPanelH / 2, pzSign * (linenPanelW / 2 - 0.004));
    bedGroup.add(vWelt);
  }

  // Lower solid oak headboard rail below the linen panel (`y = 0.26m..0.545m`)
  const lowerHeadRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.285, innerSpanZ),
    washedOakMat
  );
  lowerHeadRail.position.set(headX, 0.4025, 0);
  lowerHeadRail.castShadow = true;
  bedGroup.add(lowerHeadRail);

  // =========================================================================
  // 5. SIDE RAILS, FOOTBOARD CORNER BLOCKS & PANELLED FOOTBOARD (`media_1790946407558.png`)
  // =========================================================================
  const sideRailLen = footX - headX - postSize;
  const sideRailCenterX = (headX + footX) / 2;

  for (const sideSign of [-1, 1] as const) {
    const sz = sideSign * postZ;
    const sideRail = new THREE.Mesh(
      new THREE.BoxGeometry(sideRailLen, railHeight, 0.036),
      washedOakMat
    );
    sideRail.name = `mainBedroom.leafieldSuperKingBed.sideRail.${sideSign < 0 ? 'north' : 'south'}`;
    sideRail.position.set(sideRailCenterX, railBottomY + railHeight / 2, sz);
    sideRail.castShadow = true;
    sideRail.receiveShadow = true;
    bedGroup.add(sideRail);

    // Moulded top lip along each side rail
    const sideRailCap = new THREE.Mesh(
      new THREE.BoxGeometry(sideRailLen, 0.018, 0.048),
      washedOakMat
    );
    sideRailCap.position.set(sideRailCenterX, railTopY + 0.007, sz);
    sideRailCap.castShadow = true;
    bedGroup.add(sideRailCap);
  }

  // Footboard corner posts (`x = footX, z = ±postZ, y = 0.245m..0.432m`) with vertical fluted grooves & pyramid cap
  const footPostH = 0.188;
  for (const sideSign of [-1, 1] as const) {
    const fz = sideSign * postZ;
    const footPost = new THREE.Mesh(
      new THREE.BoxGeometry(postSize, footPostH, postSize),
      washedOakMat
    );
    footPost.name = `mainBedroom.leafieldSuperKingBed.footPost.${sideSign < 0 ? 'north' : 'south'}`;
    footPost.position.set(footX, railBottomY + footPostH / 2, fz);
    footPost.castShadow = true;
    footPost.receiveShadow = true;
    bedGroup.add(footPost);

    const footPostCap = new THREE.Mesh(
      new THREE.BoxGeometry(postSize + 0.01, 0.016, postSize + 0.01),
      washedOakMat
    );
    footPostCap.position.set(footX, railBottomY + footPostH + 0.008, fz);
    footPostCap.castShadow = true;
    bedGroup.add(footPostCap);

    for (const gzOff of [-0.011, 0.011]) {
      const footFlute = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, footPostH - 0.04, 0.008),
        washedOakDarkMat
      );
      footFlute.position.set(
        footX + postSize / 2 + 0.0005,
        railBottomY + footPostH / 2,
        fz + gzOff
      );
      bedGroup.add(footFlute);
    }
  }

  // Framed & Panelled Footboard Rail (`x = footX, z = -0.892m..+0.892m, y = 0.245m..0.415m`)
  const footboardCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, railHeight, innerSpanZ),
    washedOakMat
  );
  footboardCore.name = 'mainBedroom.leafieldSuperKingBed.footboard';
  footboardCore.position.set(footX, railBottomY + railHeight / 2, 0);
  footboardCore.castShadow = true;
  footboardCore.receiveShadow = true;
  bedGroup.add(footboardCore);

  // Recessed footboard panelling stiles & rails (`media_1790946407558.png`)
  for (const ry of [railBottomY + 0.024, railTopY - 0.024]) {
    const fbHoriRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, innerSpanZ),
      washedOakMat
    );
    fbHoriRail.position.set(footX + 0.004, ry, 0);
    fbHoriRail.castShadow = true;
    bedGroup.add(fbHoriRail);
  }
  for (const rz of [-innerSpanZ / 2 + 0.04, 0, innerSpanZ / 2 - 0.04]) {
    const fbStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, railHeight, 0.075),
      washedOakMat
    );
    fbStile.position.set(footX + 0.004, railBottomY + railHeight / 2, rz);
    fbStile.castShadow = true;
    bedGroup.add(fbStile);
  }
  const footboardCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.018, innerSpanZ + 0.01),
    washedOakMat
  );
  footboardCap.position.set(footX, railTopY + 0.008, 0);
  footboardCap.castShadow = true;
  bedGroup.add(footboardCap);

  // =========================================================================
  // 6. SUPER KING MATTRESS, LAYERED LINEN DUVET, QUILTED BEDSPREAD & PILLOWS
  //    (`media_1790946394645.jpg`)
  // =========================================================================
  const ivorySheetMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.84,
    metalness: 0.01,
  });
  const duckEggDuvetMat = new THREE.MeshStandardMaterial({
    color: 0xc5ccc8, // Soft duck-egg / pale sage-grey washed linen duvet (`media_1790946394645.jpg`)
    roughness: 0.88,
    metalness: 0.01,
  });
  const charcoalQuiltMat = new THREE.MeshStandardMaterial({
    color: 0x4b525a, // Deep slate-charcoal quilted throw (`media_1790946394645.jpg`)
    roughness: 0.86,
    metalness: 0.02,
  });
  const slateBlueLinenMat = new THREE.MeshStandardMaterial({
    color: 0x73828e, // Muted slate-blue Oxford linen pillow
    roughness: 0.86,
    metalness: 0.01,
  });
  const houndstoothCushionMat = new THREE.MeshStandardMaterial({
    color: 0x8e7c68, // Warm taupe/mocha houndstooth scatter cushion
    roughness: 0.85,
    metalness: 0.01,
  });
  const botanicalQuiltMat = new THREE.MeshStandardMaterial({
    map: createBotanicalQuiltTexture(),
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.01,
  });

  // Super King Mattress (`1.80m W × 1.98m L`, `y = 0.34m..0.58m`)
  const mattressGeo = createSculptedSoftBoxGeometry(1.98, 0.24, 1.82, 20, 8, 20, 0.022);
  const mattressMesh = new THREE.Mesh(mattressGeo, ivorySheetMat);
  mattressMesh.name = 'mainBedroom.leafieldSuperKingBed.mattress';
  mattressMesh.position.set(1.065, 0.46, 0);
  mattressMesh.castShadow = true;
  mattressMesh.receiveShadow = true;
  bedGroup.add(mattressMesh);

  // Draped Pale Duck-Egg Linen Duvet (`x = 0.50m..2.06m, z = -0.92m..+0.92m, y = 0.44m..0.625m`)
  const duvetGeo = createSculptedSoftBoxGeometry(1.56, 0.155, 1.85, 20, 8, 22, 0.032);
  const duvetMesh = new THREE.Mesh(duvetGeo, duckEggDuvetMat);
  duvetMesh.name = 'mainBedroom.leafieldSuperKingBed.duvet';
  duvetMesh.position.set(1.28, 0.545, 0);
  duvetMesh.castShadow = true;
  duvetMesh.receiveShadow = true;
  bedGroup.add(duvetMesh);

  // Crisp Ivory Sheet Turn-Down Fold at the top edge of the duvet (`x = 0.46m..0.68m`)
  const turnDownGeo = createSculptedSoftBoxGeometry(0.24, 0.055, 1.86, 10, 6, 20, 0.014);
  const turnDownMesh = new THREE.Mesh(turnDownGeo, ivorySheetMat);
  turnDownMesh.name = 'mainBedroom.leafieldSuperKingBed.sheetTurnDown';
  turnDownMesh.position.set(0.57, 0.618, 0);
  turnDownMesh.castShadow = true;
  turnDownMesh.receiveShadow = true;
  bedGroup.add(turnDownMesh);

  // Deep Slate-Charcoal Quilted Bedspread folded across the lower half (`x = 1.18m..2.05m`)
  const charcoalThrowGeo = createSculptedSoftBoxGeometry(0.86, 0.065, 1.87, 14, 6, 20, 0.016);
  const charcoalThrowMesh = new THREE.Mesh(charcoalThrowGeo, charcoalQuiltMat);
  charcoalThrowMesh.name = 'mainBedroom.leafieldSuperKingBed.charcoalBedspread';
  charcoalThrowMesh.position.set(1.61, 0.615, 0);
  charcoalThrowMesh.castShadow = true;
  charcoalThrowMesh.receiveShadow = true;
  bedGroup.add(charcoalThrowMesh);

  // Folded Botanical Block-Print Floral Eiderdown Quilt at the foot of the bed (`x = 1.54m..2.04m`)
  const floralQuiltGeo = createSculptedSoftBoxGeometry(0.48, 0.072, 1.84, 12, 6, 20, 0.018);
  const floralQuiltMesh = new THREE.Mesh(floralQuiltGeo, botanicalQuiltMat);
  floralQuiltMesh.name = 'mainBedroom.leafieldSuperKingBed.botanicalEiderdown';
  floralQuiltMesh.position.set(1.79, 0.642, 0);
  floralQuiltMesh.castShadow = true;
  floralQuiltMesh.receiveShadow = true;
  bedGroup.add(floralQuiltMesh);

  // Layered Pillows & Scatter Cushions against the Padded Linen Headboard (`media_1790946394645.jpg`)
  const backPillowGeo = createSculptedSoftBoxGeometry(0.18, 0.34, 0.74, 10, 10, 14, 0.028);
  const midPillowGeo = createSculptedSoftBoxGeometry(0.17, 0.33, 0.72, 10, 10, 14, 0.026);
  const scatterCushionGeo = createSculptedSoftBoxGeometry(0.14, 0.28, 0.44, 10, 10, 12, 0.024);
  const lumbarCushionGeo = createSculptedSoftBoxGeometry(0.14, 0.24, 0.56, 10, 8, 14, 0.022);

  for (const [pIdx, pz, matMid] of [
    [1, -0.43, duckEggDuvetMat],
    [2, 0.43, slateBlueLinenMat],
  ] as const) {
    // Back sleeping pillow (Ivory)
    const backPillow = new THREE.Mesh(backPillowGeo, ivorySheetMat);
    backPillow.name = `mainBedroom.leafieldSuperKingBed.pillow.back.${pIdx}`;
    backPillow.position.set(0.18, 0.71, pz);
    backPillow.rotation.z = 0.22;
    backPillow.castShadow = true;
    backPillow.receiveShadow = true;
    bedGroup.add(backPillow);

    // Middle Oxford pillow (Duck-egg left / Slate-blue right)
    const midPillow = new THREE.Mesh(midPillowGeo, matMid);
    midPillow.name = `mainBedroom.leafieldSuperKingBed.pillow.mid.${pIdx}`;
    midPillow.position.set(0.32, 0.70, pz);
    midPillow.rotation.z = 0.28;
    midPillow.castShadow = true;
    midPillow.receiveShadow = true;
    bedGroup.add(midPillow);
  }

  // Front row of 3 styled scatter/lumbar cushions (`media_1790946394645.jpg`)
  const leftScatter = new THREE.Mesh(scatterCushionGeo, houndstoothCushionMat);
  leftScatter.name = 'mainBedroom.leafieldSuperKingBed.cushion.left';
  leftScatter.position.set(0.45, 0.67, -0.46);
  leftScatter.rotation.z = 0.34;
  leftScatter.rotation.y = 0.08;
  leftScatter.castShadow = true;
  leftScatter.receiveShadow = true;
  bedGroup.add(leftScatter);

  const centerLumbar = new THREE.Mesh(lumbarCushionGeo, botanicalQuiltMat);
  centerLumbar.name = 'mainBedroom.leafieldSuperKingBed.cushion.center';
  centerLumbar.position.set(0.47, 0.655, 0.0);
  centerLumbar.rotation.z = 0.36;
  centerLumbar.castShadow = true;
  centerLumbar.receiveShadow = true;
  bedGroup.add(centerLumbar);

  const rightScatter = new THREE.Mesh(scatterCushionGeo, botanicalQuiltMat);
  rightScatter.name = 'mainBedroom.leafieldSuperKingBed.cushion.right';
  rightScatter.position.set(0.45, 0.67, 0.46);
  rightScatter.rotation.z = 0.34;
  rightScatter.rotation.y = -0.08;
  rightScatter.castShadow = true;
  rightScatter.receiveShadow = true;
  bedGroup.add(rightScatter);

  // =========================================================================
  // 7. PAIR OF MATCHING LEAFIELD WASHED OAK BEDSIDE TABLES & CERAMIC LAMPS
  //    Flanking the bed at local Z = ±1.27m (World Z_ew = -1.82m and +0.72m)
  // =========================================================================
  const ceramicLampMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.38,
    metalness: 0.04,
  });
  const lampShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf3ece0,
    roughness: 0.78,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const agedBrassKnobMat = new THREE.MeshStandardMaterial({
    color: 0x9b7e46,
    roughness: 0.32,
    metalness: 0.82,
  });

  for (const [sideTag, tz] of [
    ['north', -1.27],
    ['south', 1.27],
  ] as const) {
    const nsGroup = new THREE.Group();
    nsGroup.name = `mainBedroom.leafieldBedsideTable.${sideTag}`;
    nsGroup.position.set(0.22, 0, tz);

    const nsW = 0.48; // along Z
    const nsD = 0.38; // along X
    const nsBodyBottomY = 0.24;
    const nsBodyTopY = 0.60;
    const nsBodyH = nsBodyTopY - nsBodyBottomY;

    // 4 turned tapered legs matching the bed legs
    for (const [lx, lz] of [
      [-nsD / 2 + 0.035, -nsW / 2 + 0.035],
      [nsD / 2 - 0.035, -nsW / 2 + 0.035],
      [-nsD / 2 + 0.035, nsW / 2 - 0.035],
      [nsD / 2 - 0.035, nsW / 2 - 0.035],
    ] as const) {
      const nsLeg = new THREE.Mesh(turnedLegGeo, washedOakMat);
      nsLeg.scale.set(0.76, 1, 0.76);
      nsLeg.position.set(lx, 0, lz);
      nsLeg.castShadow = true;
      nsGroup.add(nsLeg);
    }

    // Carcass & overhanging bevelled oak top
    const nsCarcass = new THREE.Mesh(
      new THREE.BoxGeometry(nsD, nsBodyH, nsW),
      washedOakMat
    );
    nsCarcass.position.set(0, nsBodyBottomY + nsBodyH / 2, 0);
    nsCarcass.castShadow = true;
    nsCarcass.receiveShadow = true;
    nsGroup.add(nsCarcass);

    const nsTop = new THREE.Mesh(
      new THREE.BoxGeometry(nsD + 0.024, 0.024, nsW + 0.024),
      washedOakMat
    );
    nsTop.position.set(0, nsBodyTopY + 0.012, 0);
    nsTop.castShadow = true;
    nsTop.receiveShadow = true;
    nsGroup.add(nsTop);

    // 2 Drawer fronts + aged brass knobs
    for (const dy of [0.335, 0.505]) {
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.135, nsW - 0.06),
        washedOakDarkMat
      );
      drawerFront.position.set(nsD / 2 + 0.004, dy, 0);
      drawerFront.castShadow = true;
      nsGroup.add(drawerFront);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 10, 8),
        agedBrassKnobMat
      );
      knob.position.set(nsD / 2 + 0.02, dy, 0);
      nsGroup.add(knob);
    }

    // Turned stoneware bedside lamp + linen empire shade (`media_1790946394645.jpg`)
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.078, 0.21, 16),
      ceramicLampMat
    );
    lampBase.position.set(0, nsBodyTopY + 0.024 + 0.105, 0);
    lampBase.castShadow = true;
    nsGroup.add(lampBase);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.145, 0.17, 20, 1, true),
      lampShadeMat
    );
    lampShade.position.set(0, nsBodyTopY + 0.024 + 0.28, 0);
    lampShade.castShadow = true;
    nsGroup.add(lampShade);

    bedGroup.add(nsGroup);
  }

  scene.add(bedGroup);
}
