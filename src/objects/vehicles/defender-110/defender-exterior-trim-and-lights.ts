import * as THREE from 'three';
import {
  createConformalDefenderPatchGeometry,
  createConformalLateralWindowOrPanelGeometry,
  createDefenderBonnetLetteringTexture,
  createUkNumberPlateTexture,
  type Defender110Materials,
  getPlanWrapShiftX,
  sampleLateralSurfaceZAtXY,
} from './defender-materials-and-monocoque.ts';

function tagHighLodDetail(obj: THREE.Object3D): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = 18;
}

/**
 * Builds the iconic L663 Defender signature exterior accessories:
 * - Floating C-Pillar "Signature Graphic" panel & square mount boss
 * - Alpine roof light windows, panoramic sliding glass sunroof, longitudinal roof rails & ClearSight fin
 * - Exterior side-mounted gear carrier box on the right rear quarter
 * - Raised roof-height safari snorkel / raised air intake on the left A-pillar
 * - Louvred front fender side vents
 */
export function buildDefender110SignatureExteriorAccessories(
  defenderGroup: THREE.Group,
  mats: Defender110Materials
): void {
  // A. Floating C-Pillar "Signature Graphic" Panel (`courtyard.landRoverDefender.signatureGraphic`)
  //    on both sides (`x = +0.98m..+1.52m, y = 1.26m..1.86m, z = ±0.88m`) in satin anthracite/black
  //    with the recessed square accessory mount boss.
  const signatureGraphicGroup = new THREE.Group();
  signatureGraphicGroup.name = 'courtyard.landRoverDefender.signatureGraphic';
  defenderGroup.add(signatureGraphicGroup);

  const sigPanelGeo = createConformalLateralWindowOrPanelGeometry(
    0.98,
    1.52,
    () => 1.265,
    () => 1.855,
    14,
    12,
    0.0065,
    [-1, 1]
  );
  const sigPanelMesh = new THREE.Mesh(sigPanelGeo, mats.satinAnthraciteMat);
  sigPanelMesh.name = 'courtyard.landRoverDefender.signatureGraphic';
  sigPanelMesh.castShadow = true;
  signatureGraphicGroup.add(sigPanelMesh);

  for (const sideZ of [-1, 1] as const) {
    const zBoss = sideZ * (sampleLateralSurfaceZAtXY(1.25, 1.56) + 0.01);
    const bossFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.145, 0.012),
      mats.narvikGlossBlackMat
    );
    bossFrame.name = 'courtyard.landRoverDefender.signatureGraphic.mountBossFrame';
    bossFrame.position.set(1.25, 1.56, zBoss);
    bossFrame.rotation.x = -sideZ * 0.16;
    signatureGraphicGroup.add(bossFrame);

    const bossCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.095, 0.016),
      mats.satinAnthraciteMat
    );
    bossCap.name = 'courtyard.landRoverDefender.signatureGraphic.mountBossCap';
    bossCap.position.set(1.25, 1.56, zBoss + sideZ * 0.003);
    bossCap.rotation.x = -sideZ * 0.16;
    signatureGraphicGroup.add(bossCap);
  }

  // B. Iconic Defender Alpine Roof Light Windows (`courtyard.landRoverDefender.alpineLight`)
  //    curved into the left and right upper roof cantrails (`x = +0.65m..+2.10m, y = 1.88m..1.95m, z = ±0.76m`),
  //    plus longitudinal black roof rails and panoramic sliding glass sunroof (`x = -0.35m..+1.35m, y = 1.965m`).
  const alpineLightGroup = new THREE.Group();
  alpineLightGroup.name = 'courtyard.landRoverDefender.alpineLight';
  defenderGroup.add(alpineLightGroup);

  const alpineBezelGeo = createConformalDefenderPatchGeometry(
    0.63,
    2.12,
    () => 0.285,
    () => 0.348,
    24,
    8,
    0.0038,
    0.0038,
    true
  );
  const alpineBezelMesh = new THREE.Mesh(alpineBezelGeo, mats.narvikGlossBlackMat);
  alpineBezelMesh.name = 'courtyard.landRoverDefender.alpineLight.bezel';
  alpineLightGroup.add(alpineBezelMesh);

  const alpineGlassGeo = createConformalDefenderPatchGeometry(
    0.65,
    2.10,
    () => 0.292,
    () => 0.340,
    24,
    8,
    0.0052,
    0.0052,
    true
  );
  const alpineGlassMesh = new THREE.Mesh(alpineGlassGeo, mats.tintedPrivacyGlassMat);
  alpineGlassMesh.name = 'courtyard.landRoverDefender.alpineLight';
  alpineLightGroup.add(alpineGlassMesh);

  // Panoramic Sliding Glass Sunroof (`x = -0.35m..+1.35m, y = 1.965m`)
  const sunroofFrameGeo = createConformalDefenderPatchGeometry(
    -0.37,
    1.37,
    () => 0.0,
    () => 0.225,
    24,
    16,
    0.004,
    0.002,
    false
  );
  const sunroofFrameMesh = new THREE.Mesh(sunroofFrameGeo, mats.narvikGlossBlackMat);
  sunroofFrameMesh.name = 'courtyard.landRoverDefender.sunroof.frame';
  alpineLightGroup.add(sunroofFrameMesh);

  const sunroofGlassGeo = createConformalDefenderPatchGeometry(
    -0.35,
    1.35,
    () => 0.0,
    () => 0.212,
    24,
    16,
    0.0058,
    0.002,
    false
  );
  const sunroofGlassMesh = new THREE.Mesh(sunroofGlassGeo, mats.tintedPrivacyGlassMat);
  sunroofGlassMesh.name = 'courtyard.landRoverDefender.sunroof';
  alpineLightGroup.add(sunroofGlassMesh);

  // Longitudinal Expedition Narvik Black Roof Rails (`x = -0.32m..+2.14m, y = 1.985m, z = ±0.64m`)
  for (const sideZ of [-1, 1] as const) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.026, 0.036),
      mats.narvikGlossBlackMat
    );
    railBar.name = 'courtyard.landRoverDefender.roofRail';
    railBar.position.set(0.91, 1.984, sideZ * 0.635);
    railBar.castShadow = true;
    alpineLightGroup.add(railBar);

    for (const stanchionX of [-0.26, 0.88, 2.06] as const) {
      const stanchion = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.032, 0.042),
        mats.satinAnthraciteMat
      );
      stanchion.name = 'courtyard.landRoverDefender.roofRail.stanchion';
      stanchion.position.set(stanchionX, 1.964, sideZ * 0.635);
      alpineLightGroup.add(stanchion);
    }
  }

  // Roof-Mounted Shark-Fin / ClearSight Rear-View Camera Antenna Pod (`x = +1.96m, y = 1.995m, z = 0`)
  const clearSightFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.058, 0.044),
    mats.narvikGlossBlackMat
  );
  clearSightFin.name = 'courtyard.landRoverDefender.clearSightAntennaPod';
  clearSightFin.position.set(1.96, 1.982, 0);
  alpineLightGroup.add(clearSightFin);

  // C. Exterior Side-Mounted Gear Carrier Box (`courtyard.landRoverDefender.sideGearCarrier`)
  //    on the right/rear quarter (`x = +1.15m..+1.78m, y = 1.32m..1.76m, z = +0.93m`) in aerodynamic
  //    gloss Santorini Black with Land Rover oval badge & latch.
  const gearCarrierGroup = new THREE.Group();
  gearCarrierGroup.name = 'courtyard.landRoverDefender.sideGearCarrier';
  gearCarrierGroup.position.set(1.465, 1.54, 0.93);
  defenderGroup.add(gearCarrierGroup);

  // Mounting bracket rails connecting the carrier box to the right C-pillar / rear quarter glass
  const carrierBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.36, 0.065),
    mats.satinAnthraciteMat
  );
  carrierBracket.name = 'courtyard.landRoverDefender.sideGearCarrier.mountingBracket';
  carrierBracket.position.set(0, 0, -0.055);
  gearCarrierGroup.add(carrierBracket);

  // Sculpted aerodynamic Santorini Black outer shell (`0.63m x 0.44m x 0.14m`) with bevelled outer lid
  const carrierMainBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.63, 0.44, 0.115),
    mats.santoriniBlackBodyMat
  );
  carrierMainBox.name = 'courtyard.landRoverDefender.sideGearCarrier';
  carrierMainBox.castShadow = true;
  carrierMainBox.receiveShadow = true;
  gearCarrierGroup.add(carrierMainBox);

  const carrierOuterLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.39, 0.042),
    mats.narvikGlossBlackMat
  );
  carrierOuterLid.name = 'courtyard.landRoverDefender.sideGearCarrier.outerLid';
  carrierOuterLid.position.set(0, 0, 0.058);
  carrierOuterLid.castShadow = true;
  gearCarrierGroup.add(carrierOuterLid);

  // Horizontal aerodynamic speed-rib & Shadow Atlas latch + Land Rover oval badge on carrier lid
  const carrierSpeedRib = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.032, 0.014),
    mats.satinAnthraciteMat
  );
  carrierSpeedRib.name = 'courtyard.landRoverDefender.sideGearCarrier.speedRib';
  carrierSpeedRib.position.set(0, -0.04, 0.082);
  gearCarrierGroup.add(carrierSpeedRib);

  const carrierLatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.095, 0.016),
    mats.satinAnthraciteMat
  );
  carrierLatch.name = 'courtyard.landRoverDefender.sideGearCarrier.latch';
  carrierLatch.position.set(-0.21, 0.02, 0.081);
  gearCarrierGroup.add(carrierLatch);

  const carrierBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.068, 0.034),
    mats.landRoverBadgeMat
  );
  carrierBadge.name = 'courtyard.landRoverDefender.sideGearCarrier.badge';
  carrierBadge.position.set(0.16, -0.10, 0.082);
  tagHighLodDetail(carrierBadge);
  gearCarrierGroup.add(carrierBadge);

  // D. Raised Roof-Height Safari Snorkel / Raised Air Intake (`courtyard.landRoverDefender.raisedAirIntake`)
  //    on the left A-pillar (`x = -0.92m, y = 1.26m..1.94m, z = -0.92m`).
  const snorkelGroup = new THREE.Group();
  snorkelGroup.name = 'courtyard.landRoverDefender.raisedAirIntake';
  defenderGroup.add(snorkelGroup);

  // Lower fender intake plenum box mounted cleanly to left fender vent (`x = -0.98m, y = 1.18m, z = -0.965m`)
  const snorkelBasePlenum = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.11, 0.056),
    mats.satinAnthraciteMat
  );
  snorkelBasePlenum.name = 'courtyard.landRoverDefender.raisedAirIntake';
  snorkelBasePlenum.position.set(-0.98, 1.19, -0.965);
  snorkelBasePlenum.castShadow = true;
  snorkelGroup.add(snorkelBasePlenum);

  // Swept 3D tubular riser hugging the left A-pillar (`x = -0.92m..-0.48m, y = 1.24m..1.94m, z = -0.94m..-0.79m`)
  const snorkelCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.96, 1.22, -0.965),
    new THREE.Vector3(-0.91, 1.32, -0.945),
    new THREE.Vector3(-0.76, 1.58, -0.885),
    new THREE.Vector3(-0.56, 1.86, -0.815),
    new THREE.Vector3(-0.48, 1.94, -0.795),
  ]);
  const snorkelRiserGeo = new THREE.TubeGeometry(snorkelCurve, 24, 0.034, 12, false);
  snorkelRiserGeo.computeBoundingSphere();
  const snorkelRiser = new THREE.Mesh(snorkelRiserGeo, mats.narvikGlossBlackMat);
  snorkelRiser.name = 'courtyard.landRoverDefender.raisedAirIntake';
  snorkelRiser.scale.set(1.15, 1.0, 0.78);
  snorkelRiser.castShadow = true;
  snorkelGroup.add(snorkelRiser);

  // Forward-facing roof-level ram-air intake head with slatted grille at `(-0.48m, 1.955m, -0.795m)`
  const snorkelHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.145, 0.072, 0.068),
    mats.narvikGlossBlackMat
  );
  snorkelHead.name = 'courtyard.landRoverDefender.raisedAirIntake.intakeHead';
  snorkelHead.position.set(-0.50, 1.955, -0.795);
  snorkelHead.castShadow = true;
  snorkelGroup.add(snorkelHead);

  const snorkelGrilleFace = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.056, 0.054),
    mats.satinAnthraciteMat
  );
  snorkelGrilleFace.name = 'courtyard.landRoverDefender.raisedAirIntake.intakeGrille';
  snorkelGrilleFace.position.set(-0.574, 1.955, -0.795);
  snorkelGroup.add(snorkelGrilleFace);

  // E. Fender Side Vents behind the front wheel arches (`x = -0.98m, y = 0.96m..1.14m, z = ±0.97m`) with vertical black louvres
  for (const sideZ of [-1, 1] as const) {
    const fenderVentGroup = new THREE.Group();
    fenderVentGroup.name = 'courtyard.landRoverDefender.fenderSideVent';
    fenderVentGroup.position.set(-0.98, 1.05, sideZ * 0.965);
    defenderGroup.add(fenderVentGroup);

    const ventFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.185, 0.018),
      mats.satinAnthraciteMat
    );
    ventFrame.name = 'courtyard.landRoverDefender.fenderSideVent.frame';
    fenderVentGroup.add(ventFrame);

    for (const lx of [-0.045, 0.0, 0.045] as const) {
      const louvre = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.15, 0.024),
        mats.narvikGlossBlackMat
      );
      louvre.name = 'courtyard.landRoverDefender.fenderSideVent.louvre';
      louvre.position.set(lx, 0, sideZ * 0.003);
      louvre.rotation.y = sideZ * 0.25;
      fenderVentGroup.add(louvre);
    }
  }
}

