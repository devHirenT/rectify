import type { GeneratedPuzzle } from './types.js';
import { hashSeed, Rng } from './prng.js';
import { generatePuzzle } from './generator.js';
import { DIFFICULTY_SIZES } from './difficulty.js';

/**
 * Format a Date as a UTC `YYYY-MM-DD` string. Using UTC guarantees every player
 * worldwide shares the same daily puzzle for a given calendar day (PRD §16).
 */
export function dateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate the deterministic daily challenge for a given date.
 * Same date -> identical puzzle for all players, fully offline.
 */
export function generateDailyChallenge(date: Date): GeneratedPuzzle {
  const key = dateKey(date);
  const seed = hashSeed(`daily:${key}`);

  // Vary size day-to-day within the "medium" band for a balanced daily.
  const sizes = DIFFICULTY_SIZES.medium;
  const [rows, cols] = new Rng(seed).pick(sizes);

  const generated = generatePuzzle({
    rows,
    cols,
    seed,
    difficulty: 'medium',
  });

  // Stamp a stable, human-readable id.
  generated.puzzle.id = `daily-${key}`;
  return generated;
}
