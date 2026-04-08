import * as THREE from "three";

export interface Collider {
  x: number;
  z: number;
  hw: number;
  hd: number;
  name: string;
}

export type GameMode = "menu" | "playing" | "score";
export type Character = "sarah" | "nicolas";
export type LevelEntityKind = "prefab" | "kenney-piece" | "decoration" | "vegetation" | "npc";
export type LevelSnapMode = "grid" | "free";

export interface ItemDef {
  id: string;
  name: string;
  points: number;
  position: THREE.Vector3;
}

export interface CollectedItem {
  id: string;
  name: string;
  points: number;
}

export interface AssetManifest {
  characters: Record<string, string>;
  buildings: Record<string, string>;
  vegetation: Record<string, string>;
  decorations: Record<string, string>;
  items: Record<string, string>;
}

export interface LevelPosition {
  x: number;
  y: number;
  z: number;
}

export interface LevelEntity {
  id: string;
  kind: LevelEntityKind;
  assetId: string;
  position: LevelPosition;
  rotationY: number;
  scale: number;
  snap: LevelSnapMode;
  name?: string;
  collider?: {
    hw: number;
    hd: number;
  };
}

export interface LevelNpc extends LevelEntity {
  kind: "npc";
  name: string;
}

export interface LevelMetadata {
  version: number;
  name: string;
  size: number;
  gridUnit: number;
}

export interface LevelSurfaceLayer {
  rows: string[];
}

export interface ColorGradingSettings {
  contrast: number;
  saturation: number;
  warmth: number;
  vignette: number;
  lift: number;
}

export interface LevelSurfacePaintSettings {
  bleed: number;
  radius: number;
}

export interface LevelSurfaceSettings {
  path: LevelSurfacePaintSettings;
  water: LevelSurfacePaintSettings;
}

export interface LevelData {
  metadata: LevelMetadata;
  entities: LevelEntity[];
  surfaceLayers: {
    path: LevelSurfaceLayer;
    water: LevelSurfaceLayer;
  };
  surfaceSettings: LevelSurfaceSettings;
  postProcessingEnabled: boolean;
  grassColor: string;
  colorGrading: ColorGradingSettings;
}
