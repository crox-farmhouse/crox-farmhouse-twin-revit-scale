import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createCourtyardStoneTexture,
  createWelshSlateRoofTexture,
} from '../../../../engine/textures/procedural-textures.ts';

export interface OutbuildingsBuilderKit {
  readonly exteriorBrickMat: THREE.Material;
  readonly stoneSillMat: THREE.Material;
  readonly courtyardDoorMat: THREE.Material;
  readonly courtyardDoorRecessMat: THREE.Material;
  readonly castIronMat: THREE.Material;
  readonly windowFrameMat: THREE.Material;
  readonly windowGlassMat: THREE.Material;
  readonly warmRoomPlasterMat: THREE.Material;
  readonly oakFloorMat: THREE.Material;
  readonly wallCapMat: THREE.Material;
  readonly applyWorldSpaceBrickUVs: (
    geo: THREE.BufferGeometry,
    ox: number,
    oy: number,
    oz: number
  ) => void;
  readonly addWallClimbingIvyCluster: (
    parent: THREE.Object3D,
    localX: number,
    localY: number,
    localZ: number,
    normalAxis: 'x' | 'z',
    outwardSign: 1 | -1,
    spanW: number,
    spanH: number,
    seed: number
  ) => void;
}

/**
 * Origin and orientation of the 5-Bay Outbuilding / Barn Range (`GYM`, `Garage`, `Store`, `Barn`, `Stable`)
 * running along the southern boundary of the Courtyard from the Split Driveway Gate (`X = -22.47m, Z = +16.00m`)
 * to the East Gable opposite the Kitchen & Grape-Vine Pergola (`X = +6.40m, Z = +13.51m`).
 */
export const OUTBUILDING_ORIGIN_X = -22.47;
export const OUTBUILDING_ORIGIN_Z = 16.0;
export const OUTBUILDING_ROTATION_Y = Math.atan2(2.49, 28.98); // +0.08571 rad (~4.91°)

const OUTBUILDING_COS = Math.cos(OUTBUILDING_ROTATION_Y);
const OUTBUILDING_SIN = Math.sin(OUTBUILDING_ROTATION_Y);

/**
 * Returns the world Z coordinate of the North Courtyard-facing wall of the Outbuilding Range
 * for a given world X coordinate (`wx`), used to clip the southern edge of the courtyard cobbles cleanly.
 */
export function getOutbuildingNorthWallWorldZ(wx: number): number {
  const dx = wx - OUTBUILDING_ORIGIN_X;
  const u = dx / OUTBUILDING_COS;
  const vNorth = u >= 14.96 && u <= 23.22 ? 0.14 : u > 23.22 ? 0.1 : 0.0;
  return OUTBUILDING_ORIGIN_Z - u * OUTBUILDING_SIN + vNorth * OUTBUILDING_COS;
}

/**
 * Builds the complete 5-Bay Outbuilding / Barn Range (`GYM`, `Garage`, `Store`, `Two-Storey Barn + First Floor`, `Stable`)
 * and the lush courtyard shrub border & Victorian post lantern shown in the aerial photos, courtyard photos, and floorplan.
 */
