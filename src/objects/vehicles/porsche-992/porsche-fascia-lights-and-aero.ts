import * as THREE from 'three';
import {
  CENTERLINE_Y_KNOTS,
  createConformalBodyPatchGeometry,
  createConformalEllipticalHeadlightPatch,
  createUkNumberPlateTexture,
  evalSpline,
  getPlanWrapShiftX,
  lerp,
  type Porsche992Materials,
  sampleMonocoqueHalfProfile,
  smoothstep,
} from './porsche-materials-and-body.ts';

function tagHighLodDetail(obj: THREE.Object3D): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = 18;
}

/**
 * Builds the 992.2 facelift front fascia, plan-curved active vertical cooling louvres,
 * PAA front chin splitter, front UK registration plate, Stuttgart hood crest, and
 * conformal 4-point HD-Matrix LED headlights.
 */
export function buildPorsche992FrontFasciaAndHeadlights(
  carGroup: THREE.Group,
  mats: Porsche992Materials
): void {
  // Deployed PAA Front Chin Splitter (`outbuildings.garage.porsche992TurboS.frontSpoiler`)
  // Follows the exact plan-view wrap curve `getPlanWrapShiftX` so it never sticks out at the corners!
  const splitterPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1; // -1 .. +1
    const z = u * 0.78;
    const x = -2.245 + getPlanWrapShiftX(-2.24, z);
    splitterPts.push(new THREE.Vector3(x, 0.132, z));
  }
  const splitterCurve = new THREE.CatmullRomCurve3(splitterPts);
  const splitterGeo = new THREE.TubeGeometry(splitterCurve, 32, 0.018, 10, false);
  splitterGeo.computeBoundingSphere();
  const frontSplitter = new THREE.Mesh(splitterGeo, mats.satinBlackAeroMat);
  frontSplitter.scale.set(1.3, 0.65, 1.0);
  frontSplitter.position.set(2.245 * 0.3, 0.132 * 0.35, 0);
  frontSplitter.name = 'outbuildings.garage.porsche992TurboS.frontSpoiler';
  carGroup.add(frontSplitter);

  // 992.2 Front Bumper Intake Aperture & 5 Vertical Active Cooling Flaps per side (`outbuildings.garage.porsche992TurboS.frontActiveLouvres`)
  // Curved along `getPlanWrapShiftX(-2.22, z)` so every intake pod and vertical flap sits flush inside the front bumper nose!
  const frontIntakesGroup = new THREE.Group();
  frontIntakesGroup.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
  carGroup.add(frontIntakesGroup);

  const frontGrillePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * 2 - 1;
    const z = u * 0.68;
    const x = -2.225 + getPlanWrapShiftX(-2.22, z);
    frontGrillePts.push(new THREE.Vector3(x, 0.215, z));
  }
  const frontGrilleCurve = new THREE.CatmullRomCurve3(frontGrillePts);
  const frontIntakeRecessGeo = new THREE.TubeGeometry(frontGrilleCurve, 28, 0.055, 10, false);
  frontIntakeRecessGeo.computeBoundingSphere();
  const frontIntakeRecess = new THREE.Mesh(frontIntakeRecessGeo, mats.glossBlackTrimMat);
  frontIntakeRecess.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres.intakeRecess';
  frontIntakeRecess.scale.set(0.45, 1.0, 1.0);
  frontIntakeRecess.position.set(-2.225 * 0.55, 0, 0);
  frontIntakesGroup.add(frontIntakeRecess);

  for (const sideZ of [-1, 1] as const) {
    // 5 signature 992.2 vertical active aerodynamic cooling flaps per outer intake, following the curved bumper face
    for (let f = 0; f < 5; f++) {
      const fz = sideZ * (0.34 + f * 0.068);
      const fx = -2.23 + getPlanWrapShiftX(-2.22, fz);
      const flap = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.105, 0.01),
        mats.turboniteMat
      );
      flap.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
      flap.position.set(fx, 0.215, fz);
      flap.rotation.y = -sideZ * 0.26;
      frontIntakesGroup.add(flap);
    }
  }

  // Front UK Number Plate (`992 TBS` on white plate, flush on the front nose at `x = -2.242m, y = 0.305m`)
  const frontPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.082, 0.38),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(false),
      roughness: 0.25,
    })
  );
  frontPlate.name = 'outbuildings.garage.porsche992TurboS.frontNumberPlate';
  frontPlate.position.set(-2.242, 0.305, 0);
  tagHighLodDetail(frontPlate);
  carGroup.add(frontPlate);

  // Stuttgart Porsche Crest on Front Hood Nose (`x = -2.02m, y = 0.548m, z = 0`)
  const hoodCrest = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.062),
    mats.crestMat
  );
  hoodCrest.name = 'outbuildings.garage.porsche992TurboS.hoodCrest';
  hoodCrest.position.set(-2.02, 0.548, 0);
  hoodCrest.rotation.y = -Math.PI / 2;
  hoodCrest.rotation.z = -1.28;
  tagHighLodDetail(hoodCrest);
  carGroup.add(hoodCrest);

  // Iconic Oval 992.2 HD-Matrix 4-Point LED Headlights (`outbuildings.garage.porsche992TurboS.headlight`)
  // Built with `createConformalEllipticalHeadlightPatch` directly on the front fender pontoon (`x = -1.88m, v = 0.49`)
  // so they conform 100% flush to the 3D fender surface and NEVER stick out!
  for (const sideZ of [-1, 1] as const) {
    const hlGroup = new THREE.Group();
    hlGroup.name = 'outbuildings.garage.porsche992TurboS.headlight';
    carGroup.add(hlGroup);

    // 1. Dark gunmetal conformal elliptical housing bezel
    const bezelGeo = createConformalEllipticalHeadlightPatch(-1.88, 0.49, 0.185, 0.095, 0.0025, sideZ);
    const bezelMesh = new THREE.Mesh(bezelGeo, mats.glossBlackTrimMat);
    bezelMesh.name = 'outbuildings.garage.porsche992TurboS.headlight';
    hlGroup.add(bezelMesh);

    // 2. Inner Turbonite reflector bowl patch
    const innerGeo = createConformalEllipticalHeadlightPatch(-1.88, 0.49, 0.155, 0.078, 0.004, sideZ);
    const innerReflectorMesh = new THREE.Mesh(innerGeo, mats.turboniteMat);
    innerReflectorMesh.name = 'outbuildings.garage.porsche992TurboS.headlight.reflectorBowl';
    hlGroup.add(innerReflectorMesh);

    // 3. 4 Signature Porsche 4-Point Horizontal LED DRL Light Blades positioned on the exact pontoon surface
    const halfPtsMid = sampleMonocoqueHalfProfile(-1.88, 64);
    const basePt = halfPtsMid[Math.round(0.49 * 64)]!;
    const baseZ = sideZ * basePt[1];
    const baseX = -1.88 + getPlanWrapShiftX(-1.88, baseZ);
    const baseY = basePt[0];

    for (const [dx, dy, dz] of [
      [-0.045, -0.016, -0.036],
      [-0.045, -0.012, 0.036],
      [0.048, 0.022, -0.034],
      [0.048, 0.026, 0.034],
    ] as const) {
      const drlBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.01, 0.014),
        mats.ledDrlMat
      );
      drlBar.name = 'outbuildings.garage.porsche992TurboS.headlight.drlBlade';
      drlBar.position.set(baseX + dx, baseY + dy + 0.008, baseZ + sideZ * 0.008 + dz * sideZ);
      drlBar.rotation.z = 0.42;
      drlBar.rotation.y = -sideZ * 0.18;
      hlGroup.add(drlBar);
    }

    // 4. Flush conformal clear polycarbonate headlight lens cover
    const lensGeo = createConformalEllipticalHeadlightPatch(-1.88, 0.49, 0.175, 0.088, 0.0065, sideZ);
    const lensMesh = new THREE.Mesh(lensGeo, mats.clearLensMat);
    lensMesh.name = 'outbuildings.garage.porsche992TurboS.headlight.clearLens';
    hlGroup.add(lensMesh);
  }
}

