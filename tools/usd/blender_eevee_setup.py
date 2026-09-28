#!/usr/bin/env python3
"""Blender 4.x EEVEE & Cycles Importer, Procedural Shader Builder & Render Script.

Opens the Crox Farmhouse OpenUSD stage (`usd/crox_farmhouse.usda` or `.usdc`) in
Blender, upgrades all imported materials to rich native Blender procedural
shader node networks compatible with **both EEVEE and Cycles** (Brick, Checker,
Voronoi Stone/Cobble, Wave Oak Grain, Woven Fabric, Plaster Bump, Light-Path
Architectural Glass), configures both EEVEE/EEVEE Next and Cycles (with automatic
GPU compute detection + OIDN denoising + Nishita physical sky), and optionally
renders any (or all) of the 13 camera presets.

Usage:
  1. Open interactively in Blender GUI (both EEVEE & Cycles pre-configured):
     blender --python tools/usd/blender_eevee_setup.py

  2. Render with EEVEE:
     blender -b --python tools/usd/blender_eevee_setup.py -- --engine eevee --camera livingRoom --output renders/livingRoom_eevee.png

  3. Render with Cycles (path-traced ArchViz):
     blender -b --python tools/usd/blender_eevee_setup.py -- --engine cycles --samples 256 --camera livingRoom --output renders/livingRoom_cycles.png

  4. Render all 13 camera presets:
     blender -b --python tools/usd/blender_eevee_setup.py -- --engine cycles --camera all --output-dir renders/

  5. Save a configured `.blend` file:
     blender -b --python tools/usd/blender_eevee_setup.py -- --save-blend usd/crox_farmhouse.blend
"""

import argparse
import os
import re
import sys

try:
  import bpy  # type: ignore[import-not-found]
except ImportError:
  print(
      "This script must be run inside Blender:\n"
      "  blender --python tools/usd/blender_eevee_setup.py",
      file=sys.stderr,
  )
  sys.exit(1)


def parse_material_metadata_from_usda(materials_usda_path: str) -> dict[str, dict]:
  """Parses `custom uniform token procedural:*` attributes from `usd/materials/materials.usda`."""
  if not os.path.exists(materials_usda_path):
    return {}

  with open(materials_usda_path, "r", encoding="utf-8") as f:
    text = f.read()

  meta_by_name: dict[str, dict] = {}
  current_mat: str | None = None

  vec3_re = re.compile(
      r"\(\s*([-+0-9.eE]+)\s*,\s*([-+0-9.eE]+)\s*,\s*([-+0-9.eE]+)\s*\)"
  )
  vec2_re = re.compile(r"\(\s*([-+0-9.eE]+)\s*,\s*([-+0-9.eE]+)\s*\)")

  for raw_line in text.splitlines():
    line = raw_line.strip()
    m_mat = re.match(r'^def\s+Material\s+"([^"]+)"', line)
    if m_mat:
      current_mat = m_mat.group(1)
      meta_by_name[current_mat] = {}
      continue
    if not current_mat:
      continue

    if line.startswith("custom uniform token procedural:kind"):
      m = re.search(r'=\s*"([^"]+)"', line)
      if m:
        meta_by_name[current_mat]["kind"] = m.group(1)
    elif line.startswith("custom color3f procedural:primaryColor"):
      m = vec3_re.search(line)
      if m:
        meta_by_name[current_mat]["primaryColor"] = (
            float(m.group(1)),
            float(m.group(2)),
            float(m.group(3)),
        )
    elif line.startswith("custom color3f procedural:secondaryColor"):
      m = vec3_re.search(line)
      if m:
        meta_by_name[current_mat]["secondaryColor"] = (
            float(m.group(1)),
            float(m.group(2)),
            float(m.group(3)),
        )
    elif line.startswith("custom color3f procedural:accentColor"):
      m = vec3_re.search(line)
      if m:
        meta_by_name[current_mat]["accentColor"] = (
            float(m.group(1)),
            float(m.group(2)),
            float(m.group(3)),
        )
    elif line.startswith("custom float2 procedural:uvScale"):
      m = vec2_re.search(line)
      if m:
        meta_by_name[current_mat]["uvScale"] = (
            float(m.group(1)),
            float(m.group(2)),
        )
    elif line.startswith("custom float procedural:mortarWidth"):
      m = re.search(r"=\s*([-+0-9.eE]+)", line)
      if m:
        meta_by_name[current_mat]["mortarWidth"] = float(m.group(1))
    elif line.startswith("custom float procedural:bumpStrength"):
      m = re.search(r"=\s*([-+0-9.eE]+)", line)
      if m:
        meta_by_name[current_mat]["bumpStrength"] = float(m.group(1))

  return meta_by_name


