import { normalizeColorGrading, normalizeGrassColor } from "./color-grading.ts";
import { ensurePickupEntities } from "./item-definitions.ts";
import { normalizeMenuSettings } from "./menu-settings.ts";
import { normalizeSurfaceSettings } from "./surface-settings.ts";
import type { LevelData, LevelSurfaceLayer } from "./types.ts";

export interface GridCell {
  col: number;
  row: number;
}

export function cloneLevel<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function ensureLayerShape(layer: LevelSurfaceLayer, size: number): LevelSurfaceLayer {
  const rows = Array.from({ length: size }, (_, row) => {
    const source = layer.rows[row] ?? "";
    return source.padEnd(size, "0").slice(0, size).replace(/[^01]/g, "0");
  });
  return { rows };
}

export function normalizeLevel(level: LevelData): LevelData {
  const size = level.metadata.size;
  return {
    metadata: { ...level.metadata },
    entities: ensurePickupEntities(cloneLevel(level.entities)),
    surfaceLayers: {
      path: ensureLayerShape(level.surfaceLayers.path, size),
      water: ensureLayerShape(level.surfaceLayers.water, size),
    },
    surfaceSettings: normalizeSurfaceSettings(level.surfaceSettings),
    postProcessingEnabled: level.postProcessingEnabled !== false,
    grassColor: normalizeGrassColor(level.grassColor),
    colorGrading: normalizeColorGrading(level.colorGrading),
    menu: normalizeMenuSettings(level.menu),
  };
}

export function cellKey(cell: GridCell): string {
  return `${cell.col}:${cell.row}`;
}

export function worldToCell(x: number, z: number, size: number): GridCell | null {
  const half = size / 2;
  const col = Math.floor(x + half);
  const row = Math.floor(z + half);
  if (col < 0 || row < 0 || col >= size || row >= size) return null;
  return { col, row };
}

export function cellToWorld(cell: GridCell, size: number): { x: number; z: number } {
  const half = size / 2;
  return {
    x: cell.col - half + 0.5,
    z: cell.row - half + 0.5,
  };
}

export function getCell(layer: LevelSurfaceLayer, cell: GridCell): boolean {
  return layer.rows[cell.row]?.[cell.col] === "1";
}

export function setCell(layer: LevelSurfaceLayer, cell: GridCell, filled: boolean): LevelSurfaceLayer {
  const rows = [...layer.rows];
  const line = rows[cell.row] ?? "";
  rows[cell.row] = `${line.slice(0, cell.col)}${filled ? "1" : "0"}${line.slice(cell.col + 1)}`;
  return { rows };
}

export function createEmptyLayer(size: number): LevelSurfaceLayer {
  return { rows: Array.from({ length: size }, () => "0".repeat(size)) };
}
