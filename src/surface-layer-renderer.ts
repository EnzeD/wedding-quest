import * as THREE from "three";
import { getCell } from "./level-grid.ts";
import type { LevelSurfaceLayer } from "./types.ts";

const BASE_PX_PER_CELL = 28;
const MAX_TEXTURE_SIZE = 4096;

interface SurfaceStyle {
  color: number;
  opacity: number;
  bleed: number;
  blur: number;
  y: number;
}

export class SurfaceLayerRenderer {
  private style: SurfaceStyle;
  private canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d");
  private maskCanvas = document.createElement("canvas");
  private maskCtx = this.maskCanvas.getContext("2d");
  private texture = new THREE.CanvasTexture(this.canvas);
  private material = new THREE.MeshStandardMaterial({
    transparent: true,
    depthWrite: false,
  });
  private mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
  private size = 1;
  private pxPerCell = BASE_PX_PER_CELL;

  constructor(style: SurfaceStyle) {
    if (!this.ctx || !this.maskCtx) throw new Error("Canvas 2D unavailable");
    this.style = style;
    this.texture.colorSpace = THREE.NoColorSpace;
    this.texture.anisotropy = 2;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.material.color.setHex(style.color);
    this.material.opacity = style.opacity;
    this.material.alphaMap = this.texture;
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = style.y;
    this.mesh.receiveShadow = true;
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

  private resize(size: number): void {
    this.size = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const desiredPxPerCell = Math.round(BASE_PX_PER_CELL * dpr);
    this.pxPerCell = Math.max(12, Math.min(desiredPxPerCell, Math.floor(MAX_TEXTURE_SIZE / size)));
    this.canvas.width = size * this.pxPerCell;
    this.canvas.height = size * this.pxPerCell;
    this.maskCanvas.width = this.canvas.width;
    this.maskCanvas.height = this.canvas.height;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(size, size);
  }

  private draw(layer: LevelSurfaceLayer): void {
    const ctx = this.ctx!;
    const maskCtx = this.maskCtx!;
    const cellPx = this.pxPerCell;
    const bleed = cellPx * this.style.bleed;
    const blur = Math.max(1, cellPx * this.style.blur);

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    ctx.imageSmoothingEnabled = true;
    maskCtx.imageSmoothingEnabled = true;
    maskCtx.fillStyle = "#ffffff";

    let hasFill = false;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (!getCell(layer, { col, row })) continue;
        hasFill = true;
        maskCtx.fillRect(col * cellPx - bleed, row * cellPx - bleed, cellPx + bleed * 2, cellPx + bleed * 2);
      }
    }

    this.mesh.visible = hasFill;
    if (!hasFill) {
      this.texture.needsUpdate = true;
      return;
    }
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(this.maskCanvas, 0, 0);
    ctx.filter = "none";
    this.texture.needsUpdate = true;
  }
}
