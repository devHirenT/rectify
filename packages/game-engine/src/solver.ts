import type { Clue, SolutionRect, SolveResult } from './types.js';
import { area, clueCountInside, factorPairs, idx, rectContains } from './grid.js';

/**
 * Exact-cover solver for Shikaku.
 *
 * The puzzle is solvable iff we can choose, for each clue, one rectangle of the
 * clue's area that contains the clue cell, such that the chosen rectangles tile
 * the whole grid with no overlap. We model this as exact cover and backtrack,
 * counting solutions up to a cap so we can prove uniqueness.
 */

interface Candidate {
  clueIndex: number;
  /** Cell indices covered by this candidate rectangle. */
  cells: number[];
  rect: SolutionRect;
}

/**
 * Enumerate every legal rectangle for each clue: correct area, contains its own
 * clue cell, in bounds, and containing no *other* clue.
 */
function buildCandidates(
  clues: Clue[],
  rows: number,
  cols: number,
): Candidate[] {
  const candidates: Candidate[] = [];

  clues.forEach((clue, clueIndex) => {
    for (const [h, w] of factorPairs(clue.value)) {
      // Top-left positions such that the rectangle covers (clue.r, clue.c).
      const r0min = Math.max(0, clue.r - h + 1);
      const r0max = Math.min(clue.r, rows - h);
      const c0min = Math.max(0, clue.c - w + 1);
      const c0max = Math.min(clue.c, cols - w);

      for (let r0 = r0min; r0 <= r0max; r0++) {
        for (let c0 = c0min; c0 <= c0max; c0++) {
          const rect: SolutionRect = { r: r0, c: c0, h, w, clueIndex };
          // Reject rectangles that swallow another clue.
          if (clueCountInside(rect, clues) !== 1) continue;

          const cells: number[] = [];
          for (let r = r0; r < r0 + h; r++) {
            for (let c = c0; c < c0 + w; c++) {
              cells.push(idx(r, c, cols));
            }
          }
          candidates.push({ clueIndex, cells, rect });
        }
      }
    }
  });

  return candidates;
}

/**
 * Solve the puzzle, counting solutions up to 2 (enough to decide uniqueness).
 *
 * Returns the first solution found plus a status flag:
 *  - `none`     no valid tiling exists
 *  - `unique`   exactly one tiling
 *  - `multiple` two or more tilings (ambiguous puzzle)
 */
export function solve(clues: Clue[], rows: number, cols: number): SolveResult {
  const total = rows * cols;

  // Sanity: clue areas must sum to the grid area, else no full tiling exists.
  const sum = clues.reduce((acc, c) => acc + c.value, 0);
  if (sum !== total) return { status: 'none' };

  const candidates = buildCandidates(clues, rows, cols);

  // For each cell, which candidates cover it; for each clue, its candidates.
  const cellToCandidates: number[][] = Array.from({ length: total }, () => []);
  candidates.forEach((cand, ci) => {
    for (const cell of cand.cells) cellToCandidates[cell]!.push(ci);
  });

  const covered = new Uint8Array(total); // cell -> covered?
  const cluePlaced = new Uint8Array(clues.length);

  let solutionCount = 0;
  let firstSolution: SolutionRect[] | null = null;
  const stack: SolutionRect[] = [];

  /** Index of the first still-uncovered cell, or -1 if fully covered. */
  function firstUncovered(): number {
    for (let i = 0; i < total; i++) if (!covered[i]) return i;
    return -1;
  }

  function canPlace(cand: Candidate): boolean {
    if (cluePlaced[cand.clueIndex]) return false;
    for (const cell of cand.cells) if (covered[cell]) return false;
    return true;
  }

  function place(cand: Candidate): void {
    cluePlaced[cand.clueIndex] = 1;
    for (const cell of cand.cells) covered[cell] = 1;
    stack.push(cand.rect);
  }

  function unplace(cand: Candidate): void {
    cluePlaced[cand.clueIndex] = 0;
    for (const cell of cand.cells) covered[cell] = 0;
    stack.pop();
  }

  function recurse(): void {
    if (solutionCount >= 2) return; // early-out once ambiguity is proven

    const cell = firstUncovered();
    if (cell === -1) {
      solutionCount++;
      if (!firstSolution) firstSolution = stack.slice();
      return;
    }

    // Anchor on the first uncovered cell: exactly one rectangle in any solution
    // covers it, so trying each covering candidate enumerates solutions without
    // duplication.
    for (const ci of cellToCandidates[cell]!) {
      const cand = candidates[ci]!;
      if (!canPlace(cand)) continue;
      place(cand);
      recurse();
      unplace(cand);
      if (solutionCount >= 2) return;
    }
  }

  recurse();

  if (solutionCount === 0 || !firstSolution) return { status: 'none' };
  if (solutionCount === 1) return { status: 'unique', solution: firstSolution };
  return { status: 'multiple', solution: firstSolution };
}

/** Convenience: true iff the clue set has exactly one tiling. */
export function hasUniqueSolution(
  clues: Clue[],
  rows: number,
  cols: number,
): boolean {
  return solve(clues, rows, cols).status === 'unique';
}

/**
 * Validate that a proposed set of rectangles is a correct Shikaku solution for
 * the given clues: every clue owned by exactly one rectangle of matching area,
 * and the rectangles tile the grid exactly.
 */
export function validateSolution(
  rects: SolutionRect[],
  clues: Clue[],
  rows: number,
  cols: number,
): boolean {
  const total = rows * cols;
  const covered = new Uint8Array(total);
  const clueSeen = new Uint8Array(clues.length);

  for (const rect of rects) {
    const clue = clues[rect.clueIndex];
    if (!clue) return false;
    if (clueSeen[rect.clueIndex]) return false; // clue used twice
    clueSeen[rect.clueIndex] = 1;

    if (area(rect) !== clue.value) return false;
    if (!rectContains(rect, clue.r, clue.c)) return false;
    if (clueCountInside(rect, clues) !== 1) return false;

    for (let r = rect.r; r < rect.r + rect.h; r++) {
      for (let c = rect.c; c < rect.c + rect.w; c++) {
        if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
        const i = r * cols + c;
        if (covered[i]) return false; // overlap
        covered[i] = 1;
      }
    }
  }

  if (clueSeen.some((v) => v === 0)) return false; // some clue unused
  for (let i = 0; i < total; i++) if (!covered[i]) return false; // gap
  return true;
}
