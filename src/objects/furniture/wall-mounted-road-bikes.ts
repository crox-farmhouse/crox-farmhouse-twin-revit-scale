import * as THREE from 'three';

function enableShadowsRecursively(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      const r = child.geometry.boundingSphere?.radius ?? 0;
      child.castShadow = r >= 0.14;
      child.receiveShadow = true;
    }
  });
}

export function createCylinderStrut(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radiusTop: number,
  radiusBottom: number,
  material: THREE.Material,
  radialSegments = 14
): THREE.Mesh {
  const delta = new THREE.Vector3().subVectors(p2, p1);
  const length = delta.length();
  const geom = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    length,
    radialSegments
  );
  const mesh = new THREE.Mesh(geom, material);
  mesh.name = 'dining.roadBike.strut';
  mesh.position.addVectors(p1, p2).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const dir = delta.clone().normalize();
  if (Math.abs(up.dot(dir)) > 0.9999) {
    if (dir.y < 0) {
      mesh.rotation.z = Math.PI;
    }
  } else {
    mesh.quaternion.setFromUnitVectors(up, dir);
  }
  return mesh;
}


interface RoadBikeConfig {
  readonly name: string;
  readonly mountZ: number;
  readonly frameColor: number;
  readonly frameRoughness: number;
  readonly frameMetalness: number;
  readonly accentColor: number;
  readonly badgeColor: number;
  readonly barTapeColor: number;
  readonly bottleColor: number;
}

/**
 * Builds a single high-LOD 700c Aero Carbon Road Bike on a bespoke Steadyrack/Cycloc-style
 * oak-and-black-steel vertical front-wheel wall mount with a lower rear-tire wall rest pad.
 */
