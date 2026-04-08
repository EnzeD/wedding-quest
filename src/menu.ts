import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { MenuCameraController, type MenuCameraPose } from "./menu-camera.ts";
import { MenuScene } from "./menu-scene.ts";
import { MenuUI } from "./menu-ui.ts";
import type { Character } from "./types.ts";

interface MenuSelection {
  character: Character;
  playerName: string;
}

interface CinematicMenuOptions {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  onPlay: (selection: MenuSelection) => void;
}

export class CinematicMenu {
  private scene: MenuScene;
  private ui: MenuUI;
  private camera: MenuCameraController;

  constructor(private options: CinematicMenuOptions) {
    this.scene = new MenuScene(options.scene);
    const titleFrame = this.scene.getTitleFrame();
    this.camera = new MenuCameraController(options.camera, {
      position: titleFrame.position,
      lookAt: titleFrame.lookAt,
      fov: 46,
      drift: 0.55,
    });
    this.ui = new MenuUI({
      onStart: () => this.openCharacterSelect(),
      onCharacterSelect: (character) => this.focusCharacter(character),
      onConfirm: (selection) => this.launch(selection),
    });
  }

  async prepare(): Promise<void> {
    await this.scene.prepare();
  }

  show(): void {
    this.scene.setVisible(true);
    this.scene.setSelected(null);
    this.camera.snapTo(this.getTitlePose());
    this.ui.setSelectedCharacter(null);
    this.ui.showTitle();
  }

  hide(): void {
    this.scene.setVisible(false);
    this.ui.hide();
  }

  update(dt: number): void {
    this.camera.update(dt);
    this.scene.update(dt);
  }

  private openCharacterSelect(): void {
    this.ui.setBusy(true);
    this.camera.transitionTo(this.getWidePose(), 1.15, () => {
      this.ui.showCharacterSelect();
      this.ui.setBusy(false);
    });
  }

  private focusCharacter(character: Character): void {
    this.scene.setSelected(character);
    this.camera.transitionTo(this.getCharacterPose(character), 0.42);
  }

  private launch(selection: MenuSelection): void {
    this.scene.setSelected(selection.character);
    this.ui.setBusy(true);
    this.camera.transitionTo(this.getLaunchPose(), 0.82, () => {
      this.options.onPlay(selection);
    });
  }

  private getTitlePose(): MenuCameraPose {
    const titleFrame = this.scene.getTitleFrame();
    return {
      position: titleFrame.position,
      lookAt: titleFrame.lookAt,
      fov: 46,
      drift: 0.55,
    };
  }

  private getWidePose(): MenuCameraPose {
    return {
      position: new THREE.Vector3(-18.2, 4.45, 21.2),
      lookAt: this.scene.getStageFocus(),
      fov: 40,
      drift: 0.28,
    };
  }

  private getCharacterPose(character: Character): MenuCameraPose {
    const lookAt = this.scene.getCharacterFocus(character);
    const anchor = this.scene.getCharacterPosition(character);
    const side = character === "sarah" ? -1 : 1;
    return {
      position: new THREE.Vector3(anchor.x + side * 1.9, 3.4, anchor.z + 8.2),
      lookAt,
      fov: 35,
      drift: 0.14,
    };
  }

  private getLaunchPose(): MenuCameraPose {
    return {
      position: new THREE.Vector3(0, CONFIG.camera.offset.y, 5 + CONFIG.camera.offset.z),
      lookAt: new THREE.Vector3(0, 0, 5),
      fov: CONFIG.camera.fov,
      drift: 0,
    };
  }
}
