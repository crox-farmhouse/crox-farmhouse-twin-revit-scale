import * as THREE from 'three';

/** Replacement objects found (by userData role tags) after zones are reloaded from USD. */
export interface UsdRebindCandidates {
  readonly doorCandidates: ReadonlyMap<string, THREE.Group>;
  readonly drawerCandidates: ReadonlyMap<string, THREE.Group>;
  readonly bifoldOuterCandidates: ReadonlyMap<string, THREE.Group>;
  readonly bifoldInnerCandidates: ReadonlyMap<string, THREE.Group>;
  readonly pulleyRackCandidate: THREE.Group | null;
  readonly pulleyVertRopes: ReadonlyMap<number, THREE.Mesh>;
  readonly pulleyWheels: ReadonlyMap<number, THREE.Mesh>;
  readonly pulleyWallRope: THREE.Mesh | null;
  readonly carGateNorthCandidate: THREE.Group | null;
  readonly carGateSouthCandidate: THREE.Group | null;
}

/**
 * Traverses `roots`, pushing every raycastable interactive mesh into `interactiveMeshes` and
 * collecting the animated pivot/group replacements keyed by their legacy interactable ids.
 */
export function collectUsdRebindCandidates(
  roots: readonly THREE.Object3D[],
  interactiveMeshes: THREE.Object3D[]
): UsdRebindCandidates {
  const seenMeshes = new Set<THREE.Object3D>();

  const doorCandidates = new Map<string, THREE.Group>();
  const drawerCandidates = new Map<string, THREE.Group>();
  const bifoldOuterCandidates = new Map<string, THREE.Group>();
  const bifoldInnerCandidates = new Map<string, THREE.Group>();
  let pulleyRackCandidate: THREE.Group | null = null;
  const pulleyVertRopes = new Map<number, THREE.Mesh>();
  const pulleyWheels = new Map<number, THREE.Mesh>();
  let pulleyWallRope: THREE.Mesh | null = null;
  let carGateNorthCandidate: THREE.Group | null = null;
  let carGateSouthCandidate: THREE.Group | null = null;

  for (const root of roots) {
    root.traverse((obj) => {
      const u = (obj.userData ?? {}) as Record<string, unknown>;

      if (obj instanceof THREE.Group) {
        const id = typeof u.interactableId === 'string' ? u.interactableId : undefined;
        if (id) {
          if (id.startsWith('door-')) {
            const existing = doorCandidates.get(id);
            if (!existing || (u.doorRole === 'pivot' && existing.userData?.doorRole !== 'pivot')) {
              doorCandidates.set(id, obj);
            }
          } else if (id.startsWith('drawer-')) {
            const existing = drawerCandidates.get(id);
            if (!existing || (u.drawerRole === 'group' && existing.userData?.drawerRole !== 'group')) {
              drawerCandidates.set(id, obj);
            }
          } else if (id.startsWith('bifold-cupboard-')) {
            if (u.bifoldRole === 'outerPivot' && !bifoldOuterCandidates.has(id)) {
              bifoldOuterCandidates.set(id, obj);
            } else if (u.bifoldRole === 'innerLeaf' && !bifoldInnerCandidates.has(id)) {
              bifoldInnerCandidates.set(id, obj);
            }
          }
        }
        if (u.pulleyMaidRole === 'rackMovingGroup') {
          pulleyRackCandidate = obj;
        }
        if (u.carGateRole === 'northPivot') {
          carGateNorthCandidate = obj;
        } else if (u.carGateRole === 'southPivot') {
          carGateSouthCandidate = obj;
        }
      }

      if (obj instanceof THREE.Mesh && !seenMeshes.has(obj)) {
        if (
          u.interactableId ||
          u.circuitId ||
          u.isBifoldDoor ||
          u.isCarGate ||
          u.isClimbableLadder ||
          u.isGolfSimulatorShot ||
          u.isKNXSwitch ||
          u.isUtilitySwitch ||
          u.isCourtyardSwitch ||
          u.isKitchenMotionSensor ||
          u.isUtilityMotionSensor ||
          u.roomMotionSensorId ||
          u.isFrameTV ||
          u.isUniFiCamera ||
          u.isUniFiAccessReader ||
          u.ufhZoneId
        ) {
          seenMeshes.add(obj);
          interactiveMeshes.push(obj);
        }

        if (u.pulleyMaidRole === 'vertRope' && typeof u.pulleyMaidIndex === 'number') {
          pulleyVertRopes.set(u.pulleyMaidIndex, obj);
        } else if (u.pulleyMaidRole === 'pulleyWheel' && typeof u.pulleyMaidIndex === 'number') {
          pulleyWheels.set(u.pulleyMaidIndex, obj);
        } else if (u.pulleyMaidRole === 'wallHaulRope') {
          pulleyWallRope = obj;
        }
      }
    });
  }

  return {
    doorCandidates,
    drawerCandidates,
    bifoldOuterCandidates,
    bifoldInnerCandidates,
    pulleyRackCandidate,
    pulleyVertRopes,
    pulleyWheels,
    pulleyWallRope,
    carGateNorthCandidate,
    carGateSouthCandidate,
  };
}
