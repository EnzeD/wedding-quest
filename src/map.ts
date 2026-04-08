import * as THREE from "three";
import { AmbientEffects } from "./ambient-effects.ts";
import { cloneAsset, normalizeToHeight } from "./assets.ts";
import { normalizeGrassColor } from "./color-grading.ts";
import { CONFIG } from "./config.ts";
import { cellKey, cellToWorld, getCell, normalizeLevel, type GridCell } from "./level-grid.ts";
import { entityAssetPath, preloadEntityAsset, preloadLevelAssets } from "./level-assets.ts";
import { buildKenney } from "./kenney-buildings.ts";
import { createMenuAnchorHelper } from "./menu-anchor-helper.ts";
import { PastureGrass } from "./grass.ts";
import { NpcAnimationController } from "./npc-animations.ts";
import { DEFAULT_SURFACE_SETTINGS, normalizeSurfaceSettings } from "./surface-settings.ts";
import { SurfaceLayerRenderer } from "./surface-layer-renderer.ts";
import { TerrainGround } from "./terrain-ground.ts";
import { applyToonMaterials } from "./shaders/toon.ts";
import { createWaterMaterial } from "./shaders/water.ts";
import type { Collider, LevelData, LevelEntity, LevelSurfaceSettings } from "./types.ts";

interface MapLoadOptions {
  includePickups?: boolean;
  includeHelpers?: boolean;
}

const COL = {
  ground: 0x41a479,
  path: 0xf0c59d,
  water: 0x5f74ca,
  hedge: 0x3da679,
};

