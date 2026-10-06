import * as THREE from 'three';

/**
 * Creates a procedural 128x128 canvas texture for a hydronic bimetal temperature gauge dial (0–80°C).
 */
function createTemperatureGaugeDialTexture(isFlowRed: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Crisp white enamel gauge face
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    // Outer colored temperature arc band (0°C to 80°C)
    ctx.strokeStyle = isFlowRed ? '#d92626' : '#1e6bd6';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 48, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Tick marks around the scale
    ctx.strokeStyle = '#1e2229';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      const angle = Math.PI * 0.75 + (i / 8) * (Math.PI * 1.5);
      const rInner = i % 2 === 0 ? 36 : 40;
      const rOuter = 46;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(angle) * rInner, 64 + Math.sin(angle) * rInner);
      ctx.lineTo(64 + Math.cos(angle) * rOuter, 64 + Math.sin(angle) * rOuter);
      ctx.stroke();
    }

    // °C label text
    ctx.fillStyle = '#1e2229';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('°C', 64, 88);

    // Temperature pointer needle (Flow ~ 44°C, Return ~ 34°C)
    const needleValue = isFlowRed ? 44 : 34;
    const needleAngle = Math.PI * 0.75 + (needleValue / 80) * (Math.PI * 1.5);
    ctx.strokeStyle = isFlowRed ? '#c81e1e' : '#1558b8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(64 - Math.cos(needleAngle) * 10, 64 - Math.sin(needleAngle) * 10);
    ctx.lineTo(64 + Math.cos(needleAngle) * 42, 64 + Math.sin(needleAngle) * 42);
    ctx.stroke();

    // Center boss cap
    ctx.fillStyle = '#22262c';
    ctx.beginPath();
    ctx.arc(64, 64, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the Plant Room Commercial/Residential Stainless-Steel Hydronic Underfloor & Radiator
 * Heating Manifold & Mixing Pump Station (Issue #3 — "Heating manifold here" at
 * hit point [-18.116, 1.318, 8.39], surface normal [0, 0, 1]).
 *
 * Mounted on the South (+Z = 8.39m) interior face of the Plant Room North Wall,
 * centered at X = -18.12m, Y = tier2FloorY + 1.45m (cabinet & headers spanning
 * world Y ≈ 0.85m..1.45m, overall manifold assembly spanning Y = 0.65m..1.55m
 * with PEX-AL-PEX circuit pipes descending to the floor shroud at Y = tier2FloorY = -0.60m),
 * protruding +Z (Z = 8.39m..8.53m) into the Plant Room.
 */
export function buildPlantRoomHeatingManifold(
  scene: THREE.Scene,
  tier2FloorY: number,
  brassMat: THREE.Material,
  castIronMat: THREE.Material
): void {
  const manifoldGroup = new THREE.Group();
  manifoldGroup.name = 'plantRoom.heatingManifold';
  manifoldGroup.userData.zone = 'study';

  const wallZ = 8.39;

  // =========================================================================
  // Dedicated High-LOD Manifold Materials
  // =========================================================================
  const cabinetWhiteSteelMat = new THREE.MeshStandardMaterial({
    color: 0xf2f4f7, // RAL 9016 powder-coated sheet steel manifold enclosure
    roughness: 0.32,
    metalness: 0.35,
  });

  const cabinetRecessInteriorMat = new THREE.MeshStandardMaterial({
    color: 0xdce1e7, // Slightly shaded recessed backplate pan
    roughness: 0.42,
    metalness: 0.45,
  });

  const galvSteelMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0c8, // Galvanized steel mounting brackets, clips & floor pipe shroud
    roughness: 0.3,
    metalness: 0.78,
  });

  const brushedStainlessMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde2, // 304/316 brushed stainless steel flow & return header bars
    roughness: 0.22,
    metalness: 0.88,
  });

  const copperPipeMat = new THREE.MeshStandardMaterial({
    color: 0xc86d44, // Polished 28mm BS EN 1057 primary copper flow & return feed pipework
    roughness: 0.26,
    metalness: 0.85,
  });

  const epdmRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1e2226, // Acoustic EPDM anti-vibration bracket isolators & cable grommets
    roughness: 0.78,
    metalness: 0.05,
  });

  const flowRedMat = new THREE.MeshStandardMaterial({
    color: 0xd62420, // Hydronic primary flow red lever, gauge bezel & sight-glass float
    roughness: 0.28,
    metalness: 0.15,
  });

  const returnBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1862c8, // Hydronic primary return blue lever & gauge bezel
    roughness: 0.28,
    metalness: 0.15,
  });

  const pumpCompositeBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181b20, // Grundfos UPM3 / Alpha2 glass-filled composite electronics housing
    roughness: 0.36,
    metalness: 0.12,
  });

  const sightGlassClearMat = new THREE.MeshStandardMaterial({
    color: 0xeaf4ff, // Transparent polycarbonate flowmeter sight glass (0–5 L/min)
    transparent: true,
    opacity: 0.46,
    roughness: 0.12,
    metalness: 0.08,
  });

  const actuatorWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf5f7fa, // KNX / 24V electro-thermal zone actuator housing (Möhlenhoff / Hager style)
    roughness: 0.28,
    metalness: 0.06,
  });

  const actuatorActiveLedMat = new THREE.MeshStandardMaterial({
    color: 0x22ee66, // Glowing green/emerald KNX active zone status ring cap
    emissive: 0x14cc50,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });

  const actuatorWarmLedMat = new THREE.MeshStandardMaterial({
    color: 0xff5522, // Glowing warm orange-red call-for-heat stroke indicator cap
    emissive: 0xe63800,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  const pexAlPexPipeMat = new THREE.MeshStandardMaterial({
    color: 0xedeff2, // 16x2mm white PERT-AL-PERT / PEX-AL-PEX multi-layer underfloor heating pipe
    roughness: 0.34,
    metalness: 0.08,
  });

  const flowGaugeDialMat = new THREE.MeshStandardMaterial({
    map: createTemperatureGaugeDialTexture(true),
    roughness: 0.2,
  });

  const returnGaugeDialMat = new THREE.MeshStandardMaterial({
    map: createTemperatureGaugeDialTexture(false),
    roughness: 0.2,
  });

  // =========================================================================
  // 1. WHITE POWDER-COATED SHEET-STEEL MANIFOLD MOUNTING CABINET BACKPLATE
  //    & ACOUSTIC VIBRATION-DAMPING WALL BRACKETS (0.78m W x 0.64m H)
  //    Mounted flush on the South face of the North wall at Z = 8.395m,
  //    centered at X = -18.12m, spanning world Y ≈ 0.83m..1.47m (right around
  //    hit point [-18.116, 1.318, 8.39]), plus lower support tray at Y = 0.65m..0.85m
  //    and upper KNX 10-Zone UFH Wiring Center up to Y = 1.55m.
  // =========================================================================
  const cabinetCenterX = -18.12;
  const cabinetCenterY = tier2FloorY + 1.40; // World Y = 0.80m (shorter height off floor per Issue #7)
  const cabinetW = 0.78;
  const cabinetH = 0.58;

  // Main flush sheet-steel backplate at Z = 8.395m
  const cabinetBackplate = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW, cabinetH, 0.01),
    cabinetWhiteSteelMat
  );
  cabinetBackplate.name = 'plantRoom.heatingManifold.cabinetBackplate';
  cabinetBackplate.position.set(cabinetCenterX, cabinetCenterY, wallZ + 0.005);
  cabinetBackplate.castShadow = true;
  cabinetBackplate.receiveShadow = true;
  manifoldGroup.add(cabinetBackplate);

  // Inner recessed tray pan & perimeter folded sheet-steel cabinet side flanges (Z = 8.39m..8.49m)
  const cabinetInnerPan = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW - 0.036, cabinetH - 0.036, 0.006),
    cabinetRecessInteriorMat
  );
  cabinetInnerPan.name = 'plantRoom.heatingManifold.cabinetInnerPan';
  cabinetInnerPan.position.set(cabinetCenterX, cabinetCenterY, wallZ + 0.011);
  manifoldGroup.add(cabinetInnerPan);

  const flangeDepth = 0.095;
  const topHoodFlange = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW, 0.018, flangeDepth),
    cabinetWhiteSteelMat
  );
  topHoodFlange.name = 'plantRoom.heatingManifold.cabinetTopHood';
  topHoodFlange.position.set(
    cabinetCenterX,
    cabinetCenterY + cabinetH * 0.5 - 0.009,
    wallZ + flangeDepth * 0.5
  );
  topHoodFlange.castShadow = true;
  manifoldGroup.add(topHoodFlange);

  for (const sideSign of [-1, 1] as const) {
    const sideCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, cabinetH, flangeDepth),
      cabinetWhiteSteelMat
    );
    sideCheek.name = `plantRoom.heatingManifold.cabinetSideCheek.${sideSign < 0 ? 'left' : 'right'}`;
    sideCheek.position.set(
      cabinetCenterX + sideSign * (cabinetW * 0.5 - 0.009),
      cabinetCenterY,
      wallZ + flangeDepth * 0.5
    );
    sideCheek.castShadow = true;
    manifoldGroup.add(sideCheek);
  }

  // Lower manifold pipe guide sub-apron extending down below the cabinet
  const lowerApronH = 0.14;
  const lowerApronY = cabinetCenterY - cabinetH * 0.5 - lowerApronH * 0.5;
  const lowerApronPlate = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW, lowerApronH, 0.008),
    cabinetWhiteSteelMat
  );
  lowerApronPlate.name = 'plantRoom.heatingManifold.lowerPipeApron';
  lowerApronPlate.position.set(cabinetCenterX, lowerApronY, wallZ + 0.004);
  lowerApronPlate.receiveShadow = true;
  manifoldGroup.add(lowerApronPlate);

  // Upper KNX 10-Zone Hydronic Underfloor Heating Wiring Center & Actuator Controller Bar
  // Mounted along the top of the cabinet
  const wiringCenterY = cabinetCenterY + cabinetH * 0.5 + 0.038;
  const wiringCenterBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.072, 0.055),
    cabinetWhiteSteelMat
  );
  wiringCenterBox.name = 'plantRoom.heatingManifold.knxWiringCenter';
  wiringCenterBox.position.set(-18.02, wiringCenterY, wallZ + 0.028);
  wiringCenterBox.castShadow = true;
  manifoldGroup.add(wiringCenterBox);

  // Dark status window & 10 green/amber LED zone demand indicators on KNX Wiring Center
  const wiringWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.022, 0.004),
    epdmRubberMat
  );
  wiringWindow.name = 'plantRoom.heatingManifold.knxWiringCenter.statusWindow';
  wiringWindow.position.set(-18.02, wiringCenterY + 0.006, wallZ + 0.057);
  manifoldGroup.add(wiringWindow);

  for (let zLed = 0; zLed < 10; zLed++) {
    const ledMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.007, 0.004),
      zLed % 3 === 0 ? actuatorWarmLedMat : actuatorActiveLedMat
    );
    ledMesh.name = `plantRoom.heatingManifold.knxWiringCenter.led.${zLed + 1}`;
    ledMesh.userData.lodTier = 'high';
    ledMesh.userData.lodMaxDistance = 12;
    ledMesh.position.set(-18.23 + zLed * 0.046, wiringCenterY + 0.006, wallZ + 0.059);
    manifoldGroup.add(ledMesh);
  }

  // Twin vertical galvanized steel C-channel manifold mounting brackets with acoustic EPDM isolators
  const flowHeaderY = tier2FloorY + 1.545; // World Y = 0.945m (Issue #7 shorter manifold)
  const returnHeaderY = tier2FloorY + 1.205; // World Y = 0.605m
  const flowHeaderZ = wallZ + 0.072; // Z = 8.462m
  const returnHeaderZ = wallZ + 0.092; // Z = 8.482m (stepped +20mm forward for clean rear flow pipe drop)

  for (const [bIdx, bx] of ([-18.285, -17.765] as const).entries()) {
    const bracketRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.44, 0.018),
      galvSteelMat
    );
    bracketRail.name = `plantRoom.heatingManifold.mountingBracket.${bIdx + 1}`;
    bracketRail.position.set(bx, (flowHeaderY + returnHeaderY) * 0.5, wallZ + 0.02);
    bracketRail.castShadow = true;
    manifoldGroup.add(bracketRail);

    // Acoustic vibration-damping EPDM rubber saddle clamps holding upper & lower headers
    for (const [isReturn, hy, hz] of [
      [false, flowHeaderY, flowHeaderZ],
      [true, returnHeaderY, returnHeaderZ],
    ] as const) {
      const saddleStandOffD = hz - (wallZ + 0.025);
      const standOffArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.026, 0.028, saddleStandOffD),
        galvSteelMat
      );
      standOffArm.name = isReturn
        ? `plantRoom.heatingManifold.bracketStandOff.return.${bIdx + 1}`
        : `plantRoom.heatingManifold.bracketStandOff.flow.${bIdx + 1}`;
      standOffArm.position.set(bx, hy, wallZ + 0.025 + saddleStandOffD * 0.5);
      manifoldGroup.add(standOffArm);

      const epdmCollar = new THREE.Mesh(
        new THREE.BoxGeometry(0.034, 0.052, 0.052),
        epdmRubberMat
      );
      epdmCollar.name = isReturn
        ? `plantRoom.heatingManifold.acousticClamp.return.${bIdx + 1}`
        : `plantRoom.heatingManifold.acousticClamp.flow.${bIdx + 1}`;
      epdmCollar.position.set(bx, hy, hz);
      manifoldGroup.add(epdmCollar);
    }
  }

  // =========================================================================
  // 2. PRIMARY 28mm COPPER FLOW & RETURN FEED PIPES + QUARTER-TURN LEVER BALL
  //    ISOLATION VALVES (Running horizontally at high level from the Study /
  //    Plant Room partition wall X = -18.84m to X = -18.46m, then dropping
  //    down into red flow and blue return isolation valves on the left side)
  // =========================================================================
  const pipeRadius28mm = 0.014; // 28mm OD primary copper tube
  const wallStartX = -18.84;
  const flowRiserX = -18.78;
  const returnRiserX = -18.70;
  const returnDropX = -18.47;
  const flowDropX = -18.39;
  const studyFlowHeaderY = tier2FloorY + 0.78;   // Matches Study Primary Heating Flow Header (Y = +0.18m)
  const studyReturnHeaderY = tier2FloorY + 0.66; // Matches Study Primary Heating Return Header (Y = +0.06m)
  const highFlowY = tier2FloorY + 1.76;          // World Y = 1.16m
  const highReturnY = tier2FloorY + 1.68;        // World Y = 1.08m

  // 1. Through-wall stubs emerging from the Study North Wall headers at X = -18.84m (Y = tier2FloorY + 0.78m & 0.66m)
  //    into vertical risers at X = -18.78m (Flow) and X = -18.70m (Return)
  for (const [sTag, stubEndX, stubY, stubZ] of [
    ['flow', flowRiserX, studyFlowHeaderY, flowHeaderZ],
    ['return', returnRiserX, studyReturnHeaderY, returnHeaderZ],
  ] as const) {
    const stubLen = stubEndX - wallStartX;
    const wallStub = new THREE.Mesh(
      new THREE.CylinderGeometry(pipeRadius28mm, pipeRadius28mm, stubLen, 16),
      copperPipeMat
    );
    wallStub.name = `plantRoom.heatingManifold.wallStub.${sTag}`;
    wallStub.rotation.z = Math.PI / 2;
    wallStub.position.set(wallStartX + stubLen * 0.5, stubY, stubZ);
    wallStub.castShadow = true;
    manifoldGroup.add(wallStub);

    const wallRosette = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.01, 16),
      brassMat
    );
    wallRosette.name = `plantRoom.heatingManifold.wallRosette.${sTag}`;
    wallRosette.userData.lodTier = 'high';
    wallRosette.userData.lodMaxDistance = 12;
    wallRosette.rotation.z = Math.PI / 2;
    wallRosette.position.set(wallStartX + 0.005, stubY, stubZ);
    manifoldGroup.add(wallRosette);
  }

  // 2. Vertical 28mm copper risers climbing the Plant Room North wall from the Study header heights up to highFlowY / highReturnY
  for (const [riserX, botY, topY, rz, riserName] of [
    [flowRiserX, studyFlowHeaderY, highFlowY, flowHeaderZ, 'plantRoom.heatingManifold.primaryFlowWallRiser'],
    [returnRiserX, studyReturnHeaderY, highReturnY, returnHeaderZ, 'plantRoom.heatingManifold.primaryReturnWallRiser'],
  ] as const) {
    const riserLen = topY - botY;
    const wallRiser = new THREE.Mesh(
      new THREE.CylinderGeometry(pipeRadius28mm, pipeRadius28mm, riserLen, 16),
      copperPipeMat
    );
    wallRiser.name = riserName;
    wallRiser.position.set(riserX, (botY + topY) * 0.5, rz);
    wallRiser.castShadow = true;
    manifoldGroup.add(wallRiser);

    for (const [cIdx, clipY] of ([tier2FloorY + 0.98, tier2FloorY + 1.42] as const).entries()) {
      const munsenRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.016, 14),
        brassMat
      );
      munsenRing.name = `${riserName}.munsenRing.${cIdx + 1}`;
      munsenRing.userData.lodTier = 'high';
      munsenRing.userData.lodMaxDistance = 12;
      munsenRing.position.set(riserX, clipY, rz);
      manifoldGroup.add(munsenRing);

      const munsenStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, rz - wallZ, 10),
        galvSteelMat
      );
      munsenStem.name = `${riserName}.munsenStem.${cIdx + 1}`;
      munsenStem.userData.lodTier = 'high';
      munsenStem.userData.lodMaxDistance = 12;
      munsenStem.rotation.x = Math.PI / 2;
      munsenStem.position.set(riserX, clipY, wallZ + (rz - wallZ) * 0.5);
      manifoldGroup.add(munsenStem);
    }
  }

  // 3. Horizontal high-level 28mm copper flow pipe (X = -18.78m..-18.39m)
  const horizFlowLen = flowDropX - flowRiserX;
  const primaryFlowHoriz = new THREE.Mesh(
    new THREE.CylinderGeometry(pipeRadius28mm, pipeRadius28mm, horizFlowLen, 16),
    copperPipeMat
  );
  primaryFlowHoriz.name = 'plantRoom.heatingManifold.primaryFlowPipe';
  primaryFlowHoriz.rotation.z = Math.PI / 2;
  primaryFlowHoriz.position.set(
    flowRiserX + horizFlowLen * 0.5,
    highFlowY,
    flowHeaderZ
  );
  primaryFlowHoriz.castShadow = true;
  manifoldGroup.add(primaryFlowHoriz);

  // 4. Horizontal high-level 28mm copper return pipe (X = -18.70m..-18.47m)
  const horizReturnLen = returnDropX - returnRiserX;
  const primaryReturnHoriz = new THREE.Mesh(
    new THREE.CylinderGeometry(pipeRadius28mm, pipeRadius28mm, horizReturnLen, 16),
    copperPipeMat
  );
  primaryReturnHoriz.name = 'plantRoom.heatingManifold.primaryReturnPipe';
  primaryReturnHoriz.rotation.z = Math.PI / 2;
  primaryReturnHoriz.position.set(
    returnRiserX + horizReturnLen * 0.5,
    highReturnY,
    returnHeaderZ
  );
  primaryReturnHoriz.castShadow = true;
  manifoldGroup.add(primaryReturnHoriz);

  // Heavy-duty Munsen wall pipe clips on the horizontal high-level copper runs
  for (const [cTag, py, pz, clipX] of [
    ['flow', highFlowY, flowHeaderZ, -18.58],
    ['return', highReturnY, returnHeaderZ, -18.58],
  ] as const) {
    const munsenRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.016, 14),
      brassMat
    );
    munsenRing.name = `plantRoom.heatingManifold.horizMunsenRing.${cTag}`;
    munsenRing.userData.lodTier = 'high';
    munsenRing.userData.lodMaxDistance = 12;
    munsenRing.rotation.z = Math.PI / 2;
    munsenRing.position.set(clipX, py, pz);
    manifoldGroup.add(munsenRing);

    const munsenStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, pz - wallZ, 10),
      galvSteelMat
    );
    munsenStem.name = `plantRoom.heatingManifold.horizMunsenStem.${cTag}`;
    munsenStem.userData.lodTier = 'high';
    munsenStem.userData.lodMaxDistance = 12;
    munsenStem.rotation.x = Math.PI / 2;
    munsenStem.position.set(clipX, py, wallZ + (pz - wallZ) * 0.5);
    manifoldGroup.add(munsenStem);
  }

  // Brass 90° soldered elbows at bottom & top of wall risers and at the manifold drops
  for (const [eIdx, [ex, ey, ez]] of (
    [
      [flowRiserX, studyFlowHeaderY, flowHeaderZ],
      [flowRiserX, highFlowY, flowHeaderZ],
      [flowDropX, highFlowY, flowHeaderZ],
      [returnRiserX, studyReturnHeaderY, returnHeaderZ],
      [returnRiserX, highReturnY, returnHeaderZ],
      [returnDropX, highReturnY, returnHeaderZ],
    ] as const
  ).entries()) {
    const elbowSphere = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius28mm * 1.28, 14, 14),
      brassMat
    );
    elbowSphere.name = `plantRoom.heatingManifold.primaryCopperElbow.${eIdx + 1}`;
    elbowSphere.position.set(ex, ey, ez);
    manifoldGroup.add(elbowSphere);
  }

  // Vertical 28mm copper flow drop leg into Red Quarter-Turn Lever Ball Isolation Valve
  const flowValveY = tier2FloorY + 1.62;
  const flowDropLen = highFlowY - flowHeaderY;
  const primaryFlowVert = new THREE.Mesh(
    new THREE.CylinderGeometry(pipeRadius28mm, pipeRadius28mm, flowDropLen, 16),
    copperPipeMat
  );
  primaryFlowVert.name = 'plantRoom.heatingManifold.primaryFlowDropPipe';
  primaryFlowVert.position.set(flowDropX, (highFlowY + flowHeaderY) * 0.5, flowHeaderZ);
  primaryFlowVert.castShadow = true;
  manifoldGroup.add(primaryFlowVert);

  // Vertical 28mm copper return drop leg into Blue Quarter-Turn Lever Ball Isolation Valve
  const returnValveY = tier2FloorY + 1.36;
  const returnDropLen = highReturnY - returnHeaderY;
  const primaryReturnVert = new THREE.Mesh(
    new THREE.CylinderGeometry(pipeRadius28mm, pipeRadius28mm, returnDropLen, 16),
    copperPipeMat
  );
  primaryReturnVert.name = 'plantRoom.heatingManifold.primaryReturnDropPipe';
  primaryReturnVert.position.set(
    returnDropX,
    (highReturnY + returnHeaderY) * 0.5,
    returnHeaderZ
  );
  primaryReturnVert.castShadow = true;
  manifoldGroup.add(primaryReturnVert);

  // Helper to build a full-bore brass quarter-turn lever ball valve (Red for Flow, Blue for Return)
  const buildLeverBallValve = (
    name: string,
    vx: number,
    vy: number,
    vz: number,
    leverMat: THREE.Material
  ): void => {
    const valveGroup = new THREE.Group();
    valveGroup.name = name;
    valveGroup.position.set(vx, vy, vz);

    // Forged brass valve body + upper/lower hex compression union nuts
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.021, 0.021, 0.054, 16),
      brassMat
    );
    body.name = `${name}.body`;
    body.castShadow = true;
    valveGroup.add(body);

    for (const [nTag, ny] of [['lower', -0.032], ['upper', 0.032]] as const) {
      const hexNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.014, 6),
        brassMat
      );
      hexNut.name = `${name}.hexNut.${nTag}`;
      hexNut.userData.lodTier = 'high';
      hexNut.userData.lodMaxDistance = 12;
      hexNut.position.set(0, ny, 0);
      valveGroup.add(hexNut);
    }

    // Forward-facing valve spindle boss
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      brassMat
    );
    spindle.name = `${name}.spindle`;
    spindle.userData.lodTier = 'high';
    spindle.userData.lodMaxDistance = 12;
    spindle.rotation.x = Math.PI / 2;
    spindle.position.set(0, 0, 0.022);
    valveGroup.add(spindle);

    // PVC-sleeved quarter-turn flat steel lever handle (aligned vertically = OPEN)
    const leverHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.088, 0.008),
      leverMat
    );
    leverHandle.name = `${name}.leverHandle`;
    leverHandle.position.set(0, -0.034, 0.036);
    leverHandle.castShadow = true;
    valveGroup.add(leverHandle);

    manifoldGroup.add(valveGroup);
  };

  buildLeverBallValve(
    'plantRoom.heatingManifold.flowIsolationValve',
    flowDropX,
    flowValveY,
    flowHeaderZ,
    flowRedMat
  );
  buildLeverBallValve(
    'plantRoom.heatingManifold.returnIsolationValve',
    returnDropX,
    returnValveY,
    returnHeaderZ,
    returnBlueMat
  );

  // =========================================================================
  // 3. THERMOSTATIC BLENDING / MIXING VALVE ASSEMBLY + A-RATED GRUNDFOS UPM3 /
  //    ALPHA2 BLACK & STAINLESS CIRCULATION PUMP (Mounted vertically on the
  //    left side of the manifold between the flow and return headers)
  // =========================================================================
  const pumpAxisX = -18.39;

  // 3a. 3-Port Brass Thermostatic Mixing / Blending Valve Assembly at top-left (X = -18.39m, Y = flowHeaderY)
  const mixingValveGroup = new THREE.Group();
  mixingValveGroup.name = 'plantRoom.heatingManifold.thermostaticMixingValve';
  mixingValveGroup.position.set(pumpAxisX, flowHeaderY, flowHeaderZ);

  const mixingBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.068, 16),
    brassMat
  );
  mixingBody.name = 'plantRoom.heatingManifold.thermostaticMixingValve.body';
  mixingBody.castShadow = true;
  mixingValveGroup.add(mixingBody);

  // Horizontal bypass return mixing bridge connecting return drop (X = -18.47m) into the mixing valve
  const mixingBypassBridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, flowDropX - returnDropX, 12),
    brassMat
  );
  mixingBypassBridge.name = 'plantRoom.heatingManifold.thermostaticMixingValve.bypassBridge';
  mixingBypassBridge.rotation.z = Math.PI / 2;
  mixingBypassBridge.position.set(-(flowDropX - returnDropX) * 0.5, 0, 0.01);
  mixingValveGroup.add(mixingBypassBridge);

  // Graduated black/silver thermostatic blending handwheel head (20–55°C scale) protruding +Z
  const thermostaticHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.025, 0.048, 20),
    pumpCompositeBlackMat
  );
  thermostaticHead.name = 'plantRoom.heatingManifold.thermostaticMixingValve.handwheelHead';
  thermostaticHead.rotation.x = Math.PI / 2;
  thermostaticHead.position.set(0, 0, 0.036);
  thermostaticHead.castShadow = true;
  mixingValveGroup.add(thermostaticHead);

  const thermostaticScaleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0235, 0.0235, 0.012, 20),
    brushedStainlessMat
  );
  thermostaticScaleRing.name = 'plantRoom.heatingManifold.thermostaticMixingValve.scaleRing';
  thermostaticScaleRing.userData.lodTier = 'high';
  thermostaticScaleRing.userData.lodMaxDistance = 12;
  thermostaticScaleRing.rotation.x = Math.PI / 2;
  thermostaticScaleRing.position.set(0, 0, 0.026);
  mixingValveGroup.add(thermostaticScaleRing);

  manifoldGroup.add(mixingValveGroup);

  //Lower Return Tee & Check Valve Elbow at bottom of pump axis (X = -18.39m, Y = returnHeaderY)
  const returnPumpElbow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.095, 16),
    brassMat
  );
  returnPumpElbow.name = 'plantRoom.heatingManifold.returnPumpElbow';
  returnPumpElbow.rotation.z = Math.PI / 2;
  returnPumpElbow.position.set((returnDropX + pumpAxisX) * 0.5, returnHeaderY, returnHeaderZ);
  manifoldGroup.add(returnPumpElbow);

  // 3b. Vertical Grundfos UPM3 / Alpha2 A-Rated Circulation Pump between Flow & Return Headers
  const pumpGroup = new THREE.Group();
  pumpGroup.name = 'plantRoom.heatingManifold.circulationPump';
  const pumpCenterY = (flowHeaderY + returnHeaderY) * 0.5; // World Y = 1.14m
  const pumpCenterZ = (flowHeaderZ + returnHeaderZ) * 0.5; // Z = 8.472m
  pumpGroup.position.set(pumpAxisX, pumpCenterY, pumpCenterZ);

  // Upper & lower 1½" forged brass pump union nuts
  for (const unionY of [-0.11, 0.11] as const) {
    const unionNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.024, 8),
      brassMat
    );
    unionNut.name =
      unionY > 0
        ? 'plantRoom.heatingManifold.circulationPump.upperUnionNut'
        : 'plantRoom.heatingManifold.circulationPump.lowerUnionNut';
    unionNut.position.set(0, unionY, 0);
    unionNut.castShadow = true;
    pumpGroup.add(unionNut);

    const unionTail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.055, 14),
      brassMat
    );
    unionTail.name =
      unionY > 0
        ? 'plantRoom.heatingManifold.circulationPump.upperUnionTail'
        : 'plantRoom.heatingManifold.circulationPump.lowerUnionTail';
    unionTail.position.set(0, unionY * 1.32, 0);
    pumpGroup.add(unionTail);
  }

  // Cast-iron cataphoresis-coated pump volute body (`castIronMat`)
  const pumpVolute = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.13, 20),
    castIronMat
  );
  pumpVolute.name = 'plantRoom.heatingManifold.circulationPump.volute';
  pumpVolute.position.set(0, 0, 0);
  pumpVolute.castShadow = true;
  pumpGroup.add(pumpVolute);

  // Brushed stainless-steel wet-rotor stator can protruding forward
  const pumpRotorCan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.045, 20),
    brushedStainlessMat
  );
  pumpRotorCan.name = 'plantRoom.heatingManifold.circulationPump.rotorCan';
  pumpRotorCan.rotation.x = Math.PI / 2;
  pumpRotorCan.position.set(0, 0, 0.024);
  pumpGroup.add(pumpRotorCan);

  // Grundfos black composite front inverter control box (0.086m W x 0.108m H x 0.042m D)
  const pumpControlBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.084, 0.106, 0.04),
    pumpCompositeBlackMat
  );
  pumpControlBox.name = 'plantRoom.heatingManifold.circulationPump.controlBox';
  pumpControlBox.position.set(0, 0, 0.046);
  pumpControlBox.castShadow = true;
  pumpGroup.add(pumpControlBox);

  // Red Grundfos accent trim stripe & glowing 5-segment LED pump speed / proportional-pressure bar
  const pumpRedStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.008, 0.004),
    flowRedMat
  );
  pumpRedStripe.name = 'plantRoom.heatingManifold.circulationPump.accentStripe';
  pumpRedStripe.userData.lodTier = 'high';
  pumpRedStripe.userData.lodMaxDistance = 12;
  pumpRedStripe.position.set(0, 0.038, 0.066);
  pumpGroup.add(pumpRedStripe);

  const ledBarGroup = new THREE.Group();
  ledBarGroup.name = 'plantRoom.heatingManifold.circulationPump.ledBar';
  for (let seg = 0; seg < 5; seg++) {
    const segMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.014, 0.005),
      seg === 0 ? actuatorWarmLedMat : actuatorActiveLedMat
    );
    segMesh.name = `plantRoom.heatingManifold.circulationPump.ledBar.segment.${seg + 1}`;
    segMesh.userData.lodTier = 'high';
    segMesh.userData.lodMaxDistance = 12;
    segMesh.position.set(-0.024 + seg * 0.012, 0.012, 0.066);
    ledBarGroup.add(segMesh);
  }
  pumpGroup.add(ledBarGroup);

  manifoldGroup.add(pumpGroup);

  // =========================================================================
  // 4. UPPER BRUSHED STAINLESS-STEEL FLOW HEADER BAR (1¼" Square Profile,
  //    0.56m wide) + 10 TRANSPARENT/RED SIGHT-GLASS FLOWMETERS (0–5 L/min)
  //    + RED TEMPERATURE DIAL GAUGE (0–80°C)
  // =========================================================================
  const headerCenterX = -18.02; // Spans X = -18.30m to -17.74m
  const headerWidth = 0.56;
  const headerCrossSection = 0.042; // 1¼" heavy-wall stainless square manifold profile

  const flowHeaderBar = new THREE.Mesh(
    new THREE.BoxGeometry(headerWidth, headerCrossSection, headerCrossSection),
    brushedStainlessMat
  );
  flowHeaderBar.name = 'plantRoom.heatingManifold.flowHeaderBar';
  flowHeaderBar.position.set(headerCenterX, flowHeaderY, flowHeaderZ);
  flowHeaderBar.castShadow = true;
  flowHeaderBar.receiveShadow = true;
  manifoldGroup.add(flowHeaderBar);

  // Brass coupler union connecting Pump / Mixing Valve outlet into left end of Flow Header Bar
  const flowHeaderLeftUnion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8),
    brassMat
  );
  flowHeaderLeftUnion.name = 'plantRoom.heatingManifold.flowHeaderLeftUnion';
  flowHeaderLeftUnion.rotation.z = Math.PI / 2;
  flowHeaderLeftUnion.position.set(-18.33, flowHeaderY, flowHeaderZ);
  manifoldGroup.add(flowHeaderLeftUnion);

  // Red Temperature Dial Gauge (0–80°C) mounted on the left end of the Flow Header Bar
  const buildTemperatureDialGauge = (
    name: string,
    gx: number,
    gy: number,
    gz: number,
    caseMat: THREE.Material,
    dialMat: THREE.Material
  ): void => {
    const gaugeGroup = new THREE.Group();
    gaugeGroup.name = name;
    gaugeGroup.position.set(gx, gy, gz);

    // Brass thermowell pocket stem
    const pocketStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.024, 12),
      brassMat
    );
    pocketStem.name = `${name}.stem`;
    pocketStem.userData.lodTier = 'high';
    pocketStem.userData.lodMaxDistance = 12;
    pocketStem.rotation.x = Math.PI / 2;
    pocketStem.position.set(0, 0, 0.012);
    gaugeGroup.add(pocketStem);

    // Colored anodized gauge bezel (52mm diameter)
    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.016, 24),
      caseMat
    );
    bezel.name = `${name}.bezel`;
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(0, 0, 0.028);
    bezel.castShadow = true;
    gaugeGroup.add(bezel);

    // Printed 0–80°C dial face
    const dialFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.022, 24),
      dialMat
    );
    dialFace.name = `${name}.dialFace`;
    dialFace.position.set(0, 0, 0.0365);
    gaugeGroup.add(dialFace);

    manifoldGroup.add(gaugeGroup);
  };

  buildTemperatureDialGauge(
    'plantRoom.heatingManifold.flowTempGauge',
    -18.32,
    flowHeaderY,
    flowHeaderZ + headerCrossSection * 0.5,
    flowRedMat,
    flowGaugeDialMat
  );

  // =========================================================================
  // 5. LOWER BRUSHED STAINLESS-STEEL RETURN HEADER BAR (0.56m wide) +
  //    10 WHITE KNX/24V ELECTRO-THERMAL ZONE ACTUATOR HEADS +
  //    BLUE TEMPERATURE DIAL GAUGE (0–80°C)
  // =========================================================================
  const returnHeaderBar = new THREE.Mesh(
    new THREE.BoxGeometry(headerWidth, headerCrossSection, headerCrossSection),
    brushedStainlessMat
  );
  returnHeaderBar.name = 'plantRoom.heatingManifold.returnHeaderBar';
  returnHeaderBar.position.set(headerCenterX, returnHeaderY, returnHeaderZ);
  returnHeaderBar.castShadow = true;
  returnHeaderBar.receiveShadow = true;
  manifoldGroup.add(returnHeaderBar);

  // Brass coupler union connecting left end of Return Header Bar to pump return tee
  const returnHeaderLeftUnion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8),
    brassMat
  );
  returnHeaderLeftUnion.name = 'plantRoom.heatingManifold.returnHeaderLeftUnion';
  returnHeaderLeftUnion.rotation.z = Math.PI / 2;
  returnHeaderLeftUnion.position.set(-18.33, returnHeaderY, returnHeaderZ);
  manifoldGroup.add(returnHeaderLeftUnion);

  buildTemperatureDialGauge(
    'plantRoom.heatingManifold.returnTempGauge',
    -18.32,
    returnHeaderY,
    returnHeaderZ + headerCrossSection * 0.5,
    returnBlueMat,
    returnGaugeDialMat
  );

  // =========================================================================
  // 4b, 5b & 7. 10 HYDRONIC ZONE CIRCUITS:
  //    - 10 Sight-Glass Flowmeters (0–5 L/min) along top of Upper Flow Header
  //    - 10 White KNX/24V Electro-Thermal Zone Actuator Heads along top of Lower Return Header
  //    - 20 (10 x 2) Brass Eurocone Compression Fittings & 16mm White/Alu PEX-AL-PEX
  //      Underfloor Heating Circuit Pipes descending vertically to Y = tier2FloorY
  // =========================================================================
  const numPorts = 10;
  const firstPortX = -18.235;
  const portPitchX = 0.044; // 44mm port pitch across the 0.56m stainless headers

  // Realistic flow rates (L/min) across the 10 zones (varying float heights inside sight glasses)
  const zoneFlowRates = [2.8, 3.2, 2.5, 3.5, 1.8, 2.2, 3.0, 1.5, 2.6, 2.4] as const;

  for (let i = 0; i < numPorts; i++) {
    const portX = firstPortX + i * portPitchX;
    const circuitNum = i + 1;

    // --- A. Upper Flow Header Top: Transparent/Red Sight-Glass Flowmeter (0–5 L/min) ---
    const flowmeterGroup = new THREE.Group();
    flowmeterGroup.name = `plantRoom.heatingManifold.flowmeter.${circuitNum}`;
    flowmeterGroup.position.set(
      portX,
      flowHeaderY + headerCrossSection * 0.5,
      flowHeaderZ
    );

    // Brass hex base adapter screwed into top of flow header
    const fmBrassBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.012, 6),
      brassMat
    );
    fmBrassBase.name = `plantRoom.heatingManifold.flowmeter.${circuitNum}.brassBase`;
    fmBrassBase.userData.lodTier = 'high';
    fmBrassBase.userData.lodMaxDistance = 12;
    fmBrassBase.position.set(0, 0.006, 0);
    flowmeterGroup.add(fmBrassBase);

    // Clear graduated polycarbonate sight-glass tube
    const fmGlassTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0085, 0.046, 14),
      sightGlassClearMat
    );
    fmGlassTube.name = `plantRoom.heatingManifold.flowmeter.${circuitNum}.sightGlassTube`;
    fmGlassTube.position.set(0, 0.035, 0);
    flowmeterGroup.add(fmGlassTube);

    // Internal red spring-loaded flow indicator float disk & central guide pin
    const flowFraction = zoneFlowRates[i] / 5.0;
    const floatY = 0.018 + flowFraction * 0.026;
    const fmRedFloat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0062, 0.0062, 0.007, 12),
      flowRedMat
    );
    fmRedFloat.name = `plantRoom.heatingManifold.flowmeter.${circuitNum}.floatIndicator`;
    fmRedFloat.userData.lodTier = 'high';
    fmRedFloat.userData.lodMaxDistance = 12;
    fmRedFloat.position.set(0, floatY, 0);
    flowmeterGroup.add(fmRedFloat);

    // Black & red knurled flow-balancing lock ring cap at top of sight glass
    const fmLockCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0105, 0.0105, 0.01, 14),
      pumpCompositeBlackMat
    );
    fmLockCollar.name = `plantRoom.heatingManifold.flowmeter.${circuitNum}.lockCollar`;
    fmLockCollar.userData.lodTier = 'high';
    fmLockCollar.userData.lodMaxDistance = 12;
    fmLockCollar.position.set(0, 0.056, 0);
    flowmeterGroup.add(fmLockCollar);

    const fmRedCapRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.005, 14),
      flowRedMat
    );
    fmRedCapRing.name = `plantRoom.heatingManifold.flowmeter.${circuitNum}.capRing`;
    fmRedCapRing.userData.lodTier = 'high';
    fmRedCapRing.userData.lodMaxDistance = 12;
    fmRedCapRing.position.set(0, 0.062, 0);
    flowmeterGroup.add(fmRedCapRing);

    manifoldGroup.add(flowmeterGroup);

    // --- B. Lower Return Header Top: White KNX/24V Electro-Thermal Zone Actuator Head ---
    const actuatorGroup = new THREE.Group();
    actuatorGroup.name = `plantRoom.heatingManifold.zoneActuator.${circuitNum}`;
    actuatorGroup.position.set(
      portX,
      returnHeaderY + headerCrossSection * 0.5,
      returnHeaderZ
    );

    // M30x1.5 brass/nickel valve adapter bayonet ring
    const actAdapterRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12),
      brassMat
    );
    actAdapterRing.name = `plantRoom.heatingManifold.zoneActuator.${circuitNum}.adapterRing`;
    actAdapterRing.userData.lodTier = 'high';
    actAdapterRing.userData.lodMaxDistance = 12;
    actAdapterRing.position.set(0, 0.006, 0);
    actuatorGroup.add(actAdapterRing);

    // White sculpted electro-thermal wax-element actuator body
    const actBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0155, 0.014, 0.048, 18),
      actuatorWhiteMat
    );
    actBody.name = `plantRoom.heatingManifold.zoneActuator.${circuitNum}.body`;
    actBody.position.set(0, 0.036, 0);
    actBody.castShadow = true;
    actuatorGroup.add(actBody);

    // Glowing colored status indicator dome cap (green active / warm call-for-heat)
    const isCallingHeat = i % 3 === 0;
    const actStatusCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0125, 0.015, 0.011, 18),
      isCallingHeat ? actuatorWarmLedMat : actuatorActiveLedMat
    );
    actStatusCap.name = `plantRoom.heatingManifold.zoneActuator.${circuitNum}.statusCap`;
    actStatusCap.position.set(0, 0.064, 0);
    actuatorGroup.add(actStatusCap);

    manifoldGroup.add(actuatorGroup);

    // --- C. Flow & Return Brass Eurocone (3/4") Compression Fittings + Vertical 16mm PEX-AL-PEX Pipes ---
    for (const [isReturnPipe, headerBarY, pipeZ] of [
      [false, flowHeaderY, flowHeaderZ],
      [true, returnHeaderY, returnHeaderZ],
    ] as const) {
      const euroconeTopY = headerBarY - headerCrossSection * 0.5;

      // Brass spigot + hex compression nut
      const euroconeNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0125, 0.0125, 0.022, 6),
        brassMat
      );
      euroconeNut.name = isReturnPipe
        ? `plantRoom.heatingManifold.returnEurocone.${circuitNum}`
        : `plantRoom.heatingManifold.flowEurocone.${circuitNum}`;
      euroconeNut.position.set(portX, euroconeTopY - 0.011, pipeZ);
      manifoldGroup.add(euroconeNut);

      // Red / Blue circuit identification collar ring beneath the Eurocone nut
      const idCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 12),
        isReturnPipe ? returnBlueMat : flowRedMat
      );
      idCollar.name = isReturnPipe
        ? `plantRoom.heatingManifold.returnIdCollar.${circuitNum}`
        : `plantRoom.heatingManifold.flowIdCollar.${circuitNum}`;
      idCollar.userData.lodTier = 'high';
      idCollar.userData.lodMaxDistance = 12;
      idCollar.position.set(portX, euroconeTopY - 0.024, pipeZ);
      manifoldGroup.add(idCollar);

      // Vertical 16mm white/alu PEX-AL-PEX circuit pipe descending straight into the floor shroud at Y = tier2FloorY
      const pexTopY = euroconeTopY - 0.022;
      const pexLen = pexTopY - tier2FloorY;
      const pexPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, pexLen, 12),
        pexAlPexPipeMat
      );
      pexPipe.name = isReturnPipe
        ? `plantRoom.heatingManifold.pexReturnPipe.${circuitNum}`
        : `plantRoom.heatingManifold.pexFlowPipe.${circuitNum}`;
      pexPipe.position.set(portX, tier2FloorY + pexLen * 0.5, pipeZ);
      pexPipe.castShadow = true;
      pexPipe.receiveShadow = true;
      manifoldGroup.add(pexPipe);
    }
  }

  // =========================================================================
  // 6. AUTOMATIC BRASS AIR VENTS (AAV) AND DRAIN/FILL VALVES ON THE RIGHT END
  //    OF BOTH HEADER BARS (X = -17.715m)
  // =========================================================================
  const rightEndX = -17.715;

  for (const [isReturnEnd, headerY, headerZ] of [
    [false, flowHeaderY, flowHeaderZ],
    [true, returnHeaderY, returnHeaderZ],
  ] as const) {
    const endGroup = new THREE.Group();
    endGroup.name = isReturnEnd
      ? 'plantRoom.heatingManifold.returnEndAssembly'
      : 'plantRoom.heatingManifold.flowEndAssembly';
    endGroup.position.set(rightEndX, headerY, headerZ);

    // Forged brass end-piece tee body screwed into the right end of the stainless header bar
    const brassEndTee = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.052, 12),
      brassMat
    );
    brassEndTee.name = `${endGroup.name}.endTee`;
    brassEndTee.rotation.z = Math.PI / 2;
    brassEndTee.castShadow = true;
    endGroup.add(brassEndTee);

    // --- Upper Automatic Brass Air Vent (AAV — hygroscopic float chamber + red bleed cap) ---
    const aavGroup = new THREE.Group();
    aavGroup.name = isReturnEnd
      ? 'plantRoom.heatingManifold.returnAutoAirVent'
      : 'plantRoom.heatingManifold.flowAutoAirVent';

    const aavStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.018, 10),
      brassMat
    );
    aavStem.name = `${aavGroup.name}.stem`;
    aavStem.userData.lodTier = 'high';
    aavStem.userData.lodMaxDistance = 12;
    aavStem.position.set(0.008, 0.022, 0);
    aavGroup.add(aavStem);

    const aavChamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.044, 16),
      brassMat
    );
    aavChamber.name = `${aavGroup.name}.chamber`;
    aavChamber.position.set(0.008, 0.052, 0);
    aavChamber.castShadow = true;
    aavGroup.add(aavChamber);

    const aavBleedCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.007, 0.012, 12),
      flowRedMat
    );
    aavBleedCap.name = `${aavGroup.name}.bleedCap`;
    aavBleedCap.userData.lodTier = 'high';
    aavBleedCap.userData.lodMaxDistance = 12;
    aavBleedCap.position.set(0.008, 0.079, 0);
    aavGroup.add(aavBleedCap);

    endGroup.add(aavGroup);

    // --- Lower Swiveling Brass Drain / Fill Cock with Hose Union Spout & Winged Handle ---
    const drainGroup = new THREE.Group();
    drainGroup.name = isReturnEnd
      ? 'plantRoom.heatingManifold.returnDrainValve'
      : 'plantRoom.heatingManifold.flowDrainValve';

    const drainBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.036, 12),
      brassMat
    );
    drainBody.name = `${drainGroup.name}.body`;
    drainBody.position.set(0.008, -0.028, 0);
    drainGroup.add(drainBody);

    // Angled 3/4" brass hose union nozzle + chained blanking cap
    const hoseSpout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.009, 0.032, 12),
      brassMat
    );
    hoseSpout.name = `${drainGroup.name}.hoseSpout`;
    hoseSpout.userData.lodTier = 'high';
    hoseSpout.userData.lodMaxDistance = 12;
    hoseSpout.rotation.z = -Math.PI / 4;
    hoseSpout.position.set(0.024, -0.048, 0);
    drainGroup.add(hoseSpout);

    // Red (flow) / Blue (return) quarter-turn butterfly wing handle on front of drain valve
    const drainWingHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.012, 0.012),
      isReturnEnd ? returnBlueMat : flowRedMat
    );
    drainWingHandle.name = `${drainGroup.name}.wingHandle`;
    drainWingHandle.userData.lodTier = 'high';
    drainWingHandle.userData.lodMaxDistance = 12;
    drainWingHandle.position.set(0.008, -0.028, 0.016);
    drainGroup.add(drainWingHandle);

    endGroup.add(drainGroup);
    manifoldGroup.add(endGroup);
  }

  // =========================================================================
  // 7b. HORIZONTAL MULTI-PIPE CLIP RAILS & GALVANIZED FLOOR PIPE SHROUD
  //     (Organizing all 20 vertical 16mm PEX-AL-PEX circuit pipes down into
  //      the floor slab at Y = tier2FloorY = -0.60m)
  // =========================================================================
  const clipRailSpanW = 0.48;
  const clipRailCenterX = -18.037;

  for (const [rIdx, railY] of (
    [
      tier2FloorY + 0.94,
      tier2FloorY + 0.62,
      tier2FloorY + 0.30,
    ] as const
  ).entries()) {
    const railChannel = new THREE.Mesh(
      new THREE.BoxGeometry(clipRailSpanW, 0.024, 0.022),
      galvSteelMat
    );
    railChannel.name = `plantRoom.heatingManifold.pipeClipRail.${rIdx + 1}`;
    railChannel.position.set(clipRailCenterX, railY, wallZ + 0.012);
    railChannel.castShadow = true;
    manifoldGroup.add(railChannel);

    // Individual black polymer snap-in pipe Saddle Clips along the rail
    for (let i = 0; i < numPorts; i++) {
      const px = firstPortX + i * portPitchX;
      const pipeClip = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.022, 0.088),
        epdmRubberMat
      );
      pipeClip.name = `plantRoom.heatingManifold.pipeClipRail.${rIdx + 1}.clip.${i + 1}`;
      pipeClip.userData.lodTier = 'high';
      pipeClip.userData.lodMaxDistance = 12;
      pipeClip.position.set(px, railY, wallZ + 0.056);
      manifoldGroup.add(pipeClip);
    }
  }

  // Galvanized Sheet-Steel Floor Pipe Shroud / Screed Entry Box at Y = tier2FloorY (-0.60m)
  const shroudW = 0.56;
  const shroudH = 0.16;
  const shroudD = 0.13;
  const floorPipeShroud = new THREE.Mesh(
    new THREE.BoxGeometry(shroudW, shroudH, shroudD),
    galvSteelMat
  );
  floorPipeShroud.name = 'plantRoom.heatingManifold.floorPipeShroud';
  floorPipeShroud.position.set(
    clipRailCenterX,
    tier2FloorY + shroudH * 0.5,
    wallZ + shroudD * 0.5
  );
  floorPipeShroud.castShadow = true;
  floorPipeShroud.receiveShadow = true;
  manifoldGroup.add(floorPipeShroud);

  // Protective black EPDM rubber split-grommet top collar on the floor pipe shroud
  const shroudTopGrommet = new THREE.Mesh(
    new THREE.BoxGeometry(shroudW + 0.008, 0.014, shroudD + 0.008),
    epdmRubberMat
  );
  shroudTopGrommet.name = 'plantRoom.heatingManifold.floorPipeShroud.topGrommet';
  shroudTopGrommet.position.set(
    clipRailCenterX,
    tier2FloorY + shroudH + 0.005,
    wallZ + shroudD * 0.5
  );
  manifoldGroup.add(shroudTopGrommet);

  scene.add(manifoldGroup);
}

