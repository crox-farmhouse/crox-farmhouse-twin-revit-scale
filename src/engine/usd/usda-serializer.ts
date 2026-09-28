import type {
  UsdBasisCurvesData,
  UsdCameraData,
  UsdConeData,
  UsdCubeData,
  UsdCustomAttributeValue,
  UsdCylinderData,
  UsdGeomSubsetData,
  UsdLuxLightData,
  UsdMeshData,
  UsdPreviewSurfaceData,
  UsdPrim,
  UsdSphereData,
  UsdStageDocument,
  UsdTextureRef,
  UsdVariantOption,
  UsdXformOps,
} from './schema.ts';

function fmtNum(n: number): string {
  const rounded = Math.round(n * 1e5) / 1e5;
  const val = Object.is(rounded, -0) ? 0 : rounded;
  return String(val);
}

function fmtVec3(v: readonly [number, number, number]): string {
  return `(${fmtNum(v[0])}, ${fmtNum(v[1])}, ${fmtNum(v[2])})`;
}

function fmtVec2(v: readonly [number, number]): string {
  return `(${fmtNum(v[0])}, ${fmtNum(v[1])})`;
}

function escapeUsdString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function formatCustomDataDict(
  dict: Readonly<Record<string, string | number | boolean>>,
  indent: string
): string[] {
  const entries = Object.entries(dict);
  if (entries.length === 0) return [];
  const lines: string[] = [`${indent}customData = {`];
  for (const [k, v] of entries) {
    const safeKey = k.replace(/[^A-Za-z0-9_]/g, '_');
    if (typeof v === 'string') {
      lines.push(`${indent}    string ${safeKey} = "${escapeUsdString(v)}"`);
    } else if (typeof v === 'boolean') {
      lines.push(`${indent}    bool ${safeKey} = ${v ? 'true' : 'false'}`);
    } else if (Number.isInteger(v)) {
      lines.push(`${indent}    int ${safeKey} = ${v}`);
    } else {
      lines.push(`${indent}    double ${safeKey} = ${fmtNum(v)}`);
    }
  }
  lines.push(`${indent}}`);
  return lines;
}

function serializeXformOps(xform: UsdXformOps, indent: string): string[] {
  const lines: string[] = [];
  const opOrder: string[] = [];

  if (xform.translate) {
    const [tx, ty, tz] = xform.translate;
    if (Math.abs(tx) > 1e-6 || Math.abs(ty) > 1e-6 || Math.abs(tz) > 1e-6) {
      lines.push(`${indent}double3 xformOp:translate = ${fmtVec3(xform.translate)}`);
      opOrder.push('"xformOp:translate"');
    }
  }

  if (xform.rotateXYZDeg) {
    const [rx, ry, rz] = xform.rotateXYZDeg;
    if (Math.abs(rx) > 1e-5 || Math.abs(ry) > 1e-5 || Math.abs(rz) > 1e-5) {
      lines.push(`${indent}float3 xformOp:rotateXYZ = ${fmtVec3(xform.rotateXYZDeg)}`);
      opOrder.push('"xformOp:rotateXYZ"');
    }
  }

  if (xform.scale) {
    const [sx, sy, sz] = xform.scale;
    if (
      Math.abs(sx - 1) > 1e-5 ||
      Math.abs(sy - 1) > 1e-5 ||
      Math.abs(sz - 1) > 1e-5
    ) {
      lines.push(`${indent}float3 xformOp:scale = ${fmtVec3(xform.scale)}`);
      opOrder.push('"xformOp:scale"');
    }
  }

  if (opOrder.length > 0) {
    lines.push(`${indent}uniform token[] xformOpOrder = [${opOrder.join(', ')}]`);
  }
  return lines;
}

function serializeGeomSubset(subset: UsdGeomSubsetData, indent: string): string[] {
  return [
    `${indent}def GeomSubset "${subset.name}" (`,
    `${indent}    prepend apiSchemas = ["MaterialBindingAPI"]`,
    `${indent})`,
    `${indent}{`,
    `${indent}    uniform token elementType = "face"`,
    `${indent}    uniform token familyName = "materialBind"`,
    `${indent}    int[] indices = [${subset.faceIndices.join(', ')}]`,
    `${indent}    rel material:binding = <${subset.materialBindingPath}>`,
    `${indent}}`,
  ];
}