function buildSingleWallMountedRoadBike(config: RoadBikeConfig): THREE.Group {
  const bikeRoot = new THREE.Group();
  bikeRoot.name = config.name;
  bikeRoot.userData.zone = 'familyRoom';
  // Positioned at the East partition wall face (X = -7.97m, Y = 0.00m, Z = config.mountZ)
  bikeRoot.position.set(-7.97, 0, config.mountZ);

  // Materials
  const wallOakMat = new THREE.MeshStandardMaterial({
    color: 0xa68153,
    roughness: 0.58,
    metalness: 0.04,
  });
  const blackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.38,
    metalness: 0.78,
  });
  const rubberPadMat = new THREE.MeshStandardMaterial({
    color: 0x18191c,
    roughness: 0.86,
    metalness: 0.05,
  });
  const framePrimaryMat = new THREE.MeshStandardMaterial({
    color: config.frameColor,
    roughness: config.frameRoughness,
    metalness: config.frameMetalness,
  });
  const frameAccentMat = new THREE.MeshStandardMaterial({
    color: config.accentColor,
    roughness: 0.28,
    metalness: 0.36,
  });
  const headBadgeMat = new THREE.MeshStandardMaterial({
    color: config.badgeColor,
    roughness: 0.25,
    metalness: 0.85,
  });
  const matteCarbonMat = new THREE.MeshStandardMaterial({
    color: 0x1e2024,
    roughness: 0.42,
    metalness: 0.26,
  });
  const aeroRimCarbonMat = new THREE.MeshStandardMaterial({
    color: 0x191b1f,
    roughness: 0.34,
    metalness: 0.32,
  });
  const tireTreadMat = new THREE.MeshStandardMaterial({
    color: 0x151618,
    roughness: 0.84,
    metalness: 0.04,
  });
  const tanSidewallMat = new THREE.MeshStandardMaterial({
    color: 0xc2935a, // Classic pro-peloton Vittoria Corsa tan sidewall
    roughness: 0.68,
    metalness: 0.04,
  });
  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d8de,
    roughness: 0.22,
    metalness: 0.92,
  });
  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e34,
    roughness: 0.32,
    metalness: 0.84,
  });
  const chainGoldSilverMat = new THREE.MeshStandardMaterial({
    color: 0xbec3ca,
    roughness: 0.26,
    metalness: 0.88,
  });
  const saddleLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1918,
    roughness: 0.52,
    metalness: 0.06,
  });
  const barTapeMat = new THREE.MeshStandardMaterial({
    color: config.barTapeColor,
    roughness: 0.66,
    metalness: 0.05,
  });
  const bottleMat = new THREE.MeshStandardMaterial({
    color: config.bottleColor,
    roughness: 0.38,
    metalness: 0.12,
  });

  // ── 1. Bespoke Oak & Black Powder-Coated Steel Wall Mount at X = 0 (World X = -7.97m) ──
  const mountGroup = new THREE.Group();
  mountGroup.name = `${config.name}.wallMount`;

  // Upper solid oak mounting backplate (Y = 1.38m..1.74m)
  const upperOakBackplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.36, 0.15),
    wallOakMat
  );
  upperOakBackplate.name = `${config.name}.wallMount.upperOakBackplate`;
  upperOakBackplate.position.set(-0.011, 1.56, 0);
  mountGroup.add(upperOakBackplate);

  // Matte-black steel vertical spine channel & 4 hex wall-anchor bolts
  const steelSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.32, 0.064),
    blackSteelMat
  );
  steelSpine.name = `${config.name}.wallMount.steelSpine`;
  steelSpine.position.set(-0.026, 1.56, 0);
  mountGroup.add(steelSpine);

  for (const [bIdx, [by, bz]] of (
    [
      [1.43, -0.05],
      [1.43, 0.05],
      [1.69, -0.05],
      [1.69, 0.05],
    ] as const
  ).entries()) {
    const bolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.01, 6),
      stainlessSteelMat
    );
    bolt.name = `${config.name}.wallMount.anchorBolt.${bIdx + 1}`;
    bolt.userData.lodTier = 'high';
    bolt.userData.lodMaxDistance = 12;
    bolt.rotation.z = Math.PI * 0.5;
    bolt.position.set(-0.024, by, bz);
    mountGroup.add(bolt);
  }

  // Pivot knuckles at Y = 1.44m and Y = 1.66m
  for (const [kIdx, ky] of ([1.44, 1.66] as const).entries()) {
    const knuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.028, 16),
      blackSteelMat
    );
    knuckle.name = `${config.name}.wallMount.pivotKnuckle.${kIdx + 1}`;
    knuckle.position.set(-0.04, ky, 0);
    mountGroup.add(knuckle);
  }

  // Lower rear-wheel tire wall rest pad at Y = 0.54m (prevents tire marks & stabilizes rear wheel)
  const lowerOakRest = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.24, 0.12),
    wallOakMat
  );
  lowerOakRest.name = `${config.name}.wallMount.lowerOakRest`;
  lowerOakRest.position.set(-0.009, 0.54, 0);
  mountGroup.add(lowerOakRest);

  const lowerRubberPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.2, 0.078),
    rubberPadMat
  );
  lowerRubberPad.name = `${config.name}.wallMount.lowerRubberPad`;
  lowerRubberPad.position.set(-0.022, 0.54, 0);
  mountGroup.add(lowerRubberPad);

  // Molded rubber wheel-channel cradle fins on lower rest pad
  for (const [fIdx, fz] of ([-0.026, 0.026] as const).entries()) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.16, 0.008),
      blackSteelMat
    );
    fin.name = `${config.name}.wallMount.cradleFin.${fIdx + 1}`;
    fin.position.set(-0.032, 0.54, fz);
    mountGroup.add(fin);
  }

  bikeRoot.add(mountGroup);

  // ── 2. Pivoted Road Bike Assembly (Folded flat against the wall with a slight 16° outward tilt) ──
  // Local coordinate convention inside `bikePlaneGroup`:
  //   +x = bike height away from wall-side tire line (from axles at x = 0.315m toward saddle/bars at x ≈ 0.86m)
  //   +y = vertical wheelbase axis (Rear Axle at y = 0.54m, Front Axle at y = 1.52m)
  //   +z = lateral axle axis (left/right sides of bike: +z = drivetrain/right side, -z = disc rotor/left side)
  // In Three.js, rotating `bikePlaneGroup` around Y by +90° (`Math.PI / 2`) places the bike's XY frame plane
  // completely flat/parallel against the YZ wall (pointing North -Z). Adding a slight +16° outward tilt
  // (`rotation.y = Math.PI / 2 + 16° = 106°`) tilts the bike frame slightly outwards into the room (-X)
  // while keeping the wheels/frame flat against the wall (~0.12m–0.27m projection) and angling North (-Z)
  // away from the cloakroom doorway so you can walk straight through unobstructed!
  const bikePlaneGroup = new THREE.Group();
  bikePlaneGroup.name = `${config.name}.pivotedAssembly`;
  bikePlaneGroup.position.set(-0.035, 0, 0.02);
  bikePlaneGroup.rotation.y = Math.PI / 2 + (16 * Math.PI) / 180;

  // Steadyrack-style curved steel front-wheel cradle hook loop (pivots with the front wheel at Y = 1.56m)
  const cradleLoopGroup = new THREE.Group();
  cradleLoopGroup.name = `${config.name}.frontWheelCradle`;
  for (const [sIdx, sideZ] of ([-0.032, 0.032] as const).entries()) {
    const sideLabel = sIdx === 0 ? 'left' : 'right';
    const upperArm = createCylinderStrut(
      new THREE.Vector3(0.0, 1.65, sideZ),
      new THREE.Vector3(0.38, 1.58, sideZ),
      0.006,
      0.006,
      blackSteelMat,
      10
    );
    upperArm.name = `${config.name}.frontWheelCradle.upperArm.${sideLabel}`;
    cradleLoopGroup.add(upperArm);

    const lowerHook = createCylinderStrut(
      new THREE.Vector3(0.38, 1.58, sideZ),
      new THREE.Vector3(0.24, 1.44, sideZ),
      0.006,
      0.006,
      rubberPadMat,
      10
    );
    lowerHook.name = `${config.name}.frontWheelCradle.lowerHook.${sideLabel}`;
    cradleLoopGroup.add(lowerHook);

    const wallBrace = createCylinderStrut(
      new THREE.Vector3(0.0, 1.45, sideZ),
      new THREE.Vector3(0.24, 1.44, sideZ),
      0.0055,
      0.0055,
      blackSteelMat,
      10
    );
    wallBrace.name = `${config.name}.frontWheelCradle.wallBrace.${sideLabel}`;
    cradleLoopGroup.add(wallBrace);
  }
  // Crossbar cradle roller supporting the inside of the front aero rim
  const cradleRoller = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.072, 14),
    rubberPadMat
  );
  cradleRoller.name = `${config.name}.frontWheelCradle.roller`;
  cradleRoller.rotation.x = Math.PI * 0.5;
  cradleRoller.position.set(0.24, 1.44, 0);
  cradleLoopGroup.add(cradleRoller);
  bikePlaneGroup.add(cradleLoopGroup);

  // ── 3. Two 700c Deep-Section (48mm) Carbon Aero Wheels (wheelR = 0.315m) ──
  const wheelR = 0.315;
  const tireTubeR = 0.014;
  const tireMajorR = wheelR - tireTubeR;
  const wheelCenters: ReadonlyArray<{
    readonly label: string;
    readonly x: number;
    readonly y: number;
    readonly isRear: boolean;
  }> = [
    { label: 'rearWheel', x: wheelR, y: 0.54, isRear: true },
    { label: 'frontWheel', x: wheelR, y: 1.52, isRear: false },
  ];

  for (const wc of wheelCenters) {
    const wPrefix = `${config.name}.${wc.label}`;
    const wheelGroup = new THREE.Group();
    wheelGroup.name = wPrefix;
    wheelGroup.position.set(wc.x, wc.y, 0);

    // Outer black 700x28c road tire tread (major R = 0.301m, tube r = 0.014m -> outer radius = 0.315m)
    const tireTread = new THREE.Mesh(
      new THREE.TorusGeometry(tireMajorR, tireTubeR, 16, 48),
      tireTreadMat
    );
    tireTread.name = `${wPrefix}.tireTread`;
    wheelGroup.add(tireTread);

    // Tan-sidewall rings on both faces of the tire
    for (const [swIdx, sideZ] of ([-0.009, 0.009] as const).entries()) {
      const sidewall = new THREE.Mesh(
        new THREE.TorusGeometry(0.293, 0.0075, 12, 48),
        tanSidewallMat
      );
      sidewall.name = `${wPrefix}.sidewall.${swIdx === 0 ? 'left' : 'right'}`;
      sidewall.scale.set(1, 1, 0.45);
      sidewall.position.z = sideZ;
      wheelGroup.add(sidewall);
    }

    // 48mm deep-section matte carbon aero rim (outer R = 0.288m, inner R = 0.240m)
    const aeroRimOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.266, 0.022, 14, 48),
      aeroRimCarbonMat
    );
    aeroRimOuter.name = `${wPrefix}.aeroRimOuter`;
    aeroRimOuter.scale.set(1, 1, 0.56);
    wheelGroup.add(aeroRimOuter);

    const aeroRimNose = new THREE.Mesh(
      new THREE.TorusGeometry(0.248, 0.012, 12, 48),
      matteCarbonMat
    );
    aeroRimNose.name = `${wPrefix}.aeroRimNose`;
    aeroRimNose.scale.set(1, 1, 0.78);
    wheelGroup.add(aeroRimNose);

    // Presta valve stem protruding radially inward from rim nose
    const valveAngle = wc.isRear ? Math.PI * 0.25 : -Math.PI * 0.65;
    const valveP1 = new THREE.Vector3(
      Math.cos(valveAngle) * 0.242,
      Math.sin(valveAngle) * 0.242,
      0
    );
    const valveP2 = new THREE.Vector3(
      Math.cos(valveAngle) * 0.214,
      Math.sin(valveAngle) * 0.214,
      0
    );
    const valveStem = createCylinderStrut(
      valveP1,
      valveP2,
      0.002,
      0.002,
      darkAlloyMat,
      8
    );
    valveStem.name = `${wPrefix}.valveStem`;
    valveStem.userData.lodTier = 'high';
    valveStem.userData.lodMaxDistance = 12;
    wheelGroup.add(valveStem);

    // Alloy centerlock hub shell & flanges
    const hubWidth = wc.isRear ? 0.13 : 0.1;
    const hubShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, hubWidth, 18),
      darkAlloyMat
    );
    hubShell.name = `${wPrefix}.hubShell`;
    hubShell.rotation.x = Math.PI * 0.5;
    wheelGroup.add(hubShell);

    for (const [flIdx, fz] of ([-0.028, 0.028] as const).entries()) {
      const hubFlange = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.005, 20),
        darkAlloyMat
      );
      hubFlange.name = `${wPrefix}.hubFlange.${flIdx === 0 ? 'left' : 'right'}`;
      hubFlange.rotation.x = Math.PI * 0.5;
      hubFlange.position.z = fz;
      wheelGroup.add(hubFlange);
    }

    // 160mm stainless-steel ventilated disc brake rotor on left side (z = -0.042m)
    const discZ = -0.042;
    const rotorTrack = new THREE.Mesh(
      new THREE.RingGeometry(0.058, 0.08, 28),
      stainlessSteelMat
    );
    rotorTrack.name = `${wPrefix}.discRotor.track`;
    rotorTrack.material.side = THREE.DoubleSide;
    rotorTrack.position.z = discZ;
    wheelGroup.add(rotorTrack);

    const rotorSpiderRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.004, 18),
      darkAlloyMat
    );
    rotorSpiderRing.name = `${wPrefix}.discRotor.spiderRing`;
    rotorSpiderRing.rotation.x = Math.PI * 0.5;
    rotorSpiderRing.position.z = discZ;
    wheelGroup.add(rotorSpiderRing);

    for (let arm = 0; arm < 6; arm++) {
      const a0 = (arm / 6) * Math.PI * 2;
      const a1 = a0 + 0.32;
      const spiderStrut = createCylinderStrut(
        new THREE.Vector3(Math.cos(a0) * 0.026, Math.sin(a0) * 0.026, discZ),
        new THREE.Vector3(Math.cos(a1) * 0.064, Math.sin(a1) * 0.064, discZ),
        0.003,
        0.0025,
        darkAlloyMat,
        6
      );
      spiderStrut.name = `${wPrefix}.discRotor.spiderStrut.${arm + 1}`;
      spiderStrut.userData.lodTier = 'high';
      spiderStrut.userData.lodMaxDistance = 12;
      wheelGroup.add(spiderStrut);
    }

    // 16 fine stainless-steel 2-cross / radial spokes per wheel
    const spokeCount = 16;
    for (let s = 0; s < spokeCount; s++) {
      const side = s % 2 === 0 ? -1 : 1;
      const rimAngle = (s / spokeCount) * Math.PI * 2;
      const crossOffset = (s % 4 < 2 ? 1 : -1) * 0.38;
      const hubAngle = rimAngle + crossOffset;

      const pHub = new THREE.Vector3(
        Math.cos(hubAngle) * 0.023,
        Math.sin(hubAngle) * 0.023,
        side * 0.028
      );
      const pRim = new THREE.Vector3(
        Math.cos(rimAngle) * 0.244,
        Math.sin(rimAngle) * 0.244,
        0
      );
      const spoke = createCylinderStrut(
        pHub,
        pRim,
        0.0011,
        0.0011,
        stainlessSteelMat,
        6
      );
      spoke.name = `${wPrefix}.spoke.${s + 1}`;
      spoke.userData.lodTier = 'high';
      spoke.userData.lodMaxDistance = 12;
      wheelGroup.add(spoke);
    }

    bikePlaneGroup.add(wheelGroup);
  }

  // ── 4. Sculpted Diamond Carbon Road Frame + Twin Fork Blades ──
  const frameGroup = new THREE.Group();
  frameGroup.name = `${config.name}.carbonFrame`;

  // Exact pro-peloton 54cm road frame nodes in (x = bike height, y = bike forward, z = lateral):
  const rearAxleLeft = new THREE.Vector3(0.315, 0.54, -0.066);
  const rearAxleRight = new THREE.Vector3(0.315, 0.54, 0.066);
  const frontAxleLeft = new THREE.Vector3(0.315, 1.52, -0.052);
  const frontAxleRight = new THREE.Vector3(0.315, 1.52, 0.052);

  const bottomBracket = new THREE.Vector3(0.255, 0.945, 0);
  const seatCluster = new THREE.Vector3(0.695, 0.815, 0);
  const droppedSeatstayJunction = new THREE.Vector3(0.595, 0.844, 0);
  const headTubeBottom = new THREE.Vector3(0.655, 1.408, 0);
  const headTubeTop = new THREE.Vector3(0.775, 1.372, 0);
  const downTubeHeadJunction = new THREE.Vector3(0.682, 1.4, 0);

  // Bottom Bracket shell
  const fPrefix = frameGroup.name;
  const bbShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.086, 20),
    framePrimaryMat
  );
  bbShell.name = `${fPrefix}.bottomBracketShell`;
  bbShell.rotation.x = Math.PI * 0.5;
  bbShell.position.copy(bottomBracket);
  frameGroup.add(bbShell);

  // Seat Tube (BB to Seat Cluster)
  const seatTube = createCylinderStrut(
    bottomBracket,
    seatCluster,
    0.017,
    0.019,
    framePrimaryMat,
    16
  );
  seatTube.name = `${fPrefix}.seatTube`;
  seatTube.scale.set(1.28, 1, 0.82); // Aero Kamm-tail cross-section
  frameGroup.add(seatTube);

  // Aero Down Tube (BB to Lower Head Tube)
  const downTube = createCylinderStrut(
    bottomBracket,
    downTubeHeadJunction,
    0.021,
    0.025,
    framePrimaryMat,
    16
  );
  downTube.name = `${fPrefix}.downTube`;
  downTube.scale.set(1.25, 1, 0.84);
  frameGroup.add(downTube);

  // Sloping Top Tube (Seat Cluster to Head Tube Top) with accent band near seat cluster
  const topTubeMid = new THREE.Vector3().lerpVectors(
    seatCluster,
    headTubeTop,
    0.34
  );
  const topTubeRear = createCylinderStrut(
    seatCluster,
    topTubeMid,
    0.017,
    0.016,
    frameAccentMat,
    16
  );
  topTubeRear.name = `${fPrefix}.topTube.rear`;
  const topTubeFront = createCylinderStrut(
    topTubeMid,
    headTubeTop,
    0.019,
    0.017,
    framePrimaryMat,
    16
  );
  topTubeFront.name = `${fPrefix}.topTube.front`;
  frameGroup.add(topTubeRear, topTubeFront);

  // Tapered Head Tube (HTB to HTT) + Metallic Head-Tube Badge
  const headTube = createCylinderStrut(
    headTubeBottom,
    headTubeTop,
    0.022,
    0.025,
    framePrimaryMat,
    18
  );
  headTube.name = `${fPrefix}.headTube`;
  frameGroup.add(headTube);

  const headTubeCenter = new THREE.Vector3()
    .addVectors(headTubeBottom, headTubeTop)
    .multiplyScalar(0.5);
  const headBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0235, 0.0255, 0.048, 16, 1, true, -0.5, 1.0),
    headBadgeMat
  );
  headBadge.name = `${fPrefix}.headBadge`;
  headBadge.position.copy(headTubeCenter).add(new THREE.Vector3(0.002, 0.004, 0));
  headBadge.rotation.z = 0.29;
  frameGroup.add(headBadge);

  // Asymmetric Chainstays (BB to Rear Dropouts)
  for (const [sideSign, axleNode] of [
    [-1, rearAxleLeft],
    [1, rearAxleRight],
  ] as const) {
    const sideLabel = sideSign < 0 ? 'left' : 'right';
    const bbSide = bottomBracket
      .clone()
      .add(new THREE.Vector3(0, 0, sideSign * 0.036));
    const chainstay = createCylinderStrut(
      bbSide,
      axleNode,
      0.0095,
      0.016,
      framePrimaryMat,
      12
    );
    chainstay.name = `${fPrefix}.chainstay.${sideLabel}`;
    frameGroup.add(chainstay);

    // Dropped Aero Seatstays (Rear Dropouts to Dropped Seatstay Junction on Seat Tube)
    const seatstay = createCylinderStrut(
      axleNode,
      droppedSeatstayJunction
        .clone()
        .add(new THREE.Vector3(0, 0, sideSign * 0.014)),
      0.0075,
      0.007,
      framePrimaryMat,
      12
    );
    seatstay.name = `${fPrefix}.seatstay.${sideLabel}`;
    frameGroup.add(seatstay);

    // Rear carbon dropout plate
    const dropout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.008, 14),
      matteCarbonMat
    );
    dropout.name = `${fPrefix}.dropout.${sideLabel}`;
    dropout.rotation.x = Math.PI * 0.5;
    dropout.position.copy(axleNode);
    frameGroup.add(dropout);
  }

  // Twin Aero Carbon Fork Blades (Fork Crown at HTB to Front Dropouts)
  const forkCrownLeft = headTubeBottom
    .clone()
    .add(new THREE.Vector3(-0.01, 0.005, -0.032));
  const forkCrownRight = headTubeBottom
    .clone()
    .add(new THREE.Vector3(-0.01, 0.005, 0.032));

  const forkCrownBridge = createCylinderStrut(
    forkCrownLeft,
    forkCrownRight,
    0.018,
    0.018,
    framePrimaryMat,
    14
  );
  forkCrownBridge.name = `${fPrefix}.forkCrownBridge`;
  frameGroup.add(forkCrownBridge);

  for (const [fIdx, [crownNode, axleNode]] of (
    [
      [forkCrownLeft, frontAxleLeft],
      [forkCrownRight, frontAxleRight],
    ] as const
  ).entries()) {
    const sideLabel = fIdx === 0 ? 'left' : 'right';
    const midFork = new THREE.Vector3().lerpVectors(crownNode, axleNode, 0.55);
    const upperBlade = createCylinderStrut(
      crownNode,
      midFork,
      0.013,
      0.017,
      framePrimaryMat,
      14
    );
    upperBlade.name = `${fPrefix}.forkBlade.${sideLabel}.upper`;
    upperBlade.scale.set(1.35, 1, 0.65);
    const lowerBlade = createCylinderStrut(
      midFork,
      axleNode,
      0.009,
      0.013,
      frameAccentMat,
      14
    );
    lowerBlade.name = `${fPrefix}.forkBlade.${sideLabel}.lower`;
    lowerBlade.scale.set(1.35, 1, 0.65);
    frameGroup.add(upperBlade, lowerBlade);
  }

  // Flat-mount hydraulic disc brake calipers (Front & Rear left side)
  const rearCaliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.044, 0.022),
    darkAlloyMat
  );
  rearCaliper.name = `${fPrefix}.brakeCaliper.rear`;
  rearCaliper.position.set(0.34, 0.6, -0.046);
  frameGroup.add(rearCaliper);

  const frontCaliper = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.026, 0.022),
    darkAlloyMat
  );
  frontCaliper.name = `${fPrefix}.brakeCaliper.front`;
  frontCaliper.position.set(0.382, 1.498, -0.046);
  frameGroup.add(frontCaliper);

  bikePlaneGroup.add(frameGroup);

  // ── 5. Aero Carbon Seatpost + Sculpted Narrow Road Racing Saddle with Alloy Rails ──
  const saddleNode = new THREE.Vector3(0.84, 0.772, 0);
  const seatpost = createCylinderStrut(
    seatCluster,
    saddleNode,
    0.014,
    0.015,
    matteCarbonMat,
    14
  );
  seatpost.name = `${config.name}.seatpost`;
  seatpost.scale.set(1.3, 1, 0.75);
  bikePlaneGroup.add(seatpost);

  const saddleGroup = new THREE.Group();
  saddleGroup.name = `${config.name}.saddle`;
  saddleGroup.position.copy(saddleNode);

  // Twin alloy saddle rails
  for (const [rIdx, rz] of ([-0.021, 0.021] as const).entries()) {
    const rail = createCylinderStrut(
      new THREE.Vector3(-0.018, -0.055, rz),
      new THREE.Vector3(-0.012, 0.065, rz),
      0.0032,
      0.0032,
      stainlessSteelMat,
      8
    );
    rail.name = `${config.name}.saddle.rail.${rIdx === 0 ? 'left' : 'right'}`;
    saddleGroup.add(rail);
  }

  // Sculpted narrow road saddle tail & nose
  const saddleRear = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 18, 14),
    saddleLeatherMat
  );
  saddleRear.name = `${config.name}.saddle.rear`;
  saddleRear.scale.set(0.24, 1.35, 0.95);
  saddleRear.position.set(0.014, -0.042, 0);
  saddleGroup.add(saddleRear);

  const saddleNose = createCylinderStrut(
    new THREE.Vector3(0.014, -0.03, 0),
    new THREE.Vector3(0.012, 0.125, 0),
    0.014,
    0.032,
    saddleLeatherMat,
    14
  );
  saddleNose.name = `${config.name}.saddle.nose`;
  saddleNose.scale.set(0.45, 1, 1);
  saddleGroup.add(saddleNose);

  // Central ergonomic cutout channel on saddle top
  const saddleCutout = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.095, 0.014),
    matteCarbonMat
  );
  saddleCutout.name = `${config.name}.saddle.cutout`;
  saddleCutout.position.set(0.026, 0.01, 0);
  saddleGroup.add(saddleCutout);

  bikePlaneGroup.add(saddleGroup);

  // ── 6. Integrated Aero Stem + Curved Road Drop Handlebars + Dual STI Brake/Shift Hoods ──
  const cockpitGroup = new THREE.Group();
  const cPrefix = `${config.name}.cockpit`;
  cockpitGroup.name = cPrefix;

  const steererTop = new THREE.Vector3(0.818, 1.359, 0);
  const stemClamp = new THREE.Vector3(0.838, 1.462, 0);

  // Aero headset spacers & top cap
  const steererSpacer = createCylinderStrut(
    headTubeTop,
    steererTop,
    0.018,
    0.02,
    matteCarbonMat,
    14
  );
  steererSpacer.name = `${cPrefix}.steererSpacer`;
  cockpitGroup.add(steererSpacer);

  // Integrated aero carbon stem
  const aeroStem = createCylinderStrut(
    steererTop,
    stemClamp,
    0.016,
    0.019,
    matteCarbonMat,
    14
  );
  aeroStem.name = `${cPrefix}.aeroStem`;
  cockpitGroup.add(aeroStem);

  // Out-front cycling computer mount with Garmin/Wahoo head unit
  const computerMount = createCylinderStrut(
    stemClamp,
    new THREE.Vector3(0.844, 1.522, 0),
    0.004,
    0.005,
    darkAlloyMat,
    8
  );
  computerMount.name = `${cPrefix}.computerMount`;
  cockpitGroup.add(computerMount);

  const bikeComputer = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.062, 0.042),
    blackSteelMat
  );
  bikeComputer.name = `${cPrefix}.bikeComputer`;
  bikeComputer.position.set(0.85, 1.525, 0);
  cockpitGroup.add(bikeComputer);

  // Horizontal aero handlebar tops (40cm wide = Z from -0.20m to +0.20m)
  const barHalfWidth = 0.195;
  const barTops = createCylinderStrut(
    new THREE.Vector3(stemClamp.x, stemClamp.y, -barHalfWidth),
    new THREE.Vector3(stemClamp.x, stemClamp.y, barHalfWidth),
    0.0135,
    0.0135,
    barTapeMat,
    14
  );
  barTops.name = `${cPrefix}.barTops`;
  cockpitGroup.add(barTops);

  // Left & Right Classic Curved Road Drops + Dual STI Brake/Shift Lever Hoods
  for (const sideSign of [-1, 1]) {
    const sideLabel = sideSign < 0 ? 'left' : 'right';
    const hz = sideSign * barHalfWidth;

    // Forward ramp from tops to hoods
    const hoodBase = new THREE.Vector3(0.842, 1.532, hz);
    const rampStrut = createCylinderStrut(
      new THREE.Vector3(stemClamp.x, stemClamp.y, hz),
      hoodBase,
      0.0125,
      0.0125,
      barTapeMat,
      12
    );
    rampStrut.name = `${cPrefix}.barRamp.${sideLabel}`;
    cockpitGroup.add(rampStrut);

    // Curved compact drop loop (TorusGeometry half-arc in the x-y plane at Z = hz)
    const dropArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.064, 0.012, 12, 22, Math.PI * 1.12),
      barTapeMat
    );
    dropArc.name = `${cPrefix}.barDropArc.${sideLabel}`;
    dropArc.position.set(0.778, 1.528, hz);
    dropArc.rotation.z = -Math.PI * 0.52;
    cockpitGroup.add(dropArc);

    // Lower drop grip extension pointing back toward head tube
    const dropTail = createCylinderStrut(
      new THREE.Vector3(0.715, 1.522, hz),
      new THREE.Vector3(0.708, 1.445, hz),
      0.012,
      0.012,
      barTapeMat,
      10
    );
    dropTail.name = `${cPrefix}.barDropTail.${sideLabel}`;
    cockpitGroup.add(dropTail);

    // Bar-end plug
    const barPlug = new THREE.Mesh(
      new THREE.SphereGeometry(0.0125, 10, 10),
      headBadgeMat
    );
    barPlug.name = `${cPrefix}.barPlug.${sideLabel}`;
    barPlug.position.set(0.708, 1.445, hz);
    cockpitGroup.add(barPlug);

    // STI Brake/Shift Lever Hood body (ergonomic upright rubber hood horn)
    const stiHoodBody = createCylinderStrut(
      hoodBase,
      new THREE.Vector3(0.902, 1.568, hz),
      0.014,
      0.016,
      rubberPadMat,
      12
    );
    stiHoodBody.name = `${cPrefix}.stiHoodBody.${sideLabel}`;
    cockpitGroup.add(stiHoodBody);

    const stiPommel = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 10),
      rubberPadMat
    );
    stiPommel.name = `${cPrefix}.stiPommel.${sideLabel}`;
    stiPommel.scale.set(1.25, 0.95, 0.88);
    stiPommel.position.set(0.908, 1.57, hz);
    cockpitGroup.add(stiPommel);

    // Carbon brake/shift lever blade curving down in front of the drop
    const brakeBlade = createCylinderStrut(
      new THREE.Vector3(0.882, 1.562, hz),
      new THREE.Vector3(0.76, 1.588, hz - sideSign * 0.008),
      0.0035,
      0.006,
      matteCarbonMat,
      8
    );
    brakeBlade.name = `${cPrefix}.brakeBlade.${sideLabel}`;
    cockpitGroup.add(brakeBlade);
  }

  bikePlaneGroup.add(cockpitGroup);

  // ── 7. Detailed Drivetrain: 52/36T Crankset, Clipless Pedals, 12-Speed Cassette, Derailleur & Chain + 2 Bottle Cages ──
  const drivetrainGroup = new THREE.Group();
  const dtPrefix = `${config.name}.drivetrain`;
  drivetrainGroup.name = dtPrefix;

  const rightCrankZ = 0.048;
  const leftCrankZ = -0.048;

  // 52T outer & 36T inner hollow-forged chainrings on right side of BB (0.255, 0.945, +0.044)
  const outerChainring = new THREE.Mesh(
    new THREE.RingGeometry(0.072, 0.106, 36),
    darkAlloyMat
  );
  outerChainring.name = `${dtPrefix}.outerChainring`;
  outerChainring.material.side = THREE.DoubleSide;
  outerChainring.position.set(
    bottomBracket.x,
    bottomBracket.y,
    rightCrankZ - 0.004
  );
  drivetrainGroup.add(outerChainring);

  const outerChainringRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.104, 0.0035, 10, 36),
    stainlessSteelMat
  );
  outerChainringRim.name = `${dtPrefix}.outerChainringRim`;
  outerChainringRim.position.set(
    bottomBracket.x,
    bottomBracket.y,
    rightCrankZ - 0.004
  );
  drivetrainGroup.add(outerChainringRim);

  const innerChainring = new THREE.Mesh(
    new THREE.RingGeometry(0.048, 0.074, 32),
    stainlessSteelMat
  );
  innerChainring.name = `${dtPrefix}.innerChainring`;
  innerChainring.material.side = THREE.DoubleSide;
  innerChainring.position.set(
    bottomBracket.x,
    bottomBracket.y,
    rightCrankZ - 0.01
  );
  drivetrainGroup.add(innerChainring);

  // 4-arm asymmetric hollow-forged crank spider
  for (let arm = 0; arm < 4; arm++) {
    const a = (arm / 4) * Math.PI * 2 + 0.35;
    const spiderArm = createCylinderStrut(
      new THREE.Vector3(bottomBracket.x, bottomBracket.y, rightCrankZ),
      new THREE.Vector3(
        bottomBracket.x + Math.cos(a) * 0.082,
        bottomBracket.y + Math.sin(a) * 0.082,
        rightCrankZ - 0.004
      ),
      0.009,
      0.014,
      darkAlloyMat,
      8
    );
    spiderArm.name = `${dtPrefix}.crankSpiderArm.${arm + 1}`;
    spiderArm.userData.lodTier = 'high';
    spiderArm.userData.lodMaxDistance = 12;
    drivetrainGroup.add(spiderArm);
  }

  // Right & Left 172.5mm Crank Arms + Clipless Road Pedals
  const crankAngle = 0.68; // Right crank angled up-and-forward, left crank opposite
  const crankLen = 0.172;
  for (const [sideSign, zPos, angleOffset] of [
    [1, rightCrankZ, 0],
    [-1, leftCrankZ, Math.PI],
  ] as const) {
    const sideLabel = sideSign > 0 ? 'right' : 'left';
    const a = crankAngle + angleOffset;
    const pStart = new THREE.Vector3(bottomBracket.x, bottomBracket.y, zPos);
    const pEnd = new THREE.Vector3(
      bottomBracket.x + Math.cos(a) * crankLen,
      bottomBracket.y + Math.sin(a) * crankLen,
      zPos + sideSign * 0.008
    );
    const crankArm = createCylinderStrut(
      pStart,
      pEnd,
      0.012,
      0.016,
      darkAlloyMat,
      10
    );
    crankArm.name = `${dtPrefix}.crankArm.${sideLabel}`;
    crankArm.scale.set(1, 1, 0.48);
    drivetrainGroup.add(crankArm);

    // Pedal spindle & Look/SPD-SL clipless road pedal platform
    const pedalPos = pEnd
      .clone()
      .add(new THREE.Vector3(0, 0, sideSign * 0.042));
    const spindle = createCylinderStrut(
      pEnd,
      pedalPos,
      0.004,
      0.004,
      stainlessSteelMat,
      8
    );
    spindle.name = `${dtPrefix}.pedalSpindle.${sideLabel}`;
    drivetrainGroup.add(spindle);

    const pedalBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.068, 0.056),
      matteCarbonMat
    );
    pedalBody.name = `${dtPrefix}.pedalBody.${sideLabel}`;
    pedalBody.position.copy(pedalPos);
    drivetrainGroup.add(pedalBody);
  }

  // 12-Speed Rear Cassette Cluster at Rear Axle right side (0.315, 0.54, +0.036..+0.058)
  const cogCount = 7;
  for (let c = 0; c < cogCount; c++) {
    const frac = c / (cogCount - 1);
    const cogR = 0.062 - frac * 0.038; // 34T largest cog down to 11T smallest cog
    const cogZ = 0.032 + frac * 0.024;
    const cog = new THREE.Mesh(
      new THREE.CylinderGeometry(cogR, cogR, 0.0022, 24),
      c === 0 ? darkAlloyMat : stainlessSteelMat
    );
    cog.name = `${dtPrefix}.cassetteCog.${c + 1}`;
    cog.userData.lodTier = 'high';
    cog.userData.lodMaxDistance = 12;
    cog.rotation.x = Math.PI * 0.5;
    cog.position.set(0.315, 0.54, cogZ);
    drivetrainGroup.add(cog);
  }

  // Rear Derailleur Body & Jockey-Wheel Pulley Cage
  const derailleurHanger = new THREE.Vector3(0.285, 0.525, 0.064);
  const upperPulley = new THREE.Vector3(0.262, 0.548, 0.048);
  const lowerPulley = new THREE.Vector3(0.212, 0.562, 0.048);

  const rdBody = createCylinderStrut(
    new THREE.Vector3(0.315, 0.54, 0.064),
    derailleurHanger,
    0.008,
    0.01,
    darkAlloyMat,
    8
  );
  rdBody.name = `${dtPrefix}.rearDerailleur.body`;
  const rdCage = createCylinderStrut(
    upperPulley,
    lowerPulley,
    0.009,
    0.011,
    matteCarbonMat,
    10
  );
  rdCage.name = `${dtPrefix}.rearDerailleur.cage`;
  drivetrainGroup.add(rdBody, rdCage);

  for (const [pIdx, pulleyPos] of ([upperPulley, lowerPulley] as const).entries()) {
    const pulleyWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.005, 14),
      darkAlloyMat
    );
    pulleyWheel.name = `${dtPrefix}.rearDerailleur.jockeyPulley.${pIdx === 0 ? 'upper' : 'lower'}`;
    pulleyWheel.userData.lodTier = 'high';
    pulleyWheel.userData.lodMaxDistance = 12;
    pulleyWheel.rotation.x = Math.PI * 0.5;
    pulleyWheel.position.copy(pulleyPos);
    drivetrainGroup.add(pulleyWheel);
  }

  // Upper & Lower Chain Runs + Front Derailleur Cage
  const chainZ = 0.045;
  const upperChainRun = createCylinderStrut(
    new THREE.Vector3(0.352, 0.55, chainZ),
    new THREE.Vector3(bottomBracket.x + 0.098, bottomBracket.y + 0.02, chainZ),
    0.0038,
    0.0038,
    chainGoldSilverMat,
    8
  );
  upperChainRun.name = `${dtPrefix}.chainRun.upper`;
  const lowerChainRun = createCylinderStrut(
    new THREE.Vector3(
      lowerPulley.x - 0.01,
      lowerPulley.y + 0.006,
      chainZ
    ),
    new THREE.Vector3(bottomBracket.x - 0.098, bottomBracket.y + 0.01, chainZ),
    0.0038,
    0.0038,
    chainGoldSilverMat,
    8
  );
  lowerChainRun.name = `${dtPrefix}.chainRun.lower`;
  drivetrainGroup.add(upperChainRun, lowerChainRun);

  const frontDerailleur = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.052, 0.022),
    darkAlloyMat
  );
  frontDerailleur.name = `${dtPrefix}.frontDerailleur`;
  frontDerailleur.position.set(0.365, 0.912, 0.036);
  drivetrainGroup.add(frontDerailleur);

  // 2 Carbon Bottle Cages with Cycling Bidons (on Down Tube & Seat Tube inside main triangle)
  const bottlePlacements: ReadonlyArray<{
    readonly base: THREE.Vector3;
    readonly top: THREE.Vector3;
  }> = [
    // Down tube bidon
    {
      base: new THREE.Vector3(0.415, 1.07, 0),
      top: new THREE.Vector3(0.535, 1.195, 0),
    },
    // Seat tube bidon
    {
      base: new THREE.Vector3(0.4, 0.935, 0),
      top: new THREE.Vector3(0.555, 0.89, 0),
    },
  ];

  for (const [bIdx, bp] of bottlePlacements.entries()) {
    const bLabel = bIdx === 0 ? 'downTube' : 'seatTube';
    // Carbon cage collar
    const cageCenter = new THREE.Vector3()
      .addVectors(bp.base, bp.top)
      .multiplyScalar(0.5);
    const cageRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.004, 8, 20),
      matteCarbonMat
    );
    cageRing.name = `${dtPrefix}.bottleCage.${bLabel}`;
    cageRing.position.copy(cageCenter);
    const dir = new THREE.Vector3().subVectors(bp.top, bp.base).normalize();
    cageRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    drivetrainGroup.add(cageRing);

    // Bidon body
    const bidonBody = createCylinderStrut(
      bp.base,
      bp.top,
      0.033,
      0.034,
      bottleMat,
      16
    );
    bidonBody.name = `${dtPrefix}.bidon.${bLabel}.body`;
    drivetrainGroup.add(bidonBody);

    // Black cap & pull nozzle at top of bidon
    const capTop = bp.top.clone().addScaledVector(dir, 0.022);
    const bidonCap = createCylinderStrut(
      bp.top,
      capTop,
      0.024,
      0.032,
      blackSteelMat,
      14
    );
    bidonCap.name = `${dtPrefix}.bidon.${bLabel}.cap`;
    const nozzleTop = capTop.clone().addScaledVector(dir, 0.014);
    const bidonNozzle = createCylinderStrut(
      capTop,
      nozzleTop,
      0.008,
      0.01,
      rubberPadMat,
      10
    );
    bidonNozzle.name = `${dtPrefix}.bidon.${bLabel}.nozzle`;
    bidonNozzle.userData.lodTier = 'high';
    bidonNozzle.userData.lodMaxDistance = 12;
    drivetrainGroup.add(bidonCap, bidonNozzle);
  }

  bikePlaneGroup.add(drivetrainGroup);
  bikeRoot.add(bikePlaneGroup);

  return bikeRoot;
}