/**
 * Builds the Secondary 8-Port Stainless-Steel Hydronic Underfloor Heating Manifold
 * & Mixing Pump Station (`hall.understairsManifold`) inside the Hall Understairs Cupboard
 * (under the NW Quarter-Turn Landing at X = -17.45m, Z = -2.04m, Y = -0.30m..+0.62m, facing East +X).
 *
 * Engineering rationale:
 * - Serves Zone 3b (Main Hall, Boot Lobby, Cloakroom WC & Walk-In Cupboard: Ports 1–4) and
 *   Zone 4 (Dining Room, Snug & Kitchen: Ports 5–8), cutting 26m–30m of dead 16mm transit pipe
 *   per loop compared to running from the West Wing Plant Room.
 * - Its Flow & Return headers sit at world Y = +0.36m / +0.12m (with Automatic Air Vents at Y = +0.44m),
 *   which is above both the -0.30m Hall/Boot Lobby slab and the 0.00m Dining Room/Kitchen slab,
 *   ensuring 100% upward self-venting without airlocks across the stepped floor levels.
 */
function buildSecondaryHydronicManifoldStation(
  scene: THREE.Scene,
  prefix: string,
  zoneId: string,
  posX: number,
  floorY: number,
  posZ: number,
  rotY: number,
  numPorts: number,
  brassMat: THREE.Material,
  castIronMat: THREE.Material
): void {
  const manifoldGroup = new THREE.Group();
  manifoldGroup.name = prefix;
  manifoldGroup.userData.zone = zoneId;
  manifoldGroup.position.set(posX, floorY, posZ);
  manifoldGroup.rotation.y = rotY;

  const cabinetWhiteSteelMat = new THREE.MeshStandardMaterial({
    color: 0xf2f4f7,
    roughness: 0.32,
    metalness: 0.35,
  });
  const cabinetRecessInteriorMat = new THREE.MeshStandardMaterial({
    color: 0xdce1e7,
    roughness: 0.42,
    metalness: 0.45,
  });
  const galvSteelMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0c8,
    roughness: 0.3,
    metalness: 0.78,
  });
  const brushedStainlessMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde2,
    roughness: 0.22,
    metalness: 0.88,
  });
  const copperPipeMat = new THREE.MeshStandardMaterial({
    color: 0xc86d44,
    roughness: 0.26,
    metalness: 0.85,
  });
  const epdmRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1e2226,
    roughness: 0.78,
    metalness: 0.05,
  });
  const flowRedMat = new THREE.MeshStandardMaterial({
    color: 0xd62420,
    roughness: 0.28,
    metalness: 0.15,
  });
  const returnBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1862c8,
    roughness: 0.28,
    metalness: 0.15,
  });
  const pumpCompositeBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.36,
    metalness: 0.12,
  });
  const sightGlassClearMat = new THREE.MeshStandardMaterial({
    color: 0xeaf4ff,
    transparent: true,
    opacity: 0.46,
    roughness: 0.12,
    metalness: 0.08,
  });
  const actuatorWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.28,
    metalness: 0.06,
  });
  const actuatorWarmLedMat = new THREE.MeshStandardMaterial({
    color: 0xff5522,
    emissive: 0xe63800,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });
  const pexAlPexPipeMat = new THREE.MeshStandardMaterial({
    color: 0xedeff2,
    roughness: 0.34,
    metalness: 0.08,
  });
  const flowGaugeDialMat = new THREE.MeshStandardMaterial({
    map: createTemperatureGaugeDialTexture(true),
    roughness: 0.2,
  });
  const returnGaugeDialMat = new THREE.MeshStandardMaterial({
    map: createTemperatureGaugeDialTexture(false),
    roughness: 0.2,
  });

  // 1. Compact Surface-Mounted Sheet-Steel Manifold Cabinet (0.50m W x 0.48m H)
  const cabinetW = 0.52;
  const cabinetH = 0.48;
  const cabinetCenterY = 0.54;

  const backplate = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW, cabinetH, 0.01),
    cabinetWhiteSteelMat
  );
  backplate.name = `${prefix}.cabinetBackplate`;
  backplate.position.set(0, cabinetCenterY, 0.005);
  manifoldGroup.add(backplate);

  const innerPan = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW - 0.03, cabinetH - 0.03, 0.006),
    cabinetRecessInteriorMat
  );
  innerPan.name = `${prefix}.cabinetInnerPan`;
  innerPan.position.set(0, cabinetCenterY, 0.01);
  manifoldGroup.add(innerPan);

  const flangeDepth = 0.088;
  const topHood = new THREE.Mesh(
    new THREE.BoxGeometry(cabinetW, 0.016, flangeDepth),
    cabinetWhiteSteelMat
  );
  topHood.name = `${prefix}.cabinetTopHood`;
  topHood.position.set(0, cabinetCenterY + cabinetH * 0.5 - 0.008, flangeDepth * 0.5);
  manifoldGroup.add(topHood);

  for (const sideSign of [-1, 1] as const) {
    const sideCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, cabinetH, flangeDepth),
      cabinetWhiteSteelMat
    );
    sideCheek.name = `${prefix}.cabinetSideCheek.${sideSign < 0 ? 'left' : 'right'}`;
    sideCheek.position.set(sideSign * (cabinetW * 0.5 - 0.008), cabinetCenterY, flangeDepth * 0.5);
    manifoldGroup.add(sideCheek);
  }

  // Upper KNX UFH Wiring Center & Actuator Controller Bar (local Y = 0.814m)
  const wiringCenterY = cabinetCenterY + cabinetH * 0.5 + 0.034;
  const wiringBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.062, 0.048),
    cabinetWhiteSteelMat
  );
  wiringBox.name = `${prefix}.knxWiringCenter`;
  wiringBox.position.set(0.03, wiringCenterY, 0.024);
  manifoldGroup.add(wiringBox);

  const wiringWin = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.018, 0.004),
    epdmRubberMat
  );
  wiringWin.name = `${prefix}.knxWiringCenter.statusWindow`;
  wiringWin.position.set(0.03, wiringCenterY + 0.005, 0.049);
  manifoldGroup.add(wiringWin);

  for (let zLed = 0; zLed < numPorts; zLed++) {
    const ledMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.007, 0.004),
      actuatorWarmLedMat
    );
    ledMesh.name = `${prefix}.wiringLed.${zLed + 1}`;
    ledMesh.userData.lodTier = 'high';
    ledMesh.userData.lodMaxDistance = 12;
    ledMesh.position.set(-0.07 + zLed * 0.058, wiringCenterY + 0.005, 0.051);
    manifoldGroup.add(ledMesh);
  }

  // 2. Flow & Return Stainless-Steel Header Bars
  const flowHeaderY = 0.66;
  const returnHeaderY = 0.42;
  const flowHeaderZ = 0.064;
  const returnHeaderZ = 0.082;
  const headerCenterX = 0.035;
  const headerWidth = 0.34;
  const headerCrossSection = 0.038;

  const flowHeaderBar = new THREE.Mesh(
    new THREE.BoxGeometry(headerWidth, headerCrossSection, headerCrossSection),
    brushedStainlessMat
  );
  flowHeaderBar.name = `${prefix}.flowHeaderBar`;
  flowHeaderBar.position.set(headerCenterX, flowHeaderY, flowHeaderZ);
  manifoldGroup.add(flowHeaderBar);

  const returnHeaderBar = new THREE.Mesh(
    new THREE.BoxGeometry(headerWidth, headerCrossSection, headerCrossSection),
    brushedStainlessMat
  );
  returnHeaderBar.name = `${prefix}.returnHeaderBar`;
  returnHeaderBar.position.set(headerCenterX, returnHeaderY, returnHeaderZ);
  manifoldGroup.add(returnHeaderBar);

  for (const [bIdx, bx] of ([-0.09, 0.16] as const).entries()) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.34, 0.016),
      galvSteelMat
    );
    bracket.name = `${prefix}.mountingBracket.${bIdx + 1}`;
    bracket.position.set(bx, (flowHeaderY + returnHeaderY) * 0.5, 0.018);
    manifoldGroup.add(bracket);
  }

  // 3. Left-Side 28mm Insulated Primary Copper Feed Risers + Isolation Ball Valves +
  //    Thermostatic Blending Valve + Grundfos UPM3 Circulation Pump
  const pumpAxisX = -0.175;
  const returnDropX = -0.22;

  for (const [rx, topY, rz, leverMat, valveName] of [
    [pumpAxisX, flowHeaderY, flowHeaderZ, flowRedMat, `${prefix}.flowIsolationValve`],
    [returnDropX, returnHeaderY, returnHeaderZ, returnBlueMat, `${prefix}.returnIsolationValve`],
  ] as const) {
    const riser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, topY, 12),
      copperPipeMat
    );
    riser.name = `${valveName}.riserPipe`;
    riser.position.set(rx, topY * 0.5, rz);
    manifoldGroup.add(riser);

    const valveBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.046, 12),
      brassMat
    );
    valveBody.name = valveName;
    valveBody.position.set(rx, 0.24, rz);
    manifoldGroup.add(valveBody);

    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.075, 0.007),
      leverMat
    );
    lever.name = `${valveName}.leverHandle`;
    lever.position.set(rx, 0.21, rz + 0.028);
    manifoldGroup.add(lever);
  }

  const mixBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.056, 14),
    brassMat
  );
  mixBody.name = `${prefix}.thermostaticMixingValve`;
  mixBody.position.set(pumpAxisX, flowHeaderY, flowHeaderZ);
  manifoldGroup.add(mixBody);

  const mixHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.022, 0.042, 16),
    pumpCompositeBlackMat
  );
  mixHead.name = `${prefix}.thermostaticMixingValve.handwheelHead`;
  mixHead.rotation.x = Math.PI / 2;
  mixHead.position.set(pumpAxisX, flowHeaderY, flowHeaderZ + 0.032);
  manifoldGroup.add(mixHead);

  const pumpCenterY = (flowHeaderY + returnHeaderY) * 0.5;
  const pumpCenterZ = (flowHeaderZ + returnHeaderZ) * 0.5;
  const pumpVolute = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.11, 16),
    castIronMat
  );
  pumpVolute.name = `${prefix}.circulationPump`;
  pumpVolute.position.set(pumpAxisX, pumpCenterY, pumpCenterZ);
  manifoldGroup.add(pumpVolute);

  const pumpBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, 0.092, 0.036),
    pumpCompositeBlackMat
  );
  pumpBox.name = `${prefix}.circulationPump.controlBox`;
  pumpBox.position.set(pumpAxisX, pumpCenterY, pumpCenterZ + 0.04);
  manifoldGroup.add(pumpBox);

  const pumpStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.064, 0.007, 0.004),
    flowRedMat
  );
  pumpStripe.name = `${prefix}.circulationPump.accentStripe`;
  pumpStripe.userData.lodTier = 'high';
  pumpStripe.userData.lodMaxDistance = 12;
  pumpStripe.position.set(pumpAxisX, pumpCenterY + 0.032, pumpCenterZ + 0.059);
  manifoldGroup.add(pumpStripe);

  for (const [gy, gz, caseMat, dialMat, gName] of [
    [flowHeaderY, flowHeaderZ + 0.022, flowRedMat, flowGaugeDialMat, `${prefix}.flowTempGauge`],
    [returnHeaderY, returnHeaderZ + 0.022, returnBlueMat, returnGaugeDialMat, `${prefix}.returnTempGauge`],
  ] as const) {
    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.014, 18),
      caseMat
    );
    bezel.name = gName;
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(-0.115, gy, gz + 0.012);
    manifoldGroup.add(bezel);

    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.0185, 18), dialMat);
    dial.name = `${gName}.dialFace`;
    dial.position.set(-0.115, gy, gz + 0.0195);
    manifoldGroup.add(dial);
  }

  // 4. Hydronic Zone Ports (Flowmeters + KNX Electro-Thermal Actuators + PEX-AL-PEX Pipes)
  const firstPortX = -0.06;
  const portPitchX = 0.055;

  for (let i = 0; i < numPorts; i++) {
    const portX = firstPortX + i * portPitchX;
    const circuitNum = i + 1;

    const fmTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0075, 0.0075, 0.04, 10),
      sightGlassClearMat
    );
    fmTube.name = `${prefix}.flowmeter.${circuitNum}`;
    fmTube.position.set(portX, flowHeaderY + headerCrossSection * 0.5 + 0.024, flowHeaderZ);
    manifoldGroup.add(fmTube);

    const fmFloat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 10),
      flowRedMat
    );
    fmFloat.name = `${prefix}.flowmeter.${circuitNum}.floatIndicator`;
    fmFloat.userData.lodTier = 'high';
    fmFloat.userData.lodMaxDistance = 12;
    fmFloat.position.set(portX, flowHeaderY + headerCrossSection * 0.5 + 0.026, flowHeaderZ);
    manifoldGroup.add(fmFloat);

    const actBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.0125, 0.042, 14),
      actuatorWhiteMat
    );
    actBody.name = `${prefix}.zoneActuator.${circuitNum}`;
    actBody.position.set(portX, returnHeaderY + headerCrossSection * 0.5 + 0.024, returnHeaderZ);
    manifoldGroup.add(actBody);

    const actCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.0135, 0.01, 14),
      actuatorWarmLedMat
    );
    actCap.name = `${prefix}.zoneActuator.${circuitNum}.statusCap`;
    actCap.position.set(portX, returnHeaderY + headerCrossSection * 0.5 + 0.048, returnHeaderZ);
    manifoldGroup.add(actCap);

    for (const [isReturnPipe, hY, pZ] of [
      [false, flowHeaderY, flowHeaderZ],
      [true, returnHeaderY, returnHeaderZ],
    ] as const) {
      const euroconeTopY = hY - headerCrossSection * 0.5;
      const nut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.018, 6),
        brassMat
      );
      nut.name = isReturnPipe
        ? `${prefix}.returnEurocone.${circuitNum}`
        : `${prefix}.flowEurocone.${circuitNum}`;
      nut.position.set(portX, euroconeTopY - 0.009, pZ);
      manifoldGroup.add(nut);

      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 10),
        isReturnPipe ? returnBlueMat : flowRedMat
      );
      collar.name = isReturnPipe
        ? `${prefix}.returnCollar.${circuitNum}`
        : `${prefix}.flowCollar.${circuitNum}`;
      collar.userData.lodTier = 'high';
      collar.userData.lodMaxDistance = 12;
      collar.position.set(portX, euroconeTopY - 0.02, pZ);
      manifoldGroup.add(collar);

      const pexLen = euroconeTopY - 0.02;
      const pexPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0075, 0.0075, pexLen, 8),
        pexAlPexPipeMat
      );
      pexPipe.name = isReturnPipe
        ? `${prefix}.pexReturnPipe.${circuitNum}`
        : `${prefix}.pexFlowPipe.${circuitNum}`;
      pexPipe.position.set(portX, pexLen * 0.5, pZ);
      manifoldGroup.add(pexPipe);
    }
  }

  // 5. Right-End Automatic Brass Air Vents (AAV) & Drain Valves
  const rightEndX = headerCenterX + headerWidth * 0.5 + 0.018;
  for (const [isRet, hY, hZ] of [
    [false, flowHeaderY, flowHeaderZ],
    [true, returnHeaderY, returnHeaderZ],
  ] as const) {
    const aavBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.04, 12),
      brassMat
    );
    aavBody.name = isRet
      ? `${prefix}.returnAutoAirVent`
      : `${prefix}.flowAutoAirVent`;
    aavBody.position.set(rightEndX, hY + 0.036, hZ);
    manifoldGroup.add(aavBody);

    const aavCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0065, 0.01, 10),
      flowRedMat
    );
    aavCap.name = `${aavBody.name}.bleedCap`;
    aavCap.userData.lodTier = 'high';
    aavCap.userData.lodMaxDistance = 12;
    aavCap.position.set(rightEndX, hY + 0.06, hZ);
    manifoldGroup.add(aavCap);
  }

  // Galvanized Floor Pipe Shroud at floorY
  const shroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.12, 0.11),
    galvSteelMat
  );
  shroud.name = `${prefix}.floorPipeShroud`;
  shroud.position.set(0.035, 0.06, 0.055);
  manifoldGroup.add(shroud);

  scene.add(manifoldGroup);
}

