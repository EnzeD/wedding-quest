import * as THREE from "three";

export interface Collider {
  x: number;
  z: number;
  hw: number;
  hd: number;
  name: string;
}

export interface PondData {
  x: number;
  z: number;
  rx: number;
  rz: number;
}

export type GameMode = "menu" | "playing" | "score";
export type Character = "sarah" | "nicolas";

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
