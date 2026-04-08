import * as THREE from "three";

export class VirtualJoystick {
  input = new THREE.Vector2(0, 0);
  private active = false;
  private touchId: number | null = null;
  private maxRadius = 55;
  private container: HTMLDivElement;
  private knob: HTMLDivElement;
  private actionButtons: HTMLDivElement;
  private sprintButton: HTMLButtonElement;
  private jumpButton: HTMLButtonElement;
  private sprintPointerId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private touchButtonsEnabled =
    window.matchMedia("(hover: none), (pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0;

  // Keyboard support for desktop
  private keys = { up: false, down: false, left: false, right: false, sprint: false };
  private sprintPressed = false;
  private jumpQueued = false;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "joystick";
    this.container.style.cssText = `
      position: fixed; bottom: 60px; left: 30px;
      width: 140px; height: 140px; border-radius: 50%;
      background: rgba(71,74,88,0.4);
      border: 2px solid rgba(109,115,138,0.5);
      touch-action: none; z-index: 100;
    `;

    this.knob = document.createElement("div");
    this.knob.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      width: 56px; height: 56px;
      margin-left: -28px; margin-top: -28px;
      border-radius: 50%;
      background: rgba(157,164,196,0.6);
      pointer-events: none;
    `;

    this.container.appendChild(this.knob);
    document.body.appendChild(this.container);
    this.actionButtons = document.createElement("div");
    this.actionButtons.className = "action-buttons";

    this.sprintButton = this.createActionButton("action-button--sprint", "Sprint");
    this.jumpButton = this.createActionButton("action-button--jump", "Jump");
    this.actionButtons.append(this.sprintButton, this.jumpButton);
    document.body.appendChild(this.actionButtons);

    this.container.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    document.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    document.addEventListener("touchend", (e) => this.onTouchEnd(e));

    document.addEventListener("keydown", (e) => this.onKey(e, true));
    document.addEventListener("keyup", (e) => this.onKey(e, false));

    this.sprintButton.addEventListener("pointerdown", this.onSprintPointerDown);
    this.sprintButton.addEventListener("pointerup", this.onSprintPointerEnd);
    this.sprintButton.addEventListener("pointercancel", this.onSprintPointerEnd);
    this.jumpButton.addEventListener("pointerdown", this.onJumpPointerDown);
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    let handled = true;
    switch (e.code) {
      case "ArrowUp": case "KeyW": this.keys.up = down; break;
      case "ArrowDown": case "KeyS": this.keys.down = down; break;
      case "ArrowLeft": case "KeyA": this.keys.left = down; break;
      case "ArrowRight": case "KeyD": this.keys.right = down; break;
      case "ShiftLeft": case "ShiftRight": this.keys.sprint = down; break;
      case "Space":
        if (down && !e.repeat) this.jumpQueued = true;
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    if (!this.active) this.updateKeyboardInput();
  }

  private updateKeyboardInput(): void {
    const x = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const y = (this.keys.up ? -1 : 0) + (this.keys.down ? 1 : 0);
    const len = Math.sqrt(x * x + y * y);
    this.input.set(len > 0 ? x / len : 0, len > 0 ? y / len : 0);
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
    this.updateTouch(touch.clientX, touch.clientY);
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.active) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        e.preventDefault();
        this.updateTouch(touch.clientX, touch.clientY);
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

  private updateTouch(clientX: number, clientY: number): void {
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

  private createActionButton(modifier: string, label: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = `action-button ${modifier}`;
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.innerHTML = `
      <span class="action-button-icon" aria-hidden="true"></span>
      <span class="action-button-label">${label}</span>
    `;
    return button;
  }

  private onSprintPointerDown = (event: PointerEvent): void => {
    if (this.sprintPointerId !== null) return;
    this.sprintPointerId = event.pointerId;
    this.sprintPressed = true;
    this.sprintButton.classList.add("pressed");
    this.sprintButton.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  private onSprintPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.sprintPointerId) return;
    this.sprintPressed = false;
    this.sprintPointerId = null;
    this.sprintButton.classList.remove("pressed");
    if (this.sprintButton.hasPointerCapture(event.pointerId)) {
      this.sprintButton.releasePointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  private onJumpPointerDown = (event: PointerEvent): void => {
    this.jumpQueued = true;
    event.preventDefault();
  };

  isSprinting(): boolean {
    return this.keys.sprint || this.sprintPressed;
  }

  consumeJump(): boolean {
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return jump;
  }

  private resetActions(): void {
    if (this.sprintPointerId !== null && this.sprintButton.hasPointerCapture(this.sprintPointerId)) {
      this.sprintButton.releasePointerCapture(this.sprintPointerId);
    }
    this.sprintPressed = false;
    this.sprintPointerId = null;
    this.jumpQueued = false;
    this.keys.sprint = false;
    this.sprintButton.classList.remove("pressed");
  }

  show(): void {
    this.container.style.display = "block";
    this.actionButtons.style.display = this.touchButtonsEnabled ? "flex" : "none";
  }

  hide(): void {
    this.container.style.display = "none";
    this.actionButtons.style.display = "none";
    this.active = false;
    this.touchId = null;
    this.input.set(0, 0);
    this.knob.style.transform = "translate(0px, 0px)";
    this.resetActions();
  }
}

export class FreeLookInput {
  private pointerId: number | null = null;
  private lookDelta = new THREE.Vector2(0, 0);
  private lastPointer = new THREE.Vector2(0, 0);

  constructor(private surface: HTMLElement) {
    this.surface.addEventListener("pointerdown", this.onPointerDown, { passive: false });
    this.surface.addEventListener("pointermove", this.onPointerMove, { passive: false });
    this.surface.addEventListener("pointerup", this.onPointerEnd);
    this.surface.addEventListener("pointercancel", this.onPointerEnd);
  }

  consumeDelta(target = new THREE.Vector2()): THREE.Vector2 {
    target.copy(this.lookDelta);
    this.lookDelta.set(0, 0);
    return target;
  }

  reset(): void {
    if (this.pointerId !== null && this.surface.hasPointerCapture(this.pointerId)) {
      this.surface.releasePointerCapture(this.pointerId);
    }

    this.pointerId = null;
    this.lookDelta.set(0, 0);
    this.surface.style.cursor = "";
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    this.pointerId = event.pointerId;
    this.lastPointer.set(event.clientX, event.clientY);
    this.surface.setPointerCapture(event.pointerId);

    if (event.pointerType === "mouse") {
      this.surface.style.cursor = "grabbing";
    }

    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;

    this.lookDelta.x += event.clientX - this.lastPointer.x;
    this.lookDelta.y += event.clientY - this.lastPointer.y;
    this.lastPointer.set(event.clientX, event.clientY);
    event.preventDefault();
  };

  private onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.reset();
  };
}
