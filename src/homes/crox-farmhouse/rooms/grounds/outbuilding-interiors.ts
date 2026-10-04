import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';

/**
 * Generates the authentic light pebble-grey (`#d6d8db`) Nike Grind recycled footwear rubber texture
 * matching the uploaded Nike Grind Dumbbell reference photos: a light cool grey/off-white rubber matrix
 * speckled with fine black, dark-charcoal, cobalt-blue, crimson-red, ochre-yellow, and white granules,
 * plus the recessed rectangular black Nike Swoosh badge and bold weight numerals on the hex facets.
 */
function createNikeGrindLightGreyHexTexture(weightLb: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Light cool pebble-grey Nike Grind rubber base (#d5d7da)
  ctx.fillStyle = '#d5d7da';
  ctx.fillRect(0, 0, w, h);

  // Subtle moulded rubber surface grain
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const n = Math.sin(x * 19.13 + y * 47.71) * 43758.5453;
      const f = n - Math.floor(n);
      if (f > 0.65) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(x, y, 2, 2);
      } else if (f < 0.35) {
        ctx.fillStyle = 'rgba(155, 160, 168, 0.14)';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // 2. Authentic multicolour recycled sneaker crumb flecks (predominantly black/charcoal, plus blue, red, yellow, white)
  const fleckPalette = [
    '#141619', // Carbon black crumb (most frequent)
    '#282c32', // Dark charcoal crumb
    '#141619', // Carbon black crumb
    '#5a6068', // Mid slate crumb
    '#1a66cc', // Hyper Cobalt blue fleck
    '#c82820', // Crimson red fleck
    '#e0a010', // Ochre yellow fleck
    '#f4f6f8', // White EVA fleck
    '#141619', // Carbon black crumb
  ];

  for (let i = 0; i < 2400; i++) {
    const h1 = Math.sin(i * 12.9898 + weightLb * 0.7) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233 + weightLb * 1.3) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin(i * 39.425 + 5.1) * 17391.831;
    const f3 = h3 - Math.floor(h3);

    const x = f1 * w;
    const y = f2 * h;
    const r = 0.7 + f3 * 2.2;
    ctx.fillStyle = fleckPalette[i % fleckPalette.length]!;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + f1 * 0.6), f2 * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw recessed rectangular badge + bold black Nike Swoosh on the top-facing hex facet (`u ≈ 0.25`)
  //    and recessed rectangular badge + bold black weight numerals (`10`..`50`) on the opposite facet (`u ≈ 0.75`)
  const drawRecessedBox = (cx: number, cy: number, bw: number, bh: number): void => {
    ctx.fillStyle = 'rgba(185, 188, 194, 0.55)';
    ctx.fillRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
    ctx.strokeStyle = 'rgba(130, 134, 140, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
  };

  // Facet A (`cx = w * 0.25, cy = h * 0.5`): Black Nike Swoosh
  const sx = w * 0.25;
  const sy = h * 0.5;
  drawRecessedBox(sx, sy, 68, 86);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = '#111315';
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.quadraticCurveTo(-28, 12, -12, 18);
  ctx.quadraticCurveTo(4, 22, 26, -12);
  ctx.quadraticCurveTo(-2, 8, -12, 4);
  ctx.quadraticCurveTo(-20, 0, -18, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Facet B (`cx = w * 0.75, cy = h * 0.5`): Bold Black Weight Numeral
  const nx = w * 0.75;
  const ny = h * 0.5;
  drawRecessedBox(nx, ny, 72, 88);
  ctx.save();
  ctx.translate(nx, ny);
  ctx.fillStyle = '#111315';
  ctx.font = '900 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(weightLb), 0, 2);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generates the triangular lower side-gusset plate texture with the laser-cut Nike Swoosh
 * above bold stencilled `NIKE` lettering (`media_1791145079438_8999d4b6.jpg`).
 */
function createNikeSideGussetTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d1f23';
  ctx.fillRect(0, 0, size, size);

  // Subtle laser-cut Swoosh + stencilled NIKE logo in light background contrast
  ctx.fillStyle = '#dcdfe4';
  ctx.beginPath();
  ctx.moveTo(106, 134);
  ctx.quadraticCurveTo(94, 152, 108, 156);
  ctx.quadraticCurveTo(124, 160, 158, 136);
  ctx.quadraticCurveTo(122, 150, 111, 146);
  ctx.quadraticCurveTo(104, 144, 106, 134);
  ctx.closePath();
  ctx.fill();

  ctx.font = '900 38px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NIKE', 128, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a softly bevelled/chamfered 6-sided hexagonal Nike Grind dumbbell head geometry
 * matching the rounded hex profile in `media_1791145088611_e622634c.png`.
 */
function createBevelledHexHeadGeometry(radius: number, length: number): THREE.BufferGeometry {
  // 4-ring bevelled hexagonal prism along Y (`-length/2 .. +length/2`) rotated to Z
  const radialSegs = 6;
  const rings = [
    { y: -length * 0.5, rScale: 0.84 },
    { y: -length * 0.5 + length * 0.14, rScale: 1.0 },
    { y: length * 0.5 - length * 0.14, rScale: 1.0 },
    { y: length * 0.5, rScale: 0.84 },
  ] as const;

  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegs, 3, false);
  const pos = geo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const py = pos.getY(i);
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const rCurr = Math.hypot(px, pz);
      if (rCurr > 1e-4) {
        // Identify closest ring
        let scale = 1.0;
        if (Math.abs(py) > length * 0.42) {
          scale = rings[0].rScale;
        }
        pos.setX(i, px * scale);
        pos.setZ(i, pz * scale);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

/**
 * Generates a seamless poured polyurethane/epoxy workshop resin floor texture (`#84898e`)
 * with subtle self-levelling mineral quartz micro-flecks and trowelled satin depth.
 */
export function createPouredResinFloorMaterial(): THREE.MeshStandardMaterial {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    const ny = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * Math.PI * 2;
      const idx = (y * size + x) * 4;
      const swirl =
        Math.sin(nx * 2 + ny) * 3.5 +
        Math.cos(nx * 3 - ny * 2) * 2.5 +
        Math.sin(nx * 6 + ny * 5) * 1.5;
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const f = h - Math.floor(h);
      const microFleck = f > 0.92 ? 9 : f < 0.08 ? -7 : (f - 0.5) * 4;

      const base = 134 + swirl + microFleck;
      data[idx] = Math.max(100, Math.min(175, Math.round(base - 2)));
      data[idx + 1] = Math.max(104, Math.min(178, Math.round(base)));
      data[idx + 2] = Math.max(108, Math.min(182, Math.round(base + 3)));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);

  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.08,
  });
}

/**
 * Generates a Widescreen (`16:10` / `4.48m x 2.80m`) TrackMan iO Virtual Golf 3 (VG3)
 * championship course projection texture featuring signature TrackMan Orange (`#ff6b00`)
 * telemetry data tiles, minimap, and sunlit championship fairway & green.
 */
