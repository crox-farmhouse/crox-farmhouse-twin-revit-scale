import * as THREE from 'three';
import {
  createConformalBodyPatchGeometry,
  createSideWindowDloGeometry,
  type Porsche992Materials,
} from './porsche-materials-and-body.ts';

function tagHighLodDetail(obj: THREE.Object3D): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = 18;
}

/**
 * Builds the flush compound-curved glazing (windshield, fastback rear window, and iconic
 * 911 parabolic spear side windows) and the high-detail 992.2 interior cabin.
 */
export function buildPorsche992GlazingAndInteriorCabin(
  carGroup: THREE.Group,
  mats: Porsche992Materials
): void {
  // 2. Flush Compound-Curved Glazing (`outbuildings.garage.porsche992TurboS.glazing`)
  const glazingGroup = new THREE.Group();
  glazingGroup.name = 'outbuildings.garage.porsche992TurboS.glazing';
  carGroup.add(glazingGroup);

  // Front Windshield (flush conformal patch with thin satin-black ceramic frit border)
  const windshieldBorderGeo = createConformalBodyPatchGeometry(
    -0.92,
    -0.26,
    () => 0.0,
    () => 0.295,
    24,
    24,
    0.0025,
    false
  );
  const windshieldBorderMesh = new THREE.Mesh(windshieldBorderGeo, mats.glossBlackTrimMat);
  windshieldBorderMesh.name = 'outbuildings.garage.porsche992TurboS.glazing.windshieldBorder';
  glazingGroup.add(windshieldBorderMesh);

  const windshieldGlassGeo = createConformalBodyPatchGeometry(
    -0.88,
    -0.30,
    () => 0.0,
    () => 0.275,
    24,
    24,
    0.0042,
    false
  );
  const windshieldGlassMesh = new THREE.Mesh(windshieldGlassGeo, mats.tintedGlassMat);
  windshieldGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(windshieldGlassMesh);

  // Fastback Rear Window (`x = +0.48m .. +1.52m`)
  const rearGlassBorderGeo = createConformalBodyPatchGeometry(
    0.46,
    1.54,
    () => 0.0,
    () => 0.285,
    24,
    22,
    0.0025,
    false
  );
  const rearGlassBorderMesh = new THREE.Mesh(rearGlassBorderGeo, mats.glossBlackTrimMat);
  rearGlassBorderMesh.name = 'outbuildings.garage.porsche992TurboS.glazing.rearWindowBorder';
  glazingGroup.add(rearGlassBorderMesh);

  const rearGlassGeo = createConformalBodyPatchGeometry(
    0.50,
    1.50,
    () => 0.0,
    () => 0.265,
    24,
    22,
    0.0042,
    false
  );
  const rearGlassMesh = new THREE.Mesh(rearGlassGeo, mats.tintedGlassMat);
  rearGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(rearGlassMesh);

  // Iconic Porsche 911 Teardrop Spear Side Windows (`DLO`, built from exact 2D side-view `(x, y)` curves!)
  const sideWindowTrimGeo = createSideWindowDloGeometry(0.018, 0.014, 0.0028);
  const sideWindowTrimMesh = new THREE.Mesh(sideWindowTrimGeo, mats.glossBlackTrimMat);
  sideWindowTrimMesh.name = 'outbuildings.garage.porsche992TurboS.glazing.sideWindowTrim';
  glazingGroup.add(sideWindowTrimMesh);

  const sideWindowGlassGeo = createSideWindowDloGeometry(0.0, 0.0, 0.0045);
  const sideWindowGlassMesh = new THREE.Mesh(sideWindowGlassGeo, mats.tintedGlassMat);
  sideWindowGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(sideWindowGlassMesh);

  // 3. Detailed 992.2 Interior Cabin (`outbuildings.garage.porsche992TurboS.interior`)
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'outbuildings.garage.porsche992TurboS.interior';
  tagHighLodDetail(interiorGroup);
  carGroup.add(interiorGroup);

  const dashCowling = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.16, 1.12),
    mats.slateLeatherMat
  );
  dashCowling.name = 'outbuildings.garage.porsche992TurboS.interior.dashCowling';
  dashCowling.position.set(-0.56, 0.80, 0);
  tagHighLodDetail(dashCowling);
  interiorGroup.add(dashCowling);

  const chronoPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.055, 16),
    mats.slateLeatherMat
  );
  chronoPod.name = 'outbuildings.garage.porsche992TurboS.interior.sportChronoPod';
  chronoPod.rotation.z = Math.PI / 2;
  chronoPod.position.set(-0.52, 0.89, 0);
  tagHighLodDetail(chronoPod);
  interiorGroup.add(chronoPod);

  // RHD GT Sport Steering Wheel (`z = +0.34m` for UK Crox Farmhouse)
  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.155, 0.018, 12, 24),
    mats.slateLeatherMat
  );
  steeringWheel.name = 'outbuildings.garage.porsche992TurboS.interior.steeringWheel';
  steeringWheel.rotation.y = Math.PI / 2;
  steeringWheel.rotation.z = -0.32;
  steeringWheel.position.set(-0.32, 0.83, 0.34);
  tagHighLodDetail(steeringWheel);
  interiorGroup.add(steeringWheel);

  // Two 18-Way Adaptive Sport Seats Plus in two-tone Slate Grey & Chalk leather
  for (const seatZ of [-0.34, 0.34] as const) {
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.11, 0.44),
      mats.slateLeatherMat
    );
    seatBase.name = 'outbuildings.garage.porsche992TurboS.interior.seatBase';
    seatBase.position.set(0.0, 0.46, seatZ);
    tagHighLodDetail(seatBase);
    interiorGroup.add(seatBase);

    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.56, 0.42),
      mats.slateLeatherMat
    );
    seatBack.name = 'outbuildings.garage.porsche992TurboS.interior.seatBackrest';
    seatBack.position.set(0.22, 0.76, seatZ);
    seatBack.rotation.z = -0.24;
    tagHighLodDetail(seatBack);
    interiorGroup.add(seatBack);

    const seatCenterInsert = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.42, 0.26),
      mats.chalkLeatherMat
    );
    seatCenterInsert.name = 'outbuildings.garage.porsche992TurboS.interior.seatInsert';
    seatCenterInsert.position.set(0.212, 0.73, seatZ);
    seatCenterInsert.rotation.z = -0.24;
    tagHighLodDetail(seatCenterInsert);
    interiorGroup.add(seatCenterInsert);
  }
}

