import * as THREE from 'three';
import { buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import { createSculptedCushionGeometry } from '../../../../objects/furniture/sitting-room-sofas-and-art.ts';
import type { CutawayWallDescriptor } from '../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { buildHallStaircase } from './hall-staircase.ts';
import type { buildLivingRoom } from './living-room.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

/**
 * Front Room (`livingRoom`) north-wall home cinema joinery, screen and in-wall speakers.
 */
export function buildLivingRoomCinemaWall(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'frontWallH' | 'oakMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'> &
    Pick<ReturnType<typeof buildHallStaircase>, 'spkConeMat' | 'spkTrimRingMat'> &
    Pick<ReturnType<typeof buildLivingRoom>, 'livingRoomNorthWallFrame'>
): void {
  const { groundFloorCeilingGroup, scene } = ctx;
  const {
    frontWallH,
    livingRoomNorthWallFrame,
    oakMat,
    spkConeMat,
    spkTrimRingMat,
    tier2FloorY,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // FRONT ROOM (livingRoom) NORTH WALL HOME CINEMA (Issue #15 — 120" THX Reference):
  // - 120-inch (16:9, 2.657m × 1.494m active image, 2.747m × 1.584m × 0.038m velvet frame)
  //   Acoustically Transparent Woven Fixed-Frame Projector Screen (`livingRoom.projectorScreen`)
  // - Recessed Behind-Screen Architectural In-Wall LCR Speakers (`du = -1.02m, 0.0m, +1.02m` at ear/screen-center
  //   height `tier2FloorY + 1.27m`) + Dual 10" In-Wall Cinema Subwoofers (`du = ±0.52m`, `tier2FloorY + 1.06m`)
  // - Ceiling-Mounted 4K Short-Throw (0.78:1) Laser Projector (`livingRoom.ceilingProjector`)
  //   mounted in the center of the room directly in front of `livingRoom.spineBeam` at D = 2.08m throw distance
  // - Ruggable Vesper Olive & Gold Tufted Rug (185x275) + Loaf Cuddlemuffin Chaise Cinema Sofa in Treacle Tart Yellow Clever Velvet
  // =========================================================================
  const frNorthCutawayDescriptor: CutawayWallDescriptor = {
    axis: 'z',
    coord: -2.98,
    minSpan: -22.47,
    maxSpan: -16.858,
    floor: 'ground',
  };
  const northWallCenterU = livingRoomNorthWallFrame.length * 0.5;

  // 1. 120-inch Acoustically Transparent Woven Fixed-Frame Projector Screen (Issue #15)
  //    Active 16:9 image: 2.657m W × 1.494m H (120.0" diagonal — 2.09× the area of an 83" TV, 0.78:1 throw from D = 2.08m)
  //    Outer 45mm black velvet-flocked aluminium frame: 2.747m W × 1.584m H × 0.038m D
  const projectorScreenGroup = new THREE.Group();
  projectorScreenGroup.name = 'livingRoom.projectorScreen';
  projectorScreenGroup.userData = { zone: 'livingRoom', cutawayWall: frNorthCutawayDescriptor };

  const velvetFrameMat = new THREE.MeshStandardMaterial({
    color: 0x0c0d10, // Light-absorbing matte-black velvet-flocked aluminium frame
    roughness: 0.94,
    metalness: 0.04,
  });
  const innerChamferBezelMat = new THREE.MeshStandardMaterial({
    color: 0x16181d, // Anodized obsidian inner shadow chamfer
    roughness: 0.68,
    metalness: 0.28,
  });
  const acousticCavityMat = new THREE.MeshStandardMaterial({
    color: 0x090b0e, // Recessed dark mineral-wool acoustic absorption cavity behind the screen weave
    roughness: 0.95,
    metalness: 0.02,
  });
  // Issue #5 & Khazad-dûm Update: 1024x576 OLED widescreen scene from
  // The Lord of the Rings: The Fellowship of the Ring — Gandalf the Grey confronting the Balrog of Morgoth
  // ("YOU SHALL NOT PASS!") on the Bridge of Khazad-dûm in the Mines of Moria
  const lotrCanvas = document.createElement('canvas');
  lotrCanvas.width = 1024;
  lotrCanvas.height = 576;
  const lCtx = lotrCanvas.getContext('2d');
  if (lCtx) {
    // Pure OLED black 2.39:1 cinema letterbox frame
    lCtx.fillStyle = '#020204';
    lCtx.fillRect(0, 0, 1024, 576);

    const topBar = 74;
    const botBar = 502;
    const frameH = botBar - topBar;

    lCtx.save();
    lCtx.beginPath();
    lCtx.rect(0, topBar, 1024, frameH);
    lCtx.clip();

    // 1. Subterranean cavern of Khazad-dûm — abyssal obsidian darkness
    lCtx.fillStyle = '#060508';
    lCtx.fillRect(0, topBar, 1024, frameH);

    // Clash of two elemental lights:
    // Left: Roaring hellfire inferno of the Balrog (Flame of Udûn)
    const balrogX = 330;
    const balrogY = topBar + 195;
    const fireGlow = lCtx.createRadialGradient(balrogX, balrogY, 16, balrogX - 20, balrogY + 10, 440);
    fireGlow.addColorStop(0, 'rgba(255, 245, 175, 0.96)');
    fireGlow.addColorStop(0.18, 'rgba(255, 148, 28, 0.85)');
    fireGlow.addColorStop(0.45, 'rgba(205, 38, 8, 0.55)');
    fireGlow.addColorStop(0.75, 'rgba(82, 12, 6, 0.24)');
    fireGlow.addColorStop(1, 'rgba(6, 5, 8, 0)');
    lCtx.fillStyle = fireGlow;
    lCtx.fillRect(0, topBar, 1024, frameH);

    // Molten chasm glow rising from beneath the Bridge of Khazad-dûm
    const chasmGlow = lCtx.createLinearGradient(0, topBar + 280, 0, botBar);
    chasmGlow.addColorStop(0, 'rgba(180, 32, 6, 0)');
    chasmGlow.addColorStop(0.6, 'rgba(140, 22, 4, 0.28)');
    chasmGlow.addColorStop(1, 'rgba(235, 72, 12, 0.52)');
    lCtx.fillStyle = chasmGlow;
    lCtx.fillRect(0, topBar + 280, 1024, botBar - (topBar + 280));

    // Right: Gandalf's piercing white-blue Istari staff radiance pushing back the shadow
    const staffX = 678;
    const staffY = topBar + 214;
    const staffGlow = lCtx.createRadialGradient(staffX, staffY, 4, staffX, staffY, 270);
    staffGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    staffGlow.addColorStop(0.14, 'rgba(210, 238, 255, 0.88)');
    staffGlow.addColorStop(0.38, 'rgba(110, 175, 245, 0.38)');
    staffGlow.addColorStop(0.72, 'rgba(38, 72, 120, 0.12)');
    staffGlow.addColorStop(1, 'rgba(6, 5, 8, 0)');
    lCtx.fillStyle = staffGlow;
    lCtx.fillRect(0, topBar, 1024, frameH);

    // 2. Distant colossal Dwarven pillars of Moria & jagged cavern roof stalactites in deep silhouette
    lCtx.fillStyle = '#0c090e';
    for (const [px, pw] of [
      [68, 44],
      [182, 36],
      [518, 32],
      [836, 40],
      [948, 48],
    ] as const) {
      lCtx.fillRect(px - pw * 0.5, topBar, pw, frameH);
    }
    // Jagged cavern ceiling crags
    lCtx.fillStyle = '#050407';
    lCtx.beginPath();
    lCtx.moveTo(0, topBar);
    for (const [cx, cy] of [
      [80, 48],
      [155, 18],
      [240, 56],
      [340, 22],
      [450, 64],
      [560, 28],
      [670, 52],
      [790, 20],
      [900, 58],
      [1024, 24],
    ] as const) {
      lCtx.lineTo(cx, topBar + cy);
    }
    lCtx.lineTo(1024, topBar);
    lCtx.closePath();
    lCtx.fill();

    // 3. THE BALROG OF MORGOTH (Durin's Bane) — Colossal Demon of Shadow and Flame
    // Billowing black smoke & shadow wings unfurled across the left cavern
    lCtx.fillStyle = 'rgba(10, 6, 8, 0.92)';
    lCtx.beginPath();
    lCtx.moveTo(balrogX - 18, balrogY - 42);
    // Left massive bat-wing of shadow
    lCtx.bezierCurveTo(balrogX - 130, balrogY - 155, balrogX - 255, balrogY - 135, 38, topBar + 28);
    lCtx.lineTo(65, balrogY + 18);
    lCtx.lineTo(145, balrogY - 12);
    lCtx.lineTo(195, balrogY + 34);
    lCtx.lineTo(balrogX - 55, balrogY + 12);
    // Right wing sweeping up behind the Balrog's shoulders
    lCtx.moveTo(balrogX + 22, balrogY - 46);
    lCtx.bezierCurveTo(balrogX + 95, balrogY - 150, balrogX + 195, balrogY - 142, balrogX + 235, topBar + 36);
    lCtx.lineTo(balrogX + 165, balrogY - 10);
    lCtx.lineTo(balrogX + 115, balrogY + 18);
    lCtx.lineTo(balrogX + 46, balrogY - 8);
    lCtx.closePath();
    lCtx.fill();

    // Roaring internal magma aura licking around the Balrog's torso, mane & shoulders
    const maneGrad = lCtx.createRadialGradient(balrogX, balrogY - 30, 10, balrogX, balrogY - 10, 135);
    maneGrad.addColorStop(0, '#fff7b8');
    maneGrad.addColorStop(0.32, '#ff8814');
    maneGrad.addColorStop(0.68, '#d92606');
    maneGrad.addColorStop(1, 'rgba(90, 8, 2, 0)');
    lCtx.fillStyle = maneGrad;
    lCtx.beginPath();
    lCtx.moveTo(balrogX - 92, balrogY + 110);
    lCtx.quadraticCurveTo(balrogX - 115, balrogY - 45, balrogX - 38, balrogY - 128);
    lCtx.quadraticCurveTo(balrogX, balrogY - 158, balrogX + 48, balrogY - 122);
    lCtx.quadraticCurveTo(balrogX + 110, balrogY - 35, balrogX + 78, balrogY + 110);
    lCtx.closePath();
    lCtx.fill();

    // Charred obsidian-armored demonic body, broad hunched shoulders, and striding legs
    lCtx.fillStyle = '#0b0607';
    lCtx.beginPath();
    lCtx.moveTo(balrogX - 68, balrogY + 135); // Left leg base
    lCtx.lineTo(balrogX - 48, balrogY + 36);  // Waist
    lCtx.lineTo(balrogX - 76, balrogY - 36);  // Left hulking shoulder
    lCtx.lineTo(balrogX - 28, balrogY - 72);  // Neck
    lCtx.lineTo(balrogX + 26, balrogY - 70);  // Forward-craned neck
    lCtx.lineTo(balrogX + 68, balrogY - 32);  // Right shoulder
    lCtx.lineTo(balrogX + 42, balrogY + 42);  // Torso right
    lCtx.lineTo(balrogX + 64, balrogY + 132); // Right leg base stepping onto bridge approach
    lCtx.lineTo(balrogX + 26, balrogY + 132);
    lCtx.lineTo(balrogX, balrogY + 58);       // Inner stride
    lCtx.lineTo(balrogX - 30, balrogY + 135);
    lCtx.closePath();
    lCtx.fill();

    // Molten lava fissures glowing across the Balrog's chest, ribs & shoulders
    lCtx.strokeStyle = '#ff9a1f';
    lCtx.lineWidth = 2.8;
    for (const [x1, y1, x2, y2] of [
      [balrogX - 36, balrogY - 26, balrogX + 28, balrogY - 18],
      [balrogX - 28, balrogY - 8, balrogX + 24, balrogY - 2],
      [balrogX - 22, balrogY + 10, balrogX + 18, balrogY + 14],
      [balrogX - 58, balrogY - 32, balrogX - 24, balrogY - 52],
      [balrogX + 52, balrogY - 28, balrogX + 22, balrogY - 48],
    ] as const) {
      lCtx.beginPath();
      lCtx.moveTo(x1, y1);
      lCtx.lineTo(x2, y2);
      lCtx.stroke();
    }

    // Demonic head & massive curved ram/bull horns of Durin's Bane
    const headX = balrogX + 14;
    const headY = balrogY - 74;
    lCtx.fillStyle = '#090506';
    lCtx.beginPath();
    lCtx.arc(headX, headY, 24, 0, Math.PI * 2);
    lCtx.fill();

    // Sweeping curved horns (left & right)
    lCtx.strokeStyle = '#160c0d';
    lCtx.lineWidth = 11;
    lCtx.lineCap = 'round';
    lCtx.beginPath();
    lCtx.moveTo(headX - 14, headY - 8);
    lCtx.bezierCurveTo(headX - 68, headY - 28, headX - 78, headY + 22, headX - 42, headY + 34);
    lCtx.moveTo(headX + 14, headY - 10);
    lCtx.bezierCurveTo(headX + 64, headY - 36, headX + 78, headY + 10, headX + 48, headY + 26);
    lCtx.stroke();

    // White-hot glowing eyes & roaring furnace maw facing Gandalf
    lCtx.fillStyle = '#fff6b0';
    lCtx.beginPath();
    lCtx.moveTo(headX + 2, headY - 8);
    lCtx.lineTo(headX + 14, headY - 5);
    lCtx.lineTo(headX + 6, headY - 1);
    lCtx.closePath();
    lCtx.fill();
    lCtx.beginPath();
    lCtx.moveTo(headX - 12, headY - 7);
    lCtx.lineTo(headX - 3, headY - 5);
    lCtx.lineTo(headX - 8, headY - 1);
    lCtx.closePath();
    lCtx.fill();

    // Roaring fiery jaws
    lCtx.fillStyle = '#ff6a00';
    lCtx.beginPath();
    lCtx.ellipse(headX + 6, headY + 11, 12, 8, 0.15, 0, Math.PI * 2);
    lCtx.fill();
    lCtx.fillStyle = '#fff8c4';
    lCtx.beginPath();
    lCtx.ellipse(headX + 6, headY + 11, 7, 4.5, 0.15, 0, Math.PI * 2);
    lCtx.fill();

    // The Balrog's Blazing Flaming Sword & Fiery Whip curling through the cavern air
    lCtx.save();
    lCtx.shadowColor = '#ff5500';
    lCtx.shadowBlur = 16;
    // Flaming great-sword raised in right claw
    lCtx.strokeStyle = '#ffae2b';
    lCtx.lineWidth = 6;
    lCtx.beginPath();
    lCtx.moveTo(balrogX + 58, balrogY - 22);
    lCtx.lineTo(balrogX + 148, balrogY - 96);
    lCtx.stroke();
    lCtx.strokeStyle = '#fff7c2';
    lCtx.lineWidth = 2.5;
    lCtx.beginPath();
    lCtx.moveTo(balrogX + 58, balrogY - 22);
    lCtx.lineTo(balrogX + 148, balrogY - 96);
    lCtx.stroke();

    // Coiling fiery whip in left claw lashing across the chasm
    lCtx.strokeStyle = '#ff6a0c';
    lCtx.lineWidth = 4.5;
    lCtx.beginPath();
    lCtx.moveTo(balrogX - 66, balrogY - 12);
    lCtx.bezierCurveTo(balrogX - 145, balrogY + 48, balrogX - 40, balrogY + 148, balrogX + 155, balrogY + 86);
    lCtx.stroke();
    lCtx.strokeStyle = '#ffe680';
    lCtx.lineWidth = 1.8;
    lCtx.stroke();
    lCtx.restore();

    // 4. THE BRIDGE OF KHAZAD-DÛM — Narrow, perilous single-span stone arch over the abyss
    const bridgeGrad = lCtx.createLinearGradient(220, topBar + 315, 860, topBar + 315);
    bridgeGrad.addColorStop(0, '#3d160c');
    bridgeGrad.addColorStop(0.38, '#702a14');
    bridgeGrad.addColorStop(0.58, '#4e5868');
    bridgeGrad.addColorStop(0.75, '#7a92ad');
    bridgeGrad.addColorStop(1, '#1d242e');
    lCtx.fillStyle = bridgeGrad;
    lCtx.beginPath();
    lCtx.moveTo(160, botBar);
    lCtx.quadraticCurveTo(525, topBar + 286, 920, botBar);
    lCtx.lineTo(820, botBar);
    lCtx.quadraticCurveTo(525, topBar + 324, 260, botBar);
    lCtx.closePath();
    lCtx.fill();

    // Top rim highlight along the narrow stone bridge span (split orange-gold on left, ice-blue on right)
    lCtx.strokeStyle = 'rgba(255, 168, 72, 0.72)';
    lCtx.lineWidth = 3;
    lCtx.beginPath();
    lCtx.moveTo(210, topBar + 372);
    lCtx.quadraticCurveTo(380, topBar + 315, 535, topBar + 312);
    lCtx.stroke();

    lCtx.strokeStyle = 'rgba(195, 230, 255, 0.85)';
    lCtx.beginPath();
    lCtx.moveTo(535, topBar + 312);
    lCtx.quadraticCurveTo(695, topBar + 314, 860, topBar + 378);
    lCtx.stroke();

    // 5. GANDALF THE GREY — Standing lone and defiant on the narrow Bridge of Khazad-dûm
    const gx = 698;
    const gy = topBar + 314; // Feet planted on the crest of the bridge

    // Flowing grey-blue robes & cloak billowing back in the furnace blast
    lCtx.fillStyle = '#283240';
    lCtx.beginPath();
    lCtx.moveTo(gx - 16, gy + 4);      // Front hem
    lCtx.lineTo(gx - 8, gy - 46);      // Chest / waist
    lCtx.lineTo(gx - 22, gy - 58);     // Raised left arm holdingstaff
    lCtx.lineTo(gx - 8, gy - 66);      // Shoulder
    lCtx.lineTo(gx + 16, gy - 62);     // Back shoulder
    lCtx.lineTo(gx + 34, gy - 44);     // Raised right arm holding Glamdring
    lCtx.lineTo(gx + 22, gy - 32);
    lCtx.lineTo(gx + 36, gy + 6);      // Billowing rear cloak hem
    lCtx.closePath();
    lCtx.fill();

    // Silver-white beard & hair streaming back
    lCtx.fillStyle = '#cdd9e6';
    lCtx.beginPath();
    lCtx.moveTo(gx - 6, gy - 64);
    lCtx.lineTo(gx + 8, gy - 64);
    lCtx.lineTo(gx + 14, gy - 42);
    lCtx.lineTo(gx - 4, gy - 46);
    lCtx.closePath();
    lCtx.fill();

    // Iconic tall pointed wizard hat silhouette
    lCtx.fillStyle = '#1c2430';
    lCtx.beginPath();
    lCtx.moveTo(gx - 18, gy - 64);     // Hat brim front
    lCtx.lineTo(gx + 18, gy - 62);     // Hat brim back
    lCtx.lineTo(gx + 8, gy - 68);
    lCtx.lineTo(gx + 4, gy - 94);      // Tall pointed crown tip
    lCtx.lineTo(gx - 8, gy - 68);
    lCtx.closePath();
    lCtx.fill();

    // Glamdring (the Foe-hammer) gleaming silver-blue in Gandalf's right hand
    lCtx.strokeStyle = '#dff2ff';
    lCtx.lineWidth = 2.8;
    lCtx.beginPath();
    lCtx.moveTo(gx + 26, gy - 44);
    lCtx.lineTo(gx + 64, gy - 76);
    lCtx.stroke();

    // Gandalf's Oak Staff held high in his left hand toward the Balrog
    lCtx.strokeStyle = '#4a3828';
    lCtx.lineWidth = 3.2;
    lCtx.beginPath();
    lCtx.moveTo(gx - 20, gy + 2);
    lCtx.lineTo(staffX, staffY);
    lCtx.stroke();

    // Blinding celestial sphere & protective dome of Istari light between Gandalf and the Balrog
    lCtx.fillStyle = '#ffffff';
    lCtx.beginPath();
    lCtx.arc(staffX, staffY, 9, 0, Math.PI * 2);
    lCtx.fill();

    // Shockwave arc of light where Gandalf's ward meets the Balrog's fire
    lCtx.strokeStyle = 'rgba(195, 232, 255, 0.52)';
    lCtx.lineWidth = 2.5;
    lCtx.beginPath();
    lCtx.arc(staffX + 18, staffY + 24, 118, Math.PI * 0.68, Math.PI * 1.34);
    lCtx.stroke();

    // 6. Floating fiery embers & ash sparks swirling across the cavern
    lCtx.fillStyle = '#ffae38';
    for (const [ex, ey, er] of [
      [142, topBar + 118, 2.2],
      [215, topBar + 285, 2.6],
      [285, topBar + 92, 1.8],
      [395, topBar + 134, 2.4],
      [448, topBar + 245, 3.0],
      [488, topBar + 178, 2.0],
      [524, topBar + 292, 2.2],
      [558, topBar + 142, 1.7],
      [310, topBar + 342, 2.5],
      [418, topBar + 368, 2.1],
    ] as const) {
      lCtx.beginPath();
      lCtx.arc(ex, ey, er, 0, Math.PI * 2);
      lCtx.fill();
    }

    // 7. Moody molten-gold cinema typography in the lower letterbox border
    lCtx.fillStyle = 'rgba(248, 212, 142, 0.92)';
    lCtx.font = '600 22px Georgia, "Times New Roman", serif';
    lCtx.textAlign = 'center';
    lCtx.fillText('“YOU SHALL NOT PASS!”', 512, topBar + frameH - 36);
    lCtx.fillStyle = 'rgba(214, 152, 88, 0.82)';
    lCtx.font = '500 11px Georgia, "Times New Roman", serif';
    lCtx.fillText('THE LORD OF THE RINGS  ·  THE BRIDGE OF KHAZAD-DÛM', 512, topBar + frameH - 17);

    lCtx.restore();

    // 8. Acoustically Transparent Micro-Woven Fabric Grid & Subtle Ghost Silhouette of the
    //    Behind-Screen LCR + Dual 10" Subwoofer Speaker Array (visible on close-up inspection)
    lCtx.save();
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.042)';
    lCtx.lineWidth = 1.2;
    // Left (-1.02m), Center (0.0m), Right (+1.02m) behind-screen LCR speaker silhouettes at screen center Y = 288
    for (const [spkX, isHoriz] of [
      [119, false],
      [512, true],
      [905, false],
    ] as const) {
      const bw = isHoriz ? 238 : 85;
      const bh = isHoriz ? 73 : 215;
      lCtx.strokeRect(spkX - bw * 0.5, 288 - bh * 0.5, bw, bh);
      const offsets: ReadonlyArray<readonly [number, number, number]> = isHoriz
        ? [
            [-65, 0, 26],
            [0, 0, 11],
            [65, 0, 26],
          ]
        : [
            [0, -58, 26],
            [0, 0, 11],
            [0, 58, 26],
          ];
      for (const [dx, dy, rad] of offsets) {
        lCtx.beginPath();
        lCtx.arc(spkX + dx, 288 + dy, rad, 0, Math.PI * 2);
        lCtx.stroke();
        lCtx.beginPath();
        lCtx.arc(spkX + dx, 288 + dy, rad * 0.42, 0, Math.PI * 2);
        lCtx.stroke();
      }
    }
    // Dual 10" in-wall cinema subwoofers at du = ±0.52m (canvas X = 312, 712; Y = 369)
    for (const subX of [312, 712] as const) {
      lCtx.strokeRect(subX - 65, 369 - 65, 130, 130);
      lCtx.beginPath();
      lCtx.arc(subX, 369, 47, 0, Math.PI * 2);
      lCtx.stroke();
      lCtx.beginPath();
      lCtx.arc(subX, 369, 18, 0, Math.PI * 2);
      lCtx.stroke();
    }

    // Fine micro-perforated acoustic weave pattern across the 120" projection surface
    lCtx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let wy = 0; wy < 576; wy += 4) {
      lCtx.fillRect(0, wy, 1024, 1);
    }
    for (let wx = 0; wx < 1024; wx += 4) {
      lCtx.fillRect(wx, 0, 1, 576);
    }
    lCtx.restore();
  }

  const lotrScreenTex = new THREE.CanvasTexture(lotrCanvas);
  lotrScreenTex.colorSpace = THREE.SRGBColorSpace;
  lotrScreenTex.anisotropy = 8;

  const projectorScreenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lotrScreenTex,
    emissive: 0xffffff,
    emissiveMap: lotrScreenTex,
    emissiveIntensity: 0.56, // 4K Laser projected luminance on 1.0-gain acoustic weave
    roughness: 0.72, // Matte micro-woven acoustically transparent front-projection fabric
    metalness: 0.02,
  });

  // 120" 16:9 Fixed-Frame Acoustically Transparent Screen Dimensions:
  // Active 16:9 image: 2.657m W × 1.494m H (120.0" diagonal — 2.09× the area of an 83" TV!)
  // Outer 45mm velvet-flocked aluminium frame: 2.747m W × 1.584m H × 0.038m D
  const screenActiveW = 2.657;
  const screenActiveH = 1.494;
  const frameBezelW = 0.045;
  const screenOuterW = screenActiveW + frameBezelW * 2; // 2.747m
  const screenOuterH = screenActiveH + frameBezelW * 2; // 1.584m
  const frameDepth = 0.038;

  // Recessed acoustic speaker wall cavity backing behind the woven screen
  const acousticSpeakerCavity = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(2.44, 1.04, 0.006)),
    acousticCavityMat
  );
  acousticSpeakerCavity.name = 'livingRoom.projectorScreen.acousticSpeakerCavity';
  acousticSpeakerCavity.position.set(0, -0.05, 0.003);
  projectorScreenGroup.add(acousticSpeakerCavity);

  // 4 mitred perimeter matte-black velvet-wrapped aluminium frame rails
  const frameTopBottomGeo = createSharedGeo(
    new THREE.BoxGeometry(screenOuterW, frameBezelW, frameDepth)
  );
  const frameSideGeo = createSharedGeo(
    new THREE.BoxGeometry(frameBezelW, screenActiveH, frameDepth)
  );

  const frameTop = new THREE.Mesh(frameTopBottomGeo, velvetFrameMat);
  frameTop.name = 'livingRoom.projectorScreen.frameTop';
  frameTop.position.set(0, (screenActiveH + frameBezelW) * 0.5, frameDepth * 0.5);
  frameTop.castShadow = true;
  projectorScreenGroup.add(frameTop);

  const frameBottom = new THREE.Mesh(frameTopBottomGeo, velvetFrameMat);
  frameBottom.name = 'livingRoom.projectorScreen.frameBottom';
  frameBottom.position.set(0, -(screenActiveH + frameBezelW) * 0.5, frameDepth * 0.5);
  frameBottom.castShadow = true;
  projectorScreenGroup.add(frameBottom);

  const frameLeft = new THREE.Mesh(frameSideGeo, velvetFrameMat);
  frameLeft.name = 'livingRoom.projectorScreen.frameLeft';
  frameLeft.position.set(-(screenActiveW + frameBezelW) * 0.5, 0, frameDepth * 0.5);
  frameLeft.castShadow = true;
  projectorScreenGroup.add(frameLeft);

  const frameRight = new THREE.Mesh(frameSideGeo, velvetFrameMat);
  frameRight.name = 'livingRoom.projectorScreen.frameRight';
  frameRight.position.set((screenActiveW + frameBezelW) * 0.5, 0, frameDepth * 0.5);
  frameRight.castShadow = true;
  projectorScreenGroup.add(frameRight);

  // Inner chamfered shadow bezel framing the 120" active image
  const innerBezel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(screenActiveW + 0.016, screenActiveH + 0.016, 0.008)),
    innerChamferBezelMat
  );
  innerBezel.name = 'livingRoom.projectorScreen.innerBezel';
  innerBezel.position.set(0, 0, 0.023);
  projectorScreenGroup.add(innerBezel);

  // Active 120" (2.657m × 1.494m) acoustically transparent micro-woven projection surface at nWall = 0.028m
  const projectorScreenSurface = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(screenActiveW, screenActiveH, 0.003)),
    projectorScreenMat
  );
  projectorScreenSurface.name = 'livingRoom.projectorScreen.screen';
  projectorScreenSurface.position.set(0, 0, 0.028);
  projectorScreenGroup.add(projectorScreenSurface);

  // Bias light: warm LED perimeter tape on the back of the velvet frame washing the North wall
  // (KNX circuit `livingRoomTvBacklight`, emissive-only — no extra PointLight).
  const tvBiasGlowMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xffdcae,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  tvBiasGlowMat.userData = { ...tvBiasGlowMat.userData, baseEmissiveIntensity: 0.9 };
  ctx.lightGroups.livingRoomTvBacklight.emissives.push(tvBiasGlowMat);
  const tvBiasGlow = new THREE.Mesh(
    createSharedGeo(new THREE.PlaneGeometry(screenOuterW + 0.22, screenOuterH + 0.22)),
    tvBiasGlowMat
  );
  tvBiasGlow.name = 'livingRoom.projectorScreen.biasLight';
  tvBiasGlow.position.set(0, 0, 0.002);
  tvBiasGlow.renderOrder = -1;
  projectorScreenGroup.add(tvBiasGlow);

  // Centered on the North Cinema Wall at cy = tier2FloorY + 1.27m = +0.67m
  // (bottom of frame at y = -0.122m [47.8cm above floor], top of frame at y = +1.462m below the +1.485m ceiling joists)
  livingRoomNorthWallFrame.placeObject(
    scene,
    projectorScreenGroup,
    northWallCenterU,
    tier2FloorY + 1.27,
    0.0
  );

  // 2. Behind-Screen Architectural In-Wall LCR Speakers & Dual 10" Cinema Subwoofers (Issue #15)
  //    Recessed flush into the North wall (nWall = 0.008m) directly behind the 120" acoustically
  //    transparent woven projector screen (`livingRoom.projectorScreen.screen` at nWall = 0.028m).
  const inWallBezelMat = new THREE.MeshStandardMaterial({
    color: 0x1e242b,
    roughness: 0.42,
    metalness: 0.25,
  });
  const inWallGrilleMat = new THREE.MeshStandardMaterial({
    color: 0x15191e,
    roughness: 0.62,
    metalness: 0.18,
  });

  const wooferRingGeo = createSharedGeo(new THREE.TorusGeometry(0.068, 0.004, 8, 20));
  const tweeterRingGeo = createSharedGeo(new THREE.TorusGeometry(0.028, 0.004, 8, 20));
  const wooferConeGeo = createSharedGeo(new THREE.CylinderGeometry(0.068 - 0.003, 0.068 * 0.42, 0.008, 16));
  const tweeterConeGeo = createSharedGeo(new THREE.CylinderGeometry(0.028 - 0.003, 0.028 * 0.42, 0.008, 16));
  const lrSpeakerBezelGeo = createSharedGeo(new THREE.BoxGeometry(0.22, 0.56, 0.012));
  const lrSpeakerBaffleGeo = createSharedGeo(new THREE.BoxGeometry(0.22 - 0.024, 0.56 - 0.024, 0.014));

  const buildArchitecturalInWallSpeaker = (
    spkName: string,
    uWall: number,
    cy: number,
    nWall: number,
    w: number,
    h: number,
    isHorizontalCenter: boolean
  ): void => {
    const spkGroup = new THREE.Group();
    spkGroup.name = spkName;
    spkGroup.userData = { zone: 'livingRoom', cutawayWall: frNorthCutawayDescriptor };

    const bezel = new THREE.Mesh(
      isHorizontalCenter ? createSharedGeo(new THREE.BoxGeometry(w, h, 0.012)) : lrSpeakerBezelGeo,
      inWallBezelMat
    );
    bezel.name = `${spkName}.bezel`;
    spkGroup.add(bezel);

    const baffle = new THREE.Mesh(
      isHorizontalCenter ? createSharedGeo(new THREE.BoxGeometry(w - 0.024, h - 0.024, 0.014)) : lrSpeakerBaffleGeo,
      inWallGrilleMat
    );
    baffle.name = `${spkName}.grille`;
    baffle.position.set(0, 0, 0.002);
    spkGroup.add(baffle);

    // Dual 165mm mid-bass drivers + central 25mm tweeter ring
    const driverOffsets: ReadonlyArray<readonly [number, number, number]> = isHorizontalCenter
      ? [
          [-0.17, 0, 0.068],
          [0, 0, 0.028],
          [0.17, 0, 0.068],
        ]
      : [
          [0, -0.15, 0.068],
          [0, 0, 0.028],
          [0, 0.15, 0.068],
        ];

    for (const [dx, dy, r] of driverOffsets) {
      const isWoofer = r > 0.04;
      const ring = tagHighLod(
        new THREE.Mesh(
          isWoofer ? wooferRingGeo : tweeterRingGeo,
          spkTrimRingMat
        )
      );
      ring.name = `${spkName}.driverRing`;
      ring.position.set(dx, dy, 0.01);
      spkGroup.add(ring);

      const cone = tagHighLod(
        new THREE.Mesh(
          isWoofer ? wooferConeGeo : tweeterConeGeo,
          spkConeMat
        )
      );
      cone.name = `${spkName}.driver`;
      cone.rotation.x = Math.PI / 2;
      cone.position.set(dx, dy, 0.008);
      spkGroup.add(cone);
    }

    livingRoomNorthWallFrame.placeObject(scene, spkGroup, uWall, cy, nWall);
  };

  // Left, Center & Right In-Wall LCR Speakers behind the 120" acoustically transparent screen at ear/screen-center height (tier2FloorY + 1.27m)
  buildArchitecturalInWallSpeaker(
    'livingRoom.inWallSpeaker.left',
    northWallCenterU - 1.02,
    tier2FloorY + 1.27,
    0.008,
    0.22,
    0.56,
    false
  );
  buildArchitecturalInWallSpeaker(
    'livingRoom.inWallSpeaker.right',
    northWallCenterU + 1.02,
    tier2FloorY + 1.27,
    0.008,
    0.22,
    0.56,
    false
  );
  buildArchitecturalInWallSpeaker(
    'livingRoom.inWallSpeaker.center',
    northWallCenterU,
    tier2FloorY + 1.27,
    0.008,
    0.62,
    0.19,
    true
  );

  // Dual Architectural In-Wall 10" Cinema Subwoofers behind the 120" acoustically transparent screen (`du = ±0.52m`, `cy = tier2FloorY + 1.06m`)
  const subBezelGeo = createSharedGeo(new THREE.BoxGeometry(0.34, 0.34, 0.012));
  const subBaffleGeo = createSharedGeo(new THREE.BoxGeometry(0.31, 0.31, 0.014));
  const subRingGeo = createSharedGeo(new THREE.TorusGeometry(0.122, 0.006, 10, 24));
  const subConeGeo = createSharedGeo(new THREE.CylinderGeometry(0.118, 0.052, 0.01, 20));

  for (const [subSide, subDu] of [
    ['left', -0.52],
    ['right', 0.52],
  ] as const) {
    const subName = `livingRoom.inWallSubwoofer.${subSide}`;
    const subGroup = new THREE.Group();
    subGroup.name = subName;
    subGroup.userData = { zone: 'livingRoom', cutawayWall: frNorthCutawayDescriptor };

    const subBezel = new THREE.Mesh(subBezelGeo, inWallBezelMat);
    subBezel.name = `${subName}.bezel`;
    subGroup.add(subBezel);

    const subBaffle = new THREE.Mesh(subBaffleGeo, inWallGrilleMat);
    subBaffle.name = `${subName}.grille`;
    subBaffle.position.set(0, 0, 0.002);
    subGroup.add(subBaffle);

    const subRing = tagHighLod(new THREE.Mesh(subRingGeo, spkTrimRingMat));
    subRing.name = `${subName}.driverRing`;
    subRing.position.set(0, 0, 0.01);
    subGroup.add(subRing);

    const subCone = tagHighLod(new THREE.Mesh(subConeGeo, spkConeMat));
    subCone.name = `${subName}.driver`;
    subCone.rotation.x = Math.PI / 2;
    subCone.position.set(0, 0, 0.008);
    subGroup.add(subCone);

    livingRoomNorthWallFrame.placeObject(
      scene,
      subGroup,
      northWallCenterU + subDu,
      tier2FloorY + 1.06,
      0.008
    );
  }

  // 2B. Wall-light and ceiling layers (KNX `livingRoomWallLights` / `livingRoomDownlights`).
  //     Brass up/down cylinder wall lights either side of the 120" projector screen at du = ±1.58m,
  //     cleanly flanking the 2.747m velvet frame, and four recessed downlights in
  //     the flat 1.601 m ceiling (measured) for the "Bright" / cleaning layer.
  {
    const wallLightBrassMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.32, metalness: 0.82 });
    const wallLightLensMat = new THREE.MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: 0xffb866,
      emissiveIntensity: 2.4,
      roughness: 0.2,
    });
    wallLightLensMat.userData = { ...wallLightLensMat.userData, baseEmissiveIntensity: 2.4 };
    const wallWashMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffc27a,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    wallWashMat.userData = { ...wallWashMat.userData, baseEmissiveIntensity: 0.8 };
    ctx.lightGroups.livingRoomWallLights.emissives.push(wallLightLensMat, wallWashMat);

    const backplateGeo = createSharedGeo(new THREE.BoxGeometry(0.075, 0.17, 0.012));
    const bodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.17, 20));
    const lensGeo = createSharedGeo(new THREE.CircleGeometry(0.03, 20));
    const washGeo = createSharedGeo(new THREE.PlaneGeometry(0.2, 0.42));

    for (const [side, du] of [['left', -1.58], ['right', 1.58]] as const) {
      const name = `livingRoom.wallLight.${side}`;
      const fitting = new THREE.Group();
      fitting.name = name;
      fitting.userData = { zone: 'livingRoom', cutawayWall: frNorthCutawayDescriptor };

      const backplate = new THREE.Mesh(backplateGeo, wallLightBrassMat);
      backplate.name = `${name}.backplate`;
      backplate.position.z = 0.006;
      fitting.add(backplate);
      const body = new THREE.Mesh(bodyGeo, wallLightBrassMat);
      body.name = `${name}.body`;
      body.position.z = 0.058;
      body.castShadow = true;
      fitting.add(body);
      for (const [tag, y, rx] of [['up', 0.0855, -Math.PI / 2], ['down', -0.0855, Math.PI / 2]] as const) {
        const lens = new THREE.Mesh(lensGeo, wallLightLensMat);
        lens.name = `${name}.lens.${tag}`;
        lens.rotation.x = rx;
        lens.position.set(0, y, 0.058);
        fitting.add(lens);
        // Scallop of light grazing the plaster above / below the fitting.
        const wash = new THREE.Mesh(washGeo, wallWashMat);
        wash.name = `${name}.wash.${tag}`;
        wash.position.set(0, y + Math.sign(y) * 0.22, 0.003);
        wash.renderOrder = 1;
        fitting.add(wash);
      }
      livingRoomNorthWallFrame.placeObject(scene, fitting, northWallCenterU + du, tier2FloorY + 1.78, 0.0);
      ctx.interactions.registerLightFixture(fitting, 'livingRoomWallLights');
    }

    const downlightBezelGeo = createSharedGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.008, 20));
    const downlightLensGeo = createSharedGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.004, 16));
    const downlightLensMat = new THREE.MeshStandardMaterial({
      color: 0xfff6e8,
      emissive: 0xffcf94,
      emissiveIntensity: 2.2,
      roughness: 0.18,
    });
    downlightLensMat.userData = { ...downlightLensMat.userData, baseEmissiveIntensity: 2.2 };
    ctx.lightGroups.livingRoomDownlights.emissives.push(downlightLensMat);
    const LIVING_CEILING_Y = 1.601;
    const downlights: ReadonlyArray<readonly [number, number]> = [
      [-21.0, -1.6],
      [-18.6, -1.3],
      [-21.0, 0.9],
      [-18.9, 1.2],
    ];
    downlights.forEach(([x, z], i) => {
      const name = `livingRoom.ceilingDownlight.${i + 1}`;
      const fitting = new THREE.Group();
      fitting.name = name;
      fitting.userData = { zone: 'livingRoom' };
      fitting.position.set(x, LIVING_CEILING_Y - 0.004, z);
      const bezel = new THREE.Mesh(downlightBezelGeo, wallLightBrassMat);
      bezel.name = `${name}.bezel`;
      fitting.add(bezel);
      const lens = new THREE.Mesh(downlightLensGeo, downlightLensMat);
      lens.name = `${name}.emitter`;
      lens.position.y = -0.005;
      fitting.add(lens);
      groundFloorCeilingGroup.add(fitting);
      ctx.interactions.registerLightFixture(fitting, 'livingRoomDownlights');
      ctx.addGlowPool('livingRoomDownlights', x, tier2FloorY + 0.006, z, 0.7, 0.18);
    });
    // One shared fill for the general layer (the picture-light wash stays the accent light).
    const downlightFill = new THREE.PointLight(0xffd8a8, 6.0, 7.5, 1.6);
    downlightFill.name = 'livingRoom.ceilingDownlight.fillLight';
    downlightFill.userData = { ...downlightFill.userData, baseIntensity: 6.0 };
    downlightFill.position.set(-19.9, LIVING_CEILING_Y - 0.25, -0.2);
    scene.add(downlightFill);
    ctx.lightGroups.livingRoomDownlights.lights.push(downlightFill);
  }

  // 3. Issue #2: Actual Ruggable "Vesper Olive & Gold Tufted Rug" (size 185x275 -> 2.75m W × 1.85m D, `livingRoom.persianRug`)
  //    & Issue #3: Loaf "Cuddlemuffin" Chaise Cinema Sofa in Treacle Tart Yellow Clever Velvet (`livingRoom.chaiseSofa`)
  {
    // 3A. Ruggable Vesper Olive & Gold Tufted Rug (2.75m W × 1.85m D at [-20.02, tier2FloorY, -0.64])
    //     Uses the authentic Ruggable Vesper Olive & Gold overhead flat-lay photograph (`/textures/vesper-olive-gold-rug.jpg`).
    const persianRugGroup = new THREE.Group();
    persianRugGroup.name = 'livingRoom.persianRug';
    persianRugGroup.userData.zone = 'livingRoom';
    persianRugGroup.position.set(-20.02, tier2FloorY, -0.64);
    persianRugGroup.rotation.y = THREE.MathUtils.degToRad(-8.627);

    const vesperRugTex = new THREE.TextureLoader().load(
      `${import.meta.env?.BASE_URL ?? '/'}textures/vesper-olive-gold-rug.jpg`
    );
    vesperRugTex.colorSpace = THREE.SRGBColorSpace;
    vesperRugTex.anisotropy = 8;

    const rugEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x3b382c, // Dark olive-charcoal Ruggable bound overlock edge
      roughness: 0.9,
      metalness: 0.01,
    });
    const vesperRugTopMat = new THREE.MeshStandardMaterial({
      map: vesperRugTex,
      roughness: 0.88,
      metalness: 0.01,
    });

    // Exact 185x275 cm dimensions (2.75m East-West width × 1.85m North-South depth × 8mm tufted pile + pad)
    const rugW = 2.75;
    const rugD = 1.85;
    const persianRugMesh = new THREE.Mesh(
      new THREE.BoxGeometry(rugW, 0.008, rugD),
      [
        rugEdgeMat,      // +X
        rugEdgeMat,      // -X
        vesperRugTopMat, // +Y (top face with Ruggable Vesper Olive & Gold texture)
        rugEdgeMat,      // -Y
        rugEdgeMat,      // +Z
        rugEdgeMat,      // -Z
      ]
    );
    persianRugMesh.name = 'livingRoom.persianRug.body';
    persianRugMesh.position.set(0, 0.004, 0);
    persianRugMesh.receiveShadow = true;
    persianRugGroup.add(persianRugMesh);

    scene.add(persianRugGroup);

    // 3B. Issue #3: Loaf "Cuddlemuffin" Chaise Cinema Sofa in Treacle Tart Yellow Clever Velvet
    //     (https://loaf.com/products/cuddlemuffin-chaise-cinema-sofa?size=cinema&colour-global=treacle-tart-yellow&material-global=clv-velv,
    //      matching top-center photo of media_1790587491808.png!)
    //     - 3 deep modular upholstered base blocks right to the floor (on hidden 15mm dark glides, NO walnut plinth)
    //     - 3 ultra-thick, squidgy, crowned feather-wrapped seat cushions (West module extends forward as the deep Chaise section)
    //     - Wide, low-slung, pillow-top bolster arms curving over the West & East ends
    //     - 6 matching Treacle Tart Yellow Clever Velvet pinched-flange back & corner scatter cushions
    const chaiseSofaGroup = new THREE.Group();
    chaiseSofaGroup.name = 'livingRoom.chaiseSofa';
    chaiseSofaGroup.userData.zone = 'livingRoom';
    chaiseSofaGroup.position.set(-20.101, tier2FloorY, -0.044);
    chaiseSofaGroup.rotation.y = THREE.MathUtils.degToRad(-8.502);

    // Procedural Treacle Tart Yellow Clever Velvet texture (subtle warm golden-ochre velvet nap & pile sheen)
    const velvetCanvas = document.createElement('canvas');
    velvetCanvas.width = 256;
    velvetCanvas.height = 256;
    const vCtx = velvetCanvas.getContext('2d');
    if (vCtx) {
      vCtx.fillStyle = '#a46d1d'; // Loaf Treacle Tart Yellow Clever Velvet base
      vCtx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 2) {
        for (let x = 0; x < 256; x += 2) {
          const n =
            Math.sin(x * 0.17 + y * 0.11) * 6 +
            Math.cos(x * 0.43 - y * 0.29) * 5 +
            ((x * 13 + y * 29) % 9) -
            4;
          const r = Math.min(255, Math.max(0, Math.round(164 + n * 1.3)));
          const g = Math.min(255, Math.max(0, Math.round(109 + n * 0.95)));
          const b = Math.min(255, Math.max(0, Math.round(29 + n * 0.4)));
          vCtx.fillStyle = `rgb(${r},${g},${b})`;
          vCtx.fillRect(x, y, 2, 2);
        }
      }
    }
    const treacleVelvetTex = new THREE.CanvasTexture(velvetCanvas);
    treacleVelvetTex.colorSpace = THREE.SRGBColorSpace;
    treacleVelvetTex.wrapS = THREE.RepeatWrapping;
    treacleVelvetTex.wrapT = THREE.RepeatWrapping;
    treacleVelvetTex.repeat.set(3, 3);

    const treacleVelvetMat = new THREE.MeshStandardMaterial({
      color: 0xf6ebd2, // Multiplies with #a46d1d texture for warm golden-ochre velvet
      map: treacleVelvetTex,
      roughness: 0.72,
      metalness: 0.03,
    });
    const treacleWeltMat = new THREE.MeshStandardMaterial({
      color: 0x895814, // Self-piped / flanged seam trim in deeper Treacle Tart Yellow velvet
      roughness: 0.74,
      metalness: 0.02,
    });
    const hiddenGlideMat = new THREE.MeshStandardMaterial({
      color: 0x1d1915, // Low 15mm recessed dark glides beneath modular base blocks
      roughness: 0.5,
    });

    /**
     * Builds a Loaf Cuddlemuffin pinched-flange feather pillow geometry
     * with soft belly crown and signature pinched Oxford corner ears.
     */
    const createCuddlemuffinPillowGeo = (
      widthX: number,
      heightY: number,
      depthZ: number
    ): THREE.BufferGeometry => {
      const geo = createSculptedCushionGeometry(
        widthX,
        heightY,
        depthZ,
        20,
        16,
        12,
        0.62,
        'standard'
      );
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const hw = widthX * 0.5;
      const hh = heightY * 0.5;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const nx = hw > 1e-5 ? x / hw : 0;
        const ny = hh > 1e-5 ? y / hh : 0;
        // Subtle tailored corner pinch without bubbly ear flare
        const cornerFactor = Math.pow(nx * nx * ny * ny, 1.1);
        const topSlouch =
          ny > 0.25 ? Math.exp(-nx * nx * 5.0) * (ny - 0.25) * 0.008 : 0;
        pos.setXYZ(
          i,
          x * (1 + cornerFactor * 0.012),
          y * (1 + cornerFactor * 0.01) - topSlouch,
          z * (1 - cornerFactor * 0.12)
        );
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      return geo;
    };

    const pillowGeoCache = new Map<string, THREE.BufferGeometry>();
    const getCuddlemuffinPillowGeo = (w: number, h: number, d: number): THREE.BufferGeometry => {
      const key = `${w.toFixed(4)}_${h.toFixed(4)}_${d.toFixed(4)}`;
      let geo = pillowGeoCache.get(key);
      if (!geo) {
        geo = createCuddlemuffinPillowGeo(w, h, d);
        pillowGeoCache.set(key, geo);
      }
      return geo;
    };

    // 1. Hidden Low Glides (Y = 0.00..0.016m)
    const glideGeo = createSharedGeo(new THREE.CylinderGeometry(0.032, 0.028, 0.016, 10));
    for (const [gx, gz] of [
      [-1.18, -1.16],
      [-0.48, -1.16],
      [-1.18, 0.38],
      [-0.42, -0.44],
      [0.42, -0.44],
      [1.18, -0.44],
      [1.18, 0.38],
    ] as const) {
      const glide = tagHighLod(
        new THREE.Mesh(glideGeo, hiddenGlideMat)
      );
      glide.name = 'livingRoom.chaiseSofa.glide';
      glide.position.set(gx, 0.008, gz);
      chaiseSofaGroup.add(glide);
    }

    // 2. 3 Deep Upholstered Modular Base Blocks Right to the Floor (Y = 0.014..0.224m, height 0.21m)
    //    Separated by visible vertical modular seams at X = -0.415m and X = +0.415m (matching Cuddlemuffin photo!)
    const moduleWidth = 0.82;
    const westChaiseBase = new THREE.Mesh(
      createSharedGeo(createSculptedCushionGeometry(moduleWidth, 0.21, 1.54, 18, 10, 20, 0.34, 'standard')),
      treacleVelvetMat
    );
    westChaiseBase.name = 'livingRoom.chaiseSofa.chaiseDeck';
    westChaiseBase.position.set(-0.83, 0.119, -0.34); // spans Z = -1.11..+0.43
    westChaiseBase.castShadow = true;
    westChaiseBase.receiveShadow = true;
    chaiseSofaGroup.add(westChaiseBase);

    const modBaseGeo = createSharedGeo(
      createSculptedCushionGeometry(moduleWidth, 0.21, 0.92, 16, 10, 14, 0.34, 'standard')
    );
    const seamCordGeo = createSharedGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.19, 8));
    for (const [mIdx, mx, mName] of [
      [1, 0.0, 'livingRoom.chaiseSofa.mainDeck'],
      [2, 0.83, 'livingRoom.chaiseSofa.eastDeck'],
    ] as const) {
      const modBase = new THREE.Mesh(
        modBaseGeo,
        treacleVelvetMat
      );
      modBase.name = mName;
      modBase.position.set(mx, 0.119, -0.03); // spans Z = -0.49..+0.43
      modBase.castShadow = true;
      modBase.receiveShadow = true;
      chaiseSofaGroup.add(modBase);

      // Subtle vertical shadow-channel welt between adjacent modular base sections
      const seamX = mIdx === 1 ? -0.415 : 0.415;
      const seamCord = tagHighLod(
        new THREE.Mesh(seamCordGeo, treacleWeltMat)
      );
      seamCord.name = `livingRoom.chaiseSofa.seamWelt.${mIdx}`;
      seamCord.position.set(seamX, 0.119, -0.47);
      chaiseSofaGroup.add(seamCord);
    }

    // 3. 3 Ultra-Thick, Squidgy, Crowned Feather-Wrapped Seat Cushions (Y = 0.21..0.46m, thickness 0.25m)
    //    West Module = Extended Chaise Lounge Cushion; Center & East Modules = Deep Cinema Seat Cushions
    const chaiseCushion = new THREE.Mesh(
      createSharedGeo(createSculptedCushionGeometry(0.83, 0.25, 1.48, 22, 12, 24, 0.56, 'standard')),
      treacleVelvetMat
    );
    chaiseCushion.name = 'livingRoom.chaiseSofa.chaiseCushion';
    chaiseCushion.position.set(-0.83, 0.33, -0.42); // overhangs front slightly to Z = -1.16
    chaiseCushion.castShadow = true;
    chaiseCushion.receiveShadow = true;
    chaiseSofaGroup.add(chaiseCushion);

    const seatCushionGeo = createSharedGeo(
      createSculptedCushionGeometry(0.83, 0.25, 0.84, 20, 12, 18, 0.56, 'standard')
    );
    for (const [cIdx, cx] of [
      [1, 0.0],
      [2, 0.83],
    ] as const) {
      const seatCushion = new THREE.Mesh(
        seatCushionGeo,
        treacleVelvetMat
      );
      seatCushion.name = `livingRoom.chaiseSofa.seatCushion.${cIdx}`;
      seatCushion.position.set(cx, 0.33, -0.1); // overhangs front slightly to Z = -0.52
      seatCushion.castShadow = true;
      seatCushion.receiveShadow = true;
      chaiseSofaGroup.add(seatCushion);
    }

    // 4. Low, Wide, Pillow-Top Bolster Arms on West (X = -1.35m) and East (X = +1.35m)
    //    Each arm has a full-to-floor upholstered lower block + a super-rounded pillow-top bolster cap curving over the top!
    const armLowerGeo = createSharedGeo(
      createSculptedCushionGeometry(0.24, 0.44, 0.94, 14, 12, 16, 0.36, 'standard')
    );
    const armBolsterTopGeo = createSharedGeo(
      createSculptedCushionGeometry(0.25, 0.09, 0.94, 14, 10, 14, 0.38, 'standard')
    );
    for (const [armSide, armX, armName] of [
      [-1, -1.35, 'livingRoom.chaiseSofa.westArm'],
      [1, 1.35, 'livingRoom.chaiseSofa.eastArm'],
    ] as const) {
      const armLower = new THREE.Mesh(
        armLowerGeo,
        treacleVelvetMat
      );
      armLower.name = armName;
      armLower.position.set(armX, 0.234, -0.02); // spans Z = -0.49..+0.45
      armLower.castShadow = true;
      armLower.receiveShadow = true;
      chaiseSofaGroup.add(armLower);

      // Clean tailored bolster arm pad on top of the arm
      const armBolsterTop = new THREE.Mesh(
        armBolsterTopGeo,
        treacleVelvetMat
      );
      armBolsterTop.name = `${armName}.bolsterTop`;
      armBolsterTop.position.set(armX - armSide * 0.005, 0.475, -0.02);
      armBolsterTop.rotation.z = armSide * -0.02;
      armBolsterTop.castShadow = true;
      armBolsterTop.receiveShadow = true;
      chaiseSofaGroup.add(armBolsterTop);
    }

    // 5. Full-Width Low-Slung Upholstered Backrest Shell (width 2.94m, height 0.68m, Y = 0.014..0.694m, Z = +0.39m)
    const backrestShell = new THREE.Mesh(
      createSharedGeo(createSculptedCushionGeometry(2.94, 0.68, 0.22, 24, 12, 10, 0.38, 'standard')),
      treacleVelvetMat
    );
    backrestShell.name = 'livingRoom.chaiseSofa.backrestShell';
    backrestShell.position.set(0, 0.354, 0.39);
    backrestShell.rotation.x = -0.06;
    backrestShell.castShadow = true;
    backrestShell.receiveShadow = true;
    chaiseSofaGroup.add(backrestShell);

    // 6. 3 Large Squidgy Pinched-Flange Feather Back Cushions in Matching Treacle Tart Yellow Clever Velvet
    const backPillowGeo = getCuddlemuffinPillowGeo(0.82, 0.46, 0.22);
    for (const [bIdx, bx] of [
      [1, -0.83],
      [2, 0.0],
      [3, 0.83],
    ] as const) {
      const backPillow = new THREE.Mesh(
        backPillowGeo,
        treacleVelvetMat
      );
      backPillow.name = `livingRoom.chaiseSofa.backPillow.${bIdx}`;
      backPillow.position.set(bx, 0.61, 0.2);
      backPillow.rotation.x = -0.18;
      backPillow.castShadow = true;
      backPillow.receiveShadow = true;
      chaiseSofaGroup.add(backPillow);
    }

    // 7. 3 Matching Treacle Tart Yellow Clever Velvet Pinched-Flange Corner & Lumbar Scatter Pillows
    //    (matching the monochrome Loaf Cuddlemuffin Chaise Cinema Sofa product photography!)
    for (const [sIdx, sx, sy, sz, rotX, rotY, rotZ, w, h, d] of [
      [1, -1.05, 0.57, 0.02, -0.2, 0.36, -0.1, 0.48, 0.42, 0.17],
      [2, -0.56, 0.54, 0.04, -0.26, 0.14, -0.04, 0.44, 0.36, 0.16],
      [3, 1.05, 0.57, 0.04, -0.2, -0.36, 0.1, 0.48, 0.42, 0.17],
    ] as const) {
      const scatter = new THREE.Mesh(
        getCuddlemuffinPillowGeo(w, h, d),
        treacleVelvetMat
      );
      scatter.name = `livingRoom.chaiseSofa.scatterPillow.${sIdx}`;
      scatter.position.set(sx, sy, sz);
      scatter.rotation.set(rotX, rotY, rotZ);
      scatter.castShadow = true;
      scatter.receiveShadow = true;
      chaiseSofaGroup.add(scatter);
    }

    scene.add(chaiseSofaGroup);

    // Substantial Dark-Wood Coffee Table positioned cleanly in front of the L-Shaped Chaise Sofa (Issue #6: X = -19.56m, Z = -1.18m)
    const coffeeTableGroup = new THREE.Group();
    coffeeTableGroup.name = 'livingRoom.coffeeTable';
    coffeeTableGroup.userData.zone = 'livingRoom';
    coffeeTableGroup.position.set(-19.401, tier2FloorY, -1.332);
    coffeeTableGroup.rotation.y = THREE.MathUtils.degToRad(-8.811);

    const darkWalnutCoffeeTableMat = new THREE.MeshStandardMaterial({
      color: 0x462e1b, // Rich dark smoked oak / American black walnut
      roughness: 0.44,
      metalness: 0.04,
    });
    const darkWalnutEndGrainMat = new THREE.MeshStandardMaterial({
      color: 0x382414,
      roughness: 0.52,
      metalness: 0.03,
    });

    // Thick 64mm planked solid dark-wood tabletop (1.18m x 0.064m x 0.66m, top at Y = 0.42m)
    const ctTop = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.18, 0.064, 0.66)),
      darkWalnutCoffeeTableMat
    );
    ctTop.name = 'livingRoom.coffeeTable.top';
    ctTop.position.set(0, 0.388, 0);
    ctTop.castShadow = true;
    ctTop.receiveShadow = true;
    coffeeTableGroup.add(ctTop);

    // Recessed under-top apron frame (1.08m x 0.048m x 0.56m)
    const ctApron = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.08, 0.048, 0.56)),
      darkWalnutEndGrainMat
    );
    ctApron.name = 'livingRoom.coffeeTable.apron';
    ctApron.position.set(0, 0.334, 0);
    ctApron.castShadow = true;
    coffeeTableGroup.add(ctApron);

    // 4 Substantial 92mm x 92mm square corner timber posts
    const ctPostGeo = createSharedGeo(new THREE.BoxGeometry(0.092, 0.36, 0.092));
    for (const [lx, lz] of [
      [-0.49, -0.23],
      [0.49, -0.23],
      [-0.49, 0.23],
      [0.49, 0.23],
    ] as const) {
      const ctPost = new THREE.Mesh(
        ctPostGeo,
        darkWalnutCoffeeTableMat
      );
      ctPost.name = 'livingRoom.coffeeTable.leg';
      ctPost.position.set(lx, 0.18, lz);
      ctPost.castShadow = true;
      ctPost.receiveShadow = true;
      coffeeTableGroup.add(ctPost);
    }

    // Substantial lower solid dark-wood undertier shelf (1.06m x 0.036m x 0.52m at Y = 0.11m)
    const ctShelf = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.06, 0.036, 0.52)),
      darkWalnutCoffeeTableMat
    );
    ctShelf.name = 'livingRoom.coffeeTable.lowerShelf';
    ctShelf.position.set(0, 0.11, 0);
    ctShelf.castShadow = true;
    ctShelf.receiveShadow = true;
    coffeeTableGroup.add(ctShelf);

    // Issue #3: Curated Hardcover Coffee-Table Books on `livingRoom.coffeeTable.top` (top surface at local Y = 0.42m / world Y = -0.18m)
    const pageBlockMat = new THREE.MeshStandardMaterial({
      color: 0xf2eadc,
      roughness: 0.78,
      metalness: 0.01,
    });

    const createCoffeeTableBookCoverTexture = (
      bgHex: string,
      accentHex: string,
      titleLine1: string,
      titleLine2: string,
      subtitle: string,
      motif: 'estate' | 'shire' | 'cinema' | 'morris' | 'classical'
    ): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const c = canvas.getContext('2d');
      if (c) {
        c.fillStyle = bgHex;
        c.fillRect(0, 0, 512, 384);

        // Subtle woven linen bookcloth grain
        c.strokeStyle = 'rgba(255,255,255,0.035)';
        c.lineWidth = 1;
        for (let y = 0; y < 384; y += 3) {
          c.beginPath();
          c.moveTo(0, y);
          c.lineTo(512, y);
          c.stroke();
        }
        for (let x = 0; x < 512; x += 4) {
          c.beginPath();
          c.moveTo(x, 0);
          c.lineTo(x, 384);
          c.stroke();
        }

        // Outer & inner debossed foil border rules
        c.strokeStyle = accentHex;
        c.lineWidth = 2.5;
        c.strokeRect(22, 20, 468, 344);
        c.lineWidth = 1;
        c.strokeRect(30, 28, 452, 328);

        // Typography header
        c.fillStyle = accentHex;
        c.textAlign = 'center';
        c.font = '600 24px Georgia, serif';
        c.fillText(titleLine1, 256, 78);
        c.font = 'italic 16px Georgia, serif';
        c.fillText(titleLine2, 256, 106);

        // Central vignette artwork panel
        const vx = 126;
        const vy = 128;
        const vw = 260;
        const vh = 160;
        c.fillStyle = 'rgba(12, 12, 14, 0.28)';
        c.fillRect(vx, vy, vw, vh);
        c.strokeStyle = accentHex;
        c.lineWidth = 1.5;
        c.strokeRect(vx, vy, vw, vh);

        if (motif === 'estate') {
          // Classical Georgian country house facade elevation
          c.strokeStyle = accentHex;
          c.lineWidth = 1.6;
          c.strokeRect(vx + 45, vy + 62, 170, 74);
          c.beginPath();
          c.moveTo(vx + 38, vy + 62);
          c.lineTo(vx + 130, vy + 26);
          c.lineTo(vx + 222, vy + 62);
          c.closePath();
          c.stroke();
          for (let wx = vx + 62; wx <= vx + 198; wx += 34) {
            c.strokeRect(wx - 7, vy + 76, 14, 24);
            c.strokeRect(wx - 7, vy + 108, 14, 26);
          }
        } else if (motif === 'shire') {
          // Moody misty mountains & dramatic glowing ring/bridge emblem
          c.strokeStyle = accentHex;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(256, vy + 78, 38, 0, Math.PI * 2);
          c.stroke();
          c.beginPath();
          c.moveTo(vx + 24, vy + 142);
          c.lineTo(vx + 88, vy + 74);
          c.lineTo(vx + 134, vy + 112);
          c.lineTo(vx + 184, vy + 58);
          c.lineTo(vx + 236, vy + 142);
          c.stroke();
        } else if (motif === 'cinema') {
          // High-contrast chiaroscuro architectural light beams
          const grad = c.createLinearGradient(vx, vy, vx + vw, vy + vh);
          grad.addColorStop(0, '#141416');
          grad.addColorStop(0.55, '#d8cfb8');
          grad.addColorStop(1, '#18181b');
          c.fillStyle = grad;
          c.fillRect(vx + 16, vy + 16, vw - 32, vh - 32);
        } else if (motif === 'morris') {
          // Botanical Arts & Crafts symmetrical floral medallion
          c.strokeStyle = accentHex;
          c.lineWidth = 1.6;
          for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            c.beginPath();
            c.ellipse(
              256 + Math.cos(ang) * 32,
              vy + 80 + Math.sin(ang) * 26,
              22,
              10,
              ang,
              0,
              Math.PI * 2
            );
            c.stroke();
          }
        } else {
          // Classical Palladian arch & proportion circles
          c.strokeStyle = accentHex;
          c.lineWidth = 1.5;
          c.strokeRect(vx + 56, vy + 28, 148, 108);
          c.beginPath();
          c.arc(256, vy + 82, 44, 0, Math.PI * 2);
          c.stroke();
        }

        // Footer colophon
        c.fillStyle = accentHex;
        c.font = '500 13px Georgia, serif';
        c.fillText(subtitle, 256, 326);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
    };

    const addHardcoverCoffeeTableBook = (
      id: string,
      cx: number,
      bottomY: number,
      cz: number,
      widthX: number,
      heightY: number,
      depthZ: number,
      rotY: number,
      coverColorHex: number,
      coverTex: THREE.CanvasTexture
    ): number => {
      const bookGroup = new THREE.Group();
      bookGroup.name = `livingRoom.coffeeTable.book.${id}`;
      bookGroup.position.set(cx, bottomY, cz);
      bookGroup.rotation.y = rotY;

      const clothMat = new THREE.MeshStandardMaterial({
        color: coverColorHex,
        roughness: 0.64,
        metalness: 0.04,
      });
      const frontCoverTopMat = new THREE.MeshStandardMaterial({
        map: coverTex,
        roughness: 0.52,
        metalness: 0.06,
      });

      const boardThick = 0.0036;
      const pageH = Math.max(0.01, heightY - boardThick * 2);
      const boardGeo = createSharedGeo(new THREE.BoxGeometry(widthX, boardThick, depthZ));

      // Bottom hardcover board
      const bottomBoard = tagHighLod(
        new THREE.Mesh(boardGeo, clothMat)
      );
      bottomBoard.name = `livingRoom.coffeeTable.book.${id}.bottomBoard`;
      bottomBoard.position.set(0, boardThick * 0.5, 0);
      bottomBoard.castShadow = true;
      bottomBoard.receiveShadow = true;
      bookGroup.add(bottomBoard);

      // Recessed cream paper page block
      const pages = tagHighLod(
        new THREE.Mesh(
          createSharedGeo(new THREE.BoxGeometry(widthX - 0.008, pageH, depthZ - 0.006)),
          pageBlockMat
        )
      );
      pages.name = `livingRoom.coffeeTable.book.${id}.pages`;
      pages.position.set(0, boardThick + pageH * 0.5, -0.002);
      pages.castShadow = true;
      pages.receiveShadow = true;
      bookGroup.add(pages);

      // Top hardcover board with illustrated jacket texture on its +Y face
      const topBoard = new THREE.Mesh(
        boardGeo,
        [
          clothMat,
          clothMat,
          frontCoverTopMat,
          clothMat,
          clothMat,
          clothMat,
        ]
      );
      topBoard.name = `livingRoom.coffeeTable.book.${id}.cover`;
      topBoard.position.set(0, heightY - boardThick * 0.5, 0);
      topBoard.castShadow = true;
      topBoard.receiveShadow = true;
      bookGroup.add(topBoard);

      // Rounded cloth spine along the South (+Z) edge facing the sofa
      const spineGeo = new THREE.CylinderGeometry(
        heightY * 0.5,
        heightY * 0.5,
        widthX,
        14,
        1,
        false,
        0,
        Math.PI
      );
      spineGeo.rotateZ(Math.PI / 2);
      spineGeo.computeBoundingSphere();
      const spineMesh = tagHighLod(
        new THREE.Mesh(spineGeo, clothMat)
      );
      spineMesh.name = `livingRoom.coffeeTable.book.${id}.spine`;
      spineMesh.position.set(0, heightY * 0.5, depthZ * 0.5);
      spineMesh.castShadow = true;
      bookGroup.add(spineMesh);

      coffeeTableGroup.add(bookGroup);
      return bottomY + heightY;
    };

    const tableTopSurfaceY = 0.42;

    // East Stack of 3 Coffee-Table Books (centered around local X = +0.15m, Z = +0.025m -> world [-19.251, -0.18, -1.307])
    let eastStackY = tableTopSurfaceY;
    eastStackY = addHardcoverCoffeeTableBook(
      'englishCountryHouses',
      0.15,
      eastStackY,
      0.025,
      0.34,
      0.036,
      0.255,
      0.06,
      0x1f3b2c,
      createCoffeeTableBookCoverTexture(
        '#1f3b2c',
        '#d8b878',
        'ENGLISH COUNTRY HOUSES',
        'Architecture & Period Interiors',
        'THAMES & HUDSON · LONDON',
        'estate'
      )
    );
    eastStackY = addHardcoverCoffeeTableBook(
      'artOfMiddleEarth',
      0.145,
      eastStackY,
      0.02,
      0.295,
      0.03,
      0.22,
      -0.05,
      0x4a1e1b,
      createCoffeeTableBookCoverTexture(
        '#4a1e1b',
        '#e2be78',
        'THE ART OF MIDDLE-EARTH',
        'From the Shire to Khazad-dûm',
        'HARPERCOLLINS · COLLECTOR EDITION',
        'shire'
      )
    );
    addHardcoverCoffeeTableBook(
      'cinemaAndLight',
      0.152,
      eastStackY,
      0.022,
      0.25,
      0.024,
      0.19,
      0.04,
      0xe6decb,
      createCoffeeTableBookCoverTexture(
        '#e6decb',
        '#23211e',
        'BYWAYS & SHADOW',
        'Roger Deakins · Cinematography',
        'DAMIANI · MONOGRAPH',
        'cinema'
      )
    );

    // West Stack of 2 Coffee-Table Books (centered around local X = -0.21m, Z = -0.03m)
    let westStackY = tableTopSurfaceY;
    westStackY = addHardcoverCoffeeTableBook(
      'williamMorrisDesign',
      -0.21,
      westStackY,
      -0.03,
      0.31,
      0.034,
      0.24,
      -0.04,
      0x223042,
      createCoffeeTableBookCoverTexture(
        '#223042',
        '#d6ba84',
        'WILLIAM MORRIS',
        'Pimpernel & Arts and Crafts Textiles',
        'V&A PUBLISHING · LONDON',
        'morris'
      )
    );
    addHardcoverCoffeeTableBook(
      'georgianProportion',
      -0.205,
      westStackY,
      -0.028,
      0.265,
      0.028,
      0.205,
      0.07,
      0x8c5332,
      createCoffeeTableBookCoverTexture(
        '#8c5332',
        '#f0e2c8',
        'PALLADIO & PROPORTION',
        'Classical Joinery & Detail',
        'PHAIDON · ARCHITECTURE',
        'classical'
      )
    );

    scene.add(coffeeTableGroup);
  }

  // Plasterboard ceiling backing above the exposed oak spine beam & joists (seals the 1.625m Living Room ceiling from below
  // flush to the rotated East Cross-Wall [-16.876, -2.49] -> [-17.891, 2.48] — Issue #4)
  buildPolygonalFloorSlab(
    groundFloorCeilingGroup,
    [
      [-22.32, -3.22],
      [-16.876, -2.49],
      [-17.891, 2.48],
      [-22.32, 1.93],
    ],
    frontWallH + 0.012,
    0.036,
    warmRoomPlasterMat,
    0.5
  ).name = 'livingRoom.ceilingBacking';

  // Natural Dark-Stained Oak East-West Spine Beam & North-South Ceiling Joists in Front Room (New Photo 5 top)
  // Spans from X = -22.21m, Z = -0.642m (embedded into West exterior brick wall) to X = -17.40m, Z = -0.002m (embedded into angled East Cross-Wall)
  const frontRoomDarkSpineBeam = new THREE.Mesh(
    new THREE.BoxGeometry(4.85, 0.19, 0.2),
    oakMat
  );
  frontRoomDarkSpineBeam.name = 'livingRoom.spineBeam';
  frontRoomDarkSpineBeam.position.set(-19.805, frontWallH - 0.15, -0.322);
  frontRoomDarkSpineBeam.rotation.y = -Math.atan2(0.705, 5.27);
  frontRoomDarkSpineBeam.castShadow = true;
  groundFloorCeilingGroup.add(frontRoomDarkSpineBeam);

  // North-South Ceiling Joists spanning across `frontRoomDarkSpineBeam`:
  // - Joists in the South Chimney Breast bay (fjx = -20.75m, -20.35m, -19.95m) bear into the North face of the masonry chimney breast
  //   instead of cutting through the flue!
  // - Joists only run where they cross `frontRoomDarkSpineBeam` (fjx <= -17.55m), bearing into the North wall, Spine Beam, and South/East walls.
  for (let fjx = -21.95; fjx <= -17.5; fjx += 0.4) {
    const zNorth = -3.18 + (0.711 / 5.314) * (fjx + 22.19) - 0.02;
    const hitsSouthChimneyBreast = fjx >= -21.14 && fjx <= -19.86;
    const zSouthWall =
      1.905 +
      (0.575 / 4.299) * (fjx + 22.19) -
      (hitsSouthChimneyBreast ? 0.525 : 0.12);
    const zEastCrossWall = -2.469 + ((-16.956 - fjx) / 1.015) * 4.949 - 0.04;
    const zSouth = Math.min(zSouthWall, zEastCrossWall);
    const joistLen = zSouth - zNorth;
    if (joistLen < 0.45) continue;
    const darkJoist = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.12, joistLen),
      oakMat
    );
    darkJoist.name = 'livingRoom.ceilingJoist';
    darkJoist.position.set(fjx, frontWallH - 0.08, (zNorth + zSouth) * 0.5);
    darkJoist.castShadow = true;
    groundFloorCeilingGroup.add(darkJoist);
  }

  // Ceiling-Mounted Valerion VisionMaster Max 4K RGB Triple-Laser Projector (`livingRoom.ceilingProjector` — Issue #15)
  // Authentic 260mm W × 186mm H × 234mm D chassis featuring 14 wrap-around metallic fin ribs,
  // volcanic black tempered-glass front fascia, 6-blade mechanical iris, and OpticFlex bayonet short-throw lens.
  // Mounted in the center of the Living Room directly in front of (North of) `livingRoom.spineBeam`
  // at world (-19.818, frontWallH - 0.125, -0.575), centered between ceiling joists (fjx = -19.95m and -19.55m).
  {
    const projectorGroup = new THREE.Group();
    projectorGroup.name = 'livingRoom.ceilingProjector';
    projectorGroup.userData = {
      zone: 'livingRoom',
      make: 'Valerion',
      model: 'VisionMaster Max',
    };
    projectorGroup.position.set(-19.818, frontWallH - 0.125, -0.575);
    projectorGroup.rotation.y = -Math.atan2(0.705, 5.27);

    const valerionCoreMat = new THREE.MeshStandardMaterial({
      color: 0x0f1115, // Deep matte volcanic obsidian inner body between the 14 ribs
      roughness: 0.62,
      metalness: 0.32,
    });
    const valerionRibMat = new THREE.MeshStandardMaterial({
      color: 0x262930, // Electroplated dark gunmetal-titanium wrap-around metallic fin ribs
      roughness: 0.26,
      metalness: 0.84,
    });
    const valerionGoldAccentMat = new THREE.MeshStandardMaterial({
      color: 0x9e7a4c, // Signature Valerion champagne-bronze/gold accent rib & OpticFlex bayonet ring
      roughness: 0.28,
      metalness: 0.86,
    });
    const volcanicGlassMat = new THREE.MeshStandardMaterial({
      color: 0x08090c, // Glossy volcanic black tempered-glass front & rear panels
      roughness: 0.12,
      metalness: 0.22,
    });
    const projOpticalLensMat = new THREE.MeshStandardMaterial({
      color: 0xd8f0ff,
      emissive: 0x8ec8ff,
      emissiveIntensity: 0.85, // Multi-coated aspherical RGB triple-laser projection optics
      roughness: 0.1,
      metalness: 0.25,
    });

    // 1. Official Valerion Ceiling Mount (CM-CC-01): circular ceiling rose plate, telescoping column & gimbal ball head
    const ceilingPlate = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.072, 0.076, 0.012, 24)),
      valerionCoreMat
    );
    ceilingPlate.name = 'livingRoom.ceilingProjector.ceilingPlate';
    ceilingPlate.position.set(0, 0.095, 0);
    ceilingPlate.castShadow = true;
    projectorGroup.add(ceilingPlate);

    const dropColumn = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.068, 20)),
      valerionCoreMat
    );
    dropColumn.name = 'livingRoom.ceilingProjector.dropColumn';
    dropColumn.position.set(0, 0.056, 0);
    dropColumn.castShadow = true;
    projectorGroup.add(dropColumn);

    const gimbalCollar = new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.026, 0.032, 0.018, 20)),
      valerionGoldAccentMat
    );
    gimbalCollar.name = 'livingRoom.ceilingProjector.gimbalCollar';
    gimbalCollar.position.set(0, 0.016, 0);
    projectorGroup.add(gimbalCollar);

    const topControlPanel = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.18, 0.008, 0.16)),
      valerionCoreMat
    );
    topControlPanel.name = 'livingRoom.ceilingProjector.topControlPanel';
    topControlPanel.position.set(0, 0.004, 0);
    projectorGroup.add(topControlPanel);

    // 2. Valerion VisionMaster Max Core Chassis (exact 260mm W × 186mm H × 234mm D envelope, centered at y = -0.093m)
    const bodyCenterY = -0.093;
    const chassis = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.246, 0.174, 0.228)),
      valerionCoreMat
    );
    chassis.name = 'livingRoom.ceilingProjector.chassis';
    chassis.position.set(0, bodyCenterY, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    projectorGroup.add(chassis);

    // 3. 14 Signature Wrap-Around Electroplated Metal Fin Ribs (260mm W × 186mm H × 7.5mm D each across the 234mm depth)
    const ribGeo = createSharedGeo(new THREE.BoxGeometry(0.26, 0.186, 0.0075));
    for (let rIdx = 0; rIdx < 14; rIdx++) {
      const rz = -0.111 + (rIdx / 13) * 0.222;
      const isFrontOrRearAccent = rIdx === 0 || rIdx === 13;
      const ribMesh = tagHighLod(
        new THREE.Mesh(ribGeo, isFrontOrRearAccent ? valerionGoldAccentMat : valerionRibMat),
        16
      );
      ribMesh.name = `livingRoom.ceilingProjector.rib.${rIdx + 1}`;
      ribMesh.position.set(0, bodyCenterY, rz);
      ribMesh.castShadow = true;
      ribMesh.receiveShadow = true;
      projectorGroup.add(ribMesh);
    }

    // Side acoustic/thermal intake louvre shadow strips recessed between the ribs on Left & Right flanks
    const louvreGeo = createSharedGeo(new THREE.BoxGeometry(0.004, 0.142, 0.214));
    const coolingLouvresLeft = new THREE.Mesh(louvreGeo, valerionCoreMat);
    coolingLouvresLeft.name = 'livingRoom.ceilingProjector.coolingLouvresLeft';
    coolingLouvresLeft.position.set(-0.124, bodyCenterY, 0);
    projectorGroup.add(coolingLouvresLeft);

    const coolingLouvresRight = new THREE.Mesh(louvreGeo, valerionCoreMat);
    coolingLouvresRight.name = 'livingRoom.ceilingProjector.coolingLouvresRight';
    coolingLouvresRight.position.set(0.124, bodyCenterY, 0);
    projectorGroup.add(coolingLouvresRight);

    // 4. Volcanic Black Tempered-Glass Front Fascia (Z = -0.115m) & Rear Panel (Z = +0.115m)
    const glassPanelGeo = createSharedGeo(new THREE.BoxGeometry(0.244, 0.172, 0.004));
    const frontGlass = new THREE.Mesh(glassPanelGeo, volcanicGlassMat);
    frontGlass.name = 'livingRoom.ceilingProjector.frontGlass';
    frontGlass.position.set(0, bodyCenterY, -0.115);
    projectorGroup.add(frontGlass);

    const rearGlass = tagHighLod(new THREE.Mesh(glassPanelGeo, volcanicGlassMat));
    rearGlass.name = 'livingRoom.ceilingProjector.rearGlass';
    rearGlass.position.set(0, bodyCenterY, 0.115);
    projectorGroup.add(rearGlass);

    // 5. OpticFlex Motorized Zoom + External Bayonet Short-Throw Conversion Lens & 6-Blade Mechanical Iris
    //    Positioned on the upper-left quadrant of the inverted front fascia (X = -0.044m, Y = bodyCenterY - 0.012m)
    const lensX = -0.044;
    const lensY = bodyCenterY - 0.012;

    // Stepped bayonet short-throw optical barrel protruding North (-Z) from the volcanic glass front fascia
    const lensBarrelGeo = new THREE.CylinderGeometry(0.044, 0.049, 0.042, 28);
    lensBarrelGeo.rotateX(Math.PI / 2);
    lensBarrelGeo.computeBoundingSphere();
    const lensBarrel = new THREE.Mesh(lensBarrelGeo, valerionRibMat);
    lensBarrel.name = 'livingRoom.ceilingProjector.lensBarrel';
    lensBarrel.position.set(lensX, lensY, -0.136);
    lensBarrel.castShadow = true;
    projectorGroup.add(lensBarrel);

    // Signature Valerion champagne-bronze/gold bayonet mount & focus ring
    const lensRing = new THREE.Mesh(
      createSharedGeo(new THREE.TorusGeometry(0.045, 0.0042, 12, 28)),
      valerionGoldAccentMat
    );
    lensRing.name = 'livingRoom.ceilingProjector.lensRing';
    lensRing.position.set(lensX, lensY, -0.156);
    projectorGroup.add(lensRing);

    // 6-blade mechanical iris aperture ring inside the front optical element
    const mechanicalIris = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.RingGeometry(0.022, 0.041, 6)),
        valerionCoreMat
      )
    );
    mechanicalIris.name = 'livingRoom.ceilingProjector.mechanicalIris';
    mechanicalIris.rotation.y = Math.PI;
    mechanicalIris.position.set(lensX, lensY, -0.1575);
    projectorGroup.add(mechanicalIris);

    // Multi-element aspherical glass front optical element facing North toward the 120" THX screen
    const opticalElement = new THREE.Mesh(
      createSharedGeo(new THREE.CircleGeometry(0.041, 28)),
      projOpticalLensMat
    );
    opticalElement.name = 'livingRoom.ceilingProjector.opticalElement';
    opticalElement.rotation.y = Math.PI;
    opticalElement.position.set(lensX, lensY, -0.158);
    projectorGroup.add(opticalElement);

    // ToF + CMOS laser autofocus sensor window on the opposite side of the front volcanic glass fascia
    const tofSensor = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.056, 0.026, 0.004)),
        valerionRibMat
      )
    );
    tofSensor.name = 'livingRoom.ceilingProjector.tofSensor';
    tofSensor.position.set(0.056, lensY, -0.1165);
    projectorGroup.add(tofSensor);

    groundFloorCeilingGroup.add(projectorGroup);
  }
}
