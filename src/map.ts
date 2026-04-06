import * as THREE from "three";
import { cloneAsset, normalizeToHeight } from "./assets.ts";
import { buildKenney, kenneyPath, TREE_PIECES } from "./kenney-buildings.ts";
import type { Collider, PondData } from "./types.ts";

export const MAP_SIZE = 90;

// Kenney palette colors
const COL = {
  ground: 0x41a479,
  path: 0xf0c59d,
  pond: 0x5f74ca,
  hedge: 0x3da679,
};

interface BuildingPlacement {
  type: string;
  x: number;
  z: number;
  scale: number;
  rotY?: number;
  name: string;
}

const BUILDING_PLACEMENTS: BuildingPlacement[] = [
  { type: "manoir", x: -10, z: -22, scale: 3, name: "manoir" },
  { type: "grange", x: 14, z: -12, scale: 3, name: "grange" },
  { type: "cottage", x: -20, z: 22, scale: 4, name: "cottage" },
  { type: "annexe", x: -24, z: -16, scale: 3, name: "annexe-1" },
  { type: "annexe", x: -24, z: -24, scale: 3, name: "annexe-2" },
];

function placeBuildings(scene: THREE.Scene): Collider[] {
  const colliders: Collider[] = [];
  for (const b of BUILDING_PLACEMENTS) {
    const building = buildKenney(b.type, b.scale);
    building.group.position.set(b.x, 0, b.z);
    if (b.rotY) building.group.rotation.y = b.rotY;
    scene.add(building.group);
    colliders.push({ x: b.x, z: b.z, hw: building.hw, hd: building.hd, name: b.name });
  }
  return colliders;
}

const TREE_POSITIONS: [number, number, number][] = [
  [-5, 5, 3],
  [10, 8, 4],
  [5, 20, 3],
  [20, 5, 3.5],
  [-30, -5, 4],
  [-33, 0, 3],
  [-28, 5, 3.5],
  [-32, 10, 4],
  [-35, 15, 3],
  [-30, 18, 4],
  [0, 28, 3],
  [15, 25, 3.5],
  [-12, 30, 3],
  [25, 12, 4],
  [-15, 12, 3],
  [20, -36, 5],
  [24, -38, 5],
  [28, -38, 5],
  [32, -37, 5],
  [0, 15, 7],
  [18, -20, 4],
  [38, -18, 4],
];

function placeVegetation(scene: THREE.Scene): void {
  for (const [x, z, h] of TREE_POSITIONS) {
    const name = TREE_PIECES[Math.floor(Math.random() * TREE_PIECES.length)];
    const mesh = cloneAsset(kenneyPath(name));
    const wrapped = normalizeToHeight(mesh, h);
    wrapped.position.set(x, 0, z);
    scene.add(wrapped);
  }
}

interface DecoPiece {
  piece: string;
  x: number;
  z: number;
  h: number;
  rotY?: number;
}

const DECORATIONS: DecoPiece[] = [
  { piece: "lantern", x: -4, z: 8, h: 3 },
  { piece: "lantern", x: 4, z: -4, h: 3 },
  { piece: "lantern", x: 14, z: -4, h: 3 },
  { piece: "stall-green", x: 2, z: 12, h: 2.5 },
  { piece: "stall-red", x: -6, z: 14, h: 2.5, rotY: Math.PI / 4 },
  { piece: "cart", x: 18, z: 15, h: 1.5 },
  { piece: "fence", x: -28, z: -20, h: 1.5 },
  { piece: "rock-small", x: 8, z: 20, h: 1.2 },
  { piece: "rock-wide", x: -12, z: -5, h: 1 },
  { piece: "rock-small", x: 35, z: -30, h: 1.5 },
  { piece: "fountain-round", x: 0, z: 2, h: 2 },
];

function placeDecorations(scene: THREE.Scene): void {
  for (const d of DECORATIONS) {
    const mesh = cloneAsset(kenneyPath(d.piece));
    const wrapped = normalizeToHeight(mesh, d.h);
    wrapped.position.set(d.x, 0, d.z);
    if (d.rotY) wrapped.rotation.y = d.rotY;
    scene.add(wrapped);
  }
}

function createGround(scene: THREE.Scene): void {
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const mat = new THREE.MeshStandardMaterial({ color: COL.ground });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function createPond(scene: THREE.Scene): PondData {
  const x = 28,
    z = -28,
    rx = 10,
    rz = 7;
  const curve = new THREE.EllipseCurve(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  const shape = new THREE.Shape(curve.getPoints(32));
  const mat = new THREE.MeshStandardMaterial({
    color: COL.pond,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.05, z);
  scene.add(mesh);
  return { x, z, rx, rz };
}

function createPaths(scene: THREE.Scene): void {
  const mat = new THREE.MeshStandardMaterial({ color: COL.path });
  const routes: [number, number][][] = [
    [
      [-18, 25],
      [-12, 15],
      [-5, 8],
      [0, 2],
      [5, -5],
      [8, -12],
    ],
    [
      [0, 2],
      [10, -2],
      [15, -8],
    ],
    [
      [5, -5],
      [-5, -10],
      [-10, -18],
    ],
  ];
  for (const pts of routes) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const dx = x2 - x1,
        dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.5), mat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      seg.rotation.z = -Math.atan2(dz, dx);
      scene.add(seg);
    }
  }
}

function createBoundary(scene: THREE.Scene): void {
  const half = MAP_SIZE / 2;
  const mat = new THREE.MeshStandardMaterial({ color: COL.hedge });
  for (const { pos, rot } of [
    { pos: [0, 0.75, -half] as const, rot: 0 },
    { pos: [0, 0.75, half] as const, rot: 0 },
    { pos: [-half, 0.75, 0] as const, rot: Math.PI / 2 },
    { pos: [half, 0.75, 0] as const, rot: Math.PI / 2 },
  ]) {
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(MAP_SIZE, 1.5, 1.5), mat);
    hedge.position.set(pos[0], pos[1], pos[2]);
    hedge.rotation.y = rot;
    hedge.castShadow = true;
    scene.add(hedge);
  }
}

export function buildMap(scene: THREE.Scene): { colliders: Collider[]; pond: PondData } {
  createGround(scene);
  createPaths(scene);
  createBoundary(scene);
  const colliders = placeBuildings(scene);
  const pond = createPond(scene);
  placeVegetation(scene);
  placeDecorations(scene);
  return { colliders, pond };
}
