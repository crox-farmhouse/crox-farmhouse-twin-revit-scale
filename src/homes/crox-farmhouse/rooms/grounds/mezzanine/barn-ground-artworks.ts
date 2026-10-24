import * as THREE from 'three';
import { createTeakWoodTexture } from './mezzanine-shared-textures.ts';

/**
 * Generates a high-resolution (`768x512`) painting/photograph of the Old Course at St Andrews
 * featuring the iconic stone Swilcan Bridge in the foreground, the 18th fairway links turf,
 * the Royal and Ancient Golf Club Clubhouse, and red-brick Hamilton Grand on the horizon (`Issue #5`).
 */
let cachedStAndrewsOldCourseTexture: THREE.CanvasTexture | null = null;
let cachedHorseShowCertificatesTexture: THREE.CanvasTexture | null = null;
let cachedSamsungFrame55ScreenTexture: THREE.CanvasTexture | null = null;

function createStAndrewsOldCourseTexture(): THREE.CanvasTexture {
  if (cachedStAndrewsOldCourseTexture) {
    return cachedStAndrewsOldCourseTexture;
  }
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
  cachedStAndrewsOldCourseTexture = tex;
  return tex;
}

/**
 * Issue #5 ("Make this less messy and on a white mount" at `[-5.257, 1.222, 19.93]`, `outbuildings.barn.horseShowCertificates.canvas`) &
 * Issue #6 ("Put the certificates above the door" at `[-5.493, 1.885, 14.822]`):
 * Generates a high-resolution (`1024x680`) architectural, museum-curated Equestrian Championship Frame
 * on a Crisp Conservation White Mountboard Passepartout (`#f8f6f0`) with 4 symmetrical 45°-bevelled
 * rectangular window apertures and a recessed lower ribbon & title plaque channel.
 */
