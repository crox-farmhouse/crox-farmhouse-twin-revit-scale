import * as THREE from 'three';
import type { OutbuildingShellContext } from './outbuilding-coords-and-materials.ts';

export function buildOutbuildingTrussesAndSoffits(shellCtx: OutbuildingShellContext): void {
  const {
    stoneSillMat,
    castIronMat,
    warmRoomPlasterMat,
    groundGroup,
    roofGroup,
    groundCeilingGroup,
    settingPlasterMat,
    spotlightHousingMat,
    spotlightBrassTrimMat,
    wallT,
    partT,
    addOutbuildingBrickWall,
    createExtrudedVYPolygon,
    uGymEnd,
    uGarageEnd,
    baseY0,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    garageFloorTopY,
    uStoreStart,
    uBarnStart,
    uMezzanineFront,
    uBarnEnd,
    uStableStart,
    eastRangeInternalV,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    mezzanineUndersideY,
    barnLowerFloorY,
    stableGroundFloorY,
    stableGroundTopY,
    stableGroundSpanU,
    pilasterW,
    pilasterD,
    vInnerNorth,
    vInnerSouth,
    vSpanInternal,
    vMidCenter,
    createContinuousMezzaninePolygon,
  } = shellCtx;

  // =========================================================================
  // 2B. OPPOSING INTERNAL BRICK PILASTERS, PRECISION-MITERED WEATHERED-OAK KING-POST
  //     ROOF TRUSSES & UPWARD-AIMING TRUSS SPOTLIGHTS (Issues #1 & #12!)
  //     - Issue #12 ("Remove this truss" at `[-8.877, 2.397, 15.113]`, `u = 13.62m`):
  //       Removed the Store truss (`u = 13.65m`), leaving only the 3 trusses in GYM (`2.86m`), Garage (`8.92m`), and Barn (`18.68m`).
  //     - Issue #1 ("No these spotlights are supposed to sit on top of the beam and point up into the rafters, one on each side"
  //       at `[-19.31, 2.113, 20.537]`, `outbuildings.roofTruss.gym.tieBeam`):
  //       Mounted 2 spotlights per truss (`sz = -1.18m` and `+1.18m`, one on each side of the king-post)
  //       sitting ON TOP of `tieBeam` (`y = tieTopY`) and pointing UPWARD into the rafters / vaulted ceiling!
  // =========================================================================
  // Issue #4 ("More texture and character on these beams" at `[-3.681, 2.839, 17.632]`, `outbuildings.roofTruss.barn.tieBeam`):
  // High-resolution (`1024×512`) Weathered Hand-Hewn Reclaimed Barn Oak Beam Texture + Deep Adze/Check Bump Map
  // featuring deep longitudinal seasoning checks/splits, dark heartwood knots with swirling grain, adze tool marks,
  // and rich aged timber patina!
  const createWeatheredBarnBeamTextures = (): {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
  } => {
    const w = 1024;
    const h = 512;
    const cCanvas = document.createElement('canvas');
    cCanvas.width = w;
    cCanvas.height = h;
    const cCtx = cCanvas.getContext('2d')!;

    const bCanvas = document.createElement('canvas');
    bCanvas.width = w;
    bCanvas.height = h;
    const bCtx = bCanvas.getContext('2d')!;

    const cImg = cCtx.createImageData(w, h);
    const bImg = bCtx.createImageData(w, h);
    const cData = cImg.data;
    const bData = bImg.data;

    const knots = [
      [118, 96, 36, 18],
      [274, 380, 44, 22],
      [430, 168, 32, 16],
      [592, 412, 48, 24],
      [748, 124, 38, 19],
      [896, 310, 42, 21],
      [184, 248, 28, 14],
      [660, 260, 34, 17],
    ] as const;

    for (let y = 0; y < h; y++) {
      const v = (y / h) * Math.PI * 2;
      for (let x = 0; x < w; x++) {
        const u = (x / w) * Math.PI * 2;

        let knotDarken = 0;
        let knotWarp = 0;
        for (let k = 0; k < knots.length; k++) {
          const [kx, ky, krx, kry] = knots[k];
          const dx = (x - kx) / krx;
          const dy = (y - ky) / kry;
          const d2 = dx * dx + dy * dy;
          if (d2 < 6.5) {
            const falloff = Math.exp(-d2 * 0.65);
            knotWarp += dy * falloff * 2.4;
            if (d2 < 1.2) {
              knotDarken += (1.2 - d2) * 58;
            } else {
              knotDarken += Math.sin(Math.sqrt(d2) * 7.5) * falloff * 18;
            }
          }
        }

        const adzeScallop =
          Math.sin(u * 7.0 + Math.cos(v * 2.0) * 0.6) * 0.45 +
          Math.cos(u * 13.0 - Math.sin(v * 3.0) * 0.4) * 0.35;
        const grain =
          Math.sin(v * 14.0 + knotWarp + Math.sin(u * 3.0) * 1.2) * 0.55 +
          Math.cos(v * 38.0 + knotWarp * 1.4 + Math.cos(u * 5.0) * 0.9) * 0.32 +
          Math.sin(v * 96.0 + u * 4.0) * 0.18;

        const checkWave1 = Math.abs(
          Math.sin(v * 3.0 + Math.sin(u * 2.0) * 0.28)
        );
        const checkWave2 = Math.abs(
          Math.cos(v * 5.0 - Math.cos(u * 3.0) * 0.22)
        );
        const inSpan1 = Math.sin(u * 2.0 + 0.8) > 0.15;
        const inSpan2 = Math.cos(u * 3.0 - 0.5) > 0.22;
        const checkDepth =
          (inSpan1 && checkWave1 < 0.028 ? (0.028 - checkWave1) / 0.028 : 0) +
          (inSpan2 && checkWave2 < 0.022 ? (0.022 - checkWave2) / 0.022 : 0);

        const delta =
          grain * 24 + adzeScallop * 14 - knotDarken - checkDepth * 95;
        const r = Math.max(28, Math.min(215, Math.round(142 + delta)));
        const g = Math.max(20, Math.min(182, Math.round(108 + delta * 0.82)));
        const b = Math.max(14, Math.min(145, Math.round(78 + delta * 0.64)));

        const idx = (y * w + x) * 4;
        cData[idx] = r;
        cData[idx + 1] = g;
        cData[idx + 2] = b;
        cData[idx + 3] = 255;

        const bumpVal = Math.max(
          0,
          Math.min(
            255,
            Math.round(
              136 + grain * 36 + adzeScallop * 26 - knotDarken * 0.7 - checkDepth * 125
            )
          )
        );
        bData[idx] = bumpVal;
        bData[idx + 1] = bumpVal;
        bData[idx + 2] = bumpVal;
        bData[idx + 3] = 255;
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const map = new THREE.CanvasTexture(cCanvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.needsUpdate = true;

    return { map, bumpMap };
  };

  const weatheredBarnBeamTextures = createWeatheredBarnBeamTextures();
  const trussOakMat = new THREE.MeshStandardMaterial({
    name: 'weatheredHandHewnBarnOak',
    map: weatheredBarnBeamTextures.map,
    bumpMap: weatheredBarnBeamTextures.bumpMap,
    bumpScale: 0.024,
    color: 0xb8926a,
    roughness: 0.82,
    metalness: 0.03,
  });
  const trussDarkOakMat = new THREE.MeshStandardMaterial({
    name: 'weatheredHandHewnBarnDarkOak',
    map: weatheredBarnBeamTextures.map,
    bumpMap: weatheredBarnBeamTextures.bumpMap,
    bumpScale: 0.026,
    color: 0x96734e,
    roughness: 0.86,
    metalness: 0.04,
  });

  const applyBarnBeamUVs = (geo: THREE.BufferGeometry): void => {
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!bb || !pos || !norm || !uv) return;
    const sx = bb.max.x - bb.min.x;
    const sy = bb.max.y - bb.min.y;
    const sz = bb.max.z - bb.min.z;
    const alongX = sx > sz && sx > sy;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      if (alongX) {
        const across = ny > 0.5 ? z : y;
        uv.setXY(i, x * 0.42, across * 1.8);
      } else {
        const across = nx > 0.5 ? y : x + y;
        uv.setXY(i, z * 0.45 + y * 0.22, across * 1.8);
      }
    }
    uv.needsUpdate = true;
  };

  const trussesGroup = new THREE.Group();
  trussesGroup.name = 'outbuildings.roofTrusses';
  roofGroup.add(trussesGroup);


  // Ground-floor opposing brick pilasters in the Stable (`u = 25.45m`, rising cleanly to `stableGroundTopY = 1.96m`, NO truss above!)
  for (const [vPMin, vPMax, pFace] of [
    [vInnerNorth, vInnerNorth + pilasterD, '+z'],
    [vInnerSouth - pilasterD, vInnerSouth, '-z'],
  ] as const) {
    addOutbuildingBrickWall(
      groundGroup,
      25.45 - pilasterW * 0.5,
      25.45 + pilasterW * 0.5,
      stableGroundFloorY - 0.08,
      stableGroundTopY - 0.08,
      vPMin,
      vPMax,
      ['+x', '-x', pFace]
    );
    const padstone = new THREE.Mesh(
      new THREE.BoxGeometry(pilasterW + 0.04, 0.08, pilasterD + 0.03),
      stoneSillMat
    );
    padstone.name = 'outbuildings.pilasterPadstone.stable';
    padstone.position.set(25.45, stableGroundTopY - 0.04, (vPMin + vPMax) * 0.5);
    groundGroup.add(padstone);
  }

  interface BarnTrussBaySpec {
    readonly id: string;
    readonly uCenter: number;
    readonly baseY: number;
    readonly tieBottomY: number;
    readonly ceilEaveY: number;
    readonly ceilRidgeY: number;
    readonly skipPilastersAndKneeBraces?: boolean;
    readonly attachToGroundGroup?: boolean;
  }

  const barnTrussBays: ReadonlyArray<BarnTrussBaySpec> = [
    // Bay 1: GYM (`u = 2.86m`)
    {
      id: 'gym',
      uCenter: 2.86,
      baseY: baseY0,
      tieBottomY: northWestWallTopY,
      ceilEaveY: westRangeCeilEaveY,
      ceilRidgeY: westRangeCeilRidgeY,
    },
    // Bay 2: Garage (`u = 8.92m`)
    {
      id: 'garage',
      uCenter: 8.92,
      baseY: garageFloorTopY,
      tieBottomY: northWestWallTopY,
      ceilEaveY: westRangeCeilEaveY,
      ceilRidgeY: westRangeCeilRidgeY,
    },
    // Bay 3: Store / Barn Knock-Through Line (`u = 15.08m` — Issue #1 Structural Engineer Pass:
    // Principal Weathered-Oak King-Post Roof Truss seated directly on the full-span `203×203×46 UC`
    // Structural Steel Goalpost Portal Frame at `y = 2.72m`, carrying the Store & Barn ridge beams and purlins
    // with lightweight plasterboard stud infill and zero high-level brickwork!)
    {
      id: 'storeBarn',
      uCenter: uBarnStart + 0.13,
      baseY: barnLowerFloorY,
      tieBottomY: barnUpperTopY - 0.2,
      ceilEaveY: barnCeilEaveY,
      ceilRidgeY: barnCeilRidgeY,
      skipPilastersAndKneeBraces: true,
      attachToGroundGroup: true,
    },
    // Bay 4: Barn (`u = 18.68m` at the front edge of the mezzanine)
    {
      id: 'barn',
      uCenter: uMezzanineFront,
      baseY: barnLowerFloorY,
      tieBottomY: barnUpperTopY - 0.2,
      ceilEaveY: barnCeilEaveY,
      ceilRidgeY: barnCeilRidgeY,
    },
  ];

  for (const bay of barnTrussBays) {
    const padstoneH = 0.085;
    const pilasterTopY = bay.tieBottomY - padstoneH;

    if (!bay.skipPilastersAndKneeBraces) {
      // 1. Opposing North & South Internal Brick Pilasters (`0.30m` wide x `0.16m` deep) stopping cleanly below the Yorkstone padstone
      const pilasterPlasterMat = bay.id === 'barn' ? settingPlasterMat : warmRoomPlasterMat;
      addOutbuildingBrickWall(
        groundGroup,
        bay.uCenter - pilasterW * 0.5,
        bay.uCenter + pilasterW * 0.5,
        bay.baseY - 0.08,
        pilasterTopY,
        vInnerNorth,
        vInnerNorth + pilasterD,
        ['+x', '-x', '+z'],
        pilasterPlasterMat,
        pilasterPlasterMat
      );
      addOutbuildingBrickWall(
        groundGroup,
        bay.uCenter - pilasterW * 0.5,
        bay.uCenter + pilasterW * 0.5,
        bay.baseY - 0.08,
        pilasterTopY,
        vInnerSouth - pilasterD,
        vInnerSouth,
        bay.id === 'gym' ? [] : ['+x', '-x', '-z'],
        pilasterPlasterMat,
        pilasterPlasterMat
      );

      for (const vPad of [vInnerNorth + pilasterD * 0.5, vInnerSouth - pilasterD * 0.5]) {
        const padstone = new THREE.Mesh(
          new THREE.BoxGeometry(pilasterW + 0.04, padstoneH, pilasterD + 0.03),
          stoneSillMat
        );
        padstone.name = `outbuildings.pilasterPadstone.${bay.id}`;
        padstone.position.set(bay.uCenter, bay.tieBottomY - padstoneH * 0.5, vPad);
        padstone.castShadow = true;
        padstone.receiveShadow = true;
        groundGroup.add(padstone);
      }
    }

    // 2. Precision-Mitered Weathered-Oak King-Post Roof Truss (`outbuildings.roofTruss.<id>`)
    const trussGroup = new THREE.Group();
    trussGroup.name = `outbuildings.roofTruss.${bay.id}`;
    trussGroup.position.set(bay.uCenter, 0, vMidCenter());
    (bay.attachToGroundGroup ? groundGroup : trussesGroup).add(trussGroup);

    const tieH = 0.2;
    const tieW = 0.2;
    const tieBottomY = bay.tieBottomY;
    const tieMidY = tieBottomY + tieH * 0.5;
    const tieTopY = tieBottomY + tieH;
    const halfSpan = vSpanInternal * 0.5; // 2.575m
    const rafterApexY = bay.ceilRidgeY - 0.01;
    const trussRise = rafterApexY - tieTopY;
    const slopeTan = trussRise / halfSpan;
    const cosPitch = 1 / Math.hypot(1, slopeTan);
    const rafterVertDepth = 0.175 / cosPitch; // ~0.195m vertical depth of principal rafter
    const halfKingZ = 0.09; // 0.18m wide central King-Post

    // Main horizontal oak tie-beam spanning from North padstone to South padstone (`z = -halfSpan..+halfSpan`)
    const tieBeamGeo = new THREE.BoxGeometry(tieW, tieH, vSpanInternal);
    applyBarnBeamUVs(tieBeamGeo);
    const tieBeam = new THREE.Mesh(tieBeamGeo, trussOakMat);
    tieBeam.name = `outbuildings.roofTruss.${bay.id}.tieBeam`;
    tieBeam.position.set(0, tieMidY, 0);
    tieBeam.castShadow = true;
    tieBeam.receiveShadow = true;
    trussGroup.add(tieBeam);

    // Helper for top and bottom edge of the principal rafter at distance `az = |z|` from center
    const yRafterTop = (az: number): number => rafterApexY - az * slopeTan;
    const yRafterBot = (az: number): number => yRafterTop(az) - rafterVertDepth;
    const zRafterInnerFoot = Math.max(halfKingZ + 0.2, halfSpan - rafterVertDepth / slopeTan);

    // North (-1) and South (+1) Mitered Principal Rafters, Mitered Diagonal Struts & Mitered Knee Braces
    for (const sideV of [-1, 1] as const) {
      // A. Mitered Principal Rafter: flat horizontal birdsmouth on `y = tieTopY` & vertical plumb cut at `z = sideV * halfKingZ`
      const rafterW = 0.18;
      const rafterGeo = createExtrudedVYPolygon(
        [
          [sideV * halfKingZ, yRafterTop(halfKingZ)],
          [sideV * halfSpan, tieTopY],
          [sideV * zRafterInnerFoot, tieTopY],
          [sideV * halfKingZ, yRafterBot(halfKingZ)],
        ],
        rafterW
      );
      applyBarnBeamUVs(rafterGeo);
      const principalRafter = new THREE.Mesh(rafterGeo, trussOakMat);
      principalRafter.name = `outbuildings.roofTruss.${bay.id}.principalRafter`;
      principalRafter.position.set(-rafterW * 0.5, 0, 0);
      principalRafter.castShadow = true;
      principalRafter.receiveShadow = true;
      trussGroup.add(principalRafter);

      // B. Mitered Diagonal Oak Strut: vertical plumb cut against King-Post (`|z| = halfKingZ`) & sloped cut flush against `yRafterBot(|z|)`
      const strutW = 0.14;
      const zStrutTopInner = 1.12;
      const zStrutTopOuter = 1.32;
      const yStrutBaseBot = tieTopY + 0.12;
      const yStrutBaseTop = tieTopY + 0.28;
      const strutGeo = createExtrudedVYPolygon(
        [
          [sideV * halfKingZ, yStrutBaseTop],
          [sideV * zStrutTopInner, yRafterBot(zStrutTopInner)],
          [sideV * zStrutTopOuter, yRafterBot(zStrutTopOuter)],
          [sideV * halfKingZ, yStrutBaseBot],
        ],
        strutW
      );
      applyBarnBeamUVs(strutGeo);
      const strut = new THREE.Mesh(strutGeo, trussDarkOakMat);
      strut.name = `outbuildings.roofTruss.${bay.id}.strut`;
      strut.position.set(-strutW * 0.5, 0, 0);
      strut.castShadow = true;
      trussGroup.add(strut);

      if (!bay.skipPilastersAndKneeBraces) {
        // C. Mitered Oak Knee Brace: vertical edge flush against inner face of brick pilaster (`|z| = halfSpan - pilasterD = 2.415m`)
        //    and horizontal top edge flush against underside of tie-beam (`y = tieBottomY`) — zero protruding box corners!
        const braceW = 0.14;
        const zPilasterFace = halfSpan - pilasterD; // 2.415m
        const zBraceTieInner = 1.88;
        const zBraceTieOuter = 2.06;
        const yBracePilasterTop = tieBottomY - 0.34;
        const yBracePilasterBot = tieBottomY - 0.52;
        const kneeBraceGeo = createExtrudedVYPolygon(
          [
            [sideV * zBraceTieInner, tieBottomY],
            [sideV * zBraceTieOuter, tieBottomY],
            [sideV * zPilasterFace, yBracePilasterTop],
            [sideV * zPilasterFace, yBracePilasterBot],
          ],
          braceW
        );
        applyBarnBeamUVs(kneeBraceGeo);
        const kneeBrace = new THREE.Mesh(kneeBraceGeo, trussOakMat);
        kneeBrace.name = `outbuildings.roofTruss.${bay.id}.kneeBrace`;
        kneeBrace.position.set(-braceW * 0.5, 0, 0);
        kneeBrace.castShadow = true;
        trussGroup.add(kneeBrace);
      }

      // Wrought-iron heel strap at the tie-beam / principal rafter foot junction
      const heelStrap = new THREE.Mesh(
        new THREE.BoxGeometry(tieW + 0.016, tieH - 0.02, 0.055),
        castIronMat
      );
      heelStrap.name = `outbuildings.roofTruss.${bay.id}.heelStrap.${sideV < 0 ? "left" : "right"}`;
      heelStrap.userData.lodTier = 'high';
      heelStrap.position.set(0, tieMidY, sideV * (zRafterInnerFoot + 0.06));
      trussGroup.add(heelStrap);

      // Issue #4: Protruding turned oak carpenter's mortise-and-tenon drawbore pegs at the truss joints!
      for (const [py, pz] of [
        [tieMidY + 0.03, sideV * 1.96],
        [tieMidY - 0.04, sideV * 1.99],
        [yStrutBaseBot + 0.07, sideV * (halfKingZ + 0.08)],
        [yRafterBot(zStrutTopInner) + 0.05, sideV * 1.2],
        [yRafterTop(halfKingZ) - 0.08, sideV * 0.14],
      ] as const) {
        const oakPeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011, 0.011, tieW + 0.026, 10),
          trussDarkOakMat
        );
        oakPeg.name = `outbuildings.roofTruss.${bay.id}.oakPeg`;
        oakPeg.userData.lodTier = 'high';
        oakPeg.rotation.z = Math.PI / 2;
        oakPeg.position.set(0, py, pz);
        trussGroup.add(oakPeg);
      }
    }

    // D. Central Mitered Oak King-Post rising from `y = tieTopY` to the ridge apex (`z = -halfKingZ..+halfKingZ`)
    const kingPostW = 0.18;
    const kingPostGeo = createExtrudedVYPolygon(
      [
        [-halfKingZ, tieTopY],
        [halfKingZ, tieTopY],
        [halfKingZ, yRafterTop(halfKingZ)],
        [0, rafterApexY],
        [-halfKingZ, yRafterTop(halfKingZ)],
      ],
      kingPostW
    );
    applyBarnBeamUVs(kingPostGeo);
    const kingPost = new THREE.Mesh(kingPostGeo, trussDarkOakMat);
    kingPost.name = `outbuildings.roofTruss.${bay.id}.kingPost`;
    kingPost.position.set(-kingPostW * 0.5, 0, 0);
    kingPost.castShadow = true;
    trussGroup.add(kingPost);

    // Traditional black wrought-iron U-stirrup strap clamping the king-post foot to the tie-beam
    const ironStirrup = new THREE.Mesh(
      new THREE.BoxGeometry(tieW + 0.018, tieH + 0.14, 0.058),
      castIronMat
    );
    ironStirrup.name = `outbuildings.roofTruss.${bay.id}.ironStirrup`;
    ironStirrup.userData.lodTier = 'high';
    ironStirrup.position.set(0, tieMidY + 0.07, 0);
    trussGroup.add(ironStirrup);

    // 3. Issue #1 ("No these spotlights are supposed to sit on top of the beam and point up into the rafters, one on each side"
    //    at `[-19.31, 2.113, 20.537]`, `outbuildings.roofTruss.gym.tieBeam`):
    //    2 Architectural Uplight Spotlights per truss (`sz = -1.18m` and `+1.18m`, one on each side of the king-post),
    //    seated ON TOP of the oak tie-beam (`y = tieTopY`) and angled upward into the rafters / vaulted ceiling!
    const spotZPositions = [-1.18, 1.18] as const;
    const spotOffsetX = bay.id === 'storeBarn' ? 0.065 : 0; // On storeBarn truss, place uplights on the Barn (+x) side of the stud infill wall
    for (let sIdx = 0; sIdx < spotZPositions.length; sIdx++) {
      const sz = spotZPositions[sIdx];
      const aimSignZ = sz < 0 ? -1 : 1;

      const spotGroup = new THREE.Group();
      spotGroup.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}`;
      spotGroup.position.set(spotOffsetX, tieTopY, sz);
      trussGroup.add(spotGroup);

      // Brushed-brass circular mounting base plate fixed to the TOP surface of the oak tie-beam
      const basePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.012, 14),
        spotlightBrassTrimMat
      );
      basePlate.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}.basePlate`;
      basePlate.userData.lodTier = 'high';
      basePlate.position.set(0, 0.006, 0);
      spotGroup.add(basePlate);

      // Dark-bronze U-stirrup yoke stem rising UPWARD from the base plate on top of the tie-beam
      const yokeStem = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.048, 0.044),
        spotlightHousingMat
      );
      yokeStem.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}.yokeStem`;
      yokeStem.userData.lodTier = 'high';
      yokeStem.position.set(0, 0.03, 0);
      spotGroup.add(yokeStem);

      // Pivoted cylindrical spotlight canister pointing UPWARD (`+Y`) into the rafters & vaulted ceiling
      const headPivot = new THREE.Group();
      headPivot.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}.headPivot`;
      headPivot.position.set(0, 0.052, 0);
      headPivot.rotation.x = -aimSignZ * 0.32;
      spotGroup.add(headPivot);

      const canister = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.088, 16),
        spotlightHousingMat
      );
      canister.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}.canister`;
      canister.castShadow = true;
      headPivot.add(canister);

      const bezelRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.031, 0.031, 0.014, 16),
        spotlightBrassTrimMat
      );
      bezelRing.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}.bezelRing`;
      bezelRing.userData.lodTier = 'high';
      bezelRing.position.set(0, 0.04, 0);
      headPivot.add(bezelRing);

      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xfff3d6,
        emissive: new THREE.Color(0xffca70),
        emissiveIntensity: 1.75,
        roughness: 0.18,
        metalness: 0.05,
      });
      const lensDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.006, 16),
        lensMat
      );
      lensDisc.name = `outbuildings.roofTruss.${bay.id}.spotlightLens.${sIdx + 1}`;
      lensDisc.position.set(0, 0.045, 0);
      headPivot.add(lensDisc);
    }
  }

  // Longitudinal Oak Ridge Beams & Mid-Slope Trench Purlins segmented cleanly per room bay so they never poke through walls
  let purlinBaySeq = 0;
  for (const [u0, u1, tieBottomY, ceilRidgeY] of [
    [wallT, uGymEnd, northWestWallTopY, westRangeCeilRidgeY],
    [uGymEnd + partT, uGarageEnd, northWestWallTopY, westRangeCeilRidgeY],
    [uStoreStart + 0.24, uBarnStart + 0.03, barnUpperTopY - 0.2, barnCeilRidgeY],
    [uBarnStart + 0.21, uBarnEnd - partT, barnUpperTopY - 0.2, barnCeilRidgeY],
  ] as const) {
    const spanU = u1 - u0;
    const midU = (u0 + u1) * 0.5;
    const tieTopY = tieBottomY + 0.2;
    const trussRise = ceilRidgeY - 0.01 - tieTopY;
    const purlinY = tieTopY + trussRise * 0.5 - 0.08;
    const purlinOffsetV = vSpanInternal * 0.25;

    const ridgeBeamGeo = new THREE.BoxGeometry(spanU, 0.15, 0.13);
    applyBarnBeamUVs(ridgeBeamGeo);
    const purlinBayId = ++purlinBaySeq;
    const ridgeBeam = new THREE.Mesh(ridgeBeamGeo, trussDarkOakMat);
    ridgeBeam.name = `outbuildings.roofTrusses.ridgeBeam.${purlinBayId}`;
    ridgeBeam.position.set(midU, ceilRidgeY - 0.085, vMidCenter());
    ridgeBeam.castShadow = true;
    trussesGroup.add(ridgeBeam);

    for (const sideV of [-1, 1] as const) {
      const purlinGeo = new THREE.BoxGeometry(spanU, 0.13, 0.13);
      applyBarnBeamUVs(purlinGeo);
      const purlin = new THREE.Mesh(purlinGeo, trussOakMat);
      purlin.name = `outbuildings.roofTrusses.purlin.${purlinBayId}.${sideV < 0 ? "north" : "south"}`;
      purlin.position.set(midU, purlinY, vMidCenter() + sideV * purlinOffsetV);
      purlin.castShadow = true;
      trussesGroup.add(purlin);
    }
  }

  // =========================================================================
  // 2C. BARN MEZZANINE LOWERED DECK, UNDER-CEILING SOFFIT & STABLE GROUND-FLOOR CEILING SOFFIT
  //     (Issues #2, #3 & #6: SE Corner Stairwell Opening `u = 21.14..23.016m, v = 3.56..5.426m` +
  //      attached to `groundCeilingGroup` so ground-floor cutaway hides the soffit & front beam!)
  // =========================================================================
  // Issue #1 ("THis piece of landing should be the same floor as the rest of the mezzanine,
  // continuous too not a separate piece." at `[-0.72, 1.545, 18.335]`):
  // Build both `mezzanineCeilingSoffit` (`0.033m` thick) and `westUpperRoomSlab` (`0.11m` thick) as
  // single, continuous extruded polygons covering the entire Mezzanine (`u = 18.684..23.016m, v = 0.284..5.426m`)
  // including the spiral-staircase top landing sector (`u = 21.14..22.04m, v = 3.56..4.94m`), with zero internal seams!

  const mezzanineSoffitGeo = new THREE.ExtrudeGeometry(
    createContinuousMezzaninePolygon(18.862),
    { depth: 0.033, bevelEnabled: false }
  );
  mezzanineSoffitGeo.rotateX(-Math.PI / 2);
  mezzanineSoffitGeo.computeBoundingSphere();
  const mezzanineCeilingSoffit = new THREE.Mesh(
    mezzanineSoffitGeo,
    warmRoomPlasterMat
  );
  mezzanineCeilingSoffit.name = 'outbuildings.barn.mezzanineCeilingSoffit';
  mezzanineCeilingSoffit.position.set(0, mezzanineUndersideY - 0.005, 0);
  mezzanineCeilingSoffit.receiveShadow = true;
  groundCeilingGroup.add(mezzanineCeilingSoffit);

  const bressummerSpanV = eastRangeInternalV - pilasterD * 2 - 0.008; // 4.822m between North & South pilasters
  const bressummerGeo = new THREE.BoxGeometry(0.18, 0.138, bressummerSpanV);
  applyBarnBeamUVs(bressummerGeo);
  const mezzanineFrontBressummer = new THREE.Mesh(
    bressummerGeo,
    trussOakMat
  );
  mezzanineFrontBressummer.name = 'outbuildings.barn.mezzanineFrontBeam';
  mezzanineFrontBressummer.position.set(
    uMezzanineFront + 0.09,
    1.359,
    vMidCenter()
  );
  mezzanineFrontBressummer.castShadow = true;
  groundCeilingGroup.add(mezzanineFrontBressummer);

  // Plastered ground-floor ceiling soffit in the Extended 2-Storey Stable (`u = 23.22..31.57m, y = 1.96m`, `2.40m` headroom above `-0.44m` wooden floor)
  const stableGroundCeilingSoffit = new THREE.Mesh(
    new THREE.BoxGeometry(stableGroundSpanU, 0.035, eastRangeInternalV),
    warmRoomPlasterMat
  );
  stableGroundCeilingSoffit.name = 'outbuildings.stable.groundCeilingSoffit';
  stableGroundCeilingSoffit.position.set(
    uStableStart + stableGroundSpanU * 0.5,
    stableGroundTopY + 0.018,
    vMidCenter()
  );
  stableGroundCeilingSoffit.receiveShadow = true;
  groundCeilingGroup.add(stableGroundCeilingSoffit);

}

