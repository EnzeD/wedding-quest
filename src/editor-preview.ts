import * as THREE from "three";
import { cloneAsset, normalizeToHeight, preloadAsset } from "./assets.ts";
import type { EditorPaletteItem } from "./level-catalog.ts";
import { buildKenney, kenneyPath, preloadKenneyPrefab } from "./kenney-buildings.ts";
import { npcAssetPath, pickupAssetPath } from "./level-assets.ts";
import { createMenuAnchorHelper } from "./menu-anchor-helper.ts";

function createSurfacePreview(item: EditorPaletteItem): THREE.Object3D {
  const color = item.id === "water" ? 0x5f74ca : 0xf0c59d;
  const mat = new THREE.MeshStandardMaterial({ color, transparent: item.id === "water", opacity: item.id === "water" ? 0.8 : 1 });
  const plane = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.6), mat);
  return plane;
}

async function createPreviewObject(item: EditorPaletteItem): Promise<THREE.Object3D> {
  if (item.surfaceTool) return createSurfacePreview(item);
  if (item.kind === "menu-anchor") return createMenuAnchorHelper();

  if (item.kind === "prefab") {
    await preloadKenneyPrefab(item.id);
    return buildKenney(item.id, Math.max(1, (item.defaultScale ?? 2) / 2)).group;
  }

  const path = item.kind === "npc"
    ? npcAssetPath(item.id)
    : item.kind === "pickup"
      ? pickupAssetPath(item.id)
      : kenneyPath(item.id);
  if (!path) return new THREE.Group();
  await preloadAsset(path);
  const asset = cloneAsset(path);
  const targetHeight = item.kind === "pickup" ? item.defaultScale ?? 0.8 : item.kind === "npc" ? 1.9 : 2.2;
  return normalizeToHeight(asset, targetHeight, item.kind === "npc");
}

export class EditorPreviewStore {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private previews = new Map<string, string>();
  private pending = new Map<string, Promise<string | null>>();
  private queue: Promise<void> = Promise.resolve();

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(112, 84, false);
    this.renderer.setPixelRatio(1);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 112 / 84, 0.1, 100);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(4, 6, 5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x9bbdec, 0.8);
    fill.position.set(-3, 4, -4);
    this.scene.add(fill);
  }

  get(item: EditorPaletteItem): string | null {
    return this.previews.get(item.id) ?? null;
  }

  ensure(item: EditorPaletteItem): Promise<string | null> {
    if (this.previews.has(item.id)) return Promise.resolve(this.previews.get(item.id)!);
    if (this.pending.has(item.id)) return this.pending.get(item.id)!;

    let finish: (url: string | null) => void = () => undefined;
    const task = new Promise<string | null>((resolve) => {
      finish = resolve;
    });
    this.pending.set(item.id, task);
    this.queue = this.queue
      .catch(() => undefined)
      .then(async () => {
        let url: string | null = null;
        try {
          url = await this.renderItem(item);
          if (url) this.previews.set(item.id, url);
        } catch {
          url = null;
        }
        this.pending.delete(item.id);
        finish(url);
      });
    return task;
  }

  private async renderItem(item: EditorPaletteItem): Promise<string | null> {
    const object = await createPreviewObject(item);
    const wrap = new THREE.Group();
    wrap.add(object);
    this.scene.add(wrap);

    const box = new THREE.Box3().setFromObject(wrap);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    wrap.position.set(-center.x, -box.min.y, -center.z);

    const radius = Math.max(size.x, size.y, size.z, 1);
    this.camera.position.set(radius * 1.25, radius * 0.95, radius * 1.35);
    this.camera.lookAt(0, size.y * 0.45, 0);

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL("image/png");
    this.scene.remove(wrap);
    return url;
  }
}
