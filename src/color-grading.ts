import type { ColorGradingSettings } from "./types.ts";

export const DEFAULT_COLOR_GRADING: ColorGradingSettings = {
  contrast: 1.08,
  saturation: 1.18,
  warmth: 0.05,
  vignette: 0.5,
  lift: 0.015,
};

const COLOR_GRADING_LIMITS: Record<keyof ColorGradingSettings, { min: number; max: number }> = {
  contrast: { min: 0.5, max: 1.8 },
  saturation: { min: 0, max: 2 },
  warmth: { min: -0.3, max: 0.3 },
  vignette: { min: 0, max: 1.5 },
  lift: { min: -0.2, max: 0.2 },
};

export function normalizeColorGrading(
  value?: Partial<ColorGradingSettings> | null,
): ColorGradingSettings {
  return {
    contrast: clamp("contrast", value?.contrast),
    saturation: clamp("saturation", value?.saturation),
    warmth: clamp("warmth", value?.warmth),
    vignette: clamp("vignette", value?.vignette),
    lift: clamp("lift", value?.lift),
  };
}

function clamp(key: keyof ColorGradingSettings, value: number | undefined): number {
  const fallback = DEFAULT_COLOR_GRADING[key];
  if (!Number.isFinite(value)) return fallback;
  const { min, max } = COLOR_GRADING_LIMITS[key];
  return Math.min(max, Math.max(min, value));
}