function createTrackManWidescreenTexture(): THREE.CanvasTexture {
  const w = 1280;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Crisp summer sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.48);
  skyGrad.addColorStop(0, '#3572c6');
  skyGrad.addColorStop(0.55, '#6ca6dc');
  skyGrad.addColorStop(1, '#d2e6f8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.5);

  // Soft cumulus clouds across the wide horizon
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  for (const [cx, cy, rx, ry] of [
    [220, 120, 115, 30],
    [290, 112, 85, 34],
    [640, 138, 95, 24],
    [920, 102, 130, 28],
    [1010, 94, 96, 32],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Distant rolling tree line & hills
  ctx.fillStyle = '#2c583a';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.46);
  for (let x = 0; x <= w; x += 32) {
    const treeH =
      Math.sin(x * 0.015) * 28 +
      Math.cos(x * 0.042) * 18 +
      Math.sin(x * 0.095) * 10;
    ctx.lineTo(x, h * 0.43 - Math.abs(treeH));
  }
  ctx.lineTo(w, h * 0.52);
  ctx.lineTo(0, h * 0.52);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 48; i++) {
    const tx = (i / 47) * w;
    const ty = h * 0.44 - Math.abs(Math.sin(i * 1.7)) * 36;
    const tr = 24 + (i % 5) * 8;
    ctx.fillStyle = i % 2 === 0 ? '#1f472b' : '#35663f';
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Widescreen Rough & Striped Fairway Perspective
  const roughGrad = ctx.createLinearGradient(0, h * 0.44, 0, h);
  roughGrad.addColorStop(0, '#3d7a35');
  roughGrad.addColorStop(0.5, '#346b2d');
  roughGrad.addColorStop(1, '#254f1f');
  ctx.fillStyle = roughGrad;
  ctx.fillRect(0, h * 0.44, w, h * 0.56);

  const fwGrad = ctx.createLinearGradient(0, h * 0.46, 0, h);
  fwGrad.addColorStop(0, '#59a946');
  fwGrad.addColorStop(0.6, '#4c993b');
  fwGrad.addColorStop(1, '#3f8630');
  ctx.fillStyle = fwGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h);
  ctx.quadraticCurveTo(w * 0.26, h * 0.68, w * 0.35, h * 0.48);
  ctx.lineTo(w * 0.69, h * 0.48);
  ctx.quadraticCurveTo(w * 0.76, h * 0.68, w * 0.88, h);
  ctx.closePath();
  ctx.fill();

  // Mowed fairway cross-stripes
  for (let s = 0; s < 10; s++) {
    if (s % 2 === 0) continue;
    const y0 = h * 0.48 + (s / 10) * (h * 0.52);
    const y1 = h * 0.48 + ((s + 1) / 10) * (h * 0.52);
    ctx.fillStyle = 'rgba(135, 220, 100, 0.16)';
    ctx.fillRect(w * 0.16, y0, w * 0.68, y1 - y0);
  }

  // Water hazard pond on left
  const waterGrad = ctx.createLinearGradient(w * 0.08, h * 0.52, w * 0.36, h * 0.64);
  waterGrad.addColorStop(0, '#1c5391');
  waterGrad.addColorStop(1, '#2989d8');
  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.58, 165, 38, -0.06, 0, Math.PI * 2);
  ctx.fill();

  // Sculpted white sand bunkers
  for (const [bx, by, brx, bry, ang] of [
    [w * 0.35, h * 0.51, 72, 18, -0.12],
    [w * 0.68, h * 0.52, 84, 21, 0.15],
    [w * 0.62, h * 0.47, 54, 14, -0.05],
  ] as const) {
    ctx.fillStyle = '#6b5c43';
    ctx.beginPath();
    ctx.ellipse(bx, by - 3, brx + 4, bry + 4, ang, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.ellipse(bx, by, brx, bry, ang, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Putting Green, Pin Flag & TrackMan Orange Ball-Flight Tracer
  ctx.fillStyle = '#6fd155';
  ctx.beginPath();
  ctx.ellipse(w * 0.51, h * 0.49, 155, 27, 0, 0, Math.PI * 2);
  ctx.fill();

  const pinX = w * 0.52;
  const pinBaseY = h * 0.485;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(pinX, pinBaseY, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(pinX, pinBaseY);
  ctx.lineTo(pinX, pinBaseY - 76);
  ctx.stroke();

  ctx.fillStyle = '#ff6b00'; // TrackMan Orange Flag
  ctx.beginPath();
  ctx.moveTo(pinX, pinBaseY - 76);
  ctx.lineTo(pinX + 32, pinBaseY - 64);
  ctx.lineTo(pinX, pinBaseY - 52);
  ctx.closePath();
  ctx.fill();

  // Signature TrackMan Orange (#ff6b00) 3D shot tracer curve
  ctx.strokeStyle = '#ff6b00';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.92);
  ctx.quadraticCurveTo(w * 0.48, h * 0.18, pinX - 8, pinBaseY - 2);
  ctx.stroke();

  // 5. Authentic TrackMan Virtual Golf 3 Bottom Widescreen Telemetry Dock & Top-Left Brand Pill
  ctx.fillStyle = 'rgba(18, 20, 24, 0.86)';
  ctx.fillRect(28, 22, 220, 44);
  ctx.fillStyle = '#ff6b00';
  ctx.fillRect(28, 22, 8, 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TRACKMAN iO', 48, 50);

  // Bottom 6-tile TrackMan Orange & Dark Slate Data Bar
  const barY = h - 88;
  const barH = 68;
  ctx.fillStyle = 'rgba(16, 18, 22, 0.88)';
  ctx.fillRect(40, barY, w - 80, barH);
  ctx.fillStyle = '#ff6b00';
  ctx.fillRect(40, barY, w - 80, 4);

  const tmTiles = [
    ['CLUB SPEED', '94.2', 'MPH'],
    ['BALL SPEED', '136.8', 'MPH'],
    ['SMASH FACTOR', '1.45', ''],
    ['LAUNCH ANGLE', '15.8', 'DEG'],
    ['SPIN RATE', '6,180', 'RPM'],
    ['CARRY', '184.5', 'YDS'],
    ['TOTAL', '196.2', 'YDS'],
  ] as const;

  const tileW = (w - 80) / tmTiles.length;
  ctx.textAlign = 'center';
  for (let i = 0; i < tmTiles.length; i++) {
    const [label, val, unit] = tmTiles[i]!;
    const cx = 40 + (i + 0.5) * tileW;
    ctx.fillStyle = '#9aa5b1';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(label, cx, barY + 21);
    ctx.fillStyle = i >= 5 ? '#ff6b00' : '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(val, cx, barY + 48);
    if (unit) {
      ctx.fillStyle = '#7b8794';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(unit, cx, barY + 62);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Issue #2 ("Change this for an oak door. Add skirting board in this room" at `[-16.62, 0.075, 16.684]`):
 * 1. Builds a high-LOD Solid European Oak 4-Panel Internal Door (`outbuildings.doorPivot.GymGarageInternal`)
 *    with a full-depth moulded oak door frame & architraves at `u = 5.77..5.97m, v = 1.25..2.15m`.
 * 2. Adds continuous profiled skirting boards (`outbuildings.gym.skirting`) around the interior perimeter
 *    of the GYM (`u = 0.28..5.77m, v = 0.28..5.43m, y = -0.60m`), wrapping cleanly around the brick pilasters
 *    and stopping neatly at the North glazed screen and East oak door architrave.
 */
export function buildGymOakDoorAndSkirting(
  ctx: SceneBuilderContext,
  groundGroup: THREE.Group,
  baseY0: number,
  wallT: number,
  uGymEnd: number,
  partT: number,
  vWestRangeSouth: number,
  skirtingMat: THREE.Material
): void {
  const oakDoorMat = new THREE.MeshStandardMaterial({
    color: 0x9b7044, // Warm golden oiled European oak
    roughness: 0.44,
    metalness: 0.04,
  });
  const oakDoorPanelMat = new THREE.MeshStandardMaterial({
    color: 0x875f37, // Slightly deeper quarter-sawn oak fielding panel
    roughness: 0.48,
    metalness: 0.04,
  });
  const oakDoorTrimMat = new THREE.MeshStandardMaterial({
    color: 0x734e2b, // Rich oak moulding & architrave shadow trim
    roughness: 0.52,
    metalness: 0.04,
  });
  const brushedBrassHandleMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    roughness: 0.26,
    metalness: 0.85,
  });

  // ---------------------------------------------------------------------------
  // 1. Moulded Solid Oak Door Frame & Architraves (`u = 5.77..5.97m, v = 1.25..2.15m`)
  // ---------------------------------------------------------------------------
  const doorUMid = uGymEnd + partT * 0.5; // 5.87m
  const doorVMin = 1.25;
  const doorVMax = 2.15;
  const doorVMid = (doorVMin + doorVMax) * 0.5; // 1.70m
  const openingW = doorVMax - doorVMin; // 0.90m
  const openingH = 1.98;
  const jambT = 0.028;
  const archW = 0.065;
  const archT = 0.018;

  const doorFrameGroup = new THREE.Group();
  doorFrameGroup.name = 'outbuildings.gymGarageDoor.frame';
  doorFrameGroup.position.set(doorUMid, baseY0, doorVMid);
  groundGroup.add(doorFrameGroup);

  // Full-depth oak jamb linings & head lining
  for (const sideZ of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.008, openingH, jambT),
      oakDoorMat
    );
    jamb.position.set(0, openingH * 0.5, sideZ * (openingW * 0.5 - jambT * 0.5));
    jamb.castShadow = true;
    jamb.receiveShadow = true;
    doorFrameGroup.add(jamb);
  }
  const headLining = new THREE.Mesh(
    new THREE.BoxGeometry(partT + 0.008, jambT, openingW),
    oakDoorMat
  );
  headLining.position.set(0, openingH - jambT * 0.5, 0);
  doorFrameGroup.add(headLining);

  // Chamfered oak architraves on both the GYM (`-u`) and Garage (`+u`) wall faces
  for (const sideX of [-1, 1] as const) {
    const xFace = sideX * (partT * 0.5 + archT * 0.5);
    for (const sideZ of [-1, 1] as const) {
      const archLeg = new THREE.Mesh(
        new THREE.BoxGeometry(archT, openingH + archW, archW),
        oakDoorTrimMat
      );
      archLeg.position.set(
        xFace,
        (openingH + archW) * 0.5,
        sideZ * (openingW * 0.5 + archW * 0.5 - 0.012)
      );
      doorFrameGroup.add(archLeg);
    }
    const archHeader = new THREE.Mesh(
      new THREE.BoxGeometry(archT, archW, openingW + archW * 2 - 0.024),
      oakDoorTrimMat
    );
    archHeader.position.set(xFace, openingH + archW * 0.5 - 0.006, 0);
    doorFrameGroup.add(archHeader);
  }

  // Solid oak threshold saddle strip under the door
  const oakSaddle = new THREE.Mesh(
    new THREE.BoxGeometry(partT + 0.02, 0.014, openingW - jambT * 2),
    oakDoorTrimMat
  );
  oakSaddle.position.set(0, 0.007, 0);
  oakSaddle.receiveShadow = true;
  doorFrameGroup.add(oakSaddle);

  // ---------------------------------------------------------------------------
  // 2. Hinged Solid Oak 4-Panel Internal Door Leaf (`outbuildings.doorPivot.GymGarageInternal`)
  // ---------------------------------------------------------------------------
  const leafW = openingW - jambT * 2 - 0.006; // 0.838m
  const leafH = openingH - jambT - 0.016; // 1.936m
  const leafT = 0.044;
  const stileW = 0.115;

  const gymGarageDoorPivot = new THREE.Group();
  gymGarageDoorPivot.name = 'outbuildings.doorPivot.GymGarageInternal';
  gymGarageDoorPivot.position.set(doorUMid, baseY0 + 0.014, doorVMin + jambT + 0.003);
  groundGroup.add(gymGarageDoorPivot);

  const corePanel = new THREE.Mesh(
    new THREE.BoxGeometry(leafT - 0.016, leafH - 0.04, leafW - 0.04),
    oakDoorPanelMat
  );
  corePanel.name = 'outbuildings.gymGarageDoor.leaf';
  corePanel.position.set(0, leafH * 0.5, leafW * 0.5);
  corePanel.castShadow = true;
  corePanel.receiveShadow = true;
  gymGarageDoorPivot.add(corePanel);

  for (const zCenter of [stileW * 0.5, leafW - stileW * 0.5]) {
    const stile = new THREE.Mesh(
      new THREE.BoxGeometry(leafT, leafH, stileW),
      oakDoorMat
    );
    stile.position.set(0, leafH * 0.5, zCenter);
    stile.castShadow = true;
    stile.receiveShadow = true;
    gymGarageDoorPivot.add(stile);
  }

  const muntin = new THREE.Mesh(
    new THREE.BoxGeometry(leafT, leafH - 0.24, 0.088),
    oakDoorMat
  );
  muntin.position.set(0, leafH * 0.5, leafW * 0.5);
  muntin.castShadow = true;
  gymGarageDoorPivot.add(muntin);

  const railSpanZ = leafW - stileW * 2 + 0.004;
  for (const [rY, rH] of [
    [0.095, 0.19],
    [0.86, 0.16],
    [leafH - 0.42, 0.11],
    [leafH - 0.058, 0.116],
  ] as const) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(leafT, rH, railSpanZ),
      oakDoorMat
    );
    rail.position.set(0, rY, leafW * 0.5);
    rail.castShadow = true;
    rail.receiveShadow = true;
    gymGarageDoorPivot.add(rail);
  }

  const panelColCenters = [
    stileW + (leafW * 0.5 - 0.044 - stileW) * 0.5,
    leafW * 0.5 + 0.044 + (leafW * 0.5 - 0.044 - stileW) * 0.5,
  ];
  const panelColW = leafW * 0.5 - 0.044 - stileW - 0.028;
  for (const pz of panelColCenters) {
    for (const [py, ph] of [
      [0.485, 0.54],
      [1.22, 0.5],
      [leafH - 0.24, 0.2],
    ] as const) {
      const fieldedPanel = new THREE.Mesh(
        new THREE.BoxGeometry(leafT - 0.006, ph, panelColW),
        oakDoorMat
      );
      fieldedPanel.position.set(0, py, pz);
      gymGarageDoorPivot.add(fieldedPanel);
    }
  }

  const handleZ = leafW - stileW * 0.5;
  const handleY = 0.96;
  for (const sideX of [-1, 1] as const) {
    const rose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.027, 0.008, 16),
      brushedBrassHandleMat
    );
    rose.rotation.z = Math.PI / 2;
    rose.position.set(sideX * (leafT * 0.5 + 0.004), handleY, handleZ);
    gymGarageDoorPivot.add(rose);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.036, 12),
      brushedBrassHandleMat
    );
    neck.rotation.z = Math.PI / 2;
    neck.position.set(sideX * (leafT * 0.5 + 0.022), handleY, handleZ);
    gymGarageDoorPivot.add(neck);

    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.018, 0.125),
      brushedBrassHandleMat
    );
    lever.position.set(sideX * (leafT * 0.5 + 0.038), handleY, handleZ - 0.048);
    gymGarageDoorPivot.add(lever);

    const escutcheon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.008, 16),
      brushedBrassHandleMat
    );
    escutcheon.rotation.z = Math.PI / 2;
    escutcheon.position.set(sideX * (leafT * 0.5 + 0.004), handleY - 0.085, handleZ);
    gymGarageDoorPivot.add(escutcheon);
  }

  ctx.interactions.registerHingedDoor(
    groundGroup,
    gymGarageDoorPivot,
    new THREE.Vector3(0, 0, 0),
    'y',
    Math.PI * 0.46
  );

  // ---------------------------------------------------------------------------
  // 3. Profiled Architectural Skirting Boards around the GYM (`outbuildings.gym.skirting`)
  // ---------------------------------------------------------------------------
  const skirtingGroup = new THREE.Group();
  skirtingGroup.name = 'outbuildings.gym.skirting';
  skirtingGroup.userData.isArchitecturalShell = true;
  groundGroup.add(skirtingGroup);

  const skirtBaseH = 0.118;
  const skirtCapH = 0.024;
  const skirtBaseT = 0.02;
  const skirtCapT = 0.014;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m

  const addSkirtingAlongU = (u0: number, u1: number, vWallFace: number, inwardSignV: 1 | -1): void => {
    const lenU = u1 - u0;
    if (lenU <= 0.01) return;
    const midU = (u0 + u1) * 0.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(lenU, skirtBaseH, skirtBaseT),
      skirtingMat
    );
    baseMesh.position.set(
      midU,
      baseY0 + skirtBaseH * 0.5,
      vWallFace + inwardSignV * (skirtBaseT * 0.5)
    );
    baseMesh.receiveShadow = true;
    skirtingGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(
      new THREE.BoxGeometry(lenU, skirtCapH, skirtCapT),
      skirtingMat
    );
    capMesh.position.set(
      midU,
      baseY0 + skirtBaseH + skirtCapH * 0.5,
      vWallFace + inwardSignV * (skirtCapT * 0.5)
    );
    skirtingGroup.add(capMesh);
  };

  const addSkirtingAlongV = (v0: number, v1: number, uWallFace: number, inwardSignU: 1 | -1): void => {
    const lenV = v1 - v0;
    if (lenV <= 0.01) return;
    const midV = (v0 + v1) * 0.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(skirtBaseT, skirtBaseH, lenV),
      skirtingMat
    );
    baseMesh.position.set(
      uWallFace + inwardSignU * (skirtBaseT * 0.5),
      baseY0 + skirtBaseH * 0.5,
      midV
    );
    baseMesh.receiveShadow = true;
    skirtingGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(
      new THREE.BoxGeometry(skirtCapT, skirtCapH, lenV),
      skirtingMat
    );
    capMesh.position.set(
      uWallFace + inwardSignU * (skirtCapT * 0.5),
      baseY0 + skirtBaseH + skirtCapH * 0.5,
      midV
    );
    skirtingGroup.add(capMesh);
  };

  addSkirtingAlongV(vInnerNorth, vInnerSouth, wallT, 1);
  addSkirtingAlongV(vInnerNorth, doorVMin - archW + 0.012, uGymEnd, -1);
  addSkirtingAlongV(doorVMax + archW - 0.012, vInnerSouth, uGymEnd, -1);

  addSkirtingAlongU(wallT, 2.71, vInnerNorth, 1);
  addSkirtingAlongV(vInnerNorth, vInnerNorth + 0.16 + skirtBaseT, 2.71, -1);
  addSkirtingAlongU(2.71 - skirtBaseT, 3.01 + skirtBaseT, vInnerNorth + 0.16, 1);
  addSkirtingAlongV(vInnerNorth, vInnerNorth + 0.16 + skirtBaseT, 3.01, 1);
  addSkirtingAlongU(5.45, uGymEnd, vInnerNorth, 1);

  addSkirtingAlongU(wallT, 2.71, vInnerSouth, -1);
  addSkirtingAlongV(vInnerSouth - 0.16 - skirtBaseT, vInnerSouth, 2.71, -1);
  addSkirtingAlongU(2.71 - skirtBaseT, 3.01 + skirtBaseT, vInnerSouth - 0.16, -1);
  addSkirtingAlongV(vInnerSouth - 0.16 - skirtBaseT, vInnerSouth, 3.01, 1);
  addSkirtingAlongU(3.01, uGymEnd, vInnerSouth, -1);
}

