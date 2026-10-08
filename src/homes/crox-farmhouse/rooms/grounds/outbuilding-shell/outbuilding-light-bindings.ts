import * as THREE from 'three';
import type { CircuitId } from '../../../../../core/types/knx.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';

/**
 * Name-prefix → KNX circuit table for every authored light fitting in the outbuildings
 * (gym, garage, store, barn, mezzanine, stable office and guest suite) plus the stable's
 * external wall lights. The first matching prefix wins, checked against the object itself
 * and then each ancestor, so list specific prefixes before broad ones.
 *
 * Screens, appliance LEDs, car lamps and tool chargers are deliberately absent: they are not
 * on a lighting circuit.
 */
export const OUTBUILDING_LIGHT_BINDINGS: ReadonlyArray<readonly [prefix: string, circuitId: CircuitId]> = [
  // ---- Gym ----
  ['outbuildings.gym.wallMirrors', 'gymMirrorBacklights'],
  ['outbuildings.gym.lighting.ambientEaveCove', 'gymCoveLeds'],
  ['outbuildings.gym.lighting.wallSconce', 'gymWallAndCoveLights'],
  ['outbuildings.gym.lighting.ceilingTaskBattens', 'gymSpotsAndBattens'],
  ['outbuildings.gym.lighting.taskLight', 'gymSpotsAndBattens'],
  ['outbuildings.roofTruss.gym.', 'gymTrussSpots'],
  // ---- Garage ----
  ['outbuildings.garage.ledLighting', 'garageHighBayLights'],
  ['outbuildings.garage.toolBench.ledTaskBar', 'garageBenchAndShower'],
  ['outbuildings.garage.showerRoom.downlightLens', 'garageShowerLights'],
  ['outbuildings.garage.showerRoom.light', 'garageShowerLights'],
  ['outbuildings.garage.showerRoom.vanity', 'garageShowerLights'],
  ['outbuildings.roofTruss.garage.', 'garageTrussSpots'],
  // ---- Store ----
  ['outbuildings.store.loftRoofLedLights', 'storeLoftLeds'],
  ['outbuildings.roofTruss.storeBarn.', 'storeLoftLeds'],
  // ---- Barn (ground) ----
  ['outbuildings.barn.golfSimulator.ledRing', 'golfSimHalo'],
  ['outbuildings.barn.ambientCoveLed', 'barnCoveLeds'],
  ['outbuildings.barn.southWallAmbientLight', 'barnCoveLeds'],
  ['outbuildings.barn.wallSconce', 'barnWallSconces'],
  ['outbuildings.barn.spiralStaircase.treadLed', 'barnStairLeds'],
  ['outbuildings.barn.poolTableLight', 'barnPoolTableLight'],
  ['outbuildings.barn.pictureLight', 'barnPictureLights'],
  ['outbuildings.barn.mezzanineDownlight', 'barnTrussAndSimHalo'],
  ['outbuildings.barn.mezzanineUndersideSpot', 'barnTrussAndSimHalo'],
  ['outbuildings.barn.westBayTaskLight', 'barnTrussAndSimHalo'],
  ['outbuildings.roofTruss.barn.', 'barnTrussAndSimHalo'],
  ['outbuildings.barn.cornerBar.light', 'barnBarsAndLamps5A'],
  ['outbuildings.barn.cornerBar.spiritShelf', 'barnBarsAndLamps5A'],
  ['outbuildings.barn.cornerBar.counterLamp', 'barnBarsAndLamps5A'],
  ['outbuildings.barn.golfViewingBarPendant', 'barnBarsAndLamps5A'],
  ['outbuildings.barn.golfViewingBar.taskLight', 'barnBarsAndLamps5A'],
  ['outbuildings.barn.golfViewingBar.underBarLed', 'barnBarsAndLamps5A'],
  // ---- Mezzanine retro lounge ----
  ['outbuildings.mezzanine.tableLamp', 'mezzanineLamps5A'],
  ['outbuildings.mezzanine.floorTaskLamp', 'mezzanineLamps5A'],
  ['outbuildings.mezzanine.sideboardTaskLamp', 'mezzanineLamps5A'],
  ['outbuildings.mezzanine.lavaLamp', 'mezzanineLamps5A'],
  ['outbuildings.mezzanine.bookcase.light', 'mezzanineBookcaseLight'],
  ['outbuildings.mezzanine.bookcase.taskLight', 'mezzanineBookcaseLight'],
  ['outbuildings.mezzanine.wallSconce', 'mezzanineSconcesAndAmbient'],
  ['outbuildings.mezzanine.ambientLight', 'mezzanineDownlights'],
  // ---- Stable office (ground) ----
  ['outbuildings.stable.office.spotlight', 'stableOfficeSpotlights'],
  ['outbuildings.stable.office.wallLight', 'stableOfficeWallsAndLamps5A'],
  ['outbuildings.stable.office.floorLamp', 'stableOfficeLamps5A'],
  ['outbuildings.stable.groundCloakroom.light', 'stableCloakroomLights'],
  ['outbuildings.stable.groundCloakroom.basin', 'stableCloakroomLights'],
  ['outbuildings.stable.eastWallLight', 'stableExternalWallLights'],
  // ---- Guest suite (first floor) ----
  ['outbuildings.firstFloor.stableBedroom.bedsideLamp', 'stableSuiteLamps5A'],
  ['outbuildings.firstFloor.stableBedroom.dressingTable.lamp', 'stableSuiteLamps5A'],
  ['outbuildings.firstFloor.stableBedroom.downlight', 'stableSuiteDownlights'],
  ['outbuildings.firstFloor.stableEnsuite.light', 'stableEnsuiteLights'],
  ['outbuildings.firstFloor.stableEnsuite.shower', 'stableEnsuiteLights'],
  ['outbuildings.firstFloor.stableEnsuite.vanitySink', 'stableEnsuiteLights'],
  ['outbuildings.firstFloor.stableBalconyWallLight', 'stableBalconyLights'],
];

