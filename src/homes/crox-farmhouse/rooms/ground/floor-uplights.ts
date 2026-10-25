import * as THREE from 'three';
import type { CircuitId } from '../../../../core/types/knx.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';

export interface RecessedFloorUplightOptions {
  readonly name: string;
  readonly zone: string;
  readonly circuitId: CircuitId;
  /** Top surface of the finished floor the fittings are recessed into. */
  readonly floorY: number;
  /** Fitting centres on the floor plane, as [x, z] pairs. */
  readonly positions: ReadonlyArray<readonly [number, number]>;
  /**
   * Optional wall wash: the wall plane the beams graze (constant Z), the halo height above the floor,
   * and one consolidated grazing PointLight for the whole run.
   */
  readonly wallWash?: {
    readonly wallZ: number;
    readonly wallZAtX?: (x: number) => number;
    readonly haloHeight: number;
    /** Omit (or 0) to rely on the emissive halos only and keep the PointLight count down. */
    readonly lightIntensity?: number;
    readonly lightDistance?: number;
  };
}

const bezelMat = new THREE.MeshStandardMaterial({
  color: 0xb8bec6,
  roughness: 0.25,
  metalness: 0.88,
});
const bezelRingProfile: THREE.Vector2[] = [
  new THREE.Vector2(0.036, 0.0),
  new THREE.Vector2(0.05, 0.0),
  new THREE.Vector2(0.05, 0.006),
  new THREE.Vector2(0.036, 0.006),
  new THREE.Vector2(0.036, 0.0),
];
const bezelGeo = new THREE.LatheGeometry(bezelRingProfile, 16);
bezelGeo.computeVertexNormals();
const lensGeo = new THREE.CylinderGeometry(0.033, 0.033, 0.006, 16);

/**
 * Recessed stainless inground floor uplights (same fitting family as the kitchen bifold uplights),
 * each clickable to toggle its KNX circuit. Emits a single grazing PointLight per run when a wall wash
 * is requested, parented to the scene root.
 */
export function buildRecessedFloorUplights(
  ctx: SceneBuilderContext,
  options: RecessedFloorUplightOptions
): void {
  const { interactiveMeshes, lightGroups, scene } = ctx;
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d0,
    emissive: new THREE.Color(0xffaa38),
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });
  lightGroups[options.circuitId].emissives.push(lensMat);

  options.positions.forEach(([x, z], idx) => {
    const fitting = new THREE.Group();
    fitting.name = `${options.name}.${idx + 1}`;
    fitting.userData.zone = options.zone;
    fitting.position.set(x, options.floorY, z);

    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.name = `${fitting.name}.bezel`;
    bezel.position.y = 0.0045;
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.name = `${fitting.name}.lens`;
    lens.position.y = 0.008;
    for (const mesh of [bezel, lens]) {
      mesh.userData = { circuitId: options.circuitId };
      interactiveMeshes.push(mesh);
      fitting.add(mesh);
    }
    scene.add(fitting);

    ctx.addGlowPool(options.circuitId, x, options.floorY + 0.004, z, 0.3, 0.36);

    const wash = options.wallWash;
    if (wash) {
      const targetWallZ = wash.wallZAtX ? wash.wallZAtX(x) : wash.wallZ;
      const towardWall = Math.sign(targetWallZ - z);
      ctx.addGlowPool(
        options.circuitId,
        x,
        options.floorY + wash.haloHeight,
        targetWallZ - towardWall * 0.004,
        0.42,
        0.2,
        Math.PI / 2
      );
    }
  });

  // One consolidated grazing PointLight per run (like the kitchen bifold uplights) keeps the
  // forward-rendered light count low.
  const wash = options.wallWash;
  if (wash?.lightIntensity && options.positions.length > 0) {
    const n = options.positions.length;
    const cx = options.positions.reduce((sum, [x]) => sum + x, 0) / n;
    const cz = options.positions.reduce((sum, [, z]) => sum + z, 0) / n;
    const grazeLight = new THREE.PointLight(0xffb454, wash.lightIntensity, wash.lightDistance ?? 3, 1.6);
    grazeLight.userData.baseIntensity = wash.lightIntensity;
    grazeLight.position.set(cx, options.floorY + 0.3, cz);
    scene.add(grazeLight);
    lightGroups[options.circuitId].lights.push(grazeLight);
  }
}
