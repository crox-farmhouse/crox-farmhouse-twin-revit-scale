import * as THREE from 'three';
import { createProfiledSkirtingCapGeometry } from '../../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import { PoolTableBreakController } from '../../../../../objects/games/pool-table-break.ts';
import { createSixPocketTableSpec } from '../../../../../objects/games/pool-table-physics.ts';

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
    flute.name = 'outbuildings.barn.cornerBar.counterCarcass.flute';
    flute.position.set(-barDepthX * 0.5 + 0.015, barH * 0.5 - 0.02, rz);
    barGroup.add(flute);
  }

  // Brushed-brass handle on the keg cupboard door
  const kegDoorHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.16, 10),
    brushedBrassMat
  );
  kegDoorHandle.name = 'outbuildings.barn.cornerBar.counterCarcass.doorHandle';
  kegDoorHandle.position.set(-barDepthX * 0.5 - 0.008, barH * 0.5 + 0.12, -0.24);
  barGroup.add(kegDoorHandle);

  // South end panel (`z = +0.555m`) framing the mini-fridge cleanly next to the Stable glass door
  const southEndPanel = new THREE.Mesh(
    new THREE.BoxGeometry(barDepthX - 0.02, barH - 0.04, 0.03),
    heritageGreenMat
  );
  southEndPanel.name = 'outbuildings.barn.cornerBar.southEndPanel';
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
  rearOakUpstand.name = 'outbuildings.barn.cornerBar.oakUpstand';
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
  coolerShellBack.name = 'outbuildings.barn.cornerBar.miniFridge.backWall';
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
    plate.name = 'outbuildings.barn.cornerBar.miniFridge.casingPlate';
    plate.position.set(0, cy, 0);
    coolerGroup.add(plate);
  }
  for (const sSide of [-1, 1] as const) {
    const sideWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, coolerH, coolerD),
      darkAnthraciteMat
    );
    sideWall.name = 'outbuildings.barn.cornerBar.miniFridge.sideWall';
    sideWall.position.set(sSide * (coolerW * 0.5 - 0.018), coolerH * 0.5, 0);
    coolerGroup.add(sideWall);
  }

  // Internal warm LED light strip at top of mini-fridge
  const coolerLed = new THREE.Mesh(
    new THREE.BoxGeometry(coolerW - 0.08, 0.010, 0.024),
    warmLedMat
  );
  coolerLed.name = 'outbuildings.barn.cornerBar.miniFridge.ledStrip';
  coolerLed.position.set(0, coolerH - 0.042, coolerD * 0.5 - 0.06);
  coolerGroup.add(coolerLed);

  // 3 Beechwood pull-out shelves inside the mini-fridge
  for (const sy of [0.06, 0.31, 0.57] as const) {
    const bShelf = new THREE.Mesh(
      new THREE.BoxGeometry(coolerW - 0.08, 0.016, coolerD - 0.08),
      beechShelfMat
    );
    bShelf.name = 'outbuildings.barn.cornerBar.miniFridge.shelf';
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
    bBody.name = `outbuildings.barn.cornerBar.miniFridge.champagneBottle.${i + 1}`;
    bBody.userData = { lodTier: 'high', lodMaxDistance: 12 };
    bBody.position.set(bx, 0.11, -0.04);
    coolerGroup.add(bBody);

    const bFoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.022, 0.065, 12),
      brushedBrassMat
    );
    bFoil.rotation.x = Math.PI / 2;
    bFoil.name = `outbuildings.barn.cornerBar.miniFridge.champagneBottle.${i + 1}.foil`;
    bFoil.userData = { lodTier: 'high', lodMaxDistance: 12 };
    bFoil.position.set(bx, 0.11, 0.08);
    coolerGroup.add(bFoil);
  }

  // Middle shelf: San Pellegrino bottles (left) & Square Fiji Water bottles (right)
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.032, 0.17, 12),
      sanPellegrinoGlassMat
    );
    sp.name = `outbuildings.barn.cornerBar.miniFridge.sanPellegrinoBottle.${i + 1}`;
    sp.userData = { lodTier: 'high', lodMaxDistance: 12 };
    sp.position.set(-0.22 + i * 0.09, 0.405, 0.06);
    coolerGroup.add(sp);

    const fiji = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.165, 0.058),
      fijiBottleMat
    );
    fiji.name = `outbuildings.barn.cornerBar.miniFridge.fijiBottle.${i + 1}`;
    fiji.userData = { lodTier: 'high', lodMaxDistance: 12 };
    fiji.position.set(0.06 + i * 0.09, 0.405, 0.06);
    coolerGroup.add(fiji);
  }

  // Top shelf: 6 chilled craft beer & DASH sparkling water cans
  for (let c = 0; c < 6; c++) {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.112, 12),
      new THREE.MeshStandardMaterial({ color: canPalette[c % canPalette.length], roughness: 0.24, metalness: 0.45 })
    );
    can.name = `outbuildings.barn.cornerBar.miniFridge.drinkCan.${c + 1}`;
    can.userData = { lodTier: 'high', lodMaxDistance: 12 };
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
    rail.name = 'outbuildings.barn.cornerBar.miniFridge.doorRail';
    rail.position.set(0, dy, doorZ);
    coolerGroup.add(rail);
  }
  for (const sSide of [-1, 1] as const) {
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.044, coolerH - 0.088, 0.022), darkAnthraciteMat);
    stile.name = 'outbuildings.barn.cornerBar.miniFridge.doorStile';
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
  fridgeHandle.name = 'outbuildings.barn.cornerBar.miniFridge.doorHandle';
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
  dripTray.name = 'outbuildings.barn.cornerBar.beerTap.dripTray';
  dripTray.position.set(-0.10, 0.007, 0);
  tapGroup.add(dripTray);

  // Brass & chrome T-bar draught font column (`height = 0.32m`) + horizontal cross-arm (`0.24m` wide)
  const fontBaseFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.062, 0.022, 20),
    brushedBrassMat
  );
  fontBaseFlange.name = 'outbuildings.barn.cornerBar.beerTap.baseFlange';
  fontBaseFlange.position.set(0.04, 0.011, 0);
  tapGroup.add(fontBaseFlange);

  const fontColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.040, 0.32, 20),
    brushedBrassMat
  );
  fontColumn.name = 'outbuildings.barn.cornerBar.beerTap.column';
  fontColumn.position.set(0.04, 0.17, 0);
  fontColumn.castShadow = true;
  tapGroup.add(fontColumn);

  const fontCrossBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.24, 18),
    brushedBrassMat
  );
  fontCrossBar.rotation.x = Math.PI / 2;
  fontCrossBar.name = 'outbuildings.barn.cornerBar.beerTap.crossBar';
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
    spout.name = 'outbuildings.barn.cornerBar.beerTap.spout';
    spout.position.set(-0.035, 0.285, tapZ);
    tapGroup.add(spout);

    const handleGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.009, 0.16, 14),
      ceramicWhiteMat
    );
    handleGrip.rotation.z = 0.18;
    handleGrip.name = 'outbuildings.barn.cornerBar.beerTap.pullHandle';
    handleGrip.position.set(-0.025, 0.40, tapZ);
    handleGrip.castShadow = true;
    tapGroup.add(handleGrip);

    const pumpBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.008, 16),
      new THREE.MeshStandardMaterial({ color: badgeCol, roughness: 0.3 })
    );
    pumpBadge.rotation.z = Math.PI / 2;
    pumpBadge.name = 'outbuildings.barn.cornerBar.beerTap.pumpBadge';
    pumpBadge.userData = { lodTier: 'high', lodMaxDistance: 12 };
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
    pintLiquid.name = 'outbuildings.barn.cornerBar.beerTap.pintGlass';
    pintLiquid.userData = { lodTier: 'high', lodMaxDistance: 12 };
    pintLiquid.position.set(px, 0.062, pz);
    tapGroup.add(pintLiquid);

    const foamHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.037, 0.036, 0.026, 16),
      ceramicWhiteMat
    );
    foamHead.name = 'outbuildings.barn.cornerBar.beerTap.pintFoam';
    foamHead.userData = { lodTier: 'high', lodMaxDistance: 12 };
    foamHead.position.set(px, 0.132, pz);
    tapGroup.add(foamHead);
  }

  // 4. Illuminated Wall-Mounted Oak Spirit & Glassware Shelves (`x = +0.16m, y = 1.42m & 1.72m`) & Warm Bar PointLight
  for (const [sIdx, shelfY] of [1.42, 1.72].entries()) {
    const backShelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.026, 0.72),
      lightJoineryOakMat
    );
    backShelf.name = `outbuildings.barn.cornerBar.spiritShelf.${sIdx + 1}`;
    backShelf.position.set(0.16, shelfY, 0.14);
    backShelf.castShadow = true;
    barGroup.add(backShelf);

    const shelfLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.008, 0.66),
      warmLedMat
    );
    shelfLed.name = `outbuildings.barn.cornerBar.spiritShelf.${sIdx + 1}.ledStrip`;
    shelfLed.position.set(0.08, shelfY - 0.015, 0.14);
    barGroup.add(shelfLed);

    for (let b = 0; b < 4; b++) {
      const bz = -0.10 + b * 0.16;
      const spiritBottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.034, 0.19 - (b % 2) * 0.02, 12),
        b % 2 === 0 ? sanPellegrinoGlassMat : champagneGlassMat
      );
      spiritBottle.name = `outbuildings.barn.cornerBar.spiritBottle.${sIdx + 1}_${b + 1}`;
      spiritBottle.userData = { lodTier: 'high', lodMaxDistance: 12 };
      spiritBottle.position.set(0.16, shelfY + 0.10 + (sIdx * 0.002), bz);
      barGroup.add(spiritBottle);
    }
  }

  const barLight = new THREE.PointLight(0xffc978, 1.75, 4.2, 1.55);
  barLight.name = 'outbuildings.barn.cornerBar.light';
  barLight.position.set(-0.15, 1.58, 0);
  barGroup.add(barLight);

  barGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });
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
let cachedPoolTableBaizeTexture: THREE.CanvasTexture | null = null;
let cachedCalacattaMarbleTopTexture: THREE.CanvasTexture | null = null;