function serializeCubeBody(cube: UsdCubeData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}double size = ${fmtNum(cube.size)}`);
  if (cube.doubleSided !== undefined) {
    lines.push(`${indent}bool doubleSided = ${cube.doubleSided ? 'true' : 'false'}`);
  }
  if (cube.extent) {
    lines.push(
      `${indent}float3[] extent = [${fmtVec3(cube.extent[0])}, ${fmtVec3(cube.extent[1])}]`
    );
  }
  return lines;
}

function serializeCylinderBody(cyl: UsdCylinderData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}uniform token axis = "${cyl.axis ?? 'Y'}"`);
  lines.push(`${indent}double height = ${fmtNum(cyl.height)}`);
  lines.push(`${indent}double radius = ${fmtNum(cyl.radius)}`);
  if (cyl.doubleSided !== undefined) {
    lines.push(`${indent}bool doubleSided = ${cyl.doubleSided ? 'true' : 'false'}`);
  }
  if (cyl.extent) {
    lines.push(
      `${indent}float3[] extent = [${fmtVec3(cyl.extent[0])}, ${fmtVec3(cyl.extent[1])}]`
    );
  }
  return lines;
}

function serializeSphereBody(sph: UsdSphereData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}double radius = ${fmtNum(sph.radius)}`);
  if (sph.doubleSided !== undefined) {
    lines.push(`${indent}bool doubleSided = ${sph.doubleSided ? 'true' : 'false'}`);
  }
  if (sph.extent) {
    lines.push(
      `${indent}float3[] extent = [${fmtVec3(sph.extent[0])}, ${fmtVec3(sph.extent[1])}]`
    );
  }
  return lines;
}

function serializeConeBody(cone: UsdConeData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}uniform token axis = "${cone.axis ?? 'Y'}"`);
  lines.push(`${indent}double height = ${fmtNum(cone.height)}`);
  lines.push(`${indent}double radius = ${fmtNum(cone.radius)}`);
  if (cone.doubleSided !== undefined) {
    lines.push(`${indent}bool doubleSided = ${cone.doubleSided ? 'true' : 'false'}`);
  }
  if (cone.extent) {
    lines.push(
      `${indent}float3[] extent = [${fmtVec3(cone.extent[0])}, ${fmtVec3(cone.extent[1])}]`
    );
  }
  return lines;
}

function serializeBasisCurvesBody(curves: UsdBasisCurvesData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}uniform token type = "${curves.type}"`);
  if (curves.basis) {
    lines.push(`${indent}uniform token basis = "${curves.basis}"`);
  }
  lines.push(`${indent}uniform token wrap = "${curves.wrap ?? 'nonperiodic'}"`);
  if (curves.extent) {
    lines.push(
      `${indent}float3[] extent = [${fmtVec3(curves.extent[0])}, ${fmtVec3(curves.extent[1])}]`
    );
  }
  lines.push(`${indent}int[] curveVertexCounts = [${curves.curveVertexCounts.join(', ')}]`);
  lines.push(`${indent}point3f[] points = [${curves.points.map(fmtVec3).join(', ')}]`);
  lines.push(
    `${indent}float[] widths = [${curves.widths.map(fmtNum).join(', ')}] (`,
    `${indent}    interpolation = "${curves.widthsInterpolation ?? 'constant'}"`,
    `${indent})`
  );
  return lines;
}

function serializeMeshBody(mesh: UsdMeshData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}uniform token subdivisionScheme = "none"`);
  lines.push(`${indent}bool doubleSided = ${mesh.doubleSided ? 'true' : 'false'}`);

  if (mesh.extent) {
    lines.push(
      `${indent}float3[] extent = [${fmtVec3(mesh.extent[0])}, ${fmtVec3(mesh.extent[1])}]`
    );
  }

  lines.push(`${indent}int[] faceVertexCounts = [${mesh.faceVertexCounts.join(', ')}]`);
  lines.push(`${indent}int[] faceVertexIndices = [${mesh.faceVertexIndices.join(', ')}]`);

  const ptsStr = mesh.points.map(fmtVec3).join(', ');
  lines.push(`${indent}point3f[] points = [${ptsStr}]`);

  if (mesh.normals && mesh.normals.length > 0) {
    const interp = mesh.normalsInterpolation ?? 'vertex';
    const normsStr = mesh.normals.map(fmtVec3).join(', ');
    lines.push(
      `${indent}normal3f[] primvars:normals = [${normsStr}] (`,
      `${indent}    interpolation = "${interp}"`,
      `${indent})`
    );
  }

  if (mesh.uvs && mesh.uvs.length > 0) {
    const interp = mesh.uvsInterpolation ?? 'vertex';
    const uvsStr = mesh.uvs.map(fmtVec2).join(', ');
    lines.push(
      `${indent}texCoord2f[] primvars:st = [${uvsStr}] (`,
      `${indent}    interpolation = "${interp}"`,
      `${indent})`
    );
  }

  if (mesh.subsets && mesh.subsets.length > 0) {
    for (const subset of mesh.subsets) {
      lines.push('');
      lines.push(...serializeGeomSubset(subset, indent));
    }
  }

  return lines;
}

