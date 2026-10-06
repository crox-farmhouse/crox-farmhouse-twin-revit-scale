import * as THREE from 'three';

/**
 * Generates a realistic clear-lacquered Solid American White Oak wood-grain texture
 * (`#9c744f` / `#8c6440`) with fine quarter-sawn medullary rays and warm cathedral grain lines
 * for the Haldane UK bespoke wooden spiral staircase.
 */
let cachedAmericanWhiteOakTexture: THREE.CanvasTexture | null = null;

export function createAmericanWhiteOakTexture(): THREE.CanvasTexture {
  if (cachedAmericanWhiteOakTexture) {
    return cachedAmericanWhiteOakTexture;
  }
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, w, h);
  baseGrad.addColorStop(0, '#d8b58a');
  baseGrad.addColorStop(0.5, '#cda77b');
  baseGrad.addColorStop(1, '#c29a6d');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 180; i++) {
    const y0 = (i / 180) * h;
    ctx.strokeStyle =
      i % 3 === 0
        ? 'rgba(68, 42, 18, 0.14)'
        : i % 3 === 1
          ? 'rgba(235, 200, 155, 0.09)'
          : 'rgba(92, 58, 28, 0.10)';
    ctx.lineWidth = 1.2 + (i % 3) * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 32) {
      const wave =
        Math.sin(x * 0.018 + i * 0.7) * 3.5 +
        Math.cos(x * 0.045 - i * 1.1) * 1.4;
      ctx.lineTo(x, y0 + wave);
    }
    ctx.stroke();
  }

  for (let r = 0; r < 140; r++) {
    const h1 = Math.sin(r * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(r * 78.233) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    ctx.fillStyle = 'rgba(225, 190, 145, 0.11)';
    ctx.fillRect(f1 * w, f2 * h, 18 + (r % 24), 2.2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  cachedAmericanWhiteOakTexture = tex;
  return tex;
}

/**
 * Issue #2 ("Remove the ladder" at `[-3.328, 1.428, 18.92]`) &
 * Issue #3 ("Spiral staircase here https://haldaneuk.com/projects/wooden-spiral-staircase/"
 * at `[-0.025, 1.428, 18.785]` -> Outbuilding `(u = 22.124m, y = 1.428m, v = 4.696m)` in the SE corner of the Barn):
 * Builds a showroom-quality **Haldane UK Bespoke Freestanding Solid American White Oak Spiral Staircase**
 * (`outbuildings.barn.spiralStaircase`) centered at `(centerU = 22.08m, centerV = 4.50m)`, rising from
 * `barnLowerFloorY = -0.70m` to `mezzanineFloorY = 1.54m` (`totalRise = 2.24m`), complete with:
 * - Turned Solid American White Oak Central Column (`outbuildings.barn.spiralStaircase.centerColumn`, `170mm` diameter)
 *   with stacked turned drum spacers, shadow V-grooves, steel/oak base plinth, and turned oak top newel finial
 * - 12 Bespoke Fan-Shaped Solid American White Oak Treads (`outbuildings.barn.spiralStaircase.tread`) built with
 *   `THREE.ExtrudeGeometry` bullnose fan sectors and sculpted solid-oak underneath support brackets
 * - Custom Solid Oak Quadrant Top Landing Platform (`outbuildings.barn.spiralStaircase.topLanding`) at `y = 2.24m`
 *   bridging from the center column to the Mezzanine landing edge (`u = 21.14m, v = 3.56..4.95m`)
 * - Continuous Helical Laminated Solid-Oak Outer Stringer Ribbon (`outbuildings.barn.spiralStaircase.outerStringer`)
 *   tying the outer tips of the treads together (`r = 0.875m`, `4–5cm` clear of the Barn South & East walls)
 * - Continuous Helical Solid American White Oak Handrail (`outbuildings.barn.spiralStaircase.handrail`) with a classic
 *   Haldane UK **scrolled horizontal bullnose volute curl** at the bottom entry and turned balusters (`outbuildings.barn.spiralStaircase.spindle`).
 */
export function buildBarnSpiralStaircase(
  groundGroup: THREE.Group,
  barnLowerFloorY: number,
  mezzanineFloorY: number,
  sharedLightOakMat?: THREE.Material,
  firstFloorGroup?: THREE.Group
): void {
  const centerU = 22.08;
  const centerV = 4.5;
  const totalRise = mezzanineFloorY - barnLowerFloorY; // 2.24m (-0.70m to +1.54m)
  const numSteps = 12;
  const riserH = totalRise / numSteps; // 0.1867m per step
  const innerRadius = 0.082;
  const columnRadius = 0.085; // 170mm diameter turned oak central column
  const outerRadius = 0.88; // Spans u = 21.20..22.96m (4cm clear of u=23.00m wall) & v = 3.62..5.38m (5cm clear of v=5.43m wall)

  const stairGroup = new THREE.Group();
  stairGroup.name = 'outbuildings.barn.spiralStaircase';
  stairGroup.position.set(centerU, barnLowerFloorY, centerV);
  groundGroup.add(stairGroup);

  // Issue #4 ("In cutaway mode dont show this landing when looking at the ground floor" at `[-0.388, 1.545, 18.162]`,
  // `outbuildings.barn.spiralStaircase.topLanding`):
  // Attach the Mezzanine-level top landing platform (`topLanding`, `landingApron`, `landingEastFascia`, `topNewel`)
  // to `firstFloorGroup` so it hides automatically when viewing the ground floor in cutaway mode!
  const topLandingGroup = new THREE.Group();
  topLandingGroup.name = 'outbuildings.barn.spiralStaircase.topLandingGroup';
  if (firstFloorGroup) {
    topLandingGroup.position.set(centerU, barnLowerFloorY, centerV);
    firstFloorGroup.add(topLandingGroup);
  } else {
    stairGroup.add(topLandingGroup);
  }

  // Issue #2 ("Same material on all of the stairs, and flooring (lighter oak" at `[-0.7, 1.545, 18.308]`):
  // Share the exact `lightJoineryOakMat` lighter oak material across all spiral staircase treads, landing,
  // central column, outer stringer, handrail, and the Mezzanine flooring & Stable stairs!
  const oakTex = createAmericanWhiteOakTexture();
  const fallbackLightOakMat = new THREE.MeshStandardMaterial({
    map: oakTex,
    color: 0xe6cda8,
    roughness: 0.42,
    metalness: 0.03,
  });
  const oakTreadMat: THREE.Material = sharedLightOakMat ?? fallbackLightOakMat;
  const oakHandrailMat: THREE.Material = sharedLightOakMat ?? fallbackLightOakMat;
  const baseFlangeMat = new THREE.MeshStandardMaterial({
    color: 0x23272d,
    roughness: 0.38,
    metalness: 0.74,
  });

  // ---------------------------------------------------------------------------
  // 1. Central Turned American White Oak Column (`outbuildings.barn.spiralStaircase.centerColumn`)
  // ---------------------------------------------------------------------------
  const columnGroup = new THREE.Group();
  columnGroup.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  stairGroup.add(columnGroup);

  const steelBaseFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.175, 0.018, 28),
    baseFlangeMat
  );
  steelBaseFlange.name = 'outbuildings.barn.spiralStaircase.centerColumn.baseFlange';
  steelBaseFlange.position.set(0, 0.009, 0);
  steelBaseFlange.receiveShadow = true;
  columnGroup.add(steelBaseFlange);

  const oakBasePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius + 0.018, columnRadius + 0.042, 0.068, 28),
    oakHandrailMat
  );
  oakBasePlinth.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  oakBasePlinth.position.set(0, 0.048, 0);
  oakBasePlinth.castShadow = true;
  oakBasePlinth.receiveShadow = true;
  columnGroup.add(oakBasePlinth);

  // Issue #1 ("These bannisters and ballistrages look too much lilke bamboo, it should be oak"):
  // Single continuous turned solid European oak center column with zero segmented bamboo rings!
  const totalColumnH = totalRise + 1.02;
  const columnShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius, columnRadius, totalColumnH, 32),
    oakHandrailMat
  );
  columnShaft.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  columnShaft.position.set(0, totalColumnH * 0.5, 0);
  columnShaft.castShadow = true;
  columnShaft.receiveShadow = true;
  columnGroup.add(columnShaft);

  const capitalCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius + 0.022, columnRadius + 0.008, 0.042, 28),
    oakHandrailMat
  );
  capitalCollar.name = 'outbuildings.barn.spiralStaircase.centerColumn.capitalCollar';
  capitalCollar.position.set(0, totalColumnH + 0.021, 0);
  columnGroup.add(capitalCollar);

  const topFinial = new THREE.Mesh(
    new THREE.SphereGeometry(columnRadius + 0.014, 24, 18),
    oakHandrailMat
  );
  topFinial.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  topFinial.scale.set(1, 1.18, 1);
  topFinial.position.set(0, totalColumnH + 0.1, 0);
  topFinial.castShadow = true;
  columnGroup.add(topFinial);

  // ---------------------------------------------------------------------------
  // 2. 12 Bespoke Fan-Shaped Solid American White Oak Treads (`outbuildings.barn.spiralStaircase.tread`)
  // ---------------------------------------------------------------------------
  // Issue #1 ("Bannisters a bit messed up here" at `[-0.935, 2.521, 18.902]` -> `(u = 21.208m, y = 2.521m, v = 4.735m)`):
  // Set `thetaEnd = Math.PI * 0.82` (`147.6°`, `z = +0.447m, v = 4.947m`) so the 12 helical treads, outer stringer,
  // glass banister panels, and handrail climb monotonically around the South-West curve directly into the shared
  // top landing newel post at `(u = 21.12m, v = 4.85m)` (`x = -0.96m, z = +0.35m`) with zero backward S-kink!
  const thetaStart = -Math.PI * 0.65;
  const thetaEnd = Math.PI * 0.82;
  const treadSweep = 0.42;
  const treadThickness = 0.036;

  const fanShape = new THREE.Shape();
  const halfSweep = treadSweep * 0.5;
  const arcSegs = 18;
  fanShape.moveTo(innerRadius * Math.cos(-halfSweep), -innerRadius * Math.sin(-halfSweep));
  fanShape.lineTo(outerRadius * Math.cos(-halfSweep), -outerRadius * Math.sin(-halfSweep));
  for (let s = 1; s <= arcSegs; s++) {
    const a = -halfSweep + (s / arcSegs) * treadSweep;
    fanShape.lineTo(outerRadius * Math.cos(a), -outerRadius * Math.sin(a));
  }
  fanShape.lineTo(innerRadius * Math.cos(halfSweep), -innerRadius * Math.sin(halfSweep));
  for (let s = arcSegs - 1; s >= 0; s--) {
    const a = -halfSweep + (s / arcSegs) * treadSweep;
    fanShape.lineTo(innerRadius * Math.cos(a), -innerRadius * Math.sin(a));
  }
  fanShape.closePath();

  const treadGeo = new THREE.ExtrudeGeometry(fanShape, {
    depth: treadThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  treadGeo.rotateX(-Math.PI / 2);
  {
    const pos = treadGeo.attributes.position;
    const uv = treadGeo.attributes.uv;
    if (pos && uv) {
      for (let k = 0; k < pos.count; k++) {
        uv.setXY(k, pos.getX(k) * 0.5, pos.getZ(k) * 0.5);
      }
      uv.needsUpdate = true;
    }
  }

  // Issue #2 ("LED light strips underneath each tread" at `[0.439, 0.429, 18.46]`, `outbuildings.barn.spiralStaircase.tread`):
  // Recessed warm 2700K linear LED light strip + anodized aluminium diffuser channel routed into the underside of every tread!
  const treadLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: new THREE.Color(0xffc668),
    emissiveIntensity: 2.35,
    roughness: 0.18,
    metalness: 0.04,
  });
  const ledChannelMat = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.38,
    metalness: 0.72,
  });
  const ledStripLen = outerRadius - columnRadius - 0.11; // ~0.685m radial strip length
  const ledRadialCenter = columnRadius + 0.055 + ledStripLen * 0.5;
  const ledLeadingAngle = -halfSweep * 0.62; // Positioned near the leading underside nosing of each fan tread
  const ledChannelGeo = new THREE.BoxGeometry(ledStripLen, 0.008, 0.022);
  const ledDiffuserGeo = new THREE.BoxGeometry(ledStripLen - 0.012, 0.005, 0.014);

  for (let i = 0; i < numSteps; i++) {
    const frac = i / (numSteps - 1);
    const theta = thetaStart + frac * (thetaEnd - thetaStart);
    const treadTopY = (i + 1) * riserH;
    const treadBaseY = treadTopY - treadThickness;

    const stepContainer = new THREE.Group();
    stepContainer.name = `outbuildings.barn.spiralStaircase.step.${i + 1}`;
    stepContainer.position.set(0, treadBaseY, 0);
    stepContainer.rotation.y = -theta;
    stairGroup.add(stepContainer);

    const treadMesh = new THREE.Mesh(treadGeo, oakTreadMat);
    treadMesh.name = 'outbuildings.barn.spiralStaircase.tread';
    treadMesh.castShadow = true;
    treadMesh.receiveShadow = true;
    stepContainer.add(treadMesh);

    const spineBracket = new THREE.Mesh(
      new THREE.BoxGeometry(outerRadius - columnRadius - 0.08, 0.044, 0.052),
      oakHandrailMat
    );
    spineBracket.name = `outbuildings.barn.spiralStaircase.treadBracket.${i + 1}`;
    spineBracket.position.set(
      columnRadius + (outerRadius - columnRadius - 0.08) * 0.5,
      -0.022,
      0
    );
    spineBracket.castShadow = true;
    stepContainer.add(spineBracket);

    // Recessed under-tread LED channel & warm glowing LED strip along the leading edge of the tread underside
    const ledHolder = new THREE.Group();
    ledHolder.name = `outbuildings.barn.spiralStaircase.treadLedGroup.${i + 1}`;
    ledHolder.rotation.y = -ledLeadingAngle;
    stepContainer.add(ledHolder);

    const ledChannel = new THREE.Mesh(ledChannelGeo, ledChannelMat);
    ledChannel.name = `outbuildings.barn.spiralStaircase.treadLedChannel.${i + 1}`;
    ledChannel.position.set(ledRadialCenter, -0.003, 0);
    ledHolder.add(ledChannel);

    const ledStrip = new THREE.Mesh(ledDiffuserGeo, treadLedMat);
    ledStrip.name = 'outbuildings.barn.spiralStaircase.treadLedStrip';
    ledStrip.position.set(ledRadialCenter, -0.006, 0);
    ledHolder.add(ledStrip);
  }

  // Warm vertical illumination PointLights along the spiral staircase column for under-tread LED wash
  for (const [lIdx, ly] of [
    [1, totalRise * 0.35],
    [2, totalRise * 0.78],
  ] as const) {
    const stairGlowLight = new THREE.PointLight(0xffc668, 1.15, 3.2, 1.6);
    stairGlowLight.name = `outbuildings.barn.spiralStaircase.treadLedLight.${lIdx}`;
    stairGlowLight.position.set(0, ly, 0);
    stairGroup.add(stairGlowLight);
  }

  // ---------------------------------------------------------------------------
  // 3. Issue #1 ("THis piece of landing should be the same floor as the rest of the mezzanine,
  //    continuous too not a separate piece." at `[-0.72, 1.545, 18.335]`):
  //    The top landing sector (`u = 21.14..22.04m, v = 3.56..4.94m`) is now extruded directly as part
  //    of the single continuous `outbuildings.firstFloor.westRoomSlab` floor mesh in `outbuildings-and-barns.ts`
  //    (using `mezzaninePlankFloorMat` and continuous world-space plank UVs), eliminating any separate landing piece or seam!
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 4. Curved Helical Laminated Solid-Oak Outer Stringer Ribbon (`outbuildings.barn.spiralStaircase.outerStringer`)
  // ---------------------------------------------------------------------------
  const stringerGroup = new THREE.Group();
  stringerGroup.name = 'outbuildings.barn.spiralStaircase.outerStringer';
  stairGroup.add(stringerGroup);

  const stringerRadius = outerRadius - 0.006;
  const stringerThetaMin = thetaStart - halfSweep * 0.85;
  const stringerThetaMax = thetaEnd + halfSweep * 0.55;
  const stringerSegs = 64;
  const stringerHalfH = 0.115;
  const stringerThickR = 0.028;

  const strPositions: number[] = [];
  const strNormals: number[] = [];
  const strUvs: number[] = [];
  const strIndices: number[] = [];

  const pushQuad = (
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    p2: readonly [number, number, number],
    p3: readonly [number, number, number],
    nx: number,
    ny: number,
    nz: number,
    u0: number,
    u1: number
  ): void => {
    const base = strPositions.length / 3;
    strPositions.push(
      p0[0], p0[1], p0[2],
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
      p3[0], p3[1], p3[2]
    );
    for (let k = 0; k < 4; k++) {
      strNormals.push(nx, ny, nz);
    }
    strUvs.push(u0, 0, u1, 0, u1, 1, u0, 1);
    strIndices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const rIn = stringerRadius - stringerThickR * 0.5;
  const rOut = stringerRadius + stringerThickR * 0.5;
  const yStringerStart = riserH * 0.65;
  const yStringerEnd = totalRise - 0.02;

  for (let s = 0; s < stringerSegs; s++) {
    const t0 = s / stringerSegs;
    const t1 = (s + 1) / stringerSegs;
    const a0 = stringerThetaMin + t0 * (stringerThetaMax - stringerThetaMin);
    const a1 = stringerThetaMin + t1 * (stringerThetaMax - stringerThetaMin);
    const yc0 = yStringerStart + t0 * (yStringerEnd - yStringerStart);
    const yc1 = yStringerStart + t1 * (yStringerEnd - yStringerStart);

    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);
    const cm = Math.cos((a0 + a1) * 0.5);
    const sm = Math.sin((a0 + a1) * 0.5);

    const outBot0: [number, number, number] = [rOut * c0, yc0 - stringerHalfH, rOut * s0];
    const outBot1: [number, number, number] = [rOut * c1, yc1 - stringerHalfH, rOut * s1];
    const outTop1: [number, number, number] = [rOut * c1, yc1 + stringerHalfH, rOut * s1];
    const outTop0: [number, number, number] = [rOut * c0, yc0 + stringerHalfH, rOut * s0];

    const inBot0: [number, number, number] = [rIn * c0, yc0 - stringerHalfH, rIn * s0];
    const inBot1: [number, number, number] = [rIn * c1, yc1 - stringerHalfH, rIn * s1];
    const inTop1: [number, number, number] = [rIn * c1, yc1 + stringerHalfH, rIn * s1];
    const inTop0: [number, number, number] = [rIn * c0, yc0 + stringerHalfH, rIn * s0];

    pushQuad(outBot0, outBot1, outTop1, outTop0, cm, 0, sm, t0 * 6, t1 * 6);
    pushQuad(inBot1, inBot0, inTop0, inTop1, -cm, 0, -sm, t0 * 6, t1 * 6);
    pushQuad(inTop0, outTop0, outTop1, inTop1, 0, 1, 0, t0 * 6, t1 * 6);
    pushQuad(outBot0, inBot0, inBot1, outBot1, 0, -1, 0, t0 * 6, t1 * 6);
  }

  const stringerRibbonGeo = new THREE.BufferGeometry();
  stringerRibbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(strPositions, 3));
  stringerRibbonGeo.setAttribute('normal', new THREE.Float32BufferAttribute(strNormals, 3));
  stringerRibbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(strUvs, 2));
  stringerRibbonGeo.setIndex(strIndices);
  stringerRibbonGeo.computeBoundingSphere();

  const stringerRibbonMesh = new THREE.Mesh(stringerRibbonGeo, oakHandrailMat);
  stringerRibbonMesh.name = 'outbuildings.barn.spiralStaircase.outerStringer';
  stringerRibbonMesh.castShadow = true;
  stringerRibbonMesh.receiveShadow = true;
  stringerGroup.add(stringerRibbonMesh);

  for (const yOffset of [-stringerHalfH, stringerHalfH] as const) {
    const beadPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 40; s++) {
      const t = s / 40;
      const a = stringerThetaMin + t * (stringerThetaMax - stringerThetaMin);
      const yc = yStringerStart + t * (yStringerEnd - yStringerStart) + yOffset;
      beadPts.push(new THREE.Vector3(rOut * Math.cos(a), yc, rOut * Math.sin(a)));
    }
    const beadCurve = new THREE.CatmullRomCurve3(beadPts);
    const beadMesh = new THREE.Mesh(
      new THREE.TubeGeometry(beadCurve, 56, 0.011, 10, false),
      oakHandrailMat
    );
    beadMesh.name = 'outbuildings.barn.spiralStaircase.outerStringer';
    stringerGroup.add(beadMesh);
  }

  // ---------------------------------------------------------------------------
  // 5. Continuous Helical Solid American White Oak Handrail (`outbuildings.barn.spiralStaircase.handrail`)
  //    & Curved Toughened Glass Banister Panels (`outbuildings.barn.spiralStaircase.glassBanister` — Issue #3!)
  // ---------------------------------------------------------------------------
  const glassBanisterMat = new THREE.MeshStandardMaterial({
    color: 0xd8eef5,
    roughness: 0.06,
    metalness: 0.12,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
  });
  const glassEdgeTintMat = new THREE.MeshStandardMaterial({
    color: 0x8fd4c1,
    roughness: 0.14,
    metalness: 0.18,
    transparent: true,
    opacity: 0.62,
  });
  const stainlessClampMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.2,
    metalness: 0.9,
  });

  const handrailRadius = 0.835;
  const handrailHeightAboveTread = 0.86;
  const handrailCurvePoints: THREE.Vector3[] = [];

  const voluteCenterTheta = thetaStart - 0.11;
  const voluteCenterR = handrailRadius - 0.065;
  const voluteY = riserH + handrailHeightAboveTread - 0.04;
  const voluteCenterX = voluteCenterR * Math.cos(voluteCenterTheta);
  const voluteCenterZ = voluteCenterR * Math.sin(voluteCenterTheta);

  for (let v = 0; v < 6; v++) {
    const vt = v / 5;
    const spiralAng = voluteCenterTheta + Math.PI * 1.35 * (1 - vt);
    const spiralR = 0.018 + vt * 0.062;
    handrailCurvePoints.push(
      new THREE.Vector3(
        voluteCenterX + spiralR * Math.cos(spiralAng),
        voluteY - (1 - vt) * 0.015,
        voluteCenterZ + spiralR * Math.sin(spiralAng)
      )
    );
  }

  const climbSamples = 32;
  for (let k = 0; k <= climbSamples; k++) {
    const t = k / climbSamples;
    const a = thetaStart + t * (thetaEnd - thetaStart);
    const treadY = riserH + t * (totalRise - riserH);
    handrailCurvePoints.push(
      new THREE.Vector3(
        handrailRadius * Math.cos(a),
        treadY + handrailHeightAboveTread,
        handrailRadius * Math.sin(a)
      )
    );
  }

  // Smooth tangent transition from `thetaEnd = 147.6°` (`x = -0.705, z = +0.447`) directly into the shared
  // top landing newel post at `(x = -0.96, z = +0.35)` (`u = 21.12m, v = 4.85m, y = mezzanineFloorY + 0.86m`)
  handrailCurvePoints.push(
    new THREE.Vector3(-0.83, totalRise + handrailHeightAboveTread, 0.39),
    new THREE.Vector3(-0.96, totalRise + handrailHeightAboveTread, 0.35)
  );

  const handrailCurve = new THREE.CatmullRomCurve3(handrailCurvePoints);
  const handrailTubeGeo = new THREE.TubeGeometry(handrailCurve, 120, 0.026, 16, false);
  const handrailMesh = new THREE.Mesh(handrailTubeGeo, oakHandrailMat);
  handrailMesh.name = 'outbuildings.barn.spiralStaircase.handrail';
  handrailMesh.castShadow = true;
  handrailMesh.receiveShadow = true;
  stairGroup.add(handrailMesh);

  const voluteEyeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.034, 0.048, 20),
    oakHandrailMat
  );
  voluteEyeCap.name = 'outbuildings.barn.spiralStaircase.handrail';
  voluteEyeCap.position.set(voluteCenterX, voluteY - 0.008, voluteCenterZ);
  voluteEyeCap.castShadow = true;
  stairGroup.add(voluteEyeCap);

  const bottomNewelBaseY = riserH * 0.85;
  const bottomNewelH = voluteY - bottomNewelBaseY;
  const bottomNewel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, bottomNewelH, 20),
    oakHandrailMat
  );
  bottomNewel.name = 'outbuildings.barn.spiralStaircase.newelPost';
  bottomNewel.position.set(
    voluteCenterX,
    bottomNewelBaseY + bottomNewelH * 0.5,
    voluteCenterZ
  );
  bottomNewel.castShadow = true;
  stairGroup.add(bottomNewel);

  // Shared top landing turned cylindrical newel post at `(-0.96, z = 0.35)` -> `(u = 21.12m, v = 4.85m)`
  const topNewelH = 0.92;
  const topNewel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.038, topNewelH, 20),
    oakHandrailMat
  );
  topNewel.name = 'outbuildings.barn.spiralStaircase.newelPost';
  topNewel.position.set(-0.96, totalRise + topNewelH * 0.5, 0.35);
  topNewel.castShadow = true;
  topLandingGroup.add(topNewel);

  const topNewelCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 16, 12),
    oakHandrailMat
  );
  topNewelCap.name = 'outbuildings.barn.spiralStaircase.newelPost.cap';
  topNewelCap.position.set(-0.96, totalRise + topNewelH + 0.014, 0.35);
  topLandingGroup.add(topNewelCap);

  // Issue #3 ("Glass banniesters (see the link I sent)" at `[0.916, 0.734, 19.272]`):
  // Build 6 Curved Helical Toughened Clear Glass Balustrade Panels (`outbuildings.barn.spiralStaircase.glassBanister`)
  // rising from the outer oak stringer/treads (`r = handrailRadius = 0.835m`) up into the underside of the helical
  // solid American white oak handrail, secured with brushed stainless-steel cylindrical glass stand-off clamps (`glassClamp`)!
  const numGlassPanels = 6;
  const panelGapRad = 0.018;
  const totalThetaSpan = thetaEnd - thetaStart;
  const glassThickR = 0.014;
  const gRIn = handrailRadius - glassThickR * 0.5;
  const gROut = handrailRadius + glassThickR * 0.5;

  for (let p = 0; p < numGlassPanels; p++) {
    const tPanel0 = p / numGlassPanels;
    const tPanel1 = (p + 1) / numGlassPanels;
    const aPanelStart = thetaStart + tPanel0 * totalThetaSpan + panelGapRad * 0.5;
    const aPanelEnd = thetaStart + tPanel1 * totalThetaSpan - panelGapRad * 0.5;

    const panelSegs = 16;
    const gPositions: number[] = [];
    const gNormals: number[] = [];
    const gUvs: number[] = [];
    const gIndices: number[] = [];

    const pushGlassQuad = (
      p0: readonly [number, number, number],
      p1: readonly [number, number, number],
      p2: readonly [number, number, number],
      p3: readonly [number, number, number],
      nx: number,
      ny: number,
      nz: number,
      u0: number,
      u1: number
    ): void => {
      const base = gPositions.length / 3;
      gPositions.push(
        p0[0], p0[1], p0[2],
        p1[0], p1[1], p1[2],
        p2[0], p2[1], p2[2],
        p3[0], p3[1], p3[2]
      );
      for (let k = 0; k < 4; k++) {
        gNormals.push(nx, ny, nz);
      }
      gUvs.push(u0, 0, u1, 0, u1, 1, u0, 1);
      gIndices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    for (let s = 0; s < panelSegs; s++) {
      const s0 = s / panelSegs;
      const s1 = (s + 1) / panelSegs;
      const a0 = aPanelStart + s0 * (aPanelEnd - aPanelStart);
      const a1 = aPanelStart + s1 * (aPanelEnd - aPanelStart);
      const gt0 = (a0 - thetaStart) / totalThetaSpan;
      const gt1 = (a1 - thetaStart) / totalThetaSpan;

      const yBot0 = riserH * 0.72 + gt0 * (totalRise - riserH * 0.72) + 0.04;
      const yBot1 = riserH * 0.72 + gt1 * (totalRise - riserH * 0.72) + 0.04;
      const yTop0 = riserH + gt0 * (totalRise - riserH) + handrailHeightAboveTread - 0.022;
      const yTop1 = riserH + gt1 * (totalRise - riserH) + handrailHeightAboveTread - 0.022;

      const c0 = Math.cos(a0);
      const sn0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const sn1 = Math.sin(a1);
      const cm = Math.cos((a0 + a1) * 0.5);
      const snm = Math.sin((a0 + a1) * 0.5);

      const outBot0: [number, number, number] = [gROut * c0, yBot0, gROut * sn0];
      const outBot1: [number, number, number] = [gROut * c1, yBot1, gROut * sn1];
      const outTop1: [number, number, number] = [gROut * c1, yTop1, gROut * sn1];
      const outTop0: [number, number, number] = [gROut * c0, yTop0, gROut * sn0];

      const inBot0: [number, number, number] = [gRIn * c0, yBot0, gRIn * sn0];
      const inBot1: [number, number, number] = [gRIn * c1, yBot1, gRIn * sn1];
      const inTop1: [number, number, number] = [gRIn * c1, yTop1, gRIn * sn1];
      const inTop0: [number, number, number] = [gRIn * c0, yTop0, gRIn * sn0];

      pushGlassQuad(outBot0, outBot1, outTop1, outTop0, cm, 0, snm, s0, s1);
      pushGlassQuad(inBot1, inBot0, inTop0, inTop1, -cm, 0, -snm, s0, s1);
      pushGlassQuad(inTop0, outTop0, outTop1, inTop1, 0, 1, 0, s0, s1);
      pushGlassQuad(outBot0, inBot0, inBot1, outBot1, 0, -1, 0, s0, s1);
    }

    const glassGeo = new THREE.BufferGeometry();
    glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPositions, 3));
    glassGeo.setAttribute('normal', new THREE.Float32BufferAttribute(gNormals, 3));
    glassGeo.setAttribute('uv', new THREE.Float32BufferAttribute(gUvs, 2));
    glassGeo.setIndex(gIndices);
    glassGeo.computeBoundingSphere();

    const glassPanelMesh = new THREE.Mesh(glassGeo, glassBanisterMat);
    glassPanelMesh.name = 'outbuildings.barn.spiralStaircase.glassBanister';
    stairGroup.add(glassPanelMesh);

    // Polished green-tinted vertical toughened glass edge strips at start and end of each curved glass panel
    for (const edgeAng of [aPanelStart, aPanelEnd] as const) {
      const gt = (edgeAng - thetaStart) / totalThetaSpan;
      const yBot = riserH * 0.72 + gt * (totalRise - riserH * 0.72) + 0.04;
      const yTop = riserH + gt * (totalRise - riserH) + handrailHeightAboveTread - 0.022;
      const edgeH = yTop - yBot;
      const edgeStrip = new THREE.Mesh(
        new THREE.BoxGeometry(glassThickR, edgeH, 0.005),
        glassEdgeTintMat
      );
      edgeStrip.name = 'outbuildings.barn.spiralStaircase.glassBanister.edgeStrip';
      edgeStrip.position.set(
        handrailRadius * Math.cos(edgeAng),
        yBot + edgeH * 0.5,
        handrailRadius * Math.sin(edgeAng)
      );
      edgeStrip.rotation.y = -edgeAng;
      stairGroup.add(edgeStrip);
    }

    // 4 Brushed Stainless-Steel Cylindrical Glass Stand-Off Spigot Clamps per curved glass panel (2 bottom stringer + 2 top handrail)
    for (const clampFrac of [0.18, 0.82] as const) {
      const ca = aPanelStart + clampFrac * (aPanelEnd - aPanelStart);
      const gt = (ca - thetaStart) / totalThetaSpan;
      const yBotClamp = riserH * 0.72 + gt * (totalRise - riserH * 0.72) + 0.075;
      const yTopClamp = riserH + gt * (totalRise - riserH) + handrailHeightAboveTread - 0.065;

      for (const cy of [yBotClamp, yTopClamp] as const) {
        const clampMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
          stainlessClampMat
        );
        clampMesh.name = 'outbuildings.barn.spiralStaircase.glassClamp';
        clampMesh.position.set(
          handrailRadius * Math.cos(ca),
          cy,
          handrailRadius * Math.sin(ca)
        );
        clampMesh.rotation.z = Math.PI / 2;
        clampMesh.rotation.y = -ca;
        stairGroup.add(clampMesh);
      }
    }
  }

  // Top landing return glass banister panel bridging along the tangent from `(-0.705, 0.447)` to the shared newel post `(-0.96, 0.35)`
  const topReturnGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.74, glassThickR),
    glassBanisterMat
  );
  topReturnGlass.name = 'outbuildings.barn.spiralStaircase.glassBanister';
  topReturnGlass.position.set(-0.832, totalRise + 0.45, 0.398);
  topReturnGlass.rotation.y = -0.363;
  stairGroup.add(topReturnGlass);

  for (const grp of [stairGroup, topLandingGroup]) {
    grp.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingSphere();
      }
    });
  }
}
