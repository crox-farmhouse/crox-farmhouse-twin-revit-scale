import * as THREE from 'three';
import type { CircuitId, CircuitLevels } from '../../core/types/knx.ts';
import type { TimeOfDay } from '../../core/types/scene.ts';
export interface BakedRoomVolumeBounds {
  readonly zoneId?: string;
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
}
import type { GraphicsTier } from '../../core/types/twin-ux.ts';
import type { LightGroupMap } from '../viewer/scene-types.ts';

/**
 * 3D Baked Light & Ambient Occlusion Volume covering the entire Crox Farmhouse,
 * Courtyard, and Outbuildings/Barns footprint:
 *   X: [-34.0 .. 22.0] (56.0 m)
 *   Y: [ -0.6 ..  7.4] ( 8.0 m)
 *   Z: [-18.0 .. 26.0] (44.0 m)
 *
 * Channel packing (RGBA8 3D texture, hardware trilinear filtered via sampler3D):
 *   - RGB: Gamma-encoded (sqrt) HDR diffuse irradiance + 1-bounce warm room GI
 *          pre-baked per KNX circuit with room wall & floor-slab occlusion,
 *          re-combined in <0.2 ms whenever KNX dimmer levels or Time-of-Day change.
 *   - A:   Static architectural Ambient Occlusion (floor-wall skirting corners,
 *          wall-wall intersections, and ceiling coves) baked once at startup.
 */
export const BAKED_VOLUME_NX = 64;
export const BAKED_VOLUME_NY = 16;
export const BAKED_VOLUME_NZ = 48;
const TOTAL_VOXELS = BAKED_VOLUME_NX * BAKED_VOLUME_NY * BAKED_VOLUME_NZ;

export const BAKED_VOLUME_MIN = new THREE.Vector3(-34.0, -0.6, -18.0);
export const BAKED_VOLUME_MAX = new THREE.Vector3(22.0, 7.4, 26.0);
export const BAKED_VOLUME_SIZE = new THREE.Vector3().subVectors(BAKED_VOLUME_MAX, BAKED_VOLUME_MIN);

const HDR_IRRADIANCE_RANGE = 3.5;

const TOD_LIGHT_SCALE: Readonly<Record<TimeOfDay, number>> = {
  day: 0.24,
  dusk: 0.84,
  night: 0.95,
};

interface SparseCircuitBake {
  readonly circuitId: CircuitId;
  /** Flat voxel indices (0 .. TOTAL_VOXELS - 1). */
  readonly voxelIndices: Uint32Array;
  /** Interleaved (r, g, b) unit-level irradiance weights (length = voxelIndices.length * 3). */
  readonly rgbWeights: Float32Array;
}

interface RoomBoundsBox {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly minZ: number;
  readonly maxZ: number;
  readonly volume: number;
}

// ---------------------------------------------------------------------------
// Shared Uniform Singletons (cloned by reference across all Standard/Physical materials)
// ---------------------------------------------------------------------------

function makeNonCloning<T extends { clone: () => T }>(obj: T): T {
  obj.clone = () => obj;
  return obj;
}

const initialVolumeData = new Uint8Array(TOTAL_VOXELS * 4);
for (let i = 0; i < TOTAL_VOXELS; i++) {
  initialVolumeData[i * 4 + 3] = 255; // neutral AO = 1.0 until baked
}

export const SHARED_BAKED_VOLUME_TEXTURE: THREE.Data3DTexture = makeNonCloning(
  (() => {
    const tex = new THREE.Data3DTexture(
      initialVolumeData,
      BAKED_VOLUME_NX,
      BAKED_VOLUME_NY,
      BAKED_VOLUME_NZ
    );
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.wrapR = THREE.ClampToEdgeWrapping;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    return tex;
  })()
);

export const SHARED_CAMERA_WORLD_MATRIX: THREE.Matrix4 = makeNonCloning(new THREE.Matrix4());

export const SHARED_VOLUME_MIN: THREE.Vector3 = makeNonCloning(BAKED_VOLUME_MIN.clone());

export const SHARED_VOLUME_INV_SIZE: THREE.Vector3 = makeNonCloning(
  new THREE.Vector3(
    1 / BAKED_VOLUME_SIZE.x,
    1 / BAKED_VOLUME_SIZE.y,
    1 / BAKED_VOLUME_SIZE.z
  )
);

