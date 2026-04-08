import * as THREE from "three";
import { getCell } from "./level-grid.ts";
import type { LevelSurfaceLayer, LevelWaterPaintSettings } from "./types.ts";
import { DEFAULT_SURFACE_SETTINGS } from "./surface-settings.ts";

const BASE_PX_PER_CELL = 22;
const MAX_TEXTURE_SIZE = 4096;
const SEGMENTS_PER_CELL = 3;
const MAX_SEGMENTS = 240;
const SHORE_WARP_PX = 24;
const SHORE_BANK_PX = 20;
const MIN_BANK_PX = 8;
const MAX_BANK_PX = 42;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function hash2(x: number, z: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function valueNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = x - x0;
  const tz = z - z0;
  const sx = tx * tx * (3 - 2 * tx);
  const sz = tz * tz * (3 - 2 * tz);

  const n00 = hash2(x0, z0);
  const n10 = hash2(x0 + 1, z0);
  const n01 = hash2(x0, z0 + 1);
  const n11 = hash2(x0 + 1, z0 + 1);
  const nx0 = THREE.MathUtils.lerp(n00, n10, sx);
  const nx1 = THREE.MathUtils.lerp(n01, n11, sx);
  return THREE.MathUtils.lerp(nx0, nx1, sz);
}

function layeredNoise(x: number, z: number): number {
  return valueNoise(x, z) * 0.65 + valueNoise(x * 2.1 + 13.4, z * 2.1 - 4.7) * 0.35;
}

function sampleAlpha(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): number {
  const sx = THREE.MathUtils.clamp(x, 0, width - 1);
  const sy = THREE.MathUtils.clamp(y, 0, height - 1);
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const tx = sx - x0;
  const ty = sy - y0;
  const a00 = data[(y0 * width + x0) * 4 + 3] / 255;
  const a10 = data[(y0 * width + x1) * 4 + 3] / 255;
  const a01 = data[(y1 * width + x0) * 4 + 3] / 255;
  const a11 = data[(y1 * width + x1) * 4 + 3] / 255;
  const ax0 = THREE.MathUtils.lerp(a00, a10, tx);
  const ax1 = THREE.MathUtils.lerp(a01, a11, tx);
  return THREE.MathUtils.lerp(ax0, ax1, ty);
}

function sampleRingAlpha(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, radius: number): number {
  const offsets = [
    [0, 0],
    [-radius, 0],
    [radius, 0],
    [0, -radius],
    [0, radius],
    [-radius * 0.7, -radius * 0.7],
    [radius * 0.7, -radius * 0.7],
    [-radius * 0.7, radius * 0.7],
    [radius * 0.7, radius * 0.7],
  ] as const;
  let total = 0;
  for (const [dx, dy] of offsets) total += sampleAlpha(data, width, height, x + dx, y + dy);
  return total / offsets.length;
}

export class TerrainGround {
  private canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d", { willReadFrequently: true });
  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private size = 1;
  private pxPerCell = BASE_PX_PER_CELL;
  private waterSettings: LevelWaterPaintSettings = { ...DEFAULT_SURFACE_SETTINGS.water };

  constructor(color: THREE.ColorRepresentation) {
    if (!this.ctx) throw new Error("Canvas 2D unavailable");
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 1, 1),
      new THREE.MeshStandardMaterial({ color }),
    );
    this.mesh.receiveShadow = true;
    this.mesh.name = "level-ground";
    this.resize(1);
  }

  get object(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> {
    return this.mesh;
  }

  render(size: number, waterLayer: LevelSurfaceLayer, waterSettings: LevelWaterPaintSettings): void {
    if (size !== this.size) this.resize(size);
    this.waterSettings = { ...waterSettings };
    this.drawMask(waterLayer, waterSettings);
    this.applyTerrainHeights();
  }

  private resize(size: number): void {
    this.size = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const desiredPxPerCell = Math.round(BASE_PX_PER_CELL * dpr);
    this.pxPerCell = Math.max(12, Math.min(desiredPxPerCell, Math.floor(MAX_TEXTURE_SIZE / size)));
    this.canvas.width = size * this.pxPerCell;
    this.canvas.height = size * this.pxPerCell;

    const segments = Math.max(12, Math.min(size * SEGMENTS_PER_CELL, MAX_SEGMENTS));
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.mesh.geometry.rotateX(-Math.PI / 2);
  }

  private drawMask(layer: LevelSurfaceLayer, waterSettings: LevelWaterPaintSettings): void {
    const ctx = this.ctx!;
    const cellPx = this.pxPerCell;
    const bleed = cellPx * waterSettings.bleed;
    const radius = Math.max(2, cellPx * waterSettings.radius);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#ffffff";

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (!getCell(layer, { col, row })) continue;
        drawRoundedRect(
          ctx,
          col * cellPx - bleed,
          row * cellPx - bleed,
          cellPx + bleed * 2,
          cellPx + bleed * 2,
          radius,
        );
      }
    }
  }

  private applyTerrainHeights(): void {
    const geometry = this.mesh.geometry;
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const data = this.ctx!.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    const waterSettings = this.waterSettings;
    const half = this.size * 0.5;

    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index);
      const z = positions.getZ(index);
      const px = ((x + half) / this.size) * (this.canvas.width - 1);
      const py = ((z + half) / this.size) * (this.canvas.height - 1);
      const baseAlpha = sampleAlpha(data, this.canvas.width, this.canvas.height, px, py);
      const bankRadiusPx = THREE.MathUtils.clamp(SHORE_BANK_PX / waterSettings.bankSlope, MIN_BANK_PX, MAX_BANK_PX);
      const shoreField = sampleRingAlpha(data, this.canvas.width, this.canvas.height, px, py, bankRadiusPx);
      if (baseAlpha <= 0.001 && shoreField <= 0.001) {
        positions.setY(index, 0);
        continue;
      }

      const shoreBand = THREE.MathUtils.smoothstep(baseAlpha, 0.03, 0.3) * (1 - THREE.MathUtils.smoothstep(baseAlpha, 0.42, 0.92));
      const warpX = (layeredNoise(x * 0.42 + 10.1, z * 0.42 - 7.3) - 0.5) * 2;
      const warpZ = (layeredNoise(x * 0.42 - 14.7, z * 0.42 + 8.9) - 0.5) * 2;
      const warpedAlpha = sampleAlpha(
        data,
        this.canvas.width,
        this.canvas.height,
        px + warpX * SHORE_WARP_PX * waterSettings.shoreWarp * shoreBand,
        py + warpZ * SHORE_WARP_PX * waterSettings.shoreWarp * shoreBand,
      );
      const alpha = THREE.MathUtils.lerp(baseAlpha, warpedAlpha, 0.75);
      const bankMask = THREE.MathUtils.smoothstep(shoreField, 0.02, 0.24) * (1 - THREE.MathUtils.smoothstep(baseAlpha, 0.06, 0.28));
      const bankDepth = waterSettings.depth * (0.22 + waterSettings.bankSlope * 0.13) * bankMask;
      const depth = THREE.MathUtils.smoothstep(alpha, 0.04, 0.96) * waterSettings.depth;
      const bedNoise = (layeredNoise(x * 0.66 + 24.5, z * 0.66 - 15.2) - 0.5) * 2;
      const floorOffset = Math.max(0, bedNoise * waterSettings.bedVariation * THREE.MathUtils.smoothstep(alpha, 0.12, 1));
      positions.setY(index, -(bankDepth + depth + floorOffset));
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}
