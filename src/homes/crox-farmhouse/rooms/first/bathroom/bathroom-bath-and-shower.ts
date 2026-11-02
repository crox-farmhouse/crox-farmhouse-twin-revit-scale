import * as THREE from 'three';
import {
  buildArmstrongConcealedShowerSet,
  buildArmstrongFreestandingBathMixer,
  buildBcDesignsCopperBoatBath,
  getAcrymiteWhiteMaterial,
  getBathroomBrassMaterials,
  getBathroomTextileMaterials,
  getHonedCarraraMarbleMaterial,
  getZelligeCreamWallTileMaterial,
  prepGeo,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';

export interface FamilyBathroomBathAndShowerKit {
  brassMat: THREE.Material;
  ceramicWhiteMat: THREE.Material;
  floorTopY: number;
  windowGlassMat: THREE.Material;
}

const SHOWER_TRAY_BOUNDS = {
  westX: -12.81,
  eastX: -11.91,
  northZ: -0.65,
  southZ: 0.9,
} as const;

const SOUTH_SHOWER_NICHE_BOUNDS = {
  westX: -12.61,
  eastX: -12.15,
  bottomY: 2.9,
  topY: 3.68,
} as const;

const WEST_SHOWER_NICHE_BOUNDS = {
  northZ: -0.5,
  southZ: -0.06,
  bottomY: 3.36,
  topY: 3.72,
} as const;

const TOWEL_RAIL_SPEC = {
  wallFaceX: -10.7775,
  baseY: 3.53,
  centerZ: 0.34,
  height: 0.72,
  halfSpanZ: 0.23,
  standOffX: -0.095,
} as const;

const BOAT_BATH_PLACEMENT = {
  centerX: -11.55,
  bathCenterZ: -1.62,
  mixerCenterZ: -2.1,
  lengthM: 1.7,
  widthM: 0.74,
  endHeightM: 0.676,
  centerHeightM: 0.64,
} as const;

function setWorldZelligeBoxUVs(
  geo: THREE.BufferGeometry,
  sx: number,
  sy: number,
  sz: number
): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    let u = x + sx * 0.5;
    let v = y + sy * 0.5;
    if (nx > 0.5) {
      u = z + sz * 0.5;
      v = y + sy * 0.5;
    } else if (ny > 0.5) {
      u = x + sx * 0.5;
      v = z + sz * 0.5;
    }
    uv.setXY(i, u * 0.66, v * 0.5);
  }
  uv.needsUpdate = true;
  return prepGeo(geo);
}

