import * as THREE from "three";
import { CONFIG } from "./config.ts";

interface DustParticle {
  sprite: THREE.Sprite;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  startScale: number;
  endScale: number;
}

let cachedTexture: THREE.CanvasTexture | null = null;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function getDustTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable for player dust");

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 242, 224, 0.95)");
  gradient.addColorStop(0.45, "rgba(244, 210, 164, 0.6)");
  gradient.addColorStop(1, "rgba(244, 210, 164, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedTexture = texture;
  return texture;
}

export class PlayerDustTrail {
  private readonly particles: DustParticle[];
  private spawnAccumulator = 0;
  private readonly moveDir = new THREE.Vector2();
  private readonly sideDir = new THREE.Vector2();

  constructor(scene: THREE.Scene) {
    this.particles = Array.from({ length: CONFIG.player.dust.maxParticles }, () => {
      const material = new THREE.SpriteMaterial({
        map: getDustTexture(),
        color: 0xe4ccb0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.renderOrder = 3;
      scene.add(sprite);
      return {
        sprite,
        velocity: new THREE.Vector3(),
        age: 0,
        lifetime: 0.3,
        startScale: 0.2,
        endScale: 0.34,
      };
    });
  }

  reset(): void {
    this.spawnAccumulator = 0;
    for (const particle of this.particles) {
      particle.age = particle.lifetime;
      particle.sprite.visible = false;
      particle.sprite.material.opacity = 0;
    }
  }

  update(playerPosition: THREE.Vector3, movement: THREE.Vector2, moving: boolean, sprinting: boolean, grounded: boolean, dt: number): void {
    this.updateParticles(dt);

    if (!moving || !grounded) {
      this.spawnAccumulator = 0;
      return;
    }

    this.moveDir.copy(movement);
    if (this.moveDir.lengthSq() < 1e-6) return;
    this.moveDir.normalize();
    this.sideDir.set(-this.moveDir.y, this.moveDir.x);

    const rate = sprinting ? CONFIG.player.dust.sprintSpawnRate : CONFIG.player.dust.walkSpawnRate;
    this.spawnAccumulator += dt * rate;

    while (this.spawnAccumulator >= 1) {
      this.spawnAccumulator -= 1;
      this.spawnParticle(playerPosition, sprinting);
    }
  }

  private updateParticles(dt: number): void {
    for (const particle of this.particles) {
      if (!particle.sprite.visible) continue;

      particle.age += dt;
      if (particle.age >= particle.lifetime) {
        particle.sprite.visible = false;
        particle.sprite.material.opacity = 0;
        continue;
      }

      const t = particle.age / particle.lifetime;
      particle.sprite.position.addScaledVector(particle.velocity, dt);
      particle.velocity.multiplyScalar(1 - Math.min(dt * 3.2, 0.3));
      particle.sprite.material.opacity = (1 - t) * 0.42;

      const scale = THREE.MathUtils.lerp(particle.startScale, particle.endScale, t);
      particle.sprite.scale.setScalar(scale);
    }
  }

  private spawnParticle(playerPosition: THREE.Vector3, sprinting: boolean): void {
    const particle = this.particles.find((entry) => !entry.sprite.visible) ?? this.particles[0];
    const driftBoost = sprinting ? 1.35 : 1;
    const lateral = randomRange(-1, 1) * CONFIG.player.dust.lateralSpread;
    const back = CONFIG.player.dust.backOffset + Math.random() * 0.08;
    const startScale = randomRange(CONFIG.player.dust.minScale, CONFIG.player.dust.maxScale) * (sprinting ? 1.1 : 1);

    particle.sprite.visible = true;
    particle.age = 0;
    particle.lifetime = randomRange(CONFIG.player.dust.minLifetime, CONFIG.player.dust.maxLifetime);
    particle.startScale = startScale;
    particle.endScale = startScale * (sprinting ? 1.8 : 1.5);
    particle.sprite.position.set(
      playerPosition.x - this.moveDir.x * back + this.sideDir.x * lateral,
      0.16 + Math.random() * 0.08,
      playerPosition.z - this.moveDir.y * back + this.sideDir.y * lateral,
    );
    particle.sprite.scale.setScalar(startScale);
    particle.sprite.material.opacity = sprinting ? 0.4 : 0.28;
    particle.velocity.set(
      -this.moveDir.x * CONFIG.player.dust.driftSpeed * driftBoost + this.sideDir.x * lateral * 0.7,
      CONFIG.player.dust.riseSpeed * (0.65 + Math.random() * 0.35),
      -this.moveDir.y * CONFIG.player.dust.driftSpeed * driftBoost + this.sideDir.y * lateral * 0.7,
    );
  }
}
