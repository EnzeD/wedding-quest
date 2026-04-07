import * as THREE from "three";
import { cloneAsset, preloadAsset } from "./assets.ts";
import { buildPrefabRoof, type PrefabRoofSpec } from "./prefab-roofs.ts";

const BASE = "assets/kenney/";

interface Piece {
  piece: string;
  x: number;
  y: number;
  z: number;
  rotY?: number;
  scale?: number;
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
  chimneyAt?: { x: number; z: number };
}

export interface PrefabDefinition {
  id: string;
  label: string;
  defaultScale: number;
}

interface PrefabBlueprint {
  pieces: Piece[];
  roofs: PrefabRoofSpec[];
  wx: number;
  dz: number;
}

const R90 = Math.PI / 2;
const R180 = Math.PI;
const R270 = Math.PI * 1.5;

function shifted(blueprint: PrefabBlueprint, dx: number, dz: number): PrefabBlueprint {
  return {
    pieces: blueprint.pieces.map((piece) => ({ ...piece, x: piece.x + dx, z: piece.z + dz })),
    roofs: blueprint.roofs.map((roof) => ({ ...roof, x: roof.x + dx, z: roof.z + dz })),
    wx: blueprint.wx,
    dz: blueprint.dz,
  };
}

function buildRect(def: RectDef): PrefabBlueprint {
  const pieces: Piece[] = [];
  const { wx, dz, floors, roof, chimney, chimneyAt } = def;

  for (let f = 0; f < floors.length; f++) {
    const { style, door } = floors[f];
    const wall = style === "wood" ? "wall-wood" : "wall";
    const window = `${wall}-window-shutters`;
    const doorPiece = `${wall}-door`;

    for (let x = 0; x < wx; x++) {
      for (let z = 0; z < dz; z++) pieces.push({ piece: "planks", x, y: f, z });
    }

    for (let z = 0; z < dz; z++) {
      const eastDoor = door?.side === "e" && door.pos === z;
      const westDoor = door?.side === "w" && door.pos === z;
      const mid = z > 0 && z < dz - 1;
      pieces.push({ piece: eastDoor ? doorPiece : mid ? window : wall, x: wx - 1, y: f, z });
      pieces.push({ piece: westDoor ? doorPiece : mid ? window : wall, x: 0, y: f, z, rotY: R180 });
    }

    for (let x = 0; x < wx; x++) {
      const northDoor = door?.side === "n" && door.pos === x;
      const southDoor = door?.side === "s" && door.pos === x;
      const mid = x > 0 && x < wx - 1;
      pieces.push({ piece: northDoor ? doorPiece : mid ? window : wall, x, y: f, z: dz - 1, rotY: R270 });
      pieces.push({ piece: southDoor ? doorPiece : mid ? window : wall, x, y: f, z: 0, rotY: R90 });
    }
  }

  const roofs: PrefabRoofSpec[] = [{ kind: roof, x: 0, y: floors.length, z: 0, wx, dz }];
  if (chimney) {
    const spot = chimneyAt ?? { x: Math.max(0, wx - 2), z: Math.min(Math.max(1, Math.floor(dz / 2)), dz - 1) };
    pieces.push({ piece: "chimney", x: spot.x, y: floors.length, z: spot.z });
  }
  return { pieces, roofs, wx, dz };
}

function buildMill(): PrefabBlueprint {
  const annex = buildRect({
    wx: 2,
    dz: 2,
    floors: [{ style: "wood", door: { side: "s", pos: 0 } }],
    roof: "flat",
  });
  const tower = buildRect({
    wx: 2,
    dz: 3,
    floors: [{ style: "stone", door: { side: "s", pos: 0 } }, { style: "wood" }],
    roof: "gable-z",
    chimney: true,
    chimneyAt: { x: 0, z: 1 },
  });
  const annexShifted = shifted(annex, 0, 1);
  const towerShifted = shifted(tower, 2, 0);
  return {
    pieces: [
      ...annexShifted.pieces,
      ...towerShifted.pieces,
      { piece: "watermill-wide", x: 3.5, y: 0.9, z: 1.45, rotY: R90, scale: 1.1 },
      { piece: "banner-red", x: 2.75, y: 1.1, z: -0.1, rotY: R90 },
      { piece: "banner-red", x: 4.25, y: 1.1, z: 3.1, rotY: R270 },
      { piece: "rock-wide", x: 1.9, y: 0, z: 3.2, scale: 0.9 },
    ],
    roofs: [...annexShifted.roofs, ...towerShifted.roofs],
    wx: 5,
    dz: 4,
  };
}

const BLUEPRINTS: Record<string, PrefabBlueprint> = {
  manoir: buildRect({
    wx: 4,
    dz: 4,
    floors: [
      { style: "stone", door: { side: "s", pos: 1 } },
      { style: "wood" },
    ],
    roof: "gable-z",
    chimney: true,
    chimneyAt: { x: 2, z: 1 },
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
    chimneyAt: { x: 0, z: 1 },
  }),
  annexe: buildRect({
    wx: 2,
    dz: 2,
    floors: [{ style: "stone", door: { side: "s", pos: 0 } }],
    roof: "flat",
  }),
  moulin: buildMill(),
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
  { id: "moulin", label: "Moulin", defaultScale: 3.5 },
];

function allPieceNames(): string[] {
  const set = new Set<string>();
  for (const blueprint of Object.values(BLUEPRINTS)) {
    for (const piece of blueprint.pieces) set.add(piece.piece);
  }
  for (const name of [...TREE_PIECES, ...DECO_PIECES]) set.add(name);
  return [...set];
}

export function kenneyPath(name: string): string {
  return `${BASE}${name}.glb`;
}

export async function preloadKenneyPieces(): Promise<void> {
  await Promise.all(allPieceNames().map((name) => preloadAsset(kenneyPath(name))));
}

export async function preloadKenneyPrefab(type: string): Promise<void> {
  const blueprint = BLUEPRINTS[type];
  if (!blueprint) throw new Error(`Unknown prefab: ${type}`);
  const unique = [...new Set(blueprint.pieces.map((piece) => piece.piece))];
  await Promise.all(unique.map((name) => preloadAsset(kenneyPath(name))));
}

function assemblePieces(pieces: Piece[]): THREE.Group {
  const group = new THREE.Group();
  for (const piece of pieces) {
    const object = cloneAsset(kenneyPath(piece.piece));
    object.position.set(piece.x, piece.y, piece.z);
    object.rotation.y = piece.rotY ?? 0;
    if (piece.scale) object.scale.setScalar(piece.scale);
    group.add(object);
  }
  return group;
}

export interface KenneyBuilding {
  group: THREE.Group;
  hw: number;
  hd: number;
}

export function buildKenney(type: string, scale: number): KenneyBuilding {
  const blueprint = BLUEPRINTS[type];
  if (!blueprint) throw new Error(`Unknown building: ${type}`);

  const inner = new THREE.Group();
  inner.add(assemblePieces(blueprint.pieces));
  for (const roof of blueprint.roofs) inner.add(buildPrefabRoof(roof));
  inner.position.set(-(blueprint.wx - 1) / 2, 0, -(blueprint.dz - 1) / 2);

  const group = new THREE.Group();
  group.add(inner);
  group.scale.setScalar(scale);

  return { group, hw: (blueprint.wx / 2) * scale, hd: (blueprint.dz / 2) * scale };
}