function serializeTextureShaderNodes(
  matPath: string,
  shaderBaseName: string,
  tex: UsdTextureRef,
  indent: string,
  extraInputs: readonly string[] = []
): string[] {
  const lines: string[] = [];
  const hasTransform =
    Math.abs(tex.scale[0] - 1) > 1e-4 ||
    Math.abs(tex.scale[1] - 1) > 1e-4 ||
    Math.abs(tex.translation[0]) > 1e-4 ||
    Math.abs(tex.translation[1]) > 1e-4;

  const stSourcePath = hasTransform
    ? `${matPath}/${shaderBaseName}_Transform2d.outputs:result`
    : `${matPath}/PrimvarSt.outputs:result`;

  if (hasTransform) {
    lines.push(
      `${indent}def Shader "${shaderBaseName}_Transform2d"`,
      `${indent}{`,
      `${indent}    uniform token info:id = "UsdTransform2d"`,
      `${indent}    float2 inputs:in.connect = <${matPath}/PrimvarSt.outputs:result>`,
      `${indent}    float2 inputs:scale = ${fmtVec2(tex.scale)}`,
      `${indent}    float2 inputs:translation = ${fmtVec2(tex.translation)}`,
      `${indent}    float2 outputs:result`,
      `${indent}}`,
      ''
    );
  }

  lines.push(
    `${indent}def Shader "${shaderBaseName}"`,
    `${indent}{`,
    `${indent}    uniform token info:id = "UsdUVTexture"`,
    `${indent}    asset inputs:file = @${tex.assetPath}@`,
    `${indent}    token inputs:sourceColorSpace = "${tex.sourceColorSpace}"`,
    `${indent}    float2 inputs:st.connect = <${stSourcePath}>`,
    `${indent}    token inputs:wrapS = "${tex.wrapS}"`,
    `${indent}    token inputs:wrapT = "${tex.wrapT}"`
  );
  for (const extra of extraInputs) {
    lines.push(`${indent}    ${extra}`);
  }
  lines.push(
    `${indent}    float3 outputs:rgb`,
    `${indent}    float outputs:r`,
    `${indent}    float outputs:a`,
    `${indent}}`
  );

  return lines;
}

/**
 * Emits a procedural MaterialX (`UsdMtlx` / `ND_*`) shader graph inside a `def Material` prim,
 * supported natively by OpenUSD (`UsdMtlx`), Blender 4.x+, and Unreal Engine 5 Interchange/Substrate.
 */