/**
 * Issue #16: Mounts 2 high-LOD Carbon Road Bikes side-by-side on bespoke wall-mounted
 * vertical front-wheel bike hooks on the West (-X) face of the Walk-in Cupboard East
 * partition wall (X = -7.97m) at Z = -2.04m (Bike 1) and Z = -1.32m (Bike 2).
 */
export function buildWalkInCupboardRoadBikes(scene: THREE.Scene): void {
  const roadBikesGroup = new THREE.Group();
  roadBikesGroup.name = 'familyRoom.walkInCupboard.roadBikes';
  roadBikesGroup.userData.zone = 'familyRoom';
  roadBikesGroup.userData.zoneId = 'familyRoom';
  roadBikesGroup.userData.lodTier = 2;

  // Issue #1: Move familyRoom.walkInCupboard.roadBikes to world center [-8.215, 1.03, -1.374]
  // (local position [0, -0.812, -2.466], Euler rotation [88.084°, 180°, 180°] along the enlarged East cupboard wall)
  roadBikesGroup.position.set(0, -0.812, -2.466);
  roadBikesGroup.rotation.set(
    THREE.MathUtils.degToRad(88.084),
    Math.PI,
    Math.PI
  );

  // Bike 1: Metallic British Racing Green with champagne-gold head-tube badge & tan-sidewall 700x28c tires
  const bike1 = buildSingleWallMountedRoadBike({
    name: 'familyRoom.walkInCupboard.roadBikes.bike1',
    mountZ: -1.74,
    frameColor: 0x1b4332,
    frameRoughness: 0.24,
    frameMetalness: 0.45,
    accentColor: 0xc9a96e,
    badgeColor: 0xd4b475,
    barTapeColor: 0x241e1a,
    bottleColor: 0x163628,
  });
  roadBikesGroup.add(bike1);

  // Bike 2: Stealth Matte Carbon Anthracite with crimson-red fork/top-tube accent & tan-sidewall 700x28c tires
  const bike2 = buildSingleWallMountedRoadBike({
    name: 'familyRoom.walkInCupboard.roadBikes.bike2',
    mountZ: -1.16,
    frameColor: 0x22252a,
    frameRoughness: 0.36,
    frameMetalness: 0.28,
    accentColor: 0x9e2a2b,
    badgeColor: 0xc8cdd4,
    barTapeColor: 0x1a1b1e,
    bottleColor: 0x8c2324,
  });
  roadBikesGroup.add(bike2);

  enableShadowsRecursively(roadBikesGroup);
  scene.add(roadBikesGroup);
}

