import * as THREE from 'three';

/**
 * Sweeps a 2D moulding cross-section along a polyline drawn in a wall's vertical plane, with true mitred
 * joints at every kink (the classic "stringer capping" / "dado rail up a staircase" case).
 *
 * Coordinates:
 * - `profile` is drawn in (d, h): `d` is the projection out from the wall face (>= 0) and `h` is the offset
 *   perpendicular to the path, measured upward from the path line.
 * - `path` is a list of (a, y) points in the wall plane, where `a` runs along the wall and `y` is height.
 *   Points must be ordered by strictly increasing `a`.
 * - `toSpace(a, y, d)` maps a wall-plane point plus outward projection into the target 3D space.
 */
export function buildSweptMouldingGeometry(
  profile: THREE.Shape,
  path: ReadonlyArray<readonly [number, number]>,
  toSpace: (a: number, y: number, d: number) => THREE.Vector3,
  curveSegments = 6
): THREE.BufferGeometry {
  const segs: Array<{ p0: THREE.Vector2; t: THREE.Vector2; n: THREE.Vector2; len: number }> = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const [a0, y0] = path[i];
    const [a1, y1] = path[i + 1];
    const d = new THREE.Vector2(a1 - a0, y1 - y0);
    const len = d.length();
    const t = d.clone().divideScalar(len);
    segs.push({ p0: new THREE.Vector2(a0, y0), t, n: new THREE.Vector2(-t.y, t.x), len });
  }

  // Unit-depth extrusion of the profile: local (x, y, z) = (d, h, s) with s in [0, 1].
  const unit = new THREE.ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false, curveSegments });
  const unitFlat = unit.index ? unit.toNonIndexed() : unit;
  const src = unitFlat.getAttribute('position');
  const srcUv = unitFlat.getAttribute('uv');

  const positions: number[] = [];
  const uvs: number[] = [];
  const tmp = new THREE.Vector3();

  segs.forEach((seg, i) => {
    const prev = i > 0 ? segs[i - 1] : undefined;
    const next = i + 1 < segs.length ? segs[i + 1] : undefined;
    // Mitre shift along the path as a function of h (see derivation: plane normal = t_prev + t_next).
    const startK = prev ? -seg.n.dot(prev.t) / (1 + seg.t.dot(prev.t)) : 0;
    const endK = next ? -seg.n.dot(next.t) / (1 + seg.t.dot(next.t)) : 0;

    // Handedness of the (out, n, t) basis in the target space decides whether winding must flip.
    const o3 = toSpace(seg.p0.x, seg.p0.y, 1).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const n3 = toSpace(seg.p0.x + seg.n.x, seg.p0.y + seg.n.y, 0).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const t3 = toSpace(seg.p0.x + seg.t.x, seg.p0.y + seg.t.y, 0).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const flip = o3.dot(n3.clone().cross(t3)) < 0;

    for (let v = 0; v < src.count; v += 3) {
      const s0 = src.getZ(v);
      const s1 = src.getZ(v + 1);
      const s2 = src.getZ(v + 2);
      // Omit internal cap faces at intermediate mitred corners so only outer ends are capped.
      if (prev && s0 < 0.5 && s1 < 0.5 && s2 < 0.5) continue;
      if (next && s0 > 0.5 && s1 > 0.5 && s2 > 0.5) continue;
      const order = flip ? [v, v + 2, v + 1] : [v, v + 1, v + 2];
      for (const idx of order) {
        const d = src.getX(idx);
        const h = src.getY(idx);
        const s = src.getZ(idx);
        const along = s < 0.5 ? h * startK : seg.len + h * endK;
        const a = seg.p0.x + seg.t.x * along + seg.n.x * h;
        const y = seg.p0.y + seg.t.y * along + seg.n.y * h;
        tmp.copy(toSpace(a, y, d));
        positions.push(tmp.x, tmp.y, tmp.z);
        if (srcUv) {
          uvs.push(srcUv.getX(idx), srcUv.getY(idx) * (s < 0.5 ? 1 : seg.len));
        }
      }
    }
  });

  unit.dispose();
  if (unitFlat !== unit) unitFlat.dispose();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (uvs.length > 0) {
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Antique oak skirting-style capping profile (`d` = out from wall, `h` = up from the `0.122m` board top line):
 * steps inward from the `0.022m`-thick base board into a `0.0175m` torus roll, concave ogee/cove neck
 * (`0.011m`), and `0.008m` top fillet at `h = +0.024m` (total skirting/stringer height `0.146m`), matching
 * the Hall and Dining Room skirting boards.
 */
export function createSkirtingCapProfile(): THREE.Shape {
  const s = new THREE.Shape();
  // Starts at y = -0.027m (i.e. 0.095m above floor when path is at 0.122m) so the lower quirk,
  // cyma reversa ogee cove, and upper torus roll form a prominent 51mm-tall architectural moulding band!
  s.moveTo(0, -0.027);
  s.lineTo(0.022, -0.027);
  // Crisp 4.5mm recessed quirk step at 95mm height
  s.lineTo(0.0175, -0.025);
  s.lineTo(0.0175, -0.021);
  // Swept concave/convex cyma reversa ogee throat (-0.021m .. -0.004m)
  s.quadraticCurveTo(0.0195, -0.015, 0.0155, -0.009);
  s.quadraticCurveTo(0.0115, -0.005, 0.0135, -0.002);
  // Crisp fillet step into the projecting upper torus roll (-0.002m .. +0.014m)
  s.lineTo(0.0165, -0.001);
  s.quadraticCurveTo(0.0205, 0.006, 0.0165, 0.013);
  // Upper cavetto neck & top chamfered wall-return fillet (+0.013m .. +0.024m)
  s.quadraticCurveTo(0.011, 0.017, 0.0095, 0.021);
  s.lineTo(0.006, 0.024);
  s.lineTo(0, 0.024);
  s.closePath();
  return s;
}

/**
 * Drop-in 3D extruded Ogee/Torus skirting moulding cap geometry centered on its bounding box
 * (`span` along X when `isAlongX = true` or along Z when `isAlongX = false`, centered around
 * `y = floorY + 0.122 + 0.012`), with the sculpted moulding face oriented toward `inwardSign`.
 */
export function createProfiledSkirtingCapGeometry(
  span: number,
  isAlongX: boolean,
  inwardSign: 1 | -1
): THREE.BufferGeometry {
  // 24mm-tall (`y = 0..0.024m`) full Quirk + Ogee + Torus cap profile that sits ON TOP of a `0.122m`
  // lower plinth board (centered at `y = +0.012m` -> local `-0.012m..+0.012m`) so none of the Ogee cove
  // is buried inside the lower plinth box!
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.020, 0);
  // Crisp lower quirk step at top of plinth
  s.lineTo(0.016, 0.0015);
  s.lineTo(0.016, 0.004);
  // Swept concave/convex cyma reversa ogee throat (0.004m .. 0.013m)
  s.quadraticCurveTo(0.018, 0.007, 0.014, 0.010);
  s.quadraticCurveTo(0.010, 0.012, 0.012, 0.014);
  // Projecting upper torus bead roll (0.014m .. 0.020m)
  s.lineTo(0.015, 0.0145);
  s.quadraticCurveTo(0.0185, 0.0175, 0.0145, 0.0205);
  // Upper cavetto & chamfered wall-return fillet (0.0205m .. 0.024m)
  s.quadraticCurveTo(0.0095, 0.0225, 0.006, 0.024);
  s.lineTo(0, 0.024);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: span,
    bevelEnabled: false,
    curveSegments: 8,
  });
  // Center extrusion along Z (`-span/2 .. +span/2`), center Y around `0.012m`, and center X around `0.008m`
  geo.translate(-0.008, -0.012, -span * 0.5);
  if (isAlongX) {
    geo.rotateY(inwardSign > 0 ? -Math.PI / 2 : Math.PI / 2);
  } else if (inwardSign < 0) {
    geo.rotateY(Math.PI);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Full-height 146mm antique oak ogee/torus skirting board cross-section in `(y, h)`:
 * - `y` (first coordinate `d` in `buildSweptMouldingGeometry`) is vertical height above the floor (`0..0.146m`),
 * - `h` (second coordinate `h` in `buildSweptMouldingGeometry`) is horizontal projection out from the wall (`0..0.022m`).
 */
export function createWallSkirtingBoardProfile(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.003, -0.002);
  s.lineTo(-0.003, 0.022);
  // Flat lower plinth face (0 .. 95mm)
  s.lineTo(0.095, 0.022);
  // Crisp 4.5mm quirk step at 95mm height
  s.lineTo(0.097, 0.0175);
  s.lineTo(0.101, 0.0175);
  // Swept cyma reversa ogee curve (101mm .. 120mm)
  s.quadraticCurveTo(0.107, 0.0195, 0.113, 0.0155);
  s.quadraticCurveTo(0.117, 0.0115, 0.120, 0.0135);
  // Projecting upper torus roll (120mm .. 135mm)
  s.lineTo(0.121, 0.0165);
  s.quadraticCurveTo(0.128, 0.0205, 0.135, 0.0165);
  // Upper cavetto neck & top chamfered wall-return fillet (135mm .. 146mm)
  s.quadraticCurveTo(0.139, 0.011, 0.143, 0.0095);
  s.lineTo(0.146, 0.006);
  s.lineTo(0.146, -0.002);
  s.closePath();
  return s;
}

