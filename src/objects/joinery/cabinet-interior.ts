import * as THREE from 'three';

export interface HollowCabinetOptions {
  readonly plinthH?: number;
  readonly plinthHeight?: number;
  readonly wallThick?: number;
  readonly shelfFractions?: readonly number[];
  readonly shelfCount?: number;
  readonly dividers?: number;
  readonly hasCenterMullion?: boolean;
  readonly interiorStyle?:
    | 'oak'
    | 'fridge'
    | 'freezer'
    | 'oven'
    | 'dishwasher'
    | 'pantry'
    | 'underSink'
    | 'utility';
  readonly populateItems?: boolean;
  readonly includeItems?: boolean;
}

let cachedOakInteriorMat: THREE.MeshStandardMaterial | null = null;
let cachedFridgeInteriorMat: THREE.MeshStandardMaterial | null = null;
let cachedOvenInteriorMat: THREE.MeshStandardMaterial | null = null;
let cachedStainlessTubMat: THREE.MeshStandardMaterial | null = null;
let cachedCeramicWhiteMat: THREE.MeshStandardMaterial | null = null;
let cachedGlassShelfMat: THREE.MeshStandardMaterial | null = null;
let cachedWickerMat: THREE.MeshStandardMaterial | null = null;
let cachedCastIronPotMat: THREE.MeshStandardMaterial | null = null;
let cachedChromeRackMat: THREE.MeshStandardMaterial | null = null;

function getOakInteriorMat(): THREE.MeshStandardMaterial {
  if (!cachedOakInteriorMat) {
    cachedOakInteriorMat = new THREE.MeshStandardMaterial({
      color: 0xc59b6d,
      roughness: 0.54,
      metalness: 0.04,
    });
  }
  return cachedOakInteriorMat;
}

function getFridgeInteriorMat(): THREE.MeshStandardMaterial {
  if (!cachedFridgeInteriorMat) {
    cachedFridgeInteriorMat = new THREE.MeshStandardMaterial({
      color: 0xf2f4f7,
      roughness: 0.22,
      metalness: 0.05,
    });
  }
  return cachedFridgeInteriorMat;
}

function getOvenInteriorMat(): THREE.MeshStandardMaterial {
  if (!cachedOvenInteriorMat) {
    cachedOvenInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x181b20,
      roughness: 0.36,
      metalness: 0.35,
    });
  }
  return cachedOvenInteriorMat;
}

function getStainlessTubMat(): THREE.MeshStandardMaterial {
  if (!cachedStainlessTubMat) {
    cachedStainlessTubMat = new THREE.MeshStandardMaterial({
      color: 0xb5b2ab,
      roughness: 0.3,
      metalness: 0.55,
    });
  }
  return cachedStainlessTubMat;
}

function getCeramicWhiteMat(): THREE.MeshStandardMaterial {
  if (!cachedCeramicWhiteMat) {
    cachedCeramicWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf6f4ee,
      roughness: 0.2,
      metalness: 0.04,
    });
  }
  return cachedCeramicWhiteMat;
}

function getGlassShelfMat(): THREE.MeshStandardMaterial {
  if (!cachedGlassShelfMat) {
    cachedGlassShelfMat = new THREE.MeshStandardMaterial({
      color: 0xdcf0f7,
      transparent: true,
      opacity: 0.52,
      roughness: 0.08,
      metalness: 0.15,
    });
  }
  return cachedGlassShelfMat;
}

function getWickerMat(): THREE.MeshStandardMaterial {
  if (!cachedWickerMat) {
    cachedWickerMat = new THREE.MeshStandardMaterial({
      color: 0xa88256,
      roughness: 0.78,
      metalness: 0.02,
    });
  }
  return cachedWickerMat;
}

function getCastIronPotMat(): THREE.MeshStandardMaterial {
  if (!cachedCastIronPotMat) {
    cachedCastIronPotMat = new THREE.MeshStandardMaterial({
      color: 0x38587a,
      roughness: 0.26,
      metalness: 0.22,
    });
  }
  return cachedCastIronPotMat;
}

function getChromeRackMat(): THREE.MeshStandardMaterial {
  if (!cachedChromeRackMat) {
    cachedChromeRackMat = new THREE.MeshStandardMaterial({
      color: 0xd4d1ca,
      roughness: 0.22,
      metalness: 0.65,
    });
  }
  return cachedChromeRackMat;
}