export function buildOutbuildingsAndBarns(
  ctx: SceneBuilderContext,
  kit: OutbuildingsBuilderKit
): void {
  const { scene, firstFloorMeshGroup, ceilingMeshGroup } = ctx;
  const {
    exteriorBrickMat,
    stoneSillMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    castIronMat,
    windowFrameMat,
    windowGlassMat,
    warmRoomPlasterMat,
    oakFloorMat,
    wallCapMat,
    applyWorldSpaceBrickUVs,
    addWallClimbingIvyCluster,
  } = kit;

  // Root groups aligned with the Outbuilding Range axis (Ground Floor, First Floor, and Roof)
  const groundGroup = new THREE.Group();
  groundGroup.name = 'outbuildings.groundShell';
  groundGroup.userData.isArchitecturalShell = true;
  groundGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  groundGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  scene.add(groundGroup);

  const firstFloorGroup = new THREE.Group();
  firstFloorGroup.name = 'outbuildings.firstFloor';
  firstFloorGroup.userData.isArchitecturalShell = true;
  firstFloorGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  firstFloorGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  firstFloorMeshGroup.add(firstFloorGroup);

  const roofGroup = new THREE.Group();
  roofGroup.name = 'outbuildings.roof';
  roofGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  roofGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  ceilingMeshGroup.add(roofGroup);

  // Materials for the Outbuilding Range
  const slateTex = createWelshSlateRoofTexture();
  const pantileRoofMat = new THREE.MeshStandardMaterial({
    map: slateTex,
    bumpMap: slateTex,
    bumpScale: 0.02,
    color: 0xb8a392, // Weathered warm grey-brown clay pantile / barn roof tint (Photos 2, 5, 6)
    roughness: 0.82,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const welshSlateMat = new THREE.MeshStandardMaterial({
    map: slateTex,
    bumpMap: slateTex,
    bumpScale: 0.018,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const coursedStoneTex = createCourtyardStoneTexture();
  const coursedFieldstoneMat = new THREE.MeshStandardMaterial({
    map: coursedStoneTex,
    bumpMap: coursedStoneTex,
    bumpScale: 0.028,
    color: 0xc8b290, // Warm honey-buff ironstone/limestone rubble masonry (Photo 10 left)
    roughness: 0.88,
    metalness: 0.02,
  });

  const darkBarnDoorMat = new THREE.MeshStandardMaterial({
    color: 0x3b332d,
    roughness: 0.76,
    metalness: 0.04,
  });

  const barnFloorMat = new THREE.MeshStandardMaterial({
    map: coursedStoneTex,
    color: 0x9e988e,
    roughness: 0.84,
    metalness: 0.03,
  });

  const gymFloorMat = new THREE.MeshStandardMaterial({
    color: 0x383a3e,
    roughness: 0.78,
    metalness: 0.04,
  });

  const shrubDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2f5425,
    roughness: 0.82,
  });
  const shrubMidMat = new THREE.MeshStandardMaterial({
    color: 0x457232,
    roughness: 0.78,
  });
  const shrubBrightMat = new THREE.MeshStandardMaterial({
    color: 0x5c8c3a,
    roughness: 0.75,
  });
  const soilBedMat = new THREE.MeshStandardMaterial({
    color: 0x3b2b1e,
    roughness: 0.94,
  });

  // Helper to compute local base ground elevation along u = 0..29.05m
  // Grades smoothly from Y = -0.60m at the West gate (u = 0) to Y = -0.18m at the Stable (u = 29m)
  const getBaseYAtU = (u: number): number => {
    const t = Math.max(0, Math.min(1, u / 28.5));
    const smooth = t * t * (3 - 2 * t);
    return -0.6 + 0.42 * smooth;
  };

  const wallT = 0.28;
  const partT = 0.2;

  // Helper to add a brick/plaster wall box in Outbuilding local coordinates (u, y, v)
  const addOutbuildingBrickWall = (
    parent: THREE.Object3D,
    uMin: number,
    uMax: number,
    yMin: number,
    yMax: number,
    vMin: number,
    vMax: number,
    plasterFaces: ReadonlyArray<'+x' | '-x' | '+z' | '-z'> = [],
    overrideExteriorMat: THREE.Material = exteriorBrickMat
  ): THREE.Mesh => {
    const w = uMax - uMin;
    const h = yMax - yMin;
    const d = vMax - vMin;
    const cu = (uMin + uMax) * 0.5;
    const cy = (yMin + yMax) * 0.5;
    const cv = (vMin + vMax) * 0.5;
    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, OUTBUILDING_ORIGIN_X + cu, cy, OUTBUILDING_ORIGIN_Z + cv);
    const pSet = new Set(plasterFaces);
    const mats: THREE.Material[] = [
      pSet.has('+x') ? warmRoomPlasterMat : overrideExteriorMat,
      pSet.has('-x') ? warmRoomPlasterMat : overrideExteriorMat,
      wallCapMat,
      overrideExteriorMat,
      pSet.has('+z') ? warmRoomPlasterMat : overrideExteriorMat,
      pSet.has('-z') ? warmRoomPlasterMat : overrideExteriorMat,
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.userData.isArchitecturalShell = true;
    mesh.position.set(cu, cy, cv);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Helper to add a vertical-boarded painted timber double garage / coach door or single barn door
  const addBoardedBarnDoor = (
    parent: THREE.Object3D,
    uCenter: number,
    yBase: number,
    vWallCenter: number,
    width: number,
    height: number,
    isDoubleLeaf: boolean,
    mat: THREE.Material = courtyardDoorMat
  ): void => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(uCenter, yBase, vWallCenter);

    // Timber outer frame jambs & head lintel
    const frameDepth = wallT + 0.02;
    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.12, 0.08, frameDepth),
      courtyardDoorRecessMat
    );
    headFrame.position.set(0, height + 0.04, 0);
    doorGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, height, frameDepth),
        courtyardDoorRecessMat
      );
      jamb.position.set(side * (width * 0.5 + 0.03), height * 0.5, 0);
      doorGroup.add(jamb);
    }

    // Reclaimed stone threshold sill
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.14, 0.045, wallT + 0.08),
      stoneSillMat
    );
    sill.position.set(0, 0.022, -0.02);
    sill.receiveShadow = true;
    doorGroup.add(sill);

    // Door leaf panel(s) with vertical boarding grooves & black wrought-iron strap hinges
    const numLeaves = isDoubleLeaf ? 2 : 1;
    const leafW = (width - (isDoubleLeaf ? 0.016 : 0)) / numLeaves;
    for (let l = 0; l < numLeaves; l++) {
      const lx = isDoubleLeaf ? (l === 0 ? -leafW * 0.5 - 0.004 : leafW * 0.5 + 0.004) : 0;
      const leafPanel = new THREE.Mesh(
        new THREE.BoxGeometry(leafW, height - 0.02, 0.052),
        mat
      );
      leafPanel.position.set(lx, height * 0.5 + 0.01, -0.04);
      leafPanel.castShadow = true;
      leafPanel.receiveShadow = true;
      doorGroup.add(leafPanel);

      // Vertical tongue-and-groove shadow battens along the front (-v) face
      const numPlanks = Math.max(4, Math.round(leafW / 0.14));
      for (let p = 1; p < numPlanks; p++) {
        const px = lx - leafW * 0.5 + (p / numPlanks) * leafW;
        const groove = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, height - 0.06, 0.058),
          courtyardDoorRecessMat
        );
        groove.position.set(px, height * 0.5 + 0.01, -0.04);
        doorGroup.add(groove);
      }

      // Upper and lower black wrought-iron strap hinges on the courtyard (-v) face
      const hingeSide = isDoubleLeaf ? (l === 0 ? -1 : 1) : -1;
      const hingeBaseX = lx + hingeSide * (leafW * 0.5 - 0.18);
      for (const hy of [height * 0.24, height * 0.78]) {
        const strap = new THREE.Mesh(
          new THREE.BoxGeometry(Math.min(0.36, leafW * 0.45), 0.036, 0.014),
          castIronMat
        );
        strap.position.set(hingeBaseX, hy, -0.07);
        doorGroup.add(strap);
      }
    }

    // Center iron ring latch
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.025), castIronMat);
    latch.position.set(isDoubleLeaf ? 0.03 : leafW * 0.36, height * 0.48, -0.072);
    doorGroup.add(latch);

    parent.add(doorGroup);
  };

  // Helper to add a multi-pane casement window in an Outbuilding wall
  const addOutbuildingWindow = (
    parent: THREE.Object3D,
    uCenter: number,
    yCenter: number,
    vCenter: number,
    width: number,
    height: number,
    alongV: boolean = false
  ): void => {
    const winGroup = new THREE.Group();
    winGroup.position.set(uCenter, yCenter, vCenter);
    if (alongV) {
      winGroup.rotation.y = Math.PI / 2;
    }

    // Stone sill & brick soldier header
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.08, 0.055, wallT + 0.06),
      stoneSillMat
    );
    sill.position.set(0, -height * 0.5 - 0.02, 0);
    winGroup.add(sill);

    // Outer white-painted timber frame
    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, height, 0.08),
        windowFrameMat
      );
      stile.position.set(side * (width * 0.5 - 0.025), 0, 0);
      winGroup.add(stile);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.05, 0.08),
        windowFrameMat
      );
      rail.position.set(0, side * (height * 0.5 - 0.025), 0);
      winGroup.add(rail);
    }

    // Center vertical mullion & horizontal transoms (6-pane cottage casement)
    const midMullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, height - 0.08, 0.065),
      windowFrameMat
    );
    winGroup.add(midMullion);

    const midTransom = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, 0.032, 0.065),
      windowFrameMat
    );
    winGroup.add(midTransom);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.09, height - 0.09, 0.018),
      windowGlassMat
    );
    winGroup.add(glass);

    parent.add(winGroup);
  };

  // Helper to build a double-pitched gable roof + brick gable triangles + eaves gutters
  const addPitchedOutbuildingRoofSection = (
    uMin: number,
    uMax: number,
    vMin: number,
    vMax: number,
    baseYWest: number,
    baseYEast: number,
    eaveRelH: number,
    ridgeRelH: number,
    roofMat: THREE.Material,
    addWestBrickGable: boolean,
    addEastBrickGable: boolean,
    westGableFloorRelH: number = eaveRelH,
    eastGableFloorRelH: number = eaveRelH
  ): void => {
    const vMid = (vMin + vMax) * 0.5;
    const halfSpanV = (vMax - vMin) * 0.5 + 0.2; // 0.20m eaves overhang
    const slopeRise = ridgeRelH - eaveRelH;
    const slopeLenV = Math.hypot(halfSpanV, slopeRise);
    const pitchAngle = Math.atan2(slopeRise, halfSpanV);
    const lenU = uMax - uMin + 0.24;
    const uMid = (uMin + uMax) * 0.5;
    const avgBaseY = (baseYWest + baseYEast) * 0.5;
    const uTiltZ = Math.atan2(baseYEast - baseYWest, uMax - uMin);

    const sectionRoofGroup = new THREE.Group();
    sectionRoofGroup.position.set(uMid, avgBaseY, vMid);
    sectionRoofGroup.rotation.z = uTiltZ;

    // North (-v) and South (+v) pitched roof slopes
    for (const sideV of [-1, 1] as const) {
      const slopeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(lenU, 0.055, slopeLenV),
        roofMat
      );
      slopeMesh.position.set(
        0,
        eaveRelH + slopeRise * 0.5,
        sideV * (halfSpanV * 0.5)
      );
      slopeMesh.rotation.x = sideV * pitchAngle;
      slopeMesh.castShadow = true;
      slopeMesh.receiveShadow = true;
      sectionRoofGroup.add(slopeMesh);

      // Black half-round cast-iron eaves gutter along North and South eaves
      const gutter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, lenU, 12, 1, true, Math.PI, Math.PI),
        castIronMat
      );
      gutter.rotation.z = Math.PI / 2;
      gutter.position.set(0, eaveRelH - 0.02, sideV * (halfSpanV + 0.03));
      sectionRoofGroup.add(gutter);
    }

    // Ridge roll cap
    const ridgeCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, lenU + 0.02, 12, 1, false, 0, Math.PI),
      castIronMat
    );
    ridgeCap.rotation.z = Math.PI / 2;
    ridgeCap.position.set(0, ridgeRelH + 0.02, 0);
    sectionRoofGroup.add(ridgeCap);

    roofGroup.add(sectionRoofGroup);

    // Brick gable end triangles at uMin and/or uMax
    const buildGableEndTriangle = (uWallMin: number, baseY: number, startRelH: number): void => {
      const shape = new THREE.Shape();
      const halfWallV = (vMax - vMin) * 0.5;
      shape.moveTo(-halfWallV, startRelH);
      shape.lineTo(halfWallV, startRelH);
      if (startRelH < eaveRelH) {
        shape.lineTo(halfWallV, eaveRelH);
        shape.lineTo(0, ridgeRelH);
        shape.lineTo(-halfWallV, eaveRelH);
      } else {
        const frac = (ridgeRelH - startRelH) / Math.max(0.05, ridgeRelH - eaveRelH);
        const wAtStart = halfWallV * frac;
        shape.moveTo(-wAtStart, startRelH);
        shape.lineTo(wAtStart, startRelH);
        shape.lineTo(0, ridgeRelH);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: wallT,
        bevelEnabled: false,
      });
      geo.rotateY(Math.PI / 2);
      applyWorldSpaceBrickUVs(
        geo,
        OUTBUILDING_ORIGIN_X + uWallMin,
        baseY,
        OUTBUILDING_ORIGIN_Z + vMid
      );
      const mesh = new THREE.Mesh(geo, exteriorBrickMat);
      mesh.position.set(uWallMin, baseY, vMid);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      roofGroup.add(mesh);
    };

    if (addWestBrickGable) {
      buildGableEndTriangle(uMin, baseYWest, westGableFloorRelH);
    }
    if (addEastBrickGable) {
      buildGableEndTriangle(uMax - wallT, baseYEast, eastGableFloorRelH);
    }
  };

  // =========================================================================
  // 1. BAY 1 (`GYM`: 5.49m x 5.15m) & BAY 2 (`GARAGE`: 6.10m x 5.15m)
  //    Single-Storey West Range: u = 0.00m..12.07m, v = 0.00m..5.71m
  //    (Photos 2, 3, 4, 5, 6, 7 & Floorplan Image 9)
  // =========================================================================
  const uGymStart = 0.0;
  const uGymEnd = 5.77; // 0.28m West wall + 5.49m GYM
  const uGarageEnd = 12.07; // + 0.20m partition + 6.10m Garage
  const vWestRangeNorth = 0.0;
  const vWestRangeSouth = 5.71; // 0.28m North + 5.15m internal + 0.28m South
  const westRangeWallH = 2.42;
  const westRangeRidgeH = 3.92;
  const baseY0 = getBaseYAtU(0); // -0.60m
  const baseY12 = getBaseYAtU(uGarageEnd); // -0.44m

  // GYM & Garage Ground Floor Slabs
  const gymFloor = new THREE.Mesh(
    new THREE.BoxGeometry(5.49, 0.12, 5.15),
    gymFloorMat
  );
  gymFloor.position.set(0.28 + 5.49 * 0.5, baseY0 - 0.05, 0.28 + 5.15 * 0.5);
  gymFloor.receiveShadow = true;
  groundGroup.add(gymFloor);

  const garageFloor = new THREE.Mesh(
    new THREE.BoxGeometry(6.1, 0.12, 5.15),
    barnFloorMat
  );
  garageFloor.position.set(5.97 + 6.1 * 0.5, (baseY0 + baseY12) * 0.5 - 0.05, 0.28 + 5.15 * 0.5);
  garageFloor.receiveShadow = true;
  groundGroup.add(garageFloor);

  // West Gable Wall of GYM facing the Front Road (u = 0.00m..0.28m, v = 0.00m..5.71m — Photos 2 & 3!)
  // Includes the dark-framed glazed entrance door/window at v = 1.45m..2.45m (Photo 2 & Floorplan)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + westRangeWallH, 0, 1.45, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 + 2.08, baseY0 + westRangeWallH, 1.45, 2.45, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + westRangeWallH, 2.45, vWestRangeSouth, ['+x']);
  addOutbuildingWindow(groundGroup, wallT * 0.5, baseY0 + 1.05, 1.95, 1.0, 2.05, true);

  // Massive Lush Climbing Ivy Mantle covering the West Gable Wall of the GYM (Photos 2, 3 & 6!)
  addWallClimbingIvyCluster(
    groundGroup,
    -0.02,
    baseY0,
    3.25,
    'x',
    -1,
    4.6,
    westRangeRidgeH - 0.15,
    301
  );

  // South-West Brick Boundary Wall & Timber Garden Gate to the right (South) of the GYM West Gable (Photo 2 & 4)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + 1.95, vWestRangeSouth, vWestRangeSouth + 0.45);
  addBoardedBarnDoor(groundGroup, wallT * 0.5, baseY0, vWestRangeSouth + 0.98, 1.02, 1.88, false, courtyardDoorMat);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + 1.98, vWestRangeSouth + 1.5, vWestRangeSouth + 3.2);

  // South Garden Wall of GYM & Garage (v = 5.43m..5.71m, u = 0.28m..12.07m)
  addOutbuildingBrickWall(
    groundGroup,
    wallT,
    uGarageEnd,
    baseY0 - 0.12,
    baseY12 + westRangeWallH,
    vWestRangeSouth - wallT,
    vWestRangeSouth,
    ['-z']
  );

  // Internal Partition Wall between GYM and Garage (u = 5.77m..5.97m) with doorway at v = 1.25m..2.15m (Floorplan Image 9)
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, baseY0 + westRangeWallH, wallT, 1.25, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0 + 2.08, baseY0 + westRangeWallH, 1.25, 2.15, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, baseY0 + westRangeWallH, 2.15, vWestRangeSouth - wallT, ['+x', '-x']);

  // North Courtyard Wall of GYM & Garage (v = 0.00m..0.28m, u = 0.28m..12.07m — Photos 5, 7 & Floorplan Image 9):
  // - Single door (u = 0.75m..1.65m) & window (u = 1.95m..2.55m)
  // - Double Coach/Garage Door #1 (u = 3.05m..5.45m, width 2.40m)
  // - Double Coach/Garage Door #2 (u = 6.35m..8.85m, width 2.50m)
  // - Single Garage Door (u = 10.15m..11.05m)
  const northWestWallTopY = baseY12 + westRangeWallH;
  addOutbuildingBrickWall(groundGroup, wallT, 0.75, baseY0 - 0.12, northWestWallTopY, 0, wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 0.75, 1.65, baseY0 + 2.04, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 1.2, baseY0, wallT * 0.5, 0.9, 2.04, false, courtyardDoorMat);

  addOutbuildingBrickWall(groundGroup, 1.65, 3.05, baseY0 - 0.12, northWestWallTopY, 0, wallT, ['+z']);
  addOutbuildingWindow(groundGroup, 2.25, baseY0 + 1.35, wallT * 0.5, 0.68, 0.92);

  // Double Grey-Painted Vertical-Boarded Garage Door #1 (Photo 7 left & Photo 5 right)
  addOutbuildingBrickWall(groundGroup, 3.05, 5.45, baseY0 + 2.1, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 4.25, baseY0 + 0.02, wallT * 0.5, 2.4, 2.08, true, courtyardDoorMat);

  addOutbuildingBrickWall(groundGroup, 5.45, 6.35, baseY0 - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Double Grey-Painted Vertical-Boarded Garage Door #2 (Photo 5 right)
  addOutbuildingBrickWall(groundGroup, 6.35, 8.85, baseY12 + 2.06, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 7.6, baseY12 - 0.04, wallT * 0.5, 2.5, 2.08, true, courtyardDoorMat);

  addOutbuildingBrickWall(groundGroup, 8.85, 10.15, baseY12 - 0.12, northWestWallTopY, 0, wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 10.15, 11.05, baseY12 + 2.04, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 10.6, baseY12, wallT * 0.5, 0.9, 2.04, false, courtyardDoorMat);
  addOutbuildingBrickWall(groundGroup, 11.05, uGarageEnd, baseY12 - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Tall Black Cast-Iron Victorian Post Lantern standing in front of the GYM North Brick Pier (Photo 7 left!)
  {
    const lampGroup = new THREE.Group();
    lampGroup.name = 'outbuildings.courtyardPostLamp';
    lampGroup.position.set(2.78, baseY0, -0.22);

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.095, 0.42, 12),
      castIronMat
    );
    lampBase.position.set(0, 0.21, 0);
    lampGroup.add(lampBase);

    const lampPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.052, 1.72, 12),
      castIronMat
    );
    lampPost.position.set(0, 1.28, 0);
    lampPost.castShadow = true;
    lampGroup.add(lampPost);

    const lanternCage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.09, 0.28, 6),
      windowGlassMat
    );
    lanternCage.position.set(0, 2.28, 0);
    lampGroup.add(lanternCage);

    const lanternHood = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.12, 6),
      castIronMat
    );
    lanternHood.position.set(0, 2.48, 0);
    lampGroup.add(lanternHood);

    groundGroup.add(lampGroup);
  }

  // Single-Storey Pitched Pantile Roof over GYM & Garage (u = 0.00m..12.07m)
  addPitchedOutbuildingRoofSection(
    uGymStart,
    uGarageEnd,
    vWestRangeNorth,
    vWestRangeSouth,
    baseY0,
    baseY12,
    westRangeWallH,
    westRangeRidgeH,
    pantileRoofMat,
    true,
    false
  );

  // =========================================================================
  // 2. BAY 3 (`STORE`: 2.65m x 5.15m) & BAY 4 (TWO-STOREY `BARN`: 8.02m x 4.85m + FIRST FLOOR ABOVE)
  //    Central Taller Barn Range: u = 12.07m..23.22m, v = 0.14m..5.55m
  //    (Photos 4, 5, 6, 10 & Floorplan Image 9: Outbuilding + Outbuilding First Floor)
  // =========================================================================
  const uStoreStart = uGarageEnd; // 12.07m
  const uBarnPartition = 14.96; // 12.07m + 0.24m wall + 2.65m Store
  const uBarnEnd = 23.22; // 14.96m + 0.24m wall + 8.02m Barn
  const vBarnNorth = 0.14;
  const vBarnSouth = 5.55; // 0.28m North + 4.85m internal + 0.28m South
  const barnGroundWallH = 2.18;
  const barnUpperEaveH = 3.48;
  const barnRidgeH = 5.18;
  const baseYStore = getBaseYAtU(uStoreStart); // -0.44m
  const baseYBarnEnd = getBaseYAtU(uBarnEnd); // -0.26m
  const baseYBarnMid = (baseYStore + baseYBarnEnd) * 0.5;

  // Store & Barn Ground Floor Slabs
  const storeFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.12, 4.85),
    barnFloorMat
  );
  storeFloor.position.set(12.31 + 2.65 * 0.5, baseYStore - 0.05, vBarnNorth + 0.28 + 4.85 * 0.5);
  storeFloor.receiveShadow = true;
  groundGroup.add(storeFloor);

  const barnFloor = new THREE.Mesh(
    new THREE.BoxGeometry(8.02, 0.12, 4.85),
    barnFloorMat
  );
  barnFloor.position.set(15.2 + 8.02 * 0.5, baseYBarnMid - 0.05, vBarnNorth + 0.28 + 4.85 * 0.5);
  barnFloor.receiveShadow = true;
  groundGroup.add(barnFloor);

  // Cross-Walls at u = 12.07m (Garage/Store), u = 14.96m (Store/Barn), and u = 23.22m (Barn/Stable)
  for (const uCross of [uStoreStart, uBarnPartition, uBarnEnd - 0.24]) {
    addOutbuildingBrickWall(
      groundGroup,
      uCross,
      uCross + 0.24,
      baseYStore - 0.12,
      baseYBarnMid + barnGroundWallH,
      vBarnNorth,
      vBarnSouth,
      ['+x', '-x']
    );
  }

  // South Garden Wall of Store & Barn (Ground Floor: y = base..base+barnGroundWallH)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uBarnEnd,
    baseYStore - 0.12,
    baseYBarnMid + barnGroundWallH,
    vBarnSouth - wallT,
    vBarnSouth,
    ['-z']
  );

  // North Courtyard Wall of Store & Barn (Ground Floor: v = 0.14m..0.42m, u = 12.07m..23.22m — Photo 5 center & Photo 10 left)
  // - Store Door at u = 13.05m..13.95m (Photo 5 center-right & Floorplan)
  // - Barn Door at u = 16.05m..17.05m (Floorplan)
  // - Twin Barn Casement Windows at u = 18.85m and u = 21.35m (Floorplan & Photo 10 left)
  const barnGroundTopY = baseYBarnMid + barnGroundWallH;
  addOutbuildingBrickWall(groundGroup, uStoreStart, 13.05, baseYStore - 0.12, barnGroundTopY, vBarnNorth, vBarnNorth + wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 13.05, 13.95, baseYStore + 2.02, barnGroundTopY, vBarnNorth, vBarnNorth + wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 13.5, baseYStore, vBarnNorth + wallT * 0.5, 0.9, 2.02, false, courtyardDoorMat);

  addOutbuildingBrickWall(groundGroup, 13.95, 16.05, baseYStore - 0.12, barnGroundTopY, vBarnNorth, vBarnNorth + wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 16.05, 17.05, baseYBarnMid + 2.02, barnGroundTopY, vBarnNorth, vBarnNorth + wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 16.55, baseYBarnMid, vBarnNorth + wallT * 0.5, 1.0, 2.02, false, darkBarnDoorMat);

  addOutbuildingBrickWall(groundGroup, 17.05, uBarnEnd, baseYBarnMid - 0.12, barnGroundTopY, vBarnNorth, vBarnNorth + wallT, ['+z']);
  addOutbuildingWindow(groundGroup, 18.85, baseYBarnMid + 1.32, vBarnNorth + wallT * 0.5, 0.92, 1.05);
  addOutbuildingWindow(groundGroup, 21.35, baseYBarnMid + 1.32, vBarnNorth + wallT * 0.5, 0.92, 1.05);

  // Cast-iron rainwater downpipe at the Garage / Store step-up junction (u = 12.15m, Photo 5 center-right)
  const barnDownpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, barnUpperEaveH - 0.1, 12),
    castIronMat
  );
  barnDownpipe.position.set(12.15, baseYStore + (barnUpperEaveH - 0.1) * 0.5, vBarnNorth - 0.04);
  groundGroup.add(barnDownpipe);

  // =========================================================================
  // OUTBUILDING FIRST FLOOR (14'1" x 16'9" = 4.30m x 5.10m + 18'4" x 16'9" = 5.60m x 5.10m)
  // Added to `firstFloorGroup` (`firstFloorMeshGroup`) so it is visible in 1st Floor & All Floors views!
  // =========================================================================
  const barnUpperFloorY = baseYBarnMid + barnGroundWallH;
  const barnUpperTopY = baseYBarnMid + barnUpperEaveH;

  // Timber First Floor Slab over Store & Barn (u = 12.31m..22.98m, v = 0.42m..5.27m)
  const barnUpperSlab = new THREE.Mesh(
    new THREE.BoxGeometry(10.67, 0.14, 4.85),
    oakFloorMat
  );
  barnUpperSlab.position.set(12.31 + 10.67 * 0.5, barnUpperFloorY - 0.04, vBarnNorth + wallT + 4.85 * 0.5);
  barnUpperSlab.receiveShadow = true;
  firstFloorGroup.add(barnUpperSlab);

  // Upper Exterior Brick Walls of the Two-Storey Barn (y = barnUpperFloorY..barnUpperTopY)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    barnUpperFloorY,
    barnUpperTopY,
    vBarnNorth,
    vBarnNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    barnUpperFloorY,
    barnUpperTopY,
    vBarnSouth - wallT,
    vBarnSouth,
    ['-z']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uStoreStart + 0.24,
    barnUpperFloorY,
    barnUpperTopY,
    vBarnNorth + wallT,
    vBarnSouth - wallT,
    ['+x']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - 0.24,
    uBarnEnd,
    barnUpperFloorY,
    barnUpperTopY,
    vBarnNorth + wallT,
    vBarnSouth - wallT,
    ['-x']
  );

  // Internal 1st-Floor Partition Wall between the 4.30m x 5.10m Room and 5.60m x 5.10m Room (u = 16.95m, Floorplan Image 9)
  addOutbuildingBrickWall(
    firstFloorGroup,
    16.95,
    17.13,
    barnUpperFloorY,
    barnUpperTopY,
    vBarnNorth + wallT,
    2.45,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    16.95,
    17.13,
    barnUpperFloorY,
    barnUpperTopY,
    3.35,
    vBarnSouth - wallT,
    ['+x', '-x']
  );

  // Central `UP` steps through the 1st-floor partition opening (u = 16.55m..17.15m, v = 2.45m..3.35m) & SE Corner `DN` Staircase (Floorplan Image 9)
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, 0.88),
      oakFloorMat
    );
    step.position.set(16.65 + s * 0.24, barnUpperFloorY + 0.08 * (s + 1), 2.9);
    firstFloorGroup.add(step);
  }
  for (let s = 0; s < 10; s++) {
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.04, 0.24),
      oakFloorMat
    );
    tread.position.set(12.85, barnUpperFloorY - s * 0.2, 4.95 - s * 0.24);
    firstFloorGroup.add(tread);
  }

  // Shuttered Upper Barn Hayloft Window on the North Courtyard Wall (u = 19.65m, Photo 5 center!)
  addOutbuildingWindow(firstFloorGroup, 19.65, barnUpperFloorY + 0.68, vBarnNorth + wallT * 0.5, 0.78, 0.78);
  // East Gable 1st-Floor Window (shown on Outbuilding First Floor plan in Image 9!)
  addOutbuildingWindow(firstFloorGroup, uBarnEnd - 0.12, barnUpperFloorY + 0.85, (vBarnNorth + vBarnSouth) * 0.5, 0.92, 1.05, true);

  // Massive Cascading Climbing Ivy Mantle on the North Courtyard Wall of the Two-Storey Barn (u = 14.1m..17.9m, Photo 5 center!)
  addWallClimbingIvyCluster(
    groundGroup,
    15.85,
    baseYStore + 0.35,
    vBarnNorth - 0.02,
    'z',
    -1,
    3.8,
    barnUpperEaveH - 0.45,
    409
  );

  // Large Multi-Shrub Courtyard Border Bed in front of the Two-Storey Barn Ivy Wall (u = 13.8m..18.4m, v = -1.55m..0.14m — Photo 5 center!)
  {
    const barnShrubGroup = new THREE.Group();
    barnShrubGroup.name = 'outbuildings.courtyardShrubBed';

    const bedSoil = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.14, 1.45),
      soilBedMat
    );
    bedSoil.position.set(16.1, baseYStore + 0.05, -0.58);
    bedSoil.receiveShadow = true;
    barnShrubGroup.add(bedSoil);

    const shrubSpecs: ReadonlyArray<readonly [number, number, number, number, THREE.Material]> = [
      [14.45, -0.55, 0.78, 1.35, shrubBrightMat],
      [15.35, -0.72, 0.92, 1.52, shrubMidMat],
      [16.35, -0.65, 0.96, 1.58, shrubBrightMat],
      [17.35, -0.58, 0.85, 1.42, shrubDarkMat],
      [18.05, -0.48, 0.68, 1.18, shrubMidMat],
    ];
    for (const [su, sv, sr, sh, sMat] of shrubSpecs) {
      // Multi-stem woody base trunks (visible at the bottom of the shrubs in Photo 5 center!)
      for (const du of [-0.14, 0.0, 0.14]) {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.032, 0.55, 6),
          darkBarnDoorMat
        );
        stem.position.set(su + du, baseYStore + 0.28, sv);
        stem.rotation.z = du * 0.6;
        barnShrubGroup.add(stem);
      }

      // Layered organic foliage mounds
      for (const [lu, ly, lv, lScale] of [
        [0, sh * 0.62, 0, 1.0],
        [-sr * 0.35, sh * 0.52, sr * 0.22, 0.72],
        [sr * 0.36, sh * 0.55, -sr * 0.18, 0.75],
        [0.05, sh * 0.78, -sr * 0.2, 0.68],
      ] as const) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(sr * lScale, 14, 12), sMat);
        dome.scale.set(1.08, 0.82, 0.96);
        dome.position.set(su + lu, baseYStore + ly, sv + lv);
        dome.castShadow = true;
        dome.receiveShadow = true;
        barnShrubGroup.add(dome);
      }
    }

    groundGroup.add(barnShrubGroup);
  }

  // Taller Two-Storey Pitched Pantile/Slate Roof over Store & Barn (u = 12.07m..23.22m)
  addPitchedOutbuildingRoofSection(
    uStoreStart,
    uBarnEnd,
    vBarnNorth,
    vBarnSouth,
    baseYStore,
    baseYBarnEnd,
    barnUpperEaveH,
    barnRidgeH,
    pantileRoofMat,
    true,
    true,
    westRangeWallH - 0.15,
    2.68 - 0.15
  );

  // =========================================================================
  // 3. BAY 5 (`STABLE`: 18'3" x 16'3" = 5.55m x 4.95m)
  //    East Single-Storey Wing opposite the Walled Grape-Vine Pergola Court:
  //    u = 23.22m..29.05m, v = 0.10m..5.61m (Photos 1, 6, 10, 11 & Floorplan Image 9)
  // =========================================================================
  const uStableStart = uBarnEnd; // 23.22m
  const uStableEnd = 29.05; // 23.22m + 5.55m Stable + 0.28m East Gable wall
  const vStableNorth = 0.1;
  const vStableSouth = 5.61; // 0.28m North + 4.95m internal + 0.28m South
  const stableWallH = 2.68;
  const stableRidgeH = 4.35;
  const baseYStableStart = getBaseYAtU(uStableStart); // -0.26m
  const baseYStableEnd = getBaseYAtU(uStableEnd); // -0.18m
  const baseYStableMid = (baseYStableStart + baseYStableEnd) * 0.5;

  // Stable Ground Floor Slab
  const stableFloor = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.12, 4.95),
    barnFloorMat
  );
  stableFloor.position.set(uStableStart + 5.55 * 0.5, baseYStableMid - 0.05, vStableNorth + wallT + 4.95 * 0.5);
  stableFloor.receiveShadow = true;
  groundGroup.add(stableFloor);

  // North Wall of Stable facing the Cobbled Alleyway (Photo 10 left!):
  // - Western half (u = 23.22m..25.65m): Coursed honey-buff fieldstone rubble masonry (Photo 10 foreground-left!)
  // - Eastern half (u = 25.65m..29.05m): Handmade red brick with white-framed multi-pane window (u = 26.25m) & dark timber stable door (u = 27.65m)
  const stableTopY = baseYStableEnd + stableWallH;
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    25.65,
    baseYStableStart - 0.12,
    stableTopY,
    vStableNorth,
    vStableNorth + wallT,
    ['+z'],
    coursedFieldstoneMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    25.65,
    27.15,
    baseYStableMid - 0.12,
    stableTopY,
    vStableNorth,
    vStableNorth + wallT,
    ['+z']
  );
  addOutbuildingWindow(groundGroup, 26.35, baseYStableMid + 1.42, vStableNorth + wallT * 0.5, 0.86, 1.05);

  // Dark-stained Stable Door at u = 27.15m..28.05m (Photo 10 mid-left & Floorplan)
  addOutbuildingBrickWall(
    groundGroup,
    27.15,
    28.05,
    baseYStableEnd + 2.04,
    stableTopY,
    vStableNorth,
    vStableNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(groundGroup, 27.6, baseYStableEnd, vStableNorth + wallT * 0.5, 0.9, 2.04, false, darkBarnDoorMat);

  addOutbuildingBrickWall(
    groundGroup,
    28.05,
    uStableEnd,
    baseYStableEnd - 0.12,
    stableTopY,
    vStableNorth,
    vStableNorth + wallT,
    ['+z']
  );

  // Low Brick-Edged Herb & Lavender Border along the North base of the Stable Wall in the Cobbled Alley (Photo 10 foreground-left!)
  {
    const herbKerb = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.24, 0.12),
      exteriorBrickMat
    );
    herbKerb.position.set(24.85, baseYStableStart + 0.1, vStableNorth - 0.42);
    groundGroup.add(herbKerb);

    const herbSoil = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 0.18, 0.4),
      soilBedMat
    );
    herbSoil.position.set(24.85, baseYStableStart + 0.07, vStableNorth - 0.2);
    groundGroup.add(herbSoil);

    for (let h = 0; h < 6; h++) {
      const tuft = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 8),
        h % 2 === 0 ? shrubMidMat : shrubBrightMat
      );
      tuft.scale.set(1.15, 0.78, 0.88);
      tuft.position.set(23.55 + h * 0.52, baseYStableStart + 0.26, vStableNorth - 0.2);
      tuft.castShadow = true;
      groundGroup.add(tuft);
    }
  }

  // South Wall of Stable (v = 5.33m..5.61m, u = 23.22m..29.05m)
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    uStableEnd,
    baseYStableStart - 0.12,
    stableTopY,
    vStableSouth - wallT,
    vStableSouth,
    ['-z']
  );

  // East Gable End of Stable (u = 28.77m..29.05m, v = 0.10m..5.61m) with Large Rectangular Gable Window (Photo 1 bottom-left & Floorplan Image 9!)
  const vStableMid = (vStableNorth + vStableSouth) * 0.5;
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.12,
    stableTopY,
    vStableNorth,
    vStableMid - 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.12,
    baseYStableEnd + 0.72,
    vStableMid - 0.62,
    vStableMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd + 2.22,
    stableTopY,
    vStableMid - 0.62,
    vStableMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.12,
    stableTopY,
    vStableMid + 0.62,
    vStableSouth,
    ['-x']
  );
  addOutbuildingWindow(
    groundGroup,
    uStableEnd - wallT * 0.5,
    baseYStableEnd + 1.47,
    vStableMid,
    1.24,
    1.5,
    true
  );

  // Pitched Welsh Slate Roof over Stable (u = 23.22m..29.05m, Photo 1 bottom-left!)
  addPitchedOutbuildingRoofSection(
    uStableStart,
    uStableEnd,
    vStableNorth,
    vStableSouth,
    baseYStableStart,
    baseYStableEnd,
    stableWallH,
    stableRidgeH,
    welshSlateMat,
    false,
    true
  );
}
