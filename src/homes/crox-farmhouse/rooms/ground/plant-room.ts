import * as THREE from 'three';
import { buildPlantRoomHeatingManifold } from '../../../../objects/fixtures/hydronic-manifold.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

/**
 * Plant Room heating manifold and PPE coat-hook rail.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildPlantRoom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
): void {
  const { scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    castIronMat,
    tier2FloorY,
  } = kit;
  // =========================================================================
  // 7A-3. PLANT ROOM NORTH WALL: 10-PORT STAINLESS-STEEL HYDRONIC HEATING MANIFOLD
  //       & MIXING PUMP STATION (Issue #3 — mounted at [-18.116, 1.318, 8.39] facing +Z)
  // =========================================================================
  buildPlantRoomHeatingManifold(scene, tier2FloorY, brassMat, castIronMat);

  // =========================================================================
  // 7B. PLANT ROOM PARTITION WALL (EAST FACE): HIGH-VISIBILITY SAFETY JACKETS ON COAT HOOK RAIL
  //     (Issue #20: Mounted on the East +X = -18.84m face of the Study/Plant Room partition wall
  //      at [-18.84, 1.033, 9.475], facing East into the Plant Room)
  // =========================================================================
  {
    const hiVisRackGroup = new THREE.Group();
    hiVisRackGroup.name = 'study.highVisCoatRack';
    hiVisRackGroup.userData.zone = 'study';
    hiVisRackGroup.position.set(-18.84, 1.12, 9.42);

    const hiVisYellowMat = new THREE.MeshStandardMaterial({
      color: 0xdff218, // EN ISO 20471 fluorescent hi-vis yellow fabric
      emissive: 0x8ea000,
      emissiveIntensity: 0.14,
      roughness: 0.62,
      metalness: 0.02,
    });
    const hiVisOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff5512, // EN ISO 20471 railway/site hi-vis orange fabric
      emissive: 0x992800,
      emissiveIntensity: 0.14,
      roughness: 0.62,
      metalness: 0.02,
    });
    const hiVisNavyTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1c2536, // Dark navy contrast storm collar & lower hem panel
      roughness: 0.72,
    });
    const retroReflectiveTapeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8ee, // 50mm 3M Scotchlite silver retro-reflective tape bands
      roughness: 0.16,
      metalness: 0.82,
    });

    // Shared geometries across the 4 hooks and 3 high-visibility site parkas
    const pegRailBoardGeo = createSharedGeo(new THREE.BoxGeometry(0.024, 0.085, 0.94));
    const hookBackplateGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 12));
    const hookProngGeo = createSharedGeo(new THREE.CylinderGeometry(0.005, 0.006, 0.055, 10));
    const stormCollarGeo = createSharedGeo(new THREE.CylinderGeometry(0.044, 0.062, 0.082, 18));
    const stowedHoodRollGeo = createSharedGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.115, 14));
    const shoulderYokeGeo = createSharedGeo(new THREE.SphereGeometry(0.118, 20, 14));
    const upperTorsoGeo = createSharedGeo(new THREE.CylinderGeometry(0.078, 0.098, 0.30, 20));
    const lowerTorsoGeo = createSharedGeo(new THREE.CylinderGeometry(0.096, 0.115, 0.34, 20));
    const drapeFoldGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.018, 0.58, 10));
    const stormPlacketGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.64, 0.036));
    const snapGeo = createSharedGeo(new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 10));
    const chestPocketGeo = createSharedGeo(new THREE.BoxGeometry(0.012, 0.085, 0.062));
    const chestPocketFlapGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.024, 0.066));
    const cargoPocketGeo = createSharedGeo(new THREE.BoxGeometry(0.016, 0.125, 0.082));
    const cargoFlapGeo = createSharedGeo(new THREE.BoxGeometry(0.018, 0.028, 0.086));
    const navyHemGeo = createSharedGeo(new THREE.CylinderGeometry(0.110, 0.120, 0.15, 20));
    const chestReflectiveTapeGeo = createSharedGeo(new THREE.CylinderGeometry(0.093, 0.097, 0.044, 20));
    const waistReflectiveTapeGeo = createSharedGeo(new THREE.CylinderGeometry(0.103, 0.107, 0.044, 20));
    const suspenderStrapGeo = createSharedGeo(new THREE.BoxGeometry(0.006, 0.21, 0.036));
    const shoulderCrestStrapGeo = createSharedGeo(
      new THREE.CylinderGeometry(0.046, 0.046, 0.036, 14, 1, false, 0, Math.PI)
    );
    const upperSleeveGeo = createSharedGeo(new THREE.CylinderGeometry(0.036, 0.040, 0.25, 14));
    const upperSleeveTapeGeo = createSharedGeo(new THREE.CylinderGeometry(0.039, 0.040, 0.034, 14));
    const lowerSleeveGeo = createSharedGeo(new THREE.CylinderGeometry(0.039, 0.042, 0.24, 14));
    const lowerCuffTapeGeo = createSharedGeo(new THREE.CylinderGeometry(0.042, 0.043, 0.036, 14));
    const navyStormCuffGeo = createSharedGeo(new THREE.CylinderGeometry(0.041, 0.038, 0.06, 14));

    // Solid antique oak wall peg rail (0.94m long along Z, 0.085m tall, 0.024m thick)
    const pegRailBoard = new THREE.Mesh(
      pegRailBoardGeo,
      antiqueOakSkirtingMat
    );
    pegRailBoard.name = 'study.highVisCoatRack.railBoard';
    pegRailBoard.position.set(0.012, 0, 0);
    pegRailBoard.castShadow = true;
    pegRailBoard.receiveShadow = true;
    hiVisRackGroup.add(pegRailBoard);

    // 4 Aged-Brass Coat Hooks along the oak rail + 3 Draped High-Visibility Jackets
    const hookZPositions = [-0.33, -0.11, 0.11, 0.33] as const;
    for (const [hIdx, hz] of hookZPositions.entries()) {
      const hookBackplate = tagHighLod(
        new THREE.Mesh(hookBackplateGeo, brassMat)
      );
      hookBackplate.name = `study.highVisCoatRack.hook.${hIdx + 1}.backplate`;
      hookBackplate.rotation.z = Math.PI / 2;
      hookBackplate.position.set(0.026, 0, hz);
      hiVisRackGroup.add(hookBackplate);

      const hookProng = tagHighLod(
        new THREE.Mesh(hookProngGeo, brassMat)
      );
      hookProng.name = `study.highVisCoatRack.hook.${hIdx + 1}.prong`;
      hookProng.rotation.z = -Math.PI / 3;
      hookProng.position.set(0.048, 0.014, hz);
      hiVisRackGroup.add(hookProng);

      // Hang 3 high-LOD sculpted EN ISO 20471 high-vis site parkas on hooks 0, 1, and 3 (Yellow, Orange, Yellow — Issue #11)
      if (hIdx !== 2) {
        const isOrange = hIdx === 1;
        const mainFabricMat = isOrange ? hiVisOrangeMat : hiVisYellowMat;
        const jacketPrefix = `study.highVisCoatRack.jacket.${hIdx + 1}`;
        const jacketGroup = new THREE.Group();
        jacketGroup.name = jacketPrefix;
        jacketGroup.position.set(0.058, -0.01, hz);
        jacketGroup.rotation.y = (hIdx - 1.5) * 0.05;

        // 1. Stand-up fleece-lined dark navy storm collar + rolled hood collar pack hooked onto the brass prong
        const stormCollar = new THREE.Mesh(
          stormCollarGeo,
          hiVisNavyTrimMat
        );
        stormCollar.name = `${jacketPrefix}.stormCollar`;
        stormCollar.scale.set(0.56, 1, 1.18);
        stormCollar.position.set(0.002, -0.028, 0);
        stormCollar.castShadow = true;
        jacketGroup.add(stormCollar);

        const stowedHoodRoll = tagHighLod(
          new THREE.Mesh(stowedHoodRollGeo, hiVisNavyTrimMat)
        );
        stowedHoodRoll.name = `${jacketPrefix}.stowedHoodRoll`;
        stowedHoodRoll.rotation.x = Math.PI / 2;
        stowedHoodRoll.position.set(-0.016, 0.008, 0);
        jacketGroup.add(stowedHoodRoll);

        // 2. Contoured padded shoulder yoke (dark navy foul-weather shoulder cap)
        const shoulderYoke = new THREE.Mesh(
          shoulderYokeGeo,
          hiVisNavyTrimMat
        );
        shoulderYoke.name = `${jacketPrefix}.shoulderYoke`;
        shoulderYoke.scale.set(0.46, 0.54, 1.14);
        shoulderYoke.position.set(0.008, -0.095, 0);
        shoulderYoke.castShadow = true;
        jacketGroup.add(shoulderYoke);

        // 3. Upper & lower contoured fluorescent hi-vis parka torso with natural hang flare
        const upperTorso = new THREE.Mesh(
          upperTorsoGeo,
          mainFabricMat
        );
        upperTorso.name = `${jacketPrefix}.torso`;
        upperTorso.scale.set(0.52, 1, 1.24);
        upperTorso.position.set(0.008, -0.22, 0);
        upperTorso.castShadow = true;
        upperTorso.receiveShadow = true;
        jacketGroup.add(upperTorso);

        const lowerTorso = new THREE.Mesh(
          lowerTorsoGeo,
          mainFabricMat
        );
        lowerTorso.name = `${jacketPrefix}.lowerTorso`;
        lowerTorso.scale.set(0.53, 1, 1.25);
        lowerTorso.position.set(0.008, -0.53, 0);
        lowerTorso.castShadow = true;
        lowerTorso.receiveShadow = true;
        jacketGroup.add(lowerTorso);

        // Sculpted vertical fabric drape pleats down the front & back of the hanging parka
        for (const [fIdx, dz] of ([-0.072, -0.028, 0.028, 0.072] as const).entries()) {
          const drapeFold = tagHighLod(
            new THREE.Mesh(drapeFoldGeo, mainFabricMat)
          );
          drapeFold.name = `${jacketPrefix}.drapeFold.${fIdx + 1}`;
          drapeFold.scale.set(0.65, 1, 0.9);
          drapeFold.position.set(0.052, -0.39, dz);
          drapeFold.rotation.z = -0.03;
          jacketGroup.add(drapeFold);
        }

        // 4. Full-length central dark navy storm-flap zipper placket + 5 metallic press-stud snaps
        const stormPlacket = tagHighLod(
          new THREE.Mesh(stormPlacketGeo, hiVisNavyTrimMat)
        );
        stormPlacket.name = `${jacketPrefix}.stormPlacket`;
        stormPlacket.position.set(0.058, -0.39, 0);
        stormPlacket.rotation.z = -0.025;
        jacketGroup.add(stormPlacket);

        for (let snapIdx = 0; snapIdx < 5; snapIdx++) {
          const snap = tagHighLod(
            new THREE.Mesh(snapGeo, brassMat)
          );
          snap.name = `${jacketPrefix}.snap.${snapIdx + 1}`;
          snap.rotation.z = Math.PI / 2;
          snap.position.set(0.066, -0.12 - snapIdx * 0.13, 0);
          jacketGroup.add(snap);
        }

        // 5. Chest radio loop / ID badge pocket & dual lower waterproof bellows cargo pockets with navy flaps
        const chestPocket = tagHighLod(
          new THREE.Mesh(chestPocketGeo, mainFabricMat)
        );
        chestPocket.name = `${jacketPrefix}.chestPocket`;
        chestPocket.position.set(0.054, -0.23, 0.062);
        jacketGroup.add(chestPocket);

        const chestPocketFlap = tagHighLod(
          new THREE.Mesh(chestPocketFlapGeo, hiVisNavyTrimMat)
        );
        chestPocketFlap.name = `${jacketPrefix}.chestPocketFlap`;
        chestPocketFlap.position.set(0.056, -0.19, 0.062);
        jacketGroup.add(chestPocketFlap);

        for (const [pIdx, pz] of ([-0.074, 0.074] as const).entries()) {
          const cargoPocket = tagHighLod(
            new THREE.Mesh(cargoPocketGeo, mainFabricMat)
          );
          cargoPocket.name = `${jacketPrefix}.cargoPocket.${pIdx + 1}`;
          cargoPocket.position.set(0.055, -0.55, pz);
          cargoPocket.castShadow = true;
          jacketGroup.add(cargoPocket);

          const cargoFlap = tagHighLod(
            new THREE.Mesh(cargoFlapGeo, hiVisNavyTrimMat)
          );
          cargoFlap.name = `${jacketPrefix}.cargoFlap.${pIdx + 1}`;
          cargoFlap.position.set(0.058, -0.49, pz);
          jacketGroup.add(cargoFlap);
        }

        // 6. Dark navy lower fouling-resistant hem band (bottom 15cm of parka)
        const navyHem = new THREE.Mesh(
          navyHemGeo,
          hiVisNavyTrimMat
        );
        navyHem.name = `${jacketPrefix}.navyHem`;
        navyHem.scale.set(0.54, 1, 1.26);
        navyHem.position.set(0.008, -0.645, 0);
        jacketGroup.add(navyHem);

        // 7. EN ISO 20471 Class 3 50mm silver 3M Scotchlite retro-reflective tape bands:
        //    - Two horizontal torso bands around chest & waist
        for (const [tIdx, tapeY, tapeGeo] of [
          [0, -0.31, chestReflectiveTapeGeo],
          [1, -0.46, waistReflectiveTapeGeo],
        ] as const) {
          const horizTape = new THREE.Mesh(
            tapeGeo,
            retroReflectiveTapeMat
          );
          horizTape.name =
            tIdx === 0
              ? `${jacketPrefix}.reflectiveTape`
              : `${jacketPrefix}.reflectiveTape.waist`;
          horizTape.scale.set(0.55, 1, 1.27);
          horizTape.position.set(0.008, tapeY, 0);
          jacketGroup.add(horizTape);
        }

        //    - Conforming over-the-shoulder vertical silver reflective suspender bands (front, shoulder crest, and back)
        for (const [sIdx, sz] of ([-0.056, 0.056] as const).entries()) {
          const frontStrap = tagHighLod(
            new THREE.Mesh(suspenderStrapGeo, retroReflectiveTapeMat)
          );
          frontStrap.name = `${jacketPrefix}.frontStrap.${sIdx + 1}`;
          frontStrap.position.set(0.052, -0.205, sz);
          frontStrap.rotation.z = -0.05;
          jacketGroup.add(frontStrap);

          const backStrap = tagHighLod(
            new THREE.Mesh(suspenderStrapGeo, retroReflectiveTapeMat)
          );
          backStrap.name = `${jacketPrefix}.backStrap.${sIdx + 1}`;
          backStrap.position.set(-0.036, -0.205, sz);
          backStrap.rotation.z = 0.05;
          jacketGroup.add(backStrap);

          const shoulderCrestStrap = tagHighLod(
            new THREE.Mesh(shoulderCrestStrapGeo, retroReflectiveTapeMat)
          );
          shoulderCrestStrap.name = `${jacketPrefix}.shoulderCrestStrap.${sIdx + 1}`;
          shoulderCrestStrap.rotation.x = Math.PI / 2;
          shoulderCrestStrap.scale.set(0.96, 0.55, 1);
          shoulderCrestStrap.position.set(0.008, -0.10, sz);
          jacketGroup.add(shoulderCrestStrap);
        }

        // 8. Articulated 2-segment draped long sleeves (upper arm + elbow bend + forearm + navy storm cuff + twin reflective bands)
        for (const sideSign of [-1, 1] as const) {
          const sideKey = sideSign < 0 ? 'left' : 'right';
          const sleeveGroup = new THREE.Group();
          sleeveGroup.name = `${jacketPrefix}.sleeve.${sideKey}`;
          sleeveGroup.position.set(0.012, -0.11, sideSign * 0.112);
          sleeveGroup.rotation.x = sideSign * 0.09;
          sleeveGroup.rotation.z = 0.04;

          const upperSleeve = new THREE.Mesh(
            upperSleeveGeo,
            mainFabricMat
          );
          upperSleeve.name = `${jacketPrefix}.sleeve.${sideKey}.upper`;
          upperSleeve.scale.set(0.74, 1, 0.94);
          upperSleeve.position.set(0, -0.12, 0);
          upperSleeve.castShadow = true;
          sleeveGroup.add(upperSleeve);

          const upperSleeveTape = new THREE.Mesh(
            upperSleeveTapeGeo,
            retroReflectiveTapeMat
          );
          upperSleeveTape.name = `${jacketPrefix}.sleeve.${sideKey}.upperTape`;
          upperSleeveTape.scale.set(0.76, 1, 0.96);
          upperSleeveTape.position.set(0, -0.19, 0);
          sleeveGroup.add(upperSleeveTape);

          const lowerSleeveGroup = new THREE.Group();
          lowerSleeveGroup.name = `${jacketPrefix}.sleeve.${sideKey}.forearmGroup`;
          lowerSleeveGroup.position.set(0, -0.24, 0);
          lowerSleeveGroup.rotation.z = 0.07;
          lowerSleeveGroup.rotation.x = -sideSign * 0.04;

          const lowerSleeve = new THREE.Mesh(
            lowerSleeveGeo,
            mainFabricMat
          );
          lowerSleeve.name = `${jacketPrefix}.sleeve.${sideKey}.lower`;
          lowerSleeve.scale.set(0.74, 1, 0.94);
          lowerSleeve.position.set(0, -0.11, 0);
          lowerSleeve.castShadow = true;
          lowerSleeveGroup.add(lowerSleeve);

          const lowerCuffTape = new THREE.Mesh(
            lowerCuffTapeGeo,
            retroReflectiveTapeMat
          );
          lowerCuffTape.name = `${jacketPrefix}.sleeve.${sideKey}.cuffTape`;
          lowerCuffTape.scale.set(0.76, 1, 0.96);
          lowerCuffTape.position.set(0, -0.16, 0);
          lowerSleeveGroup.add(lowerCuffTape);

          const navyStormCuff = new THREE.Mesh(
            navyStormCuffGeo,
            hiVisNavyTrimMat
          );
          navyStormCuff.name = `${jacketPrefix}.sleeve.${sideKey}.stormCuff`;
          navyStormCuff.scale.set(0.75, 1, 0.95);
          navyStormCuff.position.set(0, -0.21, 0);
          lowerSleeveGroup.add(navyStormCuff);

          sleeveGroup.add(lowerSleeveGroup);
          jacketGroup.add(sleeveGroup);
        }

        hiVisRackGroup.add(jacketGroup);
      }
    }

    scene.add(hiVisRackGroup);
  }
}
