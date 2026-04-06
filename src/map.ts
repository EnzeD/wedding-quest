import * as THREE from "three";
import { cloneAsset, normalizeToHeight } from "./assets.ts";
import { cellToWorld, getCell, normalizeLevel } from "./level-grid.ts";
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
  private entityRoot = new THREE.Group();
  private entityObjects = new Map<string, THREE.Group>();
  private entityColliders = new Map<string, Collider>();
  private waterColliders: Collider[] = [];
  private groundMesh = createGround(1);

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
    return [...this.entityColliders.values(), ...this.waterColliders];
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

  private rebuildSurfaces(): void {
    while (this.surfaceRoot.children.length > 0) this.surfaceRoot.remove(this.surfaceRoot.children[0]);
    this.waterColliders = [];
    if (!this.level) return;

    const pathMaterial = new THREE.MeshStandardMaterial({ color: COL.path });
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: COL.water,
      transparent: true,
      opacity: 0.8,
    });

    for (const [type, y, material] of [
      ["path", 0.02, pathMaterial],
      ["water", 0.05, waterMaterial],
    ] as const) {
      const group = new THREE.Group();
      const layer = this.level.surfaceLayers[type];
      for (let row = 0; row < layer.rows.length; row++) {
        for (let col = 0; col < layer.rows[row].length; col++) {
          if (!getCell(layer, { col, row })) continue;
          const tile = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
          const pos = cellToWorld({ col, row }, this.mapSize);
          tile.rotation.x = -Math.PI / 2;
          tile.position.set(pos.x, y, pos.z);
          group.add(tile);

          if (type === "water") {
            this.waterColliders.push({ x: pos.x, z: pos.z, hw: 0.5, hd: 0.5, name: "water" });
          }
        }
      }
      this.surfaceRoot.add(group);
    }
  }

  private clear(): void {
    this.scene.remove(this.root);
    this.root = new THREE.Group();
    this.surfaceRoot = new THREE.Group();
    this.entityRoot = new THREE.Group();
    this.entityObjects.clear();
    this.entityColliders.clear();
    this.waterColliders = [];
  }
}