/**
 * x = enabled (1 or 0)
 * y = baked GI irradiance multiplier
 * z = baked architectural AO strength (0..1)
 * w = direct PointLight GGX BRDF cutoff distance (m)
 */
export const SHARED_VOLUME_PARAMS: THREE.Vector4 = makeNonCloning(
  new THREE.Vector4(0.0, 1.35, 0.20, 8.5)
);

export function syncBakedLightCameraMatrix(camera: THREE.Camera): void {
  SHARED_CAMERA_WORLD_MATRIX.copy(camera.matrixWorld);
}

export function setBakedLightTierDirectCutoff(tier: GraphicsTier): void {
  const cutoffByTier: Readonly<Record<GraphicsTier, number>> = {
    low: 6.0,
    medium: 7.5,
    high: 9.5,
    ultra: 14.0,
  };
  const aoStrengthByTier: Readonly<Record<GraphicsTier, number>> = {
    low: 0.24,
    medium: 0.22,
    high: 0.16,
    ultra: 0.14,
  };
  SHARED_VOLUME_PARAMS.z = aoStrengthByTier[tier];
  SHARED_VOLUME_PARAMS.w = cutoffByTier[tier];
}

// ---------------------------------------------------------------------------
// Baker & Runtime Accumulator
// ---------------------------------------------------------------------------

export class BakedLightVolumeController {
  private readonly circuitBakes: SparseCircuitBake[] = [];
  private readonly hdrAccum = new Float32Array(TOTAL_VOXELS * 3);
  private baked = false;

  public constructor(
    lightGroups: LightGroupMap,
    lodRegistrations: readonly BakedRoomVolumeBounds[] = []
  ) {
    this.bakeFromScene(lightGroups, lodRegistrations);
  }

  public isBaked(): boolean {
    return this.baked;
  }

  public getBakedCircuitCount(): number {
    return this.circuitBakes.length;
  }

