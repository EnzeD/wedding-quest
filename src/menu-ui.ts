import { characterText, localize, menuText } from "./i18n.ts";
import type { Character } from "./types.ts";

interface MenuUIOptions {
  onStart: () => void;
  onCharacterSelect: (character: Character) => void;
  onConfirm: (payload: { character: Character; playerName: string }) => void;
}

const SOUND = {
  click: "/assets/kenney-ui/sounds/click-a.ogg",
  switch: "/assets/kenney-ui/sounds/switch-a.ogg",
  tap: "/assets/kenney-ui/sounds/tap-a.ogg",
};

function playSound(path: string, volume: number): void {
  const audio = new Audio(path);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export class MenuUI {
  private root = document.getElementById("menu-screen")!;
  private startBtn = document.getElementById("menu-start-btn") as HTMLButtonElement;
  private confirmBtn = document.getElementById("menu-confirm-btn") as HTMLButtonElement;
  private nameInput = document.getElementById("player-name") as HTMLInputElement;
  private characterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".menu-character-card"));
  private selectedCharacter: Character | null = null;
  private busy = false;

  constructor(private options: MenuUIOptions) {
    this.applyCopy();
    this.bind();
    this.update();
  }

  showTitle(): void {
    this.root.style.display = "grid";
    this.root.dataset.step = "title";
    this.busy = false;
    this.update();
  }

  showCharacterSelect(): void {
    this.root.style.display = "grid";
    this.root.dataset.step = "character";
    this.busy = false;
    this.update();
  }

  hide(): void {
    this.root.style.display = "none";
  }

  setBusy(busy: boolean): void {
    this.busy = busy;
    this.root.classList.toggle("is-busy", busy);
    this.update();
  }

  setSelectedCharacter(character: Character | null): void {
    this.selectedCharacter = character;
    this.update();
  }

  private applyCopy(): void {
    this.setText("menu-kicker", localize(menuText.kicker));
    this.setText("menu-title", localize(menuText.title));
    this.setText("menu-tagline", localize(menuText.tagline));
    this.setText("menu-start-label", localize(menuText.start));
    this.setText("menu-select-kicker", localize(menuText.selectKicker));
    this.setText("menu-select-title", localize(menuText.selectTitle));
    this.setText("menu-select-copy", localize(menuText.selectCopy));
    this.setText("menu-name-label", localize(menuText.nameLabel));
    this.setText("menu-confirm-label", localize(menuText.confirm));
    this.setText("menu-sarah-role", localize(characterText.bride));
    this.setText("menu-nicolas-role", localize(characterText.groom));
    this.nameInput.placeholder = localize(menuText.nameLabel);
  }

  private bind(): void {
    this.startBtn.addEventListener("click", () => {
      if (this.busy) return;
      playSound(SOUND.click, 0.6);
      this.options.onStart();
    });

    this.characterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (this.busy) return;
        const character = button.dataset.character as Character;
        this.selectedCharacter = character;
        playSound(SOUND.switch, 0.45);
        this.update();
        this.options.onCharacterSelect(character);
      });
    });

    this.nameInput.addEventListener("input", () => this.update());
    this.nameInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || this.confirmBtn.disabled || !this.selectedCharacter) return;
      this.confirmSelection();
    });

    this.confirmBtn.addEventListener("click", () => this.confirmSelection());
  }

  private confirmSelection(): void {
    if (this.busy || !this.selectedCharacter) return;
    const playerName = this.nameInput.value.trim();
    if (!playerName) return;
    playSound(SOUND.tap, 0.55);
    this.options.onConfirm({ character: this.selectedCharacter, playerName });
  }

  private update(): void {
    const canConfirm = !this.busy && !!this.selectedCharacter && this.nameInput.value.trim().length > 0;
    this.startBtn.disabled = this.busy;
    this.confirmBtn.disabled = !canConfirm;
    this.nameInput.disabled = this.busy || this.root.dataset.step !== "character";

    this.characterButtons.forEach((button) => {
      const selected = button.dataset.character === this.selectedCharacter;
      button.classList.toggle("is-selected", selected);
      button.disabled = this.busy || this.root.dataset.step !== "character";
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  private setText(id: string, text: string): void {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }
}
