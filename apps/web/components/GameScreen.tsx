'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generatePuzzle,
  generateDailyChallenge,
  isSolved,
  rectStatus,
  computeStars,
  hashSeed,
  type Difficulty,
  type Rect,
  type GeneratedPuzzle,
} from '@shikaku/game-engine';
import { coinsForSolve, xpForSolve, addXp, applyCoinMultiplier } from '@shikaku/rewards';
import { saveSavedGame, clearSavedGame, loadSavedGame } from '@shikaku/storage';
import { shouldShowInterstitial } from '@shikaku/ads';
import { useProfile } from '../app/providers';
import { track, ads } from '../lib/services';
import { Board, type BoardHandle } from './Board';
import { Icon, ProgressRing, formatTime, Confetti } from './ui';
import { useAudio } from './useAudio';

interface Props {
  mode: Difficulty | 'daily';
  level?: number;
  /** Restore a previously saved in-progress game for this puzzle. */
  resume?: boolean;
}

const SIZE_FOR: Record<Difficulty, [number, number]> = {
  easy: [6, 6],
  medium: [8, 8],
  hard: [10, 10],
  expert: [11, 11],
  master: [12, 12],
  infinite: [9, 9],
};

const RANK_NAME: Record<string, string> = {
  easy: 'Apprentice',
  medium: 'Strategist',
  hard: 'Grandmaster',
  expert: 'Virtuoso',
  master: 'Logic Master',
  infinite: 'Endless',
  daily: 'Daily',
};