  /**
   * Precomputes:
   * 1. Static architectural Ambient Occlusion (`A` channel) from room wall/floor/ceiling proximity.
   * 2. Per-circuit sparse voxel irradiance + wall/slab occlusion + warm indirect bounce (`RGB` basis).
   */
  public bakeFromScene(
    lightGroups: LightGroupMap,
    lodRegistrations: readonly BakedRoomVolumeBounds[] = []
  ): void {
    this.circuitBakes.length = 0;
    const rooms: RoomBoundsBox[] = lodRegistrations.map((reg) => {
      const b = reg.bounds;
      const volume = Math.max(0.1, (b.maxX - b.minX) * (b.maxY - b.minY) * (b.maxZ - b.minZ));
      return {
        minX: b.minX,
        maxX: b.maxX,
        minY: b.minY,
        maxY: b.maxY,
        minZ: b.minZ,
        maxZ: b.maxZ,
        volume,
      };
    });

    const texData = SHARED_BAKED_VOLUME_TEXTURE.image.data as Uint8Array;
    this.bakeStaticArchitecturalAo(texData, rooms);

    const stepX = BAKED_VOLUME_SIZE.x / BAKED_VOLUME_NX;
    const stepY = BAKED_VOLUME_SIZE.y / BAKED_VOLUME_NY;
    const stepZ = BAKED_VOLUME_SIZE.z / BAKED_VOLUME_NZ;

    const worldPos = new THREE.Vector3();
    const colorLinear = new THREE.Color();

    for (const [rawId, group] of Object.entries(lightGroups)) {
      if (!group || group.lights.length === 0) continue;
      const circuitId = rawId as CircuitId;
      const voxelMap = new Map<number, [number, number, number]>();

      for (const light of group.lights) {
        light.updateWorldMatrix(true, false);
        light.getWorldPosition(worldPos);
        colorLinear.copy(light.color);

        const baseIntensity =
          typeof light.userData?.baseIntensity === 'number'
            ? (light.userData.baseIntensity as number)
            : light.intensity;
        const decayGain =
          typeof light.userData?.knxDecayGain === 'number'
            ? (light.userData.knxDecayGain as number)
            : 1;
        const unitPeak = Math.max(0, baseIntensity * decayGain);
        if (unitPeak <= 1e-4) continue;

        const radius = light.distance > 0 ? Math.min(11.0, light.distance * 1.15) : 6.5;
        const hostRoom = this.findSmallestContainingRoom(worldPos.x, worldPos.y, worldPos.z, rooms);

        const minIx = Math.max(
          0,
          Math.floor(((worldPos.x - radius - BAKED_VOLUME_MIN.x) / BAKED_VOLUME_SIZE.x) * BAKED_VOLUME_NX)
        );
        const maxIx = Math.min(
          BAKED_VOLUME_NX - 1,
          Math.ceil(((worldPos.x + radius - BAKED_VOLUME_MIN.x) / BAKED_VOLUME_SIZE.x) * BAKED_VOLUME_NX)
        );
        const minIy = Math.max(
          0,
          Math.floor(((worldPos.y - radius - BAKED_VOLUME_MIN.y) / BAKED_VOLUME_SIZE.y) * BAKED_VOLUME_NY)
        );
        const maxIy = Math.min(
          BAKED_VOLUME_NY - 1,
          Math.ceil(((worldPos.y + radius - BAKED_VOLUME_MIN.y) / BAKED_VOLUME_SIZE.y) * BAKED_VOLUME_NY)
        );
        const minIz = Math.max(
          0,
          Math.floor(((worldPos.z - radius - BAKED_VOLUME_MIN.z) / BAKED_VOLUME_SIZE.z) * BAKED_VOLUME_NZ)
        );
        const maxIz = Math.min(
          BAKED_VOLUME_NZ - 1,
          Math.ceil(((worldPos.z + radius - BAKED_VOLUME_MIN.z) / BAKED_VOLUME_SIZE.z) * BAKED_VOLUME_NZ)
        );

        for (let iz = minIz; iz <= maxIz; iz++) {
          const vz = BAKED_VOLUME_MIN.z + (iz + 0.5) * stepZ;
          const dz = vz - worldPos.z;
          for (let iy = minIy; iy <= maxIy; iy++) {
            const vy = BAKED_VOLUME_MIN.y + (iy + 0.5) * stepY;
            const dy = vy - worldPos.y;
            for (let ix = minIx; ix <= maxIx; ix++) {
              const vx = BAKED_VOLUME_MIN.x + (ix + 0.5) * stepX;
              const dx = vx - worldPos.x;
              const distSq = dx * dx + dy * dy + dz * dz;
              if (distSq >= radius * radius) continue;

              const dist = Math.sqrt(distSq);
              const rRatio = dist / radius;
              const windowFactor = Math.max(0, 1 - rRatio * rRatio * rRatio * rRatio);
              const smoothWindow = windowFactor * windowFactor;
              const directAtten = smoothWindow / (1.0 + 0.45 * distSq);
              // 1-bounce warm indirect room fill inside the light's zone
              const bounceAtten = 0.24 * Math.max(0, 1 - rRatio) * Math.max(0, 1 - rRatio);

              const occlusion = hostRoom ? this.computeRoomWallAndSlabOcclusion(vx, vy, vz, hostRoom) : 0.85;
              const totalAtten = (directAtten * 0.42 + bounceAtten) * occlusion * Math.min(2.6, unitPeak * 0.14);
              if (totalAtten <= 1e-4) continue;

              // Warm oak/plaster indirect tint on the bounce component
              const r = colorLinear.r * totalAtten * 1.04;
              const g = colorLinear.g * totalAtten * 0.98;
              const b = colorLinear.b * totalAtten * 0.90;

              const flatIdx = ix + BAKED_VOLUME_NX * (iy + BAKED_VOLUME_NY * iz);
              const existing = voxelMap.get(flatIdx);
              if (existing) {
                existing[0] += r;
                existing[1] += g;
                existing[2] += b;
              } else {
                voxelMap.set(flatIdx, [r, g, b]);
              }
            }
          }
        }
      }

      if (voxelMap.size > 0) {
        const count = voxelMap.size;
        const voxelIndices = new Uint32Array(count);
        const rgbWeights = new Float32Array(count * 3);
        let k = 0;
        for (const [vIdx, rgb] of voxelMap.entries()) {
          voxelIndices[k] = vIdx;
          rgbWeights[k * 3] = rgb[0];
          rgbWeights[k * 3 + 1] = rgb[1];
          rgbWeights[k * 3 + 2] = rgb[2];
          k++;
        }
        this.circuitBakes.push({ circuitId, voxelIndices, rgbWeights });
      }
    }

    this.baked = this.circuitBakes.length > 0;
    SHARED_VOLUME_PARAMS.x = this.baked ? 1.0 : 0.0;
    SHARED_BAKED_VOLUME_TEXTURE.needsUpdate = true;
  }

