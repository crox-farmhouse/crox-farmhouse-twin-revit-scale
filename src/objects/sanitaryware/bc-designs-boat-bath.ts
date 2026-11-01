import * as THREE from 'three';
import {
  finalizeSanitaryGroup,
  getAcrymiteWhiteMaterial,
  getBathroomBrassMaterials,
  getBurnishedCopperMaterials,
  prepGeo,
} from './bathroom-materials.ts';
import type { BcDesignsCopperBoatBathOptions } from './bathroom-spec-types.ts';

/**
 * BC Designs Copper / Gloss-White `Acrymite` Double-Ended Roll-Top Boat Bath
 * (`lengthM = 1.580`, `widthM = 0.735`, `endHeightM = 0.715`, `centerHeightM = 0.605`, 0 tap holes)
 * paired with the `WAS050G` brass click-clack waste & exposed external overflow standpipe.
 *
 * Local coordinate convention:
 * - `(0, 0, 0)` at plan centre on finished floor (`y = 0`)
 * - Bath length along `X` (`-lengthM/2 .. +lengthM/2`), width along `Z` (`-widthM/2 .. +widthM/2`)
 */

const SUPERELLIPSE_EXP = 2.32; // fuller shoulders than a pure ellipse, authentic boat-bath plan

function signedPow(val: number, exp: number): number {
  return val < 0 ? -Math.pow(-val, exp) : Math.pow(val, exp);
}

/** Unit superellipse point `(cx, cz) ∈ [-1, 1]^2` for angle `theta ∈ [0, 2π]`. */
function boatPlanUnit(theta: number): { readonly cx: number; readonly cz: number } {
  const p = 2 / SUPERELLIPSE_EXP;
  return {
    cx: signedPow(Math.cos(theta), p),
    cz: signedPow(Math.sin(theta), p),
  };
}

/** Smoothly averages seam normals at `i = 0` and `i = radialSegs` on closed revolution/ring meshes. */
function healRingSeamNormals(
  geo: THREE.BufferGeometry,
  ringCount: number,
  radialSegs: number
): void {
  geo.computeVertexNormals();
  const nAttr = geo.attributes['normal'] as THREE.BufferAttribute | undefined;
  if (!nAttr) return;
  const stride = radialSegs + 1;
  for (let s = 0; s < ringCount; s++) {
    const i0 = s * stride;
    const iN = s * stride + radialSegs;
    const nx = nAttr.getX(i0) + nAttr.getX(iN);
    const ny = nAttr.getY(i0) + nAttr.getY(iN);
    const nz = nAttr.getZ(i0) + nAttr.getZ(iN);
    const len = Math.hypot(nx, ny, nz) || 1;
    nAttr.setXYZ(i0, nx / len, ny / len, nz / len);
    nAttr.setXYZ(iN, nx / len, ny / len, nz / len);
  }
  nAttr.needsUpdate = true;
}

interface RingSpec {
  readonly a: number;
  readonly b: number;
  /** Computes `y` for a vertex with normalized longitudinal coordinate `cx ∈ [-1, 1]`. */
  readonly yAt: (cx: number) => number;
  readonly vUv: number;
}

