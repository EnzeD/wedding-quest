import * as THREE from "three";
import { cellToWorld, getCell } from "./level-grid.ts";
import { createGrassMaterial } from "./shaders/grass.ts";
import type { Collider, LevelData } from "./types.ts";

const BLADE_HEIGHT = 0.62;
const BLADE_WIDTH = 0.12;
const BLADE_SEGMENTS = 4;
const MOBILE_MAX_BLADES = 18000;
const DESKTOP_MAX_BLADES = 32000;
const MOBILE_DENSITY = 3;
const DESKTOP_DENSITY = 5;
const EDGE_MARGIN = 0.72;
const COLLIDER_PADDING = 0.28;
const OPEN_EDGE_PADDING = 0.06;
const BLOCKED_EDGE_PADDING = 0.36;
const BLOCKED_CORNER_PADDING = 0.2;

function seeded(seed: number): number {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function isBlockedCell(level: LevelData, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= level.metadata.size || row >= level.metadata.size) return true;
  const cell = { col, row };
  return getCell(level.surfaceLayers.path, cell) || getCell(level.surfaceLayers.water, cell);
}

function createBladeGeometry(): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(BLADE_WIDTH, BLADE_HEIGHT, 1, BLADE_SEGMENTS);
  geometry.translate(0, BLADE_HEIGHT / 2, 0);

  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  const identity = new THREE.Quaternion();
  const bendTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.28, 0.08, 0.14));

  for (let index = 0; index < positions.count; index++) {
    vertex.fromBufferAttribute(positions, index);
    const bend = new THREE.Quaternion().slerpQuaternions(identity, bendTarget, vertex.y / BLADE_HEIGHT);
    vertex.applyQuaternion(bend);
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function createInstanceGeometry(level: LevelData, colliders: Collider[]): THREE.InstancedBufferGeometry {
  const base = createBladeGeometry();
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(base.getIndex());
  geometry.setAttribute("position", base.getAttribute("position"));
  geometry.setAttribute("normal", base.getAttribute("normal"));
  geometry.setAttribute("uv", base.getAttribute("uv"));

  const eligibleCells: { col: number; row: number }[] = [];
  for (let row = 0; row < level.metadata.size; row++) {
    for (let col = 0; col < level.metadata.size; col++) {
      if (!isBlockedCell(level, col, row)) eligibleCells.push({ col, row });
    }
  }

  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const density = coarse ? MOBILE_DENSITY : DESKTOP_DENSITY;
  const maxBlades = coarse ? MOBILE_MAX_BLADES : DESKTOP_MAX_BLADES;
  const targetCount = Math.min(maxBlades, eligibleCells.length * density);
  const perCell = Math.max(1, Math.floor(targetCount / Math.max(eligibleCells.length, 1)));
  const extra = Math.max(0, targetCount - perCell * eligibleCells.length);

  const offsets: number[] = [];
  const scales: number[] = [];
  const yaws: number[] = [];
  const leans: number[] = [];
  const tones: number[] = [];
  const half = level.metadata.size / 2;

  for (let cellIndex = 0; cellIndex < eligibleCells.length; cellIndex++) {
    const cell = eligibleCells[cellIndex];
    const world = cellToWorld(cell, level.metadata.size);
    const leftClear = isBlockedCell(level, cell.col - 1, cell.row) ? -0.5 + BLOCKED_EDGE_PADDING : -0.5 + OPEN_EDGE_PADDING;
    const rightClear = isBlockedCell(level, cell.col + 1, cell.row) ? 0.5 - BLOCKED_EDGE_PADDING : 0.5 - OPEN_EDGE_PADDING;
    const topClear = isBlockedCell(level, cell.col, cell.row - 1) ? -0.5 + BLOCKED_EDGE_PADDING : -0.5 + OPEN_EDGE_PADDING;
    const bottomClear = isBlockedCell(level, cell.col, cell.row + 1) ? 0.5 - BLOCKED_EDGE_PADDING : 0.5 - OPEN_EDGE_PADDING;
    const bladeCount = perCell + (cellIndex < extra ? 1 : 0);

    for (let slot = 0; slot < bladeCount; slot++) {
      let placed = false;
      for (let attempt = 0; attempt < 3 && !placed; attempt++) {
        const seed = cellIndex * 29.13 + slot * 7.37 + attempt * 13.17;
        const x = world.x + THREE.MathUtils.lerp(leftClear, rightClear, seeded(seed + 0.11));
        const z = world.z + THREE.MathUtils.lerp(topClear, bottomClear, seeded(seed + 1.47));
        if (Math.abs(x) > half - EDGE_MARGIN || Math.abs(z) > half - EDGE_MARGIN) continue;
        if (colliders.some((collider) => (
          x >= collider.x - collider.hw - COLLIDER_PADDING &&
          x <= collider.x + collider.hw + COLLIDER_PADDING &&
          z >= collider.z - collider.hd - COLLIDER_PADDING &&
          z <= collider.z + collider.hd + COLLIDER_PADDING
        ))) {
          continue;
        }
        if (isBlockedCell(level, cell.col - 1, cell.row - 1) && x < world.x - BLOCKED_CORNER_PADDING && z < world.z - BLOCKED_CORNER_PADDING) continue;
        if (isBlockedCell(level, cell.col + 1, cell.row - 1) && x > world.x + BLOCKED_CORNER_PADDING && z < world.z - BLOCKED_CORNER_PADDING) continue;
        if (isBlockedCell(level, cell.col - 1, cell.row + 1) && x < world.x - BLOCKED_CORNER_PADDING && z > world.z + BLOCKED_CORNER_PADDING) continue;
        if (isBlockedCell(level, cell.col + 1, cell.row + 1) && x > world.x + BLOCKED_CORNER_PADDING && z > world.z + BLOCKED_CORNER_PADDING) continue;

        offsets.push(x, 0.015, z);
        scales.push(0.82 + seeded(seed + 2.31) * 0.58);
        yaws.push(seeded(seed + 3.17) * Math.PI * 2);
        leans.push((seeded(seed + 4.07) - 0.5) * 2);
        tones.push(seeded(seed + 5.19));
        placed = true;
      }
    }
  }

  geometry.setAttribute("offset", new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
  geometry.setAttribute("scale", new THREE.InstancedBufferAttribute(new Float32Array(scales), 1));
  geometry.setAttribute("yaw", new THREE.InstancedBufferAttribute(new Float32Array(yaws), 1));
  geometry.setAttribute("lean", new THREE.InstancedBufferAttribute(new Float32Array(leans), 1));
  geometry.setAttribute("tone", new THREE.InstancedBufferAttribute(new Float32Array(tones), 1));
  geometry.instanceCount = scales.length;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, BLADE_HEIGHT / 2, 0), level.metadata.size);
  return geometry;
}

export class PastureGrass {
  private mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial> | null = null;
  private root = new THREE.Group();

  attachTo(parent: THREE.Object3D): void {
    parent.add(this.root);
  }

  rebuild(level: LevelData, colliders: Collider[]): void {
    this.disposeMesh();

    const geometry = createInstanceGeometry(level, colliders);
    if (geometry.instanceCount === 0) {
      geometry.dispose();
      return;
    }

    const material = createGrassMaterial(level.grassColor);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = false;
    this.mesh.castShadow = false;
    this.mesh.renderOrder = 1;
    this.root.add(this.mesh);
  }

  updateInteractor(position: THREE.Vector3): void {
    this.mesh?.material.uniforms.uPlayerPosition.value.copy(position);
  }

  setColor(color: THREE.ColorRepresentation): void {
    this.mesh?.material.uniforms.uGrassColor.value.set(color);
  }

  dispose(): void {
    this.disposeMesh();
    this.root.removeFromParent();
  }

  private disposeMesh(): void {
    if (!this.mesh) return;
    this.root.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
  }
}