def enhance_material_for_eevee_and_cycles(
    mat: "bpy.types.Material", meta: dict
) -> None:
  """Builds native Blender procedural shader nodes for both EEVEE and Cycles."""
  if not mat.use_nodes or not mat.node_tree:
    mat.use_nodes = True

  if hasattr(mat, "cycles") and hasattr(mat.cycles, "displacement_method"):
    try:
      mat.cycles.displacement_method = "BOTH"
    except Exception:
      pass

  tree = mat.node_tree
  nodes = tree.nodes
  links = tree.links

  bsdf = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
  out_node = next((n for n in nodes if n.type == "OUTPUT_MATERIAL"), None)
  if not bsdf or not out_node:
    return

  kind = meta.get("kind", "solid")
  primary = meta.get("primaryColor")
  secondary = meta.get("secondaryColor")
  accent = meta.get("accentColor")
  uv_scale = meta.get("uvScale", (4.0, 4.0))
  mortar_w = meta.get("mortarWidth", 0.04)
  bump_strength = meta.get("bumpStrength", 0.01)

  # Configure Architectural Glass for both Cycles (LightPath shadow/diffuse bypass) and EEVEE
  if kind == "architectural_glass":
    if hasattr(mat, "blend_method"):
      mat.blend_method = "BLEND"
    if hasattr(mat, "shadow_method"):
      mat.shadow_method = "NONE"
    if hasattr(mat, "use_screen_refraction"):
      mat.use_screen_refraction = True
    if "Roughness" in bsdf.inputs:
      bsdf.inputs["Roughness"].default_value = 0.02
    if "IOR" in bsdf.inputs:
      bsdf.inputs["IOR"].default_value = 1.52
    if "Transmission Weight" in bsdf.inputs:
      bsdf.inputs["Transmission Weight"].default_value = 0.92
    elif "Transmission" in bsdf.inputs:
      bsdf.inputs["Transmission"].default_value = 0.92
    if "Alpha" in bsdf.inputs:
      bsdf.inputs["Alpha"].default_value = 0.24

    # In Cycles, mix with Transparent BSDF on Shadow & Diffuse rays so exterior daylight
    # passes cleanly through double-glazed windows without casting dark refractive shadows
    light_path = nodes.new("ShaderNodeLightPath")
    light_path.location = (-260, 320)

    math_max = nodes.new("ShaderNodeMath")
    math_max.operation = "MAXIMUM"
    math_max.location = (-60, 320)
    links.new(light_path.outputs["Is Shadow Ray"], math_max.inputs[0])
    links.new(light_path.outputs["Is Diffuse Ray"], math_max.inputs[1])

    transp_bsdf = nodes.new("ShaderNodeBsdfTransparent")
    transp_bsdf.location = (-60, 160)
    transp_bsdf.inputs["Color"].default_value = (0.96, 0.98, 1.0, 1.0)

    mix_shader = nodes.new("ShaderNodeMixShader")
    mix_shader.location = (220, 180)
    links.new(math_max.outputs["Value"], mix_shader.inputs["Fac"])
    links.new(bsdf.outputs["BSDF"], mix_shader.inputs[1])
    links.new(transp_bsdf.outputs["BSDF"], mix_shader.inputs[2])
    links.new(mix_shader.outputs["Shader"], out_node.inputs["Surface"])
    return

  if kind in ("solid", "brushed_metal", "emissive_display") or not primary:
    return

  # Skip if material already uses an external Image Texture (e.g. vesper-olive-gold-rug.jpg)
  if any(n.type == "TEX_IMAGE" for n in nodes):
    return

  tex_coord = nodes.new("ShaderNodeTexCoord")
  tex_coord.location = (-900, 100)

  mapping = nodes.new("ShaderNodeMapping")
  mapping.location = (-700, 100)
  mapping.inputs["Scale"].default_value = (uv_scale[0], uv_scale[1], uv_scale[0])
  links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

  bump_node = nodes.new("ShaderNodeBump")
  bump_node.location = (-220, -180)
  bump_node.inputs["Strength"].default_value = min(
      0.35, max(0.05, bump_strength * 10.0)
  )
  bump_node.inputs["Distance"].default_value = 0.015
  links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])

  c1 = (*primary, 1.0)
  c2 = (
      *(secondary or (primary[0] * 0.85, primary[1] * 0.85, primary[2] * 0.85)),
      1.0,
  )
  c3 = (
      *(accent or (primary[0] * 0.78, primary[1] * 0.75, primary[2] * 0.72)),
      1.0,
  )

  if kind in ("brick_bond", "herringbone_brick", "slate_tile"):
    brick = nodes.new("ShaderNodeTexBrick")
    brick.location = (-460, 140)
    brick.offset = 0.5
    brick.offset_frequency = 2
    brick.inputs["Color1"].default_value = c1
    brick.inputs["Color2"].default_value = c3
    brick.inputs["Mortar"].default_value = c2
    brick.inputs["Scale"].default_value = 2.8 if kind != "slate_tile" else 4.2
    brick.inputs["Mortar Size"].default_value = mortar_w * 0.25
    brick.inputs["Mortar Smooth"].default_value = 0.15
    brick.inputs["Bias"].default_value = 0.0
    brick.inputs["Brick Width"].default_value = (
        0.225 if kind != "slate_tile" else 0.32
    )
    brick.inputs["Row Height"].default_value = (
        0.075 if kind != "slate_tile" else 0.20
    )
    links.new(mapping.outputs["Vector"], brick.inputs["Vector"])
    links.new(brick.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(brick.outputs["Fac"], bump_node.inputs["Height"])

  elif kind == "checker_tile":
    checker = nodes.new("ShaderNodeTexChecker")
    checker.location = (-460, 140)
    checker.inputs["Color1"].default_value = c1
    checker.inputs["Color2"].default_value = c2
    checker.inputs["Scale"].default_value = 4.0
    links.new(mapping.outputs["Vector"], checker.inputs["Vector"])
    links.new(checker.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(checker.outputs["Fac"], bump_node.inputs["Height"])

  elif kind in ("cobblestone", "natural_stone"):
    voronoi = nodes.new("ShaderNodeTexVoronoi")
    voronoi.location = (-480, 140)
    voronoi.inputs["Scale"].default_value = 9.0 if kind == "cobblestone" else 2.5
    links.new(mapping.outputs["Vector"], voronoi.inputs["Vector"])

    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.location = (-240, 140)
    mix.inputs["A"].default_value = c1
    mix.inputs["B"].default_value = c2
    links.new(voronoi.outputs["Distance"], mix.inputs["Factor"])
    links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    links.new(voronoi.outputs["Distance"], bump_node.inputs["Height"])

  elif kind == "wood_grain":
    wave = nodes.new("ShaderNodeTexWave")
    wave.location = (-480, 140)
    wave.wave_type = "BANDS"
    wave.inputs["Scale"].default_value = 3.2
    wave.inputs["Distortion"].default_value = 4.5
    wave.inputs["Detail"].default_value = 3.0
    links.new(mapping.outputs["Vector"], wave.inputs["Vector"])

    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.location = (-240, 140)
    mix.inputs["A"].default_value = c1
    mix.inputs["B"].default_value = c2
    links.new(wave.outputs["Fac"], mix.inputs["Factor"])
    links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    links.new(wave.outputs["Fac"], bump_node.inputs["Height"])

  else:
    noise = nodes.new("ShaderNodeTexNoise")
    noise.location = (-480, 140)
    noise.inputs["Scale"].default_value = (
        18.0 if kind == "woven_fabric" else 8.0
    )
    noise.inputs["Detail"].default_value = 4.0
    noise.inputs["Roughness"].default_value = 0.65
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])

    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.location = (-240, 140)
    mix.inputs["A"].default_value = c1
    mix.inputs["B"].default_value = c2
    links.new(noise.outputs["Fac"], mix.inputs["Factor"])
    links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump_node.inputs["Height"])


