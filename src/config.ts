import * as THREE from "three";

export const CONFIG = {
  map: {
    size: 90,
    groundColor: 0x41a479,
  },
  camera: {
    height: 30,
    offset: new THREE.Vector3(0, 30, 15),
    lookAheadDistance: 3,
    smoothSpeed: 5,
    fov: 50,
    near: 0.1,
    far: 200,
    freeLook: {
      rotateSpeed: 0.005,
      minPitch: THREE.MathUtils.degToRad(40),
      maxPitch: THREE.MathUtils.degToRad(78),
    },
  },
  player: {
    speed: 7,
    radius: 0.4,
    height: 1.8,
  },
  lighting: {
    ambient: 0.5,
    hemi: 0.6,
    dir: 1.0,
    shadowMapSize: 1024,
  },
  sky: {
    radius: 180,
    topColor: 0x6fa8d9,
    horizonColor: 0xf6c39a,
    bottomColor: 0xffead3,
    sunColor: 0xfff0b8,
    cloudColor: 0xfffaf0,
    cloudShadowColor: 0xdccfbf,
    sunDirection: new THREE.Vector3(12, 24, 8).normalize(),
  },
  match: {
    totalTime: 600,
    warningTime: 60,
    criticalTime: 30,
  },
  items: {
    floatHeight: 1.2,
    floatAmplitude: 0.3,
    floatSpeed: 2,
    rotateSpeed: 1.5,
    pickupRadius: 1.5,
    glowColor: 0xffb349,
  },
  ambient: {
    waterWheelSpeed: 0.35,
    smoke: {
      particleCount: 9,
      riseSpeed: 0.24,
      spread: 0.13,
      height: 1.45,
      baseScale: 0.28,
      opacity: 0.4,
    },
  },
  render: {
    maxDpr: 2,
    antialias: true,
  },
} as const;
