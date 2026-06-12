import { getJSON, setJSON, type KVStore } from './kv.js';

/** The full persisted player profile (PRD §21). */
export interface PlayerProfile {
  coins: number;
  xp: number;
  level: number;
  /** Hint tokens the player can spend (PRD §22 hint economy). */
  hints: number;
  /** Theme ids the player has unlocked; the first is the active default. */
  unlockedThemes: string[];
  activeTheme: string;
  /** Achievement id -> unlocked (true) — present means unlocked. */
  achievements: Record<string, true>;
  /** Per-difficulty completion: difficulty -> set of completed level ids. */
  completedLevels: Record<string, string[]>;
  /** Best stars per level id. */
  starsByLevel: Record<string, number>;
  /** Best time (seconds) per level id. */
  bestTimeByLevel: Record<string, number>;
  stats: PlayerStats;
  streak: StreakState;
  settings: Settings;
  /** Whether the first-time tutorial has been shown. */
  onboarded: boolean;
  /** Schema version for future migrations. */
  version: number;
}

export interface PlayerStats {
  puzzlesSolved: number;
  perfectSolves: number;
  hintsUsed: number;
  totalTimeSeconds: number;
  bestTimeSeconds: number | null;
}

export interface StreakState {
  current: number;
  longest: number;
  /** UTC date key (YYYY-MM-DD) of the last daily completion. */
  lastDailyKey: string | null;
  /** UTC date key of the last claimed login reward. */
  lastLoginRewardKey: string | null;
  /** Position in the 7-day login cycle (0-6). */
  loginCycleDay: number;
}

export interface Settings {
  musicVolume: number;
  effectsVolume: number;
  uiVolume: number;
  ambientVolume: number;
  hapticsEnabled: boolean;
  audioEnabled: boolean;
  // Accessibility (PRD §20)
  colorblindMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  leftHandMode: boolean;
}

const PROFILE_KEY = 'profile';
export const CURRENT_VERSION = 1;

export function defaultProfile(): PlayerProfile {
  return {
    coins: 0,
    xp: 0,
    level: 1,
    hints: 3,
    unlockedThemes: ['classic'],
    activeTheme: 'classic',
    achievements: {},
    completedLevels: {},
    starsByLevel: {},
    bestTimeByLevel: {},
    stats: {
      puzzlesSolved: 0,
      perfectSolves: 0,
      hintsUsed: 0,
      totalTimeSeconds: 0,
      bestTimeSeconds: null,
    },
    streak: {
      current: 0,
      longest: 0,
      lastDailyKey: null,
      lastLoginRewardKey: null,
      loginCycleDay: 0,
    },
    settings: {
      musicVolume: 0.7,
      effectsVolume: 0.8,
      uiVolume: 0.8,
      ambientVolume: 0.5,
      hapticsEnabled: true,
      audioEnabled: true,
      colorblindMode: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      leftHandMode: false,
    },
    onboarded: false,
    version: CURRENT_VERSION,
  };
}

/**
 * Load the profile, applying defaults for any missing fields so older saves
 * keep working after the schema grows.
 */
export async function loadProfile(store: KVStore): Promise<PlayerProfile> {
  const stored = await getJSON<Partial<PlayerProfile>>(store, PROFILE_KEY, {});
  return migrate({ ...defaultProfile(), ...stored });
}

export async function saveProfile(store: KVStore, profile: PlayerProfile): Promise<void> {
  await setJSON(store, PROFILE_KEY, profile);
}

/** Apply forward migrations. */
function migrate(profile: PlayerProfile): PlayerProfile {
  // Deep-merge nested objects that may be absent in old saves.
  const base = defaultProfile();
  const merged: PlayerProfile = {
    ...base,
    ...profile,
    stats: { ...base.stats, ...profile.stats },
    streak: { ...base.streak, ...profile.streak },
    settings: { ...base.settings, ...profile.settings },
    version: CURRENT_VERSION,
  };
  return normalizeLevelIds(merged);
}

/**
 * Normalize completed-level ids to the canonical `${difficulty}-${n}` form.
 *
 * Early builds stored completions under the generated puzzle id (e.g.
 * `gen-12345-0`), so the Level Select screen couldn't match stars/best-times to
 * a level number. `completedLevels[difficulty]` preserves completion order, so
 * the i-th entry is level i+1 — we use that to remap the id and carry its stars
 * and best time to the canonical key. Idempotent: once normalized it's a no-op.
 */
function normalizeLevelIds(profile: PlayerProfile): PlayerProfile {
  for (const [difficulty, ids] of Object.entries(profile.completedLevels)) {
    ids.forEach((oldId, i) => {
      const canonical = `${difficulty}-${i + 1}`;
      if (oldId === canonical) return;

      const oldStars = profile.starsByLevel[oldId];
      if (oldStars != null && profile.starsByLevel[canonical] == null) {
        profile.starsByLevel[canonical] = oldStars;
        delete profile.starsByLevel[oldId];
      }
      const oldTime = profile.bestTimeByLevel[oldId];
      if (oldTime != null && profile.bestTimeByLevel[canonical] == null) {
        profile.bestTimeByLevel[canonical] = oldTime;
        delete profile.bestTimeByLevel[oldId];
      }
      ids[i] = canonical;
    });
  }
  return profile;
}
