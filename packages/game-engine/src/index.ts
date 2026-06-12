/**
 * @shikaku/game-engine
 *
 * Platform-agnostic Shikaku puzzle engine: generation, solving, uniqueness
 * validation, difficulty scoring, and the deterministic daily challenge.
 * Pure TypeScript with no platform dependencies — shared by the mobile (React
 * Native) and web (Next.js) apps.
 */

export * from './types.js';
export { Rng, hashSeed } from './prng.js';
export { solve, hasUniqueSolution, validateSolution } from './solver.js';
export { generatePuzzle } from './generator.js';
export {
  scoreDifficulty,
  targetScore,
  computeStars,
  DIFFICULTY_SIZES,
} from './difficulty.js';
export { generateDailyChallenge, dateKey } from './daily.js';
export {
  idx,
  inBounds,
  rectContains,
  area,
  factorPairs,
  clueCountInside,
} from './grid.js';
export {
  rectStatus,
  boardState,
  isSolved,
  type PlayerRect,
  type RectStatus,
  type BoardState,
} from './play.js';
