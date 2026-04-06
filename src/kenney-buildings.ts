import * as THREE from "three";
import { cloneAsset, preloadAsset } from "./assets.ts";

const KENNEY_BASE = "assets/kenney/";

interface PiecePlacement {
  piece: string;
  x: number;
  y: number;
  z: number;
  rotY?: number;
}

// Simple stone cottage: 2 cells (X) x 3 cells (Z), 1 floor + gable roof
const COTTAGE_PIECES: PiecePlacement[] = [
  // Floor
  { piece: "planks", x: 0, y: 0, z: 0 },
  { piece: "planks", x: 1, y: 0, z: 0 },
  { piece: "planks", x: 0, y: 0, z: 1 },
  { piece: "planks", x: 1, y: 0, z: 1 },
  { piece: "planks", x: 0, y: 0, z: 2 },
  { piece: "planks", x: 1, y: 0, z: 2 },

  // East wall (+X edge, rot 0)
  { piece: "wall", x: 1, y: 0, z: 0, rotY: 0 },
  { piece: "wall-window-shutters", x: 1, y: 0, z: 1, rotY: 0 },
  { piece: "wall", x: 1, y: 0, z: 2, rotY: 0 },

  // West wall (-X edge, rot PI)
  { piece: "wall", x: 0, y: 0, z: 0, rotY: Math.PI },
  { piece: "wall-door", x: 0, y: 0, z: 1, rotY: Math.PI },
  { piece: "wall", x: 0, y: 0, z: 2, rotY: Math.PI },

  // South wall (-Z edge, rot 3PI/2)
  { piece: "wall-window-small", x: 0, y: 0, z: 0, rotY: Math.PI * 1.5 },
  { piece: "wall-window-small", x: 1, y: 0, z: 0, rotY: Math.PI * 1.5 },

  // North wall (+Z edge, rot PI/2)
  { piece: "wall", x: 0, y: 0, z: 2, rotY: Math.PI * 0.5 },
  { piece: "wall", x: 1, y: 0, z: 2, rotY: Math.PI * 0.5 },

  // Roof - west slope (slopes up toward +X center)
  { piece: "roof", x: 0, y: 1, z: 0, rotY: 0 },
  { piece: "roof", x: 0, y: 1, z: 1, rotY: 0 },
  { piece: "roof", x: 0, y: 1, z: 2, rotY: 0 },

  // Roof - east slope (slopes up toward -X center)
  { piece: "roof", x: 1, y: 1, z: 0, rotY: Math.PI },
  { piece: "roof", x: 1, y: 1, z: 1, rotY: Math.PI },
  { piece: "roof", x: 1, y: 1, z: 2, rotY: Math.PI },

  // Chimney on the back corner
  { piece: "chimney", x: 1, y: 1, z: 0, rotY: 0 },
];

function uniquePieceNames(pieces: PiecePlacement[]): string[] {
  return [...new Set(pieces.map((p) => p.piece))];
}

function kenneyPath(name: string): string {
  return `${KENNEY_BASE}${name}.glb`;
}

export async function preloadKenneyPieces(): Promise<void> {
  const names = uniquePieceNames(COTTAGE_PIECES);
  await Promise.all(names.map((n) => preloadAsset(kenneyPath(n))));
}

function assemblePieces(pieces: PiecePlacement[]): THREE.Group {
  const group = new THREE.Group();
  for (const p of pieces) {
    const piece = cloneAsset(kenneyPath(p.piece));
    piece.position.set(p.x, p.y, p.z);
    if (p.rotY) piece.rotation.y = p.rotY;
    group.add(piece);
  }
  return group;
}

export interface KenneyBuilding {
  group: THREE.Group;
  hw: number;
  hd: number;
}

export function buildCottage(scale: number = 4): KenneyBuilding {
  const inner = assemblePieces(COTTAGE_PIECES);
  // Center on footprint (2 cells X, 3 cells Z)
  inner.position.set(-1, 0, -1.5);

  const group = new THREE.Group();
  group.add(inner);
  group.scale.setScalar(scale);

  return {
    group,
    hw: 1 * scale,
    hd: 1.5 * scale,
  };
}