/**
 * Manifold A: 4-Port Stainless-Steel Hydronic Underfloor Heating Manifold & Mixing Pump Station
 * (`hall.understairsManifold`) inside the Hall Understairs Cupboard (`Y = -0.30m`),
 * serving Zone 3 on the `-0.30m` & `-0.60m` slabs (Entrance Hall, Main Hall South, Main Hall NE,
 * and Downstairs Cloakroom WC + Boot Lobby).
 */
export function buildUnderstairsHeatingManifold(
  scene: THREE.Scene,
  lowerFloorY: number,
  brassMat: THREE.Material,
  castIronMat: THREE.Material
): void {
  buildSecondaryHydronicManifoldStation(
    scene,
    'hall.understairsManifold',
    'hall',
    -17.45,
    lowerFloorY,
    -2.04,
    Math.PI / 2,
    4,
    brassMat,
    castIronMat
  );
}

/**
 * Manifold B: 4-Port Stainless-Steel Hydronic Underfloor Heating Manifold & Mixing Pump Station
 * (`familyRoom.bootRoomManifold`) mounted on the East partition wall of the Boot Room
 * (`familyRoom.walkInCupboard`, `X = -7.98m, Y = 0.00m, Z = -1.95m`, facing West `-X`),
 * enclosed inside a bespoke waist-height Boxed-In Shaker Manifold Cupboard
 * (`familyRoom.bootRoomManifoldCupboard`) with an interactive ventilated Shaker door and
 * bullnosed antique oak countertop.
 *
 * Serves all four `Y = 0.00m` East Wing UFH circuits (Boot Room, Dining Room & Snug,
 * Kitchen West & Island, and Utility + East Kitchen) with zero `16mm` screed loops crossing
 * the `-0.30m -> 0.00m` step and 100% upward self-venting to its AAVs at `Y = +0.72m`.
 */
