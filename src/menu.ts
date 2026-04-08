import * as THREE from "three";
import { CONFIG } from "./config.ts";
import { MenuCameraController, type MenuCameraPose } from "./menu-camera.ts";
import { MenuScene } from "./menu-scene.ts";
import { levelPositionToVector3 } from "./menu-settings.ts";
import { MenuUI } from "./menu-ui.ts";
import type { Character, LevelEntity, LevelMenuSettings } from "./types.ts";

interface MenuSelection {
  character: Character;
  playerName: string;
}

interface CinematicMenuOptions {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  menuAnchor: LevelEntity | null;
  menuSettings: LevelMenuSettings;
  onPlay: (selection: MenuSelection) => void;
}

export class CinematicMenu {
  private scene: MenuScene;
  private ui: MenuUI;
  private camera: MenuCameraController;

  constructor(private options: CinematicMenuOptions) {
    this.scene = new MenuScene(options.scene, options.menuAnchor);
    const titleFrame = options.menuSettings.startCamera;
    this.camera = new MenuCameraController(options.camera, {
      position: levelPositionToVector3(titleFrame.position),
      lookAt: levelPositionToVector3(titleFrame.lookAt),
      fov: titleFrame.fov,
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
    const titleFrame = this.options.menuSettings.startCamera;
    return {
      position: levelPositionToVector3(titleFrame.position),
      lookAt: levelPositionToVector3(titleFrame.lookAt),
      fov: titleFrame.fov,
      drift: 0.55,
    };
  }

  private getWidePose(): MenuCameraPose {
    return {
      position: new THREE.Vector3(-11.8, 7.6, 24.8),
      lookAt: this.scene.getStageFocus().add(new THREE.Vector3(0, 1.35, 0)),
      fov: 34,
      drift: 0.28,
    };
  }

  private getCharacterPose(character: Character): MenuCameraPose {
    const lookAt = this.scene.getCharacterFocus(character);
    const anchor = this.scene.getCharacterPosition(character);
    const side = character === "sarah" ? -1 : 1;
    lookAt.y += 0.48;
    return {
      position: new THREE.Vector3(anchor.x + side * 1.3, 4.9, anchor.z + 10.1),
      lookAt,
      fov: 31,
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
