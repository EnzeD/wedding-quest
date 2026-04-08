import * as THREE from "three";

export interface MenuCameraPose {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
  drift?: number;
}

interface CameraTransition {
  elapsed: number;
  duration: number;
  fromPosition: THREE.Vector3;
  fromLookAt: THREE.Vector3;
  fromFov: number;
  to: MenuCameraPose;
  onComplete?: () => void;
}

function eased(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class MenuCameraController {
  private currentPose: MenuCameraPose;
  private transition: CameraTransition | null = null;
  private time = 0;

  constructor(private camera: THREE.PerspectiveCamera, initialPose: MenuCameraPose) {
    this.currentPose = this.clonePose(initialPose);
    this.applyPose(this.currentPose, 0);
  }

  snapTo(pose: MenuCameraPose): void {
    this.transition = null;
    this.currentPose = this.clonePose(pose);
    this.applyPose(this.currentPose, 0);
  }

  transitionTo(pose: MenuCameraPose, duration: number, onComplete?: () => void): void {
    this.transition = {
      elapsed: 0,
      duration,
      fromPosition: this.camera.position.clone(),
      fromLookAt: this.currentPose.lookAt.clone(),
      fromFov: this.camera.fov,
      to: this.clonePose(pose),
      onComplete,
    };
    this.currentPose = this.clonePose(pose);
  }

  update(dt: number): void {
    this.time += dt;

    if (!this.transition) {
      this.applyPose(this.currentPose, this.currentPose.drift ?? 0);
      return;
    }

    this.transition.elapsed += dt;
    const t = THREE.MathUtils.clamp(this.transition.elapsed / this.transition.duration, 0, 1);
    const k = eased(t);
    const position = this.transition.fromPosition.clone().lerp(this.transition.to.position, k);
    const lookAt = this.transition.fromLookAt.clone().lerp(this.transition.to.lookAt, k);
    const fov = THREE.MathUtils.lerp(
      this.transition.fromFov,
      this.transition.to.fov ?? this.transition.fromFov,
      k,
    );
    this.applyRaw(position, lookAt, fov);

    if (t < 1) return;

    const completed = this.transition;
    this.transition = null;
    this.applyPose(this.currentPose, this.currentPose.drift ?? 0);
    completed.onComplete?.();
  }

  private applyPose(pose: MenuCameraPose, drift: number): void {
    const position = pose.position.clone();
    const lookAt = pose.lookAt.clone();

    if (drift > 0) {
      position.x += Math.sin(this.time * 0.55) * drift;
      position.y += Math.cos(this.time * 0.4) * drift * 0.28;
      position.z += Math.cos(this.time * 0.48) * drift * 0.7;
      lookAt.x += Math.cos(this.time * 0.38) * drift * 0.12;
      lookAt.y += Math.sin(this.time * 0.44) * drift * 0.06;
    }

    this.applyRaw(position, lookAt, pose.fov ?? this.camera.fov);
  }

  private applyRaw(position: THREE.Vector3, lookAt: THREE.Vector3, fov: number): void {
    this.camera.position.copy(position);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(lookAt);
  }

  private clonePose(pose: MenuCameraPose): MenuCameraPose {
    return {
      position: pose.position.clone(),
      lookAt: pose.lookAt.clone(),
      fov: pose.fov,
      drift: pose.drift,
    };
  }
}
