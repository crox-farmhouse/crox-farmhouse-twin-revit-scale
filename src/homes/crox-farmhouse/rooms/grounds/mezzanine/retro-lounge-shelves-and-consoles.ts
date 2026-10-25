import * as THREE from 'three';
import {
  applyOakJoineryUVs,
  createPlayStationButtonCapTexture,
  createRetro90sPosterTexture,
  createSkateboardDeckGeometry,
  createSkateboardDeckTexture,
  type PlayStationButtonSymbol,
  type RetroPosterStyle,
  type SkateboardGraphicStyle,
} from './mezzanine-shared-textures.ts';
import type { RetroLoungeMaterialsKit } from './retro-lounge-furniture-and-tv.ts';

export function buildBarnMezzanineRetroShelvesAndConsoles(
  loungeGroup: THREE.Group,
  mezzanineFloorY: number,
  kit: RetroLoungeMaterialsKit
): void {
  const {
    sbTopY,
    teakMat,
    darkTeakMat,
    trinitronCharcoalMat,
    trinitronDarkGrilleMat,
    ps1GreyMat,
    ps1DarkGreyMat,
    cordBlackMat,
  } = kit;

  // =========================================================================
  // 4. 1990s HI-FI STEREO VHS VCR DECK & VHS CASSETTE CASES (`outbuildings.mezzanine.vcrPlayer`)
  // =========================================================================
  const vcrGroup = new THREE.Group();
  vcrGroup.name = 'outbuildings.mezzanine.vcrPlayer';
  vcrGroup.position.set(19.17, mezzanineFloorY + sbTopY + 0.009, 1.82);
  loungeGroup.add(vcrGroup);

  const vcrBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.30, 0.088, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x1a1c20,
      roughness: 0.38,
      metalness: 0.32,
    })
  );
  vcrBody.name = 'outbuildings.mezzanine.vcrPlayer.chassis';
  vcrBody.position.set(0, 0.044, 0);
  vcrBody.castShadow = true;
  vcrGroup.add(vcrBody);

  // VCR front cassette loading slot door & glowing VFD clock display (`+x` face)
  const vcrTapeSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.032, 0.195),
    trinitronDarkGrilleMat
  );
  vcrTapeSlot.name = 'outbuildings.mezzanine.vcrPlayer.tapeSlot';
  vcrTapeSlot.position.set(0.158, 0.058, 0.06);
  vcrGroup.add(vcrTapeSlot);

  const vcrDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.022, 0.11),
    new THREE.MeshStandardMaterial({
      color: 0x102820,
      emissive: 0x28d888,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  vcrDisplay.name = 'outbuildings.mezzanine.vcrPlayer.display';
  vcrDisplay.position.set(0.158, 0.056, -0.11);
  vcrGroup.add(vcrDisplay);

  // 2 VHS Cassettes + TV Remote stacked on top of the VCR
  for (let t = 0; t < 2; t++) {
    const tapeItem = new THREE.Group();
    tapeItem.position.set(0.01, 0.092 + t * 0.03 + 0.0125, 0.04);
    tapeItem.rotation.y = t * 0.12 - 0.04;
    vcrGroup.add(tapeItem);

    const vhsTape = new THREE.Mesh(
      new THREE.BoxGeometry(0.104, 0.025, 0.188),
      cordBlackMat
    );
    vhsTape.name = `outbuildings.mezzanine.vcrPlayer.vhsTape.${t + 1}`;
    vhsTape.userData = { lodTier: 'high', lodMaxDistance: 12 };
    vhsTape.castShadow = true;
    tapeItem.add(vhsTape);

    const spineLabel = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.018, 0.14),
      new THREE.MeshStandardMaterial({
        color: t === 0 ? 0xf2e8d5 : 0xe04838,
        roughness: 0.6,
      })
    );
    spineLabel.name = `outbuildings.mezzanine.vcrPlayer.vhsTape.${t + 1}.label`;
    spineLabel.userData = { lodTier: 'high', lodMaxDistance: 12 };
    spineLabel.position.set(0.058, 0, 0);
    tapeItem.add(spineLabel);
  }

  // Clamshell VHS Case (*The Lion King* 1994 VHS) on the south/left end of the sideboard (`v = 2.94m`)
  const vhsCaseGroup = new THREE.Group();
  vhsCaseGroup.name = 'outbuildings.mezzanine.vhsCaseStack';
  vhsCaseGroup.position.set(19.20, mezzanineFloorY + sbTopY + 0.009, 2.94);
  vhsCaseGroup.rotation.y = 0.28;
  loungeGroup.add(vhsCaseGroup);

  for (let c = 0; c < 2; c++) {
    const clamshell = new THREE.Mesh(
      new THREE.BoxGeometry(0.138, 0.028, 0.225),
      new THREE.MeshStandardMaterial({
        color: c === 0 ? 0xf5f0e6 : 0x264b82,
        roughness: 0.35,
      })
    );
    clamshell.name = `outbuildings.mezzanine.vhsCaseStack.case.${c + 1}`;
    clamshell.userData = { lodTier: 'high', lodMaxDistance: 12 };
    clamshell.position.set(c * 0.02, c * 0.033 + 0.014, 0);
    clamshell.rotation.y = c * -0.18;
    clamshell.castShadow = true;
    vhsCaseGroup.add(clamshell);
  }

  // =========================================================================
  // 5. ORIGINAL 1995 SONY PLAYSTATION 1 (`PS1` `SCPH-1002`), 2 CONTROLLERS,
  //    TANGLED 3D CABLES & SCATTERED CD JEWEL CASES ON THE RUG
  // =========================================================================
  const ps1Group = new THREE.Group();
  ps1Group.name = 'outbuildings.mezzanine.playstation1';
  ps1Group.position.set(19.64, mezzanineFloorY + 0.02, 2.46);
  ps1Group.rotation.y = 0.24;
  loungeGroup.add(ps1Group);

  // PS1 Console Deck (`0.19m` deep along X x `0.052m` high x `0.27m` wide along Z)
  const ps1Deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.052, 0.27),
    ps1GreyMat
  );
  ps1Deck.name = 'outbuildings.mezzanine.playstation1.console';
  ps1Deck.position.set(0, 0.026, 0);
  ps1Deck.castShadow = true;
  ps1Deck.receiveShadow = true;
  ps1Group.add(ps1Deck);

  // Circular CD-ROM Lid on top center (`r = 0.076m`)
  const ps1CdLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.076, 0.076, 0.006, 28),
    ps1DarkGreyMat
  );
  ps1CdLid.name = 'outbuildings.mezzanine.playstation1.cdLid';
  ps1CdLid.position.set(0, 0.059, 0);
  ps1Group.add(ps1CdLid);

  // PlayStation Diamond Logo badge on CD lid
  const psLogo = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.003, 0.018),
    new THREE.MeshStandardMaterial({ color: 0xe03228, roughness: 0.3 })
  );
  psLogo.name = 'outbuildings.mezzanine.playstation1.logo';
  psLogo.userData = { lodTier: 'high', lodMaxDistance: 12 };
  psLogo.position.set(0.048, 0.0675, 0);
  psLogo.rotation.y = Math.PI / 4;
  ps1Group.add(psLogo);

  // Circular POWER, RESET & OPEN buttons flanking the CD lid
  for (const [bz, br] of [
    [0.102, 0.018],  // POWER button (left/south)
    [0.072, 0.009],  // RESET button
    [-0.102, 0.018], // OPEN button (right/north)
  ] as const) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(br, br, 0.006, 18),
      ps1DarkGreyMat
    );
    btn.name = 'outbuildings.mezzanine.playstation1.deckButton';
    btn.userData = { lodTier: 'high', lodMaxDistance: 12 };
    btn.position.set(0.042, 0.059, bz);
    ps1Group.add(btn);
  }

  // Front Controller Plugs & Memory Card in Slot 1 (`+x` front face of PS1)
  for (const portZ of [-0.055, 0.055] as const) {
    const ctrlPlug = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.016, 0.042),
      trinitronDarkGrilleMat
    );
    ctrlPlug.name = 'outbuildings.mezzanine.playstation1.controllerPlug';
    ctrlPlug.userData = { lodTier: 'high', lodMaxDistance: 12 };
    ctrlPlug.position.set(0.111, 0.022, portZ);
    ps1Group.add(ctrlPlug);
  }
  const memoryCard = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.007, 0.038),
    ps1GreyMat
  );
  memoryCard.name = 'outbuildings.mezzanine.playstation1.memoryCard';
  memoryCard.userData = { lodTier: 'high', lodMaxDistance: 12 };
  memoryCard.position.set(0.108, 0.04, 0.055);
  ps1Group.add(memoryCard);

  // Issue #2 ("These dualshock controllers still look terrible." at `[-2.458, 1.574, 17.054]`, `outbuildings.mezzanine.playstation1.controller.2`):
  // High-LOD Sony PlayStation 1 DualShock Controller (`SCPH-1200`) with:
  // - Slim recessed central bridge (`0.032m x 0.017m x 0.056m`) so the two circular face pods (`r = 0.028m` at `z = ±0.044m`)
  //   and the two lower circular Analog Stick turrets (`r = 0.018m` at `x = +0.018m, z = ±0.022m`) form the unmistakable DualShock figure-8 waist silhouette
  // - Smooth 3D curved ergonomic DualShock hand-grips (`CatmullRomCurve3` + `TubeGeometry` with tapered palm tips)
  // - Dark charcoal action buttons (`#23272e`) with printed PlayStation symbol caps (`△` green, `○` red, `✕` blue, `□` pink)
  // - Concave/domed dark rubber analog thumbsticks inside recessed turret wells, segmented 4-way D-pad wedges,
  //   `SELECT` / `START` / `ANALOG` center buttons, glowing red Analog mode LED, and stacked L1/L2 & R1/R2 shoulder triggers!
  const dualShockStickMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e35,
    roughness: 0.76,
    metalness: 0.06,
  });
  const dualShockWellMat = new THREE.MeshStandardMaterial({
    color: 0x5c6068,
    roughness: 0.58,
    metalness: 0.08,
  });
  const dualShockBtnBodyMat = new THREE.MeshStandardMaterial({
    color: 0x23272e,
    roughness: 0.32,
    metalness: 0.12,
  });
  const analogLedMat = new THREE.MeshStandardMaterial({
    color: 0xff2211,
    emissive: new THREE.Color(0xff1808),
    emissiveIntensity: 1.8,
    roughness: 0.22,
  });
  const psBtnCapMaterials: Record<PlayStationButtonSymbol, THREE.MeshStandardMaterial> = {
    triangle: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('triangle'),
      roughness: 0.26,
      metalness: 0.08,
    }),
    circle: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('circle'),
      roughness: 0.26,
      metalness: 0.08,
    }),
    cross: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('cross'),
      roughness: 0.26,
      metalness: 0.08,
    }),
    square: new THREE.MeshStandardMaterial({
      map: createPlayStationButtonCapTexture('square'),
      roughness: 0.26,
      metalness: 0.08,
    }),
  };

  const addPs1Controller = (
    cx: number,
    cz: number,
    rotY: number,
    idx: number
  ): void => {
    const ctrlGroup = new THREE.Group();
    ctrlGroup.name = `outbuildings.mezzanine.playstation1.controller.${idx}`;
    ctrlGroup.position.set(cx, mezzanineFloorY + 0.02, cz);
    ctrlGroup.rotation.y = rotY;
    loungeGroup.add(ctrlGroup);

    // 1. Slim recessed central bridge (`0.032m` deep along X x `0.017m` high x `0.056m` wide along Z)
    //    Keeps the front and rear waist indented so the 2 main circular pods and 2 analog turrets stand out clearly!
    const mainBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.017, 0.056),
      ps1GreyMat
    );
    mainBridge.name = `outbuildings.mezzanine.playstation1.controller.${idx}.bridge`;
    mainBridge.position.set(-0.004, 0.0105, 0);
    mainBridge.castShadow = true;
    mainBridge.receiveShadow = true;
    ctrlGroup.add(mainBridge);

    // Front cord strain-relief boot on the leading edge of the bridge (`x = -0.023m, z = 0`)
    const cordRelief = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0038, 0.0052, 0.012, 10),
      cordBlackMat
    );
    cordRelief.rotation.z = Math.PI / 2;
    cordRelief.name = `outbuildings.mezzanine.playstation1.controller.${idx}.cordRelief`;
    cordRelief.userData = { lodTier: 'high', lodMaxDistance: 12 };
    cordRelief.position.set(-0.024, 0.010, 0);
    ctrlGroup.add(cordRelief);

    // 2. Left D-Pad Pod (`sideZ = +1`) & Right Action-Button Pod (`sideZ = -1`), Analog Turrets, Shoulder Triggers & Curved Hand-Grips
    for (const sideZ of [-1, 1] as const) {
      // Main circular face pod (`rTop = 0.0265m, rBot = 0.0285m, h = 0.021m`)
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0265, 0.0285, 0.021, 28),
        ps1GreyMat
      );
      pod.name = `outbuildings.mezzanine.playstation1.controller.${idx}.pod`;
      pod.position.set(-0.005, 0.0115, sideZ * 0.044);
      pod.castShadow = true;
      pod.receiveShadow = true;
      ctrlGroup.add(pod);

      // Subtle bevelled top rim on each circular pod
      const podTopBevel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0245, 0.0265, 0.0025, 28),
        ps1GreyMat
      );
      podTopBevel.name = `outbuildings.mezzanine.playstation1.controller.${idx}.podBevel`;
      podTopBevel.userData = { lodTier: 'high', lodMaxDistance: 12 };
      podTopBevel.position.set(-0.005, 0.0228, sideZ * 0.044);
      ctrlGroup.add(podTopBevel);

      // Sculpted L1/L2 & R1/R2 front shoulder cowl & stacked dark-charcoal triggers
      const shoulderBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.014, 0.018, 16),
        ps1GreyMat
      );
      shoulderBoss.scale.set(1.0, 1.0, 1.35);
      shoulderBoss.name = `outbuildings.mezzanine.playstation1.controller.${idx}.shoulderBoss`;
      shoulderBoss.userData = { lodTier: 'high', lodMaxDistance: 12 };
      shoulderBoss.position.set(-0.027, 0.011, sideZ * 0.044);
      ctrlGroup.add(shoulderBoss);

      // Top L1/R1 trigger + lower L2/R2 trigger
      for (const [ty, tx, th] of [
        [0.0175, -0.0485, 0.0055],
        [0.0065, -0.0495, 0.0065],
      ] as const) {
        const triggerBtn = new THREE.Mesh(
          new THREE.BoxGeometry(0.007, th, 0.021),
          dualShockBtnBodyMat
        );
        triggerBtn.name = `outbuildings.mezzanine.playstation1.controller.${idx}.shoulderTrigger`;
        triggerBtn.userData = { lodTier: 'high', lodMaxDistance: 12 };
        triggerBtn.position.set(tx, ty, sideZ * 0.044);
        ctrlGroup.add(triggerBtn);
      }

      // Lower Circular Analog Stick Turret Pod (`x = +0.018m, z = sideZ * 0.022m`)
      const stickTurret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0165, 0.0185, 0.019, 24),
        ps1GreyMat
      );
      stickTurret.name = `outbuildings.mezzanine.playstation1.controller.${idx}.stickTurret`;
      stickTurret.userData = { lodTier: 'high', lodMaxDistance: 12 };
      stickTurret.position.set(0.018, 0.0105, sideZ * 0.022);
      stickTurret.castShadow = true;
      stickTurret.receiveShadow = true;
      ctrlGroup.add(stickTurret);

      // Recessed dark circular socket well on top of the analog turret
      const stickWell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0125, 0.0115, 0.0025, 20),
        dualShockWellMat
      );
      stickWell.name = `outbuildings.mezzanine.playstation1.controller.${idx}.stickWell`;
      stickWell.userData = { lodTier: 'high', lodMaxDistance: 12 };
      stickWell.position.set(0.018, 0.0255, sideZ * 0.022);
      ctrlGroup.add(stickWell);

      // Pivoting inner ball-dome base + slender thumbstick shaft + domed rubber mushroom cap
      const stickPivotDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.0085, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
        dualShockStickMat
      );
      stickPivotDome.name = `outbuildings.mezzanine.playstation1.controller.${idx}.stickPivot`;
      stickPivotDome.userData = { lodTier: 'high', lodMaxDistance: 12 };
      stickPivotDome.position.set(0.018, 0.019, sideZ * 0.022);
      ctrlGroup.add(stickPivotDome);

      const stickShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0036, 0.0085, 12),
        dualShockStickMat
      );
      stickShaft.name = `outbuildings.mezzanine.playstation1.controller.${idx}.stickShaft`;
      stickShaft.userData = { lodTier: 'high', lodMaxDistance: 12 };
      stickShaft.position.set(0.018, 0.0255, sideZ * 0.022);
      ctrlGroup.add(stickShaft);

      const stickCapSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0108, 0.0082, 0.0038, 22),
        dualShockStickMat
      );
      stickCapSkirt.name = `outbuildings.mezzanine.playstation1.controller.${idx}.stickCapSkirt`;
      stickCapSkirt.userData = { lodTier: 'high', lodMaxDistance: 12 };
      stickCapSkirt.position.set(0.018, 0.0305, sideZ * 0.022);
      stickCapSkirt.castShadow = true;
      ctrlGroup.add(stickCapSkirt);

      const stickDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.0106, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        dualShockStickMat
      );
      stickDome.scale.set(1, 0.36, 1);
      stickDome.name = `outbuildings.mezzanine.playstation1.controller.${idx}.stickDome`;
      stickDome.userData = { lodTier: 'high', lodMaxDistance: 12 };
      stickDome.position.set(0.018, 0.0318, sideZ * 0.022);
      ctrlGroup.add(stickDome);

      // Sculpted Curved Ergonomic DualShock Hand-Grip Horn (`CatmullRomCurve3` + `TubeGeometry` + rounded palm dome)
      const gripCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.002, 0.011, sideZ * 0.045),
        new THREE.Vector3(0.018, 0.0105, sideZ * 0.055),
        new THREE.Vector3(0.038, 0.0095, sideZ * 0.062),
        new THREE.Vector3(0.056, 0.0085, sideZ * 0.064),
      ]);
      const gripTubeGeo = new THREE.TubeGeometry(gripCurve, 18, 0.0155, 16, false);
      // Taper the grip slightly from the pod shoulder down to the rounded palm tip
      const gPos = gripTubeGeo.attributes.position;
      for (let vi = 0; vi < gPos.count; vi++) {
        const vx = gPos.getX(vi);
        const vy = gPos.getY(vi);
        // Flatten vertical profile slightly for authentic oval DualShock grip cross-section
        const cy = 0.0098;
        gPos.setY(vi, cy + (vy - cy) * 0.72);
        if (vx > 0.035) {
          const taper = 1 - ((vx - 0.035) / 0.025) * 0.14;
          gPos.setZ(vi, sideZ * 0.063 + (gPos.getZ(vi) - sideZ * 0.063) * taper);
        }
      }
      gripTubeGeo.computeVertexNormals();

      const gripHorn = new THREE.Mesh(gripTubeGeo, ps1GreyMat);
      gripHorn.name = `outbuildings.mezzanine.playstation1.controller.${idx}.gripHorn`;
      gripHorn.castShadow = true;
      gripHorn.receiveShadow = true;
      ctrlGroup.add(gripHorn);

      const gripTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.0138, 16, 12),
        ps1GreyMat
      );
      gripTip.scale.set(1.12, 0.72, 0.96);
      gripTip.name = `outbuildings.mezzanine.playstation1.controller.${idx}.gripTip`;
      gripTip.userData = { lodTier: 'high', lodMaxDistance: 12 };
      gripTip.position.set(0.056, 0.0085, sideZ * 0.064);
      gripTip.castShadow = true;
      ctrlGroup.add(gripTip);
    }

    // 3. Left Pod (`z = +0.044m`): Recessed Cross Cavity & 4-Way Segmented Sony D-Pad Wedges
    const dpadRecess = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0155, 0.0155, 0.0012, 24),
      ps1DarkGreyMat
    );
    dpadRecess.name = `outbuildings.mezzanine.playstation1.controller.${idx}.dpadRecess`;
    dpadRecess.userData = { lodTier: 'high', lodMaxDistance: 12 };
    dpadRecess.position.set(-0.005, 0.0285, 0.044);
    ctrlGroup.add(dpadRecess);

    for (const [dx, dz, rotAngle] of [
      [-0.0095, 0, 0],           // Up
      [0.0095, 0, Math.PI],      // Down
      [0, 0.0095, -Math.PI / 2], // Left
      [0, -0.0095, Math.PI / 2], // Right
    ] as const) {
      const dKeyGroup = new THREE.Group();
      dKeyGroup.name = `outbuildings.mezzanine.playstation1.controller.${idx}.dpadKey`;
      dKeyGroup.position.set(-0.005 + dx, 0.0345, 0.044 + dz);
      dKeyGroup.rotation.y = rotAngle;
      ctrlGroup.add(dKeyGroup);

      const dOuter = new THREE.Mesh(
        new THREE.BoxGeometry(0.0078, 0.0032, 0.0068),
        dualShockBtnBodyMat
      );
      dOuter.name = `outbuildings.mezzanine.playstation1.controller.${idx}.dpadKey.outer`;
      dOuter.userData = { lodTier: 'high', lodMaxDistance: 12 };
      dKeyGroup.add(dOuter);

      const dInnerTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.0046, 0.0045, 4),
        dualShockBtnBodyMat
      );
      dInnerTip.rotation.z = -Math.PI / 2;
      dInnerTip.rotation.x = Math.PI / 4;
      dInnerTip.name = `outbuildings.mezzanine.playstation1.controller.${idx}.dpadKey.tip`;
      dInnerTip.userData = { lodTier: 'high', lodMaxDistance: 12 };
      dInnerTip.position.set(0.0048, 0, 0);
      dKeyGroup.add(dInnerTip);
    }

    // 4. Right Pod (`z = -0.044m`): 4 Dark-Charcoal Action Buttons with Printed `△ ○ ✕ □` Caps
    const actionBtnSpecs: ReadonlyArray< readonly [number, number, PlayStationButtonSymbol] > = [
      [-0.0175, -0.044, 'triangle'], // Top: Green Triangle
      [-0.005, -0.0565, 'circle'],   // Right: Red Circle
      [0.0075, -0.044, 'cross'],     // Bottom: Blue Cross
      [-0.005, -0.0315, 'square'],   // Left: Pink Square
    ];
    for (const [bx, bz, sym] of actionBtnSpecs) {
      const btnBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0048, 0.0050, 0.0036, 18),
        dualShockBtnBodyMat
      );
      btnBase.name = `outbuildings.mezzanine.playstation1.controller.${idx}.button.${sym}.base`;
      btnBase.userData = { lodTier: 'high', lodMaxDistance: 12 };
      btnBase.position.set(bx, 0.0295, bz);
      ctrlGroup.add(btnBase);

      const btnCap = new THREE.Mesh(
        new THREE.CircleGeometry(0.0046, 18),
        psBtnCapMaterials[sym]
      );
      btnCap.rotation.x = -Math.PI / 2;
      // Rotate texture so symbol faces upright toward the player (`+x`)
      btnCap.rotation.z = -Math.PI / 2;
      btnCap.name = `outbuildings.mezzanine.playstation1.controller.${idx}.button.${sym}.cap`;
      btnCap.userData = { lodTier: 'high', lodMaxDistance: 12 };
      btnCap.position.set(bx, 0.0355, bz);
      ctrlGroup.add(btnCap);
    }

    // 5. Center Bridge Buttons (`SELECT`, `START`, `ANALOG`) & Glowing Red Analog Mode Indicator LED
    const selectBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.0045, 0.0026, 0.0085),
      dualShockBtnBodyMat
    );
    selectBtn.name = `outbuildings.mezzanine.playstation1.controller.${idx}.selectButton`;
    selectBtn.userData = { lodTier: 'high', lodMaxDistance: 12 };
    selectBtn.position.set(-0.005, 0.0245, 0.011);
    ctrlGroup.add(selectBtn);

    const startBtn = new THREE.Mesh(
      new THREE.ConeGeometry(0.0042, 0.0088, 3),
      dualShockBtnBodyMat
    );
    startBtn.rotation.x = -Math.PI / 2;
    startBtn.name = `outbuildings.mezzanine.playstation1.controller.${idx}.startButton`;
    startBtn.userData = { lodTier: 'high', lodMaxDistance: 12 };
    startBtn.position.set(-0.005, 0.0245, -0.011);
    ctrlGroup.add(startBtn);

    const analogBtn = new THREE.Mesh(
      new THREE.BoxGeometry(0.0042, 0.0022, 0.0072),
      dualShockBtnBodyMat
    );
    analogBtn.name = `outbuildings.mezzanine.playstation1.controller.${idx}.analogButton`;
    analogBtn.userData = { lodTier: 'high', lodMaxDistance: 12 };
    analogBtn.position.set(0.0045, 0.0245, 0);
    ctrlGroup.add(analogBtn);

    const analogLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.0028, 0.0020, 0.0048),
      analogLedMat
    );
    analogLed.name = `outbuildings.mezzanine.playstation1.controller.${idx}.analogLed`;
    analogLed.userData = { lodTier: 'high', lodMaxDistance: 12 };
    analogLed.position.set(0.0105, 0.0245, 0);
    ctrlGroup.add(analogLed);

    // Subtle SONY & PlayStation logo recess bar at top of center bridge
    const sonyLogoStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.0008, 0.018),
      ps1DarkGreyMat
    );
    sonyLogoStrip.name = `outbuildings.mezzanine.playstation1.controller.${idx}.logoStrip`;
    sonyLogoStrip.userData = { lodTier: 'high', lodMaxDistance: 12 };
    sonyLogoStrip.position.set(-0.014, 0.024, 0);
    ctrlGroup.add(sonyLogoStrip);
  };

  addPs1Controller(19.95, 2.12, -0.52, 1);
  addPs1Controller(19.84, 2.76, 0.38, 2);

  // Looping 3D Black Controller Cables & TV AV Cords (`TubeGeometry`)
  const cablePaths: ReadonlyArray<ReadonlyArray< readonly [number, number, number] >> = [
    // Controller 1 cord looping on rug
    [
      [19.72, mezzanineFloorY + 0.028, 2.41],
      [19.86, mezzanineFloorY + 0.015, 2.35],
      [19.78, mezzanineFloorY + 0.015, 2.18],
      [19.98, mezzanineFloorY + 0.015, 2.25],
      [19.93, mezzanineFloorY + 0.020, 2.13],
    ],
    // Controller 2 cord looping on rug
    [
      [19.74, mezzanineFloorY + 0.028, 2.51],
      [19.88, mezzanineFloorY + 0.015, 2.56],
      [19.76, mezzanineFloorY + 0.015, 2.68],
      [19.83, mezzanineFloorY + 0.020, 2.75],
    ],
    // AV & power cord from PS1 up to the Sony Trinitron TV
    [
      [19.55, mezzanineFloorY + 0.026, 2.46],
      [19.38, mezzanineFloorY + 0.014, 2.44],
      [19.24, mezzanineFloorY + 0.014, 2.38],
      [19.16, mezzanineFloorY + 0.38, 2.36],
      [19.04, mezzanineFloorY + 0.78, 2.38],
    ],
  ];

  for (const pts of cablePaths) {
    const curve = new THREE.CatmullRomCurve3(
      pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    const cableMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.0042, 8, false),
      cordBlackMat
    );
    cableMesh.name = 'outbuildings.mezzanine.playstation1.cable';
    cableMesh.userData = { lodTier: 'high', lodMaxDistance: 12 };
    cableMesh.castShadow = true;
    loungeGroup.add(cableMesh);
  }

  // Scattered PS1 CD Jewel Cases (including open double-disc case showing silver/black CD-ROMs!) & VHS boxes on the rug
  const openCaseGroup = new THREE.Group();
  openCaseGroup.name = 'outbuildings.mezzanine.playstation1.openJewelCase';
  openCaseGroup.position.set(19.76, mezzanineFloorY + 0.02, 2.72);
  openCaseGroup.rotation.y = 0.42;
  loungeGroup.add(openCaseGroup);

  for (const trayX of [-0.068, 0.068] as const) {
    const jewelTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.128, 0.006, 0.142),
      new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.25 })
    );
    jewelTray.name = 'outbuildings.mezzanine.playstation1.openJewelCase.tray';
    jewelTray.userData = { lodTier: 'high', lodMaxDistance: 12 };
    jewelTray.position.set(trayX, 0.003, 0);
    openCaseGroup.add(jewelTray);

    const cdDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, 0.002, 24),
      new THREE.MeshStandardMaterial({
        color: trayX < 0 ? 0xd8e2ec : 0xc87a42,
        roughness: 0.12,
        metalness: 0.88,
      })
    );
    cdDisc.name = 'outbuildings.mezzanine.playstation1.openJewelCase.disc';
    cdDisc.userData = { lodTier: 'high', lodMaxDistance: 12 };
    cdDisc.position.set(trayX, 0.011, 0);
    openCaseGroup.add(cdDisc);
  }

  // Issue #4 ("Some dithering on this book" at `[-2.831, 1.574, 17.094]` -> `(u = 19.48m, v = 2.78m)`):
  // Stacked `[19.48, 2.78]` and `[19.50, 2.80]` at distinct Y heights (`+0.031m` and `+0.058m`) so their faces never coplanar z-fight!
  const floorCases: ReadonlyArray< readonly [number, number, number, number, number] > = [
    [19.48, 0.031, 2.78, 0.32, 0x24344d],
    [19.50, 0.058, 2.80, 0.18, 0x8c2d24],
    [19.96, 0.031, 1.88, -0.25, 0x2e543c],
    [20.14, 0.031, 2.68, 0.55, 0xd8cfc0],
  ];
  for (const [fx, fyOff, fz, frot, fcol] of floorCases) {
    const gameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.022, 0.19),
      new THREE.MeshStandardMaterial({ color: fcol, roughness: 0.38 })
    );
    gameBox.name = 'outbuildings.mezzanine.playstation1.gameCase';
    gameBox.userData = { lodTier: 'high', lodMaxDistance: 12 };
    gameBox.position.set(fx, mezzanineFloorY + fyOff, fz);
    gameBox.rotation.y = frot;
    gameBox.castShadow = true;
    loungeGroup.add(gameBox);
  }

  // =========================================================================
  // 7. 4 COLOURFUL 1990s GRAPHIC SKATEBOARD DECKS ON THE SOUTH WALL (`v = 5.405m`)
  //    Mounted vertically side-by-side right behind the left mezzanine balustrade!
  // =========================================================================
  const skateboardsGroup = new THREE.Group();
  skateboardsGroup.name = 'outbuildings.mezzanine.wallSkateboards';
  loungeGroup.add(skateboardsGroup);

  const deckGeo = createSkateboardDeckGeometry();
  const deckSpecs: ReadonlyArray< readonly [number, SkateboardGraphicStyle] > = [
    [19.04, 'redFlame'],
    [19.30, 'pinkCartoon'],
    [19.56, 'cyanSun'],
    [19.82, 'yellowFrog'],
  ];

  for (const [du, style] of deckSpecs) {
    const deckMat = new THREE.MeshStandardMaterial({
      map: createSkateboardDeckTexture(style),
      roughness: 0.32,
      metalness: 0.06,
    });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.name = `outbuildings.mezzanine.skateboard.${style}`;
    // South wall is at `v = 5.43m`, facing North (`-z`) into the Mezzanine
    deckMesh.rotation.y = Math.PI;
    deckMesh.position.set(du, mezzanineFloorY + 0.80, 5.402);
    deckMesh.castShadow = true;
    skateboardsGroup.add(deckMesh);
  }

  // =========================================================================
  // 8. FRAMED 1990s BRITPOP & CULT CINEMA POSTERS ON THE WALLS
  //    - `blur` on East wall (`u = 23.016m, v = 1.46m`, facing West `-x`)
  //    - `oasis`, `spiceGirls` on North wall (`v = 0.284m`, facing South `+z`)
  //    - `jurassicPark`, `pulpFiction` on South wall (`v = 5.426m`, facing North `-z`)
  // =========================================================================
  const postersGroup = new THREE.Group();
  postersGroup.name = 'outbuildings.mezzanine.retroPosters';
  loungeGroup.add(postersGroup);

  const frameBlackMat = new THREE.MeshStandardMaterial({
    color: 0x18191c,
    roughness: 0.38,
    metalness: 0.12,
  });

  const addFramedPoster = (
    u: number,
    y: number,
    v: number,
    width: number,
    height: number,
    rotY: number,
    style: RetroPosterStyle
  ): void => {
    const pGroup = new THREE.Group();
    pGroup.name = `outbuildings.mezzanine.poster.${style}`;
    pGroup.position.set(u, y, v);
    pGroup.rotation.y = rotY;
    postersGroup.add(pGroup);

    const frameBacking = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.036, height + 0.036, 0.016),
      frameBlackMat
    );
    frameBacking.position.set(0, 0, 0.013);
    frameBacking.castShadow = true;
    frameBacking.name = `outbuildings.mezzanine.poster.${style}.frame`;
    pGroup.add(frameBacking);

    const posterPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({
        map: createRetro90sPosterTexture(style),
        roughness: 0.24,
        metalness: 0.04,
      })
    );
    posterPlane.name = `outbuildings.mezzanine.poster.${style}.print`;
    posterPlane.position.set(0, 0, 0.026);
    pGroup.add(posterPlane);
  };

  // Issue #7 ("CEnter the blur picture here" at `[0.596, 3.116, 15.55]` -> `u = 23.016m, v = 1.46m`):
  // Centered the framed orange `blur` poster on the North pier of the East Barn/Stable partition wall (`v = 0.28..2.40m`)!
  addFramedPoster(23.016, mezzanineFloorY + 1.02, 1.46, 0.54, 0.70, -Math.PI / 2, 'blur');

  // Issue #4 & Issue #5 ("Put one of hte pictures over here" at `[0.831, 2.585, 18.287]` -> `u = 23.016m, v = 4.28m`):
  // Moved `bigLebowski` off the South wall and centered it on the South pier of the East Barn/Stable partition wall (`v = 3.30..5.43m`),
  // leaving `jurassicPark` centered cleanly on the South wall (`u = 20.48m, v = 5.426m`) beside the 4 skateboards!
  addFramedPoster(20.48, mezzanineFloorY + 0.84, 5.426, 0.40, 0.52, Math.PI, 'jurassicPark');
  addFramedPoster(23.016, mezzanineFloorY + 0.96, 4.28, 0.44, 0.58, -Math.PI / 2, 'bigLebowski');

  // Issues #7, #8 & #10:
  // - Issue #7 ("this picture overlaps skirting" on `outbuildings.mezzanine.poster.pulpFiction`) &
  //   Issue #8 ("move it to here" at `[0.292, 2.325, 19.494]` -> `local u = 22.38m, y = 2.325m, v = 5.426m`):
  //   Moved `pulpFiction` from the lower North wall to `(22.38, 2.325, 5.426)` on the South Mezzanine wall (`rotY = Math.PI`).
  // - Issue #10 ("get rid of this picture, center the spice girls better" on `outbuildings.mezzanine.poster.trainspotting`):
  //   Removed `trainspotting` and centered `spiceGirls` at `(20.82, 2.325, 0.284)` (exact horizontal midpoint between the
  //   hayloft window architrave `u = 20.28m` and bookcase `u = 21.36m`, and centered vertically at eye level `y = 2.325m`
  //   well clear of the skirting board, matching `oasis` at `(19.07, 2.325, 0.284)`).
  addFramedPoster(19.07, 2.325, 0.284, 0.40, 0.52, 0, 'oasis');
  addFramedPoster(22.38, 2.325, 5.426, 0.40, 0.52, Math.PI, 'pulpFiction');
  addFramedPoster(20.82, 2.325, 0.284, 0.42, 0.54, 0, 'spiceGirls');

  // =========================================================================
  // 9. 5-SHELF WOODEN RETRO BOOKCASE, BOARD GAMES, VHS/CD COLLECTION, LAVA LAMP
  //    & WARM TABLE LAMP (`outbuildings.mezzanine.bookcase`)
  //    - Issue #1 ("Still wooden book case. Not bright purples and blacks like a CBBC studio."):
  //      Restored the warm natural timber bookcase (`teakMat` / `darkTeakMat`) with warm golden 2700K under-shelf task lighting!
  // =========================================================================
  const bookcaseGroup = new THREE.Group();
  bookcaseGroup.name = 'outbuildings.mezzanine.bookcase';
  bookcaseGroup.position.set(21.88, mezzanineFloorY + 0.004, 0.48);
  bookcaseGroup.rotation.y = Math.PI / 2;
  loungeGroup.add(bookcaseGroup);

  const bcDepthU = 0.30;
  const bcWidthV = 1.04;
  const bcHeightY = 1.30;
  const shelfT = 0.024;

  // Bookcase wooden side uprights & back panel
  for (const sideZ of [-1, 1] as const) {
    const upright = new THREE.Mesh(
      applyOakJoineryUVs(new THREE.BoxGeometry(bcDepthU, bcHeightY, shelfT), 'y', 0.9, 1.4, sideZ * 0.25),
      teakMat
    );
    upright.name = 'outbuildings.mezzanine.bookcase.upright';
    upright.position.set(0, bcHeightY * 0.5, sideZ * (bcWidthV * 0.5 - shelfT * 0.5));
    upright.castShadow = true;
    upright.receiveShadow = true;
    bookcaseGroup.add(upright);
  }
  const bcBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, bcHeightY, bcWidthV),
    darkTeakMat
  );
  bcBack.name = 'outbuildings.mezzanine.bookcase.backPanel';
  bcBack.position.set(bcDepthU * 0.5 + 0.011, bcHeightY * 0.5, 0);
  bookcaseGroup.add(bcBack);

  const shelfHeights = [0.06, 0.31, 0.54, 0.85, 1.08, 1.288];
  for (const sy of shelfHeights) {
    const shelf = new THREE.Mesh(
      applyOakJoineryUVs(new THREE.BoxGeometry(bcDepthU, shelfT, bcWidthV - shelfT * 2 - 0.008), 'z', 0.9, 1.4, sy * 0.4),
      teakMat
    );
    shelf.name = 'outbuildings.mezzanine.bookcase.shelf';
    shelf.position.set(0, sy, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    bookcaseGroup.add(shelf);
  }

  // Warm 2700K golden under-shelf task lighting strips
  const underShelfLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: 0xffc870,
    emissiveIntensity: 1.35,
    roughness: 0.24,
  });
  for (const ledShelfY of [0.54, 0.85, 1.08, 1.288] as const) {
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.008, bcWidthV - shelfT * 2 - 0.06),
      underShelfLedMat
    );
    ledStrip.name = 'outbuildings.mezzanine.bookcase.taskLight';
    ledStrip.position.set(-bcDepthU * 0.5 + 0.04, ledShelfY - shelfT * 0.5 - 0.008, 0);
    bookcaseGroup.add(ledStrip);
  }

  // Stock shelves with classic 1990s board games, books, VHS/CD spines, and stereo boombox
  const itemColors = [0x8c2d24, 0x233852, 0x2e543c, 0xc9963e, 0xdcd2c0, 0x5c3c28, 0x3a4e63];
  // Bottom shelf (`y = 0.072m`): stacks of 90s board games
  for (let stack = 0; stack < 3; stack++) {
    const sz = -0.32 + stack * 0.32;
    for (let layer = 0; layer < 3; layer++) {
      const gameBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.044, 0.27),
        new THREE.MeshStandardMaterial({
          color: itemColors[(stack * 3 + layer) % itemColors.length],
          roughness: 0.48,
        })
      );
      gameBox.name = `outbuildings.mezzanine.bookcase.boardGame.${stack + 1}_${layer + 1}`;
      gameBox.userData = { lodTier: 'high', lodMaxDistance: 12 };
      gameBox.position.set(-0.02, 0.098 + layer * 0.049, sz);
      bookcaseGroup.add(gameBox);
    }
  }

  // Second & third shelves (`y = 0.322m` & `0.552m`): vertical rows of VHS tapes, books & CDs
  for (const [shelfBaseY, itemH, count, isLavaShelf] of [
    [0.326, 0.19, 18, false],
    [0.556, 0.14, 14, true],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const iz = -0.44 + i * 0.036;
      if (isLavaShelf && iz > 0.16) continue;
      const spineH = itemH - (i % 3) * 0.012;
      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, spineH, 0.028),
        new THREE.MeshStandardMaterial({
          color: itemColors[(i * 5) % itemColors.length],
          roughness: 0.52,
        })
      );
      spine.name = `outbuildings.mezzanine.bookcase.mediaSpine.${i + 1}`;
      spine.userData = { lodTier: 'high', lodMaxDistance: 12 };
      spine.position.set(-0.02, shelfBaseY + spineH * 0.5, iz);
      bookcaseGroup.add(spine);
    }
  }

  // Fourth shelf (`y = 0.862m`): 1990s Stereo Boombox in center (`z = 0`)
  const boombox = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.13, 0.32),
    trinitronCharcoalMat
  );
  boombox.name = 'outbuildings.mezzanine.bookcase.boombox';
  boombox.position.set(-0.02, 0.866 + 0.065, 0);
  bookcaseGroup.add(boombox);

  // Helper to build a glowing 1990s Iconic Double-Cone Lava Lamp (`Mathmos Astro`)
  const addRetroLavaLamp = (
    ux: number,
    uy: number,
    uz: number,
    waxColorHex: number,
    baseColorHex: number,
    name: string,
    scale: number = 1.0
  ): void => {
    const lampGroup = new THREE.Group();
    lampGroup.name = name;
    lampGroup.position.set(ux, uy, uz);
    lampGroup.scale.setScalar(scale);
    loungeGroup.add(lampGroup);

    const baseMat = new THREE.MeshStandardMaterial({
      color: baseColorHex,
      roughness: 0.22,
      metalness: 0.78,
    });
    const lavaGlowMat = new THREE.MeshStandardMaterial({
      color: waxColorHex,
      emissive: waxColorHex,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });

    // Hourglass / conical base
    const baseCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.048, 0.095, 18),
      baseMat
    );
    baseCone.name = `${name}.base`;
    baseCone.userData = { lodTier: 'high', lodMaxDistance: 12 };
    baseCone.position.set(0, 0.0475, 0);
    lampGroup.add(baseCone);

    // Tapered glass bottle filled with glowing lava wax
    const glassBottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.042, 0.165, 18),
      lavaGlowMat
    );
    glassBottle.name = `${name}.bottle`;
    glassBottle.userData = { lodTier: 'high', lodMaxDistance: 12 };
    glassBottle.position.set(0, 0.1835, 0);
    lampGroup.add(glassBottle);

    // Top metal cap
    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.038, 18),
      baseMat
    );
    topCap.name = `${name}.cap`;
    topCap.userData = { lodTier: 'high', lodMaxDistance: 12 };
    topCap.position.set(0, 0.291, 0);
    lampGroup.add(topCap);
  };

  // Warm crimson-amber Mathmos Astro Lava Lamp inside the North-wall wooden bookcase (`u = 22.18m, y = mezzanineFloorY + 0.56m, v = 0.47m, scale = 0.72`)
  addRetroLavaLamp(
    22.18,
    mezzanineFloorY + 0.56,
    0.47,
    0xe04828,
    0xd8dde4,
    'outbuildings.mezzanine.lavaLamp.bookcase',
    0.72
  );

  // Warm Wooden Side Cabinet + Warm Cream Fabric Table Lamp in NE corner (`u = 22.64m, v = 0.46m`, matching `media_1791202879638_22365d89.jpg`)
  const sideCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.54, 0.32),
    teakMat
  );
  sideCabinet.name = 'outbuildings.mezzanine.sideCabinet';
  sideCabinet.position.set(22.64, mezzanineFloorY + 0.274, 0.46);
  sideCabinet.castShadow = true;
  sideCabinet.receiveShadow = true;
  loungeGroup.add(sideCabinet);

  const lampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.045, 0.22, 16),
    darkTeakMat
  );
  lampStem.name = 'outbuildings.mezzanine.tableLamp.stem';
  lampStem.position.set(22.64, mezzanineFloorY + 0.658, 0.46);
  loungeGroup.add(lampStem);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.135, 0.18, 22),
    new THREE.MeshStandardMaterial({
      color: 0xf5ebd6,
      emissive: 0xffbe66,
      emissiveIntensity: 1.35,
      roughness: 0.46,
    })
  );
  lampShade.name = 'outbuildings.mezzanine.tableLamp.shade';
  lampShade.position.set(22.64, mezzanineFloorY + 0.862, 0.46);
  loungeGroup.add(lampShade);

  // =========================================================================
  // 10. Issue #3 ("Some more task lighting, ambiet lighting in here" at `[-1.766, 1.552, 16.583]`):
  //     Comprehensive Task & Ambient Lighting across the Mezzanine Retro Lounge:
  //     - Warm overhead ambient PointLight + NE Table Lamp PointLight + Bookcase PointLight + CRT Glow PointLight
  //     - Mid-Century Brass & Teak Articulated Floor Task Lamp (`outbuildings.mezzanine.floorTaskLamp`) in SW lounge corner
  //     - Articulated 1990s Anglepoise Desk Task Lamp (`outbuildings.mezzanine.sideboardTaskLamp`) on south end of sideboard
  //     - 2 Warm Brass & Pleated-Linen Wall Sconces (`outbuildings.mezzanine.wallSconce.1` & `.2`) on East & South walls
  // =========================================================================
  const lightingGroup = new THREE.Group();
  lightingGroup.name = 'outbuildings.mezzanine.lighting';
  loungeGroup.add(lightingGroup);

  const warmBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.26,
    metalness: 0.84,
  });
  const warmGlowingBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    emissive: 0xffd27a,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const warmPleatedShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: 0xffc46b,
    emissiveIntensity: 1.45,
    roughness: 0.52,
    side: THREE.DoubleSide,
  });

  // 1. Warm Overhead Ambient Lounge Light (`u = 20.65m, y = mezzanineFloorY + 1.85m, v = 2.55m`)
  const mezzanineAmbientLight = new THREE.PointLight(0xffcf88, 2.2, 7.8, 1.45);
  mezzanineAmbientLight.name = 'outbuildings.mezzanine.ambientLight';
  mezzanineAmbientLight.position.set(20.65, mezzanineFloorY + 1.85, 2.55);
  lightingGroup.add(mezzanineAmbientLight);

  // 2. NE Table Lamp PointLight & Bookcase Task PointLight
  const neTableLampLight = new THREE.PointLight(0xffb85c, 1.6, 4.5, 1.6);
  neTableLampLight.name = 'outbuildings.mezzanine.tableLamp.light';
  neTableLampLight.position.set(22.64, mezzanineFloorY + 0.78, 0.52);
  lightingGroup.add(neTableLampLight);

  const bookcaseTaskLight = new THREE.PointLight(0xffca78, 1.15, 3.2, 1.7);
  bookcaseTaskLight.name = 'outbuildings.mezzanine.bookcase.light';
  bookcaseTaskLight.position.set(21.88, mezzanineFloorY + 0.92, 0.68);
  lightingGroup.add(bookcaseTaskLight);

  // 3. Sony Trinitron CRT TV Blue-White Screen Glow Light (`u = 19.38m, y = mezzanineFloorY + 1.05m, v = 2.38m`)
  const crtGlowLight = new THREE.PointLight(0x88c8ff, 0.95, 3.4, 1.8);
  crtGlowLight.name = 'outbuildings.mezzanine.trinitronGlowLight';
  crtGlowLight.position.set(19.38, mezzanineFloorY + 1.05, 2.38);
  lightingGroup.add(crtGlowLight);

  // 4. Mid-Century Brass & Teak Articulated Floor Reading/Task Lamp in SW Lounge Corner (`u = 19.25m, v = 4.88m`)
  const floorLampGroup = new THREE.Group();
  floorLampGroup.name = 'outbuildings.mezzanine.floorTaskLamp';
  floorLampGroup.position.set(19.25, mezzanineFloorY, 4.88);
  floorLampGroup.rotation.y = -0.68; // Aimed toward the terracotta beanbag & PS1 gaming rug
  lightingGroup.add(floorLampGroup);

  const flBaseOak = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.16, 0.026, 24),
    teakMat
  );
  flBaseOak.name = 'outbuildings.mezzanine.floorTaskLamp.baseOak';
  flBaseOak.position.set(0, 0.017, 0);
  flBaseOak.castShadow = true;
  floorLampGroup.add(flBaseOak);

  const flBaseBrass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.125, 0.018, 24),
    warmBrassMat
  );
  flBaseBrass.name = 'outbuildings.mezzanine.floorTaskLamp.baseBrass';
  flBaseBrass.position.set(0, 0.043, 0);
  floorLampGroup.add(flBaseBrass);

  const flStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.015, 1.34, 16),
    warmBrassMat
  );
  flStem.name = 'outbuildings.mezzanine.floorTaskLamp.stem';
  flStem.position.set(0, 0.726, 0);
  flStem.castShadow = true;
  floorLampGroup.add(flStem);

  const flTeakGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.18, 16),
    teakMat
  );
  flTeakGrip.name = 'outbuildings.mezzanine.floorTaskLamp.teakGrip';
  flTeakGrip.position.set(0, 0.94, 0);
  floorLampGroup.add(flTeakGrip);

  const flBoomArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.38, 12),
    warmBrassMat
  );
  flBoomArm.name = 'outbuildings.mezzanine.floorTaskLamp.boomArm';
  flBoomArm.position.set(0.14, 1.40, 0);
  flBoomArm.rotation.z = -1.12;
  floorLampGroup.add(flBoomArm);

  const flConeShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.125, 0.17, 24, 1, true),
    warmPleatedShadeMat
  );
  flConeShade.name = 'outbuildings.mezzanine.floorTaskLamp.shade';
  flConeShade.position.set(0.28, 1.38, 0);
  flConeShade.rotation.z = 0.36;
  floorLampGroup.add(flConeShade);

  const flBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 14, 12),
    warmGlowingBulbMat
  );
  flBulb.name = 'outbuildings.mezzanine.floorTaskLamp.bulb';
  flBulb.userData = { lodTier: 'high', lodMaxDistance: 12 };
  flBulb.position.set(0.27, 1.35, 0);
  floorLampGroup.add(flBulb);

  const flTaskPointLight = new THREE.PointLight(0xffc266, 1.75, 5.2, 1.55);
  flTaskPointLight.name = 'outbuildings.mezzanine.floorTaskLamp.light';
  flTaskPointLight.position.set(0.32, 1.30, 0);
  floorLampGroup.add(flTaskPointLight);

  // 5. Articulated 1990s Anglepoise Task Desk Lamp on the South End of the Sideboard (`u = 19.16m, y = mezzanineFloorY + sbTopY + 0.009m, v = 3.04m`)
  const deskLampGroup = new THREE.Group();
  deskLampGroup.name = 'outbuildings.mezzanine.sideboardTaskLamp';
  deskLampGroup.position.set(19.16, mezzanineFloorY + sbTopY + 0.009, 3.04);
  deskLampGroup.rotation.y = -0.45;
  lightingGroup.add(deskLampGroup);

  const dlBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.088, 0.024, 20),
    warmBrassMat
  );
  dlBase.name = 'outbuildings.mezzanine.sideboardTaskLamp.base';
  dlBase.position.set(0, 0.012, 0);
  deskLampGroup.add(dlBase);

  const dlLowerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.24, 10),
    warmBrassMat
  );
  dlLowerArm.name = 'outbuildings.mezzanine.sideboardTaskLamp.lowerArm';
  dlLowerArm.position.set(-0.04, 0.12, 0);
  dlLowerArm.rotation.z = 0.34;
  deskLampGroup.add(dlLowerArm);

  const dlUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.22, 10),
    warmBrassMat
  );
  dlUpperArm.name = 'outbuildings.mezzanine.sideboardTaskLamp.upperArm';
  dlUpperArm.position.set(0.02, 0.27, 0);
  dlUpperArm.rotation.z = -0.62;
  deskLampGroup.add(dlUpperArm);

  const dlShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.078, 0.11, 20, 1, true),
    warmPleatedShadeMat
  );
  dlShade.name = 'outbuildings.mezzanine.sideboardTaskLamp.shade';
  dlShade.position.set(0.11, 0.29, 0);
  dlShade.rotation.z = 0.28;
  deskLampGroup.add(dlShade);

  const dlBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 10),
    warmGlowingBulbMat
  );
  dlBulb.name = 'outbuildings.mezzanine.sideboardTaskLamp.bulb';
  dlBulb.userData = { lodTier: 'high', lodMaxDistance: 12 };
  dlBulb.position.set(0.11, 0.27, 0);
  deskLampGroup.add(dlBulb);

  const dlPointLight = new THREE.PointLight(0xffc470, 1.3, 3.8, 1.65);
  dlPointLight.name = 'outbuildings.mezzanine.sideboardTaskLamp.light';
  dlPointLight.position.set(0.14, 0.24, 0);
  deskLampGroup.add(dlPointLight);

  // 6. Warm Brass & Pleated-Linen Wall Sconce (`outbuildings.mezzanine.wallSconce.1` on East wall;
  //    removed `.2` on South wall per Issue #9: "remove this wall light" at `[-1.946, 2.731, 19.687]`)
  for (const [sIdx, su, sy, sv, sRotY] of [
    [1, 23.011, mezzanineFloorY + 1.22, 0.72, -Math.PI / 2],
  ] as const) {
    const sconceGroup = new THREE.Group();
    sconceGroup.name = `outbuildings.mezzanine.wallSconce.${sIdx}`;
    sconceGroup.position.set(su, sy, sv);
    sconceGroup.rotation.y = sRotY;
    lightingGroup.add(sconceGroup);

    const backplate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.014, 20),
      warmBrassMat
    );
    backplate.rotation.x = Math.PI / 2;
    backplate.name = `outbuildings.mezzanine.wallSconce.${sIdx}.backplate`;
    backplate.position.set(0, 0, 0.007);
    sconceGroup.add(backplate);

    const sconceArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.13, 12),
      warmBrassMat
    );
    sconceArm.rotation.x = Math.PI * 0.38;
    sconceArm.name = `outbuildings.mezzanine.wallSconce.${sIdx}.arm`;
    sconceArm.position.set(0, 0.02, 0.065);
    sconceGroup.add(sconceArm);

    const sconceShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.092, 0.13, 20, 1, true),
      warmPleatedShadeMat
    );
    sconceShade.name = `outbuildings.mezzanine.wallSconce.${sIdx}.shade`;
    sconceShade.position.set(0, 0.095, 0.115);
    sconceGroup.add(sconceShade);

    const sconceBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 10),
      warmGlowingBulbMat
    );
    sconceBulb.name = `outbuildings.mezzanine.wallSconce.${sIdx}.bulb`;
    sconceBulb.userData = { lodTier: 'high', lodMaxDistance: 12 };
    sconceBulb.position.set(0, 0.085, 0.115);
    sconceGroup.add(sconceBulb);

    const sconceLight = new THREE.PointLight(0xffc472, 1.15, 3.8, 1.7);
    sconceLight.position.set(0, 0.09, 0.18);
    sconceGroup.add(sconceLight);
  }
}
