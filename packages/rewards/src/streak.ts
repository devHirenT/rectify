/**
 * Daily streak and login-reward logic (PRD §17, §18).
 *
 * Operates purely on UTC date keys (YYYY-MM-DD) so it stays deterministic and
 * timezone-stable, matching the daily challenge.
 */

export interface StreakInput {
  current: number;
  longest: number;
  lastDailyKey: string | null;
}

export interface StreakResult {
  current: number;
  longest: number;
  lastDailyKey: string;
  /** Streak reward multiplier earned at this streak length (PRD §17). */
  multiplier: number;
}

function dayNumber(key: string): number {
  // Days since epoch from a YYYY-MM-DD key (UTC, no DST concerns).
  return Math.floor(Date.parse(key + 'T00:00:00Z') / 86_400_000);
}

/** Streak reward multiplier by streak length: Day1 x1, Day7 x2, Day30 x5. */
export function streakMultiplier(current: number): number {
  if (current >= 30) return 5;
  if (current >= 7) return 2;
  return 1;
}

/**
 * Register a daily-challenge completion for `todayKey`.
 *  - Same day already counted -> no change.
 *  - Consecutive day -> streak increments.
 *  - Gap of 2+ days -> streak resets to 1.
 */
export function registerDailyCompletion(
  input: StreakInput,
  todayKey: string,
): StreakResult {
  let current: number;

  if (input.lastDailyKey === todayKey) {
    current = input.current; // already counted today
  } else if (input.lastDailyKey == null) {
    current = 1;
  } else {
    const gap = dayNumber(todayKey) - dayNumber(input.lastDailyKey);
    current = gap === 1 ? input.current + 1 : 1;
  }

  const longest = Math.max(input.longest, current);
  return { current, longest, lastDailyKey: todayKey, multiplier: streakMultiplier(current) };
}

/** A single day's entry in the 7-day login cycle (PRD §18). */
export type LoginReward =
  | { kind: 'coins'; amount: number }
  | { kind: 'hint'; amount: number }
  | { kind: 'themeFragment'; amount: number }
  | { kind: 'premiumChest' };

/** The fixed 7-day login reward cycle. */
export const LOGIN_CYCLE: LoginReward[] = [
  { kind: 'coins', amount: 50 },
  { kind: 'coins', amount: 100 },
  { kind: 'coins', amount: 150 },
  { kind: 'hint', amount: 1 },
  { kind: 'coins', amount: 250 },
  { kind: 'themeFragment', amount: 1 },
  { kind: 'premiumChest' },
];

export interface LoginInput {
  lastLoginRewardKey: string | null;
  loginCycleDay: number; // 0..6, the day index claimed last
}

export interface LoginResult {
  claimable: boolean;
  reward: LoginReward | null;
  /** New cycle position to persist (0..6). */
  loginCycleDay: number;
  lastLoginRewardKey: string;
}

/**
 * Determine today's claimable login reward.
 *  - Already claimed today -> not claimable.
 *  - Otherwise advance the 7-day cycle (wrapping after day 7).
 */
export function claimLoginReward(input: LoginInput, todayKey: string): LoginResult {
  if (input.lastLoginRewardKey === todayKey) {
    return {
      claimable: false,
      reward: null,
      loginCycleDay: input.loginCycleDay,
      lastLoginRewardKey: todayKey,
    };
  }

  const nextDay =
    input.lastLoginRewardKey == null ? 0 : (input.loginCycleDay + 1) % LOGIN_CYCLE.length;

  return {
    claimable: true,
    reward: LOGIN_CYCLE[nextDay]!,
    loginCycleDay: nextDay,
    lastLoginRewardKey: todayKey,
  };
}
