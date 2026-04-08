import * as THREE from "three";
import { getCell } from "./level-grid.ts";
import type { LevelSurfaceLayer } from "./types.ts";

const BASE_PX_PER_CELL = 28;
const MAX_TEXTURE_SIZE = 4096;

interface SurfaceStyle {
  color: number;
  opacity: number;
  bleed: number;
  radius: number;
  y: number;
  customMaterial?: THREE.ShaderMaterial;
}

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

export class SurfaceLayerRenderer {
  private style: SurfaceStyle;
  private canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d");
  private texture = new THREE.CanvasTexture(this.canvas);
  private material: THREE.Material;
  private mesh: THREE.Mesh;
  private size = 1;
  private pxPerCell = BASE_PX_PER_CELL;

  constructor(style: SurfaceStyle) {
    if (!this.ctx) throw new Error("Canvas 2D unavailable");
    this.style = style;
    this.texture.colorSpace = THREE.NoColorSpace;
    this.texture.anisotropy = 2;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    if (style.customMaterial) {
      this.material = style.customMaterial;
      const uniforms = (style.customMaterial as THREE.ShaderMaterial).uniforms;
      if (uniforms?.uAlphaMap) uniforms.uAlphaMap.value = this.texture;
    } else {
      const std = new THREE.MeshStandardMaterial({
        transparent: true,
        depthWrite: false,
      });
      std.color.setHex(style.color);
      std.opacity = style.opacity;
      std.alphaMap = this.texture;
      this.material = std;
    }

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = style.y;
    this.mesh.receiveShadow = !style.customMaterial;
    this.mesh.renderOrder = 2;
    this.resize(1);
  }

  attachTo(parent: THREE.Object3D): void {
    parent.add(this.mesh);
  }

  render(size: number, layer: LevelSurfaceLayer): void {
    if (size !== this.size) this.resize(size);
    this.draw(layer);
  }

  updateShape(bleed: number, radius: number): void {
    this.style.bleed = bleed;
    this.style.radius = radius;
  }

  private resize(size: number): void {
    this.size = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const desiredPxPerCell = Math.round(BASE_PX_PER_CELL * dpr);
    this.pxPerCell = Math.max(12, Math.min(desiredPxPerCell, Math.floor(MAX_TEXTURE_SIZE / size)));
    this.canvas.width = size * this.pxPerCell;
    this.canvas.height = size * this.pxPerCell;
    const uniforms = (this.material as THREE.ShaderMaterial).uniforms;
    if (uniforms?.uTexelSize) {
      uniforms.uTexelSize.value.set(1 / this.canvas.width, 1 / this.canvas.height);
    }
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(size, size);
  }

  private draw(layer: LevelSurfaceLayer): void {
    const ctx = this.ctx!;
    const cellPx = this.pxPerCell;
    const bleed = cellPx * this.style.bleed;
    const radius = Math.max(2, cellPx * this.style.radius);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#ffffff";

    let hasFill = false;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (!getCell(layer, { col, row })) continue;
        hasFill = true;
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

    this.mesh.visible = hasFill;
    if (!hasFill) {
      this.texture.needsUpdate = true;
      return;
    }
    this.texture.needsUpdate = true;
  }
}
