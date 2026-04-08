import * as THREE from "three";
import { sharedTime } from "./clock.ts";

interface WaterMaterialOptions {
  color: THREE.ColorRepresentation;
  opacity?: number;
}

// ShaderMaterial drop-in for the water surface layer.
// Reads the existing canvas alpha texture (set later via uAlphaMap) and
// renders stylized body bands plus Wind Waker-inspired foam contours.
export function createWaterMaterial(opts: WaterMaterialOptions): THREE.ShaderMaterial {
  const base = new THREE.Color(opts.color);
  const deep = base.clone().multiplyScalar(0.48);
  const foam = base.clone().lerp(new THREE.Color(0xffffff), 0.78);
  const shadowFoam = base.clone().lerp(new THREE.Color(0x17307a), 0.55);
  const rim = base.clone().lerp(new THREE.Color(0xbfe6ff), 0.42);

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: sharedTime,
      uColor: { value: base },
      uDeepColor: { value: deep },
      uFoamColor: { value: foam },
      uShadowFoamColor: { value: shadowFoam },
      uRimColor: { value: rim },
      uAlphaMap: { value: null },
      uOpacity: { value: opts.opacity ?? 0.9 },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uDeepColor;
      uniform vec3 uFoamColor;
      uniform vec3 uShadowFoamColor;
      uniform vec3 uRimColor;
      uniform sampler2D uAlphaMap;
      uniform float uOpacity;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float contour(float field, float center, float width) {
        return 1.0 - smoothstep(width, width * 2.0, abs(field - center));
      }

      void main() {
        float alpha = texture2D(uAlphaMap, vUv).r;
        if (alpha < 0.01) discard;

        vec2 world = vWorldPos.xz;
        float t1 = uTime * 0.08;
        float t2 = uTime * 0.13;

        vec2 warp = vec2(
          sin(world.x * 0.22 + world.y * 0.14 + t1) + sin(world.y * 0.31 - t2),
          cos(world.y * 0.19 - world.x * 0.12 - t1) + cos(world.x * 0.27 + t2)
        ) * 0.18;

        float bodyField =
          noise(world * 0.11 - warp * 0.8 + vec2(-t1 * 0.6, t1 * 0.3)) * 0.62 +
          noise(world * 0.24 + warp * 1.4 + vec2(t2 * 0.35, -t1 * 0.55)) * 0.38;
        float bands = floor(bodyField * 3.0) / 2.0;
        vec3 col = mix(uDeepColor, uColor, bands);

        vec2 foamUv = world * 0.2 + warp * 1.3;
        float foamField =
          noise(foamUv + vec2(t1 * 0.8, -t1 * 0.55)) * 0.7 +
          noise(foamUv * 1.9 - vec2(t2 * 0.45, t1 * 0.35)) * 0.3;
        float foamMask = contour(foamField, 0.62, 0.045);
        float darkFoamMask = contour(foamField, 0.44, 0.05) * 0.7;

        // Coastline foam is derived from the blurred alpha mask already produced by the canvas pass.
        float shoreline = smoothstep(0.12, 0.36, alpha) * (1.0 - smoothstep(0.4, 0.82, alpha));
        float shorelinePulse = 0.85 + 0.15 * sin((world.x + world.y) * 0.75 + uTime * 1.6);
        shoreline *= shorelinePulse;
        float innerShore = smoothstep(0.3, 0.56, alpha) * (1.0 - smoothstep(0.56, 0.92, alpha));

        col = mix(col, uShadowFoamColor, max(darkFoamMask, innerShore * 0.35));
        col = mix(col, uFoamColor, max(foamMask, shoreline));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
        col = mix(col, uRimColor, fresnel * 0.18);

        gl_FragColor = vec4(col, alpha * uOpacity);
      }
    `,
  });
}
