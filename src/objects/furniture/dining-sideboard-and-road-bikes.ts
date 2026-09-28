import * as THREE from 'three';

function enableShadowsRecursively(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      const r = child.geometry.boundingSphere?.radius ?? 0;
      child.castShadow = r >= 0.14;
      child.receiveShadow = true;
    }
  });
}

function createCylinderStrut(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radiusTop: number,
  radiusBottom: number,
  material: THREE.Material,
  radialSegments = 14
): THREE.Mesh {
  const delta = new THREE.Vector3().subVectors(p2, p1);
  const length = delta.length();
  const geom = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    length,
    radialSegments
  );
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.addVectors(p1, p2).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const dir = delta.clone().normalize();
  if (Math.abs(up.dot(dir)) > 0.9999) {
    if (dir.y < 0) {
      mesh.rotation.z = Math.PI;
    }
  } else {
    mesh.quaternion.setFromUnitVectors(up, dir);
  }
  return mesh;
}

/**
 * Builds a curved botanical leaf blade geometry (never a squashed sphere)
 * with a pointed tip, cambered cross-section, and central midrib arch.
 */
function createBotanicalLeafBladeGeometry(
  length: number,
  maxWidth: number,
  archDrop: number,
  curlTip: number
): THREE.BufferGeometry {
  const segU = 12; // along leaf length
  const segV = 6; // across leaf width
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iu = 0; iu <= segU; iu++) {
    const u = iu / segU; // 0 = base, 1 = tip
    // Leaf silhouette width profile: narrow petiole attachment -> wide belly -> pointed tip
    const widthProfile =
      Math.sin(Math.pow(u, 0.68) * Math.PI) * (1 - 0.18 * u * u);
    const halfW = maxWidth * 0.5 * widthProfile;

    // Forward reach along local +X and graceful downward arch along local Y
    const x = u * length;
    const ySpine =
      Math.sin(u * Math.PI * 0.62) * (length * 0.18) -
      Math.pow(u, 1.85) * archDrop -
      Math.pow(Math.max(0, u - 0.65) / 0.35, 2.2) * curlTip;

    for (let iv = 0; iv <= segV; iv++) {
      const v = (iv / segV) * 2 - 1; // -1..+1 across blade width
      const z = v * halfW;
      // Subtle V-trough / camber across the leaf blade width + slight undulation
      const camberY =
        Math.abs(v) * halfW * 0.18 -
        Math.pow(v, 2) * halfW * 0.09 +
        Math.sin(u * Math.PI * 2.5) * halfW * 0.04 * Math.abs(v);
      positions.push(x, ySpine + camberY, z);
      uvs.push(u, (v + 1) * 0.5);
    }
  }

  const stride = segV + 1;
  for (let iu = 0; iu < segU; iu++) {
    for (let iv = 0; iv < segV; iv++) {
      const a = iu * stride + iv;
      const b = (iu + 1) * stride + iv;
      const c = (iu + 1) * stride + (iv + 1);
      const d = iu * stride + (iv + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Issue #6: Compact country-house Neptune-style Painted & Weathered-Oak Small Sideboard
 * against the Dining Room West wall (X = -9.55m, facing East +X, centered at Z = 0.28m, floor Y = 0.00m)
 * with an Apothecary Reed Diffuser on the North side and an Artisan Potted Plant on the South side.
 */
export function buildDiningRoomWestWallSideboard(scene: THREE.Scene): void {
  const sideboardGroup = new THREE.Group();
  sideboardGroup.name = 'familyRoom.westWallSideboard';
  sideboardGroup.userData.zone = 'familyRoom';
  // Center at X = -9.35m (spanning -9.55m..-9.15m), Y = 0.00m, Z = 0.28m (spanning -0.24m..+0.80m)
  sideboardGroup.position.set(-9.35, 0, 0.28);

  // Materials
  const carcassPaintMat = new THREE.MeshStandardMaterial({
    color: 0xd6cfc2, // Farrow & Ball "Drop Cloth" / "Old White"
    roughness: 0.58,
    metalness: 0.03,
  });
  const shadowRevealMat = new THREE.MeshStandardMaterial({
    color: 0xb5ad9e, // Darker recessed shadow line / reveal
    roughness: 0.72,
    metalness: 0.02,
  });
  const darkCavityMat = new THREE.MeshStandardMaterial({
    color: 0x3b352d,
    roughness: 0.85,
    metalness: 0.02,
  });
  const weatheredOakMat = new THREE.MeshStandardMaterial({
    color: 0xb9986d, // Weathered natural blonde oak
    roughness: 0.62,
    metalness: 0.04,
  });
  const oakGrooveMat = new THREE.MeshStandardMaterial({
    color: 0x856844, // Darker plank joint / end-grain oak accent
    roughness: 0.76,
    metalness: 0.03,
  });
  const agedBrassMat = new THREE.MeshStandardMaterial({
    color: 0x9e7f43,
    roughness: 0.34,
    metalness: 0.84,
  });
  const wickerPrimaryMat = new THREE.MeshStandardMaterial({
    color: 0x9f8156,
    roughness: 0.88,
    metalness: 0.02,
  });
  const wickerSecondaryMat = new THREE.MeshStandardMaterial({
    color: 0x876b43,
    roughness: 0.9,
    metalness: 0.02,
  });

  // ── 1. Four Tapered Square Legs (Y = 0.00m..0.14m) & Corner Stiles (Y = 0.14m..0.786m) ──
  const legPositions: ReadonlyArray<readonly [number, number]> = [
    [-0.176, -0.496],
    [0.176, -0.496],
    [-0.176, 0.496],
    [0.176, 0.496],
  ];

  const legGeom = new THREE.CylinderGeometry(0.024, 0.017, 0.14, 4);
  const footGlideGeom = new THREE.BoxGeometry(0.024, 0.006, 0.024);
  const cornerStileGeom = new THREE.BoxGeometry(0.044, 0.646, 0.044);

  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeom, carcassPaintMat);
    leg.position.set(lx, 0.07, lz);
    leg.rotation.y = Math.PI * 0.25;
    sideboardGroup.add(leg);

    const glide = new THREE.Mesh(footGlideGeom, agedBrassMat);
    glide.position.set(lx, 0.003, lz);
    sideboardGroup.add(glide);

    const stile = new THREE.Mesh(cornerStileGeom, carcassPaintMat);
    stile.position.set(lx, 0.463, lz);
    sideboardGroup.add(stile);
  }

  // ── 2. Carcass Body, Recessed Side Panels, Rails & Shadow Reveals ──
  // Recessed carcass core (inset slightly from corner stiles to create crisp shadow reveals)
  const carcassCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.364, 0.636, 0.968),
    shadowRevealMat
  );
  carcassCore.position.set(-0.006, 0.465, 0);
  sideboardGroup.add(carcassCore);

  // Back panel against X = -0.198m (world X = -9.548m)
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.646, 1.01),
    carcassPaintMat
  );
  backPanel.position.set(-0.192, 0.463, 0);
  sideboardGroup.add(backPanel);

  // Side Shaker panels (North Z = -0.506m, South Z = +0.506m)
  for (const sideSign of [-1, 1]) {
    const sideZ = sideSign * 0.502;
    // Top & bottom side rails
    const topSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.312, 0.048, 0.028),
      carcassPaintMat
    );
    topSideRail.position.set(0, 0.762, sideZ);
    sideboardGroup.add(topSideRail);

    const midSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.312, 0.036, 0.028),
      carcassPaintMat
    );
    midSideRail.position.set(0, 0.6, sideZ);
    sideboardGroup.add(midSideRail);

    const botSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.312, 0.048, 0.028),
      carcassPaintMat
    );
    botSideRail.position.set(0, 0.164, sideZ);
    sideboardGroup.add(botSideRail);

    // Recessed side flat panel
    const sidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.308, 0.41, 0.016),
      carcassPaintMat
    );
    sidePanel.position.set(0, 0.382, sideSign * 0.494);
    sideboardGroup.add(sidePanel);
  }

  // Front horizontal rails & vertical center mullion (at X = +0.178m)
  const lowerFrontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.044, 0.956),
    carcassPaintMat
  );
  lowerFrontRail.position.set(0.179, 0.162, 0);
  sideboardGroup.add(lowerFrontRail);

  const midFrontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.032, 0.956),
    carcassPaintMat
  );
  midFrontRail.position.set(0.179, 0.598, 0);
  sideboardGroup.add(midFrontRail);

  const topFrontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.028, 0.956),
    carcassPaintMat
  );
  topFrontRail.position.set(0.179, 0.772, 0);
  sideboardGroup.add(topFrontRail);

  // Center vertical divider stile between drawers & doors
  const centerMullion = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.61, 0.034),
    carcassPaintMat
  );
  centerMullion.position.set(0.178, 0.468, 0);
  sideboardGroup.add(centerMullion);

  // ── 3. Slatted Oak Lower Pot-Board Shelf (Y = 0.10m) + 2 Woven Wicker Baskets ──
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'familyRoom.westWallSideboard.potBoardShelf';
  shelfGroup.position.set(0, 0.1, 0);

  // Front & back oak bearer rails
  for (const rx of [-0.164, 0.164]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.018, 0.968),
      weatheredOakMat
    );
    rail.position.set(rx, -0.004, 0);
    shelfGroup.add(rail);
  }

  // 7 longitudinal oak slats spanning Z (-0.485m..+0.485m)
  const slatCount = 7;
  for (let i = 0; i < slatCount; i++) {
    const sx = -0.15 + (i / (slatCount - 1)) * 0.3;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.012, 0.976),
      weatheredOakMat
    );
    slat.position.set(sx, 0.004, 0);
    shelfGroup.add(slat);
  }

  // 2 Woven Seagrass / Wicker Storage Baskets on the pot-board shelf (Z = -0.24m and +0.24m)
  for (const basketZ of [-0.24, 0.24]) {
    const basketGroup = new THREE.Group();
    basketGroup.position.set(0.005, 0.01, basketZ);

    const bw = 0.31; // along X
    const bh = 0.115; // height
    const bd = 0.41; // along Z

    // Main basket body
    const basketCore = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      wickerPrimaryMat
    );
    basketCore.position.y = bh * 0.5;
    basketGroup.add(basketCore);

    // Dark interior recess on top
    const basketInterior = new THREE.Mesh(
      new THREE.BoxGeometry(bw - 0.026, 0.014, bd - 0.026),
      darkCavityMat
    );
    basketInterior.position.y = bh - 0.004;
    basketGroup.add(basketInterior);

    // Layered horizontal woven seagrass ribs around the perimeter
    const ribRows = 5;
    for (let r = 0; r < ribRows; r++) {
      const ry = 0.014 + r * 0.022;
      const ribMat = r % 2 === 0 ? wickerSecondaryMat : wickerPrimaryMat;
      const ribBand = new THREE.Mesh(
        new THREE.BoxGeometry(bw + 0.006, 0.012, bd + 0.006),
        ribMat
      );
      ribBand.position.y = ry;
      basketGroup.add(ribBand);
    }

    // Thick braided top rim collar
    const rimCollar = new THREE.Mesh(
      new THREE.BoxGeometry(bw + 0.014, 0.018, bd + 0.014),
      wickerSecondaryMat
    );
    rimCollar.position.y = bh;
    basketGroup.add(rimCollar);

    // Cut-out front handle slot on the East (+X) face
    const handleCutout = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.026, 0.1),
      darkCavityMat
    );
    handleCutout.position.set(bw * 0.5 + 0.002, bh - 0.03, 0);
    basketGroup.add(handleCutout);

    const handleTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.036, 0.116),
      wickerSecondaryMat
    );
    handleTrim.position.set(bw * 0.5, bh - 0.03, 0);
    basketGroup.add(handleTrim);

    shelfGroup.add(basketGroup);
  }
  sideboardGroup.add(shelfGroup);

  // ── 4. Two Upper Dovetailed Frieze Drawers (Z = -0.24m and +0.24m, Y = 0.68m) ──
  for (const drawerZ of [-0.24, 0.24]) {
    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0.192, 0.685, drawerZ);

    const dw = 0.442; // width along Z
    const dh = 0.132; // height along Y

    // Shadow reveal backing
    const revealBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, dh + 0.01, dw + 0.01),
      shadowRevealMat
    );
    revealBack.position.x = -0.006;
    drawerGroup.add(revealBack);

    // Recessed drawer face
    const drawerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, dh - 0.012, dw - 0.012),
      carcassPaintMat
    );
    drawerGroup.add(drawerPanel);

    // Raised perimeter cockbeading around drawer front (4mm bead)
    const beadThick = 0.006;
    const beadDepth = 0.021;
    const topBead = new THREE.Mesh(
      new THREE.BoxGeometry(beadDepth, beadThick, dw),
      carcassPaintMat
    );
    topBead.position.set(0.002, (dh - beadThick) * 0.5, 0);
    drawerGroup.add(topBead);

    const botBead = new THREE.Mesh(
      new THREE.BoxGeometry(beadDepth, beadThick, dw),
      carcassPaintMat
    );
    botBead.position.set(0.002, -(dh - beadThick) * 0.5, 0);
    drawerGroup.add(botBead);

    for (const side of [-1, 1]) {
      const sideBead = new THREE.Mesh(
        new THREE.BoxGeometry(beadDepth, dh - beadThick * 2, beadThick),
        carcassPaintMat
      );
      sideBead.position.set(0.002, 0, side * (dw - beadThick) * 0.5);
      drawerGroup.add(sideBead);

      // Subtle exposed oak dovetail pins near outer corners
      for (const dy of [-0.036, 0.0, 0.036]) {
        const dovetailPin = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.012, 0.008),
          weatheredOakMat
        );
        dovetailPin.position.set(0.001, dy, side * (dw * 0.5 - 0.012));
        drawerGroup.add(dovetailPin);
      }
    }

    // Aged-brass half-moon cup pull
    const cupBackplate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.004, 20, 1, false, 0, Math.PI),
      agedBrassMat
    );
    cupBackplate.rotation.z = -Math.PI * 0.5;
    cupBackplate.rotation.y = Math.PI * 0.5;
    cupBackplate.position.set(0.01, -0.006, 0);
    drawerGroup.add(cupBackplate);

    // Sculpted half-dome cup pull hood
    const cupHood = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.034,
        18,
        12,
        0,
        Math.PI,
        0,
        Math.PI * 0.55
      ),
      agedBrassMat
    );
    cupHood.scale.set(0.55, 0.78, 1.15);
    cupHood.rotation.y = Math.PI * 0.5;
    cupHood.position.set(0.011, 0.004, 0);
    drawerGroup.add(cupHood);

    // Dark finger recess under the cup pull
    const cupShadow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.012, 14),
      darkCavityMat
    );
    cupShadow.rotation.z = Math.PI * 0.5;
    cupShadow.position.set(0.011, -0.005, 0);
    drawerGroup.add(cupShadow);

    // Mounting screw heads on cup pull ears
    for (const sz of [-0.034, 0.034]) {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8),
        agedBrassMat
      );
      screw.rotation.z = Math.PI * 0.5;
      screw.position.set(0.011, 0, sz);
      drawerGroup.add(screw);
    }

    sideboardGroup.add(drawerGroup);
  }

  // ── 5. Two Lower Shaker Framed-and-Panelled Cupboard Doors (Y = 0.38m) ──
  for (const doorSign of [-1, 1]) {
    const doorZ = doorSign * 0.24;
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0.19, 0.38, doorZ);

    const doorW = 0.442;
    const doorH = 0.386;
    const stileW = 0.052;
    const railH = 0.052;

    // Shadow reveal behind door
    const doorReveal = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, doorH + 0.01, doorW + 0.01),
      shadowRevealMat
    );
    doorReveal.position.x = -0.006;
    doorGroup.add(doorReveal);

    // Recessed center Shaker flat panel
    const centerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, doorH - railH * 1.6, doorW - stileW * 1.6),
      carcassPaintMat
    );
    centerPanel.position.x = -0.001;
    doorGroup.add(centerPanel);

    // Inner bevel/chamfer shadow frame around recessed panel
    const innerShadowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.015,
        doorH - railH * 1.92,
        doorW - stileW * 1.92
      ),
      shadowRevealMat
    );
    innerShadowFrame.position.x = 0.001;
    doorGroup.add(innerShadowFrame);

    const raisedCenterPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, doorH - railH * 2.0, doorW - stileW * 2.0),
      carcassPaintMat
    );
    raisedCenterPanel.position.x = 0.002;
    doorGroup.add(raisedCenterPanel);

    // Left & right Shaker stiles
    for (const s of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, doorH, stileW),
        carcassPaintMat
      );
      stile.position.set(0.004, 0, s * (doorW - stileW) * 0.5);
      doorGroup.add(stile);
    }

    // Top & bottom Shaker rails
    for (const r of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, railH, doorW - stileW * 2),
        carcassPaintMat
      );
      rail.position.set(0.004, r * (doorH - railH) * 0.5, 0);
      doorGroup.add(rail);
    }

    // Exposed brass butt hinge knuckles on outer edge
    for (const hy of [-0.125, 0.125]) {
      const hingeBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.038, 10),
        agedBrassMat
      );
      hingeBarrel.position.set(0.014, hy, doorSign * (doorW * 0.5 + 0.003));
      doorGroup.add(hingeBarrel);
    }

    // Turned aged-brass knob on inner stile near top rail
    const knobZ = -doorSign * (doorW * 0.5 - stileW * 0.5);
    const knobY = 0.055;
    const knobRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.016, 0.005, 16),
      agedBrassMat
    );
    knobRose.rotation.z = Math.PI * 0.5;
    knobRose.position.set(0.016, knobY, knobZ);
    doorGroup.add(knobRose);

    const knobStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.009, 0.014, 14),
      agedBrassMat
    );
    knobStem.rotation.z = Math.PI * 0.5;
    knobStem.position.set(0.023, knobY, knobZ);
    doorGroup.add(knobStem);

    const knobHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 16, 12),
      agedBrassMat
    );
    knobHead.scale.set(0.72, 1, 1);
    knobHead.position.set(0.032, knobY, knobZ);
    doorGroup.add(knobHead);

    sideboardGroup.add(doorGroup);
  }

  // Vertical centre astragal strip between the two cupboard doors
  const astragalStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.392, 0.018),
    carcassPaintMat
  );
  astragalStrip.position.set(0.195, 0.38, 0);
  sideboardGroup.add(astragalStrip);

  // ── 6. Thick Overhanging Weathered Natural Blonde Oak Planked Top (0.42m × 1.08m × 0.034m at Y = 0.803m) ──
  const oakTopGroup = new THREE.Group();
  oakTopGroup.name = 'familyRoom.westWallSideboard.oakTop';
  // Center X at +0.01m so back is at -0.20m (world -9.55m flush with wall) and front overhangs to +0.22m (world -9.13m)
  oakTopGroup.position.set(0.01, 0.803, 0);

  // Main oak core slab
  const oakCoreSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.412, 0.028, 1.072),
    weatheredOakMat
  );
  oakTopGroup.add(oakCoreSlab);

  // Upper & lower bevelled perimeter crown slabs for a chamfered edge profile (total thickness 0.034m -> top at Y = 0.820m)
  const oakTopCrown = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.022, 1.08),
    weatheredOakMat
  );
  oakTopGroup.add(oakTopCrown);

  const oakUpperSurface = new THREE.Mesh(
    new THREE.BoxGeometry(0.414, 0.034, 1.074),
    weatheredOakMat
  );
  oakTopGroup.add(oakUpperSurface);

  // 3 longitudinal weathered oak planks with recessed V-groove joint lines along Z
  for (const jointX of [-0.068, 0.068]) {
    const topGroove = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.035, 1.04),
      oakGrooveMat
    );
    topGroove.position.set(jointX, 0.0005, 0);
    oakTopGroup.add(topGroove);
  }

  // Breadboard end cleats at Z = ±0.52m
  for (const cleatSign of [-1, 1]) {
    const breadboardJoint = new THREE.Mesh(
      new THREE.BoxGeometry(0.415, 0.035, 0.003),
      oakGrooveMat
    );
    breadboardJoint.position.set(0, 0.0005, cleatSign * 0.505);
    oakTopGroup.add(breadboardJoint);

    // Wooden dowel pins in breadboard ends
    for (const dx of [-0.13, 0, 0.13]) {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.0355, 8),
        oakGrooveMat
      );
      peg.position.set(dx, 0.0005, cleatSign * 0.524);
      oakTopGroup.add(peg);
    }
  }
  sideboardGroup.add(oakTopGroup);

  // ── 7. North Side (World Z = -0.02m, Local Z = -0.30m): Apothecary Glass & Brass Reed Diffuser ──
  const diffuserGroup = new THREE.Group();
  diffuserGroup.name = 'familyRoom.westWallSideboard.diffuser';
  diffuserGroup.userData.zone = 'familyRoom';
  diffuserGroup.position.set(0.0, 0.82, -0.3);

  const coasterStoneMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0, // Honed travertine / limestone coaster dish
    roughness: 0.62,
    metalness: 0.02,
  });
  const amberBottleGlassMat = new THREE.MeshStandardMaterial({
    color: 0x6b3e1e, // Warm smoked-amber apothecary glass
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82,
  });
  const fragranceOilMat = new THREE.MeshStandardMaterial({
    color: 0xc88a36, // Warm golden essential oil inside bottle
    roughness: 0.18,
    metalness: 0.04,
  });
  const labelParchmentMat = new THREE.MeshStandardMaterial({
    color: 0xf3ece0, // Cream apothecary label
    roughness: 0.75,
    metalness: 0.01,
  });
  const rattanReedMat = new THREE.MeshStandardMaterial({
    color: 0xcba97a, // Natural porous rattan diffuser reeds
    roughness: 0.78,
    metalness: 0.01,
  });

  // Honed limestone coaster tray with subtle raised rim (local Y = 0.00m..0.014m)
  const coasterBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.076, 0.08, 0.012, 28),
    coasterStoneMat
  );
  coasterBase.name = 'familyRoom.westWallSideboard.diffuser.coaster';
  coasterBase.position.y = 0.006;
  diffuserGroup.add(coasterBase);

  const coasterRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.074, 0.004, 10, 28),
    coasterStoneMat
  );
  coasterRim.rotation.x = Math.PI * 0.5;
  coasterRim.position.y = 0.012;
  diffuserGroup.add(coasterRim);

  // Turned apothecary glass diffuser vessel (local Y = 0.012m..0.152m)
  const bottleProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.001, 0.012),
    new THREE.Vector2(0.044, 0.012),
    new THREE.Vector2(0.048, 0.024),
    new THREE.Vector2(0.048, 0.102),
    new THREE.Vector2(0.042, 0.122),
    new THREE.Vector2(0.021, 0.136),
    new THREE.Vector2(0.019, 0.152),
  ];
  const diffuserBottle = new THREE.Mesh(
    new THREE.LatheGeometry(bottleProfile, 28),
    amberBottleGlassMat
  );
  diffuserBottle.name = 'familyRoom.westWallSideboard.diffuser.bottle';
  diffuserGroup.add(diffuserBottle);

  // Inner fragrance oil column (local Y = 0.018m..0.086m)
  const oilCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.068, 24),
    fragranceOilMat
  );
  oilCore.position.y = 0.052;
  diffuserGroup.add(oilCore);

  // Wrap-around cream apothecary label on the front of the bottle
  const bottleLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0486, 0.0486, 0.048, 24, 1, true, -0.9, 1.8),
    labelParchmentMat
  );
  bottleLabel.name = 'familyRoom.westWallSideboard.diffuser.label';
  bottleLabel.position.y = 0.064;
  diffuserGroup.add(bottleLabel);

  // Knurled aged-brass neck collar & lip ring (local Y = 0.142m..0.164m)
  const brassCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.023, 0.02, 24),
    agedBrassMat
  );
  brassCollar.name = 'familyRoom.westWallSideboard.diffuser.collar';
  brassCollar.position.y = 0.152;
  diffuserGroup.add(brassCollar);

  const collarLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.021, 0.0028, 10, 24),
    agedBrassMat
  );
  collarLip.rotation.x = Math.PI * 0.5;
  collarLip.position.y = 0.162;
  diffuserGroup.add(collarLip);

  // 8 natural rattan reeds fanning out from the bottle neck up to local Y = 0.31m
  const reedCount = 8;
  for (let i = 0; i < reedCount; i++) {
    const angle = (i / reedCount) * Math.PI * 2 + (i % 2) * 0.14;
    const baseRadius = 0.006 + (i % 3) * 0.0025;
    const topRadius = 0.046 + (i % 2) * 0.012;
    const topHeight = 0.285 + ((i * 3) % 4) * 0.01;
    const pBot = new THREE.Vector3(
      Math.cos(angle + Math.PI) * baseRadius,
      0.028,
      Math.sin(angle + Math.PI) * baseRadius
    );
    const pTop = new THREE.Vector3(
      Math.cos(angle) * topRadius,
      topHeight,
      Math.sin(angle) * topRadius
    );
    const reed = createCylinderStrut(
      pBot,
      pTop,
      0.0018,
      0.0016,
      rattanReedMat,
      6
    );
    reed.name = `familyRoom.westWallSideboard.diffuser.reed.${i + 1}`;
    diffuserGroup.add(reed);
  }

  sideboardGroup.add(diffuserGroup);

  // ── 8. South Side (World Z = +0.56m, Local Z = +0.28m): Artisan Potted Tabletop Plant ──
  const plantGroup = new THREE.Group();
  plantGroup.name = 'familyRoom.westWallSideboard.plant';
  plantGroup.userData.zone = 'familyRoom';
  plantGroup.position.set(0.01, 0.82, 0.28);

  const terracottaPotMat = new THREE.MeshStandardMaterial({
    color: 0xa86448, // Aged terracotta / warm stoneware
    roughness: 0.78,
    metalness: 0.03,
  });
  const terracottaRimMat = new THREE.MeshStandardMaterial({
    color: 0x94553b,
    roughness: 0.82,
    metalness: 0.03,
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2c221b,
    roughness: 0.95,
    metalness: 0.0,
  });
  const leafEmeraldMat = new THREE.MeshStandardMaterial({
    color: 0x1e472a,
    roughness: 0.48,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const leafForestMat = new THREE.MeshStandardMaterial({
    color: 0x2f5f38,
    roughness: 0.52,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const leafSageMat = new THREE.MeshStandardMaterial({
    color: 0x4b7a4f,
    roughness: 0.55,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x355834,
    roughness: 0.62,
    metalness: 0.02,
  });

  // Ceramic saucer plate at base
  const potSaucer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.084, 0.076, 0.014, 24),
    terracottaRimMat
  );
  potSaucer.position.y = 0.007;
  plantGroup.add(potSaucer);

  // Ribbed aged-terracotta pot (rTop = 0.095m, rBot = 0.072m, h = 0.16m)
  const potBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.072, 0.16, 28),
    terracottaPotMat
  );
  potBody.position.y = 0.084;
  plantGroup.add(potBody);

  // Turned horizontal pot ribs & thick rim collar
  for (let r = 0; r < 5; r++) {
    const frac = (r + 0.6) / 5.6;
    const ribR = 0.072 + (0.095 - 0.072) * frac;
    const potRib = new THREE.Mesh(
      new THREE.TorusGeometry(ribR, 0.0032, 10, 28),
      terracottaRimMat
    );
    potRib.rotation.x = Math.PI * 0.5;
    potRib.position.y = 0.012 + frac * 0.145;
    plantGroup.add(potRib);
  }

  const potCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.0075, 12, 28),
    terracottaRimMat
  );
  potCollar.rotation.x = Math.PI * 0.5;
  potCollar.position.y = 0.16;
  plantGroup.add(potCollar);

  // Dark organic soil bed inside pot
  const soilBed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.089, 0.086, 0.016, 24),
    soilMat
  );
  soilBed.position.y = 0.154;
  plantGroup.add(soilBed);

  // 15 Sculpted arching botanical leaves & cascading stems (built with curved leaf blade geometries)
  const leafSpecs: ReadonlyArray<{
    readonly azimuth: number;
    readonly elevation: number;
    readonly stemRise: number;
    readonly stemReach: number;
    readonly bladeLength: number;
    readonly bladeWidth: number;
    readonly archDrop: number;
    readonly curlTip: number;
    readonly roll: number;
    readonly matIndex: number;
  }> = [
    // Inner upright crown leaves (5)
    {
      azimuth: 0.15,
      elevation: 0.55,
      stemRise: 0.11,
      stemReach: 0.03,
      bladeLength: 0.16,
      bladeWidth: 0.068,
      archDrop: 0.035,
      curlTip: 0.015,
      roll: 0.1,
      matIndex: 2,
    },
    {
      azimuth: 1.42,
      elevation: 0.48,
      stemRise: 0.12,
      stemReach: 0.035,
      bladeLength: 0.17,
      bladeWidth: 0.072,
      archDrop: 0.04,
      curlTip: 0.018,
      roll: -0.12,
      matIndex: 1,
    },
    {
      azimuth: 2.68,
      elevation: 0.52,
      stemRise: 0.105,
      stemReach: 0.032,
      bladeLength: 0.155,
      bladeWidth: 0.066,
      archDrop: 0.036,
      curlTip: 0.014,
      roll: 0.08,
      matIndex: 2,
    },
    {
      azimuth: 3.95,
      elevation: 0.44,
      stemRise: 0.115,
      stemReach: 0.038,
      bladeLength: 0.165,
      bladeWidth: 0.07,
      archDrop: 0.042,
      curlTip: 0.016,
      roll: -0.09,
      matIndex: 1,
    },
    {
      azimuth: 5.18,
      elevation: 0.5,
      stemRise: 0.11,
      stemReach: 0.034,
      bladeLength: 0.16,
      bladeWidth: 0.068,
      archDrop: 0.038,
      curlTip: 0.015,
      roll: 0.14,
      matIndex: 2,
    },
    // Mid-tier arching leaves (5)
    {
      azimuth: 0.68,
      elevation: 0.22,
      stemRise: 0.08,
      stemReach: 0.062,
      bladeLength: 0.185,
      bladeWidth: 0.078,
      archDrop: 0.065,
      curlTip: 0.024,
      roll: -0.18,
      matIndex: 0,
    },
    {
      azimuth: 1.96,
      elevation: 0.18,
      stemRise: 0.085,
      stemReach: 0.068,
      bladeLength: 0.19,
      bladeWidth: 0.082,
      archDrop: 0.07,
      curlTip: 0.025,
      roll: 0.16,
      matIndex: 1,
    },
    {
      azimuth: 3.22,
      elevation: 0.25,
      stemRise: 0.078,
      stemReach: 0.058,
      bladeLength: 0.175,
      bladeWidth: 0.075,
      archDrop: 0.06,
      curlTip: 0.022,
      roll: -0.14,
      matIndex: 0,
    },
    {
      azimuth: 4.48,
      elevation: 0.2,
      stemRise: 0.082,
      stemReach: 0.064,
      bladeLength: 0.185,
      bladeWidth: 0.08,
      archDrop: 0.068,
      curlTip: 0.024,
      roll: 0.2,
      matIndex: 1,
    },
    {
      azimuth: 5.74,
      elevation: 0.16,
      stemRise: 0.08,
      stemReach: 0.066,
      bladeLength: 0.19,
      bladeWidth: 0.078,
      archDrop: 0.072,
      curlTip: 0.026,
      roll: -0.15,
      matIndex: 0,
    },
    // Outer cascading foliage stems draping gracefully over the pot rim (5)
    {
      azimuth: 0.35,
      elevation: -0.12,
      stemRise: 0.048,
      stemReach: 0.088,
      bladeLength: 0.17,
      bladeWidth: 0.074,
      archDrop: 0.095,
      curlTip: 0.032,
      roll: 0.22,
      matIndex: 0,
    },
    {
      azimuth: 1.55,
      elevation: -0.18,
      stemRise: 0.042,
      stemReach: 0.092,
      bladeLength: 0.175,
      bladeWidth: 0.072,
      archDrop: 0.105,
      curlTip: 0.035,
      roll: -0.24,
      matIndex: 2,
    },
    {
      azimuth: 2.85,
      elevation: -0.08,
      stemRise: 0.052,
      stemReach: 0.084,
      bladeLength: 0.16,
      bladeWidth: 0.07,
      archDrop: 0.085,
      curlTip: 0.028,
      roll: 0.18,
      matIndex: 0,
    },
    {
      azimuth: 4.12,
      elevation: -0.15,
      stemRise: 0.045,
      stemReach: 0.09,
      bladeLength: 0.175,
      bladeWidth: 0.074,
      archDrop: 0.098,
      curlTip: 0.032,
      roll: -0.2,
      matIndex: 1,
    },
    {
      azimuth: 5.38,
      elevation: -0.2,
      stemRise: 0.04,
      stemReach: 0.094,
      bladeLength: 0.18,
      bladeWidth: 0.076,
      archDrop: 0.11,
      curlTip: 0.036,
      roll: 0.25,
      matIndex: 0,
    },
  ];

  const leafMats = [leafEmeraldMat, leafForestMat, leafSageMat];

  for (const spec of leafSpecs) {
    const stemBranch = new THREE.Group();
    stemBranch.position.set(0, 0.158, 0);
    stemBranch.rotation.y = spec.azimuth;

    // Curved petiole stem using TubeGeometry
    const p0 = new THREE.Vector3(0.012, 0, 0);
    const p1 = new THREE.Vector3(
      spec.stemReach * 0.55,
      spec.stemRise * 0.88,
      0
    );
    const p2 = new THREE.Vector3(spec.stemReach, spec.stemRise, 0);
    const stemCurve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const stemMesh = new THREE.Mesh(
      new THREE.TubeGeometry(stemCurve, 8, 0.0032, 6, false),
      stemMat
    );
    stemBranch.add(stemMesh);

    // Sculpted curved botanical leaf blade attached at the tip of the petiole
    const bladeGeom = createBotanicalLeafBladeGeometry(
      spec.bladeLength,
      spec.bladeWidth,
      spec.archDrop,
      spec.curlTip
    );
    const bladeMesh = new THREE.Mesh(bladeGeom, leafMats[spec.matIndex]);
    bladeMesh.position.copy(p2);
    bladeMesh.rotation.z = spec.elevation;
    bladeMesh.rotation.x = spec.roll;
    stemBranch.add(bladeMesh);

    // Subtle central midrib vein along the upper spine of the leaf blade
    const midribCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.002, 0),
      new THREE.Vector3(
        spec.bladeLength * 0.48,
        spec.bladeLength * 0.11 - spec.archDrop * 0.28,
        0
      ),
      new THREE.Vector3(
        spec.bladeLength * 0.88,
        -spec.archDrop * 0.78 - spec.curlTip * 0.5,
        0
      )
    );
    const midribMesh = new THREE.Mesh(
      new THREE.TubeGeometry(midribCurve, 8, 0.0016, 5, false),
      stemMat
    );
    bladeMesh.add(midribMesh);

    plantGroup.add(stemBranch);
  }

  sideboardGroup.add(plantGroup);

  enableShadowsRecursively(sideboardGroup);
  scene.add(sideboardGroup);
}

