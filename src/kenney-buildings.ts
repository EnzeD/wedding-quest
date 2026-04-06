import * as THREE from "three";
import { cloneAsset, preloadAsset } from "./assets.ts";

const BASE = "assets/kenney/";

interface Piece {
  piece: string;
  x: number;
  y: number;
  z: number;
  rotY?: number;
}

interface FloorDef {
  style: "stone" | "wood";
  door?: { side: "e" | "w" | "n" | "s"; pos: number };
}

interface RectDef {
  wx: number;
  dz: number;
  floors: FloorDef[];
  roof: "gable-z" | "flat";
  chimney?: boolean;
}

export interface PrefabDefinition {
  id: string;
  label: string;
  defaultScale: number;
}

const R90 = Math.PI / 2;
const R180 = Math.PI;
const R270 = Math.PI * 1.5;

function buildRect(def: RectDef): Piece[] {
  const p: Piece[] = [];
  const { wx, dz, floors, roof, chimney } = def;

  for (let f = 0; f < floors.length; f++) {
    const { style, door } = floors[f];
    const w = style === "wood" ? "wall-wood" : "wall";
    const win = `${w}-window-shutters`;
    const dr = `${w}-door`;
    const y = f;

    // Floor planks
    for (let x = 0; x < wx; x++)
      for (let z = 0; z < dz; z++) p.push({ piece: "planks", x, y, z });

    // East (+X) and west (-X) walls
    for (let z = 0; z < dz; z++) {
      const eD = door?.side === "e" && door.pos === z;
      const wD = door?.side === "w" && door.pos === z;
      const mid = z > 0 && z < dz - 1;
      p.push({ piece: eD ? dr : mid ? win : w, x: wx - 1, y, z });
      p.push({ piece: wD ? dr : mid ? win : w, x: 0, y, z, rotY: R180 });
    }

    // North (+Z) and south (-Z) walls
    for (let x = 0; x < wx; x++) {
      const nD = door?.side === "n" && door.pos === x;
      const sD = door?.side === "s" && door.pos === x;
      const mid = x > 0 && x < wx - 1;
      p.push({ piece: nD ? dr : mid ? win : w, x, y, z: dz - 1, rotY: R90 });
      p.push({ piece: sD ? dr : mid ? win : w, x, y, z: 0, rotY: R270 });
    }
  }

  // Roof
  const ry = floors.length;
  const half = Math.floor(wx / 2);
  if (roof === "gable-z") {
    for (let x = 0; x < wx; x++)
      for (let z = 0; z < dz; z++)
        p.push({ piece: "roof", x, y: ry, z, rotY: x < half ? undefined : R180 });
  } else {
    for (let x = 0; x < wx; x++)
      for (let z = 0; z < dz; z++) p.push({ piece: "roof-flat", x, y: ry, z });
  }

  if (chimney) p.push({ piece: "chimney", x: wx - 1, y: ry, z: 0 });
  return p;
}

const BLUEPRINTS: Record<string, Piece[]> = {
  manoir: buildRect({
    wx: 4,
    dz: 4,
    floors: [
      { style: "stone", door: { side: "s", pos: 1 } },
      { style: "wood" },
    ],
    roof: "gable-z",
    chimney: true,
  }),
  grange: buildRect({
    wx: 2,
    dz: 4,
    floors: [{ style: "wood", door: { side: "s", pos: 0 } }],
    roof: "gable-z",
  }),
  cottage: buildRect({
    wx: 2,
    dz: 3,
    floors: [{ style: "stone", door: { side: "w", pos: 1 } }],
    roof: "gable-z",
    chimney: true,
  }),
  annexe: buildRect({
    wx: 2,
    dz: 2,
    floors: [{ style: "stone", door: { side: "s", pos: 0 } }],
    roof: "flat",
  }),
};

export const TREE_PIECES = ["tree", "tree-high", "tree-crooked", "tree-high-round"];
export const DECO_PIECES = [
  "lantern",
  "stall-green",
  "stall-red",
  "cart",
  "fence",
  "rock-small",
  "rock-wide",
  "fountain-round",
];

export const PREFAB_DEFINITIONS: PrefabDefinition[] = [
  { id: "manoir", label: "Manoir", defaultScale: 3 },
  { id: "grange", label: "Grange", defaultScale: 3 },
  { id: "cottage", label: "Cottage", defaultScale: 4 },
  { id: "annexe", label: "Annexe", defaultScale: 3 },
];

function allPieceNames(): string[] {
  const set = new Set<string>();
  for (const pieces of Object.values(BLUEPRINTS))
    for (const p of pieces) set.add(p.piece);
  for (const n of [...TREE_PIECES, ...DECO_PIECES]) set.add(n);
  return [...set];
}

export function kenneyPath(name: string): string {
  return `${BASE}${name}.glb`;
}

export async function preloadKenneyPieces(): Promise<void> {
  await Promise.all(allPieceNames().map((n) => preloadAsset(kenneyPath(n))));
}

export async function preloadKenneyPrefab(type: string): Promise<void> {
  const pieces = BLUEPRINTS[type];
  if (!pieces) throw new Error(`Unknown prefab: ${type}`);
  const unique = [...new Set(pieces.map((piece) => piece.piece))];
  await Promise.all(unique.map((name) => preloadAsset(kenneyPath(name))));
}

function assemblePieces(pieces: Piece[]): THREE.Group {
  const group = new THREE.Group();
  for (const p of pieces) {
    const piece = cloneAsset(kenneyPath(p.piece));
    piece.position.set(p.x, p.y, p.z);
    piece.rotation.y = p.rotY ?? 0;
    group.add(piece);
  }
  return group;
}

export interface KenneyBuilding {
  group: THREE.Group;
  hw: number;
  hd: number;
}

export function buildKenney(type: string, scale: number): KenneyBuilding {
  const pieces = BLUEPRINTS[type];
  if (!pieces) throw new Error(`Unknown building: ${type}`);

  const inner = assemblePieces(pieces);

  let maxX = 0;
  let maxZ = 0;
  for (const p of pieces) {
    if (p.x > maxX) maxX = p.x;
    if (p.z > maxZ) maxZ = p.z;
  }
  const wx = maxX + 1;
  const dz = maxZ + 1;
  inner.position.set(-wx / 2, 0, -dz / 2);

  const group = new THREE.Group();
  group.add(inner);
  group.scale.setScalar(scale);

  return { group, hw: (wx / 2) * scale, hd: (dz / 2) * scale };
}