export function buildEastRangePitchedRoofs(shellCtx: OutbuildingShellContext): void {
  const {
    pantileRoofMat,
    welshSlateMat,
    wallT,
    partT,
    addPitchedOutbuildingRoofSection,
    northWestWallTopY,
    uStoreStart,
    uBarnStart,
    uBarnEnd,
    uStableStart,
    uStableEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    barnUpperEaveH,
    barnRidgeH,
    stableUpperEaveH,
    stableRidgeH,
    barnDatumY,
    stableDatumY,
    barnUpperTopY,
  } = shellCtx;

  // STEP #1 Roof -> Level 2 Pitched Roof + Insulated Plasterboard Vaulted Ceiling over Store & Barn (`u = 12.07m..23.02m`)
  // + 3 North-Slope Velux Skylights (`storeNorth`, `barnWestNorth`, `barnEastNorth` — Issue #11!)
  const garageEaveRelToBarnDatum = northWestWallTopY - barnDatumY; // 2.26m
  addPitchedOutbuildingRoofSection(
    uStoreStart,
    uBarnEnd - partT,
    vEastRangeNorth,
    vEastRangeSouth,
    barnDatumY,
    barnUpperEaveH,
    barnRidgeH,
    pantileRoofMat,
    true,
    false,
    garageEaveRelToBarnDatum,
    barnUpperEaveH,
    0.06,
    0.02,
    [
      [uStoreStart + 0.24, uBarnStart],
      [uBarnStart + 0.24, uBarnEnd - partT + 0.02],
    ],
    [
      { id: 'storeNorth', uCenter: 13.65, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
      { id: 'barnWestNorth', uCenter: 16.95, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
      { id: 'barnEastNorth', uCenter: 20.85, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
    ]
  );

  // STEP #2 Roof -> Level 3 Pitched Roof + Insulated Plasterboard Vaulted Ceiling over the 2-Storey Stable (`u = 23.02m..29.05m`)
  // + 2 North-Slope Velux Skylights (`stableWestNorth`, `stableEastNorth` — Issue #13!)
  const barnEaveRelToStableDatum = barnUpperTopY - stableDatumY; // 3.14m
  addPitchedOutbuildingRoofSection(
    uBarnEnd - partT,
    uStableEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    stableDatumY,
    stableUpperEaveH,
    stableRidgeH,
    welshSlateMat,
    true,
    false,
    barnEaveRelToStableDatum,
    stableUpperEaveH,
    0.06,
    0.14,
    [[uStableStart - 0.02, uStableEnd - wallT]],
    [
      { id: 'stableWestNorth', uCenter: 24.85, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
      { id: 'stableEastNorth', uCenter: 27.15, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
    ]
  );
}
