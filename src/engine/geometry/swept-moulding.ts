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
  s.moveTo(0, -0.003);
  s.lineTo(0.016, -0.003);
  s.lineTo(0.017, 0);
  s.quadraticCurveTo(0.0185, 0.006, 0.0165, 0.012);
  s.quadraticCurveTo(0.012, 0.017, 0.01, 0.021);
  s.lineTo(0.008, 0.024);
  s.lineTo(0, 0.024);
  s.closePath();
  return s;
}

/**
 * Full-height 146mm antique oak ogee/torus skirting board cross-section in `(y, h)`:
 * - `y` (first coordinate `d` in `buildSweptMouldingGeometry`) is vertical height above the floor (`0..0.146m`),
 * - `h` (second coordinate `h` in `buildSweptMouldingGeometry`) is horizontal projection out from the wall (`0..0.022m`).
 */
export function createWallSkirtingBoardProfile(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0, 0.022);
  s.lineTo(0.122, 0.022);
  s.lineTo(0.122, 0.017);
  s.lineTo(0.128, 0.018);
  s.lineTo(0.134, 0.0165);
  s.lineTo(0.139, 0.012);
  s.lineTo(0.143, 0.01);
  s.lineTo(0.146, 0.008);
  s.lineTo(0.146, 0);
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
    1
  );
}

