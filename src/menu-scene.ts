import * as THREE from "three";
import { cloneAsset, getAnimations, getManifest, normalizeToHeight } from "./assets.ts";
import { CONFIG } from "./config.ts";
import type { Character, LevelEntity } from "./types.ts";

const WEAPON_NODES = [
  "AK", "GrenadeLauncher", "Knife_1", "Knife_2", "Pistol",
  "Revolver", "Revolver_Small", "RocketLauncher", "ShortCannon",
  "Shotgun", "Shovel", "SMG", "Sniper", "Sniper_2",
];

const IDLE_NAMES = ["idle", "Idle", "static"];
const STAGE_CENTER = new THREE.Vector3(-11.6, 0, 8.8);
const DEFAULT_CHARACTER_HEIGHT = 0.52;
const CHARACTER_OFFSETS: Record<Character, THREE.Vector3> = {
  sarah: new THREE.Vector3(-3.3, 0.1, 0.8),
  nicolas: new THREE.Vector3(3.3, 0, -0.3),
};

class MenuCharacter {
  readonly group = new THREE.Group();
  private focus = new THREE.Object3D();
  private visualRoot = new THREE.Group();
  private ringMaterial = new THREE.MeshStandardMaterial({ color: 0x5f74ca, emissive: 0x203560 });
  private topMaterial = new THREE.MeshStandardMaterial({ color: 0x294a63 });
  private glowOrbs: THREE.Mesh[] = [];
  private mixer: THREE.AnimationMixer | null = null;
  private selectedMix = 0;
  private targetMix = 0;
  private characterHeight: number;
  private basePosition: THREE.Vector3;

  constructor(
    private character: Character,
    position: THREE.Vector3,
    characterHeight: number,
    private accentColor: number,
    private side: -1 | 1,
  ) {
    this.characterHeight = characterHeight;
    this.basePosition = position.clone();
    this.group.position.copy(position);
    this.group.add(this.createPedestal(), this.visualRoot);
    this.focus.position.set(0, 1.9, 0);
    this.group.add(this.focus);
  }

  load(): void {
    const manifest = getManifest();
    const path = manifest.characters[this.character] ?? manifest.characters.player;
    if (!path) return;

    const model = cloneAsset(path);
    model.traverse((child) => {
      if (WEAPON_NODES.includes(child.name)) child.visible = false;
    });

    const normalized = normalizeToHeight(model, CONFIG.player.height * 1.12, true);
    normalized.position.y = this.characterHeight;
    normalized.rotation.y = Math.PI;
    this.visualRoot.add(normalized);

    const clips = getAnimations(path);
    if (clips.length > 0) {
      this.mixer = new THREE.AnimationMixer(normalized);
      const idleClip = clips.find((clip) => IDLE_NAMES.includes(clip.name));
      if (idleClip) this.mixer.clipAction(idleClip).play();
    }
  }

  setSelected(selected: boolean): void {
    this.targetMix = selected ? 1 : 0;
  }

  getFocusTarget(target = new THREE.Vector3()): THREE.Vector3 {
    return this.focus.getWorldPosition(target);
  }

  update(dt: number, time: number): void {
    this.mixer?.update(dt);
    const smooth = 1 - Math.exp(-8 * dt);
    this.selectedMix = THREE.MathUtils.lerp(this.selectedMix, this.targetMix, smooth);

    this.group.position.copy(this.basePosition);
    this.group.position.y += 0.08 + Math.sin(time * 1.4 + this.side) * 0.06;
    this.group.scale.setScalar(1 + this.selectedMix * 0.08);
    this.visualRoot.rotation.y = Math.PI + this.side * this.selectedMix * 0.18;

    this.ringMaterial.color.setHex(this.selectedMix > 0.45 ? this.accentColor : 0x5f74ca);
    this.ringMaterial.emissive.setHex(this.selectedMix > 0.45 ? this.accentColor : 0x203560);
    this.ringMaterial.emissiveIntensity = 0.28 + this.selectedMix * 0.75;
    this.topMaterial.emissive.setHex(this.selectedMix > 0.45 ? this.accentColor : 0x122438);
    this.topMaterial.emissiveIntensity = 0.08 + this.selectedMix * 0.26;

    for (let i = 0; i < this.glowOrbs.length; i++) {
      const orb = this.glowOrbs[i];
      const angle = time * (0.9 + i * 0.1) + i * 2.1 + this.side * 0.4;
      const radius = 0.75 + i * 0.22;
      orb.visible = this.selectedMix > 0.04;
      orb.position.set(Math.cos(angle) * radius, 1.9 + Math.sin(angle * 1.8) * 0.18, Math.sin(angle) * radius);
      orb.scale.setScalar(0.18 + this.selectedMix * 0.14);
      (orb.material as THREE.MeshStandardMaterial).opacity = this.selectedMix;
    }
  }