/**
 * Builds a single high-LOD 20"/21" Porsche 992.2 Turbo S Exclusive Design Forged Center-Lock Wheel,
 * Michelin Pilot Sport 4S tire (OPEN-ENDED tread cylinder so the wheel spokes, PCCB rotor & Speed Yellow
 * brake caliper are 100% visible!), 420mm/390mm PCCB cross-drilled carbon-ceramic rotor, and Speed Yellow caliper.
 */
export function buildPorscheTurboSWheelCorner(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  tireRadius: number,
  rimRadius: number,
  tireWidth: number,
  isLeft: boolean,
  isFront: boolean,
  materials: {
    tireRubberMat: THREE.Material;
    diamondCutAlloyMat: THREE.Material;
    turboniteBarrelMat: THREE.Material;
    pccbRotorMat: THREE.Material;
    pccbYellowCaliperMat: THREE.Material;
    centerLockMat: THREE.Material;
    crestMat: THREE.Material;
  }
): void {
  const signZ = isLeft ? -1 : 1;
  const cornerGroup = new THREE.Group();
  cornerGroup.name = 'outbuildings.garage.porsche992TurboS.wheel';
  cornerGroup.position.set(x, y, z);
  parent.add(cornerGroup);

  // 1. Michelin Pilot Sport 4S Tire Assembly:
  //    CRITICAL: `openEnded = true` so solid circular cylinder end-caps NEVER cover the forged wheel spokes or PCCB brakes!
  const treadW = tireWidth * 0.82;
  const treadCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(tireRadius, tireRadius, treadW, 36, 1, true),
    materials.tireRubberMat
  );
  treadCyl.name = 'outbuildings.garage.porsche992TurboS.wheel.tireTread';
  treadCyl.rotation.x = Math.PI / 2;
  treadCyl.castShadow = true;
  treadCyl.receiveShadow = true;
  cornerGroup.add(treadCyl);

  const sidewallTubeR = (tireRadius - rimRadius) * 0.55;
  const sidewallMajorR = rimRadius + sidewallTubeR * 0.92;
  for (const side of [-1, 1] as const) {
    const shoulderTorus = new THREE.Mesh(
      new THREE.TorusGeometry(sidewallMajorR, sidewallTubeR, 16, 36),
      materials.tireRubberMat
    );
    shoulderTorus.name = 'outbuildings.garage.porsche992TurboS.wheel.tireSidewall';
    shoulderTorus.scale.set(1, 1, 0.55);
    shoulderTorus.position.set(0, 0, side * (treadW * 0.46));
    cornerGroup.add(shoulderTorus);
  }

  // 2. Dark Turbonite Inner Alloy Wheel Barrel, Recessed Back-Plate & Outer Diamond-Turned Lip Flange
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius, rimRadius * 0.96, tireWidth * 0.82, 32, 1, true),
    materials.turboniteBarrelMat
  );
  barrel.name = 'outbuildings.garage.porsche992TurboS.wheel.alloyBarrel';
  barrel.rotation.x = Math.PI / 2;
  cornerGroup.add(barrel);

  const innerWheelBackDisk = new THREE.Mesh(
    new THREE.CircleGeometry(rimRadius * 0.96, 28),
    materials.turboniteBarrelMat
  );
  innerWheelBackDisk.name = 'outbuildings.garage.porsche992TurboS.wheel.innerBackDisk';
  innerWheelBackDisk.position.set(0, 0, -signZ * (tireWidth * 0.36));
  if (!isLeft) innerWheelBackDisk.rotation.y = Math.PI;
  cornerGroup.add(innerWheelBackDisk);

  const outerFaceZ = signZ * (tireWidth * 0.42);
  const rimLipRing = new THREE.Mesh(
    new THREE.TorusGeometry(rimRadius, 0.012, 14, 36),
    materials.diamondCutAlloyMat
  );
  rimLipRing.name = 'outbuildings.garage.porsche992TurboS.wheel.rimLipFlange';
  rimLipRing.scale.set(1, 1, 0.65);
  rimLipRing.position.set(0, 0, outerFaceZ);
  cornerGroup.add(rimLipRing);

  // 3. 992.2 Turbo S Exclusive Design 5-Twin-Spoke (10-blade) Forged Wheel Face
  const hubRadius = 0.058;
  const spokeLen = rimRadius - hubRadius - 0.004;
  const spokeMidR = hubRadius + spokeLen * 0.5;
  for (let p = 0; p < 5; p++) {
    const pairAngle = (p / 5) * Math.PI * 2;
    for (const bladeOffset of [-0.145, 0.145] as const) {
      const ang = pairAngle + bladeOffset;
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, spokeLen, 0.02),
        materials.diamondCutAlloyMat
      );
      spoke.name = 'outbuildings.garage.porsche992TurboS.wheel.forgedSpoke';
      spoke.position.set(
        Math.cos(ang) * spokeMidR,
        Math.sin(ang) * spokeMidR,
        outerFaceZ - signZ * 0.014
      );
      spoke.rotation.z = ang - Math.PI / 2;
      spoke.rotation.x = signZ * 0.12;
      cornerGroup.add(spoke);
    }
  }

  // 4. Forged Center-Lock Hub & Porsche Crest Cap
  const hubCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(hubRadius, hubRadius * 1.08, 0.044, 24),
    materials.turboniteBarrelMat
  );
  hubCyl.name = 'outbuildings.garage.porsche992TurboS.wheel.centerHub';
  hubCyl.rotation.x = Math.PI / 2;
  hubCyl.position.set(0, 0, outerFaceZ - signZ * 0.026);
  cornerGroup.add(hubCyl);

  const centerLockNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.039, 0.026, 12),
    materials.centerLockMat
  );
  centerLockNut.name = 'outbuildings.garage.porsche992TurboS.wheel.centerLockNut';
  centerLockNut.rotation.x = Math.PI / 2;
  centerLockNut.position.set(0, 0, outerFaceZ - signZ * 0.006);
  tagHighLodDetail(centerLockNut);
  cornerGroup.add(centerLockNut);

  const crestCap = new THREE.Mesh(
    new THREE.CircleGeometry(0.022, 16),
    materials.crestMat
  );
  crestCap.name = 'outbuildings.garage.porsche992TurboS.wheel.crestCenterCap';
  crestCap.position.set(0, 0, outerFaceZ + signZ * 0.008);
  if (isLeft) crestCap.rotation.y = Math.PI;
  tagHighLodDetail(crestCap);
  cornerGroup.add(crestCap);

  // 5. PCCB 420mm Front / 390mm Rear Cross-Drilled Carbon-Ceramic Brake Rotor & Speed Yellow Caliper
  const rotorR = isFront ? 0.205 : 0.192;
  const rotorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rotorR, rotorR, 0.026, 32),
    materials.pccbRotorMat
  );
  rotorMesh.name = 'outbuildings.garage.porsche992TurboS.pccbRotor';
  rotorMesh.rotation.x = Math.PI / 2;
  rotorMesh.position.set(0, 0, outerFaceZ - signZ * 0.056);
  tagHighLodDetail(rotorMesh);
  cornerGroup.add(rotorMesh);

  // 10-Piston Front / 4-Piston Rear Porsche Speed Yellow Monobloc Caliper
  const caliperAngle = isFront ? 0.32 : Math.PI - 0.32;
  const caliperR = rotorR - 0.026;
  const caliperGroup = new THREE.Group();
  caliperGroup.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  caliperGroup.position.set(
    Math.cos(caliperAngle) * caliperR,
    Math.sin(caliperAngle) * caliperR,
    outerFaceZ - signZ * 0.048
  );
  caliperGroup.rotation.z = caliperAngle;
  tagHighLodDetail(caliperGroup);
  cornerGroup.add(caliperGroup);

  const caliperBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, isFront ? 0.195 : 0.155, 0.068),
    materials.pccbYellowCaliperMat
  );
  caliperBody.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  tagHighLodDetail(caliperBody);
  caliperGroup.add(caliperBody);
}

