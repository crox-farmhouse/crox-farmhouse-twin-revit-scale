import * as THREE from 'three';

/**
 * Builds a softly bevelled/chamfered 6-sided hexagonal Nike Grind dumbbell head geometry
 * matching the rounded hex profile in `media_1791145088611_e622634c.png`.
 */
export function createBevelledHexHeadGeometry(radius: number, length: number): THREE.BufferGeometry {
  // 4-ring bevelled hexagonal prism along Y (`-length/2 .. +length/2`) rotated to Z
  const radialSegs = 6;
  const rings = [
    { y: -length * 0.5, rScale: 0.84 },
    { y: -length * 0.5 + length * 0.14, rScale: 1.0 },
    { y: length * 0.5 - length * 0.14, rScale: 1.0 },
    { y: length * 0.5, rScale: 0.84 },
  ] as const;

  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegs, 3, false);
  const pos = geo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const py = pos.getY(i);
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const rCurr = Math.hypot(px, pz);
      if (rCurr > 1e-4) {
        // Identify closest ring
        let scale = 1.0;
        if (Math.abs(py) > length * 0.42) {
          scale = rings[0].rScale;
        }
        pos.setX(i, px * scale);
        pos.setZ(i, pz * scale);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

/**
 * Issue #4 ("Make this floor less tesselated / repeated" at `[-11.439, -0.5, 17.001]`, `outbuildings.garage.resinFloor`):
 * Generates a monolithic, non-repeating `1024x1024` self-levelling poured polyurethane/epoxy workshop resin floor
 * texture (`#888d92`) mapped `1:1` across the entire garage slab (`tex.repeat.set(1, 1)`) with zero periodic grid waves
 * and ultra-fine, barely perceptible mineral micro-speckle.
 */
export function createPouredResinFloorMaterial(): THREE.MeshStandardMaterial {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    const uy = y / size - 0.5;
    for (let x = 0; x < size; x++) {
      const ux = x / size - 0.5;
      const idx = (y * size + x) * 4;
      // Gentle, non-repeating monolithic radial ambient grading across the whole garage slab
      const radialLift = (0.35 - (ux * ux + uy * uy)) * 4.5;
      // Ultra-subtle aperiodic micro-quartz resin grain (±1.5 RGB values)
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const f = h - Math.floor(h);
      const microFleck = (f - 0.5) * 2.6;

      const base = 137 + radialLift + microFleck;
      data[idx] = Math.max(122, Math.min(152, Math.round(base - 2)));
      data[idx + 1] = Math.max(126, Math.min(156, Math.round(base)));
      data[idx + 2] = Math.max(130, Math.min(160, Math.round(base + 3)));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1, 1);

  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.06,
  });
}

/**
 * Generates a realistic brushed 304 stainless-steel horizontal grain texture (`#dce1e7`)
 * with fine linear satin abrasion lines and subtle specular sheen variation.
 */
export function createBrushedStainlessSteelMaterial(): THREE.MeshStandardMaterial {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#d8dde3');
  grad.addColorStop(0.45, '#eef2f6');
  grad.addColorStop(0.75, '#cfd5dc');
  grad.addColorStop(1, '#e3e8ee');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Fine horizontal brushed 304 stainless grain lines
  for (let y = 0; y < h; y++) {
    const n = Math.sin(y * 19.73) * 43758.5453;
    const f = n - Math.floor(n);
    ctx.fillStyle =
      f > 0.5
        ? `rgba(255, 255, 255, ${(f - 0.5) * 0.22})`
        : `rgba(110, 120, 132, ${(0.5 - f) * 0.22})`;
    ctx.fillRect(0, y, w, 1);
  }

  for (let i = 0; i < 650; i++) {
    const h1 = Math.sin(i * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const sx = f1 * w;
    const sy = f2 * h;
    const len = 28 + (i % 65);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(90,98,108,0.12)';
    ctx.fillRect(sx, sy, len, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xdce1e7,
    roughness: 0.24,
    metalness: 0.88,
  });
}
