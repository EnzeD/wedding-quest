import * as THREE from "three";

export function createMenuAnchorHelper(): THREE.Group {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.8, 0.22, 20),
    new THREE.MeshStandardMaterial({ color: 0x203348 }),
  );
  base.position.y = 0.11;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd76f, emissive: 0x7a4d00, emissiveIntensity: 0.35 }),
  );
  pole.position.y = 0.95;
  pole.castShadow = true;
  group.add(pole);

  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.52, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x2a9ad1, emissive: 0x10354a, emissiveIntensity: 0.3 }),
  );
  banner.position.set(0, 1.35, 0);
  banner.castShadow = true;
  group.add(banner);

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.45, 5),
    new THREE.MeshStandardMaterial({ color: 0xffb349, emissive: 0x7a4100, emissiveIntensity: 0.45 }),
  );
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(0.74, 0.38, 0);
  group.add(arrow);

  return group;
}
