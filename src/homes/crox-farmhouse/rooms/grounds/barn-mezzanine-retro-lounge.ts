import * as THREE from 'three';

// ============================================================================
// BARN MEZZANINE 1990s RETRO GAMING & LOUNGE BUILDER
// Reference: Uploaded Mezzanine Photo (`media_1791202879638_22365d89.jpg`)
// - Mid-Century Rounded Teak Sideboard Credenza backed against the front balustrade
// - 1990s Sony Trinitron 27" CRT TV playing Disney's The Lion King (1994, Young Simba)
// - 1990s Hi-Fi VHS VCR Deck, VHS cassettes & clamshell VHS cases
// - Original 1995 Sony PlayStation 1 (SCPH-1002) on the floor rug with 2 controllers,
//   looping 3D cables, and open PS1 CD jewel cases
// - 2 Layered Vintage Rugs (Geometric Colour-Block Wool Rug + Crimson/Navy Persian Rug)
// - Sculpted 1990s Navy Corduroy Beanbags, Patterned Tapestry Beanbag & Kilim Pouffe
// - Low Mid-Century Coffee Table with Open Monopoly Board Game, Soda Cans & Snacks
// - 4 Colourful 1990s Graphic Skateboard Decks mounted vertically on the South wall
// - Framed 1990s Britpop & Cult Cinema Posters (Blur, Oasis, Spice Girls, Pulp Fiction,
//   Trainspotting, Jurassic Park, The Big Lebowski)
// - 5-Shelf Oak Bookcase stocked with 90s Board Games, VHS/CDs, Boombox & Lava Lamps
// ============================================================================

// Issue #7 ("Lighter oak less mahogany more like white oak" + Reference Photo `media_1791202879638_22365d89.jpg`):
// Seamless, Continuous Full-Board Solid European White Oak Cabinet Joinery Texture + Fine Open-Pore Bump Map:
// - ZERO artificial horizontal stave seam lines (which previously read as striped cardboard/veneer)
// - Rich, warm, satin hand-oiled natural European White Oak heartwood palette (`#b88856` to `#c89864` with deeper `#7e5430`
//   cathedral grain pores, `#d4a876` latewood highlights, and subtle quarter-sawn medullary ray flecks)
function createSolidWhiteOakJoineryTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  let seed = 73919;
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));

  if (cCtx && bCtx) {
    const baseR = 188;
    const baseG = 142;
    const baseB = 94;

    cCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = 'rgb(184, 184, 184)';
    bCtx.fillRect(0, 0, size, size);

    // 1. Smooth, periodic cross-grain heartwood/sapwood crown shading (100% seamless across y = 0..1024, zero hard lines!)
    for (let y = 0; y < size; y += 2) {
      const ny = y / size;
      const crownWave =
        Math.sin(ny * Math.PI * 2) * 9.0 +
        Math.cos(ny * Math.PI * 4 + 0.8) * 5.5 +
        Math.sin(ny * Math.PI * 6 + 1.9) * 3.0;
      const r = clamp(baseR + crownWave);
      const g = clamp(baseG + crownWave * 0.86);
      const b = clamp(baseB + crownWave * 0.68);
      cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      cCtx.fillRect(0, y, size, 2);
    }

    // 2. Continuous, organic longitudinal European White Oak fibers & cathedral heartwood figure along X (seamless across 0..1024)
    const cathedralCenters = [0.24 * size, 0.74 * size];
    const numFibers = 420;
    for (let f = 0; f < numFibers; f++) {
      const fyBase = ((f + 0.5) / numFibers) * size;
      const d0 = (fyBase - cathedralCenters[0]!) / (size * 0.25);
      const d1 = (fyBase - cathedralCenters[1]!) / (size * 0.25);
      const nearCathedral = Math.abs(d0) < Math.abs(d1) ? d0 : d1;

      const waveVal =
        Math.sin(f * 0.92) * 6.5 +
        Math.cos(f * 2.15 + 1.3) * 4.5 +
        Math.sin(nearCathedral * Math.PI * 3.0) * 7.0;
      const isDarkPore = waveVal < -3.2;
      const isLightRidge = waveVal > 4.2;

      const delta = isDarkPore
        ? -32 - Math.round(rand() * 14)
        : isLightRidge
          ? 16 + Math.round(rand() * 8)
          : Math.round(waveVal * 1.4);

      cCtx.strokeStyle = `rgba(${clamp(baseR + delta)}, ${clamp(baseG + Math.round(delta * 0.86))}, ${clamp(baseB + Math.round(delta * 0.72))}, ${isDarkPore ? 0.54 : isLightRidge ? 0.36 : 0.28})`;
      cCtx.lineWidth = isDarkPore ? 1.55 : 1.15;

      const bVal = clamp(184 + (isDarkPore ? -46 : isLightRidge ? 24 : Math.round(waveVal * 2.2)));
      bCtx.strokeStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
      bCtx.lineWidth = isDarkPore ? 1.6 : 1.1;

      const phase1 = (f % 7) * 0.9;
      const phase2 = (f % 11) * 0.6;
      const archAmp = (1 - Math.min(1, Math.abs(nearCathedral))) * 16.0 * Math.sign(nearCathedral || 1);

      cCtx.beginPath();
      bCtx.beginPath();
      for (let x = 0; x <= size; x += 16) {
        const nx = x / size;
        const py =
          fyBase +
          Math.sin(nx * Math.PI * 2 + phase1) * archAmp +
          Math.cos(nx * Math.PI * 4 + phase2) * 3.2 +
          Math.sin(nx * Math.PI * 6 + f * 0.12) * 1.2;
        const wrappedY = ((py % size) + size) % size;
        if (x === 0) {
          cCtx.moveTo(x, wrappedY);
          bCtx.moveTo(x, wrappedY);
        } else {
          // Avoid vertical jump if fiber wraps across 0/1024 boundary
          const prevNx = (x - 16) / size;
          const prevPy =
            fyBase +
            Math.sin(prevNx * Math.PI * 2 + phase1) * archAmp +
            Math.cos(prevNx * Math.PI * 4 + phase2) * 3.2 +
            Math.sin(prevNx * Math.PI * 6 + f * 0.12) * 1.2;
          const prevWrappedY = ((prevPy % size) + size) % size;
          if (Math.abs(wrappedY - prevWrappedY) > size * 0.5) {
            cCtx.moveTo(x, wrappedY);
            bCtx.moveTo(x, wrappedY);
          } else {
            cCtx.lineTo(x, wrappedY);
            bCtx.lineTo(x, wrappedY);
          }
        }
      }
      cCtx.stroke();
      bCtx.stroke();
    }

    // 3. Characteristic ring-porous European White Oak open earlywood pores along the grain
    for (let p = 0; p < 1400; p++) {
      const px = rand() * (size - 28);
      const py = rand() * size;
      const plen = 7 + rand() * 20;
      cCtx.strokeStyle = p % 3 === 0 ? 'rgba(92, 60, 34, 0.38)' : 'rgba(116, 78, 46, 0.30)';
      cCtx.lineWidth = 1.05;
      cCtx.beginPath();
      cCtx.moveTo(px, py);
      cCtx.lineTo(px + plen, py + (rand() - 0.5) * 0.8);
      cCtx.stroke();

      bCtx.strokeStyle = 'rgb(112, 112, 112)';
      bCtx.lineWidth = 1.1;
      bCtx.beginPath();
      bCtx.moveTo(px, py);
      bCtx.lineTo(px + plen, py);
      bCtx.stroke();
    }

    // 4. Quarter-sawn White Oak Medullary Ray Flecks (warm golden-amber silk ribbons)
    for (let m = 0; m < 85; m++) {
      const mx = rand() * (size - 40);
      const my = rand() * (size - 12);
      const mw = 14 + rand() * 26;
      const mh = 1.8 + rand() * 2.6;
      cCtx.fillStyle = 'rgba(218, 178, 128, 0.22)';
      cCtx.beginPath();
      cCtx.ellipse(mx, my, mw, mh, (rand() - 0.5) * 0.08, 0, Math.PI * 2);
      cCtx.fill();
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  return { colorMap, bumpMap };
}

function createTeakWoodTexture(): THREE.CanvasTexture {
  return createSolidWhiteOakJoineryTextures().colorMap;
}

/**
 * Applies real-world metric planar woodgrain UVs to cabinet/furniture geometry so the oak grain
 * (`u` in texture) runs along `grainAxis` ('y' for vertical doors/uprights/legs, 'z' for horizontal
 * tops/drawers/shelves, or 'x' for front-to-back cross rails) with zero stretching or distortion.
 */
function applyOakJoineryUVs(
  geo: THREE.BufferGeometry,
  grainAxis: 'x' | 'y' | 'z',
  scaleAlong: number = 1.15,
  scaleAcross: number = 1.45,
  uOffset: number = 0,
  vOffset: number = 0
): THREE.BufferGeometry {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  let uv = geo.attributes.uv;
  if (!pos || !norm) return geo;
  if (!uv) {
    uv = new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2);
    geo.setAttribute('uv', uv);
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    let along = z;
    let across = y;
    if (grainAxis === 'y') {
      along = y;
      across = nx >= 0.5 ? z : x;
    } else if (grainAxis === 'z') {
      along = z;
      across = ny >= 0.5 ? x : y;
    } else {
      along = x;
      across = ny >= 0.5 ? z : y;
    }
    uv.setXY(i, along * scaleAlong + uOffset, across * scaleAcross + vOffset);
  }
  uv.needsUpdate = true;
  return geo;
}

// Issue #6 ("sheepskin beanbag" at `[-2.208, 2.109, 15.359]`, `outbuildings.mezzanine.beanbag.navyBack`):
// Curly Warm-Ivory / Natural Cream New Zealand Sheepskin Fleece Texture & High-Relief Wool Curl Bump Map
function createSheepskinFleeceTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  let seed = 41927;
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  if (cCtx && bCtx) {
    cCtx.fillStyle = '#f2ead9';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#606060';
    bCtx.fillRect(0, 0, size, size);

    // Thousands of soft overlapping curly wool fleece tufts & bouclé ringlets
    for (let i = 0; i < 2400; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const r = 3.5 + rand() * 7.5;
      const warmShift = Math.round((rand() - 0.45) * 14);
      const cr = Math.min(255, Math.max(225, 245 + warmShift));
      const cg = Math.min(252, Math.max(216, 237 + warmShift));
      const cb = Math.min(242, Math.max(198, 221 + warmShift));

      for (const wx of [-size, 0, size] as const) {
        for (const wy of [-size, 0, size] as const) {
          const px = cx + wx;
          const py = cy + wy;
          if (px + r < 0 || px - r > size || py + r < 0 || py - r > size) continue;

          const cGrad = cCtx.createRadialGradient(px - r * 0.25, py - r * 0.25, r * 0.1, px, py, r);
          cGrad.addColorStop(0, `rgb(${Math.min(255, cr + 7)}, ${Math.min(255, cg + 7)}, ${Math.min(255, cb + 6)})`);
          cGrad.addColorStop(0.7, `rgb(${cr}, ${cg}, ${cb})`);
          cGrad.addColorStop(1, 'rgba(218, 206, 186, 0.35)');
          cCtx.fillStyle = cGrad;
          cCtx.beginPath();
          cCtx.arc(px, py, r, 0, Math.PI * 2);
          cCtx.fill();

          const bGrad = bCtx.createRadialGradient(px - r * 0.2, py - r * 0.2, r * 0.1, px, py, r);
          bGrad.addColorStop(0, 'rgba(248, 248, 248, 0.85)');
          bGrad.addColorStop(0.65, 'rgba(185, 185, 185, 0.65)');
          bGrad.addColorStop(1, 'rgba(70, 70, 70, 0)');
          bCtx.fillStyle = bGrad;
          bCtx.beginPath();
          bCtx.arc(px, py, r, 0, Math.PI * 2);
          bCtx.fill();
        }
      }
    }

    // Fine curly wool fiber strands across the surface
    cCtx.lineWidth = 1.1;
    bCtx.lineWidth = 1.4;
    for (let s = 0; s < 1600; s++) {
      const sx = rand() * size;
      const sy = rand() * size;
      const sr = 2.5 + rand() * 4.5;
      const a0 = rand() * Math.PI * 2;
      cCtx.strokeStyle = s % 2 === 0 ? 'rgba(255, 252, 245, 0.45)' : 'rgba(210, 196, 174, 0.32)';
      cCtx.beginPath();
      cCtx.arc(sx, sy, sr, a0, a0 + Math.PI * 1.25);
      cCtx.stroke();

      bCtx.strokeStyle = 'rgba(235, 235, 235, 0.45)';
      bCtx.beginPath();
      bCtx.arc(sx, sy, sr, a0, a0 + Math.PI * 1.25);
      bCtx.stroke();
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(3, 3);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);

  return { colorMap, bumpMap };
}

function createLionKingTrinitronScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Vibrant Pride Lands cerulean blue sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 230);
    skyGrad.addColorStop(0, '#1e88e5');
    skyGrad.addColorStop(0.55, '#4fc3f7');
    skyGrad.addColorStop(1, '#b3e5fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 230);

    // Warm sunlit clouds
    ctx.fillStyle = 'rgba(255, 253, 240, 0.78)';
    const clouds: ReadonlyArray< readonly [number, number, number, number] > = [
      [110, 62, 68, 22],
      [155, 56, 54, 20],
      [370, 74, 76, 24],
      [420, 68, 52, 18],
      [250, 95, 90, 18],
    ];
    for (const [cx, cy, rx, ry] of clouds) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Distant blue-lavender African mountains & mesas
    ctx.fillStyle = '#6a8caf';
    ctx.beginPath();
    ctx.moveTo(0, 225);
    ctx.lineTo(55, 192);
    ctx.lineTo(135, 196);
    ctx.lineTo(195, 218);
    ctx.lineTo(310, 212);
    ctx.lineTo(375, 185);
    ctx.lineTo(455, 190);
    ctx.lineTo(512, 216);
    ctx.lineTo(512, 235);
    ctx.lineTo(0, 235);
    ctx.closePath();
    ctx.fill();

    // Distant green savanna tree line
    ctx.fillStyle = '#4d7c3f';
    ctx.fillRect(0, 222, 512, 18);

    // 3. Golden Pride Lands savanna grasslands
    const grassGrad = ctx.createLinearGradient(0, 232, 0, 384);
    grassGrad.addColorStop(0, '#c8b956');
    grassGrad.addColorStop(0.45, '#b39c3e');
    grassGrad.addColorStop(1, '#7a6324');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 232, 512, 152);

    // Savanna grass texture strokes & foreground rock on right
    ctx.strokeStyle = 'rgba(102, 128, 38, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 95; i++) {
      const gx = (i * 37) % 512;
      const gy = 238 + ((i * 23) % 135);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + ((i % 3) - 1) * 4, gy - 9);
      ctx.stroke();
    }

    // Foreground Pride Rock boulder on right side
    ctx.fillStyle = '#5c4938';
    ctx.beginPath();
    ctx.moveTo(355, 384);
    ctx.quadraticCurveTo(378, 302, 445, 290);
    ctx.lineTo(512, 285);
    ctx.lineTo(512, 384);
    ctx.closePath();
    ctx.fill();

    // 4. Young Simba (1994 hand-drawn Disney animation style in center of frame!)
    ctx.save();
    // Subtle ground shadow under Simba's paws
    ctx.fillStyle = 'rgba(60, 42, 15, 0.38)';
    ctx.beginPath();
    ctx.ellipse(246, 344, 74, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail sweeping left with dark-brown tuft
    ctx.strokeStyle = '#d98c2b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(192, 276);
    ctx.bezierCurveTo(155, 268, 144, 298, 160, 315);
    ctx.stroke();
    ctx.fillStyle = '#6d3714';
    ctx.beginPath();
    ctx.ellipse(160, 317, 10, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Hindquarters & back legs (left side)
    ctx.fillStyle = '#e09532';
    ctx.strokeStyle = '#4a250b';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(208, 278, 28, 22, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Back legs & paws
    ctx.fillStyle = '#d68828';
    ctx.beginPath();
    ctx.roundRect(184, 286, 16, 52, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(204, 288, 16, 48, 7);
    ctx.fill();
    ctx.stroke();

    // Torso / body
    ctx.fillStyle = '#e59a35';
    ctx.beginPath();
    ctx.ellipse(242, 272, 42, 25, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Warm cream chest / underbelly
    ctx.fillStyle = '#f6d48f';
    ctx.beginPath();
    ctx.ellipse(264, 276, 22, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Front legs & paws
    ctx.fillStyle = '#e59a35';
    ctx.beginPath();
    ctx.roundRect(252, 284, 16, 56, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(274, 282, 16, 56, 7);
    ctx.fill();
    ctx.stroke();

    // Paws
    ctx.fillStyle = '#e8a23d';
    for (const px of [183, 205, 253, 276]) {
      ctx.beginPath();
      ctx.ellipse(px + 8, 339, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Simba's Ears
    for (const [ex, ey, rot] of [
      [252, 180, -0.38],
      [304, 182, 0.38],
    ] as const) {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(rot);
      ctx.fillStyle = '#e59a35';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Dark ear rim stripe
      ctx.fillStyle = '#5c2c0e';
      ctx.beginPath();
      ctx.arc(0, -6, 10, Math.PI, 0);
      ctx.fill();
      // Inner ear
      ctx.fillStyle = '#c97248';
      ctx.beginPath();
      ctx.ellipse(0, 3, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Simba's Head
    ctx.fillStyle = '#eb9f38';
    ctx.beginPath();
    ctx.ellipse(278, 210, 31, 29, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Forehead tuft
    ctx.beginPath();
    ctx.moveTo(268, 182);
    ctx.quadraticCurveTo(278, 168, 288, 182);
    ctx.fill();

    // Cream muzzle & chin
    ctx.fillStyle = '#fae1a8';
    ctx.beginPath();
    ctx.ellipse(282, 224, 21, 14, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Expressive Disney eyes
    for (const ex of [268, 291]) {
      ctx.fillStyle = '#fff9d2';
      ctx.beginPath();
      ctx.ellipse(ex, 206, 7.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8c2d0c';
      ctx.beginPath();
      ctx.arc(ex + 1, 207, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(ex + 1, 207, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 0.5, 204.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyebrows
    ctx.strokeStyle = '#4a250b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(259, 194);
    ctx.quadraticCurveTo(268, 190, 275, 195);
    ctx.moveTo(285, 195);
    ctx.quadraticCurveTo(293, 190, 300, 195);
    ctx.stroke();

    // Pink-coral triangular lion cub nose
    ctx.fillStyle = '#d46559';
    ctx.beginPath();
    ctx.moveTo(274, 216);
    ctx.lineTo(291, 216);
    ctx.lineTo(282.5, 225);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Smile mouth line
    ctx.beginPath();
    ctx.moveTo(282.5, 225);
    ctx.lineTo(282.5, 230);
    ctx.moveTo(273, 229);
    ctx.quadraticCurveTo(282.5, 234, 292, 229);
    ctx.stroke();
    ctx.restore();

    // 5. Authentic 1990s Sony Trinitron aperture-grille scanlines & subtle CRT glass vignette
    ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
    for (let y = 0; y < 384; y += 3) {
      ctx.fillRect(0, y, 512, 1);
    }
    const vig = ctx.createRadialGradient(256, 192, 145, 256, 192, 295);
    vig.addColorStop(0, 'rgba(255,255,255,0.04)');
    vig.addColorStop(0.82, 'rgba(0,0,0,0.08)');
    vig.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, 512, 384);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGeometricColourBlockRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Issue #1 ("This has gone way too childish, look at the original concept art. It needs to be cosy and warm just not 1970s.
    // Traditional style rug. Still wooden book case. Not bright purples and blacks like a CBBC studio."):
    // Matches the foreground rug in `media_1791202879638_22365d89.jpg`: a large warm natural oatmeal/cream woven wool center field
    // framed by understated, cosy geometric border blocks in deep heritage navy, muted terracotta-rust, warm taupe, and slate-denim.
    ctx.fillStyle = '#d8cebc';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle woven oatmeal center field border frame
    ctx.fillStyle = '#cfc3ae';
    ctx.fillRect(78, 78, 356, 356);
    ctx.fillStyle = '#ddd3c2';
    ctx.fillRect(92, 92, 328, 328);

    const blocks: ReadonlyArray< readonly [number, number, number, number, string] > = [
      [0, 0, 148, 92, '#233042'],      // Deep heritage navy corner block
      [148, 0, 196, 78, '#8c4532'],    // Muted warm terracotta-rust border block
      [344, 0, 168, 92, '#465a70'],    // Muted slate-denim block
      [0, 92, 78, 210, '#5c4332'],     // Warm walnut-taupe side block
      [0, 302, 86, 118, '#b6956e'],    // Warm camel-sand block
      [0, 420, 164, 92, '#233042'],    // Deep heritage navy corner
      [164, 434, 188, 78, '#6e3b2c'],  // Warm russet-umber block
      [352, 420, 160, 92, '#2c3d52'],  // Deep indigo-slate corner
      [434, 92, 78, 176, '#8c4532'],   // Muted terracotta side block
      [434, 268, 78, 152, '#5c4332'],  // Warm walnut-taupe side block
      [78, 78, 48, 48, '#465a70'],     // Subtle inner corner accent
      [386, 386, 48, 48, '#b6956e'],   // Subtle inner camel accent
    ];
    for (const [x, y, w, h, col] of blocks) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    }

    // Cosy hand-tufted wool pile micro-texture
    for (let i = 0; i < 6500; i++) {
      const rx = (i * 73) % 512;
      const ry = (i * 137) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,248,235,0.055)' : 'rgba(42,32,22,0.05)';
      ctx.fillRect(rx, ry, 3, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPersianMedallionRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Issue #1: Traditional warm crimson-red (`#7d211d`), deep midnight navy (`#1b2638`), warm antique-cream (`#e8dcc4`),
    // and muted ochre-gold (`#bfa168`) Persian Heriz / Tabriz medallion rug matching `media_1791202879638_22365d89.jpg`.
    ctx.fillStyle = '#7d211d';
    ctx.fillRect(0, 0, 512, 512);

    // Traditional multi-guard border bands
    const borders: ReadonlyArray< readonly [number, string, number] > = [
      [14, '#e8dcc4', 8],
      [28, '#1b2638', 22],
      [48, '#bfa168', 6],
      [60, '#8f2c26', 10],
      [72, '#e8dcc4', 5],
    ];
    for (const [inset, col, lw] of borders) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.strokeRect(inset, inset, 512 - inset * 2, 512 - inset * 2);
    }

    // Floral rosette motifs along the main navy border (`inset = 28`)
    for (let i = 36; i <= 476; i += 28) {
      for (const [bx, by] of [
        [i, 28],
        [i, 484],
        [28, i],
        [484, i],
      ] as const) {
        ctx.fillStyle = i % 56 === 8 ? '#c84b38' : '#e8dcc4';
        ctx.beginPath();
        ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Stepped antique-cream & navy corner spandrels inside the field (`76..436`)
    for (const [sx, sy, dx, dy] of [
      [76, 76, 1, 1],
      [436, 76, -1, 1],
      [76, 436, 1, -1],
      [436, 436, -1, -1],
    ] as const) {
      ctx.fillStyle = '#1b2638';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx * 96, sy);
      ctx.lineTo(sx, sy + dy * 96);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e8dcc4';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + dx * 62, sy);
      ctx.lineTo(sx, sy + dy * 62);
      ctx.closePath();
      ctx.fill();
    }

    // Central stepped Persian diamond & octagram medallion (`cx = 256, cy = 256`)
    const drawSteppedDiamond = (rx: number, ry: number, fillCol: string, strokeCol: string): void => {
      ctx.fillStyle = fillCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(256, 256 - ry);
      ctx.lineTo(256 + rx * 0.65, 256 - ry * 0.35);
      ctx.lineTo(256 + rx, 256);
      ctx.lineTo(256 + rx * 0.65, 256 + ry * 0.35);
      ctx.lineTo(256, 256 + ry);
      ctx.lineTo(256 - rx * 0.65, 256 + ry * 0.35);
      ctx.lineTo(256 - rx, 256);
      ctx.lineTo(256 - rx * 0.65, 256 - ry * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    drawSteppedDiamond(118, 146, '#1b2638', '#e8dcc4');
    drawSteppedDiamond(82, 102, '#9e2b25', '#bfa168');
    drawSteppedDiamond(46, 58, '#e8dcc4', '#1b2638');
    drawSteppedDiamond(20, 26, '#1b2638', '#bfa168');

    // Subtle botanical vine & palmette motifs across the crimson field
    ctx.fillStyle = '#bfa168';
    for (const [fx, fy] of [
      [172, 185], [340, 185], [172, 327], [340, 327],
      [256, 96], [256, 416], [124, 256], [388, 256],
    ] as const) {
      ctx.beginPath();
      ctx.arc(fx, fy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b2638';
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bfa168';
    }

    // Antique cream warp fringes at both ends (`y = 0..8` and `y = 504..512`)
    ctx.strokeStyle = '#e5d9c0';
    ctx.lineWidth = 2;
    for (let x = 8; x < 504; x += 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 9);
      ctx.moveTo(x, 503);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Subtle aged wool weave & patina grain
    for (let i = 0; i < 5500; i++) {
      const rx = (i * 79) % 512;
      const ry = (i * 131) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,244,224,0.045)' : 'rgba(20,12,8,0.05)';
      ctx.fillRect(rx, ry, 3, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMonopolyBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Classic pale mint-sage Monopoly board center
    ctx.fillStyle = '#cbe3cc';
    ctx.fillRect(0, 0, 512, 512);

    // Outer black border & property track frame
    ctx.strokeStyle = '#1a241b';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);
    ctx.strokeRect(68, 68, 376, 376);

    // Property colour groups around the 4 sides (9 spaces per side between 68px corners)
    const sideColors: ReadonlyArray< ReadonlyArray<string> > = [
      // Bottom row: Brown & Light Blue
      ['#7a4928', '#cbe3cc', '#7a4928', '#cbe3cc', '#222222', '#7bc4e8', '#cbe3cc', '#7bc4e8', '#7bc4e8'],
      // Left col: Pink & Orange
      ['#d9388a', '#cbe3cc', '#d9388a', '#d9388a', '#222222', '#f28c28', '#cbe3cc', '#f28c28', '#f28c28'],
      // Top row: Red & Yellow
      ['#e02b2b', '#cbe3cc', '#e02b2b', '#e02b2b', '#222222', '#f2d024', '#f2d024', '#cbe3cc', '#f2d024'],
      // Right col: Green & Dark Blue
      ['#289e47', '#289e47', '#cbe3cc', '#289e47', '#222222', '#cbe3cc', '#1f459e', '#cbe3cc', '#1f459e'],
    ];

    const spaceW = 376 / 9;
    for (let i = 0; i < 9; i++) {
      const offset = 68 + i * spaceW;
      // Bottom
      ctx.strokeRect(offset, 444, spaceW, 64);
      ctx.fillStyle = sideColors[0][i];
      ctx.fillRect(offset + 1, 444, spaceW - 2, 16);
      // Top
      ctx.strokeRect(offset, 4, spaceW, 64);
      ctx.fillStyle = sideColors[2][i];
      ctx.fillRect(offset + 1, 52, spaceW - 2, 16);
      // Left
      ctx.strokeRect(4, offset, 64, spaceW);
      ctx.fillStyle = sideColors[1][i];
      ctx.fillRect(52, offset + 1, 16, spaceW - 2);
      // Right
      ctx.strokeRect(444, offset, 64, spaceW);
      ctx.fillStyle = sideColors[3][i];
      ctx.fillRect(444, offset + 1, 16, spaceW - 2);
    }

    // Corner squares (GO, Jail, Free Parking, Go to Jail)
    ctx.fillStyle = '#e02b2b';
    ctx.fillRect(454, 454, 44, 44);
    ctx.fillStyle = '#f28c28';
    ctx.fillRect(14, 454, 44, 44);

    // Diagonal red MONOPOLY banner across center
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#d92626';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.fillRect(-135, -30, 270, 60);
    ctx.strokeRect(-135, -30, 270, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MONOPOLY', 0, 2);

    // Chance & Community Chest dashed card rectangles
    ctx.fillStyle = '#f59331';
    ctx.fillRect(-95, -125, 68, 44);
    ctx.fillStyle = '#f5d131';
    ctx.fillRect(28, 82, 68, 44);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type SkateboardGraphicStyle = 'redFlame' | 'pinkCartoon' | 'cyanSun' | 'yellowFrog';

function createSkateboardDeckTexture(style: SkateboardGraphicStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (style === 'redFlame') {
      // Deck 1: Fiery Red/Orange 90s Skate Deck with bold yellow/black vertical graffiti lettering
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, '#b81d18');
      grad.addColorStop(0.5, '#d92b1e');
      grad.addColorStop(1, '#9e1612');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 1024);

      // Yellow/orange flame tongues at top & bottom kicks
      ctx.fillStyle = '#f5a623';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(28 + i * 36, 0);
        ctx.quadraticCurveTo(46 + i * 36, 180 + (i % 2) * 55, 64 + i * 36, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(28 + i * 36, 1024);
        ctx.quadraticCurveTo(46 + i * 36, 840 - (i % 2) * 55, 64 + i * 36, 1024);
        ctx.fill();
      }

      // Bold vertical yellow & black bubble lettering down the center spine
      ctx.save();
      ctx.translate(128, 512);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '900 92px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#141414';
      ctx.strokeText('SPITFIRE', 0, 0);
      ctx.fillStyle = '#ffd426';
      ctx.fillText('SPITFIRE', 0, 0);
      ctx.restore();
    } else if (style === 'pinkCartoon') {
      // Deck 2: Hot-Pink 90s Deck with cartoon skater character in center
      ctx.fillStyle = '#d93870';
      ctx.fillRect(0, 0, 256, 1024);

      // Teal & yellow graphic stripes
      ctx.fillStyle = '#25b5b8';
      ctx.fillRect(0, 410, 256, 204);
      ctx.fillStyle = '#ffde2e';
      ctx.fillRect(0, 400, 256, 12);
      ctx.fillRect(0, 610, 256, 12);

      // 90s Cartoon character face & backwards cap
      ctx.fillStyle = '#f7c18d';
      ctx.beginPath();
      ctx.arc(128, 520, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#181818';
      ctx.stroke();

      // Blue cap
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(128, 495, 64, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Sunglasses & grin
      ctx.fillStyle = '#111111';
      ctx.fillRect(82, 498, 38, 22);
      ctx.fillRect(136, 498, 38, 22);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(128, 542, 28, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (style === 'cyanSun') {
      // Deck 3: Bright Cyan-Teal Deck with Yellow Sunburst / Flower Graphic
      ctx.fillStyle = '#1f9fb8';
      ctx.fillRect(0, 0, 256, 1024);

      // Checkerboard bands near trucks
      ctx.fillStyle = '#12161a';
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 8; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(c * 32, 230 + r * 24, 32, 24);
            ctx.fillRect(c * 32, 750 + r * 24, 32, 24);
          }
        }
      }

      // Petal sunburst in center
      ctx.save();
      ctx.translate(128, 512);
      for (let p = 0; p < 12; p++) {
        ctx.save();
        ctx.rotate((p * Math.PI) / 6);
        ctx.fillStyle = p % 2 === 0 ? '#ffd624' : '#ff921c';
        ctx.beginPath();
        ctx.ellipse(0, -64, 18, 42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#141414';
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#e02828';
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      // Deck 4: Mustard-Yellow Deck with Green 90s Frog / Monster Graphic
      ctx.fillStyle = '#dcb028';
      ctx.fillRect(0, 0, 256, 1024);

      // Bold black stencil rings
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(128, 520, 92, 0, Math.PI * 2);
      ctx.stroke();

      // Green 90s skate frog / monster character
      ctx.fillStyle = '#2b8a3e';
      ctx.beginPath();
      ctx.ellipse(128, 530, 68, 78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Big cartoon eyes
      for (const ex of [96, 160]) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex, 468, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d92626';
        ctx.beginPath();
        ctx.arc(ex, 468, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Subtle mounting bolt holes at standard truck locations
    ctx.fillStyle = '#1a1a1a';
    for (const ty of [210, 255, 768, 814]) {
      for (const tx of [104, 152]) {
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type RetroPosterStyle =
  | 'blur'
  | 'oasis'
  | 'spiceGirls'
  | 'pulpFiction'
  | 'trainspotting'
  | 'jurassicPark'
  | 'bigLebowski';

function createRetro90sPosterTexture(style: RetroPosterStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (style === 'blur') {
      // Iconic warm amber/orange Blur 1990s poster
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#e89c31');
      grad.addColorStop(0.65, '#d67a1e');
      grad.addColorStop(1, '#8c4410');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 384, 512);

      // Bold lowercase 'blur' 90s Helvetica/Microgramma typography at top
      ctx.fillStyle = '#161412';
      ctx.font = 'bold 118px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('blur', 192, 132);

      // Stylized dark promenade / silhouettes in lower half
      ctx.fillStyle = '#1c1610';
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.lineTo(384, 330);
      ctx.lineTo(384, 512);
      ctx.lineTo(0, 512);
      ctx.closePath();
      ctx.fill();

      ctx.fillRect(235, 245, 22, 115);
      ctx.beginPath();
      ctx.arc(246, 232, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'oasis') {
      // Black-and-white Oasis portrait poster with dual boxed 'oasis' logos
      ctx.fillStyle = '#dfd9ce';
      ctx.fillRect(0, 0, 384, 512);

      // Monochrome band photo frame
      ctx.fillStyle = '#262626';
      ctx.fillRect(28, 112, 328, 288);

      // 5 monochrome band member portraits
      const members: ReadonlyArray< readonly [number, number, number] > = [
        [82, 220, 34],
        [142, 245, 32],
        [202, 210, 38],
        [258, 248, 32],
        [308, 222, 34],
      ];
      for (const [mx, my, mr] of members) {
        ctx.fillStyle = '#bcb6aa';
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#141414';
        ctx.beginPath();
        ctx.arc(mx, my - 6, mr * 0.85, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.fillStyle = '#484848';
        ctx.fillRect(mx - mr * 0.8, my + mr * 0.8, mr * 1.6, 110);
      }

      // Top & bottom black boxed 'oasis' logo
      for (const by of [30, 418]) {
        ctx.fillStyle = '#141414';
        ctx.fillRect(42, by, 300, 64);
        ctx.strokeStyle = '#dfd9ce';
        ctx.lineWidth = 4;
        ctx.strokeRect(48, by + 6, 288, 52);
        ctx.fillStyle = '#dfd9ce';
        ctx.font = 'italic bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('oasis', 192, by + 33);
      }
    } else if (style === 'spiceGirls') {
      // White vertical SPICE GIRLS poster
      ctx.fillStyle = '#f5f2ec';
      ctx.fillRect(0, 0, 384, 512);

      // Red 'SPICE' & black 'GIRLS' header
      ctx.fillStyle = '#c92a2a';
      ctx.font = '900 72px serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPICE', 192, 82);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 44px serif';
      ctx.fillText('G I R L S', 192, 130);

      // 5 Spice Girls standing lineup
      const outfits = ['#d93829', '#242424', '#f08c2b', '#e64980', '#2b6cb0'];
      for (let i = 0; i < 5; i++) {
        const gx = 56 + i * 68;
        // Legs
        ctx.fillStyle = '#d9a17c';
        ctx.fillRect(gx - 12, 310, 9, 125);
        ctx.fillRect(gx + 3, 310, 9, 125);
        // Platform boots
        ctx.fillStyle = i % 2 === 0 ? '#1a1a1a' : '#d9d2c5';
        ctx.fillRect(gx - 14, 420, 13, 24);
        ctx.fillRect(gx + 1, 420, 13, 24);
        // Outfit
        ctx.fillStyle = outfits[i];
        ctx.fillRect(gx - 18, 215, 36, 102);
        // Head & hair
        ctx.fillStyle = '#e0ac86';
        ctx.beginPath();
        ctx.arc(gx, 188, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style === 'pulpFiction') {
      // Black, red & yellow Pulp Fiction poster
      ctx.fillStyle = '#141210';
      ctx.fillRect(0, 0, 384, 512);

      // Red top banner & yellow PULP FICTION title
      ctx.fillStyle = '#b81d18';
      ctx.fillRect(18, 18, 348, 115);
      ctx.fillStyle = '#f5c418';
      ctx.font = '900 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PULP', 192, 68);
      ctx.fillText('FICTION', 192, 118);

      // Reclining portrait warmth
      ctx.fillStyle = '#d99868';
      ctx.beginPath();
      ctx.ellipse(210, 290, 68, 88, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(130, 340, 190, 130);

      // Yellow vintage paperback border
      ctx.strokeStyle = '#f5c418';
      ctx.lineWidth = 8;
      ctx.strokeRect(14, 14, 356, 484);
    } else if (style === 'trainspotting') {
      // White & bright orange 1996 Trainspotting poster
      ctx.fillStyle = '#f4f1ea';
      ctx.fillRect(0, 0, 384, 512);

      // Monochrome character lineup across center
      for (let i = 0; i < 4; i++) {
        const cx = 62 + i * 86;
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(cx - 28, 185, 56, 210);
        ctx.fillStyle = '#9e9a92';
        ctx.beginPath();
        ctx.arc(cx, 152, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Signature vibrant orange bottom banner with white 'Trainspotting' title
      ctx.fillStyle = '#eb5e1a';
      ctx.fillRect(0, 412, 384, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Trainspotting', 192, 474);
    } else if (style === 'jurassicPark') {
      // Framed poster with white passepartout mount
      ctx.fillStyle = '#efeae0';
      ctx.fillRect(0, 0, 384, 512);
      ctx.fillStyle = '#182232';
      ctx.fillRect(36, 44, 312, 424);
      ctx.fillStyle = '#d92b2b';
      ctx.beginPath();
      ctx.arc(192, 230, 88, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5d024';
      ctx.beginPath();
      ctx.arc(192, 230, 74, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.fillRect(72, 212, 240, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JURASSIC PARK', 192, 240);
    } else {
      // Classic 90s Cinema / Music Poster with warm mount
      ctx.fillStyle = '#efeae0';
      ctx.fillRect(0, 0, 384, 512);
      ctx.fillStyle = '#2d4059';
      ctx.fillRect(36, 44, 312, 424);
      ctx.fillStyle = '#ea5455';
      ctx.fillRect(58, 72, 268, 190);
      ctx.fillStyle = '#f07b3f';
      ctx.beginPath();
      ctx.arc(192, 168, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd460';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PULP / 90s', 192, 340);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCorduroyFabricTexture(baseHex: string, ribHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = ribHex;
    for (let x = 0; x < 256; x += 6) {
      ctx.fillRect(x, 0, 3, 256);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTapestryBeanbagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Issue #1: Warm woven chenille & kilim tapestry in oatmeal cream (`#ded3be`), heritage navy (`#243347`),
    // muted terracotta-rust (`#8c4532`), warm sage-olive (`#5a6b54`), and warm sand (`#b89870`), matching `media_1791202879638_22365d89.jpg`.
    ctx.fillStyle = '#ded3be';
    ctx.fillRect(0, 0, 256, 256);
    const colors = ['#243347', '#8c4532', '#5a6b54', '#b89870', '#dfd4c0'];
    for (let row = 0; row < 8; row++) {
      ctx.fillStyle = colors[row % colors.length];
      ctx.fillRect(0, row * 32, 256, 18);
      for (let col = 0; col < 8; col++) {
        ctx.fillStyle = colors[(row + col + 2) % colors.length];
        ctx.beginPath();
        ctx.moveTo(col * 32 + 16, row * 32 + 2);
        ctx.lineTo(col * 32 + 30, row * 32 + 16);
        ctx.lineTo(col * 32 + 16, row * 32 + 30);
        ctx.lineTo(col * 32 + 2, row * 32 + 16);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (let y = 0; y < 256; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgba(255,248,236,0.08)' : 'rgba(38,26,16,0.07)';
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createKnittedPouffeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#9e4f36';
    ctx.fillRect(0, 0, 256, 256);
    const bandColors = ['#dfd3be', '#2b394d', '#8c432e', '#b89468', '#4a372a'];
    for (let row = 0; row < 16; row++) {
      ctx.fillStyle = bandColors[row % bandColors.length];
      ctx.fillRect(0, row * 16, 256, 10);
      for (let x = 0; x < 256; x += 12) {
        ctx.fillStyle = 'rgba(255,246,232,0.16)';
        ctx.beginPath();
        ctx.arc(x + (row % 2) * 6, row * 16 + 5, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type PlayStationButtonSymbol = 'triangle' | 'circle' | 'cross' | 'square';

function createPlayStationButtonCapTexture(symbol: PlayStationButtonSymbol): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark charcoal Sony DualShock glossy button cap (`#23272e`) with subtle outer bevel ring
    ctx.fillStyle = '#23272e';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#383e48';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (symbol === 'triangle') {
      ctx.strokeStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(64, 30);
      ctx.lineTo(96, 88);
      ctx.lineTo(32, 88);
      ctx.closePath();
      ctx.stroke();
    } else if (symbol === 'circle') {
      ctx.strokeStyle = '#e84133';
      ctx.beginPath();
      ctx.arc(64, 64, 31, 0, Math.PI * 2);
      ctx.stroke();
    } else if (symbol === 'cross') {
      ctx.strokeStyle = '#5b9bd5';
      ctx.beginPath();
      ctx.moveTo(37, 37);
      ctx.lineTo(91, 91);
      ctx.moveTo(91, 37);
      ctx.lineTo(37, 91);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#e066a6';
      ctx.strokeRect(36, 36, 56, 56);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSculptedBeanbagGeometry(
  radiusX: number,
  heightY: number,
  radiusZ: number
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 36, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i);
    const ny = pos.getY(i);
    const nz = pos.getZ(i);

    // Base pear / slouchy lounge silhouette (`ny` in [-1..+1] -> y in [0..heightY])
    const tY = (ny + 1) * 0.5; // 0 at bottom, 1 at top
    // Bulge out near the lower belly (`tY ~ 0.28`) so it squishes plushly on the rug
    const bellyScale = 1.16 - 0.36 * Math.pow(tY, 1.35);
    let x = nx * radiusX * bellyScale;
    let z = nz * radiusZ * bellyScale;
    let y = Math.max(0, Math.pow(tY, 0.86) * heightY);

    // Flatten the bottom floor contact base (`tY < 0.14`)
    if (tY < 0.14) {
      y *= tY / 0.14;
    }

    // Carve a deep, plush slouchy lounge seat indentation on the front (`+z`) and raise a supportive backrest (`-z`)
    const frontFactor = Math.max(0, nz);
    const backFactor = Math.max(0, -nz);
    const radialCenter = Math.max(0, 1 - (nx * nx * 0.85 + (nz - 0.25) * (nz - 0.25) * 0.9));
    if (tY > 0.35) {
      // Scoop seat center down & raise back headrest peak
      y -= radialCenter * frontFactor * heightY * 0.34;
      y += Math.pow(backFactor, 1.4) * Math.sin(tY * Math.PI * 0.85) * heightY * 0.24;
    }

    // Soft organic fabric creases around the perimeter
    const angle = Math.atan2(nz, nx);
    const crease = Math.sin(angle * 7) * 0.014 * (1 - Math.abs(ny));
    x += nx * crease;
    z += nz * crease;

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function createSkateboardDeckGeometry(): THREE.BufferGeometry {
  const lengthY = 0.80;
  const widthX = 0.205;
  const thicknessZ = 0.011;
  const geo = new THREE.BoxGeometry(widthX, lengthY, thicknessZ, 18, 44, 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const halfW = widthX * 0.5;
  const halfL = lengthY * 0.5;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const ny = y / halfL; // -1 at tail, +1 at nose
    const absNy = Math.abs(ny);

    // Popsicle rounded nose & tail outline profile
    let profileScaleX = 1.0;
    if (absNy > 0.62) {
      const t = Math.min(1, (absNy - 0.62) / 0.38);
      profileScaleX = Math.sqrt(Math.max(0.02, 1 - t * t * 0.96));
    } else {
      // Subtle waist taper in middle
      profileScaleX = 0.97 + 0.03 * (absNy / 0.62);
    }
    x *= profileScaleX;

    // Upward nose & tail kick bends (`absNy > 0.66`) + subtle transverse concave across `x`
    const nx = x / halfW;
    let kickZ = 0;
    if (absNy > 0.66) {
      const kt = (absNy - 0.66) / 0.34;
      kickZ = kt * kt * 0.038;
    }
    const concaveZ = nx * nx * 0.008;
    z += kickZ + concaveZ;

    pos.setXYZ(i, x, y, z);
    uv.setXY(i, x / widthX + 0.5, y / lengthY + 0.5);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildBarnMezzanineRetroLounge(
  firstFloorGroup: THREE.Group,
  mezzanineFloorY: number
): void {
  const loungeGroup = new THREE.Group();
  loungeGroup.name = 'outbuildings.mezzanine.retroLounge';
  loungeGroup.userData.zone = 'courtyard';
  firstFloorGroup.add(loungeGroup);

  // Issue #7 ("Lighter oak less mahogany more like white oak" + Reference Photo `media_1791202879638_22365d89.jpg`):
  // Hand-Rubbed Satin-Oiled Solid European White Oak Joinery (`roughness: 0.48`, `metalness: 0.03`, `bumpScale: 0.006`)
  const whiteOakTextures = createSolidWhiteOakJoineryTextures();
  const teakMat = new THREE.MeshStandardMaterial({
    color: 0xf7efe4,
    map: whiteOakTextures.colorMap,
    bumpMap: whiteOakTextures.bumpMap,
    bumpScale: 0.006,
    roughness: 0.48,
    metalness: 0.03,
  });
  const darkTeakMat = new THREE.MeshStandardMaterial({
    color: 0xdccab2,
    map: whiteOakTextures.colorMap,
    bumpMap: whiteOakTextures.bumpMap,
    bumpScale: 0.006,
    roughness: 0.52,
    metalness: 0.03,
  });
  const trinitronCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.46,
    metalness: 0.14,
  });
  const trinitronDarkGrilleMat = new THREE.MeshStandardMaterial({
    color: 0x141619,
    roughness: 0.62,
    metalness: 0.18,
  });
  const ps1GreyMat = new THREE.MeshStandardMaterial({
    color: 0xa6aab2,
    roughness: 0.44,
    metalness: 0.08,
  });
  const ps1DarkGreyMat = new THREE.MeshStandardMaterial({
    color: 0x7c8088,
    roughness: 0.48,
    metalness: 0.1,
  });
  const cordBlackMat = new THREE.MeshStandardMaterial({
    color: 0x17191c,
    roughness: 0.55,
    metalness: 0.08,
  });
  const silverBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.22,
    metalness: 0.82,
  });

  // =========================================================================
  // 1. LAYERED VINTAGE RUGS ON THE MEZZANINE OAK FLOOR
  //    - Foreground Geometric Colour-Block Wool Rug (`u = 19.96m, v = 2.34m`)
  //    - Background Crimson & Navy Persian Medallion Rug (`u = 21.34m, v = 1.48m`)
  // =========================================================================
  const blockRugMat = new THREE.MeshStandardMaterial({
    map: createGeometricColourBlockRugTexture(),
    roughness: 0.88,
    metalness: 0.02,
  });
  const blockRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.012, 2.08),
    blockRugMat
  );
  blockRug.name = 'outbuildings.mezzanine.retroBlockRug';
  blockRug.position.set(19.96, mezzanineFloorY + 0.006, 2.34);
  blockRug.receiveShadow = true;
  loungeGroup.add(blockRug);

  const persianRugMat = new THREE.MeshStandardMaterial({
    map: createPersianMedallionRugTexture(),
    roughness: 0.86,
    metalness: 0.02,
  });
  const persianRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.01, 1.96),
    persianRugMat
  );
  persianRug.name = 'outbuildings.mezzanine.persianRug';
  persianRug.position.set(21.62, mezzanineFloorY + 0.005, 1.62);
  persianRug.receiveShadow = true;
  loungeGroup.add(persianRug);

  // =========================================================================
  // 2. MID-CENTURY SCULPTED SOLID WHITE OAK SIDEBOARD CREDENZA (`outbuildings.mezzanine.retroSideboard`)
  //    Backed against the Front Mezzanine Balustrade (`u = 19.16m, v = 2.38m`), facing East (`+u`)
  //    Reference Photo: `media_1791202879638_22365d89.jpg`
  //    - Hollow-fronted rounded-corner Y-Z stadium outer carcass frame (`1.56m` wide x `0.52m` high x `0.44m` deep)
  //      with `R = 0.076m` rounded top/bottom shoulders and chamfered front perimeter moulding
  //    - Dark recessed front shadow reveal cavity + solid oak internal divider stiles & drawer rails
  //    - 2 flush-inset rounded-outer-corner cupboard doors (vertical oak grain) with sculpted vertical timber pulls
  //    - 3 flush-inset central drawers (horizontal oak grain) with sculpted horizontal finger-lip bar pulls
  //    - Sculpted solid-oak underframe apron with 4 splayed tapered legs
  // =========================================================================
  const sideboardGroup = new THREE.Group();
  sideboardGroup.name = 'outbuildings.mezzanine.retroSideboard';
  sideboardGroup.position.set(19.16, mezzanineFloorY, 2.38);
  loungeGroup.add(sideboardGroup);

  const sbDepthU = 0.44;
  const sbTotalW = 1.56;
  const sbHalfW = sbTotalW * 0.5; // 0.78m
  const sbLegH = 0.22;
  const sbBodyH = 0.52;
  const sbHalfH = sbBodyH * 0.5; // 0.26m
  const sbBodyMidY = sbLegH + sbHalfH; // 0.48m
  const sbTopY = sbLegH + sbBodyH; // 0.74m
  const sbOuterCornerR = 0.076;
  const sbWallT = 0.026;
  const sbInnerHalfW = sbHalfW - sbWallT; // 0.754m
  const sbInnerHalfH = sbHalfH - sbWallT; // 0.234m
  const sbInnerCornerR = 0.052;

  const createRoundedRectPath = (
    halfW: number,
    halfH: number,
    rLeftTop: number,
    rLeftBot: number,
    rRightBot: number,
    rRightTop: number,
    isHole: boolean = false
  ): THREE.Shape | THREE.Path => {
    const path = isHole ? new THREE.Path() : new THREE.Shape();
    const segs = 14;
    // Counter-clockwise around (x, y)
    path.moveTo(-halfW + rLeftBot, -halfH);
    path.lineTo(halfW - rRightBot, -halfH);
    for (let s = 1; s <= segs; s++) {
      const a = -Math.PI * 0.5 + (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        halfW - rRightBot + Math.cos(a) * rRightBot,
        -halfH + rRightBot + Math.sin(a) * rRightBot
      );
    }
    path.lineTo(halfW, halfH - rRightTop);
    for (let s = 1; s <= segs; s++) {
      const a = (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        halfW - rRightTop + Math.cos(a) * rRightTop,
        halfH - rRightTop + Math.sin(a) * rRightTop
      );
    }
    path.lineTo(-halfW + rLeftTop, halfH);
    for (let s = 1; s <= segs; s++) {
      const a = Math.PI * 0.5 + (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        -halfW + rLeftTop + Math.cos(a) * rLeftTop,
        halfH - rLeftTop + Math.sin(a) * rLeftTop
      );
    }
    path.lineTo(-halfW, -halfH + rLeftBot);
    for (let s = 1; s <= segs; s++) {
      const a = Math.PI + (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        -halfW + rLeftBot + Math.cos(a) * rLeftBot,
        -halfH + rLeftBot + Math.sin(a) * rLeftBot
      );
    }
    path.closePath();
    return path;
  };

  // 1. Unified Hollow Rounded-Corner Solid Oak Outer Carcass Frame (zero cylinder/box overlap!)
  const carcassShape = createRoundedRectPath(
    sbHalfW,
    sbHalfH,
    sbOuterCornerR,
    sbOuterCornerR,
    sbOuterCornerR,
    sbOuterCornerR,
    false
  ) as THREE.Shape;
  const carcassHole = createRoundedRectPath(
    sbInnerHalfW,
    sbInnerHalfH,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    true
  );
  carcassShape.holes.push(carcassHole);

  const carcassExtrudeDepth = sbDepthU - 0.010;
  const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
    depth: carcassExtrudeDepth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 4,
    curveSegments: 20,
  });
  carcassGeo.translate(0, 0, -carcassExtrudeDepth * 0.5);
  carcassGeo.rotateY(Math.PI / 2);
  // Compute continuous grain UVs: lengthwise along Z on top/bottom slabs, vertical along Y on rounded side walls
  {
    carcassGeo.computeVertexNormals();
    const pos = carcassGeo.attributes.position;
    const norm = carcassGeo.attributes.normal;
    const uv = carcassGeo.attributes.uv;
    if (pos && norm && uv) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ny = Math.abs(norm.getY(i));
        const nz = Math.abs(norm.getZ(i));
        if (nz > ny && Math.abs(z) > sbHalfW - 0.12) {
          // Vertical grain on left/right side panels
          uv.setXY(i, y * 1.35 + 0.2, x * 1.5 + 0.5);
        } else {
          // Lengthwise grain along Z on top slab, bottom rail & front perimeter moulding
          uv.setXY(i, z * 0.85 + 0.5, (x + y) * 1.45 + 0.3);
        }
      }
      uv.needsUpdate = true;
    }
  }
  const sbCarcassMesh = new THREE.Mesh(carcassGeo, teakMat);
  sbCarcassMesh.name = 'outbuildings.mezzanine.retroSideboard.carcass';
  sbCarcassMesh.position.set(0, sbBodyMidY, 0);
  sbCarcassMesh.castShadow = true;
  sbCarcassMesh.receiveShadow = true;
  sideboardGroup.add(sbCarcassMesh);

  // 2. Solid Oak Rear Back Panel (`x = -0.218..+0.190m`) & Dark Shadow Reveal Cavity (`x = +0.194m`)
  const backPanelShape = createRoundedRectPath(
    sbInnerHalfW + 0.004,
    sbInnerHalfH + 0.004,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    false
  ) as THREE.Shape;
  const backPanelGeo = new THREE.ExtrudeGeometry(backPanelShape, {
    depth: sbDepthU - 0.032,
    bevelEnabled: false,
    curveSegments: 16,
  });
  backPanelGeo.translate(0, 0, -(sbDepthU - 0.032) * 0.5);
  backPanelGeo.rotateY(Math.PI / 2);
  applyOakJoineryUVs(backPanelGeo, 'z', 0.85, 1.35);
  const sbBackCoreMesh = new THREE.Mesh(backPanelGeo, darkTeakMat);
  sbBackCoreMesh.position.set(-0.012, sbBodyMidY, 0);
  sbBackCoreMesh.castShadow = true;
  sbBackCoreMesh.receiveShadow = true;
  sideboardGroup.add(sbBackCoreMesh);

  const shadowCavityMat = new THREE.MeshStandardMaterial({
    color: 0x26190f,
    roughness: 0.88,
    metalness: 0.01,
  });
  const shadowCavityGeo = new THREE.ShapeGeometry(backPanelShape, 14);
  shadowCavityGeo.rotateY(Math.PI / 2);
  const shadowCavityMesh = new THREE.Mesh(shadowCavityGeo, shadowCavityMat);
  shadowCavityMesh.position.set(sbDepthU * 0.5 - 0.023, sbBodyMidY, 0);
  sideboardGroup.add(shadowCavityMesh);

  // 3. Internal Vertical Oak Divider Stiles (`z = ±0.236m`) & Horizontal Drawer Rails
  const dividerStileZ = 0.236;
  const dividerStileW = 0.018;
  for (const sideZ of [-1, 1] as const) {
    const stileGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.022, sbInnerHalfH * 2, dividerStileW),
      'y',
      1.35,
      1.6,
      sideZ * 0.17
    );
    const stileMesh = new THREE.Mesh(stileGeo, darkTeakMat);
    stileMesh.position.set(sbDepthU * 0.5 - 0.015, sbBodyMidY, sideZ * dividerStileZ);
    sideboardGroup.add(stileMesh);
  }

  // 4. Flush-Inset Left & Right Cupboard Doors (rounded outer top/bottom corners matching carcass, vertical oak grain)
  //    In `rotateY(Math.PI / 2)`, `shapeX = -z`, so:
  //    - For the Left Door (`z in [-0.749, -0.250]`): `shapeX in [+0.250, +0.749]` (outer rounded corners are on the RIGHT `+shapeX` of the shape!)
  //    - For the Right Door (`z in [+0.250, +0.749]`): `shapeX in [-0.749, -0.250]` (outer rounded corners are on the LEFT `-shapeX` of the shape!)
  const doorSpanZ = sbInnerHalfW - 0.005 - (dividerStileZ + dividerStileW * 0.5 + 0.004); // 0.749 - 0.249 = 0.500m
  const doorCenterAbsZ = (dividerStileZ + dividerStileW * 0.5 + 0.004 + (sbInnerHalfW - 0.005)) * 0.5; // 0.499m
  const doorHalfW = doorSpanZ * 0.5; // 0.250m
  const doorHalfH = sbInnerHalfH - 0.005; // 0.229m
  const doorOuterR = sbInnerCornerR - 0.005; // 0.047m
  const doorInnerR = 0.003;
  const insetFrontX = sbDepthU * 0.5 - 0.020;

  for (const sideZ of [-1, 1] as const) {
    // When sideZ === -1 (Left door at negative Z), in shape space `shapeX = -z > 0`, so the outer cabinet edge is on the RIGHT (`rRightBot, rRightTop`)!
    const isLeftDoor = sideZ < 0;
    const doorShape = createRoundedRectPath(
      doorHalfW,
      doorHalfH,
      isLeftDoor ? doorInnerR : doorOuterR,
      isLeftDoor ? doorInnerR : doorOuterR,
      isLeftDoor ? doorOuterR : doorInnerR,
      isLeftDoor ? doorOuterR : doorInnerR,
      false
    ) as THREE.Shape;
    const doorGeo = new THREE.ExtrudeGeometry(doorShape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.0025,
      bevelSegments: 3,
      curveSegments: 14,
    });
    doorGeo.rotateY(Math.PI / 2);
    applyOakJoineryUVs(doorGeo, 'y', 1.15, 1.25, isLeftDoor ? 0.12 : 0.58, isLeftDoor ? 0.08 : 0.44);

    const doorPanel = new THREE.Mesh(doorGeo, teakMat);
    doorPanel.name = 'outbuildings.mezzanine.retroSideboard.door';
    doorPanel.position.set(insetFrontX, sbBodyMidY, sideZ * doorCenterAbsZ);
    doorPanel.castShadow = true;
    doorPanel.receiveShadow = true;
    sideboardGroup.add(doorPanel);

    // Sculpted vertical mid-century solid-oak finger-pull handle near the inner stile
    const handleZ = sideZ * (dividerStileZ + 0.042);
    const handleShadow = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.118, 0.012),
      shadowCavityMat
    );
    handleShadow.position.set(insetFrontX + 0.018, sbBodyMidY, handleZ - sideZ * 0.005);
    sideboardGroup.add(handleShadow);

    const handleGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.018, 0.122, 0.015),
      'y',
      1.6,
      1.6
    );
    const doorHandle = new THREE.Mesh(handleGeo, darkTeakMat);
    doorHandle.position.set(insetFrontX + 0.023, sbBodyMidY, handleZ);
    doorHandle.castShadow = true;
    sideboardGroup.add(doorHandle);
  }

  // 5. Three Flush-Inset Central Drawers (horizontal oak grain + sculpted finger-lip pulls)
  const drawerBayW = (dividerStileZ - dividerStileW * 0.5 - 0.004) * 2; // 0.446m
  const drawerTotalH = sbInnerHalfH * 2 - 0.010; // 0.458m
  const drawerGapY = 0.005;
  const singleDrawerH = (drawerTotalH - drawerGapY * 2) / 3; // ~0.149m
  const drawerShape = createRoundedRectPath(
    drawerBayW * 0.5,
    singleDrawerH * 0.5,
    0.003,
    0.003,
    0.003,
    0.003,
    false
  ) as THREE.Shape;

  for (let d = 0; d < 3; d++) {
    const dy =
      sbBodyMidY -
      drawerTotalH * 0.5 +
      singleDrawerH * 0.5 +
      d * (singleDrawerH + drawerGapY);
    const drawerGeo = new THREE.ExtrudeGeometry(drawerShape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.0025,
      bevelSegments: 3,
    });
    drawerGeo.rotateY(Math.PI / 2);
    applyOakJoineryUVs(drawerGeo, 'z', 0.95, 1.35, d * 0.31, d * 0.27);

    const drawerFront = new THREE.Mesh(drawerGeo, teakMat);
    drawerFront.name = 'outbuildings.mezzanine.retroSideboard.drawer';
    drawerFront.position.set(insetFrontX, dy, 0);
    drawerFront.castShadow = true;
    drawerFront.receiveShadow = true;
    sideboardGroup.add(drawerFront);

    // Dark finger-recess shadow under the horizontal drawer pull
    const pullShadow = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.009, 0.118),
      shadowCavityMat
    );
    pullShadow.position.set(insetFrontX + 0.019, dy - 0.004, 0);
    sideboardGroup.add(pullShadow);

    const pullGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.020, 0.016, 0.124),
      'z',
      1.2,
      1.6,
      d * 0.2
    );
    const drawerPull = new THREE.Mesh(pullGeo, darkTeakMat);
    drawerPull.position.set(insetFrontX + 0.024, dy + 0.003, 0);
    drawerPull.castShadow = true;
    sideboardGroup.add(drawerPull);
  }

  // 6. Sculpted Mid-Century Solid Oak Underframe Stretcher Apron & 4 Splayed Tapered Legs
  for (const railX of [-0.155, 0.155] as const) {
    const railGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.026, 0.032, sbTotalW - 0.28),
      'z',
      0.85,
      1.5
    );
    const stretcherRail = new THREE.Mesh(railGeo, darkTeakMat);
    stretcherRail.position.set(railX, sbLegH - 0.014, 0);
    stretcherRail.castShadow = true;
    sideboardGroup.add(stretcherRail);
  }
  for (const crossZ of [-0.60, 0, 0.60] as const) {
    const crossGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.31, 0.028, 0.028),
      'x',
      1.2,
      1.5
    );
    const crossRail = new THREE.Mesh(crossGeo, darkTeakMat);
    crossRail.position.set(0, sbLegH - 0.014, crossZ);
    sideboardGroup.add(crossRail);
  }

  for (const lx of [-0.155, 0.155] as const) {
    for (const lz of [-0.61, 0.61] as const) {
      const legGeo = applyOakJoineryUVs(
        new THREE.CylinderGeometry(0.023, 0.013, sbLegH + 0.02, 16),
        'y',
        1.4,
        2.0
      );
      const leg = new THREE.Mesh(legGeo, darkTeakMat);
      leg.position.set(lx, sbLegH * 0.5, lz);
      leg.rotation.z = lx > 0 ? 0.10 : -0.10;
      leg.rotation.x = lz > 0 ? -0.09 : 0.09;
      leg.castShadow = true;
      leg.receiveShadow = true;
      sideboardGroup.add(leg);
    }
  }

  // =========================================================================
  // 3. RETRO 1990s SONY TRINITRON 27" COLOUR CRT TV (`outbuildings.mezzanine.sonyTrinitronTV`)
  //    Playing Disney's The Lion King (1994, Young Simba on the Pride Lands savanna!)
  // =========================================================================
  const tvGroup = new THREE.Group();
  tvGroup.name = 'outbuildings.mezzanine.sonyTrinitronTV';
  tvGroup.position.set(19.20, mezzanineFloorY + sbTopY, 2.38);
  tvGroup.rotation.y = -0.06; // Slightly angled toward the lounge seating
  loungeGroup.add(tvGroup);

  // Swivel base pedestal
  const tvBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.028, 0.52),
    trinitronDarkGrilleMat
  );
  tvBase.position.set(-0.02, 0.014, 0);
  tvGroup.add(tvBase);

  // Main front Trinitron cabinet bezel (`0.64m` wide along Z x `0.52m` high x `0.22m` front box)
  const tvFrontBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.52, 0.64),
    trinitronCharcoalMat
  );
  tvFrontBody.position.set(0.05, 0.288, 0);
  tvFrontBody.castShadow = true;
  tvFrontBody.receiveShadow = true;
  tvGroup.add(tvFrontBody);

  // Tapered rear CRT tube housing with ventilation louvres (`-x` toward the balustrade)
  const tvMidBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.42, 0.50),
    trinitronCharcoalMat
  );
  tvMidBack.position.set(-0.14, 0.28, 0);
  tvMidBack.castShadow = true;
  tvGroup.add(tvMidBack);

  const tvNeckCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.24, 0.26),
    trinitronDarkGrilleMat
  );
  tvNeckCap.position.set(-0.27, 0.27, 0);
  tvGroup.add(tvNeckCap);

  // Moulded top & side ventilation slot ribs on the CRT housing
  for (let vSlot = -0.18; vSlot <= 0.18; vSlot += 0.045) {
    const ventRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.006, 0.018),
      trinitronDarkGrilleMat
    );
    ventRib.position.set(-0.13, 0.492, vSlot);
    tvGroup.add(ventRib);
  }

  // Deep recessed dark bezel framing the 4:3 CRT glass
  const bezelFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.41, 0.52),
    trinitronDarkGrilleMat
  );
  bezelFrame.position.set(0.155, 0.315, 0);
  tvGroup.add(bezelFrame);

  // Illuminated 4:3 Sony Trinitron CRT Screen (`The Lion King` Young Simba scene!)
  const lionKingTex = createLionKingTrinitronScreenTexture();
  const crtScreenMat = new THREE.MeshStandardMaterial({
    map: lionKingTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: lionKingTex,
    emissiveIntensity: 0.72,
    roughness: 0.12,
    metalness: 0.08,
  });
  // Vertically flat, horizontally slightly cylindrical Trinitron aperture-grille curve!
  const screenW = 0.48;
  const screenH = 0.36;
  const screenGeo = new THREE.PlaneGeometry(screenW, screenH, 16, 4);
  const sPos = screenGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const sx = sPos.getX(i);
    // Subtle Trinitron horizontal cylinder bulge outward (`+z` in local PlaneGeometry before rotation)
    const normX = sx / (screenW * 0.5);
    const bulge = (1 - normX * normX) * 0.012;
    sPos.setZ(i, bulge);
  }
  screenGeo.computeVertexNormals();

  const crtScreen = new THREE.Mesh(screenGeo, crtScreenMat);
  crtScreen.name = 'outbuildings.mezzanine.sonyTrinitronTV.screen';
  crtScreen.rotation.y = Math.PI / 2; // Faces `+x` East into the Mezzanine lounge
  crtScreen.position.set(0.167, 0.315, 0);
  tvGroup.add(crtScreen);

  // Lower speaker grille & flip-down control panel door below the screen
  const lowerControlBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.068, 0.62),
    trinitronDarkGrilleMat
  );
  lowerControlBar.position.set(0.158, 0.068, 0);
  tvGroup.add(lowerControlBar);

  // Silver 'SONY' badge centered below the screen
  const sonyBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.014, 0.062),
    silverBadgeMat
  );
  sonyBadge.position.set(0.172, 0.092, 0);
  tvGroup.add(sonyBadge);

  // Glowing green power indicator LED + power button
  const powerLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0045, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x33ff55,
      emissive: 0x22ee44,
      emissiveIntensity: 1.8,
    })
  );
  powerLed.position.set(0.171, 0.065, 0.22);
  tvGroup.add(powerLed);

  // =========================================================================
  // 4. 1990s HI-FI STEREO VHS VCR DECK & VHS CASSETTE CASES (`outbuildings.mezzanine.vcrPlayer`)
  // =========================================================================
  const vcrGroup = new THREE.Group();
  vcrGroup.name = 'outbuildings.mezzanine.vcrPlayer';
  vcrGroup.position.set(19.17, mezzanineFloorY + sbTopY, 1.82);
  loungeGroup.add(vcrGroup);

  const vcrBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.088, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x1a1c20,
      roughness: 0.38,
      metalness: 0.32,
    })
  );
  vcrBody.position.set(0, 0.044, 0);
  vcrBody.castShadow = true;
  vcrGroup.add(vcrBody);

  // VCR front cassette loading slot door & glowing VFD clock display (`+x` face)
  const vcrTapeSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.032, 0.195),
    trinitronDarkGrilleMat
  );
  vcrTapeSlot.position.set(0.148, 0.058, 0.06);
  vcrGroup.add(vcrTapeSlot);

  const vcrDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.022, 0.11),
    new THREE.MeshStandardMaterial({
      color: 0x102820,
      emissive: 0x28d888,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  vcrDisplay.position.set(0.149, 0.056, -0.11);
  vcrGroup.add(vcrDisplay);

  // 2 VHS Cassettes + TV Remote stacked on top of the VCR
  for (let t = 0; t < 2; t++) {
    const vhsTape = new THREE.Mesh(
      new THREE.BoxGeometry(0.104, 0.025, 0.188),
      cordBlackMat
    );
    vhsTape.position.set(0.01, 0.088 + t * 0.026 + 0.0125, 0.04);
    vhsTape.rotation.y = t * 0.12 - 0.04;
    vhsTape.castShadow = true;
    vcrGroup.add(vhsTape);

    const spineLabel = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.018, 0.14),
      new THREE.MeshStandardMaterial({
        color: t === 0 ? 0xf2e8d5 : 0xe04838,
        roughness: 0.6,
      })
    );
    spineLabel.position.set(0.061, 0.088 + t * 0.026 + 0.0125, 0.04);
    vcrGroup.add(spineLabel);
  }

  // Clamshell VHS Case (*The Lion King* 1994 VHS) on the south/left end of the sideboard (`v = 2.94m`)
  const vhsCaseGroup = new THREE.Group();
  vhsCaseGroup.position.set(19.20, mezzanineFloorY + sbTopY, 2.94);
  vhsCaseGroup.rotation.y = 0.28;
  loungeGroup.add(vhsCaseGroup);

  for (let c = 0; c < 2; c++) {
    const clamshell = new THREE.Mesh(
      new THREE.BoxGeometry(0.138, 0.028, 0.225),
      new THREE.MeshStandardMaterial({
        color: c === 0 ? 0xf5f0e6 : 0x264b82,
        roughness: 0.35,
      })
    );
    clamshell.position.set(c * 0.02, c * 0.028 + 0.014, 0);
    clamshell.rotation.y = c * -0.18;
    clamshell.castShadow = true;
    vhsCaseGroup.add(clamshell);
  }

  // =========================================================================
  // 5. ORIGINAL 1995 SONY PLAYSTATION 1 (`PS1` `SCPH-1002`), 2 CONTROLLERS,
  //    TANGLED 3D CABLES & SCATTERED CD JEWEL CASES ON THE RUG
  // =========================================================================
  const ps1Group = new THREE.Group();
  ps1Group.name = 'outbuildings.mezzanine.playstation1';
  ps1Group.position.set(19.64, mezzanineFloorY + 0.012, 2.46);
  ps1Group.rotation.y = 0.24;
  loungeGroup.add(ps1Group);

  // PS1 Console Deck (`0.19m` deep along X x `0.052m` high x `0.27m` wide along Z)
  const ps1Deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.052, 0.27),
    ps1GreyMat
  );
  ps1Deck.name = 'outbuildings.mezzanine.playstation1.console';
  ps1Deck.position.set(0, 0.026, 0);
  ps1Deck.castShadow = true;
  ps1Deck.receiveShadow = true;
  ps1Group.add(ps1Deck);

  // Circular CD-ROM Lid on top center (`r = 0.076m`)
  const ps1CdLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.076, 0.076, 0.008, 28),
    ps1DarkGreyMat
  );
  ps1CdLid.position.set(0, 0.054, 0);
  ps1Group.add(ps1CdLid);

  // PlayStation Diamond Logo badge on CD lid
  const psLogo = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.003, 0.018),
    new THREE.MeshStandardMaterial({ color: 0xe03228, roughness: 0.3 })
  );
  psLogo.position.set(0.048, 0.058, 0);
  psLogo.rotation.y = Math.PI / 4;
  ps1Group.add(psLogo);

  // Circular POWER, RESET & OPEN buttons flanking the CD lid
  for (const [bz, br] of [
    [0.102, 0.018],  // POWER button (left/south)
    [0.072, 0.009],  // RESET button
    [-0.102, 0.018], // OPEN button (right/north)
  ] as const) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(br, br, 0.008, 18),
      ps1DarkGreyMat
    );
    btn.position.set(0.042, 0.054, bz);
    ps1Group.add(btn);
  }

  // Front Controller Plugs & Memory Card in Slot 1 (`+x` front face of PS1)
  for (const portZ of [-0.055, 0.055] as const) {
    const ctrlPlug = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.016, 0.042),
      trinitronDarkGrilleMat
    );
    ctrlPlug.position.set(0.102, 0.022, portZ);
    ps1Group.add(ctrlPlug);
  }
  const memoryCard = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.007, 0.038),
    ps1GreyMat
  );
  memoryCard.position.set(0.10, 0.040, 0.055);
  ps1Group.add(memoryCard);

  // Issue #2 ("These dualshock controllers still look terrible." at `[-2.458, 1.574, 17.054]`, `outbuildings.mezzanine.playstation1.controller.2`):
  // High-LOD Sony PlayStation 1 DualShock Controller (`SCPH-1200`) with:
  // - Slim recessed central bridge (`0.032m x 0.017m x 0.056m`) so the two circular face pods (`r = 0.028m` at `z = ±0.044m`)
  //   and the two lower circular Analog Stick turrets (`r = 0.018m` at `x = +0.018m, z = ±0.022m`) form the unmistakable DualShock figure-8 waist silhouette
  // - Smooth 3D curved ergonomic DualShock hand-grips (`CatmullRomCurve3` + `TubeGeometry` with tapered palm tips)
  // - Dark charcoal action buttons (`#23272e`) with printed PlayStation symbol caps (`△` green, `○` red, `✕` blue, `□` pink)
  // - Concave/domed dark rubber analog thumbsticks inside recessed turret wells, segmented 4-way D-pad wedges,
  //   `SELECT` / `START` / `ANALOG` center buttons, glowing red Analog mode LED, and stacked L1/L2 & R1/R2 shoulder triggers!
  const dualShockStickMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e35,
    roughness: 0.76,
    metalness: 0.06,
  });
  const dualShockWellMat = new THREE.MeshStandardMaterial({
    color: 0x5c6068,
    roughness: 0.58,
    metalness: 0.08,
  });
  const dualShockBtnBodyMat = new THREE.MeshStandardMaterial({
    color: 0x23272e,
    roughness: 0.32,
    metalness: 0.12,
  });
  const analogLedMat = new THREE.MeshStandardMaterial({
    color: 0xff2211,
    emissive: new THREE.Color(0xff1808),
    emissiveIntensity: 1.8,
    roughness: 0.22,
  });
  const psBtnCapMaterials: Record<PlayStationButtonSymbol, THREE.MeshStandardMaterial> = {
    triangle: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('triangle'),
      roughness: 0.26,
      metalness: 0.08,
    }),
    circle: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('circle'),
      roughness: 0.26,
      metalness: 0.08,
    }),
    cross: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('cross'),
      roughness: 0.26,
      metalness: 0.08,
    }),
    square: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('square'),
      roughness: 0.26,
      metalness: 0.08,
    }),
  };

  const addPs1Controller = (
    cx: number,
    cz: number,
    rotY: number,
    idx: number
  ): void => {
    const ctrlGroup = new THREE.Group();
    ctrlGroup.name = `outbuildings.mezzanine.playstation1.controller.${idx}`;
    ctrlGroup.position.set(cx, mezzanineFloorY + 0.012, cz);
    ctrlGroup.rotation.y = rotY;
    loungeGroup.add(ctrlGroup);

    // 1. Slim recessed central bridge (`0.032m` deep along X x `0.017m` high x `0.056m` wide along Z)
    //    Keeps the front and rear waist indented so the 2 main circular pods and 2 analog turrets stand out clearly!
    const mainBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.017, 0.056),
      ps1GreyMat
    );
    mainBridge.position.set(-0.004, 0.0105, 0);
    mainBridge.castShadow = true;
    mainBridge.receiveShadow = true;
    ctrlGroup.add(mainBridge);

    // Front cord strain-relief boot on the leading edge of the bridge (`x = -0.023m, z = 0`)
    const cordRelief = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.0052, 0.012, 10),
      cordBlackMat
    );
    cordRelief.rotation.z = Math.PI / 2;
    cordRelief.position.set(-0.024, 0.010, 0);
    ctrlGroup.add(cordRelief);

    // 2. Left D-Pad Pod (`sideZ = +1`) & Right Action-Button Pod (`sideZ = -1`), Analog Turrets, Shoulder Triggers & Curved Hand-Grips
    for (const sideZ of [-1, 1] as const) {
      // Main circular face pod (`rTop = 0.0265m, rBot = 0.0285m, h = 0.021m`)
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0265, 0.0285, 0.021, 28),
        ps1GreyMat
      );
      pod.position.set(-0.005, 0.0115, sideZ * 0.044);
      pod.castShadow = true;
      pod.receiveShadow = true;
      ctrlGroup.add(pod);

      // Subtle bevelled top rim on each circular pod
      const podTopBevel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0245, 0.0265, 0.0025, 28),
        ps1GreyMat
      );
      podTopBevel.position.set(-0.005, 0.0228, sideZ * 0.044);
      ctrlGroup.add(podTopBevel);

      // Sculpted L1/L2 & R1/R2 front shoulder cowl & stacked dark-charcoal triggers
      const shoulderBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.014, 0.018, 16),
        ps1GreyMat
      );
      shoulderBoss.scale.set(1.0, 1.0, 1.35);
      shoulderBoss.position.set(-0.027, 0.011, sideZ * 0.044);
      ctrlGroup.add(shoulderBoss);

      // Top L1/R1 trigger + lower L2/R2 trigger
      for (const [ty, tx, th] of [
        [0.0145, -0.036, 0.0055],
        [0.0075, -0.037, 0.0065],
      ] as const) {
        const triggerBtn = new THREE.Mesh(
          new THREE.BoxGeometry(0.007, th, 0.021),
          dualShockBtnBodyMat
        );
        triggerBtn.position.set(tx, ty, sideZ * 0.044);
        ctrlGroup.add(triggerBtn);
      }

      // Lower Circular Analog Stick Turret Pod (`x = +0.018m, z = sideZ * 0.022m`)
      const stickTurret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0165, 0.0185, 0.019, 24),
        ps1GreyMat
      );
      stickTurret.position.set(0.018, 0.0105, sideZ * 0.022);
      stickTurret.castShadow = true;
      stickTurret.receiveShadow = true;
      ctrlGroup.add(stickTurret);

      // Recessed dark circular socket well on top of the analog turret
      const stickWell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0125, 0.0115, 0.0025, 20),
        dualShockWellMat
      );
      stickWell.position.set(0.018, 0.0202, sideZ * 0.022);
      ctrlGroup.add(stickWell);

      // Pivoting inner ball-dome base + slender thumbstick shaft + domed rubber mushroom cap
      const stickPivotDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.0085, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        dualShockStickMat
      );
      stickPivotDome.position.set(0.018, 0.019, sideZ * 0.022);
      ctrlGroup.add(stickPivotDome);

      const stickShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0036, 0.0085, 12),
        dualShockStickMat
      );
      stickShaft.position.set(0.018, 0.0255, sideZ * 0.022);
      ctrlGroup.add(stickShaft);

      const stickCapSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0108, 0.0082, 0.0038, 22),
        dualShockStickMat
      );
      stickCapSkirt.position.set(0.018, 0.0305, sideZ * 0.022);
      stickCapSkirt.castShadow = true;
      ctrlGroup.add(stickCapSkirt);

      const stickDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.0106, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        dualShockStickMat
      );
      stickDome.scale.set(1, 0.36, 1);
      stickDome.position.set(0.018, 0.0318, sideZ * 0.022);
      ctrlGroup.add(stickDome);

      // Sculpted Curved Ergonomic DualShock Hand-Grip Horn (`CatmullRomCurve3` + `TubeGeometry` + rounded palm dome)
      const gripCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.002, 0.011, sideZ * 0.045),
        new THREE.Vector3(0.018, 0.0105, sideZ * 0.055),
        new THREE.Vector3(0.038, 0.0095, sideZ * 0.062),
        new THREE.Vector3(0.056, 0.0085, sideZ * 0.064),
      ]);
      const gripTubeGeo = new THREE.TubeGeometry(gripCurve, 18, 0.0155, 16, false);
      // Taper the grip slightly from the pod shoulder down to the rounded palm tip
      const gPos = gripTubeGeo.attributes.position;
      for (let vi = 0; vi < gPos.count; vi++) {
        const vx = gPos.getX(vi);
        const vy = gPos.getY(vi);
        // Flatten vertical profile slightly for authentic oval DualShock grip cross-section
        const cy = 0.0098;
        gPos.setY(vi, cy + (vy - cy) * 0.72);
        if (vx > 0.035) {
          const taper = 1 - ((vx - 0.035) / 0.025) * 0.14;
          gPos.setZ(vi, sideZ * 0.063 + (gPos.getZ(vi) - sideZ * 0.063) * taper);
        }
      }
      gripTubeGeo.computeVertexNormals();

      const gripHorn = new THREE.Mesh(gripTubeGeo, ps1GreyMat);
      gripHorn.castShadow = true;
      gripHorn.receiveShadow = true;
      ctrlGroup.add(gripHorn);

      const gripTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.0138, 16, 12),
        ps1GreyMat
      );
      gripTip.scale.set(1.12, 0.72, 0.96);
      gripTip.position.set(0.056, 0.0085, sideZ * 0.064);
      gripTip.castShadow = true;
      ctrlGroup.add(gripTip);
    }

    // 3. Left Pod (`z = +0.044m`): Recessed Cross Cavity & 4-Way Segmented Sony D-Pad Wedges
    const dpadRecess = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0155, 0.0155, 0.0012, 24),
      ps1DarkGreyMat
    );
    dpadRecess.position.set(-0.005, 0.0238, 0.044);
    ctrlGroup.add(dpadRecess);

    for (const [dx, dz, rotAngle] of [
      [-0.0095, 0, 0],           // Up
      [0.0095, 0, Math.PI],      // Down
      [0, 0.0095, -Math.PI / 2], // Left
      [0, -0.0095, Math.PI / 2], // Right
    ] as const) {
      const dKeyGroup = new THREE.Group();
      dKeyGroup.position.set(-0.005 + dx, 0.0252, 0.044 + dz);
      dKeyGroup.rotation.y = rotAngle;
      ctrlGroup.add(dKeyGroup);

      const dOuter = new THREE.Mesh(
        new THREE.BoxGeometry(0.0078, 0.0032, 0.0068),
        dualShockBtnBodyMat
      );
      dKeyGroup.add(dOuter);

      const dInnerTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.0046, 0.0045, 4),
        dualShockBtnBodyMat
      );
      dInnerTip.rotation.z = -Math.PI / 2;
      dInnerTip.rotation.x = Math.PI / 4;
      dInnerTip.position.set(0.0048, 0, 0);
      dKeyGroup.add(dInnerTip);
    }

    // 4. Right Pod (`z = -0.044m`): 4 Dark-Charcoal Action Buttons with Printed `△ ○ ✕ □` Caps
    const actionBtnSpecs: ReadonlyArray< readonly [number, number, PlayStationButtonSymbol] > = [
      [-0.0175, -0.044, 'triangle'], // Top: Green Triangle
      [-0.005, -0.0565, 'circle'],   // Right: Red Circle
      [0.0075, -0.044, 'cross'],     // Bottom: Blue Cross
      [-0.005, -0.0315, 'square'],   // Left: Pink Square
    ];
    for (const [bx, bz, sym] of actionBtnSpecs) {
      const btnBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0048, 0.0050, 0.0036, 18),
        dualShockBtnBodyMat
      );
      btnBase.position.set(bx, 0.025, bz);
      ctrlGroup.add(btnBase);

      const btnCap = new THREE.Mesh(
        new THREE.CircleGeometry(0.0046, 18),
        psBtnCapMaterials[sym]
      );
      btnCap.rotation.x = -Math.PI / 2;
      // Rotate texture so symbol faces upright toward the player (`+x`)
      btnCap.rotation.z = -Math.PI / 2;
      btnCap.position.set(bx, 0.0269, bz);
      ctrlGroup.add(btnCap);
    }

    // 5. Center Bridge Buttons (`SELECT`, `START`, `ANALOG`) & Glowing Red Analog Mode Indicator LED
    const selectBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.0045, 0.0026, 0.0085),
      dualShockBtnBodyMat
    );
    selectBtn.position.set(-0.005, 0.0198, 0.011);
    ctrlGroup.add(selectBtn);

    const startBtn = new THREE.Mesh(
      new THREE.ConeGeometry(0.0042, 0.0088, 3),
      dualShockBtnBodyMat
    );
    startBtn.rotation.x = -Math.PI / 2;
    startBtn.position.set(-0.005, 0.0198, -0.011);
    ctrlGroup.add(startBtn);

    const analogBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.0042, 0.0022, 0.0072),
      dualShockBtnBodyMat
    );
    analogBtn.position.set(0.0045, 0.0195, 0);
    ctrlGroup.add(analogBtn);

    const analogLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.0028, 0.0020, 0.0048),
      analogLedMat
    );
    analogLed.position.set(0.0105, 0.0195, 0);
    ctrlGroup.add(analogLed);

    // Subtle SONY & PlayStation logo recess bar at top of center bridge
    const sonyLogoStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.0008, 0.018),
      ps1DarkGreyMat
    );
    sonyLogoStrip.position.set(-0.014, 0.0192, 0);
    ctrlGroup.add(sonyLogoStrip);
  };

  addPs1Controller(19.95, 2.12, -0.52, 1);
  addPs1Controller(19.84, 2.76, 0.38, 2);

  // Looping 3D Black Controller Cables & TV AV Cords (`TubeGeometry`)
  const cablePaths: ReadonlyArray<ReadonlyArray< readonly [number, number, number] >> = [
    // Controller 1 cord looping on rug
    [
      [19.72, mezzanineFloorY + 0.028, 2.41],
      [19.86, mezzanineFloorY + 0.015, 2.35],
      [19.78, mezzanineFloorY + 0.015, 2.18],
      [19.98, mezzanineFloorY + 0.015, 2.25],
      [19.93, mezzanineFloorY + 0.020, 2.13],
    ],
    // Controller 2 cord looping on rug
    [
      [19.74, mezzanineFloorY + 0.028, 2.51],
      [19.88, mezzanineFloorY + 0.015, 2.56],
      [19.76, mezzanineFloorY + 0.015, 2.68],
      [19.83, mezzanineFloorY + 0.020, 2.75],
    ],
    // AV & power cord from PS1 up to the Sony Trinitron TV
    [
      [19.55, mezzanineFloorY + 0.026, 2.46],
      [19.38, mezzanineFloorY + 0.014, 2.44],
      [19.24, mezzanineFloorY + 0.014, 2.38],
      [19.16, mezzanineFloorY + 0.38, 2.36],
      [19.04, mezzanineFloorY + 0.78, 2.38],
    ],
  ];

  for (const pts of cablePaths) {
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    const cableMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.0042, 8, false),
      cordBlackMat
    );
    cableMesh.castShadow = true;
    loungeGroup.add(cableMesh);
  }

  // Scattered PS1 CD Jewel Cases (including open double-disc case showing silver/black CD-ROMs!) & VHS boxes on the rug
  const openCaseGroup = new THREE.Group();
  openCaseGroup.position.set(19.76, mezzanineFloorY + 0.013, 2.72);
  openCaseGroup.rotation.y = 0.42;
  loungeGroup.add(openCaseGroup);

  for (const trayX of [-0.068, 0.068] as const) {
    const jewelTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.128, 0.006, 0.142),
      new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.25 })
    );
    jewelTray.position.set(trayX, 0.003, 0);
    openCaseGroup.add(jewelTray);

    const cdDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, 0.002, 24),
      new THREE.MeshStandardMaterial({
        color: trayX < 0 ? 0xd8e2ec : 0xc87a42,
        roughness: 0.12,
        metalness: 0.88,
      })
    );
    cdDisc.position.set(trayX, 0.007, 0);
    openCaseGroup.add(cdDisc);
  }

  // Issue #4 ("Some dithering on this book" at `[-2.831, 1.574, 17.094]` -> `(u = 19.48m, v = 2.78m)`):
  // Stacked `[19.48, 2.78]` and `[19.50, 2.80]` at distinct Y heights (`+0.024m` and `+0.047m`) so their faces never coplanar z-fight!
  const floorCases: ReadonlyArray< readonly [number, number, number, number, number] > = [
    [19.48, 0.024, 2.78, 0.32, 0x24344d],
    [19.50, 0.047, 2.80, 0.18, 0x8c2d24],
    [19.96, 0.024, 1.88, -0.25, 0x2e543c],
    [20.14, 0.024, 2.68, 0.55, 0xd8cfc0],
  ];
  for (const [fx, fyOff, fz, frot, fcol] of floorCases) {
    const gameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.022, 0.19),
      new THREE.MeshStandardMaterial({ color: fcol, roughness: 0.38 })
    );
    gameBox.position.set(fx, mezzanineFloorY + fyOff, fz);
    gameBox.rotation.y = frot;
    gameBox.castShadow = true;
    loungeGroup.add(gameBox);
  }

  // =========================================================================
  // 6. SCULPTED 1990s CORDUROY BEANBAG CHAIRS, TAPESTRY BEANBAG, KILIM POUFFE
  //    & LOW WOODEN COFFEE TABLE WITH OPEN MONOPOLY BOARD GAME, SODA CANS & SNACKS
  // =========================================================================
  const loungeSeatingGroup = new THREE.Group();
  loungeSeatingGroup.name = 'outbuildings.mezzanine.beanbagLounge';
  loungeGroup.add(loungeSeatingGroup);

  // Issue #1 ("This has gone way too childish, look at the original concept art. It needs to be cosy and warm just not 1970s.
  // Traditional style rug. Still wooden book case. Not bright purples and blacks like a CBBC studio."):
  // Matches `media_1791202879638_22365d89.jpg` with warm, cosy heritage navy corduroy, woven oatmeal/terracotta/navy tapestry,
  // deep slate-indigo corduroy in the back corner, and a round woven terracotta/cream pouffe!
  // Issue #5 ("Terracotta cordoroy beanbag" at `[-2.701, 2.121, 18.522]`, `outbuildings.mezzanine.beanbag.navyFront`):
  // Rich warm Terracotta Jumbo Corduroy Material (`#b8563a` wales with `#8e3d26` shadow valleys)
  const terracottaCorduroyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createCorduroyFabricTexture('#b8563a', '#8e3d26'),
    roughness: 0.86,
    metalness: 0.02,
  });
  // Issue #6 ("sheepskin beanbag" at `[-2.208, 2.109, 15.359]`, `outbuildings.mezzanine.beanbag.navyBack`):
  // Plush curly warm-ivory New Zealand Sheepskin Fleece Material
  const sheepskinTextures = createSheepskinFleeceTextures();
  const sheepskinBeanbagMat = new THREE.MeshStandardMaterial({
    color: 0xf8f3e6,
    map: sheepskinTextures.colorMap,
    bumpMap: sheepskinTextures.bumpMap,
    bumpScale: 0.018,
    roughness: 0.92,
    metalness: 0.01,
  });
  const tapestryBeanbagMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createTapestryBeanbagTexture(),
    roughness: 0.86,
    metalness: 0.02,
  });
  const knittedPouffeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createKnittedPouffeTexture(),
    roughness: 0.88,
    metalness: 0.02,
  });

  const beanbagGeoLarge = createSculptedBeanbagGeometry(0.54, 0.68, 0.58);
  const beanbagGeoMed = createSculptedBeanbagGeometry(0.48, 0.62, 0.52);

  // 1. Foreground South-West Terracotta Jumbo Corduroy Beanbag Chair (`u = 19.72m, v = 3.96m` — Issue #5!)
  const navyBeanbagFront = new THREE.Mesh(beanbagGeoLarge, terracottaCorduroyMat);
  navyBeanbagFront.name = 'outbuildings.mezzanine.beanbag.navyFront';
  navyBeanbagFront.position.set(19.72, mezzanineFloorY, 3.96);
  navyBeanbagFront.rotation.y = -2.28;
  navyBeanbagFront.castShadow = true;
  navyBeanbagFront.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagFront);

  // 2. East Lounge Woven Tapestry Beanbag Chair (`u = 22.42m, v = 1.42m`, facing the coffee table & TV)
  const tapestryBeanbag = new THREE.Mesh(beanbagGeoMed, tapestryBeanbagMat);
  tapestryBeanbag.name = 'outbuildings.mezzanine.beanbag.tapestry';
  tapestryBeanbag.position.set(22.42, mezzanineFloorY, 1.42);
  tapestryBeanbag.rotation.y = -1.35;
  tapestryBeanbag.castShadow = true;
  tapestryBeanbag.receiveShadow = true;
  loungeSeatingGroup.add(tapestryBeanbag);

  // 3. North-West Lounge Plush Curly Cream Sheepskin Beanbag Chair (`u = 20.52m, v = 1.08m` — Issue #6!)
  const navyBeanbagBack = new THREE.Mesh(beanbagGeoMed, sheepskinBeanbagMat);
  navyBeanbagBack.name = 'outbuildings.mezzanine.beanbag.navyBack';
  navyBeanbagBack.position.set(20.52, mezzanineFloorY, 1.08);
  navyBeanbagBack.rotation.y = 0.52;
  navyBeanbagBack.castShadow = true;
  navyBeanbagBack.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagBack);

  // 4. Round Woven Terracotta & Cream Pouffe Cushion (`outbuildings.mezzanine.pouffe` at `u = 20.68m, v = 2.24m`, matching `media_1791202879638_22365d89.jpg`)
  const pouffeGeo = new THREE.SphereGeometry(0.30, 28, 20);
  pouffeGeo.scale(1.0, 0.56, 1.0);
  const pouffeMesh = new THREE.Mesh(pouffeGeo, knittedPouffeMat);
  pouffeMesh.name = 'outbuildings.mezzanine.pouffe';
  pouffeMesh.position.set(20.68, mezzanineFloorY + 0.16, 2.24);
  pouffeMesh.castShadow = true;
  pouffeMesh.receiveShadow = true;
  loungeSeatingGroup.add(pouffeMesh);

  // 5. Low Warm-Timber Lounge Coffee Table (`u = 21.55m, v = 1.62m`, matching `media_1791202879638_22365d89.jpg`)
  const coffeeTableGroup = new THREE.Group();
  coffeeTableGroup.name = 'outbuildings.mezzanine.coffeeTable';
  coffeeTableGroup.position.set(21.55, mezzanineFloorY, 1.62);
  coffeeTableGroup.rotation.y = 0.06;
  loungeSeatingGroup.add(coffeeTableGroup);

  const ctW = 0.62;
  const ctL = 0.96;
  const ctH = 0.38;
  const ctTop = new THREE.Mesh(
    applyOakJoineryUVs(new THREE.BoxGeometry(ctW, 0.028, ctL), 'z', 0.95, 1.35),
    teakMat
  );
  ctTop.position.set(0, ctH - 0.014, 0);
  ctTop.castShadow = true;
  ctTop.receiveShadow = true;
  coffeeTableGroup.add(ctTop);

  for (const lx of [-0.24, 0.24] as const) {
    for (const lz of [-0.40, 0.40] as const) {
      const ctLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.013, ctH - 0.02, 16),
        darkTeakMat
      );
      ctLeg.position.set(lx, (ctH - 0.02) * 0.5, lz);
      ctLeg.castShadow = true;
      coffeeTableGroup.add(ctLeg);
    }
  }

  // Open Monopoly Board on center of coffee table
  const monopolyBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.006, 0.48),
    new THREE.MeshStandardMaterial({
      map: createMonopolyBoardTexture(),
      roughness: 0.36,
      metalness: 0.04,
    })
  );
  monopolyBoard.name = 'outbuildings.mezzanine.monopolyBoard';
  monopolyBoard.position.set(0, ctH + 0.003, 0.02);
  monopolyBoard.rotation.y = 0.14;
  coffeeTableGroup.add(monopolyBoard);

  // Miniature green Monopoly houses, red hotels & 2 white dice on the board
  const houseGreenMat = new THREE.MeshStandardMaterial({ color: 0x1e8238, roughness: 0.35 });
  const hotelRedMat = new THREE.MeshStandardMaterial({ color: 0xc92626, roughness: 0.35 });
  for (const [hx, hz, isHotel] of [
    [-0.16, 0.14, false],
    [-0.12, 0.15, false],
    [0.15, -0.11, true],
    [0.14, 0.16, false],
    [-0.15, -0.12, true],
  ] as const) {
    const token = new THREE.Mesh(
      new THREE.BoxGeometry(isHotel ? 0.016 : 0.012, isHotel ? 0.014 : 0.010, isHotel ? 0.014 : 0.012),
      isHotel ? hotelRedMat : houseGreenMat
    );
    token.position.set(hx, ctH + 0.011, hz);
    coffeeTableGroup.add(token);
  }
  for (const [dx, dz] of [
    [-0.02, 0.03],
    [0.015, 0.045],
  ] as const) {
    const die = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.012, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.25 })
    );
    die.position.set(dx, ctH + 0.012, dz);
    die.rotation.y = 0.4;
    coffeeTableGroup.add(die);
  }

  // 1990s Soda Cans (Red Coca-Cola Can, Green 7UP Can, Yellow Crisps Can) + Red Snack Bowl + Stacked Game Boxes
  for (const [cx, cz, cCol, cH] of [
    [0.21, -0.22, 0xd62424, 0.115], // Red Coca-Cola can
    [-0.22, -0.20, 0x1e8a44, 0.115], // Green 7UP / Sprite can
    [0.20, 0.32, 0xe8b923, 0.155],  // Yellow crisps canister
  ] as const) {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, cH, 18),
      new THREE.MeshStandardMaterial({ color: cCol, roughness: 0.25, metalness: 0.45 })
    );
    can.position.set(cx, ctH + cH * 0.5, cz);
    can.castShadow = true;
    coffeeTableGroup.add(can);

    const canLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.030, 0.004, 18),
      silverBadgeMat
    );
    canLid.position.set(cx, ctH + cH + 0.002, cz);
    coffeeTableGroup.add(canLid);
  }

  // Red ceramic snack bowl & white bowl
  for (const [bx, bz, bCol] of [
    [-0.20, -0.34, 0xc82828],
    [-0.18, 0.34, 0xf2eee6],
  ] as const) {
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.044, 0.048, 20),
      new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.3 })
    );
    bowl.position.set(bx, ctH + 0.024, bz);
    bowl.castShadow = true;
    coffeeTableGroup.add(bowl);
  }

  // Issue #4 ("Remove this book from table" at `[-0.774, 2.025, 15.338]`, `outbuildings.mezzanine.coffeeTable`):
  // Removed the stacked book/box meshes from the edge of the coffee table.

  // =========================================================================
  // 7. 4 COLOURFUL 1990s GRAPHIC SKATEBOARD DECKS ON THE SOUTH WALL (`v = 5.405m`)
  //    Mounted vertically side-by-side right behind the left mezzanine balustrade!
  // =========================================================================
  const skateboardsGroup = new THREE.Group();
  skateboardsGroup.name = 'outbuildings.mezzanine.wallSkateboards';
  loungeGroup.add(skateboardsGroup);

  const deckGeo = createSkateboardDeckGeometry();
  const deckSpecs: ReadonlyArray< readonly [number, SkateboardGraphicStyle] > = [
    [19.04, 'redFlame'],
    [19.30, 'pinkCartoon'],
    [19.56, 'cyanSun'],
    [19.82, 'yellowFrog'],
  ];

  for (const [du, style] of deckSpecs) {
    const deckMat = new THREE.MeshStandardMaterial({
      map: createSkateboardDeckTexture(style),
      roughness: 0.32,
      metalness: 0.06,
    });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.name = `outbuildings.mezzanine.skateboard.${style}`;
    // South wall is at `v = 5.43m`, facing North (`-z`) into the Mezzanine
    deckMesh.rotation.y = Math.PI;
    deckMesh.position.set(du, mezzanineFloorY + 0.80, 5.402);
    deckMesh.castShadow = true;
    skateboardsGroup.add(deckMesh);
  }

  // =========================================================================
  // 8. FRAMED 1990s BRITPOP & CULT CINEMA POSTERS ON THE WALLS
  //    - `blur` on East wall (`u = 23.005m, v = 2.04m`, facing West `-x`)
  //    - `oasis`, `spiceGirls`, `pulpFiction`, `trainspotting`, `bigLebowski` on North wall (`v = 0.295m`, facing South `+z`)
  //    - `jurassicPark` & `bigLebowski` on South wall (`v = 5.41m`, facing North `-z`)
  // =========================================================================
  const postersGroup = new THREE.Group();
  postersGroup.name = 'outbuildings.mezzanine.retroPosters';
  loungeGroup.add(postersGroup);

  const frameBlackMat = new THREE.MeshStandardMaterial({
    color: 0x18191c,
    roughness: 0.38,
    metalness: 0.12,
  });

  const addFramedPoster = (
    u: number,
    y: number,
    v: number,
    width: number,
    height: number,
    rotY: number,
    style: RetroPosterStyle
  ): void => {
    const pGroup = new THREE.Group();
    pGroup.name = `outbuildings.mezzanine.poster.${style}`;
    pGroup.position.set(u, y, v);
    pGroup.rotation.y = rotY;
    postersGroup.add(pGroup);

    const frameBacking = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.036, height + 0.036, 0.018),
      frameBlackMat
    );
    frameBacking.castShadow = true;
    pGroup.add(frameBacking);

    const posterPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({
        map: createRetro90sPosterTexture(style),
        roughness: 0.24,
        metalness: 0.04,
      })
    );
    posterPlane.position.set(0, 0, 0.010);
    pGroup.add(posterPlane);
  };

  // Issue #7 ("CEnter the blur picture here" at `[0.596, 3.116, 15.55]` -> `u = 23.005m, v = 1.46m`):
  // Centered the framed orange `blur` poster on the North pier of the East Barn/Stable partition wall (`v = 0.28..2.40m`)!
  addFramedPoster(23.005, mezzanineFloorY + 1.02, 1.46, 0.54, 0.70, -Math.PI / 2, 'blur');

  // Issue #4 & Issue #5 ("Put one of hte pictures over here" at `[0.831, 2.585, 18.287]` -> `u = 23.005m, v = 4.28m`):
  // Moved `bigLebowski` off the South wall and centered it on the South pier of the East Barn/Stable partition wall (`v = 3.30..5.43m`),
  // leaving `jurassicPark` centered cleanly on the South wall (`u = 20.48m, v = 5.412m`) beside the 4 skateboards!
  addFramedPoster(20.48, mezzanineFloorY + 0.84, 5.412, 0.40, 0.52, Math.PI, 'jurassicPark');
  addFramedPoster(23.005, mezzanineFloorY + 0.96, 4.28, 0.44, 0.58, -Math.PI / 2, 'bigLebowski');

  // North wall (`v = 0.295m`, facing South `+z` into the Mezzanine, flanking the hayloft window `u = 19.46..20.24m`
  // and clear of the North-wall bookcase at `u = 21.36..22.40m`!):
  addFramedPoster(19.08, mezzanineFloorY + 0.98, 0.295, 0.40, 0.52, 0, 'oasis');
  addFramedPoster(19.08, mezzanineFloorY + 0.38, 0.295, 0.40, 0.52, 0, 'pulpFiction');
  addFramedPoster(20.76, mezzanineFloorY + 0.98, 0.295, 0.42, 0.54, 0, 'spiceGirls');
  addFramedPoster(20.76, mezzanineFloorY + 0.38, 0.295, 0.42, 0.54, 0, 'trainspotting');

  // =========================================================================
  // 9. 5-SHELF WOODEN RETRO BOOKCASE, BOARD GAMES, VHS/CD COLLECTION, LAVA LAMP
  //    & WARM TABLE LAMP (`outbuildings.mezzanine.bookcase`)
  //    - Issue #1 ("Still wooden book case. Not bright purples and blacks like a CBBC studio."):
  //      Restored the warm natural timber bookcase (`teakMat` / `darkTeakMat`) with warm golden 2700K under-shelf task lighting!
  // =========================================================================
  const bookcaseGroup = new THREE.Group();
  bookcaseGroup.name = 'outbuildings.mezzanine.bookcase';
  bookcaseGroup.position.set(21.88, mezzanineFloorY, 0.435);
  bookcaseGroup.rotation.y = Math.PI / 2;
  loungeGroup.add(bookcaseGroup);

  const bcDepthU = 0.30;
  const bcWidthV = 1.04;
  const bcHeightY = 1.30;
  const shelfT = 0.024;

  // Bookcase wooden side uprights & back panel
  for (const sideZ of [-1, 1] as const) {
    const upright = new THREE.Mesh(
      applyOakJoineryUVs(new THREE.BoxGeometry(bcDepthU, bcHeightY, shelfT), 'y', 0.9, 1.4, sideZ * 0.25),
      teakMat
    );
    upright.position.set(0, bcHeightY * 0.5, sideZ * (bcWidthV * 0.5 - shelfT * 0.5));
    upright.castShadow = true;
    upright.receiveShadow = true;
    bookcaseGroup.add(upright);
  }
  const bcBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, bcHeightY, bcWidthV),
    darkTeakMat
  );
  bcBack.position.set(bcDepthU * 0.5 - 0.007, bcHeightY * 0.5, 0);
  bookcaseGroup.add(bcBack);

  const shelfHeights = [0.06, 0.31, 0.54, 0.85, 1.08, 1.29];
  for (const sy of shelfHeights) {
    const shelf = new THREE.Mesh(
      applyOakJoineryUVs(new THREE.BoxGeometry(bcDepthU, shelfT, bcWidthV - shelfT * 2), 'z', 0.9, 1.4, sy * 0.4),
      teakMat
    );
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    bookcaseGroup.add(shelf);
  }

  // Warm 2700K golden under-shelf task lighting strips
  const underShelfLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: 0xffc870,
    emissiveIntensity: 1.35,
    roughness: 0.24,
  });
  for (const ledShelfY of [0.54, 0.85, 1.08, 1.29] as const) {
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.008, bcWidthV - shelfT * 2 - 0.06),
      underShelfLedMat
    );
    ledStrip.name = 'outbuildings.mezzanine.bookcase.taskLight';
    ledStrip.position.set(-bcDepthU * 0.5 + 0.04, ledShelfY - shelfT * 0.5 - 0.004, 0);
    bookcaseGroup.add(ledStrip);
  }

  // Stock shelves with classic 1990s board games, books, VHS/CD spines, and stereo boombox
  const itemColors = [0x8c2d24, 0x233852, 0x2e543c, 0xc9963e, 0xdcd2c0, 0x5c3c28, 0x3a4e63];
  // Bottom shelf (`y = 0.072m`): stacks of 90s board games
  for (let stack = 0; stack < 3; stack++) {
    const sz = -0.32 + stack * 0.32;
    for (let layer = 0; layer < 3; layer++) {
      const gameBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.044, 0.27),
        new THREE.MeshStandardMaterial({
          color: itemColors[(stack * 3 + layer) % itemColors.length],
          roughness: 0.48,
        })
      );
      gameBox.position.set(-0.02, 0.095 + layer * 0.046, sz);
      bookcaseGroup.add(gameBox);
    }
  }

  // Second & third shelves (`y = 0.322m` & `0.552m`): vertical rows of VHS tapes, books & CDs
  for (const [shelfBaseY, itemH, count, isLavaShelf] of [
    [0.322, 0.19, 18, false],
    [0.552, 0.14, 14, true],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const iz = -0.44 + i * 0.036;
      if (isLavaShelf && iz > 0.16) continue;
      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, itemH - (i % 3) * 0.012, 0.028),
        new THREE.MeshStandardMaterial({
          color: itemColors[(i * 5) % itemColors.length],
          roughness: 0.52,
        })
      );
      spine.position.set(-0.02, shelfBaseY + itemH * 0.5, iz);
      bookcaseGroup.add(spine);
    }
  }

  // Fourth shelf (`y = 0.862m`): 1990s Stereo Boombox in center (`z = 0`)
  const boombox = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.13, 0.32),
    trinitronCharcoalMat
  );
  boombox.position.set(-0.02, 0.862 + 0.065, 0);
  bookcaseGroup.add(boombox);

  // Helper to build a glowing 1990s Iconic Double-Cone Lava Lamp (`Mathmos Astro`)
  const addRetroLavaLamp = (
    ux: number,
    uy: number,
    uz: number,
    waxColorHex: number,
    baseColorHex: number,
    name: string,
    scale: number = 1.0
  ): void => {
    const lampGroup = new THREE.Group();
    lampGroup.name = name;
    lampGroup.position.set(ux, uy, uz);
    lampGroup.scale.setScalar(scale);
    loungeGroup.add(lampGroup);

    const baseMat = new THREE.MeshStandardMaterial({
      color: baseColorHex,
      roughness: 0.22,
      metalness: 0.78,
    });
    const lavaGlowMat = new THREE.MeshStandardMaterial({
      color: waxColorHex,
      emissive: waxColorHex,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });

    // Hourglass / conical base
    const baseCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.048, 0.095, 18),
      baseMat
    );
    baseCone.position.set(0, 0.0475, 0);
    lampGroup.add(baseCone);

    // Tapered glass bottle filled with glowing lava wax
    const glassBottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.042, 0.165, 18),
      lavaGlowMat
    );
    glassBottle.position.set(0, 0.175, 0);
    lampGroup.add(glassBottle);

    // Top metal cap
    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.038, 18),
      baseMat
    );
    topCap.position.set(0, 0.275, 0);
    lampGroup.add(topCap);
  };

  // Warm crimson-amber Mathmos Astro Lava Lamp inside the North-wall wooden bookcase (`u = 22.18m, y = mezzanineFloorY + 0.552m, v = 0.45m, scale = 0.72`)
  addRetroLavaLamp(
    22.18,
    mezzanineFloorY + 0.552,
    0.45,
    0xe04828,
    0xd8dde4,
    'outbuildings.mezzanine.lavaLamp.bookcase',
    0.72
  );

  // Warm Wooden Side Cabinet + Warm Cream Fabric Table Lamp in NE corner (`u = 22.64m, v = 0.46m`, matching `media_1791202879638_22365d89.jpg`)
  const sideCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.54, 0.32),
    teakMat
  );
  sideCabinet.name = 'outbuildings.mezzanine.sideCabinet';
  sideCabinet.position.set(22.64, mezzanineFloorY + 0.27, 0.46);
  sideCabinet.castShadow = true;
  sideCabinet.receiveShadow = true;
  loungeGroup.add(sideCabinet);

  const lampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.045, 0.22, 16),
    darkTeakMat
  );
  lampStem.position.set(22.64, mezzanineFloorY + 0.65, 0.46);
  loungeGroup.add(lampStem);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.135, 0.18, 22),
    new THREE.MeshStandardMaterial({
      color: 0xf5ebd6,
      emissive: 0xffbe66,
      emissiveIntensity: 1.35,
      roughness: 0.46,
    })
  );
  lampShade.name = 'outbuildings.mezzanine.tableLamp.shade';
  lampShade.position.set(22.64, mezzanineFloorY + 0.78, 0.46);
  loungeGroup.add(lampShade);

  // =========================================================================
  // 10. Issue #3 ("Some more task lighting, ambiet lighting in here" at `[-1.766, 1.552, 16.583]`):
  //     Comprehensive Task & Ambient Lighting across the Mezzanine Retro Lounge:
  //     - Warm overhead ambient PointLight + NE Table Lamp PointLight + Bookcase PointLight + CRT Glow PointLight
  //     - Mid-Century Brass & Teak Articulated Floor Task Lamp (`outbuildings.mezzanine.floorTaskLamp`) in SW lounge corner
  //     - Articulated 1990s Anglepoise Desk Task Lamp (`outbuildings.mezzanine.sideboardTaskLamp`) on south end of sideboard
  //     - 2 Warm Brass & Pleated-Linen Wall Sconces (`outbuildings.mezzanine.wallSconce.1` & `.2`) on East & South walls
  // =========================================================================
  const lightingGroup = new THREE.Group();
  lightingGroup.name = 'outbuildings.mezzanine.lighting';
  loungeGroup.add(lightingGroup);

  const warmBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.26,
    metalness: 0.84,
  });
  const warmGlowingBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    emissive: 0xffd27a,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const warmPleatedShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: 0xffc46b,
    emissiveIntensity: 1.45,
    roughness: 0.52,
    side: THREE.DoubleSide,
  });

  // 1. Warm Overhead Ambient Lounge Light (`u = 20.65m, y = mezzanineFloorY + 1.85m, v = 2.55m`)
  const mezzanineAmbientLight = new THREE.PointLight(0xffcf88, 2.2, 7.8, 1.45);
  mezzanineAmbientLight.name = 'outbuildings.mezzanine.ambientLight';
  mezzanineAmbientLight.position.set(20.65, mezzanineFloorY + 1.85, 2.55);
  lightingGroup.add(mezzanineAmbientLight);

  // 2. NE Table Lamp PointLight & Bookcase Task PointLight
  const neTableLampLight = new THREE.PointLight(0xffb85c, 1.6, 4.5, 1.6);
  neTableLampLight.name = 'outbuildings.mezzanine.tableLamp.light';
  neTableLampLight.position.set(22.64, mezzanineFloorY + 0.78, 0.52);
  lightingGroup.add(neTableLampLight);

  const bookcaseTaskLight = new THREE.PointLight(0xffca78, 1.15, 3.2, 1.7);
  bookcaseTaskLight.name = 'outbuildings.mezzanine.bookcase.light';
  bookcaseTaskLight.position.set(21.88, mezzanineFloorY + 0.92, 0.68);
  lightingGroup.add(bookcaseTaskLight);

  // 3. Sony Trinitron CRT TV Blue-White Screen Glow Light (`u = 19.38m, y = mezzanineFloorY + 1.05m, v = 2.38m`)
  const crtGlowLight = new THREE.PointLight(0x88c8ff, 0.95, 3.4, 1.8);
  crtGlowLight.name = 'outbuildings.mezzanine.trinitronGlowLight';
  crtGlowLight.position.set(19.38, mezzanineFloorY + 1.05, 2.38);
  lightingGroup.add(crtGlowLight);

  // 4. Mid-Century Brass & Teak Articulated Floor Reading/Task Lamp in SW Lounge Corner (`u = 19.25m, v = 4.88m`)
  const floorLampGroup = new THREE.Group();
  floorLampGroup.name = 'outbuildings.mezzanine.floorTaskLamp';
  floorLampGroup.position.set(19.25, mezzanineFloorY, 4.88);
  floorLampGroup.rotation.y = -0.68; // Aimed toward the terracotta beanbag & PS1 gaming rug
  lightingGroup.add(floorLampGroup);

  const flBaseOak = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.16, 0.026, 24),
    teakMat
  );
  flBaseOak.position.set(0, 0.013, 0);
  flBaseOak.castShadow = true;
  floorLampGroup.add(flBaseOak);

  const flBaseBrass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.125, 0.018, 24),
    warmBrassMat
  );
  flBaseBrass.position.set(0, 0.032, 0);
  floorLampGroup.add(flBaseBrass);

  const flStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.015, 1.36, 16),
    warmBrassMat
  );
  flStem.position.set(0, 0.71, 0);
  flStem.castShadow = true;
  floorLampGroup.add(flStem);

  const flTeakGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.18, 16),
    teakMat
  );
  flTeakGrip.position.set(0, 0.94, 0);
  floorLampGroup.add(flTeakGrip);

  const flBoomArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.38, 12),
    warmBrassMat
  );
  flBoomArm.position.set(0.14, 1.40, 0);
  flBoomArm.rotation.z = -1.12;
  floorLampGroup.add(flBoomArm);

  const flConeShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.125, 0.17, 24, 1, true),
    warmPleatedShadeMat
  );
  flConeShade.name = 'outbuildings.mezzanine.floorTaskLamp.shade';
  flConeShade.position.set(0.28, 1.38, 0);
  flConeShade.rotation.z = 0.36;
  floorLampGroup.add(flConeShade);

  const flBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 14, 12),
    warmGlowingBulbMat
  );
  flBulb.position.set(0.27, 1.35, 0);
  floorLampGroup.add(flBulb);

  const flTaskPointLight = new THREE.PointLight(0xffc266, 1.75, 5.2, 1.55);
  flTaskPointLight.name = 'outbuildings.mezzanine.floorTaskLamp.light';
  flTaskPointLight.position.set(0.32, 1.30, 0);
  floorLampGroup.add(flTaskPointLight);

  // 5. Articulated 1990s Anglepoise Task Desk Lamp on the South End of the Sideboard (`u = 19.04m, y = mezzanineFloorY + 0.72m, v = 3.04m`)
  const deskLampGroup = new THREE.Group();
  deskLampGroup.name = 'outbuildings.mezzanine.sideboardTaskLamp';
  deskLampGroup.position.set(19.16, mezzanineFloorY + 0.72, 3.04);
  deskLampGroup.rotation.y = -0.45;
  lightingGroup.add(deskLampGroup);

  const dlBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.088, 0.024, 20),
    warmBrassMat
  );
  dlBase.position.set(0, 0.012, 0);
  deskLampGroup.add(dlBase);

  const dlLowerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.24, 10),
    warmBrassMat
  );
  dlLowerArm.position.set(-0.04, 0.12, 0);
  dlLowerArm.rotation.z = 0.34;
  deskLampGroup.add(dlLowerArm);

  const dlUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.22, 10),
    warmBrassMat
  );
  dlUpperArm.position.set(0.02, 0.27, 0);
  dlUpperArm.rotation.z = -0.62;
  deskLampGroup.add(dlUpperArm);

  const dlShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.078, 0.11, 20, 1, true),
    warmPleatedShadeMat
  );
  dlShade.name = 'outbuildings.mezzanine.sideboardTaskLamp.shade';
  dlShade.position.set(0.11, 0.29, 0);
  dlShade.rotation.z = 0.28;
  deskLampGroup.add(dlShade);

  const dlBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 10),
    warmGlowingBulbMat
  );
  dlBulb.position.set(0.11, 0.27, 0);
  deskLampGroup.add(dlBulb);

  const dlPointLight = new THREE.PointLight(0xffc470, 1.3, 3.8, 1.65);
  dlPointLight.name = 'outbuildings.mezzanine.sideboardTaskLamp.light';
  dlPointLight.position.set(0.14, 0.24, 0);
  deskLampGroup.add(dlPointLight);

  // 6. 2 Warm Brass & Pleated-Linen Wall Sconces (`outbuildings.mezzanine.wallSconce.1` on East wall & `.2` on South wall)
  for (const [sIdx, su, sy, sv, sRotY] of [
    [1, 23.005, mezzanineFloorY + 1.22, 0.72, -Math.PI / 2],
    [2, 20.08, mezzanineFloorY + 1.22, 5.41, Math.PI],
  ] as const) {
    const sconceGroup = new THREE.Group();
    sconceGroup.name = `outbuildings.mezzanine.wallSconce.${sIdx}`;
    sconceGroup.position.set(su, sy, sv);
    sconceGroup.rotation.y = sRotY;
    lightingGroup.add(sconceGroup);

    const backplate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.014, 20),
      warmBrassMat
    );
    backplate.rotation.x = Math.PI / 2;
    backplate.position.set(0, 0, 0.007);
    sconceGroup.add(backplate);

    const sconceArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.13, 12),
      warmBrassMat
    );
    sconceArm.rotation.x = Math.PI * 0.38;
    sconceArm.position.set(0, 0.02, 0.065);
    sconceGroup.add(sconceArm);

    const sconceShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.092, 0.13, 20, 1, true),
      warmPleatedShadeMat
    );
    sconceShade.name = `outbuildings.mezzanine.wallSconce.${sIdx}.shade`;
    sconceShade.position.set(0, 0.095, 0.115);
    sconceGroup.add(sconceShade);

    const sconceBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 10),
      warmGlowingBulbMat
    );
    sconceBulb.position.set(0, 0.085, 0.115);
    sconceGroup.add(sconceBulb);

    const sconceLight = new THREE.PointLight(0xffc472, 1.15, 3.8, 1.7);
    sconceLight.position.set(0, 0.09, 0.18);
    sconceGroup.add(sconceLight);
  }
}

