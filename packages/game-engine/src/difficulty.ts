import type { Clue, Difficulty } from './types.js';
import { factorPairs } from './grid.js';

/** Grid size ranges per difficulty band (from the PRD §10). */
export const DIFFICULTY_SIZES: Record<Difficulty, Array<[number, number]>> = {
  easy: [
    [4, 4],
    [5, 5],
  ],
  medium: [
    [6, 6],
    [7, 7],
  ],
  hard: [
    [8, 8],
    [9, 9],
  ],
  expert: [
    [10, 10],
    [11, 11],
  ],
  master: [
    [12, 12],
    [13, 13],
    [14, 14],
  ],
  // Infinite scales without bound; callers may grow it over time.
  infinite: [[12, 12]],
};

/**
 * Heuristic difficulty score (higher = harder).
 *
 * Intuition: a puzzle is harder when clues admit many candidate rectangles
 * (more branching for the solver) and when there are more clues to juggle.
 * This refines the coarse size-based band so we can, e.g., reject a too-easy
 * "expert" puzzle.
 */
export function scoreDifficulty(clues: Clue[], rows: number, cols: number): number {
  let candidateBranching = 0;

  for (const clue of clues) {
    // Approximate the number of placements: factor pairs that could fit.
    let placements = 0;
    for (const [h, w] of factorPairs(clue.value)) {
      if (h <= rows && w <= cols) {
        // Rough count of top-left anchors keeping (clue.r, clue.c) inside.
        const rRange = Math.min(clue.r, rows - h) - Math.max(0, clue.r - h + 1) + 1;
        const cRange = Math.min(clue.c, cols - w) - Math.max(0, clue.c - w + 1) + 1;
        if (rRange > 0 && cRange > 0) placements += rRange * cRange;
      }
    }
    candidateBranching += Math.max(0, placements - 1);
  }

  const sizeFactor = rows * cols;
  const clueDensity = clues.length / sizeFactor;

  // Weighted blend, then normalize to a friendly 0..100-ish range.
  const raw = candidateBranching * 1.5 + sizeFactor * 0.4 + (1 - clueDensity) * 30;
  return Math.round(raw);
}

/** Map a difficulty band to a target score window for acceptance/rejection. */
export function targetScore(difficulty: Difficulty): { min: number; max: number } {
  switch (difficulty) {
    case 'easy':
      return { min: 0, max: 40 };
    case 'medium':
      return { min: 30, max: 80 };
    case 'hard':
      return { min: 60, max: 140 };
    case 'expert':
      return { min: 110, max: 220 };
    case 'master':
      return { min: 180, max: Infinity };
    case 'infinite':
      return { min: 0, max: Infinity };
  }
}

/** Number of stars (1-3) earned, per PRD §13. */
export function computeStars(opts: {
  mistakes: number;
  hintsUsed: number;
  /** Solve time in seconds. */
  timeSeconds: number;
  /** Par time for the puzzle in seconds (e.g. derived from size). */
  parSeconds: number;
}): 1 | 2 | 3 {
  const { mistakes, hintsUsed, timeSeconds, parSeconds } = opts;
  if (mistakes === 0 && hintsUsed === 0 && timeSeconds <= parSeconds) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}
