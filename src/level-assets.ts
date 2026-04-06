import { preloadAsset } from "./assets.ts";
import { kenneyPath, preloadKenneyPrefab } from "./kenney-buildings.ts";
import type { LevelData, LevelEntity } from "./types.ts";

const MINI_BASE = "assets/kenney-mini-characters/";

export function npcAssetPath(assetId: string): string {
  return `${MINI_BASE}${assetId}.glb`;
}

export function entityAssetPath(entity: LevelEntity): string | null {
  switch (entity.kind) {
    case "npc":
      return npcAssetPath(entity.assetId);
    case "kenney-piece":
    case "decoration":
    case "vegetation":
      return kenneyPath(entity.assetId);
    case "prefab":
      return null;
  }
}

export async function preloadEntityAsset(entity: LevelEntity): Promise<void> {
  if (entity.kind === "prefab") {
    await preloadKenneyPrefab(entity.assetId);
    return;
  }

  const path = entityAssetPath(entity);
  if (!path) return;
  await preloadAsset(path);
}

export async function preloadLevelAssets(level: LevelData): Promise<void> {
  await Promise.all(level.entities.map((entity) => preloadEntityAsset(entity)));
}