/**
 * Issue #3 ("Nike grind dumbell rack here" at `[-21.015, -0.123, 16.156]` + 2 Uploaded Reference Photos):
 * Builds the exact 3-Tier Commercial Nike Grind Hex Dumbbell Rack (`outbuildings.gym.nikeGrindDumbbellRack`)
 * shown in the user's photos:
 * - Matte-black powder-coated steel 3-tier A-frame with angled front C-channel columns, rear support legs,
 *   bolted dual-angle-iron trays, rubber end-cap foot boots, and triangular lower side gusset plates
 *   with the laser-cut Nike Swoosh + `NIKE` stencil.
 * - 10 Graduated Pairs (20 dumbbells total) of light pebble-grey speckled Nike Grind Rounded-Hex Dumbbells:
 *   - Top Tier (4 pairs): `5`, `10`, `15`, `20` lb
 *   - Middle Tier (3 pairs): `25`, `30`, `35` lb
 *   - Bottom Tier (3 pairs): `40`, `45`, `50` lb
 *   Each dumbbell features softly bevelled light-grey speckled Nike Grind hex heads with the black Nike Swoosh
 *   on the front head and bold black weight numbers on the rear head, joined by a contoured barrel chrome handle.
 */
export function buildNikeGrindDumbbellRack(
  groundGroup: THREE.Group,
  baseY0: number
): void {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.gym.nikeGrindDumbbellRack';
  rackGroup.position.set(1.49, baseY0, 0.62);
  groundGroup.add(rackGroup);

  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22, // Matte black powder-coated steel rack frame
    roughness: 0.42,
    metalness: 0.62,
  });
  const rubberBootMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.78,
    metalness: 0.06,
  });
  const chromeBoltMat = new THREE.MeshStandardMaterial({
    color: 0xe2e6ec, // Polished chrome handle & stainless hex bolts
    roughness: 0.16,
    metalness: 0.94,
  });
  const knurledGripMat = new THREE.MeshStandardMaterial({
    color: 0xbec4cc, // Matte diamond-knurled grip bands on the contoured handle
    roughness: 0.44,
    metalness: 0.84,
  });
  const sideGussetMat = new THREE.MeshStandardMaterial({
    map: createNikeSideGussetTexture(),
    roughness: 0.45,
    metalness: 0.55,
  });

  const rackW = 1.44;
  const rackD = 0.58;
  const rackH = 0.88;

  // 1. Left & Right Matte-Black Steel A-Frame Side Uprights, Rubber Foot Boots & Triangular `NIKE` Side Gussets
  for (const sideX of [-1, 1] as const) {
    const ux = sideX * (rackW * 0.5 - 0.032);

    // Base stabilizer foot rail (`0.58m` deep) + moulded black rubber front/back end boots
    const baseSkid = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.042, rackD - 0.06),
      frameSteelMat
    );
    baseSkid.position.set(ux, 0.025, 0);
    baseSkid.castShadow = true;
    baseSkid.receiveShadow = true;
    rackGroup.add(baseSkid);

    for (const bootZ of [-rackD * 0.5 + 0.035, rackD * 0.5 - 0.035]) {
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.076, 0.052, 0.082),
        rubberBootMat
      );
      boot.position.set(ux, 0.026, bootZ);
      rackGroup.add(boot);
    }

    // Main front/top sloped C-channel upright column (raking backward from front base to top tier)
    const frontLegLen = Math.hypot(rackH - 0.04, 0.28);
    const frontLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, frontLegLen, 0.068),
      frameSteelMat
    );
    frontLeg.position.set(ux, rackH * 0.5 + 0.01, 0.03);
    frontLeg.rotation.x = -0.31; // Slopes up and toward `-Z` (rear)
    frontLeg.castShadow = true;
    rackGroup.add(frontLeg);

    // Rear support leg rising from rear foot to the upper/middle column
    const rearLegLen = Math.hypot(rackH * 0.82, 0.16);
    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, rearLegLen, 0.062),
      frameSteelMat
    );
    rearLeg.position.set(ux, rackH * 0.42 + 0.01, -0.14);
    rearLeg.rotation.x = 0.14;
    rearLeg.castShadow = true;
    rackGroup.add(rearLeg);

    // Lower Triangular Side Gusset Plate with Laser-Cut Nike Swoosh & Stencilled `NIKE` Logo (Photo 1)
    const gusset = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.34, 0.24),
      sideGussetMat
    );
    gusset.position.set(ux + sideX * 0.024, 0.19, 0.09);
    rackGroup.add(gusset);
  }

  // 2. Three Angled Steel Dumbbell Shelf Tiers (Bottom: 3 pairs, Middle: 3 pairs, Top: 4 pairs — Photo 1)
  const tierSpecs = [
    {
      id: 'bottom',
      y: 0.22,
      z: 0.08,
      weights: [40, 45, 50] as const,
      radii: [0.084, 0.088, 0.092] as const,
      lengths: [0.092, 0.096, 0.1] as const,
    },
    {
      id: 'middle',
      y: 0.53,
      z: -0.01,
      weights: [25, 30, 35] as const,
      radii: [0.072, 0.076, 0.08] as const,
      lengths: [0.078, 0.082, 0.086] as const,
    },
    {
      id: 'top',
      y: 0.83,
      z: -0.1,
      weights: [5, 10, 15, 20] as const,
      radii: [0.048, 0.055, 0.062, 0.068] as const,
      lengths: [0.056, 0.062, 0.068, 0.074] as const,
    },
  ] as const;

  // Contoured barrel handle profile (`LatheGeometry` around Y)
  const handlePoints = [
    new THREE.Vector2(0.0135, -0.066),
    new THREE.Vector2(0.0155, -0.042),
    new THREE.Vector2(0.0172, 0.0),
    new THREE.Vector2(0.0155, 0.042),
    new THREE.Vector2(0.0135, 0.066),
  ];
  const barrelHandleGeo = new THREE.LatheGeometry(handlePoints, 14);
  barrelHandleGeo.rotateX(Math.PI / 2); // Align handle axis along local Z

  const traySpanX = rackW - 0.11;

  for (let tIdx = 0; tIdx < tierSpecs.length; tIdx++) {
    const tier = tierSpecs[tIdx]!;
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, tier.y, tier.z);
    trayGroup.rotation.x = 0.22; // Forward downward presentation tilt matching Photo 1
    rackGroup.add(trayGroup);

    // Front & Rear Black Angle-Iron Cradle Rails + End Mounting Brackets with Silver Hex Bolts
    for (const railZ of [-0.115, 0.115] as const) {
      const railBar = new THREE.Mesh(
        new THREE.BoxGeometry(traySpanX, 0.022, 0.042),
        frameSteelMat
      );
      railBar.position.set(0, 0, railZ);
      railBar.castShadow = true;
      railBar.receiveShadow = true;
      trayGroup.add(railBar);

      const railLip = new THREE.Mesh(
        new THREE.BoxGeometry(traySpanX, 0.036, 0.012),
        frameSteelMat
      );
      railLip.position.set(0, 0.016, railZ + (railZ > 0 ? 0.018 : -0.018));
      trayGroup.add(railLip);
    }

    // Bolted end-flanges with silver hex bolts at left and right ends of each shelf
    for (const sideX of [-1, 1] as const) {
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.048, 0.28),
        frameSteelMat
      );
      flange.position.set(sideX * (traySpanX * 0.5 - 0.008), -0.008, 0);
      trayGroup.add(flange);

      const hexBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.014, 6),
        chromeBoltMat
      );
      hexBolt.position.set(sideX * (traySpanX * 0.5 - 0.022), 0.012, 0.125);
      trayGroup.add(hexBolt);
    }

    // Populate the pairs of Light-Grey Speckled Nike Grind Hex Dumbbells across the tier
    const numPairs = tier.weights.length;
    const totalDumbbells = numPairs * 2;
    const slotW = (traySpanX - 0.04) / totalDumbbells;

    for (let p = 0; p < numPairs; p++) {
      const weightLb = tier.weights[p]!;
      const headR = tier.radii[p]!;
      const headLen = tier.lengths[p]!;
      const headGeo = createBevelledHexHeadGeometry(headR, headLen);
      const headMat = new THREE.MeshStandardMaterial({
        map: createNikeGrindLightGreyHexTexture(weightLb),
        roughness: 0.72,
        metalness: 0.03,
      });

      for (let d = 0; d < 2; d++) {
        const slotIdx = p * 2 + d;
        const dbX = -traySpanX * 0.5 + 0.02 + (slotIdx + 0.5) * slotW;
        const dbY = 0.012 + headR * 0.866;

        const dbGroup = new THREE.Group();
        dbGroup.name = `outbuildings.gym.nikeGrindDumbbell.${weightLb}lb.${d + 1}`;
        dbGroup.position.set(dbX, dbY, 0);
        trayGroup.add(dbGroup);

        // Ergonomic contoured chrome barrel handle with knurled center bands
        const handleMesh = new THREE.Mesh(barrelHandleGeo, chromeBoltMat);
        handleMesh.castShadow = true;
        dbGroup.add(handleMesh);

        for (const kz of [-0.032, 0.0, 0.032]) {
          const knurlBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0168, 0.0168, 0.018, 12),
            knurledGripMat
          );
          knurlBand.rotation.x = Math.PI / 2;
          knurlBand.position.set(0, 0, kz);
          dbGroup.add(knurlBand);
        }

        // Front (`+Z`) and Rear (`-Z`) Light-Grey Speckled Nike Grind Bevelled Hex Heads
        const handleHalfSpan = 0.064;
        for (const endZ of [-1, 1] as const) {
          const hexHead = new THREE.Mesh(headGeo, headMat);
          hexHead.rotation.x = Math.PI / 2;
          // Rotate front head so the Nike Swoosh facet (`u ≈ 0.25`) faces up, and rear head so the weight numeral (`u ≈ 0.75`) faces up!
          hexHead.rotation.y = endZ > 0 ? 0 : Math.PI;
          hexHead.position.set(0, 0, endZ * (handleHalfSpan + headLen * 0.5 - 0.004));
          hexHead.castShadow = true;
          hexHead.receiveShadow = true;
          dbGroup.add(hexHead);
        }
      }
    }
  }
}

