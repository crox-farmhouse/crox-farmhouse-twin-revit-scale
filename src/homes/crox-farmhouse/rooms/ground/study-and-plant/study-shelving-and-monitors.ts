import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../../structure/tier2-levels.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type StudyShelvingAndMonitorsKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  'tagCutawayWall'
> &
  Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>;

/**
 * 16-Inch Apple MacBook Pro (`study.macbookPro`) on the South-Wall Oak Worktop.
 */
export function buildStudyMacbookPro(
  ctx: SceneBuilderContext,
  kit: Pick<StudyShelvingAndMonitorsKit, 'tier2FloorY'>,
  deskH: number
): void {
  const { scene } = ctx;
  const { tier2FloorY } = kit;

  const macbookGroup = new THREE.Group();
  macbookGroup.name = 'study.macbookPro';
  macbookGroup.userData.zone = 'study';
  const deskSurfaceY = tier2FloorY + deskH; // 0.16m
  macbookGroup.position.set(-21.155, deskSurfaceY, 11.135);
  // Faces North-Northeast toward the desk chair at [-21.05, -0.60, 10.48]
  macbookGroup.rotation.y = Math.PI - 0.12;

  const spaceBlackAlumMat = new THREE.MeshStandardMaterial({
    color: 0x2e3136, // Anodized Space Black / Dark Space Grey CNC aluminum unibody
    roughness: 0.26,
    metalness: 0.82,
  });
  const silverLogoMat = new THREE.MeshStandardMaterial({
    color: 0xcfd4dc,
    roughness: 0.12,
    metalness: 0.92,
  });
  const keycapMat = new THREE.MeshStandardMaterial({
    color: 0x141619, // Deep matte black Magic Keyboard keycaps & bezel
    roughness: 0.48,
    metalness: 0.12,
  });
  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0x282b30, // Matte glass Force Touch trackpad
    roughness: 0.22,
    metalness: 0.65,
  });

  const mbW = 0.355; // 16.2" MacBook Pro width: 355.7mm
  const mbD = 0.248; // 16.2" MacBook Pro depth: 248.1mm
  const baseH = 0.0125; // Lower unibody deck thickness

  // 4 Low-profile circular anti-slip elastomer feet (y = 0..0.0018m)
  const mbFootGeo = createSharedGeo(new THREE.CylinderGeometry(0.011, 0.011, 0.002, 16));
  for (const [fIdx, [fx, fz]] of ([
    [-0.145, -0.092],
    [0.145, -0.092],
    [-0.145, 0.092],
    [0.145, 0.092],
  ] as const).entries()) {
    const foot = tagHighLod(
      new THREE.Mesh(mbFootGeo, keycapMat)
    );
    foot.name = `study.macbookPro.foot.${fIdx + 1}`;
    foot.position.set(fx, 0.001, fz);
    macbookGroup.add(foot);
  }

  // 1. CNC Unibody Aluminum Lower Chassis Deck (y = 0.0018..0.0143m)
  const baseChassis = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(mbW, baseH, mbD)),
    spaceBlackAlumMat
  );
  baseChassis.name = 'study.macbookPro.baseChassis';
  baseChassis.position.set(0, 0.0018 + baseH * 0.5, 0);
  baseChassis.castShadow = true;
  baseChassis.receiveShadow = true;
  macbookGroup.add(baseChassis);

  // Front thumb-scoop lip notch on the front (+Z) edge of the unibody deck
  const thumbNotch = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.056, 0.004, 0.008)),
      keycapMat
    )
  );
  thumbNotch.name = 'study.macbookPro.thumbNotch';
  thumbNotch.position.set(0, 0.0018 + baseH - 0.002, mbD * 0.5 - 0.002);
  macbookGroup.add(thumbNotch);

  // Recessed Dark Anodized Magic Keyboard Well (y = 0.0148m, z = -0.095..+0.015m)
  const kbWellW = 0.278;
  const kbWellD = 0.108;
  const kbWell = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(kbWellW, 0.002, kbWellD)),
    keycapMat
  );
  kbWell.name = 'study.macbookPro.keyboardWell';
  kbWell.position.set(0, 0.0018 + baseH + 0.001, -0.036);
  macbookGroup.add(kbWell);

  // 6 Rows of individual sculpted Magic Keyboard keycaps + Touch ID key (shared BufferGeometries)
  const keyRows = 6;
  const keyCols = 14;
  const keyW = (kbWellW - 0.012) / keyCols - 0.002;
  const keyD = (kbWellD - 0.01) / keyRows - 0.002;
  const fnKeyGeo = createSharedGeo(new THREE.BoxGeometry(keyW, 0.0016, keyD * 0.82));
  const stdKeyGeo = createSharedGeo(new THREE.BoxGeometry(keyW, 0.0016, keyD));
  const spacebarGeo = createSharedGeo(new THREE.BoxGeometry(keyW * 5 + 0.008, 0.0016, keyD));
  for (let r = 0; r < keyRows; r++) {
    const kz = -0.036 - kbWellD * 0.5 + 0.009 + r * (keyD + 0.002);
    for (let c = 0; c < keyCols; c++) {
      // Merge bottom-center keys into the wide Spacebar
      if (r === keyRows - 1 && c >= 4 && c <= 8) {
        if (c === 6) {
          const spacebar = tagHighLod(
            new THREE.Mesh(spacebarGeo, keycapMat)
          );
          spacebar.name = 'study.macbookPro.key.spacebar';
          spacebar.position.set(0, 0.0018 + baseH + 0.0028, kz);
          macbookGroup.add(spacebar);
        }
        continue;
      }
      const kx = -kbWellW * 0.5 + 0.015 + c * (keyW + 0.002);
      const keyMesh = tagHighLod(
        new THREE.Mesh(r === 0 ? fnKeyGeo : stdKeyGeo, keycapMat)
      );
      keyMesh.name = `study.macbookPro.key.r${r + 1}c${c + 1}`;
      keyMesh.position.set(kx, 0.0018 + baseH + 0.0028, kz);
      macbookGroup.add(keyMesh);
    }
  }

  // Flanking micro-perforated side speaker grilles left & right of the Magic Keyboard
  const speakerGrilleGeo = createSharedGeo(new THREE.BoxGeometry(0.022, 0.002, kbWellD - 0.006));
  for (const sideX of [-0.156, 0.156] as const) {
    const speakerGrille = tagHighLod(
      new THREE.Mesh(speakerGrilleGeo, trackpadMat)
    );
    speakerGrille.name = `study.macbookPro.speakerGrille.${sideX < 0 ? 'left' : 'right'}`;
    speakerGrille.position.set(sideX, 0.0018 + baseH + 0.001, -0.036);
    macbookGroup.add(speakerGrille);
  }

  // Large Haptic Force Touch Glass Trackpad centered on the palm rest (z = +0.068m)
  const trackpad = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.158, 0.002, 0.096)),
    trackpadMat
  );
  trackpad.name = 'study.macbookPro.trackpad';
  trackpad.position.set(0, 0.0018 + baseH + 0.001, 0.068);
  macbookGroup.add(trackpad);

  // 2. Hinged Ultra-Thin Liquid Retina XDR Display Lid (tilted open at 108° along the rear -Z edge)
  const lidPivot = new THREE.Group();
  lidPivot.name = 'study.macbookPro.displayLid';
  lidPivot.position.set(0, 0.0018 + baseH, -mbD * 0.5 + 0.008);
  lidPivot.rotation.x = -0.31; // Open 108 degrees (tilted slightly back from vertical)

  // Cylindrical black hinge barrel
  const hingeBarrel = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.0045, 0.0045, 0.25, 14)),
      keycapMat
    )
  );
  hingeBarrel.name = 'study.macbookPro.hingeBarrel';
  hingeBarrel.rotation.z = Math.PI / 2;
  lidPivot.add(hingeBarrel);

  const lidH = mbD - 0.004;
  const lidThickness = 0.0046;
  const lidShell = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(mbW, lidH, lidThickness)),
    spaceBlackAlumMat
  );
  lidShell.name = 'study.macbookPro.lidShell';
  lidShell.position.set(0, lidH * 0.5, 0);
  lidShell.castShadow = true;
  lidShell.receiveShadow = true;
  lidPivot.add(lidShell);

  // Polished metallic emblem medallion on the rear (-Z) exterior of the lid
  const rearEmblem = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.001, 24)),
      silverLogoMat
    )
  );
  rearEmblem.name = 'study.macbookPro.rearEmblem';
  rearEmblem.rotation.x = Math.PI / 2;
  rearEmblem.position.set(0, lidH * 0.52, -lidThickness * 0.5 - 0.002);
  lidPivot.add(rearEmblem);

  // Procedural 512x320 Liquid Retina XDR Screen Texture (macOS desktop + VS Code / KNX topology + Terminal + Dock)
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 320;
  const sCtx = screenCanvas.getContext('2d');
  if (sCtx) {
    // Dark macOS Sequoia / Sonoma wallpaper gradient
    const bgGrad = sCtx.createLinearGradient(0, 0, 512, 320);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.45, '#1e293b');
    bgGrad.addColorStop(1, '#172554');
    sCtx.fillStyle = bgGrad;
    sCtx.fillRect(0, 0, 512, 320);

    // Top menu bar + camera notch
    sCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    sCtx.fillRect(0, 0, 512, 14);
    sCtx.fillStyle = '#050608';
    sCtx.fillRect(216, 0, 80, 14);

    // Main IDE / Code Window on left (x = 18..315, y = 24..276)
    sCtx.fillStyle = '#111318';
    sCtx.fillRect(18, 24, 296, 252);
    sCtx.strokeStyle = '#334155';
    sCtx.lineWidth = 1.5;
    sCtx.strokeRect(18, 24, 296, 252);

    // Window traffic lights (red, yellow, green)
    for (const [tx, col] of [
      [28, '#ef4444'],
      [38, '#f59e0b'],
      [48, '#10b981'],
    ] as const) {
      sCtx.fillStyle = col;
      sCtx.beginPath();
      sCtx.arc(tx, 33, 3, 0, Math.PI * 2);
      sCtx.fill();
    }

    // Syntax-highlighted code lines
    const codeColors = ['#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#94a3b8'];
    for (let line = 0; line < 18; line++) {
      const ly = 50 + line * 12;
      const indent = ((line * 3) % 4) * 10;
      sCtx.fillStyle = codeColors[line % codeColors.length];
      sCtx.fillRect(36 + indent, ly, 42 + ((line * 19) % 70), 4);
      sCtx.fillStyle = '#64748b';
      sCtx.fillRect(92 + indent + ((line * 19) % 50), ly, 35 + ((line * 13) % 60), 4);
    }

    // Right-hand KNX Diagnostics / Telemetry Panel (x = 326..494, y = 24..276)
    sCtx.fillStyle = '#0f141c';
    sCtx.fillRect(326, 24, 168, 252);
    sCtx.strokeStyle = '#334155';
    sCtx.strokeRect(326, 24, 168, 252);
    sCtx.fillStyle = '#22c55e';
    sCtx.fillRect(340, 46, 140, 6);
    sCtx.fillStyle = '#38bdf8';
    for (let b = 0; b < 8; b++) {
      const bh = 28 + ((b * 23) % 64);
      sCtx.fillRect(342 + b * 17, 160 - bh, 11, bh);
    }

    // macOS Dock pill at bottom
    sCtx.fillStyle = 'rgba(30, 41, 59, 0.78)';
    sCtx.fillRect(146, 292, 220, 20);
    for (let d = 0; d < 9; d++) {
      sCtx.fillStyle = codeColors[d % codeColors.length];
      sCtx.fillRect(156 + d * 22, 295, 14, 14);
    }
  }
  const mbScreenTex = new THREE.CanvasTexture(screenCanvas);
  mbScreenTex.colorSpace = THREE.SRGBColorSpace;

  const screenPanel = new THREE.Mesh(
    createSharedGeo(new THREE.PlaneGeometry(mbW - 0.012, lidH - 0.016)),
    new THREE.MeshStandardMaterial({
      map: mbScreenTex,
      roughness: 0.12,
      metalness: 0.08,
      emissive: 0xffffff,
      emissiveMap: mbScreenTex,
      emissiveIntensity: 0.35,
    })
  );
  screenPanel.name = 'study.macbookPro.screen';
  screenPanel.position.set(0, lidH * 0.5 + 0.002, lidThickness * 0.5 + 0.003);
  lidPivot.add(screenPanel);

  macbookGroup.add(lidPivot);
  scene.add(macbookGroup);
}

