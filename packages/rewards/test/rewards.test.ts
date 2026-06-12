import { describe, it, expect } from 'vitest';
import {
  coinsForSolve,
  applyCoinMultiplier,
  xpForLevel,
  levelFromXp,
  addXp,
  registerDailyCompletion,
  claimLoginReward,
  streakMultiplier,
  LOGIN_CYCLE,
} from '../src/index.js';

describe('coins', () => {
  it('pays only base for a hinted, imperfect, non-daily solve', () => {
    expect(coinsForSolve({ perfect: false, usedHint: true, isDaily: false }).total).toBe(20);
  });

  it('stacks perfect + no-hint bonuses', () => {
    const b = coinsForSolve({ perfect: true, usedHint: false, isDaily: false });
    expect(b.total).toBe(20 + 50 + 30);
  });

  it('adds the daily bonus', () => {
    const b = coinsForSolve({ perfect: false, usedHint: true, isDaily: true });
    expect(b.total).toBe(20 + 100);
  });

  it('applies a coin multiplier', () => {
    expect(applyCoinMultiplier(70, 2)).toBe(140);
  });
});

describe('xp / levels', () => {
  it('matches the PRD anchor curve', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(250);
    expect(xpForLevel(4)).toBe(500);
  });

  it('xp thresholds are strictly increasing', () => {
    for (let lvl = 1; lvl < 30; lvl++) {
      expect(xpForLevel(lvl + 1)).toBeGreaterThan(xpForLevel(lvl));
    }
  });

  it('resolves a level from total xp', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3);
  });

  it('detects level-ups when adding xp', () => {
    const r = addXp(90, 20); // crosses 100 -> level 2
    expect(r.leveledUp).toBe(true);
    expect(r.after.level).toBe(2);
  });
});

describe('streak', () => {
  it('starts at 1 on first completion', () => {
    const r = registerDailyCompletion({ current: 0, longest: 0, lastDailyKey: null }, '2026-06-12');
    expect(r.current).toBe(1);
  });

  it('increments on consecutive days', () => {
    const r = registerDailyCompletion(
      { current: 3, longest: 3, lastDailyKey: '2026-06-11' },
      '2026-06-12',
    );
    expect(r.current).toBe(4);
    expect(r.longest).toBe(4);
  });

  it('resets after a gap', () => {
    const r = registerDailyCompletion(
      { current: 9, longest: 9, lastDailyKey: '2026-06-10' },
      '2026-06-12',
    );
    expect(r.current).toBe(1);
    expect(r.longest).toBe(9); // longest preserved
  });

  it('is idempotent for the same day', () => {
    const r = registerDailyCompletion(
      { current: 5, longest: 5, lastDailyKey: '2026-06-12' },
      '2026-06-12',
    );
    expect(r.current).toBe(5);
  });

  it('multiplier tiers follow the PRD', () => {
    expect(streakMultiplier(1)).toBe(1);
    expect(streakMultiplier(7)).toBe(2);
    expect(streakMultiplier(30)).toBe(5);
  });
});

describe('login rewards', () => {
  it('grants day 1 on first ever claim', () => {
    const r = claimLoginReward({ lastLoginRewardKey: null, loginCycleDay: 0 }, '2026-06-12');
    expect(r.claimable).toBe(true);
    expect(r.reward).toEqual(LOGIN_CYCLE[0]);
    expect(r.loginCycleDay).toBe(0);
  });

  it('cannot claim twice in one day', () => {
    const r = claimLoginReward({ lastLoginRewardKey: '2026-06-12', loginCycleDay: 0 }, '2026-06-12');
    expect(r.claimable).toBe(false);
  });

  it('wraps the 7-day cycle', () => {
    const r = claimLoginReward({ lastLoginRewardKey: '2026-06-12', loginCycleDay: 6 }, '2026-06-13');
    expect(r.claimable).toBe(true);
    expect(r.loginCycleDay).toBe(0);
  });
});