interface RoadBikeConfig {
  readonly name: string;
  readonly mountZ: number;
  readonly frameColor: number;
  readonly frameRoughness: number;
  readonly frameMetalness: number;
  readonly accentColor: number;
  readonly badgeColor: number;
  readonly barTapeColor: number;
  readonly bottleColor: number;
}

/**
 * Builds a single high-LOD 700c Aero Carbon Road Bike on a bespoke Steadyrack/Cycloc-style
 * oak-and-black-steel vertical front-wheel wall mount with a lower rear-tire wall rest pad.
 */
function buildSingleWallMountedRoadBike(config: RoadBikeConfig): THREE.Group {
  const bikeRoot = new THREE.Group();
  bikeRoot.name = config.name;
  bikeRoot.userData.zone = 'familyRoom';
  // Positioned at the East partition wall face (X = -7.97m, Y = 0.00m, Z = config.mountZ)
  bikeRoot.position.set(-7.97, 0, config.mountZ);

  // Materials
  const wallOakMat = new THREE.MeshStandardMaterial({
    color: 0xa68153,
    roughness: 0.58,
    metalness: 0.04,
  });
  const blackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.38,
    metalness: 0.78,
  });
  const rubberPadMat = new THREE.MeshStandardMaterial({
    color: 0x18191c,
    roughness: 0.86,
    metalness: 0.05,
  });
  const framePrimaryMat = new THREE.MeshStandardMaterial({
    color: config.frameColor,
    roughness: config.frameRoughness,
    metalness: config.frameMetalness,
  });
  const frameAccentMat = new THREE.MeshStandardMaterial({
    color: config.accentColor,
    roughness: 0.28,
    metalness: 0.36,
  });
  const headBadgeMat = new THREE.MeshStandardMaterial({
    color: config.badgeColor,
    roughness: 0.25,
    metalness: 0.85,
  });
  const matteCarbonMat = new THREE.MeshStandardMaterial({
    color: 0x1e2024,
    roughness: 0.42,
    metalness: 0.26,
  });
  const aeroRimCarbonMat = new THREE.MeshStandardMaterial({
    color: 0x191b1f,
    roughness: 0.34,
    metalness: 0.32,
  });
  const tireTreadMat = new THREE.MeshStandardMaterial({
    color: 0x151618,
    roughness: 0.84,
    metalness: 0.04,
  });
  const tanSidewallMat = new THREE.MeshStandardMaterial({
    color: 0xc2935a, // Classic pro-peloton Vittoria Corsa tan sidewall
    roughness: 0.68,
    metalness: 0.04,
  });
  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d8de,
    roughness: 0.22,
    metalness: 0.92,
  });
  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e34,
    roughness: 0.32,
    metalness: 0.84,
  });
  const chainGoldSilverMat = new THREE.MeshStandardMaterial({
    color: 0xbec3ca,
    roughness: 0.26,
    metalness: 0.88,
  });
  const saddleLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1918,
    roughness: 0.52,
    metalness: 0.06,
  });
  const barTapeMat = new THREE.MeshStandardMaterial({
    color: config.barTapeColor,
    roughness: 0.66,
    metalness: 0.05,
  });
  const bottleMat = new THREE.MeshStandardMaterial({
    color: config.bottleColor,
    roughness: 0.38,
    metalness: 0.12,
  });

  // ── 1. Bespoke Oak & Black Powder-Coated Steel Wall Mount at X = 0 (World X = -7.97m) ──
  const mountGroup = new THREE.Group();
  mountGroup.name = `${config.name}.wallMount`;

  // Upper solid oak mounting backplate (Y = 1.38m..1.74m)
  const upperOakBackplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.36, 0.15),
    wallOakMat
  );
  upperOakBackplate.position.set(-0.011, 1.56, 0);
  mountGroup.add(upperOakBackplate);

  // Matte-black steel vertical spine channel & 4 hex wall-anchor bolts
  const steelSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.32, 0.064),
    blackSteelMat
  );
  steelSpine.position.set(-0.026, 1.56, 0);
  mountGroup.add(steelSpine);

  for (const [by, bz] of [
    [1.43, -0.05],
    [1.43, 0.05],
    [1.69, -0.05],
    [1.69, 0.05],
  ] as const) {
    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.01, 6),
      stainlessSteelMat
    );
    bolt.rotation.z = Math.PI * 0.5;
    bolt.position.set(-0.024, by, bz);
    mountGroup.add(bolt);
  }

  // Pivot knuckles at Y = 1.44m and Y = 1.66m
  for (const ky of [1.44, 1.66]) {
    const knuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.028, 16),
      blackSteelMat
    );
    knuckle.position.set(-0.04, ky, 0);
    mountGroup.add(knuckle);
  }

  // Lower rear-wheel tire wall rest pad at Y = 0.54m (prevents tire marks & stabilizes rear wheel)
  const lowerOakRest = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.24, 0.12),
    wallOakMat
  );
  lowerOakRest.position.set(-0.009, 0.54, 0);
  mountGroup.add(lowerOakRest);

  const lowerRubberPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.2, 0.078),
    rubberPadMat
  );
  lowerRubberPad.position.set(-0.022, 0.54, 0);
  mountGroup.add(lowerRubberPad);

  // Molded rubber wheel-channel cradle fins on lower rest pad
  for (const fz of [-0.026, 0.026]) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.16, 0.008),
      blackSteelMat
    );
    fin.position.set(-0.032, 0.54, fz);
    mountGroup.add(fin);
  }

  bikeRoot.add(mountGroup);

  // ── 2. Pivoted Road Bike Assembly (Folded flat against the wall with a slight 16° outward tilt) ──
  // Local coordinate convention inside `bikePlaneGroup`:
  //   +x = bike height away from wall-side tire line (from axles at x = 0.315m toward saddle/bars at x ≈ 0.86m)
  //   +y = vertical wheelbase axis (Rear Axle at y = 0.54m, Front Axle at y = 1.52m)
  //   +z = lateral axle axis (left/right sides of bike: +z = drivetrain/right side, -z = disc rotor/left side)
  // In Three.js, rotating `bikePlaneGroup` around Y by +90° (`Math.PI / 2`) places the bike's XY frame plane
  // completely flat/parallel against the YZ wall (pointing North -Z). Adding a slight +16° outward tilt
  // (`rotation.y = Math.PI / 2 + 16° = 106°`) tilts the bike frame slightly outwards into the room (-X)
  // while keeping the wheels/frame flat against the wall (~0.12m–0.27m projection) and angling North (-Z)
  // away from the cloakroom doorway so you can walk straight through unobstructed!
  const bikePlaneGroup = new THREE.Group();
  bikePlaneGroup.name = `${config.name}.pivotedAssembly`;
  bikePlaneGroup.position.set(-0.035, 0, 0.02);
  bikePlaneGroup.rotation.y = Math.PI / 2 + (16 * Math.PI) / 180;

  // Steadyrack-style curved steel front-wheel cradle hook loop (pivots with the front wheel at Y = 1.56m)
  const cradleLoopGroup = new THREE.Group();
  cradleLoopGroup.name = `${config.name}.frontWheelCradle`;
  for (const sideZ of [-0.032, 0.032]) {
    const upperArm = createCylinderStrut(
      new THREE.Vector3(0.0, 1.65, sideZ),
      new THREE.Vector3(0.38, 1.58, sideZ),
      0.006,
      0.006,
      blackSteelMat,
      10
    );
    cradleLoopGroup.add(upperArm);

    const lowerHook = createCylinderStrut(
      new THREE.Vector3(0.38, 1.58, sideZ),
      new THREE.Vector3(0.24, 1.44, sideZ),
      0.006,
      0.006,
      rubberPadMat,
      10
    );
    cradleLoopGroup.add(lowerHook);

    const wallBrace = createCylinderStrut(
      new THREE.Vector3(0.0, 1.45, sideZ),
      new THREE.Vector3(0.24, 1.44, sideZ),
      0.0055,
      0.0055,
      blackSteelMat,
      10
    );
    cradleLoopGroup.add(wallBrace);
  }
  // Crossbar cradle roller supporting the inside of the front aero rim
  const cradleRoller = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.072, 14),
    rubberPadMat
  );
  cradleRoller.rotation.x = Math.PI * 0.5;
  cradleRoller.position.set(0.24, 1.44, 0);
  cradleLoopGroup.add(cradleRoller);
  bikePlaneGroup.add(cradleLoopGroup);

  // ── 3. Two 700c Deep-Section (48mm) Carbon Aero Wheels (wheelR = 0.315m) ──
  const wheelR = 0.315;
  const tireTubeR = 0.014;
  const tireMajorR = wheelR - tireTubeR;
  const wheelCenters: ReadonlyArray<{
    readonly label: string;
    readonly x: number;
    readonly y: number;
    readonly isRear: boolean;
  }> = [
    { label: 'rearWheel', x: wheelR, y: 0.54, isRear: true },
    { label: 'frontWheel', x: wheelR, y: 1.52, isRear: false },
  ];

  for (const wc of wheelCenters) {
    const wheelGroup = new THREE.Group();
    wheelGroup.name = `${config.name}.${wc.label}`;
    wheelGroup.position.set(wc.x, wc.y, 0);

    // Outer black 700x28c road tire tread (major R = 0.301m, tube r = 0.014m -> outer radius = 0.315m)
    const tireTread = new THREE.Mesh(
      new THREE.TorusGeometry(tireMajorR, tireTubeR, 16, 48),
      tireTreadMat
    );
    wheelGroup.add(tireTread);

    // Tan-sidewall rings on both faces of the tire
    for (const sideZ of [-0.009, 0.009]) {
      const sidewall = new THREE.Mesh(
        new THREE.TorusGeometry(0.293, 0.0075, 12, 48),
        tanSidewallMat
      );
      sidewall.scale.set(1, 1, 0.45);
      sidewall.position.z = sideZ;
      wheelGroup.add(sidewall);
    }

    // 48mm deep-section matte carbon aero rim (outer R = 0.288m, inner R = 0.240m)
    const aeroRimOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.266, 0.022, 14, 48),
      aeroRimCarbonMat
    );
    aeroRimOuter.scale.set(1, 1, 0.56);
    wheelGroup.add(aeroRimOuter);

    const aeroRimNose = new THREE.Mesh(
      new THREE.TorusGeometry(0.248, 0.012, 12, 48),
      matteCarbonMat
    );
    aeroRimNose.scale.set(1, 1, 0.78);
    wheelGroup.add(aeroRimNose);

    // Presta valve stem protruding radially inward from rim nose
    const valveAngle = wc.isRear ? Math.PI * 0.25 : -Math.PI * 0.65;
    const valveP1 = new THREE.Vector3(
      Math.cos(valveAngle) * 0.242,
      Math.sin(valveAngle) * 0.242,
      0
    );
    const valveP2 = new THREE.Vector3(
      Math.cos(valveAngle) * 0.214,
      Math.sin(valveAngle) * 0.214,
      0
    );
    wheelGroup.add(
      createCylinderStrut(valveP1, valveP2, 0.002, 0.002, darkAlloyMat, 8)
    );

    // Alloy centerlock hub shell & flanges
    const hubWidth = wc.isRear ? 0.13 : 0.1;
    const hubShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, hubWidth, 18),
      darkAlloyMat
    );
    hubShell.rotation.x = Math.PI * 0.5;
    wheelGroup.add(hubShell);

    for (const fz of [-0.028, 0.028]) {
      const hubFlange = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.005, 20),
        darkAlloyMat
      );
      hubFlange.rotation.x = Math.PI * 0.5;
      hubFlange.position.z = fz;
      wheelGroup.add(hubFlange);
    }

    // 160mm stainless-steel ventilated disc brake rotor on left side (z = -0.042m)
    const discZ = -0.042;
    const rotorTrack = new THREE.Mesh(
      new THREE.RingGeometry(0.058, 0.08, 28),
      stainlessSteelMat
    );
    rotorTrack.material.side = THREE.DoubleSide;
    rotorTrack.position.z = discZ;
    wheelGroup.add(rotorTrack);

    const rotorSpiderRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.004, 18),
      darkAlloyMat
    );
    rotorSpiderRing.rotation.x = Math.PI * 0.5;
    rotorSpiderRing.position.z = discZ;
    wheelGroup.add(rotorSpiderRing);

    for (let arm = 0; arm < 6; arm++) {
      const a0 = (arm / 6) * Math.PI * 2;
      const a1 = a0 + 0.32;
      const spiderStrut = createCylinderStrut(
        new THREE.Vector3(Math.cos(a0) * 0.026, Math.sin(a0) * 0.026, discZ),
        new THREE.Vector3(Math.cos(a1) * 0.064, Math.sin(a1) * 0.064, discZ),
        0.003,
        0.0025,
        darkAlloyMat,
        6
      );
      wheelGroup.add(spiderStrut);
    }

    // 16 fine stainless-steel 2-cross / radial spokes per wheel
    const spokeCount = 16;
    for (let s = 0; s < spokeCount; s++) {
      const side = s % 2 === 0 ? -1 : 1;
      const rimAngle = (s / spokeCount) * Math.PI * 2;
      const crossOffset = (s % 4 < 2 ? 1 : -1) * 0.38;
      const hubAngle = rimAngle + crossOffset;

      const pHub = new THREE.Vector3(
        Math.cos(hubAngle) * 0.023,
        Math.sin(hubAngle) * 0.023,
        side * 0.028
      );
      const pRim = new THREE.Vector3(
        Math.cos(rimAngle) * 0.244,
        Math.sin(rimAngle) * 0.244,
        0
      );
      const spoke = createCylinderStrut(
        pHub,
        pRim,
        0.0011,
        0.0011,
        stainlessSteelMat,
        6
      );
      wheelGroup.add(spoke);
    }

    bikePlaneGroup.add(wheelGroup);
  }

  // ── 4. Sculpted Diamond Carbon Road Frame + Twin Fork Blades ──
  const frameGroup = new THREE.Group();
  frameGroup.name = `${config.name}.carbonFrame`;

  // Exact pro-peloton 54cm road frame nodes in (x = bike height, y = bike forward, z = lateral):
  const rearAxleLeft = new THREE.Vector3(0.315, 0.54, -0.066);
  const rearAxleRight = new THREE.Vector3(0.315, 0.54, 0.066);
  const frontAxleLeft = new THREE.Vector3(0.315, 1.52, -0.052);
  const frontAxleRight = new THREE.Vector3(0.315, 1.52, 0.052);

  const bottomBracket = new THREE.Vector3(0.255, 0.945, 0);
  const seatCluster = new THREE.Vector3(0.695, 0.815, 0);
  const droppedSeatstayJunction = new THREE.Vector3(0.595, 0.844, 0);
  const headTubeBottom = new THREE.Vector3(0.655, 1.408, 0);
  const headTubeTop = new THREE.Vector3(0.775, 1.372, 0);
  const downTubeHeadJunction = new THREE.Vector3(0.682, 1.4, 0);

  // Bottom Bracket shell
  const bbShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.086, 20),
    framePrimaryMat
  );
  bbShell.rotation.x = Math.PI * 0.5;
  bbShell.position.copy(bottomBracket);
  frameGroup.add(bbShell);

  // Seat Tube (BB to Seat Cluster)
  const seatTube = createCylinderStrut(
    bottomBracket,
    seatCluster,
    0.017,
    0.019,
    framePrimaryMat,
    16
  );
  seatTube.scale.set(1.28, 1, 0.82); // Aero Kamm-tail cross-section
  frameGroup.add(seatTube);

  // Aero Down Tube (BB to Lower Head Tube)
  const downTube = createCylinderStrut(
    bottomBracket,
    downTubeHeadJunction,
    0.021,
    0.025,
    framePrimaryMat,
    16
  );
  downTube.scale.set(1.25, 1, 0.84);
  frameGroup.add(downTube);

  // Sloping Top Tube (Seat Cluster to Head Tube Top) with accent band near seat cluster
  const topTubeMid = new THREE.Vector3().lerpVectors(
    seatCluster,
    headTubeTop,
    0.34
  );
  const topTubeRear = createCylinderStrut(
    seatCluster,
    topTubeMid,
    0.017,
    0.016,
    frameAccentMat,
    16
  );
  const topTubeFront = createCylinderStrut(
    topTubeMid,
    headTubeTop,
    0.019,
    0.017,
    framePrimaryMat,
    16
  );
  frameGroup.add(topTubeRear, topTubeFront);

  // Tapered Head Tube (HTB to HTT) + Metallic Head-Tube Badge
  const headTube = createCylinderStrut(
    headTubeBottom,
    headTubeTop,
    0.022,
    0.025,
    framePrimaryMat,
    18
  );
  frameGroup.add(headTube);

  const headTubeCenter = new THREE.Vector3()
    .addVectors(headTubeBottom, headTubeTop)
    .multiplyScalar(0.5);
  const headBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0235, 0.0255, 0.048, 16, 1, true, -0.5, 1.0),
    headBadgeMat
  );
  headBadge.position.copy(headTubeCenter).add(new THREE.Vector3(0.002, 0.004, 0));
  headBadge.rotation.z = 0.29;
  frameGroup.add(headBadge);

  // Asymmetric Chainstays (BB to Rear Dropouts)
  for (const [sideSign, axleNode] of [
    [-1, rearAxleLeft],
    [1, rearAxleRight],
  ] as const) {
    const bbSide = bottomBracket
      .clone()
      .add(new THREE.Vector3(0, 0, sideSign * 0.036));
    const chainstay = createCylinderStrut(
      bbSide,
      axleNode,
      0.0095,
      0.016,
      framePrimaryMat,
      12
    );
    frameGroup.add(chainstay);

    // Dropped Aero Seatstays (Rear Dropouts to Dropped Seatstay Junction on Seat Tube)
    const seatstay = createCylinderStrut(
      axleNode,
      droppedSeatstayJunction
        .clone()
        .add(new THREE.Vector3(0, 0, sideSign * 0.014)),
      0.0075,
      0.007,
      framePrimaryMat,
      12
    );
    frameGroup.add(seatstay);

    // Rear carbon dropout plate
    const dropout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.008, 14),
      matteCarbonMat
    );
    dropout.rotation.x = Math.PI * 0.5;
    dropout.position.copy(axleNode);
    frameGroup.add(dropout);
  }

  // Twin Aero Carbon Fork Blades (Fork Crown at HTB to Front Dropouts)
  const forkCrownLeft = headTubeBottom
    .clone()
    .add(new THREE.Vector3(-0.01, 0.005, -0.032));
  const forkCrownRight = headTubeBottom
    .clone()
    .add(new THREE.Vector3(-0.01, 0.005, 0.032));

  const forkCrownBridge = createCylinderStrut(
    forkCrownLeft,
    forkCrownRight,
    0.018,
    0.018,
    framePrimaryMat,
    14
  );
  frameGroup.add(forkCrownBridge);

  for (const [crownNode, axleNode] of [
    [forkCrownLeft, frontAxleLeft],
    [forkCrownRight, frontAxleRight],
  ] as const) {
    const midFork = new THREE.Vector3().lerpVectors(crownNode, axleNode, 0.55);
    const upperBlade = createCylinderStrut(
      crownNode,
      midFork,
      0.013,
      0.017,
      framePrimaryMat,
      14
    );
    upperBlade.scale.set(1.35, 1, 0.65);
    const lowerBlade = createCylinderStrut(
      midFork,
      axleNode,
      0.009,
      0.013,
      frameAccentMat,
      14
    );
    lowerBlade.scale.set(1.35, 1, 0.65);
    frameGroup.add(upperBlade, lowerBlade);
  }

  // Flat-mount hydraulic disc brake calipers (Front & Rear left side)
  const rearCaliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.044, 0.022),
    darkAlloyMat
  );
  rearCaliper.position.set(0.34, 0.6, -0.046);
  frameGroup.add(rearCaliper);

  const frontCaliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.026, 0.022),
    darkAlloyMat
  );
  frontCaliper.position.set(0.382, 1.498, -0.046);
  frameGroup.add(frontCaliper);

  bikePlaneGroup.add(frameGroup);

  // ── 5. Aero Carbon Seatpost + Sculpted Narrow Road Racing Saddle with Alloy Rails ──
  const saddleNode = new THREE.Vector3(0.84, 0.772, 0);
  const seatpost = createCylinderStrut(
    seatCluster,
    saddleNode,
    0.014,
    0.015,
    matteCarbonMat,
    14
  );
  seatpost.scale.set(1.3, 1, 0.75);
  bikePlaneGroup.add(seatpost);

  const saddleGroup = new THREE.Group();
  saddleGroup.name = `${config.name}.saddle`;
  saddleGroup.position.copy(saddleNode);

  // Twin alloy saddle rails
  for (const rz of [-0.021, 0.021]) {
    const rail = createCylinderStrut(
      new THREE.Vector3(-0.018, -0.055, rz),
      new THREE.Vector3(-0.012, 0.065, rz),
      0.0032,
      0.0032,
      stainlessSteelMat,
      8
    );
    saddleGroup.add(rail);
  }

  // Sculpted narrow road saddle tail & nose
  const saddleRear = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 18, 14),
    saddleLeatherMat
  );
  saddleRear.scale.set(0.24, 1.35, 0.95);
  saddleRear.position.set(0.014, -0.042, 0);
  saddleGroup.add(saddleRear);

  const saddleNose = createCylinderStrut(
    new THREE.Vector3(0.014, -0.03, 0),
    new THREE.Vector3(0.012, 0.125, 0),
    0.014,
    0.032,
    saddleLeatherMat,
    14
  );
  saddleNose.scale.set(0.45, 1, 1);
  saddleGroup.add(saddleNose);

  // Central ergonomic cutout channel on saddle top
  const saddleCutout = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.095, 0.014),
    matteCarbonMat
  );
  saddleCutout.position.set(0.026, 0.01, 0);
  saddleGroup.add(saddleCutout);

  bikePlaneGroup.add(saddleGroup);

  // ── 6. Integrated Aero Stem + Curved Road Drop Handlebars + Dual STI Brake/Shift Hoods ──
  const cockpitGroup = new THREE.Group();
  cockpitGroup.name = `${config.name}.cockpit`;

  const steererTop = new THREE.Vector3(0.818, 1.359, 0);
  const stemClamp = new THREE.Vector3(0.838, 1.462, 0);

  // Aero headset spacers & top cap
  const steererSpacer = createCylinderStrut(
    headTubeTop,
    steererTop,
    0.018,
    0.02,
    matteCarbonMat,
    14
  );
  cockpitGroup.add(steererSpacer);

  // Integrated aero carbon stem
  const aeroStem = createCylinderStrut(
    steererTop,
    stemClamp,
    0.016,
    0.019,
    matteCarbonMat,
    14
  );
  cockpitGroup.add(aeroStem);

  // Out-front cycling computer mount with Garmin/Wahoo head unit
  const computerMount = createCylinderStrut(
    stemClamp,
    new THREE.Vector3(0.844, 1.522, 0),
    0.004,
    0.005,
    darkAlloyMat,
    8
  );
  cockpitGroup.add(computerMount);

  const bikeComputer = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.062, 0.042),
    blackSteelMat
  );
  bikeComputer.position.set(0.85, 1.525, 0);
  cockpitGroup.add(bikeComputer);

  // Horizontal aero handlebar tops (40cm wide = Z from -0.20m to +0.20m)
  const barHalfWidth = 0.195;
  const barTops = createCylinderStrut(
    new THREE.Vector3(stemClamp.x, stemClamp.y, -barHalfWidth),
    new THREE.Vector3(stemClamp.x, stemClamp.y, barHalfWidth),
    0.0135,
    0.0135,
    barTapeMat,
    14
  );
  cockpitGroup.add(barTops);

  // Left & Right Classic Curved Road Drops + Dual STI Brake/Shift Lever Hoods
  for (const sideSign of [-1, 1]) {
    const hz = sideSign * barHalfWidth;

    // Forward ramp from tops to hoods
    const hoodBase = new THREE.Vector3(0.842, 1.532, hz);
    const rampStrut = createCylinderStrut(
      new THREE.Vector3(stemClamp.x, stemClamp.y, hz),
      hoodBase,
      0.0125,
      0.0125,
      barTapeMat,
      12
    );
    cockpitGroup.add(rampStrut);

    // Curved compact drop loop (TorusGeometry half-arc in the x-y plane at Z = hz)
    const dropArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.064, 0.012, 12, 22, Math.PI * 1.12),
      barTapeMat
    );
    dropArc.position.set(0.778, 1.528, hz);
    dropArc.rotation.z = -Math.PI * 0.52;
    cockpitGroup.add(dropArc);

    // Lower drop grip extension pointing back toward head tube
    const dropTail = createCylinderStrut(
      new THREE.Vector3(0.715, 1.522, hz),
      new THREE.Vector3(0.708, 1.445, hz),
      0.012,
      0.012,
      barTapeMat,
      10
    );
    cockpitGroup.add(dropTail);

    // Bar-end plug
    const barPlug = new THREE.Mesh(
      new THREE.SphereGeometry(0.0125, 10, 10),
      headBadgeMat
    );
    barPlug.position.set(0.708, 1.445, hz);
    cockpitGroup.add(barPlug);

    // STI Brake/Shift Lever Hood body (ergonomic upright rubber hood horn)
    const stiHoodBody = createCylinderStrut(
      hoodBase,
      new THREE.Vector3(0.902, 1.568, hz),
      0.014,
      0.016,
      rubberPadMat,
      12
    );
    cockpitGroup.add(stiHoodBody);

    const stiPommel = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 10),
      rubberPadMat
    );
    stiPommel.scale.set(1.25, 0.95, 0.88);
    stiPommel.position.set(0.908, 1.57, hz);
    cockpitGroup.add(stiPommel);

    // Carbon brake/shift lever blade curving down in front of the drop
    const brakeBlade = createCylinderStrut(
      new THREE.Vector3(0.882, 1.562, hz),
      new THREE.Vector3(0.76, 1.588, hz - sideSign * 0.008),
      0.0035,
      0.006,
      matteCarbonMat,
      8
    );
    cockpitGroup.add(brakeBlade);
  }

  bikePlaneGroup.add(cockpitGroup);

  // ── 7. Detailed Drivetrain: 52/36T Crankset, Clipless Pedals, 12-Speed Cassette, Derailleur & Chain + 2 Bottle Cages ──
  const drivetrainGroup = new THREE.Group();
  drivetrainGroup.name = `${config.name}.drivetrain`;

  const rightCrankZ = 0.048;
  const leftCrankZ = -0.048;

  // 52T outer & 36T inner hollow-forged chainrings on right side of BB (0.255, 0.945, +0.044)
  const outerChainring = new THREE.Mesh(
    new THREE.RingGeometry(0.072, 0.106, 36),
    darkAlloyMat
  );
  outerChainring.material.side = THREE.DoubleSide;
  outerChainring.position.set(
    bottomBracket.x,
    bottomBracket.y,
    rightCrankZ - 0.004
  );
  drivetrainGroup.add(outerChainring);

  const outerChainringRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.104, 0.0035, 10, 36),
    stainlessSteelMat
  );
  outerChainringRim.position.set(
    bottomBracket.x,
    bottomBracket.y,
    rightCrankZ - 0.004
  );
  drivetrainGroup.add(outerChainringRim);

  const innerChainring = new THREE.Mesh(
    new THREE.RingGeometry(0.048, 0.074, 32),
    stainlessSteelMat
  );
  innerChainring.material.side = THREE.DoubleSide;
  innerChainring.position.set(
    bottomBracket.x,
    bottomBracket.y,
    rightCrankZ - 0.01
  );
  drivetrainGroup.add(innerChainring);

  // 4-arm asymmetric hollow-forged crank spider
  for (let arm = 0; arm < 4; arm++) {
    const a = (arm / 4) * Math.PI * 2 + 0.35;
    const spiderArm = createCylinderStrut(
      new THREE.Vector3(bottomBracket.x, bottomBracket.y, rightCrankZ),
      new THREE.Vector3(
        bottomBracket.x + Math.cos(a) * 0.082,
        bottomBracket.y + Math.sin(a) * 0.082,
        rightCrankZ - 0.004
      ),
      0.009,
      0.014,
      darkAlloyMat,
      8
    );
    drivetrainGroup.add(spiderArm);
  }

  // Right & Left 172.5mm Crank Arms + Clipless Road Pedals
  const crankAngle = 0.68; // Right crank angled up-and-forward, left crank opposite
  const crankLen = 0.172;
  for (const [sideSign, zPos, angleOffset] of [
    [1, rightCrankZ, 0],
    [-1, leftCrankZ, Math.PI],
  ] as const) {
    const a = crankAngle + angleOffset;
    const pStart = new THREE.Vector3(bottomBracket.x, bottomBracket.y, zPos);
    const pEnd = new THREE.Vector3(
      bottomBracket.x + Math.cos(a) * crankLen,
      bottomBracket.y + Math.sin(a) * crankLen,
      zPos + sideSign * 0.008
    );
    const crankArm = createCylinderStrut(
      pStart,
      pEnd,
      0.012,
      0.016,
      darkAlloyMat,
      10
    );
    crankArm.scale.set(1, 1, 0.48);
    drivetrainGroup.add(crankArm);

    // Pedal spindle & Look/SPD-SL clipless road pedal platform
    const pedalPos = pEnd
      .clone()
      .add(new THREE.Vector3(0, 0, sideSign * 0.042));
    const spindle = createCylinderStrut(
      pEnd,
      pedalPos,
      0.004,
      0.004,
      stainlessSteelMat,
      8
    );
    drivetrainGroup.add(spindle);

    const pedalBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.068, 0.056),
      matteCarbonMat
    );
    pedalBody.position.copy(pedalPos);
    drivetrainGroup.add(pedalBody);
  }

  // 12-Speed Rear Cassette Cluster at Rear Axle right side (0.315, 0.54, +0.036..+0.058)
  const cogCount = 7;
  for (let c = 0; c < cogCount; c++) {
    const frac = c / (cogCount - 1);
    const cogR = 0.062 - frac * 0.038; // 34T largest cog down to 11T smallest cog
    const cogZ = 0.032 + frac * 0.024;
    const cog = new THREE.Mesh(
      new THREE.CylinderGeometry(cogR, cogR, 0.0022, 24),
      c === 0 ? darkAlloyMat : stainlessSteelMat
    );
    cog.rotation.x = Math.PI * 0.5;
    cog.position.set(0.315, 0.54, cogZ);
    drivetrainGroup.add(cog);
  }

  // Rear Derailleur Body & Jockey-Wheel Pulley Cage
  const derailleurHanger = new THREE.Vector3(0.285, 0.525, 0.064);
  const upperPulley = new THREE.Vector3(0.262, 0.548, 0.048);
  const lowerPulley = new THREE.Vector3(0.212, 0.562, 0.048);

  const rdBody = createCylinderStrut(
    new THREE.Vector3(0.315, 0.54, 0.064),
    derailleurHanger,
    0.008,
    0.01,
    darkAlloyMat,
    8
  );
  const rdCage = createCylinderStrut(
    upperPulley,
    lowerPulley,
    0.009,
    0.011,
    matteCarbonMat,
    10
  );
  drivetrainGroup.add(rdBody, rdCage);

  for (const pulleyPos of [upperPulley, lowerPulley]) {
    const pulleyWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.005, 14),
      darkAlloyMat
    );
    pulleyWheel.rotation.x = Math.PI * 0.5;
    pulleyWheel.position.copy(pulleyPos);
    drivetrainGroup.add(pulleyWheel);
  }

  // Upper & Lower Chain Runs + Front Derailleur Cage
  const chainZ = 0.045;
  const upperChainRun = createCylinderStrut(
    new THREE.Vector3(0.352, 0.55, chainZ),
    new THREE.Vector3(bottomBracket.x + 0.098, bottomBracket.y + 0.02, chainZ),
    0.0038,
    0.0038,
    chainGoldSilverMat,
    8
  );
  const lowerChainRun = createCylinderStrut(
    new THREE.Vector3(
      lowerPulley.x - 0.01,
      lowerPulley.y + 0.006,
      chainZ
    ),
    new THREE.Vector3(bottomBracket.x - 0.098, bottomBracket.y + 0.01, chainZ),
    0.0038,
    0.0038,
    chainGoldSilverMat,
    8
  );
  drivetrainGroup.add(upperChainRun, lowerChainRun);

  const frontDerailleur = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.052, 0.022),
    darkAlloyMat
  );
  frontDerailleur.position.set(0.365, 0.912, 0.036);
  drivetrainGroup.add(frontDerailleur);

  // 2 Carbon Bottle Cages with Cycling Bidons (on Down Tube & Seat Tube inside main triangle)
  const bottlePlacements: ReadonlyArray<{
    readonly base: THREE.Vector3;
    readonly top: THREE.Vector3;
  }> = [
    // Down tube bidon
    {
      base: new THREE.Vector3(0.415, 1.07, 0),
      top: new THREE.Vector3(0.535, 1.195, 0),
    },
    // Seat tube bidon
    {
      base: new THREE.Vector3(0.4, 0.935, 0),
      top: new THREE.Vector3(0.555, 0.89, 0),
    },
  ];

  for (const bp of bottlePlacements) {
    // Carbon cage collar
    const cageCenter = new THREE.Vector3()
      .addVectors(bp.base, bp.top)
      .multiplyScalar(0.5);
    const cageRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.004, 8, 20),
      matteCarbonMat
    );
    cageRing.position.copy(cageCenter);
    const dir = new THREE.Vector3().subVectors(bp.top, bp.base).normalize();
    cageRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    drivetrainGroup.add(cageRing);

    // Bidon body
    const bidonBody = createCylinderStrut(
      bp.base,
      bp.top,
      0.033,
      0.034,
      bottleMat,
      16
    );
    drivetrainGroup.add(bidonBody);

    // Black cap & pull nozzle at top of bidon
    const capTop = bp.top.clone().addScaledVector(dir, 0.022);
    const bidonCap = createCylinderStrut(
      bp.top,
      capTop,
      0.024,
      0.032,
      blackSteelMat,
      14
    );
    const nozzleTop = capTop.clone().addScaledVector(dir, 0.014);
    const bidonNozzle = createCylinderStrut(
      capTop,
      nozzleTop,
      0.008,
      0.01,
      rubberPadMat,
      10
    );
    drivetrainGroup.add(bidonCap, bidonNozzle);
  }

  bikePlaneGroup.add(drivetrainGroup);
  bikeRoot.add(bikePlaneGroup);

  return bikeRoot;
}

