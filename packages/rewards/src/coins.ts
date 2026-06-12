/** Coin reward constants (PRD §12). */
export const COIN_REWARDS = {
  puzzleCompletion: 20,
  perfectSolve: 50,
  noHintBonus: 30,
  dailyChallenge: 100,
} as const;

export interface SolveOutcome {
  /** Did the player finish with zero mistakes AND zero hints? */
  perfect: boolean;
  /** Did the player use any hints? */
  usedHint: boolean;
  /** Is this a daily challenge solve? */
  isDaily: boolean;
}

export interface CoinBreakdown {
  base: number;
  perfect: number;
  noHint: number;
  daily: number;
  total: number;
}

/**
 * Compute coins for a solve. Bonuses stack: completion is always paid; a
 * perfect solve and/or a no-hint run add their bonuses; daily adds its bonus.
 */
export function coinsForSolve(outcome: SolveOutcome): CoinBreakdown {
  const base = COIN_REWARDS.puzzleCompletion;
  const perfect = outcome.perfect ? COIN_REWARDS.perfectSolve : 0;
  const noHint = !outcome.usedHint ? COIN_REWARDS.noHintBonus : 0;
  const daily = outcome.isDaily ? COIN_REWARDS.dailyChallenge : 0;
  return { base, perfect, noHint, daily, total: base + perfect + noHint + daily };
}

/** Apply a rewarded-ad multiplier (e.g. "Double Coins", PRD §22). */
export function applyCoinMultiplier(total: number, multiplier: number): number {
  return Math.round(total * multiplier);
}
