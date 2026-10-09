import * as THREE from 'three';
import {
  buildDefender110FrontFasciaAndHeadlights,
  buildDefender110SignatureExteriorAccessories,
  buildDefender110TailgateTaillightsAndExhaust,
} from './defender-110/defender-exterior-trim-and-lights.ts';
import {
  buildDefender110MonocoqueAndCladding,
  createDefender110Materials,
} from './defender-110/defender-materials-and-monocoque.ts';
import {
  buildDefender110GlazingTrimAndCabinInterior,
  buildDefender110WheelsAndSpare,
} from './defender-110/defender-wheels-and-interior.ts';

export * from './defender-110/defender-materials-and-monocoque.ts';
export * from './defender-110/defender-exterior-trim-and-lights.ts';
export * from './defender-110/defender-wheels-and-interior.ts';

/**
 * Builds an extraordinary, showroom-grade, ultra-accurate 3D model of a
 * **Black Land Rover Defender 110 (L663 V8 Carpathian / Black Pack Edition in Santorini Black Metallic)**
 * (`courtyard.landRoverDefender`, `userData.zone = 'courtyard'`) parked on the cobbled courtyard
 * at world `[-12.538, -0.353, 6.565]`.
 */
export function buildLandRoverDefender(
  scene: THREE.Scene,
  getCourtyardGroundY?: (wx: number, wz: number) => number
): void {
  const defenderGroup = new THREE.Group();
  defenderGroup.name = 'courtyard.landRoverDefender';
  defenderGroup.userData.zone = 'courtyard';

  // ---------------------------------------------------------------------------
  // Placement, Orientation & Graded Courtyard Cobble Terrain Alignment
  // ---------------------------------------------------------------------------
  const worldCenterX = -12.538;
  const worldCenterZ = 6.565;
  const yaw = -Math.PI + 0.42; // Front nose (-x) faces East-Northeast toward the Farmhouse as driven in through the Courtyard Gate

  // Sample exact cobbled courtyard ground height at center, front/rear axles, and left/right tracks.
  // Fallback uses `-0.353` at `(-12.538, 6.565)` with the courtyard surface normal `[-0.068, 0.996, 0.058]`.
  const sampleGroundY = (wx: number, wz: number): number => {
    if (getCourtyardGroundY) {
      const gy = getCourtyardGroundY(wx, wz);
      if (Number.isFinite(gy)) return gy;
    }
    return -0.353 - (-0.068 * (wx - worldCenterX) + 0.058 * (wz - worldCenterZ)) / 0.996;
  };

  const toWorldXZ = (localX: number, localZ: number): [number, number] => {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    return [
      worldCenterX + localX * cosY + localZ * sinY,
      worldCenterZ - localX * sinY + localZ * cosY,
    ];
  };

  const yCenterGround = sampleGroundY(worldCenterX, worldCenterZ);
  const [frontAxleWX, frontAxleWZ] = toWorldXZ(-1.51, 0);
  const [rearAxleWX, rearAxleWZ] = toWorldXZ(1.51, 0);
  const [leftTrackWX, leftTrackWZ] = toWorldXZ(0, -0.86);
  const [rightTrackWX, rightTrackWZ] = toWorldXZ(0, 0.86);

  const yFrontAxle = sampleGroundY(frontAxleWX, frontAxleWZ);
  const yRearAxle = sampleGroundY(rearAxleWX, rearAxleWZ);
  const yLeftTrack = sampleGroundY(leftTrackWX, leftTrackWZ);
  const yRightTrack = sampleGroundY(rightTrackWX, rightTrackWZ);

  const wheelContactAvgY =
    0.25 * (yFrontAxle + yRearAxle + yLeftTrack + yRightTrack);
  const baseGroundY = 0.5 * (yCenterGround + wheelContactAvgY);

  // Pitch (`rotation.z`) and Roll (`rotation.x`) in `'YXZ'` Euler order so all 4 tires sit 100% flush on the cobbles
  const pitchZ = Math.atan2(yRearAxle - yFrontAxle, 3.022);
  const rollX = Math.atan2(yLeftTrack - yRightTrack, 1.72);

  defenderGroup.rotation.order = 'YXZ';
  defenderGroup.position.set(worldCenterX, baseGroundY, worldCenterZ);
  defenderGroup.rotation.set(rollX, yaw, pitchZ);
  scene.add(defenderGroup);

  const mats = createDefender110Materials();

  // 1. Contact shadow pad, chassis undertray, lofted L663 monocoque body shell, floating roof, waist strip & wheel arch cladding
  buildDefender110MonocoqueAndCladding(defenderGroup, mats);

  // 2. Signature Graphic C-pillar panel, Alpine roof lights, sunroof, roof rails, side gear carrier, safari snorkel & fender vents
  buildDefender110SignatureExteriorAccessories(defenderGroup, mats);

  // 3. Multi-slot Narvik Black front grille, DEFENDER bonnet lettering, Matrix LED Halo headlights & Shadow Atlas front bumper/skid pan
  buildDefender110FrontFasciaAndHeadlights(defenderGroup, mats);

  // 4. Vertical Kamm tailgate, rear plate, V8 badge, recessed smoked quad-square LED taillights & quad V8 exhaust/diffuser
  buildDefender110TailgateTaillightsAndExhaust(defenderGroup, mats);

  // 5. Tailgate-mounted 22" spare wheel & 4× 22" Style 5098 Gloss Black road wheels, All-Terrain tires & Xenon Blue V8 brakes
  buildDefender110WheelsAndSpare(defenderGroup, mats);

  // 6. Conformal glazing, wing mirrors, door handles, rock-slider side steps & high-LOD L663 4-door cabin interior
  buildDefender110GlazingTrimAndCabinInterior(defenderGroup, mats);

  // Ensure every object in `defenderGroup` carries `userData.zone = 'courtyard'`, a semantic `.name`, and a valid bounding sphere
  defenderGroup.traverse((obj) => {
    obj.userData.zone = 'courtyard';
    if (!obj.name) {
      obj.name = 'courtyard.landRoverDefender.part';
    }
    if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BufferGeometry) {
      if (!obj.geometry.boundingSphere) {
        obj.geometry.computeBoundingSphere();
      }
    }
  });
}
