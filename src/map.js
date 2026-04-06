import * as THREE from "three";
import { createManoir, createGrange, createCottage, createAnnexe } from "./buildings.js";
import {
  createTree, createPoplar, createOak, createWillow, createBeechTree,
  createBush, createFlowerBed, createHedgeRow,
} from "./vegetation.js";
import {
  createBench, createTable, createStoneWall,
  createLantern, createPondDetails, createCeremonyChairs, createTennisCourt,
} from "./decorations.js";

function createPond(scene, x, z, rx, rz) {
  const curve = new THREE.EllipseCurve(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  const pts = curve.getPoints(32);
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x5a8a6a,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.05, z);
  scene.add(mesh);
  return { x, z, rx, rz };
}

function createPath(scene, points, width) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xd4c9a8 });
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[i + 1];
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const geo = new THREE.PlaneGeometry(len, width);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
    mesh.rotation.z = -Math.atan2(dz, dx);
    scene.add(mesh);
  }
}

function createGravelArea(scene, x, z, w, d) {
  const geo = new THREE.PlaneGeometry(w, d);
  const mat = new THREE.MeshStandardMaterial({ color: 0xc8b898 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.015, z);
  scene.add(mesh);
}

function createHills(scene) {
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x6aae4a });
  const hillGeo = new THREE.SphereGeometry(1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const hills = [
    { x: -25, z: -48, sx: 18, sy: 5, sz: 10 },
    { x: 5, z: -52, sx: 25, sy: 6, sz: 12 },
    { x: 35, z: -46, sx: 15, sy: 4, sz: 8 },
  ];
  for (const h of hills) {
    const mesh = new THREE.Mesh(hillGeo, hillMat);
    mesh.position.set(h.x, 0, h.z);
    mesh.scale.set(h.sx, h.sy, h.sz);
    scene.add(mesh);
  }
}

export const MAP_SIZE = 90;

export function buildMap(scene) {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x7cba5c });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  createHills(scene);

  // --- Paths ---
  createPath(scene, [[-18, 25], [-12, 15], [-5, 8], [0, 2], [5, -5], [8, -12]], 2.5);
  createPath(scene, [[0, 2], [10, -2], [15, -8]], 2.5);
  createPath(scene, [[5, -5], [-5, -10], [-10, -18]], 2);
  createPath(scene, [[15, -8], [22, -8], [28, -5]], 2);
  createPath(scene, [[-10, -18], [-10, -25]], 1.5);
  createPath(scene, [[8, -12], [14, -16]], 1.5);

  // Gravel areas near buildings
  createGravelArea(scene, -10, -14, 16, 6);
  createGravelArea(scene, 14, -5, 12, 6);

  // --- Buildings ---
  const colliders = [];
  colliders.push(createManoir(scene, -10, -22));
  colliders.push(createAnnexe(scene, -24, -16, 5, 5, 4, "annexe-1"));
  colliders.push(createAnnexe(scene, -24, -24, 4, 4, 3.5, "annexe-2"));
  colliders.push(createGrange(scene, 14, -12));
  colliders.push(createCottage(scene, -20, 22));

  // --- Pond ---
  const pond = createPond(scene, 28, -28, 10, 7);
  createPondDetails(scene, 28, -28, 10, 7);

  // --- Ceremony area (grand hetre + chairs) ---
  // Hetre in the middle of the lawn (where the table is in reality)
  createBeechTree(scene, 0, 15);
  // Chairs south of the tree, facing north toward it
  createCeremonyChairs(scene, 0, 21, Math.PI, 6, 10);

  // --- Tennis court (upper-left) ---
  createTennisCourt(scene, -25, -35, 0);

  // --- Vegetation ---
  // Poplars around the pond
  const poplars = [
    [20, -36], [24, -38], [28, -38], [32, -37], [36, -34],
    [38, -28], [37, -22], [35, -19], [22, -21],
  ];
  for (const [x, z] of poplars) createPoplar(scene, x, z);

  // Oaks (large round trees on the lawn)
  const oaks = [[-5, 5], [10, 8], [5, 20], [-8, -3], [20, 5]];
  for (const [x, z] of oaks) createOak(scene, x, z);

  // Willows (near pond / wet area)
  createWillow(scene, 18, -20);
  createWillow(scene, 38, -18);

  // Dense woods (west side)
  const westTrees = [
    [-30, -5], [-33, 0], [-28, 5], [-32, 10], [-35, 15],
    [-30, 18], [-28, -10], [-34, -8], [-26, 12], [-31, 22],
    [-36, 5], [-33, -3], [-27, 8], [-35, 20], [-29, 15],
    [-38, 0], [-37, 10], [-32, 25], [-28, 28], [-34, 28],
  ];
  for (const [x, z] of westTrees) createTree(scene, x, z);

  // Scattered lawn trees
  const lawnTrees = [
    [0, 28], [15, 25], [-12, 30], [25, 12], [-15, 12],
    [8, 32], [-5, 35], [18, 30], [30, 20], [-8, 25],
  ];
  for (const [x, z] of lawnTrees) createTree(scene, x, z, 0.7 + Math.random() * 0.4);

  // Bushes
  const bushes = [
    [-16, -15], [-6, -18], [8, -6], [20, -4], [-22, 18],
    [-18, 26], [12, -18], [-14, 0], [25, 8], [0, -8],
    [-26, -10], [30, -12], [-20, 5], [5, 15], [-10, 10],
  ];
  for (const [x, z] of bushes) createBush(scene, x, z);

  // Flower beds
  createFlowerBed(scene, -15, 18, 2, 20);
  createFlowerBed(scene, 5, -2, 1.5, 12);
  createFlowerBed(scene, -8, 8, 1.5, 15);
  createFlowerBed(scene, 20, 0, 1, 10);

  // Hedge rows
  createHedgeRow(scene, -18, -28, -18, -16, 1.2);
  createHedgeRow(scene, 8, -16, 8, -8, 1);
  createHedgeRow(scene, -26, 18, -22, 18, 1);

  // --- Decorations ---
  createBench(scene, 2, 12, 0);
  createBench(scene, -6, 22, Math.PI / 4);
  createBench(scene, 18, 15, -Math.PI / 3);
  createBench(scene, -12, 2, Math.PI / 2);

  createTable(scene, 22, 2, Math.PI / 6);

  createStoneWall(scene, -28, -28, -28, -12, 0.8);
  createStoneWall(scene, -28, -28, -18, -28, 0.6);

  createLantern(scene, -4, 8);
  createLantern(scene, 4, -4);
  createLantern(scene, -12, 15);
  createLantern(scene, 14, -4);
  createLantern(scene, -18, 18);

  // --- Map boundary (hedges) ---
  const half = MAP_SIZE / 2;
  const hedgeGeo = new THREE.BoxGeometry(MAP_SIZE, 1.5, 1.5);
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e });
  const sides = [
    { pos: [0, 0.75, -half], rot: 0 },
    { pos: [0, 0.75, half], rot: 0 },
    { pos: [-half, 0.75, 0], rot: Math.PI / 2 },
    { pos: [half, 0.75, 0], rot: Math.PI / 2 },
  ];
  for (const s of sides) {
    const hedge = new THREE.Mesh(hedgeGeo, hedgeMat);
    hedge.position.set(...s.pos);
    hedge.rotation.y = s.rot;
    hedge.castShadow = true;
    scene.add(hedge);
  }

  return { colliders, pond };
}