/**
 * Generates a realistic brushed 304 stainless-steel horizontal grain texture (`#dce1e7`)
 * with fine linear satin abrasion lines and subtle specular sheen variation.
 */
function createBrushedStainlessSteelMaterial(): THREE.MeshStandardMaterial {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#d8dde3');
  grad.addColorStop(0.45, '#eef2f6');
  grad.addColorStop(0.75, '#cfd5dc');
  grad.addColorStop(1, '#e3e8ee');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Fine horizontal brushed 304 stainless grain lines
  for (let y = 0; y < h; y++) {
    const n = Math.sin(y * 19.73) * 43758.5453;
    const f = n - Math.floor(n);
    ctx.fillStyle =
      f > 0.5
        ? `rgba(255, 255, 255, ${(f - 0.5) * 0.22})`
        : `rgba(110, 120, 132, ${(0.5 - f) * 0.22})`;
    ctx.fillRect(0, y, w, 1);
  }

  for (let i = 0; i < 650; i++) {
    const h1 = Math.sin(i * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const sx = f1 * w;
    const sy = f2 * h;
    const len = 28 + (i % 65);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(90,98,108,0.12)';
    ctx.fillRect(sx, sy, len, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xdce1e7,
    roughness: 0.24,
    metalness: 0.88,
  });
}

/**
 * Generates a high-resolution multi-stave finger-jointed rock-maple & European-oak
 * laminated butcher-block worktop texture with realistic stave tone variation,
 * finger-joint butt seams, medullary ray grain, and satin tung-oil finish.
 */
function createButcherBlockTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const staveColors = [
    '#c89662',
    '#bc8650',
    '#d2a16d',
    '#b37c46',
    '#c5915b',
    '#d6a673',
    '#ba834d',
    '#cf9d68',
    '#ad7640',
    '#c28e58',
  ] as const;

  const numStaves = 18;
  const staveH = h / numStaves;

  for (let s = 0; s < numStaves; s++) {
    const y0 = s * staveH;
    // 2 or 3 finger-jointed stave segments along the 3.16m length
    const joint1 = Math.round(w * (0.28 + ((s * 37) % 41) * 0.011));
    const joint2 = Math.round(w * (0.66 + ((s * 53) % 27) * 0.01));
    const segBounds = [0, joint1, joint2, w] as const;

    for (let seg = 0; seg < 3; seg++) {
      const x0 = segBounds[seg]!;
      const x1 = segBounds[seg + 1]!;
      const segW = x1 - x0;
      const baseColor = staveColors[(s * 3 + seg * 5) % staveColors.length]!;

      ctx.fillStyle = baseColor;
      ctx.fillRect(x0, y0, segW, staveH + 0.5);

      // Subtle longitudinal wood grain fibers within each stave segment
      for (let g = 0; g < 16; g++) {
        const gy = y0 + ((g + 0.5) / 16) * staveH;
        ctx.strokeStyle =
          g % 2 === 0 ? 'rgba(85, 48, 18, 0.10)' : 'rgba(255, 228, 190, 0.08)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x0, gy);
        for (let gx = x0; gx <= x1; gx += 32) {
          const wave = Math.sin(gx * 0.025 + s * 1.7 + g * 0.6) * 1.6;
          ctx.lineTo(gx, gy + wave);
        }
        ctx.stroke();
      }

      // Finger-joint vertical micro-zig-zag seam at segment boundary
      if (seg > 0) {
        ctx.strokeStyle = 'rgba(72, 40, 14, 0.42)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let fy = y0; fy <= y0 + staveH; fy += 3.5) {
          const zig = ((Math.round((fy - y0) / 3.5) % 2) - 0.5) * 3.2;
          if (fy === y0) ctx.moveTo(x0 + zig, fy);
          else ctx.lineTo(x0 + zig, fy);
        }
        ctx.stroke();
      }
    }

    // Crisp horizontal stave glue-line shadow
    ctx.fillStyle = 'rgba(68, 38, 14, 0.36)';
    ctx.fillRect(0, y0, w, 1.2);
  }

  // Subtle warm tung-oil sheen vignette
  const sheen = ctx.createLinearGradient(0, 0, 0, h);
  sheen.addColorStop(0, 'rgba(255, 245, 225, 0.06)');
  sheen.addColorStop(0.5, 'rgba(255, 250, 240, 0.10)');
  sheen.addColorStop(1, 'rgba(60, 35, 12, 0.08)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generates a crisp DeWALT black-and-yellow brand badge texture (`#febd17` & `#141619`).
 */
function createDeWaltLogoTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#febd17';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#141619';
  ctx.fillRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = '#febd17';
  ctx.fillRect(16, 16, w - 32, 5);
  ctx.fillRect(16, h - 21, w - 32, 5);

  ctx.font = '900 40px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DeWALT', w * 0.5, h * 0.5 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Issue #5 ("High qulality tool bench here with drawers and power rools" at `[-11.123, 0.378, 20.475]`) +
 * Issue #1 ("stainless steel" at `[-11.567, 0.262, 19.762]`, `outbuildings.garage.toolBench.drawer`) +
 * Issue #2 ("Better mesh on top, dewal powertools, slightly wider" at `[-12.332, 0.406, 20.235]`,
 * `outbuildings.garage.toolBench.butcherBlockTop`):
 * Builds a wider `3.16m` 4-Bay Heavy-Duty Commercial Stainless-Steel & Laminated Butcher-Block Workshop Tool Bench
 * (`outbuildings.garage.toolBench`) centered at `u = 10.30m, v = 5.04m` (`u = 8.72..11.88m`), featuring:
 * - Brushed 304 stainless-steel drawer fronts & cabinet doors across 4 bays (16 ball-bearing drawers + double-door bay)
 * - Multi-stave finger-jointed hardwood butcher-block worktop assembly with bullnose front edge, end-grain side caps,
 *   30mm brushed stainless rear/side perimeter upstand lip, and inlaid magnetic stainless parts tray
 * - Full suite of recognizable **DeWALT 18V XR / 54V FLEXVOLT** (`#febd17` yellow & `#181a1d` matte black) power tools:
 *   DWS780 305mm Compound Mitre Saw, DW752 Twin-Wheel Bench Grinder, DWE4257 Angle Grinder, DCW210 Orbit Sander,
 *   DCB132 Dual XR Fast Charger, DCD996 Hammer Drill, DCF887 Impact Driver, and DeWALT TSTAK case.
 */
