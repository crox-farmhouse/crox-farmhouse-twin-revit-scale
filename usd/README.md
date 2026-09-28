# Crox Farmhouse — OpenUSD Stage (`#usda 1.0` / `.usdc` / `.usdz`)

This directory contains the composed **OpenUSD (`26.8`)** stage for **Crox Farmhouse**, serving both **High-LOD ArchViz** (**Blender EEVEE & Cycles**, **Unreal Engine 5**) and the **KNX Smart Home Digital Twin**.

## Stage Hierarchy & Layer Architecture

- **[`crox_farmhouse.usda`](./crox_farmhouse.usda)** — Root ASCII OpenUSD stage (`upAxis = "Y"`, `metersPerUnit = 1`).
  - Declares root `/CroxFarmhouse` (`kind = "assembly"`) with two **VariantSets**:
    - `lod = "hero" | "standard" | "shell"`
    - `roofCutaway = "fullBuilding" | "groundFloorCutaway"`
  - Composes via `subLayers`:
    1. **[`overrides/layout.usda`](./overrides/layout.usda)** — Highest-strength non-destructive layout & annotation override layer (`over` directives exported from the web app's 3D Annotator HUD).
    2. **[`lighting/cameras_and_lights.usda`](./lighting/cameras_and_lights.usda)** — 21 physical KNX lighting circuits (`UsdLuxSphereLight` / `DiskLight` / `DistantLight` / `DomeLight` with `ShapingAPI` & `colorTemperature`) and 13 `UsdGeomCamera` viewpoints.
    3. **[`materials/materials.usda`](./materials/materials.usda)** — 633 deduplicated materials authored with **dual shader networks**:
       - **MaterialX (`outputs:mtlx:surface` / `ND_standard_surface_surfaceshader`)** + procedural noise/tiling nodes (`ND_tiledimage_*`, `ND_fractal3d_*`, `ND_bump_vector3`) for Unreal Engine 5 & Blender 4.x.
       - **`UsdPreviewSurface` (`outputs:surface`)** fallback for `usdview`, QuickLook, and Three.js `USDZLoader`.
- **[`zones/*.usda`](./zones/)** — 20 modular room & building-system payload layers (`kitchen`, `livingRoom`, `sittingRoom`, `diningRoom`, `hall`, `study`, `mainBedroom`, `exterior`, `ufhSystem`, etc.) authored with native USD parametric primitives (`Cube`, `Cylinder`, `Sphere`, `Cone`) + `Mesh` (with `GeomSubset` multi-materials) and `UsdPhysics` (`PhysicsCollisionAPI`) on walkable/structural surfaces.
- **[`crox_farmhouse_unreal.usda`](./crox_farmhouse_unreal.usda)** — Unreal Engine 5 entry layer wrapping `crox_farmhouse.usda`.
- **[`crox_farmhouse.usdc`](./crox_farmhouse.usdc)** — Flattened binary Crate stage (`5.13 MB`) compiled with Pixar's C++ `pxr` SDK for zero-parse-overhead loading in Blender, Unreal Engine 5, and `usdview`.
- **[`crox_farmhouse.usdz`](./crox_farmhouse.usdz)** — Uncompressed 64-byte-aligned USDZ archive (`UsdUtils.CreateNewUsdzPackage`).

---

## 1. Opening & Rendering in Blender (EEVEE & Cycles)

### Option A — Automated CLI Setup & Render (`EEVEE` or `Cycles`)

```bash
# Render with Blender EEVEE Next (Raytracing + GTAO + Procedural Shader Graphs):
blender --background --python tools/usd/blender_eevee_setup.py -- \
  --usd usd/crox_farmhouse.usdc \
  --engine eevee \
  --camera Cam_kitchen_overview \
  --output shots/blender_eevee.png

# Render with Blender Cycles (Path Tracing + GPU Compute + OIDN Denoiser + Architectural Glass Light-Path Bypass):
blender --background --python tools/usd/blender_eevee_setup.py -- \
  --usd usd/crox_farmhouse.usdc \
  --engine cycles \
  --samples 256 \
  --camera Cam_kitchen_overview \
  --output shots/blender_cycles.png

# Save a ready-to-use .blend file with both EEVEE & Cycles configured:
blender --background --python tools/usd/blender_eevee_setup.py -- \
  --usd usd/crox_farmhouse.usdc \
  --engine cycles \
  --save-blend usd/crox_farmhouse.blend
```

### Option B — Interactive in Blender GUI

1. Open Blender 4.x and import `usd/crox_farmhouse.usdc` (or `usd/crox_farmhouse.usda`) via **File → Import → Universal Scene Description (`.usd*`)**.
2. Open `tools/usd/blender_eevee_setup.py` in Blender's **Scripting** workspace and click **Run Script** — it configures **both EEVEE and Cycles** (procedural brick/herringbone/tile/wood/plaster/stone shader nodes, architectural glass `Light Path` shadow transparency for Cycles interior daylighting, GPU compute + OIDN denoising, AgX color management, and physical Sun/Sky).
3. Switch freely between **EEVEE** and **Cycles** in **Render Properties → Render Engine**.

---

## 2. Importing into Unreal Engine 5 (`USD Stage Actor` / `Interchange`)

1. Enable the **USD Importer** and **MaterialX (`Interchange`)** plugins in Unreal Engine 5.
2. Open **Window → Virtual Production → USD Stage**.
3. Click **File → Open** and select `usd/crox_farmhouse_unreal.usda` (or `usd/crox_farmhouse.usdc`).
4. Use the `USD Stage Actor` Details panel to switch **VariantSets** (`lod = hero | standard | shell`, `roofCutaway = fullBuilding | groundFloorCutaway`) and pilot any of the 13 `UsdGeomCamera` viewpoints under `/CroxFarmhouse/Cameras`.

---

## 3. Rebuilding the USD Stage

```bash
npm run usd:build
```
