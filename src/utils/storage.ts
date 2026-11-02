import { GameState } from '../game/types';

const SAVE_KEY = 'block_and_boulevard_saved_match_v1';

export function saveGameState(state: GameState): void {
  try {
    if (state.turnPhase === 'GAME_OVER') {
      localStorage.removeItem(SAVE_KEY);
      return;
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSavedGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (
      !parsed ||
      !Array.isArray(parsed.players) ||
      parsed.players.length < 2 ||
      !parsed.properties ||
      parsed.turnPhase === 'GAME_OVER'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSavedGameState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}
