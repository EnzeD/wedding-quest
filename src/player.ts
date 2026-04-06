import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { cloneAsset, normalizeToHeight, getManifest, getAnimations } from "./assets.ts";

const WEAPON_NODES = [
  "AK", "GrenadeLauncher", "Knife_1", "Knife_2", "Pistol",
  "Revolver", "Revolver_Small", "RocketLauncher", "ShortCannon",
  "Shotgun", "Shovel", "SMG", "Sniper", "Sniper_2",
];

type AnimState = "idle" | "walk" | "run";

export class Player {
  mesh: THREE.Group;
  velocity = new THREE.Vector2(0, 0);

  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<string, THREE.AnimationAction>();
  private currentAnim: AnimState = "idle";

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.buildPlaceholder();
    scene.add(this.mesh);
  }

  private buildPlaceholder(): void {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5c6a0 });

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1, 12),
      bodyMat,
    );
    body.position.y = 0.7;
    body.castShadow = true;
    this.mesh.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 8),
      bodyMat,
    );
    head.position.y = 1.5;
    head.castShadow = true;
    this.mesh.add(head);

    const underwear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.36, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x4444ff }),
    );
    underwear.position.y = 0.35;
    this.mesh.add(underwear);
  }

  loadModel(): void {
    const m = getManifest();
    const path = m.characters.player;
    if (!path) return;

    const model = cloneAsset(path);
    if (model.children.length === 0) return;

    // Hide weapon nodes (hides the node and all its mesh children)
    model.traverse((child) => {
      if (WEAPON_NODES.includes(child.name)) {
        child.visible = false;
      }
    });

    const normalized = normalizeToHeight(model, CONFIG.player.height, true);

    // Remove placeholder children
    while (this.mesh.children.length > 0) this.mesh.remove(this.mesh.children[0]);
    this.mesh.add(normalized);

    // Setup animations
    const clips = getAnimations(path);
    if (clips.length > 0) {
      this.mixer = new THREE.AnimationMixer(normalized);
      for (const clip of clips) {
        const action = this.mixer.clipAction(clip);
        this.actions.set(clip.name, action);
      }
      this.playAnim("idle");
    }
  }

  private playAnim(state: AnimState): void {
    if (state === this.currentAnim && this.actions.get(this.clipName(state))?.isRunning()) return;

    const prevClip = this.clipName(this.currentAnim);
    const nextClip = this.clipName(state);
    const prev = this.actions.get(prevClip);
    const next = this.actions.get(nextClip);

    if (next) {
      next.reset().setEffectiveWeight(1).play();
      if (prev && prev !== next) prev.crossFadeTo(next, 0.2, false);
    }

    this.currentAnim = state;
  }

  private clipName(state: AnimState): string {
    switch (state) {
      case "idle": return "Idle";
      case "walk": return "Walk";
      case "run": return "Run";
    }
  }

  update(joystickInput: THREE.Vector2, dt: number): void {
    this.velocity.copy(joystickInput);

    // Update animation mixer
    this.mixer?.update(dt);

    const inputLen = joystickInput.length();

    if (inputLen < 0.1) {
      this.playAnim("idle");
      return;
    }

    // Choose walk vs run based on joystick intensity
    this.playAnim(inputLen > 0.7 ? "run" : "walk");

    const speed = CONFIG.player.speed * (inputLen > 0.7 ? 1 : 0.5);
    const moveX = joystickInput.x * speed * dt;
    const moveZ = joystickInput.y * speed * dt;

    this.mesh.position.x += moveX;
    this.mesh.position.z += moveZ;

    // Face movement direction
    const angle = Math.atan2(joystickInput.x, joystickInput.y);
    this.mesh.rotation.y = angle;
  }
}
