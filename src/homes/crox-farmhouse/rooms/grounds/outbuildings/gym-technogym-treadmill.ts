import * as THREE from 'three';
import type { SceneInteractionManager } from '../../../../../engine/interaction/interaction-manager.ts';
import { GymTreadmillRunController } from '../../../../../objects/gym/treadmill-run-interaction.ts';

/**
 * Generates the metallic silver & charcoal `TECHNOGYM` brand badge texture
 * for the Run Personal side rails and front motor cover hood.
 */
let cachedTechnogymBadgeTexture: THREE.CanvasTexture | null = null;

export function createTechnogymBadgeTexture(): THREE.CanvasTexture {
  if (cachedTechnogymBadgeTexture) {
    return cachedTechnogymBadgeTexture;
  }
  const w = 256;
  const h = 80;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d8dde4';
  ctx.beginPath();
  ctx.roundRect(6, 10, w - 12, h - 20, 8);
  ctx.fill();

  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  ctx.roundRect(12, 16, w - 24, h - 32, 5);
  ctx.fill();

  ctx.fillStyle = '#eef2f7';
  ctx.font = '900 28px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TECHNOGYM', w * 0.5, h * 0.5 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedTechnogymBadgeTexture = tex;
  return tex;
}

/**
 * Generates the textured elastomer running belt texture (`512x1024`) for the Technogym Run Personal,
 * including fine diamond-grip micro-weave and the two horizontal silver/white segmented pace-marker
 * stripes near the rear of the running surface (`media_1791211838942_1b3a987a.png`).
 */
