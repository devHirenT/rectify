/**
 * @shikaku/rewards
 *
 * Pure game-economy logic: coin payouts, XP/level progression, daily streaks,
 * and the 7-day login reward cycle. No I/O — callers persist results via
 * @shikaku/storage.
 */

export * from './coins.js';
export * from './xp.js';
export * from './streak.js';
