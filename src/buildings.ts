import * as THREE from "three";
import type { Collider } from "./types.ts";

const wallMat = (color: number) => new THREE.MeshStandardMaterial({ color });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, emissive: 0x222244, emissiveIntensity: 0.3 });
const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e });
const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x996655 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.5 });

function addWindows(group: THREE.Group, w: number, h: number, d: number, rows: number, cols: number): void {
  const winW = 0.5, winH = 0.6;
  const faces = [
    { axis: "x" as const, sign: 1, depth: d },
    { axis: "x" as const, sign: -1, depth: d },
    { axis: "z" as const, sign: 1, depth: w },
    { axis: "z" as const, sign: -1, depth: w },
  ];

  for (const face of faces) {
    const span = face.axis === "x" ? w : d;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const winGeo = new THREE.BoxGeometry(
          face.axis === "z" ? winW : 0.05,
          winH,
          face.axis === "x" ? winW : 0.05,
        );
        const win = new THREE.Mesh(winGeo, windowMat);
        const offset = (c - (cols - 1) / 2) * (span / (cols + 1));
        const yPos = h * 0.3 + r * (h / (rows + 0.5));
        if (face.axis === "x") {
          win.position.set(offset, yPos, face.sign * (d / 2 + 0.03));
        } else {
          win.position.set(face.sign * (w / 2 + 0.03), yPos, offset);
        }
        group.add(win);
      }
    }
  }
}

function addDoor(group: THREE.Group, _w: number, h: number, d: number, side: "front" | "back"): void {
  const doorGeo = new THREE.BoxGeometry(0.8, 1.4, 0.08);
  const door = new THREE.Mesh(doorGeo, doorMat);
  if (side === "front") door.position.set(0, 0.7 - h / 2, d / 2 + 0.04);
  else if (side === "back") door.position.set(0, 0.7 - h / 2, -d / 2 - 0.04);
  group.add(door);
}

function addChimney(group: THREE.Group, h: number, offsetX: number): void {
  const geo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
  const chimney = new THREE.Mesh(geo, chimneyMat);
  chimney.position.set(offsetX, h * 0.6 + 0.75, 0);
  chimney.castShadow = true;
  group.add(chimney);
}

export function createManoir(scene: THREE.Scene, x: number, z: number): Collider {
  const w = 14, d = 7, h = 6;
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeo, wallMat(0xe8d0b0));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const trimGeo = new THREE.BoxGeometry(w + 0.1, 1, d + 0.1);
  const trim = new THREE.Mesh(trimGeo, wallMat(0xc4a882));
  trim.position.y = -h / 2 + 0.5;
  group.add(trim);

  for (let i = -2; i <= 2; i++) {
    const archGeo = new THREE.BoxGeometry(1.2, 2, 0.15);
    const arch = new THREE.Mesh(archGeo, wallMat(0x3a2a1a));
    arch.position.set(i * 2.5, -h / 2 + 1, d / 2 + 0.05);
    group.add(arch);
  }

  addWindows(group, w, h, d, 1, 5);

  for (let i = -2; i <= 2; i += 2) {
    const dormerGeo = new THREE.BoxGeometry(1.2, 1.2, 1);
    const dormer = new THREE.Mesh(dormerGeo, wallMat(0xe8d0b0));
    dormer.position.set(i * 2.2, h / 2 + 0.6, d / 2 - 0.2);
    dormer.castShadow = true;
    group.add(dormer);
    const dRoof = new THREE.Mesh(
      new THREE.ConeGeometry(1, 0.8, 4),
      roofMat,
    );
    dRoof.position.set(i * 2.2, h / 2 + 1.4, d / 2 - 0.2);
    dRoof.rotation.y = Math.PI / 4;
    group.add(dRoof);
  }

  const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.7, 3, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h / 2 + 1.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  addChimney(group, h, -5);
  addChimney(group, h, 5);

  group.position.set(x, h / 2, z);
  scene.add(group);
  return { x, z, hw: w / 2 + 0.5, hd: d / 2 + 0.5, name: "manoir" };
}

export function createGrange(scene: THREE.Scene, x: number, z: number): Collider {
  const w = 10, d = 7, h = 5;
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeo, wallMat(0xb5805a));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  for (let i = -1; i <= 1; i++) {
    const glassGeo = new THREE.BoxGeometry(2.5, 3.5, 0.1);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(i * 3, -0.3, d / 2 + 0.05);
    group.add(glass);
    const frameGeo = new THREE.BoxGeometry(2.6, 3.6, 0.05);
    const frame = new THREE.Mesh(frameGeo, wallMat(0x3a3a3a));
    frame.position.set(i * 3, -0.3, d / 2 + 0.02);
    group.add(frame);
  }

  addWindows(group, w, h, d, 1, 3);

  const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.7, 2.5, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h / 2 + 1.2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  group.position.set(x, h / 2, z);
  scene.add(group);
  return { x, z, hw: w / 2 + 0.5, hd: d / 2 + 0.5, name: "grange" };
}

export function createCottage(scene: THREE.Scene, x: number, z: number): Collider {
  const w = 6, d = 5, h = 4;
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeo, wallMat(0xe0c8a0));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  addWindows(group, w, h, d, 1, 2);
  addDoor(group, w, h, d, "front");
  addChimney(group, h, 1.5);

  const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.7, 2, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h / 2 + 1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  group.position.set(x, h / 2, z);
  scene.add(group);
  return { x, z, hw: w / 2 + 0.5, hd: d / 2 + 0.5, name: "cottage" };
}

export function createAnnexe(scene: THREE.Scene, x: number, z: number, w: number, d: number, h: number, name: string): Collider {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeo, wallMat(0xd4b896));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  addWindows(group, w, h, d, 1, 1);
  addDoor(group, w, h, d, "front");

  const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.65, 1.5, 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h / 2 + 0.75;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  group.position.set(x, h / 2, z);
  scene.add(group);
  return { x, z, hw: w / 2 + 0.5, hd: d / 2 + 0.5, name };
}
