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
  s.moveTo(-0.003, -0.002);
  s.lineTo(-0.003, 0.022);
  s.lineTo(0.122, 0.022);
  s.lineTo(0.122, 0.017);
  s.lineTo(0.128, 0.018);
  s.lineTo(0.134, 0.0165);
  s.lineTo(0.139, 0.012);
  s.lineTo(0.143, 0.01);
  s.lineTo(0.146, 0.008);
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
    1
  );
}

/**
 * 92mm-wide antique oak ogee/torus doorway architrave cross-section in `(d, h)`:
 * - `d` is the projection out from the wall face (`0..0.035m`),
 * - `h` is the offset outward from the doorway sight-edge (`0..width`), with a flat inner fascia
 *   (`0..width - 0.026m` at `d = 0.035m`) stepping down via a `5.5mm` quirk, convex torus bead
 *   (`0.0315m`), concave ogee/cove neck (`0.0245m`), and `0.0225m` outer edge fillet matching
 *   the skirting board and stair stringer profile.
 */
export function createArchitraveProfile(width = 0.092): THREE.Shape {
  const mouldStart = Math.max(0.02, width - 0.026);
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.035, 0);
  s.lineTo(0.035, mouldStart);
  s.lineTo(0.0295, mouldStart);
  s.quadraticCurveTo(0.0315, mouldStart + 0.006, 0.029, mouldStart + 0.013);
  s.quadraticCurveTo(0.0245, mouldStart + 0.018, 0.0235, mouldStart + 0.022);
  s.lineTo(0.0225, width);
  s.lineTo(0, width);
  s.closePath();
  return s;
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