function buildShowerEnclosureWithNiches(
  scene: THREE.Group,
  floorTopY: number,
  windowGlassMat: THREE.Material,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  acrymiteWhiteMat: THREE.Material,
  zelligeTileMat: THREE.Material,
  carraraMat: THREE.Material,
  textiles: ReturnType<typeof getBathroomTextileMaterials>
): void {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'familyBathroom.showerEnclosure';

    const { westX: trayWestX, eastX: trayEastX, northZ: trayNorthZ, southZ: traySouthZ } = SHOWER_TRAY_BOUNDS;
    const trayW = trayEastX - trayWestX; // 0.90m
    const trayL = traySouthZ - trayNorthZ; // 1.55m
    const trayCx = (trayWestX + trayEastX) * 0.5; // -12.36m
    const trayCz = (trayNorthZ + traySouthZ) * 0.5; // +0.125m

    const rimH = 0.042;
    const wellTopY = floorTopY + 0.03;
    const rimTopY = floorTopY + rimH; // 2.202m
    const rimW = 0.048;

    const trayAssembly = new THREE.Group();
    trayAssembly.name = 'familyBathroom.showerTray';

    const baseWell = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(trayW - 0.008, 0.03, trayL - 0.008)),
      acrymiteWhiteMat
    );
    baseWell.name = 'familyBathroom.showerTray.standingWell';
    baseWell.position.set(trayCx, floorTopY + 0.015, trayCz);
    baseWell.castShadow = true;
    baseWell.receiveShadow = true;
    trayAssembly.add(baseWell);

    const nsRimGeo = prepGeo(new THREE.BoxGeometry(trayW, rimH, rimW));
    for (const [edgeName, rz] of [
      ['northRim', trayNorthZ + rimW * 0.5],
      ['southRim', traySouthZ - rimW * 0.5],
    ] as const) {
      const rim = new THREE.Mesh(nsRimGeo, acrymiteWhiteMat);
      rim.name = `familyBathroom.showerTray.${edgeName}`;
      rim.position.set(trayCx, floorTopY + rimH * 0.5, rz);
      rim.castShadow = true;
      rim.receiveShadow = true;
      trayAssembly.add(rim);
    }

    const ewRimGeo = prepGeo(new THREE.BoxGeometry(rimW, rimH, trayL - rimW * 2));
    for (const [edgeName, rx] of [
      ['westRim', trayWestX + rimW * 0.5],
      ['eastRim', trayEastX - rimW * 0.5],
    ] as const) {
      const rim = new THREE.Mesh(ewRimGeo, acrymiteWhiteMat);
      rim.name = `familyBathroom.showerTray.${edgeName}`;
      rim.position.set(rx, floorTopY + rimH * 0.5, trayCz);
      rim.castShadow = true;
      rim.receiveShadow = true;
      trayAssembly.add(rim);
    }

    const drainX = -12.5;
    const drainZ = 0.52;
    const creaseMat = new THREE.MeshStandardMaterial({
      color: 0xe2e0da,
      roughness: 0.22,
      metalness: 0.0,
    });
    const innerStep = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(trayW - rimW * 2 - 0.02, 0.0025, trayL - rimW * 2 - 0.02)),
      acrymiteWhiteMat
    );
    innerStep.name = 'familyBathroom.showerTray.innerDrainDeck';
    innerStep.position.set(trayCx, wellTopY + 0.001, trayCz);
    innerStep.receiveShadow = true;
    trayAssembly.add(innerStep);

    const corners: readonly [string, number, number][] = [
      ['nwFallCrease', trayWestX + rimW, trayNorthZ + rimW],
      ['neFallCrease', trayEastX - rimW, trayNorthZ + rimW],
      ['swFallCrease', trayWestX + rimW, traySouthZ - rimW],
      ['seFallCrease', trayEastX - rimW, traySouthZ - rimW],
    ];
    for (const [cName, cxCorner, czCorner] of corners) {
      const dx = drainX - cxCorner;
      const dz = drainZ - czCorner;
      const segLen = Math.max(0.08, Math.hypot(dx, dz) - 0.055);
      const crease = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(0.003, 0.0015, segLen)),
        creaseMat
      );
      crease.name = `familyBathroom.showerTray.${cName}`;
      crease.userData.lodTier = 'high';
      crease.userData.lodMaxDistance = 12;
      crease.rotation.y = Math.atan2(dx, dz);
      const midFrac = 0.52;
      crease.position.set(
        cxCorner + dx * midFrac,
        wellTopY + 0.0024,
        czCorner + dz * midFrac
      );
      trayAssembly.add(crease);
    }

    showerGroup.add(trayAssembly);

    // LPW90 Polished Brass 90mm Circular Fastflow Waste Bezel & Dome Cover
    const wasteRecess = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.048, 0.046, 0.003, 24)),
      brBrass.darkShadow
    );
    wasteRecess.name = 'familyBathroom.showerEnclosure.lpw90WasteCup';
    wasteRecess.userData.lodTier = 'high';
    wasteRecess.userData.lodMaxDistance = 12;
    wasteRecess.position.set(drainX, wellTopY + 0.0018, drainZ);
    showerGroup.add(wasteRecess);

    const showerDrainGrate = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.043, 0.045, 0.005, 24)),
      brBrass.primary
    );
    showerDrainGrate.name = 'familyBathroom.showerEnclosure.lpw90BrassWaste';
    showerDrainGrate.userData.lodTier = 'high';
    showerDrainGrate.userData.lodMaxDistance = 12;
    showerDrainGrate.position.set(drainX, wellTopY + 0.0042, drainZ);
    showerGroup.add(showerDrainGrate);

    // Lower wet-to-boxed-dado Brass Schluter Jolly transition bead up to the 3.312m dado shelf
    const lowerDadoTrimH = floorTopY + 1.152 - rimTopY;
    const lowerVertTrimGeo = prepGeo(new THREE.BoxGeometry(0.006, lowerDadoTrimH, 0.006));
    for (const [tName, tx, tz] of [
      ['northTileEdgeTrim', trayWestX + 0.011, trayNorthZ - 0.002],
    ] as const) {
      const trim = new THREE.Mesh(lowerVertTrimGeo, brBrass.primary);
      trim.name = `familyBathroom.showerEnclosure.${tName}`;
      trim.userData.lodTier = 'high';
      trim.userData.lodMaxDistance = 14;
      trim.position.set(tx, rimTopY + lowerDadoTrimH * 0.5, tz);
      showerGroup.add(trim);
    }

    // Matki EauZone Plus EWP950-LB 2050mm H 10mm Solid Safety Glass Screen (950mm panel -> 600mm walk-in entry!)
    const screenH = 2.05;
    const screenLen = 0.95;
    const screenCenterZ = traySouthZ - screenLen * 0.5;
    const screenX = trayEastX - 0.022;

    const showerGlassScreen = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.01, screenH, screenLen)),
      windowGlassMat
    );
    showerGlassScreen.name = 'familyBathroom.showerGlass';
    showerGlassScreen.position.set(screenX, rimTopY + screenH * 0.5, screenCenterZ);
    showerGroup.add(showerGlassScreen);

    const glassWallChannel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.024, screenH, 0.022)),
      brBrass.primary
    );
    glassWallChannel.name = 'familyBathroom.showerEnclosure.wallChannel';
    glassWallChannel.userData.lodTier = 'high';
    glassWallChannel.userData.lodMaxDistance = 14;
    glassWallChannel.position.set(screenX, rimTopY + screenH * 0.5, traySouthZ - 0.018);
    showerGroup.add(glassWallChannel);

    const glassBottomChannel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.018, 0.014, screenLen)),
      brBrass.primary
    );
    glassBottomChannel.name = 'familyBathroom.showerEnclosure.bottomSealChannel';
    glassBottomChannel.userData.lodTier = 'high';
    glassBottomChannel.userData.lodMaxDistance = 14;
    glassBottomChannel.position.set(screenX, rimTopY + 0.007, screenCenterZ);
    showerGroup.add(glassBottomChannel);

    const armSpan = screenX - (trayWestX + 0.009);
    const glassSupportArm = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0085, 0.0085, armSpan, 14)),
      brBrass.primary
    );
    glassSupportArm.name = 'familyBathroom.showerEnclosure.supportArm';
    glassSupportArm.userData.lodTier = 'high';
    glassSupportArm.userData.lodMaxDistance = 14;
    glassSupportArm.rotation.z = Math.PI / 2;
    glassSupportArm.position.set((trayWestX + 0.009 + screenX) * 0.5, rimTopY + 2.015, -0.02);
    showerGroup.add(glassSupportArm);

    // Shared apothecary bottle & stoneware materials for both recessed shower niches (#30)
    const amberGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x6e3a16,
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 0.72,
    });
    const oliveGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x3f4c2c,
      roughness: 0.16,
      metalness: 0.03,
      clearcoat: 0.68,
    });
    const stonewareBottleMat = new THREE.MeshStandardMaterial({
      color: 0xe6dfd1,
      roughness: 0.58,
      metalness: 0.02,
    });
    const soapBarMat = new THREE.MeshStandardMaterial({
      color: 0xd8cdb8,
      roughness: 0.72,
      metalness: 0.0,
    });

    const addPumpDispenser = (
      parent: THREE.Group,
      namePrefix: string,
      px: number,
      baseY: number,
      pz: number,
      radius: number,
      height: number,
      bodyMat: THREE.Material
    ): void => {
      const body = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(radius * 0.96, radius, height, 16)),
        bodyMat
      );
      body.name = `${namePrefix}.bottle`;
      body.userData.lodTier = 'high';
      body.userData.lodMaxDistance = 12;
      body.position.set(px, baseY + height * 0.5, pz);
      body.castShadow = true;
      parent.add(body);

      const collar = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.0095, 0.011, 0.022, 12)),
        brBrass.primary
      );
      collar.name = `${namePrefix}.collar`;
      collar.userData.lodTier = 'high';
      collar.userData.lodMaxDistance = 12;
      collar.position.set(px, baseY + height + 0.011, pz);
      parent.add(collar);

      const spout = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(0.005, 0.004, 0.024)),
        brBrass.primary
      );
      spout.name = `${namePrefix}.spout`;
      spout.userData.lodTier = 'high';
      spout.userData.lodMaxDistance = 12;
      spout.position.set(px, baseY + height + 0.022, pz - 0.008);
      parent.add(spout);
    };

    // =======================================================================
    // South wall two-tier recessed Zellige & Honed Carrara shower niche 
    //     Carved `92mm` deep into `southPartitionWall` (`X = -12.61..-12.15m, Y = 2.90..3.68m, Z = 0.891..0.985m`)
    // =======================================================================
    {
      const southNiche = new THREE.Group();
      southNiche.name = 'familyBathroom.showerEnclosure.southRecessedNiche';

      const { westX: nx0, eastX: nx1, bottomY: ny0, topY: ny1 } = SOUTH_SHOWER_NICHE_BOUNDS;
      const nw = nx1 - nx0; // 0.46m
      const nh = ny1 - ny0; // 0.78m
      const ncx = (nx0 + nx1) * 0.5; // -12.38m
      const ncy = (ny0 + ny1) * 0.5; // 3.29m
      const zFront = 0.891; // flush with 9mm Zellige wall face
      const zBack = 0.986; // 95mm recessed cavity back
      const cavD = zBack - zFront;
      const cavCz = (zFront + zBack) * 0.5;
      const tileT = 0.008;

      // Tiled back wall + left/right side reveals + top soffit reveal inside the 95mm cavity
      const backTile = new THREE.Mesh(
        setWorldZelligeBoxUVs(new THREE.BoxGeometry(nw, nh, tileT), nw, nh, tileT),
        zelligeTileMat
      );
      backTile.name = 'familyBathroom.showerEnclosure.kerdiBoardNicheBack';
      backTile.position.set(ncx, ncy, zBack - tileT * 0.5);
      backTile.receiveShadow = true;
      southNiche.add(backTile);

      const sideRevealGeo = setWorldZelligeBoxUVs(
        new THREE.BoxGeometry(tileT, nh, cavD),
        tileT,
        nh,
        cavD
      );
      for (const [rSide, rx] of [
        ['westReveal', nx0 + tileT * 0.5],
        ['eastReveal', nx1 - tileT * 0.5],
      ] as const) {
        const rev = new THREE.Mesh(sideRevealGeo, zelligeTileMat);
        rev.name = `familyBathroom.showerEnclosure.southNiche.${rSide}`;
        rev.position.set(rx, ncy, cavCz);
        rev.receiveShadow = true;
        southNiche.add(rev);
      }

      const topReveal = new THREE.Mesh(
        setWorldZelligeBoxUVs(new THREE.BoxGeometry(nw, tileT, cavD), nw, tileT, cavD),
        zelligeTileMat
      );
      topReveal.name = 'familyBathroom.showerEnclosure.southNiche.topReveal';
      topReveal.position.set(ncx, ny1 - tileT * 0.5, cavCz);
      topReveal.receiveShadow = true;
      southNiche.add(topReveal);

      // 20mm Honed Bianco Carrara Marble Bottom Sill Ledge (overhanging +14mm proud with bevelled front)
      const sillT = 0.02;
      const botSill = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(nw + 0.016, sillT, cavD + 0.014)),
        carraraMat
      );
      botSill.name = 'familyBathroom.showerEnclosure.southNiche.carraraBottomSill';
      botSill.position.set(ncx, ny0 + sillT * 0.5, cavCz - 0.007);
      botSill.castShadow = true;
      botSill.receiveShadow = true;
      southNiche.add(botSill);

      // 20mm Honed Bianco Carrara Marble Mid-Height Shelf dividing into Lower & Upper Shower Compartments!
      const midShelfY = 3.29;
      const midShelf = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(nw - tileT * 2 + 0.004, sillT, cavD + 0.006)),
        carraraMat
      );
      midShelf.name = 'familyBathroom.showerEnclosure.southNiche.carraraMidShelf';
      midShelf.position.set(ncx, midShelfY + sillT * 0.5, cavCz - 0.003);
      midShelf.castShadow = true;
      midShelf.receiveShadow = true;
      southNiche.add(midShelf);

      // Crisp 6mm Unlacquered Brass Schluter Jolly frame around the recessed opening (open center!)
      const beadW = 0.006;
      const sideBeadGeo = prepGeo(new THREE.BoxGeometry(beadW, nh + beadW, 0.01));
      for (const [bTag, bx] of [
        ['westTrim', nx0 - beadW * 0.4],
        ['eastTrim', nx1 + beadW * 0.4],
      ] as const) {
        const bMesh = new THREE.Mesh(sideBeadGeo, brBrass.primary);
        bMesh.name = `familyBathroom.showerEnclosure.southNiche.${bTag}`;
        bMesh.userData.lodTier = 'high';
        bMesh.userData.lodMaxDistance = 14;
        bMesh.position.set(bx, ncy, zFront + 0.002);
        southNiche.add(bMesh);
      }
      const topBead = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(nw + beadW * 1.8, beadW, 0.01)),
        brBrass.primary
      );
      topBead.name = 'familyBathroom.showerEnclosure.kerdiBoardNicheTrim';
      topBead.userData.lodTier = 'high';
      topBead.userData.lodMaxDistance = 14;
      topBead.position.set(ncx, ny1 + beadW * 0.4, zFront + 0.002);
      southNiche.add(topBead);

      // Lower-compartment toiletries (`Y = 2.92m` Carrara sill)
      const lowerShelfTopY = ny0 + sillT;
      addPumpDispenser(
        southNiche,
        'familyBathroom.showerEnclosure.southNiche.shampoo',
        ncx - 0.13,
        lowerShelfTopY,
        0.935,
        0.031,
        0.165,
        amberGlassMat
      );
      addPumpDispenser(
        southNiche,
        'familyBathroom.showerEnclosure.southNiche.showerGel',
        ncx - 0.04,
        lowerShelfTopY,
        0.938,
        0.029,
        0.152,
        amberGlassMat
      );
      addPumpDispenser(
        southNiche,
        'familyBathroom.showerEnclosure.southNiche.conditioner',
        ncx + 0.085,
        lowerShelfTopY,
        0.936,
        0.03,
        0.142,
        stonewareBottleMat
      );

      // Upper-compartment toiletries (`Y = 3.31m` Carrara mid-shelf)
      const upperShelfTopY = midShelfY + sillT;
      const scrubJar = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.036, 0.034, 0.078, 16)),
        amberGlassMat
      );
      scrubJar.name = 'familyBathroom.showerEnclosure.southNiche.bodyScrubJar';
      scrubJar.userData.lodTier = 'high';
      scrubJar.userData.lodMaxDistance = 12;
      scrubJar.position.set(ncx - 0.11, upperShelfTopY + 0.039, 0.938);
      scrubJar.castShadow = true;
      southNiche.add(scrubJar);

      const scrubLid = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.037, 0.037, 0.012, 16)),
        brBrass.primary
      );
      scrubLid.name = 'familyBathroom.showerEnclosure.southNiche.bodyScrubLid';
      scrubLid.userData.lodTier = 'high';
      scrubLid.userData.lodMaxDistance = 12;
      scrubLid.position.set(ncx - 0.11, upperShelfTopY + 0.084, 0.938);
      southNiche.add(scrubLid);

      addPumpDispenser(
        southNiche,
        'familyBathroom.showerEnclosure.southNiche.cleanser',
        ncx + 0.01,
        upperShelfTopY,
        0.936,
        0.026,
        0.135,
        oliveGlassMat
      );

      const soapDish = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(0.086, 0.008, 0.056)),
        brBrass.primary
      );
      soapDish.name = 'familyBathroom.showerEnclosure.southNiche.brassSoapDish';
      soapDish.userData.lodTier = 'high';
      soapDish.userData.lodMaxDistance = 12;
      soapDish.position.set(ncx + 0.125, upperShelfTopY + 0.004, 0.938);
      southNiche.add(soapDish);

      const soapBar = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(0.068, 0.024, 0.044)),
        soapBarMat
      );
      soapBar.name = 'familyBathroom.showerEnclosure.southNiche.artisanSoap';
      soapBar.userData.lodTier = 'high';
      soapBar.userData.lodMaxDistance = 12;
      soapBar.position.set(ncx + 0.125, upperShelfTopY + 0.02, 0.938);
      southNiche.add(soapBar);

      showerGroup.add(southNiche);
    }

    // =======================================================================
    // West wall companion recessed Zellige & Honed Carrara shower niche 
    //     Carved `92mm` deep into `westWallUpperGable` (`Z = -0.50..-0.06m, Y = 3.36..3.72m, X = -12.896..-12.801m`)
    // =======================================================================
    {
      const westNiche = new THREE.Group();
      westNiche.name = 'familyBathroom.showerEnclosure.westRecessedNiche';

      const { northZ: nz0, southZ: nz1, bottomY: ny0, topY: ny1 } = WEST_SHOWER_NICHE_BOUNDS;
      const nw = nz1 - nz0; // 0.44m
      const nh = ny1 - ny0; // 0.36m
      const ncz = (nz0 + nz1) * 0.5; // -0.28m
      const ncy = (ny0 + ny1) * 0.5; // 3.54m
      const xFront = -12.801; // flush with 9mm Zellige wall face
      const xBack = -12.896; // 95mm recessed cavity back
      const cavD = xFront - xBack;
      const cavCx = (xFront + xBack) * 0.5;
      const tileT = 0.008;
      const sillT = 0.02;

      const backTile = new THREE.Mesh(
        setWorldZelligeBoxUVs(new THREE.BoxGeometry(tileT, nh, nw), tileT, nh, nw),
        zelligeTileMat
      );
      backTile.name = 'familyBathroom.showerEnclosure.westNiche.backTile';
      backTile.position.set(xBack + tileT * 0.5, ncy, ncz);
      backTile.receiveShadow = true;
      westNiche.add(backTile);

      const sideRevealGeo = setWorldZelligeBoxUVs(
        new THREE.BoxGeometry(cavD, nh, tileT),
        cavD,
        nh,
        tileT
      );
      for (const [rSide, rz] of [
        ['northReveal', nz0 + tileT * 0.5],
        ['southReveal', nz1 - tileT * 0.5],
      ] as const) {
        const rev = new THREE.Mesh(sideRevealGeo, zelligeTileMat);
        rev.name = `familyBathroom.showerEnclosure.westNiche.${rSide}`;
        rev.position.set(cavCx, ncy, rz);
        rev.receiveShadow = true;
        westNiche.add(rev);
      }

      const topReveal = new THREE.Mesh(
        setWorldZelligeBoxUVs(new THREE.BoxGeometry(cavD, tileT, nw), cavD, tileT, nw),
        zelligeTileMat
      );
      topReveal.name = 'familyBathroom.showerEnclosure.westNiche.topReveal';
      topReveal.position.set(cavCx, ny1 - tileT * 0.5, ncz);
      topReveal.receiveShadow = true;
      westNiche.add(topReveal);

      // 20mm Honed Bianco Carrara Marble Sill Ledge overhanging +14mm proud into shower
      const westSill = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(cavD + 0.014, sillT, nw + 0.016)),
        carraraMat
      );
      westSill.name = 'familyBathroom.showerEnclosure.westNiche.carraraSill';
      westSill.position.set(cavCx + 0.007, ny0 + sillT * 0.5, ncz);
      westSill.castShadow = true;
      westSill.receiveShadow = true;
      westNiche.add(westSill);

      // Crisp 6mm Unlacquered Brass Schluter Jolly frame around West niche opening
      const beadW = 0.006;
      const sideBeadGeo = prepGeo(new THREE.BoxGeometry(0.01, nh + beadW, beadW));
      for (const [bTag, bz] of [
        ['northTrim', nz0 - beadW * 0.4],
        ['southTrim', nz1 + beadW * 0.4],
      ] as const) {
        const bMesh = new THREE.Mesh(sideBeadGeo, brBrass.primary);
        bMesh.name = `familyBathroom.showerEnclosure.westNiche.${bTag}`;
        bMesh.userData.lodTier = 'high';
        bMesh.userData.lodMaxDistance = 14;
        bMesh.position.set(xFront - 0.002, ncy, bz);
        westNiche.add(bMesh);
      }
      const topBead = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(0.01, beadW, nw + beadW * 1.8)),
        brBrass.primary
      );
      topBead.name = 'familyBathroom.showerEnclosure.westNiche.topTrim';
      topBead.userData.lodTier = 'high';
      topBead.userData.lodMaxDistance = 14;
      topBead.position.set(xFront - 0.002, ny1 + beadW * 0.4, ncz);
      westNiche.add(topBead);

      // Curated bath oils & stoneware wash bottles inside the West niche (`Y = 3.38m` sill)
      const westSillTopY = ny0 + sillT;
      addPumpDispenser(
        westNiche,
        'familyBathroom.showerEnclosure.westNiche.bodyWash',
        -12.845,
        westSillTopY,
        ncz - 0.11,
        0.029,
        0.155,
        stonewareBottleMat
      );
      addPumpDispenser(
        westNiche,
        'familyBathroom.showerEnclosure.westNiche.bathOil',
        -12.842,
        westSillTopY,
        ncz - 0.015,
        0.027,
        0.142,
        amberGlassMat
      );
      const rolledCloth = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.095, 14)),
        textiles.ivoryWaffleRobe
      );
      rolledCloth.name = 'familyBathroom.showerEnclosure.westNiche.faceCloth';
      rolledCloth.userData.lodTier = 'high';
      rolledCloth.userData.lodMaxDistance = 12;
      rolledCloth.rotation.z = Math.PI * 0.5;
      rolledCloth.position.set(-12.842, westSillTopY + 0.024, ncz + 0.105);
      westNiche.add(rolledCloth);

      showerGroup.add(westNiche);
    }

    // Perrin & Rowe Traditional `TSS2BR8` Concealed 8" Thermostatic Shower Set on West shower wall (`Z = +0.30m`)
    const thermostaticSet = buildArmstrongConcealedShowerSet({
      namePrefix: 'familyBathroom.shower.thermostaticSet',
      finish: 'BR',
      style: 'traditional',
    });
    thermostaticSet.position.set(trayWestX + 0.009, rimTopY, 0.3);
    thermostaticSet.rotation.y = wallFacingToRotY('east');
    showerGroup.add(thermostaticSet);

    scene.add(showerGroup);
}

