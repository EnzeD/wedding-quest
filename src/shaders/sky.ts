import * as THREE from "three";

interface SkyDomeOptions {
  radius: number;
  top: THREE.ColorRepresentation;
  bottom: THREE.ColorRepresentation;
}

// Hemisphere-style gradient sky. Sits on the back side of an oversized
// sphere centered on the camera, so the player never sees its edge.
export function createSkyDome(opts: SkyDomeOptions): THREE.Mesh {
  const geo = new THREE.SphereGeometry(opts.radius, 24, 16);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(opts.top) },
      uBottom: { value: new THREE.Color(opts.bottom) },
      uOffset: { value: 0.05 },
      uExp: { value: 0.65 },
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
      uniform vec3 uBottom;
      uniform float uOffset;
      uniform float uExp;
      void main() {
        float h = normalize(vWorldPos).y;
        float t = pow(max(h + uOffset, 0.0), uExp);
        gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0);
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
