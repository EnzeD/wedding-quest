import * as THREE from "three";
import type { EditorPaletteItem } from "./level-catalog.ts";
import { cellToWorld, worldToCell } from "./level-grid.ts";
import type { LevelEntity } from "./types.ts";

export function setEntityField(target: LevelEntity, field: string, raw: string): void {
  const value = field === "name" || field === "snap" ? raw : Number(raw);
  if (field.startsWith("position.")) {
    target.position[field.slice(9) as "x" | "y" | "z"] = Number(value);
    return;
  }
  if (field === "name") target.name = raw || undefined;
  else if (field === "snap") target.snap = raw as LevelEntity["snap"];
  else target[field as "rotationY" | "scale"] = Number(value) as never;
}

export function snapPoint(point: THREE.Vector3, size: number): THREE.Vector3 {
  const cell = worldToCell(point.x, point.z, size);
  if (!cell) return point.clone();
  const world = cellToWorld(cell, size);
  return new THREE.Vector3(world.x, 0, world.z);
}

export function createEntityFromPaletteItem(
  item: EditorPaletteItem,
  point: THREE.Vector3,
  size: number,
): LevelEntity {
  const position = item.defaultSnap === "grid" ? snapPoint(point, size) : point;
  return {
    id: crypto.randomUUID(),
    kind: item.kind!,
    assetId: item.id,
    position: { x: position.x, y: 0, z: position.z },
    rotationY: 0,
    scale: item.defaultScale ?? 1,
    snap: item.defaultSnap ?? "free",
    name: item.tab === "npc" || item.tab === "items" ? item.label : undefined,
  };
}