export function buildGarageWorkshopToolBench(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.garage.toolBench';
  benchGroup.position.set(10.3, garageFloorTopY, 5.04);
  groundGroup.add(benchGroup);

  const anthraciteSteelMat = new THREE.MeshStandardMaterial({
    color: 0x22262c,
    roughness: 0.38,
    metalness: 0.68,
  });
  const brushedStainlessMat = createBrushedStainlessSteelMaterial();
  const aluminumTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe0e5ec,
    roughness: 0.2,
    metalness: 0.92,
  });
  const butcherBlockMat = new THREE.MeshStandardMaterial({
    map: createButcherBlockTexture(),
    color: 0xffffff,
    roughness: 0.36,
    metalness: 0.04,
  });
  const butcherEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x9e6b3b,
    roughness: 0.42,
    metalness: 0.04,
  });
  const viceCastIronMat = new THREE.MeshStandardMaterial({
    color: 0x2b3e50,
    roughness: 0.44,
    metalness: 0.74,
  });
  // Authentic DeWALT Industrial Yellow (#febd17) & Matte Black (#181a1d)
  const dewaltYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfebd17,
    roughness: 0.3,
    metalness: 0.16,
  });
  const dewaltBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.74,
    metalness: 0.12,
  });
  const dewaltBadgeMat = new THREE.MeshStandardMaterial({
    map: createDeWaltLogoTexture(),
    roughness: 0.28,
    metalness: 0.15,
  });
  const castAluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc8cfd8,
    roughness: 0.28,
    metalness: 0.85,
  });
  const rockerSwitchMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    roughness: 0.35,
    metalness: 0.15,
  });
  const greenLedMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: new THREE.Color(0x00e676),
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const clearShieldMat = new THREE.MeshStandardMaterial({
    color: 0xe8f4f8,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.48,
  });

  // Wider 4-bay commercial workbench (`totalW = 3.16m`, spanning `u = 8.72..11.88m`)
  const totalW = 3.16;
  const benchD = 0.74;
  const cabinetH = 0.86;
  const topT = 0.048;
  const worktopY = cabinetH + topT;

  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  carcass.position.set(0, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  benchGroup.add(carcass);

  // Vertical stainless-steel Mullion Stile Dividers between the 4 bays
  const frontZ = -benchD * 0.5 + 0.012;
  for (const mx of [-1.54, -0.77, 0.0, 0.77, 1.54]) {
    const stile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, cabinetH - 0.05, 0.016),
      anthraciteSteelMat
    );
    stile.position.set(mx, 0.05 + (cabinetH - 0.05) * 0.5, frontZ + 0.004);
    benchGroup.add(stile);
  }

  // 5 Pairs of Heavy-Duty Adjustable Stainless Leveling Feet
  for (const fx of [-totalW * 0.5 + 0.08, -0.77, 0.0, 0.77, totalW * 0.5 - 0.08]) {
    for (const fz of [-benchD * 0.5 + 0.07, benchD * 0.5 - 0.07]) {
      const footPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.038, 0.014, 14),
        dewaltBlackMat
      );
      footPad.position.set(fx, 0.007, fz);
      benchGroup.add(footPad);

      const footLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.028, 0.042, 12),
        aluminumTrimMat
      );
      footLeg.position.set(fx, 0.031, fz);
      benchGroup.add(footLeg);
    }
  }

  // Issue #1: Brushed 304 Stainless-Steel Drawers across 4 Bays (3 drawer banks + 1 cupboard bank)
  const bankSpecs = [
    {
      cx: -1.155,
      w: 0.735,
      drawerHeights: [0.075, 0.075, 0.095, 0.115, 0.155, 0.215] as const,
    },
    {
      cx: -0.385,
      w: 0.735,
      drawerHeights: [0.085, 0.105, 0.135, 0.185, 0.22] as const,
    },
    {
      cx: 0.385,
      w: 0.735,
      drawerHeights: [0.085, 0.105, 0.135, 0.185, 0.22] as const,
    },
    {
      cx: 1.155,
      w: 0.735,
      drawerHeights: [0.095, 0.135] as const,
    },
  ] as const;

  for (const bank of bankSpecs) {
    let cursorY = cabinetH - 0.025;

    // Stainless cylinder key lock at the top-right of each drawer bank
    const keyLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    keyLock.rotation.x = Math.PI / 2;
    keyLock.position.set(bank.cx + bank.w * 0.5 - 0.032, cabinetH - 0.048, frontZ - 0.004);
    benchGroup.add(keyLock);

    for (let dIdx = 0; dIdx < bank.drawerHeights.length; dIdx++) {
      const dh = bank.drawerHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w, dh - 0.007, 0.02),
        brushedStainlessMat
      );
      drawerFront.name = 'outbuildings.garage.toolBench.drawer';
      drawerFront.position.set(bank.cx, dy, frontZ);
      drawerFront.castShadow = true;
      drawerFront.receiveShadow = true;
      benchGroup.add(drawerFront);

      // Full-width extruded anodized-aluminum finger-pull rail
      const pullBar = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w - 0.024, 0.016, 0.026),
        aluminumTrimMat
      );
      pullBar.position.set(bank.cx, dy + dh * 0.5 - 0.015, frontZ - 0.012);
      benchGroup.add(pullBar);

      // Recessed dark-grey index label strip on the pull bar
      const labelStrip = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w * 0.42, 0.007, 0.004),
        dewaltBlackMat
      );
      labelStrip.position.set(bank.cx, dy + dh * 0.5 - 0.015, frontZ - 0.025);
      benchGroup.add(labelStrip);

      cursorY -= dh;
    }
  }

  // Bay 4 Lower Double-Door Brushed Stainless Cupboard (`cx = +1.155m`)
  for (const sideX of [-1, 1] as const) {
    const doorW = 0.362;
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, 0.495, 0.02),
      brushedStainlessMat
    );
    doorPanel.name = 'outbuildings.garage.toolBench.drawer';
    doorPanel.position.set(1.155 + sideX * (doorW * 0.5 + 0.004), 0.325, frontZ);
    doorPanel.castShadow = true;
    doorPanel.receiveShadow = true;
    benchGroup.add(doorPanel);

    const vHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.15, 0.026),
      aluminumTrimMat
    );
    vHandle.position.set(1.155 + sideX * 0.032, 0.42, frontZ - 0.012);
    benchGroup.add(vHandle);
  }

  // ---------------------------------------------------------------------------
  // Issue #2 ("Better mesh on top"): Multi-Part Laminated Hardwood Butcher-Block Worktop Assembly
  // ---------------------------------------------------------------------------
  const butcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(totalW, topT, benchD),
    butcherBlockMat
  );
  butcherTop.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  butcherTop.position.set(0, cabinetH + topT * 0.5, 0);
  butcherTop.castShadow = true;
  butcherTop.receiveShadow = true;
  benchGroup.add(butcherTop);

  // Rounded Front Bullnose Hardwood Edge Moulding along `-Z`
  const bullnoseRadius = topT * 0.5;
  const frontBullnose = new THREE.Mesh(
    new THREE.CylinderGeometry(bullnoseRadius, bullnoseRadius, totalW, 16),
    butcherBlockMat
  );
  frontBullnose.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  frontBullnose.rotation.z = Math.PI / 2;
  frontBullnose.position.set(0, cabinetH + topT * 0.5, -benchD * 0.5);
  frontBullnose.castShadow = true;
  frontBullnose.receiveShadow = true;
  benchGroup.add(frontBullnose);

  // End-Grain Hardwood Edge Banding Caps + Brushed-Stainless Corner Tie Plates on `-X` and `+X`
  for (const sideX of [-1, 1] as const) {
    const endCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, topT + 0.002, benchD + 0.012),
      butcherEdgeMat
    );
    endCap.position.set(sideX * (totalW * 0.5 + 0.004), cabinetH + topT * 0.5, 0);
    endCap.castShadow = true;
    benchGroup.add(endCap);

    // Stainless corner reinforcement bracket at the front corners
    const cornerBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, topT + 0.004, 0.065),
      brushedStainlessMat
    );
    cornerBracket.position.set(
      sideX * (totalW * 0.5 - 0.026),
      cabinetH + topT * 0.5,
      -benchD * 0.5 + 0.022
    );
    benchGroup.add(cornerBracket);
  }

  // Brushed 304 Stainless-Steel 30mm Rear & Side Perimeter Upstand Splash Lip
  const upstandH = 0.032;
  const upstandT = 0.012;
  const rearUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 0.016, upstandH, upstandT),
    brushedStainlessMat
  );
  rearUpstand.position.set(0, worktopY + upstandH * 0.5, benchD * 0.5 - upstandT * 0.5);
  benchGroup.add(rearUpstand);

  for (const sideX of [-1, 1] as const) {
    const sideUpstand = new THREE.Mesh(
      new THREE.BoxGeometry(upstandT, upstandH, benchD * 0.65),
      brushedStainlessMat
    );
    sideUpstand.position.set(
      sideX * (totalW * 0.5 + 0.002),
      worktopY + upstandH * 0.5,
      benchD * 0.5 - (benchD * 0.65) * 0.5
    );
    benchGroup.add(sideUpstand);
  }

  // Recessed Brushed-Stainless Magnetic Parts & Fastener Tray (`x = -0.96m, z = -0.22m`)
  const magTrayGroup = new THREE.Group();
  magTrayGroup.position.set(-0.96, worktopY, -0.22);
  benchGroup.add(magTrayGroup);

  const trayRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.01, 0.18),
    brushedStainlessMat
  );
  trayRim.position.set(0, 0.005, 0);
  magTrayGroup.add(trayRim);

  const trayWell = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.006, 0.14),
    anthraciteSteelMat
  );
  trayWell.position.set(0, 0.008, 0);
  magTrayGroup.add(trayWell);

  // Chrome drive sockets & fasteners inside the magnetic tray
  for (let s = 0; s < 6; s++) {
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008 + s * 0.0012, 0.008 + s * 0.0012, 0.028, 12),
      aluminumTrimMat
    );
    socket.position.set(-0.08 + s * 0.032, 0.024, -0.03);
    magTrayGroup.add(socket);
  }

  // Full-Width Perforated Steel Pegboard Backwall & Upper Stainless Wall Cabinets (`3.16m` wide)
  const pegboardH = 0.64;
  const pegboard = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, pegboardH, 0.024),
    anthraciteSteelMat
  );
  pegboard.name = 'outbuildings.garage.toolBench.pegboard';
  pegboard.position.set(0, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.02);
  benchGroup.add(pegboard);

  const powerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.062, 0.036),
    aluminumTrimMat
  );
  powerStrip.name = 'outbuildings.garage.toolBench.powerStrip';
  powerStrip.position.set(0.05, worktopY + 0.11, benchD * 0.5 - 0.045);
  benchGroup.add(powerStrip);

  for (let s = 0; s < 6; s++) {
    const sx = 0.05 - 0.25 + s * 0.1;
    const socketFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, 0.008),
      dewaltBlackMat
    );
    socketFace.position.set(sx, worktopY + 0.11, benchD * 0.5 - 0.065);
    benchGroup.add(socketFace);

    const redSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.018, 0.01),
      rockerSwitchMat
    );
    redSwitch.position.set(sx + 0.016, worktopY + 0.12, benchD * 0.5 - 0.068);
    benchGroup.add(redSwitch);
  }

  const upperCabH = 0.34;
  const upperCabD = 0.32;
  const upperCab = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, upperCabH, upperCabD),
    anthraciteSteelMat
  );
  upperCab.position.set(
    0,
    worktopY + pegboardH + upperCabH * 0.5,
    benchD * 0.5 - upperCabD * 0.5
  );
  upperCab.castShadow = true;
  benchGroup.add(upperCab);

  // 4 Overhead Brushed Stainless-Steel Flip-Up Locker Doors matching the 4 lower bays
  for (const ux of [-1.155, -0.385, 0.385, 1.155]) {
    const upperDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.735, upperCabH - 0.03, 0.018),
      brushedStainlessMat
    );
    upperDoor.name = 'outbuildings.garage.toolBench.drawer';
    upperDoor.position.set(
      ux,
      worktopY + pegboardH + upperCabH * 0.5,
      benchD * 0.5 - upperCabD - 0.008
    );
    benchGroup.add(upperDoor);

    const upperPull = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.014, 0.022),
      aluminumTrimMat
    );
    upperPull.position.set(
      ux,
      worktopY + pegboardH + 0.035,
      benchD * 0.5 - upperCabD - 0.022
    );
    benchGroup.add(upperPull);
  }

  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfff1d0),
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const ledTaskBar = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.24, 0.014, 0.038),
    ledStripMat
  );
  ledTaskBar.position.set(0, worktopY + pegboardH - 0.007, benchD * 0.5 - upperCabD + 0.05);
  benchGroup.add(ledTaskBar);

  // ---------------------------------------------------------------------------
  // Issue #2 ("dewal powertools"): Authentic DeWALT 18V XR / 54V FLEXVOLT Suite
  // ---------------------------------------------------------------------------

  // A. Heavy Cast-Iron Engineer's Bench Vice (`x = -1.32m, z = -0.24m`)
  const viceGroup = new THREE.Group();
  viceGroup.name = 'outbuildings.garage.toolBench.vice';
  viceGroup.position.set(-1.32, worktopY, -0.24);
  benchGroup.add(viceGroup);

  const viceBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.098, 0.028, 16),
    viceCastIronMat
  );
  viceBase.position.set(0, 0.014, 0);
  viceGroup.add(viceBase);

  const fixedJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.145, 0.095),
    viceCastIronMat
  );
  fixedJaw.position.set(0, 0.092, 0.02);
  fixedJaw.castShadow = true;
  viceGroup.add(fixedJaw);

  const slidingJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.125, 0.078),
    viceCastIronMat
  );
  slidingJaw.position.set(0, 0.086, -0.088);
  slidingJaw.castShadow = true;
  viceGroup.add(slidingJaw);

  const viceSlideBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.048, 0.23),
    aluminumTrimMat
  );
  viceSlideBar.position.set(0, 0.065, -0.02);
  viceGroup.add(viceSlideBar);

  const leadScrewHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12),
    aluminumTrimMat
  );
  leadScrewHub.rotation.x = Math.PI / 2;
  leadScrewHub.position.set(0, 0.075, -0.148);
  viceGroup.add(leadScrewHub);

  const tommyBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 10),
    aluminumTrimMat
  );
  tommyBar.rotation.z = 0.45;
  tommyBar.position.set(0, 0.075, -0.168);
  viceGroup.add(tommyBar);

  // B. DeWALT DWS780 305mm Double-Bevel Sliding Compound Mitre Saw (`x = -0.52m, z = -0.02m`)
  const sawGroup = new THREE.Group();
  sawGroup.name = 'outbuildings.garage.toolBench.mitreSaw';
  sawGroup.position.set(-0.52, worktopY, -0.02);
  benchGroup.add(sawGroup);

  // Cast-aluminum base & side material extension wings
  const sawBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.048, 24),
    castAluminumMat
  );
  sawBase.position.set(0, 0.024, 0);
  sawBase.castShadow = true;
  sawGroup.add(sawBase);

  for (const sideX of [-1, 1] as const) {
    const extWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.044, 0.16),
      castAluminumMat
    );
    extWing.position.set(sideX * 0.25, 0.022, 0.02);
    extWing.castShadow = true;
    sawGroup.add(extWing);
  }

  // Yellow kerf throat plate & front mitre lock arm with yellow DeWALT twist grip
  const kerfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.004, 0.34),
    dewaltYellowMat
  );
  kerfPlate.position.set(0, 0.049, -0.02);
  sawGroup.add(kerfPlate);

  const mitreArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.032, 0.16),
    castAluminumMat
  );
  mitreArm.position.set(0, 0.026, -0.22);
  sawGroup.add(mitreArm);

  const mitreLockKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.018, 0.055, 12),
    dewaltYellowMat
  );
  mitreLockKnob.rotation.x = Math.PI / 2;
  mitreLockKnob.position.set(0, 0.032, -0.31);
  sawGroup.add(mitreLockKnob);

  // Tall machined sliding fence with DeWALT yellow warning accents
  const fenceBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.078, 0.032),
    dewaltBlackMat
  );
  fenceBar.position.set(0, 0.086, 0.068);
  sawGroup.add(fenceBar);

  // Twin horizontal chrome slide rails + rear cast-iron bevel trunnion
  for (const rx of [-0.036, 0.036]) {
    const slideRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.36, 12),
      aluminumTrimMat
    );
    slideRod.rotation.x = Math.PI / 2;
    slideRod.position.set(rx, 0.175, 0.045);
    sawGroup.add(slideRod);
  }

  // 305mm Tungsten-Carbide Circular Saw Blade with DeWALT yellow arbor ring
  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.005, 28),
    aluminumTrimMat
  );
  sawBlade.rotation.z = Math.PI / 2;
  sawBlade.position.set(0, 0.2, -0.015);
  sawGroup.add(sawBlade);

  // Sculpted DeWALT Yellow & Matte-Black Upper Blade Guard with DeWALT Logo Badge
  const bladeGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.158, 0.158, 0.044, 24, 1, false, 0, Math.PI * 1.22),
    dewaltYellowMat
  );
  bladeGuard.rotation.z = Math.PI / 2;
  bladeGuard.position.set(0, 0.21, -0.015);
  bladeGuard.castShadow = true;
  sawGroup.add(bladeGuard);

  const sawBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.042),
    dewaltBadgeMat
  );
  sawBadge.rotation.y = -Math.PI / 2;
  sawBadge.position.set(-0.024, 0.24, -0.015);
  sawGroup.add(sawBadge);

  // DeWALT Yellow & Black Direct-Drive Motor Housing
  const sawMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.16, 18),
    dewaltYellowMat
  );
  sawMotor.rotation.z = Math.PI / 2;
  sawMotor.position.set(0.105, 0.245, -0.015);
  sawMotor.castShadow = true;
  sawGroup.add(sawMotor);

  const sawMotorEndCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.056, 0.045, 18),
    dewaltBlackMat
  );
  sawMotorEndCap.rotation.z = Math.PI / 2;
  sawMotorEndCap.position.set(0.195, 0.245, -0.015);
  sawGroup.add(sawMotorEndCap);

  // Ergonomic D-Handle with Yellow Trigger & Yellow DeWALT Dust Collection Bag
  const sawHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.038, 0.15),
    dewaltBlackMat
  );
  sawHandle.position.set(0.02, 0.33, -0.09);
  sawHandle.rotation.x = 0.32;
  sawGroup.add(sawHandle);

  const dustBag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.044, 0.16, 12),
    dewaltYellowMat
  );
  dustBag.rotation.x = -Math.PI * 0.38;
  dustBag.position.set(0, 0.27, 0.16);
  sawGroup.add(dustBag);

  // C. DeWALT DW752 Heavy-Duty Twin-Wheel Bench Grinder (`x = +0.16m, z = -0.06m`)
  const grinderGroup = new THREE.Group();
  grinderGroup.name = 'outbuildings.garage.toolBench.benchGrinder';
  grinderGroup.position.set(0.16, worktopY, -0.06);
  benchGroup.add(grinderGroup);

  const grinderPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.042, 0.15),
    dewaltBlackMat
  );
  grinderPedestal.position.set(0, 0.021, 0);
  grinderGroup.add(grinderPedestal);

  // Yellow/Black front toggle switch plate
  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.026, 0.012),
    dewaltYellowMat
  );
  switchPlate.position.set(0, 0.022, -0.078);
  grinderGroup.add(switchPlate);

  // DeWALT Yellow Induction Motor Barrel
  const grinderMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.17, 18),
    dewaltYellowMat
  );
  grinderMotor.rotation.z = Math.PI / 2;
  grinderMotor.position.set(0, 0.12, 0);
  grinderMotor.castShadow = true;
  grinderGroup.add(grinderMotor);

  const grinderBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.034),
    dewaltBadgeMat
  );
  grinderBadge.position.set(0, 0.125, -0.073);
  grinderGroup.add(grinderBadge);

  for (const sideX of [-1, 1] as const) {
    // Matte-black cast wheel guards with yellow outer hub accents
    const wheelGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.098, 0.044, 20),
      dewaltBlackMat
    );
    wheelGuard.rotation.z = Math.PI / 2;
    wheelGuard.position.set(sideX * 0.13, 0.12, 0);
    wheelGuard.castShadow = true;
    grinderGroup.add(wheelGuard);

    const abrasiveWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.028, 20),
      aluminumTrimMat
    );
    abrasiveWheel.rotation.z = Math.PI / 2;
    abrasiveWheel.position.set(sideX * 0.13, 0.12, -0.014);
    grinderGroup.add(abrasiveWheel);

    // Adjustable steel tool rest & transparent polycarbonate eye shield
    const toolRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.008, 0.045),
      aluminumTrimMat
    );
    toolRest.position.set(sideX * 0.13, 0.085, -0.095);
    grinderGroup.add(toolRest);

    const eyeShield = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.048, 0.006),
      clearShieldMat
    );
    eyeShield.rotation.x = -0.35;
    eyeShield.position.set(sideX * 0.13, 0.195, -0.085);
    grinderGroup.add(eyeShield);
  }

  // D. DeWALT DWE4257 125mm Angle Grinder & DeWALT DCW210 18V XR Random Orbit Sander (`x = +0.68m, z = -0.10m`)
  const grinderSanderGroup = new THREE.Group();
  grinderSanderGroup.name = 'outbuildings.garage.toolBench.angleGrinderAndSander';
  grinderSanderGroup.position.set(0.68, worktopY, -0.1);
  benchGroup.add(grinderSanderGroup);

  // 1) DeWALT DWE4257 125mm Angle Grinder
  const agUnit = new THREE.Group();
  agUnit.position.set(-0.1, 0, -0.04);
  agUnit.rotation.y = 0.42;
  grinderSanderGroup.add(agUnit);

  const agBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.03, 0.19, 14),
    dewaltYellowMat
  );
  agBody.rotation.z = Math.PI / 2;
  agBody.position.set(0, 0.046, 0);
  agBody.castShadow = true;
  agUnit.add(agBody);

  const agTailGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.024, 0.08, 14),
    dewaltBlackMat
  );
  agTailGrip.rotation.z = Math.PI / 2;
  agTailGrip.position.set(0.115, 0.046, 0);
  agUnit.add(agTailGrip);

  const agGearHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.052, 14),
    castAluminumMat
  );
  agGearHead.position.set(-0.105, 0.046, 0);
  agUnit.add(agGearHead);

  const agGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.018, 18, 1, false, 0, Math.PI * 1.1),
    dewaltBlackMat
  );
  agGuard.position.set(-0.105, 0.022, 0);
  agUnit.add(agGuard);

  const agDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.004, 20),
    anthraciteSteelMat
  );
  agDisc.position.set(-0.105, 0.018, 0);
  agUnit.add(agDisc);

  const agSideHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.11, 10),
    dewaltBlackMat
  );
  agSideHandle.rotation.x = Math.PI / 2;
  agSideHandle.position.set(-0.105, 0.046, -0.072);
  agUnit.add(agSideHandle);

  // 2) DeWALT DCW210 18V XR Brushless Random Orbit Palm Sander
  const sanderUnit = new THREE.Group();
  sanderUnit.position.set(0.13, 0, 0.05);
  sanderUnit.rotation.y = -0.28;
  grinderSanderGroup.add(sanderUnit);

  const sandingPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.014, 18),
    dewaltBlackMat
  );
  sandingPad.position.set(0, 0.007, 0);
  sanderUnit.add(sandingPad);

  const sanderHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.052, 0.088, 16),
    dewaltYellowMat
  );
  sanderHousing.position.set(0, 0.058, 0);
  sanderHousing.castShadow = true;
  sanderUnit.add(sanderHousing);

  const sanderPalmCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.043, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    dewaltBlackMat
  );
  sanderPalmCap.position.set(0, 0.098, 0);
  sanderUnit.add(sanderPalmCap);

  const sanderBattery = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.046, 0.085),
    dewaltYellowMat
  );
  sanderBattery.position.set(0, 0.052, 0.062);
  sanderUnit.add(sanderBattery);

  // E. DeWALT DCB132 Dual-Port 18V XR Charger + DeWALT DCD996 Hammer Drill, DCF887 Impact Driver & TSTAK Case (`x = +1.18m`)
  const drillsGroup = new THREE.Group();
  drillsGroup.name = 'outbuildings.garage.toolBench.cordlessDrills';
  drillsGroup.position.set(1.18, worktopY, -0.06);
  benchGroup.add(drillsGroup);

  // DeWALT TSTAK II Heavy-Duty Modular Tool Box Case at rear-right (`x = 0.14m, z = 0.15m`)
  const tstakCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.135, 0.22),
    dewaltBlackMat
  );
  tstakCase.position.set(0.12, 0.0675, 0.16);
  tstakCase.castShadow = true;
  drillsGroup.add(tstakCase);

  const tstakLidAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.016, 0.18),
    dewaltYellowMat
  );
  tstakLidAccent.position.set(0.12, 0.138, 0.16);
  drillsGroup.add(tstakLidAccent);

  const tstakBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.05),
    dewaltBadgeMat
  );
  tstakBadge.position.set(0.12, 0.072, 0.049);
  drillsGroup.add(tstakBadge);

  // DeWALT DCB132 Dual-Port XR Li-Ion Fast Charger Station (`x = -0.18m, z = 0.13m`)
  const chargerDock = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.058, 0.165),
    dewaltBlackMat
  );
  chargerDock.position.set(-0.18, 0.029, 0.13);
  chargerDock.castShadow = true;
  drillsGroup.add(chargerDock);

  const chargerYellowTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.014, 0.04),
    dewaltYellowMat
  );
  chargerYellowTrim.position.set(-0.18, 0.048, 0.065);
  drillsGroup.add(chargerYellowTrim);

  for (const bx of [-0.235, -0.125]) {
    // 18V XR 5.0Ah Li-Ion Battery Pack (Matte Black base + DeWALT Yellow top cap)
    const batteryBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.038, 0.112),
      dewaltBlackMat
    );
    batteryBase.position.set(bx, 0.068, 0.125);
    drillsGroup.add(batteryBase);

    const batteryCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.022, 0.108),
      dewaltYellowMat
    );
    batteryCap.position.set(bx, 0.096, 0.125);
    drillsGroup.add(batteryCap);

    const chargeLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.006, 0.008),
      greenLedMat
    );
    chargeLed.position.set(bx, 0.059, 0.052);
    drillsGroup.add(chargeLed);
  }

  // Standing DeWALT DCD996 18V XR Brushless Hammer Drill & DCF887 18V XR Impact Driver
  for (const [dx, dz, yaw, bodyLen, isHammerDrill] of [
    [-0.08, -0.08, -0.32, 0.185, true],
    [0.14, -0.06, -0.52, 0.135, false],
  ] as const) {
    const drillUnit = new THREE.Group();
    drillUnit.position.set(dx, 0, dz);
    drillUnit.rotation.y = yaw;
    drillsGroup.add(drillUnit);

    // 18V XR 5.0Ah Slide Battery Base (Black lower shell + DeWALT Yellow upper slide rail)
    const battBlack = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.036, 0.118),
      dewaltBlackMat
    );
    battBlack.position.set(0, 0.018, 0);
    battBlack.castShadow = true;
    drillUnit.add(battBlack);

    const battYellow = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.018, 0.114),
      dewaltYellowMat
    );
    battYellow.position.set(0, 0.045, 0);
    drillUnit.add(battYellow);

    // Contoured DeWALT Yellow & Black Overmoulded Pistol Grip
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.022, 0.13, 12),
      dewaltYellowMat
    );
    grip.position.set(0, 0.112, 0.01);
    grip.rotation.x = -0.18;
    grip.castShadow = true;
    drillUnit.add(grip);

    const gripRubber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.023, 0.085, 12),
      dewaltBlackMat
    );
    gripRubber.position.set(0, 0.112, 0.014);
    gripRubber.rotation.x = -0.18;
    drillUnit.add(gripRubber);

    // DeWALT Yellow Brushless Motor Clamshell Barrel with Black Rear Vent Cap
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, bodyLen, 16),
      dewaltYellowMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.192, -0.01);
    barrel.castShadow = true;
    drillUnit.add(barrel);

    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.028, 0.028, 16),
      dewaltBlackMat
    );
    rearCap.rotation.x = Math.PI / 2;
    rearCap.position.set(0, 0.192, -0.01 + bodyLen * 0.5 + 0.012);
    drillUnit.add(rearCap);

    // Metal Gearbox Nose & Chuck / Hex Collet
    const noseCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.032, 0.032, 14),
      castAluminumMat
    );
    noseCone.rotation.x = Math.PI / 2;
    noseCone.position.set(0, 0.192, -0.01 - bodyLen * 0.5 - 0.014);
    drillUnit.add(noseCone);

    const chuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.022, isHammerDrill ? 0.048 : 0.028, 12),
      dewaltBlackMat
    );
    chuck.rotation.x = Math.PI / 2;
    chuck.position.set(
      0,
      0.192,
      -0.01 - bodyLen * 0.5 - (isHammerDrill ? 0.048 : 0.036)
    );
    drillUnit.add(chuck);

    if (isHammerDrill) {
      // 360-degree side auxiliary handle on the DCD996 Hammer Drill
      const auxHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.011, 0.12, 10),
        dewaltBlackMat
      );
      auxHandle.rotation.z = Math.PI / 2;
      auxHandle.position.set(-0.075, 0.192, -0.01 - bodyLen * 0.5 - 0.012);
      drillUnit.add(auxHandle);
    }
  }

  // F. Organized Hand Tools on Pegboard (with DeWALT Yellow & Black accents)
  const pegZ = benchD * 0.5 - 0.038;
  for (let wIdx = 0; wIdx < 10; wIdx++) {
    const wx = -1.25 + wIdx * 0.056;
    const wLen = 0.12 + wIdx * 0.015;
    const wrench = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, wLen, 0.006),
      aluminumTrimMat
    );
    wrench.position.set(wx, worktopY + 0.36, pegZ);
    benchGroup.add(wrench);
  }
  for (let sIdx = 0; sIdx < 8; sIdx++) {
    const sx = -0.45 + sIdx * 0.054;
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.088, 10),
      sIdx % 2 === 0 ? dewaltYellowMat : dewaltBlackMat
    );
    handle.position.set(sx, worktopY + 0.42, pegZ);
    benchGroup.add(handle);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.105, 8),
      aluminumTrimMat
    );
    shaft.position.set(sx, worktopY + 0.33, pegZ);
    benchGroup.add(shaft);
  }
  const spiritLevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.05, 0.022),
    dewaltYellowMat
  );
  spiritLevel.position.set(0.74, worktopY + 0.45, pegZ);
  benchGroup.add(spiritLevel);
}

