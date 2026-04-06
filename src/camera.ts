import * as THREE from "three";
import { CONFIG } from "./config.ts";

// Exponential smoothing factors (frame-rate independent)
const POSITION_SMOOTHING = 8.5;
const LOOK_AT_SMOOTHING = 8;

export class TopDownCamera {
  private camera: THREE.PerspectiveCamera;
  private currentPosition = new THREE.Vector3();
  private lookAtTarget = new THREE.Vector3();
  private initialized = false;

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

  update(target: THREE.Object3D, _velocity: THREE.Vector2, dt: number): void {
    const desiredPos = new THREE.Vector3(
      target.position.x + CONFIG.camera.offset.x,
      CONFIG.camera.offset.y,
      target.position.z + CONFIG.camera.offset.z,
    );

    if (!this.initialized) {
      this.currentPosition.copy(desiredPos);
      this.lookAtTarget.copy(target.position);
      this.initialized = true;
    }

    // Frame-rate independent exponential smoothing
    const posT = 1 - Math.exp(-POSITION_SMOOTHING * dt);
    const lookT = 1 - Math.exp(-LOOK_AT_SMOOTHING * dt);

    this.currentPosition.lerp(desiredPos, posT);
    this.camera.position.copy(this.currentPosition);

    this.lookAtTarget.lerp(target.position, lookT);
    this.camera.lookAt(this.lookAtTarget.x, 0, this.lookAtTarget.z);
  }

  snapTo(target: THREE.Object3D): void {
    this.currentPosition.set(
      target.position.x + CONFIG.camera.offset.x,
      CONFIG.camera.offset.y,
      target.position.z + CONFIG.camera.offset.z,
    );
    this.lookAtTarget.copy(target.position);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(target.position.x, 0, target.position.z);
    this.initialized = true;
  }
}