/**
 * Builds the L663 front fascia, multi-slot Narvik Black front grille, DEFENDER bonnet lettering,
 * Matrix LED semicircular "Halo" headlights, and lower front bumper with Shadow Atlas skid pan.
 */
export function buildDefender110FrontFasciaAndHeadlights(
  defenderGroup: THREE.Group,
  mats: Defender110Materials
): void {
  // A. Multi-Slot Narvik Black Front Grille (`courtyard.landRoverDefender.frontGrille`)
  const frontGrilleGroup = new THREE.Group();
  frontGrilleGroup.name = 'courtyard.landRoverDefender.frontGrille';
  defenderGroup.add(frontGrilleGroup);

  // Recessed dark radiator cavity behind grille (`x = -2.355m, y = 0.98m, z = -0.48m..+0.48m`)
  const grilleCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.23, 0.96),
    mats.narvikGlossBlackMat
  );
  grilleCavity.name = 'courtyard.landRoverDefender.frontGrille';
  grilleCavity.position.set(-2.355, 0.985, 0);
  frontGrilleGroup.add(grilleCavity);

  // Plan-curved horizontal intake bars & oval slot apertures across the L663 grille
  for (const barY of [1.085, 1.02, 0.955, 0.89] as const) {
    const barPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = (i / 20) * 2 - 1;
      const z = u * 0.48;
      const x = -2.372 + getPlanWrapShiftX(-2.36, z);
      barPts.push(new THREE.Vector3(x, barY, z));
    }
    const barCurve = new THREE.CatmullRomCurve3(barPts);
    const barGeo = new THREE.TubeGeometry(barCurve, 24, 0.014, 8, false);
    barGeo.computeBoundingSphere();
    const barMesh = new THREE.Mesh(
      barGeo,
      barY === 1.02 ? mats.satinAnthraciteMat : mats.narvikGlossBlackMat
    );
    barMesh.name = 'courtyard.landRoverDefender.frontGrille.crossBar';
    barMesh.scale.set(1.2, 0.75, 1.0);
    frontGrilleGroup.add(barMesh);
  }

  // Vertical grille dividers creating the signature Defender rectangular intake slots
  for (const divZ of [-0.47, -0.24, 0.0, 0.24, 0.47] as const) {
    const dx = -2.368 + getPlanWrapShiftX(-2.36, divZ);
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.21, 0.018),
      mats.narvikGlossBlackMat
    );
    divider.name = 'courtyard.landRoverDefender.frontGrille.slotDivider';
    divider.position.set(dx, 0.985, divZ);
    frontGrilleGroup.add(divider);
  }

  // Green/Black Land Rover Oval Badge on right side of front grille (`x = -2.378m, y = 1.015m, z = -0.34m`)
  const frontOvalBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.044),
    mats.landRoverBadgeMat
  );
  frontOvalBadge.name = 'courtyard.landRoverDefender.frontGrille.ovalBadge';
  frontOvalBadge.position.set(-2.378 + getPlanWrapShiftX(-2.36, -0.34), 1.015, -0.34);
  frontOvalBadge.rotation.y = -Math.PI / 2 - 0.08;
  tagHighLodDetail(frontOvalBadge);
  frontGrilleGroup.add(frontOvalBadge);

  // Bold Satin Black `D E F E N D E R` Bonnet Edge Lettering (`CanvasTexture` at `x = -2.32m, y = 1.15m`)
  const bonnetLetteringPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.078),
    new THREE.MeshStandardMaterial({
      map: createDefenderBonnetLetteringTexture(),
      transparent: true,
      roughness: 0.28,
      metalness: 0.52,
    })
  );
  bonnetLetteringPlane.name = 'courtyard.landRoverDefender.bonnetLettering';
  bonnetLetteringPlane.position.set(-2.318, 1.148, 0);
  bonnetLetteringPlane.rotation.y = -Math.PI / 2;
  bonnetLetteringPlane.rotation.z = -0.38;
  tagHighLodDetail(bonnetLetteringPlane);
  frontGrilleGroup.add(bonnetLetteringPlane);

  // B. L663 Matrix LED Headlights (`courtyard.landRoverDefender.headlight`)
  //    at `(x = -2.33m, y = 0.98m, z = ±0.72m)`: recessed rectangular bevelled smoked housing
  //    containing the unmistakable glowing warm-white semicircular lower LED Halo ring +
  //    twin horizontal outer LED signature pips (`emissive: 0xf2f8ff, emissiveIntensity: 2.5`)
  //    and clear polycarbonate outer lens.
  for (const sideZ of [-1, 1] as const) {
    const hlGroup = new THREE.Group();
    hlGroup.name = 'courtyard.landRoverDefender.headlight';
    const hz = sideZ * 0.72;
    const hx = -2.335 + getPlanWrapShiftX(-2.35, hz);
    hlGroup.position.set(hx, 0.985, hz);
    hlGroup.rotation.y = sideZ * 0.22; // Follow plan-view bevel of front fascia corner
    defenderGroup.add(hlGroup);

    // Bevelled rectangular smoked housing box (`0.08m deep x 0.22m high x 0.34m wide`)
    const housingBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.215, 0.34),
      mats.narvikGlossBlackMat
    );
    housingBox.name = 'courtyard.landRoverDefender.headlight';
    hlGroup.add(housingBox);

    // Satin Anthracite inner projector bezel surround
    const innerBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.185, 0.31),
      mats.satinAnthraciteMat
    );
    innerBezel.name = 'courtyard.landRoverDefender.headlight.innerBezel';
    innerBezel.position.set(-0.008, 0, 0);
    hlGroup.add(innerBezel);

    // Central bi-LED projector lens sphere inside the halo ring
    const projectorDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 20, 16),
      mats.clearPolycarbonateLensMat
    );
    projectorDome.name = 'courtyard.landRoverDefender.headlight.projectorLens';
    projectorDome.scale.set(0.55, 1.0, 1.0);
    projectorDome.position.set(-0.028, 0.008, -sideZ * 0.025);
    hlGroup.add(projectorDome);

    // Unmistakable L663 Glowing Warm-White Semicircular Lower LED Halo Ring + Upper Cropped Brow Bar
    const haloSemiRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.0095, 14, 32, Math.PI * 1.18),
      mats.ledHaloWhiteMat
    );
    haloSemiRing.name = 'courtyard.landRoverDefender.headlight';
    haloSemiRing.rotation.y = -Math.PI / 2;
    haloSemiRing.rotation.x = Math.PI + 0.28; // Lower semicircle cradle (`U` shape)
    haloSemiRing.position.set(-0.038, 0.012, -sideZ * 0.025);
    hlGroup.add(haloSemiRing);

    const haloUpperChordBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.012, 0.135),
      mats.ledHaloWhiteMat
    );
    haloUpperChordBar.name = 'courtyard.landRoverDefender.headlight.haloBrowBar';
    haloUpperChordBar.position.set(-0.038, 0.042, -sideZ * 0.025);
    hlGroup.add(haloUpperChordBar);

    // Twin Horizontal Outer LED Signature Pips flanking the halo ring
    for (const pipZOff of [0.078, 0.125] as const) {
      const ledPip = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.018, 0.034),
        mats.ledHaloWhiteMat
      );
      ledPip.name = 'courtyard.landRoverDefender.headlight.signaturePip';
      ledPip.position.set(-0.038, 0.005, sideZ * pipZOff);
      hlGroup.add(ledPip);
    }

    // Clear polycarbonate outer headlight lens cover
    const outerClearLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.205, 0.332),
      mats.clearPolycarbonateLensMat
    );
    outerClearLens.name = 'courtyard.landRoverDefender.headlight.outerLens';
    outerClearLens.position.set(-0.042, 0, 0);
    hlGroup.add(outerClearLens);
  }

  // C. Lower Front Bumper & Shadow Atlas Skid Pan (`courtyard.landRoverDefender.frontBumper`)
  const frontBumperGroup = new THREE.Group();
  frontBumperGroup.name = 'courtyard.landRoverDefender.frontBumper';
  defenderGroup.add(frontBumperGroup);

  // Plan-curved Shadow Atlas / Satin Anthracite lower front bumper crossbeam (`y = 0.52m..0.82m`)
  const fBumperPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1;
    const z = u * 0.90;
    const x = -2.375 + getPlanWrapShiftX(-2.37, z);
    fBumperPts.push(new THREE.Vector3(x, 0.64, z));
  }
  const fBumperCurve = new THREE.CatmullRomCurve3(fBumperPts);
  const fBumperGeo = new THREE.TubeGeometry(fBumperCurve, 32, 0.13, 12, false);
  fBumperGeo.computeBoundingSphere();
  const fBumperBeam = new THREE.Mesh(fBumperGeo, mats.satinAnthraciteMat);
  fBumperBeam.name = 'courtyard.landRoverDefender.frontBumper';
  fBumperBeam.scale.set(0.55, 1.15, 1.0);
  fBumperBeam.position.set(-2.375 * 0.45, 0, 0);
  fBumperBeam.castShadow = true;
  frontBumperGroup.add(fBumperBeam);

  // Sculpted Shadow Atlas Front Skid Pan (`x = -2.39m..-2.05m, y = 0.29m..0.52m, z = -0.58m..+0.58m`)
  // with 4 recessed bash-plate slots
  const frontSkidPan = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.24, 1.14),
    mats.satinAnthraciteMat
  );
  frontSkidPan.name = 'courtyard.landRoverDefender.frontBumper';
  frontSkidPan.position.set(-2.27, 0.40, 0);
  frontSkidPan.rotation.z = 0.52;
  frontSkidPan.castShadow = true;
  frontBumperGroup.add(frontSkidPan);

  for (const slotZ of [-0.36, -0.12, 0.12, 0.36] as const) {
    const bashSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.045, 0.12),
      mats.narvikGlossBlackMat
    );
    bashSlot.name = 'courtyard.landRoverDefender.frontBumper.skidBashSlot';
    bashSlot.position.set(-2.345, 0.39, slotZ);
    bashSlot.rotation.z = 0.52;
    frontBumperGroup.add(bashSlot);
  }

  // Twin Recessed Front LED Fog Lamps (`z = ±0.74m, y = 0.56m`) + Front Radar Module + Tow Recovery Eyes
  for (const sideZ of [-1, 1] as const) {
    const fz = sideZ * 0.74;
    const fx = -2.37 + getPlanWrapShiftX(-2.37, fz);
    const fogHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.068, 0.145),
      mats.narvikGlossBlackMat
    );
    fogHousing.name = 'courtyard.landRoverDefender.frontBumper.fogHousing';
    fogHousing.position.set(fx - 0.01, 0.56, fz);
    fogHousing.rotation.y = sideZ * 0.24;
    frontBumperGroup.add(fogHousing);

    const fogLampLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.028, 0.088),
      mats.ledHaloWhiteMat
    );
    fogLampLed.name = 'courtyard.landRoverDefender.frontBumper.fogLampLed';
    fogLampLed.position.set(fx - 0.026, 0.56, fz);
    fogLampLed.rotation.y = sideZ * 0.24;
    frontBumperGroup.add(fogLampLed);

    // Heavy-duty front recovery tow eye loop (`z = ±0.46m, y = 0.33m`)
    const towEye = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.009, 10, 20),
      mats.narvikGlossBlackMat
    );
    towEye.name = 'courtyard.landRoverDefender.frontBumper.towRecoveryEye';
    towEye.position.set(-2.375, 0.33, sideZ * 0.46);
    frontBumperGroup.add(towEye);
  }

  // Central ACC Front Radar Module (`x = -2.392m, y = 0.49m, z = 0`)
  const frontRadarModule = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.085, 0.14),
    mats.narvikGlossBlackMat
  );
  frontRadarModule.name = 'courtyard.landRoverDefender.frontBumper.radarSensor';
  frontRadarModule.position.set(-2.392, 0.49, 0);
  frontBumperGroup.add(frontRadarModule);

  // White UK Front Registration Plate (`"DEF 110X"`, `x = -2.402m, y = 0.64m, z = 0`)
  const frontUkPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.095, 0.44),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(false),
      roughness: 0.24,
    })
  );
  frontUkPlate.name = 'courtyard.landRoverDefender.frontNumberPlate';
  frontUkPlate.position.set(-2.402, 0.64, 0);
  tagHighLodDetail(frontUkPlate);
  frontBumperGroup.add(frontUkPlate);
}

