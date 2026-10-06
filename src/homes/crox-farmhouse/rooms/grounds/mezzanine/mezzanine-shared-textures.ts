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
let cachedSolidWhiteOakJoineryTextures: {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} | null = null;
let cachedSheepskinFleeceTextures: {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} | null = null;
let cachedLionKingTrinitronScreenTexture: THREE.CanvasTexture | null = null;
let cachedGeometricColourBlockRugTexture: THREE.CanvasTexture | null = null;
let cachedPersianMedallionRugTexture: THREE.CanvasTexture | null = null;
let cachedMonopolyBoardTexture: THREE.CanvasTexture | null = null;
const cachedSkateboardDeckTextures = new Map<SkateboardGraphicStyle, THREE.CanvasTexture>();
const cachedRetro90sPosterTextures = new Map<RetroPosterStyle, THREE.CanvasTexture>();
const cachedCorduroyFabricTextures = new Map<string, THREE.CanvasTexture>();
let cachedTapestryBeanbagTexture: THREE.CanvasTexture | null = null;
let cachedKnittedPouffeTexture: THREE.CanvasTexture | null = null;
const cachedPlayStationButtonCapTextures = new Map<PlayStationButtonSymbol, THREE.CanvasTexture>();

export function createSolidWhiteOakJoineryTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (cachedSolidWhiteOakJoineryTextures) {
    return cachedSolidWhiteOakJoineryTextures;
  }
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

  cachedSolidWhiteOakJoineryTextures = { colorMap, bumpMap };
  return cachedSolidWhiteOakJoineryTextures;
}

export function createTeakWoodTexture(): THREE.CanvasTexture {
  return createSolidWhiteOakJoineryTextures().colorMap;
}

/**
 * Applies real-world metric planar woodgrain UVs to cabinet/furniture geometry so the oak grain
 * (`u` in texture) runs along `grainAxis` ('y' for vertical doors/uprights/legs, 'z' for horizontal
 * tops/drawers/shelves, or 'x' for front-to-back cross rails) with zero stretching or distortion.
 */
export function applyOakJoineryUVs(
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
  geo.computeBoundingSphere();
  return geo;
}

// Issue #6 ("sheepskin beanbag" at `[-2.208, 2.109, 15.359]`, `outbuildings.mezzanine.beanbag.navyBack`):
// Curly Warm-Ivory / Natural Cream New Zealand Sheepskin Fleece Texture & High-Relief Wool Curl Bump Map
export function createSheepskinFleeceTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (cachedSheepskinFleeceTextures) {
    return cachedSheepskinFleeceTextures;
  }
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

  cachedSheepskinFleeceTextures = { colorMap, bumpMap };
  return cachedSheepskinFleeceTextures;
}

export function createLionKingTrinitronScreenTexture(): THREE.CanvasTexture {
  if (cachedLionKingTrinitronScreenTexture) {
    return cachedLionKingTrinitronScreenTexture;
  }
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
  cachedLionKingTrinitronScreenTexture = tex;
  return tex;
}

export function createGeometricColourBlockRugTexture(): THREE.CanvasTexture {
  if (cachedGeometricColourBlockRugTexture) {
    return cachedGeometricColourBlockRugTexture;
  }
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
  cachedGeometricColourBlockRugTexture = tex;
  return tex;
}

export function createPersianMedallionRugTexture(): THREE.CanvasTexture {
  if (cachedPersianMedallionRugTexture) {
    return cachedPersianMedallionRugTexture;
  }
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
  cachedPersianMedallionRugTexture = tex;
  return tex;
}

export function createMonopolyBoardTexture(): THREE.CanvasTexture {
  if (cachedMonopolyBoardTexture) {
    return cachedMonopolyBoardTexture;
  }
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
  cachedMonopolyBoardTexture = tex;
  return tex;
}

export type SkateboardGraphicStyle = 'redFlame' | 'pinkCartoon' | 'cyanSun' | 'yellowFrog';

export function createSkateboardDeckTexture(style: SkateboardGraphicStyle): THREE.CanvasTexture {
  const cached = cachedSkateboardDeckTextures.get(style);
  if (cached) {
    return cached;
  }
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
  cachedSkateboardDeckTextures.set(style, tex);
  return tex;
}

export type RetroPosterStyle =
  | 'blur'
  | 'oasis'
  | 'spiceGirls'
  | 'pulpFiction'
  | 'trainspotting'
  | 'jurassicPark'
  | 'bigLebowski';

export function createRetro90sPosterTexture(style: RetroPosterStyle): THREE.CanvasTexture {
  const cached = cachedRetro90sPosterTextures.get(style);
  if (cached) {
    return cached;
  }
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
  cachedRetro90sPosterTextures.set(style, tex);
  return tex;
}

export function createCorduroyFabricTexture(baseHex: string, ribHex: string): THREE.CanvasTexture {
  const cacheKey = `${baseHex}:${ribHex}`;
  const cached = cachedCorduroyFabricTextures.get(cacheKey);
  if (cached) {
    return cached;
  }
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
  cachedCorduroyFabricTextures.set(cacheKey, tex);
  return tex;
}

export function createTapestryBeanbagTexture(): THREE.CanvasTexture {
  if (cachedTapestryBeanbagTexture) {
    return cachedTapestryBeanbagTexture;
  }
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
  cachedTapestryBeanbagTexture = tex;
  return tex;
}

export function createKnittedPouffeTexture(): THREE.CanvasTexture {
  if (cachedKnittedPouffeTexture) {
    return cachedKnittedPouffeTexture;
  }
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
  cachedKnittedPouffeTexture = tex;
  return tex;
}

export type PlayStationButtonSymbol = 'triangle' | 'circle' | 'cross' | 'square';

export function createPlayStationButtonCapTexture(symbol: PlayStationButtonSymbol): THREE.CanvasTexture {
  const cached = cachedPlayStationButtonCapTextures.get(symbol);
  if (cached) {
    return cached;
  }
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
  cachedPlayStationButtonCapTextures.set(symbol, tex);
  return tex;
}

export function createSculptedBeanbagGeometry(
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
  geo.computeBoundingSphere();
  return geo;
}

export function createSkateboardDeckGeometry(): THREE.BufferGeometry {
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
  geo.computeBoundingSphere();
  return geo;
}