/**
 * Issue #8 ("Ladder here" at `[-3.459, 1.519, 19.056]`, `u = 18.68m, v = 4.43m, y = 1.519m`):
 * Builds a fixed angled Solid Oak & Forged Black-Steel Mezzanine Loft Access Ladder
 * (`outbuildings.barn.mezzanineLadder`) at `v = 4.66m`, rising from the Barn West Floor (`y = -0.34m`)
 * up to the front edge of the Barn Mezzanine (`u = 18.68m, y = 1.54m`), with twin upper safety grab handrails.
 */
export function buildBarnMezzanineLadder(
  groundGroup: THREE.Group,
  uMezzanineFront: number,
  barnWestFloorY: number,
  mezzanineFloorY: number,
  oakMat: THREE.Material,
  castIronMat: THREE.Material
): void {
  const ladderGroup = new THREE.Group();
  ladderGroup.name = 'outbuildings.barn.mezzanineLadder';
  const uFoot = uMezzanineFront - 0.78; // 17.90m (sits on the flat `barnWestFloorY = -0.34m` floor!)
  const uTop = uMezzanineFront + 0.02; // 18.70m
  const riseY = mezzanineFloorY - barnWestFloorY; // 1.88m
  const runU = uTop - uFoot; // 0.80m
  const stringerLen = Math.hypot(runU, riseY);
  const ladderPitch = Math.atan2(runU, riseY);
  const ladderWidthV = 0.54;

  ladderGroup.position.set(uFoot, barnWestFloorY, 4.66);
  groundGroup.add(ladderGroup);

  for (const sideV of [-1, 1] as const) {
    const vz = sideV * (ladderWidthV * 0.5);
    const stringer = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, stringerLen + 0.08, 0.036),
      oakMat
    );
    stringer.position.set(runU * 0.5, riseY * 0.5, vz);
    stringer.rotation.z = -ladderPitch;
    stringer.castShadow = true;
    stringer.receiveShadow = true;
    ladderGroup.add(stringer);

    const footShoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.04, 0.052),
      castIronMat
    );
    footShoe.position.set(0.02, 0.02, vz);
    ladderGroup.add(footShoe);

    const topBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.045, 0.05),
      castIronMat
    );
    topBracket.position.set(runU + 0.04, riseY - 0.02, vz);
    ladderGroup.add(topBracket);

    const grabPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.68, 12),
      castIronMat
    );
    grabPost.position.set(runU - 0.02, riseY + 0.32, vz);
    grabPost.castShadow = true;
    ladderGroup.add(grabPost);

    const grabReturn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12),
      castIronMat
    );
    grabReturn.rotation.z = Math.PI / 2;
    grabReturn.position.set(runU + 0.08, riseY + 0.65, vz);
    ladderGroup.add(grabReturn);

    const deckFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.66, 12),
      castIronMat
    );
    deckFlange.position.set(runU + 0.18, riseY + 0.33, vz);
    ladderGroup.add(deckFlange);
  }

  const numTreads = 8;
  for (let t = 1; t <= numTreads; t++) {
    const frac = t / (numTreads + 1);
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(0.105, 0.032, ladderWidthV - 0.036),
      oakMat
    );
    tread.position.set(frac * runU, frac * riseY, 0);
    tread.castShadow = true;
    tread.receiveShadow = true;
    ladderGroup.add(tread);
  }
}