function serializeMaterialXNodes(
  matPath: string,
  mat: UsdPreviewSurfaceData,
  indent: string
): string[] {
  const lines: string[] = [];
  const pat = mat.proceduralPattern;
  const hasProceduralVariation =
    pat !== undefined &&
    pat.kind !== 'solid' &&
    pat.kind !== 'architectural_glass' &&
    pat.kind !== 'brushed_metal' &&
    pat.secondaryColor !== undefined;

  lines.push(
    '',
    `${indent}def Shader "MtlxStandardSurface"`,
    `${indent}{`,
    `${indent}    uniform token info:id = "ND_standard_surface_surfaceshader"`,
    `${indent}    float inputs:base = 1`
  );

  if (hasProceduralVariation) {
    lines.push(
      `${indent}    color3f inputs:base_color.connect = <${matPath}/MtlxPatternMix.outputs:out>`
    );
  } else {
    lines.push(
      `${indent}    color3f inputs:base_color = ${fmtVec3(pat?.primaryColor ?? mat.diffuseColor)}`
    );
  }

  lines.push(`${indent}    float inputs:specular_roughness = ${fmtNum(mat.roughness)}`);
  lines.push(`${indent}    float inputs:metalness = ${fmtNum(mat.metallic)}`);

  if (mat.opacity < 0.999) {
    lines.push(`${indent}    float inputs:transmission = ${fmtNum(1 - mat.opacity)}`);
    lines.push(`${indent}    float inputs:ior = ${fmtNum(mat.ior ?? 1.52)}`);
  } else if (mat.ior !== undefined) {
    lines.push(`${indent}    float inputs:ior = ${fmtNum(mat.ior)}`);
  }

  if (mat.clearcoat !== undefined && mat.clearcoat > 0) {
    lines.push(`${indent}    float inputs:coat = ${fmtNum(mat.clearcoat)}`);
    lines.push(
      `${indent}    float inputs:coat_roughness = ${fmtNum(mat.clearcoatRoughness ?? 0.1)}`
    );
  }

  if (mat.emissiveColor) {
    const [er, eg, eb] = mat.emissiveColor;
    if (er > 1e-4 || eg > 1e-4 || eb > 1e-4) {
      lines.push(`${indent}    float inputs:emission = 1`);
      lines.push(`${indent}    color3f inputs:emission_color = ${fmtVec3(mat.emissiveColor)}`);
    }
  }

  lines.push(`${indent}    token outputs:out`);
  lines.push(`${indent}}`);

  if (hasProceduralVariation && pat && pat.secondaryColor) {
    const uvScale = pat.uvScale ?? [4, 4];
    const noiseNodeId =
      pat.kind === 'brick_bond' ||
      pat.kind === 'herringbone_brick' ||
      pat.kind === 'checker_tile' ||
      pat.kind === 'slate_tile'
        ? 'ND_cellnoise2d_float'
        : pat.kind === 'cobblestone' || pat.kind === 'natural_stone'
          ? 'ND_worleynoise2d_float'
          : 'ND_noise2d_float';

    lines.push(
      '',
      `${indent}def Shader "MtlxTexCoord"`,
      `${indent}{`,
      `${indent}    uniform token info:id = "ND_texcoord_vector2"`,
      `${indent}    int inputs:index = 0`,
      `${indent}    float2 outputs:out`,
      `${indent}}`,
      '',
      `${indent}def Shader "MtlxUvScale"`,
      `${indent}{`,
      `${indent}    uniform token info:id = "ND_multiply_vector2"`,
      `${indent}    float2 inputs:in1.connect = <${matPath}/MtlxTexCoord.outputs:out>`,
      `${indent}    float2 inputs:in2 = ${fmtVec2(uvScale)}`,
      `${indent}    float2 outputs:out`,
      `${indent}}`,
      '',
      `${indent}def Shader "MtlxProceduralNoise"`,
      `${indent}{`,
      `${indent}    uniform token info:id = "${noiseNodeId}"`,
      `${indent}    float2 inputs:texcoord.connect = <${matPath}/MtlxUvScale.outputs:out>`,
      `${indent}    float outputs:out`,
      `${indent}}`,
      '',
      `${indent}def Shader "MtlxPatternMix"`,
      `${indent}{`,
      `${indent}    uniform token info:id = "ND_mix_color3"`,
      `${indent}    color3f inputs:bg = ${fmtVec3(pat.primaryColor)}`,
      `${indent}    color3f inputs:fg = ${fmtVec3(pat.secondaryColor)}`,
      `${indent}    float inputs:mix.connect = <${matPath}/MtlxProceduralNoise.outputs:out>`,
      `${indent}    color3f outputs:out`,
      `${indent}}`
    );
  }

  return lines;
}

