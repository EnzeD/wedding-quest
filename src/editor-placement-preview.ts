import * as THREE from "three";
import { cloneAsset, normalizeToHeight } from "./assets.ts";
import { createEntityFromPaletteItem, snapPoint } from "./editor-entity.ts";
import type { EditorPaletteItem } from "./level-catalog.ts";
import { entityAssetPath, preloadEntityAsset } from "./level-assets.ts";
import { buildKenney } from "./kenney-buildings.ts";
import type { LevelEntity } from "./types.ts";

function buildEntityObject(entity: LevelEntity): THREE.Group {
  if (entity.kind === "prefab") return buildKenney(entity.assetId, entity.scale).group;
  const path = entityAssetPath(entity);
  if (!path) return new THREE.Group();
  return normalizeToHeight(cloneAsset(path), entity.scale, entity.kind === "npc");
}

function ghostMaterial(material: THREE.Material): THREE.Material {
  const next = material.clone();
  next.transparent = true;
  next.opacity = Math.min(next.opacity, 0.42);
  next.depthWrite = false;
  return next;
}

function applyGhostLook(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(ghostMaterial) : ghostMaterial(mesh.material);
    mesh.renderOrder = 10;
  });
}

export class EditorPlacementPreview {
  private item: EditorPaletteItem | null = null;
  private requestId = 0;
  private levelSize: number;
  private hover = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffb349, opacity: 0.35, transparent: true }),
  );
  private ghostRoot = new THREE.Group();
  private ghost: THREE.Object3D | null = null;

  constructor(levelSize: number, addOverlay: (object: THREE.Object3D) => void) {
    this.levelSize = levelSize;
    this.hover.rotation.x = -Math.PI / 2;
    this.hover.visible = false;
    this.ghostRoot.visible = false;
    addOverlay(this.hover);
    addOverlay(this.ghostRoot);
  }

  setItem(item: EditorPaletteItem | null): void {
    this.item = item;
    this.hover.visible = false;
    this.ghostRoot.visible = false;
    this.requestId += 1;
    this.clearGhost();
    if (!item || item.surfaceTool) return;
    void this.loadGhost(item, this.requestId);
  }

  update(point: THREE.Vector3 | null): void {
    if (!this.item || !point) {
      this.hover.visible = false;
      this.ghostRoot.visible = false;
      return;
    }
    const pos = this.item.defaultSnap === "grid" || this.item.surfaceTool ? snapPoint(point, this.levelSize) : point;
    this.hover.visible = true;
    this.hover.position.set(pos.x, 0.08, pos.z);
    if (!this.item.surfaceTool && this.ghost) {
      this.ghostRoot.visible = true;
      this.ghostRoot.position.set(pos.x, 0, pos.z);
    }
  }

  private async loadGhost(item: EditorPaletteItem, requestId: number): Promise<void> {
    const entity = createEntityFromPaletteItem(item, new THREE.Vector3(), this.levelSize);
    await preloadEntityAsset(entity);
    if (requestId !== this.requestId || this.item?.id !== item.id) return;
    this.ghost = buildEntityObject(entity);
    applyGhostLook(this.ghost);
    this.ghostRoot.add(this.ghost);
  }

  private clearGhost(): void {
    if (!this.ghost) return;
    this.ghostRoot.remove(this.ghost);
    this.ghost = null;
  }
}