def configure_cycles_gpu(scene: "bpy.types.Scene", samples: int) -> None:
  """Configures Cycles path-tracing settings, bounces, denoising, and GPU compute."""
  if not hasattr(scene, "cycles"):
    return

  cycles = scene.cycles
  for attr, val in [
      ("samples", samples),
      ("preview_samples", min(64, samples)),
      ("use_adaptive_sampling", True),
      ("adaptive_threshold", 0.01),
      ("use_denoising", True),
      ("max_bounces", 12),
      ("diffuse_bounces", 4),
      ("glossy_bounces", 4),
      ("transmission_bounces", 12),
      ("volume_bounces", 0),
      ("transparent_max_bounces", 8),
      ("caustics_reflective", False),
      ("caustics_refractive", False),
  ]:
    if hasattr(cycles, attr):
      try:
        setattr(cycles, attr, val)
      except Exception:
        pass

  # Attempt to enable fastest available GPU backend (OPTIX > CUDA > METAL > HIP > ONEAPI)
  try:
    prefs = bpy.context.preferences
    cprefs = prefs.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA", "METAL", "HIP", "ONEAPI"):
      try:
        cprefs.compute_device_type = backend
        cprefs.get_devices()
        gpu_devs = [d for d in cprefs.devices if d.type != "CPU"]
        if gpu_devs:
          for d in cprefs.devices:
            d.use = True
          cycles.device = "GPU"
          print(f"[Blender Cycles] Enabled GPU backend: {backend}")
          break
      except Exception:
        continue
  except Exception:
    pass


