import * as THREE from 'three';
import { buildAngledWallSegment, buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import { createNaturalOakJoineryTextures } from '../../../../engine/textures/procedural-textures.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

function ensureNamedAddedChildren(
  parent: THREE.Object3D,
  startIdx: number,
  prefix: string
): void {
  let meshCount = 0;
  let groupCount = 0;
  for (let i = startIdx; i < parent.children.length; i++) {
    const child = parent.children[i]!;
    child.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (!node.name) {
          meshCount += 1;
          node.name = `${prefix}.mesh_${meshCount}`;
        }
        const geo = node.geometry as THREE.BufferGeometry | undefined;
        if (geo && !geo.boundingSphere) {
          geo.computeBoundingSphere();
        }
      } else if (node instanceof THREE.Group && !node.name) {
        groupCount += 1;
        node.name = groupCount === 1 && node === child ? prefix : `${prefix}.group_${groupCount}`;
      }
    });
  }
}

function tagHighLodDetail(mesh: THREE.Mesh): void {
  mesh.userData.lodTier = 'high';
  mesh.userData.lodMaxDistance = 12;
}

/**
 * Main staircase landing (`upperLanding`).
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildUpperLanding(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'skirtingMat' | 'upperWallTopY' | 'wallCapMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteriorWall' | 'applyWorldSpaceBrickUVs' | 'doorH' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addUpperBrickWallAlongXWithWindow,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    tagUpperCutawayWall,
    upperWallTopY,
    wallCapMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 3. MAIN STAIRCASE LANDING (DN) — Matching New Photos 3 & 4
  //    Directly above Entrance Hall with Stairs: X = -13.05m..-17.73m, Z = -2.50m..+2.40m
  //    With open Stairwell Void (X = -17.73m..-15.05m, Z = -2.50m..-0.58m) above the Quarter-Turn Staircase:
  //    - Warm woven British wool loop-pile carpet (`oakFloorMat`) continuous throughout upstairs
  //    - Organic lime-plastered East chimney breast wide at the base on the left (North) side
  //    - Solid North brick wall with exposed lower brickwork and horizontal middle timber beam
  //    - Heavy dark black-stained timber ceiling beam & West wall timber framing posts (Photos 3 & 4)
  //    - South courtyard window with cast-iron column radiator underneath (Photo 4 left)
  // =========================================================================
  // Natural matte European oak beam material matching the Entrance Hall beams downstairs (`oakMat`)
  const naturalOakTex = createNaturalOakJoineryTextures();
  const darkTimberBeamMat = new THREE.MeshStandardMaterial({
    map: naturalOakTex.colorMap,
    bumpMap: naturalOakTex.bumpMap,
    bumpScale: 0.0035,
    color: 0xdcc8ae,
    roughness: 0.62,
    metalness: 0.02,
  });

  // Issue #13: Stripped natural European oak for handrails, shoe rails & detailed newel posts,
  // paired with slender 16mm matt black wrought/cast iron spindles
  const strippedBannisterOakMat = new THREE.MeshStandardMaterial({
    map: naturalOakTex.colorMap,
    bumpMap: naturalOakTex.bumpMap,
    bumpScale: 0.0035,
    color: 0xd8c3a5,
    roughness: 0.56,
    metalness: 0.02,
  });
  const blackIronSpindleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d20,
    roughness: 0.42,
    metalness: 0.72,
  });

  const interiorEavesY = 3.86;
  const collarCeilingY = 4.65;
  const westWingCorridorFloorY = 2.095; // Survey2Plan -65mm step down into Room 18 North Lobby

  // Non-Square Polygonal Floor Slab for Main Staircase Landing (wrapping around the X = -17.69m..-15.36m, Z = -2.50m..-0.58m stairwell void,
  // stopping at the z_ew = 2.22m North face of the 0.46m South wall, and extending into the West Cross-Wall cased opening reveal z_ew = 1.232m..2.090m!)
  const landingFloorSlab = buildPolygonalFloorSlab(
    scene,
    [
      [-15.36, -2.5],
      [-13.05, -2.5],
      [-13.05, 2.22],
      [-17.887, 2.22],
      [-17.878, 2.09],
      [-17.998, 2.09],
      [-17.937, 1.232],
      [-17.817, 1.232],
      [-17.688, -0.58],
      [-15.36, -0.58],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );
  landingFloorSlab.name = 'upperLanding.floorSlab';
  landingFloorSlab.userData.isArchitecturalShell = true;
  landingFloorSlab.geometry.computeBoundingSphere();

  // Stripped-Oak Balustrade & Black-Iron Spindle Gallery around the Stairwell Opening on the First Floor Landing (Issue #13)
  // Issue #8: Extend South gallery handrail & balustrade along Z = -0.58m all the way to the West cross-wall (X = -17.57m..-15.36m)
  const landingRailGroup = new THREE.Group();
  landingRailGroup.name = 'upperLanding.balustrade';
  const southRailStartX = -17.57;
  const southRailEndX = -15.36;
  const southRailSpan = southRailEndX - southRailStartX; // 2.21m
  const southRailCenterX = (southRailStartX + southRailEndX) / 2; // -16.465m

  // Contoured 0.068m wide stripped-oak top handrail + recessed moulded under-fillet
  const southGalleryRailGeo = new THREE.BoxGeometry(southRailSpan, 0.042, 0.068);
  southGalleryRailGeo.computeBoundingSphere();
  const southGalleryRail = new THREE.Mesh(southGalleryRailGeo, strippedBannisterOakMat);
  southGalleryRail.name = 'upperLanding.southGalleryRail';
  southGalleryRail.position.set(southRailCenterX, floorTopY + 0.886, -0.58);
  southGalleryRail.castShadow = true;
  landingRailGroup.add(southGalleryRail);

  const southGalleryRailFilletGeo = new THREE.BoxGeometry(southRailSpan, 0.016, 0.052);
  southGalleryRailFilletGeo.computeBoundingSphere();
  const southGalleryRailFillet = new THREE.Mesh(southGalleryRailFilletGeo, strippedBannisterOakMat);
  southGalleryRailFillet.name = 'upperLanding.southGalleryRail.underFillet';
  southGalleryRailFillet.position.set(southRailCenterX, floorTopY + 0.857, -0.58);
  tagHighLodDetail(southGalleryRailFillet);
  landingRailGroup.add(southGalleryRailFillet);

  const southGalleryShoeRailGeo = new THREE.BoxGeometry(southRailSpan, 0.032, 0.056);
  southGalleryShoeRailGeo.computeBoundingSphere();
  const southGalleryShoeRail = new THREE.Mesh(southGalleryShoeRailGeo, strippedBannisterOakMat);
  southGalleryShoeRail.name = 'upperLanding.southGalleryShoeRail';
  southGalleryShoeRail.position.set(southRailCenterX, floorTopY + 0.016, -0.58);
  landingRailGroup.add(southGalleryShoeRail);

  const southGalleryShoeBeadGeo = new THREE.BoxGeometry(southRailSpan, 0.01, 0.042);
  southGalleryShoeBeadGeo.computeBoundingSphere();
  const southGalleryShoeBead = new THREE.Mesh(southGalleryShoeBeadGeo, strippedBannisterOakMat);
  southGalleryShoeBead.name = 'upperLanding.southGalleryShoeRail.topBead';
  southGalleryShoeBead.position.set(southRailCenterX, floorTopY + 0.037, -0.58);
  tagHighLodDetail(southGalleryShoeBead);
  landingRailGroup.add(southGalleryShoeBead);

  // Slender 16mm square forged black-iron spindles + cast-iron base shoes & central forged collar knuckles
  const sharedBalustradeSpindleGeo = new THREE.BoxGeometry(0.016, 0.82, 0.016);
  sharedBalustradeSpindleGeo.computeBoundingSphere();
  const sharedSpindleBaseShoeGeo = new THREE.BoxGeometry(0.026, 0.014, 0.026);
  sharedSpindleBaseShoeGeo.computeBoundingSphere();
  const sharedSpindleCollarGeo = new THREE.BoxGeometry(0.024, 0.024, 0.024);
  sharedSpindleCollarGeo.computeBoundingSphere();

  const southSpindleCount = 14;
  for (let i = 0; i < southSpindleCount; i++) {
    const gx = THREE.MathUtils.lerp(-17.43, -15.5, i / (southSpindleCount - 1));
    const spindle = new THREE.Mesh(sharedBalustradeSpindleGeo, blackIronSpindleMat);
    spindle.name = `upperLanding.balustrade.southSpindle_${i + 1}`;
    spindle.position.set(gx, floorTopY + 0.445, -0.58);
    spindle.castShadow = true;
    tagHighLodDetail(spindle);
    landingRailGroup.add(spindle);

    const baseShoe = new THREE.Mesh(sharedSpindleBaseShoeGeo, blackIronSpindleMat);
    baseShoe.name = `upperLanding.balustrade.southSpindle_${i + 1}.baseShoe`;
    baseShoe.position.set(gx, floorTopY + 0.048, -0.58);
    tagHighLodDetail(baseShoe);
    landingRailGroup.add(baseShoe);

    const collarKnuckle = new THREE.Mesh(sharedSpindleCollarGeo, blackIronSpindleMat);
    collarKnuckle.name = `upperLanding.balustrade.southSpindle_${i + 1}.collarKnuckle`;
    collarKnuckle.position.set(gx, floorTopY + 0.445, -0.58);
    tagHighLodDetail(collarKnuckle);
    landingRailGroup.add(collarKnuckle);
  }

  // Helper to add tasteful stripped-oak English joinery details to a square newel post:
  // base plinth collar, stopped-chamfered / recessed shaft panel framing, neck groove + necking ring,
  // and stepped bevelled low-profile pyramid cap crown.
  const addDetailedNewelJoinery = (
    prefix: string,
    cx: number,
    baseY: number,
    totalH: number,
    cz: number,
    isHalfNewel = false
  ): void => {
    const sx = isHalfNewel ? 0.068 : 0.092;
    const sz = 0.092;
    const plinthW = isHalfNewel ? 0.078 : 0.104;
    const plinthD = 0.104;
    const collarW = isHalfNewel ? 0.074 : 0.098;
    const collarD = 0.098;
    const neckRingW = isHalfNewel ? 0.08 : 0.106;
    const neckRingD = 0.106;

    // 1. Base plinth collar at floor level
    const plinthGeo = new THREE.BoxGeometry(plinthW, 0.068, plinthD);
    plinthGeo.computeBoundingSphere();
    const plinth = new THREE.Mesh(plinthGeo, strippedBannisterOakMat);
    plinth.name = `${prefix}.basePlinth`;
    plinth.position.set(cx, baseY + 0.034, cz);
    plinth.castShadow = true;
    landingRailGroup.add(plinth);

    const plinthLedgeGeo = new THREE.BoxGeometry(collarW, 0.014, collarD);
    plinthLedgeGeo.computeBoundingSphere();
    const plinthLedge = new THREE.Mesh(plinthLedgeGeo, strippedBannisterOakMat);
    plinthLedge.name = `${prefix}.basePlinthLedge`;
    plinthLedge.position.set(cx, baseY + 0.075, cz);
    tagHighLodDetail(plinthLedge);
    landingRailGroup.add(plinthLedge);

    // 2. Stopped-chamfer / recessed vertical shaft framing (lower & upper shaft collars + corner stiles)
    const lowerCollarY = baseY + 0.17;
    const upperCollarY = baseY + totalH - 0.12;
    const shaftCollarGeo = new THREE.BoxGeometry(collarW, 0.022, collarD);
    shaftCollarGeo.computeBoundingSphere();

    const lowerShaftCollar = new THREE.Mesh(shaftCollarGeo, strippedBannisterOakMat);
    lowerShaftCollar.name = `${prefix}.lowerShaftCollar`;
    lowerShaftCollar.position.set(cx, lowerCollarY, cz);
    tagHighLodDetail(lowerShaftCollar);
    landingRailGroup.add(lowerShaftCollar);

    const upperShaftCollar = new THREE.Mesh(shaftCollarGeo, strippedBannisterOakMat);
    upperShaftCollar.name = `${prefix}.upperShaftCollar`;
    upperShaftCollar.position.set(cx, upperCollarY, cz);
    tagHighLodDetail(upperShaftCollar);
    landingRailGroup.add(upperShaftCollar);

    const stileH = upperCollarY - lowerCollarY - 0.022;
    const stileGeo = new THREE.BoxGeometry(0.018, stileH, 0.018);
    stileGeo.computeBoundingSphere();
    const cornerOffsets: ReadonlyArray<readonly [number, number]> = isHalfNewel
      ? [
          [sx * 0.5 - 0.006, -sz * 0.5 + 0.006],
          [sx * 0.5 - 0.006, sz * 0.5 - 0.006],
        ]
      : [
          [-sx * 0.5 + 0.006, -sz * 0.5 + 0.006],
          [sx * 0.5 - 0.006, -sz * 0.5 + 0.006],
          [-sx * 0.5 + 0.006, sz * 0.5 - 0.006],
          [sx * 0.5 - 0.006, sz * 0.5 - 0.006],
        ];
    cornerOffsets.forEach(([ox, oz], idx) => {
      const stile = new THREE.Mesh(stileGeo, strippedBannisterOakMat);
      stile.name = `${prefix}.shaftStile_${idx + 1}`;
      stile.position.set(cx + ox, (lowerCollarY + upperCollarY) * 0.5, cz + oz);
      tagHighLodDetail(stile);
      landingRailGroup.add(stile);
    });

    // 3. Moulded necking ring / shadow-gap collar just below the newel cap
    const neckRingGeo = new THREE.BoxGeometry(neckRingW, 0.018, neckRingD);
    neckRingGeo.computeBoundingSphere();
    const neckRing = new THREE.Mesh(neckRingGeo, strippedBannisterOakMat);
    neckRing.name = `${prefix}.neckRing`;
    neckRing.position.set(cx, baseY + totalH - 0.024, cz);
    neckRing.castShadow = true;
    tagHighLodDetail(neckRing);
    landingRailGroup.add(neckRing);

    // 4. Stepped low-profile bevelled pyramid crown above the newel cap
    const crownStepGeo = new THREE.BoxGeometry(
      isHalfNewel ? 0.072 : 0.098,
      0.012,
      0.098
    );
    crownStepGeo.computeBoundingSphere();
    const crownStep = new THREE.Mesh(crownStepGeo, strippedBannisterOakMat);
    crownStep.name = `${prefix}Cap.crownStep`;
    crownStep.position.set(cx, baseY + totalH + 0.03, cz);
    tagHighLodDetail(crownStep);
    landingRailGroup.add(crownStep);

    const crownApexGeo = new THREE.BoxGeometry(
      isHalfNewel ? 0.054 : 0.074,
      0.01,
      0.074
    );
    crownApexGeo.computeBoundingSphere();
    const crownApex = new THREE.Mesh(crownApexGeo, strippedBannisterOakMat);
    crownApex.name = `${prefix}Cap.crownApex`;
    crownApex.position.set(cx, baseY + totalH + 0.041, cz);
    tagHighLodDetail(crownApex);
    landingRailGroup.add(crownApex);
  };

  // West wall half-newel post where the South gallery rail meets the West cross-wall (X = -17.535m, Z = -0.58m)
  const westWallNewelGeo = new THREE.BoxGeometry(0.068, 0.96, 0.088);
  westWallNewelGeo.computeBoundingSphere();
  const westWallNewel = new THREE.Mesh(westWallNewelGeo, strippedBannisterOakMat);
  westWallNewel.name = 'upperLanding.westWallNewel';
  westWallNewel.position.set(-17.535, floorTopY + 0.48, -0.58);
  westWallNewel.castShadow = true;
  landingRailGroup.add(westWallNewel);

  const westWallNewelCapGeo = new THREE.BoxGeometry(0.086, 0.024, 0.118);
  westWallNewelCapGeo.computeBoundingSphere();
  const westWallNewelCap = new THREE.Mesh(westWallNewelCapGeo, strippedBannisterOakMat);
  westWallNewelCap.name = 'upperLanding.westWallNewelCap';
  westWallNewelCap.position.set(-17.535, floorTopY + 0.972, -0.58);
  tagHighLodDetail(westWallNewelCap);
  landingRailGroup.add(westWallNewelCap);
  addDetailedNewelJoinery('upperLanding.westWallNewel', -17.535, floorTopY, 0.96, -0.58, true);

  // East gallery return handrail at X = -15.36m (Z = -1.65m..-0.58m)
  const eastGalleryRailGeo = new THREE.BoxGeometry(0.068, 0.042, 1.07);
  eastGalleryRailGeo.computeBoundingSphere();
  const eastGalleryRail = new THREE.Mesh(eastGalleryRailGeo, strippedBannisterOakMat);
  eastGalleryRail.name = 'upperLanding.eastGalleryRail';
  eastGalleryRail.position.set(-15.36, floorTopY + 0.886, -1.115);
  eastGalleryRail.castShadow = true;
  landingRailGroup.add(eastGalleryRail);

  const eastGalleryRailFilletGeo = new THREE.BoxGeometry(0.052, 0.016, 1.07);
  eastGalleryRailFilletGeo.computeBoundingSphere();
  const eastGalleryRailFillet = new THREE.Mesh(eastGalleryRailFilletGeo, strippedBannisterOakMat);
  eastGalleryRailFillet.name = 'upperLanding.eastGalleryRail.underFillet';
  eastGalleryRailFillet.position.set(-15.36, floorTopY + 0.857, -1.115);
  tagHighLodDetail(eastGalleryRailFillet);
  landingRailGroup.add(eastGalleryRailFillet);

  const eastGalleryShoeRailGeo = new THREE.BoxGeometry(0.056, 0.032, 1.07);
  eastGalleryShoeRailGeo.computeBoundingSphere();
  const eastGalleryShoeRail = new THREE.Mesh(eastGalleryShoeRailGeo, strippedBannisterOakMat);
  eastGalleryShoeRail.name = 'upperLanding.eastGalleryShoeRail';
  eastGalleryShoeRail.position.set(-15.36, floorTopY + 0.016, -1.115);
  landingRailGroup.add(eastGalleryShoeRail);

  const eastGalleryShoeBeadGeo = new THREE.BoxGeometry(0.042, 0.01, 1.07);
  eastGalleryShoeBeadGeo.computeBoundingSphere();
  const eastGalleryShoeBead = new THREE.Mesh(eastGalleryShoeBeadGeo, strippedBannisterOakMat);
  eastGalleryShoeBead.name = 'upperLanding.eastGalleryShoeRail.topBead';
  eastGalleryShoeBead.position.set(-15.36, floorTopY + 0.037, -1.115);
  tagHighLodDetail(eastGalleryShoeBead);
  landingRailGroup.add(eastGalleryShoeBead);

  let eastSpindleIdx = 0;
  for (let gz = -1.52; gz <= -0.72; gz += 0.16) {
    eastSpindleIdx += 1;
    const spindle = new THREE.Mesh(sharedBalustradeSpindleGeo, blackIronSpindleMat);
    spindle.name = `upperLanding.balustrade.eastSpindle_${eastSpindleIdx}`;
    spindle.position.set(-15.36, floorTopY + 0.445, gz);
    spindle.castShadow = true;
    tagHighLodDetail(spindle);
    landingRailGroup.add(spindle);

    const baseShoe = new THREE.Mesh(sharedSpindleBaseShoeGeo, blackIronSpindleMat);
    baseShoe.name = `upperLanding.balustrade.eastSpindle_${eastSpindleIdx}.baseShoe`;
    baseShoe.position.set(-15.36, floorTopY + 0.048, gz);
    tagHighLodDetail(baseShoe);
    landingRailGroup.add(baseShoe);

    const collarKnuckle = new THREE.Mesh(sharedSpindleCollarGeo, blackIronSpindleMat);
    collarKnuckle.name = `upperLanding.balustrade.eastSpindle_${eastSpindleIdx}.collarKnuckle`;
    collarKnuckle.position.set(-15.36, floorTopY + 0.445, gz);
    tagHighLodDetail(collarKnuckle);
    landingRailGroup.add(collarKnuckle);
  }

  // Corner Newel Post at the SE corner of the stairwell opening (X = -15.36m, Z = -0.58m)
  const cornerNewelGeo = new THREE.BoxGeometry(0.088, 0.96, 0.088);
  cornerNewelGeo.computeBoundingSphere();
  const cornerNewel = new THREE.Mesh(cornerNewelGeo, strippedBannisterOakMat);
  cornerNewel.name = 'upperLanding.cornerNewel';
  cornerNewel.position.set(-15.36, floorTopY + 0.48, -0.58);
  cornerNewel.castShadow = true;
  landingRailGroup.add(cornerNewel);

  const cornerNewelCapGeo = new THREE.BoxGeometry(0.118, 0.024, 0.118);
  cornerNewelCapGeo.computeBoundingSphere();
  const cornerNewelCap = new THREE.Mesh(cornerNewelCapGeo, strippedBannisterOakMat);
  cornerNewelCap.name = 'upperLanding.cornerNewelCap';
  cornerNewelCap.position.set(-15.36, floorTopY + 0.972, -0.58);
  tagHighLodDetail(cornerNewelCap);
  landingRailGroup.add(cornerNewelCap);
  addDetailedNewelJoinery('upperLanding.cornerNewel', -15.36, floorTopY, 0.96, -0.58, false);

  // North Newel Post top cap & landing joinery detailing at the top of the stairs (X = -15.38m, Z = -1.64m)
  const northNewelCap = new THREE.Mesh(cornerNewelCapGeo, strippedBannisterOakMat);
  northNewelCap.name = 'upperLanding.northNewelCap';
  northNewelCap.position.set(-15.38, floorTopY + 0.972, -1.64);
  tagHighLodDetail(northNewelCap);
  landingRailGroup.add(northNewelCap);
  addDetailedNewelJoinery('upperLanding.northNewelPost', -15.38, floorTopY, 0.96, -1.64, false);

  scene.add(landingRailGroup);

  // Issue #1: Solid North Exterior Brick Wall of Main Stair Landing (Z = -2.78m..-2.50m, X = -17.55m..-12.81m — NO window!)
  const northCutawayDescriptor = {
    axis: 'z' as const,
    coord: -2.64,
    minSpan: -17.55,
    maxSpan: -12.81,
    floor: 'first' as const,
  };
  {
    const northW = -12.81 - -17.55; // 4.74m
    const northBottomY = floorBaseY + 0.004;
    const northTopY = upperWallTopY - 0.016;
    const northH = northTopY - northBottomY;
    const northCx = (-17.55 + -12.81) / 2; // -15.18m
    const northCy = (northBottomY + northTopY) / 2;
    const northCz = -2.64;

    const northBrickGeo = new THREE.BoxGeometry(northW, northH, 0.28);
    applyWorldSpaceBrickUVs(northBrickGeo, northCx, northCy, northCz);
    northBrickGeo.computeBoundingSphere();
    const northWallMats: THREE.Material[] = [
      exteriorBrickMat,
      exteriorBrickMat,
      exteriorBrickMat,
      warmRoomPlasterMat,
      warmRoomPlasterMat, // +Z interior upper face (lower half has exposed brick panel below the middle beam)
      exteriorBrickMat,   // -Z exterior North facade
    ];
    const northBrickWall = new THREE.Mesh(northBrickGeo, northWallMats);
    northBrickWall.name = 'upperLanding.northSolidBrickWall';
    northBrickWall.position.set(northCx, northCy, northCz);
    northBrickWall.castShadow = true;
    northBrickWall.receiveShadow = true;
    tagUpperCutawayWall(northBrickWall, northCutawayDescriptor);
    scene.add(northBrickWall);

    const northWallCapGeo = new THREE.BoxGeometry(northW - 0.012, 0.016, 0.268);
    northWallCapGeo.computeBoundingSphere();
    const northWallCap = new THREE.Mesh(northWallCapGeo, wallCapMat);
    northWallCap.name = 'upperLanding.northSolidBrickWall.cap';
    northWallCap.position.set(northCx, upperWallTopY - 0.008, northCz);
    tagUpperCutawayWall(northWallCap, northCutawayDescriptor);
    scene.add(northWallCap);

    // Issue #2: Exposed Red-Brick Interior Lower North Wall Panel sitting cleanly above the continuous oak stringer/skirting
    // (X = -17.46m..-13.05m, Y = floorTopY + 0.148m..floorTopY + 1.05m, Z = -2.496m — zero overlap or Z-fighting with stringer!)
    const lowerBrickW = -13.05 - -17.46; // 4.41m
    const lowerBrickBottomY = floorTopY + 0.148;
    const lowerBrickTopY = floorTopY + 1.05;
    const lowerBrickH = lowerBrickTopY - lowerBrickBottomY; // 0.902m
    const lowerBrickCx = (-17.46 + -13.05) / 2; // -15.255m
    const lowerBrickCy = (lowerBrickBottomY + lowerBrickTopY) / 2;
    const northInteriorBrickGeo = new THREE.BoxGeometry(lowerBrickW, lowerBrickH, 0.012);
    applyWorldSpaceBrickUVs(northInteriorBrickGeo, lowerBrickCx, lowerBrickCy, -2.496);
    northInteriorBrickGeo.computeBoundingSphere();
    const northInteriorBrickPanel = new THREE.Mesh(
      northInteriorBrickGeo,
      exteriorBrickMat
    );
    northInteriorBrickPanel.name = 'upperLanding.northInteriorBrickPanel';
    northInteriorBrickPanel.position.set(lowerBrickCx, lowerBrickCy, -2.496);
    northInteriorBrickPanel.receiveShadow = true;
    tagUpperCutawayWall(northInteriorBrickPanel, northCutawayDescriptor);
    scene.add(northInteriorBrickPanel);

    // Horizontal Stepped Natural Oak Timber Beam & Framing going across the middle of the North wall
    // (Y = floorTopY + 1.05m = 3.21m, X = -17.46m..-13.05m, Z = -2.468m — Wooden beams like downstairs!)
    const northWallMidBeamGeo = new THREE.BoxGeometry(lowerBrickW, 0.14, 0.044);
    northWallMidBeamGeo.computeBoundingSphere();
    const northWallMidBeam = new THREE.Mesh(
      northWallMidBeamGeo,
      darkTimberBeamMat
    );
    northWallMidBeam.name = 'upperLanding.northWallMiddleBeam';
    northWallMidBeam.position.set(lowerBrickCx, floorTopY + 1.05, -2.468);
    northWallMidBeam.castShadow = true;
    northWallMidBeam.receiveShadow = true;
    tagUpperCutawayWall(northWallMidBeam, northCutawayDescriptor);
    scene.add(northWallMidBeam);

    // Projecting stepped oak moulding fillet along the front (+Z) of `northWallMiddleBeam` (matching `hall.fireplaceBeam.midMoulding` downstairs)
    const northWallMidBeamMouldingGeo = new THREE.BoxGeometry(lowerBrickW + 0.01, 0.036, 0.016);
    northWallMidBeamMouldingGeo.computeBoundingSphere();
    const northWallMidBeamMoulding = new THREE.Mesh(
      northWallMidBeamMouldingGeo,
      antiqueOakSkirtingMat
    );
    northWallMidBeamMoulding.name = 'upperLanding.northWallMiddleBeam.moulding';
    northWallMidBeamMoulding.position.set(lowerBrickCx, floorTopY + 1.05, -2.438);
    northWallMidBeamMoulding.castShadow = true;
    tagHighLodDetail(northWallMidBeamMoulding);
    tagUpperCutawayWall(northWallMidBeamMoulding, northCutawayDescriptor);
    scene.add(northWallMidBeamMoulding);

    // Upper Natural Oak Eaves Wall-Plate Beam along the top of the North wall (Y = interiorEavesY - 0.06m = 3.80m)
    const northWallTopPlateBeamGeo = new THREE.BoxGeometry(lowerBrickW, 0.12, 0.044);
    northWallTopPlateBeamGeo.computeBoundingSphere();
    const northWallTopPlateBeam = new THREE.Mesh(
      northWallTopPlateBeamGeo,
      darkTimberBeamMat
    );
    northWallTopPlateBeam.name = 'upperLanding.northWallTopPlateBeam';
    northWallTopPlateBeam.position.set(lowerBrickCx, interiorEavesY - 0.06, -2.468);
    northWallTopPlateBeam.castShadow = true;
    northWallTopPlateBeam.receiveShadow = true;
    tagUpperCutawayWall(northWallTopPlateBeam, northCutawayDescriptor);
    scene.add(northWallTopPlateBeam);

    // Shared BufferGeometries for the 3 lower and 3 upper vertical natural oak wall posts
    const lowerPostH = (floorTopY + 0.98) - (floorTopY + 0.148);
    const sharedLowerPostGeo = new THREE.BoxGeometry(0.115, lowerPostH, 0.038);
    sharedLowerPostGeo.computeBoundingSphere();

    const upperPostBottomY = floorTopY + 1.12;
    const upperPostTopY = interiorEavesY - 0.12;
    const upperPostH = upperPostTopY - upperPostBottomY;
    const sharedUpperPostGeo = new THREE.BoxGeometry(0.115, upperPostH, 0.044);
    sharedUpperPostGeo.computeBoundingSphere();

    // Vertical Natural Oak Wall Posts / Studs framing the North wall (West corner, Stairwell Newel alignment at X = -15.38m, and East Chimney Breast corner)
    for (const [postIdx, postX] of [
      [1, -17.39],
      [2, -15.38],
      [3, -13.38],
    ] as const) {
      // Lower oak post across the exposed brick panel (seated cleanly on the +Z = -2.490m face of northInteriorBrickPanel)
      const lowerPost = new THREE.Mesh(sharedLowerPostGeo, darkTimberBeamMat);
      lowerPost.name = `upperLanding.northWallPost.lower.${postIdx}`;
      lowerPost.position.set(
        postX,
        floorTopY + 0.148 + lowerPostH / 2,
        -2.471
      );
      lowerPost.castShadow = true;
      lowerPost.receiveShadow = true;
      tagUpperCutawayWall(lowerPost, northCutawayDescriptor);
      scene.add(lowerPost);

      // Upper oak post between the middle beam and the eaves wall-plate beam
      const upperPost = new THREE.Mesh(sharedUpperPostGeo, darkTimberBeamMat);
      upperPost.name = `upperLanding.northWallPost.upper.${postIdx}`;
      upperPost.position.set(
        postX,
        (upperPostBottomY + upperPostTopY) / 2,
        -2.468
      );
      upperPost.castShadow = true;
      upperPost.receiveShadow = true;
      tagUpperCutawayWall(upperPost, northCutawayDescriptor);
      scene.add(upperPost);
    }

    // Diagonal Natural Oak Timber Brace in the upper North wall bay above the stairwell
    const northWallDiagonalBraceGeo = new THREE.BoxGeometry(0.11, 0.82, 0.048);
    northWallDiagonalBraceGeo.computeBoundingSphere();
    const northWallDiagonalBrace = new THREE.Mesh(
      northWallDiagonalBraceGeo,
      darkTimberBeamMat
    );
    northWallDiagonalBrace.name = 'upperLanding.northWallDiagonalBrace';
    northWallDiagonalBrace.position.set(-16.4, floorTopY + 1.40, -2.48);
    northWallDiagonalBrace.rotation.z = -0.68;
    northWallDiagonalBrace.castShadow = true;
    tagUpperCutawayWall(northWallDiagonalBrace, northCutawayDescriptor);
    scene.add(northWallDiagonalBrace);
  }

  // Continuous 0.46m-thick South Wall of Main Stair Landing (Z = +2.22m..+2.68m, X = -17.80m..-12.93m)
  // Calibrated to Survey2Plan `Win 1745978` (`1.50m x 0.78m` 3-light casement above the cast-iron column radiator)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongXWithWindow(
      -17.8,
      -12.93,
      2.22,
      2.68,
      -15.35,
      1.5,
      2.88,
      3.66,
      'north',
      3,
      {
        skirtingMin: -17.788,
        skirtingMax: -13.072,
        windowFamily: 'tripleTopHungCentre',
      }
    );
    ensureNamedAddedChildren(scene, idx, 'upperLanding.southExteriorWall');
  }

  // Top interior plaster frieze strip (`Y = 4.15m..4.225m, Z = 2.22m..2.45m`) sealing the inner face (`Z = 2.22m`)
  // of the 0.46m-thick Upper Landing South wall up to `eastWing.vaultedCeiling.southSkeiling` (Issue #9)
  {
    const southTopFriezeGeo = new THREE.BoxGeometry(-12.93 - -17.8, 0.075, 0.23);
    southTopFriezeGeo.computeBoundingSphere();
    const southTopFrieze = new THREE.Mesh(southTopFriezeGeo, warmRoomPlasterMat);
    southTopFrieze.name = 'upperLanding.southWallTopFrieze';
    southTopFrieze.userData.isArchitecturalShell = true;
    southTopFrieze.position.set((-17.8 + -12.93) / 2, upperWallTopY + 0.0275, 2.335);
    southTopFrieze.receiveShadow = true;
    tagUpperCutawayWall(southTopFrieze, {
      axis: 'z',
      coord: 2.45,
      minSpan: -17.8,
      maxSpan: -12.93,
      floor: 'first',
    });
    scene.add(southTopFrieze);
  }

  // Interior warm plaster cladding on the South (`z_ew = +2.68m`) corridor-facing segment (`x_ew = -18.0409m..-16.956m`)
  // Mitered at its West end (`[-18.0409, 2.688] -> [-17.7988, 2.668]`) so it meets `upperLanding.westWallUpperGable` cleanly with zero exposed edge (Issue #3)!
  {
    const southCladShape = new THREE.Shape();
    southCladShape.moveTo(-18.0409, -2.688);
    southCladShape.lineTo(-16.956, -2.688);
    southCladShape.lineTo(-16.956, -2.668);
    southCladShape.lineTo(-17.7988, -2.668);
    southCladShape.closePath();
    const southCladGeo = new THREE.ExtrudeGeometry(southCladShape, {
      depth: upperWallTopY - floorBaseY - 0.016,
      bevelEnabled: false,
    });
    southCladGeo.rotateX(-Math.PI / 2);
    southCladGeo.translate(0, floorBaseY, 0);
    southCladGeo.computeBoundingSphere();
    const southCorridorClad = new THREE.Mesh(southCladGeo, warmRoomPlasterMat);
    southCorridorClad.name = 'upperLanding.southWallCorridorCladding';
    southCorridorClad.userData.isArchitecturalShell = true;
    southCorridorClad.receiveShadow = true;
    tagUpperCutawayWall(southCorridorClad, {
      axis: 'z',
      coord: 2.45,
      minSpan: -18.04,
      maxSpan: -12.81,
      floor: 'first',
    });
    scene.add(southCorridorClad);
  }

  // Issue #3: Floor-Standing Cast-Iron 4-Column Traditional Radiator below the South Landing Window
  // Replaces the old wall-hung white convector box at X = -15.35m, standing on the landing floor in front of Z = 2.22m
  {
    const southCutawayDescriptor = {
      axis: 'z' as const,
      coord: 2.45,
      minSpan: -17.88,
      maxSpan: -12.81,
      floor: 'first' as const,
    };
    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x36393c,
      roughness: 0.42,
      metalness: 0.72,
    });
    const radiatorBrassMat = new THREE.MeshStandardMaterial({
      color: 0x9c7e44,
      roughness: 0.32,
      metalness: 0.82,
    });

    const radiatorGroup = new THREE.Group();
    radiatorGroup.name = 'upperLanding.southCastIronRadiator';
    const radCenterX = -15.35;
    const radCenterZ = 2.11;
    radiatorGroup.position.set(radCenterX, floorTopY, radCenterZ);

    const numSections = 14;
    const sectionPitch = 0.064;
    const totalWidth = (numSections - 1) * sectionPitch; // 0.832m
    const legClearanceY = 0.085;
    const bodyHeight = 0.565; // Top of radiator at Y = floorTopY + 0.65m
    const bodyCenterY = legClearanceY + bodyHeight / 2;
    const topBarrelY = legClearanceY + bodyHeight - 0.042;
    const botBarrelY = legClearanceY + 0.042;

    // Shared BufferGeometries for radiator components
    const collectorBarrelGeo = new THREE.CylinderGeometry(
      0.024,
      0.024,
      totalWidth + 0.05,
      12
    );
    collectorBarrelGeo.computeBoundingSphere();

    const sectionCrownGeo = new THREE.BoxGeometry(0.042, 0.052, 0.142);
    sectionCrownGeo.computeBoundingSphere();

    const colTubeGeo = new THREE.CylinderGeometry(
      0.0115,
      0.0115,
      bodyHeight - 0.03,
      10
    );
    colTubeGeo.computeBoundingSphere();

    const footLegGeo = new THREE.BoxGeometry(
      0.036,
      legClearanceY + 0.025,
      0.032
    );
    footLegGeo.computeBoundingSphere();

    const footPadGeo = new THREE.BoxGeometry(0.044, 0.014, 0.046);
    footPadGeo.computeBoundingSphere();

    const wallStayGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.11, 8);
    wallStayGeo.computeBoundingSphere();

    const riserPipeGeo = new THREE.CylinderGeometry(
      0.008,
      0.008,
      botBarrelY + 0.02,
      10
    );
    riserPipeGeo.computeBoundingSphere();

    const floorCollarGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.012, 12);
    floorCollarGeo.computeBoundingSphere();

    const valveBodyGeo = new THREE.BoxGeometry(0.055, 0.036, 0.036);
    valveBodyGeo.computeBoundingSphere();

    const wheelHeadGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.042, 10);
    wheelHeadGeo.computeBoundingSphere();

    // Top & bottom horizontal cast-iron water collector barrels connecting all sections
    for (const [barrelKey, barrelY] of [
      ['bottomBarrel', botBarrelY],
      ['topBarrel', topBarrelY],
    ] as const) {
      const collectorBarrel = new THREE.Mesh(collectorBarrelGeo, castIronMat);
      collectorBarrel.name = `upperLanding.southCastIronRadiator.${barrelKey}`;
      collectorBarrel.rotation.z = Math.PI / 2;
      collectorBarrel.position.set(0, barrelY, 0);
      collectorBarrel.castShadow = true;
      collectorBarrel.receiveShadow = true;
      radiatorGroup.add(collectorBarrel);
    }

    // Individual 4-column cast-iron sections with integral splayed feet on the outer & center support sections
    const colZOffsets = [-0.051, -0.017, 0.017, 0.051] as const;
    for (let i = 0; i < numSections; i++) {
      const sx = -totalWidth / 2 + i * sectionPitch;
      const isFootSection = i === 0 || i === numSections - 1;

      // Top and bottom cast manifold crowns for this section
      for (const [crownKey, crownY] of [
        ['bottomCrown', botBarrelY],
        ['topCrown', topBarrelY],
      ] as const) {
        const crown = new THREE.Mesh(sectionCrownGeo, castIronMat);
        crown.name = `upperLanding.southCastIronRadiator.section_${i + 1}.${crownKey}`;
        crown.position.set(sx, crownY, 0);
        crown.castShadow = true;
        crown.receiveShadow = true;
        tagHighLodDetail(crown);
        radiatorGroup.add(crown);
      }

      // 4 vertical cast-iron tube columns per section
      for (let colIdx = 0; colIdx < colZOffsets.length; colIdx++) {
        const cz = colZOffsets[colIdx]!;
        const colTube = new THREE.Mesh(colTubeGeo, castIronMat);
        colTube.name = `upperLanding.southCastIronRadiator.section_${i + 1}.column_${colIdx + 1}`;
        colTube.position.set(sx, bodyCenterY, cz);
        colTube.castShadow = true;
        colTube.receiveShadow = true;
        tagHighLodDetail(colTube);
        radiatorGroup.add(colTube);
      }

      // Integral splayed cast-iron feet resting directly on the landing carpet at the outer sections
      if (isFootSection) {
        for (const [fzKey, fzSign] of [
          ['north', -1],
          ['south', 1],
        ] as const) {
          const footLeg = new THREE.Mesh(footLegGeo, castIronMat);
          footLeg.name = `upperLanding.southCastIronRadiator.section_${i + 1}.footLeg_${fzKey}`;
          footLeg.position.set(sx, (legClearanceY + 0.025) / 2, fzSign * 0.054);
          footLeg.rotation.x = fzSign * 0.12;
          footLeg.castShadow = true;
          tagHighLodDetail(footLeg);
          radiatorGroup.add(footLeg);

          const footPad = new THREE.Mesh(footPadGeo, castIronMat);
          footPad.name = `upperLanding.southCastIronRadiator.section_${i + 1}.footPad_${fzKey}`;
          footPad.position.set(sx, 0.007, fzSign * 0.06);
          tagHighLodDetail(footPad);
          radiatorGroup.add(footPad);
        }
      }
    }

    // Cast-iron wall stays anchoring the radiator back into the thick South wall (Z = 2.22m -> local Z = +0.11m)
    for (const [stayKey, stayX] of [
      ['west', -totalWidth / 2 + sectionPitch * 2],
      ['east', totalWidth / 2 - sectionPitch * 2],
    ] as const) {
      const wallStay = new THREE.Mesh(wallStayGeo, castIronMat);
      wallStay.name = `upperLanding.southCastIronRadiator.wallStay_${stayKey}`;
      wallStay.rotation.x = Math.PI / 2;
      wallStay.position.set(stayX, topBarrelY, 0.055);
      tagHighLodDetail(wallStay);
      radiatorGroup.add(wallStay);
    }

    // Traditional aged-brass TRV & lockshield valves + vertical copper/brass riser pipes from the floor
    for (const [sideKey, sideSign] of [
      ['west', -1],
      ['east', 1],
    ] as const) {
      const valveX = sideSign * (totalWidth / 2 + 0.055);
      const riserPipe = new THREE.Mesh(riserPipeGeo, radiatorBrassMat);
      riserPipe.name = `upperLanding.southCastIronRadiator.riserPipe_${sideKey}`;
      riserPipe.position.set(valveX, (botBarrelY + 0.02) / 2, 0);
      riserPipe.castShadow = true;
      tagHighLodDetail(riserPipe);
      radiatorGroup.add(riserPipe);

      const floorCollar = new THREE.Mesh(floorCollarGeo, radiatorBrassMat);
      floorCollar.name = `upperLanding.southCastIronRadiator.floorCollar_${sideKey}`;
      floorCollar.position.set(valveX, 0.006, 0);
      tagHighLodDetail(floorCollar);
      radiatorGroup.add(floorCollar);

      const valveBody = new THREE.Mesh(valveBodyGeo, radiatorBrassMat);
      valveBody.name = `upperLanding.southCastIronRadiator.valveBody_${sideKey}`;
      valveBody.position.set(valveX - sideSign * 0.012, botBarrelY, 0);
      tagHighLodDetail(valveBody);
      radiatorGroup.add(valveBody);

      const wheelHead = new THREE.Mesh(wheelHeadGeo, radiatorBrassMat);
      wheelHead.name = `upperLanding.southCastIronRadiator.wheelHead_${sideKey}`;
      wheelHead.position.set(valveX, botBarrelY + 0.035, 0);
      tagHighLodDetail(wheelHead);
      radiatorGroup.add(wheelHead);
    }

    tagUpperCutawayWall(radiatorGroup, southCutawayDescriptor);
    scene.add(radiatorGroup);
  }

  // Issue #1 & Issue #2: Sculpted Organic White-Plastered East Chimney Breast on Main Stair Landing
  // Wide at the base on the left-hand (North, -Z) side (`Z = -1.34m..+0.46m` at the floor)
  // and sweeping smoothly inward in a continuous hand-plastered curve to the raised 4.52m ceiling (`Z = -0.48m..+0.34m`)!
  // Uses analytical C1-continuous cross-section normals and an integrated rounded top cap so zero black shading or corner artifacts appear (Issue #1).
  {
    const wallX = -13.05; // Flush with the West face of the X = -12.93m (0.24m-thick) East Landing cross-wall
    const breastH = collarCeilingY - floorTopY;
    const segY = 32;
    const segNorth = 8;
    const segNW = 10;
    const segFront = 12;
    const segSW = 10;
    const segSouth = 8;
    const segProfile = segNorth + segNW + segFront + segSW + segSouth; // 48
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const sampleRingPoint = (t: number, ip: number): [number, number] => {
      // Smooth organic S-curve taper along height fraction t in [0, 1]
      const u = Math.pow(t, 1.12);
      const curve = u * u * (3 - 2 * u);
      // Left-hand (North, -Z) side is wide at the base (-1.34m) and sweeps inward to -0.48m at the ceiling
      const zNorth = THREE.MathUtils.lerp(-1.34, -0.48, curve);
      // Right-hand (South, +Z) side tapers gently from +0.46m at the base to +0.34m at the ceiling
      const zSouth = THREE.MathUtils.lerp(0.46, 0.34, curve);
      // Westward (-X) projection from wallX tapers from 0.51m at the base to 0.37m at the ceiling
      const projW =
        THREE.MathUtils.lerp(0.51, 0.37, curve) +
        0.01 * Math.sin(t * Math.PI);
      const cornerR = 0.085;

      if (ip <= segNorth) {
        const k = ip / segNorth;
        const x = wallX - k * (projW - cornerR);
        return [x, zNorth];
      }
      const ip1 = ip - segNorth;
      if (ip1 <= segNW) {
        const ang = (ip1 / segNW) * (Math.PI * 0.5);
        const cx = wallX - (projW - cornerR);
        const cz = zNorth + cornerR;
        return [cx - Math.sin(ang) * cornerR, cz - Math.cos(ang) * cornerR];
      }
      const ip2 = ip1 - segNW;
      if (ip2 <= segFront) {
        const k = ip2 / segFront;
        const z = THREE.MathUtils.lerp(zNorth + cornerR, zSouth - cornerR, k);
        // C1-smooth zero-slope cosine pillowing across the front face so corner transitions have zero normal kink
        const pillow = (1 - Math.cos(k * Math.PI * 2)) * 0.006;
        return [wallX - projW - pillow, z];
      }
      const ip3 = ip2 - segFront;
      if (ip3 <= segSW) {
        const ang = (ip3 / segSW) * (Math.PI * 0.5);
        const cx = wallX - (projW - cornerR);
        const cz = zSouth - cornerR;
        return [cx - Math.cos(ang) * cornerR, cz + Math.sin(ang) * cornerR];
      }
      const ip4 = ip3 - segSW;
      const k = ip4 / segSouth;
      const x = THREE.MathUtils.lerp(wallX - (projW - cornerR), wallX, k);
      return [x, zSouth];
    };

    const stride = segProfile + 1;
    for (let iy = 0; iy <= segY; iy++) {
      const t = iy / segY;
      const y = floorTopY + t * breastH;
      const ringPts: Array<[number, number]> = [];
      for (let ip = 0; ip <= segProfile; ip++) {
        ringPts.push(sampleRingPoint(t, ip));
      }
      for (let ip = 0; ip <= segProfile; ip++) {
        const [px, pz] = ringPts[ip]!;
        positions.push(px, y, pz);
        uvs.push((ip / segProfile) * 2.2, t * 1.6);

        const prev = ringPts[Math.max(0, ip - 1)]!;
        const next = ringPts[Math.min(segProfile, ip + 1)]!;
        const tx = next[0] - prev[0];
        const tz = next[1] - prev[1];
        const len = Math.hypot(tx, tz) || 1;
        // Outward horizontal normal for path running North -> West -> South is (-tz, 0, tx) / len
        normals.push(-tz / len, 0, tx / len);
      }
    }

    for (let iy = 0; iy < segY; iy++) {
      for (let ip = 0; ip < segProfile; ip++) {
        const a = iy * stride + ip;
        const b = a + 1;
        const c = (iy + 1) * stride + ip;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    // Integrated rounded top cap at y = collarCeilingY matching the exact curved top profile (with dedicated +Y normals)
    const capCenterIdx = positions.length / 3;
    const topCenterZ = (-0.48 + 0.34) / 2;
    positions.push(wallX, collarCeilingY, topCenterZ);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);
    for (let ip = 0; ip <= segProfile; ip++) {
      const [px, pz] = sampleRingPoint(1, ip);
      positions.push(px, collarCeilingY, pz);
      normals.push(0, 1, 0);
      uvs.push(ip / segProfile, 1);
    }
    for (let ip = 0; ip < segProfile; ip++) {
      const r0 = capCenterIdx + 1 + ip;
      const r1 = r0 + 1;
      indices.push(capCenterIdx, r0, r1);
    }

    const chimneyGeo = new THREE.BufferGeometry();
    chimneyGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    chimneyGeo.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3)
    );
    chimneyGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    chimneyGeo.setIndex(indices);
    chimneyGeo.computeBoundingSphere();

    const chimneyMesh = new THREE.Mesh(chimneyGeo, warmRoomPlasterMat);
    chimneyMesh.name = 'upperLanding.eastChimneyBreast';
    chimneyMesh.userData.isArchitecturalShell = true;
    chimneyMesh.castShadow = true;
    chimneyMesh.receiveShadow = true;
    scene.add(chimneyMesh);

    // Curved 2-tier Antique Oak Skirting Board lofted directly along the organic base curve of the East Chimney Breast
    const buildChimneySkirtBand = (
      name: string,
      y0: number,
      y1: number,
      outset: number
    ): THREE.Mesh => {
      const bandPos: number[] = [];
      const bandUvs: number[] = [];
      const bandIdx: number[] = [];
      const basePts: Array<[number, number]> = [];
      for (let ip = 0; ip <= segProfile; ip++) {
        basePts.push(sampleRingPoint(0, ip));
      }
      const outPts: Array<[number, number]> = basePts.map(([px, pz], ip) => {
        const prev = basePts[Math.max(0, ip - 1)]!;
        const next = basePts[Math.min(segProfile, ip + 1)]!;
        const tx = next[0] - prev[0];
        const tz = next[1] - prev[1];
        const len = Math.hypot(tx, tz) || 1;
        // Outward normal in XZ plane for path running North -> West -> South is (-tz, tx) / len
        const nx = -tz / len;
        const nz = tx / len;
        return [px + nx * outset, pz + nz * outset];
      });

      for (let iy = 0; iy <= 1; iy++) {
        const y = iy === 0 ? y0 : y1;
        for (let ip = 0; ip <= segProfile; ip++) {
          const [ox, oz] = outPts[ip]!;
          bandPos.push(ox, y, oz);
          bandUvs.push((ip / segProfile) * 2.2, iy * 0.15);
        }
      }
      for (let ip = 0; ip < segProfile; ip++) {
        const a = ip;
        const b = ip + 1;
        const c = stride + ip;
        const d = c + 1;
        bandIdx.push(a, b, c, b, d, c);
      }

      // Top ledge cap connecting outPts back to the chimney breast basePts at y1
      const topStart = bandPos.length / 3;
      for (let ip = 0; ip <= segProfile; ip++) {
        const [bx, bz] = basePts[ip]!;
        const [ox, oz] = outPts[ip]!;
        bandPos.push(bx, y1, bz, ox, y1, oz);
        bandUvs.push((ip / segProfile) * 2.2, 0, (ip / segProfile) * 2.2, 0.04);
      }
      for (let ip = 0; ip < segProfile; ip++) {
        const a = topStart + ip * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        bandIdx.push(a, b, c, b, d, c);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(bandPos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(bandUvs, 2));
      geo.setIndex(bandIdx);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, antiqueOakSkirtingMat);
      mesh.name = name;
      mesh.userData.isArchitecturalShell = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    scene.add(
      buildChimneySkirtBand(
        'upperLanding.eastChimneyBreast.skirtBase',
        floorTopY,
        floorTopY + 0.122,
        0.022
      )
    );
    scene.add(
      buildChimneySkirtBand(
        'upperLanding.eastChimneyBreast.skirtCap',
        floorTopY + 0.122,
        floorTopY + 0.146,
        0.016
      )
    );
  }


  // Non-Square West Load-Bearing Cross-Wall between Main Stair Landing and Bedroom 2 / West Wing Hallway
  // (0.24m thick, [-17.55, -2.50] -> [-17.92, +2.68] — aligned with Ground Floor Hall/Front Room cross-wall,
  // with the cased UP entrance opening `upperLandingToWestWingPortal` at the South end `uCenter = 4.18m, width = 0.86m`!)
  // Uses `skipWallBody: true` and `skipCap: true` so the entire vaulted wall from `Y = 2.06m` to `Y = 4.52m` is built as a single seamless one-piece mesh below (Issues #3 & #6)!
  const crossWallStartIdx = scene.children.length;
  const upperLandingCrossWallFrame = buildAngledWallSegment(scene, interactions, {
    start: [-17.55, -2.5],
    end: [-17.92, 2.68],
    thickness: 0.24,
    topY: upperWallTopY,
    frontFloorY: westWingCorridorFloorY, // +normal = West (Room 18 North Lobby at Y = 2.095m, -65mm step down)
    backFloorY: floorTopY,               // -normal = East (Upper Landing at Y = 2.160m)
    wallMaterial: warmRoomPlasterMat,
    capMaterial: warmRoomPlasterMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    skipCap: true,
    skipWallBody: true,
    addFrontSkirting: false, // Bedroom 2 & West Wing Hallway build continuous 45°-mitred skirtings on the West face
    addBackSkirting: true,
    backSkirtingExclusions: [
      [0, 1.975],     // Omit skirting across the open Stairwell Void & westWallNewel (Z = -2.50m..-0.53m)
      [4.732, 5.193], // Omit skirting inside the 0.46m-thick South wall (z_ew = 2.22m..2.68m)
    ],
    openings: [
      {
        id: 'upperLandingToWestWingPortal',
        kind: 'cased-opening',
        uCenter: 4.18,
        width: 0.864,
        doorHeight: 1.88,
        lowerFloorY: westWingCorridorFloorY,
        upperFloorY: floorTopY,
        architraveMaterial: antiqueOakSkirtingMat,
      },
    ],
  });
  ensureNamedAddedChildren(scene, crossWallStartIdx, 'upperLanding.westCrossWall');

  // Single One-Piece Full-Height Vaulted West Cross-Wall (`Y = floorBaseY..collarCeilingY`, `u = 0..5.2098m`)
  {
    const portalU0 = 4.18 - 0.864 / 2; // 3.748m
    const portalU1 = 4.18 + 0.864 / 2; // 4.612m
    const portalTopY = floorTopY + 1.88; // 4.04m (Door 1684667 CP-06: 1.945m clear above 2.095m West Lobby)
    const southMaxU = 5.2098;
    const westWallShape = new THREE.Shape();
    westWallShape.moveTo(0, floorBaseY - 0.04);
    westWallShape.lineTo(portalU0, floorBaseY - 0.04);
    westWallShape.lineTo(portalU0, portalTopY);
    westWallShape.lineTo(portalU1, portalTopY);
    westWallShape.lineTo(portalU1, floorBaseY - 0.04);
    westWallShape.lineTo(southMaxU, floorBaseY - 0.04);
    westWallShape.lineTo(southMaxU, upperWallTopY);
    westWallShape.lineTo(4.96, interiorEavesY);
    westWallShape.lineTo(3.86, collarCeilingY);
    westWallShape.lineTo(1.353, collarCeilingY);
    westWallShape.lineTo(0, interiorEavesY);
    westWallShape.closePath();

    const westGableGeo = new THREE.ExtrudeGeometry(westWallShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    westGableGeo.translate(0, 0, -0.12);

    // Miter the South end (`u ≈ southMaxU`) along the `z_ew = 2.688m..2.668m` plane so the West face (`z = +0.12`) reaches `u = 5.2098` (`[-18.0409, 2.688]`)
    // and the East face (`z = -0.12`) reaches `u = 5.1726` (`[-17.7988, 2.668]`), forming a razor-clean corner with `upperLanding.southWallCorridorCladding`!
    const posAttr = westGableGeo.attributes.position;
    const uvAttr = westGableGeo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      let uCoord = posAttr.getX(i);
      const yCoord = posAttr.getY(i);
      const zLocal = posAttr.getZ(i);
      if (uCoord > 5.05) {
        uCoord = zLocal >= 0 ? 5.2098 : 5.1726;
        posAttr.setX(i, uCoord);
      }
      if (uvAttr) {
        uvAttr.setXY(i, uCoord * 0.5, (yCoord - floorBaseY) * 0.5);
      }
    }
    posAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    westGableGeo.computeVertexNormals();
    westGableGeo.computeBoundingSphere();

    const westUpperGable = new THREE.Mesh(westGableGeo, warmRoomPlasterMat);
    westUpperGable.name = 'upperLanding.westWallUpperGable';
    westUpperGable.userData.isArchitecturalShell = true;
    westUpperGable.position.copy(upperLandingCrossWallFrame.toWorld(0, 0, 0));
    westUpperGable.rotation.y = upperLandingCrossWallFrame.rotationY;
    westUpperGable.castShadow = true;
    westUpperGable.receiveShadow = true;
    tagUpperCutawayWall(westUpperGable, {
      axis: 'x',
      coord: -17.72,
      minSpan: -2.5,
      maxSpan: 2.68,
      floor: 'first',
    });
    scene.add(westUpperGable);
  }

  // Exposed Natural Seasoned Oak Timber Wall Framing on the West Landing Wall (media_1790502987279.webp):
  // - Horizontal natural oak timber beam with stepped moulding across the middle of the wall (`Y = 3.24m`)
  // - Diagonal natural oak timber brace rising from the horizontal beam up to the ceiling (`u = 1.35m, Y = 4.44m`)
  const westWallTimberHeadBeamGeo = new THREE.BoxGeometry(3.69, 0.14, 0.044);
  westWallTimberHeadBeamGeo.computeBoundingSphere();
  const westWallTimberHeadBeam = new THREE.Mesh(
    westWallTimberHeadBeamGeo,
    darkTimberBeamMat
  );
  westWallTimberHeadBeam.name = 'upperLanding.westWallTimberBeam';
  westWallTimberHeadBeam.position.copy(
    upperLandingCrossWallFrame.toWorld(1.845, floorTopY + 1.08, -0.142)
  );
  westWallTimberHeadBeam.rotation.y = upperLandingCrossWallFrame.rotationY;
  westWallTimberHeadBeam.castShadow = true;
  westWallTimberHeadBeam.receiveShadow = true;
  tagUpperCutawayWall(westWallTimberHeadBeam, {
    axis: 'x',
    coord: -17.72,
    minSpan: -2.5,
    maxSpan: 2.5,
    floor: 'first',
  });
  scene.add(westWallTimberHeadBeam);

  const westWallTimberHeadMouldingGeo = new THREE.BoxGeometry(3.7, 0.036, 0.016);
  westWallTimberHeadMouldingGeo.computeBoundingSphere();
  const westWallTimberHeadMoulding = new THREE.Mesh(
    westWallTimberHeadMouldingGeo,
    antiqueOakSkirtingMat
  );
  westWallTimberHeadMoulding.name = 'upperLanding.westWallTimberBeam.moulding';
  westWallTimberHeadMoulding.position.copy(
    upperLandingCrossWallFrame.toWorld(1.845, floorTopY + 1.08, -0.172)
  );
  westWallTimberHeadMoulding.rotation.y = upperLandingCrossWallFrame.rotationY;
  westWallTimberHeadMoulding.castShadow = true;
  tagHighLodDetail(westWallTimberHeadMoulding);
  tagUpperCutawayWall(westWallTimberHeadMoulding, {
    axis: 'x',
    coord: -17.72,
    minSpan: -2.5,
    maxSpan: 2.5,
    floor: 'first',
  });
  scene.add(westWallTimberHeadMoulding);

  const westWallDiagonalBraceGeo = new THREE.BoxGeometry(0.13, 1.24, 0.052);
  westWallDiagonalBraceGeo.computeBoundingSphere();
  const westWallDiagonalBrace = new THREE.Mesh(
    westWallDiagonalBraceGeo,
    darkTimberBeamMat
  );
  westWallDiagonalBrace.name = 'upperLanding.westWallDiagonalBrace';
  westWallDiagonalBrace.position.copy(
    upperLandingCrossWallFrame.toWorld(1.56, floorTopY + 1.68, -0.125)
  );
  westWallDiagonalBrace.rotation.y = upperLandingCrossWallFrame.rotationY;
  westWallDiagonalBrace.rotation.z = -0.34;
  westWallDiagonalBrace.castShadow = true;
  westWallDiagonalBrace.receiveShadow = true;
  tagUpperCutawayWall(westWallDiagonalBrace, {
    axis: 'x',
    coord: -17.72,
    minSpan: -2.5,
    maxSpan: 2.4,
    floor: 'first',
  });
  scene.add(westWallDiagonalBrace);
}