function serializeMaterialBody(
  matPath: string,
  mat: UsdPreviewSurfaceData,
  indent: string
): string[] {
  const lines: string[] = [];

  if (mat.proceduralPattern) {
    const p = mat.proceduralPattern;
    lines.push(`${indent}custom uniform token procedural:kind = "${p.kind}"`);
    lines.push(`${indent}custom color3f procedural:primaryColor = ${fmtVec3(p.primaryColor)}`);
    if (p.secondaryColor) {
      lines.push(
        `${indent}custom color3f procedural:secondaryColor = ${fmtVec3(p.secondaryColor)}`
      );
    }
    if (p.accentColor) {
      lines.push(`${indent}custom color3f procedural:accentColor = ${fmtVec3(p.accentColor)}`);
    }
    if (p.uvScale) {
      lines.push(`${indent}custom float2 procedural:uvScale = ${fmtVec2(p.uvScale)}`);
    }
    if (p.mortarWidth !== undefined) {
      lines.push(`${indent}custom float procedural:mortarWidth = ${fmtNum(p.mortarWidth)}`);
    }
    if (p.bumpStrength !== undefined) {
      lines.push(`${indent}custom float procedural:bumpStrength = ${fmtNum(p.bumpStrength)}`);
    }
    if (p.noiseScale !== undefined) {
      lines.push(`${indent}custom float procedural:noiseScale = ${fmtNum(p.noiseScale)}`);
    }
  }

  lines.push(`${indent}token outputs:surface.connect = <${matPath}/PreviewSurface.outputs:surface>`);
  lines.push(
    `${indent}token outputs:mtlx:surface.connect = <${matPath}/MtlxStandardSurface.outputs:out>`
  );
  lines.push('');

  lines.push(`${indent}def Shader "PreviewSurface"`);
  lines.push(`${indent}{`);
  lines.push(`${indent}    uniform token info:id = "UsdPreviewSurface"`);

  if (mat.diffuseTexture) {
    lines.push(
      `${indent}    color3f inputs:diffuseColor.connect = <${matPath}/DiffuseTexture.outputs:rgb>`
    );
  } else {
    lines.push(`${indent}    color3f inputs:diffuseColor = ${fmtVec3(mat.diffuseColor)}`);
  }

  if (mat.emissiveColor) {
    const [er, eg, eb] = mat.emissiveColor;
    if (er > 1e-4 || eg > 1e-4 || eb > 1e-4) {
      lines.push(`${indent}    color3f inputs:emissiveColor = ${fmtVec3(mat.emissiveColor)}`);
    }
  }

  if (mat.roughnessTexture) {
    lines.push(
      `${indent}    float inputs:roughness.connect = <${matPath}/RoughnessTexture.outputs:r>`
    );
  } else {
    lines.push(`${indent}    float inputs:roughness = ${fmtNum(mat.roughness)}`);
  }

  lines.push(`${indent}    float inputs:metallic = ${fmtNum(mat.metallic)}`);
  lines.push(`${indent}    float inputs:opacity = ${fmtNum(mat.opacity)}`);

  if (mat.opacity < 0.999) {
    lines.push(`${indent}    float inputs:opacityThreshold = 0`);
  }
  if (mat.ior !== undefined) {
    lines.push(`${indent}    float inputs:ior = ${fmtNum(mat.ior)}`);
  }
  if (mat.clearcoat !== undefined && mat.clearcoat > 0) {
    lines.push(`${indent}    float inputs:clearcoat = ${fmtNum(mat.clearcoat)}`);
    lines.push(
      `${indent}    float inputs:clearcoatRoughness = ${fmtNum(mat.clearcoatRoughness ?? 0.1)}`
    );
  }
  if (mat.bumpTexture) {
    lines.push(
      `${indent}    normal3f inputs:normal.connect = <${matPath}/NormalTexture.outputs:rgb>`
    );
  }

  lines.push(`${indent}    token outputs:surface`);
  lines.push(`${indent}}`);

  const hasAnyTexture = Boolean(
    mat.diffuseTexture || mat.bumpTexture || mat.roughnessTexture
  );

  if (hasAnyTexture) {
    lines.push(
      '',
      `${indent}def Shader "PrimvarSt"`,
      `${indent}{`,
      `${indent}    uniform token info:id = "UsdPrimvarReader_float2"`,
      `${indent}    string inputs:varname = "st"`,
      `${indent}    float2 inputs:fallback = (0, 0)`,
      `${indent}    float2 outputs:result`,
      `${indent}}`
    );
  }

  if (mat.diffuseTexture) {
    lines.push('');
    lines.push(
      ...serializeTextureShaderNodes(
        matPath,
        'DiffuseTexture',
        mat.diffuseTexture,
        indent
      )
    );
  }

  if (mat.roughnessTexture) {
    lines.push('');
    lines.push(
      ...serializeTextureShaderNodes(
        matPath,
        'RoughnessTexture',
        mat.roughnessTexture,
        indent
      )
    );
  }

  if (mat.bumpTexture) {
    lines.push('');
    lines.push(
      ...serializeTextureShaderNodes(
        matPath,
        'NormalTexture',
        mat.bumpTexture,
        indent,
        [
          'float4 inputs:scale = (2, 2, 2, 1)',
          'float4 inputs:bias = (-1, -1, -1, 0)',
        ]
      )
    );
  }

  lines.push(...serializeMaterialXNodes(matPath, mat, indent));

  return lines;
}