/**
 * Generates a high-resolution (`768x512`) painting/photograph of the Old Course at St Andrews
 * featuring the iconic stone Swilcan Bridge in the foreground, the 18th fairway links turf,
 * the Royal and Ancient Golf Club Clubhouse, and red-brick Hamilton Grand on the horizon (`Issue #5`).
 */
function createStAndrewsOldCourseTexture(): THREE.CanvasTexture {
  const w = 768;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Cream conservation passepartout mount border (`34px` border)
    ctx.fillStyle = '#f2ede2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c5aa6a';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    ctx.save();
    ctx.beginPath();
    ctx.rect(34, 34, w - 68, h - 78);
    ctx.clip();

    // 2. Scottish Fife coastal sky with sunlit silver-gold clouds
    const skyGrad = ctx.createLinearGradient(0, 34, 0, 260);
    skyGrad.addColorStop(0, '#4674a6');
    skyGrad.addColorStop(0.55, '#86adc9');
    skyGrad.addColorStop(0.88, '#d8cfb8');
    skyGrad.addColorStop(1, '#eee2c4');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(34, 34, w - 68, 230);

    for (const [cx, cy, rx, ry] of [
      [165, 98, 95, 24],
      [340, 82, 128, 28],
      [540, 106, 112, 25],
      [645, 92, 85, 22],
    ] as const) {
      ctx.fillStyle = 'rgba(255, 250, 240, 0.78)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Distant West Sands & North Sea strip on left horizon + St Andrews town skyline
    ctx.fillStyle = '#3c688c';
    ctx.fillRect(34, 236, 220, 14);
    ctx.fillStyle = '#d9ccb2';
    ctx.fillRect(34, 246, 240, 8);

    // Iconic red-brick Victorian Hamilton Grand (`x = 285..405`)
    ctx.fillStyle = '#8f4638';
    ctx.fillRect(285, 178, 118, 72);
    ctx.fillStyle = '#424952';
    ctx.fillRect(282, 162, 124, 18);
    // Turret dome on right corner of Hamilton Grand
    ctx.beginPath();
    ctx.arc(395, 162, 14, Math.PI, 0);
    ctx.fill();
    // Windows on Hamilton Grand
    ctx.fillStyle = '#e8dec8';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.fillRect(293 + c * 15, 184 + r * 15, 7, 10);
      }
    }

    // Royal & Ancient Golf Club Clubhouse (`x = 415..565`, classical sandstone facade & clock gable)
    ctx.fillStyle = '#cbbca2';
    ctx.fillRect(415, 198, 150, 52);
    ctx.beginPath();
    ctx.moveTo(465, 198);
    ctx.lineTo(490, 174);
    ctx.lineTo(515, 198);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#525b66';
    ctx.fillRect(412, 188, 156, 11);

    // 4. Rolling Emerald Links Turf of the 18th & 1st Fairways (`y = 248..456`)
    const turfGrad = ctx.createLinearGradient(0, 248, 0, 460);
    turfGrad.addColorStop(0, '#5a8f49');
    turfGrad.addColorStop(0.45, '#467d38');
    turfGrad.addColorStop(1, '#2f5e25');
    ctx.fillStyle = turfGrad;
    ctx.fillRect(34, 248, w - 68, 220);

    // Mowed links fairway ribbons & Swilcan Burn stream channel
    ctx.fillStyle = 'rgba(138, 196, 102, 0.25)';
    ctx.beginPath();
    ctx.moveTo(220, 250);
    ctx.lineTo(560, 250);
    ctx.lineTo(710, 456);
    ctx.lineTo(60, 456);
    ctx.closePath();
    ctx.fill();

    // Swilcan Burn water channel curving under the bridge
    ctx.fillStyle = '#294d6b';
    ctx.beginPath();
    ctx.moveTo(34, 378);
    ctx.quadraticCurveTo(384, 398, 734, 368);
    ctx.lineTo(734, 412);
    ctx.quadraticCurveTo(384, 436, 34, 408);
    ctx.closePath();
    ctx.fill();

    // 5. Iconic Stone Swilcan Bridge in Foreground Center (`x = 205..565, y = 308..438`)
    const stoneGrad = ctx.createLinearGradient(205, 308, 565, 430);
    stoneGrad.addColorStop(0, '#9c9282');
    stoneGrad.addColorStop(0.5, '#b5ab99');
    stoneGrad.addColorStop(1, '#7d7365');
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(190, 422);
    ctx.quadraticCurveTo(384, 286, 578, 422);
    ctx.lineTo(578, 450);
    ctx.lineTo(190, 450);
    ctx.closePath();
    ctx.fill();

    // Dark stone single arch opening over the Swilcan Burn + water reflection
    ctx.fillStyle = '#1b2c3b';
    ctx.beginPath();
    ctx.arc(384, 434, 78, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Individual weathered stone blocks & arch voussoirs on the Swilcan Bridge
    ctx.strokeStyle = 'rgba(48, 42, 35, 0.55)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 5; row++) {
      const ry = 335 + row * 18;
      for (let col = 0; col < 11; col++) {
        const rx = 225 + col * 30 + (row % 2) * 14;
        if (ry > 365 && rx > 300 && rx < 460) continue;
        ctx.strokeRect(rx, ry, 28, 16);
      }
    }

    ctx.restore();

    // Calligraphy caption on bottom passepartout margin
    ctx.fillStyle = '#3a3228';
    ctx.font = 'italic bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE OLD COURSE · ST ANDREWS — SWILCAN BRIDGE & 18TH FAIRWAY', w * 0.5, h - 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a high-resolution (`1024x640`) Hunter-Green Baize Display Board containing
 * 8 vintage parchment Equestrian Horse Show Championship Certificates with calligraphy headers,
 * horse/rider script, and crimson/gold wax seals (`Issue #6`).
 */
function createHorseShowCertificatesTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Weathered Hunter-Green Baize & Cork Pinboard Backing (`#173628`) with worn felt grain and old pin-holes
    ctx.fillStyle = '#163325';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4500; i++) {
      const fx = (i * 97) % w;
      const fy = (i * 151) % h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.045)';
      ctx.fillRect(fx, fy, 3, 2);
    }
    ctx.strokeStyle = '#9c8244';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);

    // Issue #2 ("Too tidy" at `[-4.908, 0.937, 19.9]`, `outbuildings.barn.horseShowCertificates.canvas`):
    // Replaced the rigid 2x4 grid with an authentic, lived-in, slightly chaotic collage of 14 overlapping,
    // tilted (`-12°` to `+13°`), varied-size portrait & landscape horse show certificates, yellowing newspaper
    // clippings, competitor bib numbers ("142" & "87"), and vintage sepia show-jumping photos pinned haphazardly over decades!
    interface CertSpec {
      readonly cx: number;
      readonly cy: number;
      readonly cw: number;
      readonly ch: number;
      readonly angleDeg: number;
      readonly paperTop: string;
      readonly paperBot: string;
      readonly borderCol: string;
      readonly title: string;
      readonly subtitle: string;
      readonly sealCol: string;
      readonly dogEarCorner: number; // 0=none, 1=topRight, 2=botRight, 3=botLeft
    }

    const certs: ReadonlyArray<CertSpec> = [
      // Back layer — older yellowed & faded certificates tucked underneath
      {
        cx: 138, cy: 168, cw: 210, ch: 256, angleDeg: -8.5,
        paperTop: '#efe2c2', paperBot: '#dcc89e', borderCol: '#7a2222',
        title: 'BUCKS COUNTY SHOW 1984', subtitle: 'WORKING HUNTER · 1ST PRIZE',
        sealCol: '#a82020', dogEarCorner: 1,
      },
      {
        cx: 358, cy: 152, cw: 248, ch: 186, angleDeg: 6.2,
        paperTop: '#dce7f0', paperBot: '#c6d6e4', borderCol: '#1b3f6b',
        title: 'ROYAL WINDSOR HORSE SHOW', subtitle: 'OPEN SHOW JUMPING · RESERVE',
        sealCol: '#1b3f6b', dogEarCorner: 0,
      },
      {
        cx: 618, cy: 164, cw: 204, ch: 248, angleDeg: -5.4,
        paperTop: '#f6eedb', paperBot: '#e4d6b8', borderCol: '#245238',
        title: 'CHILTERNS HUNTER TRIALS', subtitle: 'OPEN CROSS COUNTRY · WINNER',
        sealCol: '#c4962c', dogEarCorner: 2,
      },
      {
        cx: 868, cy: 176, cw: 218, ch: 242, angleDeg: 9.8,
        paperTop: '#f2e0d8', paperBot: '#dfc7bc', borderCol: '#822436',
        title: 'PONY CLUB AREA 12', subtitle: 'SENIOR EVENTING · TEAM 2ND',
        sealCol: '#9e2424', dogEarCorner: 3,
      },
      {
        cx: 162, cy: 458, cw: 244, ch: 192, angleDeg: 11.2,
        paperTop: '#e8dec6', paperBot: '#d2c29f', borderCol: '#5c3c1e',
        title: 'VALE OF AYLESBURY HUNT', subtitle: 'POINT-TO-POINT · ADJACENT HUNTS',
        sealCol: '#a82020', dogEarCorner: 1,
      },
      {
        cx: 432, cy: 472, cw: 212, ch: 246, angleDeg: -9.6,
        paperTop: '#f8f2e2', paperBot: '#e5d9be', borderCol: '#1e3f66',
        title: 'HICKSTEAD DERBY MEETING', subtitle: 'FOXHUNTER QUALIFIER · 1ST',
        sealCol: '#b82222', dogEarCorner: 2,
      },
      {
        cx: 688, cy: 462, cw: 252, ch: 188, angleDeg: 7.4,
        paperTop: '#f5ebd2', paperBot: '#e0d0ad', borderCol: '#7d2020',
        title: 'BRITISH SHOW JUMPING ASSOC.', subtitle: 'GRADE B & C CHAMPIONSHIP',
        sealCol: '#c9972c', dogEarCorner: 0,
      },
      {
        cx: 888, cy: 454, cw: 196, ch: 234, angleDeg: -11.4,
        paperTop: '#e2eadc', paperBot: '#cbd8c2', borderCol: '#224c30',
        title: 'TRING AGRICULTURAL SHOW', subtitle: 'SUPREME RIDDEN HUNTER',
        sealCol: '#b82020', dogEarCorner: 1,
      },
      // Foreground overlapping certificates, show cards & clippings pinned on top at jaunty angles
      {
        cx: 262, cy: 298, cw: 226, ch: 178, angleDeg: -12.4,
        paperTop: '#fbf5e8', paperBot: '#ebdfc6', borderCol: '#8c2424',
        title: 'HORSE OF THE YEAR SHOW', subtitle: 'QUALIFIER · SMALL HUNTER',
        sealCol: '#b81d1d', dogEarCorner: 2,
      },
      {
        cx: 518, cy: 288, cw: 214, ch: 254, angleDeg: 4.8,
        paperTop: '#f9f2df', paperBot: '#e7dac0', borderCol: '#b58d32',
        title: 'CROX FARMHOUSE STUD', subtitle: 'SUPREME CHAMPION · CHALLENGE CUP',
        sealCol: '#b82020', dogEarCorner: 0,
      },
      {
        cx: 764, cy: 312, cw: 192, ch: 222, angleDeg: -7.8,
        paperTop: '#efe4cc', paperBot: '#dac8a4', borderCol: '#264264',
        title: 'HENLEY & DISTRICT SHOW', subtitle: 'FIRST PRIZE · COB CLASS',
        sealCol: '#1e4678', dogEarCorner: 3,
      },
    ];

    for (let idx = 0; idx < certs.length; idx++) {
      const c = certs[idx]!;
      ctx.save();
      ctx.translate(c.cx, c.cy);
      ctx.rotate((c.angleDeg * Math.PI) / 180);

      const x0 = -c.cw * 0.5;
      const y0 = -c.ch * 0.5;

      // Drop shadow on the green baize board so overlapping sheets have real depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      ctx.fillRect(x0 + 5, y0 + 6, c.cw, c.ch);

      // Aged paper fill
      const pGrad = ctx.createLinearGradient(x0, y0, x0 + c.cw, y0 + c.ch);
      pGrad.addColorStop(0, c.paperTop);
      pGrad.addColorStop(1, c.paperBot);
      ctx.fillStyle = pGrad;
      ctx.fillRect(x0, y0, c.cw, c.ch);

      // Subtle coffee/rain water-stain ring on some older certificates
      if (idx % 3 === 0) {
        ctx.strokeStyle = 'rgba(138, 102, 54, 0.16)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x0 + c.cw * 0.72, y0 + c.ch * 0.28, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ornamental border
      ctx.strokeStyle = c.borderCol;
      ctx.lineWidth = 2.6;
      ctx.strokeRect(x0 + 8, y0 + 8, c.cw - 16, c.ch - 16);
      ctx.strokeStyle = '#c29e46';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x0 + 12, y0 + 12, c.cw - 24, c.ch - 24);

      // Crest & Typography
      ctx.fillStyle = c.borderCol;
      ctx.beginPath();
      ctx.arc(0, y0 + 28, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e2022';
      ctx.font = 'bold 10.5px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.title, 0, y0 + 52);

      ctx.fillStyle = c.borderCol;
      ctx.font = 'italic bold 9.5px Georgia, serif';
      ctx.fillText(c.subtitle, 0, y0 + 68);

      // Handwritten faded ink lines & signatures
      ctx.strokeStyle = 'rgba(38, 32, 26, 0.52)';
      ctx.lineWidth = 1.3;
      const lineCount = c.ch > 210 ? 5 : 3;
      for (let ln = 0; ln < lineCount; ln++) {
        const ly = y0 + 90 + ln * 18;
        const pad = 22 + ((ln * 11 + idx * 7) % 18);
        ctx.beginPath();
        ctx.moveTo(x0 + pad, ly);
        ctx.bezierCurveTo(-18, ly - 3, 18, ly + 3, x0 + c.cw - pad, ly - 1);
        ctx.stroke();
      }

      // Wax seal at bottom right
      const sx = x0 + c.cw - 36;
      const sy = y0 + c.ch - 34;
      ctx.fillStyle = '#b8943c';
      ctx.fillRect(sx - 5, sy + 5, 4, 16);
      ctx.fillRect(sx + 1, sy + 5, 4, 16);
      ctx.fillStyle = c.sealCol;
      ctx.beginPath();
      ctx.arc(sx, sy, 11, 0, Math.PI * 2);
      ctx.fill();

      // Dog-eared folded corner if specified
      if (c.dogEarCorner === 1) {
        ctx.fillStyle = '#cbb894';
        ctx.beginPath();
        ctx.moveTo(x0 + c.cw - 24, y0);
        ctx.lineTo(x0 + c.cw, y0 + 24);
        ctx.lineTo(x0 + c.cw - 24, y0 + 24);
        ctx.closePath();
        ctx.fill();
      } else if (c.dogEarCorner === 2) {
        ctx.fillStyle = '#cbb894';
        ctx.beginPath();
        ctx.moveTo(x0 + c.cw - 24, y0 + c.ch);
        ctx.lineTo(x0 + c.cw, y0 + c.ch - 24);
        ctx.lineTo(x0 + c.cw - 24, y0 + c.ch - 24);
        ctx.closePath();
        ctx.fill();
      }

      // Brass thumbtacks / drawing pins at top corners
      for (const px of [x0 + 18, x0 + c.cw - 18]) {
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(px, y0 + 14, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Two Vintage Sepia Show-Jumping Photographs pinned over the certificates
    for (const [px, py, pw, ph, pAng] of [
      [118, 318, 148, 112, -14.5],
      [642, 304, 154, 116, 12.8],
    ] as const) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((pAng * Math.PI) / 180);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-pw * 0.5 + 4, -ph * 0.5 + 5, pw, ph);
      // White photo border
      ctx.fillStyle = '#f4efe2';
      ctx.fillRect(-pw * 0.5, -ph * 0.5, pw, ph);
      // Sepia sky & grass field
      ctx.fillStyle = '#c8b89a';
      ctx.fillRect(-pw * 0.5 + 8, -ph * 0.5 + 8, pw - 16, ph - 24);
      ctx.fillStyle = '#6e583f';
      ctx.fillRect(-pw * 0.5 + 8, 4, pw - 16, ph * 0.5 - 20);
      // Rustic timber jump fence & leaping horse silhouette
      ctx.strokeStyle = '#f2ead8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18, 22);
      ctx.lineTo(22, 8);
      ctx.stroke();
      ctx.fillStyle = '#382819';
      ctx.beginPath();
      ctx.ellipse(-2, -4, 24, 11, -0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Two Tied-On Competitor Number Bib Cards ("142" and "87") with masking tape & string holes
    for (const [bx, by, bAng, numStr] of [
      [388, 336, 9.5, '142'],
      [832, 294, -13.2, '87'],
    ] as const) {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate((bAng * Math.PI) / 180);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-52, -36, 108, 76);
      ctx.fillStyle = '#ece3ce';
      ctx.fillRect(-54, -38, 108, 76);
      ctx.fillStyle = '#181818';
      ctx.font = '900 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numStr, 0, 2);
      // Masking tape strips across top corners
      ctx.fillStyle = 'rgba(218, 198, 148, 0.78)';
      ctx.fillRect(-62, -44, 34, 12);
      ctx.fillRect(28, -44, 34, 12);
      ctx.restore();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Issue #5 ("Pixture on the wall of st andrews here" at `[-4.872, 1.18, 14.769]` -> `(u = 17.639m, y = 1.18m, v = 0.28m)`),
 * Issue #1 ("TOo big" at `[-4.938, 1.266, 14.81]`, `outbuildings.barn.stAndrewsPicture.canvas`),
 * Issue #6 ("Large framed picture of horse show certificates here (they were originally on the wall in the barn)") &
 * Issue #2 ("Too tidy" at `[-4.908, 0.937, 19.9]`, `outbuildings.barn.horseShowCertificates.canvas`):
 * Mounts the right-sized (`0.76m x 0.52m`) Framed Old Course at St Andrews Picture on the Barn North Wall and
 * the organic, lived-in Horse Show Certificates & 9 scattered 3D Silk Rosettes Display Case on the Barn South Wall.
 */
/**
 * Issue #1 ("Samsung frame 55 inch on this wall, more task and ambient lighting in here"
 * at `[-1.221, 0.434, 19.624]` -> Outbuilding `(u = 20.861m, y = 0.434m, v = 5.43m)`):
 * Generates a high-resolution (`1024x576`, 16:9) Matte Anti-Glare Art-Mode / Championship Golf
 * display canvas for the 55-inch Samsung "The Frame" QLED TV on the Barn South Wall, with a
 * warm cream conservation passepartout mat border and an atmospheric golden-hour links golf /
 * Highlands landscape artwork.
 */
function createSamsungFrame55ScreenTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 576;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Samsung "The Frame" warm museum passepartout mat board (`52px` border with bevel shadow)
    ctx.fillStyle = '#f3eee3';
    ctx.fillRect(0, 0, w, h);

    // Subtle inner bevel shadow around the mat opening (`52..w-52, 48..h-48`)
    ctx.strokeStyle = '#c8bfa8';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 46, w - 100, h - 92);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(53, 49, w - 106, h - 98);

    ctx.save();
    ctx.beginPath();
    ctx.rect(52, 48, w - 104, h - 96);
    ctx.clip();

    // 2. Golden-hour Championship Links & Coastal Duneland Panorama (Augusta / Turnberry sunset glow)
    const skyGrad = ctx.createLinearGradient(0, 48, 0, 310);
    skyGrad.addColorStop(0, '#2c4c70');
    skyGrad.addColorStop(0.42, '#5c7c99');
    skyGrad.addColorStop(0.76, '#d99e6a');
    skyGrad.addColorStop(1, '#f5cf8e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(52, 48, w - 104, 265);

    // Warm glowing setting sun & golden clouds
    const sunGrad = ctx.createRadialGradient(690, 245, 8, 690, 245, 115);
    sunGrad.addColorStop(0, 'rgba(255, 246, 205, 0.95)');
    sunGrad.addColorStop(0.45, 'rgba(255, 204, 122, 0.48)');
    sunGrad.addColorStop(1, 'rgba(255, 180, 95, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(52, 48, w - 104, 265);

    // Distant coastal headland & sea loch shimmer
    ctx.fillStyle = '#3b4d63';
    ctx.beginPath();
    ctx.moveTo(52, 292);
    ctx.lineTo(185, 246);
    ctx.lineTo(355, 262);
    ctx.lineTo(540, 238);
    ctx.lineTo(745, 268);
    ctx.lineTo(972, 242);
    ctx.lineTo(972, 310);
    ctx.lineTo(52, 310);
    ctx.closePath();
    ctx.fill();

    // Sunlit coastal water inlet (`y = 292..328`)
    const waterGrad = ctx.createLinearGradient(0, 292, 0, 330);
    waterGrad.addColorStop(0, '#5a7894');
    waterGrad.addColorStop(0.5, '#d9a56c');
    waterGrad.addColorStop(1, '#3b5973');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(52, 292, w - 104, 38);

    // 3. Sculpted emerald links fairway, golden marram dunes & sand bunkers (`y = 318..528`)
    const turfGrad = ctx.createLinearGradient(0, 318, 0, 528);
    turfGrad.addColorStop(0, '#4f7d3e');
    turfGrad.addColorStop(0.5, '#3b662d');
    turfGrad.addColorStop(1, '#22421a');
    ctx.fillStyle = turfGrad;
    ctx.beginPath();
    ctx.moveTo(52, 332);
    ctx.quadraticCurveTo(320, 304, 595, 326);
    ctx.quadraticCurveTo(790, 340, 972, 314);
    ctx.lineTo(972, 528);
    ctx.lineTo(52, 528);
    ctx.closePath();
    ctx.fill();

    // Sunlit putting green & two sculpted pot bunkers
    ctx.fillStyle = '#629c49';
    ctx.beginPath();
    ctx.ellipse(545, 412, 235, 42, -0.05, 0, Math.PI * 2);
    ctx.fill();

    for (const [bx, by, rx, ry] of [
      [345, 418, 48, 16],
      [715, 404, 56, 18],
    ] as const) {
      ctx.fillStyle = '#e5cf9e';
      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6b532c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, by, rx, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }

    // Pin flag on the 18th green (`x = 585, y = 342..408`)
    ctx.strokeStyle = '#f5f2e8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(585, 408);
    ctx.lineTo(585, 342);
    ctx.stroke();
    ctx.fillStyle = '#d42c2c';
    ctx.beginPath();
    ctx.moveTo(585, 342);
    ctx.lineTo(614, 351);
    ctx.lineTo(585, 360);
    ctx.closePath();
    ctx.fill();

    // Scots pine silhouettes on the left ridge
    ctx.fillStyle = '#1b2e1b';
    for (const [tx, ty, th] of [
      [142, 355, 86],
      [188, 348, 96],
      [226, 360, 74],
    ] as const) {
      ctx.fillRect(tx - 3, ty - th * 0.45, 6, th * 0.45);
      ctx.beginPath();
      ctx.ellipse(tx, ty - th * 0.52, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Subtle Samsung Art Mode museum plaque signature in bottom-right of mat
    ctx.fillStyle = '#7a7264';
    ctx.font = 'italic 12px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('Turnberry & Ayrshire Links · Sunset Study', w - 62, h - 20);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildBarnGroundWallArtworks(
  groundGroup: THREE.Group,
  groundCeilingGroup?: THREE.Group
): void {
  const walnutFrameMat = new THREE.MeshStandardMaterial({
    color: 0x3b2618,
    roughness: 0.36,
    metalness: 0.08,
  });
  const giltSlipMat = new THREE.MeshStandardMaterial({
    color: 0xcfa84c,
    roughness: 0.28,
    metalness: 0.78,
  });

  // ---------------------------------------------------------------------------
  // 1. Issue #1 ("TOo big" at `[-4.938, 1.266, 14.81]`):
  //    Reduced `outbuildings.barn.stAndrewsPicture` from `1.32m x 0.88m` down to a tasteful `0.76m x 0.52m`!
  // ---------------------------------------------------------------------------
  const stAndrewsGroup = new THREE.Group();
  stAndrewsGroup.name = 'outbuildings.barn.stAndrewsPicture';
  stAndrewsGroup.userData.zone = 'courtyard';
  stAndrewsGroup.position.set(17.64, 1.14, 0.295);
  groundGroup.add(stAndrewsGroup);

  const stW = 0.76;
  const stH = 0.52;
  const stFrameD = 0.026;

  const stFrameBox = new THREE.Mesh(
    new THREE.BoxGeometry(stW + 0.048, stH + 0.048, stFrameD),
    walnutFrameMat
  );
  stFrameBox.name = 'outbuildings.barn.stAndrewsPicture.frame';
  stFrameBox.castShadow = true;
  stAndrewsGroup.add(stFrameBox);

  const stGiltSlip = new THREE.Mesh(
    new THREE.BoxGeometry(stW + 0.014, stH + 0.014, stFrameD + 0.004),
    giltSlipMat
  );
  stAndrewsGroup.add(stGiltSlip);

  const stCanvasPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(stW, stH),
    new THREE.MeshStandardMaterial({
      map: createStAndrewsOldCourseTexture(),
      roughness: 0.24,
      metalness: 0.04,
    })
  );
  stCanvasPlane.name = 'outbuildings.barn.stAndrewsPicture.canvas';
  stCanvasPlane.position.set(0, 0, stFrameD * 0.5 + 0.004);
  stAndrewsGroup.add(stCanvasPlane);

  // ---------------------------------------------------------------------------
  // 2. Issue #2 ("Too tidy" at `[-4.908, 0.937, 19.9]`, `outbuildings.barn.horseShowCertificates.canvas`):
  //    Organic, overlapping Horse Show Certificates & 9 asymmetrically pinned 3D Silk Rosettes
  // ---------------------------------------------------------------------------
  const certGroup = new THREE.Group();
  certGroup.name = 'outbuildings.barn.horseShowCertificates';
  certGroup.userData.zone = 'courtyard';
  certGroup.position.set(17.15, 1.12, 5.412);
  certGroup.rotation.y = Math.PI;
  groundGroup.add(certGroup);

  const certW = 1.50;
  const certH = 0.96;
  const certFrameD = 0.038;

  const certFrameBox = new THREE.Mesh(
    new THREE.BoxGeometry(certW + 0.08, certH + 0.08, certFrameD),
    walnutFrameMat
  );
  certFrameBox.name = 'outbuildings.barn.horseShowCertificates.frame';
  certFrameBox.castShadow = true;
  certGroup.add(certFrameBox);

  const certGiltSlip = new THREE.Mesh(
    new THREE.BoxGeometry(certW + 0.02, certH + 0.02, certFrameD + 0.004),
    giltSlipMat
  );
  certGroup.add(certGiltSlip);

  const certBoardPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(certW, certH),
    new THREE.MeshStandardMaterial({
      map: createHorseShowCertificatesTexture(),
      roughness: 0.34,
      metalness: 0.04,
    })
  );
  certBoardPlane.name = 'outbuildings.barn.horseShowCertificates.canvas';
  certBoardPlane.position.set(0, 0, certFrameD * 0.5 + 0.004);
  certGroup.add(certBoardPlane);

  // 9 Asymmetrically Pinned 3D Pleated Silk Equestrian Championship Rosettes of varied sizes & tilted angles
  const rosetteSpecs: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
    // [rx, ry, radius, tiltZ, outerHex, innerHex]
    [-0.58, 0.34, 0.058, 0.24, 0xc92424, 0xf2d03b],  // Top-left Crimson 1st Place
    [-0.31, 0.21, 0.046, -0.18, 0x1e4ea8, 0xf5f2eb], // Upper-mid-left Royal Blue 2nd Place
    [-0.08, 0.36, 0.064, 0.12, 0x6a248c, 0xd4af37],  // Top-center Supreme Champion Purple & Gold
    [0.24, 0.28, 0.050, -0.26, 0xe0a81e, 0x9e2020],  // Upper-right Golden Yellow 3rd Place
    [0.56, 0.33, 0.044, 0.31, 0x1e7a46, 0xf2d03b],   // Top-right Emerald Green 4th Place
    [-0.48, -0.14, 0.052, -0.22, 0xb82020, 0x1e4ea8], // Mid-left Red/White/Blue Championship
    [0.06, -0.06, 0.056, 0.19, 0xd96b27, 0xf5eedc],  // Center-right Rosette pinned over certificate corner
    [-0.22, -0.34, 0.042, 0.28, 0x28589c, 0xe0a81e], // Bottom-left Blue & Gold
    [0.44, -0.28, 0.054, -0.16, 0x9e1c28, 0xd4af37], // Bottom-right Claret & Gold Victor Ludorum
  ];

  for (const [rx, ry, rad, tiltZ, outerHex, innerHex] of rosetteSpecs) {
    const rItem = new THREE.Group();
    rItem.name = 'outbuildings.barn.horseShowCertificates.rosette';
    rItem.position.set(rx, ry, certFrameD * 0.5 + 0.010);
    rItem.rotation.z = tiltZ;
    certGroup.add(rItem);

    const outerMat = new THREE.MeshStandardMaterial({
      color: outerHex,
      roughness: 0.42,
      metalness: 0.08,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: innerHex,
      roughness: 0.38,
      metalness: 0.12,
    });

    const pleatRing = new THREE.Mesh(
      new THREE.CylinderGeometry(rad, rad, 0.011, 24),
      outerMat
    );
    pleatRing.rotation.x = Math.PI / 2;
    rItem.add(pleatRing);

    const innerRing = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.68, rad * 0.68, 0.014, 20),
      innerMat
    );
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.set(0, 0, 0.002);
    rItem.add(innerRing);

    const goldCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.42, rad * 0.42, 0.017, 18),
      giltSlipMat
    );
    goldCenter.rotation.x = Math.PI / 2;
    goldCenter.position.set(0, 0, 0.004);
    rItem.add(goldCenter);

    for (const [tailSide, tailColorMat] of [
      [-1, outerMat],
      [0, innerMat],
      [1, outerMat],
    ] as const) {
      const tailLen = rad * (tailSide === 0 ? 1.85 : 1.65);
      const tailRibbon = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.36, tailLen, 0.005),
        tailColorMat
      );
      tailRibbon.position.set(tailSide * rad * 0.28, -rad * 0.75 - tailLen * 0.35, -0.002);
      tailRibbon.rotation.z = tailSide * 0.19;
      rItem.add(tailRibbon);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Issue #1 ("Samsung frame 55 inch on this wall, more task and ambient lighting in here"
  //    at `[-1.221, 0.434, 19.624]` -> Outbuilding `(u = 20.861m, y = 0.434m, v = 5.43m)`):
  //    55-Inch Samsung "The Frame" QLED 4K Art-Mode Smart TV (`outbuildings.barn.samsungFrame55`)
  //    flush-mounted on the Barn South Wall (`u = 20.28m, y = 0.46m, v = 5.416m`, facing North `-v`)!
  // ---------------------------------------------------------------------------
  const frameTvGroup = new THREE.Group();
  frameTvGroup.name = 'outbuildings.barn.samsungFrame55';
  frameTvGroup.userData.zone = 'courtyard';
  // 55" 16:9 outer dimensions: 1.238m W x 0.708m H x 0.025m D; spans u = 19.66..20.90m (covering u = 20.861m
  // while staying clear of the spiral staircase at u = 21.14m and the viewing bar stools at u = 18.88m!)
  frameTvGroup.position.set(20.28, 0.46, 5.416);
  frameTvGroup.rotation.y = Math.PI;
  groundGroup.add(frameTvGroup);

  const tvW = 1.238; // 55-inch Samsung The Frame exact width (48.7")
  const tvH = 0.708; // 55-inch Samsung The Frame exact height (27.9")
  const tvD = 0.025; // 24.9mm ultra-thin Slim-Fit depth
  const bezelW = 0.022;

  const samsungOakBezelMat = new THREE.MeshStandardMaterial({
    map: createTeakWoodTexture(),
    color: 0xd8b588,
    roughness: 0.38,
    metalness: 0.04,
  });
  const chassisAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.42,
    metalness: 0.65,
  });
  const cableSilverMat = new THREE.MeshStandardMaterial({
    color: 0xd8d5cc,
    roughness: 0.35,
    metalness: 0.25,
    transparent: true,
    opacity: 0.65,
  });

  // Slim-Fit zero-gap rear chassis backing plate
  const tvChassis = new THREE.Mesh(
    new THREE.BoxGeometry(tvW - 0.008, tvH - 0.008, tvD - 0.004),
    chassisAnthraciteMat
  );
  tvChassis.name = 'outbuildings.barn.samsungFrame55.chassis';
  tvChassis.position.set(0, 0, tvD * 0.5 - 0.002);
  tvChassis.castShadow = true;
  frameTvGroup.add(tvChassis);

  // Magnetic Customizable Warm-Oak Picture Frame Bezel (Top, Bottom, Left, Right mitered rails)
  for (const sideY of [-1, 1] as const) {
    const hBezel = new THREE.Mesh(
      new THREE.BoxGeometry(tvW, bezelW, tvD),
      samsungOakBezelMat
    );
    hBezel.name = 'outbuildings.barn.samsungFrame55.bezel';
    hBezel.position.set(0, sideY * (tvH * 0.5 - bezelW * 0.5), tvD * 0.5);
    hBezel.castShadow = true;
    frameTvGroup.add(hBezel);
  }
  for (const sideX of [-1, 1] as const) {
    const vBezel = new THREE.Mesh(
      new THREE.BoxGeometry(bezelW, tvH - bezelW * 2, tvD),
      samsungOakBezelMat
    );
    vBezel.name = 'outbuildings.barn.samsungFrame55.bezel';
    vBezel.position.set(sideX * (tvW * 0.5 - bezelW * 0.5), 0, tvD * 0.5);
    vBezel.castShadow = true;
    frameTvGroup.add(vBezel);
  }

  // Dark inner shadow sight-edge lip inside the oak bezel
  const innerLip = new THREE.Mesh(
    new THREE.BoxGeometry(tvW - bezelW * 2 + 0.004, tvH - bezelW * 2 + 0.004, tvD - 0.002),
    chassisAnthraciteMat
  );
  innerLip.position.set(0, 0, tvD * 0.5 - 0.001);
  frameTvGroup.add(innerLip);

  // Matte Anti-Glare Art Mode / Golf Broadcast QLED Screen (`outbuildings.barn.samsungFrame55.screen`)
  const frameScreenTex = createSamsungFrame55ScreenTexture();
  const frameScreenMat = new THREE.MeshStandardMaterial({
    map: frameScreenTex,
    emissiveMap: frameScreenTex,
    emissive: new THREE.Color(0xfff6e5),
    emissiveIntensity: 0.52,
    roughness: 0.62, // Signature Samsung Matte Display anti-reflection finish
    metalness: 0.02,
  });
  const screenPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(tvW - bezelW * 2, tvH - bezelW * 2),
    frameScreenMat
  );
  screenPlane.name = 'outbuildings.barn.samsungFrame55.screen';
  screenPlane.position.set(0, 0, tvD + 0.001);
  frameTvGroup.add(screenPlane);

  // Signature Samsung bottom-right ambient brightness & motion sensor module under the bottom bezel
  const sensorPod = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.009, 0.018),
    chassisAnthraciteMat
  );
  sensorPod.position.set(tvW * 0.34, -tvH * 0.5 - 0.0045, tvD * 0.5);
  frameTvGroup.add(sensorPod);

  // Translucent "One Invisible Connection" fiber-optic cable descending cleanly into a low wall grommet
  const oneConnectCable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0022, 0.0022, 0.62, 8),
    cableSilverMat
  );
  oneConnectCable.position.set(0, -tvH * 0.5 - 0.31, 0.004);
  frameTvGroup.add(oneConnectCable);

  // Soft warm-white QLED screen glow PointLight illuminating the area in front of the Samsung Frame TV
  const frameTvGlowLight = new THREE.PointLight(0xffeed2, 1.35, 4.2, 1.6);
  frameTvGlowLight.name = 'outbuildings.barn.samsungFrame55.glowLight';
  frameTvGlowLight.position.set(0, 0, 0.32);
  frameTvGroup.add(frameTvGlowLight);

  // ---------------------------------------------------------------------------
  // 4. Issue #1 ("...more task and ambient lighting in here"):
  //    Comprehensive Barn Ground-Floor Task & Ambient Lighting System (`outbuildings.barn.groundLighting`):
  //    - 3-Shade Brushed-Brass & Hunter-Green Billiard Table Task Chandelier (`outbuildings.barn.poolTableLight`)
  //    - 6 Recessed Warm-White Mezzanine Soffit Downlights (`outbuildings.barn.mezzanineDownlights`)
  //    - Warm 2700K Architectural LED Cove Grazing Strips (`outbuildings.barn.ambientCoveLed`) along the
  //      South wall cornice (washing the Samsung Frame TV wall!), North wall cornice, and Mezzanine front beam
  //    - 5 Brushed-Brass & Alabaster Up/Down Wall Sconces (`outbuildings.barn.wallSconce.1..5`) flanking the
  //      Samsung Frame TV, along the North wall, and beside the Stable glass door
  //    - 2 Brushed-Brass Gallery Picture Task Lights (`outbuildings.barn.pictureLight.1..2`) over the St Andrews
  //      and Horse Show Certificates artworks
  //    - 2 Warm-Brass & Ribbed-Glass Spectator Bar Pendant Task Lights (`outbuildings.barn.golfViewingBarPendants`)
  // ---------------------------------------------------------------------------
  const barnLightingGroup = new THREE.Group();
  barnLightingGroup.name = 'outbuildings.barn.groundLighting';
  barnLightingGroup.userData.zone = 'courtyard';
  groundGroup.add(barnLightingGroup);

  const ceilingFixtureParent = groundCeilingGroup ?? barnLightingGroup;
  const barnCeilingLightingGroup = new THREE.Group();
  barnCeilingLightingGroup.name = 'outbuildings.barn.groundCeilingLighting';
  barnCeilingLightingGroup.userData.zone = 'courtyard';
  ceilingFixtureParent.add(barnCeilingLightingGroup);

  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });
  const hunterGreenShadeMat = new THREE.MeshStandardMaterial({
    color: 0x164a2c,
    roughness: 0.32,
    metalness: 0.24,
    side: THREE.DoubleSide,
  });
  const warmAlabasterMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: new THREE.Color(0xffc46b),
    emissiveIntensity: 1.95,
    roughness: 0.22,
    metalness: 0.04,
  });
  const taskLedMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf0,
    emissive: new THREE.Color(0xffe6b8),
    emissiveIntensity: 2.3,
    roughness: 0.16,
  });
  const darkBronzeChannelMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.38,
    metalness: 0.72,
  });

  // 4A. 3-Shade Brushed-Brass & Hunter-Green Billiard Table Task Chandelier (`u = 20.38m, v = 2.08m`)
  const billiardLightGroup = new THREE.Group();
  billiardLightGroup.name = 'outbuildings.barn.poolTableLight';
  billiardLightGroup.position.set(20.38, 1.395, 2.08);
  barnCeilingLightingGroup.add(billiardLightGroup);

  // Ceiling canopy plate + twin vertical drop rods (`y = 0..-0.42m`, putting shades at `y = 0.90m` world = `1.575m` above carpet!)
  const canopyPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.022, 0.11),
    brushedBrassMat
  );
  canopyPlate.position.set(0, -0.011, 0);
  billiardLightGroup.add(canopyPlate);

  for (const rx of [-0.36, 0.36] as const) {
    const dropRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.38, 12),
      brushedBrassMat
    );
    dropRod.position.set(rx, -0.20, 0);
    billiardLightGroup.add(dropRod);
  }

  const billiardCrossBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 1.24, 16),
    brushedBrassMat
  );
  billiardCrossBar.rotation.z = Math.PI / 2;
  billiardCrossBar.position.set(0, -0.39, 0);
  billiardLightGroup.add(billiardCrossBar);

  for (const sx of [-0.52, 0, 0.52] as const) {
    const shadeCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.032, 0.045, 16),
      brushedBrassMat
    );
    shadeCollar.position.set(sx, -0.42, 0);
    billiardLightGroup.add(shadeCollar);

    const billiardShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.165, 0.14, 24, 1, true),
      hunterGreenShadeMat
    );
    billiardShade.name = 'outbuildings.barn.poolTableLight.shade';
    billiardShade.position.set(sx, -0.50, 0);
    billiardShade.castShadow = true;
    billiardLightGroup.add(billiardShade);

    const brassRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.165, 0.006, 10, 24),
      brushedBrassMat
    );
    brassRim.rotation.x = Math.PI / 2;
    brassRim.position.set(sx, -0.57, 0);
    billiardLightGroup.add(brassRim);

    const shadeBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 14, 12),
      taskLedMat
    );
    shadeBulb.position.set(sx, -0.52, 0);
    billiardLightGroup.add(shadeBulb);
  }

  // Dedicated Pool Table Task PointLight in `barnLightingGroup` (stays active in cutaway mode!)
  const poolTableTaskLight = new THREE.PointLight(0xfff0d4, 2.45, 6.2, 1.45);
  poolTableTaskLight.name = 'outbuildings.barn.poolTableLight.pointLight';
  poolTableTaskLight.position.set(20.38, 0.82, 2.08);
  barnLightingGroup.add(poolTableTaskLight);

  // 4B. 2 Warm-Brass & Ribbed-Alabaster Pendant Task Lights over the Golf Viewing Bar (`u = 18.42m, v = 4.04m & 5.00m`)
  // Issue #1 ("Put an arm / bracket on the mezzanine to hold the lights up" at `[-3.505, 1.384, 18.514]`, `outbuildings.barn.mezzanineFrontBeam`):
  // Because the Golf Viewing Bar (`u = 18.42m`) sits `0.26m` West (in front) of the Mezzanine front bressummer beam (`u = 18.68m, y = 1.29..1.428m`),
  // each pendant is held up by a bespoke Brushed-Brass & Blackened-Bronze Cantilever Bracket Arm (`outbuildings.barn.golfViewingBarPendant.bracket.1..2`)
  // bolted directly onto the West (`-u`) face of `outbuildings.barn.mezzanineFrontBeam` at `u = 18.68m` (`localX = +0.26m`)!
  // Attached to `barnLightingGroup` (`groundGroup`) so the brackets and pendant lights stay visible in both Ground and First-Floor cutaway modes!
  for (const [pIdx, pv] of [
    [1, 4.04],
    [2, 5.00],
  ] as const) {
    const barPendant = new THREE.Group();
    barPendant.name = `outbuildings.barn.golfViewingBarPendant.${pIdx}`;
    barPendant.position.set(18.42, 1.395, pv);
    barnLightingGroup.add(barPendant);

    const bracketGroup = new THREE.Group();
    bracketGroup.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}`;
    barPendant.add(bracketGroup);

    // 1. Chamfered Rectangular Mounting Backplate bolted flush against the West (`-u`) face of `mezzanineFrontBeam` (`u = 18.68m` -> `localX = +0.26m`)
    const beamBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.116, 0.068),
      darkBronzeChannelMat
    );
    beamBackplate.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.backplate`;
    beamBackplate.position.set(0.253, -0.036, 0);
    beamBackplate.castShadow = true;
    bracketGroup.add(beamBackplate);

    // 4 Brushed-brass coach bolt heads at the corners of the mounting backplate
    for (const [by, bz] of [
      [-0.076, -0.022],
      [-0.076, 0.022],
      [0.004, -0.022],
      [0.004, 0.022],
    ] as const) {
      const boltHead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.008, 8),
        brushedBrassMat
      );
      boltHead.rotation.z = Math.PI / 2;
      boltHead.position.set(0.244, by, bz);
      bracketGroup.add(boltHead);
    }

    // Turned brass wall/beam boss collar (`localX = +0.240m, localY = -0.006m`)
    const beamCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.018, 16),
      brushedBrassMat
    );
    beamCollar.rotation.z = Math.PI / 2;
    beamCollar.position.set(0.240, -0.006, 0);
    bracketGroup.add(beamCollar);

    // 2. Horizontal Cantilever Tubular Brass Arm projecting `0.26m` West from `u = 18.68m` (`localX = +0.255m`) out to `u = 18.42m` (`localX = -0.010m`)
    const cantileverArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.011, 0.265, 14),
      brushedBrassMat
    );
    cantileverArm.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.arm`;
    cantileverArm.rotation.z = Math.PI / 2;
    cantileverArm.position.set(0.1225, -0.006, 0);
    cantileverArm.castShadow = true;
    bracketGroup.add(cantileverArm);

    // 3. Angled Lower Structural Support Strut Brace running from the lower backplate (`localX = +0.246m, localY = -0.078m`) up to the cantilever arm (`localX = +0.058m, localY = -0.008m`)
    const strutDx = 0.246 - 0.058;
    const strutDy = -0.008 - (-0.078);
    const strutLen = Math.hypot(strutDx, strutDy);
    const strutBrace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, strutLen, 12),
      darkBronzeChannelMat
    );
    strutBrace.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.strut`;
    strutBrace.position.set((0.246 + 0.058) * 0.5, (-0.078 + -0.008) * 0.5, 0);
    strutBrace.rotation.z = Math.PI / 2 + Math.atan2(strutDy, strutDx);
    strutBrace.castShadow = true;
    bracketGroup.add(strutBrace);

    // Brushed-brass mid-arm knuckle ring where the diagonal strut meets the horizontal cantilever arm (`localX = +0.058m`)
    const strutKnuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.018, 14),
      brushedBrassMat
    );
    strutKnuckle.rotation.z = Math.PI / 2;
    strutKnuckle.position.set(0.058, -0.006, 0);
    bracketGroup.add(strutKnuckle);

    // 4. Turned Brushed-Brass Cord Knuckle & Top Acorn Finial at the cantilever tip (`localX = 0, localY = -0.006m`) holding the pendant cord
    const tipKnuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.026, 16),
      brushedBrassMat
    );
    tipKnuckle.position.set(0, -0.006, 0);
    bracketGroup.add(tipKnuckle);

    const tipFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 10),
      brushedBrassMat
    );
    tipFinial.position.set(0, 0.012, 0);
    bracketGroup.add(tipFinial);

    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.34, 10),
      brushedBrassMat
    );
    cord.position.set(0, -0.175, 0);
    barPendant.add(cord);

    const brassCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.042, 0.04, 16),
      brushedBrassMat
    );
    brassCap.position.set(0, -0.35, 0);
    barPendant.add(brassCap);

    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.15, 20),
      warmAlabasterMat
    );
    glassCylinder.position.set(0, -0.43, 0);
    barPendant.add(glassCylinder);
  }

  const golfBarTaskLight = new THREE.PointLight(0xffdfa8, 1.85, 4.8, 1.5);
  golfBarTaskLight.name = 'outbuildings.barn.golfViewingBar.taskLight';
  golfBarTaskLight.position.set(18.42, 0.85, 4.52);
  barnLightingGroup.add(golfBarTaskLight);

  // 4C. 6 Recessed Brushed-Brass Mezzanine Downlights (`y = 1.392m`) across the Lower Barn Ceiling
  const downlightCoords: ReadonlyArray<readonly [number, number]> = [
    [19.25, 1.05],
    [19.25, 2.85],
    [21.65, 1.05],
    [21.65, 2.85],
    [20.28, 3.85],
    [20.28, 4.95],
  ];
  for (let d = 0; d < downlightCoords.length; d++) {
    const [du, dv] = downlightCoords[d]!;
    const bezelRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.008, 18),
      brushedBrassMat
    );
    bezelRing.name = `outbuildings.barn.mezzanineDownlight.${d + 1}`;
    bezelRing.position.set(du, 1.392, dv);
    barnCeilingLightingGroup.add(bezelRing);

    const lensDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.01, 16),
      taskLedMat
    );
    lensDisc.position.set(du, 1.391, dv);
    barnCeilingLightingGroup.add(lensDisc);
  }

  // 4D. Warm 2700K Architectural LED Cove Grazing Strips (`outbuildings.barn.ambientCoveLed`)
  //     - South wall cornice cove (`u = 18.48..21.10m, y = 1.36m, v = 5.412m`) washing the Samsung Frame TV wall!
  //     - North wall cornice cove (`u = 18.48..22.90m, y = 1.36m, v = 0.298m`)
  //     - Mezzanine front bressummer beam cove (`u = 18.85m, y = 1.36m, v = 0.36..5.34m`)
  for (const [cName, cu, cy, cv, cw, cd] of [
    ['southWallCove', (18.48 + 21.10) * 0.5, 1.36, 5.412, 21.10 - 18.48, 0.022],
    ['northWallCove', (18.48 + 22.90) * 0.5, 1.36, 0.298, 22.90 - 18.48, 0.022],
    ['bressummerCove', 18.85, 1.36, 2.85, 0.022, 4.98],
  ] as const) {
    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(cw, 0.018, cd),
      darkBronzeChannelMat
    );
    channel.position.set(cu, cy + 0.006, cv);
    barnLightingGroup.add(channel);

    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.014, cw - 0.01), 0.01, Math.max(0.014, cd - 0.01)),
      warmAlabasterMat
    );
    ledStrip.name = `outbuildings.barn.ambientCoveLed.${cName}`;
    ledStrip.position.set(cu, cy, cv);
    barnLightingGroup.add(ledStrip);
  }

  // 4E. 5 Designer Brushed-Brass & Fluted-Alabaster Up/Down Wall Sconces (`outbuildings.barn.wallSconce.1..5`)
  //     - Sconces 1 & 2 flank the 55" Samsung Frame TV on the South Wall (`u = 19.44m` & `u = 21.08m, y = 0.50m, v = 5.418m`)
  //     - Sconce 3 on the North Wall (`u = 19.05m, y = 0.56m, v = 0.292m`)
  //     - Sconce 4 on the East Partition Wall beside the Stable Glass Door (`u = 23.005m, y = 0.52m, v = 1.56m`)
  //     - Sconce 5 on the West Limestone Bay North Wall (`u = 16.92m, y = 0.92m, v = 0.292m`)
  const wallSconceSpecs: ReadonlyArray<readonly [number, number, number, number, number]> = [
    [1, 19.44, 0.50, 5.418, Math.PI],
    [2, 21.08, 0.50, 5.418, Math.PI],
    [3, 19.05, 0.56, 0.292, 0],
    [4, 23.005, 0.52, 1.56, -Math.PI / 2],
    [5, 16.92, 0.92, 0.292, 0],
  ];
  for (const [sIdx, su, sy, sv, sRotY] of wallSconceSpecs) {
    const sconce = new THREE.Group();
    sconce.name = `outbuildings.barn.wallSconce.${sIdx}`;
    sconce.position.set(su, sy, sv);
    sconce.rotation.y = sRotY;
    barnLightingGroup.add(sconce);

    const wallPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.22, 0.014),
      brushedBrassMat
    );
    wallPlate.position.set(0, 0, 0.007);
    sconce.add(wallPlate);

    const alabasterCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.28, 16),
      warmAlabasterMat
    );
    alabasterCyl.name = `outbuildings.barn.wallSconce.${sIdx}.diffuser`;
    alabasterCyl.position.set(0, 0, 0.046);
    sconce.add(alabasterCyl);

    for (const bandY of [-0.085, 0, 0.085] as const) {
      const brassBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.016, 16),
        brushedBrassMat
      );
      brassBand.position.set(0, bandY, 0.046);
      sconce.add(brassBand);
    }
  }

  // 4F. 2 Brushed-Brass Gallery Picture Task Lights (`outbuildings.barn.pictureLight.1..2`)
  //     over the St Andrews Picture (`u = 17.64m, y = 1.45m, v = 0.295m`) & Horse Show Certificates (`u = 17.15m, y = 1.65m, v = 5.412m`)
  for (const [pIdx, pu, py, pv, pRotY, barW] of [
    [1, 17.64, 1.46, 0.295, 0, 0.44],
    [2, 17.15, 1.66, 5.412, Math.PI, 0.78],
  ] as const) {
    const picLight = new THREE.Group();
    picLight.name = `outbuildings.barn.pictureLight.${pIdx}`;
    picLight.position.set(pu, py, pv);
    picLight.rotation.y = pRotY;
    barnLightingGroup.add(picLight);

    const picBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.042, 0.014),
      brushedBrassMat
    );
    picBackplate.position.set(0, 0, 0.007);
    picLight.add(picBackplate);

    for (const ax of [-barW * 0.28, barW * 0.28] as const) {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.14, 10),
        brushedBrassMat
      );
      arm.rotation.x = Math.PI / 2;
      arm.position.set(ax, 0.01, 0.07);
      picLight.add(arm);
    }

    const hood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, barW, 14, 1, false, 0, Math.PI),
      brushedBrassMat
    );
    hood.rotation.z = Math.PI / 2;
    hood.position.set(0, 0.01, 0.14);
    picLight.add(hood);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(barW - 0.02, 0.008, 0.022),
      taskLedMat
    );
    diffuser.position.set(0, 0.002, 0.14);
    picLight.add(diffuser);
  }

  // Ambient & Task Fill PointLights in the West Limestone Lounge Bay (`u = 16.85m, v = 2.85m`) and South TV / Bar Zone (`u = 20.28m, v = 4.55m`)
  const westBayTaskLight = new THREE.PointLight(0xfff1d6, 2.1, 6.5, 1.45);
  westBayTaskLight.name = 'outbuildings.barn.westBayTaskLight';
  westBayTaskLight.position.set(16.85, 1.85, 2.85);
  barnLightingGroup.add(westBayTaskLight);

  const southWallAmbientLight = new THREE.PointLight(0xffcb80, 1.75, 5.5, 1.5);
  southWallAmbientLight.name = 'outbuildings.barn.southWallAmbientLight';
  southWallAmbientLight.position.set(20.28, 0.95, 4.65);
  barnLightingGroup.add(southWallAmbientLight);
}

