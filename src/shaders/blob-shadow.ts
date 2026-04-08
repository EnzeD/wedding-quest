import * as THREE from "three";

let cachedTexture: THREE.CanvasTexture | null = null;

function getRadialTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable for blob shadow");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedTexture = tex;
  return tex;
}

export function createBlobShadow(radius = 0.7): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: getRadialTexture(),
    transparent: true,
    depthWrite: false,
    color: 0x223040,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.renderOrder = 1;
  mesh.name = "blob-shadow";
  return mesh;
}
