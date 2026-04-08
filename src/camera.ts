import * as THREE from "three";
import { CONFIG } from "./config.ts";

// Exponential smoothing factors (frame-rate independent)
const POSITION_SMOOTHING = 8.5;
const LOOK_AT_SMOOTHING = 8;

export class TopDownCamera {
  private camera: THREE.PerspectiveCamera;
  private currentPosition = new THREE.Vector3();
  private lookAtTarget = new THREE.Vector3();
  private orbitOffset = new THREE.Vector3();
  private orbitDistance = CONFIG.camera.offset.length();
  private yaw = Math.atan2(CONFIG.camera.offset.x, CONFIG.camera.offset.z);
  private pitch = Math.asin(CONFIG.camera.offset.y / this.orbitDistance);
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

  rotate(deltaX: number, deltaY: number): void {
    const { rotateSpeed, minPitch, maxPitch } = CONFIG.camera.freeLook;
    this.yaw -= deltaX * rotateSpeed;
    this.pitch = THREE.MathUtils.clamp(this.pitch + deltaY * rotateSpeed, minPitch, maxPitch);
  }

  toWorldMovement(input: THREE.Vector2, target = new THREE.Vector2()): THREE.Vector2 {
    const forwardAmount = -input.y;
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);

    target.set(
      rightX * input.x + forwardX * forwardAmount,
      rightZ * input.x + forwardZ * forwardAmount,
    );

    const lengthSq = target.lengthSq();
    if (lengthSq > 1) target.multiplyScalar(1 / Math.sqrt(lengthSq));
    return target;
  }

  update(target: THREE.Object3D, _velocity: THREE.Vector2, dt: number): void {
    const desiredPos = this.getDesiredPosition(target);

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
    this.currentPosition.copy(this.getDesiredPosition(target));
    this.lookAtTarget.copy(target.position);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(target.position.x, 0, target.position.z);
    this.initialized = true;
  }

  private getDesiredPosition(target: THREE.Object3D): THREE.Vector3 {
    const planarDistance = Math.cos(this.pitch) * this.orbitDistance;
    this.orbitOffset.set(
      Math.sin(this.yaw) * planarDistance,
      Math.sin(this.pitch) * this.orbitDistance,
      Math.cos(this.yaw) * planarDistance,
    );

    return this.orbitOffset.add(target.position);
  }
}
