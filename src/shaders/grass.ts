import * as THREE from "three";
import { sharedTime } from "./clock.ts";
import { DEFAULT_GRASS_COLOR } from "../color-grading.ts";

const FOG_COLOR = new THREE.Color(0xc5d8eb);
const SUN_DIRECTION = new THREE.Vector3(12, 24, 8).normalize();

export function createGrassMaterial(color: THREE.ColorRepresentation = DEFAULT_GRASS_COLOR): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: sharedTime,
      uPlayerPosition: { value: new THREE.Vector3(999, 0, 999) },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uGrassColor: { value: new THREE.Color(color) },
      uFogColor: { value: FOG_COLOR.clone() },
      uFogNear: { value: 55 },
      uFogFar: { value: 130 },
      uBladeHeight: { value: 0.62 },
      uWindStrength: { value: 0.09 },
      uBendRadius: { value: 1.2 },
      uBendStrength: { value: 0.38 },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uPlayerPosition;
      uniform float uBladeHeight;
      uniform float uWindStrength;
      uniform float uBendRadius;
      uniform float uBendStrength;

      attribute vec3 offset;
      attribute float scale;
      attribute float yaw;
      attribute float lean;
      attribute float tone;

      varying float vBlade;
      varying float vTone;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        float bladeMask = clamp(position.y / uBladeHeight, 0.0, 1.0);
        vec3 localPos = position;
        vec3 localNormal = normal;

        localPos.y *= scale;
        localPos.xz = rotate2d(yaw) * localPos.xz;
        localNormal.xz = rotate2d(yaw) * localNormal.xz;

        float windPhase = uTime * 1.45 + offset.x * 0.19 + offset.z * 0.23 + tone * 2.4;
        vec2 wind = vec2(
          sin(windPhase) + 0.45 * sin(windPhase * 0.57 + 1.1),
          cos(windPhase * 0.83 + 0.6)
        );
        float windMask = pow(bladeMask, 1.35);
        localPos.x += wind.x * uWindStrength * windMask;
        localPos.z += wind.y * uWindStrength * 0.72 * windMask;
        localPos.x += lean * 0.045 * windMask;
        localPos.z -= lean * 0.02 * windMask;

        vec2 away = offset.xz - uPlayerPosition.xz;
        float dist = length(away);
        vec2 awayDir = dist > 0.0001 ? away / dist : vec2(0.0, 1.0);
        float bendInfluence = 1.0 - smoothstep(uBendRadius * 0.3, uBendRadius, dist);
        float bendMask = pow(bladeMask, 1.75);
        float bendAmount = bendInfluence * uBendStrength * bendMask;
        localPos.xz += awayDir * bendAmount;
        localPos.y -= bendInfluence * 0.1 * bendMask;

        vec3 bentNormal = localNormal;
        bentNormal.xz += wind * 0.18 * windMask;
        bentNormal.xz += awayDir * bendInfluence * 0.65 * bendMask;
        bentNormal.y = max(0.2, bentNormal.y - bendInfluence * 0.35 * bendMask);

        vec3 worldPos = offset + localPos;
        vec3 worldNormal = normalize(mat3(modelMatrix) * normalize(bentNormal));

        vBlade = bladeMask;
        vTone = tone;
        vWorldPosition = (modelMatrix * vec4(worldPos, 1.0)).xyz;
        vWorldNormal = worldNormal;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDirection;
      uniform vec3 uGrassColor;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;

      varying float vBlade;
      varying float vTone;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      void main() {
        vec3 normal = normalize(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
        vec3 lightDir = normalize(uSunDirection);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);

        vec3 rootColor = uGrassColor * vec3(0.34, 0.4, 0.28);
        vec3 tipColor = mix(uGrassColor, vec3(1.0), 0.18);
        vec3 baseColor = mix(rootColor, tipColor, vBlade);
        baseColor *= mix(0.9, 1.12, vTone);

        float hemi = normal.y * 0.5 + 0.5;
        float diffuse = max(dot(normal, lightDir), 0.0);
        float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);

        vec3 color = baseColor * (0.4 + hemi * 0.35 + diffuse * 0.42);
        color += vec3(0.16, 0.2, 0.06) * rim * 0.2;

        float fogDepth = length(cameraPosition - vWorldPosition);
        float fogFactor = smoothstep(uFogNear, uFogFar, fogDepth);
        color = mix(color, uFogColor, fogFactor);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
