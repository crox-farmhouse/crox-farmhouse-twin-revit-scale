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
 * Issue #5 ("High qulality tool bench here with drawers and power rools" at `[-11.123, 0.378, 20.475]`,
 * `u = 10.92m, v = 5.18m`):
 * Builds a heavy-duty Modular Steel & Butcher-Block Workshop Tool Bench (`outbuildings.garage.toolBench`)
 * against the Garage South Wall (`u = 9.28..11.78m, v = 4.68..5.40m`), complete with 13 ball-bearing tool drawers,
 * perforated steel pegboard backwall, LED task light pelmet, engineer's bench vice, compound mitre saw,
 * twin-wheel bench grinder, cordless 18V drill/impact driver station, and organized hand tools.
 */
export function buildGarageWorkshopToolBench(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.garage.toolBench';
  benchGroup.position.set(10.53, garageFloorTopY, 5.04);
  groundGroup.add(benchGroup);

  const anthraciteSteelMat = new THREE.MeshStandardMaterial({
    color: 0x24282e,
    roughness: 0.38,
    metalness: 0.65,
  });
  const crimsonDrawerMat = new THREE.MeshStandardMaterial({
    color: 0x9e2424,
    roughness: 0.32,
    metalness: 0.48,
  });
  const aluminumTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d9df,
    roughness: 0.25,
    metalness: 0.88,
  });
  const butcherBlockMat = new THREE.MeshStandardMaterial({
    color: 0xb88652,
    roughness: 0.42,
    metalness: 0.03,
  });
  const viceCastIronMat = new THREE.MeshStandardMaterial({
    color: 0x2b3e50,
    roughness: 0.46,
    metalness: 0.72,
  });
  const powerToolTealMat = new THREE.MeshStandardMaterial({
    color: 0x006d77,
    roughness: 0.34,
    metalness: 0.22,
  });
  const powerToolYellowMat = new THREE.MeshStandardMaterial({
    color: 0xe6a800,
    roughness: 0.36,
    metalness: 0.18,
  });
  const rubberGripMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.82,
    metalness: 0.05,
  });

  const totalW = 2.48;
  const benchD = 0.72;
  const cabinetH = 0.86;
  const topT = 0.046;
  const worktopY = cabinetH + topT;

  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  carcass.position.set(0, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  benchGroup.add(carcass);

  for (const fx of [-totalW * 0.5 + 0.08, -0.4, 0.4, totalW * 0.5 - 0.08]) {
    for (const fz of [-benchD * 0.5 + 0.07, benchD * 0.5 - 0.07]) {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.034, 0.05, 12),
        aluminumTrimMat
      );
      foot.position.set(fx, 0.025, fz);
      benchGroup.add(foot);
    }
  }

  const bankSpecs = [
    {
      cx: -0.8,
      w: 0.76,
      drawerHeights: [0.08, 0.08, 0.1, 0.12, 0.15, 0.2] as const,
    },
    {
      cx: 0.0,
      w: 0.78,
      drawerHeights: [0.09, 0.11, 0.14, 0.18, 0.22] as const,
    },
    {
      cx: 0.8,
      w: 0.76,
      drawerHeights: [0.1, 0.14] as const,
    },
  ] as const;

  const frontZ = -benchD * 0.5 + 0.012;
  for (const bank of bankSpecs) {
    let cursorY = cabinetH - 0.025;
    for (let dIdx = 0; dIdx < bank.drawerHeights.length; dIdx++) {
      const dh = bank.drawerHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w, dh - 0.008, 0.02),
        crimsonDrawerMat
      );
      drawerFront.name = 'outbuildings.garage.toolBench.drawer';
      drawerFront.position.set(bank.cx, dy, frontZ);
      drawerFront.castShadow = true;
      benchGroup.add(drawerFront);

      const pullBar = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w - 0.04, 0.016, 0.026),
        aluminumTrimMat
      );
      pullBar.position.set(bank.cx, dy + dh * 0.5 - 0.016, frontZ - 0.012);
      benchGroup.add(pullBar);

      cursorY -= dh;
    }
  }

  for (const sideX of [-1, 1] as const) {
    const doorW = 0.374;
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, 0.49, 0.02),
      crimsonDrawerMat
    );
    doorPanel.position.set(0.8 + sideX * (doorW * 0.5 + 0.004), 0.325, frontZ);
    benchGroup.add(doorPanel);

    const vHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.14, 0.026),
      aluminumTrimMat
    );
    vHandle.position.set(0.8 + sideX * 0.032, 0.42, frontZ - 0.012);
    benchGroup.add(vHandle);
  }

  const butcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(totalW, topT, benchD),
    butcherBlockMat
  );
  butcherTop.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  butcherTop.position.set(0, cabinetH + topT * 0.5, 0);
  butcherTop.castShadow = true;
  butcherTop.receiveShadow = true;
  benchGroup.add(butcherTop);

  const pegboardH = 0.64;
  const pegboard = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, pegboardH, 0.024),
    anthraciteSteelMat
  );
  pegboard.name = 'outbuildings.garage.toolBench.pegboard';
  pegboard.position.set(0, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.02);
  benchGroup.add(pegboard);

  const powerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.062, 0.036),
    aluminumTrimMat
  );
  powerStrip.name = 'outbuildings.garage.toolBench.powerStrip';
  powerStrip.position.set(0.05, worktopY + 0.11, benchD * 0.5 - 0.045);
  benchGroup.add(powerStrip);

  for (let s = 0; s < 6; s++) {
    const sx = 0.05 - 0.22 + s * 0.088;
    const socketFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, 0.008),
      rubberGripMat
    );
    socketFace.position.set(sx, worktopY + 0.11, benchD * 0.5 - 0.065);
    benchGroup.add(socketFace);

    const redSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.018, 0.01),
      crimsonDrawerMat
    );
    redSwitch.position.set(sx + 0.016, worktopY + 0.12, benchD * 0.5 - 0.068);
    benchGroup.add(redSwitch);
  }

  const upperCabH = 0.33;
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

  for (const ux of [-0.8, 0.0, 0.8]) {
    const upperDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, upperCabH - 0.03, 0.018),
      crimsonDrawerMat
    );
    upperDoor.position.set(
      ux,
      worktopY + pegboardH + upperCabH * 0.5,
      benchD * 0.5 - upperCabD - 0.008
    );
    benchGroup.add(upperDoor);
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

  // A. Heavy Cast-Iron Engineer's Bench Vice (`x = -1.02m, z = -0.24m`)
  const viceGroup = new THREE.Group();
  viceGroup.name = 'outbuildings.garage.toolBench.vice';
  viceGroup.position.set(-1.02, worktopY, -0.24);
  benchGroup.add(viceGroup);

  const viceBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.095, 0.028, 16),
    viceCastIronMat
  );
  viceBase.position.set(0, 0.014, 0);
  viceGroup.add(viceBase);

  const fixedJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.14, 0.09),
    viceCastIronMat
  );
  fixedJaw.position.set(0, 0.09, 0.02);
  fixedJaw.castShadow = true;
  viceGroup.add(fixedJaw);

  const slidingJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.12, 0.075),
    viceCastIronMat
  );
  slidingJaw.position.set(0, 0.085, -0.085);
  slidingJaw.castShadow = true;
  viceGroup.add(slidingJaw);

  const viceSlideBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.048, 0.22),
    aluminumTrimMat
  );
  viceSlideBar.position.set(0, 0.065, -0.02);
  viceGroup.add(viceSlideBar);

  const leadScrewHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12),
    aluminumTrimMat
  );
  leadScrewHub.rotation.x = Math.PI / 2;
  leadScrewHub.position.set(0, 0.075, -0.145);
  viceGroup.add(leadScrewHub);

  const tommyBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 10),
    aluminumTrimMat
  );
  tommyBar.rotation.z = 0.45;
  tommyBar.position.set(0, 0.075, -0.165);
  viceGroup.add(tommyBar);

  // B. Sliding Compound Mitre Saw / Chop Saw (`x = -0.22m, z = -0.04m`)
  const sawGroup = new THREE.Group();
  sawGroup.name = 'outbuildings.garage.toolBench.mitreSaw';
  sawGroup.position.set(-0.22, worktopY, -0.04);
  benchGroup.add(sawGroup);

  const sawBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.23, 0.045, 20),
    aluminumTrimMat
  );
  sawBase.position.set(0, 0.0225, 0);
  sawBase.castShadow = true;
  sawGroup.add(sawBase);

  const fenceBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.065, 0.032),
    anthraciteSteelMat
  );
  fenceBar.position.set(0, 0.075, 0.06);
  sawGroup.add(fenceBar);

  for (const rx of [-0.032, 0.032]) {
    const slideRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.34, 12),
      aluminumTrimMat
    );
    slideRod.rotation.x = Math.PI / 2;
    slideRod.position.set(rx, 0.16, 0.05);
    sawGroup.add(slideRod);
  }

  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.125, 0.005, 24),
    aluminumTrimMat
  );
  sawBlade.rotation.z = Math.PI / 2;
  sawBlade.position.set(0, 0.185, -0.01);
  sawGroup.add(sawBlade);

  const bladeGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.138, 0.038, 20, 1, false, 0, Math.PI * 1.15),
    powerToolYellowMat
  );
  bladeGuard.rotation.z = Math.PI / 2;
  bladeGuard.position.set(0, 0.195, -0.01);
  bladeGuard.castShadow = true;
  sawGroup.add(bladeGuard);

  const sawMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.16, 16),
    powerToolTealMat
  );
  sawMotor.rotation.z = Math.PI / 2;
  sawMotor.position.set(0.1, 0.23, -0.01);
  sawMotor.castShadow = true;
  sawGroup.add(sawMotor);

  const sawHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.035, 0.14),
    rubberGripMat
  );
  sawHandle.position.set(0.02, 0.31, -0.08);
  sawHandle.rotation.x = 0.35;
  sawGroup.add(sawHandle);

  // C. Twin-Wheel Heavy-Duty Bench Grinder (`x = +0.46m, z = -0.04m`)
  const grinderGroup = new THREE.Group();
  grinderGroup.name = 'outbuildings.garage.toolBench.benchGrinder';
  grinderGroup.position.set(0.46, worktopY, -0.04);
  benchGroup.add(grinderGroup);

  const grinderPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.04, 0.14),
    viceCastIronMat
  );
  grinderPedestal.position.set(0, 0.02, 0);
  grinderGroup.add(grinderPedestal);

  const grinderMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.18, 16),
    viceCastIronMat
  );
  grinderMotor.rotation.z = Math.PI / 2;
  grinderMotor.position.set(0, 0.115, 0);
  grinderMotor.castShadow = true;
  grinderGroup.add(grinderMotor);

  for (const sideX of [-1, 1] as const) {
    const wheelGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.095, 0.042, 18),
      crimsonDrawerMat
    );
    wheelGuard.rotation.z = Math.PI / 2;
    wheelGuard.position.set(sideX * 0.125, 0.115, 0);
    wheelGuard.castShadow = true;
    grinderGroup.add(wheelGuard);

    const abrasiveWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.082, 0.026, 18),
      aluminumTrimMat
    );
    abrasiveWheel.rotation.z = Math.PI / 2;
    abrasiveWheel.position.set(sideX * 0.125, 0.115, -0.012);
    grinderGroup.add(abrasiveWheel);
  }

  // D. Cordless 18V Brushless Combi Drill, Impact Driver & Dual Li-Ion Charger Station (`x = +0.92m`)
  const drillsGroup = new THREE.Group();
  drillsGroup.name = 'outbuildings.garage.toolBench.cordlessDrills';
  drillsGroup.position.set(0.92, worktopY, -0.06);
  benchGroup.add(drillsGroup);

  const chargerDock = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.055, 0.16),
    rubberGripMat
  );
  chargerDock.position.set(-0.12, 0.0275, 0.12);
  chargerDock.castShadow = true;
  drillsGroup.add(chargerDock);

  for (const bx of [-0.17, -0.07]) {
    const batteryPack = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.052, 0.11),
      powerToolTealMat
    );
    batteryPack.position.set(bx, 0.068, 0.11);
    drillsGroup.add(batteryPack);
  }

  for (const [dx, dz, yaw, bodyLen] of [
    [0.06, -0.04, -0.35, 0.18],
    [0.21, 0.02, -0.55, 0.14],
  ] as const) {
    const drillUnit = new THREE.Group();
    drillUnit.position.set(dx, 0, dz);
    drillUnit.rotation.y = yaw;
    drillsGroup.add(drillUnit);

    const batt = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.048, 0.115),
      rubberGripMat
    );
    batt.position.set(0, 0.024, 0);
    batt.castShadow = true;
    drillUnit.add(batt);

    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.022, 0.13, 12),
      rubberGripMat
    );
    grip.position.set(0, 0.105, 0.01);
    grip.rotation.x = -0.2;
    grip.castShadow = true;
    drillUnit.add(grip);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, bodyLen, 14),
      powerToolTealMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.185, -0.01);
    barrel.castShadow = true;
    drillUnit.add(barrel);

    const chuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.024, 0.048, 12),
      aluminumTrimMat
    );
    chuck.rotation.x = Math.PI / 2;
    chuck.position.set(0, 0.185, -0.01 - bodyLen * 0.5 - 0.022);
    drillUnit.add(chuck);
  }

  // E. Hand Tools on Pegboard
  const pegZ = benchD * 0.5 - 0.038;
  for (let wIdx = 0; wIdx < 8; wIdx++) {
    const wx = -0.95 + wIdx * 0.055;
    const wLen = 0.13 + wIdx * 0.016;
    const wrench = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, wLen, 0.006),
      aluminumTrimMat
    );
    wrench.position.set(wx, worktopY + 0.36, pegZ);
    benchGroup.add(wrench);
  }
  for (let sIdx = 0; sIdx < 6; sIdx++) {
    const sx = -0.35 + sIdx * 0.052;
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.085, 10),
      sIdx % 2 === 0 ? crimsonDrawerMat : powerToolYellowMat
    );
    handle.position.set(sx, worktopY + 0.42, pegZ);
    benchGroup.add(handle);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.1, 8),
      aluminumTrimMat
    );
    shaft.position.set(sx, worktopY + 0.33, pegZ);
    benchGroup.add(shaft);
  }
  const spiritLevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.048, 0.022),
    powerToolYellowMat
  );
  spiritLevel.position.set(0.62, worktopY + 0.45, pegZ);
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
 * Issue #9 ("2.8m tall golf simulator here cut into the wall, 4m wide, backs into the store room"
 * at `[-7.044, 1.391, 17.979]`) + User follow-up ("its a trackman io, i want a widescreen one, so make of that what you will"):
 * Builds a Widescreen (`4.48m` wide x `2.80m` tall, `16:10` Widescreen aspect ratio) **TrackMan iO**
 * Indoor Golf Simulator Bay (`outbuildings.barn.golfSimulator`) cut into the Store/Barn cross-wall
 * (`u = 14.96..15.20m, v = 0.615..5.095m`) and backing `1.48m` into the Store room (`u = 13.72..14.96m`), complete with:
 * - Outer painted studwork enclosure housing in the Store room (`u = 13.72..14.96m`)
 * - Upholstered matte-black acoustic side & ceiling baffles lining the `1.48m` deep recessed bay
 * - Taut `4.48m x 2.80m` Widescreen HD Golf Impact Projection Screen (`outbuildings.barn.golfSimulator.screen`)
 *   displaying TrackMan Virtual Golf 3 (VG3) with signature TrackMan Orange (`#ff6b00`) telemetry & shot tracer
 * - Ceiling-Mounted **TrackMan iO (Indoor Optimized)** overhead optical/radar/infrared launch monitor pod
 *   (sleek matte-black & TrackMan Orange angled V-wing overhead sensor unit mounted directly above the hitting zone,
 *   leaving the floor 100% clear of any floor launch monitor boxes!)
 * - Ceiling-Mounted 4K Short-Throw Laser Projector behind the TrackMan iO unit
 * - Continuous artificial fairway & putting turf floor + dark-green stance/hitting mat extending into the Barn.
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
  const recessDepthU = 1.48; // Backs from `u = 15.20m` to `u = 13.72m` inside the Store room
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

  // 1. Exterior Painted Studwork Enclosure Box backing into the Store Room (`x = -recessDepthU..-wallT`, i.e. `u = 13.72..14.96m`)
  const storeBoxDepth = recessDepthU - wallT; // 1.24m
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

  // 2. Interior Padded Acoustic Baffle Walls & Ceiling inside the Recessed Simulator Tunnel (`x = -recessDepthU..0`)
  const numBaffleCols = 4;
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

  // 3. `4.48m x 2.80m` Widescreen Taut HD Golf Impact Projection Screen (`outbuildings.barn.golfSimulator.screen`)
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

  // 4. Continuous Artificial Golf Fairway Turf & Hitting Mat (`x = -1.34m..+2.85m`, `4.48m` wide)
  const totalTurfLenX = recessDepthU - 0.12 + 2.85;
  const turfCenterX = (-recessDepthU + 0.12 + 2.85) * 0.5;

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
    [0.55, -0.95],
    [0.55, 0.95],
  ] as const) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.054, 0.036, 16),
      velvetFrameMat
    );
    cup.position.set(cupX, 0.019, cupZ);
    simGroup.add(cup);
  }

  // Heavy-Pile Hitting Strip (`0.36m x 1.04m`) at `x = +2.05m`
  const hittingStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.038, 1.04),
    hittingStripMat
  );
  hittingStrip.name = 'outbuildings.barn.golfSimulator.hittingStrip';
  hittingStrip.position.set(2.05, 0.02, 0);
  hittingStrip.receiveShadow = true;
  simGroup.add(hittingStrip);

  const rubberTee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.016, 0.042, 10),
    golfBallMat
  );
  rubberTee.position.set(2.05, 0.048, 0);
  simGroup.add(rubberTee);

  const teedBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.0213, 14, 12),
    golfBallMat
  );
  teedBall.position.set(2.05, 0.088, 0);
  teedBall.castShadow = true;
  simGroup.add(teedBall);

  // Rubber golf ball tray (`x = 2.05m, z = -0.78m`)
  const ballTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.028, 0.42),
    stanceSurroundMat
  );
  ballTray.position.set(2.05, 0.044, -0.78);
  simGroup.add(ballTray);

  for (let b = 0; b < 5; b++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.0213, 12, 10),
      golfBallMat
    );
    ball.position.set(2.05, 0.068, -0.92 + b * 0.07);
    simGroup.add(ball);
  }

  // 5. Ceiling-Mounted **TrackMan iO (Indoor Optimized)** Overhead Launch Monitor (`outbuildings.barn.golfSimulator.trackmanIO`)
  //    Mounted directly above & slightly ahead of the hitting zone (`x = 1.68m, y = 2.86m, z = 0.00m`)!
  const tmGroup = new THREE.Group();
  tmGroup.name = 'outbuildings.barn.golfSimulator.trackmanIO';
  tmGroup.position.set(1.68, 2.86, 0);
  simGroup.add(tmGroup);

  // Ceiling suspension pole to vaulted ridge
  const tmDropTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.56, 12),
    projectorBodyMat
  );
  tmDropTube.position.set(0, 0.78, 0);
  tmGroup.add(tmDropTube);

  // Sleek aerodynamic TrackMan iO V-wing chassis (`0.28m` deep x `0.075m` high x `0.58m` wide)
  const tmCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.072, 0.34),
    projectorBodyMat
  );
  tmCore.rotation.z = -0.18; // Angled down toward the hitting tee at `x = 2.05m`
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

  // 6. Overhead Ceiling-Mounted 4K Widescreen Short-Throw Laser Projector (`x = 2.38m, y = 2.98m, z = 0.00m`)
  const projectorGroup = new THREE.Group();
  projectorGroup.name = 'outbuildings.barn.golfSimulator.projector';
  projectorGroup.position.set(2.38, 2.98, 0);
  simGroup.add(projectorGroup);

  const dropPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1.48, 12),
    projectorBodyMat
  );
  dropPole.position.set(0, 0.74, 0);
  projectorGroup.add(dropPole);

  const projectorChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.14, 0.44),
    projectorBodyMat
  );
  projectorChassis.rotation.z = 0.16;
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
  projectorLens.rotation.z = Math.PI / 2 + 0.16;
  projectorLens.position.set(-0.195, -0.025, 0);
  projectorGroup.add(projectorLens);
}
