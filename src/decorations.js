import * as THREE from "three";

const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0xaaa899 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x666666 });

export function createBench(scene, x, z, rotation) {
  const group = new THREE.Group();
  // Seat
  const seatGeo = new THREE.BoxGeometry(1.5, 0.08, 0.5);
  const seat = new THREE.Mesh(seatGeo, woodMat);
  seat.position.y = 0.45;
  group.add(seat);
  // Back
  const backGeo = new THREE.BoxGeometry(1.5, 0.5, 0.06);
  const back = new THREE.Mesh(backGeo, woodMat);
  back.position.set(0, 0.7, -0.22);
  group.add(back);
  // Legs
  const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.4);
  for (const sx of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(sx, 0.22, 0);
    group.add(leg);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation || 0;
  group.castShadow = true;
  scene.add(group);
}

export function createTable(scene, x, z, rotation) {
  const group = new THREE.Group();
  // Top
  const topGeo = new THREE.BoxGeometry(1.8, 0.06, 1);
  const top = new THREE.Mesh(topGeo, woodMat);
  top.position.y = 0.75;
  group.add(top);
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6);
  for (const [lx, lz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(lx, 0.375, lz);
    group.add(leg);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation || 0;
  scene.add(group);
}

export function createStoneWall(scene, x1, z1, x2, z2, h) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const height = h || 0.8;
  const geo = new THREE.BoxGeometry(len, height, 0.5);
  const mesh = new THREE.Mesh(geo, stoneMat);
  mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
  mesh.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
  mesh.castShadow = true;
  scene.add(mesh);
}

export function createLantern(scene, x, z) {
  const group = new THREE.Group();
  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.5, 6);
  const pole = new THREE.Mesh(poleGeo, metalMat);
  pole.position.y = 1.25;
  group.add(pole);
  // Light housing
  const housingGeo = new THREE.BoxGeometry(0.25, 0.35, 0.25);
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    emissive: 0xffaa44,
    emissiveIntensity: 0.4,
  });
  const housing = new THREE.Mesh(housingGeo, housingMat);
  housing.position.y = 2.6;
  group.add(housing);
  group.position.set(x, 0, z);
  scene.add(group);
}

export function createPondDetails(scene, pondX, pondZ, rx, rz) {
  // Reeds around edges
  const reedGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4);
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x6b8a3a });
  const reedTopGeo = new THREE.SphereGeometry(0.08, 4, 3);
  const reedTopMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3a });

  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const edgeR = 0.9 + Math.random() * 0.15;
    const px = pondX + Math.cos(angle) * rx * edgeR;
    const pz = pondZ + Math.sin(angle) * rz * edgeR;

    const reed = new THREE.Mesh(reedGeo, reedMat);
    reed.position.set(px, 0.6, pz);
    reed.rotation.x = (Math.random() - 0.5) * 0.2;
    reed.rotation.z = (Math.random() - 0.5) * 0.2;
    scene.add(reed);

    if (Math.random() > 0.5) {
      const top = new THREE.Mesh(reedTopGeo, reedTopMat);
      top.position.set(px, 1.25, pz);
      scene.add(top);
    }
  }

  // Lily pads
  const padGeo = new THREE.CircleGeometry(0.3, 8);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 0.5;
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(
      pondX + Math.cos(angle) * rx * r,
      0.07,
      pondZ + Math.sin(angle) * rz * r
    );
    pad.rotation.z = Math.random() * Math.PI;
    scene.add(pad);
  }
}