export function createTechnogymBeltTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#24272c';
  ctx.fillRect(0, 0, w, h);

  // Subtle longitudinal track wear sheen down the center of the belt
  const trackGrad = ctx.createLinearGradient(0, 0, w, 0);
  trackGrad.addColorStop(0, 'rgba(15, 17, 20, 0.35)');
  trackGrad.addColorStop(0.2, 'rgba(48, 53, 60, 0.12)');
  trackGrad.addColorStop(0.5, 'rgba(62, 68, 76, 0.18)');
  trackGrad.addColorStop(0.8, 'rgba(48, 53, 60, 0.12)');
  trackGrad.addColorStop(1, 'rgba(15, 17, 20, 0.35)');
  ctx.fillStyle = trackGrad;
  ctx.fillRect(0, 0, w, h);

  // Fine high-grip elastomer diamond micro-texture
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const n = Math.sin(x * 17.3 + y * 31.7) * 43758.5453;
      const f = n - Math.floor(n);
      ctx.fillStyle = f > 0.5 ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Signature twin horizontal segmented silver-grey pace marker bands near rear of belt
  const segXs = [
    [68, 34],
    [118, 58],
    [194, 124],
    [336, 58],
    [410, 34],
  ] as const;
  for (const bandY of [718, 756] as const) {
    ctx.fillStyle = '#b8bec7';
    for (const [sx, sw] of segXs) {
      ctx.fillRect(sx, bandY, sw, 14);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Generates the 21.5" Full-HD Technogym Live touchscreen UI texture (`1024x640`)
 * matching `media_1791211838942_1b3a987a.png`:
 * - Dark tempered-glass bezel frame with top status header
 * - 2x3 grid of Technogym Live workout tiles (Yellow Studio Session, Dark Routines,
 *   Alpine Mountain Outdoor Trail, Bright Coach Studio, Red Canyon HIIT, Custom Metrics)
 * - Prominent emerald-green `START` button centered at the bottom.
 */
let cachedTechnogymLiveScreenTexture: THREE.CanvasTexture | null = null;

export function createTechnogymLiveScreenTexture(): THREE.CanvasTexture {
  if (cachedTechnogymLiveScreenTexture) {
    return cachedTechnogymLiveScreenTexture;
  }
  const w = 1024;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Tempered black glass outer bezel
  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, w, h);

  // Inner active LCD viewport (`x = 56..968, y = 44..596`)
  const vx = 56;
  const vy = 44;
  const vw = w - 112;
  const vh = h - 88;
  ctx.fillStyle = '#20242b';
  ctx.beginPath();
  ctx.roundRect(vx, vy, vw, vh, 10);
  ctx.fill();

  // Top status bar
  ctx.fillStyle = '#9aa3b0';
  ctx.font = '700 18px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TECHNOGYM LIVE', vx + 24, vy + 32);

  // Top-right user profile & connectivity icons
  ctx.fillStyle = '#d5dce6';
  ctx.beginPath();
  ctx.arc(vx + vw - 38, vy + 26, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20242b';
  ctx.font = '700 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AM', vx + vw - 38, vy + 31);

  // 2x3 Workout Tile Grid
  const gridX = vx + 24;
  const gridY = vy + 52;
  const colW = 278;
  const rowH = 192;
  const gap = 16;

  // Tile (0, 0): Golden Studio Trainer Session
  {
    const tx = gridX;
    const ty = gridY;
    const g = ctx.createLinearGradient(tx, ty, tx + colW, ty + rowH);
    g.addColorStop(0, '#c89b28');
    g.addColorStop(0.6, '#eab938');
    g.addColorStop(1, '#8c6514');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    // Trainer figure silhouette
    ctx.fillStyle = '#1f232a';
    ctx.beginPath();
    ctx.arc(tx + colW * 0.62, ty + 68, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(tx + colW * 0.48, ty + 94, 76, 86, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SESSIONS', tx + 18, ty + rowH - 22);
  }

  // Tile (1, 0): Dark Charcoal Routines Card
  {
    const tx = gridX + colW + gap;
    const ty = gridY;
    const g = ctx.createLinearGradient(tx, ty, tx, ty + rowH);
    g.addColorStop(0, '#323842');
    g.addColorStop(1, '#1d2127');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    ctx.strokeStyle = '#f5c400';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(tx + colW * 0.5, ty + 82, 36, -Math.PI * 0.4, Math.PI * 1.25);
    ctx.stroke();

    ctx.fillStyle = '#eef2f6';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROUTINES', tx + colW * 0.5, ty + rowH - 22);
  }

  // Tile (2, 0): Alpine Mountain Outdoor Landscape
  {
    const tx = gridX + (colW + gap) * 2;
    const ty = gridY;
    const sky = ctx.createLinearGradient(tx, ty, tx, ty + rowH);
    sky.addColorStop(0, '#1e88e5');
    sky.addColorStop(0.55, '#81d4fa');
    sky.addColorStop(0.56, '#2e6b4e');
    sky.addColorStop(1, '#1b4332');
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    // Snow-capped mountain peaks
    ctx.fillStyle = '#e8f1f8';
    ctx.beginPath();
    ctx.moveTo(tx + 24, ty + 115);
    ctx.lineTo(tx + 96, ty + 42);
    ctx.lineTo(tx + 158, ty + 98);
    ctx.lineTo(tx + 212, ty + 52);
    ctx.lineTo(tx + colW - 16, ty + 115);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('OUTDOORS', tx + 18, ty + rowH - 22);
  }

  // Tile (0, 1): Bright Studio Card
  {
    const tx = gridX;
    const ty = gridY + rowH + gap;
    const g = ctx.createLinearGradient(tx, ty, tx + colW, ty + rowH);
    g.addColorStop(0, '#e8ecf2');
    g.addColorStop(1, '#b8c2d0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    ctx.fillStyle = '#252a32';
    ctx.beginPath();
    ctx.arc(tx + 88, ty + 76, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(tx + 68, ty + 102, 42, 64);

    ctx.fillStyle = '#181c22';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COACH', tx + 18, ty + rowH - 22);
  }

  // Tile (1, 1): Terracotta / Coral HIIT Canyon Card
  {
    const tx = gridX + colW + gap;
    const ty = gridY + rowH + gap;
    const g = ctx.createLinearGradient(tx, ty, tx + colW, ty + rowH);
    g.addColorStop(0, '#e06d53');
    g.addColorStop(0.5, '#c84b31');
    g.addColorStop(1, '#7a2818');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('INTENSITY', tx + 18, ty + rowH - 22);
  }

  // Tile (2, 1): 2x2 Custom Metric Target Buttons
  {
    const tx = gridX + (colW + gap) * 2;
    const ty = gridY + rowH + gap;
    const subW = (colW - 12) * 0.5;
    const subH = (rowH - 12) * 0.5;
    const labels = ['TIME', 'DIST', 'KCAL', 'BPM'] as const;
    const colors = ['#4fc3f7', '#ffb74d', '#81c784', '#e57373'] as const;
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = tx + col * (subW + 12);
      const by = ty + row * (subH + 12);
      ctx.fillStyle = '#2b3038';
      ctx.beginPath();
      ctx.roundRect(bx, by, subW, subH, 6);
      ctx.fill();

      ctx.strokeStyle = colors[i]!;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx + 32, by + subH * 0.5, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#dce2ea';
      ctx.font = '700 16px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[i]!, bx + 56, by + subH * 0.5 + 6);
    }
  }

  // Bottom bar with signature emerald-green `START` button (`media_1791211838942_1b3a987a.png`)
  const btnW = 168;
  const btnH = 54;
  const btnX = (w - btnW) * 0.5;
  const btnY = vy + vh - 68;
  ctx.fillStyle = '#22b55b';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START', w * 0.5, btnY + btnH * 0.5 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedTechnogymLiveScreenTexture = tex;
  return tex;
}

/**
 * Builds the **Technogym Run Personal** treadmill (designed by Antonio Citterio) in the GYM
 * (`outbuildings.gym.technogymRunPersonal`), matching the uploaded reference photo
 * (`media_1791211838942_1b3a987a.png`):
 * - Dimensions: `2.01m` long (`z = -1.005..+1.005m`) x `0.80m` wide (`x = -0.40..+0.40m`) x `1.47m` high (`y = 0..1.47m`)
 * - Matte charcoal side foot rails with non-slip ribbed tread inlays, rounded rear roller caps, and `TECHNOGYM` badges
 * - `1.45m x 0.51m` elastomer running belt with silver segmented pace-marker stripes
 * - Sculpted two-tone front motor hood with flush silver `TECHNOGYM` badge
 * - Iconic mirror-polished cast-aluminium triangular A-frame side uprights (`ExtrudeGeometry` with triangular `.holes` window)
 *   rising seamlessly into the tilted 21.5" console side cheeks
 * - Closed-loop soft-touch black ergonomic side handrails + polished chrome front heart-rate crossbar, dual bottle holders,
 *   and red emergency safety key clip
 * - 21.5" Full-HD tempered-glass **Technogym Live** touchscreen console.
 */
export function buildGymTechnogymRunPersonal(
  groundGroup: THREE.Group,
  gymFloorY: number,
  interactions?: SceneInteractionManager
): GymTreadmillRunController | null {
  const runGroup = new THREE.Group();
  runGroup.name = 'outbuildings.gym.technogymRunPersonal';
  runGroup.userData.zone = 'courtyard';
  // Placed in the GYM (`u = 3.10m, v = 3.55m`) facing East (`+u`, `rotation.y = Math.PI / 2`)
  // toward the panoramic 3.40m Garage viewing window so the runner looks straight through to the Porsche 992.2 Turbo S!
  // Issue #6 ("Move this clloser to the wall and slightly to the right to make getting to toilet easier"
  // at `[-18.144, -0.392, 19.851]`, `outbuildings.gym.technogymRunPersonal.runningBelt`):
  // Moved closer to the South wall (`v = 4.32m`, tucking the front nose near `v = 5.30m`) and slightly to the right/West
  // (`u = 3.68m`), opening a wide, unobstructed 1.80m walkway to the Gym-to-Shower/Toilet Room door!
  runGroup.position.set(3.70, gymFloorY, 4.305);
  runGroup.rotation.y = -0.0015;
  groundGroup.add(runGroup);

  const matteCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x1e2126,
    roughness: 0.44,
    metalness: 0.18,
  });
  const darkAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e35,
    roughness: 0.36,
    metalness: 0.32,
  });
  const nonSlipRubberMat = new THREE.MeshStandardMaterial({
    color: 0x15171b,
    roughness: 0.78,
    metalness: 0.06,
  });
  const softTouchGripMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e23,
    roughness: 0.56,
    metalness: 0.1,
  });
  const polishedCastAluMat = new THREE.MeshStandardMaterial({
    color: 0xf2f6fa,
    roughness: 0.07,
    metalness: 0.96,
  });
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd0d6de,
    roughness: 0.24,
    metalness: 0.88,
  });
  const emergencyRedMat = new THREE.MeshStandardMaterial({
    color: 0xe52420,
    roughness: 0.3,
    metalness: 0.1,
  });
  const beltTexture = createTechnogymBeltTexture();
  const runningBeltMat = new THREE.MeshStandardMaterial({
    map: beltTexture,
    roughness: 0.68,
    metalness: 0.06,
  });
  const technogymBadgeMat = new THREE.MeshStandardMaterial({
    map: createTechnogymBadgeTexture(),
    roughness: 0.25,
    metalness: 0.75,
  });
  const screenDisplayMat = new THREE.MeshStandardMaterial({
    map: createTechnogymLiveScreenTexture(),
    emissive: new THREE.Color(0xffffff),
    emissiveMap: createTechnogymLiveScreenTexture(),
    emissiveIntensity: 0.32,
    roughness: 0.12,
    metalness: 0.15,
  });
  const darkBezelGlassMat = new THREE.MeshStandardMaterial({
    color: 0x101318,
    roughness: 0.08,
    metalness: 0.35,
  });

  // ---------------------------------------------------------------------------
  // 1. Base Sub-Frame, Rear Adjustable Leveling Feet & Front Transport Wheels
  // ---------------------------------------------------------------------------
  const subFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.075, 1.72),
    nonSlipRubberMat
  );
  subFrame.name = 'outbuildings.gym.technogymRunPersonal.subFrame';
  subFrame.position.set(0, 0.078, -0.02);
  subFrame.castShadow = true;
  subFrame.receiveShadow = true;
  runGroup.add(subFrame);

  // Rear leveling feet (`z = -0.60m, x = ±0.30m`) visible beneath the side rails in the reference photo
  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const footPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.048, 0.016, 18),
      nonSlipRubberMat
    );
    footPad.name = `outbuildings.gym.technogymRunPersonal.rearLevelingFootPad.${sideTag}`;
    footPad.userData.lodTier = 'high';
    footPad.userData.lodMaxDistance = 12;
    footPad.position.set(sideX * 0.3, 0.008, -0.6);
    runGroup.add(footPad);

    const footStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.055, 12),
      matteCharcoalMat
    );
    footStem.name = `outbuildings.gym.technogymRunPersonal.rearLevelingFootStem.${sideTag}`;
    footStem.userData.lodTier = 'high';
    footStem.userData.lodMaxDistance = 12;
    footStem.position.set(sideX * 0.3, 0.04, -0.6);
    runGroup.add(footStem);

    // Front transport roller wheel (`z = +0.84m, x = ±0.325m`)
    const frontWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.026, 16),
      nonSlipRubberMat
    );
    frontWheel.name = `outbuildings.gym.technogymRunPersonal.frontTransportWheel.${sideTag}`;
    frontWheel.userData.lodTier = 'high';
    frontWheel.userData.lodMaxDistance = 12;
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(sideX * 0.325, 0.034, 0.84);
    runGroup.add(frontWheel);

    const wheelAxlePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.032, 10),
      brushedSteelMat
    );
    wheelAxlePin.name = `outbuildings.gym.technogymRunPersonal.wheelAxlePin.${sideTag}`;
    wheelAxlePin.userData.lodTier = 'high';
    wheelAxlePin.userData.lodMaxDistance = 12;
    wheelAxlePin.rotation.z = Math.PI / 2;
    wheelAxlePin.position.set(sideX * 0.325, 0.034, 0.84);
    runGroup.add(wheelAxlePin);
  }

  // ---------------------------------------------------------------------------
  // 2. Running Belt (`0.51m x 1.45m`) & Front/Rear Crowned Steel Rollers
  // ---------------------------------------------------------------------------
  const beltDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.088, 1.44),
    runningBeltMat
  );
  beltDeck.name = 'outbuildings.gym.technogymRunPersonal.runningBelt';
  beltDeck.position.set(0, 0.152, -0.24);
  beltDeck.castShadow = true;
  beltDeck.receiveShadow = true;
  runGroup.add(beltDeck);

  let rearRoller!: THREE.Mesh;
  let frontRoller!: THREE.Mesh;
  for (const rz of [-0.955, 0.475] as const) {
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.043, 0.043, 0.518, 20),
      runningBeltMat
    );
    roller.name = `outbuildings.gym.technogymRunPersonal.beltRoller.${rz < 0 ? 'rear' : 'front'}`;
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.152, rz);
    runGroup.add(roller);
    if (rz < 0) {
      rearRoller = roller;
    } else {
      frontRoller = roller;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Left & Right Sculpted Side Foot Rails, Non-Slip Treads & `TECHNOGYM` Badges
  // ---------------------------------------------------------------------------
  const railW = 0.132;
  const railX = 0.332; // Outer edge at `0.332 + 0.066 = 0.398m` (`0.796m` total deck width)

  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const sx = sideX * railX;

    // Main side rail beam (`z = -0.94..+0.46m, y = 0.065..0.214m`)
    const sideRail = new THREE.Mesh(
      new THREE.BoxGeometry(railW, 0.148, 1.4),
      matteCharcoalMat
    );
    sideRail.name = 'outbuildings.gym.technogymRunPersonal.sideRail';
    sideRail.position.set(sx, 0.14, -0.24);
    sideRail.castShadow = true;
    sideRail.receiveShadow = true;
    runGroup.add(sideRail);

    // Rounded rear end-cap wrapping `-z` end (`z = -0.94m`)
    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.074, 0.074, railW, 20),
      darkAnthraciteMat
    );
    rearCap.name = `outbuildings.gym.technogymRunPersonal.sideRailRearCap.${sideTag}`;
    rearCap.rotation.z = Math.PI / 2;
    rearCap.position.set(sx, 0.14, -0.94);
    rearCap.castShadow = true;
    runGroup.add(rearCap);

    // 2 recessed black socket bolts on the outer rear end-cap face (matching photo)
    let boltIdx = 0;
    for (const bz of [-0.96, -0.92] as const) {
      boltIdx++;
      const capBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10),
        nonSlipRubberMat
      );
      capBolt.name = `outbuildings.gym.technogymRunPersonal.sideRailRearBolt.${sideTag}.${boltIdx}`;
      capBolt.userData.lodTier = 'high';
      capBolt.userData.lodMaxDistance = 12;
      capBolt.rotation.z = Math.PI / 2;
      capBolt.position.set(sx + sideX * (railW * 0.5 + 0.001), 0.135, bz);
      runGroup.add(capBolt);
    }

    // Textured non-slip rubber foot strip along the top of the side rail (`z = -0.82..+0.36m`)
    const treadStrip = new THREE.Mesh(
      new THREE.BoxGeometry(railW - 0.022, 0.008, 1.18),
      nonSlipRubberMat
    );
    treadStrip.name = `outbuildings.gym.technogymRunPersonal.sideRailTreadStrip.${sideTag}`;
    treadStrip.position.set(sx, 0.216, -0.23);
    runGroup.add(treadStrip);

    // Longitudinal grip ribs on the foot tread
    let ribIdx = 0;
    for (const ribOffset of [-0.036, -0.018, 0, 0.018, 0.036] as const) {
      ribIdx++;
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.004, 1.14),
        matteCharcoalMat
      );
      rib.name = `outbuildings.gym.technogymRunPersonal.sideRailGripRib.${sideTag}.${ribIdx}`;
      rib.userData.lodTier = 'high';
      rib.userData.lodMaxDistance = 12;
      rib.position.set(sx + ribOffset, 0.221, -0.23);
      runGroup.add(rib);
    }

    // `TECHNOGYM` Side Rail Badge (`z = -0.68m, y = 0.138m`)
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.042, 0.138),
      technogymBadgeMat
    );
    badge.name = `outbuildings.gym.technogymRunPersonal.sideRailBadge.${sideTag}`;
    badge.userData.lodTier = 'high';
    badge.userData.lodMaxDistance = 12;
    badge.position.set(sx + sideX * (railW * 0.5 + 0.001), 0.138, -0.68);
    if (sideX < 0) {
      badge.rotation.y = Math.PI;
    }
    runGroup.add(badge);
  }

  // ---------------------------------------------------------------------------
  // 4. Sculpted Two-Tone Front Motor Shroud Hood (`z = +0.46..+0.99m`)
  // ---------------------------------------------------------------------------
  const motorBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.792, 0.135, 0.52),
    matteCharcoalMat
  );
  motorBase.name = 'outbuildings.gym.technogymRunPersonal.motorHood';
  motorBase.position.set(0, 0.145, 0.72);
  motorBase.castShadow = true;
  motorBase.receiveShadow = true;
  runGroup.add(motorBase);

  // Rounded front bumper nose at `z = +0.98m`
  const frontNose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.048, 0.79, 18),
    matteCharcoalMat
  );
  frontNose.name = 'outbuildings.gym.technogymRunPersonal.motorHoodFrontNose';
  frontNose.rotation.z = Math.PI / 2;
  frontNose.position.set(0, 0.165, 0.975);
  runGroup.add(frontNose);

  // Sloped satin-anthracite upper motor deck lid (`z = +0.45..+0.95m, y = 0.21..0.265m`)
  const motorUpperCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.048, 0.49),
    darkAnthraciteMat
  );
  motorUpperCover.name = 'outbuildings.gym.technogymRunPersonal.motorHood';
  motorUpperCover.position.set(0, 0.228, 0.705);
  motorUpperCover.rotation.x = 0.055;
  motorUpperCover.castShadow = true;
  motorUpperCover.receiveShadow = true;
  runGroup.add(motorUpperCover);

  // Center silver `TECHNOGYM` motor-hood badge (`z = +0.52m, y = 0.248m`)
  const hoodBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.006, 0.036),
    technogymBadgeMat
  );
  hoodBadge.name = 'outbuildings.gym.technogymRunPersonal.motorHoodBadge';
  hoodBadge.userData.lodTier = 'high';
  hoodBadge.userData.lodMaxDistance = 12;
  hoodBadge.position.set(0, 0.246, 0.53);
  hoodBadge.rotation.x = -0.15;
  runGroup.add(hoodBadge);

  // ---------------------------------------------------------------------------
  // 5. Iconic Antonio Citterio Mirror-Polished Cast-Aluminium A-Frame Uprights
  //    (`outbuildings.gym.technogymRunPersonal.polishedFrame`)
  // ---------------------------------------------------------------------------
  // Build the exact side-view silhouette of the A-frame base truss + raked console arm
  // in 2D `(x2d = z, y2d = y)` with the rounded triangular cutout hole at the base!
  const createCitterioUprightGeometry = (thickness: number): THREE.ExtrudeGeometry => {
    const outer = new THREE.Shape();
    // Start at rear base of A-frame (`z = 0.45m, y = 0.205m`)
    outer.moveTo(0.45, 0.205);
    // Base bar forward to front toe of A-frame (`z = 0.955m, y = 0.225m`)
    outer.lineTo(0.955, 0.225);
    outer.quadraticCurveTo(0.975, 0.23, 0.962, 0.265);
    // Front leg of A-frame rising backward to the mid-waist apex (`z = 0.71m, y = 0.72m`)
    outer.lineTo(0.715, 0.71);
    // Continue up the raked upper arm front edge to console top (`z = 0.65m, y = 1.455m`)
    outer.lineTo(0.515, 1.15);
    outer.lineTo(0.685, 1.445);
    outer.quadraticCurveTo(0.695, 1.465, 0.665, 1.468);
    // Console side cheek top & back edge descending to console neck (`z = 0.415m, y = 1.14m`)
    outer.lineTo(0.635, 1.455);
    outer.lineTo(0.41, 1.145);
    outer.quadraticCurveTo(0.395, 1.12, 0.425, 1.08);
    // Upper arm rear edge down to mid-joint stub (`y = 0.865m`)
    outer.lineTo(0.555, 0.875);
    // Short horizontal rearward socket stub where the lower black handrail loop joins (`z = 0.42m, y = 0.82..0.865m`)
    outer.lineTo(0.42, 0.862);
    outer.lineTo(0.42, 0.818);
    outer.lineTo(0.585, 0.822);
    // Rear leg of A-frame descending from waist (`z = 0.615m, y = 0.72m`) to rear base (`z = 0.45m, y = 0.205m`)
    outer.lineTo(0.618, 0.71);
    outer.lineTo(0.442, 0.24);
    outer.quadraticCurveTo(0.435, 0.205, 0.45, 0.205);

    // Triangular cutout window through the lower A-frame truss
    const hole = new THREE.Path();
    hole.moveTo(0.535, 0.26);
    hole.lineTo(0.875, 0.275);
    hole.quadraticCurveTo(0.89, 0.28, 0.878, 0.305);
    hole.lineTo(0.682, 0.625);
    hole.quadraticCurveTo(0.665, 0.65, 0.65, 0.622);
    hole.lineTo(0.518, 0.285);
    hole.quadraticCurveTo(0.512, 0.26, 0.535, 0.26);
    outer.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 16,
    });
    // Rotate so 2D `(x2d, y2d)` maps to 3D `(z, y)` and extrusion `z2d` maps along `x`!
    // Specifically: `rotateY(-Math.PI / 2)` maps `(x, y, z) -> (-z, y, x)`.
    // Wait: if we want `x2d -> +z` and `y2d -> +y`, then `rotateY(-Math.PI / 2)` maps `x2d` to `+z`!
    geo.rotateY(-Math.PI / 2);
    geo.computeBoundingSphere();
    return geo;
  };

  const outerAluGeo = createCitterioUprightGeometry(0.022);
  const innerCoreGeo = createCitterioUprightGeometry(0.018);

  for (const sideX of [-1, 1] as const) {
    // Mirror-polished cast aluminium outer upright plate (`x = ±0.376m`)
    const aluUpright = new THREE.Mesh(outerAluGeo, polishedCastAluMat);
    aluUpright.name = 'outbuildings.gym.technogymRunPersonal.polishedFrame';
    aluUpright.position.set(sideX > 0 ? 0.386 : -0.364, 0, 0);
    aluUpright.castShadow = true;
    aluUpright.receiveShadow = true;
    runGroup.add(aluUpright);

    // Dark matte-anthracite inner structural backing (`x = ±0.356m`) visible on the inside of the far upright
    const innerCore = new THREE.Mesh(innerCoreGeo, matteCharcoalMat);
    innerCore.name = `outbuildings.gym.technogymRunPersonal.polishedFrameInnerCore.${sideX < 0 ? 'left' : 'right'}`;
    innerCore.position.set(sideX > 0 ? 0.366 : -0.348, 0, 0);
    innerCore.castShadow = true;
    runGroup.add(innerCore);
  }

  // ---------------------------------------------------------------------------
  // 6. Closed-Loop Soft-Touch Ergonomic Side Handrails & Front Heart-Rate Crossbar
  //    (`outbuildings.gym.technogymRunPersonal.handrails`)
  // ---------------------------------------------------------------------------
  for (const sideX of [-1, 1] as const) {
    const hx = sideX * 0.366;
    const loopCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(hx, 1.115, 0.415),
        new THREE.Vector3(hx, 1.07, 0.12),
        new THREE.Vector3(hx, 1.03, -0.15),
        new THREE.Vector3(hx, 1.0, -0.195),
        new THREE.Vector3(hx, 0.92, -0.202),
        new THREE.Vector3(hx, 0.855, -0.192),
        new THREE.Vector3(hx, 0.838, -0.14),
        new THREE.Vector3(hx, 0.84, 0.15),
        new THREE.Vector3(hx, 0.84, 0.422),
      ],
      false,
      'catmullrom',
      0.22
    );
    const handrailLoopGeo = new THREE.TubeGeometry(loopCurve, 44, 0.021, 16, false);
    handrailLoopGeo.computeBoundingSphere();
    const handrailLoop = new THREE.Mesh(
      handrailLoopGeo,
      softTouchGripMat
    );
    handrailLoop.name = 'outbuildings.gym.technogymRunPersonal.handrails';
    handrailLoop.castShadow = true;
    runGroup.add(handrailLoop);

    // Polished chrome ferrule collars at the upper and lower frame joints
    const sideTag = sideX < 0 ? 'left' : 'right';
    let collarIdx = 0;
    for (const [cy, cz, rx] of [
      [1.115, 0.415, 0.15],
      [0.84, 0.422, 0],
    ] as const) {
      collarIdx++;
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0225, 0.0225, 0.024, 16),
        polishedCastAluMat
      );
      collar.name = `outbuildings.gym.technogymRunPersonal.handrailCollar.${sideTag}.${collarIdx === 1 ? 'upper' : 'lower'}`;
      collar.userData.lodTier = 'high';
      collar.userData.lodMaxDistance = 12;
      collar.rotation.x = Math.PI / 2 + rx;
      collar.position.set(hx, cy, cz);
      runGroup.add(collar);
    }
  }

  // Front Horizontal Polished Chrome Heart-Rate Grip Crossbar (`x = -0.35..+0.35m, y = 1.105m, z = +0.365m`)
  const frontCrossbar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.019, 0.71, 20),
    polishedCastAluMat
  );
  frontCrossbar.name = 'outbuildings.gym.technogymRunPersonal.handrails';
  frontCrossbar.rotation.z = Math.PI / 2;
  frontCrossbar.position.set(0, 1.105, 0.365);
  frontCrossbar.castShadow = true;
  runGroup.add(frontCrossbar);

  // Hand-pulse contact sensor sleeves & black insulator rings on the front crossbar
  for (const sideX of [-1, 1] as const) {
    const sideTag = sideX < 0 ? 'left' : 'right';
    const sensorSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0205, 0.0205, 0.11, 16),
      brushedSteelMat
    );
    sensorSleeve.name = `outbuildings.gym.technogymRunPersonal.heartRateSensor.${sideTag}`;
    sensorSleeve.userData.lodTier = 'high';
    sensorSleeve.userData.lodMaxDistance = 12;
    sensorSleeve.rotation.z = Math.PI / 2;
    sensorSleeve.position.set(sideX * 0.165, 1.105, 0.365);
    runGroup.add(sensorSleeve);

    for (const ringOffset of [-0.06, 0.06] as const) {
      const insulatorRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.021, 0.012, 16),
        nonSlipRubberMat
      );
      insulatorRing.name = `outbuildings.gym.technogymRunPersonal.sensorInsulatorRing.${sideTag}.${ringOffset < 0 ? 'inner' : 'outer'}`;
      insulatorRing.userData.lodTier = 'high';
      insulatorRing.userData.lodMaxDistance = 12;
      insulatorRing.rotation.z = Math.PI / 2;
      insulatorRing.position.set(sideX * 0.165 + ringOffset, 1.105, 0.365);
      runGroup.add(insulatorRing);
    }

    // Integrated dark-anthracite bottle / accessory holder cups behind the crossbar (`x = ±0.245m, y = 1.095m, z = +0.435m`)
    const cupHolder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.038, 0.085, 18),
      matteCharcoalMat
    );
    cupHolder.name = `outbuildings.gym.technogymRunPersonal.bottleHolder.${sideTag}`;
    cupHolder.position.set(sideX * 0.245, 1.095, 0.435);
    runGroup.add(cupHolder);
  }

  // Console Bridge Tray & Red Emergency Stop Safety Key (`x = 0, y = 1.148m, z = +0.415m`)
  const consoleBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.71, 0.038, 0.095),
    matteCharcoalMat
  );
  consoleBridge.name = 'outbuildings.gym.technogymRunPersonal.consoleBridgeTray';
  consoleBridge.position.set(0, 1.138, 0.425);
  runGroup.add(consoleBridge);

  const safetyStopClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.034, 0.042),
    emergencyRedMat
  );
  safetyStopClip.name = 'outbuildings.gym.technogymRunPersonal.emergencyStop';
  safetyStopClip.userData.lodTier = 'high';
  safetyStopClip.userData.lodMaxDistance = 12;
  safetyStopClip.position.set(0, 1.158, 0.402);
  safetyStopClip.rotation.x = -0.35;
  runGroup.add(safetyStopClip);

  // ---------------------------------------------------------------------------
  // 7. 21.5" Technogym Live Full-HD Tempered-Glass Touchscreen Console
  //    (`outbuildings.gym.technogymRunPersonal.console`)
  // ---------------------------------------------------------------------------
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'outbuildings.gym.technogymRunPersonal.console';
  consoleGroup.position.set(0, 1.295, 0.545);
  // Tilted toward the runner (`-Z` is toward the runner, so `rotation.x = +0.62` tilts the `-Z` front face upward toward the runner!)
  consoleGroup.rotation.x = 0.62;
  runGroup.add(consoleGroup);

  const consoleW = 0.728;
  const consoleH = 0.425;
  const consoleD = 0.044;

  // Rear dark-anodized aluminium console shell
  const consoleBack = new THREE.Mesh(
    new THREE.BoxGeometry(consoleW, consoleH, consoleD),
    darkAnthraciteMat
  );
  consoleBack.name = 'outbuildings.gym.technogymRunPersonal.console.rearShell';
  consoleBack.castShadow = true;
  consoleGroup.add(consoleBack);

  // Polished cast-aluminium side trim cheeks hugging the left and right edges of the console
  for (const sideX of [-1, 1] as const) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, consoleH + 0.008, consoleD + 0.016),
      polishedCastAluMat
    );
    sideTrim.name = `outbuildings.gym.technogymRunPersonal.console.sideTrim.${sideX < 0 ? 'left' : 'right'}`;
    sideTrim.position.set(sideX * (consoleW * 0.5 + 0.013), 0, 0);
    consoleGroup.add(sideTrim);
  }

  // Edge-to-edge black tempered glass front bezel (`-z` face facing the runner)
  const bezelGlass = new THREE.Mesh(
    new THREE.BoxGeometry(consoleW - 0.008, consoleH - 0.008, 0.006),
    darkBezelGlassMat
  );
  bezelGlass.name = 'outbuildings.gym.technogymRunPersonal.console.bezelGlass';
  bezelGlass.position.set(0, 0, -consoleD * 0.5 - 0.007);
  consoleGroup.add(bezelGlass);

  // Active 21.5" Technogym Live Touchscreen Display (`outbuildings.gym.technogymRunPersonal.screen`)
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(consoleW - 0.028, consoleH - 0.028),
    screenDisplayMat
  );
  screenMesh.name = 'outbuildings.gym.technogymRunPersonal.screen';
  screenMesh.rotation.y = Math.PI; // Face `-Z` toward the runner on the belt!
  screenMesh.position.set(0, 0, -consoleD * 0.5 - 0.015);
  consoleGroup.add(screenMesh);

  if (!interactions) {
    return null;
  }

  const controller = new GymTreadmillRunController({
    runGroup,
    beltDeck,
    frontRoller,
    rearRoller,
    beltTexture,
    screenMesh,
    gymFloorY,
    clickableTargets: [runGroup],
  });
  interactions.registerAnimatedInteractable(controller);
  return controller;
}

