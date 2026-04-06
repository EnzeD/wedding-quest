import * as THREE from "three";
import { MAP_SIZE } from "./map.ts";
import type { Collider, PondData } from "./types.ts";

const PLAYER_RADIUS = 0.4;
const MAP_HALF = MAP_SIZE / 2;
const MAP_MARGIN = MAP_HALF - PLAYER_RADIUS;

export function resolveCollisions(
  position: THREE.Vector3,
  colliders: Collider[],
  pond: PondData,
): void {
  // Map boundaries
  position.x = Math.max(-MAP_MARGIN, Math.min(MAP_MARGIN, position.x));
  position.z = Math.max(-MAP_MARGIN, Math.min(MAP_MARGIN, position.z));

  // Building collisions (AABB push-out)
  for (const c of colliders) {
    const overlapX = (c.hw + PLAYER_RADIUS) - Math.abs(position.x - c.x);
    const overlapZ = (c.hd + PLAYER_RADIUS) - Math.abs(position.z - c.z);

    if (overlapX > 0 && overlapZ > 0) {
      if (overlapX < overlapZ) {
        position.x += overlapX * Math.sign(position.x - c.x);
      } else {
        position.z += overlapZ * Math.sign(position.z - c.z);
      }
    }
  }

  // Pond collision (ellipse)
  if (pond) {
    const dx = position.x - pond.x;
    const dz = position.z - pond.z;
    const normDist = Math.sqrt((dx / pond.rx) ** 2 + (dz / pond.rz) ** 2);

    if (normDist < 1 && normDist > 0) {
      const scale = 1 / normDist;
      position.x = pond.x + dx * scale;
      position.z = pond.z + dz * scale;
    }
  }
}
