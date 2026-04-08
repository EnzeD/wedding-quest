import * as THREE from "three";

interface DissolveState {
  uniform: { value: number };
}

const states = new WeakMap<THREE.Material, DissolveState>();

function patchMaterial(material: THREE.Material): DissolveState {
  const existing = states.get(material);
  if (existing) return existing;

  const uniform = { value: 0 };
  const state: DissolveState = { uniform };
  states.set(material, state);

  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(material, shader, renderer);
    shader.uniforms.uDissolve = uniform;

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
       uniform float uDissolve;
       float dissolveHash(vec2 p) {
         return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
       }`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `#include <dithering_fragment>
       if (uDissolve > 0.0) {
         float n = dissolveHash(floor(gl_FragCoord.xy * 0.5));
         if (n < uDissolve) discard;
         if (n < uDissolve + 0.08) {
           gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.65, 0.2), 0.85);
         }
       }`,
    );
  };
  material.transparent = true;
  material.needsUpdate = true;
  return state;
}

function collectMaterials(root: THREE.Object3D): THREE.Material[] {
  const out: THREE.Material[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) if (m) out.push(m);
  });
  return out;
}

export function startDissolve(
  root: THREE.Object3D,
  duration: number,
  onDone: () => void,
): void {
  const mats = collectMaterials(root);
  const stateList = mats.map(patchMaterial);
  const start = performance.now();

  function step(): void {
    const t = Math.min(1, (performance.now() - start) / (duration * 1000));
    for (const s of stateList) s.uniform.value = t;
    if (t < 1) requestAnimationFrame(step);
    else onDone();
  }
  step();
}