function serializeLightBody(light: UsdLuxLightData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}color3f inputs:color = ${fmtVec3(light.color)}`);
  lines.push(`${indent}float inputs:intensity = ${fmtNum(light.intensity)}`);

  if (light.exposure !== undefined && Math.abs(light.exposure) > 1e-5) {
    lines.push(`${indent}float inputs:exposure = ${fmtNum(light.exposure)}`);
  }
  if (light.radius !== undefined) {
    lines.push(`${indent}float inputs:radius = ${fmtNum(light.radius)}`);
  }
  if (light.width !== undefined) {
    lines.push(`${indent}float inputs:width = ${fmtNum(light.width)}`);
  }
  if (light.height !== undefined) {
    lines.push(`${indent}float inputs:height = ${fmtNum(light.height)}`);
  }
  if (light.angleDeg !== undefined) {
    lines.push(`${indent}float inputs:angle = ${fmtNum(light.angleDeg)}`);
  }
  if (light.enableColorTemperature !== undefined) {
    lines.push(
      `${indent}bool inputs:enableColorTemperature = ${light.enableColorTemperature ? 'true' : 'false'}`
    );
  }
  if (light.colorTemperatureK !== undefined) {
    lines.push(`${indent}float inputs:colorTemperature = ${fmtNum(light.colorTemperatureK)}`);
  }
  if (light.normalize !== undefined) {
    lines.push(`${indent}bool inputs:normalize = ${light.normalize ? 'true' : 'false'}`);
  }
  if (light.diffuseMultiplier !== undefined) {
    lines.push(`${indent}float inputs:diffuse = ${fmtNum(light.diffuseMultiplier)}`);
  }
  if (light.specularMultiplier !== undefined) {
    lines.push(`${indent}float inputs:specular = ${fmtNum(light.specularMultiplier)}`);
  }
  if (light.shapingConeAngleDeg !== undefined) {
    lines.push(
      `${indent}float inputs:shaping:cone:angle = ${fmtNum(light.shapingConeAngleDeg)}`
    );
  }
  if (light.shapingConeSoftness !== undefined) {
    lines.push(
      `${indent}float inputs:shaping:cone:softness = ${fmtNum(light.shapingConeSoftness)}`
    );
  }

  return lines;
}

function serializeCameraBody(camera: UsdCameraData, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}token projection = "${camera.projection}"`);
  lines.push(`${indent}float focalLength = ${fmtNum(camera.focalLengthMm)}`);
  lines.push(`${indent}float horizontalAperture = ${fmtNum(camera.horizontalApertureMm)}`);
  lines.push(`${indent}float verticalAperture = ${fmtNum(camera.verticalApertureMm)}`);
  lines.push(
    `${indent}float2 clippingRange = ${fmtVec2(camera.clippingRangeM)}`
  );
  return lines;
}

function serializeCustomAttributes(
  attrs: Readonly<Record<string, UsdCustomAttributeValue>>,
  indent: string
): string[] {
  const lines: string[] = [];
  for (const [attrName, spec] of Object.entries(attrs)) {
    switch (spec.type) {
      case 'string':
        lines.push(`${indent}custom string ${attrName} = "${escapeUsdString(spec.value)}"`);
        break;
      case 'token':
        lines.push(`${indent}custom uniform token ${attrName} = "${escapeUsdString(spec.value)}"`);
        break;
      case 'bool':
        lines.push(`${indent}custom bool ${attrName} = ${spec.value ? 'true' : 'false'}`);
        break;
      case 'int':
        lines.push(`${indent}custom int ${attrName} = ${Math.round(spec.value)}`);
        break;
      case 'float':
        lines.push(`${indent}custom float ${attrName} = ${fmtNum(spec.value)}`);
        break;
      case 'double':
        lines.push(`${indent}custom double ${attrName} = ${fmtNum(spec.value)}`);
        break;
      case 'float2':
        lines.push(`${indent}custom float2 ${attrName} = ${fmtVec2(spec.value)}`);
        break;
      case 'float3':
        lines.push(`${indent}custom float3 ${attrName} = ${fmtVec3(spec.value)}`);
        break;
      case 'double3':
        lines.push(`${indent}custom double3 ${attrName} = ${fmtVec3(spec.value)}`);
        break;
      case 'color3f':
        lines.push(`${indent}custom color3f ${attrName} = ${fmtVec3(spec.value)}`);
        break;
    }
  }
  return lines;
}

