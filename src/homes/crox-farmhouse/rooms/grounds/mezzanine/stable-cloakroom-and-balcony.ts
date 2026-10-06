import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../types/scene.ts';
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

  // 1. Tiled Cloakroom Floor (`u = 23.22..24.70m, v = 3.99..5.425m`)
  const floorW = uEast - partT * 0.5 - uWest;
  const floorD = vSouth - (vNorth + partT * 0.5);
  const tiledFloor = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.012, floorD),
    marbleTileMat
  );
  tiledFloor.name = 'outbuildings.stable.groundCloakroom.tiledFloor';
  tiledFloor.position.set(
    uWest + floorW * 0.5,
    stableGroundFloorY + 0.006,
    vNorth + partT * 0.5 + floorD * 0.5
  );
  tiledFloor.receiveShadow = true;
  cloakGroup.add(tiledFloor);

  // 2. Plastered Stud Partition Walls (`vNorth = 3.94m` with `0.76m` doorway & `uEast = 24.75m`)
  const uDoor0 = 23.62;
  const uDoor1 = 24.38; // 0.76m cloakroom doorway centered at midU = 24.00m
  const doorW = uDoor1 - uDoor0;
  const midU = (uDoor0 + uDoor1) * 0.5;
  const doorH = 1.98;
  const lintelH = wallH - doorH;

  const northWallWest = new THREE.Mesh(
    new THREE.BoxGeometry(uDoor0 - uWest, wallH, partT),
    warmRoomPlasterMat
  );
  northWallWest.name = 'outbuildings.stable.groundCloakroom.northWallWest';
  northWallWest.userData.isArchitecturalShell = true;
  northWallWest.position.set((uWest + uDoor0) * 0.5, stableGroundFloorY + wallH * 0.5, vNorth);
  northWallWest.castShadow = true;
  northWallWest.receiveShadow = true;
  cloakGroup.add(northWallWest);

  const northWallEast = new THREE.Mesh(
    new THREE.BoxGeometry(uEast + partT * 0.5 - uDoor1, wallH, partT),
    warmRoomPlasterMat
  );
  northWallEast.name = 'outbuildings.stable.groundCloakroom.northWallEast';
  northWallEast.userData.isArchitecturalShell = true;
  northWallEast.position.set((uDoor1 + uEast + partT * 0.5) * 0.5, stableGroundFloorY + wallH * 0.5, vNorth);
  northWallEast.castShadow = true;
  northWallEast.receiveShadow = true;
  cloakGroup.add(northWallEast);

  const northLintel = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, lintelH, partT),
    warmRoomPlasterMat
  );
  northLintel.name = 'outbuildings.stable.groundCloakroom.northDoorLintel';
  northLintel.position.set(midU, stableGroundFloorY + doorH + lintelH * 0.5, vNorth);
  cloakGroup.add(northLintel);

  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(partT, wallH, floorD),
    warmRoomPlasterMat
  );
  eastWall.name = 'outbuildings.stable.groundCloakroom.eastWall';
  eastWall.userData.isArchitecturalShell = true;
  eastWall.position.set(uEast, stableGroundFloorY + wallH * 0.5, vNorth + partT * 0.5 + floorD * 0.5);
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
  for (const jSide of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(jambThick, doorH, jambDepth),
      lightJoineryOakMat
    );
    jamb.name = 'outbuildings.stable.groundCloakroom.doorFrame.jamb';
    jamb.position.set(
      midU + jSide * (doorW * 0.5 - jambThick * 0.5),
      stableGroundFloorY + doorH * 0.5,
      vNorth
    );
    jamb.castShadow = true;
    cloakGroup.add(jamb);

    // Recessed solid oak door stop strip along each vertical jamb
    const stopStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, doorH - jambThick, 0.016),
      lightJoineryOakMat
    );
    stopStrip.name = 'outbuildings.stable.groundCloakroom.doorFrame.stopStrip';
    stopStrip.position.set(
      midU + jSide * (doorW * 0.5 - jambThick - 0.006),
      stableGroundFloorY + (doorH - jambThick) * 0.5,
      vNorth + 0.014
    );
    cloakGroup.add(stopStrip);
  }

  const headJamb = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, jambThick, jambDepth),
    lightJoineryOakMat
  );
  headJamb.name = 'outbuildings.stable.groundCloakroom.doorFrame.head';
  headJamb.position.set(midU, stableGroundFloorY + doorH - jambThick * 0.5, vNorth);
  cloakGroup.add(headJamb);

  const headStop = new THREE.Mesh(
    new THREE.BoxGeometry(doorW - jambThick * 2, 0.012, 0.016),
    lightJoineryOakMat
  );
  headStop.name = 'outbuildings.stable.groundCloakroom.doorFrame.headStop';
  headStop.position.set(midU, stableGroundFloorY + doorH - jambThick - 0.006, vNorth + 0.014);
  cloakGroup.add(headStop);

  // Flush solid light-oak threshold sill strip
  const thresholdSill = new THREE.Mesh(
    new THREE.BoxGeometry(doorW - jambThick * 2, 0.014, jambDepth),
    lightJoineryOakMat
  );
  thresholdSill.name = 'outbuildings.stable.groundCloakroom.doorFrame.threshold';
  thresholdSill.position.set(midU, stableGroundFloorY + 0.007, vNorth);
  thresholdSill.receiveShadow = true;
  cloakGroup.add(thresholdSill);

  // Chamfered solid light-oak architraves (`0.058m` wide × `0.016m` thick) on BOTH North exterior (`v = 3.94 - 0.058`) and South interior (`v = 3.94 + 0.058`) faces
  const archW = 0.058;
  const archT = 0.016;
  for (const faceDir of [-1, 1] as const) {
    const archZ = vNorth + faceDir * (partT * 0.5 + archT * 0.5);
    for (const sSide of [-1, 1] as const) {
      const sideArch = new THREE.Mesh(
        new THREE.BoxGeometry(archW, doorH + archW, archT),
        lightJoineryOakMat
      );
      sideArch.name = 'outbuildings.stable.groundCloakroom.doorFrame.architrave';
      sideArch.position.set(
        midU + sSide * (doorW * 0.5 + archW * 0.5 - 0.012),
        stableGroundFloorY + (doorH + archW) * 0.5,
        archZ
      );
      sideArch.castShadow = true;
      cloakGroup.add(sideArch);
    }
    const topArch = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + archW * 2 - 0.024, archW, archT),
      lightJoineryOakMat
    );
    topArch.name = 'outbuildings.stable.groundCloakroom.doorFrame.architrave';
    topArch.position.set(midU, stableGroundFloorY + doorH + archW * 0.5 - 0.012, archZ);
    topArch.castShadow = true;
    cloakGroup.add(topArch);
  }

  // Interactive Hinged 4-Panel Shaker Solid European Oak Door (`outbuildings.stable.groundCloakroom.door`)
  // Positioned at the West hinge jamb `(uDoor0 + 0.026, stableGroundFloorY + 0.012, vNorth)`, closed flush by default (`rotation.y = 0`)
  const doorPivot = new THREE.Group();
  doorPivot.name = 'outbuildings.stable.groundCloakroom.door';
  doorPivot.position.set(uDoor0 + jambThick, stableGroundFloorY + 0.012, vNorth);
  doorPivot.rotation.y = 0;
  cloakGroup.add(doorPivot);

  const clearW = 0.708; // doorW (0.76) - 2 * jambThick (0.052)
  const clearH = 1.94;  // doorH (1.98) - jambThick (0.026) - threshold (0.014)
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
  const innerRailW = clearW - stileW * 2;
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
  const upperBayY0 = lockRailCenterY + lockRailH * 0.5;
  const upperBayY1 = clearH - topRailH;

  for (const [mName, y0, y1] of [
    ['muntinLower', lowerBayY0, lowerBayY1],
    ['muntinUpper', upperBayY0, upperBayY1],
  ] as const) {
    const muntin = new THREE.Mesh(
      new THREE.BoxGeometry(muntinW, y1 - y0, doorT),
      lightJoineryOakMat
    );
    muntin.name = `outbuildings.stable.groundCloakroom.door.${mName}`;
    muntin.position.set(railCenterX, (y0 + y1) * 0.5, 0);
    muntin.castShadow = true;
    doorPivot.add(muntin);
  }

  // 4 Recessed solid oak panels (`0.024m` thick) with bevelled bolection/chamfered panel mouldings on both faces
  const panelW = (innerRailW - muntinW) * 0.5;
  const panelLeftX = stileW + panelW * 0.5;
  const panelRightX = clearW - stileW - panelW * 0.5;
  const panelBays: ReadonlyArray<readonly [number, number, number]> = [
    [panelLeftX, (lowerBayY0 + lowerBayY1) * 0.5, lowerBayY1 - lowerBayY0],
    [panelRightX, (lowerBayY0 + lowerBayY1) * 0.5, lowerBayY1 - lowerBayY0],
    [panelLeftX, (upperBayY0 + upperBayY1) * 0.5, upperBayY1 - upperBayY0],
    [panelRightX, (upperBayY0 + upperBayY1) * 0.5, upperBayY1 - upperBayY0],
  ];

  for (let pIdx = 0; pIdx < panelBays.length; pIdx++) {
    const [px, py, ph] = panelBays[pIdx]!;
    const recessedPanel = new THREE.Mesh(
      new THREE.BoxGeometry(panelW + 0.004, ph + 0.004, 0.024),
      lightJoineryOakMat
    );
    recessedPanel.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}`;
    recessedPanel.position.set(px, py, 0);
    recessedPanel.castShadow = true;
    recessedPanel.receiveShadow = true;
    doorPivot.add(recessedPanel);

    // Raised fielded panel centre bevel on both faces
    const fieldedCore = new THREE.Mesh(
      new THREE.BoxGeometry(panelW - 0.032, ph - 0.036, 0.032),
      lightJoineryOakMat
    );
    fieldedCore.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}.core`;
    fieldedCore.position.set(px, py, 0);
    doorPivot.add(fieldedCore);

    // Chamfered perimeter bolection moulding strips on both North and South faces
    for (const fz of [-0.015, 0.015] as const) {
      const topMould = new THREE.Mesh(
        new THREE.BoxGeometry(panelW, 0.012, 0.008),
        lightJoineryOakMat
      );
      topMould.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}.topMoulding`;
      topMould.position.set(px, py + ph * 0.5 - 0.006, fz);
      doorPivot.add(topMould);

      const botMould = new THREE.Mesh(
        new THREE.BoxGeometry(panelW, 0.012, 0.008),
        lightJoineryOakMat
      );
      botMould.name = `outbuildings.stable.groundCloakroom.door.panel.${pIdx + 1}.bottomMoulding`;
      botMould.position.set(px, py - ph * 0.5 + 0.006, fz);
      doorPivot.add(botMould);
    }
  }

  // 3 Brushed-brass butt hinges (`CylinderGeometry` knuckles) along the West hinge stile (`x = 0`)
  for (const hingeY of [0.24, 0.97, 1.68] as const) {
    const hingeKnuckle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.076, 12),
      brushedBrassMat
    );
    hingeKnuckle.name = 'outbuildings.stable.groundCloakroom.door.hinge';
    hingeKnuckle.position.set(0, hingeY, -doorT * 0.5 - 0.004);
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
    rose.position.set(handleX, handleY, fz * (doorT * 0.5 + 0.004));
    doorPivot.add(rose);

    const spindleNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.036, 14),
      brushedBrassMat
    );
    spindleNeck.rotation.x = Math.PI / 2;
    spindleNeck.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.spindle`;
    spindleNeck.position.set(handleX, handleY, fz * (doorT * 0.5 + 0.022));
    doorPivot.add(spindleNeck);

    const leverGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0075, 0.118, 14),
      brushedBrassMat
    );
    leverGrip.name = `outbuildings.stable.groundCloakroom.door.${faceTag}`;
    leverGrip.rotation.z = Math.PI / 2;
    leverGrip.position.set(handleX - 0.052, handleY, fz * (doorT * 0.5 + 0.038));
    leverGrip.castShadow = true;
    doorPivot.add(leverGrip);

    // Privacy lock escutcheon rose + thumbturn (interior South) / coin-release slot (exterior North) below handle
    const lockRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.007, 18),
      brushedBrassMat
    );
    lockRose.rotation.x = Math.PI / 2;
    lockRose.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.lockRose`;
    lockRose.position.set(handleX, handleY - 0.078, fz * (doorT * 0.5 + 0.0035));
    doorPivot.add(lockRose);

    if (fz > 0) {
      const thumbTurn = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.009, 0.016),
        brushedBrassMat
      );
      thumbTurn.name = `outbuildings.stable.groundCloakroom.door.${faceTag}.thumbTurn`;
      thumbTurn.position.set(handleX, handleY - 0.078, fz * (doorT * 0.5 + 0.012));
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
  toiletGroup.position.set(24.22, stableGroundFloorY + 0.012, vSouth - 0.32);
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
  cisternOakLedge.position.set(0, 0.912, 0.215);
  toiletGroup.add(cisternOakLedge);

  // Bevelled Vitreous China Close-Coupled Cistern Tank + Fitted Overhanging Ceramic Cistern Lid + Dual-Flush Coaxial Brass Button
  const porcelainCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.36, 0.155),
    ceramicWhiteMat
  );
  porcelainCistern.name = 'outbuildings.stable.groundCloakroom.toilet.cistern';
  porcelainCistern.position.set(0, 0.58, 0.075);
  porcelainCistern.castShadow = true;
  toiletGroup.add(porcelainCistern);

  const cisternLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.386, 0.028, 0.168),
    ceramicWhiteMat
  );
  cisternLid.name = 'outbuildings.stable.groundCloakroom.toilet.cisternLid';
  cisternLid.position.set(0, 0.772, 0.075);
  cisternLid.castShadow = true;
  toiletGroup.add(cisternLid);

  const flushCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.008, 20),
    brushedBrassMat
  );
  flushCollar.name = 'outbuildings.stable.groundCloakroom.toilet.flushCollar';
  flushCollar.userData = { lodTier: 'high', lodMaxDistance: 12 };
  flushCollar.position.set(0, 0.788, 0.075);
  toiletGroup.add(flushCollar);

  const flushInnerBtn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.011, 18),
    brushedBrassMat
  );
  flushInnerBtn.name = 'outbuildings.stable.groundCloakroom.toilet.flushButton';
  flushInnerBtn.userData = { lodTier: 'high', lodMaxDistance: 12 };
  flushInnerBtn.position.set(0, 0.790, 0.075);
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
    new THREE.CylinderGeometry(0.172, 0.138, 0.35, 28),
    ceramicWhiteMat
  );
  wcPedestal.name = 'outbuildings.stable.groundCloakroom.toilet.bowl';
  wcPedestal.position.set(0, 0.21, -0.06);
  wcPedestal.scale.set(1.02, 1.0, 1.45);
  wcPedestal.castShadow = true;
  wcPedestal.receiveShadow = true;
  toiletGroup.add(wcPedestal);

  const rearShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.39, 0.22),
    ceramicWhiteMat
  );
  rearShroud.name = 'outbuildings.stable.groundCloakroom.toilet.rearShroud';
  rearShroud.position.set(0, 0.195, 0.04);
  rearShroud.castShadow = true;
  toiletGroup.add(rearShroud);

  // Recessed inner porcelain bowl cavity + translucent water disc (`0xd4eef7`)
  const bowlWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.088, 0.14, 26),
    darkCavityMat
  );
  bowlWell.name = 'outbuildings.stable.groundCloakroom.toilet.bowlWell';
  bowlWell.position.set(0, 0.325, -0.08);
  bowlWell.scale.set(1.0, 1.0, 1.34);
  toiletGroup.add(bowlWell);

  const waterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.008, 24),
    waterBlueMat
  );
  waterDisc.name = 'outbuildings.stable.groundCloakroom.toilet.waterDisc';
  waterDisc.position.set(0, 0.28, -0.075);
  waterDisc.scale.set(1.0, 1.0, 1.28);
  toiletGroup.add(waterDisc);

  // Contoured ergonomic open-ring seat (`TorusGeometry` front + side seat rails + brass hinge pins) + contoured soft-close top lid
  const seatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.146, 0.026, 14, 32),
    ceramicWhiteMat
  );
  seatRing.name = 'outbuildings.stable.groundCloakroom.toilet.seat';
  seatRing.rotation.x = Math.PI / 2;
  seatRing.position.set(0, 0.402, -0.075);
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
    new THREE.BoxGeometry(cabD - 0.02, cabH, cabW),
    lightJoineryOakMat
  );
  vanityCarcass.name = 'outbuildings.stable.groundCloakroom.basin.cabinet';
  vanityCarcass.position.set(-0.01, 0.56, 0);
  vanityCarcass.castShadow = true;
  vanityCarcass.receiveShadow = true;
  basinGroup.add(vanityCarcass);

  // Shaker door outer stile/rail frame on East (`+x`) front face
  for (const sz of [-1, 1] as const) {
    const doorStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, cabH - 0.02, 0.055),
      lightJoineryOakMat
    );
    doorStile.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.doorStile';
    doorStile.position.set(cabD * 0.5 - 0.005, 0.56, sz * (cabW * 0.5 - 0.032));
    doorStile.castShadow = true;
    basinGroup.add(doorStile);
  }
  for (const sy of [-1, 1] as const) {
    const doorRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.055, cabW - 0.12),
      lightJoineryOakMat
    );
    doorRail.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.doorRail';
    doorRail.position.set(cabD * 0.5 - 0.005, 0.56 + sy * (cabH * 0.5 - 0.036), 0);
    doorRail.castShadow = true;
    basinGroup.add(doorRail);
  }

  const shakerDoorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.010, cabH - 0.11, cabW - 0.11),
    lightJoineryOakMat
  );
  shakerDoorPanel.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.doorPanel';
  shakerDoorPanel.position.set(cabD * 0.5 - 0.012, 0.56, 0);
  basinGroup.add(shakerDoorPanel);

  // Knurled brushed-brass cabinet pull knob + twin brass hinge knuckles
  const cabKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.010, 0.024, 16),
    brushedBrassMat
  );
  cabKnob.rotation.z = Math.PI / 2;
  cabKnob.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.knob';
  cabKnob.position.set(cabD * 0.5 + 0.014, 0.72, -cabW * 0.5 + 0.035);
  basinGroup.add(cabKnob);

  for (const hy of [0.40, 0.72] as const) {
    const cabHinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.038, 10),
      brushedBrassMat
    );
    cabHinge.name = 'outbuildings.stable.groundCloakroom.basin.cabinet.hinge';
    cabHinge.position.set(cabD * 0.5 + 0.003, hy, cabW * 0.5 - 0.006);
    basinGroup.add(cabHinge);
  }

  // Sculpted Vitreous China Basin Top with raised outer rim walls surrounding a recessed inner basin bowl (`basinWell`), overflow & brass click-clack waste
  const basinBaseSlab = new THREE.Mesh(
    new THREE.BoxGeometry(cabD + 0.02, 0.036, cabW + 0.02),
    ceramicWhiteMat
  );
  basinBaseSlab.name = 'outbuildings.stable.groundCloakroom.basin.sink';
  basinBaseSlab.position.set(0.005, 0.818, 0);
  basinBaseSlab.castShadow = true;
  basinBaseSlab.receiveShadow = true;
  basinGroup.add(basinBaseSlab);

  const rimH = 0.068;
  const rimY = 0.836 + rimH * 0.5;
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
      new THREE.BoxGeometry(cabD + 0.02, rimH, 0.042),
      ceramicWhiteMat
    );
    sideRimWall.name = 'outbuildings.stable.groundCloakroom.basin.sink.sideRim';
    sideRimWall.position.set(0.005, rimY, sz * (cabW * 0.5 - 0.011));
    sideRimWall.castShadow = true;
    basinGroup.add(sideRimWall);
  }

  // Raised rear ceramic upstand splashback lip against the West wall
  const splashbackUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.055, cabW + 0.02),
    ceramicWhiteMat
  );
  splashbackUpstand.name = 'outbuildings.stable.groundCloakroom.basin.sink.splashback';
  splashbackUpstand.position.set(-cabD * 0.5 + 0.006, 0.904 + 0.0275, 0);
  basinGroup.add(splashbackUpstand);

  // Recessed inner basin bowl well (`basinWell`) + slotted brass overflow ring + brass pop-up click-clack waste plug
  const basinWell = new THREE.Mesh(
    new THREE.BoxGeometry(cabD - 0.10, 0.012, cabW - 0.07),
    darkCavityMat
  );
  basinWell.name = 'outbuildings.stable.groundCloakroom.basin.well';
  basinWell.position.set(0.026, 0.838, 0);
  basinGroup.add(basinWell);

  const wastePlug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.021, 0.008, 18),
    brushedBrassMat
  );
  wastePlug.name = 'outbuildings.stable.groundCloakroom.basin.wastePlug';
  wastePlug.position.set(0.018, 0.844, 0);
  basinGroup.add(wastePlug);

  const overflowRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.006, 14),
    brushedBrassMat
  );
  overflowRing.rotation.z = Math.PI / 2;
  overflowRing.name = 'outbuildings.stable.groundCloakroom.basin.overflowRing';
  overflowRing.position.set(-0.060, 0.882, 0);
  basinGroup.add(overflowRing);

  // High-Arc Swan-Neck Brushed-Brass Monobloc Basin Mixer Tap (`CylinderGeometry` collar + stem + `TorusGeometry` arch spout + aerator + side pin lever)
  const tapX = -0.102;
  const tapDeckTopY = 0.904;
  const tapCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.014, 18),
    brushedBrassMat
  );
  tapCollar.name = 'outbuildings.stable.groundCloakroom.basin.tap.collar';
  tapCollar.position.set(tapX, tapDeckTopY + 0.007, 0);
  basinGroup.add(tapCollar);

  const tapStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.016, 0.115, 16),
    brushedBrassMat
  );
  tapStem.name = 'outbuildings.stable.groundCloakroom.basin.tap';
  tapStem.position.set(tapX, tapDeckTopY + 0.068, 0);
  tapStem.castShadow = true;
  basinGroup.add(tapStem);

  const swanNeckSpout = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.010, 12, 24, Math.PI),
    brushedBrassMat
  );
  swanNeckSpout.name = 'outbuildings.stable.groundCloakroom.basin.tap.spout';
  swanNeckSpout.position.set(tapX + 0.052, tapDeckTopY + 0.125, 0);
  swanNeckSpout.castShadow = true;
  basinGroup.add(swanNeckSpout);

  const aeratorNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.010, 0.018, 14),
    brushedBrassMat
  );
  aeratorNozzle.name = 'outbuildings.stable.groundCloakroom.basin.tap.aerator';
  aeratorNozzle.position.set(tapX + 0.104, tapDeckTopY + 0.118, 0);
  basinGroup.add(aeratorNozzle);

  const pinLever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.065, 10),
    brushedBrassMat
  );
  pinLever.rotation.x = Math.PI * 0.25;
  pinLever.name = 'outbuildings.stable.groundCloakroom.basin.tap.lever';
  pinLever.position.set(tapX, tapDeckTopY + 0.068, 0.032);
  basinGroup.add(pinLever);

  // Ceramic Pump Soap Dispenser on the North corner of the basin deck + Folded Waffle Hand Towel on a Brushed-Brass Towel Ring
  const soapBottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.032, 0.105, 18),
    new THREE.MeshStandardMaterial({ color: 0x3b4d3e, roughness: 0.28, metalness: 0.08 })
  );
  soapBottle.name = 'outbuildings.stable.groundCloakroom.basin.soapDispenser';
  soapBottle.position.set(-0.095, tapDeckTopY + 0.052, -0.175);
  soapBottle.castShadow = true;
  basinGroup.add(soapBottle);

  const soapPumpHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.010, 0.028, 12),
    brushedBrassMat
  );
  soapPumpHead.name = 'outbuildings.stable.groundCloakroom.basin.soapDispenser.pump';
  soapPumpHead.userData = { lodTier: 'high', lodMaxDistance: 12 };
  soapPumpHead.position.set(-0.095, tapDeckTopY + 0.116, -0.175);
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
  handTowel.position.set(-0.125, 0.76, 0.34);
  handTowel.castShadow = true;
  basinGroup.add(handTowel);

  // Illuminated Circular Bevelled Brushed-Brass Vanity Mirror (`mirrorFrame` + `mirrorGlass` + warm backlit LED halo ring)
  const mirrorHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.268, 0.008, 12, 36),
    new THREE.MeshStandardMaterial({
      color: 0xfff5e0,
      emissive: new THREE.Color(0xffd28a),
      emissiveIntensity: 1.85,
      roughness: 0.2,
    })
  );
  mirrorHalo.rotation.y = Math.PI / 2;
  mirrorHalo.name = 'outbuildings.stable.groundCloakroom.basin.mirrorHalo';
  mirrorHalo.position.set(-0.152, 1.38, 0);
  basinGroup.add(mirrorHalo);

  const mirrorFrame = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.26, 0.022, 32),
    brushedBrassMat
  );
  mirrorFrame.name = 'outbuildings.stable.groundCloakroom.basin.mirrorFrame';
  mirrorFrame.rotation.z = Math.PI / 2;
  mirrorFrame.position.set(-0.145, 1.38, 0);
  mirrorFrame.castShadow = true;
  basinGroup.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.242, 0.242, 0.025, 32),
    new THREE.MeshStandardMaterial({ color: 0xdce8f2, roughness: 0.04, metalness: 0.94 })
  );
  mirrorGlass.name = 'outbuildings.stable.groundCloakroom.basin.mirrorGlass';
  mirrorGlass.rotation.z = Math.PI / 2;
  mirrorGlass.position.set(-0.143, 1.38, 0);
  basinGroup.add(mirrorGlass);

  const cloakLight = new THREE.PointLight(0xffd488, 1.4, 3.6, 1.6);
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

export function buildStableBalconyOutdoorFurniture(
  balconyGroup: THREE.Group,
  stableUpperFloorY: number,
  balStartU: number,
  balEndU: number
): void {
  const furnGroup = new THREE.Group();
  furnGroup.name = 'outbuildings.firstFloor.stableEastBalcony.furnitureSet';
  furnGroup.userData.zone = 'sitting';
  balconyGroup.add(furnGroup);

  const midU = (balStartU + balEndU) * 0.5; // 30.45m on the restored 2.80m-deep balcony (`u = 29.05..31.85m`)
  const deckY = stableUpperFloorY;

  const weatheredTeakMat = new THREE.MeshStandardMaterial({
    color: 0x9e7b56,
    roughness: 0.64,
    metalness: 0.03,
  });
  const oliveBarkMat = new THREE.MeshStandardMaterial({
    color: 0x5c4d3d,
    roughness: 0.86,
    metalness: 0.01,
  });
  const wovenRopeMat = new THREE.MeshStandardMaterial({
    color: 0x7b7267,
    roughness: 0.86,
    metalness: 0.02,
  });
  const sunbrellaOatmealMat = new THREE.MeshStandardMaterial({
    color: 0xebe5da,
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

  // 1. Flatweave Outdoor Patio Rug (`1.72m x 2.18m` centered at `u = midU, v = 2.45m` — clear of SE spiral staircase!)
  const patioRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.008, 2.18),
    outdoorRugMat
  );
  patioRug.name = 'outbuildings.firstFloor.stableEastBalcony.outdoorRug';
  patioRug.position.set(midU, deckY + 0.004, 2.45);
  patioRug.receiveShadow = true;
  furnGroup.add(patioRug);

  // 2. 2-Seater Weathered-Teak & Woven-Rope Outdoor Sofa (`v = 1.50m`, `rotation.y = Math.PI` facing South `+v`)
  const sofaGroup = new THREE.Group();
  sofaGroup.name = 'outbuildings.firstFloor.stableEastBalcony.sofa';
  sofaGroup.position.set(midU, deckY, 1.50);
  sofaGroup.rotation.y = Math.PI;
  furnGroup.add(sofaGroup);

  const sofaW = 1.44; // along u
  const sofaD = 0.74; // along v
  const sofaBase = new THREE.Mesh(
    new THREE.BoxGeometry(sofaW, 0.055, sofaD),
    weatheredTeakMat
  );
  sofaBase.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.base';
  sofaBase.position.set(0, 0.24, 0);
  sofaBase.castShadow = true;
  sofaGroup.add(sofaBase);

  for (const [lx, lz] of [
    [-sofaW * 0.5 + 0.06, -sofaD * 0.5 + 0.06],
    [sofaW * 0.5 - 0.06, -sofaD * 0.5 + 0.06],
    [-sofaW * 0.5 + 0.06, sofaD * 0.5 - 0.06],
    [sofaW * 0.5 - 0.06, sofaD * 0.5 - 0.06],
  ] as const) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.016, 0.22, 10),
      weatheredTeakMat
    );
    leg.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.leg';
    leg.position.set(lx, 0.11, lz);
    leg.castShadow = true;
    sofaGroup.add(leg);
  }

  const sofaBack = new THREE.Mesh(
    new THREE.BoxGeometry(sofaW, 0.44, 0.055),
    wovenRopeMat
  );
  sofaBack.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.backrest';
  sofaBack.position.set(0, 0.48, sofaD * 0.5 - 0.03);
  sofaBack.castShadow = true;
  sofaGroup.add(sofaBack);

  for (const sideX of [-1, 1] as const) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.34, sofaD - 0.04),
      wovenRopeMat
    );
    arm.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.armrest';
    arm.position.set(sideX * (sofaW * 0.5 - 0.03), 0.43, 0);
    arm.castShadow = true;
    sofaGroup.add(arm);

    const teakArmCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.024, sofaD - 0.02),
      weatheredTeakMat
    );
    teakArmCap.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.armCap';
    teakArmCap.position.set(sideX * (sofaW * 0.5 - 0.03), 0.605, 0);
    sofaGroup.add(teakArmCap);
  }

  for (const sideX of [-0.33, 0.33] as const) {
    const seatCush = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.13, sofaD - 0.10),
      sunbrellaOatmealMat
    );
    seatCush.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.seatCushion';
    seatCush.position.set(sideX, 0.33, -0.02);
    seatCush.castShadow = true;
    sofaGroup.add(seatCush);

    const backCush = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.34, 0.14),
      sunbrellaOatmealMat
    );
    backCush.rotation.x = -0.18;
    backCush.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.backCushion';
    backCush.position.set(sideX, 0.54, sofaD * 0.5 - 0.13);
    backCush.castShadow = true;
    sofaGroup.add(backCush);
  }

  for (const [px, pMat] of [
    [-0.50, terracottaPillowMat],
    [0.50, sagePillowMat],
  ] as const) {
    const throwPillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.26, 0.10),
      pMat
    );
    throwPillow.rotation.y = px < 0 ? 0.35 : -0.35;
    throwPillow.name = 'outbuildings.firstFloor.stableEastBalcony.sofa.throwPillow';
    throwPillow.position.set(px, 0.52, 0.08);
    throwPillow.castShadow = true;
    sofaGroup.add(throwPillow);
  }

  // 3. 2 Matching Weathered-Teak & Woven-Rope Outdoor Lounge Armchairs (`v = 3.32m`, facing North `-v` toward coffee table)
  for (const [cIdx, cu, cv, rotY] of [
    [1, midU - 0.48, 3.32, 0.34],
    [2, midU + 0.48, 3.32, -0.34],
  ] as const) {
    const chairGrp = new THREE.Group();
    chairGrp.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}`;
    chairGrp.position.set(cu, deckY, cv);
    chairGrp.rotation.y = rotY;
    furnGroup.add(chairGrp);

    const cW = 0.68;
    const cD = 0.68;
    const cBase = new THREE.Mesh(
      new THREE.BoxGeometry(cW, 0.05, cD),
      weatheredTeakMat
    );
    cBase.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.base`;
    cBase.position.set(0, 0.24, 0);
    cBase.castShadow = true;
    chairGrp.add(cBase);

    for (const [lx, lz] of [
      [-cW * 0.5 + 0.05, -cD * 0.5 + 0.05],
      [cW * 0.5 - 0.05, -cD * 0.5 + 0.05],
      [-cW * 0.5 + 0.05, cD * 0.5 - 0.05],
      [cW * 0.5 - 0.05, cD * 0.5 - 0.05],
    ] as const) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.020, 0.015, 0.22, 10),
        weatheredTeakMat
      );
      leg.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.leg`;
      leg.position.set(lx, 0.11, lz);
      chairGrp.add(leg);
    }

    const cBack = new THREE.Mesh(
      new THREE.BoxGeometry(cW, 0.42, 0.05),
      wovenRopeMat
    );
    cBack.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.backrest`;
    cBack.position.set(0, 0.47, cD * 0.5 - 0.03);
    cBack.castShadow = true;
    chairGrp.add(cBack);

    for (const sx of [-1, 1] as const) {
      const cArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.32, cD - 0.04),
        wovenRopeMat
      );
      cArm.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.armrest`;
      cArm.position.set(sx * (cW * 0.5 - 0.028), 0.42, 0);
      cArm.castShadow = true;
      chairGrp.add(cArm);
    }

    const cSeat = new THREE.Mesh(
      new THREE.BoxGeometry(cW - 0.11, 0.12, cD - 0.10),
      sunbrellaOatmealMat
    );
    cSeat.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.seatCushion`;
    cSeat.position.set(0, 0.325, -0.02);
    cSeat.castShadow = true;
    chairGrp.add(cSeat);

    const cBackCush = new THREE.Mesh(
      new THREE.BoxGeometry(cW - 0.13, 0.32, 0.13),
      sunbrellaOatmealMat
    );
    cBackCush.rotation.x = -0.18;
    cBackCush.name = `outbuildings.firstFloor.stableEastBalcony.armchair.${cIdx}.backCushion`;
    cBackCush.position.set(0, 0.52, cD * 0.5 - 0.12);
    cBackCush.castShadow = true;
    chairGrp.add(cBackCush);
  }

  // 4. Slatted Solid-Teak Outdoor Coffee Table (`u = midU, v = 2.42m`) with Hurricane Candle Lantern & Tray
  const tableGrp = new THREE.Group();
  tableGrp.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable';
  tableGrp.position.set(midU, deckY, 2.42);
  furnGroup.add(tableGrp);

  const tW = 0.88;
  const tD = 0.54;
  const tH = 0.39;
  const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(tW, 0.032, tD),
    weatheredTeakMat
  );
  tableTop.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.top';
  tableTop.position.set(0, tH, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGrp.add(tableTop);

  for (const [lx, lz] of [
    [-tW * 0.5 + 0.05, -tD * 0.5 + 0.05],
    [tW * 0.5 - 0.05, -tD * 0.5 + 0.05],
    [-tW * 0.5 + 0.05, tD * 0.5 - 0.05],
    [tW * 0.5 - 0.05, tD * 0.5 - 0.05],
  ] as const) {
    const tLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.015, tH - 0.016, 10),
      weatheredTeakMat
    );
    tLeg.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.leg';
    tLeg.position.set(lx, (tH - 0.016) * 0.5, lz);
    tLeg.castShadow = true;
    tableGrp.add(tLeg);
  }

  const lanternGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xeaf4f8, transparent: true, opacity: 0.42, roughness: 0.08 })
  );
  lanternGlass.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.lanternGlass';
  lanternGlass.position.set(-0.14, tH + 0.126, 0);
  tableGrp.add(lanternGlass);

  const pillarCandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.13, 14),
    new THREE.MeshStandardMaterial({
      color: 0xfff8e8,
      emissive: new THREE.Color(0xffbe66),
      emissiveIntensity: 1.2,
      roughness: 0.4,
    })
  );
  pillarCandle.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.candle';
  pillarCandle.userData = { lodTier: 'high', lodMaxDistance: 12 };
  pillarCandle.position.set(-0.14, tH + 0.08, 0);
  tableGrp.add(pillarCandle);

  const ceramicTray = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.13, 0.022, 20),
    terracottaPillowMat
  );
  ceramicTray.name = 'outbuildings.firstFloor.stableEastBalcony.coffeeTable.ceramicTray';
  ceramicTray.userData = { lodTier: 'high', lodMaxDistance: 12 };
  ceramicTray.position.set(0.16, tH + 0.027, 0.02);
  tableGrp.add(ceramicTray);

  // 5. Issue #6 ("Better plant meshes" at `[9.155, 2.996, 14.715]`, `outbuildings.firstFloor.stableEastBalcony.planter.2`):
  //    High-LOD Sculpted Mediterranean Olive Trees (`Olea europaea`) & Underplanted Lavender/Rosemary in
  //    Turned Ribbed Terracotta Amphora Planters (`LatheGeometry` pot + `TubeGeometry` gnarled branching trunks +
  //    84 sculpted 3D curved lanceolate olive leaf blades & ripening olive drupes per planter — zero DodecahedronGeometry!)
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
    [1, midU - 0.95, 0.55, 0.25],
    [2, midU - 0.95, 5.15, 1.85],
  ] as const) {
    const potGrp = new THREE.Group();
    potGrp.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}`;
    potGrp.position.set(pu, deckY, pv);
    potGrp.rotation.y = seedRot;
    furnGroup.add(potGrp);

    // Turned terracotta planter pot with rim collar & horizontal ribs
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

    // Organic dark potting soil bed & decorative river pebbles
    const soilBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.182, 0.176, 0.024, 20),
      pottingSoilMat
    );
    soilBed.name = `outbuildings.firstFloor.stableEastBalcony.planter.${pIdx}.soil`;
    soilBed.position.set(0, 0.355, 0);
    potGrp.add(soilBed);

    // Gnarled, curved woody Olive Tree trunk & 5 branching boughs built with `TubeGeometry` along `CatmullRomCurve3`
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

      // Radiating whorls of sculpted lanceolate 3D olive leaves along each bough & crown tip
      const numLeafWhorls = 16;
      for (let w = 0; w < numLeafWhorls; w++) {
        const frac = 0.22 + (w / (numLeafWhorls - 1)) * 0.78;
        const pt = bCurve.getPoint(frac);
        const yaw = w * 2.39996 + bIdx * 1.25; // Golden-angle spiral phyllotaxis!
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

    // Underplanted aromatic rosemary & lavender sprigs around the rim of the terracotta pot (`y = 0.36..0.48m`)
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
