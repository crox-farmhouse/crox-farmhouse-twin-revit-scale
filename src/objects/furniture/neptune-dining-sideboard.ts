import * as THREE from 'three';
import { createCylinderStrut } from './wall-mounted-road-bikes.ts';

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
  geom.computeBoundingSphere();
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
  // Center at X = -9.335m (spanning -9.535m..-9.135m), Y = 0.00m, Z = 0.28m (spanning -0.24m..+0.80m)
  sideboardGroup.position.set(-9.335, 0, 0.28);

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

  for (const [legIdx, [lx, lz]] of legPositions.entries()) {
    const leg = new THREE.Mesh(legGeom, carcassPaintMat);
    leg.name = `familyRoom.westWallSideboard.leg.${legIdx + 1}`;
    leg.position.set(lx, 0.07, lz);
    leg.rotation.y = Math.PI * 0.25;
    sideboardGroup.add(leg);

    const glide = new THREE.Mesh(footGlideGeom, agedBrassMat);
    glide.name = `familyRoom.westWallSideboard.footGlide.${legIdx + 1}`;
    glide.userData.lodTier = 'high';
    glide.userData.lodMaxDistance = 12;
    glide.position.set(lx, 0.003, lz);
    sideboardGroup.add(glide);

    const stile = new THREE.Mesh(cornerStileGeom, carcassPaintMat);
    stile.name = `familyRoom.westWallSideboard.cornerStile.${legIdx + 1}`;
    stile.position.set(lx, 0.463, lz);
    sideboardGroup.add(stile);
  }

  // ── 2. Carcass Body, Recessed Side Panels, Rails & Shadow Reveals ──
  // Recessed carcass core (inset slightly from corner stiles to create crisp shadow reveals)
  const carcassCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.364, 0.636, 0.968),
    shadowRevealMat
  );
  carcassCore.name = 'familyRoom.westWallSideboard.carcassCore';
  carcassCore.position.set(-0.006, 0.465, 0);
  sideboardGroup.add(carcassCore);

  // Back panel against X = -0.198m (world X = -9.548m)
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.646, 1.01),
    carcassPaintMat
  );
  backPanel.name = 'familyRoom.westWallSideboard.backPanel';
  backPanel.position.set(-0.192, 0.463, 0);
  sideboardGroup.add(backPanel);

  // Side Shaker panels (North Z = -0.506m, South Z = +0.506m)
  for (const sideSign of [-1, 1]) {
    const sideLabel = sideSign < 0 ? 'north' : 'south';
    const sideZ = sideSign * 0.502;
    // Top & bottom side rails
    const topSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.312, 0.048, 0.028),
      carcassPaintMat
    );
    topSideRail.name = `familyRoom.westWallSideboard.sideRail.${sideLabel}.top`;
    topSideRail.position.set(0, 0.762, sideZ);
    sideboardGroup.add(topSideRail);

    const midSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.312, 0.036, 0.028),
      carcassPaintMat
    );
    midSideRail.name = `familyRoom.westWallSideboard.sideRail.${sideLabel}.mid`;
    midSideRail.position.set(0, 0.6, sideZ);
    sideboardGroup.add(midSideRail);

    const botSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.312, 0.048, 0.028),
      carcassPaintMat
    );
    botSideRail.name = `familyRoom.westWallSideboard.sideRail.${sideLabel}.bottom`;
    botSideRail.position.set(0, 0.164, sideZ);
    sideboardGroup.add(botSideRail);

    // Recessed side flat panel
    const sidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.308, 0.41, 0.016),
      carcassPaintMat
    );
    sidePanel.name = `familyRoom.westWallSideboard.sidePanel.${sideLabel}`;
    sidePanel.position.set(0, 0.382, sideSign * 0.494);
    sideboardGroup.add(sidePanel);
  }

  // Front horizontal rails & vertical center mullion (at X = +0.178m)
  const lowerFrontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.044, 0.956),
    carcassPaintMat
  );
  lowerFrontRail.name = 'familyRoom.westWallSideboard.frontRail.lower';
  lowerFrontRail.position.set(0.179, 0.162, 0);
  sideboardGroup.add(lowerFrontRail);

  const midFrontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.032, 0.956),
    carcassPaintMat
  );
  midFrontRail.name = 'familyRoom.westWallSideboard.frontRail.mid';
  midFrontRail.position.set(0.179, 0.598, 0);
  sideboardGroup.add(midFrontRail);

  const topFrontRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.028, 0.956),
    carcassPaintMat
  );
  topFrontRail.name = 'familyRoom.westWallSideboard.frontRail.top';
  topFrontRail.position.set(0.179, 0.772, 0);
  sideboardGroup.add(topFrontRail);

  // Center vertical divider stile between drawers & doors
  const centerMullion = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.61, 0.034),
    carcassPaintMat
  );
  centerMullion.name = 'familyRoom.westWallSideboard.centerMullion';
  centerMullion.position.set(0.178, 0.468, 0);
  sideboardGroup.add(centerMullion);

  // ── 3. Slatted Oak Lower Pot-Board Shelf (Y = 0.10m) + 2 Woven Wicker Baskets ──
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'familyRoom.westWallSideboard.potBoardShelf';
  shelfGroup.position.set(0, 0.1, 0);

  // Front & back oak bearer rails
  for (const [rIdx, rx] of ([-0.164, 0.164] as const).entries()) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.018, 0.968),
      weatheredOakMat
    );
    rail.name = `familyRoom.westWallSideboard.potBoardShelf.bearerRail.${rIdx === 0 ? 'west' : 'east'}`;
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
    slat.name = `familyRoom.westWallSideboard.potBoardShelf.slat.${i + 1}`;
    slat.position.set(sx, 0.004, 0);
    shelfGroup.add(slat);
  }

  // 2 Woven Seagrass / Wicker Storage Baskets on the pot-board shelf (Z = -0.24m and +0.24m)
  for (const [bIdx, basketZ] of ([-0.24, 0.24] as const).entries()) {
    const bPrefix = `familyRoom.westWallSideboard.potBoardShelf.basket.${bIdx + 1}`;
    const basketGroup = new THREE.Group();
    basketGroup.name = bPrefix;
    basketGroup.position.set(0.005, 0.01, basketZ);

    const bw = 0.31; // along X
    const bh = 0.115; // height
    const bd = 0.41; // along Z

    // Main basket body
    const basketCore = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      wickerPrimaryMat
    );
    basketCore.name = `${bPrefix}.core`;
    basketCore.position.y = bh * 0.5;
    basketGroup.add(basketCore);

    // Dark interior recess on top
    const basketInterior = new THREE.Mesh(
      new THREE.BoxGeometry(bw - 0.026, 0.014, bd - 0.026),
      darkCavityMat
    );
    basketInterior.name = `${bPrefix}.interior`;
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
      ribBand.name = `${bPrefix}.rib.${r + 1}`;
      ribBand.position.y = ry;
      basketGroup.add(ribBand);
    }

    // Thick braided top rim collar (4 hollow perimeter bars so interior cavity has zero coplanar bottom overlap)
    const collarOuterW = bw + 0.014;
    const collarOuterD = bd + 0.014;
    const collarBarW = 0.02;
    for (const [cLabel, cx, cz, cw, cd] of [
      ['west', -(collarOuterW - collarBarW) * 0.5, 0, collarBarW, collarOuterD],
      ['east', (collarOuterW - collarBarW) * 0.5, 0, collarBarW, collarOuterD],
      ['north', 0, -(collarOuterD - collarBarW) * 0.5, collarOuterW - collarBarW * 2, collarBarW],
      ['south', 0, (collarOuterD - collarBarW) * 0.5, collarOuterW - collarBarW * 2, collarBarW],
    ] as const) {
      const rimCollarBar = new THREE.Mesh(
        new THREE.BoxGeometry(cw, 0.018, cd),
        wickerSecondaryMat
      );
      rimCollarBar.name = `${bPrefix}.rimCollar.${cLabel}`;
      rimCollarBar.position.set(cx, bh, cz);
      basketGroup.add(rimCollarBar);
    }

    // Cut-out front handle slot on the East (+X) face
    const handleCutout = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.026, 0.1),
      darkCavityMat
    );
    handleCutout.name = `${bPrefix}.handleCutout`;
    handleCutout.position.set(bw * 0.5 + 0.002, bh - 0.03, 0);
    basketGroup.add(handleCutout);

    const handleTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.036, 0.116),
      wickerSecondaryMat
    );
    handleTrim.name = `${bPrefix}.handleTrim`;
    handleTrim.position.set(bw * 0.5, bh - 0.03, 0);
    basketGroup.add(handleTrim);

    shelfGroup.add(basketGroup);
  }
  sideboardGroup.add(shelfGroup);

  // ── 4. Two Upper Dovetailed Frieze Drawers (Z = -0.24m and +0.24m, Y = 0.68m) ──
  for (const [dIdx, drawerZ] of ([-0.24, 0.24] as const).entries()) {
    const dPrefix = `familyRoom.westWallSideboard.drawer.${dIdx + 1}`;
    const drawerGroup = new THREE.Group();
    drawerGroup.name = dPrefix;
    drawerGroup.position.set(0.192, 0.685, drawerZ);

    const dw = 0.442; // width along Z
    const dh = 0.132; // height along Y

    // Shadow reveal backing
    const revealBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, dh + 0.01, dw + 0.01),
      shadowRevealMat
    );
    revealBack.name = `${dPrefix}.revealBack`;
    revealBack.position.x = -0.006;
    drawerGroup.add(revealBack);

    // Recessed drawer face
    const drawerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, dh - 0.012, dw - 0.012),
      carcassPaintMat
    );
    drawerPanel.name = `${dPrefix}.frontPanel`;
    drawerGroup.add(drawerPanel);

    // Raised perimeter cockbeading around drawer front (4mm bead)
    const beadThick = 0.006;
    const beadDepth = 0.021;
    const topBead = new THREE.Mesh(
      new THREE.BoxGeometry(beadDepth, beadThick, dw),
      carcassPaintMat
    );
    topBead.name = `${dPrefix}.cockbead.top`;
    topBead.position.set(0.002, (dh - beadThick) * 0.5, 0);
    drawerGroup.add(topBead);

    const botBead = new THREE.Mesh(
      new THREE.BoxGeometry(beadDepth, beadThick, dw),
      carcassPaintMat
    );
    botBead.name = `${dPrefix}.cockbead.bottom`;
    botBead.position.set(0.002, -(dh - beadThick) * 0.5, 0);
    drawerGroup.add(botBead);

    for (const side of [-1, 1]) {
      const sLabel = side < 0 ? 'north' : 'south';
      const sideBead = new THREE.Mesh(
        new THREE.BoxGeometry(beadDepth, dh - beadThick * 2, beadThick),
        carcassPaintMat
      );
      sideBead.name = `${dPrefix}.cockbead.${sLabel}`;
      sideBead.position.set(0.002, 0, side * (dw - beadThick) * 0.5);
      drawerGroup.add(sideBead);

      // Subtle exposed oak dovetail pins near outer corners
      for (const [dtIdx, dy] of ([-0.036, 0.0, 0.036] as const).entries()) {
        const dovetailPin = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.012, 0.008),
          weatheredOakMat
        );
        dovetailPin.name = `${dPrefix}.dovetailPin.${sLabel}.${dtIdx + 1}`;
        dovetailPin.userData.lodTier = 'high';
        dovetailPin.userData.lodMaxDistance = 12;
        dovetailPin.position.set(0.001, dy, side * (dw * 0.5 - 0.012));
        drawerGroup.add(dovetailPin);
      }
    }

    // Aged-brass half-moon cup pull
    const cupBackplate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.004, 20, 1, false, 0, Math.PI),
      agedBrassMat
    );
    cupBackplate.name = `${dPrefix}.cupPull.backplate`;
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
    cupHood.name = `${dPrefix}.cupPull.hood`;
    cupHood.scale.set(0.55, 0.78, 1.15);
    cupHood.rotation.y = Math.PI * 0.5;
    cupHood.position.set(0.011, 0.004, 0);
    drawerGroup.add(cupHood);

    // Dark finger recess under the cup pull
    const cupShadow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.012, 14),
      darkCavityMat
    );
    cupShadow.name = `${dPrefix}.cupPull.recess`;
    cupShadow.rotation.z = Math.PI * 0.5;
    cupShadow.position.set(0.011, -0.005, 0);
    drawerGroup.add(cupShadow);

    // Mounting screw heads on cup pull ears
    for (const [sIdx, sz] of ([-0.034, 0.034] as const).entries()) {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8),
        agedBrassMat
      );
      screw.name = `${dPrefix}.cupPull.screw.${sIdx + 1}`;
      screw.userData.lodTier = 'high';
      screw.userData.lodMaxDistance = 12;
      screw.rotation.z = Math.PI * 0.5;
      screw.position.set(0.011, 0, sz);
      drawerGroup.add(screw);
    }

    sideboardGroup.add(drawerGroup);
  }

  // ── 5. Two Lower Shaker Framed-and-Panelled Cupboard Doors (Y = 0.38m) ──
  for (const [doorIdx, doorSign] of ([-1, 1] as const).entries()) {
    const doorPrefix = `familyRoom.westWallSideboard.cupboardDoor.${doorIdx + 1}`;
    const doorZ = doorSign * 0.24;
    const doorGroup = new THREE.Group();
    doorGroup.name = doorPrefix;
    doorGroup.position.set(0.19, 0.38, doorZ);

    const doorW = 0.442;
    const doorH = 0.386;
    const stileW = 0.052;
    const railH = 0.052;

    // Shadow reveal behind door
    const doorReveal = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, doorH + 0.01, doorW + 0.01),
      shadowRevealMat
    );
    doorReveal.name = `${doorPrefix}.reveal`;
    doorReveal.position.x = -0.009;
    doorGroup.add(doorReveal);

    // Recessed center Shaker flat panel
    const centerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, doorH - railH * 1.6, doorW - stileW * 1.6),
      carcassPaintMat
    );
    centerPanel.name = `${doorPrefix}.centerPanel`;
    centerPanel.position.x = -0.003;
    doorGroup.add(centerPanel);

    // Inner bevel/chamfer shadow frame around recessed panel
    const innerShadowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.004,
        doorH - railH * 1.92,
        doorW - stileW * 1.92
      ),
      shadowRevealMat
    );
    innerShadowFrame.name = `${doorPrefix}.innerShadowFrame`;
    innerShadowFrame.position.x = 0.002;
    doorGroup.add(innerShadowFrame);

    const raisedCenterPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, doorH - railH * 2.0, doorW - stileW * 2.0),
      carcassPaintMat
    );
    raisedCenterPanel.name = `${doorPrefix}.raisedCenterPanel`;
    raisedCenterPanel.position.x = 0.007;
    doorGroup.add(raisedCenterPanel);

    // Left & right Shaker stiles
    for (const s of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, doorH, stileW),
        carcassPaintMat
      );
      stile.name = `${doorPrefix}.stile.${s < 0 ? 'north' : 'south'}`;
      stile.position.set(0.004, 0, s * (doorW - stileW) * 0.5);
      doorGroup.add(stile);
    }

    // Top & bottom Shaker rails
    for (const r of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, railH, doorW - stileW * 2),
        carcassPaintMat
      );
      rail.name = `${doorPrefix}.rail.${r < 0 ? 'bottom' : 'top'}`;
      rail.position.set(0.004, r * (doorH - railH) * 0.5, 0);
      doorGroup.add(rail);
    }

    // Exposed brass butt hinge knuckles on outer edge
    for (const [hIdx, hy] of ([-0.125, 0.125] as const).entries()) {
      const hingeBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.038, 10),
        agedBrassMat
      );
      hingeBarrel.name = `${doorPrefix}.hinge.${hIdx + 1}`;
      hingeBarrel.userData.lodTier = 'high';
      hingeBarrel.userData.lodMaxDistance = 12;
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
    knobRose.name = `${doorPrefix}.knob.rose`;
    knobRose.rotation.z = Math.PI * 0.5;
    knobRose.position.set(0.016, knobY, knobZ);
    doorGroup.add(knobRose);

    const knobStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.009, 0.014, 14),
      agedBrassMat
    );
    knobStem.name = `${doorPrefix}.knob.stem`;
    knobStem.rotation.z = Math.PI * 0.5;
    knobStem.position.set(0.023, knobY, knobZ);
    doorGroup.add(knobStem);

    const knobHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 16, 12),
      agedBrassMat
    );
    knobHead.name = `${doorPrefix}.knob.head`;
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
  astragalStrip.name = 'familyRoom.westWallSideboard.astragalStrip';
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
  oakCoreSlab.name = 'familyRoom.westWallSideboard.oakTop.coreSlab';
  oakTopGroup.add(oakCoreSlab);

  // Upper & lower bevelled perimeter crown slabs for a chamfered edge profile (total thickness 0.034m -> top at Y = 0.820m)
  const oakTopCrown = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.022, 1.08),
    weatheredOakMat
  );
  oakTopCrown.name = 'familyRoom.westWallSideboard.oakTop.crown';
  oakTopGroup.add(oakTopCrown);

  const oakUpperSurface = new THREE.Mesh(
    new THREE.BoxGeometry(0.414, 0.034, 1.074),
    weatheredOakMat
  );
  oakUpperSurface.name = 'familyRoom.westWallSideboard.oakTop.upperSurface';
  oakTopGroup.add(oakUpperSurface);

  // 3 longitudinal weathered oak planks with recessed V-groove joint lines along Z
  for (const [gIdx, jointX] of ([-0.068, 0.068] as const).entries()) {
    const topGroove = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.035, 1.04),
      oakGrooveMat
    );
    topGroove.name = `familyRoom.westWallSideboard.oakTop.groove.${gIdx + 1}`;
    topGroove.position.set(jointX, 0.0005, 0);
    oakTopGroup.add(topGroove);
  }

  // Breadboard end cleats at Z = ±0.52m
  for (const cleatSign of [-1, 1]) {
    const cleatLabel = cleatSign < 0 ? 'north' : 'south';
    const breadboardJoint = new THREE.Mesh(
      new THREE.BoxGeometry(0.415, 0.035, 0.003),
      oakGrooveMat
    );
    breadboardJoint.name = `familyRoom.westWallSideboard.oakTop.breadboardJoint.${cleatLabel}`;
    breadboardJoint.position.set(0, 0.0005, cleatSign * 0.505);
    oakTopGroup.add(breadboardJoint);

    // Wooden dowel pins in breadboard ends
    for (const [pIdx, dx] of ([-0.13, 0, 0.13] as const).entries()) {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.0355, 8),
        oakGrooveMat
      );
      peg.name = `familyRoom.westWallSideboard.oakTop.dowelPeg.${cleatLabel}.${pIdx + 1}`;
      peg.userData.lodTier = 'high';
      peg.userData.lodMaxDistance = 12;
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
  coasterRim.name = 'familyRoom.westWallSideboard.diffuser.coasterRim';
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
  oilCore.name = 'familyRoom.westWallSideboard.diffuser.oilCore';
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
  collarLip.name = 'familyRoom.westWallSideboard.diffuser.collarLip';
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
  potSaucer.name = 'familyRoom.westWallSideboard.plant.saucer';
  potSaucer.position.y = 0.007;
  plantGroup.add(potSaucer);

  // Ribbed aged-terracotta pot (rTop = 0.095m, rBot = 0.072m, h = 0.16m)
  const potBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.072, 0.16, 28),
    terracottaPotMat
  );
  potBody.name = 'familyRoom.westWallSideboard.plant.potBody';
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
    potRib.name = `familyRoom.westWallSideboard.plant.potRib.${r + 1}`;
    potRib.rotation.x = Math.PI * 0.5;
    potRib.position.y = 0.012 + frac * 0.145;
    plantGroup.add(potRib);
  }

  const potCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.0075, 12, 28),
    terracottaRimMat
  );
  potCollar.name = 'familyRoom.westWallSideboard.plant.potCollar';
  potCollar.rotation.x = Math.PI * 0.5;
  potCollar.position.y = 0.16;
  plantGroup.add(potCollar);

  // Dark organic soil bed inside pot
  const soilBed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.089, 0.086, 0.016, 24),
    soilMat
  );
  soilBed.name = 'familyRoom.westWallSideboard.plant.soilBed';
  soilBed.position.y = 0.148;
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

  for (const [leafIdx, spec] of leafSpecs.entries()) {
    const stemBranch = new THREE.Group();
    stemBranch.name = `familyRoom.westWallSideboard.plant.branch.${leafIdx + 1}`;
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
    stemMesh.name = `familyRoom.westWallSideboard.plant.stem.${leafIdx + 1}`;
    stemBranch.add(stemMesh);

    // Sculpted curved botanical leaf blade attached at the tip of the petiole
    const bladeGeom = createBotanicalLeafBladeGeometry(
      spec.bladeLength,
      spec.bladeWidth,
      spec.archDrop,
      spec.curlTip
    );
    const bladeMesh = new THREE.Mesh(bladeGeom, leafMats[spec.matIndex]);
    bladeMesh.name = `familyRoom.westWallSideboard.plant.leafBlade.${leafIdx + 1}`;
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
    midribMesh.name = `familyRoom.westWallSideboard.plant.midrib.${leafIdx + 1}`;
    bladeMesh.add(midribMesh);

    plantGroup.add(stemBranch);
  }

  sideboardGroup.add(plantGroup);

  enableShadowsRecursively(sideboardGroup);
  scene.add(sideboardGroup);
}
