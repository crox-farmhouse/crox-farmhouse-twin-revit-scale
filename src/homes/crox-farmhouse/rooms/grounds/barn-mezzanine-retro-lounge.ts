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
    // Base warm oatmeal cream center field
    ctx.fillStyle = '#d8ccb8';
    ctx.fillRect(0, 0, 512, 512);

    // Bold 1990s geometric colour-block perimeter & corner blocks matching reference photo
    const blocks: ReadonlyArray< readonly [number, number, number, number, string] > = [
      [0, 0, 140, 180, '#232832'],      // Deep charcoal-navy corner
      [140, 0, 180, 95, '#b85a3a'],     // Burnt terracotta
      [320, 0, 192, 110, '#4f3529'],    // Espresso brown
      [0, 180, 95, 190, '#b34b30'],     // Terracotta rust border
      [0, 370, 130, 142, '#c98a38'],    // Mustard ochre
      [130, 410, 210, 102, '#282c34'],  // Charcoal black-navy
      [340, 395, 172, 117, '#a84c32'],  // Terracotta
      [410, 110, 102, 165, '#c78c3b'],  // Warm ochre
      [410, 275, 102, 120, '#593d2e'],  // Warm umber
      [95, 95, 70, 70, '#8c6d53'],      // Taupe accent square
      [340, 110, 70, 75, '#dfd5c4'],    // Ivory block
    ];
    for (const [x, y, w, h, col] of blocks) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    }

    // Subtle woven wool tuft grain across entire rug
    for (let i = 0; i < 6000; i++) {
      const rx = (i * 73) % 512;
      const ry = (i * 137) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)';
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
    // Deep crimson red base
    ctx.fillStyle = '#7d1e22';
    ctx.fillRect(0, 0, 512, 512);

    // Ornate multi-band outer borders (ivory, navy, ochre, crimson)
    const borders: ReadonlyArray< readonly [number, string, number] > = [
      [14, '#d9cbb4', 8],
      [28, '#1d293b', 18],
      [50, '#c89b4b', 6],
      [62, '#8f2428', 10],
      [76, '#d9cbb4', 6],
    ];
    for (const [inset, col, lw] of borders) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.strokeRect(inset, inset, 512 - inset * 2, 512 - inset * 2);
    }

    // Corner spandrels in navy & cream
    ctx.fillStyle = '#1d293b';
    for (const [cx, cy] of [
      [82, 82],
      [430, 82],
      [82, 430],
      [430, 430],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central navy & ivory diamond medallion
    ctx.fillStyle = '#192536';
    ctx.beginPath();
    ctx.moveTo(256, 120);
    ctx.lineTo(372, 256);
    ctx.lineTo(256, 392);
    ctx.lineTo(140, 256);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ded0b8';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#9e2a2f';
    ctx.beginPath();
    ctx.moveTo(256, 168);
    ctx.lineTo(324, 256);
    ctx.lineTo(256, 344);
    ctx.lineTo(188, 256);
    ctx.closePath();
    ctx.fill();

    // Floral geometric motifs
    ctx.fillStyle = '#d9c5a0';
    for (let y = 96; y <= 416; y += 32) {
      for (let x = 96; x <= 416; x += 32) {
        if ((x + y) % 64 === 0) {
          ctx.fillRect(x - 4, y - 4, 8, 8);
        }
      }
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
    const colors = ['#a8422b', '#2b5b6c', '#d48c32', '#4a3525', '#7a8c56'];
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
    new THREE.BoxGeometry(1.68, 0.01, 2.18),
    persianRugMat
  );
  persianRug.name = 'outbuildings.mezzanine.persianRug';
  persianRug.position.set(21.34, mezzanineFloorY + 0.005, 1.48);
  persianRug.receiveShadow = true;
  loungeGroup.add(persianRug);

  // =========================================================================
  // 2. MID-CENTURY ROUNDED TEAK SIDEBOARD CREDENZA (`outbuildings.mezzanine.retroSideboard`)
  //    Backed against the Front Mezzanine Balustrade (`u = 19.04m, v = 2.38m`), facing East (`+u`)
  // =========================================================================
  const sideboardGroup = new THREE.Group();
  sideboardGroup.name = 'outbuildings.mezzanine.retroSideboard';
  sideboardGroup.position.set(19.04, mezzanineFloorY, 2.38);
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
  tvGroup.position.set(19.04, mezzanineFloorY + sbTopY, 2.38);
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
  vcrGroup.position.set(19.05, mezzanineFloorY + sbTopY, 1.82);
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
  vhsCaseGroup.position.set(19.08, mezzanineFloorY + sbTopY, 2.94);
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

  // Helper to build a sculpted Original PlayStation 1 Controller (`SCPH-1080`)
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

    // Central bridge bar
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.018, 0.088),
      ps1GreyMat
    );
    bridge.position.set(0, 0.012, 0);
    bridge.castShadow = true;
    ctrlGroup.add(bridge);

    // Left D-pad pod & Right action-button pod
    for (const sideZ of [-1, 1] as const) {
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.034, 0.034, 0.020, 20),
        ps1GreyMat
      );
      pod.position.set(-0.004, 0.013, sideZ * 0.046);
      pod.castShadow = true;
      ctrlGroup.add(pod);

      // Angled ergonomic hand grip horn
      const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.014, 0.068, 14),
        ps1GreyMat
      );
      grip.rotation.z = Math.PI / 2 - 0.12;
      grip.rotation.y = sideZ * 0.34;
      grip.position.set(0.032, 0.012, sideZ * 0.058);
      grip.castShadow = true;
      ctrlGroup.add(grip);
    }

    // D-pad cross on left pod (`+z`) and 4 coloured PlayStation action buttons on right pod (`-z`)
    const dPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.005, 0.022),
      trinitronDarkGrilleMat
    );
    dPad.position.set(-0.004, 0.024, 0.046);
    ctrlGroup.add(dPad);

    const btnSpecs: ReadonlyArray< readonly [number, number, number] > = [
      [-0.016, -0.046, 0x2ecc71], // Green Triangle
      [0.008, -0.046, 0x3498db],  // Blue Cross
      [-0.004, -0.034, 0xe84393], // Pink Square
      [-0.004, -0.058, 0xe74c3c], // Red Circle
    ];
    for (const [bx, bz, bCol] of btnSpecs) {
      const abtn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.005, 10),
        new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.3 })
      );
      abtn.position.set(bx, 0.024, bz);
      ctrlGroup.add(abtn);
    }
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

  const floorCases: ReadonlyArray< readonly [number, number, number, number] > = [
    [19.48, 2.78, 0.32, 0xb83828],
    [19.50, 2.80, 0.18, 0x284b7a],
    [19.96, 1.88, -0.25, 0x3b6e38],
    [20.14, 2.68, 0.55, 0xc88a28],
  ];
  for (const [fx, fz, frot, fcol] of floorCases) {
    const gameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.022, 0.19),
      new THREE.MeshStandardMaterial({ color: fcol, roughness: 0.4 })
    );
    gameBox.position.set(fx, mezzanineFloorY + 0.023, fz);
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

  const navyCorduroyMat = new THREE.MeshStandardMaterial({
    color: 0x24324d,
    map: createCorduroyFabricTexture('#23314c', '#182338'),
    roughness: 0.88,
    metalness: 0.02,
  });
  const tapestryBeanbagMat = new THREE.MeshStandardMaterial({
    map: createTapestryBeanbagTexture(),
    roughness: 0.86,
    metalness: 0.02,
  });

  const beanbagGeoLarge = createSculptedBeanbagGeometry(0.54, 0.68, 0.58);
  const beanbagGeoMed = createSculptedBeanbagGeometry(0.48, 0.62, 0.52);

  // 1. Foreground Navy Corduroy Beanbag Chair (`u = 20.18m, v = 1.02m`, facing the TV & coffee table)
  const navyBeanbagFront = new THREE.Mesh(beanbagGeoLarge, navyCorduroyMat);
  navyBeanbagFront.name = 'outbuildings.mezzanine.beanbag.navyFront';
  navyBeanbagFront.position.set(20.18, mezzanineFloorY, 1.02);
  navyBeanbagFront.rotation.y = -0.58;
  navyBeanbagFront.castShadow = true;
  navyBeanbagFront.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagFront);

  // 2. Patterned Geometric Tapestry Beanbag Chair (`u = 21.16m, v = 0.94m`)
  const tapestryBeanbag = new THREE.Mesh(beanbagGeoMed, tapestryBeanbagMat);
  tapestryBeanbag.name = 'outbuildings.mezzanine.beanbag.tapestry';
  tapestryBeanbag.position.set(21.16, mezzanineFloorY, 0.94);
  tapestryBeanbag.rotation.y = -0.35;
  tapestryBeanbag.castShadow = true;
  tapestryBeanbag.receiveShadow = true;
  loungeSeatingGroup.add(tapestryBeanbag);

  // 3. Back Navy Corduroy Beanbag Chair (`u = 21.86m, v = 0.92m`)
  const navyBeanbagBack = new THREE.Mesh(beanbagGeoMed, navyCorduroyMat);
  navyBeanbagBack.name = 'outbuildings.mezzanine.beanbag.navyBack';
  navyBeanbagBack.position.set(21.86, mezzanineFloorY, 0.92);
  navyBeanbagBack.rotation.y = -0.78;
  navyBeanbagBack.castShadow = true;
  navyBeanbagBack.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagBack);

  // 4. Round Patterned Kilim Pouffe Ottoman (`u = 21.26m, v = 1.98m`)
  const pouffeGeo = new THREE.CylinderGeometry(0.32, 0.34, 0.28, 28, 8);
  const pPos = pouffeGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    const py = pPos.getY(i);
    const bulge = 1 + 0.14 * Math.cos((py / 0.14) * Math.PI * 0.5);
    pPos.setX(i, pPos.getX(i) * bulge);
    pPos.setZ(i, pPos.getZ(i) * bulge);
  }
  pouffeGeo.computeVertexNormals();
  const pouffe = new THREE.Mesh(pouffeGeo, tapestryBeanbagMat);
  pouffe.name = 'outbuildings.mezzanine.pouffe';
  pouffe.position.set(21.26, mezzanineFloorY + 0.14, 1.98);
  pouffe.castShadow = true;
  pouffe.receiveShadow = true;
  loungeSeatingGroup.add(pouffe);

  // 5. Low Mid-Century Wooden Coffee Table with Open Monopoly Board Game (`u = 20.52m, v = 1.66m`)
  const coffeeTableGroup = new THREE.Group();
  coffeeTableGroup.name = 'outbuildings.mezzanine.coffeeTable';
  coffeeTableGroup.position.set(20.52, mezzanineFloorY, 1.66);
  coffeeTableGroup.rotation.y = 0.08;
  loungeSeatingGroup.add(coffeeTableGroup);

  const ctW = 0.62;
  const ctL = 0.96;
  const ctH = 0.38;
  const ctTop = new THREE.Mesh(
    new THREE.BoxGeometry(ctW, 0.028, ctL),
    teakMat
  );
  ctTop.position.set(0, ctH - 0.014, 0);
  ctTop.castShadow = true;
  ctTop.receiveShadow = true;
  coffeeTableGroup.add(ctTop);

  for (const lx of [-0.24, 0.24] as const) {
    for (const lz of [-0.40, 0.40] as const) {
      const ctLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.011, ctH - 0.02, 12),
        darkTeakMat
      );
      ctLeg.position.set(lx, (ctH - 0.02) * 0.5, lz);
      ctLeg.rotation.z = lx > 0 ? 0.09 : -0.09;
      ctLeg.rotation.x = lz > 0 ? -0.09 : 0.09;
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

  // East wall (`u = 23.005m`, facing West `-x` into the Mezzanine, right beside the bookcase!)
  addFramedPoster(23.005, mezzanineFloorY + 0.84, 2.04, 0.44, 0.58, -Math.PI / 2, 'blur');

  // South wall (`v = 5.412m`, facing North `-z` into the Mezzanine, east of the 4 skateboards!)
  addFramedPoster(20.34, mezzanineFloorY + 0.84, 5.412, 0.38, 0.50, Math.PI, 'jurassicPark');
  addFramedPoster(20.82, mezzanineFloorY + 0.84, 5.412, 0.38, 0.50, Math.PI, 'bigLebowski');

  // North wall (`v = 0.295m`, facing South `+z` into the Mezzanine, east of the hayloft window!)
  addFramedPoster(20.62, mezzanineFloorY + 0.74, 0.295, 0.36, 0.52, 0, 'bigLebowski');
  addFramedPoster(21.18, mezzanineFloorY + 0.98, 0.295, 0.42, 0.54, 0, 'oasis');
  addFramedPoster(21.18, mezzanineFloorY + 0.38, 0.295, 0.42, 0.54, 0, 'pulpFiction');
  addFramedPoster(21.76, mezzanineFloorY + 0.98, 0.295, 0.44, 0.56, 0, 'spiceGirls');
  addFramedPoster(21.76, mezzanineFloorY + 0.38, 0.295, 0.44, 0.56, 0, 'trainspotting');

  // =========================================================================
  // 9. 5-SHELF OAK RETRO BOOKCASE, BOARD GAMES, VHS/CD COLLECTION, LAVA LAMPS
  //    & WARM TABLE LAMP (`outbuildings.mezzanine.bookcaseAndLamps`)
  // =========================================================================
  const bookcaseGroup = new THREE.Group();
  bookcaseGroup.name = 'outbuildings.mezzanine.bookcase';
  // Against the East wall (`u = 22.84m`, north of the Stable stairs doorway `v = 2.40..3.30m`)
  bookcaseGroup.position.set(22.85, mezzanineFloorY, 1.24);
  loungeGroup.add(bookcaseGroup);

  const bcDepthU = 0.30;
  const bcWidthV = 1.04;
  const bcHeightY = 1.30;
  const shelfT = 0.024;

  // Bookcase side uprights & back panel
  for (const sideZ of [-1, 1] as const) {
    const upright = new THREE.Mesh(
      new THREE.BoxGeometry(bcDepthU, bcHeightY, shelfT),
      teakMat
    );
    upright.position.set(0, bcHeightY * 0.5, sideZ * (bcWidthV * 0.5 - shelfT * 0.5));
    upright.castShadow = true;
    bookcaseGroup.add(upright);
  }
  const bcBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, bcHeightY, bcWidthV),
    new THREE.MeshStandardMaterial({ color: 0xe8dfd1, roughness: 0.78 })
  );
  bcBack.position.set(bcDepthU * 0.5 - 0.007, bcHeightY * 0.5, 0);
  bookcaseGroup.add(bcBack);

  // 6 horizontal oak shelves (base plinth + 4 interior shelves + top cap)
  const shelfHeights = [0.06, 0.31, 0.56, 0.81, 1.06, 1.288];
  for (const sy of shelfHeights) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(bcDepthU, shelfT, bcWidthV - shelfT * 2),
      teakMat
    );
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    bookcaseGroup.add(shelf);
  }

  // Stock shelves with horizontal board game boxes (bottom shelf), vertical VHS/books (shelves 2 & 3),
  // retro boombox (shelf 4), and collectibles!
  const itemColors = [0xc93228, 0x28588c, 0xdba028, 0x2b7a48, 0x8a387c, 0xe86828, 0x323842];
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

  // Second & third shelves (`y = 0.322m` & `0.572m`): vertical rows of VHS tapes, books & CDs
  for (const [shelfBaseY, itemH, count] of [
    [0.322, 0.19, 18],
    [0.572, 0.14, 16],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const iz = -0.44 + i * 0.036;
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

  // Fourth shelf (`y = 0.822m`): 1990s Stereo Boombox in center (`z = 0`)
  const boombox = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.13, 0.32),
    trinitronCharcoalMat
  );
  boombox.position.set(-0.02, 0.822 + 0.065, 0);
  bookcaseGroup.add(boombox);

  // Helper to build a glowing 1990s Iconic Double-Cone Lava Lamp (`Mathmos Astro`)
  const addRetroLavaLamp = (
    ux: number,
    uy: number,
    uz: number,
    waxColorHex: number,
    baseColorHex: number,
    name: string
  ): void => {
    const lampGroup = new THREE.Group();
    lampGroup.name = name;
    lampGroup.position.set(ux, uy, uz);
    loungeGroup.add(lampGroup);

    const baseMat = new THREE.MeshStandardMaterial({
      color: baseColorHex,
      roughness: 0.22,
      metalness: 0.78,
    });
    const lavaGlowMat = new THREE.MeshStandardMaterial({
      color: waxColorHex,
      emissive: waxColorHex,
      emissiveIntensity: 1.35,
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

  // Lava Lamp #1 inside the bookcase (`u = 22.82m, y = mezzanineFloorY + 0.572m, v = 1.54m`)
  addRetroLavaLamp(
    22.82,
    mezzanineFloorY + 0.572,
    1.54,
    0xff38b8,
    0xd8dde4,
    'outbuildings.mezzanine.lavaLamp.bookcase'
  );

  // Lava Lamp #2 on the North Hayloft Windowsill (`u = 19.85m, y = 2.02m, v = 0.26m`)!
  addRetroLavaLamp(
    19.85,
    2.02,
    0.26,
    0xff4878,
    0x2848a8,
    'outbuildings.mezzanine.lavaLamp.windowsill'
  );

  // White ribbed convector radiator mounted on the North wall below the hayloft window (`u = 19.85m, v = 0.32m`)
  const radiator = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.38, 0.065),
    new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.35, metalness: 0.15 })
  );
  radiator.name = 'outbuildings.mezzanine.radiator';
  radiator.position.set(19.85, mezzanineFloorY + 0.24, 0.32);
  radiator.castShadow = true;
  loungeGroup.add(radiator);

  // Small vintage speaker/side cabinet + warm glowing cream Table Lamp in NE corner (`u = 22.82m, v = 0.50m`)
  const sideCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.54, 0.36),
    teakMat
  );
  sideCabinet.name = 'outbuildings.mezzanine.sideCabinet';
  sideCabinet.position.set(22.82, mezzanineFloorY + 0.27, 0.50);
  sideCabinet.castShadow = true;
  loungeGroup.add(sideCabinet);

  const lampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.045, 0.22, 16),
    silverBadgeMat
  );
  lampStem.position.set(22.82, mezzanineFloorY + 0.65, 0.50);
  loungeGroup.add(lampStem);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.135, 0.18, 22),
    new THREE.MeshStandardMaterial({
      color: 0xfff3d6,
      emissive: 0xffc86b,
      emissiveIntensity: 0.82,
      roughness: 0.55,
    })
  );
  lampShade.name = 'outbuildings.mezzanine.tableLamp.shade';
  lampShade.position.set(22.82, mezzanineFloorY + 0.78, 0.50);
  loungeGroup.add(lampShade);
}
