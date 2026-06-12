import { describe, it, expect } from 'vitest';
import { evaluate, newlyUnlocked, ACHIEVEMENTS, type PlayerMetrics } from '../src/index.js';

const zero: PlayerMetrics = {
  puzzlesSolved: 0,
  perfectSolves: 0,
  noHintSolves: 0,
  fastSolves: 0,
  longestStreak: 0,
};

describe('achievements', () => {
  it('has a unique id per achievement', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(ids.size).toBe(ACHIEVEMENTS.length);
  });

  it('unlocks first_puzzle at one solve', () => {
    const progress = evaluate({ ...zero, puzzlesSolved: 1 });
    const first = progress.find((p) => p.achievement.id === 'first_puzzle')!;
    expect(first.unlocked).toBe(true);
  });

  it('reports partial ratio toward locked achievements', () => {
    const progress = evaluate({ ...zero, puzzlesSolved: 25 });
    const p50 = progress.find((p) => p.achievement.id === 'puzzles_50')!;
    expect(p50.unlocked).toBe(false);
    expect(p50.ratio).toBeCloseTo(0.5);
  });

  it('returns only newly unlocked achievements', () => {
    const metrics = { ...zero, puzzlesSolved: 10 };
    const fresh = newlyUnlocked(metrics, { first_puzzle: true });
    const ids = fresh.map((a) => a.id);
    expect(ids).toContain('puzzles_10');
    expect(ids).not.toContain('first_puzzle'); // already unlocked
  });

  it('clamps ratio at 1', () => {
    const progress = evaluate({ ...zero, longestStreak: 999 });
    const s100 = progress.find((p) => p.achievement.id === 'streak_100')!;
    expect(s100.ratio).toBe(1);
  });
});
