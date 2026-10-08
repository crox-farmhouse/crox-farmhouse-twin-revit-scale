import * as THREE from 'three';

/**
 * Generates a realistic silvered architectural mirror glass texture (`512x1024`)
 * with subtle diagonal specular reflection gradients and bevelled perimeter edge highlights.
 */
let cachedGymMirrorGlassTexture: THREE.CanvasTexture | null = null;

export function createGymMirrorGlassTexture(): THREE.CanvasTexture {
  if (cachedGymMirrorGlassTexture) {
    return cachedGymMirrorGlassTexture;
  }
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#cfdbe6');
  grad.addColorStop(0.28, '#e8f0f7');
  grad.addColorStop(0.48, '#f7fbff');
  grad.addColorStop(0.55, '#d5e1ec');
  grad.addColorStop(0.82, '#e4edf5');
  grad.addColorStop(1, '#c4d2df');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle diagonal architectural reflection bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.18);
  ctx.lineTo(w, h * 0.04);
  ctx.lineTo(w, h * 0.22);
  ctx.lineTo(0, h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.lineTo(w, h * 0.48);
  ctx.lineTo(w, h * 0.56);
  ctx.lineTo(0, h * 0.70);
  ctx.closePath();
  ctx.fill();

  // Crisp 12px bevelled glass border highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedGymMirrorGlassTexture = tex;
  return tex;
}

/**
 * Creates a sculpted botanical leaf blade `THREE.BufferGeometry` with a central midrib fold,
 * parabolic longitudinal arch, and organic elliptic leaf silhouette (never a squashed sphere!).
 */
export function createSculptedBotanicalLeafGeometry(
  length: number,
  maxWidth: number,
  archDrop: number,
  cupDepth: number
): THREE.BufferGeometry {
  const segU = 8;
  const segV = 14;
  const geo = new THREE.PlaneGeometry(maxWidth, length, segU, segV);
  geo.translate(0, length * 0.5, 0);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, y / length)); // 0 at stem base, 1 at leaf tip
    const s = x / (maxWidth * 0.5 || 1); // -1..+1 across width

    // Natural elliptic/lanceolate leaf width envelope (narrow petiole base, broad belly, pointed tip)
    const widthProfile = Math.sin(Math.pow(t, 0.75) * Math.PI) * (1 - 0.12 * t);
    const nx = x * widthProfile;

    // Parabolic forward arch (`+z`) as `t` approaches the tip, plus V-cupping across `s`
    const archZ = Math.pow(t, 1.65) * archDrop - Math.abs(s) * cupDepth * widthProfile;
    const ny = y - Math.pow(t, 2.1) * archDrop * 0.32;

    pos.setXYZ(i, nx, ny, archZ);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Builds the Gym's architectural **Full-Height Backlit Mirrors, Layered Task & Warm Ambient Lighting,
 * Conditioning/Hydration Zone, and Lush Indoor Botanical Planters**:
 * - `outbuildings.gym.wallMirrors`:
 *   - 3-Bay Full-Height Backlit Mirror Wall on the South-East Wall (`u = 3.22..5.50m, v = 5.40m`)
 *   - Full-Height Backlit Form Mirror behind the Nike Squat Cage on the South-West Wall (`u = 0.62..2.42m, v = 5.40m`)
 *   - Full-Height Free-Weight Mirror on the West Wall (`u = 0.305m, v = 2.48..3.88m`)
 * - `outbuildings.gym.lighting`:
 *   - Task Lighting (`4000K` neutral-white): 4 suspended linear ceiling task luminaires (`groundCeilingGroup`) +
 *     7 directional cylindrical wall/mirror task spotlights + 2 crisp `THREE.PointLight`s
 *   - Ambient Lighting (`2700K–3000K` warm golden glow): Perimeter eave grazing LED cove strips along North & South walls,
 *     recessed warm LED halo backlighting behind all 3 mirror walls, 2 brass & alabaster pilaster sconces (`u = 2.86m`),
 *     and 2 warm ambient `THREE.PointLight`s
 * - `outbuildings.gym.plants`:
 *   - SW Corner (`u = 0.56m, v = 5.05m`): Tall sculpted *Strelitzia nicolai* (Bird of Paradise Palm) in ribbed charcoal planter
 *   - SE Corner (`u = 5.42m, v = 5.05m`): Sculpted *Sansevieria* (Architectural Snake Plant) in fluted limestone planter
 *   - NW Corner (`u = 0.56m, v = 0.62m`): Lush *Monstera deliciosa* in turned oak-legged ceramic planter
 * - `outbuildings.gym.hydrationBench`:
 *   - Slatted European Oak & Matte-Black Steel Towel/Hydration Bench (`u = 5.38m, v = 0.72m`) + Stretching Mat & Kettlebells.
 */
