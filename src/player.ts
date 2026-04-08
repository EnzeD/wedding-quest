import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { cloneAsset, normalizeToHeight, getManifest, getAnimations } from "./assets.ts";
import { PlayerDustTrail } from "./player-dust.ts";
import { createBlobShadow } from "./shaders/blob-shadow.ts";
import type { Character } from "./types.ts";

const WEAPON_NODES = [
  "AK", "GrenadeLauncher", "Knife_1", "Knife_2", "Pistol",
  "Revolver", "Revolver_Small", "RocketLauncher", "ShortCannon",
  "Shotgun", "Shovel", "SMG", "Sniper", "Sniper_2",
];

type AnimState = "idle" | "walk" | "run" | "jump";

const CLIP_ALIASES: Record<AnimState, string[]> = {
  idle: ["idle", "Idle", "static"],
  walk: ["walk", "Walk"],
  run: ["sprint", "run", "Run"],
  jump: ["jump", "Jump"],
};

export class Player {
  mesh: THREE.Group;
  velocity = new THREE.Vector2(0, 0);

  private visualRoot: THREE.Group;
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<string, THREE.AnimationAction>();
  private currentAnim: AnimState = "idle";
  private missingClips = new Set<AnimState>();
  private jumpElapsed = 0;
  private jumping = false;
  private dust: PlayerDustTrail;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.visualRoot = new THREE.Group();
    this.mesh.add(this.visualRoot);
    this.dust = new PlayerDustTrail(scene);
    this.buildPlaceholder();
    this.mesh.add(createBlobShadow(0.65));
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
    this.visualRoot.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 12, 8),
      bodyMat,
    );
    head.position.y = 1.5;
    head.castShadow = true;
    this.visualRoot.add(head);

    const underwear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.36, 0.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x4444ff }),
    );
    underwear.position.y = 0.35;
    this.visualRoot.add(underwear);
  }

  loadModel(character: Character): void {
    const m = getManifest();
    const path = m.characters[character] ?? m.characters.player;
    if (!path) return;

    const model = cloneAsset(path);
    if (model.children.length === 0) return;

    this.mixer?.stopAllAction();
    this.mixer = null;
    this.actions.clear();
    this.currentAnim = "idle";
    this.missingClips.clear();
    this.jumpElapsed = 0;
    this.jumping = false;
    this.visualRoot.position.y = 0;
    this.dust.reset();

    // Hide weapon nodes (hides the node and all its mesh children)
    model.traverse((child) => {
      if (WEAPON_NODES.includes(child.name)) {
        child.visible = false;
      }
    });

    const normalized = normalizeToHeight(model, CONFIG.player.height, true);

    this.visualRoot.clear();
    this.visualRoot.add(normalized);

    // Setup animations
    const clips = getAnimations(path);
    if (clips.length > 0) {
      this.mixer = new THREE.AnimationMixer(normalized);
      for (const clip of clips) {
        const action = this.mixer.clipAction(clip);
        if (clip.name === "jump") {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        this.actions.set(clip.name, action);
      }
      this.playAnim("idle");
    }
  }

  private playAnim(state: AnimState): void {
    const nextClip = this.findClipName(state);
    if (!nextClip) return;
    if (state === this.currentAnim && this.actions.get(nextClip)?.isRunning()) return;

    const prevClip = this.findClipName(this.currentAnim);
    const prev = this.actions.get(prevClip);
    const next = this.actions.get(nextClip);

    if (next) {
      next.reset().setEffectiveWeight(1).fadeIn(0.2).play();
      if (prev && prev !== next) prev.crossFadeTo(next, 0.2, false);
    }

    this.currentAnim = state;
  }

  private findClipName(state: AnimState): string | null {
    for (const alias of CLIP_ALIASES[state]) {
      if (this.actions.has(alias)) return alias;
    }

    if (!this.missingClips.has(state)) {
      console.warn(`Missing animation clip for state "${state}"`);
      this.missingClips.add(state);
    }

    return null;
  }

  private startJump(): void {
    if (this.jumping) return;
    this.jumping = true;
    this.jumpElapsed = 0;
    this.playAnim("jump");
  }

  private updateJump(dt: number): void {
    if (!this.jumping) {
      this.visualRoot.position.y = 0;
      return;
    }

    this.jumpElapsed += dt;
    const t = Math.min(this.jumpElapsed / CONFIG.player.jumpDuration, 1);
    this.visualRoot.position.y = 4 * t * (1 - t) * CONFIG.player.jumpHeight;

    if (t >= 1) {
      this.jumping = false;
      this.jumpElapsed = 0;
      this.visualRoot.position.y = 0;
    }
  }

  update(joystickInput: THREE.Vector2, dt: number, sprinting: boolean, jumpPressed: boolean): void {
    this.velocity.copy(joystickInput);
    if (jumpPressed) this.startJump();
    this.updateJump(dt);

    // Update animation mixer
    this.mixer?.update(dt);

    const inputLen = joystickInput.length();

    if (this.jumping) {
      this.playAnim("jump");
    } else if (inputLen < 0.1) {
      this.playAnim("idle");
    } else {
      this.playAnim(sprinting ? "run" : "walk");
    }

    this.dust.update(this.mesh.position, joystickInput, inputLen >= 0.1, sprinting, !this.jumping, dt);

    if (inputLen < 0.1) return;

    const speed = CONFIG.player.speed * (sprinting ? CONFIG.player.sprintMultiplier : 1);
    const moveX = joystickInput.x * speed * dt;
    const moveZ = joystickInput.y * speed * dt;

    this.mesh.position.x += moveX;
    this.mesh.position.z += moveZ;

    // Face movement direction
    const angle = Math.atan2(joystickInput.x, joystickInput.y);
    this.mesh.rotation.y = angle;
  }
}
