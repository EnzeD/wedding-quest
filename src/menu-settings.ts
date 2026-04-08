import * as THREE from "three";
import type { LevelCameraFrame, LevelMenuSettings, LevelPosition } from "./types.ts";

export const DEFAULT_MENU_START_CAMERA: LevelCameraFrame = {
  position: { x: -17.2, y: 10.9, z: 20.4 },
  lookAt: { x: -32.4, y: 2.8, z: 10.1 },
  fov: 46,
};

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePosition(value: Partial<LevelPosition> | undefined, fallback: LevelPosition): LevelPosition {
  return {
    x: finiteOr(value?.x, fallback.x),
    y: finiteOr(value?.y, fallback.y),
    z: finiteOr(value?.z, fallback.z),
  };
}

export function normalizeMenuSettings(value?: Partial<LevelMenuSettings>): LevelMenuSettings {
  return {
    startCamera: {
      position: normalizePosition(value?.startCamera?.position, DEFAULT_MENU_START_CAMERA.position),
      lookAt: normalizePosition(value?.startCamera?.lookAt, DEFAULT_MENU_START_CAMERA.lookAt),
      fov: finiteOr(value?.startCamera?.fov, DEFAULT_MENU_START_CAMERA.fov),
    },
  };
}

export function levelPositionToVector3(position: LevelPosition, target = new THREE.Vector3()): THREE.Vector3 {
  return target.set(position.x, position.y, position.z);
}

export function vector3ToLevelPosition(vector: THREE.Vector3): LevelPosition {
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function captureMenuCameraFrame(camera: THREE.Camera, lookAt: THREE.Vector3): LevelCameraFrame {
  const perspective = camera as THREE.PerspectiveCamera;
  return {
    position: vector3ToLevelPosition(camera.position),
    lookAt: vector3ToLevelPosition(lookAt),
    fov: finiteOr(perspective.fov, DEFAULT_MENU_START_CAMERA.fov),
  };
}