function serializeVariantSetBlock(
  setName: string,
  options: Readonly<Record<string, UsdVariantOption>>,
  primPath: string,
  depth: number
): string[] {
  const indent = '    '.repeat(depth);
  const optIndent = '    '.repeat(depth + 1);
  const bodyIndent = '    '.repeat(depth + 2);
  const lines: string[] = [`${indent}variantSet "${setName}" = {`];
  for (const [optName, opt] of Object.entries(options)) {
    lines.push(`${optIndent}"${escapeUsdString(optName)}" {`);
    if (opt.customAttributes) {
      lines.push(...serializeCustomAttributes(opt.customAttributes, bodyIndent));
    }
    if (opt.children) {
      for (const child of opt.children) {
        lines.push(...serializePrim(child, primPath, depth + 2));
      }
    }
    lines.push(`${optIndent}}`);
  }
  lines.push(`${indent}}`);
  return lines;
}

function serializePrim(prim: UsdPrim, parentPath: string, depth: number): string[] {
  const indent = '    '.repeat(depth);
  const bodyIndent = '    '.repeat(depth + 1);
  const primPath = `${parentPath}/${prim.name}`;

  const typePrefix = prim.typeName ? `${prim.typeName} ` : '';
  const headerPrefix = `${indent}${prim.specifier} ${typePrefix}"${prim.name}"`;

  const metaLines: string[] = [];
  const apiSchemas: string[] = [];
  if (prim.materialBindingPath || (prim.mesh?.subsets && prim.mesh.subsets.length > 0)) {
    apiSchemas.push('"MaterialBindingAPI"');
  }
  if (prim.collisionEnabled) {
    apiSchemas.push('"PhysicsCollisionAPI"');
  }
  if (prim.light?.shapingConeAngleDeg !== undefined) {
    apiSchemas.push('"ShapingAPI"');
  }
  if (apiSchemas.length > 0) {
    metaLines.push(`${bodyIndent}prepend apiSchemas = [${apiSchemas.join(', ')}]`);
  }

  if (prim.metadata) {
    if (prim.metadata.doc) {
      metaLines.push(`${bodyIndent}doc = "${escapeUsdString(prim.metadata.doc)}"`);
    }
    if (prim.metadata.kind) {
      metaLines.push(`${bodyIndent}kind = "${prim.metadata.kind}"`);
    }
    if (prim.metadata.instanceable !== undefined) {
      metaLines.push(
        `${bodyIndent}instanceable = ${prim.metadata.instanceable ? 'true' : 'false'}`
      );
    }
    if (prim.metadata.references && prim.metadata.references.length > 0) {
      if (prim.metadata.references.length === 1) {
        metaLines.push(`${bodyIndent}prepend references = @${prim.metadata.references[0]}@`);
      } else {
        metaLines.push(`${bodyIndent}prepend references = [`);
        for (const ref of prim.metadata.references) {
          metaLines.push(`${bodyIndent}    @${ref}@,`);
        }
        metaLines.push(`${bodyIndent}]`);
      }
    }
    if (prim.metadata.payload) {
      metaLines.push(`${bodyIndent}prepend payload = @${prim.metadata.payload}@`);
    }
    if (prim.metadata.variantSetNames && prim.metadata.variantSetNames.length > 0) {
      const vsNames = prim.metadata.variantSetNames
        .map((n) => `"${escapeUsdString(n)}"`)
        .join(', ');
      metaLines.push(`${bodyIndent}prepend variantSets = [${vsNames}]`);
    }
    if (prim.metadata.variants && Object.keys(prim.metadata.variants).length > 0) {
      metaLines.push(`${bodyIndent}variants = {`);
      for (const [vk, vv] of Object.entries(prim.metadata.variants)) {
        metaLines.push(`${bodyIndent}    string ${vk} = "${escapeUsdString(vv)}"`);
      }
      metaLines.push(`${bodyIndent}}`);
    }
    if (prim.metadata.customData) {
      metaLines.push(...formatCustomDataDict(prim.metadata.customData, bodyIndent));
    }
  }

  const lines: string[] = [];
  if (metaLines.length > 0) {
    lines.push(`${headerPrefix} (`);
    lines.push(...metaLines);
    lines.push(`${indent})`);
  } else {
    lines.push(headerPrefix);
  }

  lines.push(`${indent}{`);

  if (prim.visibility === 'invisible') {
    lines.push(`${bodyIndent}token visibility = "invisible"`);
  }
  if (prim.purpose && prim.purpose !== 'default') {
    lines.push(`${bodyIndent}uniform token purpose = "${prim.purpose}"`);
  }
  if (prim.collisionEnabled) {
    lines.push(`${bodyIndent}bool physics:collisionEnabled = true`);
  }
  if (prim.materialBindingPath) {
    lines.push(`${bodyIndent}rel material:binding = <${prim.materialBindingPath}>`);
  }
  if (prim.xform) {
    lines.push(...serializeXformOps(prim.xform, bodyIndent));
  }
  if (prim.customAttributes) {
    lines.push(...serializeCustomAttributes(prim.customAttributes, bodyIndent));
  }
  if (prim.cube) {
    lines.push(...serializeCubeBody(prim.cube, bodyIndent));
  }
  if (prim.cylinder) {
    lines.push(...serializeCylinderBody(prim.cylinder, bodyIndent));
  }
  if (prim.sphere) {
    lines.push(...serializeSphereBody(prim.sphere, bodyIndent));
  }
  if (prim.cone) {
    lines.push(...serializeConeBody(prim.cone, bodyIndent));
  }
  if (prim.basisCurves) {
    lines.push(...serializeBasisCurvesBody(prim.basisCurves, bodyIndent));
  }
  if (prim.mesh) {
    lines.push(...serializeMeshBody(prim.mesh, bodyIndent));
  }
  if (prim.material) {
    lines.push(...serializeMaterialBody(primPath, prim.material, bodyIndent));
  }
  if (prim.light) {
    lines.push(...serializeLightBody(prim.light, bodyIndent));
  }
  if (prim.camera) {
    lines.push(...serializeCameraBody(prim.camera, bodyIndent));
  }

  if (prim.children && prim.children.length > 0) {
    for (let i = 0; i < prim.children.length; i++) {
      if (i > 0 || lines.length > (metaLines.length > 0 ? metaLines.length + 3 : 2)) {
        lines.push('');
      }
      lines.push(...serializePrim(prim.children[i], primPath, depth + 1));
    }
  }

  if (prim.variantSets) {
    for (const [setName, options] of Object.entries(prim.variantSets)) {
      lines.push('');
      lines.push(...serializeVariantSetBlock(setName, options, primPath, depth + 1));
    }
  }

  lines.push(`${indent}}`);
  return lines;
}

