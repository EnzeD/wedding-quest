import * as THREE from "three";

export class ThirdPersonCamera {
  private camera: THREE.PerspectiveCamera;
  private distance = 10;
  private height = 6;
  private lookAtOffset = new THREE.Vector3(0, 1, 0);
  private smoothSpeed = 5;

  private freelookAngle = 0;
  private dragging = false;
  private touchId: number | null = null;
  private lastTouchX = 0;
  private sensitivity = 0.006;
  private returnSpeed = 3;

  private currentPosition = new THREE.Vector3();
  private desiredPosition = new THREE.Vector3();
  private lookAtTarget = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.setupTouch();
  }

  private setupTouch(): void {
    document.addEventListener("touchstart", (e: TouchEvent) => {
      if (this.dragging) return;

      for (const touch of e.changedTouches) {
        if (touch.clientX < window.innerWidth * 0.4 && touch.clientY > window.innerHeight * 0.5) continue;

        this.dragging = true;
        this.touchId = touch.identifier;
        this.lastTouchX = touch.clientX;
        break;
      }
    });

    document.addEventListener("touchmove", (e: TouchEvent) => {
      if (!this.dragging) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.touchId) {
          const dx = touch.clientX - this.lastTouchX;
          this.freelookAngle -= dx * this.sensitivity;
          this.lastTouchX = touch.clientX;
          break;
        }
      }
    });

    document.addEventListener("touchend", (e: TouchEvent) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.touchId) {
          this.dragging = false;
          this.touchId = null;
          break;
        }
      }
    });
  }

  update(target: THREE.Object3D, deltaTime: number): void {
    if (!this.dragging) {
      this.freelookAngle *= Math.max(0, 1 - this.returnSpeed * deltaTime);
      if (Math.abs(this.freelookAngle) < 0.01) this.freelookAngle = 0;
    }

    const angle = target.rotation.y + this.freelookAngle;

    this.desiredPosition.set(
      target.position.x - Math.sin(angle) * this.distance,
      target.position.y + this.height,
      target.position.z - Math.cos(angle) * this.distance,
    );

    this.currentPosition.lerpVectors(
      this.camera.position,
      this.desiredPosition,
      Math.min(1, this.smoothSpeed * deltaTime),
    );

    this.camera.position.copy(this.currentPosition);

    this.lookAtTarget.copy(target.position).add(this.lookAtOffset);
    this.camera.lookAt(this.lookAtTarget);
  }
}
