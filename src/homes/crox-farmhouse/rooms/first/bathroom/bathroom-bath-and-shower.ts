import * as THREE from 'three';

export interface FamilyBathroomBathAndShowerKit {
  brassMat: THREE.Material;
  ceramicWhiteMat: THREE.Material;
  floorTopY: number;
  windowGlassMat: THREE.Material;
}

/**
 * Builds the Family Bathroom walk-in glass shower enclosure, freestanding burnished
 * copper "Tubby Tub" bateau bath, and wall-mounted brass heated towel rail.
 */
export function buildFamilyBathroomBathAndShower(
  scene: THREE.Group,
  kit: FamilyBathroomBathAndShowerKit
): void {
  const { brassMat, ceramicWhiteMat, floorTopY, windowGlassMat } = kit;

  // 1. Walk-in Glass Shower Enclosure in SW corner of Bathroom, oriented LENGTHWISE into the room (`0.84m` wide along X x `1.20m` long along Z) (Issue #3)
  {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'familyBathroom.showerEnclosure';

    const showerTrayGeo = new THREE.BoxGeometry(0.84, 0.045, 1.2);
    showerTrayGeo.computeBoundingSphere();
    const showerTray = new THREE.Mesh(showerTrayGeo, ceramicWhiteMat);
    showerTray.name = 'familyBathroom.showerTray';
    showerTray.position.set(-12.38, floorTopY + 0.0225, 0.3);
    showerTray.receiveShadow = true;
    showerGroup.add(showerTray);

    const showerDrainGrateGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.004, 16);
    showerDrainGrateGeo.computeBoundingSphere();
    const showerDrainGrate = new THREE.Mesh(showerDrainGrateGeo, brassMat);
    showerDrainGrate.name = 'familyBathroom.showerEnclosure.drainGrate';
    showerDrainGrate.userData.lodTier = 'high';
    showerDrainGrate.userData.lodMaxDistance = 12;
    showerDrainGrate.position.set(-12.52, floorTopY + 0.046, 0.58);
    showerGroup.add(showerDrainGrate);

    // Frameless low-iron glass walk-in screen running lengthwise (North-South) along the East edge (`X = -11.97m, Z = +0.06m..+0.90m`)
    // leaving a generous walk-in entry at the North end (`Z = -0.30m..+0.06m`)
    const showerGlassScreenGeo = new THREE.BoxGeometry(0.018, 1.92, 0.84);
    showerGlassScreenGeo.computeBoundingSphere();
    const showerGlassScreen = new THREE.Mesh(showerGlassScreenGeo, windowGlassMat);
    showerGlassScreen.name = 'familyBathroom.showerGlass';
    showerGlassScreen.position.set(-11.97, floorTopY + 0.96, 0.48);
    showerGroup.add(showerGlassScreen);

    // Brass vertical wall channel at the South wall (`Z = +0.89m`) & horizontal overhead bracing arm to the West wall (`X = -12.81m`)
    const glassWallChannelGeo = new THREE.BoxGeometry(0.026, 1.92, 0.024);
    glassWallChannelGeo.computeBoundingSphere();
    const glassWallChannel = new THREE.Mesh(glassWallChannelGeo, brassMat);
    glassWallChannel.name = 'familyBathroom.showerEnclosure.wallChannel';
    glassWallChannel.userData.lodTier = 'high';
    glassWallChannel.userData.lodMaxDistance = 12;
    glassWallChannel.position.set(-11.97, floorTopY + 0.96, 0.888);
    showerGroup.add(glassWallChannel);

    const glassSupportArmGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.84, 10);
    glassSupportArmGeo.computeBoundingSphere();
    const glassSupportArm = new THREE.Mesh(glassSupportArmGeo, brassMat);
    glassSupportArm.name = 'familyBathroom.showerEnclosure.supportArm';
    glassSupportArm.userData.lodTier = 'high';
    glassSupportArm.userData.lodMaxDistance = 12;
    glassSupportArm.rotation.z = Math.PI / 2;
    glassSupportArm.position.set(-12.39, floorTopY + 1.9, 0.1);
    showerGroup.add(glassSupportArm);

    // Exposed traditional brass thermostatic shower riser & overhead rainfall deluge head on the West wall (`X = -12.74m, Z = +0.42m`)
    const showerRiserGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.08, 12);
    showerRiserGeo.computeBoundingSphere();
    const showerRiser = new THREE.Mesh(showerRiserGeo, brassMat);
    showerRiser.name = 'familyBathroom.showerEnclosure.riser';
    showerRiser.userData.lodTier = 'high';
    showerRiser.userData.lodMaxDistance = 12;
    showerRiser.position.set(-12.74, floorTopY + 1.42, 0.42);
    showerGroup.add(showerRiser);

    const showerValveBarGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12);
    showerValveBarGeo.computeBoundingSphere();
    const showerValveBar = new THREE.Mesh(showerValveBarGeo, brassMat);
    showerValveBar.name = 'familyBathroom.showerEnclosure.valveBar';
    showerValveBar.userData.lodTier = 'high';
    showerValveBar.userData.lodMaxDistance = 12;
    showerValveBar.rotation.x = Math.PI / 2;
    showerValveBar.position.set(-12.74, floorTopY + 1.02, 0.42);
    showerGroup.add(showerValveBar);

    const showerTopArmGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.36, 10);
    showerTopArmGeo.computeBoundingSphere();
    const showerTopArm = new THREE.Mesh(showerTopArmGeo, brassMat);
    showerTopArm.name = 'familyBathroom.showerEnclosure.topArm';
    showerTopArm.userData.lodTier = 'high';
    showerTopArm.userData.lodMaxDistance = 12;
    showerTopArm.rotation.z = Math.PI / 2;
    showerTopArm.position.set(-12.56, floorTopY + 1.95, 0.42);
    showerGroup.add(showerTopArm);

    const rainfallRoseGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.018, 20);
    rainfallRoseGeo.computeBoundingSphere();
    const rainfallRose = new THREE.Mesh(rainfallRoseGeo, brassMat);
    rainfallRose.name = 'familyBathroom.showerEnclosure.rainfallRose';
    rainfallRose.userData.lodTier = 'high';
    rainfallRose.userData.lodMaxDistance = 12;
    rainfallRose.position.set(-12.39, floorTopY + 1.92, 0.42);
    showerGroup.add(rainfallRose);

    scene.add(showerGroup);
  }

  // 1b. Traditional Period Brass Heated Towel Rail on the West Wall (`X = -12.76m, Z = -0.58m`)
  {
    const towelRailGroup = new THREE.Group();
    towelRailGroup.name = 'familyBathroom.heatedTowelRail';
    towelRailGroup.position.set(-12.76, floorTopY, -0.58);

    const sharedUprightGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.96, 12);
    sharedUprightGeo.computeBoundingSphere();
    const sharedRailBarGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.56, 12);
    sharedRailBarGeo.computeBoundingSphere();
    const sharedWallBracketGeo = new THREE.CylinderGeometry(0.009, 0.012, 0.06, 10);
    sharedWallBracketGeo.computeBoundingSphere();

    for (const [sideIdx, zOff] of [-0.28, 0.28].entries()) {
      const sideLabel = sideIdx === 0 ? 'north' : 'south';
      const upright = new THREE.Mesh(sharedUprightGeo, brassMat);
      upright.name = `familyBathroom.heatedTowelRail.upright.${sideLabel}`;
      upright.position.set(0.02, 0.68, zOff);
      upright.castShadow = true;
      towelRailGroup.add(upright);

      for (const [bIdx, yOff] of [0.28, 1.08].entries()) {
        const bracket = new THREE.Mesh(sharedWallBracketGeo, brassMat);
        bracket.name = `familyBathroom.heatedTowelRail.bracket_${sideIdx * 2 + bIdx + 1}`;
        bracket.userData.lodTier = 'high';
        bracket.userData.lodMaxDistance = 12;
        bracket.rotation.z = Math.PI / 2;
        bracket.position.set(-0.01, yOff, zOff);
        towelRailGroup.add(bracket);
      }
    }

    const railHeights = [0.34, 0.48, 0.62, 0.76, 0.9, 1.04];
    for (let i = 0; i < railHeights.length; i++) {
      const bar = new THREE.Mesh(sharedRailBarGeo, brassMat);
      bar.name = `familyBathroom.heatedTowelRail.bar_${i + 1}`;
      bar.userData.lodTier = 'high';
      bar.userData.lodMaxDistance = 12;
      bar.rotation.x = Math.PI / 2;
      bar.position.set(0.02, railHeights[i], 0);
      bar.castShadow = true;
      towelRailGroup.add(bar);
    }

    scene.add(towelRailGroup);
  }

  // 2. Freestanding Burnished Copper "Tubby Tub" Bateau Bath at X = -11.62m, Z = -1.52m (Issue #4: "Copper tubby tub bath")
  {
    const bathGroup = new THREE.Group();
    bathGroup.name = 'familyBathroom.bathtub';
    bathGroup.position.set(-11.62, floorTopY, -1.52);

    const burnishedCopperMat = new THREE.MeshStandardMaterial({
      color: 0xb86538,
      roughness: 0.26,
      metalness: 0.84,
    });
    const copperPlinthMat = new THREE.MeshStandardMaterial({
      color: 0x964e28,
      roughness: 0.32,
      metalness: 0.82,
    });
    const tinnedInteriorMat = new THREE.MeshStandardMaterial({
      color: 0xe8e4dc,
      roughness: 0.18,
      metalness: 0.38,
      side: THREE.DoubleSide,
    });

    // Sculpted double-ended "Tubby Tub" bateau bath shell:
    // Compact, deep soaking proportions (`1.48m` long x `0.78m` wide x `0.64m..0.71m` high with sweeping bateau ends)
    const segU = 48;
    const segV = 20;
    const outerPos: number[] = [];
    const outerNorm: number[] = [];
    const outerUv: number[] = [];
    const outerIdx: number[] = [];

    const innerPos: number[] = [];
    const innerUv: number[] = [];
    const innerIdx: number[] = [];

    const rimPts: THREE.Vector3[] = [];

    const sampleTubRing = (
      v: number,
      u: number,
      inset: number
    ): [number, number, number] => {
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      // Superellipse / stadium-like oval profile for authentic Tubby Tub silhouette
      const signX = Math.sign(cosT);
      const signZ = Math.sign(sinT);
      const pow = 1.72;
      const nx = signX * Math.pow(Math.abs(cosT), 2 / pow);
      const nz = signZ * Math.pow(Math.abs(sinT), 2 / pow);

      // Gentle flare from base (v = 0) to rolled rim (v = 1)
      const flare = 0.84 + 0.16 * Math.pow(v, 0.78);
      const rx = 0.72 * flare - inset;
      const rz = 0.38 * flare - inset;

      // Bateau / slipper rise at the West and East lounging ends (`cosT^2`)
      const endRise = 0.068 * Math.pow(cosT, 4);
      const topY = 0.64 + endRise;
      const botY = inset > 0 ? 0.085 : 0.0;
      const y = THREE.MathUtils.lerp(botY, topY, v);
      return [nx * rx, y, nz * rz];
    };

    const stride = segU + 1;
    for (let iv = 0; iv <= segV; iv++) {
      const v = iv / segV;
      for (let iu = 0; iu <= segU; iu++) {
        const u = iu / segU;
        const [ox, oy, oz] = sampleTubRing(v, u, 0);
        outerPos.push(ox, oy, oz);
        outerUv.push(u * 4, v);

        // Outward normal via angular central difference
        const [px, , pz] = sampleTubRing(v, (iu - 1 + segU) / segU, 0);
        const [nx, , nz] = sampleTubRing(v, (iu + 1) / segU, 0);
        const tx = nx - px;
        const tz = nz - pz;
        const len = Math.hypot(tx, tz) || 1;
        outerNorm.push(tz / len, 0.1 * (1 - v), -tx / len);

        const [ix, iy, iz] = sampleTubRing(v, u, 0.032);
        innerPos.push(ix, iy, iz);
        innerUv.push(u * 4, v);

        if (iv === segV && iu < segU) {
          rimPts.push(new THREE.Vector3((ox + ix) / 2, oy + 0.008, (oz + iz) / 2));
        }
      }
    }

    for (let iv = 0; iv < segV; iv++) {
      for (let iu = 0; iu < segU; iu++) {
        const a = iv * stride + iu;
        const b = a + 1;
        const c = (iv + 1) * stride + iu;
        const d = c + 1;
        // Outward-facing winding for outer copper shell
        outerIdx.push(a, c, b, b, c, d);
        // Inward-facing winding for tinned interior well
        innerIdx.push(a, b, c, b, d, c);
      }
    }

    // Close the flat interior soaking floor at v = 0 (`y = 0.085m`)
    const floorCenterIdx = innerPos.length / 3;
    innerPos.push(0, 0.085, 0);
    innerUv.push(0.5, 0.5);
    for (let iu = 0; iu < segU; iu++) {
      innerIdx.push(floorCenterIdx, iu + 1, iu);
    }

    const outerGeo = new THREE.BufferGeometry();
    outerGeo.setAttribute('position', new THREE.Float32BufferAttribute(outerPos, 3));
    outerGeo.setAttribute('normal', new THREE.Float32BufferAttribute(outerNorm, 3));
    outerGeo.setAttribute('uv', new THREE.Float32BufferAttribute(outerUv, 2));
    outerGeo.setIndex(outerIdx);
    outerGeo.computeVertexNormals();
    outerGeo.computeBoundingSphere();

    const bathOuter = new THREE.Mesh(outerGeo, burnishedCopperMat);
    bathOuter.name = 'familyBathroom.bathtub.copperShell';
    bathOuter.castShadow = true;
    bathOuter.receiveShadow = true;
    bathGroup.add(bathOuter);

    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerPos, 3));
    innerGeo.setAttribute('uv', new THREE.Float32BufferAttribute(innerUv, 2));
    innerGeo.setIndex(innerIdx);
    innerGeo.computeVertexNormals();
    innerGeo.computeBoundingSphere();

    const bathInner = new THREE.Mesh(innerGeo, tinnedInteriorMat);
    bathInner.name = 'familyBathroom.bathtub.innerWell';
    bathInner.receiveShadow = true;
    bathGroup.add(bathInner);

    // Continuous 3D Rolled Copper Bullnose Rim around the bateau top edge
    const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
    const bathRimGeo = new THREE.TubeGeometry(rimCurve, 64, 0.024, 14, true);
    bathRimGeo.computeBoundingSphere();
    const bathRim = new THREE.Mesh(bathRimGeo, burnishedCopperMat);
    bathRim.name = 'familyBathroom.bathtub.rolledRim';
    bathRim.castShadow = true;
    bathGroup.add(bathRim);

    // Molded Copper Skirt Plinth around the base (`y = 0..0.068m`)
    const plinthPts: THREE.Vector3[] = [];
    for (let iu = 0; iu < segU; iu++) {
      const [bx, , bz] = sampleTubRing(0.03, iu / segU, -0.01);
      plinthPts.push(new THREE.Vector3(bx, 0.022, bz));
    }
    const plinthCurve = new THREE.CatmullRomCurve3(plinthPts, true);
    const bathPlinthGeo = new THREE.TubeGeometry(plinthCurve, 48, 0.022, 12, true);
    bathPlinthGeo.computeBoundingSphere();
    const bathPlinth = new THREE.Mesh(bathPlinthGeo, copperPlinthMat);
    bathPlinth.name = 'familyBathroom.bathtub.plinth';
    bathPlinth.castShadow = true;
    bathGroup.add(bathPlinth);

    // Central brass pop-up waste & overflow rose inside the tub
    const bathDrainGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.006, 16);
    bathDrainGeo.computeBoundingSphere();
    const bathDrain = new THREE.Mesh(bathDrainGeo, brassMat);
    bathDrain.name = 'familyBathroom.bathtub.drain';
    bathDrain.userData.lodTier = 'high';
    bathDrain.userData.lodMaxDistance = 12;
    bathDrain.position.set(0, 0.088, 0);
    bathGroup.add(bathDrain);

    // Freestanding Twin-Leg Brass Standpipe Bath-Shower Mixer at the West end (`x = -0.82m`)
    const standpipeLegGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.76, 12);
    standpipeLegGeo.computeBoundingSphere();
    const floorEscutcheonGeo = new THREE.CylinderGeometry(0.034, 0.038, 0.018, 14);
    floorEscutcheonGeo.computeBoundingSphere();

    for (const legZ of [-0.09, 0.09] as const) {
      const sideLabel = legZ < 0 ? 'north' : 'south';
      const standpipeLeg = new THREE.Mesh(standpipeLegGeo, brassMat);
      standpipeLeg.name = `familyBathroom.bathtub.standpipeLeg.${sideLabel}`;
      standpipeLeg.userData.lodTier = 'high';
      standpipeLeg.userData.lodMaxDistance = 12;
      standpipeLeg.position.set(-0.82, 0.38, legZ);
      standpipeLeg.castShadow = true;
      bathGroup.add(standpipeLeg);

      const floorEscutcheon = new THREE.Mesh(floorEscutcheonGeo, brassMat);
      floorEscutcheon.name = `familyBathroom.bathtub.floorEscutcheon.${sideLabel}`;
      floorEscutcheon.userData.lodTier = 'high';
      floorEscutcheon.userData.lodMaxDistance = 12;
      floorEscutcheon.position.set(-0.82, 0.009, legZ);
      bathGroup.add(floorEscutcheon);
    }

    const mixerBridgeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12);
    mixerBridgeGeo.computeBoundingSphere();
    const mixerBridge = new THREE.Mesh(mixerBridgeGeo, brassMat);
    mixerBridge.name = 'familyBathroom.bathtub.mixerBridge';
    mixerBridge.userData.lodTier = 'high';
    mixerBridge.userData.lodMaxDistance = 12;
    mixerBridge.rotation.x = Math.PI / 2;
    mixerBridge.position.set(-0.82, 0.74, 0);
    bathGroup.add(mixerBridge);

    const bathSpoutGeo = new THREE.BoxGeometry(0.18, 0.018, 0.024);
    bathSpoutGeo.computeBoundingSphere();
    const bathSpout = new THREE.Mesh(bathSpoutGeo, brassMat);
    bathSpout.name = 'familyBathroom.bathtub.spout';
    bathSpout.userData.lodTier = 'high';
    bathSpout.userData.lodMaxDistance = 12;
    bathSpout.position.set(-0.73, 0.75, 0);
    bathGroup.add(bathSpout);

    scene.add(bathGroup);
  }
}
