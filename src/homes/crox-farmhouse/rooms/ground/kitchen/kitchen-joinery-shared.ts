import * as THREE from 'three';
import {
  createBrushedStainlessTexture,
  createMarbleBacksplashTexture,
  createPolishedChromeTexture,
} from '../../../../../engine/textures/procedural-textures.ts';

export function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

export function tagHighLod(obj: THREE.Object3D, maxDistance = 12): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
}

export function nameCarcassHierarchy(root: THREE.Group, prefix: string): THREE.Group {
  root.name = prefix;
  let idx = 1;
  root.traverse((child) => {
    if (child === root) return;
    if (!child.name) {
      child.name = `${prefix}.part_${idx++}`;
    }
    if (child instanceof THREE.Mesh && child.geometry) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox;
      if (bb) {
        const sx = bb.max.x - bb.min.x;
        const sy = bb.max.y - bb.min.y;
        const sz = bb.max.z - bb.min.z;
        if (Math.max(sx, sy, sz) < 0.25) {
          tagHighLod(child, 12);
        }
      }
    }
  });
  return root;
}

export function nameDrawerBoxChildren(drawerGroup: THREE.Group, prefix: string): void {
  let idx = 1;
  drawerGroup.traverse((child) => {
    if (child === drawerGroup) return;
    if (!child.name) {
      child.name = `${prefix}.drawerBoxPart_${idx++}`;
    }
    if (child instanceof THREE.Mesh && child.geometry) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox;
      if (bb) {
        const sx = bb.max.x - bb.min.x;
        const sy = bb.max.y - bb.min.y;
        const sz = bb.max.z - bb.min.z;
        if (Math.max(sx, sy, sz) < 0.25) {
          tagHighLod(child, 12);
        }
      }
    }
  });
}

// Shared reusable hardware & small detail geometries across kitchen cabinetry, appliances & island
export const sharedCabinetKnobGeo = prepGeo(new THREE.SphereGeometry(0.014, 10, 8));
export const sharedBifoldKnuckleHingeGeo = prepGeo(
  new THREE.CylinderGeometry(0.0045, 0.0045, 0.04, 8)
);

export interface CorniceOpenSides {
  readonly left?: boolean;
  readonly right?: boolean;
  readonly back?: boolean;
  readonly front?: boolean;
}

export interface KitchenCabinetrySharedContext {
  readonly doveGreyMat: THREE.MeshStandardMaterial;
  readonly limestoneWorktopMat: THREE.MeshStandardMaterial;
  readonly wallPlasterMat: THREE.MeshStandardMaterial;
  readonly chromeKnobMat: THREE.MeshStandardMaterial;
  readonly stainlessSteelMat: THREE.MeshStandardMaterial;
  readonly ovenGlassMat: THREE.MeshStandardMaterial;
  readonly corniceVoidFloorMat: THREE.MeshStandardMaterial;
  readonly brushedStainlessTex: THREE.CanvasTexture;
  readonly polishedChromeTex: THREE.CanvasTexture;
  readonly addChromeKnob: (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    facingAxis: 'x' | 'z',
    knobName?: string
  ) => THREE.Mesh;
  readonly addHowdensShakerDoor: (
    parent: THREE.Object3D,
    cx: number,
    cy: number,
    carcassFaceCoord: number,
    w: number,
    h: number,
    facingAxis: 'x' | 'z',
    stileW?: number,
    railH?: number,
    hasMidRail?: boolean,
    doorName?: string
  ) => THREE.Group;
  readonly addCovingMantelCornice: (
    parent: THREE.Object3D,
    cx: number,
    baseY: number,
    cz: number,
    w: number,
    d: number,
    overhangLeftX: number,
    overhangRightX: number,
    overhangBackZ: number,
    overhangFrontZ: number,
    openSides?: CorniceOpenSides,
    cornicePrefix?: string
  ) => void;
}

