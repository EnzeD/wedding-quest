import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { cloneAsset, normalizeToHeight } from "./assets.ts";
import { getPickupDefinition } from "./item-definitions.ts";
import { pickupAssetPath } from "./level-assets.ts";
import { addOutline } from "./shaders/outline.ts";
import { applyFresnelPulse } from "./shaders/fresnel-pulse.ts";
import { startDissolve } from "./shaders/dissolve.ts";
import type { ItemDef, Character, LevelData } from "./types.ts";

interface SpawnableItemDef extends ItemDef {
  scale: number;
  rotationY: number;
}

function getPlacedItemDefs(level: LevelData, character: Character): SpawnableItemDef[] {
  return level.entities
    .filter((entity) => entity.kind === "pickup")
    .flatMap((entity) => {
      const def = getPickupDefinition(entity.assetId);
      if (!def || def.character !== character) return [];
      return [{
        id: def.id,
        name: def.name,
        points: def.points,
        position: new THREE.Vector3(
          entity.position.x,
          entity.position.y,
          entity.position.z,
        ),
        scale: entity.scale,
        rotationY: entity.rotationY,
      }];
    });
}

export class ItemManager {
  private items: { def: ItemDef; mesh: THREE.Group }[] = [];
  private dissolving: { mesh: THREE.Group; time: number }[] = [];
  private scene: THREE.Scene;
  private time = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(character: Character, level: LevelData): ItemDef[] {
    this.clear();
    const defs = getPlacedItemDefs(level, character);

    const allDefs: ItemDef[] = [];

    for (const source of defs) {
      const position = new THREE.Vector3(
        source.position.x,
        source.position.y + CONFIG.items.floatHeight,
        source.position.z,
      );
      const def: ItemDef = { id: source.id, name: source.name, points: source.points, position };
      allDefs.push(def);

      const mesh = this.createPickupMesh(source.id, source.scale);
      addOutline(mesh, 1.06, 0x101010);
      applyFresnelPulse(mesh, { color: CONFIG.items.glowColor, power: 2.4, speed: 3.2 });

      // Glow effect ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.7, 16),
        new THREE.MeshBasicMaterial({
          color: CONFIG.items.glowColor,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.1;
      ring.userData.isOutline = true;
      mesh.add(ring);

      mesh.position.copy(position);
      mesh.rotation.y = source.rotationY;
      this.scene.add(mesh);
      this.items.push({ def, mesh });
    }

    return allDefs;
  }

  private createPickupMesh(assetId: string, targetHeight: number): THREE.Group {
    const pickupPath = pickupAssetPath(assetId);
    if (pickupPath) return normalizeToHeight(cloneAsset(pickupPath), Math.max(0.2, targetHeight || 0.8));
    return this.createPlaceholderItem();
  }

  private createPlaceholderItem(): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: CONFIG.items.glowColor,
      emissive: CONFIG.items.glowColor,
      emissiveIntensity: 0.3,
    });
    group.add(new THREE.Mesh(geo, mat));
    return group;
  }

  update(dt: number): void {
    this.time += dt;
    for (const { def, mesh } of this.items) {
      mesh.position.y =
        def.position.y + Math.sin(this.time * CONFIG.items.floatSpeed) * CONFIG.items.floatAmplitude;
      mesh.rotation.y += CONFIG.items.rotateSpeed * dt;
    }
    for (const entry of this.dissolving) {
      entry.time += dt;
      entry.mesh.rotation.y += CONFIG.items.rotateSpeed * 2 * dt;
      entry.mesh.position.y += dt * 0.6;
    }
  }

  checkCollection(playerPos: THREE.Vector3): ItemDef | null {
    for (let i = 0; i < this.items.length; i++) {
      const { def, mesh } = this.items[i];
      const dx = playerPos.x - def.position.x;
      const dz = playerPos.z - def.position.z;
      if (dx * dx + dz * dz < CONFIG.items.pickupRadius * CONFIG.items.pickupRadius) {
        this.items.splice(i, 1);
        this.startDissolveOn(mesh);
        return def;
      }
    }
    return null;
  }

  private startDissolveOn(mesh: THREE.Group): void {
    const entry = { mesh, time: 0 };
    this.dissolving.push(entry);
    startDissolve(mesh, 0.45, () => {
      this.scene.remove(mesh);
      const idx = this.dissolving.indexOf(entry);
      if (idx >= 0) this.dissolving.splice(idx, 1);
    });
  }

  clear(): void {
    for (const { mesh } of this.items) this.scene.remove(mesh);
    for (const { mesh } of this.dissolving) this.scene.remove(mesh);
    this.items = [];
    this.dissolving = [];
    this.time = 0;
  }

  get remaining(): number {
    return this.items.length;
  }
}