/**
 * Builds the vertical Kamm tailgate, exterior hinges, rear UK registration plate,
 * Carpathian V8 badge, recessed smoked quad-square LED taillights, high-mounted third
 * brake light, rear Shadow Atlas skid diffuser, and quad V8 exhaust tailpipes.
 */
export function buildDefender110TailgateTaillightsAndExhaust(
  defenderGroup: THREE.Group,
  mats: Defender110Materials
): void {
  const rearTailgateGroup = new THREE.Group();
  rearTailgateGroup.name = 'courtyard.landRoverDefender.tailgate';
  defenderGroup.add(rearTailgateGroup);

  // Exposed Heavy-Duty Right-Side Exterior Tailgate Hinges (`x = +2.362m, z = +0.66m, y = 0.88m & 1.18m`)
  for (const hingeY of [0.88, 1.18] as const) {
    const hingeBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.056, 0.145),
      mats.narvikGlossBlackMat
    );
    hingeBlock.name = 'courtyard.landRoverDefender.tailgate.hingeBlock';
    hingeBlock.position.set(2.358, hingeY, 0.64);
    rearTailgateGroup.add(hingeBlock);

    const hingePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.072, 12),
      mats.satinAnthraciteMat
    );
    hingePin.name = 'courtyard.landRoverDefender.tailgate.hingePin';
    hingePin.position.set(2.374, hingeY, 0.70);
    rearTailgateGroup.add(hingePin);
  }

  // Left-Side Tailgate Handle, Recessed Yellow UK Rear Number Plate (`"DEF 110X"`) & Red/Black `V8` Badge
  const tailgateGrabHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.038, 0.165),
    mats.narvikGlossBlackMat
  );
  tailgateGrabHandle.name = 'courtyard.landRoverDefender.tailgate.grabHandle';
  tailgateGrabHandle.position.set(2.368, 0.96, -0.56);
  rearTailgateGroup.add(tailgateGrabHandle);

  const rearPlatePlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.135, 0.48),
    mats.narvikGlossBlackMat
  );
  rearPlatePlinth.name = 'courtyard.landRoverDefender.tailgate.numberPlatePlinth';
  rearPlatePlinth.position.set(2.362, 0.75, -0.44);
  rearTailgateGroup.add(rearPlatePlinth);

  const rearUkPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.095, 0.44),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(true),
      roughness: 0.24,
    })
  );
  rearUkPlate.name = 'courtyard.landRoverDefender.rearNumberPlate';
  rearUkPlate.position.set(2.374, 0.75, -0.44);
  tagHighLodDetail(rearUkPlate);
  rearTailgateGroup.add(rearUkPlate);

  // Carpathian Edition Red-Accented `V8` Rear Tailgate Badge (`x = +2.368m, y = 0.60m, z = -0.58m`)
  const v8BadgeBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.036, 0.082),
    mats.ledCrimsonRedMat
  );
  v8BadgeBack.name = 'courtyard.landRoverDefender.tailgate.v8BadgeBacking';
  v8BadgeBack.position.set(2.365, 0.60, -0.58);
  tagHighLodDetail(v8BadgeBack);
  rearTailgateGroup.add(v8BadgeBack);

  const v8BadgeFace = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.028, 0.072),
    mats.narvikGlossBlackMat
  );
  v8BadgeFace.name = 'courtyard.landRoverDefender.tailgate.v8Badge';
  v8BadgeFace.position.set(2.367, 0.60, -0.58);
  tagHighLodDetail(v8BadgeFace);
  rearTailgateGroup.add(v8BadgeFace);

  // C. Signature L663 Recessed Smoked Quad-Square LED Taillights (`courtyard.landRoverDefender.taillight`)
  //    (`x = +2.35m, y = 0.88m..1.22m, z = ±0.83m`): stacked twin glowing crimson-red square LED ring cubes
  //    (`emissive: 0xff161c, emissiveIntensity: 2.4`) + outer vertical indicator pips per side.
  for (const sideZ of [-1, 1] as const) {
    const tlGroup = new THREE.Group();
    tlGroup.name = 'courtyard.landRoverDefender.taillight';
    const tz = sideZ * 0.83;
    const tx = 2.345 + getPlanWrapShiftX(2.35, tz);
    tlGroup.position.set(tx, 1.05, tz);
    tlGroup.rotation.y = -sideZ * 0.16;
    defenderGroup.add(tlGroup);

    // Recessed Narvik Black vertical taillight bezel pocket (`y = 0.88m..1.22m`, height `0.34m`)
    const bezelPocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.35, 0.165),
      mats.narvikGlossBlackMat
    );
    bezelPocket.name = 'courtyard.landRoverDefender.taillight';
    tlGroup.add(bezelPocket);

    // Stacked Twin Glowing Crimson-Red Square LED Ring Cubes (`yOff = -0.078m` lower cube, `+0.078m` upper cube)
    for (const yCubeOff of [-0.078, 0.078] as const) {
      const cubeGroup = new THREE.Group();
      cubeGroup.name = 'courtyard.landRoverDefender.taillight.quadCube';
      cubeGroup.position.set(0.018, yCubeOff, -sideZ * 0.018);
      tlGroup.add(cubeGroup);

      // 4 glowing red bars forming the rounded-square L663 3D taillight ring
      const ringHalf = 0.036;
      const barThick = 0.011;
      for (const barY of [-ringHalf, ringHalf] as const) {
        const hBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, barThick, ringHalf * 2 + barThick),
          mats.ledCrimsonRedMat
        );
        hBar.name = 'courtyard.landRoverDefender.taillight';
        hBar.position.set(0, barY, 0);
        cubeGroup.add(hBar);
      }
      for (const barZ of [-ringHalf, ringHalf] as const) {
        const vBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, ringHalf * 2 - barThick, barThick),
          mats.ledCrimsonRedMat
        );
        vBar.name = 'courtyard.landRoverDefender.taillight';
        vBar.position.set(0, 0, barZ);
        cubeGroup.add(vBar);
      }

      // Smoked dark inner cube core + flush smoked polycarbonate lens
      const innerCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.052, 0.052),
        mats.narvikGlossBlackMat
      );
      innerCore.name = 'courtyard.landRoverDefender.taillight.cubeCore';
      cubeGroup.add(innerCore);

      const cubeLens = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.092, 0.092),
        mats.smokedLensMat
      );
      cubeLens.name = 'courtyard.landRoverDefender.taillight.smokedLens';
      cubeLens.position.set(0.01, 0, 0);
      cubeGroup.add(cubeLens);
    }

    // Outer Vertical Indicator & Reverse LED Pips flanking the quad-square taillight cubes
    for (const pipYOff of [-0.078, 0.0, 0.078] as const) {
      const pipMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.044, 0.022),
        pipYOff === 0.0 ? mats.ledAmberPipMat : mats.ledCrimsonRedMat
      );
      pipMesh.name = 'courtyard.landRoverDefender.taillight.indicatorPip';
      pipMesh.position.set(0.018, pipYOff, sideZ * 0.056);
      tlGroup.add(pipMesh);
    }
  }

  // High-Mounted Third LED Brake Light Strip above rear tailgate glass (`x = +2.29m, y = 1.91m, z = 0`)
  const chmslStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.018, 0.42),
    mats.ledCrimsonRedMat
  );
  chmslStrip.name = 'courtyard.landRoverDefender.highMountStopLamp';
  chmslStrip.position.set(2.295, 1.912, 0);
  defenderGroup.add(chmslStrip);

  // D. Defender V8 Quad Exhaust Tailpipes (`courtyard.landRoverDefender.exhaust`)
  //    flanking the rear Shadow Atlas skid diffuser (`x = +2.32m, y = 0.34m, z = ±0.58m`)
  //    plus heavy-duty rear recovery tow loop.
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'courtyard.landRoverDefender.exhaust';
  defenderGroup.add(exhaustGroup);

  // Rear Shadow Atlas Bumper & Skid Diffuser (`x = +2.33m, y = 0.34m..0.54m, z = -0.88m..+0.88m`)
  const rBumperPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1;
    const z = u * 0.88;
    const x = 2.345 + getPlanWrapShiftX(2.35, z);
    rBumperPts.push(new THREE.Vector3(x, 0.47, z));
  }
  const rBumperCurve = new THREE.CatmullRomCurve3(rBumperPts);
  const rBumperGeo = new THREE.TubeGeometry(rBumperCurve, 32, 0.105, 12, false);
  rBumperGeo.computeBoundingSphere();
  const rBumperBeam = new THREE.Mesh(rBumperGeo, mats.satinAnthraciteMat);
  rBumperBeam.name = 'courtyard.landRoverDefender.exhaust.rearBumperBeam';
  rBumperBeam.scale.set(0.55, 1.1, 1.0);
  rBumperBeam.position.set(2.345 * 0.45, 0, 0);
  rBumperBeam.castShadow = true;
  exhaustGroup.add(rBumperBeam);

  const rearSkidDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.16, 1.06),
    mats.satinAnthraciteMat
  );
  rearSkidDiffuser.name = 'courtyard.landRoverDefender.exhaust.rearSkidDiffuser';
  rearSkidDiffuser.position.set(2.28, 0.36, 0);
  rearSkidDiffuser.rotation.z = -0.35;
  exhaustGroup.add(rearSkidDiffuser);

  // Heavy-Duty Rear Recovery Tow Loop (`x = +2.36m, y = 0.35m, z = 0`)
  const rearTowMount = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.065, 0.14),
    mats.narvikGlossBlackMat
  );
  rearTowMount.name = 'courtyard.landRoverDefender.exhaust.rearTowMount';
  rearTowMount.position.set(2.345, 0.36, 0);
  exhaustGroup.add(rearTowMount);

  const rearTowLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.011, 12, 22),
    mats.narvikGlossBlackMat
  );
  rearTowLoop.name = 'courtyard.landRoverDefender.exhaust.rearTowLoop';
  rearTowLoop.position.set(2.382, 0.345, 0);
  exhaustGroup.add(rearTowLoop);

  // Defender V8 Quad Exhaust Tailpipes (`z = ±0.54m & ±0.64m` centered at `x = +2.32m, y = 0.34m, z = ±0.58m`)
  for (const sideZ of [-1, 1] as const) {
    for (const pipeZ of [0.535, 0.625] as const) {
      const pz = sideZ * pipeZ;
      const px = 2.32 + getPlanWrapShiftX(2.34, pz);
      const outerTip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.04, 0.12, 24, 1, true),
        mats.satinAnthraciteMat
      );
      outerTip.name = 'courtyard.landRoverDefender.exhaust';
      outerTip.rotation.z = Math.PI / 2 - 0.08;
      outerTip.position.set(px, 0.34, pz);
      exhaustGroup.add(outerTip);

      const innerCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.095, 20),
        mats.narvikGlossBlackMat
      );
      innerCore.name = 'courtyard.landRoverDefender.exhaust.tailpipeCore';
      innerCore.rotation.z = Math.PI / 2 - 0.08;
      innerCore.position.set(px - 0.008, 0.34, pz);
      exhaustGroup.add(innerCore);
    }
  }
}
