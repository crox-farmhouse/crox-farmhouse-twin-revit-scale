import * as THREE from 'three';

export interface DewaltDrillViewmodel {
  root: THREE.Group;
  chuckGroup: THREE.Group;
  triggerMesh: THREE.Mesh;
  worklightMat: THREE.MeshStandardMaterial;
  worklightBeamMesh: THREE.Mesh;
}

function createDewaltSideBadgeTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // DeWALT yellow background
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dark recess panel for DEWALT logo
  ctx.fillStyle = '#141517';
  ctx.beginPath();
  ctx.roundRect(18, 18, 330, 108, 12);
  ctx.fill();

  // Top & bottom yellow accent bars inside logo badge
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(32, 28, 302, 7);
  ctx.fillRect(32, 109, 302, 7);

  // Bold DEWALT lettering
  ctx.fillStyle = '#f2b705';
  ctx.font = '900 58px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DEWALT', 183, 71);

  // Bottom sub-badge: "18V XR  BRUSHLESS"
  ctx.fillStyle = '#141517';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('18V', 24, 158);
  ctx.fillStyle = '#d92b2b';
  ctx.fillText('XR', 86, 158);
  ctx.fillStyle = '#141517';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('BRUSHLESS', 142, 158);

  // Rear motor housing ventilation Louvers on right side of texture
  ctx.fillStyle = '#121315';
  for (let i = 0; i < 5; i++) {
    const x = 372 + i * 24;
    ctx.beginPath();
    ctx.roundRect(x, 30, 13, 126, 5);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createTorqueCollarTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#1a1b1d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grip ribs + torque numbers
  ctx.fillStyle = '#2b2d30';
  for (let i = 0; i < 32; i++) {
    ctx.fillRect(i * 16, 46, 8, 44);
  }

  ctx.fillStyle = '#f0f0f0';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labels = ['1', '•', '3', '•', '5', '•', '7', '•', '9', '•', '11', '•', '13', '•', '15', '🔧'];
  for (let i = 0; i < labels.length; i++) {
    const x = ((i + 0.5) / labels.length) * canvas.width;
    ctx.fillText(labels[i], x, 24);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createBatterySideTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Black lower battery shell with yellow top stripe
  ctx.fillStyle = '#18191b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f2b705';
  ctx.fillRect(0, 0, canvas.width, 46);

  ctx.fillStyle = '#141517';
  ctx.font = '900 30px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('DEWALT', 24, 24);

  ctx.fillStyle = '#f2b705';
  ctx.font = '900 48px "Arial Black", Impact, sans-serif';
  ctx.fillText('18V', 24, 102);

  ctx.fillStyle = '#e02828';
  ctx.fillRect(142, 68, 86, 58);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 42px "Arial Black", Impact, sans-serif';
  ctx.fillText('XR', 154, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Arial, sans-serif';
  ctx.fillText('5.0Ah', 248, 96);
  ctx.fillStyle = '#a0a6ad';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('LI-ION', 250, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a detailed 1:1 scale 3D DeWALT DCD796 18V XR Brushless Combi Drill
 * configured as a first-person viewmodel (`-Z` forward along the drill bit).
 */
export function buildDewaltDrillViewmodel(): DewaltDrillViewmodel {
  const root = new THREE.Group();
  root.name = 'walkthrough.dewaltDrillViewmodel';
  root.userData.isAnnotationGroup = true;

  // Core materials
  const dewaltYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf2b705,
    roughness: 0.34,
    metalness: 0.06,
  });
  const blackRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1b1d,
    roughness: 0.78,
    metalness: 0.05,
  });
  const darkPolymerMat = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.48,
    metalness: 0.12,
  });
  const steelGearboxMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec6,
    roughness: 0.26,
    metalness: 0.88,
  });
  const darkChuckMat = new THREE.MeshStandardMaterial({
    color: 0x1e2024,
    roughness: 0.35,
    metalness: 0.75,
  });
  const hssBitMat = new THREE.MeshStandardMaterial({
    color: 0xd4dae2,
    roughness: 0.18,
    metalness: 0.94,
  });
  const redSwitchMat = new THREE.MeshStandardMaterial({
    color: 0xc82222,
    roughness: 0.4,
    metalness: 0.08,
  });
  const sideBadgeTex = createDewaltSideBadgeTexture();
  const sideBadgeMat = new THREE.MeshStandardMaterial({
    map: sideBadgeTex,
    color: sideBadgeTex ? 0xffffff : 0xf2b705,
    roughness: 0.36,
    metalness: 0.06,
  });
  const torqueTex = createTorqueCollarTexture();
  const torqueCollarMat = new THREE.MeshStandardMaterial({
    map: torqueTex,
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.15,
  });
  const batterySideTex = createBatterySideTexture();
  const batterySideMat = new THREE.MeshStandardMaterial({
    map: batterySideTex,
    color: batterySideTex ? 0xffffff : 0x18191b,
    roughness: 0.45,
    metalness: 0.08,
  });

  // ─── 1. Upper Brushless Motor Housing (`y = 0`, `z = -0.055 .. +0.082`) ────
  const motorGroup = new THREE.Group();
  motorGroup.name = 'dewaltDrill.motorHousing';
  root.add(motorGroup);

  // Main cylindrical yellow barrel (`R = 0.031m`, `L = 0.115m`, aligned along Z)
  const mainBarrelGeo = new THREE.CylinderGeometry(0.030, 0.032, 0.115, 24);
  mainBarrelGeo.rotateX(Math.PI / 2);
  const mainBarrel = new THREE.Mesh(mainBarrelGeo, dewaltYellowMat);
  mainBarrel.position.set(0, 0, 0.015);
  motorGroup.add(mainBarrel);

  // Flattened side badge cheeks on left (`-X`, facing player) and right (`+X`)
  const leftCheekGeo = new THREE.PlaneGeometry(0.102, 0.038);
  leftCheekGeo.rotateY(-Math.PI / 2);
  const leftCheek = new THREE.Mesh(leftCheekGeo, sideBadgeMat);
  leftCheek.position.set(-0.0308, 0.002, 0.016);
  motorGroup.add(leftCheek);

  const rightCheekGeo = new THREE.PlaneGeometry(0.102, 0.038);
  rightCheekGeo.rotateY(Math.PI / 2);
  const rightCheek = new THREE.Mesh(rightCheekGeo, sideBadgeMat);
  rightCheek.position.set(0.0308, 0.002, 0.016);
  motorGroup.add(rightCheek);

  // Rear black rubberized motor endcap (`z = +0.072 .. +0.092`)
  const rearCapGeo = new THREE.CylinderGeometry(0.030, 0.025, 0.024, 24);
  rearCapGeo.rotateX(Math.PI / 2);
  const rearCap = new THREE.Mesh(rearCapGeo, blackRubberMat);
  rearCap.position.set(0, 0, 0.082);
  motorGroup.add(rearCap);

  const rearDomeGeo = new THREE.SphereGeometry(0.025, 20, 12);
  rearDomeGeo.scale(1.0, 1.0, 0.45);
  const rearDome = new THREE.Mesh(rearDomeGeo, blackRubberMat);
  rearDome.position.set(0, 0, 0.093);
  motorGroup.add(rearDome);

  // Top 2-Speed Gearbox Slide Selector Recess & Switch (`1` / `2`)
  const selectorRecess = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.005, 0.044),
    darkPolymerMat
  );
  selectorRecess.position.set(0, 0.0305, 0.005);
  motorGroup.add(selectorRecess);

  const selectorSlider = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.006, 0.020),
    redSwitchMat
  );
  selectorSlider.position.set(0, 0.033, -0.004);
  motorGroup.add(selectorSlider);

  // Black rubberized top sight ribs along motor crown
  for (const xOff of [-0.016, 0.016]) {
    const topRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.004, 0.092),
      blackRubberMat
    );
    topRib.position.set(xOff, 0.029, 0.018);
    motorGroup.add(topRib);
  }

  // ─── 2. Gearbox Nose, Mode Collar & 15-Position Torque Clutch (`z = -0.042 .. -0.088`) ──
  // Silver cast-alloy gearbox housing ring
  const gearboxRingGeo = new THREE.CylinderGeometry(0.025, 0.029, 0.016, 24);
  gearboxRingGeo.rotateX(Math.PI / 2);
  const gearboxRing = new THREE.Mesh(gearboxRingGeo, steelGearboxMat);
  gearboxRing.position.set(0, 0, -0.050);
  motorGroup.add(gearboxRing);

  // Numbered 15-position torque clutch collar + drill/hammer mode collar
  const torqueCollarGeo = new THREE.CylinderGeometry(0.0245, 0.0265, 0.030, 28, 1, true);
  torqueCollarGeo.rotateX(Math.PI / 2);
  const torqueCollar = new THREE.Mesh(torqueCollarGeo, torqueCollarMat);
  torqueCollar.position.set(0, 0, -0.072);
  motorGroup.add(torqueCollar);

  const torqueCollarCoreGeo = new THREE.CylinderGeometry(0.0242, 0.0262, 0.030, 24);
  torqueCollarCoreGeo.rotateX(Math.PI / 2);
  const torqueCollarCore = new THREE.Mesh(torqueCollarCoreGeo, darkPolymerMat);
  torqueCollarCore.position.set(0, 0, -0.072);
  motorGroup.add(torqueCollarCore);

  // ─── 3. Rotating Keyless 13mm Chuck + HSS Twist Drill Bit (`chuckGroup`) ──
  const chuckGroup = new THREE.Group();
  chuckGroup.name = 'dewaltDrill.chuckGroup';
  chuckGroup.position.set(0, 0, -0.088);
  root.add(chuckGroup);

  // Rear chuck sleeve
  const chuckRearGeo = new THREE.CylinderGeometry(0.021, 0.0225, 0.022, 20);
  chuckRearGeo.rotateX(Math.PI / 2);
  const chuckRear = new THREE.Mesh(chuckRearGeo, darkChuckMat);
  chuckRear.position.set(0, 0, -0.011);
  chuckGroup.add(chuckRear);

  // Yellow thin accent ring on chuck
  const chuckAccentGeo = new THREE.CylinderGeometry(0.0214, 0.0214, 0.003, 20);
  chuckAccentGeo.rotateX(Math.PI / 2);
  const chuckAccent = new THREE.Mesh(chuckAccentGeo, dewaltYellowMat);
  chuckAccent.position.set(0, 0, -0.022);
  chuckGroup.add(chuckAccent);

  // Tapered front chuck nose cone
  const chuckConeGeo = new THREE.CylinderGeometry(0.0125, 0.021, 0.020, 20);
  chuckConeGeo.rotateX(Math.PI / 2);
  const chuckCone = new THREE.Mesh(chuckConeGeo, darkChuckMat);
  chuckCone.position.set(0, 0, -0.032);
  chuckGroup.add(chuckCone);

  // Knurled grip ribs around the chuck body (makes rotation visually obvious!)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.0025, 0.018),
      steelGearboxMat
    );
    rib.position.set(
      Math.cos(angle) * 0.0212,
      Math.sin(angle) * 0.0212,
      -0.011
    );
    rib.rotation.z = angle;
    chuckGroup.add(rib);
  }

  // Three steel chuck jaws clamping the drill bit
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const jaw = new THREE.Mesh(
      new THREE.BoxGeometry(0.0035, 0.0035, 0.012),
      steelGearboxMat
    );
    jaw.position.set(
      Math.cos(angle) * 0.005,
      Math.sin(angle) * 0.005,
      -0.045
    );
    jaw.rotation.z = angle;
    chuckGroup.add(jaw);
  }

  // 8mm HSS Twist Drill Bit (`z = -0.044 .. -0.145` relative to chuckGroup)
  const bitShankGeo = new THREE.CylinderGeometry(0.0038, 0.0038, 0.096, 14);
  bitShankGeo.rotateX(Math.PI / 2);
  const bitShank = new THREE.Mesh(bitShankGeo, hssBitMat);
  bitShank.position.set(0, 0, -0.092);
  chuckGroup.add(bitShank);

  // Spiral dark flute groove wrap around the drill bit so spinning is unmistakable
  const flutePoints: THREE.Vector3[] = [];
  const fluteTurns = 4.5;
  const fluteSteps = 44;
  for (let i = 0; i <= fluteSteps; i++) {
    const t = i / fluteSteps;
    const theta = t * fluteTurns * Math.PI * 2;
    const r = 0.0041;
    const z = -0.052 - t * 0.084;
    flutePoints.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
  }
  const fluteCurve = new THREE.CatmullRomCurve3(flutePoints);
  const fluteGeo = new THREE.TubeGeometry(fluteCurve, 40, 0.0011, 6, false);
  const fluteMesh = new THREE.Mesh(fluteGeo, darkChuckMat);
  chuckGroup.add(fluteMesh);

  // 118-degree conical carbide tip at the end of the drill bit
  const bitTipGeo = new THREE.ConeGeometry(0.0040, 0.009, 14);
  bitTipGeo.rotateX(-Math.PI / 2);
  const bitTip = new THREE.Mesh(bitTipGeo, hssBitMat);
  bitTip.position.set(0, 0, -0.144);
  chuckGroup.add(bitTip);

  // ─── 4. Ergonomic Pistol Grip Handle & Variable-Speed Trigger ─────────────
  const handleGroup = new THREE.Group();
  handleGroup.name = 'dewaltDrill.pistolGrip';
  handleGroup.position.set(0, -0.022, 0.024);
  // Slight forward ergonomic pistol-grip rake
  handleGroup.rotation.x = 0.19;
  root.add(handleGroup);

  // Main black TPE overmould grip column
  const gripCoreGeo = new THREE.CylinderGeometry(0.017, 0.019, 0.112, 16);
  gripCoreGeo.scale(0.82, 1.0, 1.32);
  const gripCore = new THREE.Mesh(gripCoreGeo, blackRubberMat);
  gripCore.position.set(0, -0.052, 0);
  handleGroup.add(gripCore);

  // Yellow structural spine strips along front and lower-rear of grip
  const frontSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.088, 0.014),
    dewaltYellowMat
  );
  frontSpine.position.set(0, -0.058, -0.016);
  handleGroup.add(frontSpine);

  // Ergonomic horizontal rubber finger ribs along the grip
  for (let i = 0; i < 6; i++) {
    const ribY = -0.028 - i * 0.013;
    const gripRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.030, 0.0045, 0.042),
      darkPolymerMat
    );
    gripRib.position.set(0, ribY, 0.003);
    handleGroup.add(gripRib);
  }

  // Variable-speed curved finger trigger (`triggerMesh`)
  const triggerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.024, 0.018),
    darkPolymerMat
  );
  triggerMesh.name = 'dewaltDrill.trigger';
  triggerMesh.position.set(0, -0.012, -0.026);
  handleGroup.add(triggerMesh);

  // Forward / Reverse cross-bolt selector button above trigger
  const fwdRevButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.008, 0.012),
    redSwitchMat
  );
  fwdRevButton.position.set(0, 0.002, -0.015);
  handleGroup.add(fwdRevButton);

  // ─── 5. Flare Foot + DeWALT 18V XR 5.0Ah Li-Ion Slide Battery Pack ────────
  const batteryGroup = new THREE.Group();
  batteryGroup.name = 'dewaltDrill.batteryPack';
  batteryGroup.position.set(0, -0.132, 0.010);
  root.add(batteryGroup);

  // Yellow tool foot interface shoe above battery rail
  const footShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.020, 0.088),
    dewaltYellowMat
  );
  footShoe.position.set(0, 0.004, 0.002);
  batteryGroup.add(footShoe);

  // Stainless steel belt hook mounted on the right (`+X`) side of the tool foot
  const beltClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.032, 0.042),
    steelGearboxMat
  );
  beltClip.position.set(0.032, -0.004, 0.005);
  batteryGroup.add(beltClip);

  // Main 18V XR 5.0Ah battery body (`0.076m W × 0.054m H × 0.116m L`)
  const batteryMaterials: THREE.Material[] = [
    batterySideMat, // +X right
    batterySideMat, // -X left (visible to player)
    dewaltYellowMat, // +Y top
    blackRubberMat, // -Y bottom
    blackRubberMat, // +Z rear
    blackRubberMat, // -Z front
  ];
  const batteryBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, 0.052, 0.114),
    batteryMaterials
  );
  batteryBox.position.set(0, -0.032, 0.002);
  batteryGroup.add(batteryBox);

  // Black rubberized corner bumper ribs on battery pack
  for (const xSign of [-1, 1]) {
    for (const zOff of [-0.048, 0.050]) {
      const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.054, 0.016),
        blackRubberMat
      );
      bumper.position.set(xSign * 0.036, -0.032, zOff);
      batteryGroup.add(bumper);
    }
  }

  // Yellow battery release latch button on front-top of pack
  const releaseLatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.012, 0.016),
    dewaltYellowMat
  );
  releaseLatch.position.set(0, -0.008, -0.048);
  batteryGroup.add(releaseLatch);

  // 3 Green LED State-of-Charge Fuel Gauge Indicator Bars on rear of battery
  const ledGreenMat = new THREE.MeshStandardMaterial({
    color: 0x22ff66,
    emissive: new THREE.Color(0x18dd55),
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  for (let i = -1; i <= 1; i++) {
    const ledBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.007, 0.004, 0.002),
      ledGreenMat
    );
    ledBar.position.set(i * 0.010, -0.026, 0.060);
    batteryGroup.add(ledBar);
  }

  // ─── 6. Foot-Mounted Pivoting White LED Worklight + Volumetric Cone ───────
  const worklightBezelGeo = new THREE.CylinderGeometry(0.0065, 0.0075, 0.010, 14);
  worklightBezelGeo.rotateX(Math.PI / 2 + 0.36);
  const worklightBezel = new THREE.Mesh(worklightBezelGeo, steelGearboxMat);
  worklightBezel.position.set(0, 0.008, -0.044);
  batteryGroup.add(worklightBezel);

  const worklightMat = new THREE.MeshStandardMaterial({
    color: 0xf5fbff,
    emissive: new THREE.Color(0xd8f0ff),
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.1,
  });
  const worklightLensGeo = new THREE.SphereGeometry(0.0052, 12, 10);
  const worklightLens = new THREE.Mesh(worklightLensGeo, worklightMat);
  worklightLens.position.set(0, 0.010, -0.048);
  batteryGroup.add(worklightLens);

  // Subtle additive volumetric light cone when trigger is pulled
  const beamConeGeo = new THREE.ConeGeometry(0.065, 0.26, 16, 1, true);
  beamConeGeo.translate(0, -0.13, 0);
  beamConeGeo.rotateX(Math.PI / 2 + 0.34);
  const worklightBeamMat = new THREE.MeshBasicMaterial({
    color: 0xdcf0ff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const worklightBeamMesh = new THREE.Mesh(beamConeGeo, worklightBeamMat);
  worklightBeamMesh.position.set(0, 0.010, -0.049);
  batteryGroup.add(worklightBeamMesh);

  // Mark every child as part of an annotation/viewmodel helper group so it is
  // excluded from obstacle raycasts, USD scene serialization, and batch merging,
  // and disable frustum culling + shadow casting for crisp close-up rendering.
  root.traverse((obj) => {
    obj.userData.isAnnotationGroup = true;
    obj.frustumCulled = false;
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = false;
      obj.receiveShadow = true;
    }
  });

  return {
    root,
    chuckGroup,
    triggerMesh,
    worklightMat,
    worklightBeamMesh,
  };
}
