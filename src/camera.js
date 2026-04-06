import * as THREE from "three";

export class ThirdPersonCamera {
  constructor(camera) {
    this.camera = camera;
    this.distance = 10;
    this.height = 6;
    this.lookAtOffset = new THREE.Vector3(0, 1, 0);
    this.smoothSpeed = 5;

    // Freelook
    this.freelookAngle = 0;
    this.dragging = false;
    this.touchId = null;
    this.lastTouchX = 0;
    this.sensitivity = 0.006;
    this.returnSpeed = 3;

    this.currentPosition = new THREE.Vector3();
    this.desiredPosition = new THREE.Vector3();
    this.lookAtTarget = new THREE.Vector3();

    this.setupTouch();
  }

  setupTouch() {
    document.addEventListener("touchstart", (e) => {
      if (this.dragging) return;

      for (const touch of e.changedTouches) {
        // Ignore bottom-left quadrant (joystick)
        if (touch.clientX < window.innerWidth * 0.4 && touch.clientY > window.innerHeight * 0.5) continue;

        this.dragging = true;
        this.touchId = touch.identifier;
        this.lastTouchX = touch.clientX;
        break;
      }
    });

    document.addEventListener("touchmove", (e) => {
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

    document.addEventListener("touchend", (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.touchId) {
          this.dragging = false;
          this.touchId = null;
          break;
        }
      }
    });
  }

  update(target, deltaTime) {
    // Return freelook to 0 when not dragging
    if (!this.dragging) {
      this.freelookAngle *= Math.max(0, 1 - this.returnSpeed * deltaTime);
      if (Math.abs(this.freelookAngle) < 0.01) this.freelookAngle = 0;
    }

    const angle = target.rotation.y + this.freelookAngle;

    this.desiredPosition.set(
      target.position.x - Math.sin(angle) * this.distance,
      target.position.y + this.height,
      target.position.z - Math.cos(angle) * this.distance
    );

    this.currentPosition.lerpVectors(
      this.camera.position,
      this.desiredPosition,
      Math.min(1, this.smoothSpeed * deltaTime)
    );

    this.camera.position.copy(this.currentPosition);

    this.lookAtTarget.copy(target.position).add(this.lookAtOffset);
    this.camera.lookAt(this.lookAtTarget);
  }
}
