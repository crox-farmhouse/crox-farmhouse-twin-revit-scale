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

function createTeakWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#9e6230';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 2) {
      const wave = Math.sin(y * 0.045) * 10 + Math.cos(y * 0.018) * 6;
      const tone = Math.floor(wave);
      const r = Math.min(255, Math.max(0, 156 + tone));
      const g = Math.min(255, Math.max(0, 96 + Math.floor(tone * 0.65)));
      const b = Math.min(255, Math.max(0, 46 + Math.floor(tone * 0.4)));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, 512, 2);
    }
    ctx.strokeStyle = 'rgba(68, 36, 14, 0.16)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 42; i++) {
      const y0 = (i * 13) % 512;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.bezierCurveTo(170, y0 + ((i % 3) - 1) * 14, 340, y0 - ((i % 3) - 1) * 14, 512, y0);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
    // Crisp late-1990s / Y2K Ice-Silver & Cool Off-White center field (replacing 1970s brown/terracotta)
    ctx.fillStyle = '#e8eef5';
    ctx.fillRect(0, 0, 512, 512);

    // Bold 1990s / Y2K graphic colour-block perimeter (Electric Cobalt, Bondi Cyan, Cyber Violet, Hot Magenta, Deep Indigo)
    const blocks: ReadonlyArray< readonly [number, number, number, number, string] > = [
      [0, 0, 140, 180, '#172554'],      // Deep Y2K Indigo-Navy corner
      [140, 0, 180, 95, '#2563eb'],     // Electric Cobalt Blue
      [320, 0, 192, 110, '#00b4d8'],    // Bondi Cyan / Aqua
      [0, 180, 95, 190, '#7c3aed'],     // Cyber Purple-Violet border
      [0, 370, 130, 142, '#ec4899'],    // Y2K Hot Pink / Magenta
      [130, 410, 210, 102, '#1e1b4b'],  // Deep Midnight Violet-Navy
      [340, 395, 172, 117, '#2563eb'],  // Electric Cobalt Blue
      [410, 110, 102, 165, '#84cc16'],  // 90s Acid Lime / Nickelodeon Green pop accent
      [410, 275, 102, 120, '#6d28d9'],  // Vivid Violet
      [95, 95, 70, 70, '#06b6d4'],      // Bright Cyan square
      [340, 110, 70, 75, '#f8fafc'],    // Crisp Ice-White block
    ];
    for (const [x, y, w, h, col] of blocks) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    }

    for (let i = 0; i < 6000; i++) {
      const rx = (i * 73) % 512;
      const ry = (i * 137) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(15,23,42,0.045)';
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
    // Late-1990s / Y2K IKEA PS 1999 & Designers Republic Graphic Pop-Wave Tufted Rug
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    const borders: ReadonlyArray< readonly [number, string, number] > = [
      [14, '#38bdf8', 10],
      [30, '#3b82f6', 18],
      [52, '#f1f5f9', 6],
      [66, '#6366f1', 12],
    ];
    for (const [inset, col, lw] of borders) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.strokeRect(inset, inset, 512 - inset * 2, 512 - inset * 2);
    }

    for (const [cx, cy, rOuter, colOuter, colInner] of [
      [256, 256, 148, '#2563eb', '#ec4899'],
      [148, 152, 54, '#06b6d4', '#f8fafc'],
      [364, 152, 54, '#8b5cf6', '#38bdf8'],
      [148, 360, 54, '#8b5cf6', '#38bdf8'],
      [364, 360, 54, '#06b6d4', '#f8fafc'],
    ] as const) {
      ctx.fillStyle = colOuter;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colInner;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter * 0.56, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(256, 256, 42, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5000; i++) {
      const rx = (i * 79) % 512;
      const ry = (i * 131) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
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
    ctx.fillStyle = '#c8ab8e';
    ctx.fillRect(0, 0, 256, 256);
    const colors = ['#2563eb', '#06b6d4', '#ec4899', '#7c3aed', '#e2e8f0'];
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
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
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

  const teakTex = createTeakWoodTexture();
  const teakMat = new THREE.MeshStandardMaterial({
    color: 0xc88a52,
    map: teakTex,
    roughness: 0.42,
    metalness: 0.04,
  });
  const darkTeakMat = new THREE.MeshStandardMaterial({
    color: 0x8f5b2d,
    map: teakTex,
    roughness: 0.48,
    metalness: 0.05,
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
  // 2. MID-CENTURY ROUNDED TEAK SIDEBOARD CREDENZA (`outbuildings.mezzanine.retroSideboard`)
  //    Backed against the Front Mezzanine Balustrade (`u = 19.04m, v = 2.38m`), facing East (`+u`)
  // =========================================================================
  // Issue #1 ("Move the tv unit slightly further from the rail its clipping" at `[-3.528, 2.727, 16.682]`):
  // Shifted the Ercol TV unit and Sony Trinitron TV East (`+u`) from `u = 19.04m` to `u = 19.16m..19.20m`
  // so both the sideboard back (`u = 18.94m`) and the CRT rear neck cap (`u = 18.89m`) sit cleanly clear of the `u = 18.76m` balustrade rail!
  const sideboardGroup = new THREE.Group();
  sideboardGroup.name = 'outbuildings.mezzanine.retroSideboard';
  sideboardGroup.position.set(19.16, mezzanineFloorY, 2.38);
  loungeGroup.add(sideboardGroup);

  const sbDepthU = 0.44;
  const sbStraightLenV = 1.12;
  const sbEndRadius = sbDepthU * 0.5; // 0.22m rounded ends (total widthV = 1.12 + 0.44 = 1.56m)
  const sbLegH = 0.22;
  const sbBodyH = 0.52;
  const sbBodyMidY = sbLegH + sbBodyH * 0.5; // 0.48m
  const sbTopY = sbLegH + sbBodyH; // 0.74m

  // Rounded-end mid-century cabinet carcass (central box + 2 half-cylinder rounded ends)
  const sbCenterBox = new THREE.Mesh(
    new THREE.BoxGeometry(sbDepthU, sbBodyH, sbStraightLenV),
    teakMat
  );
  sbCenterBox.position.set(0, sbBodyMidY, 0);
  sbCenterBox.castShadow = true;
  sbCenterBox.receiveShadow = true;
  sideboardGroup.add(sbCenterBox);

  for (const sideZ of [-1, 1] as const) {
    const roundedEnd = new THREE.Mesh(
      new THREE.CylinderGeometry(sbEndRadius, sbEndRadius, sbBodyH, 24),
      teakMat
    );
    roundedEnd.position.set(0, sbBodyMidY, sideZ * (sbStraightLenV * 0.5));
    roundedEnd.castShadow = true;
    roundedEnd.receiveShadow = true;
    sideboardGroup.add(roundedEnd);
  }

  // Front face doors (left & right) + 3 central drawers facing `+x` (East into the Mezzanine)
  const frontX = sbDepthU * 0.5 + 0.008;
  for (const sideZ of [-1, 1] as const) {
    const doorZ = sideZ * 0.42;
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, sbBodyH - 0.05, 0.38),
      teakMat
    );
    doorPanel.position.set(frontX, sbBodyMidY, doorZ);
    doorPanel.castShadow = true;
    sideboardGroup.add(doorPanel);

    // Sculpted vertical mid-century timber handle pull near the inner stile
    const doorHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.11, 0.018),
      darkTeakMat
    );
    doorHandle.position.set(frontX + 0.012, sbBodyMidY, sideZ * 0.26);
    sideboardGroup.add(doorHandle);
  }

  // 3 central drawers with sculpted horizontal lip handles
  const drawerH = (sbBodyH - 0.06) / 3;
  for (let d = 0; d < 3; d++) {
    const dy = sbLegH + 0.03 + drawerH * (d + 0.5);
    const drawerFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, drawerH - 0.008, 0.44),
      teakMat
    );
    drawerFront.position.set(frontX, dy, 0);
    drawerFront.castShadow = true;
    sideboardGroup.add(drawerFront);

    const drawerPull = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.018, 0.11),
      darkTeakMat
    );
    drawerPull.position.set(frontX + 0.012, dy, 0);
    sideboardGroup.add(drawerPull);
  }

  // Under-frame stretcher apron & 4 splayed tapered wooden legs
  const stretcherRail = new THREE.Mesh(
    new THREE.BoxGeometry(sbDepthU * 0.72, 0.032, sbStraightLenV + 0.16),
    darkTeakMat
  );
  stretcherRail.position.set(0, sbLegH - 0.016, 0);
  sideboardGroup.add(stretcherRail);

  for (const lx of [-0.15, 0.15] as const) {
    for (const lz of [-0.58, 0.58] as const) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.013, sbLegH + 0.02, 12),
        darkTeakMat
      );
      leg.position.set(lx, sbLegH * 0.5, lz);
      leg.rotation.z = lx > 0 ? 0.11 : -0.11;
      leg.rotation.x = lz > 0 ? -0.10 : 0.10;
      leg.castShadow = true;
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

  // Issue #2 ("These controller look more like n64 than dualshock, fix it" at `[-2.43, 1.575, 16.433]`, `outbuildings.mezzanine.playstation1.controller.1`):
  // Authentic Sony PlayStation 1 DualShock Controller (`SCPH-1200`) with twin Analog Thumbsticks, unified center body,
  // L1/L2/R1/R2 shoulder triggers, flared DualShock grips, segmented 4-way D-pad, and red Analog Mode LED!
  const dualShockStickMat = new THREE.MeshStandardMaterial({
    color: 0x2c3036,
    roughness: 0.78,
    metalness: 0.05,
  });
  const analogLedMat = new THREE.MeshStandardMaterial({
    color: 0xff2211,
    emissive: new THREE.Color(0xff1808),
    emissiveIntensity: 1.6,
    roughness: 0.25,
  });

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

    const mainBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.020, 0.094),
      ps1GreyMat
    );
    mainBridge.position.set(-0.002, 0.012, 0);
    mainBridge.castShadow = true;
    ctrlGroup.add(mainBridge);

    const frontBevelLip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.092, 14),
      ps1GreyMat
    );
    frontBevelLip.rotation.x = Math.PI / 2;
    frontBevelLip.position.set(-0.031, 0.012, 0);
    ctrlGroup.add(frontBevelLip);

    for (const sideZ of [-1, 1] as const) {
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.034, 0.021, 24),
        ps1GreyMat
      );
      pod.position.set(-0.004, 0.0125, sideZ * 0.046);
      pod.castShadow = true;
      ctrlGroup.add(pod);

      const shoulderBoss = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.018, 0.028),
        ps1GreyMat
      );
      shoulderBoss.position.set(-0.032, 0.011, sideZ * 0.045);
      ctrlGroup.add(shoulderBoss);

      const triggerBtn = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.012, 0.022),
        trinitronDarkGrilleMat
      );
      triggerBtn.position.set(-0.040, 0.012, sideZ * 0.045);
      ctrlGroup.add(triggerBtn);

      const stickTurret = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
        ps1GreyMat
      );
      stickTurret.position.set(0.020, 0.014, sideZ * 0.023);
      stickTurret.castShadow = true;
      ctrlGroup.add(stickTurret);

      const stickShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.010, 10),
        dualShockStickMat
      );
      stickShaft.position.set(0.020, 0.028, sideZ * 0.023);
      ctrlGroup.add(stickShaft);

      const stickCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0115, 0.009, 0.005, 18),
        dualShockStickMat
      );
      stickCap.position.set(0.020, 0.034, sideZ * 0.023);
      stickCap.castShadow = true;
      ctrlGroup.add(stickCap);

      const stickDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 14, 10),
        dualShockStickMat
      );
      stickDome.scale.set(1, 0.28, 1);
      stickDome.position.set(0.020, 0.0365, sideZ * 0.023);
      ctrlGroup.add(stickDome);

      const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0165, 0.0195, 0.058, 16),
        ps1GreyMat
      );
      grip.rotation.z = Math.PI / 2 - 0.08;
      grip.rotation.y = sideZ * 0.22;
      grip.position.set(0.028, 0.011, sideZ * 0.055);
      grip.castShadow = true;
      ctrlGroup.add(grip);

      const gripTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.0165, 14, 12),
        ps1GreyMat
      );
      gripTip.position.set(0.055, 0.009, sideZ * 0.061);
      gripTip.castShadow = true;
      ctrlGroup.add(gripTip);
    }

    for (const [dx, dz] of [
      [-0.011, 0],
      [0.011, 0],
      [0, -0.011],
      [0, 0.011],
    ] as const) {
      const dSeg = new THREE.Mesh(
        new THREE.BoxGeometry(dx !== 0 ? 0.009 : 0.007, 0.004, dz !== 0 ? 0.009 : 0.007),
        trinitronDarkGrilleMat
      );
      dSeg.position.set(-0.004 + dx, 0.024, 0.046 + dz);
      ctrlGroup.add(dSeg);
    }

    const btnSpecs: ReadonlyArray< readonly [number, number, number] > = [
      [-0.016, -0.046, 0x2ecc71],
      [0.008, -0.046, 0x3498db],
      [-0.004, -0.034, 0xe84393],
      [-0.004, -0.058, 0xe74c3c],
    ];
    for (const [bx, bz, bCol] of btnSpecs) {
      const abtn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0048, 0.0048, 0.0045, 12),
        new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.3 })
      );
      abtn.position.set(bx, 0.024, bz);
      ctrlGroup.add(abtn);
    }

    const selectBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.003, 0.009),
      trinitronDarkGrilleMat
    );
    selectBtn.position.set(-0.004, 0.023, 0.011);
    ctrlGroup.add(selectBtn);

    const startBtn = new THREE.Mesh(
      new THREE.ConeGeometry(0.0045, 0.009, 3),
      trinitronDarkGrilleMat
    );
    startBtn.rotation.z = Math.PI / 2;
    startBtn.position.set(-0.004, 0.023, -0.011);
    ctrlGroup.add(startBtn);

    const analogBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.003, 0.008),
      trinitronDarkGrilleMat
    );
    analogBtn.position.set(0.010, 0.023, 0);
    ctrlGroup.add(analogBtn);

    const analogLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.0035, 0.0025, 0.005),
      analogLedMat
    );
    analogLed.position.set(0.019, 0.023, 0);
    ctrlGroup.add(analogLed);
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
    [19.48, 0.024, 2.78, 0.32, 0x2563eb],
    [19.50, 0.047, 2.80, 0.18, 0xec4899],
    [19.96, 0.024, 1.88, -0.25, 0x06b6d4],
    [20.14, 0.024, 2.68, 0.55, 0x7c3aed],
  ];
  for (const [fx, fyOff, fz, frot, fcol] of floorCases) {
    const gameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.022, 0.19),
      new THREE.MeshStandardMaterial({ color: fcol, roughness: 0.34 })
    );
    gameBox.position.set(fx, mezzanineFloorY + fyOff, fz);
    gameBox.rotation.y = frot;
    gameBox.castShadow = true;
    loungeGroup.add(gameBox);
  }

  // =========================================================================
  // 6. SCULPTED 1990s CORDUROY BEANBAG CHAIRS, TAPESTRY BEANBAG, KILIM POUFFE
  //    & LOW COFFEE TABLE WITH OPEN MONOPOLY BOARD GAME, SODA CANS & SNACKS
  // =========================================================================
  const loungeSeatingGroup = new THREE.Group();
  loungeSeatingGroup.name = 'outbuildings.mezzanine.beanbagLounge';
  loungeGroup.add(loungeSeatingGroup);

  // Late-1990s / Y2K Beanbag Lounge Palette ("right now the vibe upstairs feels a bit too 1970s, i like the tv unit and tv,
  // but the colors etc need to be more y2k / 1990s"):
  // Replaced 1970s terracotta & mustard-ochre with vibrant 1990s/Y2K Electric Cobalt Blue (`#2563eb`),
  // Cyber Violet-Purple (`#7c3aed`), and Y2K Pop Cyan/Magenta/Cobalt geometric fabric!
  const y2kCobaltCorduroyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createCorduroyFabricTexture('#2563eb', '#1d4ed8'),
    roughness: 0.82,
    metalness: 0.04,
  });
  const y2kVioletCorduroyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createCorduroyFabricTexture('#7c3aed', '#5b21b6'),
    roughness: 0.82,
    metalness: 0.04,
  });
  const tapestryBeanbagMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createTapestryBeanbagTexture(),
    roughness: 0.82,
    metalness: 0.04,
  });

  const beanbagGeoLarge = createSculptedBeanbagGeometry(0.54, 0.68, 0.58);
  const beanbagGeoMed = createSculptedBeanbagGeometry(0.48, 0.62, 0.52);

  // Issue #4 ("Move this beanbag its clipping the ercol tv unit" at `[-2.631, 2.162, 17.369]`, `outbuildings.mezzanine.beanbag.navyFront`):
  // Relocated to `(u = 19.72m, v = 3.96m)` in the South-West lounge area with generous clearance from the Ercol TV unit!
  const navyBeanbagFront = new THREE.Mesh(beanbagGeoLarge, y2kCobaltCorduroyMat);
  navyBeanbagFront.name = 'outbuildings.mezzanine.beanbag.navyFront';
  navyBeanbagFront.position.set(19.72, mezzanineFloorY, 3.96);
  navyBeanbagFront.rotation.y = -2.28;
  navyBeanbagFront.castShadow = true;
  navyBeanbagFront.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagFront);

  // 2. East Lounge Y2K Pop Geometric Beanbag Chair (`u = 22.42m, v = 1.42m`, facing the coffee table & TV)
  const tapestryBeanbag = new THREE.Mesh(beanbagGeoMed, tapestryBeanbagMat);
  tapestryBeanbag.name = 'outbuildings.mezzanine.beanbag.tapestry';
  tapestryBeanbag.position.set(22.42, mezzanineFloorY, 1.42);
  tapestryBeanbag.rotation.y = -1.35;
  tapestryBeanbag.castShadow = true;
  tapestryBeanbag.receiveShadow = true;
  loungeSeatingGroup.add(tapestryBeanbag);

  // 3. North-West Lounge Y2K Cyber-Violet Corduroy Beanbag Chair (`u = 20.52m, v = 1.08m`, facing the coffee table & TV)
  const navyBeanbagBack = new THREE.Mesh(beanbagGeoMed, y2kVioletCorduroyMat);
  navyBeanbagBack.name = 'outbuildings.mezzanine.beanbag.navyBack';
  navyBeanbagBack.position.set(20.52, mezzanineFloorY, 1.08);
  navyBeanbagBack.rotation.y = 0.52;
  navyBeanbagBack.castShadow = true;
  navyBeanbagBack.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagBack);

  // 4. Late-1990s / Y2K Frosted Ice-Blue & Brushed Chrome Tubular Lounge Coffee Table (`u = 21.55m, v = 1.62m`)
  const y2kChromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.88,
  });
  const y2kIceBlueTopMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.22,
    metalness: 0.12,
  });

  const coffeeTableGroup = new THREE.Group();
  coffeeTableGroup.name = 'outbuildings.mezzanine.coffeeTable';
  coffeeTableGroup.position.set(21.55, mezzanineFloorY, 1.62);
  coffeeTableGroup.rotation.y = 0.06;
  loungeSeatingGroup.add(coffeeTableGroup);

  const ctW = 0.62;
  const ctL = 0.96;
  const ctH = 0.38;
  const ctTop = new THREE.Mesh(
    new THREE.BoxGeometry(ctW, 0.028, ctL),
    y2kIceBlueTopMat
  );
  ctTop.position.set(0, ctH - 0.014, 0);
  ctTop.castShadow = true;
  ctTop.receiveShadow = true;
  coffeeTableGroup.add(ctTop);

  for (const lx of [-0.24, 0.24] as const) {
    for (const lz of [-0.40, 0.40] as const) {
      const ctLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.014, ctH - 0.02, 16),
        y2kChromeMat
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

  // Stacked board game boxes beside/on edge of coffee table
  for (let b = 0; b < 2; b++) {
    const bgBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.052, 0.38),
      new THREE.MeshStandardMaterial({
        color: b === 0 ? 0xd93228 : 0x26548c,
        roughness: 0.45,
      })
    );
    bgBox.position.set(0.18, ctH + 0.026 + b * 0.053, -0.42);
    bgBox.rotation.y = b * 0.08 - 0.05;
    bgBox.castShadow = true;
    coffeeTableGroup.add(bgBox);
  }

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
  // 9. 5-SHELF OAK RETRO BOOKCASE, BOARD GAMES, VHS/CD COLLECTION, LAVA LAMPS
  //    & WARM TABLE LAMP (`outbuildings.mezzanine.bookcaseAndLamps`)
  //    - Issue #6 ("Put the bookbase on this wall instead" at `[-0.089, 2.433, 14.358]` -> North wall `v = 0.28m`):
  //      Mounted against the North Mezzanine Wall (`u = 21.88m, v = 0.435m`, `rotation.y = Math.PI / 2` so its
  //      back sits flush against `v = 0.285m` and its open shelves face South `+v` into the Mezzanine)!
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

  // Late-1990s / Y2K Matte Cobalt-Slate & Ice-Silver Bookcase finish (replacing 1970s orange-brown teak)
  const y2kBookcaseFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.36,
    metalness: 0.18,
  });
  const y2kBookcaseShelfMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.32,
    metalness: 0.14,
  });

  // Bookcase side uprights & back panel
  for (const sideZ of [-1, 1] as const) {
    const upright = new THREE.Mesh(
      new THREE.BoxGeometry(bcDepthU, bcHeightY, shelfT),
      y2kBookcaseFrameMat
    );
    upright.position.set(0, bcHeightY * 0.5, sideZ * (bcWidthV * 0.5 - shelfT * 0.5));
    upright.castShadow = true;
    bookcaseGroup.add(upright);
  }
  const bcBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, bcHeightY, bcWidthV),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.52 })
  );
  bcBack.position.set(bcDepthU * 0.5 - 0.007, bcHeightY * 0.5, 0);
  bookcaseGroup.add(bcBack);

  const shelfHeights = [0.06, 0.31, 0.54, 0.85, 1.08, 1.29];
  for (const sy of shelfHeights) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(bcDepthU, shelfT, bcWidthV - shelfT * 2),
      y2kBookcaseShelfMat
    );
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    bookcaseGroup.add(shelf);
  }

  // Cool Ice-Blue / White under-shelf LED accent strips
  const underShelfLedMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.55,
    roughness: 0.22,
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

  // Stock shelves with 1990s / Y2K pop-colored game boxes, VHS/CD spines, and metallic Y2K boombox!
  const itemColors = [0x2563eb, 0x06b6d4, 0xec4899, 0x7c3aed, 0x3b82f6, 0x84cc16, 0xe2e8f0];
  // Bottom shelf (`y = 0.072m`): stacks of 90s board games
  for (let stack = 0; stack < 3; stack++) {
    const sz = -0.32 + stack * 0.32;
    for (let layer = 0; layer < 3; layer++) {
      const gameBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.044, 0.27),
        new THREE.MeshStandardMaterial({
          color: itemColors[(stack * 3 + layer) % itemColors.length],
          roughness: 0.45,
        })
      );
      gameBox.position.set(-0.02, 0.095 + layer * 0.046, sz);
      bookcaseGroup.add(gameBox);
    }
  }

  // Second & third shelves (`y = 0.322m` & `0.552m`): vertical rows of VHS tapes, books & CDs
  // Leave a clean bay (`iz = +0.18..+0.42`) on shelf 3 (`0.552m`) around the bookcase Lava Lamp (`u = 22.18m` -> `iz = +0.30m`)!
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
          roughness: 0.48,
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
      emissiveIntensity: 1.55,
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

  // Issue #4: Lava Lamp #1 inside the North-wall bookcase (`u = 22.18m, y = mezzanineFloorY + 0.552m, v = 0.45m, scale = 0.72` -> `0.212m` tall,
  // sitting cleanly on shelf 3 with `7.4cm` clearance below shelf 4 at `mezzanineFloorY + 0.838m`!)
  addRetroLavaLamp(
    22.18,
    mezzanineFloorY + 0.552,
    0.45,
    0xff38b8,
    0xd8dde4,
    'outbuildings.mezzanine.lavaLamp.bookcase',
    0.72
  );

  // Issue #5 ("Remove from windowsill" at `[-2.662, 2.152, 14.591]`, `outbuildings.mezzanine.lavaLamp.windowsill`):
  // Removed the windowsill Lava Lamp so the North hayloft window reveal is completely clear.

  // Issue #3 ("Get rid of radiator" at `[-2.542, 1.806, 14.642]`, `outbuildings.mezzanine.radiator`): removed radiator.

  // Late-1990s / Y2K Matte Cobalt & Brushed Silver Side Cabinet + Glowing Ice-Cyan Table Lamp in NE corner (`u = 22.64m, v = 0.46m`)
  const sideCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.54, 0.32),
    y2kBookcaseFrameMat
  );
  sideCabinet.name = 'outbuildings.mezzanine.sideCabinet';
  sideCabinet.position.set(22.64, mezzanineFloorY + 0.27, 0.46);
  sideCabinet.castShadow = true;
  loungeGroup.add(sideCabinet);

  const lampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.045, 0.22, 16),
    silverBadgeMat
  );
  lampStem.position.set(22.64, mezzanineFloorY + 0.65, 0.46);
  loungeGroup.add(lampStem);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.135, 0.18, 22),
    new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.35,
      roughness: 0.38,
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
export function buildBarnGroundWallArtworks(groundGroup: THREE.Group): void {
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
  // Rotated 90 degrees so the full-size 9ft table's 2.79m length runs North-South along v (`v = 1.455..4.245m`)
  // and its 1.52m width spans `u = 19.38..20.90m`, clear of the NE corner bar and SE spiral staircase.
  poolGroup.position.set(20.28, barnCarpetTopY, 2.78);
  poolGroup.rotation.y = Math.PI / 2;
  groundGroup.add(poolGroup);

  const tableL = 2.79; // Full-size 9ft tournament pool table outer length (9ft 2in)
  const tableW = 1.52; // Full-size 9ft tournament pool table outer width (5ft)
  const tableH = 0.80; // Regulation playing height
  const railW = 0.125; // 5-inch solid oak cushion rails
  const playL = tableL - railW * 2; // 2.54m (100-inch regulation 9ft playing length)
  const playW = tableW - railW * 2; // 1.27m (50-inch regulation 9ft playing width)
  const bedY = tableH - 0.036; // 0.764m slate bed level

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

  // 1. 6 Turned Solid Light-Oak Legs (full-size 9ft 3-piece slate support: 3 per long side) with Brushed-Brass Levelling Feet
  const legOffsetX = tableL * 0.5 - 0.18;
  const legOffsetZ = tableW * 0.5 - 0.16;
  const legH = tableH - 0.22; // 0.58m up to cabinet apron

  for (const lx of [-legOffsetX, 0, legOffsetX] as const) {
    for (const lz of [-legOffsetZ, legOffsetZ] as const) {
      const brassToe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.058, 0.048, 18),
        brushedBrassMat
      );
      brassToe.position.set(lx, 0.024, lz);
      poolGroup.add(brassToe);

      const turnedLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.050, legH, 20),
        lightJoineryOakMat
      );
      turnedLeg.name = 'outbuildings.barn.poolTable.leg';
      turnedLeg.position.set(lx, 0.048 + legH * 0.5, lz);
      turnedLeg.castShadow = true;
      turnedLeg.receiveShadow = true;
      poolGroup.add(turnedLeg);
    }
  }

  // 2. Deep Solid Light-Oak Cabinet Apron (`y = 0.56..0.764m`)
  const apronCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(tableL - 0.08, 0.20, tableW - 0.08),
    lightJoineryOakMat
  );
  apronCarcass.name = 'outbuildings.barn.poolTable.cabinet';
  apronCarcass.position.set(0, tableH - 0.136, 0);
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
  const railH = 0.042;
  const railCenterY = tableH - railH * 0.5 + 0.005;
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
        new THREE.BoxGeometry(playL * 0.44, 0.032, 0.032),
        cushionGreenMat
      );
      cushion.position.set(segX, bedY + 0.022, sideZ * (playW * 0.5 - 0.012));
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
      new THREE.BoxGeometry(0.032, 0.032, playW - 0.12),
      cushionGreenMat
    );
    endCushion.position.set(sideX * (playL * 0.5 - 0.012), bedY + 0.022, 0);
    poolGroup.add(endCushion);
  }

  // 5. 6 Brushed-Brass & Saddle-Leather Drop Pockets (4 corners + 2 center side pockets)
  const pocketCoords: ReadonlyArray<readonly [number, number]> = [
    [-playL * 0.5, -playW * 0.5],
    [0, -playW * 0.5 - 0.015],
    [playL * 0.5, -playW * 0.5],
    [-playL * 0.5, playW * 0.5],
    [0, playW * 0.5 + 0.015],
    [playL * 0.5, playW * 0.5],
  ];
  for (const [px, pz] of pocketCoords) {
    const pocketWell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.048, 0.048, 18),
      pocketHoleMat
    );
    pocketWell.name = 'outbuildings.barn.poolTable.pocket';
    pocketWell.position.set(px, tableH - 0.016, pz);
    poolGroup.add(pocketWell);

    const brassPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.066, 0.014, 18),
      brushedBrassMat
    );
    brassPlate.position.set(px * 1.03, tableH + 0.004, pz * 1.04);
    poolGroup.add(brassPlate);

    const leatherBasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.042, 0.12, 16),
      pocketLeatherMat
    );
    leatherBasket.position.set(px * 1.03, tableH - 0.08, pz * 1.04);
    poolGroup.add(leatherBasket);
  }

  // 6. Full 15-Ball Rack (Red & Yellow English Pool Balls + Black 8-Ball) + White Cue Ball + Oak Triangle + 2 Ash Pool Cues
  const ballR = 0.0254; // 2-inch UK pool ball radius
  const ballY = bedY + 0.011 + ballR;
  const redBallMat = new THREE.MeshStandardMaterial({ color: 0xc92020, roughness: 0.12, metalness: 0.08 });
  const yellowBallMat = new THREE.MeshStandardMaterial({ color: 0xf0b818, roughness: 0.12, metalness: 0.08 });
  const blackBallMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.10, metalness: 0.12 });
  const cueBallMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.10, metalness: 0.08 });

  // White Cue Ball on the head string / D-zone (`x = -0.635m, z = +0.08m`)
  const cueBall = new THREE.Mesh(new THREE.SphereGeometry(ballR, 16, 14), cueBallMat);
  cueBall.name = 'outbuildings.barn.poolTable.cueBall';
  cueBall.position.set(-0.635, ballY, 0.08);
  cueBall.castShadow = true;
  poolGroup.add(cueBall);

  // 5-row triangle of 15 object balls starting at the regulation foot spot (`x = +0.635m`)
  const apexX = 0.635;
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
    [1, -0.18, -0.28, 0.18],
    [2, -0.12, 0.32, -0.24],
  ] as const) {
    const cueShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.013, 1.42, 12),
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
    [-0.45, -tableW * 0.5 + railW * 0.5],
    [0.25, tableW * 0.5 - railW * 0.5],
  ] as const) {
    const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.023, 0.023, 0.023), chalkMat);
    chalk.position.set(cx, tableH + 0.016, cz);
    chalk.rotation.y = 0.35;
    poolGroup.add(chalk);
  }
}
