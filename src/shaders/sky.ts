import * as THREE from "three";

interface LowPolySkyOptions {
  radius: number;
  top: THREE.ColorRepresentation;
  horizon: THREE.ColorRepresentation;
  bottom: THREE.ColorRepresentation;
  sun: THREE.ColorRepresentation;
  cloud: THREE.ColorRepresentation;
  cloudShadow: THREE.ColorRepresentation;
  sunDirection: THREE.Vector3;
}

interface CloudPuff {
  angle: number;
  angularSpeed: number;
  distance: number;
  height: number;
  baseScale: number;
  stretch: number;
  depth: number;
  lift: number;
  orbitOffset: number;
  tilt: number;
}

const TAU = Math.PI * 2;

function createSkyDome(opts: Pick<LowPolySkyOptions, "radius" | "top" | "horizon" | "bottom" | "sun" | "sunDirection">): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(opts.radius, 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(opts.top) },
      uHorizon: { value: new THREE.Color(opts.horizon) },
      uBottom: { value: new THREE.Color(opts.bottom) },
      uSunColor: { value: new THREE.Color(opts.sun) },
      uSunDirection: { value: opts.sunDirection.clone().normalize() },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz - cameraPosition;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uBottom;
      uniform vec3 uSunColor;
      uniform vec3 uSunDirection;
      void main() {
        vec3 dir = normalize(vWorldPos);
        float horizonMix = smoothstep(-0.22, 0.18, dir.y);
        float topMix = smoothstep(0.02, 0.92, dir.y);
        vec3 base = mix(uBottom, uHorizon, horizonMix);
        base = mix(base, uTop, topMix);

        float haze = pow(1.0 - min(abs(dir.y), 1.0), 3.0);
        base += uHorizon * haze * 0.12;

        float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
        float sunHalo = pow(sunDot, 18.0);
        float sunCore = smoothstep(0.994, 0.9992, sunDot);
        vec3 color = base + uSunColor * sunHalo * 0.18;
        color = mix(color, uSunColor, sunCore * 0.92);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "sky-dome";
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return mesh;
}

function createCloudPuffs(count: number): CloudPuff[] {
  return Array.from({ length: count }, (_, index) => {
    const spread = index / count;
    return {
      angle: spread * TAU + (index % 2 === 0 ? 0.18 : -0.22),
      angularSpeed: 0.012 + (index % 3) * 0.003,
      distance: 38 + spread * 34 + (index % 2) * 2.5,
      height: 10.5 + (index % 4) * 1.8,
      baseScale: 4.8 + (index % 3) * 1.1,
      stretch: 1.25 + (index % 2) * 0.22,
      depth: 0.95 + (index % 3) * 0.08,
      lift: (index % 2 === 0 ? 0.24 : -0.28) + (Math.floor(index / 3) % 2) * 0.08,
      orbitOffset: (index % 3) * 1.6 - 1.4,
      tilt: (index % 2 === 0 ? 1 : -1) * 0.08,
    };
  });
}

export class LowPolySky {
  readonly object = new THREE.Group();
  private dome: THREE.Mesh;
  private clouds: THREE.InstancedMesh;
  private cloudShadows: THREE.InstancedMesh;
  private puffs: CloudPuff[];
  private tempMatrix = new THREE.Matrix4();
  private tempPosition = new THREE.Vector3();
  private tempScale = new THREE.Vector3();
  private tempQuaternion = new THREE.Quaternion();
  private tempEuler = new THREE.Euler();
  private shadowOffset: THREE.Vector3;

  constructor(opts: LowPolySkyOptions) {
    this.object.name = "sky-rig";
    this.object.frustumCulled = false;

    this.dome = createSkyDome(opts);
    this.object.add(this.dome);

    this.puffs = createCloudPuffs(12);
    const cloudGeo = new THREE.IcosahedronGeometry(1, 0);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: opts.cloud,
      fog: false,
      depthWrite: false,
      depthTest: false,
    });
    const shadowMat = new THREE.MeshBasicMaterial({
      color: opts.cloudShadow,
      fog: false,
      depthWrite: false,
      depthTest: false,
    });

    this.clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, this.puffs.length);
    this.cloudShadows = new THREE.InstancedMesh(cloudGeo, shadowMat, this.puffs.length);
    this.clouds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cloudShadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.clouds.frustumCulled = false;
    this.cloudShadows.frustumCulled = false;
    this.clouds.renderOrder = -920;
    this.cloudShadows.renderOrder = -930;
    this.object.add(this.cloudShadows, this.clouds);

    this.shadowOffset = opts.sunDirection.clone().normalize().multiplyScalar(-0.9);
    this.shadowOffset.y -= 0.55;
    this.updateClouds(0);
  }

  update(cameraPosition: THREE.Vector3, dt: number): void {
    this.object.position.copy(cameraPosition);
    this.updateClouds(dt);
  }

  private updateClouds(dt: number): void {
    for (let i = 0; i < this.puffs.length; i++) {
      const puff = this.puffs[i];
      puff.angle = (puff.angle + puff.angularSpeed * dt) % TAU;

      const sin = Math.sin(puff.angle);
      const cos = Math.cos(puff.angle);
      const bob = Math.sin(puff.angle * 2.3 + i * 0.7) * 0.55;
      const radial = puff.distance + Math.sin(puff.angle * 1.7 + i) * 1.8;

      this.tempPosition.set(
        cos * radial - sin * puff.orbitOffset,
        puff.height + bob + puff.lift,
        sin * radial + cos * puff.orbitOffset,
      );
      this.tempEuler.set(puff.tilt, -puff.angle + Math.PI * 0.5, 0);
      this.tempQuaternion.setFromEuler(this.tempEuler);
      this.tempScale.set(puff.baseScale * puff.stretch, puff.baseScale, puff.baseScale * puff.depth);
      this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
      this.clouds.setMatrixAt(i, this.tempMatrix);

      this.tempPosition.addScaledVector(this.shadowOffset, puff.baseScale * 0.22);
      this.tempScale.multiplyScalar(1.04);
      this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
      this.cloudShadows.setMatrixAt(i, this.tempMatrix);
    }

    this.clouds.instanceMatrix.needsUpdate = true;
    this.cloudShadows.instanceMatrix.needsUpdate = true;
  }
}
