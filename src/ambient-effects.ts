import * as THREE from "three";
import { CONFIG } from "./config.ts";
import type { LevelEntity } from "./types.ts";

interface SmokeParticle {
  sprite: THREE.Sprite;
  drift: number;
  phase: number;
  spin: number;
}

interface SmokeEmitter {
  anchor: THREE.Group;
  particles: SmokeParticle[];
  time: number;
}

interface WaterWheelRig {
  root: THREE.Group;
  orientation: THREE.Group;
  axle: THREE.Group;
}

interface EntityEffects {
  emitters: SmokeEmitter[];
  wheel: WaterWheelRig | null;
}

const CHIMNEY_OFFSET = new THREE.Vector3(0.319, 1.02, 0);
const WATERMILL_OUTSET = 0.45;
const WATERMILL_DROP = -0.06;
const WATERMILL_TURN = Math.PI / 2;

function createSmokeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create smoke texture");
  const gradient = ctx.createRadialGradient(32, 32, 10, 32, 32, 30);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.78)");
  gradient.addColorStop(0.55, "rgba(208, 218, 228, 0.42)");
  gradient.addColorStop(1, "rgba(160, 170, 180, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function taggedPieceOf(object: THREE.Object3D): string | null {
  return typeof object.userData.kenneyPiece === "string" ? object.userData.kenneyPiece : null;
}

export class AmbientEffects {
  private smokeTexture = createSmokeTexture();
  private entityEffects = new Map<string, EntityEffects>();

  registerEntity(entity: LevelEntity, object: THREE.Group): void {
    this.removeEntity(entity.id);
    const emitters: SmokeEmitter[] = [];
    let wheel: WaterWheelRig | null = null;

    object.traverse((child) => {
      const piece = taggedPieceOf(child);
      if (piece === "chimney") emitters.push(this.createSmokeEmitter(child));
      if (entity.assetId === "moulin" && piece === "watermill-wide") wheel = this.attachWaterWheelRig(child);
    });
    if (emitters.length === 0 && entity.assetId === "chimney") emitters.push(this.createSmokeEmitter(object));
    this.entityEffects.set(entity.id, { emitters, wheel });
  }

  removeEntity(entityId: string): void {
    const existing = this.entityEffects.get(entityId);
    if (!existing) return;
    for (const emitter of existing.emitters) {
      emitter.anchor.removeFromParent();
      for (const particle of emitter.particles) particle.sprite.material.dispose();
    }
    existing.wheel?.root.removeFromParent();
    this.entityEffects.delete(entityId);
  }

  update(dt: number): void {
    for (const fx of this.entityEffects.values()) {
      if (fx.wheel) fx.wheel.axle.rotation.x += CONFIG.ambient.waterWheelSpeed * dt;
      for (const emitter of fx.emitters) {
        emitter.time += dt * CONFIG.ambient.smoke.riseSpeed;
        this.updateSmokeEmitter(emitter);
      }
    }
  }

  dispose(): void {
    for (const entityId of [...this.entityEffects.keys()]) this.removeEntity(entityId);
    this.smokeTexture.dispose();
  }

  private createSmokeEmitter(chimney: THREE.Object3D): SmokeEmitter {
    const anchor = new THREE.Group();
    anchor.name = "chimney-smoke";
    anchor.position.copy(CHIMNEY_OFFSET);
    chimney.add(anchor);

    const particles = Array.from({ length: CONFIG.ambient.smoke.particleCount }, (_, index) => {
      const material = new THREE.SpriteMaterial({
        map: this.smokeTexture,
        color: 0xdfe7ef,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 2;
      anchor.add(sprite);
      return {
        sprite,
        drift: 0.08 + index * 0.02,
        phase: index * 1.618,
        spin: index % 2 === 0 ? 1 : -1,
      };
    });

    const emitter = { anchor, particles, time: Math.random() };
    this.updateSmokeEmitter(emitter);
    return emitter;
  }

  private updateSmokeEmitter(emitter: SmokeEmitter): void {
    const { spread, height, baseScale, opacity } = CONFIG.ambient.smoke;
    const total = emitter.particles.length;

    emitter.particles.forEach((particle, index) => {
      const t = (emitter.time + index / total) % 1;
      const gust = Math.sin(emitter.time * 2.6 + particle.phase) * 0.22;
      const swirl = particle.phase + emitter.time * (0.9 + particle.drift) + Math.sin(emitter.time * 1.7 + particle.phase) * 0.18;
      const radius = spread * (0.3 + t * 1.05) * (1 + gust);
      const lift = Math.sin(emitter.time * 3.8 + particle.phase) * 0.05;
      const fade = Math.pow(Math.sin(Math.PI * t), 0.72);
      particle.sprite.position.set(
        Math.sin(swirl) * radius,
        t * height + lift,
        Math.cos(swirl * 0.9) * radius * 0.85 + t * particle.drift * 1.2,
      );
      particle.sprite.scale.setScalar(baseScale * (0.72 + t * 1.65) * (1 + gust * 0.35));
      particle.sprite.material.opacity = opacity * fade * (0.88 + 0.12 * Math.sin(emitter.time * 2.1 + particle.phase));
      particle.sprite.material.rotation = particle.spin * (t * 0.8 + emitter.time * 0.06);
    });
  }

  private attachWaterWheelRig(watermill: THREE.Object3D): WaterWheelRig | null {
    const parent = watermill.parent;
    if (!parent) return null;

    const root = new THREE.Group();
    root.name = "water-wheel-root";
    root.position.copy(watermill.position);
    root.quaternion.copy(watermill.quaternion);
    root.scale.copy(watermill.scale);
    parent.add(root);
    root.position.y += WATERMILL_DROP;
    root.translateZ(WATERMILL_OUTSET);

    const orientation = new THREE.Group();
    orientation.name = "water-wheel-orientation";
    orientation.rotation.y = WATERMILL_TURN;
    orientation.rotation.z = Math.PI / 2;
    root.add(orientation);

    const axle = new THREE.Group();
    axle.name = "water-wheel-axle";
    orientation.add(axle);
    axle.attach(watermill);

    watermill.position.set(0, 0, 0);
    watermill.rotation.set(0, 0, 0);
    watermill.scale.set(1, 1, 1);

    return { root, orientation, axle };
  }
}