function buildRingLoftGeometry(rings: readonly RingSpec[], radialSegs: number): THREE.BufferGeometry {
  const stride = radialSegs + 1;
  const vertCount = rings.length * stride;
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= radialSegs; i++) {
    const u = i / radialSegs;
    const theta = u * Math.PI * 2;
    const { cx, cz } = boatPlanUnit(theta);

    for (let s = 0; s < rings.length; s++) {
      const ring = rings[s]!;
      const idx = s * stride + i;
      positions[idx * 3] = ring.a * cx;
      positions[idx * 3 + 1] = ring.yAt(cx);
      positions[idx * 3 + 2] = ring.b * cz;

      uvs[idx * 2] = u * 2;
      uvs[idx * 2 + 1] = ring.vUv;
    }
  }

  for (let s = 0; s < rings.length - 1; s++) {
    for (let i = 0; i < radialSegs; i++) {
      const i00 = s * stride + i;
      const i10 = (s + 1) * stride + i;
      const i01 = s * stride + (i + 1);
      const i11 = (s + 1) * stride + (i + 1);
      indices.push(i00, i10, i01, i01, i10, i11);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  healRingSeamNormals(geo, rings.length, radialSegs);
  return prepGeo(geo);
}

export function buildBcDesignsCopperBoatBath(
  opts: BcDesignsCopperBoatBathOptions
): THREE.Group {
  const p = opts.namePrefix;
  const lengthM = opts.lengthM ?? 1.580;
  const widthM = opts.widthM ?? 0.735;
  const endHeightM = opts.endHeightM ?? 0.715;
  const centerHeightM = opts.centerHeightM ?? 0.605;
  const brassFinish = opts.brassFinish ?? 'BR';
  const overflowEnd = opts.overflowEnd ?? 'west';

  const copperMats = getBurnishedCopperMaterials();
  const acrymiteMat = getAcrymiteWhiteMaterial();
  const brassMats = getBathroomBrassMaterials(brassFinish);

  const group = new THREE.Group();
  group.name = p;

  const aMax = lengthM * 0.5;
  const bMax = widthM * 0.5;
  const sheerRise = endHeightM - centerHeightM;
  const yRimAt = (cx: number): number => {
    const u2 = cx * cx;
    return centerHeightM + sheerRise * (0.86 * u2 + 0.14 * u2 * u2);
  };

  const radialSegs = 80;
  const plinthTopY = 0.105;
  const floorWellY = 0.135;

  // --- 1. Integral Moulded Patinated Copper Plinth Skirt (y = 0 .. 0.105m) ---
  const aPlinth = aMax * 0.765;
  const bPlinth = bMax * 0.815;
  const plinthRings: RingSpec[] = [
    { a: 0, b: 0, yAt: () => 0, vUv: 0.0 },
    { a: aPlinth - 0.008, b: bPlinth - 0.008, yAt: () => 0, vUv: 0.15 },
    { a: aPlinth, b: bPlinth, yAt: () => 0.006, vUv: 0.22 },
    { a: aPlinth, b: bPlinth, yAt: () => 0.078, vUv: 0.72 },
    // Stepped ogee moulding bead at top of plinth skirt
    { a: aPlinth + 0.010, b: bPlinth + 0.008, yAt: () => 0.090, vUv: 0.84 },
    { a: aPlinth + 0.010, b: bPlinth + 0.008, yAt: () => 0.100, vUv: 0.92 },
    { a: aPlinth - 0.006, b: bPlinth - 0.006, yAt: () => plinthTopY + 0.004, vUv: 1.0 },
  ];
  const plinthMesh = new THREE.Mesh(
    buildRingLoftGeometry(plinthRings, radialSegs),
    copperMats.plinth
  );
  plinthMesh.name = `${p}.copperPlinth`;
  group.add(plinthMesh);

  // --- 2. Outer Burnished Copper Boat Hull Shell (y = 0.102m .. under-lip of roll rim) ---
  const hullSteps = 14;
  const hullRings: RingSpec[] = [];
  const aHullBase = aPlinth - 0.002;
  const bHullBase = bPlinth - 0.002;
  const aHullNeck = aMax - 0.008;
  const bHullNeck = bMax - 0.008;

  for (let k = 0; k <= hullSteps; k++) {
    const t = k / hullSteps; // 0 = base chine (0.102m), 1 = neck just under rolled rim
    // Graceful convex S-flare toward sweeping boat prow & beam
    const easeR = 1 - Math.pow(1 - t, 1.65);
    const a = aHullBase + (aHullNeck - aHullBase) * easeR;
    const b = bHullBase + (bHullNeck - bHullBase) * easeR;
    hullRings.push({
      a,
      b,
      yAt: (cx) => {
        const topNeckY = yRimAt(cx) - 0.022;
        return 0.102 + (topNeckY - 0.102) * t;
      },
      vUv: t * 0.92,
    });
  }
  // Outer lower quarter of rolled bead meeting white Acrymite rim cleanly without Z-fighting
  hullRings.push({
    a: aMax - 0.0015,
    b: bMax - 0.0015,
    yAt: (cx) => yRimAt(cx) - 0.0145,
    vUv: 1.0,
  });

  const copperShellMesh = new THREE.Mesh(
    buildRingLoftGeometry(hullRings, radialSegs),
    copperMats.shell
  );
  copperShellMesh.name = `${p}.copperOuterShell`;
  group.add(copperShellMesh);

  // --- 3. Inner Gloss-White `Acrymite` Bowl & Continuous 0-Tap-Hole Rolled Rim ---
  const rimWidth = 0.034; // 34mm rolled rim lip
  const rimHalf = rimWidth * 0.5;
  const rimDrop = 0.014;
  const aInnerTop = aMax - rimWidth;
  const bInnerTop = bMax - rimWidth;
  const aInnerFloor = aMax * 0.535; // generous reclining boat backrests at ±X
  const bInnerFloor = bMax * 0.685;

  const innerRings: RingSpec[] = [];

  // Rolled rim profile: outer equator (aMax, bMax) -> crest (yRimAt) -> inner lip (aInnerTop, bInnerTop)
  const rollSegs = 8;
  for (let k = 0; k <= rollSegs; k++) {
    const phi = (k / rollSegs) * Math.PI; // 0 = outer lip edge, π/2 = exact rim crest, π = inner lip
    const cosP = Math.cos(phi); // +1 .. -1
    const sinP = Math.sin(phi); // 0 -> +1 -> 0
    const rOffset = rimHalf * (1 - cosP); // 0 -> rimHalf -> rimWidth
    innerRings.push({
      a: aMax - rOffset,
      b: bMax - rOffset,
      yAt: (cx) => yRimAt(cx) - rimDrop * (1 - sinP),
      vUv: (k / rollSegs) * 0.18,
    });
  }

  // Sloped interior backrest & side walls descending to coved floor well (strictly >=28mm inside outer copper hull)
  const bowlSteps = 14;
  for (let k = 1; k <= bowlSteps; k++) {
    const t = k / bowlSteps; // 0 = inner rim lip, 1 = floor cove tangent
    // Smooth ergonomic lumbar/backrest curve + bottom cove radius
    const wallRFrac = Math.pow(1 - t, 1.22);
    const yDropFrac = 1 - Math.pow(1 - t, 1.45);
    const a = aInnerFloor + (aInnerTop - aInnerFloor) * wallRFrac;
    const b = bInnerFloor + (bInnerTop - bInnerFloor) * wallRFrac;
    innerRings.push({
      a,
      b,
      yAt: (cx) => {
        const startY = yRimAt(cx) - rimDrop;
        return startY + (floorWellY - startY) * yDropFrac;
      },
      vUv: 0.18 + t * 0.62,
    });
  }

  // Flat standing/sitting floor well closing cleanly to central waste aperture
  innerRings.push(
    { a: aInnerFloor * 0.55, b: bInnerFloor * 0.55, yAt: () => floorWellY - 0.0015, vUv: 0.90 },
    { a: 0.025, b: 0.025, yAt: () => floorWellY - 0.003, vUv: 0.98 },
    { a: 0, b: 0, yAt: () => floorWellY - 0.003, vUv: 1.0 }
  );

  const innerBowlMesh = new THREE.Mesh(
    buildRingLoftGeometry(innerRings, radialSegs),
    acrymiteMat
  );
  innerBowlMesh.name = `${p}.acrymiteInnerBowl`;
  group.add(innerBowlMesh);

  // --- 4. WAS050G Brass Click-Clack Waste & External Vertical Overflow Standpipe ---
  const wasteGroup = new THREE.Group();
  wasteGroup.name = `${p}.wasteAndOverflow`;
  group.add(wasteGroup);

  // Central Ø70mm brass waste flange + dark drainage slot + Ø50mm raised click-clack dome plug
  const wasteFlange = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.0035, 32)),
    brassMats.primary
  );
  wasteFlange.name = `${p}.wasteAndOverflow.wasteFlange`;
  wasteFlange.position.set(0, floorWellY - 0.001, 0);
  wasteGroup.add(wasteFlange);

  const wasteGap = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.0285, 0.0285, 0.004, 28)),
    brassMats.darkShadow
  );
  wasteGap.name = `${p}.wasteAndOverflow.wasteDrainSlot`;
  wasteGap.position.set(0, floorWellY, 0);
  wasteGroup.add(wasteGap);

  const clickPlugPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.025, 0),
    new THREE.Vector2(0.025, 0.004),
    new THREE.Vector2(0.018, 0.0075),
    new THREE.Vector2(0, 0.009),
  ];
  const wastePlug = new THREE.Mesh(
    prepGeo(new THREE.LatheGeometry(clickPlugPts, 32)),
    brassMats.primary
  );
  wastePlug.name = `${p}.wasteAndOverflow.clickClackPlug`;
  wastePlug.position.set(0, floorWellY + 0.0015, 0);
  wasteGroup.add(wastePlug);

  // Overflow at upper end wall (`overflowEnd`: `'west'` = -X, `'east'` = +X)
  const signX = overflowEnd === 'east' ? 1 : -1;
  const endRimY = endHeightM;
  const overflowY = Math.min(endRimY - 0.145, centerHeightM - 0.045);

  // Compute exact interior white backrest X & slope angle at y = overflowY (z = 0, cx = signX)
  const startEndY = endRimY - rimDrop;
  const yDropTarget = (overflowY - startEndY) / (floorWellY - startEndY); // in (0, 1)
  const oneMinusT = Math.pow(Math.max(0.02, 1 - yDropTarget), 1 / 1.45);
  const wallRFracOv = Math.pow(oneMinusT, 1.22);
  const xInnerAbs = aInnerFloor + (aInnerTop - aInnerFloor) * wallRFracOv;
  // Local slope dx/dy along backrest so overflow rose sits flush against interior slope
  const dyDt = -(floorWellY - startEndY) * 1.45 * Math.pow(oneMinusT, 0.45);
  const daDt = -(aInnerTop - aInnerFloor) * 1.22 * Math.pow(oneMinusT, 0.22);
  const backrestTiltZ = Math.atan2(Math.abs(daDt), Math.abs(dyDt));

  const internalOverflowGroup = new THREE.Group();
  internalOverflowGroup.name = `${p}.wasteAndOverflow.internalOverflowRose`;
  internalOverflowGroup.position.set(signX * (xInnerAbs - 0.002), overflowY, 0);
  // Rotate local +Y to point inward into tub normal: (-signX * cos, +sin, 0)
  internalOverflowGroup.rotation.z = signX * (Math.PI * 0.5 - backrestTiltZ);
  wasteGroup.add(internalOverflowGroup);

  const ovOuterRing = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.031, 0.031, 0.005, 28)),
    brassMats.knurled
  );
  ovOuterRing.name = `${p}.wasteAndOverflow.internalOverflowRose.knurledBezel`;
  ovOuterRing.position.y = 0.0025;
  internalOverflowGroup.add(ovOuterRing);

  const ovSlotShadow = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.0055, 24)),
    brassMats.darkShadow
  );
  ovSlotShadow.name = `${p}.wasteAndOverflow.internalOverflowRose.slotShadow`;
  ovSlotShadow.position.y = 0.0026;
  internalOverflowGroup.add(ovSlotShadow);

  const ovFaceCap = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.021, 0.022, 0.006, 26)),
    brassMats.primary
  );
  ovFaceCap.name = `${p}.wasteAndOverflow.internalOverflowRose.cap`;
  ovFaceCap.position.y = 0.005;
  internalOverflowGroup.add(ovFaceCap);

  // Compute outer copper hull X at y = overflowY so external standpipe sits cleanly outside hull
  const topNeckEndY = endRimY - 0.022;
  const tHullOv = Math.max(0, Math.min(1, (overflowY - 0.102) / (topNeckEndY - 0.102)));
  const xOuterAbs =
    aHullBase + (aHullNeck - aHullBase) * (1 - Math.pow(1 - tHullOv, 1.65));
  // Standpipe axis tucked neatly under overhanging boat prow (outside copper hull, within ±aMax!)
  const pipeXAbs = Math.min(aMax - 0.030, Math.max(xOuterAbs + 0.034, aMax - 0.034));
  const pipeX = signX * pipeXAbs;

  // Horizontal through-hull banjo union & knurled compression nut at y = overflowY
  const unionLen = Math.max(0.024, pipeXAbs - xOuterAbs + 0.016);
  const hullUnion = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.015, 0.015, unionLen, 22)),
    brassMats.primary
  );
  hullUnion.name = `${p}.wasteAndOverflow.hullOverflowUnion`;
  hullUnion.rotation.z = Math.PI * 0.5;
  hullUnion.position.set(signX * (pipeXAbs - unionLen * 0.5), overflowY, 0);
  wasteGroup.add(hullUnion);

  const hullKnurlNut = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.012, 24)),
    brassMats.knurled
  );
  hullKnurlNut.name = `${p}.wasteAndOverflow.hullKnurledNut`;
  hullKnurlNut.rotation.z = Math.PI * 0.5;
  hullKnurlNut.position.set(signX * (xOuterAbs + 0.008), overflowY, 0);
  wasteGroup.add(hullKnurlNut);

  const teeJoint = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.021, 0.021, 0.038, 24)),
    brassMats.primary
  );
  teeJoint.name = `${p}.wasteAndOverflow.standpipeTee`;
  teeJoint.position.set(pipeX, overflowY, 0);
  wasteGroup.add(teeJoint);

  const teeTopCap = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.008, 24)),
    brassMats.knurled
  );
  teeTopCap.name = `${p}.wasteAndOverflow.standpipeTopCap`;
  teeTopCap.position.set(pipeX, overflowY + 0.022, 0);
  wasteGroup.add(teeTopCap);

  // Exposed Ø35mm (r = 0.0175m) vertical brass overflow standpipe descending to floor trap shroud
  const standpipeMesh = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.0175, 0.0175, overflowY, 24)),
    brassMats.primary
  );
  standpipeMesh.name = `${p}.wasteAndOverflow.externalOverflowPipe`;
  standpipeMesh.position.set(pipeX, overflowY * 0.5, 0);
  wasteGroup.add(standpipeMesh);

  // Floor trap collar shroud at (pipeX, 0, 0) (kept <= aMax so overall X envelope is exact lengthM)
  const trapCollarR = Math.min(0.030, aMax - pipeXAbs);
  const floorTrapShroud = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.022, trapCollarR, 0.022, 26)),
    brassMats.primary
  );
  floorTrapShroud.name = `${p}.wasteAndOverflow.floorTrapCollar`;
  floorTrapShroud.position.set(pipeX, 0.011, 0);
  wasteGroup.add(floorTrapShroud);

  const floorTrapNut = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.023, 0.023, 0.012, 24)),
    brassMats.knurled
  );
  floorTrapNut.name = `${p}.wasteAndOverflow.floorTrapKnurledNut`;
  floorTrapNut.position.set(pipeX, 0.028, 0);
  wasteGroup.add(floorTrapNut);

  // Horizontal lower return tail passing into plinth base toward waste trap
  const lowerTailLen = Math.max(0.04, pipeXAbs - aPlinth + 0.03);
  const lowerReturnPipe = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.016, 0.016, lowerTailLen, 20)),
    brassMats.primary
  );
  lowerReturnPipe.name = `${p}.wasteAndOverflow.trapReturnPipe`;
  lowerReturnPipe.rotation.z = Math.PI * 0.5;
  lowerReturnPipe.position.set(signX * (pipeXAbs - lowerTailLen * 0.5), 0.048, 0);
  wasteGroup.add(lowerReturnPipe);

  return finalizeSanitaryGroup(group, 'sanitary');
}
