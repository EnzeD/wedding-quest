import * as THREE from "three";
import { Player } from "./player.js";
import { ThirdPersonCamera } from "./camera.js";
import { VirtualJoystick } from "./controls.js";
import { buildMap } from "./map.js";
import { resolveCollisions } from "./collision.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 90);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 80;
directionalLight.shadow.camera.left = -40;
directionalLight.shadow.camera.right = 40;
directionalLight.shadow.camera.top = 40;
directionalLight.shadow.camera.bottom = -40;
scene.add(directionalLight);

// Map
const { colliders, pond } = buildMap(scene);

// Player (start near center)
const player = new Player(scene);
player.mesh.position.set(0, 0, 5);

// Camera controller
const cameraController = new ThirdPersonCamera(camera);

// Joystick
const joystick = new VirtualJoystick();

// Clock
const clock = new THREE.Clock();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = Math.min(clock.getDelta(), 0.1);

  player.update(joystick.input, deltaTime);
  resolveCollisions(player.mesh.position, colliders, pond);
  cameraController.update(player.mesh, deltaTime);

  // Shadow follows player
  directionalLight.position.set(
    player.mesh.position.x + 10,
    20,
    player.mesh.position.z + 10
  );
  directionalLight.target = player.mesh;

  renderer.render(scene, camera);
}

animate();
