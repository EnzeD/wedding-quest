import type { LevelSurfacePaintSettings, LevelSurfaceSettings, LevelWaterPaintSettings } from "./types.ts";

export const DEFAULT_SURFACE_SETTINGS: LevelSurfaceSettings = {
  path: { bleed: 0.08, radius: 0.3 },
  water: { bleed: 0.16, radius: 0.38, depth: 0.42, shoreWarp: 0.75, bedVariation: 0.08, bankSlope: 1 },
};

function normalizePaintSettings(
  value: Partial<LevelSurfacePaintSettings> | undefined,
  fallback: LevelSurfacePaintSettings,
): LevelSurfacePaintSettings {
  const bleed = Number(value?.bleed);
  const radius = Number(value?.radius);
  return {
    bleed: Number.isFinite(bleed) ? Math.min(Math.max(bleed, 0), 0.4) : fallback.bleed,
    radius: Number.isFinite(radius) ? Math.min(Math.max(radius, 0), 0.6) : fallback.radius,
  };
}

function normalizeWaterSettings(
  value: Partial<LevelWaterPaintSettings> | undefined,
  fallback: LevelWaterPaintSettings,
): LevelWaterPaintSettings {
  const base = normalizePaintSettings(value, fallback);
  const depth = Number(value?.depth);
  const shoreWarp = Number(value?.shoreWarp);
  const bedVariation = Number(value?.bedVariation);
  const bankSlope = Number(value?.bankSlope);
  return {
    ...base,
    depth: Number.isFinite(depth) ? Math.min(Math.max(depth, 0), 1.6) : fallback.depth,
    shoreWarp: Number.isFinite(shoreWarp) ? Math.min(Math.max(shoreWarp, 0), 1.2) : fallback.shoreWarp,
    bedVariation: Number.isFinite(bedVariation) ? Math.min(Math.max(bedVariation, 0), 0.2) : fallback.bedVariation,
    bankSlope: Number.isFinite(bankSlope) ? Math.min(Math.max(bankSlope, 0.35), 2.5) : fallback.bankSlope,
  };
}

export function normalizeSurfaceSettings(value: Partial<LevelSurfaceSettings> | undefined): LevelSurfaceSettings {
  return {
    path: normalizePaintSettings(value?.path, DEFAULT_SURFACE_SETTINGS.path),
    water: normalizeWaterSettings(value?.water, DEFAULT_SURFACE_SETTINGS.water),
  };
}
