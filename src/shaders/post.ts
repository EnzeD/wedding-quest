import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { DEFAULT_COLOR_GRADING, normalizeColorGrading } from "../color-grading.ts";
import type { ColorGradingSettings } from "../types.ts";

// Single fullscreen color-grade pass: contrast, saturation, warm tint, vignette.
// Cheap enough for mid-range mobile (one RT + one shader pass on top of the scene).
const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uContrast: { value: DEFAULT_COLOR_GRADING.contrast },
    uSaturation: { value: DEFAULT_COLOR_GRADING.saturation },
    uWarmth: { value: DEFAULT_COLOR_GRADING.warmth },
    uVignette: { value: DEFAULT_COLOR_GRADING.vignette },
    uLift: { value: DEFAULT_COLOR_GRADING.lift },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uWarmth;
    uniform float uVignette;
    uniform float uLift;
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      col.rgb += uLift;
      col.rgb = (col.rgb - 0.5) * uContrast + 0.5;
      float gray = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb = mix(vec3(gray), col.rgb, uSaturation);
      col.r += uWarmth;
      col.b -= uWarmth * 0.6;
      vec2 d = vUv - 0.5;
      float vig = 1.0 - dot(d, d) * uVignette * 2.4;
      col.rgb *= clamp(vig, 0.0, 1.0);
      gl_FragColor = vec4(clamp(col.rgb, 0.0, 1.0), 1.0);
    }
  `,
};

export interface PostComposerController {
  composer: EffectComposer;
  getColorGrading: () => ColorGradingSettings;
  setColorGrading: (value: Partial<ColorGradingSettings>) => ColorGradingSettings;
}

export function createPostComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): PostComposerController {
  const composer = new EffectComposer(renderer);
  const colorGradePass = new ShaderPass(ColorGradeShader);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(colorGradePass);
  composer.addPass(new OutputPass());

  const applyColorGrading = (value: Partial<ColorGradingSettings>): ColorGradingSettings => {
    const next = normalizeColorGrading(value);
    colorGradePass.uniforms.uContrast.value = next.contrast;
    colorGradePass.uniforms.uSaturation.value = next.saturation;
    colorGradePass.uniforms.uWarmth.value = next.warmth;
    colorGradePass.uniforms.uVignette.value = next.vignette;
    colorGradePass.uniforms.uLift.value = next.lift;
    return next;
  };

  return {
    composer,
    getColorGrading: () => normalizeColorGrading({
      contrast: colorGradePass.uniforms.uContrast.value as number,
      saturation: colorGradePass.uniforms.uSaturation.value as number,
      warmth: colorGradePass.uniforms.uWarmth.value as number,
      vignette: colorGradePass.uniforms.uVignette.value as number,
      lift: colorGradePass.uniforms.uLift.value as number,
    }),
    setColorGrading: applyColorGrading,
  };
}