// ============================================================================
// ISSUE #8: SMALL ENSUITE BATHROOM IN THE SW CORNER OF THE 1ST-FLOOR STABLE
// Hit Point: `[2.44, 2.08, 18.808]` -> Outbuilding `(u = 24.578m, y = 2.08m, v = 4.930m)`
// Includes:
// - Stud partition walls (`u = 23.22..25.32m, v = 3.68..5.428m`) rising to `stableUpperTopY = 3.32m`
//   with a hinged 4-panel light-oak door & brass lever handles at `u = 24.36..25.10m, v = 3.68m`
// - Honed Carrara marble tiled floor slab + brass door threshold strip
// - Corner Walk-In Glass Shower (`u = 23.23..24.13m, v = 4.52..5.42m`) with stone-resin tray,
//   frameless toughened glass screens, and brushed-brass rainfall & handheld thermostatic shower
// - Back-to-Wall Vitreous China Toilet (`u = 24.72m, v = 5.05m`) with concealed cistern boxing & brass flush plate
// - Fluted Light-Oak & Carrara Marble Vanity Sink Unit (`u = 23.48m, v = 4.08m`) with ceramic basin,
//   brushed-brass monobloc mixer tap, backlit brass pill mirror, and heated brass towel ladder
// ============================================================================
function createCarraraMarbleTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#edeae4';
    ctx.fillRect(0, 0, 512, 512);
    // Soft grey-taupe Calacatta/Carrara veins
    ctx.strokeStyle = 'rgba(145, 140, 132, 0.26)';
    for (let i = 0; i < 28; i++) {
      ctx.lineWidth = 1 + (i % 3) * 1.2;
      const x0 = (i * 47) % 512;
      const y0 = (i * 83) % 512;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x0 + 60, y0 + 25, x0 + 110, y0 - 20, x0 + 170, y0 + 35);
      ctx.stroke();
    }
    // Subtle 128px porcelain tile grout grid
    ctx.strokeStyle = 'rgba(180, 174, 165, 0.55)';
    ctx.lineWidth = 2;
    for (let g = 0; g <= 512; g += 128) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 512);
      ctx.moveTo(0, g);
      ctx.lineTo(512, g);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildStableUpperEnsuite(
  firstFloorGroup: THREE.Group,
  stableUpperFloorY: number,
  stableUpperTopY: number,
  lightJoineryOakMat: THREE.Material,
  warmRoomPlasterMat: THREE.Material,
  windowGlassMat: THREE.Material
): void {
  const ensuiteGroup = new THREE.Group();
  ensuiteGroup.name = 'outbuildings.firstFloor.stableEnsuite';
  ensuiteGroup.userData.zone = 'courtyard';
  firstFloorGroup.add(ensuiteGroup);

  const uWest = 23.22;
  const uEast = 25.32; // 2.10m wide along u (cleanly West of the u = 26.35m frosted South window!)
  const vNorth = 3.68; // Cleanly South of the v = 2.554..3.554m entrance stairs!
  const vSouth = 5.428; // 1.748m deep along v
  const wallT = 0.10;
  const wallH = stableUpperTopY - stableUpperFloorY; // 1.24m (from 2.08m to 3.32m cutaway eave line)

  const marbleTileMat = new THREE.MeshStandardMaterial({
    map: createCarraraMarbleTileTexture(),
    roughness: 0.26,
    metalness: 0.04,
  });
  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.14,
    metalness: 0.04,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });

  // 1. Honed Carrara Marble Tiled Ensuite Floor (`y = stableUpperFloorY + 0.006m`)
  const floorW = uEast - uWest - wallT * 0.5;
  const floorD = vSouth - vNorth - wallT * 0.5;
  const tiledFloor = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.012, floorD),
    marbleTileMat
  );
  tiledFloor.name = 'outbuildings.firstFloor.stableEnsuite.tiledFloor';
  tiledFloor.position.set(
    uWest + floorW * 0.5,
    stableUpperFloorY + 0.006,
    vNorth + wallT * 0.5 + floorD * 0.5
  );
  tiledFloor.receiveShadow = true;
  ensuiteGroup.add(tiledFloor);

  // 2. Partition Walls (`v = 3.68m` North wall with doorway at `u = 24.36..25.10m`, and `u = 25.32m` East wall)
  const doorU0 = 24.36;
  const doorU1 = 25.10; // 0.74m doorway opening
  const doorW = doorU1 - doorU0;

  // North wall West pier (`u = 23.22..24.36m`)
  const northWallWest = new THREE.Mesh(
    new THREE.BoxGeometry(doorU0 - uWest, wallH, wallT),
    warmRoomPlasterMat
  );
  northWallWest.name = 'outbuildings.firstFloor.stableEnsuite.northWallWest';
  northWallWest.userData.isArchitecturalShell = true;
  northWallWest.position.set((uWest + doorU0) * 0.5, stableUpperFloorY + wallH * 0.5, vNorth);
  northWallWest.castShadow = true;
  northWallWest.receiveShadow = true;
  ensuiteGroup.add(northWallWest);

  // North wall East pier (`u = 25.10..25.37m`)
  const northWallEast = new THREE.Mesh(
    new THREE.BoxGeometry(uEast + wallT * 0.5 - doorU1, wallH, wallT),
    warmRoomPlasterMat
  );
  northWallEast.name = 'outbuildings.firstFloor.stableEnsuite.northWallEast';
  northWallEast.userData.isArchitecturalShell = true;
  northWallEast.position.set((doorU1 + uEast + wallT * 0.5) * 0.5, stableUpperFloorY + wallH * 0.5, vNorth);
  northWallEast.castShadow = true;
  northWallEast.receiveShadow = true;
  ensuiteGroup.add(northWallEast);

  // East partition wall (`u = 25.32m, v = 3.68..5.428m`)
  const eastWallLenV = vSouth - vNorth;
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallT, wallH, eastWallLenV),
    warmRoomPlasterMat
  );
  eastWall.name = 'outbuildings.firstFloor.stableEnsuite.eastWall';
  eastWall.userData.isArchitecturalShell = true;
  eastWall.position.set(uEast, stableUpperFloorY + wallH * 0.5, (vNorth + vSouth) * 0.5);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  ensuiteGroup.add(eastWall);

  // Light-oak doorway jamb linings, brass threshold strip & hinged light-oak door leaf (slightly ajar at 24°)
  const thresholdStrip = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, 0.008, 0.045),
    brushedBrassMat
  );
  thresholdStrip.position.set((doorU0 + doorU1) * 0.5, stableUpperFloorY + 0.008, vNorth);
  ensuiteGroup.add(thresholdStrip);

  for (const jSide of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, wallH, wallT + 0.024),
      lightJoineryOakMat
    );
    jamb.position.set(
      (doorU0 + doorU1) * 0.5 + jSide * (doorW * 0.5 - 0.012),
      stableUpperFloorY + wallH * 0.5,
      vNorth
    );
    ensuiteGroup.add(jamb);
  }

  const doorPivot = new THREE.Group();
  doorPivot.name = 'outbuildings.firstFloor.stableEnsuite.door';
  doorPivot.position.set(doorU1 - 0.024, stableUpperFloorY + 0.01, vNorth + 0.02);
  doorPivot.rotation.y = -0.38; // Slightly ajar into the ensuite
  ensuiteGroup.add(doorPivot);

  const leafW = doorW - 0.048;
  const leafH = wallH - 0.02;
  const doorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(leafW, leafH, 0.042),
    lightJoineryOakMat
  );
  doorLeaf.position.set(-leafW * 0.5, leafH * 0.5, 0);
  doorLeaf.castShadow = true;
  doorPivot.add(doorLeaf);

  for (const hSideZ of [-0.032, 0.032] as const) {
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.016, 0.022),
      brushedBrassMat
    );
    lever.position.set(-leafW + 0.08, 0.94, hSideZ);
    doorPivot.add(lever);
  }

  // 3. Walk-In Corner Glass Shower (`outbuildings.firstFloor.stableEnsuite.shower`) in SW Corner (`u = 23.23..24.13m, v = 4.52..5.42m`)
  const showerGroup = new THREE.Group();
  showerGroup.name = 'outbuildings.firstFloor.stableEnsuite.shower';
  ensuiteGroup.add(showerGroup);

  const shW = 0.90;
  const shD = 0.90;
  const shCenterU = uWest + 0.01 + shW * 0.5; // 23.68m
  const shCenterV = vSouth - 0.01 - shD * 0.5; // 4.968m
  const glassTopH = wallH - 0.02; // 1.22m (aligns cleanly with cutaway wall height!)

  // White stone-resin low-profile shower tray + linear brass drain
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(shW, 0.042, shD),
    ceramicWhiteMat
  );
  showerTray.name = 'outbuildings.firstFloor.stableEnsuite.showerTray';
  showerTray.position.set(shCenterU, stableUpperFloorY + 0.025, shCenterV);
  showerTray.receiveShadow = true;
  showerGroup.add(showerTray);

  const linearDrain = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.004, 0.62),
    brushedBrassMat
  );
  linearDrain.position.set(uWest + 0.14, stableUpperFloorY + 0.048, shCenterV);
  showerGroup.add(linearDrain);

  // Full-height marble wall tile linings on West & South shower walls
  const westTilePanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, glassTopH, shD),
    marbleTileMat
  );
  westTilePanel.position.set(uWest + 0.008, stableUpperFloorY + glassTopH * 0.5, shCenterV);
  showerGroup.add(westTilePanel);

  const southTilePanel = new THREE.Mesh(
    new THREE.BoxGeometry(shW, glassTopH, 0.014),
    marbleTileMat
  );
  southTilePanel.position.set(shCenterU, stableUpperFloorY + glassTopH * 0.5, vSouth - 0.008);
  showerGroup.add(southTilePanel);

  // Frameless toughened glass East screen (`u = 24.13m`) & North glass door (`v = 4.52m`) with brushed-brass channels
  const eastGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, glassTopH - 0.04, shD - 0.02),
    windowGlassMat
  );
  eastGlass.name = 'outbuildings.firstFloor.stableEnsuite.showerGlass';
  eastGlass.position.set(uWest + shW, stableUpperFloorY + 0.04 + (glassTopH - 0.04) * 0.5, shCenterV);
  showerGroup.add(eastGlass);

  const northGlass = new THREE.Mesh(
    new THREE.BoxGeometry(shW - 0.02, glassTopH - 0.04, 0.014),
    windowGlassMat
  );
  northGlass.name = 'outbuildings.firstFloor.stableEnsuite.showerDoor';
  northGlass.position.set(shCenterU, stableUpperFloorY + 0.04 + (glassTopH - 0.04) * 0.5, vSouth - shD);
  showerGroup.add(northGlass);

  // Brushed-brass corner post, wall channels & door pull handle
  const cornerBrassPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, glassTopH - 0.02, 0.024),
    brushedBrassMat
  );
  cornerBrassPost.position.set(uWest + shW, stableUpperFloorY + 0.03 + (glassTopH - 0.02) * 0.5, vSouth - shD);
  showerGroup.add(cornerBrassPost);

  const showerPull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.34, 12),
    brushedBrassMat
  );
  showerPull.position.set(uWest + shW - 0.14, stableUpperFloorY + 0.78, vSouth - shD - 0.02);
  showerGroup.add(showerPull);

  // Brushed-brass thermostatic mixer valve, vertical riser rail & overhead rainfall shower rose on West shower wall
  const mixerPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.18, 0.11),
    brushedBrassMat
  );
  mixerPlate.position.set(uWest + 0.022, stableUpperFloorY + 0.88, shCenterV);
  showerGroup.add(mixerPlate);

  const riserPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.42, 12),
    brushedBrassMat
  );
  riserPipe.position.set(uWest + 0.045, stableUpperFloorY + 1.02, shCenterV);
  showerGroup.add(riserPipe);

  const showerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.34, 12),
    brushedBrassMat
  );
  showerArm.rotation.z = Math.PI / 2;
  showerArm.position.set(uWest + 0.21, stableUpperFloorY + 1.20, shCenterV);
  showerGroup.add(showerArm);

  const delugeHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.115, 0.014, 24),
    brushedBrassMat
  );
  delugeHead.name = 'outbuildings.firstFloor.stableEnsuite.showerHead';
  delugeHead.position.set(uWest + 0.36, stableUpperFloorY + 1.185, shCenterV);
  showerGroup.add(delugeHead);

  // 4. Back-to-Wall Vitreous China Toilet (`outbuildings.firstFloor.stableEnsuite.toilet`) on South Wall (`u = 24.72m, v = 5.05m`)
  const toiletGroup = new THREE.Group();
  toiletGroup.name = 'outbuildings.firstFloor.stableEnsuite.toilet';
  toiletGroup.position.set(24.72, stableUpperFloorY + 0.012, 5.05);
  ensuiteGroup.add(toiletGroup);

  // Concealed cistern marble & oak boxing against South wall (`v = 5.18..5.42m`)
  const cisternBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.94, 0.22),
    marbleTileMat
  );
  cisternBox.position.set(0, 0.47, 0.25);
  cisternBox.castShadow = true;
  cisternBox.receiveShadow = true;
  toiletGroup.add(cisternBox);

  const cisternOakShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.026, 0.24),
    lightJoineryOakMat
  );
  cisternOakShelf.position.set(0, 0.953, 0.245);
  toiletGroup.add(cisternOakShelf);

  // Brushed-brass dual-flush plate
  const flushPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.14, 0.012),
    brushedBrassMat
  );
  flushPlate.position.set(0, 0.78, 0.136);
  toiletGroup.add(flushPlate);

  // Sculpted ceramic toilet pan & seat (`facing North -z`)
  const wcPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.145, 0.38, 22),
    ceramicWhiteMat
  );
  wcPedestal.position.set(0, 0.19, -0.02);
  wcPedestal.scale.set(1.0, 1.0, 1.32);
  wcPedestal.castShadow = true;
  toiletGroup.add(wcPedestal);

  const wcRearShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.38, 0.24),
    ceramicWhiteMat
  );
  wcRearShroud.position.set(0, 0.19, 0.06);
  toiletGroup.add(wcRearShroud);

  const wcSeatRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175, 0.168, 0.032, 24),
    ceramicWhiteMat
  );
  wcSeatRim.position.set(0, 0.395, -0.02);
  wcSeatRim.scale.set(1.0, 1.0, 1.34);
  toiletGroup.add(wcSeatRim);

  const wcBowlWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.10, 0.012, 20),
    new THREE.MeshStandardMaterial({ color: 0xd6eef8, roughness: 0.08, metalness: 0.1 })
  );
  wcBowlWater.position.set(0, 0.385, -0.03);
  wcBowlWater.scale.set(1.0, 1.0, 1.25);
  toiletGroup.add(wcBowlWater);

  // 5. Light-Oak & Carrara Marble Vanity Sink Unit (`outbuildings.firstFloor.stableEnsuite.vanitySink`) on West Wall (`u = 23.46m, v = 4.12m`)
  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink';
  vanityGroup.position.set(uWest + 0.23, stableUpperFloorY + 0.012, 4.12);
  ensuiteGroup.add(vanityGroup);

  const vanD = 0.42; // along u
  const vanW = 0.62; // along v
  const vanH = 0.80;

  // Oak vanity cabinet carcass & 2 drawer fronts with brass bar pulls
  const vanCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(vanD, vanH - 0.14, vanW),
    lightJoineryOakMat
  );
  vanCabinet.position.set(0, 0.12 + (vanH - 0.14) * 0.5, 0);
  vanCabinet.castShadow = true;
  vanCabinet.receiveShadow = true;
  vanityGroup.add(vanCabinet);

  for (const dy of [0.29, 0.61] as const) {
    const drawerFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.28, vanW - 0.04),
      lightJoineryOakMat
    );
    drawerFront.position.set(vanD * 0.5 + 0.008, dy, 0);
    vanityGroup.add(drawerFront);

    const pullBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.18, 10),
      brushedBrassMat
    );
    pullBar.rotation.x = Math.PI / 2;
    pullBar.position.set(vanD * 0.5 + 0.028, dy + 0.08, 0);
    vanityGroup.add(pullBar);
  }

  // Carrara marble vanity top & ceramic basin
  const vanMarbleTop = new THREE.Mesh(
    new THREE.BoxGeometry(vanD + 0.024, 0.032, vanW + 0.024),
    marbleTileMat
  );
  vanMarbleTop.position.set(0.006, vanH, 0);
  vanMarbleTop.castShadow = true;
  vanityGroup.add(vanMarbleTop);

  const sinkBasinRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.135, 0.055, 24),
    ceramicWhiteMat
  );
  sinkBasinRim.name = 'outbuildings.firstFloor.stableEnsuite.sinkBasin';
  sinkBasinRim.position.set(0.02, vanH + 0.028, 0);
  sinkBasinRim.scale.set(0.88, 1.0, 1.22);
  vanityGroup.add(sinkBasinRim);

  const sinkWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.11, 0.016, 22),
    new THREE.MeshStandardMaterial({ color: 0xe2e6ea, roughness: 0.2 })
  );
  sinkWell.position.set(0.02, vanH + 0.050, 0);
  sinkWell.scale.set(0.86, 1.0, 1.20);
  vanityGroup.add(sinkWell);

  const sinkDrainPlug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.006, 14),
    brushedBrassMat
  );
  sinkDrainPlug.position.set(0.02, vanH + 0.056, 0);
  vanityGroup.add(sinkDrainPlug);

  // Brushed-brass monobloc basin mixer tap
  const tapBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.020, 0.14, 14),
    brushedBrassMat
  );
  tapBody.position.set(-vanD * 0.5 + 0.065, vanH + 0.085, 0);
  vanityGroup.add(tapBody);

  const tapSpout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.010, 0.010, 0.11, 12),
    brushedBrassMat
  );
  tapSpout.rotation.z = -Math.PI * 0.42;
  tapSpout.position.set(-vanD * 0.5 + 0.115, vanH + 0.135, 0);
  vanityGroup.add(tapSpout);

  // Backlit Brass Pill Mirror on the West wall above the vanity (`y = stableUpperFloorY + 1.06m`)
  const mirrorFrame = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.018, 24),
    brushedBrassMat
  );
  mirrorFrame.name = 'outbuildings.firstFloor.stableEnsuite.mirror';
  mirrorFrame.rotation.z = Math.PI / 2;
  mirrorFrame.position.set(-vanD * 0.5 - 0.008, 1.04, 0);
  vanityGroup.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.166, 0.166, 0.022, 24),
    new THREE.MeshStandardMaterial({ color: 0xdce8f2, roughness: 0.05, metalness: 0.92 })
  );
  mirrorGlass.rotation.z = Math.PI / 2;
  mirrorGlass.position.set(-vanD * 0.5 - 0.006, 1.04, 0);
  vanityGroup.add(mirrorGlass);

  // Brushed-brass heated towel rail ladder on the East wall (`u = 25.25m, v = 4.42m`) + Warm Ensuite PointLight
  const towelRailGroup = new THREE.Group();
  towelRailGroup.name = 'outbuildings.firstFloor.stableEnsuite.towelRail';
  towelRailGroup.position.set(uEast - 0.065, stableUpperFloorY + 0.68, 4.42);
  ensuiteGroup.add(towelRailGroup);

  for (const tv of [-0.20, 0.20] as const) {
    const vUpright = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.72, 12),
      brushedBrassMat
    );
    vUpright.position.set(0, 0, tv);
    towelRailGroup.add(vUpright);
  }
  for (let r = -3; r <= 3; r++) {
    const hRung = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.40, 10),
      brushedBrassMat
    );
    hRung.rotation.x = Math.PI / 2;
    hRung.position.set(0, r * 0.095, 0);
    towelRailGroup.add(hRung);
  }

  const ensuiteLight = new THREE.PointLight(0xffd488, 1.6, 3.8, 1.6);
  ensuiteLight.name = 'outbuildings.firstFloor.stableEnsuite.light';
  ensuiteLight.position.set(24.25, stableUpperFloorY + 1.15, 4.55);
  ensuiteGroup.add(ensuiteLight);
}