/**
 * Builds a hollow 3D cabinet carcass with an open front face, exterior painted panels,
 * natural oak (or appliance-specific) interior lining, internal shelves, and interior contents
 * visible when the cupboard/appliance doors swing open.
 */
export function buildHollowCabinetCarcass(
  parent: THREE.Object3D,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  openFace: '+z' | '-z' | '+x' | '-x',
  exteriorMat: THREE.Material,
  options: HollowCabinetOptions = {}
): THREE.Group {
  const group = new THREE.Group();
  const centerY = options.plinthHeight !== undefined ? cy + h * 0.5 : cy;
  group.position.set(cx, centerY, cz);

  const plinthH = options.plinthHeight ?? options.plinthH ?? 0;
  const t = options.wallThick ?? 0.022;
  const style = options.interiorStyle ?? 'oak';
  const populate = options.includeItems ?? options.populateItems ?? true;

  const interiorMat =
    style === 'fridge' || style === 'freezer'
      ? getFridgeInteriorMat()
      : style === 'oven'
        ? getOvenInteriorMat()
        : style === 'dishwasher'
          ? getStainlessTubMat()
          : getOakInteriorMat();

  // 1. Optional lower kickboard / plinth block
  if (plinthH > 0.005) {
    const plinthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, plinthH, d),
      exteriorMat
    );
    if (!plinthMesh.name) plinthMesh.name = 'joinery.cabinetInterior.plinth';
    plinthMesh.position.set(0, -h * 0.5 + plinthH * 0.5, 0);
    plinthMesh.castShadow = true;
    plinthMesh.receiveShadow = true;
    group.add(plinthMesh);
  }

  const cavBotY = -h * 0.5 + plinthH;
  const cavTopY = h * 0.5;
  const cavH = Math.max(0.08, cavTopY - cavBotY);
  const cavMidY = (cavBotY + cavTopY) * 0.5;

  const isZOpen = openFace === '+z' || openFace === '-z';
  const openSign = openFace === '+z' || openFace === '+x' ? 1 : -1;

  // Span along the doorway width (spanW) and depth from front to back (spanD)
  const spanW = isZOpen ? w : d;
  const spanD = isZOpen ? d : w;
  const innerW = Math.max(0.04, spanW - t * 2);
  const innerH = Math.max(0.04, cavH - t * 2);
  const innerD = Math.max(0.04, spanD - t);

  // Helper to place a box in local (u = across width, y = vertical, v = depth toward openFace) coordinates
  const addLocalPanel = (
    u: number,
    y: number,
    v: number,
    sizeU: number,
    sizeY: number,
    sizeV: number,
    mat: THREE.Material,
    castShadow = true
  ): THREE.Mesh => {
    const geo = isZOpen
      ? new THREE.BoxGeometry(sizeU, sizeY, sizeV)
      : new THREE.BoxGeometry(sizeV, sizeY, sizeU);
    const mesh = new THREE.Mesh(geo, mat);
    if (!mesh.name) mesh.name = 'joinery.cabinetInterior.mesh';
    if (isZOpen) {
      mesh.position.set(u, y, openSign * v);
    } else {
      mesh.position.set(openSign * v, y, u);
    }
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 2. Outer Carcass Shell (Left Cheek, Right Cheek, Back Wall, Top Panel, Bottom Floor)
  const cheekOuterThick = t * 0.65;
  const cheekInnerThick = t * 0.35;

  for (const side of [-1, 1]) {
    // Exterior painted cheek
    addLocalPanel(
      side * (spanW * 0.5 - cheekOuterThick * 0.5),
      cavMidY,
      0,
      cheekOuterThick,
      cavH,
      spanD,
      exteriorMat
    );
    // Interior lined cheek
    addLocalPanel(
      side * (spanW * 0.5 - cheekOuterThick - cheekInnerThick * 0.5),
      cavMidY,
      0,
      cheekInnerThick,
      innerH,
      innerD,
      interiorMat,
      false
    );
  }

  // Back wall (exterior backing + interior lining)
  addLocalPanel(
    0,
    cavMidY,
    -spanD * 0.5 + cheekOuterThick * 0.5,
    spanW - cheekOuterThick * 2,
    cavH,
    cheekOuterThick,
    exteriorMat
  );
  addLocalPanel(
    0,
    cavMidY,
    -spanD * 0.5 + cheekOuterThick + cheekInnerThick * 0.5,
    innerW,
    innerH,
    cheekInnerThick,
    interiorMat,
    false
  );

  // Bottom floor of cavity (exterior underside + interior floor)
  addLocalPanel(0, cavBotY + t * 0.25, 0, spanW - cheekOuterThick * 2, t * 0.5, spanD, exteriorMat);
  addLocalPanel(0, cavBotY + t * 0.75, t * 0.25, innerW, t * 0.5, innerD, interiorMat, false);

  // Top ceiling of cavity (exterior top + interior ceiling)
  addLocalPanel(0, cavTopY - t * 0.25, 0, spanW - cheekOuterThick * 2, t * 0.5, spanD, exteriorMat);
  addLocalPanel(0, cavTopY - t * 0.75, t * 0.25, innerW, t * 0.5, innerD, interiorMat, false);

  // 3. Optional Vertical Internal Dividers
  const numDividers = options.dividers ?? (options.hasCenterMullion ? 1 : 0);
  const bayCount = numDividers + 1;
  const bayW = innerW / bayCount;
  for (let i = 1; i <= numDividers; i++) {
    const divU = -innerW * 0.5 + i * bayW;
    addLocalPanel(divU, cavMidY, t * 0.2, 0.018, innerH, innerD - 0.01, interiorMat, false);
  }

  // 4. Internal Horizontal Shelves & Recessed Details
  const computedShelfFracs: number[] | undefined =
    options.shelfCount !== undefined
      ? Array.from({ length: options.shelfCount }, (_, idx) => (idx + 1) / (options.shelfCount! + 1))
      : undefined;
  const shelfFracs =
    options.shelfFractions ??
    computedShelfFracs ??
    (style === 'pantry'
      ? [0.26, 0.52, 0.76]
      : style === 'fridge' || style === 'freezer'
        ? [0.18, 0.36, 0.54, 0.72, 0.88]
        : style === 'oven'
          ? [0.32, 0.66]
          : style === 'dishwasher'
            ? [0.22, 0.64]
            : style === 'underSink'
              ? []
              : [0.48]);

  const shelfMat =
    style === 'fridge' || style === 'freezer'
      ? getGlassShelfMat()
      : style === 'oven' || style === 'dishwasher'
        ? getChromeRackMat()
        : interiorMat;

  const shelfDepth = innerD - 0.035;
  const shelfV = -spanD * 0.5 + t + shelfDepth * 0.5 + 0.005;

  for (const frac of shelfFracs) {
    const sy = cavBotY + t + frac * innerH;
    const shelfThick = style === 'fridge' || style === 'freezer' ? 0.01 : style === 'oven' ? 0.008 : 0.018;
    addLocalPanel(0, sy, shelfV, innerW - 0.004, shelfThick, shelfDepth, shelfMat, false);

    // Chrome front trim on glass fridge/freezer shelves or wire dishwasher baskets
    if (style === 'fridge' || style === 'freezer' || style === 'dishwasher') {
      addLocalPanel(
        0,
        sy + (style === 'dishwasher' ? 0.035 : 0),
        shelfV + shelfDepth * 0.5 + 0.0045,
        innerW - 0.006,
        style === 'dishwasher' ? 0.065 : 0.015,
        0.008,
        getChromeRackMat(),
        false
      );
    }
  }

  // 5. Populate Authentic Interior Items so opening any cupboard reveals rich 3D detail
  if (populate) {
    const ceramicMat = getCeramicWhiteMat();
    const wickerMat = getWickerMat();
    const potMat = getCastIronPotMat();
    const chromeMat = getChromeRackMat();

    if (style === 'dishwasher') {
      // Stacked white dinner plates in the lower dishwasher rack
      const lowerRackY = cavBotY + t + 0.22 * innerH + 0.08;
      for (let p = -4; p <= 4; p++) {
        addLocalPanel(
          p * 0.042,
          lowerRackY,
          shelfV,
          0.008,
          0.15,
          0.15,
          ceramicMat,
          false
        );
      }
      // Glasses/mugs on the upper dishwasher rack
      const upperRackY = cavBotY + t + 0.64 * innerH + 0.045;
      for (const gu of [-0.16, -0.05, 0.06, 0.17]) {
        addLocalPanel(gu, upperRackY, shelfV, 0.055, 0.075, 0.055, getGlassShelfMat(), false);
      }
    } else if (style === 'underSink') {
      // Chrome sink waste trap U-bend pipework + cleaning bottle caddy
      addLocalPanel(0, cavTopY - 0.16, -0.04, 0.045, 0.22, 0.045, chromeMat, false);
      addLocalPanel(0.06, cavTopY - 0.25, -0.04, 0.14, 0.04, 0.045, chromeMat, false);
      addLocalPanel(-0.14, cavBotY + t + 0.08, 0.02, 0.16, 0.14, 0.14, wickerMat, false);
    } else if (style === 'pantry') {
      // Wicker baskets on lower shelf, glass Kilner jars & canisters on middle/upper shelves
      const s0 = cavBotY + t + (shelfFracs[0] ?? 0.26) * innerH;
      const s1 = cavBotY + t + (shelfFracs[1] ?? 0.52) * innerH;
      const s2 = cavBotY + t + (shelfFracs[2] ?? 0.76) * innerH;
      for (const bu of [-innerW * 0.28, 0, innerW * 0.28]) {
        addLocalPanel(bu, cavBotY + t + 0.09, shelfV, innerW * 0.24, 0.16, shelfDepth * 0.75, wickerMat, false);
      }
      for (const ju of [-innerW * 0.34, -innerW * 0.12, innerW * 0.12, innerW * 0.34]) {
        addLocalPanel(ju, s0 + 0.084, shelfV, 0.085, 0.14, 0.085, getGlassShelfMat(), false);
        addLocalPanel(ju, s0 + 0.166, shelfV, 0.075, 0.016, 0.075, interiorMat, false);
        addLocalPanel(ju, s1 + 0.069, shelfV, 0.075, 0.11, 0.075, ceramicMat, false);
      }
      addLocalPanel(-innerW * 0.2, s2 + 0.064, shelfV, 0.18, 0.1, 0.14, potMat, false);
      addLocalPanel(innerW * 0.2, s2 + 0.054, shelfV, 0.16, 0.08, 0.14, ceramicMat, false);
    } else if (style === 'fridge') {
      // Warm internal LED strip at top of fridge + chilled bottles/containers on glass shelves + lower crisper drawers
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
      addLocalPanel(0, cavTopY - t - 0.008, shelfV + 0.06, innerW * 0.75, 0.008, 0.025, ledMat, false);
      // Lower salad crisper drawer at the bottom of the fridge
      addLocalPanel(0, cavBotY + t + 0.12, shelfV + shelfDepth * 0.42, innerW - 0.018, 0.21, 0.014, getGlassShelfMat(), false);
      addLocalPanel(0, cavBotY + t + 0.21, shelfV + shelfDepth * 0.42 + 0.017, innerW * 0.55, 0.016, 0.01, chromeMat, false);
      for (let idx = 0; idx < shelfFracs.length; idx++) {
        const sy = cavBotY + t + (shelfFracs[idx] ?? 0.5) * innerH;
        addLocalPanel(-innerW * 0.22, sy + 0.055, shelfV, 0.12, 0.09, 0.12, ceramicMat, false);
        addLocalPanel(innerW * 0.18, sy + 0.065, shelfV, 0.08, 0.11, 0.08, getGlassShelfMat(), false);
      }
    } else if (style === 'freezer') {
      // Cool white internal LED strip at top of full-height freezer + frosted clear acrylic freezer drawer fronts on every tier
      const freezerLedMat = new THREE.MeshBasicMaterial({ color: 0xe8f6ff });
      addLocalPanel(0, cavTopY - t - 0.008, shelfV + 0.06, innerW * 0.75, 0.008, 0.025, freezerLedMat, false);
      const allTierYs = [cavBotY + t, ...shelfFracs.map((f) => cavBotY + t + f * innerH)];
      for (let idx = 0; idx < allTierYs.length; idx++) {
        const tierBotY = allTierYs[idx]!;
        const tierTopY = idx + 1 < allTierYs.length ? allTierYs[idx + 1]! : cavTopY - t;
        const drawerH = Math.max(0.12, (tierTopY - tierBotY) * 0.78);
        const drawerMidY = tierBotY + drawerH * 0.5 + 0.012;
        // Frosted acrylic freezer drawer front panel
        addLocalPanel(
          0,
          drawerMidY,
          shelfV + shelfDepth * 0.44,
          innerW - 0.02,
          drawerH,
          0.014,
          getGlassShelfMat(),
          false
        );
        // Brushed chrome top grip bar on each freezer drawer
        addLocalPanel(
          0,
          tierBotY + drawerH + 0.002,
          shelfV + shelfDepth * 0.44 + 0.017,
          innerW * 0.62,
          0.012,
          0.01,
          chromeMat,
          false
        );
      }
    } else if (style === 'oven') {
      // Subtle warm amber oven cavity backplate detail + roasting tray on lower wire rack
      const s0 = cavBotY + t + (shelfFracs[0] ?? 0.32) * innerH;
      addLocalPanel(0, s0 + 0.023, shelfV, innerW * 0.68, 0.028, shelfDepth * 0.72, potMat, false);
    } else if (innerW >= 0.38 && shelfFracs.length > 0) {
      // Standard kitchen/utility cupboard: stacked ceramic plates/bowls on shelf & cast-iron pot on floor
      const s0 = cavBotY + t + (shelfFracs[0] ?? 0.48) * innerH;
      for (let b = 0; b < bayCount; b++) {
        const bayCenterU = -innerW * 0.5 + (b + 0.5) * bayW;
        addLocalPanel(
          bayCenterU - bayW * 0.18,
          s0 + 0.049,
          shelfV,
          Math.min(0.18, bayW * 0.36),
          0.07,
          Math.min(0.18, shelfDepth * 0.65),
          ceramicMat,
          false
        );
        addLocalPanel(
          bayCenterU + bayW * 0.16,
          cavBotY + t + 0.065,
          shelfV,
          Math.min(0.2, bayW * 0.38),
          0.11,
          Math.min(0.2, shelfDepth * 0.65),
          style === 'utility' ? wickerMat : potMat,
          false
        );
      }
    }
  }

  parent.add(group);
  return group;
}

