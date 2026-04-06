import * as THREE from "three";

export class Player {
  speed = 8;
  turnSpeed = 3.5;
  mesh: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf5c6a0 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7;
    body.castShadow = true;
    this.mesh.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    this.mesh.add(head);

    // Underwear (calecon)
    const underwearGeometry = new THREE.CylinderGeometry(0.38, 0.36, 0.3, 12);
    const underwearMaterial = new THREE.MeshStandardMaterial({ color: 0x4444ff });
    const underwear = new THREE.Mesh(underwearGeometry, underwearMaterial);
    underwear.position.y = 0.35;
    this.mesh.add(underwear);

    this.mesh.position.set(0, 0, 0);
    scene.add(this.mesh);
  }

  update(joystickInput: THREE.Vector2, deltaTime: number): void {
    if (joystickInput.length() < 0.1) return;

    this.mesh.rotation.y -= joystickInput.x * this.turnSpeed * deltaTime;

    const forward = -joystickInput.y;
    this.mesh.position.x += Math.sin(this.mesh.rotation.y) * forward * this.speed * deltaTime;
    this.mesh.position.z += Math.cos(this.mesh.rotation.y) * forward * this.speed * deltaTime;
  }
}
