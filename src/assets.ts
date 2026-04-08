import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { applyToonMaterials } from "./shaders/toon.ts";
import { applyWindToObject } from "./shaders/wind.ts";
import type { AssetManifest } from "./types.ts";

const loader = new GLTFLoader();

function isWindyAsset(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.includes("/tree") ||
    lower.includes("tree.glb") ||
    lower.includes("tree-") ||
    lower.includes("banner-")
  );
}

interface CachedAsset {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

const cache = new Map<string, CachedAsset>();

let manifest: AssetManifest | null = null;

export async function loadManifest(): Promise<AssetManifest> {
  const res = await fetch("/assets.json");
  manifest = await res.json();
  return manifest!;
}

export function getManifest(): AssetManifest {
  if (!manifest) throw new Error("Manifest not loaded");
  return manifest;
}

async function loadGltf(path: string): Promise<CachedAsset> {
  if (cache.has(path)) return cache.get(path)!;

  return new Promise((resolve, reject) => {
    loader.load(
      `/${path}`,
      (gltf) => {
        const root = gltf.scene;
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        applyToonMaterials(root);
        if (isWindyAsset(path)) {
          applyWindToObject(root, { amplitude: 0.07, frequency: 1.4, swayFloor: 0.3 });
        }
        const entry: CachedAsset = { scene: root, animations: gltf.animations };
        cache.set(path, entry);
        resolve(entry);
      },
      undefined,
      reject,
    );
  });
}

export async function loadAllAssets(): Promise<void> {
  const m = getManifest();
  const allPaths: string[] = [];

  for (const category of Object.values(m) as Record<string, string>[]) {
    for (const path of Object.values(category)) {
      if (!allPaths.includes(path)) allPaths.push(path);
    }
  }

  await Promise.all(allPaths.map((p) => loadGltf(p)));
}

export function cloneAsset(path: string): THREE.Group {
  const entry = cache.get(path);
  if (!entry) {
    console.warn(`Asset not cached: ${path}`);
    return new THREE.Group();
  }
  // SkeletonUtils.clone handles SkinnedMesh + skeleton bindings correctly
  return SkeletonUtils.clone(entry.scene) as THREE.Group;
}

export async function preloadAsset(path: string): Promise<void> {
  await loadGltf(path);
}

export function getAnimations(path: string): THREE.AnimationClip[] {
  const entry = cache.get(path);
  return entry ? entry.animations : [];
}

export function normalizeToHeight(
  root: THREE.Group,
  targetHeight: number,
  keepPivot = false,
): THREE.Group {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const currentHeight = size.y || 1;
  const scale = targetHeight / currentHeight;
  root.scale.multiplyScalar(scale);

  // Re-center at origin, bottom at y=0
  const newBox = new THREE.Box3().setFromObject(root);
  const center = newBox.getCenter(new THREE.Vector3());

  if (keepPivot) {
    // Only adjust Y (feet on ground), preserve model's built-in X/Z pivot
    root.position.set(0, -newBox.min.y, 0);
  } else {
    root.position.set(-center.x, -newBox.min.y, -center.z);
  }

  const wrapper = new THREE.Group();
  wrapper.add(root);
  return wrapper;
}
