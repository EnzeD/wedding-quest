import * as THREE from "three";
import { cloneAsset, normalizeToHeight } from "./assets.ts";
import { cellKey, cellToWorld, getCell, normalizeLevel, type GridCell } from "./level-grid.ts";
import { entityAssetPath, preloadEntityAsset, preloadLevelAssets } from "./level-assets.ts";
import { buildKenney } from "./kenney-buildings.ts";
import type { Collider, LevelData, LevelEntity } from "./types.ts";

const COL = {
  ground: 0x41a479,
  path: 0xf0c59d,
  water: 0x5f74ca,
  hedge: 0x3da679,
};

function createGround(size: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color: COL.ground }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = "level-ground";
  return mesh;
}

function createBoundary(size: number): THREE.Group {
  const half = size / 2;
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: COL.hedge });
  for (const { pos, rot } of [
    { pos: [0, 0.75, -half] as const, rot: 0 },
    { pos: [0, 0.75, half] as const, rot: 0 },
    { pos: [-half, 0.75, 0] as const, rot: Math.PI / 2 },
    { pos: [half, 0.75, 0] as const, rot: Math.PI / 2 },
  ]) {
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(size, 1.5, 1.5), material);
    hedge.position.set(pos[0], pos[1], pos[2]);
    hedge.rotation.y = rot;
    hedge.castShadow = true;
    group.add(hedge);
  }
  return group;
}

function buildEntityObject(entity: LevelEntity): THREE.Group {
  if (entity.kind === "prefab") {
    return buildKenney(entity.assetId, entity.scale).group;
  }

  const path = entityAssetPath(entity);
  if (!path) return new THREE.Group();
  const model = cloneAsset(path);
  return normalizeToHeight(model, entity.scale, entity.kind === "npc");
}

function applyEntityTransform(object: THREE.Object3D, entity: LevelEntity): void {
  object.position.set(entity.position.x, entity.position.y, entity.position.z);
  object.rotation.y = entity.rotationY;
}

function buildCollider(entity: LevelEntity, object: THREE.Object3D): Collider | null {
  if (entity.kind === "npc") return null;
  if (entity.collider) {
    return {
      x: entity.position.x,
      z: entity.position.z,
      hw: entity.collider.hw,
      hd: entity.collider.hd,
      name: entity.name ?? entity.assetId,
    };
  }

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  if (size.x < 0.15 || size.z < 0.15) return null;
  return {
    x: center.x,
    z: center.z,
    hw: size.x / 2,
    hd: size.z / 2,
    name: entity.name ?? entity.assetId,
  };
}

export class MapScene {
  private scene: THREE.Scene;
  private root = new THREE.Group();
  private surfaceRoot = new THREE.Group();
  private pathRoot = new THREE.Group();
  private waterRoot = new THREE.Group();
  private entityRoot = new THREE.Group();
  private entityObjects = new Map<string, THREE.Group>();
  private entityColliders = new Map<string, Collider>();
  private pathTiles = new Map<string, THREE.Mesh>();
  private waterTiles = new Map<string, THREE.Mesh>();
  private waterColliders = new Map<string, Collider>();
  private groundMesh = createGround(1);
  private tileGeometry = new THREE.PlaneGeometry(1, 1);
  private pathMaterial = new THREE.MeshStandardMaterial({ color: COL.path });
  private waterMaterial = new THREE.MeshStandardMaterial({ color: COL.water, transparent: true, opacity: 0.8 });

  mapSize = 90;
  level: LevelData | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async load(level: LevelData): Promise<void> {
    this.level = normalizeLevel(level);
    this.mapSize = this.level.metadata.size;
    await preloadLevelAssets(this.level);
    this.clear();

    this.root.add(this.surfaceRoot, this.entityRoot);
    this.groundMesh = createGround(this.mapSize);
    this.root.add(this.groundMesh);
    this.root.add(createBoundary(this.mapSize));

    this.rebuildSurfaces();
    for (const entity of this.level.entities) {
      await this.addEntity(entity);
    }

    this.scene.add(this.root);
  }

  getGround(): THREE.Mesh {
    return this.groundMesh;
  }