// ============================================================================
// ISSUE #10: CORNER BAR WITH BEER ON TAP & MASTER-BEDROOM-STYLE MINI-FRIDGE
// Hit Point: `[0.516, -0.316, 14.617]` -> Outbuilding `(u = 23.020m, y = -0.316m, v = 0.590m)`
// Built in the NE corner of the sunken East Barn floor (`u = 21.88..23.01m, v = 0.30..1.42m, y = barnCarpetTopY = -0.675m`):
// - Heritage hunter-green fluted bar peninsula & back-bar credenza with solid light-oak bullnose countertop
//   and brushed-brass wrap-around footrail
// - Under-counter Glazed Wine & Beverage Mini-Fridge (`outbuildings.barn.cornerBar.miniFridge`) matching the
//   Master Bedroom / Upper Passage `familyBathroom.drinksCabinet.wineCooler` (dark anthracite shell, warm LED strip,
//   3 beechwood shelves, chilled Champagne, San Pellegrino, square Fiji Water & craft beer / DASH cans behind a
//   brushed-chrome & low-iron glass door with vertical brass handle!)
// - Twin-Tap Brass & Chrome Draught Beer Font Tower (`outbuildings.barn.cornerBar.beerTap`) with 2 traditional
//   ceramic/brass beer pump handles, stainless drip tray, and 2 freshly poured pints of golden draught beer
// - Illuminated Back-Bar Spirit Shelves, stemware hanger rack, and 2 tan-leather & brass bar stools
// ============================================================================
export function buildBarnCornerBar(
  groundGroup: THREE.Group,
  barnCarpetTopY: number,
  lightJoineryOakMat: THREE.Material,
  windowGlassMat: THREE.Material
): void {
  const barGroup = new THREE.Group();
  barGroup.name = 'outbuildings.barn.cornerBar';
  barGroup.userData.zone = 'courtyard';
  // Flat against the East Barn/Stable partition wall (`u = 23.01m`) in the NE corner (`v = 0.30..1.44m`,
  // projecting only `0.55m` West to `u = 22.46m` as a space-saving self-serve bar counter; no walk-behind gap or stools).
  barGroup.position.set(22.73, barnCarpetTopY, 0.87);
  groundGroup.add(barGroup);

  const heritageGreenMat = new THREE.MeshStandardMaterial({
    color: 0x1d3828,
    roughness: 0.42,
    metalness: 0.04,
  });
  const darkAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.35,
    metalness: 0.65,
  });
  const brushedChromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    roughness: 0.22,
    metalness: 0.88,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });
  const beechShelfMat = new THREE.MeshStandardMaterial({
    color: 0xc89d6c,
    roughness: 0.55,
    metalness: 0.05,
  });
  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.18,
    metalness: 0.04,
  });
  const warmLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff1d0,
    emissive: 0xffd28a,
    emissiveIntensity: 1.45,
    roughness: 0.2,
  });

  const barH = 0.94;
  const barDepthX = 0.54;
  const barLenZ = 1.14;

  // 1. Self-Serve Counter Base Carcass (flat against the East wall):
  //    - North Keg Cabinet Bay (`z = -0.57..-0.19m`, width `0.38m`) with fluted hunter-green front door
  //    - South Mini-Fridge Housing Bay (`z = -0.19..+0.57m`, width `0.76m`)
  const kegBayW = 0.38;
  const kegCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(barDepthX - 0.02, barH - 0.04, kegBayW),
    heritageGreenMat
  );
  kegCarcass.name = 'outbuildings.barn.cornerBar.counterCarcass';
  kegCarcass.position.set(0.01, (barH - 0.04) * 0.5, -barLenZ * 0.5 + kegBayW * 0.5);
  kegCarcass.castShadow = true;
  kegCarcass.receiveShadow = true;
  barGroup.add(kegCarcass);

  // Vertical fluted timber ribs on the West (`-x`) face of the North keg bay
  for (let r = 0; r < 5; r++) {
    const rz = -barLenZ * 0.5 + 0.045 + r * 0.072;
    const flute = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, barH - 0.14, 10),
      heritageGreenMat
    );
    flute.position.set(-barDepthX * 0.5 + 0.015, barH * 0.5 - 0.02, rz);
    barGroup.add(flute);
  }

  // Brushed-brass handle on the keg cupboard door
  const kegDoorHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.16, 10),
    brushedBrassMat
  );
  kegDoorHandle.position.set(-barDepthX * 0.5 - 0.008, barH * 0.5 + 0.12, -0.24);
  barGroup.add(kegDoorHandle);

  // South end panel (`z = +0.555m`) framing the mini-fridge cleanly next to the Stable glass door
  const southEndPanel = new THREE.Mesh(
    new THREE.BoxGeometry(barDepthX - 0.02, barH - 0.04, 0.03),
    heritageGreenMat
  );
  southEndPanel.position.set(0.01, (barH - 0.04) * 0.5, barLenZ * 0.5 - 0.015);
  southEndPanel.castShadow = true;
  barGroup.add(southEndPanel);

  // Continuous Solid Light-Oak Bullnose Self-Serve Countertop (`y = barH - 0.02m`) + Rear Oak Upstand
  const oakCountertop = new THREE.Mesh(
    new THREE.BoxGeometry(barDepthX + 0.03, 0.042, barLenZ + 0.02),
    lightJoineryOakMat
  );
  oakCountertop.name = 'outbuildings.barn.cornerBar.oakCountertop';
  oakCountertop.position.set(-0.005, barH - 0.02, 0);
  oakCountertop.castShadow = true;
  oakCountertop.receiveShadow = true;
  barGroup.add(oakCountertop);

  const rearOakUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.065, barLenZ + 0.02),
    lightJoineryOakMat
  );
  rearOakUpstand.position.set(barDepthX * 0.5 - 0.002, barH + 0.032, 0);
  barGroup.add(rearOakUpstand);

  // 2. Under-Counter Glazed Wine & Beverage Mini-Fridge (`outbuildings.barn.cornerBar.miniFridge`)
  //    Built flush into the front (`-x`) of the self-serve wall counter (`z = +0.18m`, facing West `-x` into the Barn!)
  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'outbuildings.barn.cornerBar.miniFridge';
  coolerGroup.position.set(0.0, 0.02, 0.18);
  coolerGroup.rotation.y = -Math.PI / 2; // Local `+z` front of cooler faces `-x` (West into the Barn!)
  barGroup.add(coolerGroup);

  const coolerW = 0.70;
  const coolerH = 0.86;
  const coolerD = 0.50;

  const coolerShellBack = new THREE.Mesh(
    new THREE.BoxGeometry(coolerW, coolerH, 0.03),
    darkAnthraciteMat
  );
  coolerShellBack.position.set(0, coolerH * 0.5, -coolerD * 0.5 + 0.015);
  coolerGroup.add(coolerShellBack);

  for (const [cy, ch] of [
    [coolerH - 0.018, 0.036],
    [0.022, 0.044],
  ] as const) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(coolerW, ch, coolerD),
      darkAnthraciteMat
    );
    plate.position.set(0, cy, 0);
    coolerGroup.add(plate);
  }
  for (const sSide of [-1, 1] as const) {
    const sideWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, coolerH, coolerD),
      darkAnthraciteMat
    );
    sideWall.position.set(sSide * (coolerW * 0.5 - 0.018), coolerH * 0.5, 0);
    coolerGroup.add(sideWall);
  }

  // Internal warm LED light strip at top of mini-fridge
  const coolerLed = new THREE.Mesh(
    new THREE.BoxGeometry(coolerW - 0.08, 0.010, 0.024),
    warmLedMat
  );
  coolerLed.position.set(0, coolerH - 0.042, coolerD * 0.5 - 0.06);
  coolerGroup.add(coolerLed);

  // 3 Beechwood pull-out shelves inside the mini-fridge
  for (const sy of [0.06, 0.31, 0.57] as const) {
    const bShelf = new THREE.Mesh(
      new THREE.BoxGeometry(coolerW - 0.08, 0.016, coolerD - 0.08),
      beechShelfMat
    );
    bShelf.position.set(0, sy, -0.01);
    coolerGroup.add(bShelf);
  }

  // Stocked Drinks inside the Mini-Fridge (matching Master Bedroom / Upper Passage cooler + craft beer!):
  const champagneGlassMat = new THREE.MeshStandardMaterial({ color: 0x182c1b, roughness: 0.14, metalness: 0.15 });
  const sanPellegrinoGlassMat = new THREE.MeshStandardMaterial({ color: 0x1d5e3a, roughness: 0.12, metalness: 0.1 });
  const fijiBottleMat = new THREE.MeshStandardMaterial({
    color: 0xd0eefc,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });
  const canPalette = [0xe86c8d, 0xf2a663, 0x7bc496, 0xf2d65b, 0x1e5aa8, 0xc92a2a];

  // Bottom shelf: 5 horizontal chilled Champagne & Craft Ale bottles with gold foil necks
  for (let i = 0; i < 5; i++) {
    const bx = -0.22 + i * 0.11;
    const bBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.18, 12),
      champagneGlassMat
    );
    bBody.rotation.x = Math.PI / 2;
    bBody.position.set(bx, 0.11, -0.04);
    coolerGroup.add(bBody);

    const bFoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.022, 0.065, 12),
      brushedBrassMat
    );
    bFoil.rotation.x = Math.PI / 2;
    bFoil.position.set(bx, 0.11, 0.08);
    coolerGroup.add(bFoil);
  }

  // Middle shelf: San Pellegrino bottles (left) & Square Fiji Water bottles (right)
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.032, 0.17, 12),
      sanPellegrinoGlassMat
    );
    sp.position.set(-0.22 + i * 0.09, 0.405, 0.06);
    coolerGroup.add(sp);

    const fiji = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.165, 0.058),
      fijiBottleMat
    );
    fiji.position.set(0.06 + i * 0.09, 0.405, 0.06);
    coolerGroup.add(fiji);
  }

  // Top shelf: 6 chilled craft beer & DASH sparkling water cans
  for (let c = 0; c < 6; c++) {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.112, 12),
      new THREE.MeshStandardMaterial({ color: canPalette[c % canPalette.length], roughness: 0.24, metalness: 0.45 })
    );
    can.position.set(-0.225 + c * 0.09, 0.64, 0.06);
    coolerGroup.add(can);
  }

  // Glazed Mini-Fridge Front Door Frame, Double-Glazed Tinted Glass & Vertical Brushed-Chrome Handle
  const doorZ = coolerD * 0.5 - 0.008;
  for (const [dy, dh] of [
    [coolerH - 0.022, 0.044],
    [0.022, 0.044],
  ] as const) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(coolerW - 0.01, dh, 0.022), darkAnthraciteMat);
    rail.position.set(0, dy, doorZ);
    coolerGroup.add(rail);
  }
  for (const sSide of [-1, 1] as const) {
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.044, coolerH - 0.088, 0.022), darkAnthraciteMat);
    stile.position.set(sSide * (coolerW * 0.5 - 0.027), coolerH * 0.5, doorZ);
    coolerGroup.add(stile);
  }

  const coolerGlass = new THREE.Mesh(
    new THREE.BoxGeometry(coolerW - 0.096, coolerH - 0.088, 0.008),
    windowGlassMat
  );
  coolerGlass.name = 'outbuildings.barn.cornerBar.miniFridge.glassDoor';
  coolerGlass.position.set(0, coolerH * 0.5, doorZ);
  coolerGroup.add(coolerGlass);

  const fridgeHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.42, 12),
    brushedChromeMat
  );
  fridgeHandle.position.set(-coolerW * 0.5 + 0.032, coolerH * 0.5 + 0.04, doorZ + 0.026);
  coolerGroup.add(fridgeHandle);

  // 3. Twin-Tap Brushed-Brass & Chrome Draught Beer Font Tower (`outbuildings.barn.cornerBar.beerTap`)
  //    Mounted directly on the self-serve oak counter above the North keg bay (`z = -0.34m`)
  const tapGroup = new THREE.Group();
  tapGroup.name = 'outbuildings.barn.cornerBar.beerTap';
  tapGroup.position.set(0.02, barH + 0.001, -0.34);
  barGroup.add(tapGroup);

  // Perforated stainless-steel drip tray recessed on the front of the counter under the spouts
  const dripTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.014, 0.32),
    brushedChromeMat
  );
  dripTray.position.set(-0.10, 0.007, 0);
  tapGroup.add(dripTray);

  // Brass & chrome T-bar draught font column (`height = 0.32m`) + horizontal cross-arm (`0.24m` wide)
  const fontBaseFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.062, 0.022, 20),
    brushedBrassMat
  );
  fontBaseFlange.position.set(0.04, 0.011, 0);
  tapGroup.add(fontBaseFlange);

  const fontColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.040, 0.32, 20),
    brushedBrassMat
  );
  fontColumn.position.set(0.04, 0.17, 0);
  fontColumn.castShadow = true;
  tapGroup.add(fontColumn);

  const fontCrossBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.24, 18),
    brushedBrassMat
  );
  fontCrossBar.rotation.x = Math.PI / 2;
  fontCrossBar.position.set(0.02, 0.31, 0);
  tapGroup.add(fontCrossBar);

  // 2 Draught Beer Spouts, Traditional Tall Ceramic Pump Handles & Brewery Badges (IPA & Pilsner)
  for (const [tapZ, badgeCol] of [
    [-0.085, 0xb82424], // Crox Gold IPA
    [0.085, 0x1e4d8c],  // Chiltern Pilsner
  ] as const) {
    const spout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.011, 0.085, 12),
      brushedChromeMat
    );
    spout.rotation.z = 0.45;
    spout.position.set(-0.035, 0.285, tapZ);
    tapGroup.add(spout);

    const handleGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.009, 0.16, 14),
      ceramicWhiteMat
    );
    handleGrip.rotation.z = 0.18;
    handleGrip.position.set(-0.025, 0.40, tapZ);
    handleGrip.castShadow = true;
    tapGroup.add(handleGrip);

    const pumpBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.008, 16),
      new THREE.MeshStandardMaterial({ color: badgeCol, roughness: 0.3 })
    );
    pumpBadge.rotation.z = Math.PI / 2;
    pumpBadge.position.set(-0.042, 0.42, tapZ);
    tapGroup.add(pumpBadge);
  }

  // 2 Freshly Poured Pint Glasses of Golden Draught Beer with Creamy Foam Heads on the Self-Serve Counter
  const beerLiquidMat = new THREE.MeshStandardMaterial({
    color: 0xd98a1e,
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
  });
  for (const [px, pz] of [
    [-0.08, 0.36],
    [-0.04, 0.54],
  ] as const) {
    const pintLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.029, 0.115, 16),
      beerLiquidMat
    );
    pintLiquid.position.set(px, 0.062, pz);
    tapGroup.add(pintLiquid);

    const foamHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.037, 0.036, 0.026, 16),
      ceramicWhiteMat
    );
    foamHead.position.set(px, 0.132, pz);
    tapGroup.add(foamHead);
  }

  // 4. Illuminated Wall-Mounted Oak Spirit & Glassware Shelves (`x = +0.16m, y = 1.42m & 1.72m`) & Warm Bar PointLight
  for (const [sIdx, shelfY] of [1.42, 1.72].entries()) {
    const backShelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.026, 0.72),
      lightJoineryOakMat
    );
    backShelf.position.set(0.16, shelfY, 0.14);
    backShelf.castShadow = true;
    barGroup.add(backShelf);

    const shelfLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.008, 0.66),
      warmLedMat
    );
    shelfLed.position.set(0.08, shelfY - 0.015, 0.14);
    barGroup.add(shelfLed);

    for (let b = 0; b < 4; b++) {
      const bz = -0.10 + b * 0.16;
      const spiritBottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.034, 0.19 - (b % 2) * 0.02, 12),
        b % 2 === 0 ? sanPellegrinoGlassMat : champagneGlassMat
      );
      spiritBottle.position.set(0.16, shelfY + 0.10 + (sIdx * 0.002), bz);
      barGroup.add(spiritBottle);
    }
  }

  const barLight = new THREE.PointLight(0xffc978, 1.75, 4.2, 1.55);
  barLight.name = 'outbuildings.barn.cornerBar.light';
  barLight.position.set(-0.15, 1.58, 0);
  barGroup.add(barLight);
}