  /**
   * Re-accumulates the baked 3D irradiance volume from the live KNX circuit levels
   * and time-of-day scale in <0.2 ms.
   */
  public updateFromCircuitLevels(levels: Readonly<CircuitLevels>, timeOfDay: TimeOfDay): void {
    if (!this.baked) return;
    const todScale = TOD_LIGHT_SCALE[timeOfDay];
    const accum = this.hdrAccum;
    accum.fill(0);

    for (const bake of this.circuitBakes) {
      const rawPct = levels[bake.circuitId] ?? 0;
      if (rawPct <= 0) continue;
      const norm = Math.max(0, Math.min(100, rawPct)) / 100;
      const weight = Math.pow(norm, 1.35) * todScale;
      if (weight <= 1e-4) continue;

      const indices = bake.voxelIndices;
      const rgb = bake.rgbWeights;
      const n = indices.length;
      for (let i = 0; i < n; i++) {
        const dstOffset = indices[i]! * 3;
        const srcOffset = i * 3;
        accum[dstOffset] = accum[dstOffset]! + rgb[srcOffset]! * weight;
        accum[dstOffset + 1] = accum[dstOffset + 1]! + rgb[srcOffset + 1]! * weight;
        accum[dstOffset + 2] = accum[dstOffset + 2]! + rgb[srcOffset + 2]! * weight;
      }
    }

    const texData = SHARED_BAKED_VOLUME_TEXTURE.image.data as Uint8Array;
    const invRange = 1 / HDR_IRRADIANCE_RANGE;
    for (let i = 0; i < TOTAL_VOXELS; i++) {
      const src = i * 3;
      const dst = i * 4;
      const r = Math.min(1, accum[src]! * invRange);
      const g = Math.min(1, accum[src + 1]! * invRange);
      const b = Math.min(1, accum[src + 2]! * invRange);
      // Sqrt gamma encoding preserves smooth low-end gradients in 8-bit storage
      texData[dst] = Math.round(Math.sqrt(r) * 255);
      texData[dst + 1] = Math.round(Math.sqrt(g) * 255);
      texData[dst + 2] = Math.round(Math.sqrt(b) * 255);
    }

    SHARED_BAKED_VOLUME_TEXTURE.needsUpdate = true;
  }

  /** Reads back the decoded RGB irradiance and static AO at a world position (used by unit tests). */
  public sampleAtWorldPosition(
    x: number,
    y: number,
    z: number
  ): { readonly r: number; readonly g: number; readonly b: number; readonly ao: number } {
    const ix = THREE.MathUtils.clamp(
      Math.floor(((x - BAKED_VOLUME_MIN.x) / BAKED_VOLUME_SIZE.x) * BAKED_VOLUME_NX),
      0,
      BAKED_VOLUME_NX - 1
    );
    const iy = THREE.MathUtils.clamp(
      Math.floor(((y - BAKED_VOLUME_MIN.y) / BAKED_VOLUME_SIZE.y) * BAKED_VOLUME_NY),
      0,
      BAKED_VOLUME_NY - 1
    );
    const iz = THREE.MathUtils.clamp(
      Math.floor(((z - BAKED_VOLUME_MIN.z) / BAKED_VOLUME_SIZE.z) * BAKED_VOLUME_NZ),
      0,
      BAKED_VOLUME_NZ - 1
    );
    const flatIdx = (ix + BAKED_VOLUME_NX * (iy + BAKED_VOLUME_NY * iz)) * 4;
    const texData = SHARED_BAKED_VOLUME_TEXTURE.image.data as Uint8Array;
    const rn = texData[flatIdx]! / 255;
    const gn = texData[flatIdx + 1]! / 255;
    const bn = texData[flatIdx + 2]! / 255;
    const ao = texData[flatIdx + 3]! / 255;
    return {
      r: rn * rn * HDR_IRRADIANCE_RANGE,
      g: gn * gn * HDR_IRRADIANCE_RANGE,
      b: bn * bn * HDR_IRRADIANCE_RANGE,
      ao,
    };
  }