/**
 * Serializes a `UsdStageDocument` into a clean, human-readable `#usda 1.0` ASCII file.
 */
export function serializeUsdaStage(stage: UsdStageDocument): string {
  const lines: string[] = ['#usda 1.0', '('];
  if (stage.defaultPrim) {
    lines.push(`    defaultPrim = "${escapeUsdString(stage.defaultPrim)}"`);
  }
  if (stage.doc) {
    lines.push(`    doc = "${escapeUsdString(stage.doc)}"`);
  }
  lines.push(`    metersPerUnit = ${stage.metersPerUnit ?? 1}`);
  lines.push(`    upAxis = "${stage.upAxis ?? 'Y'}"`);

  if (stage.subLayers && stage.subLayers.length > 0) {
    lines.push('    subLayers = [');
    for (const layerPath of stage.subLayers) {
      lines.push(`        @${layerPath}@,`);
    }
    lines.push('    ]');
  }

  if (stage.customLayerData && Object.keys(stage.customLayerData).length > 0) {
    lines.push('    customLayerData = {');
    for (const [k, v] of Object.entries(stage.customLayerData)) {
      if (typeof v === 'string') {
        lines.push(`        string ${k} = "${escapeUsdString(v)}"`);
      } else if (typeof v === 'boolean') {
        lines.push(`        bool ${k} = ${v ? 'true' : 'false'}`);
      } else if (Number.isInteger(v)) {
        lines.push(`        int ${k} = ${v}`);
      } else {
        lines.push(`        double ${k} = ${fmtNum(v)}`);
      }
    }
    lines.push('    }');
  }

  lines.push(')', '');

  for (let i = 0; i < stage.prims.length; i++) {
    if (i > 0) lines.push('');
    lines.push(...serializePrim(stage.prims[i], '', 0));
  }

  lines.push('');
  return lines.join('\n');
}