// ============================================================================
// ISSUE #12: 7FT TOURNAMENT SLATE-BED POOL TABLE ON THE SUNKEN EAST BARN FLOOR
// Hit Point: `[-1.537, -0.675, 16.19]` -> Outbuilding `(u = 20.840m, y = -0.675m, v = 1.981m)`
// Centered at `(u = 20.48m, y = barnCarpetTopY = -0.675m, v = 2.22m)` with full cueing clearance:
// - Turned solid light-oak legs with brushed-brass levelling feet
// - Solid light-oak cabinet apron & wide polished cushion rails with mother-of-pearl sights
// - 6 Brushed-brass & saddle-leather drop pockets (4 corners + 2 center side pockets)
// - Championship West of England tournament green baize bed with balk line & D-zone markings
// - Full 15-ball rack of red & yellow pool balls + black 8-ball, white cue ball, oak triangle rack,
//   2 two-piece ash/ebony pool cues, and blue chalk cubes!
// ============================================================================
function createPoolTableBaizeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rich Strachan 6811 tournament green baize cloth
    const grad = ctx.createRadialGradient(512, 256, 80, 512, 256, 560);
    grad.addColorStop(0, '#1e7840');
    grad.addColorStop(0.7, '#186435');
    grad.addColorStop(1, '#124e28');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle directional wool nap micro-grain
    for (let i = 0; i < 6000; i++) {
      const gx = (i * 89) % 1024;
      const gy = (i * 131) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)';
      ctx.fillRect(gx, gy, 4, 2);
    }

    // Crisp white baize balk line (`x = 220`) & D-semicircle (`r = 92px` opening toward head end `x < 220`)
    ctx.strokeStyle = 'rgba(245, 245, 240, 0.78)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 0);
    ctx.lineTo(220, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(220, 256, 92, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Foot spot (`x = 768, y = 256`) & center spot (`x = 512, y = 256`)
    ctx.fillStyle = '#111111';
    for (const sx of [512, 768]) {
      ctx.beginPath();
      ctx.arc(sx, 256, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildBarnPoolTable(
  groundGroup: THREE.Group,
  barnCarpetTopY: number,
  lightJoineryOakMat: THREE.Material
): void {
  const poolGroup = new THREE.Group();
  poolGroup.name = 'outbuildings.barn.poolTable';
  poolGroup.userData.zone = 'courtyard';
  // Issue #2 & Issue #8 ([OBJECT MOVE / ROTATE]: Move `outbuildings.barn.poolTable` to `[20.38, -0.675, 2.08]`,
  // rotated East-West `rotation.y = Math.PI`, and scaled to a standard 7ft x 4ft (`2.12m x 1.20m`) UK Domestic English Pool Table!):
  poolGroup.position.set(20.38, barnCarpetTopY, 2.08);
  poolGroup.rotation.y = Math.PI;
  groundGroup.add(poolGroup);

  const tableL = 2.12; // Standard 7ft UK domestic English pool table outer length (7ft / 2.12m)
  const tableW = 1.20; // Standard 7ft UK domestic English pool table outer width (4ft / 1.20m)
  const tableH = 0.79; // Regulation UK playing height (31 inches)
  const railW = 0.105; // 4-1/8 inch solid oak cushion rails
  const playL = tableL - railW * 2; // 1.91m (75-inch playing length)
  const playW = tableW - railW * 2; // 0.99m (39-inch playing width)
  const bedY = tableH - 0.036; // 0.754m slate bed level

  const baizeMat = new THREE.MeshStandardMaterial({
    map: createPoolTableBaizeTexture(),
    roughness: 0.78,
    metalness: 0.02,
  });
  const cushionGreenMat = new THREE.MeshStandardMaterial({
    color: 0x165e32,
    roughness: 0.74,
    metalness: 0.02,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });
  const pocketLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x3d2415,
    roughness: 0.56,
    metalness: 0.05,
  });
  const pocketHoleMat = new THREE.MeshStandardMaterial({
    color: 0x090b0a,
    roughness: 0.92,
  });

  // 1. 4 Turned Solid Light-Oak Corner Legs (standard 7ft UK pool table) with Brushed-Brass Levelling Feet
  const legOffsetX = tableL * 0.5 - 0.15;
  const legOffsetZ = tableW * 0.5 - 0.14;
  const legH = tableH - 0.21; // 0.58m up to cabinet apron

  for (const lx of [-legOffsetX, legOffsetX] as const) {
    for (const lz of [-legOffsetZ, legOffsetZ] as const) {
      const brassToe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.054, 0.046, 18),
        brushedBrassMat
      );
      brassToe.position.set(lx, 0.023, lz);
      poolGroup.add(brassToe);

      const turnedLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.066, 0.046, legH, 20),
        lightJoineryOakMat
      );
      turnedLeg.name = 'outbuildings.barn.poolTable.leg';
      turnedLeg.position.set(lx, 0.046 + legH * 0.5, lz);
      turnedLeg.castShadow = true;
      turnedLeg.receiveShadow = true;
      poolGroup.add(turnedLeg);
    }
  }

  // 2. Deep Solid Light-Oak Cabinet Apron (`y = 0.56..0.754m`)
  const apronCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(tableL - 0.06, 0.19, tableW - 0.06),
    lightJoineryOakMat
  );
  apronCarcass.name = 'outbuildings.barn.poolTable.cabinet';
  apronCarcass.position.set(0, tableH - 0.132, 0);
  apronCarcass.castShadow = true;
  apronCarcass.receiveShadow = true;
  poolGroup.add(apronCarcass);

  // 3. Slate Playing Bed Covered in Championship Green Baize (`outbuildings.barn.poolTable.baizeBed`)
  const baizeBed = new THREE.Mesh(
    new THREE.BoxGeometry(playL + 0.04, 0.022, playW + 0.04),
    baizeMat
  );
  baizeBed.name = 'outbuildings.barn.poolTable.baizeBed';
  baizeBed.position.set(0, bedY, 0);
  baizeBed.receiveShadow = true;
  poolGroup.add(baizeBed);

  // 4. Polished Light-Oak Top Cushion Rails & Green Rubber Cushions (`y = bedY..tableH`)
  const railH = 0.040;
  const railCenterY = tableH - railH * 0.5 + 0.004;
  for (const sideZ of [-1, 1] as const) {
    const rz = sideZ * (tableW * 0.5 - railW * 0.5);
    const longRail = new THREE.Mesh(
      new THREE.BoxGeometry(tableL, railH, railW),
      lightJoineryOakMat
    );
    longRail.name = 'outbuildings.barn.poolTable.rail';
    longRail.position.set(0, railCenterY, rz);
    longRail.castShadow = true;
    longRail.receiveShadow = true;
    poolGroup.add(longRail);

    // 2 green rubber L-cushions along each long side (split by center pocket)
    for (const segX of [-playL * 0.25, playL * 0.25] as const) {
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(playL * 0.43, 0.030, 0.028),
        cushionGreenMat
      );
      cushion.position.set(segX, bedY + 0.021, sideZ * (playW * 0.5 - 0.011));
      poolGroup.add(cushion);
    }
  }

  for (const sideX of [-1, 1] as const) {
    const rx = sideX * (tableL * 0.5 - railW * 0.5);
    const shortRail = new THREE.Mesh(
      new THREE.BoxGeometry(railW, railH, tableW - railW * 2),
      lightJoineryOakMat
    );
    shortRail.name = 'outbuildings.barn.poolTable.rail';
    shortRail.position.set(rx, railCenterY, 0);
    shortRail.castShadow = true;
    shortRail.receiveShadow = true;
    poolGroup.add(shortRail);

    const endCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.030, playW - 0.10),
      cushionGreenMat
    );
    endCushion.position.set(sideX * (playL * 0.5 - 0.011), bedY + 0.021, 0);
    poolGroup.add(endCushion);
  }

  // 5. 6 Brushed-Brass & Saddle-Leather Drop Pockets (4 corners + 2 center side pockets)
  const pocketCoords: ReadonlyArray<readonly [number, number]> = [
    [-playL * 0.5, -playW * 0.5],
    [0, -playW * 0.5 - 0.012],
    [playL * 0.5, -playW * 0.5],
    [-playL * 0.5, playW * 0.5],
    [0, playW * 0.5 + 0.012],
    [playL * 0.5, playW * 0.5],
  ];
  for (const [px, pz] of pocketCoords) {
    const pocketWell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.042, 0.046, 18),
      pocketHoleMat
    );
    pocketWell.name = 'outbuildings.barn.poolTable.pocket';
    pocketWell.position.set(px, tableH - 0.016, pz);
    poolGroup.add(pocketWell);

    const brassPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.060, 0.058, 0.013, 18),
      brushedBrassMat
    );
    brassPlate.position.set(px * 1.03, tableH + 0.004, pz * 1.04);
    poolGroup.add(brassPlate);

    const leatherBasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.038, 0.11, 16),
      pocketLeatherMat
    );
    leatherBasket.position.set(px * 1.03, tableH - 0.075, pz * 1.04);
    poolGroup.add(leatherBasket);
  }

  // 6. Full 15-Ball Rack (Red & Yellow English Pool Balls + Black 8-Ball) + White Cue Ball + 2 Ash Pool Cues
  const ballR = 0.0254; // 2-inch (50.8mm) regulation UK pool ball radius
  const ballY = bedY + 0.011 + ballR;
  const redBallMat = new THREE.MeshStandardMaterial({ color: 0xc92020, roughness: 0.12, metalness: 0.08 });
  const yellowBallMat = new THREE.MeshStandardMaterial({ color: 0xf0b818, roughness: 0.12, metalness: 0.08 });
  const blackBallMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.10, metalness: 0.12 });
  const cueBallMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.10, metalness: 0.08 });

  // White Cue Ball on the head string / D-zone (`x = -0.48m, z = +0.06m`)
  const cueBall = new THREE.Mesh(new THREE.SphereGeometry(ballR, 16, 14), cueBallMat);
  cueBall.name = 'outbuildings.barn.poolTable.cueBall';
  cueBall.position.set(-0.48, ballY, 0.06);
  cueBall.castShadow = true;
  poolGroup.add(cueBall);

  // 5-row triangle of 15 object balls starting at the foot spot (`x = +0.46m`)
  const apexX = 0.46;
  const rowStepX = ballR * 1.74;
  let ballCounter = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const bx = apexX + row * rowStepX;
      const bz = (col - row * 0.5) * (ballR * 2.02);
      const isEightBall = row === 2 && col === 1;
      const mat = isEightBall
        ? blackBallMat
        : (ballCounter % 2 === 0 ? redBallMat : yellowBallMat);
      ballCounter++;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(ballR, 14, 12), mat);
      ball.name = `outbuildings.barn.poolTable.ball.${ballCounter}`;
      ball.position.set(bx, ballY, bz);
      ball.castShadow = true;
      poolGroup.add(ball);
    }
  }

  // 2 Tapered Ash & Ebony Pool Cues resting across the table
  const ashCueMat = new THREE.MeshStandardMaterial({ color: 0xdcb98a, roughness: 0.32 });
  for (const [cIdx, cx, cz, cRotY] of [
    [1, -0.14, -0.22, 0.18],
    [2, -0.10, 0.24, -0.24],
  ] as const) {
    const cueShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0048, 0.012, 1.36, 12),
      ashCueMat
    );
    cueShaft.name = `outbuildings.barn.poolTable.cue.${cIdx}`;
    cueShaft.rotation.z = Math.PI / 2 - 0.025;
    cueShaft.rotation.y = cRotY;
    cueShaft.position.set(cx, bedY + 0.032, cz);
    cueShaft.castShadow = true;
    poolGroup.add(cueShaft);
  }

  // 2 Blue Billiards Chalk Cubes on the North & South rails
  const chalkMat = new THREE.MeshStandardMaterial({ color: 0x1d68b8, roughness: 0.65 });
  for (const [cx, cz] of [
    [-0.36, -tableW * 0.5 + railW * 0.5],
    [0.20, tableW * 0.5 - railW * 0.5],
  ] as const) {
    const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.022), chalkMat);
    chalk.position.set(cx, tableH + 0.015, cz);
    chalk.rotation.y = 0.35;
    poolGroup.add(chalk);
  }
}

