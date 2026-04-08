import * as THREE from "three";
import { sharedTime } from "./clock.ts";

interface WindOptions {
  amplitude?: number;
  frequency?: number;
  swayFloor?: number;
}

// Patch a material so its vertices sway with a shared time uniform.
// Sway is gated by the vertex Y so trunks/banner poles stay anchored.
export function applyWindToMaterial(
  material: THREE.Material,
  opts: WindOptions = {},
): void {
  const tagged = material.userData as { windApplied?: boolean };
  if (tagged.windApplied) return;
  tagged.windApplied = true;

  const amplitude = opts.amplitude ?? 0.08;
  const frequency = opts.frequency ?? 1.6;
  const swayFloor = opts.swayFloor ?? 0.25;

  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(material, shader, renderer);
    shader.uniforms.uTime = sharedTime;
    shader.uniforms.uWindAmp = { value: amplitude };
    shader.uniforms.uWindFreq = { value: frequency };
    shader.uniforms.uWindFloor = { value: swayFloor };

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
       uniform float uTime;
       uniform float uWindAmp;
       uniform float uWindFreq;
       uniform float uWindFloor;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float windMask = max(transformed.y - uWindFloor, 0.0);
       float instancePhase = modelMatrix[3].x * 0.37 + modelMatrix[3].z * 0.21;
       float phase = uTime * uWindFreq + instancePhase;
       transformed.x += sin(phase) * uWindAmp * windMask;
       transformed.z += cos(phase * 0.83) * uWindAmp * 0.6 * windMask;`,
    );
  };
  material.needsUpdate = true;
}

export function applyWindToObject(
  root: THREE.Object3D,
  opts: WindOptions = {},
): void {
  const seen = new WeakSet<THREE.Material>();
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (m && !seen.has(m)) {
        seen.add(m);
        applyWindToMaterial(m, opts);
      }
    }
  });
}
