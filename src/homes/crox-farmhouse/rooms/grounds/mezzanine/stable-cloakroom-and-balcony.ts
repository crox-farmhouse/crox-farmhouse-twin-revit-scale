import * as THREE from 'three';
import { buildMitredArchitraveSegments } from '../../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import { createCarraraMarbleTileTexture } from './stable-upper-ensuite.ts';

// ============================================================================
// BATCH 1 ISSUE #2: SMALL CLOAKROOM TOILET ON STABLE GROUND FLOOR
// Hit Point: `[1.816, -0.44, 18.594]` -> Outbuilding `(u = 23.978m, y = -0.44m, v = 4.666m)`
// Compact ground-floor Cloakroom WC (`outbuildings.stable.groundCloakroom`) in the SW corner
// of the Stable Ground Floor (`u = 23.22..24.78m, v = 3.92..5.428m, y = -0.44..1.96m`).
// ============================================================================
export function buildStableGroundCloakroom(
  groundGroup: THREE.Group,
  stableGroundFloorY: number,
  stableGroundTopY: number,
  warmRoomPlasterMat: THREE.Material,
  lightJoineryOakMat: THREE.Material,
  ctx?: SceneBuilderContext
): void {
  const cloakGroup = new THREE.Group();
  cloakGroup.name = 'outbuildings.stable.groundCloakroom';
  cloakGroup.userData.zone = 'courtyard';
  groundGroup.add(cloakGroup);

  const uWest = 23.22;
  const uEast = 24.75; // 1.53m wide along u (cleanly West of the u = 25.31m South brick pilaster!)
  const vNorth = 3.94; // 1.488m deep along v (cleanly South of the v = 1.98..2.84m Barn-Stable glass door!)
  const vSouth = 5.428;
  const partT = 0.10;
  const wallH = stableGroundTopY - stableGroundFloorY; // 2.40m (-0.44m..+1.96m)

  const marbleTileMat = new THREE.MeshStandardMaterial({
    map: createCarraraMarbleTileTexture(),
    roughness: 0.28,
    metalness: 0.04,
  });
  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.14,
    metalness: 0.04,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });

  // 1. Tiled Cloakroom Floor (`u = 23.224..24.696m, v = 3.994..5.424m`)
  const floorW = uEast - partT * 0.5 - uWest - 0.008;
  const floorD = vSouth - (vNorth + partT * 0.5) - 0.008;
  const tiledFloor = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.012, floorD),
    marbleTileMat
  );
  tiledFloor.name = 'outbuildings.stable.groundCloakroom.tiledFloor';
  tiledFloor.position.set(
    uWest + 0.004 + floorW * 0.5,
    stableGroundFloorY + 0.01,
    vNorth + partT * 0.5 + 0.004 + floorD * 0.5
  );
  tiledFloor.receiveShadow = true;
  cloakGroup.add(tiledFloor);

  // 2. Plastered Stud Partition Walls (`vNorth = 3.94m` with `0.76m` doorway & `uEast = 24.75m`)
  const uDoor0 = 23.62;
  const uDoor1 = 24.38; // 0.76m cloakroom doorway centered at midU = 24.00m
  const doorW = uDoor1 - uDoor0;
  const midU = (uDoor0 + uDoor1) * 0.5;
  const doorH = 1.98;
  const wallClearH = wallH - 0.008;
  const wallMidY = stableGroundFloorY + 0.004 + wallClearH * 0.5;
  const lintelH = wallH - doorH - 0.004;

  const northWallWest = new THREE.Mesh(
    new THREE.BoxGeometry(uDoor0 - uWest - 0.004, wallClearH, partT),
    warmRoomPlasterMat
  );
  northWallWest.name = 'outbuildings.stable.groundCloakroom.northWallWest';
  northWallWest.userData.isArchitecturalShell = true;
  northWallWest.position.set((uWest + 0.004 + uDoor0) * 0.5, wallMidY, vNorth);
  northWallWest.castShadow = true;
  northWallWest.receiveShadow = true;
  cloakGroup.add(northWallWest);

  const northWallEast = new THREE.Mesh(
    new THREE.BoxGeometry(uEast + partT * 0.5 - uDoor1, wallClearH, partT),
    warmRoomPlasterMat
  );
  northWallEast.name = 'outbuildings.stable.groundCloakroom.northWallEast';
  northWallEast.userData.isArchitecturalShell = true;
  northWallEast.position.set((uDoor1 + uEast + partT * 0.5) * 0.5, wallMidY, vNorth);
  northWallEast.castShadow = true;
  northWallEast.receiveShadow = true;
  cloakGroup.add(northWallEast);

  const northLintel = new THREE.Mesh(
    new THREE.BoxGeometry(doorW - 0.008, lintelH, partT),
    warmRoomPlasterMat
  );
  northLintel.name = 'outbuildings.stable.groundCloakroom.northDoorLintel';
  northLintel.position.set(midU, stableGroundFloorY + doorH + lintelH * 0.5, vNorth);
  cloakGroup.add(northLintel);

  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(partT, wallClearH, floorD),
    warmRoomPlasterMat
  );
  eastWall.name = 'outbuildings.stable.groundCloakroom.eastWall';
  eastWall.userData.isArchitecturalShell = true;
  eastWall.position.set(uEast, wallMidY, vNorth + partT * 0.5 + 0.004 + floorD * 0.5);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  cloakGroup.add(eastWall);

  // ---------------------------------------------------------------------------
  // Issue #8 ("Make this a real door, improve the meshes" at `[1.802, 1.526, 18.061]`, `outbuildings.stable.groundCloakroom.door`):
  // A. Full Solid Light-Oak Doorway Jamb Linings, Recessed Door Stops, Flush Threshold Sill,
  //    Chamfered Architraves on BOTH North & South Faces, and Interactive Hinged 4-Panel Shaker Solid Oak Door!
  // ---------------------------------------------------------------------------
  const jambThick = 0.026;
  const jambDepth = partT + 0.016;
  const jambH = doorH - jambThick - 0.008;
  for (const jSide of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(jambThick, jambH, jambDepth),
      lightJoineryOakMat
    );
    jamb.name = 'outbuildings.stable.groundCloakroom.doorFrame.jamb';
    jamb.position.set(
      midU + jSide * (doorW * 0.5 + 0.004 + jambThick * 0.5) - jSide * jambThick,
      stableGroundFloorY + 0.004 + jambH * 0.5,
      vNorth
    );
    jamb.castShadow = true;
    cloakGroup.add(jamb);

    // Recessed solid oak door stop strip along each vertical jamb (`4mm` South of closed door leaf!)
    const stopH = doorH - jambThick - 0.036;
    const stopStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, stopH, 0.016),
      lightJoineryOakMat
    );
    stopStrip.name = 'outbuildings.stable.groundCloakroom.doorFrame.stopStrip';
    stopStrip.position.set(
      midU + jSide * (doorW * 0.5 - jambThick - 0.01),
      stableGroundFloorY + 0.02 + stopH * 0.5,
      vNorth + 0.034
    );
    cloakGroup.add(stopStrip);
  }

  const headJamb = new THREE.Mesh(
    new THREE.BoxGeometry(doorW - 0.008, jambThick, jambDepth),
    lightJoineryOakMat
  );
  headJamb.name = 'outbuildings.stable.groundCloakroom.doorFrame.head';
  headJamb.position.set(midU, stableGroundFloorY + doorH - jambThick * 0.5 - 0.004, vNorth);
  cloakGroup.add(headJamb);

  const headStop = new THREE.Mesh(
    new THREE.BoxGeometry(doorW - jambThick * 2 - 0.036, 0.012, 0.016),
    lightJoineryOakMat
  );
  headStop.name = 'outbuildings.stable.groundCloakroom.doorFrame.headStop';
  headStop.position.set(midU, stableGroundFloorY + doorH - jambThick - 0.014, vNorth + 0.034);
  cloakGroup.add(headStop);

  // Flush solid light-oak threshold sill strip
  const thresholdSill = new THREE.Mesh(
    new THREE.BoxGeometry(doorW - jambThick * 2 - 0.008, 0.012, partT - 0.008),
    lightJoineryOakMat
  );
  thresholdSill.name = 'outbuildings.stable.groundCloakroom.doorFrame.threshold';
  thresholdSill.position.set(midU, stableGroundFloorY + 0.01, vNorth);
  thresholdSill.receiveShadow = true;
  cloakGroup.add(thresholdSill);

  // Chamfered architraves on BOTH North exterior and South interior faces (`4mm` proud of `jambDepth`)
  const archW = 0.064;
  const archT = 0.020;
  for (const faceDir of [-1, 1] as const) {
    const archWallZ = vNorth + faceDir * (partT * 0.5 + 0.012);
    const [leftLegGeo, headGeo, rightLegGeo] = buildMitredArchitraveSegments(
      midU - (doorW * 0.5 - 0.012),
      midU + (doorW * 0.5 - 0.012),
      stableGroundFloorY + 0.004,
      stableGroundFloorY + 0.004,
      stableGroundFloorY + doorH - 0.012,
      'x',
      archWallZ,
      faceDir,
      archW,
      archT
    );
    for (const segGeo of [leftLegGeo, rightLegGeo, headGeo] as const) {
      const archMesh = new THREE.Mesh(segGeo, warmRoomPlasterMat);
      archMesh.name = 'outbuildings.stable.groundCloakroom.doorFrame.architrave';
      archMesh.castShadow = true;
      archMesh.receiveShadow = true;
      cloakGroup.add(archMesh);
    }
  }

  // Interactive Hinged 4-Panel Shaker Solid European Oak Door (`outbuildings.stable.groundCloakroom.door`)
  // Positioned at the West hinge jamb `(uDoor0 + 0.026, stableGroundFloorY + 0.020, vNorth)`, closed flush by default (`rotation.y = 0`)
  const doorPivot = new THREE.Group();
  doorPivot.name = 'outbuildings.stable.groundCloakroom.door';
  doorPivot.position.set(uDoor0 + jambThick + 0.004, stableGroundFloorY + 0.02, vNorth);
  doorPivot.rotation.y = 0;
  cloakGroup.add(doorPivot);

  const clearW = 0.7; // 4mm gap to jambs on each side
  const clearH = 1.926; // 4mm gap below headJamb
  const doorT = 0.044;
  const stileW = 0.095;
  const muntinW = 0.075;
  const botRailH = 0.18;
  const lockRailH = 0.14;
  const friezeRailH = 0.11;
  const topRailH = 0.11;
  const lockRailCenterY = 0.92;

  // Left (West hinge) & Right (East leading) vertical solid oak stiles
  const leftStile = new THREE.Mesh(
    new THREE.BoxGeometry(stileW, clearH, doorT),
    lightJoineryOakMat
  );
  leftStile.name = 'outbuildings.stable.groundCloakroom.door.stileWest';
  leftStile.position.set(stileW * 0.5, clearH * 0.5, 0);
  leftStile.castShadow = true;
  leftStile.receiveShadow = true;
  doorPivot.add(leftStile);

  const rightStile = new THREE.Mesh(
    new THREE.BoxGeometry(stileW, clearH, doorT),
    lightJoineryOakMat
  );
  rightStile.name = 'outbuildings.stable.groundCloakroom.door.stileEast';
  rightStile.position.set(clearW - stileW * 0.5, clearH * 0.5, 0);
  rightStile.castShadow = true;
  rightStile.receiveShadow = true;
  doorPivot.add(rightStile);

  // Horizontal rails (bottom rail, lock rail, frieze rail, top rail) spanning between stiles
  const innerRailW = clearW - stileW * 2 - 0.008;
  const railCenterX = clearW * 0.5;
  const friezeRailCenterY = clearH - topRailH - 0.34 - friezeRailH * 0.5;
  for (const [rName, rY, rH] of [
    ['bottomRail', botRailH * 0.5, botRailH],
    ['lockRail', lockRailCenterY, lockRailH],
    ['friezeRail', friezeRailCenterY, friezeRailH],
    ['topRail', clearH - topRailH * 0.5, topRailH],
  ] as const) {
    const railMesh = new THREE.Mesh(
      new THREE.BoxGeometry(innerRailW, rH, doorT),
      lightJoineryOakMat
    );
    railMesh.name = `outbuildings.stable.groundCloakroom.door.${rName}`;
    railMesh.position.set(railCenterX, rY, 0);
    railMesh.castShadow = true;
    railMesh.receiveShadow = true;
    doorPivot.add(railMesh);
  }

  // Central vertical muntin dividing lower & upper panel bays into 4 fielded Shaker panels
  const lowerBayY0 = botRailH;
  const lowerBayY1 = lockRailCenterY - lockRailH * 0.5;
  const friezeBotY = friezeRailCenterY - friezeRailH * 0.5;
  const friezeTopY = friezeRailCenterY + friezeRailH * 0.5;
  const upperBayY0 = lockRailCenterY + lockRailH * 0.5;
  const upperBayY1 = clearH - topRailH;

  for (const [mName, y0, y1] of [
    ['muntinLower', lowerBayY0, lowerBayY1],
    ['muntinMiddle', upperBayY0, friezeBotY],
    ['muntinUpper', friezeTopY, upperBayY1],
  ] as const) {
    const muntin = new THREE.Mesh(
      new THREE.BoxGeometry(muntinW, y1 - y0 - 0.008, doorT),
      lightJoineryOakMat
    );
    muntin.name = `outbuildings.stable.groundCloakroom.door.${mName}`;
    muntin.position.set(railCenterX, (y0 + y1) * 0.5, 0);
    muntin.castShadow = true;
    doorPivot.add(muntin);
  }

  // 4 Recessed solid oak panels (`0.016m` thick) with bevelled bolection/chamfered panel mouldings on both faces
  const panelW = (clearW - stileW * 2 - muntinW) * 0.5;
  const panelLeftX = stileW + panelW * 0.5;
  const panelRightX = clearW - stileW - panelW * 0.5;
  const panelBays: ReadonlyArray<readonly [number, number, number]> = [
    [panelLeftX, (lowerBayY0 + lowerBayY1) * 0.5, lowerBayY1 - lowerBayY0],
    [panelRightX, (lowerBayY0 + lowerBayY1) * 0.5, lowerBayY1 - lowerBayY0],
    [panelLeftX, (upperBayY0 + friezeBotY) * 0.5, friezeBotY - upperBayY0],
    [panelRightX, (upperBayY0 + friezeBotY) * 0.5, friezeBotY - upperBayY0],
  ];

  for (let pIdx = 0; pIdx < panelBays.length; pIdx++) {
    const [px, py, ph] = panelBays[pIdx]!;
    const recessedPanel = new THREE.Mesh(
      new THREE.BoxGeometry(panelW - 0.008, ph - 0.008, 0.016),
      lightJoineryOakMat
    );
    recessedPanel.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}`;
    recessedPanel.position.set(px, py, 0);
    recessedPanel.castShadow = true;
    recessedPanel.receiveShadow = true;
    doorPivot.add(recessedPanel);

    // Raised fielded panel centre bevel + chamfered perimeter bolection moulding strips on both faces (`4mm` proud of `recessedPanel`)
    for (const fz of [-0.015, 0.015] as const) {
      const fieldedCore = new THREE.Mesh(
        new THREE.BoxGeometry(panelW - 0.04, ph - 0.052, 0.006),
        lightJoineryOakMat
      );
      fieldedCore.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}.core`;
      fieldedCore.position.set(px, py, fz);
      doorPivot.add(fieldedCore);

      const topMould = new THREE.Mesh(
        new THREE.BoxGeometry(panelW - 0.016, 0.012, 0.006),
        lightJoineryOakMat
      );
      topMould.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}.topMoulding`;
      topMould.position.set(px, py + ph * 0.5 - 0.012, fz);
      doorPivot.add(topMould);

      const botMould = new THREE.Mesh(
        new THREE.BoxGeometry(panelW - 0.016, 0.012, 0.006),
        lightJoineryOakMat
      );
      botMould.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}.bottomMoulding`;
      botMould.position.set(px, py - ph * 0.5 + 0.012, fz);
      doorPivot.add(botMould);
    }
  }

  // 3 Brushed-brass butt hinges (`CylinderGeometry` knuckles) along the West hinge stile (`x = -0.006`)
  for (const hingeY of [0.24, 0.97, 1.68] as const) {
    const hingeKnuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.076, 12),
      brushedBrassMat
    );
    hingeKnuckle.name = 'outbuildings.stable.groundCloakroom.door.hinge';
    hingeKnuckle.position.set(-0.006, hingeY, -doorT * 0.5 - 0.006);
    doorPivot.add(hingeKnuckle);
  }

  // Brushed-brass circular roses, contoured tubular lever handles (`handleN`, `handleS`), and bathroom privacy thumbturn/coin-release lock on both faces of East leading stile (`x = clearW - 0.055m`)
  const handleX = clearW - 0.055;
  const handleY = 0.96;
  for (const [faceTag, fz] of [
    ['handleN', -1],
    ['handleS', 1],
  ] as const) {
    const rose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.008, 20),
      brushedBrassMat
    );
    rose.rotation.x = Math.PI / 2;
    rose.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.rose`;
    rose.position.set(handleX, handleY, fz * (doorT * 0.5 + 0.008));
    doorPivot.add(rose);

    const spindleNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.036, 14),
      brushedBrassMat
    );
    spindleNeck.rotation.x = Math.PI / 2;
    spindleNeck.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.spindle`;
    spindleNeck.position.set(handleX, handleY, fz * (doorT * 0.5 + 0.034));
    doorPivot.add(spindleNeck);

    const leverGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0075, 0.118, 14),
      brushedBrassMat
    );
    leverGrip.name = `outbuildings.stable.groundCloakroom.door.${faceTag}`;
    leverGrip.rotation.z = Math.PI / 2;
    leverGrip.position.set(handleX - 0.052, handleY, fz * (doorT * 0.5 + 0.06));
    leverGrip.castShadow = true;
    doorPivot.add(leverGrip);

    // Privacy lock escutcheon rose + thumbturn (interior South) / coin-release slot (exterior North) below handle
    const lockRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.007, 18),
      brushedBrassMat
    );
    lockRose.rotation.x = Math.PI / 2;
    lockRose.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.lockRose`;
    lockRose.position.set(handleX, handleY - 0.078, fz * (doorT * 0.5 + 0.0075));
    doorPivot.add(lockRose);

    if (fz > 0) {
      const thumbTurn = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.009, 0.016),
        brushedBrassMat
      );
      thumbTurn.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.thumbTurn`;
      thumbTurn.position.set(handleX, handleY - 0.078, fz * (doorT * 0.5 + 0.024));
      doorPivot.add(thumbTurn);
    }
  }

  // Register interactive hinged door so clicking smoothly swings it open and closed
  ctx?.interactions.registerHingedDoor(
    cloakGroup,
    doorPivot,
    new THREE.Vector3(0, 0, 0),
    'y',
    -Math.PI * 0.45
  );

  // ---------------------------------------------------------------------------
  // B. Upgraded Cloakroom Toilet (`outbuildings.stable.groundCloakroom.toilet`)
  //    at `(24.22, stableGroundFloorY + 0.012, vSouth - 0.32)` facing North (`-v`)
  // ---------------------------------------------------------------------------
  const toiletGroup = new THREE.Group();
  toiletGroup.name = 'outbuildings.stable.groundCloakroom.toilet';
  toiletGroup.position.set(24.22, stableGroundFloorY + 0.02, vSouth - 0.32);
  cloakGroup.add(toiletGroup);

  const waterBlueMat = new THREE.MeshStandardMaterial({
    color: 0xd4eef7,
    roughness: 0.06,
    metalness: 0.08,
    transparent: true,
    opacity: 0.86,
  });
  const darkCavityMat = new THREE.MeshStandardMaterial({
    color: 0xd8d6d0,
    roughness: 0.25,
    metalness: 0.04,
  });

  // Tiled boxing / concealed plumbing duct & solid oak shelf behind the close-coupled pan
  const cisternDuct = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.90, 0.16),
    marbleTileMat
  );
  cisternDuct.name = 'outbuildings.stable.groundCloakroom.toilet.cisternDuct';
  cisternDuct.position.set(0, 0.45, 0.22);
  cisternDuct.castShadow = true;
  cisternDuct.receiveShadow = true;
  toiletGroup.add(cisternDuct);

  const cisternOakLedge = new THREE.Mesh(
    new THREE.BoxGeometry(0.70, 0.024, 0.18),
    lightJoineryOakMat
  );
  cisternOakLedge.name = 'outbuildings.stable.groundCloakroom.toilet.cisternOakLedge';
  cisternOakLedge.position.set(0, 0.916, 0.215);
  toiletGroup.add(cisternOakLedge);

  // Bevelled Vitreous China Close-Coupled Cistern Tank + Fitted Overhanging Ceramic Cistern Lid + Dual-Flush Coaxial Brass Button
  const porcelainCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.36, 0.155),
    ceramicWhiteMat
  );
  porcelainCistern.name = 'outbuildings.stable.groundCloakroom.toilet.cistern';
  porcelainCistern.position.set(0, 0.58, 0.055);
  porcelainCistern.castShadow = true;
  toiletGroup.add(porcelainCistern);

  const cisternLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.386, 0.028, 0.168),
    ceramicWhiteMat
  );
  cisternLid.name = 'outbuildings.stable.groundCloakroom.toilet.cisternLid';
  cisternLid.position.set(0, 0.778, 0.055);
  cisternLid.castShadow = true;
  toiletGroup.add(cisternLid);

  const flushCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.008, 20),
    brushedBrassMat
  );
  flushCollar.name = 'outbuildings.stable.groundCloakroom.toilet.flushCollar';
  flushCollar.userData = { lodTier: 'high', lodMaxDistance: 12 };
  flushCollar.position.set(0, 0.8, 0.055);
  toiletGroup.add(flushCollar);

  const flushInnerBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.008, 18),
    brushedBrassMat
  );
  flushInnerBtn.name = 'outbuildings.stable.groundCloakroom.toilet.flushButton';
  flushInnerBtn.userData = { lodTier: 'high', lodMaxDistance: 12 };
  flushInnerBtn.position.set(0, 0.812, 0.055);
  toiletGroup.add(flushInnerBtn);

  // Stepped ceramic base pedestal + sculpted curved D-shaped outer ceramic bowl shell
  const basePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.158, 0.045, 28),
    ceramicWhiteMat
  );
  basePlinth.name = 'outbuildings.stable.groundCloakroom.toilet.basePlinth';
  basePlinth.position.set(0, 0.0225, -0.05);
  basePlinth.scale.set(1.0, 1.0, 1.42);
  basePlinth.castShadow = true;
  toiletGroup.add(basePlinth);

  const wcPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.172, 0.138, 0.31, 28),
    ceramicWhiteMat
  );
  wcPedestal.name = 'outbuildings.stable.groundCloakroom.toilet.bowl';
  wcPedestal.position.set(0, 0.205, -0.06);
  wcPedestal.scale.set(1.02, 1.0, 1.45);
  wcPedestal.castShadow = true;
  wcPedestal.receiveShadow = true;
  toiletGroup.add(wcPedestal);

  const rearShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.36, 0.22),
    ceramicWhiteMat
  );
  rearShroud.name = 'outbuildings.stable.groundCloakroom.toilet.rearShroud';
  rearShroud.position.set(0, 0.18, 0.04);
  rearShroud.castShadow = true;
  toiletGroup.add(rearShroud);

  // Recessed inner porcelain bowl cavity + translucent water disc (`0xd4eef7`)
  const bowlWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.115, 0.024, 26),
    darkCavityMat
  );
  bowlWell.name = 'outbuildings.stable.groundCloakroom.toilet.bowlWell';
  bowlWell.position.set(0, 0.376, -0.08);
  bowlWell.scale.set(1.0, 1.0, 1.34);
  toiletGroup.add(bowlWell);

  const waterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.006, 24),
    waterBlueMat
  );
  waterDisc.name = 'outbuildings.stable.groundCloakroom.toilet.waterDisc';
  waterDisc.position.set(0, 0.395, -0.075);
  waterDisc.scale.set(1.0, 1.0, 1.28);
  toiletGroup.add(waterDisc);

  // Contoured ergonomic open-ring seat (`TorusGeometry` front + side seat rails + brass hinge pins) + contoured soft-close top lid
  const seatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.146, 0.026, 14, 32),
    ceramicWhiteMat
  );
  seatRing.name = 'outbuildings.stable.groundCloakroom.toilet.seat';
  seatRing.rotation.x = Math.PI / 2;
  seatRing.position.set(0, 0.422, -0.075);
  seatRing.scale.set(1.0, 1.38, 0.55);
  seatRing.castShadow = true;
  toiletGroup.add(seatRing);

  for (const hx of [-0.085, 0.085] as const) {
    const seatHingePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.022, 14),
      brushedBrassMat
    );
    seatHingePin.name = 'outbuildings.stable.groundCloakroom.toilet.seatHinge';
    seatHingePin.userData = { lodTier: 'high', lodMaxDistance: 12 };
    seatHingePin.position.set(hx, 0.408, 0.08);
    toiletGroup.add(seatHingePin);
  }

  const softCloseLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.172, 0.172, 0.018, 28),
    ceramicWhiteMat
  );
  softCloseLid.name = 'outbuildings.stable.groundCloakroom.toilet.lid';
  softCloseLid.scale.set(1.0, 1.0, 1.36);
  softCloseLid.rotation.x = -Math.PI * 0.46; // Raised upright against the cistern front
  softCloseLid.position.set(0, 0.62, 0.005);
  softCloseLid.castShadow = true;
  toiletGroup.add(softCloseLid);

  // Brass angle stop valve + braided flexible feed hose on left side of cistern
  const stopValve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.055, 12),
    brushedBrassMat
  );
  stopValve.rotation.x = Math.PI / 2;
  stopValve.name = 'outbuildings.stable.groundCloakroom.toilet.stopValve';
  stopValve.userData = { lodTier: 'high', lodMaxDistance: 12 };
  stopValve.position.set(-0.22, 0.22, 0.12);
  toiletGroup.add(stopValve);

  const braidedHose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.19, 10),
    brushedBrassMat
  );
  braidedHose.name = 'outbuildings.stable.groundCloakroom.toilet.braidedHose';
  braidedHose.userData = { lodTier: 'high', lodMaxDistance: 12 };
  braidedHose.position.set(-0.20, 0.31, 0.09);
  toiletGroup.add(braidedHose);

  // Freestanding Brushed-Brass Toilet Brush Canister & Handle to the East of the pan
  const brushCanister = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.044, 0.26, 20),
    brushedBrassMat
  );
  brushCanister.name = 'outbuildings.stable.groundCloakroom.toilet.brushSet';
  brushCanister.position.set(0.28, 0.13, 0.02);
  brushCanister.castShadow = true;
  toiletGroup.add(brushCanister);

  const brushRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12),
    brushedBrassMat
  );
  brushRod.name = 'outbuildings.stable.groundCloakroom.toilet.brushHandle';
  brushRod.userData = { lodTier: 'high', lodMaxDistance: 12 };
  brushRod.position.set(0.28, 0.32, 0.02);
  toiletGroup.add(brushRod);

  // Wall-mounted Brushed-Brass Toilet Paper Holder & Roll on the East Wall adjacent to the WC
  const rollHolderArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.018, 0.14),
    brushedBrassMat
  );
  rollHolderArm.name = 'outbuildings.stable.groundCloakroom.toilet.rollHolder';
  rollHolderArm.position.set(0.42, 0.62, -0.14);
  toiletGroup.add(rollHolderArm);

  const paperRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.056, 0.11, 20),
    ceramicWhiteMat
  );
  paperRoll.rotation.x = Math.PI / 2;
  paperRoll.name = 'outbuildings.stable.groundCloakroom.toilet.paperRoll';
  paperRoll.userData = { lodTier: 'high', lodMaxDistance: 12 };
  paperRoll.position.set(0.39, 0.60, -0.14);
  paperRoll.castShadow = true;
  toiletGroup.add(paperRoll);

  // ---------------------------------------------------------------------------
  // C. Upgraded Wall-Hung Shaker Solid-Oak Vanity & Sculpted Vitreous China Basin (`outbuildings.stable.groundCloakroom.basin`)
  //    on the West Wall (`u = uWest + 0.16m, v = 4.46m`, facing East `+u`)
  // ---------------------------------------------------------------------------
  const basinGroup = new THREE.Group();
  basinGroup.name = 'outbuildings.stable.groundCloakroom.basin';
  basinGroup.position.set(uWest + 0.16, stableGroundFloorY + 0.012, 4.46);
  cloakGroup.add(basinGroup);

  const cabD = 0.30; // along u (x)
  const cabH = 0.48; // along y
  const cabW = 0.50; // along v (z)

  // Framed Shaker Solid-Oak Vanity Carcass with internal shelf, recessed Shaker door panel, soft-close brass hinges & knurled brass knob
  const vanityCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(cabD - 0.03, cabH, cabW),
    lightJoineryOakMat
  );
  vanityCarcass.name = 'outbuildings.stable.groundCloakroom.basin.cabinet';
  vanityCarcass.position.set(0, 0.56, 0);
  vanityCarcass.castShadow = true;
  vanityCarcass.receiveShadow = true;
  basinGroup.add(vanityCarcass);

  // Shaker door outer stile/rail frame on East (`+x`) front face
  for (const sz of [-1, 1] as const) {
    const doorStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, cabH - 0.02, 0.055),
      lightJoineryOakMat
    );
    doorStile.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.doorStile';
    doorStile.position.set(0.146, 0.56, sz * (cabW * 0.5 - 0.032));
    doorStile.castShadow = true;
    basinGroup.add(doorStile);
  }
  for (const sy of [-1, 1] as const) {
    const doorRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.055, cabW - 0.128),
      lightJoineryOakMat
    );
    doorRail.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.doorRail';
    doorRail.position.set(0.146, 0.56 + sy * (cabH * 0.5 - 0.036), 0);
    doorRail.castShadow = true;
    basinGroup.add(doorRail);
  }

  const shakerDoorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, cabH - 0.136, cabW - 0.128),
    lightJoineryOakMat
  );
  shakerDoorPanel.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.doorPanel';
  shakerDoorPanel.position.set(0.142, 0.56, 0);
  basinGroup.add(shakerDoorPanel);

  // Knurled brushed-brass cabinet pull knob + twin brass hinge knuckles
  const cabKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.010, 0.024, 16),
    brushedBrassMat
  );
  cabKnob.rotation.z = Math.PI / 2;
  cabKnob.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.knob';
  cabKnob.position.set(0.169, 0.72, -cabW * 0.5 + 0.035);
  basinGroup.add(cabKnob);

  for (const hy of [0.40, 0.72] as const) {
    const cabHinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.038, 10),
      brushedBrassMat
    );
    cabHinge.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.hinge';
    cabHinge.position.set(0.161, hy, cabW * 0.5 - 0.006);
    basinGroup.add(cabHinge);
  }

  // Sculpted Vitreous China Basin Top with raised outer rim walls surrounding a recessed inner basin bowl (`basinWell`), overflow & brass click-clack waste
  const basinBaseSlab = new THREE.Mesh(
    new THREE.BoxGeometry(cabD + 0.02, 0.036, cabW + 0.02),
    ceramicWhiteMat
  );
  basinBaseSlab.name = 'outbuildings.stable.groundCloakroom.basin.sink';
  basinBaseSlab.position.set(0.005, 0.822, 0);
  basinBaseSlab.castShadow = true;
  basinBaseSlab.receiveShadow = true;
  basinGroup.add(basinBaseSlab);

  const rimH = 0.068;
  const rimY = 0.844 + rimH * 0.5;
  // Back deck wall (holds tap) & front lip wall
  const backTapDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, rimH, cabW + 0.02),
    ceramicWhiteMat
  );
  backTapDeck.name = 'outbuildings.stable.groundCloakroom.basin.sink.tapDeck';
  backTapDeck.position.set(-cabD * 0.5 + 0.039, rimY, 0);
  backTapDeck.castShadow = true;
  basinGroup.add(backTapDeck);

  const frontRimWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, rimH, cabW + 0.02),
    ceramicWhiteMat
  );
  frontRimWall.name = 'outbuildings.stable.groundCloakroom.basin.sink.frontRim';
  frontRimWall.position.set(cabD * 0.5 - 0.002, rimY, 0);
  frontRimWall.castShadow = true;
  basinGroup.add(frontRimWall);

  for (const sz of [-1, 1] as const) {
    const sideRimWall = new THREE.Mesh(
      new THREE.BoxGeometry(cabD + 0.02 - 0.088 - 0.034 - 0.008, rimH, 0.042),
      ceramicWhiteMat
    );
    sideRimWall.name = 'outbuildings.stable.groundCloakroom.basin.sink.sideRim';
    sideRimWall.position.set(0.032, rimY, sz * (cabW * 0.5 - 0.011));
    sideRimWall.castShadow = true;
    basinGroup.add(sideRimWall);
  }

  // Raised rear ceramic upstand splashback lip against the West wall
  const splashbackUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.055, cabW + 0.02),
    ceramicWhiteMat
  );
  splashbackUpstand.name = 'outbuildings.stable.groundCloakroom.basin.sink.splashback';
  splashbackUpstand.position.set(-cabD * 0.5 + 0.006, 0.916 + 0.0275, 0);
  basinGroup.add(splashbackUpstand);

  // Recessed inner basin bowl well (`basinWell`) + slotted brass overflow ring + brass pop-up click-clack waste plug
  const basinWell = new THREE.Mesh(
    new THREE.BoxGeometry(cabD - 0.11, 0.01, cabW - 0.08),
    darkCavityMat
  );
  basinWell.name = 'outbuildings.stable.groundCloakroom.basin.well';
  basinWell.position.set(0.032, 0.849, 0);
  basinGroup.add(basinWell);

  const wastePlug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.008, 18),
    brushedBrassMat
  );
  wastePlug.name = 'outbuildings.stable.groundCloakroom.basin.wastePlug';
  wastePlug.position.set(0.024, 0.862, 0);
  basinGroup.add(wastePlug);

  const overflowRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.006, 14),
    brushedBrassMat
  );
  overflowRing.rotation.z = Math.PI / 2;
  overflowRing.name = 'outbuildings.stable.groundCloakroom.basin.overflowRing';
  overflowRing.position.set(-0.058, 0.886, 0);
  basinGroup.add(overflowRing);

  // High-Arc Swan-Neck Brushed-Brass Monobloc Basin Mixer Tap (`CylinderGeometry` collar + stem + `TorusGeometry` arch spout + aerator + side pin lever)
  const tapX = -0.102;
  const tapDeckTopY = 0.912;
  const tapCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.014, 18),
    brushedBrassMat
  );
  tapCollar.name = 'outbuildings.stable.groundCloakroom.basin.tap.collar';
  tapCollar.position.set(tapX, tapDeckTopY + 0.011, 0);
  basinGroup.add(tapCollar);

  const tapStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.016, 0.115, 16),
    brushedBrassMat
  );
  tapStem.name = 'outbuildings.stable.groundCloakroom.basin.tap';
  tapStem.position.set(tapX, tapDeckTopY + 0.08, 0);
  tapStem.castShadow = true;
  basinGroup.add(tapStem);

  const swanNeckSpout = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.010, 12, 24, Math.PI),
    brushedBrassMat
  );
  swanNeckSpout.name = 'outbuildings.stable.groundCloakroom.basin.tap.spout';
  swanNeckSpout.position.set(tapX + 0.052, tapDeckTopY + 0.137, 0);
  swanNeckSpout.castShadow = true;
  basinGroup.add(swanNeckSpout);

  const aeratorNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.010, 0.018, 14),
    brushedBrassMat
  );
  aeratorNozzle.name = 'outbuildings.stable.groundCloakroom.basin.tap.aerator';
  aeratorNozzle.position.set(tapX + 0.104, tapDeckTopY + 0.13, 0);
  basinGroup.add(aeratorNozzle);

  const pinLever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.065, 10),
    brushedBrassMat
  );
  pinLever.rotation.x = Math.PI * 0.25;
  pinLever.name = 'outbuildings.stable.groundCloakroom.basin.tap.lever';
  pinLever.position.set(tapX, tapDeckTopY + 0.08, 0.032);
  basinGroup.add(pinLever);

  // Ceramic Pump Soap Dispenser on the North corner of the basin deck + Folded Waffle Hand Towel on a Brushed-Brass Towel Ring
  const soapBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.032, 0.105, 18),
    new THREE.MeshStandardMaterial({ color: 0x3b4d3e, roughness: 0.28, metalness: 0.08 })
  );
  soapBottle.name = 'outbuildings.stable.groundCloakroom.basin.soapDispenser';
  soapBottle.position.set(-0.095, tapDeckTopY + 0.0565, -0.175);
  soapBottle.castShadow = true;
  basinGroup.add(soapBottle);

  const soapPumpHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.010, 0.028, 12),
    brushedBrassMat
  );
  soapPumpHead.name = 'outbuildings.stable.groundCloakroom.basin.soapDispenser.pump';
  soapPumpHead.userData = { lodTier: 'high', lodMaxDistance: 12 };
  soapPumpHead.position.set(-0.095, tapDeckTopY + 0.127, -0.175);
  basinGroup.add(soapPumpHead);

  const towelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.006, 10, 24),
    brushedBrassMat
  );
  towelRing.rotation.y = Math.PI / 2;
  towelRing.name = 'outbuildings.stable.groundCloakroom.basin.towelRing';
  towelRing.position.set(-0.135, 0.92, 0.34);
  basinGroup.add(towelRing);

  const handTowel = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.28, 0.11),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d5, roughness: 0.88 })
  );
  handTowel.name = 'outbuildings.stable.groundCloakroom.basin.handTowel';
  handTowel.position.set(-0.105, 0.76, 0.34);
  handTowel.castShadow = true;
  basinGroup.add(handTowel);

  // Illuminated Circular Bevelled Brushed-Brass Vanity Mirror (`mirrorFrame` + `mirrorGlass` + warm backlit LED halo ring)
  const mirrorHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.268, 0.006, 12, 36),
    new THREE.MeshStandardMaterial({
      color: 0xfff5e0,
      emissive: new THREE.Color(0xffd28a),
      emissiveIntensity: 1.85,
      roughness: 0.2,
    })
  );
  mirrorHalo.rotation.y = Math.PI / 2;
  mirrorHalo.name = 'outbuildings.stable.groundCloakroom.basin.mirrorHalo';
  mirrorHalo.position.set(-0.148, 1.38, 0);
  basinGroup.add(mirrorHalo);

  const mirrorFrame = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.014, 32),
    brushedBrassMat
  );
  mirrorFrame.name = 'outbuildings.stable.groundCloakroom.basin.mirrorFrame';
  mirrorFrame.rotation.z = Math.PI / 2;
  mirrorFrame.position.set(-0.131, 1.38, 0);
  mirrorFrame.castShadow = true;
  basinGroup.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.242, 0.242, 0.006, 32),
    new THREE.MeshStandardMaterial({ color: 0xdce8f2, roughness: 0.04, metalness: 0.94 })
  );
  mirrorGlass.name = 'outbuildings.stable.groundCloakroom.basin.mirrorGlass';
  mirrorGlass.rotation.z = Math.PI / 2;
  mirrorGlass.position.set(-0.117, 1.38, 0);
  basinGroup.add(mirrorGlass);

  const cloakLight = new THREE.PointLight(0xffd488, 1.4, 3.6, 1.6);
  cloakLight.name = 'outbuildings.stable.groundCloakroom.light';
  cloakLight.position.set(24.0, stableGroundFloorY + 2.15, 4.68);
  cloakGroup.add(cloakLight);

  cloakGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });
}