function getWaterSurfaceHeight(depth: number): number {
  return 0.035 - depth * 0.18;
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
  if (entity.kind === "prefab") { const built = buildKenney(entity.assetId, entity.scale).group; applyToonMaterials(built); return built; }
  if (entity.kind === "menu-anchor") return createMenuAnchorHelper();
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
  if (entity.kind === "npc" || entity.kind === "pickup" || entity.kind === "menu-anchor") return null;
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
  private waterColliders = new Map<string, Collider>();
  private grass = new PastureGrass();
  private ambientEffects = new AmbientEffects();
  private npcAnimations = new NpcAnimationController();
  private ground = new TerrainGround(COL.ground);
  private pathSurface = new SurfaceLayerRenderer({ color: COL.path, opacity: 0.96, bleed: 0.08, radius: 0.3, y: 0.02 });
  private waterSurface = new SurfaceLayerRenderer({
    color: COL.water,
    opacity: 0.85,
    bleed: 0.12,
    radius: 0.3,
    y: getWaterSurfaceHeight(DEFAULT_SURFACE_SETTINGS.water.depth),
    customMaterial: createWaterMaterial({ color: COL.water, opacity: 0.92, sunDirection: CONFIG.sky.sunDirection }),
  });
  private includePickups = true;
  private includeHelpers = false;
  private waterViewDir = new THREE.Vector3();
  mapSize = 90;
  level: LevelData | null = null;
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  async load(level: LevelData, options: MapLoadOptions = {}): Promise<void> {
    this.level = normalizeLevel(level);
    this.includePickups = options.includePickups ?? true;
    this.includeHelpers = options.includeHelpers ?? false;
    this.mapSize = this.level.metadata.size;
    await preloadLevelAssets(this.level, this.includePickups, this.includeHelpers);
    this.clear();
    this.root.add(this.surfaceRoot, this.entityRoot);
    this.root.add(this.ground.object);
    this.root.add(createBoundary(this.mapSize));
    this.grass.attachTo(this.root);
    this.updateSurfaceSettings(this.level.surfaceSettings);
    this.pathSurface.attachTo(this.surfaceRoot);
    this.waterSurface.attachTo(this.surfaceRoot);
    this.rebuildSurfaces();
    for (const entity of this.level.entities) {
      if (!this.includePickups && entity.kind === "pickup") continue;
      if (!this.includeHelpers && entity.kind === "menu-anchor") continue;
      await this.addEntity(entity, false);
    }
    this.rebuildPastureGrass();
    this.applyGrassColor(this.level.grassColor);
    this.scene.add(this.root);
  }
  getGround(): THREE.Mesh {
    return this.ground.object;
  }
  addOverlay(object: THREE.Object3D): void { this.scene.add(object); }
  update(dt: number): void {
    this.ambientEffects.update(dt);
    this.npcAnimations.update(dt);
  }
  updateWaterView(camera: THREE.Camera): void {
    const uniforms = this.waterSurface.getShaderUniforms();
    if (!uniforms?.uViewForward) return;
    camera.getWorldDirection(this.waterViewDir);
    const viewForward = uniforms.uViewForward.value as THREE.Vector2;
    viewForward.set(this.waterViewDir.x, this.waterViewDir.z);
    if (viewForward.lengthSq() < 1e-6) {
      viewForward.set(0, -1);
      return;
    }
    viewForward.normalize();
  }
  getColliders(): Collider[] {
    return [...this.entityColliders.values(), ...this.waterColliders.values()];
  }
  getEntityObjects(): THREE.Group[] {
    return [...this.entityObjects.values()];
  }
  getEntityObject(id: string): THREE.Group | null { return this.entityObjects.get(id) ?? null; }
  async addEntity(entity: LevelEntity, syncGrass = true): Promise<void> {
    await preloadEntityAsset(entity);
    const object = buildEntityObject(entity);
    object.userData.entityId = entity.id;
    applyEntityTransform(object, entity);
    this.entityRoot.add(object);
    this.entityObjects.set(entity.id, object);
    this.ambientEffects.registerEntity(entity, object);
    this.npcAnimations.register(entity, object);
    const collider = buildCollider(entity, object);
    if (collider) this.entityColliders.set(entity.id, collider);
    if (syncGrass) this.rebuildPastureGrass();
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
    this.rebuildPastureGrass();
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
    this.ambientEffects.removeEntity(id);
    this.npcAnimations.remove(id);
    this.entityColliders.delete(id);
    this.rebuildPastureGrass();
  }
  updateSurfaces(level: LevelData): void {
    this.level = normalizeLevel(level);
    this.mapSize = this.level.metadata.size;
    this.rebuildSurfaces();
    this.rebuildPastureGrass();
  }
  updateSurfaceCell(type: "path" | "water", cell: GridCell, filled: boolean): void {
    if (!this.level) return;
    const layer = this.level.surfaceLayers[type];
    if (getCell(layer, cell) === filled) return;
    const row = layer.rows[cell.row] ?? "";
    layer.rows[cell.row] = `${row.slice(0, cell.col)}${filled ? "1" : "0"}${row.slice(cell.col + 1)}`;
    this.redrawSurface(type);
    this.rebuildPastureGrass();
  }
  updateGrassInteractor(position: THREE.Vector3): void {
    this.grass.updateInteractor(position);
  }
  updateGrassColor(color: string): void {
    if (!this.level) return;
    this.level.grassColor = normalizeGrassColor(color);
    this.applyGrassColor(this.level.grassColor);
  }
  updateSurfaceSettings(settings: LevelSurfaceSettings): void {
    if (!this.level) return;
    this.level.surfaceSettings = normalizeSurfaceSettings(settings);
    this.pathSurface.updateShape(this.level.surfaceSettings.path.bleed, this.level.surfaceSettings.path.radius);
    this.waterSurface.updateShape(this.level.surfaceSettings.water.bleed, this.level.surfaceSettings.water.radius);
    this.waterSurface.setHeight(getWaterSurfaceHeight(this.level.surfaceSettings.water.depth));
    this.rebuildSurfaces();
    this.rebuildPastureGrass();
  }
  private rebuildSurfaces(): void {
    if (!this.level) return;
    this.redrawSurface("path");
    this.redrawSurface("water");
  }
  private clear(): void {
    this.scene.remove(this.root);
    this.root = new THREE.Group();
    this.surfaceRoot = new THREE.Group();
    this.entityRoot = new THREE.Group();
    this.entityObjects.clear();
    this.entityColliders.clear();
    this.waterColliders.clear();
    this.ambientEffects.dispose();
    this.ambientEffects = new AmbientEffects();
    this.npcAnimations.clear();
    this.npcAnimations = new NpcAnimationController();
    this.grass.dispose();
    this.grass = new PastureGrass();
    this.ground = new TerrainGround(COL.ground); this.pathSurface = new SurfaceLayerRenderer({ color: COL.path, opacity: 0.96, bleed: DEFAULT_SURFACE_SETTINGS.path.bleed, radius: DEFAULT_SURFACE_SETTINGS.path.radius, y: 0.02 });
    this.waterSurface = new SurfaceLayerRenderer({
      color: COL.water,
      opacity: 0.85,
      bleed: DEFAULT_SURFACE_SETTINGS.water.bleed,
      radius: DEFAULT_SURFACE_SETTINGS.water.radius,
      y: getWaterSurfaceHeight(DEFAULT_SURFACE_SETTINGS.water.depth),
      customMaterial: createWaterMaterial({ color: COL.water, opacity: 0.92, sunDirection: CONFIG.sky.sunDirection }),
    });
  }
  private redrawSurface(type: "path" | "water"): void {
    if (!this.level) return;
    if (type === "path") { this.pathSurface.render(this.mapSize, this.level.surfaceLayers.path); return; }
    this.waterSurface.render(this.mapSize, this.level.surfaceLayers.water);
    this.ground.render(this.mapSize, this.level.surfaceLayers.water, this.level.surfaceSettings.water);
    this.rebuildWaterColliders();
  }
  private rebuildWaterColliders(): void {
    if (!this.level) return;
    this.waterColliders.clear();
    const layer = this.level.surfaceLayers.water;
    for (let row = 0; row < layer.rows.length; row++) {
      for (let col = 0; col < layer.rows[row].length; col++) {
        const cell = { col, row };
        if (!getCell(layer, cell)) continue;
        const pos = cellToWorld(cell, this.mapSize);
        this.waterColliders.set(cellKey(cell), { x: pos.x, z: pos.z, hw: 0.5, hd: 0.5, name: "water" });
      }
    }
  }
  private rebuildPastureGrass(): void {
    if (this.level) this.grass.rebuild(this.level, [...this.entityColliders.values()]);
  }
  private applyGrassColor(color: string): void {
    this.grass.setColor(color);
  }
}