/**
 * 19-Inch Ubiquiti UniFi Server Rack, Bambu Lab X1 Carbon Combo 3D Printer,
 * and Aluminum-Framed Magnetic Dry-Erase Whiteboard.
 */
export function buildStudyShelvingAndMonitors(
  ctx: SceneBuilderContext,
  kit: StudyShelvingAndMonitorsKit,
  deskH: number
): void {
  const { scene } = ctx;
  const { tagCutawayWall, tier2FloorY } = kit;

  // =========================================================================
  // 4. Issue #16: 19-Inch Ubiquiti UniFi Glass-Door Server Rack Cabinet Under the East Side of the Desk
  //    Positioned at [-19.86, tier2FloorY, 11.15] (0.56m W x 0.714m H x 0.58m D, facing North -Z)
  // =========================================================================
  const rackGroup = new THREE.Group();
  rackGroup.name = 'study.ubiquitiServerRack';
  rackGroup.userData.zone = 'study';
  rackGroup.position.set(-19.86, tier2FloorY, 11.15);

  const rackCabinetBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d22, // Powder-coated matte black steel 19" rack enclosure
    roughness: 0.42,
    metalness: 0.62,
  });
  const unifiSilverAlumMat = new THREE.MeshStandardMaterial({
    color: 0xdce1e6, // Ubiquiti UniFi signature bead-blasted anodized silver-white aluminum
    roughness: 0.24,
    metalness: 0.78,
  });
  const unifiDarkPortBayMat = new THREE.MeshStandardMaterial({
    color: 0x111419,
    roughness: 0.35,
    metalness: 0.5,
  });
  const unifiLcmTouchscreenMat = new THREE.MeshStandardMaterial({
    color: 0x1e90ff,
    emissive: 0x1a88ff,
    emissiveIntensity: 1.35,
    roughness: 0.15,
  });
  const unifiEtherlightCyanMat = new THREE.MeshStandardMaterial({
    color: 0x38f2ff, // UniFi Pro Max Etherlighting™ glowing RJ45 & SFP+ ports
    emissive: 0x18d8ff,
    emissiveIntensity: 1.45,
    roughness: 0.2,
  });
  const unifiStatusWhiteLedMat = new THREE.MeshStandardMaterial({
    color: 0xeef6ff,
    emissive: 0x88ccff,
    emissiveIntensity: 1.1,
  });
  const upsGreenLedMat = new THREE.MeshStandardMaterial({
    color: 0x22ee66,
    emissive: 0x18cc55,
    emissiveIntensity: 1.1,
  });
  const rackSmokedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x18222c,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.34,
  });

  const rackW = 0.56;
  const rackH = 0.714;
  const rackD = 0.58;

  // Outer steel rack cabinet body (recessed open front cavity so 19" UniFi appliances sit inside)
  const rackBackAndSides = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(rackW, rackH, rackD - 0.06)),
    rackCabinetBlackMat
  );
  rackBackAndSides.name = 'study.ubiquitiServerRack.cabinet';
  rackBackAndSides.position.set(0, rackH * 0.5, 0.03);
  rackBackAndSides.castShadow = true;
  rackBackAndSides.receiveShadow = true;
  rackGroup.add(rackBackAndSides);

  // Front left & right vertical steel rack pillars + top & bottom bezel rails
  const frontPillarGeo = createSharedGeo(new THREE.BoxGeometry(0.056, rackH, 0.06));
  for (const sx of [-rackW * 0.5 + 0.028, rackW * 0.5 - 0.028] as const) {
    const frontPillar = new THREE.Mesh(
      frontPillarGeo,
      rackCabinetBlackMat
    );
    frontPillar.name = `study.ubiquitiServerRack.frontPillar.${sx < 0 ? 'left' : 'right'}`;
    frontPillar.position.set(sx, rackH * 0.5, -rackD * 0.5 + 0.03);
    frontPillar.castShadow = true;
    rackGroup.add(frontPillar);
  }
  const horizRailGeo = createSharedGeo(new THREE.BoxGeometry(rackW, 0.048, 0.06));
  for (const [rIdx, [ry]] of ([
    [0.024, 0.048],
    [rackH - 0.024, 0.048],
  ] as const).entries()) {
    const horizRail = new THREE.Mesh(
      horizRailGeo,
      rackCabinetBlackMat
    );
    horizRail.name = `study.ubiquitiServerRack.horizRail.${rIdx === 0 ? 'bottom' : 'top'}`;
    horizRail.position.set(0, ry, -rackD * 0.5 + 0.03);
    rackGroup.add(horizRail);
  }

  // 19-Inch Ubiquiti UniFi Rackmount Equipment Stack (facing North -Z at Z = -rackD * 0.5 + 0.026):
  const faceZ = -rackD * 0.5 + 0.026;
  const unitW = 0.442; // Standard 19-inch rack appliance width (442mm)
  const rack1UChassisGeo = createSharedGeo(new THREE.BoxGeometry(unitW, 0.043, 0.024));
  const lcmScreenGeo = createSharedGeo(new THREE.BoxGeometry(0.032, 0.032, 0.004));

  // (a) Top 1U: 24-Port Keystone Patch Panel & Brush Strip (Y = 0.625m, height 0.042m)
  const patchPanel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(unitW, 0.042, 0.018)),
    unifiSilverAlumMat
  );
  patchPanel.name = 'study.ubiquitiServerRack.patchPanel';
  patchPanel.position.set(0, 0.625, faceZ);
  rackGroup.add(patchPanel);

  // (b) 1U Ubiquiti UniFi Dream Machine Pro Max (UDM-Pro-Max, Y = 0.568m, height 0.043m)
  const udmProMax = new THREE.Mesh(
    rack1UChassisGeo,
    unifiSilverAlumMat
  );
  udmProMax.name = 'study.ubiquitiServerRack.udmProMax';
  udmProMax.position.set(0, 0.568, faceZ);
  rackGroup.add(udmProMax);

  // Left 1.3" LCM color touchscreen on UDM-Pro-Max
  const udmScreen = tagHighLod(
    new THREE.Mesh(lcmScreenGeo, unifiLcmTouchscreenMat)
  );
  udmScreen.name = 'study.ubiquitiServerRack.udmProMax.lcmScreen';
  udmScreen.position.set(-unitW * 0.5 + 0.032, 0.568, faceZ - 0.0195);
  rackGroup.add(udmScreen);

  // Dual 3.5" NVR HDD drive bay caddies + 8-port GbE switch & dual 10G SFP+ WAN bay on UDM-Pro-Max
  const driveBayGeo = createSharedGeo(new THREE.BoxGeometry(0.098, 0.028, 0.005));
  for (const [bIdx, bayX] of ([-0.095, 0.015] as const).entries()) {
    const driveBay = tagHighLod(
      new THREE.Mesh(driveBayGeo, unifiDarkPortBayMat)
    );
    driveBay.name = `study.ubiquitiServerRack.udmProMax.driveBay.${bIdx + 1}`;
    driveBay.position.set(bayX, 0.568, faceZ - 0.0145);
    rackGroup.add(driveBay);
  }
  const udmPortBank = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.135, 0.026, 0.005)),
      unifiDarkPortBayMat
    )
  );
  udmPortBank.name = 'study.ubiquitiServerRack.udmProMax.portBank';
  udmPortBank.position.set(0.14, 0.568, faceZ - 0.0145);
  rackGroup.add(udmPortBank);

  // (c) 1U Ubiquiti UniFi Pro Max 24 PoE Switch (USW-Pro-Max-24-PoE, Y = 0.510m, height 0.043m)
  const uswProMax = new THREE.Mesh(
    rack1UChassisGeo,
    unifiSilverAlumMat
  );
  uswProMax.name = 'study.ubiquitiServerRack.uswProMax24Poe';
  uswProMax.position.set(0, 0.51, faceZ);
  rackGroup.add(uswProMax);

  const uswScreen = tagHighLod(
    new THREE.Mesh(lcmScreenGeo, unifiLcmTouchscreenMat)
  );
  uswScreen.name = 'study.ubiquitiServerRack.uswProMax24Poe.lcmScreen';
  uswScreen.position.set(-unitW * 0.5 + 0.032, 0.51, faceZ - 0.0195);
  rackGroup.add(uswScreen);

  // Glowing Etherlighting™ 24× RJ45 + 2× 10G SFP+ port strip across USW-Pro-Max-24-PoE
  const etherlightBay = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.34, 0.024, 0.005)),
      unifiDarkPortBayMat
    )
  );
  etherlightBay.name = 'study.ubiquitiServerRack.uswProMax24Poe.etherlightBay';
  etherlightBay.position.set(0.032, 0.51, faceZ - 0.0145);
  rackGroup.add(etherlightBay);

  const portGlowGeo = createSharedGeo(new THREE.BoxGeometry(0.018, 0.008, 0.004));
  for (let p = 0; p < 12; p++) {
    const portGlow = tagHighLod(
      new THREE.Mesh(portGlowGeo, unifiEtherlightCyanMat)
    );
    portGlow.name = 'study.ubiquitiServerRack.etherlightingPort';
    portGlow.position.set(-0.125 + p * 0.027, 0.514, faceZ - 0.019);
    rackGroup.add(portGlow);
  }

  // (d) 1U Ubiquiti UniFi Switch Aggregation (USW-Aggregation, Y = 0.452m, height 0.043m)
  const uswAgg = new THREE.Mesh(
    rack1UChassisGeo,
    unifiSilverAlumMat
  );
  uswAgg.name = 'study.ubiquitiServerRack.uswAggregation';
  uswAgg.position.set(0, 0.452, faceZ);
  rackGroup.add(uswAgg);

  const aggScreen = tagHighLod(
    new THREE.Mesh(lcmScreenGeo, unifiLcmTouchscreenMat)
  );
  aggScreen.name = 'study.ubiquitiServerRack.uswAggregation.lcmScreen';
  aggScreen.position.set(-unitW * 0.5 + 0.032, 0.452, faceZ - 0.0195);
  rackGroup.add(aggScreen);

  // (e) 2U Ubiquiti UniFi Protect NVR Pro (UNVR-Pro, Y = 0.365m, height 0.087m) with 7× 3.5" HDD bays
  const unvrPro = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(unitW, 0.087, 0.024)),
    unifiSilverAlumMat
  );
  unvrPro.name = 'study.ubiquitiServerRack.unvrPro';
  unvrPro.position.set(0, 0.365, faceZ);
  rackGroup.add(unvrPro);

  const unvrScreen = tagHighLod(
    new THREE.Mesh(lcmScreenGeo, unifiLcmTouchscreenMat)
  );
  unvrScreen.name = 'study.ubiquitiServerRack.unvrPro.lcmScreen';
  unvrScreen.position.set(-unitW * 0.5 + 0.032, 0.365, faceZ - 0.0195);
  rackGroup.add(unvrScreen);

  const hddSledGeo = createSharedGeo(new THREE.BoxGeometry(0.044, 0.068, 0.005));
  const hddLedGeo = createSharedGeo(new THREE.BoxGeometry(0.006, 0.006, 0.004));
  for (let d = 0; d < 7; d++) {
    const hddSled = tagHighLod(
      new THREE.Mesh(hddSledGeo, unifiDarkPortBayMat)
    );
    hddSled.name = `study.ubiquitiServerRack.unvrPro.hddSled.${d + 1}`;
    hddSled.position.set(-0.13 + d * 0.052, 0.365, faceZ - 0.0145);
    rackGroup.add(hddSled);

    const hddLed = tagHighLod(
      new THREE.Mesh(hddLedGeo, unifiStatusWhiteLedMat)
    );
    hddLed.name = `study.ubiquitiServerRack.unvrPro.hddLed.${d + 1}`;
    hddLed.position.set(-0.13 + d * 0.052, 0.39, faceZ - 0.019);
    rackGroup.add(hddLed);
  }

  // (f) 2U Rackmount Smart-UPS / Battery Backup at bottom of rack (Y = 0.145m, height 0.088m)
  const rackUps = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(unitW, 0.088, 0.024)),
    rackCabinetBlackMat
  );
  rackUps.name = 'study.ubiquitiServerRack.smartUps';
  rackUps.position.set(0, 0.145, faceZ);
  rackGroup.add(rackUps);

  const upsLcd = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.068, 0.026, 0.005)),
      upsGreenLedMat
    )
  );
  upsLcd.name = 'study.ubiquitiServerRack.smartUps.lcdScreen';
  upsLcd.position.set(0, 0.152, faceZ - 0.0195);
  rackGroup.add(upsLcd);

  // Smoked tempered-glass front rack door + brushed silver swing-handle lock
  const rackGlassDoor = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(rackW - 0.09, rackH - 0.09, 0.008)),
    rackSmokedGlassMat
  );
  rackGlassDoor.name = 'study.ubiquitiServerRack.glassDoor';
  rackGlassDoor.position.set(0, rackH * 0.5, -rackD * 0.5 + 0.004);
  rackGroup.add(rackGlassDoor);

  const rackDoorHandle = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.018, 0.14, 0.018)),
      unifiSilverAlumMat
    )
  );
  rackDoorHandle.name = 'study.ubiquitiServerRack.doorHandle';
  rackDoorHandle.position.set(rackW * 0.5 - 0.06, rackH * 0.5, -rackD * 0.5 - 0.004);
  rackGroup.add(rackDoorHandle);

  scene.add(rackGroup);

  // =========================================================================
  // 5. Issue #17: Bambu Lab X1 Carbon Combo (X1C + 4-Spool AMS) Enclosed CoreXY 3D Printer
  //    Positioned on the East side of the Study Oak Desk at [-19.85, tier2FloorY + deskH, 11.15]
  //    (Y = +0.16m, facing North -Z into the Study)
  // =========================================================================
  const printerGroup = new THREE.Group();
  printerGroup.name = 'study.bambuLab3dPrinter';
  printerGroup.userData.zone = 'study';
  printerGroup.position.set(-19.85, tier2FloorY + deskH, 11.15);

  const bambuSpaceGreyAlumMat = new THREE.MeshStandardMaterial({
    color: 0x7c8288, // Bambu Lab X1 Carbon anodized space-grey aluminum side panels
    roughness: 0.28,
    metalness: 0.68,
  });
  const bambuCharcoalTrimMat = new THREE.MeshStandardMaterial({
    color: 0x22262b, // Matte dark charcoal polymer frame, AMS base & toolhead shroud
    roughness: 0.44,
    metalness: 0.22,
  });
  const bambuSmokedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x161c22,
    roughness: 0.06,
    metalness: 0.18,
    transparent: true,
    opacity: 0.38,
  });
  const bambuPeiGoldPlateMat = new THREE.MeshStandardMaterial({
    color: 0xb88a38, // Textured PEI spring-steel build plate
    roughness: 0.46,
    metalness: 0.55,
  });
  const bambuChamberLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: 0xffeed0,
    emissiveIntensity: 1.35,
  });
  const bambuOrangePlaMat = new THREE.MeshStandardMaterial({
    color: 0xff6218, // Bambu Lab signature Mandarin Orange PLA filament
    roughness: 0.34,
  });
  const bambuGreenPetgMat = new THREE.MeshStandardMaterial({
    color: 0x18b858, // Bambu Lab signature green filament
    roughness: 0.34,
  });
  const bambuWhitePlaMat = new THREE.MeshStandardMaterial({
    color: 0xf0f2f4, // Jade White PLA filament
    roughness: 0.34,
  });

  const x1cW = 0.389;
  const x1cH = 0.458;
  const x1cD = 0.389;

  // Lower dark charcoal base plinth & upper top portal frame of the X1-Carbon
  const x1cBaseFrame = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(x1cW, 0.048, x1cD)),
    bambuCharcoalTrimMat
  );
  x1cBaseFrame.name = 'study.bambuLab3dPrinter.baseFrame';
  x1cBaseFrame.position.set(0, 0.024, 0);
  x1cBaseFrame.castShadow = true;
  printerGroup.add(x1cBaseFrame);

  const x1cTopFrame = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(x1cW, 0.042, x1cD)),
    bambuCharcoalTrimMat
  );
  x1cTopFrame.name = 'study.bambuLab3dPrinter.topFrame';
  x1cTopFrame.position.set(0, x1cH - 0.021, 0);
  x1cTopFrame.castShadow = true;
  printerGroup.add(x1cTopFrame);

  // Left (-X) & Right (+X) Space-Grey Anodized Aluminum Side Panels + Rear (+Z) Panel
  const sidePanelGeo = createSharedGeo(new THREE.BoxGeometry(0.024, x1cH - 0.09, x1cD - 0.01));
  for (const sx of [-x1cW * 0.5 + 0.012, x1cW * 0.5 - 0.012] as const) {
    const sidePanel = new THREE.Mesh(
      sidePanelGeo,
      bambuSpaceGreyAlumMat
    );
    sidePanel.name = 'study.bambuLab3dPrinter.sidePanel';
    sidePanel.position.set(sx, x1cH * 0.5, 0.005);
    sidePanel.castShadow = true;
    sidePanel.receiveShadow = true;
    printerGroup.add(sidePanel);
  }
  const rearPanel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(x1cW - 0.048, x1cH - 0.09, 0.024)),
    bambuCharcoalTrimMat
  );
  rearPanel.name = 'study.bambuLab3dPrinter.rearPanel';
  rearPanel.position.set(0, x1cH * 0.5, x1cD * 0.5 - 0.012);
  rearPanel.castShadow = true;
  printerGroup.add(rearPanel);

  // Interior Build Chamber: Z-Axis Heated Bed + Textured PEI Build Plate (Y = 0.16m) + Printed Orange Prototype Part
  const heatedBed = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.265, 0.014, 0.265)),
    bambuCharcoalTrimMat
  );
  heatedBed.name = 'study.bambuLab3dPrinter.heatedBed';
  heatedBed.position.set(0, 0.155, 0.01);
  printerGroup.add(heatedBed);

  const peiPlate = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.256, 0.004, 0.256)),
    bambuPeiGoldPlateMat
  );
  peiPlate.name = 'study.bambuLab3dPrinter.peiBuildPlate';
  peiPlate.position.set(0, 0.164, 0.01);
  printerGroup.add(peiPlate);

  // 3D-printed Mandarin Orange prototype housing on the center of the PEI build plate
  const printedPart = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.072, 0.054, 0.064)),
    bambuOrangePlaMat
  );
  printedPart.name = 'study.bambuLab3dPrinter.printedModel';
  printedPart.position.set(0, 0.193, 0.01);
  printedPart.castShadow = true;
  printerGroup.add(printedPart);

  // CoreXY Carbon-Fiber X-Axis Dual Rods + Bambu Lab Toolhead Extruder with Glowing White Logo LED Bar (Y = 0.31m)
  const cfRodGeo = createSharedGeo(new THREE.CylinderGeometry(0.005, 0.005, x1cW - 0.06, 10));
  for (const [rIdx, rz] of ([-0.018, 0.022] as const).entries()) {
    const cfRod = tagHighLod(
      new THREE.Mesh(cfRodGeo, bambuCharcoalTrimMat)
    );
    cfRod.name = `study.bambuLab3dPrinter.carbonRod.${rIdx + 1}`;
    cfRod.rotation.z = Math.PI / 2;
    cfRod.position.set(0, 0.315, rz);
    printerGroup.add(cfRod);
  }

  const toolhead = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.058, 0.092, 0.064)),
    bambuSpaceGreyAlumMat
  );
  toolhead.name = 'study.bambuLab3dPrinter.toolhead';
  toolhead.position.set(0.015, 0.305, -0.005);
  toolhead.castShadow = true;
  printerGroup.add(toolhead);

  const toolheadLedBar = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.042, 0.006, 0.004)),
      bambuChamberLedMat
    )
  );
  toolheadLedBar.name = 'study.bambuLab3dPrinter.toolhead.ledBar';
  toolheadLedBar.position.set(0.015, 0.312, -0.038);
  printerGroup.add(toolheadLedBar);

  // Interior warm-white chamber LED light strip along the top-left gantry rail
  const chamberLightBar = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.008, 0.008, 0.28)),
      bambuChamberLedMat
    )
  );
  chamberLightBar.name = 'study.bambuLab3dPrinter.chamberLightBar';
  chamberLightBar.position.set(-x1cW * 0.5 + 0.028, x1cH - 0.055, 0);
  printerGroup.add(chamberLightBar);

  // Tinted Tempered-Glass Front Door (-Z face) + Vertical Handle & Top-Left 5" Tilted Color Touchscreen
  const x1cGlassDoor = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(x1cW - 0.016, x1cH - 0.068, 0.006)),
    bambuSmokedGlassMat
  );
  x1cGlassDoor.name = 'study.bambuLab3dPrinter.glassDoor';
  x1cGlassDoor.position.set(0, x1cH * 0.5 - 0.008, -x1cD * 0.5 - 0.002);
  printerGroup.add(x1cGlassDoor);

  const x1cDoorHandle = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.014, 0.11, 0.014)),
      bambuCharcoalTrimMat
    )
  );
  x1cDoorHandle.name = 'study.bambuLab3dPrinter.doorHandle';
  x1cDoorHandle.position.set(x1cW * 0.5 - 0.028, x1cH * 0.5, -x1cD * 0.5 - 0.01);
  printerGroup.add(x1cDoorHandle);

  // Top-left tilted 5-inch color touchscreen controller (facing North -Z)
  const x1cScreenBezel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.128, 0.078, 0.014)),
    bambuCharcoalTrimMat
  );
  x1cScreenBezel.name = 'study.bambuLab3dPrinter.touchscreen';
  x1cScreenBezel.position.set(-x1cW * 0.5 + 0.082, x1cH - 0.018, -x1cD * 0.5 - 0.014);
  x1cScreenBezel.rotation.x = -0.24;
  printerGroup.add(x1cScreenBezel);

  const x1cScreenActive = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.112, 0.064, 0.004)),
      unifiLcmTouchscreenMat
    )
  );
  x1cScreenActive.name = 'study.bambuLab3dPrinter.touchscreen.lcd';
  x1cScreenActive.position.set(-x1cW * 0.5 + 0.082, x1cH - 0.018, -x1cD * 0.5 - 0.021);
  x1cScreenActive.rotation.x = -0.24;
  printerGroup.add(x1cScreenActive);

  // Top-Mounted Bambu Lab 4-Spool AMS (Automatic Material System) Unit (0.368m W x 0.224m H x 0.283m D)
  const amsBase = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.368, 0.092, 0.283)),
    bambuCharcoalTrimMat
  );
  amsBase.name = 'study.bambuLab3dPrinter.amsBase';
  amsBase.position.set(0, x1cH + 0.046, 0.015);
  amsBase.castShadow = true;
  printerGroup.add(amsBase);

  // 4 Filament Spools inside the AMS (Orange PLA, White PLA, Charcoal PLA-CF, Green PETG)
  const spoolMats = [
    bambuOrangePlaMat,
    bambuWhitePlaMat,
    bambuCharcoalTrimMat,
    bambuGreenPetgMat,
  ] as const;
  const filamentCoreGeo = createSharedGeo(new THREE.CylinderGeometry(0.086, 0.086, 0.052, 20));
  const spoolFlangeGeo = createSharedGeo(new THREE.CylinderGeometry(0.098, 0.098, 0.005, 20));
  for (let s = 0; s < 4; s++) {
    const sx = -0.126 + s * 0.084;
    const spoolPrefix = `study.bambuLab3dPrinter.amsSpool.${s + 1}`;
    const spoolGroup = new THREE.Group();
    spoolGroup.name = spoolPrefix;
    spoolGroup.position.set(sx, x1cH + 0.115, 0.015);

    // Wound filament core cylinder (Ø190mm x 56mm wide)
    const filamentCore = tagHighLod(
      new THREE.Mesh(filamentCoreGeo, spoolMats[s]!)
    );
    filamentCore.name = `${spoolPrefix}.filament`;
    filamentCore.rotation.z = Math.PI / 2;
    spoolGroup.add(filamentCore);

    // Left & right dark grey reusable Bambu spool flanges (Ø200mm)
    for (const fx of [-0.028, 0.028] as const) {
      const flange = tagHighLod(
        new THREE.Mesh(spoolFlangeGeo, bambuCharcoalTrimMat)
      );
      flange.name = `${spoolPrefix}.flange.${fx < 0 ? 'left' : 'right'}`;
      flange.rotation.z = Math.PI / 2;
      flange.position.set(fx, 0, 0);
      spoolGroup.add(flange);
    }

    printerGroup.add(spoolGroup);
  }

  // Smoked-transparent curved polycarbonate AMS top cover lid
  const amsCover = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.364, 0.132, 0.278)),
    bambuSmokedGlassMat
  );
  amsCover.name = 'study.bambuLab3dPrinter.amsCover';
  amsCover.position.set(0, x1cH + 0.158, 0.015);
  printerGroup.add(amsCover);

  scene.add(printerGroup);

  // =========================================================================
  // 6. Issue #12: Aluminum-Framed Magnetic Dry-Erase Whiteboard on the Study West Wall
  //    Moved slightly up (+Y = 0.94m) and to the left / South (+Z = 10.36m when facing West -X)
  //    above the West leg of the L-shaped corner desk
  // =========================================================================
  const whiteboardGroup = new THREE.Group();
  whiteboardGroup.name = 'study.westWallWhiteboard';
  whiteboardGroup.userData.zone = 'study';
  whiteboardGroup.position.set(-22.18, 0.94, 10.36);
  tagCutawayWall(whiteboardGroup, {
    axis: 'x',
    coord: -22.33,
    minSpan: 8.39,
    maxSpan: 11.77,
    floor: 'ground',
  });

  const wbW = 1.44; // Spans Z = 9.64m..11.08m along the West wall
  const wbH = 0.88; // Spans Y = 0.50m..1.38m above the Y = +0.16m West desk return

  const wbAlumFrameMat = new THREE.MeshStandardMaterial({
    color: 0xd0d5dc,
    roughness: 0.28,
    metalness: 0.76,
  });

  // Issue #1: Porcelain-enamel whiteboard canvas with a detailed dry-erase architectural
  // floorplan of Crox Farmhouse (Ground Floor L-shaped layout + First Floor inset + KNX/UFH legend)
  const wbCanvas = document.createElement('canvas');
  wbCanvas.width = 1024;
  wbCanvas.height = 640;
  const wbCtx = wbCanvas.getContext('2d');
  if (wbCtx) {
    // High-gloss porcelain dry-erase background
    wbCtx.fillStyle = '#f8fafc';
    wbCtx.fillRect(0, 0, 1024, 640);

    // Subtle 16px magnetic whiteboard dot-grid
    wbCtx.fillStyle = '#dce3ec';
    for (let gx = 20; gx < 1004; gx += 20) {
      for (let gy = 20; gy < 620; gy += 20) {
        wbCtx.fillRect(gx, gy, 2, 2);
      }
    }

    // Header Banner & Compass Rose ("CROX FARMHOUSE — ARCHITECTURAL & KNX / UFH FLOORPLAN")
    wbCtx.fillStyle = '#1c2026';
    wbCtx.font = 'bold 20px "Courier New", monospace';
    wbCtx.fillText('CROX FARMHOUSE — GROUND & 1ST FLOOR PLAN (1:50)', 28, 36);
    wbCtx.strokeStyle = '#1c2026';
    wbCtx.lineWidth = 2;
    wbCtx.beginPath();
    wbCtx.moveTo(28, 44);
    wbCtx.lineTo(660, 44);
    wbCtx.stroke();

    // North Arrow in top-right header
    wbCtx.save();
    wbCtx.translate(968, 42);
    wbCtx.strokeStyle = '#1d5bbf';
    wbCtx.fillStyle = '#1d5bbf';
    wbCtx.lineWidth = 2.2;
    wbCtx.beginPath();
    wbCtx.arc(0, 0, 18, 0, Math.PI * 2);
    wbCtx.stroke();
    wbCtx.beginPath();
    wbCtx.moveTo(0, -15);
    wbCtx.lineTo(-6, 8);
    wbCtx.lineTo(0, 3);
    wbCtx.lineTo(6, 8);
    wbCtx.closePath();
    wbCtx.fill();
    wbCtx.font = 'bold 12px sans-serif';
    wbCtx.textAlign = 'center';
    wbCtx.fillText('N', 0, -21);
    wbCtx.restore();

    // Coordinate transform helper mapping world (X in [-22.3..+4.5], Z in [-2.5..+11.85]) to whiteboard pixels:
    // Scale = 35 px/m:
    //   X: -22.3m -> px = 38, +4.5m -> px = 976 (total width = 26.8m * 35 = 938px)
    //   Z: -2.5m  -> py = 64, +11.85m -> py = 566 (total height = 14.35m * 35 = 502px)
    const wx = (xMeters: number): number => Math.round(38 + (xMeters + 22.3) * 35);
    const wz = (zMeters: number): number => Math.round(64 + (zMeters + 2.5) * 35);
    const wm = (meters: number): number => Math.round(meters * 35);

    // 1. Soft dry-erase room zone shading (green = UFH zones, blue = radiator zones)
    const fillRoomZone = (x0: number, z0: number, x1: number, z1: number, color: string): void => {
      wbCtx.fillStyle = color;
      wbCtx.fillRect(wx(x0), wz(z0), wx(x1) - wx(x0), wz(z1) - wz(z0));
    };
    // Radiator zones (Front Room, Sitting Room, Hall, Study) in faint blue tint
    fillRoomZone(-22.25, -2.5, -17.55, 2.19, 'rgba(29, 91, 191, 0.06)');
    fillRoomZone(-17.31, -2.5, -13.05, 2.19, 'rgba(29, 91, 191, 0.05)');
    fillRoomZone(-22.25, 3.67, -17.55, 8.27, 'rgba(29, 91, 191, 0.06)');
    fillRoomZone(-22.25, 8.39, -18.82, 11.83, 'rgba(29, 91, 191, 0.08)');
    // UFH zones (WC/Boot Lobby, Dining Room, Kitchen & Utility) in faint red-orange UFH tint
    fillRoomZone(-12.81, -2.5, -9.8, 2.4, 'rgba(214, 40, 40, 0.06)');
    fillRoomZone(-9.56, -2.5, -4.64, 2.4, 'rgba(214, 40, 40, 0.06)');
    fillRoomZone(-4.5, -2.5, 4.5, 2.45, 'rgba(214, 40, 40, 0.07)');
    // Plant Room in faint green technical tint
    fillRoomZone(-18.82, 8.39, -17.55, 11.83, 'rgba(36, 130, 50, 0.09)');

    // 2. Red dry-erase serpentine UFH pipe loops sketched inside the UFH rooms
    wbCtx.strokeStyle = 'rgba(214, 40, 40, 0.34)';
    wbCtx.lineWidth = 1.5;
    const drawUfhSerpentine = (x0: number, z0: number, x1: number, z1: number, loops: number): void => {
      const px0 = wx(x0) + 8;
      const px1 = wx(x1) - 8;
      const pz0 = wz(z0) + 8;
      const pz1 = wz(z1) - 8;
      const stepZ = (pz1 - pz0) / loops;
      wbCtx.beginPath();
      for (let i = 0; i < loops; i++) {
        const yA = pz0 + i * stepZ;
        const yB = yA + stepZ * 0.5;
        wbCtx.moveTo(px0, yA);
        wbCtx.lineTo(px1, yA);
        wbCtx.arc(px1, (yA + yB) * 0.5, stepZ * 0.25, -Math.PI / 2, Math.PI / 2);
        wbCtx.lineTo(px0, yB);
      }
      wbCtx.stroke();
    };
    drawUfhSerpentine(-12.6, -0.1, -11.0, 2.2, 4); // Boot Lobby UFH
    drawUfhSerpentine(-9.3, -2.2, -5.0, 2.1, 6);   // Dining Room UFH
    drawUfhSerpentine(-4.3, -2.2, -1.6, -0.5, 3);  // Utility UFH
    drawUfhSerpentine(-1.2, -2.2, 4.2, 2.2, 6);    // Kitchen UFH

    // 3. Furniture, Cabinetry & Fixture Blueprint Outlines (Blue Dry-Erase Marker #1d5bbf)
    wbCtx.strokeStyle = '#1d5bbf';
    wbCtx.lineWidth = 1.8;

    // Living Room: Chaise sofa, rug & North wall 83" OLED TV
    wbCtx.strokeRect(wx(-20.9), wz(-0.7), wm(2.1), wm(1.4)); // Loaf Chaise Sofa
    wbCtx.strokeRect(wx(-20.95), wz(-2.45), wm(1.85), wm(0.12)); // 83" OLED TV

    // Hall: Quarter-turn staircase treads + Porch
    wbCtx.strokeRect(wx(-17.2), wz(-1.6), wm(1.1), wm(3.5));
    for (let st = -1.4; st <= 1.6; st += 0.3) {
      wbCtx.beginPath();
      wbCtx.moveTo(wx(-17.2), wz(st));
      wbCtx.lineTo(wx(-16.1), wz(st));
      wbCtx.stroke();
    }
    // Front Porch projection (Z = 2.19m..3.55m, X = -16.1m..-14.2m)
    wbCtx.strokeRect(wx(-16.1), wz(2.19), wm(1.9), wm(1.36));

    // Downstairs WC (toilet + vanity) & Wine Cellar racks
    wbCtx.strokeRect(wx(-12.78), wz(-1.31), wm(0.48), wm(0.86)); // WC Vanity
    wbCtx.beginPath();
    wbCtx.arc(wx(-12.35), wz(-1.92), wm(0.2), 0, Math.PI * 2); // Traditional WC pan
    wbCtx.stroke();
    wbCtx.strokeRect(wx(-11.28), wz(-2.45), wm(1.42), wm(0.42)); // Wine cellar North rack

    // Walk-in Cupboard 2 Carbon Road Bikes
    wbCtx.strokeRect(wx(-10.35), wz(0.35), wm(0.48), wm(1.2));

    // Dining Room: Neptune Wycombe Dining Table + 6 Chairs + South Morris & Co. Runner + West Sideboard
    wbCtx.strokeRect(wx(-8.15), wz(-0.65), wm(1.9), wm(1.0)); // Dining Table
    wbCtx.strokeRect(wx(-8.77), wz(1.24), wm(3.05), wm(0.78)); // Morris & Co. Pimpernel Runner
    wbCtx.strokeRect(wx(-9.52), wz(-0.42), wm(0.42), wm(1.4)); // West Wall Sideboard

    // Kitchen & Utility: Utility counters, Kitchen L-counters & Central Island with 4 stools
    wbCtx.strokeRect(wx(-4.45), wz(-2.45), wm(2.9), wm(0.62)); // Utility North run
    wbCtx.strokeRect(wx(-1.3), wz(-2.45), wm(5.7), wm(0.65));  // Kitchen North sink & range run
    wbCtx.strokeRect(wx(-1.35), wz(-0.2), wm(0.65), wm(2.55)); // Kitchen West tall fridge/oven bank
    wbCtx.strokeRect(wx(0.15), wz(-0.65), wm(2.45), wm(1.15)); // Central Kitchen Island
    for (const sx of [0.45, 0.98, 1.51, 2.04] as const) {
      wbCtx.beginPath();
      wbCtx.arc(wx(sx), wz(0.68), wm(0.18), 0, Math.PI * 2); // Island barstools
      wbCtx.stroke();
    }

    // Sitting Room: Twin facing sofas + Central Ottoman + East Woodburner
    wbCtx.strokeRect(wx(-21.38), wz(4.58), wm(0.92), wm(2.14)); // West chocolate sofa
    wbCtx.strokeRect(wx(-19.12), wz(4.58), wm(0.92), wm(2.14)); // East ticking-stripe sofa
    wbCtx.strokeRect(wx(-20.22), wz(5.12), wm(0.84), wm(1.06)); // Central fabric ottoman

    // Study & Plant Room: L-shaped corner desk, South sofa, Boilers, Cylinders, Break Tank & UFH Manifold
    wbCtx.beginPath();
    wbCtx.moveTo(wx(-22.18), wz(8.44));
    wbCtx.lineTo(wx(-19.65), wz(8.44));
    wbCtx.lineTo(wx(-19.65), wz(9.14));
    wbCtx.lineTo(wx(-21.45), wz(9.14));
    wbCtx.lineTo(wx(-21.45), wz(11.1));
    wbCtx.lineTo(wx(-22.18), wz(11.1));
    wbCtx.closePath();
    wbCtx.stroke(); // Study L-desk
    wbCtx.strokeRect(wx(-21.05), wz(10.92), wm(1.75), wm(0.82)); // Study South sofa

    // Plant Room cylinders & break tank
    wbCtx.beginPath();
    wbCtx.arc(wx(-18.42), wz(11.35), wm(0.3), 0, Math.PI * 2); // Cylinder 1
    wbCtx.arc(wx(-17.85), wz(11.35), wm(0.3), 0, Math.PI * 2); // Cylinder 2
    wbCtx.stroke();
    wbCtx.strokeRect(wx(-18.48), wz(8.4), wm(0.76), wm(0.16)); // 10-port UFH Manifold

    // 4. Heavy Structural Exterior & Interior Partition Walls (Black Dry-Erase Marker #1c2026)
    wbCtx.strokeStyle = '#1c2026';
    wbCtx.lineWidth = 4;
    wbCtx.lineJoin = 'round';

    // Outer L-shaped perimeter of Ground Floor
    wbCtx.beginPath();
    wbCtx.moveTo(wx(-22.25), wz(-2.5));
    wbCtx.lineTo(wx(4.5), wz(-2.5));    // North exterior wall
    wbCtx.lineTo(wx(4.5), wz(2.45));    // East Kitchen wall
    wbCtx.lineTo(wx(-17.55), wz(2.45)); // South wall of Kitchen / Dining / Boot Lobby / Hall
    wbCtx.lineTo(wx(-17.55), wz(11.83)); // East wall of Sitting Room & Plant Room
    wbCtx.lineTo(wx(-22.25), wz(11.83)); // South wall of Study & Plant Room
    wbCtx.closePath();
    wbCtx.stroke();

    // Internal cross-walls & room partitions
    wbCtx.lineWidth = 3;
    const drawWall = (x0: number, z0: number, x1: number, z1: number): void => {
      wbCtx.beginPath();
      wbCtx.moveTo(wx(x0), wz(z0));
      wbCtx.lineTo(wx(x1), wz(z1));
      wbCtx.stroke();
    };
    drawWall(-17.43, -2.5, -17.43, 2.25);  // Living Room / Hall wall
    drawWall(-12.93, -2.5, -12.93, 2.4);   // Hall / WC & Boot Lobby wall
    drawWall(-12.93, -0.19, -9.68, -0.19); // WC & Wine Cellar / Boot Lobby wall
    drawWall(-11.39, -2.5, -11.39, -0.19); // WC / Wine Cellar partition
    drawWall(-10.95, -0.19, -10.95, 2.4);  // Boot Lobby / Walk-In Cupboard partition
    drawWall(-9.68, -2.5, -9.68, 2.4);     // Boot Lobby / Dining Room cross-wall
    drawWall(-7.8, -2.5, -7.8, -0.95);     // Dining Room NW alcove pier
    drawWall(-4.57, -2.5, -4.57, 2.45);    // Dining Room / Kitchen & Utility wall
    drawWall(-4.57, -0.35, -1.38, -0.35);  // Utility Room South partition
    drawWall(-1.38, -2.5, -1.38, -0.35);   // Utility Room East partition
    drawWall(-22.25, 2.25, -17.55, 2.25);  // Living Room South wall
    drawWall(-22.25, 3.61, -17.55, 3.61);  // Sitting Room North wall (corridor between)
    drawWall(-22.25, 8.33, -17.55, 8.33);  // Sitting Room / Study & Plant Room wall
    drawWall(-18.82, 8.33, -18.82, 11.83); // Study / Plant Room partition

    // 5. Room Labels & Dimensions (Handwritten-style dry-erase marker labels)
    wbCtx.fillStyle = '#1c2026';
    wbCtx.font = 'bold 13px "Courier New", monospace';
    wbCtx.textAlign = 'center';
    wbCtx.fillText('FRONT ROOM', wx(-19.9), wz(-1.25));
    wbCtx.fillText('(CINEMA)', wx(-19.9), wz(-0.8));
    wbCtx.fillText('HALL &', wx(-15.1), wz(-0.5));
    wbCtx.fillText('STAIRS', wx(-15.1), wz(-0.05));
    wbCtx.fillText('WC', wx(-12.1), wz(-1.4));
    wbCtx.fillText('CELLAR', wx(-10.55), wz(-1.4));
    wbCtx.fillText('BOOT', wx(-11.9), wz(0.9));
    wbCtx.fillText('LOBBY', wx(-11.9), wz(1.3));
    wbCtx.fillText('DINING ROOM', wx(-7.1), wz(0.35));
    wbCtx.fillText('UTILITY', wx(-3.0), wz(-1.3));
    wbCtx.fillText('KITCHEN & ISLAND', wx(1.4), wz(1.35));
    wbCtx.fillText('SITTING ROOM', wx(-19.9), wz(3.98));
    wbCtx.fillText('STUDY', wx(-20.5), wz(10.05));
    wbCtx.save();
    wbCtx.translate(wx(-18.18), wz(10.1));
    wbCtx.rotate(-Math.PI / 2);
    wbCtx.fillText('PLANT RM', 0, 4);
    wbCtx.restore();

    // Red "YOU ARE HERE" callout arrow pointing at the Study West Wall Whiteboard!
    wbCtx.fillStyle = '#d62828';
    wbCtx.strokeStyle = '#d62828';
    wbCtx.lineWidth = 2.5;
    const hereX = wx(-22.18);
    const hereZ = wz(10.36);
    wbCtx.beginPath();
    wbCtx.arc(hereX + 4, hereZ, 6, 0, Math.PI * 2);
    wbCtx.fill();
    wbCtx.beginPath();
    wbCtx.moveTo(hereX + 42, hereZ - 18);
    wbCtx.lineTo(hereX + 12, hereZ - 3);
    wbCtx.stroke();
    wbCtx.font = 'bold 11px "Courier New", monospace';
    wbCtx.textAlign = 'left';
    wbCtx.fillText('YOU ARE HERE', hereX + 16, hereZ - 22);

    // 6. Lower-Right Inset Box: FIRST FLOOR PLAN (5 Zones) + Heating & KNX Legend
    //    Occupies the open courtyard area South of Hall / Dining / Kitchen (px = 230..985, py = 268..612)
    wbCtx.strokeStyle = '#1d5bbf';
    wbCtx.lineWidth = 2.2;
    wbCtx.strokeRect(236, 272, 468, 336);
    wbCtx.fillStyle = 'rgba(29, 91, 191, 0.04)';
    wbCtx.fillRect(236, 272, 468, 336);

    wbCtx.fillStyle = '#1d5bbf';
    wbCtx.font = 'bold 15px "Courier New", monospace';
    wbCtx.textAlign = 'left';
    wbCtx.fillText('FIRST FLOOR PLAN — 5 UPSTAIRS ZONES', 252, 296);

    // First floor L-wing schematic inside inset box
    wbCtx.strokeStyle = '#1c2026';
    wbCtx.lineWidth = 3;
    // North upstairs wing (px = 256..684, py = 312..442) + West upstairs wing (px = 256..396, py = 442..588)
    wbCtx.beginPath();
    wbCtx.moveTo(256, 312);
    wbCtx.lineTo(684, 312);
    wbCtx.lineTo(684, 442);
    wbCtx.lineTo(396, 442);
    wbCtx.lineTo(396, 588);
    wbCtx.lineTo(256, 588);
    wbCtx.closePath();
    wbCtx.stroke();

    // First floor room subdivisions
    wbCtx.lineWidth = 2;
    for (const [x1, y1, x2, y2] of [
      [365, 312, 365, 442], // Bedroom 2 / Landing
      [455, 312, 455, 442], // Landing / Family Bathroom
      [545, 312, 545, 442], // Family Bathroom / Master Bedroom
      [545, 382, 684, 382], // Master En-suite / Master Bedroom
      [256, 508, 396, 508], // Bedroom 3 / Bedroom 4 (South wing)
    ] as const) {
      wbCtx.beginPath();
      wbCtx.moveTo(x1, y1);
      wbCtx.lineTo(x2, y2);
      wbCtx.stroke();
    }
    // Red UFH hatching in Family Bathroom & Master En-Suite
    wbCtx.fillStyle = 'rgba(214, 40, 40, 0.12)';
    wbCtx.fillRect(457, 314, 86, 126);
    wbCtx.fillRect(547, 314, 135, 66);

    wbCtx.fillStyle = '#1c2026';
    wbCtx.font = 'bold 11px "Courier New", monospace';
    wbCtx.textAlign = 'center';
    wbCtx.fillText('BEDROOM 2', 310, 376);
    wbCtx.fillText('LANDING', 410, 376);
    wbCtx.fillText('BATHRM', 500, 368);
    wbCtx.fillText('(UFH)', 500, 384);
    wbCtx.fillText('EN-SUITE (UFH)', 615, 352);
    wbCtx.fillText('MASTER BED', 615, 418);
    wbCtx.fillText('BEDROOM 3', 326, 478);
    wbCtx.fillText('BEDROOM 4', 326, 552);

    // 7. Right-Hand Legend & Sticky Notes Box (px = 720..992, py = 272..608)
    wbCtx.strokeStyle = '#248232';
    wbCtx.lineWidth = 2.2;
    wbCtx.strokeRect(720, 272, 272, 336);
    wbCtx.fillStyle = '#248232';
    wbCtx.font = 'bold 15px "Courier New", monospace';
    wbCtx.textAlign = 'left';
    wbCtx.fillText('KNX & HVAC SCHEDULE', 734, 296);

    wbCtx.fillStyle = '#1c2026';
    wbCtx.font = 'bold 12px "Courier New", monospace';
    const scheduleLines = [
      '• UFH PIPE: ~565m (6x100m)',
      '• MANIFOLD: 10-Port Plant Rm',
      '• BOILERS: 2x Vaillant 48kW',
      '• DHW: 2x 300L + 450L Tank',
      '• SOCKETS: Corston Brass',
      '• KNX BUS: Line 1.1 TP1',
    ] as const;
    for (let i = 0; i < scheduleLines.length; i++) {
      wbCtx.fillText(scheduleLines[i]!, 734, 326 + i * 24);
    }

    // Color key swatches
    wbCtx.fillStyle = '#d62828';
    wbCtx.fillRect(734, 478, 18, 12);
    wbCtx.fillText('UFH Loops (Kitchen/Din/WC)', 760, 489);
    wbCtx.fillStyle = '#1d5bbf';
    wbCtx.fillRect(734, 500, 18, 12);
    wbCtx.fillText('Cast-Iron Radiators', 760, 511);

    // 2 Yellow & Orange sticky notes stuck to the bottom-right corner of the whiteboard
    wbCtx.fillStyle = '#f9e547';
    wbCtx.fillRect(738, 526, 106, 70);
    wbCtx.fillStyle = '#ff9f1c';
    wbCtx.fillRect(862, 526, 114, 70);
    wbCtx.fillStyle = '#1c2026';
    wbCtx.font = 'bold 11px "Courier New", monospace';
    wbCtx.fillText('TODO:', 746, 544);
    wbCtx.fillText('5A Lamp Loops', 746, 562);
    wbCtx.fillText('ETS6 Upload', 746, 580);
    wbCtx.fillText('PLANT ROOM:', 870, 544);
    wbCtx.fillText('96kW Cascade', 870, 562);
    wbCtx.fillText('Tested OK ✓', 870, 580);
  }
  const wbTex = new THREE.CanvasTexture(wbCanvas);
  wbTex.colorSpace = THREE.SRGBColorSpace;
  wbTex.anisotropy = 8;
  const wbSurfaceMat = new THREE.MeshStandardMaterial({
    map: wbTex,
    roughness: 0.14,
    metalness: 0.04,
  });

  // Aluminum outer backing frame & high-gloss porcelain dry-erase writing surface
  const wbFrame = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.018, wbH, wbW)),
    wbAlumFrameMat
  );
  wbFrame.name = 'study.westWallWhiteboard.frame';
  wbFrame.position.set(0.009, 0, 0);
  wbFrame.castShadow = true;
  wbFrame.receiveShadow = true;
  whiteboardGroup.add(wbFrame);

  const wbSurface = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.006, wbH - 0.036, wbW - 0.036)),
    wbSurfaceMat
  );
  wbSurface.name = 'study.westWallWhiteboard.surface';
  wbSurface.position.set(0.018, 0, 0);
  whiteboardGroup.add(wbSurface);

  // Lower full-width anodized aluminum marker tray + 4 dry-erase markers & magnetic felt eraser
  const markerTray = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.052, 0.016, wbW * 0.76)),
    wbAlumFrameMat
  );
  markerTray.name = 'study.westWallWhiteboard.markerTray';
  markerTray.position.set(0.034, -wbH * 0.5 + 0.01, 0);
  markerTray.castShadow = true;
  whiteboardGroup.add(markerTray);

  const markerColors = [0x1c1e22, 0x1d5bbf, 0xd62828, 0x248232] as const;
  const markerGeo = createSharedGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.125, 10));
  for (let m = 0; m < 4; m++) {
    const marker = tagHighLod(
      new THREE.Mesh(
        markerGeo,
        new THREE.MeshStandardMaterial({
          color: markerColors[m]!,
          roughness: 0.32,
        })
      )
    );
    marker.name = `study.westWallWhiteboard.marker.${m + 1}`;
    marker.rotation.x = Math.PI / 2;
    marker.position.set(0.038, -wbH * 0.5 + 0.024, -0.28 + m * 0.15);
    whiteboardGroup.add(marker);
  }

  const boardEraser = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.036, 0.028, 0.12)),
      bambuCharcoalTrimMat
    )
  );
  boardEraser.name = 'study.westWallWhiteboard.eraser';
  boardEraser.position.set(0.038, -wbH * 0.5 + 0.03, 0.34);
  whiteboardGroup.add(boardEraser);

  scene.add(whiteboardGroup);
}