function buildRaisedBrassTowelRail(
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  textiles: ReturnType<typeof getBathroomTextileMaterials>
): THREE.Group {
    const towelRailGroup = new THREE.Group();
    towelRailGroup.name = 'familyBathroom.heatedTowelRail';
    towelRailGroup.position.set(TOWEL_RAIL_SPEC.wallFaceX, TOWEL_RAIL_SPEC.baseY, TOWEL_RAIL_SPEC.centerZ);

    const railH = TOWEL_RAIL_SPEC.height;
    const halfSpanZ = TOWEL_RAIL_SPEC.halfSpanZ;
    const standOffX = TOWEL_RAIL_SPEC.standOffX;

    const uprightGeo = prepGeo(new THREE.CylinderGeometry(0.015, 0.015, railH, 16));
    const crossBarGeo = prepGeo(new THREE.CylinderGeometry(0.0125, 0.0125, halfSpanZ * 2, 16));
    const ballJointGeo = prepGeo(new THREE.SphereGeometry(0.021, 16, 12));
    const wallRoseGeo = prepGeo(new THREE.CylinderGeometry(0.028, 0.031, 0.012, 18));
    const standoffTubeGeo = prepGeo(new THREE.CylinderGeometry(0.01, 0.01, Math.abs(standOffX), 12));
    const valveBodyGeo = prepGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.048, 14));

    for (const [sideIdx, zOff] of [-halfSpanZ, halfSpanZ].entries()) {
      const sideLabel = sideIdx === 0 ? 'north' : 'south';
      const upright = new THREE.Mesh(uprightGeo, brBrass.primary);
      upright.name = `familyBathroom.heatedTowelRail.upright.${sideLabel}`;
      upright.position.set(standOffX, railH * 0.5, zOff);
      upright.castShadow = true;
      towelRailGroup.add(upright);

      for (const [bIdx, yOff] of [0.06, railH - 0.06].entries()) {
        const rose = new THREE.Mesh(wallRoseGeo, brBrass.primary);
        rose.name = `familyBathroom.heatedTowelRail.wallRose.${sideLabel}_${bIdx + 1}`;
        rose.userData.lodTier = 'high';
        rose.userData.lodMaxDistance = 12;
        rose.rotation.z = Math.PI / 2;
        rose.position.set(-0.005, yOff, zOff);
        towelRailGroup.add(rose);

        const bracket = new THREE.Mesh(standoffTubeGeo, brBrass.primary);
        bracket.name = `familyBathroom.heatedTowelRail.bracket_${sideIdx * 2 + bIdx + 1}`;
        bracket.userData.lodTier = 'high';
        bracket.userData.lodMaxDistance = 12;
        bracket.rotation.z = Math.PI / 2;
        bracket.position.set(standOffX * 0.5, yOff, zOff);
        towelRailGroup.add(bracket);
      }

      const valve = new THREE.Mesh(valveBodyGeo, brBrass.primary);
      valve.name = `familyBathroom.heatedTowelRail.valve.${sideLabel}`;
      valve.userData.lodTier = 'high';
      valve.userData.lodMaxDistance = 12;
      valve.position.set(standOffX, -0.018, zOff);
      towelRailGroup.add(valve);
    }

    const barHeights = [0.06, 0.24, 0.42, 0.58, railH - 0.06] as const;
    for (const [i, ry] of barHeights.entries()) {
      const bar = new THREE.Mesh(crossBarGeo, brBrass.primary);
      bar.name = `familyBathroom.heatedTowelRail.bar_${i + 1}`;
      bar.rotation.x = Math.PI / 2;
      bar.position.set(standOffX, ry, 0);
      bar.castShadow = true;
      towelRailGroup.add(bar);

      for (const [sIdx, zOff] of [-halfSpanZ, halfSpanZ].entries()) {
        const ball = new THREE.Mesh(ballJointGeo, brBrass.primary);
        ball.name = `familyBathroom.heatedTowelRail.ballJoint_${i + 1}_${sIdx === 0 ? 'n' : 's'}`;
        ball.userData.lodTier = 'high';
        ball.userData.lodMaxDistance = 12;
        ball.position.set(standOffX, ry, zOff);
        towelRailGroup.add(ball);
      }
    }

    // Folded cream & soft-taupe striped woven cotton bath towel draped over the middle rung
    const towelW = 0.32;
    const towelDrop = 0.33;
    const towelBarY = 0.42;
    const towelShape = new THREE.Shape();
    const rTop = 0.022;
    towelShape.moveTo(-rTop, -towelDrop);
    towelShape.lineTo(-rTop, 0);
    towelShape.absarc(0, 0, rTop, Math.PI, 0, true);
    towelShape.lineTo(rTop, -towelDrop * 0.94);
    towelShape.lineTo(rTop - 0.011, -towelDrop * 0.94);
    towelShape.lineTo(rTop - 0.011, 0);
    towelShape.absarc(0, 0, rTop - 0.011, 0, Math.PI, false);
    towelShape.lineTo(-rTop + 0.011, -towelDrop);
    towelShape.closePath();

    const towelGeo = prepGeo(
      new THREE.ExtrudeGeometry(towelShape, {
        depth: towelW,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
        curveSegments: 16,
      })
    );
    towelGeo.translate(0, 0, -towelW * 0.5);
    const drapedTowel = new THREE.Mesh(towelGeo, textiles.stripedRailTowel);
    drapedTowel.name = 'familyBathroom.heatedTowelRail.stripedBathTowel';
    drapedTowel.position.set(standOffX, towelBarY + 0.004, 0);
    drapedTowel.castShadow = true;
    drapedTowel.receiveShadow = true;
    towelRailGroup.add(drapedTowel);

    return towelRailGroup;
}