export function GameScreen({ mode, level, resume }: Props) {
  const { profile, update, store } = useProfile();
  const { sound, haptic } = useAudio();
  const router = useRouter();
  const [seedBump, setSeedBump] = useState(0);
  const [paused, setPaused] = useState(false);
  const [adKind, setAdKind] = useState<'double_coins' | 'hint' | null>(null);
  const [adClaimed, setAdClaimed] = useState(false);

  const generated: GeneratedPuzzle = useMemo(() => {
    if (mode === 'daily') return generateDailyChallenge(new Date());
    const [rows, cols] = SIZE_FOR[mode];
    const seed =
      level != null
        ? hashSeed(`${mode}-${level}`)
        : (hashSeed(mode) + seedBump * 104729) >>> 0;
    return generatePuzzle({ rows, cols, seed, difficulty: mode });
  }, [mode, level, seedBump]);

  const { puzzle, solution } = generated;
  const { rows, cols, clues } = puzzle;

  const [placed, setPlaced] = useState<Rect[]>([]);
  const [history, setHistory] = useState<Rect[][]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solvedAt, setSolvedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const pausedAccum = useRef(0);
  const pauseStart = useRef(0);
  const rewardedRef = useRef(false);
  const boardRef = useRef<BoardHandle>(null);
  const [hintFx, setHintFx] = useState<{ rect: Rect; id: number } | null>(null);
  const hintFxId = useRef(0);

  const [boardPx, setBoardPx] = useState(360);
  useEffect(() => {
    const recompute = () => setBoardPx(Math.min(408, Math.max(260, window.innerWidth - 32)));
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);
  const cell = Math.floor(boardPx / cols);

  useEffect(() => {
    setPlaced([]);
    setHistory([]);
    setMistakes(0);
    setHintsUsed(0);
    setSolvedAt(null);
    setElapsed(0);
    setPaused(false);
    setAdKind(null);
    setAdClaimed(false);
    track('puzzle_start', { mode, level: level ?? null });
    startRef.current = Date.now();
    pausedAccum.current = 0;
    rewardedRef.current = false;
  }, [puzzle.id]);

  // Restore a saved in-progress game (runs after the reset above on mount).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!resume || restoredRef.current) return;
    restoredRef.current = true;
    void loadSavedGame(store).then((sg) => {
      if (!sg || sg.mode !== mode || (sg.level ?? null) !== (level ?? null)) return;
      setPlaced(sg.placed.map((p) => ({ ...p })));
      setMistakes(sg.mistakes);
      setHintsUsed(sg.hintsUsed);
      startRef.current = Date.now() - sg.elapsedSeconds * 1000;
    });
  }, [resume, store, mode, level]);

  // Persist the in-progress game (deterministic puzzles only: levels + daily).
  useEffect(() => {
    if (solvedAt != null) return;
    if (mode !== 'daily' && level == null) return;
    if (placed.length === 0 && mistakes === 0 && hintsUsed === 0) return;
    void saveSavedGame(store, {
      mode,
      level: level ?? null,
      rows,
      cols,
      placed: placed.map((p) => ({ r: p.r, c: p.c, h: p.h, w: p.w })),
      mistakes,
      hintsUsed,
      elapsedSeconds: Math.floor((Date.now() - startRef.current - pausedAccum.current) / 1000),
      savedAt: Date.now(),
      label: mode === 'daily' ? 'Daily Challenge' : `${cap(mode)} · Level ${level}`,
    });
  }, [placed, mistakes, hintsUsed, solvedAt, store, mode, level, rows, cols]);

  useEffect(() => {
    if (solvedAt || paused) return;
    const t = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current - pausedAccum.current) / 1000)),
      500,
    );
    return () => clearInterval(t);
  }, [solvedAt, paused, puzzle.id]);

  // Dynamic music: start on mount, stop on unmount.
  useEffect(() => {
    sound.startMusic();
    return () => sound.stopMusic();
  }, [sound]);

  // Drive music intensity from how much of the board is filled (PRD §8).
  const completion = 1 - boardCoverageRatio(placed, rows, cols);
  useEffect(() => {
    sound.setCompletion(completion);
  }, [sound, completion]);

  const solved = isSolved(placed, clues, rows, cols);
  const isDaily = mode === 'daily';

  useEffect(() => {
    if (!solved || rewardedRef.current) return;
    rewardedRef.current = true;
    const time = Math.floor((Date.now() - startRef.current - pausedAccum.current) / 1000);
    setSolvedAt(time);
    sound.play('complete');
    sound.play('coin');
    haptic('complete');
    void clearSavedGame(store); // puzzle finished — no longer resumable

    const stars = computeStars({ mistakes, hintsUsed, timeSeconds: time, parSeconds: rows * cols * 4 });
    const perfect = mistakes === 0 && hintsUsed === 0;
    const coins = coinsForSolve({ perfect, usedHint: hintsUsed > 0, isDaily });
    const xp = xpForSolve({ difficultyScore: puzzle.score, stars, perfect });
    const todayKey = puzzle.id.startsWith('daily-') ? puzzle.id.slice('daily-'.length) : null;

    update((p) => {
      p.coins += coins.total;
      const res = addXp(p.xp, xp);
      p.xp = res.totalXp;
      p.level = res.after.level;
      p.stats.puzzlesSolved += 1;
      if (perfect) p.stats.perfectSolves += 1;
      p.stats.hintsUsed += hintsUsed;
      p.stats.totalTimeSeconds += time;
      p.stats.bestTimeSeconds = p.stats.bestTimeSeconds == null ? time : Math.min(p.stats.bestTimeSeconds, time);
      // Record progress against the STABLE level id (`${mode}-${level}`) so the
      // Level Select screen unlocks the next level and shows earned stars.
      const levelId = mode !== 'daily' && level != null ? `${mode}-${level}` : puzzle.id;
      p.starsByLevel[levelId] = Math.max(p.starsByLevel[levelId] ?? 0, stars);
      p.bestTimeByLevel[levelId] =
        p.bestTimeByLevel[levelId] == null ? time : Math.min(p.bestTimeByLevel[levelId]!, time);
      if (mode !== 'daily' && level != null) {
        const arr = (p.completedLevels[mode] ??= []);
        if (!arr.includes(levelId)) arr.push(levelId);
      }
      // Daily streak.
      if (todayKey && p.streak.lastDailyKey !== todayKey) {
        const prev = p.streak.lastDailyKey;
        const consecutive = prev != null && dayGap(prev, todayKey) === 1;
        p.streak.current = consecutive ? p.streak.current + 1 : 1;
        p.streak.longest = Math.max(p.streak.longest, p.streak.current);
        p.streak.lastDailyKey = todayKey;
      }
    });
    track('puzzle_complete', { mode, level: level ?? null, stars, time, mistakes, hintsUsed, perfect });
    track('reward_claimed', { source: 'solve', coins: coins.total, xp });
  }, [solved]); // eslint-disable-line react-hooks/exhaustive-deps

  function commit(next: Rect[], added: Rect | null) {
    setHistory((h) => [...h, placed]);
    setPlaced(next);
    if (added) {
      if (rectStatus(added, clues).valid) {
        sound.play('correct');
        haptic('correct');
      } else {
        setMistakes((m) => m + 1);
        sound.play('wrong');
        haptic('wrong');
      }
    }
  }
  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      setPlaced(h[h.length - 1]!);
      return h.slice(0, -1);
    });
    sound.play('undo');
  }
  function retry() {
    setHistory((h) => [...h, placed]);
    setPlaced([]);
    sound.play('retry');
  }
  /** Reveal one correct rectangle. */
  function revealHint() {
    const target = solution.find(
      (s) => !placed.some((p) => p.r === s.r && p.c === s.c && p.h === s.h && p.w === s.w),
    );
    if (!target) return;
    const rect: Rect = { r: target.r, c: target.c, h: target.h, w: target.w };
    const survivors = placed.filter((p) => !overlaps(p, rect));
    setHistory((h) => [...h, placed]);
    setPlaced([...survivors, rect]);
    setHintsUsed((n) => n + 1);
    sound.play('hint');
    haptic('hint');
    track('hint_used', { mode, level: level ?? null });
    // Glow pulse on the revealed rectangle.
    const id = ++hintFxId.current;
    setHintFx({ rect, id });
    setTimeout(() => setHintFx((f) => (f?.id === id ? null : f)), 900);
  }

  /** Spend a hint token; if out, offer a rewarded ad to earn one. */
  function hint() {
    if (solvedAt != null) return;
    if (profile.hints > 0) {
      update((p) => void (p.hints -= 1));
      revealHint();
    } else {
      setAdKind('hint'); // open the rewarded-ad sheet
    }
  }

  async function nextLevel() {
    // Interstitial between levels, every 4 completions (PRD §22) — never mid-game.
    if (shouldShowInterstitial(profile.stats.puzzlesSolved)) await ads.showInterstitial();
    if (level != null) router.push(`/game?mode=${mode}&level=${level + 1}`);
    else setSeedBump((n) => n + 1);
  }

  function pause() {
    pauseStart.current = Date.now();
    setPaused(true);
  }
  function resumeFromPause() {
    pausedAccum.current += Date.now() - pauseStart.current;
    setPaused(false);
  }

  const stars =
    solvedAt != null ? computeStars({ mistakes, hintsUsed, timeSeconds: solvedAt, parSeconds: rows * cols * 4 }) : 0;
  const perfect = mistakes === 0 && hintsUsed === 0;
  const coinBreakdown = coinsForSolve({ perfect, usedHint: hintsUsed > 0, isDaily });
  const xpGain = xpForSolve({ difficultyScore: puzzle.score, stars, perfect });
  const title = isDaily ? 'DAILY CHALLENGE' : `${cap(mode)} ${rows}×${cols}`;

  return (
    <main className="app no-nav">
      <header className="topbar">
        <span className="icon-btn">
          <Icon name="menu" />
        </span>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            {title}
          </div>
        </div>
        <span className="pill">
          <Icon name="bulb" size={14} /> <span className="num">{formatTime(solvedAt ?? elapsed)}</span>
        </span>
        <button className="icon-btn" onClick={pause} aria-label="Pause">
          <Icon name="pause" />
        </button>
      </header>

      <div className="game-info">
        <div className="row" style={{ gap: 10 }}>
          <ProgressRing value={profile.level % 10 / 10} size={38}>
            {profile.level}
          </ProgressRing>
          <div>
            <div className="label">Level Progress</div>
            <div className="value">{RANK_NAME[mode]}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="label">Hints</div>
          <div className="hint-dots" style={{ marginTop: 4 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <i key={i} className={i < Math.min(3, profile.hints) ? '' : 'spent'} />
            ))}
            {profile.hints > 3 && <span className="value" style={{ fontSize: '0.8rem', marginLeft: 4 }}>+{profile.hints - 3}</span>}
          </div>
        </div>
      </div>

      <div className="board-wrap">
        <Board
          ref={boardRef}
          {...{ rows, cols, clues, placed, cell, solved }}
          onChange={commit}
          onUi={() => sound.play('uiTap')}
          colorblind={profile.settings.colorblindMode}
          flash={hintFx}
        />
      </div>

      <div className="banner">
        <Icon name="grid" size={18} />
        Drag to draw · Tap to remove · Pinch to zoom · Hold to lock
      </div>

      <div className="controls">
        <button className="ctrl" onClick={undo} disabled={!history.length || !!solvedAt}>
          <Icon name="undo" /> Undo
        </button>
        <button className="ctrl" onClick={retry} disabled={!!solvedAt}>
          <Icon name="retry" /> Retry
        </button>
        <button className="ctrl active" onClick={hint} disabled={!!solvedAt}>
          <Icon name="bulb" /> Hint
        </button>
        <button className="ctrl" onClick={() => boardRef.current?.cycleZoom()} disabled={!!solvedAt}>
          <Icon name="zoom" /> Zoom
        </button>
      </div>

      {/* Pause */}
      {paused && (
        <div className="overlay" onClick={resumeFromPause}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Game Paused</h2>
            <p className="sub">
              <span className="badge" style={{ color: 'var(--accent)' }}>{cap(mode)}</span> · {rows}×{cols} Grid
            </p>
            <div style={{ margin: '14px 0' }}>
              <div className="label" style={{ fontSize: '0.66rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Puzzle Progress
              </div>
              <div className="bar">
                <i style={{ width: `${Math.round((1 - boardCoverageRatio(placed, rows, cols)) * 100)}%` }} />
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button className="btn primary" onClick={resumeFromPause}>
                <Icon name="play" fill size={16} /> Resume
              </button>
              <button className="btn secondary" onClick={() => { retry(); resumeFromPause(); }}>
                <Icon name="retry" size={16} /> Restart Level
              </button>
              <button className="btn ghost" onClick={() => router.push('/settings')}>
                <Icon name="settings" size={16} /> Settings
              </button>
              <button className="btn danger" onClick={() => router.push('/')}>
                <Icon name="exit" size={16} /> Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory */}
      {solvedAt != null && !adKind && (
        <div className="overlay">
          <div className="modal" style={{ position: 'relative', overflow: 'hidden' }}>
            <Confetti />
            <div className="victory-stars">
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ color: i < stars ? 'var(--gold)' : 'var(--border-strong)' }}>★</span>
              ))}
            </div>
            <h2>Puzzle Complete!</h2>
            <p className="sub" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {cap(mode)} Difficulty
            </p>
            <div className="stat-strip">
              <div>
                <div className="k">Time</div>
                <div className="v num">{formatTime(solvedAt)}</div>
              </div>
              <div>
                <div className="k">Mistakes</div>
                <div className="v num">{mistakes}</div>
              </div>
              <div>
                <div className="k">Hints</div>
                <div className="v num">{hintsUsed}</div>
              </div>
            </div>
            <div className="reward-row">
              <span className="coins">
                <span className="coin-disc">$</span> +{adClaimed ? applyCoinMultiplier(coinBreakdown.total, 2) : coinBreakdown.total} Coins
              </span>
              <span className="xp num">+{xpGain} XP</span>
            </div>
            <div className="bar" style={{ marginBottom: 16 }}>
              <i style={{ width: `${xpBarWidth(profile.xp)}%` }} />
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {!isDaily && (
                <button className="btn primary" onClick={nextLevel}>
                  Next Level <Icon name="play" fill size={14} />
                </button>
              )}
              <button className="btn secondary" onClick={() => setSeedBump((n) => n + 1)}>
                <Icon name="retry" size={16} /> Replay
              </button>
              {!adClaimed && (
                <button className="btn gold" onClick={() => setAdKind('double_coins')}>
                  <Icon name="play" fill size={14} /> Watch Ad to Double Coins
                </button>
              )}
              <button className="btn ghost" onClick={() => router.push('/')}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewarded ad sheet (double coins or earn a hint) */}
      {adKind && (
        <div className="overlay sheet-overlay" onClick={() => setAdKind(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grip" />
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <span className="lead" style={{ margin: '0 auto', display: 'inline-flex', width: 56, height: 56, borderRadius: 'var(--r-md)', color: 'var(--gold)' }}>
                {adKind === 'hint' ? <Icon name="bulb" size={26} /> : <span className="coin-disc" style={{ width: 34, height: 34, fontSize: '1rem' }}>$</span>}
              </span>
            </div>
            <h2>{adKind === 'hint' ? 'Out of Hints' : 'Double Your Gold'}</h2>
            <p className="sub">
              {adKind === 'hint'
                ? 'Watch a short video to earn a hint token.'
                : `Watch a short video to earn an extra +${coinBreakdown.total} coins for your solve.`}
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                className="btn primary"
                onClick={async () => {
                  const kind = adKind;
                  const ok = await ads.showRewarded(kind === 'hint' ? 'extra_hint' : 'double_coins');
                  setAdKind(null);
                  if (!ok) return;
                  track('ad_watched', { placement: kind });
                  if (kind === 'double_coins') {
                    update((p) => void (p.coins += coinBreakdown.total));
                    track('reward_claimed', { source: 'double_coins', amount: coinBreakdown.total });
                    setAdClaimed(true);
                  } else {
                    update((p) => void (p.hints += 1));
                    revealHint(); // immediately spend the earned hint
                  }
                }}
              >
                <Icon name="play" fill size={14} /> Watch Ad
              </button>
              <button className="btn ghost" onClick={() => setAdKind(null)}>
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.c < b.c + b.w && a.c + a.w > b.c && a.r < b.r + b.h && a.r + a.h > b.r;
}
function cap(s: string): string {
  return s[0]!.toUpperCase() + s.slice(1);
}
function boardCoverageRatio(placed: Rect[], rows: number, cols: number): number {
  const covered = placed.reduce((acc, r) => acc + r.h * r.w, 0);
  return Math.max(0, 1 - covered / (rows * cols));
}
function dayGap(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000);
}
function xpBarWidth(xp: number): number {
  // Visual only: progress within current level.
  const into = xp % 1000;
  return Math.min(100, Math.round((into / 1000) * 100));
}
