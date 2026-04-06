import * as THREE from "three";
import { CONFIG } from "./config.ts";

export class TopDownCamera {
  private camera: THREE.PerspectiveCamera;
  private currentPosition = new THREE.Vector3();
  private lookAtTarget = new THREE.Vector3();

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.camera.near,
      CONFIG.camera.far,
    );
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(target: THREE.Object3D, velocity: THREE.Vector2, dt: number): void {
    // Camera position: above and slightly behind the player
    const desiredPos = new THREE.Vector3(
      target.position.x + CONFIG.camera.offset.x,
      CONFIG.camera.offset.y,
      target.position.z + CONFIG.camera.offset.z,
    );

    this.currentPosition.lerp(desiredPos, Math.min(1, CONFIG.camera.smoothSpeed * dt));
    this.camera.position.copy(this.currentPosition);

    // Look ahead based on movement direction
    this.lookAtTarget.set(
      target.position.x + velocity.x * CONFIG.camera.lookAheadDistance,
      0,
      target.position.z + velocity.y * CONFIG.camera.lookAheadDistance,
    );
    this.camera.lookAt(this.lookAtTarget);
  }

  /** Snap camera to target instantly (no lerp). Used on game start. */
  snapTo(target: THREE.Object3D): void {
    this.currentPosition.set(
      target.position.x + CONFIG.camera.offset.x,
      CONFIG.camera.offset.y,
      target.position.z + CONFIG.camera.offset.z,
    );
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(target.position.x, 0, target.position.z);
  }
}
