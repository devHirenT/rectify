/**
 * XP and level progression (PRD §14).
 *
 * The PRD anchors the early curve at 0 / 100 / 250 / 500 cumulative XP. We
 * extend it smoothly: each level requires more than the last, following the
 * same accelerating shape.
 */

/** Cumulative XP required to *reach* a given level (1-indexed). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 100;
  if (level === 3) return 250;
  if (level === 4) return 500;
  // Beyond the hand-authored anchors: quadratic growth from level 4's 500.
  const n = level - 4;
  return 500 + Math.round(125 * n * (n + 3));
}

export interface LevelState {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP needed to advance from the current level to the next. */
  xpForNext: number;
}

/** Resolve total XP into a level and progress toward the next level. */
export function levelFromXp(totalXp: number): LevelState {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    xpIntoLevel: totalXp - floor,
    xpForNext: ceil - floor,
  };
}

/** XP awarded for a solve, scaling with difficulty score and bonuses. */
export function xpForSolve(opts: {
  difficultyScore: number;
  stars: number;
  perfect: boolean;
}): number {
  const base = 25 + Math.round(opts.difficultyScore * 0.5);
  const starBonus = opts.stars * 10;
  const perfectBonus = opts.perfect ? 25 : 0;
  return base + starBonus + perfectBonus;
}

/** Apply XP and report whether (and how many times) the player leveled up. */
export function addXp(
  totalXp: number,
  gained: number,
): { totalXp: number; before: LevelState; after: LevelState; leveledUp: boolean } {
  const before = levelFromXp(totalXp);
  const next = totalXp + gained;
  const after = levelFromXp(next);
  return { totalXp: next, before, after, leveledUp: after.level > before.level };
}