export function buildGymMirrorsLightingAndPlants(
  groundGroup: THREE.Group,
  groundCeilingGroup: THREE.Group,
  gymFloorY: number
): void {
  void groundCeilingGroup;
  // Issue #3 ("split the plants etc into separate objects"):
  // Parent each mirror assembly, each indoor planter, the hydration bench, and the yoga mat
  // directly to `groundGroup` so each is an independent top-level selectable/movable object!

  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    map: createGymMirrorGlassTexture(),
    color: 0xeaf2fa,
    roughness: 0.03,
    metalness: 0.94,
  });
  const blackAnodizedFrameMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.34,
    metalness: 0.72,
  });
  const warmHaloLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d6,
    emissive: new THREE.Color(0xffb866),
    emissiveIntensity: 2.5,
    roughness: 0.18,
  });
  const taskWhiteLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfff4e0),
    emissiveIntensity: 3.2,
    roughness: 0.14,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a464,
    roughness: 0.28,
    metalness: 0.84,
  });

  // Helper to create an arched 2D shape (`width = archW`, total `height = totalH` centered vertically at `y = 0`)
  const makeArchShape = (archW: number, totalH: number): THREE.Shape => {
    const r = archW * 0.5;
    const yBot = -totalH * 0.5;
    const ySpring = totalH * 0.5 - r;
    const s = new THREE.Shape();
    s.moveTo(-r, yBot);
    s.lineTo(r, yBot);
    s.lineTo(r, ySpring);
    s.absarc(0, ySpring, r, 0, Math.PI, false);
    s.lineTo(-r, yBot);
    return s;
  };

  // Helper to create an arched perimeter frame / halo ring (`outerW, outerH` minus `innerW, innerH`)
  const makeArchRingGeometry = (
    outerW: number,
    outerH: number,
    borderT: number,
    depthZ: number
  ): THREE.ExtrudeGeometry => {
    const outer = makeArchShape(outerW, outerH);
    const innerW = outerW - borderT * 2;
    const innerH = outerH - borderT * 2;
    const rIn = innerW * 0.5;
    const yBotIn = -innerH * 0.5;
    const ySpringIn = innerH * 0.5 - rIn;
    const hole = new THREE.Path();
    hole.moveTo(-rIn, yBotIn);
    hole.lineTo(rIn, yBotIn);
    hole.lineTo(rIn, ySpringIn);
    hole.absarc(0, ySpringIn, rIn, 0, Math.PI, false);
    hole.lineTo(-rIn, yBotIn);
    outer.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: depthZ,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.translate(0, 0, -depthZ * 0.5);
    geo.computeBoundingSphere();
    return geo;
  };

  // Helper to create an arched mirror glass pane with normalized [0..1] UVs
  const makeArchGlassGeometry = (archW: number, totalH: number, depthZ: number): THREE.BufferGeometry => {
    const shape = makeArchShape(archW - 0.016, totalH - 0.016);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depthZ,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.translate(0, 0, -depthZ * 0.5);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    if (pos && uv) {
      for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) + archW * 0.5) / archW;
        const v = (pos.getY(i) + totalH * 0.5) / totalH;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
    }
    geo.computeBoundingSphere();
    return geo;
  };

  // Issue #2 ("I think the window is actually here, swap the mirror and window. Make the windows more like arches with a bit of separation between them with some backlighting behind"):
  // Builds a row of individual, separated full-height Arched Mirrors with warm 2700K LED halo backlighting behind each arch!
  const addBacklitArchedMirrorSet = (
    name: string,
    cx: number,
    cy: number,
    cz: number,
    rotY: number,
    archW: number,
    archH: number,
    gapBetweenArches: number,
    numArches: number
  ): void => {
    const mAssy = new THREE.Group();
    mAssy.name = name;
    mAssy.userData.zone = 'courtyard';
    mAssy.position.set(cx, cy, cz);
    mAssy.rotation.y = rotY;
    groundGroup.add(mAssy);

    const haloRingGeo = makeArchRingGeometry(archW + 0.036, archH + 0.036, 0.022, 0.01);
    const frameRingGeo = makeArchRingGeometry(archW, archH, 0.02, 0.028);
    const glassGeo = makeArchGlassGeometry(archW, archH, 0.01);

    const stepX = archW + gapBetweenArches;
    const startX = -((numArches - 1) * stepX) * 0.5;

    for (let b = 0; b < numArches; b++) {
      const bx = startX + b * stepX;
      const archUnit = new THREE.Group();
      archUnit.name = `${name}.arch.${b + 1}`;
      archUnit.position.set(bx, 0, 0.012);
      mAssy.add(archUnit);

      // 1. Warm 2700K Arched LED Halo Backlighting glowing onto the wall/brick behind each separated arch
      const haloMesh = new THREE.Mesh(haloRingGeo, warmHaloLedMat);
      haloMesh.name = `${name}.backlight.${b + 1}`;
      haloMesh.position.set(0, 0, -0.01);
      archUnit.add(haloMesh);

      // 2. Clean Uninterrupted Arched Silvered Mirror Glass Pane (no internal grid lines)
      const glassPane = new THREE.Mesh(glassGeo, mirrorGlassMat);
      glassPane.name = `${name}.glass.${b + 1}`;
      glassPane.position.set(0, 0, 0.002);
      archUnit.add(glassPane);

      // 3. Slim Matte-Black Anodized Steel Arched Outer Perimeter Frame
      const archFrame = new THREE.Mesh(frameRingGeo, blackAnodizedFrameMat);
      archFrame.name = `${name}.frame.${b + 1}`;
      archFrame.position.set(0, 0, 0.006);
      archFrame.castShadow = true;
      archUnit.add(archFrame);

      // 4. Dedicated Overhead Picture/Task Light Bar above each arch
      const taskBarHousing = new THREE.Mesh(
        new THREE.BoxGeometry(archW * 0.62, 0.022, 0.044),
        blackAnodizedFrameMat
      );
      taskBarHousing.name = `${name}.taskBarHousing.${b + 1}`;
      taskBarHousing.userData.lodTier = 'high';
      taskBarHousing.userData.lodMaxDistance = 12;
      taskBarHousing.position.set(0, archH * 0.5 + 0.052, 0.036);
      archUnit.add(taskBarHousing);

      const taskBarDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(archW * 0.58, 0.008, 0.028),
        taskWhiteLedMat
      );
      taskBarDiffuser.name = `${name}.taskBarDiffuser.${b + 1}`;
      taskBarDiffuser.userData.lodTier = 'high';
      taskBarDiffuser.userData.lodMaxDistance = 12;
      taskBarDiffuser.position.set(0, archH * 0.5 + 0.039, 0.036);
      archUnit.add(taskBarDiffuser);
    }
  };

  // Issue #1 ("make each mirror bigger so there are less of them overall" at `[-17.086, 0.791, 20.943]`, `outbuildings.gym.wallMirrors.southEast.glass.1`):
  // Each arched mirror is significantly wider (`0.92m..1.08m` vs `0.56m`) and taller (`1.76m` vs `1.62m`), reducing the total count from 7 small mirrors to 4 grand architectural statement mirrors!
  const mirrorCenterY = gymFloorY + 1.18; // Spans `y = gymFloorY + 0.30 .. gymFloorY + 2.06m` (`1.76m` tall)
  const mirrorH = 1.76;

  // 1A. 2 Large Separated Backlit Arched Mirrors on the South-East Exposed Brick Wall (`u = 3.22..5.30m, v = 5.405m`, facing North `-v`)
  addBacklitArchedMirrorSet(
    'outbuildings.gym.wallMirrors.southEast',
    4.26,
    mirrorCenterY,
    5.405,
    Math.PI,
    0.92,
    mirrorH,
    0.22,
    2
  );

  // 1B. 1 Grand Wide Backlit Arched Mirror on the South-West Exposed Brick Wall behind the Squat Cage (`u = 0.98..2.06m, v = 5.405m`, facing North `-v`)
  addBacklitArchedMirrorSet(
    'outbuildings.gym.wallMirrors.southWest',
    1.52,
    mirrorCenterY,
    5.405,
    Math.PI,
    1.08,
    mirrorH,
    0,
    1
  );

  // 1C. 1 Grand Wide Backlit Arched Mirror on the West Wall Free-Weight Zone (`u = 0.305m, centerV = 1.76m`, facing East `+u`)
  addBacklitArchedMirrorSet(
    'outbuildings.gym.wallMirrors.westWall',
    0.305,
    mirrorCenterY,
    1.76,
    Math.PI / 2,
    1.04,
    mirrorH,
    0,
    1
  );

  // ---------------------------------------------------------------------------
  // 2. Layered Task Lighting & Warm Ambient Lighting (`outbuildings.gym.lighting`)
  // ---------------------------------------------------------------------------
  const lightingGroup = new THREE.Group();
  lightingGroup.name = 'outbuildings.gym.lighting';
  lightingGroup.userData.zone = 'courtyard';
  groundGroup.add(lightingGroup);

  // 2A. Warm 2700K Perimeter Eave Grazing LED Cove Strips along the North (`v = 0.305m`) & South (`v = 5.405m`) walls
  let coveIndex = 0;
  for (const [u0, u1, vPos] of [
    [0.36, 2.66, 0.302],
    [0.36, 2.66, 5.408],
    [3.06, 5.68, 5.408],
  ] as const) {
    coveIndex++;
    const coveLen = u1 - u0;
    const coveMidU = (u0 + u1) * 0.5;
    const coveChannel = new THREE.Mesh(
      new THREE.BoxGeometry(coveLen, 0.022, 0.028),
      blackAnodizedFrameMat
    );
    coveChannel.name = `outbuildings.gym.lighting.ambientEaveCoveChannel.${coveIndex}`;
    coveChannel.userData.lodTier = 'high';
    coveChannel.userData.lodMaxDistance = 12;
    coveChannel.position.set(coveMidU, 1.88, vPos);
    lightingGroup.add(coveChannel);

    const coveStrip = new THREE.Mesh(
      new THREE.BoxGeometry(coveLen - 0.02, 0.012, 0.018),
      warmHaloLedMat
    );
    coveStrip.name = 'outbuildings.gym.lighting.ambientEaveCove';
    coveStrip.position.set(coveMidU, 1.894, vPos);
    lightingGroup.add(coveStrip);
  }

  // 2B. 2 Designer Brushed-Brass & Alabaster Up/Down Wall Sconces on the North (`v = 0.45m`) & South (`v = 5.26m`) Brick Pilasters (`u = 2.86m`)
  for (const [sv, rotY] of [
    [0.452, 0],
    [5.258, Math.PI],
  ] as const) {
    const sconceGroup = new THREE.Group();
    sconceGroup.name = 'outbuildings.gym.lighting.wallSconce';
    sconceGroup.position.set(2.86, gymFloorY + 1.52, sv);
    sconceGroup.rotation.y = rotY;
    lightingGroup.add(sconceGroup);

    const sconceSide = sv < 2.5 ? 'north' : 'south';
    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.22, 0.016),
      brushedBrassMat
    );
    backplate.name = `outbuildings.gym.lighting.wallSconce.${sconceSide}.backplate`;
    backplate.userData.lodTier = 'high';
    backplate.userData.lodMaxDistance = 12;
    backplate.position.set(0, 0, 0.008);
    sconceGroup.add(backplate);

    const alabasterTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.28, 16),
      warmHaloLedMat
    );
    alabasterTube.name = `outbuildings.gym.lighting.wallSconce.${sconceSide}.alabasterTube`;
    alabasterTube.position.set(0, 0, 0.048);
    sconceGroup.add(alabasterTube);

    for (const ringY of [-0.08, 0.08] as const) {
      const brassRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.018, 16),
        brushedBrassMat
      );
      brassRing.name = `outbuildings.gym.lighting.wallSconce.${sconceSide}.brassRing.${ringY < 0 ? 'lower' : 'upper'}`;
      brassRing.userData.lodTier = 'high';
      brassRing.userData.lodMaxDistance = 12;
      brassRing.position.set(0, ringY, 0.048);
      sconceGroup.add(brassRing);
    }
  }

  // 2C. 4 Overhead Suspended Linear Task Luminaires (`y = 2.02m`)
  // Issue #4: Overhead lights stay visible in cutaway mode at low opacity (`0.34..0.38`)
  const ceilingTaskGroup = new THREE.Group();
  ceilingTaskGroup.name = 'outbuildings.gym.lighting.ceilingTaskBattens';
  lightingGroup.add(ceilingTaskGroup);

  const battenCutawayFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.34,
    metalness: 0.78,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const battenCutawayDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff5e4,
    emissiveIntensity: 1.95,
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  let battenIndex = 0;
  for (const cu of [1.52, 4.18] as const) {
    for (const cv of [1.75, 3.85] as const) {
      battenIndex++;
      const battenHousing = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 0.036, 0.058),
        battenCutawayFrameMat
      );
      battenHousing.name = `outbuildings.gym.lighting.ceilingTaskBattens.housing.${battenIndex}`;
      battenHousing.position.set(cu, 2.02, cv);
      ceilingTaskGroup.add(battenHousing);

      const battenDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(1.64, 0.014, 0.044),
        battenCutawayDiffuserMat
      );
      battenDiffuser.name = `outbuildings.gym.lighting.ceilingTaskBattens.diffuser.${battenIndex}`;
      battenDiffuser.position.set(cu, 2.0, cv);
      ceilingTaskGroup.add(battenDiffuser);

      // Twin suspension rods rising to the vaulted ceiling slope
      for (const du of [-0.68, 0.68] as const) {
        const suspRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, 0.42, 8),
          battenCutawayFrameMat
        );
        suspRod.name = `outbuildings.gym.lighting.ceilingTaskBattens.suspensionRod.${battenIndex}.${du < 0 ? 'west' : 'east'}`;
        suspRod.userData.lodTier = 'high';
        suspRod.userData.lodMaxDistance = 12;
        suspRod.position.set(cu + du, 2.24, cv);
        ceilingTaskGroup.add(suspRod);
      }
    }
  }

  // 2D. Task & Warm Ambient PointLights inside the Gym
  const westTaskLight = new THREE.PointLight(0xfff4e2, 2.6, 8.5, 1.4);
  westTaskLight.name = 'outbuildings.gym.lighting.taskLight.west';
  westTaskLight.position.set(1.52, 1.75, 2.65);
  lightingGroup.add(westTaskLight);

  const eastTaskLight = new THREE.PointLight(0xfff4e2, 2.6, 8.5, 1.4);
  eastTaskLight.name = 'outbuildings.gym.lighting.taskLight.east';
  eastTaskLight.position.set(4.15, 1.75, 3.15);
  lightingGroup.add(eastTaskLight);

  const warmAmbientLight = new THREE.PointLight(0xffc680, 1.5, 6.5, 1.5);
  warmAmbientLight.name = 'outbuildings.gym.lighting.wallSconceFill';
  warmAmbientLight.position.set(2.86, 1.25, 4.65);
  lightingGroup.add(warmAmbientLight);

  // ---------------------------------------------------------------------------
  // 3. Lush Sculpted Botanical Indoor Gym Plants (Separate Top-Level Objects per Issue #3)
  //    & Full-to-the-Rim Organic Potting Soil + River Pebbles (Issue #5)
  // ---------------------------------------------------------------------------
  const charcoalPlanterMat = new THREE.MeshStandardMaterial({
    color: 0x282c32,
    roughness: 0.68,
    metalness: 0.08,
  });
  const limestonePlanterMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c2,
    roughness: 0.74,
    metalness: 0.04,
  });

  // Procedural rich dark organic potting soil & bark mulch texture so every planter
  // looks genuinely filled to the rim with dark compost, bark chips, and perlite flecks
  const createPottingSoilTexture = (): THREE.CanvasTexture => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#241911';
    c.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const rx = ((i * 73) % size);
      const ry = ((i * 137) % size);
      const rw = 2 + (i % 5);
      const rh = 1 + ((i * 3) % 4);
      c.fillStyle = i % 9 === 0 ? '#5c4330' : i % 3 === 0 ? '#18100a' : '#332419';
      c.fillRect(rx, ry, rw, rh);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const pottingSoilMat = new THREE.MeshStandardMaterial({
    map: createPottingSoilTexture(),
    color: 0x2b1e15,
    roughness: 0.94,
    metalness: 0.02,
  });
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x8a847c,
    roughness: 0.65,
  });
  const deepEmeraldLeafMat = new THREE.MeshStandardMaterial({
    color: 0x1e4d28,
    roughness: 0.42,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const midBotanicalLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a38,
    roughness: 0.38,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const freshYoungLeafMat = new THREE.MeshStandardMaterial({
    color: 0x438246,
    roughness: 0.36,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const woodyStemMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d28,
    roughness: 0.64,
  });

  // Helper to build a lush multi-stem architectural indoor plant in a stoneware floor planter
  // parented directly to `groundGroup` (Issue #3) and filled to the upper rim with rich dark soil (Issue #5)
  const addSculptedGymPlanter = (
    name: string,
    uPos: number,
    yPos: number,
    vPos: number,
    potMat: THREE.Material,
    potRTop: number,
    potRBot: number,
    potH: number,
    leafCount: number,
    leafLen: number,
    leafW: number,
    archDrop: number
  ): THREE.Group => {
    const pGroup = new THREE.Group();
    pGroup.name = name;
    pGroup.userData.zone = 'courtyard';
    pGroup.position.set(uPos, yPos, vPos);
    groundGroup.add(pGroup);

    // Issue #5 ("plant isn't full of soil" at `[-19.031, -0.208, 20.75]`):
    // Keep the solid cylinder `potBody` slightly below `potH` (`bodyH = potH - 0.022`) so its solid top cap
    // never occludes the dark potting soil bed, and place the sculpted `soilDisc` + `soilMound`
    // directly at the top opening inside `potRim`!
    const bodyH = Math.max(0.08, potH - 0.022);
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(potRTop, potRBot, bodyH, 24),
      potMat
    );
    potBody.name = `${name}.potBody`;
    potBody.position.set(0, bodyH * 0.5, 0);
    potBody.castShadow = true;
    potBody.receiveShadow = true;
    pGroup.add(potBody);

    const rimRadius = Math.max(0.012, potRTop * 0.075);
    const potRim = new THREE.Mesh(
      new THREE.TorusGeometry(potRTop - rimRadius * 0.55, rimRadius, 14, 28),
      potMat
    );
    potRim.name = `${name}.potRim`;
    potRim.rotation.x = Math.PI / 2;
    potRim.position.set(0, potH - rimRadius * 0.65, 0);
    potRim.castShadow = true;
    potRim.receiveShadow = true;
    pGroup.add(potRim);

    const soilOuterR = Math.max(0.04, potRTop - rimRadius * 0.85);
    const soilDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(soilOuterR, soilOuterR * 0.96, 0.026, 24),
      pottingSoilMat
    );
    soilDisc.name = `${name}.soilDisc`;
    soilDisc.position.set(0, potH - 0.017, 0);
    soilDisc.receiveShadow = true;
    pGroup.add(soilDisc);

    // Subtle central crowned organic compost mound so the planter is visibly full to the rim
    const soilMound = new THREE.Mesh(
      new THREE.CylinderGeometry(soilOuterR * 0.52, soilOuterR * 0.95, 0.012, 20),
      pottingSoilMat
    );
    soilMound.name = `${name}.soilMound`;
    soilMound.position.set(0, potH - 0.002, 0);
    soilMound.receiveShadow = true;
    pGroup.add(soilMound);

    const pebbleCount = potRTop >= 0.15 ? 12 : 7;
    for (let p = 0; p < pebbleCount; p++) {
      const ang = (p / pebbleCount) * Math.PI * 2 + (p % 2) * 0.22;
      const rad = soilOuterR * (p % 2 === 0 ? 0.68 : 0.42);
      const pebble = new THREE.Mesh(
        new THREE.DodecahedronGeometry(potRTop >= 0.15 ? 0.016 : 0.01, 1),
        pebbleMat
      );
      pebble.name = `${name}.pebble.${p + 1}`;
      pebble.userData.lodTier = 'high';
      pebble.userData.lodMaxDistance = 12;
      pebble.scale.set(1.25, 0.52, 0.95);
      pebble.rotation.y = ang * 1.7;
      pebble.position.set(Math.cos(ang) * rad, potH - 0.001, Math.sin(ang) * rad);
      pGroup.add(pebble);
    }

    // Sculpted botanical leaf blades radiating from multi-tiered petioles rooted in the soil mound
    const leafGeo = createSculptedBotanicalLeafGeometry(leafLen, leafW, archDrop, 0.022);
    const leafMats = [deepEmeraldLeafMat, midBotanicalLeafMat, freshYoungLeafMat] as const;

    for (let i = 0; i < leafCount; i++) {
      const tier = i / leafCount; // 0 = outer lower leaves, 1 = inner tall crown leaves
      const azimuth = i * 2.39996 + uPos * 1.3; // Golden angle spiral distribution
      const stemH = 0.14 + tier * 0.36;
      const tiltOut = 0.2 + (1 - tier) * 0.46;
      const scale = 0.78 + tier * 0.34;

      const stemHolder = new THREE.Group();
      stemHolder.name = `${name}.stem.${i + 1}`;
      stemHolder.position.set(
        Math.cos(azimuth) * (soilOuterR * 0.34 * (1 - tier * 0.45)),
        potH - 0.004,
        Math.sin(azimuth) * (soilOuterR * 0.34 * (1 - tier * 0.45))
      );
      stemHolder.rotation.y = azimuth;
      pGroup.add(stemHolder);

      // Petiole stem rising and arching outward from the dark soil bed
      const petiole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.01, stemH, 8),
        woodyStemMat
      );
      petiole.name = `${name}.petiole.${i + 1}`;
      petiole.userData.lodTier = 'high';
      petiole.userData.lodMaxDistance = 12;
      petiole.position.set(0, stemH * 0.5 * Math.cos(tiltOut * 0.5), stemH * 0.5 * Math.sin(tiltOut * 0.5));
      petiole.rotation.x = tiltOut * 0.5;
      petiole.castShadow = true;
      stemHolder.add(petiole);

      // Sculpted leaf blade attached at top of petiole
      const leafMesh = new THREE.Mesh(leafGeo, leafMats[i % leafMats.length]!);
      leafMesh.name = `${name}.leaf.${i + 1}`;
      leafMesh.position.set(0, stemH * Math.cos(tiltOut * 0.5), stemH * Math.sin(tiltOut * 0.5));
      leafMesh.rotation.x = tiltOut;
      leafMesh.scale.setScalar(scale);
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      stemHolder.add(leafMesh);
    }

    return pGroup;
  };

  // 3A. SW Corner (`u = 0.58m, v = 4.98m`, flanking the West side of the Squat Rack): Tall Strelitzia nicolai (Bird of Paradise)
  addSculptedGymPlanter(
    'outbuildings.gym.plants.swBirdOfParadise',
    0.58,
    gymFloorY,
    4.98,
    charcoalPlanterMat,
    0.21,
    0.16,
    0.42,
    14,
    0.68,
    0.22,
    0.24
  );

  // 3B. SE Snake Plant (`u = 2.86m, v = 5.08m`, against the central South brick pilaster)
  addSculptedGymPlanter(
    'outbuildings.gym.plants.seSnakePlant',
    2.86,
    gymFloorY,
    5.08,
    limestonePlanterMat,
    0.19,
    0.15,
    0.38,
    18,
    0.56,
    0.11,
    0.05
  );

  // 3C. NW Corner (`u = 0.56m, v = 0.62m`, beside the Nike Grind Dumbbell Rack under the windows): Lush Monstera deliciosa
  addSculptedGymPlanter(
    'outbuildings.gym.plants.nwMonstera',
    0.56,
    gymFloorY,
    0.62,
    limestonePlanterMat,
    0.19,
    0.14,
    0.36,
    13,
    0.48,
    0.24,
    0.22
  );

  // 3D. Slatted European Oak & Matte-Black Steel Towel / Hydration Console Bench in NE Corner (`u = 5.44m, v = 0.72m`)
  //     Parented directly to `groundGroup` so it can be moved independently (Issue #3)
  const benchConsole = new THREE.Group();
  benchConsole.name = 'outbuildings.gym.hydrationBench';
  benchConsole.userData.zone = 'courtyard';
  benchConsole.position.set(5.44, gymFloorY, 0.72);
  groundGroup.add(benchConsole);

  const oakSlatMat = new THREE.MeshStandardMaterial({
    color: 0xb88c5a,
    roughness: 0.42,
    metalness: 0.04,
  });
  const whiteTowelMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ed,
    roughness: 0.85,
  });

  const consoleTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.032, 0.72),
    oakSlatMat
  );
  consoleTop.name = 'outbuildings.gym.hydrationBench.slattedOakTop';
  consoleTop.position.set(0, 0.46, 0);
  consoleTop.castShadow = true;
  consoleTop.receiveShadow = true;
  benchConsole.add(consoleTop);

  for (const sz of [-0.31, 0.31] as const) {
    const legFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.44, 0.032),
      blackAnodizedFrameMat
    );
    legFrame.name = `outbuildings.gym.hydrationBench.legFrame.${sz < 0 ? 'north' : 'south'}`;
    legFrame.position.set(0, 0.22, sz);
    legFrame.castShadow = true;
    benchConsole.add(legFrame);
  }

  // 3 Rolled white cotton gym towels on top of the bench
  let towelIdx = 0;
  for (const [ty, tz] of [
    [0.515, -0.18],
    [0.515, -0.06],
    [0.59, -0.12],
  ] as const) {
    towelIdx++;
    const towelRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.24, 16),
      whiteTowelMat
    );
    towelRoll.name = `outbuildings.gym.hydrationBench.towelRoll.${towelIdx}`;
    towelRoll.userData.lodTier = 'high';
    towelRoll.userData.lodMaxDistance = 12;
    towelRoll.rotation.z = Math.PI / 2;
    towelRoll.position.set(0, ty, tz);
    towelRoll.castShadow = true;
    benchConsole.add(towelRoll);
  }

  // Tabletop ceramic succulent/fern pot on the North end of the hydration bench (`z = +0.16m`),
  // parented directly to `groundGroup` as its own independent object (Issue #3)
  addSculptedGymPlanter(
    'outbuildings.gym.plants.neBenchPlant',
    5.44,
    gymFloorY + 0.476,
    0.88,
    charcoalPlanterMat,
    0.09,
    0.07,
    0.16,
    9,
    0.22,
    0.08,
    0.09
  );

  // ---------------------------------------------------------------------------
  // 4. Issue #4 ("rotate the yoga mat, make it full size not sure what this thing is I want to do planks on it and stuff"
  //    at `[-17.053, -0.581, 20.449]` on `outbuildings.gym.yogaMat.matPad`):
  //    Full-Size Unrolled Performance Plank & Floor-Exercise Mat (`1.88m x 0.78m x 0.008m`),
  //    rotated 90° so its long axis runs North-South (`v = 3.24..5.12m`) parallel to the treadmill
  //    and facing the South-East arched mirror, with a completely clear, flat surface ready for planks!
  // ---------------------------------------------------------------------------
  const yogaMatGroup = new THREE.Group();
  yogaMatGroup.name = 'outbuildings.gym.yogaMat';
  yogaMatGroup.userData.zone = 'courtyard';
  yogaMatGroup.position.set(4.88, gymFloorY, 4.18);
  yogaMatGroup.rotation.y = Math.PI / 2;
  groundGroup.add(yogaMatGroup);

  const createGymYogaMatTexture = (): THREE.CanvasTexture => {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d')!;

    // Deep eucalyptus-sage / slate natural rubber base with high-grip micro-cell grain
    c.fillStyle = '#344741';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) {
      const gx = (i * 193) % w;
      const gy = (i * 109) % h;
      c.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';
      c.fillRect(gx, gy, 2, 2);
    }

    // Laser-etched warm-linen perimeter border & plank / body-alignment guide lines
    c.strokeStyle = 'rgba(218, 204, 178, 0.52)';
    c.lineWidth = 3.5;
    c.strokeRect(28, 28, w - 56, h - 56);

    // Central longitudinal spine alignment axis + forearm/plank & foot stance T-bars
    c.beginPath();
    c.moveTo(96, h * 0.5);
    c.lineTo(w - 96, h * 0.5);
    c.moveTo(164, h * 0.22);
    c.lineTo(164, h * 0.78);
    c.moveTo(w - 164, h * 0.22);
    c.lineTo(w - 164, h * 0.78);
    c.stroke();

    // Central balance medallion
    c.beginPath();
    c.arc(w * 0.5, h * 0.5, 42, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(w * 0.5, h * 0.5, 14, 0, Math.PI * 2);
    c.stroke();

    // Symmetric 45-degree alignment chevrons
    c.beginPath();
    c.moveTo(290, h * 0.5 - 64);
    c.lineTo(354, h * 0.5);
    c.lineTo(290, h * 0.5 + 64);
    c.moveTo(w - 290, h * 0.5 - 64);
    c.lineTo(w - 354, h * 0.5);
    c.lineTo(w - 290, h * 0.5 + 64);
    c.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const yogaMatTopMat = new THREE.MeshStandardMaterial({
    map: createGymYogaMatTexture(),
    color: 0xffffff,
    roughness: 0.72,
    metalness: 0.04,
  });
  const yogaMatUndersideMat = new THREE.MeshStandardMaterial({
    color: 0x222e2a,
    roughness: 0.86,
    metalness: 0.02,
  });

  // Full-size unrolled cushioned plank & exercise mat (`1.88m long x 0.78m wide x 0.008m thick`)
  const matW = 1.88;
  const matD = 0.78;
  const matT = 0.008;
  const matPad = new THREE.Mesh(
    new THREE.BoxGeometry(matW, matT, matD),
    [
      yogaMatUndersideMat,
      yogaMatUndersideMat,
      yogaMatTopMat,
      yogaMatUndersideMat,
      yogaMatUndersideMat,
      yogaMatUndersideMat,
    ]
  );
  matPad.name = 'outbuildings.gym.yogaMat.matPad';
  matPad.position.set(0, matT * 0.5 + 0.001, 0);
  matPad.castShadow = true;
  matPad.receiveShadow = true;
  yogaMatGroup.add(matPad);

  // Subtle lower dark natural-rubber grip base layer (`1.89m x 0.79m x 0.003m`) giving a clean bevelled edge step
  const matBase = new THREE.Mesh(
    new THREE.BoxGeometry(matW + 0.01, 0.003, matD + 0.01),
    yogaMatUndersideMat
  );
  matBase.name = 'outbuildings.gym.yogaMat.gripBase';
  matBase.position.set(0, 0.0015, 0);
  matBase.receiveShadow = true;
  yogaMatGroup.add(matBase);
}
