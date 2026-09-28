export {
  CROX_USD_ZONE_LAYERS,
  resolveUsdPrimPathForObject,
  sanitizeUsdIdent,
  type UsdBasisCurvesData,
  type UsdCameraData,
  type UsdConeData,
  type UsdCubeData,
  type UsdCustomAttributeValue,
  type UsdCylinderData,
  type UsdGeomSubsetData,
  type UsdKind,
  type UsdLuxLightData,
  type UsdMeshData,
  type UsdPreviewSurfaceData,
  type UsdPrim,
  type UsdPrimMetadata,
  type UsdPrimTypeName,
  type UsdProceduralPatternKind,
  type UsdProceduralPatternSpec,
  type UsdPurpose,
  type UsdSpecifier,
  type UsdSphereData,
  type UsdStageDocument,
  type UsdTextureRef,
  type UsdVariantOption,
  type UsdVisibility,
  type UsdXformOps,
  type UsdZoneLayerSpec,
} from './schema.ts';

export { serializeUsdaStage } from './usda-serializer.ts';

export {
  classifyProceduralPattern,
  convertThreeMaterialToUsdSpec,
} from './procedural-materials.ts';

export {
  classifyBranchZoneLayer,
  convertCroxSceneToUsdStageBundle,
  matrixToUsdXformOps,
  quaternionToUsdRotateXYZDeg,
  type GeneratedUsdStageBundle,
} from './stage-converter.ts';

export {
  applyUsdOverridesToScene,
  getUsdPrimPathForAnnotation,
  parseUsdaOverrideLayer,
  serializeAnnotationsToUsdaOverrideLayer,
  type UsdTransformOverride,
} from './usda-override-layer.ts';

export {
  UsdStageRuntimeController,
  type UsdIndexedPrimInfo,
  type UsdLodVariant,
  type UsdRoofCutawayVariant,
  type UsdStageStatsSummary,
  type UsdViewportDiagnosticMode,
  type UsdZoneSublayerSummary,
} from './stage-runtime.ts';

export { buildUsdzArchive, type UsdzArchiveEntry } from './usdz-packager.ts';
