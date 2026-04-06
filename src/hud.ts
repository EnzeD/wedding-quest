import { CONFIG } from "./config.ts";
import type { GameState } from "./state.ts";

let timerEl: HTMLElement;
let itemCountEl: HTMLElement;
let notificationEl: HTMLElement;
let notifTimeout: ReturnType<typeof setTimeout> | null = null;
let menuEl: HTMLElement;
let scoreEl: HTMLElement;

export function createHUD(): void {
  const hud = document.getElementById("hud")!;

  // Timer (top center)
  timerEl = document.createElement("div");
  timerEl.id = "timer";
  timerEl.className = "hud-panel hud-top-center";
  hud.appendChild(timerEl);

  // Item counter (top left)
  itemCountEl = document.createElement("div");
  itemCountEl.id = "item-count";
  itemCountEl.className = "hud-panel hud-top-left";
  hud.appendChild(itemCountEl);

  // Notification (bottom center, above joystick)
  notificationEl = document.createElement("div");
  notificationEl.id = "notification";
  notificationEl.className = "hud-notification";
  hud.appendChild(notificationEl);
}

export function updateHUD(state: GameState): void {
  // Timer
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  timerEl.textContent = timeStr;

  if (state.timeLeft <= CONFIG.match.criticalTime) {
    timerEl.classList.add("critical");
    timerEl.classList.remove("warning");
  } else if (state.timeLeft <= CONFIG.match.warningTime) {
    timerEl.classList.add("warning");
    timerEl.classList.remove("critical");
  } else {
    timerEl.classList.remove("warning", "critical");
  }

  // Item counter
  itemCountEl.textContent = `${state.collectedItems.length}/${state.totalItems}`;
}

export function showNotification(text: string): void {
  notificationEl.textContent = text;
  notificationEl.classList.add("visible");
  if (notifTimeout) clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => {
    notificationEl.classList.remove("visible");
  }, 2000);
}

export function showHUD(visible: boolean): void {
  const hud = document.getElementById("hud")!;
  hud.style.display = visible ? "block" : "none";
}

export function createMenuScreen(): HTMLElement {
  menuEl = document.getElementById("menu-screen")!;
  return menuEl;
}

export function showMenu(visible: boolean): void {
  menuEl.style.display = visible ? "flex" : "none";
}

export function createScoreScreen(): HTMLElement {
  scoreEl = document.getElementById("score-screen")!;
  return scoreEl;
}

export function showScore(visible: boolean): void {
  scoreEl.style.display = visible ? "flex" : "none";
}

export function updateScoreScreen(state: GameState, finalScore: number): void {
  const detailEl = scoreEl.querySelector("#score-detail")!;
  const itemList = state.collectedItems
    .map((item) => `<div class="score-item">${item.name} <span>+${item.points}</span></div>`)
    .join("");

  const timeBonus = Math.floor(state.timeLeft) * 2;
  const completionBonus = state.collectedItems.length >= state.totalItems ? 500 : 0;

  detailEl.innerHTML = `
    <div class="score-section">
      <h3>Objets (${state.collectedItems.length}/${state.totalItems})</h3>
      ${itemList}
    </div>
    <div class="score-section">
      <div class="score-item">Bonus temps <span>+${timeBonus}</span></div>
      ${completionBonus > 0 ? `<div class="score-item">Bonus completion <span>+${completionBonus}</span></div>` : ""}
    </div>
    <div class="score-total">Score total : ${finalScore}</div>
  `;
}
