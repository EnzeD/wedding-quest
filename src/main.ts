import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { loadManifest, loadAllAssets } from "./assets.ts";
import { loadLevel } from "./level-data.ts";
import { CinematicMenu } from "./menu.ts";
import { LevelEditor } from "./editor.ts";
import { Player } from "./player.ts";
import { TopDownCamera } from "./camera.ts";
import { FreeLookInput, VirtualJoystick } from "./controls.ts";
import { MapScene } from "./map.ts";
import { resolveCollisions } from "./collision.ts";
import { ItemManager } from "./items.ts";
import { createFPSCounter, createHUD, updateFPSCounter, updateHUD, showHUD, showNotification } from "./hud.ts";
import { showScore, updateScoreScreen, createScoreScreen } from "./hud.ts";
import { createInitialState, resetForNewGame, addCollectedItem, computeFinalScore } from "./state.ts";
import { LowPolySky } from "./shaders/sky.ts";
import { createPostComposer } from "./shaders/post.ts";
import { tickShaders } from "./shaders/clock.ts";
import { applyDocumentTranslations } from "./i18n.ts";

const state = createInitialState();
const searchParams = new URLSearchParams(window.location.search);
const editorMode = searchParams.get("editor") === "1";
const fpsParam = searchParams.get("fps");
const fpsCounterEnabled = fpsParam === "0" ? false : import.meta.env.DEV || editorMode || fpsParam === "1";
let editor: LevelEditor | null = null;
let menu: CinematicMenu | null = null;
let fpsSampleElapsed = 0;
let fpsSampleFrames = 0;

applyDocumentTranslations();

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
renderer.setClearColor(CONFIG.sky.bottomColor, 1);

// Scene
const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0xc5d8eb, 55, 130);
const mapScene = new MapScene(scene);

const sky = new LowPolySky({
  radius: CONFIG.sky.radius,
  top: CONFIG.sky.topColor,
  horizon: CONFIG.sky.horizonColor,
  bottom: CONFIG.sky.bottomColor,
  sun: CONFIG.sky.sunColor,
  cloud: CONFIG.sky.cloudColor,
  cloudShadow: CONFIG.sky.cloudShadowColor,
  sunDirection: CONFIG.sky.sunDirection,
});
scene.add(sky.object);

// Lights
const ambient = new THREE.AmbientLight(0xc8d6ff, CONFIG.lighting.ambient);
const hemi = new THREE.HemisphereLight(0xdcdce9, 0x6a513a, CONFIG.lighting.hemi);
const dirLight = new THREE.DirectionalLight(0xfde2b5, CONFIG.lighting.dir);
const sunShadowOffset = CONFIG.sky.sunDirection.clone().multiplyScalar(28);
dirLight.position.copy(sunShadowOffset);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(CONFIG.lighting.shadowMapSize, CONFIG.lighting.shadowMapSize);
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.bias = -0.0005;
scene.add(ambient, hemi, dirLight);

// Post-processing composer (color grade + vignette).
const post = createPostComposer(renderer, scene, camera);
resize();

// Player + controls
const player = new Player(scene);
player.mesh.position.set(0, 0, 5);
const joystick = new VirtualJoystick();
const freeLook = editorMode ? null : new FreeLookInput(canvas);
const freeLookDelta = new THREE.Vector2();
const movementInput = new THREE.Vector2();
const items = new ItemManager(scene);
const clock = new THREE.Clock();

// HUD
createHUD();
if (fpsCounterEnabled) createFPSCounter();
createScoreScreen();

window.addEventListener("resize", resize);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  cameraCtrl.resize();
  post.composer.setSize(window.innerWidth, window.innerHeight);
}

async function init(): Promise<void> {
  await loadManifest();
  await loadAllAssets();

  const level = await loadLevel();
  post.setEnabled(level.postProcessingEnabled);
  post.setColorGrading(level.colorGrading);
  await mapScene.load(level, { includePickups: editorMode, includeHelpers: editorMode });
  mapScene.updateGrassInteractor(player.mesh.position);

  document.getElementById("replay-btn")!.addEventListener("click", startGame);

  if (editorMode) {
    player.mesh.visible = false;
    joystick.hide();
    showHUD(false);
    showScore(false);
    editor = await LevelEditor.create(renderer, camera, mapScene, level, {
      setColorGrading: post.setColorGrading,
      setPostProcessingEnabled: post.setEnabled,
    });
  } else {
    player.mesh.visible = false;
    menu = new CinematicMenu({
      camera,
      scene,
      menuAnchor: level.entities.find((entity) => entity.kind === "menu-anchor") ?? null,
      menuSettings: level.menu,
      onPlay: ({ character, playerName }) => {
        state.character = character;
        state.playerName = playerName;
        startGame();
      },
    });
    await menu.prepare();
    setMode("menu");
  }

  animate();
}

function setMode(mode: "menu" | "playing" | "score"): void {
  state.mode = mode;
  showHUD(mode === "playing");
  showScore(mode === "score");
  joystick[mode === "playing" ? "show" : "hide"]();
  if (mode === "menu") menu?.show();
  else menu?.hide();
  if (mode !== "playing") freeLook?.reset();
}

function startGame(): void {
  resetForNewGame(state);
  freeLook?.reset();
  player.loadModel(state.character);
  player.mesh.visible = true;
  player.mesh.position.set(0, 0, 5);
  cameraCtrl.snapTo(player.mesh);
  state.totalItems = items.spawn(state.character, mapScene.level!).length;
  updateHUD(state);
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
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.1);

  if (fpsCounterEnabled && rawDt > 0) {
    fpsSampleElapsed += rawDt;
    fpsSampleFrames += 1;

    if (fpsSampleElapsed >= 0.25) {
      updateFPSCounter(fpsSampleFrames / fpsSampleElapsed);
      fpsSampleElapsed = 0;
      fpsSampleFrames = 0;
    }
  }

  tickShaders(dt);
  sky.update(camera.position, dt);
  mapScene.update(dt);

  if (state.mode === "playing") {
    player.update(
      cameraCtrl.toWorldMovement(joystick.input, movementInput),
      dt,
      joystick.isSprinting(),
      joystick.consumeJump(),
    );
    resolveCollisions(player.mesh.position, mapScene.getColliders(), mapScene.mapSize);
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

    dirLight.position.copy(player.mesh.position).add(sunShadowOffset);
    dirLight.target = player.mesh;
  }

  mapScene.updateGrassInteractor(player.mesh.position);

  if (editor) {
    editor.update();
  } else if (state.mode === "menu") {
    menu?.update(dt);
  } else {
    const lookDelta = freeLook?.consumeDelta(freeLookDelta);
    if (lookDelta) cameraCtrl.rotate(lookDelta.x, lookDelta.y);
    cameraCtrl.update(player.mesh, player.velocity, dt);
  }

  mapScene.updateWaterView(camera);
  post.render();
}

init();