def configure_render_engines_and_world(
    scene: "bpy.types.Scene", preferred_engine: str, samples: int
) -> None:
  """Configures both EEVEE and Cycles plus a physical Nishita Sky World shader."""
  # 1. Configure EEVEE / EEVEE Next
  eevee = scene.eevee
  for attr, val in [
      ("taa_render_samples", max(64, samples)),
      ("taa_samples", 16),
      ("use_gtao", True),
      ("gtao_distance", 0.6),
      ("use_ssr", True),
      ("use_ssr_refraction", True),
      ("use_raytracing", True),
      ("use_shadows", True),
      ("shadow_cube_size", "2048"),
      ("shadow_cascade_size", "4096"),
      ("use_soft_shadows", True),
  ]:
    if hasattr(eevee, attr):
      try:
        setattr(eevee, attr, val)
      except Exception:
        pass

  # 2. Configure Cycles
  configure_cycles_gpu(scene, samples)

  # 3. Select active engine based on `--engine {eevee,cycles}`
  available_engines = {
      e.identifier
      for e in scene.render.bl_rna.properties["engine"].enum_items
  }
  if preferred_engine.lower() == "cycles" and "CYCLES" in available_engines:
    scene.render.engine = "CYCLES"
  elif "BLENDER_EEVEE_NEXT" in available_engines:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
  elif "BLENDER_EEVEE" in available_engines:
    scene.render.engine = "BLENDER_EEVEE"

  scene.render.resolution_x = 1920
  scene.render.resolution_y = 1080
  scene.render.resolution_percentage = 100
  scene.render.film_transparent = False

  # Configure Color Management (AgX or Filmic)
  try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
  except Exception:
    try:
      scene.view_settings.view_transform = "Filmic"
      scene.view_settings.look = "Medium High Contrast"
    except Exception:
      pass

  # Build World Sky Dome shader (compatible with both Cycles and EEVEE)
  if not scene.world:
    scene.world = bpy.data.worlds.new("CroxFarmhouseWorld")
  world = scene.world
  world.use_nodes = True
  wtree = world.node_tree
  wnodes = wtree.nodes
  wlinks = wtree.links
  wnodes.clear()

  bg = wnodes.new("ShaderNodeBackground")
  bg.location = (0, 0)
  bg.inputs["Strength"].default_value = 0.55

  sky = wnodes.new("ShaderNodeTexSky")
  sky.location = (-280, 0)
  if hasattr(sky, "sky_type"):
    sky.sky_type = "NISHITA"
  if hasattr(sky, "sun_elevation"):
    sky.sun_elevation = 0.68
  if hasattr(sky, "sun_rotation"):
    sky.sun_rotation = 0.52

  out = wnodes.new("ShaderNodeOutputWorld")
  out.location = (220, 0)
  wlinks.new(sky.outputs["Color"], bg.inputs["Color"])
  wlinks.new(bg.outputs["Background"], out.inputs["Surface"])


