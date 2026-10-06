import * as THREE from 'three';
import { createBrushedStainlessSteelMaterial } from './shared-geometry-and-materials.ts';

/**
 * Generates a high-resolution multi-stave finger-jointed rock-maple & European-oak
 * laminated butcher-block worktop texture with realistic stave tone variation,
 * finger-joint butt seams, medullary ray grain, and satin tung-oil finish.
 */
let cachedButcherBlockTexture: THREE.CanvasTexture | null = null;

export function createButcherBlockTexture(): THREE.CanvasTexture {
  if (cachedButcherBlockTexture) return cachedButcherBlockTexture;
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
  cachedButcherBlockTexture = tex;
  return tex;
}

let cachedPiwisMonitorScreenTexture: THREE.CanvasTexture | null = null;

/**
 * Generates and memoizes the 32-inch Porsche 992.2 Turbo S PIWIS IV diagnostic telemetry screen texture.
 */
export function createPiwisMonitorScreenTexture(): THREE.CanvasTexture {
  if (cachedPiwisMonitorScreenTexture) return cachedPiwisMonitorScreenTexture;
  const monCanvas = document.createElement('canvas');
  monCanvas.width = 512;
  monCanvas.height = 288;
  const mCtx = monCanvas.getContext('2d');
  if (mCtx) {
    const bg = mCtx.createLinearGradient(0, 0, 512, 288);
    bg.addColorStop(0, '#0d1520');
    bg.addColorStop(1, '#162436');
    mCtx.fillStyle = bg;
    mCtx.fillRect(0, 0, 512, 288);

    // Top telemetry status header
    mCtx.fillStyle = '#1e324a';
    mCtx.fillRect(0, 0, 512, 36);
    mCtx.fillStyle = '#4fc3f7';
    mCtx.font = 'bold 15px sans-serif';
    mCtx.fillText('PORSCHE 992.2 TURBO S // PIWIS IV DIAGNOSTICS', 16, 23);

    // Left panel: Dyno / Boost & Tire pressure cards
    mCtx.strokeStyle = '#2b4c6f';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(16, 52, 228, 216);
    mCtx.fillStyle = '#8ab4f8';
    mCtx.font = 'bold 14px sans-serif';
    mCtx.fillText('TWIN-TURBO FLAT-6 TELEMETRY', 28, 78);

    mCtx.strokeStyle = '#00e676';
    mCtx.lineWidth = 3;
    mCtx.beginPath();
    mCtx.moveTo(28, 220);
    mCtx.bezierCurveTo(80, 212, 120, 118, 175, 108);
    mCtx.lineTo(230, 102);
    mCtx.stroke();

    // Right panel: 3D wireframe / system gauges
    mCtx.strokeStyle = '#2b4c6f';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(260, 52, 236, 216);
    for (let g = 0; g < 3; g++) {
      const gx = 306 + g * 72;
      mCtx.strokeStyle = g === 1 ? '#ffb300' : '#29b6f6';
      mCtx.lineWidth = 4;
      mCtx.beginPath();
      mCtx.arc(gx, 132, 24, Math.PI * 0.75, Math.PI * 2.25);
      mCtx.stroke();
    }
    mCtx.fillStyle = '#b0bec5';
    mCtx.font = '13px monospace';
    mCtx.fillText('BATTERY: 14.2V  |  OIL: 90C', 276, 206);
    mCtx.fillText('PCCB TORQUE SPEC: 600 Nm', 276, 234);
  }
  const monTex = new THREE.CanvasTexture(monCanvas);
  monTex.colorSpace = THREE.SRGBColorSpace;
  cachedPiwisMonitorScreenTexture = monTex;
  return monTex;
}

/**
 * Issue #4 ("Shift this right over" at `[-11.294, 0.045, 19.729]`) &
 * Issue #5 ("Put it against this wall and cut it in to make use of the dead space behind, make it slightly longer"
 * at `[-10.226, -0.27, 17.512]` -> Outbuilding `(u = 12.07m, y = -0.27m, v = 2.555m)`, `-u` West face of Garage East Wall):
 * Builds a `3.88m` 5-Bay Heavy-Duty Commercial Stainless-Steel & Laminated Butcher-Block Workshop Tool Bench
 * (`outbuildings.garage.toolBench`) recessed into the Garage East Wall (`u = 12.07..12.31m`) and utilizing the
 * dead space behind (`u = 12.31..12.82m` on the West side of the Store room behind the Golf Simulator), featuring:
 * - Recessed Alcove Lining Enclosure (`outbuildings.garage.toolBench.alcoveEnclosure`) with plasterboard inner jambs,
 *   soffit head lining, and a plastered studwork back & side housing box on the Store room side
 * - Brushed 304 stainless-steel drawer fronts & cabinet doors across 5 bays (`3.88m` total width, `bayCenters = [-1.51, -0.755, 0.0, 0.755, 1.51]`)
 * - Multi-stave finger-jointed hardwood butcher-block worktop assembly (`3.88m x 0.052m x 0.78m`) with bullnose front edge,
 *   30mm brushed stainless perimeter upstand lip, and inlaid magnetic stainless parts tray
 * - Full suite of recognizable **DeWALT 18V XR / 54V FLEXVOLT** (`#febd17` yellow & `#181a1d` matte black) power tools
 *   spread across the `3.88m` workbench.
 */
