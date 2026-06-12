import { describe, it, expect } from 'vitest';
import { rectStatus, boardState, isSolved, generatePuzzle, type Clue } from '../src/index.js';

describe('rectStatus', () => {
  const clues: Clue[] = [
    { r: 0, c: 0, value: 2 },
    { r: 1, c: 0, value: 2 },
  ];

  it('flags a valid rectangle', () => {
    expect(rectStatus({ r: 0, c: 0, h: 1, w: 2 }, clues).valid).toBe(true);
  });

  it('flags wrong area', () => {
    const s = rectStatus({ r: 0, c: 0, h: 1, w: 1 }, clues);
    expect(s.oneClue).toBe(true);
    expect(s.areaMatches).toBe(false);
    expect(s.valid).toBe(false);
  });

  it('flags rectangles covering two clues', () => {
    expect(rectStatus({ r: 0, c: 0, h: 2, w: 2 }, clues).oneClue).toBe(false);
  });
});

describe('boardState', () => {
  it('detects overlap and uncovered cells', () => {
    const s = boardState([{ r: 0, c: 0, h: 1, w: 2 }, { r: 0, c: 1, h: 1, w: 1 }], 2, 2);
    expect(s.hasOverlap).toBe(true);
    expect(s.uncovered).toBe(2); // bottom row uncovered
  });
});

describe('isSolved', () => {
  const clues: Clue[] = [
    { r: 0, c: 0, value: 2 },
    { r: 1, c: 0, value: 2 },
  ];

  it('accepts a correct tiling', () => {
    const rects = [
      { r: 0, c: 0, h: 1, w: 2 },
      { r: 1, c: 0, h: 1, w: 2 },
    ];
    expect(isSolved(rects, clues, 2, 2)).toBe(true);
  });

  it('rejects gaps', () => {
    expect(isSolved([{ r: 0, c: 0, h: 1, w: 2 }], clues, 2, 2)).toBe(false);
  });

  it('accepts the generator solution rendered as player rects', () => {
    const { puzzle, solution } = generatePuzzle({ rows: 6, cols: 6, seed: 5, difficulty: 'medium' });
    const playerRects = solution.map(({ r, c, h, w }) => ({ r, c, h, w }));
    expect(isSolved(playerRects, puzzle.clues, puzzle.rows, puzzle.cols)).toBe(true);
  });
});
