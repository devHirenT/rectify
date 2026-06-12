import type {
  Clue,
  GenerateOptions,
  GeneratedPuzzle,
  Rect,
  SolutionRect,
} from './types.js';
import { Rng } from './prng.js';
import { area } from './grid.js';
import { hasUniqueSolution } from './solver.js';
import { scoreDifficulty } from './difficulty.js';

/**
 * Recursively split a rectangle into smaller rectangles ("guillotine"
 * partition). Every leaf is axis-aligned and the leaves tile the parent
 * exactly, so the result is always a valid Shikaku rectangle layout.
 */
function partition(
  rect: Rect,
  rng: Rng,
  minArea: number,
  maxArea: number,
  out: Rect[],
): void {
  const a = area(rect);

  // Decide whether to stop splitting. Larger rectangles are more likely to
  // split; rectangles at or below minArea*2 may stop to create variety.
  const mustSplit = a > maxArea;
  const canSplit = rect.h > 1 || rect.w > 1;
  const wantStop = a <= maxArea && rng.chance(stopProbability(a, minArea, maxArea));

  if (!canSplit || (!mustSplit && wantStop && a >= minArea)) {
    out.push(rect);
    return;
  }

  // Choose split orientation. Prefer splitting the longer side to avoid skinny
  // rectangles, with some randomness.
  const canVertical = rect.w > 1; // produces left/right halves
  const canHorizontal = rect.h > 1; // produces top/bottom halves
  let vertical: boolean;
  if (canVertical && canHorizontal) {
    vertical = rect.w === rect.h ? rng.chance(0.5) : rect.w > rect.h;
    // Inject randomness so layouts aren't always split on the long side.
    if (rng.chance(0.35)) vertical = !vertical;
  } else {
    vertical = canVertical;
  }

  if (vertical) {
    const cut = rng.int(1, rect.w - 1);
    partition({ r: rect.r, c: rect.c, h: rect.h, w: cut }, rng, minArea, maxArea, out);
    partition(
      { r: rect.r, c: rect.c + cut, h: rect.h, w: rect.w - cut },
      rng,
      minArea,
      maxArea,
      out,
    );
  } else {
    const cut = rng.int(1, rect.h - 1);
    partition({ r: rect.r, c: rect.c, h: cut, w: rect.w }, rng, minArea, maxArea, out);
    partition(
      { r: rect.r + cut, c: rect.c, h: rect.h - cut, w: rect.w },
      rng,
      minArea,
      maxArea,
      out,
    );
  }
}

/** Probability of stopping the recursion, rising as area approaches minArea. */
function stopProbability(a: number, minArea: number, maxArea: number): number {
  if (a <= minArea) return 1;
  const t = (a - minArea) / Math.max(1, maxArea - minArea);
  // Closer to minArea -> higher stop chance.
  return Math.max(0.1, 0.85 - t * 0.7);
}

/** Place one clue per rectangle at a random interior cell; value = its area. */
function placeClues(rects: Rect[], rng: Rng): { clues: Clue[]; solution: SolutionRect[] } {
  const clues: Clue[] = [];
  const solution: SolutionRect[] = [];

  rects.forEach((rect, clueIndex) => {
    const r = rect.r + rng.int(0, rect.h - 1);
    const c = rect.c + rng.int(0, rect.w - 1);
    clues.push({ r, c, value: area(rect) });
    solution.push({ ...rect, clueIndex });
  });

  return { clues, solution };
}

const DEFAULT_MAX_ATTEMPTS = 40;

/**
 * Generate a uniquely-solvable Shikaku puzzle.
 *
 * Strategy: build a random guillotine partition, place clues, then verify the
 * clue set admits exactly one tiling. Clue placement strongly affects
 * uniqueness, so we retry placement a few times per layout before regenerating
 * the layout entirely. Deterministic given `seed`.
 */
export function generatePuzzle(options: GenerateOptions): GeneratedPuzzle {
  const {
    rows,
    cols,
    seed,
    difficulty,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  } = options;

  const total = rows * cols;
  const minArea = options.minArea ?? defaultMinArea(rows, cols);
  const maxArea = options.maxArea ?? defaultMaxArea(rows, cols);

  const rng = new Rng(seed);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rects: Rect[] = [];
    partition({ r: 0, c: 0, h: rows, w: cols }, rng, minArea, maxArea, rects);

    // Sanity: a guillotine partition always tiles the grid, but assert anyway.
    const partitionArea = rects.reduce((acc, rc) => acc + area(rc), 0);
    if (partitionArea !== total) continue;

    // Try a few clue placements on this layout before discarding it.
    for (let p = 0; p < 4; p++) {
      const { clues, solution } = placeClues(rects, rng);
      if (hasUniqueSolution(clues, rows, cols)) {
        const score = scoreDifficulty(clues, rows, cols);
        return {
          puzzle: {
            id: `gen-${seed}-${attempt}`,
            rows,
            cols,
            clues,
            difficulty,
            seed,
            score,
          },
          solution,
        };
      }
    }
  }

  // Fallback: a coarse partition (few large rectangles) is far more likely to
  // be uniquely solvable. Guarantees we always return a valid puzzle.
  return generateFallback(rows, cols, seed, difficulty);
}

/** Last-resort generator: split into a small number of big rectangles. */
function generateFallback(
  rows: number,
  cols: number,
  seed: number,
  difficulty: GenerateOptions['difficulty'],
): GeneratedPuzzle {
  const rng = new Rng(seed ^ 0x5bd1e995);
  const big = Math.max(rows * cols, 1);
  for (let attempt = 0; attempt < 200; attempt++) {
    const rects: Rect[] = [];
    partition({ r: 0, c: 0, h: rows, w: cols }, rng, Math.ceil(big / 6), big, rects);
    const { clues, solution } = placeClues(rects, rng);
    if (hasUniqueSolution(clues, rows, cols)) {
      return {
        puzzle: {
          id: `gen-${seed}-fallback`,
          rows,
          cols,
          clues,
          difficulty,
          seed,
          score: scoreDifficulty(clues, rows, cols),
        },
        solution,
      };
    }
  }

  // Absolute floor: one rectangle covering the whole grid — trivially unique.
  const clues: Clue[] = [{ r: 0, c: 0, value: rows * cols }];
  const solution: SolutionRect[] = [{ r: 0, c: 0, h: rows, w: cols, clueIndex: 0 }];
  return {
    puzzle: {
      id: `gen-${seed}-trivial`,
      rows,
      cols,
      clues,
      difficulty,
      seed,
      score: 0,
    },
    solution,
  };
}

function defaultMinArea(rows: number, cols: number): number {
  return rows * cols <= 25 ? 1 : 2;
}

function defaultMaxArea(rows: number, cols: number): number {
  // Cap rectangle size so puzzles stay readable as the grid grows.
  return Math.max(6, Math.round((rows * cols) / 8));
}
