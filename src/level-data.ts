import { DEFAULT_COLOR_GRADING } from "./color-grading.ts";
import { createEmptyLayer, normalizeLevel } from "./level-grid.ts";
import type { LevelData } from "./types.ts";

const LEVEL_URL = "/levels/main.json";

export async function loadLevel(url = LEVEL_URL): Promise<LevelData> {
  const res = await fetch(`${url}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load level: ${res.status}`);
  return normalizeLevel((await res.json()) as LevelData);
}

export async function saveLevel(level: LevelData): Promise<void> {
  const res = await fetch("/__editor/save-level", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeLevel(level)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to save level: ${res.status}`);
  }
}

export function createEmptyLevel(size: number): LevelData {
  return {
    metadata: {
      version: 1,
      name: "Wedding Quest",
      size,
      gridUnit: 1,
    },
    entities: [],
    surfaceLayers: {
      path: createEmptyLayer(size),
      water: createEmptyLayer(size),
    },
    postProcessingEnabled: true,
    colorGrading: { ...DEFAULT_COLOR_GRADING },
  };
}
