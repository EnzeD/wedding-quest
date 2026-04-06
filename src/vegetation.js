import * as THREE from "three";

// --- Shared geometries ---
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c });

// Regular tree
const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
const treeLeafGeo = new THREE.ConeGeometry(1.5, 3, 6);
const treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x3a7d2c });

// Tall poplar
const poplarTrunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 5, 6);
const poplarLeafGeo = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
const poplarLeafMat = new THREE.MeshStandardMaterial({ color: 0x4a8c3f });

// Oak (round canopy)
const oakTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6);
const oakLeafGeo = new THREE.SphereGeometry(2.2, 8, 6);
const oakLeafMat = new THREE.MeshStandardMaterial({ color: 0x2e6b1e });

// Willow
const willowTrunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2, 6);
const willowLeafGeo = new THREE.SphereGeometry(2.5, 8, 6);
const willowLeafMat = new THREE.MeshStandardMaterial({ color: 0x6aad55 });
const willowDroopGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 4);
const willowDroopMat = new THREE.MeshStandardMaterial({ color: 0x5a9a45 });

// Bush
const bushGeo = new THREE.SphereGeometry(0.7, 6, 5);
const bushMat = new THREE.MeshStandardMaterial({ color: 0x357a28 });
const bushDarkMat = new THREE.MeshStandardMaterial({ color: 0x2a5f1e });

// Flower
const flowerGeo = new THREE.SphereGeometry(0.15, 5, 4);

export function createTree(scene, x, z, scale) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);
  const leaves = new THREE.Mesh(treeLeafGeo, treeLeafMat);
  leaves.position.y = 3.5;
  leaves.castShadow = true;
  group.add(leaves);
  group.position.set(x, 0, z);
  const s = scale || 0.8 + Math.random() * 0.6;
  group.scale.set(s, s, s);
  scene.add(group);
}

export function createPoplar(scene, x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(poplarTrunkGeo, trunkMat);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  group.add(trunk);
  const leaves = new THREE.Mesh(poplarLeafGeo, poplarLeafMat);
  leaves.position.y = 8.5;
  leaves.castShadow = true;
  group.add(leaves);
  group.position.set(x, 0, z);
  const s = 0.9 + Math.random() * 0.3;
  group.scale.set(s, s, s);
  scene.add(group);
}

export function createOak(scene, x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(oakTrunkGeo, trunkMat);
  trunk.position.y = 1.25;
  trunk.castShadow = true;
  group.add(trunk);
  const leaves = new THREE.Mesh(oakLeafGeo, oakLeafMat);
  leaves.position.y = 4;
  leaves.castShadow = true;
  group.add(leaves);
  group.position.set(x, 0, z);
  const s = 0.9 + Math.random() * 0.4;
  group.scale.set(s, s, s);
  scene.add(group);
}

export function createWillow(scene, x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(willowTrunkGeo, trunkMat);
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);
  const canopy = new THREE.Mesh(willowLeafGeo, willowLeafMat);
  canopy.position.y = 3.5;
  canopy.castShadow = true;
  group.add(canopy);
  // Drooping branches
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const r = 1.8 + Math.random() * 0.5;
    const droop = new THREE.Mesh(willowDroopGeo, willowDroopMat);
    droop.position.set(Math.cos(angle) * r, 2.2, Math.sin(angle) * r);
    droop.rotation.x = (Math.random() - 0.5) * 0.3;
    droop.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(droop);
  }
  group.position.set(x, 0, z);
  scene.add(group);
}

export function createBeechTree(scene, x, z) {
  const group = new THREE.Group();
  // Massive trunk
  const bTrunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
  const trunk = new THREE.Mesh(bTrunkGeo, trunkMat);
  trunk.position.y = 2;
  trunk.castShadow = true;
  group.add(trunk);
  // Large spreading canopy (multiple overlapping spheres)
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2a6e1a });
  const positions = [
    [0, 6.5, 0, 3.5], [-2, 5.5, -1.5, 2.5], [2, 5.5, 1, 2.5],
    [-1, 6, 2, 2.8], [1.5, 6, -1.5, 2.6], [0, 5, 0, 3],
  ];
  for (const [cx, cy, cz, r] of positions) {
    const canopyGeo = new THREE.SphereGeometry(r, 8, 6);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(cx, cy, cz);
    canopy.castShadow = true;
    group.add(canopy);
  }
  // Visible roots
  const rootGeo = new THREE.CylinderGeometry(0.08, 0.15, 2, 4);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const root = new THREE.Mesh(rootGeo, trunkMat);
    root.position.set(Math.cos(angle) * 0.9, 0.3, Math.sin(angle) * 0.9);
    root.rotation.z = (Math.random() - 0.5) * 0.8;
    root.rotation.x = (Math.random() - 0.5) * 0.8;
    group.add(root);
  }
  group.position.set(x, 0, z);
  scene.add(group);
}

export function createBush(scene, x, z, scale) {
  const s = scale || 0.6 + Math.random() * 0.6;
  const mat = Math.random() > 0.5 ? bushMat : bushDarkMat;
  const mesh = new THREE.Mesh(bushGeo, mat);
  mesh.position.set(x, s * 0.5, z);
  mesh.scale.set(s, s * 0.8, s);
  mesh.castShadow = true;
  scene.add(mesh);
}

export function createFlowerBed(scene, x, z, radius, count) {
  const colors = [0xff6b8a, 0xffaa44, 0xeedd44, 0xff55aa, 0xaa66ff, 0xffffff];
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshStandardMaterial({ color });
    const flower = new THREE.Mesh(flowerGeo, mat);
    flower.position.set(Math.cos(angle) * r, 0.15, Math.sin(angle) * r);
    group.add(flower);
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 3);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x44882a });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(Math.cos(angle) * r, 0.07, Math.sin(angle) * r);
    group.add(stem);
  }
  group.position.set(x, 0, z);
  scene.add(group);
}

export function createHedgeRow(scene, x1, z1, x2, z2, height) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const geo = new THREE.BoxGeometry(len, height || 1.2, 0.8);
  const mesh = new THREE.Mesh(geo, bushDarkMat);
  mesh.position.set((x1 + x2) / 2, (height || 1.2) / 2, (z1 + z2) / 2);
  mesh.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
  mesh.castShadow = true;
  scene.add(mesh);
}
