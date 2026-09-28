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
  mat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
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
      railY.position.set(0, 0, sz * halfZ);
      group.add(railY);
    }
    for (const sy of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        const corner = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.04, 6, 6),
          mat
        );
        corner.position.set(0, sy * halfY, sz * halfZ);
        group.add(corner);
      }
    }
  }

  return group;
}

/**
 * Issue #8: Large Statement Framed Oil-on-Canvas Landscape Artwork on the Sitting Room North Wall
 * at `[-20.208, 0.8, 3.7]` between the two brass wall sconces (`X = -19.135m` and `X = -21.281m`).
 */
export function buildSittingRoomNorthWallArt(
  scene: THREE.Scene,
  brassMat: THREE.Material,
  ceramicWhiteMat: THREE.Material
): void {
  const artGroup = new THREE.Group();
  artGroup.name = 'sittingRoom.northWallArt';
  artGroup.userData.zone = 'sittingRoom';
  artGroup.position.set(-20.208, 0.8, 3.7);

  const frameWidth = 1.32;
  const frameHeight = 1.06;

  const darkBronzeMouldingMat = new THREE.MeshStandardMaterial({
    color: 0x463522,
    roughness: 0.36,
    metalness: 0.58,
  });

  const warmLinenMat = new THREE.MeshStandardMaterial({
    color: 0xeae1d1,
    roughness: 0.86,
    metalness: 0.02,
  });

  // Backing board against North wall
  const backingBoard = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth - 0.02, frameHeight - 0.02, 0.012),
    ceramicWhiteMat
  );
  backingBoard.name = 'sittingRoom.northWallArt.backingBoard';
  backingBoard.position.set(0, 0, 0.006);
  backingBoard.castShadow = true;
  backingBoard.receiveShadow = true;
  artGroup.add(backingBoard);

  // Outer stepped dark-bronze & antique-brass gallery moulding rails (top, bottom, left, right)
  const outerRailW = 0.052;
  const outerRailD = 0.042;
  const innerStepW = 0.034;
  const innerStepD = 0.032;

  // Top & Bottom Horizontal Moulding Rails
  for (const [label, sy] of [
    ['top', 1],
    ['bottom', -1],
  ] as const) {
    const railY = sy * (frameHeight * 0.5 - outerRailW * 0.5);
    const outerRail = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, outerRailW, outerRailD),
      darkBronzeMouldingMat
    );
    outerRail.name = `sittingRoom.northWallArt.frameRail.${label}`;
    outerRail.position.set(0, railY, outerRailD * 0.5);
    outerRail.castShadow = true;
    outerRail.receiveShadow = true;
    artGroup.add(outerRail);

    // Stepped antique-brass ogee crest along outer perimeter
    const brassCrest = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth - 0.016, 0.018, outerRailD + 0.006),
      brassMat
    );
    brassCrest.position.set(
      0,
      sy * (frameHeight * 0.5 - 0.014),
      outerRailD * 0.5 + 0.003
    );
    artGroup.add(brassCrest);

    // Inner stepped rebate moulding
    const innerStep = new THREE.Mesh(
      new THREE.BoxGeometry(
        frameWidth - outerRailW * 1.4,
        innerStepW,
        innerStepD
      ),
      darkBronzeMouldingMat
    );
    innerStep.position.set(
      0,
      sy * (frameHeight * 0.5 - outerRailW - innerStepW * 0.35),
      innerStepD * 0.5 + 0.004
    );
    artGroup.add(innerStep);
  }

  // Left & Right Vertical Moulding Rails
  const sideRailLen = frameHeight - outerRailW * 2;
  for (const [label, sx] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    const railX = sx * (frameWidth * 0.5 - outerRailW * 0.5);
    const outerRail = new THREE.Mesh(
      new THREE.BoxGeometry(outerRailW, sideRailLen, outerRailD),
      darkBronzeMouldingMat
    );
    outerRail.name = `sittingRoom.northWallArt.frameRail.${label}`;
    outerRail.position.set(railX, 0, outerRailD * 0.5);
    outerRail.castShadow = true;
    outerRail.receiveShadow = true;
    artGroup.add(outerRail);

    const brassCrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, frameHeight - 0.016, outerRailD + 0.006),
      brassMat
    );
    brassCrest.position.set(
      sx * (frameWidth * 0.5 - 0.014),
      0,
      outerRailD * 0.5 + 0.003
    );
    artGroup.add(brassCrest);

    const innerStep = new THREE.Mesh(
      new THREE.BoxGeometry(
        innerStepW,
        frameHeight - outerRailW * 2,
        innerStepD
      ),
      darkBronzeMouldingMat
    );
    innerStep.position.set(
      sx * (frameWidth * 0.5 - outerRailW - innerStepW * 0.35),
      0,
      innerStepD * 0.5 + 0.004
    );
    artGroup.add(innerStep);
  }

  // Mitered-style corner ornaments & diagonal corner seam accents at all 4 corners
  for (const [cx, cy, rotZ] of [
    [-frameWidth * 0.5 + 0.028, frameHeight * 0.5 - 0.028, Math.PI * 0.25],
    [frameWidth * 0.5 - 0.028, frameHeight * 0.5 - 0.028, -Math.PI * 0.25],
    [-frameWidth * 0.5 + 0.028, -frameHeight * 0.5 + 0.028, -Math.PI * 0.25],
    [frameWidth * 0.5 - 0.028, -frameHeight * 0.5 + 0.028, Math.PI * 0.25],
  ] as const) {
    const cornerMiterSpline = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.068, outerRailD + 0.008),
      brassMat
    );
    cornerMiterSpline.position.set(cx, cy, outerRailD * 0.5 + 0.004);
    cornerMiterSpline.rotation.z = rotZ;
    artGroup.add(cornerMiterSpline);

    const cornerRosette = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.018, 0.008, 16),
      brassMat
    );
    cornerRosette.rotation.x = Math.PI * 0.5;
    cornerRosette.position.set(cx, cy, outerRailD + 0.006);
    artGroup.add(cornerRosette);
  }

  // Warm oatmeal linen passepartout slip liner
  const linerW = frameWidth - outerRailW * 2;
  const linerH = frameHeight - outerRailW * 2;
  const passepartoutLiner = new THREE.Mesh(
    new THREE.BoxGeometry(linerW, linerH, 0.022),
    warmLinenMat
  );
  passepartoutLiner.name = 'sittingRoom.northWallArt.passepartoutLiner';
  passepartoutLiner.position.set(0, 0, 0.014);
  passepartoutLiner.receiveShadow = true;
  artGroup.add(passepartoutLiner);

  // Inner gold/brass sight-edge fillet around the canvas opening
  const canvasW = 1.08;
  const canvasH = 0.82;
  const filletThickness = 0.012;
  const filletDepth = 0.028;

  for (const sy of [-1, 1] as const) {
    const hFillet = new THREE.Mesh(
      new THREE.BoxGeometry(
        canvasW + filletThickness * 2,
        filletThickness,
        filletDepth
      ),
      brassMat
    );
    hFillet.position.set(
      0,
      sy * (canvasH * 0.5 + filletThickness * 0.5),
      filletDepth * 0.5 + 0.004
    );
    artGroup.add(hFillet);
  }
  for (const sx of [-1, 1] as const) {
    const vFillet = new THREE.Mesh(
      new THREE.BoxGeometry(filletThickness, canvasH, filletDepth),
      brassMat
    );
    vFillet.position.set(
      sx * (canvasW * 0.5 + filletThickness * 0.5),
      0,
      filletDepth * 0.5 + 0.004
    );
    artGroup.add(vFillet);
  }

  // Painterly 512x384 CanvasTexture Oil-on-Canvas Landscape Painting:
  // Warm atmospheric English country / Chilterns golden-hour pastoral landscape
  const artCanvas = document.createElement('canvas');
  artCanvas.width = 512;
  artCanvas.height = 384;
  const ctx = artCanvas.getContext('2d');
  if (ctx) {
    // 1. Golden-hour atmospheric sky gradient (warm cream/apricot zenith to amber/mist horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 215);
    skyGrad.addColorStop(0.0, '#788996'); // Soft slate-blue upper sky matching East sofa ticking
    skyGrad.addColorStop(0.28, '#a9b1ad');
    skyGrad.addColorStop(0.58, '#dfd0b8'); // Farrow & Ball Cord warm neutral tone
    skyGrad.addColorStop(0.84, '#f0d5a8'); // Golden hour warm amber glow
    skyGrad.addColorStop(1.0, '#f7e4be');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 220);

    // 2. Soft sunlit cumulus & cirrus clouds painted with layered translucent strokes
    const clouds = [
      { x: 110, y: 68, rx: 85, ry: 22, c1: 'rgba(253, 244, 226, 0.65)', c2: 'rgba(196, 174, 150, 0.35)' },
      { x: 265, y: 92, rx: 120, ry: 28, c1: 'rgba(255, 241, 214, 0.72)', c2: 'rgba(182, 154, 128, 0.32)' },
      { x: 410, y: 58, rx: 75, ry: 18, c1: 'rgba(249, 238, 220, 0.55)', c2: 'rgba(168, 152, 138, 0.28)' },
      { x: 185, y: 132, rx: 140, ry: 18, c1: 'rgba(255, 232, 192, 0.68)', c2: 'rgba(212, 172, 128, 0.3)' },
    ];
    for (const cl of clouds) {
      ctx.fillStyle = cl.c2;
      ctx.beginPath();
      ctx.ellipse(cl.x + 6, cl.y + 6, cl.rx, cl.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cl.c1;
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.rx * 0.92, cl.ry * 0.85, -0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warm low sun glow over the distant Chiltern ridge
    const sunGlow = ctx.createRadialGradient(315, 168, 8, 315, 168, 135);
    sunGlow.addColorStop(0, 'rgba(255, 246, 214, 0.85)');
    sunGlow.addColorStop(0.45, 'rgba(244, 206, 146, 0.42)');
    sunGlow.addColorStop(1, 'rgba(244, 206, 146, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(140, 40, 340, 200);

    // 3. Distant misty Chiltern chalk hills (layered atmospheric perspective)
    ctx.fillStyle = '#9ea398';
    ctx.beginPath();
    ctx.moveTo(0, 192);
    ctx.bezierCurveTo(95, 162, 185, 178, 280, 168);
    ctx.bezierCurveTo(365, 158, 440, 145, 512, 160);
    ctx.lineTo(512, 240);
    ctx.lineTo(0, 240);
    ctx.closePath();
    ctx.fill();

    // Mid-distance rolling olive & heather hills
    const midHillGrad = ctx.createLinearGradient(0, 175, 0, 255);
    midHillGrad.addColorStop(0, '#848668');
    midHillGrad.addColorStop(0.6, '#6d704f');
    midHillGrad.addColorStop(1, '#55593c');
    ctx.fillStyle = midHillGrad;
    ctx.beginPath();
    ctx.moveTo(0, 202);
    ctx.bezierCurveTo(110, 185, 210, 212, 325, 195);
    ctx.bezierCurveTo(410, 182, 468, 176, 512, 188);
    ctx.lineTo(512, 275);
    ctx.lineTo(0, 275);
    ctx.closePath();
    ctx.fill();

    // Golden sunlit pasture fields & hedgerows in the middle ground
    const meadowGrad = ctx.createLinearGradient(0, 220, 0, 330);
    meadowGrad.addColorStop(0, '#b99d58');
    meadowGrad.addColorStop(0.45, '#8c7840');
    meadowGrad.addColorStop(1, '#4f462b');
    ctx.fillStyle = meadowGrad;
    ctx.beginPath();
    ctx.moveTo(0, 236);
    ctx.bezierCurveTo(140, 218, 255, 244, 390, 228);
    ctx.bezierCurveTo(450, 222, 488, 226, 512, 232);
    ctx.lineTo(512, 384);
    ctx.lineTo(0, 384);
    ctx.closePath();
    ctx.fill();

    // 4. Winding pastoral stream reflecting the golden sky
    const riverGrad = ctx.createLinearGradient(160, 245, 290, 384);
    riverGrad.addColorStop(0, '#ebd5a7');
    riverGrad.addColorStop(0.45, '#c9b896');
    riverGrad.addColorStop(1, '#6f7877');
    ctx.fillStyle = riverGrad;
    ctx.beginPath();
    ctx.moveTo(295, 236);
    ctx.bezierCurveTo(265, 265, 210, 285, 235, 325);
    ctx.bezierCurveTo(252, 352, 215, 370, 185, 384);
    ctx.lineTo(285, 384);
    ctx.bezierCurveTo(305, 362, 315, 338, 288, 312);
    ctx.bezierCurveTo(262, 285, 302, 260, 318, 236);
    ctx.closePath();
    ctx.fill();

    // Shimmering water ripples on the stream
    ctx.fillStyle = 'rgba(255, 245, 218, 0.55)';
    for (let ry = 248; ry < 378; ry += 7) {
      const rx = 255 + Math.sin(ry * 0.08) * 22;
      const rw = 14 + ((ry * 7) % 18);
      ctx.fillRect(rx - rw * 0.5, ry, rw, 1.8);
    }

    // 5. Old English stone farmhouse bridge spanning the stream in the mid-ground
    ctx.fillStyle = '#7c6b58';
    ctx.beginPath();
    ctx.moveTo(212, 292);
    ctx.quadraticCurveTo(265, 276, 316, 292);
    ctx.lineTo(318, 312);
    ctx.lineTo(210, 312);
    ctx.closePath();
    ctx.fill();

    // Dark shadow under the stone bridge arch + warm reflection
    ctx.fillStyle = '#2d251e';
    ctx.beginPath();
    ctx.arc(264, 312, 26, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Warm sunlit stone parapet highlight along top of bridge
    ctx.strokeStyle = '#d8c09c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(210, 291);
    ctx.quadraticCurveTo(265, 275, 318, 291);
    ctx.stroke();

    // Distant stone cottage roof nestled by the trees
    ctx.fillStyle = '#8b6f56';
    ctx.fillRect(356, 214, 28, 16);
    ctx.fillStyle = '#523828';
    ctx.beginPath();
    ctx.moveTo(352, 215);
    ctx.lineTo(370, 203);
    ctx.lineTo(388, 215);
    ctx.closePath();
    ctx.fill();

    // 6. Ancient English oak trees on left and right framing the vista (deep umber trunks + layered foliage)
    const drawPainterlyTree = (
      tx: number,
      ty: number,
      scale: number,
      flip: number
    ) => {
      // Gnarled trunk & boughs in deep espresso/umber (echoing West sofa color)
      ctx.strokeStyle = '#2f2219';
      ctx.lineWidth = 7 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(
        tx + flip * 12 * scale,
        ty - 45 * scale,
        tx + flip * 6 * scale,
        ty - 88 * scale
      );
      ctx.stroke();

      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(tx + flip * 8 * scale, ty - 58 * scale);
      ctx.quadraticCurveTo(
        tx + flip * 34 * scale,
        ty - 78 * scale,
        tx + flip * 52 * scale,
        ty - 96 * scale
      );
      ctx.stroke();

      // Deep shadow foliage masses
      const foliageClusters = [
        { dx: -24, dy: -98, r: 38, col: '#2d3321' },
        { dx: 18, dy: -112, r: 44, col: '#383f28' },
        { dx: 48, dy: -92, r: 34, col: '#313824' },
        { dx: -6, dy: -128, r: 36, col: '#474e31' },
        { dx: 26, dy: -118, r: 30, col: '#696c3d' },
        { dx: 38, dy: -104, r: 22, col: '#9b8848' }, // Golden hour rim light on canopy
      ];
      for (const fc of foliageClusters) {
        ctx.fillStyle = fc.col;
        ctx.beginPath();
        ctx.ellipse(
          tx + flip * fc.dx * scale,
          ty + fc.dy * scale,
          fc.r * scale * 1.18,
          fc.r * scale * 0.86,
          0.15 * flip,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    };

    drawPainterlyTree(86, 318, 1.22, 1);
    drawPainterlyTree(436, 298, 0.95, -1);
    drawPainterlyTree(168, 258, 0.56, 1);

    // 7. Rich foreground bank with dark espresso-chocolate reeds, warm ochre grasses & cream meadowsweet blossoms
    const fgGrad = ctx.createLinearGradient(0, 310, 0, 384);
    fgGrad.addColorStop(0, 'rgba(53, 39, 32, 0.0)');
    fgGrad.addColorStop(0.55, 'rgba(53, 39, 32, 0.68)');
    fgGrad.addColorStop(1, 'rgba(38, 28, 22, 0.92)');
    ctx.fillStyle = fgGrad;
    ctx.fillRect(0, 310, 512, 74);

    // Painterly wildflowers & grasses in foreground
    for (let i = 0; i < 140; i++) {
      const gx = (i * 37) % 512;
      const gy = 305 + ((i * 53) % 76);
      if (gx > 195 && gx < 285 && gy > 320) continue; // Leave stream channel clear
      ctx.strokeStyle = i % 3 === 0 ? '#b89b5e' : '#433b24';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(gx, gy + 10);
      ctx.quadraticCurveTo(gx + ((i % 5) - 2) * 3, gy + 3, gx + ((i % 7) - 3) * 2, gy - 6);
      ctx.stroke();

      if (i % 4 === 0) {
        ctx.fillStyle = i % 8 === 0 ? '#f0e6d2' : '#d9a75a';
        ctx.beginPath();
        ctx.arc(gx, gy - 6, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Fine oil-on-linen canvas weave & impasto brush texture overlay
    ctx.fillStyle = 'rgba(255, 248, 232, 0.035)';
    for (let y = 0; y < 384; y += 3) {
      ctx.fillRect(0, y, 512, 1);
    }
    ctx.fillStyle = 'rgba(42, 30, 20, 0.03)';
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1, 384);
    }
  }

  const paintingTex = new THREE.CanvasTexture(artCanvas);
  paintingTex.colorSpace = THREE.SRGBColorSpace;
  paintingTex.needsUpdate = true;

  const paintingMat = new THREE.MeshStandardMaterial({
    map: paintingTex,
    roughness: 0.58,
    metalness: 0.04,
  });

  const canvasMesh = new THREE.Mesh(
    new THREE.BoxGeometry(canvasW, canvasH, 0.008),
    paintingMat
  );
  canvasMesh.name = 'sittingRoom.northWallArt.canvas';
  canvasMesh.position.set(0, 0, 0.024);
  canvasMesh.receiveShadow = true;
  artGroup.add(canvasMesh);

  // Subtle museum picture-frame shadow/reveal lip around inside of frame
  scene.add(artGroup);
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
    for (const [kx, kz] of [
      [-sofaDepth * 0.46, -sofaWidth * 0.485],
      [sofaDepth * 0.46, -sofaWidth * 0.485],
      [-sofaDepth * 0.46, sofaWidth * 0.485],
      [sofaDepth * 0.46, sofaWidth * 0.485],
    ] as const) {
      const cornerPleatRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.228, 0.032),
        pleatShadowMat
      );
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
      cornerKickPanel.position.set(kx * 0.985, 0.118, kz * 0.985);
      eastSofaGroup.add(cornerKickPanel);
    }

    // Center-front inverted box-pleat slit & underlying kick-pleat panel
    const centerFrontPleatSlit = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.228, 0.028),
      pleatShadowMat
    );
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
      stripedWeltMat
    );
    skirtTopWeltLoop.name = 'sittingRoom.eastSofa.skirtWelt';
    skirtTopWeltLoop.position.set(0, 0.245, 0);
    eastSofaGroup.add(skirtTopWeltLoop);

    // 2. Sculpted Softly-Rounded Upright Track Arms (armW = 0.135m, y = 0.24..0.63m)
    for (const sideSign of [-1, 1] as const) {
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
        stripedWeltMat
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
        stripedWeltMat
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
      stripedWeltMat
    );
    benchTopWelt.position.set(benchCenterX, 0.428, 0);
    eastSofaGroup.add(benchTopWelt);

    const benchBottomWelt = createPerimeterWeltLoop(
      benchD - 0.024,
      innerSeatW - 0.02,
      0.0065,
      'XZ',
      stripedWeltMat
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
          stripedWeltMat
        );
        backPiping.position.set(faceSign * 0.072, 0, 0);
        backCushionGroup.add(backPiping);
      }

      eastSofaGroup.add(backCushionGroup);
    }

    // 6. Two Plump Sculpted Striped Side Bolster Pillows tucked against the inside of the North & South arms
    for (const sideSign of [-1, 1] as const) {
      const bolsterGroup = new THREE.Group();
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
        stripedWeltMat
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
      chocolateBrownFlangeMat
    );
    plinthFrontSeam.position.set(0, 0.24, 0);
    westSofaGroup.add(plinthFrontSeam);

    // 3. Sculpted Slightly-Flared Full-Height Box Arms (y = 0.038..0.64m) with tailored perimeter self-flange welt seams
    for (const sideSign of [-1, 1] as const) {
      const armZ = sideSign * (innerSeatW * 0.5 + armW * 0.5 - 0.01);
      const armGroup = new THREE.Group();
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
        chocolateBrownFlangeMat
      );
      armFrontSeam.position.set(sofaDir * ((sofaDepth - 0.02) * 0.485), 0, 0);
      armGroup.add(armFrontSeam);

      const armTopSeam = createPerimeterWeltLoop(
        sofaDepth - 0.036,
        armW - 0.018,
        0.0065,
        'XZ',
        chocolateBrownFlangeMat
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
      chocolateBrownFlangeMat
    );
    benchFlangeSeam.name = 'sittingRoom.westSofa.benchFlangeLip';
    benchFlangeSeam.position.set(benchCenterX, 0.335, 0);
    westSofaGroup.add(benchFlangeSeam);

    const benchTopFlangeSeam = createPerimeterWeltLoop(
      benchD - 0.038,
      innerSeatW - 0.012,
      0.0065,
      'XZ',
      chocolateBrownFlangeMat
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
        chocolateBrownFlangeMat
      );
      knifeEdgeCord.name = `sittingRoom.westSofa.backCushionFlange.${bIdx}`;
      backPillowGroup.add(knifeEdgeCord);

      westSofaGroup.add(backPillowGroup);
    }

    // 7. Two Angled Sculpted Chocolate-Brown Knife-Edge Side Scatter Cushions against North & South Arms
    for (const sideSign of [-1, 1] as const) {
      const sidePillowGroup = new THREE.Group();
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
        chocolateBrownFlangeMat
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
