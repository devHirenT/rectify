import type { Rect, Clue } from './types.js';

/** Flatten a (row, col) coordinate into a single array index. */
export function idx(r: number, c: number, cols: number): number {
  return r * cols + c;
}

/** True if the rectangle lies fully within a rows×cols grid. */
export function inBounds(rect: Rect, rows: number, cols: number): boolean {
  return (
    rect.r >= 0 &&
    rect.c >= 0 &&
    rect.r + rect.h <= rows &&
    rect.c + rect.w <= cols
  );
}

/** True if (r, c) is one of the cells covered by the rectangle. */
export function rectContains(rect: Rect, r: number, c: number): boolean {
  return (
    r >= rect.r && r < rect.r + rect.h && c >= rect.c && c < rect.c + rect.w
  );
}

export function area(rect: Rect): number {
  return rect.h * rect.w;
}

/** All integer (height, width) pairs whose product equals `n`. */
export function factorPairs(n: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let h = 1; h <= n; h++) {
    if (n % h === 0) pairs.push([h, n / h]);
  }
  return pairs;
}

/**
 * Count how many of the given clues fall inside the rectangle.
 * A valid Shikaku rectangle must contain exactly one clue.
 */
export function clueCountInside(rect: Rect, clues: Clue[]): number {
  let count = 0;
  for (const clue of clues) {
    if (rectContains(rect, clue.r, clue.c)) count++;
  }
  return count;
}
