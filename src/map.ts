import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { cloneAsset, normalizeToHeight, getManifest } from "./assets.ts";
import { buildCottage } from "./kenney-buildings.ts";
import type { Collider, PondData } from "./types.ts";

export const MAP_SIZE = CONFIG.map.size;

interface BuildingPlacement {
  key: string;
  x: number;
  z: number;
  height: number;
  hw: number;
  hd: number;
  name: string;
  rotY?: number;
}

const BUILDINGS: BuildingPlacement[] = [
  { key: "manoir", x: -10, z: -22, height: 6, hw: 7.5, hd: 4, name: "manoir" },
  { key: "grange", x: 14, z: -12, height: 5, hw: 5.5, hd: 4, name: "grange" },
  { key: "cottage", x: -20, z: 22, height: 4, hw: 3.5, hd: 3, name: "cottage" },
  { key: "annexe", x: -24, z: -16, height: 4, hw: 3, hd: 3, name: "annexe-1" },
  { key: "annexe", x: -24, z: -24, height: 3.5, hw: 2.5, hd: 2.5, name: "annexe-2" },
];

function placeBuildings(scene: THREE.Scene): Collider[] {
  const m = getManifest();
  const colliders: Collider[] = [];

  for (const b of BUILDINGS) {
    const path = m.buildings[b.key];
    let mesh: THREE.Group;

    if (path) {
      mesh = cloneAsset(path);
      mesh = normalizeToHeight(mesh, b.height);
    } else {
      mesh = createBoxPlaceholder(b.hw * 2, b.height, b.hd * 2, 0xd4b896);
    }

    mesh.position.set(b.x, 0, b.z);
    if (b.rotY) mesh.rotation.y = b.rotY;
    scene.add(mesh);

    colliders.push({ x: b.x, z: b.z, hw: b.hw, hd: b.hd, name: b.name });
  }

  return colliders;
}

function placeVegetation(scene: THREE.Scene): void {
  const m = getManifest();
  const treeKeys = Object.keys(m.vegetation);

  const positions: [number, number, number][] = [
    [-5, 5, 3], [10, 8, 4], [5, 20, 3], [20, 5, 3.5],
    [-30, -5, 4], [-33, 0, 3], [-28, 5, 3.5], [-32, 10, 4],
    [-35, 15, 3], [-30, 18, 4], [0, 28, 3], [15, 25, 3.5],
    [-12, 30, 3], [25, 12, 4], [-15, 12, 3],
    [20, -36, 5], [24, -38, 5], [28, -38, 5], [32, -37, 5],
    [0, 15, 7], // Grand hetre (ceremony)
    [18, -20, 4], [38, -18, 4], // Willow positions
  ];

  for (const [x, z, h] of positions) {
    const key = treeKeys[Math.floor(Math.random() * treeKeys.length)];
    const path = m.vegetation[key];
    let mesh: THREE.Group;

    if (path) {
      mesh = cloneAsset(path);
      mesh = normalizeToHeight(mesh, h);
    } else {
      mesh = createConePlaceholder(h);
    }

    mesh.position.set(x, 0, z);
    scene.add(mesh);
  }
}

function placeDecorations(scene: THREE.Scene): void {
  const m = getManifest();

  const placements: { key: string; x: number; z: number; h: number; rotY?: number }[] = [
    { key: "bench", x: 2, z: 12, h: 0.8 },
    { key: "bench", x: -6, z: 22, h: 0.8, rotY: Math.PI / 4 },
    { key: "bench", x: 18, z: 15, h: 0.8 },
    { key: "streetlight", x: -4, z: 8, h: 2.5 },
    { key: "streetlight", x: 4, z: -4, h: 2.5 },
    { key: "streetlight", x: 14, z: -4, h: 2.5 },
    { key: "fence", x: -28, z: -20, h: 1.2 },
    { key: "sign", x: 0, z: 2, h: 1.5 },
  ];

  for (const p of placements) {
    const path = m.decorations[p.key];
    let mesh: THREE.Group;

    if (path) {
      mesh = cloneAsset(path);
      mesh = normalizeToHeight(mesh, p.h);
    } else {
      mesh = createBoxPlaceholder(0.5, p.h, 0.5, 0x888888);
    }

    mesh.position.set(p.x, 0, p.z);
    if (p.rotY) mesh.rotation.y = p.rotY;
    scene.add(mesh);
  }
}

function createGround(scene: THREE.Scene): void {
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const mat = new THREE.MeshStandardMaterial({ color: CONFIG.map.groundColor });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

function createPond(scene: THREE.Scene): PondData {
  const x = 28, z = -28, rx = 10, rz = 7;
  const curve = new THREE.EllipseCurve(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  const shape = new THREE.Shape(curve.getPoints(32));
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a8a6a, transparent: true, opacity: 0.8 });
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.05, z);
  scene.add(mesh);
  return { x, z, rx, rz };
}

function createPaths(scene: THREE.Scene): void {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd4c9a8 });
  const routes: [number, number][][] = [
    [[-18, 25], [-12, 15], [-5, 8], [0, 2], [5, -5], [8, -12]],
    [[0, 2], [10, -2], [15, -8]],
    [[5, -5], [-5, -10], [-10, -18]],
  ];
  for (const pts of routes) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const dx = x2 - x1, dz = z2 - z1;
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e });
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

function placeKenneyBuildings(scene: THREE.Scene): Collider[] {
  const colliders: Collider[] = [];

  const cottage = buildCottage(4);
  cottage.group.position.set(15, 0, 15);
  scene.add(cottage.group);
  colliders.push({ x: 15, z: 15, hw: cottage.hw, hd: cottage.hd, name: "kenney-cottage" });

  return colliders;
}

export function buildMap(scene: THREE.Scene): { colliders: Collider[]; pond: PondData } {
  createGround(scene);
  createPaths(scene);
  createBoundary(scene);
  const colliders = placeBuildings(scene);
  colliders.push(...placeKenneyBuildings(scene));
  const pond = createPond(scene);
  placeVegetation(scene);
  placeDecorations(scene);
  return { colliders, pond };
}

function createBoxPlaceholder(w: number, h: number, d: number, color: number): THREE.Group {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color }),
  );
  mesh.position.y = h / 2;
  mesh.castShadow = true;
  group.add(mesh);
  return group;
}

function createConePlaceholder(h: number): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, h * 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5e3c }),
  );
  trunk.position.y = h * 0.2;
  group.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(h * 0.35, h * 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a7d2c }),
  );
  leaves.position.y = h * 0.6;
  leaves.castShadow = true;
  group.add(leaves);
  return group;
}
