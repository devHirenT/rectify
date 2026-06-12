/**
 * Core domain types for the Shikaku puzzle engine.
 *
 * Shikaku rules:
 *  - The grid is divided into rectangles.
 *  - Each rectangle contains exactly one numbered clue.
 *  - The area of a rectangle equals the value of its clue.
 *  - Rectangles tile the grid completely without overlap.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'infinite';

/** A clue is a number placed at a cell; the rectangle owning it must have this area. */
export interface Clue {
  /** Row index (0-based, top to bottom). */
  r: number;
  /** Column index (0-based, left to right). */
  c: number;
  /** The required area of the owning rectangle. */
  value: number;
}

/**
 * A rectangle on the grid, described by its top-left anchor and size.
 * Covers rows [r .. r + h - 1] and columns [c .. c + w - 1].
 */
export interface Rect {
  r: number;
  c: number;
  /** Height in cells (number of rows). */
  h: number;
  /** Width in cells (number of columns). */
  w: number;
}

/** A solved rectangle bound to the index of the clue it satisfies. */
export interface SolutionRect extends Rect {
  /** Index into the puzzle's `clues` array. */
  clueIndex: number;
}

/** An immutable, fully-specified puzzle ready to be played. */
export interface Puzzle {
  /** Stable identifier (e.g. `daily-2026-06-12` or a generated id). */
  id: string;
  rows: number;
  cols: number;
  clues: Clue[];
  difficulty: Difficulty;
  /** Seed used to generate this puzzle (enables reproducibility). */
  seed: number;
  /** Heuristic difficulty score (higher = harder). */
  score: number;
}

/** A puzzle together with its canonical (generator) solution. */
export interface GeneratedPuzzle {
  puzzle: Puzzle;
  solution: SolutionRect[];
}

export interface GenerateOptions {
  rows: number;
  cols: number;
  seed: number;
  difficulty: Difficulty;
  /** Maximum attempts to produce a uniquely-solvable puzzle before giving up. */
  maxAttempts?: number;
  /** Minimum rectangle area allowed in the partition. */
  minArea?: number;
  /** Maximum rectangle area allowed in the partition. */
  maxArea?: number;
}

export type SolveResult =
  | { status: 'unique'; solution: SolutionRect[] }
  | { status: 'multiple'; solution: SolutionRect[] }
  | { status: 'none' };
