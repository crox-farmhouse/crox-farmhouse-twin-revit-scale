import * as THREE from 'three';

export function createStoneTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Lighter-colored pale silver/off-white grout lines (#e2e4e6)
    ctx.fillStyle = '#e2e4e6';
    ctx.fillRect(0, 0, 512, 512);

    // 2x2 grid per 1.20m x 1.20m tile repeat -> exact 60cm x 60cm large-format square tiles
    const rows = 2;
    const cols = 2;
    const w = 512 / cols;
    const h = 512 / rows;
    const groutHalf = 2.5; // crisp 5px light grout joint

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = c * w + groutHalf;
        const ty = r * h + groutHalf;
        const tw = w - groutHalf * 2;
        const th = h - groutHalf * 2;

        // Light grey poured concrete / micro-cement base tone
        const baseShade = 194 + ((r * 5 + c * 9) % 6) - 3;
        ctx.fillStyle = `rgb(${baseShade}, ${baseShade + 2}, ${baseShade + 5})`;
        ctx.fillRect(tx, ty, tw, th);

        // Subtle trowelled cement clouding & mineral aggregate texture within each 60x60 tile
        for (let py = ty + 4; py < ty + th - 8; py += 12) {
          for (let px = tx + 4; px < tx + tw - 8; px += 12) {
            const hash = ((px * 23 + py * 41 + r * 17 + c * 31) % 15) - 7;
            const s = baseShade + hash;
            ctx.fillStyle = `rgba(${s}, ${s + 2}, ${s + 4}, 0.32)`;
            ctx.fillRect(px, py, 14, 14);
          }
        }

        // Fine cement aggregate speckles (tiny light and dark mineral grains)
        for (let i = 0; i < 45; i++) {
          const sx = tx + 8 + ((i * 53 + r * 29 + c * 71) % Math.floor(tw - 16));
          const sy = ty + 8 + ((i * 79 + r * 43 + c * 19) % Math.floor(th - 16));
          ctx.fillStyle =
            i % 2 === 0 ? 'rgba(228, 232, 236, 0.25)' : 'rgba(155, 160, 166, 0.22)';
          ctx.fillRect(sx, sy, 2.5, 2.5);
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // 10.20m / 1.20m = 8.5 repeats X (17 x 60cm tiles); 5.25m / 1.20m = 4.375 repeats Z (8.75 x 60cm tiles)
  tex.repeat.set(8.5, 4.375);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCourtyardStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Warm sandy-buff lime mortar joints between limestone slabs
    ctx.fillStyle = '#b8ae9c';
    ctx.fillRect(0, 0, 512, 512);

    // Traditional random-coursed English riven limestone flagstone layout
    const slabs: ReadonlyArray<readonly [number, number, number, number]> = [
      // Course 1
      [4, 4, 196, 120],
      [206, 4, 148, 120],
      [360, 4, 148, 120],
      // Course 2
      [4, 130, 132, 124],
      [142, 130, 212, 124],
      [360, 130, 148, 124],
      // Course 3
      [4, 260, 224, 118],
      [234, 260, 132, 118],
      [372, 260, 136, 118],
      // Course 4
      [4, 384, 158, 124],
      [168, 384, 176, 124],
      [350, 384, 158, 124],
    ];

    const limestonePalette = [
      [206, 198, 182], // Warm Cotswold / Lincolnshire honey-buff limestone
      [196, 190, 178], // Pale dove-buff limestone
      [212, 204, 188], // Cream-buff flagstone
      [188, 184, 174], // Weathered silver-buff limestone
      [202, 193, 176], // Warm sandy limestone
    ];

    slabs.forEach(([x, y, bw, bh], i) => {
      const base = limestonePalette[i % limestonePalette.length] ?? [202, 194, 180];
      const delta = ((i * 13) % 10) - 5;
      const r = base[0] + delta;
      const g = base[1] + delta;
      const b = base[2] + delta;

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, bw, bh);

      // Subtle natural riven stone surface mottling
      for (let sy = y + 6; sy < y + bh - 8; sy += 14) {
        for (let sx = x + 6; sx < x + bw - 8; sx += 18) {
          const n = (((sx * 19 + sy * 37 + i * 7) % 12) - 6);
          ctx.fillStyle = `rgba(${r + n}, ${g + n}, ${b + n}, 0.35)`;
          ctx.fillRect(sx, sy, 14, 10);
        }
      }

      // Chiseled edge highlight along each limestone slab
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5.5, 2.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGraniteSettArcTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Warm sandy-colored lime/sand mortar pointing base
    ctx.fillStyle = '#cbb894';
    ctx.fillRect(0, 0, 512, 256);

    // Subtle sandy grain variation in the mortar pointing (periodic across 512x256)
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 512; x += 4) {
        const delta = (((x % 512) * 17 + (y % 256) * 31) % 14) - 7;
        ctx.fillStyle = `rgb(${203 + delta}, ${184 + delta}, ${148 + delta})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }

    // Mixture of old weathered granite cobble colors (silver-grey, blue-grey, rose/pink granite, buff, charcoal)
    const granitePalette = [
      '#7d8186',
      '#6c737b',
      '#8f7b74',
      '#928879',
      '#62666c',
      '#86898e',
      '#7f6d67',
      '#74797e',
      '#9b8f80',
      '#5b6066',
    ];

    // 100% 2D-periodic coursed granite setts (18 courses across 512px, 8 rows across 256px)
    // so world-space (X, Z) UV mapping wraps around corners as a single continuous seamless texture.
    const numCourses = 18;
    const numRows = 8;
    const courseStepX = 512 / numCourses; // 28.44px
    const cobbleStepY = 256 / numRows;    // 32.0px (exact integer divisor of 256px)
    const arcAmp = 14;

    for (let c = -2; c <= numCourses + 2; c++) {
      const cMod = ((c % numCourses) + numCourses) % numCourses;
      const baseCourseX = c * courseStepX;
      const staggerY = (cMod % 2) * (cobbleStepY * 0.5);

      for (let s = -2; s <= numRows + 2; s++) {
        const sMod = ((s % numRows) + numRows) % numRows;
        const yMid = s * cobbleStepY + staggerY;
        if (yMid < -32 || yMid > 288) continue;

        // Smoothly periodic wave across 256px so v=0 and v=1 match in both position and tangent angle
        const wavePhase = (2 * Math.PI * yMid) / 256;
        const arcOffsetX = arcAmp * 0.5 * (1 - Math.cos(wavePhase));
        const xMid = baseCourseX - arcOffsetX + courseStepX * 0.5;
        const tangentAngle = Math.atan(((arcAmp * Math.PI) / 256) * Math.sin(wavePhase));

        const colorIdx =
          Math.abs((cMod * 17 + sMod * 11 + 7) % granitePalette.length);
        const baseColor = granitePalette[colorIdx] ?? '#7d8186';

        const cobbleW = courseStepX - 4.6; // ~23.8px
        const cobbleH = cobbleStepY - 4.6; // ~27.4px

        ctx.save();
        ctx.translate(xMid, yMid);
        ctx.rotate(tangentAngle);

        const rx = -cobbleW * 0.5;
        const ry = -cobbleH * 0.5;
        const cornerR = 3.5;

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(rx, ry, cobbleW, cobbleH, cornerR);
        ctx.fill();

        // Subtle weathered top highlight & dark granite crystal speckle
        ctx.strokeStyle = 'rgba(255, 248, 235, 0.18)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(30, 32, 36, 0.12)';
        ctx.fillRect(rx + 3, ry + 4, 3, 3);
        ctx.fillRect(rx + cobbleW - 7, ry + cobbleH - 8, 3, 3);

        ctx.restore();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRadialGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255, 205, 130, 0.85)');
    grad.addColorStop(0.4, 'rgba(255, 185, 95, 0.35)');
    grad.addColorStop(1, 'rgba(255, 170, 75, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTVOffTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 256, 144);
    grad.addColorStop(0, '#121417');
    grad.addColorStop(0.5, '#171a1e');
    grad.addColorStop(1, '#101214');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 144);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTVArtGalleryTextures(): readonly THREE.CanvasTexture[] {
  const artworks: THREE.CanvasTexture[] = [];

  const drawPassepartout = (ctx: CanvasRenderingContext2D): void => {
    // Warm museum mount board (passe-partout) border
    ctx.fillStyle = '#f2ede2';
    ctx.fillRect(0, 0, 256, 144);
    ctx.strokeStyle = '#d4ccb8';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 12, 228, 120);
  };

  // Art 1: "Tur Langton Sunset" — Pastoral Leicestershire Rolling Hills Oil Landscape
  {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawPassepartout(ctx);
      ctx.save();
      ctx.beginPath();
      ctx.rect(15, 13, 226, 118);
      ctx.clip();

      const sky = ctx.createLinearGradient(0, 13, 0, 92);
      sky.addColorStop(0, '#355678');
      sky.addColorStop(0.55, '#c98b5b');
      sky.addColorStop(1, '#ecc07e');
      ctx.fillStyle = sky;
      ctx.fillRect(15, 13, 226, 80);

      // Soft golden sun glow
      const sun = ctx.createRadialGradient(178, 62, 2, 178, 62, 34);
      sun.addColorStop(0, 'rgba(255, 242, 195, 0.92)');
      sun.addColorStop(1, 'rgba(255, 210, 130, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(15, 13, 226, 80);

      // Distant hill ridge
      ctx.fillStyle = '#586d57';
      ctx.beginPath();
      ctx.moveTo(15, 88);
      ctx.quadraticCurveTo(85, 65, 155, 82);
      ctx.quadraticCurveTo(205, 92, 241, 74);
      ctx.lineTo(241, 131);
      ctx.lineTo(15, 131);
      ctx.fill();

      // Foreground warm meadow & hedgerow
      const hills = ctx.createLinearGradient(0, 82, 0, 131);
      hills.addColorStop(0, '#495c3c');
      hills.addColorStop(1, '#293622');
      ctx.fillStyle = hills;
      ctx.beginPath();
      ctx.moveTo(15, 96);
      ctx.quadraticCurveTo(95, 78, 165, 98);
      ctx.quadraticCurveTo(210, 110, 241, 92);
      ctx.lineTo(241, 131);
      ctx.lineTo(15, 131);
      ctx.fill();

      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    artworks.push(tex);
  }

  // Art 2: "St Ives Modernist" — Mid-Century Geometric Still Life (Nicholson inspired)
  {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawPassepartout(ctx);
      ctx.save();
      ctx.beginPath();
      ctx.rect(15, 13, 226, 118);
      ctx.clip();

      ctx.fillStyle = '#e5ddd0';
      ctx.fillRect(15, 13, 226, 118);

      // Large slate blue block
      ctx.fillStyle = '#33526e';
      ctx.fillRect(34, 26, 86, 88);

      // Terracotta ochre circle
      ctx.fillStyle = '#c46843';
      ctx.beginPath();
      ctx.arc(146, 72, 36, 0, Math.PI * 2);
      ctx.fill();

      // Warm mustard vertical plane
      ctx.fillStyle = '#d8a648';
      ctx.fillRect(168, 28, 48, 76);

      // Charcoal minimalist line vessels
      ctx.strokeStyle = '#1f2328';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(86, 42, 58, 62);
      ctx.beginPath();
      ctx.arc(115, 73, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    artworks.push(tex);
  }

  // Art 3: "Botanical Meadow" — Heritage Watercolour Flora & Fern Study
  {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawPassepartout(ctx);
      ctx.save();
      ctx.beginPath();
      ctx.rect(15, 13, 226, 118);
      ctx.clip();

      ctx.fillStyle = '#efe9dc';
      ctx.fillRect(15, 13, 226, 118);

      // Botanical stems & leaves
      const stems = [58, 98, 138, 178, 204];
      for (const sx of stems) {
        ctx.strokeStyle = '#4c6b4f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, 126);
        ctx.quadraticCurveTo(sx - 8, 78, sx + 4, 34);
        ctx.stroke();

        // Paired leaves
        ctx.fillStyle = '#628262';
        for (const ly of [55, 75, 95]) {
          ctx.beginPath();
          ctx.ellipse(sx - 9, ly, 8, 3.5, -0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(sx + 7, ly - 6, 8, 3.5, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Wildflower Umbels / Blossoms
      const blooms: ReadonlyArray<readonly [number, number, string]> = [
        [62, 34, '#c86d51'],
        [102, 32, '#48688a'],
        [142, 30, '#d69b43'],
        [182, 36, '#b85a4c'],
        [208, 40, '#5a7896'],
      ];
      for (const [bx, by, col] of blooms) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    artworks.push(tex);
  }

  // Art 4: "Nocturne in Blue & Gold" — Atmospheric Coastal Horizon
  {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawPassepartout(ctx);
      ctx.save();
      ctx.beginPath();
      ctx.rect(15, 13, 226, 118);
      ctx.clip();

      const nocturne = ctx.createLinearGradient(0, 13, 0, 131);
      nocturne.addColorStop(0, '#192b3e');
      nocturne.addColorStop(0.58, '#284961');
      nocturne.addColorStop(0.64, '#d4a259');
      nocturne.addColorStop(1, '#162634');
      ctx.fillStyle = nocturne;
      ctx.fillRect(15, 13, 226, 118);

      // Shimmering gold water reflections
      ctx.fillStyle = 'rgba(238, 194, 112, 0.65)';
      for (let i = 0; i < 9; i++) {
        const y = 86 + i * 4.5;
        const w = 48 - i * 3.5;
        ctx.fillRect(128 - w / 2, y, w, 2);
      }

      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    artworks.push(tex);
  }

  return artworks;
}

export function createMarbleBacksplashTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Warm Carrara / Calacatta marble base
    const bg = ctx.createLinearGradient(0, 0, 512, 192);
    bg.addColorStop(0, '#f4f1ea');
    bg.addColorStop(0.5, '#faf8f4');
    bg.addColorStop(1, '#eeeae0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 192);

    // Soft cloudy mineral wash
    for (let i = 0; i < 12; i++) {
      const cx = (i * 47) % 512;
      const cy = (i * 31) % 192;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 75);
      g.addColorStop(0, 'rgba(195, 190, 182, 0.16)');
      g.addColorStop(1, 'rgba(195, 190, 182, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 192);
    }

    // Organic diagonal grey-taupe marble veins across the slab
    const veins: ReadonlyArray<readonly [number, number, number, number, number, number, number, string]> = [
      [15, 180, 110, 110, 210, 55, 1.8, 'rgba(148, 144, 138, 0.42)'],
      [95, 190, 175, 125, 270, 20, 1.1, 'rgba(165, 158, 148, 0.32)'],
      [180, 170, 260, 95, 360, 30, 2.1, 'rgba(140, 136, 130, 0.45)'],
      [230, 140, 310, 85, 410, 15, 1.0, 'rgba(175, 162, 142, 0.28)'],
      [320, 185, 395, 115, 495, 45, 1.7, 'rgba(146, 142, 136, 0.38)'],
      [50, 90, 145, 50, 240, 12, 0.9, 'rgba(156, 152, 146, 0.28)'],
      [370, 150, 430, 95, 505, 70, 1.1, 'rgba(162, 155, 145, 0.3)'],
    ];

    for (const [x0, y0, cx, cy, x1, y1, width, color] of veins) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBraidedCableTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Charcoal-black woven textile base
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(0, 0, 64, 128);

    // Interlocking diagonal off-white & black braided fabric strands
    ctx.strokeStyle = '#ece9e2';
    ctx.lineWidth = 4;
    for (let y = -64; y < 192; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(64, y + 48);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(64, y + 6);
      ctx.lineTo(0, y + 54);
      ctx.stroke();
    }

    // Re-weave black cross-over checks for authentic braided flex look
    ctx.fillStyle = '#181a1d';
    for (let y = 0; y < 128; y += 12) {
      for (let x = 0; x < 64; x += 16) {
        const offset = (y / 12) % 2 === 0 ? 0 : 8;
        ctx.fillRect(x + offset, y, 5, 5);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 18);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDriftwoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Sun-bleached, washed-out silver-taupe driftwood base
    ctx.fillStyle = '#aba193';
    ctx.fillRect(0, 0, 256, 256);

    // Weathered linear grain streaks in pale ash, chalky grey, and muted taupe
    for (let y = 0; y < 256; y += 2) {
      const wave = Math.sin(y * 0.09) * 6 + Math.cos(y * 0.23) * 3;
      const tone = 166 + Math.round(wave) + ((y * 13) % 14) - 7;
      ctx.fillStyle = `rgb(${tone + 5}, ${tone + 1}, ${tone - 6})`;
      ctx.fillRect(0, y, 256, 2);
    }

    // Chalky sun-bleached mineral pores along the wood grain
    ctx.strokeStyle = 'rgba(226, 220, 210, 0.32)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 42; i++) {
      const y = (i * 19) % 256;
      const x0 = (i * 37) % 180;
      const len = 35 + ((i * 29) % 65);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + len, y + ((i % 3) - 1));
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCementTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Modern architectural cast-cement neutral grey base
    ctx.fillStyle = '#9a9892';
    ctx.fillRect(0, 0, 256, 256);

    // Soft organic trowel / formwork clouding
    for (let i = 0; i < 18; i++) {
      const cx = (i * 53) % 256;
      const cy = (i * 41) % 256;
      const r = 36 + ((i * 19) % 44);
      const isLight = i % 2 === 0;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      grad.addColorStop(
        0,
        isLight ? 'rgba(182, 180, 174, 0.22)' : 'rgba(122, 120, 115, 0.20)'
      );
      grad.addColorStop(1, 'rgba(154, 152, 146, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }

    // Fine cast-concrete aggregate & micro-pinhole pores
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const hash = (x * 29 + y * 47) % 19;
        if (hash === 0) {
          ctx.fillStyle = 'rgba(104, 102, 98, 0.35)';
          ctx.fillRect(x, y, 2, 2);
        } else if (hash === 1) {
          ctx.fillStyle = 'rgba(192, 190, 184, 0.28)';
          ctx.fillRect(x, y, 2, 2);
        }
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

let cachedBrushedStainlessTex: THREE.CanvasTexture | null = null;

export function createBrushedStainlessTexture(): THREE.CanvasTexture {
  if (cachedBrushedStainlessTex) {
    return cachedBrushedStainlessTex;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Warm-neutral satin stainless steel base gradient (zero blue tint)
    const baseGrad = ctx.createLinearGradient(0, 0, 256, 256);
    baseGrad.addColorStop(0.0, '#a8a59e');
    baseGrad.addColorStop(0.28, '#c8c5be');
    baseGrad.addColorStop(0.5, '#9e9b95');
    baseGrad.addColorStop(0.76, '#d2cfc8');
    baseGrad.addColorStop(1.0, '#aba8a1');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Dense, crisp horizontal brushed stainless steel grain lines
    for (let y = 0; y < 256; y++) {
      const hash = (y * 29 + ((y * y) % 17)) % 16;
      const isLight = hash < 8;
      const alpha = 0.04 + (hash % 7) * 0.022;
      ctx.fillStyle = isLight
        ? `rgba(248, 245, 238, ${alpha})`
        : `rgba(58, 56, 52, ${alpha})`;
      ctx.fillRect(0, y, 256, 1);

      // Interrupted fine abrasive brush streaks along each horizontal pass
      for (let s = 0; s < 5; s++) {
        const sx = ((y * 43 + s * 67) % 220);
        const sw = 18 + ((y * 19 + s * 31) % 36);
        ctx.fillStyle =
          (y + s) % 2 === 0
            ? 'rgba(255, 252, 246, 0.11)'
            : 'rgba(46, 44, 41, 0.10)';
        ctx.fillRect(sx, y, sw, 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedBrushedStainlessTex = tex;
  return tex;
}

let cachedPolishedChromeTex: THREE.CanvasTexture | null = null;

export function createPolishedChromeTexture(): THREE.CanvasTexture {
  if (cachedPolishedChromeTex) {
    return cachedPolishedChromeTex;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Smooth, high-luster mirror chrome gradient (NO brushed lines, NO blue tint)
    const mirrorGrad = ctx.createLinearGradient(0, 0, 256, 256);
    mirrorGrad.addColorStop(0.0, '#62605c');
    mirrorGrad.addColorStop(0.18, '#b8b5ae');
    mirrorGrad.addColorStop(0.32, '#f6f3ec');
    mirrorGrad.addColorStop(0.45, '#54524e');
    mirrorGrad.addColorStop(0.62, '#c8c5be');
    mirrorGrad.addColorStop(0.78, '#faf7f0');
    mirrorGrad.addColorStop(0.9, '#8c8983');
    mirrorGrad.addColorStop(1.0, '#5c5a56');
    ctx.fillStyle = mirrorGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Soft secondary cross-reflection band for curved & flat mirror surfaces
    const crossGrad = ctx.createLinearGradient(0, 256, 256, 0);
    crossGrad.addColorStop(0.0, 'rgba(38, 36, 34, 0.18)');
    crossGrad.addColorStop(0.48, 'rgba(255, 252, 245, 0.24)');
    crossGrad.addColorStop(0.55, 'rgba(32, 30, 28, 0.20)');
    crossGrad.addColorStop(1.0, 'rgba(245, 242, 235, 0.15)');
    ctx.fillStyle = crossGrad;
    ctx.fillRect(0, 0, 256, 256);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedPolishedChromeTex = tex;
  return tex;
}

let cachedHawaiiArtTex: THREE.CanvasTexture | null = null;

export function createHawaiiArtworkTexture(): THREE.CanvasTexture {
  if (cachedHawaiiArtTex) {
    return cachedHawaiiArtTex;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Warm golden-hour Hawaiian sunset sky (soft pacific azure -> apricot -> warm coral-gold at horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 195);
    skyGrad.addColorStop(0.0, '#3e6b89');
    skyGrad.addColorStop(0.32, '#7596a8');
    skyGrad.addColorStop(0.62, '#d89b72');
    skyGrad.addColorStop(0.84, '#f0b86e');
    skyGrad.addColorStop(1.0, '#fae09c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 512, 195);

    // Warm setting sun glow low over the Pacific horizon
    const sunGlow = ctx.createRadialGradient(345, 162, 6, 345, 162, 130);
    sunGlow.addColorStop(0.0, 'rgba(255, 250, 224, 0.96)');
    sunGlow.addColorStop(0.22, 'rgba(255, 219, 138, 0.72)');
    sunGlow.addColorStop(0.55, 'rgba(244, 154, 102, 0.28)');
    sunGlow.addColorStop(1.0, 'rgba(244, 154, 102, 0.0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(180, 30, 320, 175);

    // Soft sunlit tropical clouds
    const clouds: ReadonlyArray<readonly [number, number, number, number, string]> = [
      [115, 68, 75, 16, 'rgba(255, 232, 202, 0.42)'],
      [155, 62, 52, 14, 'rgba(255, 240, 215, 0.50)'],
      [285, 54, 88, 15, 'rgba(255, 236, 208, 0.46)'],
      [420, 78, 68, 13, 'rgba(255, 224, 190, 0.38)'],
      [230, 105, 95, 11, 'rgba(255, 216, 172, 0.35)'],
    ];
    for (const [cx, cy, rx, ry, col] of clouds) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Distant misty volcanic headland (Hawaiian island silhouette on horizon)
    ctx.fillStyle = '#6d7c86';
    ctx.beginPath();
    ctx.moveTo(210, 192);
    ctx.quadraticCurveTo(255, 152, 305, 168);
    ctx.quadraticCurveTo(345, 176, 385, 192);
    ctx.closePath();
    ctx.fill();

    // 3. Iconic Na Pali / Ko'olau fluted emerald volcanic mountain ridges on the left & midground
    const backRidgeGrad = ctx.createLinearGradient(0, 82, 260, 195);
    backRidgeGrad.addColorStop(0.0, '#2c4d3e');
    backRidgeGrad.addColorStop(0.55, '#3b6448');
    backRidgeGrad.addColorStop(1.0, '#5c7c54');
    ctx.fillStyle = backRidgeGrad;
    ctx.beginPath();
    ctx.moveTo(0, 194);
    ctx.lineTo(0, 96);
    ctx.lineTo(38, 78);
    ctx.lineTo(76, 94);
    ctx.lineTo(118, 84);
    ctx.lineTo(162, 118);
    ctx.lineTo(208, 136);
    ctx.lineTo(268, 184);
    ctx.lineTo(295, 194);
    ctx.closePath();
    ctx.fill();

    // Sunlit golden-green fluted pali ribs & deep shadowed tropical valleys
    const paliRibs: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
      [38, 78, 18, 192, 54, 192],
      [76, 94, 62, 192, 95, 192],
      [118, 84, 102, 192, 142, 192],
      [162, 118, 148, 192, 188, 192],
      [208, 136, 194, 192, 242, 192],
    ];
    for (const [px, py, lx, ly, rx, ry] of paliRibs) {
      // Warm sunlit right slope of each fluted ridge
      ctx.fillStyle = 'rgba(138, 168, 92, 0.52)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo((lx + rx) * 0.5, (ly + ry) * 0.5);
      ctx.lineTo(rx, ry);
      ctx.closePath();
      ctx.fill();

      // Deep emerald shadow on the left valley fold
      ctx.fillStyle = 'rgba(26, 48, 38, 0.45)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(lx, ly);
      ctx.lineTo((lx + rx) * 0.5, (ly + ry) * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Pacific Ocean Bay (deep cobalt horizon -> glowing turquoise lagoon -> shallow aquamarine)
    const oceanGrad = ctx.createLinearGradient(0, 190, 0, 325);
    oceanGrad.addColorStop(0.0, '#1d5b78');
    oceanGrad.addColorStop(0.35, '#1e7c8c');
    oceanGrad.addColorStop(0.7, '#3aa3a0');
    oceanGrad.addColorStop(1.0, '#7cc4b0');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 190, 512, 170);

    // Golden sunset shimmer path across the water
    for (let i = 0; i < 28; i++) {
      const wy = 194 + i * 4.2;
      const spread = 18 + i * 2.2;
      const sx = 345 - spread * 0.5 + Math.sin(i * 1.7) * 6;
      ctx.fillStyle = `rgba(255, 226, 152, ${0.42 - i * 0.012})`;
      ctx.fillRect(sx, wy, spread, 2.2);
    }

    // 5. Curving Golden Hawaiian Sand Beach (right & foreground bay curve)
    const sandGrad = ctx.createLinearGradient(120, 245, 420, 360);
    sandGrad.addColorStop(0.0, '#e6c994');
    sandGrad.addColorStop(0.5, '#d9b376');
    sandGrad.addColorStop(1.0, '#c4995c');
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.moveTo(0, 312);
    ctx.quadraticCurveTo(145, 292, 238, 252);
    ctx.quadraticCurveTo(282, 232, 295, 194);
    ctx.lineTo(512, 194);
    ctx.lineTo(512, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Re-carve the curving turquoise bay over the upper-right so the beach forms a sweeping crescent
    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.moveTo(185, 190);
    ctx.lineTo(512, 190);
    ctx.lineTo(512, 268);
    ctx.quadraticCurveTo(360, 272, 255, 248);
    ctx.quadraticCurveTo(195, 232, 185, 190);
    ctx.closePath();
    ctx.fill();

    // Creamy white-water Pacific surf & reef rollers curving into the bay
    ctx.strokeStyle = 'rgba(250, 252, 248, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 308);
    ctx.quadraticCurveTo(148, 286, 252, 248);
    ctx.quadraticCurveTo(358, 268, 512, 265);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(236, 248, 245, 0.62)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 292);
    ctx.quadraticCurveTo(138, 272, 238, 236);
    ctx.quadraticCurveTo(352, 252, 512, 248);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(236, 248, 245, 0.45)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(45, 264);
    ctx.quadraticCurveTo(155, 250, 225, 222);
    ctx.stroke();

    // 6. Lush foreground headland & graceful Hawaiian coconut palms on the right bluff
    ctx.fillStyle = '#263f2e';
    ctx.beginPath();
    ctx.moveTo(355, 360);
    ctx.quadraticCurveTo(405, 302, 512, 295);
    ctx.lineTo(512, 360);
    ctx.closePath();
    ctx.fill();

    const drawPalmTree = (
      baseX: number,
      baseY: number,
      topX: number,
      topY: number,
      ctrlX: number,
      ctrlY: number,
      scale: number
    ): void => {
      // Curved coconut palm trunk
      ctx.strokeStyle = '#2b241d';
      ctx.lineWidth = 6.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, topX, topY);
      ctx.stroke();

      // Crown of arching palm fronds
      const frondAngles: ReadonlyArray<readonly [number, number, number, number]> = [
        [-68, -12, -36, -24],
        [-54, 22, -28, -4],
        [-22, -48, -10, -28],
        [18, -52, 10, -30],
        [58, -26, 32, -22],
        [66, 16, 36, -6],
        [32, 38, 18, 12],
      ];
      for (const [dx, dy, cx, cy] of frondAngles) {
        ctx.strokeStyle = '#1f3826';
        ctx.lineWidth = 3.2 * scale;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(
          topX + cx * scale,
          topY + cy * scale,
          topX + dx * scale,
          topY + dy * scale
        );
        ctx.stroke();

        // Warm golden sunset highlight along upper frond edge
        ctx.strokeStyle = 'rgba(168, 184, 96, 0.42)';
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(
          topX + cx * scale,
          topY + (cy - 2) * scale,
          topX + dx * scale,
          topY + (dy - 2) * scale
        );
        ctx.stroke();
      }
    };

    drawPalmTree(448, 336, 398, 118, 412, 228, 1.05);
    drawPalmTree(476, 342, 446, 148, 456, 245, 0.88);
    drawPalmTree(418, 348, 368, 174, 388, 258, 0.74);

    // 7. Subtle fine-art canvas weave & warm gallery varnish grain
    ctx.fillStyle = 'rgba(255, 248, 232, 0.035)';
    for (let y = 0; y < 360; y += 3) {
      ctx.fillRect(0, y, 512, 1);
    }
    for (let x = 0; x < 512; x += 3) {
      ctx.fillRect(x, 0, 1, 360);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedHawaiiArtTex = tex;
  return tex;
}

let cachedWelshSlateTex: THREE.CanvasTexture | null = null;

export function createWelshSlateRoofTexture(): THREE.CanvasTexture {
  if (cachedWelshSlateTex) {
    return cachedWelshSlateTex;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Authentic weathered Welsh Penrhyn / Ffestiniog blue-grey & heather-plum riven slate base
    ctx.fillStyle = '#4a525d';
    ctx.fillRect(0, 0, 1024, 1024);

    const numRows = 16;
    const numCols = 8;
    const courseH = 1024 / numRows; // 64px per course
    const tileW = 1024 / numCols;   // 128px per slate width
    const slatePalette = [
      '#464e59',
      '#4f5763',
      '#555d69',
      '#424954',
      '#585e6a',
      '#4b525e',
      '#484f5a',
      '#5b626e',
      '#515661',
      '#444b56',
    ];

    for (let row = 0; row < numRows; row++) {
      const y0 = row * courseH;
      const stagger = (row % 2) * (tileW * 0.5);

      for (let col = -1; col < numCols + 1; col++) {
        const x0 = col * tileW + stagger;
        const seed = Math.abs(row * 43 + col * 29 + row * col * 11);
        const baseColor = slatePalette[seed % slatePalette.length] ?? '#4a525d';
        ctx.fillStyle = baseColor;
        ctx.fillRect(x0, y0, tileW, courseH);

        // Natural riven slate mineral striations & subtle cleavage planes across each individual slate
        const striationCount = 5;
        for (let s = 0; s < striationCount; s++) {
          const sy = y0 + ((seed * 13 + s * 17) % (courseH - 8));
          const sh = 4 + ((seed + s * 7) % 10);
          ctx.fillStyle =
            s % 2 === 0 ? 'rgba(220, 228, 238, 0.045)' : 'rgba(20, 24, 30, 0.05)';
          ctx.fillRect(x0 + 3, sy, tileW - 6, sh);
        }

        // Subtle warm lichen / weathered mineral fleck on occasional slates
        if (seed % 5 === 0) {
          ctx.fillStyle = 'rgba(138, 144, 132, 0.08)';
          ctx.beginPath();
          ctx.ellipse(
            x0 + tileW * 0.5 + ((seed % 3) - 1) * 18,
            y0 + courseH * 0.55,
            18,
            9,
            0.2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Narrow dark perp-joint gap between adjacent slates in the same course (no bright white borders!)
        ctx.fillStyle = '#262b32';
        ctx.fillRect(x0, y0, 3, courseH);
        ctx.fillStyle = 'rgba(95, 104, 116, 0.25)';
        ctx.fillRect(x0 + 3, y0 + 2, 2, courseH - 6);
      }

      // Stepped overlap shadow under the bottom tail of each slate course (gives 3D layered shingle depth)
      const tailShadow = ctx.createLinearGradient(0, y0 + courseH - 10, 0, y0 + courseH);
      tailShadow.addColorStop(0, 'rgba(30, 35, 42, 0)');
      tailShadow.addColorStop(0.65, 'rgba(26, 30, 36, 0.45)');
      tailShadow.addColorStop(1, 'rgba(18, 21, 26, 0.82)');
      ctx.fillStyle = tailShadow;
      ctx.fillRect(0, y0 + courseH - 10, 1024, 10);

      // Soft riven bevel along the bottom edge of each slate course
      ctx.fillStyle = '#232830';
      ctx.fillRect(0, y0 + courseH - 3, 1024, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7.5, 3.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedWelshSlateTex = tex;
  return tex;
}

export function createGraniteSettDepthMapTexture(): THREE.CanvasTexture {
  return createGraniteSettLPathTextures().depthMap;
}

let cachedGraniteSettLPathTextures: {
  readonly colorMap: THREE.CanvasTexture;
  readonly depthMap: THREE.CanvasTexture;
} | null = null;

/**
 * Generates a single unified, high-resolution color + depth texture pair covering the entire
 * L-shaped cobblestone path (South run Z = +2.84m..+4.30m, 90-degree SE corner, and East run X = +5.95m..+7.41m)
 * so the repeating arc-like granite sett courses flow continuously around the corner as part of the same image.
 */
export function createGraniteSettLPathTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly depthMap: THREE.CanvasTexture;
} {
  if (cachedGraniteSettLPathTextures) {
    return cachedGraniteSettLPathTextures;
  }

  // World-space bounds of the T-shaped cobblestone path around the Kitchen, Patio & Pergola:
  // X: -4.64m to +6.74m (span 11.38m)
  // Z: -2.78m to +7.35m (span 10.13m — covers North Utility door at -2.78m, South Kitchen path at 2.27..3.73m,
  //                      and the full South branch between the Patio and Pergola down to Z = +7.35m, Issue #2!)
  const worldMinX = -4.64;
  const worldSpanX = 11.38;
  const worldMinZ = -2.78;
  const worldSpanZ = 10.13;

  const width = 1600;
  const height = 1424; // Matches 11.38 : 10.13 aspect ratio (~140.6 px/m in both X and Z)
  const pxPerMeterX = width / worldSpanX;
  const pxPerMeterZ = height / worldSpanZ;
  const pxPerMeter = (pxPerMeterX + pxPerMeterZ) * 0.5;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const cCtx = colorCanvas.getContext('2d');

  const depthCanvas = document.createElement('canvas');
  depthCanvas.width = width;
  depthCanvas.height = height;
  const dCtx = depthCanvas.getContext('2d');

  if (cCtx && dCtx) {
    const hash01 = (n: number): number => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    // 1. Weathered sandy-lime mortar bed with organic earth/moss patina variation & recessed mortar depth
    cCtx.fillStyle = '#c6b38e';
    cCtx.fillRect(0, 0, width, height);

    dCtx.fillStyle = '#141414';
    dCtx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const h1 = hash01(x * 17 + y * 31);
        const h2 = hash01(x * 41 + y * 19 + 11);
        const macro =
          Math.sin(x * 0.012 + y * 0.009) * 6 +
          Math.cos(x * 0.021 - y * 0.017) * 5;
        const delta = Math.round((h1 - 0.5) * 18 + macro);
        // Occasional subtle mossy/earthy joint patina (~14% of mortar cells)
        const mossShift = h2 > 0.86 ? 12 : 0;
        const mr = Math.max(145, Math.min(225, 198 + delta - mossShift));
        const mg = Math.max(135, Math.min(210, 179 + delta + Math.round(mossShift * 0.4)));
        const mb = Math.max(105, Math.min(180, 142 + delta - mossShift));
        cCtx.fillStyle = `rgb(${mr}, ${mg}, ${mb})`;
        cCtx.fillRect(x, y, 4, 4);

        const dv = Math.max(8, Math.min(36, 20 + Math.round(delta * 0.65)));
        dCtx.fillStyle = `rgb(${dv}, ${dv}, ${dv})`;
        dCtx.fillRect(x, y, 4, 4);
      }
    }

    const granitePalette: ReadonlyArray<readonly [number, number, number]> = [
      [125, 129, 134], // Weathered silver-grey granite
      [108, 115, 123], // Blue-grey Leicestershire sett
      [143, 123, 116], // Warm porphyry rose-grey
      [146, 136, 121], // Buff-taupe weathered gritstone
      [98, 102, 108],  // Dark charcoal-slate sett
      [134, 137, 142], // Pale quartz-grey granite
      [127, 109, 103], // Earthy brown-rose granite
      [116, 121, 126], // Mid steel-grey granite
      [155, 143, 128], // Warm honey-sandstone sett
      [91, 96, 102],   // Deep basalt-grey sett
      [138, 128, 118], // Weathered warm greige
      [112, 106, 100], // Smoked umber-grey sett
    ];

    // Helper to trace an organic, hand-cleaved granite sett contour (8-point irregular chamfered polygon)
    const traceOrganicCobblePath = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      seed: number,
      inset = 0
    ): void => {
      const hw = Math.max(2, w * 0.5 - inset);
      const hh = Math.max(2, h * 0.5 - inset);
      const cTL = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 1) * 2.6);
      const cTR = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 2) * 2.6);
      const cBR = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 3) * 2.6);
      const cBL = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 4) * 2.6);
      const skewT = (hash01(seed + 5) - 0.5) * 1.6;
      const skewB = (hash01(seed + 6) - 0.5) * 1.6;
      const skewL = (hash01(seed + 7) - 0.5) * 1.4;
      const skewR = (hash01(seed + 8) - 0.5) * 1.4;

      ctx.beginPath();
      ctx.moveTo(-hw + cTL, -hh + skewT * 0.4);
      ctx.lineTo(0, -hh - skewT * 0.5);
      ctx.lineTo(hw - cTR, -hh + skewT * 0.3);
      ctx.quadraticCurveTo(hw, -hh, hw + skewR * 0.3, -hh + cTR);
      ctx.lineTo(hw - skewR * 0.4, 0);
      ctx.lineTo(hw + skewR * 0.2, hh - cBR);
      ctx.quadraticCurveTo(hw, hh, hw - cBR, hh + skewB * 0.3);
      ctx.lineTo(0, hh - skewB * 0.5);
      ctx.lineTo(-hw + cBL, hh + skewB * 0.4);
      ctx.quadraticCurveTo(-hw, hh, -hw + skewL * 0.3, hh - cBL);
      ctx.lineTo(-hw - skewL * 0.4, 0);
      ctx.lineTo(-hw + skewL * 0.2, -hh + cTL);
      ctx.quadraticCurveTo(-hw, -hh, -hw + cTL, -hh + skewT * 0.4);
      ctx.closePath();
    };

    const drawSingleGraniteSett = (
      wx: number,
      wz: number,
      totalAngle: number,
      baseCobbleW: number,
      baseCobbleH: number,
      seed: number
    ): void => {
      // Organic per-stone position, angle & dimensional jitter (Issue #1: natural hand-laid look)
      const jitterS = (hash01(seed * 13 + 1) - 0.5) * 0.009;
      const jitterU = (hash01(seed * 17 + 2) - 0.5) * 0.008;
      const cxPx = (wx + jitterS - worldMinX) * pxPerMeterX;
      const cyPx = (wz + jitterU - worldMinZ) * pxPerMeterZ;
      if (cxPx < -24 || cxPx > width + 24 || cyPx < -24 || cyPx > height + 24) {
        return;
      }

      const angleJitter = (hash01(seed * 19 + 3) - 0.5) * 0.095;
      const wScale = 0.88 + hash01(seed * 23 + 4) * 0.24;
      const hScale = 0.90 + hash01(seed * 29 + 5) * 0.20;
      const cobbleW = Math.max(9, baseCobbleW * wScale);
      const cobbleH = Math.max(9, baseCobbleH * hScale);

      const [r0, g0, b0] =
        granitePalette[Math.abs(seed * 7) % granitePalette.length] ?? [125, 129, 134];
      // Macro spatial weathering + per-stone tonal variation
      const macroTone =
        Math.sin(wx * 1.15 + wz * 0.95) * 8 +
        Math.cos(wx * 0.65 - wz * 1.35) * 6;
      const stoneDelta = Math.round((hash01(seed * 31 + 6) - 0.5) * 24 + macroTone);
      const warmShift = Math.round((hash01(seed * 37 + 7) - 0.5) * 10);
      const cr = Math.max(55, Math.min(205, r0 + stoneDelta + warmShift));
      const cg = Math.max(55, Math.min(200, g0 + stoneDelta));
      const cb = Math.max(55, Math.min(198, b0 + stoneDelta - warmShift));
      const cobbleHeightBias = Math.round((hash01(seed * 41 + 8) - 0.5) * 34);

      // Draw cobble in Color Map
      cCtx.save();
      cCtx.translate(cxPx, cyPx);
      cCtx.rotate(totalAngle + angleJitter);

      // 1. Dark mortar-edge perimeter rim
      cCtx.fillStyle = `rgb(${Math.max(40, cr - 22)}, ${Math.max(40, cg - 22)}, ${Math.max(40, cb - 22)})`;
      traceOrganicCobblePath(cCtx, cobbleW, cobbleH, seed, 0);
      cCtx.fill();

      // 2. Riven granite body with natural diagonal mineral gradient
      const grad = cCtx.createLinearGradient(
        -cobbleW * 0.5,
        -cobbleH * 0.5,
        cobbleW * 0.5,
        cobbleH * 0.5
      );
      grad.addColorStop(
        0,
        `rgb(${Math.min(225, cr + 12)}, ${Math.min(220, cg + 11)}, ${Math.min(218, cb + 10)})`
      );
      grad.addColorStop(0.55, `rgb(${cr}, ${cg}, ${cb})`);
      grad.addColorStop(
        1,
        `rgb(${Math.max(42, cr - 14)}, ${Math.max(42, cg - 14)}, ${Math.max(42, cb - 14)})`
      );
      cCtx.fillStyle = grad;
      traceOrganicCobblePath(cCtx, cobbleW, cobbleH, seed, 1.1);
      cCtx.fill();

      // 3. Natural quartz/feldspar mineral speckles & riven cleavage facets
      for (let k = 0; k < 3; k++) {
        const sx = (hash01(seed * 43 + k * 7) - 0.5) * (cobbleW * 0.55);
        const sy = (hash01(seed * 47 + k * 11) - 0.5) * (cobbleH * 0.55);
        const isLightSpeck = (seed + k) % 2 === 0;
        cCtx.fillStyle = isLightSpeck
          ? 'rgba(245, 238, 225, 0.16)'
          : 'rgba(28, 30, 34, 0.16)';
        cCtx.fillRect(sx - 1.5, sy - 1.5, 3, 2.5);
      }

      cCtx.strokeStyle = 'rgba(255, 248, 235, 0.16)';
      cCtx.lineWidth = 0.9;
      cCtx.stroke();
      cCtx.restore();

      // Draw cobble in 3D Depth Map
      dCtx.save();
      dCtx.translate(cxPx, cyPx);
      dCtx.rotate(totalAngle + angleJitter);

      const rings: ReadonlyArray<readonly [number, number]> = [
        [0.0, 92],
        [1.3, 152],
        [2.6, 204],
        [4.2, 236],
      ];
      for (const [inset, baseLum] of rings) {
        const lum = Math.max(42, Math.min(255, baseLum + cobbleHeightBias));
        dCtx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
        traceOrganicCobblePath(dCtx, cobbleW, cobbleH, seed, inset);
        dCtx.fill();
      }
      dCtx.restore();
    };

    // Path geometry & continuous repeating arc parameters in meters:
    const pathW = 1.46;
    const numRows = 8;
    const cobbleStepU = pathW / numRows; // 0.1825m across path width
    const courseStep = 0.1437559;        // 0.1438m per arc course along path
    const arcPivotR = 1.18;
    const baseCobbleW = (courseStep - 0.026) * pxPerMeter;
    const baseCobbleH = (cobbleStepU - 0.026) * pxPerMeter;

    // 1) Continuous North-to-South East Cobble Path (X = +5.28m..+6.74m, Z = -2.78m..+7.35m)
    //    Runs smoothly from the Utility Room door (Z = -1.85m) past the Kitchen East window
    //    AND straight South between the Patio East brick wall (X = +5.20m) and Pergola (X = +6.82m)
    //    with zero corner distortion and zero UV clamping at [5.633, -0.01, 6.632] (Issue #2)!
    for (let c = -22; c <= 54; c++) {
      const staggerU = (Math.abs(c) % 2) * (cobbleStepU * 0.5);
      for (let s = 0; s < numRows; s++) {
        const u = (s + 0.5) * cobbleStepU + (staggerU - cobbleStepU * 0.25) * 0.55;
        const du = u - pathW * 0.5;
        const clampedDu = Math.max(-arcPivotR + 0.15, Math.min(arcPivotR - 0.15, du));
        const arcBow = arcPivotR - Math.sqrt(arcPivotR * arcPivotR - clampedDu * clampedDu);
        const arcTangentAngle = Math.asin(clampedDu / arcPivotR);

        const wx = 5.28 + u;
        const wz = c * courseStep - arcBow;
        if (wz < -2.85 || wz > 7.42) continue;

        const seed = (c + 64) * 37 + (s + 12) * 19 + 101;
        drawSingleGraniteSett(
          wx,
          wz,
          -Math.PI * 0.5 + arcTangentAngle,
          baseCobbleW,
          baseCobbleH,
          seed
        );
      }
    }

    // 2) South Cobble Path in front of the Kitchen Bifold Doors (X = -4.64m..+5.28m, Z = +2.27m..+3.73m)
    //    Meets the East Cobble Path cleanly along the X = +5.28m threshold line!
    for (let c = -72; c <= 38; c++) {
      const staggerU = (Math.abs(c) % 2) * (cobbleStepU * 0.5);
      for (let s = 0; s < numRows; s++) {
        const u = (s + 0.5) * cobbleStepU + (staggerU - cobbleStepU * 0.25) * 0.55;
        const du = u - pathW * 0.5;
        const clampedDu = Math.max(-arcPivotR + 0.15, Math.min(arcPivotR - 0.15, du));
        const arcBow = arcPivotR - Math.sqrt(arcPivotR * arcPivotR - clampedDu * clampedDu);
        const arcTangentAngle = Math.asin(clampedDu / arcPivotR);

        const wx = c * courseStep - arcBow;
        const wz = 2.27 + u;
        // Stop cleanly at X = 5.26m so it never overlaps the continuous East path (X = 5.28..6.74m)
        if (wx < -4.75 || wx > 5.24) continue;

        const seed = (c + 128) * 41 + (s + 16) * 23 + 17;
        drawSingleGraniteSett(wx, wz, arcTangentAngle, baseCobbleW, baseCobbleH, seed);
      }
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.ClampToEdgeWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 8;

  const depthMap = new THREE.CanvasTexture(depthCanvas);
  depthMap.wrapS = THREE.ClampToEdgeWrapping;
  depthMap.wrapT = THREE.ClampToEdgeWrapping;
  depthMap.anisotropy = 8;

  cachedGraniteSettLPathTextures = { colorMap, depthMap };
  return cachedGraniteSettLPathTextures;
}

let cachedImperialBrickTextures: {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} | null = null;

export function createImperialBrickTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  if (cachedImperialBrickTextures) {
    return cachedImperialBrickTextures;
  }

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 512;
  colorCanvas.height = 512;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && bCtx) {
    // Deterministic hash in [0, 1) for repeatable organic randomness
    const hash01 = (n: number): number => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    // 1. Weathered lime-sand & grit mortar bed in colorMap & recessed uneven mortar joints in bumpMap
    cCtx.fillStyle = '#cabba0';
    cCtx.fillRect(0, 0, 512, 512);

    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 3) {
      for (let x = 0; x < 512; x += 3) {
        // Periodic mod-512 coordinates so mortar grain is 100% seamless across tile boundaries
        const mx = x % 512;
        const my = y % 512;
        const h1 = hash01(mx * 17 + my * 31);
        const h2 = hash01(mx * 43 + my * 13 + 7);
        const d = Math.round((h1 - 0.5) * 24);
        const warmShift = Math.round((h2 - 0.5) * 10);
        cCtx.fillStyle = `rgb(${202 + d + warmShift}, ${188 + d}, ${161 + d - warmShift})`;
        cCtx.fillRect(x, y, 3, 3);

        // Subtle coarse sand/lime aggregate grit in mortar bump map
        const mb = Math.round(18 + h1 * 22);
        bCtx.fillStyle = `rgb(${mb}, ${mb}, ${mb})`;
        bCtx.fillRect(x, y, 3, 3);
      }
    }

    // Handmade English Imperial Multi-Stock Brick palette (~20% more rustic variation:
    // sun-baked terracotta, weathered russet, smoky kiln-flashed sienna, earthy buff-red, and dark vitrified clinker headers)
    const stretcherPalette: ReadonlyArray<readonly [number, number, number]> = [
      [162, 72, 53],  // Classic warm imperial red
      [176, 82, 57],  // Terracotta orange-red
      [142, 59, 43],  // Deep kiln red
      [186, 94, 64],  // Warm sandy orange-red
      [152, 67, 49],  // Weathered farmhouse red
      [168, 76, 55],  // Rich clay red
      [131, 53, 40],  // Dark russet red
      [181, 87, 60],  // Brighter handmade clay
      [124, 54, 43],  // Over-fired smoky brown-red
      [170, 88, 63],  // Weathered earthy ochre-red
      [146, 68, 52],  // Muted dusty rose-umber
      [190, 96, 66],  // Sun-bleached salmon-terracotta
    ];
    const headerPalette: ReadonlyArray<readonly [number, number, number]> = [
      [120, 56, 45],  // Vitrified plum/clinker header
      [142, 63, 47],  // Deep burnt header
      [158, 72, 53],  // Classic red header
      [108, 49, 41],  // Dark kiln-flashed charcoal-plum header
      [134, 64, 50],  // Weathered ash-glazed header
      [172, 80, 56],  // Warm orange-red header
    ];

    // 16 courses across 512px -> each course is 32px tall (representing 83mm Imperial course height: 73mm brick + 10mm lime mortar)
    // Flemish bond pattern per course: alternating Stretcher + Header + mortar = 128px repeating unit (4 units per 512px)
    const numCourses = 16;
    const courseH = 512 / numCourses; // 32px
    const mortarH = 4.8;
    const brickH = courseH - mortarH; // 27.2px
    const unitW = 128;
    const stretcherW = 81;
    const headerW = 38;
    const mortarW = 4.5;

    // Traces an irregular hand-moulded clay brick polygon with subtle wavy top/bottom arris & rounded corners
    const traceRusticBrickPath = (
      ctx: CanvasRenderingContext2D,
      bx: number,
      by: number,
      bw: number,
      bh: number,
      seed: number,
      inset = 0
    ): void => {
      const xL = bx + inset;
      const xR = bx + bw - inset;
      const yT = by + inset;
      const yB = by + bh - inset;
      const wSpan = xR - xL;
      const hSpan = yB - yT;
      const c = Math.max(1.2, 2.8 - inset * 0.5);

      const tWave1 = (hash01(seed * 11 + 1) - 0.5) * 1.8;
      const tWave2 = (hash01(seed * 11 + 2) - 0.5) * 1.8;
      const bWave1 = (hash01(seed * 11 + 3) - 0.5) * 1.8;
      const bWave2 = (hash01(seed * 11 + 4) - 0.5) * 1.8;
      const lWave = (hash01(seed * 11 + 5) - 0.5) * 1.4;
      const rWave = (hash01(seed * 11 + 6) - 0.5) * 1.4;

      ctx.beginPath();
      ctx.moveTo(xL + c, yT);
      ctx.lineTo(xL + wSpan * 0.35, yT + tWave1);
      ctx.lineTo(xL + wSpan * 0.68, yT + tWave2);
      ctx.lineTo(xR - c, yT);
      ctx.quadraticCurveTo(xR, yT, xR, yT + c);
      ctx.lineTo(xR + rWave, yT + hSpan * 0.5);
      ctx.lineTo(xR, yB - c);
      ctx.quadraticCurveTo(xR, yB, xR - c, yB);
      ctx.lineTo(xL + wSpan * 0.65, yB + bWave2);
      ctx.lineTo(xL + wSpan * 0.32, yB + bWave1);
      ctx.lineTo(xL + c, yB);
      ctx.quadraticCurveTo(xL, yB, xL, yB - c);
      ctx.lineTo(xL + lWave, yT + hSpan * 0.5);
      ctx.lineTo(xL, yT + c);
      ctx.quadraticCurveTo(xL, yT, xL + c, yT);
      ctx.closePath();
    };

    const drawBrick = (
      x0: number,
      y0: number,
      w: number,
      h: number,
      rgb: readonly [number, number, number],
      seed: number
    ): void => {
      const [r, g, b] = rgb;
      // Stronger per-brick tonal & saturation jitter (~20% more rustic)
      const delta = Math.round((hash01(seed * 19 + 3) - 0.5) * 26);
      const warmTint = Math.round((hash01(seed * 31 + 9) - 0.5) * 12);
      const br = Math.max(38, Math.min(238, r + delta + warmTint));
      const bg = Math.max(28, Math.min(212, g + Math.round(delta * 0.68)));
      const bb = Math.max(22, Math.min(195, b + Math.round(delta * 0.48) - Math.round(warmTint * 0.4)));

      // Subtle handmade dimensional jitter in position & size
      const jitterX = (hash01(seed * 23 + 5) - 0.5) * 1.8;
      const jitterY = (hash01(seed * 29 + 7) - 0.5) * 1.6;
      const jitterW = (hash01(seed * 37 + 11) - 0.5) * 2.2;
      const jitterH = (hash01(seed * 41 + 13) - 0.5) * 1.8;
      const effY = y0 + jitterY;
      const effW = w + jitterW;
      const effH = h + jitterH;

      // Draw wrapped across X = 0..512 so horizontal tiling is 100% seamless
      for (const wrapOffsetX of [-512, 0, 512]) {
        const bx = x0 + jitterX + wrapOffsetX;
        if (bx + effW < -2 || bx > 514) continue;

        // 1. Base handmade clay brick body with irregular hand-moulded arris
        cCtx.fillStyle = `rgb(${br}, ${bg}, ${bb})`;
        traceRusticBrickPath(cCtx, bx, effY, effW, effH, seed, 0);
        cCtx.fill();

        // 2. Kiln-flashing / coal-fired scorch patch on ~45% of bricks for authentic period character
        const flashRoll = hash01(seed * 47 + 17);
        if (flashRoll < 0.45) {
          const fx = bx + effW * (0.2 + 0.6 * hash01(seed * 53 + 1));
          const fy = effY + effH * (0.25 + 0.5 * hash01(seed * 59 + 2));
          const fr = Math.max(10, effW * (0.28 + 0.25 * hash01(seed * 61 + 3)));
          const grad = cCtx.createRadialGradient(fx, fy, 1, fx, fy, fr);
          if (flashRoll < 0.26) {
            // Dark vitrified kiln-burn / soot kiss mark
            grad.addColorStop(0, 'rgba(38, 22, 18, 0.34)');
            grad.addColorStop(1, 'rgba(38, 22, 18, 0)');
          } else {
            // Warm oxidized terracotta / sandy clay bloom
            grad.addColorStop(0, 'rgba(224, 132, 82, 0.28)');
            grad.addColorStop(1, 'rgba(224, 132, 82, 0)');
          }
          cCtx.fillStyle = grad;
          traceRusticBrickPath(cCtx, bx, effY, effW, effH, seed, 0.5);
          cCtx.fill();
        }

        // 3. Top edge warm sunlight catch & bottom edge weathered shadow
        cCtx.fillStyle = 'rgba(255, 235, 210, 0.13)';
        cCtx.fillRect(bx + 2.5, effY + 1, effW - 5, 2);
        cCtx.fillStyle = 'rgba(32, 16, 10, 0.20)';
        cCtx.fillRect(bx + 2.5, effY + effH - 2.6, effW - 5, 2.2);

        // 4. Natural handmade clay face mottling, sand-creased folds & occasional lime mortar smudge
        for (let py = 3; py < effH - 3; py += 5) {
          for (let px = 4; px < effW - 4; px += 7) {
            const cellHash = hash01(px * 23 + py * 41 + seed * 13);
            const m = Math.round((cellHash - 0.5) * 28);
            const patchW = 5 + Math.round(hash01(px * 17 + seed) * 4);
            const patchH = 3 + Math.round(hash01(py * 19 + seed) * 3);
            cCtx.fillStyle = `rgb(${Math.max(30, Math.min(245, br + m))}, ${Math.max(24, Math.min(220, bg + Math.round(m * 0.72)))}, ${Math.max(20, Math.min(205, bb + Math.round(m * 0.52)))})`;
            cCtx.fillRect(bx + px, effY + py, patchW, patchH);
          }
        }

        // Occasional subtle weathered lime-wash / mortar kiss along the brick edge (~28% of bricks)
        if (hash01(seed * 67 + 23) < 0.28) {
          const sx = bx + 3 + hash01(seed * 71) * Math.max(4, effW - 16);
          const sy = effY + (hash01(seed * 73) < 0.5 ? 1 : effH - 5);
          cCtx.fillStyle = 'rgba(212, 198, 174, 0.26)';
          cCtx.fillRect(sx, sy, 6 + hash01(seed * 79) * 8, 3.2);
        }

        // 5. Bump Map: Stronger per-brick relief variation, rounded arris & sand-creased surface pitting
        const bumpBias = Math.round((hash01(seed * 17 + 5) - 0.5) * 38);
        const edgeLum = Math.max(80, Math.min(185, 130 + bumpBias));
        const faceLum = Math.max(172, Math.min(252, 222 + bumpBias));

        bCtx.fillStyle = `rgb(${edgeLum}, ${edgeLum}, ${edgeLum})`;
        traceRusticBrickPath(bCtx, bx, effY, effW, effH, seed, 0);
        bCtx.fill();

        bCtx.fillStyle = `rgb(${faceLum}, ${faceLum}, ${faceLum})`;
        traceRusticBrickPath(bCtx, bx, effY, effW, effH, seed, 2.2);
        bCtx.fill();

        // Handmade sand-crease & surface pitting in bump map
        const creaseLum = Math.max(130, faceLum - 32);
        const creaseY = effY + effH * (0.38 + 0.24 * hash01(seed * 83));
        bCtx.fillStyle = `rgb(${creaseLum}, ${creaseLum}, ${creaseLum})`;
        bCtx.fillRect(bx + 5, creaseY, effW - 10, 2.2);

        for (let p = 0; p < 5; p++) {
          const pitX = bx + 4 + hash01(seed * 89 + p * 7) * Math.max(4, effW - 12);
          const pitY = effY + 4 + hash01(seed * 97 + p * 11) * Math.max(4, effH - 10);
          const pitLum = Math.max(120, faceLum - Math.round(18 + hash01(seed + p) * 26));
          bCtx.fillStyle = `rgb(${pitLum}, ${pitLum}, ${pitLum})`;
          bCtx.fillRect(pitX, pitY, 4, 3);
        }
      }
    };

    for (let row = 0; row < numCourses; row++) {
      // Slight per-course mortar bed undulation (periodic across 16 courses)
      const courseWaveY = Math.sin((row / numCourses) * Math.PI * 4) * 0.45;
      const y0 = row * courseH + mortarH * 0.5 + courseWaveY;
      // In Flemish bond, odd courses shift by half a repeating unit (64px)
      const rowShift = (row % 2) * (unitW * 0.5);

      for (let u = 0; u < 4; u++) {
        const baseX = u * unitW + rowShift;
        const seed1 = row * 37 + u * 13 + 7;
        const stretcherRgb =
          stretcherPalette[Math.abs(seed1 * 7 + row * 3) % stretcherPalette.length] ?? [162, 72, 53];
        drawBrick(baseX, y0, stretcherW, brickH, stretcherRgb, seed1);

        const headerX = baseX + stretcherW + mortarW;
        const seed2 = row * 53 + u * 29 + 19;
        const headerRgb =
          headerPalette[Math.abs(seed2 * 5 + row * 11) % headerPalette.length] ?? [136, 62, 48];
        drawBrick(headerX, y0, headerW, brickH, headerRgb, seed2);
      }
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  cachedImperialBrickTextures = { colorMap, bumpMap };
  return cachedImperialBrickTextures;
}

let cachedHerringboneQuarryTextures: {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} | null = null;

/**
 * Generates a 100% seamless, world-scaled 45-degree 3:1 herringbone terracotta sealed quarry tile
 * texture pair (colorMap + bumpMap) for the Entrance Hall and Dining Room floors.
 */
export function createHerringboneTerracottaQuarryTileTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  if (cachedHerringboneQuarryTextures) {
    return cachedHerringboneQuarryTextures;
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

  if (cCtx && bCtx) {
    // Dark charcoal-earth / lime-ash grout bed between sealed terracotta quarry tiles
    cCtx.fillStyle = '#3d332c';
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, 0, size, size);

    // Muted, naturally aged Staffordshire & reclaimed farmhouse terracotta quarry tile palette (Issue #11: slightly lower saturation)
    const quarryPalette: ReadonlyArray<readonly [number, number, number]> = [
      [142, 84, 64],  // Muted sealed terracotta clay
      [132, 77, 58],  // Deep kiln-fired quarry russet
      [150, 91, 68],  // Warm muted sienna clay
      [124, 72, 55],  // Earthy russet brown-red
      [145, 86, 65],  // Soft heritage terracotta
      [136, 80, 61],  // Mid farmhouse weathered clay
      [118, 69, 53],  // Toasted kiln-edge umber-russet
      [154, 94, 71],  // Sunlit sealed warm clay
      [129, 76, 58],  // Aged iron-oxide earth
      [139, 82, 62],  // Traditional muted quarry tile
    ];

    // Exact 45-degree orthogonal herringbone grid with period 12 in (u, v) -> 100% seamless across 512x512
    const periodUV = 12;
    const stepPx = size / periodUV; // 42.6667px in (x+y) and (y-x)
    const tileUnitPx = stepPx / Math.SQRT2; // ~30.17px per tile width
    const groutPx = 2.4;

    const drawRotatedTile = (
      iu0: number,
      iv0: number,
      spanU: number,
      spanV: number
    ): void => {
      // Periodic tile indices modulo 12 guarantee seamless wrap across 0..512
      const pu = ((iu0 % periodUV) + periodUV) % periodUV;
      const pv = ((iv0 % periodUV) + periodUV) % periodUV;
      const seed = pu * 37 + pv * 53 + spanU * 19;
      const [baseR, baseG, baseB] =
        quarryPalette[Math.abs(seed) % quarryPalette.length] ?? [152, 70, 47];
      const delta = ((seed * 17) % 14) - 7;
      const r = Math.max(40, Math.min(225, baseR + delta));
      const g = Math.max(25, Math.min(185, baseG + Math.round(delta * 0.65)));
      const b = Math.max(20, Math.min(165, baseB + Math.round(delta * 0.5)));

      const centerU = iu0 + spanU * 0.5;
      const centerV = iv0 + spanV * 0.5;
      const cx = (centerU - centerV) * (stepPx * 0.5);
      const cy = (centerU + centerV) * (stepPx * 0.5);

      const wPx = spanU * tileUnitPx - groutPx;
      const hPx = spanV * tileUnitPx - groutPx;

      if (
        cx + Math.max(wPx, hPx) < -16 ||
        cx - Math.max(wPx, hPx) > size + 16 ||
        cy + Math.max(wPx, hPx) < -16 ||
        cy - Math.max(wPx, hPx) > size + 16
      ) {
        return;
      }

      // Color Map: Sealed terracotta quarry tile with subtle kiln edge shading & satin wax sheen
      cCtx.save();
      cCtx.translate(cx, cy);
      cCtx.rotate(Math.PI * 0.25);

      // Subtle darker kiln-baked perimeter rim on each handmade quarry tile
      cCtx.fillStyle = `rgb(${Math.max(30, r - 14)}, ${Math.max(20, g - 10)}, ${Math.max(15, b - 8)})`;
      cCtx.beginPath();
      cCtx.roundRect(-wPx * 0.5, -hPx * 0.5, wPx, hPx, 2.2);
      cCtx.fill();

      // Warm sealed terracotta center body
      const bodyGrad = cCtx.createLinearGradient(-wPx * 0.5, -hPx * 0.5, wPx * 0.5, hPx * 0.5);
      bodyGrad.addColorStop(0.0, `rgb(${Math.min(235, r + 6)}, ${Math.min(195, g + 4)}, ${Math.min(175, b + 3)})`);
      bodyGrad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
      bodyGrad.addColorStop(1.0, `rgb(${Math.max(35, r - 8)}, ${Math.max(22, g - 6)}, ${Math.max(18, b - 5)})`);
      cCtx.fillStyle = bodyGrad;
      cCtx.beginPath();
      cCtx.roundRect(-wPx * 0.5 + 1.5, -hPx * 0.5 + 1.5, wPx - 3, hPx - 3, 1.6);
      cCtx.fill();

      // Subtle bevel edge highlight along top-left arris
      cCtx.strokeStyle = 'rgba(255, 224, 196, 0.16)';
      cCtx.lineWidth = 1.0;
      cCtx.strokeRect(-wPx * 0.5 + 1.2, -hPx * 0.5 + 1.2, wPx - 2.4, hPx - 2.4);
      cCtx.restore();

      // Bump Map: Cushioned quarry tile profile above recessed grout
      const bumpBias = ((seed * 23) % 18) - 9;
      const rimLum = Math.max(110, Math.min(190, 150 + bumpBias));
      const faceLum = Math.max(195, Math.min(252, 228 + bumpBias));

      bCtx.save();
      bCtx.translate(cx, cy);
      bCtx.rotate(Math.PI * 0.25);

      bCtx.fillStyle = `rgb(${rimLum}, ${rimLum}, ${rimLum})`;
      bCtx.beginPath();
      bCtx.roundRect(-wPx * 0.5, -hPx * 0.5, wPx, hPx, 2.2);
      bCtx.fill();

      bCtx.fillStyle = `rgb(${faceLum}, ${faceLum}, ${faceLum})`;
      bCtx.beginPath();
      bCtx.roundRect(-wPx * 0.5 + 2.0, -hPx * 0.5 + 2.0, wPx - 4.0, hPx - 4.0, 1.4);
      bCtx.fill();
      bCtx.restore();
    };

    for (let iv = -16; iv <= 28; iv++) {
      for (let iu = -16; iu <= 28; iu++) {
        const m = ((iu - iv) % 6 + 6) % 6;
        if (m === 0) {
          // Horizontal 3:1 quarry tile in (u, v) space
          drawRotatedTile(iu, iv, 3, 1);
        } else if (m === 5) {
          // Vertical 1:3 quarry tile in (u, v) space
          drawRotatedTile(iu, iv, 1, 3);
        }
      }
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  cachedHerringboneQuarryTextures = { colorMap, bumpMap };
  return cachedHerringboneQuarryTextures;
}

let cachedEngineeredOakTextures: {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} | null = null;

/**
 * Generates a seamless, world-scaled 1024x1024 wide-plank European engineered oak floor texture
 * pair (colorMap + bumpMap) modelled on Knot & Grain "The Heritage Supreme Plank"
 * (Grade: Heritage, Colour: Old Farmhouse, Texture: Heavily Brushed, Finish: Natural Oil).
 * Features handcrafted undulated surface shading, heavily brushed open-pore cathedral grain
 * that deflects organically around dark resin-filled Heritage knots, and distressed 4-sided
 * bevelled V-groove edges.
 */
export function createEngineeredOakFloorTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  if (cachedEngineeredOakTextures) {
    return cachedEngineeredOakTextures;
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

  if (cCtx && bCtx) {
    // Knot & Grain "Old Farmhouse" natural oiled Heritage oak palette — shifted slightly darker & richer
    // so under Three.js room/sun lighting it reads as warm aged farmhouse oak rather than pale blonde
    const oakPlankPalette: ReadonlyArray<readonly [number, number, number]> = [
      [172, 132, 93],  // Rich Old Farmhouse honeyed oak (#ac845d)
      [164, 125, 87],  // Warm weathered taupe-amber oak (#a47d57)
      [178, 138, 98],  // Natural oiled farmhouse oak (#b28a62)
      [158, 119, 82],  // Deeper heartwood Heritage oak (#9e7752)
      [182, 143, 103], // Warm sunlit oiled oak (#b68f67)
      [168, 129, 90],  // Balanced aged farmhouse oak (#a8815a)
      [161, 122, 84],  // Warm rustic medium-dark oak (#a17a54)
      [175, 135, 96],  // Golden-umber brushed oak (#af8760)
    ];

    const clampByte = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));

    // World tile = 4.40m (X) x 1.76m (Z):
    // - 8 courses of 128px = 220mm (0.22m) wide planks (8 * 0.22m = 1.76m)
    // - Full-length plank = 512px = 2200mm (2.20m) long (2 * 2.20m = 4.40m)
    // - Packs include ~20% cut lengths: 6 of 8 rows have two full 2200mm (512px) planks;
    //   2 of 8 rows (rows 2 & 6) split one 2200mm plank into two cut lengths (4 cut boards / 18 total = 22%).
    const numRows = 8;
    const rowH = size / numRows; // 128px = 220mm
    const rowJointLayouts: ReadonlyArray<ReadonlyArray<number>> = [
      [0, 512, size],               // Row 0: two full 2200mm planks (joints at 0m, 2.20m)
      [0, 320, 832, size],          // Row 1: two full 2200mm planks staggered by 1.375m
      [0, 144, 451, 656, size],     // Row 2: one full 2200mm plank + two cut lengths (1320mm + 880mm)
      [0, 416, 928, size],          // Row 3: two full 2200mm planks staggered by 1.79m
      [0, 192, 704, size],          // Row 4: two full 2200mm planks staggered by 0.825m
      [0, 464, 976, size],          // Row 5: two full 2200mm planks staggered by 1.99m
      [0, 240, 470, 752, size],     // Row 6: one full 2200mm plank + two cut lengths (990mm + 1210mm)
      [0, 96, 608, size],           // Row 7: two full 2200mm planks staggered by 0.41m
    ];

    for (let row = 0; row < numRows; row++) {
      const y0 = row * rowH;
      const joints = rowJointLayouts[row] ?? [0, 512, size];

      for (let seg = 0; seg < joints.length - 1; seg++) {
        const xStart = joints[seg] ?? 0;
        const xEnd = joints[seg + 1] ?? size;
        const segW = xEnd - xStart;
        if (segW <= 1) continue;

        // Ensure left-edge and right-edge wrapped segments of the same plank share identical identity
        const wrapsSeam = joints[1] !== 512;
        const plankId = wrapsSeam && seg === joints.length - 2 ? 0 : seg;
        const seed = row * 37 + plankId * 23 + 13;
        const [baseR, baseG, baseB] =
          oakPlankPalette[Math.abs(seed) % oakPlankPalette.length] ?? [168, 129, 90];

        // 1. Base plank fill + handcrafted undulated surface shading across plank width & length
        cCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
        cCtx.fillRect(xStart, y0, segW, rowH);

        const bumpBase = 198 + (((seed * 13) % 10) - 5);
        bCtx.fillStyle = `rgb(${bumpBase}, ${bumpBase}, ${bumpBase})`;
        bCtx.fillRect(xStart, y0, segW, rowH);

        // Soft cross-plank crown & sapwood/heartwood tonal gradient
        const plankGrad = cCtx.createLinearGradient(0, y0, 0, y0 + rowH);
        const edgeShift = (seed & 1) === 0 ? 5 : -5;
        const centerShift = -Math.round(edgeShift * 0.55);
        plankGrad.addColorStop(
          0,
          `rgba(${clampByte(baseR + edgeShift)}, ${clampByte(baseG + edgeShift)}, ${clampByte(baseB + Math.round(edgeShift * 0.85))}, 0.32)`
        );
        plankGrad.addColorStop(
          0.5,
          `rgba(${clampByte(baseR + centerShift)}, ${clampByte(baseG + centerShift)}, ${clampByte(baseB + Math.round(centerShift * 0.85))}, 0.24)`
        );
        plankGrad.addColorStop(
          1,
          `rgba(${clampByte(baseR - edgeShift)}, ${clampByte(baseG - edgeShift)}, ${clampByte(baseB - Math.round(edgeShift * 0.85))}, 0.32)`
        );
        cCtx.fillStyle = plankGrad;
        cCtx.fillRect(xStart, y0, segW, rowH);

        // 2. Sparse, natural knots: only ~4 subtle knots across the entire 18-plank (7.74 m²) tile!
        interface KnotSpec {
          readonly kx: number;
          readonly ky: number;
          readonly rx: number;
          readonly ry: number;
          readonly angle: number;
        }
        const knots: KnotSpec[] = [];
        const hasSingleKnot =
          segW >= 260 &&
          ((row === 1 && seg === 1) ||
            (row === 3 && seg === 1) ||
            (row === 5 && seg === 1) ||
            (row === 7 && seg === 1));
        if (hasSingleKnot) {
          const kHash = seed * 31 + 17;
          const marginX = 72;
          const usableW = Math.max(32, segW - marginX * 2);
          const kx = xStart + marginX + Math.floor((((kHash * 73) & 0x7fffffff) % usableW));
          const ky = y0 + 28 + Math.floor((((kHash * 41) & 0x7fffffff) % (rowH - 56)));
          const rx = 6.5 + ((kHash * 19) % 4); // Subtle 6.5..9.5px knot
          const ry = 3.2 + ((kHash * 11) % 2.2); // 3.2..5.0px
          const angle = (((kHash % 7) - 3) * 0.035);
          knots.push({ kx, ky, rx, ry, angle });
        }

        // 3. Heavily Brushed longitudinal woodgrain fibers & cathedral heartwood arches
        const cathedralCenterY = y0 + rowH * (0.32 + ((seed % 5) * 0.09));
        const numFibers = 76;
        const stepX = 16;

        for (let f = 0; f < numFibers; f++) {
          const t = (f + 0.5) / numFibers;
          const baseY = y0 + 2 + t * (rowH - 4);
          const distFromCathedral = (baseY - cathedralCenterY) / (rowH * 0.5);

          // Alternate between deep brushed earlywood pore grooves and raised oiled latewood ridges
          const fiberWave =
            Math.sin(f * 0.85 + seed * 0.4) * 6.0 +
            Math.cos(f * 1.9 + seed * 1.1) * 4.2 +
            Math.sin(distFromCathedral * Math.PI * 2.0) * 6.5;
          const isDarkPore = fiberWave < -2.5;
          const isLightRidge = fiberWave > 4.5;

          const dR = Math.round(fiberWave * 1.15 - (isDarkPore ? 6 : 0) + (isLightRidge ? 4 : 0));
          const dG = Math.round(fiberWave * 1.2 - (isDarkPore ? 7 : 0) + (isLightRidge ? 4 : 0));
          const dB = Math.round(fiberWave * 1.05 - (isDarkPore ? 6 : 0) + (isLightRidge ? 3 : 0));

          cCtx.strokeStyle = `rgba(${clampByte(baseR + dR)}, ${clampByte(baseG + dG)}, ${clampByte(baseB + dB)}, ${isDarkPore ? 0.58 : isLightRidge ? 0.44 : 0.32})`;
          cCtx.lineWidth = isDarkPore ? 1.45 : 1.15;

          const bVal = clampByte(
            bumpBase + (isDarkPore ? -36 : isLightRidge ? 22 : Math.round(fiberWave * 2.0))
          );
          bCtx.strokeStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
          bCtx.lineWidth = isDarkPore ? 1.45 : 1.1;

          cCtx.beginPath();
          bCtx.beginPath();
          for (let px = xStart; px <= xEnd; px += stepX) {
            const worldX = wrapsSeam && seg === joints.length - 2 ? px - size : px;
            // Undulated cathedral arch wave along the 2200mm plank length
            let gy =
              baseY +
              Math.sin(worldX * 0.0085 + seed * 0.7) * distFromCathedral * 6.0 +
              Math.cos(worldX * 0.021 + f * 0.18 + seed) * 1.5;

            // Deflect fiber smoothly around any knot in this plank
            for (const knot of knots) {
              const dx = px - knot.kx;
              const dy = baseY - knot.ky;
              const sigmaX = knot.rx * 3.0;
              const sigmaY = knot.ry * 3.4;
              const gauss = Math.exp(-(dx * dx) / (2 * sigmaX * sigmaX) - (dy * dy) / (2 * sigmaY * sigmaY));
              if (gauss > 0.01) {
                const dir = dy >= 0 ? 1 : -1;
                gy += dir * gauss * (knot.ry * 1.25);
              }
            }

            gy = Math.max(y0 + 1.5, Math.min(y0 + rowH - 1.5, gy));
            if (px === xStart) {
              cCtx.moveTo(px, gy);
              bCtx.moveTo(px, gy);
            } else {
              cCtx.lineTo(px, gy);
              bCtx.lineTo(px, gy);
            }
          }
          cCtx.stroke();
          bCtx.stroke();
        }

        // 4. Render subtle Heritage knot (when present on this plank)
        for (const knot of knots) {
          cCtx.save();
          cCtx.translate(knot.kx, knot.ky);
          cCtx.rotate(knot.angle);

          // Soft warm amber-brown grain halo
          const haloGrad = cCtx.createRadialGradient(
            0,
            0,
            knot.ry * 0.25,
            0,
            0,
            knot.rx * 1.45
          );
          haloGrad.addColorStop(0, 'rgba(68, 45, 25, 0.72)');
          haloGrad.addColorStop(0.45, 'rgba(102, 70, 42, 0.45)');
          haloGrad.addColorStop(0.8, `rgba(${clampByte(baseR - 20)}, ${clampByte(baseG - 22)}, ${clampByte(baseB - 18)}, 0.22)`);
          haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cCtx.fillStyle = haloGrad;
          cCtx.beginPath();
          cCtx.ellipse(0, 0, knot.rx * 1.45, knot.ry * 1.5, 0, 0, Math.PI * 2);
          cCtx.fill();

          // Dark filled knot core
          cCtx.fillStyle = '#422b19';
          cCtx.beginPath();
          cCtx.ellipse(0, 0, knot.rx * 0.62, knot.ry * 0.65, 0, 0, Math.PI * 2);
          cCtx.fill();

          cCtx.fillStyle = '#2d1c0f';
          cCtx.beginPath();
          cCtx.ellipse(0, 0, knot.rx * 0.34, knot.ry * 0.36, 0, 0, Math.PI * 2);
          cCtx.fill();
          cCtx.restore();

          // Subtle knot bump relief
          bCtx.save();
          bCtx.translate(knot.kx, knot.ky);
          bCtx.rotate(knot.angle);
          bCtx.fillStyle = '#686868';
          bCtx.beginPath();
          bCtx.ellipse(0, 0, knot.rx * 0.6, knot.ry * 0.62, 0, 0, Math.PI * 2);
          bCtx.fill();
          bCtx.restore();
        }

        // 5. Balanced bevelled header end-joint V-groove at xStart (if > 0)
        if (xStart > 0) {
          cCtx.fillStyle = 'rgba(92, 62, 36, 0.36)';
          cCtx.fillRect(xStart - 1.1, y0, 2.2, rowH);
          cCtx.fillStyle = 'rgba(66, 43, 24, 0.82)';
          cCtx.fillRect(xStart - 0.7, y0, 1.4, rowH);
          cCtx.fillStyle = 'rgba(222, 188, 148, 0.28)';
          cCtx.fillRect(xStart + 0.8, y0, 1.1, rowH);

          bCtx.fillStyle = '#484848';
          bCtx.fillRect(xStart - 0.8, y0, 1.6, rowH);
        }
      }

      // 6. Balanced bevelled long-edge V-groove between wide 220mm planks
      cCtx.fillStyle = 'rgba(92, 62, 36, 0.4)';
      cCtx.fillRect(0, y0, size, 2.6);
      cCtx.fillStyle = 'rgba(64, 42, 23, 0.86)';
      cCtx.fillRect(0, y0, size, 1.75);
      cCtx.fillStyle = 'rgba(224, 190, 150, 0.3)';
      cCtx.fillRect(0, y0 + 2.0, size, 1.3);

      bCtx.fillStyle = '#404040';
      bCtx.fillRect(0, y0, size, 1.9);
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

  cachedEngineeredOakTextures = { colorMap, bumpMap };
  return cachedEngineeredOakTextures;
}

let cachedWovenWoolCarpetTextures: {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} | null = null;

/**
 * Generates a seamless 256x256 woven herringbone wool carpet texture pair
 * (`colorMap` + `bumpMap`) matching the main staircase runner weave in a lighter
 * warm creamy-oatmeal wool palette (`#e2dacb` base trough with `#d6ccb8` and `#efe8dc`
 * alternating woven wool loops).
 */
export function createWovenWoolCarpetTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  if (cachedWovenWoolCarpetTextures) {
    return cachedWovenWoolCarpetTextures;
  }

  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && bCtx) {
    cCtx.fillStyle = '#e2dacb';
    cCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#787878';
    bCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 8) {
        const zig = ((x / 8 + Math.floor(y / 16)) & 1) === 0;
        cCtx.fillStyle = zig ? '#d6ccb8' : '#efe8dc';
        cCtx.fillRect(x, y, 6, 3);

        bCtx.fillStyle = zig ? '#c8c8c8' : '#ececec';
        bCtx.fillRect(x, y, 6, 3);
      }
    }
  }

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(16, 32);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(16, 32);

  cachedWovenWoolCarpetTextures = { colorMap, bumpMap };
  return cachedWovenWoolCarpetTextures;
}