/**
 * Builds the sculpted side mirrors, flush pop-out door handles, and 992.2 Turbo S
 * rear quarter side intercooler intake scoops.
 */
export function buildPorsche992SideMirrorsHandlesAndIntakes(
  carGroup: THREE.Group,
  mats: Porsche992Materials
): void {
  for (const sideZ of [-1, 1] as const) {
    // Aerodynamic door mirror (`x = -0.48m, y = 0.86m, z = ±0.86m`)
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = 'outbuildings.garage.porsche992TurboS.wingMirror';
    mirrorGroup.position.set(-0.48, 0.855, sideZ * 0.855);
    carGroup.add(mirrorGroup);

    const mirrorStalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.042, 0.07),
      mats.satinBlackAeroMat
    );
    mirrorStalk.name = 'outbuildings.garage.porsche992TurboS.wingMirror.stalk';
    mirrorStalk.position.set(0, 0.014, sideZ * 0.028);
    mirrorStalk.rotation.x = sideZ * 0.36;
    mirrorGroup.add(mirrorStalk);

    const mirrorCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 18, 14),
      mats.oceanBlueBodyMat
    );
    mirrorCap.name = 'outbuildings.garage.porsche992TurboS.wingMirror.cap';
    mirrorCap.scale.set(1.42, 0.68, 1.12);
    mirrorCap.position.set(0.02, 0.036, sideZ * 0.072);
    mirrorGroup.add(mirrorCap);

    // Flush pop-out door handle (`x = +0.14m, y = 0.78m, z = ±0.868m`)
    const doorHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.022, 0.014),
      mats.oceanBlueBodyMat
    );
    doorHandle.name = 'outbuildings.garage.porsche992TurboS.doorHandle';
    doorHandle.position.set(0.14, 0.785, sideZ * 0.868);
    carGroup.add(doorHandle);

    // 992.2 Turbo S Side Intercooler Air Intake Scoop (`outbuildings.garage.porsche992TurboS.sideIntake`)
    // Set flush into the leading flare of the widebody rear haunches (`x = +0.72m, y = 0.66m, z = ±0.905m`)
    const sideIntakeGroup = new THREE.Group();
    sideIntakeGroup.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    sideIntakeGroup.position.set(0.72, 0.665, sideZ * 0.905);
    sideIntakeGroup.rotation.y = sideZ * 0.19;
    carGroup.add(sideIntakeGroup);

    const intakePocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.155, 0.042),
      mats.glossBlackTrimMat
    );
    intakePocket.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    sideIntakeGroup.add(intakePocket);

    const intakeSplitterVane = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.014, 0.05),
      mats.oceanBlueBodyMat
    );
    intakeSplitterVane.name = 'outbuildings.garage.porsche992TurboS.sideIntake.splitterVane';
    intakeSplitterVane.position.set(0.01, 0, sideZ * 0.006);
    sideIntakeGroup.add(intakeSplitterVane);
  }
}

