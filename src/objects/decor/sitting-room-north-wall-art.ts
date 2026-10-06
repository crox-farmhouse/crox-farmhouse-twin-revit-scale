import * as THREE from 'three';

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
    brassCrest.name = `sittingRoom.northWallArt.brassCrest.${label}`;
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
    innerStep.name = `sittingRoom.northWallArt.innerStep.${label}`;
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
    brassCrest.name = `sittingRoom.northWallArt.brassCrest.${label}`;
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
    innerStep.name = `sittingRoom.northWallArt.innerStep.${label}`;
    innerStep.position.set(
      sx * (frameWidth * 0.5 - outerRailW - innerStepW * 0.35),
      0,
      innerStepD * 0.5 + 0.004
    );
    artGroup.add(innerStep);
  }

  // Mitered-style corner ornaments & diagonal corner seam accents at all 4 corners
  for (const [cIdx, [cx, cy, rotZ]] of (
    [
      [-frameWidth * 0.5 + 0.028, frameHeight * 0.5 - 0.028, Math.PI * 0.25],
      [frameWidth * 0.5 - 0.028, frameHeight * 0.5 - 0.028, -Math.PI * 0.25],
      [-frameWidth * 0.5 + 0.028, -frameHeight * 0.5 + 0.028, -Math.PI * 0.25],
      [frameWidth * 0.5 - 0.028, -frameHeight * 0.5 + 0.028, Math.PI * 0.25],
    ] as const
  ).entries()) {
    const cornerMiterSpline = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.068, outerRailD + 0.008),
      brassMat
    );
    cornerMiterSpline.name = `sittingRoom.northWallArt.cornerMiterSpline.${cIdx + 1}`;
    cornerMiterSpline.userData.lodTier = 'high';
    cornerMiterSpline.userData.lodMaxDistance = 12;
    cornerMiterSpline.position.set(cx, cy, outerRailD * 0.5 + 0.004);
    cornerMiterSpline.rotation.z = rotZ;
    artGroup.add(cornerMiterSpline);

    const cornerRosette = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.018, 0.008, 16),
      brassMat
    );
    cornerRosette.name = `sittingRoom.northWallArt.cornerRosette.${cIdx + 1}`;
    cornerRosette.userData.lodTier = 'high';
    cornerRosette.userData.lodMaxDistance = 12;
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
    hFillet.name = `sittingRoom.northWallArt.sightFillet.${sy > 0 ? 'top' : 'bottom'}`;
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
    vFillet.name = `sittingRoom.northWallArt.sightFillet.${sx < 0 ? 'left' : 'right'}`;
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
