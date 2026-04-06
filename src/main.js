import * as THREE from "three";
import { Player } from "./player.js";
import { ThirdPersonCamera } from "./camera.js";
import { VirtualJoystick } from "./controls.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 40, 80);

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
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x7cba5c });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Trees (placeholder)
const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c });
const leavesGeo = new THREE.ConeGeometry(1.5, 3, 6);
const leavesMat = new THREE.MeshStandardMaterial({ color: 0x3a7d2c });

function createTree(x, z) {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 3.5;
  leaves.castShadow = true;
  group.add(leaves);

  group.position.set(x, 0, z);
  const s = 0.8 + Math.random() * 0.6;
  group.scale.set(s, s, s);
  scene.add(group);
}

const treePositions = [
  [-8, -12], [12, -8], [-15, 5], [7, 15], [-20, -20],
  [18, 3], [-5, 22], [25, -15], [-22, 12], [10, -25],
  [-30, -5], [5, 30], [20, 20], [-12, -30], [30, -25],
  [-25, 25], [15, -35], [-35, 15], [35, 10], [-10, 35],
];
for (const [x, z] of treePositions) {
  createTree(x, z);
}

// Player
const player = new Player(scene);

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
  cameraController.update(player.mesh, deltaTime);

  renderer.render(scene, camera);
}

animate();