/**
 * Issue #9 ("2.8m tall golf simulator here cut into the wall, 4m wide, backs into the store room") +
 * Issue #4 ("Cut a little deeper into the store room so there is at least 60cm clearance in front of the ladder"
 * at `[-7.986, 2.56, 15.704]`) +
 * Issue #5 ("Trackman looks like its blocking the projector" at `[-5.446, 2.563, 17.371]`):
 * Builds a Widescreen (`4.48m` wide x `2.80m` tall, `16:10` Widescreen aspect ratio) **TrackMan iO**
 * Indoor Golf Simulator Bay (`outbuildings.barn.golfSimulator`) cut into the Store/Barn cross-wall
 * (`u = 14.96..15.20m, v = 0.615..5.095m`) and backing **`2.16m`** into the Store room (`u = 13.04..15.20m`), complete with:
 * - Outer painted studwork enclosure housing in the Store room (`u = 13.04..14.96m`)
 * - Upholstered matte-black acoustic side & ceiling baffles lining the `2.16m` deep recessed bay
 * - Taut `4.48m x 2.80m` Widescreen HD Golf Impact Projection Screen (`outbuildings.barn.golfSimulator.screen`) at `u = 13.18m`
 * - Continuous artificial fairway & putting turf floor extending only to `x = +1.82m` (`u = 17.02m`), leaving
 *   **`0.88m` (`88cm`, exceeding the required `60cm`) of unobstructed stone floor clearance in front of the Mezzanine Ladder** (`u = 17.90m`)!
 * - Ceiling-Mounted 4K Short-Throw Laser Projector at `x = 0.28m, y = 2.74m` (`u = 15.48m`, ahead of the TrackMan iO)
 * - Ceiling-Mounted **TrackMan iO (Indoor Optimized)** overhead launch monitor at `x = 0.92m, y = 2.98m` (`u = 16.12m`,
 *   mounted behind and higher than the projector so it never blocks the projector's throw cone!).
 */