  private createPedestal(): THREE.Group {
    const pedestal = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 2.15, 0.48, 24),
      new THREE.MeshStandardMaterial({ color: 0x213648 }),
    );
    base.receiveShadow = true;
    base.castShadow = true;
    base.position.y = 0.22;
    pedestal.add(base);

    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.18, 24), this.topMaterial);
    top.position.y = 0.56;
    top.castShadow = true;
    top.receiveShadow = true;
    pedestal.add(top);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.1, 12, 40), this.ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.72;
    pedestal.add(ring);

    for (let i = 0; i < 4; i++) {
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.18),
        new THREE.MeshStandardMaterial({
          color: 0xffd76f,
          emissive: this.accentColor,
          emissiveIntensity: 1.15,
          transparent: true,
          opacity: 0,
        }),
      );
      pedestal.add(orb);
      this.glowOrbs.push(orb);
    }

    return pedestal;
  }
}

export class MenuScene {
  private root = new THREE.Group();
  private time = 0;
  private stageFocus = new THREE.Object3D();
  private characters: Record<Character, MenuCharacter>;

  constructor(scene: THREE.Scene, anchor: LevelEntity | null) {
    const stageCenter = anchor
      ? new THREE.Vector3(anchor.position.x, anchor.position.y, anchor.position.z)
      : STAGE_CENTER.clone();
    const characterHeight = anchor?.scale ?? DEFAULT_CHARACTER_HEIGHT;

    this.root.position.copy(stageCenter);
    this.root.rotation.y = anchor?.rotationY ?? 0;
    this.root.add(this.createStage());
    this.stageFocus.position.set(0, 1.7, 0.2);
    this.root.add(this.stageFocus);

    this.characters = {
      sarah: new MenuCharacter("sarah", CHARACTER_OFFSETS.sarah, characterHeight, 0xffb349, -1),
      nicolas: new MenuCharacter("nicolas", CHARACTER_OFFSETS.nicolas, characterHeight, 0x78d4ff, 1),
    };

    this.root.add(this.characters.sarah.group, this.characters.nicolas.group);
    this.root.visible = false;
    scene.add(this.root);
  }

  async prepare(): Promise<void> {
    this.characters.sarah.load();
    this.characters.nicolas.load();
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  setSelected(character: Character | null): void {
    this.characters.sarah.setSelected(character === "sarah");
    this.characters.nicolas.setSelected(character === "nicolas");
  }

  update(dt: number): void {
    if (!this.root.visible) return;
    this.time += dt;
    this.characters.sarah.update(dt, this.time);
    this.characters.nicolas.update(dt, this.time + 0.4);
  }

  getStageFocus(target = new THREE.Vector3()): THREE.Vector3 {
    return this.stageFocus.getWorldPosition(target);
  }

  getCharacterFocus(character: Character, target = new THREE.Vector3()): THREE.Vector3 {
    return this.characters[character].getFocusTarget(target);
  }

  getCharacterPosition(character: Character, target = new THREE.Vector3()): THREE.Vector3 {
    return this.characters[character].group.getWorldPosition(target);
  }

  private createStage(): THREE.Group {
    const stage = new THREE.Group();

    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(6.3, 0.16, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0xffd76f, emissive: 0x9a5a00, emissiveIntensity: 0.5 }),
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.03;
    stage.add(trim);

    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 0.06, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x7f2947 }),
    );
    carpet.position.set(0, 0.03, 0.3);
    carpet.receiveShadow = true;
    stage.add(carpet);

    return stage;
  }
}