/**
 * Issue #16: Mounts 2 high-LOD Carbon Road Bikes side-by-side on bespoke wall-mounted
 * vertical front-wheel bike hooks on the West (-X) face of the Walk-in Cupboard East
 * partition wall (X = -7.97m) at Z = -2.04m (Bike 1) and Z = -1.32m (Bike 2).
 */
export function buildWalkInCupboardRoadBikes(scene: THREE.Scene): void {
  const roadBikesGroup = new THREE.Group();
  roadBikesGroup.name = 'familyRoom.walkInCupboard.roadBikes';
  roadBikesGroup.userData.zone = 'familyRoom';
  roadBikesGroup.userData.zoneId = 'familyRoom';
  roadBikesGroup.userData.lodTier = 2;

  // Issue #1: Move familyRoom.walkInCupboard.roadBikes to world center [-8.215, 1.03, -1.374]
  // (local position [0, -0.812, -2.466], Euler rotation [88.084°, 180°, 180°] along the enlarged East cupboard wall)
  roadBikesGroup.position.set(0, -0.812, -2.466);
  roadBikesGroup.rotation.set(
    THREE.MathUtils.degToRad(88.084),
    Math.PI,
    Math.PI
  );

  // Bike 1: Metallic British Racing Green with champagne-gold head-tube badge & tan-sidewall 700x28c tires
  const bike1 = buildSingleWallMountedRoadBike({
    name: 'familyRoom.walkInCupboard.roadBikes.bike1',
    mountZ: -1.74,
    frameColor: 0x1b4332,
    frameRoughness: 0.24,
    frameMetalness: 0.45,
    accentColor: 0xc9a96e,
    badgeColor: 0xd4b475,
    barTapeColor: 0x241e1a,
    bottleColor: 0x163628,
  });
  roadBikesGroup.add(bike1);

  // Bike 2: Stealth Matte Carbon Anthracite with crimson-red fork/top-tube accent & tan-sidewall 700x28c tires
  const bike2 = buildSingleWallMountedRoadBike({
    name: 'familyRoom.walkInCupboard.roadBikes.bike2',
    mountZ: -1.16,
    frameColor: 0x22252a,
    frameRoughness: 0.36,
    frameMetalness: 0.28,
    accentColor: 0x9e2a2b,
    badgeColor: 0xc8cdd4,
    barTapeColor: 0x1a1b1e,
    bottleColor: 0x8c2324,
  });
  roadBikesGroup.add(bike2);

  enableShadowsRecursively(roadBikesGroup);
  scene.add(roadBikesGroup);
}

