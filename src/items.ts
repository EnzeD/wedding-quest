import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { cloneAsset, normalizeToHeight, getManifest } from "./assets.ts";
import type { ItemDef, Character } from "./types.ts";

const NICOLAS_ITEMS: Omit<ItemDef, "position">[] = [
  { id: "boutonniere", name: "Boutonniere", points: 50 },
  { id: "boutons-manchettes", name: "Boutons de manchettes", points: 50 },
  { id: "cravate", name: "Cravate", points: 100 },
  { id: "montre", name: "Montre", points: 200 },
  { id: "chaussures", name: "Chaussures", points: 300 },
  { id: "voeux", name: "Les voeux", points: 300 },
  { id: "pantalon", name: "Pantalon", points: 400 },
  { id: "chemise", name: "Chemise", points: 400 },
  { id: "veste", name: "Veste", points: 400 },
  { id: "alliances", name: "Les alliances", points: 1000 },
];

const SARAH_ITEMS: Omit<ItemDef, "position">[] = [
  { id: "bracelet", name: "Bracelet", points: 50 },
  { id: "lentilles", name: "Lentilles", points: 50 },
  { id: "boucles-oreilles", name: "Boucles d'oreilles", points: 100 },
  { id: "maquillage", name: "Trousse de maquillage", points: 100 },
  { id: "voile", name: "Voile", points: 200 },
  { id: "voeux", name: "Les voeux", points: 300 },
  { id: "chaussures", name: "Chaussures", points: 400 },
  { id: "bouquet", name: "Bouquet", points: 400 },
  { id: "robe", name: "Robe", points: 500 },
  { id: "alliances", name: "Les alliances", points: 1000 },
];

// Spawn positions spread across the map
const SPAWN_POSITIONS: [number, number][] = [
  [-5, 5], [10, 8], [5, 20], [-8, -3], [20, 5],
  [-15, 18], [25, -15], [-20, -10], [14, -5], [30, -20],
];

export class ItemManager {
  private items: { def: ItemDef; mesh: THREE.Group }[] = [];
  private scene: THREE.Scene;
  private time = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(character: Character): ItemDef[] {
    this.clear();
    const defs = character === "sarah" ? SARAH_ITEMS : NICOLAS_ITEMS;
    const m = getManifest();
    const pickupPath = m.items.pickup;

    const allDefs: ItemDef[] = [];

    for (let i = 0; i < defs.length; i++) {
      const [x, z] = SPAWN_POSITIONS[i % SPAWN_POSITIONS.length];
      const position = new THREE.Vector3(x, CONFIG.items.floatHeight, z);
      const def: ItemDef = { ...defs[i], position };
      allDefs.push(def);

      let mesh: THREE.Group;
      if (pickupPath) {
        mesh = cloneAsset(pickupPath);
        mesh = normalizeToHeight(mesh, 0.8);
      } else {
        mesh = this.createPlaceholderItem();
      }

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
      mesh.add(ring);

      mesh.position.copy(position);
      this.scene.add(mesh);
      this.items.push({ def, mesh });
    }

    return allDefs;
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
  }

  checkCollection(playerPos: THREE.Vector3): ItemDef | null {
    for (let i = 0; i < this.items.length; i++) {
      const { def, mesh } = this.items[i];
      const dx = playerPos.x - def.position.x;
      const dz = playerPos.z - def.position.z;
      if (dx * dx + dz * dz < CONFIG.items.pickupRadius * CONFIG.items.pickupRadius) {
        this.scene.remove(mesh);
        this.items.splice(i, 1);
        return def;
      }
    }
    return null;
  }

  clear(): void {
    for (const { mesh } of this.items) this.scene.remove(mesh);
    this.items = [];
    this.time = 0;
  }

  get remaining(): number {
    return this.items.length;
  }
}