// ============================================================================
// BATCH 1 ISSUE #6: OUTDOOR FURNITURE SET ON 1ST-FLOOR STABLE EAST BALCONY
// Hit Point: `[7.722, 2.08, 17.465]` -> Outbuilding `(u = 29.956m, y = 2.08m, v = 4.041m)`
// High-LOD Weathered Solid-Teak & Woven-Rope Outdoor Balcony Lounge Set (`outbuildings.firstFloor.stableEastBalcony.furnitureSet`)
// arranged on the South half of the East Balcony Deck (`v = 3.15..5.48m`).
// ============================================================================
function createSculptedOliveLeafGeometry(
  length: number,
  maxWidth: number,
  archDrop: number
): THREE.BufferGeometry {
  const segX = 4;
  const segZ = 10;
  const geo = new THREE.PlaneGeometry(maxWidth, length, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, length * 0.5);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const t = Math.max(0, Math.min(1, z / length));
    const s = x / (maxWidth * 0.5);

    // Classic lanceolate Mediterranean olive leaf profile (narrow tapered base & pointed tip)
    const widthProfile = Math.sin(Math.pow(t, 0.85) * Math.PI);
    const shapedX = s * (maxWidth * 0.5) * widthProfile;

    // Subtle V-cupping along the midrib + longitudinal arch
    const cupY = Math.abs(s) * 0.004 * widthProfile;
    const archY = Math.sin(t * Math.PI * 0.85) * 0.012 - t * t * archDrop;

    pos.setXYZ(i, shapedX, cupY + archY, z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function createContouredOutdoorCushionGeometry(
  width: number,
  height: number,
  depth: number,
  crownRatio = 0.24
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(width, height, depth, 14, 6, 14);
  const pos = geo.attributes.position;
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const halfD = depth * 0.5;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = x / halfW;
    const ny = y / halfH;
    const nz = z / halfD;

    // Softly round horizontal corners in plan view and crown top/bottom cushion faces
    const edgeProfileX = Math.max(0, 1 - nx * nx * 0.16);
    const edgeProfileZ = Math.max(0, 1 - nz * nz * 0.16);
    const domeFactor = Math.max(0, (1 - nx * nx * 0.72) * (1 - nz * nz * 0.72));
    const sideRoll = Math.sqrt(Math.max(0.18, 1 - 0.22 * ny * ny));

    const sx = x * sideRoll * (0.94 + 0.06 * edgeProfileZ);
    const sz = z * sideRoll * (0.94 + 0.06 * edgeProfileX);
    const sy = y * (0.84 + 0.16 * edgeProfileX * edgeProfileZ) + Math.sign(ny) * height * crownRatio * domeFactor;

    pos.setXYZ(i, sx, sy, sz);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function buildStableBalconyOutdoorFurniture(
  balconyGroup: THREE.Group,
  stableUpperFloorY: number,
  _balStartU: number,
  _balEndU: number
): void {
  const furnGroup = new THREE.Group();
  furnGroup.name = 'outbuildings.firstFloor.stableEastBalcony.furnitureSet';
  furnGroup.userData.zone = 'sitting';
  balconyGroup.add(furnGroup);

  const deckY = stableUpperFloorY;

  const weatheredTeakMat = new THREE.MeshStandardMaterial({
    color: 0x9e7b56,
    roughness: 0.58,
    metalness: 0.04,
  });
  const brushedBrassHardwareMat = new THREE.MeshStandardMaterial({
    color: 0xc8a464,
    roughness: 0.28,
    metalness: 0.84,
  });
  const honedTravertineMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.46,
    metalness: 0.02,
  });
  const oliveBarkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4d3d,
    roughness: 0.86,
    metalness: 0.01,
  });
  const wovenRopeMat = new THREE.MeshStandardMaterial({
    color: 0x7b7267,
    roughness: 0.84,
    metalness: 0.02,
  });
  const sunbrellaOatmealMat = new THREE.MeshStandardMaterial({
    color: 0xebe5da,
    roughness: 0.80,
    metalness: 0.01,
  });
  const cushionPipingMat = new THREE.MeshStandardMaterial({
    color: 0xd6cec0,
    roughness: 0.82,
    metalness: 0.01,
  });
  const terracottaPillowMat = new THREE.MeshStandardMaterial({
    color: 0xb5654d,
    roughness: 0.84,
    metalness: 0.01,
  });
  const sagePillowMat = new THREE.MeshStandardMaterial({
    color: 0x6b7b66,
    roughness: 0.84,
    metalness: 0.01,
  });
  const outdoorRugMat = new THREE.MeshStandardMaterial({
    color: 0xd4cbbd,
    roughness: 0.92,
    metalness: 0.01,
  });
  const outdoorRugBorderMat = new THREE.MeshStandardMaterial({
    color: 0xb8ad9c,
    roughness: 0.90,
    metalness: 0.01,
  });
  const terracottaPotMat = new THREE.MeshStandardMaterial({
    color: 0xb85d43,
    roughness: 0.72,
    metalness: 0.02,
  });
  const pottingSoilMat = new THREE.MeshStandardMaterial({
    color: 0x2c221b,
    roughness: 0.94,
  });
  const oliveLeafDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3b5234,
    roughness: 0.56,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const oliveLeafMidMat = new THREE.MeshStandardMaterial({
    color: 0x4d6844,
    roughness: 0.58,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const oliveLeafSilveryMat = new THREE.MeshStandardMaterial({
    color: 0x74876c,
    roughness: 0.62,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const lavenderFlowerMat = new THREE.MeshStandardMaterial({
    color: 0x796296,
    roughness: 0.74,
  });

  // 1. Circular Woven Jute Outdoor Accent Rug (`r = 0.88m` centered in the North balcony bay at `u = midU + 0.12, v = 0.98m`
  //    — 100% clear of the central French balcony doors `v = 2.215..3.495m` and SE spiral staircase `v = 4.42..5.22m`!)
  const rugCenterU = 30.52;
  const rugCenterV = 1.02;
  const patioRug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.96, 0.96, 0.007, 36),
    outdoorRugMat
  );
  patioRug.name = 'outbuildings.firstFloor.stableEastBalcony.outdoorRug';
  patioRug.position.set(rugCenterU, deckY + 0.0075, rugCenterV);
  patioRug.receiveShadow = true;
  furnGroup.add(patioRug);

  const patioRugBorder = new THREE.Mesh(
    new THREE.TorusGeometry(0.978, 0.012, 10, 40),
    outdoorRugBorderMat
  );
  patioRugBorder.rotation.x = Math.PI / 2;
  patioRugBorder.name = 'outbuildings.firstFloor.stableEastBalcony.outdoorRug.border';
  patioRugBorder.position.set(rugCenterU, deckY + 0.016, rugCenterV);
  furnGroup.add(patioRugBorder);

  // 2. Pair of High-LOD Sculpted Solid-Teak & Open-Weave Rope Barrel Lounge Armchairs (`armchair.1` & `armchair.2`)
  //    Positioned in the quiet North bay (`v = 0.64m..1.38m`), angled inward for morning coffee overlooking the garden!
  const seatCushionGeo = createContouredOutdoorCushionGeometry(0.58, 0.115, 0.56, 0.22);
  const backCushionGeo = createContouredOutdoorCushionGeometry(0.54, 0.30, 0.125, 0.24);
  const throwPillowGeo = createContouredOutdoorCushionGeometry(0.25, 0.24, 0.085, 0.28);

  // Curved wrap-around U-shaped solid-teak barrel crest rail geometry (`TubeGeometry` along `CatmullRomCurve3`)
  const barrelCrestCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.31, 0.56, -0.25),
    new THREE.Vector3(-0.32, 0.58, 0.04),
    new THREE.Vector3(-0.27, 0.64, 0.24),
    new THREE.Vector3(0.0, 0.665, 0.30),
    new THREE.Vector3(0.27, 0.64, 0.24),
    new THREE.Vector3(0.32, 0.58, 0.04),
    new THREE.Vector3(0.31, 0.56, -0.25),
  ]);
  const barrelCrestGeo = new THREE.TubeGeometry(barrelCrestCurve, 28, 0.019, 12, false);

  const barrelLowerRailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.31, 0.26, -0.25),
    new THREE.Vector3(-0.32, 0.26, 0.04),
    new THREE.Vector3(-0.27, 0.26, 0.24),
    new THREE.Vector3(0.0, 0.26, 0.29),
    new THREE.Vector3(0.27, 0.26, 0.24),
    new THREE.Vector3(0.32, 0.26, 0.04),
    new THREE.Vector3(0.31, 0.26, -0.25),
  ]);
  const barrelLowerRailGeo = new THREE.TubeGeometry(barrelLowerRailCurve, 24, 0.014, 10, false);

  for (const [cIdx, cu, cv, rotY, pillowMat] of [
    [1, 29.82, 0.88, -2.42, terracottaPillowMat],
    [2, 31.22, 1.02, 2.38, sagePillowMat],
  ] as const) {
    const chairGrp = new THREE.Group();
    chairGrp.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}`;
    chairGrp.position.set(cu, deckY, cv);
    chairGrp.rotation.y = rotY;
    furnGroup.add(chairGrp);

    const cW = 0.64;
    const cD = 0.60;

    // Chamfered solid-teak perimeter seat frame + 5 recessed solid-teak deck slats
    for (const [rTag, rx, rz, rw, rd] of [
      ['frontRail', 0, -cD * 0.5 + 0.024, cW, 0.044],
      ['rearRail', 0, cD * 0.5 - 0.024, cW, 0.044],
      ['leftRail', -cW * 0.5 + 0.024, 0, 0.044, cD - 0.088],
      ['rightRail', cW * 0.5 - 0.024, 0, 0.044, cD - 0.088],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(rw, 0.042, rd),
        weatheredTeakMat
      );
      rail.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.${rTag}`;
      rail.position.set(rx, 0.24, rz);
      rail.castShadow = true;
      rail.receiveShadow = true;
      chairGrp.add(rail);
    }

    for (let s = 0; s < 5; s++) {
      const sz = -0.18 + s * 0.09;
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(cW - 0.09, 0.016, 0.052),
        weatheredTeakMat
      );
      slat.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.seatSlat.${s + 1}`;
      slat.userData = { lodTier: 'high', lodMaxDistance: 12 };
      slat.position.set(0, 0.242, sz);
      chairGrp.add(slat);
    }

    // 4 Splayed Turned Solid-Teak Legs with Brushed-Brass Ferrule Feet + Turned Front Arm Posts
    for (const [lIdx, lx, lz, splayX, splayZ] of [
      [1, -cW * 0.5 + 0.045, -cD * 0.5 + 0.045, 0.06, 0.05],
      [2, cW * 0.5 - 0.045, -cD * 0.5 + 0.045, -0.06, 0.05],
      [3, -cW * 0.5 + 0.045, cD * 0.5 - 0.045, 0.06, -0.07],
      [4, cW * 0.5 - 0.045, cD * 0.5 - 0.045, -0.06, -0.07],
    ] as const) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.015, 0.23, 14),
        weatheredTeakMat
      );
      leg.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.leg.${lIdx}`;
      leg.position.set(lx, 0.115, lz);
      leg.rotation.set(splayZ, 0, splayX);
      leg.castShadow = true;
      chairGrp.add(leg);

      const ferrule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.015, 0.028, 12),
        brushedBrassHardwareMat
      );
      ferrule.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.ferrule.${lIdx}`;
      ferrule.userData = { lodTier: 'high', lodMaxDistance: 12 };
      ferrule.position.set(lx - splayX * 0.09, 0.015, lz + splayZ * 0.09);
      chairGrp.add(ferrule);
    }

    for (const [sx, sideTag] of [
      [-1, 'left'],
      [1, 'right'],
    ] as const) {
      const armPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.020, 0.31, 12),
        weatheredTeakMat
      );
      armPost.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.armPost.${sideTag}`;
      armPost.position.set(sx * 0.31, 0.405, -0.25);
      armPost.castShadow = true;
      chairGrp.add(armPost);
    }

    // Sculpted Wrap-Around U-Shaped Solid-Teak Barrel Crest Rail & Lower Frame Rail
    // (Named `.backrest` on the primary barrel frame so existing USD / scene references resolve cleanly!)
    const crestRailMesh = new THREE.Mesh(barrelCrestGeo, weatheredTeakMat);
    crestRailMesh.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.backrest`;
    crestRailMesh.castShadow = true;
    crestRailMesh.receiveShadow = true;
    chairGrp.add(crestRailMesh);

    const lowerBarrelMesh = new THREE.Mesh(barrelLowerRailGeo, weatheredTeakMat);
    lowerBarrelMesh.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.lowerBarrelRail`;
    lowerBarrelMesh.castShadow = true;
    chairGrp.add(lowerBarrelMesh);

    // Open-Weave Tensioned Olefin Rope Vertical Cords (`17` vertical cords around the U-shaped barrel)
    const numRopeCords = 17;
    for (let r = 1; r < numRopeCords; r++) {
      const t = r / numRopeCords;
      const topPt = barrelCrestCurve.getPoint(t);
      const botPt = barrelLowerRailCurve.getPoint(t);
      const cordVec = new THREE.Vector3().subVectors(topPt, botPt);
      const cordLen = cordVec.length();
      const midPt = new THREE.Vector3().addVectors(topPt, botPt).multiplyScalar(0.5);

      const cordMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0055, 0.0055, cordLen, 8),
        wovenRopeMat
      );
      cordMesh.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.ropeCord.${r}`;
      cordMesh.position.copy(midPt);
      cordMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        cordVec.normalize()
      );
      cordMesh.castShadow = true;
      chairGrp.add(cordMesh);
    }

    // Contoured Plump Sunbrella Bouclé Seat Cushion, Lumbar Back Cushion, and Accent Throw Pillow
    const cSeat = new THREE.Mesh(seatCushionGeo, sunbrellaOatmealMat);
    cSeat.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.seatCushion`;
    cSeat.position.set(0, 0.315, -0.015);
    cSeat.castShadow = true;
    cSeat.receiveShadow = true;
    chairGrp.add(cSeat);

    const seatPiping = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.005, 8, 32),
      cushionPipingMat
    );
    seatPiping.rotation.x = Math.PI / 2;
    seatPiping.scale.set(0.98, 0.94, 1);
    seatPiping.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.seatPiping`;
    seatPiping.userData = { lodTier: 'high', lodMaxDistance: 12 };
    seatPiping.position.set(0, 0.355, -0.015);
    chairGrp.add(seatPiping);

    const cBackCush = new THREE.Mesh(backCushionGeo, sunbrellaOatmealMat);
    cBackCush.rotation.x = -0.20;
    cBackCush.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.backCushion`;
    cBackCush.position.set(0, 0.50, 0.165);
    cBackCush.castShadow = true;
    cBackCush.receiveShadow = true;
    chairGrp.add(cBackCush);

    const throwPillow = new THREE.Mesh(throwPillowGeo, pillowMat);
    throwPillow.rotation.set(-0.28, cIdx === 1 ? 0.28 : -0.28, cIdx === 1 ? -0.10 : 0.10);
    throwPillow.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.throwPillow`;
    throwPillow.position.set(cIdx === 1 ? -0.11 : 0.11, 0.46, 0.075);
    throwPillow.castShadow = true;
    chairGrp.add(throwPillow);
  }

  // 3. Sculpted Round Honed-Travertine & Turned-Teak Bistro Side Table (`outbuildings.firstFloor.stableEastBalcony.coffeeTable`)
  //    Positioned between the two lounge armchairs at `(30.56, deckY, 0.56)` with >16cm clear gap on both sides
  const tableGrp = new THREE.Group();
  tableGrp.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable';
  tableGrp.position.set(30.56, deckY, 0.56);
  furnGroup.add(tableGrp);

  const tR = 0.24;
  const tH = 0.43;

  // Chamfered Honed Travertine Stone Tabletop inset into a Turned Solid-Teak Rim Collar
  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(tR - 0.026, tR - 0.028, 0.024, 32),
    honedTravertineMat
  );
  tableTop.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.top';
  tableTop.position.set(0, tH, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGrp.add(tableTop);

  const tableTeakRim = new THREE.Mesh(
    new THREE.TorusGeometry(tR - 0.008, 0.014, 14, 36),
    weatheredTeakMat
  );
  tableTeakRim.rotation.x = Math.PI / 2;
  tableTeakRim.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.teakRim';
  tableTeakRim.position.set(0, tH - 0.002, 0);
  tableTeakRim.castShadow = true;
  tableGrp.add(tableTeakRim);

  // 3 Splayed Turned Solid-Teak Tripod Legs + Brushed-Brass Ring Stretcher
  for (let l = 0; l < 3; l++) {
    const ang = (l / 3) * Math.PI * 2 + Math.PI / 6;
    const legR = tR - 0.055;
    const lx = Math.cos(ang) * legR;
    const lz = Math.sin(ang) * legR;
    const tLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.013, tH - 0.024, 14),
      weatheredTeakMat
    );
    tLeg.name = `outbuildings.firstFloor.stableEastBalcony.coffeeTable.leg.${l + 1}`;
    tLeg.position.set(lx, 0.004 + (tH - 0.024) * 0.5, lz);
    tLeg.rotation.set(Math.sin(ang) * 0.08, 0, -Math.cos(ang) * 0.08);
    tLeg.castShadow = true;
    tableGrp.add(tLeg);
  }

  const stretcherRing = new THREE.Mesh(
    new THREE.TorusGeometry(tR - 0.062, 0.009, 10, 28),
    brushedBrassHardwareMat
  );
  stretcherRing.rotation.x = Math.PI / 2;
  stretcherRing.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.stretcherRing';
  stretcherRing.position.set(0, 0.14, 0);
  tableGrp.add(stretcherRing);

  // Handcrafted Brass-Framed Hurricane Candle Lantern & Ceramic Tray on the Bistro Side Table
  const lanternBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.072, 0.014, 20),
    brushedBrassHardwareMat
  );
  lanternBase.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.lanternBase';
  lanternBase.position.set(-0.06, tH + 0.023, -0.02);
  tableGrp.add(lanternBase);

  const lanternGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.175, 20),
    new THREE.MeshStandardMaterial({
      color: 0xeaf4f8,
      transparent: true,
      opacity: 0.38,
      roughness: 0.06,
    })
  );
  lanternGlass.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.lanternGlass';
  lanternGlass.position.set(-0.06, tH + 0.122, -0.02);
  tableGrp.add(lanternGlass);

  const lanternTopRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.062, 0.005, 10, 24),
    brushedBrassHardwareMat
  );
  lanternTopRing.rotation.x = Math.PI / 2;
  lanternTopRing.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.lanternTopRing';
  lanternTopRing.position.set(-0.06, tH + 0.215, -0.02);
  tableGrp.add(lanternTopRing);

  const pillarCandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.105, 14),
    new THREE.MeshStandardMaterial({
      color: 0xfff8e8,
      emissive: new THREE.Color(0xffbe66),
      emissiveIntensity: 1.15,
      roughness: 0.4,
    })
  );
  pillarCandle.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.candle';
  pillarCandle.userData = { lodTier: 'high', lodMaxDistance: 12 };
  pillarCandle.position.set(-0.06, tH + 0.0865, -0.02);
  tableGrp.add(pillarCandle);

  const ceramicTray = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.082, 0.016, 20),
    terracottaPillowMat
  );
  ceramicTray.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.ceramicTray';
  ceramicTray.userData = { lodTier: 'high', lodMaxDistance: 12 };
  ceramicTray.position.set(0.085, tH + 0.024, 0.035);
  tableGrp.add(ceramicTray);

  // 4. High-LOD Sculpted Mediterranean Olive Trees (`Olea europaea`) in Turned Ribbed Terracotta Amphora Planters
  //    Tucked into the North-West (`u = 29.40, v = 0.42`) and South-West (`u = 29.40, v = 5.26`) corners of the balcony!
  const potProfilePts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.135, 0.0),
    new THREE.Vector2(0.142, 0.032),
    new THREE.Vector2(0.132, 0.045),
    new THREE.Vector2(0.168, 0.14),
    new THREE.Vector2(0.205, 0.26),
    new THREE.Vector2(0.195, 0.35),
    new THREE.Vector2(0.218, 0.375),
    new THREE.Vector2(0.214, 0.398),
    new THREE.Vector2(0.184, 0.398),
    new THREE.Vector2(0.180, 0.355),
    new THREE.Vector2(0.0, 0.355),
  ];
  const turnedPotGeo = new THREE.LatheGeometry(potProfilePts, 24);
  const oliveLeafGeoLarge = createSculptedOliveLeafGeometry(0.125, 0.034, 0.018);
  const oliveLeafGeoMed = createSculptedOliveLeafGeometry(0.098, 0.028, 0.014);
  const oliveLeafMats = [oliveLeafDarkMat, oliveLeafMidMat, oliveLeafSilveryMat] as const;

  for (const [pIdx, pu, pv, seedRot] of [
    [1, 29.36, 0.36, 0.25],
    [2, 29.36, 5.28, 1.85],
  ] as const) {
    const potGrp = new THREE.Group();
    potGrp.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}`;
    potGrp.position.set(pu, deckY + 0.004, pv);
    potGrp.rotation.y = seedRot;
    furnGroup.add(potGrp);

    const potMesh = new THREE.Mesh(turnedPotGeo, terracottaPotMat);
    potMesh.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.pot`;
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    potGrp.add(potMesh);

    for (const ribY of [0.14, 0.22, 0.30] as const) {
      const ribR = ribY < 0.18 ? 0.172 : 0.204;
      const ribRing = new THREE.Mesh(
        new THREE.TorusGeometry(ribR, 0.0055, 8, 24),
        terracottaPotMat
      );
      ribRing.rotation.x = Math.PI / 2;
      ribRing.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.potRim`;
      ribRing.position.set(0, ribY, 0);
      potGrp.add(ribRing);
    }

    const soilBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.174, 0.17, 0.018, 20),
      pottingSoilMat
    );
    soilBed.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.soil`;
    soilBed.position.set(0, 0.368, 0);
    potGrp.add(soilBed);

    const mainTrunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.35, 0.0),
      new THREE.Vector3(0.018, 0.50, -0.012),
      new THREE.Vector3(-0.014, 0.64, 0.015),
      new THREE.Vector3(0.008, 0.76, 0.004),
    ]);
    const mainTrunkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(mainTrunkCurve, 14, 0.022, 10, false),
      oliveBarkMat
    );
    mainTrunkMesh.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.trunk`;
    mainTrunkMesh.castShadow = true;
    potGrp.add(mainTrunkMesh);

    const boughSpecs: ReadonlyArray<{
      readonly start: readonly [number, number, number];
      readonly mid: readonly [number, number, number];
      readonly tip: readonly [number, number, number];
    }> = [
      { start: [0.005, 0.68, 0.005], mid: [0.08, 0.78, 0.05], tip: [0.15, 0.88, 0.09] },
      { start: [-0.008, 0.66, 0.01], mid: [-0.09, 0.76, 0.06], tip: [-0.16, 0.86, 0.11] },
      { start: [0.006, 0.70, -0.008], mid: [0.07, 0.80, -0.08], tip: [0.13, 0.90, -0.15] },
      { start: [-0.006, 0.69, -0.006], mid: [-0.08, 0.79, -0.07], tip: [-0.14, 0.89, -0.13] },
      { start: [0.004, 0.74, 0.002], mid: [0.02, 0.86, -0.01], tip: [0.0, 0.97, 0.01] },
    ];

    for (let bIdx = 0; bIdx < boughSpecs.length; bIdx++) {
      const b = boughSpecs[bIdx]!;
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(b.start[0], b.start[1], b.start[2]),
        new THREE.Vector3(b.mid[0], b.mid[1], b.mid[2]),
        new THREE.Vector3(b.tip[0], b.tip[1], b.tip[2]),
      ]);
      const bMesh = new THREE.Mesh(
        new THREE.TubeGeometry(bCurve, 8, 0.010, 8, false),
        oliveBarkMat
      );
      bMesh.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.branch`;
      bMesh.castShadow = true;
      potGrp.add(bMesh);

      const numLeafWhorls = 16;
      for (let w = 0; w < numLeafWhorls; w++) {
        const frac = 0.22 + (w / (numLeafWhorls - 1)) * 0.78;
        const pt = bCurve.getPoint(frac);
        const yaw = w * 2.39996 + bIdx * 1.25;
        const pitch = -0.38 + (w % 4) * 0.24;
        const roll = ((w + bIdx) % 3 - 1) * 0.22;

        const leafMesh = new THREE.Mesh(
          w % 2 === 0 ? oliveLeafGeoLarge : oliveLeafGeoMed,
          oliveLeafMats[(w + bIdx) % oliveLeafMats.length]!
        );
        leafMesh.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.leaf`;
        leafMesh.position.set(
          pt.x + Math.sin(yaw) * 0.028,
          pt.y + ((w % 3) - 1) * 0.018,
          pt.z + Math.cos(yaw) * 0.028
        );
        leafMesh.rotation.order = 'YXZ';
        leafMesh.rotation.set(pitch, yaw, roll);
        leafMesh.castShadow = true;
        potGrp.add(leafMesh);
      }
    }

    for (let s = 0; s < 14; s++) {
      const ang = (s / 14) * Math.PI * 2;
      const rBase = 0.135 + (s % 2) * 0.022;
      const sprig = new THREE.Mesh(
        oliveLeafGeoMed,
        s % 3 === 0 ? oliveLeafSilveryMat : oliveLeafMidMat
      );
      sprig.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.leaf`;
      sprig.position.set(Math.cos(ang) * rBase, 0.365, Math.sin(ang) * rBase);
      sprig.rotation.order = 'YXZ';
      sprig.rotation.set(0.32 + (s % 3) * 0.14, Math.atan2(Math.cos(ang), Math.sin(ang)), 0);
      sprig.castShadow = true;
      potGrp.add(sprig);

      if (s % 2 === 0) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.011, 0.055, 7),
          lavenderFlowerMat
        );
        spike.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.flowerSpike`;
        spike.userData = { lodTier: 'high', lodMaxDistance: 12 };
        spike.position.set(Math.cos(ang) * (rBase + 0.02), 0.43, Math.sin(ang) * (rBase + 0.02));
        spike.rotation.z = -Math.cos(ang) * 0.28;
        spike.rotation.x = Math.sin(ang) * 0.28;
        potGrp.add(spike);
      }
    }
  }

  furnGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });
}