/**
 * Builds the conformal 992.2 rear engine decklid grille, sculpted active Turbo S rear wing
 * with side winglets, wrap-around recessed taillight visor, rear intercooler air-outlet vents,
 * conformal rear valance/diffuser, rear UK number plate, and oval titanium exhaust tailpipes.
 */
export function buildPorsche992RearAeroTaillightAndDiffuser(
  carGroup: THREE.Group,
  mats: Porsche992Materials
): void {
  // A. Conformal Slatted Rear Engine Decklid Grille (`outbuildings.garage.porsche992TurboS.rearDecklidGrille`, `x = 1.54..1.86m`)
  const decklidGrilleGroup = new THREE.Group();
  decklidGrilleGroup.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  carGroup.add(decklidGrilleGroup);

  const decklidBaseGeo = createConformalBodyPatchGeometry(
    1.54,
    1.86,
    () => 0.0,
    () => 0.255,
    12,
    18,
    0.0028,
    false
  );
  const decklidBaseMesh = new THREE.Mesh(decklidBaseGeo, mats.glossBlackTrimMat);
  decklidBaseMesh.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  decklidGrilleGroup.add(decklidBaseMesh);

  // 9 longitudinal vertical intake slats + twin subtle central third-brake-light strips conformal to the decklid slope
  for (let s = -5; s <= 5; s++) {
    if (s === 0) continue;
    const isBrakeStrip = Math.abs(s) === 1;
    const zPos = isBrakeStrip ? s * 0.022 : s * 0.068;
    const yStart = evalSpline(1.56, CENTERLINE_Y_KNOTS) + 0.008;
    const yEnd = evalSpline(1.84, CENTERLINE_Y_KNOTS) + 0.008;
    const slatLen = Math.hypot(1.84 - 1.56, yEnd - yStart);
    const slatPitch = Math.atan2(yEnd - yStart, 1.84 - 1.56);
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(slatLen, isBrakeStrip ? 0.012 : 0.01, isBrakeStrip ? 0.008 : 0.006),
      isBrakeStrip ? mats.crimsonTaillightMat : mats.turboniteMat
    );
    slat.name = isBrakeStrip
      ? 'outbuildings.garage.porsche992TurboS.rearDecklidGrille.thirdBrakeStrip'
      : 'outbuildings.garage.porsche992TurboS.rearDecklidGrille.slat';
    slat.position.set(1.70, (yStart + yEnd) * 0.5, zPos);
    slat.rotation.z = slatPitch;
    decklidGrilleGroup.add(slat);
  }

  // B. Authentic 992.2 Turbo S Active Rear Spoiler with Upturned Side Winglets (`outbuildings.garage.porsche992TurboS.rearWing`)
  //    Built as a custom 3D swept aerofoil BufferGeometry that conforms to the plan-view curve and transverse camber of the 911 tail!
  const rearWingGroup = new THREE.Group();
  rearWingGroup.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  carGroup.add(rearWingGroup);

  {
    const spanSegs = 36;
    const chordSegs = 12;
    const halfSpanZ = 0.66;
    const wingPositions: number[] = [];
    const wingIndices: number[] = [];

    // Airfoil cross-section `(uChord = 0..1` around upper and lower surfaces)
    for (let iz = 0; iz <= spanSegs; iz++) {
      const tz = (iz / spanSegs) * 2 - 1; // -1 .. +1 across width
      const z = tz * halfSpanZ;
      const absTz = Math.abs(tz);

      // Plan-view sweep & chord taper
      const chord = lerp(0.22, 0.165, absTz * absTz);
      const xLead = 1.86 + getPlanWrapShiftX(2.02, z) + absTz * absTz * 0.04;
      // Height follows the rear decklid camber (`0.848m` center, curving down at outer tips and kicking up at the outer 8% winglets!)
      const wingletKick = smoothstep(0.86, 1.0, absTz) * 0.026;
      const yBase = 0.848 - absTz * absTz * 0.028 + wingletKick;

      for (let ic = 0; ic <= chordSegs; ic++) {
        const theta = (ic / chordSegs) * Math.PI * 2;
        const cFrac = 0.5 - 0.5 * Math.cos(theta); // 0 at leading edge, 1 at trailing edge
        const isUpper = theta <= Math.PI;
        const thickness = 0.022 * Math.sin(Math.pow(cFrac, 0.65) * Math.PI);
        const camberPitch = -cFrac * 0.012 + Math.sin(cFrac * Math.PI) * 0.008;

        const px = xLead + cFrac * chord;
        const py = yBase + camberPitch + (isUpper ? thickness * 0.65 : -thickness * 0.35);
        wingPositions.push(px, py, z);
      }
    }

    const cStride = chordSegs + 1;
    for (let iz = 0; iz < spanSegs; iz++) {
      for (let ic = 0; ic < chordSegs; ic++) {
        const a = iz * cStride + ic;
        const b = (iz + 1) * cStride + ic;
        const c = (iz + 1) * cStride + ic + 1;
        const d = iz * cStride + ic + 1;
        wingIndices.push(a, c, b, a, d, c);
      }
    }

    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute(wingPositions, 3));
    wingGeo.setIndex(wingIndices);
    wingGeo.computeVertexNormals();
    wingGeo.computeBoundingSphere();

    const wingBladeMesh = new THREE.Mesh(wingGeo, mats.oceanBlueBodyMat);
    wingBladeMesh.name = 'outbuildings.garage.porsche992TurboS.rearWing';
    wingBladeMesh.castShadow = true;
    wingBladeMesh.receiveShadow = true;
    rearWingGroup.add(wingBladeMesh);

    // Short twin inboard hydraulic rams (`z = ±0.34m`) connecting the active wing to the decklid
    for (const sideZ of [-1, 1] as const) {
      const ram = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.018, 0.048, 12),
        mats.satinBlackAeroMat
      );
      ram.name = 'outbuildings.garage.porsche992TurboS.rearWing.hydraulicRam';
      ram.position.set(1.95, 0.818, sideZ * 0.34);
      rearWingGroup.add(ram);
    }
  }

  // C. Full-Width Wrap-Around Recessed 992.2 LED Taillight Visor & Lightbar (`outbuildings.garage.porsche992TurboS.taillightBar`)
  //    Wraps around the rear quarter panels (`z = ±0.79m, x = 1.98m`) to the center tail (`x = 2.155m, y = 0.722m`)!
  const taillightGroup = new THREE.Group();
  taillightGroup.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  carGroup.add(taillightGroup);

  const tailCurvePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const u = (i / 32) * 2 - 1;
    const z = u * 0.79;
    const x = 2.155 + getPlanWrapShiftX(2.15, z) - Math.pow(Math.abs(u), 2.2) * 0.045;
    const y = 0.722 - u * u * 0.012;
    tailCurvePts.push(new THREE.Vector3(x, y, z));
  }
  const tailCurve = new THREE.CatmullRomCurve3(tailCurvePts);

  // Dark recessed visor channel surround
  const tailVisorSlotGeo = new THREE.TubeGeometry(tailCurve, 36, 0.028, 12, false);
  tailVisorSlotGeo.computeBoundingSphere();
  const tailVisorSlot = new THREE.Mesh(tailVisorSlotGeo, mats.glossBlackTrimMat);
  tailVisorSlot.name = 'outbuildings.garage.porsche992TurboS.taillightBar.visorChannel';
  tailVisorSlot.scale.set(1.0, 0.78, 1.0);
  taillightGroup.add(tailVisorSlot);

  // Continuous glowing crimson-red 3D LED light strip
  const tailLedBladeGeo = new THREE.TubeGeometry(tailCurve, 40, 0.0095, 10, false);
  tailLedBladeGeo.computeBoundingSphere();
  const tailLedBlade = new THREE.Mesh(tailLedBladeGeo, mats.crimsonTaillightMat);
  tailLedBlade.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  tailLedBlade.position.set(0.016, 0.004, 0);
  taillightGroup.add(tailLedBlade);

  // Signature 992.2 outer 4-point LED rear brake light segments at left and right corners (`z = ±0.62..0.75m`)
  for (const sideZ of [-1, 1] as const) {
    for (const zOff of [0.63, 0.71] as const) {
      const bz = sideZ * zOff;
      const uNorm = bz / 0.79;
      const bx = 2.155 + getPlanWrapShiftX(2.15, bz) - Math.pow(Math.abs(uNorm), 2.2) * 0.045 + 0.018;
      const by = 0.722 - uNorm * uNorm * 0.012 - 0.012;
      const brakeSeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.008, 0.048),
        mats.crimsonTaillightMat
      );
      brakeSeg.name = 'outbuildings.garage.porsche992TurboS.taillightBar.brakeSegment';
      brakeSeg.position.set(bx, by, bz);
      brakeSeg.rotation.y = sideZ * 0.34;
      taillightGroup.add(brakeSeg);
    }
  }

  const tailSmokedLensGeo = new THREE.TubeGeometry(tailCurve, 36, 0.021, 12, false);
  tailSmokedLensGeo.computeBoundingSphere();
  const tailSmokedLens = new THREE.Mesh(tailSmokedLensGeo, mats.smokedRedLensMat);
  tailSmokedLens.name = 'outbuildings.garage.porsche992TurboS.taillightBar.smokedLens';
  tailSmokedLens.scale.set(1.0, 0.75, 1.0);
  tailSmokedLens.position.set(0.01, 0, 0);
  taillightGroup.add(tailSmokedLens);

  // D. 992.2 Turbo S Outer Rear Bumper Intercooler Air-Outlet Vents (`z = ±0.71m, y = 0.42m`)
  for (const sideZ of [-1, 1] as const) {
    const vz = sideZ * 0.705;
    const vx = 2.215 + getPlanWrapShiftX(2.22, vz);
    const outletGroup = new THREE.Group();
    outletGroup.name = 'outbuildings.garage.porsche992TurboS.rearIntercoolerOutlet';
    outletGroup.position.set(vx, 0.43, vz);
    outletGroup.rotation.y = sideZ * 0.42;
    carGroup.add(outletGroup);

    const outletRecess = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.135, 0.095),
      mats.glossBlackTrimMat
    );
    outletRecess.name = 'outbuildings.garage.porsche992TurboS.rearIntercoolerOutlet.recess';
    outletGroup.add(outletRecess);

    for (const vaneY of [-0.035, 0.0, 0.035] as const) {
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 0.008, 0.088),
        mats.satinBlackAeroMat
      );
      vane.name = 'outbuildings.garage.porsche992TurboS.rearIntercoolerOutlet.vane';
      vane.position.set(0.003, vaneY, 0);
      outletGroup.add(vane);
    }
  }

  // E. Conformal Lower Rear Valance / Venturi Diffuser, Recessed UK Number Plate & Quad/Oval Titanium Exhaust (`outbuildings.garage.porsche992TurboS.exhaust`)
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'outbuildings.garage.porsche992TurboS.exhaust';
  carGroup.add(exhaustGroup);

  // Build the satin-black lower rear bumper diffuser insert as a conformal curved surface sheet (`y = 0.195..0.415m, z = -0.64..+0.64m`)
  {
    const dCols = 28;
    const dRows = 8;
    const dPos: number[] = [];
    const dIdx: number[] = [];
    for (let r = 0; r <= dRows; r++) {
      const ty = r / dRows; // 0 at bottom (0.195m), 1 at top (0.415m)
      const py = lerp(0.195, 0.415, ty);
      const baseX = lerp(2.195, 2.242, Math.sin(ty * Math.PI * 0.65));
      // Taper width slightly toward top of valance trapezoid
      const halfW = lerp(0.65, 0.58, ty);
      for (let c = 0; c <= dCols; c++) {
        const tz = (c / dCols) * 2 - 1;
        const pz = tz * halfW;
        const px = baseX + getPlanWrapShiftX(2.22, pz) + 0.004;
        dPos.push(px, py, pz);
      }
    }
    const dStride = dCols + 1;
    for (let r = 0; r < dRows; r++) {
      for (let c = 0; c < dCols; c++) {
        const a = r * dStride + c;
        const b = (r + 1) * dStride + c;
        const d = (r + 1) * dStride + c + 1;
        const e = r * dStride + c + 1;
        dIdx.push(a, d, b, a, e, d);
      }
    }
    const valanceGeo = new THREE.BufferGeometry();
    valanceGeo.setAttribute('position', new THREE.Float32BufferAttribute(dPos, 3));
    valanceGeo.setIndex(dIdx);
    valanceGeo.computeVertexNormals();
    valanceGeo.computeBoundingSphere();
    const valanceMesh = new THREE.Mesh(valanceGeo, mats.satinBlackAeroMat);
    valanceMesh.name = 'outbuildings.garage.porsche992TurboS.exhaust.rearValanceDiffuser';
    exhaustGroup.add(valanceMesh);
  }

  // Rear UK Number Plate (`992 TBS` on yellow acrylic plate set cleanly into the central rear bumper recess at `y = 0.35m`)
  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.086, 0.39),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(true),
      roughness: 0.24,
    })
  );
  rearPlate.name = 'outbuildings.garage.porsche992TurboS.rearNumberPlate';
  rearPlate.position.set(2.246, 0.35, 0);
  tagHighLodDetail(rearPlate);
  carGroup.add(rearPlate);

  // 4 Vertical aerodynamic diffuser strakes tucked cleanly under the center of the rear valance
  for (const sz of [-0.26, -0.09, 0.09, 0.26] as const) {
    const sx = 2.205 + getPlanWrapShiftX(2.22, sz);
    const strake = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.095, 0.012),
      mats.satinBlackAeroMat
    );
    strake.name = 'outbuildings.garage.porsche992TurboS.exhaust.diffuserStrake';
    strake.position.set(sx, 0.225, sz);
    exhaustGroup.add(strake);
  }

  // Twin Large Oval Porsche Turbo S Titanium Sport Exhaust Tailpipes (`z = ±0.48m, y = 0.255m`)
  for (const sideZ of [-1, 1] as const) {
    const ez = sideZ * 0.48;
    const ex = 2.212 + getPlanWrapShiftX(2.22, ez);
    const tailpipeOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.054, 0.09, 24, 1, true),
      mats.titaniumExhaustMat
    );
    tailpipeOuter.name = 'outbuildings.garage.porsche992TurboS.exhaust';
    tailpipeOuter.rotation.z = Math.PI / 2;
    tailpipeOuter.rotation.y = sideZ * 0.18;
    tailpipeOuter.scale.set(0.74, 1.0, 1.38);
    tailpipeOuter.position.set(ex, 0.255, ez);
    exhaustGroup.add(tailpipeOuter);

    const tailpipeCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.046, 0.075, 20),
      mats.glossBlackTrimMat
    );
    tailpipeCore.name = 'outbuildings.garage.porsche992TurboS.exhaust.tailpipeCore';
    tailpipeCore.rotation.z = Math.PI / 2;
    tailpipeCore.rotation.y = sideZ * 0.18;
    tailpipeCore.scale.set(0.72, 1.0, 1.34);
    tailpipeCore.position.set(ex - 0.006, 0.255, ez);
    exhaustGroup.add(tailpipeCore);
  }
}
