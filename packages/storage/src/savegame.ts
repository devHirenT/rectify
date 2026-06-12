import { getJSON, setJSON, type KVStore } from './kv.js';

/**
 * Persisted in-progress game so the player can leave and resume (PRD §5 Home
 * "Continue"). Stored separately from the profile since it's transient.
 *
 * We only save deterministic games (a specific level, or the daily) — those
 * regenerate identically from `mode`/`level`/date, so we just restore the
 * player's placed rectangles and counters on top of the same puzzle.
 */
export interface SavedRect {
  r: number;
  c: number;
  h: number;
  w: number;
}

export interface SavedGame {
  mode: string;
  level: number | null;
  rows: number;
  cols: number;
  placed: SavedRect[];
  mistakes: number;
  hintsUsed: number;
  elapsedSeconds: number;
  savedAt: number;
  /** Human label for the Continue card, e.g. "Hard · Level 3". */
  label: string;
}

const KEY = 'savegame';

export async function loadSavedGame(store: KVStore): Promise<SavedGame | null> {
  return getJSON<SavedGame | null>(store, KEY, null);
}

export async function saveSavedGame(store: KVStore, game: SavedGame): Promise<void> {
  await setJSON(store, KEY, game);
}

export async function clearSavedGame(store: KVStore): Promise<void> {
  await store.remove(KEY);
}
