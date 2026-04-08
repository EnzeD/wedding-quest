import type { LevelSurfacePaintSettings, LevelSurfaceSettings } from "./types.ts";

export const DEFAULT_SURFACE_SETTINGS: LevelSurfaceSettings = {
  path: { bleed: 0.08, radius: 0.3 },
  water: { bleed: 0.12, radius: 0.3 },
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

export function normalizeSurfaceSettings(value: Partial<LevelSurfaceSettings> | undefined): LevelSurfaceSettings {
  return {
    path: normalizePaintSettings(value?.path, DEFAULT_SURFACE_SETTINGS.path),
    water: normalizePaintSettings(value?.water, DEFAULT_SURFACE_SETTINGS.water),
  };
}