function createPoolTableBaizeTexture(): THREE.CanvasTexture {
  if (cachedPoolTableBaizeTexture) {
    return cachedPoolTableBaizeTexture;
  }
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
  lightJoineryOakMat: THREE.Material,
  interactions?: SceneBuilderContext['interactions']
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
      brassToe.name = 'outbuildings.barn.poolTable.legToe';
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
      cushion.name = 'outbuildings.barn.poolTable.sideCushion';
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
    endCushion.name = 'outbuildings.barn.poolTable.endCushion';
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
    brassPlate.name = 'outbuildings.barn.poolTable.pocketPlate';
    brassPlate.position.set(px * 1.03, tableH + 0.004, pz * 1.04);
    poolGroup.add(brassPlate);

    const leatherBasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.038, 0.11, 16),
      pocketLeatherMat
    );
    leatherBasket.name = 'outbuildings.barn.poolTable.pocketBasket';
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

  // White Cue Ball (`ball.0`) on the head string / D-zone (`x = -0.48m, z = +0.06m`)
  const balls: THREE.Mesh[] = [];
  const cueBall = new THREE.Mesh(new THREE.SphereGeometry(ballR, 16, 14), cueBallMat);
  cueBall.name = 'outbuildings.barn.poolTable.ball.0';
  balls.push(cueBall);
  cueBall.userData = { lodTier: 'high', lodMaxDistance: 12 };
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
      ball.userData = { lodTier: 'high', lodMaxDistance: 12 };
      ball.position.set(bx, ballY, bz);
      ball.castShadow = true;
      poolGroup.add(ball);
      balls.push(ball);
    }
  }

  // 2 Tapered Ash & Ebony Pool Cues resting along the outer edge of the long rails (clear of the
  // baize so broken balls never roll through them). `cue.1` is the one picked up for the break.
  const ashCueMat = new THREE.MeshStandardMaterial({ color: 0xdcb98a, roughness: 0.32 });
  const cueLength = 1.36;
  const cueRadius = 0.012;
  const railTopY = railCenterY + railH * 0.5;
  const cues: THREE.Mesh[] = [];
  for (const [cIdx, cx, sideZ] of [
    [1, -0.12, -1],
    [2, 0.08, 1],
  ] as const) {
    const cueShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0048, cueRadius, cueLength, 12),
      ashCueMat
    );
    cueShaft.name = `outbuildings.barn.poolTable.cue.${cIdx}`;
    cueShaft.rotation.z = sideZ * (Math.PI / 2);
    // +7mm so the shaft clears the raised brass middle-pocket plates it passes over.
    cueShaft.position.set(cx, railTopY + cueRadius + 0.007, sideZ * (tableW * 0.5 - 0.025));
    cueShaft.castShadow = true;
    poolGroup.add(cueShaft);
    cues.push(cueShaft);
  }

  // 2 Blue Billiards Chalk Cubes on the North & South rails
  const chalkMat = new THREE.MeshStandardMaterial({ color: 0x1d68b8, roughness: 0.65 });
  for (const [cx, cz] of [
    [-0.36, -tableW * 0.5 + railW * 0.5],
    [0.20, tableW * 0.5 - railW * 0.5],
  ] as const) {
    const chalk = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.022), chalkMat);
    chalk.name = 'outbuildings.barn.poolTable.chalk';
    chalk.userData = { lodTier: 'high', lodMaxDistance: 12 };
    chalk.position.set(cx, tableH + 0.015, cz);
    chalk.rotation.y = 0.35;
    poolGroup.add(chalk);
  }

  // Click / walkthrough-F to break; click again to re-rack (see `objects/games/pool-table-break.ts`).
  const strikingCue = cues[0];
  if (interactions && strikingCue) {
    const cushionInset = 0.025; // cushion face sits 25mm inside the pocket line
    interactions.registerAnimatedInteractable(
      new PoolTableBreakController({
        balls,
        cue: strikingCue,
        cueLength,
        clickableTargets: [poolGroup],
        spec: createSixPocketTableSpec(playL * 0.5 - cushionInset, playW * 0.5 - cushionInset, ballR),
        label: 'Pool table',
        aliases: ['pool table', 'pool', 'break', 'play pool', 'rack the balls', 're-rack', 'rerack'],
      })
    );
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
  if (cachedCalacattaMarbleTopTexture) {
    return cachedCalacattaMarbleTopTexture;
  }
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
  // Positioned at `u = 18.24m, v = 4.525m` (`barLenZ = 1.81m`, spanning `v = 3.620..5.430m` flush against the South Barn Wall `v = 5.430m`!)
  // so the West face (`localX = -0.24m -> u = 18.00m`) aligns with `uBarnStepDropStart = 18.00m`!
  viewingBarGroup.position.set(18.24, barnCarpetTopY, 4.525);
  groundGroup.add(viewingBarGroup);

  const barLenZ = 1.81;
  const barCarcassD = 0.40;
  const barTopD = 0.54;
  const barH = 1.06;
  const plinthH = 0.06;
  const topT = 0.040;
  const bodyH = barH - plinthH - topT; // 0.96m
  const westFloorStepRiseH = (-0.34) - barnCarpetTopY; // 0.335m rise from -0.675m lower limestone floor to -0.34m upper limestone floor

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

  // 1. Recessed Dark-Anthracite Plinth & Framed Solid Light-Oak Spectator Bar Carcass
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(barCarcassD - 0.04, plinthH, barLenZ - 0.02),
    darkAnthraciteMat
  );
  plinth.name = 'outbuildings.barn.golfViewingBar.plinth';
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

  // Issue #3 ("fix the edge of this cabinet so there is somewhere for the baseboard to but up to neatly"
  // at `[-3.894, -0.194, 19.83]`, `outbuildings.barn.golfViewingBar.counter`):
  // Frame the West (`-x`) cabinet front with full-height square-edged Solid Oak Corner/Wall Scribing Stiles (`64mm` wide in `z`,
  // projecting `22mm` proud of `carcass` to `localX = -0.262m`, i.e., `u = 17.978m`) flush against the South Barn Wall (`v = 5.430m`),
  // so `outbuildings.barn.baseboard.westSouth` (`v = 5.408..5.430m, y = -0.340..-0.194m`) butts 100% squarely and cleanly against
  // the flat oak `southWallScribingStile`!
  const stileW = 0.064;
  const stileProjX = 0.022;
  const westFrontX = -0.04 - barCarcassD * 0.5; // -0.240m (`u = 18.00m`)
  const upperPanelH = (barH - topT) - westFloorStepRiseH; // 0.685m

  // South Wall Scribing Pilaster Stile (`v = 5.366..5.430m`, flush with South Wall `v = 5.430m`)
  const southWallScribingStile = new THREE.Mesh(
    new THREE.BoxGeometry(stileProjX, upperPanelH, stileW),
    lightJoineryOakMat
  );
  southWallScribingStile.name = 'outbuildings.barn.golfViewingBar.southWallScribingStile';
  southWallScribingStile.position.set(
    westFrontX - stileProjX * 0.5,
    westFloorStepRiseH + upperPanelH * 0.5,
    barLenZ * 0.5 - stileW * 0.5
  );
  southWallScribingStile.castShadow = true;
  southWallScribingStile.receiveShadow = true;
  viewingBarGroup.add(southWallScribingStile);

  // North Step-End Corner Pilaster Stile (`v = 3.620..3.684m`, full height down to lower floor)
  const northCornerStile = new THREE.Mesh(
    new THREE.BoxGeometry(stileProjX, barH - topT, stileW),
    lightJoineryOakMat
  );
  northCornerStile.name = 'outbuildings.barn.golfViewingBar.northCornerStile';
  northCornerStile.position.set(
    westFrontX - stileProjX * 0.5,
    (barH - topT) * 0.5,
    -barLenZ * 0.5 + stileW * 0.5
  );
  northCornerStile.castShadow = true;
  northCornerStile.receiveShadow = true;
  viewingBarGroup.add(northCornerStile);

  // Full 146mm-tall Solid Light-Oak West Baseboard Plinth (`122mm` lower plinth + `24mm` Ogee/Torus moulding cap)
  // spanning between the North and South pilasters at `y = westFloorStepRiseH .. westFloorStepRiseH + 0.146m` (`-0.340m..-0.194m`),
  // continuing the exact height and profile of the South wall baseboard across the cabinet base!
  const innerPanelSpanZ = barLenZ - stileW * 2;
  const westSkirtBaseH = 0.122;
  const westSkirtCapH = 0.024;
  const westFloorSkirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.020, westSkirtBaseH, innerPanelSpanZ),
    lightJoineryOakMat
  );
  westFloorSkirt.name = 'outbuildings.barn.golfViewingBar.westFloorSkirt';
  westFloorSkirt.position.set(
    westFrontX - 0.010,
    westFloorStepRiseH + westSkirtBaseH * 0.5,
    0
  );
  westFloorSkirt.castShadow = true;
  westFloorSkirt.receiveShadow = true;
  viewingBarGroup.add(westFloorSkirt);

  const westFloorSkirtCap = new THREE.Mesh(
    createProfiledSkirtingCapGeometry(innerPanelSpanZ, false, -1),
    lightJoineryOakMat
  );
  westFloorSkirtCap.name = 'outbuildings.barn.golfViewingBar.westFloorSkirtCap';
  westFloorSkirtCap.position.set(
    westFrontX - 0.010,
    westFloorStepRiseH + westSkirtBaseH + westSkirtCapH * 0.5,
    0
  );
  westFloorSkirtCap.castShadow = true;
  viewingBarGroup.add(westFloorSkirtCap);

  // Upper horizontal oak frieze rail (`42mm` tall) directly beneath the marble bar top between the North and South pilasters
  const topFriezeH = 0.042;
  const westTopFriezeRail = new THREE.Mesh(
    new THREE.BoxGeometry(stileProjX, topFriezeH, innerPanelSpanZ),
    lightJoineryOakMat
  );
  westTopFriezeRail.name = 'outbuildings.barn.golfViewingBar.westTopFriezeRail';
  westTopFriezeRail.position.set(
    westFrontX - stileProjX * 0.5,
    barH - topT - topFriezeH * 0.5,
    0
  );
  westTopFriezeRail.castShadow = true;
  viewingBarGroup.add(westTopFriezeRail);

  // Vertical half-round fluted light-oak tambour slats recessed cleanly inside the framed panel
  // (`y = westFloorStepRiseH + 0.146 .. barH - topT - topFriezeH`, between `northCornerStile` and `southWallScribingStile`)
  const slatBottomY = westFloorStepRiseH + westSkirtBaseH + westSkirtCapH;
  const slatTopY = barH - topT - topFriezeH;
  const slatH = slatTopY - slatBottomY;
  const numSlats = 26;
  for (let i = 0; i < numSlats; i++) {
    const sz = -innerPanelSpanZ * 0.5 + 0.02 + (i / (numSlats - 1)) * (innerPanelSpanZ - 0.04);
    const slat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, slatH, 10),
      lightJoineryOakMat
    );
    slat.name = 'outbuildings.barn.golfViewingBar.flutedSlat';
    slat.position.set(westFrontX - 0.004, slatBottomY + slatH * 0.5, sz);
    slat.castShadow = true;
    viewingBarGroup.add(slat);
  }

  // Issue #3 ("Marble top" at `[-3.662, 0.385, 18.089]`, `outbuildings.barn.golfViewingBar.top`):
  // Overhanging Bullnose Polished Calacatta Marble Bar Top (`0.54m` deep x `0.040m` thick x `1.81m` long, flush with South wall!)
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(barTopD, topT, barLenZ),
    marbleTopMat
  );
  counterTop.name = 'outbuildings.barn.golfViewingBar.top';
  counterTop.position.set(0.03, barH - topT * 0.5, 0);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  viewingBarGroup.add(counterTop);

  // Half-round bullnose marble nosing along both West (`-x`) and East (`+x`) edges of the marble bar top
  for (const edgeX of [0.03 - barTopD * 0.5, 0.03 + barTopD * 0.5] as const) {
    const noseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(topT * 0.5, topT * 0.5, barLenZ, 14),
      marbleTopMat
    );
    noseCyl.rotation.x = Math.PI / 2;
    noseCyl.name = 'outbuildings.barn.golfViewingBar.topNosing';
    noseCyl.position.set(edgeX, barH - topT * 0.5, 0);
    viewingBarGroup.add(noseCyl);
  }

  // Warm under-counter LED strip illuminating the stool overhang (`x = +0.20m`)
  const underBarLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.008, barLenZ - 0.08),
    warmLedMat
  );
  underBarLed.name = 'outbuildings.barn.golfViewingBar.underBarLed';
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
    bracket.name = 'outbuildings.barn.golfViewingBar.footRailBracket';
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
    coaster.name = 'outbuildings.barn.golfViewingBar.coaster';
    coaster.userData = { lodTier: 'high', lodMaxDistance: 12 };
    coaster.position.set(gx, barH + 0.0025, gz);
    viewingBarGroup.add(coaster);

    const pint = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.028, 0.115, 16),
      beerGlassMat
    );
    pint.name = 'outbuildings.barn.golfViewingBar.pintGlass';
    pint.userData = { lodTier: 'high', lodMaxDistance: 12 };
    pint.position.set(gx, barH + 0.062, gz);
    pint.castShadow = true;
    viewingBarGroup.add(pint);

    const foam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.035, 0.024, 16),
      foamMat
    );
    foam.name = 'outbuildings.barn.golfViewingBar.pintFoam';
    foam.userData = { lodTier: 'high', lodMaxDistance: 12 };
    foam.position.set(gx, barH + 0.131, gz);
    viewingBarGroup.add(foam);
  }

  const snackBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.046, 0.048, 20),
    foamMat
  );
  snackBowl.name = 'outbuildings.barn.golfViewingBar.snackBowl';
  snackBowl.userData = { lodTier: 'high', lodMaxDistance: 12 };
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
      leg.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.leg`;
      leg.position.set(lx * 0.82, legH * 0.5, lz * 0.82);
      leg.rotation.z = lx > 0 ? 0.09 : -0.09;
      leg.rotation.x = lz > 0 ? -0.09 : 0.09;
      leg.castShadow = true;
      stoolGroup.add(leg);

      const brassSabot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.013, 0.065, 12),
        brushedBrassMat
      );
      brassSabot.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.sabot`;
      brassSabot.position.set(lx * 0.96, 0.0325, lz * 0.96);
      stoolGroup.add(brassSabot);
    }

    const footrestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.165, 0.009, 10, 24),
      brushedBrassMat
    );
    footrestRing.rotation.x = Math.PI / 2;
    footrestRing.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.footrest`;
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
    seatWelt.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.seatWelt`;
    seatWelt.position.set(0, 0.765, 0);
    stoolGroup.add(seatWelt);

    // Twin Brushed-Brass Backrest Uprights & Curved Low-Profile Saddle-Leather Backrest (`y = 0.84..0.98m`)
    for (const sideZ of [-0.09, 0.09] as const) {
      const upright = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.21, 10),
        brushedBrassMat
      );
      upright.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.backrestPost`;
      upright.position.set(-0.175, 0.83, sideZ);
      upright.rotation.z = 0.14;
      stoolGroup.add(upright);
    }

    const backrest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.195, 0.195, 0.13, 20, 1, true, Math.PI * 0.65, Math.PI * 0.70),
      saddleLeatherMat
    );
    backrest.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.backrest`;
    backrest.position.set(0, 0.91, 0);
    backrest.castShadow = true;
    stoolGroup.add(backrest);

    const backrestInner = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.125, 0.30),
      saddleLeatherMat
    );
    backrestInner.name = `outbuildings.barn.golfViewingBar.stool.${sIdx}.backrestCushion`;
    backrestInner.position.set(-0.175, 0.91, 0);
    backrestInner.castShadow = true;
    stoolGroup.add(backrestInner);
  }

  viewingBarGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });
}