/**
 * Attaches a 4-sided solid oak dovetail drawer box (plus cookware inside) behind a sliding drawer front
 * so when the user clicks a drawer to slide it open, a genuine 3D drawer box pulls out of the cabinet.
 */
export function attachDrawerBoxBehindFront(
  drawerFrontGroup: THREE.Group,
  width: number,
  height: number,
  depth: number,
  openAxis: '+z' | '+x',
  includeCookware = true
): void {
  const oakMat = getOakInteriorMat();
  const boxH = Math.max(0.08, height * 0.68);
  const boxW = Math.max(0.12, width - 0.06);
  const sideT = 0.016;
  const botY = -height * 0.5 + 0.025;
  const midY = botY + boxH * 0.5;

  const isZ = openAxis === '+z';

  const addPart = (
    u: number,
    y: number,
    v: number,
    su: number,
    sy: number,
    sv: number,
    mat: THREE.Material
  ): void => {
    const geo = isZ
      ? new THREE.BoxGeometry(su, sy, sv)
      : new THREE.BoxGeometry(sv, sy, su);
    const mesh = new THREE.Mesh(geo, mat);
    if (!mesh.name) mesh.name = 'joinery.cabinetInterior.mesh';
    if (isZ) {
      mesh.position.set(u, y, v);
    } else {
      mesh.position.set(v, y, u);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    drawerFrontGroup.add(mesh);
  };

  // Drawer bottom panel extending behind the drawer front (v from -depth to 0)
  addPart(0, botY + sideT * 0.5, -depth * 0.5, boxW, sideT, depth, oakMat);
  // Left & Right oak drawer sides
  for (const side of [-1, 1]) {
    addPart(side * (boxW * 0.5 - sideT * 0.5), midY, -depth * 0.5, sideT, boxH, depth, oakMat);
  }
  // Back oak drawer wall
  addPart(0, midY, -depth + sideT * 0.5, boxW - sideT * 2, boxH, sideT, oakMat);

  if (includeCookware && boxW > 0.4) {
    // Nested cast-iron casserole / stainless saucepan inside the pan drawer
    addPart(-boxW * 0.2, botY + 0.063, -depth * 0.48, 0.22, 0.085, 0.22, getCastIronPotMat());
    addPart(boxW * 0.2, botY + 0.053, -depth * 0.52, 0.18, 0.065, 0.18, getChromeRackMat());
  }
}