function createHorseShowCertificatesTexture(): THREE.CanvasTexture {
  if (cachedHorseShowCertificatesTexture) {
    return cachedHorseShowCertificatesTexture;
  }
  const w = 1024;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Crisp Warm Conservation White / Ivory Museum Mountboard Passepartout (`#f8f6f0`) with fine cotton-rag grain
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3600; i++) {
      const fx = (i * 97) % w;
      const fy = (i * 151) % h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(185,176,158,0.12)';
      ctx.fillRect(fx, fy, 2, 2);
    }

    // Subtle outer gold-ruled conservation framing line on the white mountboard
    ctx.strokeStyle = '#c5a869';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.strokeStyle = 'rgba(197, 168, 105, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(27, 27, w - 54, h - 54);

    // Helper to draw a 45°-bevelled museum window aperture in the white mountboard
    const drawBevelAperture = (ax: number, ay: number, aw: number, ah: number, bgTop: string, bgBot: string): void => {
      // Gold-leaf outer sight line around aperture
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ax - 7, ay - 7, aw + 14, ah + 14);

      // 45° bevel shadow (top & left bevels in soft shadow `#dcd6c8`, bottom & right bevels catching light `#ffffff`)
      ctx.fillStyle = '#dcd6c8';
      ctx.beginPath();
      ctx.moveTo(ax - 4, ay - 4);
      ctx.lineTo(ax + aw + 4, ay - 4);
      ctx.lineTo(ax + aw, ay);
      ctx.lineTo(ax, ay);
      ctx.lineTo(ax, ay + ah);
      ctx.lineTo(ax - 4, ay + ah + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(ax + aw + 4, ay - 4);
      ctx.lineTo(ax + aw + 4, ay + ah + 4);
      ctx.lineTo(ax - 4, ay + ah + 4);
      ctx.lineTo(ax, ay + ah);
      ctx.lineTo(ax + aw, ay + ah);
      ctx.lineTo(ax + aw, ay);
      ctx.closePath();
      ctx.fill();

      // Recessed certificate vellum fill inside aperture
      const pGrad = ctx.createLinearGradient(ax, ay, ax, ay + ah);
      pGrad.addColorStop(0, bgTop);
      pGrad.addColorStop(1, bgBot);
      ctx.fillStyle = pGrad;
      ctx.fillRect(ax, ay, aw, ah);

      // Subtle inner aperture edge line
      ctx.strokeStyle = '#c8c0b0';
      ctx.lineWidth = 1;
      ctx.strokeRect(ax, ay, aw, ah);
    };

    // 2. 4 Symmetrical, Perfectly Aligned 45°-Bevelled Rectangular Certificate Window Apertures
    interface MountedCertSpec {
      readonly ax: number;
      readonly ay: number;
      readonly aw: number;
      readonly ah: number;
      readonly paperTop: string;
      readonly paperBot: string;
      readonly borderCol: string;
      readonly showTitle: string;
      readonly showSub: string;
      readonly awardTitle: string;
      readonly recipientLine: string;
      readonly horseLine: string;
      readonly yearStr: string;
      readonly sealCol: string;
    }

    const apertures: ReadonlyArray<MountedCertSpec> = [
      {
        ax: 44, ay: 52, aw: 206, ah: 370,
        paperTop: '#fdfbf5', paperBot: '#f5efe2',
        borderCol: '#8b1e24',
        showTitle: 'ROYAL WINDSOR',
        showSub: 'HORSE SHOW',
        awardTitle: 'FIRST PRIZE',
        recipientLine: 'Presented to Crox Farmhouse Stables',
        horseLine: 'Open Working Hunter',
        yearStr: 'MCMXCIV',
        sealCol: '#a61c22',
      },
      {
        ax: 280, ay: 52, aw: 206, ah: 370,
        paperTop: '#fcfaf2', paperBot: '#f3ecdc',
        borderCol: '#1b3b6b',
        showTitle: 'BURGHLEY',
        showSub: 'HORSE TRIALS',
        awardTitle: 'SUPREME CHAMPION',
        recipientLine: 'Presented to Crox Farmhouse Stables',
        horseLine: 'Four-Star Eventing',
        yearStr: 'MCMXCVIII',
        sealCol: '#1b3b6b',
      },
      {
        ax: 538, ay: 52, aw: 206, ah: 370,
        paperTop: '#fdfbf5', paperBot: '#f4eee0',
        borderCol: '#1f4e34',
        showTitle: 'HICKSTEAD',
        showSub: 'DERBY MEETING',
        awardTitle: 'CLEAR ROUND TROPHY',
        recipientLine: 'Presented to Crox Farmhouse Stables',
        horseLine: 'International Arena',
        yearStr: 'MMVI',
        sealCol: '#1f4e34',
      },
      {
        ax: 774, ay: 52, aw: 206, ah: 370,
        paperTop: '#fcfaf2', paperBot: '#f3ebdb',
        borderCol: '#6e1d2c',
        showTitle: 'BRITISH SHOWJUMPING',
        showSub: 'NATIONAL FINALS',
        awardTitle: 'COUNTY CHALLENGE CUP',
        recipientLine: 'Presented to Crox Farmhouse Stables',
        horseLine: 'Grade A Championship',
        yearStr: 'MMXIV',
        sealCol: '#7c1c2b',
      },
    ];

    for (let idx = 0; idx < apertures.length; idx++) {
      const c = apertures[idx]!;
      drawBevelAperture(c.ax, c.ay, c.aw, c.ah, c.paperTop, c.paperBot);

      const cx = c.ax + c.aw * 0.5;

      // Double formal border inside the certificate vellum
      ctx.strokeStyle = c.borderCol;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(c.ax + 12, c.ay + 12, c.aw - 24, c.ah - 24);
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 1.1;
      ctx.strokeRect(c.ax + 17, c.ay + 17, c.aw - 34, c.ah - 34);

      // Corner foliate/gold ticks
      for (const [dx, dy] of [
        [c.ax + 17, c.ay + 17],
        [c.ax + c.aw - 17, c.ay + 17],
        [c.ax + 17, c.ay + c.ah - 17],
        [c.ax + c.aw - 17, c.ay + c.ah - 17],
      ] as const) {
        ctx.fillStyle = '#c5a869';
        ctx.beginPath();
        ctx.arc(dx, dy, 3.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Heraldic equestrian crest medallion at top center
      ctx.fillStyle = c.borderCol;
      ctx.beginPath();
      ctx.arc(cx, c.ay + 48, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, c.ay + 48, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fdfbf5';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♛', cx, c.ay + 48);

      // Formal Copperplate Typography
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#1c1e22';
      ctx.font = 'bold 12.5px Georgia, serif';
      ctx.fillText(c.showTitle, cx, c.ay + 92);
      ctx.font = 'bold 10.5px Georgia, serif';
      ctx.fillText(c.showSub, cx, c.ay + 108);

      // Fine gold divider rule
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c.ax + 34, c.ay + 120);
      ctx.lineTo(c.ax + c.aw - 34, c.ay + 120);
      ctx.stroke();

      // Award Banner
      ctx.fillStyle = c.borderCol;
      ctx.font = 'bold 11.5px Georgia, serif';
      ctx.fillText(c.awardTitle, cx, c.ay + 144);

      ctx.fillStyle = '#18181a';
      ctx.font = 'bold italic 9.5px Georgia, serif';
      ctx.fillText(c.recipientLine, cx, c.ay + 174);

      ctx.fillStyle = '#3c3830';
      ctx.font = '10px Georgia, serif';
      ctx.fillText(c.horseLine, cx, c.ay + 198);

      // Neat calligraphic citation lines
      ctx.strokeStyle = 'rgba(55, 48, 38, 0.38)';
      ctx.lineWidth = 1.0;
      for (let ln = 0; ln < 4; ln++) {
        const ly = c.ay + 228 + ln * 16;
        const pad = 28 + (ln === 3 ? 22 : 0);
        ctx.beginPath();
        ctx.moveTo(c.ax + pad, ly);
        ctx.lineTo(c.ax + c.aw - pad, ly);
        ctx.stroke();
      }

      // Formal Secretary Signature & Date on Left, Embossed Wax Seal & Gold Ribbon on Right
      ctx.fillStyle = '#5a5348';
      ctx.font = 'italic 9px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText('Hon. Secretary', c.ax + 26, c.ay + c.ah - 46);
      ctx.font = 'bold 8.5px Georgia, serif';
      ctx.fillText(c.yearStr, c.ax + 26, c.ay + c.ah - 30);

      const sx = c.ax + c.aw - 42;
      const sy = c.ay + c.ah - 42;
      ctx.fillStyle = '#c5a869';
      ctx.fillRect(sx - 5, sy + 6, 4, 18);
      ctx.fillRect(sx + 1, sy + 6, 4, 18);
      ctx.fillStyle = c.sealCol;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Lower Horizontal Recessed White-Mounted Ribbon Display Channel (`[44, 468, 936, 160]`)
    drawBevelAperture(44, 468, 936, 160, '#f4f1e8', '#ece7da');

    // Fine inner gold frame line inside the lower ribbon display channel
    ctx.strokeStyle = '#c5a869';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(54, 478, 916, 140);

    // Central Gold-Ruled Museum Title Plaque (`"CROX FARMHOUSE EQUESTRIAN HONOURS · 1988 – 2024"`)
    const plaqueW = 360;
    const plaqueH = 44;
    const plaqueX = (w - plaqueW) * 0.5;
    const plaqueY = 468 + (160 - plaqueH) * 0.5;
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
    ctx.strokeStyle = '#c5a869';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(plaqueX, plaqueY, plaqueW, plaqueH);
    ctx.lineWidth = 0.8;
    ctx.strokeRect(plaqueX + 4, plaqueY + 4, plaqueW - 8, plaqueH - 8);

    ctx.fillStyle = '#22201c';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CROX FARMHOUSE EQUESTRIAN HONOURS · 1988 – 2024', w * 0.5, plaqueY + 16);
    ctx.fillStyle = '#78663e';
    ctx.font = 'bold 8.5px Georgia, serif';
    ctx.fillText('CHAMPIONSHIP ROSETTES & CITATIONS', w * 0.5, plaqueY + 31);

    // Symmetrical mounting pin-boss markers & subtle class labels under the 4 rosette positions
    const rosetteMountCols: ReadonlyArray<readonly [number, string]> = [
      [158, 'WINDSOR · 1ST'],
      [332, 'BURGHLEY · CHAMP.'],
      [692, 'HICKSTEAD · 1ST'],
      [866, 'COUNTY CUP · 1ST'],
    ];
    for (const [rx, rLabel] of rosetteMountCols) {
      ctx.fillStyle = '#6e6556';
      ctx.font = 'bold 8.5px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(rLabel, rx, 608);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedHorseShowCertificatesTexture = tex;
  return tex;
}

/**
 * Issue #1 ("Samsung frame 55 inch on this wall, more task and ambient lighting in here"
 * at `[-1.221, 0.434, 19.624]` -> Outbuilding `(u = 20.861m, y = 0.434m, v = 5.43m)`):
 * Generates a high-resolution (`1024x576`, 16:9) Matte Anti-Glare Art-Mode / Championship Golf
 * display canvas for the 55-inch Samsung "The Frame" QLED TV on the Barn South Wall, with a
 * warm cream conservation passepartout mat border and an atmospheric golden-hour links golf /
 * Highlands landscape artwork.
 */
function createSamsungFrame55ScreenTexture(): THREE.CanvasTexture {
  if (cachedSamsungFrame55ScreenTexture) {
    return cachedSamsungFrame55ScreenTexture;
  }
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
  cachedSamsungFrame55ScreenTexture = tex;
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
  //    Reduced `outbuildings.barn.stAndrewsPicture` from `1.32m x 0.88m` down to a tasteful `0.76m x 0.52m`,
  //    centred on the wall pier East of the Barn Courtyard Door (`u = 17.75m, y = 1.12m, v = 0.295m`)!
  // ---------------------------------------------------------------------------
  const stAndrewsGroup = new THREE.Group();
  stAndrewsGroup.name = 'outbuildings.barn.stAndrewsPicture';
  stAndrewsGroup.userData.zone = 'courtyard';
  stAndrewsGroup.position.set(18.12, 1.12, 0.295);
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
  stGiltSlip.name = 'outbuildings.barn.stAndrewsPicture.giltSlip';
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
  // 2. Issue #5 ("Make this less messy and on a white mount" at `[-5.257, 1.222, 19.93]`, `outbuildings.barn.horseShowCertificates.canvas`) &
  //    Issue #6 ("Put the certificates above the door" at `[-5.493, 1.885, 14.822]`):
  //    Clean, architectural, museum-curated Equestrian Championship Frame on a Crisp Conservation White Mountboard Passepartout
  //    mounted directly above the Barn North Courtyard Door (`u = 16.35m, y = 2.24m, v = 0.295m`, `rotY = 0` facing South `+z`)!
  // ---------------------------------------------------------------------------
  // Issue #7 ("Center this on the wall horizontalls" at `[-5.905, 2.222, 14.895]`, `outbuildings.barn.horseShowCertificates.canvas`):
  // Centered horizontally across the West Barn North Wall (`u = 15.20..18.56m` -> midpoint `u = 16.88m`)
  // Issue #2 ("put the certificates up here" at `[-5.182, 1.676, 19.965]` on `outbuildings.groundShell.brickWall.46`):
  // Mounted on the North-facing interior face of the Barn South Wall (`u = 16.88m, y = 1.68m, v = 5.415m, rotation.y = Math.PI`)!
  const certGroup = new THREE.Group();
  certGroup.name = 'outbuildings.barn.horseShowCertificates';
  certGroup.userData.zone = 'courtyard';
  certGroup.position.set(16.88, 1.68, 5.415);
  certGroup.rotation.y = Math.PI;
  groundGroup.add(certGroup);

  const frameW = 1.18;
  const frameH = 0.72;
  const frameD = 0.038;

  const certFrameBox = new THREE.Mesh(
    new THREE.BoxGeometry(frameW + 0.068, frameH + 0.068, frameD),
    walnutFrameMat
  );
  certFrameBox.name = 'outbuildings.barn.horseShowCertificates.frame';
  certFrameBox.castShadow = true;
  certGroup.add(certFrameBox);

  const certGiltSlip = new THREE.Mesh(
    new THREE.BoxGeometry(frameW + 0.018, frameH + 0.018, frameD + 0.004),
    giltSlipMat
  );
  certGiltSlip.name = 'outbuildings.barn.horseShowCertificates.giltSlip';
  certGroup.add(certGiltSlip);

  const certBoardPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(frameW, frameH),
    new THREE.MeshStandardMaterial({
      map: createHorseShowCertificatesTexture(),
      roughness: 0.26,
      metalness: 0.02,
    })
  );
  certBoardPlane.name = 'outbuildings.barn.horseShowCertificates.canvas';
  certBoardPlane.position.set(0, 0, frameD * 0.5 + 0.003);
  certGroup.add(certBoardPlane);

  // 4 Neat, Symmetrical 3D Pleated Silk Equestrian Championship Rosettes in a straight horizontal row along the lower display band
  const rosetteSpecs: ReadonlyArray<readonly [number, number, number, number, number]> = [
    // [rx, ry, radius, outerHex, innerHex]
    [-0.39, -0.20, 0.044, 0xa61c22, 0xd4af37], // 1. Royal Windsor Crimson & Gold 1st Prize
    [-0.19, -0.20, 0.044, 0x1b3b6b, 0xf5f2eb], // 2. Burghley Royal Blue & Ivory Supreme Champion
    [0.19, -0.20, 0.044, 0x1f4e34, 0xd4af37],  // 3. Hickstead Forest Green & Gold Trophy
    [0.39, -0.20, 0.044, 0x6e1d2c, 0xd4af37],  // 4. British Showjumping Burgundy & Gold Cup
  ];

  for (let idx = 0; idx < rosetteSpecs.length; idx++) {
    const [rx, ry, rad, outerHex, innerHex] = rosetteSpecs[idx]!;
    const rItem = new THREE.Group();
    rItem.name = `outbuildings.barn.horseShowCertificates.rosette.${idx + 1}`;
    rItem.position.set(rx, ry, frameD * 0.5 + 0.008);
    rItem.rotation.z = 0;
    certGroup.add(rItem);

    const outerMat = new THREE.MeshStandardMaterial({
      color: outerHex,
      roughness: 0.40,
      metalness: 0.08,
    });
    const innerMat = new THREE.MeshStandardMaterial({
      color: innerHex,
      roughness: 0.36,
      metalness: 0.14,
    });

    const pleatRing = new THREE.Mesh(
      new THREE.CylinderGeometry(rad, rad, 0.009, 24),
      outerMat
    );
    pleatRing.rotation.x = Math.PI / 2;
    pleatRing.name = `outbuildings.barn.horseShowCertificates.rosette.${idx + 1}.pleatRing`;
    pleatRing.userData = { lodTier: 'high', lodMaxDistance: 12 };
    rItem.add(pleatRing);

    const innerRing = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.68, rad * 0.68, 0.011, 20),
      innerMat
    );
    innerRing.rotation.x = Math.PI / 2;
    innerRing.name = `outbuildings.barn.horseShowCertificates.rosette.${idx + 1}.innerRing`;
    innerRing.userData = { lodTier: 'high', lodMaxDistance: 12 };
    innerRing.position.set(0, 0, 0.0015);
    rItem.add(innerRing);

    const goldCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.42, rad * 0.42, 0.013, 18),
      giltSlipMat
    );
    goldCenter.rotation.x = Math.PI / 2;
    goldCenter.name = `outbuildings.barn.horseShowCertificates.rosette.${idx + 1}.medallion`;
    goldCenter.userData = { lodTier: 'high', lodMaxDistance: 12 };
    goldCenter.position.set(0, 0, 0.003);
    rItem.add(goldCenter);

    for (const [tailSide, tailColorMat] of [
      [-1, outerMat],
      [0, innerMat],
      [1, outerMat],
    ] as const) {
      const tailLen = rad * (tailSide === 0 ? 1.65 : 1.48);
      const tailRibbon = new THREE.Mesh(
        new THREE.BoxGeometry(rad * 0.32, tailLen, 0.004),
        tailColorMat
      );
      tailRibbon.name = `outbuildings.barn.horseShowCertificates.rosette.${idx + 1}.tailRibbon`;
      tailRibbon.userData = { lodTier: 'high', lodMaxDistance: 12 };
      tailRibbon.position.set(tailSide * rad * 0.26, -rad * 0.72 - tailLen * 0.32, -0.0015);
      tailRibbon.rotation.z = tailSide * 0.14;
      rItem.add(tailRibbon);
    }
  }

  // Museum Conservation Glass Pane (`0.004m` clear glass pane) over the white mount
  const certGlassPane = new THREE.Mesh(
    new THREE.BoxGeometry(frameW, frameH, 0.004),
    new THREE.MeshStandardMaterial({
      color: 0xf4f9fc,
      transparent: true,
      opacity: 0.14,
      roughness: 0.08,
      metalness: 0.12,
    })
  );
  certGlassPane.name = 'outbuildings.barn.horseShowCertificates.glass';
  certGlassPane.position.set(0, 0, frameD * 0.5 + 0.016);
  certGroup.add(certGlassPane);

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
  innerLip.name = 'outbuildings.barn.samsungFrame55.innerLip';
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
  sensorPod.name = 'outbuildings.barn.samsungFrame55.sensorPod';
  sensorPod.position.set(tvW * 0.34, -tvH * 0.5 - 0.0045, tvD * 0.5);
  frameTvGroup.add(sensorPod);

  // Translucent "One Invisible Connection" fiber-optic cable descending cleanly into a low wall grommet
  const oneConnectCable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0022, 0.0022, 0.62, 8),
    cableSilverMat
  );
  oneConnectCable.name = 'outbuildings.barn.samsungFrame55.oneConnectCable';
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

  // Issue #4 ("Overhead lights should be visible but low opacity (same everywhere)"):
  // Keep `barnCeilingLightingGroup` attached to `barnLightingGroup` (`groundGroup`) so overhead lights remain visible
  // in cutaway mode, and use low-opacity (`0.34..0.38`) materials on the overhead ceiling fixtures.
  void groundCeilingGroup;
  const barnCeilingLightingGroup = new THREE.Group();
  barnCeilingLightingGroup.name = 'outbuildings.barn.groundCeilingLighting';
  barnCeilingLightingGroup.userData.zone = 'courtyard';
  barnLightingGroup.add(barnCeilingLightingGroup);

  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });
  const overheadBrassLowOpacityMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const hunterGreenShadeMat = new THREE.MeshStandardMaterial({
    color: 0x164a2c,
    roughness: 0.32,
    metalness: 0.24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const warmAlabasterMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: new THREE.Color(0xffc46b),
    emissiveIntensity: 1.95,
    roughness: 0.22,
    metalness: 0.04,
  });
  const overheadAlabasterLowOpacityMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: new THREE.Color(0xffc46b),
    emissiveIntensity: 1.95,
    roughness: 0.22,
    metalness: 0.04,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const taskLedMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf0,
    emissive: new THREE.Color(0xffe6b8),
    emissiveIntensity: 2.3,
    roughness: 0.16,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const darkBronzeChannelMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.38,
    metalness: 0.72,
  });
  const overheadBronzeLowOpacityMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.38,
    metalness: 0.72,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });

  // 4A. 3-Shade Brushed-Brass & Hunter-Green Billiard Table Task Chandelier (`u = 20.38m, v = 2.08m`)
  const billiardLightGroup = new THREE.Group();
  billiardLightGroup.name = 'outbuildings.barn.poolTableLight';
  billiardLightGroup.position.set(20.38, 1.395, 2.08);
  barnCeilingLightingGroup.add(billiardLightGroup);

  // Ceiling canopy plate + twin vertical drop rods (`y = 0..-0.42m`, putting shades at `y = 0.90m` world = `1.575m` above carpet!)
  const canopyPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.022, 0.11),
    overheadBrassLowOpacityMat
  );
  canopyPlate.name = 'outbuildings.barn.poolTableLight.canopy';
  canopyPlate.position.set(0, -0.011, 0);
  billiardLightGroup.add(canopyPlate);

  for (const rx of [-0.36, 0.36] as const) {
    const dropRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.38, 12),
      overheadBrassLowOpacityMat
    );
    dropRod.name = 'outbuildings.barn.poolTableLight.dropRod';
    dropRod.position.set(rx, -0.20, 0);
    billiardLightGroup.add(dropRod);
  }

  const billiardCrossBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 1.24, 16),
    overheadBrassLowOpacityMat
  );
  billiardCrossBar.rotation.z = Math.PI / 2;
  billiardCrossBar.name = 'outbuildings.barn.poolTableLight.crossBar';
  billiardCrossBar.position.set(0, -0.39, 0);
  billiardLightGroup.add(billiardCrossBar);

  for (const sx of [-0.52, 0, 0.52] as const) {
    const shadeCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.032, 0.045, 16),
      overheadBrassLowOpacityMat
    );
    shadeCollar.name = 'outbuildings.barn.poolTableLight.shadeCollar';
    shadeCollar.position.set(sx, -0.42, 0);
    billiardLightGroup.add(shadeCollar);

    const billiardShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.165, 0.14, 24, 1, true),
      hunterGreenShadeMat
    );
    billiardShade.name = 'outbuildings.barn.poolTableLight.shade';
    billiardShade.position.set(sx, -0.50, 0);
    billiardShade.castShadow = false;
    billiardLightGroup.add(billiardShade);

    const brassRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.165, 0.006, 10, 24),
      overheadBrassLowOpacityMat
    );
    brassRim.rotation.x = Math.PI / 2;
    brassRim.name = 'outbuildings.barn.poolTableLight.brassRim';
    brassRim.position.set(sx, -0.57, 0);
    billiardLightGroup.add(brassRim);

    const shadeBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 14, 12),
      taskLedMat
    );
    shadeBulb.name = 'outbuildings.barn.poolTableLight.bulb';
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
      boltHead.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.bolt`;
      boltHead.userData = { lodTier: 'high', lodMaxDistance: 12 };
      boltHead.position.set(0.244, by, bz);
      bracketGroup.add(boltHead);
    }

    // Turned brass wall/beam boss collar (`localX = +0.240m, localY = -0.006m`)
    const beamCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.018, 16),
      brushedBrassMat
    );
    beamCollar.rotation.z = Math.PI / 2;
    beamCollar.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.collar`;
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
    strutKnuckle.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.strutKnuckle`;
    strutKnuckle.position.set(0.058, -0.006, 0);
    bracketGroup.add(strutKnuckle);

    // 4. Turned Brushed-Brass Cord Knuckle & Top Acorn Finial at the cantilever tip (`localX = 0, localY = -0.006m`) holding the pendant cord
    const tipKnuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.026, 16),
      brushedBrassMat
    );
    tipKnuckle.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.tipKnuckle`;
    tipKnuckle.position.set(0, -0.006, 0);
    bracketGroup.add(tipKnuckle);

    const tipFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 10),
      brushedBrassMat
    );
    tipFinial.name = `outbuildings.barn.golfViewingBarPendant.bracket.${pIdx}.finial`;
    tipFinial.position.set(0, 0.012, 0);
    bracketGroup.add(tipFinial);

    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.34, 10),
      overheadBrassLowOpacityMat
    );
    cord.name = `outbuildings.barn.golfViewingBarPendant.${pIdx}.cord`;
    cord.position.set(0, -0.175, 0);
    barPendant.add(cord);

    const brassCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.042, 0.04, 16),
      overheadBrassLowOpacityMat
    );
    brassCap.name = `outbuildings.barn.golfViewingBarPendant.${pIdx}.brassCap`;
    brassCap.position.set(0, -0.35, 0);
    barPendant.add(brassCap);

    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.15, 20),
      overheadAlabasterLowOpacityMat
    );
    glassCylinder.name = `outbuildings.barn.golfViewingBarPendant.${pIdx}.glassShade`;
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
      overheadBrassLowOpacityMat
    );
    bezelRing.name = `outbuildings.barn.mezzanineDownlight.${d + 1}`;
    bezelRing.position.set(du, 1.392, dv);
    barnCeilingLightingGroup.add(bezelRing);

    const lensDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.01, 16),
      taskLedMat
    );
    lensDisc.name = `outbuildings.barn.mezzanineDownlight.${d + 1}.lens`;
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
      overheadBronzeLowOpacityMat
    );
    channel.name = `outbuildings.barn.ambientCoveLed.${cName}.channel`;
    channel.position.set(cu, cy + 0.006, cv);
    barnCeilingLightingGroup.add(channel);

    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.014, cw - 0.01), 0.01, Math.max(0.014, cd - 0.01)),
      overheadAlabasterLowOpacityMat
    );
    ledStrip.name = `outbuildings.barn.ambientCoveLed.${cName}`;
    ledStrip.position.set(cu, cy, cv);
    barnCeilingLightingGroup.add(ledStrip);
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
    [5, 17.66, 1.32, 0.292, 0],
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
    wallPlate.name = `outbuildings.barn.wallSconce.${sIdx}.backplate`;
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
      brassBand.name = `outbuildings.barn.wallSconce.${sIdx}.brassBand`;
      brassBand.position.set(0, bandY, 0.046);
      sconce.add(brassBand);
    }
  }

  // 4F. 2 Brushed-Brass Gallery Picture Task Lights (`outbuildings.barn.pictureLight.1..2`)
  //     over the St Andrews Picture (`u = 18.12m, y = 1.46m, v = 0.295m`) & Horse Show Certificates (`u = 16.88m, y = 2.13m, v = 5.415m`)
  for (const [pIdx, pu, py, pv, pRotY, barW] of [
    [1, 18.12, 1.46, 0.295, 0, 0.44],
    [2, 16.88, 2.13, 5.415, Math.PI, 0.68],
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
    picBackplate.name = `outbuildings.barn.pictureLight.${pIdx}.backplate`;
    picBackplate.position.set(0, 0, 0.007);
    picLight.add(picBackplate);

    for (const ax of [-barW * 0.28, barW * 0.28] as const) {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.14, 10),
        brushedBrassMat
      );
      arm.rotation.x = Math.PI / 2;
      arm.name = `outbuildings.barn.pictureLight.${pIdx}.arm`;
      arm.position.set(ax, 0.01, 0.07);
      picLight.add(arm);
    }

    const hood = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, barW, 14, 1, false, 0, Math.PI),
      brushedBrassMat
    );
    hood.rotation.z = Math.PI / 2;
    hood.name = `outbuildings.barn.pictureLight.${pIdx}.hood`;
    hood.position.set(0, 0.01, 0.14);
    picLight.add(hood);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(barW - 0.02, 0.008, 0.022),
      taskLedMat
    );
    diffuser.name = `outbuildings.barn.pictureLight.${pIdx}.diffuser`;
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

  for (const grp of [stAndrewsGroup, certGroup, frameTvGroup, barnLightingGroup]) {
    grp.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingSphere();
      }
    });
  }
}
