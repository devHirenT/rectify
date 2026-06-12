import { describe, it, expect } from 'vitest';
import {
  generatePuzzle,
  solve,
  hasUniqueSolution,
  validateSolution,
  generateDailyChallenge,
  dateKey,
  Rng,
  hashSeed,
  factorPairs,
  type Difficulty,
} from '../src/index.js';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces ints within range', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('hashSeed is stable and order-sensitive', () => {
    expect(hashSeed('2026-06-12')).toBe(hashSeed('2026-06-12'));
    expect(hashSeed('ab')).not.toBe(hashSeed('ba'));
  });
});

describe('factorPairs', () => {
  it('returns all factor pairs', () => {
    expect(factorPairs(6)).toEqual([
      [1, 6],
      [2, 3],
      [3, 2],
      [6, 1],
    ]);
    expect(factorPairs(7)).toEqual([
      [1, 7],
      [7, 1],
    ]);
  });
});

describe('solver', () => {
  it('finds the unique solution of a hand-made puzzle', () => {
    // 2x2 grid split into two 1x2 horizontal rectangles.
    const clues = [
      { r: 0, c: 0, value: 2 },
      { r: 1, c: 0, value: 2 },
    ];
    const res = solve(clues, 2, 2);
    expect(res.status).toBe('unique');
  });

  it('detects an ambiguous (multiple-solution) puzzle', () => {
    // 2x2 with two area-2 clues on the diagonal admits two tilings
    // (two horizontal 1x2 strips OR two vertical 2x1 strips).
    const clues = [
      { r: 0, c: 0, value: 2 },
      { r: 1, c: 1, value: 2 },
    ];
    expect(solve(clues, 2, 2).status).toBe('multiple');
  });

  it('returns none when clue areas do not fill the grid', () => {
    const clues = [{ r: 0, c: 0, value: 2 }];
    expect(solve(clues, 2, 2).status).toBe('none');
  });

  it('returns none when no valid tiling exists', () => {
    // Single clue of area 4 on a 2x2 grid, but value mismatch with placement
    // making no rectangle of area 3 — use unsatisfiable areas.
    const clues = [
      { r: 0, c: 0, value: 1 },
      { r: 0, c: 1, value: 3 },
    ];
    // Area-3 rectangle (1x3 or 3x1) cannot fit in a 2-wide/2-tall grid.
    expect(solve(clues, 2, 2).status).toBe('none');
  });
});

describe('generatePuzzle', () => {
  const cases: Array<{ d: Difficulty; rows: number; cols: number }> = [
    { d: 'easy', rows: 4, cols: 4 },
    { d: 'easy', rows: 5, cols: 5 },
    { d: 'medium', rows: 6, cols: 6 },
    { d: 'medium', rows: 7, cols: 7 },
    { d: 'hard', rows: 8, cols: 8 },
    { d: 'hard', rows: 9, cols: 9 },
    { d: 'expert', rows: 10, cols: 10 },
  ];

  for (const { d, rows, cols } of cases) {
    it(`generates a uniquely-solvable ${rows}x${cols} (${d}) puzzle`, () => {
      const { puzzle, solution } = generatePuzzle({
        rows,
        cols,
        seed: rows * 1000 + cols,
        difficulty: d,
      });

      // Clue areas fill the grid.
      const sum = puzzle.clues.reduce((a, c) => a + c.value, 0);
      expect(sum).toBe(rows * cols);

      // The generator's own solution is valid.
      expect(validateSolution(solution, puzzle.clues, rows, cols)).toBe(true);

      // And the puzzle is uniquely solvable.
      expect(hasUniqueSolution(puzzle.clues, rows, cols)).toBe(true);
    });
  }

  it('is deterministic: same seed yields identical puzzle', () => {
    const a = generatePuzzle({ rows: 6, cols: 6, seed: 999, difficulty: 'medium' });
    const b = generatePuzzle({ rows: 6, cols: 6, seed: 999, difficulty: 'medium' });
    expect(a.puzzle.clues).toEqual(b.puzzle.clues);
  });

  it('different seeds usually yield different puzzles', () => {
    const a = generatePuzzle({ rows: 6, cols: 6, seed: 1, difficulty: 'medium' });
    const b = generatePuzzle({ rows: 6, cols: 6, seed: 2, difficulty: 'medium' });
    expect(a.puzzle.clues).not.toEqual(b.puzzle.clues);
  });
});

describe('daily challenge', () => {
  it('formats the date key in UTC', () => {
    expect(dateKey(new Date(Date.UTC(2026, 5, 12)))).toBe('2026-06-12');
  });

  it('produces the same puzzle for the same date', () => {
    const date = new Date(Date.UTC(2026, 5, 12));
    const a = generateDailyChallenge(date);
    const b = generateDailyChallenge(date);
    expect(a.puzzle.id).toBe('daily-2026-06-12');
    expect(a.puzzle.clues).toEqual(b.puzzle.clues);
  });

  it('produces different puzzles on different dates', () => {
    const a = generateDailyChallenge(new Date(Date.UTC(2026, 5, 12)));
    const b = generateDailyChallenge(new Date(Date.UTC(2026, 5, 13)));
    expect(a.puzzle.clues).not.toEqual(b.puzzle.clues);
  });

  it('the daily puzzle is uniquely solvable', () => {
    const { puzzle } = generateDailyChallenge(new Date(Date.UTC(2026, 5, 12)));
    expect(hasUniqueSolution(puzzle.clues, puzzle.rows, puzzle.cols)).toBe(true);
  });
});
