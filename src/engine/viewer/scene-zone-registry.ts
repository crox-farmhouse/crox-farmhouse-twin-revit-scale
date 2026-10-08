import type {
  CameraPresetDefinition,
  SceneBuilderContext,
  SceneZoneModule,
  ZoneIndicatorMaterials,
} from '../../core/types/scene.ts';
import type { RoomBoundingBox } from '../../core/types/topology.ts';

/**
 * Composable registry of 3D zone modules for a property.
 *
 * Home-agnostic: a home supplies its own module list (see
 * `homes/<home>/zone-modules.ts`). The registry aggregates camera presets and
 * interior room bounds from every registered module and builds them in order.
 */
export class SceneZoneRegistry {
  private readonly modules: SceneZoneModule[] = [];
  private readonly presets = new Map<string, CameraPresetDefinition>();
  private readonly interiorBounds: RoomBoundingBox[] = [];

  public constructor(initialModules: readonly SceneZoneModule[]) {
    for (const mod of initialModules) {
      this.registerZoneModule(mod);
    }
  }

  public registerZoneModule(mod: SceneZoneModule): void {
    this.modules.push(mod);
    if (mod.interiorBounds) {
      for (const b of mod.interiorBounds) {
        this.interiorBounds.push(b);
      }
    }
    if (mod.cameraPresets) {
      for (const p of mod.cameraPresets) {
        this.presets.set(p.id, p);
      }
    }
  }

  public getModules(): readonly SceneZoneModule[] {
    return this.modules;
  }

  public getCameraPreset(id: string): CameraPresetDefinition | undefined {
    return this.presets.get(id);
  }

  public getAllCameraPresets(): readonly CameraPresetDefinition[] {
    return Array.from(this.presets.values());
  }

  /**
   * Returns true if the 3D point (x, y, z) is inside any registered interior room.
   */
  public isPointInsideInteriorRoom(x: number, y: number, z: number): boolean {
    return this.interiorBounds.some(
      (b) =>
        x >= b.minX &&
        x <= b.maxX &&
        y >= b.minY &&
        y <= b.maxY &&
        z >= b.minZ &&
        z <= b.maxZ
    );
  }

  /**
   * Returns true if both 3D points lie inside the exact same interior room bounding box.
   */
  public arePointsInSameInteriorRoom(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
  ): boolean {
    return this.interiorBounds.some(
      (b) =>
        x1 >= b.minX &&
        x1 <= b.maxX &&
        y1 >= b.minY &&
        y1 <= b.maxY &&
        z1 >= b.minZ &&
        z1 <= b.maxZ &&
        x2 >= b.minX &&
        x2 <= b.maxX &&
        y2 >= b.minY &&
        y2 <= b.maxY &&
        z2 >= b.minZ &&
        z2 <= b.maxZ
    );
  }

  public buildAllZones(ctx: SceneBuilderContext): ZoneIndicatorMaterials {
    let merged: ZoneIndicatorMaterials = {};
    for (const mod of this.modules) {
      const res = mod.build(ctx);
      merged = { ...merged, ...res };
    }
    return merged;
  }
}
