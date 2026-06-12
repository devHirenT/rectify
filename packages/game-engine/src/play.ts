import type { Clue, Rect } from './types.js';
import { area, clueCountInside, rectContains } from './grid.js';

/**
 * Player-facing grading helpers. The board lets the player draw rectangles
 * freely (untagged), so these derive correctness directly from the clue set —
 * complementary to the generator-oriented `validateSolution`.
 */

/** A rectangle the player has drawn on the board. */
export type PlayerRect = Rect;

export interface RectStatus {
  /** Contains exactly one clue. */
  oneClue: boolean;
  /** Its area matches the contained clue's value (only meaningful if oneClue). */
  areaMatches: boolean;
  /** Fully correct rectangle: exactly one clue and matching area. */
  valid: boolean;
}

/** Grade a single drawn rectangle against the clue set. */
export function rectStatus(rect: Rect, clues: Clue[]): RectStatus {
  const count = clueCountInside(rect, clues);
  const oneClue = count === 1;
  let areaMatches = false;
  if (oneClue) {
    const clue = clues.find((c) => rectContains(rect, c.r, c.c))!;
    areaMatches = area(rect) === clue.value;
  }
  return { oneClue, areaMatches, valid: oneClue && areaMatches };
}

export interface BoardState {
  /** Cell index -> how many drawn rectangles cover it (1 = ok, >1 = overlap). */
  coverage: Int16Array;
  /** True if any two drawn rectangles overlap. */
  hasOverlap: boolean;
  /** Number of cells not covered by any rectangle. */
  uncovered: number;
}

/** Compute coverage / overlap state for a set of drawn rectangles. */
export function boardState(rects: Rect[], rows: number, cols: number): BoardState {
  const coverage = new Int16Array(rows * cols);
  let hasOverlap = false;
  for (const rect of rects) {
    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) {
        if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
        const i = r * cols + c;
        coverage[i]!++;
        if (coverage[i]! > 1) hasOverlap = true;
      }
    }
  }
  let uncovered = 0;
  for (let i = 0; i < coverage.length; i++) if (coverage[i] === 0) uncovered++;
  return { coverage, hasOverlap, uncovered };
}

/**
 * True iff the drawn rectangles form a complete, correct Shikaku solution:
 * no overlaps, no gaps, every rectangle valid, every clue covered exactly once.
 */
export function isSolved(rects: Rect[], clues: Clue[], rows: number, cols: number): boolean {
  const state = boardState(rects, rows, cols);
  if (state.hasOverlap || state.uncovered > 0) return false;
  // Every drawn rectangle must be valid.
  for (const rect of rects) {
    if (!rectStatus(rect, clues).valid) return false;
  }
  // Every clue must be covered (guaranteed by no-gap + valid rects, but check).
  for (const clue of clues) {
    if (!rects.some((r) => rectContains(r, clue.r, clue.c))) return false;
  }
  return true;
}