export function createKitchenCabinetrySharedContext(): KitchenCabinetrySharedContext {
  const doveGreyMat = new THREE.MeshStandardMaterial({
    color: 0xa29f97,
    roughness: 0.56,
    metalness: 0.04,
  });
  const worktopMarbleTex = createMarbleBacksplashTexture();
  worktopMarbleTex.wrapS = THREE.RepeatWrapping;
  worktopMarbleTex.wrapT = THREE.RepeatWrapping;
  worktopMarbleTex.repeat.set(1.6, 1.0);

  const limestoneWorktopMat = new THREE.MeshStandardMaterial({
    map: worktopMarbleTex,
    roughness: 0.18,
    metalness: 0.04,
  });
  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.86,
    metalness: 0.02,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const polishedChromeTex = createPolishedChromeTexture();

  // Cupboard door handles / knobs are Brushed Stainless Steel (reacting 100% to room lighting)
  const chromeKnobMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });

  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.004,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  const ovenGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0d1014,
    roughness: 0.12,
    metalness: 0.65,
  });
  const corniceVoidFloorMat = new THREE.MeshStandardMaterial({
    color: 0xb6b2a6,
    roughness: 0.58,
    metalness: 0.02,
  });

  let autoKnobIndex = 1;
  const addChromeKnob = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    facingAxis: 'x' | 'z',
    knobName?: string
  ): THREE.Mesh => {
    const knob = new THREE.Mesh(sharedCabinetKnobGeo, chromeKnobMat);
    const parentPrefix = parent.name || 'kitchen.cabinetry.door';
    knob.name = knobName ?? `${parentPrefix}.knob_${autoKnobIndex++}`;
    knob.position.set(x, y, z);
    if (facingAxis === 'x') {
      knob.scale.set(0.75, 1, 1);
    } else {
      knob.scale.set(1, 1, 0.75);
    }
    tagHighLod(knob, 12);
    parent.add(knob);
    return knob;
  };

  let autoDoorIndex = 1;
  /**
   * Builds a Howdens-style full-overlay (lay-on) Shaker door or drawer front where:
   * - The flat center panel is genuinely INSET (10mm thick, sitting against the carcass)
   * - The 4 outer Shaker stiles & rails are RAISED (22mm thick -> 12mm proud of the recessed center!)
   * - Full-overlay sizing leaves only a crisp 5mm shadow gap between adjacent doors (not in-frame).
   */
  const addHowdensShakerDoor = (
    parent: THREE.Object3D,
    cx: number,
    cy: number,
    carcassFaceCoord: number,
    w: number,
    h: number,
    facingAxis: 'x' | 'z',
    stileW = 0.062,
    railH = stileW,
    hasMidRail = false,
    doorName?: string
  ): THREE.Group => {
    const resolvedName = doorName ?? `kitchen.cabinetry.shakerDoor_${autoDoorIndex++}`;
    const doorGroup = new THREE.Group();
    doorGroup.name = resolvedName;
    if (facingAxis === 'x') {
      doorGroup.position.set(carcassFaceCoord, cy, cx);
    } else {
      doorGroup.position.set(cx, cy, carcassFaceCoord);
    }

    const insetThickness = 0.01;
    const frameThickness = 0.022;

    if (facingAxis === 'x') {
      // Recessed flat center panel
      const insetPanel = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(insetThickness, h - 0.008, w - 0.008)),
        doveGreyMat
      );
      insetPanel.name = `${resolvedName}.insetPanel`;
      insetPanel.position.set(insetThickness * 0.5, 0, 0);
      insetPanel.receiveShadow = true;
      doorGroup.add(insetPanel);

      // Raised Left & Right Vertical Stiles
      const stileGeo = prepGeo(new THREE.BoxGeometry(frameThickness, h, stileW));
      for (const side of [-1, 1] as const) {
        const stile = new THREE.Mesh(stileGeo, doveGreyMat);
        stile.name = `${resolvedName}.stile.${side < 0 ? 'left' : 'right'}`;
        stile.position.set(frameThickness * 0.5, 0, side * (w * 0.5 - stileW * 0.5));
        stile.castShadow = true;
        stile.receiveShadow = true;
        doorGroup.add(stile);
      }

      // Raised Top & Bottom Horizontal Rails
      const innerSpan = Math.max(0.03, w - stileW * 2);
      const railGeo = prepGeo(new THREE.BoxGeometry(frameThickness, railH, innerSpan));
      for (const vSide of [-1, 1] as const) {
        const rail = new THREE.Mesh(railGeo, doveGreyMat);
        rail.name = `${resolvedName}.rail.${vSide < 0 ? 'bottom' : 'top'}`;
        rail.position.set(frameThickness * 0.5, vSide * (h * 0.5 - railH * 0.5), 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        doorGroup.add(rail);
      }

      if (hasMidRail) {
        const midRail = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(frameThickness, railH * 0.85, innerSpan)),
          doveGreyMat
        );
        midRail.name = `${resolvedName}.rail.mid`;
        midRail.position.set(frameThickness * 0.5, 0, 0);
        midRail.castShadow = true;
        doorGroup.add(midRail);
      }
    } else {
      // Facing +Z
      const insetPanel = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(w - 0.008, h - 0.008, insetThickness)),
        doveGreyMat
      );
      insetPanel.name = `${resolvedName}.insetPanel`;
      insetPanel.position.set(0, 0, insetThickness * 0.5);
      insetPanel.receiveShadow = true;
      doorGroup.add(insetPanel);

      // Raised Left & Right Vertical Stiles
      const stileGeo = prepGeo(new THREE.BoxGeometry(stileW, h, frameThickness));
      for (const side of [-1, 1] as const) {
        const stile = new THREE.Mesh(stileGeo, doveGreyMat);
        stile.name = `${resolvedName}.stile.${side < 0 ? 'left' : 'right'}`;
        stile.position.set(side * (w * 0.5 - stileW * 0.5), 0, frameThickness * 0.5);
        stile.castShadow = true;
        stile.receiveShadow = true;
        doorGroup.add(stile);
      }

      // Raised Top & Bottom Horizontal Rails
      const innerSpan = Math.max(0.03, w - stileW * 2);
      const railGeo = prepGeo(new THREE.BoxGeometry(innerSpan, railH, frameThickness));
      for (const vSide of [-1, 1] as const) {
        const rail = new THREE.Mesh(railGeo, doveGreyMat);
        rail.name = `${resolvedName}.rail.${vSide < 0 ? 'bottom' : 'top'}`;
        rail.position.set(0, vSide * (h * 0.5 - railH * 0.5), frameThickness * 0.5);
        rail.castShadow = true;
        rail.receiveShadow = true;
        doorGroup.add(rail);
      }

      if (hasMidRail) {
        const midRail = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(innerSpan, railH * 0.85, frameThickness)),
          doveGreyMat
        );
        midRail.name = `${resolvedName}.rail.mid`;
        midRail.position.set(0, -0.06, frameThickness * 0.5);
        midRail.castShadow = true;
        doorGroup.add(midRail);
      }
    }

    parent.add(doorGroup);
    return doorGroup;
  };

  let autoCorniceIndex = 1;
  // Helper to build a hollow stepped 4-tier coving/mantel crown moulding frame around the perimeter
  // of cupboard tops (baseY = 2.42m / 2.44m), creating a recessed internal void/tray above the cabinet
  // roof where strip LED uplights sit inset rather than perched on top of the cornice rim.
  const addCovingMantelCornice = (
    parent: THREE.Object3D,
    cx: number,
    baseY: number,
    cz: number,
    w: number,
    d: number,
    overhangLeftX: number,
    overhangRightX: number,
    overhangBackZ: number,
    overhangFrontZ: number,
    openSides?: CorniceOpenSides,
    cornicePrefix?: string
  ): void => {
    const prefix =
      cornicePrefix ?? `${parent.name || 'kitchen.cabinetry'}.cornice_${autoCorniceIndex++}`;
    const rimW = 0.032; // 32mm plinth perimeter wall thickness around the recessed void
    const innerMinX = cx - w * 0.5 + (openSides?.left ? 0 : rimW);
    const innerMaxX = cx + w * 0.5 - (openSides?.right ? 0 : rimW);
    const innerMinZ = cz - d * 0.5 + (openSides?.back ? 0 : rimW);
    const innerMaxZ = cz + d * 0.5 - (openSides?.front ? 0 : rimW);
    const innerW = Math.max(0.04, innerMaxX - innerMinX);
    const innerD = Math.max(0.04, innerMaxZ - innerMinZ);

    // Recessed void floor tray at the bottom of the plinth cavity (y = baseY + 0.002m)
    const voidFloor = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(innerW, 0.004, innerD)),
      corniceVoidFloorMat
    );
    voidFloor.name = `${prefix}.voidFloor`;
    voidFloor.position.set(
      (innerMinX + innerMaxX) * 0.5,
      baseY + 0.002,
      (innerMinZ + innerMaxZ) * 0.5
    );
    voidFloor.receiveShadow = true;
    parent.add(voidFloor);

    // [scaleFraction, tierHeight, centerYOffset] — refined, understated Shaker cornice flare
    const tiers: ReadonlyArray<readonly [number, number, number]> = [
      [0.22, 0.018, 0.009], // Lower frieze necking band
      [0.46, 0.018, 0.027], // Lower ogee/cyma coving step
      [0.72, 0.018, 0.045], // Upper coving step
      [1.0, 0.024, 0.066],  // Top projecting mantel crown cap (top at baseY + 0.078m)
    ];

    for (let tIdx = 0; tIdx < tiers.length; tIdx++) {
      const [frac, th, yOff] = tiers[tIdx]!;
      const oL = overhangLeftX * frac;
      const oR = overhangRightX * frac;
      const oB = overhangBackZ * frac;
      const oF = overhangFrontZ * frac;

      const outerMinX = cx - w * 0.5 - oL;
      const outerMaxX = cx + w * 0.5 + oR;
      const outerMinZ = cz - d * 0.5 - oB;
      const outerMaxZ = cz + d * 0.5 + oF;
      const fullW = outerMaxX - outerMinX;
      const centerX = (outerMinX + outerMaxX) * 0.5;
      const tierY = baseY + yOff;
      const tierName = `${prefix}.tier_${tIdx + 1}`;

      // 1. Front perimeter bar (+Z)
      if (!openSides?.front) {
        const frontD = outerMaxZ - innerMaxZ;
        const frontBar = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(fullW, th, frontD)),
          doveGreyMat
        );
        frontBar.name = `${tierName}.frontBar`;
        frontBar.position.set(centerX, tierY, (innerMaxZ + outerMaxZ) * 0.5);
        frontBar.castShadow = true;
        frontBar.receiveShadow = true;
        parent.add(frontBar);
      }

      // 2. Back perimeter bar (-Z)
      if (!openSides?.back) {
        const backD = innerMinZ - outerMinZ;
        const backBar = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(fullW, th, backD)),
          doveGreyMat
        );
        backBar.name = `${tierName}.backBar`;
        backBar.position.set(centerX, tierY, (outerMinZ + innerMinZ) * 0.5);
        backBar.castShadow = true;
        backBar.receiveShadow = true;
        parent.add(backBar);
      }

      // 3. Left perimeter bar (-X) spanning between back & front bars
      if (!openSides?.left) {
        const leftW = innerMinX - outerMinX;
        const leftBar = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(leftW, th, innerD)),
          doveGreyMat
        );
        leftBar.name = `${tierName}.leftBar`;
        leftBar.position.set((outerMinX + innerMinX) * 0.5, tierY, (innerMinZ + innerMaxZ) * 0.5);
        leftBar.castShadow = true;
        leftBar.receiveShadow = true;
        parent.add(leftBar);
      }

      // 4. Right perimeter bar (+X) spanning between back & front bars
      if (!openSides?.right) {
        const rightW = outerMaxX - innerMaxX;
        const rightBar = new THREE.Mesh(
          prepGeo(new THREE.BoxGeometry(rightW, th, innerD)),
          doveGreyMat
        );
        rightBar.name = `${tierName}.rightBar`;
        rightBar.position.set((innerMaxX + outerMaxX) * 0.5, tierY, (innerMinZ + innerMaxZ) * 0.5);
        rightBar.castShadow = true;
        rightBar.receiveShadow = true;
        parent.add(rightBar);
      }
    }
  };

  return {
    doveGreyMat,
    limestoneWorktopMat,
    wallPlasterMat,
    chromeKnobMat,
    stainlessSteelMat,
    ovenGlassMat,
    corniceVoidFloorMat,
    brushedStainlessTex,
    polishedChromeTex,
    addChromeKnob,
    addHowdensShakerDoor,
    addCovingMantelCornice,
  };
}