export function buildBootRoomHeatingManifold(
  scene: THREE.Scene,
  floorY: number,
  brassMat: THREE.Material,
  castIronMat: THREE.Material,
  oakMat?: THREE.Material,
  registerDoor?: (
    doorGroup: THREE.Group,
    doorLeaf: THREE.Group,
    hingeOffset: THREE.Vector3,
    axis: 'x' | 'y' | 'z',
    openAngle: number
  ) => void
): void {
  buildSecondaryHydronicManifoldStation(
    scene,
    'familyRoom.bootRoomManifold',
    'familyRoom',
    -7.98,
    floorY,
    -1.95,
    -Math.PI / 2,
    4,
    brassMat,
    castIronMat
  );

  // Bespoke Boxed-In Shaker Manifold Cupboard (`familyRoom.bootRoomManifoldCupboard`)
  // enclosing Manifold B along the North half of the Boot Room East wall
  // (`X = -8.22m..-7.97m, Y = 0.00m..0.96m, Z = -2.49m..-1.55m`)
  const cupboardGroup = new THREE.Group();
  cupboardGroup.name = 'familyRoom.bootRoomManifoldCupboard';
  cupboardGroup.userData.zone = 'familyRoom';

  const joineryPaintMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6, // Warm heritage stone/cream Shaker joinery matching Boot Bench
    roughness: 0.48,
    metalness: 0.02,
  });
  const joineryRecessMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c5,
    roughness: 0.56,
    metalness: 0.02,
  });
  const darkVentSlotMat = new THREE.MeshStandardMaterial({
    color: 0x2b2620,
    roughness: 0.85,
    metalness: 0.02,
  });
  const counterOakMat =
    oakMat ??
    new THREE.MeshStandardMaterial({
      color: 0x8d633e,
      roughness: 0.46,
      metalness: 0.04,
    });

  const cupMinZ = -2.49;
  const cupMaxZ = -1.55;
  const cupSpanZ = cupMaxZ - cupMinZ; // 0.94m
  const cupCenterZ = (cupMinZ + cupMaxZ) * 0.5; // -2.02m
  const wallX = -7.972;
  const frontX = -8.212;
  const cupDepthX = wallX - frontX; // 0.24m
  const cupCenterX = (wallX + frontX) * 0.5; // -8.092m
  const carcassH = 0.925;

  // 1. Recessed Shaker Plinth Base (`Y = 0.00m..0.07m`) along West front & South return
  const plinthMesh = new THREE.Mesh(
    new THREE.BoxGeometry(cupDepthX - 0.024, 0.07, cupSpanZ - 0.01),
    joineryPaintMat
  );
  plinthMesh.name = 'familyRoom.bootRoomManifoldCupboard.plinth';
  plinthMesh.position.set(cupCenterX + 0.012, floorY + 0.035, cupCenterZ + 0.005);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  cupboardGroup.add(plinthMesh);

  // 2. South Painted Shaker Side Cheek (`Z = -1.562m`, `X = -8.212m..-7.972m`, `Y = 0.07m..0.925m`)
  const southCheekCore = new THREE.Mesh(
    new THREE.BoxGeometry(cupDepthX, carcassH - 0.07, 0.024),
    joineryPaintMat
  );
  southCheekCore.name = 'familyRoom.bootRoomManifoldCupboard.southCheek';
  southCheekCore.position.set(cupCenterX, floorY + 0.07 + (carcassH - 0.07) * 0.5, cupMaxZ - 0.012);
  southCheekCore.castShadow = true;
  southCheekCore.receiveShadow = true;
  cupboardGroup.add(southCheekCore);

  // Recessed Shaker panel detail on the exterior South face of the side cheek
  const southCheekRecess = new THREE.Mesh(
    new THREE.BoxGeometry(cupDepthX - 0.07, carcassH - 0.22, 0.006),
    joineryRecessMat
  );
  southCheekRecess.name = 'familyRoom.bootRoomManifoldCupboard.southCheek.recessPanel';
  southCheekRecess.position.set(cupCenterX, floorY + 0.495, cupMaxZ + 0.002);
  cupboardGroup.add(southCheekRecess);

  // 3. West Face-Frame Stiles (North stile at Z = -2.445m, South stile at Z = -1.595m) & Top/Bottom Rails
  for (const [stileName, sz, sw] of [
    ['northStile', cupMinZ + 0.045, 0.09],
    ['southStile', cupMaxZ - 0.045, 0.09],
  ] as const) {
    const stile = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, carcassH - 0.07, sw),
      joineryPaintMat
    );
    stile.name = `familyRoom.bootRoomManifoldCupboard.${stileName}`;
    stile.position.set(frontX + 0.012, floorY + 0.07 + (carcassH - 0.07) * 0.5, sz);
    stile.castShadow = true;
    stile.receiveShadow = true;
    cupboardGroup.add(stile);
  }

  const railSpanZ = cupSpanZ - 0.18; // 0.76m between stiles
  for (const [railName, ry, rh] of [
    ['bottomRail', floorY + 0.09, 0.04],
    ['topRail', floorY + carcassH - 0.0225, 0.045],
  ] as const) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, rh, railSpanZ),
      joineryPaintMat
    );
    rail.name = `familyRoom.bootRoomManifoldCupboard.${railName}`;
    rail.position.set(frontX + 0.012, ry, cupCenterZ);
    rail.castShadow = true;
    rail.receiveShadow = true;
    cupboardGroup.add(rail);
  }

  // 4. Solid Antique Oak Bullnosed Countertop (`Y = 0.925m..0.961m`) overhanging West & South
  const topThickness = 0.034;
  const topR = topThickness * 0.5;
  const topMinX = frontX - 0.022; // -8.234m
  const topMaxX = wallX; // -7.972m
  const topMinZ = cupMinZ; // -2.49m
  const topMaxZ = cupMaxZ + 0.022; // -1.528m
  const topCoreX = topMaxX - (topMinX + topR);
  const topCoreZ = topMaxZ - topR - topMinZ;
  const topY = floorY + carcassH + topR;

  const oakTopCore = new THREE.Mesh(
    new THREE.BoxGeometry(topCoreX, topThickness, topCoreZ),
    counterOakMat
  );
  oakTopCore.name = 'familyRoom.bootRoomManifoldCupboard.oakCountertop';
  oakTopCore.position.set(
    (topMinX + topR + topMaxX) * 0.5,
    topY,
    (topMinZ + (topMaxZ - topR)) * 0.5
  );
  oakTopCore.castShadow = true;
  oakTopCore.receiveShadow = true;
  cupboardGroup.add(oakTopCore);

  // Half-round bullnose along West (-X) front edge of the oak countertop
  const westBullnoseGeo = new THREE.CylinderGeometry(topR, topR, topCoreZ, 16);
  westBullnoseGeo.rotateX(Math.PI / 2);
  const westBullnose = new THREE.Mesh(westBullnoseGeo, counterOakMat);
  westBullnose.name = 'familyRoom.bootRoomManifoldCupboard.oakCountertop.westBullnose';
  westBullnose.position.set(
    topMinX + topR,
    topY,
    (topMinZ + (topMaxZ - topR)) * 0.5
  );
  westBullnose.castShadow = true;
  westBullnose.receiveShadow = true;
  cupboardGroup.add(westBullnose);

  // Half-round bullnose along South (+Z) return edge of the oak countertop
  const southBullnoseGeo = new THREE.CylinderGeometry(topR, topR, topCoreX, 16);
  southBullnoseGeo.rotateZ(Math.PI / 2);
  const southBullnose = new THREE.Mesh(southBullnoseGeo, counterOakMat);
  southBullnose.name = 'familyRoom.bootRoomManifoldCupboard.oakCountertop.southBullnose';
  southBullnose.position.set(
    (topMinX + topR + topMaxX) * 0.5,
    topY,
    topMaxZ - topR
  );
  southBullnose.castShadow = true;
  southBullnose.receiveShadow = true;
  cupboardGroup.add(southBullnose);

  // Quarter-sphere rounded SW corner return of the oak countertop
  const cornerBullnose = new THREE.Mesh(
    new THREE.SphereGeometry(topR, 16, 12),
    counterOakMat
  );
  cornerBullnose.name = 'familyRoom.bootRoomManifoldCupboard.oakCountertop.cornerBullnose';
  cornerBullnose.position.set(topMinX + topR, topY, topMaxZ - topR);
  cornerBullnose.castShadow = true;
  cupboardGroup.add(cornerBullnose);

  // 5. Interactive Hinged Ventilated Shaker Access Door (`familyRoom.bootRoomManifoldCupboard.door`)
  const doorW = railSpanZ - 0.006; // 0.754m along Z
  const doorH = carcassH - 0.158; // 0.767m along Y (`Y = 0.111m..0.878m`)
  const doorGroup = new THREE.Group();
  doorGroup.name = 'familyRoom.bootRoomManifoldCupboard.door';
  doorGroup.position.set(frontX, floorY + 0.111 + doorH * 0.5, cupCenterZ);

  const doorLeaf = new THREE.Group();
  doorLeaf.name = 'familyRoom.bootRoomManifoldCupboard.door.leaf';

  // Recessed Shaker panel backing
  const doorPanelBacking = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, doorH - 0.02, doorW - 0.02),
    joineryRecessMat
  );
  doorPanelBacking.name = 'familyRoom.bootRoomManifoldCupboard.door.panel';
  doorPanelBacking.castShadow = true;
  doorPanelBacking.receiveShadow = true;
  doorLeaf.add(doorPanelBacking);

  // Perimeter Shaker door stiles & rails + center vertical mullion (forming twin Shaker bays)
  const dFrameThick = 0.022;
  const dStileW = 0.058;
  for (const [partName, py, pz, sy, sz] of [
    ['topRail', doorH * 0.5 - dStileW * 0.5, 0, dStileW, doorW],
    ['bottomRail', -doorH * 0.5 + dStileW * 0.5, 0, dStileW, doorW],
    ['northStile', 0, -doorW * 0.5 + dStileW * 0.5, doorH - dStileW * 2, dStileW],
    ['centerMullion', 0, 0, doorH - dStileW * 2, 0.048],
    ['southStile', 0, doorW * 0.5 - dStileW * 0.5, doorH - dStileW * 2, dStileW],
  ] as const) {
    const fMesh = new THREE.Mesh(
      new THREE.BoxGeometry(dFrameThick, sy, sz),
      joineryPaintMat
    );
    fMesh.name = `familyRoom.bootRoomManifoldCupboard.door.${partName}`;
    fMesh.position.set(0, py, pz);
    fMesh.castShadow = true;
    fMesh.receiveShadow = true;
    doorLeaf.add(fMesh);
  }

  // Routed ventilation louvre slots across the upper Shaker panels so the manifold station is ventilated
  for (const [bayTag, bayZ] of [
    ['northBay', -doorW * 0.24],
    ['southBay', doorW * 0.24],
  ] as const) {
    for (let v = 0; v < 5; v++) {
      const vy = 0.14 + v * 0.028;
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.008, 0.19),
        darkVentSlotMat
      );
      slot.name = `familyRoom.bootRoomManifoldCupboard.door.${bayTag}.ventSlot.${v + 1}`;
      slot.userData.lodTier = 'high';
      slot.userData.lodMaxDistance = 12;
      slot.position.set(-0.001, vy, bayZ);
      doorLeaf.add(slot);
    }
  }

  // Two aged-brass butt hinges on the North stile (`z = -doorW / 2`)
  for (const [hTag, hy] of [['bottom', -0.24], ['top', 0.24]] as const) {
    const hinge = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.048, 0.014),
      brassMat
    );
    hinge.name = `familyRoom.bootRoomManifoldCupboard.door.hinge.${hTag}`;
    hinge.userData.lodTier = 'high';
    hinge.userData.lodMaxDistance = 12;
    hinge.position.set(-0.01, hy, -doorW * 0.5 + 0.004);
    doorLeaf.add(hinge);
  }

  // Turned antique brass cupboard latch knob & backplate rose on the South stile
  const knobRose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.005, 14),
    brassMat
  );
  knobRose.name = 'familyRoom.bootRoomManifoldCupboard.door.knobRose';
  knobRose.userData.lodTier = 'high';
  knobRose.userData.lodMaxDistance = 12;
  knobRose.rotation.z = Math.PI / 2;
  knobRose.position.set(-0.013, 0.02, doorW * 0.5 - dStileW * 0.5);
  doorLeaf.add(knobRose);

  const knobStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.007, 0.016, 12),
    brassMat
  );
  knobStem.name = 'familyRoom.bootRoomManifoldCupboard.door.knobStem';
  knobStem.userData.lodTier = 'high';
  knobStem.userData.lodMaxDistance = 12;
  knobStem.rotation.z = Math.PI / 2;
  knobStem.position.set(-0.022, 0.02, doorW * 0.5 - dStileW * 0.5);
  doorLeaf.add(knobStem);

  const knobHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 14, 12),
    brassMat
  );
  knobHead.name = 'familyRoom.bootRoomManifoldCupboard.door.knobHead';
  knobHead.scale.set(0.72, 1, 1);
  knobHead.position.set(-0.032, 0.02, doorW * 0.5 - dStileW * 0.5);
  knobHead.castShadow = true;
  doorLeaf.add(knobHead);

  doorGroup.add(doorLeaf);
  cupboardGroup.add(doorGroup);
  scene.add(cupboardGroup);

  if (registerDoor) {
    registerDoor(
      doorGroup,
      doorLeaf,
      new THREE.Vector3(0, 0, -doorW * 0.5),
      'y',
      -Math.PI * 0.58
    );
  }
}