/** Below this emissive intensity a material is a finish, not a lamp. */
const MIN_FITTING_EMISSIVE = 0.35;

export function classifyOutbuildingLight(obj: THREE.Object3D): CircuitId | null {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    const name = curr.name;
    if (name) {
      for (const [prefix, circuitId] of OUTBUILDING_LIGHT_BINDINGS) {
        if (name.startsWith(prefix)) return circuitId;
      }
    }
    curr = curr.parent;
  }
  return null;
}

/**
 * Binds every authored outbuilding PointLight and emissive lamp material under `roots` to its
 * KNX circuit light group. Authored intensities are preserved as the circuit's 100 % level
 * (`userData.baseIntensity` / `baseEmissiveIntensity`), so binding never changes the look at
 * full brightness and adds no lights.
 */
export function bindOutbuildingLightsToKnxCircuits(
  ctx: Pick<SceneBuilderContext, 'lightGroups'>,
  roots: readonly THREE.Object3D[]
): void {
  const seenLights = new Set<THREE.Light>();
  /** Which circuit each already-bound emissive material belongs to. */
  const materialCircuit = new Map<THREE.Material, CircuitId>();
  /** Per-circuit clones of materials that authored fittings share across circuits. */
  const clones = new Map<THREE.Material, Map<CircuitId, THREE.MeshStandardMaterial>>();
  for (const cid of Object.keys(ctx.lightGroups) as CircuitId[]) {
    const grp = ctx.lightGroups[cid];
    for (const l of grp.lights) seenLights.add(l);
    for (const m of grp.emissives) materialCircuit.set(m, cid);
  }

  const materialFor = (mat: THREE.MeshStandardMaterial, cid: CircuitId): THREE.MeshStandardMaterial => {
    const owner = materialCircuit.get(mat);
    if (owner === undefined || owner === cid) return mat;
    // Shared with a fitting on another circuit: give this circuit its own copy so the two dim
    // independently.
    const byCircuit = clones.get(mat) ?? new Map<CircuitId, THREE.MeshStandardMaterial>();
    clones.set(mat, byCircuit);
    const existing = byCircuit.get(cid);
    if (existing) return existing;
    const copy = mat.clone();
    copy.userData = { ...mat.userData };
    byCircuit.set(cid, copy);
    return copy;
  };

  const bindMaterial = (mat: THREE.MeshStandardMaterial, cid: CircuitId): void => {
    if (materialCircuit.has(mat)) return;
    materialCircuit.set(mat, cid);
    if (typeof mat.userData.baseEmissiveIntensity !== 'number') {
      mat.userData = { ...mat.userData, baseEmissiveIntensity: mat.emissiveIntensity };
    }
    ctx.lightGroups[cid].emissives.push(mat);
  };

  const isLampMaterial = (mat: THREE.Material): mat is THREE.MeshStandardMaterial =>
    mat instanceof THREE.MeshStandardMaterial &&
    !mat.emissiveMap &&
    mat.emissive.getHex() !== 0 &&
    mat.emissiveIntensity >= MIN_FITTING_EMISSIVE;

  for (const root of roots) {
    root.traverse((obj) => {
      const cid = classifyOutbuildingLight(obj);
      if (!cid || !ctx.lightGroups[cid]) return;
      if (obj instanceof THREE.PointLight) {
        if (seenLights.has(obj)) return;
        seenLights.add(obj);
        if (typeof obj.userData.baseIntensity !== 'number') {
          obj.userData = { ...obj.userData, baseIntensity: obj.intensity };
        }
        ctx.lightGroups[cid].lights.push(obj);
        return;
      }
      if (!(obj instanceof THREE.Mesh)) return;
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((m: THREE.Material) => {
          if (!isLampMaterial(m)) return m;
          const own = materialFor(m, cid);
          bindMaterial(own, cid);
          return own;
        });
        return;
      }
      const mat: THREE.Material = obj.material;
      if (!isLampMaterial(mat)) return;
      const own = materialFor(mat, cid);
      if (own !== mat) obj.material = own;
      bindMaterial(own, cid);
    });
  }
}
