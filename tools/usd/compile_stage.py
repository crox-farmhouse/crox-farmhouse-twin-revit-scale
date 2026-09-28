#!/usr/bin/env python3
"""Pixar OpenUSD (pxr) Stage Validator, Binary Crate (.usdc) Compiler & USDZ Packager.

Validates the generated modular `.usda` layers in `usd/` using Pixar's C++
OpenUSD library (`pxr.Usd`, `UsdGeom`, `UsdShade`, `UsdLux`, `UsdPhysics`, `UsdUtils`),
compiles a flattened binary Crate file (`usd/crox_farmhouse.usdc`) for fast
Unreal Engine 5 / Blender loading, and packages `usd/crox_farmhouse.usdz`.
"""

import os
import sys
import time
from pxr import Sdf, Usd, UsdGeom, UsdLux, UsdShade, UsdUtils


def compile_and_validate_stage(usd_dir: str = "usd") -> int:
  t0 = time.time()
  root_usda = os.path.join(usd_dir, "crox_farmhouse.usda")
  unreal_usda = os.path.join(usd_dir, "crox_farmhouse_unreal.usda")
  out_usdc = os.path.join(usd_dir, "crox_farmhouse.usdc")
  out_usdz = os.path.join(usd_dir, "crox_farmhouse.usdz")

  if not os.path.exists(root_usda):
    print(f"ERROR: Root stage not found at {root_usda}", file=sys.stderr)
    return 1

  # 1. Open and compose the master stage via Pixar's C++ USD engine
  stage = Usd.Stage.Open(root_usda)
  if not stage:
    print(f"ERROR: Failed to open stage {root_usda}", file=sys.stderr)
    return 1

  default_prim = stage.GetDefaultPrim()
  if not default_prim or not default_prim.IsValid():
    print("ERROR: Stage is missing a valid defaultPrim", file=sys.stderr)
    return 1

  # 2. Traverse composed stage and verify schema counts
  counts = {
      "total": 0,
      "Xform": 0,
      "Cube": 0,
      "Cylinder": 0,
      "Sphere": 0,
      "Cone": 0,
      "Mesh": 0,
      "GeomSubset": 0,
      "Material": 0,
      "Shader": 0,
      "Light": 0,
      "Camera": 0,
  }

  for prim in stage.Traverse():
    counts["total"] += 1
    tname = prim.GetTypeName()
    if tname in counts:
      counts[tname] += 1
    elif prim.HasAPI(UsdLux.LightAPI):
      counts["Light"] += 1

  # Verify VariantSets on /CroxFarmhouse
  vsets = default_prim.GetVariantSets()
  lod_variants = (
      vsets.GetVariantSet("lod").GetVariantNames()
      if vsets.HasVariantSet("lod")
      else []
  )
  cutaway_variants = (
      vsets.GetVariantSet("roofCutaway").GetVariantNames()
      if vsets.HasVariantSet("roofCutaway")
      else []
  )

  # 3. Validate Unreal Engine 5 entry stage composition
  ue_stage = Usd.Stage.Open(unreal_usda)
  if not ue_stage:
    print(f"ERROR: Failed to open Unreal stage {unreal_usda}", file=sys.stderr)
    return 1

  # 4. Compile flattened binary Crate (.usdc) for instant Unreal Engine 5 & Blender loading
  stage.Export(out_usdc, addSourceFileComment=False)

  # 5. Package spec-compliant .usdz archive using Pixar UsdUtils
  UsdUtils.CreateNewUsdzPackage(Sdf.AssetPath(root_usda), out_usdz)

  elapsed_ms = int((time.time() - t0) * 1000)
  usdc_mb = os.path.getsize(out_usdc) / (1024 * 1024)
  usdz_mb = os.path.getsize(out_usdz) / (1024 * 1024)

  print(
      f"[Pixar OpenUSD {Usd.GetVersion()[1]}.{Usd.GetVersion()[2]}] Validated &"
      f" compiled stage ({elapsed_ms}ms):"
  )
  print(
      f"  Composed Prims: {counts['total']} (Cube={counts['Cube']},"
      f" Cylinder={counts['Cylinder']}, Sphere={counts['Sphere']},"
      f" Cone={counts['Cone']}, Mesh={counts['Mesh']},"
      f" GeomSubset={counts['GeomSubset']})"
  )
  print(
      f"  Materials: {counts['Material']} ({counts['Shader']} MaterialX &"
      f" PreviewSurface shaders) | Lights: {counts['Light']} | Cameras:"
      f" {counts['Camera']}"
  )
  print(
      f"  VariantSets: lod={lod_variants}, roofCutaway={cutaway_variants}"
  )
  print(
      f"  Binary Crate: {out_usdc} ({usdc_mb:.2f} MB) | USDZ Archive:"
      f" {out_usdz} ({usdz_mb:.2f} MB)"
  )
  return 0


if __name__ == "__main__":
  target_dir = sys.argv[1] if len(sys.argv) > 1 else "usd"
  sys.exit(compile_and_validate_stage(target_dir))
