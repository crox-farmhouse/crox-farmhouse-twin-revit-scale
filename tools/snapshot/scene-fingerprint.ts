/**
 * Headless Scene-Graph Snapshot Tool
 *
 * Builds every registered property zone module into a fresh THREE.Scene under
 * Node (no WebGL / DOM), then serialises a deterministic fingerprint of the
 * entire scene graph: hierarchy order, names, transforms, userData, geometry
 * parameters + vertex buffer hashes, material properties, procedural canvas
 * texture draw-command hashes, lights and builder-context registries.
 *
 * Used as a strict "no visual change" regression guard for refactors:
 *   npm run snapshot:update   # capture golden
 *   npm run snapshot:check    # compare against golden
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import * as THREE from 'three';
import { getCanvasFingerprint } from './recording-canvas.ts';

// TextureLoader would try to fetch an <img>; record the URL instead.
THREE.TextureLoader.prototype.load = function load(url: string): THREE.Texture {
  const tex = new THREE.Texture();
  tex.name = `__loaded:${url}`;
  return tex;
};

type SnapshotBuilder = () => Promise<{
  readonly roots: readonly THREE.Object3D[];
  readonly extras: Record<string, unknown>;
}>;

const PRECISION = 1e6;
const r = (n: number): number => {
  const v = Math.round(n * PRECISION) / PRECISION;
  return Object.is(v, -0) ? 0 : v;
};

function hashArray(arr: ArrayLike<number> | undefined): string {
  if (!arr) return '-';
  const h = createHash('sha1');
  const view = arr as unknown as { buffer?: ArrayBuffer; byteOffset?: number; byteLength?: number };
  if (view.buffer && view.byteLength !== undefined) {
    h.update(new Uint8Array(view.buffer, view.byteOffset ?? 0, view.byteLength));
  } else {
    h.update(JSON.stringify(Array.from(arr)));
  }
  return h.digest('hex').slice(0, 16);
}

class IdRegistry {
  private readonly ids = new Map<object, string>();
  public constructor(private readonly prefix: string) {}
  public idOf(obj: object): { id: string; isNew: boolean } {
    const existing = this.ids.get(obj);
    if (existing) return { id: existing, isNew: false };
    const id = `${this.prefix}${this.ids.size}`;
    this.ids.set(obj, id);
    return { id, isNew: true };
  }
}

export class SceneFingerprinter {
  private readonly lines: string[] = [];
  private readonly geoIds = new IdRegistry('G');
  private readonly matIds = new IdRegistry('M');
  private readonly texIds = new IdRegistry('T');
  private readonly objPaths = new Map<THREE.Object3D, string>();

  public getLines(): readonly string[] {
    return this.lines;
  }

  public pathOf(obj: THREE.Object3D): string {
    return this.objPaths.get(obj) ?? `?${obj.type}:${obj.name}`;
  }

  private normalize(v: unknown, ancestors: object[]): unknown {
    if (typeof v === 'number') return r(v);
    if (typeof v === 'function') return '[fn]';
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof THREE.Object3D) return `[obj ${this.pathOf(v)}]`;
    if (v instanceof THREE.Material) return `[mat ${this.material(v)}]`;
    if (v instanceof THREE.BufferGeometry) return `[geo ${this.geometry(v)}]`;
    if (v instanceof THREE.Texture) return `[tex ${this.texture(v)}]`;
    if (v instanceof THREE.Color) return `#${v.getHexString()}`;
    if (ArrayBuffer.isView(v)) return `[typed ${hashArray(v as unknown as ArrayLike<number>)}]`;
    if (ancestors.includes(v)) return '[cycle]';
    const next = [...ancestors, v];
    if (v instanceof Map) {
      return Array.from(v.entries()).map(([k, val]) => [this.normalize(k, next), this.normalize(val, next)]);
    }
    if (v instanceof Set) return Array.from(v.values()).map((val) => this.normalize(val, next));
    if (Array.isArray(v)) return v.map((val) => this.normalize(val, next));
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(v).sort()) {
      if (key === 'uuid') continue;
      out[key] = this.normalize((v as Record<string, unknown>)[key], next);
    }
    return out;
  }

  private safeJson(value: unknown): string {
    return JSON.stringify(this.normalize(value, [])) ?? 'undefined';
  }

  private texture(tex: THREE.Texture): string {
    const { id, isNew } = this.texIds.idOf(tex);
    if (isNew) {
      const image: unknown = tex.image;
      const imgSig =
        image && typeof image === 'object'
          ? getCanvasFingerprint(image) ?? this.safeJson({ w: (image as { width?: number }).width })
          : 'none';
      this.lines.push(
        `TEX ${id} ${tex.constructor.name} name=${tex.name} img=${imgSig} ` +
          this.safeJson({
            wrapS: tex.wrapS,
            wrapT: tex.wrapT,
            repeat: tex.repeat.toArray(),
            offset: tex.offset.toArray(),
            center: tex.center.toArray(),
            rotation: tex.rotation,
            colorSpace: tex.colorSpace,
            anisotropy: tex.anisotropy,
            flipY: tex.flipY,
            magFilter: tex.magFilter,
            minFilter: tex.minFilter,
            generateMipmaps: tex.generateMipmaps,
            mapping: tex.mapping,
            userData: tex.userData,
          })
      );
    }
    return id;
  }

  private material(mat: THREE.Material): string {
    const { id, isNew } = this.matIds.idOf(mat);
    if (isNew) {
      const props: Record<string, unknown> = {};
      const skip = new Set(['uuid', 'id', 'version', '_listeners', 'onBeforeCompile', 'onBuild', 'onBeforeRender']);
      for (const key of Object.keys(mat).sort()) {
        if (skip.has(key)) continue;
        const value = (mat as unknown as Record<string, unknown>)[key];
        if (value instanceof THREE.Texture) {
          props[key] = `[tex ${this.texture(value)}]`;
        } else {
          props[key] = value;
        }
      }
      this.lines.push(`MAT ${id} ${mat.type} ${this.safeJson(props)}`);
    }
    return id;
  }

  private geometry(geo: THREE.BufferGeometry): string {
    const { id, isNew } = this.geoIds.idOf(geo);
    if (isNew) {
      const params = (geo as unknown as { parameters?: unknown }).parameters;
      const attrs = Object.keys(geo.attributes)
        .sort()
        .map((name) => {
          const a = geo.attributes[name] as THREE.BufferAttribute;
          return `${name}:${a.itemSize}x${a.count}:${hashArray(a.array)}`;
        })
        .join(',');
      const idx = geo.index ? `${geo.index.count}:${hashArray(geo.index.array)}` : '-';
      this.lines.push(
        `GEO ${id} ${geo.type} params=${params === undefined ? '-' : this.safeJson(params)} ` +
          `attrs=${attrs} index=${idx} groups=${this.safeJson(geo.groups)} ` +
          `draw=${geo.drawRange.start}:${geo.drawRange.count} ud=${this.safeJson(geo.userData)}`
      );
    }
    return id;
  }

  public visit(obj: THREE.Object3D, path: string): void {
    this.objPaths.set(obj, path);
    obj.updateWorldMatrix(false, false);
    const parts: string[] = [
      `OBJ ${path}`,
      obj.type,
      `name=${JSON.stringify(obj.name)}`,
      `vis=${obj.visible ? 1 : 0}`,
      `sh=${obj.castShadow ? 1 : 0}${obj.receiveShadow ? 1 : 0}`,
      `ro=${obj.renderOrder}`,
      `fc=${obj.frustumCulled ? 1 : 0}`,
      `layers=${obj.layers.mask}`,
      `p=${obj.position.toArray().map(r).join(',')}`,
      `q=${obj.quaternion.toArray().map(r).join(',')}`,
      `s=${obj.scale.toArray().map(r).join(',')}`,
      `ro3=${obj.rotation.order}`,
      `w=${obj.matrixWorld.elements.map(r).join(',')}`,
    ];
    if (Object.keys(obj.userData).length > 0) {
      parts.push(`ud=${this.safeJson(obj.userData)}`);
    }
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
      parts.push(`geo=${this.geometry(obj.geometry as THREE.BufferGeometry)}`);
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      parts.push(`mat=${mats.map((m: THREE.Material) => this.material(m)).join('|')}`);
    }
    if (obj instanceof THREE.InstancedMesh) {
      parts.push(`inst=${obj.count}:${hashArray(obj.instanceMatrix.array)}`);
    }
    if (obj instanceof THREE.Light) {
      const l = obj as THREE.Light & {
        distance?: number;
        decay?: number;
        angle?: number;
        penumbra?: number;
        groundColor?: THREE.Color;
      };
      parts.push(
        `light=${this.safeJson({
          color: l.color,
          intensity: l.intensity,
          distance: l.distance,
          decay: l.decay,
          angle: l.angle,
          penumbra: l.penumbra,
          groundColor: l.groundColor,
          castShadow: l.castShadow,
          shadow: l.shadow
            ? {
                bias: l.shadow.bias,
                normalBias: l.shadow.normalBias,
                radius: l.shadow.radius,
                mapSize: l.shadow.mapSize.toArray(),
              }
            : null,
        })}`
      );
    }
    this.lines.push(parts.join(' '));
    obj.children.forEach((child, i) => {
      this.visit(child, `${path}/${i}`);
    });
  }

  public extra(label: string, value: unknown): void {
    this.lines.push(`EXTRA ${label} ${this.safeJson(value)}`);
  }
}

export async function runSnapshot(build: SnapshotBuilder): Promise<string> {
  const { roots, extras } = await build();
  const fp = new SceneFingerprinter();
  roots.forEach((root, i) => fp.visit(root, `R${i}`));
  for (const key of Object.keys(extras).sort()) {
    fp.extra(key, extras[key]);
  }
  return fp.getLines().join('\n') + '\n';
}

export async function main(build: SnapshotBuilder): Promise<void> {
  const mode = process.argv[2] ?? 'check';
  const goldenPath = process.argv[3] ?? '.snapshots/scene.snap';
  const snap = await runSnapshot(build);
  const lineCount = snap.split('\n').length - 1;
  const digest = createHash('sha1').update(snap).digest('hex');

  if (mode === 'update') {
    mkdirSync(dirname(goldenPath), { recursive: true });
    writeFileSync(goldenPath, snap);
    console.log(`[snapshot] wrote ${lineCount} lines to ${goldenPath} (sha1 ${digest})`);
    return;
  }

  if (!existsSync(goldenPath)) {
    console.error(`[snapshot] golden ${goldenPath} missing; run with "update" first`);
    process.exit(2);
  }
  const golden = readFileSync(goldenPath, 'utf8');
  if (golden === snap) {
    console.log(`[snapshot] OK: ${lineCount} lines identical (sha1 ${digest})`);
    return;
  }
  const a = golden.split('\n');
  const b = snap.split('\n');
  const actualPath = `${goldenPath}.actual`;
  writeFileSync(actualPath, snap);
  let shown = 0;
  for (let i = 0; i < Math.max(a.length, b.length) && shown < 12; i++) {
    if (a[i] !== b[i]) {
      console.error(`--- line ${i + 1}\n- ${(a[i] ?? '<eof>').slice(0, 400)}\n+ ${(b[i] ?? '<eof>').slice(0, 400)}`);
      shown++;
    }
  }
  console.error(
    `[snapshot] MISMATCH: golden ${a.length - 1} lines vs actual ${b.length - 1} lines. Full output: ${actualPath}`
  );
  process.exit(1);
}
