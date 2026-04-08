import * as THREE from "three";
import { getAnimations } from "./assets.ts";
import { npcAssetPath } from "./level-assets.ts";
import type { LevelEntity } from "./types.ts";

type NpcAnimState = "idle" | "emote";

const CLIP_ALIASES: Record<NpcAnimState, string[]> = {
  idle: ["idle", "Idle", "static"],
  emote: ["emote-yes", "emote-no"],
};

interface NpcAnimator {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentClip: string;
  nextEmoteAt: number;
  emoteClips: string[];
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function scheduleNextEmote(): number {
  return randomRange(3.5, 8.5);
}

function findClipName(animator: NpcAnimator, state: NpcAnimState): string | null {
  for (const alias of CLIP_ALIASES[state]) {
    if (animator.actions.has(alias)) return alias;
  }
  return null;
}

function playClip(animator: NpcAnimator, clipName: string, fade = 0.22): void {
  if (animator.currentClip === clipName && animator.actions.get(clipName)?.isRunning()) return;

  const prev = animator.actions.get(animator.currentClip);
  const next = animator.actions.get(clipName);
  if (!next) return;

  next.reset().setEffectiveWeight(1).fadeIn(fade).play();
  if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
  animator.currentClip = clipName;
}

export class NpcAnimationController {
  private animators = new Map<string, NpcAnimator>();

  register(entity: LevelEntity, object: THREE.Group): void {
    this.remove(entity.id);
    if (entity.kind !== "npc") return;

    const clips = getAnimations(npcAssetPath(entity.assetId));
    if (clips.length === 0) return;

    const mixer = new THREE.AnimationMixer(object);
    const actions = new Map<string, THREE.AnimationAction>();

    for (const clip of clips) {
      const action = mixer.clipAction(clip);
      if (clip.name === "emote-yes" || clip.name === "emote-no") {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      actions.set(clip.name, action);
    }

    const idleClip = findClipName({ mixer, actions, currentClip: "", nextEmoteAt: 0, emoteClips: [] }, "idle");
    if (!idleClip) return;

    const emoteClips = CLIP_ALIASES.emote.filter((name) => actions.has(name));
    const animator: NpcAnimator = {
      mixer,
      actions,
      currentClip: idleClip,
      nextEmoteAt: scheduleNextEmote(),
      emoteClips,
    };

    if (emoteClips.length > 0) {
      mixer.addEventListener("finished", (event) => {
        const finishedName = event.action.getClip().name;
        if (!animator.emoteClips.includes(finishedName)) return;
        const fallbackIdle = findClipName(animator, "idle");
        if (!fallbackIdle) return;
        playClip(animator, fallbackIdle);
        animator.nextEmoteAt = scheduleNextEmote();
      });
    }

    playClip(animator, idleClip, 0);
    this.animators.set(entity.id, animator);
  }

  remove(entityId: string): void {
    const animator = this.animators.get(entityId);
    if (!animator) return;
    animator.mixer.stopAllAction();
    this.animators.delete(entityId);
  }

  update(dt: number): void {
    for (const animator of this.animators.values()) {
      animator.mixer.update(dt);
      if (animator.emoteClips.length === 0) continue;
      if (animator.emoteClips.includes(animator.currentClip)) continue;

      animator.nextEmoteAt -= dt;
      if (animator.nextEmoteAt > 0) continue;

      const emoteClip = animator.emoteClips[Math.floor(Math.random() * animator.emoteClips.length)];
      playClip(animator, emoteClip);
    }
  }

  clear(): void {
    for (const entityId of [...this.animators.keys()]) this.remove(entityId);
  }
}
