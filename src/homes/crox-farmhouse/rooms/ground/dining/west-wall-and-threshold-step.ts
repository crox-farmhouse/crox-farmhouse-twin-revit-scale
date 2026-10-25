import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
} from '../../../../../engine/geometry/swept-moulding.ts';
import { buildFlutedBrassPictureLight } from '../../../../../objects/fixtures/fluted-brass-picture-light.ts';
import { buildDiningRoomWestWallSideboard } from '../../../../../objects/furniture/dining-sideboard-and-road-bikes.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { DiningRoomKit } from '../dining-room.ts';
import type { DiningRoomSharedMaterials } from './walk-in-cupboard-and-north-wall.ts';

export function buildWestWallAndThresholdStep(
  ctx: SceneBuilderContext,
  kit: DiningRoomKit,
  mats: DiningRoomSharedMaterials
) {
  const { interactions, lightGroups, scene } = ctx;
  const {
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceFloorUVs,
    ceramicWhiteMat,
    doorH,
    doorLintelH,
    doorLintelY,
    engineeredOakFloorMat,
    herringboneTerracottaQuarryMat,
    oakMat,
    wallH,
  } = kit;
  const { crispWhiteWallMat } = mats;
  // 1J. West Load-Bearing Cross-Wall between Dining Room (Y = 0.00m) and Next Hallway (Y = -0.30m)
  //     (0.24m thick, X = -9.56m..-9.80m, center X = -9.68m):
  //     - Solid wall from Z = -2.50m to Z = +1.35m (length 3.85m, center Z = -0.575m)
  //     - Open Walk-Through Opening with Solid Oak Cased Architrave (NO door!) right near the South exterior wall
  //       at Z = +1.35m..+2.25m (center Z = +1.80m, width 0.90m — matching Photo 6 & PH-56!)
  //     - 30cm (0.30m) Step Down inside the opening into the next hallway (Y = -0.30m)
  //     - Small 15cm South corner nib from Z = +2.25m to Z = +2.40m (length 0.15m, center Z = +2.325m)
  const lowerFloorY = -0.3; // 30cm lower interior floor level from the next hallway onwards
  const lowerWallH = wallH - lowerFloorY; // 2.58m (from Y = -0.30m to Y = 2.28m)
  const lowerWallMidY = (lowerFloorY + wallH) / 2; // 0.99m
  const lowerDoorLintelH = wallH - (lowerFloorY + doorH); // 0.60m
  const lowerDoorLintelY = lowerFloorY + doorH + lowerDoorLintelH / 2; // 1.98m

  addInteriorWall(-9.68, lowerWallMidY, -0.575, 0.24, lowerWallH, 3.85, crispWhiteWallMat, {
    skipSkirting: true,
  });
  addInteriorWall(-9.68, doorLintelY, 1.8, 0.24, doorLintelH, 0.9, crispWhiteWallMat, {
    skipSkirting: true,
  });
  addInteriorWall(-9.68, lowerWallMidY, 2.325, 0.24, lowerWallH, 0.15, crispWhiteWallMat, {
    skipSkirting: true,
  });

  // 45°-mitred 146mm antique-profiled oak skirting along the Dining Room West cross-wall (`X = -9.56m`) and Walk-In Cupboard South pier (`Z = -0.44m`)
  {
    const diningWestSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-9.56, 1.268],
          [-9.56, -0.44],
          [-9.212, -0.44],
        ],
        0
      ),
      antiqueOakSkirtingMat
    );
    diningWestSkirt.name = 'familyRoom.westWallMitredSkirting';
    diningWestSkirt.userData.isArchitecturalShell = true;
    diningWestSkirt.castShadow = true;
    diningWestSkirt.receiveShadow = true;
    scene.add(diningWestSkirt);
  }

  // Framed Botanical & Architectural Picture on the solid West wall of the Dining Room
  // (Issue #8 & Issue #2: at X = -9.552m, Y = 1.486m above the West wall sideboard, Z = +0.28m)
  const westPicGroup = new THREE.Group();
  westPicGroup.name = 'familyRoom.westWallPicture';
  westPicGroup.userData.zone = 'familyRoom';
  westPicGroup.position.set(-9.542, 1.486, 0.28);
  westPicGroup.rotation.y = Math.PI / 2; // Flush on West wall facing East (+X) into Dining Room

  const wpW = 0.64;
  const wpH = 0.52;
  const wpD = 0.028;
  const wpRail = 0.034;

  for (const [rx, ry, rw, rh] of [
    [0, wpH / 2 - wpRail / 2, wpW, wpRail],
    [0, -wpH / 2 + wpRail / 2, wpW, wpRail],
    [-wpW / 2 + wpRail / 2, 0, wpRail, wpH - wpRail * 2],
    [wpW / 2 - wpRail / 2, 0, wpRail, wpH - wpRail * 2],
  ] as const) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(rw, rh, wpD),
      antiqueOakSkirtingMat
    );
    if (!rail.name) rail.name = 'familyRoom.westThreshold.rail';
    rail.position.set(rx, ry, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    westPicGroup.add(rail);
  }

  const wpMount = new THREE.Mesh(
    new THREE.BoxGeometry(wpW - wpRail * 2, wpH - wpRail * 2, 0.01),
    ceramicWhiteMat
  );
  if (!wpMount.name) wpMount.name = 'familyRoom.westThreshold.wpMount';
  wpMount.position.set(0, 0, -0.002);
  westPicGroup.add(wpMount);

  const wpCanvas = document.createElement('canvas');
  wpCanvas.width = 320;
  wpCanvas.height = 256;
  const wpCtx = wpCanvas.getContext('2d');
  if (wpCtx) {
    wpCtx.fillStyle = '#f3ede0';
    wpCtx.fillRect(0, 0, 320, 256);
    wpCtx.strokeStyle = '#a89a84';
    wpCtx.lineWidth = 2;
    wpCtx.strokeRect(18, 18, 284, 220);

    // Warm heritage architectural & botanical study illustration
    const bgGrad = wpCtx.createLinearGradient(28, 28, 28, 228);
    bgGrad.addColorStop(0, '#d8e0dc');
    bgGrad.addColorStop(0.65, '#e8dfd0');
    bgGrad.addColorStop(1, '#9ba488');
    wpCtx.fillStyle = bgGrad;
    wpCtx.fillRect(28, 28, 264, 200);

    // Georgian farmhouse elevation sketch in warm terracotta & slate
    wpCtx.fillStyle = '#9e5a44';
    wpCtx.fillRect(96, 118, 128, 72);
    wpCtx.fillStyle = '#485056';
    wpCtx.beginPath();
    wpCtx.moveTo(86, 118);
    wpCtx.lineTo(160, 76);
    wpCtx.lineTo(234, 118);
    wpCtx.closePath();
    wpCtx.fill();

    // Windows & doorway details
    wpCtx.fillStyle = '#f5f0e6';
    for (const wx of [112, 152, 192] as const) {
      wpCtx.fillRect(wx, 128, 16, 22);
    }
    wpCtx.fillRect(112, 160, 16, 24);
    wpCtx.fillRect(192, 160, 16, 24);
    wpCtx.fillStyle = '#5c4028';
    wpCtx.fillRect(152, 158, 16, 32);

    // Flanking cypress & oak foliage
    wpCtx.fillStyle = '#485f44';
    for (const [fx, fy, fr] of [
      [68, 156, 28],
      [252, 152, 30],
      [268, 168, 22],
    ] as const) {
      wpCtx.beginPath();
      wpCtx.arc(fx, fy, fr, 0, Math.PI * 2);
      wpCtx.fill();
    }
  }
  const wpTex = new THREE.CanvasTexture(wpCanvas);
  wpTex.colorSpace = THREE.SRGBColorSpace;
  const wpArtPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(wpW - 0.16, wpH - 0.14),
    new THREE.MeshStandardMaterial({ map: wpTex, roughness: 0.45 })
  );
  wpArtPlane.name = 'familyRoom.westWallPicture.canvas';
  wpArtPlane.position.set(0, 0, 0.007);
  westPicGroup.add(wpArtPlane);
  scene.add(westPicGroup);

  // Fluted antique-brass picture light over the picture on the West wall (separately controllable on diningPictureLight circuit)
  {
    const diningPictureLightGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffefb8,
      emissive: 0xffae24,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    diningPictureLightGlowMat.userData.baseEmissiveIntensity = 2.2;
    lightGroups.diningPictureLight.emissives.push(diningPictureLightGlowMat);

    const diningPictureLight = buildFlutedBrassPictureLight(
      {
        brass: new THREE.MeshStandardMaterial({ color: 0x9e7b3e, roughness: 0.28, metalness: 0.84 }),
        darkBrass: new THREE.MeshStandardMaterial({ color: 0x6e5326, roughness: 0.36, metalness: 0.78 }),
        glow: diningPictureLightGlowMat,
      },
      { name: 'familyRoom.westWallPictureLight', zone: 'familyRoom', shadeWidth: 0.42 }
    );
    // Picture top edge is at Y = 1.746m; backplate sits 0.10m above top frame rail at Y = 1.846m.
    diningPictureLight.position.set(-9.56, 1.846, 0.28);
    diningPictureLight.rotation.y = Math.PI / 2;
    scene.add(diningPictureLight);
    interactions.registerLightFixture(diningPictureLight, 'diningPictureLight');
  }

  // Issue #6 & Issue #1: Bespoke Country Sideboard on the Dining Room West Wall with Luxury Reed Diffuser (left/North) & Potted Plant (right/South)
  buildDiningRoomWestWallSideboard(scene);

  // Warm accent glow pool for the West wall picture light (`diningPictureLight` circuit; Dining Room already has 2 PointLights)
  ctx.addGlowPool('diningPictureLight', -9.2, lowerFloorY + 0.006, 0.28, 0.95, 0.22);

  // 45°-mitred ogee/torus Solid Oak Cased Architrave around the Open Walk-Through Opening (Z = +1.35m..+2.25m)
  addCasedArchitravePortal(scene, {
    axis: 'z',
    wallCoord: -9.68,
    wallThickness: 0.24,
    openingCenter: 1.8,
    openingWidth: 0.9,
    frontFloorY: 0,
    backFloorY: lowerFloorY,
    headY: doorH,
    material: antiqueOakSkirtingMat,
    namePrefix: 'diningRoom.bootLobbyPortal',
  });

  // 30cm (0.30m) Step Down from Dining Room (Y = 0.00m) into the Boot Lobby (Y = -0.30m) at X = -9.56m..-9.99m, Z = +1.35m..+2.25m:
  // 1. Upper threshold slab, recessed oak riser & half-round bullnose nosing at X = -9.56m..-9.725m (top at Y = 0.00m, riser down to Y = -0.15m)
  const upperThresholdStep = new THREE.Mesh(
    applyWorldSpaceFloorUVs(new THREE.BoxGeometry(0.165, 0.032, 0.854), -9.6425, 1.8, 0.85, 0.85),
    [
      oakMat,
      oakMat,
      herringboneTerracottaQuarryMat,
      oakMat,
      oakMat,
      oakMat,
    ]
  );
  upperThresholdStep.name = 'familyRoom.thresholdStep.upper';
  upperThresholdStep.position.set(-9.6425, -0.016, 1.8);
  upperThresholdStep.castShadow = true;
  upperThresholdStep.receiveShadow = true;
  scene.add(upperThresholdStep);

  const upperThresholdRiser = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.118, 0.854),
    oakMat
  );
  upperThresholdRiser.name = 'familyRoom.thresholdStep.upperRiser';
  upperThresholdRiser.position.set(-9.635, -0.091, 1.8);
  upperThresholdRiser.castShadow = true;
  upperThresholdRiser.receiveShadow = true;
  scene.add(upperThresholdRiser);

  const upperBullnoseGeo = new THREE.CylinderGeometry(
    0.016,
    0.016,
    0.854,
    16,
    1,
    false,
    Math.PI,
    Math.PI
  );
  upperBullnoseGeo.rotateX(Math.PI / 2);
  const upperThresholdNosing = new THREE.Mesh(upperBullnoseGeo, oakMat);
  upperThresholdNosing.name = 'familyRoom.thresholdStep.upperBullnose';
  upperThresholdNosing.position.set(-9.725, -0.016, 1.8);
  upperThresholdNosing.castShadow = true;
  upperThresholdNosing.receiveShadow = true;
  scene.add(upperThresholdNosing);

  // 2. Intermediate rounded-corner bullnose oak step tread & recessed rounded vertical riser (15cm down at Y = -0.15m, X = -9.71m..-10.02m)
  //    Issue #3: Extends all the way to the South exterior wall on the right (Z = 2.40m) and overlaps further on the left (Z = 1.18m).
  {
    const treadH = 0.032; // Top flush at Y = -0.15m, bottom at Y = -0.182m
    const bullnoseR = treadH * 0.5; // 16mm half-round bullnose radius
    const cornerR = 0.095; // 95mm horizontal rounding radius on the projecting NW corner
    const xEast = -9.71;
    const xWest = -10.02;
    const zNorth = 1.18;
    const zSouth = 2.4;

    const buildRoundedStepFootprintShape = (inset: number): THREE.Shape => {
      const xW = xWest + inset;
      const zN = zNorth + inset;
      const zS = zSouth - (inset > 0 ? 0.006 : 0);
      const rC = Math.max(0.02, cornerR - inset);
      // Shape in (X, -Z) so ExtrudeGeometry rotated by -PI/2 around X puts +extrude along +Y and shape Y along +Z
      const shape = new THREE.Shape();
      shape.moveTo(xEast, -zN);
      shape.lineTo(xW + rC, -zN);
      shape.absarc(xW + rC, -(zN + rC), rC, Math.PI * 0.5, Math.PI, false);
      shape.lineTo(xW, -zS);
      shape.lineTo(xEast, -zS);
      shape.closePath();
      return shape;
    };

    const buildExtrudedStepSlab = (
      inset: number,
      heightY: number,
      bottomY: number
    ): THREE.BufferGeometry => {
      const geo = new THREE.ExtrudeGeometry(buildRoundedStepFootprintShape(inset), {
        depth: heightY,
        bevelEnabled: false,
        curveSegments: 18,
      });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, bottomY, 0);

      // Apply world-space oak plank UVs on the top face so the engineered oak grain matches the Boot Lobby floor
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      if (pos && uv) {
        for (let i = 0; i < pos.count; i++) {
          const wx = pos.getX(i);
          const wy = pos.getY(i);
          const wz = pos.getZ(i);
          if (wy > bottomY + heightY - 0.002) {
            uv.setXY(i, wx / 4.4, wz / 1.76);
          } else {
            uv.setXY(i, (wz - zNorth) / 1.2, (wy - bottomY) / 0.4);
          }
        }
        uv.needsUpdate = true;
      }
      geo.computeVertexNormals();
      return geo;
    };

    // Rounded-corner tread board (Y = -0.182m..-0.150m): group 0 = top/bottom caps (`engineeredOakFloorMat`), group 1 = side walls (`oakMat`)
    const midTreadGeo = buildExtrudedStepSlab(0, treadH, -0.15 - treadH);
    const midStepDown = new THREE.Mesh(midTreadGeo, [
      engineeredOakFloorMat,
      oakMat,
    ]);
    midStepDown.name = 'familyRoom.thresholdStep.mid';
    midStepDown.castShadow = true;
    midStepDown.receiveShadow = true;
    scene.add(midStepDown);

    // Recessed rounded-corner vertical oak riser (Y = -0.294m..-0.182m, inset 14mm behind the bullnose overhang)
    const midRiserGeo = buildExtrudedStepSlab(0.014, 0.15 - treadH - 0.006, -0.294);
    const midStepRiser = new THREE.Mesh(midRiserGeo, oakMat);
    midStepRiser.name = 'familyRoom.thresholdStep.midRiser';
    midStepRiser.castShadow = true;
    midStepRiser.receiveShadow = true;
    scene.add(midStepRiser);

    // Continuous rounded bullnose nosing tube wrapping around the North return, rounded NW corner,
    // and West front edge all the way to the South exterior wall (Y = -0.166m, radius = 16mm)
    const nosingPts: THREE.Vector3[] = [];
    const nosingY = -0.15 - bullnoseR;
    const xWallFace = -9.795;
    const cxCorner = xWest + cornerR;
    const czNorth = zNorth + cornerR;

    // North straight return from wall face (-9.795) to start of NW corner
    for (let s = 0; s <= 3; s++) {
      const u = s / 3;
      nosingPts.push(
        new THREE.Vector3(xWallFace + (cxCorner - xWallFace) * u, nosingY, zNorth)
      );
    }
    // NW rounded corner arc (90°)
    const arcSteps = 12;
    for (let s = 1; s <= arcSteps; s++) {
      const theta = (s / arcSteps) * (Math.PI * 0.5);
      nosingPts.push(
        new THREE.Vector3(
          cxCorner - cornerR * Math.sin(theta),
          nosingY,
          czNorth - cornerR * Math.cos(theta)
        )
      );
    }
    // West straight front edge running all the way to the South exterior wall (zSouth = 2.40m)
    for (let s = 1; s <= 8; s++) {
      const u = s / 8;
      nosingPts.push(
        new THREE.Vector3(xWest, nosingY, czNorth + (zSouth - czNorth) * u)
      );
    }

    const nosingCurve = new THREE.CatmullRomCurve3(nosingPts, false, 'centripetal', 0.1);
    const midStepNosing = new THREE.Mesh(
      new THREE.TubeGeometry(nosingCurve, 44, bullnoseR, 16, false),
      engineeredOakFloorMat
    );
    midStepNosing.name = 'familyRoom.thresholdStep.midBullnose';
    midStepNosing.castShadow = true;
    midStepNosing.receiveShadow = true;
    scene.add(midStepNosing);
  }

  return {
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
  };
}
