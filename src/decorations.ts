import * as THREE from "three";

const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4a });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0xaaa899 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x666666 });

export function createBench(scene: THREE.Scene, x: number, z: number, rotation?: number): void {
  const group = new THREE.Group();
  const seatGeo = new THREE.BoxGeometry(1.5, 0.08, 0.5);
  const seat = new THREE.Mesh(seatGeo, woodMat);
  seat.position.y = 0.45;
  group.add(seat);
  const backGeo = new THREE.BoxGeometry(1.5, 0.5, 0.06);
  const back = new THREE.Mesh(backGeo, woodMat);
  back.position.set(0, 0.7, -0.22);
  group.add(back);
  const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.4);
  for (const sx of [-0.6, 0.6]) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(sx, 0.22, 0);
    group.add(leg);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation ?? 0;
  group.castShadow = true;
  scene.add(group);
}

export function createTable(scene: THREE.Scene, x: number, z: number, rotation?: number): void {
  const group = new THREE.Group();
  const topGeo = new THREE.BoxGeometry(1.8, 0.06, 1);
  const top = new THREE.Mesh(topGeo, woodMat);
  top.position.y = 0.75;
  group.add(top);
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6);
  for (const [lx, lz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]] as const) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(lx, 0.375, lz);
    group.add(leg);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation ?? 0;
  scene.add(group);
}

export function createStoneWall(scene: THREE.Scene, x1: number, z1: number, x2: number, z2: number, h?: number): void {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const height = h ?? 0.8;
  const geo = new THREE.BoxGeometry(len, height, 0.5);
  const mesh = new THREE.Mesh(geo, stoneMat);
  mesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
  mesh.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
  mesh.castShadow = true;
  scene.add(mesh);
}

export function createLantern(scene: THREE.Scene, x: number, z: number): void {
  const group = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.5, 6);
  const pole = new THREE.Mesh(poleGeo, metalMat);
  pole.position.y = 1.25;
  group.add(pole);
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

export function createPondDetails(scene: THREE.Scene, pondX: number, pondZ: number, rx: number, rz: number): void {
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
      pondZ + Math.sin(angle) * rz * r,
    );
    pad.rotation.z = Math.random() * Math.PI;
    scene.add(pad);
  }
}

export function createCeremonyChairs(scene: THREE.Scene, x: number, z: number, facing: number, rows: number, seatsPerRow: number): void {
  const chairSeatGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
  const chairBackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.04);
  const chairLegGeo = new THREE.BoxGeometry(0.04, 0.4, 0.04);
  const chairMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8 });

  const group = new THREE.Group();
  const spacingX = 0.55;
  const spacingZ = 0.7;
  const aisleWidth = 1.2;

  for (let row = 0; row < rows; row++) {
    for (let seat = 0; seat < seatsPerRow; seat++) {
      const chair = new THREE.Group();

      const seatMesh = new THREE.Mesh(chairSeatGeo, chairMat);
      seatMesh.position.y = 0.4;
      chair.add(seatMesh);

      const back = new THREE.Mesh(chairBackGeo, chairMat);
      back.position.set(0, 0.6, -0.18);
      chair.add(back);

      for (const [lx, lz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]] as const) {
        const leg = new THREE.Mesh(chairLegGeo, chairMat);
        leg.position.set(lx, 0.2, lz);
        chair.add(leg);
      }

      const half = seatsPerRow / 2;
      let offsetX: number;
      if (seat < half) {
        offsetX = (seat - half / 2) * spacingX - aisleWidth / 2;
      } else {
        offsetX = ((seat - half) - half / 2) * spacingX + aisleWidth / 2;
      }
      const offsetZ = row * spacingZ;

      chair.position.set(offsetX, 0, offsetZ);
      group.add(chair);
    }
  }

  group.position.set(x, 0, z);
  group.rotation.y = facing;
  scene.add(group);
}

export function createTennisCourt(scene: THREE.Scene, x: number, z: number, rotation?: number): void {
  const group = new THREE.Group();

  const surfaceGeo = new THREE.PlaneGeometry(11, 6);
  const surfaceMat = new THREE.MeshStandardMaterial({ color: 0xcc5533 });
  const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.02;
  group.add(surface);

  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const lines = [
    { w: 11, d: 0.06, x: 0, z: -3 }, { w: 11, d: 0.06, x: 0, z: 3 },
    { w: 0.06, d: 6, x: -5.5, z: 0 }, { w: 0.06, d: 6, x: 5.5, z: 0 },
    { w: 0.06, d: 6, x: 0, z: 0 },
    { w: 6.4, d: 0.06, x: -2.3, z: 0 }, { w: 6.4, d: 0.06, x: 2.3, z: 0 },
  ];
  for (const l of lines) {
    const geo = new THREE.PlaneGeometry(l.w, l.d);
    const mesh = new THREE.Mesh(geo, lineMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(l.x, 0.025, l.z);
    group.add(mesh);
  }

  const netMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const netMeshGeo = new THREE.PlaneGeometry(6.2, 1);
  const net = new THREE.Mesh(netMeshGeo, netMat);
  net.position.set(0, 0.5, 0);
  net.rotation.y = Math.PI / 2;
  group.add(net);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
  for (const pz of [-3.1, 3.1]) {
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 0.55, pz);
    group.add(pole);
  }

  const fenceGeo = new THREE.BoxGeometry(13, 2, 0.05);
  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x228833, transparent: true, opacity: 0.3,
  });
  for (const [fx, fz, ry] of [[0, -4, 0], [0, 4, 0], [-6.5, 0, Math.PI / 2], [6.5, 0, Math.PI / 2]] as const) {
    const fence = new THREE.Mesh(
      ry ? new THREE.BoxGeometry(8, 2, 0.05) : fenceGeo,
      fenceMat,
    );
    fence.position.set(fx, 1, fz);
    fence.rotation.y = ry;
    group.add(fence);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation ?? 0;
  scene.add(group);
}
