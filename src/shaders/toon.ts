import * as THREE from "three";

let cachedRamp: THREE.DataTexture | null = null;

export function getToonRamp(): THREE.DataTexture {
  if (cachedRamp) return cachedRamp;
  // 4-step grayscale ramp for cartoon shading.
  const px = new Uint8Array([
    90, 90, 90, 255,
    150, 150, 150, 255,
    215, 215, 215, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(px, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  cachedRamp = tex;
  return tex;
}

type ToonSource =
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | THREE.MeshPhongMaterial
  | THREE.MeshLambertMaterial;

function isConvertible(mat: THREE.Material): mat is ToonSource {
  const m = mat as THREE.Material & {
    isMeshStandardMaterial?: boolean;
    isMeshPhysicalMaterial?: boolean;
    isMeshPhongMaterial?: boolean;
    isMeshLambertMaterial?: boolean;
    isMeshToonMaterial?: boolean;
  };
  if (m.isMeshToonMaterial) return false;
  return Boolean(
    m.isMeshStandardMaterial ||
      m.isMeshPhysicalMaterial ||
      m.isMeshPhongMaterial ||
      m.isMeshLambertMaterial,
  );
}

function convertMaterial(src: THREE.Material): THREE.Material {
  if (!isConvertible(src)) return src;
  const ramp = getToonRamp();
  const mat = new THREE.MeshToonMaterial({
    color: (src as ToonSource).color?.clone() ?? new THREE.Color(0xffffff),
    map: (src as ToonSource).map ?? null,
    normalMap: (src as ToonSource).normalMap ?? null,
    transparent: src.transparent,
    opacity: src.opacity,
    side: src.side,
    alphaTest: src.alphaTest,
    vertexColors: (src as ToonSource).vertexColors ?? false,
    gradientMap: ramp,
  });
  mat.name = src.name;
  mat.userData = { ...src.userData, toonConverted: true };
  return mat;
}

export function applyToonMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mesh.material = mat.map(convertMaterial);
    } else if (mat) {
      mesh.material = convertMaterial(mat);
    }
  });
}