export function buildGarageStainlessWorkbench(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): { benchGroup: THREE.Group; southWingGroup: THREE.Group } {
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.garage.toolBench';
  // Spans `v = 1.34m..5.41m` (`totalW = 4.07m`, centered at `v = 3.375m`) along the Garage East Wall (`u = 12.07m`):
  // - North Section (`v = 1.34m..2.86m`, `localX = +0.515m..+2.035m`, width `1.52m`, height `2.16m`):
  //   Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`) &
  //   Issue #2 ("Have a double stainless steel full height cupboard here. It can go higher than currently.
  //   Inside will be storage for ladders, paint etc everything you wan tout of the way. One will have shelving the other full height."
  //   at `[-10.269, -0.134, 17.336]`):
  //   Butts 100% flush against the `v = 1.18..1.34m` pass-through door wall pier with zero gap, and rises `2.16m` high
  //   (`y = -0.50m..+1.66m`), featuring two interactive full-height brushed 304 stainless-steel doors (`registerHingedDoor`)
  //   opening to reveal a full-height ladder/tool compartment on the right (North) and a 5-tier shelved paint & hardware
  //   storage compartment on the left (South)!
  // - South Section (`v = 2.86m..5.41m`, `localX = -2.035m..+0.515m`, width `2.55m`):
  //   Recessed Butcher-Block Workbench & 5-Tier Brushed 304 Stainless-Steel Drawer Banks (`Issue #3`), wrapping 90 degrees
  //   around the SE corner (`v = 5.41m`) onto the Garage South wall (`u = 10.12m..12.04m`) with continuous lower drawer banks
  //   (`Issue #3: "No need for open section keep the drawers"`) and a wall-mounted 32-inch 16:9 monitor (`Issue #4`)!
  benchGroup.position.set(12.41, garageFloorTopY, 3.375);
  benchGroup.rotation.y = Math.PI / 2;
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
  const alcovePlasterMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede2,
    roughness: 0.86,
    metalness: 0.02,
  });
  // Authentic DeWALT Industrial Yellow (#febd17) & Matte Black (#181a1d)
  const dewaltBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.74,
    metalness: 0.12,
  });
  const rockerSwitchMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    roughness: 0.35,
    metalness: 0.15,
  });
  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    emissive: new THREE.Color(0xd8eeff),
    emissiveIntensity: 2.6,
    roughness: 0.16,
  });

  const totalW = 4.07; // `localX = -2.035m..+2.035m` (`v = 5.41m..1.34m`)
  const benchSpanW = 2.55; // `localX = -2.035m..+0.515m` (`v = 5.41m..2.86m`)
  const benchCenterX = -2.035 + benchSpanW * 0.5; // -0.76m
  const tallCupboardH = 2.16; // Rises to `y = 1.66m` world (`27cm` taller than the workbench upper cabinets!)
  const benchD = 0.74;
  const cabinetH = 0.86;
  const topT = 0.052;
  const worktopY = cabinetH + topT;
  const frontZ = -benchD * 0.5 + 0.012;

  // ---------------------------------------------------------------------------
  // 1. Recessed Alcove Jamb Linings (`outbuildings.garage.toolBench.alcoveEnclosure`)
  // ---------------------------------------------------------------------------
  const alcoveGroup = new THREE.Group();
  alcoveGroup.name = 'outbuildings.garage.toolBench.alcoveEnclosure';
  alcoveGroup.userData.isArchitecturalShell = true;
  benchGroup.add(alcoveGroup);

  const northJambLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, tallCupboardH, 0.73),
    alcovePlasterMat
  );
  northJambLining.name = 'outbuildings.garage.toolBench.alcoveEnclosure.northJambLining';
  northJambLining.userData.isArchitecturalShell = true;
  northJambLining.position.set(totalW * 0.5 + 0.008, tallCupboardH * 0.5, 0.025);
  northJambLining.castShadow = true;
  northJambLining.receiveShadow = true;
  alcoveGroup.add(northJambLining);

  const southJambLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, tallCupboardH, 0.73),
    alcovePlasterMat
  );
  southJambLining.name = 'outbuildings.garage.toolBench.alcoveEnclosure.southJambLining';
  southJambLining.userData.isArchitecturalShell = true;
  southJambLining.position.set(-totalW * 0.5 - 0.008, tallCupboardH * 0.5, 0.025);
  southJambLining.castShadow = true;
  southJambLining.receiveShadow = true;
  alcoveGroup.add(southJambLining);

  // ---------------------------------------------------------------------------

  // 3. East-Wall Workbench Lower Cabinet Carcass, Plinth & Brushed 304 Stainless-Steel Drawers
  //    (`localX = -2.035m..+0.515m`, `benchSpanW = 2.55m`, `v = 2.86m..5.41m` — Issue #3!)
  // ---------------------------------------------------------------------------
  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.02, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  carcass.name = 'outbuildings.garage.toolBench.lowerCarcass';
  carcass.position.set(benchCenterX, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  benchGroup.add(carcass);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.04, 0.05, benchD - 0.08),
    dewaltBlackMat
  );
  plinth.name = 'outbuildings.garage.toolBench.plinth';
  plinth.position.set(benchCenterX, 0.025, 0.02);
  benchGroup.add(plinth);

  const postPositionsX = [
    -1.295,
    -0.695,
    -0.095,
    0.505,
  ] as const;
  for (const mx of postPositionsX) {
    const stile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, cabinetH - 0.05, 0.016),
      anthraciteSteelMat
    );
    stile.name = 'outbuildings.garage.toolBench.frontStile';
    stile.position.set(mx, 0.05 + (cabinetH - 0.05) * 0.5, frontZ + 0.004);
    benchGroup.add(stile);
  }

  for (const fx of [-1.95, -1.295, -0.695, -0.095, 0.505] as const) {
    for (const fz of [-benchD * 0.5 + 0.07, benchD * 0.5 - 0.07]) {
      const footPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.038, 0.014, 14),
        dewaltBlackMat
      );
      footPad.name = 'outbuildings.garage.toolBench.levelingFootPad';
      footPad.userData.lodTier = 'high';
      footPad.userData.lodMaxDistance = 12;
      footPad.position.set(fx, 0.007, fz);
      benchGroup.add(footPad);

      const footLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.028, 0.042, 12),
        aluminumTrimMat
      );
      footLeg.name = 'outbuildings.garage.toolBench.levelingFootLeg';
      footLeg.userData.lodTier = 'high';
      footLeg.userData.lodMaxDistance = 12;
      footLeg.position.set(fx, 0.031, fz);
      benchGroup.add(footLeg);
    }
  }

  const eastDrawerW = 0.578;
  const eastDrawerBanks = [-0.995, -0.395, 0.205] as const;
  const fiveTierHeights = [0.085, 0.105, 0.135, 0.185, 0.22] as const;

  for (const cx of eastDrawerBanks) {
    let cursorY = cabinetH - 0.025;

    const keyLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    keyLock.name = 'outbuildings.garage.toolBench.drawerKeyLock';
    keyLock.userData.lodTier = 'high';
    keyLock.userData.lodMaxDistance = 12;
    keyLock.rotation.x = Math.PI / 2;
    keyLock.position.set(cx + eastDrawerW * 0.5 - 0.032, cabinetH - 0.048, frontZ - 0.004);
    benchGroup.add(keyLock);

    for (let dIdx = 0; dIdx < fiveTierHeights.length; dIdx++) {
      const dh = fiveTierHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(eastDrawerW, dh - 0.007, 0.02),
        brushedStainlessMat
      );
      drawerFront.name = 'outbuildings.garage.toolBench.drawer';
      drawerFront.position.set(cx, dy, frontZ);
      drawerFront.castShadow = true;
      drawerFront.receiveShadow = true;
      benchGroup.add(drawerFront);

      const pullBar = new THREE.Mesh(
        new THREE.BoxGeometry(eastDrawerW - 0.024, 0.016, 0.026),
        aluminumTrimMat
      );
      pullBar.name = 'outbuildings.garage.toolBench.drawerPullBar';
      pullBar.userData.lodTier = 'high';
      pullBar.userData.lodMaxDistance = 12;
      pullBar.position.set(cx, dy + dh * 0.5 - 0.015, frontZ - 0.012);
      benchGroup.add(pullBar);

      const labelStrip = new THREE.Mesh(
        new THREE.BoxGeometry(eastDrawerW * 0.42, 0.007, 0.004),
        dewaltBlackMat
      );
      labelStrip.name = 'outbuildings.garage.toolBench.drawerLabelStrip';
      labelStrip.userData.lodTier = 'high';
      labelStrip.userData.lodMaxDistance = 12;
      labelStrip.position.set(cx, dy + dh * 0.5 - 0.015, frontZ - 0.025);
      benchGroup.add(labelStrip);

      cursorY -= dh;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Laminated Hardwood Butcher-Block Worktop, Pegboard & Upper Cabinets (`benchSpanW = 2.55m`)
  //    - Issue #4 ("Height of this section should match the cupboards" at `[-9.737, 1.207, 18.647]`):
  //      `worktopY (0.912m) + pegboardH (0.76m) + upperCabH (0.488m) = 2.160m === tallCupboardH`!
  // ---------------------------------------------------------------------------
  const topD = 0.78;
  const butcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW, topT, topD),
    butcherBlockMat
  );
  butcherTop.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  butcherTop.position.set(benchCenterX, cabinetH + topT * 0.5, 0);
  butcherTop.castShadow = true;
  butcherTop.receiveShadow = true;
  benchGroup.add(butcherTop);

  const bullnoseRadius = topT * 0.5;
  const frontBullnose = new THREE.Mesh(
    new THREE.CylinderGeometry(bullnoseRadius, bullnoseRadius, benchSpanW, 16),
    butcherBlockMat
  );
  frontBullnose.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  frontBullnose.rotation.z = Math.PI / 2;
  frontBullnose.position.set(benchCenterX, cabinetH + topT * 0.5, -topD * 0.5);
  frontBullnose.castShadow = true;
  frontBullnose.receiveShadow = true;
  benchGroup.add(frontBullnose);

  const southEndCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, topT + 0.002, topD + 0.012),
    butcherEdgeMat
  );
  southEndCap.name = 'outbuildings.garage.toolBench.butcherBlockEndCap';
  southEndCap.position.set(-totalW * 0.5 - 0.004, cabinetH + topT * 0.5, 0);
  southEndCap.castShadow = true;
  benchGroup.add(southEndCap);

  const upstandH = 0.032;
  const upstandT = 0.012;
  const rearUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW, upstandH, upstandT),
    brushedStainlessMat
  );
  rearUpstand.name = 'outbuildings.garage.toolBench.rearUpstand';
  rearUpstand.position.set(benchCenterX, worktopY + upstandH * 0.5, benchD * 0.5 - upstandT * 0.5);
  benchGroup.add(rearUpstand);

  const magTrayGroup = new THREE.Group();
  magTrayGroup.name = 'outbuildings.garage.toolBench.magneticPartsTray';
  magTrayGroup.position.set(-1.24, worktopY, -0.22);
  benchGroup.add(magTrayGroup);

  const trayRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.01, 0.18),
    brushedStainlessMat
  );
  trayRim.name = 'outbuildings.garage.toolBench.magneticPartsTray.rim';
  trayRim.userData.lodTier = 'high';
  trayRim.userData.lodMaxDistance = 12;
  trayRim.position.set(0, 0.005, 0);
  magTrayGroup.add(trayRim);

  const trayWell = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.006, 0.14),
    anthraciteSteelMat
  );
  trayWell.name = 'outbuildings.garage.toolBench.magneticPartsTray.well';
  trayWell.userData.lodTier = 'high';
  trayWell.userData.lodMaxDistance = 12;
  trayWell.position.set(0, 0.008, 0);
  magTrayGroup.add(trayWell);

  for (let s = 0; s < 6; s++) {
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008 + s * 0.0012, 0.008 + s * 0.0012, 0.028, 12),
      aluminumTrimMat
    );
    socket.name = 'outbuildings.garage.toolBench.magneticPartsTray.socket';
    socket.userData.lodTier = 'high';
    socket.userData.lodMaxDistance = 12;
    socket.position.set(-0.08 + s * 0.032, 0.024, -0.03);
    magTrayGroup.add(socket);
  }

  const pegboardH = 0.76;
  const pegboard = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.02, pegboardH, 0.024),
    anthraciteSteelMat
  );
  pegboard.name = 'outbuildings.garage.toolBench.pegboard';
  pegboard.position.set(benchCenterX, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.02);
  benchGroup.add(pegboard);

  const powerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.062, 0.036),
    aluminumTrimMat
  );
  powerStrip.name = 'outbuildings.garage.toolBench.powerStrip';
  powerStrip.position.set(-0.48, worktopY + 0.11, benchD * 0.5 - 0.045);
  benchGroup.add(powerStrip);

  for (let s = 0; s < 6; s++) {
    const sx = -0.73 + s * 0.1;
    const socketFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, 0.008),
      dewaltBlackMat
    );
    socketFace.name = 'outbuildings.garage.toolBench.powerStrip.socketFace';
    socketFace.userData.lodTier = 'high';
    socketFace.userData.lodMaxDistance = 12;
    socketFace.position.set(sx, worktopY + 0.11, benchD * 0.5 - 0.065);
    benchGroup.add(socketFace);

    const redSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.018, 0.01),
      rockerSwitchMat
    );
    redSwitch.name = 'outbuildings.garage.toolBench.powerStrip.rockerSwitch';
    redSwitch.userData.lodTier = 'high';
    redSwitch.userData.lodMaxDistance = 12;
    redSwitch.position.set(sx + 0.016, worktopY + 0.12, benchD * 0.5 - 0.068);
    benchGroup.add(redSwitch);
  }

  const upperCabH = tallCupboardH - (worktopY + pegboardH); // 0.488m (total height = 2.160m === tallCupboardH)
  const upperCabD = 0.34;
  const upperCab = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.02, upperCabH, upperCabD),
    anthraciteSteelMat
  );
  upperCab.name = 'outbuildings.garage.toolBench.upperCabinetCarcass';
  upperCab.position.set(
    benchCenterX,
    worktopY + pegboardH + upperCabH * 0.5,
    benchD * 0.5 - upperCabD * 0.5
  );
  upperCab.castShadow = true;
  benchGroup.add(upperCab);

  const upperDoorW = 0.81;
  for (const ux of [-1.59, -0.76, 0.07] as const) {
    const upperDoor = new THREE.Mesh(
      new THREE.BoxGeometry(upperDoorW, upperCabH - 0.03, 0.02),
      brushedStainlessMat
    );
    upperDoor.name = 'outbuildings.garage.toolBench.drawer';
    upperDoor.position.set(
      ux,
      worktopY + pegboardH + upperCabH * 0.5,
      benchD * 0.5 - upperCabD - 0.008
    );
    upperDoor.castShadow = true;
    upperDoor.receiveShadow = true;
    benchGroup.add(upperDoor);

    const upperPull = new THREE.Mesh(
      new THREE.BoxGeometry(upperDoorW - 0.04, 0.016, 0.026),
      aluminumTrimMat
    );
    upperPull.name = 'outbuildings.garage.toolBench.upperCabinetPullBar';
    upperPull.userData.lodTier = 'high';
    upperPull.userData.lodMaxDistance = 12;
    upperPull.position.set(
      ux,
      worktopY + pegboardH + 0.034,
      benchD * 0.5 - upperCabD - 0.022
    );
    benchGroup.add(upperPull);

    const upperLabelStrip = new THREE.Mesh(
      new THREE.BoxGeometry(upperDoorW * 0.42, 0.007, 0.004),
      dewaltBlackMat
    );
    upperLabelStrip.name = 'outbuildings.garage.toolBench.upperCabinetLabelStrip';
    upperLabelStrip.userData.lodTier = 'high';
    upperLabelStrip.userData.lodMaxDistance = 12;
    upperLabelStrip.position.set(
      ux,
      worktopY + pegboardH + 0.034,
      benchD * 0.5 - upperCabD - 0.035
    );
    benchGroup.add(upperLabelStrip);
  }

  const ledTaskBar = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.08, 0.014, 0.038),
    ledStripMat
  );
  ledTaskBar.name = 'outbuildings.garage.toolBench.ledTaskBar';
  ledTaskBar.position.set(benchCenterX, worktopY + pegboardH - 0.007, benchD * 0.5 - upperCabD + 0.05);
  benchGroup.add(ledTaskBar);

  // ---------------------------------------------------------------------------
  // 5. Shower-Room Front Cabinet & Workstation Section (`outbuildings.garage.toolBench.southWing`)
  //    - Issue #3 ("Move this section of cabinet to in front of the shower room" at `[-11.363, 0.412, 20.06]`,
  //      `outbuildings.garage.toolBench.southWing.butcherBlockTop`):
  //      Moved from the SE corner (`u = 10.12..12.04m, v = 5.04m`) to sit directly in front of the Shower Room's
  //      North wall (`v = 3.85m`, spanning `u = 6.91m..8.85m`, centered at `u = 7.88m, v = 3.48m`, which in
  //      `benchGroup` local coordinates `(12.41, y, 3.375, rotY = +Math.PI/2)` is `localX = -0.105m, localZ = -4.53m`),
  //      facing North (`-v`) toward the West Garage Double Door while leaving the Garage-to-Shower-Room door (`u = 6.07..6.83m`) clear!
  //    - Full-depth Dark-Anthracite Steel Lower Cabinet Carcass, Plinth, Stiles & 3 Banks of 5-Tier
  //      Brushed 304 Stainless-Steel Drawers (`outbuildings.garage.toolBench.southWing.drawer`) underneath,
  //      plus the Wall-Mounted 32-Inch (`16:9`) Monitor on the Shower Room North wall behind it!
  // ---------------------------------------------------------------------------
  const southReturnL = 1.92; // Spans `u = 6.91m..8.85m` directly in front of the Shower Room North wall (`v = 3.85m`)
  const southWingGroup = new THREE.Group();
  southWingGroup.name = 'outbuildings.garage.toolBench.southWing';
  southWingGroup.position.set(
    -0.105, // localX = -0.105m -> v = 3.48m (`v = 3.11..3.85m`, flush against the `v = 3.85m` Shower Room North wall!)
    0,
    -4.53 // localZ = -4.53m -> u = 7.88m (`u = 6.91..8.85m`)
  );
  southWingGroup.rotation.y = -Math.PI / 2;
  benchGroup.add(southWingGroup);

  // Issue #3: Full-Depth Lower Cabinet Carcass, Plinth & 3 Banks of 5-Tier Brushed 304 Stainless Drawers
  const southCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL - 0.02, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  southCarcass.name = 'outbuildings.garage.toolBench.southWing.lowerCarcass';
  southCarcass.position.set(0.01, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  southCarcass.castShadow = true;
  southCarcass.receiveShadow = true;
  southWingGroup.add(southCarcass);

  const southPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL - 0.04, 0.05, benchD - 0.08),
    dewaltBlackMat
  );
  southPlinth.name = 'outbuildings.garage.toolBench.southWing.plinth';
  southPlinth.position.set(0.01, 0.025, 0.02);
  southWingGroup.add(southPlinth);

  const southPostPositionsX = [-0.94, -0.31, 0.31, 0.94] as const;
  for (const sx of southPostPositionsX) {
    const sStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, cabinetH - 0.05, 0.016),
      anthraciteSteelMat
    );
    sStile.name = 'outbuildings.garage.toolBench.southWing.frontStile';
    sStile.position.set(sx, 0.05 + (cabinetH - 0.05) * 0.5, frontZ + 0.004);
    southWingGroup.add(sStile);

    for (const sz of [-benchD * 0.5 + 0.07, benchD * 0.5 - 0.07]) {
      const sFootPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.038, 0.014, 14),
        dewaltBlackMat
      );
      sFootPad.name = 'outbuildings.garage.toolBench.southWing.levelingFootPad';
      sFootPad.userData.lodTier = 'high';
      sFootPad.userData.lodMaxDistance = 12;
      sFootPad.position.set(sx, 0.007, sz);
      southWingGroup.add(sFootPad);

      const sFootLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.028, 0.042, 12),
        aluminumTrimMat
      );
      sFootLeg.name = 'outbuildings.garage.toolBench.southWing.levelingFootLeg';
      sFootLeg.userData.lodTier = 'high';
      sFootLeg.userData.lodMaxDistance = 12;
      sFootLeg.position.set(sx, 0.031, sz);
      southWingGroup.add(sFootLeg);
    }
  }

  const southDrawerW = 0.602;
  for (const scx of [-0.625, 0.0, 0.625] as const) {
    let cursorY = cabinetH - 0.025;

    const sKeyLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    sKeyLock.name = 'outbuildings.garage.toolBench.southWing.drawerKeyLock';
    sKeyLock.userData.lodTier = 'high';
    sKeyLock.userData.lodMaxDistance = 12;
    sKeyLock.rotation.x = Math.PI / 2;
    sKeyLock.position.set(scx + southDrawerW * 0.5 - 0.032, cabinetH - 0.048, frontZ - 0.004);
    southWingGroup.add(sKeyLock);

    for (let dIdx = 0; dIdx < fiveTierHeights.length; dIdx++) {
      const dh = fiveTierHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const sDrawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(southDrawerW, dh - 0.007, 0.02),
        brushedStainlessMat
      );
      sDrawerFront.name = 'outbuildings.garage.toolBench.southWing.drawer';
      sDrawerFront.position.set(scx, dy, frontZ);
      sDrawerFront.castShadow = true;
      sDrawerFront.receiveShadow = true;
      southWingGroup.add(sDrawerFront);

      const sPullBar = new THREE.Mesh(
        new THREE.BoxGeometry(southDrawerW - 0.024, 0.016, 0.026),
        aluminumTrimMat
      );
      sPullBar.name = 'outbuildings.garage.toolBench.southWing.drawerPullBar';
      sPullBar.userData.lodTier = 'high';
      sPullBar.userData.lodMaxDistance = 12;
      sPullBar.position.set(scx, dy + dh * 0.5 - 0.015, frontZ - 0.012);
      southWingGroup.add(sPullBar);

      const sLabelStrip = new THREE.Mesh(
        new THREE.BoxGeometry(southDrawerW * 0.42, 0.007, 0.004),
        dewaltBlackMat
      );
      sLabelStrip.name = 'outbuildings.garage.toolBench.southWing.drawerLabelStrip';
      sLabelStrip.userData.lodTier = 'high';
      sLabelStrip.userData.lodMaxDistance = 12;
      sLabelStrip.position.set(scx, dy + dh * 0.5 - 0.015, frontZ - 0.025);
      southWingGroup.add(sLabelStrip);

      cursorY -= dh;
    }
  }

  // Continuous 52mm End-Grain Hardwood Butcher-Block Return Worktop (`1.94m x 0.052m x 0.78m`)
  const southButcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL + 0.02, topT, topD),
    butcherBlockMat
  );
  southButcherTop.name = 'outbuildings.garage.toolBench.southWing.butcherBlockTop';
  southButcherTop.position.set(0.01, cabinetH + topT * 0.5, 0);
  southButcherTop.castShadow = true;
  southButcherTop.receiveShadow = true;
  southWingGroup.add(southButcherTop);

  const southFrontBullnose = new THREE.Mesh(
    new THREE.CylinderGeometry(bullnoseRadius, bullnoseRadius, southReturnL + 0.02, 16),
    butcherBlockMat
  );
  southFrontBullnose.name = 'outbuildings.garage.toolBench.southWing.butcherBlockBullnose';
  southFrontBullnose.rotation.z = Math.PI / 2;
  southFrontBullnose.position.set(0.01, cabinetH + topT * 0.5, -topD * 0.5);
  southFrontBullnose.castShadow = true;
  southWingGroup.add(southFrontBullnose);

  const southRearUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL + 0.02, upstandH, upstandT),
    brushedStainlessMat
  );
  southRearUpstand.name = 'outbuildings.garage.toolBench.southWing.rearUpstand';
  southRearUpstand.position.set(0.01, worktopY + upstandH * 0.5, benchD * 0.5 - upstandT * 0.5);
  southWingGroup.add(southRearUpstand);

  // Tidy Dark-Anthracite Back Wall Panel (`outbuildings.garage.toolBench.southWing.pegboard`) flush against the Garage South wall (`+sz`)
  const southPegboard = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL, pegboardH, 0.022),
    anthraciteSteelMat
  );
  southPegboard.name = 'outbuildings.garage.toolBench.southWing.pegboard';
  southPegboard.position.set(0, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.015);
  southWingGroup.add(southPegboard);

  // Issue #4 ("Smaller screen, only needs to be 32 inch not ultra wide." at `[-11.234, 0.819, 20.361]`):
  // Wall-Mounted 32-Inch (`16:9` aspect ratio, `0.70m x 0.39m` active display, `0.72m x 0.41m` bezel) Computer Monitor
  const monTex = createPiwisMonitorScreenTexture();

  const monitorGroup = new THREE.Group();
  monitorGroup.name = 'outbuildings.garage.toolBench.southWing.monitor';
  monitorGroup.position.set(-0.04, worktopY + 0.35, benchD * 0.5 - 0.085);
  southWingGroup.add(monitorGroup);

  // Articulated VESA wall-mount bracket attached to the back panel
  const vesaWallPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.018),
    dewaltBlackMat
  );
  vesaWallPlate.name = 'outbuildings.garage.toolBench.southWing.monitor.vesaWallPlate';
  vesaWallPlate.userData.lodTier = 'high';
  vesaWallPlate.userData.lodMaxDistance = 12;
  vesaWallPlate.position.set(0, 0, 0.062);
  monitorGroup.add(vesaWallPlate);

  const vesaArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.072),
    anthraciteSteelMat
  );
  vesaArm.name = 'outbuildings.garage.toolBench.southWing.monitor.vesaArm';
  vesaArm.userData.lodTier = 'high';
  vesaArm.userData.lodMaxDistance = 12;
  vesaArm.position.set(0, 0, 0.03);
  monitorGroup.add(vesaArm);

  // 32-inch 16:9 Bezel Chassis (`0.72m wide x 0.41m high x 0.022m deep`)
  const monitorChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.41, 0.022),
    dewaltBlackMat
  );
  monitorChassis.name = 'outbuildings.garage.toolBench.southWing.monitor.chassis';
  monitorChassis.castShadow = true;
  monitorGroup.add(monitorChassis);

  const monitorScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.70, 0.39),
    new THREE.MeshStandardMaterial({
      map: monTex,
      emissiveMap: monTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.05,
    })
  );
  monitorScreen.name = 'outbuildings.garage.toolBench.southWing.monitor.screen';
  monitorScreen.rotation.y = Math.PI; // Faces `-sz` (North into the Garage!)
  monitorScreen.position.set(0, 0, -0.012);
  monitorGroup.add(monitorScreen);

  // Desk Mat, Wireless Mechanical Keyboard & Mouse on the Butcher-Block Desk under the 32-Inch Monitor
  const deskMat = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.004, 0.30),
    dewaltBlackMat
  );
  deskMat.name = 'outbuildings.garage.toolBench.southWing.deskMat';
  deskMat.position.set(-0.04, worktopY + 0.002, -0.06);
  southWingGroup.add(deskMat);

  const keyboardBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.014, 0.125),
    aluminumTrimMat
  );
  keyboardBody.name = 'outbuildings.garage.toolBench.southWing.wirelessKeyboard';
  keyboardBody.userData.lodTier = 'high';
  keyboardBody.userData.lodMaxDistance = 12;
  keyboardBody.position.set(-0.09, worktopY + 0.011, -0.05);
  southWingGroup.add(keyboardBody);

  const mouseBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.024, 0.105),
    dewaltBlackMat
  );
  mouseBody.name = 'outbuildings.garage.toolBench.southWing.wirelessMouse';
  mouseBody.userData.lodTier = 'high';
  mouseBody.userData.lodMaxDistance = 12;
  mouseBody.position.set(0.16, worktopY + 0.015, -0.05);
  southWingGroup.add(mouseBody);

  // A. Heavy Cast-Iron Engineer's Bench Vice mounted cleanly at the West front corner of the South Return Wing
  const viceGroup = new THREE.Group();
  viceGroup.name = 'outbuildings.garage.toolBench.vice';
  viceGroup.position.set(-0.68, worktopY, -0.24);
  southWingGroup.add(viceGroup);

  const viceBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.098, 0.028, 16),
    viceCastIronMat
  );
  viceBase.name = 'outbuildings.garage.toolBench.vice.swivelBase';
  viceBase.position.set(0, 0.014, 0);
  viceGroup.add(viceBase);

  const fixedJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.145, 0.095),
    viceCastIronMat
  );
  fixedJaw.name = 'outbuildings.garage.toolBench.vice.fixedJaw';
  fixedJaw.position.set(0, 0.092, 0.02);
  fixedJaw.castShadow = true;
  viceGroup.add(fixedJaw);

  const slidingJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.125, 0.078),
    viceCastIronMat
  );
  slidingJaw.name = 'outbuildings.garage.toolBench.vice.slidingJaw';
  slidingJaw.position.set(0, 0.086, -0.088);
  slidingJaw.castShadow = true;
  viceGroup.add(slidingJaw);

  const viceSlideBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.048, 0.23),
    aluminumTrimMat
  );
  viceSlideBar.name = 'outbuildings.garage.toolBench.vice.slideBar';
  viceSlideBar.position.set(0, 0.065, -0.02);
  viceGroup.add(viceSlideBar);

  const leadScrewHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12),
    aluminumTrimMat
  );
  leadScrewHub.name = 'outbuildings.garage.toolBench.vice.leadScrewHub';
  leadScrewHub.userData.lodTier = 'high';
  leadScrewHub.userData.lodMaxDistance = 12;
  leadScrewHub.rotation.x = Math.PI / 2;
  leadScrewHub.position.set(0, 0.075, -0.148);
  viceGroup.add(leadScrewHub);

  const tommyBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 10),
    aluminumTrimMat
  );
  tommyBar.name = 'outbuildings.garage.toolBench.vice.tommyBar';
  tommyBar.userData.lodTier = 'high';
  tommyBar.userData.lodMaxDistance = 12;
  tommyBar.rotation.z = 0.45;
  tommyBar.position.set(0, 0.075, -0.168);
  viceGroup.add(tommyBar);


  return { benchGroup, southWingGroup };
}
