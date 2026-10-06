import * as THREE from 'three';
/**
 * Generates a crisp STIHL orange-and-black brand badge texture (`#f37021` & `#141619`).
 */
let cachedStihlBadgeTexture: THREE.CanvasTexture | null = null;

export function createStihlBadgeTexture(): THREE.CanvasTexture {
  if (cachedStihlBadgeTexture) {
    return cachedStihlBadgeTexture;
  }
  const w = 256;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f37021';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = '#141619';
  ctx.font = 'italic 900 48px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STIHL', w * 0.5, h * 0.5 + 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedStihlBadgeTexture = tex;
  return tex;
}

/**
 * Generates a realistic STIHL Rollomatic ES Light guide bar texture (`#e4e8ec`)
 * with dark grey edge rails, orange stripe accents, and stencilled `STIHL` lettering.
 */
let cachedStihlGuideBarTexture: THREE.CanvasTexture | null = null;

export function createStihlGuideBarTexture(): THREE.CanvasTexture {
  if (cachedStihlGuideBarTexture) {
    return cachedStihlGuideBarTexture;
  }
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#dfe4ea');
  grad.addColorStop(0.5, '#eef2f6');
  grad.addColorStop(1, '#d2d8e0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Hardened steel guide-bar perimeter rail border
  ctx.strokeStyle = '#4a525d';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  // Signature STIHL orange & black graphic stripes on the guide bar
  ctx.fillStyle = '#f37021';
  ctx.fillRect(42, 22, w - 96, 12);
  ctx.fillStyle = '#181a1e';
  ctx.fillRect(42, h - 34, w - 96, 10);

  ctx.fillStyle = '#181a1e';
  ctx.font = 'italic 900 44px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STIHL', w * 0.48, h * 0.52);

  // Sprocket nose rivet dots
  ctx.fillStyle = '#5a626e';
  for (const [rx, ry] of [
    [w - 48, 34],
    [w - 30, 52],
    [w - 30, 76],
    [w - 48, 94],
  ] as const) {
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedStihlGuideBarTexture = tex;
  return tex;
}

/**
 * Issue #6 (Pin at `[-12.462, -0.5, 19.84]` in front of the Garage South Wall) &
 * Issue #7 ("Stihl chainsaws / hedgetrimmers on the wall here" at `[-11.233, 0.427, 20.485]`,
 * Garage South Wall at `u = 10.81m, y = 0.427m, v = 5.43m`):
 * Mounts a high-LOD **STIHL Forestry & Groundskeeping Wall Storage Rack (`outbuildings.garage.stihlWallRack`)**
 * on the interior North face of the Garage South Wall (`v = 5.41m`, centered at `u = 10.25m` spanning `u = 8.95..11.55m`),
 * featuring:
 * - Powder-coated anthracite steel slotted wall rail system & STIHL orange rubber-coated wall cradle brackets
 * - **STIHL MS 500i 20" Petrol Forestry Chainsaw** (`outbuildings.garage.stihlWallRack.chainsawMS500i`)
 * - **STIHL MSA 220 C-B 14" Cordless Chainsaw** (`outbuildings.garage.stihlWallRack.chainsawMSA220`)
 * - **STIHL HS 82 R 30" Professional Petrol Hedge Trimmer** (`outbuildings.garage.stihlWallRack.hedgeTrimmerHS82`)
 * - **STIHL HLA 86 Long-Reach Telescopic Pole Hedge Trimmer** (`outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86`)
 * - **STIHL BGA 200 Cordless Leaf Blower** (`outbuildings.garage.stihlWallRack.leafBlowerBGA200`)
 * - **Upper Shelf with STIHL AL 500 Dual Battery Charger, 2 STIHL AP 300 S Batteries, STIHL Forestry Helmet & Visor, and MotoMix Combi Can**
 */
export function buildGarageStihlWallRack(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.garage.stihlWallRack';
  // Mounted on the North face (`-v`) of the Garage South Wall (`v = 5.428m`), centered at `u = 10.25m`.
  // With `rotation.y = Math.PI`, local `+Z` protrudes North (`-v`) into the Garage and local `+X` runs West (`-u`).
  // Shifted to `u = 10.48m` on the Garage South wall (`u = 8.92m..12.04m` East bay, freed up by moving `southWing`
  // to in front of the Shower Room) so it does not overlap the new Shower Room (`u = 5.97m..8.92m`)!
  rackGroup.position.set(10.48, garageFloorTopY + 0.706, 5.415);
  rackGroup.rotation.y = Math.PI;
  rackGroup.scale.set(0.76, 0.76, 0.76);
  groundGroup.add(rackGroup);

  const stihlOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xf37021, // Authentic STIHL Orange
    roughness: 0.28,
    metalness: 0.12,
  });
  const stihlLightGreyMat = new THREE.MeshStandardMaterial({
    color: 0xdadfe5, // Authentic STIHL Light Grey magnesium/polymer crankcase housing
    roughness: 0.36,
    metalness: 0.18,
  });
  const stihlBlackMat = new THREE.MeshStandardMaterial({
    color: 0x191c20, // Matte black handles, shrouds & bumper spikes
    roughness: 0.68,
    metalness: 0.14,
  });
  const rackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x242830, // Powder-coated anthracite wall rack steel
    roughness: 0.38,
    metalness: 0.72,
  });
  const bladeSteelMat = new THREE.MeshStandardMaterial({
    color: 0xcfd6df, // Hardened chrome-vanadium shear blades & saw chain teeth
    roughness: 0.22,
    metalness: 0.88,
  });
  const stihlBadgeMat = new THREE.MeshStandardMaterial({
    map: createStihlBadgeTexture(),
    roughness: 0.26,
    metalness: 0.12,
  });
  const guideBarMat = new THREE.MeshStandardMaterial({
    map: createStihlGuideBarTexture(),
    roughness: 0.28,
    metalness: 0.65,
  });
  const fuelTankMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e1,
    roughness: 0.32,
    metalness: 0.05,
    transparent: true,
    opacity: 0.84,
  });
  const greenLedMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: new THREE.Color(0x00e676),
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });
  const meshVisorMat = new THREE.MeshStandardMaterial({
    color: 0x1e2226,
    roughness: 0.55,
    metalness: 0.45,
    transparent: true,
    opacity: 0.82,
  });

  const rackW = 2.48; // Spans u = 9.01m .. 11.49m right across hit point u = 10.81m and pin u = 9.81m

  // ---------------------------------------------------------------------------
  // 1. Anthracite Steel Wall Mounting Rails, Perforated Backboard & Upper Accessory Shelf
  // ---------------------------------------------------------------------------
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(rackW, 1.18, 0.016),
    rackSteelMat
  );
  backboard.name = 'outbuildings.garage.stihlWallRack.backboard';
  backboard.position.set(0, 1.08, 0.008);
  backboard.castShadow = true;
  backboard.receiveShadow = true;
  rackGroup.add(backboard);

  // Signature STIHL orange top header stripe & brand sign plate across the top of the wall rack
  const headerStripe = new THREE.Mesh(
    new THREE.BoxGeometry(rackW, 0.055, 0.022),
    stihlOrangeMat
  );
  headerStripe.name = 'outbuildings.garage.stihlWallRack.headerStripe';
  headerStripe.position.set(0, 1.64, 0.012);
  rackGroup.add(headerStripe);

  const headerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.11),
    stihlBadgeMat
  );
  headerSign.name = 'outbuildings.garage.stihlWallRack.headerBrandSign';
  headerSign.position.set(0, 1.64, 0.025);
  rackGroup.add(headerSign);

  // Horizontal heavy-duty steel mounting rails (`y = 0.62m, 1.02m, 1.42m`)
  let railIdx = 0;
  for (const ry of [0.62, 1.02, 1.42] as const) {
    railIdx++;
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(rackW - 0.04, 0.042, 0.028),
      rackSteelMat
    );
    rail.name = `outbuildings.garage.stihlWallRack.mountingRail.${railIdx}`;
    rail.position.set(0, ry, 0.022);
    rail.castShadow = true;
    rackGroup.add(rail);

    const orangeInlay = new THREE.Mesh(
      new THREE.BoxGeometry(rackW - 0.06, 0.01, 0.032),
      stihlOrangeMat
    );
    orangeInlay.name = `outbuildings.garage.stihlWallRack.mountingRailInlay.${railIdx}`;
    orangeInlay.userData.lodTier = 'high';
    orangeInlay.userData.lodMaxDistance = 12;
    orangeInlay.position.set(0, ry, 0.023);
    rackGroup.add(orangeInlay);
  }

  // Vertical slotted stanchions
  let stanchionIdx = 0;
  for (const sx of [-1.16, -0.58, 0.0, 0.58, 1.16] as const) {
    stanchionIdx++;
    const stanchion = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 1.14, 0.024),
      rackSteelMat
    );
    stanchion.name = `outbuildings.garage.stihlWallRack.stanchion.${stanchionIdx}`;
    stanchion.position.set(sx, 1.06, 0.018);
    rackGroup.add(stanchion);
  }

  // ---------------------------------------------------------------------------
  // 2. Helper to build a High-LOD STIHL Chainsaw (`MS 500i` 20" & `MSA 220 C-B` 14")
  // ---------------------------------------------------------------------------
  const addStihlChainsaw = (
    name: string,
    mountX: number,
    mountY: number,
    barLen: number,
    isCordless: boolean
  ): void => {
    const sawGroup = new THREE.Group();
    sawGroup.name = name;
    sawGroup.position.set(mountX, mountY, 0.14);
    // Slight downward display presentation angle along the wall
    sawGroup.rotation.z = -0.08;
    rackGroup.add(sawGroup);

    // Wall cradle hook bracket holding the chainsaw rear handle & crankcase
    for (const hx of [-0.14, 0.06] as const) {
      const hookSide = hx < 0 ? 'rear' : 'front';
      const hookArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.028, 0.16),
        stihlOrangeMat
      );
      hookArm.name = `${name}.wallHookArm.${hookSide}`;
      hookArm.userData.lodTier = 'high';
      hookArm.userData.lodMaxDistance = 12;
      hookArm.position.set(hx, -0.095, -0.06);
      sawGroup.add(hookArm);

      const hookTip = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.048, 0.022),
        stihlBlackMat
      );
      hookTip.name = `${name}.wallHookTip.${hookSide}`;
      hookTip.userData.lodTier = 'high';
      hookTip.userData.lodMaxDistance = 12;
      hookTip.position.set(hx, -0.075, 0.018);
      sawGroup.add(hookTip);
    }

    // Light-grey magnesium crankcase & clutch cover (`x = -0.14..+0.08m`)
    const crankcase = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.165, 0.155),
      stihlLightGreyMat
    );
    crankcase.name = `${name}.crankcase`;
    crankcase.position.set(-0.04, 0.0, 0);
    crankcase.castShadow = true;
    crankcase.receiveShadow = true;
    sawGroup.add(crankcase);

    // Signature STIHL Orange rounded top cylinder shroud / motor cowling
    const topShroud = new THREE.Mesh(
      new THREE.BoxGeometry(0.235, 0.115, 0.165),
      stihlOrangeMat
    );
    topShroud.name = `${name}.topShroud`;
    topShroud.position.set(-0.045, 0.095, 0);
    topShroud.castShadow = true;
    sawGroup.add(topShroud);

    const shroudCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.082, 0.22, 16),
      stihlOrangeMat
    );
    shroudCrown.name = `${name}.shroudCrown`;
    shroudCrown.rotation.z = Math.PI / 2;
    shroudCrown.position.set(-0.045, 0.135, 0);
    shroudCrown.scale.set(1, 1, 0.65);
    sawGroup.add(shroudCrown);

    // Front STIHL badge plate on recoil starter / side cover
    const sideBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.11, 0.042),
      stihlBadgeMat
    );
    sideBadge.name = `${name}.sideBadge`;
    sideBadge.userData.lodTier = 'high';
    sideBadge.userData.lodMaxDistance = 12;
    sideBadge.position.set(-0.04, 0.03, 0.084);
    sawGroup.add(sideBadge);

    // Two captive stainless bar nuts on the sprocket cover
    let nutIdx = 0;
    for (const nx of [0.015, 0.052] as const) {
      nutIdx++;
      const barNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.018, 6),
        bladeSteelMat
      );
      barNut.name = `${name}.barNut.${nutIdx}`;
      barNut.userData.lodTier = 'high';
      barNut.userData.lodMaxDistance = 12;
      barNut.rotation.x = Math.PI / 2;
      barNut.position.set(nx, -0.01, 0.082);
      sawGroup.add(barNut);
    }

    if (isCordless) {
      // STIHL AP 300 S Lithium-Ion Battery Pack slotted into the top-rear chamber with glowing green LEDs
      const apBattery = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.125, 0.115),
        stihlBlackMat
      );
      apBattery.name = `${name}.ap300sBattery`;
      apBattery.position.set(-0.14, 0.06, 0);
      sawGroup.add(apBattery);

      const apOrangeCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.092, 0.028, 0.112),
        stihlOrangeMat
      );
      apOrangeCap.name = `${name}.ap300sBatteryCap`;
      apOrangeCap.position.set(-0.14, 0.13, 0);
      sawGroup.add(apOrangeCap);

      const ledBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.008, 0.006),
        greenLedMat
      );
      ledBar.name = `${name}.batteryChargeLed`;
      ledBar.userData.lodTier = 'high';
      ledBar.userData.lodMaxDistance = 12;
      ledBar.position.set(-0.14, 0.095, 0.058);
      sawGroup.add(ledBar);
    } else {
      // Translucent fuel tank window + toolless flip-up fuel & chain-oil caps + recoil starter T-handle
      const fuelWindow = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.075, 0.148),
        fuelTankMat
      );
      fuelWindow.name = `${name}.fuelTankWindow`;
      fuelWindow.position.set(-0.135, -0.035, 0);
      sawGroup.add(fuelWindow);

      let capIdx = 0;
      for (const cy of [-0.02, 0.055] as const) {
        capIdx++;
        const flipCap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.014, 14),
          stihlBlackMat
        );
        flipCap.name = `${name}.flipFillerCap.${capIdx}`;
        flipCap.userData.lodTier = 'high';
        flipCap.userData.lodMaxDistance = 12;
        flipCap.rotation.x = Math.PI / 2;
        flipCap.position.set(-0.11, cy, 0.078);
        sawGroup.add(flipCap);

        const capOrangeHalf = new THREE.Mesh(
          new THREE.BoxGeometry(0.036, 0.014, 0.018),
          stihlOrangeMat
        );
        capOrangeHalf.name = `${name}.flipFillerCapLatch.${capIdx}`;
        capOrangeHalf.userData.lodTier = 'high';
        capOrangeHalf.userData.lodMaxDistance = 12;
        capOrangeHalf.position.set(-0.11, cy, 0.082);
        sawGroup.add(capOrangeHalf);
      }

      // ElastoStart recoil starter pull handle
      const pullGrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.022, 0.024),
        stihlBlackMat
      );
      pullGrip.name = `${name}.recoilStarterGrip`;
      pullGrip.userData.lodTier = 'high';
      pullGrip.userData.lodMaxDistance = 12;
      pullGrip.position.set(-0.07, 0.09, 0.092);
      sawGroup.add(pullGrip);
    }

    // Rear Throttle Handle, Trigger, Orange Lockout Lever & Lower Hand Guard Loop (`x = -0.28..-0.14m`)
    const rearHandleTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.02, 0.16, 12),
      stihlBlackMat
    );
    rearHandleTop.name = `${name}.rearThrottleHandle`;
    rearHandleTop.rotation.z = Math.PI / 2 - 0.18;
    rearHandleTop.position.set(-0.21, 0.015, 0);
    rearHandleTop.castShadow = true;
    sawGroup.add(rearHandleTop);

    const rearTriggerOrange = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.018, 0.022),
      stihlOrangeMat
    );
    rearTriggerOrange.name = `${name}.throttleTrigger`;
    rearTriggerOrange.userData.lodTier = 'high';
    rearTriggerOrange.userData.lodMaxDistance = 12;
    rearTriggerOrange.position.set(-0.19, -0.008, 0);
    sawGroup.add(rearTriggerOrange);

    const rearSkidBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.024, 0.075),
      stihlLightGreyMat
    );
    rearSkidBase.name = `${name}.rearHandGuardSkid`;
    rearSkidBase.position.set(-0.21, -0.072, 0);
    sawGroup.add(rearSkidBase);

    const rearEndBoot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.095, 10),
      stihlOrangeMat
    );
    rearEndBoot.name = `${name}.rearHandleEndBoot`;
    rearEndBoot.userData.lodTier = 'high';
    rearEndBoot.userData.lodMaxDistance = 12;
    rearEndBoot.position.set(-0.285, -0.028, 0);
    sawGroup.add(rearEndBoot);

    // Front Wrap-Around Tubular Handlebar & Matte-Black Inertia Chain-Brake Hand Guard
    const wrapBarTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.185, 12),
      stihlBlackMat
    );
    wrapBarTop.name = `${name}.wrapHandlebarTop`;
    wrapBarTop.rotation.x = Math.PI / 2;
    wrapBarTop.position.set(-0.01, 0.195, -0.01);
    sawGroup.add(wrapBarTop);

    const wrapBarSide = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.25, 12),
      stihlBlackMat
    );
    wrapBarSide.name = `${name}.wrapHandlebarSide`;
    wrapBarSide.position.set(-0.01, 0.075, -0.095);
    sawGroup.add(wrapBarSide);

    const chainBrakeFlag = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.145, 0.135),
      stihlBlackMat
    );
    chainBrakeFlag.name = `${name}.chainBrakeGuard`;
    chainBrakeFlag.position.set(0.058, 0.145, 0.01);
    chainBrakeFlag.rotation.z = -0.26;
    chainBrakeFlag.castShadow = true;
    sawGroup.add(chainBrakeFlag);

    // Front metal bumper dogs (felling spikes)
    let spikeIdx = 0;
    for (const sy of [-0.045, -0.01, 0.025, 0.06] as const) {
      spikeIdx++;
      const dogTooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.012, 0.038, 4),
        bladeSteelMat
      );
      dogTooth.name = `${name}.fellingSpike.${spikeIdx}`;
      dogTooth.userData.lodTier = 'high';
      dogTooth.userData.lodMaxDistance = 12;
      dogTooth.rotation.z = -Math.PI / 2;
      dogTooth.position.set(0.082, sy, 0.025);
      sawGroup.add(dogTooth);
    }

    // STIHL Rollomatic ES Light Guide Bar (`barLen`) + Rounded Sprocket Nose + 3D Saw Chain Teeth
    const barH = 0.086;
    const barT = 0.008;
    const barCenterX = 0.07 + barLen * 0.5;

    const guideBar = new THREE.Mesh(
      new THREE.BoxGeometry(barLen - barH * 0.5, barH, barT),
      guideBarMat
    );
    guideBar.name = `${name}.guideBar`;
    guideBar.position.set(barCenterX - barH * 0.25, 0.005, 0.032);
    guideBar.castShadow = true;
    sawGroup.add(guideBar);

    const barNose = new THREE.Mesh(
      new THREE.CylinderGeometry(barH * 0.5, barH * 0.5, barT, 20),
      guideBarMat
    );
    barNose.name = `${name}.guideBarSprocketNose`;
    barNose.rotation.x = Math.PI / 2;
    barNose.position.set(0.07 + barLen - barH * 0.5, 0.005, 0.032);
    sawGroup.add(barNose);

    // 3D Steel Saw-Chain Cutter Links around top and bottom edges of the guide bar
    const numTeethPerSide = Math.round(barLen / 0.028);
    const toothGeo = new THREE.BoxGeometry(0.014, 0.012, 0.012);
    toothGeo.computeBoundingSphere();
    for (let t = 0; t < numTeethPerSide; t++) {
      const tx = 0.09 + (t / numTeethPerSide) * (barLen - 0.045);
      for (const sideY of [-1, 1] as const) {
        const tooth = new THREE.Mesh(toothGeo, bladeSteelMat);
        tooth.name = `${name}.chainCutterTooth.${sideY < 0 ? 'bottom' : 'top'}.${t + 1}`;
        tooth.userData.lodTier = 'high';
        tooth.userData.lodMaxDistance = 12;
        tooth.position.set(tx, 0.005 + sideY * (barH * 0.5 + 0.005), 0.032);
        tooth.rotation.z = sideY * 0.24;
        sawGroup.add(tooth);
      }
    }
  };

  // Mount STIHL MS 500i 20" Forestry Chainsaw (`x = -0.58m, y = 1.18m`, i.e. `u = 10.83m, worldY = +0.68m` right above hit point!)
  addStihlChainsaw(
    'outbuildings.garage.stihlWallRack.chainsawMS500i',
    -0.58,
    1.18,
    0.5,
    false
  );

  // Mount STIHL MSA 220 C-B 14" Compact Cordless Chainsaw (`x = -0.54m, y = 0.74m`, i.e. `u = 10.79m, worldY = +0.24m`)
  addStihlChainsaw(
    'outbuildings.garage.stihlWallRack.chainsawMSA220',
    -0.54,
    0.74,
    0.36,
    true
  );

  // ---------------------------------------------------------------------------
  // 3. STIHL HS 82 R 30" Professional Petrol Hedge Trimmer (`outbuildings.garage.stihlWallRack.hedgeTrimmerHS82`)
  //    Hung vertically on the center-left of the wall rack (`x = +0.18m, y = 1.32m`, blade pointing down)
  // ---------------------------------------------------------------------------
  const hs82Group = new THREE.Group();
  hs82Group.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82';
  hs82Group.position.set(0.18, 1.34, 0.13);
  rackGroup.add(hs82Group);

  // Wall hanger fork holding the HS 82 R front loop handle
  for (const hx of [-0.065, 0.065] as const) {
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.026, 0.15),
      stihlOrangeMat
    );
    fork.name = `outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.hangerFork.${hx < 0 ? 'left' : 'right'}`;
    fork.userData.lodTier = 'high';
    fork.userData.lodMaxDistance = 12;
    fork.position.set(hx, -0.06, -0.05);
    hs82Group.add(fork);
  }

  // STIHL Orange motor cowling & light-grey gearbox housing
  const hsMotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.18, 0.145),
    stihlOrangeMat
  );
  hsMotor.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.motorCowling';
  hsMotor.position.set(0, 0.05, 0);
  hsMotor.castShadow = true;
  hs82Group.add(hsMotor);

  const hsGearbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.095, 0.12),
    stihlLightGreyMat
  );
  hsGearbox.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.gearbox';
  hsGearbox.position.set(0, -0.065, 0);
  hs82Group.add(hsGearbox);

  const hsBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.038),
    stihlBadgeMat
  );
  hsBadge.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.badge';
  hsBadge.userData.lodTier = 'high';
  hsBadge.userData.lodMaxDistance = 12;
  hsBadge.position.set(0, 0.05, 0.075);
  hs82Group.add(hsBadge);

  // Translucent fuel tank & top Rotating Multi-Function Rear Handle (`y = +0.16..+0.28m`)
  const hsTank = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.065, 0.115),
    fuelTankMat
  );
  hsTank.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.fuelTank';
  hsTank.position.set(0.02, 0.155, 0);
  hs82Group.add(hsTank);

  const hsRearGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.019, 0.17, 12),
    stihlBlackMat
  );
  hsRearGrip.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.rearHandle';
  hsRearGrip.position.set(0, 0.23, 0);
  hsRearGrip.rotation.z = 0.15;
  hs82Group.add(hsRearGrip);

  // Front bail loop handle & translucent/black knuckle guard shield
  const hsBail = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.012, 10, 20, Math.PI),
    stihlBlackMat
  );
  hsBail.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.bailHandle';
  hsBail.rotation.x = Math.PI * 0.35;
  hsBail.position.set(0, -0.04, 0.045);
  hs82Group.add(hsBail);

  const knuckleShield = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.014, 0.11),
    stihlBlackMat
  );
  knuckleShield.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.knuckleShield';
  knuckleShield.position.set(0, -0.105, 0.025);
  hs82Group.add(knuckleShield);

  // 75cm (30") Double-Sided Reciprocating Hedge Trimmer Cutter Bar with 32 3D Offset Shear Teeth!
  const hsBladeLen = 0.74;
  const hsSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, hsBladeLen, 0.012),
    guideBarMat
  );
  hsSpine.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.cutterBar';
  hsSpine.position.set(0, -0.11 - hsBladeLen * 0.5, 0.01);
  hsSpine.castShadow = true;
  hs82Group.add(hsSpine);

  const shearToothGeo = new THREE.BoxGeometry(0.088, 0.014, 0.005);
  shearToothGeo.computeBoundingSphere();
  const numShearPairs = 18;
  for (let s = 0; s < numShearPairs; s++) {
    const ty = -0.15 - (s / numShearPairs) * (hsBladeLen - 0.07);
    const toothBar = new THREE.Mesh(shearToothGeo, bladeSteelMat);
    toothBar.name = `outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.shearTooth.${s + 1}`;
    toothBar.userData.lodTier = 'high';
    toothBar.userData.lodMaxDistance = 12;
    toothBar.position.set(0, ty, 0.008);
    hs82Group.add(toothBar);
  }

  // Aluminium tip protector nose guard at bottom of cutter bar
  const tipGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.008, 12),
    stihlOrangeMat
  );
  tipGuard.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.tipProtector';
  tipGuard.userData.lodTier = 'high';
  tipGuard.userData.lodMaxDistance = 12;
  tipGuard.rotation.x = Math.PI / 2;
  tipGuard.position.set(0, -0.11 - hsBladeLen - 0.01, 0.01);
  hs82Group.add(tipGuard);

  // ---------------------------------------------------------------------------
  // 4. STIHL HLA 86 Long-Reach Telescopic Cordless Pole Hedge Trimmer (`outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86`)
  //    Mounted horizontally along the lower wall rail (`y = 0.42m, x = -0.15..+1.15m`)
  // ---------------------------------------------------------------------------
  const hlaGroup = new THREE.Group();
  hlaGroup.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86';
  hlaGroup.position.set(0.32, 0.44, 0.11);
  rackGroup.add(hlaGroup);

  for (const hx of [-0.55, 0.35] as const) {
    const poleHook = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.036, 0.11),
      stihlOrangeMat
    );
    poleHook.name = `outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.wallHook.${hx < 0 ? 'left' : 'right'}`;
    poleHook.userData.lodTier = 'high';
    poleHook.userData.lodMaxDistance = 12;
    poleHook.position.set(hx, -0.02, -0.05);
    hlaGroup.add(poleHook);
  }

  // Rear battery powerhead & control handle (`x = -0.78m`)
  const hlaPowerhead = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.13, 0.11),
    stihlOrangeMat
  );
  hlaPowerhead.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.powerhead';
  hlaPowerhead.position.set(-0.78, 0, 0);
  hlaPowerhead.castShadow = true;
  hlaGroup.add(hlaPowerhead);

  const hlaBatt = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.1, 0.095),
    stihlBlackMat
  );
  hlaBatt.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.batteryPack';
  hlaBatt.position.set(-0.84, 0.02, 0);
  hlaGroup.add(hlaBatt);

  // Square-profile STIHL Orange & Black telescopic drive shaft (`1.18m` long)
  const outerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.65, 12),
    stihlOrangeMat
  );
  outerShaft.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.outerShaft';
  outerShaft.rotation.z = Math.PI / 2;
  outerShaft.position.set(-0.35, 0, 0);
  hlaGroup.add(outerShaft);

  const clampCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.065, 12),
    stihlBlackMat
  );
  clampCollar.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.telescopicClampCollar';
  clampCollar.rotation.z = Math.PI / 2;
  clampCollar.position.set(-0.02, 0, 0);
  hlaGroup.add(clampCollar);

  const innerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.56, 12),
    bladeSteelMat
  );
  innerShaft.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.innerShaft';
  innerShaft.rotation.z = Math.PI / 2;
  innerShaft.position.set(0.26, 0, 0);
  hlaGroup.add(innerShaft);

  // Articulating 115° adjustable knuckle joint & 50cm double-sided hedge trimmer head (`x = +0.54..+1.06m`)
  const knuckleHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.052, 16),
    stihlLightGreyMat
  );
  knuckleHub.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.articulatingKnuckleHub';
  knuckleHub.rotation.x = Math.PI / 2;
  knuckleHub.position.set(0.55, 0, 0);
  hlaGroup.add(knuckleHub);

  const hlaBladeHead = new THREE.Group();
  hlaBladeHead.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.cutterHead';
  hlaBladeHead.position.set(0.55, 0, 0);
  hlaBladeHead.rotation.z = 0.24; // Articulated upward angle
  hlaGroup.add(hlaBladeHead);

  const hlaSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.026, 0.01),
    guideBarMat
  );
  hlaSpine.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.cutterBarSpine';
  hlaSpine.position.set(0.26, 0, 0);
  hlaBladeHead.add(hlaSpine);

  const hlaToothGeo = new THREE.BoxGeometry(0.012, 0.076, 0.005);
  hlaToothGeo.computeBoundingSphere();
  for (let t = 0; t < 13; t++) {
    const tx = 0.04 + t * 0.036;
    const tooth = new THREE.Mesh(hlaToothGeo, bladeSteelMat);
    tooth.name = `outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86.shearTooth.${t + 1}`;
    tooth.userData.lodTier = 'high';
    tooth.userData.lodMaxDistance = 12;
    tooth.position.set(tx, 0, 0);
    hlaBladeHead.add(tooth);
  }

  // ---------------------------------------------------------------------------
  // 5. STIHL BGA 200 Handheld Cordless Leaf Blower (`outbuildings.garage.stihlWallRack.leafBlowerBGA200`)
  //    Mounted on the right side of the rack (`x = +0.76m, y = 1.02m`)
  // ---------------------------------------------------------------------------
  const blowerGroup = new THREE.Group();
  blowerGroup.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200';
  blowerGroup.position.set(0.76, 1.04, 0.13);
  blowerGroup.rotation.z = -1.18;
  rackGroup.add(blowerGroup);

  const turbineScroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.13, 18),
    stihlOrangeMat
  );
  turbineScroll.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200.turbineScroll';
  turbineScroll.rotation.x = Math.PI / 2;
  turbineScroll.castShadow = true;
  blowerGroup.add(turbineScroll);

  const intakeGrille = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.136, 16),
    stihlBlackMat
  );
  intakeGrille.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200.intakeGrille';
  intakeGrille.rotation.x = Math.PI / 2;
  blowerGroup.add(intakeGrille);

  const blowerHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.18, 10),
    stihlBlackMat
  );
  blowerHandle.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200.handle';
  blowerGroup.add(blowerHandle);
  blowerHandle.rotation.z = Math.PI / 2;
  blowerHandle.position.set(0.04, 0.115, 0);

  const blowerTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.046, 0.48, 16),
    stihlBlackMat
  );
  blowerTube.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200.blowerTube';
  blowerTube.rotation.z = -Math.PI / 2;
  blowerTube.position.set(0.28, -0.02, 0);
  blowerTube.castShadow = true;
  blowerGroup.add(blowerTube);

  const nozzleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.028, 16),
    bladeSteelMat
  );
  nozzleRing.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200.nozzleWearRing';
  nozzleRing.userData.lodTier = 'high';
  nozzleRing.userData.lodMaxDistance = 12;
  nozzleRing.rotation.z = Math.PI / 2;
  nozzleRing.position.set(0.51, -0.02, 0);
  blowerGroup.add(nozzleRing);

  // ---------------------------------------------------------------------------
  // 6. Upper Wall Shelf (`y = 1.44m, x = +0.55m..+1.16m`) with STIHL AL 500 Dual Charger,
  //    STIHL Forestry Safety Helmet + Mesh Visor + Ear Defenders, and STIHL MotoMix Combi Can
  // ---------------------------------------------------------------------------
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'outbuildings.garage.stihlWallRack.accessories';
  shelfGroup.position.set(0.78, 1.44, 0.14);
  rackGroup.add(shelfGroup);

  const shelfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.022, 0.26),
    rackSteelMat
  );
  shelfPlate.name = 'outbuildings.garage.stihlWallRack.accessories.shelfPlate';
  shelfPlate.castShadow = true;
  shelfPlate.receiveShadow = true;
  shelfGroup.add(shelfPlate);

  // A. STIHL AL 500 High-Speed Battery Charger with 2 AP 300 S Batteries (`x = -0.22m`)
  const chargerBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.065, 0.18),
    stihlLightGreyMat
  );
  chargerBase.name = 'outbuildings.garage.stihlWallRack.accessories.al500ChargerBase';
  chargerBase.position.set(-0.22, 0.043, 0);
  chargerBase.castShadow = true;
  shelfGroup.add(chargerBase);

  let battIdx = 0;
  for (const bx of [-0.275, -0.165] as const) {
    battIdx++;
    const battBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.11, 0.11),
      stihlBlackMat
    );
    battBody.name = `outbuildings.garage.stihlWallRack.accessories.ap300sBattery.${battIdx}.body`;
    battBody.position.set(bx, 0.11, 0);
    shelfGroup.add(battBody);

    const battTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.024, 0.108),
      stihlOrangeMat
    );
    battTop.name = `outbuildings.garage.stihlWallRack.accessories.ap300sBattery.${battIdx}.orangeCap`;
    battTop.position.set(bx, 0.172, 0);
    shelfGroup.add(battTop);

    const chargeLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.008, 0.006),
      greenLedMat
    );
    chargeLed.name = `outbuildings.garage.stihlWallRack.accessories.ap300sBattery.${battIdx}.chargeLed`;
    chargeLed.userData.lodTier = 'high';
    chargeLed.userData.lodMaxDistance = 12;
    chargeLed.position.set(bx, 0.052, 0.092);
    shelfGroup.add(chargeLed);
  }

  // B. STIHL Dynamic Forestry Safety Helmet with Face Mesh Visor & Ear Defenders (`x = +0.06m`)
  const helmetGroup = new THREE.Group();
  helmetGroup.name = 'outbuildings.garage.stihlWallRack.accessories.forestryHelmet';
  helmetGroup.position.set(0.06, 0.02, 0.02);
  shelfGroup.add(helmetGroup);

  const helmetDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    stihlOrangeMat
  );
  helmetDome.name = 'outbuildings.garage.stihlWallRack.accessories.forestryHelmet.dome';
  helmetDome.position.set(0, 0.04, 0);
  helmetDome.castShadow = true;
  helmetGroup.add(helmetDome);

  const helmetPeak = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.012, 0.075),
    stihlBlackMat
  );
  helmetPeak.name = 'outbuildings.garage.stihlWallRack.accessories.forestryHelmet.peak';
  helmetPeak.position.set(0, 0.042, 0.11);
  helmetPeak.rotation.x = 0.22;
  helmetGroup.add(helmetPeak);

  const faceVisor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.118, 0.112, 0.11, 16, 1, true, -Math.PI * 0.38, Math.PI * 0.76),
    meshVisorMat
  );
  faceVisor.name = 'outbuildings.garage.stihlWallRack.accessories.forestryHelmet.meshVisor';
  faceVisor.rotation.y = Math.PI;
  faceVisor.position.set(0, -0.01, 0.015);
  helmetGroup.add(faceVisor);

  for (const sideX of [-1, 1] as const) {
    const earMuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.036, 14),
      stihlOrangeMat
    );
    earMuff.name = `outbuildings.garage.stihlWallRack.accessories.forestryHelmet.earDefender.${sideX < 0 ? 'left' : 'right'}`;
    earMuff.userData.lodTier = 'high';
    earMuff.userData.lodMaxDistance = 12;
    earMuff.rotation.z = Math.PI / 2;
    earMuff.position.set(sideX * 0.125, 0.01, 0);
    helmetGroup.add(earMuff);
  }

  // C. STIHL Twin-Chamber Fuel & Chain-Oil Combi Can (`x = +0.26m`)
  const combiCan = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.22, 0.19),
    stihlOrangeMat
  );
  combiCan.name = 'outbuildings.garage.stihlWallRack.accessories.combiCan';
  combiCan.position.set(0.27, 0.12, 0);
  combiCan.castShadow = true;
  shelfGroup.add(combiCan);

  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.02, 0.11, 10),
    stihlBlackMat
  );
  spout.name = 'outbuildings.garage.stihlWallRack.accessories.combiCanSpout';
  spout.userData.lodTier = 'high';
  spout.userData.lodMaxDistance = 12;
  spout.rotation.z = -0.35;
  spout.position.set(0.24, 0.26, 0.03);
  shelfGroup.add(spout);
}

