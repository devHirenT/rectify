/**
 * Deterministic, seedable pseudo-random number generator.
 *
 * We avoid Math.random() entirely so that puzzle generation is fully
 * reproducible — essential for the daily challenge (same seed -> same puzzle
 * for every player) and for debugging generated levels.
 */

export class Rng {
  private state: number;

  constructor(seed: number) {
    // Coerce into a non-zero 32-bit unsigned integer.
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  /** Mulberry32 — fast, well-distributed 32-bit PRNG. Returns [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Returns true with the given probability (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Pick a random element from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]!;
  }

  /** In-place Fisher-Yates shuffle; returns the same array for chaining. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }
}

/**
 * Hash an arbitrary string into a 32-bit seed (FNV-1a variant).
 * Used to turn a date string like "2026-06-12" into a numeric seed.
 */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