  private bakeStaticArchitecturalAo(texData: Uint8Array, rooms: readonly RoomBoundsBox[]): void {
    const stepX = BAKED_VOLUME_SIZE.x / BAKED_VOLUME_NX;
    const stepY = BAKED_VOLUME_SIZE.y / BAKED_VOLUME_NY;
    const stepZ = BAKED_VOLUME_SIZE.z / BAKED_VOLUME_NZ;

    for (let iz = 0; iz < BAKED_VOLUME_NZ; iz++) {
      const vz = BAKED_VOLUME_MIN.z + (iz + 0.5) * stepZ;
      for (let iy = 0; iy < BAKED_VOLUME_NY; iy++) {
        const vy = BAKED_VOLUME_MIN.y + (iy + 0.5) * stepY;
        for (let ix = 0; ix < BAKED_VOLUME_NX; ix++) {
          const vx = BAKED_VOLUME_MIN.x + (ix + 0.5) * stepX;
          const room = this.findSmallestContainingRoom(vx, vy, vz, rooms);
          let ao = 1.0;
          if (room) {
            const dFloor = Math.max(0, vy - room.minY);
            const dCeil = Math.max(0, room.maxY - vy);
            const dWallX = Math.max(0, Math.min(vx - room.minX, room.maxX - vx));
            const dWallZ = Math.max(0, Math.min(vz - room.minZ, room.maxZ - vz));

            const fFloor = 1 - Math.exp(-dFloor * 2.2);
            const fCeil = 1 - Math.exp(-dCeil * 2.0);
            const fWallX = 1 - Math.exp(-dWallX * 1.8);
            const fWallZ = 1 - Math.exp(-dWallZ * 1.8);

            // Crevice / corner darkening where two or three planes meet
            const cornerFactor = fFloor * fCeil * fWallX * fWallZ;
            ao = 0.62 + 0.38 * Math.min(1, Math.pow(cornerFactor, 0.45));
          } else if (vy >= 0 && vy < 0.8) {
            // Subtle ground contact AO outdoors
            ao = 0.88 + 0.12 * Math.min(1, vy / 0.8);
          }
          const flatIdx = (ix + BAKED_VOLUME_NX * (iy + BAKED_VOLUME_NY * iz)) * 4;
          texData[flatIdx + 3] = Math.round(THREE.MathUtils.clamp(ao, 0.55, 1.0) * 255);
        }
      }
    }
  }

  private findSmallestContainingRoom(
    x: number,
    y: number,
    z: number,
    rooms: readonly RoomBoundsBox[]
  ): RoomBoundsBox | null {
    let best: RoomBoundsBox | null = null;
    for (const r of rooms) {
      if (
        x >= r.minX - 0.35 &&
        x <= r.maxX + 0.35 &&
        y >= r.minY - 0.25 &&
        y <= r.maxY + 0.35 &&
        z >= r.minZ - 0.35 &&
        z <= r.maxZ + 0.35
      ) {
        if (!best || r.volume < best.volume) {
          best = r;
        }
      }
    }
    return best;
  }

  private computeRoomWallAndSlabOcclusion(
    vx: number,
    vy: number,
    vz: number,
    room: RoomBoundsBox
  ): number {
    // Solid floor / ceiling slab occlusion between Ground and First floor
    if (vy < room.minY - 0.18 || vy > room.maxY + 0.22) {
      return 0.03;
    }
    const dxOut = Math.max(0, room.minX - vx, vx - room.maxX);
    const dzOut = Math.max(0, room.minZ - vz, vz - room.maxZ);
    const wallDist = Math.hypot(dxOut, dzOut);
    if (wallDist <= 0.15) return 1.0;
    // Soft doorway spill near room boundary, strong attenuation through solid walls
    return Math.exp(-wallDist * 2.1) * 0.22;
  }
}
