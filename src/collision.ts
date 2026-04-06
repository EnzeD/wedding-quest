import * as THREE from "three";
import { CONFIG } from "./config.ts";
import type { Collider } from "./types.ts";

export function resolveCollisions(
  position: THREE.Vector3,
  colliders: Collider[],
  mapSize: number,
): void {
  const mapHalf = mapSize / 2;
  const mapMargin = mapHalf - CONFIG.player.radius;

  // Map boundaries
  position.x = Math.max(-mapMargin, Math.min(mapMargin, position.x));
  position.z = Math.max(-mapMargin, Math.min(mapMargin, position.z));

  // AABB push-out against blocking entities and water cells
  for (const c of colliders) {
    const overlapX = (c.hw + CONFIG.player.radius) - Math.abs(position.x - c.x);
    const overlapZ = (c.hd + CONFIG.player.radius) - Math.abs(position.z - c.z);

    if (overlapX > 0 && overlapZ > 0) {
      if (overlapX < overlapZ) {
        position.x += overlapX * Math.sign(position.x - c.x);
      } else {
        position.z += overlapZ * Math.sign(position.z - c.z);
      }
    }
  }
}
