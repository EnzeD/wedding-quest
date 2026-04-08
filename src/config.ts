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
  render: {
    maxDpr: 2,
    antialias: true,
  },
} as const;
