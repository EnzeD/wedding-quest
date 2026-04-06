import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { cloneAsset, normalizeToHeight, getManifest } from "./assets.ts";

export class Player {
  mesh: THREE.Group;
  velocity = new THREE.Vector2(0, 0);

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

    const normalized = normalizeToHeight(model, CONFIG.player.height);
    // Remove placeholder children
    while (this.mesh.children.length > 0) this.mesh.remove(this.mesh.children[0]);
    this.mesh.add(normalized);
  }

  update(joystickInput: THREE.Vector2, dt: number): void {
    this.velocity.copy(joystickInput);

    if (joystickInput.length() < 0.1) return;

    // Direct movement: joystick X = world X, joystick Y = world Z
    const moveX = joystickInput.x * CONFIG.player.speed * dt;
    const moveZ = joystickInput.y * CONFIG.player.speed * dt;

    this.mesh.position.x += moveX;
    this.mesh.position.z += moveZ;

    // Face movement direction
    const angle = Math.atan2(joystickInput.x, joystickInput.y);
    this.mesh.rotation.y = angle;
  }
}
