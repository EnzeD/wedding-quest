import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { loadManifest, loadAllAssets } from "./assets.ts";
import { preloadKenneyPieces } from "./kenney-buildings.ts";
import { Player } from "./player.ts";
import { TopDownCamera } from "./camera.ts";
import { VirtualJoystick } from "./controls.ts";
import { buildMap } from "./map.ts";
import { resolveCollisions } from "./collision.ts";
import { ItemManager } from "./items.ts";
import { createHUD, updateHUD, showHUD, showNotification } from "./hud.ts";
import { showMenu, showScore, updateScoreScreen, createMenuScreen, createScoreScreen } from "./hud.ts";
import { createInitialState, resetForNewGame, addCollectedItem, computeFinalScore } from "./state.ts";
import type { Collider, PondData } from "./types.ts";

const state = createInitialState();
let colliders: Collider[] = [];
let pond: PondData;

// Camera (create first so resize() can use it)
const cameraCtrl = new TopDownCamera();
const camera = cameraCtrl.getCamera();

// Renderer
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: CONFIG.render.antialias });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.render.maxDpr));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
resize();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 120);

// Lights
const ambient = new THREE.AmbientLight(0xffffff, CONFIG.lighting.ambient);
const hemi = new THREE.HemisphereLight(0xffffff, 0x96754b, CONFIG.lighting.hemi);
const dirLight = new THREE.DirectionalLight(0xfff2d6, CONFIG.lighting.dir);
dirLight.position.set(12, 24, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(CONFIG.lighting.shadowMapSize, CONFIG.lighting.shadowMapSize);
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(ambient, hemi, dirLight);

// Player + controls
const player = new Player(scene);
player.mesh.position.set(0, 0, 5);
const joystick = new VirtualJoystick();
const items = new ItemManager(scene);
const clock = new THREE.Clock();

// HUD
createHUD();
createMenuScreen();
createScoreScreen();

window.addEventListener("resize", resize);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  cameraCtrl.resize();
}

async function init(): Promise<void> {
  await loadManifest();
  await Promise.all([loadAllAssets(), preloadKenneyPieces()]);

  const map = buildMap(scene);
  colliders = map.colliders;
  pond = map.pond;

  player.loadModel();
  cameraCtrl.snapTo(player.mesh);

  // Wire up menu buttons now that everything is ready
  document.getElementById("play-btn")!.addEventListener("click", startGame);
  document.getElementById("replay-btn")!.addEventListener("click", startGame);

  const charBtns = document.querySelectorAll<HTMLButtonElement>(".char-btn");
  charBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      charBtns.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.character = btn.dataset.char as "sarah" | "nicolas";
    });
  });

  setMode("menu");
  animate();
}

function setMode(mode: "menu" | "playing" | "score"): void {
  state.mode = mode;
  showHUD(mode === "playing");
  showMenu(mode === "menu");
  showScore(mode === "score");
  joystick[mode === "playing" ? "show" : "hide"]();
}

function startGame(): void {
  resetForNewGame(state);
  player.mesh.position.set(0, 0, 5);
  cameraCtrl.snapTo(player.mesh);
  items.spawn(state.character);
  state.totalItems = 10;
  setMode("playing");
  clock.getDelta(); // reset clock
}

function endGame(): void {
  const finalScore = computeFinalScore(state);
  updateScoreScreen(state, finalScore);
  setMode("score");
}

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (state.mode === "playing") {
    player.update(joystick.input, dt);
    resolveCollisions(player.mesh.position, colliders, pond);
    items.update(dt);

    const collected = items.checkCollection(player.mesh.position);
    if (collected) {
      addCollectedItem(state, { id: collected.id, name: collected.name, points: collected.points });
      showNotification(`${collected.name} +${collected.points}`);

      if (items.remaining === 0) {
        endGame();
        return;
      }
    }

    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endGame();
      return;
    }

    updateHUD(state);

    dirLight.position.set(player.mesh.position.x + 12, 24, player.mesh.position.z + 8);
    dirLight.target = player.mesh;
  }

  cameraCtrl.update(player.mesh, player.velocity, dt);
  renderer.render(scene, camera);
}

init();
