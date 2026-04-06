import type { GameMode, Character, CollectedItem } from "./types.ts";
import { CONFIG } from "./config.ts";

export interface GameState {
  mode: GameMode;
  character: Character;
  playerName: string;
  timeLeft: number;
  score: number;
  collectedItems: CollectedItem[];
  totalItems: number;
}

export function createInitialState(): GameState {
  return {
    mode: "menu",
    character: "nicolas",
    playerName: "",
    timeLeft: CONFIG.match.totalTime,
    score: 0,
    collectedItems: [],
    totalItems: 10,
  };
}

export function resetForNewGame(state: GameState): void {
  state.mode = "playing";
  state.timeLeft = CONFIG.match.totalTime;
  state.score = 0;
  state.collectedItems = [];
}

export function addCollectedItem(state: GameState, item: CollectedItem): void {
  state.collectedItems.push(item);
  state.score += item.points;
}

export function computeFinalScore(state: GameState): number {
  const timeBonus = Math.floor(state.timeLeft) * 2;
  const completionBonus = state.collectedItems.length >= state.totalItems ? 500 : 0;
  return state.score + timeBonus + completionBonus;
}