// ============================================================================
// ISSUE #8 & ISSUE #3: GOLF-VIEWING SPECTATOR BAR COUNTER WITH MARBLE TOP & 3 LEATHER BAR STOOLS
// ("Make the lower section a little larger, move the steps forward slightly (maybe 50cm).
//  On this side have a bar with some stools so people can watch the golf and wait their turn"
//  + Issue #1: "shift this section fotward, there is no point having steps in front of it the steps can but up against the edge of the bar"
//  + Issue #3: "Marble top" at `[-3.662, 0.385, 18.089]`, `outbuildings.barn.golfViewingBar.top`)
// ============================================================================
function createCalacattaMarbleTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Warm creamy-white Calacatta / Carrara marble base
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
    bgGrad.addColorStop(0, '#f7f5f0');
    bgGrad.addColorStop(0.5, '#f1eee7');
    bgGrad.addColorStop(1, '#f6f4ee');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Soft cloudy mineral washes
    for (let c = 0; c < 14; c++) {
      const cx = ((c * 137) % 480) + 16;
      const cy = ((c * 193) % 480) + 16;
      const r = 60 + (c % 4) * 35;
      const rad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      rad.addColorStop(0, c % 2 === 0 ? 'rgba(184, 178, 168, 0.16)' : 'rgba(205, 192, 172, 0.12)');
      rad.addColorStop(1, 'rgba(247, 245, 240, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, 512, 512);
    }

    // Organic diagonal grey & warm taupe/gold Calacatta veins
    const veinConfigs = [
      { x0: -20, y0: 60, x1: 530, y1: 240, width: 3.2, color: 'rgba(130, 126, 120, 0.42)' },
      { x0: -10, y0: 190, x1: 520, y1: 410, width: 2.4, color: 'rgba(145, 136, 124, 0.36)' },
      { x0: 40, y0: -10, x1: 460, y1: 520, width: 1.8, color: 'rgba(168, 148, 118, 0.28)' },
      { x0: -20, y0: 340, x1: 530, y1: 490, width: 2.8, color: 'rgba(122, 118, 114, 0.38)' },
      { x0: 120, y0: -10, x1: 530, y1: 310, width: 1.4, color: 'rgba(150, 144, 136, 0.30)' },
    ] as const;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let vIdx = 0; vIdx < veinConfigs.length; vIdx++) {
      const v = veinConfigs[vIdx]!;
      ctx.strokeStyle = v.color;
      ctx.lineWidth = v.width;
      ctx.beginPath();
      const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const jitter = Math.sin(t * Math.PI * 5 + vIdx * 2.1) * 14 + Math.cos(t * Math.PI * 11 + vIdx) * 5;
        const px = v.x0 + (v.x1 - v.x0) * t + jitter * 0.6;
        const py = v.y0 + (v.y1 - v.y0) * t + jitter;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildBarnGolfViewingBar(
  groundGroup: THREE.Group,
  barnCarpetTopY: number,
  lightJoineryOakMat: THREE.Material
): void {
  const viewingBarGroup = new THREE.Group();
  viewingBarGroup.name = 'outbuildings.barn.golfViewingBar';
  viewingBarGroup.userData.zone = 'courtyard';
  // Issue #1 ("shift this section fotward, there is no point having steps in front of it the steps can but up against the edge of the bar"
  // at `[-3.664, -0.403, 18.162]`):
  // Shifted forward (West) so the West front face (`localX = -0.24m`) sits right at `u = 18.18m` (flush with the drop-off edge
  // of `outbuildings.barn.westFloor`), centered at `(u = 18.42m, y = barnCarpetTopY = -0.675m, v = 4.52m)` and spanning
  // `v = 3.62m..5.42m` (`1.80m` long up to the South Barn wall), with the 2 bullnose oak steps (`v = 0.28m..3.62m`)
  // butting directly up against the North end of the bar (`v = 3.62m`)!
  viewingBarGroup.position.set(18.42, barnCarpetTopY, 4.52);
  groundGroup.add(viewingBarGroup);

  const barLenZ = 1.80;
  const barCarcassD = 0.40;
  const barTopD = 0.54;
  const barH = 1.06;
  const plinthH = 0.06;
  const topT = 0.040;
  const bodyH = barH - plinthH - topT; // 0.96m
  const westFloorStepRiseH = (-0.34) - barnCarpetTopY; // 0.335m rise from -0.675m lower carpet to -0.34m upper limestone floor

  const marbleTopMat = new THREE.MeshStandardMaterial({
    map: createCalacattaMarbleTopTexture(),
    color: 0xf7f5f0,
    roughness: 0.16,
    metalness: 0.04,
  });
  const darkAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x1e2126,
    roughness: 0.42,
    metalness: 0.58,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });
  const saddleLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x7c4728,
    roughness: 0.48,
    metalness: 0.04,
  });
  const darkLeatherPipingMat = new THREE.MeshStandardMaterial({
    color: 0x4a2814,
    roughness: 0.52,
    metalness: 0.05,
  });
  const warmLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: 0xffc870,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  // 1. Recessed Dark-Anthracite Plinth & Fluted Solid Light-Oak Spectator Bar Carcass
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(barCarcassD - 0.04, plinthH, barLenZ - 0.04),
    darkAnthraciteMat
  );
  plinth.position.set(-0.04, plinthH * 0.5, 0);
  viewingBarGroup.add(plinth);

  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(barCarcassD, bodyH, barLenZ),
    lightJoineryOakMat
  );
  carcass.name = 'outbuildings.barn.golfViewingBar.counter';
  carcass.position.set(-0.04, plinthH + bodyH * 0.5, 0);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  viewingBarGroup.add(carcass);

  // Solid light-oak West plinth moulding at `y = westFloorStepRiseH` (`-0.34m` upper limestone floor level)
  const westFloorSkirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.036, barLenZ),
    lightJoineryOakMat
  );
  westFloorSkirt.position.set(-0.04 - barCarcassD * 0.5 - 0.008, westFloorStepRiseH + 0.018, 0);
  westFloorSkirt.castShadow = true;
  viewingBarGroup.add(westFloorSkirt);

  // Vertical half-round fluted light-oak tambour slats along the West (`-x`, facing the Golf Simulator) face above `-0.34m`
  const slatBottomY = westFloorStepRiseH + 0.036;
  const slatTopY = barH - topT;
  const slatH = slatTopY - slatBottomY;
  const numSlats = 28;
  for (let i = 0; i < numSlats; i++) {
    const sz = -barLenZ * 0.5 + 0.04 + (i / (numSlats - 1)) * (barLenZ - 0.08);
    const slat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, slatH, 10),
      lightJoineryOakMat
    );
    slat.position.set(-0.04 - barCarcassD * 0.5 - 0.004, slatBottomY + slatH * 0.5, sz);
    slat.castShadow = true;
    viewingBarGroup.add(slat);
  }

  // Issue #3 ("Marble top" at `[-3.662, 0.385, 18.089]`, `outbuildings.barn.golfViewingBar.top`):
  // Overhanging Bullnose Polished Calacatta Marble Bar Top (`0.54m` deep x `0.040m` thick x `1.82m` long, overhanging `+x` toward the bar stools!)
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(barTopD, topT, barLenZ + 0.02),
    marbleTopMat
  );
  counterTop.name = 'outbuildings.barn.golfViewingBar.top';
  counterTop.position.set(0.03, barH - topT * 0.5, -0.01);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  viewingBarGroup.add(counterTop);

  // Half-round bullnose marble nosing along both West (`-x`) and East (`+x`) edges of the marble bar top
  for (const edgeX of [0.03 - barTopD * 0.5, 0.03 + barTopD * 0.5] as const) {
    const noseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(topT * 0.5, topT * 0.5, barLenZ + 0.02, 14),
      marbleTopMat
    );
    noseCyl.rotation.x = Math.PI / 2;
    noseCyl.position.set(edgeX, barH - topT * 0.5, -0.01);
    viewingBarGroup.add(noseCyl);
  }

  // Warm under-counter LED strip illuminating the stool overhang (`x = +0.20m`)
  const underBarLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.008, barLenZ - 0.08),
    warmLedMat
  );
  underBarLed.position.set(0.20, barH - topT - 0.004, 0);
  viewingBarGroup.add(underBarLed);

  // Full-length Brushed-Brass Footrail (`x = +0.24m, y = 0.22m`) + 3 Brass Brackets on the East (`+x`) Stool Side
  const footRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, barLenZ - 0.08, 16),
    brushedBrassMat
  );
  footRail.name = 'outbuildings.barn.golfViewingBar.footRail';
  footRail.rotation.x = Math.PI / 2;
  footRail.position.set(0.24, 0.22, 0);
  footRail.castShadow = true;
  viewingBarGroup.add(footRail);

  for (const bz of [-0.72, 0, 0.72] as const) {
    const bracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.09, 12),
      brushedBrassMat
    );
    bracket.rotation.z = Math.PI / 2;
    bracket.position.set(0.195, 0.22, bz);
    viewingBarGroup.add(bracket);
  }

  // Drinks, Coasters, Bar Snack Bowl & Golf Scorecard Holder on top of the Spectator Bar (`y = barH`)
  const beerGlassMat = new THREE.MeshStandardMaterial({
    color: 0xd98a1e,
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
  });
  const foamMat = new THREE.MeshStandardMaterial({ color: 0xf7f4eb, roughness: 0.45 });
  for (const [gx, gz] of [
    [0.05, -0.56],
    [0.02, 0.04],
    [0.06, 0.54],
  ] as const) {
    const coaster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.005, 18),
      brushedBrassMat
    );
    coaster.position.set(gx, barH + 0.0025, gz);
    viewingBarGroup.add(coaster);

    const pint = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.028, 0.115, 16),
      beerGlassMat
    );
    pint.position.set(gx, barH + 0.062, gz);
    pint.castShadow = true;
    viewingBarGroup.add(pint);

    const foam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.035, 0.024, 16),
      foamMat
    );
    foam.position.set(gx, barH + 0.131, gz);
    viewingBarGroup.add(foam);
  }

  const snackBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.046, 0.048, 20),
    foamMat
  );
  snackBowl.position.set(-0.04, barH + 0.024, -0.26);
  snackBowl.castShadow = true;
  viewingBarGroup.add(snackBowl);

  // 2. 3 Bespoke Swivel Tan-Saddle-Leather & Brushed-Brass Spectator Bar Stools (`outbuildings.barn.golfViewingBar.stool.1..3`)
  //    Placed along the East (`+x`) side of the counter (`x = +0.46m`, i.e., `u = 19.26m`), facing West (`-u`) toward the Golf Simulator!
  for (const [sIdx, sz, rotOffset] of [
    [1, -0.58, 0.08],
    [2, 0.0, -0.05],
    [3, 0.58, 0.12],
  ] as const) {
    const stoolGroup = new THREE.Group();
    stoolGroup.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}`;
    stoolGroup.position.set(0.46, 0, sz);
    // Face West (`-x`) toward the bar counter and Golf Simulator screen
    stoolGroup.rotation.y = Math.PI + rotOffset;
    viewingBarGroup.add(stoolGroup);

    // 4 Splayed Solid Light-Oak Legs with Brushed-Brass Foot Caps & Circular Brass Footrest Ring
    const legH = 0.70;
    for (const [lx, lz] of [
      [-0.14, -0.14],
      [0.14, -0.14],
      [-0.14, 0.14],
      [0.14, 0.14],
    ] as const) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.013, legH, 12),
        lightJoineryOakMat
      );
      leg.position.set(lx * 0.82, legH * 0.5, lz * 0.82);
      leg.rotation.z = lx > 0 ? 0.09 : -0.09;
      leg.rotation.x = lz > 0 ? -0.09 : 0.09;
      leg.castShadow = true;
      stoolGroup.add(leg);

      const brassSabot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.013, 0.065, 12),
        brushedBrassMat
      );
      brassSabot.position.set(lx * 0.96, 0.0325, lz * 0.96);
      stoolGroup.add(brassSabot);
    }

    const footrestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.165, 0.009, 10, 24),
      brushedBrassMat
    );
    footrestRing.rotation.x = Math.PI / 2;
    footrestRing.position.set(0, 0.26, 0);
    stoolGroup.add(footrestRing);

    // Upholstered Tan-Saddle-Leather Swivel Seat Cushion (`y = 0.70..0.77m`) with Welted Piping
    const seatCushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.185, 0.068, 24),
      saddleLeatherMat
    );
    seatCushion.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.seat`;
    seatCushion.position.set(0, 0.734, 0);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    stoolGroup.add(seatCushion);

    const seatWelt = new THREE.Mesh(
      new THREE.TorusGeometry(0.188, 0.006, 10, 24),
      darkLeatherPipingMat
    );
    seatWelt.rotation.x = Math.PI / 2;
    seatWelt.position.set(0, 0.765, 0);
    stoolGroup.add(seatWelt);

    // Twin Brushed-Brass Backrest Uprights & Curved Low-Profile Saddle-Leather Backrest (`y = 0.84..0.98m`)
    for (const sideZ of [-0.09, 0.09] as const) {
      const upright = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.21, 10),
        brushedBrassMat
      );
      upright.position.set(-0.175, 0.83, sideZ);
      upright.rotation.z = 0.14;
      stoolGroup.add(upright);
    }

    const backrest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.195, 0.195, 0.13, 20, 1, true, Math.PI * 0.65, Math.PI * 0.70),
      saddleLeatherMat
    );
    backrest.position.set(0, 0.91, 0);
    backrest.castShadow = true;
    stoolGroup.add(backrest);

    const backrestInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.125, 0.30),
      saddleLeatherMat
    );
    backrestInner.position.set(-0.175, 0.91, 0);
    backrestInner.castShadow = true;
    stoolGroup.add(backrestInner);
  }
}