/**
 * Builds the Master Bathroom (`familyBathroom`) walk-in Acrymite shower enclosure with twin recessed
 * Zellige & Honed Carrara shower niches, wall-mounted Polished Brass ladder towel warmer above the
 * bulkhead dado shelf, and sculpted `BC Designs BAC070` Copper Boat Bath with `P&R 3520/1BR` mixer.
 */
export function buildFamilyBathroomBathAndShower(
  scene: THREE.Group,
  kit: FamilyBathroomBathAndShowerKit
): void {
  const { floorTopY, windowGlassMat } = kit;
  const brBrass = getBathroomBrassMaterials('BR');
  const acrymiteWhiteMat = getAcrymiteWhiteMaterial();
  const zelligeTileMat = getZelligeCreamWallTileMaterial();
  const carraraMat = getHonedCarraraMarbleMaterial();
  const textiles = getBathroomTextileMaterials();

  buildShowerEnclosureWithNiches(
    scene,
    floorTopY,
    windowGlassMat,
    brBrass,
    acrymiteWhiteMat,
    zelligeTileMat,
    carraraMat,
    textiles
  );

  scene.add(buildRaisedBrassTowelRail(brBrass, textiles));

  const copperBoatBath = buildBcDesignsCopperBoatBath({
    namePrefix: 'familyBathroom.copperBoatBath',
    lengthM: BOAT_BATH_PLACEMENT.lengthM,
    widthM: BOAT_BATH_PLACEMENT.widthM,
    endHeightM: BOAT_BATH_PLACEMENT.endHeightM,
    centerHeightM: BOAT_BATH_PLACEMENT.centerHeightM,
    brassFinish: 'BR',
    overflowEnd: 'west',
  });
  copperBoatBath.position.set(
    BOAT_BATH_PLACEMENT.centerX,
    floorTopY,
    BOAT_BATH_PLACEMENT.bathCenterZ
  );
  copperBoatBath.rotation.y = 0;
  scene.add(copperBoatBath);

  const bathMixer = buildArmstrongFreestandingBathMixer({
    namePrefix: 'familyBathroom.bathMixer',
    finish: 'BR',
    style: 'traditional',
    overallHeightM: 0.958,
    spoutOutletHeightM: 0.827,
    spoutReachM: 0.21,
  });
  bathMixer.position.set(
    BOAT_BATH_PLACEMENT.centerX,
    floorTopY,
    BOAT_BATH_PLACEMENT.mixerCenterZ
  );
  bathMixer.rotation.y = wallFacingToRotY('south');
  scene.add(bathMixer);
}