export function buildBarnGolfSimulator(
  groundGroup: THREE.Group,
  uWallMin: number, // 14.96m
  uWallMax: number, // 15.20m
  barnWestFloorY: number, // -0.34m
  plasterMat: THREE.Material
): void {
  const simGroup = new THREE.Group();
  simGroup.name = 'outbuildings.barn.golfSimulator';
  // Centered horizontally across the `5.15m` internal width of the Barn (`v = 0.28..5.43m`, center `v = 2.855m`),
  // spanning `v = 0.615..5.095m` (`4.48m` Widescreen width x `2.80m` height = 16:10 Widescreen!).
  simGroup.position.set(uWallMax, barnWestFloorY, 2.855);
  groundGroup.add(simGroup);

  const clearW = 4.48; // Widescreen 16:10 width (`4.48m` x `2.80m`)
  const clearH = 2.8; // 2.80m height (`y = -0.34..+2.46m`)
  const recessDepthU = 2.16; // Issue #4: Cuts 0.68m deeper into the Store room (`u = 13.04..15.20m`)
  const wallT = uWallMax - uWallMin; // 0.24m

  const acousticBaffleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    roughness: 0.92,
    metalness: 0.02,
  });
  const velvetFrameMat = new THREE.MeshStandardMaterial({
    color: 0x111316,
    roughness: 0.88,
    metalness: 0.04,
  });
  const fairwayTurfMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a32,
    roughness: 0.86,
    metalness: 0.02,
  });
  const hittingStripMat = new THREE.MeshStandardMaterial({
    color: 0x1f4e24,
    roughness: 0.9,
    metalness: 0.02,
  });
  const stanceSurroundMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.84,
    metalness: 0.04,
  });
  const screenTex = createTrackManWidescreenTexture();
  const impactScreenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissiveMap: screenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.44,
    roughness: 0.65,
    metalness: 0.02,
  });
  const projectorBodyMat = new THREE.MeshStandardMaterial({
    color: 0x212429,
    roughness: 0.34,
    metalness: 0.58,
  });
  const trackManOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6b00, // Signature TrackMan Orange
    emissive: new THREE.Color(0xff5500),
    emissiveIntensity: 0.25,
    roughness: 0.3,
    metalness: 0.2,
  });
  const golfBallMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.22,
    metalness: 0.05,
  });

  // 1. Exterior Painted Studwork Enclosure Box backing deeper into the Store Room (`x = -recessDepthU..-wallT`, i.e. `u = 13.04..14.96m`)
  const storeBoxDepth = recessDepthU - wallT; // 1.92m
  const storeBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, clearH + 0.1, clearW + 0.18),
    plasterMat
  );
  storeBackWall.userData.isArchitecturalShell = true;
  storeBackWall.position.set(-recessDepthU - 0.045, (clearH + 0.1) * 0.5, 0);
  storeBackWall.castShadow = true;
  storeBackWall.receiveShadow = true;
  simGroup.add(storeBackWall);

  for (const sideZ of [-1, 1] as const) {
    const storeSideWall = new THREE.Mesh(
      new THREE.BoxGeometry(storeBoxDepth, clearH + 0.1, 0.09),
      plasterMat
    );
    storeSideWall.userData.isArchitecturalShell = true;
    storeSideWall.position.set(
      -wallT - storeBoxDepth * 0.5,
      (clearH + 0.1) * 0.5,
      sideZ * (clearW * 0.5 + 0.045)
    );
    storeSideWall.castShadow = true;
    storeSideWall.receiveShadow = true;
    simGroup.add(storeSideWall);
  }

  const storeRoofLid = new THREE.Mesh(
    new THREE.BoxGeometry(storeBoxDepth + 0.09, 0.09, clearW + 0.18),
    plasterMat
  );
  storeRoofLid.userData.isArchitecturalShell = true;
  storeRoofLid.position.set(-wallT - (storeBoxDepth + 0.09) * 0.5, clearH + 0.055, 0);
  simGroup.add(storeRoofLid);

  // 2. Interior Padded Acoustic Baffle Walls & Ceiling inside the Deeper Recessed Simulator Tunnel (`x = -2.16..0`)
  const numBaffleCols = 6;
  const baffleColW = recessDepthU / numBaffleCols;
  for (let c = 0; c < numBaffleCols; c++) {
    const bx = -recessDepthU + (c + 0.5) * baffleColW;

    for (const sideZ of [-1, 1] as const) {
      const sideBaffle = new THREE.Mesh(
        new THREE.BoxGeometry(baffleColW - 0.015, clearH - 0.04, 0.055),
        acousticBaffleMat
      );
      sideBaffle.position.set(bx, clearH * 0.5, sideZ * (clearW * 0.5 - 0.028));
      sideBaffle.castShadow = true;
      sideBaffle.receiveShadow = true;
      simGroup.add(sideBaffle);
    }

    const ceilBaffle = new THREE.Mesh(
      new THREE.BoxGeometry(baffleColW - 0.015, 0.055, clearW - 0.08),
      acousticBaffleMat
    );
    ceilBaffle.position.set(bx, clearH - 0.028, 0);
    simGroup.add(ceilBaffle);
  }

  // Chamfered Black Velvet Perimeter Trim Frame flush with the Barn Wall (`x = 0`, `u = 15.20m`)
  const frameTrimW = 0.095;
  for (const sideZ of [-1, 1] as const) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, clearH + frameTrimW, frameTrimW),
      velvetFrameMat
    );
    sideTrim.position.set(0.01, (clearH + frameTrimW) * 0.5, sideZ * (clearW * 0.5 + frameTrimW * 0.3));
    simGroup.add(sideTrim);
  }
  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, frameTrimW, clearW + frameTrimW * 1.6),
    velvetFrameMat
  );
  topTrim.position.set(0.01, clearH + frameTrimW * 0.3, 0);
  simGroup.add(topTrim);

  // 3. `4.48m x 2.80m` Widescreen Taut HD Golf Impact Projection Screen (`outbuildings.barn.golfSimulator.screen`) at `x = -2.02m`
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(clearW - 0.1, clearH - 0.08),
    impactScreenMat
  );
  screenMesh.name = 'outbuildings.barn.golfSimulator.screen';
  screenMesh.rotation.y = Math.PI / 2;
  screenMesh.position.set(-recessDepthU + 0.14, clearH * 0.5, 0);
  simGroup.add(screenMesh);

  const screenBacking = new THREE.Mesh(
    new THREE.PlaneGeometry(clearW - 0.06, clearH - 0.04),
    velvetFrameMat
  );
  screenBacking.rotation.y = -Math.PI / 2;
  screenBacking.position.set(-recessDepthU + 0.12, clearH * 0.5, 0);
  simGroup.add(screenBacking);

  // 4. Issue #4: Continuous Artificial Golf Fairway Turf & Hitting Mat (`x = -2.04m..+1.82m`, `u = 13.16m..17.02m`)
  //    Leaves `0.88m` (`88cm` > `60cm`) of clear stone floor in front of the Mezzanine Ladder foot (`u = 17.90m`)!
  const turfStartX = -recessDepthU + 0.12; // -2.04m
  const turfEndX = 1.82; // u = 15.20 + 1.82 = 17.02m
  const totalTurfLenX = turfEndX - turfStartX; // 3.86m
  const turfCenterX = (turfStartX + turfEndX) * 0.5; // -0.11m

  const surroundBase = new THREE.Mesh(
    new THREE.BoxGeometry(totalTurfLenX + 0.08, 0.028, clearW),
    stanceSurroundMat
  );
  surroundBase.position.set(turfCenterX, 0.014, 0);
  surroundBase.receiveShadow = true;
  simGroup.add(surroundBase);

  const fairwayTurf = new THREE.Mesh(
    new THREE.BoxGeometry(totalTurfLenX, 0.034, clearW - 0.08),
    fairwayTurfMat
  );
  fairwayTurf.name = 'outbuildings.barn.golfSimulator.turfMat';
  fairwayTurf.position.set(turfCenterX, 0.017, 0);
  fairwayTurf.receiveShadow = true;
  simGroup.add(fairwayTurf);

  for (const [cupX, cupZ] of [
    [-0.35, -0.95],
    [-0.35, 0.95],
  ] as const) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.054, 0.036, 16),
      velvetFrameMat
    );
    cup.position.set(cupX, 0.019, cupZ);
    simGroup.add(cup);
  }

  // Heavy-Pile Hitting Strip (`0.36m x 1.04m`) at `x = +1.12m` (`3.14m` in front of the `x = -2.02m` screen)
  const hittingX = 1.12;
  const hittingStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.038, 1.04),
    hittingStripMat
  );
  hittingStrip.name = 'outbuildings.barn.golfSimulator.hittingStrip';
  hittingStrip.position.set(hittingX, 0.02, 0);
  hittingStrip.receiveShadow = true;
  simGroup.add(hittingStrip);

  const rubberTee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.016, 0.042, 10),
    golfBallMat
  );
  rubberTee.position.set(hittingX, 0.048, 0);
  simGroup.add(rubberTee);

  const teedBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.0213, 14, 12),
    golfBallMat
  );
  teedBall.position.set(hittingX, 0.088, 0);
  teedBall.castShadow = true;
  simGroup.add(teedBall);

  // Rubber golf ball tray (`x = +1.12m, z = -0.78m`)
  const ballTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.028, 0.42),
    stanceSurroundMat
  );
  ballTray.position.set(hittingX, 0.044, -0.78);
  simGroup.add(ballTray);

  for (let b = 0; b < 5; b++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.0213, 12, 10),
      golfBallMat
    );
    ball.position.set(hittingX, 0.068, -0.92 + b * 0.07);
    simGroup.add(ball);
  }

  // 5. Issue #5: Overhead Ceiling-Mounted 4K Widescreen Short-Throw Laser Projector (`x = 0.28m, y = 2.74m, z = 0.00m`)
  //    Mounted AHEAD of the TrackMan iO unit so its downward projection beam to the `x = -2.02m` screen is 100% unobstructed!
  const projectorGroup = new THREE.Group();
  projectorGroup.name = 'outbuildings.barn.golfSimulator.projector';
  projectorGroup.position.set(0.28, 2.74, 0);
  simGroup.add(projectorGroup);

  const dropPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1.68, 12),
    projectorBodyMat
  );
  dropPole.position.set(0, 0.84, 0);
  projectorGroup.add(dropPole);

  const projectorChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.14, 0.44),
    projectorBodyMat
  );
  projectorChassis.rotation.z = 0.18;
  projectorChassis.castShadow = true;
  projectorGroup.add(projectorChassis);

  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xe0f7fa,
    emissive: new THREE.Color(0x90caf9),
    emissiveIntensity: 1.8,
    roughness: 0.12,
  });
  const projectorLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.03, 16),
    lensMat
  );
  projectorLens.rotation.z = Math.PI / 2 + 0.18;
  projectorLens.position.set(-0.195, -0.025, 0);
  projectorGroup.add(projectorLens);

  // 6. Issue #5: Ceiling-Mounted **TrackMan iO (Indoor Optimized)** Overhead Launch Monitor (`outbuildings.barn.golfSimulator.trackmanIO`)
  //    Mounted BEHIND the projector and slightly higher (`x = 0.92m, y = 2.98m, z = 0.00m`), directly ahead of the `x = 1.12m` hitting tee,
  //    so it never blocks the projector's light cone!
  const tmGroup = new THREE.Group();
  tmGroup.name = 'outbuildings.barn.golfSimulator.trackmanIO';
  tmGroup.position.set(0.92, 2.98, 0);
  simGroup.add(tmGroup);

  // Ceiling suspension pole to vaulted ridge (`1.44m` tall)
  const tmDropTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.44, 12),
    projectorBodyMat
  );
  tmDropTube.position.set(0, 0.72, 0);
  tmGroup.add(tmDropTube);

  // Sleek aerodynamic TrackMan iO V-wing chassis (`0.28m` deep x `0.075m` high x `0.58m` wide)
  const tmCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.072, 0.34),
    projectorBodyMat
  );
  tmCore.rotation.z = -0.18; // Angled down toward the hitting tee at `x = 1.12m`
  tmCore.castShadow = true;
  tmGroup.add(tmCore);

  // Left & Right swept optical camera wings of the TrackMan iO
  for (const sideZ of [-1, 1] as const) {
    const tmWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.058, 0.16),
      projectorBodyMat
    );
    tmWing.position.set(0.01, -0.004, sideZ * 0.22);
    tmWing.rotation.z = -0.18;
    tmWing.rotation.y = -sideZ * 0.16;
    tmWing.castShadow = true;
    tmGroup.add(tmWing);

    // Dual infrared/high-speed optical camera windows on the underside of each wing
    const camGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14),
      velvetFrameMat
    );
    camGlass.position.set(0.02, -0.036, sideZ * 0.2);
    tmGroup.add(camGlass);
  }

  // Signature TrackMan Orange (`#ff6b00`) perimeter accent trim bar & front radar face
  const tmOrangeAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.268, 0.016, 0.56),
    trackManOrangeMat
  );
  tmOrangeAccent.position.set(0, 0.028, 0);
  tmOrangeAccent.rotation.z = -0.18;
  tmGroup.add(tmOrangeAccent);
}