/**
 * Builds all 4 staggered 20"/21" Turbo S Exclusive Design Center-Lock Wheels & PCCB Brakes.
 */
export function buildPorsche992WheelsAndBrakes(
  carGroup: THREE.Group,
  mats: Porsche992Materials
): void {
  const wheelMaterials = {
    tireRubberMat: mats.tireRubberMat,
    diamondCutAlloyMat: mats.diamondCutAlloyMat,
    turboniteBarrelMat: mats.satinBlackAeroMat,
    pccbRotorMat: mats.pccbRotorMat,
    pccbYellowCaliperMat: mats.pccbYellowCaliperMat,
    centerLockMat: mats.turboniteMat,
    crestMat: mats.crestMat,
  };

  // Front Left & Right (`255/35 ZR20`, `tireR = 0.338m, rimR = 0.258m, width = 0.265m` at `x = -1.25m, z = ±0.785m`)
  buildPorscheTurboSWheelCorner(carGroup, -1.25, 0.338, -0.785, 0.338, 0.258, 0.265, true, true, wheelMaterials);
  buildPorscheTurboSWheelCorner(carGroup, -1.25, 0.338, 0.785, 0.338, 0.258, 0.265, false, true, wheelMaterials);

  // Rear Left & Right (`315/30 ZR21`, `tireR = 0.356m, rimR = 0.274m, width = 0.325m` at `x = +1.20m, z = ±0.805m`)
  buildPorscheTurboSWheelCorner(carGroup, 1.20, 0.356, -0.805, 0.356, 0.274, 0.325, true, false, wheelMaterials);
  buildPorscheTurboSWheelCorner(carGroup, 1.20, 0.356, 0.805, 0.356, 0.274, 0.325, false, false, wheelMaterials);
}
