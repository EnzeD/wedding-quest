import * as THREE from "three";

export class VirtualJoystick {
  input = new THREE.Vector2(0, 0);
  private active = false;
  private touchId: number | null = null;

  private maxRadius = 55;

  private container: HTMLDivElement;
  private knob: HTMLDivElement;

  private centerX = 0;
  private centerY = 0;

  constructor() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 30px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      touch-action: none;
      z-index: 10;
    `;

    this.knob = document.createElement("div");
    this.knob.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 56px;
      height: 56px;
      margin-left: -28px;
      margin-top: -28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      pointer-events: none;
    `;

    this.container.appendChild(this.knob);
    document.body.appendChild(this.container);

    this.container.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    document.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener("touchend", (e) => this.onTouchEnd(e));
  }

  private onTouchStart(e: TouchEvent): void {
    if (this.active) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    this.active = true;

    const rect = this.container.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;

    this.updateInput(touch.clientX, touch.clientY);
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.active) return;

    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        e.preventDefault();
        this.updateInput(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        this.active = false;
        this.touchId = null;
        this.input.set(0, 0);
        this.knob.style.transform = "translate(0px, 0px)";
        break;
      }
    }
  }

  private updateInput(clientX: number, clientY: number): void {
    let dx = clientX - this.centerX;
    let dy = clientY - this.centerY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }

    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;

    this.input.x = dx / this.maxRadius;
    this.input.y = dy / this.maxRadius;
  }

  dispose(): void {
    this.container.remove();
  }
}
