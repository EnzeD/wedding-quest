import * as THREE from "three";

// Inverted-hull outline. Skips skinned meshes (their bind matrices make
// uniform scaling break) and meshes already wearing an outline child.
export function addOutline(
  root: THREE.Object3D,
  scale = 1.06,
  color: THREE.ColorRepresentation = 0x101010,
): void {
  const meshes: THREE.Mesh[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if ((mesh as unknown as THREE.SkinnedMesh).isSkinnedMesh) return;
    if (mesh.userData.isOutline) return;
    meshes.push(mesh);
  });

  for (const mesh of meshes) {
    const outlineMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.BackSide,
      transparent: false,
      depthWrite: true,
    });
    const clone = new THREE.Mesh(mesh.geometry, outlineMat);
    clone.scale.setScalar(scale);
    clone.castShadow = false;
    clone.receiveShadow = false;
    clone.userData.isOutline = true;
    clone.name = `outline-${mesh.name || "mesh"}`;
    mesh.add(clone);
  }
}
