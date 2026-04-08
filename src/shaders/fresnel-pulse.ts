import * as THREE from "three";
import { sharedTime } from "./clock.ts";

interface FresnelOptions {
  color: THREE.ColorRepresentation;
  power?: number;
  speed?: number;
}

// Patches a material so its silhouette glows with a pulsing rim light.
// Cheap because it lives entirely inside the main pass via onBeforeCompile.
export function applyFresnelPulse(
  root: THREE.Object3D,
  opts: FresnelOptions,
): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) if (m) patchMaterial(m, opts);
  });
}

function patchMaterial(material: THREE.Material, opts: FresnelOptions): void {
  const tagged = material.userData as { fresnelApplied?: boolean };
  if (tagged.fresnelApplied) return;
  tagged.fresnelApplied = true;

  const colorVec = new THREE.Color(opts.color);
  const power = opts.power ?? 2.5;
  const speed = opts.speed ?? 3.0;

  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(material, shader, renderer);
    shader.uniforms.uTime = sharedTime;
    shader.uniforms.uPulseColor = { value: colorVec };
    shader.uniforms.uPulsePower = { value: power };
    shader.uniforms.uPulseSpeed = { value: speed };

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
       varying vec3 vFresnelN;
       varying vec3 vFresnelV;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <fog_vertex>",
      `#include <fog_vertex>
       vFresnelN = normalize(normalMatrix * normal);
       vFresnelV = normalize(-mvPosition.xyz);`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
       uniform float uTime;
       uniform vec3 uPulseColor;
       uniform float uPulsePower;
       uniform float uPulseSpeed;
       varying vec3 vFresnelN;
       varying vec3 vFresnelV;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `#include <dithering_fragment>
       float fres = pow(1.0 - max(dot(vFresnelN, vFresnelV), 0.0), uPulsePower);
       float pulse = 0.5 + 0.5 * sin(uTime * uPulseSpeed);
       gl_FragColor.rgb += uPulseColor * fres * (0.35 + 0.65 * pulse);`,
    );
  };
  material.needsUpdate = true;
}