def main() -> None:
  argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
  parser = argparse.ArgumentParser(
      description="Crox Farmhouse Blender EEVEE & Cycles Setup & Renderer"
  )
  parser.add_argument(
      "--stage",
      default="usd/crox_farmhouse.usda",
      help="Path to the OpenUSD stage (.usda or .usdc)",
  )
  parser.add_argument(
      "--engine",
      choices=["eevee", "cycles"],
      default="eevee",
      help="Active render engine to select (both EEVEE and Cycles are configured)",
  )
  parser.add_argument(
      "--samples",
      type=int,
      default=128,
      help="Render sample count for Cycles / EEVEE (default: 128)",
  )
  parser.add_argument(
      "--camera",
      default="livingRoom",
      help="Camera preset ID to activate/render (e.g. overview, livingRoom, island, hall, all)",
  )
  parser.add_argument(
      "--cutaway",
      action="store_true",
      default=True,
      help="Hide roofAndCeilings for ground-floor interior cutaway views",
  )
  parser.add_argument(
      "--full-roof",
      action="store_true",
      default=False,
      help="Keep roofAndCeilings visible even on interior camera presets",
  )
  parser.add_argument(
      "--output", default="", help="Render a PNG image to this file path"
  )
  parser.add_argument(
      "--output-dir",
      default="",
      help="When --camera all is used, render all 13 cameras into this directory",
  )
  parser.add_argument(
      "--save-blend",
      default="",
      help="Save the configured Blender scene to this .blend file path",
  )
  args = parser.parse_args(argv)

  stage_path = os.path.abspath(args.stage)
  if not os.path.exists(stage_path):
    print(f"ERROR: USD stage not found at {stage_path}", file=sys.stderr)
    sys.exit(1)

  bpy.ops.wm.read_factory_settings(use_empty=True)

  print(f"[Blender] Importing OpenUSD stage: {stage_path}")
  bpy.ops.wm.usd_import(
      filepath=stage_path,
      import_cameras=True,
      import_curves=True,
      import_lights=True,
      import_materials=True,
      import_meshes=True,
      import_subdiv=True,
      scale=1.0,
      read_mesh_uvs=True,
      read_mesh_colors=True,
      import_visible_only=False,
  )

  materials_usda = os.path.join(
      os.path.dirname(stage_path), "materials", "materials.usda"
  )
  mat_meta = parse_material_metadata_from_usda(materials_usda)
  upgraded = 0
  for mat in bpy.data.materials:
    base_name = mat.name.split(".")[0]
    if base_name in mat_meta:
      enhance_material_for_eevee_and_cycles(mat, mat_meta[base_name])
      upgraded += 1

  scene = bpy.context.scene
  configure_render_engines_and_world(scene, args.engine, args.samples)

  cameras_by_id: dict[str, "bpy.types.Object"] = {}
  for obj in bpy.data.objects:
    if obj.type == "CAMERA" and obj.name.startswith("Cam_"):
      preset_id = obj.name[len("Cam_") :].split(".")[0]
      cameras_by_id[preset_id] = obj

  print(
      f"[Blender] Active Engine: {scene.render.engine} | Configured {upgraded}"
      f" procedural materials (EEVEE + Cycles) and {len(cameras_by_id)} cameras:"
      f" {sorted(cameras_by_id.keys())}"
  )

  def set_roof_cutaway(hide_roof: bool) -> None:
    for obj in bpy.data.objects:
      if obj.name.startswith("roofAndCeilings"):
        obj.hide_render = hide_roof
        obj.hide_viewport = hide_roof
        for child in obj.children_recursive:
          child.hide_render = hide_roof
          child.hide_viewport = hide_roof

  if args.camera in cameras_by_id:
    scene.camera = cameras_by_id[args.camera]
    is_exterior_cam = args.camera in ("courtyardGates", "upstairs")
    set_roof_cutaway(
        args.cutaway and not args.full_roof and not is_exterior_cam
    )

  if args.save_blend:
    blend_out = os.path.abspath(args.save_blend)
    os.makedirs(os.path.dirname(blend_out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_out)
    print(f"[Blender] Saved .blend file to {blend_out}")

  if args.camera == "all" and args.output_dir:
    out_dir = os.path.abspath(args.output_dir)
    os.makedirs(out_dir, exist_ok=True)
    for preset_id, cam_obj in sorted(cameras_by_id.items()):
      scene.camera = cam_obj
      is_exterior_cam = preset_id in ("courtyardGates", "upstairs")
      set_roof_cutaway(
          args.cutaway and not args.full_roof and not is_exterior_cam
      )
      out_file = os.path.join(out_dir, f"{preset_id}_{args.engine}.png")
      scene.render.filepath = out_file
      bpy.ops.render.render(write_still=True)
      print(f"[Blender {args.engine.upper()}] Rendered {preset_id} -> {out_file}")
  elif args.output:
    out_file = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    scene.render.filepath = out_file
    bpy.ops.render.render(write_still=True)
    print(f"[Blender {args.engine.upper()}] Rendered {args.camera} -> {out_file}")


if __name__ == "__main__":
  main()