  addOverlay(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  getColliders(): Collider[] {
    return [...this.entityColliders.values(), ...this.waterColliders.values()];
  }

  getEntityObjects(): THREE.Group[] {
    return [...this.entityObjects.values()];
  }

  getEntityObject(id: string): THREE.Group | null {
    return this.entityObjects.get(id) ?? null;
  }

  async addEntity(entity: LevelEntity): Promise<void> {
    await preloadEntityAsset(entity);
    const object = buildEntityObject(entity);
    object.userData.entityId = entity.id;
    applyEntityTransform(object, entity);
    this.entityRoot.add(object);
    this.entityObjects.set(entity.id, object);

    const collider = buildCollider(entity, object);
    if (collider) this.entityColliders.set(entity.id, collider);
  }

  async upsertEntity(entity: LevelEntity, rebuild = false): Promise<void> {
    const object = this.entityObjects.get(entity.id);
    if (!object || rebuild) {
      this.removeEntity(entity.id);
      await this.addEntity(entity);
      return;
    }

    applyEntityTransform(object, entity);
    const collider = buildCollider(entity, object);
    if (collider) this.entityColliders.set(entity.id, collider);
    else this.entityColliders.delete(entity.id);
  }

  setEntityTransform(entity: LevelEntity): void {
    const object = this.entityObjects.get(entity.id);
    if (!object) return;
    applyEntityTransform(object, entity);
  }

  removeEntity(id: string): void {
    const object = this.entityObjects.get(id);
    if (object) {
      this.entityRoot.remove(object);
      this.entityObjects.delete(id);
    }
    this.entityColliders.delete(id);
  }

  updateSurfaces(level: LevelData): void {
    this.level = normalizeLevel(level);
    this.mapSize = this.level.metadata.size;
    this.rebuildSurfaces();
  }

  updateSurfaceCell(type: "path" | "water", cell: GridCell, filled: boolean): void {
    if (!this.level) return;
    if (filled) {
      if (this.getSurfaceTile(type, cell)) return;
      this.addSurfaceTile(type, cell);
      return;
    }
    this.removeSurfaceTile(type, cell);
  }

  private rebuildSurfaces(): void {
    this.surfaceRoot.clear();
    this.pathRoot = new THREE.Group();
    this.waterRoot = new THREE.Group();
    this.surfaceRoot.add(this.pathRoot, this.waterRoot);
    this.pathTiles.clear();
    this.waterTiles.clear();
    this.waterColliders.clear();
    if (!this.level) return;
    for (const type of ["path", "water"] as const) {
      const layer = this.level.surfaceLayers[type];
      for (let row = 0; row < layer.rows.length; row++) {
        for (let col = 0; col < layer.rows[row].length; col++) {
          const cell = { col, row };
          if (!getCell(layer, cell)) continue;
          this.addSurfaceTile(type, cell);
        }
      }
    }
  }

  private clear(): void {
    this.scene.remove(this.root);
    this.root = new THREE.Group();
    this.surfaceRoot = new THREE.Group();
    this.pathRoot = new THREE.Group();
    this.waterRoot = new THREE.Group();
    this.entityRoot = new THREE.Group();
    this.entityObjects.clear();
    this.entityColliders.clear();
    this.pathTiles.clear();
    this.waterTiles.clear();
    this.waterColliders.clear();
  }

  private getSurfaceTile(type: "path" | "water", cell: GridCell): THREE.Mesh | undefined {
    return (type === "path" ? this.pathTiles : this.waterTiles).get(cellKey(cell));
  }

  private addSurfaceTile(type: "path" | "water", cell: GridCell): void {
    const key = cellKey(cell);
    const tiles = type === "path" ? this.pathTiles : this.waterTiles;
    if (tiles.has(key)) return;
    const tile = new THREE.Mesh(this.tileGeometry, type === "path" ? this.pathMaterial : this.waterMaterial);
    const pos = cellToWorld(cell, this.mapSize);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(pos.x, type === "path" ? 0.02 : 0.05, pos.z);
    tiles.set(key, tile);
    (type === "path" ? this.pathRoot : this.waterRoot).add(tile);
    if (type === "water") {
      this.waterColliders.set(key, { x: pos.x, z: pos.z, hw: 0.5, hd: 0.5, name: "water" });
    }
  }

  private removeSurfaceTile(type: "path" | "water", cell: GridCell): void {
    const key = cellKey(cell);
    const tiles = type === "path" ? this.pathTiles : this.waterTiles;
    const tile = tiles.get(key);
    if (!tile) return;
    (type === "path" ? this.pathRoot : this.waterRoot).remove(tile);
    tiles.delete(key);
    if (type === "water") this.waterColliders.delete(key);
  }
}
