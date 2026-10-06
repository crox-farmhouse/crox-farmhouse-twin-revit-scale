import * as THREE from 'three';
import {
  buildPorsche992FrontFasciaAndHeadlights,
  buildPorsche992RearAeroTaillightAndDiffuser,
  buildPorsche992SideMirrorsHandlesAndIntakes,
} from './porsche-992/porsche-fascia-lights-and-aero.ts';
import {
  buildPorsche992BodyAndUnderbody,
  createPorsche992Materials,
} from './porsche-992/porsche-materials-and-body.ts';
import {
  buildPorsche992GlazingAndInteriorCabin,
  buildPorsche992WheelsAndBrakes,
} from './porsche-992/porsche-wheels-and-cabin.ts';

export * from './porsche-992/porsche-materials-and-body.ts';
export * from './porsche-992/porsche-fascia-lights-and-aero.ts';
export * from './porsche-992/porsche-wheels-and-cabin.ts';

/**
 * Builds an authentic, showroom-grade 3D model of a **Porsche 911 (992.2) Turbo S Coupé in Ocean Blue Metallic**
 * (`outbuildings.garage.porsche992TurboS`, `userData.zone = 'study'`) parked **100% straight** in the East Garage bay
 * (`u = 10.44m, y = garageFloorTopY, v = 2.86m, rotation.y = -Math.PI / 2`), facing straight North (`-v`) toward the
 * East Garage Double Coach Doors (`u = 9.12..11.76m`) per Issue #2 ("Move the car to this side" at `[-11.137, -0.5, 18.79]`).
 */
export function buildPorsche992TurboS(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const carGroup = new THREE.Group();
  carGroup.name = 'outbuildings.garage.porsche992TurboS';
  carGroup.userData.zone = 'study';
  carGroup.position.set(10.44, garageFloorTopY, 2.86);
  carGroup.rotation.y = -Math.PI / 2;
  groundGroup.add(carGroup);

  const mats = createPorsche992Materials();

  // 1. Contact shadow pad, undertray, unified monocoque 992.2 widebody shell, fender lips/liners & rocker skirts
  buildPorsche992BodyAndUnderbody(carGroup, mats);

  // 2. Flush compound-curved glazing & high-LOD 992.2 interior cabin
  buildPorsche992GlazingAndInteriorCabin(carGroup, mats);

  // 3. 992.2 front fascia, active vertical cooling louvres, PAA chin splitter, plates, crest & 4-point HD-Matrix headlights
  buildPorsche992FrontFasciaAndHeadlights(carGroup, mats);

  // 4. Sculpted wing mirrors, flush door handles & widebody side intercooler intake scoops
  buildPorsche992SideMirrorsHandlesAndIntakes(carGroup, mats);

  // 5. Slatted rear engine decklid grille, active rear wing, wrap-around LED taillight bar & rear valance/titanium exhaust
  buildPorsche992RearAeroTaillightAndDiffuser(carGroup, mats);

  // 6. Staggered 20"/21" Turbo S Exclusive Design Center-Lock forged wheels & PCCB carbon-ceramic brakes
  buildPorsche992WheelsAndBrakes(carGroup, mats);

  // Ensure every descendant carries `userData.zone = 'study'`, a semantic hierarchical `.name`, and a valid bounding sphere
  carGroup.traverse((obj) => {
    obj.userData.zone = 'study';
    if (!obj.name) {
      obj.name = 'outbuildings.garage.porsche992TurboS.part';
    }
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BufferGeometry) {
      if (!obj.geometry.boundingSphere) {
        obj.geometry.computeBoundingSphere();
      }
    }
  });
}