/**
 * Sweeps a 146mm-tall antique-profiled skirting board along a horizontal floor-plan polyline `path`
 * of `[x, z]` wall points (ordered so the room interior lies to the left of each segment tangent
 * `(dx, dz)`, i.e. outward normal `(-dz, dx)` points into the room), with true 45° mitred joints at
 * every internal and external corner.
 */
export function buildMitredWallSkirtingGeometry(
  path: ReadonlyArray<readonly [number, number]>,
  floorY = 0
): THREE.BufferGeometry {
  return buildSweptMouldingGeometry(
    createWallSkirtingBoardProfile(),
    path,
    (x, z, y) => new THREE.Vector3(x, floorY + y, z),
    8
  );
}

/**
 * Sweeps a 146mm-tall Ogee/Torus moulded skirting board along a horizontal floor-plan polyline `path`
 * of `[x, z]` wall points (ordered clockwise around the room interior so `(-dz, dx)` points into the room)
 * and returns one `THREE.BufferGeometry` per segment `i` (`path[i] -> path[i + 1]`), with true 45° mitred
 * joints at every shared vertex between consecutive segments.
 */
export function buildMitredWallSkirtingSegments(
  path: ReadonlyArray<readonly [number, number]>,
  floorY = 0,
  curveSegments = 8
): THREE.BufferGeometry[] {
  const profile = createWallSkirtingBoardProfile();
  const toSpace = (x: number, z: number, y: number): THREE.Vector3 =>
    new THREE.Vector3(x, floorY + y, z);

  const segs: Array<{ p0: THREE.Vector2; t: THREE.Vector2; n: THREE.Vector2; len: number }> = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const [a0, y0] = path[i]!;
    const [a1, y1] = path[i + 1]!;
    const d = new THREE.Vector2(a1 - a0, y1 - y0);
    const len = d.length();
    const t = d.clone().divideScalar(len || 1);
    segs.push({ p0: new THREE.Vector2(a0, y0), t, n: new THREE.Vector2(-t.y, t.x), len });
  }

  const unit = new THREE.ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false, curveSegments });
  const unitFlat = unit.index ? unit.toNonIndexed() : unit;
  const src = unitFlat.getAttribute('position');
  const srcUv = unitFlat.getAttribute('uv');
  const tmp = new THREE.Vector3();

  const result: THREE.BufferGeometry[] = [];
  segs.forEach((seg, i) => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const prev = i > 0 ? segs[i - 1] : undefined;
    const next = i + 1 < segs.length ? segs[i + 1] : undefined;
    const startK = prev ? -seg.n.dot(prev.t) / (1 + seg.t.dot(prev.t)) : 0;
    const endK = next ? -seg.n.dot(next.t) / (1 + seg.t.dot(next.t)) : 0;

    const o3 = toSpace(seg.p0.x, seg.p0.y, 1).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const n3 = toSpace(seg.p0.x + seg.n.x, seg.p0.y + seg.n.y, 0).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const t3 = toSpace(seg.p0.x + seg.t.x, seg.p0.y + seg.t.y, 0).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const flip = o3.dot(n3.clone().cross(t3)) < 0;

    for (let v = 0; v < src.count; v += 3) {
      const s0 = src.getZ(v);
      const s1 = src.getZ(v + 1);
      const s2 = src.getZ(v + 2);
      if (prev && s0 < 0.5 && s1 < 0.5 && s2 < 0.5) continue;
      if (next && s0 > 0.5 && s1 > 0.5 && s2 > 0.5) continue;
      const order = flip ? [v, v + 2, v + 1] : [v, v + 1, v + 2];
      for (const idx of order) {
        const d = src.getX(idx);
        const h = src.getY(idx);
        const s = src.getZ(idx);
        const along = s < 0.5 ? h * startK : seg.len + h * endK;
        const a = seg.p0.x + seg.t.x * along + seg.n.x * h;
        const y = seg.p0.y + seg.t.y * along + seg.n.y * h;
        tmp.copy(toSpace(a, y, d));
        positions.push(tmp.x, tmp.y, tmp.z);
        if (srcUv) {
          uvs.push(srcUv.getX(idx), srcUv.getY(idx) * (s < 0.5 ? 1 : seg.len));
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (uvs.length > 0) {
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    result.push(geo);
  });

  unit.dispose();
  if (unitFlat !== unit) unitFlat.dispose();
  return result;
}

/**
 * 92mm-wide antique oak ogee/torus doorway architrave cross-section in `(d, h)`:
 * - `d` is the projection out from the wall face (`0..0.035m`),
 * - `h` is the offset outward from the doorway sight-edge (`0..width`), with a flat inner fascia
 *   (`0..width - 0.026m` at `d = 0.035m`) stepping down via a `5.5mm` quirk, convex torus bead
 *   (`0.0315m`), concave ogee/cove neck (`0.0245m`), and `0.0225m` outer edge fillet matching
 *   the skirting board and stair stringer profile.
 */
export function createArchitraveProfile(width = 0.092, maxT = 0.022): THREE.Shape {
  // Architectural Ogee + Quirk + Torus architrave profile in `(d, h)` matching `createWallSkirtingBoardProfile()`:
  // - `d` is projection out from wall face (`0..maxT`),
  // - `h` is distance outward from the doorway sight-edge (`0..width`):
  //   * Inner flat band (`0 .. 0.44 * width`) at full projection `maxT`,
  //   * Crisp recessed quirk step (`0.44 * width .. 0.48 * width`),
  //   * Sweeping concave/convex cyma reversa Ogee throat (`0.48 * width .. 0.72 * width`),
  //   * Projecting Torus bead roll (`0.72 * width .. 0.88 * width`),
  //   * Outer cavetto & chamfered wall-return fillet (`0.88 * width .. width`).
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(maxT, 0);
  s.lineTo(maxT, width * 0.44);
  // Crisp recessed quirk step
  s.lineTo(maxT * 0.78, width * 0.46);
  s.lineTo(maxT * 0.78, width * 0.50);
  // Swept cyma reversa ogee throat
  s.quadraticCurveTo(maxT * 0.88, width * 0.56, maxT * 0.68, width * 0.63);
  s.quadraticCurveTo(maxT * 0.50, width * 0.68, maxT * 0.60, width * 0.72);
  // Projecting upper torus roll
  s.lineTo(maxT * 0.74, width * 0.73);
  s.quadraticCurveTo(maxT * 0.92, width * 0.80, maxT * 0.72, width * 0.87);
  // Outer cavetto & chamfered wall-return fillet
  s.quadraticCurveTo(maxT * 0.48, width * 0.93, maxT * 0.36, width * 0.97);
  s.lineTo(maxT * 0.22, width);
  s.lineTo(0, width);
  s.closePath();
  return s;
}

/**
 * Sweeps a 3-sided 45°-mitred Ogee/Torus doorway architrave (`[leftLeg, head, rightLeg]`)
 * along a doorway portal on a wall face (`axis = 'x'` means the opening spans X and the wall normal is Z;
 * `axis = 'z'` means the opening spans Z and the wall normal is X).
 */
export function buildMitredArchitraveSegments(
  uLeft: number,
  uRight: number,
  yLeftBot: number,
  yRightBot: number,
  yHead: number,
  axis: 'x' | 'z',
  wallFaceCoord: number,
  normalSign: 1 | -1,
  archW = 0.068,
  archT = 0.022,
  curveSegments = 8
): [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry] {
  const profile = createArchitraveProfile(archW, archT);
  const path: ReadonlyArray<readonly [number, number]> = [
    [uLeft, yLeftBot],
    [uLeft, yHead],
    [uRight, yHead],
    [uRight, yRightBot],
  ];
  const toSpace = (u: number, y: number, d: number): THREE.Vector3 =>
    axis === 'x'
      ? new THREE.Vector3(u, y, wallFaceCoord + normalSign * d)
      : new THREE.Vector3(wallFaceCoord + normalSign * d, y, u);

  const segs: Array<{ p0: THREE.Vector2; t: THREE.Vector2; n: THREE.Vector2; len: number }> = [];
  for (let i = 0; i + 1 < path.length; i++) {
    const [a0, y0] = path[i]!;
    const [a1, y1] = path[i + 1]!;
    const d = new THREE.Vector2(a1 - a0, y1 - y0);
    const len = d.length();
    const t = d.clone().divideScalar(len || 1);
    segs.push({ p0: new THREE.Vector2(a0, y0), t, n: new THREE.Vector2(-t.y, t.x), len });
  }

  const unit = new THREE.ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false, curveSegments });
  const unitFlat = unit.index ? unit.toNonIndexed() : unit;
  const src = unitFlat.getAttribute('position');
  const srcUv = unitFlat.getAttribute('uv');
  const tmp = new THREE.Vector3();

  const out: THREE.BufferGeometry[] = [];
  segs.forEach((seg, i) => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const prev = i > 0 ? segs[i - 1] : undefined;
    const next = i + 1 < segs.length ? segs[i + 1] : undefined;
    const startK = prev ? -seg.n.dot(prev.t) / (1 + seg.t.dot(prev.t)) : 0;
    const endK = next ? -seg.n.dot(next.t) / (1 + seg.t.dot(next.t)) : 0;

    const o3 = toSpace(seg.p0.x, seg.p0.y, 1).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const n3 = toSpace(seg.p0.x + seg.n.x, seg.p0.y + seg.n.y, 0).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const t3 = toSpace(seg.p0.x + seg.t.x, seg.p0.y + seg.t.y, 0).sub(toSpace(seg.p0.x, seg.p0.y, 0));
    const flip = o3.dot(n3.clone().cross(t3)) < 0;

    for (let v = 0; v < src.count; v += 3) {
      const s0 = src.getZ(v);
      const s1 = src.getZ(v + 1);
      const s2 = src.getZ(v + 2);
      if (prev && s0 < 0.5 && s1 < 0.5 && s2 < 0.5) continue;
      if (next && s0 > 0.5 && s1 > 0.5 && s2 > 0.5) continue;
      const order = flip ? [v, v + 2, v + 1] : [v, v + 1, v + 2];
      for (const idx of order) {
        const d = src.getX(idx);
        const h = src.getY(idx);
        const s = src.getZ(idx);
        const along = s < 0.5 ? h * startK : seg.len + h * endK;
        const a = seg.p0.x + seg.t.x * along + seg.n.x * h;
        const y = seg.p0.y + seg.t.y * along + seg.n.y * h;
        tmp.copy(toSpace(a, y, d));
        positions.push(tmp.x, tmp.y, tmp.z);
        if (srcUv) {
          uvs.push(srcUv.getX(idx), srcUv.getY(idx) * (s < 0.5 ? 1 : seg.len));
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (uvs.length > 0) {
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    out.push(geo);
  });

  unit.dispose();
  if (unitFlat !== unit) unitFlat.dispose();
  return [out[0]!, out[1]!, out[2]!];
}

export interface CasedArchitravePortalOptions {
  /** 'x' = opening runs along X (wall normal along Z); 'z' = opening runs along Z (wall normal along X). */
  axis: 'x' | 'z';
  /** Center coordinate of the wall along its normal axis (Z if `axis === 'x'`, X if `axis === 'z'`). */
  wallCoord: number;
  /** Thickness of the wall between its two faces. */
  wallThickness: number;
  /** Center coordinate of the doorway opening along `axis` (X if `axis === 'x'`, Z if `axis === 'z'`). */
  openingCenter: number;
  /** Clear width of the wall opening along `axis`. */
  openingWidth: number;
  /** Floor Y on the +normal face of the wall (+Z if `axis === 'x'`, +X if `axis === 'z'`). */
  frontFloorY: number;
  /** Floor Y on the -normal face of the wall (-Z if `axis === 'x'`, -X if `axis === 'z'`). Defaults to `frontFloorY`. */
  backFloorY?: number;
  /** Y coordinate of the top of the doorway opening (lintel soffit). */
  headY: number;
  /** Material for the architraves and doorway reveal lining. */
  material: THREE.Material;
  /** Architrave moulding width (defaults to `0.092`). */
  architraveWidth?: number;
  /** How far the inner sight-edge (`h = 0`) of the architrave steps into the opening from the raw jamb edges (defaults to `0.008`). */
  jambInset?: number;
  /** How far the inner bottom edge (`h = 0`) of the head architrave sits below `headY` (defaults to `0.006`). */
  headInset?: number;
  /** Optional X-per-Z shear slope for angled walls along Z (e.g. East Courtyard Wall). */
  slopeXPerZ?: number;
  /** Whether to include the 3-sided solid timber reveal lining spanning `wallThickness` (defaults to `true`). */
  includeRevealLining?: boolean;
  /** Whether to include the +normal face architrave (defaults to `true`). */
  includeFrontArchitrave?: boolean;
  /** Whether to include the -normal face architrave (defaults to `true`). */
  includeBackArchitrave?: boolean;
  /** Optional base name prefix for the generated meshes. */
  namePrefix?: string;
}

/**
 * Adds a 3-sided doorway reveal lining (`left jamb`, `right jamb`, `top head soffit`) and
 * 45°-mitred ogee/torus-profiled architraves on both faces of a doorway or cased portal opening.
 */
export function addCasedArchitravePortal(
  parent: THREE.Object3D,
  options: CasedArchitravePortalOptions
): void {
  const width = options.architraveWidth ?? 0.092;
  const jambInset = options.jambInset ?? 0.008;
  const headInset = options.headInset ?? 0.006;
  const frontFloorY = options.frontFloorY;
  const backFloorY = options.backFloorY ?? frontFloorY;
  const minFloorY = Math.min(frontFloorY, backFloorY);
  const uLeft = options.openingCenter - options.openingWidth / 2 + jambInset;
  const uRight = options.openingCenter + options.openingWidth / 2 - jambInset;
  const innerHeadY = options.headY - headInset;
  const slope = options.slopeXPerZ ?? 0;
  const prefix = options.namePrefix ?? 'architravePortal';

  if (options.includeRevealLining !== false) {
    const liningT = 0.018;
    const liningDepth = options.wallThickness + 0.004;
    const jambH = Math.max(0.05, innerHeadY + liningT - minFloorY);
    const jambY = minFloorY + jambH / 2;

    for (const side of [-1, 1] as const) {
      const uJamb = side < 0 ? uLeft - liningT / 2 : uRight + liningT / 2;
      const revealJamb = new THREE.Mesh(
        options.axis === 'x'
          ? new THREE.BoxGeometry(liningT, jambH, liningDepth)
          : new THREE.BoxGeometry(liningDepth, jambH, liningT),
        options.material
      );
      revealJamb.name = `${prefix}.revealJamb`;
      if (options.axis === 'x') {
        revealJamb.position.set(uJamb, jambY, options.wallCoord);
      } else {
        revealJamb.position.set(
          options.wallCoord + slope * (uJamb - options.openingCenter),
          jambY,
          uJamb
        );
      }
      revealJamb.castShadow = true;
      revealJamb.receiveShadow = true;
      revealJamb.userData.isArchitecturalShell = true;
      parent.add(revealJamb);
    }

    const headSpan = Math.max(0.05, uRight - uLeft + liningT * 2);
    const headGeo =
      options.axis === 'x'
        ? new THREE.BoxGeometry(headSpan, liningT, liningDepth)
        : new THREE.BoxGeometry(liningDepth, liningT, headSpan);
    if (options.axis === 'z' && Math.abs(slope) > 1e-6) {
      const pos = headGeo.attributes.position;
      if (pos) {
        for (let i = 0; i < pos.count; i++) {
          pos.setX(i, pos.getX(i) + slope * pos.getZ(i));
        }
        pos.needsUpdate = true;
        headGeo.computeVertexNormals();
      }
    }
    const revealHead = new THREE.Mesh(headGeo, options.material);
    revealHead.name = `${prefix}.revealHead`;
    if (options.axis === 'x') {
      revealHead.position.set(options.openingCenter, innerHeadY + liningT / 2, options.wallCoord);
    } else {
      revealHead.position.set(options.wallCoord, innerHeadY + liningT / 2, options.openingCenter);
    }
    revealHead.castShadow = true;
    revealHead.receiveShadow = true;
    revealHead.userData.isArchitecturalShell = true;
    parent.add(revealHead);
  }

  const profile = createArchitraveProfile(width);
  const halfWall = options.wallThickness / 2;

  if (options.includeFrontArchitrave !== false) {
    const frontPath: ReadonlyArray<readonly [number, number]> = [
      [uLeft, frontFloorY],
      [uLeft, innerHeadY],
      [uRight, innerHeadY],
      [uRight, frontFloorY],
    ];
    const frontGeo = buildSweptMouldingGeometry(
      profile,
      frontPath,
      (u, y, d) =>
        options.axis === 'x'
          ? new THREE.Vector3(u, y, options.wallCoord + halfWall + d)
          : new THREE.Vector3(
              options.wallCoord + slope * (u - options.openingCenter) + halfWall + d,
              y,
              u
            ),
      4
    );
    const frontArchitrave = new THREE.Mesh(frontGeo, options.material);
    frontArchitrave.name = `${prefix}.frontArchitrave`;
    frontArchitrave.castShadow = true;
    frontArchitrave.receiveShadow = true;
    frontArchitrave.userData.isArchitecturalShell = true;
    parent.add(frontArchitrave);
  }

  if (options.includeBackArchitrave !== false) {
    const backPath: ReadonlyArray<readonly [number, number]> = [
      [uLeft, backFloorY],
      [uLeft, innerHeadY],
      [uRight, innerHeadY],
      [uRight, backFloorY],
    ];
    const backGeo = buildSweptMouldingGeometry(
      profile,
      backPath,
      (u, y, d) =>
        options.axis === 'x'
          ? new THREE.Vector3(u, y, options.wallCoord - halfWall - d)
          : new THREE.Vector3(
              options.wallCoord + slope * (u - options.openingCenter) - halfWall - d,
              y,
              u
            ),
      4
    );
    const backArchitrave = new THREE.Mesh(backGeo, options.material);
    backArchitrave.name = `${prefix}.backArchitrave`;
    backArchitrave.castShadow = true;
    backArchitrave.receiveShadow = true;
    backArchitrave.userData.isArchitecturalShell = true;
    parent.add(backArchitrave);
  }
}

/**
 * Crown cornice cross-section in `(d, h)` for bespoke floor-to-ceiling Shaker cabinetry & vaulted wardrobes:
 * - `d` (`0..projection`) projects outward from the cabinetry front face,
 * - `h` (`-height..+0.004`) hangs downward from the ceiling line (`h = 0`) when swept along an increasing
 *   horizontal/raked ceiling path `(u0, y0) -> (u1, y1)`.
 */
export function createCrownCorniceProfile(projection = 0.042, height = 0.046): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.004, -height);
  // Lower bed-mould fascia & crisp quirk step above wardrobe doors
  s.lineTo(projection * 0.30, -height);
  s.lineTo(projection * 0.30, -height * 0.78);
  s.lineTo(projection * 0.42, -height * 0.74);
  // Sweeping concave cavetto throat into convex cyma recta crown ogee
  s.quadraticCurveTo(projection * 0.36, -height * 0.54, projection * 0.62, -height * 0.38);
  s.quadraticCurveTo(projection * 0.88, -height * 0.22, projection, -height * 0.14);
  // Top corona fillet abutting ceiling soffit
  s.lineTo(projection, 0.004);
  s.lineTo(-0.004, 0.004);
  s.closePath();
  return s;
}

export interface SolidOakWindowTrimOptions {
  /** 'x' = window spans X (wall normal along Z); 'z' = window spans Z (wall normal along X). */
  readonly axis: 'x' | 'z';
  /** Center coordinate of the window opening along `axis` (X if `axis === 'x'`, Z if `axis === 'z'`). */
  readonly openingCenter: number;
  /** Clear width of the masonry/plaster window reveal opening along `axis`. */
  readonly openingWidth: number;
  /** Y coordinate of the masonry sill (bottom of window reveal). */
  readonly sillY: number;
  /** Y coordinate of the masonry head (top of window reveal). */
  readonly headY: number;
  /** Interior room-side wall face coordinate (Z if `axis === 'x'`, X at `openingCenter` if `axis === 'z'`). */
  readonly interiorWallFaceCoord: number;
  /** Sign pointing from the wall into the interior room (+1 or -1). */
  readonly inwardSign: 1 | -1;
  /** Depth of the interior plastered reveal from window frame to interior wall face. */
  readonly revealDepth: number;
  /** Solid European Oak material (`antiqueOakSkirtingMat`). */
  readonly material: THREE.Material;
  /** Prefix for mesh names (e.g. `winId`). */
  readonly namePrefix: string;
  /** Architrave moulding width (`75 mm` per Survey2Plan / client joinery schedule, default `0.075`). */
  readonly architraveWidth?: number;
  /** Architrave maximum projection thickness (`20 mm`, default `0.020`). */
  readonly architraveThickness?: number;
  /** Extra room-ward offset to clear applied wall panelling or timber linings (default `0`). */
  readonly trimFaceOffset?: number;
  /** Optional X-per-Z shear slope for angled walls along Z (e.g. East Courtyard Wall, default `0`). */
  readonly slopeXPerZ?: number;
  /** Whether to omit the moulded solid oak under-sill apron (e.g. above a built-in window seat). */
  readonly skipUnderApron?: boolean;
  /** Whether to omit the 3-sided 45°-mitred solid oak architrave (default `false`). */
  readonly skipArchitrave?: boolean;
}

/**
 * Adds bespoke Solid European Oak internal window trim (`#19` / Survey2Plan calibration):
 * 1. `26 mm` thick Solid European Oak bullnose window board with `24 mm` wrap-around end-horns,
 * 2. 3-sided 45°-mitred `75 mm × 20 mm` Ogee/Torus Solid European Oak window architrave seated on the board,
 * 3. Moulded `46 mm` Cyma/Cavetto Solid European Oak under-sill apron beneath the window board.
 */
export function addSolidOakWindowTrim(
  parent: THREE.Object3D,
  options: SolidOakWindowTrimOptions
): void {
  const archW = options.architraveWidth ?? 0.075;
  const archT = options.architraveThickness ?? 0.020;
  const faceOffset = options.trimFaceOffset ?? 0;
  const slope = options.slopeXPerZ ?? 0;
  const effWallFace = options.interiorWallFaceCoord + options.inwardSign * faceOffset;
  const jambInset = 0.006;
  const uLeft = options.openingCenter - options.openingWidth * 0.5 + jambInset;
  const uRight = options.openingCenter + options.openingWidth * 0.5 - jambInset;

  // 1. 26mm Solid European Oak Bullnose Window Board with 24mm wrap-around end-horns
  const hornExt = options.skipArchitrave ? 0.03 : archW + 0.024;
  const boardSpan = Math.max(0.12, uRight - uLeft + hornExt * 2);
  const boardH = 0.026;
  const boardBotY = options.sillY - 0.002;
  const boardTopY = boardBotY + boardH;
  const backDepth = Math.max(0.06, options.revealDepth + faceOffset);
  const nosingProj = archT + 0.014;
  const bullnoseR = 0.012;

  const boardShape = new THREE.Shape();
  boardShape.moveTo(-backDepth, 0);
  boardShape.lineTo(nosingProj - bullnoseR, 0);
  boardShape.quadraticCurveTo(nosingProj, 0, nosingProj, boardH * 0.5);
  boardShape.quadraticCurveTo(nosingProj, boardH, nosingProj - bullnoseR, boardH);
  boardShape.lineTo(-backDepth, boardH);
  boardShape.closePath();

  const boardGeo = new THREE.ExtrudeGeometry(boardShape, {
    depth: boardSpan,
    bevelEnabled: false,
    curveSegments: 6,
  });
  // Local coords after Extrude: x = dLocal (-backDepth..+nosingProj), y = 0..boardH, z = 0..boardSpan
  boardGeo.translate(0, 0, -boardSpan * 0.5);
  if (options.axis === 'x') {
    // Rotate so dLocal maps to inwardSign * Z and span maps to X
    boardGeo.rotateY(options.inwardSign > 0 ? -Math.PI / 2 : Math.PI / 2);
  } else if (options.inwardSign < 0) {
    boardGeo.rotateY(Math.PI);
  }
  if (options.axis === 'z' && Math.abs(slope) > 1e-6) {
    const pos = boardGeo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + slope * pos.getZ(i));
      }
      pos.needsUpdate = true;
    }
  }
  boardGeo.computeVertexNormals();
  boardGeo.computeBoundingSphere();

  const windowBoard = new THREE.Mesh(boardGeo, options.material);
  windowBoard.name = `${options.namePrefix}.windowBoard`;
  if (options.axis === 'x') {
    windowBoard.position.set(options.openingCenter, boardBotY, effWallFace);
  } else {
    windowBoard.position.set(effWallFace, boardBotY, options.openingCenter);
  }
  windowBoard.castShadow = true;
  windowBoard.receiveShadow = true;
  parent.add(windowBoard);

  // 2. 3-Sided 45°-Mitred 75mm × 20mm Solid European Oak Window Architrave
  if (!options.skipArchitrave && uRight - uLeft > 0.08 && options.headY - boardTopY > 0.12) {
    const innerHeadY = options.headY - 0.006;
    const archProfile = createArchitraveProfile(archW, archT);
    const archPath: ReadonlyArray<readonly [number, number]> = [
      [uLeft, boardTopY],
      [uLeft, innerHeadY],
      [uRight, innerHeadY],
      [uRight, boardTopY],
    ];
    const archGeo = buildSweptMouldingGeometry(
      archProfile,
      archPath,
      (u, y, d) =>
        options.axis === 'x'
          ? new THREE.Vector3(u, y, effWallFace + options.inwardSign * d)
          : new THREE.Vector3(
              effWallFace + slope * (u - options.openingCenter) + options.inwardSign * d,
              y,
              u
            ),
      6
    );
    const oakArchitrave = new THREE.Mesh(archGeo, options.material);
    oakArchitrave.name = `${options.namePrefix}.oakArchitrave`;
    oakArchitrave.castShadow = true;
    oakArchitrave.receiveShadow = true;
    oakArchitrave.userData.isArchitecturalShell = true;
    parent.add(oakArchitrave);
  }

  // 3. Moulded 46mm Cyma/Cavetto Solid European Oak Under-Sill Apron
  if (!options.skipUnderApron) {
    const apronSpan = Math.max(0.12, uRight - uLeft + archW * 2);
    const apronH = 0.046;
    const apronT = Math.max(0.014, archT * 0.85);
    const apronShape = new THREE.Shape();
    apronShape.moveTo(0, 0);
    apronShape.lineTo(apronT * 0.28, 0);
    apronShape.quadraticCurveTo(apronT * 0.48, apronH * 0.18, apronT * 0.78, apronH * 0.36);
    apronShape.quadraticCurveTo(apronT * 1.02, apronH * 0.54, apronT * 0.86, apronH * 0.74);
    apronShape.lineTo(apronT, apronH * 0.78);
    apronShape.lineTo(apronT, apronH);
    apronShape.lineTo(0, apronH);
    apronShape.closePath();

    const apronGeo = new THREE.ExtrudeGeometry(apronShape, {
      depth: apronSpan,
      bevelEnabled: false,
      curveSegments: 6,
    });
    apronGeo.translate(0, 0, -apronSpan * 0.5);
    if (options.axis === 'x') {
      apronGeo.rotateY(options.inwardSign > 0 ? -Math.PI / 2 : Math.PI / 2);
    } else if (options.inwardSign < 0) {
      apronGeo.rotateY(Math.PI);
    }
    if (options.axis === 'z' && Math.abs(slope) > 1e-6) {
      const pos = apronGeo.attributes.position;
      if (pos) {
        for (let i = 0; i < pos.count; i++) {
          pos.setX(i, pos.getX(i) + slope * pos.getZ(i));
        }
        pos.needsUpdate = true;
      }
    }
    apronGeo.computeVertexNormals();
    apronGeo.computeBoundingSphere();

    const oakApron = new THREE.Mesh(apronGeo, options.material);
    oakApron.name = `${options.namePrefix}.oakUnderSillApron`;
    if (options.axis === 'x') {
      oakApron.position.set(options.openingCenter, boardBotY - apronH, effWallFace);
    } else {
      oakApron.position.set(effWallFace, boardBotY - apronH, options.openingCenter);
    }
    oakApron.castShadow = true;
    oakApron.receiveShadow = true;
    oakApron.userData.tradeCategory = 'finishes';
    parent.add(oakApron);
  }
}


