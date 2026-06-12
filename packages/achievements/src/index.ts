/**
 * @shikaku/achievements
 *
 * Achievement catalog (PRD §15) plus a pure progress engine. Given a running
 * tally of player metrics, it reports which achievements are unlocked and how
 * close the locked ones are.
 */

export type AchievementCategory = 'progress' | 'skill' | 'collection' | 'streak';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  /** Which metric this tracks and the threshold to unlock. */
  metric: keyof PlayerMetrics;
  threshold: number;
}

/** Running counters the engine evaluates against. */
export interface PlayerMetrics {
  puzzlesSolved: number;
  perfectSolves: number;
  noHintSolves: number;
  fastSolves: number;
  longestStreak: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Progress (puzzles solved)
  mk('first_puzzle', 'First Puzzle', 'Solve your first puzzle', 'progress', 'puzzlesSolved', 1),
  mk('puzzles_10', '10 Puzzles', 'Solve 10 puzzles', 'progress', 'puzzlesSolved', 10),
  mk('puzzles_50', '50 Puzzles', 'Solve 50 puzzles', 'progress', 'puzzlesSolved', 50),
  mk('puzzles_100', '100 Puzzles', 'Solve 100 puzzles', 'progress', 'puzzlesSolved', 100),
  mk('puzzles_500', '500 Puzzles', 'Solve 500 puzzles', 'progress', 'puzzlesSolved', 500),
  mk('puzzles_1000', '1000 Puzzles', 'Solve 1000 puzzles', 'progress', 'puzzlesSolved', 1000),
  // Skill
  mk('perfect_solve', 'Perfect Solve', 'Solve with no mistakes and no hints', 'skill', 'perfectSolves', 1),
  mk('perfect_100', '100 Perfect Solves', 'Achieve 100 perfect solves', 'skill', 'perfectSolves', 100),
  mk('no_hint_master', 'No Hint Master', 'Solve 50 puzzles without hints', 'skill', 'noHintSolves', 50),
  mk('speed_runner', 'Speed Runner', 'Solve 25 puzzles under par time', 'skill', 'fastSolves', 25),
  // Streak
  mk('streak_7', '7 Day Streak', 'Maintain a 7-day streak', 'streak', 'longestStreak', 7),
  mk('streak_30', '30 Day Streak', 'Maintain a 30-day streak', 'streak', 'longestStreak', 30),
  mk('streak_100', '100 Day Streak', 'Maintain a 100-day streak', 'streak', 'longestStreak', 100),
];

function mk(
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  metric: keyof PlayerMetrics,
  threshold: number,
): Achievement {
  return { id, title, description, category, metric, threshold };
}

export interface AchievementProgress {
  achievement: Achievement;
  current: number;
  unlocked: boolean;
  /** Fraction 0..1 toward unlocking. */
  ratio: number;
}

/** Compute progress for every achievement against the current metrics. */
export function evaluate(metrics: PlayerMetrics): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => {
    const current = metrics[a.metric];
    const unlocked = current >= a.threshold;
    return {
      achievement: a,
      current,
      unlocked,
      ratio: Math.min(1, current / a.threshold),
    };
  });
}

/**
 * Given the previously-unlocked id set and fresh metrics, return the ids that
 * have *newly* unlocked. Callers fire celebration haptics/audio for these.
 */
export function newlyUnlocked(
  metrics: PlayerMetrics,
  alreadyUnlocked: Record<string, true>,
): Achievement[] {
  return evaluate(metrics)
    .filter((p) => p.unlocked && !alreadyUnlocked[p.achievement.id])
    .map((p) => p.achievement);
}
